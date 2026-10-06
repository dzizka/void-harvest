'use strict';
/* =====================================================================
   ABILITIES — Space = dodge (every ship its own), Q / Shift = active skills.
   Skills unlock with level (slot Q at lvl 3, slot Shift at lvl 8) and scale
   with laser / missile damage, so they grow with gear.
   ===================================================================== */
const DODGES = {
  interceptor: { name: _L('Prekmit'), cd: 3.5, charges: 2, desc: _L('Teleport o 220 px, 0,3 s si nezraniteľný. 2 nabitia.') },
  juggernaut:  { name: _L('Pretlak'), cd: 5, desc: _L('Ťažký výpad dopredu, ktorý odhodí nepriateľov. Na 1 s dostávaš polovičné poškodenie.') },
  scavenger:   { name: _L('Magnetický skok'), cd: 4, desc: _L('Prudké zrýchlenie, 0,2 s nezraniteľnosť a 2 s priťahuješ rudu a korisť z veľkej diaľky.') },
  carrier:     { name: _L('Výmena'), cd: 4, desc: _L('Vymeníš si miesto s najvzdialenejším miniónom, ktorý potom 1 s púta paľbu. Bez miniónov krátky skok.') }
};
const PHASE_DODGE = { name: _L('Fázový rez'), cd: 2.2, desc: _L('Fázový skok: počas skoku si nezraniteľný a každému nepriateľovi v ceste spôsobíš 300 % poškodenia lasera.') };
const SKILLS = {
  railgun:  { cls: 'interceptor', lvl: 3, cd: 8,  name: _L('Railgun'),          desc: _L('Nabitý lúč, ktorý prestrelí všetko v línii za 600 % poškodenia lasera.') },
  microm:   { cls: 'interceptor', lvl: 8, cd: 10, name: _L('Mikrorakety'),      desc: _L('12 navádzaných rakiet na až 6 cieľov, každá za 60 % poškodenia rakety.') },
  ram:      { cls: 'juggernaut',  lvl: 3, cd: 8,  name: _L('Štítový náraz'),    desc: _L('Nálet o 300 px. Každého nepriateľa v ceste odhodí, spomalí a zasiahne za 300 % poškodenia lasera. Počas náletu si nezraniteľný.') },
  eruption: { cls: 'juggernaut',  lvl: 8, cd: 12, name: _L('Erupcia aury'),     desc: _L('Aura okamžite udrie za 5× svoje sekundové poškodenie a na 4 s má +50 % dosah.') },
  hurl:     { cls: 'scavenger',   lvl: 3, cd: 6,  name: _L('Traktorový vrh'),   desc: _L('Chytí najbližší asteroid a vrhne ho smerom k myši. Pri dopade vybuchne za 500 % poškodenia lasera a vysype rudu.') },
  dstorm:   { cls: 'scavenger',   lvl: 8, cd: 16, name: _L('Dronová búrka'),    desc: _L('Na 6 s majú drony dvojnásobnú kadenciu a pridajú sa 2 dočasné drony.') },
  order:    { cls: 'carrier',     lvl: 3, cd: 10, name: _L('Rozkaz: Útok'),     desc: _L('Všetci mínióni sa vrhnú na nepriateľa pri myši a 5 s majú +50 % poškodenia.') },
  detonate: { cls: 'carrier',     lvl: 8, cd: 12, name: _L('Detonácia'),        desc: _L('Odpáli všetkých miniónov, každý vybuchne za 300 % poškodenia lasera.') }
};
const CLS_SKILLS = { interceptor: ['railgun', 'microm'], juggernaut: ['ram', 'eruption'], scavenger: ['hurl', 'dstorm'], carrier: ['order', 'detonate'] };
const SKILL_KEYS = ['Q', 'Shift'];

const dodgeDef = () => (P.stats.legend.phaseCut ? PHASE_DODGE : DODGES[P.cls]);
const skillIn = slot => { const id = (CLS_SKILLS[P.cls] || [])[slot]; return id && P.level >= SKILLS[id].lvl ? id : null; };
const skillCdMult = () => 1;   // hook for cooldown reduction
function resetAbilities() {
  P.skCd = {}; P.dodgeCd = 0; P.dodgeCh = (DODGES[P.cls].charges || 1);
  P.invulnT = 0; P.drT = 0; P.magT = 0; P.ramT = 0; P.stormT = 0; P.orderT = 0; P.ramHit = null;
}
function moveDir() {
  const k = input.keys;
  const ix = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), iy = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
  return ix || iy ? Math.atan2(iy, ix) : P.a;
}
function blinkTo(a, dist) {
  const x0 = P.x, y0 = P.y;
  P.x = clamp(P.x + Math.cos(a) * dist, P.r, WORLD.w - P.r); P.y = clamp(P.y + Math.sin(a) * dist, P.r, WORLD.h - P.r);
  confineArena(P, P.r, 0);
  particles.push({ beam: true, x: x0, y: y0, x2: P.x, y2: P.y, w: 6, life: 0.25, max: 0.25, color: CLASSES[P.cls].color });
  burst(x0, y0, CLASSES[P.cls].color, 14, 200, 2, 0.35); ring(P.x, P.y, CLASSES[P.cls].color, 50, 0.3);
}

/* ---------- dodge (Space) ---------- */
function useDodge() {
  const D = dodgeDef(), a = moveDir(), s = P.stats;
  if (D === PHASE_DODGE) {
    if (P.dashCd > 0) return;
    P.dashA = a; P.dashT = 0.24; P.dashCd = D.cd; P.dashHit = new Set();
    ring(P.x, P.y, '#e14bff', 60, 0.3); onDodge(); return;
  }
  const maxCh = D.charges || 1;
  if (P.dodgeCh <= 0) return;
  P.dodgeCh--; if (P.dodgeCd <= 0) P.dodgeCd = D.cd * skillCdMult();
  if (P.cls === 'interceptor') { blinkTo(a, 220); P.invulnT = 0.3; }
  else if (P.cls === 'juggernaut') {
    P.vx = Math.cos(a) * 900; P.vy = Math.sin(a) * 900; P.ramT = 0.22; P.ramHit = new Set(); P.ramPow = 1; P.drT = 1;
    ring(P.x, P.y, '#b48cff', 90, 0.35); shake(3);
  } else if (P.cls === 'scavenger') {
    P.vx = Math.cos(a) * 820; P.vy = Math.sin(a) * 820; P.invulnT = 0.2; P.magT = 2;
    ring(P.x, P.y, '#5be09a', 140, 0.5); burst(P.x, P.y, '#5be09a', 16, 260, 2, 0.4);
  } else {
    let far = null, b = 0;
    for (const m of minions) { if (m.dead) continue; const dd = d2(m.x, m.y, P.x, P.y); if (dd > b && dd < 700 * 700) { b = dd; far = m; } }
    if (far) {
      const x0 = P.x, y0 = P.y;
      P.x = far.x; P.y = far.y; far.x = x0; far.y = y0;
      particles.push({ beam: true, x: x0, y: y0, x2: P.x, y2: P.y, w: 5, life: 0.3, max: 0.3, color: '#ff9d6e' });
      ring(far.x, far.y, '#ff9d6e', 70, 0.4);
      for (const e of enemies) if (!e.dead && !e.isBoss && d2(e.x, e.y, far.x, far.y) < 420 * 420) { e.tgt = far; e.aggroT = 1; }
    } else blinkTo(a, 160);
    P.invulnT = 0.25;
  }
  onDodge();
}

/* ---------- skills (Q / Shift) ---------- */
function castSkill(slot) {
  const id = skillIn(slot);
  if (!id) { const want = (CLS_SKILLS[P.cls] || [])[slot]; if (want) addText(P.x, P.y - 30, _T`Odomkne sa na úrovni ${SKILLS[want].lvl}`, '#7f8ca8', 11, 0.8); return; }
  if ((P.skCd[id] || 0) > 0) return;
  if (G.safe && G.bubble) { addText(P.x, P.y - 30, _L('V bezpečnej zóne nie'), '#7f8ca8', 11, 0.8); return; }
  if (SKILL_FX[id]() === false) return;
  P.skCd[id] = SKILLS[id].cd * skillCdMult();
}
const critRoll = () => Math.random() * 100 < P.stats.crit;
const nearMouseEnemy = (r, from) => {
  const mw = from || mouseWorld(); let t = null, b = r * r;
  for (const e of enemies) { if (e.dead || e.shielded) continue; const dd = d2(e.x, e.y, mw.x, mw.y); if (dd < b) { b = dd; t = e; } }
  return t;
};
const SKILL_FX = {
  railgun() {
    const s = P.stats, len = 950, ca = Math.cos(P.a), sa = Math.sin(P.a);
    const x1 = P.x + ca * 18, y1 = P.y + sa * 18, x2 = x1 + ca * len, y2 = y1 + sa * len;
    const hitLine = (o, w) => { const t = clamp(((o.x - x1) * ca + (o.y - y1) * sa), 0, len); const px = x1 + ca * t, py = y1 + sa * t; return d2(o.x, o.y, px, py) < (o.r + w) ** 2; };
    G.dmgSrc = 'skill';
    for (const e of enemies) if (!e.dead && hitLine(e, 16)) { const c = critRoll(); damageEnemy(e, s.laserHit * 6 * dmgBuff() * (c ? s.critMult : 1), c); }
    for (const a of asteroids) if (!a.dead && hitLine(a, 10)) damageAsteroid(a, s.laserHit * 6 * s.miningPower, false);
    G.dmgSrc = null;
    particles.push({ beam: true, x: x1, y: y1, x2, y2, w: 10, life: 0.35, max: 0.35, color: CLASSES[P.cls].color });
    burst(x1, y1, '#ffffff', 12, 260, 2, 0.3); shake(4);
    P.vx -= ca * 160; P.vy -= sa * 160;
  },
  microm() {
    const s = P.stats, mw = mouseWorld();
    const tg = enemies.filter(e => !e.dead && !e.shielded && d2(e.x, e.y, P.x, P.y) < 700 * 700)
      .sort((a, b) => d2(a.x, a.y, mw.x, mw.y) - d2(b.x, b.y, mw.x, mw.y)).slice(0, 6);
    for (let i = 0; i < 12; i++) {
      const a = P.a + (i / 11 - 0.5) * 2.4, crit = critRoll();
      missiles.push({ x: P.x + Math.cos(a) * 16, y: P.y + Math.sin(a) * 16, a, spd: 320, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320,
        dmg: s.missileHit * 0.6 * dmgBuff() * (crit ? s.critMult : 1), crit, radius: Math.max(40, s.missileRadius * 0.6), homing: true,
        target: tg.length ? tg[i % tg.length] : null, life: 2.6, trailT: 0, plasma: false, dead: false, bubble: G.bubble, micro: true });
    }
    shake(2);
  },
  ram() {
    const a = moveDir();
    P.vx = Math.cos(a) * 1050; P.vy = Math.sin(a) * 1050; P.ramT = 0.3; P.ramHit = new Set(); P.ramPow = 3; P.invulnT = Math.max(P.invulnT, 0.3);
    ring(P.x, P.y, '#9fd0ff', 110, 0.35); shake(4);
  },
  eruption() {
    const s = P.stats; if (!s.aura) return false;
    const R = s.aura.r * 1.5;
    G.dmgSrc = 'skill';
    splash(P.x, P.y, R, s.aura.dps * 5, null, null);
    G.dmgSrc = null;
    P.auraBoostT = Math.max(P.auraBoostT, 4);
    ring(P.x, P.y, '#c29bff', R, 0.5); ring(P.x, P.y, '#ffffff', R * 0.6, 0.35); burst(P.x, P.y, '#c29bff', 40, R * 2.5, 2.6, 0.6); shake(6);
  },
  hurl() {
    let t = null, b = 520 * 520;
    for (const a of asteroids) { if (a.dead || a.thrown) continue; const dd = d2(a.x, a.y, P.x, P.y); if (dd < b) { b = dd; t = a; } }
    if (!t) { addText(P.x, P.y - 30, _L('Žiadny asteroid v dosahu'), '#7f8ca8', 11, 0.8); return false; }
    const mw = mouseWorld(), ang = Math.atan2(mw.y - t.y, mw.x - t.x);
    t.thrown = 0.9; t.vx = Math.cos(ang) * 950; t.vy = Math.sin(ang) * 950;
    particles.push({ beam: true, x: P.x, y: P.y, x2: t.x, y2: t.y, w: 4, life: 0.25, max: 0.25, color: '#5be09a' });
    ring(t.x, t.y, '#5be09a', t.r + 30, 0.3);
  },
  dstorm() {
    if (!P.stats.drones) return false;
    P.stormT = 6; ring(P.x, P.y, '#5be09a', 120, 0.5); burst(P.x, P.y, '#5be09a', 24, 300, 2, 0.5);
  },
  order() {
    const alive = minions.filter(m => !m.dead);
    if (!alive.length) { addText(P.x, P.y - 30, _L('Žiadni mínióni'), '#7f8ca8', 11, 0.8); return false; }
    const t = nearMouseEnemy(420) || nearMouseEnemy(600, P);
    for (const m of alive) { if (t) m.tgt = t; }
    P.orderT = 5;
    if (t) { ring(t.x, t.y, '#ff9d6e', 80, 0.5); for (const m of alive) particles.push({ bolt: true, x: m.x, y: m.y, x2: t.x, y2: t.y, life: 0.2, max: 0.2, color: '#ff9d6e' }); }
    ring(P.x, P.y, '#ff9d6e', 100, 0.4);
  },
  detonate() {
    const alive = minions.filter(m => !m.dead);
    if (!alive.length) { addText(P.x, P.y - 30, _L('Žiadni mínióni'), '#7f8ca8', 11, 0.8); return false; }
    G.dmgSrc = 'skill';
    for (const m of alive) minionBlow(m, 300);
    G.dmgSrc = null;
    shake(6);
  }
};

/* ---------- per-frame ---------- */
function updateAbilities(dt) {
  if (!P.skCd) resetAbilities();
  const s = P.stats, D = dodgeDef();
  if (input.dodge) { input.dodge = false; if (G.mode === 'play') useDodge(); }
  for (let i = 0; i < 2; i++) if (input.skill[i]) { input.skill[i] = false; if (G.mode === 'play') castSkill(i); }
  for (const k in P.skCd) P.skCd[k] -= dt;
  const maxCh = D.charges || 1;
  if (P.dodgeCh < maxCh) { P.dodgeCd -= dt; if (P.dodgeCd <= 0) { P.dodgeCh++; P.dodgeCd = P.dodgeCh < maxCh ? D.cd * skillCdMult() : 0; } }
  else P.dodgeCd = 0;
  P.invulnT -= dt; P.drT -= dt; P.magT -= dt; P.stormT -= dt; P.orderT -= dt;
  // ram / surge: shove enemies out of the way
  if (P.ramT > 0) {
    P.ramT -= dt;
    const sp = Math.hypot(P.vx, P.vy) || 1, nx = P.vx / sp, ny = P.vy / sp;
    G.dmgSrc = 'skill';
    for (const e of enemies) {
      if (e.dead || P.ramHit.has(e) || d2(e.x, e.y, P.x, P.y) > (e.r + 44) ** 2) continue;
      P.ramHit.add(e);
      if (!e.isBoss) { e.x += nx * 80; e.y += ny * 80; }
      applySlow(e, 60, P.ramPow > 1 ? 1.5 : 0.8);
      damageEnemy(e, s.laserHit * P.ramPow * dmgBuff(), false);
    }
    G.dmgSrc = null;
    particles.push({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 7, color: P.ramPow > 1 ? '#9fd0ff' : '#b48cff', drag: 0 });
  }
  // thrown asteroids (Traktorový vrh)
  for (const a of asteroids) {
    if (!a.thrown || a.dead) continue;
    a.thrown -= dt;
    let hit = a.thrown <= 0;
    for (const e of enemies) if (!e.dead && d2(e.x, e.y, a.x, a.y) < (e.r + a.r) ** 2) { hit = true; break; }
    particles.push({ x: a.x, y: a.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 4, color: '#5be09a', drag: 0 });
    if (hit) {
      G.dmgSrc = 'skill';
      splash(a.x, a.y, 90 + a.r, s.laserHit * 5 * dmgBuff(), null, '#5be09a');
      G.dmgSrc = null;
      burst(a.x, a.y, '#c8a27c', 30, 320, 2.6, 0.6); shake(5);
      a.thrown = 0; a.vx = 0; a.vy = 0; breakAsteroid(a);
    }
  }
}
