'use strict';
/* ---------- events ---------- */
$('grid').addEventListener('click', e => { const el = e.target.closest('[data-idx]'); if (el) { equipFromInv(+el.dataset.idx); tipFromEl(document.querySelector(`[data-idx="${el.dataset.idx}"]`), e.clientX, e.clientY); } });
$('grid').addEventListener('contextmenu', e => { e.preventDefault(); if (TOUCH.on) return; const el = e.target.closest('[data-idx]'); if (el) { salvage(+el.dataset.idx); hideTip(); } });
$('eslots').addEventListener('click', e => { const el = e.target.closest('[data-slot]'); if (el) { upgradeSlot(el.dataset.slot); tipFromEl(document.querySelector(`[data-slot="${el.dataset.slot}"]`), e.clientX, e.clientY); } });
for (const id of ['grid', 'eslots']) {
  $(id).addEventListener('mousemove', e => {
    if (TOUCH.on) return;
    const el = e.target.closest('[data-idx],[data-slot]');
    if (el !== tipTarget) tipFromEl(el, e.clientX, e.clientY); else if (el) placeTip(e.clientX, e.clientY);
  });
  $(id).addEventListener('mouseleave', () => { if (!TOUCH.on) hideTip(); });
}
/* ---------- salvage: auto filter on pickup + bulk salvage of the hold ---------- */
const SALV_RAR = ['common', 'magic', 'rare', 'legendary', 'set', 'mythic'];
const SALV_HINT = { common: _L('Bežné predmety'), magic: _L('Magické predmety'), rare: _L('Vzácne predmety'), legendary: _L('Legendárne · schopnosť sa uloží do kódexu'), set: _L('Setové · dajú úlomky'), mythic: _L('Mýtické · duplikát nasadeného alebo uloženého mýtu sa použije na rezonanciu, inak sa rozoberie na úlomky') };
function asvFrom(f) { const rar = {}; SALV_RAR.forEach(r => rar[r] = r !== 'set' && r !== 'mythic' && RARITY[r].rank < (f > 0 ? f : 2)); if (f >= 4) rar.legendary = true; return { rar, auto: f > 0, protUp: true, protStar: true }; }
function ASV() { if (!G.asv) G.asv = asvFrom(G.filter || 0); return G.asv; }
// selected rarities minus protections (upgrades ▲ △, ✦✦+ and primal items); loadout items are guarded separately
function shouldSalvage(it) {
  const A = ASV();
  if (!A.rar[it.rarity]) return false;
  if (A.protStar && (gaExtra(it) >= 2 || it.primal)) return false;
  if (A.protUp && upgradeState(it) !== 0) return false;
  return true;
}
function resTarget(it) {
  const all = [...SLOT_ORDER.map(sl => P.equip[sl]), ...P.inv, ...P.stash];
  return all.find(x => x && x !== it && x.rarity === 'mythic' && x.legend === it.legend && (x.res || 0) < RES_MAX) || null;
}
// destroy an item: gems back, ore + shards, legendary power to the codex, mythic duplicate into resonance
function disposeItem(it) {
  const r = { ore: 0, sh: 0, codex: false, res: null };
  returnGems(it);
  if (it.rarity === 'mythic') {
    G.found[it.legend] = true;
    const t = resTarget(it); if (t) { t.res = (t.res || 0) + 1; r.res = t; recalcStats(); return r; }
  }
  if (it.rarity === 'legendary' && it.legend && LEGEND_INDEX[it.legend] && !LEGEND_INDEX[it.legend].build && !(G.codex || {})[it.legend]) { G.codex = G.codex || {}; G.codex[it.legend] = true; r.codex = true; }
  r.ore = salvageValue(it); r.sh = shardsFor(it); P.ore += r.ore; P.shards += r.sh;
  return r;
}
// never bulk-salvage items saved in a loadout
function salvageCandidates() {
  const prot = new Set();
  for (const L of P.loadouts || []) if (L) for (const sl in L.equip) if (L.equip[sl]) prot.add(L.equip[sl]);
  return P.inv.filter(it => !prot.has(it.id) && shouldSalvage(it));
}
function renderSalvBar() {
  const A = ASV(), c = salvageCandidates(), ore = c.reduce((a, it) => a + salvageValue(it), 0);
  const chip = (attr, on, txt, tip, col) => `<button type="button" class="chip" ${attr} aria-pressed="${on}" title="${tip}" ${col ? `style="--cc:${col}"` : ''}>${txt}</button>`;
  $('salvBar').innerHTML = _T`<div class="row"><span class="lbl">Rozoberať</span><div class="chips">${SALV_RAR.map(r => chip(`data-ar="${r}"`, !!A.rar[r], RARITY[r].name, SALV_HINT[r], RARITY[r].color)).join('')}</div>
</div>
    <div class="row"><span class="lbl">Chrániť</span><div class="chips">${chip('data-ap="protUp"', A.protUp, _L('▲ △ vylepšenia'), _L('Predmety lepšie než nasadené sa nerozoberú'))}${chip('data-ap="protStar"', A.protStar, _L('✦✦ väčšie afixy a ✶'), _L('Predmety s 2 a viac väčšími afixmi ✦ (mýty: 2 navyše) a prvotné ✶ predmety sa nerozoberú'), '#ffd36b')}</div>
      <label class="sw sep" title="Označené rarity sa rozoberú hneď pri zbere. Predmety v zostavách sa nikdy nerozoberú."><input type="checkbox" id="asvAuto" ${A.auto ? 'checked' : ''}><span>Auto pri zbere</span></label>
      <button type="button" class="sb" data-salv ${c.length ? '' : 'disabled'} title="${c.length} predmetov · +${ore} rudy">Rozobrať označené · ${c.length}<em>+${fmtN(ore)}</em></button></div>`;
}
$('salvBar').addEventListener('change', e => {
  if (e.target.id !== 'asvAuto') return;
  ASV().auto = e.target.checked; saveGame(); renderSalvBar();
  log(_T`Auto-rozobratie ${ASV().auto ? _L('zapnuté') : _L('vypnuté')}.`);
});
$('salvBar').addEventListener('click', e => {
  const ar = e.target.closest('[data-ar]'), ap = e.target.closest('[data-ap]'), sb = e.target.closest('[data-salv]');
  const A = ASV();
  if (ar) { A.rar[ar.dataset.ar] = !A.rar[ar.dataset.ar]; saveGame(); renderSalvBar(); return; }
  if (ap) { A[ap.dataset.ap] = !A[ap.dataset.ap]; saveGame(); renderSalvBar(); return; }
  if (!sb || sb.disabled) return;
  if (sb.dataset.armed !== '1') {
    sb.dataset.armed = '1'; sb.classList.add('confirm'); sb.innerHTML = _L('Potvrdiť rozobratie');
    setTimeout(() => { if (sb.isConnected && sb.dataset.armed === '1') renderSalvBar(); }, 2500);
    return;
  }
  const list = new Set(salvageCandidates());
  let gained = 0, sh = 0, n = 0, res = 0, cod = 0;
  P.inv = P.inv.filter(it => list.has(it) ? false : true);
  for (const it of list) { const r = disposeItem(it); gained += r.ore; sh += r.sh; n++; if (r.res) res++; if (r.codex) cod++; }
  if (n) log(_T`Rozobraných ${n} predmetov → <span style="color:#c8a27c">+${gained} rudy</span>${sh ? _T` · <span style="color:#9a8cff">+${sh} úlomkov</span>` : ''}${res ? _T` · <span style="color:var(--r-mythic)">${res}× rezonancia</span>` : ''}${cod ? _T` · ${cod} do kódexu` : ''}`);
  saveGame(); renderInventory(); hideTip();
});
$('talCols').addEventListener('click', e => { const el = e.target.closest('[data-tal]'); if (el) addTalent(el.dataset.tal); });
$('respec').addEventListener('click', respec);
// touch: a second tap on the selected sector jumps (same as the Hyperjump button)
$('mapNodes').addEventListener('click', e => { const el = e.target.closest('[data-sec]'); if (!el) return; if (TOUCH.on && G.mapSel === el.dataset.sec && el.dataset.sec !== G.sector && !canWarp(el.dataset.sec)) { warpTo(el.dataset.sec); return; } G.mapSel = el.dataset.sec; renderMap(); });
$('loadouts').addEventListener('click', e => {
  const sv = e.target.closest('[data-lds]'), ap = e.target.closest('[data-lda]');
  if (sv) { saveLoadout(+sv.dataset.lds); saveGame(); renderStation(); }
  if (ap && !ap.disabled) { applyLoadout(+ap.dataset.lda); saveGame(); renderStation(); }
});
$('loadouts').addEventListener('change', e => {
  const n = e.target.closest('[data-ldn]'); if (!n) return;
  const L = P.loadouts[+n.dataset.ldn]; if (L) { L.name = n.value.trim() || L.name; saveGame(); }
});
$('exchange').addEventListener('click', e => {
  const el = e.target.closest('[data-ex]'); if (!el || el.disabled) return;
  const o = exchangeOffers()[+el.dataset.ex];
  if (!o || o.off || P.ore < o.cost) return;
  P.ore -= o.cost; o.act(); saveGame(); renderStation();
});
$('gamble').addEventListener('click', e => { const el = e.target.closest('[data-gamble]'); if (el) gamble(el.dataset.gamble); });
$('stTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-st]'); if (!b) return;
  if (b.dataset.st === 'craft') { G.fromStation = true; G.panel = 'craft'; syncPanels(); return; }
  G.stTab = b.dataset.st; renderStation();
});
$('craftBack').addEventListener('click', () => { G.panel = 'station'; syncPanels(); });
$('archBtn').addEventListener('click', enterPinnacle);
$('vaultBtn').addEventListener('click', enterVault);
$('rushBtn').addEventListener('click', enterRush);
$('hordeBtn').addEventListener('click', enterHorde);
$('weekBtn').addEventListener('click', () => enterClimb(1, true));
$('climbStart').addEventListener('click', e => { const b = e.target.closest('[data-climb]'); if (b && !b.disabled) enterClimb(+b.dataset.climb); });
$('abPara').addEventListener('click', () => openPanel('para'));
function setMore(open) { $('morePop').hidden = !open; $('abMore').setAttribute('aria-expanded', String(open)); }
$('abMore').addEventListener('click', e => { e.stopPropagation(); setMore($('morePop').hidden); });
document.addEventListener('click', e => { if (!e.target.closest('.ab-more')) setMore(false); });
$('abAch').addEventListener('click', () => { setMore(false); G.achTab = G.achTab && G.achTab !== 'enc' ? G.achTab : 'story'; openPanel('ach'); });
$('abEnc').addEventListener('click', () => { setMore(false); G.achTab = 'enc'; openPanel('ach'); });
$('stMap').addEventListener('click', () => { G.mapSel = G.sector; G.panel = 'map'; syncPanels(); });
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closePanels));
$('abInv').addEventListener('click', () => openPanel('inv'));
$('abTal').addEventListener('click', () => openPanel('tal'));
$('abMap').addEventListener('click', () => { if (G && G.panel !== 'map') G.mapSel = G.sector; openPanel('map'); });
$('respawn').addEventListener('click', respawn);
$('mailBtn').addEventListener('click', () => { claimMail(); renderInventory(); });
// another tab owns the save: reload here to continue with its latest data
$('tabTake').addEventListener('click', () => location.reload());
let hangarArmed = -99;
function goToHangar() {
  if (!G || transitioning) return;
  if (G.dungeon && G.mode === 'play' && performance.now() - hangarArmed > 3000) {
    hangarArmed = performance.now();
    log(_L('<span style="color:#ff6b5a">Si v bráne – rozbehnutý súboj sa stratí (vrátiš sa na Haven). Stlač Hangár znova.</span>'));
    return;
  }
  if (G.mode === 'play') { G.panel = null; saveGame(); }
  hideTip();
  $('dead').hidden = true; $('hud').hidden = true; $('select').hidden = false;
  G = null; P = null; syncPanels(); $('pauseTag').hidden = true;
  renderContinue();
}
$('restart').addEventListener('click', goToHangar);
$('abHangar').addEventListener('click', () => { setMore(false); goToHangar(); });
$('abLang').addEventListener('click', () => { setMore(false); setLang(LANG === 'sk' ? 'en' : 'sk'); });
document.querySelector('.lang-pick').addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); });
$('abModels').addEventListener('click', () => { setModels(!GFX.models); updateHUD(); log(_T`3D modely: ${GFX.models ? _L('zapnuté') : _L('vypnuté')}.`); });
$('abGfx').addEventListener('click', () => { setGfx(GFX.q === 'high' ? 'mid' : GFX.q === 'mid' ? 'low' : 'high'); log(_T`Grafika: ${GFX.q === 'high' ? _L('vysoká (žiara, scenéria, stopy)') : GFX.q === 'mid' ? _L('stredná (bez žiary)') : _L('nízka (menej častíc, bez scenérie)')}.`); updateHUD(); });
$('contracts').addEventListener('click', e => {
  const c = e.target.closest('[data-claim]'), r = e.target.closest('[data-reroll]');
  if (c) claimContract(+c.dataset.claim);
  if (r && !r.disabled) rerollContract(+r.dataset.reroll);
});
$('tiers').addEventListener('click', e => { const el = e.target.closest('[data-tier]'); if (el && !el.disabled) setTier(+el.dataset.tier); });
function renderContinue() {
  const keys = Object.keys(CLASSES), rows = keys.map(c => [c, readSave(c)]).filter(x => x[1]);
  $('cont').hidden = !rows.length;
  $('saves').innerHTML = _T`<span class="eyebrow">Uložení piloti · každá loď má vlastné uloženie</span>` + rows.map(([k, d]) => {
    const c = CLASSES[k], g = d.G || {}, bosses = Object.values(g.bossKills || {}).reduce((a, b) => a + b, 0);
    const para = d.P.para && d.P.para.lvl ? _T` · paragon ${d.P.para.lvl}` : '';
    return _T`<div class="srow"><div class="who"><b style="color:${c.color}">${c.name} · úroveň ${d.P.level}${para}</b>
      <small>${new Date(d.t).toLocaleString('sk-SK')} · svet ${TIERS[g.tier || 1].name} · ${d.P.ore} rudy · bossovia ${bosses} · mýtické ${Object.keys(g.found || {}).length}/${MYTHIC_LIST.length}</small></div>
      <div class="acts"><button type="button" class="btn primary" data-cont="${k}">Pokračovať</button><button type="button" class="btn" data-del="${k}">Zmazať</button></div></div>`;
  }).join('');
  [...$('ships').children].forEach((el, i) => {
    const d = readSave(keys[i]);
    el.querySelector('.launch span').textContent = d ? _T`Pokračovať · úr. ${d.P.level}` : _L('Nová hra');
  });
}
$('saves').addEventListener('click', e => {
  const c = e.target.closest('[data-cont]'), x = e.target.closest('[data-del]');
  if (c) { const d = readSave(c.dataset.cont); if (d) startGame(c.dataset.cont, d); }
  if (x) {
    if (x.dataset.armed !== '1') {
      x.dataset.armed = '1'; x.classList.add('danger'); x.textContent = _L('Potvrdiť zmazanie');
      setTimeout(() => { if (x.isConnected) { x.dataset.armed = ''; x.classList.remove('danger'); x.textContent = _L('Zmazať'); } }, 3000);
      return;
    }
    deleteSave(x.dataset.del); renderContinue();
  }
});
addEventListener('pagehide', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });

addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!G && /^Digit[1-4]$/.test(e.code) && !$('select').hidden) { $('ships').children[+e.code.slice(5) - 1].click(); return; }
  if (!G) return;
  const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
  if (e.code === 'Escape') { if (!$('morePop').hidden) { setMore(false); return; } if (G.panel === 'horde') return; closePanels(); return; }
  if (typing) return;
  if (e.code === 'Backquote') { openPanel('cheat'); return; }
  if (e.code === 'KeyF' && !e.repeat && !G.panel) { G.autoFire = !G.autoFire; log(_T`Auto-boj ${G.autoFire ? _L('zapnutý') : _L('vypnutý')}.`); updateHUD(); return; }
  if (e.code === 'KeyR' && !e.repeat && !G.panel) { G.autoMine = !G.autoMine; log(_T`Auto-ťažba ${G.autoMine ? _L('zapnutá') : _L('vypnutá')}.`); updateHUD(); return; }
  if (e.code === 'KeyI') { openPanel('inv'); return; }
  if (e.code === 'KeyK') { openPanel('tal'); return; }
  if (e.code === 'KeyP') { openPanel('para'); return; }
  if (G.panel === 'horde' && /^Digit[123]$/.test(e.code)) { hordePick(+e.code.slice(5) - 1); return; }
  if (e.code === 'KeyJ') { openPanel('ach'); return; }
  if (e.code === 'KeyH' && !e.repeat && !typing) { goToHangar(); return; }
  if (e.code === 'KeyM') { if (G.panel !== 'map') G.mapSel = G.sector; openPanel('map'); return; }
  if (e.code === 'KeyE' && !e.repeat) {
    if (G.panel === 'station') { closePanels(); return; }
    if (!G.panel && G.interact && G.mode === 'play' && !transitioning) { G.interact.act(); return; }
  }
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat && !G.panel) input.skill[1] = true;
  if (e.code === 'KeyQ' && !e.repeat && !G.panel) input.skill[0] = true;
  if (e.code === 'KeyC' && !e.repeat && !G.panel) input.scan = true;
  if (e.code === 'Space' && !e.repeat && !G.panel && !G.paused) input.dodge = true;
  input.keys[e.code] = true;
});
addEventListener('keyup', e => { input.keys[e.code] = false; });
addEventListener('blur', () => { input.keys = {}; input.fire = false; input.missile = false; });
const synthMouse = () => TOUCH.on && performance.now() - TOUCH.last < 900;
canvas.addEventListener('mousemove', e => { if (synthMouse()) return; input.mx = e.clientX; input.my = e.clientY; });
canvas.addEventListener('mousedown', e => {
  if (!G || G.paused || synthMouse()) return;
  if (e.button === 0) input.fire = true;
  if (e.button === 2) input.missile = true;
});
addEventListener('mouseup', e => { if (synthMouse()) return; if (e.button === 0) input.fire = false; if (e.button === 2) input.missile = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function resize() {
  view.w = innerWidth; view.h = innerHeight; TOUCH.portrait = TOUCH.on && view.h > view.w; view.dpr = Math.min(2, devicePixelRatio || 1);
  // phones see a comparable slice of space to a monitor (touch mode zooms out further)
  view.zoom = TOUCH.on ? clamp(Math.min(view.w, view.h) / 760, 0.5, 1) : clamp(Math.min(view.w, view.h) / 860, 0.6, 1);
  canvas.width = Math.round(view.w * view.dpr); canvas.height = Math.round(view.h * view.dpr);
}
addEventListener('resize', resize);

$('baseBody').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const d = b.dataset;
  if (d.bup) upgradeModule(d.bup);
  else if (d.bcol != null) collectRefinery();
  else if (d.bref != null) refineOre();
  else if (d.bres) startResearch(d.bres);
  else if (d.bexp) startExpedition(d.bexp);
  else if (d.bclaim != null) claimExpedition(+d.bclaim);
  else if (d.bstim) brewStim(d.bstim);
  else if (d.bsmelt != null) smelt(+d.bsmelt);
  else return;
  renderStation(); updateHUD();
});

$('dlgOk').addEventListener('click', () => { G.panel = null; syncPanels(); });
