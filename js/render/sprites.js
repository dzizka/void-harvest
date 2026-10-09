'use strict';
function shipPath(c, cls) {
  c.beginPath();
  const pts = cls === 'interceptor' ? [[22, 0], [-4, -5], [-13, -16], [-9, -4], [-12, 0], [-9, 4], [-13, 16], [-4, 5]]
    : cls === 'juggernaut' ? [[21, 0], [13, -12], [-3, -18], [-16, -13], [-19, 0], [-16, 13], [-3, 18], [13, 12]]
    : cls === 'carrier' ? [[19, 0], [9, -11], [-12, -16], [-19, -9], [-15, 0], [-19, 9], [-12, 16], [9, 11]]
    : [[15, 0], [6, -9], [-13, -11], [-18, 0], [-13, 11], [6, 9]];
  pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
  c.closePath();
}
function drawShip(c, cls, x, y, a, scale, thrust, flash, halo, row) {
  const col = shipCol(cls), S3 = spr3d('ship_' + cls);
  if (S3) {
    // pseudo-3D sprite: class-coloured glow underneath, engine flame behind, sheet frame on top
    const D = 56 * scale;
    c.save(); c.translate(x, y);
    if (halo) { c.fillStyle = halo + '22'; c.beginPath(); c.arc(0, 0, D * 0.5, 0, TAU); c.fill(); }
    if (thrust) {
      const fl = rand(0.7, 1.2), bx = -Math.cos(a) * D * 0.36, by = -Math.sin(a) * D * 0.36;
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(bx, by, 0, bx, by, D * 0.3 * fl);
      g.addColorStop(0, col + 'cc'); g.addColorStop(1, col + '00');
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, D * 0.3 * fl, 0, TAU); c.fill();
      c.globalCompositeOperation = 'source-over';
    }
    drawSpr(c, S3, 0, 0, a, D, row ?? 1);
    if (flash > 0) flashSpr(c, S3, 0, 0, a, D, row ?? 1, 0.75);
    c.restore();
    return;
  }
  c.save(); c.translate(x, y); c.rotate(a); c.scale(scale, scale);
  if (halo) { c.lineJoin = 'round'; shipPath(c, cls); c.strokeStyle = halo + '50'; c.lineWidth = 10; c.stroke(); }
  if (thrust) {
    const fl = rand(0.7, 1.2);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = col + '99';
    c.beginPath(); c.moveTo(-12, -4); c.lineTo(-12 - 14 * fl, 0); c.lineTo(-12, 4); c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  c.lineJoin = 'round';
  shipPath(c, cls); c.strokeStyle = col + '33'; c.lineWidth = 7; c.stroke();
  shipPath(c, cls); c.fillStyle = flash > 0 ? '#5a1f22' : '#0b1424'; c.fill();
  c.strokeStyle = flash > 0 ? '#ff6b5a' : col; c.lineWidth = 1.8; c.stroke();
  c.strokeStyle = col; c.lineWidth = 1.2;
  if (cls === 'interceptor') {
    c.beginPath(); c.moveTo(14, 0); c.lineTo(2, 0); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(6, 0, 2, 0, TAU); c.fill();
  } else if (cls === 'juggernaut') {
    c.beginPath(); c.moveTo(9, -8); c.lineTo(-10, -8); c.moveTo(9, 8); c.lineTo(-10, 8); c.stroke();
    c.fillStyle = col; c.fillRect(12, -10, 9, 3); c.fillRect(12, 7, 9, 3);
    c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.stroke();
  } else if (cls === 'carrier') {
    c.beginPath(); c.moveTo(5, -8); c.lineTo(-13, -11); c.moveTo(5, 8); c.lineTo(-13, 11); c.moveTo(-6, -5); c.lineTo(-6, 5); c.stroke();
    c.fillStyle = col; c.fillRect(-12, -3, 6, 6);
    c.beginPath(); c.arc(10, 0, 2.2, 0, TAU); c.fill();
  } else {
    c.beginPath(); c.moveTo(6, -9); c.lineTo(20, -15); c.lineTo(25, -8); c.moveTo(6, 9); c.lineTo(20, 15); c.lineTo(25, 8); c.stroke();
    c.beginPath(); c.arc(-3, 0, 5, -1.2, 1.2); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(-3, 0, 1.8, 0, TAU); c.fill();
  }
  c.restore();
}

function drawBoss(e) {
  const B = e.B, col = B.color, t = G.time;
  if (e.shielded) {
    ctx.strokeStyle = 'rgba(232,226,255,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]);
    for (const p of e.arch.pylons) if (!p.dead) { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(232,226,255,.08)'; ctx.strokeStyle = 'rgba(232,226,255,.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 30, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.save(); ctx.translate(e.x, e.y);
  ctx.save(); ctx.rotate(t * (e.ph2 ? 1.1 : 0.5));
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
  ctx.beginPath();
  const n = B.sides * 2;
  for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.moveTo(Math.cos(a) * (e.r + 6), Math.sin(a) * (e.r + 6)); ctx.lineTo(Math.cos(a) * (e.r + 18), Math.sin(a) * (e.r + 18)); }
  ctx.stroke(); ctx.globalAlpha = 1; ctx.restore();
  ctx.rotate(e.a);
  ctx.beginPath();
  for (let i = 0; i < B.sides; i++) { const a = i / B.sides * TAU; const r = e.r * (i % 2 ? 0.86 : 1); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); }
  ctx.closePath();
  const white = e.flash > 0 || (e.state === 'wind' && Math.floor(e.patClock * 14) % 2 === 0);
  ctx.fillStyle = white ? '#ffffff' : '#160a14'; ctx.fill();
  ctx.strokeStyle = col + '44'; ctx.lineWidth = 10; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < B.sides; i++) { const a = i / B.sides * TAU + Math.PI / B.sides; const r = e.r * 0.55; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath(); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = col; ctx.fillRect(e.r - 6, -4, 16, 8);
  const pulse = 9 + Math.sin(t * (e.ph2 ? 9 : 4)) * 3;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = col + '66'; ctx.beginPath(); ctx.arc(0, 0, pulse * 1.8, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, pulse * 0.6, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawEnemy(e) {
  if (e.isBoss) { drawBoss(e); return; }
  const col = e.T.color;
  if (e.state === 'wind') {
    // charge telegraph
    const k = 1 - clamp(e.stateT / 0.65, 0, 1);
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.dashA);
    ctx.fillStyle = `rgba(255,90,54,${0.08 + 0.18 * k})`; ctx.fillRect(0, -e.r * 0.8, 360, e.r * 1.6);
    ctx.strokeStyle = `rgba(255,140,100,${0.3 + 0.5 * k})`; ctx.lineWidth = 1.5; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(360, 0); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
  if (e.state === 'aim') {
    const k = 1 - clamp(e.stateT / 1.15, 0, 1);
    ctx.strokeStyle = `rgba(255,225,77,${0.15 + 0.6 * k})`; ctx.lineWidth = 1 + 2 * k;
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.aimA) * 1000, e.y + Math.sin(e.aimA) * 1000); ctx.stroke();
  }
  if (e.type === 'healer' && e.healT && !e.healT.dead && d2(e.x, e.y, e.healT.x, e.healT.y) < 170 * 170) {
    ctx.strokeStyle = 'rgba(91,224,154,.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -G.time * 40;
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.healT.x, e.healT.y); ctx.stroke(); ctx.setLineDash([]);
  }
  if (e.prot > G.time) { ctx.strokeStyle = 'rgba(111,184,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, TAU); ctx.stroke(); }
  if (e.cloak) ctx.globalAlpha = 0.14 + 0.06 * Math.sin(G.time * 8 + e.x);
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.elite) {
    const mc = e.mods ? ELITE_MODS[e.mods[0]].color : '#ffd36b';
    ctx.fillStyle = mc + '18'; ctx.beginPath(); ctx.arc(0, 0, e.r + 16, 0, TAU); ctx.fill();
    if (e.esh > 0) { ctx.strokeStyle = 'rgba(111,184,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, e.r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * e.esh / e.eshMax); ctx.stroke(); }
    ctx.save(); ctx.rotate(e.spin * 1.5); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, e.r + 9, 0, TAU); ctx.stroke(); ctx.restore();
  }
  const S3 = spr3d('en_' + e.type), white = e.flash > 0 || (e.state === 'wind' && Math.floor(e.stateT * 14) % 2 === 0);
  if (S3) {
    // type colour stays readable as a soft glow under the model
    ctx.fillStyle = col + '24'; ctx.beginPath(); ctx.arc(0, 0, e.r * 1.25, 0, TAU); ctx.fill();
    drawSpr(ctx, S3, 0, 0, e.a, e.r * 3.3, 0);
    if (white) flashSpr(ctx, S3, 0, 0, e.a, e.r * 3.3, 0, 0.8);
  } else {
  ctx.rotate(e.a);
  const s = e.r / e.T.r;
  ctx.scale(s, s);
  ctx.beginPath();
  switch (e.type) {
    case 'drone': ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); break;
    case 'fighter': ctx.moveTo(15, 0); ctx.lineTo(-2, -5); ctx.lineTo(-10, -14); ctx.lineTo(-7, 0); ctx.lineTo(-10, 14); ctx.lineTo(-2, 5); break;
    case 'gunship': ctx.moveTo(18, -8); ctx.lineTo(18, 8); ctx.lineTo(4, 20); ctx.lineTo(-18, 16); ctx.lineTo(-22, 0); ctx.lineTo(-18, -16); ctx.lineTo(4, -20); break;
    case 'charger': for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 7 : 15; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); } break;
    case 'splitter': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, r = i % 2 ? 9 : 19; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); } break;
    case 'sniper': ctx.moveTo(20, 0); ctx.lineTo(-6, -7); ctx.lineTo(-12, -3); ctx.lineTo(-12, 3); ctx.lineTo(-6, 7); break;
    case 'minelayer': ctx.moveTo(14, -8); ctx.lineTo(14, 8); ctx.lineTo(4, 15); ctx.lineTo(-14, 12); ctx.lineTo(-18, 0); ctx.lineTo(-14, -12); ctx.lineTo(4, -15); break;
    case 'healer': { const w = 5, L = 14; ctx.moveTo(L, -w); ctx.lineTo(L, w); ctx.lineTo(w, w); ctx.lineTo(w, L); ctx.lineTo(-w, L); ctx.lineTo(-w, w); ctx.lineTo(-L, w); ctx.lineTo(-L, -w); ctx.lineTo(-w, -w); ctx.lineTo(-w, -L); ctx.lineTo(w, -L); ctx.lineTo(w, -w); break; }
    case 'shieldbearer': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; i ? ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20) : ctx.moveTo(20, 0); } break;
    case 'stalker': ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-4, 0); ctx.lineTo(-10, 11); break;
    case 'chest': ctx.rect(-16, -12, 32, 24); break;
    case 'goblin': ctx.moveTo(14, 0); ctx.lineTo(2, -11); ctx.lineTo(-12, -8); ctx.lineTo(-8, 0); ctx.lineTo(-12, 8); ctx.lineTo(2, 11); break;
  }
  ctx.closePath();
  ctx.fillStyle = white ? '#ffffff' : '#1c0b14'; ctx.fill();
  if (!white) { ctx.fillStyle = col + '3a'; ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke();
  if (e.type === 'gunship') { ctx.fillStyle = col; ctx.fillRect(14, -12, 8, 3); ctx.fillRect(16, -1.5, 9, 3); ctx.fillRect(14, 9, 8, 3); }
  if (e.type === 'shieldbearer') { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 27, -0.9, 0.9); ctx.stroke(); }
  if (e.type === 'minelayer') { ctx.fillStyle = col; ctx.fillRect(-20, -4, 6, 8); }
  if (e.type === 'chest') { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-16, -3); ctx.lineTo(16, -3); ctx.stroke(); ctx.fillStyle = col; ctx.fillRect(-3, -5, 6, 7); }
  if (e.type === 'goblin') { ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(-14, 0, 5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(e.type === 'charger' ? 0 : 2, 0, 2.2, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  if (e.cloak) return;
  if (e.hp < e.maxHp || e.elite) {
    const w = e.r * 2.2, y = e.y - e.r - (e.elite ? 16 : 9);
    ctx.fillStyle = '#1a0d14'; ctx.fillRect(e.x - w / 2, y, w, 3);
    ctx.fillStyle = e.elite ? '#ffd36b' : col; ctx.fillRect(e.x - w / 2, y, w * clamp(e.hp / e.maxHp, 0, 1), 3);
    if (e.elite) {
      ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = e.hunter ? '#ff8a5c' : '#ffd36b';
      ctx.fillText(e.hunter ? `${e.hunter.name.toUpperCase()} · ${e.lvl}` : e.label ? `${e.label.toUpperCase()} · ${e.lvl}` : `${eliteAdj(e.T).toUpperCase()} ${e.T.name.toUpperCase()} · ${e.lvl}`, e.x, y - (e.mods ? 15 : 4));
      if (e.mods) { let x0 = e.x - e.mods.reduce((w, m) => w + ctx.measureText(ELITE_MODS[m].name).width + 8, -8) / 2; for (const m of e.mods) { const w = ctx.measureText(ELITE_MODS[m].name).width; ctx.fillStyle = ELITE_MODS[m].color; ctx.textAlign = 'left'; ctx.fillText(ELITE_MODS[m].name, x0, y - 4); x0 += w + 8; } ctx.textAlign = 'center'; }
    }
  }
}

function drawMythicFx() {
  for (const o of orbs) {
    ctx.globalAlpha = clamp(o.life / 0.4, 0, 1);
    ctx.fillStyle = 'rgba(225,75,255,.035)'; ctx.beginPath(); ctx.arc(o.x, o.y, 210, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(G.time * 4);
    ctx.strokeStyle = '#e14bff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 1.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 40, Math.PI, Math.PI * 1.8); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(o.x, o.y, 15, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd6ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(o.x, o.y, 15, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const f of fires) {
    ctx.globalAlpha = clamp(f.t / 0.6, 0, 1);
    ctx.fillStyle = 'rgba(255,120,60,.13)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff9470'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]); ctx.lineDashOffset = -G.time * 30;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.92 + 0.06 * Math.sin(G.time * 9 + f.x)), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  if (minions.length) {
    const M = P.stats.minion, col = M && M.altar ? '#ff5f6d' : '#ff9d6e';
    for (const m of minions) {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a);
      ctx.lineJoin = 'round';
      if (m.titan) {
        ctx.fillStyle = '#24160c'; ctx.strokeStyle = '#ffcf6e'; ctx.lineWidth = 2.5;
        ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(26, -7); ctx.lineTo(10, -7); ctx.moveTo(26, 7); ctx.lineTo(10, 7); ctx.stroke();
        ctx.fillStyle = '#ffcf6e'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = '#1e100c'; ctx.strokeStyle = col; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -7); ctx.lineTo(-3, 0); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      if (m.hp < m.maxHp) {
        const w = m.r * 2.4;
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(m.x - w / 2, m.y - m.r - 9, w, 3);
        ctx.fillStyle = col; ctx.fillRect(m.x - w / 2, m.y - m.r - 9, w * clamp(m.hp / m.maxHp, 0, 1), 3);
      }
    }
  }
  for (const a of allies) {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.a);
    ctx.fillStyle = '#1a0b22'; ctx.strokeStyle = '#e14bff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (G.mode === 'play' && P.drones.length) {
    const kind = P.stats.drones ? P.stats.drones.kind : 'assault';
    const col = kind === 'mining' ? '#c8a27c' : kind === 'repair' ? '#5be09a' : CLASSES[P.cls].color;
    for (const d of P.drones) {
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
      ctx.fillStyle = '#0b1424'; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -5); ctx.lineTo(-6, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
  if (G.mode === 'play' && P.stasisT > 0) { ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(G.time * 12); ctx.beginPath(); ctx.arc(P.x, P.y, 32, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  if (G.mode === 'play' && P.crystal > 0) {
    for (let i = 0; i < P.crystal; i++) {
      const a = G.time * 1.6 + i * TAU / 3, x = P.x + Math.cos(a) * 36, y = P.y + Math.sin(a) * 36;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = '#e14bff'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}

function drawAsteroid(a) {
  if (a.kind === 'radiant') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(225,75,255,' + (0.12 + 0.08 * Math.sin(G.time * 4)).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 1.6, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  const S3 = spr3d('ast_' + a.kind);
  if (S3) {
    // tumble frame follows the asteroid's spin; each rock starts at its own phase
    const D = a.r * 2.45, ph = (a.verts.length * 1.7 + a.r) % TAU;
    drawSpr(ctx, S3, a.x, a.y, -(a.rot + ph), D, 0);
    if (a.flash > 0) flashSpr(ctx, S3, a.x, a.y, -(a.rot + ph), D, 0, 0.5);
  } else {
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
  ctx.beginPath(); a.verts.forEach((v, i) => i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath();
  ctx.fillStyle = a.flash > 0 ? '#3b4252' : a.K.fill; ctx.fill();
  ctx.strokeStyle = a.K.stroke; ctx.lineWidth = 1.5; ctx.stroke();
  if (GFX.q !== 'low') {
    ctx.save(); ctx.rotate(-a.rot); ctx.translate(-a.r * 0.18, -a.r * 0.2); ctx.rotate(a.rot); ctx.scale(0.62, 0.62);
    ctx.beginPath(); a.verts.forEach((v, i) => i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,.045)'; ctx.fill(); ctx.restore();
  }
  if (a.veins.length) {
    ctx.strokeStyle = a.K.vein; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.8;
    ctx.beginPath(); for (const v of a.veins) { ctx.moveTo(v[0], v[1]); ctx.lineTo(v[2], v[3]); } ctx.stroke();
    ctx.globalAlpha = 1;
    if ((a.kind === 'crystal' || a.kind === 'radiant') && GFX.q !== 'low') {
      const tw = Math.sin(G.time * 3 + a.x * 0.01);
      if (tw > 0.6) { const v = a.veins[0], k = (tw - 0.6) * 2.5; ctx.fillStyle = a.K.vein; ctx.globalAlpha = k; ctx.fillRect(v[2] - 1, v[3] - 4, 2, 8); ctx.fillRect(v[2] - 4, v[3] - 1, 8, 2); ctx.globalAlpha = 1; }
    }
  }
  ctx.restore();
  }
  if (a.hp < a.maxHp) {
    ctx.strokeStyle = '#c8a27c'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(a.hp / a.maxHp, 0, 1)); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawPickup(p) {
  if (p.kind === 'xp') {
    ctx.fillStyle = '#b48cff'; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
    ctx.fillRect(-3, -3, 6, 6); ctx.restore();
    ctx.fillStyle = 'rgba(180,140,255,.18)'; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, TAU); ctx.fill();
  } else if (p.kind === 'gem') {
    const G0 = GEMS[p.gem.t];
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.t * 2) * 0.4);
    ctx.fillStyle = G0.color; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    const sz = 6 + p.gem.q * 2;
    ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.8, -sz * 0.3); ctx.lineTo(0, sz); ctx.lineTo(-sz * 0.8, -sz * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (d2(p.x, p.y, P.x, P.y) < 300 * 300) worldLabel(gemName(p.gem.t, p.gem.q).toUpperCase(), p.x, p.y + 26, G0.color, 10);
  } else if (p.kind === 'key') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 1.5);
    ctx.strokeStyle = '#ff6b5a'; ctx.fillStyle = '#2a0c10'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; i ? ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10) : ctx.moveTo(10, 0); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    worldLabel(_T`KĽÚČ ${p.key.lvl}`, p.x, p.y + 28, '#ff6b5a', 10);
  } else if (p.kind === 'mat') {
    const col = MATS[p.mat].color;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin * 0.6);
    ctx.fillStyle = '#0b1424'; ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; i ? ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6) : ctx.moveTo(6, 0); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(-1.5, -1.5, 3, 3); ctx.restore();
  } else if (p.kind === 'ore') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin * 0.5);
    ctx.fillStyle = '#5a4430'; ctx.strokeStyle = '#e0bb8f'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(1, -5); ctx.lineTo(-4, -3); ctx.lineTo(-4, 3); ctx.lineTo(2, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  } else {
    const it = p.item, col = RARITY[it.rarity].color, rk = RARITY[it.rarity].rank;
    if (rk >= 1) {
      const h = [0, 70, 120, 220, 340][rk], gr = ctx.createLinearGradient(p.x, p.y - h, p.x, p.y);
      gr.addColorStop(0, col + '00'); gr.addColorStop(1, col + (rk >= 3 ? 'aa' : '66'));
      const bw = rk === 4 ? 12 : rk === 3 ? 8 : 4;
      ctx.fillStyle = gr; ctx.fillRect(p.x - bw / 2, p.y - h, bw, h);
      if (rk === 4) { ctx.strokeStyle = col; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(p.t * 6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 18 + 6 * Math.sin(p.t * 3), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    }
    const pulse = 1 + Math.sin(p.t * 5) * 0.12;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#0b1424'; ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.fillRect(-6, -6, 12, 12); ctx.strokeRect(-6, -6, 12, 12);
    ctx.restore();
    const ns = gaExtra(it);
    if (ns >= 1) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 1.5;
      for (let i = 0; i < ns * 2 + 1; i++) { const a = p.t * 1.6 + i / (ns * 2 + 1) * TAU, r = 16 + 3 * Math.sin(p.t * 4 + i); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(p.t * 5 + i);
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r - 3, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r + 3, Math.sin(a) * r); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r - 3); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r + 3); ctx.stroke(); }
      ctx.restore();
    }
    const near = d2(p.x, p.y, P.x, P.y) < 300 * 300;
    if (rk >= 2 || ns >= 1 || near) {
      const lbl = (gaN(it) ? '✦'.repeat(gaN(it)) + ' ' : '') + it.name;
      ctx.font = '600 11px "Chakra Petch", sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(5,8,15,.75)'; const w = ctx.measureText(lbl).width + 10;
      ctx.fillRect(p.x - w / 2, p.y + 12, w, 15);
      ctx.fillStyle = ns >= 2 ? '#ffd36b' : col; ctx.fillText(lbl, p.x, p.y + 23);
    }
  }
}

function worldLabel(txt, x, y, col, size) {
  ctx.font = _T`700 ${size || 11}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(5,8,15,.7)'; const w = ctx.measureText(txt).width + 12;
  ctx.fillRect(x - w / 2, y - 12, w, 17);
  ctx.fillStyle = col; ctx.fillText(txt, x, y);
}

function drawStation(st) {
  const t = G.time, S = curSector();
  ctx.save(); ctx.translate(st.x, st.y);
  if (st.r > 0) {
    ctx.fillStyle = 'rgba(95,212,255,.035)'; ctx.beginPath(); ctx.arc(0, 0, st.r, 0, TAU); ctx.fill();
    ctx.save(); ctx.rotate(t * 0.05); ctx.strokeStyle = 'rgba(95,212,255,.45)'; ctx.lineWidth = 2; ctx.setLineDash([22, 14]);
    ctx.beginPath(); ctx.arc(0, 0, st.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
  ctx.strokeStyle = 'rgba(95,212,255,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, st.dock, 0, TAU); ctx.stroke();
  ctx.save(); ctx.rotate(t * 0.25);
  ctx.strokeStyle = '#9fb4d8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.lineTo(Math.cos(a) * 68, Math.sin(a) * 68); ctx.stroke();
    ctx.fillStyle = '#0b1424'; ctx.fillRect(Math.cos(a) * 70 - 7, Math.sin(a) * 70 - 7, 14, 14);
    ctx.strokeRect(Math.cos(a) * 70 - 7, Math.sin(a) * 70 - 7, 14, 14);
    if (Math.floor(t * 2 + i) % 3 === 0) { ctx.fillStyle = '#5fd4ff'; ctx.fillRect(Math.cos(a) * 70 - 2, Math.sin(a) * 70 - 2, 4, 4); }
  }
  ctx.restore();
  ctx.fillStyle = '#0b1424'; ctx.strokeStyle = '#5fd4ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(95,212,255,' + (0.5 + Math.sin(t * 3) * 0.3) + ')'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
  ctx.restore();
  worldLabel(S.kind === 'safe' ? S.name.toUpperCase() : _L('MAJÁK · BEZPEČNÁ ZÓNA'), st.x, st.y + 108, '#5fd4ff');
}

function drawPortalRing(x, y, col, r, t, label, sub) {
  ctx.save(); ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, '#000000'); g.addColorStop(0.6, col + '33'); g.addColorStop(1, col + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = col;
  for (let i = 0; i < 3; i++) {
    const rr = r * (0.45 + i * 0.2), a0 = t * (1.2 - i * 0.35) * (i % 2 ? -1 : 1) + i;
    ctx.globalAlpha = 0.9 - i * 0.2;
    ctx.beginPath(); ctx.arc(0, 0, rr, a0, a0 + Math.PI * 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, rr, a0 + Math.PI * 1.45, a0 + Math.PI * 1.85); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
  if (label) worldLabel(label, x, y + r + 20, col);
  if (sub) worldLabel(sub, x, y + r + 38, '#7f8ca8', 10);
}

function drawArena() {
  const A = G.arena, col = BOSSES[G.dungeon.boss].color;
  ctx.fillStyle = 'rgba(2,3,8,.7)';
  ctx.beginPath(); ctx.rect(-2000, -2000, WORLD.w + 4000, WORLD.h + 4000); ctx.arc(A.x, A.y, A.r, 0, TAU, true); ctx.fill();
  ctx.strokeStyle = col + '22'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(A.x, A.y, A.r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.x, A.y, A.r, 0, TAU); ctx.stroke();
  ctx.fillStyle = col;
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    ctx.save(); ctx.translate(A.x + Math.cos(a) * A.r, A.y + Math.sin(a) * A.r); ctx.rotate(a);
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.time * 2 + i);
    ctx.fillRect(-4, -9, 14, 18); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
