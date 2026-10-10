#!/usr/bin/env node
// Herná wiki: načíta hru v prehliadači (Playwright), vytiahne všetky dáta priamo z kódu hry
// (tools/wiki-extract.js) v slovenčine aj angličtine a zapíše statické stránky
// wiki/index.html (SK) a wiki/en.html (EN). Čísla sú teda vždy také, aké sú v hre.
// Použitie: npm run wiki
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const extract = require('./wiki-extract.js');

/* ---------- hand-written parts: builds and loot rules (SK / EN) ---------- */
const BUILDS = {
  sharp: { skills: ['railgun', 'timeloop'], legs: ['prism', 'chain', 'ricochet', 'lRail'],
    sk: 'Klasický laserový build. Zbieraj kritickú šancu a poškodenie lasera. Každý 4. výstrel je kritický a prerazí celý rad, preto sa stav tak, aby boli nepriatelia v línii.',
    en: 'The classic laser build. Stack crit chance and laser damage. Every 4th shot crits and pierces the whole line, so position yourself to keep enemies lined up.' },
  salvo: { skills: ['microm', 'timeloop'], legs: ['cluster', 'barrage', 'capacitor', 'gravwell'],
    sk: 'Rakety robia väčšinu poškodenia. Kľúčový talent a Kondenzátor Tesla dobíjajú salvy pri zostrelení, takže v hustých vlnách strieľaš takmer bez prestávky.',
    en: 'Missiles do most of the damage. The key talent and the Tesla Capacitor recharge salvos on kills, so in dense waves you fire almost non-stop.' },
  phantom: { skills: ['clone', 'timeloop'], legs: ['afterburner', 'wake', 'blinkcore', 'lClone'],
    sk: 'Neustále sa hýb a uhýbaj: každý úhyb vybuchne a na chvíľu zvýši poškodenie. Rýchlosť z trysiek a afixov sa cez Rýchlostné jadro mení na poškodenie.',
    en: 'Keep moving and dodging: every dodge explodes and briefly boosts damage. Speed from engines and affixes turns into damage through the Speed Core.' },
  fortress: { skills: ['ram', 'eruption'], legs: ['nova', 'thorns', 'bulwark', 'reflect'],
    sk: 'Tank, ktorý vracia údery. Trup, štíty a redukcia poškodenia; každý zásah pohltený štítom vyšle novu. Leť priamo do stredu vĺn.',
    en: 'A tank that hits back. Hull, shields and damage reduction; every hit absorbed by the shield releases a nova. Fly straight into the middle of the waves.' },
  inferno: { skills: ['eruption', 'gravwell'], legs: ['auraBurst', 'lErupt', 'lWell', 'vampiric'],
    sk: 'Aura robí poškodenie za teba. Gravitačná studňa stiahne nepriateľov do aury a Erupcia ich dorazí.',
    en: 'Your aura does the work. Gravity Well pulls enemies into it and Aura Eruption finishes them.' },
  artillery: { skills: ['orbital', 'gravwell'], legs: ['cluster', 'gravwell', 'capacitor', 'barrage'],
    sk: 'Plazmové delo a ohnivé zóny. Strieľaj do zhlukov, Gravitačná studňa ich udrží v ohni.',
    en: 'Plasma cannon and fire zones. Shoot into clusters; Gravity Well keeps them burning.' },
  prospector: { skills: ['hurl', 'orewave'], legs: ['magnetar', 'oreArmor', 'lHurl', 'wake'],
    sk: 'Ťaž a bojuj naraz: rozbité asteroidy vybuchujú a Zlatá horúčka dáva +40 % poškodenie. Auto-ťažba sa tu oplatí.',
    en: 'Mine and fight at once: broken asteroids explode and Gold Rush gives +40 % damage. Auto-mining pays off here.' },
  hive: { skills: ['dstorm', 'mines'], legs: ['swarmlord', 'kamikaze', 'lMines'],
    sk: 'Drony útočia samy a kriticky zasahujú. Dronová búrka zdvojnásobí ich kadenciu, Pán roja pridá ďalšie 2 drony.',
    en: 'Drones attack on their own and crit. Drone Storm doubles their fire rate; Swarm Lord adds 2 more drones.' },
  magnate: { skills: ['orewave', 'mines'], legs: ['magnetar', 'oreArmor', 'vampiric', 'nova'],
    sk: 'Nos veľa rudy: preťaženie štítu z rudy a Investícia zvyšujú poškodenie. Pri smrti však stratíš 15 % nesenej rudy.',
    en: 'Carry lots of ore: the ore shield overcharge and Investment raise damage. But dying costs 15 % of the ore you carry.' },
  legion: { skills: ['order', 'emergency'], legs: ['lOrder', 'stasis', 'bulwark'],
    sk: 'Čím viac miniónov, tým silnejšia loď (Vodca svorky). Kľúčový talent postaví minióna z každého zostrelenia.',
    en: 'The more minions, the stronger the ship (Pack Leader). The key talent builds a minion from every kill.' },
  colossus: { skills: ['order', 'ring'], legs: ['lOrder', 'stasis', 'bulwark'],
    sk: 'Jeden obrovský Kolos s plošnými údermi, ktorý sa po zničení postaví znova. Ochranný prstenec chráni loď. Bezpečný, pomalší štýl.',
    en: 'One huge Colossus with area strikes that rebuilds itself after dying. Protective Ring guards the ship. A safe, slower style.' },
  sacrifice: { skills: ['detonate', 'emergency'], legs: ['lDeton', 'capacitor', 'stasis'],
    sk: 'Minióni sú živé bomby. Detonácia a Fénixova linka ich odpália a hneď postavia znova, Núdzová výroba dodá ďalších.',
    en: 'Minions are living bombs. Detonate and Phoenix Line blow them up and rebuild them at once; Emergency Production adds more.' }
};

const UI = {
  sk: { title: 'Void Harvest Wiki', sub: 'Mechaniky, lode, buildy, predmety, nepriatelia a kde čo padá. Čísla sú vygenerované priamo z hry.', play: 'Hrať hru', other: 'English', otherHref: 'en.html',
    search: 'Hľadať v wiki… (napr. Railgun, kľúč, mýtický)', none: 'Nič sa nenašlo.', gen: 'Vygenerované z verzie hry', toc: 'Obsah', top: 'Hore' },
  en: { title: 'Void Harvest Wiki', sub: 'Mechanics, ships, builds, items, enemies and where everything drops. Numbers are generated straight from the game.', play: 'Play the game', other: 'Slovenčina', otherHref: 'index.html',
    search: 'Search the wiki… (e.g. Railgun, key, mythic)', none: 'Nothing found.', gen: 'Generated from game version', toc: 'Contents', top: 'Top' }
};

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function render(d, lang, version) {
  const L = (sk, en) => lang === 'sk' ? sk : en, U = UI[lang];
  const dec = v => String(v).replace('.', lang === 'sk' ? ',' : '.');
  const pc = v => dec(Math.round(v * 1000) / 10) + ' %';
  const x = v => '×' + dec(v);
  const tbl = (head, rows, cls) => `<div class="tw"><table class="${cls || ''}${head.length > 3 ? ' wide' : ''}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr data-s>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const dot = (c, t) => `<span class="dot" style="--c:${c}"></span>${esc(t)}`;
  const UP = f => Math.round(f * 0.75) % f;   // sprite frame facing up
  const spr = (key, px, cols, f, size, bank) => {
    const i = UP(f) + (bank ? f : 0), s = size / px;
    return `<span class="spr" style="width:${size}px;height:${size}px;background-image:url(../assets/sprites/${key}.webp);background-size:${cols * px * s}px auto;background-position:-${(i % cols) * px * s}px -${Math.floor(i / cols) * px * s}px"></span>`;
  };
  const SPR_EN = new Set(['drone', 'fighter', 'gunship', 'sniper', 'charger', 'splitter', 'minelayer', 'healer', 'shieldbearer', 'stalker', 'goblin']);
  const legById = Object.fromEntries(d.legends.map(l => [l.id, l]));
  const sec = [];   // [id, title, html]
  const add = (id, title, html) => sec.push([id, title, html]);

  /* ----- overview ----- */
  add('prehlad', L('Prehľad', 'Overview'), `
    <p class="lead">${L('Void Harvest je 2D vesmírna strieľačka s progresiou v štýle Diabla. Letíš jednou zo štyroch lodí, ťažíš asteroidy, bojuješ v šiestich sektoroch, zbieraš predmety s raritami a afixmi, staviaš build z talentov a v bránach poráža bossov.',
      'Void Harvest is a 2D space shooter with Diablo-style progression. You fly one of four ships, mine asteroids, fight across six sectors, collect items with rarities and affixes, build your ship from talents and beat bosses in gates.')}</p>
    <div class="grid3">
      <div class="card"><h4>${L('Prvé kroky', 'First steps')}</h4><ol>
        <li>${L('Vyber loď v hangári. Každá má vlastné schopnosti, úhyb a strom talentov.', 'Pick a ship in the hangar. Each has its own skills, dodge and talent tree.')}</li>
        <li>${L('Prejdi tutoriál: ťažba, boj, talent, výbava, stanica, vylepšenie, brána.', 'Follow the tutorial: mining, combat, talent, gear, station, upgrade, gate.')}</li>
        <li>${L('Modrý kruh okolo majáka je bezpečná zóna. Čím ďalej od majáka, tým silnejší nepriatelia (Hlbina I–III).', 'The blue circle around the beacon is a safe zone. The further from the beacon, the stronger the enemies (Depth I–III).')}</li>
        <li>${L('Brány (G na minimape) vedú k bossom. Boss pustí kľúč do nočnej brány a niektorí bossovia odomknú vyšší svet.', 'Gates (G on the minimap) lead to bosses. Bosses drop Nightmare Gate keys and some of them unlock a higher world tier.')}</li>
      </ol></div>
      <div class="card"><h4>${L('Ovládanie', 'Controls')}</h4><dl class="kv">
        <dt>WASD</dt><dd>${L('pohyb', 'move')}</dd><dt>${L('Myš · LMB', 'Mouse · LMB')}</dt><dd>${L('mierenie, laser a ťažba', 'aim, laser and mining')}</dd>
        <dt>RMB</dt><dd>${L('rakety', 'missiles')}</dd><dt>Space</dt><dd>${L('úhyb', 'dodge')}</dd><dt>Q / Shift</dt><dd>${L('schopnosti', 'skills')}</dd>
        <dt>C</dt><dd>${L('skener', 'scanner')}</dd><dt>F / R</dt><dd>${L('auto-boj / auto-ťažba', 'auto-combat / auto-mining')}</dd>
        <dt>I · K · P · M · J</dt><dd>${L('inventár · talenty · paragon · mapa · denník', 'inventory · talents · paragon · map · journal')}</dd><dt>E</dt><dd>${L('stanica, brána, portál', 'station, gate, portal')}</dd></dl>
        <p class="note">${L('Hra podporuje aj dotyk (telefón na šírku) a gamepad.', 'The game also supports touch (phone in landscape) and gamepads.')}</p></div>
      <div class="card"><h4>${L('Dôležité pravidlá', 'Key rules')}</h4><ul>
        <li>${L(`Maximálna úroveň je ${d.levelCap}, potom pokračuje Paragon.`, `The level cap is ${d.levelCap}; Paragon continues after that.`)}</li>
        <li>${L('Pri smrti stratíš 15 % nesenej rudy a loď sa opraví na stanici Haven.', 'Dying costs 15 % of the ore you carry; the ship is repaired at Haven Station.')}</li>
        <li>${L('Sklad, materiály, základňa, úspechy a sezóna sú spoločné pre všetky lode.', 'Stash, materials, home base, achievements and the season are shared by all ships.')}</li>
        <li>${L('Systémy sa odomykajú postupne: Dielňa 5, Základňa 8, Sezóna 10, Výzvy 12 (podľa najvyššej úrovne účtu).', 'Systems unlock gradually: Workshop 5, Base 8, Season 10, Challenges 12 (by your best account level).')}</li>
      </ul></div>
    </div>`);

  /* ----- ships ----- */
  add('lode', L('Lode', 'Ships'), d.ships.map(s => `
    <article class="ship" data-s style="--sc:${s.color}" id="lod-${s.k}">
      <aside class="infobox"><div class="ib-img">${spr('ship_' + s.k, 128, 16, 48, 120, true)}</div>
        <h3>${esc(s.name)}</h3><p class="role">${esc(s.role)}</p>
        <dl class="kv">
          <dt>${L('Trup', 'Hull')}</dt><dd>${s.stats.hull}</dd><dt>${L('Štít', 'Shield')}</dt><dd>${s.stats.shield}</dd>
          <dt>${L('Rýchlosť', 'Speed')}</dt><dd>${s.stats.speed}</dd><dt>${L('Kritická šanca', 'Crit chance')}</dt><dd>${s.stats.crit} %</dd>
          <dt>${L('Úhyb', 'Dodge')}</dt><dd>${s.stats.dodge} %</dd><dt>${L('Magnet', 'Magnet')}</dt><dd>${s.stats.magnet}</dd>
          <dt>${L('Kadencia', 'Fire rate')}</dt><dd>${x(s.stats.fireMult)}</dd></dl>
        <h5>${L('Štartovná výbava', 'Starting gear')}</h5><ul class="small">${s.start.map(([sl, n]) => `<li>${esc(sl)}: <b>${esc(n)}</b></li>`).join('')}</ul></aside>
      <div class="ship-body"><p>${esc(s.desc)}</p><ul class="perks">${s.perks.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        <h4>${L('Úhyb (Space)', 'Dodge (Space)')}: ${esc(s.dodge.name)}</h4><p>${esc(s.dodge.desc)} <span class="muted">CD ${dec(s.dodge.cd)} s${s.dodge.charges > 1 ? L(` · ${s.dodge.charges} nabitia`, ` · ${s.dodge.charges} charges`) : ''}</span></p>
        <h4>${L('Schopnosti (Q / Shift)', 'Skills (Q / Shift)')}</h4>
        ${tbl([L('Schopnosť', 'Skill'), L('Úroveň', 'Level'), 'CD', L('Efekt', 'Effect'), L('Modifikátory (2. rank)', 'Modifiers (rank 2)')],
          s.skills.map(k => [`<b>${esc(k.name)}</b>`, k.lvl, `<span class="nw">${dec(k.cd)} s</span>`, esc(k.desc), k.mods.map(([n, t]) => `<b>${esc(n)}</b>: ${esc(t)}`).join('<br>')]))}
      </div></article>`).join('') + `
    <div class="card note-card"><h4>${L('Body schopností', 'Skill points')}</h4><p>${L(
      '1 bod za každých 5 úrovní (najviac 10). 1. rank: −15 % cooldown a +25 % poškodenie schopnosti. 2. rank: vyberieš jeden z dvoch modifikátorov. Úhyb má vlastné modifikátory:',
      '1 point every 5 levels (up to 10). Rank 1: −15 % cooldown and +25 % skill damage. Rank 2: pick one of two modifiers. The dodge has its own modifiers:')}
      ${d.dodgeMods.map(([n, t]) => `<b>${esc(n)}</b> – ${esc(t)}`).join(' · ')}</p></div>`);

  /* ----- builds ----- */
  add('buildy', L('Talenty a buildy', 'Talents and builds'), `
    <p>${L(`Každá loď má 3 vetvy talentov. Dostaneš 1 bod za úroveň. Druhý stupeň vetvy sa odomkne po ${d.talentReq.tiers[1]} bodoch vo vetve, tretí po ${d.talentReq.tiers[2]}, kľúčový talent po ${d.talentReq.key} (len jeden na loď). Ranky z výbavy môžu ísť najviac +${d.talentReq.over} nad maximum. Reset talentov je do úrovne 10 zadarmo.`,
      `Each ship has 3 talent branches. You get 1 point per level. The branch's second tier unlocks after ${d.talentReq.tiers[1]} points in it, the third after ${d.talentReq.tiers[2]}, the key talent after ${d.talentReq.key} (only one per ship). Ranks from gear can go at most +${d.talentReq.over} above the maximum. Talent reset is free up to level 10.`)}</p>
    <p>${L('Každá vetva je zároveň build: má vlastný 4-dielny set, legendárku „+2 ku talentom vetvy“ a odporúčané afixy, podľa ktorých hra radí pri predmetoch.', 'Each branch is also a build: it has its own 4-piece set, a “+2 to branch talents” legendary and recommended affixes the game uses for item advice.')}</p>
    ${d.ships.map(s => `<h3 class="shiph" style="--sc:${s.color}">${spr('ship_' + s.k, 128, 16, 48, 40, true)}${esc(s.name)}</h3><div class="builds">${s.trees.map(B => { const R = BUILDS[B.id] || { skills: [], legs: [] };
      return `<article class="build card" data-s style="--bc:${B.color}"><h4>${esc(B.name)}</h4><p class="muted">${esc(B.desc)}</p>
        <p>${esc(R[lang] || '')}</p>
        <dl class="kv"><dt>${L('Kľúčový talent', 'Key talent')}</dt><dd><b>${esc(B.key.name)}</b> – ${esc(B.key.text)}</dd>
          <dt>${L('Schopnosti', 'Skills')}</dt><dd>${R.skills.map(id => esc((s.skills.find(k => k.id === id) || {}).name || id)).join(' + ')}</dd>
          ${B.types.length ? `<dt>${L('Typ výbavy', 'Gear type')}</dt><dd>${B.types.map(esc).join(', ')}</dd>` : ''}
          <dt>${L('Afixy', 'Affixes')}</dt><dd>${B.wish.map(esc).join(' › ')}</dd>
          <dt>${L('Set', 'Set')}</dt><dd><b>${esc(B.set.name)}</b> (4): ${esc(B.set.t4)}</dd>
          <dt>${L('Legendárky', 'Legendaries')}</dt><dd><b>${esc(B.leg.name)}</b> (${esc(B.leg.slot)})${R.legs.map(id => legById[id] ? ', ' + esc(legById[id].name) : '').join('')}</dd></dl>
        <details><summary>${L('Talenty vetvy', 'Branch talents')}</summary><ul class="small">${B.nodes.map(n => `<li><b>${esc(n.name)}</b> (${n.max}) – ${esc(n.txt)} ${L('za bod', 'per point')}</li>`).join('')}</ul></details></article>`; }).join('')}</div>`).join('')}`);

  /* ----- items ----- */
  add('predmety', L('Predmety', 'Items'), `
    <h3>${L('Rarity', 'Rarities')}</h3>
    ${tbl([L('Rarita', 'Rarity'), L('Značka', 'Mark'), L('Afixy', 'Affixes'), L('Základné hodnoty', 'Base values'), L('Rozobranie (iLvl 1 / 30)', 'Salvage (iLvl 1 / 30)')],
      d.rarity.map(r => { const sv = d.salvage.find(s => s[0] === r.name); return [dot(r.color, r.name), `<span style="color:${r.color}">${r.mark || '—'}</span>`, r.affixes[0] === r.affixes[1] ? r.affixes[0] : r.affixes.join('–'), x(r.mult), sv ? `${sv[2]} / ${sv[3]} ${L('rudy', 'ore')}` : '—']; }))}
    <div class="grid2">
      <div class="card"><h4>${L('Úroveň predmetu (iLvl)', 'Item level (iLvl)')}</h4><p>${L('iLvl = úroveň nepriateľa, ktorý predmet pustil (tvoja úroveň + svet + hĺbka). Každý iLvl pridá afixom +5 % (plošné poškodenie a výnos ťažby +1,2 %).', 'iLvl = the level of the enemy that dropped it (your level + world tier + depth). Each iLvl adds +5 % to affixes (area damage and mining yield +1.2 %).')}</p></div>
      <div class="card"><h4>${L('Pradávne, väčšie afixy, prvotné', 'Ancestral, greater affixes, primal')}</h4><p>${L('<b>Pradávny</b> predmet (zlatý roh) má všetky hodnoty +20 %. <b>Väčší afix ✦</b> má hodnotu ×1,5. <b>Prvotný</b> predmet je pradávny so všetkými hodmi na maxime. Mýtické predmety sú vždy pradávne, na maxime a majú 1 väčší afix.', 'An <b>Ancestral</b> item (gold corner) has every value +20 %. A <b>greater affix ✦</b> is worth ×1.5. A <b>Primal</b> item is Ancestral with every roll at maximum. Mythics are always Ancestral, maxed and carry 1 greater affix.')}</p></div>
      <div class="card"><h4>${L('Vylepšovanie', 'Upgrading')}</h4><p>${L(`Inventár → klik na nasadený slot: +1 až +${d.upgrade.max} za rudu (+10 % základných hodnôt za stupeň). V Dielni ďalej prekalenie do +${d.upgrade.temper} (ruda a úlomky) a legendárky, sety a mýty až do +${d.upgrade.mw}; stupne ${d.upgrade.mwHit.join(' a ')} posilnia náhodný afix ×1,25. Pri predmetoch nad iLvl 20 ceny rastú.`, `Inventory → click an equipped slot: +1 to +${d.upgrade.max} for ore (+10 % base values per step). The Workshop tempers further to +${d.upgrade.temper} (ore and shards) and Legendaries, sets and Mythics up to +${d.upgrade.mw}; steps ${d.upgrade.mwHit.join(' and ')} empower a random affix ×1.25. Prices rise for items above iLvl 20.`)}</p></div>
      <div class="card"><h4>${L('Dielňa', 'Workshop')}</h4><p>${L('Prekovanie: nový hod hodnoty alebo výmena afixu za iný (každé ďalšie je drahšie). Pätice pre drahokamy. Odtlačok: prenesie legendárnu schopnosť z kódexu na vzácny predmet. Sklad je spoločný pre všetky lode (120 miest).', 'Reforge: reroll a value or swap an affix for another (each one costs more). Sockets for gems. Imprint: puts a legendary power from your codex onto a rare item. The stash is shared by all ships (120 slots).')}</p></div>
    </div>
    <h3>${L('Sloty a typy výbavy', 'Slots and gear types')}</h3>
    ${tbl([L('Slot', 'Slot'), L('Typ', 'Type'), L('Základné hodnoty', 'Base stats')], d.slots.flatMap(sl => sl.types.map((t, i) => [i ? '' : `<b>${esc(sl.name)}</b>`, esc(t.name), t.stats.map(esc).join(' · ')])))}
    <h3>${L('Afixy', 'Affixes')}</h3>
    <p class="note">${L('Rozsahy hodnôt podľa iLvl a typu predmetu. Väčší afix ✦ ×1,5.', 'Value ranges by iLvl and item kind. Greater affix ✦ ×1.5.')}</p>
    ${tbl([L('Afix', 'Affix'), L('Sloty', 'Slots'), L('Vzácny iLvl 1', 'Rare iLvl 1'), L('Leg. iLvl 30', 'Leg. iLvl 30'), L('Leg. iLvl 60', 'Leg. iLvl 60'), L('Pradávny 60', 'Ancestral 60'), '✦ 60'],
      d.affixes.map(a => [`<b>${esc(a.name)}</b>`, esc(a.slots), a.r1.join('–'), a.r30.join('–'), a.r60.join('–'), a.r60a.join('–'), a.r60g.join('–')]))}
    <h3>${L('Drahokamy', 'Gems')}</h3>
    <p>${L(`Pätice: vzácny 1, legendárny/setový 2, mýtický 3. Kvality: ${d.gemQ.join(' → ')} (3 rovnaké sa zlúčia v Dielni na vyššiu).`, `Sockets: rare 1, legendary/set 2, mythic 3. Qualities: ${d.gemQ.join(' → ')} (merge 3 identical ones in the Workshop).`)}</p>
    ${tbl([L('Drahokam', 'Gem'), L('Bonus', 'Bonus'), d.gemQ.join(' / ')], d.gems.map(g => [dot(g.color, g.name), esc(g.label), g.vals.map(v => '+' + dec(v) + ' %').join(' / ')]))}`);

  /* ----- legendaries, sets, mythics ----- */
  const legRows = d.legends.filter(l => !l.build).map(l => [`<b>${esc(l.name)}</b>`, esc(l.slot), esc(l.cls || L('všetky', 'all')) + (l.skill ? `<br><span class="muted">${esc(l.skill)}</span>` : ''), esc(l.power), l.boss.length ? esc(l.boss.join(', ')) : '<span class="muted">—</span>']);
  add('legendarky', L('Legendárky, sety a mýty', 'Legendaries, sets and Mythics'), `
    <p>${L('Legendárka má jednu špeciálnu schopnosť. Po prvom nájdení sa uloží do kódexu (aj pri rozobratí) a v Dielni ju môžeš odtlačiť na vzácny predmet. Legendárky s menom schopnosti menia, ako schopnosť funguje.', 'A legendary has one special power. The first time you find it, it is saved to the codex (even when salvaged) and the Workshop can imprint it onto a rare item. Legendaries named after a skill change how that skill works.')}</p>
    ${tbl([L('Legendárka', 'Legendary'), L('Slot', 'Slot'), L('Loď', 'Ship'), L('Schopnosť', 'Power'), L('Lov u bossa', 'Boss target farm')], legRows)}
    <h3>${L('Legendárky buildov', 'Build legendaries')}</h3>
    ${tbl([L('Legendárka', 'Legendary'), L('Loď', 'Ship'), L('Vetva', 'Branch'), L('Slot', 'Slot')], d.legends.filter(l => l.build).map(l => [`<b>${esc(l.name)}</b>`, esc(l.cls), esc(l.build), esc(l.slot)]))}
    <p class="note">${L('Každá dáva +2 ku všetkým talentom svojej vetvy, do ktorých máš aspoň 1 bod.', 'Each gives +2 to every talent of its branch that has at least 1 point.')}</p>
    <h3>${L('Sety', 'Sets')}</h3>
    <p>${L('Každý set má 4 kusy (zbraň, štít, motor, reaktor). 2 kusy: +15 % všetko poškodenie a +1 ku talentom vetvy. 4 kusy:', 'Each set has 4 pieces (weapon, shield, engine, reactor). 2 pieces: +15 % all damage and +1 to the branch talents. 4 pieces:')}</p>
    ${tbl([L('Set', 'Set'), L('Loď', 'Ship'), L('4 kusy', '4 pieces')], d.ships.flatMap(s => s.trees.map(B => [`<b style="color:${B.color}">${esc(B.set.name)}</b>`, esc(s.name), esc(B.set.t4)])))}
    <h3>${L('Mýtické predmety', 'Mythic items')}</h3>
    ${tbl([L('Mýtus', 'Mythic'), L('Slot', 'Slot'), L('Schopnosť', 'Power'), L('Zdroj', 'Source')], d.mythics.map(m => [`<b style="color:#e14bff">${esc(m.name)}</b>`, esc(m.slot), esc(m.power), esc(m.source)]))}`);

  /* ----- drops ----- */
  const rtName = [L('Bežný nepriateľ', 'Common enemy'), L('Tvrdší nepriateľ, kryštál, kontajner', 'Tougher enemy, crystal, container'), L('Elita a boss', 'Elite and boss')];
  add('loot', L('Kde čo padá', 'Where things drop'), `
    <h3>${L('Šanca na raritu', 'Rarity odds')}</h3>
    ${tbl([L('Zdroj', 'Source'), L('Šanca na raritu (svet I)', 'Rarity odds (world I)')], d.rarityTables.map((t, i) => [`<b>${rtName[i]}</b>`, t.map(([n, c, v]) => `<span class="pill" style="--c:${c}">${esc(n)} ${dec(v)} %</span>`).join(' ')]))}
    <p class="note">${L(`Legendárky sa na vyšších svetoch násobia (${d.tiers.map(t => x(t.leg)).join(' / ')}). Pod úrovňou 5 legendárka nepadne (prvú dá prvý boss).`, `Legendaries are multiplied on higher world tiers (${d.tiers.map(t => x(t.leg)).join(' / ')}). Below level 5 no legendary drops (the first boss gives your first).`)}</p>
    ${tbl([L('Zdroj', 'Source'), L('Čo dáva', 'What it gives')], [
      [L('<b>Bežný nepriateľ</b>', '<b>Common enemy</b>'), L('Šanca na predmet podľa typu nepriateľa (10–40 %). Od úrovne 5 klesá o 6,5 % za úroveň, najviac na 35 % (úroveň 15+). 25 % šanca na rudu.', 'Item chance by enemy type (10–40 %). From level 5 it drops 6.5 % per level, down to 35 % (level 15+). 25 % chance of ore.')],
      [L('<b>Elita</b>', '<b>Elite</b>'), L('Vždy 1 predmet (tabuľka elít), 25 % druhý. Kľúč nočnej brány 12 % (v nočnej bráne 20 %). Od úrovne 15 úlomok mapy trezoru 8 %.', 'Always 1 item (elite table), 25 % a second one. Nightmare key 12 % (20 % inside a Nightmare Gate). From level 15 a vault map fragment 8 %.')],
      [L('<b>Letka</b> (každú minútu)', '<b>Squadron</b> (every minute)'), L('Skupina nepriateľov s elitným veliteľom. V Hlbine III od zóny 15 dvaja velitelia.', 'A group of enemies with an elite commander. In Depth III from zone 15, two commanders.')],
      [L('<b>Boss brány</b>', '<b>Gate boss</b>'), L('3 predmety (tabuľka elít), v nočnej bráne +1 za každých 8 úrovní kľúča (+2 s Hojnosťou). Legendárka 50 % (prvé víťazstvo 100 %), v 70 % z tabuľky bossa. Set: svet II 15 %, III–IV 25 % (+1 % za úroveň kľúča), v 60 % set bossa. Drahokam 60 %, úlomky, kľúč vždy. Mýtus bossa od sveta III alebo s kľúčom 10+.', '3 items (elite table), in a Nightmare Gate +1 per 8 key levels (+2 with Abundance). Legendary 50 % (first win 100 %), 70 % from the boss table. Set: world II 15 %, III–IV 25 % (+1 % per key level), 60 % the boss set. Gem 60 %, shards, always a key. The boss Mythic from world III or with a key 10+.')],
      [L('<b>Lovec</b> (pomenovaný nepriateľ, každé 2,5–4 min so šancou 70 %)', '<b>Hunter</b> (named enemy, every 2.5–4 min with a 70 % chance)'), L('Garantovaná legendárka, 2 predmety, drahokam, 3 úlomky, kľúč 60 %.', 'Guaranteed legendary, 2 items, a gem, 3 shards, key 60 %.')],
      [L('<b>Pašerák</b> (Trezor pašerákov)', '<b>Smuggler</b> (Smugglers’ Vault)'), L('Legendárka, 2 predmety, drahokam, 3 úlomky, od sveta II set 15 %. Uteká – chyť ho.', 'Legendary, 2 items, a gem, 3 shards, from world II a set 15 %. It runs – catch it.')],
      [L('<b>Truhlica</b>', '<b>Chest</b>'), L('Ruda, predmet (tvrdšia tabuľka), 35 % druhý (tabuľka elít), 25 % drahokam.', 'Ore, an item (tougher table), 35 % a second (elite table), 25 % a gem.')],
      [L('<b>Asteroidy</b>', '<b>Asteroids</b>'), L('Ruda a XP. Kryštál: 4 % drahokam. Žiarivý kryštál (lom Tessar): predmet, drahokam, 5 úlomkov a 3 % Oko Tessaru (svet III+). Každý zásah asteroidu má šancu 1 : 100 000 na Semeno Prázdnoty.', 'Ore and XP. Crystal: 4 % gem. Radiant crystal (Tessar Quarry): an item, a gem, 5 shards and 3 % Eye of Tessar (world III+). Every asteroid hit has a 1 in 100,000 chance of the Void Seed.')],
      [L('<b>Nočná brána v limite</b>', '<b>Nightmare Gate in time</b>'), L('Kľúč o úroveň vyšší (za polovicu limitu o dve), runa 25 % + 1 % za úroveň kľúča, vylepšenie rún.', 'A key one level higher (two within half the limit), a rune 25 % + 1 % per key level, rune upgrades.')],
      [L('<b>Materiály</b>', '<b>Materials</b>'), L('Železo a kryštál z asteroidov; plazma, temná hmota a exotická látka z nepriateľov podľa sektora (pozri Svet), exotická aj z bossov od sveta III. Tiež expedície a rafinéria.', 'Iron and crystal from asteroids; plasma, dark matter and exotic matter from enemies by sector (see World), exotic also from bosses from world III. Also expeditions and the refinery.')]
    ])}
    <h3>${L('Lov u bossov (target farm)', 'Boss target farming')}</h3>
    <p class="note">${L('Každý boss sektora má vlastnú tabuľku legendárok (+ legendárka a set podľa tvojej lode).', 'Each sector boss has its own legendary table (plus a legendary and set based on your ship).')}</p>
    ${tbl([L('Boss', 'Boss'), L('Sektor', 'Sector'), L('Legendárky', 'Legendaries'), L('Set (Interceptor · Juggernaut · Scavenger · Carrier)', 'Set (Interceptor · Juggernaut · Scavenger · Carrier)')],
      d.bossLoot.map(b => [`<b style="color:${b.color}">${esc(b.boss)}</b>`, esc(b.sector), b.legs.map(esc).join(', '), b.sets.map(esc).join(' · ')]))}`);

  /* ----- world ----- */
  add('svet', L('Svet', 'World'), `
    <h3>${L('Sektory', 'Sectors')}</h3>
    ${tbl([L('Sektor', 'Sector'), L('Úroveň', 'Level'), L('Nepriatelia', 'Enemies'), L('Boss', 'Boss'), L('Materiál', 'Material'), L('Hrozby', 'Hazards')],
      d.sectors.map(s => [`<b>${esc(s.name)}</b><br><span class="muted small">${esc(s.desc)}</span>`, `<span class="nw">${esc(s.range)}</span>`, s.enemies.map(([n, w]) => `${esc(n)} <span class="muted">${w}</span>`).join(', ') || '—', esc(s.boss) || '—', esc(s.mat) || '—', s.haz.map(esc).join(', ') || '—']))}
    <div class="grid2">
      <div class="card"><h4>${L('Hĺbka zóny', 'Zone depth')}</h4><p>${L(`Okolo majáka je bezpečná zóna. Od 900 m začína ${esc(d.depth[1])}, každých 500 m ďalšia (až ${esc(d.depth[3])}): nepriatelia +1 úroveň za stupeň a viac elít. Pod úrovňou 5 stretneš najviac ${esc(d.depth[1])}. Od zóny 15 je Hlbina II–III hustejšia a má viac elít.`, `There is a safe zone around the beacon. ${esc(d.depth[1])} starts at 900 m, the next every 500 m (up to ${esc(d.depth[3])}): enemies +1 level per step and more elites. Below level 5 you meet at most ${esc(d.depth[1])}. From zone 15 Depth II–III is denser with more elites.`)}</p></div>
      <div class="card"><h4>${L('Svetové udalosti', 'World events')}</h4><p>${d.events.map(e => `<b style="color:${e.color}">${esc(e.name)}</b> (${e.limit} s)`).join(' · ')}</p><p class="note">${L('Každých 80–130 s, od úrovne 5. Odmena: 3 predmety, ruda, XP, 35 % kľúč; vrak 25 % legendárka.', 'Every 80–130 s, from level 5. Reward: 3 items, ore, XP, 35 % a key; the wreck 25 % a legendary.')}</p></div>
    </div>
    <h3>${L('Svetové úrovne', 'World tiers')}</h3>
    ${tbl([L('Svet', 'Tier'), L('Nepriatelia', 'Enemies'), L('Životy / poškodenie', 'HP / damage'), 'XP', L('Legendárky', 'Legendaries'), L('Pradávne', 'Ancestral'), L('Väčšie afixy', 'Greater affixes'), L('Mýty', 'Mythics'), L('Od úrovne', 'From level')],
      d.tiers.map(t => [`<b>${esc(t.name)}</b>`, '+' + t.lvl, `${x(t.hp)} / ${x(t.dmg)}`, x(t.xp), x(t.leg), pc(t.anc), pc(t.ga), t.myth ? x(t.myth) : '—', t.req || '—']))}
    <p class="note">${L('Odomknutie: ', 'Unlocked by: ')}${d.tierUnlock.map(([t, b]) => `${esc(t)} – ${esc(b)}`).join(' · ')} · ${L('svet IV – Architekt Prázdnoty na svete III.', 'tier IV – the Void Architect on tier III.')}</p>
    <h3>${L('Nepriatelia', 'Enemies')}</h3>
    ${tbl(['', L('Nepriateľ', 'Enemy'), L('Životy', 'HP'), L('Rýchlosť', 'Speed'), L('Poškodenie', 'Damage'), 'XP', L('Šanca na predmet', 'Item chance')],
      d.enemies.map(e => [SPR_EN.has(e.k) ? spr('en_' + e.k, 96, 16, 48, 36) : `<span class="dot big" style="--c:${e.color}"></span>`, `<b style="color:${e.color}">${esc(e.name)}</b>`, e.hp, e.speed, e.dmg, e.xp, e.gear ? pc(e.gear) : '—']))}
    <p class="note">${L('Hodnoty na úrovni 1; životy a poškodenie rastú s úrovňou zóny a svetom. Elity majú 1–3 modifikátory: ', 'Values at level 1; HP and damage grow with zone level and world tier. Elites have 1–3 modifiers: ')}${d.eliteMods.map(([n, c]) => `<span style="color:${c}">${esc(n)}</span>`).join(', ')}.</p>
    <h3>${L('Bossovia', 'Bosses')}</h3>
    <div class="bosses">${d.bosses.map(b => `<div class="card boss" data-s style="--c:${b.color}">${spr('boss_' + b.k, 192, 16, 48, 72)}<div><b>${esc(b.name)}</b><span class="muted">${esc(b.lair)}${b.sector ? ' · ' + esc(b.sector) : ''}</span><span class="small">${L('Prisluhovači', 'Minions')}: ${esc(b.minion)}${b.mythic ? ` · ${L('mýtus', 'Mythic')}: <b style="color:#e14bff">${esc(b.mythic)}</b>` : ''}</span></div></div>`).join('')}</div>`);

  /* ----- endgame ----- */
  add('endgame', L('Endgame', 'Endgame'), `
    <h3>${L('Nočné brány', 'Nightmare Gates')}</h3>
    <p>${L(`Kľúč premení ľubovoľnú bránu na nočnú. Limit ${Math.floor(d.nmLimit / 60)}:00 – v limite dostaneš kľúč o úroveň vyšší, za polovicu o dve. Pri smrti kľúč stratíš. Každý kľúč má 1–3 hrozby a 1 bonus.`, `A key turns any gate into a Nightmare Gate. Limit ${Math.floor(d.nmLimit / 60)}:00 – in time you get a key one level higher, within half the limit two. Dying loses the key. Each key has 1–3 threats and 1 bonus.`)}</p>
    ${tbl([L('Úroveň kľúča', 'Key level'), L('Nepriatelia navyše', 'Extra enemy levels'), L('Životy', 'HP'), L('Poškodenie', 'Damage'), L('Predmety od bossa navyše', 'Extra boss items'), L('Legendárky', 'Legendaries')], d.nmScale.map(r => [r[0], '+' + r[1], x(r[2]), x(r[3]), '+' + r[4], '+' + r[5] + ' %']))}
    <div class="grid2"><div class="card"><h4>${L('Hrozby', 'Threats')}</h4><ul class="small">${d.nmMods.map(([n, t]) => `<li><b class="neg">${esc(n)}</b> – ${esc(t)}</li>`).join('')}</ul></div>
      <div class="card"><h4>${L('Bonusy', 'Bonuses')}</h4><ul class="small">${d.nmBonus.map(([n, t]) => `<li><b class="pos">${esc(n)}</b> – ${esc(t)}</li>`).join('')}</ul></div></div>
    <h3>${L('Režimy na stanici', 'Station modes')}</h3>
    <div class="grid2">${d.modes.filter(m => !/^Svetov|^World/.test(m.title)).map(m => `<div class="card" data-s><h4>${esc(m.title)}</h4><p>${esc(m.text)}</p></div>`).join('')}</div>
    <div class="grid2">
      <div class="card" data-s><h4>${L('Horda Prázdnoty', 'Void Horde')}</h4><p>${L('Požehnania', 'Boons')}: ${d.horde.boons.map(esc).join(' · ')}</p><p>${L('Zlorečenia', 'Banes')}: ${d.horde.banes.map(esc).join(' · ')}</p><p>${L('Poklady', 'Treasures')}: ${d.horde.chests.map(([n, s, c]) => `<b>${esc(n)}</b> (${c}) – ${esc(s)}`).join(' · ')}</p></div>
      <div class="card" data-s><h4>${L('Búrka Prázdnoty', 'Void Storm')}</h4><p>${L(`Od úrovne ${d.storm.req} sa každých ${d.storm.every / 60} min objaví na ${d.storm.dur / 60} min v niektorom sektore. Viac a silnejších nepriateľov, iskry Prázdnoty a prekliate truhlice (${d.storm.chest} iskier) a dar (${d.storm.gift}).`, `From level ${d.storm.req} it appears every ${d.storm.every / 60} min for ${d.storm.dur / 60} min in some sector. More and stronger enemies, void embers and cursed chests (${d.storm.chest} embers) and a gift (${d.storm.gift}).`)}</p></div>
      <div class="card" data-s><h4>${L('Pevnosti', 'Strongholds')}</h4><p>${L('Každý bojový sektor má obsadenú pevnosť (od úrovne 5). Priblíž sa a odraz 3 vlny a veliteľa. Oslobodená pevnosť je základňa s bezpečnou zónou.', 'Every combat sector has an occupied stronghold (from level 5). Get close and beat 3 waves and a commander. A freed stronghold becomes an outpost with a safe zone.')}</p></div>
      <div class="card" data-s><h4>${L('Svetový boss', 'World boss')}</h4><p>${L(`Hviezdožrút sa objaví každých ${d.wb.every / 60} min (ohlásenie vopred) a ostane ${d.wb.window / 60} min. Pustí 2 legendárky, 3 predmety, 2 drahokamy, 15 úlomkov, kľúč, od sveta II 50 % set, 30 % runu a šancu na mýtus.`, `The Star Devourer appears every ${d.wb.every / 60} min (announced in advance) and stays ${d.wb.window / 60} min. Drops 2 Legendaries, 3 items, 2 gems, 15 shards, a key, from tier II a 50 % set, a 30 % rune and a Mythic chance.`)}</p></div>
    </div>
    <h3>${L('Paragon a runy', 'Paragon and runes')}</h3>
    <p>${L(`Po úrovni ${d.levelCap} zbieraš paragonové body do štyroch konštelácií. Každá má 14 bodov: väčšina sú malé bonusy, 5. a 10. sú stredné a 14. je hviezda (veľký bonus). Do konštelácie vložíš hviezdnu runu; jej bonus sa zapne po ${d.runeOn} bodoch v konštelácii. Runy sa vylepšujú (max ${d.runeMax}) dokončením nočnej brány aspoň takej úrovne ako runa.`, `After level ${d.levelCap} you earn Paragon points in four constellations. Each has 14 points: most are small bonuses, the 5th and 10th are medium and the 14th is a star (big bonus). Socket a star rune into a constellation; its bonus turns on after ${d.runeOn} points there. Runes level up (max ${d.runeMax}) by finishing a Nightmare Gate at least as high as the rune.`)}</p>
    ${tbl([L('Konštelácia', 'Constellation'), L('Bod', 'Point'), L('Stredný', 'Medium'), L('Hviezda', 'Star')], d.para.map(p => [`<b style="color:${p.color}">${esc(p.name)}</b>`, esc(p.n), esc(p.m), `<b>${esc(p.s.name)}</b> – ${esc(p.s.text)}`]))}
    ${tbl([L('Runa', 'Rune'), L('Za úroveň', 'Per level'), L('Bonus konštelácie', 'Constellation bonus')], d.runes.map(r => [`<b style="color:${r.color}">${esc(r.name)}</b>`, esc(r.main), esc(r.bonus)]))}`);

  /* ----- base ----- */
  add('zakladna', L('Základňa a materiály', 'Home base and materials'), `
    <p>${L('Základňa pri stanici Haven je spoločná pre všetky lode a pracuje aj keď nehráš (najviac 8 h).', 'The home base next to Haven Station is shared by all ships and keeps working while you are away (up to 8 h).')}</p>
    ${tbl([L('Materiál', 'Material'), L('Odkiaľ', 'From')], d.mats.map(m => [`<span style="color:${m.color}">${m.icon}</span> <b>${esc(m.name)}</b>`, m.from.length ? L('nepriatelia: ', 'enemies: ') + m.from.map(esc).join(', ') : L('asteroidy', 'asteroids')]))}
    ${tbl([L('Modul', 'Module'), L('Čo robí', 'What it does'), L('Max. úroveň', 'Max level')], d.modules.map(([n, t, m]) => [`<b>${esc(n)}</b>`, esc(t), m]))}
    <div class="grid2">
      <div class="card"><h4>${L('Výskum (laboratórium)', 'Research (laboratory)')}</h4><ul class="small">${d.research.map(([n, a, b]) => `<li><b>${esc(n)}</b>: ${esc(a)} → ${esc(b)} (rank 3)</li>`).join('')}</ul></div>
      <div class="card"><h4>${L('Expedície, skleník, zlievareň', 'Expeditions, greenhouse, smelter')}</h4><ul class="small">
        ${d.expeditions.map(([n, m, t]) => `<li><b>${esc(n)}</b> (${m} min): ${esc(t)}</li>`).join('')}
        ${d.stims.map(([n, t, l]) => `<li><b>${esc(n)}</b> – ${esc(t)} <span class="muted">(${L('skleník', 'greenhouse')} ${l})</span></li>`).join('')}
        ${d.smelt.map(([n, c]) => `<li><b>${esc(n)}</b> – ${esc(c)}</li>`).join('')}</ul></div>
    </div>`);

  /* ----- exploration & story ----- */
  add('pribeh', L('Prieskum, príbeh a výzvy', 'Exploration, story and challenges'), `
    <div class="grid2">
      <div class="card"><h4>${L('Skener a majáky predkov', 'Scanner and ancestor beacons')}</h4><p>${L(`Skener (C) odhalí anomálie a majáky. ${d.beaconCount} majákov predkov dáva trvalé bonusy pre celý účet, napríklad: `, `The scanner (C) reveals anomalies and beacons. ${d.beaconCount} ancestor beacons give permanent account-wide bonuses, for example: `)}${d.beacons.map(esc).join(', ')}.</p>
        <p>${L('Hrozby sektorov: ', 'Sector hazards: ')}${d.haz.map(esc).join(', ')}.</p></div>
      <div class="card"><h4>${L('Kapitoly príbehu', 'Story chapters')}</h4><ol class="small">${d.chapters.map(c => `<li><b>${esc(c.title)}</b> <span class="muted">${L('úr.', 'lv.')} ${c.lvl} · ${esc(c.npc)}</span></li>`).join('')}</ol></div>
    </div>
    <h3>${L('Výzvy (úspechy)', 'Challenges (achievements)')}</h3>
    ${tbl([L('Výzva', 'Challenge'), L('Titul', 'Title'), L('Úlomky', 'Shards')], d.ach.map(a => [esc(a.desc), `„${esc(a.title)}“`, a.sh]))}
    <p class="note">${L('Sezóna trvá 28 dní: 30 stupňov po 100 bodoch, body za hranie a cestu sezóny, každá sezóna má vlastné pravidlo (búrka, elity, väčšie afixy alebo zlato).', 'A season lasts 28 days: 30 tiers of 100 points, points from playing and the season journey; each season has its own rule (storm, elites, greater affixes or gold).')}</p>`);

  /* ----- formulas ----- */
  add('vzorce', L('Vzorce a čísla', 'Formulas and numbers'), `
    ${tbl([L('Úroveň', 'Level'), L('XP na ďalšiu úroveň', 'XP to next level')], d.xp.map(([l, v]) => [l, v.toLocaleString(lang === 'sk' ? 'sk-SK' : 'en-US')]))}
    <ul>
      <li>${L('XP z nepriateľa: základ × (1 + 0,15 × (úroveň − 1)), elita ×3, minión ×0,4.', 'XP per enemy: base × (1 + 0.15 × (level − 1)), elite ×3, minion ×0.4.')}</li>
      <li>${L('Trup lode rastie o 7 % a štít o 5 % za úroveň pilota.', 'Ship hull grows 7 % and shield 5 % per pilot level.')}</li>
      <li>${L('Základné kritické poškodenie ×1,8.', 'Base critical damage ×1.8.')}</li>
      <li>${L('Súčin situačných bonusov k poškodeniu je najviac ×3,5.', 'The product of situational damage bonuses is capped at ×3.5.')}</li>
      <li>${L(`Paragon: ${d.paraNeed.map(([l, v]) => `${l} → ${v.toLocaleString('sk-SK')} XP`).join(', ')}.`, `Paragon: ${d.paraNeed.map(([l, v]) => `${l} → ${v.toLocaleString('en-US')} XP`).join(', ')}.`)}</li>
    </ul>`);

  /* ----- page ----- */
  const toc = sec.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${U.title}</title>
<meta name="description" content="${esc(U.sub)}">
<meta name="theme-color" content="#05080f">
<link rel="icon" type="image/png" href="../assets/icons/icon-32.png">
<link rel="stylesheet" href="../css/fonts.css">
<link rel="stylesheet" href="wiki.css">
</head>
<body>
<header class="hero"><div class="hero-in">
  <a class="logo" href="./${lang === 'sk' ? '' : 'en.html'}"><span>VOID</span> HARVEST <em>WIKI</em></a>
  <p>${esc(U.sub)}</p>
  <div class="hero-acts"><a class="btn primary" href="../">${U.play}</a><a class="btn" href="${U.otherHref}">${U.other}</a>
    <input id="q" type="search" placeholder="${esc(U.search)}" aria-label="${esc(U.search)}"></div>
</div></header>
<div class="wrap">
  <nav class="toc" aria-label="${U.toc}"><b>${U.toc}</b>${toc}</nav>
  <main>
    ${sec.map(([id, t, h]) => `<section id="${id}" class="sec"><h2>${esc(t)}</h2>${h}</section>`).join('\n')}
    <p id="none" hidden>${U.none}</p>
    <footer>${U.gen} ${esc(version)} · <a href="#top">${U.top}</a> · CC0 3D: Kenney, Quaternius, Majadroid</footer>
  </main>
</div>
<script>
'use strict';
// search: hides rows and cards that don't contain the text (diacritics ignored); sections without a hit hide too
const norm = s => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
const items = [...document.querySelectorAll('[data-s]')].map(el => [el, norm(el.textContent)]);
document.getElementById('q').addEventListener('input', e => {
  const q = norm(e.target.value.trim());
  for (const [el, t] of items) el.hidden = !!q && !t.includes(q);
  let any = false;
  for (const s of document.querySelectorAll('.sec')) { const hit = !q || norm(s.querySelector('h2').textContent).includes(q) || [...s.querySelectorAll('[data-s]')].some(el => !el.hidden); s.hidden = !hit; any = any || hit; }
  if (q) for (const s of document.querySelectorAll('.sec')) if (norm(s.querySelector('h2').textContent).includes(q)) s.querySelectorAll('[data-s]').forEach(el => { el.hidden = false; });
  document.getElementById('none').hidden = any;
});
// highlight the section in the table of contents
const links = Object.fromEntries([...document.querySelectorAll('.toc a')].map(a => [a.hash.slice(1), a]));
const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting && links[e.target.id]) { for (const a of Object.values(links)) a.classList.remove('on'); links[e.target.id].classList.add('on'); } }, { rootMargin: '-15% 0px -75% 0px' });
document.querySelectorAll('.sec').forEach(s => io.observe(s));
</script>
</body>
</html>
`;
}

(async () => {
  const b = await chromium.launch();
  const version = (() => { try { return require('child_process').execSync('git log -1 --format=%h·%cs', { cwd: root }).toString().trim(); } catch (e) { return ''; } })();
  fs.mkdirSync(path.join(root, 'wiki'), { recursive: true });
  for (const lang of ['sk', 'en']) {
    const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('file://' + path.join(root, 'index.html'));
    await pg.evaluate(l => { localStorage.clear(); localStorage.setItem('void-harvest-lang', l); }, lang);
    await pg.reload(); await pg.waitForTimeout(300);
    const d = await pg.evaluate(extract);
    if (errs.length) { console.log('CHYBY: ' + errs.join('\n')); process.exitCode = 1; }
    const file = path.join(root, 'wiki', lang === 'sk' ? 'index.html' : 'en.html');
    fs.writeFileSync(file, render(d, lang, version));
    console.log(`wiki/${path.basename(file)} · ${(fs.statSync(file).size / 1024).toFixed(0)} kB`);
    await pg.close();
  }
  await b.close();
})();
