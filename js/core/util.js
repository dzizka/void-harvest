'use strict';
/* =====================================================================
   0. UTILITIES
   ===================================================================== */
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
function weighted(table) {
  let total = 0; for (const k in table) total += table[k];
  let r = Math.random() * total;
  for (const k in table) { r -= table[k]; if (r <= 0) return k; }
  return Object.keys(table)[0];
}
function segD2(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy;
  let t = l ? ((px - ax) * vx + (py - ay) * vy) / l : 0;
  t = clamp(t, 0, 1);
  return d2(px, py, ax + vx * t, ay + vy * t);
}
const fmtN = v => v >= 10000 ? (v / 1000).toFixed(1) + 'k' : v >= 100 ? Math.round(v).toString() : (Math.round(v * 10) / 10).toString();
const fmtTime = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const $ = id => document.getElementById(id);
