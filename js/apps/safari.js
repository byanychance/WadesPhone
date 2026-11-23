/* Safari — offline fictional web. Own history stack (back/forward), editable address bar. */
(function () {
  'use strict';
  const WP = window.WP;
  const { h, $, $$, esc, icon } = WP;
  const W = WP.data.web || { pages: {}, articles: [], favorites: [] };
  const arts = (W.articles || []).slice().sort((a, b) => WP.parseDate(b.date) - WP.parseDate(a.date));
  const START = 'favorites://';
  const MB = W.morningbrief || {};
  // Site-wide block shown once at the bottom of every MORNINGBRIEF page (fixed date, not the phone's)
  // Section label; "속보" is a separate badge (article.breaking), not a section
  const mbTag = (a) => `<div class="mb-tag">${a.breaking ? '<span class="mb-flash">속보</span>' : ''}${esc(a.section)}</div>`;
  const mbFoot = () => {
    const d = WP.parseDate(MB.updated);
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `<div class="mb-common"><div class="mb-upd">최종 업데이트: ${esc(WP.dateFull(d))} ${hm}</div>${MB.notice ? `<p>${esc(MB.notice)}</p>` : ''}</div>
      <footer class="mb-foot">${esc(MB.copyright || '')}</footer>`;
  };

  const norm = (u) => String(u || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').toLowerCase().replace(/^rubiogen\.com(?=\/|$)/, 'luviogen.com'); // old saved address → renamed site
  const host = (u) => norm(u).split('/')[0];
  const fmtDate = (s) => { const d = WP.parseDate(s); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  function titleOf(url) {
    if (url === START) return '시작 페이지';
    const r = resolve(url);
    return r ? r.title : host(url);
  }
  function resolve(url) {
    const u = norm(url);
    if (W.pages[u]) return W.pages[u];
    const m = u.match(/^([^/]+)\/article\/(\w+)$/);
    if (m) {
      const a = arts.find((x) => x.id === m[2]);
      if (a) return { type: 'article', title: a.title, article: a };
    }
    return null;
  }

  /* ----- Renderers for each fictional site ----- */
  const R = {
    'news-index'() {
      const [lead, ...rest] = arts;
      return `<div class="site mb">
        <header class="mb-head"><div class="mb-logo">MORNING<span>BRIEF</span></div><div class="mb-date">${esc(WP.dateFull(WP.parseDate(MB.updated)))} 최종 업데이트</div></header>
        <nav class="mb-sections">${(MB.sections || []).map((x, i) => `<button data-sec="${esc(x)}" class="${i ? '' : 'on'}">${esc(x)}</button>`).join('')}</nav>
        ${lead ? `<a class="mb-lead" data-s="${esc(lead.section)}" data-href="morningbrief.news/article/${lead.id}">
          ${lead.image ? WP.img(lead.image, 'mb-lead-img') : ''}
          ${mbTag(lead)}
          <h2>${esc(lead.title)}</h2>${lead.summary ? `<p>${esc(lead.summary)}</p>` : ''}
          <time>${fmtDate(lead.date)}</time></a>` : ''}
        <div class="mb-list">${rest.map((a) => `
          <a class="mb-item" data-s="${esc(a.section)}" data-href="morningbrief.news/article/${a.id}">
            <div class="mb-item-t">${mbTag(a)}<h3>${esc(a.title)}</h3><time>${fmtDate(a.date)}</time></div>
            ${a.image ? WP.img(a.image, 'mb-thumb') : ''}
          </a>`).join('')}</div>
        <p class="mb-none" hidden>이 분류의 기사가 없습니다.</p>
        ${mbFoot()}
      </div>`;
    },
    article(pg) {
      const a = pg.article;
      // "다른 기사": the ids given for this article, shown by their real titles
      const rel = (a.related || []).map((id) => arts.find((x) => x.id === id)).filter(Boolean);
      return `<div class="site mb">
        <header class="mb-head small" data-href="morningbrief.news"><div class="mb-logo">MORNING<span>BRIEF</span></div></header>
        <article class="mb-article">
          ${mbTag(a)}
          <h1>${esc(a.title)}</h1>
          ${a.summary ? `<p class="mb-sub">${esc(a.summary)}</p>` : ''}
          <div class="mb-byline">${esc(a.author || '')} · 입력 ${fmtDate(a.date)}</div>
          ${a.image ? `<figure>${WP.img(a.image, 'mb-fig')}${a.caption ? `<figcaption>${esc(a.caption)}</figcaption>` : ''}</figure>` : ''}
          ${(a.body || []).map((p) => `<p>${esc(p)}</p>`).join('')}
        </article>
        ${rel.length ? `<div class="mb-more"><h4>다른 기사</h4><ul>${rel.map((x) => `<li><a data-href="morningbrief.news/article/${x.id}">${esc(x.title)}</a></li>`).join('')}</ul></div>` : ''}
        ${mbFoot()}
      </div>`;
    },
    corp(pg) {
      const notices = Object.keys(W.pages).filter((k) => /^luviogen\.com\/notice\//.test(k)).map((k) => ({ url: k, ...W.pages[k] })).sort((a, b) => WP.parseDate(b.date) - WP.parseDate(a.date));
      return `<div class="site rg">
        <header class="rg-head"><div class="rg-logo"><i></i>LUVIOGEN</div></header>
        <section class="rg-hero"><h1>${esc(pg.headline)}</h1><p>${pg.intro.map(esc).join('<br>')}</p></section>
        <section class="rg-sec"><h3>ABOUT LUVIOGEN</h3>${pg.about.map((p) => `<p>${esc(p)}</p>`).join('')}</section>
        <section class="rg-cards"><h3>OUR RESEARCH</h3>${pg.research.map(([t, d]) => `<div><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</section>
        <section class="rg-notice"><h3>공지사항</h3>${notices.map((n) => `<a data-href="${n.url}"><time>${fmtDate(n.date).slice(0, 10)}</time><span>${esc(n.title)}</span></a>`).join('')}</section>
        <footer class="rg-foot">© LUVIOGEN. All rights reserved.</footer>
      </div>`;
    },
    notice(pg) {
      return `<div class="site rg">
        <header class="rg-head" data-href="luviogen.com"><div class="rg-logo"><i></i>LUVIOGEN</div></header>
        <article class="rg-article"><small>공지사항</small><h1>${esc(pg.title)}</h1><time>작성일 ${fmtDate(pg.date)}</time>
          ${pg.body.map((p) => `<p>${esc(p)}</p>`).join('')}
          ${pg.sign ? `<p class="rg-sign">${esc(pg.sign)}</p>` : ''}
          <a class="rg-back" data-href="luviogen.com">홈으로</a></article>
        <footer class="rg-foot">© LUVIOGEN. All rights reserved.</footer>
      </div>`;
    },
    shelter(pg) {
      return `<div class="site sh">
        <header class="sh-head"><b>${esc(pg.title)}</b><span>${esc(pg.sub)}</span></header>
        <div class="sh-upd">최종 갱신 ${esc(pg.updated)}</div>
        <p class="sh-intro">${pg.intro.map(esc).join('<br>')}</p>
        <h4 class="sh-h">${esc(pg.listTitle)}</h4>
        <ul class="sh-list">${pg.list.map((s) => `<li><div class="sh-row"><b>${esc(s.name)}</b><em class="${s.tone}">${esc(s.status)}</em></div>
          <small>${esc(s.checkLabel)}: ${esc(s.checked)}</small><p>${esc(s.note)}</p></li>`).join('')}</ul>
        <div class="sh-notes"><h4>${esc(pg.notesTitle)}</h4>${pg.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>
        <p class="sh-foot">${esc(pg.foot)}</p>
      </div>`;
    },
  };

  WP.registerApp({
    id: 'safari', name: 'Safari',
    mount(win) {
      win.innerHTML = `
        <div class="sf">
          <div class="sf-view"><div class="sf-progress"><i></i></div><div class="sf-scroll"></div></div>
          <div class="sf-bottom">
            <div class="sf-addr"><span class="sf-aa">${icon('aa', 22)}</span><span class="sf-lock">${icon('lock', 11)}</span><span class="sf-host"></span><button class="sf-reload">${icon('reload', 17)}</button></div>
            <div class="sf-tools">
              <button data-t="back">${icon('chevL', 24)}</button>
              <button data-t="fwd" style="transform:scaleX(-1)">${icon('chevL', 24)}</button>
              <button data-t="share">${icon('share', 24)}</button>
              <button data-t="book">${icon('book', 24)}</button>
              <button data-t="tabs">${icon('tabs', 24)}</button>
            </div>
          </div>
          <div class="sf-edit" hidden>
            <div class="sf-edit-bar"><div class="sf-edit-field">${icon('search', 15)}<input type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="검색 또는 웹사이트 이름 입력"></div><button class="sf-cancel">취소</button></div>
            <div class="sf-sugg"></div>
          </div>
        </div>`;
      const view = $('.sf-scroll', win), prog = $('.sf-progress', win);
      const hist = [], st = { i: -1 };

      function render(url) {
        let html;
        if (url === START) html = startPage();
        else {
          const pg = resolve(url);
          html = pg ? R[pg.type](pg) : errorPage(url);
        }
        view.innerHTML = html;
        view.scrollTop = 0;
        $('.sf-host', win).textContent = url === START ? '검색 또는 웹사이트 이름 입력' : host(url);
        $('.sf-host', win).classList.toggle('placeholder', url === START);
        $('.sf-lock', win).hidden = url === START || !resolve(url);
        $('[data-t="back"]', win).disabled = st.i <= 0;
        $('[data-t="fwd"]', win).disabled = st.i >= hist.length - 1;
        $('[data-t="share"]', win).disabled = url === START;
        win.querySelector('.sf').classList.toggle('on-start', url === START);
      }
      function load(url, push = true) {
        url = url === START ? START : norm(url);
        if (push) { hist.splice(st.i + 1); hist.push(url); st.i = hist.length - 1; }
        prog.classList.remove('run'); void prog.offsetWidth; prog.classList.add('run');
        render(url);
      }
      win.loadUrl = load;
      function startPage() {
        const fav = W.favorites || [];
        return `<div class="sf-start">
          <h2>즐겨찾기</h2>
          <div class="sf-favs">${fav.map((f) => `<a data-href="${esc(f.url)}"><span style="background:${esc(f.color)}">${esc(f.letter)}</span><small>${esc(f.title)}</small></a>`).join('')}</div>
          <h2>자주 방문한 사이트</h2>
          <div class="sf-freq">${(W.frequent || []).map((u) => `<a data-href="${esc(u)}"><span>${esc(host(u)[0].toUpperCase())}</span><div><b>${esc(titleOf(u))}</b><small>${esc(host(u))}</small></div></a>`).join('')}</div>
        </div>`;
      }
      function errorPage(url) {
        return `<div class="sf-error"><h2>Safari가 페이지를 열 수 없음</h2><p>Safari가 서버를 찾을 수 없기 때문에 '${esc(host(url) || url)}' 페이지를 열 수 없습니다.</p></div>`;
      }

      // link clicks inside pages
      view.addEventListener('click', (e) => {
        // MORNINGBRIEF section tabs filter the list in place (no navigation)
        const sec = e.target.closest('[data-sec]');
        if (sec) {
          const v = sec.dataset.sec, all = v === '전체';
          $$('[data-sec]', view).forEach((b) => b.classList.toggle('on', b === sec));
          const items = $$('.mb-lead, .mb-item', view);
          items.forEach((x) => { x.hidden = !all && x.dataset.s !== v; });
          $('.mb-none', view).hidden = items.some((x) => !x.hidden);
          return;
        }
        const a = e.target.closest('[data-href]');
        if (a) { e.preventDefault(); load(a.dataset.href); return; }
        const img = e.target.closest('.mb-fig, .mb-lead-img');
        if (img && img.src) WP.viewImage(img.src); // caption is already under the photo
      });
      $('.sf-tools', win).addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.disabled) return;
        const t = b.dataset.t;
        if (t === 'back' && st.i > 0) { st.i--; load(hist[st.i], false); }
        if (t === 'fwd' && st.i < hist.length - 1) { st.i++; load(hist[st.i], false); }
        if (t === 'book' || t === 'tabs') load(START);
      });
      $('.sf-reload', win).addEventListener('click', (e) => { e.stopPropagation(); load(hist[st.i], false); });

      // Address bar editing
      const edit = $('.sf-edit', win), input = $('input', edit), sugg = $('.sf-sugg', edit);
      const known = () => {
        const urls = new Set([...Object.keys(W.pages), ...arts.map((a) => `morningbrief.news/article/${a.id}`)]);
        return Array.from(urls);
      };
      function renderSugg() {
        const q = input.value.trim().toLowerCase();
        const list = known().filter((u) => !q || u.includes(q) || titleOf(u).toLowerCase().includes(q)).slice(0, 6);
        sugg.innerHTML = list.length ? `<h3>${q ? 'Safari 제안' : '최근 방문'}</h3>` + list.map((u) => `<a data-go="${esc(u)}">${icon('search', 15)}<div><b>${esc(titleOf(u))}</b><small>${esc(u)}</small></div></a>`).join('') : '';
      }
      $('.sf-addr', win).addEventListener('click', () => {
        edit.hidden = false;
        input.value = hist[st.i] && hist[st.i] !== START ? hist[st.i] : '';
        renderSugg();
        edit.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
        setTimeout(() => { input.focus(); input.select(); }, 30);
      });
      const closeEdit = () => { edit.hidden = true; input.blur(); };
      $('.sf-cancel', edit).addEventListener('click', closeEdit);
      input.addEventListener('input', renderSugg);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) { closeEdit(); load(input.value); }
        if (e.key === 'Escape') closeEdit();
      });
      sugg.addEventListener('click', (e) => {
        const a = e.target.closest('[data-go]');
        if (a) { closeEdit(); load(a.dataset.go); }
      });

      // Edge swipe = browser back (like iOS Safari)
      let sx = 0, sw = false;
      view.addEventListener('pointerdown', (e) => {
        const r = view.getBoundingClientRect();
        sw = (e.clientX - r.left) / WP.scale < 22; sx = e.clientX;
      });
      view.addEventListener('pointerup', (e) => {
        if (sw && (e.clientX - sx) / WP.scale > 90 && st.i > 0) { st.i--; load(hist[st.i], false); }
        sw = false;
      });

      load(W.startUrl || START);
    },
    open(win, params) { if (params.url) win.loadUrl(params.url); },
  });
})();
