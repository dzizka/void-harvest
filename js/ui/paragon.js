'use strict';
/* ---------- paragon constellations ---------- */
function nodePos(b, i) { const a = PARA[b].ang * Math.PI / 180 + Math.sin(i * 0.7) * 0.12, r = 8 + i * 3.05; return [Math.cos(a) * r, Math.sin(a) * r]; }
function nodeText(b, i) { const t = PARA_PATTERN[i]; return t === 's' ? `<b style="color:${PARA[b].color}">Hviezda · ${PARA[b].s.name}</b>${PARA[b].s.text}` : `<b style="color:${PARA[b].color}">${PARA[b].name} · ${t === 'm' ? 'magický uzol' : 'uzol'} ${i + 1}/14</b>${t === 'm' ? PARA[b].m : PARA[b].n}`; }
function renderPara() {
  const PA = P.para; PA.alloc = PA.alloc || {};
  $('paraPts').textContent = PA.pts;
  let svg = `<circle cx="0" cy="0" r="3.4" fill="#0b1424" stroke="#e8e2ff" stroke-width="0.6"/>`;
  for (const b in PARA) {
    const B = PARA[b], have = PA.alloc[b] || 0;
    let prev = [0, 0];
    for (let i = 0; i < 14; i++) {
      const [x, y] = nodePos(b, i);
      svg += `<line x1="${prev[0].toFixed(2)}" y1="${prev[1].toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${i < have ? B.color : '#2b3a5a'}" stroke-width="${i < have ? 0.6 : 0.35}"/>`;
      prev = [x, y];
    }
    for (let i = 0; i < 14; i++) {
      const [x, y] = nodePos(b, i), t = PARA_PATTERN[i], r = t === 's' ? 2.8 : t === 'm' ? 1.7 : 1.15;
      const got = i < have, next = i === have && PA.pts > 0;
      const attrs = `class="pn ${next ? 'next' : ''}" data-b="${b}" data-i="${i}"`;
      if (t === 's') {
        const pts = Array.from({ length: 10 }, (_, k) => { const a = k / 10 * TAU - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; return `${(x + Math.cos(a) * rr).toFixed(2)},${(y + Math.sin(a) * rr).toFixed(2)}`; }).join(' ');
        svg += `<polygon ${attrs} points="${pts}" fill="${got ? B.color : '#0b1424'}" stroke="${B.color}" stroke-width="0.5"/>`;
      } else svg += `<circle ${attrs} cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}" fill="${got ? B.color : '#0b1424'}" stroke="${got || next ? B.color : '#3a4a6c'}" stroke-width="0.45"/>`;
    }
    const [lx, ly] = nodePos(b, 13);
    svg += `<text x="${(lx * 1.04).toFixed(1)}" y="${(ly * 1.04 + (ly > 0 ? 6 : -4)).toFixed(1)}" fill="${B.color}" font-size="3.4" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700">${B.name.toUpperCase()}</text>`;
  }
  $('paraSvg').innerHTML = svg;
  const full = Object.keys(PARA).every(b => (PA.alloc[b] || 0) >= 14);
  $('paraSide').innerHTML = `
    <div id="paraDetail"><b>Paragon ${PA.lvl}</b>Prejdi myšou ponad uzol. Kliknutím na blikajúci uzol ho odomkneš. Ďalší bod o ${fmtN(Math.max(0, paraNeed(PA.lvl) - (P.level >= LEVEL_CAP ? P.xp : 0)))} XP.</div>
    ${Object.entries(PARA).map(([b, B]) => { const c = paraCounts(PA.alloc[b] || 0); return `<div class="pbr" style="--bc:${B.color}"><b>${B.name} · ${PA.alloc[b] || 0}/14</b>
      <small>${c.N ? B.n.replace(/\d+/g, m => +m * c.N) : 'zatiaľ nič'}${c.M ? ' · ' + B.m.replace(/\d+/g, m => +m * c.M) : ''}${c.S ? ' · ' + B.s.name : ''}</small></div>`; }).join('')}
    <div class="pbr" style="--bc:#e8e2ff"><b>Nekonečno · ${PA.inf || 0}</b><small>Po zaplnení všetkých konštelácií: každý bod +1 % All Damage a +1 % trup.</small>
      <button type="button" class="btn" id="paraInf" ${full && PA.pts > 0 ? '' : 'disabled'}>Vložiť bod</button></div>
    <button type="button" class="btn" id="paraReset">Vrátiť všetky body</button>
    <span class="eyebrow" style="margin-top:6px">Hviezdne runy · bonus od ${RUNE_ON} uzlov konštelácie</span>
    <div class="runes">${Object.entries(PARA).map(([b, B]) => { const r = (PA.runes || {})[b], L = r ? PA.rl[r] : 0, on = (PA.alloc[b] || 0) >= RUNE_ON;
      const used = Object.entries(PA.runes || {}).filter(([k, v]) => k !== b && v).map(([, v]) => v);
      const opts = Object.keys(PA.rl || {}).filter(k => !used.includes(k));
      return `<div class="rrow" style="--rc:${r ? RUNES[r].color : B.color}"><select data-rune="${b}"><option value="">${B.name} · prázdna pätica</option>${opts.map(k => `<option value="${k}" ${k === r ? 'selected' : ''}>${RUNES[k].name} · úr. ${PA.rl[k]}</option>`).join('')}</select>
        ${r ? `<small>${RUNES[r].main(L)}</small><small class="${on ? 'on' : ''}">${on ? '✓' : '✗'} ${RUNES[r].bonus}</small>` : `<small>${opts.length ? 'Vyber runu.' : 'Runy padajú z nočných brán a od Architekta.'}</small>`}</div>`; }).join('')}</div>
    <small style="color:var(--dim);font:500 10.5px/1.45 var(--f-mono)">Dokončenie nočnej brány v limite vylepší každú vloženú runu, ak je úroveň brány aspoň taká ako úroveň runy (max ${RUNE_MAX}).</small>`;
}
$('paraSide').addEventListener('change', e => {
  const sel = e.target.closest('[data-rune]'); if (!sel) return;
  const PA = P.para; PA.runes = PA.runes || {};
  PA.runes[sel.dataset.rune] = sel.value || null;
  recalcStats(); renderPara();
});
$('paraSvg').addEventListener('click', e => {
  const n = e.target.closest('[data-b]'); if (!n) return;
  const b = n.dataset.b, i = +n.dataset.i, PA = P.para;
  if (i !== (PA.alloc[b] || 0) || PA.pts <= 0) return;
  PA.alloc[b] = i + 1; PA.pts--; recalcStats(); renderPara();
  if (PARA_PATTERN[i] === 's') banner(`<span style="color:${PARA[b].color}">${PARA[b].s.name}</span><small>Hviezda konštelácie ${PARA[b].name}</small>`);
});
$('paraSvg').addEventListener('mouseover', e => { const n = e.target.closest('[data-b]'); if (n) $('paraDetail').innerHTML = nodeText(n.dataset.b, +n.dataset.i); });
$('paraSide').addEventListener('click', e => {
  const PA = P.para;
  if (e.target.id === 'paraInf' && PA.pts > 0) { PA.inf = (PA.inf || 0) + 1; PA.pts--; }
  else if (e.target.id === 'paraReset') { const spent = Object.values(PA.alloc).reduce((a, b) => a + b, 0) + (PA.inf || 0); PA.alloc = {}; PA.inf = 0; PA.pts += spent; }
  else return;
  recalcStats(); renderPara();
});
