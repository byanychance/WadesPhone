/* Photos — albums: 최근 항목 (normal) and 가려진 항목 (hidden, 4-digit passcode).
   The hidden album is built fresh on every entry, so leaving it (back, home, side button) locks it again.
   Hidden images are only put in the DOM after the right code. */
(function () {
  'use strict';
  const WP = window.WP;
  const { $, esc, icon } = WP;
  const D = WP.data.photos || {};
  const recent = D.recent || [], hidden = D.hidden || [];
  const KEYS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']];
  let nav = null;

  /* Wade's lines on wrong codes. Every 1–3 wrong tries (rolled each time) one line shows.
     The 20 normal lines go once each in shuffled order, then only SPECIAL repeats.
     Progress lives in memory only: kept while the page is open, reset on reload. */
  const NORMAL = [
    ["Wrong again. You're a natural.", '또 틀렸네. 이것도 재주다.'],
    ["Jesus. You're still at it?", '와, 아직도 이러고 있냐?'],
    ["Nobody's making you do this. You can quit.", '누가 시켰냐? 그만해도 돼.'],
    ["That's a lot of confidence for someone who doesn't know shit.", '쥐뿔도 모르면서 자신감은 좋네.'],
    ["Sure. Punch in whatever. That'll work.", '그래, 아무거나 다 눌러 봐라. 퍽이나 열리겠다.'],
    ["Go on. Maybe the next wrong answer'll do it.", '그래, 그래. 더 해 봐. 또 틀리면 내가 열어 줄지도 모르지.'],
    ["You know whose phone this is, right?", '이거 누구 폰인지는 알고 이러는 거지?'],
    ["How's that working out for you?", '그래서, 좀 열리디?'],
    ["Whatever you're hoping to find, this is getting sad.", '뭘 보겠다고 이러는진 몰라도, 슬슬 안쓰럽다.'],
    ['Wrong again. Want me to act surprised?', '또 틀렸네. 놀라는 척이라도 해 줄까?'],
    ["I'd ask what you're doing, but this is funnier.", '뭐 하나 했더니. 재밌는 짓 하고 있네.'],
    ['Take a break. You must be tired of being wrong.', '좀 쉬어. 계속 틀리는 것도 지치겠다.'],
    ["Don't tell me you ‘tapped the wrong thing’ later.", '나중에 실수로 눌렀다고 발뺌하지나 마.'],
    ["What are you hoping to find?\nActually, don't tell me.", '뭘 보고 싶어서 이러는 거야? 아니다. 안 듣는 게 낫겠다.', { enLines: true }],
    ["Stubborn little shit, aren't you?", '하여간 고집은 더럽게 세요.'],
    ["It's a fucking keypad. Don't let it get to you.", '비밀번호 하나 못 맞혔다고 삐졌냐?'],
    ['Oh, you were serious with that one?', '방금 그게 진짜 될 거라 생각한 거야?'],
    ["You're really bad at this.", '너 이런 짓 존나 못한다.'],
    ["You've got some fucking nerve. I'll give you that.", '뻔뻔한 건 인정해 줄게.'],
    ['Still here? Christ. Take the fucking hint.', '아직도 이러고 있냐? 씨발, 이쯤 하면 좀 알아먹어.'],
  ];
  // Text wraps on its own (balanced) unless the line has { enLines / koLines: true }: then \n = line break, never wraps, font shrinks to fit.
  const SPECIAL = ["You're just using the photos\nas an excuse now, aren't you?\n…You want me to be rougher with you? Hm?", '너 이제 사진은 핑계지?\n…더 거칠게 해 달라고 이러는 거야? 응?', { enLines: true, koLines: true }];
  const roll = () => 1 + Math.floor(Math.random() * 3);
  const queue = NORMAL.slice();
  for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
  const YES_LINE = ['Alright. You win. …Watch closely.', '그래, 네가 이겼어. …잘 봐.'];
  const NO_LINE = ["Oh, don't lie. …You like it. Why pretend you don't?", '거짓말은. …좋으면서 왜 아닌 척해?'];
  const WATCH = ['…Watch closely.', '…잘 봐.'];
  const BIRTHDAY = ["That's my birthday.\nYou'll do whatever I ask that day,\nwon't you? Hm?", '내 생일이야.\n그날은 내가 해 달라는 거…\n다 해 줄 거지? 응?', { enLines: true, koLines: true }];
  // wrong: wrong codes since the last normal line (reset on leaving/opening)
  const taunt = { wrong: 0, need: roll() };
  // Called on each wrong code → the line to show, or null. After the normal 20, every wrong code gets SPECIAL.
  function onWrong() {
    if (!queue.length) return SPECIAL;
    if (++taunt.wrong < taunt.need) return null;
    taunt.wrong = 0; taunt.need = roll();
    return queue.shift();
  }
  // Keep "Hm?" and the object "me" on the same line as the word before them ("with you? Hm?", "want me"): no-break space, display only
  const keep = (en) => en.replace(/ (Hm\?)$/, '\u00a0$1').replace(/ (me)\b/g, '\u00a0$1');
  // line[2]: { enLines, koLines } \u2192 that text keeps its own \n line breaks and never wraps (see fitLines)
  const sayHTML = (l) => {
    const o = l[2] || {};
    return `<p class="en${o.enLines ? ' ph-lines' : ''}">${esc(keep(l[0]))}</p><p class="ko${o.koLines ? ' ph-lines' : ''}">${esc(l[1])}</p>`;
  };
  // Fixed lines: shrink the text 0.5px at a time until its longest line fits the measured width (min 10px)
  const fitLines = (root) => root.querySelectorAll('.ph-lines').forEach((p) => {
    for (let fs = parseFloat(getComputedStyle(p).fontSize); p.scrollWidth > p.clientWidth && fs > 10; ) p.style.fontSize = (fs -= 0.5) + 'px';
  });
  // iOS alert with an [en, ko] line → Promise<button label>. Only a button closes it (no backdrop tap, no timeout).
  const ask = (line, buttons) => new Promise((resolve) => {
    const el = WP.h(`<div class="alert-wrap ph-pop"><div class="alert" role="alertdialog"><div class="alert-body">${sayHTML(line)}</div><div class="alert-btns">${buttons.map((b) => `<button>${esc(b)}</button>`).join('')}</div></div></div>`);
    $('#overlay').appendChild(el);
    fitLines(el);
    $('.alert', el).animate([{ transform: 'scale(1.15)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: WP.EASE });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      el.remove(); // removed on the first tap, so double taps can't fire twice
      resolve(b.textContent);
    });
  });
  let cancel = () => {}; // stops the open hidden page's popups and timers (set by hiddenPage)

  const grid = (list) => list.length
    ? `<div class="ph-grid">${list.map((src, i) => `<button class="ph-cell" data-i="${i}" aria-label="사진 ${i + 1}">${WP.img(src, 'cover-img')}</button>`).join('')}</div>`
    : `<div class="nt-empty">사진 없음</div>`;
  const bindGrid = (p, list) => p.body.addEventListener('click', (e) => {
    const c = e.target.closest('.ph-cell');
    if (c) WP.viewImage(list[+c.dataset.i]);
  });

  function recentPage() {
    const p = WP.page(nav, { title: '최근 항목', back: '앨범' });
    p.body.innerHTML = grid(recent);
    bindGrid(p, recent);
    return p;
  }

  function hiddenPage() {
    const p = WP.page(nav, { title: '가려진 항목', back: '앨범', cls: 'ph-hidden' });
    let code = '', busy = false; // busy: special popups or the auto-typing are running (input blocked)
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    cancel = () => {
      timers.forEach(clearTimeout); timers = []; busy = false;
      document.querySelectorAll('#overlay .ph-pop').forEach((el) => el.remove()); // its promise never resolves, so the flow stops
    };
    p._onHide = cancel; // back button / edge swipe
    taunt.wrong = 0; // a fresh entry (after leaving the album) starts the wrong count over
    p.body.innerHTML = `
      <div class="ph-lock">
        <div class="ph-lock-ic">${icon('lock', 34)}</div>
        <div class="ph-lock-t">암호 입력</div>
        <div class="ph-dots">${'<i></i>'.repeat(4)}</div>
        <div class="ph-say" aria-live="polite"></div>
        <div class="ph-pad">${KEYS.map(([n, l]) => `<button data-k="${n}"><b>${n}</b><small>${l}</small></button>`).join('')}<span></span><button data-k="0"><b>0</b></button><button class="ph-del" data-k="del">삭제</button></div>
      </div>`;
    const dots = p.body.querySelectorAll('.ph-dots i');
    const draw = () => dots.forEach((d, i) => d.classList.toggle('on', i < code.length));
    const say = (l) => { const s = $('.ph-say', p.body); s.innerHTML = sayHTML(l); fitLines(s); };

    // Unlock (~0.22s, all at once): the album is put in place behind, the lock icon opens,
    // and the lock screen on top lifts 10px and fades off it. Same for typed and auto-typed codes.
    function open() {
      cancel();
      busy = true; // blocks the keypad until the lock screen is gone
      taunt.wrong = 0;
      const lockEl = $('.ph-lock', p.body);
      $('.ph-lock-ic', lockEl).innerHTML = icon('lockOpen', 34);
      lockEl.insertAdjacentHTML('beforebegin', grid(hidden));
      bindGrid(p, hidden);
      lockEl.classList.add('ph-leaving');
      lockEl.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-10px)', opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      later(() => { lockEl.remove(); p.classList.remove('ph-hidden'); busy = false; }, 230);
    }

    // Special line → Yes/No branch → OK → the code types itself (still locked) → birthday → OK → open
    async function special() {
      busy = true;
      if ((await ask(SPECIAL, ['No', 'Yes'])) === 'Yes') await ask(YES_LINE, ['OK']);
      else { await ask(NO_LINE, ['...']); await ask(WATCH, ['OK']); }
      code = ''; draw();
      // Typing only fills the dots; unlocking waits for the birthday OK
      await new Promise((done) => [...String(D.hiddenCode)].forEach((d, i, all) => later(() => {
        const btn = $(`[data-k="${d}"]`, p.body);
        btn.classList.add('pressed');
        later(() => btn.classList.remove('pressed'), 180);
        code += d; draw();
        if (i === all.length - 1) later(done, 500); // let the last press show before the popup
      }, 700 * (i + 1))));
      await ask(BIRTHDAY, ['OK']);
      open();
    }

    function press(k) {
      if (code.length >= 4) return;
      code = k === 'del' ? code.slice(0, -1) : code + k;
      draw();
      if (code.length < 4) return;
      if (code === String(D.hiddenCode)) return open();
      const line = onWrong();
      if (line === SPECIAL) special();
      else if (line) say(line);
      $('.ph-dots', p.body).animate([0, -14, 12, -8, 5, 0].map((x) => ({ transform: `translateX(${x}px)` })), { duration: 380 }).onfinish = () => { if (!busy) { code = ''; draw(); } };
    }
    p.body.addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]');
      if (k && !busy) press(k.dataset.k);
    });
    return p;
  }

  // Relock: drop the hidden album page and any open photo viewer
  const relock = () => {
    cancel();
    if (!nav || nav.stack.length < 2) return;
    nav.popToRoot();
    document.querySelectorAll('#overlay .viewer').forEach((v) => v.remove());
  };

  WP.registerApp({
    id: 'photos', name: '사진',
    mount(win) {
      nav = win.nav;
      const root = WP.page(nav, { title: '앨범', large: true });
      root.body.innerHTML = `
        <div class="inset-list" style="--sep-left:52px">
          <button class="cell" data-go="recent"><span class="ph-ri">${icon('photo', 24)}</span><div class="c-main">최근 항목</div><span class="c-detail">${recent.length}</span><span class="c-chev">${icon('chevR', 14)}</span></button>
        </div>
        <div class="nt-section">기타</div>
        <div class="inset-list" style="--sep-left:52px">
          <button class="cell" data-go="hidden"><span class="ph-ri">${icon('lock', 22)}</span><div class="c-main">가려진 항목</div><span class="c-chev">${icon('chevR', 14)}</span></button>
        </div>`;
      root.body.addEventListener('click', (e) => {
        const g = e.target.closest('[data-go]');
        if (g) nav.push(g.dataset.go === 'hidden' ? hiddenPage() : recentPage());
      });
      nav.setRoot(root);
    },
    open: relock,   // coming back from home always starts at 앨범
    onLock: relock, // side button
  });
})();
