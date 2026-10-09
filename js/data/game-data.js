'use strict';
/* =====================================================================
   1. GAME DATA — classes, rarity, slots, affixes, legendaries, talents,
                  sectors, bosses
   ===================================================================== */
const WORLD = { w: 4600, h: 4600 };   // resized per sector / dungeon room

const CLASSES = {
  interceptor: {
    name: _L('Interceptor'), role: _L('Rýchla loď'), color: '#5fd4ff',
    desc: _L('Najrýchlejšia loď v hangári s vysokou šancou na kritický zásah. Tenké štíty, takže prežije hlavne pohybom.'),
    hull: 70, shield: 40, speed: 340, accel: 1200, crit: 15, dodge: 10, magnet: 110, fireMult: 1.1,
    meters: { 'Rýchlosť': 5, 'Odolnosť': 2, 'Útok': 4, 'Ťažba': 2 },
    perks: [_L('+15 % Kritická šanca'), _L('+10 % úhyb a +10 % kadencia'), _L('Najnižšie štíty a trup')],
    start: { weapon: 'rapid', secondary: 'hornet', shield: 'deflector', engine: 'fusion', reactor: 'overload', drones: 'assault', armor: 'reactive' }
  },
  juggernaut: {
    name: _L('Juggernaut'), role: _L('Tank'), color: '#c29bff',
    desc: _L('Ťažko pancierovaný krížnik s mohutnými štítmi. Ničivá aura spaľuje všetko, čo sa priblíži.'),
    hull: 170, shield: 100, speed: 230, accel: 650, crit: 5, dodge: 0, magnet: 110, fireMult: 1,
    aura: { r: 125, dps: 12 },
    meters: { 'Rýchlosť': 2, 'Odolnosť': 5, 'Útok': 3, 'Ťažba': 2 },
    perks: [_L('Najvyšší trup a štíty'), _L('Pasívna aura (dosah 125, rastie s úrovňou)'), _L('Pomalší pohyb, žiadny úhyb')],
    start: { weapon: 'heavy', secondary: 'plasma', shield: 'barrier', engine: 'ion', reactor: 'fusionCore', drones: 'repair', armor: 'composite' }
  },
  scavenger: {
    name: _L('Scavenger'), role: _L('Obchodník / Ťažiar'), color: '#7ee0a8',
    desc: _L('Priemyselná loď s traktorovým magnetom. Z každého asteroidu vytiahne viac a ťažba jej dobíja štíty.'),
    hull: 100, shield: 60, speed: 290, accel: 850, crit: 5, dodge: 4, magnet: 270, fireMult: 1,
    yieldBonus: 40, xpBonus: 25, mineShield: true,
    meters: { 'Rýchlosť': 3, 'Odolnosť': 3, 'Útok': 2, 'Ťažba': 5 },
    perks: [_L('Magnet lootu s dosahom 270'), _L('+40 % Výnos ťažby, +25 % XP'), _L('Zásahy asteroidov a zber rudy dobíjajú štít')],
    start: { weapon: 'pulse', secondary: 'swarm', shield: 'matrix', engine: 'phase', reactor: 'zeroPoint', drones: 'mining', armor: 'ablative' }
  },
  carrier: {
    name: _L('Carrier'), role: _L('Veliteľ roja'), color: '#ff9d6e',
    desc: _L('Nosič s montážnou linkou. Z trosiek zostrelených nepriateľov skladá bojových miniónov, ktorí strieľajú za neho a berú na seba paľbu.'),
    hull: 125, shield: 70, speed: 275, accel: 800, crit: 5, dodge: 3, magnet: 140, fireMult: 0.95, minions: true,
    meters: { 'Rýchlosť': 3, 'Odolnosť': 3, 'Útok': 3, 'Minióni': 5 },
    perks: [_L('Zostrelenie: 50 % šanca postaviť minióna (max 4)'), _L('Minióni rastú so zbraňou a odpútajú paľbu'), _L('Slabšia vlastná kadencia (−5 %)')],
    start: { weapon: 'pulse', secondary: 'hornet', shield: 'barrier', engine: 'ion', reactor: 'fusionCore', drones: 'assault', armor: 'composite' }
  }
};

const RARITY = {
  common:    { name: _L('Bežný'),    color: '#e6e9ef', affixes: [0, 0], baseMult: 1.00, rank: 0 },
  magic:     { name: _L('Magický'),     color: '#6f9bff', affixes: [1, 2], baseMult: 1.08, rank: 1 },
  rare:      { name: _L('Vzácny'),      color: '#ffe14d', affixes: [3, 4], baseMult: 1.18, rank: 2 },
  legendary: { name: _L('Legendárny'), color: '#ff8a1f', affixes: [4, 4], baseMult: 1.30, rank: 3 },
  mythic:    { name: _L('Mýtický'),    color: '#e14bff', affixes: [4, 4], baseMult: 1.45, rank: 4 },
  set:       { name: _L('Setový'),       color: '#5be09a', affixes: [4, 4], baseMult: 1.40, rank: 3 }
};

const SLOTS = {
  weapon: { name: _L('Primárna zbraň'), types: {
    pulse: { name: _L('Pulzný laser'),      laserBase: 7,    fireRate: 0 },
    rapid: { name: _L('Rýchlopalný laser'), laserBase: 4.6,  fireRate: 2.2 },
    heavy: { name: _L('Ťažký lúčomet'),     laserBase: 11.5, fireRate: -1.5 }
  }},
  secondary: { name: _L('Sekundárna zbraň'), types: {
    hornet: { name: _L('Rakety Hornet'), missileBase: 34, missileCd: 2.4, missileCount: 1, homing: true,  missileRadius: 75 },
    swarm:  { name: _L('Rojové rakety'), missileBase: 15, missileCd: 3.0, missileCount: 4, homing: true,  missileRadius: 55 },
    plasma: { name: _L('Plazmové delo'), missileBase: 62, missileCd: 4.0, missileCount: 1, homing: false, missileRadius: 125 }
  }},
  shield: { name: _L('Štítový generátor'), types: {
    deflector: { name: _L('Deflektor'),           shieldCap: 55, shieldRegen: 9 },
    barrier:   { name: _L('Bariérový generátor'), shieldCap: 85, shieldRegen: 6 },
    matrix:    { name: _L('Regeneračná matica'),  shieldCap: 40, shieldRegen: 14 }
  }},
  engine: { name: _L('Trysky / Motor'), types: {
    ion:    { name: _L('Iónový motor'), speed: 40, dodge: 3 },
    fusion: { name: _L('Fúzne trysky'), speed: 75, dodge: 0 },
    phase:  { name: _L('Fázový pohon'), speed: 20, dodge: 8 }
  }}
};
SLOTS.reactor = { name: _L('Reaktor'), types: {
  fusionCore: { name: _L('Fúzny reaktor'),          cdr: 15, regenPct: 10 },
  overload:   { name: _L('Preťažovací reaktor'),    fireRatePct: 10, cdr: 5 },
  zeroPoint:  { name: _L('Reaktor nulového bodu'),  regenPct: 30 }
}};
SLOTS.drones = { name: _L('Dronová zátoka'), types: {
  assault: { name: _L('Útočná zátoka'),       droneKind: 'assault', droneCount: 2, droneDmg: 35 },
  mining:  { name: _L('Ťažobná zátoka'),      droneKind: 'mining',  droneCount: 2, droneDmg: 45 },
  repair:  { name: _L('Opravárenská zátoka'), droneKind: 'repair',  droneCount: 1, repairPct: 1.2 }
}};
SLOTS.armor = { name: _L('Pancier trupu'), types: {
  composite: { name: _L('Kompozitný pancier'), hullFlat: 40, dr: 4 },
  reactive:  { name: _L('Reaktívny pancier'),  hullFlat: 25, dr: 8 },
  ablative:  { name: _L('Ablatívne platne'),   hullFlat: 65, dr: 2 }
}};
const SLOT_ORDER = ['weapon', 'secondary', 'shield', 'engine', 'reactor', 'drones', 'armor'];
// percentage stats grow slowly with item level so they never run away
const SLOW_KEYS = new Set(['cdr', 'regenPct', 'fireRatePct', 'dr', 'droneDmg', 'repairPct']);
const SCALE_KEYS = new Set(['laserBase', 'missileBase', 'shieldCap', 'shieldRegen', 'speed', 'dodge', 'hullFlat']);
const BASE_LABEL = {
  laserBase:     [_L('Poškodenie lasera'), v => fmtN(v)],
  fireRate:      [_L('Kadencia'), v => (v >= 0 ? '+' : '') + v.toFixed(1) + _L(' výstr./s')],
  missileBase:   [_L('Poškodenie rakety'), v => fmtN(v)],
  missileCd:     [_L('Nabíjanie'), v => v.toFixed(1) + ' s'],
  missileCount:  [_L('Rakiet v salve'), v => v],
  missileRadius: [_L('Polomer výbuchu'), v => Math.round(v)],
  homing:        [_L('Navádzanie'), v => v ? _L('áno') : 'nie'],
  shieldCap:     [_L('Kapacita štítu'), v => fmtN(v)],
  shieldRegen:   [_L('Obnova štítu'), v => fmtN(v) + '/s'],
  speed:         [_L('Ťah motora'), v => '+' + Math.round(v)],
  dodge:         [_L('Úhyb'), v => '+' + (Math.round(v * 10) / 10) + ' %'],
  cdr:           [_L('Nabíjanie rakiet'), v => '−' + fmtN(v) + ' %'],
  regenPct:      [_L('Obnova štítu'), v => '+' + fmtN(v) + ' %'],
  fireRatePct:   [_L('Kadencia'), v => '+' + fmtN(v) + ' %'],
  droneCount:    [_L('Počet dronov'), v => v],
  droneDmg:      [_L('Sila dronov'), v => fmtN(v) + _L(' % lasera')],
  repairPct:     [_L('Oprava trupu na dron'), v => fmtN(v) + ' %/s'],
  hullFlat:      [_L('Pancier trupu'), v => '+' + fmtN(v)],
  dr:            [_L('Redukcia poškodenia'), v => fmtN(v) + ' %']
};

const ALL = ['weapon', 'secondary', 'shield', 'engine', 'reactor', 'drones', 'armor'];
const AFFIXES = {
  atkSpd:  { label: v => _T`+${v}% Rýchlosť streľby`, range: [4, 10], slots: ['weapon', 'secondary', 'engine', 'reactor'], suffix: _L('rýchlosti') },
  allDmg:  { label: v => _T`+${v}% Všetko poškodenie`,              range: [4, 10], slots: ALL, suffix: _L('skazy') },
  laser:   { label: v => _T`+${v}% Poškodenie lasera`,            range: [6, 16], slots: ['weapon', 'shield', 'engine', 'drones'], suffix: _L('žiary') },
  missile: { label: v => _T`+${v}% Poškodenie rakiet`,          range: [6, 16], slots: ['secondary', 'shield', 'engine', 'reactor'], suffix: _L('ohňa') },
  yield:   { label: v => _T`+${v}% Výnos ťažby`,            range: [8, 20], slots: ALL, suffix: _L('baníka'), slow: true },
  crit:    { label: v => _T`+${v}% Kritická šanca`,         range: [2, 5],  slots: ['weapon', 'secondary', 'engine', 'reactor', 'drones'], suffix: _L('presnosti') },
  shield:  { label: v => _T`+${v}% Kapacita štítu`,         range: [6, 16], slots: ['secondary', 'shield', 'engine', 'reactor', 'armor'], suffix: _L('bašty') },
  hull:    { label: v => _T`+${v}% Pevnosť trupu`,          range: [6, 16], slots: ['shield', 'engine', 'armor'], suffix: _L('pancierov') },
  speed:   { label: v => _T`+${v}% Rýchlosť pohybu`,          range: [4, 10], slots: ['shield', 'engine', 'armor'], suffix: _L('vetra') },
  area:    { label: v => _T`+${v}% Plošné poškodenie`,             range: [5, 12], slots: ALL, suffix: _L('ozveny'), slow: true },
  skCdr:   { label: v => _T`+${v}% Skrátenie cooldownov`, range: [3, 7],  slots: ['shield', 'engine', 'reactor'], suffix: _L('pohotovosti'), slow: true },
  skDmg:   { label: v => _T`+${v}% Poškodenie schopností`, range: [8, 20], slots: ['weapon', 'secondary', 'drones', 'armor'], suffix: _L('majstra') }
};
const AFFIX_ORDER = Object.keys(AFFIXES);

const LEGEND_POOL = [
  { id: 'prism',     slot: 'weapon',    name: _L('Hranol Polárky'),         power: _L('Každý výstrel sa rozloží na 3 lúče. Bočné lúče majú 60 % poškodenia.') },
  { id: 'chain',     slot: 'weapon',    name: _L('Výbojka Volta'),          power: _L('Zásah lasera preskočí na 2 blízkych nepriateľov za 40 % poškodenia.') },
  { id: 'overheat',  slot: 'weapon',    name: _L('Prehrievacia cievka'),    power: _L('Nepretržitá streľba zvyšuje kadenciu o 4 % za sekundu, najviac o 60 %. Po 1 s pauzy cievka vychladne.') },
  { id: 'ricochet',  slot: 'weapon',    cls: 'interceptor', name: _L('Odrazové zrkadlá'), power: _L('Lasery prestrelia prvého nepriateľa a letia ďalej so 70 % poškodenia.') },
  { id: 'cluster',   slot: 'secondary', name: _L('Kazetová hlavica Úroda'), power: _L('Výbuch rakety rozmetá 6 šrapnelov, každý s 35 % poškodenia rakety.') },
  { id: 'gravwell',  slot: 'secondary', name: _L('Gravitačná hlavica'),     power: _L('Výbuch stiahne nepriateľov k stredu a na 1,6 s ich spomalí o 60 %.') },
  { id: 'barrage',   slot: 'secondary', name: _L('Dvojitá salva'),          power: _L('Každú salvu o 0,4 s nasleduje druhá so 60 % poškodenia.') },
  { id: 'auraBurst', slot: 'secondary', cls: 'juggernaut', name: _L('Jadro Titana'), power: _L('Výbuchy rakiet zväčšia tvoju auru o 50 % na 4 s.') },
  { id: 'nova',      slot: 'shield',    name: _L('Reaktívne jadro Aegis'),  power: _L('Keď štít klesne na nulu, uvoľní novu za 150 % max. štítu a zmaže blízke strely (CD 8 s).') },
  { id: 'reflect',   slot: 'shield',    name: _L('Zrkadlový štít'),         power: _L('Kým máš štít, 25 % nepriateľských striel sa odrazí späť ako laser za 200 % poškodenia.') },
  { id: 'vampiric',  slot: 'shield',    name: _L('Sifón Prázdnoty'),        power: _L('3 % spôsobeného poškodenia sa vracia do štítu.') },
  { id: 'oreArmor',  slot: 'shield',    cls: 'scavenger', name: _L('Rudný pancier'), power: _L('Každý zber rudy pridá +2 % Všetko poškodenie na 6 s (najviac 15 stackov).') },
  { id: 'wake',      slot: 'engine',    name: _L('Iónová stopa Kométy'),    power: _L('Motor zanecháva iónovú stopu, ktorá spaľuje nepriateľov za 80 % poškodenia lasera za sekundu.') },
  { id: 'afterburner', slot: 'engine',  name: _L('Prídavné spaľovanie'),    power: _L('Ak 3 s neutŕžiš zásah, máš +25 % rýchlosť a +15 % poškodenie.') },
  { id: 'magnetar',  slot: 'engine',    name: _L('Magnetarové jadro'),      power: _L('+60 % dosah magnetu a každý kúsok rudy má hodnotu o 1 vyššiu.') },
  { id: 'capacitor', slot: 'reactor',   name: _L('Kondenzátor Tesla'),      power: _L('Každé zostrelenie skráti nabíjanie rakiet o 0,5 s.') },
  { id: 'stasis',    slot: 'reactor',   name: _L('Stázové jadro'),          power: _L('Keď trup klesne pod 30 %, si 3 s nezraniteľný (CD 30 s).') },
  { id: 'swarmlord', slot: 'drones',    name: _L('Pán roja'),               power: _L('Zátoka vypustí o 2 drony viac.') },
  { id: 'kamikaze',  slot: 'drones',    name: _L('Samovražedná letka'),     power: _L('Každých 6 s sa dron vrhne na najbližšieho nepriateľa a vybuchne za 300 % poškodenia lasera.') },
  { id: 'thorns',    slot: 'armor',     name: _L('Ostnatý pancier'),        power: _L('Pri zásahu loď vystrelí 6 šrapnelov za 100 % poškodenia lasera (najviac raz za sekundu).') },
  { id: 'bulwark',   slot: 'armor',     name: _L('Bašta'),                  power: _L('Kým letíš pomaly alebo stojíš, máš +20 % redukciu poškodenia.') },
  { id: 'blinkcore', slot: 'engine',    cls: 'interceptor', name: _L('Kvantový krok'), power: _L('Po úhybe sú tvoje ďalšie 3 výstrely garantovane kritické.') },
  // skill legendaries: change how an active skill works
  { id: 'lChrono',   slot: 'reactor',   name: _L('Chronojadro'),             power: _L('Každé zostrelenie skráti cooldown schopností Q a Shift o 0,3 s.') },
  { id: 'lRail',     slot: 'weapon',    cls: 'interceptor', skill: 'railgun', name: _L('Lomený lúč'),        power: _L('Railgun sa od posledného zasiahnutého nepriateľa 2× odrazí k ďalšiemu cieľu za 70 % poškodenia.') },
  { id: 'lClone',    slot: 'engine',    cls: 'interceptor', skill: 'clone',   name: _L('Zrkadlová sieň'),    power: _L('Fantómový klon vytvorí dva klony naraz.') },
  { id: 'lErupt',    slot: 'shield',    cls: 'juggernaut',  skill: 'eruption', name: _L('Srdce sopky'),      power: _L('Erupcia aury sa o 1 s a 2 s zopakuje za 50 % sily.') },
  { id: 'lWell',     slot: 'reactor',   cls: 'juggernaut',  skill: 'gravwell', name: _L('Čierne jadro'),     power: _L('Gravitačná studňa trvá o 2 s dlhšie a každú sekundu pulzuje za 100 % poškodenia lasera.') },
  { id: 'lHurl',     slot: 'drones',    cls: 'scavenger',   skill: 'hurl',    name: _L('Gravitačné chápadlá'), power: _L('Traktorový vrh chytí a hodí až 3 asteroidy naraz.') },
  { id: 'lMines',    slot: 'secondary', cls: 'scavenger',   skill: 'mines',   name: _L('Kazetové míny'),     power: _L('Každá mína sa po výbuchu rozpadne na 3 menšie míny za 40 % poškodenia.') },
  { id: 'lOrder',    slot: 'drones',    cls: 'carrier',     skill: 'order',   name: _L('Veliteľský kanál'),  power: _L('Počas Rozkazu: Útok strieľajú mínióni dvojnásobne rýchlo.') },
  { id: 'lDeton',    slot: 'reactor',   cls: 'carrier',     skill: 'detonate', name: _L('Fénixova linka'),   power: _L('Po Detonácii sa o 3 s znovu postaví toľko miniónov, koľko vybuchlo.') }
];
// mythic items: one fixed drop source each, tiny chance
const MYTHIC_LIST = [
  { id: 'singularity', slot: 'weapon',    name: _L('Singularita Eventu'), chance: 0.01,
    power: _L('Každý 8. výstrel vypustí singularitu, ktorá 2,4 s sťahuje nepriateľov a drví ich v jadre za 150 % poškodenia lasera za sekundu.'),
    source: _L('Prázdnotný Leviatan · 1 % · svet III+') },
  { id: 'broodheart',  slot: 'secondary', name: _L('Srdce Matky roja'),   chance: 0.005,
    power: _L('Každý výbuch rakety vyliahne 2 spojenecké drony (najviac 6), ktoré 9 s strieľajú na nepriateľov.'),
    source: _L('Matka roja · 0,5 % · svet III+') },
  { id: 'phaseCut',    slot: 'engine',    name: _L('Fázový rez'),         chance: 0.01,
    power: _L('Úhyb (Space) sa zmení na fázový skok: počas skoku si nezraniteľný a každému nepriateľovi v ceste spôsobíš 300 % poškodenia lasera (CD 2,2 s).'),
    source: _L('Dreadnought Vex · 1 % · svet III+') },
  { id: 'tessarEye',   slot: 'shield',    name: _L('Oko Tessaru'),        chance: 0.03,
    power: _L('Každý rozbitý asteroid vytvorí kryštálový pancier (najviac 3). Pancier úplne pohltí jeden zásah.'),
    source: _L('Žiarivý kryštál v lome Tessar · 3 % · svet III+') },
  { id: 'crown',       slot: 'reactor',   name: _L('Koruna Architekta'),  chance: 0.15,
    power: _L('Každých 10 s zastaví čas na 2 s: nepriatelia, ich strely a útoky zamrznú.'),
    source: _L('Architekt Prázdnoty · 15 % · prvé víťazstvo garantované') },
  { id: 'voidecho',    slot: null,        name: _L('Semeno Prázdnoty'),   chance: 0.00001,
    power: _L('Každý tvoj zásah má 20 % šancu zopakovať sa ako ozvena Prázdnoty s plným poškodením.'),
    source: _L('Akýkoľvek zásah asteroidu · 1 : 100 000 · každý svet') }
];
// nightmare gate modifiers: every key rolls 1-3 threats and one bonus
const NM_MODS = {
  volatile:  { name: _L('Nestabilné trupy'),   desc: _L('Nepriatelia po smrti po chvíli vybuchnú.') },
  noRegen:   { name: _L('Tlmiace pole'),       desc: _L('Obnova štítu −75 %.') },
  fortified: { name: _L('Opevnení velitelia'), desc: _L('Elity a boss majú +60 % životov.') },
  swift:     { name: _L('Hyperpohon'),         desc: _L('Nepriatelia aj ich strely sú o 30 % rýchlejší.') },
  burning:   { name: _L('Plazmové výrony'),    desc: _L('Okolo lode vybuchujú plazmové zóny.') },
  horde:     { name: _L('Roj'),                desc: _L('Vlny sú o 50 % početnejšie.') }
};
const NM_BONUS = {
  loot: { name: _L('Hojnosť'),        desc: _L('+50 % šanca na výbavu a boss pustí o 2 predmety viac.') },
  ore:  { name: _L('Bohaté žily'),    desc: _L('Dvojnásobok rudy.') },
  xp:   { name: _L('Skúsenosti'),     desc: '+75 % XP.' },
  myth: { name: _L('Mýtický šepot'),  desc: _L('Dvojnásobná šanca na mýtické predmety.') }
};
const NM_LIMIT = 240;   // seconds to beat a nightmare gate
const nmScale = k => ({ hp: 1 + 0.12 * k, dmg: 1 + 0.06 * k, lvl: Math.floor(k / 3) });
const GEMS = {
  ruby:     { name: _L('rubín'),   color: '#ff4d6d', stat: 'allDmg', label: _L('Všetko poškodenie'),      vals: [3, 5, 8] },
  sapphire: { name: _L('zafír'),   color: '#5f8bff', stat: 'shield', label: _L('Kapacita štítu'), vals: [5, 9, 15] },
  emerald:  { name: 'smaragd', color: '#4fe08a', stat: 'yield',  label: _L('Výnos ťažby'),    vals: [6, 11, 18] },
  topaz:    { name: _L('topás'),   color: '#ffc94d', stat: 'crit',   label: _L('Kritická šanca'), vals: [1, 2, 3.5] },
  amethyst: { name: 'ametyst', color: '#b46bff', stat: 'atkSpd', label: _L('Rýchlosť streľby'),    vals: [3, 5, 9] }
};
const GEM_Q = [_L('Úlomkový'), _L('Brúsený'), _L('Dokonalý')];
const gemName = (t, q) => `${GEM_Q[q]} ${GEMS[t].name}`;
const MAX_SOCKETS = [0, 0, 1, 2, 3];
const SHARDS_FOR = [0, 0, 1, 4, 15];
const FRAG_BOSSES = ['brood', 'warden', 'dread', 'leviathan'];
const ARCH_PATTERNS = { 1: ['ring', 'spiral', 'fan', 'beam'], 2: ['ring', 'fan', 'spiral'], 3: ['spiral', 'ring', 'fan', 'beam', 'beam'] };
const LEVEL_CAP = 50;
const paraNeed = l => Math.round(16000 * (1 + 0.04 * l));
const PARA = {
  forge:    { name: _L('Kováč'),   color: '#ff7a5c', ang: -135, n: _L('+3 % Všetko poškodenie'), m: _L('+8 % Poškodenie lasera a +8 % Poškodenie rakiet'), s: { name: _L('Kovadlina hviezd'), text: _L('+10 % Všetko poškodenie a +25 % kritické poškodenie') } },
  warden:   { name: _L('Strážca'), color: '#5fd4ff', ang: -45,  n: _L('+4 % trup a +3 % štít'), m: _L('+3 % redukcia poškodenia'), s: { name: _L('Neprelomný'), text: _L('+8 % redukcia poškodenia a +30 % obnova štítu') } },
  hunter:   { name: _L('Lovec'),   color: '#ffc94d', ang: 45,   n: _L('+1 % Kritická šanca'), m: _L('+10 % poškodenie elitám a bossom'), s: { name: _L('Oko lovca'), text: _L('+5 % Kritická šanca, +20 % poškodenie elitám a bossom, +10 % kritické poškodenie') } },
  wayfarer: { name: _L('Pútnik'),  color: '#7ee0a8', ang: 135,  n: _L('+2 % rýchlosť a +5 % Výnos ťažby'), m: _L('+25 dosah magnetu a +5 % XP'), s: { name: _L('Kométa'), text: _L('+10 % rýchlosť, +5 % úhyb a +20 % XP') } }
};
const RUNES = {
  ignis:   { name: _L('Runa Žiaru'),  color: '#ff7a5c', main: L => _T`+${L} % Všetko poškodenie`, bonus: _L('+20 % kritické poškodenie'), fx: (L, on, p, s) => { p.allDmg += L; if (on) s.critMult += 0.2; } },
  aegis:   { name: _L('Runa Egidy'),  color: '#5fd4ff', main: L => _T`+${fmtN(L * 1.2)} % trup a štít`, bonus: _L('+5 % redukcia poškodenia'), fx: (L, on, p, s, a) => { p.hull += L * 1.2; p.shield += L * 1.2; if (on) a.dr += 5; } },
  venator: { name: _L('Runa Lovca'),  color: '#ffc94d', main: L => _T`+${fmtN(L * 1.5)} % poškodenie elitám a bossom`, bonus: _L('+3 % Kritická šanca'), fx: (L, on, p, s) => { s.eliteDmg += L * 1.5; if (on) p.crit += 3; } },
  celer:   { name: _L('Runa Vetra'),  color: '#7ee0a8', main: L => _T`+${fmtN(L * 0.5)} % kadencia a rýchlosť`, bonus: _L('+5 % úhyb'), fx: (L, on, p, s) => { p.atkSpd += L * 0.5; p.speed += L * 0.5; if (on) s.dodge += 5; } },
  turbo:   { name: _L('Runa Víru'),   color: '#c77dff', main: L => _T`+${L} % Plošné poškodenie`, bonus: _L('+10 % Všetko poškodenie'), fx: (L, on, p) => { p.area += L; if (on) p.allDmg += 10; } },
  aurum:   { name: _L('Runa Zlata'),  color: '#ffd36b', main: L => _T`+${L * 2} % Výnos ťažby a +${L} % XP`, bonus: _L('+25 % rudy'), fx: (L, on, p, s) => { p.yield += L * 2; s.xpMult += L / 100; if (on) s.oreMult += 0.25; } },
  legio:   { name: _L('Runa Légie'),  color: '#ff9d6e', main: L => _T`+${fmtN(L * 1.5)} % poškodenie dronov a miniónov`, bonus: _L('+1 dron a +1 max. minión'), fx: (L, on, p, s) => { if (s.drones) { s.drones.dmg *= 1 + L * 0.015; if (on) s.drones.count += 1; } if (s.minion) { s.minion.dmg *= 1 + L * 0.015; if (on && !s.minion.titan) s.minion.max += 1; } } },
  nova:    { name: _L('Runa Novy'),   color: '#9fd0ff', main: L => _T`+${L} % poškodenie lasera a rakiet`, bonus: _L('−10 % nabíjanie rakiet'), fx: (L, on, p, s, a) => { p.laser += L; p.missile += L; if (on) a.cdr += 10; } }
};
const RUNE_MAX = 30, RUNE_ON = 10;   // the bonus needs 10 allocated nodes in that constellation
function grantRune(x, y) {
  const PA = P.para; PA.rl = PA.rl || {};
  const missing = Object.keys(RUNES).filter(r => !PA.rl[r]);
  if (missing.length) {
    const r = pick(missing); PA.rl[r] = 1;
    banner(_T`<span style="color:${RUNES[r].color}">${RUNES[r].name}</span><small>Nová hviezdna runa · vlož ju do konštelácie (P)</small>`);
    log(_T`Hviezdna runa: <span style="color:${RUNES[r].color}">${RUNES[r].name}</span>.`);
  } else addShards(10);
}
function levelRunes(k) {
  const PA = P.para, up = [];
  for (const b in PA.runes || {}) {
    const r = PA.runes[b]; if (!r || !PA.rl[r]) continue;
    if (PA.rl[r] < RUNE_MAX && k >= PA.rl[r]) { PA.rl[r]++; up.push(`${RUNES[r].name} ${PA.rl[r]}`); }
  }
  if (up.length) log(_T`<span style="color:#e8e2ff">Runy vylepšené:</span> ${up.join(', ')}.`);
  else if (Object.values(PA.runes || {}).some(Boolean)) log(_L('Runy sa nevylepšili: úroveň nočnej brány musí byť aspoň taká ako úroveň runy.'));
}
const PARA_PATTERN = ['n', 'n', 'n', 'n', 'm', 'n', 'n', 'n', 'n', 'm', 'n', 'n', 'n', 's'];
function paraCounts(n) { let N = 0, M = 0, S = 0; for (let i = 0; i < n; i++) { const t = PARA_PATTERN[i]; if (t === 'n') N++; else if (t === 'm') M++; else S++; } return { N, M, S }; }
const BOSS_MYTHIC = { brood: 'broodheart', dread: 'phaseCut', leviathan: 'singularity' };
const LEGEND_INDEX = {};
for (const l of LEGEND_POOL) LEGEND_INDEX[l.id] = l;
for (const m of MYTHIC_LIST) LEGEND_INDEX[m.id] = m;

const TIER_UNLOCK = { 2: 'dread', 3: 'gravit' };   // world tier IV comes from the Architect
const TIERS = [null,
  { roman: 'I',   name: _L('I · Prieskum'),         lvl: 0,  hp: 1.0, dmg: 1.0,  xp: 1.0, leg: 1.0, req: 0,  anc: 0,    myth: 0, trash: 1, elite: 1, desc: _L('Základná obťažnosť. Bez pradávnych a mýtických predmetov.') },
  { roman: 'II',  name: _L('II · Veterán'),         lvl: 4,  hp: 1.3, dmg: 1.15, xp: 1.5, leg: 2.2, req: 15, anc: 0,    myth: 0, trash: 1, elite: 1, desc: _L('Nepriatelia +4 úr. · XP ×1,5 · legendárky ×2,2') },
  { roman: 'III', name: _L('III · Nočná mora'),     lvl: 9,  hp: 1.8, dmg: 1.3,  xp: 2.2, leg: 3.5, req: 35, anc: 0.10, myth: 1, trash: 0.85, elite: 1.15, desc: _L('Nepriatelia +9 úr. · bežní −15 % HP, elity +15 % · XP ×2,2 · pradávne 10 % · mýtické predmety') },
  { roman: 'IV',  name: _L('IV · Peklo Prázdnoty'), lvl: 15, hp: 2.6, dmg: 1.5,  xp: 3.0, leg: 5.0, req: 50, anc: 0.25, myth: 2, trash: 0.7, elite: 1.3, desc: _L('Nepriatelia +15 úr. · bežní −30 % HP, elity a bossovia +30 % · XP ×3 · pradávne 25 % · mýtické ×2') }
];
const RARE_PREFIX = [_L('Hviezdny'), _L('Temný'), _L('Prázdnotný'), _L('Kométin'), _L('Pulzarový'), _L('Krvavý'), _L('Mrazivý'), _L('Zlatý'), _L('Tichý'), _L('Žeravý'), _L('Nebulárny')];
const RARE_NOUN = {
  weapon: [_L('Žiarič'), _L('Tŕň'), _L('Kosák'), _L('Šíp'), _L('Hrot')],
  secondary: [_L('Roj'), _L('Hrom'), _L('Úder'), _L('Pád'), _L('Súd')],
  shield: [_L('Štít'), _L('Val'), _L('Závoj'), _L('Krunier'), _L('Múr')],
  engine: [_L('Prúd'), _L('Sokol'), _L('Vietor'), _L('Let'), _L('Beh')],
  reactor: [_L('Puls'), _L('Plameň'), _L('Dych'), _L('Žiar'), _L('Tep')],
  drones: [_L('Roj'), _L('Kŕdeľ'), _L('Úľ'), _L('Zbor'), _L('Šik')],
  armor: [_L('Pancier'), _L('Plášť'), _L('Krunier'), _L('Val'), _L('Obal')]
};
