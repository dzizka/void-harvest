'use strict';
/* ---------- challenge journal (account-wide) ---------- */
const BOSS6 = ['brood', 'warden', 'dread', 'queen', 'gravit', 'leviathan'];
const ACH = [
  { id: 'beacons',  desc: _L('Aktivuj všetkých 14 majákov predkov'), n: 14, v: () => ACC.st.beacons || 0, sh: 30, title: _L('Strážca predkov') },
  { id: 'anoms25',  desc: _L('Preskúmaj 25 anomálií'), n: 25, v: () => ACC.st.anoms || 0, sh: 15, title: _L('Prieskumník') },
  { id: 'storm10',  desc: _L('Otvor 10 prekliatych truhlíc v Búrke Prázdnoty'), n: 10, v: () => ACC.st.stormChests || 0, sh: 15, title: _L('Lovec búrok') },
  { id: 'forts6',   desc: _L('Osloboď všetkých 6 pevností jednou loďou'), n: 6, v: () => ACC.st.forts || 0, sh: 30, title: _L('Osloboditeľ') },
  { id: 'horde5',   desc: _L('Dokonči Hordu Prázdnoty 5×'), n: 5, v: () => ACC.st.hordes || 0, sh: 25, title: _L('Krotiteľ hordy') },
  { id: 'kill1k',   desc: _L('Zostreľ 1 000 nepriateľov'),                 n: 1000,  v: () => ACC.st.kills,   sh: 10, title: _L('Lovec') },
  { id: 'kill10k',  desc: _L('Zostreľ 10 000 nepriateľov'),                n: 10000, v: () => ACC.st.kills,   sh: 30, title: _L('Metla Prázdnoty') },
  { id: 'elite100', desc: _L('Zostreľ 100 elít'),                          n: 100,   v: () => ACC.st.elites,  sh: 15, title: _L('Krotiteľ elít') },
  { id: 'gate25',   desc: _L('Dokonči 25 brán s bossom'),                  n: 25,    v: () => ACC.st.gates,   sh: 15, title: _L('Strážca brán') },
  { id: 'boss6',    desc: _L('Poraz všetkých 6 bossov sektorov'),          n: 6,     v: () => BOSS6.filter(k => ACC.st.bosses[k]).length, sh: 25, title: _L('Kráľobijca') },
  { id: 'arch',     desc: _L('Poraz Architekta Prázdnoty'),                n: 1,     v: () => ACC.st.bosses.architect ? 1 : 0, sh: 30, title: _L('Rozbíjač trhlín') },
  { id: 'lvl50',    desc: _L('Dosiahni úroveň 50'),                        n: 50,    v: () => Math.max(0, ...Object.values(ACC.st.shipLvl)), sh: 20, title: _L('Veterán') },
  { id: 'ships',    desc: _L('Dosiahni úroveň 20 so všetkými 4 loďami'),   n: 4,     v: () => Object.values(ACC.st.shipLvl).filter(l => l >= 20).length, sh: 25, title: _L('Admirál') },
  { id: 'para50',   desc: _L('Dosiahni paragon 50'),                       n: 50,    v: () => ACC.st.para,    sh: 25, title: _L('Hviezdny pútnik') },
  { id: 'tier4',    desc: _L('Odomkni svetovú úroveň IV'),                 n: 4,     v: () => ACC.st.tier,    sh: 25, title: _L('Pekelník') },
  { id: 'nm10',     desc: _L('Dokonči nočnú bránu 10 v limite'),           n: 10,    v: () => ACC.st.nm,      sh: 15, title: _L('Nočný jazdec') },
  { id: 'nm25',     desc: _L('Dokonči nočnú bránu 25 v limite'),           n: 25,    v: () => ACC.st.nm,      sh: 25, title: _L('Pán nočných môr') },
  { id: 'nm50',     desc: _L('Dokonči nočnú bránu 50 v limite'),           n: 50,    v: () => ACC.st.nm,      sh: 50, title: _L('Nesmrteľný') },
  { id: 'flawless', desc: _L('Dokonči nočnú bránu 20+ bez zásahu do trupu'), n: 1,   v: () => ACC.st.flawless ? 1 : 0, sh: 30, title: _L('Nedotknuteľný') },
  { id: 'myth1',    desc: _L('Nájdi mýtický predmet'),                     n: 1,     v: () => Object.keys(ACC.found).length, sh: 15, title: _L('Mýtonosič') },
  { id: 'mythAll',  desc: _L('Nájdi všetkých 6 mýtických predmetov'),      n: 6,     v: () => Object.keys(ACC.found).length, sh: 50, title: _L('Strážca mýtov') },
  { id: 'set4',     desc: _L('Nasaď kompletný set (4 kusy)'),              n: 1,     v: () => ACC.st.set4 ? 1 : 0, sh: 20, title: _L('Dedič') },
  { id: 'rune30',   desc: _L('Vylepši hviezdnu runu na úroveň 30'),         n: 30,    v: () => ACC.st.rune,    sh: 40, title: _L('Runotvorca') },
  { id: 'ore1m',    desc: _L('Nazbieraj spolu 1 000 000 rudy'),            n: 1e6,   v: () => ACC.st.ore,     sh: 20, title: _L('Magnát') },
  { id: 'hunters',  desc: _L('Zlikviduj 25 pomenovaných lovcov'),          n: 25,    v: () => ACC.st.hunters, sh: 20, title: _L('Lovec hláv') },
  { id: 'climb25',  desc: _L('Dosiahni 25. poschodie Výstupu do Prázdnoty'), n: 25, v: () => ACC.st.climb || 0, sh: 30, title: _L('Horolezec hlbín') },
  { id: 'climb50',  desc: _L('Dosiahni 50. poschodie Výstupu do Prázdnoty'), n: 50, v: () => ACC.st.climb || 0, sh: 60, title: _L('Pán Prázdnoty') },
  { id: 'vault10',  desc: _L('Otvor 10 trezorov pašerákov'),              n: 10,    v: () => ACC.st.vaults || 0, sh: 20, title: _L('Lupič trezorov') },
  { id: 'rush',     desc: _L('Dokonči Arénu veliteľov'),                  n: 1,     v: () => ACC.st.rush ? 1 : 0, sh: 25, title: _L('Gladiátor') },
  { id: 'rush5',    desc: _L('Dokonči Arénu veliteľov pod 5:00'),          n: 1,     v: () => ACC.st.rush && ACC.st.rush < 300 ? 1 : 0, sh: 40, title: _L('Krvavý šampión') },
  { id: 'weekly20', desc: _L('Dosiahni 20. poschodie týždennej výzvy'),    n: 20,    v: () => ACC.st.weekly || 0, sh: 30, title: _L('Týždenný hrdina') },
  { id: 'wb5',      desc: _L('Poraz 5 svetových bossov'),                  n: 5,     v: () => ACC.st.wb || 0, sh: 25, title: _L('Hviezdožrútobijca') },
  { id: 'events',   desc: _L('Dokonči 25 svetových udalostí'),             n: 25,    v: () => ACC.st.events,  sh: 20, title: _L('Záchranca') }
];
const SKINS = [
  { n: 0,  name: _L('Pôvodná'), c: null },
  { n: 3,  name: _L('Zlatá'), c: '#ffd36b' },
  { n: 6,  name: _L('Karmínová'), c: '#ff5f6d' },
  { n: 9,  name: _L('Ľadová'), c: '#bfefff' },
  { n: 12, name: _L('Prázdnota'), c: '#e14bff' },
  { n: 16, name: _L('Biela hviezda'), c: '#ffffff' }
];
const SEASON_SKIN_COLS = ['#ff9a3c', '#7ee0a8', '#c86bff', '#ff5f9e', '#6fe3ff', '#e8f06b'];
function allSkins() {
  return SKINS.concat(Object.keys(ACC.cos || {}).map(k => { let h = 0; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) % 997; return { n: 0, name: _L('Sezónna farba'), c: SEASON_SKIN_COLS[h % SEASON_SKIN_COLS.length] }; }));
}
function checkAch() {
  const st = ACC.st;
  st.shipLvl[P.cls] = Math.max(st.shipLvl[P.cls] || 0, P.level);
  st.para = Math.max(st.para, P.para.lvl); st.tier = Math.max(st.tier, G.maxTier);
  if (Object.values(P.stats.sets || {}).some(n => n >= 4)) st.set4 = 1;
  st.rune = Math.max(st.rune, ...Object.values(P.para.rl || {}), 0);
  for (const A of ACH) {
    if (ACC.ach[A.id] || A.v() < A.n) continue;
    ACC.ach[A.id] = Date.now(); P.shards += A.sh;
    banner(_T`Výzva splnená<small>${A.desc} · titul „${A.title}“ · +${A.sh} úlomkov</small>`);
    log(_T`<span style="color:#ffd36b">Výzva splnená:</span> ${A.desc} (+${A.sh} úlomkov, titul ${A.title}).`);
    const n = Object.keys(ACC.ach).length, sk = SKINS.find(k => k.n === n);
    if (sk && sk.c) log(_T`Nová farba lode: <span style="color:${sk.c}">${sk.name}</span> (Denník, J).`);
    saveAccount();
  }
}
function renderEnc() {
  const il = maxIlvlNow(), cls = P.cls, legM = TIERS[G.tier].leg;
  const it0 = r => ({ ilvl: il, rarity: r, anc: false }), itA = r => ({ ilvl: il, rarity: r, anc: true }), itS = r => ({ ilvl: il, rarity: r, anc: true });
  const rr = (it, k) => { const r = affixRange(it, k); return `${r[0]}–${r[1]}`; };
  const slotsTxt = k => AFFIXES[k].slots.length === ALL.length ? _L('všetky') : AFFIXES[k].slots.map(sl => SLOTS[sl].name.split(' ')[0]).join(', ');
  const tierRows = [1, 2, 3, 4].map(t => `<tr><td>${TIERS[t].name}</td><td class="n">${Math.min(P.level, LEVEL_CAP) + TIERS[t].lvl + 4}</td><td class="n">${TIERS[t].req || '—'}</td><td class="n">×${TIERS[t].leg}</td><td class="n">${Math.round(TIERS[t].anc * 100)} %</td><td class="n">${TIERS[t].myth ? '×' + TIERS[t].myth : '—'}</td></tr>`).join('');
  const pct = v => (Math.round(v * 10) / 10).toString().replace('.', DEC) + ' %';
  const legs = LEGEND_POOL.filter(l => !l.cls || l.cls === cls);
  return _T`<div class="enc">
    <section><h3>Afixy · rozsahy na iLvl ${il}</h3>
      <p class="note" style="margin-bottom:8px">iLvl ${il} je najvyšší, aký ti teraz padá (tvoja úroveň + svet + hlbina III). Každý iLvl pridá afixom +5 % (Plošné poškodenie a Výnos ťažby +1,2 %). Pradávne +20 %, legendárne, setové a mýtické +15 %, väčší afix ✦ ×1,5 (vo svete IV 5 % na riadok). Mýtické majú vždy maximum.</p>
      <table><tr><th>Afix</th><th>Sloty</th><th>Vzácny</th><th>Legendárny</th><th>Pradávny leg.</th><th>✦ väčší (prad.)</th><th>Mýtický</th></tr>
      ${AFFIX_ORDER.map(k => `<tr><td>${AFFIXES[k].label('').replace(/^\+%?\s*/, '')}</td><td>${slotsTxt(k)}</td><td class="n">${rr(it0('rare'), k)}</td><td class="n">${rr(it0('legendary'), k)}</td><td class="n">${rr(itA('legendary'), k)}</td><td class="n">${(r => r[0] + '–' + r[1])(affixRange(itS('legendary'), k, true))}</td><td class="n">${affixRange(it0('mythic'), k)[1]}</td></tr>`).join('')}</table></section>
    <section><h3>Svetové úrovne</h3>
      <table><tr><th>Svet</th><th>Max iLvl</th><th>Úroveň</th><th>Legendárky</th><th>Pradávne</th><th>Mýtické</th></tr>${tierRows}</table>
      <p class="note" style="margin-top:6px">Nočné brány pridávajú +1 úroveň nepriateľov (a iLvl) za každé 3 úrovne kľúča. Výstup do Prázdnoty dáva iLvl podľa tvojej úrovne.</p></section>
    <section><h3>Kde čo padá</h3>
      <table><tr><th>Korisť</th><th>Zdroj a šanca (svet ${TIERS[G.tier].roman})</th></tr>
        <tr><td>Legendárky</td><td>bežný nepriateľ ${pct(0.8 * legM)} · tvrdší ${pct(2.5 * legM)} · elita a boss ${pct(8 * legM)} za predmet · boss brány 35 % (prvé víťazstvo 100 %) · lovec 100 % · Hviezdožrút 2× · Výstup 1 + 1 za 10 poschodí · burza</td></tr>
        <tr><td>Sety</td><td>boss brány: svet II 15 %, III–IV 25 % (+1 % za úroveň nočnej brány) · Architekt 100 % · Hviezdožrút 50 % (od sveta II) · Výstup od 15. poschodia 50 %</td></tr>
        <tr><td>Prvotné</td><td>pradávna legendárka alebo set so všetkými hodmi na maxime: Výstup od 30. poschodia 5 % + 0,5 % za poschodie · nočné brány 50+ vo svete IV 5 % · Architekt vo svete IV 1 garantovaný</td></tr>
        <tr><td>Pradávne</td><td>rare, legendárne a setové predmety: svet II 5 %, III 15 %, IV 35 % (+1 % za úroveň nočnej brány) · všetky hodnoty +20 % · mýtické sú pradávne vždy · v inventári zlatý roh</td></tr>
        <tr><td>Väčšie afixy ✦</td><td>každý riadok legendárky, setu a mýtu (rare polovica): svet II 1,5 %, III 4 %, IV 8 % (teraz ${pct(gaChance('legendary') * 100)}) · +0,05 % za úroveň nočnej brány, +0,1 % za poschodie Výstupu, Aréna +1 % · hodnota ×1,5 · mýtus má 1 vždy · prekovanie riadku: šanca ${pct(gaRerollChance({ rarity: 'legendary' }) * 100)} na väčší afix</td></tr>
        <tr><td>Mýtické</td><td>${MYTHIC_LIST.map(m => `${m.name}: ${m.source}`).join(' · ')} · navyše Architekt 10 %, Hviezdožrút 4 % × svet, Výstup od 20. poschodia</td></tr>
        <tr><td>Runy</td><td>nočná brána v limite 25 % + 1 % za úroveň · Architekt 100 % · Hviezdožrút 30 % · Výstup 20 % + 1 % za poschodie</td></tr>
        <tr><td>Drahokamy</td><td>kryštálové asteroidy 4 % · boss brány 60 % · žiarivý kryštál · lovec · Architekt · Hviezdožrút · Výstup · burza</td></tr>
        <tr><td>Úlomky Architekta</td><td>${FRAG_BOSSES.map(k => BOSSES[k].name).join(', ')}: svet II 40 %, III–IV a nočné brány 10+ vždy</td></tr>
        <tr><td>Úlomky mapy</td><td>elity 8 % (od úrovne 15) · 5 úlomkov otvorí Trezor pašerákov</td></tr>
        <tr><td>Kľúče</td><td>elity 12 % (v nočnej bráne 20 %) · boss brány · lovec 60 % · Hviezdožrút · burza</td></tr>
      </table></section>
    <section><h3>Lov na veliteľov (${CLASSES[cls].name})</h3>
      <p class="note" style="margin-bottom:8px">Boss brány dá legendárku s 50 % šancou (prvé víťazstvo vždy) a v 70 % prípadov je z jeho tabuľky. Kus setu je v 60 % prípadov z jeho setu.</p>
      <table><tr><th>Boss</th><th>Sektor</th><th>Legendárky</th><th>Set</th></tr>
      ${BOSS_ORDER.map(k => { const L = bossLoot(k, cls), sec = Object.keys(SECTORS).find(id => SECTORS[id].boss === k); return `<tr><td style="color:${BOSSES[k].color}">${BOSSES[k].name}</td><td>${SECTORS[sec].name}</td><td>${L.legs.map(id => `${(G.codex || {})[id] ? '✓ ' : ''}${LEGEND_INDEX[id].name}`).join(', ')}</td><td style="color:${L.branch.color}">${setName(L.set)}</td></tr>`; }).join('')}</table></section>
    <section><h3>Legendárky (${CLASSES[cls].name}) · kódex ${legs.filter(l => (G.codex || {})[l.id]).length}/${legs.length}</h3>
      <div class="lg">${legs.map(l => `<div style="--rc:${l.build ? TBRANCH[l.cls + ':' + l.build].color : RARITY.legendary.color}"><b>${(G.codex || {})[l.id] ? '✓ ' : ''}${l.name}</b>${l.power}<small>${SLOTS[l.slot].name}${l.cls ? ' · ' + CLASSES[l.cls].name : ''}</small></div>`).join('')}</div></section>
    <section><h3>Sety (${CLASSES[cls].name})</h3>
      <div class="lg">${TREES[cls].map(B => _T`<div style="--rc:${B.color}"><b>${setName(B.id)}</b>(2) +15 % Všetko poškodenie a +1 ku talentom vetvy ${B.name}<br>(4) ${SET4[B.id].t}<small>Zbraň · Štít · Motor · Jadro</small></div>`).join('')}</div></section>
    <section><h3>Mýtické</h3>
      <div class="lg">${MYTHIC_LIST.map(m => `<div style="--rc:${RARITY.mythic.color}"><b>${G.found[m.id] ? '✓ ' : ''}${m.name}</b>${m.power}<small>${m.source}</small></div>`).join('')}</div></section>
  </div>`;
}
function renderAch() {
  const done = Object.keys(ACC.ach).length;
  $('achN').textContent = `${done}/${ACH.length}`;
  G.achTab = G.achTab || 'ach';
  if (!isUnlocked(G.achTab)) G.achTab = 'story';
  gateTabs('#achTabs [data-at]', 'at');
  document.querySelectorAll('#achTabs [data-at]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.at === G.achTab)));
  if (G.achTab === 'enc') { $('achBody').innerHTML = renderEnc(); return; }
  if (G.achTab === 'story') { $('achBody').innerHTML = renderStoryTab(); return; }
  if (G.achTab === 'season') { $('achBody').innerHTML = renderSeasonTab(); return; }
  const titles = ACH.filter(A => ACC.ach[A.id]).map(A => A.title).concat(ACC.titles || []);
  const cur = ACC.skin[P.cls] || null;
  $('achBody').innerHTML = _T`<div class="ach-top">
      <label class="field">Titul <select id="achTitle"><option value="">— bez titulu —</option>${titles.map(t => `<option ${ACC.title === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <div><span class="eyebrow">Farba lode ${CLASSES[P.cls].name}</span><div class="skins" style="margin-top:6px">${allSkins().map((k, i) => `<button type="button" data-skin="${i}" title="${k.name}${done < k.n ? _T` · odomkne ${k.n} výziev` : ''}" style="--sk:${k.c || CLASSES[P.cls].color}" aria-pressed="${(k.c || null) === cur}" ${done < k.n ? 'disabled' : ''}></button>`).join('')}</div></div>
    </div>
    <div class="ach-grid">${ACH.map(A => { const v = Math.min(A.n, A.v()), ok = !!ACC.ach[A.id]; return _T`<div class="crow ${ok ? 'done' : ''}"><div class="ct"><b>${A.desc}</b>
      <div class="bar"><i style="width:${(v / A.n * 100).toFixed(0)}%"></i></div>
      <small>${fmtN(v)}/${fmtN(A.n)} · titul „${A.title}“ · ${A.sh} úlomkov</small></div></div>`; }).join('')}</div>`;
}
$('achTabs').addEventListener('click', e => { const b = e.target.closest('[data-at]'); if (b && !lockedMsg(b, b.dataset.at)) { G.achTab = b.dataset.at; renderAch(); } });
$('achBody').addEventListener('change', e => { if (e.target.id === 'achTitle') { ACC.title = e.target.value; saveAccount(); updateHUD(); } });
$('achBody').addEventListener('click', e => {
  const b = e.target.closest('[data-skin]'); if (!b || b.disabled) return;
  const k = allSkins()[+b.dataset.skin]; if (k.c) ACC.skin[P.cls] = k.c; else delete ACC.skin[P.cls];
  saveAccount(); renderAch();
});
/* ---------- onboarding: systems open up with the account's best level, never lock again ---------- */
const UNLOCK = { craft: 5, base: 8, season: 10, chal: 12 };
const accLvl = () => Math.max(P ? P.level : 1, ...Object.values((ACC && ACC.st.shipLvl) || {}), 1);
const isUnlocked = k => !UNLOCK[k] || accLvl() >= UNLOCK[k] || (G && G.cheat && G.cheat.unlock);
const tutDone = () => !P || P.tut == null || P.tut >= TUT.length;
// contracts wait for the tutorial (veterans see them at once)
const contractsOn = () => tutDone() || accLvl() >= 8;
// lock / unlock tab buttons; returns false (and explains) when a locked tab is clicked
function gateTabs(sel, attr) {
  document.querySelectorAll(sel).forEach(b => { const k = b.dataset[attr], lk = !isUnlocked(k); b.classList.toggle('locked', lk); b.title = lk ? _T`Odomkne sa na úrovni ${UNLOCK[k]}` : ''; });
}
function lockedMsg(b, k) { if (isUnlocked(k)) return false; log(_T`${b.textContent.trim()} sa odomkne na úrovni ${UNLOCK[k]}.`); sfx('click'); return true; }
const TUT = [
  { type: 'mine',    n: 5,  text: _L('Rozbi 5 asteroidov'), hint: _L('mier na asteroid a drž ľavé tlačidlo'), th: _L('pravým palcom mier na asteroid, alebo ho auto-ťažba rozbije sama'), ore: 25 },
  { type: 'kill',    n: 10, text: _L('Zostreľ 10 nepriateľov'), hint: _L('mimo modrého kruhu majáka'), ore: 30 },
  { type: 'talent',  n: 1,  text: _L('Pridaj bod talentu'), hint: _L('stlač K'), th: _L('ikona ✦ vpravo hore'), ore: 30 },
  { type: 'equip',   n: 1,  text: _L('Nasaď lepší predmet'), hint: _L('I · zelená ▲ = zlepšenie'), th: _L('ikona ▦ vpravo hore · zelená ▲ = zlepšenie'), ore: 40 },
  { type: 'dock',    n: 1,  text: _L('Dokuj na stanici'), hint: _L('E pri majáku v strede sektora'), th: _L('tlačidlo Dokovať pri majáku v strede sektora'), ore: 40 },
  { type: 'upgrade', n: 1,  text: _L('Vylepši nasadený predmet'), hint: _L('I · klik na slot vľavo'), th: _L('ikona ▦ · ťukni na nasadený predmet'), ore: 60 },
  { type: 'gate',    n: 1,  text: _L('Dokonči bránu s bossom'), hint: _L('G na minimape · E pri bráne'), th: _L('G na minimape · tlačidlo pri bráne'), ore: 150, final: true }
];
function tutTick(type) {
  if (!P || P.tut == null || P.tut >= TUT.length) return;
  const T = TUT[P.tut];
  if (T.type !== type) return;
  P.tutP = (P.tutP || 0) + 1;
  if (P.tutP < T.n) return;
  P.ore += T.ore; P.tutP = 0; P.tut++;
  log(_T`<span style="color:#ffd36b">Úloha splnená:</span> ${T.text} · +${T.ore} rudy`);
  if (T.final) {
    addShards(5); P.inv.length < 30 && P.inv.push(generateItem(P.level + 1, 'rare'));
    if (G) dropGem(P.x, P.y, 1);
    banner(_L('Výcvik dokončený<small>Kontrakty na stanici, svetové úrovne a nočné brány čakajú</small>'));
  }
}
function contractTick(type, o) {
  o = o || {};
  tutTick(type);
  const st = ACC.st;
  if (type === 'kill') st.kills++; else if (type === 'elite') st.elites++; else if (type === 'gate') st.gates++;
  else if (type === 'hunter') st.hunters++; else if (type === 'event') st.events++; else if (type === 'nm') st.nm = Math.max(st.nm, o.k || 0);
  for (const c of P.contracts || []) {
    if (c.done || c.type !== type) continue;
    if (type === 'kill' && o.sec !== c.sec) continue;
    if (type === 'nm' && (o.k || 0) < c.lvl) continue;
    c.prog = Math.min(c.n, c.prog + 1);
    if (c.prog >= c.n) { c.done = true; log(_T`<span style="color:#5be09a">Kontrakt splnený:</span> ${CONTRACTS[c.type].text(c)}. Odmena čaká na stanici.`); }
  }
}
const rerollCost = () => 20 + 5 * P.level;
function claimContract(id) {
  const i = P.contracts.findIndex(x => x.id === id), c = P.contracts[i];
  if (!c || !c.done) return;
  P.ore += c.ore;
  gainXp(c.xp);
  const it = generateItem(P.level + TIERS[G.tier].lvl, rollRarity(c.tier));
  if (P.inv.length < 30) P.inv.push(it); else P.ore += salvageValue(it);
  let keyTxt = '';
  if (c.key && P.keys.length < 20) { const k = makeKey(c.type === 'nm' ? c.lvl + 1 : keyBaseLevel()); P.keys.push(k); keyTxt = _T` · kľúč úr. ${k.lvl}`; }
  log(_T`Odmena za kontrakt: ${c.ore} rudy · <span style="color:${RARITY[it.rarity].color}">${it.name}</span>${keyTxt}`);
  P.contracts.splice(i, 1); P.contracts.splice(i, 0, makeContract());
  saveGame(); renderStation();
}
function rerollContract(id) {
  const i = P.contracts.findIndex(x => x.id === id), cost = rerollCost();
  if (i < 0 || P.ore < cost) return;
  P.ore -= cost; P.contracts.splice(i, 1); P.contracts.splice(i, 0, makeContract()); renderStation();
}

const nmEnemyDmgScale = () => { const D = G.dungeon; return (1 + 0.09 * (D.lvl - 1)) * TIERS[G.tier].dmg * D.nm.sc.dmg; };

$('achBody').addEventListener('click', e => { const b = e.target.closest('[data-sclaim]'); if (!b || b.disabled) return; claimSeason(+b.dataset.sclaim); renderAch(); });
