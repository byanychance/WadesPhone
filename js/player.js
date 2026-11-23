/* Global music player: one <audio> element that lives outside every app,
   so playback survives app switches, going home and locking the phone. */
(function () {
  'use strict';
  const WP = window.WP;
  const audio = document.getElementById('audio');
  const subs = new Set();

  const P = (WP.player = {
    audio,
    track: null,
    available: null, // null = unknown, true = loaded, false = file missing/unplayable
    repeat: false,
    on(fn) { subs.add(fn); return () => subs.delete(fn); },
    emit(type) { subs.forEach((fn) => fn(type, P)); },
    get playing() { return !!P.track && !audio.paused && !audio.ended; },
    get hasSession() { return !!P.track && P.started; },
    started: false,
    load(track) {
      if (P.track && P.track.id === track.id) return;
      P.track = track;
      P.available = null;
      P.started = false;
      audio.src = track.audio;
      audio.loop = P.repeat;
      audio.load();
      P.emit('track');
    },
    play(track) {
      if (track) P.load(track);
      if (!P.track || P.available === false) return P.emit('unavailable');
      const pr = audio.play();
      if (pr && pr.catch) pr.catch(() => {
        if (P.available === false) P.emit('unavailable');
      });
    },
    pause() { audio.pause(); },
    toggle(track) { P.playing ? P.pause() : P.play(track); },
    // Play order = the library order in data/music.js
    queue: ((WP.data.music || {}).tracks) || [],
    at(step) {
      const i = P.track ? P.queue.findIndex((t) => t.id === P.track.id) : -1;
      return i < 0 ? null : P.queue[i + step] || null;
    },
    get hasNext() { return !!P.at(1); },
    next() { const t = P.at(1); if (t) P.play(t); },
    seek(t) {
      if (!isFinite(audio.duration)) return;
      audio.currentTime = Math.max(0, Math.min(audio.duration, t));
    },
    // iOS behaviour: restart the song, or go to the previous one when near its start
    restartOrPrev() {
      const prev = P.at(-1);
      if (audio.currentTime > 3 || !prev) return P.seek(0);
      P.play(prev);
    },
    setRepeat(v) {
      P.repeat = v;
      audio.loop = v;
      WP.store.set('music.repeat', v);
      P.emit('repeat');
    },
    fmt(t) {
      if (!isFinite(t) || t < 0) t = 0;
      return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    },
  });

  P.repeat = !!WP.store.get('music.repeat', false);
  audio.volume = WP.store.get('music.volume', 1);

  audio.addEventListener('loadedmetadata', () => { P.available = true; P.emit('meta'); });
  audio.addEventListener('error', () => { P.available = false; P.emit('unavailable'); });
  audio.addEventListener('play', () => { P.started = true; P.emit('state'); });
  audio.addEventListener('pause', () => P.emit('state'));
  audio.addEventListener('ended', () => { P.emit('state'); if (!P.repeat && P.hasNext) P.next(); });
  audio.addEventListener('timeupdate', () => P.emit('time'));
  audio.addEventListener('volumechange', () => { WP.store.set('music.volume', audio.volume); P.emit('volume'); });

  // Lock-screen / hardware media keys when the browser supports it
  if ('mediaSession' in navigator) {
    P.on((type) => {
      if (type !== 'track' || !P.track) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: P.track.title,
          artist: P.track.artist || '',
          album: P.track.album || '',
          artwork: P.track.cover ? [{ src: P.track.cover, sizes: '512x512' }] : [],
        });
      } catch (e) {}
    });
    try {
      navigator.mediaSession.setActionHandler('play', () => P.play());
      navigator.mediaSession.setActionHandler('pause', () => P.pause());
      navigator.mediaSession.setActionHandler('seekto', (d) => P.seek(d.seekTime));
    } catch (e) {}
  }
})();
