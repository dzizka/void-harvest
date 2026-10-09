'use strict';
/* =====================================================================
   AUDIO – everything is synthesised with WebAudio (no sound files).
   sfx(name, x, y) plays an effect (quieter with distance from the ship);
   rate limits per sound + a voice cap keep hordes from turning into noise.
   Ambient music: slow detuned pad chords, a pulse layer during boss fights.
   Browsers allow audio only after a user gesture, so the context starts on
   the first click / key / touch.
   ===================================================================== */
const AUD = { ctx: null, master: null, sfx: null, mus: null, noise: null, voices: 0, last: {}, set: { sfx: true, music: true, vol: 0.7 }, pad: null, mood: 'calm' };
try { Object.assign(AUD.set, JSON.parse(localStorage.getItem('void-harvest-audio') || '{}')); } catch (e) { /* defaults */ }
function saveAudioSet() { try { localStorage.setItem('void-harvest-audio', JSON.stringify(AUD.set)); } catch (e) { /* ignore */ } }

function audioInit() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const c = AUD.ctx = new AC();
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 6; comp.connect(c.destination);
  AUD.master = c.createGain(); AUD.master.gain.value = AUD.set.vol; AUD.master.connect(comp);
  AUD.sfx = c.createGain(); AUD.sfx.gain.value = AUD.set.sfx ? 1 : 0; AUD.sfx.connect(AUD.master);
  AUD.mus = c.createGain(); AUD.mus.gain.value = AUD.set.music ? 1 : 0; AUD.mus.connect(AUD.master);
  const n = c.createBuffer(1, c.sampleRate, c.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  AUD.noise = n;
  startMusic();
}
for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, audioInit, { passive: true });

function setAudio(k, v) {
  AUD.set[k] = v; saveAudioSet();
  if (!AUD.ctx) return;
  const t = AUD.ctx.currentTime;
  if (k === 'sfx') AUD.sfx.gain.setTargetAtTime(v ? 1 : 0, t, 0.05);
  if (k === 'music') AUD.mus.gain.setTargetAtTime(v ? 1 : 0, t, 0.3);
  if (k === 'vol') AUD.master.gain.setTargetAtTime(v, t, 0.05);
}

/* ---------- primitives ---------- */
function voice(dur) { AUD.voices++; setTimeout(() => AUD.voices--, dur * 1000 + 50); }
function tone(type, f0, f1, dur, vol, at, dest, delay) {
  const c = AUD.ctx, t = c.currentTime + (delay || 0) + (AUD.tOff || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (at || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AUD.sfx); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, ftype, f0, f1, q, delay) {
  const c = AUD.ctx, t = c.currentTime + (delay || 0) + (AUD.tOff || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AUD.noise; s.loop = true;
  f.type = ftype; f.Q.value = q || 1; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AUD.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

/* ---------- effects: [min interval s, play(vol)] ---------- */
const SFX = {
  laser:   [0.07, v => tone('square', 1500 + Math.random() * 200, 520, 0.06, 0.035 * v)],
  hit:     [0.045, v => noise(0.035, 0.05 * v, 'bandpass', 2400, 1400, 3)],
  crit:    [0.08, v => tone('triangle', 1700, 900, 0.07, 0.06 * v)],
  pop:     [0.035, v => { noise(0.22, 0.13 * v, 'lowpass', 1800, 220, 1); tone('sine', 140, 50, 0.2, 0.09 * v); }],
  boom:    [0.1, v => { noise(0.7, 0.3 * v, 'lowpass', 2400, 90, 0.8); tone('sine', 110, 32, 0.6, 0.3 * v); tone('sawtooth', 70, 30, 0.45, 0.06 * v); }],
  rock:    [0.05, v => { noise(0.2, 0.12 * v, 'bandpass', 700, 180, 1.2); tone('sine', 95, 45, 0.16, 0.07 * v); }],
  ore:     [0.06, v => tone('sine', 1250 + Math.random() * 150, 1700, 0.06, 0.025 * v)],
  item:    [0.08, v => { tone('triangle', NOTE(84), NOTE(84), 0.12, 0.05 * v); tone('triangle', NOTE(91), NOTE(91), 0.16, 0.04 * v, 0.005, null, 0.06); }],
  rare:    [0.1, v => [79, 84, 88].forEach((n, i) => tone('triangle', NOTE(n), NOTE(n), 0.2, 0.05 * v, 0.005, null, i * 0.06))],
  legend:  [0.2, v => { [72, 76, 79, 84, 88].forEach((n, i) => tone('triangle', NOTE(n), NOTE(n), 0.5, 0.07 * v, 0.01, null, i * 0.07)); noise(0.9, 0.04 * v, 'highpass', 5000, 9000, 1); }],
  mythic:  [0.3, v => { [69, 72, 76, 81, 84, 88].forEach((n, i) => { tone('sine', NOTE(n), NOTE(n), 0.9, 0.07 * v, 0.02, null, i * 0.09); tone('triangle', NOTE(n + 12), NOTE(n + 12), 0.6, 0.025 * v, 0.02, null, i * 0.09); }); tone('sine', 55, 55, 1.4, 0.12 * v, 0.05); }],
  missile: [0.12, v => { noise(0.22, 0.14 * v, 'bandpass', 500, 2600, 2); tone('sine', 220, 520, 0.18, 0.03 * v); }],
  dodge:   [0.1, v => { noise(0.22, 0.09 * v, 'bandpass', 350, 2200, 1.5); tone('sine', 300, 900, 0.18, 0.04 * v); }],
  skill:   [0.1, v => { tone('sawtooth', 220, 880, 0.22, 0.05 * v); noise(0.25, 0.06 * v, 'highpass', 1500, 4000, 1); }],
  hurt:    [0.12, v => { tone('square', 190, 80, 0.16, 0.07 * v); noise(0.12, 0.06 * v, 'lowpass', 900, 200, 1); }],
  shield:  [0.1, v => tone('sine', 900, 420, 0.1, 0.05 * v)],
  level:   [0.5, v => [72, 76, 79, 84].forEach((n, i) => { tone('triangle', NOTE(n), NOTE(n), 0.35, 0.07 * v, 0.01, null, i * 0.09); tone('sine', NOTE(n - 12), NOTE(n - 12), 0.35, 0.04 * v, 0.01, null, i * 0.09); })],
  boss:    [2, v => { tone('sawtooth', 55, 52, 1.6, 0.12 * v, 0.15); tone('sawtooth', 82, 78, 1.6, 0.07 * v, 0.2); noise(1.4, 0.06 * v, 'lowpass', 300, 120, 2); }],
  warp:    [0.5, v => { tone('sine', 180, 1400, 0.8, 0.08 * v, 0.1); noise(0.9, 0.06 * v, 'bandpass', 400, 4000, 2); }],
  death:   [1, v => { tone('sawtooth', 300, 40, 1.2, 0.1 * v); noise(1.3, 0.25 * v, 'lowpass', 1600, 60, 0.7); }],
  click:   [0.05, v => tone('triangle', 1100, 900, 0.04, 0.03 * v)],
  chime:   [0.1, v => tone('triangle', NOTE(88), NOTE(88), 0.25, 0.05 * v)]
};
function sfx(name, x, y, vol) {
  const c = AUD.ctx; if (!c || !AUD.set.sfx || c.state !== 'running') return;
  const S = SFX[name]; if (!S) return;
  const now = c.currentTime;
  if (now - (AUD.last[name] || -9) < S[0]) return;
  if (AUD.voices > 24 && name !== 'level' && name !== 'legend' && name !== 'mythic' && name !== 'boss') return;
  let v = vol || 1;
  if (x != null && P) { const d = Math.hypot(x - P.x, y - P.y); if (d > 1500) return; v *= 1 - d / 1700; }
  AUD.last[name] = now; voice(1); S[1](v);
}

/* ---------- ambient music: Am – F – C – G pads, boss pulse ---------- */
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
function startMusic() {
  const c = AUD.ctx, f = c.createBiquadFilter(), g = c.createGain();
  f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 0.5; g.gain.value = 0.0001; g.gain.setTargetAtTime(0.045, c.currentTime, 2);
  f.connect(g); g.connect(AUD.mus);
  const oscs = [];
  for (let i = 0; i < 6; i++) { const o = c.createOscillator(); o.type = 'sawtooth'; o.detune.value = (i % 2 ? 7 : -7); o.connect(f); o.start(); oscs.push(o); }
  // slow filter breathing
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  // boss layer: low pulse gated by an LFO
  const bo = c.createOscillator(), bg = c.createGain(), bl = c.createOscillator(), blg = c.createGain();
  bo.type = 'triangle'; bo.frequency.value = 55; bg.gain.value = 0; bo.connect(bg); bg.connect(AUD.mus); bo.start();
  bl.frequency.value = 2.2; blg.gain.value = 0; bl.connect(blg); blg.connect(bg.gain); bl.start();
  AUD.pad = { oscs, g, f, bg, blg, step: -1, t: 0 };
  setChord(0);
}
function setChord(i) {
  const c = AUD.ctx, t = c.currentTime, ch = CHORDS[i % CHORDS.length];
  AUD.pad.oscs.forEach((o, k) => o.frequency.setTargetAtTime(NOTE(ch[k % 3] - 12 * (k < 3 ? 1 : 0)), t, 1.2));
  AUD.pad.step = i;
}
// called with the HUD (10× per second): chord changes and mood (calm / boss)
function audioTick(dt) {
  if (!AUD.ctx || !AUD.pad) return;
  const A = AUD.pad, c = AUD.ctx;
  A.t += dt; if (A.t > 9) { A.t = 0; setChord(A.step + 1); }
  const mood = G && G.boss && !G.boss.dead ? 'boss' : 'calm';
  if (mood !== AUD.mood) {
    AUD.mood = mood; const t = c.currentTime, b = mood === 'boss';
    A.bg.gain.setTargetAtTime(b ? 0.05 : 0, t, 0.6); A.blg.gain.setTargetAtTime(b ? 0.05 : 0, t, 0.6);
    A.f.frequency.setTargetAtTime(b ? 1100 : 700, t, 1);
  }
}
