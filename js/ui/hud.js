'use strict';
/* =====================================================================
   9. UI / INVENTORY STATE (DOM)
   ===================================================================== */
const ICONS = {
  weapon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h13"/><path d="M15 8.5 21 12l-6 3.5z"/><path d="M5 9v6"/></svg>',
  secondary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6l-9 9-6-6z"/><path d="M8 16l-4 4"/><path d="M6 12l-3 1 2 2"/><path d="M12 18l-1 3-2-2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2.5 20 7v10l-8 4.5L4 17V7z"/><path d="M12 7.5 16 10v4l-4 2.5L8 14v-4z"/></svg>',
  engine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l-1.5 8h-7z"/><path d="M9 14l3 7 3-7"/><path d="M10.5 14l1.5 3.5 1.5-3.5"/></svg>',
  reactor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/></svg>',
  drones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 9l4 3-4 3-4-3z"/><path d="M5 4l3 2-3 2-2-2z"/><path d="M19 4l2 2-2 2-3-2z"/><path d="M12 17l2 2-2 2-2-2z"/></svg>',
  armor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5l8-3 8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11z"/><path d="M4 10h16M12 2v20"/></svg>',
  any: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>'
};

function log(html) {
  const el = $('log'), d = document.createElement('div');
  d.innerHTML = html; el.appendChild(d);
  while (el.children.length > 6) el.removeChild(el.firstChild);
  setTimeout(() => d.classList.add('fade'), 6000);
  setTimeout(() => d.remove(), 6700);
}
let bannerT = null;
function banner(html) {
  const b = $('banner'); b.innerHTML = html; b.classList.add('show');
  clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), 2600);
}

function updateHUD() {
  const s = P.stats, S = curSector();
  $('bShield').style.width = (P.shield / s.maxShield * 100).toFixed(1) + '%';
  $('bHull').style.width = (Math.max(0, P.hull) / s.maxHull * 100).toFixed(1) + '%';
  $('bXp').style.width = (Math.min(1, P.xp / (P.level >= LEVEL_CAP ? paraNeed(P.para.lvl) : xpNeed(P.level))) * 100).toFixed(1) + '%';
  $('tShield').textContent = `${Math.round(Math.min(P.shield, s.maxShield))} / ${Math.round(s.maxShield)}${P.oshield >= 1 ? ' +' + Math.round(P.oshield) : ''}`;
  $('tHull').textContent = `${Math.round(clamp(P.hull, 0, s.maxHull))} / ${Math.round(s.maxHull)}`;
  $('hLevel').textContent = P.level;
  $('hLvlTag').textContent = P.para.lvl ? `P ${P.para.lvl}` : 'LVL';
  let zone, zc;
  if (G.dungeon && (G.dungeon.vault || G.dungeon.rush)) {
    const D = G.dungeon;
    zone = D.vault ? (D.state === 'over' ? 'Trezor zatvorený' : `Trezor · ${fmtTime(Math.max(0, VAULT_TIME - D.t))}`) : (D.state === 'over' ? `Aréna dokončená · ${fmtTime(D.t)}` : `Aréna · boss ${Math.min(6, D.idx + 1)}/6 · ${fmtTime(D.t)}`);
    zc = D.vault ? '#ffb000' : '#ffd36b'; $('hSector').textContent = D.vault ? 'Trezor pašerákov' : 'Aréna veliteľov';
  } else if (G.dungeon && G.dungeon.climb) {
    const D = G.dungeon;
    zone = D.state === 'over' ? `Výstup skončil · poschodie ${D.floor}` : `Výstup · poschodie ${D.floor} · ${fmtTime(Math.max(0, CLIMB_LIMIT - D.t))}`;
    zc = '#9a8cff'; $('hSector').textContent = 'Výstup do Prázdnoty';
  } else if (G.dungeon) {
    const D = G.dungeon, def = roomDef(D);
    zone = D.pinnacle ? 'Trhlina · vrcholný boss' : def.boss ? 'Brána · súboj s bossom' : `Brána · komnata ${D.room + 1}/${DUNGEON.rooms.length} · vlna ${Math.min(D.wave, def.waves)}/${def.waves}`;
    zc = BOSSES[D.boss].color;
    if (D.nm) {
      const left = NM_LIMIT - D.nm.t;
      zone = `Nočná brána ${D.nm.k} · ${left >= 0 ? fmtTime(left) : '+' + fmtTime(-left)} · komnata ${D.room + 1}/${DUNGEON.rooms.length}`;
      zc = left < 30 ? '#ff6b5a' : '#ff9a5a';
    }
    $('hSector').textContent = BOSSES[D.boss].lair;
  } else {
    zone = G.safe ? 'Bezpečná zóna' : 'Bojová zóna'; zc = G.safe ? '#5fd4ff' : '#ff6b5a';
    $('hSector').textContent = S.name;
  }
  $('hZone').textContent = zone;
  const NMd = G.dungeon && (G.dungeon.nm || (G.dungeon.wk && { mods: G.dungeon.wk, bonus: null }));
  const ev = G.event;
  $('evBox').hidden = !ev || !!G.boss;
  if (ev) {
    $('evBox').style.setProperty('--ec', ev.E.color);
    $('evName').textContent = ev.E.name;
    let obj, frac;
    if (ev.state === 'wait') { obj = `Leť k značke · ${Math.round(Math.sqrt(d2(P.x, P.y, ev.x, ev.y)))} m · zmizne o ${fmtTime(ev.wait)}`; frac = 0; }
    else {
      if (ev.type === 'meteor') obj = `Rozbité asteroidy roja ${ev.prog}/${ev.E.goal}`;
      else if (ev.type === 'invasion') obj = `Zostrelení votrelci ${ev.prog}/${ev.E.goal}`;
      else if (ev.type === 'convoy') obj = `Konvoj: trup ${Math.round(Math.max(0, ev.ship.hp) / ev.ship.maxHp * 100)} % · cesta ${Math.round(ev.prog * 100)} %`;
      else obj = `Hacknuté uzly ${ev.prog}/3 · drž sa v kruhu uzla`;
      obj += ` · ${fmtTime(Math.max(0, ev.t))}`;
      frac = ev.type === 'convoy' ? ev.prog : ev.prog / ev.E.goal;
    }
    $('evObj').textContent = obj; $('evBar').style.width = (clamp(frac, 0, 1) * 100).toFixed(1) + '%';
  }
  const tu = P.tut != null && P.tut < TUT.length ? TUT[P.tut] : null;
  $('hTut').hidden = !tu;
  if (tu) { const th = `<div>▸ ${tu.text} <b>${P.tutP || 0}/${tu.n}</b></div><small>${tu.hint} · úloha ${P.tut + 1}/${TUT.length}</small>`; if ($('hTut').innerHTML !== th) $('hTut').innerHTML = th; }
  if (G.dungeon && G.dungeon.climb) {
    const D = G.dungeon;
    $('evBox').hidden = false; $('evBox').style.setProperty('--ec', '#9a8cff'); $('evBox').style.top = G.boss ? '96px' : '';
    $('evName').textContent = `${D.weekly ? 'Týždenná výzva' : 'Výstup do Prázdnoty'} · poschodie ${D.floor}`;
    $('evObj').textContent = D.state === 'over' ? 'Koniec · odmeny pri lodi, portál domov' : D.guardian ? `Zabi Strážcu hlbiny · zostáva ${fmtTime(Math.max(0, CLIMB_LIMIT - D.t))}` : `Postup ${Math.floor(D.prog)}/${CLIMB_NEED} · zostáva ${fmtTime(Math.max(0, CLIMB_LIMIT - D.t))} · rekord ${climbBest()}`;
    $('evBar').style.width = (D.state === 'over' ? 100 : clamp(D.prog / CLIMB_NEED, 0, 1) * 100).toFixed(1) + '%';
  } else if (G.dungeon && G.dungeon.vault) {
    const D = G.dungeon;
    $('evBox').hidden = false; $('evBox').style.setProperty('--ec', '#ffb000'); $('evBox').style.top = '';
    $('evName').textContent = 'Trezor pašerákov';
    $('evObj').textContent = D.state === 'over' ? 'Zatvorené · portál domov' : `Truhlice ${D.chests} · pašeráci ${D.gobs} · zostáva ${fmtTime(Math.max(0, VAULT_TIME - D.t))}`;
    $('evBar').style.width = (clamp(1 - D.t / VAULT_TIME, 0, 1) * 100).toFixed(1) + '%';
  } else if (G.dungeon && G.dungeon.rush) {
    const D = G.dungeon, best = (ACC.rush || {})[P.cls];
    $('evBox').hidden = false; $('evBox').style.setProperty('--ec', '#ffd36b'); $('evBox').style.top = G.boss ? '96px' : '';
    $('evName').textContent = `Aréna veliteľov · ${Math.min(6, D.idx + (D.state === 'over' ? 0 : 1))}/6`;
    $('evObj').textContent = `Čas ${fmtTime(D.t)}${best ? ` · rekord ${fmtTime(best)}` : ''}${D.state === 'over' ? ' · hotovo' : ''}`;
    $('evBar').style.width = (D.idx / 6 * 100).toFixed(1) + '%';
  } else $('evBox').style.top = '';
  const W = G.wb, wbOn = W && (W.state === 'warn' || W.state === 'active');
  $('hWb').hidden = !wbOn;
  if (wbOn) $('hWb').textContent = `☄ ${BOSSES.devourer.name} · ${SECTORS[W.sec].name} · ${W.state === 'warn' ? 'príchod o ' + fmtTime(W.t) : 'odletí o ' + fmtTime(W.t)}`;
  const cts = P.contracts || [];
  $('hContracts').hidden = !cts.length;
  const chtml = cts.map(c => `<div class="${c.done ? 'done' : ''}">${c.done ? '✓' : '▸'} ${CONTRACTS[c.type].text(c)} <b>${c.prog}/${c.n}</b></div>`).join('');
  if ($('hContracts').innerHTML !== chtml) $('hContracts').innerHTML = chtml;
  $('hMods').hidden = !NMd;
  if (NMd) {
    const html = NMd.mods.map(m => `<span class="chip neg" title="${NM_MODS[m].desc}">${NM_MODS[m].name}</span>`).join('') + (NMd.bonus ? `<span class="chip pos" title="${NM_BONUS[NMd.bonus].desc}">${NM_BONUS[NMd.bonus].name}</span>` : '');
    if ($('hMods').innerHTML !== html) $('hMods').innerHTML = html;
  }
  $('hudTl').style.setProperty('--zc', zc);
  const dpt = depthAt(P.x, P.y);
  $('hThreat').textContent = dpt ? `${zoneLevel() + dpt} · ${DEPTH_NAME[dpt]}` : zoneLevel();
  $('hOre').textContent = P.ore;
  $('hKills').textContent = G.kills;
  $('hTime').textContent = fmtTime(G.time);
  $('abDps').textContent = fmtN(s.laserDps) + ' DPS';
  $('abMis').textContent = P.missileT > 0 ? P.missileT.toFixed(1) + ' s' : '✓';
  $('misCd').style.width = (P.missileT > 0 ? (1 - P.missileT / s.missileCd) * 100 : 100) + '%';
  $('abInvN').textContent = `${P.inv.length}/30`;
  $('abTalN').textContent = P.points ? `+${P.points}` : '';
  $('abPara').hidden = P.level < LEVEL_CAP && !P.para.lvl;
  $('abParaN').textContent = P.para.pts ? `+${P.para.pts}` : '';
  $('abPara').classList.toggle('alert', P.para.pts > 0);
  $('abTal').classList.toggle('alert', P.points > 0);
  $('abAutoS').textContent = G.autoFire ? 'ZAP' : 'VYP'; $('abAuto').classList.toggle('on', G.autoFire);
  $('abMineS').textContent = G.autoMine ? 'ZAP' : 'VYP'; $('abMine').classList.toggle('on', G.autoMine);
  $('abGfxS').textContent = GFX.q === 'high' ? 'vysoká' : GFX.q === 'mid' ? 'stredná' : 'nízka';
  const C = G.cheat;
  $('devTag').hidden = !(C.god || C.oneHit || C.unlock || C.mythBoost || C.speed !== 1);
  $('hTier').textContent = TIERS[G.tier].roman;
  $('hTitle').textContent = ACC.title || '';
  $('abAchN').textContent = `${Object.keys(ACC.ach).length}/${ACH.length}`;
  const hasDash = !!s.legend.phaseCut;
  $('abDash').hidden = !hasDash;
  if (hasDash) $('abDashS').textContent = P.dashCd > 0 ? P.dashCd.toFixed(1) + ' s' : '✓';
  $('abMin').hidden = !s.minion;
  if (s.minion) $('abMinS').textContent = s.minion.titan ? (minions.length ? 'Kolos' : `Kolos o ${Math.max(0, P.titanT).toFixed(1)} s`) : `${minions.length}/${s.minion.max}`;
  $('debug').hidden = !C.debug;
  if (C.debug) $('debug').textContent = `FPS ${Math.round(G.fps)} · ×${C.speed}\nnepriatelia ${enemies.length} · strely ${ebullets.length}\nasteroidy ${asteroids.length} · častice ${particles.length}\nloot ${pickups.length} · lasery ${bullets.length}\npos ${Math.round(P.x)}, ${Math.round(P.y)}\nzóna ${zoneLevel()} · ${G.dungeon ? 'brána ' + (G.dungeon.room + 1) + ' / ' + G.dungeon.state : G.sector}`;
  const it = G.interact;
  $('prompt').hidden = !it || !!G.panel || transitioning;
  if (it) { $('promptTxt').innerHTML = `${it.txt} <small>${it.sub}</small>`; $('prompt').style.setProperty('--pc', it.col); }
  const b = G.boss && !G.boss.dead ? G.boss : null;
  $('bossBar').hidden = !b;
  if (b) {
    $('bossBar').style.setProperty('--bc', b.B.color);
    $('bossName').textContent = b.B.name;
    $('bossLvl').textContent = `Úroveň ${b.lvl}${b.ph2 ? ' · fáza 2' : ''}`;
    $('bBoss').style.width = (Math.max(0, b.hp) / b.maxHp * 100).toFixed(1) + '%';
    $('bBossPh').hidden = !!b.arch || b.ph2;
  }
}

const PANELS = ['inv', 'tal', 'map', 'station', 'cheat', 'gate', 'craft', 'para', 'ach'];
function syncPanels() {
  const open = G ? G.panel : null;
  for (const p of PANELS) $(p).hidden = open !== p;
  if (G) G.paused = !!open;
  $('pauseTag').hidden = !open;
  input.fire = false; input.missile = false;
  hideTip();
  if (open === 'inv') renderInventory();
  if (open === 'tal') renderTalents();
  if (open === 'map') renderMap();
  if (open === 'station') renderStation();
  if (open === 'cheat') renderCheat();
  if (open === 'gate') renderGate();
  if (open === 'craft') renderCraft();
  if (open === 'para') renderPara();
  if (open === 'ach') renderAch();
}
function openPanel(name) {
  if (!G || G.mode !== 'play' || transitioning) return;
  G.panel = G.panel === name ? null : name;
  syncPanels();
}
function closePanels() { if (G) { G.panel = null; G.fromStation = false; syncPanels(); saveGame(); } }
