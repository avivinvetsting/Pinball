// Run this function through Playwright's browser_run_code_unsafe, with the game already open.
async (page) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  for (const key of ['ArrowLeft','ArrowRight','Space']) await page.keyboard.up(key);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('file:///D:/Apps/Pinball/index.html#debug');
  await page.reload();
  check(await page.locator('.card').count() === 5, 'Five menu cards');
  await page.locator('.card').first().click();
  const key=async(code,down)=>page.evaluate(({code,down})=>{window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));Pin.test.sim(.02);},{code,down});
  await key('ArrowLeft',true);
  check(await page.evaluate(() => Pin.game.table.flippers[0].pressed), 'Left keyboard flipper');
  await key('ArrowLeft',false);
  await key('ArrowRight',true);
  check(await page.evaluate(() => Pin.game.table.flippers[1].pressed), 'Right keyboard flipper');
  await key('ArrowRight',false);
  await key('Space',true);
  await page.evaluate(()=>{for(let i=0;i<110;i++)Pin.test.sim(1/120);});
  check(await page.evaluate(() => Pin.game.plungerPull > .1), 'Keyboard plunger charged');
  await key('Space',false);
  check(await page.evaluate(() => Pin.game.state === 'play'), 'Keyboard launched ball');
  await page.locator('#pauseBtn').click();
  check(await page.evaluate(() => Pin.game.state === 'paused'), 'Pause');
  const frozen = await page.evaluate(() => Pin.game.time);
  await page.waitForTimeout(120);
  check(await page.evaluate(() => Pin.game.time) === frozen, 'Paused physics frozen');
  await page.locator('#resumeBtn').click();
  check(await page.evaluate(() => Pin.game.state === 'play'), 'Resume');
  const cameras = [];
  for (let i = 0; i < 3; i++) {
    await page.locator('#cameraBtn').click();
    await page.evaluate(()=>Pin.test.tick(0));
    cameras.push(await page.evaluate(() => Pin.View3D.diagnostics().view));
  }
  check(cameras.join(',') === '1,2,0', 'Three camera modes');
  const speedModes=[];
  for(let i=0;i<3;i++){await page.locator('#speedBtn').click();speedModes.push(await page.evaluate(()=>Pin.game.speed));}
  check(speedModes.join(',')==='1.4,1,1.2','Speed selector');
  const ramp = await page.evaluate(() => {
    Pin.test.startGame(1); const g=Pin.game,r=g.table.ramps[0];
    g.world.balls=[];g.state='play';const b=g.world.addBall(r.x-r.dx*48,r.y-r.dy*48,r.dx*950,r.dy*950);
    for(let i=0;i<30&&!b.cap;i++)Pin.test.sim(1/120);
    if(b.cap!==r)throw Error('Ramp entry');
    for(let i=0;i<100;i++)Pin.test.sim(1/120);
    Pin.test.tick(0);const height=Pin.View3D.diagnostics().ballHeights[0];
    if(height<100)throw Error('3D ball not elevated');
    for(let i=0;i<200&&b.cap;i++)Pin.test.sim(1/120);
    if(b.cap||g.score<5000)throw Error('Ramp return or score');
    return {height,score:g.score,returned:true};
  });
  const tables = await page.evaluate(() => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      Pin.test.startGame(i);
      const g = Pin.game;
      g.plungerPull = .88; Pin.test.launch();
      let entered = false;
      for (let k = 0; k < 4800; k++) {
        if (g.state === 'over') break;
        if (g.state === 'ready') { g.plungerPull = .88; Pin.test.launch(); }
        Pin.test.input.L = Math.floor(k / 25) % 2 === 0;
        Pin.test.input.R = Math.floor(k / 31) % 2 === 0;
        Pin.test.sim(1 / 120);
        if (g.world.balls.some(b => b.x < 530 && b.y < 800)) entered = true;
        if (g.world.balls.some(b => !Number.isFinite(b.x + b.y + b.vx + b.vy))) throw Error('Nonfinite physics ' + i);
      }
      Pin.test.input.L = Pin.test.input.R = false;
      Pin.test.tick(0);
      const render = Pin.View3D.diagnostics();
      results.push({ table: g.table.name, entered, score: g.score, state: g.state, render });
      if (!entered || g.score <= 0 || !render.available || !render.calls) throw Error('Table failed ' + i);
    }
    return results;
  });
  const gameOver = await page.evaluate(() => {
    Pin.test.startGame(0); const g = Pin.game;
    for (let n = 0; n < 5; n++) {
      g.plungerPull = .9; Pin.test.launch(); g.saver = 0;
      for (const b of g.world.balls) { b.y = 1200; b.vy = 200; }
      for (let k = 0; k < 1200 && g.state !== 'ready' && g.state !== 'over'; k++) Pin.test.sim(1 / 120);
    }
    Pin.test.tick(0); return {state:g.state, overlay:document.getElementById('over').classList.contains('show')};
  });
  check(gameOver.state === 'over' && gameOver.overlay, 'End of game overlay');
  await page.locator('#againBtn').click();
  check(await page.evaluate(() => Pin.game.ballNo === 1 && Pin.game.score === 0), 'Restart');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown', {pointerType:'touch',pointerId:81,clientX:50,clientY:500,bubbles:true}));
    Pin.test.tick(.03);
    if (!Pin.game.table.flippers[0].pressed) throw Error('Touch flipper');
    document.getElementById('c').dispatchEvent(new PointerEvent('pointerup', {pointerType:'touch',pointerId:81,bubbles:true}));
    document.getElementById('launchBtn').dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',pointerId:82,bubbles:true}));
    Pin.test.sim(.3);
    if (Pin.game.plungerPull <= 0) throw Error('Touch charge');
    document.getElementById('launchBtn').dispatchEvent(new PointerEvent('pointerup',{pointerType:'touch',pointerId:82,bubbles:true}));
    Pin.test.tick(.03);
    if (Pin.game.state !== 'play') throw Error('Touch launch');
  });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No mobile horizontal overflow');
  await page.screenshot({path:'D:/Apps/Pinball/preview-mobile.png'});
  await page.locator('#pauseBtn').click(); await page.locator('#quitBtn').click();
  check(await page.locator('#menu').isVisible(), 'Return to menu');
  await page.locator('.card').last().scrollIntoViewIfNeeded();
  await page.locator('.card').last().click();
  check(await page.evaluate(() => Pin.game.tIndex === 4), 'Last mobile card reachable');
  check(errors.length === 0, 'No page errors: ' + errors.join('; '));
  return { passed: true, tables, cameras, speedModes, ramp, gameOver, syntheticKeyboard: true, syntheticTouch: true, mobileWidth:390, errors };
}
