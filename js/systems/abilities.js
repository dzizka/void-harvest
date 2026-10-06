'use strict';
/* =====================================================================
   ABILITIES — Space = dodge (every ship its own), Q / Shift = two active
   skills picked from four per ship. Skills scale with laser / missile
   damage. Skill points (1 per 5 levels, max 10): 1st point = upgrade
   (+25 % damage, −15 % cooldown), 2nd point = one of two modifiers.
   ===================================================================== */
const DODGES = {
  interceptor: { name: _L('Prekmit'), cd: 3.5, charges: 2, desc: _L('Teleport o 220 px, 0,3 s si nezraniteľný. 2 nabitia.') },
  juggernaut:  { name: _L('Pretlak'), cd: 5, desc: _L('Ťažký výpad dopredu, ktorý odhodí nepriateľov. Na 1 s dostávaš polovičné poškodenie.') },
  scavenger:   { name: _L('Magnetický skok'), cd: 4, desc: _L('Prudké zrýchlenie, 0,2 s nezraniteľnosť a 2 s priťahuješ rudu a korisť z veľkej diaľky.') },
  carrier:     { name: _L('Výmena'), cd: 4, desc: _L('Vymeníš si miesto s najvzdialenejším miniónom, ktorý potom 1 s púta paľbu. Bez miniónov krátky skok.') }
};
const PHASE_DODGE = { name: _L('Fázový rez'), cd: 2.2, desc: _L('Fázový skok: počas skoku si nezraniteľný a každému nepriateľovi v ceste spôsobíš 300 % poškodenia lasera.') };
const DODGE_MODS = [
  { name: _L('Dvojitý úhyb'), desc: _L('+1 nabitie úhybu.') },
  { name: _L('Rázový úhyb'), desc: _L('Úhyb zanechá výbuch za 150 % poškodenia lasera.') }
];
const SKILLS = {
  railgun:  { cls: 'interceptor', lvl: 3,  cd: 8,  name: _L('Railgun'), desc: _L('Nabitý lúč, ktorý prestrelí všetko v línii za 600 % poškodenia lasera.'),
    mods: [{ name: _L('Lovec'), desc: _L('Zabitie kritickým zásahom skráti cooldown o 2 s.') }, { name: _L('Spálená zem'), desc: _L('Lúč zanechá horiacu stopu na 3 s.') }] },
  microm:   { cls: 'interceptor', lvl: 8,  cd: 10, name: _L('Mikrorakety'), desc: _L('12 navádzaných rakiet na až 6 cieľov, každá za 60 % poškodenia rakety.'),
    mods: [{ name: _L('Hustá salva'), desc: _L('+6 rakiet.') }, { name: _L('Spätná väzba'), desc: _L('Každý zásah skráti nabíjanie rakiet o 0,15 s.') }] },
  timeloop: { cls: 'interceptor', lvl: 14, cd: 20, name: _L('Časová slučka'), desc: _L('Nepriatelia a ich strely v okolí sa na 4 s spomalia o 50 %, ty máš +30 % kadenciu.'),
    mods: [{ name: _L('Krehký čas'), desc: _L('Spomalení nepriatelia dostávajú +25 % poškodenia.') }, { name: _L('Dlhá slučka'), desc: _L('Trvanie +2 s.') }] },
  clone:    { cls: 'interceptor', lvl: 20, cd: 14, name: _L('Fantómový klon'), desc: _L('Hologram na 5 s, ktorý púta paľbu a strieľa za 40 % tvojho lasera.'),
    mods: [{ name: _L('Nestabilný klon'), desc: _L('Na konci vybuchne za 300 % poškodenia lasera.') }, { name: _L('Zameriavač'), desc: _L('Kým klon žije, máš +20 % kritickú šancu.') }] },
  ram:      { cls: 'juggernaut', lvl: 3,  cd: 8,  name: _L('Štítový náraz'), desc: _L('Nálet o 300 px. Každého nepriateľa v ceste odhodí, spomalí a zasiahne za 300 % poškodenia lasera. Počas náletu si nezraniteľný.'),
    mods: [{ name: _L('Nabíjací štít'), desc: _L('Každý zasiahnutý nepriateľ dá preťaženie štítu 15 %.') }, { name: _L('Rázová vlna'), desc: _L('Na konci náletu rázová vlna za 200 % poškodenia lasera.') }] },
  eruption: { cls: 'juggernaut', lvl: 8,  cd: 12, name: _L('Erupcia aury'), desc: _L('Aura okamžite udrie za 5× svoje sekundové poškodenie a na 4 s má +50 % dosah.'),
    mods: [{ name: _L('Horiaca zem'), desc: _L('Zanechá horiacu zem na 4 s.') }, { name: _L('Pijavica'), desc: _L('Každý zasiahnutý nepriateľ obnoví 1 % trupu.') }] },
  orbital:  { cls: 'juggernaut', lvl: 14, cd: 14, name: _L('Orbitálny úder'), desc: _L('Na miesto myši dopadnú po 1 s 3 granáty, každý za 400 % poškodenia lasera.'),
    mods: [{ name: _L('Kobercový úder'), desc: _L('+2 granáty.') }, { name: _L('Otras'), desc: _L('Zasiahnutí nepriatelia sú 3 s silno spomalení.') }] },
  gravwell: { cls: 'juggernaut', lvl: 20, cd: 18, name: _L('Gravitačná studňa'), desc: _L('Na 3 s vtiahne nepriateľov do bodu pri myši; v studni dostávajú +25 % poškodenia.'),
    mods: [{ name: _L('Kolaps'), desc: _L('Na konci exploduje za 400 % poškodenia lasera.') }, { name: _L('Horizont udalostí'), desc: _L('Dosah +50 %.') }] },
  hurl:     { cls: 'scavenger', lvl: 3,  cd: 6,  name: _L('Traktorový vrh'), desc: _L('Chytí najbližší asteroid a vrhne ho smerom k myši. Pri dopade vybuchne za 500 % poškodenia lasera a vysype rudu.'),
    mods: [{ name: _L('Úlomky'), desc: _L('Asteroid sa rozletí na 3 kusy, každý zasiahne okolie.') }, { name: _L('Bohatá žila'), desc: _L('Hodený asteroid vysype dvojnásobok rudy.') }] },
  dstorm:   { cls: 'scavenger', lvl: 8,  cd: 16, name: _L('Dronová búrka'), desc: _L('Na 6 s majú drony dvojnásobnú kadenciu a pridajú sa 2 dočasné drony.'),
    mods: [{ name: _L('Ostré drony'), desc: _L('Počas búrky drony kriticky zasahujú za dvojnásobok.') }, { name: _L('Nekonečná búrka'), desc: _L('Každé zabitie predĺži búrku o 0,5 s.') }] },
  orewave:  { cls: 'scavenger', lvl: 14, cd: 10, name: _L('Rudný výboj'), desc: _L('Minie 2 % nesenej rudy a vyšle zlatú vlnu; čím viac rudy, tým silnejšia. Dá preťaženie štítu 20 %.'),
    mods: [{ name: _L('Ozvena'), desc: _L('Vlna zasiahne druhýkrát za 60 %.') }, { name: _L('Šetrnosť'), desc: _L('Minie len 1 % rudy, sila ostáva.') }] },
  mines:    { cls: 'scavenger', lvl: 20, cd: 12, name: _L('Mínové pole'), desc: _L('Rozhodí okolo lode 6 mín, každá vybuchne za 250 % poškodenia lasera.'),
    mods: [{ name: _L('Navádzané míny'), desc: _L('Míny sa samy pohybujú k nepriateľom.') }, { name: _L('Hustejšie pole'), desc: _L('+4 míny.') }] },
  order:    { cls: 'carrier', lvl: 3,  cd: 10, name: _L('Rozkaz: Útok'), desc: _L('Všetci mínióni sa vrhnú na nepriateľa pri myši a 5 s majú +50 % poškodenia.'),
    mods: [{ name: _L('Provokácia'), desc: _L('Nepriatelia pri cieli útočia na miniónov.') }, { name: _L('Výrobná linka'), desc: _L('Počas rozkazu sa mínióni stavajú dvojnásobne často.') }] },
  detonate: { cls: 'carrier', lvl: 8,  cd: 12, name: _L('Detonácia'), desc: _L('Odpáli všetkých miniónov, každý vybuchne za 300 % poškodenia lasera.'),
    mods: [{ name: _L('Šrapnel'), desc: _L('Výbuchy spomalia nepriateľov o 50 % na 3 s.') }, { name: _L('Recyklácia'), desc: _L('Polovica miniónov sa hneď obnoví.') }] },
  emergency:{ cls: 'carrier', lvl: 14, cd: 18, name: _L('Núdzová výroba'), desc: _L('Okamžite postaví 3 miniónov nad limit na 15 s.'),
    mods: [{ name: _L('Elitná výroba'), desc: _L('Dočasní mínióni majú dvojnásobné zdravie aj poškodenie.') }, { name: _L('Druhá zmena'), desc: _L('+2 mínióni.') }] },
  ring:     { cls: 'carrier', lvl: 20, cd: 16, name: _L('Ochranný prstenec'), desc: _L('Mínióni na 4 s krúžia tesne okolo lode a pohlcujú strely.'),
    mods: [{ name: _L('Zrkadlo'), desc: _L('Pohltené strely sa odrazia späť za 100 % poškodenia lasera.') }, { name: _L('Oceľový kruh'), desc: _L('Trvanie +2 s a mínióni sú počas prstenca nezraniteľní.') }] }
};
const CLS_SKILLS = {};
for (const id in SKILLS) (CLS_SKILLS[SKILLS[id].cls] = CLS_SKILLS[SKILLS[id].cls] || []).push(id);
const SKILL_KEYS = ['Q', 'Shift'];

/* ---------- state helpers ---------- */
function skState() {
  if (!P.skill) P.skill = { sel: (CLS_SKILLS[P.cls] || []).slice(0, 2), rk: {}, mod: {} };
  return P.skill;
}
const skRank = id => (skState().rk[id] || 0);
const skMod = (id, k) => skRank(id) >= 2 && skState().mod[id] === k;
const skPtsTotal = () => Math.min(10, Math.floor(P.level / 5));
const skPtsSpent = () => Object.values(skState().rk).reduce((a, v) => a + v, 0);
const skPtsFree = () => skPtsTotal() - skPtsSpent();
const dodgeDef = () => (P.stats.legend.phaseCut ? PHASE_DODGE : DODGES[P.cls]);
const dodgeCharges = () => (dodgeDef().charges || 1) + (skMod('dodge', 0) ? 1 : 0);
const dodgeCd = () => dodgeDef().cd * (skRank('dodge') >= 1 ? 0.8 : 1) * cdMult();
function skillIn(slot) { const id = skState().sel[slot]; return id && SKILLS[id] && SKILLS[id].cls === P.cls && P.level >= SKILLS[id].lvl ? id : null; }
const cdMult = () => (1 - Math.min(40, (P.stats.skCdr || 0)) / 100) * (1 - hb('cd'));
const skillCd = id => SKILLS[id].cd * (skRank(id) >= 1 ? 0.85 : 1) * cdMult();
const skDmg = id => (1 + (P.stats.skDmg || 0) / 100) * (skRank(id) >= 1 ? 1.25 : 1) * dmgBuff();
function resetAbilities() {
  P.skCd = {}; P.dodgeCd = 0; P.dodgeCh = dodgeCharges();
  P.invulnT = 0; P.drT = 0; P.magT = 0; P.ramT = 0; P.stormT = 0; P.orderT = 0; P.ramHit = null;
  P.slowT = 0; P.hasteT = 0; P.ringT = 0; P.critT = 0;
  abil = { clone: null, clone2: null, shells: [], wells: [], mines: [], waves: [], echoes: [] };
}
let abil = { clone: null, clone2: null, shells: [], wells: [], mines: [], waves: [], echoes: [] };
function moveDir() {
  const k = input.keys;
  const ix = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), iy = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
  return ix || iy ? Math.atan2(iy, ix) : P.a;
}
// target point: the cursor, or the auto-target when skills are cast automatically
function aimPoint() {
  if (G.autoCasting) { const t = P.autoT && P.autoT.T && !P.autoT.dead ? P.autoT : nearMouseEnemy(600, P); if (t) return { x: t.x, y: t.y }; }
  return mouseWorld();
}
function blinkTo(a, dist) {
  const x0 = P.x, y0 = P.y;
  P.x = clamp(P.x + Math.cos(a) * dist, P.r, WORLD.w - P.r); P.y = clamp(P.y + Math.sin(a) * dist, P.r, WORLD.h - P.r);
  confineArena(P, P.r, 0);
  particles.push({ beam: true, x: x0, y: y0, x2: P.x, y2: P.y, w: 6, life: 0.25, max: 0.25, color: CLASSES[P.cls].color });
  burst(x0, y0, CLASSES[P.cls].color, 14, 200, 2, 0.35); ring(P.x, P.y, CLASSES[P.cls].color, 50, 0.3);
}
const fxSplash = (x, y, r, dmg, col, slow) => {
  G.dmgSrc = 'skill';
  for (const e of enemies) if (!e.dead && d2(e.x, e.y, x, y) < (r + e.r) ** 2) { damageEnemy(e, dmg, false, true); if (slow) applySlow(e, slow, 3); }
  G.dmgSrc = null;
  if (col) ring(x, y, col, r, 0.35);
};

/* ---------- dodge (Space) ---------- */
function useDodge() {
  const D = dodgeDef(), a = moveDir(), s = P.stats;
  if (D === PHASE_DODGE) {
    if (P.dashCd > 0) return;
    P.dashA = a; P.dashT = 0.24; P.dashCd = D.cd * cdMult(); P.dashHit = new Set();
    ring(P.x, P.y, '#e14bff', 60, 0.3); onDodge(); return;
  }
  if (P.dodgeCh <= 0) return;
  P.dodgeCh--; if (P.dodgeCd <= 0) P.dodgeCd = dodgeCd();
  const x0 = P.x, y0 = P.y;
  if (P.cls === 'interceptor') { blinkTo(a, 220); P.invulnT = 0.3; }
  else if (P.cls === 'juggernaut') {
    P.vx = Math.cos(a) * 900; P.vy = Math.sin(a) * 900; P.ramT = 0.22; P.ramHit = new Set(); P.ramPow = 1; P.ramSkill = false; P.drT = 1;
    ring(P.x, P.y, '#b48cff', 90, 0.35); shake(3);
  } else if (P.cls === 'scavenger') {
    P.vx = Math.cos(a) * 820; P.vy = Math.sin(a) * 820; P.invulnT = 0.2; P.magT = 2;
    ring(P.x, P.y, '#5be09a', 140, 0.5); burst(P.x, P.y, '#5be09a', 16, 260, 2, 0.4);
  } else {
    let far = null, b = 0;
    for (const m of minions) { if (m.dead) continue; const dd = d2(m.x, m.y, P.x, P.y); if (dd > b && dd < 700 * 700) { b = dd; far = m; } }
    if (far) {
      P.x = far.x; P.y = far.y; far.x = x0; far.y = y0;
      particles.push({ beam: true, x: x0, y: y0, x2: P.x, y2: P.y, w: 5, life: 0.3, max: 0.3, color: '#ff9d6e' });
      ring(far.x, far.y, '#ff9d6e', 70, 0.4);
      for (const e of enemies) if (!e.dead && !e.isBoss && d2(e.x, e.y, far.x, far.y) < 420 * 420) { e.tgt = far; e.aggroT = 1; }
    } else blinkTo(a, 160);
    P.invulnT = 0.25;
  }
  if (skMod('dodge', 1) && !G.safe) fxSplash(x0, y0, 140, s.laserHit * 1.5 * dmgBuff(), CLASSES[P.cls].color);
  onDodge();
}

/* ---------- skills (Q / Shift) ---------- */
function castSkill(slot, auto) {
  const id = skillIn(slot);
  if (!id) { if (!auto) { const want = skState().sel[slot]; if (want && SKILLS[want]) addText(P.x, P.y - 30, _T`Odomkne sa na úrovni ${SKILLS[want].lvl}`, '#7f8ca8', 11, 0.8); } return false; }
  if ((P.skCd[id] || 0) > 0) return false;
  if (G.safe && G.bubble) { if (!auto) addText(P.x, P.y - 30, _L('V bezpečnej zóne nie'), '#7f8ca8', 11, 0.8); return false; }
  G.autoCasting = !!auto;
  const ok = SKILL_FX[id](id) !== false;
  G.autoCasting = false;
  if (ok) P.skCd[id] = skillCd(id);
  return ok;
}
const critRoll = () => Math.random() * 100 < P.stats.crit + (P.critT > 0 ? 20 : 0) + hb('crit');
const nearMouseEnemy = (r, from) => {
  const mw = from || mouseWorld(); let t = null, b = r * r;
  for (const e of enemies) { if (e.dead || e.shielded) continue; const dd = d2(e.x, e.y, mw.x, mw.y); if (dd < b) { b = dd; t = e; } }
  return t;
};
const fail = (txt) => { if (!G.autoCasting) addText(P.x, P.y - 30, txt, '#7f8ca8', 11, 0.8); return false; };
const SKILL_FX = {
  railgun(id) {
    const s = P.stats, len = 950, ca = Math.cos(P.a), sa = Math.sin(P.a), m = skDmg(id);
    const x1 = P.x + ca * 18, y1 = P.y + sa * 18, x2 = x1 + ca * len, y2 = y1 + sa * len;
    const hitLine = (o, w) => { const t = clamp(((o.x - x1) * ca + (o.y - y1) * sa), 0, len); const px = x1 + ca * t, py = y1 + sa * t; return d2(o.x, o.y, px, py) < (o.r + w) ** 2; };
    G.dmgSrc = 'skill';
    let critKill = false; P.railHit = new Set();
    for (const e of enemies) if (!e.dead && hitLine(e, 16)) { P.railHit.add(e); const c = critRoll(); damageEnemy(e, s.laserHit * 6 * m * (c ? s.critMult : 1), c); if (c && e.dead) critKill = true; }
    for (const a of asteroids) if (!a.dead && hitLine(a, 10)) damageAsteroid(a, s.laserHit * 6 * s.miningPower, false);
    G.dmgSrc = null;
    if (s.legend.lRail) {
      let from = null, b = -1;
      for (const e of enemies) if (P.railHit && P.railHit.has(e)) { const t = (e.x - x1) * ca + (e.y - y1) * sa; if (t > b) { b = t; from = e; } }
      const done = new Set(P.railHit || []);
      for (let k = 0; k < 2 && from; k++) {
        let nx = null, nb = 500 * 500;
        for (const e of enemies) { if (e.dead || done.has(e) || e.shielded) continue; const dd = d2(e.x, e.y, from.x, from.y); if (dd < nb) { nb = dd; nx = e; } }
        if (!nx) break;
        particles.push({ beam: true, x: from.x, y: from.y, x2: nx.x, y2: nx.y, w: 7, life: 0.3, max: 0.3, color: '#ffffff' });
        const c = critRoll(); G.dmgSrc = 'skill'; damageEnemy(nx, s.laserHit * 6 * m * 0.7 * (c ? s.critMult : 1), c); G.dmgSrc = null;
        done.add(nx); from = nx;
      }
    }
    if (skMod(id, 1)) for (let d = 80; d < len; d += 110) { fires.push({ x: x1 + ca * d, y: y1 + sa * d, r: 46, t: 3, tick: 0, dps: s.laserHit * 0.8 * m }); if (fires.length > 40) fires.shift(); }
    particles.push({ beam: true, x: x1, y: y1, x2, y2, w: 10, life: 0.35, max: 0.35, color: CLASSES[P.cls].color });
    burst(x1, y1, '#ffffff', 12, 260, 2, 0.3); shake(4);
    P.vx -= ca * 160; P.vy -= sa * 160;
    if (critKill && skMod(id, 0)) setTimeout0(() => { P.skCd[id] = Math.max(0, (P.skCd[id] || 0) - 2); });
  },
  microm(id) {
    const s = P.stats, mw = aimPoint(), n = skMod(id, 0) ? 18 : 12, m = skDmg(id);
    const tg = enemies.filter(e => !e.dead && !e.shielded && d2(e.x, e.y, P.x, P.y) < 700 * 700)
      .sort((a, b) => d2(a.x, a.y, mw.x, mw.y) - d2(b.x, b.y, mw.x, mw.y)).slice(0, 6);
    for (let i = 0; i < n; i++) {
      const a = P.a + (i / (n - 1) - 0.5) * 2.4, crit = critRoll();
      missiles.push({ x: P.x + Math.cos(a) * 16, y: P.y + Math.sin(a) * 16, a, spd: 320, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320,
        dmg: s.missileHit * 0.6 * m * (crit ? s.critMult : 1), crit, radius: Math.max(40, s.missileRadius * 0.6), homing: true,
        target: tg.length ? tg[i % tg.length] : null, life: 2.6, trailT: 0, plasma: false, dead: false, bubble: G.bubble, micro: true, feedback: skMod(id, 1) });
    }
    shake(2);
  },
  timeloop(id) {
    const R = 400, t = skMod(id, 1) ? 6 : 4;
    for (const e of enemies) if (!e.dead && d2(e.x, e.y, P.x, P.y) < (R + e.r) ** 2) { applySlow(e, 50, t); if (skMod(id, 0)) e.vulnT = G.time + t; }
    for (const b of ebullets) if (!b.dead && d2(b.x, b.y, P.x, P.y) < R * R) { b.vx *= 0.5; b.vy *= 0.5; b.life *= 2; }
    P.hasteT = t;
    ring(P.x, P.y, '#9fe6ff', R, 0.8); ring(P.x, P.y, '#ffffff', R * 0.5, 0.5);
  },
  clone(id) {
    const s = P.stats;
    if (s.legend.lClone) abil.clone2 = { x: P.x + 60, y: P.y - 40, a: P.a, t: 5, fireT: 0.2, isMinion: false, dead: false, r: 14, boom: skMod(id, 0), dmg: s.laserHit * 0.4 * skDmg(id), boomDmg: s.laserHit * 3 * skDmg(id) };
    abil.clone = { x: P.x, y: P.y, a: P.a, t: 5, fireT: 0, isMinion: false, dead: false, r: 14, boom: skMod(id, 0), dmg: s.laserHit * 0.4 * skDmg(id), boomDmg: s.laserHit * 3 * skDmg(id) };
    for (const e of enemies) if (!e.dead && !e.isBoss && d2(e.x, e.y, P.x, P.y) < 520 * 520) e.tgt = abil.clone2 && Math.random() < 0.5 ? abil.clone2 : abil.clone;
    if (skMod(id, 1)) P.critT = 5;
    blinkTo(moveDir() + Math.PI, 90);
    ring(abil.clone.x, abil.clone.y, '#b48cff', 60, 0.4);
  },
  ram(id) {
    const a = moveDir();
    P.vx = Math.cos(a) * 1050; P.vy = Math.sin(a) * 1050; P.ramT = 0.3; P.ramHit = new Set(); P.ramPow = 3 * skDmg(id) / dmgBuff(); P.ramSkill = id; P.invulnT = Math.max(P.invulnT, 0.3);
    ring(P.x, P.y, '#9fd0ff', 110, 0.35); shake(4);
  },
  eruption(id) {
    const s = P.stats; if (!s.aura) return false;
    const R = s.aura.r * 1.5, m = skDmg(id) / dmgBuff();
    let n = 0;
    G.dmgSrc = 'skill';
    for (const e of enemies) if (!e.dead && d2(e.x, e.y, P.x, P.y) < (R + e.r) ** 2) { damageEnemy(e, s.aura.dps * 5 * m, false, true); n++; }
    G.dmgSrc = null;
    if (skMod(id, 1)) P.hull = Math.min(s.maxHull, P.hull + s.maxHull * 0.01 * n);
    if (skMod(id, 0)) { fires.push({ x: P.x, y: P.y, r: R * 0.6, t: 4, tick: 0, dps: s.aura.dps * 0.5 * m }); if (fires.length > 40) fires.shift(); }
    P.auraBoostT = Math.max(P.auraBoostT, 4);
    if (s.legend.lErupt) for (const t of [1, 2]) abil.echoes.push({ t, dmg: s.aura.dps * 5 * m * 0.5, r: R });
    ring(P.x, P.y, '#c29bff', R, 0.5); ring(P.x, P.y, '#ffffff', R * 0.6, 0.35); burst(P.x, P.y, '#c29bff', 40, R * 2.5, 2.6, 0.6); shake(6);
  },
  orbital(id) {
    const s = P.stats, pt = aimPoint(), n = skMod(id, 0) ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), r = i ? rand(30, 90) : 0;
      abil.shells.push({ x: pt.x + Math.cos(a) * r, y: pt.y + Math.sin(a) * r, t: 1 + i * 0.12, dmg: s.laserHit * 4 * skDmg(id), stun: skMod(id, 1) });
    }
    ring(pt.x, pt.y, '#ffb35c', 120, 1);
  },
  gravwell(id) {
    const s = P.stats, pt = aimPoint();
    abil.wells.push({ x: pt.x, y: pt.y, t: s.legend.lWell ? 5 : 3, r: skMod(id, 1) ? 480 : 320, boom: skMod(id, 0) ? s.laserHit * 4 * skDmg(id) : 0, pulse: s.legend.lWell ? s.laserHit * skDmg(id) : 0, pt: 1 });
    ring(pt.x, pt.y, '#9a8cff', 200, 0.6);
  },
  hurl(id) {
    const cand = asteroids.filter(a => !a.dead && !a.thrown && d2(a.x, a.y, P.x, P.y) < 520 * 520).sort((a, b) => d2(a.x, a.y, P.x, P.y) - d2(b.x, b.y, P.x, P.y)).slice(0, P.stats.legend.lHurl ? 3 : 1);
    if (!cand.length) return fail(_L('Žiadny asteroid v dosahu'));
    const mw = aimPoint();
    cand.forEach((t, i) => {
      const ang = Math.atan2(mw.y - t.y, mw.x - t.x) + (i ? (i % 2 ? 0.25 : -0.25) : 0);
      t.thrown = 0.9; t.vx = Math.cos(ang) * 950; t.vy = Math.sin(ang) * 950; t.hurlDmg = P.stats.laserHit * 5 * skDmg(id); t.split = skMod(id, 0); t.oreMul = skMod(id, 1) ? 2 : 1;
      particles.push({ beam: true, x: P.x, y: P.y, x2: t.x, y2: t.y, w: 4, life: 0.25, max: 0.25, color: '#5be09a' });
      ring(t.x, t.y, '#5be09a', t.r + 30, 0.3);
    });
  },
  dstorm(id) {
    if (!P.stats.drones) return fail(_L('Žiadne drony'));
    P.stormT = 6; P.stormCrit = skMod(id, 0); P.stormExt = skMod(id, 1) ? 6 : 0;
    ring(P.x, P.y, '#5be09a', 120, 0.5); burst(P.x, P.y, '#5be09a', 24, 300, 2, 0.5);
  },
  orewave(id) {
    const s = P.stats, spent = Math.floor(P.ore * (skMod(id, 1) ? 0.01 : 0.02));
    P.ore -= spent;
    const dmg = s.laserHit * (3 + 2 * Math.log10(1 + spent)) * skDmg(id);
    abil.waves.push({ x: P.x, y: P.y, r: 0, max: 320, dmg, hit: new Set() });
    if (skMod(id, 0)) abil.waves.push({ x: P.x, y: P.y, r: -140, max: 320, dmg: dmg * 0.6, hit: new Set() });
    P.oshield = Math.min(s.maxShield * 0.5, (P.oshield || 0) + s.maxShield * 0.2);
    if (spent) addText(P.x, P.y - 34, _T`−${fmtN(spent)} rudy`, '#c8a27c', 12, 0.8);
  },
  mines(id) {
    const s = P.stats, n = skMod(id, 1) ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU;
      abil.mines.push({ x: P.x + Math.cos(a) * 30, y: P.y + Math.sin(a) * 30, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, arm: 0.5, t: 15, dmg: s.laserHit * 2.5 * skDmg(id), seek: skMod(id, 0) });
    }
    ring(P.x, P.y, '#ffd36b', 90, 0.4);
  },
  order(id) {
    const alive = minions.filter(m => !m.dead);
    if (!alive.length) return fail(_L('Žiadni mínióni'));
    const t = G.autoCasting ? nearMouseEnemy(600, aimPoint()) : nearMouseEnemy(420) || nearMouseEnemy(600, P);
    for (const m of alive) { if (t) m.tgt = t; }
    P.orderT = 5; P.orderBuild = skMod(id, 1);
    if (t) {
      ring(t.x, t.y, '#ff9d6e', 80, 0.5);
      for (const m of alive) particles.push({ bolt: true, x: m.x, y: m.y, x2: t.x, y2: t.y, life: 0.2, max: 0.2, color: '#ff9d6e' });
      if (skMod(id, 0)) for (const e of enemies) if (!e.dead && !e.isBoss && d2(e.x, e.y, t.x, t.y) < 400 * 400) { e.tgt = alive[randi(0, alive.length - 1)]; e.aggroT = 3; }
    }
    ring(P.x, P.y, '#ff9d6e', 100, 0.4);
  },
  detonate(id) {
    const alive = minions.filter(m => !m.dead);
    if (!alive.length) return fail(_L('Žiadni mínióni'));
    const pct = 300 * skDmg(id) / dmgBuff();
    G.dmgSrc = 'skill';
    for (const m of alive) { if (skMod(id, 0)) for (const e of enemies) if (!e.dead && d2(e.x, e.y, m.x, m.y) < 130 * 130) applySlow(e, 50, 3); minionBlow(m, pct); }
    G.dmgSrc = null;
    if (skMod(id, 1)) for (let i = 0; i < Math.ceil(alive.length / 2); i++) spawnMinion(P.x + rand(-40, 40), P.y + rand(-40, 40));
    if (P.stats.legend.lDeton) P.rebuild = { t: 3, n: alive.length };
    shake(6);
  },
  emergency(id) {
    const M = P.stats.minion;
    if (!M) return fail(_L('Žiadni mínióni'));
    if (M.titan) return fail(_L('Nie v režime Kolosa'));
    const n = skMod(id, 1) ? 5 : 3, elite = skMod(id, 0);
    for (let i = 0; i < n; i++) {
      const hp = P.stats.maxHull * M.hp * (elite ? 2 : 1), a = i / n * TAU;
      minions.push({ x: P.x + Math.cos(a) * 40, y: P.y + Math.sin(a) * 40, vx: 0, vy: 0, a, hp, maxHp: hp, r: elite ? 11 : 9, life: 15, fireT: rand(0.2, 0.6), titan: false, isMinion: true, dead: false, tgt: null, temp: true, dmgM: elite ? 2 : 1 });
    }
    ring(P.x, P.y, '#ff9d6e', 120, 0.5); burst(P.x, P.y, '#ff9d6e', 24, 260, 2, 0.5);
  },
  ring(id) {
    if (!minions.some(m => !m.dead)) return fail(_L('Žiadni mínióni'));
    P.ringT = skMod(id, 1) ? 6 : 4; P.ringReflect = skMod(id, 0); P.ringSafe = skMod(id, 1);
    ring(P.x, P.y, '#ffcf6e', 90, 0.5);
  }
};
// defer a callback until after the current cast set its cooldown
function setTimeout0(fn) { abil.after = fn; }

/* ---------- per-frame ---------- */
function updateAbilities(dt) {
  if (!P.skCd) resetAbilities();
  const s = P.stats, D = dodgeDef();
  if (input.dodge) { input.dodge = false; if (G.mode === 'play') useDodge(); }
  for (let i = 0; i < 2; i++) if (input.skill[i]) { input.skill[i] = false; if (G.mode === 'play') castSkill(i); }
  if (abil.after) { const f = abil.after; abil.after = null; f(); }
  // auto-cast when an enemy is close (lazy play)
  if (G.autoSkill && !G.safe && (G.autoSkT = (G.autoSkT || 0) - dt) <= 0) {
    G.autoSkT = 0.35;
    if (enemies.some(e => !e.dead && d2(e.x, e.y, P.x, P.y) < 450 * 450)) for (let i = 0; i < 2; i++) castSkill(i, true);
  }
  for (const k in P.skCd) P.skCd[k] -= dt;
  const maxCh = dodgeCharges();
  if (P.dodgeCh < maxCh) { P.dodgeCd -= dt; if (P.dodgeCd <= 0) { P.dodgeCh++; P.dodgeCd = P.dodgeCh < maxCh ? dodgeCd() : 0; } }
  else { P.dodgeCh = maxCh; P.dodgeCd = 0; }
  P.invulnT -= dt; P.drT -= dt; P.magT -= dt; P.orderT -= dt; P.hasteT -= dt; P.critT -= dt; P.ringT -= dt;
  if (P.stormT > 0) P.stormT -= dt;
  // ram / surge: shove enemies out of the way
  if (P.ramT > 0) {
    P.ramT -= dt;
    const sp = Math.hypot(P.vx, P.vy) || 1, nx = P.vx / sp, ny = P.vy / sp, id = P.ramSkill;
    G.dmgSrc = 'skill';
    for (const e of enemies) {
      if (e.dead || P.ramHit.has(e) || d2(e.x, e.y, P.x, P.y) > (e.r + 44) ** 2) continue;
      P.ramHit.add(e);
      if (!e.isBoss) { e.x += nx * 80; e.y += ny * 80; }
      applySlow(e, 60, id ? 1.5 : 0.8);
      damageEnemy(e, s.laserHit * P.ramPow * dmgBuff(), false);
      if (id && skMod(id, 0)) P.oshield = Math.min(s.maxShield * 0.5, (P.oshield || 0) + s.maxShield * 0.15);
    }
    G.dmgSrc = null;
    particles.push({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 7, color: id ? '#9fd0ff' : '#b48cff', drag: 0 });
    if (P.ramT <= 0 && id && skMod(id, 1)) { fxSplash(P.x, P.y, 170, s.laserHit * 2 * skDmg(id), '#9fd0ff'); shake(4); }
  }
  // thrown asteroids (Traktorový vrh)
  for (const a of asteroids) {
    if (!a.thrown || a.dead) continue;
    a.thrown -= dt;
    let hit = a.thrown <= 0;
    for (const e of enemies) if (!e.dead && d2(e.x, e.y, a.x, a.y) < (e.r + a.r) ** 2) { hit = true; break; }
    particles.push({ x: a.x, y: a.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 4, color: '#5be09a', drag: 0 });
    if (hit) {
      fxSplash(a.x, a.y, 90 + a.r, a.hurlDmg || s.laserHit * 5, '#5be09a');
      if (a.split) for (let i = 0; i < 3; i++) { const g = i / 3 * TAU; fxSplash(a.x + Math.cos(g) * 110, a.y + Math.sin(g) * 110, 70, (a.hurlDmg || 0) * 0.5, '#c8a27c'); }
      burst(a.x, a.y, '#c8a27c', 30, 320, 2.6, 0.6); shake(5);
      a.thrown = 0; a.vx = 0; a.vy = 0; breakAsteroid(a);
    }
  }
  // clones
  for (const key of ['clone', 'clone2']) {
    const C = abil[key]; if (!C) continue;
    C.t -= dt; C.fireT -= dt;
    let t = null, b = 520 * 520;
    for (const e of enemies) { if (e.dead || e.shielded) continue; const dd = d2(e.x, e.y, C.x, C.y); if (dd < b) { b = dd; t = e; } }
    if (t) {
      C.a = Math.atan2(t.y - C.y, t.x - C.x);
      if (C.fireT <= 0) { C.fireT = 1 / Math.max(1, s.fireRate); bullets.push({ x: C.x, y: C.y, px: C.x, py: C.y, vx: Math.cos(C.a) * 980, vy: Math.sin(C.a) * 980, dmg: C.dmg, crit: false, life: 0.7, w: 2, color: '#b48cff', bubble: false, quietHit: true }); }
    }
    if (C.t <= 0) {
      C.dead = true; abil[key] = null;
      if (C.boom) { fxSplash(C.x, C.y, 170, C.boomDmg, '#b48cff'); burst(C.x, C.y, '#b48cff', 30, 320, 2.4, 0.5); shake(4); }
    }
  }
  // orbital shells
  for (const sh of abil.shells) {
    sh.t -= dt;
    if (sh.t <= 0) { fxSplash(sh.x, sh.y, 110, sh.dmg, '#ffb35c', sh.stun ? 70 : 0); burst(sh.x, sh.y, '#ffb35c', 26, 340, 2.6, 0.5); burst(sh.x, sh.y, '#fff3d6', 10, 160, 2, 0.3); shake(4); }
  }
  abil.shells = abil.shells.filter(sh => sh.t > 0);
  // gravity wells
  for (const w of abil.wells) {
    w.t -= dt;
    for (const e of enemies) {
      if (e.dead || d2(e.x, e.y, w.x, w.y) > w.r * w.r) continue;
      e.vulnT = G.time + 0.3;
      if (!e.isBoss) { const dx = w.x - e.x, dy = w.y - e.y, d = Math.hypot(dx, dy) || 1, pull = Math.min(d, 240 * dt); e.x += dx / d * pull; e.y += dy / d * pull; }
    }
    if (Math.random() < 0.6) { const a = rand(0, TAU), r = rand(w.r * 0.4, w.r); particles.push({ x: w.x + Math.cos(a) * r, y: w.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 1.5, vy: -Math.sin(a) * r * 1.5, life: 0.5, max: 0.5, size: 2, color: '#9a8cff', drag: 0 }); }
    if (w.pulse && (w.pt -= dt) <= 0) { w.pt = 1; fxSplash(w.x, w.y, w.r * 0.6, w.pulse, '#9a8cff'); }
    if (w.t <= 0 && w.boom) { fxSplash(w.x, w.y, w.r * 0.7, w.boom, '#c9b8ff'); burst(w.x, w.y, '#9a8cff', 40, 420, 2.8, 0.6); shake(6); }
  }
  abil.wells = abil.wells.filter(w => w.t > 0);
  // ore waves
  for (const w of abil.waves) {
    w.r += 700 * dt;
    if (w.r <= 0) continue;
    G.dmgSrc = 'skill';
    for (const e of enemies) if (!e.dead && !w.hit.has(e) && d2(e.x, e.y, w.x, w.y) < (w.r + e.r) ** 2) { w.hit.add(e); damageEnemy(e, w.dmg, false); }
    G.dmgSrc = null;
    if (!w.rang) { w.rang = true; ring(w.x, w.y, '#ffd36b', w.max, 0.5); }
  }
  abil.waves = abil.waves.filter(w => w.r < w.max);
  // mines
  const newMines = [];
  for (const m of abil.mines) {
    m.t -= dt; m.arm -= dt;
    const f = Math.pow(0.05, dt); m.vx *= f; m.vy *= f;
    if (m.seek && m.arm <= 0) { const e = nearMouseEnemy(260, m); if (e) { const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) || 1; m.vx = dx / d * 220; m.vy = dy / d * 220; } }
    m.x += m.vx * dt; m.y += m.vy * dt;
    if (m.arm <= 0 && enemies.some(e => !e.dead && d2(e.x, e.y, m.x, m.y) < (e.r + 70) ** 2)) {
      m.t = 0; fxSplash(m.x, m.y, m.mini ? 70 : 110, m.dmg, '#ffd36b'); burst(m.x, m.y, '#ffd36b', m.mini ? 10 : 20, 280, 2.2, 0.4); shake(m.mini ? 1 : 2);
      if (!m.mini && s.legend.lMines) for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + rand(-0.3, 0.3); newMines.push({ x: m.x, y: m.y, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, arm: 0.35, t: 8, dmg: m.dmg * 0.4, seek: m.seek, mini: true }); }
    }
  }
  abil.mines = abil.mines.filter(m => m.t > 0).concat(newMines);
  // eruption echoes (Srdce sopky)
  for (const e of abil.echoes) { e.t -= dt; if (e.t <= 0) { fxSplash(P.x, P.y, e.r, e.dmg, '#c29bff'); burst(P.x, P.y, '#c29bff', 24, e.r * 2, 2.2, 0.5); shake(3); } }
  abil.echoes = abil.echoes.filter(e => e.t > 0);
  // Fénixova linka: rebuild detonated minions
  if (P.rebuild && (P.rebuild.t -= dt) <= 0) { for (let i = 0; i < P.rebuild.n; i++) spawnMinion(P.x + rand(-50, 50), P.y + rand(-50, 50)); P.rebuild = null; }
}
// kills while a storm rages extend it (Nekonečná búrka)
function abilityOnKill() {
  if (P.stormT > 0 && P.stormExt > 0) { P.stormT += 0.5; P.stormExt -= 0.5; }
  if (P.stats.legend.lChrono && P.skCd) for (const k in P.skCd) P.skCd[k] -= 0.3;
}

/* ---------- drawing (world space) ---------- */
function drawAbilityFx() {
  for (const C of [abil.clone, abil.clone2]) {
    if (!C) continue;
    ctx.save(); ctx.globalAlpha = 0.45 + 0.15 * Math.sin(G.time * 12);
    drawShip(ctx, P.cls, C.x, C.y, C.a, 1, false, 0, '#b48cff');
    ctx.restore();
  }
  for (const sh of abil.shells) {
    const k = clamp(1 - sh.t, 0, 1);
    ctx.strokeStyle = '#ffb35c'; ctx.globalAlpha = 0.4 + 0.5 * k; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sh.x, sh.y, 110 * (1 - k * 0.7), 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sh.x - 10, sh.y); ctx.lineTo(sh.x + 10, sh.y); ctx.moveTo(sh.x, sh.y - 10); ctx.lineTo(sh.x, sh.y + 10); ctx.stroke();
  }
  for (const w of abil.wells) {
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#1a1240'; ctx.beginPath(); ctx.arc(w.x, w.y, 34, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.6; ctx.strokeStyle = '#9a8cff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(w.x, w.y, 30 + 6 * Math.sin(G.time * 8), 0, TAU); ctx.stroke();
  }
  for (const w of abil.waves) {
    if (w.r <= 0) continue;
    ctx.globalAlpha = 0.8 * (1 - w.r / w.max); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, TAU); ctx.stroke();
  }
  for (const m of abil.mines) {
    ctx.globalAlpha = m.arm > 0 ? 0.5 : 1; ctx.fillStyle = '#2a2208'; ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.mini ? 4 : 6, 0, TAU); ctx.fill(); ctx.stroke();
    if (m.arm <= 0 && Math.sin(G.time * 10) > 0) { ctx.fillStyle = '#ff6b5a'; ctx.fillRect(m.x - 1.5, m.y - 1.5, 3, 3); }
  }
  if (P.ringT > 0) { ctx.globalAlpha = 0.35; ctx.strokeStyle = '#ffcf6e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P.x, P.y, 52, 0, TAU); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
