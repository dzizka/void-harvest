# Void Harvest — notes for Claude

- The owner communicates in **Slovak**; all in-game text, UI labels, logs and commit messages are Slovak. Typical flow: user asks for analysis/proposals first, then says "pokračuj" to implement step by step.
- Plain HTML5 Canvas + vanilla JS, no build step needed to run. `index.html` loads `css/*.css` and `js/**/*.js` as **classic scripts in a fixed order sharing one global scope** (no ES modules, so it runs from `file://`). Every JS file starts with `'use strict';`.
  - Top-level code in a file may only call functions from files loaded **earlier**; function declarations are not hoisted across files. Startup calls live in `js/main.js`.
  - New file → add its `<script>` tag to `index.html` in the right place; `tools/build.js` picks it up automatically.
- Key globals: `G` (session/world state), `P` (player ship), `ACC` (account: stash, achievements, leaderboards). `computeStats()` in `js/core/stats.js` is the single source of truth for stats (gameplay and tooltip comparison). Saves: `localStorage` keys `void-harvest-account-v1` and `void-harvest-save-v1:<cls>`; keep old saves loading (migrate in `restoreSave`/`loadAccount`).
- Dungeon-like modes reuse `G.dungeon` with flags (`nm`, `pinnacle`, `climb`, `weekly`, `vault`, `rush`).
- Testing: `npm test` (builds `dist/void-harvest.html`, then `tools/smoke.js` plays every ship in both versions and opens all panels). For balance/features write ad-hoc Playwright scripts that drive the game via globals (`startGame`, `cheatLevels`, `cheatTopGear`, `loadSector`, `spawnEnemy`, `update(dt)`, `openPanel`) and review screenshots. Fonts from Google should be blocked in headless tests (`page.route(/fonts\.g/, r => r.abort())`).
- After changes: run `npm test`, commit with a Slovak message, push to `main` (GitHub Pages serves the repo root at https://dzizka.github.io/void-harvest/).
