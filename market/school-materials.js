/* Fully offline school material library — designed around PineboundThree exports.
 * Surfaces are cosmetic only. The existing room geometry and collisions remain untouched.
 */
function createSchoolMaterialLibrary(T){
 const sourceTextures=new Map(),materials=new Map();
 function canvasPattern(kind){
  if(sourceTextures.has(kind))return sourceTextures.get(kind);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  let seed=typeof kind==='string'?kind.split('').reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,8211):8211;
  function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const fill=color=>{ctx.fillStyle=color;ctx.fillRect(0,0,256,256);};
  if(kind==='tile'||kind==='terrazzo'||kind==='marble'){
   fill(kind==='tile'?'#d3dcd7':kind==='marble'?'#e9e4d8':'#cad2c5');
   for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=64){
    const v=Math.floor(rnd()*12);
    ctx.fillStyle=kind==='marble'?'rgb('+(224+v)+','+(222+v)+','+(211+v)+')':
     'rgb('+(204+v)+','+(216+v)+','+(207+v)+')';
    ctx.fillRect(x+2,y+2,60,60);
    const shade=ctx.createLinearGradient(x+2,y+2,x+62,y+62);
    shade.addColorStop(0,'rgba(255,255,255,.24)');
    shade.addColorStop(1,'rgba(82,98,90,.11)');
    ctx.fillStyle=shade;ctx.fillRect(x+2,y+2,60,60);
   }
   ctx.strokeStyle='rgba(116,133,120,.32)';ctx.lineWidth=2;
   for(let q=0;q<=256;q+=64){ctx.beginPath();ctx.moveTo(q,0);ctx.lineTo(q,256);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,q);ctx.lineTo(256,q);ctx.stroke();}
   for(let i=0;i<(kind==='terrazzo'?1450:420);i++){
    const a=rnd()*256,b=rnd()*256,s=.5+rnd()*2.5;
    ctx.fillStyle=i%4===0?'rgba(88,105,101,.25)':'rgba(255,255,255,.28)';
    ctx.fillRect(a,b,s,s);
   }
  }else if(kind==='wood'||kind==='shelf'){
   fill(kind==='shelf'?'#9c7552':'#ad865f');
   const bg=ctx.createLinearGradient(0,0,256,0);
   bg.addColorStop(0,'rgba(74,47,27,.15)');bg.addColorStop(.46,'rgba(255,236,190,.12)');
   bg.addColorStop(1,'rgba(70,39,17,.15)');ctx.fillStyle=bg;ctx.fillRect(0,0,256,256);
   for(let i=0;i<73;i++){
    const y=i*3.8+(rnd()-.5)*4;
    ctx.beginPath();
    for(let x=-3;x<=259;x+=4){
     const wave=Math.sin(x*.025+i*1.8)*1.2+Math.sin(x*.13+i*.37)*.43;
     if(x===-3)ctx.moveTo(x,y+wave);else ctx.lineTo(x,y+wave);
    }
    ctx.lineWidth=.55+rnd()*1.1;
    ctx.strokeStyle=i%5===0?'rgba(57,33,19,.27)':'rgba(235,199,147,.21)';
    ctx.stroke();
   }
   for(let j=0;j<4;j++){
    const x=rnd()*256,y=rnd()*256;
    ctx.strokeStyle='rgba(69,41,25,.22)';ctx.lineWidth=.8;
    for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(x,y,8+k*5,2+k*1.4,.1,0,Math.PI*2);ctx.stroke();}
   }
  }else if(kind==='plaster'||kind==='acoustic'){
   fill(kind==='acoustic'?'#e3e7dd':'#ece8da');
   for(let i=0;i<4200;i++){
    const v=Math.floor(150+rnd()*90),alpha=.025+rnd()*.07;
    ctx.fillStyle='rgba('+v+','+v+','+(v-6)+','+alpha.toFixed(3)+')';
    const x=rnd()*256,y=rnd()*256;ctx.fillRect(x,y,1+rnd()*3,1+rnd()*3);
   }
   for(let j=0;j<9;j++){
    ctx.fillStyle='rgba(250,251,243,.11)';ctx.fillRect(0,j*32,256,3);
   }
  }else if(kind==='ceiling'){
   fill('#edece4');
   ctx.strokeStyle='rgba(133,146,134,.4)';ctx.lineWidth=3;
   for(let i=0;i<=256;i+=64){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,256);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(256,i);ctx.stroke();}
   for(let i=0;i<2400;i++){
    ctx.fillStyle='rgba(106,111,99,'+(.025+rnd()*.05).toFixed(3)+')';
    ctx.fillRect(rnd()*256,rnd()*256,.8,.8);
   }
  }else if(kind==='carpet'){
   fill('#849d8f');
   for(let i=0;i<12500;i++){
    ctx.fillStyle=i%3===0?'rgba(255,248,212,.10)':'rgba(27,60,56,.08)';
    ctx.fillRect(rnd()*256,rnd()*256,1+rnd()*2,.5+rnd()*2);
   }
   ctx.strokeStyle='rgba(215,203,165,.24)';
   for(let j=0;j<256;j+=42){ctx.beginPath();ctx.moveTo(j,0);ctx.lineTo(j+12,256);ctx.stroke();}
  }else if(kind==='metal'){
   fill('#859895');
   const gr=ctx.createLinearGradient(0,0,256,0);
   gr.addColorStop(0,'rgba(28,50,57,.22)');gr.addColorStop(.45,'rgba(238,249,247,.25)');
   gr.addColorStop(1,'rgba(37,56,62,.22)');ctx.fillStyle=gr;ctx.fillRect(0,0,256,256);
   for(let i=0;i<310;i++){ctx.strokeStyle=i%2?'rgba(230,244,240,.10)':'rgba(39,66,71,.08)';
    ctx.beginPath();const y=rnd()*256;ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
  }else if(kind==='cork'){
   fill('#bc9469');
   for(let i=0;i<5000;i++){
    ctx.fillStyle=i%4?'rgba(73,45,30,.08)':'rgba(249,215,165,.18)';
    const x=rnd()*256,y=rnd()*256;ctx.fillRect(x,y,.8+rnd()*2,.8+rnd()*2);
   }
  }else if(kind==='board'){
   fill('#456c62');
   for(let i=0;i<650;i++){
    ctx.fillStyle=i%3?'rgba(202,225,209,.018)':'rgba(23,53,45,.032)';
    ctx.fillRect(rnd()*256,rnd()*256,1+rnd()*2,1+rnd()*2);
   }
   const shine=ctx.createLinearGradient(0,0,0,256);shine.addColorStop(0,'rgba(255,255,255,.10)');
   shine.addColorStop(1,'rgba(0,0,0,.10)');ctx.fillStyle=shine;ctx.fillRect(0,0,256,256);
  }else{
   fill('#e8e3d4');
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=1000;
  map.anisotropy=2;sourceTextures.set(kind,map);
  return map;
 }
 function material(kind,w=1,h=1,tint='#ffffff'){
  const u=Math.max(1,Math.round(w/1.8*10)/10),v=Math.max(1,Math.round(h/1.8*10)/10);
  const key=[kind,u,v,tint].join(':');
  if(materials.has(key))return materials.get(key);
  const src=canvasPattern(kind);if(!src)return new T.MeshLambertMaterial({color:tint,side:T.DoubleSide});
  const map=src.clone();map.repeat.set(u,v);map.needsUpdate=true;
  const result=new T.MeshLambertMaterial({color:tint,map,side:T.DoubleSide});
  materials.set(key,result);return result;
 }
 return {material,sourceTextures};
}
function applySchoolInteriorTextures({T,group,place,low=false}){
 if(low){group.userData.schoolTextureCount=0;return 0;}
 const lib=createSchoolMaterialLibrary(T),quads=[],pi=Math.PI;
 function surface(name,kind,x,y,z,w,h,rx=0,ry=0,tint='#ffffff'){
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),lib.material(kind,w,h,tint));
  mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,0);mesh.receiveShadow=true;
  mesh.castShadow=false;mesh.name='School texture · '+name;group.add(mesh);quads.push(mesh);return mesh;
 }
 // Ground-level floors are layered just above the existing physical floor.
 surface('corridor polished porcelain','tile',0,.075,-.15,2.62,19.58,-pi/2,0,'#f5f8f5');
 const zones=[
  {from:-11.32,to:-3.38,materials:['terrazzo','tile'],wall:'#e8eee3'},
  {from:-3.38,to:2.38,materials:['carpet','terrazzo'],wall:'#f3ede0'},
  {from:2.38,to:9.78,materials:['wood','tile'],wall:'#f2eee6'}
 ];
 for(let j=0;j<zones.length;j++){
  const r=zones[j],depth=r.to-r.from,zc=(r.from+r.to)*.5;
  for(const side of [-1,1]){
   const x=side*7.9,kind=r.materials[side<0?0:1];
   surface('room floor '+j+' '+side,kind,x,.045,zc,8.90,depth-.19,-pi/2,0,'#f7f7f2');
   surface('acoustic room ceiling '+j+' '+side,'ceiling',x,4.605,zc,5.17,depth-.42,pi/2,0);
   // Corridor-facing and classroom-facing walls maintain the exact doorway gaps.
   for(const [from,to] of [[r.from,[-4.42,.85,3.65][j]-1.15],[[-4.42,.85,3.65][j]+1.15,r.to]]){
    const span=to-from;if(span<=.12)continue;
    const mid=(from+to)/2;
    surface('corridor plaster '+j,'plaster',side*3.235,2.16,mid,span,4.20,0,pi/2);
    surface('room plaster '+j,'plaster',side*3.578,2.16,mid,span,4.20,0,pi/2, r.wall);
    surface('painted baseboard '+j,'metal',side*3.202,.20,mid,span,.35,0,pi/2,'#e3eadc');
   }
   // Outer wall, classroom noticeboards and wood shelves use distinct textures.
   surface('room wall '+j+' '+side,'plaster',side*12.846,2.36,zc,depth-.15,4.55,0,pi/2,'#f5f3e9');
   surface('teaching board '+j+' '+side,'board',x,2.57,r.from+.453,4.90,1.35,0,0);
   surface('shelf face '+j+' '+side,'shelf',side*11.32,1.25,zc+.615,1.04,1.23,0,0);
   // Laminate classroom tables and textured chair seats.
   surface('classroom table '+j+' '+side,'wood',side*10,.838,zc+1.42,2.39,1.19,-pi/2);
   for(const shift of [-1.05,1.07]){
    surface('chair fabric '+j+' '+side,'carpet',side*10,.548,zc+1.42+shift,1.00,.57,-pi/2,0,'#d9e5e0');
   }
   // Decorative cork bulletin board, bounded within the existing lesson zone.
   surface('bulletin board '+j+' '+side,'cork',x+1.54,2.62,r.from+.58,1.15,.64);
  }
 }
 // Textured ceiling tiles in the central circulation spine, between fixtures.
 surface('main acoustic ceiling','ceiling',0,4.944,-.22,6.40,21.8,pi/2,0);
 for(const side of [-1,1]){
  surface('side locker material','metal',side*12.548,1.23,0,1.80,10.5,0,pi/2,'#dde9e5');
  // Long bookshelf kick-rails are textured wood and mark the room boundaries.
  for(const r of zones){
   const zc=(r.from+r.to)*.5;
   surface('room wood skirting','shelf',side*12.75,.32,zc,r.to-r.from-.23,.40,0,pi/2,'#e2e5db');
  }
 }
 for(const x of [-7,7])for(const z of [-6.42,-1.20,5.03]){
  surface('student workstation laminate','wood',x,.837,z,3.66,1.22,-pi/2);
  surface('workstation writing pad','cork',x+.90,1.062,z+.20,.54,.28,-pi/2,0,'#ede8d7');
  surface('monitor brushed-metal backing','metal',x,1.42,z-.351,1.49,.78);
 }
 surface('reception desk stone counter','marble',-8.2,.973,10.22,4.05,1.25,-pi/2);
 surface('reception wood front','wood',-8.2,.63,10.856,3.74,.72);
 for(const z of [9.48,10.6]){
  surface('waiting bench seat','wood',8.25,.638,z,4.08,.54,-pi/2,0,'#d3dfd5');
 }
 // Welcome mat and hand-worn entry threshold.
 surface('entry rug','carpet',0,.077,10.60,2.55,1.14,-pi/2,0,'#e6e3ca');
 group.userData.schoolTextureCount=quads.length;
 group.userData.schoolTextureTypes=[...lib.sourceTextures.keys()];
 return quads.length;
}
function applySchoolExteriorTextures({T,group,place,low=false}){
 if(low)return 0;
 const lib=createSchoolMaterialLibrary(T),meshes=[],f=place.face||1,front=place.z+f*place.d/2;
 function face(name,kind,x,y,z,w,h,rx=0,tint='#ffffff'){
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),lib.material(kind,w,h,tint));
  mesh.name='School exterior texture · '+name;
  mesh.position.set(x,y,z);mesh.rotation.set(rx,0,0);mesh.castShadow=false;
  mesh.receiveShadow=true;group.add(mesh);meshes.push(mesh);
 }
 // Entry stone and physical canopy underside. Avoid covering the signage/windows.
 for(let i=0;i<3;i++){
  const w=5.05-i*.27,z=front+f*(2.52-i*.42);
  face('stone entrance stair '+i,'marble',place.x,.128+i*.042,z,w,.87,-Math.PI/2,'#ece3d6');
 }
 face('canopy wood','wood',place.x,3.614,front+f*1.45,6.20,1.0,Math.PI/2,'#dedbcc');
 group.userData.schoolExteriorTextureCount=meshes.length;
 return meshes.length;
}

