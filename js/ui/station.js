'use strict';
/* ---------- station ---------- */
function renderStation() {
  const S = curSector();
  G.stTab = G.stTab || 'port';
  if (!isUnlocked(G.stTab)) G.stTab = 'port';
  gateTabs('#stTabs [data-st]', 'st');
  if (G.stTab === 'base') renderBase();
  document.querySelectorAll('#station [data-st-card]').forEach(c => { c.hidden = c.dataset.stCard !== G.stTab; });
  const BS = baseState();
  const dots = { base: BS.exp.some(E => Date.now() >= E.end) || Object.values(BS.store).some(v => v >= 20), port: (P.contracts || []).some(c => c.done), chal: FRAG_BOSSES.every(k => (P.frags[k] || 0) > 0) || (P.vaultFrags || 0) >= VAULT_FRAGS };
  document.querySelectorAll('#stTabs [data-st]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.st === G.stTab)); b.classList.toggle('dot', !!dots[b.dataset.st]); });
  $('stMats').innerHTML = _T`ruda <b style="color:var(--ore)">${fmtN(P.ore)}</b> · úlomky <b style="color:#9a8cff">${P.shards}</b> · kľúče <b style="color:#ff6b5a">${P.keys.length}</b>`;
  const owned = [...SLOT_ORDER.map(sl => P.equip[sl]), ...P.inv, ...P.stash].filter(it => it && it.set && it.setCls === P.cls);
  $('setArch').innerHTML = TREES[P.cls].map(B => _T`<div class="set-row" style="--bc:${B.color}"><b>${setName(B.id)}</b>${SET_SLOTS.map(sl => `<span class="${owned.some(it => it.set === B.id && it.slot === sl) ? 'have' : ''}">◆ ${SET_NOUN[sl]}</span>`).join('')}<span class="bn" style="color:var(--dim)">(2) +15 % Všetko poškodenie, +1 ku talentom vetvy · (4) ${SET4[B.id].t}</span></div>`).join('');
  $('codexInfo').textContent = _T`Kódex legendárnych schopností: ${Object.keys(G.codex || {}).length}/${LEGEND_POOL.length} (používa sa v dielni na prenos schopnosti).`;
  $('stTitle').textContent = S.kind === 'safe' ? S.name : _L('Maják · ') + S.name;
  const c = gambleCost(), full = P.inv.length >= 30;
  const opts = [['any', _L('Náhodný slot')]].concat(SLOT_ORDER.map(s => [s, SLOTS[s].name]));
  $('gamble').innerHTML = opts.map(([slot, name]) => {
    const cost = slot === 'any' ? Math.round(c * 0.8) : c;
    return _T`<button type="button" data-gamble="${slot}" ${P.ore < cost || full ? 'disabled' : ''}>${ICONS[slot]}<span>${name}<small>${cost} rudy</small></span></button>`;
  }).join('');
  renderLoadouts();
  $('exchange').innerHTML = exchangeOffers().map((o, i) => _T`<button type="button" class="btn" data-ex="${i}" ${P.ore < o.cost || o.off ? 'disabled' : ''} title="${o.tip || ''}">${o.label} · ${o.cost} rudy</button>`).join('');
  $('tiers').innerHTML = [1, 2, 3, 4].map(t => {
    const T = TIERS[t], low = P.level < T.req, locked = t > G.maxTier || (low && !G.cheat.unlock);
    const how = t === 4 ? _L('Architekt Prázdnoty na svete III') : t > 1 ? _T`${BOSSES[TIER_UNLOCK[t]].name} na svete ${TIERS[t - 1].roman}` : '';
    const why = t > G.maxTier ? _T`Odomkne: ${how}${T.req ? _T` · úroveň ${T.req}` : ''}` : low ? _T`Vyžaduje úroveň ${T.req}` : T.desc;
    return `<button type="button" class="tier ${t === G.tier ? 'cur' : ''}" data-tier="${t}" ${locked ? 'disabled' : ''}>
      <b>${T.name}</b><small>${why}</small></button>`;
  }).join('');
  $('contracts').innerHTML = (P.contracts || []).map(c => _T`<div class="crow ${c.done ? 'done' : ''}">
      <div class="ct"><b>${CONTRACTS[c.type].text(c)}</b>
        <div class="bar"><i style="width:${(c.prog / c.n * 100).toFixed(0)}%"></i></div>
        <small>${c.prog}/${c.n} · odmena ${c.ore} rudy · ${c.tier === 2 ? _L('magický až legendárny') : _L('náhodný')} predmet${c.key ? _L(' · kľúč') : ''} · XP</small></div>
      <div class="acts">${c.done ? _T`<button type="button" class="btn primary" data-claim="${c.id}">Vyzdvihnúť</button>` : _T`<button type="button" class="btn" data-reroll="${c.id}" ${P.ore < rerollCost() ? 'disabled' : ''}>Vymeniť · ${rerollCost()} rudy</button>`}</div>
    </div>`).join('');
  $('archKills').textContent = G.archKills || 0;
  $('frags').innerHTML = FRAG_BOSSES.map(k => `<span class="frag ${(P.frags[k] || 0) ? '' : 'no'}" style="--fc:${BOSSES[k].color}">${BOSSES[k].name} ×${P.frags[k] || 0}</span>`).join('');
  $('archBtn').disabled = !FRAG_BOSSES.every(k => (P.frags[k] || 0) > 0);
  $('vaultFrags').textContent = P.vaultFrags || 0;
  $('vaultBtn').disabled = (P.vaultFrags || 0) < VAULT_FRAGS;
  const okR = P.level >= CLIMB_REQ || G.cheat.unlock, rb = (ACC.rush || {})[P.cls];
  $('rushInfo').innerHTML = _T`Rekord lode: <b>${rb ? fmtTime(rb) : '—'}</b>${okR ? '' : _L(' · od úrovne 50')}`;
  $('rushBtn').disabled = !okR;
  const okH = P.level >= HORDE_REQ || G.cheat.unlock;
  $('hordeInfo').innerHTML = _T`Dokončené: <b>${ACC.st.hordes || 0}×</b> · najviac éteru ${Math.floor(ACC.hordeBest || 0)}${okH ? '' : _L(' · od úrovne 30')}`;
  $('hordeBtn').disabled = !okH;
  $('rushBoard').innerHTML = (ACC.rushRuns || []).slice(0, 3).map((r, i) => `<div>${i + 1}. <b style="color:${CLASSES[r.cls].color}">${CLASSES[r.cls].name}</b> · <b>${fmtTime(r.t)}</b></div>`).join('');
  const W = weekData(), wm = weekMods(W.w);
  $('weekInfo').innerHTML = _T`Týždeň ${W.w + 1}: ${wm.map(m => `<span style="color:#ff8a7a" title="${NM_MODS[m].desc}">${NM_MODS[m].name}</span>`).join(' · ')}<br>Tvoj rekord: <b>${W.best[P.cls] || 0}</b>. poschodie${W.claimed[P.cls] ? _L(' · odmena vybraná') : _L(' · odmena za 10. poschodie čaká')}`;
  $('weekBtn').disabled = !okR;
  $('weekBoard').innerHTML = W.runs.slice(0, 3).map((r, i) => _T`<div>${i + 1}. <b style="color:${CLASSES[r.cls].color}">${CLASSES[r.cls].name}</b> · poschodie <b>${r.floor}</b></div>`).join('');
  const best = climbBest(), okC = P.level >= CLIMB_REQ || G.cheat.unlock;
  $('climbBest').textContent = best;
  const starts = [...new Set([1, Math.max(1, best - 10), Math.max(1, best - 5), Math.max(1, best)])];
  $('climbStart').innerHTML = starts.map(f => _T`<button type="button" class="btn ${f === Math.max(1, best) ? 'primary' : ''}" data-climb="${f}" ${okC ? '' : 'disabled'}>Od poschodia ${f}</button>`).join('') + (okC ? '' : _L('<span class="cheat-note">Odomkne sa na úrovni 50.</span>'));
  const runs = ACC.climbRuns || [];
  $('climbBoard').innerHTML = runs.length ? _L('<span class="eyebrow">Rebríček (všetci piloti)</span>') + runs.slice(0, 5).map((r, i) => _T`<div>${i + 1}. <b style="color:${CLASSES[r.cls].color}">${CLASSES[r.cls].name}</b> · poschodie <b>${r.floor}</b>${r.key ? ' · ' + r.key : ''}${r.died ? _L(' · zničený') : ''} · ${new Date(r.d).toLocaleDateString('sk-SK')}</div>`).join('') : '';
  $('nmInfo').textContent = _T`Nočné brány: najvyššia dokončená úroveň ${G.nmBest || 0} · kľúče ${P.keys.length}/20. Kľúče padajú z bossov a elít, použiješ ich pri ľubovoľnej bráne.`;
  $('mythCount').textContent = `${Object.keys(G.found).length}/${MYTHIC_LIST.length}`;
  $('archive').innerHTML = MYTHIC_LIST.map(m => {
    const f = G.found[m.id];
    return `<div class="myth-entry ${f ? 'found' : ''}"><b>${f ? m.name : _L('Neobjavený mýtus')}</b><small>${m.source}</small>${f ? `<p>${m.power}</p>` : ''}</div>`;
  }).join('');
}
function loadoutSummary(L) {
  const key = TREES[P.cls].map(B => B.key).find(k => L.tal[k.id]);
  const items = SLOT_ORDER.map(sl => L.equip[sl]).filter(Boolean);
  return _T`${key ? key.name : _L('bez kľúčového talentu')} · ${Object.values(L.tal).reduce((a, b) => a + b, 0)} talentov · ${items.length}/7 predmetov`;
}
// slot is checked too: an id from an old save could belong to an item of another kind
function findItemById(id, slot) {
  const ok = x => x.id === id && (!slot || x.slot === slot);
  for (const sl of SLOT_ORDER) if (P.equip[sl] && ok(P.equip[sl])) return { where: 'e', sl };
  let k = P.inv.findIndex(ok); if (k >= 0) return { where: 'i', k };
  k = P.stash.findIndex(ok); if (k >= 0) return { where: 's', k };
  return null;
}
function saveLoadout(i) {
  P.loadouts = P.loadouts || [null, null, null];
  const old = P.loadouts[i], PA = P.para;
  P.loadouts[i] = { name: (old && old.name) || _T`Zostava ${i + 1}`, equip: Object.fromEntries(SLOT_ORDER.map(sl => [sl, P.equip[sl] ? P.equip[sl].id : null])),
    tal: { ...P.tal }, alloc: { ...(PA.alloc || {}) }, inf: PA.inf || 0, runes: { ...(PA.runes || {}) } };
  P.curLoadout = i;
  log(_T`Zostava „${P.loadouts[i].name}“ uložená.`);
}
function applyLoadout(i) {
  const L = (P.loadouts || [])[i]; if (!L) return;
  let missing = 0;
  for (const sl of SLOT_ORDER) {
    const id = L.equip[sl]; if (!id || (P.equip[sl] && P.equip[sl].id === id)) continue;
    const f = findItemById(id, sl); if (!f || f.where === 'e') { missing++; continue; }
    // taking the item frees a spot where it lay, so the replaced one always fits (mail only as a last resort)
    const it = f.where === 'i' ? P.inv.splice(f.k, 1)[0] : P.stash.splice(f.k, 1)[0];
    const old = P.equip[sl]; P.equip[sl] = it;
    if (old) { if (P.inv.length < 30) P.inv.push(old); else if (P.stash.length < STASH_MAX) P.stash.push(old); else ACC.mail.push(old); }
  }
  const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const totT = P.points + sum(P.tal), needT = sum(L.tal);
  if (needT <= totT) { P.tal = { ...L.tal }; P.points = totT - needT; }
  const PA = P.para, totP = PA.pts + sum(PA.alloc) + (PA.inf || 0), needP = sum(L.alloc) + (L.inf || 0);
  if (needP <= totP) { PA.alloc = { ...L.alloc }; PA.inf = L.inf || 0; PA.pts = totP - needP; }
  PA.runes = Object.fromEntries(Object.entries(L.runes || {}).filter(([, r]) => !r || (PA.rl || {})[r]));
  P.curLoadout = i;
  recalcStats(); P.shield = P.stats.maxShield; P.hull = P.stats.maxHull;
  log(_T`Nasadená zostava „${L.name}“${missing ? _T` · ${missing} ${missing === 1 ? _L('predmet chýba') : _L('predmety chýbajú')} (rozobraté alebo predané)` : ''}.`);
}
function renderLoadouts() {
  P.loadouts = P.loadouts || [null, null, null];
  $('loadouts').innerHTML = P.loadouts.map((L, i) => _T`<div class="lo ${P.curLoadout === i ? 'cur' : ''}">
    <input data-ldn="${i}" value="${L ? L.name.replace(/"/g, '') : _T`Zostava ${i + 1}`}" maxlength="24" ${L ? '' : 'disabled'}>
    <small>${L ? loadoutSummary(L) : _L('prázdna')}</small>
    <div class="row"><button type="button" class="btn" data-lds="${i}">Uložiť aktuálnu</button><button type="button" class="btn primary" data-lda="${i}" ${L ? '' : 'disabled'}>Nasadiť</button></div>
  </div>`).join('');
}
function exchangeOffers() {
  // prices follow ore income, which grows with zone level and world tier
  const sc = (1 + 0.06 * (P.level + TIERS[G.tier].lvl - 1)) * (1 + 0.25 * (G.tier - 1));
  const d = costDisc(), c = v => Math.round(v * d * sc / 10) * 10, kl = Math.max(1, G.nmBest || 1);
  const gem = (t, q) => ({ label: gemName(t, q), cost: c(q ? 2400 : 600), act: () => { P.gems[t][q]++; log(_T`Burza: <span style="color:${GEMS[t].color}">${gemName(t, q)}</span>`); } });
  return [
    { label: _L('+5 úlomkov'), cost: c(1250), act: () => addShards(5) },
    { label: _L('+25 úlomkov'), cost: c(6000), act: () => addShards(25) },
    { label: _T`Kľúč nočnej brány úr. ${kl}`, cost: c(900 + 150 * kl), off: P.keys.length >= 20, tip: _L('Úroveň podľa najvyššej dokončenej nočnej brány'), act: () => { P.keys.push(makeKey(kl)); log(_T`Burza: kľúč nočnej brány úr. ${kl}.`); } },
    { label: _L('Legendárny kontajner'), cost: Math.round(gambleCost() * 10), off: P.inv.length >= 30, tip: _L('Garantovaný legendárny predmet do náhodného slotu'), act: () => { const it = generateItem(P.level + TIERS[G.tier].lvl, 'legendary'); P.inv.push(it); log(_T`Burza: <span style="color:${RARITY.legendary.color}">${it.name}</span>`); } },
    ...Object.keys(GEMS).map(t => gem(t, 0)),
    ...Object.keys(GEMS).map(t => gem(t, 1))
  ];
}
function setTier(t) {
  if (t > G.maxTier || t === G.tier) return;
  if (P.level < TIERS[t].req && !G.cheat.unlock) { log(_T`<span style="color:#ff6b5a">Svet ${TIERS[t].roman} vyžaduje úroveň ${TIERS[t].req}.</span>`); return; }
  G.tier = t;
  for (const g of G.gates) g.lvl = zoneLevel() + 1;
  log(_T`Svetová úroveň: ${TIERS[t].name}.`);
  saveGame(); renderStation(); updateHUD();
}
function gamble(slot) {
  const cost = slot === 'any' ? Math.round(gambleCost() * 0.8) : gambleCost();
  if (P.ore < cost || P.inv.length >= 30) return;
  P.ore -= cost;
  const it = generateItem(P.level + TIERS[G.tier].lvl, rollRarity(1), slot === 'any' ? null : slot);
  P.inv.push(it);
  if (!P.bestItem || RARITY[it.rarity].rank > RARITY[P.bestItem.rarity].rank) P.bestItem = it;
  log(_T`Kontajner otvorený: <span style="color:${RARITY[it.rarity].color}">${it.name}</span>`);
  if (it.rarity === 'legendary') banner(_T`<span style="color:${RARITY.legendary.color}">${it.name}</span><small>Legendárny predmet z kontajnera</small>`);
  renderStation();
}
