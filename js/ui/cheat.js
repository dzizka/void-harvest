'use strict';
/* ---------- secret dev / cheat menu ---------- */
function renderCheat() {
  const C = G.cheat;
  const tog = (key, label) => `<button type="button" class="btn tog" data-cheat="tog" data-key="${key}" aria-pressed="${C[key]}">${label}</button>`;
  const btn = (act, label, extra) => `<button type="button" class="btn devbtn" data-cheat="${act}" ${extra || ''}>${label}</button>`;
  const inDungeon = !!G.dungeon, S = curSector();
  $('cheatBody').innerHTML = _T`
    <div class="st-card">
      <span class="eyebrow">Prepínače</span>
      <div class="cheat-row">${tog('god', _L('Nesmrteľnosť'))}${tog('oneHit', _L('Zabitie na 1 ránu'))}${tog('unlock', _L('Odomknúť sektory'))}${tog('debug', _L('Debug info'))}${tog('mythBoost', _L('Mýtické ×1000'))}</div>
      <span class="eyebrow">Rýchlosť hry</span>
      <span class="eyebrow">Svetová úroveň</span>
      <div class="seg">${[1, 2, 3, 4].map(t => `<button type="button" data-cheat="tier" data-v="${t}" aria-pressed="${G.tier === t}">${TIERS[t].roman}</button>`).join('')}</div>
      <span class="eyebrow">Rýchlosť</span>
      <div class="seg">${[0.5, 1, 2, 4].map(v => `<button type="button" data-cheat="speed" data-v="${v}" aria-pressed="${C.speed === v}">${v}×</button>`).join('')}</div>
    </div>
    <div class="st-card">
      <span class="eyebrow">Pilot · úroveň <b>${P.level}</b> · ruda <b>${P.ore}</b> · body <b>${P.points}</b></span>
      <div class="cheat-row">${btn('lvl1', _L('+1 úroveň'))}${btn('lvl5', _L('+5 úrovní'))}${btn('ore', _L('+1000 rudy'))}${btn('pts', _L('+5 bodov talentu'))}${btn('heal', _L('Plná oprava'))}</div>
    </div>
    <div class="st-card">
      <span class="eyebrow">Výbava · náklad <b>${P.inv.length}/30</b></span>
      <div class="cheat-row">
        <label class="field">Rarita<select id="chRar">${Object.keys(RARITY).map(r => `<option value="${r}" ${r === 'legendary' ? 'selected' : ''}>${RARITY[r].name}</option>`).join('')}</select></label>
        <label class="field">Slot<select id="chSlot"><option value="">Náhodný</option>${SLOT_ORDER.map(sl => `<option value="${sl}">${SLOTS[sl].name}</option>`).join('')}</select></label>
        <label class="field">iLvl<input id="chIlvl" type="number" min="1" max="60" value="${P.level}"></label>
        ${btn('item', _L('Pridať predmet'))}
      </div>
      <div class="cheat-row">${btn('legset', _L('Nasadiť legendárny set'))}${btn('fill', _L('Naplniť náklad'))}${btn('clear', _L('Vyprázdniť náklad'))}</div>
      <div class="cheat-row">${btn('para5', _L('+5 paragon'))}${btn('frags', _L('+úlomky Architekta'))}${btn('shards', _L('+50 úlomkov'))}${btn('gems', _L('+drahokamy'))}${btn('codex', _L('Celý kódex'))}${btn('keys10', _L('+3 kľúče úr. 10'))}${btn('keys30', _L('+1 kľúč úr. 30'))}${btn('nmwin', _L('Vyhrať nočnú bránu'), G.dungeon && G.dungeon.nm ? '' : 'disabled')}</div>
    </div>
    <div class="st-card">
      <span class="eyebrow">Svet · ${inDungeon ? BOSSES[G.dungeon.boss].lair : S.name}</span>
      <div class="cheat-row">
        ${btn('boss', _L('Privolať bossa'), S.kind === 'safe' && !inDungeon ? 'disabled' : '')}
        ${btn('elite', _L('Elitná letka'), S.kind === 'safe' && !inDungeon ? 'disabled' : '')}
        ${btn('killall', _L('Zničiť nepriateľov'))}
        ${btn('gate', _L('Brána pri lodi'), S.kind === 'safe' || inDungeon ? 'disabled' : '')}
        ${btn('skiproom', _L('Preskočiť komnatu'), inDungeon && G.dungeon.state === 'fight' ? '' : 'disabled')}
        ${btn('event', _L('Spustiť udalosť'), inDungeon || G.event ? 'disabled' : '')}
        ${btn('hunter', _L('Privolať lovca'), S.kind === 'safe' || inDungeon ? 'disabled' : '')}
        ${btn('contracts', _L('Splniť kontrakty'))}
      </div>
      <span class="cheat-note">Bossa mimo brány dostaneš aj s lootom, ale bez portálu.</span>
    </div>
    <div class="st-card full">
      <span class="eyebrow">Testovacie buildy · ${CLASSES[P.cls].name}</span>
      <div class="cheat-row">${btn('top', _L('Top výbava (mýtické + drahokamy)'), 'data-v=""')}${TREES[P.cls].map(B => btn('top', _L('Build: ') + B.name, `data-v="${B.id}"`)).join('')}${btn('talreset', _L('Reset talentov zadarmo'))}</div>
      <div class="cheat-row">${TREES[P.cls].map(B => btn('set', _L('Set: ') + B.name, `data-v="${B.id}"`)).join('')}${btn('runes', _L('Všetky runy úr. 20'))}${btn('achall', _L('Splniť výzvy (test)'))}${btn('primal', _L('+Prvotný predmet'))}${btn('stars', _L('+Legendárka ✦✦✦')) + btn('mats', _L('+50 materiálov'))}${btn('vfrags', _L('+5 úlomkov mapy'))}${btn('mythdup', _L('+Duplikát mýtu zbrane'))}</div>
      <div class="cheat-row">${btn('wbnow', _L('Svetový boss sem (5 s)'), S.kind === 'safe' || inDungeon ? 'disabled' : '')}${btn('climb', _L('Výstup od poschodia 1'), inDungeon ? 'disabled' : '')}${btn('climbfloor', _L('Výstup: zdolať poschodie'), inDungeon && G.dungeon.climb ? '' : 'disabled')}${btn('climbend', _L('Výstup: ukončiť časom'), inDungeon && G.dungeon.climb ? '' : 'disabled')}</div>
      <span class="cheat-note">Top výbava: 5 mýtických + 2 legendárne, iLvl 60+, pradávne, +10, najlepšie afixy a dokonalé rubíny (zbraň má topás). Build navyše nastaví úroveň 50, legendárku buildu, ranky talentov na výbave a rozdelí body: celá vetva + kľúčový talent, zvyšok do ďalších vetiev.</span>
    </div>
    <div class="st-card full">
      <span class="eyebrow">Teleport bez obmedzení</span>
      <div class="cheat-row">${Object.entries(SECTORS).map(([id, X]) => btn('warp', X.name, `data-v="${id}"`)).join('')}</div>
    </div>`;
}
function cheatLevels(n) {
  for (let i = 0; i < n && P.level < LEVEL_CAP; i++) { P.level++; P.points++; }
  P.xp = 0; recalcStats();
  P.hull = P.stats.maxHull; P.shield = P.stats.maxShield;
  ring(P.x, P.y, '#b48cff', 220, 0.8);
  log(_T`DEV: úroveň ${P.level}.`);
}
function autoAllocTalents(bid) {
  const T = TREES[P.cls], first = T.find(b => b.id === bid) || T[0];
  refundTalents();
  for (const B of [first, ...T.filter(b => b !== first)]) {
    for (let tier = 0; tier < 3; tier++) for (const n of B.nodes) if (n.t === tier) while (canAddTalent(n.id)) { P.tal[n.id] = (P.tal[n.id] || 0) + 1; P.points--; }
    if (B === first && canAddTalent(B.key.id)) { P.tal[B.key.id] = 1; P.points--; }
  }
}
// test helper: max upgrades, best affixes from a wish list, perfect gems
function perfectItem(it, wish, talId) {
  const sl = it.slot, myth = it.rarity === 'mythic';
  it.anc = true; it.stars = Math.max(1, it.stars || 0); it.upg = 10;
  const keys = wish.filter(k => AFFIXES[k].slots.includes(sl));
  for (const k of ['allDmg', 'area', 'crit', 'atkSpd', 'hull', 'shield', 'speed', 'laser', 'missile']) if (keys.length < 4 && !keys.includes(k) && AFFIXES[k].slots.includes(sl)) keys.push(k);
  it.affixes = keys.slice(0, 4).map(k => ({ key: k, val: rollAffixVal(it, k) }));
  if (myth) { it.affixes[0].val = Math.round(it.affixes[0].val * 1.5); it.affixes[0].greater = true; }
  it.affixes.sort((a, b) => AFFIX_ORDER.indexOf(a.key) - AFFIX_ORDER.indexOf(b.key));
  it.sockets = Array.from({ length: MAX_SOCKETS[RARITY[it.rarity].rank] }, (_, i) => ({ t: sl === 'weapon' && i === 0 ? 'topaz' : 'ruby', q: 2 }));
  it.tal = talId ? { cls: P.cls, id: talId, v: 3 } : null;
  return it;
}
function cheatTopGear(bid) {
  const T = TREES[P.cls], B = bid ? T.find(b => b.id === bid) : null;
  if (B) { cheatLevels(LEVEL_CAP); autoAllocTalents(bid); }
  const il = Math.max(60, zoneLevel() + 2);
  const legs = { weapon: 'singularity', secondary: 'broodheart', shield: 'tessarEye', engine: 'phaseCut', reactor: 'crown', drones: 'swarmlord', armor: 'bulwark' };
  if (B) legs[B.leg.slot] = 'b_' + B.id;
  const wish = B ? B.wish : ['allDmg', 'area', 'crit', 'atkSpd', 'laser', 'missile'];
  SLOT_ORDER.forEach((sl, si) => {
    const id = legs[sl], myth = MYTHIC_LIST.some(m => m.id === id);
    const type = (B && B.types[sl]) || P.equip[sl].type;
    const it = generateItem(il, myth ? 'mythic' : 'legendary', sl, type, id);
    if (myth) G.found[id] = true;
    perfectItem(it, wish, B ? B.nodes[si % B.nodes.length].id : null);
    P.equip[sl] = it;
  });
  recalcStats(); P.hull = P.stats.maxHull; P.shield = P.stats.maxShield;
  log(_T`DEV: ${B ? `build <span style="color:${B.color}">${B.name}</span>` : _L('top výbava')} nasadený · ${fmtN(P.stats.laserDps)} laser DPS.`);
}
function cheatAction(el) {
  const act = el.dataset.cheat, C = G.cheat, S = curSector();
  switch (act) {
    case 'tog': C[el.dataset.key] = !C[el.dataset.key]; break;
    case 'speed': C.speed = +el.dataset.v; break;
    case 'tier': G.tier = +el.dataset.v; G.maxTier = Math.max(G.maxTier, G.tier); for (const g of G.gates) g.lvl = zoneLevel() + 1; break;
    case 'lvl1': cheatLevels(1); break;
    case 'lvl5': cheatLevels(5); break;
    case 'ore': P.ore += 1000; break;
    case 'pts': P.points += 5; break;
    case 'heal': P.hull = P.stats.maxHull; P.shield = P.stats.maxShield; break;
    case 'top': cheatTopGear(el.dataset.v || null); break;
    case 'talreset': refundTalents(); recalcStats(); break;
    case 'set': {
      const il = Math.max(60, zoneLevel() + 2);
      for (const sl of SET_SLOTS) {
        const B = TBRANCH[P.cls + ':' + el.dataset.v], it = generateItem(il, 'set', sl, (B.types || {})[sl] || P.equip[sl].type, el.dataset.v);
        P.equip[sl] = perfectItem(it, B.wish, B.nodes[SET_SLOTS.indexOf(sl)].id);
      }
      recalcStats(); P.shield = P.stats.maxShield; log(_T`DEV: ${setName(el.dataset.v)} nasadený (4/4).`);
      break;
    }
    case 'runes': { const PA = P.para; PA.rl = PA.rl || {}; for (const r in RUNES) PA.rl[r] = 20; recalcStats(); break; }
    case 'wbnow': G.wb = { state: 'warn', t: 5, sec: G.sector, hp: 1, pos: null, w30: true }; closePanels(); return;
    case 'climb': closePanels(); enterClimb(1); return;
    case 'climbfloor': { const D = G.dungeon; if (D.guardian) killEnemy(D.guardian); else D.prog = CLIMB_NEED; closePanels(); return; }
    case 'climbend': G.dungeon.t = CLIMB_LIMIT; closePanels(); return;
    case 'vfrags': P.vaultFrags = (P.vaultFrags || 0) + 5; break;
    case 'mats': for (const k of MAT_KEYS) giveMat(k, 50); saveAccount(); log(_L('DEV: +50 každého materiálu')); break;
    case 'stars': { if (P.inv.length >= HOLD_MAX) break; G.forceGA = 3; const it = generateItem(Math.max(60, zoneLevel() + 2), 'legendary'); G.forceGA = 0; P.inv.push(it); log(`DEV: <span style="color:#ffd36b">✦✦✦ ${it.name}</span>`); break; }
    case 'primal': { if (P.inv.length >= HOLD_MAX) break; G.forcePrimal = true; const it = generateItem(Math.max(60, zoneLevel() + 2), 'legendary'); G.forcePrimal = false; P.inv.push(it); log(`DEV: <span style="color:#ff5a5a">${it.name}</span>`); break; }
    case 'mythdup': { const w = P.equip.weapon; if (w.rarity === 'mythic' && P.inv.length < HOLD_MAX) P.inv.push(generateItem(w.ilvl, 'mythic', null, null, w.legend)); break; }
    case 'achall': for (const A of ACH) ACC.ach[A.id] = ACC.ach[A.id] || Date.now(); saveAccount(); break;
    case 'item': {
      if (P.inv.length >= HOLD_MAX) { log(_L('DEV: náklad je plný.')); break; }
      const it = generateItem(clamp(+$('chIlvl').value || P.level, 1, 60), $('chRar').value, $('chSlot').value || null);
      P.inv.push(it); log(`DEV: <span style="color:${RARITY[it.rarity].color}">${it.name}</span> iLvl ${it.ilvl}`);
      break;
    }
    case 'legset':
      for (const sl of SLOT_ORDER) P.equip[sl] = generateItem(P.level, 'legendary', sl);
      recalcStats(); P.shield = P.stats.maxShield; log(_L('DEV: legendárny set nasadený.'));
      break;
    case 'fill': while (P.inv.length < HOLD_MAX) P.inv.push(generateItem(P.level, rollRarity(1))); break;
    case 'clear': P.inv = []; break;
    case 'shards': P.shards += 50; break;
    case 'para5': P.para.lvl += 5; P.para.pts += 5; break;
    case 'frags': for (const k of FRAG_BOSSES) P.frags[k] = (P.frags[k] || 0) + 1; break;
    case 'gems': for (const t in GEMS) { P.gems[t][0] += 3; P.gems[t][1] += 1; } break;
    case 'codex': G.codex = G.codex || {}; for (const l of LEGEND_POOL) G.codex[l.id] = true; break;
    case 'keys10': for (let i = 0; i < 3 && P.keys.length < 20; i++) P.keys.push(makeKey(10)); break;
    case 'keys30': if (P.keys.length < 20) P.keys.push(makeKey(30)); break;
    case 'nmwin': {
      const D = G.dungeon; D.room = DUNGEON.rooms.length - 1; closePanels();
      for (const e of enemies) e.dead = true; enemies = [];
      const b = spawnBoss(D.boss, P.x, P.y - 300, D.lvl + 1); killEnemy(b);
      return;
    }
    case 'boss': {
      const key = G.dungeon ? G.dungeon.boss : S.boss, a = P.a;
      spawnBoss(key, P.x + Math.cos(a) * 420, P.y + Math.sin(a) * 420, zoneLevel() + 1);
      closePanels(); return;
    }
    case 'elite': {
      const pool = S.enemies, z = zoneLevel();
      for (let i = 0; i < 5; i++) { const a = rand(0, TAU); spawnEnemy(weighted(pool), P.x + Math.cos(a) * 450, P.y + Math.sin(a) * 450, z, i === 0); }
      closePanels(); return;
    }
    case 'killall': for (const e of enemies) killEnemy(e); break;
    case 'event': startEvent(); if (G.event) { G.event.x = P.x + Math.cos(P.a) * 300; G.event.y = P.y + Math.sin(P.a) * 300; if (G.event.ship) { G.event.ship.x = G.event.x; G.event.ship.y = G.event.y; G.event.dist = Math.hypot(G.event.ship.tx - G.event.x, G.event.ship.ty - G.event.y); } if (G.event.nodes) G.event.nodes.forEach((n, i) => { const a = i / 3 * TAU; n.x = G.event.x + Math.cos(a) * 230; n.y = G.event.y + Math.sin(a) * 230; }); } closePanels(); return;
    case 'hunter': spawnHunter(); closePanels(); return;
    case 'contracts': for (const c of P.contracts) { c.prog = c.n; c.done = true; } break;
    case 'gate':
      G.gates.push({ x: P.x + Math.cos(P.a) * 220, y: P.y + Math.sin(P.a) * 220, lvl: zoneLevel() + 1, boss: S.boss, t: 0 });
      closePanels(); return;
    case 'skiproom': {
      const D = G.dungeon; D.wave = DUNGEON.rooms[D.room].waves;
      for (const e of enemies) killEnemy(e);
      closePanels(); return;
    }
    case 'warp': {
      const id = el.dataset.v;
      closePanels();
      G.saved = null;
      transition(_L('DEV teleport · ') + SECTORS[id].name, () => { loadSector(id); });
      return;
    }
  }
  renderCheat(); updateHUD();
}
$('cheatBody').addEventListener('click', e => { const el = e.target.closest('[data-cheat]'); if (el && !el.disabled) cheatAction(el); });
$('abAuto').addEventListener('click', () => { if (G) { G.autoFire = !G.autoFire; updateHUD(); } });
$('abMine').addEventListener('click', () => { if (G) { G.autoMine = !G.autoMine; updateHUD(); } });
$('abAutoSk').addEventListener('click', () => { if (G) { G.autoSkill = !G.autoSkill; log(G.autoSkill ? _L('Auto-schopnosti zapnuté.') : _L('Auto-schopnosti vypnuté.')); updateHUD(); } });
