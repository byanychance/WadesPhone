// Local preview server: read-only static files with HTTP Range (needed for audio seeking;
// Python's http.server has no Range support). Node built-ins only, no install.
// Usage (from anywhere):  node tools/serve.mjs [port]   → http://localhost:8765
// Serves the project root (the folder above tools/), bound to ::1 (this computer only).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = +(process.argv[2] || 8765);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.md': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };
const inside = (f) => f === root || f.startsWith(root + path.sep); // not just a prefix: blocks sibling folders too

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  let file = path.join(root, rel);
  if (!inside(file)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) { file = path.join(file, 'index.html'); st = fs.existsSync(file) && fs.statSync(file); }
    if (err || !st || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    let start = 0, end = st.size - 1, status = 200;
    if (m && (m[1] || m[2])) {
      start = m[1] ? +m[1] : Math.max(0, st.size - +m[2]);
      end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file, { start, end }).pipe(res);
  });
}).on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} is already in use on ::1. Try: node tools/serve.mjs 8766` : e.message);
  process.exit(1);
}).listen(port, '::1', () => console.log(`serving ${root} at http://localhost:${port}`));
