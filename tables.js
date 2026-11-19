/* Table builders – geometry + rule data for the 5 tables. No DOM. */
(function (G) {
  'use strict';
  const P = (G.Pin = G.Pin || {});
  const PI = Math.PI;
  const MX = (x) => 565 - x; // mirror around the playfield centre

  class TB {
    constructor(def) {
      Object.assign(this, def);
      this.segs = []; this.circles = []; this.flippers = []; this.rollovers = [];
      this.spinners = []; this.saucers = []; this.ramps = []; this.bumpers = [];
      this.slings = []; this.movers = []; this.boosts = []; this.magnets = []; this.status = {};
    }
    wall(x1, y1, x2, y2, o) {
      o = o || {};
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1e-6;
      const s = {
        x1, y1, x2, y2, l, l2: l * l, ux: dx / l, uy: dy / l, nx: -dy / l, ny: dx / l,
        e: o.e != null ? o.e : 0.38, mu: o.mu != null ? o.mu : 0.05,
        kind: o.kind || 'wall', vis: o.vis !== false, group: o.group, up: true,
        kick: o.kick || 0, oneWay: !!o.oneWay, flash: 0, cool: 0,
        minx: Math.min(x1, x2), maxx: Math.max(x1, x2), miny: Math.min(y1, y2), maxy: Math.max(y1, y2),
      };
      if (o.nx != null) { s.nx = o.nx; s.ny = o.ny; }
      this.segs.push(s);
      return s;
    }
    poly(pts, o) { for (let i = 0; i < pts.length - 1; i++) this.wall(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o); }
    arc(cx, cy, r, a0, a1, n, o) {
      let px = cx + r * Math.cos(a0), py = cy + r * Math.sin(a0);
      for (let i = 1; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        this.wall(px, py, x, y, o); px = x; py = y;
      }
    }
    post(x, y, r, o) {
      o = o || {};
      const c = { x, y, r: r || 5, e: o.e != null ? o.e : 0.5, kind: 'post', vx: 0, vy: 0, flash: 0, cool: 0, kick: 0, vis: o.vis !== false };
      this.circles.push(c); return c;
    }
    bumper(x, y, r, o) {
      o = o || {};
      const c = { x, y, r: (r || 22) * 1.22, e: 0.4, kind: 'bumper', lit: false, vx: 0, vy: 0, flash: 0, cool: 0, kick: o.kick || 600, boost: 1, vis: true };
      this.circles.push(c); this.bumpers.push(c); return c;
    }
    mover(cx, cy, ax, ay, sp, r, o) {
      o = o || {};
      const c = { x: cx, y: cy, r: r || 15, e: 0.4, kind: 'mover', vx: 0, vy: 0, flash: 0, cool: 0, kick: o.kick || 520, boost: 1, vis: true,
        mv: { cx, cy, ax, ay, sp, ph: o.ph || 0, fy: o.fy || 1 } };
      this.circles.push(c); this.movers.push(c); return c;
    }
    flipper(x, y, side, len, o) {
      o = o || {};
      const rest = o.rest != null ? o.rest : 0.52, up = o.up != null ? o.up : -0.5;
      const f = { x, y, side, len, r0: o.r0 || 9, r1: o.r1 || 5, rest, up, ang: rest, w: 0, wUp: o.wUp || 21, wDown: 9, e: 0.35, eHit: 0.72,
        key: side > 0 ? 'L' : 'R', pressed: false, mini: !!o.mini };
      this.flippers.push(f); return f;
    }
    sling(p1, p2, p3) {
      this.wall(p1[0], p1[1], p2[0], p2[1], { e: 0.3 });
      this.wall(p2[0], p2[1], p3[0], p3[1], { e: 0.3 });
      const k = this.wall(p1[0], p1[1], p3[0], p3[1], { kind: 'sling', kick: 700, e: 0.2, vis: false });
      for (const p of [p1, p2, p3]) this.post(p[0], p[1], 3, { vis: false });
      this.slings.push({ p: [p1, p2, p3], seg: k });
    }
    dropBank(side, y0, n, group, o) {
      o = o || {};
      const x = side > 0 ? 26 : 539;
      for (let i = 0; i < n; i++) {
        const s = this.wall(x, y0 + i * 34, x, y0 + i * 34 + 30, { kind: 'drop', group, e: 0.2, vis: false });
        s.lbl = i;
      }
    }
    standBank(side, y0, n, group) {
      const x = side > 0 ? 26 : 539;
      for (let i = 0; i < n; i++) this.wall(x, y0 + i * 34, x, y0 + i * 34 + 30, { kind: 'stand', group, e: 0.3, vis: false });
    }
    topLanes(xs, y) {
      xs.forEach((x, i) => this.rollover(x, y, 'top', i));
      for (let i = 0; i < xs.length - 1; i++) {
        const mx = (xs[i] + xs[i + 1]) / 2;
        this.wall(mx, y - 45, mx, y + 14, { e: 0.3 });
        this.post(mx, y + 14, 3.5);
      }
      this.laneY = y;
    }
    sideLane(side, y0, y1, ys) {
      const w = 42;
      if (side > 0) {
        this.wall(20 + w, y0, 20 + w, y1, { e: 0.3 });
        this.post(20 + w, y0, 3); this.post(20 + w, y1, 3);
        this.spinner(20, ys, 20 + w, ys);
      } else {
        this.wall(545 - w, y0, 545 - w, y1, { e: 0.3 });
        this.post(545 - w, y0, 3); this.post(545 - w, y1, 3);
        this.spinner(545 - w, ys, 545, ys);
      }
    }
    spinner(x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy);
      this.spinners.push({ x1, y1, x2, y2, len: l, ux: dx / l, uy: dy / l, nx: -dy / l, ny: dx / l, angle: 0, omega: 0, acc: 0 });
    }
    rollover(x, y, group, idx, r) {
      const rv = { x, y, r: r || 11, group, idx, lit: false, in: new Set(), flash: 0 };
      this.rollovers.push(rv); return rv;
    }
    saucer(x, y, o) {
      const s = Object.assign({ x, y, r: 13, hold: 1.0, ejectAng: -PI / 2, ejectSpeed: 950, spread: 0.12, ball: null, timer: 0, cool: 0, kind: 'saucer', pull: 0, force: 0, locked: false }, o || {});
      this.saucers.push(s); return s;
    }
    passive(x, y, r) {
      const c = this.post(x, y, r || 13, { e: 0.72 }); c.passive = true; return c;
    }
    rubberTri(p1, p2, p3, col, label) {
      for (const [a, b] of [[p1, p2], [p2, p3], [p3, p1]]) this.wall(a[0], a[1], b[0], b[1], { kind: 'rubber', e: 0.78, mu: 0.02, vis: false });
      for (const p of [p1, p2, p3]) this.post(p[0], p[1], 4, { e: 0.6 });
      (this.rubbers = this.rubbers || []).push({ p: [p1, p2, p3], col, label });
    }
    /* Sample a chain of cubic beziers [[p0,c1,c2,p3],...] into points. */
    bez(curves, n) {
      n = n || 16; const pts = [];
      curves.forEach((c, k) => {
        for (let i = k ? 1 : 0; i <= n; i++) {
          const t = i / n, u = 1 - t;
          pts.push([u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0],
            u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1]]);
        }
      });
      return pts;
    }
    /* Walled floor-level channel along a centre path (points [[x,y],...] or bezier curves).
       o.width (default 40), o.left/o.right=false to omit a side, o.e restitution. Returns {left,right,centre}. */
    lane(path, o) {
      o = o || {};
      const pts = Array.isArray(path[0][0]) ? this.bez(path, o.n || 16) : path, hw = (o.width || 40) / 2, L = [], R = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        L.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]); R.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]);
      }
      const wo = { e: o.e != null ? o.e : 0.3, mu: 0.03 };
      if (o.left !== false) { this.poly(L, wo); this.post(L[0][0], L[0][1], 3); this.post(L.at(-1)[0], L.at(-1)[1], 3); }
      if (o.right !== false) { this.poly(R, wo); this.post(R[0][0], R[0][1], 3); this.post(R.at(-1)[0], R.at(-1)[1], 3); }
      (this.lanes = this.lanes || []).push({ pts, width: hw * 2, label: o.label, col: o.col });
      return { left: L, right: R, centre: pts };
    }
    /* n drop targets evenly along (x1,y1)->(x2,y2), any angle. o.back: signed offset of a solid backing wall
       along the segment normal (-dy,dx)/l so a dropped target never opens a hole into a pocket. */
    bank(x1, y1, x2, y2, n, group, o) {
      o = o || {};
      const dx = (x2 - x1) / n, dy = (y2 - y1) / n, gap = 0.08, out = [];
      for (let i = 0; i < n; i++) {
        const s = this.wall(x1 + dx * (i + gap), y1 + dy * (i + gap), x1 + dx * (i + 1 - gap), y1 + dy * (i + 1 - gap), { kind: 'drop', group, e: 0.2, vis: false });
        s.lbl = i; out.push(s);
      }
      if (o.back) {
        const l = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / l * o.back, ny = (x2 - x1) / l * o.back;
        this.wall(x1 + nx, y1 + ny, x2 + nx, y2 + ny, { e: 0.3 });
        this.wall(x1, y1, x1 + nx, y1 + ny, { e: 0.3 }); this.wall(x2, y2, x2 + nx, y2 + ny, { e: 0.3 });
      }
      return out;
    }
    boost(x, y, w, h, dir, acc, max) {
      this.boosts.push({ x, y, w, h, dx: dir[0], dy: dir[1], acc, max, flash: 0, in: new Set() });
    }
    magnet(x, y, r, force, period, onTime, phase) {
      this.magnets.push({ x, y, r, force, period, onTime, phase: phase || 0, on: false });
    }
    kicker(x, y, ang, speed) {
      return this.saucer(x, y, { r: 11, hold: 0.3, ejectAng: ang, ejectSpeed: speed, spread: 0.05, kicker: true });
    }
    lift(p0, c1, c2, p3, o) {
      return this.ramp(p0, c1, c2, p3, Object.assign({ lift: true, minSpd: -1e9, r: 15, dur: 1.2 }, o || {}));
    }
    ramp(p0, c1, c2, p3, o) {
      o = o || {};
      const pts = [];
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const t = i / N, u = 1 - t;
        pts.push({
          x: u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
          y: u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
        });
      }
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const len = cum[cum.length - 1];
      const dl = Math.hypot(c1[0] - p0[0], c1[1] - p0[1]);
      const rp = {
        kind: 'ramp', lift: !!o.lift, x: p0[0], y: p0[1], r: o.r || 20, dx: (c1[0] - p0[0]) / dl, dy: (c1[1] - p0[1]) / dl,
        minSpd: o.minSpd != null ? o.minSpd : 380, pts, cum, len, dur: o.dur || 1.05, exit: o.exit || { vx: 0, vy: 250 }, cool: 0, flash: 0,
        at(t) {
          const d = Math.max(0, Math.min(1, t)) * len;
          let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
          const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
          return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
        },
      };
      this.ramps.push(rp); return rp;
    }
  }

  /* Outer shell, lane, plunger, in/out lanes, slings and flippers (shared by every table) */
  function base(tb, o) {
    o = o || {};
    const len = o.flipLen || 78;
    tb.wall(20, 1000, 20, 300);
    tb.arc(300, 300, 280, PI, 2 * PI, 60);
    tb.wall(580, 300, 580, 1000);
    tb.wall(545, 965, 545, 235);
    tb.wall(545, 164, 545, 235, { oneWay: true, nx: -1, ny: 0, vis: false });
    tb.plungerSeg = tb.wall(545, 965, 580, 965, { vis: false });
    for (const side of [1, -1]) {
      const m = side > 0 ? (x) => x : MX;
      tb.wall(m(56), 770, m(56), 830);
      tb.post(m(56), 770, 3);
      tb.wall(m(56), 830, m(197), 876);
      tb.sling([m(86), 700], [m(86), 790], [m(150), 822]);
      tb.rollover(m(38), 742, 'out', side > 0 ? 0 : 1, 9);
      tb.rollover(m(71), 745, 'in', side > 0 ? 0 : 1, 9);
    }
    tb.flipper(195, 885, 1, len);
    tb.flipper(370, 885, -1, len);
    tb.status = {
      mb: [{ x: 252, y: 748 }, { x: 282, y: 748 }, { x: 312, y: 748 }],
      mult: [{ x: 237, y: 786 }, { x: 267, y: 786 }, { x: 297, y: 786 }, { x: 327, y: 786 }],
      saver: { x: 282, y: 828 },
    };
  }

  /* ---------------------------------------------------------------- 1. NEON ARCADE */
  function neon() {
    const tb = new TB({
      id: 'neon', name: 'CLASSIC FLIPPER', g: 930, music: { root: 57, tempo: 120, scale: [0, 2, 4, 7, 9], wave: 'triangle' },
      theme: { bg1: '#080b2e', bg2: '#1d0840', rail: '#a9b8ff', glow: '#00e5ff', glow2: '#ff2bd6', cap: '#ff2bd6', lamp: '#fff25a', ramp: '#00e5ff' },
      labels: { drop: 'BANK', stand: 'TARGETS', saucer: 'HOLE', ramp: '', bump: 'POP' },
    });
    base(tb);
    tb.topLanes([192, 242, 292, 342], 100);
    tb.bumper(182, 200, 25); tb.bumper(371, 200, 25); tb.bumper(205, 330, 25); tb.bumper(350, 330, 25);
    tb.rollover(277, 262, 'mid', 0, 12); tb.rollover(277, 330, 'mid', 1, 12);
    // plain side lanes (no gadgets)
    tb.wall(62, 235, 62, 345, { e: 0.3 }); tb.post(62, 235, 3); tb.post(62, 345, 3);
    tb.wall(503, 235, 503, 345, { e: 0.3 }); tb.post(503, 235, 3); tb.post(503, 345, 3);
    tb.rollover(41, 285, 'in', 0, 9); tb.rollover(524, 285, 'in', 1, 9);
    // row of four scoring holes
    [171, 243, 314, 386].forEach((x, k) => {
      const s = tb.saucer(x, 430, { r: 12, hold: 0.55, ejectAng: -PI / 2, ejectSpeed: 640, spread: 0.7, kicker: true });
      s.pts = (k + 1) * 1000;
    });
    [207, 278, 350].forEach((x) => tb.post(x, 432, 6));
    tb.post(135, 432, 6); tb.post(422, 432, 6);
    tb.standBank(1, 480, 2, 'standL'); tb.standBank(-1, 480, 2, 'standR');
    tb.passive(110, 595, 13); tb.passive(455, 595, 13); tb.passive(282, 565, 12);
    tb.passive(110, 300, 12); tb.passive(455, 300, 12);
    tb.rubberTri([74, 455], [74, 535], [120, 495], '#2b7de0', 'C');
    tb.rubberTri([491, 455], [491, 535], [445, 495], '#2b7de0', 'C');
    tb.numbers = true; tb.reels = true; tb.balls = 5; tb.replays = [80000, 120000, 160000];
    tb.passive(80, 166, 11); tb.passive(487, 166, 11); // top-arch rebound rubbers
    tb.word = 'SPECIAL';
    return tb;
  }

  /* ---------------------------------------------------------------- 2. PIRATE COVE */
  function pirate() {
    const tb = new TB({
      id: 'pirate', name: 'PIRATE COVE', g: 950, music: { root: 50, tempo: 108, scale: [0, 2, 3, 5, 7, 8, 10], wave: 'triangle' },
      theme: { bg1: '#06323f', bg2: '#10202b', rail: '#d9b26b', glow: '#ffcf5a', glow2: '#31d0c8', cap: '#d94b2b', lamp: '#ffd45e', ramp: '#d9a45a' },
      labels: { drop: 'SKULL BANK', stand: 'MAP PIECES', saucer: 'TREASURE!', ramp: 'SHIP RAMP', bump: 'CANNON' },
    });
    base(tb);
    tb.topLanes([212, 282, 352], 105);
    tb.bumper(190, 220, 22); tb.bumper(375, 220, 22); tb.bumper(282, 290, 22);
    tb.bumper(115, 310, 16); tb.bumper(450, 310, 16);
    tb.bumper(282, 400, 17);
    tb.saucer(478, 375, { ejectAng: -2.7, ejectSpeed: 800 });
    tb.bumper(140, 520, 16); tb.bumper(425, 520, 16);
    tb.dropBank(1, 420, 3, 'skulls');
    tb.standBank(-1, 250, 3, 'maps');
    tb.standBank(1, 290, 3, 'maps2');
    tb.spinner(257, 505, 307, 505);
    tb.post(257, 505, 4, { vis: false }); tb.post(307, 505, 4, { vis: false });
    tb.rollover(232, 465, 'mid', 0); tb.rollover(332, 465, 'mid', 1);
    tb.post(230, 565, 6); tb.post(335, 565, 6); tb.post(175, 440, 6); tb.post(390, 440, 6);
    tb.word = 'PIRATES';
    return tb;
  }

  /* ---------------------------------------------------------------- 3. SPACE ODYSSEY */
  function space() {
    const tb = new TB({
      id: 'space', name: 'SPACE ODYSSEY', g: 790, music: { root: 52, tempo: 96, scale: [0, 2, 4, 7, 9], wave: 'sine' },
      theme: { bg1: '#040514', bg2: '#1a0b3a', rail: '#9ab6ff', glow: '#7a8cff', glow2: '#55ffd0', cap: '#7a5cff', lamp: '#8dfff0', ramp: '#8fa6ff' },
      labels: { drop: 'PANEL BANK', stand: 'SENSORS', saucer: 'DOCKING', ramp: 'HYPER LANE', bump: 'ION' },
    });
    base(tb);
    tb.topLanes([232, 282, 332], 105);
    tb.bumper(160, 175, 20); tb.bumper(405, 175, 20); tb.bumper(205, 395, 20); tb.bumper(360, 395, 20); tb.bumper(282, 375, 18);
    tb.saucer(282, 255, { r: 13, hold: 0.9, ejectAng: PI / 2, ejectSpeed: 760, spread: 1.5 });
    tb.saucer(105, 470, { ejectAng: -0.35, ejectSpeed: 820 });
    tb.flipper(27, 575, 1, 46, { rest: 0.5, up: -0.42, mini: true, r0: 8, r1: 5 });
    tb.flipper(538, 575, -1, 46, { rest: 0.5, up: -0.42, mini: true, r0: 8, r1: 5 });
    tb.bumper(150, 560, 16); tb.bumper(415, 560, 16); tb.bumper(282, 160, 18);
    tb.dropBank(-1, 330, 4, 'panels');
    tb.standBank(1, 330, 3, 'sensors');
    tb.standBank(-1, 205, 3, 'sensorsR'); tb.standBank(1, 205, 3, 'sensorsL');
    tb.rollover(232, 500, 'mid', 0); tb.rollover(332, 500, 'mid', 1);
    tb.post(282, 470, 8); tb.post(180, 300, 5); tb.post(385, 300, 5);
    tb.word = 'GALAXY';
    return tb;
  }

  /* ---------------------------------------------------------------- 4. HAUNTED MANOR */
  function haunted() {
    const tb = new TB({
      id: 'haunted', name: 'HAUNTED MANOR', g: 950, music: { root: 45, tempo: 84, scale: [0, 2, 3, 5, 7, 8, 11], wave: 'sawtooth' },
      theme: { bg1: '#0d0a1a', bg2: '#1a2a1d', rail: '#9fb39f', glow: '#7dff6a', glow2: '#b04bff', cap: '#ff8a1f', lamp: '#9dff7a', ramp: '#7dff6a' },
      labels: { drop: 'GRAVEYARD', stand: 'SEANCE', saucer: 'CRYPT', ramp: 'STAIRWAY', bump: 'PUMPKIN' },
      storm: true,
    });
    base(tb);
    tb.topLanes([222, 282, 342], 105);
    tb.bumper(175, 195, 21, { kick: 640 }); tb.bumper(390, 195, 21, { kick: 640 }); tb.bumper(282, 170, 21, { kick: 640 });
    tb.bumper(230, 262, 16, { kick: 600 }); tb.bumper(335, 262, 16, { kick: 600 });
    tb.bumper(282, 345, 19, { kick: 620 });
    tb.sideLane(1, 235, 335, 285); tb.sideLane(-1, 235, 335, 285);
    tb.saucer(72, 425, { ejectAng: -0.55, ejectSpeed: 820 });
    tb.saucer(493, 425, { ejectAng: -PI + 0.55, ejectSpeed: 820 });
    [[120, 150], [160, 190], [375, 405], [415, 445]].forEach((p, i) => {
      const s = tb.wall(p[0], 530, p[1], 530, { kind: 'drop', group: 'tomb', e: 0.2, vis: false });
      s.lbl = i;
    });
    tb.standBank(1, 490, 2, 'seanceL');
    tb.standBank(-1, 490, 2, 'seanceR');
    tb.rollover(232, 440, 'mid', 0); tb.rollover(332, 440, 'mid', 1);
    tb.post(282, 480, 7); tb.post(200, 430, 6); tb.post(365, 430, 6);
    tb.passive(80, 166, 11); tb.passive(487, 166, 11); // top-arch rebound rubbers
    tb.word = 'HAUNTED';
    return tb;
  }

  /* ---------------------------------------------------------------- 5. VOLCANO ISLAND */
  function volcano() {
    const tb = new TB({
      id: 'volcano', name: 'VOLCANO ISLAND', g: 1030, music: { root: 43, tempo: 144, scale: [0, 1, 4, 5, 7, 8], wave: 'sawtooth' },
      theme: { bg1: '#2a0a05', bg2: '#0e0505', rail: '#e0a37a', glow: '#ff7a1a', glow2: '#ffd23f', cap: '#ff3b1a', lamp: '#ffd23f', ramp: '#ff7a1a' },
      labels: { drop: 'LAVA BANK', stand: 'ROCK TARGETS', saucer: 'CRATER', ramp: 'LAVA FLOW', bump: 'ERUPTION' },
    });
    base(tb, { flipLen: 72 });
    tb.topLanes([232, 282, 332], 105);
    [[282, 185], [352, 238], [325, 318], [239, 318], [212, 238]].forEach((p) => tb.bumper(p[0], p[1], 19, { kick: 660 }));
    tb.bumper(160, 400, 16, { kick: 640 }); tb.bumper(405, 400, 16, { kick: 640 });
    tb.bumper(140, 545, 15, { kick: 640 }); tb.bumper(425, 545, 15, { kick: 640 });
    tb.dropBank(1, 400, 3, 'lavaL');
    tb.dropBank(-1, 400, 3, 'lavaR');
    tb.standBank(1, 502, 2, 'rockL'); tb.standBank(-1, 502, 2, 'rockR');
    tb.bumper(282, 465, 16, { kick: 640 });
    tb.saucer(282, 565, { ejectSpeed: 1100 });
    tb.sideLane(1, 235, 330, 285); tb.sideLane(-1, 235, 330, 285);
    tb.rollover(232, 520, 'mid', 0); tb.rollover(332, 520, 'mid', 1);
    tb.post(200, 600, 6); tb.post(365, 600, 6); tb.post(282, 400, 6);
    tb.passive(80, 166, 11); tb.passive(487, 166, 11); // top-arch rebound rubbers
    tb.word = 'VOLCANO';
    return tb;
  }

  P.TABLES = [
    { id: 'neon', name: 'CLASSIC FLIPPER', he: 'פינבול קלאסי', diff: 1, build: neon,
      desc: 'שולחן קלאסי: 4 בומפרים, חורים מנקדים, נתיבי מספרים ורמפה לקומה השנייה.' },
    { id: 'pirate', name: 'PIRATE COVE', he: 'מפרץ הפיראטים', diff: 2, build: pirate,
      desc: 'אונייה מאוירת, תותחים, מפת אוצר וצלחת. ירו על הגולגולות!' },
    { id: 'space', name: 'SPACE ODYSSEY', he: 'אודיסיאה בחלל', diff: 3, build: space,
      desc: 'כבידה נמוכה, פליפרים קטנים בצדדים ובנקי מטרות. חלל!' },
    { id: 'haunted', name: 'HAUNTED MANOR', he: 'אחוזה רדופה', diff: 4, build: haunted,
      desc: 'קריפטות, מצבות ורעמים. תיזהרו מהסערה.' },
    { id: 'volcano', name: 'VOLCANO ISLAND', he: 'אי הר הגעש', diff: 5, build: volcano,
      desc: 'הכי קשה: כבידה חזקה, פליפרים קצרים, התפרצויות ושני בנקי לבה.' },
  ];
  P.TableBuilder = TB;
  P.baseTable = base;
})(typeof globalThis !== 'undefined' ? globalThis : window);
