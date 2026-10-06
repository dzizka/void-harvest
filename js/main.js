'use strict';
/* ---------- main loop ---------- */
let last = performance.now(), last2 = last;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G) G.fps = lerp(G.fps, 1 / Math.max(0.001, (now - last2) / 1000), 0.05);
  last2 = now;
  const sp = G ? G.cheat.speed : 1;
  if (G && G.hitStop > 0 && !G.paused) G.hitStop -= dt;
  else if (G && G.mode === 'play' && !G.paused && !transitioning) {
    if (sp < 1) update(dt * sp);
    else for (let i = 0; i < sp && G.mode === 'play' && !transitioning; i++) update(dt);
  }
  if (G && !G.paused) updateFx(dt * Math.max(1, sp));
  if (G) {
    if (!G.paused) G.shake *= Math.pow(0.002, dt);
    const mw = mouseWorld();
    let tx = P.x + (mw.x - P.x) * 0.12, ty = P.y + (mw.y - P.y) * 0.12;
    if (G.intro && !G.intro.e.dead) { const k = clamp(Math.min(G.intro.t, G.intro.t0 - G.intro.t) / 0.4, 0, 1) * 0.75; tx = lerp(tx, G.intro.e.x, k); ty = lerp(ty, G.intro.e.y, k); }
    cam.x = lerp(cam.x, tx, Math.min(1, 8 * dt)); cam.y = lerp(cam.y, ty, Math.min(1, 8 * dt));
    G.hudT -= dt; if (G.hudT <= 0 && G.mode === 'play') { G.hudT = 0.1; updateHUD(); }
    G.mmT -= dt; if (G.mmT <= 0) { G.mmT = 0.08; drawMinimap(); }
    G.saveT -= dt; if (G.saveT <= 0 && G.mode === 'play') { G.saveT = 15; saveGame(); }
    G.achT = (G.achT || 0) - dt; if (G.achT <= 0 && G.mode === 'play') { G.achT = 2; checkAch(); }
  } else { cam.x += 22 * dt; cam.y += 9 * dt; }
  render();
  requestAnimationFrame(frame);
}

resize(); loadAccount(); migrateLegacySave(); initBackground(); buildSelect(); renderContinue();
requestAnimationFrame(frame);
