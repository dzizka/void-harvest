'use strict';
/* =====================================================================
   ENDGAME EVENTS
   · Búrka Prázdnoty (Void Storm) — a sector is engulfed for 10 minutes:
     more and stronger enemies, kills drop Void Embers, embers open cursed
     chests. Embers fade when the storm ends.
   · Pevnosti (Strongholds) — every combat sector has an occupied station.
     Break the siege (3 waves + commander) and it becomes an outpost with
     a safe zone and docking.
   · Horda Prázdnoty (Void Horde) — arena mode: 6 timed waves, a boon/bane
     choice after each, aether from kills, a horde lord and hoard chests.
   ===================================================================== */
const STORM_EVERY = 900, STORM_DUR = 600, STORM_REQ = 20;
const STORM_CHEST = 60, STORM_GIFT = 175;
const stormHere = () => !!(G && G.storm && G.storm.state === 'active' && !G.dungeon && G.sector === G.storm.sec);
const stormLvl = () => (stormHere() ? 2 : 0);

function tickStorm(dt) {
  if (P.level < STORM_REQ) return;
  const S = G.storm = G.storm || { state: 'idle', t: 300, ember: 0 };
  S.t -= dt;
  if (S.state === 'idle' && S.t <= 0) {
    const pool = Object.keys(SECTORS).filter(id => SECTORS[id].kind === 'hostile' && P.level >= SECTORS[id].min);
    // prefer sectors near the pilot's level
    pool.sort((a, b) => Math.abs(SECTORS[b].min - P.level) - Math.abs(SECTORS[a].min - P.level));
    Object.assign(S, { state: 'active', t: STORM_DUR, sec: pick(pool.slice(-3)), ember: 0, chests: null });
    banner(_T`<span style="color:#c86bff">Búrka Prázdnoty</span><small>${SECTORS[S.sec].name} · 10:00 · žiara otvára prekliate truhlice</small>`);
    log(_T`<span style="color:#c86bff">Búrka Prázdnoty</span> zachvátila sektor ${SECTORS[S.sec].name} na 10 minút. Silnejší nepriatelia, z ktorých padá žiara.`);
  } else if (S.state === 'active') {
    if (stormHere()) {
      if (!S.chests) makeStormChests();
      for (const c of S.chests) if (c.gone && (c.gone -= dt) <= 0) { Object.assign(c, freeSpot(G.station.r + 500, 300, 300)); c.gone = 0; c.slot = c.gift ? null : pick(SLOT_ORDER); }
      // lightning near the pilot
      if (Math.random() < dt * 0.6) { const a = rand(0, TAU), r = rand(200, 600), x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; particles.push({ bolt: true, x, y: y - 220, x2: x + rand(-40, 40), y2: y, life: 0.25, max: 0.25, color: '#d9a8ff' }); }
    }
    if (S.t <= 0) {
      if (S.ember > 0) log(_T`Búrka utíchla. ${S.ember} žiary sa rozplynulo.`);
      else log(_L('Búrka Prázdnoty utíchla.'));
      Object.assign(S, { state: 'idle', t: STORM_EVERY, ember: 0, chests: null });
    }
  }
}
function makeStormChests() {
  const S = G.storm; S.chests = [];
  for (let i = 0; i < 4; i++) S.chests.push({ ...freeSpot(G.station.r + 500, 300, 300), gift: i === 3, slot: i === 3 ? null : pick(SLOT_ORDER), gone: 0 });
}
function openStormChest(c) {
  const S = G.storm, cost = c.gift ? STORM_GIFT : STORM_CHEST;
  if (S.ember < cost) { addText(P.x, P.y - 30, _T`Treba ${cost} žiary`, '#c86bff', 12, 0.9); return; }
  S.ember -= cost; ACC.st.stormChests = (ACC.st.stormChests || 0) + 1;
  const L = zoneLevel() + 2;
  if (c.gift) {
    for (let i = 0; i < 2; i++) dropPickup('item', c.x, c.y, 1, generateItem(L, 'legendary'));
    if (G.tier >= 2 && Math.random() < 0.4) dropSet(c.x, c.y, L);
    if (mythTier() > 0 && Math.random() < 0.03 * mythTier() * mythMult()) dropMythic(pick(MYTHIC_LIST).id, c.x, c.y, L + 1);
    dropGem(c.x, c.y, 1); addShards(10);
    banner(_L('<span style="color:#c86bff">Mučivý dar</span><small>Odmena Búrky Prázdnoty</small>'));
  } else {
    dropPickup('item', c.x, c.y, 1, generateItem(L, Math.random() < 0.35 ? 'legendary' : 'rare', c.slot));
    dropPickup('item', c.x, c.y, 1, generateItem(L, rollRarity(2), c.slot));
    dropOre(c.x, c.y, (40 + L * 4) * P.stats.yieldMult);
  }
  ring(c.x, c.y, '#c86bff', 200, 0.7); burst(c.x, c.y, '#c86bff', 50, 420, 2.6, 0.7); shake(5);
  c.gone = c.gift ? 120 : 45;
}

/* ---------- strongholds ---------- */
const FORT_R = 420, FORT_SAFE = 280;
function fortPos(id) {
  const S = SECTORS[id], r = seeded('fort' + id), a = r() * TAU, d = S.size * (0.3 + r() * 0.08);
  return { x: S.size / 2 + Math.cos(a) * d, y: S.size / 2 + Math.sin(a) * d };
}
const fortFree = id => !!(G.forts && G.forts[id]);
function curFort() {
  if (G.dungeon || !G.sector || SECTORS[G.sector].kind !== 'hostile') return null;
  const p = fortPos(G.sector); return { ...p, id: G.sector, free: fortFree(G.sector) };
}
const inOutpost = () => { const F = curFort(); return !!(F && F.free && d2(P.x, P.y, F.x, F.y) < FORT_SAFE * FORT_SAFE); };
function tickFort(dt) {
  const F = curFort(); if (!F || F.free) { G.siege = null; return; }
  const dd = d2(P.x, P.y, F.x, F.y), lvl = zoneLevel() + 3;
  let Sg = G.siege && G.siege.id === F.id ? G.siege : null;
  if (!Sg) {
    if (dd < FORT_R * FORT_R) {
      Sg = G.siege = { id: F.id, wave: 0, next: 1.2, cmd: null };
      banner(_T`<span style="color:#ff6b5a">Pevnosť</span><small>${SECTORS[F.id].name} · 3 vlny a veliteľ · neodlietaj ďaleko</small>`);
    }
    return;
  }
  if (dd > 1300 * 1300) { for (const e of enemies) if (e.fort) e.dead = true; G.siege = null; log(_L('Ústup od pevnosti. Obliehanie sa začne odznova.')); return; }
  const alive = enemies.some(e => e.fort && !e.dead);
  if (alive) return;
  if ((Sg.next -= dt) > 0) return;
  const pool = curSector().enemies;
  if (Sg.wave < 3) {
    const n = 8 + Sg.wave * 3 + Math.floor(Math.min(zoneLevel(), 40) / 6);
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), r = rand(120, FORT_R - 40); const e = spawnEnemy(weighted(pool), F.x + Math.cos(a) * r, F.y + Math.sin(a) * r, lvl, i < Sg.wave); e.fort = true; ring(e.x, e.y, '#ff4d6d', 40, 0.4); }
    Sg.wave++; Sg.next = 2;
    log(_T`Pevnosť · vlna ${Sg.wave}/3`);
  } else if (!Sg.cmd) {
    const e = spawnEnemy('gunship', F.x, F.y, lvl + 2, true); e.fort = true; e.fortCmd = true; e.hp *= 6; e.maxHp = e.hp; e.r *= 1.4;
    e.label = _L('Veliteľ pevnosti');
    Sg.cmd = e; banner(_L('<span style="color:#ff6b5a">Veliteľ pevnosti</span><small>Zostreľ ho a pevnosť je tvoja</small>'));
  } else freeFort(F);
}
function freeFort(F) {
  G.forts = G.forts || {}; G.forts[F.id] = true; G.siege = null;
  ACC.st.forts = Math.max(ACC.st.forts || 0, Object.keys(G.forts).length);
  const L = zoneLevel() + 3;
  dropPickup('item', F.x, F.y, 1, generateItem(L, 'legendary'));
  for (let i = 0; i < 2; i++) dropItem(F.x, F.y, L, 2);
  dropGem(F.x, F.y, 1); addShards(15); dropOre(F.x, F.y, (150 + L * 10) * P.stats.yieldMult);
  if (P.level < LEVEL_CAP) gainXp(xpNeed(P.level) * 0.15 / (P.stats.xpMult * TIERS[G.tier].xp));
  ring(F.x, F.y, '#5fd4ff', 600, 1.2); burst(F.x, F.y, '#5fd4ff', 120, 700, 3, 1); shake(10);
  banner(_T`<span style="color:#5fd4ff">Pevnosť oslobodená</span><small>${SECTORS[F.id].name} · nová základňa s dokom a bezpečnou zónou</small>`);
  log(_T`Pevnosť v sektore ${SECTORS[F.id].name} oslobodená (${Object.keys(G.forts).length}/6).`);
  saveGame();
}

/* ---------- Void Horde ---------- */
const HORDE_REQ = 30, HORDE_WAVES = 6, HORDE_WAVE_T = 60;
const HORDE_BOONS = [
  { k: 'dmg',  v: 0.25, txt: _L('+25 % poškodenia') },
  { k: 'fr',   v: 0.3,  txt: _L('+30 % kadencie') },
  { k: 'cd',   v: 0.25, txt: _L('−25 % cooldown schopností') },
  { k: 'crit', v: 15,   txt: _L('+15 % kritická šanca') },
  { k: 'aeth', v: 0.5,  txt: _L('+50 % éteru') },
  { k: 'heal', v: 1,    txt: _L('Každé zabitie obnoví 1 % trupu') }
];
const HORDE_BANES = [
  { k: 'eHp',   v: 0.3,  txt: _L('Nepriatelia +30 % životov') },
  { k: 'eDmg',  v: 0.25, txt: _L('Nepriatelia +25 % poškodenia') },
  { k: 'eSpd',  v: 0.2,  txt: _L('Nepriatelia +20 % rýchlosti') },
  { k: 'eElite', v: 0.1, txt: _L('Viac elít') },
  { k: 'vol',   v: 1,    txt: _L('Nepriatelia pri smrti vybuchujú') }
];
const hb = k => (G && G.dungeon && G.dungeon.horde && G.dungeon.hb[k]) || 0;
function enterHorde() {
  if (G.dungeon || (P.level < HORDE_REQ && !G.cheat.unlock) || transitioning) return;
  closePanels();
  G.saved = { sector: G.sector, asteroids, pickups, gates: G.gates, x: P.x, y: P.y + 60 };
  G.dungeon = { horde: true, boss: pick(BOSS_ORDER), lvl: Math.min(P.level, LEVEL_CAP) + TIERS[G.tier].lvl + 2, room: 0, wave: 0, state: 'horde', portal: null, sector: G.sector,
    t: HORDE_WAVE_T, aether: 0, hb: {}, picks: [], spawnT: 0.5, offer: null, chests: null,
    esec: Object.keys(SECTORS).filter(id => SECTORS[id].kind === 'hostile' && SECTORS[id].min <= Math.max(1, P.level)).pop() || 'kepler' };
  saveGame();
  transition(_L('Horda Prázdnoty'), () => loadModeArena(_L('Horda Prázdnoty<small>6 vĺn · zbieraj éter · na konci pán hordy</small>')));
}
function hordeDirector(dt) {
  const D = G.dungeon;
  if (D.portal) D.portal.t += dt;
  if (D.state === 'pick') { if (G.panel !== 'horde') hordePick(randi(0, 2)); return; }
  if (D.state !== 'horde') return;
  D.t -= dt;
  const A = G.arena, want = 12 + D.wave * 3;
  if ((D.spawnT -= dt) <= 0 && enemies.length < want) {
    D.spawnT = 0.35;
    const a = rand(0, TAU), x = A.x + Math.cos(a) * (A.r - 70), y = A.y + Math.sin(a) * (A.r - 70);
    spawnEnemy(weighted(SECTORS[D.esec].enemies), x, y, D.lvl + Math.floor(D.wave / 2), Math.random() < 0.06 + hb('eElite'));
  }
  if (D.t <= 0) {
    for (const e of enemies) { e.dead = true; burst(e.x, e.y, '#c86bff', 8, 160, 2, 0.4); }
    enemies = []; ebullets = [];
    D.wave++;
    if (D.wave >= HORDE_WAVES) {
      D.state = 'lord';
      const e = spawnBoss(D.boss, A.x, A.y - 220, D.lvl + 3); e.hp *= 3; e.maxHp = e.hp; e.hordeB = true;
      banner(_T`<span style="color:#c86bff">Pán hordy</span><small>${e.B.name} · posledná vlna</small>`);
      return;
    }
    D.state = 'pick'; D.offer = hordeOffers();
    G.panel = 'horde'; syncPanels();
  }
}
function hordeOffers() {
  const out = [], boons = HORDE_BOONS.slice().sort(() => Math.random() - 0.5), banes = HORDE_BANES.slice().sort(() => Math.random() - 0.5);
  out.push({ boon: boons[0], bane: null });
  out.push({ boon: boons[1], bane: banes[0], aeth: 0.3 });
  out.push({ boon: boons[2], bane: banes[1], aeth: 0.3 });
  return out;
}
function hordePick(i) {
  const D = G.dungeon; if (!D || !D.horde || D.state !== 'pick') return;
  const o = D.offer[i] || D.offer[0];
  D.hb[o.boon.k] = (D.hb[o.boon.k] || 0) + o.boon.v;
  if (o.bane) { D.hb[o.bane.k] = (D.hb[o.bane.k] || 0) + o.bane.v; D.hb.aethB = (D.hb.aethB || 0) + o.aeth; }
  D.picks.push(o.boon.txt + (o.bane ? ' · ' + o.bane.txt : ''));
  D.state = 'horde'; D.t = HORDE_WAVE_T; D.offer = null; D.spawnT = 1;
  G.panel = null; syncPanels();
  banner(_T`Vlna ${D.wave + 1}/${HORDE_WAVES}<small>${o.boon.txt}${o.bane ? ' · ' + o.bane.txt : ''}</small>`);
  recalcStats();
}
function hordeScale(e) {
  if (hb('eHp')) { e.hp *= 1 + hb('eHp'); e.maxHp = e.hp; }
  if (hb('eDmg')) e.dmgM *= 1 + hb('eDmg');
  if (hb('eSpd')) e.speedM *= 1 + hb('eSpd');
}
function hordeBossKilled(e) {
  const D = G.dungeon; G.boss = null;
  ring(e.x, e.y, '#c86bff', 420, 1.1); burst(e.x, e.y, '#c86bff', 120, 650, 3, 1); shake(10);
  D.state = 'chests'; D.aether += 25;
  ACC.st.hordes = (ACC.st.hordes || 0) + 1; ACC.hordeBest = Math.max(ACC.hordeBest || 0, D.aether); saveAccount();
  const A = G.arena;
  const bx = (P.x + A.x) / 2, by = (P.y + A.y) / 2;
  D.chests = HORDE_CHESTS.map((c, i) => ({ ...c, x: bx + (i - 1.5) * 150, y: by - 140, open: 0 }));
  D.portal = { x: bx, y: by + 180, kind: 'return', t: -1 };
  banner(_T`<span style="color:#c86bff">Horda porazená</span><small>Éter ${Math.floor(D.aether)} · otvor hromady pokladov</small>`);
  log(_T`<span style="color:#c86bff">Horda Prázdnoty</span> dokončená · ${Math.floor(D.aether)} éteru.`);
}
const HORDE_CHESTS = [
  { k: 'gear', cost: 40,  name: _L('Zbrojnica'),          sub: _L('3 predmety, 1 legendárny') },
  { k: 'gems', cost: 30,  name: _L('Klenotnica'),         sub: _L('2 drahokamy a úlomky') },
  { k: 'mats', cost: 25,  name: _L('Sklad'),              sub: _L('ruda a úlomky') },
  { k: 'leg',  cost: 120, name: _L('Poklad pána hordy'),  sub: _L('2 legendárky, šanca na set a mýtus') }
];
function openHordeChest(c) {
  const D = G.dungeon, L = D.lvl;
  if (D.aether < c.cost) { addText(P.x, P.y - 30, _T`Treba ${c.cost} éteru`, '#c86bff', 12, 0.9); return; }
  D.aether -= c.cost; c.open++;
  if (c.k === 'gear') { dropPickup('item', c.x, c.y, 1, generateItem(L, 'legendary')); dropItem(c.x, c.y, L, 2); dropItem(c.x, c.y, L, 2); }
  else if (c.k === 'gems') { dropGem(c.x, c.y, 1); dropGem(c.x, c.y, 1); addShards(8); }
  else if (c.k === 'mats') { dropOre(c.x, c.y, (200 + L * 12) * P.stats.yieldMult); addShards(12); }
  else {
    for (let i = 0; i < 2; i++) dropPickup('item', c.x, c.y, 1, generateItem(L, 'legendary'));
    if (G.tier >= 2 && Math.random() < 0.5) dropSet(c.x, c.y, L);
    if (mythTier() > 0 && Math.random() < 0.06 * mythTier() * mythMult()) dropMythic(pick(MYTHIC_LIST).id, c.x, c.y, L + 1);
  }
  ring(c.x, c.y, '#c86bff', 120, 0.5); burst(c.x, c.y, '#ffd36b', 30, 300, 2.4, 0.5);
}

/* ---------- shared hooks ---------- */
function endgameOnKill(e) {
  if (e.minion) return;
  if (stormHere()) {
    const n = e.isBoss ? 25 : e.hunter ? 15 : e.elite ? 4 : Math.random() < 0.2 ? 1 : 0;
    if (n) { G.storm.ember += n; addText(e.x, e.y - e.r - 18, _T`+${n} žiary`, '#c86bff', 11, 0.7); }
  }
  const D = G.dungeon;
  if (D && D.horde && D.state === 'horde') {
    const n = (e.elite ? 5 : 1) * (1 + hb('aeth') + hb('aethB'));
    D.aether += n;
    if (hb('heal')) P.hull = Math.min(P.stats.maxHull, P.hull + P.stats.maxHull * 0.01);
    if (hb('vol')) hazards.push({ kind: 'blast', x: e.x, y: e.y, r: 80, t: 0.7, t0: 0.7, dmg: 9 * e.dmgM });
  }
}
function endgameInteract() {
  if (stormHere() && G.storm.chests) for (const c of G.storm.chests) {
    if (c.gone || d2(c.x, c.y, P.x, P.y) > 95 * 95) continue;
    const cost = c.gift ? STORM_GIFT : STORM_CHEST;
    return { txt: c.gift ? _L('Mučivý dar') : _T`Prekliata truhlica · ${SLOTS[c.slot].name}`, sub: _T`cena ${cost} žiary · máš ${G.storm.ember}`, col: '#c86bff', act: () => openStormChest(c) };
  }
  const F = curFort();
  if (F && F.free && d2(F.x, F.y, P.x, P.y) < 150 * 150)
    return { txt: _L('Dokovať na základni'), sub: _L('servis · obchod · mapa'), col: '#5fd4ff', act: () => { P.hull = P.stats.maxHull; P.shield = P.stats.maxShield; openPanel('station'); } };
  return null;
}
function hordeInteract() {
  const D = G.dungeon; if (!D.chests) return null;
  for (const c of D.chests) if (d2(c.x, c.y, P.x, P.y) < 70 * 70)
    return { txt: c.name, sub: _T`${c.sub} · cena ${c.cost} éteru · máš ${Math.floor(D.aether)}`, col: '#c86bff', act: () => openHordeChest(c) };
  return null;
}

/* ---------- drawing ---------- */
const egVis = (x, y, r) => Math.abs(x - cam.x) < view.w / 2 / view.zoom + r && Math.abs(y - cam.y) < view.h / 2 / view.zoom + r;
function drawEndgameFx() {
  const F = curFort();
  if (F && egVis(F.x, F.y, FORT_R + 50)) {
    const col = F.free ? '#5fd4ff' : '#ff4d6d', t = G.time;
    ctx.save(); ctx.translate(F.x, F.y);
    ctx.globalAlpha = F.free ? 0.05 : 0.04; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, F.free ? FORT_SAFE : FORT_R, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([16, 12]);
    ctx.rotate(t * 0.04); ctx.beginPath(); ctx.arc(0, 0, F.free ? FORT_SAFE : FORT_R, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.rotate(-t * 0.04);
    ctx.globalAlpha = 1; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + t * 0.1; ctx.save(); ctx.rotate(a); ctx.strokeRect(46, -12, 34, 24); ctx.restore(); }
    ctx.fillStyle = '#0b1424'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3); ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
    ctx.restore();
    worldLabel(F.free ? _L('ZÁKLADŇA · BEZPEČNÁ ZÓNA') : G.siege ? _T`PEVNOSŤ · VLNA ${G.siege.wave}/3` : _L('OBSADENÁ PEVNOSŤ'), F.x, F.y + 74, col);
  }
  if (stormHere() && G.storm.chests) for (const c of G.storm.chests) {
    if (c.gone || !egVis(c.x, c.y, 60)) continue;
    const pulse = 1 + 0.08 * Math.sin(G.time * 4);
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#1a0b26'; ctx.strokeStyle = c.gift ? '#ffd36b' : '#c86bff'; ctx.lineWidth = 2.5;
    ctx.fillRect(-18, -13, 36, 26); ctx.strokeRect(-18, -13, 36, 26); ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(18, -2); ctx.stroke();
    ctx.restore();
    worldLabel(c.gift ? _T`MUČIVÝ DAR · ${STORM_GIFT}` : _T`${SLOTS[c.slot].name.toUpperCase()} · ${STORM_CHEST}`, c.x, c.y + 32, c.gift ? '#ffd36b' : '#c86bff', 10);
  }
  const D = G.dungeon;
  if (D && D.horde && D.chests) for (const c of D.chests) {
    ctx.save(); ctx.translate(c.x, c.y);
    ctx.fillStyle = '#1a0b26'; ctx.strokeStyle = c.k === 'leg' ? '#ff8a1f' : '#c86bff'; ctx.lineWidth = 2.5;
    ctx.fillRect(-22, -15, 44, 30); ctx.strokeRect(-22, -15, 44, 30);
    ctx.restore();
    worldLabel(_T`${c.name.toUpperCase()} · ${c.cost}`, c.x, c.y + 36, c.k === 'leg' ? '#ff8a1f' : '#c86bff', 10);
  }
}
function drawStormOverlay(W, H, dpr) {
  if (!stormHere()) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(120,40,180,0)'); g.addColorStop(1, 'rgba(110,30,170,.32)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawMinimapEndgame(k) {
  const F = curFort();
  if (F) { mctx.strokeStyle = F.free ? '#5fd4ff' : '#ff4d6d'; mctx.lineWidth = 1.5; mctx.strokeRect(F.x * k - 3.5, F.y * k - 3.5, 7, 7); }
  if (stormHere() && G.storm.chests) for (const c of G.storm.chests) if (!c.gone) { mctx.fillStyle = c.gift ? '#ffd36b' : '#c86bff'; mctx.fillRect(c.x * k - 2, c.y * k - 2, 4, 4); }
}
