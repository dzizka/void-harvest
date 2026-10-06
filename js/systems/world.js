'use strict';
/* =====================================================================
   5. SECTORS, TRAVEL & DUNGEONS
   ===================================================================== */
function setPalette(cols, theme) {
  BG.layers[0].c = makeNebula(1400, cols); BG.layers[0].pat = ctx.createPattern(BG.layers[0].c, 'repeat');
  BG.backdrop = theme && GFX.q !== 'low' ? makeBackdrop(theme) : null; BG.theme = theme;
}

function freeSpot(minStation, minPlayer, margin) {
  let x, y;
  for (let i = 0; i < 25; i++) {
    x = rand(margin, WORLD.w - margin); y = rand(margin, WORLD.h - margin);
    const okS = !G.station || d2(x, y, G.station.x, G.station.y) > minStation * minStation;
    const okP = d2(x, y, P.x, P.y) > minPlayer * minPlayer;
    if (okS && okP) break;
  }
  return { x, y };
}
function makeGate() {
  const S = curSector();
  let pos;
  for (let i = 0; i < 20; i++) {
    pos = freeSpot(1000, 700, 300);
    if (G.gates.every(g => d2(g.x, g.y, pos.x, pos.y) > 900 * 900)) break;
  }
  G.gates.push({ x: pos.x, y: pos.y, lvl: zoneLevel() + 1, boss: S.boss, t: rand(0, 10) });
}

function clearEntities() {
  asteroids = []; enemies = []; bullets = []; ebullets = []; missiles = []; pickups = []; particles = []; texts = []; trails = [];
  allies = []; orbs = []; echoes = []; hazards = []; minions = []; fires = [];
  if (P) P.drones = [];
  G.boss = null;
}
function loadSector(id, pos, restore) {
  const S = SECTORS[id];
  G.sector = id; G.dungeon = null; G.arena = null;
  WORLD.w = WORLD.h = S.size;
  clearEntities();
  const c = S.size / 2;
  G.station = { x: c, y: c, r: S.kind === 'safe' ? 0 : 400, dock: 190 };
  P.x = pos ? pos.x : c; P.y = pos ? pos.y : c + 150; P.vx = P.vy = 0;
  if (restore) { asteroids = restore.asteroids; pickups = restore.pickups; G.gates = restore.gates; }
  else {
    G.gates = [];
    for (let i = 0; i < S.astCount; i++) {
      const p = freeSpot(S.kind === 'safe' ? 280 : 470, 250, 80);
      asteroids.push(makeAsteroid(p.x, p.y, weighted({ 3: 3, 2: 4, 1: 3 }), null, S.ast));
    }
    if (S.kind === 'hostile') { makeGate(); makeGate(); }
  }
  G.spawnT = 3; G.astT = 0; G.waveT = 60; G.gateT = 120; G.safe = isSafe(); G.wasSafe = G.safe;
  G.event = null; G.eventT = rand(40, 70); G.hunterT = rand(60, 120);
  saveGame();
  setPalette(S.pal, id);
  cam.x = P.x; cam.y = P.y;
  banner(`${S.name}<small>${S.kind === 'safe' ? _L('Bezpečná zóna · žiadne útoky') : levelRange(S) + _L(' · bojová zóna')}</small>`);
}

function canWarp(id) {
  const S = SECTORS[id];
  if (id === G.sector && !G.dungeon) return _L('Tu sa práve nachádzaš.');
  if (P.level < S.min && !G.cheat.unlock) return _T`Sektor sa odomkne na úrovni ${S.min}.`;
  if (G.dungeon) return _L('Z brány sa nedá skočiť. Najprv ju dokonči.');
  if (!isSafe()) return _L('Hyperskok je možný len z bezpečnej zóny. Vráť sa k majáku v strede sektora.');
  return '';
}
function warpTo(id) {
  if (canWarp(id)) return;
  closePanels();
  transition(_L('Hyperskok · ') + SECTORS[id].name, () => { loadSector(id); log(_T`Prílet: ${SECTORS[id].name}.`); });
}

function enterDungeon(gate, key) {
  closePanels();
  G.saved = { sector: G.sector, asteroids, pickups, gates: G.gates.filter(g => g !== gate), x: gate.x, y: gate.y + 140 };
  G.dungeon = { boss: gate.boss, lvl: gate.lvl, room: 0, wave: 0, state: 'fight', waveT: 1.5, portal: null, sector: G.sector };
  if (key) {
    P.keys = P.keys.filter(k => k.id !== key.id);
    const sc = nmScale(key.lvl);
    G.dungeon.nm = { k: key.lvl, mods: key.mods, bonus: key.bonus, sc, t: 0, burnT: 3 };
    G.dungeon.lvl = gate.lvl + sc.lvl;
  }
  transition((key ? _T`Nočná brána ${key.lvl} · ` : _L('Vstup do brány · ')) + BOSSES[gate.boss].lair, loadRoom);
}
function loadRoom() {
  const D = G.dungeon, R = DUNGEON.R, def = roomDef(D);
  WORLD.w = WORLD.h = R * 2 + 400;
  const c = WORLD.w / 2;
  clearEntities();
  G.arena = { x: c, y: c, r: R }; G.station = null; G.gates = []; G.event = null;
  P.x = c; P.y = c + R - 160; P.vx = P.vy = 0;
  for (let i = 0; i < 5 + D.room * 2; i++) {
    const a = rand(0, TAU), d = rand(240, R - 160);
    asteroids.push(makeAsteroid(c + Math.cos(a) * d, c + Math.sin(a) * d, randi(1, 2), null, curSector().ast));
  }
  D.wave = 0; D.portal = null; D.waveT = 1.6;
  D.state = def.boss ? 'boss-intro' : 'fight';
  setPalette(DUNGEON.pal, 'dungeon');
  cam.x = P.x; cam.y = P.y;
  const B = BOSSES[D.boss];
  if (D.pinnacle) banner(_T`<span style="color:${B.color}">${B.name}</span><small>Vrcholný boss · úroveň ${D.lvl}</small>`);
  else if (def.boss) banner(_T`<span style="color:${B.color}">${B.name}</span><small>${B.lair} · komnata ${D.room + 1}/${DUNGEON.rooms.length}</small>`);
  else banner(_T`${B.lair}<small>Komnata ${D.room + 1}/${DUNGEON.rooms.length} · úroveň ${D.lvl}</small>`);
}
function spawnDungeonWave() {
  const D = G.dungeon, def = roomDef(D), A = G.arena;
  const n = Math.round((5 + Math.floor(Math.min(D.lvl, 40) / 2) + D.room * 2) * (nmHas('horde') ? 1.5 : 1));
  const pool = curSector().enemies;
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), x = A.x + Math.cos(a) * (A.r - 70), y = A.y + Math.sin(a) * (A.r - 70);
    spawnEnemy(weighted(pool), x, y, D.lvl, false);
    ring(x, y, '#ff4d6d', 40, 0.4);
  }
  if (def.elite && D.wave === def.waves - 1) {
    const a = rand(0, TAU);
    spawnEnemy(weighted(pool), A.x + Math.cos(a) * (A.r - 90), A.y + Math.sin(a) * (A.r - 90), D.lvl + 1, true);
  }
}
function spawnBoss(key, x, y, lvl) {
  const D = G.dungeon;
  key = key || D.boss;
  const B = BOSSES[key];
  if (x == null) { x = G.arena.x; y = G.arena.y - 220; lvl = D.lvl + 1; }
  const e = spawnEnemy('boss', x, y, lvl, false);
  e.T = { ...ENEMY_TYPES.boss, name: B.name, color: B.color };
  if (key === 'architect') { e.hp *= 2.5; e.maxHp = e.hp; e.r = 62; e.arch = { phase: 1, pylons: [] }; }
  e.B = B; e.bossKey = key; e.isBoss = true; e.pat = null; e.patT = 2; e.patStep = 0; e.patClock = 0; e.spA = 0; e.ph2 = false;
  G.boss = e;
  ring(e.x, e.y, B.color, 260, 0.9); shake(8);
  if (key !== 'architect' || !G.intro) G.intro = { e, t: 1.8, t0: 1.8 };
  return e;
}
function dungeonDirector(dt) {
  if (G.dungeon.climb) { climbDirector(dt); return; }
  if (G.dungeon.vault) { vaultDirector(dt); return; }
  if (G.dungeon.rush) { rushDirector(dt); return; }
  const D = G.dungeon, def = roomDef(D);
  if (D.portal) D.portal.t += dt;
  if (D.nm && D.state !== 'done') {
    D.nm.t += dt;
    if (!D.nm.late && D.nm.t > NM_LIMIT) { D.nm.late = true; log(_L('<span style="color:#ff6b5a">Časový limit nočnej brány vypršal.</span> Kľúč sa už nevylepší.')); }
    if (nmHas('burning') && (D.state === 'fight' || D.state === 'boss') && (D.nm.burnT -= dt) <= 0) {
      D.nm.burnT = rand(2.2, 3.2);
      const a = rand(0, TAU), d = rand(0, 140);
      hazards.push({ kind: 'fire', x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, r: 85, t: 1.1, t0: 1.1, life: 2.6, tick: 0, dps: 14 * nmEnemyDmgScale() });
    }
  }
  if (D.state === 'fight' && enemies.length === 0) {
    if (D.wave < def.waves) { D.waveT -= dt; if (D.waveT <= 0) { spawnDungeonWave(); D.wave++; D.waveT = 1.4; } }
    else {
      D.state = 'clear';
      D.portal = { x: G.arena.x, y: G.arena.y - G.arena.r + 150, kind: 'next', t: 0 };
      ring(D.portal.x, D.portal.y, '#5fd4ff', 140, 0.8);
      log(_L('Komnata vyčistená. Portál do ďalšej komnaty je otvorený.'));
    }
  } else if (D.state === 'boss-intro') { D.waveT -= dt; if (D.waveT <= 0) { spawnBoss(); D.state = 'boss'; } }
}
const roomDef = D => D.climb ? { waves: 0 } : D.pinnacle ? { boss: true } : DUNGEON.rooms[D.room];
function enterPinnacle() {
  if (!FRAG_BOSSES.every(k => (P.frags[k] || 0) > 0) || G.dungeon) return;
  for (const k of FRAG_BOSSES) P.frags[k]--;
  closePanels();
  G.saved = { sector: G.sector, asteroids, pickups, gates: G.gates, x: P.x, y: P.y };
  const lvl = Math.max(P.level, LEVEL_CAP) + TIERS[G.tier].lvl + 3;
  G.dungeon = { boss: 'architect', pinnacle: true, lvl, room: 0, wave: 0, state: 'fight', waveT: 1.5, portal: null, sector: G.sector };
  saveGame();
  transition(_L('Trhlina Architekta'), loadRoom);
}
function archUpdate(e) {
  const A = e.arch, ar = G.arena;
  if (A.phase === 1 && e.hp < e.maxHp * 0.66) {
    A.phase = 2; e.shielded = true;
    A.pylons = [0, 1, 2, 3].map(i => {
      const a = i / 4 * TAU + Math.PI / 4;
      const p = spawnEnemy('gunship', ar.x + Math.cos(a) * 520, ar.y + Math.sin(a) * 520, e.lvl - 2, false);
      p.pylon = true; p.minion = true; p.speedM = 0; p.hp *= 1.2; p.maxHp = p.hp;
      ring(p.x, p.y, '#e8e2ff', 70, 0.5);
      return p;
    });
    banner(_L('<span style="color:#e8e2ff">Architekt Prázdnoty</span><small>Fáza 2 · zničte 4 pylóny, kým je chránený</small>')); shake(10);
  }
  if (A.phase === 2 && e.shielded && A.pylons.every(p => p.dead)) { e.shielded = false; ring(e.x, e.y, '#e8e2ff', 300, 0.7); banner(_L('Štít Architekta padol<small>Teraz útoč</small>')); }
  if (A.phase === 2 && !e.shielded && e.hp < e.maxHp * 0.33) { A.phase = 3; ring(e.x, e.y, '#ff5f6d', 380, 0.9); shake(12); banner(_L('<span style="color:#ff5f6d">Architekt Prázdnoty</span><small>Fáza 3 · zúrivosť</small>')); }
}
function onArchitectKilled(e) {
  const D = G.dungeon, L = e.lvl;
  G.archKills = (G.archKills || 0) + 1;
  const first = G.archKills === 1;
  for (let i = 0; i < 4; i++) dropItem(e.x, e.y, L, 2);
  for (let i = 0; i < 2; i++) dropPickup('item', e.x, e.y, 1, generateItem(L, 'legendary'));
  dropGem(e.x, e.y, 2); dropGem(e.x, e.y, 1);
  addShards(20);
  dropSet(e.x, e.y, L); grantRune(); ACC.st.bosses.architect = 1;
  if (G.tier >= 4) { G.forcePrimal = true; const pr = generateItem(L, Math.random() < 0.5 ? 'legendary' : 'set'); G.forcePrimal = false; dropPickup('item', e.x, e.y, 1, pr); }
  dropOre(e.x, e.y, (200 + L * 10) * P.stats.yieldMult);
  if (first || Math.random() < LEGEND_INDEX.crown.chance * (G.tier >= 4 ? 2 : 1) * mythMult()) dropMythic('crown', e.x, e.y, L + 1);
  else if (Math.random() < 0.1 * mythMult()) dropMythic(pick(MYTHIC_LIST.filter(m => m.id !== 'voidecho')).id, e.x, e.y, L + 1);
  for (const m of enemies) if (m.minion && !m.dead) killEnemy(m);
  ring(e.x, e.y, '#e8e2ff', 520, 1.4); burst(e.x, e.y, '#e8e2ff', 200, 800, 4, 1.4); burst(e.x, e.y, '#c77dff', 80, 500, 3, 1);
  shake(16);
  if (!first) banner(_L('Architekt Prázdnoty porazený<small>Vrcholná odmena čaká · portál domov sa otvára</small>'));
  log(_T`<span style="color:#e8e2ff">Architekt Prázdnoty porazený</span> (${G.archKills}×).`);
  if (G.tier >= 3 && G.maxTier < 4) {
    G.maxTier = 4;
    log(_T`<span style="color:#5be09a">Odomknutá svetová úroveň ${TIERS[4].name}</span> (od úrovne ${TIERS[4].req}). Zmeníš ju na stanici.`);
    setTimeout(() => banner(_T`Svetová úroveň IV<small>Odomknutá · zmeníš ju na stanici</small>`), 2800);
  }
  D.state = 'done';
  D.portal = { x: G.arena.x, y: G.arena.y + 140, kind: 'return', t: -2 };
  contractTick('gate');
  G.boss = null;
  saveGame();
}
function onBossKilled(e) {
  if (e.bossKey === 'architect') { onArchitectKilled(e); return; }
  if (e.wb) { worldBossKilled(e); return; }
  if (e.rushB) { rushBossKilled(e); return; }
  if (e.climbG) {
    G.boss = null; addShards(2); if (Math.random() < 0.5) dropGem(e.x, e.y, 1);
    ring(e.x, e.y, '#9a8cff', 320, 0.9); burst(e.x, e.y, '#9a8cff', 90, 600, 3, 1); shake(10);
    if (G.dungeon && G.dungeon.state === 'climb') nextClimbFloor();
    return;
  }
  const D = G.dungeon, sec = D ? D.sector : G.sector, S = SECTORS[sec];
  G.bossKills[sec] = (G.bossKills[sec] || 0) + 1;
  const first = G.bossKills[sec] === 1;
  const NMk = D && D.nm ? D.nm.k : 0;
  const extra = NMk ? 1 + Math.floor(NMk / 8) + (nmHas('loot') ? 2 : 0) : 0;
  for (let i = 0; i < 3 + extra; i++) dropItem(e.x, e.y, e.lvl, 2);
  const BL = bossLoot(e.bossKey);
  if (first || Math.random() < (BL ? 0.5 : 0.35)) {
    const lid = BL && Math.random() < 0.7 ? pick(BL.legs) : null;
    const it = generateItem(e.lvl, 'legendary', lid ? LEGEND_INDEX[lid].slot : null, null, lid);
    dropPickup('item', e.x, e.y, 1, it);
    banner(`<span style="color:${RARITY.legendary.color}">${it.name}</span><small>${first ? _L('Prvé víťazstvo · garantovaný legendárny predmet') : _L('Legendárny predmet padol')}</small>`);
  } else banner(_T`${e.B.name} porazený<small>${D ? _L('Pozbieraj loot, portál domov sa otvára') : _L('Pozbieraj loot')}</small>`);
  dropOre(e.x, e.y, (30 + e.lvl * 8) * P.stats.yieldMult);
  if (Math.random() < 0.6) dropGem(e.x, e.y, NMk >= 15 && Math.random() < 0.3 ? 2 : NMk >= 5 ? 1 : Math.random() < 0.2 ? 1 : 0);
  addShards(NMk ? 2 + Math.floor(NMk / 5) : 1);
  if ((G.tier >= 2 || NMk) && Math.random() < (G.tier >= 3 ? 0.25 : 0.15) + NMk * 0.01) dropSet(e.x, e.y, e.lvl, BL && Math.random() < 0.6 ? BL.set : null);
  ACC.st.bosses[e.bossKey] = 1;
  const myth = BOSS_MYTHIC[e.bossKey];
  if (myth && mythTier() > 0 && Math.random() < LEGEND_INDEX[myth].chance * mythTier() * mythMult()) dropMythic(myth, e.x, e.y, e.lvl + 1);
  if (FRAG_BOSSES.includes(e.bossKey)) {
    const ch = G.tier >= 3 || NMk >= 10 ? 1 : G.tier === 2 ? 0.4 : 0;
    if (Math.random() < ch) {
      P.frags[e.bossKey] = (P.frags[e.bossKey] || 0) + 1;
      log(_T`<span style="color:#e8e2ff">Úlomok Architekta</span> od bossa ${BOSSES[e.bossKey].name} (${FRAG_BOSSES.filter(k => P.frags[k] > 0).length}/4 druhov).`);
    }
  }
  if (G.tier >= G.maxTier && G.maxTier < 3 && e.bossKey === TIER_UNLOCK[G.maxTier + 1]) {
    G.maxTier++;
    log(_T`<span style="color:#5be09a">Odomknutá svetová úroveň ${TIERS[G.maxTier].name}</span> (od úrovne ${TIERS[G.maxTier].req}). Zmeníš ju na stanici.`);
    setTimeout(() => banner(_T`Svetová úroveň ${TIERS[G.maxTier].roman}<small>Odomknutá · zmeníš ju na stanici</small>`), 2800);
  }
  for (const m of enemies) if (m.minion && !m.dead) killEnemy(m);
  ring(e.x, e.y, e.B.color, 420, 1.2); burst(e.x, e.y, e.B.color, 160, 700, 3.5, 1.2); burst(e.x, e.y, '#ffffff', 50, 400, 2.5, 0.8);
  shake(14);
  if (D) {
    D.state = 'done';
    D.portal = { x: G.arena.x, y: G.arena.y + 120, kind: 'return', t: -1.5 };
    contractTick('gate');
    if (D.nm) {
      const N = D.nm, inTime = N.t <= NM_LIMIT, fast = N.t <= NM_LIMIT / 2;
      const next = N.k + (fast ? 2 : inTime ? 1 : 0);
      dropKey(e.x, e.y, next);
      if (inTime) {
        G.nmBest = Math.max(G.nmBest || 0, N.k); contractTick('nm', { k: N.k });
        levelRunes(N.k);
        if (Math.random() < 0.25 + N.k * 0.01) grantRune();
        if (N.k >= 20 && !D.hurt) ACC.st.flawless = 1;
      }
      setTimeout(() => banner(_T`Nočná brána ${N.k} ${inTime ? _L('dokončená') : _L('dokončená po limite')}<small>Čas ${fmtTime(N.t)} · nový kľúč úroveň ${next}${fast ? _L(' · rýchly beh +2') : ''}</small>`), 2800);
      log(_T`Nočná brána ${N.k}: ${fmtTime(N.t)}. ${inTime ? _L('V limite.') : _L('Po limite.')} Nový kľúč úr. ${next}.`);
    } else dropKey(e.x, e.y, keyBaseLevel());
  }
  log(_T`<span style="color:${e.B.color}">${e.B.name}</span> porazený v sektore ${S.name}.`);
  G.boss = null;
}
