'use strict';
/* =====================================================================
   2. LOOT GENERATOR
   ===================================================================== */
let ITEM_ID = 1;
const RARITY_TABLES = [
  { common: 48, magic: 38, rare: 13.7, legendary: 0.3 },   // normal (balance v2: fewer whites, rarer legendaries)
  { common: 26, magic: 44, rare: 29, legendary: 1 },   // tough enemy / crystal / container
  { magic: 37, rare: 60, legendary: 3 }                    // elite / boss
];
function rollRarity(tier) {
  const t = { ...RARITY_TABLES[tier] };
  if (G && t.legendary) t.legendary *= TIERS[G.tier].leg * (nmK() ? 1 + nmK() * 0.04 : 1);
  const r = weighted(t);
  return r === 'legendary' && P && P.level < 5 ? 'rare' : r;   // the first legendary comes from the first boss
}

// primal items: Void Climb floor 30+, nightmare gates 50+ on world tier IV, Architect on world tier IV
function primalChance() {
  if (!G) return 0;
  if (G.forcePrimal) return 1;
  const D = G.dungeon;
  if (D && D.climb && D.floor >= 30) return 0.05 + 0.005 * (D.floor - 30);
  if (G.tier >= 4 && nmK() >= 50) return 0.05 + 0.002 * (nmK() - 50);
  return 0;
}
// ancestral items (+20 % to every value) and greater affixes ✦ (one line ×1.5, like Diablo IV)
const starMult = it => it.anc && it.rarity !== 'mythic' ? 1.2 : 1;
const gaN = it => (it.affixes || []).filter(a => a.greater).length;
const gaExtra = it => Math.max(0, gaN(it) - (it.rarity === 'mythic' ? 1 : 0));   // a mythic's first greater affix is guaranteed
const starMark = it => { const n = gaN(it); return (it.anc ? `<span class="ancc" title="${_L('Pradávny')}"></span>` : '') + (n ? `<span class="ancm g${Math.min(3, gaExtra(it))}" title="${n}× ${_L('väčší afix')}">${'✦'.repeat(n)}</span>` : ''); };
// rarity also by shape (◇ ◆ ★ ❖ ✹), not only by colour
const rarMark = it => RARITY[it.rarity].mark ? `<i class="rmark" aria-hidden="true">${RARITY[it.rarity].mark}</i>` : '';
const gaCls = it => gaExtra(it) >= 2 ? 'st' + Math.min(3, gaExtra(it)) : '';
// chance per affix line to roll greater: world II 1,5 %, III 4 %, IV 8 % (+ nightmare level, climb floor, arena); rares half
function gaChance(rarity) {
  if (!G || rarity === 'common' || rarity === 'magic') return 0;
  const D = G.dungeon;
  let c = [0, 0, 0.015, 0.04, 0.08][G.tier] + nmK() * 0.0005 + (D && D.climb ? Math.min(0.03, D.floor * 0.001) : 0) + (D && D.rush ? 0.01 : 0);
  if (rarity === 'rare') c *= 0.5;
  if (seasonMod('greater')) c *= 2;
  return Math.min(0.2, c);
}
const gaRerollChance = it => RARITY[it.rarity].rank >= 2 ? Math.max(it.rarity === 'rare' ? 0.01 : 0.02, gaChance(it.rarity)) : 0;
function generateItem(ilvl, rarity, slot, type, legendId) {
  let ldef = null;
  if (rarity === 'mythic') {
    if (legendId) ldef = LEGEND_INDEX[legendId];
    else { const pool = MYTHIC_LIST.filter(m => !slot || !m.slot || m.slot === slot); ldef = pick(pool.length ? pool : MYTHIC_LIST); }
    if (ldef.slot) slot = ldef.slot;
  }
  let setB = null;
  if (rarity === 'set') {
    const cls = P && TREES[P.cls] ? P.cls : 'interceptor';
    setB = legendId && TBRANCH[cls + ':' + legendId] ? TBRANCH[cls + ':' + legendId] : pick(TREES[cls]);
    slot = slot && SET_SLOTS.includes(slot) ? slot : pick(SET_SLOTS);
  }
  slot = slot || pick(SLOT_ORDER);
  if (rarity === 'legendary') {
    if (legendId) ldef = LEGEND_INDEX[legendId];
    else ldef = pick(LEGEND_POOL.filter(l => l.slot === slot && (!l.cls || !P || l.cls === P.cls)));
  }
  const S = SLOTS[slot];
  type = type || pick(Object.keys(S.types));
  const T = S.types[type], R = RARITY[rarity], myth = rarity === 'mythic';
  // ancestral (pradávny): +20 % to every value, rolls only on higher world tiers
  const primal = !myth && (rarity === 'legendary' || rarity === 'set') && Math.random() < primalChance();
  const anc = myth || primal || ((rarity === 'rare' || rarity === 'legendary' || rarity === 'set') && !!G && Math.random() < Math.min(0.6, TIERS[G.tier].anc + nmK() * 0.01));
  const ancM = anc && !myth ? 1.2 : 1;
  // primal: an ancestral legendary or set piece with every roll at its maximum
  const maxed = myth || primal;
  const stats = {};
  for (const k in T) {
    if (k === 'name') continue;
    let v = T[k];
    if (typeof v === 'number' && SCALE_KEYS.has(k)) {
      const lv = (k === 'speed' || k === 'dodge') ? 1 + 0.04 * (ilvl - 1) : 1 + 0.15 * (ilvl - 1);
      v = Math.round(v * lv * R.baseMult * ancM * (maxed ? 1.08 : rand(0.92, 1.08)) * 10) / 10;
    }
    else if (typeof v === 'number' && SLOW_KEYS.has(k)) v = Math.round(v * (1 + 0.012 * (ilvl - 1)) * R.baseMult * ancM * (maxed ? 1.08 : rand(0.92, 1.08)) * 10) / 10;
    stats[k] = v;
  }
  const pool = AFFIX_ORDER.filter(k => AFFIXES[k].slots.includes(slot));
  for (let i = pool.length - 1; i > 0; i--) { const j = randi(0, i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const n = randi(R.affixes[0], R.affixes[1]);
  const affixes = [];
  for (let i = 0; i < n && i < pool.length; i++) {
    const A = AFFIXES[pool[i]];
    let v = (maxed ? A.range[1] : rand(A.range[0], A.range[1])) * (A.slow ? 1 + 0.012 * (ilvl - 1) : 1 + 0.05 * (ilvl - 1)) * ancM;
    if (rarity === 'legendary' || rarity === 'set' || myth) v *= 1.15;
    affixes.push({ key: pool[i], val: Math.max(1, Math.round(v)) });
  }
  if (myth && affixes.length) { const g = affixes[randi(0, affixes.length - 1)]; g.val = Math.round(g.val * 1.5); g.greater = true; }
  // greater affixes: each remaining line has a small chance (forceGA for tests)
  const gc = gaChance(rarity), fg = G && G.forceGA;
  affixes.forEach((a, i) => { if (!a.greater && (fg ? i < fg : Math.random() < gc)) { a.val = Math.round(a.val * 1.5); a.greater = true; } });
  affixes.sort((a, b) => AFFIX_ORDER.indexOf(a.key) - AFFIX_ORDER.indexOf(b.key));
  // +ranks to one talent of the pilot's ship
  let tal = null;
  const tcls = P && TREES[P.cls] ? P.cls : null, tch = { rare: 0.15, legendary: 0.35, set: 0.35, mythic: 0.5 }[rarity] || 0;
  if (tcls && Math.random() < tch) {
    const n = pick(TREES[tcls].flatMap(B => B.nodes));
    tal = { cls: tcls, id: n.id, v: myth ? randi(2, 3) : rarity === 'legendary' ? randi(1, 2) : 1 };
  }
  let name = T.name;
  if (rarity === 'magic') name = `${T.name} ${AFFIXES[affixes[0].key].suffix}`;
  else if (rarity === 'rare') name = `${pick(RARE_PREFIX)} ${pick(RARE_NOUN[slot])}`;
  else if (ldef) name = ldef.name;
  else if (setB) name = `${setName(setB.id)} · ${SET_NOUN[slot]}`;
  if (primal) name = '✶ ' + name;
  return { id: ITEM_ID++, slot, type, typeName: T.name, rarity, ilvl, stats, affixes, anc, primal: primal || undefined,
           legend: ldef ? ldef.id : null, name, upg: 0, tal, set: setB ? setB.id : undefined, setCls: setB ? setB.B ? setB.cls : setB.cls : undefined };
}
function starLabel(it) {
  const n = gaN(it);
  return (it.anc && it.rarity !== 'mythic' ? _L('<span class="anc">Pradávny</span> · ') : '') + (n ? `<span class="anc ga">${'✦'.repeat(n)} ${n === 1 ? _L('väčší afix') : n + _L(' väčšie afixy')}</span> · ` : '');
}
const shardsFor = it => SHARDS_FOR[RARITY[it.rarity].rank] + 3 * gaExtra(it);
const salvageValue = it => Math.round([4, 10, 24, 60, 200][RARITY[it.rarity].rank] * (1 + 0.15 * (it.ilvl - 1)) * (1 + 0.3 * it.upg) * (1 + 0.25 * gaExtra(it)));
// ore prices grow faster for item level 21+ (ore income scales with the zone, early game unchanged)
const lateCost = il => il > 20 ? 1 + (il - 20) * 0.08 : 1;
const upgradeCost = it => Math.round(lateCost(it.ilvl) * costDisc() * 25 * Math.pow(it.upg + 1, 1.6) * (1 + 0.1 * (it.ilvl - 1)) * [1, 1.3, 1.7, 2.4, 3.2][RARITY[it.rarity].rank]);
const gambleCost = () => Math.round(costDisc() * 70 * (1 + 0.15 * (P.level + TIERS[G.tier].lvl - 1)));
const MAX_UPG = 5;
