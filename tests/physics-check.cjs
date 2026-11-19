const assert = require('node:assert/strict');
require('../engine.js'); require('../tables.js'); require('../tables/quest.js'); require('../tables/spy.js'); require('../tables/frenzy.js'); require('../designs.js');
const P = globalThis.Pin;
const results = [];
const signatures=new Set();
for (const def of P.TABLES) {
  const layout=def.build();
  signatures.add(JSON.stringify({b:layout.bumpers.map(b=>[b.x,b.y,b.r]),f:layout.flippers.map(f=>[f.x,f.y,f.len]),r:layout.ramps.map(r=>r.pts)}));
  if(def.id==='neon'){assert.equal(layout.ramps.length,0);assert.equal(layout.bumpers.length,3);results.push({table:def.id,classicOpenField:true});continue;}
  if(def.id==='space'){assert.equal(layout.ramps.length,2);assert.equal(layout.flippers.length,4);assert.notEqual(layout.ramps[0].maxHeight,layout.ramps[1].maxHeight);}
  for(let index=0;index<layout.ramps.length;index++){
  const tb = def.build(), events = [], w = new P.World(tb, {event:(type)=>events.push(type)}), rp = tb.ramps[index];
  assert(rp && rp.upper, def.id + ': upper level exists');
  assert.equal(rp.height(0), 0); assert.equal(rp.height(1), 0);
  assert.equal(rp.height(.5), rp.maxHeight);
  for(let i=0;i<=100;i++) {const p=rp.at(i/100);assert(Number.isFinite(p.x+p.y+p.h));assert(p.x>20&&p.x<545&&p.y>20&&p.y<900);}
  const b = w.addBall(rp.x-rp.dx*48,rp.y-rp.dy*48,rp.dx*950,rp.dy*950);
  for(let i=0;i<100&&!b.cap;i++) w.step();
  assert.equal(b.cap,rp,def.id+': physical shot enters ramp');
  let highest=0;
  for(let i=0;i<1500&&b.cap;i++) {w.step();if(b.cap) highest=Math.max(highest,rp.height(b.rampT));}
  assert(highest>=rp.maxHeight-1,def.id+': reaches second level'); assert.equal(b.cap,null,def.id+': releases back to field');
  assert(events.includes('ramp')&&events.includes('rampExit'));
  assert(b.vy>500&&Number.isFinite(b.vx),def.id+': return velocity');
  const rejection = new P.World(def.build()), r = rejection.t.ramps[index];
  const slow = rejection.addBall(r.x,r.y,0,0);rejection.sensors(slow);assert.equal(slow.cap,null,'Insufficient speed rejected');
  const reverse = rejection.addBall(r.x,r.y,-r.dx*950,-r.dy*950);rejection.sensors(reverse);assert.equal(reverse.cap,null,'Wrong direction rejected');
  results.push({table:def.id,track:rp.label,entry:true,maxHeight:highest,exit:true});
  }
}
assert.equal(signatures.size,P.TABLES.length,'All physical layouts distinct');
console.log(JSON.stringify({passed:true,ramps:results},null,2));
