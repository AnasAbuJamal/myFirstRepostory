/* Detailed walkable 3D city extension for the existing Three.js scene. */
function createCityWorld({T,exterior,box,piece,renderer}){
 const city=new T.Group();
 exterior.add(city);
 const low=renderer.isSoftware;
 const PI=Math.PI;
 const mat=new Map();
 function material(color){
  if(!mat.has(color))mat.set(color,new T.MeshLambertMaterial({color,flatShading:true,side:T.DoubleSide}));
  return mat.get(color);
 }
 function b(g,x,y,z,w,h,d,color){return box(g,x,y,z,w,h,d,color);}
 function roof(g,x,y,z,w,d,color){
  const l=b(g,x-w*.23,y,z,w*.57,.16,d+.25,color);
  const r=b(g,x+w*.23,y,z,w*.57,.16,d+.25,color);
  l.rotation.z=.36;r.rotation.z=-.36;
  b(g,x,y+.19,z,.16,.16,d+.3,'#f5dca5');
 }
 function cylinder(g,x,y,z,r,h,color,segments=8){
  const geo=new T.CylinderGeometry(r,r,h,segments);
  const mesh=new T.Mesh(geo,material(color));
  mesh.position.set(x,y,z);g.add(mesh);return mesh;
 }
 function sphere(g,x,y,z,r,color){
  const mesh=new T.Mesh(new T.IcosahedronGeometry(r,low?0:1),material(color));
  mesh.position.set(x,y,z);g.add(mesh);return mesh;
 }
 function sign(g,title,x,y,z,w=4,h=.7,color='#294837'){
  b(g,x,y,z,w,h,.13,color);
  if(low)return;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.fillStyle='#294837';ctx.fillRect(0,0,512,128);
  ctx.fillStyle='#f5dbab';ctx.font='bold 38px sans-serif';ctx.textAlign='center';
  ctx.fillText(title.toUpperCase(),256,79,495);
  const image=new T.CanvasTexture(canvas);image.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(w-.15,h-.1),new T.MeshBasicMaterial({map:image,transparent:false,side:T.DoubleSide}));
  mesh.position.set(x,y,z-.075);g.add(mesh);
 }
 function person(g,x,z,shirt,hair='#443529'){
  const rig=new T.Group();rig.position.set(x,0,z);g.add(rig);
  const left=new T.Group(),right=new T.Group();
  left.position.set(-.18,.78,0);right.position.set(.18,.78,0);
  b(left,0,-.37,.0,.22,.76,.27,'#394844');
  b(right,0,-.37,.0,.22,.76,.27,'#364643');
  b(left,0,-.72,-.07,.26,.15,.38,'#3d3027');
  b(right,0,-.72,-.07,.26,.15,.38,'#3d3027');
  rig.add(left,right);
  b(rig,0,1.08,0,.62,.67,.34,shirt);
  const armL=new T.Group(),armR=new T.Group();
  armL.position.set(-.38,1.3,0);armR.position.set(.38,1.3,0);
  b(armL,0,-.25,0,.16,.56,.19,shirt);
  b(armR,0,-.25,0,.16,.56,.19,shirt);
  rig.add(armL,armR);
  cylinder(rig,0,1.58,0,.13,.17,'#ba805a',7);
  sphere(rig,0,1.87,0,.30,'#c9906b');
  const hairMesh=sphere(rig,0,2.06,.015,.29,hair);hairMesh.scale.y=.48;
  for(const ex of [-.105,.105])sphere(rig,ex,1.88,-.266,.025,'#2f392f');
  return {rig,left,right,armL,armR,x,z};
 }
 function plant(g,x,z,scale=1){
  b(g,x,.24*scale,z,.44*scale,.48*scale,.44*scale,'#aa734e');
  cylinder(g,x,.49*scale,z,.27*scale,.11*scale,'#c08b5c');
  for(let i=0;i<5;i++){
   const a=i*PI*2/5;
   const leaf=piece(g,'cone',x+Math.cos(a)*.27*scale,.83*scale,z+Math.sin(a)*.27*scale,
    .27*scale,.72*scale,.25*scale,i%2?'#4e8d5d':'#6fa36a');
   leaf.rotation.z=Math.sin(a)*.26;
  }
 }
 // Streets form a city grid and lead out from the Market Office.
 b(city,14,-.015,18,3.9,.07,45,'#d3bb8f');
 b(city,-11,-.02,18,57,.055,3.2,'#d0b78b');
 b(city,31,-.016,16,3.6,.07,24,'#d0b78b');
 b(city,-27,-.016,18,3.5,.06,29,'#d0b78b');
 b(city,0,-.021,26,64,.055,2.2,'#e0c99f');
 for(let x=-36;x<38;x+=4.5){
  b(city,x,.015,18,1.8,.012,.045,'#f4e9c9');
  b(city,x,.015,26,1.15,.012,.034,'#fff2d8');
 }
 for(let z=0;z<35;z+=4.6)b(city,14,.015,z,.055,.015,1.8,'#f2e9c9');
 // Library pavilion and individual book stacks.
 const lib=new T.Group();lib.position.set(14,0,11);city.add(lib);
 b(lib,0,-.015,0,11.6,.08,9.7,'#d9c8a2');
 b(lib,0,.08,0,11.2,.07,9.2,'#e3d5b7');
 for(const x of [-5.24,5.24])for(const z of [-4.15,4.15]){
  b(lib,x,2.04,z,.33,4,.33,'#e9d5ad');
  b(lib,x,3.15,z,.55,.18,.55,'#c49d69');
 }
 b(lib,0,4.20,0,12.15,.25,10.35,'#557c64');
 roof(lib,0,4.42,0,12.1,10.5,'#466d57');
 b(lib,0,3.55,-4.79,5.8,1.0,.28,'#294b3f');
 sign(lib,'THE READING LIBRARY',0,3.57,-4.94,5.5,.7);
 // Shelves visible through the open front.
 for(const x of [-3.7,0,3.7]){
  const shelf=new T.Group();shelf.position.set(x,0,1.2);lib.add(shelf);
  b(shelf,0,1.3,0,2.35,2.45,.46,'#7d583a');
  b(shelf,0,1.40,-.31,2.22,2.22,.09,'#a17a4d');
  for(let level=0;level<3;level++){
   b(shelf,0,.5+level*.68,-.48,2.5,.10,.67,'#78553c');
   for(let i=0;i<9;i++){
    const col=['#c65f53','#c49a4a','#447b84','#967b9b','#6b9558','#c37556'][((i+level*2+Math.round(x))%6+6)%6];
    b(shelf,-.96+i*.235,.75+level*.68,-.48,.17,.42+(i%3)*.055,.29,col).rotation.z=i%4===0?.07:0;
   }
  }
 }
 b(lib,0,.49,-2.65,4.3,.92,.66,'#ad835c');
 b(lib,0,1.01,-2.65,4.55,.14,.83,'#c8a079');
 for(let i=0;i<5;i++)b(lib,-1.48+i*.70,1.13,-2.65,.46,.12,.31,['#5a7d67','#b87551','#758eb4'][i%3]);
 plant(lib,-4.7,-2.8,.75);plant(lib,4.7,-2.8,.75);
 const librarian=person(lib,2.65,-2.7,'#6c8eac','#6b4b37');
 const readers=[person(lib,-4.15,-.7,'#b46d62','#543b32'),person(lib,4.15,2.25,'#b99b56','#3d3530')];
 for(const p of readers)p.rig.scale.set(.91,.91,.91);
 // Plaza fountain and garden beds.
 const park=new T.Group();park.position.set(0,0,11.6);city.add(park);
 cylinder(park,0,.28,0,2.2,.45,'#a6b7ad',12);
 cylinder(park,0,.53,0,1.97,.17,'#78b0b6',12);
 cylinder(park,0,1.1,0,.28,1.0,'#ccd9cf',10);
 sphere(park,0,1.67,0,.39,'#88bfd0');
 for(let i=0;i<8;i++){
  const a=i*PI/4;
  plant(park,Math.cos(a)*3.3,Math.sin(a)*3.3,.65);
 }
 // Decorative lamps, benches, market awnings, and trees.
 for(const [x,z] of [[7,5],[21,5],[7,20],[21,20],[-19,18],[-35,18],[29,24],[-4,30]]){
  cylinder(city,x,1.8,z,.095,3.6,'#56665d');
  sphere(city,x,3.72,z,.3,'#f5d8a2');
  cylinder(city,x,3.44,z,.30,.15,'#4b5e52');
 }
 for(const [x,z] of [[6,10],[7,28],[23,9],[-16,30]]){
  b(city,x,.46,z,2.3,.20,.55,'#9f754f');
  for(const a of [-.86,.86])b(city,x+a,.26,z,.13,.42,.12,'#78624d');
  b(city,x,.91,z+.23,2.3,.75,.13,'#9f754f');
 }
 for(const [x,z] of [[-37,3],[-38,32],[-5,33],[27,33],[38,27],[37,3],[-6,4]]){
  cylinder(city,x,1.0,z,.24,2,'#7a654c');
  sphere(city,x,3.0,z,1.45,'#4f805b');
  sphere(city,x-.64,2.75,z+.35,1.0,'#68986b');
  sphere(city,x+.59,2.95,z-.27,.92,'#588f5d');
 }
 // Empty plots become real production buildings once the player spends coins.
 const buildings=new Map();
 for(const site of CITY_SITES){
  const lot=new T.Group();lot.position.set(site.x,0,site.z);city.add(lot);
  b(lot,0,-.025,0,9.7,.085,8.4,'#b8aa84');
  for(const x of [-4.55,4.55])for(const z of [-3.55,3.55]){
   b(lot,x,.18,z,.16,.38,.16,'#bead7f');
   sphere(lot,x,.39,z,.14,'#e7c99e');
  }
  const signboard=new T.Group();signboard.position.set(0,0,-4.5);lot.add(signboard);
  for(const x of [-1.8,1.8])b(signboard,x,.68,0,.18,1.35,.22,'#81634b');
  sign(signboard,site.title,0,1.22,-.10,4.7,.64,site.color);
  // A purchased parcel visibly changes from a vacant lot to the player's property.
  const ownedLand=new T.Group();
  lot.add(ownedLand);
  for(const z of [-3.90,3.90]){
   b(ownedLand,0,.09,z,9.0,.17,.12,'#d4b265');
   for(const x of [-4.40,4.40])b(ownedLand,x,.48,z,.14,.88,.14,'#c1a059');
  }
  for(const x of [-4.40,4.40])b(ownedLand,x,.09,0,.12,.17,7.7,'#d4b265');
  b(ownedLand,0,.015,-2.95,2.1,.05,1.65,'#d6c293');
  b(ownedLand,-3.2,.035,2.85,1.35,.10,.9,'#66966c');
  b(ownedLand,3.2,.035,2.85,1.35,.10,.9,'#66966c');
  const ownedFlag=b(ownedLand,3.95,2.18,-3.6,.64,.31,.06,'#ebc87c');
  cylinder(ownedLand,3.95,1.22,-3.6,.045,2.42,'#646a56');
  ownedLand.visible=false;
  const landTiers=[];
  const paving=new T.Group();lot.add(paving);
  b(paving,0,.035,-2.4,3.9,.08,1.35,'#b9c6bb');
  for(const x of [-3.6,3.6])for(const z of [-2.95,2.50])cylinder(paving,x,.45,z,.30,.86,'#9cae9e');
  landTiers.push(paving);
  const garden=new T.Group();lot.add(garden);
  for(const x of [-3.6,3.6]){
   for(const z of [-1.5,1.65])plant(garden,x,z,.65);
   cylinder(garden,x,1.55,2.65,.075,3,'#5f715d');
   sphere(garden,x,3.15,2.65,.25,'#f0d49a');
  }
  landTiers.push(garden);
  const modern=new T.Group();lot.add(modern);
  for(const x of [-3.2,3.2]){
   b(modern,x,3.25,2.7,1.9,.12,1.0,'#567e82');
   b(modern,x,3.33,2.7,1.7,.025,.81,'#85b2bb');
   b(modern,x,1.55,2.7,.12,3.1,.12,'#9da99c');
  }
  landTiers.push(modern);
  landTiers.forEach(tier=>tier.visible=false);

  const crane=new T.Group();lot.add(crane);
  b(crane,3.9,2.45,3.35,.23,4.9,.23,'#c59d4b');
  b(crane,2.3,4.76,3.35,4.1,.18,.25,'#e1b967');
  b(crane,.55,3.15,3.35,.06,3.0,.06,'#c1c8b7');
  b(crane,.55,1.72,3.35,.42,.21,.29,'#b48d47');
  crane.visible=false;
  const active=new T.Group();lot.add(active);
  const workers=[];
  const motion=[];
  if(site.kind==='house'){
   for(let h=0;h<3;h++){
    const x=(h-1)*2.8;
    b(active,x,1.6,.5,2.55,3.15,4.5,['#bd946e','#d0ad82','#b58e74'][h]);
    roof(active,x,3.31,.5,2.75,4.9,'#6c735c');
    b(active,x,1.05,-1.82,.72,1.6,.08,'#6c513b');
    for(const dx of [-.72,.72])b(active,x+dx,2.25,-1.84,.51,.64,.10,'#96b5b6');
   }
   for(const [x,z,shirt] of [[-2.8,-2.6,'#9c755f'],[2.1,-2.55,'#6d92a0'],[0,2.0,'#aa7b81']])workers.push(person(active,x,z,shirt));
  }else{
   b(active,0,1.8,.5,7.25,3.58,5.6,site.color);
   b(active,0,3.59,.5,7.7,.22,5.9,'#485e61');
   for(const x of [-2.4,0,2.4]){
    b(active,x,2.22,-2.36,1.30,.96,.08,'#a6c3c4');
    b(active,x,2.20,-2.43,.10,1,.10,'#66858b');
   }
   b(active,0,1.1,-2.43,1.26,2.07,.14,'#6e6151');
   b(active,0,1.98,-2.53,.94,.12,.04,'#d8ac77');
   for(let x=-2.15;x<3;x+=1.05){
    b(active,x,.75,3.44,.75,1.1,.47,'#a98759');
    b(active,x,.82,3.72,.72,.11,.02,'#dfbc88');
   }
   for(const x of [-2.8,2.8]){
    cylinder(active,x,1.07,2.8,.35,.75,'#657470');
    sphere(active,x,1.58,2.8,.44,'#727d77');
   }
   // Conveyor and moving packages on the front platform.
   b(active,0,.52,-3.12,5.1,.25,.9,'#566765');
   for(let i=0;i<6;i++)cylinder(active,-2.1+i*.84,.55,-3.12,.19,.74,'#899d92').rotation.z=PI/2;
   for(let i=0;i<4;i++)motion.push(b(active,-1.8+i*.99,.80,-3.12,.56,.45,.52,'#cba571'));
   const chimney=cylinder(active,2.56,4.55,2.06,.52,2.05,'#987f74');
   cylinder(active,2.56,5.62,2.06,.62,.17,'#c6ad88');
   // Colored machinery behind the main wall for depth.
   for(const x of [-2.3,-.8,.9]){
    b(active,x,4.04,2.3,1.0,.48,1.6,'#5d7475');
    sphere(active,x,4.45,2.3,.26,'#b39a77');
   }
   for(let i=0;i<6;i++){
    const shirt=['#d49e59','#618da0','#ac755f'][i%3];
    workers.push(person(active,-2.2+(i%3)*2.1,-4.0+Math.floor(i/3)*.95,shirt));
   }
  }
  active.visible=false;
  buildings.set(site.id,{active,crane,ownedLand,landTiers,workers,motion,site,lot});
 }
 // A few town residents make the settlement feel alive before construction.
 const townspeople=[
  person(city,8,17,'#b16e63','#533c32'),
  person(city,20,18,'#75a18a','#2e372f'),
  person(city,-7,20,'#bc9c60','#5d453a'),
  person(city,5,27,'#9a80bb','#443b31')
 ];
 function update(saved,now){
  const time=now*.001;
  const pause=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const [id,entry] of buildings){
   const info=saved?.sites?.[id];
   entry.lot.position.set(entry.site.x,0,entry.site.z);
   entry.lot.rotation.y=(campusState.plots?.[id]?.rotation||0)*Math.PI/2;
   entry.ownedLand.visible=Boolean(info?.owned||info?.built);
   entry.landTiers.forEach((tier,i)=>tier.visible=Boolean(info?.owned && (info.landLevel||1)>=i+2));
   entry.active.visible=Boolean(info?.built);
   const age=Date.now()-(info?.builtAt||0);
   const constructing=Boolean(info?.builtAt&&age>=0&&age<6000);
   entry.crane.visible=constructing;
   entry.active.scale.y=constructing?Math.max(.08,age/6000):1;
   if(!entry.active.visible)continue;
   const present=entry.site.kind==='house'?entry.workers.length:Math.min(entry.workers.length,info.staff);
   entry.workers.forEach((person,i)=>{person.rig.visible=i<present;});
   for(let i=0;i<entry.motion.length;i++){
    const move=pause?0:((time*.43+i*.8)%5.0);
    entry.motion[i].position.x=-2.1+move;
   }
   // Factory machinery and people keep moving even while the player stands still.
   animatePeople(entry.workers, time, pause, id.length*.27);
  }
  animatePeople([librarian,...readers,...townspeople],time,pause,0);
 }
 function animatePeople(people,time,pause,offset){
  if(pause)return;
  people.forEach((p,i)=>{
   const t=time*(i%2?.63:.78)+offset+i*1.8;
   const step=Math.sin(t*4.0);
   p.left.rotation.x=step*.25;p.right.rotation.x=-step*.25;
   p.armL.rotation.x=-step*.20;p.armR.rotation.x=step*.20;
   p.rig.position.x=p.x+Math.sin(t)*.48;
   p.rig.position.z=p.z+Math.cos(t*.8)*.31;
   p.rig.rotation.y=Math.sin(t*.48)*.38;
  });
 }
 return {update};
}
function cityCanWalk(x,z){
 for(const site of CITY_SITES){
  if(!cityState.sites[site.id]?.built)continue;
  // Leave the construction sign and path in front accessible.
  if(Math.abs(x-site.x)<3.72 && z>site.z-2.60 && z<site.z+3.3)return false;
 }
 return true;
}
