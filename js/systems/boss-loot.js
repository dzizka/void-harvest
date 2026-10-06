'use strict';
/* ---------- target farming: every sector boss favours its own loot ---------- */
const BOSS_ORDER = ['brood', 'warden', 'dread', 'queen', 'gravit', 'leviathan'];
const BOSS_LEGS = { brood: ['swarmlord', 'kamikaze', 'barrage'], warden: ['overheat', 'nova', 'thorns'], dread: ['prism', 'capacitor', 'afterburner'],
  queen: ['vampiric', 'cluster', 'magnetar'], gravit: ['gravwell', 'stasis', 'bulwark'], leviathan: ['chain', 'reflect', 'wake'] };
function bossLoot(key, cls) {
  cls = cls || P.cls;
  const i = BOSS_ORDER.indexOf(key); if (i < 0) return null;
  const B = TREES[cls][i % 3];
  const clsLegs = LEGEND_POOL.filter(l => l.cls === cls && !l.build).map(l => l.id);
  const legs = BOSS_LEGS[key].concat(clsLegs[i] ? [clsLegs[i]] : [], ['b_' + B.id]);
  return { legs, set: B.id, branch: B };
}
function dropSet(x, y, ilvl, branch) {
  const it = generateItem(Math.max(1, ilvl), 'set', null, null, branch);
  dropPickup('item', x, y, 1, it);
  ring(x, y, RARITY.set.color, 200, 0.9);
  banner(_T`<span style="color:${RARITY.set.color}">${it.name}</span><small>Kus setu · ${TBRANCH[it.setCls + ':' + it.set].name}</small>`);
}
function dropMythic(id, x, y, ilvl) {
  const it = generateItem(Math.max(1, ilvl || zoneLevel() + 2), 'mythic', null, null, id);
  dropPickup('item', x, y, 1, it);
  const col = RARITY.mythic.color;
  banner(_T`<span style="color:${col}">${it.name}</span><small>Mýtický predmet · ${LEGEND_INDEX[id].source}</small>`);
  log(_T`<span style="color:${col}">MÝTICKÝ PREDMET: ${it.name}</span>`);
  ring(x, y, col, 320, 1.4); ring(x, y, '#ffffff', 180, 0.8); burst(x, y, col, 90, 600, 3, 1.2); shake(10);
}
function chainLightning(src, dmg) {
  const near = enemies.filter(o => !o.dead && o !== src && d2(o.x, o.y, src.x, src.y) < 160 * 160)
    .sort((a, b) => d2(a.x, a.y, src.x, src.y) - d2(b.x, b.y, src.x, src.y)).slice(0, 2);
  let from = src;
  for (const o of near) {
    particles.push({ bolt: true, x: from.x, y: from.y, x2: o.x, y2: o.y, life: 0.15, max: 0.15, color: '#9fe6ff' });
    damageEnemy(o, dmg, false, true); from = o;
  }
}
function reflectShot(b) {
  let t = null, best = 700 * 700;
  for (const e of enemies) { if (e.dead) continue; const dd = d2(e.x, e.y, P.x, P.y); if (dd < best) { best = dd; t = e; } }
  const a = t ? Math.atan2(t.y - P.y, t.x - P.x) : Math.atan2(-b.vy, -b.vx);
  bullets.push({ x: P.x, y: P.y, px: P.x, py: P.y, vx: Math.cos(a) * 980, vy: Math.sin(a) * 980, dmg: P.stats.laserHit * 2 * dmgBuff(), crit: false, life: 0.8, w: 2.5, color: '#9fe6ff', bubble: false });
  addText(P.x, P.y - 24, _L('ODRAZ'), '#9fe6ff', 11, 0.5);
}
function updateMythic(dt) {
  const s = P.stats, st = G.station;
  for (const o of orbs) {
    o.life -= dt; o.tick -= dt;
    const f = Math.pow(0.08, dt); o.vx *= f; o.vy *= f; o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.bubble && st && st.r > 0 && d2(o.x, o.y, st.x, st.y) > st.r * st.r) { o.life = 0; continue; }
    for (const e of enemies) {
      if (e.dead || e.isBoss) continue;
      const dx = o.x - e.x, dy = o.y - e.y, d = Math.hypot(dx, dy);
      if (d < 210 && d > 6) { const k = 420 * (1 - d / 210) * dt; e.x += dx / d * k; e.y += dy / d * k; }
    }
    if (o.tick <= 0) { o.tick = 0.25; for (const e of enemies) if (!e.dead && d2(e.x, e.y, o.x, o.y) < 95 * 95) damageEnemy(e, o.dmg * 0.25, false, true); }
  }
  if (orbs.length) orbs = orbs.filter(o => o.life > 0);
  allies.forEach((a, i) => {
    a.life -= dt; a.fireT -= dt;
    let t = null, b = 520 * 520;
    if (!G.safe) for (const e of enemies) { if (e.dead) continue; const dd = d2(e.x, e.y, a.x, a.y); if (dd < b) { b = dd; t = e; } }
    let tx, ty;
    if (t) {
      const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy) || 1, rad = clamp((d - 160) / 80, -1, 1);
      tx = (dx / d * rad - dy / d * 0.7) * 260; ty = (dy / d * rad + dx / d * 0.7) * 260;
      a.a = Math.atan2(dy, dx);
      if (a.fireT <= 0) {
        a.fireT = 0.45;
        bullets.push({ x: a.x, y: a.y, px: a.x, py: a.y, vx: dx / d * 900, vy: dy / d * 900, dmg: s.missileHit * 0.12 * dmgBuff() * mres('broodheart'), crit: false, life: 0.7, w: 1.6, color: '#e14bff', bubble: false });
      }
    } else {
      const ang = G.time * 2 + i * 1.3;
      tx = (P.x + Math.cos(ang) * 60 - a.x) * 4; ty = (P.y + Math.sin(ang) * 60 - a.y) * 4; a.a = Math.atan2(ty, tx);
    }
    a.vx += (tx - a.vx) * Math.min(1, 4 * dt); a.vy += (ty - a.vy) * Math.min(1, 4 * dt);
    a.x += a.vx * dt; a.y += a.vy * dt;
  });
  if (allies.length) allies = allies.filter(a => a.life > 0);
  for (const ec of echoes) {
    ec.t -= dt;
    if (ec.t <= 0 && !ec.e.dead) { ring(ec.e.x, ec.e.y, '#e14bff', 34, 0.3); damageEnemy(ec.e, ec.amt, false, false, true); }
  }
  if (echoes.length) echoes = echoes.filter(ec => ec.t > 0);
}
