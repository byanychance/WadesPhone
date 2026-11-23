/* Messages — conversation list and chat rooms. Sending fails (no network), like a real dead phone. */
(function () {
  'use strict';
  const WP = window.WP;
  const { h, $, $$, esc, icon } = WP;
  const seenT = new Set(), seenM = new Set();
  // A thread or message id appearing twice is shown once
  const threads = (((WP.data.messages || {}).threads) || []).filter((t) => !seenT.has(t.id) && seenT.add(t.id));
  threads.forEach((t) => { t.messages = t.messages.filter((m) => !m.id || (!seenM.has(m.id) && seenM.add(m.id))); });
  const readState = WP.store.get('msg.read', {});
  const last = (t) => t.messages[t.messages.length - 1];
  const nameOf = (t) => WP.fmt(t.name);

  const avatar = (t, size = 44) => {
    if (t.group) {
      return `<span class="ms-av group" style="width:${size}px;height:${size}px">${(t.members || []).slice(0, 3).map((m, i) => `<i style="background:${['#8e8e93', '#636366', '#aeaeb2'][i]}">${esc(m[0])}</i>`).join('')}</span>`;
    }
    if (t.alert) return `<span class="ms-av" style="width:${size}px;height:${size}px;background:linear-gradient(#ff6961,#ff3b30)"><svg viewBox="0 0 24 24" width="${size * 0.6}" height="${size * 0.6}"><path d="M12 3.5 22 20.5H2z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="#ff3b30" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.3" fill="#ff3b30"/></svg></span>`;
    if (t.unknown) return `<span class="ms-av" style="width:${size}px;height:${size}px"><svg viewBox="0 0 24 24" width="${size * 0.6}" height="${size * 0.6}"><circle cx="12" cy="8.5" r="4.2" fill="#fff"/><path d="M3.5 21c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7z" fill="#fff"/></svg></span>`;
    return `<span class="ms-av" style="width:${size}px;height:${size}px"><b style="font-size:${size * 0.42}px">${esc(nameOf(t)[0])}</b></span>`;
  };
  const isUnread = (t) => t.unread && !readState[t.id];
  const PIN = '<svg class="ms-pin" viewBox="0 0 24 24" width="13" height="13" aria-label="고정됨"><path fill="currentColor" d="M15 2.5l6.5 6.5-1.6 1.6-1.4-.6-3.6 3.6.4 4-1.6 1.6-3.9-3.9-4.6 4.6H4.2v-1.1l4.6-4.6-3.9-3.9 1.6-1.6 4 .4 3.6-3.6-.6-1.4z"/></svg>';
  const preview = (m) => (m.image && !m.text ? '사진' : WP.fmt(m.text));

  WP.registerApp({
    id: 'messages', name: '메시지',
    mount(win) {
      const nav = win.nav;
      const list = WP.page(nav, { title: '메시지', large: true, left: `<button class="nb-btn">편집</button>`, right: `<button class="nb-btn">${icon('compose', 24)}</button>` });
      function drawList() {
        const sorted = threads.slice().sort((a, b) => !!b.pinned - !!a.pinned || WP.parseDate(last(b).date) - WP.parseDate(last(a).date));
        list.body.innerHTML = `
          <div class="ios-search">${icon('search', 16)}<input type="search" placeholder="검색"></div>
          <div class="ms-list">${sorted.map((t) => `
            <button class="ms-row ${isUnread(t) ? 'unread' : ''}" data-id="${t.id}">
              <span class="ms-dot"></span>${avatar(t)}
              <div class="ms-rm">
                <div class="ms-rh"><b>${esc(nameOf(t))}</b>${t.pinned ? PIN : ''}<span>${esc(WP.relDate(last(t).date))}</span>${icon('chevR', 13)}</div>
                <div class="ms-prev">${t.group && last(t).from !== 'me' ? esc(last(t).from) + ': ' : ''}${esc(preview(last(t)))}</div>
              </div>
            </button>`).join('')}</div>`;
        const inp = $('input', list.body);
        inp.addEventListener('input', () => {
          const q = inp.value.trim().toLowerCase();
          $$('.ms-row', list.body).forEach((r) => {
            const t = threads.find((x) => x.id === r.dataset.id);
            r.hidden = q && !(nameOf(t) + ' ' + t.messages.map((m) => WP.fmt(m.text)).join(' ')).toLowerCase().includes(q);
          });
        });
      }
      list.body.addEventListener('click', (e) => {
        const r = e.target.closest('.ms-row');
        if (r) openThread(r.dataset.id);
      });
      drawList();
      nav.setRoot(list);

      function openThread(id, animate = true) {
        const t = threads.find((x) => x.id === id);
        if (!t) return;
        readState[id] = true;
        WP.store.set('msg.read', readState);
        nav.push(chat(t), animate);
        setTimeout(drawList, 400);
      }
      win.openThread = openThread;

      function chat(t) {
        const p = WP.page(nav, {
          cls: t.alert ? 'ms-chat ms-alert' : 'ms-chat',
          back: '',
          titleHtml: `<button class="ms-head">${avatar(t, 40)}<span>${esc(nameOf(t))}${icon('chevR', 10)}</span></button>`,
          right: t.alert ? '' : `<button class="nb-btn">${icon('camera', 24)}</button>`,
        });
        const sms = t.service === 'sms';
        let html = '', prevDate = null, prevFrom = null;
        t.messages.forEach((m, i) => {
          const d = WP.parseDate(m.date);
          if (!prevDate || m.date !== t.messages[i - 1].date) { // a stamp above every distinct send time
            html += `<div class="ms-stamp${prevDate && !WP.sameDay(prevDate, d) ? ' newday' : ''}">${i === 0 && sms ? `${t.alert ? '' : '문자 메시지<br>'}` : ''}${esc(WP.chatStamp(m.date))}</div>`;
            prevFrom = null;
          }
          const me = m.from === 'me';
          const next = t.messages[i + 1];
          const tail = !next || next.from !== m.from || next.date !== m.date;
          if (t.group && !me && prevFrom !== m.from) html += `<div class="ms-sender">${esc(m.from)}</div>`;
          html += `<div class="ms-msg ${me ? 'me' : 'them'} ${sms ? 'sms' : ''} ${tail ? 'tail' : ''} ${m.failed ? 'failed' : ''}">
            ${m.image ? `<button class="ms-photo" data-src="${esc(m.image)}">${WP.img(m.image, '')}</button>` : ''}
            ${m.text ? `<div class="ms-bubble">${WP.text(m.text)}${m.tr ? `<span class="ms-tr">${WP.text(m.tr)}</span>` : ''}</div>` : ''}
            ${m.failed ? `<span class="ms-fail">${icon('exclaim', 22)}</span>` : ''}
          </div>`;
          if (m.failed) html += `<div class="ms-status fail">전송되지 않음</div>`;
          prevDate = d; prevFrom = m.from;
        });
        const lastMine = [...t.messages].reverse().find((m) => m.from === 'me');
        if (lastMine && lastMine === last(t) && !lastMine.failed && !sms) html += `<div class="ms-status">읽음 ${esc(WP.time12(WP.parseDate(lastMine.date)))}</div>`;
        p.body.innerHTML = `<div class="ms-thread">${html}</div>`;
        const thread = $('.ms-thread', p);

        if (!t.alert) {
          const bar = h(`<div class="ms-input">
            <button class="ms-plus">${icon('plus', 20)}</button>
            <div class="ms-field"><input type="text" placeholder="${sms ? '문자 메시지' : 'iMessage'}"><button class="ms-send" hidden>${icon('arrowUp', 18)}</button></div>
          </div>`);
          p.appendChild(bar);
          const inp = $('input', bar), send = $('.ms-send', bar);
          send.classList.toggle('sms', sms);
          inp.addEventListener('input', () => (send.hidden = !inp.value.trim()));
          const doSend = () => {
            const v = inp.value.trim(); if (!v) return;
            inp.value = ''; send.hidden = true;
            $$('.ms-status', thread).forEach((s) => !s.classList.contains('fail') && s.remove());
            const el = h(`<div class="ms-msg me ${sms ? 'sms' : ''} tail"><div class="ms-bubble">${esc(v)}</div></div>`);
            thread.appendChild(el);
            el.animate([{ transform: 'translateY(20px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: WP.EASE });
            p.scroller.scrollTo({ top: p.scroller.scrollHeight, behavior: 'smooth' });
            setTimeout(() => {
              el.classList.add('failed');
              el.insertAdjacentHTML('beforeend', `<span class="ms-fail">${icon('exclaim', 22)}</span>`);
              el.insertAdjacentHTML('afterend', `<div class="ms-status fail">전송되지 않음</div>`);
              p.scroller.scrollTo({ top: p.scroller.scrollHeight, behavior: 'smooth' });
            }, 1600);
          };
          send.addEventListener('click', doSend);
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) doSend(); });
        }
        thread.addEventListener('click', (e) => {
          const ph = e.target.closest('.ms-photo');
          if (ph) WP.viewImage(ph.dataset.src);
          const f = e.target.closest('.ms-fail');
          if (f) WP.alert('메시지를 보낼 수 없음', '네트워크에 연결되어 있지 않습니다.');
        });
        // Link-like text (website addresses) opens Safari
        $$('.ms-bubble', thread).forEach((b) => {
          b.innerHTML = b.innerHTML.replace(/((?:[a-z0-9-]+\.)+(?:com|news|org|example)(?:\/[\w/]*)?)/gi, '<a class="ms-link" data-url="$1">$1</a>');
        });
        thread.addEventListener('click', (e) => {
          const a = e.target.closest('.ms-link');
          if (!a || /\.example(\/|$)/.test(a.dataset.url)) return; // fake spam address: never opened
          const y = p.scroller.scrollTop; // restored by the status-bar "◀ 메시지" link
          WP.os.openApp('safari', { url: a.dataset.url, back: { app: 'messages', label: '메시지', onReturn: () => (p.scroller.scrollTop = y) } });
        });
        // Open at the newest message; keep pinned to the bottom while photos finish loading
        let userScrolled = false;
        const toBottom = () => { if (!userScrolled) p.scroller.scrollTop = p.scroller.scrollHeight; };
        p.scroller.addEventListener('wheel', () => (userScrolled = true), { passive: true });
        p.scroller.addEventListener('touchmove', () => (userScrolled = true), { passive: true });
        $$('img', thread).forEach((im) => im.addEventListener('load', toBottom));
        p._onShow = () => requestAnimationFrame(toBottom);
        return p;
      }
    },
    open(win, params) {
      if (params.thread) {
        win.nav.popToRoot();
        win.openThread(params.thread, false);
      }
    },
  });
})();
