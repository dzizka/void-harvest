'use strict';
/* =====================================================================
   8. RENDERING (canvas)
   ===================================================================== */
const BG = {};
function makeLayer(size, n, rMin, rMax, colors, alphaMin) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  for (let i = 0; i < n; i++) {
    g.globalAlpha = rand(alphaMin, 1); g.fillStyle = pick(colors);
    g.beginPath(); g.arc(rand(0, size), rand(0, size), rand(rMin, rMax), 0, TAU); g.fill();
  }
  return c;
}
function makeNebula(size, cols) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  for (let i = 0; i < 9; i++) {
    const x = rand(0, size), y = rand(0, size), r = rand(size * 0.15, size * 0.42), col = pick(cols), a = rand(0.11, 0.24);
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      gr.addColorStop(0, col + a + ')'); gr.addColorStop(1, col + '0)');
      g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  return c;
}
function initBackground() {
  BG.layers = [
    { c: makeNebula(1400, SECTORS.kepler.pal), p: 0.06 },
    { c: makeLayer(700, 260, 0.4, 0.9, ['#8fa3c9', '#c9d6f0', '#6d7ea8'], 0.25), p: 0.15 },
    { c: makeLayer(800, 110, 0.7, 1.4, ['#dfe8ff', '#a9c7ff', '#ffe2c2'], 0.4), p: 0.35 },
    { c: makeLayer(1000, 45, 1.1, 2.0, ['#ffffff', '#cfe4ff'], 0.6), p: 0.6 }
  ];
  for (const L of BG.layers) L.pat = ctx.createPattern(L.c, 'repeat');
}
/* ---------- graphics quality & glow ---------- */
const GFX = { q: 'high' };
try { GFX.q = localStorage.getItem('void-harvest-gfx') || 'high'; } catch (e) { /* ignore */ }
const GLOW = { c: document.createElement('canvas') };
GLOW.g = GLOW.c.getContext('2d');
GLOW.g.filter = 'blur(2px)'; GLOW.ok = GLOW.g.filter === 'blur(2px)'; GLOW.g.filter = 'none';
function setGfx(q) {
  GFX.q = q;
  try { localStorage.setItem('void-harvest-gfx', q); } catch (e) { /* ignore */ }
  if (G && BG.theme) BG.backdrop = q !== 'low' ? makeBackdrop(BG.theme) : null;
}
function drawGlow() {
  if (GFX.q !== 'high' || !GLOW.ok) return;
  const gw = Math.ceil(canvas.width / 4), gh = Math.ceil(canvas.height / 4);
  if (GLOW.c.width !== gw || GLOW.c.height !== gh) { GLOW.c.width = gw; GLOW.c.height = gh; }
  const g = GLOW.g;
  g.globalCompositeOperation = 'copy'; g.filter = 'contrast(2.6) brightness(0.8) blur(3px)';
  g.drawImage(canvas, 0, 0, gw, gh); g.filter = 'none';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55;
  ctx.drawImage(GLOW.c, 0, 0, canvas.width, canvas.height); ctx.restore();
}
// deterministic random for sector scenery
function seeded(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const BACKDROP = {
  haven:  { planet: ['#2a6fb0', '#0b2340', '#7fd0ff'], ring: true,  props: 'fleet' , pimg: 3 },
  kepler: { planet: ['#5a6a90', '#151b2c', '#9fb4ff'], ring: false, props: 'rocks' , pimg: 4 },
  ruby:   { planet: ['#c0392b', '#2a0a10', '#ff8a6a'], ring: false, props: 'gas' , pimg: 8 },
  tessar: { planet: ['#8fe3ff', '#0d2a3a', '#e0fbff'], ring: true,  props: 'ice' , pimg: 7 },
  vex:    { planet: ['#b0782a', '#20140a', '#ffc46b'], ring: true,  props: 'wrecks' , pimg: 5 },
  rim:    { planet: ['#2a0d3a', '#05020a', '#c77dff'], ring: false, props: 'rifts' , pimg: 6 },
  baria:  { planet: ['#3fbf8f', '#08261c', '#9fffd8'], ring: false, props: 'gas', tint: [90, 255, 180] , pimg: 0 },
  hercules: { planet: ['#ffffff', '#3a5aa0', '#9fc4ff'], ring: true, props: 'rifts', tint: [110, 170, 255] , pimg: 2 },
  dungeon:{ planet: null, props: 'rifts' }
};
function makeBackdrop(theme) {
  const D = BACKDROP[theme]; if (!D) return null;
  const SZ = 2400, c = document.createElement('canvas'); c.width = c.height = SZ;
  const g = c.getContext('2d'), rnd = seeded(theme), rr = (a, b) => a + rnd() * (b - a);
  // scenery props
  const n = { fleet: 7, rocks: 34, gas: 14, ice: 26, wrecks: 9, rifts: 6 }[D.props];
  for (let i = 0; i < n; i++) {
    const x = rr(0, SZ), y = rr(0, SZ), sc = rr(0.6, 1.4), a = rr(0, TAU);
    g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, sc);
    if (D.props === 'rocks') {
      g.fillStyle = 'rgba(30,36,52,.9)'; g.strokeStyle = 'rgba(110,125,160,.35)'; g.lineWidth = 1.2;
      g.beginPath(); const k = 8, r0 = rr(8, 26); for (let j = 0; j < k; j++) { const t = j / k * TAU, r = r0 * rr(0.7, 1.1); g.lineTo(Math.cos(t) * r, Math.sin(t) * r); } g.closePath(); g.fill(); g.stroke();
    } else if (D.props === 'gas') {
      const r = rr(120, 320), gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
      const tc = D.tint || [255, 80, 90];
      gr.addColorStop(0, `rgba(${tc},.16)`); gr.addColorStop(0.5, `rgba(${tc},.07)`); gr.addColorStop(1, `rgba(${tc},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    } else if (D.props === 'ice') {
      g.fillStyle = 'rgba(150,230,255,.10)'; g.strokeStyle = 'rgba(200,245,255,.35)'; g.lineWidth = 1;
      const h = rr(20, 60); g.beginPath(); g.moveTo(0, -h); g.lineTo(h * 0.35, 0); g.lineTo(0, h * 0.6); g.lineTo(-h * 0.35, 0); g.closePath(); g.fill(); g.stroke();
    } else if (D.props === 'wrecks') {
      const L = rr(90, 220);
      g.fillStyle = 'rgba(24,18,14,.95)'; g.strokeStyle = 'rgba(255,170,90,.22)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(L / 2, 0); g.lineTo(L * 0.3, -L * 0.12); g.lineTo(-L * 0.1, -L * 0.14); g.lineTo(-L * 0.18, -L * 0.04); g.lineTo(-L * 0.3, -L * 0.1); g.lineTo(-L / 2, -L * 0.05); g.lineTo(-L * 0.42, L * 0.08); g.lineTo(-L * 0.05, L * 0.12); g.lineTo(L * 0.28, L * 0.1); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,170,90,.12)'; g.beginPath(); g.moveTo(-L * 0.3, 0); g.lineTo(L * 0.35, 0); g.stroke();
      for (let j = 0; j < 4; j++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,190,110,.7)' : 'rgba(255,90,70,.6)'; g.fillRect(rr(-L * 0.35, L * 0.3), rr(-L * 0.08, L * 0.08), 2, 2); }
    } else if (D.props === 'rifts') {
      const L = rr(140, 360);
      g.lineCap = 'round';
      const tc = D.tint || [199, 125, 255];
      for (const [w, col] of [[10, `rgba(${tc},.07)`], [4, `rgba(${tc},.22)`], [1.4, 'rgba(240,235,255,.55)']]) {
        g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(-L / 2, 0);
        const r2 = seeded(theme + i); for (let j = 1; j < 9; j++) g.lineTo(-L / 2 + L * j / 8, (r2() - 0.5) * 34);
        g.stroke();
      }
    } else if (D.props === 'fleet') {
      const L = rr(60, 130);
      g.fillStyle = 'rgba(14,22,40,.95)'; g.strokeStyle = 'rgba(120,180,255,.3)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(L / 2, 0); g.lineTo(L * 0.2, -L * 0.1); g.lineTo(-L / 2, -L * 0.13); g.lineTo(-L / 2, L * 0.13); g.lineTo(L * 0.2, L * 0.1); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(140,210,255,.9)'; for (let j = 0; j < 5; j++) g.fillRect(rr(-L * 0.45, L * 0.2), rr(-L * 0.06, L * 0.06), 1.6, 1.6);
      g.fillStyle = 'rgba(95,212,255,.5)'; g.fillRect(-L / 2 - 6, -3, 6, 6);
    }
    g.restore();
  }
  // a planet
  if (D.planet) {
    const [c1, c2, c3] = D.planet, R = rr(170, 300), x = rr(SZ * 0.2, SZ * 0.8), y = rr(SZ * 0.2, SZ * 0.8);
    const atm = g.createRadialGradient(x, y, R * 0.9, x, y, R * 1.35);
    atm.addColorStop(0, c3 + '55'); atm.addColorStop(1, c3 + '00');
    g.fillStyle = atm; g.beginPath(); g.arc(x, y, R * 1.35, 0, TAU); g.fill();
    const PIm = D.pimg != null && typeof planetImg === 'function' ? planetImg(D.pimg) : null;
    if (PIm) {
      // Kenney planet texture + light from the top-left and a dark terminator for depth
      g.drawImage(PIm, x - R, y - R, R * 2, R * 2);
      g.save(); g.beginPath(); g.arc(x, y, R * 0.995, 0, TAU); g.clip();
      const sh = g.createRadialGradient(x - R * 0.45, y - R * 0.5, R * 0.2, x - R * 0.1, y - R * 0.1, R * 1.45);
      sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(0.45, 'rgba(0,0,0,0)'); sh.addColorStop(0.8, 'rgba(2,3,9,.55)'); sh.addColorStop(1, 'rgba(2,3,9,.92)');
      g.fillStyle = sh; g.fillRect(x - R, y - R, R * 2, R * 2); g.restore();
    } else {
    const body = g.createRadialGradient(x - R * 0.4, y - R * 0.45, R * 0.1, x, y, R);
    body.addColorStop(0, c1); body.addColorStop(0.7, c2); body.addColorStop(1, '#020309');
    g.fillStyle = body; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(x, y, R, 0, TAU); g.clip(); g.globalAlpha = 0.18; g.strokeStyle = c3; g.lineWidth = R * 0.05;
    for (let j = 0; j < 6; j++) { g.beginPath(); g.ellipse(x, y + rr(-R, R), R * 1.2, R * 0.08, 0.2, 0, TAU); g.stroke(); } g.restore();
    }
    if (D.ring) {
      g.save(); g.translate(x, y); g.rotate(-0.35); g.strokeStyle = c3 + '66'; g.lineWidth = R * 0.06;
      g.beginPath(); g.ellipse(0, 0, R * 1.75, R * 0.42, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
      g.strokeStyle = c3 + '33'; g.lineWidth = R * 0.03; g.beginPath(); g.ellipse(0, 0, R * 1.95, R * 0.48, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
      g.restore();
    }
  }
  return c;
}
const DUST = [];
function drawBackdrop() {
  const W = view.w, H = view.h;
  if (BG.backdrop) {
    const B = BG.backdrop, p = 0.12, z = 1;
    const x = W / 2 - B.width / 2 - (cam.x - WORLD.w / 2) * p, y = H / 2 - B.height / 2 - (cam.y - WORLD.h / 2) * p;
    ctx.drawImage(B, x * z, y * z);
  }
}
// near-camera dust that streaks with the ship's speed
function drawDust(z) {
  if (GFX.q === 'low' || !G || !P) return;
  const hw = view.w / 2 / z + 60, hh = view.h / 2 / z + 60;
  while (DUST.length < 70) DUST.push({ x: cam.x + rand(-hw, hw), y: cam.y + rand(-hh, hh), a: rand(0.15, 0.45) });
  const vx = P.vx * 0.045, vy = P.vy * 0.045, sp = Math.hypot(vx, vy);
  ctx.strokeStyle = '#cfe0ff'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (const d of DUST) {
    if (d.x < cam.x - hw) d.x += hw * 2; if (d.x > cam.x + hw) d.x -= hw * 2;
    if (d.y < cam.y - hh) d.y += hh * 2; if (d.y > cam.y + hh) d.y -= hh * 2;
    ctx.globalAlpha = d.a * (sp > 2 ? 1 : 0.6);
    ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - vx - 0.5, d.y - vy); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawBackground() {
  const W = view.w, H = view.h;
  for (const L of BG.layers) {
    const S = L.c.width;
    const ox = ((cam.x * L.p) % S + S) % S, oy = ((cam.y * L.p) % S + S) % S;
    ctx.save(); ctx.translate(-ox, -oy); ctx.fillStyle = L.pat; ctx.fillRect(0, 0, W + S, H + S); ctx.restore();
  }
}
