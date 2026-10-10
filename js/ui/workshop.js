'use strict';
/* ---------- workshop: forge, gems, stash ---------- */
const canPay = c => P.ore >= c.ore && P.shards >= (c.sh || 0);
const pay = c => { P.ore -= c.ore; P.shards -= c.sh || 0; };
const costTxt = c => _T`${c.ore} rudy${c.sh ? _T` · ${c.sh} úlomkov` : ''}`;
const rerollCostOf = it => ({ ore: Math.round(lateCost(it.ilvl) * (40 + 4 * it.ilvl) * (1 + 0.5 * (it.rerolls || 0))), sh: 2 + (it.rerolls || 0) });
const socketCost = it => { const n = (it.sockets || []).length; return { ore: Math.round(lateCost(it.ilvl) * 60 * (n + 1)), sh: 3 * (n + 1) }; };
const temperCost = it => it.upg >= 10 ? { ore: Math.round(upgradeCost(it) * 3), sh: 10 * (it.upg - 9) } : { ore: Math.round(upgradeCost(it) * 1.5), sh: (it.upg - 4) * 2 };
const MW_MAX = 15, MW_HIT = [12, 15];   // these levels empower a random affix ×1.25
const maxTemper = it => RARITY[it.rarity].rank >= 3 ? MW_MAX : 10;
function mwEmpower(it, avoid) {
  const idx = it.affixes.map((a, i) => i).filter(i => i !== avoid);
  const i = pick(idx.length ? idx : [0]), a = it.affixes[i];
  a.val = Math.round(a.val * 1.25); a.mw = (a.mw || 0) + 1;
  return i;
}
const mwRerollCost = it => ({ ore: Math.round(upgradeCost(it) * 2), sh: 25 });
const imprintCost = it => ({ ore: Math.round(lateCost(it.ilvl) * (150 + 10 * it.ilvl)), sh: 8 });
function craftItem(ref) { return ref && ref[0] === 'e' ? P.equip[ref.slice(2)] : ref ? P.inv[+ref.slice(2)] : null; }
function itemCell(it, attr, extra) {
  return `<button type="button" class="cell item ${it.rarity} ${it.primal ? 'primal' : ''} ${gaCls(it)} ${extra || ''}" ${attr} style="--rc:${RARITY[it.rarity].color}" aria-label="${it.name}">${qBar(it)}${rarMark(it)}${ICONS[it.slot]}<span class="il">${it.ilvl}</span>${starMark(it)}</button>`;
}
function renderCraft() {
  G.craftTab = G.craftTab || 'forge';
  $('craftBack').hidden = !G.fromStation;
  document.querySelectorAll('#craftTabs [data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === G.craftTab)));
  G.codex = G.codex || {};
  $('craftMats').innerHTML = _T`Ruda <b style="color:var(--ore)">${P.ore}</b> · Úlomky Prázdnoty <b style="color:#9a8cff">${P.shards}</b> · Kódex ${Object.keys(G.codex).length}/${LEGEND_POOL.length}`;
  if (G.craftTab === 'forge') renderForge();
  else if (G.craftTab === 'gems') renderGems();
  else renderStash();
}
function renderForge() {
  if (!craftItem(G.craftSel)) G.craftSel = 'e:weapon';
  const it = craftItem(G.craftSel), rk = RARITY[it.rarity].rank;
  const list = SLOT_ORDER.map(sl => itemCell(P.equip[sl], `data-cref="e:${sl}"`, G.craftSel === 'e:' + sl ? 'sel' : '').replace('</button>', '<span class="eqm">E</span></button>'))
    .concat(P.inv.map((x, i) => itemCell(x, `data-cref="i:${i}"`, G.craftSel === 'i:' + i ? 'sel' : ''))).join('');
  let acts = '';
  // reroll
  if (rk >= 1 && it.affixes.length) {
    const c = rerollCostOf(it), wish = buildWish(), myth = it.rarity === 'mythic';
    // default selection: the line the build cares least about
    if (G.rsel == null || G.rselItem !== it.id || !it.affixes[G.rsel]) {
      let worst = 0, ws = 9;
      it.affixes.forEach((a, i) => { if (a.greater) return; const sc = (wish.includes(a.key) ? 1 : 0) + rollQ(a.val, affixRange(it, a.key)); if (sc < ws) { ws = sc; worst = i; } });
      G.rsel = worst; G.rselItem = it.id;
    }
    const si = G.rsel, cur = it.affixes[si];
    acts += _T`<div class="fact"><span class="eyebrow">Prekovanie · ${costTxt(c)} · klikni na riadok pre náhľad</span>
      ${it.affixes.map((a, i) => { const r = affixRange(it, a.key, a.greater), q = rollQ(a.val, r); return _T`<div class="frow ${i === si ? 'rsel' : ''}"><span class="pick" data-act="rsel" data-i="${i}" style="color:${a.greater ? '#ffd36b' : wish.includes(a.key) ? 'var(--r-magic)' : '#8b96ad'}">${a.greater ? '✦ ' : ''}${AFFIXES[a.key].label(a.val)} <em style="color:${qCol(q)};font-style:normal;font-size:10.5px">${Math.round(q * 100)} %</em></span>
        <span class="rbtns"><button type="button" class="btn" data-act="rerollv" data-i="${i}" ${myth || !canPay(c) ? 'disabled' : ''} title="${a.greater ? _L('Ponechá väčší afix ✦, nový hod hodnoty') : _L('Ponechá afix, nový hod hodnoty · šanca na ✦')}">Hodnota</button><button type="button" class="btn" data-act="reroll" data-i="${i}" ${(a.greater && myth) || !canPay(c) ? 'disabled' : ''} title="${a.greater ? _L('Nahradí afix iným · ✦ sa stratí, ak nepadne znova') : _L('Nahradí afix iným · šanca na ✦')}">Afix</button></span></div>`; }).join('')}`;
    if (cur && !(cur.greater && myth)) {
      const gch = gaRerollChance(it), gp = String(Math.round(gch * 1000) / 10).replace('.', DEC);
      const taken = it.affixes.map(a => a.key).filter(k => k !== cur.key);
      const pool = AFFIX_ORDER.filter(k => AFFIXES[k].slots.includes(it.slot) && !taken.includes(k));
      const good = pool.filter(k => wish.includes(k)).length, cr = affixRange(it, cur.key, cur.greater);
      acts += _T`<div class="rprev"><span class="eyebrow">Náhľad · ${AFFIXES[cur.key].label('').replace(/^\+%?\s*/, '')}</span>
        <span>Hodnota: nový hod v rozsahu <b>${cr[0]}–${cr[1]}</b>${myth ? _L(' (mýtické sú vždy na maxime)') : ''}, teraz ${cur.val}.${cur.greater ? _L(' <b style="color:#ffd36b">✦ väčší afix ostane.</b>') : myth ? '' : _T` Šanca, že sa z neho stane <b style="color:#ffd36b">✦ väčší afix (×1,5)</b>: ${gp} %.`}</span>
        <span>Afix: jeden z ${pool.length} s rovnakou šancou · pre build <b style="color:#5be09a">${good}/${pool.length} (${Math.round(good / pool.length * 100)} %)</b> · šanca na <b style="color:#ffd36b">✦ väčší</b>: ${gp} %${cur.greater ? _L(' · <b style="color:#ff6b5a">súčasný ✦ sa stratí</b>') : ''}</span>
        ${pool.map(k => { const r = affixRange(it, k); return `<div class="opt ${wish.includes(k) ? 'want' : 'no'}"><span>${wish.includes(k) ? '✓' : '·'}</span><span>${AFFIXES[k].label('').replace(/^\+%?\s*/, '')}${k === cur.key ? _L(' (súčasný)') : ''}</span><em>${r[0]}–${r[1]}</em><em>${Math.round(100 / pool.length)} %</em></div>`; }).join('')}
      </div>`;
    }
    acts += _T`<p class="note">Hodnota: ponechá afix a hodí novú hodnotu. Afix: nahradí ho náhodným iným. Každé prekovanie predmetu zdraží ďalšie.</p></div>`;
  }
  // sockets
  const maxS = MAX_SOCKETS[rk];
  if (maxS) {
    const socks = it.sockets || [];
    const owned = [];
    for (const t in GEMS) for (let q = 0; q < 3; q++) if (P.gems[t][q] > 0) owned.push([t, q]);
    acts += _T`<div class="fact"><span class="eyebrow">Pätice ${socks.length}/${maxS}</span>
      ${socks.map((g, i) => g ? _T`<div class="frow"><span style="color:${GEMS[g.t].color}">◆ ${gemName(g.t, g.q)} · +${GEMS[g.t].vals[g.q]}% ${GEMS[g.t].label}</span><button type="button" class="btn" data-act="unsock" data-i="${i}">Vybrať</button></div>`
        : _T`<div class="frow"><span class="note">◇ Prázdna pätica</span><span class="gemchips">${owned.length ? owned.map(([t, q]) => `<button type="button" style="--gc:${GEMS[t].color}" data-act="sock" data-i="${i}" data-g="${t}:${q}">${gemName(t, q)} ×${P.gems[t][q]}</button>`).join('') : _L('<span class="note">Nemáš drahokamy.</span>')}</span></div>`).join('')}
      ${socks.length < maxS ? _T`<div class="frow"><span class="note">Pridať päticu · ${costTxt(socketCost(it))}</span><button type="button" class="btn" data-act="addsock" ${canPay(socketCost(it)) ? '' : 'disabled'}>Vyvŕtať</button></div>` : ''}</div>`;
  } else acts += _T`<div class="fact"><span class="eyebrow">Pätice</span><p class="note">Pätice majú len vzácne (1), legendárne (2) a mýtické (3).</p></div>`;
  // mythic resonance: feed a duplicate
  if (it.rarity === 'mythic') {
    const dups = [...P.inv.map((x, k) => ['i', k, x]), ...P.stash.map((x, k) => ['s', k, x])].filter(([, , x]) => x !== it && x.rarity === 'mythic' && x.legend === it.legend);
    const r = it.res || 0;
    acts += _T`<div class="fact"><div class="frow"><span><span class="eyebrow" style="color:var(--r-mythic)">Rezonancia mýtu · ${r}/${RES_MAX}<span class="res-pips">${Array.from({ length: RES_MAX }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</span></span><br>
      <span class="note">Duplikát rovnakého mýtu zvýši silu schopnosti o 10 % (Oko Tessaru: +1 kryštál za každé 2 úrovne). Duplikát sa zničí, jeho drahokamy sa vrátia. Duplikáty: ${dups.length}</span></span>
      <button type="button" class="btn" data-act="resonate" ${dups.length && r < RES_MAX ? '' : 'disabled'}>Rezonovať</button></div></div>`;
  }
  // temper
  if (it.upg < maxTemper(it)) {
    const c = it.upg < 5 ? { ore: upgradeCost(it), sh: 0 } : temperCost(it), mw = it.upg >= 10, hit = MW_HIT.includes(it.upg + 1);
    acts += _T`<div class="fact"><div class="frow"><span><span class="eyebrow">${mw ? _L('<span class="mw">Majstrovské</span> zušľachtenie') : _L('Zušľachtenie')} +${it.upg} → +${it.upg + 1}</span><br><span class="note">+10 % k základným hodnotám${hit ? _L(' · <span class="mw">náhodný afix ×1,25</span>') : ''} · ${costTxt(c)}</span></span>
      <button type="button" class="btn" data-act="temper" ${canPay(c) ? '' : 'disabled'}>Zušľachtiť</button></div>
      ${it.upg === 10 && RARITY[it.rarity].rank >= 3 ? _L('<p class="note">Majstrovské zušľachtenie +11 až +15 je pre legendárne, setové a mýtické predmety. Na +12 a +15 sa náhodný afix zosilní ×1,25.</p>') : ''}</div>`;
  }
  if (it.mwLast != null && it.affixes[it.mwLast] && it.affixes[it.mwLast].mw) {
    const c = mwRerollCost(it), a = it.affixes[it.mwLast];
    acts += _T`<div class="fact"><div class="frow"><span><span class="eyebrow"><span class="mw">Presmerovať zosilnenie</span> · ${costTxt(c)}</span><br><span class="note">Posledné zosilnenie je na „${AFFIXES[a.key].label(a.val)}“. Presunie sa na iný náhodný afix.</span></span>
      <button type="button" class="btn" data-act="mwre" ${canPay(c) ? '' : 'disabled'}>Presmerovať</button></div></div>`;
  }
  // codex
  if (it.rarity === 'legendary') {
    const inInv = G.craftSel[0] === 'i';
    acts += _T`<div class="fact"><span class="eyebrow">Kódex legendárnych schopností</span>
      <div class="frow"><span class="note">${G.codex[it.legend] ? _L('Schopnosť už v kódexe máš.') : _L('Uloží schopnosť do kódexu natrvalo.')} Predmet sa zničí (+2 úlomky), drahokamy sa vrátia do zásoby.</span>
      <button type="button" class="btn" data-act="extract" ${inInv ? '' : _L('disabled title="Najprv predmet zlož do nákladu"')}>Extrahovať</button></div>
      ${inInv ? '' : _L('<p class="note">Nasadený predmet sa extrahovať nedá.</p>')}</div>`;
  } else if (it.rarity === 'rare') {
    const pool = LEGEND_POOL.filter(l => G.codex[l.id] && l.slot === it.slot && (!l.cls || l.cls === P.cls));
    const c = imprintCost(it);
    acts += _T`<div class="fact"><span class="eyebrow">Vtlačenie schopnosti z kódexu · ${costTxt(c)}</span>
      ${pool.length ? pool.map(l => _T`<div class="frow"><span><b style="color:var(--r-legendary)">${l.name}</b><br><span class="note">${l.power}</span></span><button type="button" class="btn" data-act="imprint" data-l="${l.id}" ${canPay(c) ? '' : 'disabled'}>Vtlačiť</button></div>`).join('')
        : _L('<p class="note">V kódexe nemáš žiadnu schopnosť pre tento slot. Extrahuj ju z legendárneho predmetu.</p>')}
      <p class="note">Vzácny predmet sa zmení na legendárny so zvolenou schopnosťou a ponechá si affixy.</p></div>`;
  }
  $('craftBody').innerHTML = _T`<div class="forge">
    <div><span class="eyebrow">Výbava (E) a náklad</span><div class="forge-list" style="margin-top:8px">${list}</div></div>
    <div class="forge-item" style="--rc:${RARITY[it.rarity].color}">
      <div><h3>${it.name}${it.upg ? ' +' + it.upg : ''}</h3><span class="sub">${starLabel(it)}${RARITY[it.rarity].name} · ${SLOTS[it.slot].name} · ${it.typeName} · iLvl ${it.ilvl}</span></div>
      <div class="fstats">${itemStatsHTML(it)}</div>
      ${acts}
    </div></div>`;
}
function renderGems() {
  $('craftBody').innerHTML = _T`<p class="note" style="margin-bottom:12px">Drahokamy padajú z kryštálových asteroidov, bossov, lovcov a udalostí. Tri rovnaké zlúčiš do jedného vyššej kvality. Do pätice ich vložíš v kováčni.</p>
    <div class="gemgrid">${Object.entries(GEMS).map(([t, G0]) => `<div class="gemcard" style="--gc:${G0.color}">
      <b>${G0.name[0].toUpperCase() + G0.name.slice(1)} · ${G0.label}</b>
      ${[0, 1, 2].map(q => `<div class="frow"><span>${GEM_Q[q]} · +${G0.vals[q]} % · <b style="color:var(--text)">×${P.gems[t][q]}</b></span>
        ${q < 2 ? _T`<button type="button" class="btn" data-merge="${t}:${q}" ${P.gems[t][q] >= 3 && P.ore >= 30 * (q + 1) ? '' : 'disabled'}>3 → 1 · ${30 * (q + 1)} rudy</button>` : ''}</div>`).join('')}
    </div>`).join('')}</div>`;
}
function renderStash() {
  const inv = Array.from({ length: HOLD_MAX }, (_, i) => P.inv[i] ? itemCell(P.inv[i], `data-mv="i:${i}"`) : '<div class="cell"></div>').join('');
  const st = Array.from({ length: STASH_MAX }, (_, i) => P.stash[i] ? itemCell(P.stash[i], `data-mv="s:${i}"`) : '<div class="cell"></div>').join('');
  $('craftBody').innerHTML = _T`<div class="stash2">
    <div><span class="eyebrow">Náklad ${P.inv.length}/30 · klik presunie do skladu</span><div class="g6" style="margin-top:8px">${inv}</div></div>
    <div><span class="eyebrow">Spoločný sklad všetkých pilotov ${P.stash.length}/${STASH_MAX} · klik presunie do nákladu</span><div class="g10" style="margin-top:8px">${st}</div></div>
  </div>`;
}
function rollAffixVal(it, key) {
  const A = AFFIXES[key], myth = it.rarity === 'mythic';
  let v = (myth || it.primal ? A.range[1] : rand(A.range[0], A.range[1])) * (A.slow ? 1 + 0.012 * (it.ilvl - 1) : 1 + 0.05 * (it.ilvl - 1)) * starMult(it);
  if (it.rarity === 'legendary' || it.rarity === 'set' || myth) v *= 1.15;
  return Math.max(1, Math.round(v));
}
function gaHit(it, a) {
  banner(_T`<span style="color:#ffd36b">✦ Väčší afix!</span><small>${AFFIXES[a.key].label(a.val)} · ${it.name}</small>`);
  log(_T`<span style="color:#ffd36b">✦ Väčší afix natočený:</span> ${AFFIXES[a.key].label(a.val)} na ${it.name}`);
}
function forgeAction(b) {
  const it = craftItem(G.craftSel); if (!it) return;
  const act = b.dataset.act, i = +b.dataset.i;
  if (act === 'rsel') { G.rsel = i; G.rselItem = it.id; renderCraft(); return; }
  if (act === 'rerollv') {
    const c = rerollCostOf(it), cur = it.affixes[i]; if (!canPay(c) || it.rarity === 'mythic') return;
    pay(c); const old = cur.val, up = !cur.greater && Math.random() < gaRerollChance(it);
    if (up) cur.greater = true;
    cur.val = Math.round(rollAffixVal(it, cur.key) * (cur.greater ? 1.5 : 1) * Math.pow(1.25, cur.mw || 0)); it.rerolls = (it.rerolls || 0) + 1;
    if (up) gaHit(it, cur);
    log(_T`Prekovaná hodnota: ${cur.greater ? '<span style="color:#ffd36b">✦</span> ' : ''}${AFFIXES[cur.key].label(cur.val)} <span style="color:${cur.val > old ? '#5be09a' : cur.val < old ? '#ff6b5a' : '#7f8ca8'}">(${cur.val >= old ? '+' : ''}${cur.val - old})</span>`);
  } else if (act === 'reroll') {
    const c = rerollCostOf(it), cur = it.affixes[i]; if (!canPay(c) || (cur.greater && it.rarity === 'mythic')) return;
    const taken = it.affixes.map(a => a.key).filter(k => k !== cur.key);
    const pool = AFFIX_ORDER.filter(k => AFFIXES[k].slots.includes(it.slot) && !taken.includes(k));
    pay(c); const key = pick(pool);
    const mwk = it.affixes[i].mw || 0;
    const gr = Math.random() < gaRerollChance(it);
    it.affixes[i] = { key, val: Math.round(rollAffixVal(it, key) * (gr ? 1.5 : 1) * Math.pow(1.25, mwk)), mw: mwk || undefined, greater: gr || undefined }; it.rerolls = (it.rerolls || 0) + 1;
    if (gr) gaHit(it, it.affixes[i]);
    log(_T`Prekované: ${gr ? '<span style="color:#ffd36b">✦</span> ' : ''}${AFFIXES[key].label(it.affixes[i].val)}`);
  } else if (act === 'addsock') {
    const c = socketCost(it); if (!canPay(c)) return; pay(c);
    it.sockets = it.sockets || []; it.sockets.push(null); log(_L('Pätica vyvŕtaná.'));
  } else if (act === 'sock') {
    const [t, q] = b.dataset.g.split(':'); if (P.gems[t][+q] <= 0) return;
    P.gems[t][+q]--; it.sockets[i] = { t, q: +q };
  } else if (act === 'unsock') {
    const g = it.sockets[i]; if (!g) return; P.gems[g.t][g.q]++; it.sockets[i] = null;
  } else if (act === 'temper') {
    const c = it.upg < 5 ? { ore: upgradeCost(it), sh: 0 } : temperCost(it); if (!canPay(c) || it.upg >= maxTemper(it)) return;
    pay(c); it.upg++; log(_T`Zušľachtené: ${it.name} <span style="color:#5be09a">+${it.upg}</span>`);
    if (MW_HIT.includes(it.upg)) { const k = mwEmpower(it); it.mwLast = k; log(_T`<span class="mw">Majstrovské zosilnenie:</span> ${AFFIXES[it.affixes[k].key].label(it.affixes[k].val)}`); }
  } else if (act === 'resonate') {
    if ((it.res || 0) >= RES_MAX) return;
    let k = P.inv.findIndex(x => x !== it && x.rarity === 'mythic' && x.legend === it.legend), from = P.inv;
    if (k < 0) { k = P.stash.findIndex(x => x !== it && x.rarity === 'mythic' && x.legend === it.legend); from = P.stash; }
    if (k < 0) return;
    returnGems(from[k]); from.splice(k, 1); it.res = (it.res || 0) + 1;
    if (G.craftSel && G.craftSel[0] === 'i') G.craftSel = 'i:' + P.inv.indexOf(it);
    log(_T`<span style="color:var(--r-mythic)">Rezonancia:</span> ${it.name} ${it.res}/${RES_MAX} (+${it.res * 10} % sila).`);
  } else if (act === 'mwre') {
    const c = mwRerollCost(it), old = it.affixes[it.mwLast]; if (!canPay(c) || !old || !old.mw) return;
    pay(c); old.val = Math.round(old.val / 1.25); old.mw--;
    const k = mwEmpower(it, it.mwLast); it.mwLast = k;
    log(_T`Zosilnenie presmerované: ${AFFIXES[it.affixes[k].key].label(it.affixes[k].val)}`);
  } else if (act === 'extract') {
    if (G.craftSel[0] !== 'i') return;
    returnGems(it); G.codex[it.legend] = true; P.inv.splice(+G.craftSel.slice(2), 1); P.shards += 2;
    log(_T`Kódex: <span style="color:#ff8a1f">${LEGEND_INDEX[it.legend].name}</span> uložená.`);
    G.craftSel = 'e:weapon';
  } else if (act === 'imprint') {
    const c = imprintCost(it), L = LEGEND_INDEX[b.dataset.l]; if (!canPay(c) || it.rarity !== 'rare') return;
    pay(c); it.rarity = 'legendary'; it.legend = L.id; it.name = L.name;
    log(_T`Vtlačené: <span style="color:#ff8a1f">${L.name}</span>`);
  }
  recalcStats(); renderCraft(); hideTip(); saveGame();
}
$('craftTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { G.craftTab = b.dataset.tab; renderCraft(); hideTip(); } });
$('craftBody').addEventListener('click', e => {
  const sel = e.target.closest('[data-cref]'), act = e.target.closest('[data-act]'), mv = e.target.closest('[data-mv]'), mg = e.target.closest('[data-merge]');
  if (act && !act.disabled) { forgeAction(act); return; }
  if (sel) { G.craftSel = sel.dataset.cref; renderCraft(); return; }
  if (mg && !mg.disabled) {
    const [t, q] = mg.dataset.merge.split(':'), qi = +q, cost = 30 * (qi + 1);
    if (P.gems[t][qi] >= 3 && P.ore >= cost) { P.gems[t][qi] -= 3; P.gems[t][qi + 1]++; P.ore -= cost; log(_T`Zlúčené: <span style="color:${GEMS[t].color}">${gemName(t, qi + 1)}</span>`); renderCraft(); }
    return;
  }
  if (mv) {
    const [k, i] = mv.dataset.mv.split(':');
    if (k === 'i' && P.stash.length < STASH_MAX) P.stash.push(P.inv.splice(+i, 1)[0]);
    else if (k === 's' && P.inv.length < HOLD_MAX) P.inv.push(P.stash.splice(+i, 1)[0]);
    renderCraft(); hideTip();
  }
});
$('craftBody').addEventListener('mousemove', e => {
  if (TOUCH.on) return;
  const el = e.target.closest('[data-cref],[data-mv]');
  if (el !== tipTarget) tipFromEl(el, e.clientX, e.clientY); else if (el) placeTip(e.clientX, e.clientY);
});
$('craftBody').addEventListener('mouseleave', () => { if (!TOUCH.on) hideTip(); });
