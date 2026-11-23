/* Visitor posts API client (browser → Cloudflare Worker).
   Only the Worker's public URL is configured here (data/config.js → api).
   The browser never talks to Supabase and never holds a service key.
   The visitor session token stored below is this visitor's own credential: it only
   identifies them to the Worker (for deleting their own posts), nothing more. */
(function () {
  'use strict';
  const WP = window.WP;
  const base = String((WP.data.config || {}).api || '').trim().replace(/\/+$/, '');
  const SESSION = 'tw.session', NICK = 'tw.nick';

  class ApiError extends Error {
    constructor(status, code) { super(code); this.status = status; this.code = code; }
  }

  async function call(method, path, body) {
    const headers = {};
    const s = WP.store.get(SESSION, null);
    if (s && s.token) headers.Authorization = 'Bearer ' + s.token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), 15000);
    let res;
    try {
      res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', signal: ctl && ctl.signal });
    } catch (e) {
      throw new ApiError(0, 'network');
    } finally {
      if (timer) clearTimeout(timer);
    }
    let data = null;
    if (res.status !== 204) { try { data = await res.json(); } catch (e) { /* empty */ } }
    if (!res.ok) throw new ApiError(res.status, (data && data.error) || 'http_' + res.status);
    return data;
  }

  async function ensureSession() {
    const s = WP.store.get(SESSION, null);
    if (s && s.token) return s;
    const d = await call('POST', '/v1/session');
    const fresh = { token: d.token, handle: d.handle };
    WP.store.set(SESSION, fresh);
    return fresh;
  }

  const uuid = () => {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const x = Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('');
    return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
  };

  WP.visitor = {
    enabled: !!base,
    ApiError,
    uuid,
    get nickname() { return WP.store.get(NICK, '') || ''; },
    set nickname(v) { WP.store.set(NICK, v); },
    listPosts(next) {
      const q = new URLSearchParams({ limit: '20' });
      if (next) { q.set('before', next.before); q.set('beforeId', next.beforeId); }
      return call('GET', '/v1/posts?' + q);
    },
    listReplies(root) { return call('GET', '/v1/replies?root=' + encodeURIComponent(root)); },
    // payload: { nickname, body, rootId, parentId, clientKey }
    async create(payload) {
      await ensureSession();
      try {
        return await call('POST', '/v1/posts', payload);
      } catch (e) {
        if (e.status !== 401) throw e;
        WP.store.set(SESSION, null); // session no longer valid on the server → start a new one
        await ensureSession();
        return call('POST', '/v1/posts', payload);
      }
    },
    remove(id) { return call('DELETE', '/v1/posts/' + encodeURIComponent(id)); },
    get hasSession() { const s = WP.store.get(SESSION, null); return !!(s && s.token); },
    // Erase every post of this browser's visitor id, then forget the id and nickname here.
    // 401 = the server no longer knows this id (nothing left to erase); still reset locally.
    async removeAll() {
      let res = { deleted: 0 };
      try { res = await call('DELETE', '/v1/session'); } catch (e) { if (e.status !== 401) throw e; }
      WP.store.remove(SESSION);
      WP.store.remove(NICK);
      return res;
    },
  };
})();
