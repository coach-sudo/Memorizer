const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.pdf':'application/pdf'};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4173');
  let file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const full = path.resolve(root, file);
  if (!full.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'content-type': types[path.extname(full)] || 'application/octet-stream', 'cache-control':'no-store'});
    res.end(data);
  });
});
server.listen(4173, '127.0.0.1');
