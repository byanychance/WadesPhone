/* WPhone OS shell: device sizing, status bar, Dynamic Island, lock screen,
   home screen, app windows and the home-indicator gesture. */
(function () {
  'use strict';
  const WP = window.WP;
  const { h, $, $$, esc, icon, EASE } = WP;
  const cfg = WP.data.config || {};
  const screen = $('#screen');
  const P = WP.player;

  const OS = (WP.os = { state: 'locked', current: null, windows: {} });

  /* ---------- Device sizing ---------- */
  function fit() {
    const mobile = window.innerWidth <= 500 || (window.matchMedia('(pointer:coarse)').matches && window.innerWidth < 820);
    document.body.classList.toggle('mobile', mobile);
    if (mobile) { WP.scale = 1; document.documentElement.style.setProperty('--scale', 1); return; }
    const dev = $('#device');
    const w = 393 + 28, hh = 852 + 28;
    const s = Math.min(1, (window.innerHeight - 40) / hh, (window.innerWidth - 40) / w);
    WP.scale = s;
    document.documentElement.style.setProperty('--scale', s);
    dev.style.setProperty('--scale', s);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- Wallpaper ---------- */
  const wp = cfg.wallpaper || {};
  $('#wallpaper').style.backgroundImage = `url("${wp.home || wp.lock || ''}")`;

  /* ---------- Status bar ---------- */
  const sb = $('#statusbar');
  const bars = Math.max(0, Math.min(4, cfg.signal == null ? 1 : cfg.signal));
  const batt = cfg.battery == null ? 50 : cfg.battery;
  sb.innerHTML = `
    <div class="sb-left"><span class="sb-time"></span><button class="sb-back" hidden></button><span class="sb-carrier">${esc(cfg.carrier || '')}</span></div>
    <div class="sb-right">
      ${bars === 0 ? '<span class="sb-sos">SOS</span>' : `<span class="sb-signal">${[1, 2, 3, 4].map((i) => `<i class="${i <= bars ? 'on' : ''}" style="height:${3 + i * 2.2}px"></i>`).join('')}</span>`}
      <span class="sb-batt ${batt <= 20 ? 'low' : ''}"><span class="sb-batt-body"><span style="width:${batt}%"></span></span><span class="sb-batt-cap"></span></span>
    </div>`;
  // params.back = { app, label, onReturn }: set when another app opened this one via a link
  OS.back = null;
  const sbBack = $('.sb-back', sb);
  const setBack = (b) => {
    OS.back = b || null;
    sbBack.hidden = !OS.back;
    sb.classList.toggle('has-back', !!OS.back);
    if (OS.back) sbBack.innerHTML = `${icon('chevL', 13)}${esc(OS.back.label)}`;
  };
  sbBack.addEventListener('click', () => {
    const b = OS.back; if (!b) return;
    OS.openApp(b.app);
    if (b.onReturn) b.onReturn();
  });
  function tick() {
    const now = WP.today();
    $$('.sb-time, .lock-time').forEach((el) => (el.textContent = WP.clock(now)));
    $$('.lock-date').forEach((el) => (el.textContent = WP.dateLong(now)));
  }

  /* ---------- Dynamic Island (shows background playback) ---------- */
  const island = $('#island');
  island.innerHTML = `<div class="is-cover"></div><div class="is-bars"><i></i><i></i><i></i><i></i></div>`;
  function updateIsland() {
    // Status bar / home indicator turn dark when the foreground app shows a light screen
    const fg = OS.state === 'app' && OS.windows[OS.current];
    document.body.classList.toggle('sb-dark', !!fg && fg.dataset.sb === 'dark');
    const show = P.playing && !(OS.state === 'app' && OS.current === 'music') && OS.state !== 'locked';
    island.classList.toggle('expanded', show);
    island.classList.toggle('paused', !P.playing);
    const c = $('.is-cover', island);
    const id = P.track ? P.track.id : '';
    if (c.dataset.id !== id) { c.dataset.id = id; c.innerHTML = P.track ? WP.img(P.track.cover, 'cover-img') : ''; }
  }
  OS.refreshChrome = () => updateIsland();
  island.addEventListener('click', () => {
    if (island.classList.contains('expanded')) OS.openApp('music', { nowPlaying: true });
  });

  /* ---------- Lock screen ---------- */
  const lock = $('#lock');
  const notifs = (cfg.lockNotifications || []);
  // A notification's time is its linked message's date (Messages app format), never a fixed label
  // n.msg: id of the linked message; its translation (or text) is the body
  const notifBody = (n) => {
    if (!n.msg) return n.body;
    const t = ((WP.data.messages || {}).threads || []).find((x) => x.id === n.open.thread);
    const m = t && t.messages.find((x) => x.id === n.msg);
    return m ? m.tr || m.text : '';
  };
  const notifTime = (n) => {
    const t = n.app === 'messages' && n.open && ((WP.data.messages || {}).threads || []).find((x) => x.id === n.open.thread);
    const m = t && t.messages.find((x) => (n.msg ? x.id === n.msg : x.text === n.body));
    return m ? WP.relDate(m.date) : '';
  };
  const appIconSmall = (id) => `<span class="ni-icon app-icon-${id}">${appGlyph(id, 20)}</span>`;
  lock.innerHTML = `
    <div class="lock-wall" style="background-image:url('${esc(wp.lock || wp.home || '')}')"></div>
    <div class="lock-top">
      <div class="lock-lockicon">${icon('lock', 18)}</div>
      <div class="lock-date"></div>
      <div class="lock-time"></div>
    </div>
    <div class="lock-mid">
      <div class="lock-np"></div>
      <div class="lock-notifs">
        ${notifs.map((n, i) => `
          <button class="notif" data-i="${i}">
            ${appIconSmall(n.app)}
            <div class="notif-main">
              <div class="notif-head"><b>${esc(WP.fmt(n.title))}</b><span>${esc(notifTime(n))}</span></div>
              <div class="notif-text">${WP.text(notifBody(n))}</div>
            </div>
          </button>`).join('')}
      </div>
    </div>
    <div class="lock-bottom">
      <button class="lock-qbtn flash" aria-label="손전등">${icon('flashlight', 22)}</button>
      <div class="lock-hint">위로 쓸어올려 열기</div>
      <button class="lock-qbtn" aria-label="카메라">${icon('camera', 22)}</button>
    </div>`;

  function renderLockNP() {
    const box = $('.lock-np', lock);
    if (!P.track || !P.hasSession) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    const t = P.track;
    if (!box.firstChild) {
      box.innerHTML = `
        <div class="np-row"><div class="np-cover">${WP.img(t.cover, 'cover-img')}</div>
          <div class="np-meta"><b>${esc(t.title)}</b><span>${esc(t.artist || '알 수 없는 아티스트')}</span></div></div>
        <div class="np-bar"><span class="np-cur">0:00</span><div class="np-track"><i></i></div><span class="np-rem">-0:00</span></div>
        <div class="np-ctrl"><button data-a="prev">${icon('prev', 26)}</button><button data-a="toggle" class="np-toggle"></button><button data-a="next">${icon('next', 26)}</button></div>`;
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        e.stopPropagation();
        if (b.dataset.a === 'toggle') P.toggle();
        if (b.dataset.a === 'prev') P.restartOrPrev();
        if (b.dataset.a === 'next') P.next();
      });
      box.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
    $('.np-toggle', box).innerHTML = icon(P.playing ? 'pause' : 'play', 30);
    $('[data-a="next"]', box).disabled = !P.hasNext;
    const a = P.audio, d = a.duration;
    $('.np-cur', box).textContent = P.fmt(a.currentTime);
    $('.np-rem', box).textContent = '-' + P.fmt((d || 0) - a.currentTime);
    $('.np-track i', box).style.width = (d ? (a.currentTime / d) * 100 : 0) + '%';
  }

  $$('.notif', lock).forEach((b) =>
    b.addEventListener('click', (e) => {
      if (lockDragged) return;
      const n = notifs[+b.dataset.i];
      unlock(() => OS.openApp(n.app, n.open || {}));
    })
  );
  $('.flash', lock).addEventListener('click', (e) => e.currentTarget.classList.toggle('on'));
  $$('.lock-qbtn', lock).forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));

  // Swipe up to unlock
  let lsy = 0, ldy = 0, ldrag = false, lockDragged = false;
  lock.addEventListener('pointerdown', (e) => {
    if (OS.state !== 'locked') return;
    ldrag = true; lockDragged = false; lsy = e.clientY; ldy = 0;
  });
  window.addEventListener('pointermove', (e) => {
    if (!ldrag) return;
    ldy = Math.min(0, (e.clientY - lsy) / WP.scale);
    if (ldy < -8) lockDragged = true;
    if (lockDragged) {
      lock.style.transform = `translateY(${ldy}px)`;
      lock.style.opacity = 1 + ldy / 900;
    }
  });
  window.addEventListener('pointerup', () => {
    if (!ldrag) return;
    ldrag = false;
    if (ldy < -90) unlock();
    else if (lockDragged) {
      lock.animate([{ transform: lock.style.transform }, { transform: 'translateY(0)' }], { duration: 300, easing: EASE });
      lock.style.transform = ''; lock.style.opacity = '';
    } else {
      const hint = $('.lock-hint', lock);
      hint.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 500, easing: 'ease-out' });
    }
    setTimeout(() => (lockDragged = false), 0);
  });

  function unlock(after) {
    if (OS.state !== 'locked') return after && after();
    const from = lock.style.transform || 'translateY(0)';
    lock.animate([{ transform: from, opacity: lock.style.opacity || 1 }, { transform: 'translateY(-100%)', opacity: 0.6 }], { duration: 380, easing: EASE }).onfinish = () => {
      lock.classList.add('unlocked');
      lock.style.transform = ''; lock.style.opacity = '';
    };
    OS.state = OS.current ? 'app' : 'home';
    document.body.dataset.state = OS.state;
    const homeEl = $('#home');
    if (!OS.current) homeEl.animate([{ transform: 'scale(1.12)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 450, easing: EASE });
    updateIsland();
    if (after) setTimeout(after, 120);
  }
  OS.lock = () => {
    if (OS.state === 'locked') return;
    OS.state = 'locked';
    Object.values(WP.apps).forEach((a) => a.onLock && a.onLock());
    document.body.dataset.state = 'locked';
    lock.classList.remove('unlocked');
    lock.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    renderLockNP();
    updateIsland();
  };
  OS.unlock = unlock;

  /* ---------- App icons ---------- */
  function appGlyph(id, size) {
    const s = size || 60;
    switch (id) {
      case 'safari':
        return `<svg viewBox="0 0 60 60" width="${s}" height="${s}"><defs><linearGradient id="sfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1ed2fc"/><stop offset="1" stop-color="#1572ef"/></linearGradient></defs><rect width="60" height="60" fill="#fff"/><circle cx="30" cy="30" r="24" fill="url(#sfg)"/>${Array.from({ length: 36 }, (_, i) => { const a = (i * 10 * Math.PI) / 180, r1 = i % 9 === 0 ? 17.5 : 20, r2 = 22.5; return `<line x1="${30 + r1 * Math.cos(a)}" y1="${30 + r1 * Math.sin(a)}" x2="${30 + r2 * Math.cos(a)}" y2="${30 + r2 * Math.sin(a)}" stroke="#fff" stroke-width="${i % 9 === 0 ? 1.4 : 0.8}" opacity=".9"/>`; }).join('')}<path d="M42 18 33 33 27 27z" fill="#ff3b30"/><path d="M18 42 27 27 33 33z" fill="#fff"/></svg>`;
      case 'messages':
        return `<svg viewBox="0 0 60 60" width="${s}" height="${s}"><defs><linearGradient id="msg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67fa7d"/><stop offset="1" stop-color="#0dc337"/></linearGradient></defs><rect width="60" height="60" fill="url(#msg)"/><path d="M30 13c-11 0-19.5 7.2-19.5 16 0 5 2.7 9.4 7 12.3-.3 2.6-1.6 5-3.7 6.9 4 .1 7.5-1.3 10.1-3.6 1.9.4 4 .6 6.1.6 11 0 19.5-7.2 19.5-16S41 13 30 13z" fill="#fff"/></svg>`;
      case 'notes':
        return `<svg viewBox="0 0 60 60" width="${s}" height="${s}"><defs><linearGradient id="ntg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe36a"/><stop offset="1" stop-color="#ffc800"/></linearGradient></defs><rect width="60" height="60" fill="#fdfdfd"/><rect width="60" height="17" fill="url(#ntg)"/><line x1="0" y1="17.5" x2="60" y2="17.5" stroke="#d9d9d9"/>${[27, 36, 45, 54].map((y) => `<line x1="0" y1="${y}" x2="60" y2="${y}" stroke="#dcdcdc" stroke-width="1.2"/>`).join('')}<g fill="#c8c8c8">${[6, 13, 20, 27, 34, 41, 48, 55].map((x) => `<circle cx="${x}" cy="7" r="1.1"/>`).join('')}</g></svg>`;
      case 'music':
        return `<svg viewBox="0 0 60 60" width="${s}" height="${s}"><defs><linearGradient id="mug" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fd5f7a"/><stop offset="1" stop-color="#fa233b"/></linearGradient></defs><rect width="60" height="60" fill="url(#mug)"/><path d="M24 40.5V20.5l17-3.5v19" fill="none" stroke="#fff" stroke-width="3.6" stroke-linejoin="round"/><ellipse cx="19.6" cy="41" rx="5.4" ry="4.6" fill="#fff"/><ellipse cx="36.6" cy="37" rx="5.4" ry="4.6" fill="#fff"/></svg>`;
      case 'photos':
        return `<svg viewBox="0 0 60 60" width="${s}" height="${s}"><rect width="60" height="60" fill="#fff"/><g transform="translate(30 30)" style="mix-blend-mode:multiply">${['#fdb827', '#f9802d', '#f2484f', '#c86dd7', '#7a7ff0', '#3fa9f5', '#4cd37b', '#a6d84a'].map((c, i) => `<ellipse cx="0" cy="-10" rx="7" ry="11" fill="${c}" opacity=".85" transform="rotate(${i * 45})"/>`).join('')}</g></svg>`;
      case 'twitter':
        return `<svg viewBox="0 0 60 60" width="${s}" height="${s}"><rect width="60" height="60" fill="#1d9bf0"/><g transform="translate(15 16.5) scale(1.25)" fill="#fff">${'<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>'}</g></svg>`;
      default:
        return `<svg viewBox="0 0 60 60" width="${s}" height="${s}"><rect width="60" height="60" fill="#444"/></svg>`;
    }
  }
  WP.appGlyph = appGlyph;

  /* ---------- Home screen ---------- */
  const homeEl = $('#home');
  const layout = cfg.home || { grid: ['twitter', 'notes'], dock: ['safari', 'messages', 'music'] };
  const iconHTML = (id, label = true) => {
    const a = WP.apps[id];
    if (!a) return '';
    return `<button class="app-icon" data-app="${id}"><span class="ai-img">${appGlyph(id)}</span>${label ? `<span class="ai-label">${esc(a.name)}</span>` : ''}</button>`;
  };
  function renderHome() {
    const now = WP.today();
    const cal = cfg.calendar || {};
    homeEl.innerHTML = `
      <div class="home-page">
        <div class="widget w-battery">
          <div class="wb-ring" style="--p:${batt};--ringc:${batt <= 20 ? '#ff453a' : '#30d158'}"><span><svg viewBox="0 0 24 24" width="26" height="26"><rect x="7" y="2.5" width="10" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></span></div>
          <div class="wb-pct">${batt}%</div>
        </div>
        <div class="widget w-cal">
          <div class="wc-dow">${'일월화수목금토'[now.getDay()]}요일</div>
          <div class="wc-day">${now.getDate()}</div>
          <div class="wc-ev">${cal.event ? `<i></i><div><b>${esc(WP.fmt(cal.event))}</b><span>${esc(cal.time || '')}</span></div>` : '<span class="wc-none">오늘 일정 없음</span>'}</div>
        </div>
        <div class="w-labels"><span>배터리</span><span>캘린더</span></div>
        ${layout.grid.map((id) => iconHTML(id)).join('')}
      </div>
      <div class="home-search">${icon('search', 13)}<span>검색</span></div>
      <div class="dock">${layout.dock.map((id) => iconHTML(id, false)).join('')}</div>`;
    $$('.app-icon', homeEl).forEach((b) => b.addEventListener('click', () => OS.openApp(b.dataset.app, {}, b)));
  }

  /* ---------- App windows ---------- */
  const appsEl = $('#apps');
  function iconRect(id) {
    const el = $(`#home .app-icon[data-app="${id}"] .ai-img`);
    const s = screen.getBoundingClientRect();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: (r.left - s.left) / WP.scale, y: (r.top - s.top) / WP.scale, w: r.width / WP.scale, h: r.height / WP.scale };
  }
  function zoomFrames(id) {
    const r = iconRect(id);
    const W = screen.clientWidth, H = screen.clientHeight;
    if (!r) return [{ transform: 'scale(.6)', opacity: 0, borderRadius: '40px' }, { transform: 'none', opacity: 1, borderRadius: '0px' }];
    const sx = r.w / W, sy = r.h / H;
    const tx = r.x, ty = r.y;
    return [
      { transform: `translate(${tx}px,${ty}px) scale(${sx},${sy})`, opacity: 0.2, borderRadius: `${14 / sx}px / ${14 / sy}px` },
      { transform: 'translate(0,0) scale(1,1)', opacity: 1, borderRadius: '0px' },
    ];
  }

  OS.openApp = (id, params = {}) => {
    const def = WP.apps[id];
    if (!def) return;
    if (OS.state === 'locked') return unlock(() => OS.openApp(id, params));
    let win = OS.windows[id];
    const fresh = !win;
    if (fresh) {
      win = h(`<div class="app-win app-${id}" data-app="${id}"></div>`);
      appsEl.appendChild(win);
      OS.windows[id] = win;
      win.nav = new WP.Nav(win);
      def.mount(win);
    }
    const already = OS.current === id && OS.state === 'app';
    if (OS.current && OS.current !== id) {
      const prev = OS.windows[OS.current];
      prev.classList.remove('open');
      prev.style.transform = '';
    }
    setBack(params.back);
    OS.current = id;
    OS.state = 'app';
    document.body.dataset.state = 'app';
    win.classList.add('open');
    if (!already) {
      win.style.transformOrigin = '0 0';
      win.animate(zoomFrames(id), { duration: 480, easing: EASE });
      $('#home').animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.9)', opacity: 0.4 }], { duration: 480, easing: EASE });
    }
    if (def.open) def.open(win, params);
    updateIsland();
  };

  OS.goHome = () => {
    if (OS.state === 'locked') return;
    if (OS.state === 'home' || !OS.current) {
      // already home: nothing to do
      return;
    }
    $('#overlay').innerHTML = '';
    const id = OS.current;
    const win = OS.windows[id];
    const frames = zoomFrames(id).reverse();
    const cur = win.style.transform;
    if (cur) frames[0] = { transform: cur, opacity: 1, borderRadius: '40px' };
    win.style.transformOrigin = '0 0';
    win.animate(frames, { duration: 420, easing: EASE }).onfinish = () => {
      win.classList.remove('open');
      win.style.transform = '';
    };
    $('#home').animate([{ transform: 'scale(.9)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: EASE });
    setBack(null);
    OS.state = 'home';
    OS.current = null;
    document.body.dataset.state = 'home';
    updateIsland();
  };

  /* ---------- Home indicator: tap or swipe up = home / unlock ---------- */
  const hi = $('#home-indicator');
  let hsy = 0, hdy = 0, hdrag = false;
  hi.addEventListener('pointerdown', (e) => {
    hdrag = true; hsy = e.clientY; hdy = 0;
    hi.setPointerCapture(e.pointerId);
  });
  hi.addEventListener('pointermove', (e) => {
    if (!hdrag) return;
    hdy = Math.min(0, (e.clientY - hsy) / WP.scale);
    if (OS.state === 'app') {
      const win = OS.windows[OS.current];
      const s = Math.max(0.55, 1 + hdy / 900);
      win.style.transformOrigin = '50% 100%';
      win.style.transform = `translateY(${hdy * 0.5}px) scale(${s})`;
      win.style.borderRadius = '40px';
    } else if (OS.state === 'locked') {
      lock.style.transform = `translateY(${hdy}px)`;
    }
  });
  hi.addEventListener('pointerup', () => {
    if (!hdrag) return;
    hdrag = false;
    const win = OS.state === 'app' && OS.windows[OS.current];
    const isTap = hdy > -6;
    if (OS.state === 'locked') return unlock();
    if (isTap || hdy < -50) {
      if (win) { win.style.borderRadius = ''; }
      OS.goHome();
    } else if (win) {
      win.animate([{ transform: win.style.transform }, { transform: 'none' }], { duration: 250, easing: EASE });
      win.style.transform = ''; win.style.borderRadius = '';
    }
  });

  /* ---------- Side button (desktop frame) & keyboard ---------- */
  $('.side-btn.power').addEventListener('click', () => (OS.state === 'locked' ? null : OS.lock()));
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])')) return;
    if (e.key === 'Escape') OS.state === 'app' ? OS.goHome() : null;
  });

  /* ---------- Player → shell updates ---------- */
  P.on((type) => {
    if (type === 'time' && OS.state !== 'locked') return;
    updateIsland();
    if (OS.state === 'locked') renderLockNP();
  });

  /* ---------- Boot ---------- */
  function boot() {
    renderHome();
    renderLockNP();
    tick();
    setInterval(tick, 10000);
    document.body.dataset.state = 'locked';
    updateIsland();
    // Optional deep link for testing: #open=app or #unlock
    const hsh = location.hash;
    if (/unlock|open=/.test(hsh)) {
      lock.classList.add('unlocked');
      OS.state = 'home';
      document.body.dataset.state = 'home';
      const m = hsh.match(/open=(\w+)/);
      if (m) OS.openApp(m[1]);
    }
  }
  OS.boot = boot;
})();
