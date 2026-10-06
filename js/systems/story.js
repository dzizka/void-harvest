'use strict';
/* =====================================================================
   STORY & SEASONS
   · Príbeh: 8 chapters told by station NPCs, unlocked by level, each with
     2 objectives built on existing systems (per ship: P.story).
   · Sezóny: 28-day seasons from a fixed epoch. Each season changes one
     mechanic, has a 30-tier season track (season XP from everything you do)
     and a season journey; cosmetics and titles are kept (ACC.season, ACC.cos).
   ===================================================================== */
const NPCS = {
  mara: { name: _L('Veliteľka Mara Kessová'), where: _L('Stanica Haven'), color: '#5fd4ff' },
  ilen: { name: _L('Archivárka Ilen'),        where: _L('Ľadový lom Tessar'), color: '#6fe3ff' },
  vorn: { name: _L('Pašerák Vorn'),           where: _L('neznáma frekvencia'), color: '#ffb000' },
  hlas: { name: _L('Hlas Prázdnoty'),         where: _L('Okraj Prázdnoty'), color: '#e14bff' }
};
const CHAPTERS = [
  { lvl: 1, npc: 'mara', title: _L('Šum v páse'),
    intro: _L('Pilot, tu Mara Kessová z Havenu. Od včera z Pásu Kepler-7 chytáme šum, ktorý neznie ako nič, čo poznáme. Vyčisti okolie od pirátov a skenerom (C) nájdi dátové jadro. Chcem vedieť, kto vysiela.'),
    outro: _L('Dáta sú staršie než Haven. Opakuje sa v nich jeden podpis: trojuholník v kruhu. Archivárka Ilen tvrdí, že ho už videla – na lodiach strážcov v Rubínovej hmlovine.'),
    steps: [{ t: 'kill', sec: 'kepler', n: 15, txt: _L('Zostreľ 15 nepriateľov v Kepler-7 Páse') }, { t: 'anom', k: 'core', n: 1, txt: _L('Nájdi skenerom (C) dátové jadro a stiahni dáta') }],
    rw: { shards: 10, item: 'rare' } },
  { lvl: 8, npc: 'mara', title: _L('Žeravá stopa'),
    intro: _L('Strážca brány v Rubínovej hmlovine nie je obyčajný pirát. Nosí ten istý znak. Preraz jeho bránu a prines, čo z neho ostane.'),
    outro: _L('Vo vraku strážcu sme našli kúsok navigačného kľúča. Niekto stavia brány po celej hviezdokope – a nie sú to ľudia.'),
    steps: [{ t: 'visit', sec: 'ruby', txt: _L('Preleť do Rubínovej hmloviny') }, { t: 'gate', sec: 'ruby', n: 1, txt: _L('Porazte strážcu brány v Rubínovej hmlovine') }],
    rw: { shards: 15, item: 'legendary' } },
  { lvl: 12, npc: 'ilen', title: _L('Hlasy predkov'),
    intro: _L('Som Ilen, archivárka z Tessaru. Ten znak patrí Predkom – civilizácii, ktorá tu žila dávno pred nami. Ich majáky stále stoja. Príď do Tessaru a zapáľ dva z nich, možno prehovoria.'),
    outro: _L('Majáky hovoria o Architektovi – o Predkovi, ktorý odmietol zomrieť. Stavia brány, aby nakŕmil Prázdnotu a znovu sa zrodil. Každá jeho brána nás stojí kus vesmíru.'),
    steps: [{ t: 'dock', sec: 'tessar', txt: _L('Dokuj v Ľadovom lome Tessar') }, { t: 'beacon', n: 2, txt: _L('Aktivuj 2 majáky predkov') }],
    rw: { shards: 15, mats: { crystal: 15 } } },
  { lvl: 16, npc: 'vorn', title: _L('Mŕtve pole'),
    intro: _L('Vorn, obchodník. Dobre, pašerák, nebudeme si klamať. Mŕtve pole Vex obsadili jeho lode a moje trasy sú preč. Osloboď pevnosť a zostreľ ten ich Dreadnought. Platím dobre.'),
    outro: _L('Dreadnought viezol živé jadrá z Bárijského roja. Architekt tam pestuje niečo, čo žije. Odtiaľto ďalej ti už neporadím – ja sa tam neodvážim.'),
    steps: [{ t: 'fort', sec: 'vex', txt: _L('Osloboď pevnosť v Mŕtvom poli Vex') }, { t: 'gate', sec: 'vex', n: 1, txt: _L('Porazte Dreadnought Vex v jeho bráne') }],
    rw: { shards: 20, item: 'legendary', mats: { plasma: 10 } } },
  { lvl: 26, npc: 'ilen', title: _L('Srdce roja'),
    intro: _L('Bárijský roj je jeden veľký úľ a kráľovná v jeho strede je Architektovým hlasom. Preskúmaj tamojšie anomálie, nájdi cestu k nej a umlč ju.'),
    outro: _L('Kráľovná pred smrťou vyslala signál na Okraj. Architekt vie, že prichádzaš. A Herkules sa medzitým rozpadá – Prázdnota žerie celú hviezdu.'),
    steps: [{ t: 'anom', sec: 'baria', n: 3, txt: _L('Preskúmaj 3 anomálie v Bárijskom roji') }, { t: 'gate', sec: 'baria', n: 1, txt: _L('Porazte Úľovú kráľovnú') }],
    rw: { shards: 25, item: 'legendary', mats: { dark: 10 } } },
  { lvl: 36, npc: 'vorn', title: _L('Kolaps'),
    intro: _L('Herkules sa zrúti. Moji ľudia tam majú stanicu, ktorú obsadil Architekt. Vyčisti sektor a vráť nám ju, nech môžeme evakuovať. Tentoraz zadarmo.'),
    outro: _L('Evakuácia hotová, ďakujem. A ešte niečo – v pevnosti boli súradnice. Okraj Prázdnoty. Tam sa to celé končí.'),
    steps: [{ t: 'kill', sec: 'hercules', n: 60, txt: _L('Zostreľ 60 nepriateľov v Kolapse Herkules') }, { t: 'fort', sec: 'hercules', txt: _L('Osloboď pevnosť v Kolapse Herkules') }],
    rw: { shards: 30, item: 'legendary', mats: { dark: 15 } } },
  { lvl: 46, npc: 'hlas', title: _L('Okraj'),
    intro: _L('…pilot… počuješ ma? Som to, čo zostalo z Predkov. Architekt ma väzní na Okraji. Zapáľ naše posledné majáky a zabi Leviatana, ktorý stráži jeho trhlinu.'),
    outro: _L('Cesta je otvorená. Zbieraj úlomky od bossov hviezdokopy – štyri kľúče otvoria Trhlinu Architekta. Ponáhľaj sa, kým nás Prázdnota nezje všetkých.'),
    steps: [{ t: 'beaconSec', sec: 'rim', n: 2, txt: _L('Aktivuj oba majáky predkov na Okraji Prázdnoty') }, { t: 'gate', sec: 'rim', n: 1, txt: _L('Porazte Prázdnotného Leviatana') }],
    rw: { shards: 40, item: 'legendary', mats: { exotic: 8 } } },
  { lvl: 50, npc: 'mara', title: _L('Architekt'),
    intro: _L('Všetko, čo sme sa dozvedeli, vedie k nemu. Otvor Trhlinu Architekta a ukonči to. Haven je s tebou, pilot.'),
    outro: _L('Architekt padol. Prázdnota sa stiahla – no nikdy nezmizne celkom. Brány sa budú otvárať ďalej a niekto ich musí strážiť. Vitaj medzi strážcami Keplera.'),
    steps: [{ t: 'arch', n: 1, txt: _L('Porazte Architekta Prázdnoty v jeho trhline') }],
    rw: { shards: 60, set: true, title: _L('Strážca Keplera') } }
];
function storyState() { if (!P.story) P.story = { ch: 0, step: 0, prog: 0, shown: false, done: false }; return P.story; }
const curStep = () => { const S = storyState(), C = CHAPTERS[S.ch]; return !S.done && C && S.shown ? C.steps[S.step] : null; };

/* ---------- seasons ---------- */
const SEASON_EPOCH = Date.UTC(2026, 9, 5), SEASON_LEN = 28 * 86400000, SEASON_TIER = 100, SEASON_TIERS = 30;
const SEASON_MODS = [
  { k: 'storm',   name: _L('Sezóna búrok'),      txt: _L('Búrka Prázdnoty prichádza každých 8 minút a dáva o 25 % viac žiary.') },
  { k: 'elites',  name: _L('Sezóna elít'),       txt: _L('Elity sa objavujú o 50 % častejšie a každá pustí jeden predmet navyše.') },
  { k: 'greater', name: _L('Sezóna hviezd'),     txt: _L('Väčšie afixy ✦ padajú dvakrát častejšie.') },
  { k: 'gold',    name: _L('Sezóna zlata'),      txt: _L('O 50 % viac rudy a materiálov.') }
];
const seasonIdx = () => Math.max(0, Math.floor((Date.now() - SEASON_EPOCH) / SEASON_LEN));
const seasonMod = k => SEASON_MODS[seasonIdx() % SEASON_MODS.length].k === k;
const SEASON_JOURNEY = [
  { id: 'kill',  n: 1000, sxp: 60,  txt: _L('Zostreľ 1 000 nepriateľov') },
  { id: 'elite', n: 100,  sxp: 60,  txt: _L('Zostreľ 100 elít') },
  { id: 'gate',  n: 15,   sxp: 80,  txt: _L('Porazte 15 bossov v bránach') },
  { id: 'storm', n: 5,    sxp: 60,  txt: _L('Otvor 5 prekliatych truhlíc') },
  { id: 'horde', n: 3,    sxp: 100, txt: _L('Dokonči Hordu Prázdnoty 3×') },
  { id: 'fort',  n: 3,    sxp: 80,  txt: _L('Osloboď 3 pevnosti') },
  { id: 'anom',  n: 15,   sxp: 60,  txt: _L('Preskúmaj 15 anomálií') },
  { id: 'beacon', n: 3,   sxp: 60,  txt: _L('Aktivuj 3 majáky predkov') },
  { id: 'arch',  n: 1,    sxp: 150, txt: _L('Porazte Architekta Prázdnoty') }
];
function seasonState() {
  ACC.cos = ACC.cos || {}; ACC.titles = ACC.titles || [];
  const id = seasonIdx() + 1;
  if (!ACC.season || ACC.season.id !== id) ACC.season = { id, sxp: 0, claimed: {}, c: {}, jd: {} };
  return ACC.season;
}
function seasonReward(t) {
  const sid = seasonState().id;
  if (t === 10) return { skin: 's' + sid + 'a', txt: _L('Sezónna farba lode') };
  if (t === 20) return { title: _T`Veterán ${sid}. sezóny`, txt: _L('Sezónny titul') };
  if (t === 30) return { skin: 's' + sid + 'b', title: _T`Šampión ${sid}. sezóny`, leg: 2, txt: _L('Farba, titul a 2 legendárky') };
  if (t % 5 === 0) return { leg: 1, txt: _L('Legendárny predmet') };
  return t % 2 ? { shards: 10, txt: _L('10 úlomkov') } : { mats: 6, txt: _L('6 z každého materiálu') };
}
function claimSeason(t) {
  const S = seasonState();
  if (S.claimed[t] || Math.floor(S.sxp / SEASON_TIER) < t) return;
  S.claimed[t] = true;
  const R = seasonReward(t), il = Math.min(P.level, LEVEL_CAP) + TIERS[G.tier].lvl + 2;
  if (R.shards) P.shards += R.shards;
  if (R.mats) for (const k of MAT_KEYS) giveMat(k, R.mats);
  if (R.leg) for (let i = 0; i < R.leg; i++) storyGiveItem(generateItem(il, 'legendary'));
  if (R.skin) ACC.cos[R.skin] = true;
  if (R.title && !ACC.titles.includes(R.title)) ACC.titles.push(R.title);
  log(_T`<span style="color:#ffd36b">Sezónna odmena ${t}:</span> ${R.txt}.`);
  saveAccount(); saveGame();
}
function seasonXp(n) { if (!ACC) return; const S = seasonState(), t0 = Math.floor(S.sxp / SEASON_TIER); S.sxp += n; const t1 = Math.floor(S.sxp / SEASON_TIER); if (t1 > t0 && t1 <= SEASON_TIERS) { addText(P.x, P.y - 46, _T`SEZÓNA · STUPEŇ ${t1}`, '#ffd36b', 13, 1.4); log(_T`Sezóna: dosiahnutý stupeň ${t1}. Odmenu vyzdvihneš v Denníku (J).`); } }
function seasonCount(id, n) {
  const S = seasonState(); S.c[id] = (S.c[id] || 0) + n;
  const J = SEASON_JOURNEY.find(j => j.id === id);
  if (J && !S.jd[id] && S.c[id] >= J.n) { S.jd[id] = true; seasonXp(J.sxp); banner(_T`<span style="color:#ffd36b">Sezónna cesta</span><small>${J.txt} · +${J.sxp} sezónnych bodov</small>`); }
}

/* ---------- events from the rest of the game ---------- */
function gameEvent(type, d) {
  d = d || {};
  // season
  const SXP = { kill: 0.1, elite: 2, gate: 15, storm: 10, horde: 40, fort: 30, beacon: 20, anom: 5, arch: 60 };
  if (SXP[type]) seasonXp(type === 'kill' && d.elite ? SXP.elite : SXP[type]);
  if (type === 'kill') { seasonCount('kill', 1); if (d.elite) seasonCount('elite', 1); } else if (SXP[type]) seasonCount(type, 1);
  // story
  const st = curStep(); if (!st) return;
  const match = (st.t === type || (st.t === 'beaconSec' && type === 'beacon')) && (!st.sec || st.sec === d.sec) && (!st.k || st.k === d.kind);
  if (match) storyProgress(1);
}
function storyProgress(n) {
  const S = storyState(), C = CHAPTERS[S.ch], st = C.steps[S.step];
  S.prog += n;
  if (S.prog >= (st.n || 1)) {
    S.step++; S.prog = 0;
    if (S.step >= C.steps.length) finishChapter();
    else { banner(_T`<span style="color:${NPCS[C.npc].color}">${C.title}</span><small>${C.steps[S.step].txt}</small>`); log(_T`Príbeh · nová úloha: ${C.steps[S.step].txt}`); }
  }
  saveGame();
}
function storyGiveItem(it) { if (P.inv.length < 30) P.inv.push(it); else if (P.stash.length < STASH_MAX) P.stash.push(it); }
function finishChapter() {
  const S = storyState(), C = CHAPTERS[S.ch], R = C.rw, il = Math.min(P.level, LEVEL_CAP) + TIERS[G.tier].lvl + 1;
  if (R.shards) P.shards += R.shards;
  if (R.item) storyGiveItem(generateItem(il, R.item));
  if (R.mats) for (const k in R.mats) giveMat(k, R.mats[k]);
  if (R.set) dropSet(P.x, P.y, il);
  if (R.title) { ACC.titles = ACC.titles || []; if (!ACC.titles.includes(R.title)) ACC.titles.push(R.title); saveAccount(); }
  if (P.level < LEVEL_CAP) gainXp(xpNeed(P.level) * 0.2 / (P.stats.xpMult * TIERS[G.tier].xp));
  S.dlg = { ch: S.ch, outro: true };
  S.ch++; S.step = 0; S.prog = 0; S.shown = false;
  if (S.ch >= CHAPTERS.length) S.done = true;
  openDialog();
}
function tickStory(dt) {
  const S = storyState();
  if ((G.storyT = (G.storyT || 0) - dt) > 0) return;
  G.storyT = 0.5;
  seasonState();
  if (G.panel || transitioning || G.mode !== 'play') return;
  if (!S.done && !S.shown && CHAPTERS[S.ch] && P.level >= CHAPTERS[S.ch].lvl && !G.dungeon) { S.shown = true; S.dlg = { ch: S.ch, outro: false }; openDialog(); return; }
  const st = curStep(); if (!st) return;
  // objectives that are states rather than events
  if (st.t === 'visit' && !G.dungeon && G.sector === st.sec) storyProgress(1);
  else if (st.t === 'fort' && fortFree(st.sec)) storyProgress(1);
  else if (st.t === 'beacon' && Object.keys(ACC.beacons || {}).length >= st.n) storyProgress(st.n);
  else if (st.t === 'beaconSec' && beaconList(st.sec).filter(B => beaconOn(B.id)).length >= st.n) storyProgress(st.n);
}

/* ---------- dialog ---------- */
function openDialog() { G.panel = 'dlg'; syncPanels(); }
function renderDialog() {
  const S = storyState(), D = S.dlg || { ch: Math.min(S.ch, CHAPTERS.length - 1), outro: false }, C = CHAPTERS[D.ch], N = NPCS[D.outro && D.ch === CHAPTERS.length - 1 ? 'hlas' : C.npc];
  $('dlgWho').innerHTML = _T`<span style="color:${N.color}">${N.name}</span> · ${N.where}`;
  $('dlgTitle').textContent = _T`Kapitola ${D.ch + 1} · ${C.title}`;
  $('dlgText').textContent = D.outro ? C.outro : C.intro;
  $('dlgObj').innerHTML = D.outro ? _T`<b>Kapitola dokončená.</b> Odmena: ${storyRewardTxt(C.rw)}` : _T`<b>Úlohy:</b> ${C.steps.map(s => s.txt).join(' → ')}`;
}
function storyRewardTxt(R) {
  const out = [];
  if (R.shards) out.push(_T`${R.shards} úlomkov`);
  if (R.item) out.push(R.item === 'legendary' ? _L('legendárny predmet') : _L('vzácny predmet'));
  if (R.mats) for (const k in R.mats) out.push(`${R.mats[k]} ${MATS[k].name}`);
  if (R.set) out.push(_L('kus setu'));
  if (R.title) out.push(_T`titul „${R.title}“`);
  out.push(_L('skúsenosti'));
  return out.join(' · ');
}

/* ---------- journal tabs ---------- */
function renderStoryTab() {
  const S = storyState();
  return _T`<div class="story-list">${CHAPTERS.map((C, i) => {
    const done = S.done || i < S.ch, cur = i === S.ch && !S.done, locked = !done && !cur;
    const N = NPCS[C.npc], st = cur && S.shown ? C.steps[S.step] : null;
    return _T`<div class="story-ch ${done ? 'done' : ''} ${cur ? 'cur' : ''} ${locked ? 'locked' : ''}">
      <div class="sc-top"><b>${i + 1}. ${C.title}</b><small>${locked ? _T`od úrovne ${C.lvl}` : `<span style="color:${N.color}">${N.name}</span>`}</small></div>
      ${locked ? '' : `<p>${C.intro}</p>`}
      ${st ? _T`<p class="obj">▸ ${st.txt} <b>${Math.min(S.prog, st.n || 1)}/${st.n || 1}</b></p>` : ''}
      ${cur && !S.shown ? _T`<p class="obj">▸ Kapitola začne na úrovni ${C.lvl} (mimo brány).</p>` : ''}
      ${done ? `<p class="outro">${C.outro}</p>` : ''}</div>`;
  }).join('')}</div>`;
}
function renderSeasonTab() {
  const S = seasonState(), M = SEASON_MODS[seasonIdx() % SEASON_MODS.length];
  const end = SEASON_EPOCH + (seasonIdx() + 1) * SEASON_LEN, days = Math.max(0, Math.ceil((end - Date.now()) / 86400000));
  const tier = Math.min(SEASON_TIERS, Math.floor(S.sxp / SEASON_TIER)), into = S.sxp % SEASON_TIER;
  const tiers = Array.from({ length: SEASON_TIERS }, (_, k) => {
    const t = k + 1, R = seasonReward(t), got = S.claimed[t], open = tier >= t;
    return _T`<button type="button" class="stier ${got ? 'got' : open ? 'open' : ''} ${R.skin || R.title ? 'big' : ''}" data-sclaim="${t}" ${open && !got ? '' : 'disabled'} title="${R.txt}"><b>${t}</b><small>${R.txt}</small></button>`;
  }).join('');
  const jour = SEASON_JOURNEY.map(J => { const v = Math.min(J.n, S.c[J.id] || 0); return _T`<div class="crow ${S.jd[J.id] ? 'done' : ''}"><div class="ct"><b>${J.txt}</b><div class="bar"><i style="width:${(v / J.n * 100).toFixed(0)}%"></i></div><small>${fmtN(v)}/${fmtN(J.n)} · +${J.sxp} sezónnych bodov</small></div></div>`; }).join('');
  return _T`<div class="season-head"><div><span class="eyebrow">${S.id}. sezóna · končí o ${days} dní</span><h3>${M.name}</h3><p>${M.txt}</p></div>
      <div class="season-tier"><b>${tier}</b>/${SEASON_TIERS}<div class="bar"><i style="width:${tier >= SEASON_TIERS ? 100 : into}%"></i></div><small>${Math.floor(into)}/${SEASON_TIER} bodov do ďalšieho stupňa · body za zabitia, elity, bossov, búrky, hordu, pevnosti, majáky a anomálie</small></div></div>
    <div class="stiers">${tiers}</div>
    <span class="eyebrow" style="margin-top:14px;display:block">Sezónna cesta</span>
    <div class="ach-grid">${jour}</div>`;
}
