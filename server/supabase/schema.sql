-- WPhone visitor posts — Supabase (PostgreSQL) schema
--
-- Run in Supabase: SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run. It also migrates a database made with the earlier version of this file
-- (drops the ip_hash columns, wipes the content of already-deleted posts, changes the
-- session foreign key from CASCADE to RESTRICT).
--
-- Design
--   * Only the Cloudflare Worker talks to the database (with the server-side secret key).
--     Browsers never connect here directly.
--   * RLS is ON with no policies, and table/function privileges are revoked from the
--     public roles (anon, authenticated) → the public API keys can neither read nor write.
--   * The secret key (service_role) bypasses RLS, so every rule that matters
--     (session ownership, lengths, parents, rate limits, idempotency) is enforced
--     inside the functions below and again in the Worker.
--   * World-building posts (p01–p24, p01-r1 …) stay in the site's data/twitter.js.
--     Only visitor posts live here. Visitor post ids are UUIDs.
--
-- Personal data kept to a minimum
--   * Posts store the public nickname and body, plus the author's session id (needed so the
--     author can delete them). No IP, no IP hash.
--   * The session token itself is never stored, only its HMAC.
--   * IP hashes exist only in wp_rate_events (spam limits), are re-keyed every UTC day by the
--     Worker, and are deleted after 1 hour (inline on every write + pg_cron every 10 min).
--   * Author deletion (one post, or "delete all mine") removes nickname, body, session link
--     and idempotency key from the row. Only a tombstone (id, thread links, times) stays,
--     and only while other replies still hang under it.
--
-- Moderation (operator; Supabase dashboard)
--   * Hide (reversible, content kept): Table Editor → wp_posts → set `hidden` = true.
--   * Erase on request (content removed, like an author deletion):
--       SQL Editor → select public.wp_admin_erase('<post uuid>');
--   * Do not delete wp_sessions rows by hand; the RESTRICT key blocks it while posts exist.

-- ───────────────────────── tables ─────────────────────────

create table if not exists public.wp_sessions (
  id          uuid primary key default gen_random_uuid(),
  -- HMAC-SHA256 of the visitor's session token (the token itself is never stored)
  token_hash  text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  -- Public visitor handle. Prefix "v_" never appears in the world-building handles.
  handle      text not null unique check (handle ~ '^v_[a-z0-9]{8}$'),
  created_at  timestamptz not null default now()
);

create table if not exists public.wp_posts (
  id          uuid primary key default gen_random_uuid(),
  -- Author session. NULL only on tombstones (author link removed on deletion).
  session_id  uuid,
  -- Top-level post: root_id and parent_id are both NULL.
  -- Reply:          root_id  = the thread's top post (static 'p01'…'p24' or a visitor post uuid)
  --                 parent_id = the post/reply being answered (static 'p19', 'p19-r7' or a uuid)
  root_id     text,
  parent_id   text,
  nickname    text,                           -- NULL only on tombstones
  body        text,                           -- NULL only on tombstones
  client_key  uuid,                           -- idempotency key per draft; NULL on tombstones
  hidden      boolean not null default false, -- moderator switch (content kept)
  deleted_at  timestamptz,                    -- set when the content was erased (tombstone)
  created_at  timestamptz not null default now()
);

-- Short-lived spam-limit data. Nothing else references it; rows older than 1 hour are deleted.
create table if not exists public.wp_rate_events (
  id          uuid primary key default gen_random_uuid(),  -- no sequence → no extra grant
  bucket      text not null check (bucket in ('session', 'post')),
  -- HMAC of (UTC day, client IP). Different every day, so it can't follow a visitor over days.
  ip_hash     text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── migration from the first version ─────────────────────────

alter table public.wp_sessions drop column if exists ip_hash;      -- also drops wp_sessions_ip
alter table public.wp_posts    drop column if exists ip_hash;      -- also drops wp_posts_ip
alter table public.wp_posts
  alter column session_id drop not null,
  alter column nickname   drop not null,
  alter column body       drop not null,
  alter column client_key drop not null;

-- A session row must never take posts with it (old key was ON DELETE CASCADE).
alter table public.wp_posts drop constraint if exists wp_posts_session_id_fkey;
alter table public.wp_posts drop constraint if exists wp_posts_session_fk;
alter table public.wp_posts add constraint wp_posts_session_fk
  foreign key (session_id) references public.wp_sessions(id) on delete restrict;

-- Posts deleted under the old version still hold their text: erase it now.
update public.wp_posts
   set session_id = null, nickname = null, body = null, client_key = null
 where deleted_at is not null
   and (session_id is not null or nickname is not null or body is not null or client_key is not null);

-- ───────────────────────── constraints ─────────────────────────

alter table public.wp_posts drop constraint if exists wp_posts_nickname_len;
alter table public.wp_posts drop constraint if exists wp_posts_body_len;
alter table public.wp_posts drop constraint if exists wp_posts_thread;
alter table public.wp_posts drop constraint if exists wp_posts_root_fmt;
alter table public.wp_posts drop constraint if exists wp_posts_parent_fmt;
alter table public.wp_posts drop constraint if exists wp_posts_idem;
alter table public.wp_posts drop constraint if exists wp_posts_tombstone;
alter table public.wp_posts
  add constraint wp_posts_nickname_len check (nickname is null or (char_length(nickname) between 1 and 20 and nickname ~ '\S' and nickname !~ '[\r\n\t]')),
  add constraint wp_posts_body_len     check (body is null or (char_length(body) between 1 and 500 and body ~ '\S')),
  -- Live row: everything present. Tombstone: no content, no author link, no key.
  add constraint wp_posts_tombstone    check (
    (deleted_at is null and session_id is not null and nickname is not null and body is not null and client_key is not null)
    or (deleted_at is not null and session_id is null and nickname is null and body is null and client_key is null)),
  add constraint wp_posts_thread       check ((root_id is null) = (parent_id is null)),
  add constraint wp_posts_root_fmt     check (root_id is null or root_id ~ '^(p(0[1-9]|1[0-9]|2[0-4])|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'),
  add constraint wp_posts_parent_fmt   check (parent_id is null or parent_id ~ '^(p(0[1-9]|1[0-9]|2[0-4])(-r[1-9][0-9]?)?|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'),
  add constraint wp_posts_idem         unique (session_id, client_key);

create index if not exists wp_posts_timeline on public.wp_posts (created_at desc, id desc) where root_id is null;
create index if not exists wp_posts_thread   on public.wp_posts (root_id, created_at);
create index if not exists wp_posts_parent   on public.wp_posts (parent_id);
create index if not exists wp_posts_session  on public.wp_posts (session_id, created_at desc);
create index if not exists wp_rate_lookup    on public.wp_rate_events (bucket, ip_hash, created_at);
create index if not exists wp_rate_age       on public.wp_rate_events (created_at);

-- ───────────────────────── lock down ─────────────────────────

alter table public.wp_sessions    enable row level security;
alter table public.wp_posts       enable row level security;
alter table public.wp_rate_events enable row level security;
-- No policies on purpose: anon/authenticated get nothing.
revoke all on public.wp_sessions    from anon, authenticated;
revoke all on public.wp_posts       from anon, authenticated;
revoke all on public.wp_rate_events from anon, authenticated;
-- The Worker's key (service_role) needs these explicitly; without them the functions
-- fail with 42501 (permission denied) on some projects.
grant usage on schema public to service_role;
grant select, insert, update on table public.wp_sessions, public.wp_posts to service_role;
-- delete: author deletion and cleanup remove rows; rate events are insert/count/delete only.
grant delete on table public.wp_sessions, public.wp_posts to service_role;
grant select, insert, delete on table public.wp_rate_events to service_role;

-- ───────────────────────── functions (called only by the Worker) ─────────────────────────
-- Errors are raised with fixed codes in the message (WP_SESSION, WP_RATE, WP_TOO_FAST,
-- WP_PARENT, WP_INPUT); the Worker maps them to HTTP responses and never forwards raw DB errors.
-- Inputs are checked before any insert so constraint errors (whose DETAIL would echo the row
-- into the Postgres log) are not reached in normal use.

-- Remove tombstones that nothing hangs under any more (repeats until stable).
create or replace function public.wp_prune_tombstones()
returns int
language plpgsql
set search_path = public
as $$
declare
  n int;
  total int := 0;
begin
  loop
    delete from wp_posts t
     where t.deleted_at is not null
       and not exists (select 1 from wp_posts c
                        where c.parent_id = t.id::text or (t.root_id is null and c.root_id = t.id::text));
    get diagnostics n = row_count;
    exit when n = 0;
    total := total + n;
  end loop;
  return total;
end;
$$;

-- Turn rows into tombstones (content and author link removed), then prune.
-- Other people's replies are never touched.
create or replace function public.wp_erase_posts(p_ids uuid[])
returns int
language plpgsql
set search_path = public
as $$
declare
  n int;
begin
  update wp_posts
     set deleted_at = coalesce(deleted_at, now()),
         session_id = null, nickname = null, body = null, client_key = null
   where id = any(p_ids);
  get diagnostics n = row_count;
  perform wp_prune_tombstones();
  return n;
end;
$$;

-- Expired data. Called by pg_cron (below) and also inline by the write functions.
create or replace function public.wp_cleanup()
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from wp_rate_events where created_at < now() - interval '1 hour';
  perform wp_prune_tombstones();
  -- Sessions with no posts left (author deleted them all) are no longer needed.
  -- Sessions that still own posts are kept: they carry the author's right to delete.
  delete from wp_sessions s
   where s.created_at < now() - interval '1 hour'
     and not exists (select 1 from wp_posts w where w.session_id = s.id);
end;
$$;

-- New anonymous visitor session. Limit: 10 new sessions per IP per hour.
create or replace function public.wp_create_session(p_token_hash text, p_ip_hash text)
returns table (handle text)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_handle text;
  i int;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'WP_INPUT';
  end if;
  perform pg_advisory_xact_lock(hashtext('wp_session_ip:' || p_ip_hash));
  delete from wp_rate_events where created_at < now() - interval '1 hour';
  if (select count(*) from wp_rate_events e where e.bucket = 'session' and e.ip_hash = p_ip_hash) >= 10 then
    raise exception 'WP_RATE';
  end if;
  for i in 1..8 loop
    v_handle := 'v_' || substr(md5(gen_random_uuid()::text), 1, 8);
    begin
      insert into wp_sessions (token_hash, handle) values (p_token_hash, v_handle);
      insert into wp_rate_events (bucket, ip_hash) values ('session', p_ip_hash);
      return query select v_handle;
      return;
    exception when unique_violation then
      if exists (select 1 from wp_sessions s where s.token_hash = p_token_hash) then
        raise exception 'WP_INPUT';
      end if;
      -- handle collision: try another
    end;
  end loop;
  raise exception 'WP_RATE';
end;
$$;

-- Create a post or reply as the session's owner.
-- Rate limits: 1 post per 15 s and 30 per hour per session; 40 per hour per IP.
-- Re-sending the same client_key returns the already-saved post (duplicate = true).
create or replace function public.wp_create_post(
  p_token_hash text, p_ip_hash text, p_nickname text, p_body text,
  p_root_id text, p_parent_id text, p_client_key uuid)
returns table (id uuid, root_id text, parent_id text, nickname text, handle text, body text,
               created_at timestamptz, duplicate boolean)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_sid uuid;
  v_handle text;
  v_row wp_posts;
  v_parent wp_posts;
  v_root wp_posts;
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' or p_client_key is null then
    raise exception 'WP_INPUT';
  end if;
  -- session (row lock serialises concurrent posts from the same visitor)
  select s.id, s.handle into v_sid, v_handle from wp_sessions s where s.token_hash = p_token_hash for update;
  if v_sid is null then raise exception 'WP_SESSION'; end if;

  -- idempotent retry
  select * into v_row from wp_posts w where w.session_id = v_sid and w.client_key = p_client_key;
  if found then
    return query select v_row.id, v_row.root_id, v_row.parent_id, v_row.nickname, v_handle, v_row.body, v_row.created_at, true;
    return;
  end if;

  -- input (also enforced by table constraints)
  if p_nickname is null or p_body is null
     or char_length(p_nickname) not between 1 and 20 or p_nickname !~ '\S' or p_nickname ~ '[\r\n\t]'
     or char_length(p_body) not between 1 and 500 or p_body !~ '\S'
     or (p_root_id is null) <> (p_parent_id is null) then
    raise exception 'WP_INPUT';
  end if;

  -- thread / parent checks (static ids are validated against the site data by the Worker)
  if p_root_id is not null then
    if p_root_id ~ v_uuid then
      select * into v_root from wp_posts w where w.id = p_root_id::uuid;
      if not found or v_root.root_id is not null or v_root.deleted_at is not null or v_root.hidden then
        raise exception 'WP_PARENT';
      end if;
      if p_parent_id ~ v_uuid then
        if p_parent_id <> p_root_id then
          select * into v_parent from wp_posts w where w.id = p_parent_id::uuid;
          if not found or v_parent.root_id is distinct from p_root_id or v_parent.deleted_at is not null or v_parent.hidden then
            raise exception 'WP_PARENT';
          end if;
        end if;
      else
        raise exception 'WP_PARENT';  -- a static id can't be inside a visitor thread
      end if;
    elsif p_root_id ~ '^p(0[1-9]|1[0-9]|2[0-4])$' then
      if p_parent_id ~ v_uuid then
        select * into v_parent from wp_posts w where w.id = p_parent_id::uuid;
        if not found or v_parent.root_id is distinct from p_root_id or v_parent.deleted_at is not null or v_parent.hidden then
          raise exception 'WP_PARENT';
        end if;
      elsif not (p_parent_id = p_root_id or p_parent_id ~ ('^' || p_root_id || '-r[1-9][0-9]?$')) then
        raise exception 'WP_PARENT';
      end if;
    else
      raise exception 'WP_PARENT';
    end if;
  end if;

  -- rate limits
  delete from wp_rate_events where created_at < now() - interval '1 hour';
  if exists (select 1 from wp_posts w where w.session_id = v_sid and w.created_at > now() - interval '15 seconds') then
    raise exception 'WP_TOO_FAST';
  end if;
  if (select count(*) from wp_posts w where w.session_id = v_sid and w.created_at > now() - interval '1 hour') >= 30
     or (select count(*) from wp_rate_events e where e.bucket = 'post' and e.ip_hash = p_ip_hash) >= 40 then
    raise exception 'WP_RATE';
  end if;

  insert into wp_posts (session_id, root_id, parent_id, nickname, body, client_key)
  values (v_sid, p_root_id, p_parent_id, p_nickname, p_body, p_client_key)
  returning * into v_row;
  insert into wp_rate_events (bucket, ip_hash) values ('post', p_ip_hash);
  return query select v_row.id, v_row.root_id, v_row.parent_id, v_row.nickname, v_handle, v_row.body, v_row.created_at, false;
end;
$$;

-- Visitor timeline (top-level posts), newest first, keyset pagination.
-- A deleted/hidden top post comes back as a content-less placeholder only while visible
-- replies hang under it, so those replies (and their authors' delete buttons) stay reachable.
-- `mine` tells the caller which posts it may delete; no session ids are returned.
drop function if exists public.wp_list_posts(text, timestamptz, uuid, int);
create function public.wp_list_posts(
  p_token_hash text, p_before timestamptz, p_before_id uuid, p_limit int)
returns table (id uuid, nickname text, handle text, body text, created_at timestamptz,
               reply_count int, mine boolean, deleted boolean)
language sql
stable
set search_path = public
as $$
  with me as (select s.id from wp_sessions s where s.token_hash = p_token_hash),
  t as (
    select w.*, (w.deleted_at is null and not w.hidden) as visible,
           (select count(*)::int from wp_posts r
             where r.root_id = w.id::text and r.deleted_at is null and not r.hidden) as replies
      from wp_posts w
     where w.root_id is null
       and (p_before is null or (w.created_at, w.id) < (p_before, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
  )
  select t.id,
         case when t.visible then t.nickname end,
         case when t.visible then s.handle end,
         case when t.visible then t.body end,
         t.created_at, t.replies,
         t.visible and t.session_id = (select me.id from me),
         not t.visible
    from t left join wp_sessions s on s.id = t.session_id
   where t.visible or t.replies > 0
   order by t.created_at desc, t.id desc
   limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

-- All visitor replies in one thread (static or visitor root), oldest first.
-- Deleted/hidden replies come back as content-less placeholders only when something
-- visible still hangs under them, so threads never lose their links.
create or replace function public.wp_list_replies(p_token_hash text, p_root_id text)
returns table (id uuid, root_id text, parent_id text, nickname text, handle text, body text,
               created_at timestamptz, mine boolean, deleted boolean)
language sql
stable
set search_path = public
as $$
  with me as (select s.id from wp_sessions s where s.token_hash = p_token_hash),
  t as (
    select w.*, (w.deleted_at is null and not w.hidden) as visible
      from wp_posts w where w.root_id = p_root_id
  )
  select t.id, t.root_id, t.parent_id,
         case when t.visible then t.nickname end,
         case when t.visible then s.handle end,
         case when t.visible then t.body end,
         t.created_at,
         t.visible and t.session_id = (select me.id from me),
         not t.visible
    from t left join wp_sessions s on s.id = t.session_id
   where t.visible or exists (select 1 from t c where c.parent_id = t.id::text and c.visible)
   order by t.created_at, t.id
   limit 500;
$$;

-- Author deletes one own post (hidden ones included). Content is erased, not just flagged.
-- Result: 'ok' | 'forbidden' | 'not_found'.
create or replace function public.wp_delete_post(p_token_hash text, p_id uuid)
returns table (result text)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_sid uuid;
  v_owner uuid;
begin
  select s.id into v_sid from wp_sessions s where s.token_hash = p_token_hash;
  if v_sid is null then raise exception 'WP_SESSION'; end if;
  select w.session_id into v_owner from wp_posts w where w.id = p_id and w.deleted_at is null;
  if v_owner is null then return query select 'not_found'; return; end if;
  if v_owner <> v_sid then return query select 'forbidden'; return; end if;
  perform wp_erase_posts(array[p_id]);
  return query select 'ok';
end;
$$;

-- Author deletes every own post and the session itself (visitor id reset).
create or replace function public.wp_delete_me(p_token_hash text)
returns table (deleted int)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_sid uuid;
  v_ids uuid[];
begin
  select s.id into v_sid from wp_sessions s where s.token_hash = p_token_hash for update;
  if v_sid is null then raise exception 'WP_SESSION'; end if;
  select coalesce(array_agg(w.id), '{}') into v_ids from wp_posts w where w.session_id = v_sid;
  perform wp_erase_posts(v_ids);
  delete from wp_sessions where wp_sessions.id = v_sid;
  return query select coalesce(array_length(v_ids, 1), 0);
end;
$$;

-- Operator only (SQL Editor): erase a post on request, e.g. from someone who lost their
-- browser data or whose personal data appears in another visitor's post.
create or replace function public.wp_admin_erase(p_id uuid)
returns int
language sql
set search_path = public
as $$ select wp_erase_posts(array[p_id]); $$;

-- Only the server role may call the API functions; helpers and the operator function are not exposed.
revoke all on function public.wp_prune_tombstones() from public, anon, authenticated;
revoke all on function public.wp_erase_posts(uuid[]) from public, anon, authenticated;
revoke all on function public.wp_cleanup() from public, anon, authenticated, service_role;
revoke all on function public.wp_admin_erase(uuid) from public, anon, authenticated, service_role;
revoke all on function public.wp_create_session(text, text) from public, anon, authenticated;
revoke all on function public.wp_create_post(text, text, text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.wp_list_posts(text, timestamptz, uuid, int) from public, anon, authenticated;
revoke all on function public.wp_list_replies(text, text) from public, anon, authenticated;
revoke all on function public.wp_delete_post(text, uuid) from public, anon, authenticated;
revoke all on function public.wp_delete_me(text) from public, anon, authenticated;
grant execute on function public.wp_create_session(text, text) to service_role;
grant execute on function public.wp_create_post(text, text, text, text, text, text, uuid) to service_role;
grant execute on function public.wp_list_posts(text, timestamptz, uuid, int) to service_role;
grant execute on function public.wp_list_replies(text, text) to service_role;
grant execute on function public.wp_delete_post(text, uuid) to service_role;
grant execute on function public.wp_delete_me(text) to service_role;
-- The API functions run as service_role (SECURITY INVOKER) and call these helpers.
grant execute on function public.wp_prune_tombstones() to service_role;
grant execute on function public.wp_erase_posts(uuid[]) to service_role;

select public.wp_cleanup();

-- ───────────────────────── scheduled cleanup (pg_cron) ─────────────────────────
-- Runs wp_cleanup() every 10 minutes, even when nobody visits the site.
-- If this part fails, enable "Cron" under Database → Extensions (or Integrations → Cron)
-- and run only these lines again.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('wp-cleanup', '*/10 * * * *', 'select public.wp_cleanup()');
