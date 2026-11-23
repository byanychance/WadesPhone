/* WPhone core: utilities, icons, storage, navigation stack, shared UI */
(function () {
  'use strict';
  const WP = (window.WP = window.WP || {});
  WP.data = window.WP_DATA || {};
  WP.apps = {};
  WP.scale = 1;

  /* ---------- DOM helpers ---------- */
  WP.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  WP.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  WP.$ = (sel, root = document) => root.querySelector(sel);
  WP.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  // Replace {token} with mission/config values (used by message data)
  WP.fmt = (text) =>
    String(text == null ? '' : text).replace(/\{(\w+)\}/g, (m, k) => {
      const v = (WP.data.mission || {})[k];
      return v == null ? m : v;
    });
  // Text → safe HTML with line breaks
  WP.text = (s) => WP.esc(WP.fmt(s)).replace(/\n/g, '<br>');

  /* ---------- Storage (never throws) ---------- */
  WP.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('wphone.' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem('wphone.' + key, JSON.stringify(val));
      } catch (e) {}
    },
    remove(key) { try { localStorage.removeItem('wphone.' + key); } catch (e) {} },
  };

  /* ---------- Dates (in-world "today" comes from config.phoneDate) ---------- */
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  WP.today = () => {
    const d = (WP.data.config || {}).phoneDate;
    if (!d) return new Date();
    const now = new Date();
    const t = new Date(d + 'T00:00:00');
    t.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    return t;
  };
  WP.parseDate = (s) => (s instanceof Date ? s : new Date(String(s).replace(' ', 'T')));
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  WP.time12 = (d) => {
    const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + ':' + m;
  };
  WP.clock = (d) => (d.getHours() % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0');
  WP.dateLong = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`;
  WP.dateFull = (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  // iOS-style relative label used in lists
  WP.relDate = (s) => {
    const d = WP.parseDate(s), today = WP.today();
    const y = new Date(today); y.setDate(today.getDate() - 1);
    if (sameDay(d, today)) return WP.time12(d);
    if (sameDay(d, y)) return '어제';
    const diff = (today - d) / 86400000;
    if (diff < 7 && diff > 0) return DOW[d.getDay()] + '요일';
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  };
  // Separator label inside a chat
  WP.chatStamp = (s) => {
    const d = WP.parseDate(s), today = WP.today();
    const y = new Date(today); y.setDate(today.getDate() - 1);
    if (sameDay(d, today)) return '오늘 ' + WP.time12(d);
    if (sameDay(d, y)) return '어제 ' + WP.time12(d);
    const yr = d.getFullYear() !== today.getFullYear() ? `${d.getFullYear()}년 ` : '';
    return `${yr}${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]}) ${WP.time12(d)}`;
  };
  WP.sameDay = sameDay;

  /* ---------- Images with iOS-like fallback ---------- */
  WP.img = (src, cls = '', alt = '') =>
    `<img class="${cls}" src="${WP.esc(src)}" alt="${WP.esc(alt)}" draggable="false" onerror="WP.imgFail(this)">`;
  // Swap a broken <img> for a neutral placeholder block (no browser broken-image icon)
  WP.imgFail = (img) => {
    const s = document.createElement('span');
    s.className = img.className + ' img-missing';
    s.setAttribute('role', 'img');
    img.replaceWith(s);
  };

  /* ---------- Icons (SF-Symbol-like line icons) ---------- */
  const I = {
    chevL: '<path d="M15.5 4 7.5 12l8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    chevR: '<path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    chevD: '<path d="m5 9 7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    compose: '<path d="M11 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m18.3 3.7 2 2L12 14l-3 1 1-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    trash: '<path d="M4 6.5h16M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7M6.3 6.5l.9 12.6c.1 1 .9 1.9 2 1.9h5.6c1.1 0 1.9-.9 2-1.9l.9-12.6M10 10.5v6.5M14 10.5v6.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    play: '<path d="M7 4.2v15.6c0 .8.9 1.3 1.6.9l12.6-7.8c.6-.4.6-1.4 0-1.8L8.6 3.3C7.9 2.9 7 3.4 7 4.2z" fill="currentColor"/>',
    pause: '<rect x="5.5" y="3.5" width="4.6" height="17" rx="1.2" fill="currentColor"/><rect x="13.9" y="3.5" width="4.6" height="17" rx="1.2" fill="currentColor"/>',
    next: '<path d="M2.5 6v12c0 .7.8 1.1 1.4.7L12 13.3V18c0 .7.8 1.1 1.4.7l8.6-6a.9.9 0 0 0 0-1.4l-8.6-6c-.6-.4-1.4 0-1.4.7v4.7L3.9 5.3c-.6-.4-1.4 0-1.4.7z" fill="currentColor"/>',
    prev: '<path d="M21.5 6v12c0 .7-.8 1.1-1.4.7L12 13.3V18c0 .7-.8 1.1-1.4.7l-8.6-6a.9.9 0 0 1 0-1.4l8.6-6c.6-.4 1.4 0 1.4.7v4.7l8.1-5.4c.6-.4 1.4 0 1.4.7z" fill="currentColor"/>',
    repeat: '<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19m-3-3 3 3-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5m3 3-3-3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    quote: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.2c-.9 0-1.5.6-1.5 1.4s.6 1.3 1.3 1.3c0 .7-.4 1.2-1 1.5M14 8.2c-.9 0-1.5.6-1.5 1.4s.6 1.3 1.3 1.3c0 .7-.4 1.2-1 1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    airplay: '<path d="M7 17H5.5A2.5 2.5 0 0 1 3 14.5v-8A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v8a2.5 2.5 0 0 1-2.5 2.5H17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m12 14 5 6H7z" fill="currentColor"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    book: '<path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5zM12 6.5v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    tabs: '<rect x="3" y="7" width="13" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 4h10.5A2.5 2.5 0 0 1 21 6.5V17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    reload: '<path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M18 3v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    aa: '<text x="1" y="18" font-size="11" font-weight="600" fill="currentColor" font-family="-apple-system,Segoe UI,sans-serif">A</text><text x="9" y="18" font-size="16" font-weight="600" fill="currentColor" font-family="-apple-system,Segoe UI,sans-serif">A</text>',
    heart: '<path d="M12 20s-7.5-4.6-9-9.3C2 7.4 4.2 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.1 0 5.3 2.9 4.3 6.2C19.5 15.4 12 20 12 20z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    heartFill: '<path d="M12 20s-7.5-4.6-9-9.3C2 7.4 4.2 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.1 0 5.3 2.9 4.3 6.2C19.5 15.4 12 20 12 20z" fill="currentColor"/>',
    reply: '<path d="M4 11.5C4 7.4 7.4 4.5 12 4.5h.5c4.4 0 7.5 3 7.5 6.7 0 3.8-3.2 6.8-7.4 6.8H11l-5 3v-4.3c-1.3-1.3-2-3-2-5.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    retweet: '<path d="M5 17V8.5A2.5 2.5 0 0 1 7.5 6H15M2 14l3 3 3-3M19 7v8.5a2.5 2.5 0 0 1-2.5 2.5H9m13-8-3-3-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    views: '<path d="M5 20V11M10 20V4M15 20v-7M20 20v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-4.5-6 4.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    more: '<circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/>',
    moreCircle: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7.8" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="16.2" cy="12" r="1.3" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5z" fill="currentColor"/>',
    bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m3.5 7 8.5 6 8.5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    arrowUp: '<path d="M12 19V6M6 11.5 12 5.5l6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    camera: '<path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    flashlight: '<path d="M8 3h8v4l-2 3v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V10L8 7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="1.2" fill="currentColor"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4.2l2 2.2H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    info: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.3" fill="currentColor"/>',
    exclaim: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6.5v7" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.4" fill="#fff"/>',
    note: '<path d="M9 18V5.5l11-2.5v12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="17.5" cy="15.5" r="2.6" fill="currentColor"/>',
    photo: '<rect x="3" y="4.5" width="18" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="9.5" r="1.8" fill="currentColor"/><path d="m3.5 17 5-5 4 4 3-3 5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
    speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>',
    speakerLoud: '<path d="M3 9.5h3.5L11 5.5v13l-4.5-4H3z" fill="currentColor"/><path d="M14.5 9a4.5 4.5 0 0 1 0 6M17.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    bird: '<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" fill="currentColor"/>',
  };
  WP.icon = (name, size = 24, cls = '') =>
    `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ''}</svg>`;

  /* ---------- App registry ---------- */
  WP.registerApp = (def) => {
    WP.apps[def.id] = def;
  };

  /* ---------- Navigation stack (per app) ---------- */
  const EASE = 'cubic-bezier(.32,.72,0,1)';
  WP.EASE = EASE;
  class Nav {
    constructor(host) {
      this.host = host;
      this.stack = [];
      this.busy = false;
      this._edgeSwipe();
    }
    get top() {
      return this.stack[this.stack.length - 1];
    }
    setRoot(page) {
      this.stack.forEach((p) => p.remove());
      this.stack = [page];
      this.host.appendChild(page);
      page.classList.add('page-active');
      page._onShow && page._onShow();
    }
    push(page, animate = true) {
      if (this.busy) return;
      const prev = this.top;
      this.host.appendChild(page);
      this.stack.push(page);
      page.classList.add('page-active');
      if (!prev) return;
      prev.inert = true;
      if (!animate) {
        prev.classList.add('page-behind');
        page._onShow && page._onShow();
        return;
      }
      this.busy = true;
      const d = 420;
      page.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: d, easing: EASE });
      prev.animate([{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: 'translateX(-30%)', filter: 'brightness(.7)' }], { duration: d, easing: EASE }).onfinish = () => {
        prev.classList.add('page-behind');
        this.busy = false;
      };
      page._onShow && page._onShow();
    }
    pop(animate = true) {
      if (this.busy || this.stack.length < 2) return false;
      const page = this.stack.pop();
      const prev = this.top;
      prev.classList.remove('page-behind');
      prev.inert = false;
      const done = () => {
        page.remove();
        page._onHide && page._onHide();
        this.busy = false;
        prev._onShow && prev._onShow();
      };
      if (!animate) return done(), true;
      this.busy = true;
      const d = 380;
      page.animate([{ transform: page.style.transform || 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration: d, easing: EASE });
      prev.animate([{ transform: prev.style.transform || 'translateX(-30%)', filter: 'brightness(.7)' }, { transform: 'translateX(0)', filter: 'brightness(1)' }], { duration: d, easing: EASE }).onfinish = () => {
        page.style.transform = prev.style.transform = prev.style.filter = '';
        done();
      };
      return true;
    }
    popToRoot() {
      while (this.stack.length > 1) {
        const p = this.stack.pop();
        p.remove();
      }
      const r = this.top;
      if (r) {
        r.classList.remove('page-behind');
        r.inert = false;
      }
    }
    // Interactive swipe from the left edge to go back
    _edgeSwipe() {
      let sx = 0, dx = 0, active = false, page, prev, w;
      this.host.addEventListener('pointerdown', (e) => {
        if (this.busy || this.stack.length < 2) return;
        const r = this.host.getBoundingClientRect();
        if ((e.clientX - r.left) / WP.scale > 22) return;
        active = true; sx = e.clientX; dx = 0; w = r.width / WP.scale;
        page = this.top; prev = this.stack[this.stack.length - 2];
        prev.classList.remove('page-behind');
        this.host.setPointerCapture(e.pointerId);
      });
      this.host.addEventListener('pointermove', (e) => {
        if (!active) return;
        dx = Math.max(0, (e.clientX - sx) / WP.scale);
        page.style.transform = `translateX(${dx}px)`;
        prev.style.transform = `translateX(${-30 + (dx / w) * 30}%)`;
        prev.style.filter = `brightness(${0.7 + (dx / w) * 0.3})`;
      });
      const end = () => {
        if (!active) return;
        active = false;
        if (dx > w * 0.33) {
          this.pop();
        } else {
          const d = 250;
          page.animate([{ transform: page.style.transform }, { transform: 'translateX(0)' }], { duration: d, easing: EASE });
          prev.animate([{ transform: prev.style.transform }, { transform: 'translateX(-30%)' }], { duration: d, easing: EASE }).onfinish = () => {
            prev.classList.add('page-behind');
          };
          page.style.transform = prev.style.transform = prev.style.filter = '';
        }
      };
      this.host.addEventListener('pointerup', end);
      this.host.addEventListener('pointercancel', end);
    }
  }
  WP.Nav = Nav;

  /* ---------- Page builder (iOS navigation bar + scroll content) ---------- */
  // opts: { title, large, back (label), right (html), cls, bottom (html for toolbar), onBack }
  WP.page = (nav, opts) => {
    const p = WP.h(`
      <section class="page ${opts.cls || ''} ${opts.large ? 'has-large' : ''}">
        <header class="navbar">
          <div class="nb-left">${opts.back != null ? `<button class="nb-back">${WP.icon('chevL', 24)}<span>${WP.esc(opts.back)}</span></button>` : opts.left || ''}</div>
          <div class="nb-title">${opts.titleHtml || WP.esc(opts.title || '')}</div>
          <div class="nb-right">${opts.right || ''}</div>
        </header>
        <div class="scroll">
          ${opts.large ? `<h1 class="large-title">${WP.esc(opts.title)}</h1>` : ''}
          <div class="page-body"></div>
        </div>
        ${opts.bottom ? `<footer class="toolbar">${opts.bottom}</footer>` : ''}
      </section>`);
    const back = WP.$('.nb-back', p);
    if (back) back.addEventListener('click', () => (opts.onBack ? opts.onBack() : nav.pop()));
    const sc = WP.$('.scroll', p);
    sc.addEventListener('scroll', () => p.classList.toggle('scrolled', sc.scrollTop > (opts.large ? 38 : 2)), { passive: true });
    p.body = WP.$('.page-body', p);
    p.scroller = sc;
    return p;
  };

  /* ---------- Overlay: image viewer ---------- */
  WP.viewImage = (src, caption) => {
    const ov = WP.$('#overlay');
    const el = WP.h(`
      <div class="viewer">
        <button class="viewer-close" aria-label="닫기">${WP.icon('x', 20)}</button>
        <div class="viewer-stage">${WP.img(src, 'viewer-img')}</div>
        ${caption ? `<div class="viewer-cap">${WP.text(caption)}</div>` : ''}
      </div>`);
    ov.appendChild(el);
    const img = WP.$('.viewer-img', el);
    let zoom = 1, tx = 0, ty = 0;
    const apply = () => (img.style.transform = `translate(${tx}px,${ty}px) scale(${zoom})`);
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    img.animate([{ transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 300, easing: EASE });
    const close = () => {
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => el.remove();
    };
    WP.$('.viewer-close', el).addEventListener('click', close);
    // double tap / double click to zoom
    img.addEventListener('dblclick', (e) => {
      zoom = zoom > 1 ? 1 : 2.5; tx = ty = 0;
      img.style.transition = 'transform .3s ' + EASE; apply();
      setTimeout(() => (img.style.transition = ''), 320);
      e.stopPropagation();
    });
    // wheel zoom on desktop
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom = Math.min(5, Math.max(1, zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
      if (zoom === 1) tx = ty = 0;
      apply();
    }, { passive: false });
    // drag: pan when zoomed, swipe down to dismiss when not
    let sx, sy, ox, oy, drag = false, moved = false;
    const stage = WP.$('.viewer-stage', el);
    stage.addEventListener('pointerdown', (e) => {
      drag = true; moved = false; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = (e.clientX - sx) / WP.scale, dy = (e.clientY - sy) / WP.scale;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (zoom > 1) { tx = ox + dx; ty = oy + dy; apply(); }
      else { ty = Math.max(0, dy); apply(); el.style.background = `rgba(0,0,0,${1 - Math.min(ty / 400, 0.6)})`; }
    });
    stage.addEventListener('pointerup', () => {
      drag = false;
      if (zoom === 1) {
        if (ty > 120) return close();
        ty = 0; img.style.transition = 'transform .25s ' + EASE; apply(); el.style.background = '';
        setTimeout(() => (img.style.transition = ''), 260);
      }
      if (!moved) el.classList.toggle('chrome-hidden');
    });
  };

  /* ---------- Small transient alert (iOS-style) ---------- */
  WP.alert = (title, msg, btn = '확인') => {
    const ov = WP.$('#overlay');
    const el = WP.h(`<div class="alert-wrap"><div class="alert"><div class="alert-body"><b>${WP.esc(title)}</b>${msg ? `<p>${WP.esc(msg)}</p>` : ''}</div><button>${WP.esc(btn)}</button></div></div>`);
    ov.appendChild(el);
    WP.$('.alert', el).animate([{ transform: 'scale(1.15)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: EASE });
    WP.$('button', el).addEventListener('click', () => el.remove());
  };
  // Two-button alert → Promise<value>. buttons: [{ label, value, style: 'cancel' | 'destructive' }]
  WP.confirm = (title, msg, buttons) => new Promise((resolve) => {
    const ov = WP.$('#overlay');
    const el = WP.h(`<div class="alert-wrap"><div class="alert"><div class="alert-body"><b>${WP.esc(title)}</b>${msg ? `<p>${WP.esc(msg)}</p>` : ''}</div><div class="alert-btns">${buttons.map((b, i) => `<button data-i="${i}" class="${b.style || ''}">${WP.esc(b.label)}</button>`).join('')}</div></div></div>`);
    ov.appendChild(el);
    WP.$('.alert', el).animate([{ transform: 'scale(1.15)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: EASE });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      el.remove();
      resolve(buttons[+b.dataset.i].value);
    });
  });
})();
