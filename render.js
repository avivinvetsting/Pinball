/* Canvas rendering: painted table artwork (pre-rendered) + dynamic layer + HUD. */
(function (G) {
  'use strict';
  const P = (G.Pin = G.Pin || {});
  const PI = Math.PI, TAU = PI * 2;
  const R = {};

  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function hexA(h, a) {
    const n = parseInt(h.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function shade(h, k) { // k>0 lighten, k<0 darken
    const n = parseInt(h.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  R.hexA = hexA;

  /* ------------------------------------------------------------ themes (bright, painted) */
  const THEMES = {
    neon: { f1: '#fbeaa6', f2: '#f6cf6a', cab: '#8a5a2a', cab2: '#5a3818', trim: '#a8743a', plastic: '#e8402e', plastic2: '#ffd23a', flip: '#f4f4ee', flipEdge: '#c0231d',
      bump: '#e8402e', bring: '#ffd23a', lamp: '#fff25a', ramp: '#7fd6ff', tA: '#2b7de0', tB: '#e8402e', glow: '#ffb400', glow2: '#e8402e', pg1: '#c98a4a', pg2: '#6a3a18', bnum: '10' },
    pirate: { f1: '#46d4ea', f2: '#1b8fc9', cab: '#7a4520', cab2: '#4e2a12', trim: '#5a3014', plastic: '#e2402a', plastic2: '#ffd23a', flip: '#ffe46b', flipEdge: '#8a3a12',
      bump: '#2a2a33', bring: '#ffcf5a', lamp: '#fff25a', ramp: '#ffe9a8', tA: '#f2c14e', tB: '#d6402a', glow: '#ffcf5a', glow2: '#31d0c8', pg1: '#1aa9d6', pg2: '#0a4d7a', bnum: '' },
    space: { f1: '#2a3fc4', f2: '#8a2fb8', cab: '#3a2a8a', cab2: '#201560', trim: '#6a5ad0', plastic: '#35e0ff', plastic2: '#ff4fd8', flip: '#4fe8ff', flipEdge: '#6a2aff',
      bump: '#ff4fd8', bring: '#35e0ff', lamp: '#aaffee', ramp: '#9fc4ff', tA: '#35e0ff', tB: '#ff4fd8', glow: '#35e0ff', glow2: '#ff4fd8', pg1: '#4a2aa8', pg2: '#150a50', bnum: '' },
    haunted: { f1: '#7a3aa8', f2: '#ee7a3a', cab: '#3a1c5a', cab2: '#241038', trim: '#ff8a1f', plastic: '#ff8a1f', plastic2: '#7ddc3a', flip: '#ff8a1f', flipEdge: '#4a1f7a',
      bump: '#ff8a1f', bring: '#7ddc3a', lamp: '#ffee66', ramp: '#b9f27a', tA: '#7ddc3a', tB: '#ff8a1f', glow: '#7ddc3a', glow2: '#c06bff', pg1: '#6a2c9a', pg2: '#26103a', bnum: '' },
    volcano: { f1: '#69cdf5', f2: '#1c8fd0', cab: '#1e6a3a', cab2: '#124a28', trim: '#6a3d1a', plastic: '#ff7a1a', plastic2: '#ffd23a', flip: '#ffd23a', flipEdge: '#c2380f',
      bump: '#ff5a1a', bring: '#ffd23a', lamp: '#fff25a', ramp: '#ffd9a0', tA: '#ffb400', tB: '#e2402a', glow: '#ff9a1a', glow2: '#ffd23a', pg1: '#1d8fd0', pg2: '#0a3f70', bnum: '' },
  };
  Object.assign(THEMES.neon,{cab:'#79213d',cab2:'#411d37',plastic:'#d63463',plastic2:'#eac469',bump:'#e54d47',bring:'#16b6ad',tA:'#18a69d',tB:'#d63463',glow:'#ffbf47',pg1:'#2d172c',pg2:'#070712'});
  Object.assign(THEMES.pirate,{cab:'#633318',cab2:'#2a1c16',plastic:'#267e75',plastic2:'#d4aa56',bump:'#7e2e26',bring:'#d4aa56',tA:'#a83d31',tB:'#d4aa56',glow:'#2de2d5',pg1:'#0c2d3a',pg2:'#050a14'});
  Object.assign(THEMES.space,{cab:'#1b3046',cab2:'#0a1729',plastic:'#62dce9',plastic2:'#ff684c',bump:'#d1e7e9',bring:'#35cfea',glow:'#00f2ff',pg1:'#121c44',pg2:'#050714'});
  Object.assign(THEMES.haunted,{cab:'#483448',cab2:'#211e2d',plastic:'#ad8a56',plastic2:'#a4df8a',bump:'#809776',bring:'#c2a477',glow:'#65ff90',pg1:'#231438',pg2:'#070612'});
  Object.assign(THEMES.volcano,{cab:'#3b3731',cab2:'#211c1b',plastic:'#e45725',plastic2:'#e5ad36',bump:'#e45725',bring:'#f4c348',glow:'#ff6a1a',pg1:'#36140d',pg2:'#0a0607'});
  THEMES.quest = { f1: '#16254f', f2: '#0b1230', cab: '#3a2a4a', cab2: '#1c1428', trim: '#c9a35a', plastic: '#b9323a', plastic2: '#e8b84a', flip: '#e8e2d0', flipEdge: '#7a1f26',
    bump: '#7a5cff', bring: '#e8b84a', lamp: '#ffd86a', ramp: '#e0b252', tA: '#e8b84a', tB: '#b9323a', glow: '#e8b84a', glow2: '#7a5cff', pg1: '#1b1038', pg2: '#07060f', bnum: '' };
  THEMES.spy = { f1: '#0e2a4a', f2: '#06142a', cab: '#1f2a38', cab2: '#0c121c', trim: '#8fb4d6', plastic: '#ff3b5c', plastic2: '#38d6ff', flip: '#e6f1fa', flipEdge: '#b01a3a',
    bump: '#38d6ff', bring: '#ff3b5c', lamp: '#fff25a', ramp: '#6fd3ff', tA: '#38d6ff', tB: '#ff3b5c', glow: '#38d6ff', glow2: '#ff3b5c', pg1: '#0a2b4a', pg2: '#030912', bnum: '' };
  THEMES.frenzy = { f1: '#241058', f2: '#0b0526', cab: '#3a1260', cab2: '#150630', trim: '#ff2bd6', plastic: '#ff2bd6', plastic2: '#27e8ff', flip: '#f4e9ff', flipEdge: '#9a1fd0',
    bump: '#27e8ff', bring: '#ff2bd6', lamp: '#fff25a', ramp: '#27e8ff', tA: '#27e8ff', tB: '#ff2bd6', glow: '#ff2bd6', glow2: '#27e8ff', pg1: '#2a0a52', pg2: '#07021a', bnum: '' };
  function TH(tb) {
    if (!tb._th) { tb.theme = Object.assign({}, tb.theme, THEMES[tb.id]); tb._th = 1; }
    return tb.theme;
  }
  R.theme = TH;

  /* ------------------------------------------------------------ drawing helpers */
  function glowText(ctx, txt, x, y, size, col, glow, align) {
    ctx.save();
    ctx.font = '900 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = glow || col; ctx.shadowBlur = size * 0.6;
    ctx.fillStyle = col; ctx.fillText(txt, x, y);
    ctx.restore();
  }
  function paintText(ctx, txt, x, y, size, fill, stroke, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.font = '900 ' + size + 'px "Trebuchet MS", Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = stroke || '#000'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = fill; ctx.fillText(txt, 0, 0); ctx.restore();
  }
  function lg(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
  function rg(ctx, x, y, r0, r1, stops, x2, y2) { const g = ctx.createRadialGradient(x, y, r0, x2 == null ? x : x2, y2 == null ? y : y2, r1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
  function circ(ctx, x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 1; ctx.strokeStyle = stroke; ctx.stroke(); } }
  function star(ctx, x, y, r, n, inner, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU + (rot || -PI / 2), rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function sunburst(ctx, cx, cy, r, n, c1, c2, rot) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU + (rot || 0), a1 = ((i + 1) / n) * TAU + (rot || 0);
      ctx.fillStyle = i % 2 ? c1 : c2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill();
    }
  }
  function cloud(ctx, x, y, s, col) {
    ctx.fillStyle = col || 'rgba(255,255,255,0.9)'; ctx.beginPath();
    ctx.arc(x, y, 16 * s, 0, TAU); ctx.arc(x + 18 * s, y - 8 * s, 20 * s, 0, TAU); ctx.arc(x + 40 * s, y, 17 * s, 0, TAU); ctx.arc(x + 20 * s, y + 6 * s, 18 * s, 0, TAU); ctx.fill();
  }
  function waveBand(ctx, y, amp, len, col, phase, bottom) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, bottom || 1000);
    for (let x = 0; x <= 600; x += 6) ctx.lineTo(x, y + Math.sin(x / len + phase) * amp);
    ctx.lineTo(600, bottom || 1000); ctx.closePath(); ctx.fill();
  }
  function foam(ctx, y, amp, len, phase, w) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = w || 3; ctx.lineCap = 'round'; ctx.beginPath();
    for (let x = 0; x <= 600; x += 6) { const yy = y + Math.sin(x / len + phase) * amp; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
    ctx.stroke();
  }
  function palm(ctx, x, y, h, lean, s) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(lean * 0.3, -h * 0.5, lean, -h); ctx.stroke();
    ctx.strokeStyle = '#a56a35'; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.moveTo(-1, 0); ctx.quadraticCurveTo(lean * 0.3 - 1, -h * 0.5, lean - 1, -h); ctx.stroke();
    ctx.translate(lean, -h);
    for (let i = 0; i < 7; i++) {
      const a = -PI / 2 + (i - 3) * 0.5;
      ctx.save(); ctx.rotate(a + PI / 2); ctx.fillStyle = i % 2 ? '#2f9e3a' : '#45bb4a';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14 * s, -26 * s, 4 * s, -52 * s); ctx.quadraticCurveTo(-6 * s, -28 * s, 0, 0); ctx.fill(); ctx.restore();
    }
    circ(ctx, 0, 2, 4 * s, '#6a3a18'); circ(ctx, 6 * s, 4, 4 * s, '#6a3a18');
    ctx.restore();
  }
  function skull(ctx, x, y, s, col, eye) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -3, 14, PI, TAU); ctx.lineTo(10, 12); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = eye || '#2a1a10'; circ(ctx, -5, -3, 3.6, eye || '#2a1a10'); circ(ctx, 5, -3, 3.6, eye || '#2a1a10');
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-2, 6); ctx.lineTo(2, 6); ctx.fill();
    ctx.fillRect(-6, 9, 2, 5); ctx.fillRect(-1, 9, 2, 5); ctx.fillRect(4, 9, 2, 5);
    ctx.restore();
  }
  function pumpkin(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const dx of [-12, 12, 0]) { ctx.fillStyle = dx ? '#e8671a' : '#ff8a1f'; ctx.beginPath(); ctx.ellipse(dx, 0, dx ? 12 : 15, 17, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#3d8a2a'; ctx.fillRect(-2, -22, 5, 8);
    ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(-3, -4); ctx.lineTo(-6, -10); ctx.fill(); ctx.beginPath(); ctx.moveTo(9, -4); ctx.lineTo(3, -4); ctx.lineTo(6, -10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-5, 11); ctx.lineTo(0, 6); ctx.lineTo(5, 11); ctx.lineTo(10, 5); ctx.lineTo(0, 9); ctx.fill();
    ctx.restore();
  }
  function ghost(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col || 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(0, -4, 15, PI, TAU); ctx.lineTo(15, 16);
    for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(15 - i * 7.5 - 3.75, 9, 15 - (i + 1) * 7.5, 16);
    ctx.closePath(); ctx.fill(); circ(ctx, -5, -4, 3, '#222'); circ(ctx, 5, -4, 3, '#222'); ctx.beginPath(); ctx.ellipse(0, 4, 3, 4.5, 0, 0, TAU); ctx.fillStyle = '#222'; ctx.fill();
    ctx.restore();
  }
  function bat(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col || '#2a1646';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-14, -16, -30, -4); ctx.quadraticCurveTo(-20, -2, -16, 8); ctx.quadraticCurveTo(-7, 0, 0, 9); ctx.quadraticCurveTo(7, 0, 16, 8); ctx.quadraticCurveTo(20, -2, 30, -4); ctx.quadraticCurveTo(14, -16, 0, 0); ctx.fill();
    ctx.restore();
  }
  function tomb(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col || '#a9b2a9';
    ctx.beginPath(); ctx.moveTo(-16, 30); ctx.lineTo(-16, 0); ctx.arc(0, 0, 16, PI, TAU); ctx.lineTo(16, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(10, 0, 6, 30);
    paintText(ctx, 'RIP', 0, 8, 10, '#5a655a', 'rgba(255,255,255,0.4)');
    ctx.restore();
  }
  function insertArrow(ctx, x, y, a, col, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s || 1, s || 1);
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(13, -2); ctx.lineTo(5, -2); ctx.lineTo(5, 15); ctx.lineTo(-5, 15); ctx.lineTo(-5, -2); ctx.lineTo(-13, -2); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
    ctx.restore();
  }
  function insertStar(ctx, x, y, r, col) {
    star(ctx, x, y, r, 5, 0.5); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
  }
  function face(ctx, x, y, s, skin, hair) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    circ(ctx, 0, 0, 15, skin, '#2a1a10', 1.5);
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -4, 15, PI, TAU); ctx.lineTo(10, -8); ctx.lineTo(-10, -8); ctx.fill();
    circ(ctx, -5, 0, 2.4, '#fff', '#222', 1); circ(ctx, 5, 0, 2.4, '#fff', '#222', 1); circ(ctx, -5, 0.4, 1.1, '#222'); circ(ctx, 5, 0.4, 1.1, '#222');
    ctx.strokeStyle = '#a02020'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 4, 6, 0.2, PI - 0.2); ctx.stroke();
    circ(ctx, -9, 5, 2.5, 'rgba(255,90,90,0.45)'); circ(ctx, 9, 5, 2.5, 'rgba(255,90,90,0.45)');
    ctx.restore();
  }
  function tiki(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#8a4b1f'; ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(14, -18); ctx.lineTo(12, 18); ctx.lineTo(-12, 18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a2410'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = '#ffd23a'; circ(ctx, -6, -6, 4, '#ffd23a', '#4a2410', 1.2); circ(ctx, 6, -6, 4, '#ffd23a', '#4a2410', 1.2); circ(ctx, -6, -6, 1.5, '#222'); circ(ctx, 6, -6, 1.5, '#222');
    ctx.fillStyle = '#4a2410'; ctx.fillRect(-7, 4, 14, 8); ctx.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) ctx.fillRect(i * 2.6 - 1, 4, 2, 4);
    ctx.fillStyle = '#e2402a'; ctx.fillRect(-12, -20, 24, 4);
    ctx.restore();
  }
  function alien(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#7dff6a'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 17, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#1a5a20'; ctx.stroke();
    ctx.fillStyle = '#10201a'; ctx.beginPath(); ctx.ellipse(-6, -2, 4.5, 7, -0.5, 0, TAU); ctx.ellipse(6, -2, 4.5, 7, 0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a5a20'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 8, 4, 0.2, PI - 0.2); ctx.stroke();
    ctx.restore();
  }
  function spark(ctx, x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }

  /* ------------------------------------------------------------ table artwork (static) */
  const DECOR = {
    /* CLASSIC 1960s flipper game – cream playfield, brick arch, cartoon faces */
    neon(ctx, tb, th) {
      const rnd = rng(7);
      // painted yellow field with soft sunburst
      sunburst(ctx, 282, 330, 900, 36, '#fcefb4', '#f8dc86', 0.05);
      // green + red stripes along the bottom like the real thing
      ctx.fillStyle = '#2ea36a'; ctx.beginPath(); ctx.moveTo(0, 790); ctx.quadraticCurveTo(282, 740, 600, 790); ctx.lineTo(600, 1000); ctx.lineTo(0, 1000); ctx.fill();
      ctx.fillStyle = '#f4c542'; ctx.beginPath(); ctx.moveTo(0, 830); ctx.quadraticCurveTo(282, 780, 600, 830); ctx.lineTo(600, 1000); ctx.lineTo(0, 1000); ctx.fill();
      ctx.fillStyle = '#d6352a'; ctx.beginPath(); ctx.moveTo(0, 870); ctx.quadraticCurveTo(282, 820, 600, 870); ctx.lineTo(600, 1000); ctx.lineTo(0, 1000); ctx.fill();
      // brick arch at the top
      ctx.save(); ctx.beginPath(); ctx.rect(100, 40, 365, 105); ctx.clip();
      ctx.fillStyle = '#b3402a'; ctx.fillRect(100, 40, 365, 105);
      for (let y = 40, row = 0; y < 145; y += 13, row++) for (let x = 100 - (row % 2) * 16; x < 465; x += 32) { ctx.fillStyle = (row + (x / 32 | 0)) % 3 ? '#c4553a' : '#a8341f'; ctx.fillRect(x + 1, y + 1, 30, 11); }
      ctx.restore();
      // white lane tubes with numbers 1 2 1 2
      [192, 242, 292, 342].forEach((x, i) => {
        ctx.fillStyle = '#fffdf2'; ctx.beginPath(); ctx.roundRect(x - 15, 62, 30, 82, 14); ctx.fill(); ctx.strokeStyle = '#c9b88a'; ctx.lineWidth = 2; ctx.stroke();
        circ(ctx, x, 80, 10, i % 2 ? '#ffb400' : '#e8402e', '#7a3a10', 2); paintText(ctx, String(i + 1), x, 81, 13, '#fff', '#5a2a08');
      });
      // blue water swoosh across the middle with white foam
      ctx.save(); ctx.beginPath(); ctx.moveTo(20, 470); ctx.bezierCurveTo(150, 440, 250, 520, 380, 470); ctx.bezierCurveTo(470, 440, 520, 440, 560, 470); ctx.lineTo(560, 780); ctx.bezierCurveTo(400, 800, 300, 700, 20, 770); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#38a8e8'; ctx.fillRect(0, 400, 600, 400);
      for (let i = 0; i < 10; i++) foam(ctx, 470 + i * 34, 10, 28 + i, i * 0.9, 3);
      ctx.restore();
      // cream panel behind the holes with numbered tapered slots
      ctx.fillStyle = '#fff6d6'; ctx.strokeStyle = '#c9a85a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(120, 398, 325, 215, [30, 30, 10, 10]); ctx.fill(); ctx.stroke();
      [171, 243, 314, 386].forEach((x, k) => {
        ctx.fillStyle = k % 2 ? '#f4a6a0' : '#ffe9a8'; ctx.beginPath(); ctx.moveTo(x - 24, 450); ctx.lineTo(x + 24, 450); ctx.lineTo(x + 8, 605); ctx.lineTo(x - 8, 605); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#b08a3a'; ctx.lineWidth = 2; ctx.stroke();
        for (let n = 0; n < 4; n++) { circ(ctx, x, 470 + n * 36, 9, '#fff', '#555', 1.5); paintText(ctx, String(k % 2 ? 4 - n : n + 1), x, 471 + n * 36, 11, '#222', '#fff'); }
        circ(ctx, x, 430, 17, '#fff6d6', '#8a6a2a', 2.5);
      });
      paintText(ctx, 'HOLES SCORE 1000 TO 5000 POINTS', 282, 448, 11, '#8a2a1a', '#fff6d6');
      // special triangle + 100 points
      ctx.fillStyle = '#e8402e'; ctx.beginPath(); ctx.moveTo(277, 232); ctx.lineTo(300, 272); ctx.lineTo(254, 272); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7a1a10'; ctx.lineWidth = 2.5; ctx.stroke();
      paintText(ctx, 'SPECIAL', 277, 283, 12, '#c4202c', '#fff7dc');
      paintText(ctx, '100', 277, 318, 14, '#c4202c', '#fff7dc'); paintText(ctx, 'POINTS', 277, 345, 10, '#c4202c', '#fff7dc');
      // cartoon characters on the sides
      const man = (x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); face(ctx, 0, 0, 1.4, '#ffd9b3', '#3a2a1a'); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(0, -16, 24, 6, 0, 0, TAU); ctx.fill(); ctx.fillRect(-12, -30, 24, 14); ctx.fillStyle = '#3a3a8a'; ctx.beginPath(); ctx.roundRect(-18, 24, 36, 50, 8); ctx.fill(); ctx.restore(); };
      man(500, 330, 1); man(70, 540, 0.9);
      // numbered lane discs
      [[60, 640, '4'], [505, 640, '4']].forEach((d) => { circ(ctx, d[0], d[1], 14, '#ffd23a', '#7a4a00', 2.5); paintText(ctx, d[2], d[0], d[1] + 1, 16, '#c4202c', '#fff7dc'); });
      // red ribbon
      ctx.save(); ctx.translate(282, 658); ctx.fillStyle = '#c4202c'; ctx.beginPath(); ctx.moveTo(-130, -18); ctx.lineTo(130, -18); ctx.lineTo(146, 0); ctx.lineTo(130, 18); ctx.lineTo(-130, 18); ctx.lineTo(-146, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7a0f18'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      paintText(ctx, 'CLASSIC FLIPPER', 282, 658, 22, '#fff7dc', '#7a0f18');
      for (let i = 0; i < 40; i++) { ctx.fillStyle = ['#e8402e', '#2b7de0', '#2bb673'][i % 3]; star(ctx, 30 + rnd() * 505, 150 + rnd() * 250, 3 + rnd() * 2.5, 5, 0.5); ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1; }
      tb.inserts = [];
      tb.slingArt = (c, x, y, m) => { face(c, x - 12, y + 6, 1.0, '#ffd9b3', '#d94a1a'); face(c, x + 10, y + 8, 1.0, '#ffd9b3', '#3a2a1a'); face(c, x, y - 8, 1.0, '#ffd9b3', '#222'); };
    },

    /* PIRATE COVE – bright tropical sea */
    pirate(ctx, tb, th) {
      const rnd = rng(11);
      // sun glow + caustics
      ctx.fillStyle = rg(ctx, 450, 90, 10, 360, [[0, 'rgba(255,250,200,0.95)'], [0.25, 'rgba(255,240,150,0.45)'], [1, 'rgba(255,240,150,0)']]); ctx.fillRect(0, 0, 600, 600);
      for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + rnd() * 0.12) + ')'; ctx.beginPath(); ctx.ellipse(30 + rnd() * 510, 40 + rnd() * 880, 8 + rnd() * 24, 2 + rnd() * 5, rnd() * 0.5, 0, TAU); ctx.fill(); }
      for (let r = 0; r < 7; r++) { foam(ctx, 120 + r * 120, 7, 24 + r * 3, r, 2.4); }
      // island + palms
      ctx.fillStyle = '#f0d58a'; ctx.beginPath(); ctx.ellipse(282, 690, 190, 58, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d9b86a'; ctx.beginPath(); ctx.ellipse(282, 700, 190, 52, 0, 0.1, PI - 0.1); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(282, 692, 200, 66, 0, 0, TAU); ctx.stroke();
      palm(ctx, 205, 680, 95, -22, 1.1); palm(ctx, 355, 686, 85, 26, 1);
      // treasure map parchment
      ctx.save(); ctx.translate(282, 465); ctx.rotate(-0.05);
      ctx.fillStyle = lg(ctx, 0, -60, 0, 60, [[0, '#f8e7b6'], [1, '#e2c383']]); ctx.strokeStyle = '#9a6a30'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-120, -58, 240, 116, 10); ctx.fill(); ctx.stroke();
      ctx.setLineDash([6, 7]); ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-95, 35); ctx.bezierCurveTo(-50, -45, 10, 50, 85, -25); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#c4202c'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(78, -32); ctx.lineTo(94, -16); ctx.moveTo(94, -32); ctx.lineTo(78, -16); ctx.stroke();
      ctx.restore();
      // galleon
      ctx.save(); ctx.translate(430, 330); ctx.scale(1.15, 1.15);
      ctx.fillStyle = '#6b3b1a'; ctx.beginPath(); ctx.moveTo(-50, 8); ctx.lineTo(50, 8); ctx.lineTo(36, 36); ctx.lineTo(-36, 36); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3a200c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#f2c14e'; ctx.fillRect(-44, 14, 88, 4);
      for (const mx of [-22, 6, 32]) { ctx.strokeStyle = '#3a200c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx, 8); ctx.lineTo(mx, -52); ctx.stroke(); ctx.fillStyle = '#fff8e6'; ctx.strokeStyle = '#b99c60'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx - 14, -46); ctx.quadraticCurveTo(mx, -38, mx + 14, -46); ctx.lineTo(mx + 13, -8); ctx.quadraticCurveTo(mx, 2, mx - 13, -8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      skull(ctx, 6, -26, 0.5, '#2a2a2a', '#fff');
      ctx.restore();
      foam(ctx, 372, 4, 10, 0, 4);
      // gulls + anchors
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (const [x, y] of [[150, 60], [200, 85], [380, 55]]) { ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.quadraticCurveTo(x - 4, y - 8, x, y); ctx.quadraticCurveTo(x + 4, y - 8, x + 10, y); ctx.stroke(); }
      // barrels/rope border near bottom
      tb.inserts = [[190, 305, 0, '#ffd23a'], [375, 305, 0, '#ffd23a'], [105, 600, 0, '#ffe9a8'], [282, 400, 0, '#ff6a4a'], [470, 560, -0.4, '#ffd23a']];
      tb.slingArt = (c, x, y) => skull(c, x, y + 2, 1.3, '#f4efe0', '#2a1a10');
    },

    /* SPACE ODYSSEY – vivid cosmic colours */
    space(ctx, tb, th) {
      const rnd = rng(23);
      const blobs = [[120, 180, 230, '#22e0ff', 0.55], [470, 260, 260, '#ff3fd0', 0.5], [290, 520, 300, '#ff9a3a', 0.35], [90, 760, 260, '#7a4aff', 0.6], [470, 800, 240, '#22e0ff', 0.35], [300, 60, 200, '#ff3fd0', 0.35]];
      ctx.globalCompositeOperation = 'lighter';
      for (const b of blobs) { ctx.fillStyle = rg(ctx, b[0], b[1], 4, b[2], [[0, hexA(b[3], b[4])], [1, hexA(b[3], 0)]]); ctx.fillRect(0, 0, 600, 1000); }
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 260; i++) { const s = rnd() < 0.08 ? 2.4 : 1.2; ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + rnd() * 0.6) + ')'; ctx.fillRect(22 + rnd() * 520, 22 + rnd() * 940, s, s); }
      for (let i = 0; i < 14; i++) spark(ctx, 40 + rnd() * 480, 40 + rnd() * 700, 5 + rnd() * 8, 'rgba(255,255,255,0.9)');
      // earth
      ctx.save(); ctx.translate(125, 330); ctx.fillStyle = rg(ctx, -14, -14, 4, 52, [[0, '#8fe4ff'], [0.6, '#1d7fe0'], [1, '#0a2a8a']]); circ(ctx, 0, 0, 50, ctx.fillStyle);
      ctx.fillStyle = '#3dbb4a'; ctx.beginPath(); ctx.ellipse(-12, -8, 16, 12, 0.5, 0, TAU); ctx.ellipse(14, 14, 12, 9, -0.3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(8, -22, 16, 5, 0.2, 0, TAU); ctx.fill(); ctx.restore();
      // saturn
      ctx.save(); ctx.translate(440, 590); ctx.rotate(-0.4); ctx.fillStyle = rg(ctx, -10, -10, 4, 46, [[0, '#ffe3a0'], [0.6, '#ff9a3a'], [1, '#a02a6a']]); circ(ctx, 0, 0, 42, ctx.fillStyle);
      ctx.strokeStyle = 'rgba(255,230,180,0.9)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, 0, 76, 18, 0, 0.12, PI - 0.12); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 76, 18, 0, PI + 0.12, TAU - 0.12); ctx.stroke(); ctx.restore();
      // moon
      circ(ctx, 150, 640, 30, rg(ctx, 140, 630, 3, 34, [[0, '#ffffff'], [1, '#b0b8d0']])); for (const [x, y, r] of [[140, 632, 7], [160, 650, 5], [152, 622, 4]]) circ(ctx, x, y, r, 'rgba(120,130,160,0.5)');
      // orbit rings + ufo
      ctx.setLineDash([5, 8]); ctx.strokeStyle = 'rgba(160,255,255,0.7)'; ctx.lineWidth = 2; for (const r of [55, 92, 130]) { ctx.beginPath(); ctx.arc(282, 255, r, 0, TAU); ctx.stroke(); } ctx.setLineDash([]);
      ctx.save(); ctx.translate(430, 215); ctx.rotate(0.2); ctx.fillStyle = '#c9d4ff'; ctx.beginPath(); ctx.ellipse(0, 4, 30, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,255,255,0.8)'; ctx.beginPath(); ctx.arc(0, 0, 14, PI, TAU); ctx.fill();
      for (const x of [-18, -6, 6, 18]) circ(ctx, x, 5, 2.2, '#ffe14a'); ctx.restore();
      // rocket
      ctx.save(); ctx.translate(110, 740); ctx.rotate(0.55); ctx.fillStyle = '#f4f6ff'; ctx.beginPath(); ctx.moveTo(0, -38); ctx.quadraticCurveTo(16, -12, 11, 24); ctx.lineTo(-11, 24); ctx.quadraticCurveTo(-16, -12, 0, -38); ctx.fill(); ctx.strokeStyle = '#8a94c4'; ctx.lineWidth = 1.5; ctx.stroke();
      circ(ctx, 0, -8, 6, '#35e0ff', '#1a4a8a', 2); ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.moveTo(0, -38); ctx.quadraticCurveTo(7, -28, 8, -22); ctx.lineTo(-8, -22); ctx.quadraticCurveTo(-7, -28, 0, -38); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-11, 12); ctx.lineTo(-22, 30); ctx.lineTo(-11, 24); ctx.fill(); ctx.beginPath(); ctx.moveTo(11, 12); ctx.lineTo(22, 30); ctx.lineTo(11, 24); ctx.fill();
      ctx.fillStyle = '#ffb02a'; ctx.beginPath(); ctx.moveTo(-7, 24); ctx.lineTo(0, 52); ctx.lineTo(7, 24); ctx.fill(); ctx.fillStyle = '#ffee66'; ctx.beginPath(); ctx.moveTo(-3, 24); ctx.lineTo(0, 40); ctx.lineTo(3, 24); ctx.fill(); ctx.restore();
      paintText(ctx, 'SPACE ODYSSEY', 282, 690, 28, '#aaffee', '#1a1a7a');
      tb.inserts = [[160, 235, 0, '#35e0ff'], [405, 235, 0, '#ff4fd8'], [282, 420, 0, '#ffee66'], [95, 520, 0, '#35e0ff'], [470, 520, 0, '#ff4fd8']];
      tb.slingArt = (c, x, y) => alien(c, x, y + 2, 1.3);
    },

    /* HAUNTED MANOR – cartoon Halloween */
    haunted(ctx, tb, th) {
      const rnd = rng(31);
      ctx.fillStyle = lg(ctx, 0, 0, 0, 640, [[0, '#4a1e86'], [0.45, '#9a3fa8'], [0.8, '#f2703a'], [1, '#ffb347']]); ctx.fillRect(0, 0, 600, 640);
      for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd() * 0.6) + ')'; ctx.fillRect(25 + rnd() * 515, 25 + rnd() * 380, 1.6, 1.6); }
      // moon
      ctx.fillStyle = rg(ctx, 430, 130, 40, 190, [[0, 'rgba(255,200,90,0.9)'], [1, 'rgba(255,200,90,0)']]); ctx.fillRect(230, 0, 370, 330);
      circ(ctx, 430, 130, 66, rg(ctx, 415, 115, 6, 70, [[0, '#fff2b0'], [1, '#ffb23a']])); for (const [x, y, r] of [[410, 108, 11], [450, 140, 8], [425, 150, 6]]) circ(ctx, x, y, r, 'rgba(210,130,40,0.5)');
      // mansion
      ctx.save(); ctx.translate(282, 545); ctx.fillStyle = '#2a1650';
      ctx.fillRect(-120, -80, 240, 80); ctx.fillRect(-150, -120, 60, 120); ctx.fillRect(90, -110, 60, 110);
      for (const [x, w, h, y] of [[-150, 60, 50, -120], [90, 60, 46, -110], [-60, 120, 52, -80]]) { ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w + 6, y); ctx.fill(); }
      ctx.fillRect(-14, -170, 28, 50); ctx.beginPath(); ctx.moveTo(-18, -170); ctx.lineTo(0, -205); ctx.lineTo(18, -170); ctx.fill();
      ctx.fillStyle = '#ffe14a'; for (const [x, y] of [[-135, -100], [-115, -100], [105, -92], [125, -92], [-95, -60], [-60, -60], [-25, -60], [25, -60], [60, -60], [95, -60], [-6, -150]]) { ctx.beginPath(); ctx.roundRect(x - 6, y - 10, 12, 18, [6, 6, 0, 0]); ctx.fill(); }
      ctx.fillStyle = '#12082a'; ctx.beginPath(); ctx.roundRect(-14, -34, 28, 34, [14, 14, 0, 0]); ctx.fill(); ctx.restore();
      // ground / graveyard hill
      ctx.fillStyle = '#3d9a3a'; ctx.beginPath(); ctx.moveTo(0, 560); ctx.quadraticCurveTo(150, 520, 282, 560); ctx.quadraticCurveTo(420, 600, 600, 540); ctx.lineTo(600, 1000); ctx.lineTo(0, 1000); ctx.fill();
      ctx.fillStyle = '#2d7a2f'; ctx.beginPath(); ctx.moveTo(0, 700); ctx.quadraticCurveTo(300, 640, 600, 710); ctx.lineTo(600, 1000); ctx.lineTo(0, 1000); ctx.fill();
      for (const [x, y, s] of [[100, 640, 0.9], [175, 668, 0.8], [395, 664, 0.8], [470, 640, 0.9]]) tomb(ctx, x, y, s);
      pumpkin(ctx, 62, 705, 1.1); pumpkin(ctx, 505, 705, 1.1); pumpkin(ctx, 282, 735, 0.9);
      // slime drips along the top
      ctx.fillStyle = '#7ddc3a'; for (let i = 0; i < 14; i++) { const x = 60 + i * 36 + rnd() * 10, h = 18 + rnd() * 44; ctx.beginPath(); ctx.moveTo(x - 9, 0); ctx.lineTo(x + 9, 0); ctx.lineTo(x + 5, h); ctx.arc(x, h, 5, 0, PI); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, 0, 0);
      // bats
      bat(ctx, 130, 400, 1); bat(ctx, 330, 470, 0.8); bat(ctx, 470, 380, 1.1); bat(ctx, 215, 130, 0.7);
      // web
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const a = PI / 2 * (i / 5); ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(30 + Math.cos(a) * 110, 30 + Math.sin(a) * 110); ctx.stroke(); } for (let r = 28; r <= 110; r += 27) { ctx.beginPath(); ctx.arc(30, 30, r, 0, PI / 2); ctx.stroke(); }
      tb.inserts = [[175, 250, 0, '#7ddc3a'], [390, 250, 0, '#7ddc3a'], [282, 230, 0, '#ffe14a'], [140, 470, -0.8, '#ff8a1f'], [425, 470, 0.8, '#ff8a1f']];
      tb.slingArt = (c, x, y) => ghost(c, x, y + 2, 1.3);
    },

    /* VOLCANO ISLAND – tropical */
    volcano(ctx, tb, th) {
      const rnd = rng(47);
      ctx.fillStyle = lg(ctx, 0, 0, 0, 520, [[0, '#4cb8f0'], [1, '#c4ecfa']]); ctx.fillRect(0, 0, 600, 540);
      cloud(ctx, 60, 110, 1.2); cloud(ctx, 430, 90, 1.1); cloud(ctx, 440, 300, 0.8);
      // ocean
      ctx.fillStyle = lg(ctx, 0, 520, 0, 1000, [[0, '#2ab0e8'], [1, '#0a5aa8']]); ctx.fillRect(0, 520, 600, 480);
      for (let r = 0; r < 6; r++) foam(ctx, 560 + r * 70, 6, 20 + r * 3, r, 2.6);
      // jungle shoulders
      for (const sd of [-1, 1]) {
        const base = sd < 0 ? 20 : 545;
        ctx.fillStyle = '#2f9a3a'; ctx.beginPath(); ctx.moveTo(base, 560); ctx.quadraticCurveTo(base + sd * -80, 420, base + sd * -150, 330); ctx.lineTo(base + sd * -150, 560); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#45bb4a'; ctx.beginPath(); ctx.moveTo(base, 600); ctx.quadraticCurveTo(base + sd * -90, 480, base + sd * -110, 420); ctx.lineTo(base + sd * -110, 600); ctx.closePath(); ctx.fill();
      }
      // volcano
      ctx.fillStyle = lg(ctx, 100, 0, 470, 0, [[0, '#a86a3a'], [0.5, '#7a4a2a'], [1, '#4e2e1a']]);
      ctx.beginPath(); ctx.moveTo(60, 570); ctx.lineTo(215, 245); ctx.lineTo(250, 205); ctx.lineTo(315, 205); ctx.lineTo(350, 245); ctx.lineTo(505, 570); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(250 + i * 11, 210); ctx.lineTo(150 + i * 45, 560); ctx.stroke(); }
      // crater glow + lava
      circ(ctx, 282, 207, 38, rg(ctx, 282, 207, 4, 40, [[0, '#fff6a0'], [0.5, '#ffb02a'], [1, '#ff5a1a']]));
      ctx.fillStyle = rg(ctx, 282, 200, 20, 200, [[0, 'rgba(255,170,40,0.6)'], [1, 'rgba(255,120,20,0)']]); ctx.fillRect(100, 60, 360, 300);
      for (const [dx, w] of [[-14, 11], [10, 14], [-2, 9]]) { ctx.fillStyle = lg(ctx, 0, 210, 0, 480, [[0, '#ffee66'], [0.5, '#ff9a1a'], [1, '#e2402a']]); ctx.beginPath(); ctx.moveTo(282 + dx - w / 2, 215); ctx.quadraticCurveTo(282 + dx * 5, 330, 282 + dx * 9, 470); ctx.lineTo(282 + dx * 9 + w * 1.5, 470); ctx.quadraticCurveTo(282 + dx * 5 + w, 330, 282 + dx + w / 2, 215); ctx.fill(); }
      // smoke
      for (const [x, y, s] of [[262, 140, 1.5], [310, 112, 1.3], [250, 80, 1.1], [330, 60, 1]]) cloud(ctx, x - 20, y, s, 'rgba(235,235,240,0.92)');
      for (let i = 0; i < 26; i++) { ctx.fillStyle = rnd() < 0.5 ? '#ffd23a' : '#ff7a1a'; circ(ctx, 215 + rnd() * 150, 120 + rnd() * 100, 1.5 + rnd() * 2.5, ctx.fillStyle); }
      palm(ctx, 62, 540, 120, 18, 1.2); palm(ctx, 505, 546, 110, -22, 1.1); palm(ctx, 120, 600, 70, 10, 0.9); palm(ctx, 450, 610, 70, -12, 0.9);
      // tropical flowers
      for (const [x, y] of [[90, 480], [480, 470], [150, 520], [420, 520]]) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; circ(ctx, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, '#ff4f8a'); } circ(ctx, x, y, 4, '#ffd23a'); }
      tb.inserts = [[282, 150, 0, '#ffee66'], [195, 300, -0.6, '#ff7a1a'], [370, 300, 0.6, '#ff7a1a'], [282, 400, 0, '#ffd23a'], [105, 540, 0, '#ffd23a'], [460, 540, 0, '#ffd23a']];
      tb.slingArt = (c, x, y) => tiki(c, x, y + 1, 1.3);
    },
    /* Blueprint tables: the embedded blueprint print covers the field; these are the no-artwork fallbacks. */
    quest(ctx, tb, th) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, 1000, [[0, '#1d2f66'], [1, '#0b1230']]); ctx.fillRect(0, 0, 600, 1000);
      ctx.strokeStyle = 'rgba(201,163,90,0.18)'; ctx.lineWidth = 1.5;
      for (let y = 40, row = 0; y < 940; y += 26, row++) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(545, y); ctx.stroke(); for (let x = 20 + (row % 2) * 30; x < 545; x += 60) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 26); ctx.stroke(); } }
      tb.inserts = [];
    },
    spy(ctx, tb, th) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, 1000, [[0, '#0e2a4a'], [1, '#06142a']]); ctx.fillRect(0, 0, 600, 1000);
      ctx.strokeStyle = 'rgba(56,214,255,0.16)'; ctx.lineWidth = 1.5;
      for (const r of [60, 120, 180, 240, 300]) { ctx.beginPath(); ctx.arc(282, 540, r, 0, TAU); ctx.stroke(); }
      tb.inserts = [];
    },
    frenzy(ctx, tb, th) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, 1000, [[0, '#2a0a52'], [0.55, '#14083a'], [1, '#07021a']]); ctx.fillRect(0, 0, 600, 1000);
      tb.inserts = [];
    },
  };

  function shellPath(ctx) {
    ctx.beginPath(); ctx.moveTo(20, 1000); ctx.lineTo(20, 300);
    for (let a = 0; a <= 60; a++) { const an = PI + (PI * a) / 60; ctx.lineTo(300 + 280 * Math.cos(an), 300 + 280 * Math.sin(an)); }
    ctx.lineTo(580, 1000); ctx.closePath();
  }

  /* ------------------------------------------------------------ static background */
  R.makeBG = function (tb, pxScale, artworkOnly) {
    const th = TH(tb);
    const c = document.createElement('canvas');
    c.width = Math.ceil(600 * pxScale); c.height = Math.ceil(1000 * pxScale);
    const ctx = c.getContext('2d');
    ctx.scale(pxScale, pxScale);
    const rnd = rng(99);
    // cabinet around the playfield
    ctx.fillStyle = lg(ctx, 0, 0, 600, 0, [[0, th.cab], [0.5, shade(th.cab, 0.15)], [1, th.cab2]]); ctx.fillRect(0, 0, 600, 1000);
    for (let i = 0; i < 600; i++) { ctx.fillStyle = 'rgba(255,255,255,' + rnd() * 0.05 + ')'; ctx.fillRect(rnd() * 600, rnd() * 1000, 1 + rnd() * 18, 1); }
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 596, 996);
    // painted playfield
    ctx.save(); shellPath(ctx); ctx.clip();
    ctx.fillStyle = lg(ctx, 0, 0, 0, 1000, [[0, th.f1], [1, th.f2]]); ctx.fillRect(0, 0, 600, 1000);
    DECOR[tb.id](ctx, tb, th);
    if (P.Art && P.Art[tb.id]) {
      // Original, purpose-made print under the physical hardware (also works in Canvas fallback).
      ctx.drawImage(P.Art[tb.id], 20, 0, 525, 940);
      tb.inserts = [];
      ctx.save();
      // Distinct architectural floor treatment per table so every machine has a unique surface & silhouette
      if (tb.floorStyle === 'cyber') {
        ctx.fillStyle = 'rgba(5, 8, 24, 0.74)';
        ctx.fillRect(20, 0, 525, 940);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.22)';
        ctx.lineWidth = 1.2;
        for (let gx = 45; gx < 545; gx += 36) { ctx.beginPath(); ctx.moveTo(gx, 40); ctx.lineTo(gx, 920); ctx.stroke(); }
        for (let gy = 60; gy < 920; gy += 36) { ctx.beginPath(); ctx.moveTo(20, gy); ctx.lineTo(545, gy); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255, 42, 157, 0.48)';
        ctx.lineWidth = 2.5;
        for (const r of [56, 92, 134]) { ctx.beginPath(); ctx.arc(282, 305, r, 0, TAU); ctx.stroke(); }
      } else if (tb.floorStyle === 'deco') {
        ctx.strokeStyle = 'rgba(242, 193, 90, 0.42)';
        ctx.lineWidth = 2.5;
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(60 + k * 14, 720); ctx.lineTo(282, 560 - k * 18); ctx.lineTo(504 - k * 14, 720); ctx.stroke(); }
      } else if (tb.floorStyle === 'ocean') {
        ctx.fillStyle = rg(ctx, 475, 535, 6, 76, [[0, 'rgba(5, 22, 34, 0.92)'], [0.55, 'rgba(53, 232, 220, 0.45)'], [1, 'rgba(53, 232, 220, 0)']]);
        ctx.beginPath(); ctx.arc(475, 535, 76, 0, TAU); ctx.fill();
      } else if (tb.floorStyle === 'catacomb') {
        ctx.fillStyle = 'rgba(10, 7, 20, 0.36)';
        ctx.fillRect(20, 0, 525, 940);
        ctx.strokeStyle = 'rgba(101, 255, 144, 0.25)';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(235, 395, 74, 0, TAU); ctx.stroke();
      } else if (tb.floorStyle === 'castle') {
        // dark flagstone wash + gold mortar lines, a heraldic ring behind the Knight bumper
        ctx.fillStyle = 'rgba(8, 10, 30, 0.34)'; ctx.fillRect(20, 0, 525, 940);
        ctx.strokeStyle = 'rgba(232, 184, 74, 0.2)'; ctx.lineWidth = 1.4;
        for (let y = 60, row = 0; y < 930; y += 38, row++) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(545, y); ctx.stroke(); for (let x = 20 + (row % 2) * 45; x < 545; x += 90) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 38); ctx.stroke(); } }
        ctx.strokeStyle = 'rgba(194, 58, 58, 0.45)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(290, 420, 52, 0, TAU); ctx.stroke();
      } else if (tb.floorStyle === 'spy') {
        // radar scope rings + crosshair centred on the Enemy Radar kicker
        ctx.fillStyle = 'rgba(3, 12, 28, 0.42)'; ctx.fillRect(20, 0, 525, 940);
        ctx.strokeStyle = 'rgba(56, 214, 255, 0.32)'; ctx.lineWidth = 1.6;
        for (const r of [40, 80, 120, 160]) { ctx.beginPath(); ctx.arc(282, 560, r, 0, TAU); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(122, 560); ctx.lineTo(442, 560); ctx.moveTo(282, 400); ctx.lineTo(282, 720); ctx.stroke();
      } else if (tb.floorStyle === 'synth') {
        // perspective neon grid rising from a magenta horizon
        ctx.fillStyle = 'rgba(14, 4, 40, 0.5)'; ctx.fillRect(20, 0, 525, 940);
        ctx.save(); ctx.beginPath(); ctx.rect(20, 520, 525, 420); ctx.clip();
        ctx.strokeStyle = 'rgba(39, 232, 255, 0.5)'; ctx.lineWidth = 1.6;
        for (let k = -10; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(282 + k * 20, 540); ctx.lineTo(282 + k * 110, 940); ctx.stroke(); }
        for (let k = 0; k < 9; k++) { const y = 540 + Math.pow(k / 8, 1.8) * 400; ctx.strokeStyle = 'rgba(255, 43, 214, ' + (0.25 + k * 0.05) + ')'; ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(545, y); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(255, 43, 214, 0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, 540); ctx.lineTo(545, 540); ctx.stroke();
      } else if (tb.floorStyle === 'caldera') {
        ctx.strokeStyle = 'rgba(255, 90, 15, 0.42)';
        ctx.lineWidth = 2.4;
        for (const r of [78, 112, 148]) { ctx.beginPath(); ctx.arc(282, 305, r, 0, TAU); ctx.stroke(); }
      }
      // Subterranean Subway Tunnel tracks painted into the floor with glowing glass windows
      for (const tn of tb.tunnels || []) {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 10, 22, 0.85)';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tn.x1, tn.y1); ctx.lineTo(tn.x2, tn.y2); ctx.stroke();
        ctx.strokeStyle = hexA(tn.col, 0.55);
        ctx.lineWidth = 14;
        ctx.setLineDash([10, 12]);
        ctx.beginPath(); ctx.moveTo(tn.x1, tn.y1); ctx.lineTo(tn.x2, tn.y2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      // The lettering and shot labels remain crisp and agree with the actual table geometry.
      const titleY=tb.id==='neon'?570:690;
      ctx.fillStyle='rgba(12,16,27,.82)';ctx.strokeStyle=th.plastic2;ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect(118,titleY-23,330,36,14);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff1c4';ctx.font='bold 22px Georgia';ctx.textAlign='center';ctx.fillText(tb.name,283,titleY+2,316);
      for(const s of tb.saucers){ctx.fillStyle='rgba(9,17,25,.85)';ctx.fillRect(s.x-31,s.y+19,62,15);ctx.fillStyle=th.lamp;ctx.font='bold 8px Verdana';ctx.fillText(s.tunnelTo?'TUNNEL':tb.id==='neon'?'ENCORE':tb.id==='haunted'?'CRYPT':'LOCK',s.x,s.y+30);}
      ctx.restore();
    }
    // print texture + soft vignette (light, not black)
    for (let i = 0; i < 1800; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.045)'; ctx.fillRect(20 + rnd() * 560, 20 + rnd() * 980, 1.4, 1.4); }
    ctx.fillStyle = rg(ctx, 282, 480, 260, 640, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.22)']]); ctx.fillRect(0, 0, 600, 1000);
    // plunger lane
    ctx.fillStyle = lg(ctx, 545, 0, 580, 0, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(545, 100, 35, 900);
    ctx.fillStyle = th.lamp; for (let y = 300; y < 940; y += 60) { ctx.beginPath(); ctx.moveTo(562.5, y); ctx.lineTo(556, y + 14); ctx.lineTo(569, y + 14); ctx.fill(); }
    // lane colour strips + top rollover tubes
    const topLanes = tb.rollovers.filter((r) => r.group === 'top');
    for (const r of topLanes) { ctx.fillStyle = lg(ctx, r.x - 12, 0, r.x + 12, 0, [[0, th.tA], [1, shade(th.tA, 0.5)]]); ctx.beginPath(); ctx.roundRect(r.x - 14, r.y - 42, 28, 66, 12); ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1; }
    // inserts (arrows)
    for (const i of tb.inserts || []) insertArrow(ctx, i[0], i[1], i[2], shade(i[3], -0.25), 1);
    // inlane / outlane plastics + apron
    for (const side of [1, -1]) {
      const m = side > 0 ? (x) => x : (x) => 565 - x;
      ctx.fillStyle = lg(ctx, 0, 770, 0, 930, [[0, shade(th.plastic, -0.15)], [1, shade(th.plastic, -0.45)]]);
      ctx.beginPath(); ctx.moveTo(m(20), 770); ctx.lineTo(m(56), 770); ctx.lineTo(m(56), 830); ctx.lineTo(m(20), 830); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(Math.min(m(20), m(56)), 830, 36, 170);
    }
    ctx.fillStyle = lg(ctx, 0, 905, 0, 1000, [[0, shade(th.cab, 0.15)], [1, th.cab2]]); ctx.fillRect(20, 925, 525, 75);
    ctx.fillStyle = th.plastic2; ctx.fillRect(20, 925, 525, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '800 11px Verdana'; ctx.textAlign = 'center';
    ctx.fillText('OUT', 38, 800); ctx.fillText('OUT', 527, 800); ctx.fillText('IN', 71, 806); ctx.fillText('IN', 494, 806);
    // instruction cards on the apron
    for (const x of [60, 440]) { ctx.fillStyle = '#f5ecd0'; ctx.beginPath(); ctx.roundRect(x, 945, 60, 40, 3); ctx.fill(); ctx.fillStyle = '#6a5a30'; for (let k = 0; k < 5; k++) ctx.fillRect(x + 6, 951 + k * 6, 48 - (k % 2) * 14, 2); }
    paintText(ctx, tb.name, 282, 970, 15, th.plastic2, '#000');
    ctx.restore();

    // The 3D renderer uses the original printed art, with physical hardware above it.
    if (artworkOnly) return c;
    // wooden trim along the shell
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = th.trim; ctx.lineWidth = 16; shellPath(ctx); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.stroke();

    // slings art (under dynamic plastic)
    tb.slings.forEach((sl, i) => {
      const cx = (sl.p[0][0] + sl.p[1][0] + sl.p[2][0]) / 3, cy = (sl.p[0][1] + sl.p[1][1] + sl.p[2][1]) / 3;
      if (tb.slingArt) tb.slingArt(ctx, cx, cy, i);
    });

    // chrome guide rails
    const rails = tb.segs.filter((s) => s.vis && s.kind === 'wall');
    const stroke = (w, col, ox, oy) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (const s of rails) { ctx.moveTo(s.x1 + ox, s.y1 + oy); ctx.lineTo(s.x2 + ox, s.y2 + oy); } ctx.stroke(); };
    stroke(9, 'rgba(0,0,0,0.30)', 3, 5);
    stroke(8, '#6e7888', 0, 0); stroke(6, '#c9d2e0', 0, 0); stroke(3, '#ffffff', -0.8, -0.8);
    // rubber band triangles (kicking rubbers) with printed plastic
    for (const rt of tb.rubbers || []) {
      ctx.save(); ctx.lineJoin = 'round';
      ctx.beginPath(); rt.p.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
      ctx.fillStyle = rt.col; ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#333'; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = '#f6f6f0'; ctx.lineWidth = 6; ctx.stroke();
      const cx = (rt.p[0][0] + rt.p[1][0] + rt.p[2][0]) / 3, cy = (rt.p[0][1] + rt.p[1][1] + rt.p[2][1]) / 3;
      if (rt.label) paintText(ctx, rt.label, cx, cy, 16, '#fff', '#0a2a6a');
      ctx.restore();
    }
    // rubber posts (white rubber rings)
    for (const p of tb.circles) if (p.kind === 'post' && p.vis) {
      circ(ctx, p.x + 2, p.y + 3, p.r + 2, 'rgba(0,0,0,0.3)');
      circ(ctx, p.x, p.y, p.r + 2, rg(ctx, p.x - p.r * 0.4, p.y - p.r * 0.4, 1, p.r + 3, [[0, '#ffffff'], [0.6, '#f1f1f1'], [1, '#9aa2b0']]), '#556', 1);
      if (p.passive) { circ(ctx, p.x, p.y, p.r * 0.62, rg(ctx, p.x - 3, p.y - 3, 1, p.r, [[0, '#fff'], [0.5, th.bring], [1, shade(th.bring, -0.4)]]), 'rgba(0,0,0,0.5)', 1); star(ctx, p.x, p.y, p.r * 0.38, 5, 0.5); ctx.fillStyle = th.bump; ctx.fill(); }
      else if (p.r >= 6) circ(ctx, p.x, p.y, p.r * 0.45, th.bump, 'rgba(0,0,0,0.4)', 1);
    }
    for (const f of tb.flippers) circ(ctx, f.x, f.y, f.r0 + 5, 'rgba(0,0,0,0.25)');
    return c;
  };

  /* ------------------------------------------------------------ dynamic pieces */
  function lamp(ctx, x, y, r, on, col, flash) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
    ctx.fillStyle = on ? col : shade(col.length === 7 ? col : '#888888', -0.55);
    if (on) { ctx.shadowColor = col; ctx.shadowBlur = 16 + (flash || 0) * 20; ctx.shadowOffsetY = 0; }
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.strokeStyle = on ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (on ? 0.6 : 0.25) + ')'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.35, r * 0.4, r * 0.25, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawBumper(ctx, c, th) {
    const f = Math.max(0, c.flash) / 0.2, boosted = c.boost > 1;
    const body = boosted ? th.bring : th.bump;
    if (th.bnum) {
      ctx.save(); ctx.translate(c.x, c.y);
      if (c.lit || f > 0) { ctx.fillStyle = rg(ctx, 0, 0, c.r * 0.5, c.r * 2, [[0, 'rgba(255,230,140,' + (0.55 + f * 0.4) + ')'], [1, 'rgba(255,230,140,0)']]); ctx.beginPath(); ctx.arc(0, 0, c.r * 2, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    ctx.save(); ctx.translate(c.x, c.y);
    // shadow + skirt
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(4, 6, c.r + 4, c.r + 3, 0, 0, TAU); ctx.fill();
    circ(ctx, 0, 0, c.r + 3, rg(ctx, -c.r * 0.3, -c.r * 0.3, 2, c.r + 4, [[0, '#ffffff'], [0.5, th.bring], [1, shade(th.bring, -0.45)]]), 'rgba(0,0,0,0.6)', 1.2);
    // chrome ring
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 + f * 0.4) + ')'; ctx.lineWidth = 2; ctx.shadowColor = th.lamp; ctx.shadowBlur = 6 + f * 26;
    ctx.beginPath(); ctx.arc(0, 0, c.r - 1 + f * 2, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
    // cap
    const cr = c.r * 0.74 * (1 - f * 0.06);
    circ(ctx, 0, 0, cr, rg(ctx, -cr * 0.35, -cr * 0.4, 1, cr, [[0, shade(body, 0.7)], [0.45, body], [1, shade(body, -0.5)]]), 'rgba(0,0,0,0.55)', 1.2);
    if (th.bnum) { const lit = c.lit || f > 0; circ(ctx, 0, 0, cr * 0.8, lit ? '#fffbe8' : '#d9d2bf', 'rgba(0,0,0,0.4)', 1); circ(ctx, 0, 0, cr * 0.62, f > 0 ? '#fff4c0' : lit ? '#ff4a32' : '#a8352a'); ctx.font = '900 ' + Math.round(cr * 0.75) + 'px Verdana'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#7a1a10'; ctx.strokeText(th.bnum, 0, 1); ctx.fillText(th.bnum, 0, 1); }
    else { star(ctx, 0, 0, cr * 0.55, 5, 0.48); ctx.fillStyle = f > 0 ? '#fff' : th.bring; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-cr * 0.35, -cr * 0.5, cr * 0.35, cr * 0.18, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawMover(ctx, c, tb, time) {
    const id = tb.id, f = Math.max(0, c.flash) / 0.2;
    ctx.save(); ctx.translate(c.x, c.y);
    const S = c.r / 15; ctx.scale(S, S);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(4, 20, 16, 5, 0, 0, TAU); ctx.fill();
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 4 + f * 26;
    if (id === 'pirate') {
      // Writhing Kraken Tentacle rising from the sea
      ctx.fillStyle = rg(ctx, 0, 4, 2, 22, [[0, '#35e8dc'], [1, 'rgba(53,232,220,0)']]);
      ctx.beginPath(); ctx.arc(0, 4, 22, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#9d3be0'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 14);
      ctx.bezierCurveTo(-12, 2, 12, -8, Math.sin(time * 6) * 8, -22);
      ctx.stroke();
      ctx.strokeStyle = '#ff6ec7'; ctx.lineWidth = 3.5; ctx.stroke();
      for (const sy of [8, 0, -9]) circ(ctx, Math.sin(time * 6 + sy) * 3, sy, 2.5, '#ffd24a', '#3a1048', 1);
    } else if (id === 'haunted') {
      ctx.fillStyle = rg(ctx, 0, 0, 2, 34, [[0, 'rgba(160,255,160,0.7)'], [1, 'rgba(160,255,160,0)']]); ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
      ctx.translate(0, Math.sin(time * 4 + c.x) * 2); ctx.scale(Math.sign(c.vx || 1) * 1.15, 1.15); ghost(ctx, 0, 0, 1, 'rgba(240,255,245,0.97)');
      ctx.fillStyle = '#7dff6a'; circ(ctx, -5, -4, 1.5, '#7dff6a'); circ(ctx, 5, -4, 1.5, '#7dff6a');
    } else if (id === 'spy') {
      // Rotating radar dish sweep
      circ(ctx, 0, 0, 16, rg(ctx, -4, -4, 2, 18, [[0, '#d6f6ff'], [0.6, '#38d6ff'], [1, '#0a3a5a']]), '#06182e', 2);
      ctx.strokeStyle = f > 0 ? '#fff' : '#ff3b5c'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      const sa = time * 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sa) * 13, Math.sin(sa) * 13); ctx.stroke();
      circ(ctx, 0, 0, 3, '#fff25a');
    } else if (id === 'neon') {
      // Golden Art Deco Jazz Spotlight / Brass Mute-Bell
      circ(ctx, 0, 0, 16, rg(ctx, -4, -4, 2, 18, [[0, '#fff6d0'], [0.5, '#f2c15a'], [1, '#7a4b12']]), '#3a2008', 2);
      circ(ctx, 0, 0, 9, f > 0 ? '#ffffff' : '#ff5277', '#fff', 1.5);
    } else {
      ctx.fillStyle = rg(ctx, -4, -5, 2, 18, [[0, '#a8603a'], [1, '#4a2410']]); ctx.beginPath();
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, r = 14 + (i % 2) * 3; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(0, 2); ctx.lineTo(6, -2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlipper(ctx, f, th) {
    const ca = Math.cos(f.ang), sa = Math.sin(f.ang);
    const tx = f.x + f.side * f.len * ca, ty = f.y + f.len * sa;
    const dx = tx - f.x, dy = ty - f.y, l = Math.hypot(dx, dy);
    const px = -dy / l, py = dx / l;
    const path = (g) => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r0 + g, Math.atan2(py, px), Math.atan2(py, px) + PI, false);
      ctx.lineTo(tx - px * (f.r1 + g), ty - py * (f.r1 + g));
      ctx.arc(tx, ty, f.r1 + g, Math.atan2(-py, -px), Math.atan2(-py, -px) + PI, false);
      ctx.closePath();
    };
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 5;
    path(1.5); ctx.fillStyle = th.flipEdge; ctx.fill();
    ctx.shadowColor = 'transparent';
    path(-1.2);
    ctx.fillStyle = lg(ctx, f.x + px * f.r0, f.y + py * f.r0, f.x - px * f.r0, f.y - py * f.r0, [[0, shade(th.flip, 0.7)], [0.4, th.flip], [1, shade(th.flip, -0.35)]]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse((f.x + tx) / 2 + px * 2, (f.y + ty) / 2 + py * 2, f.len * 0.32, 1.8, Math.atan2(dy, dx), 0, TAU); ctx.fill();
    circ(ctx, f.x, f.y, f.r0 * 0.6, rg(ctx, f.x - 2, f.y - 2, 1, 7, [[0, '#fff'], [1, '#8a93a3']]), 'rgba(0,0,0,0.5)', 1);
    ctx.restore();
  }

  function drawBall(ctx, b, th, onRamp) {
    const sc = onRamp ? 1 + 0.3 * Math.sin(Math.PI * b.rampT) : 1;
    const r = b.r * sc;
    for (let i = 0; i < b.trail.length; i++) {
      const t = b.trail[i], a = (i + 1) / b.trail.length;
      ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.16) + ')'; ctx.beginPath(); ctx.arc(t.x, t.y, r * a * 0.9, 0, TAU); ctx.fill();
    }
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (onRamp ? 0.2 : 0.4) + ')';
    const so = onRamp ? 13 : 4.5; ctx.beginPath(); ctx.ellipse(b.x + so * 0.7, b.y + so, r * 0.95, r * 0.75, 0, 0, TAU); ctx.fill();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = lg(ctx, 0, -r, 0, r, [[0, '#f4f8ff'], [0.42, '#aab6cc'], [0.5, '#39445a'], [0.56, '#7d8aa4'], [1, '#e6ecf8']]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = rg(ctx, -r * 0.35, -r * 0.4, 0, r * 0.9, [[0, 'rgba(255,255,255,0.9)'], [0.4, 'rgba(255,255,255,0.1)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fill();
    ctx.save(); ctx.rotate(b.rollAng); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0.3, 1.4); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.42, r * 0.2, r * 0.12, -0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,24,40,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function shadowOn(ctx, b) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = b || 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; }
  function shadowOff(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }

  function lampField(tb, th) {
    if (tb._lamps) return tb._lamps;
    const L = [], cols = [th.lamp, th.plastic2, th.tA, th.tB, '#ffffff'];
    let n = 0;
    const add = (x, y) => L.push({ x, y, c: cols[n++ % cols.length], k: n });
    for (const b of tb.bumpers) for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; add(b.x + Math.cos(a) * (b.r + 15), b.y + Math.sin(a) * (b.r + 15)); }
    for (let i = 0; i < 22; i++) { const a = PI + 0.22 + (i / 21) * (PI - 0.44); add(300 + Math.cos(a) * 258, 300 + Math.sin(a) * 258); }
    for (const s of tb.saucers) if (!s.well && !s.kicker) for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; add(s.x + Math.cos(a) * (s.r + 17), s.y + Math.sin(a) * (s.r + 17)); }
    for (const sd of [1, -1]) { const m = (x) => (sd > 0 ? x : 565 - x); for (let i = 0; i < 8; i++) add(m(66 + i * 15), 842 + i * 4.5 - 8); for (let i = 0; i < 5; i++) add(m(70), 780 + i * 12); }
    for (const rp of tb.ramps) for (let i = 2; i < 40; i += 4) { const p = rp.pts[i]; add(p.x + 22, p.y); }
    tb._lamps = L; return L;
  }
  const ANIM = {
    haunted(ctx, time) {
      for (let i = 0; i < 5; i++) {
        const x = 282 + 215 * Math.sin(time * 0.28 + i * 1.3), y = 110 + i * 125 + 38 * Math.sin(time * 0.8 + i * 2);
        ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(x, y); ctx.scale(Math.cos(time * 0.28 + i * 1.3) > 0 ? 1 : -1, 1);
        ghost(ctx, 0, 0, 1.35 + (i % 3) * 0.25, 'rgba(235,255,240,0.95)'); ctx.restore();
      }
      for (let i = 0; i < 4; i++) { const x = (time * 55 + i * 170) % 700 - 60, y = 150 + i * 110 + Math.sin(time * 3 + i) * 20, fl = 0.5 + Math.abs(Math.sin(time * 14 + i)) * 0.7; ctx.save(); ctx.translate(x, y); ctx.scale(1, fl); bat(ctx, 0, 0, 0.9, '#2a1646'); ctx.restore(); }
    },
    pirate(ctx, time) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const x = (time * 45 + i * 190) % 700 - 60, y = 70 + i * 22 + Math.sin(time * 2 + i) * 8, w = Math.sin(time * 10 + i) * 5; ctx.beginPath(); ctx.moveTo(x - 10, y + w); ctx.quadraticCurveTo(x - 4, y - 8, x, y); ctx.quadraticCurveTo(x + 4, y - 8, x + 10, y + w); ctx.stroke(); }
      ctx.save(); ctx.translate(430, 372 + Math.sin(time * 1.6) * 2); ctx.rotate(Math.sin(time * 1.6) * 0.02); ctx.restore();
    },
    space(ctx, time) {
      const ph = (time % 5) / 5; if (ph < 0.3) { const k = ph / 0.3, x = 520 - k * 420, y = 60 + k * 300; ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y - 42); ctx.stroke(); }
      const ux = 282 + 200 * Math.sin(time * 0.5), uy = 585 + 18 * Math.sin(time * 1.3);
      ctx.save(); ctx.translate(ux, uy); ctx.fillStyle = '#c9d4ff'; ctx.beginPath(); ctx.ellipse(0, 4, 22, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,255,255,0.85)'; ctx.beginPath(); ctx.arc(0, 1, 10, PI, TAU); ctx.fill();
      for (const x of [-12, 0, 12]) circ(ctx, x, 5, 1.8, Math.sin(time * 8 + x) > 0 ? '#ffe14a' : '#ff6a3a'); ctx.restore();
    },
    volcano(ctx, time) {
      ctx.fillStyle = rg(ctx, 282, 205, 4, 120, [[0, 'rgba(255,230,120,' + (0.45 + 0.25 * Math.sin(time * 3)) + ')'], [1, 'rgba(255,120,20,0)']]); ctx.beginPath(); ctx.arc(282, 205, 120, 0, TAU); ctx.fill();
      for (let i = 0; i < 26; i++) { const k = ((time * 0.5 + i * 0.137) % 1), x = 282 + Math.sin(i * 2.3) * 50 * k + Math.sin(time + i) * 6, y = 200 - k * 170; ctx.fillStyle = 'rgba(' + (i % 2 ? '255,170,40' : '255,90,20') + ',' + (1 - k) + ')'; circ(ctx, x, y, 2.6 * (1 - k * 0.5), ctx.fillStyle); }
    },
    neon(ctx, time) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4; ctx.setLineDash([3, 18]); ctx.lineDashOffset = -time * 40;
      ctx.beginPath(); ctx.arc(282, 275, 168, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    },
  };

  R.drawPlayfield = function (ctx, game, time) {
    const tb = game.table, th = TH(tb), w = game.world;
    // 80s-style field of small insert lamps (chasing)
    for (const l of lampField(tb, th)) {
      const k = Math.max(0, Math.sin(time * 5 - l.k * 0.55)) * (0.85 + 0.15 * Math.sin(time * 37 + l.k * 7));
      ctx.save(); ctx.fillStyle = shade(l.c.length === 7 ? l.c : '#ffffff', -0.35); ctx.globalAlpha = 0.9; circ(ctx, l.x, l.y, 3.4, ctx.fillStyle, 'rgba(0,0,0,0.45)', 1);
      if (k > 0.05) { ctx.globalAlpha = k; ctx.shadowColor = l.c; ctx.shadowBlur = 10; circ(ctx, l.x, l.y, 3.4, l.c); }
      ctx.restore();
    }
    // glowing inserts (chasing light pulse)
    (tb.inserts || []).forEach((i, k) => {
      const ph = (Math.sin(time * 4 - k * 0.9) + 1) / 2;
      ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * ph; ctx.shadowColor = i[3]; ctx.shadowBlur = 16;
      insertArrow(ctx, i[0], i[1], i[2], i[3], 1); ctx.restore();
    });
    // spinning vinyl centerpiece (for Jazz Boulevard)
    for (const pr of tb.props || []) {
      if (pr.kind === 'vinyl') {
        const vr = pr.r || 34;
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(time * 1.8);
        circ(ctx, 0, 0, vr + 3, 'rgba(234,196,105,0.45)', '#eac469', 2);
        circ(ctx, 0, 0, vr, '#141219', '#eac469', 1.5);
        for (const gr of [vr * 0.82, vr * 0.66, vr * 0.5]) { ctx.strokeStyle = 'rgba(255,220,140,0.28)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, gr, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, vr, -0.35, 0.35); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, vr, PI - 0.35, PI + 0.35); ctx.closePath(); ctx.fill();
        circ(ctx, 0, 0, vr * 0.34, '#d63463', '#eac469', 2);
        circ(ctx, 0, 0, 4.5, '#f5ecd0', '#141219', 1.5);
        ctx.restore();
      }
    }
    for (const pr of tb.props || []) {
      if (pr.kind === 'castle') {
        // twin crenellated gate towers joined by an arch
        ctx.save(); ctx.translate(pr.x, pr.y);
        for (const sx of [-33, 33]) {
          shadowOn(ctx, 4); circ(ctx, sx, 0, 17, '#6a6078', '#c9a35a', 2.5); shadowOff(ctx);
          ctx.fillStyle = '#4a4258'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.fillRect(sx + Math.cos(a) * 12 - 2.5, Math.sin(a) * 12 - 2.5, 5, 5); }
          circ(ctx, sx, 0, 6, '#ffd86a');
        }
        ctx.strokeStyle = '#c9a35a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 4, 33, PI, TAU); ctx.stroke();
        ctx.restore();
      } else if (pr.kind === 'radar') {
        ctx.save(); ctx.translate(pr.x, pr.y);
        circ(ctx, 0, 0, pr.r || 26, 'rgba(6,24,46,0.85)', '#38d6ff', 2.5);
        ctx.strokeStyle = 'rgba(56,214,255,0.5)'; ctx.lineWidth = 1.2; for (const r of [8, 16]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }
        const a = time * 2.2; ctx.fillStyle = 'rgba(56,214,255,0.28)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, pr.r || 26, a - 0.5, a); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#7dffb0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (pr.r || 26), Math.sin(a) * (pr.r || 26)); ctx.stroke();
        ctx.restore();
      }
    }
    // custom architectural side walls / buttresses / balconies
    for (const st of tb.structures || []) {
      ctx.save();
      ctx.beginPath();
      st.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      shadowOn(ctx, 6);
      ctx.fillStyle = st.col || th.cab;
      ctx.fill();
      shadowOff(ctx);
      ctx.strokeStyle = st.trim || th.plastic2;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    // underground subway tunnels (chaser lights + entrance hood + exit turret)
    for (const tn of tb.tunnels || []) {
      const active = !!(tn.saucer && tn.saucer.ball);
      ctx.save();
      for (let i = 1; i <= 7; i++) {
        const f = i / 8;
        const lx = tn.x1 + (tn.x2 - tn.x1) * f, ly = tn.y1 + (tn.y2 - tn.y1) * f;
        const pulse = active ? 1 : Math.max(0.15, Math.sin(time * 7 - i * 0.7));
        ctx.globalAlpha = pulse;
        ctx.shadowColor = tn.col;
        ctx.shadowBlur = active ? 18 : 8;
        circ(ctx, lx, ly, active ? 6 : 4, tn.col, '#ffffff', 1);
      }
      ctx.globalAlpha = 1;
      circ(ctx, tn.x1, tn.y1, 20, 'rgba(6,10,20,0.9)', tn.col, 3);
      circ(ctx, tn.x2, tn.y2, 16, 'rgba(6,10,20,0.85)', tn.col, 2.5);
      ctx.restore();
    }
    // guided shot arrows on playfield
    (tb.shotArrows || []).forEach((sa, k) => {
      const ph = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * 5.2 - k * 1.1));
      ctx.save();
      ctx.globalAlpha = ph;
      ctx.shadowColor = sa.col || th.lamp;
      ctx.shadowBlur = 18;
      insertArrow(ctx, sa.x, sa.y, sa.ang || 0, sa.col || th.lamp, 0.92);
      if (sa.label) {
        ctx.shadowBlur = 6;
        ctx.font = '800 7.5px Verdana';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(8,10,20,0.88)';
        ctx.lineWidth = 2.5;
        ctx.strokeText(sa.label, sa.x, sa.y + 22);
        ctx.fillText(sa.label, sa.x, sa.y + 22);
      }
      ctx.restore();
    });
    // booster strips (conveyor chevrons)
    for (const z of tb.boosts) {
      const f = Math.max(0, z.flash) / 0.45;
      ctx.save(); ctx.beginPath(); ctx.roundRect(z.x, z.y, z.w, z.h, 6); ctx.clip();
      ctx.fillStyle = lg(ctx, 0, z.y, 0, z.y + z.h, [[0, hexA(th.lamp, 0.55 + f * 0.3)], [1, hexA(th.plastic, 0.55 + f * 0.3)]]); ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const cx = z.x + z.w / 2, step = 18, off = (time * 60) % step;
      for (let k = -1; k * step < z.h + step; k++) {
        const yy = z.dy < 0 ? z.y + z.h - k * step - off : z.y + k * step + off;
        ctx.beginPath(); ctx.moveTo(cx, yy - 7 * Math.sign(z.dy)); ctx.lineTo(cx + 9, yy + 2 * Math.sign(z.dy)); ctx.lineTo(cx + 9, yy + 6 * Math.sign(z.dy)); ctx.lineTo(cx, yy - 2 * Math.sign(z.dy)); ctx.lineTo(cx - 9, yy + 6 * Math.sign(z.dy)); ctx.lineTo(cx - 9, yy + 2 * Math.sign(z.dy)); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = '#e8eef7'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(z.x, z.y, z.w, z.h, 6); ctx.stroke();
    }
    // magnets
    for (const m of tb.magnets) {
      ctx.save(); ctx.translate(m.x, m.y);
      if (m.on) {
        for (let k = 0; k < 3; k++) { const ph = ((time * 1.5 + k / 3) % 1); ctx.strokeStyle = hexA(th.glow2, (1 - ph) * 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, m.r * (1 - ph), 0, TAU); ctx.stroke(); }
        ctx.fillStyle = rg(ctx, 0, 0, 2, m.r * 0.5, [[0, hexA(th.glow2, 0.55)], [1, hexA(th.glow2, 0)]]); ctx.beginPath(); ctx.arc(0, 0, m.r * 0.5, 0, TAU); ctx.fill();
      }
      shadowOn(ctx, 4);
      circ(ctx, 0, 0, 14, rg(ctx, -3, -3, 2, 16, [[0, '#fff'], [0.5, '#9aa4b8'], [1, '#3a4252']]), '#222', 1.5); shadowOff(ctx);
      ctx.strokeStyle = m.on ? th.glow2 : '#c0392b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 8, 0.6, PI - 0.6); ctx.stroke(); ctx.strokeStyle = m.on ? '#fff' : '#2d6cdf'; ctx.beginPath(); ctx.arc(0, 0, 8, PI + 0.6, TAU - 0.6); ctx.stroke();
      ctx.restore();
    }
    // ramps – sleek wireform / neon / metallic rails with translucent bed
    for (const rp of tb.ramps) {
      const f = Math.max(0, rp.flash) / 0.6;
      const rCol = rp.color || (rp.lift ? th.plastic2 : th.ramp);
      const isWire = rp.material === 'wireform', isNeon = rp.material === 'neon';
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = () => { ctx.beginPath(); rp.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); };
      const RW = rp.width || (rp.lift ? 24 : 30);
      ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = RW + 4; ctx.translate(5, 8); path(); ctx.stroke(); ctx.translate(-5, -8);
      ctx.strokeStyle = hexA(rCol, (isWire ? 0.10 : isNeon ? 0.16 : 0.18) + f * 0.2); ctx.lineWidth = RW; path(); ctx.stroke();
      if (isWire) {
        // cross-rings along wireform
        ctx.strokeStyle = hexA(rCol, 0.65); ctx.lineWidth = 2;
        for (let k = 4; k < rp.pts.length - 4; k += 8) {
          const p = rp.pts[k], q = rp.pts[Math.min(rp.pts.length - 1, k + 1)], dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1;
          ctx.beginPath(); ctx.moveTo(p.x - (dy / l) * (RW / 2), p.y + (dx / l) * (RW / 2)); ctx.lineTo(p.x + (dy / l) * (RW / 2), p.y - (dx / l) * (RW / 2)); ctx.stroke();
        }
      }
      for (const off of [-RW / 2, RW / 2]) {
        const rail = (wd, col, blur) => { ctx.save(); if (blur) { ctx.shadowColor = col; ctx.shadowBlur = blur; } ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); rp.pts.forEach((p, i, a) => { const q = a[Math.min(i + 1, a.length - 1)], pr = a[Math.max(i - 1, 0)]; const dx = q.x - pr.x, dy = q.y - pr.y, l = Math.hypot(dx, dy) || 1; const x = p.x - (dy / l) * off, y = p.y + (dx / l) * off; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore(); };
        if (isNeon) { rail(4.5, rCol, 10); rail(1.8, '#ffffff', 0); }
        else if (isWire) { rail(4.5, '#6a4e23', 0); rail(2.6, '#f6d27a', 0); rail(1, '#fff6d6', 0); }
        else { rail(4.5, '#5e6675', 0); rail(2.5, rCol, 4); rail(1, '#ffffff', 0); }
      }
      ctx.fillStyle = 'rgba(255,255,255,' + (0.55 + f * 0.4) + ')';
      for (let k = 0; k < 7; k++) {
        const t = ((k / 7) + time * 0.25) % 1, p = rp.at(t), q = rp.at(Math.min(1, t + 0.02));
        const a = Math.atan2(q.y - p.y, q.x - p.x);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -7); ctx.lineTo(-1, 0); ctx.lineTo(-4, 7); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = hexA(rCol, 0.28 + f * 0.4); ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.lift ? 16 : 19, 0, TAU); ctx.fill(); ctx.strokeStyle = rCol; ctx.lineWidth = 2.5; ctx.stroke();
      if (rp.lift) { ctx.fillStyle = th.plastic; ctx.beginPath(); ctx.moveTo(rp.x, rp.y - 9); ctx.lineTo(rp.x + 8, rp.y + 3); ctx.lineTo(rp.x - 8, rp.y + 3); ctx.fill(); }
      ctx.restore();
    }

    // status lamps
    const st = tb.status;
    const hasMB = tb.saucers.some((s) => !s.kicker);
    if (hasMB) st.mb.forEach((p, i) => lamp(ctx, p.x, p.y, 7, i < game.mbProgress || game.multiball, '#ff3b3b', game.multiball ? Math.abs(Math.sin(time * 8)) : 0));
    st.mult.forEach((p, i) => {
      lamp(ctx, p.x, p.y, 8.5, game.mult >= i + 2, th.lamp, 0);
      ctx.fillStyle = game.mult >= i + 2 ? '#000' : 'rgba(255,255,255,0.8)'; ctx.font = '900 9px Verdana'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('x' + (i + 2), p.x, p.y + 0.5);
    });
    lamp(ctx, st.saver.x, st.saver.y, 8, game.saver > 0 && (game.saver > 3 || Math.sin(time * 14) > 0), '#4dff88', 0);
    ctx.save(); shadowOn(ctx, 2); ctx.fillStyle = '#fff'; ctx.font = '800 8.5px Verdana'; ctx.textAlign = 'center'; ctx.fillText('BALL SAVE', st.saver.x, st.saver.y + 17); if (hasMB) ctx.fillText('MULTIBALL', 282, 733); ctx.restore();

    // word inserts (80s style: letters light with progress)
    if (tb.word) {
      const n = tb.word.length, sx = 282 - (n - 1) * 12;
      for (let i = 0; i < n; i++) {
        const lit = i < game.wordLit, x = sx + i * 24;
        lamp(ctx, x, 708, 10, lit, th.lamp, lit && i === game.wordLit - 1 ? Math.abs(Math.sin(time * 8)) : 0);
        ctx.fillStyle = lit ? '#000' : 'rgba(255,255,255,0.85)'; ctx.font = '900 12px Verdana'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tb.word[i], x, 709);
      }
    }
    if (tb.numbers && game.specialLit) {
      for (const s of tb.saucers) if (s.kicker) { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 9); paintText(ctx, 'SPECIAL', s.x, s.y + 28, 10, '#ff3b3b', '#fff'); ctx.restore(); }
    }
    // rollovers (star inserts)
    for (const rv of tb.rollovers) {
      const on = rv.lit || rv.flash > 0, big = rv.group === 'top';
      const col = rv.group === 'out' ? '#ff5a5a' : th.lamp;
      ctx.save();
      if (on) { ctx.shadowColor = col; ctx.shadowBlur = 16 + rv.flash * 20; }
      star(ctx, rv.x, rv.y, big ? 11 : 8, 5, 0.5);
      ctx.fillStyle = on ? col : shade(col, -0.5); ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
      ctx.restore();
    }
    // spinners (chrome plate)
    for (const sp of tb.spinners) {
      const c = Math.cos(sp.angle), mx = (sp.x1 + sp.x2) / 2, my = (sp.y1 + sp.y2) / 2;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = '#3a4252'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sp.x1, sp.y1); ctx.lineTo(sp.x2, sp.y2); ctx.stroke();
      const hw = Math.abs(c) * 7 + 1.5; shadowOn(ctx, 3);
      ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.atan2(sp.y2 - sp.y1, sp.x2 - sp.x1));
      ctx.fillStyle = lg(ctx, 0, -hw, 0, hw, [[0, '#ffffff'], [0.5, c > 0 ? '#b9c3d6' : '#8a94aa'], [1, '#5a6478']]);
      ctx.beginPath(); ctx.roundRect(-sp.len / 2 + 3, -hw, sp.len - 6, hw * 2, 2); ctx.fill(); ctx.restore();
      ctx.restore();
    }
    // targets
    for (const s of tb.segs) {
      if (s.kind === 'drop') {
        if (tb.id === 'haunted') {
          const mx = (s.x1 + s.x2) / 2, my = s.y1;
          ctx.save();
          if (s.up) { shadowOn(ctx, 3); tomb(ctx, mx, my - 4, 0.95, s.flash > 0 ? '#ffffff' : '#c8d0c8'); }
          else { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(mx - 14, my + 6, 28, 4); }
          ctx.restore();
        } else {
          ctx.save(); ctx.lineCap = 'butt';
          if (s.up) {
            shadowOn(ctx, 4);
            ctx.strokeStyle = '#6e7888'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); shadowOff(ctx);
            ctx.strokeStyle = s.flash > 0 ? '#fff' : th.tB; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x1 - 2, s.y1 + 2); ctx.lineTo(s.x2 - 2, s.y2 - 2); ctx.stroke();
          } else { ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); }
          ctx.restore();
        }
      } else if (s.kind === 'stand') {
        ctx.save(); ctx.lineCap = 'round'; shadowOn(ctx, 4);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); shadowOff(ctx);
        const lit = s.flash > 0 || s.lit;
        ctx.strokeStyle = lit ? th.lamp : th.tA; ctx.lineWidth = 8; if (lit) { ctx.shadowColor = th.lamp; ctx.shadowBlur = 16; }
        ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); ctx.restore();
      }
    }
    // slings: glossy plastic over printed art
    for (const sl of tb.slings) {
      const f = Math.max(0, sl.seg.flash) / 0.18;
      ctx.save(); ctx.lineJoin = 'round'; shadowOn(ctx, 5);
      ctx.beginPath(); sl.p.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
      ctx.fillStyle = hexA(th.plastic, 0.42 + f * 0.3); ctx.fill(); shadowOff(ctx);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = f > 0 ? '#ffee66' : th.plastic2; ctx.lineWidth = 3.4; ctx.shadowColor = th.plastic2; ctx.shadowBlur = 4 + f * 24;
      ctx.beginPath(); ctx.moveTo(sl.p[0][0], sl.p[0][1]); ctx.lineTo(sl.p[2][0], sl.p[2][1]); ctx.stroke();
      ctx.restore();
    }
    // saucers / wells
    for (const s of tb.saucers) {
      if (s.well) {
        ctx.save(); ctx.translate(s.x, s.y);
        ctx.fillStyle = rg(ctx, 0, 0, 4, s.pull, [[0, 'rgba(0,0,0,0.95)'], [0.22, hexA('#ff4fd8', 0.55)], [0.6, hexA('#35e0ff', 0.18)], [1, hexA('#35e0ff', 0)]]); ctx.beginPath(); ctx.arc(0, 0, s.pull, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.rotate(time * 2.2);
        for (let k = 0; k < 3; k++) { ctx.rotate(TAU / 3); ctx.beginPath(); for (let a = 0; a < 3.5; a += 0.15) { const r = 8 + a * 11; ctx.lineTo(Math.cos(a * 1.6) * r, Math.sin(a * 1.6) * r); } ctx.stroke(); }
        circ(ctx, 0, 0, 12, '#000', '#ff4fd8', 2); ctx.restore();
      } else if (s.kicker) {
        ctx.save(); ctx.translate(s.x, s.y); shadowOn(ctx, 4);
        circ(ctx, 0, 0, s.r + 5, rg(ctx, -3, -3, 2, s.r + 6, [[0, '#fff'], [0.6, '#c4ccd9'], [1, '#6a7488']]), '#333', 1.2); shadowOff(ctx);
        circ(ctx, 0, 0, s.r, '#1a0f1a');
        const on = s.ball ? 1 : 0.5 + 0.5 * Math.sin(time * 6);
        ctx.save(); ctx.rotate(s.ejectAng + PI / 2); ctx.fillStyle = hexA(th.lamp, 0.5 + on * 0.5); ctx.shadowColor = th.lamp; ctx.shadowBlur = 8 * on;
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, 2); ctx.lineTo(2, 2); ctx.lineTo(2, 8); ctx.lineTo(-2, 8); ctx.lineTo(-2, 2); ctx.lineTo(-7, 2); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.restore();
      } else {
        ctx.save(); ctx.translate(s.x, s.y); shadowOn(ctx, 5);
        circ(ctx, 0, 0, s.r + 6, rg(ctx, -3, -3, 2, s.r + 8, [[0, '#ffffff'], [0.6, '#b4becf'], [1, '#5a6478']]), '#3a4252', 1.5); shadowOff(ctx);
        circ(ctx, 0, 0, s.r + 1, rg(ctx, 0, 2, 1, s.r + 2, [[0, '#000'], [1, '#2a1a2a']]));
        const on = s.ball ? 1 : 0.5 + 0.5 * Math.sin(time * 5);
        ctx.strokeStyle = hexA(th.plastic2, 0.4 + on * 0.6); ctx.lineWidth = 3; ctx.shadowColor = th.plastic2; ctx.shadowBlur = 12 * on;
        ctx.beginPath(); ctx.arc(0, 0, s.r + 10, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }
    // bumpers + movers
    for (const c of tb.circles) {
      if (c.kind === 'bumper') drawBumper(ctx, c, th);
      else if (c.kind === 'mover') drawMover(ctx, c, tb, time);
    }
    // plunger
    const pull = game.plungerPull, py = 965 + pull * 34;
    ctx.save();
    ctx.strokeStyle = '#b8c0cf'; ctx.lineWidth = 2.5; ctx.beginPath(); const coils = 9; ctx.moveTo(562.5, py + 4);
    for (let i = 1; i <= coils; i++) ctx.lineTo(562.5 + (i % 2 ? 11 : -11), py + 4 + ((1000 - py - 4) * i) / coils);
    ctx.stroke();
    ctx.fillStyle = lg(ctx, 550, 0, 575, 0, [[0, '#888'], [0.5, '#fff'], [1, '#777']]); ctx.fillRect(551, py, 23, 6);
    ctx.fillStyle = th.plastic; ctx.fillRect(551, py - 2, 23, 3);
    ctx.restore();
    // flippers + balls
    for (const f of tb.flippers) drawFlipper(ctx, f, th);
    for (const b of w.balls) drawBall(ctx, b, th, b.cap && b.cap.kind === 'ramp');
    // particles
    for (const p of game.particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    // popups
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of game.popups) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.font = '900 ' + p.size + 'px Verdana'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = '#fff'; ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    // glass glare
    ctx.save(); shellPath(ctx); ctx.clip();
    ctx.fillStyle = lg(ctx, 0, 0, 600, 700, [[0, 'rgba(255,255,255,0.20)'], [0.35, 'rgba(255,255,255,0.05)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(380, 0); ctx.lineTo(0, 480); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  /* ------------------------------------------------------------ HUD (backbox above playfield) */
  R.drawHeader = function (ctx, game, time) {
    const tb = game.table, th = TH(tb);
    ctx.save(); ctx.translate(0, -100);
    ctx.fillStyle = lg(ctx, 0, 0, 0, 100, [[0, shade(th.cab, 0.35)], [1, th.cab2]]); ctx.beginPath(); ctx.roundRect(0, 0, 600, 100, [14, 14, 0, 0]); ctx.fill();
    // marquee bulbs
    for (let i = 0; i < 31; i++) { const on = ((i + Math.floor(time * 6)) % 3) === 0; circ(ctx, 10 + i * 19.3, 8, 3.5, on ? '#fff3a0' : '#7a6a20'); if (on) { ctx.save(); ctx.shadowColor = '#ffee66'; ctx.shadowBlur = 8; circ(ctx, 10 + i * 19.3, 8, 3, '#fff3a0'); ctx.restore(); } }
    ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.roundRect(18, 20, 300, 48, 6); ctx.fill();
    ctx.strokeStyle = th.plastic2; ctx.lineWidth = 3; ctx.stroke();
    if (tb.reels) drawReels(ctx, game, time);
    else {
      ctx.font = '700 36px "Courier New", monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff8a1f'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffb347';
      ctx.fillText(Math.floor(game.dispScore).toLocaleString('en-US'), 310, 45);
      ctx.shadowBlur = 0;
    }
    // backbox bell that rings every 10,000
    ctx.save(); ctx.translate(334, 78); ctx.scale(0.8, 0.8); ctx.rotate(game.bellT > 0 ? Math.sin(time * 40) * 0.5 : 0);
    ctx.fillStyle = lg(ctx, -9, 0, 9, 0, [[0, '#a87a1a'], [0.5, '#ffe28a'], [1, '#8a5a10']]);
    ctx.beginPath(); ctx.moveTo(-9, 8); ctx.quadraticCurveTo(-9, -10, 0, -11); ctx.quadraticCurveTo(9, -10, 9, 8); ctx.closePath(); ctx.fill(); circ(ctx, 0, 10, 2.5, '#5a3a08'); ctx.restore();
    ctx.font = '800 11px Verdana'; ctx.textAlign = 'right'; ctx.fillStyle = '#ffe14a'; ctx.fillText('CREDITS ' + (game.credits || 0), 596, 84);
    ctx.font = '800 12px Verdana'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    ctx.fillText(tb.name, 20, 84);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('BEST ' + (game.best || 0).toLocaleString('en-US'), 316, 84);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '800 12px Verdana'; ctx.fillText('BALL', 370, 27);
    ctx.font = '900 32px "Courier New", monospace'; ctx.fillStyle = th.lamp; ctx.shadowColor = th.lamp; ctx.shadowBlur = 10;
    ctx.fillText(Math.min(game.ballNo, game.maxBalls) + '/' + game.maxBalls, 370, 56); ctx.shadowBlur = 0;
    ctx.font = '800 12px Verdana'; ctx.fillStyle = '#fff'; ctx.fillText('BONUS X', 445, 27);
    ctx.font = '900 32px "Courier New", monospace'; ctx.fillStyle = '#7dffb0'; ctx.shadowColor = '#7dffb0'; ctx.shadowBlur = 10;
    ctx.fillText(game.mult, 445, 56); ctx.shadowBlur = 0;
    ctx.font = '800 12px Verdana'; ctx.fillStyle = game.multiball ? '#ff8a8a' : 'rgba(255,255,255,0.75)';
    ctx.fillText(game.multiball ? 'MULTIBALL - JACKPOT ' + game.jackpot.toLocaleString('en-US') : (game.ticker || ''), 370, 84);
    ctx.fillStyle = th.plastic2; ctx.fillRect(0, 96, 600, 4);
    ctx.restore();
  };

  function drawReels(ctx, game, time) {
    const N = 6, w = 44, x0 = 312 - N * w, sc = Math.floor(game.score);
    if (!game.reels) game.reels = new Array(N).fill(0);
    const dt = 1 / 60;
    ctx.save();
    for (let p = 0; p < N; p++) {
      const target = Math.floor(sc / Math.pow(10, p)) % 10;
      let s = game.reels[p];
      const d = (target - Math.floor(s) + 10) % 10 + (Math.floor(s) === target ? -(s - Math.floor(s)) : 0);
      if (d > 0.001) s = (s + Math.min(d, dt * 14)) % 10; else s = target;
      game.reels[p] = s;
      const x = x0 + (N - 1 - p) * w + 4;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 22, w - 8, 44); ctx.clip();
      ctx.fillStyle = lg(ctx, 0, 22, 0, 66, [[0, '#8a8270'], [0.3, '#f4ecd6'], [0.7, '#f4ecd6'], [1, '#8a8270']]); ctx.fillRect(x, 22, w - 8, 44);
      ctx.font = '900 32px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1a1a1a';
      const base = Math.floor(s), fr = s - base;
      ctx.fillText(String(base % 10), x + (w - 8) / 2, 45 - fr * 40);
      ctx.fillText(String((base + 1) % 10), x + (w - 8) / 2, 85 - fr * 40);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, 22, w - 8, 44);
    }
    ctx.restore();
  }

  /* big centre callouts */
  R.drawCallouts = function (ctx, game, time) {
    const m = game.msg, th = TH(game.table);
    if (m && m.life > 0) {
      const k = Math.min(1, m.life * 3, (m.max - m.life) * 6 + 0.2);
      ctx.save(); ctx.globalAlpha = k; ctx.translate(282, m.y || 470); const sc = 0.8 + 0.25 * Math.min(1, (m.max - m.life) * 5); ctx.scale(sc, sc);
      paintText(ctx, m.text, 0, 0, m.size || 44, m.col || '#fff', '#1a1030');
      if (m.sub) paintText(ctx, m.sub, 0, 36, 20, '#fff', '#1a1030');
      ctx.restore();
    }
    if (game.state === 'ready' && !game.tilted) {
      const k = 0.6 + 0.4 * Math.sin(time * 5);
      ctx.save(); ctx.globalAlpha = k; paintText(ctx, 'PULL PLUNGER', 282, 790, 22, '#fff', '#1a1030'); ctx.restore();
    }
    if (game.plungerPull > 0.02 || game.state === 'ready') {
      ctx.save(); ctx.translate(595, 960);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-6, -110, 10, 110);
      const p = game.plungerPull;
      ctx.fillStyle = p > 0.8 && p < 0.93 ? '#4dff88' : '#ffd23a'; ctx.fillRect(-5, -p * 108, 8, p * 108);
      ctx.fillStyle = '#4dff88'; ctx.fillRect(-8, -0.93 * 108, 14, 2); ctx.fillRect(-8, -0.8 * 108, 14, 2);
      ctx.restore();
    }
    if (game.tilted) paintText(ctx, 'TILT', 282, 400, 80, '#ff3b3b', '#fff');
    if (game.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + game.flash * 0.7 + ')'; ctx.fillRect(0, -100, 600, 1100); }
  };

  P.Render = R;
})(typeof globalThis !== 'undefined' ? globalThis : window);
