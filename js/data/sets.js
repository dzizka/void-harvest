'use strict';
/* ---------- build sets: 4 pieces per talent branch (weapon, shield, engine, reactor) ---------- */
const SET_SLOTS = ['weapon', 'shield', 'engine', 'reactor'];
const SET_NOUN = { weapon: 'Zbraň', shield: 'Štít', engine: 'Motor', reactor: 'Jadro' };
const SET4 = {
  sharp:      { t: 'Laser Damage ×1,4 a +50 % kritické poškodenie', fx: (s, x) => { x.laser *= 1.4; s.critMult += 0.5; } },
  salvo:      { t: 'Missile Damage ×1,5 a nabíjanie rakiet −20 %', fx: (s, x) => { x.missile *= 1.5; x.cd *= 0.8; } },
  phantom:    { t: '+10 % úhyb a všetko poškodenie ×1,3', fx: (s, x) => { s.dodge += 10; x.all *= 1.3; } },
  fortress:   { t: '+10 % redukcia poškodenia a všetko poškodenie ×1,35', fx: (s, x, a) => { a.dr += 10; x.all *= 1.35; } },
  inferno:    { t: 'Poškodenie aury ×1,7', fx: (s, x) => { x.aura *= 1.7; } },
  artillery:  { t: 'Missile Damage ×1,4 a polomer výbuchu +30 %', fx: (s, x) => { x.missile *= 1.4; s.missileRadius *= 1.3; } },
  prospector: { t: 'Ťažobná sila ×1,5 a všetko poškodenie ×1,25', fx: (s, x) => { x.mp *= 1.5; x.all *= 1.25; } },
  hive:       { t: 'Poškodenie dronov ×1,7 a +1 dron', fx: s => { if (s.drones) { s.drones.dmg *= 1.7; s.drones.count += 1; } } },
  magnate:    { t: 'Všetko poškodenie ×1,4 a +20 % štít', fx: (s, x, a, p) => { x.all *= 1.4; p.shield += 20; } },
  legion:     { t: 'Poškodenie miniónov ×1,5 a +2 max. miniónov', fx: s => { if (s.minion && !s.minion.titan) { s.minion.dmg *= 1.5; s.minion.max += 2; } else if (s.minion) s.minion.dmg *= 1.5; } },
  colossus:   { t: 'Životy miniónov ×2 a poškodenie miniónov ×1,3', fx: s => { if (s.minion) { s.minion.hp *= 2; s.minion.dmg *= 1.3; } } },
  sacrifice:  { t: 'Výbuchy a poškodenie miniónov ×1,6', fx: s => { if (s.minion) { s.minion.dmg *= 1.6; s.minion.dmgMul *= 1.6; } } }
};
const setName = bid => `Odkaz: ${TBRANCH[Object.keys(TREES).find(c => TBRANCH[c + ':' + bid]) + ':' + bid].name}`;
const costDisc = () => 1 - ((P && P.stats && P.stats.tx && P.stats.tx.sHaggle) || 0) / 100;

const AST_KINDS = {
  rock:    { name: 'Kameň',   hp: 1.0, ore: 1, xp: 1.0, fill: '#1d222d', stroke: '#6b7487' },
  iron:    { name: 'Železo',  hp: 1.5, ore: 2, xp: 1.3, fill: '#2b1f1c', stroke: '#b0705a', vein: '#e0905e' },
  crystal: { name: 'Kryštál', hp: 2.2, ore: 3, xp: 2.5, fill: '#122236', stroke: '#7fe3ff', vein: '#bff6ff' },
  radiant: { name: 'Žiarivý kryštál', hp: 4, ore: 8, xp: 6, fill: '#22102e', stroke: '#e14bff', vein: '#ffc4ff' }
};
const AST_SIZE = { 3: { r: [56, 72], hp: 160, ore: 6, xp: 7 }, 2: { r: [30, 40], hp: 70, ore: 4, xp: 4 }, 1: { r: [14, 20], hp: 26, ore: 2, xp: 2 } };

const ENEMY_TYPES = {
  drone:   { name: 'Dron',       hp: 22,   speed: 175, r: 11, xp: 6,   gear: 0.10, dmg: 6,  color: '#ff4d6d', tier: 0 },
  fighter: { name: 'Stíhač',     hp: 46,   speed: 215, r: 14, xp: 11,  gear: 0.18, dmg: 5,  color: '#ff6fb5', tier: 0 },
  charger: { name: 'Taranovač',  hp: 34,   speed: 150, r: 13, xp: 9,   gear: 0.12, dmg: 24, color: '#ff5a36', tier: 0 },
  gunship: { name: 'Delová loď', hp: 135,  speed: 85,  r: 23, xp: 26,  gear: 0.38, dmg: 7,  color: '#ff9470', tier: 1 },
  splitter:     { name: 'Deliaci roj',  hp: 95,  speed: 150, r: 18, xp: 18, gear: 0.18, dmg: 8,  color: '#c77dff', tier: 0 },
  sniper:       { name: 'Ostreľovač',   hp: 42,  speed: 140, r: 14, xp: 16, gear: 0.22, dmg: 6,  color: '#ffe14d', tier: 0 },
  minelayer:    { name: 'Kladač mín',   hp: 90,  speed: 120, r: 18, xp: 20, gear: 0.28, dmg: 8,  color: '#ff9a3c', tier: 1 },
  healer:       { name: 'Opravár',      hp: 70,  speed: 165, r: 15, xp: 20, gear: 0.25, dmg: 4,  color: '#5be09a', tier: 1 },
  shieldbearer: { name: 'Štítonosič',   hp: 170, speed: 100, r: 21, xp: 30, gear: 0.40, dmg: 8,  color: '#6fb8ff', tier: 1 },
  chest:        { name: 'Truhlica',     hp: 120, speed: 0,   r: 18, xp: 4,  gear: 0,    dmg: 0,  color: '#ffd36b', tier: 0 },
  goblin:       { name: 'Pašerák',      hp: 380, speed: 250, r: 15, xp: 30, gear: 0,    dmg: 0,  color: '#ffb000', tier: 2 },
  stalker:      { name: 'Prepadávač',   hp: 60,  speed: 250, r: 13, xp: 18, gear: 0.22, dmg: 20, color: '#aeb8d0', tier: 0 },
  boss:    { name: 'Boss',       hp: 1300, speed: 85,  r: 46, xp: 140, gear: 0,    dmg: 20, color: '#ffffff', tier: 2 }
};

const BOSSES = {
  brood:     { name: 'Matka roja',          lair: 'Hniezdo roja',     color: '#ff4d6d', sides: 6,  patterns: ['ring', 'fan', 'summon'], minion: 'drone' },
  warden:    { name: 'Žeravý strážca',      lair: 'Výheň strážcu',    color: '#ff7a45', sides: 8,  patterns: ['spiral', 'fan', 'charge', 'ring'], minion: 'charger' },
  dread:     { name: 'Dreadnought Vex',     lair: 'Suché doky Vexu',  color: '#ffb547', sides: 5,  patterns: ['ring', 'spiral', 'summon', 'fan'], minion: 'fighter' },
  architect: { name: 'Architekt Prázdnoty', lair: 'Trhlina Architekta', color: '#e8e2ff', sides: 12, patterns: ['ring', 'spiral', 'fan', 'beam'], minion: 'fighter' },
  queen:     { name: 'Úľová kráľovná',      lair: 'Úľ Bária',         color: '#5ff0b0', sides: 7,  patterns: ['summon', 'ring', 'fan', 'spiral'], minion: 'splitter' },
  gravit:    { name: 'Gravitačný kolos',    lair: 'Jadro Herkula',    color: '#6fa8ff', sides: 9,  patterns: ['beam', 'ring', 'charge', 'spiral', 'summon'], minion: 'shieldbearer' },
  void:      { name: 'Strážca hlbiny',      lair: 'Výstup do Prázdnoty', color: '#9a8cff', sides: 11, patterns: ['ring', 'spiral', 'fan', 'summon', 'charge'], minion: 'stalker' },
  devourer:  { name: 'Hviezdožrút',         lair: 'Svetový boss',     color: '#ffb000', sides: 14, patterns: ['ring', 'spiral', 'fan', 'summon', 'charge', 'beam'], minion: 'gunship' },
  leviathan: { name: 'Prázdnotný Leviatan', lair: 'Hlbina Leviatana', color: '#c77dff', sides: 10, patterns: ['ring', 'spiral', 'summon', 'fan', 'charge'], minion: 'charger' }
};

const SECTORS = {
  haven: { name: 'Stanica Haven', kind: 'safe', min: 1, max: 1, size: 3600, pos: [8, 62], astCount: 70,
    desc: 'Domovský prístav pod ochranou flotily. Nikto tu neútočí: pokojná ťažba, servis a obchod so záhadnými kontajnermi.',
    ast: { rock: 55, iron: 38, crystal: 7 }, pal: ['rgba(30,60,130,', 'rgba(20,90,110,', 'rgba(40,50,110,'] },
  kepler: { name: 'Kepler-7 Pás', kind: 'hostile', min: 1, max: 8, size: 4600, pos: [21, 30], astCount: 75,
    desc: 'Asteroidový pás obsadený dronovými rojmi. V strede stojí strážny maják s bezpečnou zónou.',
    ast: { rock: 60, iron: 30, crystal: 10 }, enemies: { drone: 58, fighter: 26, charger: 12 }, boss: 'brood',
    pal: ['rgba(40,50,130,', 'rgba(20,90,110,', 'rgba(90,30,95,'] },
  ruby: { name: 'Rubínová hmlovina', kind: 'hostile', min: 8, max: 16, size: 4800, pos: [34, 66], astCount: 70,
    desc: 'Žeravá hmlovina plná taranovačov a stíhacích letiek.',
    ast: { rock: 50, iron: 38, crystal: 12 }, enemies: { drone: 26, fighter: 28, charger: 20, gunship: 12, splitter: 10 }, boss: 'warden',
    pal: ['rgba(130,30,50,', 'rgba(90,25,70,', 'rgba(140,60,40,'] },
  tessar: { name: 'Ľadový lom Tessar', kind: 'safe', min: 12, max: 12, size: 3800, pos: [46, 18], astCount: 85,
    desc: 'Neutrálny ťažobný lom chránený strážnymi majákmi. Bohaté kryštálové žily, žiadne útoky.',
    ast: { rock: 22, iron: 40, crystal: 38 }, pal: ['rgba(20,90,120,', 'rgba(30,120,130,', 'rgba(40,60,120,'] },
  vex: { name: 'Mŕtve pole Vex', kind: 'hostile', min: 16, max: 26, size: 5000, pos: [57, 50], astCount: 70,
    desc: 'Cintorín vrakov a delových lodí. Tvrdé boje, bohatý loot.',
    ast: { rock: 45, iron: 40, crystal: 15 }, enemies: { drone: 16, fighter: 26, charger: 20, gunship: 20, sniper: 10, minelayer: 8 }, boss: 'dread',
    pal: ['rgba(110,80,30,', 'rgba(70,50,30,', 'rgba(60,40,80,'] },
  baria: { name: 'Bárijský roj', kind: 'hostile', min: 26, max: 36, size: 5000, pos: [70, 22], astCount: 70,
    desc: 'Bioluminiscenčná hmlovina, kde sa roje delia a opravári ich lepia dokopy. Hlboko v nej pulzuje úľ.',
    ast: { rock: 40, iron: 30, crystal: 30 }, enemies: { drone: 18, splitter: 24, healer: 14, fighter: 20, charger: 12, stalker: 12 }, boss: 'queen',
    pal: ['rgba(30,110,80,', 'rgba(20,70,90,', 'rgba(60,120,60,'] },
  hercules: { name: 'Kolaps Herkules', kind: 'hostile', min: 36, max: 46, size: 5200, pos: [76, 74], astCount: 60,
    desc: 'Zrútená hviezda so silnou gravitáciou. Štítonosiči kryjú delové lode, ostreľovači mieria z diaľky.',
    ast: { rock: 45, iron: 40, crystal: 15 }, enemies: { gunship: 20, shieldbearer: 16, sniper: 16, minelayer: 12, charger: 14, fighter: 16, healer: 6 }, boss: 'gravit',
    pal: ['rgba(30,60,140,', 'rgba(20,30,90,', 'rgba(80,90,160,'] },
  rim: { name: 'Okraj Prázdnoty', kind: 'hostile', min: 46, max: 99, size: 5200, pos: [91, 46], astCount: 65,
    desc: 'Hranica známeho vesmíru. Elitné letky a Leviatan v hlbine.',
    ast: { rock: 40, iron: 35, crystal: 25 }, enemies: { drone: 10, fighter: 18, charger: 16, gunship: 16, splitter: 8, sniper: 8, minelayer: 6, healer: 6, shieldbearer: 6, stalker: 8 }, boss: 'leviathan',
    pal: ['rgba(80,30,130,', 'rgba(40,20,90,', 'rgba(110,40,120,'] }
};
const SECTOR_LINKS = [['haven', 'kepler'], ['kepler', 'ruby'], ['ruby', 'tessar'], ['ruby', 'vex'], ['tessar', 'vex'], ['vex', 'baria'], ['tessar', 'baria'], ['baria', 'hercules'], ['vex', 'hercules'], ['hercules', 'rim'], ['baria', 'rim']];
const DUNGEON = { R: 820, rooms: [{ waves: 2 }, { waves: 2, elite: true }, { boss: true }],
  pal: ['rgba(100,20,60,', 'rgba(50,20,100,', 'rgba(120,30,40,'] };
const levelRange = S => S.kind === 'safe' ? 'Bezpečná' : S.max >= 99 ? `Úr. ${S.min}+` : `Úr. ${S.min}–${S.max}`;
