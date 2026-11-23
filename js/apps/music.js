/* Music app — library, album, mini player, Now Playing sheet with lyrics.
   Playback itself lives in WP.player (js/player.js), so it keeps going outside this app. */
(function () {
  'use strict';
  const WP = window.WP;
  const { h, $, $$, esc, icon } = WP;
  const P = WP.player;
  const tracks = ((WP.data.music || {}).tracks) || [];
  const artistOf = (t) => t.artist || '알 수 없는 아티스트';

  WP.registerApp({
    id: 'music', name: '음악',
    mount(win) {
      const nav = win.nav;
      win.style.setProperty('--accent', '#fa2d48');

      /* ----- Library ----- */
      const lib = WP.page(nav, { title: '보관함', large: true });
      lib.body.innerHTML = `
        <div class="inset-list mu-rows" style="--sep-left:52px">
          <button class="cell" data-go="songs"><span class="mu-ri">${icon('note', 22)}</span><div class="c-main">노래</div><span class="c-chev">${icon('chevR', 14)}</span></button>
          <button class="cell" data-go="albums"><span class="mu-ri">${icon('tabs', 22)}</span><div class="c-main">앨범</div><span class="c-chev">${icon('chevR', 14)}</span></button>
        </div>
        <div class="group-h">최근 추가된 항목</div>
        ${albumGrid()}`;
      lib.body.addEventListener('click', (e) => {
        if (openAlbum(e)) return;
        const g = e.target.closest('[data-go]');
        if (g && g.dataset.go === 'songs') nav.push(songsPage());
        if (g && g.dataset.go === 'albums') nav.push(albumsPage());
      });
      nav.setRoot(lib);

      function albumGrid() {
        return `<div class="mu-grid">${tracks.map((t) => `
          <button class="mu-card" data-album="${t.id}">
            <div class="mu-art">${WP.img(t.cover, 'cover-img')}</div>
            <b>${esc(t.album || t.title)}</b><span>${esc(artistOf(t))}</span>
          </button>`).join('')}</div>`;
      }
      function openAlbum(e) {
        const c = e.target.closest('[data-album]');
        if (c) nav.push(albumPage(tracks.find((t) => t.id === c.dataset.album)));
        return !!c;
      }
      function albumsPage() {
        const p = WP.page(nav, { title: '앨범', back: '보관함', large: true });
        p.body.innerHTML = albumGrid();
        p.body.addEventListener('click', openAlbum);
        return p;
      }
      function songRow(t, i) {
        return `<button class="mu-song" data-play="${t.id}">
          ${i == null ? `<span class="mu-sart">${WP.img(t.cover, 'cover-img')}</span>` : `<span class="mu-num">${i + 1}</span>`}
          <span class="mu-sm"><b>${esc(t.title)}</b>${i == null ? `<span>${esc(artistOf(t))}</span>` : ''}</span>
          <span class="mu-eq"><i></i><i></i><i></i></span>
          <span class="mu-more">${icon('more', 18)}</span>
        </button>`;
      }
      function bindSongs(root) {
        root.addEventListener('click', (e) => {
          const b = e.target.closest('[data-play]');
          if (!b) return;
          const t = tracks.find((x) => x.id === b.dataset.play);
          if (P.track && P.track.id === t.id && P.playing) return openSheet();
          P.play(t);
          if (P.available !== false) openSheet();
        });
        markRows();
      }
      function songsPage() {
        const p = WP.page(nav, { title: '노래', back: '보관함', large: true });
        p.body.innerHTML = `<div class="mu-songs">${tracks.map((t) => songRow(t)).join('')}</div>`;
        bindSongs(p.body);
        return p;
      }
      function albumPage(t) {
        const p = WP.page(nav, { title: t.album || t.title, back: '보관함', cls: 'mu-album-page nb-clear' });
        p.body.innerHTML = `
          <div class="mu-album">
            <div class="mu-album-art">${WP.img(t.cover, 'cover-img')}</div>
            <h2>${esc(t.album || t.title)}</h2>
            <div class="mu-album-artist">${esc(artistOf(t))}</div>
            <div class="mu-album-sub">${esc(['싱글', t.year].filter(Boolean).join(' · '))}</div>
            <div class="mu-album-btns">
              <button class="mu-pill" data-act="play">${icon('play', 16)}<span>재생</span></button>
              <button class="mu-pill" data-act="repeat">${icon('repeat', 18)}<span>반복</span></button>
            </div>
          </div>
          <div class="mu-songs numbered">${songRow(t, 0)}</div>
          <div class="mu-foot">노래 1곡</div>`;
        p.body.addEventListener('click', (e) => {
          const a = e.target.closest('[data-act]');
          if (!a) return;
          if (a.dataset.act === 'repeat') P.setRepeat(true);
          P.play(t);
          if (P.available !== false) openSheet();
        });
        bindSongs(p.body);
        return p;
      }
      function markRows() {
        $$('.mu-song', win).forEach((r) => {
          const cur = P.track && P.track.id === r.dataset.play;
          r.classList.toggle('current', !!cur);
          r.classList.toggle('playing', !!cur && P.playing);
          r.classList.toggle('unavailable', !!cur && P.available === false);
        });
      }

      /* ----- Mini player ----- */
      const mini = h(`
        <div class="mu-mini" hidden>
          <div class="mu-mini-art"></div>
          <div class="mu-mini-title"></div>
          <button class="mu-mini-btn" data-a="toggle"></button>
          <button class="mu-mini-btn" data-a="next">${icon('next', 24)}</button>
        </div>`);
      win.appendChild(mini);
      mini.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) { if (b.dataset.a === 'toggle') P.toggle(); if (b.dataset.a === 'next') P.next(); return; }
        openSheet();
      });

      /* ----- Now Playing sheet ----- */
      const sheet = h(`
        <div class="np-sheet" aria-hidden="true">
          <div class="np-bg"></div>
          <div class="np-inner">
            <button class="np-grab" aria-label="닫기"><span></span></button>
            <div class="np-lyr-head"><div class="np-lyr-cover"></div><div class="np-lyr-meta"><b></b><span></span></div></div>
            <div class="np-art-wrap"><div class="np-art"></div></div>
            <div class="np-lyrics" hidden><div class="np-lyrics-in"></div></div>
            <div class="np-info">
              <div class="np-titles"><b class="np-title"></b><span class="np-artist"></span></div>
              <button class="np-round">${icon('more', 20)}</button>
            </div>
            <div class="np-scrub"><div class="np-scrub-track"><i></i></div></div>
            <div class="np-times"><span class="np-t-cur">0:00</span><span class="np-t-rem">-0:00</span></div>
            <div class="np-controls">
              <button data-a="prev">${icon('prev', 38)}</button>
              <button data-a="toggle" class="np-big"></button>
              <button data-a="next">${icon('next', 38)}</button>
            </div>
            <div class="np-vol">${icon('speaker', 16)}<div class="np-vol-track"><i></i></div>${icon('speakerLoud', 18)}</div>
            <div class="np-bottom">
              <button data-a="lyrics" class="np-lyr-btn">${icon('quote', 22)}</button>
              <button data-a="airplay">${icon('airplay', 22)}</button>
              <button data-a="repeat" class="np-rep-btn">${icon('repeat', 22)}</button>
            </div>
          </div>
        </div>`);
      win.appendChild(sheet);
      let sheetOpen = false, showLyrics = false;

      function openSheet() {
        if (!P.track) return;
        sheetOpen = true;
        sheet.classList.add('open');
        sheet.setAttribute('aria-hidden', 'false');
        sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 480, easing: WP.EASE });
        renderSheet(true);
      }
      function closeSheet() {
        if (!sheetOpen) return;
        sheetOpen = false;
        setStatusBar();
        const from = sheet.style.transform || 'translateY(0)';
        sheet.animate([{ transform: from }, { transform: 'translateY(100%)' }], { duration: 380, easing: WP.EASE }).onfinish = () => {
          sheet.classList.remove('open');
          sheet.setAttribute('aria-hidden', 'true');
        };
        sheet.style.transform = '';
      }
      $('.np-grab', sheet).addEventListener('click', closeSheet);
      // swipe the sheet down to dismiss (from the artwork / header area)
      let sy = 0, sdy = 0, sdrag = false;
      $('.np-inner', sheet).addEventListener('pointerdown', (e) => {
        if (e.target.closest('button, .np-scrub, .np-vol, .np-lyrics')) return;
        sdrag = true; sy = e.clientY; sdy = 0;
        sheet.setPointerCapture(e.pointerId);
      });
      sheet.addEventListener('pointermove', (e) => {
        if (!sdrag) return;
        sdy = Math.max(0, (e.clientY - sy) / WP.scale);
        sheet.style.transform = `translateY(${sdy}px)`;
      });
      sheet.addEventListener('pointerup', () => {
        if (!sdrag) return;
        sdrag = false;
        if (sdy > 120) closeSheet();
        else {
          sheet.animate([{ transform: sheet.style.transform || 'none' }, { transform: 'translateY(0)' }], { duration: 250, easing: WP.EASE });
          sheet.style.transform = '';
        }
      });

      sheet.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'toggle') P.toggle();
        if (a === 'prev') P.restartOrPrev();
        if (a === 'next') P.next();
        if (a === 'repeat') P.setRepeat(!P.repeat);
        if (a === 'lyrics') { showLyrics = !showLyrics; renderSheet(true); }
      });

      // Scrubber (drag to preview, release to seek)
      const scrub = $('.np-scrub', sheet);
      let scrubbing = false, scrubVal = 0;
      const ratioAt = (el, e) => {
        const r = el.getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      };
      scrub.addEventListener('pointerdown', (e) => {
        if (!isFinite(P.audio.duration)) return;
        scrubbing = true; scrub.classList.add('active');
        scrub.setPointerCapture(e.pointerId);
        scrubVal = ratioAt(scrub, e); renderTime();
      });
      scrub.addEventListener('pointermove', (e) => { if (scrubbing) { scrubVal = ratioAt(scrub, e); renderTime(); } });
      const endScrub = () => {
        if (!scrubbing) return;
        scrubbing = false; scrub.classList.remove('active');
        P.seek(scrubVal * P.audio.duration);
      };
      scrub.addEventListener('pointerup', endScrub);
      scrub.addEventListener('pointercancel', endScrub);

      // Volume
      const vol = $('.np-vol-track', sheet);
      let vdrag = false;
      const setVol = (e) => (P.audio.volume = ratioAt(vol, e));
      vol.addEventListener('pointerdown', (e) => { vdrag = true; vol.setPointerCapture(e.pointerId); vol.classList.add('active'); setVol(e); });
      vol.addEventListener('pointermove', (e) => vdrag && setVol(e));
      vol.addEventListener('pointerup', () => { vdrag = false; vol.classList.remove('active'); });

      function lyricsOf(t) { return (t && t.lyrics) || []; }
      function renderSheet(full) {
        const t = P.track;
        if (!t) return;
        if (full) {
          $('.np-bg', sheet).style.backgroundImage = `url("${t.cover}")`;
          $('.np-art', sheet).innerHTML = WP.img(t.cover, 'cover-img');
          $('.np-title', sheet).textContent = t.title;
          $('.np-artist', sheet).textContent = artistOf(t);
          const ly = lyricsOf(t);
          $('.np-lyr-btn', sheet).hidden = !ly.length;
          if (!ly.length) showLyrics = false;
          $('.np-lyrics-in', sheet).innerHTML = lyricsHTML(t);
          $('.np-lyr-cover', sheet).innerHTML = WP.img(t.cover, 'cover-img');
          $('.np-lyr-meta b', sheet).textContent = t.title;
          $('.np-lyr-meta span', sheet).textContent = artistOf(t);
          $('.np-lyrics', sheet).hidden = !showLyrics;
          $('.np-art-wrap', sheet).hidden = showLyrics;
          $('.np-lyr-btn', sheet).classList.toggle('on', showLyrics);
          sheet.classList.toggle('lyrics-mode', showLyrics);
          setStatusBar();
        }
        $('.np-big', sheet).innerHTML = icon(P.playing ? 'pause' : 'play', 44);
        $('[data-a="next"]', sheet).disabled = !P.hasNext;
        sheet.classList.toggle('paused', !P.playing);
        sheet.classList.toggle('unavailable', P.available === false);
        const rb = $('.np-rep-btn', sheet);
        rb.classList.toggle('on', P.repeat);
        rb.innerHTML = icon('repeat', 22) + (P.repeat ? '<span class="rep1">1</span>' : '');
        $('.np-vol-track i', sheet).style.width = P.audio.volume * 100 + '%';
        renderTime();
      }
      function renderTime() {
        const a = P.audio, d = a.duration;
        const cur = scrubbing ? scrubVal * d : a.currentTime;
        $('.np-scrub-track i', sheet).style.width = (d ? (cur / d) * 100 : 0) + '%';
        $('.np-t-cur', sheet).textContent = P.fmt(cur);
        $('.np-t-rem', sheet).textContent = isFinite(d) ? '-' + P.fmt(d - cur) : '--:--';
      }
      // Lyrics: stanzas of [English, 한국어] pairs. '[Tag]' lines are structure tags and are skipped.
      function lyricsHTML(t) {
        const isTag = (x) => typeof x === 'string' && /^\s*\[.*\]\s*$/.test(x);
        const pair = (en, ko) => `<div class="ly-pair"><p class="ly-en">${esc(en)}</p>${ko ? `<p class="ly-ko">${esc(ko)}</p>` : ''}</div>`;
        const stanzas = lyricsOf(t)
          .map((st) => (Array.isArray(st) ? st : [st]).filter((l) => l && !isTag(l)))
          .filter((st) => st.length)
          .map((st) => `<div class="ly-stanza">${st.map((l) => (Array.isArray(l) ? pair(l[0], l[1]) : pair(l))).join('')}</div>`);
        return stanzas.join('');
      }
      // White lyrics screen needs dark status-bar text and home indicator
      function setStatusBar() {
        win.dataset.sb = sheetOpen && showLyrics ? 'dark' : '';
        WP.os.refreshChrome && WP.os.refreshChrome();
      }

      function renderMini() {
        const t = P.track;
        mini.hidden = !t;
        win.classList.toggle('has-mini', !!t);
        if (!t) return;
        if (mini._id !== t.id) {
          mini._id = t.id;
          $('.mu-mini-art', mini).innerHTML = WP.img(t.cover, 'cover-img');
          $('.mu-mini-title', mini).textContent = t.title;
        }
        $('[data-a="toggle"]', mini).innerHTML = icon(P.playing ? 'pause' : 'play', 24);
        $('[data-a="next"]', mini).disabled = !P.hasNext;
        mini.classList.toggle('unavailable', P.available === false);
      }

      P.on((type) => {
        if (type === 'time') { if (sheetOpen) renderTime(); return; }
        renderMini();
        markRows();
        if (sheetOpen) renderSheet(type === 'track');
        if (type === 'unavailable' && WP.os.current === 'music' && P.track && win._askedPlay) {
          win._askedPlay = false;
          WP.alert('재생할 수 없음', '이 항목은 현재 사용할 수 없습니다.');
        }
      });
      // Remember that the user pressed play, so a missing file shows an alert once
      win.addEventListener('click', (e) => {
        if (e.target.closest('[data-play], [data-act], [data-a="toggle"]')) win._askedPlay = true;
      }, true);

      win.openSheet = openSheet;
      win.closeSheet = closeSheet;
      renderMini();
    },
    open(win, params) {
      if (params.nowPlaying) win.openSheet();
    },
  });
})();
