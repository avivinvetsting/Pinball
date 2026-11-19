/* Real 3D presentation. Physics coordinates map to X/Z; Y is height above the wood. */
(function () {
  'use strict';
  const P = window.Pin, T = window.THREE;
  if (!T) return;
  const palettes = {
    neon: ['#f1dfb1', '#163e47', '#ca4939', '#e9b556'],
    pirate: ['#184f59', '#0b2f3b', '#43c9c3', '#e4b966'],
    space: ['#222e57', '#111c36', '#51d8ec', '#eb829c'],
    haunted: ['#3b3654', '#252237', '#a8cd78', '#df9a67'],
    volcano: ['#713d37', '#292f35', '#ff8553', '#e4c879'],
  };
  let renderer, scene, camera, root, table, dynamics = [], balls = new Map(), materials, environment, backbox, glowMap, sparkMesh;
  let view = 0, sizeKey = '', unavailable = false, hudKey = '', scoreMap, scoreCanvas;
  const stage = document.getElementById('stage3d');
  const V = P.View3D = { active: false, palettes };
  function init() {
    if (renderer) return true;
    if (unavailable) return false;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = T.SRGBColorSpace;
      stage.appendChild(renderer.domElement);
      renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); unavailable = true; V.active = false; document.body.classList.remove('three-active'); document.getElementById('renderStatus').textContent = 'תצוגה קלאסית · 2D'; });
      // A procedural studio environment supplies real reflections without external images.
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
      const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, '#e5f1f7'); g.addColorStop(.45, '#9aabb2'); g.addColorStop(.52, '#27303a'); g.addColorStop(1, '#706453');
      x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
      x.fillStyle = '#ffffff'; x.fillRect(70, 85, 160, 240); x.fillRect(650, 60, 95, 290);
      x.fillStyle = '#f6d9a4'; x.fillRect(390, 150, 120, 85);
      const tex = new T.CanvasTexture(c); tex.mapping = T.EquirectangularReflectionMapping; tex.colorSpace = T.SRGBColorSpace;
      const pm = new T.PMREMGenerator(renderer); environment = pm.fromEquirectangular(tex); tex.dispose(); pm.dispose();
      const halo = document.createElement('canvas'); halo.width = halo.height = 128;
      const hx = halo.getContext('2d'), hg = hx.createRadialGradient(64,64,3,64,64,64);
      hg.addColorStop(0,'#ffffffbb'); hg.addColorStop(.23,'#ffffff44'); hg.addColorStop(1,'#ffffff00'); hx.fillStyle=hg; hx.fillRect(0,0,128,128); glowMap = texture(halo);
      V.active = true; return true;
    } catch (err) { unavailable = true; console.warn('3D unavailable; using Canvas renderer.', err.message); return false; }
  }
  function mat(color, metal = 0, roughness = .3, extra = {}) { return new T.MeshStandardMaterial({ color, metalness: metal, roughness, ...extra }); }
  function mesh(geo, material, x = 0, y = 0, z = 0, parent = root) {
    const m = new T.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(w, h, d, material, x, y, z, parent) { return mesh(new T.BoxGeometry(w, h, d), material, x, y, z, parent); }
  function cylinder(r, h, material, x, y, z, parent) { return mesh(new T.CylinderGeometry(r, r, h, 32), material, x, y, z, parent); }
  function torus(r, tube, material, x, y, z, parent) { const m = mesh(new T.TorusGeometry(r, tube, 8, 40), material, x, y, z, parent); m.rotation.x = Math.PI / 2; return m; }
  function rail(a, b, radius, material, parent = root) {
    const av = new T.Vector3(...a), bv = new T.Vector3(...b), d = bv.clone().sub(av);
    const m = mesh(new T.CylinderGeometry(radius, radius, d.length(), 8), material, ...av.clone().add(bv).multiplyScalar(.5).toArray(), parent);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
  }
  function texture(c) { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }
  function label(text, w, h, bg, fg, font = 28) {
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
    const x = c.getContext('2d'); x.scale(2, 2); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 ${font}px Georgia`; x.fillText(text, w / 2, h / 2, w - 14); return c;
  }
  function flat(c, w, h, x, z, y = .6, parent = root) { const m = mesh(new T.PlaneGeometry(w, h), mat('#ffffff', 0, .43, { map: texture(c) }), x, y, z, parent); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; }
  function glow(x,z,y,color,size,intensity=.7) {
    const m=mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map:glowMap,color,transparent:true,opacity:intensity,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}),x,y,z);
    m.rotation.x=-Math.PI/2; m.castShadow=m.receiveShadow=false; return m;
  }
  function capArt(tb,th){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.translate(128,128);
    const st=tb.bumperStyle||tb.id;
    x.fillStyle=st==='reactor'?'#091428':st==='clock'?'#1f182c':st==='lava'?'#24110c':'#fff3d1';
    x.beginPath();x.arc(0,0,124,0,Math.PI*2);x.fill();
    const n=st==='reactor'?12:st==='compass'?8:st==='clock'?12:st==='lava'?16:20;
    for(let i=0;i<n;i++){
      x.save();x.rotate(i*Math.PI*2/n);
      x.fillStyle=i%2?th.plastic:th.plastic2;
      x.beginPath();
      if(st==='compass'){x.moveTo(0,-120);x.lineTo(i%2?12:22,-48);x.lineTo(0,-20);x.lineTo(i%2?-12:-22,-48);}
      else if(st==='reactor'){x.arc(0,-92,10,0,Math.PI*2);}
      else{x.moveTo(0,-119);x.lineTo(17,-58);x.lineTo(-17,-58);}
      x.closePath();x.fill();x.restore();
    }
    x.strokeStyle=st==='reactor'||st==='lava'?th.plastic2:th.cab2;x.lineWidth=4;x.beginPath();x.arc(0,0,66,0,Math.PI*2);x.stroke();
    x.fillStyle=st==='reactor'||st==='clock'||st==='lava'?'#fff6df':th.cab2;
    x.textAlign='center';x.textBaseline='middle';x.font='bold 46px Georgia';
    x.fillText(({neon:'100',pirate:'✦',space:'ION',haunted:'XII',volcano:'HOT',quest:'⚔',spy:'007',frenzy:'80s'})[tb.id]||'100',0,0);
    if(st==='clock'||tb.id==='haunted'){x.strokeStyle='#65ff90';x.lineWidth=5;x.beginPath();x.moveTo(0,-42);x.lineTo(0,5);x.lineTo(29,25);x.stroke();}
    return c;
  }
  function arrowInsertTex(col, text) {
    const c = document.createElement('canvas'); c.width = 160; c.height = 190;
    const x = c.getContext('2d');
    x.translate(80, 74);
    x.fillStyle = col;
    x.strokeStyle = '#ffffff';
    x.lineWidth = 4;
    // Double arcade chevron pointing UP (-Y in canvas = -Z on playfield)
    for (const dy of [-18, 12]) {
      x.beginPath();
      x.moveTo(0, dy - 26);
      x.lineTo(36, dy + 4);
      x.lineTo(22, dy + 14);
      x.lineTo(0, dy - 6);
      x.lineTo(-22, dy + 14);
      x.lineTo(-36, dy + 4);
      x.closePath();
      x.fill();
      x.stroke();
    }
    if (text) {
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = 'rgba(7,10,22,0.88)';
      x.strokeStyle = col;
      x.lineWidth = 3;
      x.beginPath();
      x.roundRect(8, 134, 144, 42, 10);
      x.fill();
      x.stroke();
      x.fillStyle = '#ffffff';
      x.font = '900 20px Verdana';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(text, 80, 155, 132);
    }
    return c;
  }
  function shapePlate(points,height,depth,material){const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(p[0]-300,-(p[1]-500)):s.moveTo(p[0]-300,-(p[1]-500)));s.closePath();const m=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:2,bevelThickness:1,bevelSegments:2}),material);m.rotation.x=-Math.PI/2;m.position.y=height;return m;}
  function buildProps(tb,th){
    for(const p of tb.props||[]){const x=p.x-300,z=p.y-500;
      if(p.kind==='vinyl'){
        const r=p.r||34, g=new T.Group(); g.position.set(x,1.5,z); root.add(g);
        const rim=cylinder(r+2.5,.8,materials.gold,0,0,0,g); rim.castShadow=false;
        const discMat=mat('#121017',.35,.18);
        const disc=cylinder(r,1.1,discMat,0,.3,0,g); disc.castShadow=false;
        for(const gr of [r*.84,r*.68,r*.52]){const tr=torus(gr,.45,materials.gold,0,1.0,0,g);tr.castShadow=false;}
        const lbl=cylinder(r*.35,1.3,mat('#d63463',.15,.3,{emissive:'#d63463',emissiveIntensity:.35}),0,.4,0,g); lbl.castShadow=false;
        const bar=box(r*1.75,.4,2.2,materials.gold,0,1.1,0,g); bar.castShadow=false;
        const pin=cylinder(3,2.6,materials.chrome,0,1.2,0,g); pin.castShadow=false;
        // Brass gramophone tonearm beside the spinning vinyl
        cylinder(5,4,materials.gold,x+r+9,2,z-r*.45);
        rail([x+r+9,4,z-r*.45],[x+r*.38,3.2,z+r*.18],1.4,materials.gold);
        glow(x,z,1.2,'#ffbf47',r*2.6,.55);
        dynamics.push({type:'propVinyl',mesh:g});
      }else if(p.kind==='ship'){
        const wood=mat('#6a3115',0,.58),deck=mat('#b8813f',0,.64),sail=mat('#eee0b5',0,.8,{side:T.DoubleSide});
        shapePlate([[108,140],[174,140],[197,325],[145,368],[96,322]],0,43,wood);
        shapePlate([[113,146],[170,146],[190,320],[145,356],[103,316]],44,4,deck);
        for(let yy=160;yy<337;yy+=15)rail([-190,49,yy-500],[-129,49,yy-500],.8,materials.dark);
        box(46,32,45,wood,x,64,z-55);box(54,5,50,deck,x,83,z-55);
        cylinder(3,205,materials.gold,x+30,105,z+10);rail([x-20,191,z+10],[x+65,191,z+10],2,materials.wood);
        const sm=mesh(new T.PlaneGeometry(82,61,10,8),sail,x+22,160,z+10);const a=sm.geometry.attributes.position;
        for(let i=0;i<a.count;i++)a.setZ(i,Math.sin((a.getX(i)+41)/82*Math.PI)*12);a.needsUpdate=true;sm.geometry.computeVertexNormals();
        const flag=mesh(new T.PlaneGeometry(28,18),mat('#15171a',0,.8,{side:T.DoubleSide}),x+44,211,z+10);
        for(const yy of [218,265,305]){rail([-200,25,yy-500],[-181,25,yy-500],6,materials.dark);cylinder(6,2,materials.gold,-196,31,yy-500);}
        for(const side of [-1,1]){const xx=x+side*35;rail([xx,54,-347],[xx,54,-180],2,materials.gold);}
        dynamics.push({type:'propShip',mesh:sm,flag,baseX:x+44});
      }else if(p.kind==='tower'){
        const stone=mat('#4b454e',.08,.82),roof=mat('#39233e',.3,.38),windowMat=mat('#99e895',0,.3,{emissive:'#50d768',emissiveIntensity:.85});
        box(82,96,153,stone,x,48,z-1);box(67,46,85,stone,x,119,z-14);
        const roofMesh=mesh(new T.ConeGeometry(56,61,4),roof,x,170,z-14);roofMesh.rotation.y=Math.PI/4;
        for(const side of [-1,1])for(const dz of [-52,-12,30])box(3,26,12,windowMat,x+side*42,57,z+dz);
        for(const dx of [-22,22])box(15,28,3,windowMat,x+dx,120,z+30);
        const clock=label('XII · III · VI',53,45,'#ede1b0','#292536',10);const face=mesh(new T.PlaneGeometry(53,45),mat('#fff',0,.5,{map:texture(clock)}),x,120,z+30);face.castShadow=false;
        rail([x,107,z+32],[x,131,z+32],1.5,materials.dark);
        const handGroup=new T.Group(); handGroup.position.set(x,119,z+32.5); root.add(handGroup);
        rail([0,0,0],[16,0,0],1.6,materials.gold,handGroup);
        cylinder(2,23,materials.gold,x,211,z-14);torus(7,1.5,materials.gold,x,222,z-14);
        glow(x,z+65,2,'#7cffa4',100,.8);
        dynamics.push({type:'propTower',mesh:handGroup,material:windowMat});
      }else if(p.kind==='volcano'){
        const rock=mat('#332c29',.05,.94),lava=mat('#ff5a0a',.05,.4,{emissive:'#ff4100',emissiveIntensity:1.5});
        const cone=mesh(new T.CylinderGeometry(24,67,88,13,4,true),rock,x,44,z);const pos=cone.geometry.attributes.position;
        for(let i=0;i<pos.count;i++){const k=1+.045*Math.sin(i*7.3);pos.setX(i,pos.getX(i)*k);pos.setZ(i,pos.getZ(i)*k);}pos.needsUpdate=true;cone.geometry.computeVertexNormals();
        cylinder(23,3,materials.dark,x,85,z);torus(24,4,lava,x,89,z);
        const craterHalo=glow(x,z,91,'#ff5c09',92,.78);
        for(const a of [-2.3,-.9,.6,2]){const pts=[];for(let i=0;i<=12;i++){const v=i/12,r=25+v*40,aa=a+Math.sin(v*8)*.08;pts.push(new T.Vector3(x+Math.cos(aa)*r,88*(1-v)+3,z+Math.sin(aa)*r));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,2.6,6,false),lava);}
        dynamics.push({type:'propVolcano',material:lava,mesh:craterHalo});
      }else if(p.kind==='castle'){
        // twin crenellated gate towers joined by a gold gate arch (balls pass under the arch)
        const stone=mat('#5a5068',.1,.8),glowWin=mat('#ffd86a',0,.3,{emissive:'#ffb43a',emissiveIntensity:1});
        for(const sx of [-33,33]){
          cylinder(16,52,stone,x+sx,26,z);
          for(let i=0;i<6;i++){const a=i/6*Math.PI*2;box(6,8,6,stone,x+sx+Math.cos(a)*13,56,z+Math.sin(a)*13);}
          mesh(new T.ConeGeometry(15,22,8),mat('#7a1f26',.2,.5),x+sx,66,z);
          box(5,10,2,glowWin,x+sx,34,z+16);
        }
        mesh(new T.TorusGeometry(33,3.5,10,28,Math.PI),materials.gold,x,26,z);
        glow(x,z,2,'#ffb43a',92,.55);
      }else if(p.kind==='radar'){
        const g=new T.Group();g.position.set(x,0,z);root.add(g);
        const m=mat('#38d6ff',.5,.2,{emissive:'#1aa6d8',emissiveIntensity:.9});
        cylinder(12,10,materials.chrome,0,5,0,g);cylinder(3,22,materials.chrome,0,18,0,g);
        const dish=mesh(new T.ConeGeometry(22,12,24,1,true),m,0,34,0,g);dish.rotation.x=Math.PI*.85;dish.material.side=T.DoubleSide;
        cylinder(2,12,materials.gold,0,36,-8,g).rotation.x=Math.PI/2.4;
        glow(x,z,2,'#38d6ff',80,.6);
        dynamics.push({type:'propRadar',mesh:g});
      }else if(p.kind==='reactor'){
        const m=mat('#00f2ff',.4,.18,{emissive:'#00d8ff',emissiveIntensity:1.2});
        const m2=mat('#ff2a9d',.4,.18,{emissive:'#ff2a9d',emissiveIntensity:1.1});
        torus(28,4,materials.chrome,x,8,z);
        const ring1=torus(23,3,m,x,22,z);
        const ring2=torus(17,2.4,m2,x,26,z);
        const core=mesh(new T.SphereGeometry(9,20,16),m,x,22,z);
        for(const a of [0,Math.PI*.66,Math.PI*1.33])cylinder(3,24,materials.chrome,x+Math.cos(a)*28,12,z+Math.sin(a)*28);
        glow(x,z,3,'#00f2ff',85,.75);
        dynamics.push({type:'propReactor',mesh:ring1,ring2,core,material:m});
      }
    }
    // Custom 3D architectural walls, VIP balconies, hexagonal cyber wings & gothic buttresses
    for (const st of tb.structures || []) {
      const h = st.h || 34;
      const wallMat = mat(st.col || '#241830', .22, .42);
      const trimMat = mat(st.trim || '#ffd24a', .55, .2, { emissive: st.trim || '#ffd24a', emissiveIntensity: .55 });
      shapePlate(st.pts, 0, h, wallMat);
      const topPlate = shapePlate(st.pts, h + 0.5, 3.5, trimMat); topPlate.castShadow = false;
      for (const pt of st.pts) cylinder(4.5, h + 6, trimMat, pt[0] - 300, (h + 6) / 2, pt[1] - 500);
      if (st.label) {
        const cx = st.pts.reduce((s, p) => s + p[0], 0) / st.pts.length;
        const cz = st.pts.reduce((s, p) => s + p[1], 0) / st.pts.length;
        flat(label(st.label, 92, 18, '#080c1c', st.trim || '#ffd24a', 9), 92, 18, cx - 300, cz - 500, h + 5.5);
      }
    }
    // 3D Surprise Underground Tunnels / Subways (Entrance Hoods, Glowing Subway Floor Windows & Exit Turrets)
    for (const tn of tb.tunnels || []) {
      const x1 = tn.x1 - 300, z1 = tn.y1 - 500, x2 = tn.x2 - 300, z2 = tn.y2 - 500;
      const tMat = mat(tn.col, .45, .2, { emissive: tn.col, emissiveIntensity: 1.1 });
      const hoodMat = mat('#141829', .35, .35);
      // Entrance 3D Archway / Tunnel Hood
      for (const d of [0, -10, -20]) {
        const arch = mesh(new T.TorusGeometry(20 - d * .15, 3.6, 10, 26, Math.PI), d === 0 ? tMat : hoodMat, x1, 4, z1 + d);
        arch.castShadow = true;
      }
      cylinder(17, 2, mat('#04060e', 0, .9), x1, 1.2, z1);
      glow(x1, z1, 2.2, tn.col, 68, .85);
      flat(label(tn.label || 'TUNNEL', 108, 20, '#070a18', tn.col, 9), 108, 20, x1, z1 - 24, 30);

      // Style-specific 3D Entrance & Exit Toy Sculptures
      if (tn.style === 'horn') {
        // Giant 3D Golden Saxophone / Gramophone Horn at the exit!
        const hornG = new T.Group(); hornG.position.set(x2, 26, z2); hornG.rotation.y = -0.65; root.add(hornG);
        const cone = mesh(new T.ConeGeometry(28, 54, 24, 1, true), materials.gold, 0, 0, 0, hornG);
        cone.rotation.x = Math.PI / 2.2;
        const rim = mesh(new T.TorusGeometry(28, 3.5, 10, 28), tMat, 0, -4, 24, hornG);
        cylinder(9, 32, materials.gold, 0, -10, -18, hornG);
        glow(x2, z2, 3, tn.col, 78, .85);
      } else if (tn.style === 'whirlpool') {
        const vRing = torus(24, 2.6, tMat, x1, 6, z1);
        dynamics.push({ type: 'tunnelVortex', mesh: vRing });
        // 3D Ship Bow Cannon at the exit!
        const canG = new T.Group(); canG.position.set(x2, 24, z2); canG.rotation.y = -0.6; root.add(canG);
        const barrel = cylinder(9, 40, materials.dark, 0, 4, 8, canG); barrel.rotation.x = Math.PI / 2.3;
        const muzzle = torus(9.5, 2.2, materials.gold, 0, 1, 25, canG); muzzle.rotation.x = 0;
        glow(x2, z2, 3, tn.col, 68, .8);
      } else if (tn.style === 'wormhole') {
        const qRing = torus(24, 2.8, tMat, x1, 12, z1);
        dynamics.push({ type: 'tunnelVortex', mesh: qRing });
      } else if (tn.style === 'coffin') {
        // 3D Stone Sarcophagus / Coffin Walls around entrance and Altar Arch at exit
        box(8, 22, 42, hoodMat, x1 - 19, 11, z1 - 6);
        box(8, 22, 42, hoodMat, x1 + 19, 11, z1 - 6);
        const exitArch = mesh(new T.TorusGeometry(20, 3.5, 10, 24, Math.PI), tMat, x2, 5, z2);
        exitArch.castShadow = true;
      } else if (tn.style === 'lavaCave') {
        const exitVent = torus(20, 3.5, tMat, x2, 8, z2);
        dynamics.push({ type: 'tunnelVortex', mesh: exitVent });
      }
      flat(label((tn.exitLabel || 'EXIT') + ' ⚡', 96, 19, '#070a18', tn.col, 9), 96, 19, x2, z2 - 22, 24);

      // Subterranean Glowing Subway Track Windows connecting (x1,z1) -> (x2,z2)
      for (let i = 1; i <= 7; i++) {
        const f = i / 8, lx = x1 + (x2 - x1) * f, lz = z1 + (z2 - z1) * f;
        const nMat = mat(tn.col, .2, .2, { emissive: tn.col, emissiveIntensity: .4 });
        cylinder(6.5, 1.2, materials.chrome, lx, 0.8, lz);
        const win = cylinder(5, 1.6, nMat, lx, 1.3, lz); win.castShadow = false;
        const h = glow(lx, lz, 2.0, tn.col, 32, .35);
        dynamics.push({ type: 'tunnelNode', saucer: tn.saucer, material: nMat, mesh: win, halo: h, idx: i });
      }
    }
    // 3D Moving Bash Toys (Patrolling Jazz Spotlight, Writhing Kraken Tentacle, Glowing Phantom Ghost)
    for (const mv of tb.movers || []) {
      const g = new T.Group(); g.position.set(mv.x - 300, 2, mv.y - 500); root.add(g);
      const col = tb.id === 'pirate' ? '#35e8dc' : tb.id === 'haunted' ? '#65ff90' : tb.id === 'spy' ? '#38d6ff' : tb.id === 'quest' ? '#ff5a3a' : '#ffd24a';
      const glowMat = mat(col, .3, .2, { emissive: col, emissiveIntensity: 1.1 });
      if (mv.style === 'tentacle' || tb.id === 'pirate') {
        const tMat = mat('#9d3be0', .15, .35, { emissive: '#59188a', emissiveIntensity: .6 });
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const v = i / 10;
          pts.push(new T.Vector3(Math.sin(v * Math.PI * 2) * 7, v * 52, Math.cos(v * Math.PI * 1.5) * 6));
        }
        mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 6.5, 8, false), tMat, 0, 0, 0, g);
        torus(mv.r + 3, 2.5, glowMat, 0, 2, 0, g);
      } else if (mv.style === 'ghost' || tb.id === 'haunted') {
        const gMat = mat('#d8ffe4', .1, .2, { emissive: '#65ff90', emissiveIntensity: .95, transparent: true, opacity: .88 });
        mesh(new T.ConeGeometry(mv.r, 34, 16), gMat, 0, 18, 0, g);
        mesh(new T.SphereGeometry(mv.r * .72, 16, 12), gMat, 0, 34, 0, g);
        torus(mv.r + 2, 2, glowMat, 0, 2, 0, g);
      } else if (mv.style === 'radar') {
        cylinder(mv.r + 2, 6, materials.chrome, 0, 3, 0, g);
        const dish = mesh(new T.ConeGeometry(mv.r, 12, 20, 1, true), glowMat, 0, 16, 0, g); dish.rotation.x = Math.PI * .8; dish.material.side = T.DoubleSide;
        cylinder(2, 12, materials.gold, 0, 9, 0, g);
      } else if (mv.style === 'dragon') {
        cylinder(mv.r + 2, 8, materials.dark, 0, 4, 0, g);
        mesh(new T.SphereGeometry(mv.r * .8, 16, 12), glowMat, 0, 16, 0, g);
        for (const a of [0, 1, 2, 3, 4]) { const sp = mesh(new T.ConeGeometry(3, 12, 6), materials.gold, Math.cos(a * 1.26) * mv.r * .75, 28, Math.sin(a * 1.26) * mv.r * .75, g); }
      } else {
        cylinder(mv.r + 2, 8, materials.gold, 0, 4, 0, g);
        cylinder(mv.r * .75, 18, glowMat, 0, 14, 0, g);
        torus(mv.r, 2.5, materials.chrome, 0, 10, 0, g);
      }
      const mHalo = glow(mv.x - 300, mv.y - 500, 1.8, col, mv.r * 3.8, .65);
      dynamics.push({ type: 'mover', ref: mv, mesh: g, halo: mHalo, material: glowMat });
    }
    // 3D Gravity Magnets & Hyper-Booster Pads
    for (const mg of tb.magnets || []) {
      const mx = mg.x - 300, mz = mg.y - 500;
      const mgGroup = new T.Group(); mgGroup.position.set(mx, 1.6, mz); root.add(mgGroup);
      const mgMat = mat('#ff2a9d', .3, .2, { emissive: '#ff2a9d', emissiveIntensity: .6 });
      for (const rr of [18, 34, 52]) { const tr = torus(rr, 1.8, mgMat, 0, 0, 0, mgGroup); tr.castShadow = false; }
      const mgHalo = glow(mx, mz, 1.4, '#ff2a9d', mg.r * 1.8, .35);
      dynamics.push({ type: 'magnet', ref: mg, mesh: mgGroup, halo: mgHalo, material: mgMat });
    }
    for (const bs of tb.boosts || []) {
      const bx = bs.x + bs.w / 2 - 300, bz = bs.y + bs.h / 2 - 500;
      const bCol = tb.id === 'volcano' ? '#ff6a1a' : '#00f2ff';
      const tex = texture(arrowInsertTex(bCol, 'BOOST'));
      const bMat = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: .85, depthWrite: false, toneMapped: false });
      const bm = mesh(new T.PlaneGeometry(bs.w, bs.h), bMat, bx, 1.7, bz);
      bm.rotation.x = -Math.PI / 2; bm.castShadow = bm.receiveShadow = false;
      const bHalo = glow(bx, bz, 1.3, bCol, bs.w * 2.1, .5);
      dynamics.push({ type: 'boost', ref: bs, mesh: bm, halo: bHalo });
    }
  }
  function disposeScene() {
    if (!scene) return;
    const gs = new Set(), ms = new Set(), ts = new Set();
    scene.traverse(o => { if (o.geometry) gs.add(o.geometry); if (o.material) for (const m of [].concat(o.material)) { ms.add(m); if (m.map) ts.add(m.map); } if (o.shadow) o.shadow.dispose(); });
    gs.forEach(g => g.dispose()); ms.forEach(m => m.dispose()); ts.forEach(t => { if(t!==glowMap)t.dispose(); });
    balls.clear(); dynamics = [];
  }
  // Batch fixed hardware by material; animated parts retain their individual transforms.
  function batchHardware() {
    const moving = new Set(), movingMats = new Set(), groups = new Map();
    for (const d of dynamics) {
      if (d.mesh) moving.add(d.mesh);
      if (d.halo) moving.add(d.halo);
      if (d.flag) moving.add(d.flag);
      if (d.ring2) moving.add(d.ring2);
      if (d.core) moving.add(d.core);
      if (d.material) movingMats.add(d.material);
    }
    for(const o of [...root.children]) {
      if(!o.isMesh||moving.has(o)||movingMats.has(o.material)||o.material.transparent||Array.isArray(o.material))continue;
      const key=o.material.uuid+'/'+o.castShadow+'/'+o.receiveShadow;
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
    }
    for(const list of groups.values()) {
      if(list.length<3)continue;
      const chunks=list.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);return g;});
      const geometry=new T.BufferGeometry();
      for(const name of ['position','normal','uv']) {
        if(chunks.some(g=>!g.attributes[name]))continue;
        const size=chunks[0].attributes[name].itemSize, length=chunks.reduce((sum,g)=>sum+g.attributes[name].array.length,0),data=new Float32Array(length);let offset=0;
        for(const g of chunks){data.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}
        geometry.setAttribute(name,new T.BufferAttribute(data,size));
      }
      const combined=mesh(geometry,list[0].material);combined.castShadow=list[0].castShadow;combined.receiveShadow=list[0].receiveShadow;
      list.forEach(o=>{root.remove(o);o.geometry.dispose();});chunks.forEach(g=>g.dispose());
    }
  }
  const CABINET_STYLES = {
    neon: { wood: '#48182b', rail: '#e9c168', railMetal: .92, railRough: .16, dark: '#1e1019', light: '#ffcf70' },
    pirate: { wood: '#182b34', rail: '#d4a658', railMetal: .88, railRough: .22, dark: '#0d1a22', light: '#35e8dc' },
    space: { wood: '#0c142c', rail: '#c8ecff', railMetal: .97, railRough: .10, dark: '#070b1a', light: '#00f2ff' },
    haunted: { wood: '#1f182c', rail: '#8e96aa', railMetal: .86, railRough: .26, dark: '#110d19', light: '#65ff90' },
    volcano: { wood: '#221715', rail: '#e59a48', railMetal: .88, railRough: .20, dark: '#120b0a', light: '#ff661a' },
    quest: { wood: '#241a38', rail: '#c9a35a', railMetal: .9, railRough: .24, dark: '#0f0a1a', light: '#e8b84a' },
    spy: { wood: '#0c1a2c', rail: '#a8c8e6', railMetal: .95, railRough: .12, dark: '#050c16', light: '#38d6ff' },
    frenzy: { wood: '#2a0f4a', rail: '#9ad7ff', railMetal: .95, railRough: .10, dark: '#10051f', light: '#ff2bd6' },
  };
  function build(tb) {
    disposeScene(); table = tb; scene = new T.Scene(); scene.environment = environment.texture; root = new T.Group(); scene.add(root);
    const original = P.Render.theme(tb);
    const cab = CABINET_STYLES[tb.id] || CABINET_STYLES.neon;
    const ink = cab.wood || original.cab2, accent = original.plastic, gold = original.plastic2;
    materials = {
      chrome: mat(cab.rail, cab.railMetal, cab.railRough),
      ball: mat('#ffffff', 1, .05, {envMapIntensity: 1.65}),
      rubber: mat('#f5ead4', 0, .72),
      dark: mat(cab.dark, .35, .28),
      wood: mat(ink, .08, .34),
      accent: new T.MeshPhysicalMaterial({color:accent,roughness:.22,clearcoat:1,clearcoatRoughness:.1}),
      gold: mat(gold, .78, .22)
    };
    scene.add(new T.HemisphereLight('#e9f4ff', '#6c5f45', .72));
    const sun = new T.DirectionalLight('#fff4dd', 2.1); sun.position.set(-360, 900, 250); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -700, right: 700, top: 850, bottom: -850, near: 1, far: 2200 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = 1; scene.add(sun);
    const fill = new T.DirectionalLight('#a9dfff', .52); fill.position.set(500, 350, -400); scene.add(fill);
    const playLight = new T.PointLight(cab.light, 1.35, 760); playLight.position.set(0, 170, -35); scene.add(playLight);
    dynamics.push({ type: 'playLight', light: playLight });
    box(630, 72, 1080, materials.wood, 0, -42, 5);
    const board = flat(P.Render.makeBG(tb, 2, true), 600, 1000, 0, 0);
    const boardMap=board.material.map; board.material.dispose(); board.material=new T.MeshPhysicalMaterial({map:boardMap,color:'#dcdcdc',roughness:.34,metalness:0,clearcoat:.62,clearcoatRoughness:.2});
    const floor = mesh(new T.PlaneGeometry(2500, 2500), new T.ShadowMaterial({ opacity: .19 }), 0, -95, 0, scene); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
    for (const x of [-309, 309]) { box(20, 45, 1070, materials.wood, x, 10, 0); box(10, 9, 1080, materials.chrome, x, 37, 0); for (let z = -480; z < 530; z += 125) cylinder(3.5, 1, materials.dark, x, 42, z); }
    const bulbMat = new T.MeshStandardMaterial({color:'#fff3cc',emissive:cab.light,emissiveIntensity:2.1,roughness:.2});
    for(const x of [-282,282]) for(let z=-370;z<460;z+=115) { cylinder(5,7,materials.chrome,x,5,z); const bulb=mesh(new T.SphereGeometry(4,12,8),bulbMat,x,10,z); bulb.castShadow=false; glow(x,z,2,cab.light,48,.75); }
    box(636, 24, 34, materials.chrome, 0, 10, 527); box(600, 9, 12, materials.gold, 0, -15, 545);
    for (const s of tb.segs) {
      if (s === tb.plungerSeg) continue;
      if (s.kind === 'drop' || s.kind === 'stand') {
        const m = box(s.l + 2, 24, 8, mat(accent, .2, .3, { emissive: accent, emissiveIntensity: .05 }), (s.x1 + s.x2) / 2 - 300, 13, (s.y1 + s.y2) / 2 - 500); m.rotation.y = -Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
        dynamics.push({ type: 'target', ref: s, mesh: m }); continue;
      }
      if (!s.vis && s.kind !== 'rubber') continue;
      const a = [s.x1 - 300, 11, s.y1 - 500], b = [s.x2 - 300, 11, s.y2 - 500];
      rail(a, b, s.kind === 'rubber' ? 4 : 3, s.kind === 'rubber' ? materials.rubber : materials.chrome);
      if (s.vis) { a[1] = b[1] = 4; rail(a, b, 2, materials.chrome); }
    }
    for (const c of tb.circles) {
      const x = c.x - 300, z = c.y - 500;
      if (c.kind === 'bumper') {
        cylinder(c.r + 3, 4, materials.chrome, x, 3, z); cylinder(c.r * .68, 19, materials.rubber, x, 13, z); torus(c.r - 2, 3.5, materials.gold, x, 8, z);
        const lit = new T.MeshPhysicalMaterial({color:accent,roughness:.18,clearcoat:1,clearcoatRoughness:.1,emissive:accent,emissiveIntensity:.25});
        cylinder(c.r, 8, lit, x, 29, z); torus(c.r - 1, 2.2, materials.chrome, x, 34, z);
        cylinder(c.r * .89, 3, materials.rubber, x, 35, z);
        const printed=mesh(new T.CircleGeometry(c.r*.89,40),mat('#ffffff',0,.32,{map:texture(capArt(tb,original))}),x,37,z);printed.rotation.x=-Math.PI/2;printed.castShadow=false;
        dynamics.push({ type: 'bumper', ref: c, material: lit });
        const halo=glow(x,z,1.7,accent,c.r*3.6,.55); dynamics.push({type:'halo',ref:c,mesh:halo});
      } else if (c.vis !== false) { cylinder(c.r, 13, materials.rubber, x, 8, z); torus(c.r, 2, materials.rubber, x, 7, z); cylinder(c.r * .6, 5, materials.accent, x, 17, z); cylinder(2, 1, materials.chrome, x, 20, z); }
    }
    for (const [slIndex,sl] of [...tb.slings, ...(tb.rubbers || [])].entries()) {
      const shape = new T.Shape(); sl.p.forEach((p, i) => i ? shape.lineTo(p[0] - 300, -(p[1] - 500)) : shape.moveTo(p[0] - 300, -(p[1] - 500))); shape.closePath();
      const m = mesh(new T.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: true, bevelSize: 2, bevelThickness: 1, bevelSegments: 2 }), mat(accent, .25, .22)); m.rotation.x = -Math.PI / 2; m.position.y = 18;
      if(P.Art&&P.Art[tb.id]){
        const c=document.createElement('canvas');c.width=256;c.height=384;const cx=c.getContext('2d'),im=P.Art[tb.id];
        const sourceX=slIndex%2?im.width*.68:0;cx.drawImage(im,sourceX,im.height*.42,im.width*.32,im.height*.44,0,0,256,384);
        cx.strokeStyle=gold;cx.lineWidth=10;cx.strokeRect(8,8,240,368);
        const geo=new T.ShapeGeometry(shape);geo.computeBoundingBox();const b=geo.boundingBox,pos=geo.attributes.position,uv=geo.attributes.uv;
        for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)-b.min.x)/(b.max.x-b.min.x),(pos.getY(i)-b.min.y)/(b.max.y-b.min.y));uv.needsUpdate=true;
        const top=mesh(geo,new T.MeshPhysicalMaterial({map:texture(c),roughness:.28,clearcoat:1,clearcoatRoughness:.12}),0,25.1,0);top.rotation.x=-Math.PI/2;top.castShadow=false;
      }
      for (let i = 0; i < 3; i++) { const a = sl.p[i], b = sl.p[(i + 1) % 3]; rail([a[0] - 300, 12, a[1] - 500], [b[0] - 300, 12, b[1] - 500], 3.5, materials.rubber); cylinder(4, 25, materials.chrome, a[0] - 300, 13, a[1] - 500); }
    }
    for (const s of tb.saucers) { cylinder(s.r, .5, materials.dark, s.x - 300, 1, s.y - 500); torus(s.r + 1, 3, materials.chrome, s.x - 300, 3, s.y - 500); glow(s.x - 300, s.y - 500, 1.5, gold, s.r * 3.8, .45); }
    for (const sp of tb.spinners) {
      rail([sp.x1 - 300, 27, sp.y1 - 500], [sp.x2 - 300, 27, sp.y2 - 500], 2, materials.chrome);
      const m = box(sp.len - 8, 21, 2.5, materials.gold, (sp.x1 + sp.x2) / 2 - 300, 27, (sp.y1 + sp.y2) / 2 - 500); dynamics.push({ type: 'spinner', ref: sp, mesh: m });
    }
    for (const f of tb.flippers) {
      const group = new T.Group(); group.position.set(f.x - 300, 9, f.y - 500); root.add(group);
      const shape = new T.Shape(); shape.absarc(0, 0, f.r0, Math.PI / 2, Math.PI * 1.5, false); shape.lineTo(f.len, -f.r1); shape.absarc(f.len, 0, f.r1, -Math.PI / 2, Math.PI / 2, false); shape.closePath();
      const geo = new T.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: true, bevelSegments: 2, bevelSize: 1.5, bevelThickness: 1.5 });
      const m = mesh(geo, materials.rubber, 0, 0, 0, group); m.rotation.x = -Math.PI / 2;
      const top = mesh(new T.ShapeGeometry(shape), materials.accent, 0, 11.6, 0, group); top.rotation.x = -Math.PI / 2; top.scale.set(.94, .60, 1);
      cylinder(f.r0 * .52, 2, materials.chrome, 0, 13, 0, group); dynamics.push({ type: 'flipper', ref: f, mesh: group });
    }
    function lamp(x, y, r, col, test) { cylinder(r + 2, 1, materials.gold, x - 300, 1, y - 500); const m = mat(col, .05, .2, { emissive: col, emissiveIntensity: .25 }); cylinder(r, 1.3, m, x - 300, 2, y - 500); const halo=glow(x-300,y-500,3,col,r*5,.3); dynamics.push({ type: 'lamp', material: m, mesh:halo, test }); }
    tb.rollovers.forEach(r => lamp(r.x, r.y, 7, gold, g => r.lit || r.flash > 0));
    tb.status.mult.forEach((p, i) => lamp(p.x, p.y, 8, gold, g => g.mult >= i + 2));
    tb.status.mb.forEach((p, i) => lamp(p.x, p.y, 7, accent, g => g.multiball || g.mbProgress > i));
    lamp(tb.status.saver.x, tb.status.saver.y, 8, '#a3e5ad', g => g.saver > 0);
    Array.from(tb.word || '').forEach((letter, i, arr) => { const x = 282 - (arr.length - 1) * 12 + i * 24; lamp(x, 713, 9, gold, g => g.wordLit > i); flat(label(letter, 13, 14, gold, ink, 11), 13, 14, x - 300, 713 - 500, 3); });
    // Guided shot arrows on the playfield
    (tb.shotArrows || []).forEach((sa, idx) => {
      const col = sa.col || gold;
      const tex = texture(arrowInsertTex(col, sa.label || ''));
      const arrowMat = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: .88, depthWrite: false, toneMapped: false });
      const m = mesh(new T.PlaneGeometry(34, 40), arrowMat, sa.x - 300, 1.8, sa.y - 500);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = -(sa.ang || 0);
      m.castShadow = m.receiveShadow = false;
      const halo = glow(sa.x - 300, sa.y - 500, 1.4, col, 52, .45);
      dynamics.push({ type: 'shotArrow', mesh: m, halo, phase: idx });
    });
    // Elevated 3D tracks: sleek wireforms, glowing neon laser skyways, iron & magma rails.
    for (const rp of tb.ramps) {
      const edges=[[],[]], inner=[[],[]], verts=[], indices=[], N=160, width=rp.width||30;
      for(let i=0;i<=N;i++) {
        const t=i/N,p=rp.at(t),a=rp.at(Math.max(0,t-.002)),b=rp.at(Math.min(1,t+.002)),dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,h=rp.height?rp.height(t):Math.sin(t*Math.PI)*80;
        for(let side=0;side<2;side++) {
          const sgn=side?1:-1, k=sgn*width/2, x=p.x-dy/l*k-300, z=p.y+dx/l*k-500;
          verts.push(x,h+2,z);
          edges[side].push(new T.Vector3(x,h+9.5,z));
          inner[side].push(new T.Vector3(p.x-dy/l*(sgn*width*.27)-300,h+2.2,p.y+dx/l*(sgn*width*.27)-500));
        }
        if(i<N) {const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
      const matKind = rp.material || 'clear';
      const rCol = rp.color || original.ramp;
      const bedOpacity = matKind === 'wireform' ? 0.08 : matKind === 'neon' ? 0.16 : 0.18;
      const trough = mesh(geo, new T.MeshPhysicalMaterial({
        color: rCol, roughness: .12, metalness: .1, clearcoat: 1,
        transparent: true, opacity: bedOpacity, depthWrite: false, side: T.DoubleSide
      }));
      trough.castShadow = false;
      const topRailMat = matKind === 'neon'
        ? mat(rCol, .3, .15, { emissive: rCol, emissiveIntensity: 1.6 })
        : matKind === 'lava'
        ? mat('#ff6a1a', .4, .22, { emissive: '#ff4500', emissiveIntensity: 1.35 })
        : matKind === 'iron'
        ? mat('#b892ff', .7, .25, { emissive: '#7b4dff', emissiveIntensity: .75 })
        : materials.gold;
      const bottomRailMat = matKind === 'wireform' ? materials.chrome : materials.chrome;
      for(const edge of edges) {
        const tm = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(edge),180,2.2,8,false), topRailMat);
        tm.castShadow = false;
      }
      for(const inEdge of inner) {
        const bm = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(inEdge),180,1.4,6,false), bottomRailMat);
        bm.castShadow = false;
      }
      const step = matKind === 'wireform' ? 10 : 14;
      for(let i=6;i<N;i+=step) {
        const r1 = rail(edges[0][i].toArray(), inner[0][i].toArray(), 1.1, bottomRailMat); r1.castShadow = false;
        const r2 = rail(inner[0][i].toArray(), inner[1][i].toArray(), 1.1, bottomRailMat); r2.castShadow = false;
        const r3 = rail(inner[1][i].toArray(), edges[1][i].toArray(), 1.1, bottomRailMat); r3.castShadow = false;
      }
      for(const p of rp.supports||[]) {cylinder(2.6,p.h,materials.chrome,p.x-300,p.h/2,p.y-500);cylinder(6.5,2.5,materials.gold,p.x-300,2,p.y-500);}
      // 3D Arched Tunnel Hoops / Bridge Trusses along the elevated ramp
      for (const at of rp.arches || [.2, .5, .8]) {
        const p = rp.at(at), q = rp.at(Math.min(1, at + .01)), ang = Math.atan2(q.y - p.y, q.x - p.x);
        const hoop = mesh(new T.TorusGeometry(width * .58, 2.2, 8, 22, Math.PI), topRailMat, p.x - 300, (p.h || 80) + 4, p.y - 500);
        hoop.rotation.y = -ang + Math.PI / 2;
        hoop.castShadow = false;
      }
      const entry=rp.at(0),mid=rp.at(.48);
      flat(label(rp.label||'LEVEL 02',108,22,'#0b1022',rCol,11),108,22,mid.x-300,mid.y-500,(mid.h||98)+13);
      flat(label((rp.label||'RAMP')+' ↑',108,21,'#0b1022',rCol,9),108,21,entry.x-300,entry.y-500+34,2);
      glow(entry.x-300,entry.y-500,2,rCol,95,.95);
    }
    buildProps(tb,original);
    const sparkGeo=new T.BufferGeometry();sparkGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(240*3),3));
    sparkMesh=new T.Points(sparkGeo,new T.PointsMaterial({color:'#ffdc88',size:4.5,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending}));root.add(sparkMesh);
    // Physical spring and plunger in the shooter lane.
    const spring = new T.CatmullRomCurve3(Array.from({ length: 151 }, (_, i) => new T.Vector3(262.5 + Math.cos(i / 150 * Math.PI * 20) * 9, 9 + Math.sin(i / 150 * Math.PI * 20) * 5, 467 + i / 150 * 34)));
    mesh(new T.TubeGeometry(spring, 150, 1.2, 5, false), materials.chrome);
    const plunger = box(25, 8, 5, materials.chrome, 262.5, 8, 465); dynamics.push({ type: 'plunger', mesh: plunger });
    // Upright backglass, black score window, chrome edges and speaker panel.
    backbox = new T.Group(); root.add(backbox);
    box(632, 206, 36, materials.wood, 0, 104, -540, backbox);
    const back = label(tb.name, 600, 115, ink, gold, 44), bx = back.getContext('2d'); bx.strokeStyle = accent; bx.lineWidth = 2; bx.strokeRect(8, 7, 584, 101); bx.font = '9px Verdana'; bx.fillStyle = '#efdfbd'; bx.fillText('T H E   P I N B A L L   C O L L E C T I O N', 300, 95);
    mesh(new T.PlaneGeometry(600, 115), new T.MeshBasicMaterial({ map: texture(back) }), 0, 140, -520, backbox);
    scoreCanvas = label('000000', 440, 48, '#0b131e', '#ffcf5a', 36); scoreMap = texture(scoreCanvas);
    mesh(new T.PlaneGeometry(440, 48), new T.MeshBasicMaterial({ map: scoreMap }), 0, 53, -520, backbox);
    for (const x of [-279, 279]) for (let y = 35; y < 74; y += 7) box(32, 2, 2, materials.dark, x, y, -520, backbox);
    box(638, 7, 40, materials.chrome, 0, 210, -540, backbox);
    batchHardware();
    camera = new T.PerspectiveCamera(40, 1, 1, 6000); sizeKey = ''; hudKey = ''; V.scene = scene; V.renderer = renderer;
  }
  function fit(w, h, thumb = false) {
    const key = `${w}/${h}/${view}/${thumb}`; if (key === sizeKey) return; sizeKey = key;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    backbox.visible = thumb || view === 2;
    const target = new T.Vector3(0, 0, backbox.visible ? -10 : 20), direction = (thumb ? new T.Vector3(180, 1250, 1150) : view === 1 ? new T.Vector3(0, 1900, 1) : view === 2 ? new T.Vector3(650, 1200, 1050) : new T.Vector3(0, 1900, 620)).normalize();
    let distance = 1100;
    const points = []; for (const x of [-318, 318]) for (const y of backbox.visible ? [-80, 220] : [-25, 42]) for (const z of backbox.visible ? [-570, 550] : [-510, 540]) points.push(new T.Vector3(x, y, z));
    for (let i = 0; i < 100; i++) { camera.position.copy(target).addScaledVector(direction, distance); camera.lookAt(target); camera.updateProjectionMatrix(); camera.updateMatrixWorld(); if (points.every(p => { const v = p.clone().project(camera); return Math.abs(v.x) < .985 && Math.abs(v.y) < .985; })) break; distance += 14; }
    V.camera = camera;
  }
  function update(g) {
    const t = g.time || 0;
    for (const d of dynamics) {
      const r = d.ref;
      if (d.type === 'flipper') d.mesh.rotation.y = r.side > 0 ? -r.ang : Math.PI + r.ang;
      else if (d.type === 'target') { d.mesh.position.y = r.up ? 13 : -12; d.mesh.material.emissiveIntensity = r.flash > 0 ? 1.9 : .08; }
      else if (d.type === 'bumper') d.material.emissiveIntensity = r.flash > 0 ? 3.1 : r.lit ? .85 : .22;
      else if (d.type === 'halo') {
        d.mesh.material.opacity = r.flash > 0 ? 1 : r.lit ? .62 : .38;
        const sc = r.flash > 0 ? 1.28 : 1;
        d.mesh.scale.set(sc, sc, 1);
      }
      else if (d.type === 'spinner') d.mesh.rotation.x = r.angle;
      else if (d.type === 'lamp') { const on=d.test(g);d.material.emissiveIntensity = on ? 1.9 : .12;d.mesh.material.opacity=on?.75:.05; }
      else if (d.type === 'plunger') d.mesh.position.z = 465 + g.plungerPull * 34;
      else if (d.type === 'shotArrow') {
        const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 5.2 - d.phase * 1.1));
        d.mesh.material.opacity = 0.5 + 0.5 * pulse;
        d.halo.material.opacity = 0.22 + 0.48 * pulse;
      }
      else if (d.type === 'propVinyl') {
        d.mesh.rotation.y = t * 2.4;
      }
      else if (d.type === 'propRadar') d.mesh.rotation.y = t * 1.3;
      else if (d.type === 'propShip') {
        d.mesh.rotation.y = Math.sin(t * 2.1) * 0.08;
        if (d.flag) { d.flag.rotation.y = Math.sin(t * 5.5) * 0.22; d.flag.position.x = d.baseX + Math.sin(t * 5.5) * 1.5; }
      }
      else if (d.type === 'propReactor') {
        d.mesh.rotation.z = t * 1.8;
        d.mesh.rotation.y = Math.sin(t * 1.4) * 0.25;
        if (d.ring2) { d.ring2.rotation.z = -t * 2.6; d.ring2.rotation.x = Math.PI / 2 + Math.cos(t * 1.9) * 0.32; }
        if (d.core) { const s = 0.9 + 0.16 * Math.sin(t * 6); d.core.scale.set(s, s, s); }
        if (d.material) d.material.emissiveIntensity = 1.0 + 0.5 * Math.sin(t * 6);
      }
      else if (d.type === 'propTower') {
        d.mesh.rotation.z = -t * 0.9;
        if (d.material) d.material.emissiveIntensity = 0.65 + 0.45 * Math.sin(t * 3.5) + (g.flash || 0) * 1.5;
      }
      else if (d.type === 'propVolcano') {
        const heat = 1.2 + 0.55 * Math.sin(t * 4.2) + (g.flash || 0) * 1.2;
        if (d.material) d.material.emissiveIntensity = heat;
        if (d.mesh) d.mesh.material.opacity = 0.55 + 0.35 * Math.sin(t * 4.2);
      }
      else if (d.type === 'playLight') {
        d.light.intensity = 1.25 + (g.flash || 0) * 2.2 + (g.multiball ? 0.45 * Math.sin(t * 8) : 0);
      }
      else if (d.type === 'mover') {
        d.mesh.position.set(r.x - 300, 2 + Math.sin(t * 5) * 1.5, r.y - 500);
        d.mesh.rotation.y = Math.sin(t * 3.2) * 0.35;
        if (d.halo) { d.halo.position.set(r.x - 300, 1.8, r.y - 500); d.halo.material.opacity = r.flash > 0 ? 1 : .6; }
        if (d.material) d.material.emissiveIntensity = r.flash > 0 ? 2.8 : 1.1;
      }
      else if (d.type === 'tunnelVortex') {
        d.mesh.rotation.z = t * 3.2;
      }
      else if (d.type === 'tunnelNode') {
        const active = !!(d.saucer && d.saucer.ball);
        const wave = active ? 1 : Math.max(0.15, 0.5 + 0.5 * Math.sin(t * 7 - d.idx * 0.75));
        d.material.emissiveIntensity = active ? 2.6 : 0.3 + 1.4 * wave;
        if (d.halo) d.halo.material.opacity = active ? 0.95 : 0.15 + 0.45 * wave;
      }
      else if (d.type === 'magnet') {
        const on = !!r.on;
        d.mesh.rotation.y = t * (on ? 4.5 : 1.2);
        d.material.emissiveIntensity = on ? 2.2 : 0.45;
        if (d.halo) d.halo.material.opacity = on ? 0.85 : 0.25;
      }
      else if (d.type === 'boost') {
        const fl = r.flash > 0 ? 1 : 0.65 + 0.3 * Math.sin(t * 8);
        d.mesh.material.opacity = fl;
        if (d.halo) d.halo.material.opacity = r.flash > 0 ? 0.95 : 0.45;
      }
    }
    const ids = new Set(); for (const b of g.world.balls) { ids.add(b.id); let m = balls.get(b.id); if (!m) { m = mesh(new T.SphereGeometry(b.r, 32, 20), materials.ball); balls.set(b.id, m); } const onRamp=b.cap&&b.cap.kind==='ramp'; const inTunnel=b.cap&&b.cap.tunnelTo; const h=onRamp&&b.cap.height?b.cap.height(b.rampT):inTunnel?Math.sin((b.tunnelProg||0)*Math.PI)*14:0;m.position.set(b.x - 300, b.r + 2+h, b.y - 500); m.visible = !b.cap||onRamp||inTunnel; }
    const particles=(g.particles||[]).slice(0,240),pa=sparkMesh.geometry.attributes.position;
    particles.forEach((p,i)=>pa.setXYZ(i,p.x-300,8,p.y-500));pa.needsUpdate=true;sparkMesh.geometry.setDrawRange(0,particles.length);
    for (const [id, m] of balls) if (!ids.has(id)) { root.remove(m); m.geometry.dispose(); balls.delete(id); }
    root.position.x = g.shake && g.shake.t > 0 ? Math.sin(g.time * 55) * g.shake.x * g.shake.t : 0;
    const key = Math.floor(g.dispScore || 0) + '/' + g.ballNo;
    if (key !== hudKey) { hudKey = key; const x = scoreCanvas.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#0b131e'; x.fillRect(0, 0, 880, 96); x.fillStyle = '#ffcf5a'; x.font = 'bold 68px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(Math.floor(g.dispScore || 0)).padStart(6, '0'), 440, 50); scoreMap.needsUpdate = true; }
  }
  V.draw = function (g) {
    if (!init() || unavailable) return false;
    V.active = true; document.body.classList.add('three-active');
    if (table !== g.table) build(g.table);
    fit(stage.clientWidth, stage.clientHeight); update(g); renderer.render(scene, camera);
    document.getElementById('liveTitle').textContent = g.table.name;
    document.getElementById('liveScore').textContent = Math.floor(g.dispScore).toLocaleString('en-US');
    document.getElementById('liveBall').textContent = `${Math.min(g.ballNo, g.maxBalls)} / ${g.maxBalls}`;
    document.getElementById('liveBonus').textContent = '×' + g.mult;
    document.getElementById('liveBest').textContent = g.best.toLocaleString('en-US');
    const liveMission = document.getElementById('liveMission');
    if (liveMission) liveMission.textContent = g.table.mission || '';
    const liveCombo = document.getElementById('liveCombo');
    if (liveCombo) {
      liveCombo.textContent = g.multiball ? '🔥 MULTIBALL ACTIVE' : g.rampCombo > 1 ? `⚡ RAMP COMBO ×${g.rampCombo}` : g.specialLit ? '★ SPECIAL LIT' : (g.table.styleTag || 'MISSION');
    }
    const message = document.getElementById('liveMessage');
    const msgText = g.tilted ? 'TILT' : g.state === 'bonus' && g.bonusInfo ? 'BONUS  +' + Math.floor(g.bonusInfo.shown).toLocaleString('en-US') : g.msg && g.msg.life > 0 ? g.msg.text : g.state === 'ready' ? 'החזיקו רווח ושחררו לשיגור' : g.multiball ? 'MULTIBALL' : '';
    message.textContent = msgText;
    message.classList.toggle('active', !!msgText);
    document.getElementById('powerFill').style.width = (g.plungerPull * 100) + '%';
    return true;
  };
  V.thumbnail = function (tb) {
    if (!init()) return null;
    build(tb); fit(360, 460, true);
    update({ world: { balls: [] }, plungerPull: 0, mult: 3, mbProgress: 2, saver: 10, wordLit: 3, ballNo: 1, dispScore: 0, time: 0 }); renderer.render(scene, camera);
    const c = document.createElement('canvas'); c.width = 360; c.height = 460; c.getContext('2d').drawImage(renderer.domElement, 0, 0, 360, 460); return c;
  };
  V.cycleCamera = function () { view = (view + 1) % 3; document.getElementById('cameraBtn').textContent = ['זווית משחק', 'מבט על', 'מבט צד'][view]; sizeKey = ''; };
  V.hide = function () { document.body.classList.remove('three-active'); };
  V.diagnostics = () => ({ available: !unavailable && !!renderer, view, balls: balls.size, ballHeights:[...balls.values()].map(m=>m.position.y), ramps:table?table.ramps.length:0, objects: dynamics.length, calls: renderer && renderer.info.render.calls, geometries: renderer && renderer.info.memory.geometries });
})();
