'use strict';
/* ---------- select screen ---------- */
function buildSelect() {
  const wrap = $('ships'); wrap.innerHTML = '';
  Object.entries(CLASSES).forEach(([key, c], i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'ship frame'; el.style.setProperty('--sc', c.color);
    el.innerHTML = `<div class="in">
      <canvas width="600" height="260" aria-hidden="true"></canvas>
      <div><span class="role">${c.role}</span><h2>${c.name}</h2></div>
      <p>${c.desc}</p>
      <div class="meters">${Object.entries(c.meters).map(([l, v]) => `<div class="meter"><span>${l}</span><span class="segs">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= v ? 'on' : ''}"></i>`).join('')}</span></div>`).join('')}</div>
      <ul class="perks">${c.perks.map(p => `<li>${p}</li>`).join('')}</ul>
      <span class="launch"><span>Štartovať</span><span>${i + 1}</span></span>
    </div>`;
    el.addEventListener('click', () => { const d = readSave(key); startGame(key, d); });
    wrap.appendChild(el);
    const cv = el.querySelector('canvas'), g = cv.getContext('2d');
    g.translate(300, 130); g.strokeStyle = c.color + '22'; g.lineWidth = 1;
    for (let r = 40; r <= 120; r += 40) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
    if (c.aura) { g.setLineDash([8, 10]); g.strokeStyle = c.color + '66'; g.beginPath(); g.arc(0, 0, 105, 0, TAU); g.stroke(); g.setLineDash([]); }
    if (c.minions) for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + 0.4, x = Math.cos(a) * 92, y = Math.sin(a) * 92;
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.scale(1.6, 1.6);
      g.fillStyle = '#1e100c'; g.strokeStyle = c.color; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, -7); g.lineTo(-3, 0); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
    }
    if (c.mineShield) { g.strokeStyle = c.color + '44'; g.setLineDash([2, 6]); g.beginPath(); g.arc(0, 0, 118, 0, TAU); g.stroke(); g.setLineDash([]); }
    drawShip(g, key, 0, 0, -Math.PI / 2, 3.6, true, 0);
  });
}
