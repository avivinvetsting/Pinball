/* ARCADE FRENZY playability: plunger, lane/orbit/ramp entrances, exits, real flipper shots. Run: node tests/frenzy-check.cjs */
require('../engine.js'); require('../tables.js'); require('../tables/quest.js'); require('../tables/spy.js'); require('../tables/frenzy.js'); require('../designs.js');
const P = globalThis.Pin, def = P.TABLES.find((d) => d.id === 'frenzy');
let fail = 0; const report = (ok, m) => { if (!ok) fail++; console.log((ok ? 'PASS ' : 'FAIL ') + m); };
const mk = (ev) => { const tb = def.build(); return [tb, new P.World(tb, { event: ev })]; };

// 1. plunger
{
  const [tb, w] = mk(), b = w.addBall(562, 950, 0, -2400); let minY = 1e9, inF = false, t0 = null, low = false;
  for (let i = 0; i < 480 * 8; i++) { w.step(); if (!w.balls.includes(b)) { low = true; break; } minY = Math.min(minY, b.y); if (b.y < 300 && b.x < 545) { inF = true; if (t0 == null) t0 = i / 480; } }
  report(minY < 300 && inF && t0 < 2, `plunger: reaches field at t=${t0 && t0.toFixed(2)}s minY=${Math.round(minY)}; ${low ? 'drained' : 'still in play'} after 8s, ball at (${Math.round(b.x)},${Math.round(b.y)})`);
  // plunger ball must end up in the lower field/drain, not stuck
  const [tb2, w2] = mk(), b2 = w2.addBall(562, 950, 0, -2400); let sx = 0, sy = 0, still = 0, maxStill = 0;
  for (let i = 0; i < 480 * 20 && w2.balls.includes(b2); i++) { w2.step(); if (b2.cap) continue; if (Math.hypot(b2.x - sx, b2.y - sy) > 6) { sx = b2.x; sy = b2.y; still = 0; } else { still += 1 / 480; maxStill = Math.max(maxStill, still); } }
  report(maxStill < 2, `plunger: max stillness over 20s = ${maxStill.toFixed(2)}s`);
}

// 2. aimed shots at each entrance + exit behaviour
const targets = [
  { name: 'LEFT HOOK -> BALL PATH 1', ax: 135, ay: 415, ok: (w, b) => b.cap && b.cap === w.t.ramps[0] },
  { name: 'RIGHT HOOK -> BALL PATH 2', ax: 440, ay: 415, ok: (w, b) => b.cap && b.cap === w.t.ramps[1] },
  { name: 'LEFT ORBIT', ax: 48, ay: 560, ok: (w, b) => !b.cap && b.x < 76 && b.y < 300 },
  { name: 'RIGHT ORBIT', ax: 525, ay: 570, ok: (w, b) => !b.cap && b.x > 506 && b.x < 545 && b.y < 300 },
];
const starts = []; for (const x of [215, 250, 290, 330, 365]) for (const y of [700, 750, 800]) starts.push([x, y]);
for (const tg of targets) {
  let tries = 0, hits = 0, returned = 0, stuck = 0, maxRet = 0, bestStart = null; const rets = [];
  for (const [sx, sy] of starts) for (const sp of [1400, 1700, 2000]) for (let da = -0.06; da <= 0.0601; da += 0.03) {
    tries++;
    const [tb, w] = mk(), a = Math.atan2(tg.ay - sy, tg.ax - sx) + da, b = w.addBall(sx, sy, Math.cos(a) * sp, Math.sin(a) * sp);
    let entered = false, tEnter = 0, back = false, tBack = 0, still = 0, mx = b.x, my = b.y, st = false;
    for (let i = 0; i < 480 * 14 && w.balls.includes(b); i++) {
      w.step();
      if (!entered && tg.ok(w, b)) { entered = true; tEnter = i / 480; }
      if (entered && !back && !b.cap && b.y > 600) { back = true; tBack = i / 480 - tEnter; }
      if (entered && !b.cap) { if (Math.hypot(b.x - mx, b.y - my) > 6) { mx = b.x; my = b.y; still = 0; } else { still += 1 / 480; if (still > 2 && b.y < 840) st = true; } }
    }
    if (entered) { hits++; if (!bestStart) bestStart = [sx, sy]; if (back || !w.balls.includes(b)) { returned++; maxRet = Math.max(maxRet, tBack); rets.push(tBack); } if (st) stuck++; }
  }
  rets.sort((a, b) => a - b); const p90 = rets.length ? rets[Math.floor(rets.length * 0.9)] : 0;
  report(hits / tries >= 0.15 && stuck === 0 && returned === hits && p90 <= 5 && maxRet <= 15, `${tg.name}: entered ${hits}/${tries} (${(100 * hits / tries).toFixed(0)}%), returned/drained ${returned}/${hits}, return time p90 ${p90.toFixed(1)}s max ${maxRet.toFixed(1)}s, stuck ${stuck}` + (bestStart ? ` e.g. from ${bestStart}` : ''));
}

// 3. real flipper shots
for (const fi of [0, 1]) {
  const tally = {}; let n = 0;
  for (const along of [20, 40, 60]) for (let d = 0; d <= 0.9; d += 0.06) {
    const evs = []; const [tb, w] = mk((t, o) => { if (t === 'ramp') evs.push(o.label); if (t === 'bumper') evs.push('pop'); if (t === 'drop') evs.push('drop'); if (t === 'rollover' && o.group === 'top') evs.push('toplane'); });
    const f = tb.flippers[fi], a = f.rest;
    const b = w.addBall(f.x + f.side * along * Math.cos(a), f.y + along * Math.sin(a) - 12, 0, 0);
    let first = null, tp = d, pressed = false;
    for (let i = 0; i < 480 * 7 && w.balls.includes(b); i++) { if (!pressed && i / 480 >= d) { f.pressed = true; pressed = true; } if (pressed && i / 480 > d + 0.4) f.pressed = false; w.step(); }
    n++; const key = evs.length ? [...new Set(evs)].sort().join('+') : (w.balls.includes(b) ? 'nothing' : 'drain-only');
    tally[key] = (tally[key] || 0) + 1;
  }
  console.log(`flipper ${fi ? 'RIGHT' : 'LEFT'} (${n} shots):`, JSON.stringify(tally));
}
console.log(fail ? 'FAILED ' + fail : 'ALL PASSED');
