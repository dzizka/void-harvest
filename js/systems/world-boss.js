'use strict';
/* ---------- world boss: every 20 minutes in a random sector ---------- */
const WB_EVERY = 1200, WB_WARN = 120, WB_WINDOW = 300;
function tickWorldBoss(dt) {
  if (P.level < 12) return;
  const W = G.wb = G.wb || { t: 600, state: 'idle' };
  if (W.state === 'idle') {
    if ((W.t -= dt) <= 0) {
      const pool = Object.keys(SECTORS).filter(id => SECTORS[id].kind === 'hostile' && P.level >= SECTORS[id].min);
      Object.assign(W, { sec: pick(pool), state: 'warn', t: WB_WARN, hp: 1, pos: null, w30: false });
      banner(_T`<span style="color:#ffb000">${BOSSES.devourer.name}</span><small>Svetový boss · o 2:00 v sektore ${SECTORS[W.sec].name}</small>`);
      log(_T`<span style="color:#ffb000">Svetový boss ${BOSSES.devourer.name}</span> sa o 2:00 objaví v sektore ${SECTORS[W.sec].name}. Okno na boj: 5 minút.`);
    }
  } else if (W.state === 'warn') {
    W.t -= dt;
    if (W.t <= 30 && !W.w30) { W.w30 = true; log(_T`<span style="color:#ffb000">${BOSSES.devourer.name}</span> prichádza o 0:30 · ${SECTORS[W.sec].name}.`); }
    if (W.t <= 0) { W.state = 'active'; W.t = WB_WINDOW; log(_T`<span style="color:#ffb000">${BOSSES.devourer.name} dorazil</span> do sektora ${SECTORS[W.sec].name}.`); }
  } else if (W.state === 'active') {
    W.t -= dt;
    const alive = enemies.find(e => e.wb && !e.dead);
    if (!alive && !G.dungeon && G.sector === W.sec && !transitioning && curSector().kind === 'hostile') spawnWorldBoss();
    if (alive) W.hp = alive.hp / alive.maxHp;
    if (W.t <= 0) {
      if (alive) { alive.dead = true; ring(alive.x, alive.y, '#ffb000', 300, 0.8); if (G.boss === alive) G.boss = null; }
      Object.assign(W, { state: 'idle', t: WB_EVERY });
      log(_T`${BOSSES.devourer.name} odletel. Ďalší svetový boss o 20 minút.`);
    }
  }
}
function spawnWorldBoss() {
  const W = G.wb;
  if (!W.pos) W.pos = freeSpot((G.station ? G.station.r : 0) + 650, 500, 400);
  const e = spawnBoss('devourer', W.pos.x, W.pos.y, zoneLevel() + 3);
  e.maxHp *= 6; e.hp = e.maxHp * W.hp; e.wb = true; e.r = 60; e.dmgM *= 1.2;
}
function worldBossKilled(e) {
  const W = G.wb; Object.assign(W, { state: 'idle', t: WB_EVERY });
  ACC.st.wb = (ACC.st.wb || 0) + 1;
  for (let i = 0; i < 2; i++) dropPickup('item', e.x, e.y, 1, generateItem(e.lvl, 'legendary'));
  for (let i = 0; i < 3; i++) dropItem(e.x, e.y, e.lvl, 2);
  if (G.tier >= 2 && Math.random() < 0.5) dropSet(e.x, e.y, e.lvl);
  if (mythTier() > 0 && Math.random() < 0.04 * mythTier() * mythMult()) dropMythic(pick(MYTHIC_LIST.filter(m => m.id !== 'voidecho')).id, e.x, e.y, e.lvl + 1);
  dropGem(e.x, e.y, 2); dropGem(e.x, e.y, 1); addShards(15);
  dropOre(e.x, e.y, (300 + e.lvl * 15) * P.stats.yieldMult);
  if (Math.random() < 0.3) grantRune();
  dropKey(e.x, e.y, keyBaseLevel() + 2);
  for (const m of enemies) if (m.minion && !m.dead) killEnemy(m);
  ring(e.x, e.y, '#ffb000', 520, 1.4); burst(e.x, e.y, '#ffb000', 180, 800, 4, 1.3); burst(e.x, e.y, '#ffffff', 60, 500, 2.5, 0.9); shake(16);
  banner(_T`<span style="color:#ffb000">${BOSSES.devourer.name} porazený</span><small>Svetový boss · bohatá korisť</small>`);
  log(_T`<span style="color:#ffb000">${BOSSES.devourer.name}</span> porazený (${ACC.st.wb}×).`);
  G.boss = null;
}
function exitDungeon() {
  // gear left lying in the arena goes straight to the hold so nothing is lost
  for (const p of pickups) if ((p.kind === 'item' && P.inv.length < 30 || p.kind === 'key' || p.kind === 'gem' || p.kind === 'mat') && !p.dead) { collect(p); p.dead = true; }
  const sv = G.saved; G.saved = null;
  transition(_L('Návrat · ') + SECTORS[sv.sector].name, () => { loadSector(sv.sector, { x: sv.x, y: sv.y }, sv); });
}

let transitioning = false;
function transition(label, cb) {
  if (transitioning) return;
  transitioning = true;
  $('fadeTxt').textContent = label; $('fade').classList.add('on');
  input.fire = false; input.missile = false;
  setTimeout(() => {
    if (G) cb();
    setTimeout(() => { $('fade').classList.remove('on'); transitioning = false; }, 250);
  }, 420);
}
