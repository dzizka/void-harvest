'use strict';
function hitsBarrier(o) {
  const st = G.station;
  return o.bubble && st && st.r > 0 && d2(o.x, o.y, st.x, st.y) > st.r * st.r;
}

function updateBullets(dt) {
  const s = P.stats;
  for (const b of bullets) {
    if (b.dead) continue;
    b.px = b.x; b.py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { b.dead = true; continue; }
    if (hitsBarrier(b)) { b.dead = true; burst(b.x, b.y, '#5fd4ff', 3, 80, 1.4, 0.25); continue; }
    for (const e of enemies) {
      if (b.onlyAst || e.dead || e === b.last) continue;
      if (segD2(e.x, e.y, b.px, b.py, b.x, b.y) < (e.r + 3) ** 2) {
        damageEnemy(e, b.dmg, b.crit, b.quietHit);
        burst(b.x, b.y, b.color, 4, 160, 1.6, 0.25);
        if (b.chain) chainLightning(e, b.dmg * 0.4);
        if (b.arc) chainLightning(e, b.dmg * b.arc);
        if (s.areaPct > 0) splash(e.x, e.y, 80, b.dmg * s.areaPct / 100, e);
        if (b.blast) splash(e.x, e.y, b.blastR || 60, b.dmg * b.blast, e);
        if (b.slow && !e.dead) applySlow(e, b.slow, 1.5);
        if (b.pierce > 0) { b.pierce--; b.dmg *= b.keep || 0.7; b.last = e; continue; }
        b.dead = true;
        break;
      }
    }
    if (b.dead) continue;
    for (const a of asteroids) {
      if (a.dead) continue;
      if (segD2(a.x, a.y, b.px, b.py, b.x, b.y) < (a.r * 0.92) ** 2) {
        damageAsteroid(a, b.dmg * s.miningPower, b.crit); b.dead = true;
        if (Math.random() < LEGEND_INDEX.voidecho.chance * mythMult()) dropMythic('voidecho', a.x, a.y, zoneLevel() + 2);
        burst(b.x, b.y, a.K.vein || a.K.stroke, 4, 140, 1.6, 0.35);
        if (s.mineShield) P.shield = Math.min(s.maxShield, P.shield + 0.6 + b.dmg * 0.04);
        break;
      }
    }
  }
  bullets = bullets.filter(b => !b.dead);
}

function updateEnemyBullets(dt) {
  if (G.freezeT > 0 || G.intro) return;
  const st = G.station, barrier = st && st.r > 0 && !G.dungeon;
  for (const b of ebullets) {
    if (b.dead) continue;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { b.dead = true; continue; }
    if (barrier && d2(b.x, b.y, st.x, st.y) < st.r * st.r) { b.dead = true; burst(b.x, b.y, '#5fd4ff', 4, 90, 1.5, 0.3); continue; }
    const sh = G.event && G.event.state === 'active' && G.event.ship;
    if (sh && !sh.dead && d2(b.x, b.y, sh.x, sh.y) < sh.r * sh.r) { b.dead = true; sh.hp -= b.dmg; burst(b.x, b.y, '#7ee0a8', 4, 120, 1.5, 0.3); continue; }
    let hm = null;
    for (const m of minions) if (!m.dead && d2(b.x, b.y, m.x, m.y) < (m.r + b.r) ** 2) { hm = m; break; }
    if (hm) { b.dead = true; hm.hp -= b.dmg; burst(b.x, b.y, '#ff9d6e', 4, 120, 1.5, 0.3); continue; }
    if (G.arena && d2(b.x, b.y, G.arena.x, G.arena.y) > (G.arena.r + 30) ** 2) { b.dead = true; continue; }
    if (d2(b.x, b.y, P.x, P.y) < (P.r + b.r) ** 2) {
      b.dead = true;
      if (P.stats.legend.reflect && P.shield > 0 && !G.safe && Math.random() < 0.25) { reflectShot(b); continue; }
      hurtPlayer(b.dmg); if (b.chill) P.chillT = 1.5; burst(b.x, b.y, b.color, 6, 160, 1.8, 0.3); continue;
    }
    for (const a of asteroids) if (d2(b.x, b.y, a.x, a.y) < (a.r * 0.9) ** 2) { b.dead = true; burst(b.x, b.y, '#8b93a6', 3, 90, 1.4, 0.25); break; }
  }
  ebullets = ebullets.filter(b => !b.dead);
}

function updateMissiles(dt) {
  for (const m of missiles) {
    if (m.dead) continue;
    m.life -= dt;
    if (m.homing) {
      if (!m.target || m.target.dead) {
        m.target = null; let best = 700 * 700;
        for (const e of enemies) { if (e.dead || e.shielded) continue; const dd = d2(e.x, e.y, m.x, m.y); if (dd < best) { best = dd; m.target = e; } }
      }
      if (m.target) { const want = Math.atan2(m.target.y - m.y, m.target.x - m.x); m.a += clamp(angDiff(m.a, want), -4.5 * dt, 4.5 * dt); }
      m.spd = Math.min(680, m.spd + 900 * dt);
      m.vx = Math.cos(m.a) * m.spd; m.vy = Math.sin(m.a) * m.spd;
    }
    m.x += m.vx * dt; m.y += m.vy * dt;
    m.trailT -= dt;
    if (m.trailT <= 0) { m.trailT = 0.02; particles.push({ x: m.x, y: m.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.4, max: 0.4, size: m.plasma ? 4 : 2.2, color: m.plasma ? '#7fc8ff' : '#ff9a4a', drag: 2 }); }
    if (hitsBarrier(m)) { m.dead = true; ring(m.x, m.y, '#5fd4ff', 30, 0.3); continue; }
    if (m.life <= 0 || m.x < 0 || m.y < 0 || m.x > WORLD.w || m.y > WORLD.h) { explodeMissile(m); continue; }
    for (const e of enemies) if (!e.dead && d2(e.x, e.y, m.x, m.y) < (e.r + 7) ** 2) { explodeMissile(m); break; }
    if (m.dead) continue;
    for (const a of asteroids) if (!a.dead && d2(a.x, a.y, m.x, m.y) < (a.r * 0.9) ** 2) { explodeMissile(m); break; }
  }
  missiles = missiles.filter(m => !m.dead);
}

function updatePickups(dt) {
  const s = P.stats;
  for (const p of pickups) {
    if (p.dead) continue;
    p.t += dt; p.spin += dt * 2;
    if (p.cool) p.cool = Math.max(0, p.cool - dt);
    const fr = Math.pow(0.15, dt); p.vx *= fr; p.vy *= fr;
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy) || 1;
    const range = p.kind === 'item' ? s.magnet * 0.5 + 40 : p.kind === 'xp' && p.t > 0.5 ? 1e6 : s.magnet * (P.magT > 0 ? 6 : 1);
    if (d < range && !p.cool && p.t > 0.35) {
      const acc = p.kind === 'xp' && range > 1e5 ? 2600 + 1400 * (p.t - 0.5) : (1 - d / range) * 2200 + 500;
      p.vx += dx / d * acc * dt; p.vy += dy / d * acc * dt;
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    confineArena(p, 10, 0.5);
    if (d < P.r + 10 && p.t > 0.35 && !p.cool) { if (collect(p)) p.dead = true; }
    if (p.kind !== 'item' && p.kind !== 'key' && p.kind !== 'gem' && p.t > 45) p.dead = true;
    if (p.kind === 'item' && p.t > 180) p.dead = true;
  }
  pickups = pickups.filter(p => !p.dead);
}

function updateTrails(dt) {
  for (const t of trails) t.life -= dt;
  if (trails.length && trails[0].life <= 0) trails = trails.filter(t => t.life > 0);
}

function updateFx(dt) {
  for (const p of particles) {
    p.life -= dt;
    if (!p.ring && !p.bolt && !p.beam) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt; if (p.shard) p.a += p.va * dt; }
  }
  particles = particles.filter(p => p.life > 0);
  for (const t of texts) { t.life -= dt; t.y -= 38 * dt; }
  texts = texts.filter(t => t.life > 0);
}
