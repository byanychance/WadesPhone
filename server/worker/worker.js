/**
 * WPhone visitor API — Cloudflare Worker (single file, no build step).
 *
 *   Browser ──HTTPS──▶ this Worker ──(secret key)──▶ Supabase (PostgREST RPC only)
 *
 * Secrets (Cloudflare dashboard → Worker → Settings → Variables and Secrets, type "Secret"):
 *   SUPABASE_URL          https://<project-ref>.supabase.co
 *   SUPABASE_SECRET_KEY   Supabase secret key (sb_secret_…) or legacy service_role key
 *   SESSION_PEPPER        long random string; HMAC key for session tokens and (day-keyed) IPs
 * Variable (type "Text", not secret):
 *   ALLOWED_ORIGINS       comma-separated, e.g. https://<github-id>.github.io,http://localhost:8765
 * Optional binding:
 *   RATE_LIMITER          Workers Rate Limiting binding (per-IP request limit); skipped if absent
 *
 * Endpoints (JSON):
 *   POST   /v1/session                 → 201 { token, handle }       new anonymous visitor
 *   GET    /v1/posts?before=&beforeId=&limit=  → { items, next }      visitor timeline
 *   GET    /v1/replies?root=<id>       → { items }                   visitor replies in a thread
 *   POST   /v1/posts                   → 201 { item } / 200 { item, duplicate: true }
 *   DELETE /v1/posts/<uuid>            → 204 (own post only; content is erased)
 *   DELETE /v1/session                 → { deleted }                 erase all own posts + the session
 *   GET    /v1/health                  → { ok, db }
 * Visitor auth: "Authorization: Bearer <session token>" — this is the visitor's own token,
 * NOT a service key. The service key never leaves this Worker.
 *
 * Never log request headers, tokens, keys, IPs, nicknames or bodies. Logs carry fixed codes only.
 * The raw client IP is used only in memory (HMAC with the UTC day) and is never stored or logged.
 */

// World-building data (site: data/twitter.js): number of shown replies per static post.
// Static ids: p01…p24 and pNN-r1…pNN-rK. Update this when the static timeline changes.
const STATIC_REPLIES = {
  p01: 4, p02: 2, p03: 1, p04: 3, p05: 2, p06: 3, p07: 3, p08: 2, p09: 2, p10: 3, p11: 2, p12: 3,
  p13: 3, p14: 3, p15: 4, p16: 3, p17: 2, p18: 5, p19: 8, p20: 2, p21: 3, p22: 3, p23: 3, p24: 3,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STATIC_POST = /^p\d\d$/;
const STATIC_REPLY = /^(p\d\d)-r(\d{1,2})$/;
const TOKEN = /^wps_[A-Za-z0-9_-]{43}$/;
const POST_FIELDS = new Set(['nickname', 'body', 'rootId', 'parentId', 'clientKey']);
const MAX_BODY_BYTES = 8192;

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
      checkConfig(env);
      // CORS is not authentication; this only stops other sites' pages from writing via a visitor's browser.
      if (req.method !== 'GET' && req.headers.get('Origin') && !cors) throw new HttpError(403, 'origin_not_allowed');
      if (env.RATE_LIMITER) {
        const { success } = await env.RATE_LIMITER.limit({ key: clientIp(req) });
        if (!success) throw new HttpError(429, 'rate_limited');
      }
      return withHeaders(await route(req, env), cors);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error('unhandled_error', e && e.name); // no message/stack: may contain data
      const err = e instanceof HttpError ? e : new HttpError(500, 'server_error');
      return withHeaders(json({ error: err.code }, err.status), cors);
    }
  },
};

async function route(req, env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '');
  const m = req.method;
  if (path === '/v1/session' && m === 'POST') return createSession(req, env);
  if (path === '/v1/session' && m === 'DELETE') return deleteMe(req, env);
  if (path === '/v1/posts' && m === 'GET') return listPosts(req, env, url);
  if (path === '/v1/posts' && m === 'POST') return createPost(req, env);
  if (path === '/v1/replies' && m === 'GET') return listReplies(req, env, url);
  if (path === '/v1/health' && m === 'GET') return health(env);
  const d = path.match(/^\/v1\/posts\/([^/]+)$/);
  if (d && m === 'DELETE') return deletePost(req, env, d[1]);
  throw new HttpError(404, 'not_found');
}

/* ───────── handlers ───────── */

async function createSession(req, env) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = 'wps_' + b64url(bytes);
  const rows = await rpc(env, 'wp_create_session', {
    p_token_hash: await hmac(env, 'session:' + token),
    p_ip_hash: await ipHash(req, env),
  });
  const handle = rows && rows[0] && rows[0].handle;
  if (!handle) throw new HttpError(502, 'upstream_error');
  return json({ token, handle }, 201);
}

async function listPosts(req, env, url) {
  const before = url.searchParams.get('before');
  const beforeId = url.searchParams.get('beforeId');
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  if (before && isNaN(Date.parse(before))) throw new HttpError(400, 'invalid_cursor');
  if (beforeId && !UUID.test(beforeId)) throw new HttpError(400, 'invalid_cursor');
  const rows = await rpc(env, 'wp_list_posts', {
    p_token_hash: await optionalTokenHash(req, env),
    p_before: before || null, p_before_id: beforeId || null, p_limit: limit,
  });
  const items = (rows || []).map((r) => r.deleted
    ? { id: r.id, createdAt: r.created_at, replyCount: r.reply_count, deleted: true }
    : { id: r.id, nickname: r.nickname, handle: r.handle, body: r.body,
        createdAt: r.created_at, replyCount: r.reply_count, mine: !!r.mine });
  const last = items[items.length - 1];
  return json({ items, next: items.length === limit && last ? { before: last.createdAt, beforeId: last.id } : null });
}

async function listReplies(req, env, url) {
  const root = url.searchParams.get('root') || '';
  if (!isStaticPost(root) && !UUID.test(root)) throw new HttpError(400, 'invalid_root');
  const rows = await rpc(env, 'wp_list_replies', { p_token_hash: await optionalTokenHash(req, env), p_root_id: root });
  const items = (rows || []).map((r) => r.deleted
    ? { id: r.id, rootId: r.root_id, parentId: r.parent_id, createdAt: r.created_at, deleted: true }
    : { id: r.id, rootId: r.root_id, parentId: r.parent_id, nickname: r.nickname, handle: r.handle,
        body: r.body, createdAt: r.created_at, mine: !!r.mine });
  return json({ items });
}

async function createPost(req, env) {
  const tokenHash = await requiredTokenHash(req, env);
  const input = await readJson(req);
  for (const k of Object.keys(input)) if (!POST_FIELDS.has(k)) throw new HttpError(400, 'unknown_field');

  const nickname = cleanText(input.nickname, false);
  const body = cleanText(input.body, true);
  if (len(nickname) < 1 || len(nickname) > 20) throw new HttpError(400, 'invalid_nickname');
  if (len(body) < 1 || len(body) > 500) throw new HttpError(400, 'invalid_body');
  if (typeof input.clientKey !== 'string' || !UUID.test(input.clientKey)) throw new HttpError(400, 'invalid_client_key');

  const rootId = input.rootId == null ? null : input.rootId;
  const parentId = input.parentId == null ? null : input.parentId;
  validateThread(rootId, parentId);

  const rows = await rpc(env, 'wp_create_post', {
    p_token_hash: tokenHash,
    p_ip_hash: await ipHash(req, env),
    p_nickname: nickname, p_body: body,
    p_root_id: rootId, p_parent_id: parentId, p_client_key: input.clientKey,
  });
  const r = rows && rows[0];
  if (!r) throw new HttpError(502, 'upstream_error');
  const item = { id: r.id, rootId: r.root_id, parentId: r.parent_id, nickname: r.nickname, handle: r.handle,
                 body: r.body, createdAt: r.created_at, mine: true, replyCount: 0 };
  return r.duplicate ? json({ item, duplicate: true }, 200) : json({ item }, 201);
}

async function deletePost(req, env, id) {
  const tokenHash = await requiredTokenHash(req, env);
  if (isStaticPost(id) || STATIC_REPLY.test(id)) throw new HttpError(403, 'forbidden'); // world-building posts
  if (!UUID.test(id)) throw new HttpError(404, 'not_found');
  const rows = await rpc(env, 'wp_delete_post', { p_token_hash: tokenHash, p_id: id });
  const result = rows && rows[0] && rows[0].result;
  if (result === 'ok') return new Response(null, { status: 204 });
  if (result === 'forbidden') throw new HttpError(403, 'forbidden');
  throw new HttpError(404, 'not_found');
}

async function deleteMe(req, env) {
  const rows = await rpc(env, 'wp_delete_me', { p_token_hash: await requiredTokenHash(req, env) });
  return json({ deleted: (rows && rows[0] && rows[0].deleted) || 0 });
}

async function health(env) {
  try {
    await rpc(env, 'wp_list_posts', { p_token_hash: null, p_before: null, p_before_id: null, p_limit: 1 });
    return json({ ok: true, db: true });
  } catch (e) {
    return json({ ok: false, db: false }, 503);
  }
}

/* ───────── validation ───────── */

function isStaticPost(id) {
  return typeof id === 'string' && STATIC_POST.test(id) && Object.prototype.hasOwnProperty.call(STATIC_REPLIES, id);
}

// Top-level post: both null. Reply: rootId = thread's top post, parentId = what is answered.
function validateThread(rootId, parentId) {
  if (rootId === null && parentId === null) return;
  if (typeof rootId !== 'string' || typeof parentId !== 'string') throw new HttpError(400, 'invalid_parent');
  if (isStaticPost(rootId)) {
    if (parentId === rootId || UUID.test(parentId)) return; // uuid parent: DB checks it belongs to this thread
    const m = parentId.match(STATIC_REPLY);
    if (m && m[1] === rootId && +m[2] >= 1 && +m[2] <= STATIC_REPLIES[rootId] && String(+m[2]) === m[2]) return;
    throw new HttpError(400, 'invalid_parent');
  }
  if (UUID.test(rootId) && UUID.test(parentId)) return; // DB checks existence and thread membership
  throw new HttpError(400, 'invalid_parent');
}

// Plain text only: NFC, \n line breaks, no control/bidi-override characters.
function cleanText(s, multiline) {
  if (typeof s !== 'string') throw new HttpError(400, multiline ? 'invalid_body' : 'invalid_nickname');
  s = s.normalize('NFC').replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F‎‏‪-‮⁦-⁩]/g, (c) => (c === '\t' && multiline ? ' ' : ''));
  if (!multiline) s = s.replace(/\s+/g, ' ');
  return s.trim();
}
const len = (s) => Array.from(s).length; // code points, same as PostgreSQL char_length

async function readJson(req) {
  if (!(req.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'json_required');
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'too_large');
  let v;
  try { v = JSON.parse(text); } catch (e) { throw new HttpError(400, 'invalid_json'); }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, 'invalid_json');
  return v;
}

/* ───────── auth & crypto ───────── */

function bearer(req) {
  const h = req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer (\S+)$/);
  return m && TOKEN.test(m[1]) ? m[1] : null;
}
async function optionalTokenHash(req, env) {
  const t = bearer(req);
  return t ? hmac(env, 'session:' + t) : null;
}
async function requiredTokenHash(req, env) {
  const t = bearer(req);
  if (!t) throw new HttpError(401, 'session_required');
  return hmac(env, 'session:' + t);
}
async function hmac(env, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SESSION_PEPPER), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
}
function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
// Spam limits only. Keyed by UTC day so the same visitor gets a different hash every day.
function ipHash(req, env) {
  return hmac(env, 'ip:' + new Date().toISOString().slice(0, 10) + ':' + clientIp(req));
}
function clientIp(req) {
  return req.headers.get('CF-Connecting-IP') || 'unknown';
}

/* ───────── Supabase (fixed RPC names only — no generic query passthrough) ───────── */

const DB_ERRORS = {
  WP_SESSION: [401, 'session_invalid'],
  WP_RATE: [429, 'rate_limited'],
  WP_TOO_FAST: [429, 'too_fast'],
  WP_PARENT: [400, 'invalid_parent'],
  WP_INPUT: [400, 'invalid_input'],
};
async function rpc(env, fn, args) {
  const res = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { /* ignore */ }
  if (!res.ok) {
    const known = data && typeof data.message === 'string' && DB_ERRORS[data.message];
    if (known) throw new HttpError(known[0], known[1]);
    if (data && data.code === '23514') throw new HttpError(400, 'invalid_input'); // check constraint
    console.error('db_error', fn, res.status, data && typeof data.code === 'string' ? data.code : '');
    throw new HttpError(502, 'upstream_error');
  }
  return data;
}

function checkConfig(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY || !env.SESSION_PEPPER || env.SESSION_PEPPER.length < 32) {
    console.error('config_missing'); // names only, never values
    throw new HttpError(500, 'server_misconfigured');
  }
}

/* ───────── responses & CORS ───────── */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
function corsHeaders(req, env) {
  const origin = req.headers.get('Origin');
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}
function withHeaders(res, cors) {
  const h = new Headers(res.headers);
  h.set('Cache-Control', 'no-store');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Vary', 'Origin');
  if (cors) for (const [k, v] of Object.entries(cors)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
}
