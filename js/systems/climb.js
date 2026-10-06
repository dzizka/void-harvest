'use strict';
/* ---------- Void Climb: timed, endless floors ---------- */
const CLIMB_LIMIT = 300, CLIMB_NEED = 40, CLIMB_REQ = 50;
const climbScale = f => ({ hp: Math.pow(1.17, f - 1), dmg: 1 + 0.06 * (f - 1) });
const CLIMB_POOL = { drone: 10, fighter: 16, charger: 14, gunship: 14, splitter: 10, sniper: 8, minelayer: 6, healer: 6, shieldbearer: 6, stalker: 8 };
const climbBest = cls => ((ACC.climb || {})[cls || P.cls]) || 0;
const weekId = () => Math.floor((Date.now() - Date.UTC(2026, 0, 5)) / (7 * 86400000));
const WEEK_POOL = ['volatile', 'noRegen', 'fortified', 'swift', 'burning', 'horde'];
function weekMods(w) { const r = seeded('week' + w), ids = WEEK_POOL.slice(); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } return ids.slice(0, 2); }
function weekData() {
  const w = weekId();
  if (!ACC.weekly || ACC.weekly.w !== w) ACC.weekly = { w, best: {}, runs: [], claimed: {} };
  return ACC.weekly;
}
function enterClimb(start, weekly) {
  if (G.dungeon || (P.level < CLIMB_REQ && !G.cheat.unlock) || transitioning) return;
  start = weekly ? 1 : clamp(Math.round(start) || 1, 1, Math.max(1, climbBest()));
  closePanels();
  G.saved = { sector: G.sector, asteroids, pickups, gates: G.gates, x: P.x, y: P.y + 60 };
  G.dungeon = { climb: true, boss: 'void', lvl: Math.min(P.level, LEVEL_CAP), room: 0, wave: 0, state: 'climb', portal: null, sector: G.sector,
    floor: start, start, prog: 0, t: 0, spawnT: 1.2, guardian: null, weekly: !!weekly, wk: weekly ? weekMods(weekId()) : null };
  saveGame();
  transition(weekly ? `Týždenná výzva · ${weekMods(weekId()).map(m => NM_MODS[m].name).join(' · ')}` : `Výstup do Prázdnoty · poschodie ${start}`, loadClimbFloor);
}
function loadModeArena(title) {
  const R = DUNGEON.R + 120;
  WORLD.w = WORLD.h = R * 2 + 400;
  const c = WORLD.w / 2;
  clearEntities();
  G.arena = { x: c, y: c, r: R }; G.station = null; G.gates = []; G.event = null;
  P.x = c; P.y = c + R - 200; P.vx = P.vy = 0;
  setPalette(DUNGEON.pal, 'dungeon');
  cam.x = P.x; cam.y = P.y;
  banner(title);
}
function loadClimbFloor() {
  const D = G.dungeon, R = DUNGEON.R + 120;
  WORLD.w = WORLD.h = R * 2 + 400;
  const c = WORLD.w / 2;
  clearEntities();
  G.arena = { x: c, y: c, r: R }; G.station = null; G.gates = []; G.event = null;
  P.x = c; P.y = c; P.vx = P.vy = 0;
  setPalette(DUNGEON.pal, 'dungeon');
  cam.x = P.x; cam.y = P.y;
  banner(`Výstup do Prázdnoty<small>Poschodie ${D.floor} · 5:00 · úroveň ${D.lvl}</small>`);
}
function nextClimbFloor() {
  const D = G.dungeon;
  D.floor++; D.prog = 0; D.guardian = null; D.spawnT = 1;
  for (const e of enemies) e.dead = true;
  enemies = []; ebullets = []; hazards = [];
  ring(P.x, P.y, '#9a8cff', 420, 0.8); burst(P.x, P.y, '#c9c2ff', 60, 500, 2.5, 0.7); shake(5);
  banner(`Poschodie ${D.floor}<small>${D.floor % 5 === 0 ? 'Strážca hlbiny čaká na konci' : `zostáva ${fmtTime(Math.max(0, CLIMB_LIMIT - D.t))}`}</small>`);
}
function climbDirector(dt) {
  const D = G.dungeon;
  if (D.portal) D.portal.t += dt;
  if (D.state !== 'climb') return;
  D.t += dt;
  if (D.t >= CLIMB_LIMIT) { endClimb(false); return; }
  if (D.prog >= CLIMB_NEED) {
    if (D.floor % 5 !== 0) { nextClimbFloor(); return; }
    if (!D.guardian) {
      const a = rand(0, TAU), A = G.arena;
      D.guardian = spawnBoss('void', A.x + Math.cos(a) * 320, A.y + Math.sin(a) * 320, D.lvl + 1);
      D.guardian.hp *= 0.6; D.guardian.maxHp = D.guardian.hp; D.guardian.climbG = true;
    }
    return;
  }
  if (nmHas('burning') && (D.burnT = (D.burnT || 3) - dt) <= 0) {
    D.burnT = rand(2.2, 3.2); const a = rand(0, TAU), dd = rand(0, 140);
    hazards.push({ kind: 'fire', x: P.x + Math.cos(a) * dd, y: P.y + Math.sin(a) * dd, r: 85, t: 1.1, t0: 1.1, life: 2.6, tick: 0, dps: 14 * (1 + 0.09 * (D.lvl - 1)) * climbScale(D.floor).dmg });
  }
  const want = Math.round((14 + Math.min(10, Math.floor(D.floor / 2))) * (nmHas('horde') ? 1.5 : 1));
  if ((D.spawnT -= dt) <= 0 && enemies.length < want) {
    D.spawnT = 0.45;
    const A = G.arena, a0 = rand(0, TAU);
    for (let i = 0; i < 3; i++) {
      const a = a0 + rand(-0.25, 0.25), x = A.x + Math.cos(a) * (A.r - 80), y = A.y + Math.sin(a) * (A.r - 80);
      spawnEnemy(weighted(CLIMB_POOL), x, y, D.lvl, Math.random() < 0.08);
      ring(x, y, '#9a8cff', 34, 0.35);
    }
  }
}
function recordClimb(floor, died) {
  ACC.climb = ACC.climb || {}; ACC.climbRuns = ACC.climbRuns || [];
  const best = climbBest();
  ACC.climb[P.cls] = Math.max(best, floor);
  ACC.st.climb = Math.max(ACC.st.climb || 0, floor);
  const key = TREES[P.cls].find(B => P.tal[B.key.id]);
  ACC.climbRuns.push({ cls: P.cls, floor, d: Date.now(), key: key ? key.key.name : '', died: !!died });
  ACC.climbRuns.sort((a, b) => b.floor - a.floor); ACC.climbRuns.length = Math.min(ACC.climbRuns.length, 10);
  saveAccount();
  return floor > best;
}
function endClimb() {
  const D = G.dungeon, fl = D.floor;
  D.state = 'over';
  for (const e of enemies) e.dead = true;
  enemies = []; ebullets = []; hazards = []; G.boss = null;
  let rec;
  if (D.weekly) {
    const W = weekData(), best = W.best[P.cls] || 0; rec = fl > best;
    W.best[P.cls] = Math.max(best, fl);
    W.runs.push({ cls: P.cls, floor: fl, d: Date.now() }); W.runs.sort((a, b) => b.floor - a.floor); W.runs.length = Math.min(W.runs.length, 10);
    ACC.st.weekly = Math.max(ACC.st.weekly || 0, fl);
    if (fl >= 10 && !W.claimed[P.cls]) { W.claimed[P.cls] = 1; addShards(50); dropSet(P.x, P.y - 80, D.lvl); log('<span style="color:#9fd0ff">Týždenná odmena:</span> 50 úlomkov a kus setu.'); }
    saveAccount();
  } else rec = recordClimb(fl, false);
  // rewards scale with the floor reached
  const x = P.x, y = P.y - 80;
  addShards(3 * fl);
  dropOre(x, y, (150 + 40 * fl) * P.stats.yieldMult);
  for (let i = 0; i < 1 + Math.floor(fl / 15); i++) dropGem(x, y, fl >= 25 ? 2 : fl >= 10 ? 1 : 0);
  for (let i = 0; i < 1 + Math.floor(fl / 10); i++) dropPickup('item', x, y, 1, generateItem(D.lvl, 'legendary'));
  const PA = P.para, up = [];
  for (const b in PA.runes || {}) {
    const r = PA.runes[b]; if (!r || !PA.rl[r] || fl < PA.rl[r]) continue;
    const n = fl >= PA.rl[r] + 10 ? 2 : 1, L0 = PA.rl[r];
    PA.rl[r] = Math.min(RUNE_MAX, L0 + n); if (PA.rl[r] > L0) up.push(`${RUNES[r].name} ${PA.rl[r]}`);
  }
  if (up.length) log(`<span style="color:#e8e2ff">Runy vylepšené:</span> ${up.join(', ')}.`);
  if (Math.random() < 0.2 + fl * 0.01) grantRune();
  if (fl >= 15 && Math.random() < 0.5) dropSet(x, y, D.lvl);
  if (fl >= 20 && mythTier() > 0 && Math.random() < 0.004 * (fl - 19) * mythMult()) dropMythic(pick(MYTHIC_LIST.filter(m => m.id !== 'voidecho')).id, x, y, D.lvl + 1);
  D.portal = { x: G.arena.x, y: G.arena.y + 160, kind: 'return', t: -1 };
  recalcStats();
  setTimeout(() => banner(`Výstup skončil · poschodie ${fl}<small>${rec ? 'Nový rekord! · ' : ''}odmeny ležia pri lodi · portál domov je otvorený</small>`), 300);
  log(`<span style="color:#9a8cff">Výstup do Prázdnoty:</span> poschodie ${fl}${rec ? ' · nový rekord' : ''}. +${3 * fl} úlomkov.`);
}
