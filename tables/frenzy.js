/* Blueprint table 'frenzy' — builder lives in its own file. Uses the shared kit from designs.js (P.kit.make/track/tunnel,
   available at build() time) and TB helpers from tables.js (lane, bank, bez, ...). Loaded before designs.js. */
(function(P){
  'use strict';
  const PI=Math.PI;
  const make=(...a)=>P.kit.make(...a),track=(...a)=>P.kit.track(...a);
  const MX=x=>565-x;
  /* Catmull-Rom through points -> chain of cubic beziers (first/last tangents follow the end chords) */
  function curvesThrough(pts){
    const n=pts.length,out=[];
    for(let i=0;i<n-1;i++){
      const p0=pts[i],p3=pts[i+1],a=pts[i-1]||p0,b=pts[i+2]||p3;
      const m0=i?[(p3[0]-a[0])/2,(p3[1]-a[1])/2]:[p3[0]-p0[0],p3[1]-p0[1]];
      const m3=i+2<n?[(b[0]-p0[0])/2,(b[1]-p0[1])/2]:[p3[0]-p0[0],p3[1]-p0[1]];
      out.push([p0,[p0[0]+m0[0]/3,p0[1]+m0[1]/3],[p3[0]-m3[0]/3,p3[1]-m3[1]/3],p3]);
    }
    return out;
  }
  /* Own shell: rounded-rectangle top (corner r=110 like the drawn playfield), standard plunger lane / slings / inlanes / flippers. */
  function shell(t,flipLen){
    t.wall(20,1000,20,130);
    t.arc(130,130,110,PI,1.5*PI,24);
    t.wall(130,20,470,20);
    t.arc(470,130,110,1.5*PI,2*PI,24);
    t.wall(580,130,580,1000);
    t.wall(545,965,545,235);
    t.wall(545,45,545,235,{oneWay:true,nx:-1,ny:0,vis:false});   /* gate extends up the corner so top-passage balls cannot fall back into the plunger lane */
    t.plungerSeg=t.wall(545,965,580,965,{vis:false});
    for(const side of [1,-1]){
      const m=side>0?(x)=>x:MX;
      t.wall(m(56),770,m(56),830);t.post(m(56),770,3);
      t.wall(m(56),830,m(197),876);
      t.sling([m(86),700],[m(86),790],[m(150),822]);
      t.rollover(m(38),742,'out',side>0?0:1,9);
      t.rollover(m(71),745,'in',side>0?0:1,9);
    }
    t.flipper(195,885,1,flipLen);t.flipper(370,885,-1,flipLen);
    t.status={mb:[{x:252,y:748},{x:282,y:748},{x:312,y:748}],mult:[{x:237,y:786},{x:267,y:786},{x:297,y:786},{x:327,y:786}],saver:{x:282,y:828}};
  }
  /* 8. ARCADE FRENZY — figure-eight of two crossing wire ramps (BALL PATH), orbits, top-lane pen, 3 pops, twin 4-banks */
  function frenzy(){
    const t=make('frenzy','ARCADE FRENZY',{g:1000,music:{root:45,tempo:150,scale:[0,2,4,7,9],wave:'square'},theme:{bg1:'#10083a',bg2:'#2a0a52',rail:'#9ad7ff',glow:'#ff2bd6',glow2:'#27e8ff',cap:'#ff2bd6',lamp:'#fff25a',ramp:'#27e8ff'},labels:{drop:'ARCADE BANK',stand:'TARGETS',saucer:'BONUS',ramp:'FRENZY RAMP',bump:'ZAP'}});
    shell(t,80);
    /* TOP LANES: 4 capsule lanes in a pen under the top passage */
    t.topLanes([240,281,316,360],108);
    t.wall(205,128,205,140,{e:.3});t.post(205,140,3);
    t.wall(389,128,389,140,{e:.3});t.post(389,140,3);
    /* 3 POP BUMPERS inside the diamond */
    t.bumper(231,229,23);t.bumper(339,229,23);t.bumper(295,328,23);
    /* Left hooked entrance (floor lane): starts just above the left bank face, rises along the left side, hooks over the top and drops into BALL PATH 1.
       Its outer wall doubles as the inner wall of the left ORBIT (the open strip between it and the shell). */
    t.lane(curvesThrough([[133,426],[130,380],[117,330],[104,280],[96,235],[96,190],[98,150],[105,116],[122,94],[142,98],[160,105],[174,115],[182,127],[185,140],[185,148]]),{width:40,label:'LEFT HOOK',col:'#ff2bd6',n:10});
    /* Right hooked entrance: mirror image, drops into BALL PATH 2 */
    t.lane(curvesThrough([[437,424],[447,385],[462,340],[478,295],[486,250],[486,190],[486,150],[484,122],[471,100],[452,102],[434,108],[420,116],[412,127],[409,139],[409,148]]),{width:40,label:'RIGHT HOOK',col:'#27e8ff',n:10});
    /* orbit floors slope out into the field */
    t.wall(20,575,76,630,{e:.3});t.wall(545,575,489,630,{e:.3});
    /* DROP TARGET BANKS (4+4); thin backing keeps a dropped target from opening a pocket; roofs slope away from the lane mouths */
    t.bank(113,418,113,554,4,'left',{});
    t.wall(113,418,99,424,{e:.3});t.wall(99,424,99,554,{e:.3});t.wall(99,554,113,554,{e:.3});
    t.bank(457,418,457,554,4,'right',{});
    t.wall(457,418,471,424,{e:.3});t.wall(471,424,471,554,{e:.3});t.wall(457,554,471,554,{e:.3});
    /* lane-guide triangles with arrows (left: three stacked, right: two) */
    t.rubberTri([194,334],[185,376],[205,376],'#ff2bd6','F');
    t.rubberTri([238,357],[229,394],[249,394],'#27e8ff','F');
    t.rubberTri([200,388],[190,420],[212,420],'#ff2bd6','F');
    t.rubberTri([392,372],[376,404],[394,404],'#27e8ff','F');
    t.rubberTri([381,416],[361,450],[381,450],'#ff2bd6','F');
    /* BALL PATH 1 (lower): hook (upper-left) -> diamond left wall -> across the centre -> right inlane */
    const p1=[[185,148],[185,172],[168,205],[158,240],[163,285],[198,331],[247,377],[322,421],[390,452],[430,515],[455,585],[475,635],[492,672]];
    track(t,{label:'BALL PATH 1',height:112,color:'#ff2bd6',material:'neon',width:26,dur:3.0,arches:[.15,.4,.65,.88],exit:{vx:0,vy:650},curves:curvesThrough(p1)});
    /* BALL PATH 2 (higher): hook (upper-right) -> diamond right wall -> across the centre -> left inlane */
    const p2=[[409,148],[410,172],[432,200],[448,225],[446,258],[420,302],[393,340],[366,377],[322,427],[263,464],[182,496],[128,531],[96,572],[84,622],[73,672]];
    track(t,{label:'BALL PATH 2',height:150,color:'#27e8ff',material:'neon',width:26,dur:3.0,arches:[.15,.4,.65,.88],exit:{vx:0,vy:650},curves:curvesThrough(p2)});
    t.shotArrows=[
      {x:96,y:352,ang:-1.57,col:'#ff2bd6',label:'PATH 1',kind:'ramp'},
      {x:486,y:352,ang:-1.57,col:'#27e8ff',label:'PATH 2',kind:'ramp'},
      {x:150,y:470,ang:3.14,col:'#27e8ff',label:'DROP BANK',kind:'drop'},
      {x:420,y:495,ang:0,col:'#ff2bd6',label:'DROP BANK',kind:'drop'}
    ];
    t.word='FRENZY';t.mission='שתי רמפות ניאון חוצות בפיגורת 8! עלו במעלית הקרס השמאלית לנתיב 1 ובמעלית הימנית לנתיב 2, ופגעו בשני בנקי הארקייד לטירוף הנקודות.';
    t.signature='פיגורת 8 של רמפות חוצות · אורביטים · שני בנקי מטרות';t.bumperStyle='sunburst';t.styleTag='RETRO 80s SYNTHWAVE';t.cabinetStyle='neon';t.floorStyle='synth';return t;
  }
  (P.BP=P.BP||{}).frenzy=frenzy;
})(globalThis.Pin);
