'use strict';
/* ---------- inventory ---------- */
const gearScore = s => s.laserDps + s.missileHit / s.missileCd + s.maxShield * 0.25 + s.maxHull * 0.2 + s.shieldRegen * 1.5 + s.speed * 0.1 + s.dodge * 1.5 + (s.yieldMult - 1) * 30;
const statsWith = it => computeStats(P.cls, { ...P.equip, [it.slot]: it }, P.tal, P.level);
// 2 = better right now, 1 = better once upgraded like the equipped item (with its gems moved over), 0 = not better
function upgradeState(it) {
  const base = gearScore(P.stats) * 1.01;
  if (gearScore(statsWith(it)) > base) return 2;
  const pot = potentialOf(it);
  return (pot.upg > it.upg || pot.moved) && gearScore(statsWith(pot.item)) > base ? 1 : 0;
}
// the item as it would be after upgrading it to the equipped item's level and moving the equipped gems into it
function potentialOf(it) {
  const eq = P.equip[it.slot], upg = Math.max(it.upg, eq === it ? 0 : eq.upg);
  const own = (it.sockets || []).filter(Boolean), carry = eq === it ? [] : (eq.sockets || []).filter(Boolean);
  const maxS = MAX_SOCKETS[RARITY[it.rarity].rank], have = (it.sockets || []).length;
  const n = Math.max(have, Math.min(maxS, own.length + carry.length));
  const sockets = own.concat(carry).slice(0, n);
  while (sockets.length < n) sockets.push(null);
  return { item: { ...it, upg, sockets }, upg, drill: n - have, moved: Math.max(0, Math.min(carry.length, n - own.length)) };
}
function potentialCost(it, pot) {
  const t = { ...it };
  let ore = 0, sh = 0;
  while (t.upg < pot.upg) { const c = t.upg < 5 ? { ore: upgradeCost(t), sh: 0 } : temperCost(t); ore += c.ore; sh += c.sh || 0; t.upg++; }
  let k = (it.sockets || []).length;
  for (let i = 0; i < pot.drill; i++, k++) { ore += 60 * (k + 1); sh += 3 * (k + 1); }
  return { ore, sh };
}
function returnGems(it) {
  let n = 0;
  for (const g of it.sockets || []) if (g) { P.gems[g.t][g.q]++; n++; }
  if (n) it.sockets = it.sockets.map(() => null);
  return n;
}
function renderInventory() {
  const s = P.stats;
  $('eslots').innerHTML = SLOT_ORDER.map(slot => {
    const it = P.equip[slot], col = RARITY[it.rarity].color;
    const upTxt = it.upg >= MAX_UPG ? _L('Max. vylepšenie') : _T`Vylepšiť: ${upgradeCost(it)} rudy`;
    return _T`<button type="button" class="eslot" data-slot="${slot}" style="--rc:${col}">
      <span class="ico">${ICONS[slot]}</span>
      <span><span class="eyebrow">${SLOTS[slot].name}</span><b>${it.name}${it.upg ? ' +' + it.upg : ''}</b><small>iLvl ${it.ilvl} · ${upTxt}</small></span>
    </button>`;
  }).join('');
  $('sheet').innerHTML = SUMMARY.map(([k, label, , f]) => `<dt>${label}</dt><dd>${f(s[k])}</dd>`).join('')
    + _T`<dt>Všetko poškodenie</dt><dd>+${Math.round(s.pct.allDmg)} %</dd><dt>Dosah magnetu</dt><dd>${Math.round(s.magnet)}</dd>`
    + (s.aura ? _T`<dt>Aura DPS</dt><dd>${fmtN(s.aura.dps)}</dd>` : '')
    + (s.minion ? _T`<dt>Minióni</dt><dd>${s.minion.titan ? _L('Kolos') : 'max ' + s.minion.max} · ${fmtN(s.laserHit * s.minion.dmg)}/zásah</dd>` : '');
  $('invCap').textContent = `${P.inv.length}/30`;
  $('invOre').textContent = P.ore;
  $('invKeys').textContent = `${P.keys.length}/20`;
  $('invShards').textContent = P.shards;
  renderSalvBar();
  let html = '';
  for (let i = 0; i < 30; i++) {
    const it = P.inv[i];
    if (!it) { html += '<div class="cell"></div>'; continue; }
    html += `<button type="button" class="cell item ${it.rarity} ${it.primal ? 'primal' : ''} ${gaCls(it)}" data-idx="${i}" style="--rc:${RARITY[it.rarity].color}" aria-label="${it.name}">${qBar(it)}${ICONS[it.slot]}<span class="il">${it.ilvl}</span>${starMark(it)}${betterMark(upgradeState(it))}</button>`;
  }
  $('grid').innerHTML = html;
}

// value ranges for an item's rolls, the quality of each roll and build-aware advice
const ROLL_MULT = r => (r === 'legendary' || r === 'set' || r === 'mythic') ? 1.15 : 1;
function affixRange(it, key, greater) {
  const A = AFFIXES[key], myth = it.rarity === 'mythic';
  const sc = (A.slow ? 1 + 0.012 * (it.ilvl - 1) : 1 + 0.05 * (it.ilvl - 1)) * starMult(it) * ROLL_MULT(it.rarity) * (greater ? 1.5 : 1);
  return [Math.max(1, Math.round(A.range[0] * sc)), Math.max(1, Math.round(A.range[1] * sc))];
}
function baseRange(it, k) {
  const T = SLOTS[it.slot].types[it.type]; if (!T || typeof T[k] !== 'number') return null;
  const R = RARITY[it.rarity], ancM = starMult(it);
  let c;
  if (SCALE_KEYS.has(k)) c = T[k] * ((k === 'speed' || k === 'dodge') ? 1 + 0.04 * (it.ilvl - 1) : 1 + 0.15 * (it.ilvl - 1)) * R.baseMult * ancM;
  else if (SLOW_KEYS.has(k)) c = T[k] * (1 + 0.012 * (it.ilvl - 1)) * R.baseMult * ancM;
  else return null;
  return [c * 0.92, c * 1.08];
}
const rollQ = (v, r) => r[1] - r[0] < 0.01 ? 1 : clamp((v - r[0]) / (r[1] - r[0]), 0, 1);
const qCol = q => q < 0.4 ? '#ff6b5a' : q < 0.8 ? '#ffd36b' : '#5be09a';
function itemQuality(it) {
  const qs = it.affixes.map(a => rollQ(a.val / Math.pow(1.25, a.mw || 0), affixRange(it, a.key, a.greater)));
  for (const k in it.stats) { const r = baseRange(it, k); if (r) qs.push(rollQ(it.stats[k], r)); }
  return qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : null;
}
function buildWish() {
  const T = TREES[P.cls];
  const key = T.find(B => P.tal[B.key.id]);
  const top = key || T.slice().sort((a, b) => branchSpent(b) - branchSpent(a))[0];
  const base = top && branchSpent(top) > 0 ? top.wish : ['allDmg', 'crit', 'atkSpd', 'area', 'laser', 'missile'];
  return base.concat(['skDmg', 'skCdr']);   // active skills are part of every build
}
function maxIlvlNow() {
  let t = 1; for (let k = G.maxTier; k >= 1; k--) if (P.level >= TIERS[k].req) { t = k; break; }
  return Math.min(P.level, LEVEL_CAP) + TIERS[t].lvl + 4;
}
function itemAdvice(it) {
  if (RARITY[it.rarity].rank < 2 || (it.setCls && it.setCls !== P.cls)) return '';
  const wish = buildWish(), out = [], mx = maxIlvlNow();
  if (it.ilvl < mx - 4) {
    const gain = Math.round(((1 + 0.05 * (mx - 1)) / (1 + 0.05 * (it.ilvl - 1)) - 1) * 100);
    out.push(['warn', _T`Farmi vyšší iLvl: teraz padá až iLvl ${mx}, afixy by boli o ~${gain} % silnejšie.`]);
  }
  if (it.rarity !== 'mythic') {
    const junk = it.affixes.filter(a => !a.greater && !wish.includes(a.key));
    if (junk.length) out.push(['bad', _T`Pretoč v dielni: ${junk.map(a => AFFIXES[a.key].label('').replace(/^\+%?\s*/, '')).join(', ')} (build ho nevyužíva).`]);
    const weak = it.affixes.filter(a => wish.includes(a.key) && rollQ(a.val, affixRange(it, a.key, a.greater)) < 0.4);
    if (weak.length) out.push(['warn', _T`Slabý hod: ${weak.map(a => AFFIXES[a.key].label('').replace(/^\+%?\s*/, '')).join(', ')}. Iný kus ho môže mať až o ${Math.round((affixRange(it, weak[0].key)[1] / Math.max(1, weak[0].val) - 1) * 100)} % vyšší.`]);
  }
  if (!out.length) out.push(['good', it.ilvl >= mx - 1 ? _L('Na maxime pre tvoj build a svet.') : _L('Dobrý kus pre tvoj build.')]);
  return _T`<div class="sec advice"><span class="eyebrow">Rada · build ${(TREES[P.cls].find(B => B.wish === wish) || { name: _L('všeobecný') }).name}</span>${out.map(([c, t]) => `<span class="${c}">${t}</span>`).join('')}</div>`;
}
const qBar = it => { if (RARITY[it.rarity].rank < 1) return ''; const q = itemQuality(it); return q == null ? '' : `<i class="qbar" style="width:${Math.round(q * 100)}%;background:${qCol(q)}"></i>`; };
const betterMark = st => st === 2 ? `<span class="better" title="${_L('Zlepšenie už teraz')}">▲</span>` : st === 1 ? `<span class="better pot" title="${_L('Zlepšenie po vylepšení na úroveň nasadeného predmetu')}">△</span>` : '';
function itemStatsHTML(it) {
  const up = 1 + 0.1 * it.upg;
  let h = '<div class="sec">';
  for (const k in it.stats) {
    const L = BASE_LABEL[k]; if (!L) continue;
    const v = SCALE_KEYS.has(k) || SLOW_KEYS.has(k) ? it.stats[k] * up : it.stats[k], r = baseRange(it, k);
    h += `<div class="kv"><span>${L[0]}</span><span>${L[1](v)}${r ? ` <em>${fmtN(r[0] * up)}–${fmtN(r[1] * up)}</em>` : ''}</span></div>`;
  }
  h += '</div>';
  if (it.affixes.length) h += '<div class="sec">' + it.affixes.map(a => {
    const r = affixRange(it, a.key, a.greater), q = rollQ(a.val / Math.pow(1.25, a.mw || 0), r);
    return `<div class="ar"><span class="aff ${a.greater ? 'gr' : ''}">${a.greater ? '✦ ' : ''}${AFFIXES[a.key].label(a.val)}${a.mw ? ` <span class="mw">★${a.mw > 1 ? '×' + a.mw : ''}</span>` : ''}</span><em>${r[0]}–${r[1]}</em><i class="qb"><b style="width:${Math.round(q * 100)}%;background:${qCol(q)}"></b></i></div>`;
  }).join('') + '</div>';
  if (it.tal && TNODE[it.tal.id]) {
    const n = TNODE[it.tal.id], ok = P && it.tal.cls === P.cls;
    h += _T`<div class="sec"><div class="aff tal ${ok ? '' : 'off'}">+${it.tal.v} ${it.tal.v === 1 ? _L('rank') : _L('ranky')} k talentu „${n.name}“ · ${n.B.name}${ok ? '' : ` (${CLASSES[it.tal.cls].name})`}</div></div>`;
  }
  if ((it.sockets || []).length) h += '<div class="sec">' + it.sockets.map(g => g ? `<div class="sock" style="color:${GEMS[g.t].color}">◆ ${gemName(g.t, g.q)}: +${GEMS[g.t].vals[g.q]}% ${GEMS[g.t].label}</div>` : _L('<div class="sock">◇ Prázdna pätica</div>')).join('') + '</div>';
  if (it.set && it.setCls) {
    const B = TBRANCH[it.setCls + ':' + it.set], own = P && P.cls === it.setCls, n = own ? (P.stats.sets[it.set] || 0) : 0;
    const have = sl => own && P.equip[sl] && P.equip[sl].set === it.set;
    h += _T`<div class="sec setb"><span class="eyebrow" style="color:${RARITY.set.color}">${setName(it.set)} · ${n}/4${own ? '' : ` · ${CLASSES[it.setCls].name}`}</span>
      <span>${SET_SLOTS.map(sl => `<span class="${have(sl) ? 'on' : 'off'}">${have(sl) ? '◆' : '◇'} ${SET_NOUN[sl]}</span>`).join(' · ')}</span>
      <span class="${n >= 2 ? 'on' : 'off'}">(2) +15 % Všetko poškodenie a +1 ku talentom vetvy ${B.name}</span>
      <span class="${n >= 4 ? 'on' : 'off'}">(4) ${SET4[it.set].t}</span></div>`;
  }
  if (it.legend) { const L = LEGEND_INDEX[it.legend]; h += `<div class="sec leg ${it.rarity === 'mythic' ? 'myth' : ''}">${it.res ? _T`<b style="color:var(--r-mythic)">Rezonancia ${it.res}/${RES_MAX} · sila +${it.res * 10} %</b><br>` : ''}${L.power}${L.skill && SKILLS[L.skill] ? _T`<span class="cls">Mení schopnosť: ${SKILLS[L.skill].name}${P && skState().sel.includes(L.skill) ? '' : _L(' · nemáš ju nasadenú')}</span>` : ''}${L.cls ? _T`<span class="cls">Triedny predmet: ${CLASSES[L.cls].name}</span>` : ''}</div>`; }
  return h;
}
function statRows(cur, next) {
  let rows = '';
  for (const [k, label, dir, f] of SUMMARY) {
    const a = cur[k], b = next[k];
    if (Math.abs(b - a) < 0.005 * Math.max(1, Math.abs(a))) continue;
    const better = (b - a) * dir > 0;
    rows += `<div class="kv"><span>${label}</span><span class="${better ? 'up' : 'dn'}">${f(a)} → ${f(b)} ${better ? '▲' : '▼'}</span></div>`;
  }
  return rows || _L('<div class="eq">Bez zmeny štatistík lode.</div>');
}
function compareHTML(it) {
  const cur = P.stats, eq = P.equip[it.slot];
  let h = _T`<div class="sec"><span class="eyebrow">Porovnanie s nasadeným · tak, ako je</span>
    <div class="eq">Nasadené: <span style="color:${RARITY[eq.rarity].color}">${eq.name}${eq.upg ? ' +' + eq.upg : ''}</span> · iLvl ${eq.ilvl}${(eq.sockets || []).some(Boolean) ? _T` · ${(eq.sockets || []).filter(Boolean).length} drahokamy` : ''}</div>
    ${statRows(cur, statsWith(it))}</div>`;
  if (eq === it) return h;
  const pot = potentialOf(it);
  if (pot.upg > it.upg || pot.moved) {
    const c = potentialCost(it, pot), st = gearScore(statsWith(pot.item)) > gearScore(cur) * 1.01;
    h += _T`<div class="sec pot"><span class="eyebrow">Po vylepšení na +${pot.upg}${pot.moved ? _T` · s ${pot.moved} presunutými drahokamami` : ''}</span>
      ${statRows(cur, statsWith(pot.item))}
      <div class="eq">Cena: ${c.ore} rudy${c.sh ? _T` · ${c.sh} úlomkov` : ''}${pot.drill ? _T` (vrátane ${pot.drill} ${pot.drill === 1 ? _L('pätice') : _L('pätíc')})` : ''} · ${st ? _L('<span class="up">celkovo lepší</span>') : _L('<span class="dn">celkovo nie je lepší</span>')}</div></div>`;
  }
  return h;
}
function tooltipFor(it, mode) {
  const R = RARITY[it.rarity];
  let h = `<h4>${it.name}${it.upg ? ' +' + it.upg : ''}</h4>
    <div class="sub">${it.primal ? _L('<span class="primal">Prvotný</span> · ') : ''}${starLabel(it)}${R.name} · ${SLOTS[it.slot].name} · ${it.typeName} · iLvl ${it.ilvl}</div>`;
  const Q = itemQuality(it);
  if (Q != null && R.rank >= 1) h += _T`<div class="qual" style="color:${qCol(Q)}">Kvalita hodov ${Math.round(Q * 100)} %</div>`;
  h += itemStatsHTML(it);
  h += itemAdvice(it);
  if (mode === 'inv') {
    h += compareHTML(it);
    const ng = (it.sockets || []).filter(Boolean).length;
    h += _T`<div class="foot">Klik: nasadiť · Pravý klik: rozobrať (+${salvageValue(it)} rudy)${ng ? _T`<br><span class="gemret">◆ ${ng} ${ng === 1 ? _L('drahokam sa vráti') : _L('drahokamy sa vrátia')} do zásoby</span>` : ''}</div>`;
  } else if (it.upg < MAX_UPG) {
    const c = upgradeCost(it), ok = P.ore >= c;
    h += _T`<div class="sec"><span class="eyebrow">Vylepšenie +${it.upg} → +${it.upg + 1}</span>
      <div class="kv"><span>Základné hodnoty</span><span class="up">+10 %</span></div>
      <div class="kv"><span>Cena</span><span class="${ok ? 'up' : 'dn'}">${c} rudy (máš ${P.ore})</span></div></div>
      <div class="foot">${ok ? _L('Klik: vylepšiť') : _L('Nedostatok rudy. Ťaž asteroidy alebo rozober predmety.')}</div>`;
  } else if (mode === 'eq') h += `<div class="foot">${it.upg < maxTemper(it) ? _T`Vylepšené na +5. Zušľachtenie až na +${maxTemper(it)} nájdeš v dielni na stanici.` : _L('Predmet je zušľachtený na maximum.')}</div>`;
  else if (mode === 'craft' && P.equip[it.slot] !== it) h += compareHTML(it);
  return h;
}
const tip = $('tip');
let tipTarget = null;
function showTip(html, color, x, y) { tip.innerHTML = html; tip.style.setProperty('--rc', color); tip.hidden = false; placeTip(x, y); }
function placeTip(x, y) {
  const r = tip.getBoundingClientRect();
  let tx = x + 18, ty = y + 14;
  if (tx + r.width > innerWidth - 8) tx = x - r.width - 18;
  if (tx < 8) tx = 8;
  if (ty + r.height > innerHeight - 8) ty = innerHeight - r.height - 8;
  if (ty < 8) ty = 8;
  tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
}
function hideTip() { tip.hidden = true; tip.classList.remove('sheet'); tipTarget = null; }
function tipFromEl(el, x, y) {
  if (!el) { hideTip(); return; }
  let it, mode;
  if (el.closest('#craft')) {
    mode = 'craft';
    if (el.dataset.cref) it = craftItem(el.dataset.cref);
    else if (el.dataset.mv) { const [k, i] = el.dataset.mv.split(':'); it = k === 'i' ? P.inv[+i] : P.stash[+i]; }
  }
  else if (el.dataset.idx != null) { it = P.inv[+el.dataset.idx]; mode = 'inv'; }
  else if (el.dataset.slot) { it = P.equip[el.dataset.slot]; mode = 'eq'; }
  if (!it) { hideTip(); return; }
  tipTarget = el;
  showTip(tooltipFor(it, mode), RARITY[it.rarity].color, x, y);
}
function equipFromInv(idx) {
  const it = P.inv[idx]; if (!it) return;
  const old = P.equip[it.slot];
  P.equip[it.slot] = it; P.inv[idx] = old;
  recalcStats(); tutTick('equip');
  log(_T`Nasadené: <span style="color:${RARITY[it.rarity].color}">${it.name}</span>`);
  renderInventory();
}
function salvage(idx) {
  const it = P.inv[idx]; if (!it) return;
  const v = salvageValue(it), sh = shardsFor(it);
  const g = returnGems(it);
  P.inv.splice(idx, 1); P.ore += v; P.shards += sh;
  log(_T`Rozobrané: ${it.name} → <span style="color:#c8a27c">+${v} rudy</span>${sh ? _T` · <span style="color:#9a8cff">+${sh} úlomkov</span>` : ''}${g ? _T` · <span style="color:#ff8fa3">${g} drahokamy vrátené</span>` : ''}`);
  renderInventory();
}
function upgradeSlot(slot) {
  const it = P.equip[slot];
  if (it.upg >= MAX_UPG) return;
  const c = upgradeCost(it);
  if (P.ore < c) { log(_L('<span style="color:#ff6b5a">Na vylepšenie nemáš dosť rudy.</span>')); return; }
  P.ore -= c; it.upg++;
  recalcStats(); tutTick('upgrade');
  log(_T`Vylepšené: ${it.name} <span style="color:#5be09a">+${it.upg}</span>`);
  renderInventory();
}
