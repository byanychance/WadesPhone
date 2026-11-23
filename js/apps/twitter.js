/* Twitter — timeline, post detail with replies, image viewer, search, notifications,
   plus visitor posts/replies (shared through the Worker API, see js/visitor-api.js).

   Two kinds of items share one look:
   - World-building posts/replies from data/twitter.js (ids p01…, p01-r1…; fixed stats).
   - Visitor posts/replies from the API (uuid ids; `visitor: true`; no fake stats). */
(function () {
  'use strict';
  const WP = window.WP;
  const { h, $, $$, esc, icon } = WP;
  const V = WP.visitor || { enabled: false };
  const T = WP.data.twitter || { users: {}, posts: [] };
  const posts = (T.posts || []).slice().sort((a, b) => WP.parseDate(b.date) - WP.parseDate(a.date));
  // Replies carry only a like count; give them the same stats shape and a stable id
  posts.forEach((p) => (p.replies || []).forEach((r, i) => {
    r.id = r.id || p.id + '-r' + (i + 1);
    r.stats = r.stats || { likes: r.likes };
  }));
  const following = new Set(T.following || []);
  const user = (k) => (k && T.users[k]) || { name: k || '' };
  const likes = new Set(WP.store.get('tw.likes', []));

  // Every item that can be opened or answered, by id → { item, root }
  const index = new Map();
  posts.forEach((p) => {
    index.set(p.id, { item: p, root: p.id });
    (p.replies || []).forEach((r) => index.set(r.id, { item: r, root: p.id }));
  });
  const remember = (x) => { index.set(x.id, { item: x, root: x.rootId || x.id }); return x; };
  // After a deletion: drop the text from memory too, so no view or quote can show it again
  const forget = (it) => { it.mine = false; it.deleted = true; delete it.text; delete it.name; delete it.user; };
  const lookup = (id) => (index.get(id) || {}).item;

  // API item → display item
  const fromApi = (x) => remember(x.deleted
    ? { id: x.id, visitor: true, deleted: true, rootId: x.rootId || null, inReplyTo: x.parentId || null, createdAt: x.createdAt, replyCount: x.replyCount }
    : { id: x.id, visitor: true, user: x.handle, name: x.nickname, text: x.body, createdAt: x.createdAt,
        mine: !!x.mine, replyCount: x.replyCount, rootId: x.rootId || null, inReplyTo: x.parentId || null });

  const num = (n) => (typeof n === 'number' ? (n >= 10000 ? (n / 10000).toFixed(1).replace('.0', '') + '만' : n.toLocaleString('ko-KR')) : n || '');
  const ago = (s) => {
    const d = WP.parseDate(s), now = WP.today();
    const m = Math.floor((now - d) / 60000);
    if (m < 60) return Math.max(1, m) + '분';
    if (m < 1440) return Math.floor(m / 60) + '시간';
    if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}월 ${d.getDate()}일`;
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };
  // Visitor dates: the saved timeline's day (config.twitterDate, else phoneDate) + the real posting time in Korea time.
  // Sorting always uses the real createdAt; this is display only.
  const vDate = (iso) => {
    const k = new Date(Date.parse(iso) + 9 * 3600e3);
    const [y, mo, d] = String((WP.data.config || {}).twitterDate || (WP.data.config || {}).phoneDate || '').split('-').map(Number);
    return y ? new Date(y, mo - 1, d, k.getUTCHours(), k.getUTCMinutes()) : new Date(Date.parse(iso));
  };
  const vAgo = (iso) => {
    const m = Math.floor((Date.now() - Date.parse(iso)) / 60000);
    if (m < 1) return '방금';
    if (m < 60) return m + '분';
    if (m < 1440) return Math.floor(m / 60) + '시간';
    const d = vDate(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };
  const plain = (s) => esc(s).replace(/\n/g, '<br>'); // visitor text: escaped, line breaks kept, nothing else

  // No avatar image → the service's default profile picture (no generated avatars)
  const SILHOUETTE = (size) => `<svg viewBox="0 0 40 40" width="${size}" height="${size}"><circle cx="20" cy="15.5" r="7" fill="#8b98a5"/><path d="M6.5 36c1.6-7.4 7-11 13.5-11s11.9 3.6 13.5 11z" fill="#8b98a5"/></svg>`;
  const avatar = (k, size = 40) => {
    const u = user(k);
    return `<span class="tw-av ${u.avatar ? '' : 'default'}" style="width:${size}px;height:${size}px">${u.avatar ? WP.img(u.avatar, 'cover-img') : SILHOUETTE(size)}</span>`;
  };
  const badge = (k) => (user(k).verified ? `<svg class="tw-badge" viewBox="0 0 24 24" width="17" height="17"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" fill="#1d9bf0"/><path d="m10.54 16.2-3.74-3.74 1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36z" fill="#fff"/></svg>` : '');
  const linkify = (s) => WP.text(s).replace(/((?:[a-z0-9-]+\.)+(?:com|news|org)(?:\/[\w/]*)?)/gi, '<a class="tw-link" data-url="$1">$1</a>');
  const imgs = (list) => list && list.length ? `<div class="tw-media n${Math.min(list.length, 4)}">${list.slice(0, 4).map((s) => `<button class="tw-img" data-src="${esc(s)}">${WP.img(s, 'cover-img')}</button>`).join('')}</div>` : '';
  const nameOf = (p) => (p.visitor ? p.name : user(p.user).name);
  const bodyOf = (p) => (p.visitor ? plain(p.text) : linkify(p.text));
  // Visitor times carry their real createdAt so the ticker below can update them in place
  const whenOf = (p) => (p.visitor ? `<time data-vts="${esc(p.createdAt)}">${vAgo(p.createdAt)}</time>` : ago(p.date));
  const updateTimes = (root) => $$('time[data-vts]', root).forEach((t) => {
    const s = vAgo(t.dataset.vts);
    if (t.textContent !== s) t.textContent = s;
  });

  const actions = (p, big) => {
    const s = p.stats || {};
    const liked = likes.has(p.id);
    const sz = big ? 22 : 18;
    // World-building counts are fixed; visitor items show only real stored values (reply count).
    const replyN = p.visitor ? (p.replyCount || '') : num(s.replies);
    const reply = `<button class="tw-replybtn" data-reply="${p.id}" aria-label="답글">${icon('reply', sz)}${big ? '' : `<em>${replyN}</em>`}</button>`;
    return `<div class="tw-acts ${big ? 'big' : ''}">
      ${reply}
      <span>${icon('retweet', sz)}${big || p.visitor ? '' : `<em>${num(s.rts)}</em>`}</span>
      <button class="tw-like ${liked ? 'on' : ''}" data-like="${p.id}">${icon(liked ? 'heartFill' : 'heart', sz)}${big || p.visitor ? '' : `<em>${num(s.likes)}</em>`}</button>
      ${big ? '' : `<span>${icon('views', 18)}${p.visitor ? '' : `<em>${num(s.views)}</em>`}</span>`}
      <span class="tw-acts-r">${icon('bookmark', sz)}${icon('share', sz)}</span>
    </div>`;
  };
  const more = (p, size) => (p.visitor && p.mine
    ? `<button class="tw-more" data-del="${p.id}" aria-label="더 보기">${icon('more', size)}</button>`
    : `<i>${icon('more', size)}</i>`);

  const postHTML = (p, opt = {}) => {
    if (p.deleted) {
      // A deleted top post stays tappable so the replies under it can still be opened
      return `<article class="tw-post tw-gone ${opt.cls || ''}" ${opt.static ? `data-rid="${p.id}"` : `data-post="${p.id}"`}>
        <span class="tw-av tw-av-gone" style="width:40px;height:40px"></span>
        <div class="tw-pm"><div class="tw-gone-box">삭제된 게시물입니다.</div></div>
      </article>`;
    }
    return `<article class="tw-post ${opt.cls || ''}" ${opt.static ? `data-rid="${p.id}"` : `data-post="${p.id}"`}>
      ${avatar(p.user)}
      <div class="tw-pm">
        <div class="tw-ph"><b>${esc(nameOf(p))}</b>${p.visitor ? '' : badge(p.user)}<span>@${esc(p.user)} · ${whenOf(p)}</span>${more(p, 16)}</div>
        ${opt.replyTo ? `<div class="tw-replyto">@${esc(opt.replyTo)} 님에게 보내는 답글</div>` : ''}
        ${opt.replyToGone ? `<div class="tw-replyto">삭제된 게시물에 보내는 답글</div>` : ''}
        ${opt.quote ? (opt.quote.deleted ? `<div class="tw-quote">삭제된 게시물입니다.</div>` : `<div class="tw-quote"><b>${esc(nameOf(opt.quote))}</b> ${opt.quote.visitor ? plain(opt.quote.text) : WP.text(opt.quote.text)}</div>`) : ''}
        <div class="tw-text">${bodyOf(p)}</div>
        ${imgs(p.images)}
        ${opt.noActs ? '' : actions(p)}
      </div>
    </article>`;
  };

  // Replies in order, linked only by their explicit parent id (never by account name).
  // A thread line joins two neighbours only when the lower one answers the upper one;
  // when the parent is further up, a one-line quote of it is shown instead. No indentation.
  // A parent that was deleted shows as a "삭제된 게시물" placeholder so links never break.
  const repliesHTML = (post, rs) => {
    const byId = new Map(rs.map((r) => [r.id, r]));
    return rs.map((r, i) => {
      const parent = r.inReplyTo === post.id ? post : byId.get(r.inReplyTo);
      const up = i > 0 && rs[i - 1].id === r.inReplyTo;
      const down = i < rs.length - 1 && rs[i + 1].inReplyTo === r.id;
      const gone = !parent || parent.deleted;
      return postHTML(r, {
        static: true,
        replyTo: !gone && parent.user,
        replyToGone: gone && !r.deleted,
        quote: gone && !up ? { deleted: true } : parent && parent !== post && !up ? parent : null,
        cls: 'tw-reply' + (up ? ' ln-up' : '') + (down ? ' ln-down' : ''),
      });
    }).join('');
  };

  const ERRORS = {
    network: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
    too_fast: '조금 전에 게시했어요. 잠시 후 다시 시도해 주세요.',
    rate_limited: '잠시 후 다시 시도해 주세요.',
    invalid_parent: '삭제되었거나 답글을 달 수 없는 게시물이에요.',
    invalid_nickname: '닉네임은 1~20자로 입력해 주세요.',
    invalid_body: '내용은 1~500자로 입력해 주세요.',
  };
  const errText = (e) => ERRORS[e && e.code] || '게시하지 못했어요. 다시 시도해 주세요.';

  // Same normalisation as the server, so the counter and button match what will be accepted
  const cleanNick = (s) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
  const cleanBody = (s) => s.normalize('NFC').replace(/\r\n?/g, '\n').trim();
  const len = (s) => Array.from(s).length;

  WP.registerApp({
    id: 'twitter', name: 'Twitter',
    mount(win) {
      const nav = win.nav;
      win.style.setProperty('--accent', '#1d9bf0');
      const tabbar = h(`<nav class="tw-tabbar">
        <button data-tab="home" class="on">${icon('home', 26)}</button>
        <button data-tab="search">${icon('search', 26)}</button>
        <button data-tab="notif">${icon('bell', 26)}</button>
      </nav>`);
      win.appendChild(tabbar);

      /* ── Visitor timeline state (newest first, server order) ── */
      const vt = { items: [], next: null, loaded: false, loading: false, error: false, views: new Set() };
      async function loadVisitor(mode) { // mode: 'refresh' (first page) | 'more'
        if (!V.enabled || vt.loading) return;
        vt.loading = true; vt.error = false; vt.views.forEach((v) => v.status(mode));
        try {
          const res = await V.listPosts(mode === 'more' ? vt.next : null);
          const page = res.items.map(fromApi);
          if (mode === 'more') {
            const have = new Set(vt.items.map((x) => x.id));
            vt.items = vt.items.concat(page.filter((x) => !have.has(x.id)));
            vt.next = res.next;
          } else {
            // Replace everything newer than the oldest item on the fresh page; keep older pages
            const oldest = page.length ? Date.parse(page[page.length - 1].createdAt) : -Infinity;
            const older = res.next ? vt.items.filter((x) => Date.parse(x.createdAt) < oldest) : [];
            vt.items = page.concat(older);
            if (!vt.loaded || !older.length) vt.next = res.next;
          }
          vt.loaded = true;
        } catch (e) {
          vt.error = true;
        }
        vt.loading = false;
        vt.views.forEach((v) => v.render());
      }
      const addOwn = (item) => { vt.items = [item].concat(vt.items.filter((x) => x.id !== item.id)); vt.views.forEach((v) => v.render(true)); };
      const dropItem = (id) => { vt.items = vt.items.filter((x) => x.id !== id); vt.views.forEach((v) => v.render()); };

      function bindFeed(root) {
        root.addEventListener('click', (e) => {
          const lk = e.target.closest('[data-like]');
          if (lk) {
            const id = lk.dataset.like;
            likes.has(id) ? likes.delete(id) : likes.add(id);
            WP.store.set('tw.likes', [...likes]);
            const p = lookup(id);
            if (p) $$(`[data-like="${id}"]`, win).forEach((b) => (b.outerHTML = h(`<div>${actions(p, b.closest('.big') != null)}</div>`).querySelector(`[data-like]`).outerHTML));
            return;
          }
          const rp = e.target.closest('[data-reply]');
          if (rp) { const it = index.get(rp.dataset.reply); if (it) compose({ target: it.item, rootId: it.root }); return; }
          const del = e.target.closest('[data-del]');
          if (del) { removeOwn(del.dataset.del); return; }
          const im = e.target.closest('.tw-img');
          if (im) return WP.viewImage(im.dataset.src);
          const url = e.target.closest('.tw-link');
          if (url) return WP.os.openApp('safari', { url: url.dataset.url });
          const post = e.target.closest('[data-post]');
          if (post) { const p = lookup(post.dataset.post); if (p) nav.push(detail(p)); }
        });
      }

      /* Home timeline */
      function home() {
        const p = WP.page(nav, { cls: 'tw-page tw-home', left: `<span class="tw-me">${avatar(T.me, 32)}</span>`, titleHtml: `<span class="tw-logo">${icon('bird', 26)}</span>` });
        p.body.innerHTML = `
          <div class="tw-tabs"><button class="on" data-f="all">추천</button><button data-f="following">팔로우 중</button></div>
          <div class="tw-ptr"><span class="tw-spin"></span></div>
          <div class="tw-feed"><div class="tw-vfeed"></div><div class="tw-vstatus"></div><div class="tw-sfeed"></div></div>`;
        const sc = p.scroller, feed = $('.tw-feed', p), vfeed = $('.tw-vfeed', p), vstatus = $('.tw-vstatus', p), sfeed = $('.tw-sfeed', p);
        const ptr = $('.tw-ptr', p);
        let filter = 'all';
        const newPill = h(`<button class="tw-newpill" hidden>${icon('chevL', 14)}<span>새 게시물</span></button>`);
        p.appendChild(newPill);
        // Always shown, even before the server is connected (posting is then disabled in the sheet)
        let fab = null;
        {
          fab = h(`<button class="tw-fab" aria-label="게시하기"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M23 3c-6.62-.1-10.38 2.42-13.05 6.03C7.29 12.61 6 17.33 6 22h2c0-1.01.07-2.01.19-3H12c4.1 0 7.48-3.08 7.94-7.05C20.84 10.76 23 7.36 23 3zm-7 8h-1.5v2H16c.63-.43 1.2-.94 1.68-1.5H16V11zm-4.06 6H8.6c.39-1.44.94-2.82 1.61-4.12.69-1.21 1.47-2.35 2.31-3.37A10.2 10.2 0 0 1 20.9 5.07c-.21 3.07-2.41 5.76-5.46 6.47l-1.16.27-.27 1.34c-.4 2-1.81 3.6-3.69 3.85z" fill="currentColor"/><path d="M5 1v3H2v2h3v3h2V6h3V4H7V1z" fill="currentColor"/></svg></button>`);
          p.appendChild(fab);
          fab.addEventListener('click', () => compose({}));
        }

        // Keep whatever the reader is looking at in place when the list above it changes
        const anchored = (fn) => {
          if (sc.scrollTop < 4) return fn();
          const items = $$('[data-post]', feed);
          const top = sc.getBoundingClientRect().top;
          const a = items.find((el) => el.getBoundingClientRect().bottom > top + 60);
          const id = a && a.dataset.post, before = a ? a.getBoundingClientRect().top : 0;
          fn();
          const again = id && $(`[data-post="${CSS.escape(id)}"]`, feed);
          if (again) sc.scrollTop += again.getBoundingClientRect().top - before;
        };
        const statusHTML = () => {
          if (!V.enabled || filter !== 'all') return '';
          if (vt.loading) return `<div class="tw-row-status"><span class="tw-spin"></span></div>`;
          if (vt.error) return `<div class="tw-row-status"><span>게시물을 불러오지 못했어요.</span><button data-retry>다시 시도</button></div>`;
          if (vt.next) return `<button class="tw-row-more" data-more>게시물 더 보기</button>`;
          return '';
        };
        const view = {
          status(mode) { if (mode === 'more' || !vt.loaded) vstatus.innerHTML = statusHTML(); },
          render(own) {
            const firstIds = $$('[data-post]', vfeed).map((el) => el.dataset.post);
            anchored(() => {
              vfeed.innerHTML = filter === 'all' ? vt.items.map((x) => postHTML(x)).join('') : '';
              vstatus.innerHTML = statusHTML();
            });
            ptr.classList.remove('on');
            if (own) sc.scrollTo({ top: 0 });
            const fresh = vt.items.some((x) => !firstIds.includes(x.id)) && firstIds.length;
            if (fresh && sc.scrollTop > 200 && !own) newPill.hidden = false;
          },
        };
        vt.views.add(view);
        const draw = () => {
          sfeed.innerHTML = posts.filter((x) => filter === 'all' || following.has(x.user)).map((x) => postHTML(x)).join('');
          view.render();
          if (fab) fab.hidden = filter !== 'all';
        };
        draw();
        $('.tw-tabs', p).addEventListener('click', (e) => {
          const b = e.target.closest('button'); if (!b) return;
          $$('.tw-tabs button', p).forEach((x) => x.classList.toggle('on', x === b));
          filter = b.dataset.f;
          draw();
        });
        vstatus.addEventListener('click', (e) => {
          if (e.target.closest('[data-more]')) loadVisitor('more');
          if (e.target.closest('[data-retry]')) loadVisitor(vt.loaded ? 'more' : 'refresh');
        });
        newPill.addEventListener('click', () => { newPill.hidden = true; sc.scrollTo({ top: 0, behavior: 'smooth' }); });
        sc.addEventListener('scroll', () => { if (sc.scrollTop < 100) newPill.hidden = true; }, { passive: true });

        // Pull to refresh (touch)
        if (V.enabled) {
          let y0 = null, pulled = 0;
          sc.addEventListener('touchstart', (e) => { y0 = sc.scrollTop <= 0 && filter === 'all' ? e.touches[0].clientY : null; pulled = 0; }, { passive: true });
          sc.addEventListener('touchmove', (e) => {
            if (y0 == null) return;
            pulled = (e.touches[0].clientY - y0) / WP.scale;
            ptr.style.height = Math.max(0, Math.min(60, pulled * 0.5)) + 'px';
          }, { passive: true });
          sc.addEventListener('touchend', () => {
            if (y0 == null) return;
            y0 = null;
            ptr.style.height = '';
            if (pulled > 70) { ptr.classList.add('on'); loadVisitor('refresh'); }
          });
        }
        p.refresh = () => { if (filter === 'all' && V.enabled) { ptr.classList.add('on'); loadVisitor('refresh'); } };
        p._onShow = () => { if (vt.loaded) loadVisitor('refresh'); };
        bindFeed(feed);
        return p;
      }

      /* Post detail (world-building or visitor top-level post) */
      function detail(post) {
        const v = !!post.visitor;
        const u = { name: nameOf(post) }, d = v ? vDate(post.createdAt) : WP.parseDate(post.date), s = post.stats || {};
        const p = WP.page(nav, { cls: 'tw-page', back: '', title: '게시물' });
        p.dataset.root = post.id;
        p.body.innerHTML = post.deleted ? `
          <div class="tw-detail"><div class="tw-gone-box">삭제된 게시물입니다.</div></div>
          <div class="tw-replies"></div>
          <div class="tw-rstatus"></div>` : `
          <div class="tw-detail">
            <div class="tw-dh">${avatar(post.user, 42)}<div><b>${esc(u.name)}${v ? '' : badge(post.user)}</b><span>@${esc(post.user)}</span></div>${more(post, 18)}</div>
            <div class="tw-dtext">${bodyOf(post)}</div>
            ${imgs(post.images)}
            <div class="tw-dtime">${WP.time12(d)} · ${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.${v ? '' : ` · <b>${num(s.views)}</b> 조회수`}</div>
            ${v ? '' : `<div class="tw-dstats"><span><b>${num(s.rts)}</b> 재게시</span><span><b>${num(s.likes)}</b> 마음에 들어요</span></div>`}
            ${actions(post, true)}
          </div>
          <div class="tw-replies"></div>
          <div class="tw-rstatus"></div>`;
        const list = $('.tw-replies', p.body), head = $('.tw-detail', p.body), rstatus = $('.tw-rstatus', p.body);
        const own = v ? [] : (post.replies || []);
        let rs = own.slice();
        const render = () => { list.innerHTML = repliesHTML(post, rs); };
        render();
        p.reloadReplies = async () => {
          if (!V.enabled) return;
          rstatus.innerHTML = `<div class="tw-row-status"><span class="tw-spin"></span></div>`;
          try {
            const res = await V.listReplies(post.id);
            rs = own.concat(res.items.map(fromApi));
            rstatus.innerHTML = '';
            render();
          } catch (e) {
            rstatus.innerHTML = `<div class="tw-row-status"><span>답글을 불러오지 못했어요.</span><button data-retry>다시 시도</button></div>`;
          }
        };
        rstatus.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) p.reloadReplies(); });
        p.reloadReplies();
        bindFeed(p.body);
        // Tap a reply → highlight its parent and its direct answers; tap again to clear
        const clear = () => { list.classList.remove('focus'); head.classList.remove('rel-parent'); $$('.sel,.rel-parent,.rel-child', list).forEach((x) => x.classList.remove('sel', 'rel-parent', 'rel-child')); };
        list.addEventListener('click', (e) => {
          if (e.target.closest('[data-like], [data-reply], [data-del], .tw-img, .tw-link')) return;
          const el = e.target.closest('[data-rid]'); if (!el) return;
          const was = el.classList.contains('sel');
          clear();
          if (was) return;
          const r = rs.find((x) => x.id === el.dataset.rid);
          if (!r) return;
          list.classList.add('focus');
          el.classList.add('sel');
          if (r.inReplyTo === post.id) head.classList.add('rel-parent');
          else { const pe = $(`[data-rid="${CSS.escape(r.inReplyTo || '')}"]`, list); if (pe) pe.classList.add('rel-parent'); }
          rs.filter((x) => x.inReplyTo === r.id).forEach((c) => { const ce = $(`[data-rid="${CSS.escape(c.id)}"]`, list); if (ce) ce.classList.add('rel-child'); });
        });
        return p;
      }

      /* Delete own visitor post/reply */
      async function removeOwn(id) {
        const it = lookup(id);
        if (!it || !it.mine) return;
        const go = await WP.confirm('게시물을 삭제할까요?', '삭제하면 되돌릴 수 없어요.', [{ label: '취소', value: false, style: 'cancel' }, { label: '삭제', value: true, style: 'destructive' }]);
        if (!go) return;
        try {
          await V.remove(id);
        } catch (e) {
          if (e.status !== 404) return WP.alert('삭제하지 못했어요', e.status === 403 ? '이 브라우저에서 작성한 게시물만 삭제할 수 있어요.' : '잠시 후 다시 시도해 주세요.');
        }
        forget(it);
        if (!it.rootId) {
          if (nav.stack.some((pg) => pg.dataset.root === id)) nav.popToRoot();
          dropItem(id);
          loadVisitor('refresh'); // comes back as a placeholder if others' replies hang under it
        } else {
          nav.stack.forEach((pg) => pg.reloadReplies && pg.dataset.root === it.rootId && pg.reloadReplies());
        }
      }

      /* Erase every post of this browser's visitor id and reset the id (and saved nickname) */
      async function removeAllMine() {
        const go = await WP.confirm('내 글을 모두 삭제할까요?', '이 브라우저로 쓴 글과 답글을 모두 삭제하고, 이 브라우저의 방문자 정보와 닉네임도 지워요. 되돌릴 수 없어요.', [{ label: '취소', value: false, style: 'cancel' }, { label: '모두 삭제', value: true, style: 'destructive' }]);
        if (!go) return false;
        try {
          await V.removeAll();
        } catch (e) {
          WP.alert('삭제하지 못했어요', '잠시 후 다시 시도해 주세요.');
          return false;
        }
        index.forEach(({ item }) => item.mine && forget(item));
        vt.items = vt.items.filter((x) => !x.deleted);
        if (nav.stack.length > 1) nav.popToRoot();
        vt.views.forEach((v) => v.render());
        loadVisitor('refresh');
        return true;
      }

      /* Compose: new post, or reply when opt.target is given */
      function compose(opt) {
        if ($('.tw-compose', win)) return;
        const target = opt.target || null;
        const sheet = h(`<div class="tw-compose" role="dialog">
          <header class="tc-head"><button class="tc-cancel">취소</button><button class="tc-post" disabled>게시하기</button></header>
          <div class="tc-scroll">
            ${target ? `<div class="tc-target">${avatar(target.user, 40)}<div class="tc-tm"><div class="tw-ph"><b>${esc(nameOf(target))}</b><span>@${esc(target.user)}</span></div><div class="tc-preview">${target.visitor ? plain(target.text) : WP.text(target.text)}</div></div></div>
              <div class="tc-replyto"><span>@${esc(target.user)}</span> 님에게 보내는 답글</div>` : ''}
            <div class="tc-row">${avatar(null, 40)}<div class="tc-fields">
              <div class="tc-nickrow"><input class="tc-nick" type="text" placeholder="닉네임" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="닉네임"><span class="tc-ncount"></span></div>
              <textarea class="tc-body" placeholder="${target ? '답글을 게시하세요' : '무슨 일이 일어나고 있나요?'}" aria-label="내용"></textarea>
            </div></div>
            ${V.enabled ? '' : `<div class="tc-offline">서버 연결 후 게시할 수 있어요.</div>`}
            <div class="tc-error" hidden><span></span><button class="tc-retry">다시 시도</button></div>
          </div>
          <footer class="tc-foot"><div class="tc-notes">
            <p class="tc-privacy">닉네임과 내용은 누구나 볼 수 있어요. 본인이나 타인의 실명·연락처·주소 등 개인정보를 적지 마세요.</p>
            <p>작성한 글은 이 브라우저에서만 직접 삭제할 수 있어요. 브라우저 데이터를 지웠거나 다른 기기라면 개인정보 안내의 요청 방법을 확인해 주세요.</p>
            <p class="tc-links"><a href="privacy.html" target="_blank" rel="noopener">개인정보 안내</a>${V.enabled ? ' · <button class="tc-wipe" type="button">내 글 모두 삭제</button>' : ''}</p>
          </div><span class="tc-count">0/500</span></footer>
        </div>`);
        win.appendChild(sheet);
        const nick = $('.tc-nick', sheet), body = $('.tc-body', sheet), postBtn = $('.tc-post', sheet);
        const count = $('.tc-count', sheet), ncount = $('.tc-ncount', sheet), errBox = $('.tc-error', sheet);
        nick.value = V.nickname || '';
        let sending = false, key = null, keyFor = '';
        // Only reads values (never rewrites them) so Korean IME composition is never interrupted
        const update = () => {
          const n = len(cleanNick(nick.value)), b = len(cleanBody(body.value));
          count.textContent = `${b}/500`;
          count.classList.toggle('over', b > 500);
          ncount.textContent = n > 15 ? `${n}/20` : '';
          ncount.classList.toggle('over', n > 20);
          postBtn.disabled = !V.enabled || sending || n < 1 || n > 20 || b < 1 || b > 500;
        };
        nick.addEventListener('input', update);
        body.addEventListener('input', () => {
          update();
          body.style.height = 'auto';
          body.style.height = Math.max(120, body.scrollHeight) + 'px';
        });
        update();
        sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 380, easing: WP.EASE });
        setTimeout(() => (nick.value ? body : nick).focus(), 60);

        const close = () => {
          const a = sheet.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 300, easing: WP.EASE });
          a.onfinish = () => sheet.remove();
        };
        $('.tc-cancel', sheet).addEventListener('click', async () => {
          if (sending) return;
          if (body.value.trim()) {
            const drop = await WP.confirm('작성 중인 내용을 삭제할까요?', '', [{ label: '취소', value: false, style: 'cancel' }, { label: '삭제', value: true, style: 'destructive' }]);
            if (!drop) return;
          }
          close();
        });
        const submit = async () => {
          if (!V.enabled || postBtn.disabled || sending) return; // never fake a successful post
          const payload = {
            nickname: cleanNick(nick.value), body: cleanBody(body.value),
            rootId: target ? opt.rootId : null, parentId: target ? target.id : null,
          };
          // One idempotency key per draft content: retrying the same text can't create duplicates
          const sig = JSON.stringify(payload);
          if (!key || keyFor !== sig) { key = V.uuid(); keyFor = sig; }
          sending = true; update();
          sheet.classList.add('sending');
          errBox.hidden = true;
          nick.readOnly = body.readOnly = true;
          V.nickname = payload.nickname;
          try {
            const res = await V.create(Object.assign(payload, { clientKey: key }));
            const item = fromApi(res.item);
            sending = false;
            close();
            posted(item, opt.rootId);
          } catch (e) {
            sending = false;
            sheet.classList.remove('sending');
            nick.readOnly = body.readOnly = false;
            $('span', errBox).textContent = errText(e);
            errBox.hidden = false;
            update();
          }
        };
        const wipe = $('.tc-wipe', sheet);
        if (wipe) wipe.addEventListener('click', async () => {
          if (sending) return;
          if (!V.hasSession) {
            V.nickname = '';
            nick.value = '';
            update();
            return WP.alert('삭제할 글이 없어요', '이 브라우저에 저장된 방문자 정보가 없어요. 저장된 닉네임만 지웠어요.');
          }
          if (await removeAllMine()) sheet.remove();
        });
        postBtn.addEventListener('click', submit);
        $('.tc-retry', sheet).addEventListener('click', submit);
      }

      // After the server confirmed the save
      function posted(item, rootId) {
        if (!item.rootId) {
          addOwn(item);
          if (tab !== 'home') selectTab('home');
          else if (nav.stack.length > 1) nav.popToRoot();
          return;
        }
        const root = lookup(rootId);
        const vr = vt.items.find((x) => x.id === rootId);
        if (vr) { vr.replyCount = (vr.replyCount || 0) + 1; vt.views.forEach((v) => v.render()); }
        const open = nav.stack.find((pg) => pg.dataset.root === rootId);
        if (open) open.reloadReplies();
        else if (root) nav.push(detail(root));
      }

      /* Search */
      function search() {
        const p = WP.page(nav, { cls: 'tw-page', titleHtml: `<div class="tw-sbox">${icon('search', 15)}<input type="search" placeholder="검색"></div>` });
        p.body.innerHTML = `<div class="tw-trend-h">회원님을 위한 트렌드</div><div class="tw-results"></div>`;
        const res = $('.tw-results', p), inp = $('input', p);
        const trends = T.trends || [];
        const showTrends = () => { $('.tw-trend-h', p).hidden = false; res.innerHTML = trends.map((t, i) => `<button class="tw-trend" data-q="${esc(t.replace('#', ''))}"><small>${i + 1} · 트렌드</small><b>${esc(t)}</b></button>`).join(''); };
        const run = (q) => {
          $('.tw-trend-h', p).hidden = true;
          const hits = posts.filter((x) => [x.text, user(x.user).name, x.user].concat((x.replies || []).map((r) => r.text)).join(' ').toLowerCase().replace(/\s+/g, '').includes(q.toLowerCase().replace(/[\s#]+/g, '')));
          res.innerHTML = hits.length ? hits.map((x) => postHTML(x)).join('') : `<div class="tw-empty"><b>"${esc(q)}"에 대한 결과 없음</b><p>다른 검색어를 입력해 보세요.</p></div>`;
        };
        inp.addEventListener('input', () => (inp.value.trim() ? run(inp.value.trim()) : showTrends()));
        res.addEventListener('click', (e) => { const t = e.target.closest('[data-q]'); if (t) { inp.value = t.dataset.q; run(t.dataset.q); } });
        bindFeed(res);
        showTrends();
        return p;
      }
      /* Notifications — derived from replies to the owner's posts */
      function notif() {
        const p = WP.page(nav, { cls: 'tw-page', title: '알림' });
        const items = [];
        posts.forEach((x) => (x.replies || []).forEach((r) => {
          if (x.user === T.me && r.user !== T.me) items.push({ r, x });
        }));
        items.sort((a, b) => WP.parseDate(b.r.date) - WP.parseDate(a.r.date));
        p.body.innerHTML = items.length ? items.map(({ r, x }) => `
          <button class="tw-notif" data-post="${x.id}">${avatar(r.user, 36)}<div><p><b>${esc(user(r.user).name)}</b>님이 답글을 남겼습니다 · ${ago(r.date)}</p><span>${WP.text(r.text)}</span></div></button>`).join('')
          : `<div class="tw-empty"><b>아직 알림이 없습니다</b></div>`;
        bindFeed(p.body);
        return p;
      }

      const roots = { home, search, notif };
      let tab = 'home';
      const selectTab = (name) => {
        tab = name;
        $$('button', tabbar).forEach((x) => x.classList.toggle('on', x.dataset.tab === name));
        nav.setRoot(roots[name]());
      };
      tabbar.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.tab === tab) {
          if (nav.stack.length > 1) nav.popToRoot();
          else if (nav.top.scroller.scrollTop > 2) nav.top.scroller.scrollTo({ top: 0, behavior: 'smooth' });
          else if (nav.top.refresh) nav.top.refresh(); // tap Home again at the top → refresh
          return;
        }
        if (b.dataset.tab === 'home') vt.views.clear();
        selectTab(b.dataset.tab);
      });
      nav.setRoot(home());
      loadVisitor('refresh');
      win._twRefresh = () => { if (vt.loaded) loadVisitor('refresh'); };
      // Relative times: text-only update every 15 s while the app is on screen. mount() runs once
      // per window, so reopening the app never adds a second timer.
      clearInterval(win._twTimer);
      win._twTimer = setInterval(() => {
        if (!win.isConnected) return clearInterval(win._twTimer);
        if (!document.hidden && win.classList.contains('open')) updateTimes(win);
      }, 15000);
    },
    // Re-entering the app refreshes visitor posts (no realtime subscription)
    open(win) { updateTimes(win); if (win._twRefresh) win._twRefresh(); },
  });
})();
