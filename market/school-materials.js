/* LumenVale School — architectural material system.
 * Redesign guided by threejs-game-skills/threejs-aaa-graphics-builder:
 * deliberate material roles, trim/decals, reusable textures, measured GPU cost.
 * Maps and geometry use the in-project PineboundThree subset; offline only.
 */
function createSchoolMaterialLibrary(T){
 const textures=new Map(),materials=new Map();
 const palette={
  tile:'#e0e2de',terrazzo:'#d9d9d0',marble:'#e8e4da',
  plaster:'#eeeae2',ceiling:'#ecece5',acoustic:'#dddcd4',
  wood:'#b58f66',shelf:'#9a7758',carpet:'#718681',
  metal:'#899699',cork:'#c49d71',board:'#31565a'
 };
 function baseTexture(kind){
  if(textures.has(kind))return textures.get(kind);
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  let seed=kind.split('').reduce((a,c)=>(Math.imul(a,33)+c.charCodeAt(0))>>>0,104729);
  const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  ctx.fillStyle=palette[kind]||'#e7e6e0';ctx.fillRect(0,0,384,384);
  if(kind==='tile'||kind==='terrazzo'||kind==='marble'){
   if(kind==='tile'){
    const edge=96;
    for(let y=0;y<384;y+=edge)for(let x=0;x<384;x+=edge){
     ctx.fillStyle=(Math.floor(x/edge)+Math.floor(y/edge))%2?'#e0e3de':'#e5e8e4';
     ctx.fillRect(x+2,y+2,edge-4,edge-4);
     ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(x+4,y+4,edge-8,3);
     ctx.fillStyle='rgba(75,88,84,.08)';ctx.fillRect(x+3,y+edge-7,edge-7,3);
    }
   }else if(kind==='terrazzo'){
    for(let i=0;i<1850;i++){
     const c=['rgba(90,101,96,.25)','rgba(242,235,219,.80)','rgba(139,123,104,.25)'][i%3];
     ctx.fillStyle=c;const x=rnd()*384,y=rnd()*384,r=1+rnd()*4.5;
     ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r*.7,y-r*.5);ctx.lineTo(x+r,y+r*.8);ctx.closePath();ctx.fill();
    }
   }else{
    ctx.lineWidth=.75;
    for(let i=0;i<15;i++){
     let y=rnd()*384;
     ctx.strokeStyle=i%2?'rgba(127,135,129,.14)':'rgba(255,255,255,.29)';
     ctx.beginPath();ctx.moveTo(0,y);
     for(let x=0;x<=384;x+=12)ctx.lineTo(x,y+=Math.sin(x*.015+i)*1.4+(rnd()-.5)*1.2);
     ctx.stroke();
    }
   }
  }else if(kind==='wood'||kind==='shelf'){
   const knots=kind==='wood'?5:2;
   for(let i=0;i<79;i++){
    const y=(i/79)*384+(rnd()-.5)*3;
    ctx.strokeStyle=i%6===0?'rgba(67,43,29,.16)':'rgba(255,224,176,.12)';
    ctx.lineWidth=i%6===0?1.2:.65;ctx.beginPath();
    for(let x=0;x<=384;x+=8){
     let d=Math.sin(x*.024+i*.32)*.9+Math.sin(x*.061+i)*.3;
     if(x===0)ctx.moveTo(0,y+d);else ctx.lineTo(x,y+d);
    }ctx.stroke();
   }
   for(let j=0;j<knots;j++){
    const x=rnd()*384,y=rnd()*384;
    ctx.strokeStyle='rgba(85,52,34,.19)';ctx.lineWidth=1.1;
    for(let t=1;t<=3;t++){ctx.beginPath();ctx.ellipse(x,y,2+t*5,2+t*1.5,.02,0,Math.PI*2);ctx.stroke();}
   }
  }else if(kind==='plaster'||kind==='acoustic'){
   // Fine-grain plaster instead of dirty noise; coarse dots were the old design's flaw.
   for(let i=0;i<3100;i++){
    ctx.fillStyle=i%3?'rgba(98,101,94,.022)':'rgba(255,255,255,.11)';
    const p=rnd()*384,q=rnd()*384;
    ctx.fillRect(p,q,.7+rnd()*1.1,.7+rnd()*1.1);
   }
  }else if(kind==='ceiling'){
   ctx.strokeStyle='rgba(137,147,142,.32)';ctx.lineWidth=2.5;
   for(let v=0;v<=384;v+=96){
    ctx.beginPath();ctx.moveTo(v,0);ctx.lineTo(v,384);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,v);ctx.lineTo(384,v);ctx.stroke();
   }
   for(let i=0;i<1150;i++){ctx.fillStyle='rgba(110,123,116,.042)';ctx.fillRect(rnd()*384,rnd()*384,.6,.6);}
  }else if(kind==='carpet'){
   for(let i=0;i<6300;i++){
    ctx.fillStyle=i%2?'rgba(215,226,212,.09)':'rgba(33,57,59,.065)';
    ctx.fillRect(rnd()*384,rnd()*384,.6+rnd()*1.2,1+rnd()*2);
   }
   ctx.strokeStyle='rgba(220,224,207,.1)';ctx.lineWidth=1;
   for(let x=0;x<384;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+5,384);ctx.stroke();}
  }else if(kind==='metal'){
   const shine=ctx.createLinearGradient(0,0,384,0);
   shine.addColorStop(0,'rgba(30,48,54,.21)');
   shine.addColorStop(.23,'rgba(254,255,252,.15)');
   shine.addColorStop(.54,'rgba(255,255,255,.03)');
   shine.addColorStop(.94,'rgba(37,51,53,.13)');
   ctx.fillStyle=shine;ctx.fillRect(0,0,384,384);
   for(let i=0;i<240;i++){ctx.fillStyle='rgba(249,249,244,.055)';ctx.fillRect(0,rnd()*384,384,.4);}
  }else if(kind==='cork'){
   for(let i=0;i<2400;i++){ctx.fillStyle=i%2?'rgba(84,55,31,.07)':'rgba(245,221,164,.15)';
    ctx.fillRect(rnd()*384,rnd()*384,1.2+rnd()*2,1+rnd()*2);}
  }else if(kind==='board'){
   const g=ctx.createLinearGradient(0,0,0,384);
   g.addColorStop(0,'rgba(248,255,255,.11)');g.addColorStop(1,'rgba(8,34,38,.11)');
   ctx.fillStyle=g;ctx.fillRect(0,0,384,384);
  }
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=1000;map.anisotropy=2;
  textures.set(kind,map);return map;
 }
 function material(kind,w=1,h=1,tint='#ffffff'){
  // Quantized tiling and shared instances reduce unique GPU texture allocations.
  const u=Math.max(1,Math.round(w/3)),v=Math.max(1,Math.round(h/3));
  const key=[kind,u,v,tint].join(':');
  if(materials.has(key))return materials.get(key);
  const src=baseTexture(kind),map=src?.clone();
  if(map){map.repeat.set(u,v);map.needsUpdate=true;}
  const mat=new T.MeshLambertMaterial({color:tint,map,side:T.DoubleSide});
  materials.set(key,mat);return mat;
 }
 return {material,sourceTextures:textures};
}
function applySchoolInteriorTextures({T,group,place,low=false}){
 if(low){group.userData.schoolTextureCount=0;return 0;}
 const library=createSchoolMaterialLibrary(T),PI=Math.PI,overlays=[];
 function panel(name,kind,x,y,z,w,h,rx=0,ry=0,tint='#ffffff'){
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),library.material(kind,w,h,tint));
  mesh.name='School finish · '+name;mesh.position.set(x,y,z);
  mesh.rotation.set(rx,ry,0);mesh.receiveShadow=true;mesh.castShadow=false;
  group.add(mesh);overlays.push(mesh);return mesh;
 }
 // Restrained civic architecture: ivory walls, warm-oak joinery, sage teaching
 // stations, large porcelain floor and brass accent trims.
 panel('central porcelain concourse','tile',0,.077,-.15,6.56,19.58,-PI/2);
 const rooms=[
  {front:-11.32,back:-3.38,door:-4.42,types:['terrazzo','tile']},
  {front:-3.38,back:2.38,door:.85,types:['carpet','terrazzo']},
  {front:2.38,back:9.78,door:3.65,types:['wood','tile']}
 ];
 for(let tier=0;tier<3;tier++){
  const r=rooms[tier],center=(r.front+r.back)/2,depth=r.back-r.front;
  for(const side of [-1,1]){
   const x=side*7.9,roomLabel=side<0?'WEST':'EAST',floorKind=r.types[side<0?0:1];
   panel(roomLabel+' room '+tier+' floor',floorKind,x,.044,center,8.87,depth-.17,-PI/2);
   panel('acoustic ceiling '+tier+' '+roomLabel,'ceiling',x,4.607,center,5.10,depth-.45,PI/2);
   // Two slim panel runs leave the actual 2.2m door gap walkable and visible.
   for(const [a,b]of [[r.front,r.door-1.15],[r.door+1.15,r.back]]){
    const span=b-a;if(span<.15)continue;const mid=(a+b)/2;
    panel('corridor wall '+tier,'plaster',side*3.235,2.13,mid,span,4.12,0,PI/2);
    panel('room wall '+tier,'plaster',side*3.578,2.13,mid,span,4.12,0,PI/2);
    panel('skirting '+tier,'shelf',side*3.202,.17,mid,span,.18,0,PI/2,'#e7e0d0');
   }
   panel('perimeter finish '+tier,'plaster',side*12.855,2.37,center,depth-.20,4.5,0,PI/2);
   panel('teaching board '+tier,'board',x,2.57,r.front+.454,4.87,1.34);
   panel('built-in shelf '+tier,'shelf',side*11.32,1.20,center+.615,1.00,1.13);
   panel('writing table '+tier,'wood',side*10,.838,center+1.42,2.39,1.18,-PI/2);
   panel('cork pinboard '+tier,'cork',x+1.52,2.62,r.front+.58,1.15,.62);
   // Independent lamp fascia and tactile floor border give useful scale cues.
   panel('doorheader '+tier,'metal',side*4.55,3.84,r.door,1.61,.30,0,0,'#f4f1e7');
   for(const shift of [-1.05,1.07]){
    panel('fabric seat '+tier,'carpet',side*10,.548,center+1.42+shift,1.0,.57,-PI/2,'#d9e1dc');
   }
  }
 }
 panel('circulation ceiling','ceiling',0,4.944,-.22,6.35,21.72,PI/2);
 for(const side of [-1,1]){
  panel('locker brushed metal '+side,'metal',side*12.548,1.23,0,1.78,10.45,0,PI/2,'#e6e9e6');
 }
 for(const x of [-7,7])for(const z of [-6.42,-1.20,5.03]){
  panel('desk oak worktop','wood',x,.837,z,3.65,1.22,-PI/2);
  panel('monitor back','metal',x,1.42,z-.351,1.49,.78);
  panel('writing sheet','marble',x+.9,1.061,z+.2,.51,.27,-PI/2);
 }
 panel('stone reception counter','marble',-8.2,.973,10.22,4.05,1.24,-PI/2);
 panel('reception oak front','wood',-8.2,.63,10.856,3.74,.72);
 for(const z of [9.48,10.6])panel('visitor bench','wood',8.25,.638,z,4.08,.54,-PI/2,'#e7e9e3');
 panel('entrance carpet','carpet',0,.078,10.60,2.53,1.11,-PI/2,'#e1dfce');
 group.userData.schoolTextureCount=overlays.length;
 group.userData.schoolTextureTypes=[...library.sourceTextures.keys()];
 group.userData.schoolDesignVersion='architectural-redesign-v2';
 return overlays.length;
}
function applySchoolExteriorTextures({T,group,place,low=false}){
 if(low)return 0;
 const lib=createSchoolMaterialLibrary(T),meshes=[],f=place.face||1,front=place.z+f*place.d/2;
 function face(name,kind,x,y,z,w,h,rx=0,tint='#ffffff'){
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),lib.material(kind,w,h,tint));
  mesh.name='School exterior finish · '+name;mesh.position.set(x,y,z);
  mesh.rotation.set(rx,0,0);mesh.receiveShadow=true;mesh.castShadow=false;
  group.add(mesh);meshes.push(mesh);
 }
 for(let i=0;i<3;i++){
  const w=5.05-i*.27,z=front+f*(2.52-i*.42);
  face('honed limestone step '+i,'marble',place.x,.128+i*.042,z,w,.87,-Math.PI/2);
 }
 face('oak porch soffit','wood',place.x,3.614,front+f*1.45,6.20,1,Math.PI/2,'#e8e4d7');
 group.userData.schoolExteriorTextureCount=meshes.length;return meshes.length;
}
