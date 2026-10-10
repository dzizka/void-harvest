#!/usr/bin/env node
// Balansový bot: každá loď hrá N herných minút bez kreslenia (auto-boj, auto-ťažba, auto-schopnosti),
// rozdeľuje talenty, nasadzuje lepšie predmety, zvyšok rozoberá a presúva sa do sektora podľa úrovne.
// Do brán nechodí a predmety v dielni nevylepšuje. Lode bežia paralelne.
//
// Použitie:  npm run balance -- [--min 45] [--cls interceptor,carrier] [--tier 1] [--lv 0] [--deep]
//   --min   herné minúty (predvolene 45)
//   --cls   lode oddelené čiarkou (predvolene všetky)
//   --tier  svet I–IV (1–4)
//   --lv    štartová úroveň (> 0 zároveň nasadí najlepšiu výbavu z cheatov, vhodné pre svety II–IV)
//   --deep  bot sa drží v Hlbine III (> 2 000 m od majáka)
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i < 0 ? null : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true; };
const MIN = +(opt('min') || 45), TIER = +(opt('tier') || 1), LV = +(opt('lv') || 0), DEEP = !!opt('deep');
const CLS = opt('cls') ? String(opt('cls')).split(',') : ['interceptor', 'juggernaut', 'scavenger', 'carrier'];

async function play(b, cls) {
  const pg = await b.newPage();
  await pg.route(/fonts\.g/, r => r.abort());
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('void-harvest-lang', 'sk'); });
  await pg.reload(); await pg.waitForTimeout(300);
  const r = await pg.evaluate(async ({ cls, MIN, TIER, LV, DEEP }) => {
    window.saveGame = () => {}; window.saveAccount = () => {};
    startGame(cls); P.story.shown = true; G.panel = null; syncPanels();
    G.autoFire = true; G.autoMine = true; G.autoSkill = true;
    if (LV > 1) { cheatLevels(LV - 1); cheatTopGear(); P.inv.length = 0; }
    G.tier = G.maxTier = TIER;
    const drops = {}, deaths = { early: 0, mid: 0, late: 0 }, marks = {};
    const _dp = dropPickup;
    dropPickup = function (k, x, y, n, it) { if (k === 'item' && it) { drops[it.rarity] = (drops[it.rarity] || 0) + 1; if (it.anc) drops.anc = (drops.anc || 0) + 1; } return _dp(k, x, y, n, it); };
    const SEC = [['kepler', 1], ['ruby', 9], ['vex', 17], ['baria', 27], ['hercules', 37], ['rim', 47]];
    let cur = 'kepler'; loadSector(cur);
    const dt = 1 / 30, talentIds = [];
    for (const br of TREES[cls]) { for (const n of br.nodes) talentIds.push(n.id); if (br.key) talentIds.push(br.key.id); }
    for (let t = 0, f = 0; t < 60 * MIN; t += dt, f++) {
      if (G.mode === 'dead') { deaths[P.level < 5 ? 'early' : P.level < 15 ? 'mid' : 'late']++; respawn(); loadSector(cur); P.story.shown = true; }
      if (G.panel) { G.panel = null; syncPanels(); }
      const want = SEC.filter(s => P.level >= s[1]).pop()[0];
      if (want !== cur && G.mode === 'play') { cur = want; loadSector(cur); }
      // steering: to the station when the hull is low, else the nearest enemy (or asteroid), keeping some distance
      const k = input.keys; k.KeyW = k.KeyA = k.KeyS = k.KeyD = false;
      let tx = null, ty = null;
      if (P.hull < P.stats.maxHull * 0.3 && G.station) { tx = G.station.x; ty = G.station.y; }
      else {
        let best = nearestEnemy(P.x, P.y, 1200), bd = best ? d2(best.x, best.y, P.x, P.y) : 1e12;
        if (!best) for (const a of asteroids) { if (a.dead) continue; const d = d2(a.x, a.y, P.x, P.y); if (d < bd) { bd = d; best = a; } }
        if (best && bd > 260 ** 2) { tx = best.x; ty = best.y; } else if (!best && G.station) { tx = G.station.x + 900; ty = G.station.y; }
        if (DEEP && G.station) { const ds = Math.hypot(P.x - G.station.x, P.y - G.station.y); if (ds < 2050) { tx = P.x + (P.x - G.station.x) / (ds || 1) * 400; ty = P.y + (P.y - G.station.y) / (ds || 1) * 400; } }
      }
      if (tx != null) { const dx = tx - P.x, dy = ty - P.y; if (dx > 30) k.KeyD = true; if (dx < -30) k.KeyA = true; if (dy > 30) k.KeyS = true; if (dy < -30) k.KeyW = true; }
      if (P.inv.length > 25 || (f % 300 === 0 && P.inv.length)) for (let i = P.inv.length - 1; i >= 0; i--) { if (upgradeState(P.inv[i]) > 0) equipFromInv(i); else salvage(i); }
      if (P.points > 0 && f % 90 === 0) for (const id of talentIds) while (P.points > 0 && canAddTalent(id)) addTalent(id);
      update(dt); updateFx(dt);
      if (!marks[P.level] && P.level % 5 === 0) marks[P.level] = (t / 60).toFixed(0);
    }
    const items = Object.entries(drops).filter(([k]) => k !== 'anc').reduce((a, [, v]) => a + v, 0);
    return { cls, level: P.level, marks, deaths, kills: G.kills, dps: Math.round(P.stats.laserDps), ore: P.ore,
      itemsH: Math.round(items * 60 / MIN), legH: Math.round((drops.legendary || 0) * 60 / MIN), ancH: Math.round((drops.anc || 0) * 60 / MIN), sector: cur };
  }, { cls, MIN, TIER, LV, DEEP });
  await pg.close();
  return r;
}

(async () => {
  const t0 = Date.now();
  console.log(`Balans: ${MIN} herných minút · svet ${TIER}${LV ? ' · štart úroveň ' + LV + ' s najlepšou výbavou' : ''}${DEEP ? ' · Hlbina III' : ''} · lode: ${CLS.join(', ')}`);
  const b = await chromium.launch();
  const res = await Promise.all(CLS.map(c => play(b, c)));
  await b.close();
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('loď', 12) + pad('úroveň', 8) + pad('úr. 10/20/30 (min)', 20) + pad('smrti <5/<15/15+', 18) + pad('zostrely', 10) + pad('DPS', 8) + pad('predm./h', 10) + pad('leg./h', 8) + pad('prad./h', 9) + 'ruda');
  for (const r of res) console.log(pad(r.cls, 12) + pad(r.level, 8) + pad([10, 20, 30].map(l => r.marks[l] || '–').join(' / '), 20) + pad(`${r.deaths.early} / ${r.deaths.mid} / ${r.deaths.late}`, 18) + pad(r.kills, 10) + pad(r.dps, 8) + pad(r.itemsH, 10) + pad(r.legH, 8) + pad(r.ancH, 9) + r.ore);
  console.log(`hotovo za ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
