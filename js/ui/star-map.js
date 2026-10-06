'use strict';
/* ---------- star map ---------- */
function sectorColor(S) { return S.kind === 'safe' ? '#5fd4ff' : BOSSES[S.boss].color; }
function renderMap() {
  if (!G.mapSel) G.mapSel = G.sector;
  $('mapLinks').innerHTML = SECTOR_LINKS.map(([a, b]) => {
    const A = SECTORS[a].pos, B = SECTORS[b].pos;
    return `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>`;
  }).join('');
  $('mapNodes').innerHTML = Object.entries(SECTORS).map(([id, S]) => {
    const locked = P.level < S.min && !G.cheat.unlock;
    return `<button type="button" class="snode ${S.kind} ${locked ? 'locked' : ''} ${id === G.mapSel ? 'sel' : ''} ${id === G.sector ? 'here' : ''}" data-sec="${id}"
      style="left:${S.pos[0]}%;top:${S.pos[1]}%;--nc:${sectorColor(S)}">
      <span class="dot"></span><span class="nm">${S.name}${G.wb && G.wb.sec === id && G.wb.state !== 'idle' ? ' <span style="color:#ffb000">☄</span>' : ''}</span><span class="lv">${locked ? 'zamknuté · úr. ' + S.min : levelRange(S)}</span></button>`;
  }).join('');
  const id = G.mapSel, S = SECTORS[id], why = canWarp(id), col = sectorColor(S);
  const kills = G.bossKills[id] || 0;
  $('mapDetail').innerHTML = `
    <span class="tag" style="color:${col}">${S.kind === 'safe' ? 'Bezpečná zóna' : 'Bojová zóna'}</span>
    <h3>${S.name}</h3>
    <p>${S.desc}</p>
    <dl>
      <dt>Úroveň</dt><dd>${S.kind === 'safe' ? 'bez nepriateľov' : levelRange(S).replace('Úr. ', '')}</dd>
      <dt>Ťažba</dt><dd>${S.ast.crystal >= 30 ? 'bohaté kryštály' : S.ast.iron >= 38 ? 'železné žily' : 'bežná ruda'}</dd>
      ${S.kind === 'hostile' ? `<dt>Brána</dt><dd style="color:${col}">${BOSSES[S.boss].lair}</dd><dt>Boss</dt><dd>${BOSSES[S.boss].name}${kills ? ` · porazený ${kills}×` : ''}</dd>` : '<dt>Služby</dt><dd>servis, kontajnery</dd>'}
    </dl>
    ${S.kind === 'hostile' && bossLoot(S.boss) ? (() => { const L = bossLoot(S.boss); return `<p class="loot-hint"><b>Lov na veliteľa:</b> ${L.legs.map(id => `<span style="color:${LEGEND_INDEX[id].build ? L.branch.color : RARITY.legendary.color}">${LEGEND_INDEX[id].name}</span>`).join(', ')} · set <span style="color:${RARITY.set.color}">${setName(L.set)}</span></p>`; })() : ''}
    ${why ? `<span class="why">${why}</span>` : ''}
    <button type="button" class="btn primary" id="warpBtn" ${why ? 'disabled' : ''}>Hyperskok</button>`;
  $('warpBtn').addEventListener('click', () => warpTo(id));
}
