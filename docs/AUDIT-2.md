# Void Harvest – audit č. 2 (október 2026)

Druhý audit z pohľadu herného vývojára, po dokončení všetkých 5 fáz [prvého auditu](AUDIT.md). Ako minule: hru automaticky odohral bot, merali sa výkon a dáta, prešiel sa kód (aj automatickou statickou kontrolou) a prvé minúty hry ako nováčik na PC aj na mobile. Na konci je plán opráv a pri každej zmene aj riziko a spôsob, ako mu predísť.

## Celkové hodnotenie

| Oblasť | Audit 1 | Teraz | Prečo |
|---|---|---|---|
| Obsah a systémy | A | A | 6 bojových sektorov, 9 bossov, brány, horda, pevnosti, základňa, príbeh, sezóny |
| Herný pocit | C | B+ | Zvuky, hudba so zmenou nálady, 3D modely, hitstop a výbuchy |
| Balans a tempo | C− | B− | Tempo do úrovne 30 je dobré a lode sú vyrovnanejšie. Loot však na vyšších svetoch opäť zaplavuje a otvorený svet je po prvých minútach príliš bezpečný. |
| Prehľadnosť pre nováčika | C | B | Postupné odomykanie funguje. Zostáva správa veľkého množstva predmetov a texty pre klávesnicu na mobile. |
| Spoľahlivosť uložených dát | D | A− | Opravené všetky nálezy z auditu 1, uloženia sú malé (~100 kB) |
| Výkon | B | B | Logika < 1 ms na snímku. Vykresľovanie sa bez skutočného zariadenia nedá spoľahlivo zmerať. |
| Mobil a distribúcia | – | C+ | Hrateľné, ale bez inštalácie (PWA), bez offline režimu, písma z Google |
| Kód a údržba | B− | B− | Statická kontrola bez chýb. Zostávajú dlhé riadky a duplicity, chýba automatický balansový test. |

## 1. Tempo a balans (namerané)

### Bot, 90 herných minút, svet I
Bot má auto-boj, auto-ťažbu a auto-schopnosti. Oproti auditu 1 už rozdeľuje body talentov a nasadzuje lepšie predmety. Do brán nechodí, nevylepšuje predmety v dielni a neminie rudu.

| Loď | Úroveň po 90 min | Úr. 25 | Úr. 30 | Smrti | DPS lasera | Predmety / h | Legendárky / h |
|---|---|---|---|---|---|---|---|
| Interceptor | 31 | 47 min | 81 min | 3 | 9 661 | 620 | 33 |
| Juggernaut | 29 | 56 min | – | 3 | 3 598 (+ aura) | 653 | 28 |
| Scavenger | 35 | 35 min | 58 min | 2 | 7 343 | 992 | 31 |
| Carrier | 30 | 49 min | 82 min | 1 | 1 629 (+ 9 miniónov) | 739 | 27 |

Dlhý beh (Interceptor, 4 hodiny): úroveň 35 za 110 min, 40 za 165 min, 45 za 237 min, 1 smrť. Úroveň 50 odhadom za 5–6 hodín.

**Čo z toho plynie:**
- **Tempo do úrovne 30 je v poriadku** (~1–1,5 h, pôvodne 40 min). Kapitoly príbehu (úrovne 1, 8, 12, 16, 26, 36, 46, 50) prichádzajú v rozumných odstupoch.
- **Rozdiel medzi loďami sa po 90 min zväčšil na 6 úrovní** (Scavenger 35, Juggernaut 29). Pri 45 min to boli 1–2 úrovne. Príčinou je trvalý bonus Scavengera +25 % XP, ktorý sa časom sčítava. Juggernaut je najpomalší.
- **Otvorený svet je príliš bezpečný.** Bot zomrel 1–3× za 90 min a len raz za 4 hodiny, hoci sa iba vracia na stanicu pri 30 % trupu. Po prvých minútach otvorený svet nekladie odpor; výzva je len v bránach.
- **Množstvo predmetov:** 620–990 zdvihnutých predmetov za hodinu, teda 10–16 za minútu. Náklad (30 miest) sa naplní každé 2–3 minúty. Automatické rozoberanie je predvolene vypnuté, takže nováčik trávi veľa času v inventári.

### Svety (náročnosť) I–IV, 15 min s najlepšou výbavou
Predmety, ktoré naozaj padli na zem (nie len zdvihnuté):

| Svet | Úroveň | Predmetov / min | Legendárky / h |
|---|---|---|---|
| I | 30 | 25 | 40 |
| II | 30 | 35 | 76 |
| III | 40 | 21 | 72 |
| IV | 50 | 25 | 124 |

- **Na svete IV padá ~120 legendárok za hodinu**, teda dve za minútu. Násobok legendárok sveta (`TIERS[].leg`: ×2,2 / ×3,5 / ×5) vracia „záplavu“, ktorú fáza 3 auditu 1 riešila. Legendárka v koncovej hre prestáva byť udalosťou.
- Mýtické predmety v otvorenom svete nepadajú (iba z bossov a udalostí), to je v poriadku.

### Ekonomika
- **Ruda sa hromadí:** po 90 min má bot 78 000 – 337 000 rudy. Ceny v dielni sú malé: preroll afixu na predmete úrovne 30 stojí 160 rudy, pätica 60–240. Skutočným obmedzením sú úlomky, ruda prestáva mať hodnotu.
- Materiály základne pribúdajú rovnomerne. Exotická látka chýba až do sveta III, ale je to zámer.

## 2. Nováčik – prvé minúty (PC aj mobil)

- **Postupné odomykanie funguje:** zamknuté karty majú zámok a hra hlási, kedy sa odomknú. Príbeh čaká na tutoriál.
- **Prudký skok v Hlbine:** 1 900 m od majáka je zóna o 3 úrovne vyššia (Hlbina III). Pilot úrovne 3 na mobile zahynul do 71 sekúnd. Hra okrem čiarkovaného kruhu a textu v HUD nevaruje.
- **Udalosti a pevnosť v prvej minúte:** Invázia sa spustila v 1:14 a pevnosť (vlny o 3 úrovne vyššie) stojí v Kepleri od úrovne 1. Pre nováčika je to veľa naraz.
- **Texty pre klávesnicu na mobile:** log ukazuje „Brány (G na minimape)… Mapa: M, stanica: E.“ aj v dotykovom režime.
- **Kontrakty:** v HUD sú skryté do konca tutoriálu, na stanici ich však nováčik vidí. Drobná nekonzistencia.
- **Správa lootu:** pozri vyššie. Automatické rozoberanie je predvolene vypnuté, takže prvé plné inventáre musí nováčik rozoberať ručne.

## 3. Výkon a dáta (namerané)

- **Herná logika** je lacná: 0,2–1 ms na snímku pri 40–70 nepriateľoch (PC aj mobilné rozlíšenie).
- **Vykresľovanie** v testovacom prehliadači beží bez grafickej karty, takže časy (50–90 ms) nezodpovedajú skutočnému zariadeniu. Na skutočné FPS treba test na S25 (napr. Cheat menu → Debug info).
- **Limit častíc** (1 600) sa v ťažkých bojoch prekračuje (namerané až 1 741). Niektoré efekty (kruhy, lúče) limit nekontrolujú.
- **Spomalenie pri nízkom FPS:** krok simulácie je obmedzený na 0,05 s. Pod 20 FPS sa hra spomalí (slow motion), namiesto toho, aby ostala plynulá.
- **Hudba hrá ďalej v karte na pozadí,** hoci je hra zmrazená. Prehliadač zastaví snímky, ale nie zvukový prvok.
- **Sťahovanie:** hangár načíta ~4,2 MB (modely lodí) a po prvom kliknutí 4,5 MB hudby hangára. Na mobilných dátach je to citeľné. Hudba spolu zaberá 23 MB (13 skladieb × OGG + MP3), sťahuje sa však postupne.
- **Uloženia sú malé:** jedna loď s plným nákladom ~15 kB, účet s plným skladom (120) ~43 kB, so 4 loďami ~100 kB. To je 2 % limitu prehliadača.

## 4. Mobil, ovládanie a distribúcia

- **Žiadna inštalácia (PWA):** chýba `manifest.json` a service worker. Hru nejde pridať na plochu ako aplikáciu s ikonou, nefunguje offline a režim na celú obrazovku sa musí žiadať pri každom spustení.
- **Písma sa načítavajú z Google Fonts:**
  - Offline (súbor z disku) sa písma nenačítajú.
  - Načítanie z Google posiela IP adresu hráča do USA. V EÚ to súdy posudzujú ako problém GDPR (Nemecko, 2022).
  - Riešenie: písma uložiť do repozitára.
- **Gamepad nefunguje v hangári a v oknách:** hru nejde spustiť ovládačom a inventár ani stanica sa nedajú ovládať. Funguje let, boj a otváranie a zatváranie okien.
- **Prístupnosť:** nedajú sa zmeniť klávesy, chýba zväčšenie rozhrania (HUD má písmo 11–13 px) a vypnutie otrasov obrazovky. Rarita predmetu sa rozlišuje hlavne farbou.

## 5. Kód a údržba

- **Statická kontrola (ESLint)** celého kódu (~10 000 riadkov JS):
  - žiadna nedefinovaná premenná, nedosiahnuteľný kód ani duplicitný `case`,
  - našla 3 duplicitné kľúče v anglickom slovníku (`Odomkne sa na úrovni {0}`, `Minióni`, `Rýchlosť`; preklady sú zhodné, takže neškodia) a 5 nepoužitých premenných.
- 104 riadkov má cez 250 znakov (najviac `workshop.js`, `journal.js`, `base.js`).
- Hľadanie nepriateľov v okolí je v kóde ~53-krát ručne (`for (const e of enemies)`). Veľkosť nákladu `30` je stále natvrdo na viacerých miestach.
- **Balans sa nedá overiť automaticky:** bot existuje iba ako jednorazový skript mimo repozitára. Bez neho každá zmena čísel znamená ručné meranie.
- Testy (`npm test`) zachytia chyby JavaScriptu, ale nie nezmyselné hodnoty (napr. NaN životy, prázdne preklady).

## 6. Plán opráv a riziká zmien

Každá fáza je samostatný commit. Po nej musí prejsť `npm test` a cielený test fázy. Staré uložené hry sa musia ďalej načítať.

### Fáza A – rýchle opravy ✅ hotová
Hotovo: hudba sa pozastaví v skrytej karte; tutoriál a úvodný log majú v dotykovom režime vlastné texty (bez kláves); kontrakty sú aj na stanici skryté do konca tutoriálu (`contractsOn()`); malé kruhy, záblesk pri výstrele a výboje rešpektujú limit častíc (veľké kruhy nad 120 px sa kreslia vždy); odstránené 3 duplicitné preklady a 2 nepoužité premenné.

| Zmena | Riziko | Ako mu predísť |
|---|---|---|
| Hudba sa pozastaví, keď je karta skrytá (`visibilitychange`) | Po návrate nehrá | Pri návrate sa skladba obnoví cez `audioTick` (ten už vie spustiť pozastavenú stopu) |
| Texty s klávesami (G, M, E, LMB) v dotykovom režime nahradiť dotykovou verziou | Chýbajúci preklad | Nové texty cez `_L` + anglický slovník, kontrola `npm run i18n` |
| Kontrakty na stanici skryť do konca tutoriálu (ako v HUD) | Veterán ich nevidí | Rovnaká podmienka ako v HUD (`tutDone()` alebo úroveň účtu 8+) |
| Limit častíc aj pre kruhy a lúče | Chýbajúci dôležitý efekt | Limit iba pre dekoratívne efekty; kruhy bossov a legendárok vždy |
| Zmazať 3 duplicitné preklady a nepoužité premenné | Žiadne | ESLint po zmene |

### Fáza B – loot a ekonomika ✅ hotová
Zmeny:
- **Svety:** násobok legendárok ×1,5 / ×2 / ×2,5 (bolo ×2,2 / ×3,5 / ×5). Pradávne predmety 5 / 15 / 35 % (bolo 0 / 10 / 25 %), väčšie afixy ✦ 1,5 / 4 / 8 % na riadok (bolo 1 / 2,5 / 5 %). Popisy svetov a kódex sú upravené.
- **Dielňa:** ceny vylepšenia, prekovania, pätíc a odtlačku rastú pre predmety nad úrovňou 20 o 8 % za úroveň (`lateCost`; úroveň 30 ×1,8, úroveň 50 ×3,4). Do úrovne 20 sa nič nemení.
- **Scavenger:** vlastný bonus XP +10 % (bolo +25 %), talent Zisk dáva +10 / 20 / 30 % rudy a +4 / 8 / 12 % XP (bolo +10 / 20 / 30 % XP). Meranie ukázalo, že hlavným zdrojom náskoku bol práve talent.
- Automatické rozoberanie: hra ho už má (filter v inventári), preto sa nemenilo.

Overenie botom (15 min na svet, najlepšia výbava, legendárky za hodinu; vzorky sú malé, čísla kolíšu ±30 %):

| Svet | Pred | Po | Pradávne predmety za 15 min (pred → po) |
|---|---|---|---|
| I | 40 | 36 | – |
| II | 76 | 24 | 0 → 5 |
| III | 72 | 52 | 17 → 24 |
| IV | 124–188 | 72 | 64 → 53 (pri menšom počte legendárok vyšší podiel) |

Tempo po 90 min (svet I): Scavenger 33 (bolo 35), Interceptor 31, Juggernaut 31, Carrier 31, rozdiel medzi loďami 2 úrovne (bolo 6).

| Zmena | Riziko | Ako mu predísť |
|---|---|---|
| Násobok legendárok svetov znížiť (×2,2 / ×3,5 / ×5 → napr. ×1,5 / ×2 / ×2,5) a vyšším svetom dať radšej lepšie afixy (vyšší podiel väčších afixov ✦) | Hráči na svete IV pocítia menej lootu | Viac väčších afixov a pradávnych predmetov vyváži počet kvalitou; overiť botom |
| Ponúknuť automatické rozoberanie bežných a magických predmetov po úrovni 10 (jedno kliknutie, nie natvrdo) | Hráč príde o predmet, ktorý chcel | Iba otázka v logu / okne; set, mýt, legendárky a vylepšené predmety chránené ako doteraz |
| Ceny v dielni (preroll, pätice) škálovať podľa úrovne predmetu silnejšie | Drahšie aj pre nováčikov | Zmena iba nad úrovňou 20; nižšie ostáva |
| Bonus Scavengera +25 % XP znížiť alebo obmedziť na ťažbu | Scavenger stratí identitu | Ponechať +40 % výnos ťažby a magnet; XP bonus len za asteroidy |

### Fáza C – výzva v otvorenom svete
| Zmena | Riziko | Ako mu predísť |
|---|---|---|
| Varovanie pri vstupe do hlbšej zóny („Hlbina II: nepriatelia +2 úrovne“) a pre úroveň < 5 miernejší skok | Žiadne | Iba banner a farba okraja |
| Pevnosť a svetové udalosti až od úrovne 4–5 | Menej obsahu na začiatku | Prah iba pre prvú loď účtu; veteráni ich majú hneď |
| Otvorený svet ťažší po úrovni 15 (viac elít v Hlbine, agresívnejšie letky) | Frustrácia slabších lodí | Iba v Hlbine II–III; okraj majáka ostáva pokojný; overiť botom (cieľ ~1 smrť za 20 min v Hlbine III) |
| Juggernaut: menší rozdiel v tempe (napr. aura škáluje s úrovňou rýchlejšie) | Juggernaut príliš silný | Meniť po malých krokoch a porovnať s botom |

### Fáza D – mobil a distribúcia
| Zmena | Riziko | Ako mu predísť |
|---|---|---|
| PWA: `manifest.json`, ikony, service worker (offline, inštalácia na plochu, celá obrazovka) | Service worker podrží starú verziu hry po aktualizácii | Verzia v názve cache, „network first“ pre `index.html`, test aktualizácie |
| Písma priamo v repozitári (bez Google Fonts) | Iný vzhľad, ak sa súbor nenačíta | Rovnaké písma (licencia OFL), záložné písmo v CSS ostáva |
| Menšia verzia hudby hangára (kratšia slučka alebo nižší bitrate) | Horšia kvalita | Iba hangár; ostatné skladby bez zmeny |
| Simulácia v menších krokoch pri nízkom FPS namiesto spomalenia | Ešte nižšie FPS na slabých zariadeniach | Max. 3 kroky na snímku, potom až spomalenie |
| Test na skutočnom S25 (FPS, teplota, batéria) | – | Debug info v cheat menu; ak treba, menej častíc na mobile |

### Fáza E – gamepad a prístupnosť
| Zmena | Riziko | Ako mu predísť |
|---|---|---|
| Gamepad v hangári (výber lode, Pokračovať) a pohyb po oknách (výber ťahaním D-padom, A potvrdí) | Rozbitie myši a dotyku | Fokus iba keď je gamepad aktívny; testy myši a dotyku ostávajú |
| Zväčšenie rozhrania (100 / 115 / 130 %) a vypnutie otrasov obrazovky v Menu | Prekrývanie okien | CSS premenná mierky; test na 1280×720 a mobile |
| Rarita aj tvarom alebo značkou (nielen farbou) | Žiadne | Malá značka v rohu ikony |

### Fáza F – údržba
| Zmena | Riziko | Ako mu predísť |
|---|---|---|
| Bot ako súčasť repozitára (`npm run balance`, tabuľka úrovní, smrtí a lootu) | Pomalý test | Samostatný príkaz, nie súčasť `npm test` |
| Kontrola NaN a prázdnych hodnôt v smoke teste | Falošné poplachy | Iba kľúčové hodnoty (životy, štatistiky, ruda) |
| Spoločná funkcia na hľadanie nepriateľov v okolí, konštanta pre veľkosť nákladu | Zmena správania | Postupne, súbor po súbore, s `npm test` po každom |
| ESLint ako `npm run lint` | Žiadne | Iba pravidlá, ktoré teraz prechádzajú |

## Ako sa merali čísla
- **Bot:** Playwright skript volá `update(1/30)` v cykle bez kreslenia.
  - Bot hrá s auto-bojom, auto-ťažbou a auto-schopnosťami a presúva sa do sektora podľa úrovne.
  - Rozdeľuje body talentov, nasadzuje lepšie predmety a zvyšok rozoberá.
  - Do brán nechodí a nevylepšuje predmety.
  - Svety II–IV hral s najlepšou výbavou z cheatov (`cheatTopGear`), preto tam nesledujeme smrti, iba loot.
- **Loot:** počítal sa každý predmet, ktorý padol na zem (`dropPickup`). V tabuľke 90 min sú zdvihnuté predmety.
- **Výkon:** priemer 120 snímok pri 40–70 nepriateľoch, PC 1440×860 a mobil 915×412 s hustotou 3.
- **UX:** snímky obrazovky prvých dvoch minút novej hry na PC aj v dotykovom režime.
- **Kód:** ESLint 8 nad zloženým kódom všetkých skriptov v poradí z `index.html`.
