#!/usr/bin/env node
// Rýchly test: načíta hru (index.html aj dist/), každou loďou chvíľu hrá, otvorí všetky panely a vypíše chyby.
// Použitie: npm test   (vyžaduje: npm install  → nainštaluje Playwright)
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const root = path.join(__dirname, '..');
(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (const [file, lang] of [['index.html', 'sk'], ['index.html', 'en'], ['dist/void-harvest.html', 'en']]) {
    const pg = await b.newPage({ viewport: { width: 1400, height: 860 } });
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.route(/fonts\.g/, r => r.abort());
    try { await pg.goto('file://' + path.join(root, file)); } catch (e) { console.log(`${file}: preskočené (${e.message.split('\n')[0]})`); await pg.close(); continue; }
    await pg.evaluate(l => localStorage.setItem('void-harvest-lang', l), lang); await pg.reload();
    await pg.waitForTimeout(300);
    const res = await pg.evaluate(() => {
      window.saveGame = () => {}; window.saveAccount = () => {};
      const out = [];
      for (const cls of Object.keys(CLASSES)) {
        startGame(cls); cheatLevels(30); G.cheat.god = true; G.autoFire = true;
        loadSector('vex');
        const st = G.station; P.x = st && st.x < WORLD.w / 2 ? WORLD.w - 600 : 600; P.y = st && st.y < WORLD.h / 2 ? WORLD.h - 600 : 600;
        for (let i = 0; i < 12; i++) { const ang = i / 12 * Math.PI * 2; spawnEnemy(weighted(SECTORS.vex.enemies), P.x + Math.cos(ang) * 300, P.y + Math.sin(ang) * 300, zoneLevel(), i < 2); }
        for (let i = 0; i < 60 * 20; i++) { update(1 / 60); updateFx(1 / 60); }
        render();
        for (const p of ['inv', 'tal', 'map', 'station', 'craft', 'para', 'ach', 'cheat']) { try { openPanel(p); closePanels(); } catch (e) { out.push(cls + ' panel ' + p + ': ' + e.message); } }
        out.push(`${cls}: lvl ${P.level}, zostrely ${G.kills}`);
      }
      return out;
    });
    console.log(`== ${file} [${lang}]\n  ` + res.join('\n  '));
    if (errs.length) { bad++; console.log('  CHYBY:\n  ' + errs.join('\n  ')); } else console.log('  bez chýb');
    await pg.close();
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})();
