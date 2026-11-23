/* LumenVale Vehicle Studio
 * Reusable low-poly car design kit. Body panels are merged into just a few
 * vertex-coloured meshes; only four wheel assemblies animate independently.
 * All models face +X, share real road proportions, and use original assets.
 */
const LV_VEHICLE_TYPES={
 compact:{name:'Juniper Hatch',length:3.55,width:1.64,roof:1.56,wheel:.37,back:-.98,front:1.10,roofBack:-.60,roofFront:.51,cabinHalf:.65},
 sedan:{name:'Vale Executive',length:4.32,width:1.73,roof:1.58,wheel:.39,back:-1.35,front:1.12,roofBack:-.84,roofFront:.50,cabinHalf:.70},
 coupe:{name:'Riviera Sport',length:4.22,width:1.80,roof:1.48,wheel:.40,back:-1.25,front:1.12,roofBack:-.63,roofFront:.53,cabinHalf:.68},
 suv:{name:'Evergreen SUV',length:4.58,width:1.91,roof:1.91,wheel:.44,back:-1.56,front:1.23,roofBack:-1.26,roofFront:.78,cabinHalf:.78},
 pickup:{name:'Foundry Pickup',length:4.84,width:1.92,roof:1.77,wheel:.43,back:-.22,front:1.72,roofBack:.10,roofFront:1.17,cabinHalf:.78},
 van:{name:'Vale Courier',length:4.79,width:1.96,roof:2.18,wheel:.42,back:-2.06,front:1.80,roofBack:-1.95,roofFront:1.12,cabinHalf:.81},
 bus:{name:'Learning Express',length:6.62,width:2.13,roof:2.74,wheel:.48,back:-3.04,front:2.84,roofBack:-2.87,roofFront:2.27,cabinHalf:.89}
};
const LV_VEHICLE_PAINTS={
 cream:'#e2d0ad',jade:'#4c8a83',amber:'#d6a05c',
 coral:'#c56d5b',navy:'#54718a',mint:'#a4c7b5',charcoal:'#637276'
};
function createLumenVehicle(T,style='sedan',options={}){
 const spec=LV_VEHICLE_TYPES[style]||LV_VEHICLE_TYPES.sedan;
 const tint=LV_VEHICLE_PAINTS[options.paint]||options.paint||'#739a90';
 const root=new T.Group();
 root.name=spec.name+' · LumenVale';
 const low=Boolean(options.low);
 const p={solid:[],glass:[],lights:[]},c={solid:[],glass:[],lights:[]},colorCache=new Map();
 function color(hex){
  if(!colorCache.has(hex))colorCache.set(hex,new T.Color(hex));
  return colorCache.get(hex);
 }
 function shade(hex,n=1){
  const v=color(hex);return [Math.min(1,v.r*n),Math.min(1,v.g*n),Math.min(1,v.b*n)];
 }
 function tri(type,a,b,d,hex,brightness=1){
  const positions=p[type],colors=c[type],rgb=shade(hex,brightness);
  for(const vertex of [a,b,d]){positions.push(...vertex);colors.push(...rgb);}
 }
 function quad(type,a,b,d,e,hex,brightness=1){
  tri(type,a,b,d,hex,brightness);tri(type,a,d,e,hex,brightness);
 }
 function box(type,x,y,z,w,h,d,hex,shadeFactor=1){
  const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
  quad(type,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],hex,shadeFactor*.85);
  quad(type,[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1],hex,shadeFactor*.86);
  quad(type,[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],hex,shadeFactor*.92);
  quad(type,[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],hex,shadeFactor*.78);
  quad(type,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],hex,shadeFactor*1.08);
  quad(type,[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0],hex,shadeFactor*.65);
 }
 function roofPanel(a,b,c0,d,hex,type='solid'){quad(type,a,b,c0,d,hex);}
 function decal(message,side,x,y,z,w=.9,h=.34,ink='#ffffff'){
  if(low||!document?.createElement)return;
  const cv=document.createElement('canvas');cv.width=420;cv.height=128;
  const ctx=cv.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,420,128);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 52px sans-serif';
  ctx.fillText(message,210,66,400);
  const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;
  const plane=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}));
  plane.position.set(x,y,z);plane.rotation.y=side>0?0:Math.PI;root.add(plane);
 }
 const L=spec.length,W=spec.width,half=L/2,side=W/2,r=spec.wheel;
 const front=half,back=-half;
 const bodyY=style==='bus'?1.04:style==='van'?1.0:.77;
 const bodyHeight=style==='bus'?1.16:style==='van'?1.17:.73;
 const lower=style==='bus'?.41:.39,shoulder=bodyY+bodyHeight/2;
 const charcoal='#293b41',rubber='#222c30',glass='#86b0bb',pale='#cbe0df',trim='#a2a9a1';
 // The chassis tapers at its nose and tail, avoiding a single plain cuboid.
 box('solid',0,bodyY,0,L-.20,bodyHeight,W-.09,tint);
 box('solid',0,.38,0,L-.38,.19,W-.19,charcoal);
 box('solid',0,.30,0,L-.53,.13,W-.32,'#485256');
 for(const end of [-1,1]){
  const x=end*(half-.12);
  box('solid',x,.62,0,.24,.32,W-.06,end===1?charcoal:'#48535a');
  box('solid',x,.48,0,.22,.12,W-.15,'#b6b7ac');
 }
 // Cabin profile, sloping front glass and distinct roof proportions.
 const cabSide=spec.cabinHalf;
 const base=shoulder+.02,top=spec.roof;
 const A={x:spec.back,y:base},B={x:spec.roofBack,y:top},C={x:spec.roofFront,y:top},D={x:spec.front,y:base};
 if(style==='van'||style==='bus'){
  // A full-height cargo/passenger body and a separate forward cab.
  box('solid',(back+spec.roofFront)*.5,(base+top)*.5,0,spec.roofFront-back,top-base,W-.17,tint);
  box('solid',0,top-.09,0,L-.36,.19,W-.20,tint);
 }else{
  roofPanel([B.x,top,-cabSide],[C.x,top,-cabSide],[C.x,top,cabSide],[B.x,top,cabSide],tint);
  for(const sign of [-1,1]){
   const zz=sign*cabSide;
   roofPanel([A.x,base,zz],[B.x,top,zz],[C.x,top,zz],[D.x,base,zz],tint);
  }
 }
 // Front/rear windshield: separate transparency pass enables a true interior.
 quad('glass',[D.x,base+.08,-cabSide+.055],[C.x,top-.09,-cabSide+.08],
  [C.x,top-.09,cabSide-.08],[D.x,base+.08,cabSide-.055],glass);
 if(style!=='van'&&style!=='bus'){
  quad('glass',[B.x,top-.09,cabSide-.085],[A.x,base+.08,cabSide-.06],
   [A.x,base+.08,-cabSide+.06],[B.x,top-.09,-cabSide+.085],glass,.89);
 }
 // Tailored side glass: separate front and rear window, structural B-pillars.
 const zWindow=cabSide+.018;
 if(style==='van'||style==='bus'){
  for(const sideSign of [-1,1]){
   const z=sideSign*zWindow;
   const n=style==='bus'?6:style==='van'?2:3;
   for(let j=0;j<n;j++){
    const a=spec.roofBack+.19+j*(spec.roofFront-spec.roofBack-.27)/n,
      b=a+(spec.roofFront-spec.roofBack-.27)/n-.11;
    quad('glass',[a,base+.20,z],[b,base+.20,z],[b,top-.30,z],[a,top-.30,z],
      j===0?'#83aeb8':'#9fc8cc');
    box('solid',b+.05,(base+top)/2,z,.07,top-base-.19,.055,charcoal);
   }
   box('solid',0,top-.18,z,L-.45,.08,.07,tint);
  }
 }else{
  const mid=style==='coupe'?(spec.roofBack+spec.roofFront)*.28:(spec.roofBack+spec.roofFront)/2-.03;
  for(const sign of [-1,1]){
   const z=sign*zWindow;
   quad('glass',[A.x+.12,base+.12,z],[B.x+.055,top-.14,z],[mid-.10,top-.14,z],[mid-.18,base+.13,z],glass);
   quad('glass',[mid+.09,base+.13,z],[mid+.12,top-.14,z],[C.x-.055,top-.14,z],[D.x-.12,base+.12,z],pale,.97);
   box('solid',mid,(base+top)/2,z,.085,top-base-.12,.073,charcoal);
   box('solid',(spec.roofBack+spec.roofFront)/2,top-.04,z,spec.roofFront-spec.roofBack,.075,.065,tint);
  }
 }
 // Frame trim, hood seams, body accent, flush handles and mirrors.
 for(const sign of [-1,1]){
  const z=sign*(W/2+.012);
  box('solid',0,.51,z,L-.45,.065,.04,'#d6dbce');
  if(style!=='bus')for(const x of [-.71,.57]){
   box('solid',x,base-.18,z,.29,.045,.055,'#d6d8d0');
   box('solid',x+.13,base-.22,z,.08,.04,.065,charcoal);
  }
  box('solid',spec.front-.12,base+.14,sign*(W/2+.09),.40,.17,.30,tint);
  box('glass',spec.front-.11,base+.23,sign*(W/2+.095),.31,.095,.28,'#5f777f');
  box('solid',spec.front-.04,base+.12,sign*(W/2+.20),.33,.06,.06,charcoal);
  // Matte wheel arch cladding / fender flare.
  for(const x of [-(half-r*1.76),(half-r*1.76)]){
   box('solid',x,.43,z,.88,.09,.095,charcoal);
   box('solid',x-.45,.70,z,.10,.30,.08,charcoal);
   box('solid',x+.45,.70,z,.10,.30,.08,charcoal);
  }
 }
 box('solid',(spec.front+front)*.5,shoulder-.04,0,front-spec.front+.1,.09,W-.18,tint,1.13);
 box('solid',front-.35,shoulder+.012,0,.018,.018,W-.36,'#dae0d4');
 // Detailed front fascia: grille, mesh, light clusters and corner reflectors.
 box('solid',front+.017,.79,0,.045,.29,W*.55,charcoal);
 for(let i=-3;i<=3;i++)box('solid',front+.048,.77,i*.125,.05,.12,.028,'#7f9998');
 for(const sign of [-1,1]){
  const z=sign*(W*.34);
  box('lights',front+.045,.93,z,.07,.205,.35,'#fff1c4');
  box('solid',front+.077,.93,z+sign*.15,.022,.04,.07,'#d0d9c8');
  box('lights',back-.048,.91,z,.064,.22,.31,'#d6463b');
  box('lights',back-.052,.77,z+sign*.07,.068,.07,.22,'#f3af7f');
  box('solid',front+.027,.49,sign*(W*.42),.05,.08,.14,'#647d7c');
 }
 box('solid',front+.045,.55,0,.073,.14,.39,'#e3dec8');
 box('solid',back-.045,.54,0,.073,.14,.39,'#e3dec8');
 // Cabin details visible through glazing.
 const seatColor=style==='bus'?'#47615d':'#5b6665';
 const seats=style==='bus'?[-1.7,-.40,.89,2.05]:style==='van'?[-.42,1.0]:[-.30,.68];
 for(const sx of seats)for(const sign of [-1,1]){
  const z=sign*.40;
  box('solid',sx,.86,z,.57,.20,.55,seatColor);
  box('solid',sx-.18,1.10,z,.17,.65,.53,seatColor);
  box('solid',sx-.22,1.47,z,.18,.18,.48,'#495555');
 }
 box('solid',spec.front-.35,1.03,0,.26,.12,W-.34,charcoal);
 box('solid',spec.front-.35,1.24,-.39,.10,.21,.27,charcoal);
 // Side-dependent body identity and decorative roof features.
 if(style==='suv'||style==='van'){
  for(const sign of [-1,1]){
   box('solid',(spec.roofBack+spec.roofFront)/2,top+.095,sign*(cabSide-.11),
     spec.roofFront-spec.roofBack-.08,.105,.10,'#525e5e');
  }
 }
 if(style==='pickup'){
  box('solid',back+.72,.93,0,1.8,.12,W-.26,charcoal);
  for(const sign of [-1,1])box('solid',back+.70,1.01,sign*(W/2-.08),1.95,.24,.13,tint);
  box('solid',back+.06,1.00,0,.16,.35,W-.09,tint);
  for(let i=0;i<3;i++)box('solid',back+.44+i*.42,.98,0,.045,.04,W-.35,'#71807d');
 }
 if(style==='coupe'){
  box('solid',back+.30,shoulder+.13,0,.43,.11,W*.77,'#343e45');
  box('solid',back+.45,shoulder+.19,0,.045,.13,W*.77,charcoal);
 }
 if(style==='bus'){
  for(const sign of [-1,1]){
   const z=sign*(W/2+.035);
   box('solid',0,1.38,z,L-.24,.15,.046,'#3c5461');
   box('solid',0,1.24,z,L-.24,.10,.05,'#e3b85c');
  }
  box('solid',front+.045,1.85,0,.045,.33,W-.22,'#dfd6ab');
  box('lights',front+.06,1.87,0,.07,.18,.83,'#d5eff2');
  for(const z of [-W*.28,W*.28])box('lights',front+.048,top-.16,z,.08,.10,.18,'#e59b59');
 }
 if(style==='van'){
  for(const sign of [-1,1]){
   box('solid',back+.73,1.29,sign*(W/2+.035),.09,.83,.05,'#d8e3dc');
   box('solid',back+.53,1.68,sign*(W/2+.05),.28,.09,.05,'#f6e4b0');
   box('solid',back+.70,1.18,sign*(W/2+.05),.29,.07,.05,charcoal);
  }
 }
 // Emit three compact geometries rather than dozens of draw calls per vehicle.
 for(const type of ['solid','glass','lights']){
  if(!p[type].length)continue;
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(p[type],3));
  geo.setAttribute('color',new T.Float32BufferAttribute(c[type],3));
  geo.computeVertexNormals();
  const material=type==='glass'
   ?new T.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:.78,depthWrite:false,side:T.DoubleSide})
   :type==='lights'
    ?new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide})
    :new T.MeshLambertMaterial({vertexColors:true,flatShading:true,side:T.DoubleSide});
  const mesh=new T.Mesh(geo,material);
  mesh.name=type+' details';mesh.castShadow=type==='solid'&&!low;mesh.receiveShadow=type==='solid';
  mesh.renderOrder=type==='glass'?2:0;
  root.add(mesh);
 }
 const wheels=[];
 // Independent rolling wheels with visible rims and 5-spoke hubs.
 const tireMat=new T.MeshLambertMaterial({color:'#263036'});
 const rimMat=new T.MeshLambertMaterial({color:'#c3cbca',flatShading:true});
 const hubMat=new T.MeshLambertMaterial({color:'#586b71',flatShading:true});
 const tireGeo=new T.CylinderGeometry(r,r,.22,low?10:18);
 const rimGeo=new T.CylinderGeometry(r*.63,r*.63,.246,low?10:18);
 const hubGeo=new T.CylinderGeometry(r*.19,r*.19,.257,low?8:12);
 for(const x of [-half+r*1.76,half-r*1.76])for(const sign of [-1,1]){
  const pivot=new T.Group();pivot.position.set(x,r+.07,sign*(W/2+.045));
  const rubber=new T.Mesh(tireGeo,tireMat);rubber.rotation.x=Math.PI/2;pivot.add(rubber);
  const rim=new T.Mesh(rimGeo,rimMat);rim.rotation.x=Math.PI/2;pivot.add(rim);
  const hub=new T.Mesh(hubGeo,hubMat);hub.rotation.x=Math.PI/2;hub.position.z=sign*.132;pivot.add(hub);
  if(!low){
   const spokes=new T.Group();spokes.position.z=sign*.147;
   for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5,spoke=new T.Mesh(new T.BoxGeometry(r*.58,.061,.04),hubMat);
    spoke.position.set(Math.cos(a)*r*.28,Math.sin(a)*r*.28,0);
    spoke.rotation.z=a;spokes.add(spoke);
   }pivot.add(spokes);
  }
  root.add(pivot);wheels.push(pivot);
 }
 if(style==='van'||style==='bus'){
  for(const sign of [-1,1])decal(style==='bus'?'LUMENVALE SCHOOL':'LUMENVALE',sign,back+.96,
   style==='bus'?1.25:1.53,sign*(W/2+.105),style==='bus'?2.15:1.44,.22,'#f5f2e7');
 }
 root.userData.vehicle={style,name:spec.name,paint:tint,wheelRadius:r,length:L,width:W};
 return {group:root,wheels,style,wheelRadius:r,spec};
}
function animateLumenVehicle(model,distance,steer=0){
 if(!model?.wheels)return;
 const angle=distance/(model.wheelRadius||.4);
 model.wheels.forEach((wheel,i)=>{
  wheel.rotation.z=-angle;
  if(i>=2)wheel.rotation.y=Math.max(-.2,Math.min(.2,steer));
 });
}
