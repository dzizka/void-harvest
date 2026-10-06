'use strict';
/* =====================================================================
   4. ENTITIES & STATE
   ===================================================================== */
const canvas = $('game'), ctx = canvas.getContext('2d');
const mini = $('minimap'), mctx = mini.getContext('2d');
const view = { w: innerWidth, h: innerHeight, dpr: 1, zoom: 1 };
const cam = { x: WORLD.w / 2, y: WORLD.h / 2 };
const input = { keys: {}, mx: innerWidth / 2, my: innerHeight / 2, fire: false, missile: false };

let G = null;   // game state
let P = null;   // player
let asteroids = [], enemies = [], bullets = [], ebullets = [], missiles = [], pickups = [], particles = [], texts = [], trails = [];
let allies = [], orbs = [], echoes = [];   // mythic effects
let hazards = [];                          // nightmare blasts and fire zones

function createPlayer(cls) {
  const c = CLASSES[cls];
  const equip = {};
  for (const slot of SLOT_ORDER) equip[slot] = generateItem(1, 'common', slot, c.start[slot]);
  const p = { cls, x: 0, y: 0, vx: 0, vy: 0, a: -Math.PI / 2, r: 16,
    hull: 0, shield: 0, lastHit: -99, fireT: 0, missileT: 0, novaT: 0, auraT: 0, wakeT: 0, wakeTick: 0,
    level: 1, xp: 0, points: 0, ore: 0, equip, inv: [], tal: {}, stats: null, thrust: 0, hitFlash: 0, shieldFlash: 0, contactT: 0, bestItem: null,
    heat: 0, idle: 0, oreStacks: 0, oreStackT: 0, crystal: 0, dashT: 0, dashCd: 0, dashA: 0, dashHit: null, shotCount: 0, forceCrit: 0, auraBoostT: 0, barrage: null, autoT: null, keys: [],
    stasisT: 0, stasisCd: 0, thornT: 0, kamiT: 6, drones: [], shards: 0, gems: {}, stash: [],
    para: { lvl: 0, pts: 0, alloc: {}, inf: 0 }, frags: {}, crownT: 10,
    talV: 2, tut: 0, tutP: 0, rhythm: 0, ghostT: 0, dodgeBlastT: 0, rockStacks: 0, rockT: 0, goldT: 0, goldAcc: 0, jThornT: 0, unbrokenT: 0, oshield: 0, pulseT: 3, detT: 8, titanT: 1.5 };
  ensureGems(p);
  p.stats = computeStats(cls, equip, p.tal, 1, p.para);
  p.hull = p.stats.maxHull; p.shield = p.stats.maxShield;
  return p;
}
function ensureGems(pl) { pl.gems = pl.gems || {}; for (const t in GEMS) if (!pl.gems[t]) pl.gems[t] = [0, 0, 0]; }
function addShards(n) { P.shards += n; addText(P.x, P.y - 34, `+${n} úlomkov`, '#9a8cff', 11, 0.7); }
function dropGem(x, y, q) {
  const a = rand(0, TAU);
  pickups.push({ kind: 'gem', gem: { t: pick(Object.keys(GEMS)), q }, x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, amount: 1, t: 0, spin: 0, dead: false });
}
function recalcStats() {
  const old = P.stats;
  P.stats = computeStats(P.cls, P.equip, P.tal, P.level);
  if (P.stats.maxHull > old.maxHull) P.hull += P.stats.maxHull - old.maxHull;
  P.hull = Math.min(P.hull, P.stats.maxHull);
  P.shield = Math.min(P.shield, P.stats.maxShield);
}
const xpNeed = lvl => Math.round(40 * Math.pow(lvl, 1.8));
const curSector = () => SECTORS[G.sector];
// hostile sectors get harder the farther you fly from the central beacon (+0 … +3 levels)
function depthAt(x, y) {
  if (!G || G.dungeon || !G.station || curSector().kind !== 'hostile') return 0;
  const d = Math.sqrt(d2(x, y, G.station.x, G.station.y));
  return d < 900 ? 0 : clamp(Math.floor((d - 900) / 500) + 1, 1, 3);
}
const DEPTH_NAME = ['Okraj majáka', 'Hlbina I', 'Hlbina II', 'Hlbina III'];
function zoneLevel() {
  if (!G || !P) return 1;
  if (G.dungeon) return G.dungeon.lvl;
  const S = curSector();
  return (S.kind === 'safe' ? Math.max(S.min, P.level - 1) : clamp(P.level, S.min, S.max)) + TIERS[G.tier].lvl;
}
// whole-sector safety (Haven, Tessar) or inside an outpost's beacon bubble
function isSafe() {
  if (G.dungeon) return false;
  if (curSector().kind === 'safe') return true;
  return !!G.station && d2(P.x, P.y, G.station.x, G.station.y) < G.station.r * G.station.r;
}

function makeAsteroid(x, y, size, kind, weights) {
  if (!kind && size >= 2 && G && G.sector === 'tessar' && !G.dungeon && Math.random() < 0.02) kind = 'radiant';
  kind = kind || weighted(weights || { rock: 60, iron: 30, crystal: 10 });
  const S = AST_SIZE[size], K = AST_KINDS[kind];
  const r = rand(S.r[0], S.r[1]);
  const n = randi(9, 13), verts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.18, 0.18); verts.push([Math.cos(a) * r * rand(0.74, 1.08), Math.sin(a) * r * rand(0.74, 1.08)]); }
  const veins = [];
  if (K.vein) for (let i = 0; i < size + 1; i++) { const a = rand(0, TAU), rr = rand(0.1, 0.5) * r; const b = a + rand(-1, 1); veins.push([Math.cos(a) * rr, Math.sin(a) * rr, Math.cos(b) * rr * 1.6, Math.sin(b) * rr * 1.6]); }
  const hp = S.hp * K.hp * (1 + 0.08 * (zoneLevel() - 1));
  return { x, y, vx: rand(-18, 18), vy: rand(-18, 18), r, size, kind, K, hp, maxHp: hp, rot: rand(0, TAU), spin: rand(-0.4, 0.4), verts, veins, flash: 0 };
}

const ELITE_MODS = {
  fast:     { name: 'Rýchly',       color: '#7fe3ff' },
  burning:  { name: 'Ohnivý',       color: '#ff8a3c' },
  shielded: { name: 'Štítový',      color: '#6fb8ff' },
  blink:    { name: 'Teleportér',   color: '#c77dff' },
  regen:    { name: 'Regenerujúci', color: '#5be09a' },
  frost:    { name: 'Mrazivý',      color: '#bfefff' },
  volatile: { name: 'Výbušný',      color: '#ff5f6d' }
};
function rollEliteMods(e) {
  const n = Math.min(3, 1 + (e.lvl >= 20 ? 1 : 0) + (G.tier >= 3 ? 1 : 0));
  const ids = Object.keys(ELITE_MODS);
  for (let i = ids.length - 1; i > 0; i--) { const j = randi(0, i); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  e.mods = ids.slice(0, n);
  if (e.mods.includes('fast')) e.speedM *= 1.4;
  if (e.mods.includes('shielded')) { e.esh = e.maxHp * 0.35; e.eshMax = e.esh; }
  e.modT = rand(1, 3);
}
function eliteModsTick(e, dt, d) {
  const m = e.mods;
  e.modT -= dt;
  if (m.includes('burning') && e.modT <= 0) {
    e.modT = 0.5;
    if (hazards.length < 90) hazards.push({ kind: 'fire', x: e.x, y: e.y, r: 40, t: 0.4, t0: 0.4, life: 2.2, tick: 0, dps: 9 * e.dmgM });
  }
  if (m.includes('shielded') && G.time - (e.lastHitT || 0) > 4) e.esh = Math.min(e.eshMax, e.esh + e.eshMax * 0.25 * dt);
  if (m.includes('regen')) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02 * dt);
  if (m.includes('blink')) {
    e.blinkT = (e.blinkT == null ? rand(2, 4) : e.blinkT) - dt;
    if (e.blinkT <= 0 && d < 900 && !G.safe) {
      e.blinkT = rand(4, 5.5);
      ring(e.x, e.y, '#c77dff', 40, 0.3);
      const a = rand(0, TAU), r = rand(170, 240);
      e.x = P.x + Math.cos(a) * r; e.y = P.y + Math.sin(a) * r; e.vx = e.vy = 0;
      ring(e.x, e.y, '#c77dff', 60, 0.4); burst(e.x, e.y, '#c77dff', 14, 220, 2, 0.4);
    }
  }
}
function spawnEnemy(type, x, y, lvl, elite) {
  const T = ENEMY_TYPES[type];
  lvl = Math.max(1, lvl);
  const W = TIERS[G ? (G.dungeon && G.dungeon.climb ? 1 : G.dungeon && G.dungeon.rush ? 4 : G.tier) : 1];   // the climb ignores world tier so records compare fairly
  // HP grows exponentially (player damage stacks multiplicatively); damage grows linearly (player defense is mostly additive)
  const NM = G && G.dungeon && G.dungeon.nm, CL = G && G.dungeon && G.dungeon.climb ? climbScale(G.dungeon.floor) : null;
  const hpM = Math.pow(1.10, lvl - 1) * (elite ? 3.2 : 1) * (CL ? CL.hp : 1) * W.hp * (elite || type === 'boss' ? W.elite || 1 : W.trash || 1) * (NM ? NM.sc.hp : 1) * (nmHas('fortified') && (elite || type === 'boss') ? 1.6 : 1);
  const e = { type, T, x, y, vx: 0, vy: 0, a: 0, hp: T.hp * hpM, maxHp: T.hp * hpM, lvl, elite,
    dmgM: (1 + 0.09 * (lvl - 1)) * (elite ? 1.3 : 1) * W.dmg * (NM ? NM.sc.dmg : 1) * (CL ? CL.dmg : 1), speedM: (elite ? 1.1 : 1) * (nmHas('swift') ? 1.3 : 1), r: T.r * (elite ? 1.35 : 1),
    fireT: rand(1, 2.2), burst: 0, state: 'seek', stateT: 0, dashA: 0, orbit: Math.random() < 0.5 ? 1 : -1,
    flash: 0, contactT: 0, dead: false, spin: 0, roam: null, patClock: 0 };
  if (elite && type !== 'boss' && lvl >= 3 && G) rollEliteMods(e);
  enemies.push(e);
  return e;
}
