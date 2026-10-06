'use strict';
/* ---------- world events ---------- */
const EVENT_TYPES = {
  meteor:   { name: 'Meteorický roj',  color: '#ffb347', limit: 45,  goal: 12 },
  invasion: { name: 'Invázia',         color: '#ff6b5a', limit: 75,  goal: 24 },
  convoy:   { name: 'Eskorta konvoja', color: '#7ee0a8', limit: 150, goal: 1 },
  wreck:    { name: 'Opustený vrak',   color: '#9fe6ff', limit: 90,  goal: 3 }
};
function startEvent(type) {
  if (G.dungeon || G.event) return;
  const S = curSector();
  type = type || (S.kind === 'safe' ? 'meteor' : pick(Object.keys(EVENT_TYPES)));
  if (S.kind === 'safe') type = 'meteor';
  const E = EVENT_TYPES[type], p = freeSpot(900, 650, 450), lvl = zoneLevel();
  const ev = { type, E, x: p.x, y: p.y, state: 'wait', wait: 120, t: E.limit, prog: 0, lvl, spawnT: 0 };
  if (type === 'convoy') {
    let tx, ty, tries = 0;
    do { const a = rand(0, TAU); tx = clamp(p.x + Math.cos(a) * 1500, 300, WORLD.w - 300); ty = clamp(p.y + Math.sin(a) * 1500, 300, WORLD.h - 300); tries++; }
    while ((d2(tx, ty, p.x, p.y) < 1000 * 1000 || (G.station && segD2(G.station.x, G.station.y, p.x, p.y, tx, ty) < (G.station.r + 80) ** 2)) && tries < 30);
    const hp = 320 * (1 + 0.09 * (lvl - 1)) * TIERS[G.tier].dmg;
    ev.ship = { x: p.x, y: p.y, r: 34, hp, maxHp: hp, dead: false, a: Math.atan2(ty - p.y, tx - p.x), tx, ty };
    ev.dist = Math.hypot(tx - p.x, ty - p.y);
  }
  if (type === 'wreck') ev.nodes = [0, 1, 2].map(i => { const a = i / 3 * TAU + rand(-0.3, 0.3); return { x: p.x + Math.cos(a) * 230, y: p.y + Math.sin(a) * 230, prog: 0, done: false }; });
  G.event = ev;
  banner(`<span style="color:${E.color}">${E.name}</span><small>Udalosť v sektore · leť k značke na minimape</small>`);
  log(`<span style="color:${E.color}">Udalosť: ${E.name}.</span> Leť k značke „!“.`);
}
function spawnEventPack(ev, n, target) {
  const pool = curSector().enemies || { drone: 1 };
  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do { const a = rand(0, TAU); x = target.x + Math.cos(a) * 520; y = target.y + Math.sin(a) * 520; tries++; }
    while ((x < 60 || y < 60 || x > WORLD.w - 60 || y > WORLD.h - 60 || (G.station && G.station.r && d2(x, y, G.station.x, G.station.y) < (G.station.r + 60) ** 2)) && tries < 12);
    const e = spawnEnemy(weighted(pool), x, y, ev.lvl, Math.random() < 0.08);
    e.ev = true;
    if (ev.type === 'convoy') e.tgt = ev.ship;
    ring(x, y, ev.E.color, 40, 0.4);
  }
}
function activateEvent(ev) {
  ev.state = 'active';
  if (ev.type === 'meteor') {
    for (let i = 0; i < 16; i++) {
      const a = rand(0, TAU), d = rand(60, 320);
      const ast = makeAsteroid(ev.x + Math.cos(a) * d, ev.y + Math.sin(a) * d, randi(1, 2), pick(['iron', 'crystal', 'crystal']));
      ast.ev = true; ast.vx = rand(-60, 60); ast.vy = rand(-60, 60);
      asteroids.push(ast);
    }
  }
  banner(`<span style="color:${ev.E.color}">${ev.E.name}</span><small>Udalosť začala · ${fmtTime(ev.t)} na splnenie</small>`);
}
function endEvent(success, quiet) {
  const ev = G.event; G.event = null; G.eventT = rand(80, 130);
  if (!ev) return;
  for (const e of enemies) if (e.tgt) e.tgt = null;
  if (quiet) return;
  const at = ev.ship && !ev.ship.dead ? ev.ship : ev;
  if (success) {
    dropItem(at.x, at.y, ev.lvl, 1); dropItem(at.x, at.y, ev.lvl, 1); dropItem(at.x, at.y, ev.lvl, 2);
    if (ev.type === 'wreck' && Math.random() < 0.25) dropPickup('item', at.x, at.y, 1, generateItem(ev.lvl, 'legendary'));
    dropOre(at.x, at.y, (25 + ev.lvl * 4) * P.stats.yieldMult);
    dropXp(at.x, at.y, 20 * (1 + 0.15 * (ev.lvl - 1)));
    if (curSector().kind === 'hostile' && Math.random() < 0.35) dropKey(at.x, at.y, keyBaseLevel());
    ring(at.x, at.y, ev.E.color, 220, 0.9);
    banner(`<span style="color:${ev.E.color}">${ev.E.name}</span><small>Splnené · odmena čaká na mieste</small>`);
    log(`<span style="color:#5be09a">Udalosť splnená:</span> ${ev.E.name}.`);
    contractTick('event');
    addShards(2); if (Math.random() < 0.5) dropGem(at.x, at.y, 0);
  } else {
    banner(`${ev.E.name}<small>Udalosť zlyhala</small>`);
    log(`<span style="color:#ff6b5a">Udalosť zlyhala:</span> ${ev.E.name}.`);
  }
}
function updateEvent(dt) {
  const ev = G.event;
  if (!ev) { G.eventT -= dt; if (G.eventT <= 0) { G.eventT = rand(80, 130); startEvent(); } return; }
  if (ev.state === 'wait') {
    ev.wait -= dt;
    if (ev.wait <= 0) { log(`Udalosť ${ev.E.name} pominula.`); endEvent(false, true); return; }
    if (d2(P.x, P.y, ev.x, ev.y) < 480 * 480) activateEvent(ev);
    return;
  }
  ev.t -= dt;
  if (ev.type === 'invasion') {
    ev.spawnT -= dt;
    if (ev.spawnT <= 0 && enemies.filter(e => e.ev && !e.dead).length < 10) { ev.spawnT = 5; spawnEventPack(ev, 5, ev); }
  } else if (ev.type === 'convoy') {
    const sh = ev.ship, dx = sh.tx - sh.x, dy = sh.ty - sh.y, d = Math.hypot(dx, dy);
    if (sh.hp <= 0) { sh.dead = true; burst(sh.x, sh.y, '#7ee0a8', 70, 500, 3, 1); ring(sh.x, sh.y, '#ff6b5a', 200, 0.8); shake(6); endEvent(false); return; }
    if (d < 30) { endEvent(true); return; }
    sh.a = Math.atan2(dy, dx); sh.x += dx / d * 70 * dt; sh.y += dy / d * 70 * dt;
    ev.prog = 1 - d / ev.dist;
    ev.spawnT -= dt; if (ev.spawnT <= 0) { ev.spawnT = 7; spawnEventPack(ev, 4, sh); }
  } else if (ev.type === 'wreck') {
    for (const n of ev.nodes) if (!n.done && d2(P.x, P.y, n.x, n.y) < 75 * 75) {
      n.prog += dt / 3.5;
      if (n.prog >= 1) { n.done = true; ev.prog++; ring(n.x, n.y, '#9fe6ff', 90, 0.5); log(`Uzol vraku hacknutý (${ev.prog}/3).`); }
    }
    ev.spawnT -= dt; if (ev.spawnT <= 0) { ev.spawnT = 8; spawnEventPack(ev, 4, ev); }
  }
  if (ev.type !== 'convoy' && ev.prog >= ev.E.goal) { endEvent(true); return; }
  if (ev.t <= 0) endEvent(false);
}
function drawEvent() {
  const ev = G.event; if (!ev) return;
  const col = ev.E.color, t = G.time;
  if (ev.state === 'wait') {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3);
    ctx.beginPath(); ctx.arc(ev.x, ev.y, 110 + 10 * Math.sin(t * 2), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    worldLabel(`! ${ev.E.name.toUpperCase()}`, ev.x, ev.y + 4, col, 12);
  } else if (ev.type === 'meteor' || ev.type === 'invasion') {
    ctx.strokeStyle = col + '55'; ctx.lineWidth = 1.5; ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.arc(ev.x, ev.y, 450, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  if (ev.type === 'wreck') {
    ctx.save(); ctx.translate(ev.x, ev.y); ctx.rotate(0.4);
    ctx.fillStyle = '#121a2a'; ctx.strokeStyle = '#5c6b88'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(95, -10); ctx.lineTo(60, -38); ctx.lineTo(-20, -42); ctx.lineTo(-40, -18); ctx.lineTo(-78, -30); ctx.lineTo(-92, 4); ctx.lineTo(-50, 22); ctx.lineTo(-10, 40); ctx.lineTo(70, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a475f'; ctx.beginPath(); ctx.moveTo(-40, -18); ctx.lineTo(-10, 40); ctx.moveTo(20, -42); ctx.lineTo(30, 34); ctx.stroke();
    ctx.fillStyle = Math.floor(t * 3) % 2 ? '#9fe6ff' : '#2a3c55'; ctx.fillRect(40, -6, 6, 6);
    ctx.restore();
    if (ev.state === 'active') for (const n of ev.nodes) {
      ctx.strokeStyle = n.done ? '#5be09a' : col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, 75, 0, TAU); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(n.x, n.y, 75, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, n.prog)); ctx.stroke();
      ctx.fillStyle = n.done ? '#5be09a' : col; ctx.fillRect(n.x - 5, n.y - 5, 10, 10);
    }
  }
  if (ev.ship && !ev.ship.dead) {
    const sh = ev.ship;
    if (ev.state === 'active') {
      ctx.strokeStyle = 'rgba(126,224,168,.35)'; ctx.setLineDash([6, 10]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.tx, sh.ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#7ee0a8'; ctx.beginPath(); ctx.arc(sh.tx, sh.ty, 30, 0, TAU); ctx.stroke();
    }
    ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.a);
    ctx.fillStyle = '#0f1d1a'; ctx.strokeStyle = '#7ee0a8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(30, -16); ctx.lineTo(-40, -16); ctx.lineTo(-46, 0); ctx.lineTo(-40, 16); ctx.lineTo(30, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b4a3f'; for (let i = 0; i < 4; i++) ctx.fillRect(-34 + i * 16, -11, 12, 22);
    ctx.restore();
    const w = 80, f = clamp(sh.hp / sh.maxHp, 0, 1);
    ctx.fillStyle = '#0d1a16'; ctx.fillRect(sh.x - w / 2, sh.y - 34, w, 4);
    ctx.fillStyle = f < 0.3 ? '#ff6b5a' : '#7ee0a8'; ctx.fillRect(sh.x - w / 2, sh.y - 34, w * f, 4);
  }
}

/* ---------- named hunters ---------- */
const HUNTER_TITLES = ['Pirát', 'Barón', 'Žoldnier', 'Kapitán', 'Lovec hláv'];
const HUNTER_NAMES = ['Vorgath', 'Rhask', 'Kaddor', 'Brann', 'Toller', 'Zarn', 'Malek', 'Orrin'];
const HUNTER_TRAITS = { regen: 'regenerácia', blink: 'fázové skoky', brood: 'roj dronov', barrage: 'kruhové salvy' };
function spawnHunter() {
  const p = spawnPoint(); if (!p) return null;
  const e = spawnEnemy(pick(['fighter', 'gunship', 'charger']), p.x, p.y, zoneLevel() + 2, true);
  e.hp *= 2.5; e.maxHp = e.hp; e.dmgM *= 1.2; e.r *= 1.15;
  e.hunter = { name: `${pick(HUNTER_TITLES)} ${pick(HUNTER_NAMES)}`, trait: pick(Object.keys(HUNTER_TRAITS)), t: 0, flee: 100, tT: 3, split: 2 };
  banner(`<span style="color:#ff8a5c">${e.hunter.name}</span><small>Pomenovaný lovec · ${HUNTER_TRAITS[e.hunter.trait]} · utečie o ${fmtTime(e.hunter.flee)}</small>`);
  log(`<span style="color:#ff8a5c">${e.hunter.name}</span>, pomenovaný lovec, vstúpil do sektora.`);
  return e;
}
function updateHunter(e, dt, d) {
  const H = e.hunter;
  H.t += dt; H.tT -= dt;
  if (H.trait === 'regen') e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.015 * dt);
  if (H.trait === 'blink' && H.tT <= 0 && !G.safe && d < 900) {
    H.tT = 4; ring(e.x, e.y, '#ff8a5c', 50, 0.3);
    const a = rand(0, TAU); e.x = P.x + Math.cos(a) * 260; e.y = P.y + Math.sin(a) * 260; ring(e.x, e.y, '#ff8a5c', 50, 0.3);
  }
  if (H.trait === 'barrage' && H.tT <= 0 && !G.safe && d < 700) { H.tT = 3; const o = rand(0, 0.5); for (let i = 0; i < 12; i++) enemyFire(e, o + i / 12 * TAU, 240, 6); }
  if (H.trait === 'brood' && H.split > 0 && e.hp < e.maxHp * (H.split === 2 ? 0.66 : 0.33)) {
    H.split--;
    for (let i = 0; i < 4; i++) { const m = spawnEnemy('drone', e.x + rand(-50, 50), e.y + rand(-50, 50), e.lvl - 1, false); m.minion = true; }
  }
  if (H.t > H.flee) { e.dead = true; ring(e.x, e.y, '#ff8a5c', 90, 0.6); log(`${H.name} utiekol zo sektora.`); }
}

/* ---------- station contracts ---------- */
const CONTRACTS = {
  kill:   { text: c => `Zostreľ ${c.n} nepriateľov · ${SECTORS[c.sec].name}`, n: [25, 45] },
  elite:  { text: c => `Znič ${c.n} elity`, n: [2, 4] },
  mine:   { text: c => `Rozbi ${c.n} asteroidov`, n: [25, 50] },
  gate:   { text: c => c.n === 1 ? 'Dokonči bránu s bossom' : `Dokonči ${c.n} brány s bossom`, n: [1, 2] },
  event:  { text: c => c.n === 1 ? 'Dokonči svetovú udalosť' : `Dokonči ${c.n} svetové udalosti`, n: [1, 2] },
  hunter: { text: () => 'Zlikviduj pomenovaného lovca', n: [1, 1] },
  nm:     { text: c => `Dokonči nočnú bránu úrovne ${c.lvl}+ v limite`, n: [1, 1] }
};
function makeContract() {
  const hostile = Object.keys(SECTORS).filter(id => SECTORS[id].kind === 'hostile' && (P.level >= SECTORS[id].min || G.cheat.unlock));
  const taken = (P.contracts || []).map(c => c.type);
  const pool = ['kill', 'elite', 'mine', 'gate', 'event', 'hunter'].concat(G.nmBest ? ['nm'] : []).filter(t => !taken.includes(t));
  const type = pick(pool.length ? pool : ['kill', 'mine']);
  const C = CONTRACTS[type], big = type === 'nm' || type === 'hunter';
  const c = { id: randi(1, 1e9), type, n: randi(C.n[0], C.n[1]), prog: 0, done: false };
  if (type === 'kill') c.sec = pick(hostile);
  if (type === 'nm') c.lvl = Math.max(1, G.nmBest);
  const L = P.level + TIERS[G.tier].lvl;
  c.ore = Math.round((50 + 12 * L) * (big ? 2 : 1));
  c.xp = Math.round(xpNeed(P.level) * (big ? 0.35 : 0.2));
  c.tier = big || type === 'gate' ? 2 : 1;
  c.key = type === 'nm' || Math.random() < 0.4;
  return c;
}
function ensureContracts() { P.contracts = P.contracts || []; while (P.contracts.length < 3) P.contracts.push(makeContract()); }
