'use strict';
/* ---------- gate entry & nightmare keys ---------- */
function renderGate() {
  const g = G.gateSel, B = BOSSES[g.boss];
  $('gateTitle').textContent = B.lair;
  $('gateHint').textContent = _T`Úroveň brány ${g.lvl} · boss ${B.name}`;
  const keys = [...P.keys].sort((a, b) => b.lvl - a.lvl);
  const kcol = k => k.lvl >= 30 ? '#e14bff' : k.lvl >= 15 ? '#ff6b5a' : '#ff9a5a';
  if (!keys.some(k => k.id === G.keySel)) G.keySel = keys.length ? keys[0].id : null;
  const x1 = v => v.toFixed(1).replace('.', DEC);
  // key tiles: level + one dot per modifier (red) and the bonus (green); the selected key opens on the right
  const tiles = keys.map(k => `<button type="button" class="ktile ${k.id === G.keySel ? 'sel' : ''}" data-ksel="${k.id}" style="--nmc:${kcol(k)}" aria-label="${_T`Kľúč úrovne ${k.lvl}`}">
      <b>${k.lvl}</b><span class="kdots">${k.mods.map(() => '<i class="neg"></i>').join('')}<i class="pos"></i></span></button>`).join('');
  const k = keys.find(x => x.id === G.keySel);
  let detail = '';
  if (k) {
    const sc = nmScale(k.lvl), myth = Math.max(TIERS[G.tier].myth, k.lvl >= 10 ? 1 : 0) > 0;
    const chips = k.mods.map(m => `<span class="chip neg" ${tipAttr(NM_MODS[m].desc)}>${NM_MODS[m].name}</span>`).join('') + `<span class="chip pos" ${tipAttr(NM_BONUS[k.bonus].desc)}>${NM_BONUS[k.bonus].name}</span>`;
    detail = `<div class="kdetail" style="--nmc:${kcol(k)}">
      <div class="khead"><span class="kl">${k.lvl}</span><span class="chips">${chips}</span></div>
      <div class="kline" ${tipAttr(_L('Úroveň nepriateľov · ich životy · ich poškodenie · časový limit'))}>☠ ${g.lvl + sc.lvl} · ♥ ×${x1(sc.hp)} · ⚔ ×${x1(sc.dmg)} · ⌛ ${fmtTime(NM_LIMIT)}</div>
      <div class="kline good" ${tipAttr(_L('Predmety od bossa navyše · šanca na legendárky · šanca na mýtické predmety (od úrovne kľúča 10)'))}>✚ ${1 + Math.floor(k.lvl / 8)} · ★ +${k.lvl * 4} %${myth ? ` · ✹ ×${x1(1 + k.lvl * 0.1)}` : ''}</div>
      <button type="button" class="btn primary" data-key="${k.id}">${_L('Aktivovať')}</button></div>`;
  }
  const nmTxt = _T`Kľúč zmení bránu na nočnú: silnejší nepriatelia, nebezpečné modifikátory a lepší loot. Dokonči ju do ${fmtTime(NM_LIMIT)} a dostaneš kľúč o úroveň vyšší, za polovicu limitu o dve. Pri smrti kľúč stratíš.`;
  $('gateBody').innerHTML = `
    <div class="st-card full gate-plain">
      <span class="eyebrow">${_L('Bežný vstup')}${hintQ(_T`Tri komnaty a boss na úrovni ${g.lvl}. Bez časového limitu. Boss pustí kľúč od nočnej brány.`)}</span>
      <button type="button" class="btn" data-key="none">${_L('Vstúpiť bez kľúča')}</button>
    </div>
    <div class="st-card full">
      <span class="eyebrow">${_T`Nočná brána · kľúče ${P.keys.length}/20 · rekord ${G.nmBest || 0}`}${hintQ(nmTxt)}</span>
      ${hintP('nm', nmTxt)}
      ${keys.length ? `<div class="kpick"><div class="kgrid">${tiles}</div>${detail}</div>` : `<p class="note">${_L('Zatiaľ nemáš žiadny kľúč. Padá z bossov a elít.')}</p>`}
    </div>`;
}
$('gateBody').addEventListener('click', e => {
  const t = e.target.closest('[data-ksel]'); if (t) { G.keySel = +t.dataset.ksel; renderGate(); return; }
  const b = e.target.closest('[data-key]'); if (!b) return;
  const g = G.gateSel;
  if (b.dataset.key === 'none') enterDungeon(g);
  else { const k = P.keys.find(x => x.id === +b.dataset.key); if (k) enterDungeon(g, k); }
});
