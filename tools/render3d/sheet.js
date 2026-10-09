#!/usr/bin/env node
// Vyrenderuje pseudo-3D sprite sheety z modelov v assets/models podľa specs.json do assets/sprites/*.webp.
// Použitie: npm i --no-save three@0.169.0 && node tools/render3d/sheet.js [názov ...]
// Potrebuje Playwright s Chromiom (WebGL cez SwiftShader).
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const serve = require('./server');
(async () => {
  const srv = await serve(), port = srv.address().port, out = path.join(__dirname, '../../assets/sprites');
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage(); pg.on('pageerror', e => console.log('chyba', e.message));
  await pg.goto(`http://localhost:${port}/render.html`); await pg.waitForFunction(() => window.ready);
  const only = process.argv.slice(2);
  for (const sp of JSON.parse(fs.readFileSync(path.join(__dirname, 'specs.json')))) {
    if (only.length && !only.includes(sp.out)) continue;
    const d = await pg.evaluate(sp => renderSheet({ ...sp, fmt: 'image/webp' }), sp);
    fs.writeFileSync(path.join(out, sp.out + '.webp'), Buffer.from(d.split(',')[1], 'base64'));
    console.log(sp.out, (fs.statSync(path.join(out, sp.out + '.webp')).size / 1024).toFixed(0) + ' kB');
  }
  await b.close(); srv.close();
})();
