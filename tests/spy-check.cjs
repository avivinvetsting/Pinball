/* SPY ESPIONAGE playability check: plunger, lane/ramp/saucer reachability, flipper shots, stuck balls.
   Usage: node tests/spy-check.cjs */
const path = require('node:path'), root = path.resolve(__dirname, '..');
require(root + '/engine.js'); require(root + '/tables.js'); require(root + '/tables/quest.js'); require(root + '/tables/spy.js'); require(root + '/tables/frenzy.js'); require(root + '/designs.js');
const P = globalThis.Pin, def = P.TABLES.find((d) => d.id === 'spy');
const HZ = 480; let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
let failures = 0; const fail = (m) => { failures++; console.log('  FAIL: ' + m); };

function run(setup, o) {
  const tb = def.build(), ev = {}, w = new P.World(tb, { event: (t, o) => { ev[t] = (ev[t] || 0) + 1; if (t === 'rollover' && o) ev['rollover:' + o.group] = (ev['rollover:' + o.group] || 0) + 1; } });
  const b = setup(w, tb); const steps = Math.round((o.secs || 6) * HZ); let minY = 1e9, retY = null, still = 0, sx = b.x, sy = b.y, enteredAt = null;
  for (let i = 0; i < steps && w.balls.length; i++) {
    if (o.flip) o.flip(tb, i / HZ);
    w.step(); const t = i / HZ;
    if (b.cap) { minY = Math.min(minY, b.y); sx = b.x; sy = b.y; still = 0; if (o.cap && !enteredAt) enteredAt = t; continue; }
    minY = Math.min(minY, b.y);
    if (o.enter && enteredAt == null && o.enter(b, ev)) enteredAt = t;
    if (enteredAt != null && retY == null && b.y > 600 && t > enteredAt + .2) retY = t;
    if (Math.hypot(b.x - sx, b.y - sy) > 6) { sx = b.x; sy = b.y; still = 0; } else still += 1 / HZ;
    if (still > 1.5 && b.y < 840 && b.x < 545) return { stuck: [Math.round(b.x), Math.round(b.y)], ev, enteredAt, retY, minY };
  }
  return { ev, enteredAt, retY, minY, drained: !w.balls.length, x: b.x, y: b.y };
}

// 1. plunger
{
  let ok = 0;
  for (let k = 0; k < 20; k++) {
    const r = run((w) => w.addBall(562, 950, (rnd() - .5) * 40, -2400), { secs: 4, enter: (b) => b.x < 545 && b.y < 300 });
    if (r.enteredAt != null && r.enteredAt < 2) ok++; else if (k < 3) console.log('   plunger miss', JSON.stringify(r));
  }
  console.log('PLUNGER: reached field (x<545,y<300) within 2s in ' + ok + '/20'); if (ok < 18) fail('plunger');
}

// 2. aimed shots from y 700-800
const lanes = [
  { n: 'GADGET ORBIT entrance (mouth gap)', x0: 175, x1: 275, tx: 137, ty: 377, enter: (b) => b.y < 350 && b.x < 215 && b.x > 60 },
  { n: 'orbit: reaches top corridor/T (y<110)', x0: 175, x1: 275, tx: 137, ty: 377, enter: (b) => b.y < 110 },
  { n: 'orbit -> WIRE RAMP captured', x0: 175, x1: 275, tx: 137, ty: 377, cap: true, enter: (b, ev) => ev.ramp > 0 },
  { n: 'SAFEHOUSE L saucer', x0: 175, x1: 275, tx: 172, ty: 433, enter: (b, ev) => ev.saucer > 0 },
  { n: 'C-I-A bank hit', x0: 175, x1: 275, tx: 120, ty: 530, enter: (b, ev) => ev.drop > 0 },
  { n: 'S-P-Y bank hit', x0: 290, x1: 390, tx: 449, ty: 545, enter: (b, ev) => ev.drop > 0 },
  { n: 'ENEMY RADAR target hit', x0: 200, x1: 340, tx: 274, ty: 546, enter: (b, ev) => ev.stand > 0 },
  { n: 'BULLSEYE triangle hit', x0: 200, x1: 340, tx: 323, ty: 477, enter: (b, ev) => ev.stand > 0 },
  { n: 'orbit -> SAFEHOUSE R saucer', x0: 175, x1: 275, tx: 137, ty: 377, enter: (b, ev) => ev.saucer > 0 },
  { n: 'orbit -> A-G-E-N-T top rollover', x0: 175, x1: 275, tx: 137, ty: 377, enter: (b, ev) => ev['rollover:top'] > 0 },
  { n: 'orbit -> POP BUMPER hit', x0: 175, x1: 275, tx: 137, ty: 377, enter: (b, ev) => ev.bumper > 0 },
  { n: 'orbit -> bowl drain via gate then lower field', x0: 175, x1: 275, tx: 137, ty: 377, enter: (b, ev) => b.x > 190 && b.x < 470 && b.y > 220 && b.y < 360 },
];
for (const L of lanes) {
  const N = 60; let hit = 0, ret = 0, stuck = 0, drain = 0, rets = [], stuckAt = [];
  for (let k = 0; k < N; k++) {
    const fx = (L.x0 || 175) + rnd() * ((L.x1 || 390) - (L.x0 || 175)), fy = 700 + rnd() * 100, ang = Math.atan2(L.ty - fy, L.tx - fx) + (rnd() - .5) * 0.12, sp = 1400 + rnd() * 600;
    const r = run((w) => w.addBall(fx, fy, Math.cos(ang) * sp, Math.sin(ang) * sp), { secs: 8, enter: L.enter, cap: L.cap });
    const bumpHit = L.n.startsWith('POP') ? ((r.ev.hit || 0) > 0) : false;
    if (r.enteredAt != null) hit++;
    if (r.stuck) { stuck++; stuckAt.push(r.stuck.join(',')); }
    if (r.enteredAt != null && r.retY != null) { ret++; rets.push(r.retY - r.enteredAt); }
    if (r.drained) drain++;
  }
  const pct = Math.round(hit / N * 100);
  console.log(L.n.padEnd(42) + ' entered ' + hit + '/' + N + ' (' + pct + '%)  returned y>600: ' + ret + '  stuck: ' + stuck + (stuckAt.length ? ' @' + stuckAt.join(' ') : '') + '  drained: ' + drain + (rets.length ? '  maxReturn ' + Math.max(...rets).toFixed(1) + 's' : ''));
  if (pct < 15) fail(L.n + ' below 15%');
  if (stuck) fail(L.n + ' stuck balls');
}

// 3. real flipper shots: ball released at the top of the flipper rolls toward the tip; the flipper fires when the ball
//    reaches a given distance along it (swept 20..80 px) => different launch angles/speeds
for (const side of [1, -1]) {
  const dest = {};
  for (let k = 0; k < 40; k++) {
    const sk = 20 + k * 1.5, tb = def.build(), ev = {}, w = new P.World(tb, { event: (t, o) => { ev[t] = (ev[t] || 0) + 1; } });
    const f = tb.flippers[side > 0 ? 0 : 1], b = w.addBall(f.x + side * 12, f.y - 40, side * 40, 0); let fireT = null, minY = 1e9, still = 0, sx = b.x, sy = b.y, stuck = false, inBand = false;
    for (let i = 0; i < 7 * HZ && w.balls.length; i++) {
      const t = i / HZ;
      if (fireT == null && (b.x - f.x) * side >= sk && b.y > f.y - 60) fireT = t;
      f.pressed = fireT != null && t < fireT + .3; w.step();
      if (b.cap) { still = 0; continue; }
      minY = Math.min(minY, b.y);
      if (b.x > 215 && b.x < 440 && b.y > 352 + (b.x - 206) * 0.37 + 4 && b.y < 384 + (b.x - 182) * 0.365 - 4) inBand = true;
      if (Math.hypot(b.x - sx, b.y - sy) > 6) { sx = b.x; sy = b.y; still = 0; } else still += 1 / HZ;
      if (still > 1.5 && b.y < 840) { stuck = true; break; }
    }
    const flags = [stuck && 'STUCK', ev.ramp && 'wire ramp', ev.saucer && 'saucer', ev.drop && 'drop bank', ev.stand && 'stand targets', ev.bumper && 'bumpers', ev['rollover'] > 2 && 'rollovers', minY < 250 && 'reached y<250 (orbit/top)', inBand && 'entered lane-guides band', minY >= 420 && 'low only'].filter(Boolean);
    for (const key of flags) dest[key] = (dest[key] || 0) + 1;
  }
  console.log('FLIPPER ' + (side > 0 ? 'LEFT ' : 'RIGHT') + ' shot outcomes, non-exclusive (40 fire positions): ' + JSON.stringify(dest));
  if (dest.STUCK) fail('flipper shot stuck');
}
console.log(failures ? 'RESULT: ' + failures + ' failure(s)' : 'RESULT: all checks passed'); process.exit(failures ? 1 : 0);
