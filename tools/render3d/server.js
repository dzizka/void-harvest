'use strict';
// tiny static server: /three/* -> node_modules/three, /assets/* -> scratchpad/assets, / -> this dir
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '../..');
const roots = { '/three/': path.join(root, 'node_modules/three/'), '/models/': path.join(root, 'assets/models/'), '/': __dirname + '/' };
const types = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.glb': 'model/gltf-binary', '.obj': 'text/plain', '.mtl': 'text/plain', '.jpg': 'image/jpeg' };
module.exports = () => new Promise(res => {
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const k = Object.keys(roots).find(p => u.startsWith(p));
    const f = path.join(roots[k], u.slice(k.length));
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
  }).listen(0, () => res(srv));
});
