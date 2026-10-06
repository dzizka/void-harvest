'use strict';
/* ---------- companion drones (drone bay slot) ---------- */
function updateDrones(dt) {
  const s = P.stats, D = s.drones, want = D ? D.count + (P.stormT > 0 ? 2 : 0) : 0;
  while (P.drones.length < want) P.drones.push({ x: P.x, y: P.y, a: 0, fireT: rand(0, 0.5) });
  if (P.drones.length > want) P.drones.length = want;
  if (!want) return;
  const buff = dmgBuff(), st = G.station, hive = !!s.tx.kHive;
  P.drones.forEach((d, i) => {
    let t = null, best;
    if ((D.kind === 'assault' || hive) && !G.safe) {
      // focus fire: keep the current target, otherwise share the ship's auto-target or take the nearest enemy
      const keep = x => x && x.T && !x.dead && !x.shielded && d2(x.x, x.y, P.x, P.y) < 520 * 520;
      if (keep(d.tgt)) t = d.tgt;
      else if (keep(P.autoT)) t = P.autoT;
      else { best = 480 * 480; for (const e of enemies) { if (e.dead || e.shielded) continue; const dd = d2(e.x, e.y, P.x, P.y); if (dd < best) { best = dd; t = e; } } }
      d.tgt = t;
    }
    if (!t && D.kind === 'mining') {
      best = 420 * 420;
      for (const a of asteroids) {
        if (a.dead || (G.bubble && d2(a.x, a.y, st.x, st.y) > (st.r - 10) ** 2)) continue;
        const dd = d2(a.x, a.y, P.x, P.y); if (dd < best) { best = dd; t = a; }
      }
    }
    const ang = G.time * 1.4 + i * TAU / want;
    d.x = lerp(d.x, P.x + Math.cos(ang) * 46, Math.min(1, 6 * dt)); d.y = lerp(d.y, P.y + Math.sin(ang) * 46, Math.min(1, 6 * dt));
    d.fireT -= dt;
    if (t) {
      d.a = Math.atan2(t.y - d.y, t.x - d.x);
      if (d.fireT <= 0) {
        d.fireT = (D.kind === 'mining' ? 0.35 : 0.5) / s.droneRate / (P.stormT > 0 ? 2 : 1);
        const storm = P.stormT > 0 && P.stormCrit, crit = Math.random() * 100 < (hive || storm ? s.crit : 0) + (s.tx.sDCrit || 0);
        bullets.push({ x: d.x, y: d.y, px: d.x, py: d.y, vx: Math.cos(d.a) * 900, vy: Math.sin(d.a) * 900, dmg: s.laserHit * (D.dmg || 25) / 100 * buff * (crit ? s.critMult * (storm ? 2 : 1) : 1), crit, life: 0.6, w: 1.5,
          color: D.kind === 'mining' ? '#c8a27c' : CLASSES[P.cls].color, bubble: G.bubble, onlyAst: !t.T, pierce: hive ? 1 : 0, keep: 0.85,
          blast: (s.tx.sDBlast || 0) / 100, blastR: 55, quietHit: true });
      }
    } else d.a = ang + Math.PI / 2;
  });
  if (D.kind === 'repair' && G.mode === 'play') P.hull = Math.min(s.maxHull, P.hull + s.maxHull * D.repair / 100 * want * dt);
  if (s.legend.kamikaze && P.kamiT <= 0 && !G.safe) {
    let t = null, best = 600 * 600;
    for (const e of enemies) { if (e.dead) continue; const dd = d2(e.x, e.y, P.x, P.y); if (dd < best) { best = dd; t = e; } }
    if (t) {
      P.kamiT = 6;
      const d = P.drones[0];
      particles.push({ bolt: true, x: d.x, y: d.y, x2: t.x, y2: t.y, life: 0.2, max: 0.2, color: '#ff8a5c' });
      const dmg = s.laserHit * 3 * buff;
      for (const e of enemies) if (!e.dead && d2(e.x, e.y, t.x, t.y) < (80 + e.r) ** 2) damageEnemy(e, dmg, false);
      ring(t.x, t.y, '#ff8a5c', 80, 0.35); burst(t.x, t.y, '#ff8a5c', 20, 260, 2.4, 0.4);
    } else P.kamiT = 1;
  }
}

/* ---------- legendary / mythic helpers ---------- */
function dmgBuff() {
  let m = 1;
  if (P.oreStacks > 0) m *= 1 + 0.02 * P.oreStacks;
  if (P.stats.legend.afterburner && G.time - P.lastHit > 3) m *= 1.15;
  const tx = P.stats.tx || {};
  if (tx.iFlow && P.vx * P.vx + P.vy * P.vy > (P.stats.speed * 0.7) ** 2) m *= 1 + tx.iFlow / 100;
  if (P.ghostT > 0) m *= 1.3;
  if (stimOn('rage')) m *= 1.15;
  if (!G.dungeon && inRadiation()) m *= 1.25;
  if (G.dungeon && G.dungeon.horde) m *= 1 + hb('dmg');
  if (P.rockStacks > 0 && tx.sCrush) m *= 1 + tx.sCrush / 100 * P.rockStacks;
  if (P.goldT > 0) m *= 1.4;
  if (tx.kOreShield && P.oshield > 0) m *= 1.3;
  if (tx.sInvest) m *= 1 + tx.sInvest / 100 * Math.min(10, Math.floor(P.ore / 500));
  if (tx.cLeader && minions.length) m *= 1 + tx.cLeader / 100 * minions.length;
  return m;
}

/* ---------- carrier minions & artillery fire zones ---------- */
let minions = [], fires = [];
const aliveMinions = () => minions.reduce((n, m) => n + (m.dead ? 0 : 1), 0);
function spawnMinion(x, y) {
  const M = P.stats.minion;
  if (!M || G.safe || aliveMinions() >= M.max) return null;
  const hp = P.stats.maxHull * M.hp;
  const m = { x, y, vx: rand(-90, 90), vy: rand(-90, 90), a: rand(0, TAU), hp, maxHp: hp, r: M.titan ? 22 : 9, life: M.life,
    fireT: rand(0.2, 0.6), titan: M.titan, isMinion: true, dead: false, tgt: null };
  minions.push(m);
  ring(x, y, M.titan ? '#ffcf6e' : '#ff9d6e', M.titan ? 90 : 30, 0.35);
  if (M.titan) { burst(x, y, '#ffcf6e', 30, 300, 2.5, 0.6); addText(x, y - 32, _L('KOLOS'), '#ffcf6e', 13, 0.9); }
  return m;
}
function minionGone(m, exploded) {
  const s = P.stats, tx = s.tx;
  if (tx.cRecyc) P.shield = Math.min(s.maxShield, P.shield + s.maxShield * tx.cRecyc / 100);
  if (exploded && tx.cChain && Math.random() < tx.cChain / 100) spawnMinion(m.x + rand(-30, 30), m.y + rand(-30, 30));
  if (m.titan) P.titanT = 5;
}
function minionBlow(m, pct) {
  if (m.dead) return; m.dead = true;
  const s = P.stats, M = s.minion;
  splash(m.x, m.y, M && M.altar ? 120 : 110, s.laserHit * pct / 100 * dmgBuff() * (M ? M.dmgMul : 1), null, '#ff5f6d');
  burst(m.x, m.y, '#ff5f6d', 22, 300, 2.4, 0.45); shake(1.2);
  minionGone(m, true);
}
function minionDie(m) {
  const tx = P.stats.tx;
  if (tx.cCore) { minionBlow(m, tx.cCore); return; }
  m.dead = true; burst(m.x, m.y, '#ff9d6e', 12, 200, 2, 0.4);
  minionGone(m, false);
}
function updateMinions(dt) {
  const s = P.stats, M = s.minion, tx = s.tx;
  for (const f of fires) {
    f.t -= dt; f.tick -= dt;
    if (f.tick <= 0) { f.tick = 0.25; for (const e of enemies) if (!e.dead && d2(e.x, e.y, f.x, f.y) < (f.r + e.r) ** 2) damageEnemy(e, f.dps * 0.25, false, true); }
  }
  if (fires.length) fires = fires.filter(f => f.t > 0);
  if (!M) { if (minions.length) minions = []; return; }
  let alive = 0;
  for (const m of minions) if (!m.dead) { if (m.temp) { if (M.titan) m.dead = true; continue; } if (m.titan !== M.titan || alive >= M.max) m.dead = true; else alive++; }
  if (M.titan && !alive && !G.safe && (P.titanT -= dt) <= 0) spawnMinion(P.x - Math.cos(P.a) * 50, P.y - Math.sin(P.a) * 50);
  if (tx.cDet && alive && !G.safe && (P.detT -= dt) <= 0) {
    P.detT = 8;
    const o = minions.find(m => !m.dead && !m.titan);
    if (o) minionBlow(o, 100 + tx.cDet + (tx.cCore || 0));
  }
  const buff = dmgBuff(), n = Math.max(1, alive);
  let idx = 0;
  for (const m of minions) {
    if (m.dead) continue;
    const i = idx++;
    m.life -= dt; m.fireT -= dt;
    if (tx.cSelfRep) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * tx.cSelfRep / 100 * dt);
    if (m.hp <= 0 || (!m.titan && m.life <= 0)) { minionDie(m); continue; }
    let t = P.ringT > 0 ? null : m.tgt;
    if (P.ringT <= 0 && (!t || t.dead || t.shielded || d2(t.x, t.y, P.x, P.y) > 720 * 720)) {
      t = null;
      if (!G.safe) {
        let b = 540 * 540;
        for (const e of enemies) { if (e.dead || e.shielded) continue; const dd = Math.min(d2(e.x, e.y, m.x, m.y), d2(e.x, e.y, P.x, P.y)); if (dd < b) { b = dd; t = e; } }
      }
      m.tgt = t;
    }
    let vx, vy;
    const sp = m.titan ? 300 : M.altar ? 480 : 330;
    if (t) {
      const dx = t.x - m.x, dy = t.y - m.y, d = Math.hypot(dx, dy) || 1;
      m.a = Math.atan2(dy, dx);
      if (M.altar) {
        vx = dx / d * sp; vy = dy / d * sp;
        if (d < t.r + m.r + 8) { minionBlow(m, 400 + (tx.cCore || 0)); continue; }
      } else {
        const want = m.titan ? t.r + 40 : 180, rad = clamp((d - want) / 80, -1, 1), orb = i % 2 ? 0.6 : -0.6;
        vx = (dx / d * rad - dy / d * orb) * sp; vy = (dy / d * rad + dx / d * orb) * sp;
        if (m.fireT <= 0) {
          const dmg = s.laserHit * M.dmg * buff * (P.orderT > 0 ? 1.5 : 1) * (m.dmgM || 1);
          if (m.titan) {
            if (d < t.r + 150) {
              m.fireT = 1 / M.rate;
              splash(t.x, t.y, 140, dmg, null, '#ffcf6e'); shake(2);
              if (tx.cCrush) for (const e of enemies) if (!e.dead && d2(e.x, e.y, t.x, t.y) < (120 + e.r) ** 2) applySlow(e, tx.cCrush, 1.5);
            }
          } else if (d < 560) {
            m.fireT = 1 / M.rate / (P.orderT > 0 && s.legend.lOrder ? 2 : 1);
            bullets.push({ x: m.x, y: m.y, px: m.x, py: m.y, vx: dx / d * 900, vy: dy / d * 900, dmg, crit: false, life: 0.7, w: 1.6, color: '#ff9d6e', bubble: false,
              blast: (tx.cSplash || 0) / 100, blastR: 60, slow: tx.cCrush || 0, quietHit: true });
          }
        }
      }
    } else {
      const ang = G.time * (P.ringT > 0 ? 3 : 0.9) + i * TAU / n, rr = P.ringT > 0 ? 50 : m.titan ? 60 : 64 + (i % 3) * 14;
      vx = (P.x + Math.cos(ang) * rr - m.x) * 3.5; vy = (P.y + Math.sin(ang) * rr - m.y) * 3.5;
      if (Math.abs(vx) + Math.abs(vy) > 30) m.a = Math.atan2(vy, vx);
    }
    m.vx += (vx - m.vx) * Math.min(1, 4 * dt); m.vy += (vy - m.vy) * Math.min(1, 4 * dt);
    m.x += m.vx * dt; m.y += m.vy * dt;
    confineArena(m, m.r, 0.3);
  }
  if (minions.some(m => m.dead)) minions = minions.filter(m => !m.dead);
}
const RES_MAX = 5;
const mres = id => 1 + 0.1 * ((P && P.stats && P.stats.mres && P.stats.mres[id]) || 0);   // mythic resonance: +10 % power per level
const mythMult = () => (G.cheat.mythBoost ? 1000 : 1);
// nightmare helpers
const nmK = () => (G && G.dungeon && G.dungeon.nm ? G.dungeon.nm.k : 0);
const nmHas = id => !!(G && G.dungeon && ((G.dungeon.nm && (G.dungeon.nm.mods.includes(id) || G.dungeon.nm.bonus === id)) || (G.dungeon.wk && G.dungeon.wk.includes(id))));
// mythic multiplier: world tier III+ or nightmare level 10+ unlocks mythics, nightmare level raises the odds
function mythTier() {
  const k = nmK();
  let m = Math.max(TIERS[G.tier].myth, k >= 10 ? 1 : 0);
  if (m > 0 && k) m *= 1 + k * 0.1;
  if (nmHas('myth')) m *= 2;
  return m;
}
let KEY_ID = 1;
function makeKey(lvl) {
  lvl = clamp(Math.round(lvl), 1, 99);
  const n = lvl < 5 ? 1 : lvl < 15 ? 2 : 3;
  const ids = Object.keys(NM_MODS);
  for (let i = ids.length - 1; i > 0; i--) { const j = randi(0, i); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return { id: KEY_ID++, lvl, mods: ids.slice(0, n), bonus: pick(Object.keys(NM_BONUS)) };
}
const keyBaseLevel = () => [0, 1, 3, 6, 11][G.tier] + randi(0, 2);
function dropKey(x, y, lvl) {
  const a = rand(0, TAU);
  pickups.push({ kind: 'key', key: makeKey(lvl), x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, amount: 1, t: 0, spin: 0, dead: false });
}
function updateHazards(dt) {
  for (const h of hazards) {
    h.t -= dt;
    if (h.kind === 'beam') {
      if (!h.boss || h.boss.dead) { h.dead = true; continue; }
      h.x = h.boss.x; h.y = h.boss.y;
      if (h.t <= 0) {
        h.a += h.w * dt; h.life -= dt; h.tick -= dt;
        const ex = h.x + Math.cos(h.a) * h.len, ey = h.y + Math.sin(h.a) * h.len;
        if (h.tick <= 0) { h.tick = 0.2; if (segD2(P.x, P.y, h.x, h.y, ex, ey) < (22 + P.r * 0.5) ** 2) hurtPlayer(h.dps * 0.2); }
        if (h.life <= 0) h.dead = true;
      }
      continue;
    }
    if (h.kind === 'mine') {
      h.arm -= dt;
      if (h.t <= 0 && h.boom == null) { h.dead = true; continue; }
      if (h.arm <= 0 && h.boom == null && d2(h.x, h.y, P.x, P.y) < 75 * 75 && !G.safe) h.boom = 0.4;
      if (h.boom != null && (h.boom -= dt) <= 0) {
        h.dead = true; ring(h.x, h.y, '#ff9a3c', h.r, 0.35); burst(h.x, h.y, '#ffb35c', 20, 280, 2.4, 0.45); shake(2);
        if (d2(h.x, h.y, P.x, P.y) < (h.r + P.r) ** 2) hurtPlayer(h.dmg);
      }
      continue;
    }
    if (h.kind === 'blast') {
      if (h.t <= 0) {
        h.dead = true; ring(h.x, h.y, '#ff6b5a', h.r, 0.35); burst(h.x, h.y, '#ff9a5a', 18, 260, 2.4, 0.4);
        if (d2(h.x, h.y, P.x, P.y) < (h.r + P.r) ** 2) hurtPlayer(h.dmg);
      }
    } else if (h.t <= 0) {        // fire zone: telegraph, then burns for a while
      h.life -= dt; h.tick -= dt;
      if (h.tick <= 0) { h.tick = 0.25; if (d2(h.x, h.y, P.x, P.y) < (h.r + P.r * 0.5) ** 2) hurtPlayer(h.dps * 0.25); }
      if (h.life <= 0) h.dead = true;
    }
  }
  if (hazards.length) hazards = hazards.filter(h => !h.dead);
}
function drawHazards() {
  for (const h of hazards) {
    if (h.kind === 'mine') {
      const on = h.arm <= 0, blink = Math.floor(G.time * (h.boom != null ? 14 : 3)) % 2 === 0;
      if (h.boom != null) { ctx.strokeStyle = 'rgba(255,120,60,.8)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (1 - h.boom / 0.4), 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(G.time);
      ctx.fillStyle = '#2a140a'; ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 1.6;
      ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r = k % 2 ? 6 : 11; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = on && blink ? '#ff5a36' : '#5a2a14'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      ctx.restore();
      continue;
    }
    if (h.kind === 'beam') {
      const ex = h.x + Math.cos(h.a) * h.len, ey = h.y + Math.sin(h.a) * h.len;
      ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey);
      if (h.t > 0) { ctx.strokeStyle = 'rgba(232,226,255,.55)'; ctx.lineWidth = 2; ctx.setLineDash([12, 9]); ctx.stroke(); ctx.setLineDash([]); }
      else {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(200,170,255,.35)'; ctx.lineWidth = 28; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      continue;
    }
    if (h.t > 0) {
      const k = 1 - h.t / h.t0;
      ctx.strokeStyle = h.kind === 'blast' ? '#ff6b5a' : '#ff9a3c'; ctx.globalAlpha = 0.35 + 0.5 * k; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = h.kind === 'blast' ? 'rgba(255,107,90,.12)' : 'rgba(255,140,60,.10)';
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, TAU); ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
      g.addColorStop(0, 'rgba(255,170,70,' + (0.35 + Math.random() * 0.1).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,60,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }
}
