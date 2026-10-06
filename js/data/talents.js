'use strict';
/* ---------- per-ship talent trees ----------
   3 branches per ship, 6 nodes in 3 tiers (tier 1 needs 5 points in the branch, tier 2 needs 10),
   one keystone per ship (15 points in its branch). 49 points at level 50 vs ~65 in a tree. */
const TIER_REQ = [0, 5, 10], KEY_REQ = 15, TAL_OVER = 3;
const N = (id, name, max, t, per, txt, fx) => ({ id, name, max, t, per, txt, fx });
const pc = lab => v => `+${v} % ${lab}`;
const TREES = {
  interceptor: [
    { id: 'sharp', name: _L('Ostrostrelec'), color: '#5fd4ff', desc: _L('Laser, kritické zásahy, prierazné strely a výboje.'),
      leg: { slot: 'armor', name: _L('Optický pancier Sokola') }, wish: ['laser', 'crit', 'atkSpd', 'allDmg', 'area'], types: { weapon: 'rapid' },
      nodes: [
        N('iLens', _L('Kalibrované šošovky'), 5, 0, 6, pc(_L('Poškodenie lasera')), (s, p, a, v) => { p.laser += v; }),
        N('iAim', _L('Presné mierenie'), 3, 0, 2, pc(_L('Kritická šanca')), (s, p, a, v) => { p.crit += v; }),
        N('iPierce', _L('Prierazné jadrá'), 3, 1, 1, v => _T`lasery prerazia +${v} nepriateľov`),
        N('iCritDmg', _L('Smrtiace zásahy'), 5, 1, 10, pc(_L('kritické poškodenie')), (s, p, a, v) => { s.critMult += v / 100; }),
        N('iArc', _L('Výbojové hroty'), 3, 2, 25, v => _T`kritický zásah preskočí na 2 blízkych za ${v} % poškodenia`),
        N('iCap', _L('Rýchle kondenzátory'), 3, 2, 5, pc('kadencia'), (s, p, a, v) => { p.atkSpd += v; })
      ],
      key: { id: 'kRhythm', name: _L('Smrtiaci rytmus'), text: _L('Každý 4. výstrel je garantovane kritický a prerazí všetkých nepriateľov v dráhe. +20 % kritické poškodenie.') } },
    { id: 'salvo', name: _L('Roj rakiet'), color: '#ff9a4a', desc: _L('Viac rakiet, väčšie výbuchy, šrapnely a nekonečné salvy.'),
      leg: { slot: 'drones', name: _L('Hniezdo Hydry') }, wish: ['missile', 'atkSpd', 'allDmg', 'area', 'crit'], types: { secondary: 'swarm' },
      nodes: [
        N('iWar', _L('Hlavice'), 5, 0, 8, pc(_L('Poškodenie rakiet')), (s, p, a, v) => { p.missile += v; }),
        N('iReload', _L('Rýchle nakladanie'), 3, 0, 6, v => _T`−${v} % nabíjanie rakiet`, (s, p, a, v) => { a.cdr += v; }),
        N('iMag', _L('Rozšírené zásobníky'), 2, 1, 1, v => _T`+${v} raketa v salve`, (s, p, a, v) => { s.missileCount += v; }),
        N('iBlast', _L('Väčšie nálože'), 5, 1, 10, pc(_L('polomer výbuchu')), (s, p, a, v) => { s.missileRadius *= 1 + v / 100; }),
        N('iShrap', _L('Šrapnelové plášte'), 3, 2, 2, v => _T`výbuch rozmetá ${v} šrapnelov za 30 % poškodenia rakety`),
        N('iHydra', _L('Hydra'), 3, 2, 15, pc(_L('poškodenie rakiet elitám a bossom')))
      ],
      key: { id: 'kSalvo', name: _L('Nekonečná salva'), text: _L('+1 raketa v salve. Každé zostrelenie raketou má 25 % šancu okamžite nabiť ďalšiu salvu.') } },
    { id: 'phantom', name: _L('Fantóm'), color: '#b48cff', desc: _L('Rýchlosť, úhyb a výboje pri úhybe. Poškodenie rastie s pohybom.'),
      leg: { slot: 'armor', name: _L('Fázové platne Fantóma') }, wish: ['speed', 'laser', 'crit', 'allDmg', 'area'], types: { weapon: 'rapid', engine: 'fusion' },
      nodes: [
        N('iThr', _L('Vektorové trysky'), 5, 0, 5, pc(_L('rýchlosť')), (s, p, a, v) => { p.speed += v; }),
        N('iJuke', _L('Kľučkovanie'), 3, 0, 3, pc(_L('úhyb')), (s, p, a, v) => { s.dodge += v; }),
        N('iSpeedCore', _L('Rýchlostné jadro'), 3, 1, 1, v => _T`+${v} % Všetko poškodenie za každých 50 rýchlosti`),
        N('iDodgeBlast', _L('Úhybový výboj'), 3, 1, 80, v => _T`úhyb uvoľní výboj za ${v} % poškodenia lasera`),
        N('iPhaseSh', _L('Fázový štít'), 3, 2, 5, v => _T`úhyb obnoví ${v} % štítu`),
        N('iFlow', _L('Prúdenie'), 3, 2, 8, v => _T`+${v} % poškodenie pri letu nad 70 % max. rýchlosti`)
      ],
      key: { id: 'kGhost', name: _L('Fázový duch'), text: _L('+10 % úhyb. Každý úhyb uvoľní výboj za +300 % poškodenia lasera (dosah 220) a na 1 s ti dá +30 % poškodenie.') } }
  ],
  juggernaut: [
    { id: 'fortress', name: _L('Pevnosť'), color: '#7fb2ff', desc: _L('Trup, štíty, redukcia poškodenia a odvetné impulzy.'),
      leg: { slot: 'armor', name: _L('Bašta Titána') }, wish: ['allDmg', 'hull', 'laser', 'area', 'shield'], types: {},
      nodes: [
        N('jPlate', _L('Pancierové platne'), 5, 0, 8, pc('trup'), (s, p, a, v) => { p.hull += v; }),
        N('jCoil', _L('Štítové cievky'), 5, 0, 8, pc(_L('štít')), (s, p, a, v) => { p.shield += v; }),
        N('jDiff', _L('Rozptyľovače'), 3, 1, 3, pc(_L('redukcia poškodenia')), (s, p, a, v) => { a.dr += v; }),
        N('jRegen', _L('Rýchle dobíjanie'), 3, 1, 20, pc(_L('obnova štítu')), (s, p, a, v) => { a.regen += v; }),
        N('jThorn', _L('Tŕnistý trup'), 3, 2, 100, v => _T`zásah lode uvoľní impulz za ${v} % poškodenia lasera (0,5 s)`),
        N('jLast', _L('Posledná bašta'), 3, 2, 8, v => _T`+${v} % redukcia poškodenia pod 40 % trupu`)
      ],
      key: { id: 'kUnbroken', name: _L('Nezlomný'), text: _L('+10 % redukcia poškodenia. Každý zásah pohltený štítom vyšle novu za 300 % poškodenia lasera (najviac 2× za sekundu).') } },
    { id: 'inferno', name: _L('Peklo aury'), color: '#c29bff', desc: _L('Aura rastie so zbraňou: väčšia, silnejšia, spomaľuje a pulzuje.'),
      leg: { slot: 'drones', name: _L('Žiariace sondy') }, wish: ['laser', 'allDmg', 'shield', 'hull', 'area'], types: { weapon: 'heavy' },
      nodes: [
        N('jAura', _L('Zosilnená aura'), 5, 0, 12, pc(_L('poškodenie aury'))),
        N('jField', _L('Rozšírenie poľa'), 3, 0, 10, pc(_L('dosah aury'))),
        N('jHeavy', _L('Ťažké pole'), 3, 1, 10, v => _T`aura spomalí nepriateľov o ${v} %`),
        N('jMelt', _L('Taviaca aura'), 3, 1, 50, pc(_L('poškodenie aury asteroidom'))),
        N('jPulse', _L('Pulz'), 3, 2, 100, v => _T`každé 3 s aura pulzuje za ${v} % svojho DPS`),
        N('jAbsorb', _L('Absorpcia'), 3, 2, 1, v => _T`${v} % štítu/s za každého nepriateľa v aure (max 5)`)
      ],
      key: { id: 'kCorona', name: _L('Slnečná koruna'), text: _L('Aura má +60 % poškodenie, +25 % dosah a započítava tvoju šancu na kritický zásah.') } },
    { id: 'artillery', name: _L('Delostrelec'), color: '#ff9470', desc: _L('Ťažké rakety, rázové vlny, spomalenie a ohnivé zóny.'),
      leg: { slot: 'drones', name: _L('Pozorovacie sondy Delostrelca') }, wish: ['missile', 'laser', 'allDmg', 'area', 'atkSpd'], types: { secondary: 'plasma' },
      nodes: [
        N('jShell', _L('Ťažké náboje'), 5, 0, 8, pc(_L('Poškodenie rakiet')), (s, p, a, v) => { p.missile += v; }),
        N('jBeam', _L('Ťažký lúč'), 5, 0, 6, pc(_L('Poškodenie lasera')), (s, p, a, v) => { p.laser += v; }),
        N('jShock', _L('Rázová vlna'), 5, 1, 12, pc(_L('polomer výbuchu')), (s, p, a, v) => { s.missileRadius *= 1 + v / 100; }),
        N('jQuake', _L('Otrasy'), 3, 1, 15, v => _T`výbuchy spomalia o ${v} % na 2 s`),
        N('jCal', _L('Kaliber'), 3, 2, 20, pc(_L('poškodenie elitám a bossom')), (s, p, a, v) => { s.eliteDmg += v; }),
        N('jLoad', _L('Rýchle nabíjanie'), 3, 2, 8, v => _T`−${v} % nabíjanie rakiet`, (s, p, a, v) => { a.cdr += v; })
      ],
      key: { id: 'kHammer', name: _L('Kladivo'), text: _L('Výbuchy rakiet zanechajú 3 s ohnivú zónu, ktorá páli za 40 % poškodenia rakety za sekundu.') } }
  ],
  scavenger: [
    { id: 'prospector', name: _L('Prospektor'), color: '#c8a27c', desc: _L('Ťažba sa mení na poškodenie, asteroidy vybuchujú.'),
      leg: { slot: 'drones', name: _L('Prospektorské sondy') }, wish: ['allDmg', 'laser', 'yield', 'area', 'crit'], types: { drones: 'mining' },
      nodes: [
        N('sDrill', _L('Hĺbkové vrtáky'), 5, 0, 15, v => _T`+${v} % Výnos ťažby a ťažobná sila`, (s, p, a, v) => { p.yield += v; }),
        N('sTract', _L('Traktorové pole'), 3, 0, 30, pc(_L('dosah magnetu')), (s, p, a, v) => { s.magnet *= 1 + v / 100; }),
        N('sConv', _L('Kinetická konverzia'), 3, 1, 20, v => _T`${v} % bonusovej ťažobnej sily → Všetko poškodenie`),
        N('sCrush', _L('Drvič'), 3, 1, 3, v => _T`rozbitý asteroid: +${v} % poškodenie na 6 s (max 5×)`),
        N('sBoom', _L('Výbušná ruda'), 3, 2, 100, v => _T`rozbitý asteroid vybuchne za ${v} % poškodenia lasera`),
        N('sProfit', _L('Zisk'), 3, 2, 10, v => _T`+${v} % XP a rudy`, (s, p, a, v) => { s.xpMult += v / 100; })
      ],
      key: { id: 'kRush', name: _L('Zlatá horúčka'), text: _L('Každých 100 zozbieranej rudy spustí 10 s Zlatej horúčky: +40 % poškodenie a +20 % kadencia.') } },
    { id: 'hive', name: _L('Rojník'), color: '#7ee0a8', desc: _L('Silnejšie a početnejšie drony, ktoré vybuchujú a kriticky zasahujú.'),
      leg: { slot: 'drones', name: _L('Kráľovná roja') }, wish: ['laser', 'allDmg', 'crit', 'atkSpd', 'area'], types: { drones: 'assault' },
      nodes: [
        N('sCore', _L('Dronové jadrá'), 5, 0, 12, pc(_L('poškodenie dronov'))),
        N('sBay', _L('Rozšírená zátoka'), 2, 0, 1, v => _T`+${v} dron`),
        N('sSync', _L('Synchronizácia'), 3, 1, 15, pc(_L('kadencia dronov'))),
        N('sRep', _L('Opravné moduly'), 5, 1, 4, v => _T`+${v} % trup a štít`, (s, p, a, v) => { p.hull += v; p.shield += v; }),
        N('sDBlast', _L('Výbušné strely'), 3, 2, 30, v => _T`strely dronov vybuchnú za ${v} % poškodenia`),
        N('sDCrit', _L('Lovecké drony'), 3, 2, 5, v => _T`drony majú ${v} % šancu na kritický zásah`)
      ],
      key: { id: 'kHive', name: _L('Úľ'), text: _L('+2 drony. Všetky drony útočia na nepriateľov, prerážajú a používajú tvoju šancu na kritický zásah.') } },
    { id: 'magnate', name: _L('Magnát'), color: '#ffc94d', desc: _L('Ruda je štít aj zbraň. Bohatstvo zvyšuje poškodenie.'),
      leg: { slot: 'armor', name: _L('Zlatý krunier Magnáta') }, wish: ['allDmg', 'laser', 'shield', 'area', 'crit'], types: {},
      nodes: [
        N('sMatrix', _L('Štítová matica'), 5, 0, 8, pc(_L('štít')), (s, p, a, v) => { p.shield += v; }),
        N('sCollect', _L('Zberné pole'), 3, 0, 1, v => _T`každý kúsok rudy obnoví ${v} % štítu`),
        N('sInvest', _L('Investícia'), 5, 1, 2, v => _T`+${v} % poškodenie za 500 rudy v náklade (max 10×)`),
        N('sHaggle', _L('Vyjednávač'), 3, 1, 10, v => _T`−${v} % ceny na stanici, v dielni a pri resete`),
        N('sPatron', _L('Mecenáš'), 3, 2, 5, pc(_L('úhyb')), (s, p, a, v) => { s.dodge += v; }),
        N('sDiv', _L('Dividenda'), 3, 2, 15, pc(_L('šanca na výbavu')))
      ],
      key: { id: 'kOreShield', name: _L('Rudný štít'), text: _L('Každý kúsok rudy nabije preťaženie štítu o 1 % max. štítu (najviac 50 %). Kým máš preťaženie, dávaš +30 % poškodenie. Preťaženie pohltí zásah ako prvé a pomaly vyprcháva.') } }
  ],
  carrier: [
    { id: 'legion', name: _L('Légia'), color: '#ff9d6e', desc: _L('Veľa miniónov, rýchla stavba, koordinovaná paľba.'),
      leg: { slot: 'drones', name: _L('Kovadlina légie') }, wish: ['laser', 'allDmg', 'crit', 'atkSpd', 'area'], types: {},
      nodes: [
        N('cFab', _L('Výrobné linky'), 5, 0, 12, pc(_L('poškodenie miniónov'))),
        N('cBuild', _L('Rýchla montáž'), 3, 0, 10, pc(_L('šanca postaviť minióna'))),
        N('cHangar', _L('Rozšírený hangár'), 2, 1, 1, v => _T`+${v} max. miniónov`),
        N('cArmor', _L('Pancierovanie'), 3, 1, 20, pc(_L('životy miniónov'))),
        N('cCoord', _L('Koordinovaná paľba'), 3, 2, 15, pc(_L('kadencia miniónov'))),
        N('cLeader', _L('Vodca svorky'), 3, 2, 2, v => _T`+${v} % poškodenie lode za každého minióna`)
      ],
      key: { id: 'kArmy', name: _L('Armáda'), text: _L('+3 max. miniónov a každé zostrelenie postaví minióna.') } },
    { id: 'colossus', name: _L('Kolos'), color: '#ffcf6e', desc: _L('Odolní minióni s plošnými údermi. Kľúčový talent: jeden obrovský Kolos.'),
      leg: { slot: 'armor', name: _L('Srdce Kolosa') }, wish: ['laser', 'allDmg', 'hull', 'area', 'crit'], types: {},
      nodes: [
        N('cFrame', _L('Ťažký rám'), 5, 0, 15, pc(_L('životy miniónov'))),
        N('cHydr', _L('Hydraulika'), 5, 0, 10, pc(_L('poškodenie miniónov'))),
        N('cCrush', _L('Drviace údery'), 3, 1, 15, v => _T`zásahy miniónov spomalia o ${v} %`),
        N('cSkin', _L('Oceľová koža'), 3, 1, 3, pc(_L('redukcia poškodenia lode')), (s, p, a, v) => { a.dr += v; }),
        N('cSplash', _L('Rozmetanie'), 3, 2, 25, v => _T`strely miniónov zasiahnu okolie za ${v} %`),
        N('cSelfRep', _L('Samooprava'), 3, 2, 2, v => _T`minióni si opravia ${v} % životov za sekundu`)
      ],
      key: { id: 'kTitan', name: _L('Titán'), text: _L('Namiesto roja postavíš jediného Kolosa: 8× životy, 8× poškodenie, plošné údery (dosah 140). Nestarne a po zničení sa za 5 s postaví znova.') } },
    { id: 'sacrifice', name: _L('Obeta'), color: '#ff5f6d', desc: _L('Minióni žijú krátko a končia výbuchom.'),
      leg: { slot: 'drones', name: _L('Oltár recyklácie') }, wish: ['laser', 'allDmg', 'area', 'crit', 'hull'], types: {},
      nodes: [
        N('cCore', _L('Výbušné jadrá'), 5, 0, 40, v => _T`zničený minión vybuchne za ${v} % poškodenia lasera`),
        N('cShort', _L('Krátka životnosť'), 3, 0, 15, v => _T`+${v} % poškodenie miniónov, −${v} % životnosť`),
        N('cRecyc', _L('Recyklácia'), 3, 1, 2, v => _T`zničený minión obnoví ${v} % štítu`),
        N('cNecro', _L('Nekromant'), 3, 1, 10, pc(_L('šanca postaviť minióna'))),
        N('cChain', _L('Reťazová reakcia'), 3, 2, 15, v => _T`výbuch minióna má ${v} % šancu postaviť nového`),
        N('cDet', _L('Detonátor'), 3, 2, 50, v => _T`každých 8 s odpáli najstaršieho minióna za ${100 + v} % lasera`)
      ],
      key: { id: 'kAltar', name: _L('Obetný oltár'), text: _L('Minióni sa vrhajú na nepriateľov a pri náraze vybuchnú za 400 % poškodenia lasera. Šanca postaviť minióna ×2.') } }
  ]
};
const TNODE = {}, TBRANCH = {};
for (const cls in TREES) for (const B of TREES[cls]) {
  B.cls = cls; TBRANCH[cls + ':' + B.id] = B;
  for (const n of B.nodes) { n.B = B; TNODE[n.id] = n; }
  Object.assign(B.key, { B, key: true, max: 1 }); TNODE[B.key.id] = B.key;
  const L = { id: 'b_' + B.id, slot: B.leg.slot, cls, build: B.id, name: B.leg.name,
    power: _T`+2 ku všetkým talentom vetvy „${B.name}“, do ktorých máš aspoň 1 bod (najviac +${TAL_OVER} nad maximum).` };
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
