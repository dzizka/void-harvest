'use strict';
/* =====================================================================
   GAMEPAD (standard mapping: Xbox / PlayStation / most USB pads)
   Left stick flies, right stick aims and fires, RT fires, LT missiles,
   A dodge, X / Y skills, B / RB interact (B closes a panel), LB scanner,
   Start inventory, Back map, D-pad up / down auto-combat / auto-mining.
   The pad is "active" from its first input until the mouse moves, so
   mouse + keyboard play is untouched. Menus stay mouse / touch driven.
   ===================================================================== */
const PAD_DEAD = 0.2, PAD_AIM_ON = 0.35;
function padStick(gp, i, out) {
  const x = gp.axes[i] || 0, y = gp.axes[i + 1] || 0, l = Math.hypot(x, y);
  if (l < PAD_DEAD) { out.x = 0; out.y = 0; return 0; }
  const k = Math.min(1, (l - PAD_DEAD) / (1 - PAD_DEAD)) / l;
  out.x = x * k; out.y = y * k; return l;
}
const padBtn = (gp, i) => { const b = gp.buttons[i]; return !!b && (b.pressed || b.value > 0.4); };
function padRelease() {
  PAD.active = false; PAD.aim.on = false; PAD.trig = false; PAD.mv.x = PAD.mv.y = 0;
  input.fire = false; input.missile = false;
}

// called every frame from the main loop
function padPoll() {
  if (!PAD.n || !navigator.getGamepads) return;
  let gp = null;
  for (const g of navigator.getGamepads()) if (g && g.connected) { gp = g; break; }
  if (!gp) return;
  const ml = padStick(gp, 0, PAD.mv), al = padStick(gp, 2, PAD.aim);
  PAD.aim.on = al > PAD_AIM_ON;
  const prev = PAD.prev, now = [];
  let any = ml > 0 || PAD.aim.on;
  for (let i = 0; i < 16; i++) { now[i] = padBtn(gp, i); if (now[i]) any = true; }
  const hit = i => now[i] && !prev[i];
  PAD.prev = now;
  if (any && !PAD.active) PAD.active = true;
  if (!PAD.active || !G) return;
  PAD.trig = now[7];
  if (now[6] !== !!prev[6]) input.missile = now[6] && !G.panel;
  if (PAD.hint && G.mode === 'play') { PAD.hint = false; log(_L('Gamepad pripojený: ľavá páčka let, pravá mierenie a streľba (alebo RT), LT rakety, A úhyb, X / Y schopnosti, B interakcia, LB skener, Start inventár, Back mapa, D-pad auto-boj / auto-ťažba.')); }
  // the horde boon pick can't be closed: D-pad left / up / right picks
  if (G.panel === 'horde') { for (const [b, i] of [[14, 0], [12, 1], [15, 2]]) if (hit(b)) hordePick(i); return; }
  // panels: B closes, Start toggles the inventory, Back the map
  if (hit(9)) { if (G.panel) closePanels(); else openPanel('inv'); return; }
  if (hit(8)) { if (G.panel === 'map') closePanels(); else { G.mapSel = G.sector; openPanel('map'); } return; }
  if (G.panel) { if (hit(1)) closePanels(); return; }
  if (G.mode !== 'play') return;
  if ((hit(1) || hit(5)) && G.interact && !transitioning) { G.interact.act(); return; }
  if (hit(0) && !G.paused) input.dodge = true;
  if (hit(2)) input.skill[0] = true;
  if (hit(3)) input.skill[1] = true;
  if (hit(4)) input.scan = true;
  if (hit(12)) { G.autoFire = !G.autoFire; log(_T`Auto-boj ${G.autoFire ? _L('zapnutý') : _L('vypnutý')}.`); updateHUD(); }
  if (hit(13)) { G.autoMine = !G.autoMine; log(_T`Auto-ťažba ${G.autoMine ? _L('zapnutá') : _L('vypnutá')}.`); updateHUD(); }
}

// called from updatePlayer: like the touch aim stick, the "mouse" is parked ahead of the ship
function padAim() {
  const A = PAD.aim, M = PAD.mv;
  if (A.on) PAD.dir = Math.atan2(A.y, A.x);
  else if (M.x || M.y) PAD.dir = Math.atan2(M.y, M.x);
  input.fire = A.on || PAD.trig;
  const a = PAD.dir == null ? P.a : PAD.dir;
  input.mx = view.w / 2 + (P.x + Math.cos(a) * 240 - cam.x) * view.zoom;
  input.my = view.h / 2 + (P.y + Math.sin(a) * 240 - cam.y) * view.zoom;
}

// the controls hint is logged on the first pad input in flight
addEventListener('gamepadconnected', () => { PAD.n++; PAD.hint = true; });
addEventListener('gamepaddisconnected', () => { PAD.n = Math.max(0, PAD.n - 1); if (!PAD.n && PAD.active) padRelease(); });
// moving the real mouse hands control back to mouse + keyboard
addEventListener('mousemove', e => { if (PAD.active && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) padRelease(); });
