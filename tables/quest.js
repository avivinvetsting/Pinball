/* Blueprint table 'quest' — builder lives in its own file. Uses the shared kit from designs.js (P.kit.make/track,
   available at build() time) and TB helpers from tables.js (bez, bank, ...). Loaded before designs.js.
   Geometry is authored in ART pixels (972x1619 crop of the blueprint) and converted with A(). */
(function(P){
  'use strict';
  const PI=Math.PI;
  const make=(...a)=>P.kit.make(...a),track=(...a)=>P.kit.track(...a);
  const A=(x,y)=>[20+x*525/972,y*940/1619];          // art px -> game
  const M=x=>565-x;                                   // mirror about the playfield centre
  const cv=cs=>cs.map(c=>c.map(p=>A(p[0],p[1])));     // convert bezier list
  /* 6. DARK QUEST — castle lanes (Drawbridge U, Dungeon gate lane, Armory/Keep dome), Upper Keep Ramp, SWORD & MAGIC banks */
  function quest(){
    const t=make('quest','DARK QUEST',{g:960,music:{root:41,tempo:92,scale:[0,2,3,5,7,8,10],wave:'sawtooth'},theme:{bg1:'#07122e',bg2:'#1a1038',rail:'#b9c6e8',glow:'#e8b84a',glow2:'#7a5cff',cap:'#c23a3a',lamp:'#ffd86a',ramp:'#e0b252'},labels:{drop:'SWORD & MAGIC',stand:'KEEP GUARDS',saucer:'DUNGEON',ramp:'KEEP RAMP',bump:'DRAGON'}});
    const W=(a,b,o)=>t.wall(a[0],a[1],b[0],b[1],o);
    const bz=(c,n)=>{const p=t.bez(cv(c),n||16);t.poly(p);return p;};
    const poly=(pts,o)=>t.poly(pts.map(p=>A(p[0],p[1])),o);
    const struct=(pts,h,col,trim,label)=>t.structures.push({pts:pts.map(p=>A(p[0],p[1])),h,col,trim,label});

    /* ---------- cabinet shell (own version of base(): square top, castle walls, plunger lane with corner arc) ---------- */
    t.wall(20,1000,20,174);
    t.wall(580,1000,580,83);
    t.wall(545,965,545,235);
    t.wall(545,164,545,235,{oneWay:true,nx:-1,ny:0,vis:false});
    t.wall(545,100,545,164);
    t.plungerSeg=t.wall(545,965,580,965,{vis:false});
    t.arc(535,83,45,-PI/2,0,14);                      // plunger exit corner: deflects the launched ball left into the Keep dome
    // invisible cabinet frame (everything above the castle lane walls is solid)
    t.wall(20,174,20,12,{vis:false});t.wall(20,12,580,12,{vis:false});t.wall(580,12,580,83,{vis:false});

    /* ---------- DRAWBRIDGE LANE: big U on the left. Mouth beside the Dragon bumper, climbs up-left, over the Castle Gate, down on the right ---------- */
    bz([[[0,300],[0,185],[130,60],[320,52]],[[320,52],[420,50],[445,130],[445,215]]]);   // outer wall (cabinet -> top -> finger)
    W(A(445,215),A(441,285));
    {const c=A(451.5,285);t.arc(c[0],c[1],5.7,PI,0,8);}                                    // finger tip (hatched tongue)
    W(A(462,285),A(462,130));                                                              // finger right face = DUNGEON LANE left wall
    bz([[[0,300],[25,370],[60,430],[100,480]]]);                                          // lane outer wall / wing roof (down to the mouth)
    t.post(...A(100,480),3);
    // inner wall = Castle Gate dome
    const D1=bz([[[205,490],[190,440],[165,390],[150,300]]]);
    bz([[[150,300],[142,215],[185,150],[250,148]],[[250,148],[320,146],[345,230],[353,362]]]);
    t.post(...A(205,490),3.5);
    {let bi=0,bd=1e9;const cy=A(0,380)[1];D1.forEach((p,i)=>{const d=Math.abs(p[1]-cy);if(d<bd){bd=d;bi=i;}});
      t.wall(...A(353,362),D1[bi][0],D1[bi][1]);}                                           // underside of the Castle Gate block

    /* ---------- DUNGEON LANE: straight gate channel; the portcullis arch is a Dungeon saucer that drops the ball back down ---------- */
    poly([[462,130],[468,105],[505,86],[542,105],[550,130]]);
    W(A(550,130),A(550,292));
    {const c=A(562.5,292);t.arc(c[0],c[1],6.75,PI,0,8);}
    W(A(575,292),A(575,150));
    t.saucer(...A(505,122),{r:16,hold:0.9,ejectAng:PI/2,ejectSpeed:560,spread:0.5});

    /* ---------- ARMORY / KEEP DOME on the right: outer arch, finger post + divider, Keep block, Keep lane down the right ---------- */
    bz([[[575,150],[575,90],[650,58],[760,56]],[[760,56],[840,54],[890,60],[915,72]]]);
    W(A(915,72),[535,38]);
    {const c=A(683.5,182);t.arc(c[0],c[1],8.9,PI,2*PI,8);W(A(700,182),A(700,262));
     const d=A(683.5,262);t.arc(d[0],d[1],8.9,0,PI,8);W(A(667,262),A(667,182));}
    bz([[[700,176],[699,145],[708,125],[725,112]]],10);                                    // divider curve between ARMORY lane 1 and 2
    {const c=A(832.5,205);W(A(780,262),A(885,262));W(A(885,262),A(885,205));
     t.arc(c[0],c[1],28.4,2*PI,PI,14);W(A(780,205),A(780,262));}                          // Keep block with domed top
    t.post(...A(832.5,262),3);

    /* ---------- RIGHT ORBIT band (diagonal lane up the right side into KEEP LANE) ---------- */
    W(A(778,558),A(852,352));W(A(895,512),A(972,294));
    t.post(...A(778,558),3);t.post(...A(895,512),3);

    /* ---------- left/right field walls: wing ledge, diagonal funnel, bank housings, ceilings, inlanes, slings ---------- */
    const chainL=[[20,318],[70,343],[100,405],[115,433],[115,447]];
    t.poly(chainL);t.poly(chainL.map(p=>[M(p[0]),p[1]]));
    t.bank(115,447,115,613,4,'sword',{back:8});
    t.bank(450,447,450,613,4,'magic',{back:-8});
    t.wall(115,613,20,613);t.wall(450,613,545,613);
    for(const side of [1,-1]){
      const m=side>0?(x=>x):M;
      t.wall(m(62),655,m(62),778);t.post(m(62),655,3);
      t.wall(m(62),778,m(195),876);
      t.sling([m(109),665],[m(101),761],[m(163),804]);
      t.rollover(m(38),742,'out',side>0?0:1,9);
      t.rollover(m(82),745,'in',side>0?0:1,9);
    }
    t.flipper(195,885,1,76);t.flipper(370,885,-1,76);
    t.status={mb:[{x:252,y:748},{x:282,y:748},{x:312,y:748}],mult:[{x:237,y:786},{x:267,y:786},{x:297,y:786},{x:327,y:786}],saver:{x:282,y:828}};

    /* ---------- upper playfield: 3 pop bumpers, lane-guide triangles, bonus multiplier inserts ---------- */
    t.bumper(...A(385,558),16);t.bumper(...A(613,556),16);t.bumper(...A(498,722),16);
    // the two drawn triangle lane-guide inserts (arrows pointing up to the ramp / orbit) are flat inserts, not obstacles: lit rollovers
    t.rollover(...A(214,640),13,'in',2);t.rollover(...A(758,640),13,'in',3);
    t.rollover(...A(408,1000),14,'mid',0);t.rollover(...A(497,950),14,'mid',1);t.rollover(...A(590,998),14,'mid',2);

    /* ---------- UPPER KEEP RAMP: enters the left wing, sweeps right above the castle-lane mouths, comes down the right edge ---------- */
    track(t,{label:'UPPER KEEP RAMP',height:112,color:'#e0b252',material:'wireform',width:30,dur:3.0,arches:[.16,.44,.72],exit:{vx:0,vy:560},
      curves:cv([[[93,558],[65,503],[50,440],[125,408]],[[125,408],[230,375],[380,355],[520,345]],[[520,345],[640,325],[760,290],[860,315]],[[860,315],[920,335],[955,420],[945,515]]])});

    /* ---------- raised castle structures (render only; physics already walled above) ---------- */
    struct([[2,58],[70,58],[70,120],[2,120]],46,'#2a2a44','#e8b84a','TOWER');
    struct([[352,14],[406,14],[406,46],[352,46]],46,'#2a2a44','#e8b84a','TOWER');
    struct([[448,90],[552,90],[552,128],[448,128]],40,'#2a2a44','#c23a3a','CASTLE GATE');
    struct([[594,14],[648,14],[648,56],[594,56]],46,'#2a2a44','#e8b84a','TOWER');
    struct([[800,12],[850,12],[850,45],[800,45]],46,'#2a2a44','#e8b84a','KEEP TOWER');
    struct([[175,278],[310,278],[310,364],[175,378]],26,'#3a2f55','#e8b84a','CASTLE GATE');
    struct([[432,120],[462,120],[462,285],[441,285],[445,215]],22,'#3a2f55','#c23a3a','');
    struct([[552,150],[575,150],[575,292],[552,292]],22,'#3a2f55','#c23a3a','');
    struct([[780,262],[780,205],[800,165],[832,152],[865,165],[885,205],[885,262]],24,'#3a2f55','#e8b84a','KEEP');

    t.shotArrows=[
      {x:122,y:380,ang:-1.9,col:'#e8b84a',label:'KEEP RAMP',kind:'ramp'},
      {x:150,y:330,ang:-1.57,col:'#7a5cff',label:'DRAWBRIDGE',kind:'tunnel'},
      {x:470,y:330,ang:-1.2,col:'#7a5cff',label:'KEEP LANE',kind:'tunnel'},
      {x:292,y:230,ang:-1.57,col:'#ff5a3a',label:'DUNGEON',kind:'saucer'},
      {x:80,y:470,ang:-0.9,col:'#e8b84a',label:'S-W-O-R-D',kind:'drop'}
    ];
    t.word='DRAGON';t.mission='טפסו במסלולי הטירה: גשר-המשיכה (DRAWBRIDGE) בצד שמאל, שער הצינוק (DUNGEON) במרכז ומסלולי הארמורי/הקיפ בצד ימין. חסלו את בנק החרבות S-W-O-R-D ובנק הקסמים MAGIC, והעפילו ברמפת ה-KEEP העליונה!';
    t.signature='מסלולי טירה בצורת פרסה · שער צינוק · רמפת מבצר עליונה · שני בנקי מטרות';t.bumperStyle='compass';t.styleTag='DARK FANTASY CASTLE';t.cabinetStyle='iron';t.floorStyle='castle';return t;
  }
  (P.BP=P.BP||{}).quest=quest;
})(globalThis.Pin);
