# Void Harvest

2D vesmírna strieľačka s progresiou v štýle Diabla: lode s talentovými stromami, predmety s raritami a afixmi, sety, mýty, väčšie afixy ✦, nočné brány, Výstup do Prázdnoty, svetový boss a Aréna veliteľov. Čisté HTML5 Canvas + JavaScript, bez knižníc a bez inštalácie.

**Hrať online:** https://dzizka.github.io/void-harvest/

**Jazyk:** angličtina alebo slovenčina – prepínač v hangári alebo v Menu (≡).

**Hrať lokálne:** stiahni repozitár a otvor `index.html` v prehliadači (stačí dvojklik, server netreba).

## Ovládanie
`WASD` pohyb · myš mierenie · `LMB` laser a ťažba · `RMB` rakety · `Space` úhyb · `Q` / `Shift` schopnosti · `F` / `R` auto-boj / auto-ťažba (aj v Menu) · `I` inventár · `K` talenty · `P` paragon · `M` mapa · `E` interakcia · `Esc` zavrieť

## Štruktúra
```
index.html              HTML kostra (HUD, panely) + poradie načítania CSS a JS
css/
  base.css              premenné, písma, rámy, výber lode
  hud.css               HUD, spodná lišta, bannery
  panels.css            inventár, talenty, mapa, stanica, tooltip, rozoberanie
  features.css          cheat menu, mýty, brány, udalosti, dielňa, paragon
js/
  i18n.js, i18n-en.js  preklady (_L / _T, anglický slovník)
  core/                 util, stats (computeStats), state, save (ukladanie/načítanie), update (hlavná aktualizácia, hráč)
  data/                 game-data (lode, rarity, sloty, afixy, legendárky, svety…), talents, sets
  systems/              loot, world (sektory, brány), climb, vault-rush, world-boss, endgame-events (Búrka, Pevnosti, Horda), base (materiály a základňa), combat, abilities (úhyb a schopnosti),
                        companions (drony, mínióni), events, journal, boss-loot, enemies, projectiles
  render/               background, sprites (lode, nepriatelia, korisť), render (snímka, minimapa)
  ui/                   hud, inventory, talents, star-map, station, paragon, workshop, gates,
                        cheat, select, bindings (ovládanie, udalosti DOM, rozoberanie)
  main.js               hlavná slučka a štart
tools/
  build.js              zloží všetko do jedného súboru dist/void-harvest.html
  smoke.js              rýchly automatický test (Playwright)
  i18n-check.js         nájde slovenské texty bez anglického prekladu
```

Skripty sú obyčajné `<script>` súbory (nie moduly) a zdieľajú globálny scope. Preto záleží na poradí v `index.html` a hra funguje aj priamo zo súboru (`file://`).

## Vývoj
```bash
npm install        # len pre testy (Playwright)
npm run build      # dist/void-harvest.html – celá hra v jednom súbore
npm test           # build + smoke test oboch verzií
```

Uložené hry sú v `localStorage` prehliadača (`void-harvest-account-v1`, `void-harvest-save-v1:<loď>`), takže sú viazané na adresu, z ktorej hráš.
