'use strict';
/* =====================================================================
   6. COMBAT / MINING
   ===================================================================== */
function addText(x, y, txt, color, size, life) {
  if (texts.length > 90) texts.shift();
  texts.push({ x: x + rand(-6, 6), y, txt, color, size: size || 12, life: life || 0.8, max: life || 0.8 });
}
function shards(x, y, color, n, spd) {
  if (GFX.q === 'low') n = Math.ceil(n / 2);
  for (let i = 0; i < n && particles.length < 1600; i++) {
    const a = rand(0, TAU), s = rand(0.3, 1) * spd;
    particles.push({ shard: true, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, a: rand(0, TAU), va: rand(-12, 12), len: rand(3, 8), life: rand(0.6, 1.1), max: 1.1, color, drag: 2 });
  }
}
function burst(x, y, color, n, spd, size, life) {
  if (GFX.q === 'low') n = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    if (particles.length > 1600) break;
    const a = rand(0, TAU), s = rand(0.25, 1) * spd;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.5, 1) * (life || 0.6), max: life || 0.6, size: rand(0.6, 1.2) * (size || 2), color, drag: 2.5 });
  }
}
function ring(x, y, color, r, life) { particles.push({ ring: true, x, y, r0: 4, r1: r, life: life || 0.45, max: life || 0.45, color }); }
function shake(v) { G.shake = Math.min(14, G.shake + v); }

function fireLaser() {
  const s = P.stats, ca = Math.cos(P.a), sa = Math.sin(P.a);
  const mx = P.x + ca * 20, my = P.y + sa * 20;
  const shots = s.legend.prism ? [[0, 1], [-0.15, 0.6], [0.15, 0.6]] : [[0, 1]];
  const heavy = P.equip.weapon.type === 'heavy', buff = dmgBuff(), tx = s.tx;
  const rhythm = !!tx.kRhythm && ++P.rhythm % 4 === 0;
  for (const [off, m] of shots) {
    const crit = rhythm || (P.forceCrit > 0 ? (P.forceCrit--, true) : Math.random() * 100 < s.crit);
    const a = P.a + off + rand(-0.025, 0.025);
    bullets.push({ x: mx, y: my, px: mx, py: my, vx: Math.cos(a) * 980 + P.vx * 0.3, vy: Math.sin(a) * 980 + P.vy * 0.3,
      dmg: s.laserHit * m * buff * (crit ? s.critMult : 1), crit, life: 0.72, w: heavy ? 3.6 : P.equip.weapon.type === 'rapid' ? 1.6 : 2.6,
      len: heavy ? 30 : P.equip.weapon.type === 'rapid' ? 22 : 12, core: heavy || crit, color: crit ? '#ffffff' : CLASSES[P.cls].color, bubble: G.bubble,
      pierce: rhythm ? 99 : (s.legend.ricochet ? 1 : 0) + (tx.iPierce || 0), keep: rhythm ? 1 : s.legend.ricochet ? 0.7 : 0.85,
      chain: !!s.legend.chain, arc: crit && tx.iArc ? tx.iArc / 100 : 0 });
  }
  if (s.legend.singularity && ++P.shotCount % 8 === 0)
    orbs.push({ x: mx, y: my, vx: ca * 340, vy: sa * 340, life: 2.4, tick: 0, dmg: s.laserHit * 1.5 * buff * mres('singularity'), bubble: G.bubble });
  particles.push({ x: mx, y: my, vx: P.vx, vy: P.vy, life: 0.06, max: 0.06, size: heavy ? 7 : 5, color: CLASSES[P.cls].color, drag: 0 });
}

function fireMissiles(forced, mult) {
  const s = P.stats;
  const mw = mouseWorld();
  let target = forced || null, best = 650 * 650;
  if (!target) for (const e of enemies) { if (e.shielded) continue; const dd = d2(e.x, e.y, mw.x, mw.y); if (dd < best) { best = dd; target = e; } }
  const plasma = !s.homing;
  for (let i = 0; i < s.missileCount; i++) {
    const spread = s.missileCount > 1 ? (i / (s.missileCount - 1) - 0.5) * 1.3 : 0;
    const a = P.a + spread;
    const crit = Math.random() * 100 < s.crit;
    missiles.push({ x: P.x + Math.cos(a) * 18, y: P.y + Math.sin(a) * 18, a, spd: plasma ? 520 : 260,
      vx: Math.cos(a) * (plasma ? 520 : 260), vy: Math.sin(a) * (plasma ? 520 : 260),
      dmg: s.missileHit * (crit ? s.critMult : 1) * (mult || 1) * dmgBuff(), crit, radius: s.missileRadius, homing: s.homing, target,
      life: plasma ? 1.6 : 3, trailT: 0, plasma, dead: false, bubble: G.bubble });
  }
  shake(plasma ? 3 : 1.5);
  if (s.legend.barrage && !mult) P.barrage = { t: 0.4, target };
}

function explodeMissile(m) {
  if (m.dead) return; m.dead = true;
  const R = m.radius, s = P.stats, tx = s.tx;
  G.dmgSrc = 'missile';
  for (const e of enemies) {
    if (e.dead) continue;
    const dd = Math.sqrt(d2(e.x, e.y, m.x, m.y));
    if (dd < R + e.r) {
      let dm = m.dmg * (1 - 0.4 * clamp(dd / R, 0, 1));
      if (tx.iHydra && (e.elite || e.isBoss)) dm *= 1 + tx.iHydra / 100;
      damageEnemy(e, dm, m.crit);
      if (tx.jQuake) applySlow(e, tx.jQuake, 2);
    }
  }
  G.dmgSrc = null;
  for (const a of asteroids) {
    if (a.dead) continue;
    const dd = Math.sqrt(d2(a.x, a.y, m.x, m.y));
    if (dd < R + a.r) damageAsteroid(a, m.dmg * 0.8 * s.miningPower, m.crit);
  }
  const col = m.plasma ? '#9ad8ff' : '#ffb35c';
  ring(m.x, m.y, col, R, 0.4);
  burst(m.x, m.y, col, m.plasma ? 40 : 24, R * 3.2, 3, 0.6);
  burst(m.x, m.y, '#fff3d6', 10, R * 1.5, 2, 0.3);
  shake(m.plasma ? 5 : 3);
  if (s.legend.cluster) {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + rand(-0.2, 0.2);
      bullets.push({ x: m.x, y: m.y, px: m.x, py: m.y, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, dmg: m.dmg * 0.35, crit: false, life: 0.4, w: 2, color: '#ff8a1f', bubble: m.bubble });
    }
  }
  if (tx.iShrap) for (let i = 0; i < tx.iShrap; i++) {
    const a = i / tx.iShrap * TAU + rand(-0.3, 0.3);
    bullets.push({ x: m.x, y: m.y, px: m.x, py: m.y, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600, dmg: m.dmg * 0.3, crit: false, life: 0.45, w: 2, color: '#ff9a4a', bubble: m.bubble, quietHit: true });
  }
  if (tx.kHammer) { fires.push({ x: m.x, y: m.y, r: R * 0.8, t: 3, tick: 0, dps: m.dmg * 0.4 }); if (fires.length > 30) fires.shift(); }
  if (s.legend.gravwell) {
    for (const e of enemies) {
      if (e.dead || e.isBoss || d2(e.x, e.y, m.x, m.y) > (R * 1.6) ** 2) continue;
      e.x += (m.x - e.x) * 0.35; e.y += (m.y - e.y) * 0.35; applySlow(e, 60, 1.6);
    }
    ring(m.x, m.y, '#9a8cff', R * 1.6, 0.5);
  }
  if (s.legend.broodheart) for (let i = 0; i < 2 && allies.length < 6; i++)
    allies.push({ x: m.x, y: m.y, vx: rand(-140, 140), vy: rand(-140, 140), life: 9, fireT: rand(0.2, 0.5), a: 0 });
  if (s.legend.auraBurst) P.auraBoostT = 4;
}

function damageEnemy(e, amt, crit, quiet, echo) {
  if (e.dead) return;
  if (e.shielded) { if (!e.shTxt || G.time - e.shTxt > 0.6) { addText(e.x, e.y - e.r - 14, 'IMÚNNY', '#e8e2ff', 12, 0.5); e.shTxt = G.time; } return; }
  if ((e.elite || e.isBoss) && P.stats.eliteDmg) amt *= 1 + P.stats.eliteDmg / 100;
  if (e.prot > G.time) amt *= 0.5;   // covered by a shield bearer
  e.lastHitT = G.time;
  if (e.esh > 0) {
    const a = Math.min(e.esh, amt); e.esh -= a; amt -= a;
    if (amt <= 0) { if (!quiet || crit) addText(e.x, e.y - e.r, fmtN(a), '#6fb8ff', 11, 0.5); return; }
  }
  if (G.cheat.oneHit) amt = Math.max(amt, e.hp);
  e.hp -= amt; e.flash = 0.08;
  const L = P.stats.legend;
  if (L.vampiric) P.shield = Math.min(P.stats.maxShield, P.shield + amt * 0.03);
  if (L.voidecho && !echo && Math.random() < 0.2 * mres('voidecho')) echoes.push({ e, amt, t: 0.35 });
  if (echo) addText(e.x, e.y - e.r - 10, fmtN(amt), '#e14bff', 13, 0.7);
  else if (!quiet || crit) addText(e.x, e.y - e.r, crit ? fmtN(amt) + '!' : fmtN(amt), crit ? '#ffe14d' : '#e6e9ef', crit ? 16 : 11);
  else {
    e.qAcc = (e.qAcc || 0) + amt;
    if (!e.qT || G.time - e.qT > 0.3 || e.hp <= 0) { addText(e.x, e.y - e.r, fmtN(e.qAcc), '#b48cff', 10, 0.5); e.qAcc = 0; e.qT = G.time; }
  }
  if (e.hp <= 0) killEnemy(e);
}

function damageAsteroid(a, amt, crit) {
  if (a.dead) return;
  if (G.cheat.oneHit) amt = Math.max(amt, a.hp);
  a.hp -= amt; a.flash = 0.06;
  if (crit) addText(a.x, a.y - a.r * 0.6, fmtN(amt) + '!', '#ffe14d', 12, 0.6);
  if (a.hp <= 0) breakAsteroid(a);
}

function dropPickup(kind, x, y, amount, item) {
  const a = rand(0, TAU), s = rand(40, 160);
  pickups.push({ kind, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, amount, item, t: 0, spin: rand(0, TAU), dead: false });
}
function dropXp(x, y, total) {
  const n = clamp(Math.ceil(total / 30), 1, 3);
  for (let i = 0; i < n; i++) dropPickup('xp', x, y, total / n);
}
function dropOre(x, y, total) {
  total = Math.max(1, Math.round(total * (nmHas('ore') ? 2 : 1) * ((P && P.stats.oreMult) || 1)));
  const n = clamp(Math.ceil(total / 3), 1, 8);
  let left = total;
  for (let i = 0; i < n; i++) { const amt = i === n - 1 ? left : Math.round(total / n); left -= amt; if (amt > 0) dropPickup('ore', x, y, amt); }
}
function dropItem(x, y, ilvl, tier) {
  const item = generateItem(ilvl, rollRarity(tier));
  dropPickup('item', x, y, 1, item);
  if (item.primal) { banner(`<span style="color:#ff5a5a">${item.name}</span><small>Prvotný predmet · všetky hody na maxime</small>`); ring(x, y, '#ff3b3b', 260, 1.1); }
  const ns = gaExtra(item), gn = gaN(item);
  if (ns >= 2 && !(ASV().auto && shouldSalvage(item))) {
    banner(`<span style="color:#ffd36b">${'✦'.repeat(gn)} ${item.name}</span><small>${gn} väčšie afixy · ${item.affixes.filter(a => a.greater).map(a => AFFIXES[a.key].label(a.val)).join(' · ')}</small>`);
    ring(x, y, '#ffd36b', ns >= 3 ? 320 : 200, ns >= 3 ? 1.3 : 0.9); if (ns >= 3) shake(6);
  } else if (item.rarity === 'legendary' && !item.primal && !(ASV().auto && shouldSalvage(item))) {
    banner(`<span style="color:${RARITY.legendary.color}">${item.name}</span><small>Legendárny predmet padol</small>`);
    ring(x, y, RARITY.legendary.color, 160, 0.9);
  }
}

function killEnemy(e) {
  if (e.dead) return; e.dead = true;
  G.kills++;
  if (P.stats.legend.capacitor) P.missileT = Math.max(0, P.missileT - 0.5);
  if (G.dmgSrc === 'missile' && P.stats.tx.kSalvo && Math.random() < 0.25) P.missileT = 0;
  const MN = P.stats.minion;
  if (MN && !MN.titan && (MN.army || Math.random() < MN.chance)) spawnMinion(e.x, e.y);
  if (!e.minion) contractTick('kill', { sec: G.dungeon ? G.dungeon.sector : G.sector });
  if (G.dungeon && G.dungeon.climb && G.dungeon.state === 'climb' && !e.minion && !e.isBoss) G.dungeon.prog += e.elite ? 6 : e.small ? 0.3 : 1;
  if (e.elite) contractTick('elite');
  if (e.ev && G.event && G.event.type === 'invasion' && G.event.state === 'active') G.event.prog++;
  burst(e.x, e.y, e.T.color, e.elite ? 50 : 26, e.elite ? 420 : 300, 2.6, 0.7);
  shards(e.x, e.y, e.T.color, e.elite ? 12 : 5, e.elite ? 380 : 260);
  if (e.elite || e.isBoss) G.hitStop = Math.max(G.hitStop || 0, e.isBoss ? 0.25 : 0.06);
  burst(e.x, e.y, '#ffe0c2', 10, 180, 2, 0.35);
  ring(e.x, e.y, e.T.color, e.r * 3.2, 0.35);
  shake(e.elite ? 7 : 2.2);
  const xp = e.T.xp * (1 + 0.15 * (e.lvl - 1)) * (e.elite ? 3 : 1) * (e.minion ? 0.4 : 1) * (e.small ? 0.3 : 1);
  dropXp(e.x, e.y, xp);
  if ((nmHas('volatile') || (e.mods && e.mods.includes('volatile'))) && !e.isBoss) hazards.push({ kind: 'blast', x: e.x, y: e.y, r: 70 + e.r * (e.mods ? 2 : 1), t: 0.7, t0: 0.7, dmg: (e.mods ? 16 : 9) * e.dmgM });
  if (e.type === 'splitter' && !e.small && !G.safe) for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + rand(-0.3, 0.3), m = spawnEnemy('splitter', e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20, e.lvl, false);
    m.small = true; m.r *= 0.55; m.maxHp *= 0.3; m.hp = m.maxHp; m.minion = e.minion; m.vx = Math.cos(a) * 260; m.vy = Math.sin(a) * 260;
  }
  if (e.isBoss) { onBossKilled(e); return; }
  if (e.minion) return;
  if (e.type === 'chest') {
    dropOre(e.x, e.y, (20 + e.lvl * 2) * P.stats.yieldMult);
    if (Math.random() < 0.25) dropGem(e.x, e.y, Math.random() < 0.2 ? 1 : 0);
    dropItem(e.x, e.y, e.lvl, 1); if (Math.random() < 0.35) dropItem(e.x, e.y, e.lvl, 2);
    if (G.dungeon && G.dungeon.vault) G.dungeon.chests++;
    return;
  }
  if (e.type === 'goblin') {
    dropPickup('item', e.x, e.y, 1, generateItem(e.lvl, 'legendary'));
    dropItem(e.x, e.y, e.lvl, 2); dropItem(e.x, e.y, e.lvl, 2);
    dropOre(e.x, e.y, (120 + e.lvl * 8) * P.stats.yieldMult); dropGem(e.x, e.y, 1); addShards(3);
    if (G.tier >= 2 && Math.random() < 0.15) dropSet(e.x, e.y, e.lvl);
    ring(e.x, e.y, '#ffb000', 160, 0.6);
    if (G.dungeon && G.dungeon.vault) G.dungeon.gobs++;
    return;
  }
  if (e.hunter) {
    const L = e.lvl;
    dropPickup('item', e.x, e.y, 1, generateItem(L, 'legendary'));
    dropItem(e.x, e.y, L, 2); dropItem(e.x, e.y, L, 2);
    dropOre(e.x, e.y, (40 + L * 6) * P.stats.yieldMult);
    if (Math.random() < 0.6) dropKey(e.x, e.y, keyBaseLevel() + 1);
    dropGem(e.x, e.y, 1); addShards(3);
    ring(e.x, e.y, '#ff8a5c', 260, 0.9);
    banner(`<span style="color:#ff8a5c">${e.hunter.name}</span><small>Lovec zlikvidovaný · garantovaný legendárny predmet</small>`);
    contractTick('hunter');
    return;
  }
  if (Math.random() < 0.25) dropOre(e.x, e.y, randi(1, 3) * P.stats.yieldMult);
  if (e.elite) {
    if (P.level >= 15 && !(G.dungeon && G.dungeon.vault) && Math.random() < 0.08) { P.vaultFrags = (P.vaultFrags || 0) + 1; addText(e.x, e.y - 30, 'ÚLOMOK MAPY', '#ffb000', 12, 1); log(`<span style="color:#ffb000">Úlomok mapy trezoru</span> (${P.vaultFrags}/5).`); }
    dropItem(e.x, e.y, e.lvl, 2);
    if (Math.random() < 0.5) dropItem(e.x, e.y, e.lvl, 1);
    log(`Elitný ${e.T.name} zničený.`);
    if (Math.random() < (G.dungeon && G.dungeon.nm ? 0.2 : 0.12)) dropKey(e.x, e.y, G.dungeon && G.dungeon.nm ? G.dungeon.nm.k : keyBaseLevel());
  } else if (Math.random() < e.T.gear * (e.small ? 0.3 : 1) * (nmHas('loot') ? 1.5 : 1) * (1 + (P.stats.tx.sDiv || 0) / 100)) {
    dropItem(e.x, e.y, e.lvl, e.T.tier);
  }
}

function breakAsteroid(a) {
  if (a.dead) return; a.dead = true;
  const S = AST_SIZE[a.size], K = a.K, s = P.stats;
  burst(a.x, a.y, K.stroke, 10 + a.size * 8, 120 + a.size * 50, 2.4, 0.8);
  if (K.vein) burst(a.x, a.y, K.vein, 8, 200, 1.8, 0.6);
  shake(a.size * 0.8);
  dropOre(a.x, a.y, S.ore * K.ore * s.yieldMult * (1 + 0.06 * (zoneLevel() - 1)) * (1 + 0.25 * (G.tier - 1)) * rand(0.8, 1.2));
  dropXp(a.x, a.y, S.xp * K.xp * (1 + 0.1 * (zoneLevel() - 1)));
  G.mined++;
  if (s.tx.sCrush) { P.rockStacks = Math.min(5, P.rockStacks + 1); P.rockT = 6; }
  if (s.tx.sBoom && !G.safe) splash(a.x, a.y, 90 + a.r, s.laserHit * s.tx.sBoom / 100 * dmgBuff(), null, '#c8a27c');
  if (s.legend.tessarEye && P.crystal < 3 + Math.floor((s.mres.tessarEye || 0) / 2)) P.crystal++;
  if (a.kind === 'crystal' && Math.random() < 0.04) dropGem(a.x, a.y, 0);
  contractTick('mine');
  if (a.ev && G.event && G.event.type === 'meteor' && G.event.state === 'active') { G.event.prog++; dropOre(a.x, a.y, 3 * s.yieldMult); }
  if (a.kind === 'radiant') {
    dropItem(a.x, a.y, zoneLevel() + 1, 2);
    dropGem(a.x, a.y, 1); addShards(5);
    if (mythTier() > 0 && Math.random() < LEGEND_INDEX.tessarEye.chance * mythTier() * mythMult()) dropMythic('tessarEye', a.x, a.y, zoneLevel() + 2);
    ring(a.x, a.y, '#e14bff', 160, 0.7);
    log('<span style="color:#e14bff">Žiarivý kryštál rozbitý.</span>');
  }
  if (Math.random() < (a.kind === 'crystal' ? 0.05 * a.size : 0.008 * a.size)) dropItem(a.x, a.y, zoneLevel(), a.kind === 'crystal' ? 1 : 0);
  if (a.size > 1) {
    for (let i = 0; i < 2; i++) {
      const ang = rand(0, TAU);
      const c = makeAsteroid(a.x + Math.cos(ang) * a.r * 0.4, a.y + Math.sin(ang) * a.r * 0.4, a.size - 1, a.kind === 'radiant' ? 'crystal' : a.kind);
      c.vx = a.vx + Math.cos(ang) * rand(40, 90); c.vy = a.vy + Math.sin(ang) * rand(40, 90);
      asteroids.push(c);
    }
  }
}

function hurtPlayer(amt) {
  if (G.safe || transitioning || G.mode !== 'play') return;
  if (G.cheat.god) { P.shieldFlash = 0.1; return; }
  if (P.dashT > 0) return;
  const s = P.stats;
  if (P.crystal > 0) { P.crystal--; addText(P.x, P.y - 24, 'KRYŠTÁL', '#e14bff', 12, 0.6); burst(P.x, P.y, '#e14bff', 14, 220, 2, 0.4); return; }
  if (Math.random() * 100 < s.dodge) { addText(P.x, P.y - 24, 'ÚHYB', '#9fe6ff', 12, 0.6); if (s.legend.blinkcore) P.forceCrit = 3; onDodge(); return; }
  if (P.stasisT > 0) return;
  const tx = s.tx;
  let red = s.dr || 0;
  if (s.legend.bulwark && Math.hypot(P.vx, P.vy) < 70) red += 20;
  if (tx.jLast && P.hull < s.maxHull * 0.4) red += tx.jLast;
  amt *= 1 - Math.min(60, red) / 100;
  if (s.legend.thorns && P.thornT <= 0) {
    P.thornT = 1;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; bullets.push({ x: P.x, y: P.y, px: P.x, py: P.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, dmg: s.laserHit * dmgBuff(), crit: false, life: 0.45, w: 2, color: '#c8a27c', bubble: G.bubble }); }
  }
  if (tx.jThorn && P.jThornT <= 0) { P.jThornT = 0.5; splash(P.x, P.y, 170, s.laserHit * tx.jThorn / 100 * dmgBuff(), null, '#7fb2ff'); }
  P.lastHit = G.time;
  if (P.oshield > 0) { const a = Math.min(P.oshield, amt); P.oshield -= a; amt -= a; P.shieldFlash = 0.2; if (amt <= 0) return; }
  const hadShield = P.shield > 0;
  let rem = amt;
  if (P.shield > 0) {
    const a = Math.min(P.shield, rem); P.shield -= a; rem -= a; P.shieldFlash = 0.2;
    if (tx.kUnbroken && a > 0 && P.unbrokenT <= 0) { P.unbrokenT = 0.5; splash(P.x, P.y, 210, s.laserHit * 3 * dmgBuff(), null, '#9fd0ff'); }
  }
  if (hadShield && P.shield <= 0 && s.legend.nova && P.novaT <= 0) triggerNova();
  if (rem > 0) {
    P.hull -= rem; P.hitFlash = 0.25; shake(4);
    if (G.dungeon) G.dungeon.hurt = true;
    if (rem > s.maxHull * 0.15) G.hitStop = Math.max(G.hitStop || 0, 0.05);
    addText(P.x, P.y - 22, '-' + fmtN(rem), '#ff6b5a', 13, 0.7);
    if (s.legend.stasis && P.stasisCd <= 0 && P.hull > 0 && P.hull < s.maxHull * 0.3) {
      P.stasisT = 3; P.stasisCd = 30; ring(P.x, P.y, '#ffd36b', 90, 0.5); addText(P.x, P.y - 36, 'STÁZA', '#ffd36b', 13, 1);
    }
  }
  if (P.hull <= 0) die();
}

function onDodge() {
  const s = P.stats, tx = s.tx;
  if (tx.iPhaseSh) P.shield = Math.min(s.maxShield, P.shield + s.maxShield * tx.iPhaseSh / 100);
  if (tx.kGhost) P.ghostT = 1;
  const pct = (tx.iDodgeBlast || 0) + (tx.kGhost ? 300 : 0);
  if (pct && P.dodgeBlastT <= 0) { P.dodgeBlastT = 0.25; splash(P.x, P.y, tx.kGhost ? 220 : 150, s.laserHit * pct / 100 * dmgBuff(), null, '#b48cff'); }
}
// area hit around a point; quiet numbers, never re-triggers area effects
function splash(x, y, r, dmg, skip, col) {
  if (G.safe && !G.dungeon && G.bubble) return;
  for (const o of enemies) if (!o.dead && o !== skip && d2(o.x, o.y, x, y) < (r + o.r) ** 2) damageEnemy(o, dmg, false, true);
  if (col) ring(x, y, col, r, 0.3);
}
function applySlow(e, pct, t) {
  const f = 1 - Math.min(70, pct) / 100;
  if (!(e.slowT > 0) || f < (e.slowF || 1)) e.slowF = f;
  e.slowT = Math.max(e.slowT || 0, t);
}
function triggerNova() {
  const s = P.stats, R = 280, dmg = s.maxShield * 1.5 * s.allMult;
  P.novaT = 8;
  for (const e of enemies) {
    const dd = Math.sqrt(d2(e.x, e.y, P.x, P.y));
    if (dd < R + e.r) { damageEnemy(e, dmg, false); if (!e.isBoss) { const k = 400 / Math.max(dd, 1); e.vx += (e.x - P.x) * k; e.vy += (e.y - P.y) * k; } }
  }
  for (const b of ebullets) if (d2(b.x, b.y, P.x, P.y) < R * R) b.dead = true;
  ring(P.x, P.y, '#ff8a1f', R, 0.6); ring(P.x, P.y, '#ffe0b0', R * 0.7, 0.4);
  burst(P.x, P.y, '#ff8a1f', 60, 600, 3, 0.6);
  shake(9);
  log('<span style="color:#ff8a1f">Aegis: reaktívna nova!</span>');
}

function gainXp(amt) {
  P.xp += amt * P.stats.xpMult * TIERS[G.tier].xp * (nmHas('xp') ? 1.75 : 1) * (nmK() ? 1 + nmK() * 0.03 : 1);
  for (;;) {
    if (P.level >= LEVEL_CAP) {
      const need = paraNeed(P.para.lvl);
      if (P.xp < need) break;
      P.xp -= need; P.para.lvl++; P.para.pts++;
      ring(P.x, P.y, '#e8e2ff', 240, 0.8); burst(P.x, P.y, '#e8e2ff', 40, 400, 2.5, 0.8);
      banner(`Paragon ${P.para.lvl}<small>+1 hviezdny bod · stlač P</small>`);
      continue;
    }
    if (P.xp < xpNeed(P.level)) break;
    P.xp -= xpNeed(P.level); P.level++; P.points++;
    if (P.level === LEVEL_CAP) log('<span style="color:#e8e2ff">Maximálna úroveň 50.</span> Ďalšie skúsenosti plnia hviezdne konštelácie (P).');
    recalcStats();
    P.shield = P.stats.maxShield; P.hull = Math.min(P.stats.maxHull, P.hull + P.stats.maxHull * 0.35);
    ring(P.x, P.y, '#b48cff', 220, 0.8); burst(P.x, P.y, '#b48cff', 40, 400, 2.5, 0.8);
    banner(`Úroveň ${P.level}<small>+1 bod talentu · stlač K</small>`);
    log(`Úroveň ${P.level}. Máš ${P.points} ${P.points === 1 ? 'voľný bod' : 'voľné body'}.`);
    for (const id in SECTORS) if (SECTORS[id].min === P.level && P.level > 1) log(`<span style="color:#5be09a">Odomknutý sektor ${SECTORS[id].name}.</span> Otvor mapu (M).`);
  }
}

function collect(p) {
  const s = P.stats;
  if (p.kind === 'xp') { gainXp(p.amount); }
  else if (p.kind === 'gem') {
    P.gems[p.gem.t][p.gem.q]++;
    log(`Drahokam: <span style="color:${GEMS[p.gem.t].color}">${gemName(p.gem.t, p.gem.q)}</span>`);
  }
  else if (p.kind === 'key') {
    if (P.keys.length >= 20) { P.ore += 40; log('Kľúčov máš 20. Nadbytočný kľúč premenený na 40 rudy.'); return true; }
    P.keys.push(p.key);
    log(`<span style="color:#ff6b5a">Kľúč od nočnej brány · úroveň ${p.key.lvl}</span>`);
    saveGame();
  }
  else if (p.kind === 'ore') {
    const amt = p.amount + (s.legend.magnetar ? 1 : 0);
    P.ore += amt; G.oreTotal += amt; ACC.st.ore += amt;
    if (s.legend.oreArmor) { P.oreStacks = Math.min(15, P.oreStacks + 1); P.oreStackT = 6; }
    addText(P.x, P.y - 26, '+' + p.amount + ' rudy', '#c8a27c', 11, 0.6);
    if (s.mineShield) P.shield = Math.min(s.maxShield, P.shield + p.amount * 2);
    const tx = s.tx;
    if (tx.sCollect) P.shield = Math.min(s.maxShield, P.shield + s.maxShield * tx.sCollect / 100 * Math.min(5, amt));
    if (tx.kOreShield) P.oshield = Math.min(s.maxShield * 0.5, P.oshield + s.maxShield * 0.01 * amt);
    if (tx.kRush && (P.goldAcc += amt) >= 100) {
      P.goldAcc %= 100;
      if (P.goldT <= 0) { addText(P.x, P.y - 40, 'ZLATÁ HORÚČKA', '#ffc94d', 14, 1); ring(P.x, P.y, '#ffc94d', 160, 0.5); }
      P.goldT = 10;
    }
  } else {
    if (ASV().auto && shouldSalvage(p.item)) {
      const it = p.item, r = disposeItem(it);
      if (r.res) { addText(P.x, P.y - 30, `Rezonancia ${r.res.res}/${RES_MAX}`, RARITY.mythic.color, 11, 0.8); log(`Auto-rozobratie · duplikát <span style="color:var(--r-mythic)">${it.name}</span> → rezonancia ${r.res.res}/${RES_MAX}.`); }
      else addText(P.x, P.y - 30, `+${r.ore} rudy${r.sh ? ` · +${r.sh} úl.` : ''}`, '#c8a27c', 10, 0.5);
      if (r.codex) log(`Auto-rozobratie · <span style="color:#ff8a1f">${it.name}</span> uložená do kódexu.`);
      return true;
    }
    if (P.inv.length >= 30) {
      if (G.time - G.fullMsgT > 3) { log('<span style="color:#ff6b5a">Náklad je plný. Rozober predmety v inventári (I).</span>'); G.fullMsgT = G.time; }
      p.vx = (p.x - P.x) * 4; p.vy = (p.y - P.y) * 4; p.cool = 1.5;
      return false;
    }
    const it = p.item; P.inv.push(it);
    if (it.rarity === 'mythic') { G.found[it.legend] = true; saveGame(); }
    if (!P.bestItem || RARITY[it.rarity].rank > RARITY[P.bestItem.rarity].rank) P.bestItem = it;
    log(`Získané: <span style="color:${RARITY[it.rarity].color}">${it.name}</span> <span style="color:#7f8ca8">iLvl ${it.ilvl}</span>`);
    if (G.panel === 'inv') renderInventory();
  }
  return true;
}

function die() {
  if (G.mode !== 'play') return;
  if (G.dungeon && G.dungeon.climb && G.dungeon.state === 'climb' && !G.dungeon.weekly) recordClimb(G.dungeon.floor, true);
  G.mode = 'dead';
  burst(P.x, P.y, CLASSES[P.cls].color, 120, 600, 3, 1.2); ring(P.x, P.y, '#ff6b5a', 260, 0.9);
  const b = P.bestItem, loss = Math.floor(P.ore * 0.15);
  $('deadStats').innerHTML = `
    <dt>Miesto</dt><dd>${G.dungeon ? BOSSES[G.dungeon.boss].lair : curSector().name}</dd>
    <dt>Úroveň</dt><dd>${P.level}</dd>
    <dt>Čas letu</dt><dd>${fmtTime(G.time)}</dd>
    <dt>Zostrely</dt><dd>${G.kills}</dd>
    <dt>Porazení bossovia</dt><dd>${Object.values(G.bossKills).reduce((a, b) => a + b, 0)}</dd>
    <dt>Najlepší nález</dt><dd style="color:${b ? RARITY[b.rarity].color : 'inherit'}">${b ? b.name : '—'}</dd>
    <dt>Cena opravy</dt><dd style="color:#c8a27c">${loss} rudy (15 %)</dd>
    ${G.dungeon && G.dungeon.nm ? `<dt>Nočná brána</dt><dd style="color:#ff6b5a">úroveň ${G.dungeon.nm.k} nedokončená, kľúč stratený</dd>` : ''}`;
  G.panel = null; syncPanels();
  setTimeout(() => { if (G && G.mode === 'dead') $('dead').hidden = false; }, 900);
}
function respawn() {
  const loss = Math.floor(P.ore * 0.15);
  P.ore -= loss;
  recalcStats();
  P.hull = P.stats.maxHull; P.shield = P.stats.maxShield;
  G.mode = 'play'; G.saved = null; G.dungeon = null;
  $('dead').hidden = true;
  loadSector('haven');
  log(`Loď opravená na stanici Haven. Oprava stála ${loss} rudy.`);
}

/* =====================================================================
   7. GAME LOOP — update
   ===================================================================== */
function mouseWorld() { return { x: (input.mx - view.w / 2) / view.zoom + cam.x, y: (input.my - view.h / 2) / view.zoom + cam.y }; }
