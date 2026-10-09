# Void Harvest – audit hry (október 2026)

Audit z pohľadu herného vývojára: automatické odohranie každej lode (45 herných minút), meranie výkonu a revízia celého kódu. Na konci je plán opráv a pri každej zmene aj to, čo môže pokaziť a ako tomu predísť.

## Celkové hodnotenie

| Oblasť | Známka | Prečo |
|---|---|---|
| Obsah a systémy | A | 4 lode, 16 schopností, sety, mýty, paragon, brány, horda, pevnosti, základňa, príbeh, sezóny |
| Herný pocit | C | Žiadny zvuk. Grafika je pekná, ale zásahom chýba váha |
| Balans a tempo | C− | Úroveň 30 za ~40 min, loot zaplavuje, Carrier výrazne zaostáva |
| Prehľadnosť pre nováčika | C | Veľa systémov hneď od začiatku, príbeh a tutoriál sa bijú o pozornosť |
| Spoľahlivosť uložených dát | D | Tri chyby môžu stratiť alebo zdvojiť predmety |
| Výkon | B | Herná logika < 1 ms na snímku, brzdou je vykresľovanie na mobile |
| Kód a údržba | B− | Dobre rozdelený, ale veľké súbory a veľa duplicít |

## 1. Uložené dáta (kritické)

- **Kolízia ID predmetov medzi loďami.** Každá loď čísluje predmety od 1 (`ITEM_ID` v uloženej hre lode), ale sklad je spoločný. Zostavy výbavy (`findItemById`) a ochrana pri hromadnom rozoberaní hľadajú podľa ID, takže môžu nasadiť alebo ochrániť nesprávny kus. Nasadenie zostavy vie vložiť predmet do plného skladu.
- **Poškodený save sa potichu prepíše prázdnym** (`loadAccount`): sklad, materiály, základňa aj sezóna sú preč.
- **Dve otvorené karty** si navzájom prepisujú účet, takže predmety sa môžu zdvojiť alebo stratiť.
- Kľúč nočnej brány, úlomky Architekta a úlomky mapy sa minú pri vstupe a reload počas behu ich nevráti.
- Odmeny sa pri plnom náklade a sklade potichu zahodia (expedície, sezóna, príbeh, odchod z brány). Predmety na zemi zmiznú po 3 minútach, aj mýtické. Zlievareň zoberie materiál na kľúč aj pri 20 kľúčoch.
- Reloadom na obrazovke smrti sa dá vyhnúť strate 15 % rudy.
- **Zmena systémového času:** posun dopredu dokončí expedície okamžite, posun dozadu zastaví rafinériu a zmaže celý postup sezóny.

## 2. Tempo a balans (namerané)

Bot hral 45 herných minút s auto-bojom, auto-ťažbou a auto-schopnosťami. Nedával talenty, nevylepšoval predmety a nechodil do brán, takže skutočný hráč postupuje ešte rýchlejšie.

| Loď | Úroveň po 45 min | Úr. 30 za | Smrti | Zostrely | DPS | Legendárky |
|---|---|---|---|---|---|---|
| Interceptor | 34 | 37 min | 6 | 3 944 | 3 558 | 35 |
| Juggernaut | 31 | 42 min | 4 | 3 328 | 2 459 | 27 |
| Scavenger | 35 | 34 min | 3 | 3 702 | 2 665 | 38 |
| Carrier | 25 | – | 10 | 2 240 | 678 | 13 |

- Progresia je príliš rýchla: pri strope 50 je polovica kampane za hodinu. Kapitoly príbehu na úrovniach 26–50 hráč preletí.
- Loot zaplavuje: ~13 predmetov za minútu a ~45 legendárok za hodinu. Legendárka prestáva byť udalosťou.
- Carrier zaostáva: päťkrát nižšie DPS, najviac smrtí a o 10 úrovní nižšie.
- Hustota nepriateľov je ~85 zostrelov za minútu. Jednotlivý nepriateľ nemá váhu.
- Ruda nemá kam ísť: po 45 min je 30–58 tisíc a nič ju nespotrebuje.
- Asi 13 bonusov k poškodeniu sa násobí bez stropu (`dmgBuff`), takže je možné ×9 a viac. Buff z nahromadenej rudy odmeňuje hromadenie.

## 3. Herný pocit

- Hra nemá žiadny zvuk (ani jeden `AudioContext`). Pre akčnú strieľačku je to najväčšie zlepšenie na jednotku práce.
- Zásahom chýba váha (hitstop, otras, väčšie výbuchy elít a bossov). Drop legendárky nemá vlastný moment (stĺp svetla, zvuk).

## 4. Prehľadnosť pre nového hráča

- Na začiatku je naraz dialóg príbehu, 7 krokov tutoriálu, kontrakty a výzvy.
- Hra má ~15 okien a 30+ systémov dostupných príliš skoro. Odporúča sa ich odomykať postupne a spojiť tutoriál s 1. kapitolou príbehu.

## 5. Výkon a mobil

- Herná logika je lacná (< 1 ms na snímku pri 45 nepriateľoch).
- Najdrahšia je žiara cez celú obrazovku (blur filter) pri grafike „vysoká“. Na mobile s dvojnásobným rozlíšením by mala byť predvolená „stredná“.
- Strely sa kreslia aj mimo obrazovky, každú snímku sa vytvárajú nové zoznamy (`filter`), niektoré efekty obchádzajú limit častíc. Opravár a štítonosič prehľadávajú všetkých nepriateľov každú snímku.
- Chýba podpora gamepadu.

## 6. Technický dlh

- `abilities.js` má 32 kB, 101 riadkov má cez 250 znakov.
- Hľadanie najbližšieho nepriateľa je skopírované asi na 10 miestach, veľkosť nákladu `30` je natvrdo na 17 miestach.
- Cooldowny schopností sa neukladajú (reload ich vynuluje). Jeden nepreložený text „+X rudy“.

## 7. Plán opráv a riziká zmien

Každá fáza je samostatný commit, po ktorom prejde `npm test` a cielený test fázy. Staré uložené hry sa musia načítať (migrácie v `restoreSave` / `loadAccount`).

### Fáza 1 – ochrana uložených dát ✅ hotová
| Zmena | Riziko | Ako mu predísť |
|---|---|---|
| Jeden čítač ID pre celý účet (`ACC.itemId`) + oprava existujúcich duplicít v sklade | Zostavy inej lode, ktoré odkazujú na prečíslovaný predmet zo skladu, ho už nenájdu | Prečíslovať len duplicitné kusy v sklade; zostava navyše kontroluje, že predmet patrí do slotu; chýbajúci kus hlási ako doteraz |
| Záloha poškodeného save (`…-corrupt-<čas>`) | Žiadne – iba pridá kľúč | Hlásenie v logu, aby hráč vedel |
| Zámok proti dvom kartám | Testy otvárajú viac stránok za sebou | Pravidlo „posledná spustená karta vyhráva“: staršia karta sa iba pozastaví a prestane ukladať, nič nemaže |
| Pošta pre odmeny pri plnom sklade | Hráč nevie, že niečo čaká | Tlačidlo „Pošta“ v inventári s počtom a hlásenie v logu |
| Vrátenie kľúča / úlomkov pri reloade počas brány | Opakovaný reload ako lacný únik | Vráti sa iba vstupná cena; nárok zanikne po porazení bossa, smrti alebo odchode |
| Strata rudy pri smrti hneď (nie až pri oprave) | Dvojitá strata | Suma sa odráta raz a oprava ju už len oznámi |
| Mýtické, setové a legendárne predmety na zemi nezmiznú | Viac predmetov v pamäti | Týka sa len vzácnych kusov |
| Sezóna sa pri posune času dozadu nezmaže, rafinéria sa nezasekne | Posun dopredu stále urýchli časovače | Hra je offline a pre jedného hráča; dôležité je, aby sa nič nestratilo |

### Fáza 2 – zvuk a herný pocit ✅ hotová
Syntetizované zvuky cez WebAudio (bez súborov), hlasitosť a vypnutie v Menu, predvolene stlmené do prvého kliknutia (pravidlo prehliadačov). Riziko: veľa zvukov naraz v hordách → limit súbežných zvukov a zoskupovanie rovnakých zvukov. Stĺp svetla pri legendárke, silnejšie výbuchy elít a bossov.

### Fáza 3 – balans
Pomalšia krivka XP od úrovne 15, vzácnejší ale lepší loot, posilnený Carrier, strop pre násobenie poškodenia, výdavky rudy v neskorej hre. Riziko: rozbitie existujúcich postáv a uložených hier → zmeny len v krivkách a šanciach, nie v uložených predmetoch; overenie tým istým botom (cieľové tempo: úroveň 30 za ~90–120 min, Carrier v rozpätí ±20 % od ostatných lodí).

### Fáza 4 – onboarding
Postupné odomykanie systémov podľa úrovne, spojenie tutoriálu s 1. kapitolou. Riziko: hráči s existujúcou uloženou hrou by stratili prístup → odomknuté podľa dosiahnutej úrovne, nikdy neuzamknúť už použité.

### Fáza 5 – výkon a mobil
Predvolená stredná grafika na mobile, kreslenie len viditeľných striel, menej alokácií, cielenie opravárov raz za 0,25 s, gamepad. Riziko: zmena vzhľadu na PC → nastavenie sa mení len pri prvom spustení v dotykovom režime.
