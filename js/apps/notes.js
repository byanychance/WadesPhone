/* Notes — folders, note lists, note detail. Everything is read-only.
   Data notes with `lines` are bilingual (English, Korean paraphrase below, white page).
   Add/delete buttons stay, but only show Wade's one-liners; no note is ever created, changed or removed. */
(function () {
  'use strict';
  const WP = window.WP;
  const { $, $$, esc, icon } = WP;
  const N = WP.data.notes || { folders: [], notes: [] };
  const KEY = 'notes.v2'; // v1 held edits of the old placeholder notes; ignored on purpose
  // saved = { edits: {...}, created: [note, ...] } — written by the old editable version
  const saved = WP.store.get(KEY, { edits: {}, created: [] });
  saved.created = Array.isArray(saved.created) ? saved.created : [];
  // One-time cleanup: the blank note made by accident in THREAT ASSESSMENT (shown as "새로운 메모").
  // Only blank user-made notes in that folder; data notes, other notes and other keys are untouched.
  const blank = (n) => n.folder === 'threat' && !String(n.title || '').trim() && !String(n.body || '').trim();
  if (saved.created.some(blank)) {
    saved.created = saved.created.filter((n) => !blank(n));
    WP.store.set(KEY, saved);
  }

  // Saved `edits` are never applied: the data notes are the final originals.
  const all = () => N.notes.filter((n) => !n.draft).concat(saved.created);
  const inFolder = (fid) => all().filter((n) => n.folder === fid).sort((a, b) => (!!b.pinned - !!a.pinned) || WP.parseDate(b.modified) - WP.parseDate(a.modified));
  const firstLine = (s) => (String(s || '').split('\n').find((l) => l.trim()) || '추가 텍스트 없음').trim();
  const bi = (n) => Array.isArray(n.lines);
  const titleOf = (n) => (Array.isArray(n.title) ? n.title[0] : n.title);
  const textOf = (n) => (bi(n) ? [n.title, n.lines.map((l) => l.slice(0, 2)), n.after || []].flat(2).join(' ') : n.title + ' ' + n.body);
  const previewOf = (n) => (bi(n) ? n.lines[0][0] : firstLine(n.body));
  // opt.strike: [en, ko] text struck through (e.g. a name in the saved roster); opt.roster: compact row
  const strike = (t, x) => (x ? esc(t).split(esc(x)).join(`<s>${esc(x)}</s>`) : esc(t));
  const pairs = (list) => list.map(([en, ko, o = {}]) => `<p class="nt-pair${o.roster ? ' nt-roster' : ''}"><span class="en">${strike(en, o.strike && o.strike[0])}</span><span class="ko">${strike(ko, o.strike && o.strike[1])}</span></p>`).join('');
  const PIN = '<svg class="nt-pin" viewBox="0 0 24 24" width="13" height="13" aria-label="고정됨"><path d="M15.5 2.8 21.2 8.5l-1.4 1.4-1.1-.4-3.5 3.5.3 3.9-1.4 1.4-4-4-5 5H3.6v-1.5l5-5-4-4 1.4-1.4 3.9.3 3.5-3.5-.4-1.1z" fill="currentColor"/></svg>';
  const fullDate = (s) => { const d = WP.parseDate(s); return `${WP.dateFull(d)} ${WP.time12(d)}`; };

  /* Wade's replies to add/delete: 5 steps, then the last line repeats */
  const LINES = {
    add: [
      ['Nothing new to add.', '새로 적을 만한 건 없어.'],
      ['Still nothing.', '아직 없다니까.'],
      ['Keep tapping. See if anything turns up.', '계속 눌러봐. 뭐라도 생기나.'],
      ['You bored or something?', '할 일 없냐?'],
      ['How many times do I have to tell you?', '몇 번을 말해야 돼?'],
      ['Nothing.', '없어.'],
    ],
    del: [
      ["I'm keeping that. Might need it.", '그건 남겨둘 거야. 쓸 일 있을지도 모르니까.'],
      ["I said I'm keeping it.", '남겨둔다고 했잖아.'],
      ['Yeah, that includes this one.', '그래, 이것도 안 지워.'],
      ['Leave my shit alone.', '내 거 좀 가만 놔둬.'],
      ["Keep trying. It's staying.", '계속해 봐. 안 지울 거니까.'],
      ['No.', '안 돼.'],
    ],
  };
  // Memory only (never stored). Reset each time the app is opened from outside.
  const tries = { add: 0, del: 0 };
  let saying = null;
  function say(kind) {
    if (saying) return; // a popup is already up: taps don't count
    const [en, ko] = LINES[kind][Math.min(tries[kind], LINES[kind].length - 1)];
    tries[kind]++;
    saying = WP.h(`<div class="alert-wrap nt-say"><div class="alert" role="alertdialog"><div class="alert-body"><p class="en">${esc(en)}</p><p class="ko">${esc(ko)}</p></div><button>OK</button></div></div>`);
    $('#overlay').appendChild(saying);
    $('.alert', saying).animate([{ transform: 'scale(1.15)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: WP.EASE });
    $('button', saying).addEventListener('click', () => { saying.remove(); saying = null; });
  }

  WP.registerApp({
    id: 'notes', name: '메모',
    mount(win) {
      const nav = win.nav;
      win.style.setProperty('--accent', '#ffd60a');

      /* Folders */
      const folders = WP.page(nav, { title: '폴더', large: true, right: `<button class="nb-btn">편집</button>` });
      function drawFolders() {
        folders.body.innerHTML = `
          <div class="ios-search">${icon('search', 16)}<input type="search" placeholder="검색"></div>
          <div class="nt-section">iCloud</div>
          <div class="inset-list" style="--sep-left:52px">${N.folders.map((f) => `
            <button class="cell" data-folder="${f.id}"><span class="nt-fi">${icon('folder', 24)}</span><div class="c-main">${esc(f.name)}</div><span class="c-detail">${inFolder(f.id).length}</span><span class="c-chev">${icon('chevR', 14)}</span></button>`).join('')}
          </div>
          <div class="nt-results" hidden></div>`;
        const inp = $('input', folders.body), res = $('.nt-results', folders.body);
        inp.addEventListener('input', () => {
          const q = inp.value.trim().toLowerCase();
          $('.inset-list', folders.body).hidden = !!q; $('.nt-section', folders.body).hidden = !!q;
          res.hidden = !q;
          if (q) {
            const hits = all().filter((n) => textOf(n).toLowerCase().includes(q));
            res.innerHTML = hits.length ? `<div class="inset-list nt-list">${hits.map(rowHTML).join('')}</div>` : `<div class="nt-empty">결과 없음</div>`;
          }
        });
      }
      folders.body.addEventListener('click', (e) => {
        const f = e.target.closest('[data-folder]');
        if (f) return nav.push(folderPage(N.folders.find((x) => x.id === f.dataset.folder)));
        const n = e.target.closest('[data-note]');
        if (n) nav.push(notePage(n.dataset.note, '폴더'));
      });
      folders._onShow = drawFolders;
      nav.setRoot(folders);

      function rowHTML(n) {
        return `<button class="nt-row" data-note="${n.id}">
          <div class="nt-rm"><b>${esc(titleOf(n) || '새로운 메모')}${n.pinned ? PIN : ''}</b><div><span>${esc(WP.relDate(n.modified))}</span> ${esc(previewOf(n))}</div></div>
          ${n.image ? `<span class="nt-thumb">${WP.img(n.image, 'cover-img')}</span>` : ''}
        </button>`;
      }

      /* Folder list */
      function folderPage(f) {
        const p = WP.page(nav, { title: f.name, large: true, back: '폴더', bottom: `<span></span><span class="tb-mid"></span><button class="nt-new" aria-label="새로운 메모">${icon('compose', 26)}</button>` });
        const draw = () => {
          const list = inFolder(f.id);
          p.body.innerHTML = `<div class="ios-search">${icon('search', 16)}<input type="search" placeholder="검색"></div>` +
            (list.length ? `<div class="inset-list nt-list">${list.map(rowHTML).join('')}</div>` : `<div class="nt-empty">메모 없음</div>`);
          $('.tb-mid', p).textContent = `${list.length}개의 메모`;
          const inp = $('input', p.body);
          inp.addEventListener('input', () => {
            const q = inp.value.trim().toLowerCase();
            $$('.nt-row', p.body).forEach((r) => {
              const n = list.find((x) => x.id === r.dataset.note);
              r.hidden = q && !textOf(n).toLowerCase().includes(q);
            });
          });
        };
        p._onShow = draw;
        p.body.addEventListener('click', (e) => {
          const n = e.target.closest('[data-note]');
          if (n) nav.push(notePage(n.dataset.note, f.name));
        });
        $('.nt-new', p).addEventListener('click', () => say('add'));
        return p;
      }

      /* Note detail (read-only). Bilingual data notes get the white page. */
      function notePage(id, backLabel) {
        const n = all().find((x) => x.id === id);
        const p = WP.page(nav, {
          cls: 'nt-page' + (bi(n) ? ' nt-bi' : ''), back: backLabel, title: '',
          right: `<button class="nb-btn nt-share">${icon('share', 22)}</button><button class="nb-btn nt-more">${icon('moreCircle', 24)}</button>`,
          bottom: `<button class="nt-del" aria-label="삭제">${icon('trash', 24)}</button><span class="tb-mid"></span><button class="nt-new" aria-label="새로운 메모">${icon('compose', 26)}</button>`,
        });
        p.body.innerHTML = bi(n) ? `
          <div class="nt-note">
            <div class="nt-date">${esc(fullDate(n.modified))}</div>
            <h1 class="nt-title">${esc(n.title[0])}<span class="ko">${esc(n.title[1])}</span></h1>
            <div class="nt-pairs">${pairs(n.lines)}</div>
            ${n.after ? `<div class="nt-pairs nt-after">${pairs(n.after)}</div>` : ''}
          </div>` : `
          <div class="nt-note">
            <div class="nt-date">${esc(fullDate(n.modified))}</div>
            <h1 class="nt-title">${esc(n.title || '새로운 메모')}</h1>
            ${n.image ? `<button class="nt-photo">${WP.img(n.image, '')}</button>` : ''}
            <div class="nt-body">${esc(n.body)}</div>
          </div>`;
        $('.nt-del', p).addEventListener('click', () => say('del'));
        $('.nt-new', p).addEventListener('click', () => say('add'));
        const ph = $('.nt-photo', p);
        if (ph) ph.addEventListener('click', () => WP.viewImage(n.image, n.title));
        if (bi(n)) {
          // White page needs dark status-bar text and home indicator (same as the lyrics screen)
          const sb = (v) => { win.dataset.sb = v; WP.os.refreshChrome && WP.os.refreshChrome(); };
          p._onShow = () => sb('dark');
          p._onHide = () => sb('');
        }
        return p;
      }
    },
    // Coming back from the home screen starts both counters over (only while the app is in use they carry on)
    open() { tries.add = 0; tries.del = 0; },
  });
})();
