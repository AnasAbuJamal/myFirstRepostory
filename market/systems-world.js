/* Optional decorative district that responds to city services and the economy. */
function createLumenWorld({T,exterior,box,piece,renderer}){
 const root=new T.Group();exterior.add(root);
 const low=Boolean(renderer?.isSoftware),palette=new Map();
 const colors={wood:'#986f4f',gold:'#e1bd76',stone:'#c9c1ae',glass:'#9cc8c7',road:'#718276'};
 function paint(color){
  if(!palette.has(color))palette.set(color,new T.MeshLambertMaterial({color,flatShading:true,side:T.DoubleSide}));
  return palette.get(color);
 }
 function b(g,x,y,z,w,h,d,c){return box(g,x,y,z,w,h,d,c);}
 function sphere(g,x,y,z,r,c){
  const mesh=new T.Mesh(new T.IcosahedronGeometry(r,low?0:1),paint(c));mesh.position.set(x,y,z);g.add(mesh);return mesh;
 }
 function column(g,x,y,z,r,h,c){
  const obj=new T.Mesh(new T.CylinderGeometry(r,r,h,8),paint(c));obj.position.set(x,y,z);g.add(obj);return obj;
 }
 function sign(g,title,x,y,z,w=3,h=.45){
  b(g,x,y,z,w,h,.08,'#2c5040');
  if(low)return;
  const cv=document.createElement('canvas');cv.width=512;cv.height=96;
  const ctx=cv.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#2c5040';ctx.fillRect(0,0,512,96);
  ctx.fillStyle='#f6e2ab';ctx.textAlign='center';ctx.font='bold 34px sans-serif';ctx.fillText(title,256,61,502);
  const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(w-.12,h-.08),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
  mesh.position.set(x,y,z-.06);g.add(mesh);
 }
 function house(g,x,z,w,h,d,c){
  b(g,x,h/2,z,w,h,d,c);
  b(g,x,h+.1,z,w+.4,.26,d+.4,'#56796c');
  b(g,x-.85,h*.54,z-d/2-.05,.75,.8,.06,colors.glass);
  b(g,x+.78,h*.40,z-d/2-.05,.8,1.55,.06,'#806149');
 }
 // Pedestrian mailbox at the office exit.
 const mailbox=new T.Group();mailbox.position.set(5.1,0,-4.12);root.add(mailbox);
 column(mailbox,0,.55,0,.095,1.1,'#606e67');
 b(mailbox,0,1.11,0,.93,.73,.55,'#c25a4a');
 b(mailbox,0,1.51,0,1.0,.10,.68,'#813e37');
 b(mailbox,0,1.19,-.29,.70,.095,.035,'#f1d492');
 sign(mailbox,'MAIL',0,.92,-.30,.74,.20);
 // Purpose-built 3D traffic, each vehicle with independent wheels and glass.
 const fleet=[
  {type:'compact',paint:'amber',speed:4.3,offset:3,direction:1,road:'Foundry Avenue',z:20.00},
  {type:'sedan',paint:'navy',speed:3.7,offset:34,direction:-1,road:'Foundry Avenue',z:22.75},
  {type:'suv',paint:'jade',speed:3.1,offset:72,direction:1,road:'Foundry Avenue',z:20.05},
  {type:'coupe',paint:'coral',speed:4.5,offset:49,direction:-1,road:'Park Avenue',z:42.65},
  {type:'pickup',paint:'charcoal',speed:3.0,offset:14,direction:1,road:'Park Avenue',z:40.27},
  {type:'bus',paint:'cream',speed:2.6,offset:82,direction:1,road:'Market Avenue',z:-11.25}
 ].map(def=>{
  const model=createLumenVehicle(T,def.type,{paint:def.paint,low});
  root.add(model.group);return {...def,model};
 });
 const personalVehicle=createLumenVehicle(T,'van',{paint:'cream',low});
 const addUpgrade=(id,build)=>{
  const {x,z}=CITY_UPGRADE_LOTS[id]||{x:0,z:0};
  const obj=new T.Group();obj.position.set(x,0,z);root.add(obj);obj.visible=false;
  build(obj);return [id,obj];
 };
 const upgrades=new Map([
 addUpgrade('garden',g=>{
  for(let i=0;i<13;i++){
   const theta=i*2.4,px=Math.cos(theta)*(1.1+i%3*.39),pz=Math.sin(theta)*(1.1+i%3*.39);
   column(g,px,.24,pz,.20,.47,'#b17f61');sphere(g,px,.66,pz,.44,i%2?'#75a66e':'#659e80');
  }
 }),
 addUpgrade('lights',g=>{
  for(const [x,z] of [[-11,45.95],[.15,46.25],[32.5,60.4],[-43.5,15.35],[32.5,5.45]]){
   column(g,x,1.85,z,.095,3.7,'#667e76');
   sphere(g,x,3.86,z,.36,'#f9dfaa');
  }
 }),
 addUpgrade('home',g=>{
  house(g,0,0,6.1,3.2,4.8,'#d1aa83');
  sign(g,'MY HOME',0,2.85,-2.49,2.8,.37);
 }),
 addUpgrade('delivery',g=>g.add(personalVehicle.group)),
 addUpgrade('power',g=>{
  for(const x of [-2,0,2])for(const z of [-2,0,2]){
   column(g,x,.65,z,.12,1.28,'#84908b');
   const pane=b(g,x,1.30,z,1.66,.09,1.21,'#567c9b');pane.rotation.x=-.33;
  }
 }),
 addUpgrade('office',g=>{
  house(g,0,0,6.7,4.2,5.6,'#9ebbb5');
  sign(g,'HEADQUARTERS',0,3.8,-2.88,4.2,.50);
 }),
 addUpgrade('research',g=>{
  house(g,0,0,6.9,4.0,5.6,'#bccdc9');
  sphere(g,0,4.54,0,.5,'#a5d5d6');
  sign(g,'RESEARCH LAB',0,3.57,-2.91,4.1,.50);
 }),
 addUpgrade('train',g=>{
  house(g,0,0,5.4,2.9,3.3,'#a4b5a5');
  sign(g,'TRAINING',0,2.60,-1.72,3.1,.45);
 })
 ]);
 // More animated residents and simple market signage.
 const hiddenChests=LV_TREASURES.map(cache=>{
  const chest=new T.Group();chest.position.set(cache.x,0,cache.z);
  b(chest,0,.25,0,.75,.46,.50,'#80624a');
  b(chest,0,.53,0,.83,.15,.59,'#d0b269');
  b(chest,0,.34,-.28,.13,.30,.04,'#ebd286');
  for(const x of [-.30,.30])b(chest,x,.49,-.29,.07,.20,.02,'#cdb274');
  root.add(chest);return {cache,chest};
 });
 const home=upgrades.get('home');
 const homeDecor=new Map();
 const flowers=new T.Group();
 for(const x of [-2.45,-1.75,1.75,2.45]){
  b(flowers,x,.34,-2.78,.4,.45,.40,'#b8896b');
  sphere(flowers,x,.74,-2.78,.32,x<0?'#f1b4ac':'#e2d17f');
 }home.add(flowers);homeDecor.set('flowers',flowers);
 const patio=new T.Group();
 b(patio,0,.16,-3.9,3.7,.26,2.9,'#b59a7b');
 b(patio,-1.3,.7,-3.9,.23,1.1,.90,'#7e624b');
 b(patio,1.3,.7,-3.9,.23,1.1,.9,'#7e624b');
 b(patio,0,.82,-3.9,2.2,.16,1.25,'#9d8263');
 home.add(patio);homeDecor.set('patio',patio);
 const solar=new T.Group();
 for(const x of [-1.6,0,1.6]){
  const panel=b(solar,x,3.45,.15,1.4,.08,1.8,'#547e99');panel.rotation.x=-.23;
  b(solar,x,3.52,.11,1.27,.03,.13,'#a2c4c9');
 }
 home.add(solar);homeDecor.set('solar',solar);
 const appearance=[
  {coat:'#527d91',skin:'#cda381',hair:'#342c29',pants:'#4e6267',style:'long',bag:true},
  {coat:'#ac784b',skin:'#9d624a',hair:'#352b28',pants:'#556659',style:'cap'},
  {coat:'#a05c78',skin:'#d39f7c',hair:'#6a4b36',pants:'#47595a',style:'short',bag:true},
  {coat:'#718654',skin:'#a16c56',hair:'#41332c',pants:'#4b6263',style:'long'},
  {coat:'#3e8271',skin:'#d2ad8f',hair:'#775639',pants:'#455957',style:'cap',bag:true},
  {coat:'#bd6c55',skin:'#8e5d4a',hair:'#302b29',pants:'#49596c',style:'short'},
 ];
 const citizens=LV_CHARACTERS.map((citizen,i)=>{
  const member=makeTownCitizen(T,piece,box,appearance[i]);
  member.rig.position.set(citizen.x,.08,citizen.z);
  member.rig.rotation.y=[-1.4,.25,1.2][i];
  root.add(member.rig);
  return member;
 });
 const pedestrians=TOWN_WALKS.map((path,i)=>{
  const member=makeTownCitizen(T,piece,box,appearance[(i+3)%appearance.length]);
  member.rig.position.set(path.x,.074,path.z);
  member.rig.rotation.y=Math.PI/2;
  root.add(member.rig);
  return {...member,...path};
 });
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 function update(now,view){
  const phase=now*.001;
  for(const car of fleet){
   const road=STREET_PLAN.find(s=>s.name===car.road);
   const start=road?.from??-50,end=road?.to??60,length=end-start;
   const distance=motion.matches?car.offset:phase*car.speed+car.offset;
   const travel=((distance%length)+length)%length;
   car.model.group.position.set(car.direction===1?start+travel:end-travel,.09,car.z);
   car.model.group.rotation.y=car.direction===1?0:Math.PI;
   animateLumenVehicle(car.model,distance*car.direction);
  }
  for(const [id,group] of upgrades)group.visible=Boolean(systemsState.upgrades[id]);
  for(const [id,group] of homeDecor)group.visible=Boolean(systemsState.homeDecor?.[id]);
  for(const item of hiddenChests){
   item.chest.visible=cityCompleted()>=item.cache.unlock&&!systemsState.treasures.includes(item.cache.id);
   if(item.chest.visible)item.chest.rotation.y=Math.sin(phase*.55)*.09;
  }
  if(upgrades.get('delivery').visible){
   const van=upgrades.get('delivery');
   if(systemsDriving&&view?.player){
    van.position.set(view.player.x,.09,view.player.z);
    van.rotation.y=view.player.yaw+Math.PI/2;
    animateLumenVehicle(personalVehicle,phase*9.5);
   }else{
    van.position.set(CITY_UPGRADE_LOTS.delivery.x,.09,CITY_UPGRADE_LOTS.delivery.z);
    van.rotation.y=0;
    animateLumenVehicle(personalVehicle,0);
   }
  }
  if(motion.matches)return;
  citizens.forEach((person,i)=>{
   person.arms[0].rotation.x=Math.sin(phase*1.2+i)*.075;
  });
  pedestrians.forEach((person,i)=>{
   const travel=phase*.49+i*1.75, stride=Math.sin(phase*6+i)*.36;
   person.rig.position.x=person.x+Math.sin(travel)*person.span;
   person.rig.rotation.y=Math.cos(travel)>=0?Math.PI/2:-Math.PI/2;
   person.legs.forEach((leg,side)=>{leg.rotation.x=side?stride:-stride;});
   person.arms.forEach((arm,side)=>{arm.rotation.x=side?-stride*.72:stride*.72;});
  });
 }
 return {update};
}
