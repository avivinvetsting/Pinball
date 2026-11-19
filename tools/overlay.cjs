/* Overlay a table's physical geometry on its playfield art, to compare against the blueprint.
   Usage: node tools/overlay.cjs <tableId> [out.png]
   Colours: white=visible wall, orange=invisible wall, yellow=drop target, magenta=standup, red=sling kicker,
   green=bumper, cyan=post/passive, blue=flipper, lime=ramp path (entrance circle), purple=saucer/tunnel, grey=rollover. */
const path = require('node:path'), { execFileSync } = require('node:child_process'), fs = require('node:fs');
const root = path.resolve(__dirname, '..');
require(root + '/engine.js'); require(root + '/tables.js'); require(root + '/tables/quest.js'); require(root + '/tables/spy.js'); require(root + '/tables/frenzy.js'); require(root + '/designs.js');
const P = globalThis.Pin, id = process.argv[2], out = path.resolve(process.argv[3] || path.join(root, 'overlay-' + id + '.png'));
const def = P.TABLES.find((d) => d.id === id); if (!def) { console.error('unknown table ' + id); process.exit(1); }
const t = def.build();
const g = {
  segs: t.segs.filter((s) => s !== t.plungerSeg).map((s) => ({ a: [s.x1, s.y1, s.x2, s.y2], k: s.kind, v: s.vis })),
  circles: t.circles.map((c) => ({ x: c.x, y: c.y, r: c.r, k: c.kind, p: !!c.passive })),
  flippers: t.flippers.map((f) => ({ x: f.x, y: f.y, x2: f.x + f.side * f.len * Math.cos(f.rest), y2: f.y + f.len * Math.sin(f.rest) })),
  ramps: t.ramps.map((r) => ({ pts: (r.pts || []).map((p) => [p.x, p.y]), x: r.x, y: r.y, r: r.r })),
  saucers: t.saucers.map((s) => ({ x: s.x, y: s.y, r: s.r, to: s.tunnelTo ? [s.tunnelTo.x, s.tunnelTo.y] : null })),
  rollovers: t.rollovers.map((r) => ({ x: r.x, y: r.y, r: r.r })),
};
const art = path.join(root, 'assets', id + '-playfield-v2.png');
const tmp = path.join(require('node:os').tmpdir(), 'overlay-' + id + '.json'); fs.writeFileSync(tmp, JSON.stringify(g));
const py = String.raw`
import json,sys
from PIL import Image,ImageDraw
g=json.load(open(sys.argv[1]));im=Image.open(sys.argv[2]).convert('RGB');W,H=im.size
im=Image.eval(im,lambda v:int(v*.55));d=ImageDraw.Draw(im)
sx=W/525;sy=H/940
P=lambda x,y:((x-20)*sx,y*sy)
col={'wall':(255,255,255),'drop':(255,230,0),'stand':(255,0,255),'sling':(255,40,40),'rubber':(0,230,255)}
for s in g['segs']:
  c=col.get(s['k'],(255,255,255)) if s['v'] or s['k']!='wall' else (255,150,0)
  d.line([P(*s['a'][:2]),P(*s['a'][2:])],fill=c,width=4 if s['k']=='drop' else 3)
for c in g['circles']:
  x,y=P(c['x'],c['y']);r=c['r']*sx;cc=(0,255,90) if c['k'] in('bumper','mover') else (0,230,255)
  d.ellipse([x-r,y-r,x+r,y+r],outline=cc,width=3)
for f in g['flippers']: d.line([P(f['x'],f['y']),P(f['x2'],f['y2'])],fill=(60,120,255),width=12)
for r in g['ramps']:
  if r['pts']: d.line([P(*p) for p in r['pts']],fill=(150,255,0),width=3)
  x,y=P(r['x'],r['y']);rr=r['r']*sx;d.ellipse([x-rr,y-rr,x+rr,y+rr],outline=(150,255,0),width=4)
for s in g['saucers']:
  x,y=P(s['x'],s['y']);r=s['r']*sx;d.ellipse([x-r,y-r,x+r,y+r],outline=(200,80,255),width=4)
  if s['to']: d.line([P(s['x'],s['y']),P(*s['to'])],fill=(200,80,255),width=2)
for r in g['rollovers']:
  x,y=P(r['x'],r['y']);rr=r['r']*sx;d.ellipse([x-rr,y-rr,x+rr,y+rr],outline=(170,170,170),width=2)
im.save(sys.argv[3]);print('wrote',sys.argv[3])
`;
console.log(execFileSync('python', ['-c', py, tmp, art, out]).toString().trim());
