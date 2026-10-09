'use strict';
/* =====================================================================
   PSEUDO-3D SPRITES
   Sprite sheets pre-rendered from CC0 low-poly models (Kenney, Quaternius,
   Majadroid) by tools/render3d. Each sheet holds f yaw frames (frame i =
   angle -i/f·2π, frame 0 faces right); ships add 3 bank rows (left, level,
   right). Asteroid sheets are tumble frames. Missing or unloaded sheets fall
   back to the vector drawing, so the game never depends on them.
   ===================================================================== */
const SPR_BASE = 'assets/sprites/';
const SPR3D = {
  ship_interceptor: { f: 48, px: 128, cols: 16, banks: 3 },
  ship_juggernaut:  { f: 48, px: 128, cols: 16, banks: 3 },
  ship_scavenger:   { f: 48, px: 128, cols: 16, banks: 3 },
  ship_carrier:     { f: 48, px: 128, cols: 16, banks: 3 },
  en_drone:   { f: 48, px: 96, cols: 16 },
  en_fighter: { f: 48, px: 96, cols: 16 },
  en_gunship: { f: 48, px: 96, cols: 16 },
  en_sniper:  { f: 48, px: 96, cols: 16 },
  ast_rock:    { f: 32, px: 128, cols: 8 },
  ast_iron:    { f: 32, px: 128, cols: 8 },
  ast_crystal: { f: 32, px: 128, cols: 8 },
  ast_radiant: { f: 32, px: 128, cols: 8 }
};
GFX.models = true;
try { GFX.models = localStorage.getItem('void-harvest-models') !== 'off'; } catch (e) { /* storage blocked */ }
function setModels(on) {
  GFX.models = on;
  try { localStorage.setItem('void-harvest-models', on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
}
// sheets load lazily on first use, so a ship you never fly costs nothing
function spr3d(k) {
  if (!GFX.models) return null;
  const S = SPR3D[k]; if (!S) return null;
  if (!S.img) { S.img = new Image(); S.img.onload = () => { S.ok = true; if (k.startsWith('ship_') && !G && typeof buildSelect === 'function') buildSelect(); }; S.img.onerror = () => { S.bad = true; }; S.img.src = SPR_BASE + k + '.webp'; }
  return S.ok ? S : null;
}
const sprIdx = (S, a) => ((Math.round(-a / TAU * S.f) % S.f) + S.f) % S.f;
// draw frame for angle a centred on x,y; size = drawn frame edge in world px; row = bank row
function drawSpr(c, S, x, y, a, size, row) {
  const i = sprIdx(S, a) + (S.banks ? clamp(row | 0, 0, S.banks - 1) * S.f : 0);
  c.drawImage(S.img, (i % S.cols) * S.px, Math.floor(i / S.cols) * S.px, S.px, S.px, x - size / 2, y - size / 2, size, size);
}
// soft round glow (no hard edge) in a colour, cached per colour and drawn scaled
const GLOWS = {};
function softGlow(c, col, x, y, r, alpha) {
  let g = GLOWS[col];
  if (!g) {
    g = GLOWS[col] = document.createElement('canvas'); g.width = g.height = 64;
    const k = g.getContext('2d'), gr = k.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(0.45, col + '80'); gr.addColorStop(1, col + '00');
    k.fillStyle = gr; k.fillRect(0, 0, 64, 64);
  }
  const ga = c.globalAlpha; c.globalAlpha = ga * alpha;
  c.drawImage(g, x - r, y - r, r * 2, r * 2);
  c.globalAlpha = ga;
}
// hit flash: the same frame added on top
function flashSpr(c, S, x, y, a, size, row, k) {
  const ga = c.globalAlpha, op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga * k;
  drawSpr(c, S, x, y, a, size, row);
  c.globalCompositeOperation = op; c.globalAlpha = ga;
}
// bank row from turn rate + sideways drift, smoothed per entity
function bankRow(o, dt) {
  const da = Math.atan2(Math.sin(o.a - (o.lastA ?? o.a)), Math.cos(o.a - (o.lastA ?? o.a)));
  o.lastA = o.a;
  const sp = Math.hypot(o.vx || 0, o.vy || 0), lat = sp > 40 ? (-Math.sin(o.a) * o.vx + Math.cos(o.a) * o.vy) / sp : 0;
  o.bank = lerp(o.bank || 0, clamp(da / Math.max(dt, 0.008) * 0.25 + lat * 0.9, -1, 1), Math.min(1, dt * 8));
  return o.bank < -0.35 ? 0 : o.bank > 0.35 ? 2 : 1;
}
