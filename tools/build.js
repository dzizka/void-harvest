#!/usr/bin/env node
// Zloží index.html + všetky CSS a JS súbory do jedného samostatného HTML súboru (dist/void-harvest.html).
// Použitie: node tools/build.js
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const css = [], js = [];
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">\n?/g, (_, f) => { css.push(f); return ''; });
html = html.replace(/<script src="(js\/[^"]+)"><\/script>\n?/g, (_, f) => { js.push(f); return ''; });
const style = '<style>\n' + css.map(f => `/* ===== ${f} ===== */\n` + read(f)).join('\n') + '</style>\n';
// v jednom <script> stačí jedno 'use strict'
const script = "<script>\n'use strict';\n" + js.map(f => `/* ===== ${f} ===== */\n` + read(f).replace(/^'use strict';\n/, '').replace("const SPR_BASE = 'assets/sprites/'", "const SPR_BASE = '../assets/sprites/'").replace("const MUS_BASE = 'assets/music/'", "const MUS_BASE = '../assets/music/'")).join('\n') + '</script>\n';
// dist/ leží o priečinok nižšie – sprite sheety berie z ../assets/
html = html.replace('</head>', style + '</head>').replace('</body>', script + '</body>');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'void-harvest.html');
fs.writeFileSync(out, html);
console.log(`dist/void-harvest.html · ${css.length} CSS + ${js.length} JS súborov · ${(html.length / 1024).toFixed(0)} kB`);
