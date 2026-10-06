'use strict';
/* =====================================================================
   1. GAME DATA — classes, rarity, slots, affixes, legendaries, talents,
                  sectors, bosses
   ===================================================================== */
const WORLD = { w: 4600, h: 4600 };   // resized per sector / dungeon room

const CLASSES = {
  interceptor: {
    name: 'Interceptor', role: 'Rýchla loď', color: '#5fd4ff',
    desc: 'Najrýchlejšia loď v hangári s vysokou šancou na kritický zásah. Tenké štíty, takže prežije hlavne pohybom.',
    hull: 70, shield: 40, speed: 340, accel: 1200, crit: 15, dodge: 10, magnet: 110, fireMult: 1.1,
    meters: { 'Rýchlosť': 5, 'Odolnosť': 2, 'Útok': 4, 'Ťažba': 2 },
    perks: ['+15 % Critical Chance', '+10 % úhyb a +10 % kadencia', 'Najnižšie štíty a trup'],
    start: { weapon: 'rapid', secondary: 'hornet', shield: 'deflector', engine: 'fusion', reactor: 'overload', drones: 'assault', armor: 'reactive' }
  },
  juggernaut: {
    name: 'Juggernaut', role: 'Tank', color: '#c29bff',
    desc: 'Ťažko pancierovaný krížnik s mohutnými štítmi. Ničivá aura spaľuje všetko, čo sa priblíži.',
    hull: 170, shield: 100, speed: 230, accel: 650, crit: 5, dodge: 0, magnet: 110, fireMult: 1,
    aura: { r: 125, dps: 12 },
    meters: { 'Rýchlosť': 2, 'Odolnosť': 5, 'Útok': 3, 'Ťažba': 2 },
    perks: ['Najvyšší trup a štíty', 'Pasívna aura (dosah 125, rastie s úrovňou)', 'Pomalší pohyb, žiadny úhyb'],
    start: { weapon: 'heavy', secondary: 'plasma', shield: 'barrier', engine: 'ion', reactor: 'fusionCore', drones: 'repair', armor: 'composite' }
  },
  scavenger: {
    name: 'Scavenger', role: 'Obchodník / Ťažiar', color: '#7ee0a8',
    desc: 'Priemyselná loď s traktorovým magnetom. Z každého asteroidu vytiahne viac a ťažba jej dobíja štíty.',
    hull: 100, shield: 60, speed: 290, accel: 850, crit: 5, dodge: 4, magnet: 270, fireMult: 1,
    yieldBonus: 40, xpBonus: 25, mineShield: true,
    meters: { 'Rýchlosť': 3, 'Odolnosť': 3, 'Útok': 2, 'Ťažba': 5 },
    perks: ['Magnet lootu s dosahom 270', '+40 % Mining Yield, +25 % XP', 'Zásahy asteroidov a zber rudy dobíjajú štít'],
    start: { weapon: 'pulse', secondary: 'swarm', shield: 'matrix', engine: 'phase', reactor: 'zeroPoint', drones: 'mining', armor: 'ablative' }
  },
  carrier: {
    name: 'Carrier', role: 'Veliteľ roja', color: '#ff9d6e',
    desc: 'Nosič s montážnou linkou. Z trosiek zostrelených nepriateľov skladá bojových miniónov, ktorí strieľajú za neho a berú na seba paľbu.',
    hull: 115, shield: 70, speed: 275, accel: 800, crit: 5, dodge: 3, magnet: 140, fireMult: 0.85, minions: true,
    meters: { 'Rýchlosť': 3, 'Odolnosť': 3, 'Útok': 3, 'Minióni': 5 },
    perks: ['Zostrelenie: 35 % šanca postaviť minióna (max 4)', 'Minióni rastú so zbraňou a odpútajú paľbu', 'Slabšia vlastná kadencia (−15 %)'],
    start: { weapon: 'pulse', secondary: 'hornet', shield: 'barrier', engine: 'ion', reactor: 'fusionCore', drones: 'assault', armor: 'composite' }
  }
};

const RARITY = {
  common:    { name: 'Common',    color: '#e6e9ef', affixes: [0, 0], baseMult: 1.00, rank: 0 },
  magic:     { name: 'Magic',     color: '#6f9bff', affixes: [1, 2], baseMult: 1.08, rank: 1 },
  rare:      { name: 'Rare',      color: '#ffe14d', affixes: [3, 4], baseMult: 1.18, rank: 2 },
  legendary: { name: 'Legendary', color: '#ff8a1f', affixes: [4, 4], baseMult: 1.30, rank: 3 },
  mythic:    { name: 'Mythic',    color: '#e14bff', affixes: [4, 4], baseMult: 1.45, rank: 4 },
  set:       { name: 'Set',       color: '#5be09a', affixes: [4, 4], baseMult: 1.40, rank: 3 }
};

const SLOTS = {
  weapon: { name: 'Primárna zbraň', types: {
    pulse: { name: 'Pulzný laser',      laserBase: 7,    fireRate: 0 },
    rapid: { name: 'Rýchlopalný laser', laserBase: 4.6,  fireRate: 2.2 },
    heavy: { name: 'Ťažký lúčomet',     laserBase: 11.5, fireRate: -1.5 }
  }},
  secondary: { name: 'Sekundárna zbraň', types: {
    hornet: { name: 'Rakety Hornet', missileBase: 34, missileCd: 2.4, missileCount: 1, homing: true,  missileRadius: 75 },
    swarm:  { name: 'Rojové rakety', missileBase: 15, missileCd: 3.0, missileCount: 4, homing: true,  missileRadius: 55 },
    plasma: { name: 'Plazmové delo', missileBase: 62, missileCd: 4.0, missileCount: 1, homing: false, missileRadius: 125 }
  }},
  shield: { name: 'Štítový generátor', types: {
    deflector: { name: 'Deflektor',           shieldCap: 55, shieldRegen: 9 },
    barrier:   { name: 'Bariérový generátor', shieldCap: 85, shieldRegen: 6 },
    matrix:    { name: 'Regeneračná matica',  shieldCap: 40, shieldRegen: 14 }
  }},
  engine: { name: 'Trysky / Motor', types: {
    ion:    { name: 'Iónový motor', speed: 40, dodge: 3 },
    fusion: { name: 'Fúzne trysky', speed: 75, dodge: 0 },
    phase:  { name: 'Fázový pohon', speed: 20, dodge: 8 }
  }}
};
SLOTS.reactor = { name: 'Reaktor', types: {
  fusionCore: { name: 'Fúzny reaktor',          cdr: 15, regenPct: 10 },
  overload:   { name: 'Preťažovací reaktor',    fireRatePct: 10, cdr: 5 },
  zeroPoint:  { name: 'Reaktor nulového bodu',  regenPct: 30 }
}};
SLOTS.drones = { name: 'Dronová zátoka', types: {
  assault: { name: 'Útočná zátoka',       droneKind: 'assault', droneCount: 2, droneDmg: 35 },
  mining:  { name: 'Ťažobná zátoka',      droneKind: 'mining',  droneCount: 2, droneDmg: 45 },
  repair:  { name: 'Opravárenská zátoka', droneKind: 'repair',  droneCount: 1, repairPct: 1.2 }
}};
SLOTS.armor = { name: 'Pancier trupu', types: {
  composite: { name: 'Kompozitný pancier', hullFlat: 40, dr: 4 },
  reactive:  { name: 'Reaktívny pancier',  hullFlat: 25, dr: 8 },
  ablative:  { name: 'Ablatívne platne',   hullFlat: 65, dr: 2 }
}};
const SLOT_ORDER = ['weapon', 'secondary', 'shield', 'engine', 'reactor', 'drones', 'armor'];
// percentage stats grow slowly with item level so they never run away
const SLOW_KEYS = new Set(['cdr', 'regenPct', 'fireRatePct', 'dr', 'droneDmg', 'repairPct']);
const SCALE_KEYS = new Set(['laserBase', 'missileBase', 'shieldCap', 'shieldRegen', 'speed', 'dodge', 'hullFlat']);
const BASE_LABEL = {
  laserBase:     ['Poškodenie lasera', v => fmtN(v)],
  fireRate:      ['Kadencia', v => (v >= 0 ? '+' : '') + v.toFixed(1) + ' výstr./s'],
  missileBase:   ['Poškodenie rakety', v => fmtN(v)],
  missileCd:     ['Nabíjanie', v => v.toFixed(1) + ' s'],
  missileCount:  ['Rakiet v salve', v => v],
  missileRadius: ['Polomer výbuchu', v => Math.round(v)],
  homing:        ['Navádzanie', v => v ? 'áno' : 'nie'],
  shieldCap:     ['Kapacita štítu', v => fmtN(v)],
  shieldRegen:   ['Obnova štítu', v => fmtN(v) + '/s'],
  speed:         ['Ťah motora', v => '+' + Math.round(v)],
  dodge:         ['Úhyb', v => '+' + (Math.round(v * 10) / 10) + ' %'],
  cdr:           ['Nabíjanie rakiet', v => '−' + fmtN(v) + ' %'],
  regenPct:      ['Obnova štítu', v => '+' + fmtN(v) + ' %'],
  fireRatePct:   ['Kadencia', v => '+' + fmtN(v) + ' %'],
  droneCount:    ['Počet dronov', v => v],
  droneDmg:      ['Sila dronov', v => fmtN(v) + ' % lasera'],
  repairPct:     ['Oprava trupu na dron', v => fmtN(v) + ' %/s'],
  hullFlat:      ['Pancier trupu', v => '+' + fmtN(v)],
  dr:            ['Redukcia poškodenia', v => fmtN(v) + ' %']
};

const ALL = ['weapon', 'secondary', 'shield', 'engine', 'reactor', 'drones', 'armor'];
const AFFIXES = {
  atkSpd:  { label: v => `+${v}% Attack Speed / Fire Rate`, range: [4, 10], slots: ['weapon', 'secondary', 'engine', 'reactor'], suffix: 'rýchlosti' },
  allDmg:  { label: v => `+${v}% All Damage`,              range: [4, 10], slots: ALL, suffix: 'skazy' },
  laser:   { label: v => `+${v}% Laser Damage`,            range: [6, 16], slots: ['weapon', 'shield', 'engine', 'drones'], suffix: 'žiary' },
  missile: { label: v => `+${v}% Missile Damage`,          range: [6, 16], slots: ['secondary', 'shield', 'engine', 'reactor'], suffix: 'ohňa' },
  yield:   { label: v => `+${v}% Mining Yield`,            range: [8, 20], slots: ALL, suffix: 'baníka', slow: true },
  crit:    { label: v => `+${v}% Critical Chance`,         range: [2, 5],  slots: ['weapon', 'secondary', 'engine', 'reactor', 'drones'], suffix: 'presnosti' },
  shield:  { label: v => `+${v}% Shield Capacity`,         range: [6, 16], slots: ['secondary', 'shield', 'engine', 'reactor', 'armor'], suffix: 'bašty' },
  hull:    { label: v => `+${v}% Hull Integrity`,          range: [6, 16], slots: ['shield', 'engine', 'armor'], suffix: 'pancierov' },
  speed:   { label: v => `+${v}% Movement Speed`,          range: [4, 10], slots: ['shield', 'engine', 'armor'], suffix: 'vetra' },
  area:    { label: v => `+${v}% Area Damage`,             range: [5, 12], slots: ALL, suffix: 'ozveny', slow: true }
};
const AFFIX_ORDER = Object.keys(AFFIXES);

const LEGEND_POOL = [
  { id: 'prism',     slot: 'weapon',    name: 'Hranol Polárky',         power: 'Každý výstrel sa rozloží na 3 lúče. Bočné lúče majú 60 % poškodenia.' },
  { id: 'chain',     slot: 'weapon',    name: 'Výbojka Volta',          power: 'Zásah lasera preskočí na 2 blízkych nepriateľov za 40 % poškodenia.' },
  { id: 'overheat',  slot: 'weapon',    name: 'Prehrievacia cievka',    power: 'Nepretržitá streľba zvyšuje kadenciu o 4 % za sekundu, najviac o 60 %. Po 1 s pauzy cievka vychladne.' },
  { id: 'ricochet',  slot: 'weapon',    cls: 'interceptor', name: 'Odrazové zrkadlá', power: 'Lasery prestrelia prvého nepriateľa a letia ďalej so 70 % poškodenia.' },
  { id: 'cluster',   slot: 'secondary', name: 'Kazetová hlavica Úroda', power: 'Výbuch rakety rozmetá 6 šrapnelov, každý s 35 % poškodenia rakety.' },
  { id: 'gravwell',  slot: 'secondary', name: 'Gravitačná hlavica',     power: 'Výbuch stiahne nepriateľov k stredu a na 1,6 s ich spomalí o 60 %.' },
  { id: 'barrage',   slot: 'secondary', name: 'Dvojitá salva',          power: 'Každú salvu o 0,4 s nasleduje druhá so 60 % poškodenia.' },
  { id: 'auraBurst', slot: 'secondary', cls: 'juggernaut', name: 'Jadro Titana', power: 'Výbuchy rakiet zväčšia tvoju auru o 50 % na 4 s.' },
  { id: 'nova',      slot: 'shield',    name: 'Reaktívne jadro Aegis',  power: 'Keď štít klesne na nulu, uvoľní novu za 150 % max. štítu a zmaže blízke strely (CD 8 s).' },
  { id: 'reflect',   slot: 'shield',    name: 'Zrkadlový štít',         power: 'Kým máš štít, 25 % nepriateľských striel sa odrazí späť ako laser za 200 % poškodenia.' },
  { id: 'vampiric',  slot: 'shield',    name: 'Sifón Prázdnoty',        power: '3 % spôsobeného poškodenia sa vracia do štítu.' },
  { id: 'oreArmor',  slot: 'shield',    cls: 'scavenger', name: 'Rudný pancier', power: 'Každý zber rudy pridá +2 % All Damage na 6 s (najviac 15 stackov).' },
  { id: 'wake',      slot: 'engine',    name: 'Iónová stopa Kométy',    power: 'Motor zanecháva iónovú stopu, ktorá spaľuje nepriateľov za 80 % poškodenia lasera za sekundu.' },
  { id: 'afterburner', slot: 'engine',  name: 'Prídavné spaľovanie',    power: 'Ak 3 s neutŕžiš zásah, máš +25 % rýchlosť a +15 % poškodenie.' },
  { id: 'magnetar',  slot: 'engine',    name: 'Magnetarové jadro',      power: '+60 % dosah magnetu a každý kúsok rudy má hodnotu o 1 vyššiu.' },
  { id: 'capacitor', slot: 'reactor',   name: 'Kondenzátor Tesla',      power: 'Každé zostrelenie skráti nabíjanie rakiet o 0,5 s.' },
  { id: 'stasis',    slot: 'reactor',   name: 'Stázové jadro',          power: 'Keď trup klesne pod 30 %, si 3 s nezraniteľný (CD 30 s).' },
  { id: 'swarmlord', slot: 'drones',    name: 'Pán roja',               power: 'Zátoka vypustí o 2 drony viac.' },
  { id: 'kamikaze',  slot: 'drones',    name: 'Samovražedná letka',     power: 'Každých 6 s sa dron vrhne na najbližšieho nepriateľa a vybuchne za 300 % poškodenia lasera.' },
  { id: 'thorns',    slot: 'armor',     name: 'Ostnatý pancier',        power: 'Pri zásahu loď vystrelí 6 šrapnelov za 100 % poškodenia lasera (najviac raz za sekundu).' },
  { id: 'bulwark',   slot: 'armor',     name: 'Bašta',                  power: 'Kým letíš pomaly alebo stojíš, máš +20 % redukciu poškodenia.' },
  { id: 'blinkcore', slot: 'engine',    cls: 'interceptor', name: 'Kvantový krok', power: 'Po úhybe sú tvoje ďalšie 3 výstrely garantovane kritické.' }
];
// mythic items: one fixed drop source each, tiny chance
const MYTHIC_LIST = [
  { id: 'singularity', slot: 'weapon',    name: 'Singularita Eventu', chance: 0.01,
    power: 'Každý 8. výstrel vypustí singularitu, ktorá 2,4 s sťahuje nepriateľov a drví ich v jadre za 150 % poškodenia lasera za sekundu.',
    source: 'Prázdnotný Leviatan · 1 % · svet III+' },
  { id: 'broodheart',  slot: 'secondary', name: 'Srdce Matky roja',   chance: 0.005,
    power: 'Každý výbuch rakety vyliahne 2 spojenecké drony (najviac 6), ktoré 9 s strieľajú na nepriateľov.',
    source: 'Matka roja · 0,5 % · svet III+' },
  { id: 'phaseCut',    slot: 'engine',    name: 'Fázový rez',         chance: 0.01,
    power: 'Shift: fázový skok. Počas skoku si nezraniteľný a každému nepriateľovi v ceste spôsobíš 300 % poškodenia lasera (CD 2,2 s).',
    source: 'Dreadnought Vex · 1 % · svet III+' },
  { id: 'tessarEye',   slot: 'shield',    name: 'Oko Tessaru',        chance: 0.03,
    power: 'Každý rozbitý asteroid vytvorí kryštálový pancier (najviac 3). Pancier úplne pohltí jeden zásah.',
    source: 'Žiarivý kryštál v lome Tessar · 3 % · svet III+' },
  { id: 'crown',       slot: 'reactor',   name: 'Koruna Architekta',  chance: 0.15,
    power: 'Každých 10 s zastaví čas na 2 s: nepriatelia, ich strely a útoky zamrznú.',
    source: 'Architekt Prázdnoty · 15 % · prvé víťazstvo garantované' },
  { id: 'voidecho',    slot: null,        name: 'Semeno Prázdnoty',   chance: 0.00001,
    power: 'Každý tvoj zásah má 20 % šancu zopakovať sa ako ozvena Prázdnoty s plným poškodením.',
    source: 'Akýkoľvek zásah asteroidu · 1 : 100 000 · každý svet' }
];
// nightmare gate modifiers: every key rolls 1-3 threats and one bonus
const NM_MODS = {
  volatile:  { name: 'Nestabilné trupy',   desc: 'Nepriatelia po smrti po chvíli vybuchnú.' },
  noRegen:   { name: 'Tlmiace pole',       desc: 'Obnova štítu −75 %.' },
  fortified: { name: 'Opevnení velitelia', desc: 'Elity a boss majú +60 % životov.' },
  swift:     { name: 'Hyperpohon',         desc: 'Nepriatelia aj ich strely sú o 30 % rýchlejší.' },
  burning:   { name: 'Plazmové výrony',    desc: 'Okolo lode vybuchujú plazmové zóny.' },
  horde:     { name: 'Roj',                desc: 'Vlny sú o 50 % početnejšie.' }
};
const NM_BONUS = {
  loot: { name: 'Hojnosť',        desc: '+50 % šanca na výbavu a boss pustí o 2 predmety viac.' },
  ore:  { name: 'Bohaté žily',    desc: 'Dvojnásobok rudy.' },
  xp:   { name: 'Skúsenosti',     desc: '+75 % XP.' },
  myth: { name: 'Mýtický šepot',  desc: 'Dvojnásobná šanca na mýtické predmety.' }
};
const NM_LIMIT = 240;   // seconds to beat a nightmare gate
const nmScale = k => ({ hp: 1 + 0.12 * k, dmg: 1 + 0.06 * k, lvl: Math.floor(k / 3) });
const GEMS = {
  ruby:     { name: 'rubín',   color: '#ff4d6d', stat: 'allDmg', label: 'All Damage',      vals: [3, 5, 8] },
  sapphire: { name: 'zafír',   color: '#5f8bff', stat: 'shield', label: 'Shield Capacity', vals: [5, 9, 15] },
  emerald:  { name: 'smaragd', color: '#4fe08a', stat: 'yield',  label: 'Mining Yield',    vals: [6, 11, 18] },
  topaz:    { name: 'topás',   color: '#ffc94d', stat: 'crit',   label: 'Critical Chance', vals: [1, 2, 3.5] },
  amethyst: { name: 'ametyst', color: '#b46bff', stat: 'atkSpd', label: 'Attack Speed',    vals: [3, 5, 9] }
};
const GEM_Q = ['Úlomkový', 'Brúsený', 'Dokonalý'];
const gemName = (t, q) => `${GEM_Q[q]} ${GEMS[t].name}`;
const MAX_SOCKETS = [0, 0, 1, 2, 3];
const SHARDS_FOR = [0, 0, 1, 4, 15];
const FRAG_BOSSES = ['brood', 'warden', 'dread', 'leviathan'];
const ARCH_PATTERNS = { 1: ['ring', 'spiral', 'fan', 'beam'], 2: ['ring', 'fan', 'spiral'], 3: ['spiral', 'ring', 'fan', 'beam', 'beam'] };
const LEVEL_CAP = 50;
const paraNeed = l => Math.round(16000 * (1 + 0.04 * l));
const PARA = {
  forge:    { name: 'Kováč',   color: '#ff7a5c', ang: -135, n: '+3 % All Damage', m: '+8 % Laser Damage a +8 % Missile Damage', s: { name: 'Kovadlina hviezd', text: '+10 % All Damage a +25 % kritické poškodenie' } },
  warden:   { name: 'Strážca', color: '#5fd4ff', ang: -45,  n: '+4 % trup a +3 % štít', m: '+3 % redukcia poškodenia', s: { name: 'Neprelomný', text: '+8 % redukcia poškodenia a +30 % obnova štítu' } },
  hunter:   { name: 'Lovec',   color: '#ffc94d', ang: 45,   n: '+1 % Critical Chance', m: '+10 % poškodenie elitám a bossom', s: { name: 'Oko lovca', text: '+5 % Critical Chance, +20 % poškodenie elitám a bossom, +10 % kritické poškodenie' } },
  wayfarer: { name: 'Pútnik',  color: '#7ee0a8', ang: 135,  n: '+2 % rýchlosť a +5 % Mining Yield', m: '+25 dosah magnetu a +5 % XP', s: { name: 'Kométa', text: '+10 % rýchlosť, +5 % úhyb a +20 % XP' } }
};
const RUNES = {
  ignis:   { name: 'Runa Žiaru',  color: '#ff7a5c', main: L => `+${L} % All Damage`, bonus: '+20 % kritické poškodenie', fx: (L, on, p, s) => { p.allDmg += L; if (on) s.critMult += 0.2; } },
  aegis:   { name: 'Runa Egidy',  color: '#5fd4ff', main: L => `+${fmtN(L * 1.2)} % trup a štít`, bonus: '+5 % redukcia poškodenia', fx: (L, on, p, s, a) => { p.hull += L * 1.2; p.shield += L * 1.2; if (on) a.dr += 5; } },
  venator: { name: 'Runa Lovca',  color: '#ffc94d', main: L => `+${fmtN(L * 1.5)} % poškodenie elitám a bossom`, bonus: '+3 % Critical Chance', fx: (L, on, p, s) => { s.eliteDmg += L * 1.5; if (on) p.crit += 3; } },
  celer:   { name: 'Runa Vetra',  color: '#7ee0a8', main: L => `+${fmtN(L * 0.5)} % kadencia a rýchlosť`, bonus: '+5 % úhyb', fx: (L, on, p, s) => { p.atkSpd += L * 0.5; p.speed += L * 0.5; if (on) s.dodge += 5; } },
  turbo:   { name: 'Runa Víru',   color: '#c77dff', main: L => `+${L} % Area Damage`, bonus: '+10 % All Damage', fx: (L, on, p) => { p.area += L; if (on) p.allDmg += 10; } },
  aurum:   { name: 'Runa Zlata',  color: '#ffd36b', main: L => `+${L * 2} % Mining Yield a +${L} % XP`, bonus: '+25 % rudy', fx: (L, on, p, s) => { p.yield += L * 2; s.xpMult += L / 100; if (on) s.oreMult += 0.25; } },
  legio:   { name: 'Runa Légie',  color: '#ff9d6e', main: L => `+${fmtN(L * 1.5)} % poškodenie dronov a miniónov`, bonus: '+1 dron a +1 max. minión', fx: (L, on, p, s) => { if (s.drones) { s.drones.dmg *= 1 + L * 0.015; if (on) s.drones.count += 1; } if (s.minion) { s.minion.dmg *= 1 + L * 0.015; if (on && !s.minion.titan) s.minion.max += 1; } } },
  nova:    { name: 'Runa Novy',   color: '#9fd0ff', main: L => `+${L} % Laser a Missile Damage`, bonus: '−10 % nabíjanie rakiet', fx: (L, on, p, s, a) => { p.laser += L; p.missile += L; if (on) a.cdr += 10; } }
};
const RUNE_MAX = 30, RUNE_ON = 10;   // the bonus needs 10 allocated nodes in that constellation
function grantRune(x, y) {
  const PA = P.para; PA.rl = PA.rl || {};
  const missing = Object.keys(RUNES).filter(r => !PA.rl[r]);
  if (missing.length) {
    const r = pick(missing); PA.rl[r] = 1;
    banner(`<span style="color:${RUNES[r].color}">${RUNES[r].name}</span><small>Nová hviezdna runa · vlož ju do konštelácie (P)</small>`);
    log(`Hviezdna runa: <span style="color:${RUNES[r].color}">${RUNES[r].name}</span>.`);
  } else addShards(10);
}
function levelRunes(k) {
  const PA = P.para, up = [];
  for (const b in PA.runes || {}) {
    const r = PA.runes[b]; if (!r || !PA.rl[r]) continue;
    if (PA.rl[r] < RUNE_MAX && k >= PA.rl[r]) { PA.rl[r]++; up.push(`${RUNES[r].name} ${PA.rl[r]}`); }
  }
  if (up.length) log(`<span style="color:#e8e2ff">Runy vylepšené:</span> ${up.join(', ')}.`);
  else if (Object.values(PA.runes || {}).some(Boolean)) log('Runy sa nevylepšili: úroveň nočnej brány musí byť aspoň taká ako úroveň runy.');
}
const PARA_PATTERN = ['n', 'n', 'n', 'n', 'm', 'n', 'n', 'n', 'n', 'm', 'n', 'n', 'n', 's'];
function paraCounts(n) { let N = 0, M = 0, S = 0; for (let i = 0; i < n; i++) { const t = PARA_PATTERN[i]; if (t === 'n') N++; else if (t === 'm') M++; else S++; } return { N, M, S }; }
const BOSS_MYTHIC = { brood: 'broodheart', dread: 'phaseCut', leviathan: 'singularity' };
const LEGEND_INDEX = {};
for (const l of LEGEND_POOL) LEGEND_INDEX[l.id] = l;
for (const m of MYTHIC_LIST) LEGEND_INDEX[m.id] = m;

const TIER_UNLOCK = { 2: 'dread', 3: 'gravit' };   // world tier IV comes from the Architect
const TIERS = [null,
  { roman: 'I',   name: 'I · Prieskum',         lvl: 0,  hp: 1.0, dmg: 1.0,  xp: 1.0, leg: 1.0, req: 0,  anc: 0,    myth: 0, trash: 1, elite: 1, desc: 'Základná obťažnosť. Bez pradávnych a mýtických predmetov.' },
  { roman: 'II',  name: 'II · Veterán',         lvl: 4,  hp: 1.3, dmg: 1.15, xp: 1.5, leg: 2.2, req: 15, anc: 0,    myth: 0, trash: 1, elite: 1, desc: 'Nepriatelia +4 úr. · XP ×1,5 · legendárky ×2,2' },
  { roman: 'III', name: 'III · Nočná mora',     lvl: 9,  hp: 1.8, dmg: 1.3,  xp: 2.2, leg: 3.5, req: 35, anc: 0.10, myth: 1, trash: 0.85, elite: 1.15, desc: 'Nepriatelia +9 úr. · bežní −15 % HP, elity +15 % · XP ×2,2 · pradávne 10 % · mýtické predmety' },
  { roman: 'IV',  name: 'IV · Peklo Prázdnoty', lvl: 15, hp: 2.6, dmg: 1.5,  xp: 3.0, leg: 5.0, req: 50, anc: 0.25, myth: 2, trash: 0.7, elite: 1.3, desc: 'Nepriatelia +15 úr. · bežní −30 % HP, elity a bossovia +30 % · XP ×3 · pradávne 25 % · mýtické ×2' }
];
const RARE_PREFIX = ['Hviezdny', 'Temný', 'Prázdnotný', 'Kométin', 'Pulzarový', 'Krvavý', 'Mrazivý', 'Zlatý', 'Tichý', 'Žeravý', 'Nebulárny'];
const RARE_NOUN = {
  weapon: ['Žiarič', 'Tŕň', 'Kosák', 'Šíp', 'Hrot'],
  secondary: ['Roj', 'Hrom', 'Úder', 'Pád', 'Súd'],
  shield: ['Štít', 'Val', 'Závoj', 'Krunier', 'Múr'],
  engine: ['Prúd', 'Sokol', 'Vietor', 'Let', 'Beh'],
  reactor: ['Puls', 'Plameň', 'Dych', 'Žiar', 'Tep'],
  drones: ['Roj', 'Kŕdeľ', 'Úľ', 'Zbor', 'Šik'],
  armor: ['Pancier', 'Plášť', 'Krunier', 'Val', 'Obal']
};
