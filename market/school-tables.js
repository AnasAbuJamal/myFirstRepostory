/* Original reusable LumenVale furniture. 3D meshes, not image billboards.
 * All dimensions are in meters. Instancing reduces hundreds of parts to a
 * few material batches. The two matching GLBs are separately downloadable.
 */
const LV_SCHOOL_FURNITURE_CACHE=new WeakMap();
function createSchoolFurnitureTable(T,variant='classroom',low=false){
 if(!['classroom','library'].includes(variant))throw Error('Invalid LumenVale table variant');
 let shared=LV_SCHOOL_FURNITURE_CACHE.get(T);
 if(!shared){
  const texture=kind=>{
   const c=document.createElement('canvas'),wood=kind!=='steel',size=wood?512:256;
   c.width=c.height=size;const ctx=c.getContext('2d');
   if(!ctx)throw Error('School texture canvas failed');
   let seed=kind==='walnut'?105731:kind==='endgrain'?78419:3348;
   const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   ctx.fillStyle=kind==='walnut'?'#795039':kind==='endgrain'?'#583928':'#41494d';
   ctx.fillRect(0,0,size,size);
   if(wood){
    for(let i=0;i<350;i++){
     const y=i*size/350+(random()-.5)*2.2;
     ctx.strokeStyle=i%5?'rgba(237,186,135,.13)':'rgba(31,14,8,.22)';
     ctx.lineWidth=i%8===0?1.2:.6;
     ctx.beginPath();
     for(let x=0;x<=size;x+=8){
      const v=y+Math.sin(x*.025+i*.19)*1.65+Math.cos(x*.081+i)*.42;
      if(x===0)ctx.moveTo(x,v);else ctx.lineTo(x,v);
     }ctx.stroke();
    }
    for(let n=0;n<8;n++){
     const x=36+random()*(size-72),y=36+random()*(size-72);
     ctx.strokeStyle='rgba(36,16,7,.26)';ctx.lineWidth=.9;
     for(let i=1;i<=3;i++){
      ctx.beginPath();ctx.ellipse(x,y,i*7,i*1.8,.06,0,Math.PI*2);ctx.stroke();
     }
    }
    for(let n=0;n<95;n++){
     const x=random()*size,y=random()*size;
     ctx.strokeStyle='rgba(255,229,180,.09)';ctx.beginPath();
     ctx.moveTo(x,y);ctx.lineTo(Math.min(x+6+random()*34,size),y+(random()-.5)*2);ctx.stroke();
    }
   }else{
    const shine=ctx.createLinearGradient(0,0,size,0);
    shine.addColorStop(0,'rgba(0,0,0,.22)');shine.addColorStop(.23,'rgba(255,255,255,.11)');
    shine.addColorStop(.62,'rgba(0,0,0,.06)');shine.addColorStop(1,'rgba(250,250,250,.12)');
    ctx.fillStyle=shine;ctx.fillRect(0,0,size,size);
    for(let i=0;i<1500;i++){
     ctx.fillStyle=i%2?'rgba(255,255,255,.06)':'rgba(0,0,0,.07)';
     ctx.fillRect(random()*size,random()*size,.5+random()*1.4,.6+random()*1.2);
    }
   }
   const out=new T.CanvasTexture(c);out.colorSpace=T.SRGBColorSpace;
   out.wrapS=out.wrapT=T.RepeatWrapping;out.anisotropy=4;return out;
  };
  const material=(color,map,roughness,metalness)=>new T.MeshStandardMaterial({
   color,map,roughness,metalness
  });
  shared={
   geometries:{block:new T.BoxGeometry(1,1,1),bolt:new T.CylinderGeometry(.5,.5,1,12)},
   materials:{
    walnut:material('#ffffff',texture('walnut'),.52,0),
    deep:material('#ffffff',texture('endgrain'),.65,0),
    steel:material('#ffffff',texture('steel'),.68,.45),
    worn:material('#8f9491',null,.49,.68),
    dark:material('#2d3131',null,.72,.28),
    bolt:material('#bec4c0',null,.34,.87),
    rubber:material('#242726',null,.91,0)
   }
  };
  LV_SCHOOL_FURNITURE_CACHE.set(T,shared);
 }
 const root=new T.Group(),batches=new Map();
 const w=variant==='library'?2.46:2.36,d=variant==='library'?1.26:1.18;
 const y=.795,h=variant==='library'?.132:.12,legX=w*.5-.16,legZ=d*.5-.14;
 let count=0;
 function box(type,x,cy,z,sx,sy,sz,rotationZ=0){
  const key=type+':block';if(!batches.has(key))batches.set(key,[]);
  batches.get(key).push({x,y:cy,z,w:sx,h:sy,d:sz,rx:0,rz:rotationZ});
  count++;
 }
 function bolt(x,y,z,axis='front',diameter=.047){
  if(low)return;
  const key='bolt:bolt';if(!batches.has(key))batches.set(key,[]);
  batches.get(key).push({x,y,z,w:diameter,h:.016,d:diameter,rx:axis==='front'?Math.PI/2:0,rz:axis==='side'?Math.PI/2:0});
  count++;
 }
 // Rich walnut slab, visible end-grain and gently worn rounded-edge bands.
 box('walnut',0,y,0,w,h,d);
 for(const s of [-1,1]){
  box('deep',0,y+h*.29,s*(d*.5-.015),w-.034,.022,.032);
  box('deep',s*(w*.5-.017),y+h*.29,0,.034,.022,d-.04);
 }
 if(variant==='library'&&!low){
  for(const s of [-1,1]){
   box('dark',0,y+h*.5+.003,s*(d*.5-.078),w-.155,.006,.008);
   box('dark',s*(w*.5-.078),y+h*.5+.003,0,.008,.006,d-.155);
  }
 }
 // Four true square-tube legs, top mounting plates, hardware and rubber caps.
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const px=sx*legX,pz=sz*legZ;
  box('steel',px,.375,pz,.112,.68,.112);
  box('rubber',px,.05,pz,.134,.088,.134);
  box('worn',px,.675,pz,.137,.10,.137);
  if(!low){
   box('worn',px+sx*.058,.39,pz-sz*.040,.008,.45,.009);
   bolt(px,.653,pz+sz*.083);
   bolt(px-.023,.633,pz+sz*.083,.047);
   bolt(px+.039,.681,pz+sz*.083,.04);
  }
  if(variant==='library'&&!low){
   box('walnut',px-sx*.032,.69,pz+sz*.086,.092,.038,.027);
   box('deep',px-sx*.032,.744,pz+sz*.086,.092,.037,.027);
  }
 }
 for(const sz of [-1,1])box(variant==='library'?'deep':'steel',0,.674,sz*legZ,w-.22,.135,.071);
 for(const sx of [-1,1])box(variant==='library'?'deep':'steel',sx*legX,.674,0,.07,.135,d-.24);
 if(variant==='classroom'){
  // Exposed welded stretcher structure and small triangular-gusset accents.
  for(const sx of [-1,1])for(const sz of [-1,1]){
   box('worn',sx*(legX-.15),.60,sz*legZ,.22,.025,.060);
   box('steel',sx*legX,.59,sz*(legZ-.15),.065,.175,.056);
   bolt(sx*(legX-.14),.602,sz*(legZ+.038),'front',.032);
  }
  for(const sx of [-1,1])box('steel',sx*legX,.205,0,.071,.072,d-.18);
  for(const sz of [-1,1])box('steel',0,.205,sz*legZ,w-.22,.072,.073);
  box('dark',0,.25,0,w-.24,.055,.057);
 }else{
  // Premium under-shelf and bolted steel frame for long library study sessions.
  const shelf=.284;
  box('deep',0,shelf,0,w-.28,.068,d-.27);
  for(const sz of [-1,1]){
   box('steel',0,shelf-.015,sz*(d*.5-.115),w-.245,.078,.068);
   for(const sx of [-1,1])bolt(sx*(w*.5-.175),shelf+.012,sz*(d*.5-.08));
  }
  for(const sx of [-1,1])box('steel',sx*(w*.5-.115),shelf-.015,0,.064,.078,d-.245);
  if(!low)for(const sx of [-1,1])for(const sz of [-1,1])
   box('walnut',sx*(w*.5-.11),.722,sz*(d*.5-.035),.10,.044,.04);
 }
 const scratch=new T.Object3D();
 for(const [key,items] of batches){
  const [type,geometry]=key.split(':');
  const instanced=new T.InstancedMesh(shared.geometries[geometry],shared.materials[type],items.length);
  for(let i=0;i<items.length;i++){
   const q=items[i];scratch.position.set(q.x,q.y,q.z);
   scratch.rotation.set(q.rx,0,q.rz);scratch.scale.set(q.w,q.h,q.d);
   scratch.updateMatrix();instanced.setMatrixAt(i,scratch.matrix);
  }
  instanced.computeBoundingSphere();
  instanced.name='LumenVale table '+variant+' '+type;
  instanced.receiveShadow=true;instanced.castShadow=!low;
  root.add(instanced);
 }
 root.name='LumenVale '+variant+' 3D walnut/steel table';
 root.userData.tableAsset={variant,parts:count,width:w,depth:d,height:y+h*.5,
  materialCount:root.children.length,textured:true,instanced:true};
 return root;
}
