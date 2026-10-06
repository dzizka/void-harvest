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
