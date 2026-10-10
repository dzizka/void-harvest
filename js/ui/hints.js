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
  const el = e.target.closest('[data-tip], .info[title], .info[data-t]'); if (!el || el.matches('button:not(.info)')) return;
  e.stopPropagation(); e.preventDefault();
  TOUCH.acts = [];
  tip.innerHTML = `<p style="margin:0;line-height:1.5">${tipText(el)}</p><div class="sheet-acts"><button type="button" class="btn" data-sa="x">${_L('Zavrieť')}</button></div>`;
  tip.style.setProperty('--rc', 'var(--accent)'); tip.classList.add('sheet'); tip.hidden = false;
}, true);
