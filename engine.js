/* Pinball physics engine – pure logic, no DOM. Works in browser and Node. */
(function (G) {
  'use strict';
  const P = (G.Pin = G.Pin || {});
  const DT = 1 / 480;
  const MAXV = 2600;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  let ballId = 1;
  class Ball {
    constructor(x, y) {
      this.id = ballId++;
      this.x = x; this.y = y; this.px = x; this.py = y;
      this.vx = 0; this.vy = 0; this.r = 10;
      this.cap = null; this.rampT = 0;
      this.snd = 0; this.age = 0; this.still = 0;
      this.trail = [];
      this.rollAng = 0;
    }
  }

  class World {
    constructor(table, hooks) {
      this.t = table;
      this.h = hooks || {};
      this.balls = [];
      this.time = 0;
    }
    ev(type, obj, ball, val) { if (this.h.event) this.h.event(type, obj, ball, val); }
    addBall(x, y, vx, vy) {
      const b = new Ball(x, y);
      b.vx = vx || 0; b.vy = vy || 0;
      this.balls.push(b);
      return b;
    }
    eject(s, speed, ang) {
      const b = s.ball;
      if (!b) return;
      const tn = s.tunnelTo, ex = tn ? tn.x : s.x, ey = tn ? tn.y : s.y, sp = speed != null ? speed : (tn && tn.ejectSpeed != null ? tn.ejectSpeed : s.ejectSpeed);
      const a = ang != null ? ang : (tn && tn.ejectAng != null ? tn.ejectAng : s.ejectAng) + (Math.random() - 0.5) * (s.spread || 0.12);
      b.cap = null; s.ball = null; s.cool = 0.9;
      b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
      b.x = ex + Math.cos(a) * 14; b.y = ey + Math.sin(a) * 14; b.tunnelProg = 0;
      b.px = b.x; b.py = b.y;
      this.ev('eject', s, b);
    }
    resetDrops(group) {
      for (const s of this.t.segs) if (s.kind === 'drop' && s.group === group) { s.up = true; s.flash = 0.5; }
    }

    contact(b, nx, ny, pen, svx, svy, e, mu) {
      b.x += nx * pen; b.y += ny * pen;
      const rvx = b.vx - svx, rvy = b.vy - svy;
      const vn = rvx * nx + rvy * ny;
      if (vn >= 0) return 0;
      const ee = -vn < 60 ? 0 : e;
      const j = -(1 + ee) * vn;
      b.vx += nx * j; b.vy += ny * j;
      if (mu > 0) {
        const tx = -ny, ty = nx;
        const vt = rvx * tx + rvy * ty;
        const lim = mu * j;
        const jf = clamp(-vt, -lim, lim);
        b.vx += tx * jf; b.vy += ty * jf;
      }
      return -vn;
    }

    collide(b) {
      const r = b.r, t = this.t;
      // segments
      for (let i = 0; i < t.segs.length; i++) {
        const s = t.segs[i];
        if (s.kind === 'drop' && !s.up) continue;
        if (b.x < s.minx - r || b.x > s.maxx + r || b.y < s.miny - r || b.y > s.maxy + r) continue;
        const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
        let tt = ((b.x - s.x1) * dx + (b.y - s.y1) * dy) / s.l2;
        tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        const ex = b.x - (s.x1 + tt * dx), ey = b.y - (s.y1 + tt * dy);
        const d2 = ex * ex + ey * ey;
        if (d2 >= r * r) continue;
        if (s.oneWay && (b.x - s.x1) * s.nx + (b.y - s.y1) * s.ny < 0) continue;
        let d = Math.sqrt(d2), nx, ny;
        if (d < 1e-6) { nx = s.nx; ny = s.ny; d = 0; } else { nx = ex / d; ny = ey / d; }
        const imp = this.contact(b, nx, ny, r - d, 0, 0, s.e, s.mu);
        if (imp <= 0) continue;
        switch (s.kind) {
          case 'sling':
            if (s.kick && imp > 90 && s.cool <= 0) {
              const dot = b.vx * nx + b.vy * ny;
              if (dot < s.kick) { b.vx += nx * (s.kick - dot); b.vy += ny * (s.kick - dot); }
              s.flash = 0.18; s.cool = 0.12;
              this.ev('sling', s, b);
            }
            break;
          case 'stand':
            if (imp > 70 && s.cool <= 0) { s.flash = 0.35; s.cool = 0.12; this.ev('stand', s, b); }
            break;
          case 'drop':
            if (imp > 45) { s.up = false; s.flash = 0.4; this.ev('drop', s, b); }
            break;
          case 'rubber':
            if (imp > 140 && s.cool <= 0) { s.cool = 0.1; s.flash = 0.15; this.ev('rubber', s, b, imp); }
            break;
          default:
            if (imp > 240 && b.snd <= 0) { b.snd = 0.06; this.ev('hit', s, b, imp); }
        }
      }
      // circles
      for (let i = 0; i < t.circles.length; i++) {
        const c = t.circles[i];
        const rr = r + c.r;
        const ex = b.x - c.x, ey = b.y - c.y;
        const d2 = ex * ex + ey * ey;
        if (d2 >= rr * rr) continue;
        let d = Math.sqrt(d2), nx, ny;
        if (d < 1e-6) { nx = 0; ny = -1; d = 0; } else { nx = ex / d; ny = ey / d; }
        const imp = this.contact(b, nx, ny, rr - d, c.vx || 0, c.vy || 0, c.e, 0.02);
        if (imp <= 0) continue;
        if (c.kick) {
          if (imp > 12 && c.cool <= 0) {
            const dot = b.vx * nx + b.vy * ny;
            const k = c.kick * (c.boost || 1);
            if (dot < k) { b.vx += nx * (k - dot); b.vy += ny * (k - dot); }
            c.flash = 0.2; c.cool = 0.09;
            this.ev(c.kind, c, b);
          }
        } else if (c.passive) { if (imp > 120 && c.cool <= 0) { c.cool = 0.1; c.flash = 0.2; this.ev('passive', c, b, imp); } }
        else if (imp > 200 && b.snd <= 0) { b.snd = 0.06; this.ev('hit', c, b, imp); }
      }
      // flippers
      for (let i = 0; i < t.flippers.length; i++) {
        const f = t.flippers[i];
        const ca = Math.cos(f.ang), sa = Math.sin(f.ang);
        const ex0 = f.x + f.side * f.len * ca, ey0 = f.y + f.len * sa;
        const dx = ex0 - f.x, dy = ey0 - f.y;
        if (b.x < Math.min(f.x, ex0) - 20 || b.x > Math.max(f.x, ex0) + 20 || b.y < Math.min(f.y, ey0) - 20 || b.y > Math.max(f.y, ey0) + 20) continue;
        let tt = ((b.x - f.x) * dx + (b.y - f.y) * dy) / (f.len * f.len);
        tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        const cx = f.x + tt * dx, cy = f.y + tt * dy;
        const rad = f.r0 + (f.r1 - f.r0) * tt;
        const rr = r + rad;
        const ex = b.x - cx, ey = b.y - cy;
        const d2 = ex * ex + ey * ey;
        if (d2 >= rr * rr) continue;
        let d = Math.sqrt(d2), nx, ny;
        if (d < 1e-6) { nx = 0; ny = -1; d = 0; } else { nx = ex / d; ny = ey / d; }
        const dist = tt * f.len;
        const svx = dist * f.w * (-f.side * sa), svy = dist * f.w * ca;
        // A swinging flipper strikes with lively rubber (eHit) so the ball separates in one clean hit
        // instead of being re-hit and carried through the swing; a resting flipper stays dead (e) for catches.
        const sn = svx * nx + svy * ny;
        const imp = this.contact(b, nx, ny, rr - d, svx, svy, sn > 150 ? (f.eHit || f.e) : f.e, 0.25);
        if (imp > 260 && b.snd <= 0) { b.snd = 0.06; this.ev('hit', f, b, imp); }
      }
    }

    step() {
      const t = this.t, dt = DT;
      this.time += dt;
      // flippers
      for (const f of t.flippers) {
        const target = f.pressed ? f.up : f.rest;
        const old = f.ang;
        const rate = (f.pressed ? f.wUp : f.wDown) * dt;
        if (f.ang < target) f.ang = Math.min(target, f.ang + rate);
        else f.ang = Math.max(target, f.ang - rate);
        f.w = (f.ang - old) / dt;
      }
      // moving circles + timers
      for (const c of t.circles) {
        if (c.mv) {
          const m = c.mv, ph = this.time * m.sp + m.ph, fy = m.fy || 1;
          c.x = m.cx + Math.sin(ph) * m.ax;
          c.y = m.cy + Math.sin(ph * fy) * m.ay;
          c.vx = Math.cos(ph) * m.sp * m.ax;
          c.vy = Math.cos(ph * fy) * m.sp * fy * m.ay;
        }
        if (c.flash > 0) c.flash -= dt;
        if (c.cool > 0) c.cool -= dt;
      }
      for (const s of t.segs) { if (s.flash > 0) s.flash -= dt; if (s.cool > 0) s.cool -= dt; }
      for (const sp of t.spinners) {
        sp.angle += sp.omega * dt;
        sp.acc += Math.abs(sp.omega) * dt;
        if (sp.acc >= Math.PI) { sp.acc -= Math.PI; this.ev('spin', sp, null); }
        sp.omega *= 1 - 0.7 * dt;
        if (Math.abs(sp.omega) < 0.3) sp.omega = 0;
      }
      for (const s of t.saucers) if (s.cool > 0) s.cool -= dt;
      for (const rp of t.ramps) { if (rp.cool > 0) rp.cool -= dt; if (rp.flash > 0) rp.flash -= dt; }
      for (const z of t.boosts) if (z.flash > 0) z.flash -= dt;
      for (const m of t.magnets) {
        const on = (this.time + m.phase) % m.period < m.onTime;
        if (on && !m.on) this.ev('magnet', m, null);
        m.on = on;
      }

      const balls = this.balls;
      let drained = null;
      for (const b of balls) {
        if (b.cap) { this.capStep(b, dt); continue; }
        b.px = b.x; b.py = b.y;
        b.age += dt;
        if (b.snd > 0) b.snd -= dt;
        b.vy += t.g * dt;
        for (const s of t.saucers) {
          if (s.pull && !s.ball && s.cool <= 0) {
            const dx = s.x - b.x, dy = s.y - b.y, d = Math.hypot(dx, dy);
            if (d < s.pull && d > 1) {
              const f = s.force * (1 - d / s.pull);
              b.vx += (dx / d) * f * dt; b.vy += (dy / d) * f * dt;
            }
          }
        }
        for (const z of t.boosts) {
          if (b.x > z.x && b.x < z.x + z.w && b.y > z.y && b.y < z.y + z.h) {
            const al = b.vx * z.dx + b.vy * z.dy;
            if (al > 120 && al < z.max) { b.vx += z.dx * z.acc * dt; b.vy += z.dy * z.acc * dt; }
            if (!z.in.has(b.id)) { z.in.add(b.id); z.flash = 0.45; this.ev('boost', z, b); }
          } else if (z.in.size) z.in.delete(b.id);
        }
        for (const m of t.magnets) {
          if (!m.on) continue;
          const dx = m.x - b.x, dy = m.y - b.y, d = Math.hypot(dx, dy);
          if (d < m.r && d > 1) {
            const f = m.force * (1 - d / m.r);
            b.vx += (dx / d) * f * dt; b.vy += (dy / d) * f * dt;
            if (d < m.r * 0.3) { b.vx *= 1 - 3.5 * dt; b.vy *= 1 - 3.5 * dt; }
          }
        }
        if (this.magna && b.y > 760 && (b.x < 56 || (b.x > 509 && b.x < 545))) {
          b.vy -= t.g * 1.35 * dt;
          const cx = b.x < 56 ? 38 : 527;
          b.vx += (cx - b.x) * 6 * dt; b.vx *= 1 - 2.5 * dt; b.vy *= 1 - 0.6 * dt;
        }
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > MAXV) { b.vx *= MAXV / sp; b.vy *= MAXV / sp; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        this.collide(b);
        this.sensors(b);
        if (b.y > 1012 || b.x < -30 || b.x > 630 || b.y < -80) { (drained || (drained = [])).push(b); }
      }
      // ball vs ball
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i]; if (a.cap) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const c = balls[j]; if (c.cap) continue;
          const dx = c.x - a.x, dy = c.y - a.y, rr = a.r + c.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr || d2 < 1e-9) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = (rr - d) / 2;
          a.x -= nx * pen; a.y -= ny * pen; c.x += nx * pen; c.y += ny * pen;
          const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (vn < 0) {
            const j2 = -(1 + 0.92) * vn / 2;
            a.vx -= nx * j2; a.vy -= ny * j2; c.vx += nx * j2; c.vy += ny * j2;
            if (-vn > 150 && a.snd <= 0) { a.snd = 0.06; this.ev('hit', null, a, -vn); }
          }
        }
      }
      if (drained) {
        for (const b of drained) {
          const i = balls.indexOf(b);
          if (i >= 0) balls.splice(i, 1);
          this.ev('drain', null, b);
        }
      }
    }

    sensors(b) {
      const t = this.t;
      for (const rv of t.rollovers) {
        const d = Math.hypot(b.x - rv.x, b.y - rv.y);
        if (d < rv.r) {
          if (!rv.in.has(b.id)) { rv.in.add(b.id); this.ev('rollover', rv, b); }
        } else if (rv.in.size && d > rv.r + 6) rv.in.delete(b.id);
      }
      for (const sp of t.spinners) {
        const sNow = (b.x - sp.x1) * sp.nx + (b.y - sp.y1) * sp.ny;
        const sPrev = (b.px - sp.x1) * sp.nx + (b.py - sp.y1) * sp.ny;
        if (sNow > 0 !== sPrev > 0) {
          const along = (b.x - sp.x1) * sp.ux + (b.y - sp.y1) * sp.uy;
          if (along >= 0 && along <= sp.len) {
            const vperp = Math.abs(b.vx * sp.nx + b.vy * sp.ny);
            sp.omega = clamp(sp.omega + vperp * 0.05, 0, 42);
            b.vx *= 0.96; b.vy *= 0.96;
          }
        }
      }
      for (const s of t.saucers) {
        if (s.ball || s.cool > 0) continue;
        const d = Math.hypot(b.x - s.x, b.y - s.y);
        if (d < s.r) {
          s.ball = b; b.cap = s; b.vx = 0; b.vy = 0; b.x = s.x; b.y = s.y;
          s.timer = s.hold;
          this.ev('saucer', s, b);
          return;
        }
      }
      for (const rp of t.ramps) {
        if (rp.cool > 0) continue;
        const d = Math.hypot(b.x - rp.x, b.y - rp.y);
        if (d < rp.r && b.vx * rp.dx + b.vy * rp.dy > rp.minSpd) {
          b.cap = rp; b.rampT = 0; rp.flash = 0.6;
          this.ev('ramp', rp, b);
          return;
        }
      }
    }

    capStep(b, dt) {
      const c = b.cap;
      if (c.kind === 'ramp') {
        b.rampT += dt / c.dur;
        if (b.rampT >= 1) {
          const p = c.at(1);
          b.x = p.x; b.y = p.y; b.px = b.x; b.py = b.y;
          b.vx = c.exit.vx + (Math.random() - 0.5) * 60; b.vy = c.exit.vy;
          b.cap = null; c.cool = 0.4;
          this.ev('rampExit', c, b);
        } else {
          const p = c.at(b.rampT);
          b.x = p.x; b.y = p.y;
        }
      } else {
        if (c.tunnelTo) { const tot = c.maxTimer || c.hold || 0.8, p = clamp(1 - c.timer / tot, 0, 1); b.x = c.x + (c.tunnelTo.x - c.x) * p; b.y = c.y + (c.tunnelTo.y - c.y) * p; b.tunnelProg = p; } else { b.x = c.x; b.y = c.y; }
        c.timer -= dt;
        if (c.timer <= 0 && !c.locked) this.eject(c);
      }
    }
  }

  P.World = World; P.Ball = Ball; P.DT = DT;
})(typeof globalThis !== 'undefined' ? globalThis : window);
