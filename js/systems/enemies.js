'use strict';
function director(dt) {
  const S = curSector();
  G.astT -= dt;
  if (G.astT <= 0 && asteroids.length < S.astCount) {
    G.astT = 0.4;
    const p = freeSpot(S.kind === 'safe' ? 280 : 470, 1100, 80);
    asteroids.push(makeAsteroid(p.x, p.y, weighted({ 3: 4, 2: 3, 1: 2 }), null, S.ast));
  }
  if (S.kind === 'safe') return;
  G.hunterT -= dt;
  if (G.hunterT <= 0) { G.hunterT = rand(150, 240); if (!enemies.some(e => e.hunter) && !G.safe && Math.random() < 0.7) spawnHunter(); }
  const zone = zoneLevel();
  const target = Math.round(Math.min(4 + Math.round(zone * 1.3), 24) * (stormHere() ? 1.5 : 1));
  G.spawnT -= dt;
  if (G.spawnT <= 0 && enemies.length < target && !G.safe) {
    G.spawnT = rand(0.7, 1.5) * (zone < 3 ? 1.3 : 1) * (stormHere() ? 0.6 : 1);
    const p = spawnPoint();
    if (p) { const dp = depthAt(p.x, p.y); spawnEnemy(weighted(S.enemies), p.x, p.y, zone + dp + stormLvl() + (Math.random() < 0.3 ? 1 : 0), zone >= 2 && Math.random() < 0.06 + 0.04 * dp + (stormHere() ? 0.04 : 0)); }
  }
  G.waveT -= dt;
  if (G.waveT <= 0 && !G.safe) {
    const p = spawnPoint();
    G.waveT = 60;
    if (p) {
      const n = 4 + Math.floor(zone / 2), dp = depthAt(p.x, p.y);
      for (let i = 0; i < n; i++) spawnEnemy(weighted(S.enemies), p.x + rand(-80, 80), p.y + rand(-80, 80), zone + dp, false);
      spawnEnemy(weighted(S.enemies), p.x, p.y, zone + dp + 1, true);
      banner(_T`Nepriateľská letka<small>Elitný veliteľ nesie vzácnu výbavu</small>`);
    }
  }
  for (const g of G.gates) g.lvl = zone + 1;   // gates follow the pilot's level
  if (G.gates.length < 2) {
    G.gateT -= dt;
    if (G.gateT <= 0) { G.gateT = 120; makeGate(); log(_L('Radar zachytil novú bránu.')); }
  }
}

function updateInteract() {
  let it = null;
  if (G.dungeon) {
    const p = G.dungeon.portal;
    if (p && p.t > 0 && d2(p.x, p.y, P.x, P.y) < 95 * 95)
      it = p.kind === 'next'
        ? { txt: _L('Prejsť do ďalšej komnaty'), sub: `${G.dungeon.room + 2}/${DUNGEON.rooms.length}`, col: '#5fd4ff', act: () => { G.dungeon.room++; transition(_L('Ďalšia komnata'), loadRoom); } }
        : { txt: _L('Návrat do sektora'), sub: SECTORS[G.dungeon.sector].name, col: '#5be09a', act: exitDungeon };
    if (G.dungeon.horde) { const hx = hordeInteract(); if (hx) it = hx; }
  } else {
    if (G.station && d2(G.station.x, G.station.y, P.x, P.y) < G.station.dock ** 2)
      it = { txt: _L('Dokovať na stanici'), sub: _L('servis · obchod · mapa'), col: '#5fd4ff', act: () => { P.hull = P.stats.maxHull; P.shield = P.stats.maxShield; openPanel('station'); tutTick('dock'); } };
    for (const g of G.gates) {
      if (d2(g.x, g.y, P.x, P.y) < 100 * 100) {
        const B = BOSSES[g.boss];
        it = { txt: _T`Vstúpiť do brány: ${B.lair}`, sub: _T`úroveň ${g.lvl} · boss ${B.name}${P.keys.length ? _T` · kľúče ${P.keys.length}` : ''}`, col: B.color,
          act: () => { if (P.keys.length) { G.gateSel = g; openPanel('gate'); } else enterDungeon(g); } };
      }
    }
    const ex = endgameInteract() || baseInteract(); if (ex) it = ex;
  }
  G.interact = it;
}

function updateAsteroids(dt) {
  for (const a of asteroids) {
    a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.spin * dt; a.flash -= dt;
    a.vx *= Math.pow(0.9, dt); a.vy *= Math.pow(0.9, dt);
    if (a.x < a.r || a.x > WORLD.w - a.r) { a.vx *= -1; a.x = clamp(a.x, a.r, WORLD.w - a.r); }
    if (a.y < a.r || a.y > WORLD.h - a.r) { a.vy *= -1; a.y = clamp(a.y, a.r, WORLD.h - a.r); }
    confineArena(a, a.r, 1);
  }
}

function enemyFire(e, a, spd, dmg) {
  if (nmHas('swift')) spd *= 1.3;
  const chill = !!(e.mods && e.mods.includes('frost'));
  ebullets.push({ x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg: dmg * e.dmgM,
    life: 3.4, r: e.isBoss ? 6 : e.type === 'gunship' || e.type === 'sniper' ? 5 : 4, color: chill ? '#bfefff' : e.T.color, dead: false, chill });
}

// boss attack patterns; returns true when the pattern has finished
function runBossPattern(e, toP, ph2) {
  const B = e.B;
  switch (e.pat) {
    case 'ring':
      if (e.patClock <= 0) {
        const n = ph2 ? 22 : 16, off = e.patStep * 0.19;
        for (let i = 0; i < n; i++) enemyFire(e, off + i / n * TAU, 230, 7);
        e.patStep++; e.patClock = 0.55;
      }
      return e.patStep >= 3;
    case 'fan':
      if (e.patClock <= 0) {
        for (let i = -3; i <= 3; i++) enemyFire(e, toP + i * 0.13, 340, 6);
        e.patStep++; e.patClock = 0.38;
      }
      return e.patStep >= (ph2 ? 4 : 3);
    case 'spiral':
      if (e.patClock <= 0) {
        e.spA += 0.33;
        const arms = ph2 ? 3 : 2;
        for (let k = 0; k < arms; k++) enemyFire(e, e.spA + k * TAU / arms, 250, 5);
        e.patStep++; e.patClock = 0.07;
      }
      return e.patStep >= 34;
    case 'beam': {
      if (hazards.some(h => h.kind === 'beam')) return true;   // one sweep at a time
      const n = e.arch && e.arch.phase >= 3 ? 3 : 2, dir = Math.random() < 0.5 ? 1 : -1, a0 = rand(0, TAU);
      for (let k = 0; k < n; k++) hazards.push({ kind: 'beam', boss: e, x: e.x, y: e.y, a: a0 + k * TAU / n, w: 0.75 * dir, t: 1.1, t0: 1.1, life: 4, tick: 0, dps: 36 * e.dmgM, len: 950 });
      return true;
    }
    case 'summon': {
      const alive = enemies.filter(m => m.minion && !m.dead).length;
      const n = Math.min(ph2 ? 4 : 3, 8 - alive);
      for (let i = 0; i < n; i++) {
        const a = i / Math.max(1, n) * TAU + rand(-0.3, 0.3);
        const m = spawnEnemy(B.minion, e.x + Math.cos(a) * 95, e.y + Math.sin(a) * 95, e.lvl - 1, false);
        m.minion = true; ring(m.x, m.y, B.color, 50, 0.4);
      }
      return true;
    }
    case 'charge':
      if (e.patStep === 0) { e.state = 'wind'; e.dashA = toP; e.patClock = 0.75; e.patStep = 1; }
      else if (e.patStep === 1 && e.patClock <= 0) { e.state = 'dash'; e.vx = Math.cos(e.dashA) * 620; e.vy = Math.sin(e.dashA) * 620; e.patClock = 0.7; e.patStep = 2; shake(4); }
      else if (e.patStep === 2) {
        if (Math.random() < 0.5) enemyFire(e, e.dashA + Math.PI + rand(-0.6, 0.6), 160, 5);
        if (e.patClock <= 0) { e.state = 'seek'; return true; }
      }
      return false;
  }
  return true;
}

function updateEnemies(dt) {
  if (G.freezeT > 0 || G.intro) { for (const e of enemies) e.flash -= dt; return; }   // time stop / boss intro
  const st = G.station, barrier = st && st.r > 0 && !G.dungeon;
  for (const e of enemies) {
    if (e.dead) continue;
    if (minions.length && !e.isBoss && (e.aggroT = (e.aggroT || 0) - dt) <= 0) {
      // minions draw fire: an enemy goes for the nearest minion if it is closer than the ship
      e.aggroT = 0.6;
      if (!e.tgt || e.tgt.isMinion) {
        let best = null, b = Math.min(d2(e.x, e.y, P.x, P.y), 340 * 340);
        for (const m of minions) { if (m.dead) continue; const dd = d2(e.x, e.y, m.x, m.y); if (dd < b) { b = dd; best = m; } }
        e.tgt = best;
      }
    }
    const tg = e.tgt && !e.tgt.dead ? e.tgt : P;
    const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const toP = Math.atan2(dy, dx), sp = e.T.speed * e.speedM * (e.slowT > 0 ? (e.slowF || 0.4) : 1);
    let tx = 0, ty = 0;
    e.fireT -= dt; e.stateT -= dt; e.flash -= dt; e.contactT -= dt; e.spin += dt; e.patClock -= dt; e.slowT = (e.slowT || 0) - dt;
    if (e.hunter) updateHunter(e, dt, d);
    if (e.mods) eliteModsTick(e, dt, d);
    if (G.safe && !e.isBoss && tg === P) {
      // player is protected: enemies lose interest and patrol away from the beacon
      if (!e.roam || d2(e.x, e.y, e.roam.x, e.roam.y) < 80 * 80) e.roam = freeSpot((st ? st.r : 0) + 500, 0, 200);
      const rx = e.roam.x - e.x, ry = e.roam.y - e.y, rl = Math.hypot(rx, ry) || 1;
      tx = rx / rl * sp * 0.55; ty = ry / rl * sp * 0.55;
      e.state = 'seek'; e.burst = 0;
    } else switch (e.type) {
      case 'drone':
        tx = ux * sp; ty = uy * sp;
        if (d < 170) { tx = -uy * sp * 0.5 * e.orbit; ty = ux * sp * 0.5 * e.orbit; }
        if (d < 520 && e.fireT <= 0) { enemyFire(e, toP + rand(-0.08, 0.08), 360, 6); e.fireT = rand(1.5, 2.2); }
        break;
      case 'fighter': {
        const radial = clamp((d - 290) / 120, -1, 1);
        tx = (ux * radial - uy * e.orbit * 0.9) * sp; ty = (uy * radial + ux * e.orbit * 0.9) * sp;
        if (Math.random() < dt * 0.2) e.orbit *= -1;
        if (d < 620 && e.fireT <= 0) {
          if (e.burst <= 0) e.burst = 3;
          enemyFire(e, toP + rand(-0.05, 0.05), 430, 5); e.burst--;
          e.fireT = e.burst > 0 ? 0.13 : rand(2, 2.8);
        }
        break;
      }
      case 'gunship':
        if (d > 340) { tx = ux * sp; ty = uy * sp; } else { tx = -uy * sp * 0.4 * e.orbit; ty = ux * sp * 0.4 * e.orbit; }
        if (d < 660 && e.fireT <= 0) { for (let i = -2; i <= 2; i++) enemyFire(e, toP + i * 0.17, 300, 7); e.fireT = rand(2.6, 3.2); }
        break;
      case 'charger':
        if (e.state === 'seek') { tx = ux * sp; ty = uy * sp; if (d < 330) { e.state = 'wind'; e.stateT = 0.65; } }
        else if (e.state === 'wind') { tx = -ux * 40; ty = -uy * 40; e.dashA = toP; if (e.stateT <= 0) { e.state = 'dash'; e.stateT = 0.55; e.vx = Math.cos(e.dashA) * 640; e.vy = Math.sin(e.dashA) * 640; } }
        else if (e.state === 'dash') { tx = e.vx; ty = e.vy; if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.9; } }
        else { if (e.stateT <= 0) e.state = 'seek'; }
        break;
      case 'chest': tx = 0; ty = 0; break;
      case 'goblin': {
        e.jig = (e.jig || 0) - dt; if (e.jig <= 0) { e.jig = rand(0.6, 1.4); e.orbit = Math.random() < 0.5 ? 1 : -1; }
        const flee = d < 520 ? 1 : 0.25;
        tx = (-ux * flee - uy * e.orbit * 0.8) * sp; ty = (-uy * flee + ux * e.orbit * 0.8) * sp;
        break;
      }
      case 'splitter':
        tx = ux * sp; ty = uy * sp;
        if (d < 210) { tx = -uy * sp * 0.6 * e.orbit; ty = ux * sp * 0.6 * e.orbit; }
        if (d < 480 && e.fireT <= 0) { enemyFire(e, toP + rand(-0.1, 0.1), 330, 5); e.fireT = rand(1.6, 2.4); }
        break;
      case 'sniper': {
        if (e.state === 'aim') {
          tx = 0; ty = 0; e.aimA = toP;
          if (e.stateT <= 0) { enemyFire(e, toP, 980, 24); e.state = 'seek'; e.fireT = rand(2.6, 3.6); }
        } else {
          const radial = clamp((d - 540) / 120, -1, 1);
          tx = (ux * radial - uy * e.orbit * 0.5) * sp; ty = (uy * radial + ux * e.orbit * 0.5) * sp;
          if (d < 820 && e.fireT <= 0) { e.state = 'aim'; e.stateT = 1.15; e.aimA = toP; }
        }
        break;
      }
      case 'minelayer': {
        const radial = clamp((d - 330) / 140, -1, 1);
        tx = (ux * radial - uy * e.orbit) * sp; ty = (uy * radial + ux * e.orbit) * sp;
        if (Math.random() < dt * 0.15) e.orbit *= -1;
        if (e.fireT <= 0 && d < 900) { e.fireT = rand(2.2, 3); if (hazards.length < 90) hazards.push({ kind: 'mine', x: e.x, y: e.y, r: 90, arm: 0.9, t: 14, dmg: 18 * e.dmgM }); }
        break;
      }
      case 'healer': {
        let best = null, bh = 1;
        for (const o of enemies) if (o !== e && !o.dead && !o.isBoss && o.hp < o.maxHp && d2(o.x, o.y, e.x, e.y) < 520 * 520) { const f = o.hp / o.maxHp; if (f < bh) { bh = f; best = o; } }
        e.healT = best;
        if (best) {
          const gx = best.x - e.x, gy = best.y - e.y, gl = Math.hypot(gx, gy) || 1, want = gl > 110 ? 1 : -0.3;
          tx = gx / gl * sp * want; ty = gy / gl * sp * want;
          if (gl < 170) best.hp = Math.min(best.maxHp, best.hp + best.maxHp * 0.07 * dt);
        } else { const radial = clamp((d - 400) / 120, -1, 1); tx = (ux * radial - uy * e.orbit * 0.6) * sp; ty = (uy * radial + ux * e.orbit * 0.6) * sp; }
        if (d < 520 && e.fireT <= 0) { enemyFire(e, toP, 300, 4); e.fireT = rand(2, 3); }
        break;
      }
      case 'shieldbearer': {
        let cx = 0, cy = 0, n = 0;
        for (const o of enemies) if (o !== e && !o.dead && !o.isBoss && o.type !== 'shieldbearer' && d2(o.x, o.y, e.x, e.y) < 520 * 520) { cx += o.x; cy += o.y; n++; }
        if (n) { const gx = cx / n + ux * 70 - e.x, gy = cy / n + uy * 70 - e.y, gl = Math.hypot(gx, gy) || 1, k = Math.min(1, gl / 80); tx = gx / gl * sp * k; ty = gy / gl * sp * k; }
        else if (d > 320) { tx = ux * sp; ty = uy * sp; }
        e.protT = (e.protT || 0) - dt;
        if (e.protT <= 0) { e.protT = 0.4; for (const o of enemies) if (!o.dead && !o.isBoss && o !== e && d2(o.x, o.y, e.x, e.y) < 175 * 175) o.prot = G.time + 0.6; }
        if (d < 600 && e.fireT <= 0) { for (let i = -1; i <= 1; i++) enemyFire(e, toP + i * 0.2, 280, 6); e.fireT = rand(2.4, 3.2); }
        break;
      }
      case 'stalker':
        e.cloak = d > 230 && e.state !== 'dash';
        if (e.state === 'dash') { tx = e.vx; ty = e.vy; if (e.stateT <= 0) e.state = 'seek'; }
        else {
          tx = ux * sp; ty = uy * sp;
          if (d < 210 && e.fireT <= 0) { e.state = 'dash'; e.dashA = toP; e.stateT = 0.45; e.vx = ux * 720; e.vy = uy * 720; e.fireT = 2.6; ring(e.x, e.y, '#aeb8d0', 30, 0.25); }
        }
        break;
      case 'boss': {
        if (e.arch) archUpdate(e);
        const ph2 = e.arch ? e.arch.phase >= 2 : e.hp < e.maxHp * 0.5;
        if (ph2 && !e.ph2 && !e.arch) { e.ph2 = true; banner(_T`<span style="color:${e.B.color}">${e.B.name}</span><small>Fáza 2 · zúrivosť</small>`); ring(e.x, e.y, e.B.color, 300, 0.7); shake(8); }
        const radial = clamp((d - 330) / 160, -1, 1);
        tx = (ux * radial - uy * e.orbit * 0.5) * sp; ty = (uy * radial + ux * e.orbit * 0.5) * sp;
        if (Math.random() < dt * 0.15) e.orbit *= -1;
        if (e.state === 'wind') { tx = 0; ty = 0; }
        if (!e.pat) {
          e.patT -= dt;
          if (e.patT <= 0) {
            const pool = e.arch ? ARCH_PATTERNS[e.arch.phase] : e.B.patterns.filter(p => p !== 'charge' || ph2 || e.B.patterns.length <= 4);
            e.pat = pick(pool); e.patStep = 0; e.patClock = 0;
          }
        } else if (runBossPattern(e, toP, ph2)) { e.pat = null; e.patT = rand(1.1, 1.8) * (ph2 ? 0.65 : 1) * (e.arch && e.arch.phase === 3 ? 0.75 : 1); }
        break;
      }
    }
    if (e.state !== 'dash') {
      const steer = Math.min(1, (e.type === 'gunship' || e.isBoss ? 1.6 : 3.5) * dt);
      e.vx += (tx - e.vx) * steer; e.vy += (ty - e.vy) * steer;
    }
    e.x += e.vx * dt; e.y += e.vy * dt;
    e.x = clamp(e.x, 20, WORLD.w - 20); e.y = clamp(e.y, 20, WORLD.h - 20);
    confineArena(e, e.r, 0.3);
    // beacon barrier: enemies cannot enter the safe bubble
    if (barrier) {
      const bx = e.x - st.x, by = e.y - st.y, bd = Math.hypot(bx, by) || 1, lim = st.r + e.r;
      if (bd < lim) {
        e.x = st.x + bx / bd * lim; e.y = st.y + by / bd * lim;
        if (e.state === 'dash') { e.state = 'recover'; e.stateT = 0.6; }
      }
    }
    const face = e.state === 'dash' || e.state === 'wind' ? e.dashA : toP;
    e.a += angDiff(e.a, face) * Math.min(1, 6 * dt);
    const rr = e.r + P.r;
    if (tg !== P) {
      const r2 = e.r + tg.r;
      if (d < r2) {
        if (e.contactT <= 0) { tg.hp -= e.T.dmg * e.dmgM * (e.type === 'charger' ? 1 : 0.6); e.contactT = 0.6; }
        if (e.type === 'charger') { killEnemy(e); continue; }
        e.x = tg.x - ux * r2; e.y = tg.y - uy * r2;
      }
    } else if (d < rr && !G.safe) {
      if (e.type === 'charger') { hurtPlayer(e.T.dmg * e.dmgM); killEnemy(e); continue; }
      if (e.isBoss) { P.x = e.x - ux * rr; P.y = e.y - uy * rr; P.vx -= ux * 300; P.vy -= uy * 300; }
      else { e.x = P.x - ux * rr; e.y = P.y - uy * rr; }
      if (e.contactT <= 0) { hurtPlayer(e.T.dmg * e.dmgM * (e.state === 'dash' ? 1.3 : 0.6)); e.contactT = 0.6; }
    }
  }
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i]; if (a.dead || a.isBoss) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j]; if (b.dead || b.isBoss) continue;
      const rr = a.r + b.r + 4, dd = d2(a.x, a.y, b.x, b.y);
      if (dd < rr * rr && dd > 0.01) {
        const d = Math.sqrt(dd), push = (rr - d) * 0.5, nx = (a.x - b.x) / d, ny = (a.y - b.y) / d;
        a.x += nx * push; a.y += ny * push; b.x -= nx * push; b.y -= ny * push;
      }
    }
  }
}

// a projectile fired from inside the beacon bubble dissolves when it reaches the barrier
