'use strict';
function update(dt) {
  G.time += dt;
  if (G.intro && ((G.intro.t -= dt) <= 0 || G.intro.e.dead)) G.intro = null;
  if (G.freezeT > 0) G.freezeT -= dt;
  G.safe = isSafe();
  G.bubble = G.safe && curSector().kind === 'hostile';
  if (G.safe !== G.wasSafe && !G.dungeon && curSector().kind === 'hostile') {
    log(G.safe ? _L('<span style="color:#5fd4ff">Vstup do bezpečnej zóny.</span> Zbrane neprestrelia bariéru.') : _L('<span style="color:#ff6b5a">Opúšťaš bezpečnú zónu.</span>'));
    G.wasSafe = G.safe;
  }
  updatePlayer(dt);
  updateAbilities(dt);
  if (G.dungeon) dungeonDirector(dt); else { director(dt); updateEvent(dt); }
  updateAsteroids(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updateEnemyBullets(dt);
  updateMissiles(dt);
  updatePickups(dt);
  updateMythic(dt);
  updateHazards(dt);
  updateDrones(dt);
  updateMinions(dt);
  tickWorldBoss(dt);
  tickStorm(dt);
  tickBaseAll(dt);
  tickExploration(dt);
  tickStory(dt);
  if (!G.dungeon) tickFort(dt);
  updateTrails(dt);
  if (asteroids.some(a => a.dead)) asteroids = asteroids.filter(a => !a.dead);
  if (enemies.some(e => e.dead)) enemies = enemies.filter(e => !e.dead);
  updateInteract();
}

function confineArena(o, r, bounce) {
  const A = G.arena; if (!A) return;
  const dx = o.x - A.x, dy = o.y - A.y, d = Math.hypot(dx, dy), lim = A.r - r;
  if (d > lim && d > 0) {
    const nx = dx / d, ny = dy / d;
    o.x = A.x + nx * lim; o.y = A.y + ny * lim;
    const vn = o.vx * nx + o.vy * ny;
    if (vn > 0) { o.vx -= (1 + bounce) * vn * nx; o.vy -= (1 + bounce) * vn * ny; }
  }
}

function updatePlayer(dt) {
  const s = P.stats, k = input.keys;
  let ix = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  let iy = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
  P.thrust = 0;
  if (ix || iy) { const l = Math.hypot(ix, iy); ix /= l; iy /= l; P.vx += ix * s.accel * dt; P.vy += iy * s.accel * dt; P.thrust = 1; }
  if (P.dashT > 0) { P.vx = Math.cos(P.dashA) * 1150; P.vy = Math.sin(P.dashA) * 1150; }
  const drag = P.dashT > 0 || P.ramT > 0 ? 1 : Math.pow(P.thrust ? 0.6 : 0.3, dt);
  P.vx *= drag; P.vy *= drag;
  const sp = Math.hypot(P.vx, P.vy);
  P.chillT = (P.chillT || 0) - dt;
  const cap = P.dashT > 0 ? 1150 : P.ramT > 0 ? 1050 : P.magT > 1.8 ? 820 : s.speed * (s.legend.afterburner && G.time - P.lastHit > 3 ? 1.25 : 1) * (P.chillT > 0 ? 0.65 : 1);
  if (sp > cap) { P.vx *= cap / sp; P.vy *= cap / sp; }
  P.x += P.vx * dt; P.y += P.vy * dt;
  P.rib = P.rib || [];
  P.rib.push({ x: P.x - Math.cos(P.a) * 16, y: P.y - Math.sin(P.a) * 16 });
  if (P.rib.length > 16) P.rib.shift();
  if (P.x < P.r) { P.x = P.r; P.vx = Math.abs(P.vx) * 0.5; }
  if (P.y < P.r) { P.y = P.r; P.vy = Math.abs(P.vy) * 0.5; }
  if (P.x > WORLD.w - P.r) { P.x = WORLD.w - P.r; P.vx = -Math.abs(P.vx) * 0.5; }
  if (P.y > WORLD.h - P.r) { P.y = WORLD.h - P.r; P.vy = -Math.abs(P.vy) * 0.5; }
  confineArena(P, P.r, 0.5);
  // aiming: held LMB = manual mouse aim; otherwise auto-combat / auto-mining picks a target
  const tgt = input.fire ? null : autoTarget();
  P.autoAim = tgt;
  if (tgt) {
    const lead = Math.sqrt(d2(tgt.x, tgt.y, P.x, P.y)) / 980;
    P.a = Math.atan2(tgt.y + (tgt.vy || 0) * lead - P.y, tgt.x + (tgt.vx || 0) * lead - P.x);
  } else {
    const mw = mouseWorld();
    P.a = Math.atan2(mw.y - P.y, mw.x - P.x);
  }
  const firing = input.fire || !!tgt;
  if (P.thrust && Math.random() < 0.8) {
    const ba = Math.atan2(-iy, -ix) + rand(-0.3, 0.3);
    particles.push({ x: P.x - Math.cos(P.a) * 14, y: P.y - Math.sin(P.a) * 14, vx: Math.cos(ba) * 160 + P.vx * 0.4, vy: Math.sin(ba) * 160 + P.vy * 0.4, life: 0.3, max: 0.3, size: 2.2, color: CLASSES[P.cls].color, drag: 3 });
  }
  P.fireT -= dt;
  if (firing) { P.heat = Math.min(15, P.heat + dt); P.idle = 0; } else if ((P.idle += dt) > 1) P.heat = 0;
  const rate = s.fireRate * (s.legend.overheat ? 1 + Math.min(0.6, P.heat * 0.04) : 1) * (P.goldT > 0 ? 1.2 : 1) * (P.hasteT > 0 ? 1.3 : 1) * (1 + hb('fr'));
  if (firing && P.fireT <= 0) { fireLaser(); P.fireT = Math.max(P.fireT, -0.05) + 1 / rate; }
  if (P.fireT < 0 && !firing) P.fireT = 0;
  P.missileT -= dt;
  if (input.missile && P.missileT <= 0) { fireMissiles(); P.missileT = s.missileCd; }
  else if (tgt && tgt.T && P.missileT <= 0) { fireMissiles(tgt); P.missileT = s.missileCd; }
  if (P.barrage && (P.barrage.t -= dt) <= 0) { const t = P.barrage.target; P.barrage = null; fireMissiles(t && !t.dead ? t : null, 0.6); }
  // regeneration — every safe zone doubles as a repair dock
  if (G.safe) {
    P.shield = Math.min(s.maxShield, P.shield + Math.max(s.shieldRegen * 3, s.maxShield * 0.15) * dt);
    P.hull = Math.min(s.maxHull, P.hull + s.maxHull * 0.06 * dt);
  } else {
    if ((P.radT = (P.radT || 0) - dt) <= 0 && G.time - P.lastHit > s.shieldDelay) P.shield = Math.min(s.maxShield, P.shield + s.shieldRegen * dt * (nmHas('noRegen') ? 0.25 : 1));
    P.hull = Math.min(s.maxHull, P.hull + s.maxHull * 0.004 * dt);
  }
  P.hitFlash -= dt; P.shieldFlash -= dt; P.novaT -= dt; P.contactT -= dt;
  P.dashT -= dt; P.dashCd -= dt; P.auraBoostT -= dt;
  P.stasisT -= dt; P.stasisCd -= dt; P.thornT -= dt; P.kamiT -= dt;
  P.crownT -= dt;
  P.ghostT -= dt; P.dodgeBlastT -= dt; P.goldT -= dt; P.jThornT -= dt; P.unbrokenT -= dt;
  if ((P.rockT -= dt) <= 0) P.rockStacks = 0;
  if (P.oshield > 0) P.oshield = Math.max(0, P.oshield - s.maxShield * 0.03 * dt);
  if (s.legend.crown && P.crownT <= 0 && !G.safe && enemies.length) { P.crownT = 10; G.freezeT = 2 * mres('crown'); ring(P.x, P.y, '#cfe6ff', 420, 0.6); }
  if ((P.oreStackT -= dt) <= 0) P.oreStacks = 0;
  if (P.dashT > 0) {
    for (const e of enemies) if (!e.dead && !P.dashHit.has(e) && d2(e.x, e.y, P.x, P.y) < (e.r + 28) ** 2) { P.dashHit.add(e); damageEnemy(e, s.laserHit * 3 * dmgBuff() * mres('phaseCut'), true); }
    particles.push({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 6, color: '#e14bff', drag: 0 });
  }
  // juggernaut aura (it cannot reach across a safe-zone barrier)
  if (s.aura) {
    P.auraT -= dt; P.pulseT -= dt;
    const R = s.aura.r * (P.auraBoostT > 0 ? 1.5 : 1), tx = s.tx;
    if (P.auraT <= 0) {
      P.auraT = 0.25;
      const tick = s.aura.dps * 0.25;
      let n = 0;
      if (!G.safe) for (const e of enemies) if (!e.dead && d2(e.x, e.y, P.x, P.y) < (R + e.r) ** 2) { damageEnemy(e, tick, false, true); n++; if (tx.jHeavy) applySlow(e, tx.jHeavy, 0.4); }
      if (tx.jAbsorb && n) P.shield = Math.min(s.maxShield, P.shield + s.maxShield * tx.jAbsorb / 100 * Math.min(5, n) * 0.25);
      for (const a of asteroids) if (!a.dead && d2(a.x, a.y, P.x, P.y) < (R + a.r) ** 2) damageAsteroid(a, tick * 0.5 * s.miningPower * (1 + (tx.jMelt || 0) / 100), false);
    }
    if (tx.jPulse && P.pulseT <= 0 && !G.safe) { P.pulseT = 3; splash(P.x, P.y, R, s.aura.dps * tx.jPulse / 100, null, '#c29bff'); }
  }
  if (s.legend.wake) {
    P.wakeT -= dt; P.wakeTick -= dt;
    if (sp > 90 && P.wakeT <= 0) { trails.push({ x: P.x - Math.cos(P.a) * 14, y: P.y - Math.sin(P.a) * 14, life: 1.4 }); P.wakeT = 0.05; }
    if (P.wakeTick <= 0 && trails.length && !G.safe) {
      P.wakeTick = 0.2;
      const dmg = s.laserHit * 0.8 * 0.2;
      for (const e of enemies) {
        if (e.dead) continue;
        for (const t of trails) if (d2(t.x, t.y, e.x, e.y) < (e.r + 18) ** 2) { damageEnemy(e, dmg, false, true); break; }
      }
    }
  }
  for (const a of asteroids) {
    const rr = a.r * 0.9 + P.r, dd = d2(a.x, a.y, P.x, P.y);
    if (dd < rr * rr) {
      const d = Math.sqrt(dd) || 1, nx = (P.x - a.x) / d, ny = (P.y - a.y) / d;
      P.x = a.x + nx * rr; P.y = a.y + ny * rr;
      const vn = P.vx * nx + P.vy * ny;
      if (vn < 0) {
        P.vx -= 1.5 * vn * nx; P.vy -= 1.5 * vn * ny;
        if (vn < -200 && P.contactT <= 0) { hurtPlayer(3 + a.size * 2); P.contactT = 0.5; }
        a.vx -= vn * nx * 0.15 / a.size; a.vy -= vn * ny * 0.15 / a.size;
      }
    }
  }
}

const AUTO_RANGE = 560, MINE_RANGE = 460;
// nearest valid target for auto-combat (enemies first) or auto-mining (asteroids);
// keeps the current target while it stays valid so the ship does not flicker between targets
function autoTarget() {
  const st = G.station;
  const reachable = t => !G.bubble || d2(t.x, t.y, st.x, st.y) < (st.r - 10) ** 2;
  const valid = (t, range) => t && !t.dead && reachable(t) && d2(t.x, t.y, P.x, P.y) < range * range;
  const cur = P.autoT;
  if (G.autoFire && !G.safe) {
    if (cur && cur.T && !cur.shielded && !cur.cloak && valid(cur, AUTO_RANGE * 1.15)) return cur;
    let best = null, b = AUTO_RANGE * AUTO_RANGE;
    for (const e of enemies) { if (e.dead || e.shielded || e.cloak) continue; const dd = d2(e.x, e.y, P.x, P.y); if (dd < b) { b = dd; best = e; } }
    if (best) return (P.autoT = best);
  }
  if (G.autoMine) {
    if (cur && cur.K && valid(cur, MINE_RANGE * 1.15)) return cur;
    let best = null, b = MINE_RANGE * MINE_RANGE;
    for (const a of asteroids) { if (a.dead || !reachable(a)) continue; const dd = d2(a.x, a.y, P.x, P.y); if (dd < b) { b = dd; best = a; } }
    if (best) return (P.autoT = best);
  }
  return (P.autoT = null);
}

function spawnPoint() {
  const R = Math.hypot(view.w, view.h) / 2 / view.zoom + 140;
  for (let i = 0; i < 16; i++) {
    const a = rand(0, TAU), x = P.x + Math.cos(a) * R, y = P.y + Math.sin(a) * R;
    const inside = x > 60 && y > 60 && x < WORLD.w - 60 && y < WORLD.h - 60;
    const awayFromBeacon = !G.station || d2(x, y, G.station.x, G.station.y) > (G.station.r + 250) ** 2;
    if (inside && awayFromBeacon) return { x, y };
  }
  return null;
}
