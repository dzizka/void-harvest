'use strict';
/* =====================================================================
   BACKUP — export / import of the whole save (all ships, account, settings)
   as one JSON file. Used as a backup and to move progress between devices
   (PC ↔ phone). Import keeps a copy of the replaced data in
   `void-harvest-backup-before-import` and reloads the page.
   ===================================================================== */
const SAVE_PREFIX = 'void-harvest-', BACKUP_KEY = 'void-harvest-backup-before-import';
// everything the game stores, except the tab lock, corrupt copies and the import backup itself
const backupKeys = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(SAVE_PREFIX) && !/-tab$|-corrupt-|backup-before-import/.test(k)) out.push(k); } } catch (e) { /* storage blocked */ } return out; };

function exportSave() {
  if (G && G.mode === 'play') saveGame();
  const data = {};
  for (const k of backupKeys()) data[k] = localStorage.getItem(k);
  if (!Object.keys(data).length) { alert(_L('Zatiaľ nie je čo zálohovať.')); return; }
  const blob = new Blob([JSON.stringify({ game: 'void-harvest', v: 1, t: Date.now(), data })], { type: 'application/json' });
  const a = document.createElement('a'), d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = `void-harvest-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  if (G) log(_L('Záloha uložená do súboru.'));
}

// returns the data map of a valid backup file, otherwise null
function readBackup(text) {
  let f; try { f = JSON.parse(text); } catch (e) { return null; }
  if (!f || f.game !== 'void-harvest' || !f.data || typeof f.data !== 'object') return null;
  const data = {};
  for (const [k, v] of Object.entries(f.data)) {
    if (!k.startsWith(SAVE_PREFIX) || typeof v !== 'string') continue;
    if (/-save-v1|-account-v1/.test(k)) { try { JSON.parse(v); } catch (e) { return null; } }
    data[k] = v;
  }
  return Object.keys(data).some(k => /-save-v1|-account-v1/.test(k)) ? data : null;
}

function importSave(file) {
  const fr = new FileReader();
  fr.onload = () => {
    const data = readBackup(fr.result);
    if (!data) { alert(_L('Tento súbor nie je záloha Void Harvest alebo je poškodený.')); return; }
    const ships = Object.keys(data).filter(k => k.includes('-save-v1:')).map(k => k.split(':')[1]).filter(c => CLASSES[c]).map(c => CLASSES[c].name);
    if (!confirm(_T`Načítať zálohu? Nahradí celý súčasný postup (lode: ${ships.join(', ') || '—'}). Súčasný stav sa odloží ako záloha pred importom.`)) return;
    TAB.ro = true;   // nothing may save the old state over the imported one (pagehide, autosave)
    try {
      const old = {}; for (const k of backupKeys()) old[k] = localStorage.getItem(k);
      for (const k of backupKeys()) localStorage.removeItem(k);
      try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ game: 'void-harvest', v: 1, t: Date.now(), data: old })); } catch (e) { /* no room for the copy */ }
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
    } catch (e) { alert(_L('Zálohu sa nepodarilo uložiť (plné úložisko prehliadača?).')); }
    location.reload();
  };
  fr.readAsText(file);
}

const backupInput = document.createElement('input');
backupInput.type = 'file'; backupInput.accept = '.json,application/json'; backupInput.hidden = true;
backupInput.addEventListener('change', () => { const f = backupInput.files[0]; backupInput.value = ''; if (f) importSave(f); });
document.body.appendChild(backupInput);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-backup]'); if (!b) return;
  if (typeof setMore === 'function') setMore(false);
  if (b.dataset.backup === 'export') exportSave(); else backupInput.click();
});
