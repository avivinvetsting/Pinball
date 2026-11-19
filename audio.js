/* Synthesised sound effects + generative music (WebAudio, no assets). */
(function (G) {
  'use strict';
  const P = (G.Pin = G.Pin || {});
  const A = {
    ctx: null, master: null, sfxOn: true, musicOn: true, musicGain: null, noiseBuf: null,
    music: null, step: 0, nextT: 0, timer: null,
  };

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = G.AudioContext || G.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain(); A.master.gain.value = 0.7;
    const comp = A.ctx.createDynamicsCompressor();
    A.master.connect(comp); comp.connect(A.ctx.destination);
    A.musicGain = A.ctx.createGain(); A.musicGain.gain.value = A.musicOn ? 0.5 : 0;
    A.musicGain.connect(A.master);
    const n = A.ctx.sampleRate;
    A.noiseBuf = A.ctx.createBuffer(1, n, n);
    const d = A.noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  };

  A.tone = function (f, dur, type, vol, slide, delay, dest) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + (delay || 0);
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || A.master);
    o.start(t); o.stop(t + dur + 0.02);
  };

  A.noise = function (dur, vol, f0, f1, delay, type) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + (delay || 0);
    const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf;
    const fl = A.ctx.createBiquadFilter(); fl.type = type || 'bandpass';
    fl.frequency.setValueAtTime(f0 || 1000, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(A.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  };

  const SFX = {
    flip() { A.tone(110, 0.09, 'square', 0.18, 55); A.noise(0.05, 0.25, 900, 300); },
    flipDown() { A.noise(0.03, 0.1, 600, 200); },
    bumper(pitch) { const f = 520 + (pitch || 0) * 90; A.tone(f, 0.16, 'square', 0.16, f * 1.8); A.tone(f / 2, 0.2, 'triangle', 0.2, f / 3); },
    sling() { A.tone(240, 0.1, 'sawtooth', 0.16, 110); A.noise(0.06, 0.25, 2200, 800); },
    stand() { A.tone(880, 0.12, 'triangle', 0.22, 1320); A.tone(1320, 0.1, 'sine', 0.12, null, 0.05); },
    drop() { A.noise(0.08, 0.3, 500, 200); A.tone(300, 0.1, 'square', 0.12, 120); },
    dropBank() { [523, 659, 784, 1047].forEach((f, i) => A.tone(f, 0.18, 'square', 0.14, null, i * 0.07)); },
    spin() { A.tone(1500 + Math.random() * 300, 0.03, 'square', 0.05); },
    rollover() { A.tone(660, 0.12, 'sine', 0.22, 990); },
    hit(v) { const g = Math.min(0.2, v / 3500); A.tone(160, 0.05, 'triangle', g, 90); A.noise(0.03, g * 0.8, 3000, 1500); },
    saucer() { A.tone(140, 0.25, 'sine', 0.3, 60); A.noise(0.15, 0.2, 500, 150); },
    eject() { A.noise(0.35, 0.3, 300, 3500); A.tone(200, 0.2, 'sawtooth', 0.12, 700); },
    ramp() { A.noise(0.9, 0.12, 400, 2500); A.tone(300, 0.9, 'sine', 0.12, 900); },
    launch() { A.noise(0.5, 0.35, 200, 2800); A.tone(90, 0.3, 'sawtooth', 0.15, 40); },
    plunger(p) { A.tone(80 + p * 140, 0.04, 'square', 0.04); },
    drain() { [392, 330, 262, 196, 131].forEach((f, i) => A.tone(f, 0.28, 'sawtooth', 0.14, f * 0.9, i * 0.13)); },
    saved() { [392, 523, 659, 784].forEach((f, i) => A.tone(f, 0.2, 'triangle', 0.2, null, i * 0.07)); },
    multi() { for (let i = 0; i < 12; i++) A.tone(330 * Math.pow(1.122, i), 0.14, 'square', 0.1, null, i * 0.05); },
    jackpot() { for (let i = 0; i < 16; i++) A.tone(440 * Math.pow(1.0595, (i % 8) * 2), 0.12, 'square', 0.12, null, i * 0.045); A.noise(0.8, 0.15, 3000, 8000, 0); },
    mult() { [523, 784, 1047].forEach((f, i) => A.tone(f, 0.2, 'triangle', 0.2, null, i * 0.08)); },
    tilt() { A.noise(0.7, 0.4, 150, 60, 0, 'lowpass'); A.tone(70, 0.7, 'sawtooth', 0.25, 35); },
    nudge() { A.noise(0.1, 0.25, 250, 100, 0, 'lowpass'); },
    bonus() { A.tone(1000, 0.05, 'square', 0.1); },
    extra() { for (let i = 0; i < 8; i++) A.tone(523 * Math.pow(1.0595, i * 2), 0.15, 'triangle', 0.2, null, i * 0.07); },
    thunder() { A.noise(1.8, 0.5, 400, 60, 0, 'lowpass'); A.noise(0.15, 0.4, 5000, 1000); },
    wormhole() { A.tone(900, 0.8, 'sine', 0.18, 80); A.noise(0.7, 0.15, 3000, 200); },
    boost() { A.tone(300, 0.18, 'sawtooth', 0.12, 1500); },
    magnet() { A.tone(110, 0.9, 'sine', 0.2, 330); A.tone(112, 0.9, 'sine', 0.2, 335); A.noise(0.6, 0.1, 200, 900); },
    chime(lv) { // EM-style 3 chime unit: 10s high, 100s mid, 1000s low
      const f = [1568, 1175, 784, 523][lv] || 784;
      A.tone(f, 1.1, 'sine', 0.16, null); A.tone(f * 2.76, 0.5, 'sine', 0.05, null); A.tone(f * 5.4, 0.2, 'sine', 0.02, null);
    },
    knocker() { A.noise(0.12, 0.7, 180, 60, 0, 'lowpass'); A.tone(55, 0.25, 'square', 0.35, 30); },
    bell() { for (let i = 0; i < 3; i++) { A.tone(2093, 0.25, 'triangle', 0.1, null, i * 0.07); A.tone(2637, 0.25, 'sine', 0.06, null, i * 0.07); } },
    thump() { A.noise(0.05, 0.3, 300, 80, 0, 'lowpass'); A.tone(70, 0.08, 'square', 0.14, 40); },
    reel() { A.noise(0.02, 0.12, 2500, 1200); },
    menu() { A.tone(700, 0.06, 'square', 0.08); },
    start() { [262, 330, 392, 523].forEach((f, i) => A.tone(f, 0.2, 'square', 0.14, null, i * 0.09)); },
    over() { [392, 330, 262, 196].forEach((f, i) => A.tone(f, 0.35, 'triangle', 0.2, f * 0.95, i * 0.2)); },
  };
  A.play = function (name, a) {
    if (!A.sfxOn || !A.ctx || !SFX[name]) return;
    SFX[name](a);
  };

  /* ---- rolling ball rumble (continuous) ---- */
  A.roll = function (level) {
    if (!A.ctx || !A.sfxOn) { if (A.rollG) A.rollG.gain.value = 0; return; }
    if (!A.rollG) {
      const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
      const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
      A.rollG = A.ctx.createGain(); A.rollG.gain.value = 0;
      s.connect(f); f.connect(A.rollG); A.rollG.connect(A.master); s.start(); A.rollF = f;
    }
    A.rollG.gain.setTargetAtTime(Math.min(0.22, level * 0.22), A.ctx.currentTime, 0.05);
    A.rollF.frequency.setTargetAtTime(180 + level * 500, A.ctx.currentTime, 0.05);
  };

  /* ---- generative music: bass + arpeggio + soft pad per table ---- */
  A.startMusic = function (m) {
    A.stopMusic();
    if (!A.ctx || !m) return;
    A.music = m; A.step = 0; A.nextT = A.ctx.currentTime + 0.1;
    A.timer = setInterval(A.tick, 60);
  };
  A.stopMusic = function () { if (A.timer) clearInterval(A.timer); A.timer = null; A.music = null; };
  A.tick = function () {
    const m = A.music;
    if (!m || !A.ctx) return;
    const sixteenth = 60 / m.tempo / 4;
    const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
    while (A.nextT < A.ctx.currentTime + 0.25) {
      const s = A.step, t = A.nextT - A.ctx.currentTime;
      const sc = m.scale;
      const bar = Math.floor(s / 16) % 4;
      const rootOff = [0, 0, sc[2 % sc.length], sc[3 % sc.length]][bar];
      if (s % 4 === 0) A.tone(hz(m.root - 12 + rootOff), sixteenth * 3.5, m.wave === 'sine' ? 'sine' : 'triangle', 0.22, null, t, A.musicGain);
      if (s % 2 === 0 || Math.random() < 0.25) {
        const pat = [0, 2, 1, 3, 2, 4, 3, 1];
        const idx = pat[(s >> 1) % pat.length] % sc.length;
        const oct = ((s >> 3) % 2) * 12;
        A.tone(hz(m.root + 12 + rootOff + sc[idx] + oct), sixteenth * 1.6, m.wave, 0.06, null, t, A.musicGain);
      }
      if (s % 16 === 0) A.tone(hz(m.root + rootOff + sc[2 % sc.length]), sixteenth * 15, 'sine', 0.07, null, t, A.musicGain);
      A.step++; A.nextT += sixteenth;
    }
  };
  A.setMusic = function (on) {
    A.musicOn = on;
    if (A.musicGain) A.musicGain.gain.setTargetAtTime(on ? 0.5 : 0, A.ctx.currentTime, 0.05);
  };

  P.Audio = A;
})(typeof globalThis !== 'undefined' ? globalThis : window);
