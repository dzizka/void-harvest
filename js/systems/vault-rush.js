'use strict';
/* ---------- vault: 60 s of chests and fleeing smugglers ---------- */
const VAULT_TIME = 60, VAULT_FRAGS = 5;
function enterVault() {
  if (G.dungeon || (P.vaultFrags || 0) < VAULT_FRAGS || transitioning) return;
  P.vaultFrags -= VAULT_FRAGS; closePanels();
  G.saved = { sector: G.sector, asteroids, pickups, gates: G.gates, x: P.x, y: P.y + 60 };
  G.dungeon = { vault: true, boss: 'devourer', lvl: P.level + TIERS[G.tier].lvl, room: 0, wave: 0, state: 'vault', portal: null, sector: G.sector, t: 0, chests: 0, gobs: 0, gobT: 12, started: false };
  ACC.st.vaults = (ACC.st.vaults || 0) + 1;
  saveGame();
  transition('Trezor pašerákov', () => {
    loadModeArena('Trezor pašerákov<small>60 sekúnd · rozbi truhlice, chyť pašerákov</small>');
    const A = G.arena, D = G.dungeon;
    for (let i = 0; i < 26; i++) { const a = rand(0, TAU), r = rand(120, A.r - 80); spawnEnemy('chest', A.x + Math.cos(a) * r, A.y + Math.sin(a) * r, D.lvl, false); }
    for (let i = 0; i < 4; i++) { const a = rand(0, TAU); spawnEnemy('goblin', A.x + Math.cos(a) * 250, A.y + Math.sin(a) * 250, D.lvl, false); }
  });
}
function vaultDirector(dt) {
  const D = G.dungeon;
  if (D.portal) D.portal.t += dt;
  if (D.state !== 'vault') return;
  D.t += dt;
  if ((D.gobT -= dt) <= 0) { D.gobT = 12; const a = rand(0, TAU), A = G.arena; spawnEnemy('goblin', A.x + Math.cos(a) * (A.r - 120), A.y + Math.sin(a) * (A.r - 120), D.lvl, false); ring(A.x + Math.cos(a) * (A.r - 120), A.y + Math.sin(a) * (A.r - 120), '#ffb000', 60, 0.5); }
  if (D.t >= VAULT_TIME) {
    D.state = 'over';
    for (const e of enemies) { e.dead = true; burst(e.x, e.y, '#ffb000', 10, 200, 2, 0.4); }
    enemies = [];
    D.portal = { x: P.x, y: P.y - 140, kind: 'return', t: -1 };
    banner(`Trezor sa zatvoril<small>Truhlice ${D.chests} · pašeráci ${D.gobs}</small>`);
    log(`Trezor: ${D.chests} truhlíc, ${D.gobs} pašerákov.`);
  }
}
/* ---------- boss rush: all six sector bosses back to back ---------- */
function enterRush() {
  if (G.dungeon || (P.level < CLIMB_REQ && !G.cheat.unlock) || transitioning) return;
  closePanels();
  G.saved = { sector: G.sector, asteroids, pickups, gates: G.gates, x: P.x, y: P.y + 60 };
  G.dungeon = { rush: true, boss: 'leviathan', lvl: Math.min(P.level, LEVEL_CAP) + 10, room: 0, wave: 0, state: 'rush', portal: null, sector: G.sector, t: 0, idx: 0, next: 2.5 };
  saveGame();
  transition('Aréna veliteľov', () => loadModeArena('Aréna veliteľov<small>6 bossov · čas beží</small>'));
}
function rushDirector(dt) {
  const D = G.dungeon;
  if (D.portal) D.portal.t += dt;
  if (D.state !== 'rush') return;
  D.t += dt;
  if (!G.boss && (D.next -= dt) <= 0) {
    const A = G.arena, key = BOSS_ORDER[D.idx];
    const e = spawnBoss(key, A.x, A.y - 200, D.lvl); e.hp *= 5; e.maxHp = e.hp; e.rushB = true; D.boss = key;
  }
}
function rushBossKilled(e) {
  const D = G.dungeon;
  G.boss = null; D.idx++; D.next = 2.5;
  ring(e.x, e.y, e.B.color, 360, 1); burst(e.x, e.y, e.B.color, 100, 600, 3, 1); shake(10);
  if (D.idx < BOSS_ORDER.length) { banner(`${e.B.name} porazený<small>Boss ${D.idx}/6 · čas ${fmtTime(D.t)}</small>`); return; }
  D.state = 'over';
  const t = Math.round(D.t * 10) / 10;
  ACC.rush = ACC.rush || {}; ACC.rushRuns = ACC.rushRuns || [];
  const best = ACC.rush[P.cls], rec = !best || t < best;
  if (rec) ACC.rush[P.cls] = t;
  ACC.st.rush = ACC.st.rush ? Math.min(ACC.st.rush, t) : t;
  const key = TREES[P.cls].find(B => P.tal[B.key.id]);
  ACC.rushRuns.push({ cls: P.cls, t, d: Date.now(), key: key ? key.key.name : '' }); ACC.rushRuns.sort((a, b) => a.t - b.t); ACC.rushRuns.length = Math.min(ACC.rushRuns.length, 10);
  saveAccount();
  addShards(30);
  for (let i = 0; i < 2; i++) { const L = bossLoot(pick(BOSS_ORDER)), id = pick(L.legs); dropPickup('item', e.x, e.y, 1, generateItem(D.lvl, 'legendary', LEGEND_INDEX[id].slot, null, id)); }
  if (Math.random() < 0.6) dropSet(e.x, e.y, D.lvl);
  if (Math.random() < 0.5) grantRune();
  D.portal = { x: G.arena.x, y: G.arena.y + 160, kind: 'return', t: -1 };
  setTimeout(() => banner(`Aréna dokončená · ${fmtTime(t)}<small>${rec ? 'Nový rekord! · ' : ''}odmeny pri lodi · portál domov</small>`), 400);
  log(`<span style="color:#ffd36b">Aréna veliteľov:</span> ${fmtTime(t)}${rec ? ' · nový rekord' : ''}.`);
}
