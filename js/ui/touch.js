'use strict';
/* =====================================================================
   TOUCH CONTROLS (phones / tablets)
   Left half: floating move stick. Right half: floating aim stick (hold = fire).
   Action pad bottom-right, context button (dock, gate, chest…) bottom centre.
   Everything is gated by TOUCH.on, so the desktop game is unchanged.
   ===================================================================== */
const STICK_R = 56, STICK_DEAD = 0.15, AIM_ON = 0.3;
try { TOUCH.pref = localStorage.getItem('void-harvest-touch') || 'auto'; } catch (e) { /* storage blocked */ }
const touchAuto = () => navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches;

function applyTouch() {
  TOUCH.on = TOUCH.pref === 'on' || (TOUCH.pref === 'auto' && touchAuto());
  document.body.classList.toggle('touch', TOUCH.on);
  $('touchUi').hidden = !TOUCH.on;
  resetSticks();
  resize();
  if (G) updateHUD();
}
function setTouchPref(p) {
  TOUCH.pref = p;
  try { localStorage.setItem('void-harvest-touch', p); } catch (e) { /* storage blocked */ }
  applyTouch();
  log(_T`Dotykové ovládanie: ${touchPrefName()}.`);
}
const touchPrefName = () => TOUCH.pref === 'on' ? _L('zapnuté') : TOUCH.pref === 'off' ? _L('vypnuté') : TOUCH.on ? _L('automaticky (zapnuté)') : _L('automaticky (vypnuté)');

// full screen + landscape lock; must run inside a tap (ship pick / continue)
function touchFullscreen() {
  if (!TOUCH.on || document.fullscreenElement) return;
  const el = document.documentElement;
  if (!el.requestFullscreen) return;
  el.requestFullscreen({ navigationUI: 'hide' }).then(() => {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  }).catch(() => {});
}

/* ---------- sticks ---------- */
function resetSticks() {
  TOUCH.sticks = {};
  input.mv.x = input.mv.y = 0; input.aim.x = input.aim.y = 0; input.aim.on = false;
  if (TOUCH.on) input.fire = false;
  drawSticks();
}
function stickOf(id) { for (const k in TOUCH.sticks) if (TOUCH.sticks[k].id === id) return k; return null; }
function updStick(side) {
  const S = TOUCH.sticks[side];
  let dx = S.x - S.x0, dy = S.y - S.y0, d = Math.hypot(dx, dy);
  // floating base: drags along when the thumb goes past the rim
  if (d > STICK_R) { S.x0 += dx * (1 - STICK_R / d); S.y0 += dy * (1 - STICK_R / d); dx = S.x - S.x0; dy = S.y - S.y0; d = STICK_R; }
  const m = d / STICK_R, nx = m > STICK_DEAD ? dx / STICK_R : 0, ny = m > STICK_DEAD ? dy / STICK_R : 0;
  if (side === 'L') { input.mv.x = nx; input.mv.y = ny; }
  else { input.aim.x = nx; input.aim.y = ny; input.aim.on = m > AIM_ON; }
}
function endStick(side) {
  delete TOUCH.sticks[side];
  if (side === 'L') input.mv.x = input.mv.y = 0;
  else { input.aim.x = input.aim.y = 0; input.aim.on = false; input.fire = false; }
}
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || !TOUCH.on) return;
  e.preventDefault(); TOUCH.last = performance.now();
  if (!G || G.paused || G.mode !== 'play') return;
  const side = e.clientX < view.w * 0.5 ? 'L' : 'R';
  if (TOUCH.sticks[side]) return;
  TOUCH.sticks[side] = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
  try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* already released */ }
  updStick(side); drawSticks();
});
canvas.addEventListener('pointermove', e => {
  if (!TOUCH.on) return;
  const side = stickOf(e.pointerId); if (!side) return;
  e.preventDefault(); TOUCH.last = performance.now();
  const S = TOUCH.sticks[side]; S.x = e.clientX; S.y = e.clientY;
  updStick(side); drawSticks();
});
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(ev, e => {
  const side = stickOf(e.pointerId); if (!side) return;
  TOUCH.last = performance.now(); endStick(side); drawSticks();
});
// long-press on the canvas must not open the context menu / text selection
canvas.addEventListener('touchstart', e => { if (TOUCH.on) e.preventDefault(); }, { passive: false });

// stick visuals (DOM, so they stay crisp and cost nothing on the canvas)
function drawSticks() {
  for (const side of ['L', 'R']) {
    const el = $('stick' + side), S = TOUCH.sticks[side];
    el.classList.toggle('on', !!S);
    if (!S) { el.style.cssText = ''; continue; }
    el.style.left = S.x0 + 'px'; el.style.top = S.y0 + 'px';
    const kx = clamp(S.x - S.x0, -STICK_R, STICK_R), ky = clamp(S.y - S.y0, -STICK_R, STICK_R);
    el.style.setProperty('--kx', kx + 'px'); el.style.setProperty('--ky', ky + 'px');
  }
}

// called from updatePlayer: the aim stick fires, otherwise the ship faces where it flies;
// the "mouse" is parked ahead of the ship so every mouse-aimed system keeps working
function touchAim() {
  const A = input.aim, M = input.mv;
  if (A.on) TOUCH.dir = Math.atan2(A.y, A.x);
  else if (M.x || M.y) TOUCH.dir = Math.atan2(M.y, M.x);
  input.fire = A.on;
  const a = TOUCH.dir == null ? P.a : TOUCH.dir;
  input.mx = view.w / 2 + (P.x + Math.cos(a) * 240 - cam.x) * view.zoom;
  input.my = view.h / 2 + (P.y + Math.sin(a) * 240 - cam.y) * view.zoom;
}

/* ---------- action pad ---------- */
function tbPress(k, down) {
  if (!G || G.mode !== 'play' || (G.panel && down)) return;
  if (k === 'mis') input.missile = down;
  else if (!down) return;
  else if (k === 'dodge') { if (!G.paused) input.dodge = true; }
  else if (k === 'sk0') input.skill[0] = true;
  else if (k === 'sk1') input.skill[1] = true;
  else if (k === 'scan') input.scan = true;
  if (down && navigator.vibrate) navigator.vibrate(8);
}
$('touchUi').addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-tb]'); if (!b) return;
  e.preventDefault(); TOUCH.last = performance.now();
  try { b.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
  b.classList.add('down'); tbPress(b.dataset.tb, true);
});
for (const ev of ['pointerup', 'pointercancel']) $('touchUi').addEventListener(ev, e => {
  const b = e.target.closest('[data-tb]'); if (!b) return;
  b.classList.remove('down'); tbPress(b.dataset.tb, false);
});
$('touchUi').addEventListener('contextmenu', e => e.preventDefault());
$('tbAct').addEventListener('click', () => {
  if (G && !G.panel && G.interact && G.mode === 'play' && !transitioning) { G.interact.act(); if (navigator.vibrate) navigator.vibrate(12); }
});
// the left HUD panel folds out on tap
$('hudTl').addEventListener('click', () => { if (TOUCH.on) $('hudTl').classList.toggle('open'); });

// cooldown rings + context button, refreshed with the HUD (10× per second)
function touchHud() {
  const it = G.interact;
  $('touchUi').classList.toggle('off', !!G.panel);
  $('tbAct').hidden = !it || !!G.panel || transitioning;
  if (it) { $('tbActTxt').innerHTML = it.txt; $('tbAct').style.setProperty('--pc', it.col); }
  const s = P.stats, set = (id, p, ready, name) => {
    const el = $(id); el.style.setProperty('--p', clamp(p, 0, 1).toFixed(3)); el.classList.toggle('ready', ready);
    if (name != null) { const w = Math.max(...name.split(/\s+/).map(x => x.length)); el.querySelector('.tbn').textContent = name; el.classList.toggle('long', w > 7 && w <= 10); el.classList.toggle('xlong', w > 10); }
  };
  set('tbMis', P.missileT > 0 ? P.missileT / s.missileCd : 0, P.missileT <= 0, _L('Rakety'));
  const D = dodgeDef(), ph = D === PHASE_DODGE, cd = ph ? Math.max(0, P.dashCd) : P.dodgeCh > 0 ? 0 : P.dodgeCd;
  set('tbDodge', cd > 0 ? cd / (ph ? D.cd : dodgeCd()) : 0, cd <= 0, D.name);
  for (let i = 0; i < 2; i++) {
    const id = skState().sel[i], S = SKILLS[id], el = $('tbSk' + i);
    el.hidden = !S; if (!S) continue;
    const open = P.level >= S.lvl, c = Math.max(0, P.skCd[id] || 0);
    set('tbSk' + i, open ? c / skillCd(id) : 1, open && c <= 0, open ? S.name : _T`úr. ${S.lvl}`);
    el.classList.toggle('locked', !open);
  }
  $('tbScan').hidden = !!G.dungeon;
  const scd = G.ex && !G.dungeon ? Math.max(0, G.ex.scanCd) : 0;
  set('tbScan', scd / SCAN_CD, scd <= 0, _L('Skener'));
}

/* ---------- item detail sheet: tap replaces hover tooltip + right click ---------- */
function itemSheet(it, mode, acts) {
  TOUCH.acts = acts;
  tip.innerHTML = tooltipFor(it, mode) + `<div class="sheet-acts">${acts.map((a, i) => `<button type="button" class="btn ${a.cls || ''}" data-sa="${i}" ${a.dis ? 'disabled' : ''}>${a.txt}</button>`).join('')}<button type="button" class="btn" data-sa="x">${_L('Zavrieť')}</button></div>`;
  tip.style.setProperty('--rc', RARITY[it.rarity].color);
  tip.classList.add('sheet'); tip.hidden = false; tip.scrollTop = 0;
}
function invSheet(idx) {
  const it = P.inv[idx]; if (!it) return;
  itemSheet(it, 'inv', [
    { txt: _L('Nasadiť'), cls: 'primary', fn: () => equipFromInv(idx) },
    { txt: _T`Rozobrať · +${salvageValue(it)} rudy`, cls: 'bad', fn: () => salvage(idx) }]);
}
function slotSheet(slot) {
  const it = P.equip[slot]; if (!it) return;
  const max = it.upg >= MAX_UPG, c = max ? 0 : upgradeCost(it);
  itemSheet(it, 'eq', [{ txt: max ? _L('Vylepšené na maximum') : _T`Vylepšiť · ${c} rudy`, cls: 'primary', dis: max || P.ore < c, keep: true, fn: () => { upgradeSlot(slot); slotSheet(slot); } }]);
}
function moveSheet(mv) {
  const [k, i] = mv.split(':'), it = k === 'i' ? P.inv[+i] : P.stash[+i]; if (!it) return;
  const full = k === 'i' ? P.stash.length >= STASH_MAX : P.inv.length >= 30;
  itemSheet(it, 'craft', [{ txt: k === 'i' ? _L('Presunúť do skladu') : _L('Presunúť do nákladu'), cls: 'primary', dis: full, fn: () => {
    if (k === 'i') P.stash.push(P.inv.splice(+i, 1)[0]); else P.inv.push(P.stash.splice(+i, 1)[0]);
    renderCraft();
  } }]);
}
tip.addEventListener('click', e => {
  const b = e.target.closest('[data-sa]'); if (!b || b.disabled) return;
  const A = b.dataset.sa === 'x' ? null : TOUCH.acts[+b.dataset.sa];
  if (!A || !A.keep) hideTip();
  if (A) { A.fn(); saveGame(); }
});
// tap outside the sheet closes it
document.addEventListener('pointerdown', e => { if (TOUCH.on && tip.classList.contains('sheet') && !tip.contains(e.target)) { hideTip(); TOUCH.swallow = performance.now(); } }, true);
document.addEventListener('click', e => { if (TOUCH.on && performance.now() - (TOUCH.swallow || 0) < 600) { TOUCH.swallow = 0; e.stopPropagation(); e.preventDefault(); } }, true);
// capture phase: runs before the desktop click handlers and stops them
const tapItem = (id, sel, fn) => $(id).addEventListener('click', e => {
  if (!TOUCH.on) return;
  const el = e.target.closest(sel); if (!el) return;
  e.stopPropagation(); fn(el);
}, true);
// ⓘ hints are hover titles on desktop; on touch a tap shows them in the sheet
document.addEventListener('click', e => {
  if (!TOUCH.on) return;
  const el = e.target.closest('.info[title]'); if (!el) return;
  e.stopPropagation(); e.preventDefault();
  TOUCH.acts = [];
  tip.innerHTML = `<p style="margin:0;line-height:1.5">${el.title}</p><div class="sheet-acts"><button type="button" class="btn" data-sa="x">${_L('Zavrieť')}</button></div>`;
  tip.style.setProperty('--rc', 'var(--accent)'); tip.classList.add('sheet'); tip.hidden = false;
}, true);
tapItem('grid', '[data-idx]', el => invSheet(+el.dataset.idx));
tapItem('eslots', '[data-slot]', el => slotSheet(el.dataset.slot));
tapItem('craftBody', '[data-mv]', el => moveSheet(el.dataset.mv));

$('abTouch').addEventListener('click', () => { setMore(false); setTouchPref(TOUCH.pref === 'auto' ? (TOUCH.on ? 'off' : 'on') : TOUCH.pref === 'on' ? 'off' : 'auto'); });
matchMedia('(pointer: coarse)').addEventListener('change', () => { if (TOUCH.pref === 'auto') applyTouch(); });
applyTouch();
// first run on a phone: medium graphics (the full-screen glow is the most expensive pass); a player's own choice is kept
try { if (TOUCH.on && !localStorage.getItem('void-harvest-gfx')) setGfx('mid'); } catch (e) { /* storage blocked */ }
