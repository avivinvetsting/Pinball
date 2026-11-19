/* DARK QUEST playability checks: plunger launch, every lane / ramp / saucer reachable from the flipper area and exits again,
   plus real flipper shots. Usage: node tests/quest-check.cjs */
require('../engine.js'); require('../tables.js'); require('../tables/quest.js'); require('../tables/spy.js'); require('../tables/frenzy.js'); require('../designs.js');
const P = globalThis.Pin, def = P.TABLES.find((d) => d.id === 'quest');
const A = (x, y) => [20 + x * 525 / 972, y * 940 / 1619];
let fail = 0;
const report = (ok, msg) => { if (!ok) fail++; console.log((ok ? 'PASS ' : 'FAIL ') + msg); };
const STEP = 1 / 480;

// 1. plunger launch
{
  const tb = def.build(), w = new P.World(tb), b = w.addBall(562, 950, 0, -2400);
  let minY = 1e9, inField = false, tIn = -1;
  for (let i = 0; i < 960; i++) { w.step(); if (!w.balls.includes(b)) break; minY = Math.min(minY, b.y); if (b.y < 300 && b.x < 545 && !inField) { inField = true; tIn = i * STEP; } }
  report(minY < 300 && inField, `plunger: minY=${Math.round(minY)} enteredField=${inField} at t=${tIn.toFixed(2)}s`);
  // keeps moving into play (not stuck in the corner)
  const tb2 = def.build(), w2 = new P.World(tb2), b2 = w2.addBall(562, 950, 0, -2400);
  let y6 = null; for (let i = 0; i < 480 * 8 && w2.balls.includes(b2); i++) { w2.step(); }
  report(!w2.balls.includes(b2) || b2.y > 120, `plunger: after 8s ball y=${w2.balls.includes(b2) ? Math.round(b2.y) : 'drained'}`);
}

// 2. lane / ramp / saucer reachability. Shots start on a grid above the flippers (y 640-800), aimed at the entrance with 1400-2000 px/s
//    and a fan of angles. Pass = >=15% of the shots from the 8 best start points (a player picks the angle) enter, and every ball that
//    enters returns to the lower field (y>600) within 8 s.
const grid = [];
for (const y of [660, 720, 780]) for (let x = 150; x <= 430; x += 35) { if ((x < 175 && y > 740) || (x > 390 && y > 740)) continue; grid.push([x, y]); }
const speeds = [1400, 1700, 2000];
const T = (name, aim, entered) => ({ name, aim, entered });
const targets = [
  T('DRAWBRIDGE lane (left U)', A(190, 545), (b) => b.y < 110 && b.x > 60 && b.x < 260),
  T('DUNGEON lane (gate saucer)', A(505, 300), (b, w) => b.cap === w.t.saucers[0]),
  T('ARMORY lane 1 (left)', A(620, 300), (b) => b.y < 100 && b.x > 340 && b.x < 440),
  T('ARMORY lane 2 (post/keep)', A(740, 300), (b) => b.y < 100 && b.x > 385 && b.x < 470),
  T('KEEP lane (right of keep block)', A(930, 330), (b) => b.y < 110 && b.x > 495),
  T('RIGHT ORBIT band', A(820, 540), (b) => b.y < 230 && b.x > 470),
  T('UPPER KEEP RAMP entry', [74, 305], (b, w) => b.cap === w.t.ramps[0]),
];
for (const tg of targets) {
  const per = [];
  let exits = 0, hitsAll = 0, stuck = 0, slow = 0, e = null;
  for (const [sx, sy] of grid) {
    let hits = 0, tries = 0;
    for (const sp of speeds) {
      const base = Math.atan2(tg.aim[1] - sy, tg.aim[0] - sx);
      for (let da = -0.1; da <= 0.1001; da += 0.025) {
        tries++;
        const tb = def.build(), w = new P.World(tb), a = base + da, b = w.addBall(sx, sy, Math.cos(a) * sp, Math.sin(a) * sp);
        let entered = false, tEnter = 0, done = false;
        for (let i = 0; i < 480 * 12 && w.balls.includes(b); i++) {
          w.step();
          if (!entered && tg.entered(b, w)) { entered = true; tEnter = i * STEP; hits++; hitsAll++; }
          if (entered && !b.cap && b.y > 600) { exits++; slow = Math.max(slow, i * STEP - tEnter); done = true; break; }
          if (entered && i * STEP - tEnter >= 8) break;
          if (!entered && i * STEP > 3) break;
        }
        if (entered && !done && w.balls.includes(b) && (() => { let still = 0, px = b.x, py = b.y; for (let j = 0; j < 480 * 14 && w.balls.includes(b); j++) { w.step(); if (b.y > 600) return false; if (j % 480 === 0) { if (Math.hypot(b.x - px, b.y - py) < 8 && !b.cap) still++; else still = 0; px = b.x; py = b.y; if (still >= 3) return true; } } return w.balls.includes(b) && b.y <= 600; })()) { stuck++; e = [sx, sy, sp, da.toFixed(2), Math.round(b.x), Math.round(b.y)]; }
        else if (entered && !done) exits++; // drained = left the table, fine
      }
    }
    per.push({ sx, sy, hits, tries });
  }
  per.sort((p, q) => q.hits - p.hits);
  const best = per.slice(0, 8), rate = best.reduce((s, p) => s + p.hits, 0) / best.reduce((s, p) => s + p.tries, 0);
  report(rate >= 0.15 && stuck === 0, `${tg.name}: best-8-starts ${(100 * rate).toFixed(0)}% (all grid ${hitsAll}/${grid.length * speeds.length * 9}); best starts ${best.slice(0, 3).map((p) => p.sx + ',' + p.sy + ':' + p.hits + '/' + p.tries).join(' ')}; returned ${exits}/${hitsAll}, slowest ${slow.toFixed(1)}s, not-returned ${stuck}${stuck ? ' e.g. ' + JSON.stringify(e) : ''}`);
}

// 3. real flipper shots: a ball placed on the flipper (rolling toward the tip), flipper pressed after several delays and held 0.3 s.
{
  const out = {};
  for (const side of [0, 1]) {
    const name = side ? 'right flipper' : 'left flipper', feat = {}; let shots = 0, upper = 0;
    for (const d of [20, 35, 50, 65]) for (const delay of [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]) {
      const tb = def.build(), w = new P.World(tb), f = tb.flippers[side];
      const b = w.addBall(f.x + f.side * d * Math.cos(f.rest), f.y + d * Math.sin(f.rest) - 11.5, 0, 0);
      const got = new Set(); let minY = 1e9;
      for (let i = 0; i < 480 * 6 && w.balls.includes(b); i++) {
        const tt = i * STEP; f.pressed = tt >= delay && tt < delay + 0.3;
        w.step(); minY = Math.min(minY, b.y);
        if (b.cap) got.add(b.cap.kind === 'ramp' ? 'ramp' : 'dungeon saucer');
        else if (b.y < 110 && b.x < 255) got.add('drawbridge top'); else if (b.y < 110 && b.x < 340) got.add('dungeon/armory1 top'); else if (b.y < 110) got.add('armory/keep top');
        else if (b.y < 340 && b.x > 440) got.add('right orbit/keep lane');
      }
      shots++; if (minY < 450) upper++; for (const k of got) feat[k] = (feat[k] || 0) + 1;
    }
    out[name] = { shots, reachedAboveY450: upper, features: feat };
    report(upper / shots > 0.3, `${name}: ${upper}/${shots} shots reach the upper field; features ${JSON.stringify(feat)}`);
  }
}
console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
process.exit(fail ? 1 : 0);
