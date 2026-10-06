'use strict';
/* ---------- per-ship talent trees ----------
   3 branches per ship, 6 nodes in 3 tiers (tier 1 needs 5 points in the branch, tier 2 needs 10),
   one keystone per ship (15 points in its branch). 49 points at level 50 vs ~65 in a tree. */
const TIER_REQ = [0, 5, 10], KEY_REQ = 15, TAL_OVER = 3;
const N = (id, name, max, t, per, txt, fx) => ({ id, name, max, t, per, txt, fx });
const pc = lab => v => `+${v} % ${lab}`;
const TREES = {
  interceptor: [
    { id: 'sharp', name: 'Ostrostrelec', color: '#5fd4ff', desc: 'Laser, kritické zásahy, prierazné strely a výboje.',
      leg: { slot: 'armor', name: 'Optický pancier Sokola' }, wish: ['laser', 'crit', 'atkSpd', 'allDmg', 'area'], types: { weapon: 'rapid' },
      nodes: [
        N('iLens', 'Kalibrované šošovky', 5, 0, 6, pc('Laser Damage'), (s, p, a, v) => { p.laser += v; }),
        N('iAim', 'Presné mierenie', 3, 0, 2, pc('Critical Chance'), (s, p, a, v) => { p.crit += v; }),
        N('iPierce', 'Prierazné jadrá', 3, 1, 1, v => `lasery prerazia +${v} nepriateľov`),
        N('iCritDmg', 'Smrtiace zásahy', 5, 1, 10, pc('kritické poškodenie'), (s, p, a, v) => { s.critMult += v / 100; }),
        N('iArc', 'Výbojové hroty', 3, 2, 25, v => `kritický zásah preskočí na 2 blízkych za ${v} % poškodenia`),
        N('iCap', 'Rýchle kondenzátory', 3, 2, 5, pc('kadencia'), (s, p, a, v) => { p.atkSpd += v; })
      ],
      key: { id: 'kRhythm', name: 'Smrtiaci rytmus', text: 'Každý 4. výstrel je garantovane kritický a prerazí všetkých nepriateľov v dráhe. +20 % kritické poškodenie.' } },
    { id: 'salvo', name: 'Roj rakiet', color: '#ff9a4a', desc: 'Viac rakiet, väčšie výbuchy, šrapnely a nekonečné salvy.',
      leg: { slot: 'drones', name: 'Hniezdo Hydry' }, wish: ['missile', 'atkSpd', 'allDmg', 'area', 'crit'], types: { secondary: 'swarm' },
      nodes: [
        N('iWar', 'Hlavice', 5, 0, 8, pc('Missile Damage'), (s, p, a, v) => { p.missile += v; }),
        N('iReload', 'Rýchle nakladanie', 3, 0, 6, v => `−${v} % nabíjanie rakiet`, (s, p, a, v) => { a.cdr += v; }),
        N('iMag', 'Rozšírené zásobníky', 2, 1, 1, v => `+${v} raketa v salve`, (s, p, a, v) => { s.missileCount += v; }),
        N('iBlast', 'Väčšie nálože', 5, 1, 10, pc('polomer výbuchu'), (s, p, a, v) => { s.missileRadius *= 1 + v / 100; }),
        N('iShrap', 'Šrapnelové plášte', 3, 2, 2, v => `výbuch rozmetá ${v} šrapnelov za 30 % poškodenia rakety`),
        N('iHydra', 'Hydra', 3, 2, 15, pc('poškodenie rakiet elitám a bossom'))
      ],
      key: { id: 'kSalvo', name: 'Nekonečná salva', text: '+1 raketa v salve. Každé zostrelenie raketou má 25 % šancu okamžite nabiť ďalšiu salvu.' } },
    { id: 'phantom', name: 'Fantóm', color: '#b48cff', desc: 'Rýchlosť, úhyb a výboje pri úhybe. Poškodenie rastie s pohybom.',
      leg: { slot: 'armor', name: 'Fázové platne Fantóma' }, wish: ['speed', 'laser', 'crit', 'allDmg', 'area'], types: { weapon: 'rapid', engine: 'fusion' },
      nodes: [
        N('iThr', 'Vektorové trysky', 5, 0, 5, pc('rýchlosť'), (s, p, a, v) => { p.speed += v; }),
        N('iJuke', 'Kľučkovanie', 3, 0, 3, pc('úhyb'), (s, p, a, v) => { s.dodge += v; }),
        N('iSpeedCore', 'Rýchlostné jadro', 3, 1, 1, v => `+${v} % All Damage za každých 50 rýchlosti`),
        N('iDodgeBlast', 'Úhybový výboj', 3, 1, 80, v => `úhyb uvoľní výboj za ${v} % poškodenia lasera`),
        N('iPhaseSh', 'Fázový štít', 3, 2, 5, v => `úhyb obnoví ${v} % štítu`),
        N('iFlow', 'Prúdenie', 3, 2, 8, v => `+${v} % poškodenie pri letu nad 70 % max. rýchlosti`)
      ],
      key: { id: 'kGhost', name: 'Fázový duch', text: '+10 % úhyb. Každý úhyb uvoľní výboj za +300 % poškodenia lasera (dosah 220) a na 1 s ti dá +30 % poškodenie.' } }
  ],
  juggernaut: [
    { id: 'fortress', name: 'Pevnosť', color: '#7fb2ff', desc: 'Trup, štíty, redukcia poškodenia a odvetné impulzy.',
      leg: { slot: 'armor', name: 'Bašta Titána' }, wish: ['allDmg', 'hull', 'laser', 'area', 'shield'], types: {},
      nodes: [
        N('jPlate', 'Pancierové platne', 5, 0, 8, pc('trup'), (s, p, a, v) => { p.hull += v; }),
        N('jCoil', 'Štítové cievky', 5, 0, 8, pc('štít'), (s, p, a, v) => { p.shield += v; }),
        N('jDiff', 'Rozptyľovače', 3, 1, 3, pc('redukcia poškodenia'), (s, p, a, v) => { a.dr += v; }),
        N('jRegen', 'Rýchle dobíjanie', 3, 1, 20, pc('obnova štítu'), (s, p, a, v) => { a.regen += v; }),
        N('jThorn', 'Tŕnistý trup', 3, 2, 100, v => `zásah lode uvoľní impulz za ${v} % poškodenia lasera (0,5 s)`),
        N('jLast', 'Posledná bašta', 3, 2, 8, v => `+${v} % redukcia poškodenia pod 40 % trupu`)
      ],
      key: { id: 'kUnbroken', name: 'Nezlomný', text: '+10 % redukcia poškodenia. Každý zásah pohltený štítom vyšle novu za 300 % poškodenia lasera (najviac 2× za sekundu).' } },
    { id: 'inferno', name: 'Peklo aury', color: '#c29bff', desc: 'Aura rastie so zbraňou: väčšia, silnejšia, spomaľuje a pulzuje.',
      leg: { slot: 'drones', name: 'Žiariace sondy' }, wish: ['laser', 'allDmg', 'shield', 'hull', 'area'], types: { weapon: 'heavy' },
      nodes: [
        N('jAura', 'Zosilnená aura', 5, 0, 12, pc('poškodenie aury')),
        N('jField', 'Rozšírenie poľa', 3, 0, 10, pc('dosah aury')),
        N('jHeavy', 'Ťažké pole', 3, 1, 10, v => `aura spomalí nepriateľov o ${v} %`),
        N('jMelt', 'Taviaca aura', 3, 1, 50, pc('poškodenie aury asteroidom')),
        N('jPulse', 'Pulz', 3, 2, 100, v => `každé 3 s aura pulzuje za ${v} % svojho DPS`),
        N('jAbsorb', 'Absorpcia', 3, 2, 1, v => `${v} % štítu/s za každého nepriateľa v aure (max 5)`)
      ],
      key: { id: 'kCorona', name: 'Slnečná koruna', text: 'Aura má +60 % poškodenie, +25 % dosah a započítava tvoju šancu na kritický zásah.' } },
    { id: 'artillery', name: 'Delostrelec', color: '#ff9470', desc: 'Ťažké rakety, rázové vlny, spomalenie a ohnivé zóny.',
      leg: { slot: 'drones', name: 'Pozorovacie sondy Delostrelca' }, wish: ['missile', 'laser', 'allDmg', 'area', 'atkSpd'], types: { secondary: 'plasma' },
      nodes: [
        N('jShell', 'Ťažké náboje', 5, 0, 8, pc('Missile Damage'), (s, p, a, v) => { p.missile += v; }),
        N('jBeam', 'Ťažký lúč', 5, 0, 6, pc('Laser Damage'), (s, p, a, v) => { p.laser += v; }),
        N('jShock', 'Rázová vlna', 5, 1, 12, pc('polomer výbuchu'), (s, p, a, v) => { s.missileRadius *= 1 + v / 100; }),
        N('jQuake', 'Otrasy', 3, 1, 15, v => `výbuchy spomalia o ${v} % na 2 s`),
        N('jCal', 'Kaliber', 3, 2, 20, pc('poškodenie elitám a bossom'), (s, p, a, v) => { s.eliteDmg += v; }),
        N('jLoad', 'Rýchle nabíjanie', 3, 2, 8, v => `−${v} % nabíjanie rakiet`, (s, p, a, v) => { a.cdr += v; })
      ],
      key: { id: 'kHammer', name: 'Kladivo', text: 'Výbuchy rakiet zanechajú 3 s ohnivú zónu, ktorá páli za 40 % poškodenia rakety za sekundu.' } }
  ],
  scavenger: [
    { id: 'prospector', name: 'Prospektor', color: '#c8a27c', desc: 'Ťažba sa mení na poškodenie, asteroidy vybuchujú.',
      leg: { slot: 'drones', name: 'Prospektorské sondy' }, wish: ['allDmg', 'laser', 'yield', 'area', 'crit'], types: { drones: 'mining' },
      nodes: [
        N('sDrill', 'Hĺbkové vrtáky', 5, 0, 15, v => `+${v} % Mining Yield a ťažobná sila`, (s, p, a, v) => { p.yield += v; }),
        N('sTract', 'Traktorové pole', 3, 0, 30, pc('dosah magnetu'), (s, p, a, v) => { s.magnet *= 1 + v / 100; }),
        N('sConv', 'Kinetická konverzia', 3, 1, 20, v => `${v} % bonusovej ťažobnej sily → All Damage`),
        N('sCrush', 'Drvič', 3, 1, 3, v => `rozbitý asteroid: +${v} % poškodenie na 6 s (max 5×)`),
        N('sBoom', 'Výbušná ruda', 3, 2, 100, v => `rozbitý asteroid vybuchne za ${v} % poškodenia lasera`),
        N('sProfit', 'Zisk', 3, 2, 10, v => `+${v} % XP a rudy`, (s, p, a, v) => { s.xpMult += v / 100; })
      ],
      key: { id: 'kRush', name: 'Zlatá horúčka', text: 'Každých 100 zozbieranej rudy spustí 10 s Zlatej horúčky: +40 % poškodenie a +20 % kadencia.' } },
    { id: 'hive', name: 'Rojník', color: '#7ee0a8', desc: 'Silnejšie a početnejšie drony, ktoré vybuchujú a kriticky zasahujú.',
      leg: { slot: 'drones', name: 'Kráľovná roja' }, wish: ['laser', 'allDmg', 'crit', 'atkSpd', 'area'], types: { drones: 'assault' },
      nodes: [
        N('sCore', 'Dronové jadrá', 5, 0, 12, pc('poškodenie dronov')),
        N('sBay', 'Rozšírená zátoka', 2, 0, 1, v => `+${v} dron`),
        N('sSync', 'Synchronizácia', 3, 1, 15, pc('kadencia dronov')),
        N('sRep', 'Opravné moduly', 5, 1, 4, v => `+${v} % trup a štít`, (s, p, a, v) => { p.hull += v; p.shield += v; }),
        N('sDBlast', 'Výbušné strely', 3, 2, 30, v => `strely dronov vybuchnú za ${v} % poškodenia`),
        N('sDCrit', 'Lovecké drony', 3, 2, 5, v => `drony majú ${v} % šancu na kritický zásah`)
      ],
      key: { id: 'kHive', name: 'Úľ', text: '+2 drony. Všetky drony útočia na nepriateľov, prerážajú a používajú tvoju šancu na kritický zásah.' } },
    { id: 'magnate', name: 'Magnát', color: '#ffc94d', desc: 'Ruda je štít aj zbraň. Bohatstvo zvyšuje poškodenie.',
      leg: { slot: 'armor', name: 'Zlatý krunier Magnáta' }, wish: ['allDmg', 'laser', 'shield', 'area', 'crit'], types: {},
      nodes: [
        N('sMatrix', 'Štítová matica', 5, 0, 8, pc('štít'), (s, p, a, v) => { p.shield += v; }),
        N('sCollect', 'Zberné pole', 3, 0, 1, v => `každý kúsok rudy obnoví ${v} % štítu`),
        N('sInvest', 'Investícia', 5, 1, 2, v => `+${v} % poškodenie za 500 rudy v náklade (max 10×)`),
        N('sHaggle', 'Vyjednávač', 3, 1, 10, v => `−${v} % ceny na stanici, v dielni a pri resete`),
        N('sPatron', 'Mecenáš', 3, 2, 5, pc('úhyb'), (s, p, a, v) => { s.dodge += v; }),
        N('sDiv', 'Dividenda', 3, 2, 15, pc('šanca na výbavu'))
      ],
      key: { id: 'kOreShield', name: 'Rudný štít', text: 'Každý kúsok rudy nabije preťaženie štítu o 1 % max. štítu (najviac 50 %). Kým máš preťaženie, dávaš +30 % poškodenie. Preťaženie pohltí zásah ako prvé a pomaly vyprcháva.' } }
  ],
  carrier: [
    { id: 'legion', name: 'Légia', color: '#ff9d6e', desc: 'Veľa miniónov, rýchla stavba, koordinovaná paľba.',
      leg: { slot: 'drones', name: 'Kovadlina légie' }, wish: ['laser', 'allDmg', 'crit', 'atkSpd', 'area'], types: {},
      nodes: [
        N('cFab', 'Výrobné linky', 5, 0, 12, pc('poškodenie miniónov')),
        N('cBuild', 'Rýchla montáž', 3, 0, 10, pc('šanca postaviť minióna')),
        N('cHangar', 'Rozšírený hangár', 2, 1, 1, v => `+${v} max. miniónov`),
        N('cArmor', 'Pancierovanie', 3, 1, 20, pc('životy miniónov')),
        N('cCoord', 'Koordinovaná paľba', 3, 2, 15, pc('kadencia miniónov')),
        N('cLeader', 'Vodca svorky', 3, 2, 2, v => `+${v} % poškodenie lode za každého minióna`)
      ],
      key: { id: 'kArmy', name: 'Armáda', text: '+3 max. miniónov a každé zostrelenie postaví minióna.' } },
    { id: 'colossus', name: 'Kolos', color: '#ffcf6e', desc: 'Odolní minióni s plošnými údermi. Kľúčový talent: jeden obrovský Kolos.',
      leg: { slot: 'armor', name: 'Srdce Kolosa' }, wish: ['laser', 'allDmg', 'hull', 'area', 'crit'], types: {},
      nodes: [
        N('cFrame', 'Ťažký rám', 5, 0, 15, pc('životy miniónov')),
        N('cHydr', 'Hydraulika', 5, 0, 10, pc('poškodenie miniónov')),
        N('cCrush', 'Drviace údery', 3, 1, 15, v => `zásahy miniónov spomalia o ${v} %`),
        N('cSkin', 'Oceľová koža', 3, 1, 3, pc('redukcia poškodenia lode'), (s, p, a, v) => { a.dr += v; }),
        N('cSplash', 'Rozmetanie', 3, 2, 25, v => `strely miniónov zasiahnu okolie za ${v} %`),
        N('cSelfRep', 'Samooprava', 3, 2, 2, v => `minióni si opravia ${v} % životov za sekundu`)
      ],
      key: { id: 'kTitan', name: 'Titán', text: 'Namiesto roja postavíš jediného Kolosa: 8× životy, 8× poškodenie, plošné údery (dosah 140). Nestarne a po zničení sa za 5 s postaví znova.' } },
    { id: 'sacrifice', name: 'Obeta', color: '#ff5f6d', desc: 'Minióni žijú krátko a končia výbuchom.',
      leg: { slot: 'drones', name: 'Oltár recyklácie' }, wish: ['laser', 'allDmg', 'area', 'crit', 'hull'], types: {},
      nodes: [
        N('cCore', 'Výbušné jadrá', 5, 0, 40, v => `zničený minión vybuchne za ${v} % poškodenia lasera`),
        N('cShort', 'Krátka životnosť', 3, 0, 15, v => `+${v} % poškodenie miniónov, −${v} % životnosť`),
        N('cRecyc', 'Recyklácia', 3, 1, 2, v => `zničený minión obnoví ${v} % štítu`),
        N('cNecro', 'Nekromant', 3, 1, 10, pc('šanca postaviť minióna')),
        N('cChain', 'Reťazová reakcia', 3, 2, 15, v => `výbuch minióna má ${v} % šancu postaviť nového`),
        N('cDet', 'Detonátor', 3, 2, 50, v => `každých 8 s odpáli najstaršieho minióna za ${100 + v} % lasera`)
      ],
      key: { id: 'kAltar', name: 'Obetný oltár', text: 'Minióni sa vrhajú na nepriateľov a pri náraze vybuchnú za 400 % poškodenia lasera. Šanca postaviť minióna ×2.' } }
  ]
};
const TNODE = {}, TBRANCH = {};
for (const cls in TREES) for (const B of TREES[cls]) {
  B.cls = cls; TBRANCH[cls + ':' + B.id] = B;
  for (const n of B.nodes) { n.B = B; TNODE[n.id] = n; }
  Object.assign(B.key, { B, key: true, max: 1 }); TNODE[B.key.id] = B.key;
  const L = { id: 'b_' + B.id, slot: B.leg.slot, cls, build: B.id, name: B.leg.name,
    power: `+2 ku všetkým talentom vetvy „${B.name}“, do ktorých máš aspoň 1 bod (najviac +${TAL_OVER} nad maximum).` };
  LEGEND_POOL.push(L); LEGEND_INDEX[L.id] = L;
}
function branchSpent(B, tal) { tal = tal || P.tal; return B.nodes.reduce((a, n) => a + (tal[n.id] || 0), 0); }
function talentBonus(cls, equip) {
  const b = {};
  for (const sl of SLOT_ORDER) {
    const it = equip[sl]; if (!it) continue;
    if (it.tal && it.tal.cls === cls) b[it.tal.id] = (b[it.tal.id] || 0) + it.tal.v;
    const L = it.legend && LEGEND_INDEX[it.legend];
    if (L && L.build && L.cls === cls) for (const n of TBRANCH[cls + ':' + L.build].nodes) b[n.id] = (b[n.id] || 0) + 2;
  }
  const sc = {};
  for (const sl of SLOT_ORDER) { const it = equip[sl]; if (it && it.set && it.setCls === cls) sc[it.set] = (sc[it.set] || 0) + 1; }
  for (const id in sc) if (sc[id] >= 2 && TBRANCH[cls + ':' + id]) for (const n of TBRANCH[cls + ':' + id].nodes) b[n.id] = (b[n.id] || 0) + 1;
  return b;
}
// effective value of every node the pilot invested in (per-rank value × rank incl. gear bonus)
function talentValues(cls, equip, tal) {
  const bonus = talentBonus(cls, equip), out = {};
  for (const id in tal) {
    const n = TNODE[id]; if (!n || !tal[id] || n.B.cls !== cls) continue;
    out[id] = n.key ? 1 : n.per * Math.min(n.max + TAL_OVER, tal[id] + (bonus[id] || 0));
  }
  return out;
}
function canAddTalent(id) {
  const n = TNODE[id]; if (!n || n.B.cls !== P.cls || P.points <= 0) return false;
  const spent = branchSpent(n.B);
  if (n.key) return !P.tal[id] && spent >= KEY_REQ && !TREES[P.cls].some(B => P.tal[B.key.id]);
  return (P.tal[id] || 0) < n.max && spent >= TIER_REQ[n.t];
}
