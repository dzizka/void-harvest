'use strict';
/* =====================================================================
   EXPLORATION
   · Skener (C): a pulse that reveals hidden anomalies and ancestor beacons.
   · Anomálie: wrecks, crystal anomalies and data cores, regenerated on
     every visit to a sector; fly there and press E.
   · Majáky predkov: 14 fixed beacons (2 per combat sector, 1 per safe one).
     Activating one gives a permanent account-wide bonus.
   · Prírodné hrozby: solar flares (hide behind an asteroid), black holes
     and radiation clouds (shield drain, +25 % damage inside).
   ===================================================================== */
const SCAN_R = 1400, SCAN_CD = 8;
const ANOMS = {
  wreck:   { name: _L('Vrak lode'),           color: '#c8a27c', txt: _L('Prehľadať vrak') },
  crystal: { name: _L('Kryštalická anomália'), color: '#6fe3ff', txt: _L('Vyťažiť anomáliu') },
  core:    { name: _L('Dátové jadro'),        color: '#9a8cff', txt: _L('Stiahnuť dáta') }
};
const BEACON_BONUS = [
  { k: 'allDmg', v: 1, txt: _L('+1 % všetko poškodenie') },
  { k: 'hull',   v: 2, txt: _L('+2 % pevnosť trupu') },
  { k: 'yield',  v: 3, txt: _L('+3 % výnos ťažby') },
  { k: 'xp',     v: 2, txt: _L('+2 % XP') },
  { k: 'shield', v: 2, txt: _L('+2 % kapacita štítu') },
  { k: 'speed',  v: 1, txt: _L('+1 % rýchlosť pohybu') },
  { k: 'crit',   v: 0.5, txt: _L('+0,5 % kritická šanca') }
];
const SECTOR_HAZ = { kepler: [], ruby: ['rad'], vex: ['flare'], baria: ['hole'], hercules: ['flare', 'hole'], rim: ['flare', 'hole', 'rad'] };
const HAZ_NAMES = { flare: _L('slnečné erupcie'), hole: _L('čierne diery'), rad: _L('radiačné mraky') };

/* ---------- beacons ---------- */
function beaconList(id) {
  const S = SECTORS[id], n = S.kind === 'hostile' ? 2 : 1, r = seeded('beacon' + id), out = [];
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = S.size * (0.22 + r() * 0.22); out.push({ id: id + ':' + i, x: S.size / 2 + Math.cos(a) * d, y: S.size / 2 + Math.sin(a) * d, b: BEACON_BONUS[(Object.keys(SECTORS).indexOf(id) * 2 + i) % BEACON_BONUS.length] }); }
  return out;
}
const beaconOn = id => !!(ACC && ACC.beacons && ACC.beacons[id]);
const beaconTotal = () => Object.keys(SECTORS).reduce((a, id) => a + beaconList(id).length, 0);
function beaconFx(s, p) {
  if (!ACC || !ACC.beacons) return;
  for (const id of Object.keys(SECTORS)) for (const B of beaconList(id)) if (ACC.beacons[B.id]) {
    const b = B.b; if (b.k === 'xp') s.xpMult += b.v / 100; else p[b.k] += b.v;
  }
}
function activateBeacon(B) {
  ACC.beacons = ACC.beacons || {}; if (ACC.beacons[B.id]) return;
  ACC.beacons[B.id] = true; ACC.st.beacons = Object.keys(ACC.beacons).length; saveAccount(); gameEvent('beacon', { sec: G.sector });
  addShards(10); recalcStats();
  ring(B.x, B.y, '#ffd36b', 420, 1.1); burst(B.x, B.y, '#ffd36b', 80, 520, 2.6, 0.9); shake(6);
  banner(_T`<span style="color:#ffd36b">Maják predkov</span><small>${B.b.txt} pre všetky lode · ${Object.keys(ACC.beacons).length}/${beaconTotal()}</small>`);
  log(_T`<span style="color:#ffd36b">Maják predkov aktivovaný:</span> ${B.b.txt} (natrvalo, všetky lode).`);
}

/* ---------- sector setup ---------- */
function initExploration() {
  const X = G.ex = { anoms: [], seen: {}, scan: null, scanCd: 0, flareT: rand(40, 70), flare: null, holeT: rand(50, 80), hole: null, rad: [] };
  if (G.dungeon) return;
  const S = curSector(), id = G.sector;
  const n = S.kind === 'hostile' ? randi(3, 5) : 2;
  for (let i = 0; i < n; i++) {
    const p = freeSpot((G.station ? G.station.r : 0) + 450, 500, 250);
    X.anoms.push({ ...p, kind: S.kind === 'hostile' ? weighted({ wreck: 5, crystal: 3, core: 2 }) : weighted({ crystal: 2, core: 1 }), found: false, done: false });
  }
  if ((SECTOR_HAZ[id] || []).includes('rad')) {
    const r = seeded('rad' + id);
    for (let i = 0; i < 4; i++) { const a = r() * TAU, d = S.size * (0.2 + r() * 0.25); X.rad.push({ x: S.size / 2 + Math.cos(a) * d, y: S.size / 2 + Math.sin(a) * d, r: 260 + r() * 180 }); }
  }
}
const sunAngle = () => seeded('sun' + G.sector)() * TAU;
const hazOn = k => !G.dungeon && (SECTOR_HAZ[G.sector] || []).includes(k);
const inRadiation = () => !!(G.ex && G.ex.rad.some(z => d2(P.x, P.y, z.x, z.y) < z.r * z.r));

/* ---------- per frame ---------- */
function tickExploration(dt) {
  if (!G.ex) initExploration();
  const X = G.ex, s = P.stats;
  X.scanCd -= dt;
  if (input.scan) {
    input.scan = false;
    if (X.scanCd <= 0 && !G.dungeon) { X.scanCd = SCAN_CD; X.scan = { x: P.x, y: P.y, r: 0, max: SCAN_R * (s.scanMul || 1) }; }
  }
  if (X.scan) {
    X.scan.r += X.scan.max * 0.85 * dt;
    for (const a of X.anoms) if (!a.found && d2(a.x, a.y, X.scan.x, X.scan.y) < X.scan.r * X.scan.r) { a.found = true; addText(a.x, a.y - 30, ANOMS[a.kind].name.toUpperCase(), ANOMS[a.kind].color, 12, 1.4); ring(a.x, a.y, ANOMS[a.kind].color, 90, 0.6); }
    for (const B of beaconList(G.sector)) if (!X.seen[B.id] && d2(B.x, B.y, X.scan.x, X.scan.y) < X.scan.r * X.scan.r) { X.seen[B.id] = true; if (!beaconOn(B.id)) addText(B.x, B.y - 40, _L('MAJÁK PREDKOV'), '#ffd36b', 13, 1.6); }
    if (X.scan.r >= X.scan.max) X.scan = null;
  }
  // a beacon is also noticed when you fly close
  for (const B of beaconList(G.sector)) if (!X.seen[B.id] && d2(B.x, B.y, P.x, P.y) < 380 * 380) X.seen[B.id] = true;
  if (G.dungeon || curSector().kind !== 'hostile') return;
  // radiation: shield drains, damage is boosted
  if (inRadiation() && !G.safe) {
    P.shield = Math.max(0, P.shield - s.maxShield * 0.06 * dt); P.radT = 0.25;
    if (!X.radMsg) { X.radMsg = true; log(_L('<span style="color:#9be36b">Radiačný mrak:</span> štít sa vybíja, ale dávaš +25 % poškodenia.')); }
  }
  // solar flares
  if (hazOn('flare')) {
    if (!X.flare && (X.flareT -= dt) <= 0) { X.flare = { state: 'warn', t: 4, a: sunAngle() }; banner(_L('<span style="color:#ffcf6e">Slnečná erupcia</span><small>o 4 s · schovaj sa za asteroid alebo do bezpečnej zóny</small>')); }
    const F = X.flare;
    if (F) {
      F.t -= dt;
      if (F.state === 'warn' && F.t <= 0) { F.state = 'burst'; F.t = 0.6; flareHit(F.a); }
      else if (F.state === 'burst' && F.t <= 0) { X.flare = null; X.flareT = rand(60, 95); }
    }
  }
  // black holes
  if (hazOn('hole')) {
    if (!X.hole && (X.holeT -= dt) <= 0) {
      const a = rand(0, TAU), d = rand(350, 650);
      X.hole = { x: clamp(P.x + Math.cos(a) * d, 300, WORLD.w - 300), y: clamp(P.y + Math.sin(a) * d, 300, WORLD.h - 300), t: 24, warn: 2.5, r: 700 };
      log(_L('<span style="color:#b48cff">Gravitačná anomália!</span> Otvára sa čierna diera – drž sa od stredu.'));
    }
    const H = X.hole;
    if (H) {
      if (H.warn > 0) H.warn -= dt;
      else {
        H.t -= dt;
        const pull = (o, k) => { const dx = H.x - o.x, dy = H.y - o.y, d = Math.hypot(dx, dy) || 1; if (d < H.r) { const f = (1 - d / H.r) * k * dt; o.x += dx / d * f; o.y += dy / d * f; } return d; };
        if (!G.safe) {
          const d = pull(P, 260);
          if (d < 80 && (H.hurtT = (H.hurtT || 0) - dt) <= 0) { H.hurtT = 0.25; hurtPlayer(s.maxHull * 0.03 + s.maxShield * 0.03); }
        }
        for (const e of enemies) { if (e.dead || e.isBoss) continue; const d = pull(e, 320); if (d < 90) damageEnemy(e, e.maxHp * 0.25 * dt, false, true); }
        for (const a of asteroids) pull(a, 160);
        for (const p of pickups) pull(p, 300);
        if (Math.random() < 0.8) { const a = rand(0, TAU), r = rand(120, H.r * 0.7); particles.push({ x: H.x + Math.cos(a) * r, y: H.y + Math.sin(a) * r, vx: -Math.sin(a) * 160 - Math.cos(a) * 90, vy: Math.cos(a) * 160 - Math.sin(a) * 90, life: 0.8, max: 0.8, size: 2, color: '#b48cff', drag: 0 }); }
        if (H.t <= 0) { X.hole = null; X.holeT = rand(70, 110); ring(H.x, H.y, '#b48cff', 300, 0.8); }
      }
    }
  }
}
// is the pilot shielded from the sun by an asteroid?
function sheltered(a) {
  const ux = Math.cos(a), uy = Math.sin(a);
  return asteroids.some(o => { if (o.dead) return false; const t = (o.x - P.x) * ux + (o.y - P.y) * uy; if (t < 0 || t > 900) return false; const px = P.x + ux * t, py = P.y + uy * t; return d2(o.x, o.y, px, py) < (o.r * 0.95) ** 2; });
}
function flareHit(a) {
  const s = P.stats;
  shake(8);
  if (G.safe) { log(_L('Erupciu zachytila bariéra bezpečnej zóny.')); }
  else if (sheltered(a)) { addText(P.x, P.y - 34, _L('KRYTÝ'), '#ffcf6e', 14, 1); }
  else { hurtPlayer((s.maxShield + s.maxHull) * 0.3); addText(P.x, P.y - 34, _L('ERUPCIA'), '#ffcf6e', 14, 1); }
  for (const e of enemies) if (!e.dead && !e.isBoss && d2(e.x, e.y, P.x, P.y) < 1600 * 1600) damageEnemy(e, e.maxHp * 0.2, false, true);
}

/* ---------- interaction ---------- */
function explorationInteract() {
  if (!G.ex || G.dungeon) return null;
  for (const a of G.ex.anoms) if (a.found && !a.done && d2(a.x, a.y, P.x, P.y) < 110 * 110)
    return { txt: ANOMS[a.kind].txt, sub: ANOMS[a.kind].name, col: ANOMS[a.kind].color, act: () => openAnomaly(a) };
  for (const B of beaconList(G.sector)) if (!beaconOn(B.id) && G.ex.seen[B.id] && d2(B.x, B.y, P.x, P.y) < 130 * 130)
    return { txt: _L('Aktivovať maják predkov'), sub: B.b.txt + _L(' · natrvalo pre všetky lode'), col: '#ffd36b', act: () => activateBeacon(B) };
  return null;
}
function openAnomaly(a) {
  a.done = true; ACC.st.anoms = (ACC.st.anoms || 0) + 1; gameEvent('anom', { kind: a.kind, sec: G.sector });
  const L = zoneLevel() + 1, sk = SECTOR_MAT[G.sector];
  if (a.kind === 'wreck') {
    dropOre(a.x, a.y, (30 + L * 4) * P.stats.yieldMult); dropItem(a.x, a.y, L, 2); if (Math.random() < 0.5) dropItem(a.x, a.y, L, 1);
    dropMat(a.x, a.y, 'iron', randi(3, 6)); if (sk) dropMat(a.x, a.y, sk, randi(1, 3));
    if (curSector().kind === 'hostile' && Math.random() < 0.3) {
      const pool = curSector().enemies;
      for (let i = 0; i < 5; i++) { const g = i / 5 * TAU; spawnEnemy(weighted(pool), a.x + Math.cos(g) * 260, a.y + Math.sin(g) * 260, zoneLevel() + 1, i === 0); }
      banner(_L('<span style="color:#ff6b5a">Prepadnutie!</span><small>Vrak bol návnada</small>'));
    } else log(_L('Vrak prehľadaný.'));
  } else if (a.kind === 'crystal') {
    dropMat(a.x, a.y, 'crystal', randi(6, 10)); if (sk) dropMat(a.x, a.y, sk, randi(2, 4));
    if (Math.random() < 0.4) dropGem(a.x, a.y, Math.random() < 0.25 ? 1 : 0);
    log(_L('Kryštalická anomália vyťažená.'));
  } else {
    if (P.level < LEVEL_CAP) gainXp(xpNeed(P.level) * 0.04 / (P.stats.xpMult * TIERS[G.tier].xp)); addShards(3);
    for (const o of G.ex.anoms) o.found = true;
    for (const B of beaconList(G.sector)) G.ex.seen[B.id] = true;
    log(_L('Dátové jadro stiahnuté: mapa sektora odhalená.'));
  }
  ring(a.x, a.y, ANOMS[a.kind].color, 160, 0.6); burst(a.x, a.y, ANOMS[a.kind].color, 40, 360, 2.4, 0.6);
}

/* ---------- drawing ---------- */
function drawExploration() {
  const X = G.ex; if (!X || G.dungeon) return;
  const t = G.time;
  for (const z of X.rad) {
    if (!egVis(z.x, z.y, z.r)) continue;
    const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
    g.addColorStop(0, 'rgba(155,227,107,.16)'); g.addColorStop(1, 'rgba(155,227,107,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(155,227,107,.35)'; ctx.setLineDash([6, 10]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const a of X.anoms) {
    if (!a.found || a.done || !egVis(a.x, a.y, 80)) continue;
    const A = ANOMS[a.kind];
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(t * 0.6);
    ctx.strokeStyle = A.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
    ctx.beginPath(); for (let i = 0; i < 5; i++) { const g = i / 5 * TAU, r = 18 + (i % 2) * 8; i ? ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r) : ctx.moveTo(r, 0); } ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 4); ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
    worldLabel(A.name.toUpperCase(), a.x, a.y + 46, A.color, 10);
  }
  for (const B of beaconList(G.sector)) {
    if (!X.seen[B.id] || !egVis(B.x, B.y, 120)) continue;
    const on = beaconOn(B.id), col = on ? '#7f8ca8' : '#ffd36b';
    ctx.save(); ctx.translate(B.x, B.y);
    ctx.strokeStyle = col; ctx.fillStyle = '#0b1424'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(18, 0); ctx.lineTo(0, 40); ctx.lineTo(-18, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!on) { ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2); ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.stroke(); ctx.fillStyle = col; ctx.globalAlpha = 0.8; ctx.fillRect(-3, -3, 6, 6); }
    ctx.restore(); ctx.globalAlpha = 1;
    worldLabel(on ? _L('MAJÁK PREDKOV · AKTÍVNY') : _L('MAJÁK PREDKOV'), B.x, B.y + 60, col, 10);
  }
  const H = X.hole;
  if (H) {
    const k = H.warn > 0 ? 1 - H.warn / 2.5 : 1;
    ctx.save(); ctx.translate(H.x, H.y);
    ctx.globalAlpha = 0.9 * k; ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(0, 0, 60 * k, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b48cff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.8 * k; ctx.beginPath(); ctx.arc(0, 0, 66 * k, 0, TAU); ctx.stroke();
    ctx.rotate(t * 1.5); ctx.globalAlpha = 0.35 * k; ctx.lineWidth = 6;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 110 + i * 60, i, i + 2.2); ctx.stroke(); }
    ctx.globalAlpha = 0.15; ctx.lineWidth = 1.5; ctx.setLineDash([10, 14]); ctx.beginPath(); ctx.arc(0, 0, H.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  const Sc = X.scan;
  if (Sc) { ctx.strokeStyle = '#5fd4ff'; ctx.globalAlpha = 0.6 * (1 - Sc.r / Sc.max); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(Sc.x, Sc.y, Sc.r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
}
function drawHazardOverlay(W, H, dpr) {
  const X = G.ex; if (!X || !X.flare) return;
  const F = X.flare;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sx = W / 2 + Math.cos(F.a) * W * 0.6, sy = H / 2 + Math.sin(F.a) * H * 0.6;
  if (F.state === 'warn') {
    const k = 1 - F.t / 4, g = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * (0.4 + 0.4 * k));
    g.addColorStop(0, `rgba(255,214,120,${0.35 + 0.4 * k})`); g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.font = '700 13px "JetBrains Mono", monospace'; ctx.fillStyle = '#ffcf6e';
    ctx.fillText(_T`☀ ERUPCIA ${F.t.toFixed(1)} s`, W / 2, H * 0.36);
  } else { ctx.fillStyle = `rgba(255,236,190,${F.t / 0.6 * 0.7})`; ctx.fillRect(0, 0, W, H); }
}
function drawMinimapExplore(k) {
  const X = G.ex; if (!X || G.dungeon) return;
  for (const a of X.anoms) if (a.found && !a.done) { mctx.strokeStyle = ANOMS[a.kind].color; mctx.lineWidth = 1.2; mctx.beginPath(); mctx.arc(a.x * k, a.y * k, 3, 0, TAU); mctx.stroke(); }
  for (const B of beaconList(G.sector)) if (X.seen[B.id]) { mctx.fillStyle = beaconOn(B.id) ? '#7f8ca8' : '#ffd36b'; mctx.beginPath(); mctx.moveTo(B.x * k, B.y * k - 4); mctx.lineTo(B.x * k + 3, B.y * k); mctx.lineTo(B.x * k, B.y * k + 4); mctx.lineTo(B.x * k - 3, B.y * k); mctx.fill(); }
  for (const z of X.rad) { mctx.strokeStyle = 'rgba(155,227,107,.5)'; mctx.beginPath(); mctx.arc(z.x * k, z.y * k, z.r * k, 0, TAU); mctx.stroke(); }
  if (X.hole && X.hole.warn <= 0) { mctx.fillStyle = '#b48cff'; mctx.beginPath(); mctx.arc(X.hole.x * k, X.hole.y * k, 3, 0, TAU); mctx.fill(); }
}
