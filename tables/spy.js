/* Blueprint table 'spy' — builder lives in its own file. Uses the shared kit from designs.js (P.kit.make/track/tunnel,
   available at build() time) and TB helpers from tables.js (bank, bez, ...). Loaded before designs.js.
   Geometry is traced from assets/blueprints/spy-blueprint.webp (art assets/spy-playfield-v2.png, 972x1619 -> game
   x 20..545, y 0..940). Coordinates below marked A(ax,ay) are art pixels converted with the brief's mapping. */
(function(P){
  'use strict';
  const PI=Math.PI;
  const make=(...a)=>P.kit.make(...a),track=(...a)=>P.kit.track(...a);
  const A=(x,y)=>[20+x*525/972,y*940/1619];
  const MX=x=>565-x;
  /* uniform Catmull-Rom smoothing of a polyline (n samples per span) */
  function sm(pts,n){
    n=n||5;const out=[],p=i=>pts[Math.max(0,Math.min(pts.length-1,i))];
    for(let i=0;i<pts.length-1;i++){
      const p0=p(i-1),p1=p(i),p2=p(i+1),p3=p(i+2);
      for(let k=0;k<n;k++){
        const t=k/n,t2=t*t,t3=t2*t,f=c=>.5*(2*p1[c]+(-p0[c]+p2[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t2+(-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t3);
        out.push([f(0),f(1)]);
      }
    }
    out.push(pts[pts.length-1]);return out;
  }
  /* clockwise (screen) spiral as chained cubic quarter-arcs, radius shrinking from r0 to r1 */
  function spiral(cx,cy,r0,r1,a0,quarters){
    const cur=[],K=.5523;
    for(let q=0;q<quarters;q++){
      const ra=r0+(r1-r0)*q/quarters,rb=r0+(r1-r0)*(q+1)/quarters,a=a0+q*PI/2,b=a+PI/2;
      const P0=[cx+ra*Math.cos(a),cy+ra*Math.sin(a)],P3=[cx+rb*Math.cos(b),cy+rb*Math.sin(b)];
      cur.push([P0,[P0[0]-K*ra*Math.sin(a),P0[1]+K*ra*Math.cos(a)],[P3[0]+K*rb*Math.sin(b),P3[1]-K*rb*Math.cos(b)],P3]);
    }
    return cur;
  }
  /* 7. SPY ESPIONAGE — Subterranean Escape Lane + S-shaped Hidden Gadget Escape Route, big inner orbit loop with
     "Lane Guides" band, A-G-E-N-T lanes over 3 pop bumpers, wire ramp spiral, Safehouse holes, C-I-A / S-P-Y banks */
  function spy(){
    const t=make('spy','SPY ESPIONAGE',{g:930,music:{root:48,tempo:132,scale:[0,3,5,6,7,10],wave:'square'},theme:{bg1:'#06182e',bg2:'#0a2b4a',rail:'#a8c8e6',glow:'#38d6ff',glow2:'#ff3b5c',cap:'#ff3b5c',lamp:'#fff25a',ramp:'#6fd3ff'},labels:{drop:'C-I-A / S-P-Y',stand:'BULLSEYE',saucer:'SAFEHOUSE',ramp:'WIRE RAMP',bump:'LASER'}});
    const W=(pts,n,e)=>t.poly(sm(pts,n),{e:e!=null?e:.3});
    const wp=(pts)=>t.poly(pts,{e:.3});
    // ---- shell: right arch (base geometry) + plunger lane (kept exactly as base) ----
    t.arc(300,300,280,-PI/2,0,56);
    t.wall(580,300,580,1000);
    t.wall(545,965,545,235);
    t.wall(545,164,545,235,{oneWay:true,nx:-1,ny:0,vis:false});
    t.plungerSeg=t.wall(545,965,580,965,{vis:false});
    // roof of the closed pocket between the right lane and the plunger wall (slopes into the lane)
    t.wall(545,235,509,258);
    // ---- LEFT: Subterranean Escape Lane + Hidden Gadget Escape Route (S shape); its outer wall is the playfield wall ----
    const Oart=[[330,38],[250,45],[180,62],[120,85],[88,100],[65,125],[45,150],[25,200],[15,255],[15,300],[28,350],[43,400],[58,450],[72,500],[87,550],[102,600],[107,650],[85,700],[46,750],[25,800],[17,850],[17,900],[23,950],[42,1000]];
    W([[300,20],[250,21],...Oart.map(p=>A(...p)),[52,615],[57,650],[56,700],[56,770]],5);
    // inner wall of the lane: top inner wall (ends at the hidden-tunnel portal), corner, then down the left of the field
    const Iart=[[250,118],[200,132],[154,150],[125,185],[110,225],[98,262],[96,300],[108,350],[122,400],[137,450],[151,500],[167,550],[180,600],[182,650],[171,700]];
    W([[400,75],[370,67],[335,61],[300,58],[250,59],[215,61],[182,64],...Iart.map(p=>A(...p)),[113,440],[116,471]],5);
    
    // lower end of the lane (above the left inlane) after the C-I-A bank
    wp([[107,590.5],[101,625],[95,650],[92,662]]);
    // C-I-A 3-bank (mounted on the lane's inner wall, face toward the field)
    t.bank(124.2,471.5,115,591.1,3,'cia',{back:8});
    // ---- RIGHT: lane from the top junction down to the right inlane ----
    t.wall(509,258,509,770);
    // inner wall: U hook (Safehouse U) -> right lane -> ring corner -> long "Lane Guides" band upper wall
    W([[392,152],[394,132],[406,117],[425,111],[447,116],[466,135],[474,165],[474,230],[474,300],[474,370]],4);
    // long "Lane Guides" band upper wall = bowl floor; its right end opens into the right lane (bowl drains there)
    wp([[474,450],[452,443],[398,423],[344,403],[290,383],[236,363],[206,352]]);
    // band lower wall (the field ceiling) from the entrance gap to the S-P-Y bank
    wp([[182,384],[236,404],[290,424],[344,444],[385,458]]);
    // S-P-Y 4-bank (mounted on the lower-right wall, face toward the field)
    t.bank(447,483,452,610,4,'spy',{back:-8});
    t.wall(464,470,443,486); // sloped roof over the S-P-Y bank so nothing rests on its top
    wp([[460,610],[462,632],[466,652]]);
    // ---- inner island (satellite dish) — solid; its right edge continues into the bowl's lower wall with a drain gap ----
    const isl=[A(272,190),A(300,200),A(358,288),A(322,328),A(300,505),A(268,505),A(190,300),A(182,262)];
    t.poly(isl.concat([isl[0]]),{e:.35});
    t.structures.push({pts:isl,h:26,col:'#0e2e50',trim:'#38d6ff',label:'RADAR ISLAND'});
    t.poly([A(300,505),A(305,540)],{e:.3});
    
    // ---- A-G-E-N-T lanes: 3 finger dividers + 5 lanes, row of triangles below ----
    for(const x of [247,296.5,349.5]){
      t.post(x,118,11,{vis:false,e:.45});t.post(x,158,8,{vis:false,e:.45});
      t.wall(x-11,118,x-8,158,{e:.4,vis:false});t.wall(x+11,118,x+8,158,{e:.4,vis:false});
      (t.props=t.props||[]);
    }
    [[216,140],[272,140],[323,140],[377,140],[297,90]].forEach((p,i)=>t.rollover(p[0],p[1],'top',i,11));
    t.laneY=140;
    const triP=(p)=>{for(const[a,b]of[[p[0],p[1]],[p[1],p[2]],[p[2],p[0]]])t.wall(a[0],a[1],b[0],b[1],{kind:'rubber',e:.78,mu:.02,vis:false});(t.rubbers=t.rubbers||[]).push({p,col:'#ff3b5c',label:'B'});};
    const tri=(x,y,hw,h)=>triP([[x,y],[x-hw,y+h],[x+hw,y+h]]);
    for(const x of [232,274,317,359]) tri(x,182,8,16);
    // ---- 3 pop bumpers (Laser, Decoder, Radar) ----
    t.bumper(252,250,23);t.bumper(342,250,23);t.bumper(289,331,23);
    // ---- SAFEHOUSE EJECT HOLES ----
    t.saucer(447,203,{kicker:true,r:13,hold:.6,ejectAng:2.2,ejectSpeed:700,spread:.4});
    t.saucer(172,433,{kicker:true,r:13,hold:.6,ejectAng:-2.1,ejectSpeed:1000,spread:.1});
    // ---- mid-field: bullseye triangles, enemy radar target, flanking triangles, spinner ----
    const bull=(pts)=>{for(let i=0;i<3;i++){const a=pts[i],b=pts[(i+1)%3];t.wall(a[0],a[1],b[0],b[1],{kind:'stand',group:'bull',e:.4,vis:false});}};
    const eq=(cx,cy,ang,r)=>[0,1,2].map(i=>{const a=ang+i*2*PI/3;return[cx+r*Math.cos(a),cy+r*Math.sin(a)];});
    bull(eq(322,478,PI/2+.5,15));bull(eq(364,502,PI/2-.6,15));
    const rc=[274,546],rr=12;for(let i=0;i<8;i++){const a=i*PI/4+PI/8,b=a+PI/4;t.wall(rc[0]+rr*Math.cos(a),rc[1]+rr*Math.sin(a),rc[0]+rr*Math.cos(b),rc[1]+rr*Math.sin(b),{kind:'stand',group:'radar',e:.45,vis:false});}
    tri(247,570,10,20);tri(301,567,10,20);
    t.spinner(254,626,294,626);t.post(254,626,4,{vis:false});t.post(294,626,4,{vis:false});
    t.rollover(193,656,'mid',0);t.rollover(356,656,'mid',1);
    // ---- base lower part (copied from base(): slings, inlanes, flippers) — outlanes are sealed as in the drawing ----
    for(const side of [1,-1]){
      const m=side>0?(x)=>x:MX;
      t.wall(m(56),770,m(56),830);t.post(m(56),770,3);
      t.wall(m(56),830,m(197),876);
      t.sling([m(86),700],[m(86),790],[m(150),822]);
      t.rollover(m(71),745,'in',side>0?0:1,9);
    }
    t.flipper(195,885,1,78);t.flipper(370,885,-1,78);
    t.status={mb:[{x:252,y:748},{x:282,y:748},{x:312,y:748}],mult:[{x:237,y:786},{x:267,y:786},{x:297,y:786},{x:327,y:786}],saver:{x:282,y:828}};
    // ---- WIRE RAMP "Divisible Infiltration": starts in the right lane, spirals in over the drawn circles, delivers the
    //      ball over the bowl to the "hidden gadget lane" mouth at the left, dropping toward the entrance gap ----
    const cx=436,cy=343;
    const curves=[[[491,232],[495,275],[498,310],[498,343]]].concat(spiral(cx,cy,62,22,0,8));
    const last=curves[curves.length-1][3];
    curves.push([last,[last[0],last[1]+38],[280,385],[137,330]]);
    track(t,{label:'WIRE RAMP',height:104,color:'#38d6ff',material:'neon',width:26,dur:2.9,arches:[.2,.4,.6,.8],exit:{vx:0,vy:560},curves});
    t.shotArrows=[
      {x:137,y:430,ang:-1.57,col:'#f6d27a',label:'GADGET ORBIT',kind:'ramp'},
      {x:491,y:205,ang:1.57,col:'#38d6ff',label:'WIRE RAMP',kind:'ramp'},
      {x:172,y:478,ang:-1.57,col:'#38d6ff',label:'SAFEHOUSE',kind:'saucer'},
      {x:274,y:520,ang:0,col:'#ff3b5c',label:'ENEMY RADAR',kind:'saucer'}
    ];
    t.word='AGENT';t.mission='ירו במעלה הצד השמאלי אל מסלול הגאדג׳טים כדי להקיף את הלולאה, מלאו A-G-E-N-T במסלולי הראש, והפעילו את סליל החוטים בצד ימין. סיימו C-I-A ו-S-P-Y ופגעו במכ״ם האויב!';
    t.signature='מסלול S שמאלי · לולאת מסלולים פנימית · סליל חוטי · בנקי C-I-A ו-S-P-Y';t.bumperStyle='reactor';t.styleTag='SECRET AGENT 80s';t.cabinetStyle='neon';t.floorStyle='spy';return t;
  }
  (P.BP=P.BP||{}).spy=spy;
})(globalThis.Pin);
