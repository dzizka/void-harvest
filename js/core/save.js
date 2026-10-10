'use strict';
/* ---------- save / load (per-browser localStorage) ---------- */
const ACC_KEY = 'void-harvest-account-v1', STASH_MAX = 120;
const ACC_ST = () => ({ kills: 0, elites: 0, gates: 0, hunters: 0, events: 0, ore: 0, nm: 0, para: 0, tier: 1, rune: 0, bosses: {}, shipLvl: {} });
let ACC = null;
// a save that cannot be parsed is copied aside instead of being silently overwritten
const SAVE_ISSUES = [];
function backupCorrupt(key, raw) {
  try { localStorage.setItem(key + '-corrupt-' + Date.now(), raw); } catch (e) { /* storage full */ }
  SAVE_ISSUES.push(key);
}
function loadAccount() {
  let a = null, raw = null;
  try { raw = localStorage.getItem(ACC_KEY); } catch (e) { /* storage blocked */ }
  if (raw) { try { a = JSON.parse(raw); } catch (e) { backupCorrupt(ACC_KEY, raw); } }
  ACC = Object.assign({ stash: [], codex: {}, found: {}, ach: {}, title: '', skin: {}, mail: [], itemId: 1 }, a || {});
  ACC.st = Object.assign(ACC_ST(), ACC.st || {});
  ACC.mail = ACC.mail || [];
}
function saveAccount() {
  if (TAB.ro) return;
  ACC.itemId = Math.max(ACC.itemId || 1, ITEM_ID);
  try { localStorage.setItem(ACC_KEY, JSON.stringify(ACC)); } catch (e) { /* ignore */ }
}

/* ---------- one active tab: the tab that starts a game last owns the save ---------- */
const TAB = { id: Math.random().toString(36).slice(2), ro: false };
const TAB_KEY = 'void-harvest-tab';
function claimTab() { TAB.ro = false; try { localStorage.setItem(TAB_KEY, TAB.id + ':' + Date.now()); } catch (e) { /* ignore */ } }
addEventListener('storage', e => {
  if (e.key !== TAB_KEY || !e.newValue || e.newValue.split(':')[0] === TAB.id || !G) return;
  // another tab took over: stop saving here so neither tab overwrites the other
  TAB.ro = true; G.paused = true;
  const el = document.getElementById('tabLock'); if (el) el.hidden = false;
});

/* ---------- rewards never vanish: hold → shared stash → account mail ---------- */
function giveItem(it, silent) {
  if (P.inv.length < HOLD_MAX) { P.inv.push(it); return 'inv'; }
  if (P.stash.length < STASH_MAX) { P.stash.push(it); return 'stash'; }
  ACC.mail.push(it);
  if (!silent) log(_T`<span style="color:#ffd36b">Náklad aj sklad sú plné.</span> ${it.name} čaká v pošte (Inventár).`);
  return 'mail';
}
function claimMail() {
  let n = 0;
  while (ACC.mail.length && P.inv.length < HOLD_MAX) { P.inv.push(ACC.mail.shift()); n++; }
  log(n ? _T`Z pošty vyzdvihnuté: ${n}.` : _L('Náklad je plný – najprv urob miesto.'));
  saveGame();
}

/* ---------- item ids are unique per account (the stash is shared by every ship) ---------- */
function fixItemIds() {
  const all = [...SLOT_ORDER.map(sl => P.equip[sl]).filter(Boolean), ...P.inv, ...ACC.mail];
  let top = Math.max(ITEM_ID, ACC.itemId || 1);
  for (const it of [...all, ...P.stash]) top = Math.max(top, (it.id || 0) + 1);
  ITEM_ID = top;
  // old saves: stash items that clash with this ship's items (or each other) get fresh ids
  const seen = new Set(all.map(it => it.id));
  let fixed = 0;
  for (const it of P.stash) { if (seen.has(it.id)) { it.id = ITEM_ID++; fixed++; } seen.add(it.id); }
  for (const it of all) if (!it.id) it.id = ITEM_ID++;
  ACC.itemId = ITEM_ID;
  return fixed;
}
const shipCol = cls => (ACC && ACC.skin && ACC.skin[cls]) || CLASSES[cls].color;
const SAVE_KEY = 'void-harvest-save-v1';
const saveKey = cls => SAVE_KEY + ':' + cls;   // one save slot per ship
function migrateLegacySave() {
  try {
    const r = localStorage.getItem(SAVE_KEY); if (!r) return;
    const d = JSON.parse(r);
    if (d && d.P && CLASSES[d.P.cls] && !localStorage.getItem(saveKey(d.P.cls))) localStorage.setItem(saveKey(d.P.cls), r);
    localStorage.removeItem(SAVE_KEY);
  } catch (e) { /* ignore */ }
}
function saveGame() {
  if (!G || !P || G.mode !== 'play' || TAB.ro) return;
  saveAccount();
  try {
    localStorage.setItem(saveKey(P.cls), JSON.stringify({ v: 1, t: Date.now(), itemId: ITEM_ID,
      P: { cls: P.cls, skill: P.skill || null, stim: P.stim || null, story: P.story || null, level: P.level, xp: P.xp, points: P.points, ore: P.ore, equip: P.equip, inv: P.inv, tal: P.tal, bestItem: P.bestItem, keys: P.keys, contracts: P.contracts, shards: P.shards, gems: P.gems, stash: [], para: P.para, frags: P.frags, talV: 2, tut: P.tut, tutP: P.tutP, loadouts: P.loadouts || null, curLoadout: P.curLoadout, vaultFrags: P.vaultFrags || 0, refund: P.refund || null },
      G: { bossKills: G.bossKills, tier: G.tier, maxTier: G.maxTier, found: G.found, nmBest: G.nmBest || 0, filter: G.filter || 0, asv: G.asv || null, codex: G.codex || {}, archKills: G.archKills || 0, autoFire: G.autoFire, autoMine: G.autoMine, autoSkill: !!G.autoSkill, storm: G.storm || null, forts: G.forts || {},
           kills: G.kills, mined: G.mined, oreTotal: G.oreTotal, time: G.time } }));
  } catch (e) { /* storage unavailable: play continues unsaved */ }
}
function readSave(cls) {
  let r = null;
  try { r = localStorage.getItem(saveKey(cls)); } catch (e) { return null; }
  if (!r) return null;
  try { return JSON.parse(r); } catch (e) { backupCorrupt(saveKey(cls), r); return null; }
}
function deleteSave(cls) { try { localStorage.removeItem(saveKey(cls)); } catch (e) { /* ignore */ } }
function restoreSave(d) {
  const p = d.P, g = d.G || {};
  P.skill = p.skill || null; P.skCd = null; P.stim = p.stim || null; P.story = p.story || null;
  Object.assign(P, { level: p.level, xp: p.xp, points: p.points, ore: p.ore, equip: p.equip, inv: p.inv || [], tal: p.tal || {}, bestItem: p.bestItem || null, keys: p.keys || [], contracts: p.contracts || [],
    shards: p.shards || 0, gems: p.gems || {}, stash: p.stash || [],
    para: p.para || { lvl: 0, pts: 0, alloc: {}, inf: 0 }, frags: p.frags || {} });
  ensureGems(P);
  P.tut = p.tut != null ? p.tut : p.level >= 8 ? TUT.length : 0; P.tutP = p.tutP || 0;
  P.loadouts = p.loadouts || [null, null, null]; P.curLoadout = p.curLoadout; P.vaultFrags = p.vaultFrags || 0;
  if (p.talV !== 2) {
    // the old shared tree was replaced by per-ship trees: refund every point
    P.tal = {}; P.points = Math.min(P.level, LEVEL_CAP) - 1;
    const msg = _T`<span style="color:#b48cff">Nový strom talentov pre tvoju loď.</span> Body boli vrátené (${P.points}). Stlač K.`, who = P;
    setTimeout(() => { if (P === who) log(msg); }, 600);
  }
  let added = 0;
  for (const sl of SLOT_ORDER) if (!P.equip[sl]) { P.equip[sl] = generateItem(Math.max(1, P.level - 2), 'common', sl, CLASSES[P.cls].start[sl]); added++; }
  if (added) setTimeout(() => log(_T`Nové sloty lode (${added}) dostali základnú výbavu.`), 400);
  KEY_ID = P.keys.reduce((m, k) => Math.max(m, k.id + 1), KEY_ID);
  Object.assign(G, { bossKills: g.bossKills || {}, tier: g.tier || 1, maxTier: g.maxTier || 1, found: g.found || {}, nmBest: g.nmBest || 0, filter: g.filter || 0, asv: g.asv || null, codex: g.codex || {}, archKills: g.archKills || 0,
    autoFire: g.autoFire === true, autoMine: g.autoMine === true, autoSkill: g.autoSkill === true, storm: g.storm || null, forts: g.forts || {}, kills: g.kills || 0, mined: g.mined || 0, oreTotal: g.oreTotal || 0, time: g.time || 0 });
  ITEM_ID = Math.max(ITEM_ID, d.itemId || 1);
  // the game was closed during a paid run (gate key, Architect fragments, map fragments): give the entry back
  const R = p.refund;
  if (R) {
    if (R.key && P.keys.length < 20) P.keys.push(R.key);
    if (R.frags) for (const k in R.frags) P.frags[k] = (P.frags[k] || 0) + R.frags[k];
    if (R.vault) P.vaultFrags = (P.vaultFrags || 0) + R.vault;
    setTimeout(() => log(_L('Hra bola zatvorená počas brány – vstupná cena bola vrátená.')), 700);
  }
  P.refund = null;
  recalcStats(); P.hull = P.stats.maxHull; P.shield = P.stats.maxShield;
}

function startGame(cls, data) {
  G = { mode: 'play', time: 0, kills: 0, mined: 0, oreTotal: 0, shake: 0, panel: null, paused: false, fullMsgT: -9, hudT: 0, mmT: 0,
        sector: 'kepler', dungeon: null, arena: null, station: null, gates: [], bossKills: {}, saved: null, safe: true, bubble: true, interact: null, mapSel: null,
        autoFire: false, autoMine: false, cheat: { god: false, oneHit: false, speed: 1, unlock: false, debug: false, mythBoost: false }, fps: 60,
        tier: 1, maxTier: 1, found: {}, saveT: 15 };
  P = createPlayer(cls);
  if (data) restoreSave(data);
  // shared hangar: one stash, one codex and one mythic archive for every pilot
  Object.assign(ACC.codex, G.codex || {}); Object.assign(ACC.found, G.found || {});
  G.codex = ACC.codex; G.found = ACC.found;
  if (P.stash && P.stash.length && P.stash !== ACC.stash) { ACC.stash.push(...P.stash); log(_T`${P.stash.length} predmetov zo skladu presunutých do spoločného hangára.`); }
  P.stash = ACC.stash;
  claimTab();
  const fixedIds = fixItemIds();
  if (fixedIds) setTimeout(() => log(_T`Sklad: ${fixedIds} predmetov dostalo nové označenie (oprava zostáv).`), 800);
  if (SAVE_ISSUES.length) setTimeout(() => log(_L('<span style="color:#ff6b5a">Uložená hra bola poškodená.</span> Pôvodné dáta sú zálohované v prehliadači, hra pokračuje s novými.')), 900);
  ACC.st.shipLvl[cls] = Math.max(ACC.st.shipLvl[cls] || 0, P.level);
  saveAccount();
  loadSector(data ? 'haven' : 'kepler');
  ensureContracts();
  $('select').hidden = true; $('dead').hidden = true; $('hud').hidden = false;
  $('log').innerHTML = '';
  log(data ? _T`Postup načítaný: ${CLASSES[cls].name}, úroveň ${P.level}, svet ${TIERS[G.tier].name}.` : _T`${CLASSES[cls].name} pripravený pri majáku Kepler-7. V modrom kruhu ťa nikto nenapadne.`);
  log(TOUCH.on ? _L('Brány (G na minimape) vedú k bossom. Mapa a inventár sú vpravo hore, stanica cez tlačidlo pri majáku.') : _L('Brány (G na minimape) vedú k bossom. Mapa: M, stanica: E.'));
  if (TOUCH.on) { if (!data) G.autoFire = G.autoMine = true; touchFullscreen(); log(_L('Ľavým palcom letíš, pravým mieriš a strieľaš. Auto-boj a auto-ťažba sú zapnuté, vypneš ich v Menu (≡).')); }
  else log(_L('Ľavým tlačidlom strieľaš a ťažíš, pravým odpaľuješ rakety. Automatický boj a ťažbu zapneš v Menu (≡).'));
  syncPanels(); updateHUD();
}
