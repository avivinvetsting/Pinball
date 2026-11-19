/* Eight radically distinct pinball architectures: custom silhouettes, 3D tunnels/subways, moving bash toys, magnets, boosters & multi-style ramps. */
(function(P){
  'use strict';
  const TB=P.TableBuilder, base=P.baseTable, old=P.TABLES;
  function make(id,name,def){
    const source=def||old.find(d=>d.id===id).build();
    const tb=new TB({id,name,g:source.g,music:source.music,theme:source.theme,labels:source.labels});
    tb.props=[];tb.tunnels=[];tb.structures=[];
    return tb;
  }
  function tunnel(tb, cfg){
    const s=tb.saucer(cfg.x1,cfg.y1,{
      r:cfg.r||16,
      hold:cfg.hold||0.78,
      ejectAng:cfg.ejectAng!=null?cfg.ejectAng:-Math.PI/2,
      ejectSpeed:cfg.ejectSpeed||900
    });
    s.tunnelTo={
      x:cfg.x2,
      y:cfg.y2,
      ejectAng:cfg.ejectAng!=null?cfg.ejectAng:-Math.PI/2,
      ejectSpeed:cfg.ejectSpeed||900,
      label:cfg.label||'SECRET TUNNEL!',
      col:cfg.col||'#ffd24a'
    };
    const tn={
      x1:cfg.x1,y1:cfg.y1,x2:cfg.x2,y2:cfg.y2,
      label:cfg.label||'SUBWAY',
      exitLabel:cfg.exitLabel||'EXIT',
      col:cfg.col||'#ffd24a',
      style:cfg.style||'arch',
      saucer:s
    };
    tb.tunnels.push(tn);
    return tn;
  }
  function track(tb, cfg){
    const first=cfg.curves[0],r=tb.ramp(...first,{minSpd:cfg.minSpd||210,r:24,dur:cfg.dur||2.3,exit:cfg.exit||{vx:0,vy:620}});
    r.pts=[];for(const curve of cfg.curves)for(let i=r.pts.length?1:0;i<=60;i++){const t=i/60,u=1-t,[a,b,c,d]=curve;r.pts.push({x:u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],y:u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]});}
    r.upper=true;r.label=cfg.label;r.maxHeight=cfg.height||100;r.color=cfg.color;r.width=cfg.width||34;r.material=cfg.material||'clear';r.arches=cfg.arches||[.2,.5,.8];r.cum=[0];
    for(let i=1;i<r.pts.length;i++)r.cum.push(r.cum[i-1]+Math.hypot(r.pts[i].x-r.pts[i-1].x,r.pts[i].y-r.pts[i-1].y));r.len=r.cum.at(-1);
    r.height=t=>{t=Math.max(0,Math.min(1,t));const s=v=>v*v*(3-2*v);return t<.24?r.maxHeight*s(t/.24):t>.73?r.maxHeight*s((1-t)/.27):r.maxHeight;};
    r.at=t=>{t=Math.max(0,Math.min(1,t));const d=t*r.len;let i=1;while(i<r.cum.length-1&&r.cum[i]<d)i++;const f=(d-r.cum[i-1])/(r.cum[i]-r.cum[i-1]||1),a=r.pts[i-1],b=r.pts[i];return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,h:r.height(t)};};
    r.supports=[];for(const t of [.29,.53,.72]){const p=r.at(t),q=r.at(t+.002),l=Math.hypot(q.x-p.x,q.y-p.y)||1,x=p.x-(q.y-p.y)/l*(r.width/2+2),y=p.y+(q.x-p.x)/l*(r.width/2+2);if(!tb.circles.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+18)&&!tb.props.some(p=>Math.hypot(p.x-x,p.y-y)<(p.r||60)+15)){tb.post(x,y,3,{vis:false});r.supports.push({x,y,h:p.h});}}
    return r;
  }

  /* 1. JAZZ BOULEVARD — Asymmetric Split-Level Penthouse, Upper Balcony Flipper, Backstage Subway Tunnel & Saxophone Horn */
  function jazz(){
    const t=make('neon','JAZZ BOULEVARD');base(t,{flipLen:82});t.topLanes([190,250,310,370],108);
    t.bumper(202,240,27);t.bumper(366,240,27);t.bumper(284,350,28);
    t.passive(128,635,23);t.passive(438,635,23);
    // Upper-left VIP Balcony Flipper
    t.flipper(78,385,1,48,{mini:true});
    // Center ENCORE saucer + Surprise Backstage Subway Tunnel to Upper Saxophone Horn!
    t.saucer(282,455,{kicker:true,r:15,hold:.6,ejectAng:-Math.PI/2,ejectSpeed:740});
    tunnel(t,{x1:115,y1:485,x2:468,y2:225,ejectAng:2.35,ejectSpeed:860,label:'SAXOPHONE HORN!',exitLabel:'SAX BLAST',col:'#ffd24a',style:'horn'});
    // Patrolling Jazz Spotlight mover
    const mv=t.mover(282,535,70,0,2.3,14);mv.label='JAZZ SPOTLIGHT!';mv.style='spotlight';
    t.dropBank(-1,400,4,'notes');t.standBank(1,415,3,'brass');
    t.spinner(75,325,135,325);t.post(75,325,4);t.post(135,325,4);
    t.poly([[65,210],[65,285],[110,285]],{e:.4});t.poly([[495,220],[495,335],[451,360]],{e:.4});
    t.structures.push(
      {pts:[[24,205],[92,205],[112,285],[24,300]],h:34,col:'#5c1830',trim:'#f2c15a',label:'VIP BALCONY'},
      {pts:[[541,210],[485,210],[451,358],[541,372]],h:38,col:'#5c1830',trim:'#f2c15a',label:'SAXOPHONE STAGE'}
    );
    t.rubberTri([154,405],[156,485],[210,448],'#20a795','J');
    t.rollover(225,555,'mid',0);t.rollover(340,555,'mid',1);
    t.props.push({kind:'vinyl',x:282,y:285,r:34});
    t.shotArrows=[
      {x:115,y:535,ang:-0.15,col:'#ffd24a',label:'SUBWAY TUNNEL',kind:'tunnel'},
      {x:282,y:500,ang:0,col:'#ff5277',label:'ENCORE',kind:'saucer'},
      {x:105,y:370,ang:-0.12,col:'#24d8c6',label:'SOLO SPIN',kind:'spinner'},
      {x:490,y:465,ang:0.95,col:'#ffd24a',label:'4-BEAT',kind:'drop'}
    ];
    t.numbers=true;t.reels=true;t.balls=5;t.word='ENCORE';t.replays=[80000,120000,160000];
    t.labels={drop:'FOUR-BEAT BONUS',stand:'BRASS SECTION',saucer:'ENCORE',ramp:'',bump:'CHIME'};
    t.mission='שגרו למנהרת ה-SUBWAY השמאלית כדי לפרוץ מקרן הסקסופון העליונה! היעזרו בפליפר המרפסת ופגעו בזרקור הג׳אז.';
    t.signature='מנהרת סקסופון · פליפר מרפסת · תקליט מסתובב';t.bumperStyle='sunburst';t.styleTag='VIP JAZZ CLUB';t.cabinetStyle='brass';t.floorStyle='deco';return t;
  }

  /* 2. KRAKEN COVE — Raised Galleon Hull, Maelstrom Whirlpool Subway Tunnel to Ship Cannon, Moving Kraken Tentacle & Suspension Coaster */
  function pirates(){
    const t=make('pirate','KRAKEN COVE');base(t);t.topLanes([270,330,390],105);
    t.bumper(310,240,23);t.bumper(426,270,23);t.bumper(370,368,25);
    t.bumper(280,495,18);t.dropBank(1,400,3,'cannons');t.standBank(-1,375,3,'compass');
    // Whirlpool Abyss Subway Tunnel -> fires out of the Upper Ship Bow Cannon!
    tunnel(t,{x1:475,y1:535,x2:155,y2:195,ejectAng:0.65,ejectSpeed:920,label:'CANNON BLAST!',exitLabel:'BOW CANNON',col:'#35e8dc',style:'whirlpool'});
    // Moving Kraken Tentacle rising from the sea!
    const mv=t.mover(272,438,54,14,2.6,16);mv.label='KRAKEN TENTACLE!';mv.style='tentacle';
    t.spinner(230,580,295,580);
    t.rollover(200,470,'mid',0);t.rollover(400,460,'mid',1);
    t.props.push({kind:'ship',x:145,y:248,r:55});
    t.poly([[108,140],[174,140],[197,325],[145,368],[96,322],[108,140]],{e:.4});
    t.structures.push(
      {pts:[[541,280],[504,310],[504,365],[541,390]],h:30,col:'#16424b',trim:'#35e8dc',label:'CORAL REEF'}
    );
    track(t,{label:'CAPTAIN’S DECK',height:124,color:'#f0c46c',material:'wireform',width:30,dur:2.55,arches:[.16,.44,.72],exit:{vx:95,vy:655},curves:[[[412,628],[468,465],[488,210],[380,108]],[[380,108],[255,58],[118,82],[84,215]],[[84,215],[62,360],[82,520],[108,654]]]});
    t.shotArrows=[
      {x:404,y:668,ang:0.32,col:'#ffd24a',label:'SKYBRIDGE RAMP',kind:'ramp'},
      {x:450,y:575,ang:0.65,col:'#35e8dc',label:'ABYSS TUNNEL',kind:'tunnel'},
      {x:272,y:485,ang:0,col:'#ff6448',label:'KRAKEN BASH',kind:'mover'},
      {x:78,y:445,ang:-0.95,col:'#ffd24a',label:'CANNONS',kind:'drop'}
    ];
    t.word='KRAKEN';t.labels.ramp='CAPTAIN’S DECK';t.mission='צללו למנהרת המערבולת (ABYSS TUNNEL) כדי להיירות מתותח הסיפון העליון! הכניעו את זרוע הקראקן וטפסו לגשר החבלים.';
    t.signature='מנהרת מערבולת לתותח · זרוע קראקן נעה · גשר חבלים';t.bumperStyle='compass';t.styleTag='MAELSTROM GALLEON';t.cabinetStyle='bronze';t.floorStyle='ocean';return t;
  }

  /* 3. ORBITAL ACE — Hexagonal Hourglass Cyber-Arena, 4 Flippers, Quantum Wormhole Subway, Gravity Magnet & Speed Boosters */
  function orbital(){
    const t=make('space','ORBITAL ACE');base(t);t.topLanes([215,282,350],100);
    t.bumper(170,240,21);t.bumper(390,240,21);t.bumper(282,335,25);
    t.flipper(45,565,1,51,{mini:true});t.flipper(520,520,-1,51,{mini:true});
    // Guides sealing the too-narrow gap between each mini-flipper pivot and the side wall (ball used to wedge there)
    t.wall(20,540,40,556,{e:.3});t.wall(545,495,525,511,{e:.3});
    // Hexagonal Hourglass Cyber-Walls
    t.poly([[20,285],[66,335],[20,385]],{e:.55});
    t.poly([[545,285],[499,335],[545,385]],{e:.55});
    t.structures.push(
      {pts:[[20,285],[66,335],[20,385]],h:36,col:'#0c1938',trim:'#00f2ff',label:'CYBER WING L'},
      {pts:[[545,285],[499,335],[545,385]],h:36,col:'#0c1938',trim:'#ff2a9d',label:'CYBER WING R'}
    );
    t.dropBank(1,395,4,'port');t.dropBank(-1,395,4,'starboard');
    // Quantum Wormhole Subway Tunnel (Center -> Upper Reactor Core!)
    t.saucer(282,160,{r:15,ejectAng:Math.PI/2,ejectSpeed:800});
    tunnel(t,{x1:282,y1:490,x2:282,y2:165,ejectAng:Math.PI/2,ejectSpeed:950,label:'WORMHOLE WARP!',exitLabel:'REACTOR CORE',col:'#00f2ff',style:'wormhole'});
    // Central Gravity Magnet & Twin Hyper-Booster Strips
    t.magnet(282,305,86,950,6.5,2.6);
    t.boost(72,575,40,86,[0,-1],920,1650);
    t.boost(452,575,40,86,[0,-1],920,1650);
    t.rollover(160,455,'mid',0);t.rollover(405,455,'mid',1);
    t.props.push({kind:'reactor',x:282,y:160,r:24});
    track(t,{label:'HYPERDRIVE',height:132,color:'#00f2ff',material:'neon',width:30,dur:2.05,arches:[.15,.38,.62,.85],exit:{vx:-80,vy:650},curves:[[[145,660],[125,510],[410,390],[443,230]],[[443,230],[465,95],[370,70],[305,140]],[[305,140],[220,245],[450,475],[452,653]]]});
    track(t,{label:'ORBIT RETURN',height:82,color:'#ff2a9d',material:'neon',width:30,dur:2.1,arches:[.18,.5,.82],exit:{vx:100,vy:620},curves:[[[420,675],[438,520],[140,395],[120,255]],[[120,255],[90,100],[185,75],[240,150]],[[240,150],[350,280],[100,480],[115,657]]]});
    t.shotArrows=[
      {x:150,y:695,ang:-0.15,col:'#00f2ff',label:'HYPERDRIVE',kind:'ramp'},
      {x:415,y:705,ang:0.15,col:'#ff2a9d',label:'ORBIT RAMP',kind:'ramp'},
      {x:282,y:545,ang:0,col:'#7dffb0',label:'WORMHOLE GATE',kind:'tunnel'},
      {x:92,y:640,ang:0,col:'#00f2ff',label:'BOOST L',kind:'boost'},
      {x:472,y:640,ang:0,col:'#ff2a9d',label:'BOOST R',kind:'boost'}
    ];
    t.word='WARP';t.mission='זירת סייבר משושה! שגרו לשער חור התולעת במרכז לשיגור תת־קרקעי לליבת הכור, והאיצו בפסי ה-BOOST.';
    t.signature='זירה משושה · חור תולעת · מגנט כבידה · 4 פליפרים';t.bumperStyle='reactor';t.styleTag='HEX CYBER ARENA';t.cabinetStyle='neon';t.floorStyle='cyber';return t;
  }

  /* 4. MIDNIGHT MANOR — Gothic Catacomb Buttresses, Stone Coffin Subway Tunnel to Altar, Patrolling Ghost & Bell Tower Viaduct */
  function manor(){
    const t=make('haunted','MIDNIGHT MANOR');base(t,{flipLen:76});t.topLanes([160,220,280],110);
    t.bumper(160,220,22);t.bumper(265,255,22);t.bumper(165,345,21);
    t.props.push({kind:'tower',x:419,y:253,r:45});
    t.poly([[378,175],[460,175],[460,328],[378,328],[378,175]],{e:.4});
    // Left Gothic Stone Crypt Buttress narrowing the waist
    t.poly([[20,335],[68,365],[68,425],[20,450]],{e:.45});
    t.structures.push(
      {pts:[[20,335],[68,365],[68,425],[20,450]],h:38,col:'#2d253b',trim:'#65ff90',label:'CRYPT WALL'}
    );
    t.saucer(315,295,{r:16,ejectAng:Math.PI/2,ejectSpeed:760});
    // Stone Coffin Subway Tunnel (Left Coffin -> Bell Tower Altar!)
    tunnel(t,{x1:90,y1:490,x2:420,y2:360,ejectAng:2.1,ejectSpeed:880,label:'CRYPT ELEVATOR!',exitLabel:'ALTAR CRYPT',col:'#65ff90',style:'coffin'});
    // Patrolling Phantom Ghost mover in the courtyard!
    const mv=t.mover(235,395,58,16,2.1,15);mv.label='PHANTOM SPIRIT!';mv.style='ghost';
    [[180,474],[232,494],[285,514]].forEach(([x,y],i)=>{const s=t.wall(x,y,x+29,y,{kind:'drop',group:'graves',vis:false});s.lbl=i;});
    t.standBank(-1,455,3,'candles');t.spinner(160,585,215,585);t.flipper(82,625,1,45,{mini:true});
    t.rollover(300,415,'mid',0);t.rollover(348,560,'mid',1);
    track(t,{label:'BELL TOWER',height:148,color:'#b892ff',material:'iron',width:28,dur:2.35,arches:[.16,.44,.72],exit:{vx:-90,vy:640},curves:[[[430,635],[488,490],[495,330],[478,190]],[[478,190],[470,92],[350,98],[350,206]],[[350,206],[350,325],[335,488],[324,622]]]});
    t.shotArrows=[
      {x:418,y:675,ang:0.35,col:'#b892ff',label:'BELL VIADUCT',kind:'ramp'},
      {x:114,y:535,ang:-0.55,col:'#65ff90',label:'COFFIN TUNNEL',kind:'tunnel'},
      {x:235,y:435,ang:0,col:'#65ff90',label:'PHANTOM',kind:'mover'},
      {x:235,y:555,ang:-0.25,col:'#ff9d42',label:'GRAVES',kind:'drop'}
    ];
    t.storm=true;t.word='SEANCE';t.labels.ramp='BELL TOWER';t.mission='שגרו לארון הקבורה השמאלי (COFFIN TUNNEL) למעבר תת־קרקעי למזבח! פגעו ברוח הרפאים המרחפת וטפסו למגדל הפעמון.';
    t.signature='מנהרת ארון קבורה · רוח רפאים נעה · גשר גותי';t.bumperStyle='clock';t.styleTag='CATACOMB HORROR';t.cabinetStyle='iron';t.floorStyle='catacomb';return t;
  }

  /* 5. INFERNO TEMPLE — Volcanic Caldera Walls, Lava Cave Subway Erupting from Crater, 360° Helical Corkscrew Coaster & Lava Boosters */
  function inferno(){
    const t=make('volcano','INFERNO TEMPLE');base(t,{flipLen:70});t.topLanes([215,282,350],100);
    t.props.push({kind:'volcano',x:282,y:305,r:67});t.post(282,305,67,{vis:false,e:.6});
    [[147,245],[420,245],[160,390],[407,390],[235,455]].forEach(([x,y])=>t.bumper(x,y,19,{kick:700}));
    // Obsidian Caldera jutting rock walls
    t.poly([[20,310],[62,355],[20,400]],{e:.5});
    t.poly([[545,310],[503,355],[545,400]],{e:.5});
    t.structures.push(
      {pts:[[20,310],[62,355],[20,400]],h:36,col:'#2b1814',trim:'#ff6a1a',label:'BASALT CRAG L'},
      {pts:[[545,310],[503,355],[545,400]],h:36,col:'#2b1814',trim:'#ff6a1a',label:'BASALT CRAG R'}
    );
    t.dropBank(1,435,3,'lavaL');t.dropBank(-1,435,3,'lavaR');t.standBank(-1,570,2,'temple');
    // Magma Chamber Subway Tunnel -> Erupts straight out of the Volcano Crater!
    tunnel(t,{x1:335,y1:510,x2:282,y2:205,ejectAng:-Math.PI/2,ejectSpeed:1080,label:'VOLCANO ERUPTION!',exitLabel:'CRATER VENT',col:'#ff5500',style:'lavaCave'});
    // Twin Lava Accelerator Boosters
    t.boost(84,565,40,82,[0.14,-0.99],960,1700);
    t.boost(440,565,40,82,[-0.14,-0.99],960,1700);
    t.rollover(155,545,'mid',0);t.rollover(415,545,'mid',1);
    // 360-degree Helical Corkscrew Coaster spiraling around the Volcano!
    track(t,{label:'CRATER CORKSCREW',height:118,color:'#ff6a1a',material:'lava',width:30,dur:2.55,arches:[.12,.28,.46,.64,.82],exit:{vx:120,vy:730},curves:[[[135,651],[70,490],[82,140],[275,118]],[[275,118],[472,118],[496,395],[315,435]],[[315,435],[155,455],[155,220],[282,195]],[[282,195],[435,195],[478,465],[430,650]]]});
    t.shotArrows=[
      {x:152,y:690,ang:-0.35,col:'#ff6a1a',label:'360° CORKSCREW',kind:'ramp'},
      {x:335,y:560,ang:0,col:'#ffd23a',label:'MAGMA TUNNEL',kind:'tunnel'},
      {x:104,y:625,ang:0.14,col:'#ff5500',label:'LAVA BOOST',kind:'boost'},
      {x:460,y:625,ang:-0.14,col:'#ff5500',label:'LAVA BOOST',kind:'boost'}
    ];
    t.word='INFERNO';t.mission='שגרו למערת המאגמה (MAGMA TUNNEL) כדי להתפרץ מלוע הר הגעש! טפסו במסלול הספירלה 360° סביב הלוע.';
    t.signature='התפרצות ממנהרת מאגמה · ספירלה 360° · מאיצי לבה';t.bumperStyle='lava';t.styleTag='360° CORKSCREW';t.cabinetStyle='obsidian';t.floorStyle='caldera';return t;
  }


  P.kit={make,track,tunnel};
  const builders=[jazz,pirates,orbital,manor,inferno,()=>P.BP.quest(),()=>P.BP.spy(),()=>P.BP.frenzy()],names=['פנטהאוז הג׳אז','מפרץ הקראקן','סייבר־ארנה 2099','קטקומבות חצות','קלדרת הגיהנום','מבצר האופל','מבצע ריגול','טירוף ארקייד'],diffs=[1,2,3,4,5,4,3,5];
  P.TABLES=builders.map((build,i)=>{const t=build();return{id:t.id,name:t.name,he:names[i],diff:diffs[i],build,desc:t.signature,styleTag:t.styleTag};});
})(globalThis.Pin);
