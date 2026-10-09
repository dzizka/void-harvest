'use strict';
function render() {
  const W = view.w, H = view.h, z = view.zoom, dpr = view.dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, W, H);
  drawBackground();
  if (!G) return;
  drawBackdrop();
  const sx = (Math.random() - 0.5) * G.shake, sy = (Math.random() - 0.5) * G.shake;
  ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - cam.x * z + sx), dpr * (H / 2 - cam.y * z + sy));
  const hw = W / 2 / z + 120, hh = H / 2 / z + 120;
  const vis = (x, y, r) => Math.abs(x - cam.x) < hw + r && Math.abs(y - cam.y) < hh + r;

  drawDust(z);
  if (G.arena) drawArena();
  else {
    ctx.strokeStyle = '#2b3d63'; ctx.lineWidth = 2; ctx.setLineDash([18, 12]);
    ctx.strokeRect(0, 0, WORLD.w, WORLD.h); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,90,80,.04)';
    ctx.fillRect(-2000, -2000, WORLD.w + 4000, 2000); ctx.fillRect(-2000, WORLD.h, WORLD.w + 4000, 2000);
    ctx.fillRect(-2000, 0, 2000, WORLD.h); ctx.fillRect(WORLD.w, 0, 2000, WORLD.h);
  }
  if (G.station && vis(G.station.x, G.station.y, Math.max(G.station.r, 200))) drawStation(G.station);
  drawBase();
  drawExploration();
  for (const g of G.gates) if (vis(g.x, g.y, 120)) { const B = BOSSES[g.boss]; drawPortalRing(g.x, g.y, B.color, 62, G.time + g.t, _T`BRÁNA · ÚR. ${g.lvl}`, B.lair); }
  if (G.dungeon && G.dungeon.portal && G.dungeon.portal.t > -1.5) {
    const p = G.dungeon.portal, ready = p.t > 0;
    drawPortalRing(p.x, p.y, p.kind === 'next' ? '#5fd4ff' : '#5be09a', ready ? 60 : 30 + 30 * clamp(p.t + 1.5, 0, 1.5) / 1.5, G.time, ready ? (p.kind === 'next' ? _L('ĎALŠIA KOMNATA') : _L('NÁVRAT DO SEKTORA')) : '', '');
  }

  if (trails.length) {
    ctx.globalCompositeOperation = 'lighter';
    for (const t of trails) { ctx.fillStyle = `rgba(255,138,31,${0.25 * t.life / 1.4})`; ctx.beginPath(); ctx.arc(t.x, t.y, 12, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  for (const a of asteroids) if (vis(a.x, a.y, a.r)) drawAsteroid(a);

  if (P.stats.aura && G.mode === 'play') {
    const R = P.stats.aura.r * (P.auraBoostT > 0 ? 1.5 : 1);
    ctx.fillStyle = 'rgba(194,155,255,.045)'; ctx.beginPath(); ctx.arc(P.x, P.y, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(G.time * 0.6);
    ctx.strokeStyle = 'rgba(194,155,255,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([10, 14]);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
  for (const p of pickups) if (vis(p.x, p.y, 60)) drawPickup(p);
  for (const e of enemies) if (vis(e.x, e.y, e.r + 30)) drawEnemy(e);

  for (const m of missiles) {
    if (m.plasma) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(127,200,255,.35)'; ctx.beginPath(); ctx.arc(m.x, m.y, 11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#dff3ff'; ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (spr3d('missile')) {
      drawSpr(ctx, spr3d('missile'), m.x, m.y, m.a, 24, 0);
    } else {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a);
      ctx.fillStyle = '#ffd7a8'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -3); ctx.lineTo(-5, 3); ctx.fill(); ctx.restore();
    }
  }
  drawEvent();
  drawHazards();
  drawAbilityFx();
  drawEndgameFx();
  drawMythicFx();
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const b of bullets) {
    const sp = Math.hypot(b.vx, b.vy) || 1, l = b.len || 16, ex = b.x - b.vx / sp * l, ey = b.y - b.vy / sp * l;
    ctx.strokeStyle = b.color + '55'; ctx.lineWidth = b.w * 3;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = b.color; ctx.lineWidth = b.w;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
    if (b.core) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = b.w * 0.4; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke(); }
  }
  for (const b of ebullets) {
    ctx.fillStyle = b.color + '50'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff2f4'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.6, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  if (G.mode === 'play') {
    if (P.rib && P.rib.length > 2 && GFX.q !== 'low') {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      const col = CLASSES[P.cls].color;
      for (let i = 1; i < P.rib.length; i++) {
        const k = i / P.rib.length;
        ctx.strokeStyle = col; ctx.globalAlpha = 0.35 * k; ctx.lineWidth = 1 + 6 * k;
        ctx.beginPath(); ctx.moveTo(P.rib[i - 1].x, P.rib[i - 1].y); ctx.lineTo(P.rib[i].x, P.rib[i].y); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    const myth = SLOT_ORDER.some(sl => P.equip[sl].rarity === 'mythic');
    drawShip(ctx, P.cls, P.x, P.y, P.a, 1.2, P.thrust, P.hitFlash, myth ? RARITY.mythic.color : null, bankRow(P, G.paused ? 1 : 1 / Math.max(20, G.fps || 60)));
    if (P.shield > 0) {
      const f = P.shield / P.stats.maxShield, hit = P.shieldFlash > 0;
      if (hit) { ctx.fillStyle = 'rgba(160,225,255,.14)'; ctx.beginPath(); ctx.arc(P.x, P.y, 31, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = hit ? 'rgba(220,245,255,.95)' : `rgba(95,212,255,${0.12 + f * 0.3})`;
      ctx.lineWidth = hit ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(P.x, P.y, 31, 0, TAU); ctx.stroke();
    }
    if (P.chillT > 0) { ctx.strokeStyle = 'rgba(191,239,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(P.x, P.y, 24, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (P.oshield > 1) { ctx.strokeStyle = 'rgba(255,201,77,.55)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(P.x, P.y, 36, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (P.autoAim && !P.autoAim.dead) {
      const t = P.autoAim, r = (t.r || 20) + 10, c = t.T ? '#ff6b5a' : '#c8a27c', k = 7;
      ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.moveTo(t.x + sx * r, t.y + sy * (r - k)); ctx.lineTo(t.x + sx * r, t.y + sy * r); ctx.lineTo(t.x + sx * (r - k), t.y + sy * r);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    const mw = mouseWorld();
    ctx.strokeStyle = 'rgba(217,227,243,.12)'; ctx.lineWidth = 1; ctx.setLineDash([3, 7]);
    ctx.beginPath(); ctx.moveTo(P.x + Math.cos(P.a) * 30, P.y + Math.sin(P.a) * 30); ctx.lineTo(mw.x, mw.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(217,227,243,.6)'; ctx.beginPath(); ctx.arc(mw.x, mw.y, 9, 0, TAU); ctx.stroke();
    // arrow toward the nearest gate / portal / beacon when it is off-screen
    let tgt = null, col = '#5fd4ff';
    if (G.dungeon && G.dungeon.portal && G.dungeon.portal.t > 0) { tgt = G.dungeon.portal; col = tgt.kind === 'next' ? '#5fd4ff' : '#5be09a'; }
    else if (!G.dungeon && G.gates.length) { let b = Infinity; for (const g of G.gates) { const dd = d2(g.x, g.y, P.x, P.y); if (dd < b) { b = dd; tgt = g; } } if (tgt) col = BOSSES[tgt.boss].color; }
    const arrows = tgt ? [[tgt, col]] : [];
    if (!G.dungeon && G.station && curSector().kind === 'hostile') arrows.push([G.station, '#5fd4ff']);
    if (G.event) arrows.push([G.event.ship && G.event.state === 'active' ? G.event.ship : G.event, G.event.E.color]);
    for (const e of enemies) if (e.hunter) arrows.push([e, '#ff8a5c']); else if (e.isBoss && !e.dead) arrows.push([e, e.B.color]); else if (e.elite && !e.dead) arrows.push([e, '#ffd36b']);
    for (const [o, c] of arrows) {
      if (vis(o.x, o.y, -140)) continue;
      const a = Math.atan2(o.y - P.y, o.x - P.x);
      ctx.save(); ctx.translate(P.x + Math.cos(a) * 58, P.y + Math.sin(a) * 58); ctx.rotate(a);
      ctx.fillStyle = c; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      if (o === G.station) { ctx.arc(0, 0, 4, 0, TAU); } else { ctx.moveTo(9, 0); ctx.lineTo(-5, -6); ctx.lineTo(-2, 0); ctx.lineTo(-5, 6); }
      ctx.fill(); ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    const t = clamp(p.life / p.max, 0, 1);
    if (p.beam) {
      ctx.globalAlpha = t; ctx.strokeStyle = p.color; ctx.lineWidth = p.w * t + 1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x2, p.y2); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, p.w * 0.35 * t);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x2, p.y2); ctx.stroke(); ctx.lineCap = 'butt';
    } else if (p.bolt) {
      ctx.strokeStyle = p.color; ctx.globalAlpha = t; ctx.lineWidth = 2;
      const mx2 = (p.x + p.x2) / 2 + rand(-12, 12), my2 = (p.y + p.y2) / 2 + rand(-12, 12);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx2, my2); ctx.lineTo(p.x2, p.y2); ctx.stroke();
    } else if (p.ring) {
      const r = lerp(p.r1, p.r0, t);
      ctx.strokeStyle = p.color; ctx.globalAlpha = t * 0.8; ctx.lineWidth = 2 + 3 * t;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
    } else if (p.shard) {
      if (!vis(p.x, p.y, 20)) continue;
      ctx.strokeStyle = p.color; ctx.globalAlpha = t; ctx.lineWidth = 1.6;
      const cx = Math.cos(p.a) * p.len, cy = Math.sin(p.a) * p.len;
      ctx.beginPath(); ctx.moveTo(p.x - cx, p.y - cy); ctx.lineTo(p.x + cx, p.y + cy); ctx.stroke();
    } else {
      if (!vis(p.x, p.y, 10)) continue;
      ctx.globalAlpha = t; ctx.fillStyle = p.color;
      const s = p.size * (0.5 + t * 0.5);
      ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawGlow();
  ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - cam.x * z + sx), dpr * (H / 2 - cam.y * z + sy));

  ctx.textAlign = 'center';
  for (const t of texts) {
    ctx.globalAlpha = clamp(t.life / t.max * 1.6, 0, 1);
    ctx.font = _T`700 ${t.size}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#05080f'; ctx.fillText(t.txt, t.x + 1, t.y + 1);
    ctx.fillStyle = t.color; ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  drawStormOverlay(W, H, dpr);
  drawHazardOverlay(W, H, dpr);
  if (G.freezeT > 0) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = 'rgba(150,200,255,.09)'; ctx.fillRect(0, 0, W, H); }
  if (G.intro) {
    const I = G.intro, k = clamp(Math.min(I.t, I.t0 - I.t) / 0.35, 0, 1), bh = H * 0.11 * k, col = I.e.B.color;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
    ctx.globalAlpha = k; ctx.textAlign = 'center';
    const ty = H * 0.68, band = ctx.createLinearGradient(0, ty - 70, 0, ty + 30);
    band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, 'rgba(0,0,0,.55)'); band.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = band; ctx.fillRect(0, ty - 70, W, 100);
    ctx.font = _T`700 ${Math.round(clamp(W / 26, 24, 46))}px "Chakra Petch", sans-serif`; ctx.fillStyle = col;
    ctx.fillText(I.e.B.name.toUpperCase(), W / 2, ty);
    ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.fillStyle = '#9aa6c0'; ctx.fillText(_T`ÚROVEŇ ${I.e.lvl} · ${I.e.B.lair.toUpperCase()}`, W / 2, ty + 22);
    ctx.globalAlpha = 1;
  }
}

function drawMinimap() {
  const S = mini.width, k = S / WORLD.w;
  mctx.clearRect(0, 0, S, S);
  if (G.arena) {
    mctx.strokeStyle = BOSSES[G.dungeon.boss].color + '99'; mctx.lineWidth = 1.5;
    mctx.beginPath(); mctx.arc(G.arena.x * k, G.arena.y * k, G.arena.r * k, 0, TAU); mctx.stroke();
  }
  if (G.station) {
    mctx.fillStyle = 'rgba(95,212,255,.12)'; mctx.strokeStyle = 'rgba(95,212,255,.6)';
    mctx.beginPath(); mctx.arc(G.station.x * k, G.station.y * k, Math.max(4, G.station.r * k), 0, TAU); mctx.fill(); mctx.stroke();
    mctx.fillStyle = '#5fd4ff'; mctx.fillRect(G.station.x * k - 2, G.station.y * k - 2, 4, 4);
    if (!G.dungeon && curSector().kind === 'hostile') {
      mctx.setLineDash([2, 3]); mctx.lineWidth = 1;
      [900, 1400, 1900].forEach((r, i) => { mctx.strokeStyle = `rgba(255,107,90,${0.18 + i * 0.12})`; mctx.beginPath(); mctx.arc(G.station.x * k, G.station.y * k, r * k, 0, TAU); mctx.stroke(); });
      mctx.setLineDash([]);
    }
  }
  mctx.fillStyle = '#5d6780';
  for (const a of asteroids) mctx.fillRect(a.x * k - 0.7, a.y * k - 0.7, a.size > 1 ? 2 : 1.3, a.size > 1 ? 2 : 1.3);
  for (const p of pickups) if (p.kind === 'item') { mctx.fillStyle = RARITY[p.item.rarity].color; mctx.fillRect(p.x * k - 1.5, p.y * k - 1.5, 3, 3); }
  drawMinimapEndgame(k);
  drawMinimapExplore(k);
  mctx.font = '700 9px "JetBrains Mono", monospace'; mctx.textAlign = 'center';
  for (const g of G.gates) {
    const col = BOSSES[g.boss].color;
    mctx.strokeStyle = col; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(g.x * k, g.y * k, 4.5, 0, TAU); mctx.stroke();
    mctx.fillStyle = col; mctx.fillText('G', g.x * k, g.y * k - 7);
  }
  if (G.dungeon && G.dungeon.portal && G.dungeon.portal.t > 0) {
    const p = G.dungeon.portal; mctx.strokeStyle = p.kind === 'next' ? '#5fd4ff' : '#5be09a'; mctx.lineWidth = 1.5;
    mctx.beginPath(); mctx.arc(p.x * k, p.y * k, 4.5, 0, TAU); mctx.stroke();
  }
  for (const e of enemies) {
    if (e.hunter) { mctx.strokeStyle = '#ff8a5c'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(e.x * k, e.y * k, 5, 0, TAU); mctx.stroke(); }
    mctx.fillStyle = e.hunter ? '#ff8a5c' : e.isBoss ? e.B.color : e.elite ? '#ffd36b' : '#ff4d6d';
    const s = e.isBoss ? 6 : e.elite ? 4 : 3;
    mctx.fillRect(e.x * k - s / 2, e.y * k - s / 2, s, s);
  }
  if (G.event) {
    const ev = G.event, o = ev.ship && ev.state === 'active' ? ev.ship : ev;
    mctx.fillStyle = ev.E.color; mctx.font = '700 11px "JetBrains Mono", monospace'; mctx.textAlign = 'center';
    mctx.fillText('!', o.x * k, o.y * k + 4);
    mctx.strokeStyle = ev.E.color; mctx.lineWidth = 1; mctx.beginPath(); mctx.arc(o.x * k, o.y * k, 6, 0, TAU); mctx.stroke();
  }
  const vw = view.w / view.zoom * k, vh = view.h / view.zoom * k;
  mctx.strokeStyle = 'rgba(95,212,255,.35)'; mctx.lineWidth = 1;
  mctx.strokeRect(cam.x * k - vw / 2, cam.y * k - vh / 2, vw, vh);
  mctx.fillStyle = CLASSES[P.cls].color;
  mctx.beginPath(); mctx.arc(P.x * k, P.y * k, 3, 0, TAU); mctx.fill();
}
