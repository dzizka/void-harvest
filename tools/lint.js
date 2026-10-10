#!/usr/bin/env node
// Statická kontrola kódu (ESLint 8). Skripty hry zdieľajú jeden globálny priestor, preto sa skontrolujú
// spolu v poradí z index.html (inak by každá funkcia z iného súboru bola „nedefinovaná“).
// Hlásenia sa prepočítajú späť na pôvodný súbor a riadok.
// Použitie: npm run lint   (vyžaduje: npm install → nainštaluje eslint)
'use strict';
const fs = require('fs'), path = require('path');
const { ESLint } = require('eslint');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
let code = "'use strict';\n", line = 2;
const map = [];
for (const f of files) {
  const t = fs.readFileSync(path.join(root, f), 'utf8').replace(/^'use strict';\n/, '');
  map.push([line, f]); code += t + '\n'; line += t.split('\n').length;
}
const where = n => { let m = map[0]; for (const e of map) if (e[0] <= n) m = e; return `${m[1]}:${n - m[0] + 2}`; };   // +2: lines count from 1 and each file's 'use strict' line was dropped

(async () => {
  const eslint = new ESLint({ useEslintrc: false, overrideConfig: {
    env: { browser: true, es2022: true }, parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
    rules: {
      'no-undef': 'error', 'no-dupe-keys': 'error', 'no-unreachable': 'error', 'no-redeclare': 'error', 'no-self-assign': 'error',
      'no-dupe-else-if': 'error', 'no-duplicate-case': 'error', 'use-isnan': 'error', 'valid-typeof': 'error', 'no-unsafe-finally': 'error',
      'no-shadow-restricted-names': 'error', 'no-unused-vars': ['warn', { vars: 'all', args: 'none' }]
    } } });
  const [res] = await eslint.lintText(code, { filePath: 'game.js' });
  // the English dictionary is checked for duplicate keys on its own (a later key would silently win)
  const [dict] = await eslint.lintText(fs.readFileSync(path.join(root, 'js/i18n-en.js'), 'utf8'), { filePath: 'i18n-en.js' });
  let err = 0, warn = 0;
  for (const m of res.messages) { (m.severity === 2 ? err++ : warn++); console.log(`${where(m.line)}  ${m.severity === 2 ? 'CHYBA' : 'varovanie'}  ${m.message} (${m.ruleId})`); }
  for (const m of dict.messages.filter(m => m.ruleId === 'no-dupe-keys')) { err++; console.log(`js/i18n-en.js:${m.line}  CHYBA  ${m.message}`); }
  console.log(`${files.length} súborov · ${err} chýb · ${warn} varovaní`);
  process.exit(err ? 1 : 0);
})();
