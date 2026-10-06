'use strict';
/* ---------- gate entry & nightmare keys ---------- */
function renderGate() {
  const g = G.gateSel, B = BOSSES[g.boss];
  $('gateTitle').textContent = B.lair;
  $('gateHint').textContent = _T`Úroveň brány ${g.lvl} · boss ${B.name}`;
  const keys = [...P.keys].sort((a, b) => b.lvl - a.lvl);
  const rows = keys.map(k => {
    const sc = nmScale(k.lvl), col = k.lvl >= 30 ? '#e14bff' : k.lvl >= 15 ? '#ff6b5a' : '#ff9a5a';
    const chips = k.mods.map(m => `<span class="chip neg" title="${NM_MODS[m].desc}">${NM_MODS[m].name}</span>`).join('') + `<span class="chip pos" title="${NM_BONUS[k.bonus].desc}">${NM_BONUS[k.bonus].name}</span>`;
    const myth = (Math.max(TIERS[G.tier].myth, k.lvl >= 10 ? 1 : 0) > 0);
    return _T`<div class="keyrow" style="--nmc:${col}">
      <span class="kl">${k.lvl}<small>KĽÚČ</small></span>
      <span class="kd"><span class="chips">${chips}</span>
        <span class="meta">Nepriatelia úr. ${g.lvl + sc.lvl} · HP ×${sc.hp.toFixed(1)} · poškodenie ×${sc.dmg.toFixed(1)} · limit ${fmtTime(NM_LIMIT)}</span>
        <span class="meta">Odmena: +${1 + Math.floor(k.lvl / 8)} predmety od bossa · legendárky +${k.lvl * 4} %${myth ? _T` · mýtické ×${(1 + k.lvl * 0.1).toFixed(1)}` : _L(' · mýtické od úr. 10')}</span></span>
      <button type="button" class="btn primary" data-key="${k.id}">Aktivovať</button></div>`;
  }).join('');
  $('gateBody').innerHTML = _T`
    <div class="st-card full">
      <span class="eyebrow">Bežný vstup</span>
      <p>Tri komnaty a boss na úrovni ${g.lvl}. Bez časového limitu. Boss pustí kľúč od nočnej brány.</p>
      <button type="button" class="btn" data-key="none">Vstúpiť bez kľúča</button>
    </div>
    <div class="st-card full">
      <span class="eyebrow">Nočná brána · tvoje kľúče ${P.keys.length}/20 · rekord ${G.nmBest || 0}</span>
      <p>Kľúč zmení bránu na nočnú: silnejší nepriatelia, nebezpečné modifikátory a lepší loot. Dokonči ju do ${fmtTime(NM_LIMIT)} a dostaneš kľúč o úroveň vyšší, za polovicu limitu o dve. Pri smrti kľúč stratíš.</p>
      <div class="keylist">${rows}</div>
    </div>`;
}
$('gateBody').addEventListener('click', e => {
  const b = e.target.closest('[data-key]'); if (!b) return;
  const g = G.gateSel;
  if (b.dataset.key === 'none') enterDungeon(g);
  else { const k = P.keys.find(x => x.id === +b.dataset.key); if (k) enterDungeon(g, k); }
});
