'use strict';
/* =====================================================================
   MATERIALS & HOME BASE (account-wide, ACC.mats / ACC.base)
   Materials drop from asteroids (iron, crystal) and from enemies by sector
   (plasma, dark matter, exotic matter). The home base near Haven Station
   has four modules — refinery, laboratory, expedition hangar, greenhouse —
   and runs on real time, so it keeps working while you are away (max 8 h).
   ===================================================================== */
const MATS = {
  iron:    { name: _L('Železo'),          color: '#b8c4d6' },
  crystal: { name: _L('Kryštál'),         color: '#6fe3ff' },
  plasma:  { name: _L('Plazma'),          color: '#ff6bd0' },
  dark:    { name: _L('Temná hmota'),     color: '#9a6bff' },
  exotic:  { name: _L('Exotická látka'),  color: '#ffd36b' }
};
const MAT_KEYS = Object.keys(MATS);
const SECTOR_MAT = { kepler: 'iron', ruby: 'plasma', vex: 'plasma', baria: 'dark', hercules: 'dark', rim: 'exotic' };
const BASE_CAP_MS = 8 * 3600 * 1000;

function baseState() {
  ACC.mats = ACC.mats || {};
  for (const k of MAT_KEYS) ACC.mats[k] = ACC.mats[k] || 0;
  ACC.base = ACC.base || { lv: { ref: 1, lab: 0, hangar: 0, green: 0 }, last: Date.now(), store: {}, res: {}, rs: null, exp: [] };
  const B = ACC.base; B.store = B.store || {}; B.res = B.res || {}; B.exp = B.exp || [];
  return B;
}
const matStr = c => Object.entries(c).filter(([, v]) => v > 0).map(([k, v]) => k === 'ore' ? _T`${fmtN(v)} rudy` : `${v} ${MATS[k].name}`).join(' · ');
const canAfford = c => Object.entries(c).every(([k, v]) => k === 'ore' ? P.ore >= v : (ACC.mats[k] || 0) >= v);
function payMats(c) { for (const [k, v] of Object.entries(c)) { if (k === 'ore') P.ore -= v; else ACC.mats[k] -= v; } }
function giveMat(k, n) { baseState(); ACC.mats[k] = (ACC.mats[k] || 0) + n; }
function dropMat(x, y, k, n) { if (stimOn('greed')) n = Math.round(n * 1.3 + Math.random() * 0.5); if (seasonMod('gold')) n = Math.round(n * 1.5 + Math.random() * 0.5); if (n > 0) pickups.push({ kind: 'mat', mat: k, x, y, vx: rand(-120, 120), vy: rand(-120, 120), amount: n, t: 0, spin: rand(0, TAU), dead: false }); }

/* ---------- drops ---------- */
function matsOnAsteroid(a) {
  const n = +a.size || 1;
  if (a.kind === 'iron') dropMat(a.x, a.y, 'iron', randi(1, n + 1));
  else if (a.kind === 'crystal' || a.kind === 'radiant') dropMat(a.x, a.y, 'crystal', randi(1, n + 1));
  else if (Math.random() < 0.25) dropMat(a.x, a.y, 'iron', 1);
}
function matsOnKill(e) {
  if (e.minion) return;
  const sec = G.dungeon ? G.dungeon.esec || G.dungeon.sector : G.sector, k = SECTOR_MAT[sec];
  if (!k) return;
  const n = e.isBoss ? 8 : e.hunter ? 4 : e.elite ? randi(2, 3) : Math.random() < 0.08 ? 1 : 0;
  dropMat(e.x, e.y, k, n);
  if ((e.isBoss || e.wb) && k !== 'exotic' && G.tier >= 3) dropMat(e.x, e.y, 'exotic', 1);
}

/* ---------- modules ---------- */
const MODULES = {
  ref:    { name: _L('Rafinéria'),          max: 5, desc: _L('Každú minútu vyrobí železo a kryštál (aj keď nehráš, najviac 8 h). Spracuje nadbytočnú rudu na materiály.') },
  lab:    { name: _L('Laboratórium'),       max: 3, desc: _L('Výskum trvalých vylepšení pre všetky lode. Úroveň laboratória určuje najvyšší rank výskumu.') },
  hangar: { name: _L('Hangár expedícií'),   max: 5, desc: _L('Posiela drony na expedície. Vrátia sa s rudou, materiálmi alebo výbavou.') },
  green:  { name: _L('Skleník'),            max: 3, desc: _L('Pestuje stimulanty – dočasné posilnenia na 10 minút hry.') }
};
const MOD_KEYS = Object.keys(MODULES);
function moduleCost(k, lv) {   // cost to reach level lv
  const c = { ore: Math.round(1500 * lv * lv * (k === 'ref' ? 0.8 : 1)), iron: 15 * lv, crystal: 8 * lv };
  if (lv >= 3) c.plasma = 6 * (lv - 2);
  if (lv >= 4) c.dark = 4 * (lv - 3);
  if (lv >= 5) c.exotic = 3;
  return c;
}
function upgradeModule(k) {
  const B = baseState(), lv = (B.lv[k] || 0) + 1;
  if (lv > MODULES[k].max) return;
  const c = moduleCost(k, lv);
  if (!canAfford(c)) return;
  payMats(c); B.lv[k] = lv;
  log(_T`Základňa: <b>${MODULES[k].name}</b> úroveň ${lv}.`);
  saveAll();
}

/* ---------- refinery ---------- */
function tickBase() {
  const B = baseState(), now = Date.now();
  if (B.last > now) B.last = now;   // clock moved backwards: resume instead of stalling
  const dt = Math.min(BASE_CAP_MS, Math.max(0, now - (B.last || now)));
  if (dt < 1000) return;
  B.last = now;
  const L = B.lv.ref || 0, min = dt / 60000;
  B.acc = (B.acc || 0) + min * L;   // 1 iron per level per minute, crystal every second minute
  const whole = Math.floor(B.acc); B.acc -= whole;
  if (whole > 0) { B.store.iron = (B.store.iron || 0) + whole; B.cacc = (B.cacc || 0) + whole / 2; const c = Math.floor(B.cacc); B.cacc -= c; if (c) B.store.crystal = (B.store.crystal || 0) + c; }
}
function collectRefinery() {
  const B = baseState(); let got = [];
  for (const k in B.store) if (B.store[k] > 0) { ACC.mats[k] += B.store[k]; got.push(`${B.store[k]} ${MATS[k].name}`); B.store[k] = 0; }
  if (got.length) log(_T`Rafinéria: ${got.join(', ')}.`);
  saveAll();
}
const refineBatch = () => 1000;
function refineOre() {
  const L = baseState().lv.ref || 1;
  if (P.ore < refineBatch()) return;
  P.ore -= refineBatch();
  giveMat('iron', 4 + L); giveMat('crystal', 2 + L);
  if (L >= 3) giveMat('plasma', 1);
  if (L >= 5) giveMat('dark', 1);
  log(_T`Rafinéria spracovala ${refineBatch()} rudy.`);
  saveAll();
}

/* ---------- laboratory ---------- */
const RESEARCH = {
  drill:  { name: _L('Optimalizované vrtáky'), txt: r => _T`+${10 * r} % výnos ťažby`, fx: (s, p, r) => { p.yield += 10 * r; } },
  arms:   { name: _L('Kalibrácia zbraní'),     txt: r => _T`+${3 * r} % všetko poškodenie`, fx: (s, p, r) => { p.allDmg += 3 * r; } },
  shield: { name: _L('Zosilnené štíty'),       txt: r => _T`+${4 * r} % kapacita štítu`, fx: (s, p, r) => { p.shield += 4 * r; } },
  hull:   { name: _L('Kompozitný trup'),       txt: r => _T`+${4 * r} % pevnosť trupu`, fx: (s, p, r) => { p.hull += 4 * r; } },
  optics: { name: _L('Kryštálová optika'),     txt: r => _T`+${r} % kritická šanca`, fx: (s, p, r) => { p.crit += r; } },
  cool:   { name: _L('Rýchle chladenie'),      txt: r => _T`+${3 * r} % skrátenie cooldownov`, fx: (s, p, r) => { p.skCdr += 3 * r; } },
  magnet: { name: _L('Silnejší magnet'),       txt: r => _T`+${15 * r} % dosah magnetu`, fx: (s, p, r) => { s.magnet *= 1 + 0.15 * r; } },
  scan:   { name: _L('Hĺbkový skener'),      txt: r => _T`+${25 * r} % dosah skenera`, fx: (s, p, r) => { s.scanMul = 1 + 0.25 * r; } },
  learn:  { name: _L('Analytické jadro'),      txt: r => _T`+${5 * r} % XP`, fx: (s, p, r) => { s.xpMult += 0.05 * r; } }
};
const resRank = id => (ACC && ACC.base && ACC.base.res && ACC.base.res[id]) || 0;
function researchCost(r) {
  const c = { ore: 2000 * r, iron: 12 * r, crystal: 10 * r };
  if (r >= 2) { c.plasma = 5 * (r - 1); c.dark = 3 * (r - 1); }
  if (r >= 3) c.exotic = 3;
  return c;
}
const researchMin = r => [0, 3, 8, 15][r] * (1 - 0.1 * Math.max(0, (baseState().lv.lab || 1) - 1));
function startResearch(id) {
  const B = baseState(), r = resRank(id) + 1;
  if (B.rs || r > 3 || r > (B.lv.lab || 0)) return;
  const c = researchCost(r); if (!canAfford(c)) return;
  payMats(c); B.rs = { id, end: Date.now() + researchMin(r) * 60000 };
  log(_T`Laboratórium: výskum ${RESEARCH[id].name} ${r}/3 začal.`);
  saveAll();
}
function tickResearch() {
  const B = baseState();
  if (B.rs && Date.now() >= B.rs.end) {
    const id = B.rs.id; B.res[id] = resRank(id) + 1; B.rs = null;
    log(_T`<span style="color:#6fe3ff">Výskum dokončený:</span> ${RESEARCH[id].name} ${B.res[id]}/3 · ${RESEARCH[id].txt(B.res[id])}.`);
    if (G && P) recalcStats();
    saveAll();
  }
}
// applied inside computeStats (account-wide bonuses)
function researchFx(s, p) { if (!ACC || !ACC.base || !ACC.base.res) return; for (const id in ACC.base.res) if (RESEARCH[id]) RESEARCH[id].fx(s, p, ACC.base.res[id]); }

/* ---------- expedition hangar ---------- */
const EXPEDITIONS = {
  mine:   { name: _L('Ťažobná'),     min: 10, desc: _L('ruda, železo, kryštál') },
  combat: { name: _L('Bojová'),      min: 15, desc: _L('predmety, úlomky') },
  scout:  { name: _L('Prieskumná'),  min: 20, desc: _L('plazma, temná hmota, exotická látka, drahokam') }
};
const expSlots = () => { const L = baseState().lv.hangar || 0; return L ? 1 + Math.floor(L / 3) : 0; };
function startExpedition(type) {
  const B = baseState();
  if (B.exp.length >= expSlots()) return;
  B.exp.push({ type, end: Date.now() + EXPEDITIONS[type].min * 60000, lv: B.lv.hangar });
  log(_T`Expedícia ${EXPEDITIONS[type].name} vyrazila (${EXPEDITIONS[type].min} min).`);
  saveAll();
}
function claimExpedition(i) {
  const B = baseState(), E = B.exp[i];
  if (!E || Date.now() < E.end) return;
  B.exp.splice(i, 1);
  const L = E.lv || 1, il = Math.min(P.level, LEVEL_CAP) + TIERS[G.tier].lvl + 2, out = [];
  if (E.type === 'mine') { P.ore += 400 * L; giveMat('iron', 6 * L); giveMat('crystal', 4 * L); out.push(_T`${400 * L} rudy`, _T`${6 * L} železa`, _T`${4 * L} kryštálu`); }
  else if (E.type === 'combat') {
    const n = 2 + Math.floor(L / 2);
    for (let k = 0; k < n; k++) { giveItem(generateItem(il, Math.random() < 0.35 ? 'legendary' : 'rare')); }
    P.shards += 5 * L; out.push(_T`${n} predmety`, _T`${5 * L} úlomkov`);
  } else {
    giveMat('plasma', 3 * L); giveMat('dark', 2 * L); giveMat('exotic', 1 + Math.floor(L / 2));
    const t = pick(Object.keys(GEMS)); P.gems[t][Math.min(2, Math.floor(L / 3))]++;
    out.push(_T`${3 * L} plazmy`, _T`${2 * L} temnej hmoty`, _T`${1 + Math.floor(L / 2)} exotickej látky`, _L('drahokam'));
  }
  log(_T`<span style="color:#5be09a">Expedícia ${EXPEDITIONS[E.type].name} sa vrátila:</span> ${out.join(', ')}.`);
  saveAll();
}

/* ---------- greenhouse (stimulants, 10 min of play) ---------- */
const STIMS = {
  rage:  { name: _L('Bojový stimulant'),   lv: 1, txt: _L('+15 % poškodenia'),  cost: { crystal: 6, plasma: 3 } },
  mind:  { name: _L('Neurostimulant'),     lv: 2, txt: _L('+25 % XP'),          cost: { crystal: 6, dark: 2 } },
  greed: { name: _L('Zlatý stimulant'),    lv: 3, txt: _L('+30 % výnos rudy a materiálov'), cost: { crystal: 8, exotic: 1 } }
};
const stimOn = k => !!(P && P.stim && P.stim[k] > 0);
const stimDur = () => 600 + 120 * Math.max(0, (baseState().lv.green || 1) - 1);
function brewStim(k) {
  const S = STIMS[k], B = baseState();
  if ((B.lv.green || 0) < S.lv || !canAfford(S.cost)) return;
  payMats(S.cost); P.stim = P.stim || {}; P.stim[k] = stimDur();
  log(_T`<span style="color:#7ee0a8">${S.name}</span> aktívny: ${S.txt} na ${Math.round(stimDur() / 60)} min.`);
  recalcStats(); saveAll();
}
function tickStims(dt) { if (!P.stim) return; for (const k in P.stim) if (P.stim[k] > 0 && (P.stim[k] -= dt) <= 0) { log(_T`${STIMS[k].name} vyprchal.`); recalcStats(); } }

/* ---------- smelter: materials into useful things ---------- */
const SMELT = [
  { id: 'shards', name: _L('Úlomky Prázdnoty ×5'), cost: { iron: 10, crystal: 6 }, act: () => { P.shards += 5; } },
  { id: 'gem',    name: _L('Brúsený drahokam'),     cost: { crystal: 8, plasma: 4 },  act: () => { P.gems[pick(Object.keys(GEMS))][1]++; } },
  { id: 'key',    name: _L('Kľúč nočnej brány'),    cost: { dark: 6, exotic: 2 },     act: () => { if (P.keys.length < 20) P.keys.push(makeKey(keyBaseLevel() + 2)); } },
  { id: 'frags',  name: _L('Úlomky mapy ×2'),       cost: { plasma: 6, dark: 3 },      act: () => { P.vaultFrags = (P.vaultFrags || 0) + 2; } }
];
function smelt(i) { const S = SMELT[i]; if (!S || !canAfford(S.cost)) return; if (S.id === 'key' && P.keys.length >= 20) { log(_L('Kľúčov máš 20 – zlievareň nič neminula.')); return; } payMats(S.cost); S.act(); log(_T`Zlievareň: ${S.name}.`); saveAll(); }
function saveAll() { saveAccount(); saveGame(); if (G && G.panel === 'station') renderStation(); }

/* ---------- per frame ---------- */
function tickBaseAll(dt) {
  G.baseT = (G.baseT || 0) - dt;
  if (G.baseT <= 0) { G.baseT = 1; tickBase(); tickResearch(); }
  tickStims(dt);
}

/* ---------- home base in Haven ---------- */
const basePos = () => (G.sector === 'haven' && !G.dungeon && G.station ? { x: G.station.x + 620, y: G.station.y - 380 } : null);
function baseInteract() {
  const b = basePos(); if (!b || d2(b.x, b.y, P.x, P.y) > 170 * 170) return null;
  return { txt: _L('Pristáť na základni'), sub: _L('moduly · výskum · expedície'), col: '#7ee0a8', act: () => { G.stTab = 'base'; openPanel('station'); } };
}
function drawBase() {
  const b = basePos(); if (!b) return;
  const B = baseState(), t = G.time;
  ctx.save(); ctx.translate(b.x, b.y);
  const PL = spr3d('base_plate');
  if (PL) {
    // pseudo-3D: asteroid with a landing platform, a model per module (scaffold until built), level lights underneath
    softGlow(ctx, '#7ee0a8', 0, 0, 170, 0.12);
    drawSpr(ctx, PL, 0, 0, 0, 380, 0);
    const spots3 = { ref: [-70, -44], lab: [66, -54], hangar: [-52, 62], green: [68, 52] }, cols3 = { ref: '#c8a27c', lab: '#6fe3ff', hangar: '#5be09a', green: '#7ee0a8' };
    for (const k of MOD_KEYS) {
      const lv = B.lv[k] || 0, [x, y] = spots3[k], M3 = spr3d(lv ? 'base_' + k : 'base_empty');
      if (lv) softGlow(ctx, cols3[k], x, y, 44, 0.2 + 0.08 * Math.sin(t * 2 + x));
      if (M3) drawSpr(ctx, M3, x, y, 0, lv ? 100 : 80, 0);
      for (let i = 0; i < MODULES[k].max; i++) {
        ctx.fillStyle = i < lv ? cols3[k] : 'rgba(127,140,168,.35)'; ctx.globalAlpha = i < lv ? 0.7 + 0.3 * Math.sin(t * 3 + i) : 1;
        ctx.fillRect(x - MODULES[k].max * 3.5 + i * 7, y + 36, 5, 4);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    worldLabel(_L('TVOJA ZÁKLADŇA'), b.x, b.y + 185, '#7ee0a8');
    return;
  }
  ctx.fillStyle = '#2a2f3a'; ctx.strokeStyle = '#6b7488'; ctx.lineWidth = 2;
  ctx.beginPath(); for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, r = 120 + Math.sin(i * 2.7) * 18; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); } ctx.closePath(); ctx.fill(); ctx.stroke();
  const spots = { ref: [-50, -30], lab: [45, -40], hangar: [-30, 50], green: [55, 40] }, cols = { ref: '#c8a27c', lab: '#6fe3ff', hangar: '#5be09a', green: '#7ee0a8' };
  for (const k of MOD_KEYS) {
    const lv = B.lv[k] || 0, [x, y] = spots[k];
    ctx.strokeStyle = lv ? cols[k] : '#3a4152'; ctx.fillStyle = '#0b1424'; ctx.lineWidth = 2;
    ctx.fillRect(x - 16, y - 12, 32, 24); ctx.strokeRect(x - 16, y - 12, 32, 24);
    for (let i = 0; i < lv; i++) { ctx.fillStyle = cols[k]; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i); ctx.fillRect(x - 12 + i * 6, y - 3, 4, 6); }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  worldLabel(_L('TVOJA ZÁKLADŇA'), b.x, b.y + 150, '#7ee0a8');
}

/* ---------- station tab ---------- */
function renderBase() {
  const B = baseState(); tickBase(); tickResearch();
  const now = Date.now(), M = ACC.mats;
  const btn = (attr, ok, txt) => `<button type="button" class="btn" ${attr} ${ok ? '' : 'disabled'}>${txt}</button>`;
  const mats = MAT_KEYS.map(k => `<span class="mat" style="--mc:${MATS[k].color}"><i></i>${MATS[k].name} <b>${M[k]}</b></span>`).join('');
  const mods = MOD_KEYS.map(k => {
    const lv = B.lv[k] || 0, D = MODULES[k], next = lv < D.max ? moduleCost(k, lv + 1) : null;
    return _T`<div class="bmod"><div class="bmod-top"><b>${D.name}</b><span>${lv}/${D.max}</span></div><p>${D.desc}</p>
      ${next ? `<div class="frow"><span class="note">${matStr(next)}</span>${btn(`data-bup="${k}"`, canAfford(next), lv ? _L('Vylepšiť') : _L('Postaviť'))}</div>` : _L('<span class="note">Maximálna úroveň</span>')}</div>`;
  }).join('');
  // refinery
  const st = Object.entries(B.store).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${MATS[k].name}`).join(', ');
  const ref = _T`<div class="bsec"><span class="eyebrow">Rafinéria · ${B.lv.ref || 0}. úroveň</span>
    <div class="frow"><span>Vyrobené: ${st || _L('zatiaľ nič')} <small class="note">(${B.lv.ref || 0} železa a ${String((B.lv.ref || 0) / 2).replace('.', DEC)} kryštálu za minútu)</small></span>${btn('data-bcol', !!st, _L('Vyzdvihnúť'))}</div>
    <div class="frow"><span>Spracovať ${refineBatch()} rudy na materiály</span>${btn('data-bref', P.ore >= refineBatch(), _L('Spracovať'))}</div></div>`;
  // lab
  const labL = B.lv.lab || 0;
  const lab = _T`<div class="bsec"><span class="eyebrow">Laboratórium · ${labL ? _T`${labL}. úroveň` : _L('nepostavené')}${B.rs ? _T` · prebieha ${RESEARCH[B.rs.id].name} · ${fmtTime(Math.max(0, (B.rs.end - now) / 1000))}` : ''}</span>
    <div class="bres">${Object.entries(RESEARCH).map(([id, R]) => { const r = resRank(id), nx = r + 1, c = researchCost(Math.min(3, nx)), ok = !B.rs && nx <= 3 && nx <= labL && canAfford(c);
      return _T`<div class="bres-i"><b>${R.name}</b><span class="pips">${[1, 2, 3].map(i => `<i class="${i <= r ? 'on' : ''}"></i>`).join('')}</span><small>${r ? R.txt(r) : R.txt(1)}</small>
      ${nx <= 3 ? `<small class="note">${matStr(c)} · ${Math.round(researchMin(nx))} min</small>${btn(`data-bres="${id}"`, ok, nx > labL ? _T`Lab ${nx}` : _L('Skúmať'))}` : _L('<small class="note">Hotovo</small>')}</div>`; }).join('')}</div></div>`;
  // hangar
  const hs = expSlots();
  const exp = _T`<div class="bsec"><span class="eyebrow">Hangár expedícií · ${B.exp.length}/${hs} dronov vonku</span>
    ${B.exp.map((E, i) => { const left = (E.end - now) / 1000; return _T`<div class="frow"><span>${EXPEDITIONS[E.type].name} · ${left > 0 ? fmtTime(left) : _L('vrátila sa')}</span>${btn(`data-bclaim="${i}"`, left <= 0, _L('Vyzdvihnúť'))}</div>`; }).join('')}
    <div class="frow wrap">${Object.entries(EXPEDITIONS).map(([k, E]) => btn(`data-bexp="${k}" title="${E.desc}"`, B.exp.length < hs, _T`${E.name} · ${E.min} min`)).join('')}</div>
    ${hs ? '' : _L('<p class="note">Postav hangár, aby si mohol posielať expedície.</p>')}</div>`;
  // greenhouse
  const gL = B.lv.green || 0;
  const green = _T`<div class="bsec"><span class="eyebrow">Skleník · stimulanty na ${Math.round(stimDur() / 60)} min hry</span>
    ${Object.entries(STIMS).map(([k, S]) => _T`<div class="frow"><span><b>${S.name}</b> · ${S.txt}${stimOn(k) ? _T` · <span style="color:#7ee0a8">aktívny ${fmtTime(P.stim[k])}</span>` : ''}<br><small class="note">${matStr(S.cost)}${gL < S.lv ? _T` · skleník ${S.lv}` : ''}</small></span>${btn(`data-bstim="${k}"`, gL >= S.lv && canAfford(S.cost), _L('Vypestovať'))}</div>`).join('')}</div>`;
  const smeltH = _T`<div class="bsec"><span class="eyebrow">Zlievareň</span>${SMELT.map((S, i) => `<div class="frow"><span>${S.name} <small class="note">${matStr(S.cost)}</small></span>${btn(`data-bsmelt="${i}"`, canAfford(S.cost), _L('Vyrobiť'))}</div>`).join('')}</div>`;
  $('baseBody').innerHTML = _T`<div class="bmats">${mats}</div>
    <p class="note">Materiály padajú z asteroidov (železo, kryštál) a z nepriateľov podľa sektora: Rubínová hmlovina a Vex plazma, Bárijský roj a Herkules temná hmota, Okraj Prázdnoty exotická látka. Základňa je spoločná pre všetky lode a pracuje aj keď nehráš (najviac 8 h).</p>
    <div class="bmods">${mods}</div><div class="bgrid">${ref}${lab}${exp}${green}${smeltH}</div>`;
}
