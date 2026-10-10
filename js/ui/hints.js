'use strict';
/* =====================================================================
   HINTS — "?" next to a heading instead of a paragraph that is always on screen.
   hintQ(text)        → small "?" button; hover (PC), tap (touch) or gamepad focus shows the text
   hintP(key, text)   → the paragraph in full the first time a window shows it; once that window
                        is closed it folds into the "?" (account-wide, ACC.hints)
   tipAttr(text)      → data-tip="…" for any element (chips, icon lines) with the same behaviour
   ===================================================================== */
const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hintQ = text => `<button type="button" class="info q" data-tip="${escAttr(text)}" aria-label="${escAttr(text)}">?</button>`;
const tipAttr = text => `data-tip="${escAttr(text)}"`;
const HINT_SHOWN = new Set();
function hintP(key, text) {
  if (ACC.hints && ACC.hints[key]) return '';
  HINT_SHOWN.add(key);
  return `<p class="hint-once">${text}</p>`;
}
// called when windows close: shown explanations fold into "?" from now on
function commitHints() {
  if (!HINT_SHOWN.size) return;
  ACC.hints = ACC.hints || {};
  for (const k of HINT_SHOWN) ACC.hints[k] = 1;
  HINT_SHOWN.clear();
}
const tipText = el => el.dataset.tip || el.dataset.t || el.title || '';
// desktop: custom hover tooltip (the native title would show late and unstyled)
document.addEventListener('mouseover', e => {
  if (TOUCH.on) return;
  const el = e.target.closest('[data-tip], .info[title]'); if (!el) return;
  if (el.title) { el.dataset.t = el.title; el.removeAttribute('title'); }
  showTip(`<p class="tip-txt">${tipText(el)}</p>`, 'var(--accent)', e.clientX, e.clientY); tipTarget = el;
});
document.addEventListener('mouseout', e => {
  const el = e.target.closest('[data-tip], .info[data-t]');
  if (el && tipTarget === el && !el.contains(e.relatedTarget)) hideTip();
});
// touch: a tap shows the text in the bottom sheet
document.addEventListener('click', e => {
  if (!TOUCH.on) return;
  const el = e.target.closest('[data-tip], .info[title], .info[data-t]'); if (!el || el.closest('button:not(.info)')) return;
  e.stopPropagation(); e.preventDefault();
  TOUCH.acts = [];
  tip.innerHTML = `<p style="margin:0;line-height:1.5">${tipText(el)}</p><div class="sheet-acts"><button type="button" class="btn" data-sa="x">${_L('Zavrieť')}</button></div>`;
  tip.style.setProperty('--rc', 'var(--accent)'); tip.classList.add('sheet'); tip.hidden = false;
}, true);

/* ---------- currencies and materials as coloured icons (name on hover / tap) ---------- */
const CUR_ICO = { ore: ['◆', 'var(--ore)'], sh: ['◈', '#9a8cff'], key: ['<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.2 8H15M12.6 8v3M15 8v2.4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', '#ff6b5a'] };
const curName = k => k === 'ore' ? _L('Ruda') : k === 'sh' ? _L('Úlomky Prázdnoty') : k === 'key' ? _L('Kľúče nočných brán') : MATS[k].name;
function curIco(k, n) {
  const [ico, col] = CUR_ICO[k] || [MATS[k].icon, MATS[k].color];
  return `<span class="cy" style="--cc:${col}" ${tipAttr(curName(k))}><i>${ico}</i>${n}</span>`;
}

// world tier as one line of icons (each part explains itself on hover)
function tierLine(T) {
  if (!T.lvl) return _L('Základná obťažnosť');
  const x = v => '×' + String(v).replace('.', DEC), pc = v => Math.round(v * 100) + ' %';
  const parts = [[`☠ +${T.lvl}`, _L('Nepriatelia o toľko úrovní vyššie')], [`♥ ${x(T.hp)}`, _L('Životy nepriateľov')], [`⚔ ${x(T.dmg)}`, _L('Poškodenie nepriateľov')],
    [`XP ${x(T.xp)}`, _L('Skúsenosti')], [`★ ${x(T.leg)}`, _L('Šanca na legendárky')], ['✦', _L('Väčšie afixy ✦ na legendárkach, setoch a mýtoch')]];
  if (T.anc) parts.push([`▲ ${pc(T.anc)}`, _L('Pradávne predmety (+20 % ku všetkým hodnotám)')]);
  if (T.myth) parts.push([`✹${T.myth > 1 ? ' ' + x(T.myth) : ''}`, _L('Mýtické predmety')]);
  return parts.map(([t, tip]) => `<span ${tipAttr(tip)}>${t}</span>`).join(' · ');
}
