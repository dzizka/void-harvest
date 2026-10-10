'use strict';
/* =====================================================================
   GAMEPAD (standard mapping: Xbox / PlayStation / most USB pads)
   Left stick flies, right stick aims and fires, RT fires, LT missiles,
   A dodge, X / Y skills, B / RB interact (B closes a panel), LB scanner,
   Start inventory, Back map, RS click Menu, D-pad up / down auto-combat /
   auto-mining. In the hangar, open windows, the death screen and the Menu
   the D-pad / left stick moves a focus ring between buttons and items,
   A clicks, X is the right-click action (salvage), B closes the window.
   The pad is "active" from its first input until the mouse moves, so
   mouse + keyboard play is untouched.
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
  padBlur();
}

/* ---------- menu navigation (spatial focus) ---------- */
const PAD_NAV = 'button:not([disabled]), [data-idx], [data-slot], [data-mv], .info, input, select';
// the screen the pad currently drives outside of flight (null = flying)
function padScope() {
  if (!$('tabLock').hidden) return $('tabLock');
  if (!G) return $('select');
  if (G.mode === 'dead' && !$('dead').hidden) return $('dead');
  if (G.panel) return $(G.panel);
  if (!$('morePop').hidden) return $('morePop');
  return null;
}
const padTargets = root => [...root.querySelectorAll(PAD_NAV)].filter(el => { const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight; });
function padBlur(forget) { if (PAD.focus) PAD.focus.classList.remove('padfocus'); PAD.focus = null; if (forget) PAD.fx = PAD.fy = null; }
function padFocus(el) {
  padBlur(); PAD.focus = el; el.classList.add('padfocus');
  try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const r = el.getBoundingClientRect(); PAD.fx = r.left + r.width / 2; PAD.fy = r.top + r.height / 2;
  if (el.matches('[data-tip], .info')) { const t = el.dataset.tip || el.dataset.t || el.title; if (t) showTip(`<p class="tip-txt">${t}</p>`, 'var(--accent)', r.right, r.top); }
  else if (el.matches('[data-idx], [data-slot], [data-mv]') && typeof tipFromEl === 'function') { try { tipFromEl(el, r.right, r.top); } catch (e) { hideTip(); } } else hideTip();
}
// keep a focus inside the current screen; after a click re-renders a window, pick the element nearest the old spot
function padEnsure(root) {
  if (PAD.focus && root.contains(PAD.focus) && PAD.focus.isConnected) return true;
  const list = padTargets(root); if (!list.length) { padBlur(); return false; }
  // first focus: continue / ship cards in the hangar, the main button elsewhere
  let best = PAD.fx == null ? list.find(el => el.matches('#saves button, #ships button, #dlgOk, [data-slot], [data-idx], .btn.primary')) || list[0] : list[0];
  if (PAD.fx != null) { let bd = Infinity; for (const el of list) { const r = el.getBoundingClientRect(), d = (r.left + r.width / 2 - PAD.fx) ** 2 + (r.top + r.height / 2 - PAD.fy) ** 2; if (d < bd) { bd = d; best = el; } } }
  padFocus(best); return false;
}
function padMove(root, dx, dy) {
  if (!padEnsure(root)) return;
  const a = PAD.focus.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = null, bs = Infinity;
  for (const el of padTargets(root)) {
    if (el === PAD.focus) continue;
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2 - ax, y = r.top + r.height / 2 - ay;
    const along = x * dx + y * dy; if (along <= 4) continue;
    const s = along + Math.abs(x * dy - y * dx) * 2.5;
    if (s < bs) { bs = s; best = el; }
  }
  if (best) padFocus(best);
}
// D-pad / left stick with key repeat (0.35 s, then every 0.12 s)
function padDir(now, gp) {
  let dx = (now[15] ? 1 : 0) - (now[14] ? 1 : 0), dy = (now[13] ? 1 : 0) - (now[12] ? 1 : 0);
  if (!dx && !dy && Math.hypot(PAD.mv.x, PAD.mv.y) > 0.5) { if (Math.abs(PAD.mv.x) > Math.abs(PAD.mv.y)) dx = Math.sign(PAD.mv.x); else dy = Math.sign(PAD.mv.y); }
  const key = dx + ',' + dy, t = performance.now();
  if (!dx && !dy) { PAD.navKey = null; return null; }
  if (key !== PAD.navKey) { PAD.navKey = key; PAD.navT = t + 350; return [dx, dy]; }
  if (t >= PAD.navT) { PAD.navT = t + 120; return [dx, dy]; }
  return null;
}
function padUi(root, now, hit) {
  const d = padDir(now);
  if (d) padMove(root, d[0], d[1]);
  else if (!PAD.focus || !PAD.focus.isConnected) padEnsure(root);
  if (hit(0) && padEnsure(root)) { const el = PAD.focus; el.click(); setTimeout(() => { const sc = padScope(); if (sc) padEnsure(sc); else padBlur(); }, 0); }
  if (hit(2) && padEnsure(root)) { const r = PAD.focus.getBoundingClientRect(); PAD.focus.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 4, clientY: r.top + 4, button: 2 })); setTimeout(() => { const sc = padScope(); if (sc) padEnsure(sc); }, 0); }
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
  for (let i = 0; i < 17; i++) { now[i] = padBtn(gp, i); if (now[i]) any = true; }
  const hit = i => now[i] && !prev[i];
  PAD.prev = now;
  if (any && !PAD.active) PAD.active = true;
  if (!PAD.active) return;
  const scope = padScope();
  if (scope !== PAD.scope) { padBlur(true); PAD.scope = scope; }
  if (!G) { if (scope) padUi(scope, now, hit); return; }
  PAD.trig = now[7] && !scope;
  if (now[6] !== !!prev[6]) input.missile = now[6] && !scope;
  if (PAD.hint && G.mode === 'play') { PAD.hint = false; log(_L('Gamepad pripojený: ľavá páčka let, pravá mierenie a streľba (alebo RT), LT rakety, A úhyb, X / Y schopnosti, B interakcia, LB skener, Start inventár, Back mapa, stlačená pravá páčka Menu, D-pad auto-boj / auto-ťažba. V oknách D-pad vyberá, A potvrdí, X rozoberie, B zavrie.')); }
  // windows: Start toggles the inventory, Back the map, RS click the Menu, B closes (the horde pick and the death screen can't be closed)
  if (hit(9) && G.panel !== 'horde') { if (G.panel) closePanels(); else { setMore(false); openPanel('inv'); } return; }
  if (hit(8) && G.panel !== 'horde') { if (G.panel === 'map') closePanels(); else { setMore(false); G.mapSel = G.sector; openPanel('map'); } return; }
  if (hit(11) && !G.panel) { setMore($('morePop').hidden); return; }
  if (scope) {
    if (hit(1)) { if (!$('morePop').hidden && !G.panel) setMore(false); else if (G.panel && G.panel !== 'horde') closePanels(); return; }
    padUi(scope, now, hit); return;
  }
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
