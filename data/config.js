/* Phone-wide settings. See DEVELOPMENT.md for what is placeholder. */
window.WP_DATA = window.WP_DATA || {};
WP_DATA.config = {
  owner: '웨이드',
  // The phone's "today" (YYYY-MM-DD). The clock shows the viewer's live time on this date.
  phoneDate: '2049-12-01',  // the phone's "now". Notes keep growing up to here.
  // Twitter is the April timeline saved before the network went down: visitor posts are shown on
  // this date (+ their real posting time). Sorting and "방금/1분" still use the real createdAt.
  twitterDate: '2049-04-08',
  // Visitor posting (Twitter app): the Cloudflare Worker's PUBLIC address only,
  // e.g. 'https://wphone-api.<your-subdomain>.workers.dev'. Never put any key or password here.
  // Empty → visitor posting/replies are turned off and only the built-in timeline is shown.
  api: 'https://wphone-api.byanychanc3.workers.dev',
  battery: 17,          // %
  signal: 1,            // 0–4 bars (0 shows "SOS")
  carrier: 'SOS',       // shown on the lock screen
  wallpaper: {
    lock: 'assets/images/wallpaper/love-you-mean-pattern.jpg',
    home: 'assets/images/wallpaper/love-you-mean-pattern.jpg',
  },
  home: {
    grid: ['twitter', 'notes'],
    dock: ['safari', 'messages', 'music'],
  },
  // Home calendar widget: { event, time } for today's event. None now (the LUVIOGEN job is in the past).
  calendar: {},
  // Lock-screen notifications. `open` is passed to the app (deep link).
  // `msg`: id of the linked message — the body (its translation or text) and the time come from it.
  lockNotifications: [
    { app: 'messages', title: 'BLACKIRON OPERATIONS', open: { thread: 'blackiron' }, msg: 'bi-27' }, // body & time come from that message
  ],
};
