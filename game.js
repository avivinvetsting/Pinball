/* Game rules, input, loop and UI glue. */
(function (G) {
  'use strict';
  const P = G.Pin;
  const A = P.Audio, R = P.Render;
  const $ = (id) => document.getElementById(id);
  const canvas = $('c'), ctx = canvas.getContext('2d');
  const PI = Math.PI;

  const game = {
    state: 'menu', tIndex: 0, table: null, world: null,
    score: 0, dispScore: 0, ballNo: 1, maxBalls: 3, mult: 1, bonus: 0, mbProgress: 0,
    multiball: false, jackpot: 0, jackpots: 0, saver: 0, tilted: false, extraBalls: 0, extraGiven: false,
    plungerPull: 0, particles: [], popups: [], msg: null, flash: 0, shake: { x: 0, y: 0, t: 0 },
    best: 0, ticker: '', timers: [], pendingSpawns: 0, nudgeE: 0, skill: 0, rampCombo: 0, rampTime: -99,
    bonusInfo: null, credits: 0, replayIdx: 0, specialLit: false, bellT: 0, reels: null, wordLit: 0, magnaE: 4, magnaOn: false, time: 0, stormT: 20, boostT: 0, bankDone: {},
  };
  P.game = game;
  game.speed = 1.2;
  const NOPAUSE = /debug/.test(location.hash);
  const input = { L: false, R: false, plunge: false, magna: false, touchMagna: false, touchL: 0, touchR: 0, touchPlunge: false };

  /* -------------------------------------------------- persistence */
  function saveCredits() { try { localStorage.setItem('pinball5.credits', String(game.credits)); } catch (e) { /* ignore */ } }
  try { game.credits = parseInt(localStorage.getItem('pinball5.credits') || '0', 10) || 0; } catch (e) { /* ignore */ }
  function loadHS(id) { try { return JSON.parse(localStorage.getItem('pinball5.hs.' + id) || '[]'); } catch (e) { return []; } }
  function saveHS(id, sc) {
    const a = loadHS(id); a.push(sc); a.sort((x, y) => y - x); a.length = Math.min(a.length, 5);
    try { localStorage.setItem('pinball5.hs.' + id, JSON.stringify(a)); } catch (e) { /* ignore */ }
    return a;
  }

  /* -------------------------------------------------- helpers */
  function say(text, sub, col, size, life, y) { game.msg = { text, sub, col: col || '#fff', size: size || 44, life: life || 1.8, max: life || 1.8, y }; }
  function popup(x, y, text, col, size) { game.popups.push({ x, y, text, col: col || '#fff', size: size || 16, life: 0.9 }); }
  function burst(x, y, col, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * PI * 2, v = (0.3 + Math.random()) * (sp || 220);
      game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1 + Math.random() * 2, life: 0.4 + Math.random() * 0.4, max: 0.8, col });
    }
  }
  let chimeT = [0, 0, 0, 0];
  function chime(p) {
    const lv = p < 500 ? 0 : p < 5000 ? 1 : p < 25000 ? 2 : 3;
    if (game.time - chimeT[lv] > 0.07) { chimeT[lv] = game.time; A.play('chime', lv); }
  }
  function replay(why) {
    game.credits++; saveCredits(); A.play('knocker'); game.flash = 0.25;
    say('REPLAY', why || 'FREE GAME', '#ffe14a', 50, 2);
  }
  function add(p, x, y, col) {
    const before = game.score;
    game.score += p;
    if (p >= 10) chime(p);
    if (Math.floor(game.score / 10000) > Math.floor(before / 10000)) { game.bellT = 0.6; A.play('bell'); }
    const rp = game.table.replays;
    if (rp && game.replayIdx < rp.length && game.score >= rp[game.replayIdx]) { game.replayIdx++; replay('SCORE ' + rp[game.replayIdx - 1].toLocaleString('en-US')); }
    if (x != null && p >= 100) popup(x, y - 18, p.toLocaleString('en-US'), col, p >= 5000 ? 22 : 15);
    if (!game.extraGiven && game.score >= 1000000) { game.extraGiven = true; game.extraBalls++; say('EXTRA BALL', 'SHOOT AGAIN', '#4dff88', 48); A.play('extra'); }
  }
  function later(t, fn) { game.timers.push({ t, fn }); }
  const lbl = (k) => game.table.labels[k] || '';

  /* -------------------------------------------------- game flow */
  function laneBall() {
    for (const b of game.world.balls) if (!b.cap && b.x > 548 && b.y > 925 && Math.abs(b.vy) < 80) return b;
    return null;
  }
  function movePlunger(y) {
    const s = game.table.plungerSeg;
    s.y1 = s.y2 = y; s.miny = s.maxy = y;
  }
  function serveBall() {
    movePlunger(965);
    const b = game.world.addBall(562.5, 954, 0, 0);
    b.lane = true;
    game.plungerPull = 0;
    if (!game.multiball) game.state = 'ready';
  }
  function resetBallState() {
    game.saverGiven = false; game.magnaE = 4; game.magnaOn = false; game.mult = 1; game.bonus = 0; game.tilted = false; game.nudgeE = 0; game.boostT = 0; game.saver = 0;
    for (const rv of game.table.rollovers) { rv.lit = false; rv.flash = 0; }
    for (const s of game.table.segs) { s.lit = false; if (s.kind === 'drop') s.up = true; }
    for (const c of game.table.bumpers) { c.boost = 1; c.lit = false; }
    game.specialLit = false;
    game.bankDone = {}; game.multiball = false; game.pendingSpawns = 0;
    for (const s of game.table.saucers) { s.ball = null; s.locked = false; }
  }
  function startGame(i) {
    A.init();
    game.tIndex = i;
    game.table = P.TABLES[i].build();
    game.world = new P.World(game.table, { event: onEvent });
    game.score = 0; game.dispScore = 0; game.ballNo = 1; game.mbProgress = 0; game.jackpot = 0; game.jackpots = 0;
    game.extraBalls = 0; game.extraGiven = false; game.particles = []; game.popups = []; game.timers = [];
    game.msg = null; game.bonusInfo = null; game.stormT = 15 + Math.random() * 15; game.skill = 0; game.wordLit = 0; game.rampCombo = 0;
    game.best = Math.max(0, ...loadHS(P.TABLES[i].id));
    game.maxBalls = game.table.balls || 3; game.replayIdx = 0; game.reels = null;
    if (!game.table.replays) game.table.replays = [400000, 800000, 1200000];
    resetBallState();
    serveBall();
    const th = R.theme(game.table);
    document.body.style.setProperty('--glow', th.glow);
    document.body.style.setProperty('--bg1', th.pg1);
    document.body.style.setProperty('--bg2', th.pg2);
    bgCache = null;
    hideOverlays();
    A.play('start');
    A.startMusic(game.table.music);
    say(game.table.name, 'GOOD LUCK!', game.table.theme.glow, 40, 2.2);
    updateSide();
  }
  function launch() {
    const lb = laneBall();
    movePlunger(965);
    if (!lb) { game.plungerPull = 0; return; }
    const p = game.plungerPull;
    lb.y = 954; lb.vy = -(800 + p * 1200); lb.lane = false;
    A.play('launch');
    game.plungerPull = 0;
    if (game.state === 'ready') { game.state = 'play'; if (!game.saverGiven) { game.saver = 12; game.saverGiven = true; } }
    if (p > 0.8 && p < 0.93) game.skill = 5;
  }
  function endBall() {
    if (game.extraBalls > 0) {
      game.extraBalls--; say('SHOOT AGAIN', '', '#4dff88', 44);
      resetBallState(); serveBall(); return;
    }
    game.state = 'bonus';
    const total = game.tilted ? 0 : game.bonus * game.mult;
    game.bonusInfo = { bonus: game.bonus, mult: game.mult, total, shown: 0, t: 0 };
  }
  function nextBall() {
    game.bonusInfo = null;
    if (game.ballNo >= game.maxBalls) return gameOver();
    game.ballNo++;
    resetBallState(); serveBall();
    say('BALL ' + game.ballNo, '', '#fff', 46, 1.4);
  }
  function gameOver() {
    game.state = 'over';
    A.stopMusic(); A.play('over');
    const hs = saveHS(game.table.id, game.score);
    const rank = hs.indexOf(game.score) + 1;
    $('overScore').textContent = game.score.toLocaleString('en-US');
    $('overTable').textContent = game.table.name;
    $('overRank').textContent = rank === 1 ? '🏆 שיא חדש בשולחן הזה!' : rank > 0 ? 'מקום ' + rank + ' בטבלת השיאים' : '';
    $('overList').innerHTML = hs.map((s, i) => '<li' + (s === game.score && i === rank - 1 ? ' class="me"' : '') + '>' + s.toLocaleString('en-US') + '</li>').join('');
    const mt = Math.floor(Math.random() * 10) * 10, mine = (Math.floor(game.score / 10) % 10) * 10;
    game.matchNo = mt;
    if (mt === mine) { game.credits++; saveCredits(); later(0.8, () => A.play('knocker')); }
    $('overMatch').textContent = 'MATCH ' + String(mt).padStart(2, '0') + (mt === mine ? '  ✔ משחק חינם!' : '');
    $('overCredits').textContent = 'CREDITS ' + game.credits;
    $('over').classList.add('show');
    updateSide();
  }
  function tilt() {
    game.tilted = true; A.play('tilt'); game.flash = 0.4; say('TILT', '', '#ff3b3b', 72, 2.5);
    for (const f of game.table.flippers) f.pressed = false;
  }
  function nudge(dx, dy) {
    if ((game.state !== 'play' && game.state !== 'ready') || game.tilted) return;
    game.nudgeE += 1;
    A.play('nudge');
    game.shake.x = -dx * 7; game.shake.y = -dy * 7; game.shake.t = 0.25;
    for (const b of game.world.balls) {
      if (b.cap || b.lane || b.x > 548) continue;
      b.vx += -dx * 140 + (dy ? (Math.random() - 0.5) * 120 : 0);
      b.vy += dy * -170 * (dy < 0 ? 1 : 0) + (dy < 0 ? 0 : 0);
    }
    if (game.nudgeE > 3.6) tilt();
  }
  function startMultiball(s) {
    game.multiball = true; game.mbProgress = 0; game.jackpot = 50000; game.saver = 20; game.pendingSpawns = 2;
    A.play('multi'); say('MULTIBALL!', 'SHOOT THE JACKPOT', '#ff5a5a', 52, 2.5); game.flash = 0.5;
    s.timer = 1.2;
    const spawn = () => {
      game.pendingSpawns--;
      if (!game.world.balls.length) return;
      if (s.ball) { later(0.35, spawn); game.pendingSpawns++; return; }
      const b = game.world.addBall(s.x, s.y, 0, 0); b.cap = s; s.ball = b; s.timer = 0.02;
    };
    later(1.5, spawn); later(2.3, spawn);
  }

  function milestone() {
    const w = game.table.word; if (!w) return;
    game.wordLit++;
    if (game.wordLit >= w.length) {
      game.wordLit = 0; add(50000, 282, 640); say(w, 'WORD BONUS 50,000', game.table.theme.lamp, 46, 2.2); A.play('jackpot'); game.flash = 0.3;
      if (game.mult < 5) game.mult++;
    } else A.play('rollover');
  }
  /* -------------------------------------------------- events from the physics */
  let lastSpin = 0;
  function onEvent(type, o, b, v) {
    const tb = game.table, th = tb.theme;
    switch (type) {
      case 'bumper': {
        const idx = tb.bumpers.indexOf(o);
        add(tb.numbers ? (o.lit ? 1000 : 100) : o.boost > 1 ? 1000 : 500, o.x, o.y, th.lamp);
        A.play(tb.numbers ? 'thump' : 'bumper', idx); burst(o.x, o.y, th.glow, 8, 260); game.bonus += 100;
        break;
      }
      case 'mover':
        add(2500, o.x, o.y, th.lamp); A.play('bumper', 5); burst(o.x, o.y, th.glow, 14, 320); game.bonus += 500; say(o.label || 'BASH TOY!', '+2,500', th.lamp, 36, 1.1);
        break;
      case 'sling':
        add(100, null); A.play('sling'); burst(b.x, b.y, th.glow2, 6, 200);
        break;
      case 'stand': {
        o.lit = true; add(1000, (o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2, th.lamp); A.play('stand'); game.bonus += 300;
        const grp = tb.segs.filter((s) => s.kind === 'stand' && s.group === o.group);
        if (grp.every((s) => s.lit)) {
          add(10000, 282, 450); say(lbl('stand'), '10,000  +5s BALL SAVE', th.lamp, 38); A.play('dropBank');
          game.saver += 5; game.bonus += 3000; milestone();
          later(1.0, () => grp.forEach((s) => { s.lit = false; }));
        }
        break;
      }
      case 'drop': {
        add(1000, (o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2, th.lamp); A.play('drop'); game.bonus += 500;
        burst((o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2, th.glow2, 8, 200);
        const grp = tb.segs.filter((s) => s.kind === 'drop' && s.group === o.group);
        if (grp.every((s) => !s.up)) {
          game.bankDone[o.group] = true;
          add(25000, 282, 450); A.play('dropBank'); game.bonus += 5000; milestone();
          game.boostT = 20; for (const c of tb.bumpers) c.boost = 1.25;
          for (const c of tb.bumpers) c.boostScore = true;
          say(lbl('drop'), 'BUMPERS BOOSTED!', th.glow2, 40);
          const groups = tb.segs.filter((s) => s.kind === 'drop').map((s) => s.group).filter((g, i, a) => a.indexOf(g) === i);
          later(1.2, () => { game.world.resetDrops(o.group); });
          if (groups.length > 1 && groups.every((g) => game.bankDone[g])) {
            add(100000, 282, 380); say('DOUBLE BANK', '100,000', '#fff', 44); game.bankDone = {};
          } else if (groups.length === 1) game.bankDone = {};
        }
        break;
      }
      case 'spin':
        add(250, null); if (game.time - lastSpin > 0.05) { A.play('spin'); lastSpin = game.time; } game.bonus += 20;
        break;
      case 'rollover': {
        if (o.group === 'top' && tb.numbers) {
          if (!o.lit) {
            o.lit = true; o.flash = 0.5; add(1000, o.x, o.y + 22, th.lamp); game.bonus += 1000;
            // numbers 1 & 3 light the top bumpers, 2 & 4 the bottom ones (like Central Park)
            const pair = o.idx % 2 === 0 ? [0, 1] : [2, 3];
            for (const k of pair) if (tb.bumpers[k]) tb.bumpers[k].lit = true;
            say('NUMBER ' + (o.idx + 1), (o.idx % 2 === 0 ? 'TOP' : 'BOTTOM') + ' BUMPERS LIT', th.lamp, 34, 1.2, 300);
            if (game.skill > 0) { game.skill = 0; add(5000, 282, 300); say('SKILL SHOT', '5,000', '#4dff88', 46); }
            const all = tb.rollovers.filter((r) => r.group === 'top');
            if (all.every((r) => r.lit) && !game.specialLit) {
              game.specialLit = true; if (game.mult < 5) game.mult++;
              say('SPECIAL IS LIT', 'SHOOT ANY HOLE', '#ff3b3b', 40, 2.2); A.play('mult'); milestone();
            }
          } else add(100, null);
        } else if (o.group === 'top') {
          if (!o.lit) {
            o.lit = true; o.flash = 0.4; add(500, o.x, o.y + 22, th.lamp); A.play('rollover'); game.bonus += 200;
            if (game.skill > 0) { game.skill = 0; add(25000, 282, 300); say('SKILL SHOT', '25,000', '#4dff88', 46); A.play('jackpot'); }
            const all = tb.rollovers.filter((r) => r.group === 'top');
            if (all.every((r) => r.lit)) {
              if (game.mult < 5) { game.mult++; add(10000, 282, 200); say('BONUS X' + game.mult, '', th.lamp, 46); }
              else { add(50000, 282, 200); say('MAX MULTIPLIER', '50,000', th.lamp, 40); }
              A.play('mult');
              later(0.5, () => all.forEach((r) => { r.lit = false; }));
            }
          } else { A.play('rollover'); add(100, null); }
        } else if (o.group === 'mid') {
          add(750, o.x, o.y - 14, th.lamp); o.flash = 0.5; A.play('rollover'); game.bonus += 200;
        } else if (o.group === 'in') {
          add(500, o.x, o.y - 14, th.lamp); game.bonus += 500; o.flash = 0.5; A.play('rollover');
        } else {
          add(2000, o.x, o.y - 14, '#ff8a8a'); o.flash = 0.5; A.play('rollover');
        }
        break;
      }
      case 'saucer': {
        if (o.tunnelTo) { const tn = o.tunnelTo; add(15000, o.x, o.y - 22, tn.col || th.lamp); A.play('wormhole'); burst(o.x, o.y, tn.col || th.glow, 18, 280); later((o.hold || 0.78) * 0.9, () => burst(tn.x, tn.y, tn.col || th.glow, 22, 340)); say(tn.label || 'SECRET TUNNEL!', 'SUBWAY TELEPORT +15,000', tn.col || th.glow, 40, 1.8); game.bonus += 2500; o.maxTimer = o.timer = o.hold || 0.78; if (!tb.numbers) { game.mbProgress++; milestone(); if (game.mbProgress >= 3) startMultiball(o); } break; }
        if (o.kicker && tb.numbers) {
          const lit = tb.rollovers.filter((r) => r.group === 'top' && r.lit).length;
          add(1000 * (1 + lit), o.x, o.y - 20, th.lamp); A.play('saucer'); game.bonus += 500; o.timer = 0.55;
          if (game.specialLit) {
            game.specialLit = false; replay('SPECIAL');
            for (const r of tb.rollovers) if (r.group === 'top') r.lit = false;
            for (const c of tb.bumpers) c.lit = false;
          }
          break;
        }
        if (o.kicker) { add(o.pts || 2500, o.x, o.y - 20, th.lamp); A.play('eject'); burst(o.x, o.y, th.glow2, 10, 240); game.bonus += 300; o.timer = 0.3; break; }
        if (o.well) {
          const aw = [5000, 10000, 25000, 50000][Math.floor(Math.random() * 4)];
          A.play('wormhole'); add(aw, o.x, o.y - 24, th.lamp); say('BLACK HOLE', aw.toLocaleString('en-US'), th.glow2, 42);
        } else A.play('saucer');
        burst(o.x, o.y, th.glow, 16, 260);
        if (game.multiball) {
          const jp = game.jackpot; add(jp, 282, 420); say('JACKPOT!', jp.toLocaleString('en-US'), '#ffe14a', 56, 2.2);
          game.jackpot += 25000; game.jackpots++; A.play('jackpot'); game.flash = 0.35; o.timer = 1.0;
        } else {
          game.mbProgress++; game.bonus += 2000; milestone();
          if (game.mbProgress >= 3) startMultiball(o);
          else {
            const pts = 5000 * game.mbProgress;
            if (!o.well) { add(pts, o.x, o.y - 24, th.lamp); say(lbl('saucer'), (3 - game.mbProgress) + ' MORE FOR MULTIBALL', th.lamp, 38); }
            o.timer = o.well ? 0.8 : 1.0;
          }
        }
        break;
      }
      case 'ramp': A.play('ramp'); say('LEVEL 02', o.label || lbl('ramp'), th.lamp, 38, 1.2); break;
      case 'boost': add(250, null); A.play('boost'); break;
      case 'magnet': A.play('magnet'); say('MAGNET!', 'GRAB THE BALL', th.glow2, 36, 1.4, 300); add(1000, null); break;
      case 'rampExit': {
        if (game.time - game.rampTime < 8) game.rampCombo = Math.min(5, game.rampCombo + 1); else game.rampCombo = 1;
        game.rampTime = game.time;
        const pts = game.multiball ? 25000 : 5000 * game.rampCombo;
        add(pts, o.pts[o.pts.length - 1].x, o.pts[o.pts.length - 1].y, th.lamp); game.bonus += 1500;
        say(o.label || lbl('ramp'), pts.toLocaleString('en-US') + (game.rampCombo > 1 ? '  COMBO X' + game.rampCombo : ''), th.glow, 36, 1.4, 300);
        A.play('mult'); milestone();
        break;
      }
      case 'eject': A.play('eject'); break;
      case 'rubber': add(10, null); break;
      case 'passive': add(10, null); A.play('hit', v); break;
      case 'hit': A.play('hit', v); break;
      case 'drain': onDrain(b); break;
    }
  }
  function onDrain() {
    const w = game.world;
    if (game.state !== 'play' && game.state !== 'ready') return;
    if (w.balls.length === 0 && game.pendingSpawns <= 0) {
      if (game.saver > 0 && !game.tilted) {
        say('BALL SAVED', '', '#4dff88', 46); A.play('saved'); game.saver = 0; game.saverGiven = true; serveBall(); return;
      }
      A.play('drain'); endBall();
    } else if (game.multiball) {
      if (game.saver > 0) { say('BALL SAVED', '', '#4dff88', 36); A.play('saved'); serveBall(); return; }
      if (w.balls.length === 1 && game.pendingSpawns <= 0) {
        game.multiball = false; say('MULTIBALL OVER', '', '#fff', 36); game.jackpot = 0;
      }
    }
  }

  /* -------------------------------------------------- per-frame update */
  function update(dt) {
    game.time += dt;
    game.dispScore += Math.max((game.score - game.dispScore) * Math.min(1, dt * 8), game.score > game.dispScore ? 1 : 0);
    if (game.dispScore > game.score) game.dispScore = game.score;
    if (game.msg) game.msg.life -= dt;
    if (game.flash > 0) game.flash = Math.max(0, game.flash - dt * 1.6);
    if (game.shake.t > 0) game.shake.t -= dt;
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
      if (p.life <= 0) game.particles.splice(i, 1);
    }
    for (let i = game.popups.length - 1; i >= 0; i--) { const p = game.popups[i]; p.life -= dt; p.y -= 30 * dt; if (p.life <= 0) game.popups.splice(i, 1); }
    for (let i = game.timers.length - 1; i >= 0; i--) { const t = game.timers[i]; t.t -= dt; if (t.t <= 0) { game.timers.splice(i, 1); t.fn(); } }
    if (game.state === 'bonus') {
      const bi = game.bonusInfo; bi.t += dt;
      if (bi.t > 0.6 && bi.shown < bi.total) {
        const step = Math.max(500, Math.ceil(bi.total / 70 / 100) * 100);
        bi.shown = Math.min(bi.total, bi.shown + step); A.play('bonus');
        if (bi.shown >= bi.total) { game.score += bi.total; bi.paid = true; bi.t = 0.6 + 0.0; bi.doneT = game.time; }
      }
      if ((bi.total === 0 && bi.t > 2) || (bi.paid && game.time - bi.doneT > 1.6)) nextBall();
      return;
    }
    if (game.state !== 'play' && game.state !== 'ready') { A.roll(0); return; }
    const tb = game.table, w = game.world;
    // flippers
    for (const f of tb.flippers) {
      const want = !game.tilted && (f.key === 'L' ? input.L || input.touchL > 0 : input.R || input.touchR > 0);
      if (want && !f.pressed) A.play('flip');
      else if (!want && f.pressed) A.play('flipDown');
      f.pressed = want;
    }
    // plunger
    const lb = laneBall();
    const want = input.plunge || input.touchPlunge;
    if (want && lb) {
      game.plungerPull = Math.min(1, game.plungerPull + dt * 1.0);
      const y = 965 + game.plungerPull * 34; movePlunger(y);
      lb.y = y - 10; lb.vy = 0; lb.vx = 0;
      if (Math.random() < 0.3) A.play('plunger', game.plungerPull);
    } else if (game.plungerPull > 0) launch();
    // timers
    if (game.state === 'play' && game.saver > 0) game.saver -= dt;
    if (game.skill > 0) game.skill -= dt;
    if (game.nudgeE > 0) game.nudgeE = Math.max(0, game.nudgeE - dt * 0.4);
    if (game.boostT > 0) { game.boostT -= dt; if (game.boostT <= 0) for (const c of tb.bumpers) c.boost = 1; }
    for (const rv of tb.rollovers) if (rv.flash > 0) rv.flash -= dt;
    // lightning storm on haunted table
    if (tb.storm && game.state === 'play') {
      game.stormT -= dt;
      if (game.stormT <= 0) {
        game.stormT = 22 + Math.random() * 20; game.flash = 1; A.play('thunder');
        game.boostT = 10; for (const c of tb.bumpers) c.boost = 1.5; say('LIGHTNING STORM', 'BUMPERS CHARGED', '#b04bff', 38);
      }
    }
    // visual & safety per ball
    for (const b of w.balls) {
      if (b.cap) continue;
      b.rollAng += (b.vx * dt) / b.r;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 250) { b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 9) b.trail.shift(); } else if (b.trail.length) b.trail.shift();
      // Stuck guard: measured by displacement, not speed, so a ball jittering in a wedge
      // (e.g. behind an upper flipper pivot) is also freed. A ball cradled on a held flipper is left alone.
      const cradled = tb.flippers.some((f) => f.pressed && Math.hypot(b.x - f.x, b.y - f.y) < f.len + 22);
      if (!b.lane && b.x < 548 && b.y < 840 && !cradled) {
        if (b.sx == null || Math.hypot(b.x - b.sx, b.y - b.sy) > 6) { b.sx = b.x; b.sy = b.y; b.still = 0; }
        b.still += dt;
        if (b.still > 2) { b.vx += (b.x < 282 ? 1 : -1) * (180 + Math.random() * 200); b.vy -= 450; b.still = 0; b.sx = null; }
      } else { b.still = 0; b.sx = null; }
    }
    // magna-save
    const mw = (input.magna || input.touchMagna) && !game.tilted && game.state === 'play' && game.magnaE > 0;
    if (mw) game.magnaE -= dt;
    game.magnaOn = mw; w.magna = mw;
    // rolling ball rumble + backbox bell
    let roll = 0;
    for (const b of w.balls) if (!b.cap && !b.lane) roll = Math.max(roll, Math.min(1, Math.hypot(b.vx, b.vy) / 1600));
    A.roll(game.state === 'play' ? roll : 0);
    if (game.bellT > 0) game.bellT -= dt;
    // physics
    acc += Math.min(dt, 0.1) * game.speed;
    let n = 0;
    while (acc >= P.DT && n < 72) { w.step(); acc -= P.DT; n++; }
    if (acc > P.DT * 72) acc = 0;
  }
  let acc = 0;

  /* -------------------------------------------------- rendering */
  let bgCache = null, bgScale = 0, vw = 0, vh = 0, dpr = 1, S = 1, OX = 0, OY = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    vw = canvas.clientWidth; vh = canvas.clientHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    S = Math.min(vw / 604, vh / 1104);
    OX = (vw - 600 * S) / 2; OY = (vh - 1100 * S) / 2 + 100 * S;
    bgCache = null;
    const bar = $('ibar');
    bar.style.left = 'auto'; bar.style.right = Math.max(2, vw - (OX + 598 * S)) + 'px'; bar.style.top = (OY - 92 * S) + 'px';
    bar.style.setProperty('--ib', Math.max(26, 36 * S) + 'px');
  }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.direction = 'ltr';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!game.table || game.state === 'menu') return;
    if (P.View3D && P.View3D.draw(game)) return;
    document.body.classList.add('fallback2d');
    $('cameraBtn').disabled = true;
    document.getElementById('renderStatus').textContent = 'תצוגה קלאסית · 2D';
    if (!bgCache) { bgScale = S * dpr; bgCache = R.makeBG(game.table, bgScale); }
    ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * OX, dpr * OY);
    let sx = 0, sy = 0;
    if (game.shake.t > 0) { const k = game.shake.t / 0.25; sx = game.shake.x * k * Math.sin(game.time * 60); sy = game.shake.y * k * Math.cos(game.time * 55); }
    R.drawHeader(ctx, game, game.time);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.drawImage(bgCache, 0, 0, 600, 1000);
    R.drawPlayfield(ctx, game, game.time);
    R.drawCallouts(ctx, game, game.time);
    ctx.restore();
    if (game.state === 'bonus' && game.bonusInfo) drawBonus();
  }
  function drawBonus() {
    const bi = game.bonusInfo, th = game.table.theme;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(60, 330, 480, 260);
    ctx.strokeStyle = th.glow; ctx.lineWidth = 3; ctx.strokeRect(60, 330, 480, 260);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.font = '900 34px Verdana'; ctx.fillText('END OF BALL ' + game.ballNo, 300, 375);
    ctx.font = '700 22px Verdana'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    if (game.tilted) { ctx.fillStyle = '#ff5a5a'; ctx.fillText('TILT - NO BONUS', 300, 470); }
    else {
      ctx.fillText('BONUS  ' + bi.bonus.toLocaleString('en-US') + '  x ' + bi.mult, 300, 440);
      ctx.font = '900 54px "Courier New", monospace'; ctx.fillStyle = '#ffb347'; ctx.shadowColor = '#ff8a1f'; ctx.shadowBlur = 14;
      ctx.fillText(bi.shown.toLocaleString('en-US'), 300, 515);
    }
    ctx.restore();
  }

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0.016); last = ts;
    if (game.table && game.state !== 'menu' && game.state !== 'paused' && game.state !== 'over') update(dt);
    else if (game.state === 'over') game.time += dt;
    render();
    requestAnimationFrame(frame);
  }

  /* -------------------------------------------------- overlays / menu */
  function hideOverlays() { for (const id of ['menu', 'pause', 'over']) $(id).classList.remove('show'); }
  function showMenu() {
    A.stopMusic();
    game.state = 'menu';
    if (P.View3D) P.View3D.hide();
    hideOverlays(); buildMenu(); $('menu').classList.add('show');
    document.body.style.setProperty('--glow', '#ffcf5a'); document.body.style.setProperty('--bg1', '#161d3f'); document.body.style.setProperty('--bg2', '#070914');
    updateSide();
  }
  function pause() {
    if (game.state !== 'play' && game.state !== 'ready') return;
    input.L = input.R = input.plunge = input.touchPlunge = false;
    input.touchL = input.touchR = 0;
    A.roll(0);
    game.prevState = game.state; game.state = 'paused'; $('pause').classList.add('show');
    for (const f of game.table.flippers) f.pressed = false;
    A.stopMusic();
  }
  function resume() {
    if (game.state !== 'paused') return;
    game.state = game.prevState; $('pause').classList.remove('show'); A.startMusic(game.table.music); last = performance.now();
  }
  let thumbs = null;
  function makeThumbs() {
    thumbs = P.TABLES.map((T) => {
      const tb = T.build();
      const threeThumb = P.View3D && P.View3D.thumbnail(tb);
      if (threeThumb) return threeThumb;
      const c = document.createElement('canvas'); const sc = 0.32 * 2;
      c.width = 600 * sc * 0.5 * 2 / 2; c.height = 1000 * sc * 0.5 * 2 / 2;
      c.width = Math.round(600 * sc); c.height = Math.round(1000 * sc);
      const x = c.getContext('2d');
      x.drawImage(R.makeBG(tb, sc), 0, 0);
      x.scale(sc, sc);
      R.drawPlayfield(x, { table: tb, world: { balls: [] }, mult: 3, mbProgress: 1, multiball: false, saver: 5, plungerPull: 0, particles: [], popups: [] }, 1.2);
      return c;
    });
  }
  let menuSel = 0;
  function buildMenu() {
    if (!thumbs) makeThumbs();
    const el = $('cards'); el.innerHTML = '';
    P.TABLES.forEach((T, i) => {
      const d = document.createElement('button'); d.className = 'card' + (i === menuSel ? ' sel' : ''); d.dataset.i = i;
      d.style.setProperty('--card-accent', ['#f4be52', '#2de2d5', '#00f2ff', '#b482ff', '#ff6a1a', '#e8b84a', '#38d6ff', '#ff2bd6'][i]);
      const hs = loadHS(T.id)[0] || 0;
      d.innerHTML = '<span class="cardNumber">0' + (i + 1) + '<span>' + (T.styleTag || '3D EDITION') + '</span></span><div class="th"></div><b>' + T.name + '</b><span class="he">' + T.he + '</span><span class="stars" aria-label="רמת קושי ' + T.diff + ' מתוך 5">' + '●'.repeat(T.diff) + '<i>' + '●'.repeat(5 - T.diff) + '</i></span><small>' + T.desc + '</small><em>שיא: ' + hs.toLocaleString('en-US') + '</em><span class="playLabel">התחילו לשחק <span>↗</span></span>';
      d.querySelector('.th').appendChild(thumbs[i]);
      d.onclick = () => { menuSel = i; A.init(); A.play('menu'); startGame(i); };
      d.onmouseenter = () => { menuSel = i; markSel(); };
      el.appendChild(d);
    });
  }
  function markSel() { document.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === menuSel)); }
  function updateSide() {
    const r = $('hsList'); if (!r) return;
    const T = game.table && game.state !== 'menu' ? P.TABLES[game.tIndex] : P.TABLES[menuSel];
    $('hsTitle').textContent = T.name;
    const mission=document.querySelector('.upperTip');if(mission&&game.table)mission.textContent=game.table.mission || '';const lm=$('liveMission');if(lm&&game.table)lm.textContent=game.table.mission || '';
    r.innerHTML = (loadHS(T.id).map((s) => '<li>' + s.toLocaleString('en-US') + '</li>').join('')) || '<li class="none">אין שיאים עדיין</li>';
  }

  /* -------------------------------------------------- input */
  const KL = ['ArrowLeft', 'KeyZ', 'KeyA', 'ShiftLeft'], KR = ['ArrowRight', 'Slash', 'KeyL', 'KeyD', 'ShiftRight', 'Period'], KP = ['ArrowDown', 'Space'];
  window.addEventListener('keydown', (e) => {
    A.init();
    const c = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'Slash'].includes(c)) e.preventDefault();
    if (game.state === 'menu') {
      if (c === 'ArrowLeft' || c === 'ArrowUp') { menuSel = (menuSel + P.TABLES.length - 1) % P.TABLES.length; markSel(); A.play('menu'); updateSide(); }
      else if (c === 'ArrowRight' || c === 'ArrowDown') { menuSel = (menuSel + 1) % P.TABLES.length; markSel(); A.play('menu'); updateSide(); }
      else if (c === 'Enter' || c === 'Space') startGame(menuSel);
      return;
    }
    if (game.state === 'over') { if (c === 'Enter' || c === 'Space') startGame(game.tIndex); else if (c === 'Escape') showMenu(); return; }
    if (e.repeat) return;
    if (c === 'KeyP' || c === 'Escape') { game.state === 'paused' ? resume() : pause(); return; }
    if (c === 'KeyM') { A.setMusic(!A.musicOn); syncBtns(); return; }
    if (c === 'KeyN') { A.sfxOn = !A.sfxOn; syncBtns(); return; }
    if (game.state === 'paused') { if (c === 'Enter') resume(); return; }
    if (KL.includes(c)) input.L = true;
    if (KR.includes(c)) input.R = true;
    if (KP.includes(c) || c === 'Enter') input.plunge = true;
    if (c === 'KeyQ') nudge(-1, 0);
    if (c === 'KeyE') nudge(1, 0);
    if (c === 'ArrowUp' || c === 'KeyW') nudge(0, -1);
  });
  window.addEventListener('keyup', (e) => {
    const c = e.code;
    if (KL.includes(c)) input.L = false;
    if (KR.includes(c)) input.R = false;
    if (KP.includes(c) || c === 'Enter') input.plunge = false;
  });
  window.addEventListener('blur', () => { input.L = input.R = input.plunge = false; input.touchL = input.touchR = 0; input.touchPlunge = false; if (!NOPAUSE && (game.state === 'play' || game.state === 'ready')) pause(); });

  // pointer (touch / mouse) – left half = left flipper, right half = right flipper
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') setTouchUI(); }, true);
  const ptrs = new Map();
  function setTouchUI() { document.body.classList.add('touch'); }
  canvas.addEventListener('pointerdown', (e) => {
    A.init();
    if (e.pointerType === 'touch' || e.pointerType === 'pen') setTouchUI();
    if (game.state !== 'play' && game.state !== 'ready') return;
    const side = e.clientX < window.innerWidth / 2 ? 'L' : 'R';
    ptrs.set(e.pointerId, side);
    if (side === 'L') input.touchL++; else input.touchR++;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  const pend = (e) => {
    const s = ptrs.get(e.pointerId); if (!s) return;
    ptrs.delete(e.pointerId);
    if (s === 'L') input.touchL = Math.max(0, input.touchL - 1); else input.touchR = Math.max(0, input.touchR - 1);
  };
  canvas.addEventListener('pointerup', pend); canvas.addEventListener('pointercancel', pend);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const lbtn = $('launchBtn');
  lbtn.addEventListener('pointerdown', (e) => { A.init(); input.touchPlunge = true; try { lbtn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } e.preventDefault(); });
  const lrel = () => { input.touchPlunge = false; };
  lbtn.addEventListener('pointerup', lrel); lbtn.addEventListener('pointercancel', lrel);
  const nb = (id, dx, dy) => $(id).addEventListener('pointerdown', (e) => { A.init(); nudge(dx, dy); e.preventDefault(); });
  nb('nL', -1, 0); nb('nR', 1, 0); nb('nU', 0, -1);
  // long-press on a touch button must not open the browser's context menu / selection popup
  for (const id of ['launchBtn', 'nL', 'nR', 'nU']) $(id).addEventListener('contextmenu', (e) => e.preventDefault());

  $('pauseBtn').onclick = () => (game.state === 'paused' ? resume() : pause());
  $('homeBtn').onclick = (e) => { e.preventDefault(); pause(); };
  $('cameraBtn').onclick = () => { if (P.View3D) P.View3D.cycleCamera(); };
  $('speedBtn').onclick = () => { game.speed = game.speed === 1 ? 1.2 : game.speed === 1.2 ? 1.4 : 1; $('speedBtn').textContent = ({1:'רגיל',1.2:'מהיר',1.4:'טורבו'})[game.speed] + ' ×' + game.speed; };
  $('musicBtn').onclick = () => { A.init(); A.setMusic(!A.musicOn); syncBtns(); };
  $('sfxBtn').onclick = () => { A.init(); A.sfxOn = !A.sfxOn; syncBtns(); };
  $('resumeBtn').onclick = resume;
  $('quitBtn').onclick = showMenu;
  $('againBtn').onclick = () => startGame(game.tIndex);
  $('menuBtn').onclick = showMenu;
  function syncBtns() {
    $('musicBtn').classList.toggle('off', !A.musicOn); $('sfxBtn').classList.toggle('off', !A.sfxOn);
  }
  window.addEventListener('devicemotion', (e) => {
    const a = e.accelerationIncludingGravity; if (!a || !document.body.classList.contains('touch')) return;
    const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    if (m > 26 && game.time - (game.lastShake || 0) > 0.6) { game.lastShake = game.time; nudge(0, -1); }
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!NOPAUSE && document.hidden && (game.state === 'play' || game.state === 'ready')) pause(); });

  // keep launch button visible only when needed
  setInterval(() => {
    const need = game.state !== 'menu' && game.state !== 'over' && game.world && laneBall();
    lbtn.classList.toggle('show', !!need);
  }, 120);

  if (window.matchMedia && matchMedia('(pointer:coarse)').matches) setTouchUI();
  resize();
  if(P.artReady) P.artReady.then(showMenu); else showMenu();
  requestAnimationFrame(frame);

  // expose small test hook
  P.test = { startGame, input, game, nudge, launch, tick(dt) { update(dt); render(); }, sim(dt) { update(dt); } };
})(window);
