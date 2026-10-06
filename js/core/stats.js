'use strict';
/* =====================================================================
   3. STATS — single source of truth for gameplay and tooltip comparison
   ===================================================================== */
function computeStats(clsKey, equip, tal, level, para) {
  const c = CLASSES[clsKey];
  const s = {
    // the hull and the class's own shield grow with pilot level so defense keeps pace with enemy damage
    maxHull: c.hull * (1 + 0.07 * (level - 1)), maxShield: c.shield * (1 + 0.05 * (level - 1)), shieldRegen: 2, shieldDelay: 3,
    speed: c.speed, accel: c.accel, dodge: c.dodge, crit: c.crit, critMult: 1.8,
    laserBase: 3, fireRate: 4 * c.fireMult,
    missileBase: 10, missileCd: 3, missileCount: 1, homing: true, missileRadius: 60,
    magnet: c.magnet, xpMult: 1 + (c.xpBonus || 0) / 100, mineShield: !!c.mineShield, legend: {}, mres: {}, eliteDmg: 0
  };
  const p = { atkSpd: 0, allDmg: 0, laser: 0, missile: 0, yield: c.yieldBonus || 0, crit: 0, shield: 0, hull: 0, speed: 0, area: 0, skCdr: 0, skDmg: 0 };
  const acc = { cdr: 0, regen: 0, fr: 0, dr: 0 };
  s.drones = null;
  for (const slot of SLOT_ORDER) {
    const it = equip[slot]; if (!it) continue;
    const up = 1 + 0.1 * it.upg, b = it.stats;
    if (b.laserBase != null) s.laserBase = b.laserBase * up;
    if (b.fireRate != null) s.fireRate += b.fireRate;
    if (b.missileBase != null) {
      s.missileBase = b.missileBase * up; s.missileCd = b.missileCd; s.missileCount = b.missileCount;
      s.homing = b.homing; s.missileRadius = b.missileRadius;
    }
    if (b.shieldCap != null) { s.maxShield += b.shieldCap * up; s.shieldRegen += b.shieldRegen * up; }
    if (b.speed != null) { s.speed += b.speed * up; s.dodge += b.dodge * up; }
    if (b.cdr) acc.cdr += b.cdr * up;
    if (b.regenPct) acc.regen += b.regenPct * up;
    if (b.fireRatePct) acc.fr += b.fireRatePct * up;
    if (b.hullFlat) s.maxHull += b.hullFlat * up;
    if (b.dr) acc.dr += b.dr * up;
    if (b.droneKind) s.drones = { kind: b.droneKind, count: b.droneCount, dmg: (b.droneDmg || 0) * up, repair: (b.repairPct || 0) * up };
    for (const g of it.sockets || []) if (g) p[GEMS[g.t].stat] += GEMS[g.t].vals[g.q];
    for (const a of it.affixes) p[a.key] += a.val;
    if (it.legend) s.legend[it.legend] = true;
    if (it.rarity === 'mythic' && it.legend) s.mres[it.legend] = it.res || 0;
  }
  // per-ship talent tree (ranks include bonuses from gear)
  const tx = talentValues(clsKey, equip, tal || {}), X = id => tx[id] || 0;
  s.tx = tx;
  for (const id in tx) { const n = TNODE[id]; if (n.fx) n.fx(s, p, acc, tx[id]); }
  if (X('kRhythm')) s.critMult += 0.2;
  if (X('kSalvo')) s.missileCount += 1;
  if (X('kUnbroken')) acc.dr += 10;
  if (X('kGhost')) s.dodge += 10;
  s.oreMult = 1 + X('sProfit') / 100;
  s.droneRate = 1 + X('sSync') / 100;
  if (s.drones) { s.drones.count += X('sBay') + (X('kHive') ? 2 : 0); s.drones.dmg *= 1 + X('sCore') / 100; }
  if (c.minions) {
    const titan = !!X('kTitan');
    s.minion = { max: titan ? 1 : 4 + X('cHangar') + (X('kArmy') ? 3 : 0),
      chance: Math.min(1, (0.35 + (X('cBuild') + X('cNecro')) / 100) * (X('kAltar') ? 2 : 1)), army: !!X('kArmy'),
      dmgMul: 1 + (X('cFab') + X('cHydr') + X('cShort')) / 100,
      hp: 0.25 * (1 + (X('cArmor') + X('cFrame')) / 100) * (titan ? 8 : 1),
      rate: 1.25 * (1 + X('cCoord') / 100), life: 30 * (1 - X('cShort') / 100), titan, altar: !!X('kAltar') };
    s.minion.dmg = 0.45 * s.minion.dmgMul * (titan ? 8 : 1);
  } else s.minion = null;
  // build sets
  const setN = {}, sx = { all: 1, laser: 1, missile: 1, cd: 1, aura: 1, mp: 1 };
  for (const sl of SLOT_ORDER) { const it = equip[sl]; if (it && it.set && it.setCls === clsKey) setN[it.set] = (setN[it.set] || 0) + 1; }
  s.sets = setN;
  for (const id in setN) { if (setN[id] >= 2) p.allDmg += 15; if (setN[id] >= 4 && SET4[id]) SET4[id].fx(s, sx, acc, p); }
  if (s.legend.magnetar) s.magnet *= 1.6;
  // paragon constellations
  const PA = para || (P && P.para);
  if (PA) {
    const c = k => paraCounts((PA.alloc || {})[k] || 0);
    let x = c('forge');    p.allDmg += 3 * x.N; p.laser += 8 * x.M; p.missile += 8 * x.M; if (x.S) { p.allDmg += 10; s.critMult += 0.25; }
    x = c('warden');       p.hull += 4 * x.N; p.shield += 3 * x.N; acc.dr += 3 * x.M; if (x.S) { acc.dr += 8; acc.regen += 30; }
    x = c('hunter');       p.crit += x.N; s.eliteDmg += 10 * x.M; if (x.S) { p.crit += 5; s.eliteDmg += 20; s.critMult += 0.1; }
    x = c('wayfarer');     p.speed += 2 * x.N; p.yield += 5 * x.N; s.magnet += 25 * x.M; s.xpMult += 0.05 * x.M; if (x.S) { p.speed += 10; s.dodge += 5; s.xpMult += 0.2; }
    p.allDmg += PA.inf || 0; p.hull += PA.inf || 0;
    for (const b in PA.runes || {}) { const r = PA.runes[b], L = (PA.rl || {})[r]; if (r && L && RUNES[r]) RUNES[r].fx(L, ((PA.alloc || {})[b] || 0) >= RUNE_ON, p, s, acc); }
  }
  s.miningPower = (1 + p.yield / 100 * 0.6 + X('sDrill') / 100) * sx.mp;
  s.convDmg = X('sConv') / 100 * (s.miningPower - 1) * 100;
  p.allDmg += s.convDmg;
  s.areaPct = Math.min(100, p.area);
  s.skCdr = Math.min(40, p.skCdr); s.skDmg = p.skDmg;
  s.fireRate = Math.max(0.8, s.fireRate) * (1 + p.atkSpd / 100);
  s.missileCd = s.missileCd / (1 + p.atkSpd / 200) * (1 - Math.min(50, acc.cdr) / 100) * sx.cd;
  s.fireRate *= 1 + acc.fr / 100;
  s.shieldRegen *= 1 + acc.regen / 100;
  s.dr = Math.min(50, acc.dr);
  if (s.drones && s.legend.swarmlord) s.drones.count += 2;
  s.crit = Math.min(75, s.crit + p.crit);
  s.dodge = Math.min(60, s.dodge);
  s.maxShield *= 1 + p.shield / 100;
  s.maxHull *= 1 + p.hull / 100;
  s.speed *= 1 + p.speed / 100;
  if (X('iSpeedCore')) { s.speedDmg = X('iSpeedCore') * s.speed / 50; p.allDmg += s.speedDmg; }
  s.allMult = (1 + p.allDmg / 100) * sx.all;
  s.laserMult = (1 + (p.allDmg + p.laser) / 100) * sx.all * sx.laser;
  s.missileMult = (1 + (p.allDmg + p.missile) / 100) * sx.all * sx.missile;
  s.yieldMult = 1 + p.yield / 100;
  s.pct = p;
  const critF = 1 + s.crit / 100 * (s.critMult - 1);
  s.laserHit = s.laserBase * s.laserMult;
  // the aura scales with the weapon so it stays relevant with endgame gear
  s.aura = c.aura ? { r: c.aura.r * (1 + X('jField') / 100) * (X('kCorona') ? 1.25 : 1),
    dps: Math.max(c.aura.dps * (1 + 0.12 * (level - 1)) * s.allMult, s.laserHit * 1.5) * (1 + X('jAura') / 100) * (X('kCorona') ? 1.6 * critF : 1) * sx.aura } : null;
  s.laserDps = s.laserHit * s.fireRate * critF * (s.legend.prism ? 2.2 : 1);
  s.missileHit = s.missileBase * s.missileMult;
  return s;
}
const SUMMARY = [
  ['laserDps', _L('Laser DPS'), 1, v => fmtN(v)],
  ['missileHit', _L('Poškodenie rakety'), 1, v => fmtN(v)],
  ['missileCd', _L('Nabíjanie rakiet'), -1, v => v.toFixed(2) + ' s'],
  ['maxShield', _L('Štít'), 1, v => fmtN(v)],
  ['shieldRegen', _L('Obnova štítu'), 1, v => fmtN(v) + '/s'],
  ['maxHull', _L('Trup'), 1, v => fmtN(v)],
  ['dr', _L('Redukcia poškodenia'), 1, v => fmtN(v) + ' %'],
  ['speed', _L('Rýchlosť'), 1, v => Math.round(v)],
  ['dodge', _L('Úhyb'), 1, v => (Math.round(v * 10) / 10) + ' %'],
  ['crit', _L('Kritická šanca'), 1, v => (Math.round(v * 10) / 10) + ' %'],
  ['yieldMult', _L('Výnos ťažby'), 1, v => '×' + v.toFixed(2)],
  ['miningPower', _L('Ťažobná sila'), 1, v => '×' + v.toFixed(2)],
  ['areaPct', _L('Plošné poškodenie'), 1, v => Math.round(v) + ' %'],
  ['skDmg', _L('Poškodenie schopností'), 1, v => '+' + Math.round(v) + ' %'],
  ['skCdr', _L('Skrátenie cooldownov'), 1, v => Math.round(v) + ' %']
];
