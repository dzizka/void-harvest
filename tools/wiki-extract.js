'use strict';
// Runs INSIDE the game page (Playwright page.evaluate): collects everything the wiki shows straight
// from the game data, already translated to the page language. Kept as a separate file so the
// generator (tools/wiki.js) stays readable.
module.exports = function extractWiki() {
  window.saveGame = () => {}; window.saveAccount = () => {};
  startGame('interceptor'); P.story.shown = true; G.panel = null; syncPanels();
  const strip = h => String(h).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const r1 = v => Math.round(v * 10) / 10;
  const out = { lang: LANG };

  /* ---------- ships ---------- */
  out.ships = Object.entries(CLASSES).map(([k, c]) => ({
    k, name: c.name, role: c.role, color: c.color, desc: c.desc, perks: c.perks,
    stats: { hull: c.hull, shield: c.shield, speed: c.speed, crit: c.crit, dodge: c.dodge, magnet: c.magnet, fireMult: c.fireMult },
    meters: Object.entries(c.meters).map(([m, v]) => [_L(m), v]),
    start: Object.entries(c.start).map(([sl, t]) => [SLOTS[sl].name, SLOTS[sl].types[t].name]),
    dodge: { name: DODGES[k].name, cd: DODGES[k].cd, charges: DODGES[k].charges || 1, desc: DODGES[k].desc },
    skills: (CLS_SKILLS[k] || []).map(id => { const S = SKILLS[id]; return { id, name: S.name, lvl: S.lvl, cd: S.cd, desc: S.desc, mods: S.mods.map(m => [m.name, m.desc]) }; }),
    trees: TREES[k].map(B => ({
      id: B.id, name: B.name, color: B.color, desc: B.desc,
      wish: (B.wish || []).map(a => strip(AFFIXES[a].label('')).replace(/^\+%?\s*/, '')),
      types: Object.entries(B.types || {}).map(([sl, t]) => SLOTS[sl].types[t].name),
      leg: { slot: SLOTS[B.leg.slot].name, name: B.leg.name },
      set: { name: setName(B.id), t4: SET4[B.id].t },
      nodes: B.nodes.map(n => ({ name: n.name, max: n.max, tier: n.t, txt: strip(n.txt(n.per)) })),
      key: { name: B.key.name, text: B.key.text }
    }))
  }));
  out.dodgeMods = DODGE_MODS.map(m => [m.name, m.desc]);
  out.talentReq = { tiers: TIER_REQ, key: KEY_REQ, over: TAL_OVER };

  /* ---------- items ---------- */
  out.rarity = Object.entries(RARITY).map(([k, R]) => ({ k, name: R.name, color: R.color, mark: R.mark, affixes: R.affixes, mult: R.baseMult, rank: R.rank }));
  out.rarityTables = RARITY_TABLES.map(t => Object.entries(t).map(([k, v]) => [RARITY[k].name, RARITY[k].color, v]));
  out.slots = SLOT_ORDER.map(sl => ({ k: sl, name: SLOTS[sl].name, types: Object.entries(SLOTS[sl].types).map(([t, T]) => ({ name: T.name,
    stats: Object.entries(T).filter(([s]) => BASE_LABEL[s]).map(([s, v]) => `${BASE_LABEL[s][0]} ${strip(BASE_LABEL[s][1](v))}`) })) }));
  const it = (r, anc, il) => ({ ilvl: il, rarity: r, anc });
  out.affixes = AFFIX_ORDER.map(k => ({
    name: strip(AFFIXES[k].label('')).replace(/^\+%?\s*/, ''),
    slots: AFFIXES[k].slots.length === ALL.length ? _L('všetky') : AFFIXES[k].slots.map(sl => SLOTS[sl].name).join(', '),
    r1: affixRange(it('rare', false, 1), k), r30: affixRange(it('legendary', false, 30), k), r60: affixRange(it('legendary', false, 60), k),
    r60a: affixRange(it('legendary', true, 60), k), r60g: affixRange(it('legendary', true, 60), k, true)
  }));
  out.legends = LEGEND_POOL.map(l => ({ id: l.id, name: l.name, power: l.power, slot: l.slot ? SLOTS[l.slot].name : '—', cls: l.cls ? CLASSES[l.cls].name : '', clsK: l.cls || '',
    skill: l.skill ? SKILLS[l.skill].name : '', build: l.build ? TBRANCH[l.cls + ':' + l.build].name : '',
    boss: BOSS_ORDER.filter(b => BOSS_LEGS[b].includes(l.id)).map(b => BOSSES[b].name) }));
  out.mythics = MYTHIC_LIST.map(m => ({ name: m.name, power: m.power, source: m.source, slot: m.slot ? SLOTS[m.slot].name : _L('všetky') }));
  out.gems = Object.values(GEMS).map(g => ({ name: g.name, color: g.color, label: g.label, vals: g.vals }));
  out.gemQ = GEM_Q; out.sockets = MAX_SOCKETS; out.shardsFor = SHARDS_FOR;
  out.salvage = out.rarity.filter(r => r.rank < 5).map(r => [r.name, r.color, salvageValue({ rarity: r.k, ilvl: 1, upg: 0, affixes: [] }), salvageValue({ rarity: r.k, ilvl: 30, upg: 0, affixes: [] })]);
  out.upgrade = { max: MAX_UPG, temper: 10, mw: MW_MAX, mwHit: MW_HIT };
  out.bossLoot = BOSS_ORDER.map(b => { const L = bossLoot(b, 'interceptor'), sec = Object.keys(SECTORS).find(id => SECTORS[id].boss === b);
    return { boss: BOSSES[b].name, color: BOSSES[b].color, sector: SECTORS[sec].name, legs: BOSS_LEGS[b].map(id => LEGEND_INDEX[id].name),
      sets: Object.keys(CLASSES).map(c => setName(bossLoot(b, c).set)) }; });

  /* ---------- world ---------- */
  out.tiers = TIERS.slice(1).map(T => ({ name: T.name, lvl: T.lvl, hp: T.hp, dmg: T.dmg, xp: T.xp, leg: T.leg, req: T.req, anc: T.anc, myth: T.myth, desc: T.desc,
    ga: [0, 0, 0.015, 0.04, 0.08][TIERS.indexOf(T)] }));
  out.tierUnlock = Object.entries(TIER_UNLOCK).map(([t, b]) => [TIERS[t].name, BOSSES[b].name]);
  out.sectors = Object.entries(SECTORS).map(([k, S]) => ({ k, name: S.name, kind: S.kind, min: S.min, max: S.max, desc: S.desc, range: levelRange(S),
    enemies: S.enemies ? Object.entries(S.enemies).map(([e, w]) => [ENEMY_TYPES[e].name, w]) : [],
    ast: S.ast ? Object.entries(S.ast).map(([a, w]) => [AST_KINDS[a].name, w]) : [],
    boss: S.boss ? BOSSES[S.boss].name : '', mat: SECTOR_MAT[k] ? MATS[SECTOR_MAT[k]].name : '',
    haz: (SECTOR_HAZ[k] || []).map(h => HAZ_NAMES[h]) }));
  out.depth = DEPTH_NAME;
  out.enemies = Object.entries(ENEMY_TYPES).filter(([k]) => k !== 'boss').map(([k, T]) => ({ k, name: T.name, color: T.color, hp: T.hp, speed: T.speed, dmg: T.dmg, xp: T.xp, gear: T.gear, tier: T.tier }));
  out.eliteMods = Object.values(ELITE_MODS).map(m => [m.name, m.color]);
  out.bosses = Object.entries(BOSSES).map(([k, B]) => ({ k, name: B.name, lair: B.lair, color: B.color, minion: ENEMY_TYPES[B.minion].name,
    sector: (Object.entries(SECTORS).find(([, S]) => S.boss === k) || [null, { name: '' }])[1].name, mythic: BOSS_MYTHIC[k] ? LEGEND_INDEX[BOSS_MYTHIC[k]].name : '' }));
  out.asteroids = Object.values(AST_KINDS).map(a => [a.name, a.ore, a.xp]);
  out.events = Object.values(EVENT_TYPES).map(e => ({ name: e.name, color: e.color, limit: e.limit, goal: e.goal }));
  out.contracts = Object.keys(CONTRACTS).length;

  /* ---------- endgame ---------- */
  out.nmMods = Object.values(NM_MODS).map(m => [m.name, m.desc]);
  out.nmBonus = Object.values(NM_BONUS).map(m => [m.name, m.desc]);
  out.nmScale = [1, 5, 10, 20, 30, 50].map(k => { const s = nmScale(k); return [k, s.lvl, r1(s.hp), r1(s.dmg), 1 + Math.floor(k / 8), k * 4]; });
  out.nmLimit = NM_LIMIT;
  out.para = Object.values(PARA).map(p => ({ name: p.name, color: p.color, n: p.n, m: p.m, s: p.s }));
  out.runes = Object.values(RUNES).map(r => ({ name: r.name, color: r.color, main: r.main(1), bonus: r.bonus }));
  out.runeMax = RUNE_MAX; out.runeOn = RUNE_ON;
  out.horde = { req: HORDE_REQ, waves: HORDE_WAVES, boons: HORDE_BOONS.map(b => b.txt), banes: HORDE_BANES.map(b => b.txt), chests: HORDE_CHESTS.map(c => [c.name, c.sub, c.cost]) };
  out.climb = { req: CLIMB_REQ, limit: CLIMB_LIMIT, need: CLIMB_NEED };
  out.storm = { req: STORM_REQ, every: STORM_EVERY, dur: STORM_DUR, chest: STORM_CHEST, gift: STORM_GIFT };
  out.vault = { time: VAULT_TIME, frags: VAULT_FRAGS };
  out.wb = { every: WB_EVERY, window: WB_WINDOW };
  out.levelCap = LEVEL_CAP;
  // the station's own mode cards (title + the "?" explanation), already translated
  G.stTab = 'chal'; G.panel = 'station'; syncPanels(); renderStation();
  out.modes = [...document.querySelectorAll('#station [data-st-card="chal"]')].map(c => {
    const eb = c.querySelector('.eyebrow'), inf = c.querySelector('.info');
    return eb && inf ? { title: strip(eb.childNodes[0].textContent), text: inf.title || inf.dataset.t || inf.dataset.tip } : null;
  }).filter(Boolean);
  G.panel = null; syncPanels();

  /* ---------- base, exploration, story ---------- */
  out.mats = Object.entries(MATS).map(([k, M]) => ({ name: M.name, color: M.color, icon: M.icon, from: Object.entries(SECTOR_MAT).filter(([, m]) => m === k).map(([s]) => SECTORS[s].name) }));
  out.modules = Object.values(MODULES).map(M => [M.name, M.desc, M.max]);
  out.dodges = Object.fromEntries(Object.keys(CLASSES).map(k => [k, DODGES[k].name]));
  out.research = Object.values(RESEARCH).map(R => [R.name, R.txt(1), R.txt(3)]);
  out.expeditions = Object.values(EXPEDITIONS).map(E => [E.name, E.min, E.desc]);
  out.stims = Object.values(STIMS).map(S => [S.name, S.txt, S.lv]);
  out.smelt = SMELT.map(S => [S.name, Object.entries(S.cost).map(([k, v]) => `${v} ${MATS[k].name}`).join(' · ')]);
  out.beacons = BEACON_BONUS.map(b => b.txt);
  out.beaconCount = 14;
  out.haz = Object.values(HAZ_NAMES);
  out.chapters = CHAPTERS.map(C => ({ lvl: C.lvl, title: C.title, npc: NPCS[C.npc].name }));
  out.ach = ACH.map(A => ({ desc: A.desc, title: A.title, sh: A.sh }));
  out.unlock = Object.entries(UNLOCK).map(([k, l]) => [k, l]);

  /* ---------- formulas ---------- */
  out.xp = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 49].map(l => [l, xpNeed(l)]);
  out.paraNeed = [0, 10, 50].map(l => [l, paraNeed(l)]);
  return out;
};
