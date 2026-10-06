#!/usr/bin/env node
'use strict';
// Vypíše texty v _L('…') / _T`…` so slovenskou diakritikou, ktoré nemajú anglický preklad v js/i18n-en.js.
// Použitie: node tools/i18n-check.js
const acorn = require('acorn'), walk = require('acorn-walk'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'js'); const files = []; (function rec(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) rec(p); else if (f.endsWith('.js') && !f.startsWith('i18n')) files.push(p); } })(root);
global.EN = {}; eval(fs.readFileSync(root + '/i18n-en.js', 'utf8').replace("'use strict';", ''));
const miss = {};
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8'); const ast = acorn.parse(src, { ecmaVersion: 'latest', locations: true });
  walk.full(ast, n => {
    let k;
    if (n.type === 'CallExpression' && n.callee.name === '_L' && n.arguments[0] && n.arguments[0].type === 'Literal') k = n.arguments[0].value;
    else if (n.type === 'TaggedTemplateExpression' && n.tag.name === '_T') k = n.quasi.quasis.map((q, i) => (i ? '{' + (i - 1) + '}' : '') + q.value.cooked).join('');
    else return;
    if (EN[k] == null) miss[k] = path.relative(root, f) + ':' + n.loc.start.line;
  });
}
const id = k => !/[áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]/.test(k.replace(/<[^>]*>/g, ''));
const real = Object.entries(miss).filter(([k]) => !id(k));
for (const [k, w] of real) console.log('  ' + w + '  ' + JSON.stringify(k).slice(0, 140));
console.log(real.length ? real.length + ' textov bez anglického prekladu (js/i18n-en.js)' : 'i18n: všetky slovenské texty majú anglický preklad');
process.exitCode = real.length ? 1 : 0;
