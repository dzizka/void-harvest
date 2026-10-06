'use strict';
/* ---------- talents ---------- */
function talNodeHTML(n, open, bonus) {
  const a = P.tal[n.id] || 0, b = bonus[n.id] || 0, eff = a ? Math.min(n.max + TAL_OVER, a + b) : 0;
  const can = canAddTalent(n.id), maxed = a >= n.max;
  return _T`<button type="button" class="node ${!open ? 'locked' : ''} ${can ? 'can' : ''} ${maxed ? 'max' : ''}" data-tal="${n.id}">
    <span class="top"><b>${n.name}</b><span class="rank">${a}/${n.max}${b ? `<em class="bon">+${b}</em>` : ''}</span></span>
    <span class="pips">${Array.from({ length: n.max }, (_, k) => `<i class="${k < a ? 'on' : ''}"></i>`).join('')}</span>
    <p>Za bod: ${n.txt(n.per)}</p>
    ${eff ? _T`<span class="total">Aktuálne: ${n.txt(n.per * eff)}${eff > a ? ` · rank ${eff}` : ''}</span>` : b ? _T`<span class="total">Výbava +${b} · aktivuje sa 1. bodom</span>` : ''}
  </button>`;
}
const respecCost = () => P.level < 10 ? 0 : Math.round((100 + 20 * P.level) * costDisc());
function renderTalents() {
  const T = TREES[P.cls], bonus = talentBonus(P.cls, P.equip);
  const keyB = T.find(B => P.tal[B.key.id]);
  let spentAll = 0, size = 0;
  for (const B of T) { spentAll += branchSpent(B) + (P.tal[B.key.id] ? 1 : 0); size += B.nodes.reduce((a, n) => a + n.max, 0) + 1; }
  $('talPts').textContent = P.points;
  $('talBudget').innerHTML = _T`${CLASSES[P.cls].name} · použité body <b>${spentAll}</b> · voľné <b>${P.points}</b> · strom má <b>${size}</b> bodov, na úrovni 50 ich máš 49${keyB ? _T` · kľúčový talent: <b style="color:${keyB.color}">${keyB.key.name}</b>` : ''}`;
  let html = '';
  for (const B of T) {
    const spent = branchSpent(B);
    html += _T`<div class="branch" style="--bc:${B.color}"><div class="branch-head"><span class="eyebrow">${spent} ${spent === 1 ? _L('bod') : spent < 5 && spent ? _L('body') : _L('bodov')} vo vetve</span><h3>${B.name}</h3><p class="bdesc">${B.desc}</p></div>`;
    for (let tier = 0; tier < 3; tier++) {
      const open = spent >= TIER_REQ[tier];
      html += `<div class="tier-lbl ${open ? 'on' : ''}">${tier ? _T`Úroveň ${tier + 1} · ${TIER_REQ[tier]} bodov vo vetve` : _L('Úroveň 1')}</div><div class="tier-row">`;
      for (const n of B.nodes) if (n.t === tier) html += talNodeHTML(n, open, bonus);
      html += '</div>';
    }
    const k = B.key, have = !!P.tal[k.id], open = spent >= KEY_REQ && (!keyB || keyB === B);
    html += _T`<div class="tier-lbl ${open || have ? 'on' : ''}">Kľúčový talent · ${KEY_REQ} bodov · len jeden na loď</div>
      <button type="button" class="node key ${have ? 'max' : ''} ${!open && !have ? 'locked' : ''} ${canAddTalent(k.id) ? 'can' : ''}" data-tal="${k.id}">
        <span class="top"><b>◆ ${k.name}</b><span class="rank">${have ? _L('aktívny') : '0/1'}</span></span>
        <p>${k.text}</p>
        ${keyB && keyB !== B ? _T`<span class="req">Už máš kľúčový talent ${keyB.key.name}</span>` : ''}
      </button></div>`;
  }
  $('talCols').innerHTML = html;
  const c = respecCost();
  $('respec').textContent = _T`Reset talentov · ${c ? c + ' rudy' : 'zadarmo'}`;
}
function addTalent(id) {
  if (!canAddTalent(id)) return;
  P.tal[id] = (P.tal[id] || 0) + 1; P.points--;
  tutTick('talent');
  recalcStats(); renderTalents();
}
function refundTalents() {
  let refund = 0;
  for (const k in P.tal) refund += P.tal[k];
  P.tal = {}; P.points += refund;
  return refund;
}
function respec() {
  if (!Object.values(P.tal).some(Boolean)) return;
  const c = respecCost();
  if (P.ore < c) { log(_T`<span style="color:#ff6b5a">Reset talentov stojí ${c} rudy.</span>`); return; }
  P.ore -= c; refundTalents();
  log(_T`Talenty resetované${c ? _T` za ${c} rudy` : ''}.`);
  recalcStats(); renderTalents();
}

/* ---------- skills tab ---------- */
function setTalTab(t) {
  G.talTab = t;
  document.querySelectorAll('#talTabs [data-tt]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tt === t)));
  $('talTree').hidden = t !== 'tree'; $('skillPane').hidden = t !== 'skills';
  document.querySelector('#tal header .hint').hidden = t !== 'tree';
  if (t === 'skills') renderSkills();
}
function skillCardHTML(id, def, isDodge) {
  const rk = skRank(id), free = skPtsFree(), S = skState();
  const locked = !isDodge && P.level < def.lvl;
  const slot = isDodge ? 'Space' : S.sel[0] === id ? 'Q' : S.sel[1] === id ? 'Shift' : '';
  const cd = isDodge ? dodgeCd() : skillCd(id);
  const mods = isDodge ? DODGE_MODS : def.mods;
  const upTxt = isDodge ? _L('Vylepšenie · −20 % cooldown') : _L('Vylepšenie · +25 % poškodenia, −15 % cooldown');
  return _T`<div class="skc ${locked ? 'locked' : ''} ${slot ? 'eq' : ''}">
    <div class="skc-top"><b>${def.name}</b>${slot ? `<kbd>${slot}</kbd>` : ''}</div>
    <p>${def.desc}</p>
    <small>${locked ? _T`Odomkne sa na úrovni ${def.lvl}` : _T`Cooldown ${String(Math.round(cd * 10) / 10).replace('.', DEC)} s`}</small>
    <div class="skc-up">
      <button type="button" data-skup="${id}" class="${rk >= 1 ? 'on' : ''}" ${rk >= 1 || !free || locked ? 'disabled' : ''}>${upTxt}</button>
      ${mods.map((m, k) => `<button type="button" data-skmod="${id}:${k}" class="mod ${rk >= 2 && S.mod[id] === k ? 'on' : ''}" ${locked || rk < 1 || (rk < 2 && !free) ? 'disabled' : ''} title="${m.desc}"><b>${m.name}</b><span>${m.desc}</span></button>`).join('')}
    </div></div>`;
}
function renderSkills() {
  if (!P) return;
  const S = skState(), list = CLS_SKILLS[P.cls] || [], free = skPtsFree();
  $('talSkN').textContent = free > 0 ? '✦' + free : '';
  if ($('skillPane').hidden) return;
  const opts = slot => list.filter(id => P.level >= SKILLS[id].lvl).map(id => `<option value="${id}" ${S.sel[slot] === id ? 'selected' : ''}>${SKILLS[id].name}</option>`).join('') || `<option>—</option>`;
  $('skillPane').innerHTML = _T`<div class="sk-head">
      <span>Body schopností: <b>${free}</b> voľné · ${skPtsTotal()}/10 (1 bod každých 5 úrovní)</span>
      <label>Q <select data-sksel="0">${opts(0)}</select></label>
      <label>Shift <select data-sksel="1">${opts(1)}</select></label>
      <button type="button" class="btn" data-skreset ${skPtsSpent() ? '' : 'disabled'}>Vrátiť body</button>
    </div>
    <div class="sk-grid">${skillCardHTML('dodge', dodgeDef(), true)}${list.map(id => skillCardHTML(id, SKILLS[id], false)).join('')}</div>
    <p class="note">1. bod schopnosti ju vylepší, 2. bod odomkne jednu z dvoch modifikácií (medzi nimi môžeš neskôr prepínať zadarmo). Vrátenie bodov je zadarmo. Auto-schopnosti zapneš v Menu (≡).</p>`;
}
$('talTabs').addEventListener('click', e => { const b = e.target.closest('[data-tt]'); if (b) setTalTab(b.dataset.tt); });
$('skillPane').addEventListener('click', e => {
  const up = e.target.closest('[data-skup]'), md = e.target.closest('[data-skmod]'), rs = e.target.closest('[data-skreset]');
  const S = skState();
  if (up && !up.disabled) { if (skPtsFree() > 0 && skRank(up.dataset.skup) === 0) S.rk[up.dataset.skup] = 1; }
  else if (md && !md.disabled) {
    const [id, k] = md.dataset.skmod.split(':');
    if (skRank(id) === 1 && skPtsFree() > 0) { S.rk[id] = 2; S.mod[id] = +k; }
    else if (skRank(id) === 2) S.mod[id] = +k;
  } else if (rs && !rs.disabled) { S.rk = {}; S.mod = {}; }
  else return;
  saveGame(); renderSkills(); updateHUD();
});
$('skillPane').addEventListener('change', e => {
  const sel = e.target.closest('[data-sksel]'); if (!sel || !SKILLS[sel.value]) return;
  const S = skState(), i = +sel.dataset.sksel, o = 1 - i;
  if (S.sel[o] === sel.value) S.sel[o] = S.sel[i];
  S.sel[i] = sel.value;
  saveGame(); renderSkills(); updateHUD();
});
