'use strict';
/* =====================================================================
   I18N — the source text is Slovak; js/i18n-en.js maps it to English.
   _L('text')  → translated string literal
   _T`text ${x}` → translated template; dictionary keys use {0}, {1}… for the
   ${…} slots, so a translation may reorder them.
   The language is read once at startup; switching reloads the page.
   ===================================================================== */
const LANG_KEY = 'void-harvest-lang';
const LANG = (() => {
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'sk' || s === 'en') return s; } catch (e) { /* storage blocked */ }
  const nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('sk') || nav.startsWith('cs') ? 'sk' : 'en';
})();
const EN = {};   // filled by js/i18n-en.js
const DEC = LANG === 'sk' ? ',' : '.';
function _L(s) { return LANG === 'en' && EN[s] != null ? EN[s] : s; }
const _TC = new WeakMap();
function _T(strs, ...v) {
  let c = _TC.get(strs);
  if (!c) {
    const key = strs.map((s, i) => (i ? '{' + (i - 1) + '}' : '') + s).join('');
    const tr = LANG === 'en' ? EN[key] : null;
    if (tr != null) {
      const parts = [], idx = []; let last = 0;
      tr.replace(/\{(\d+)\}/g, (m, n, off) => { parts.push(tr.slice(last, off)); idx.push(+n); last = off + m.length; return m; });
      parts.push(tr.slice(last));
      c = { parts, idx };
    } else c = { parts: strs, idx: strs.slice(1).map((_, i) => i) };
    _TC.set(strs, c);
  }
  let out = c.parts[0];
  for (let i = 0; i < c.idx.length; i++) out += v[c.idx[i]] + c.parts[i + 1];
  return out;
}
function setLang(l) {
  if (l === LANG) return;
  try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* storage blocked */ }
  if (typeof saveGame === 'function' && typeof G !== 'undefined' && G && G.mode === 'play') saveGame();
  location.reload();
}
// static markup in index.html: text nodes and title/placeholder/aria-label attributes
function translateStatic(rootEl) {
  if (LANG !== 'en') return;
  const tw = document.createTreeWalker(rootEl || document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
  for (const n of nodes) {
    const t = n.nodeValue, k = t.trim();
    if (k && EN[k] != null) n.nodeValue = t.replace(k, EN[k]);
  }
  for (const el of (rootEl || document.body).querySelectorAll('[title],[placeholder],[aria-label]')) {
    for (const a of ['title', 'placeholder', 'aria-label']) { const v = el.getAttribute(a); if (v && EN[v.trim()] != null) el.setAttribute(a, EN[v.trim()]); }
  }
  document.documentElement.lang = 'en';
}
