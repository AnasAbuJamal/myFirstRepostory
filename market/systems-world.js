/* Optional decorative district that responds to city services and the economy. */
function createLumenWorld({T,exterior,box,renderer}){
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
 function truck(color){
  const group=new T.Group();
  b(group,0,.65,0,2.75,.74,1.42,color);
  b(group,-.56,1.18,0,1.20,.77,1.34,color);
  b(group,-.75,1.23,-.70,.70,.48,.05,colors.glass);
  b(group,1.03,1.16,0,.58,.95,1.3,'#c6b698');
  for(const x of [-.92,.95])for(const z of [-.73,.73]){
   const tire=column(group,x,.37,z,.32,.16,'#293532');tire.rotation.x=Math.PI/2;
  }
  b(group,-1.39,.72,-.49,.1,.18,.22,'#f8e3b0');
  return group;
 }
 // Pedestrian mailbox at the office exit.
 const mailbox=new T.Group();mailbox.position.set(6.15,0,-7.0);root.add(mailbox);
 column(mailbox,0,1.0,0,.105,2.0,'#74634d');
 b(mailbox,0,2.03,0,.93,.73,.55,'#c25a4a');
 b(mailbox,0,2.43,0,1.0,.10,.68,'#813e37');
 b(mailbox,0,2.11,-.29,.70,.095,.035,'#f1d492');
 sign(mailbox,'MAIL',0,1.81,-.30,.74,.20);
 // City Hall - permanent municipal hub.
 const hall=new T.Group();hall.position.set(-7,0,13.5);root.add(hall);
 b(hall,0,.21,0,6.5,.40,5.4,'#d5c4a3');
 b(hall,0,2.25,.25,5.9,3.9,4.8,'#b7a187');
 b(hall,0,4.28,.25,6.5,.22,5.25,'#527466');
 for(const x of [-2.48,-.83,.83,2.48])column(hall,x,1.9,-2.2,.19,3.1,'#e2d9c2');
 b(hall,0,1.19,-2.24,1.13,2.0,.14,'#85634d');
 sign(hall,'CITY HALL',0,3.74,-2.35,3.3,.52);
 // Business warehouse and goods loading bay.
 const depot=new T.Group();depot.position.set(23.5,0,6.0);root.add(depot);
 b(depot,0,1.5,1.4,7.4,3.0,5.4,'#9baca5');
 b(depot,0,3.03,1.4,7.75,.23,5.75,'#617a74');
 b(depot,-1.75,1.30,-1.36,2.78,2.3,.12,'#536c65');
 b(depot,1.8,1.30,-1.36,2.3,2.3,.12,'#c5b9a0');
 for(let i=0;i<5;i++){b(depot,-2.75+i*1.25,.43,-2.6,.94,.78,.66,'#ad875b');}
 sign(depot,'CITY WAREHOUSE',0,2.67,-1.49,4.7,.47);
 // Cars travel along the road and change the view without a cutscene.
 const traffic=[truck('#e6ad63'),truck('#5b99a1'),truck('#c67968')];
 traffic.forEach(car=>root.add(car));
 const addUpgrade=(id,x,z,build)=>{
  const obj=new T.Group();obj.position.set(x,0,z);root.add(obj);obj.visible=false;
  build(obj);return [id,obj];
 };
 const upgrades=new Map([
 addUpgrade('garden',4,3,g=>{
  for(let i=0;i<13;i++){
   const theta=i*2.4,px=Math.cos(theta)*(1.1+i%3*.39),pz=Math.sin(theta)*(1.1+i%3*.39);
   column(g,px,.24,pz,.20,.47,'#b17f61');sphere(g,px,.66,pz,.44,i%2?'#75a66e':'#659e80');
  }
 }),
 addUpgrade('lights',0,0,g=>{
  for(const [x,z] of [[-2,5],[9,26],[24,25],[-24,19],[30,6]]){
   column(g,x,1.85,z,.095,3.7,'#667e76');
   sphere(g,x,3.86,z,.36,'#f9dfaa');
  }
 }),
 addUpgrade('home',25,32,g=>{
  house(g,0,0,6.1,3.2,4.8,'#d1aa83');
  sign(g,'MY HOME',0,2.85,-2.49,2.8,.37);
 }),
 addUpgrade('delivery',23,9,g=>g.add(truck('#d4cb9f'))),
 addUpgrade('power',-39,30,g=>{
  for(const x of [-2,0,2])for(const z of [-2,0,2]){
   column(g,x,.65,z,.12,1.28,'#84908b');
   const pane=b(g,x,1.30,z,1.66,.09,1.21,'#567c9b');pane.rotation.x=-.33;
  }
 }),
 addUpgrade('office',-12,-1,g=>{
  house(g,0,0,6.7,4.2,5.6,'#9ebbb5');
  sign(g,'HEADQUARTERS',0,3.8,-2.88,4.2,.50);
 }),
 addUpgrade('research',36,-3,g=>{
  house(g,0,0,6.9,4.0,5.6,'#bccdc9');
  sphere(g,0,4.54,0,.5,'#a5d5d6');
  sign(g,'RESEARCH LAB',0,3.57,-2.91,4.1,.50);
 }),
 addUpgrade('train',-2,33,g=>{
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
 const pedestrians=[];
 function figure(x,z,coat){
  const rig=new T.Group();rig.position.set(x,0,z);root.add(rig);
  const legs=[];
  for(const px of [-.13,.13])legs.push(b(rig,px,.40,0,.21,.75,.23,'#42544c'));
  b(rig,0,1.06,0,.54,.60,.29,coat);
  sphere(rig,0,1.61,0,.23,'#d3a17a');
  sphere(rig,0,1.76,-.01,.21,'#544034');
  return {rig,legs,x,z};
 }
 pedestrians.push(figure(9,15,'#8ba2b8'),figure(-18,24,'#b68f78'),figure(17,28,'#b28a9f'));
 function update(now,view){
  const phase=now*.001;
  for(let i=0;i<traffic.length;i++){
   const car=traffic[i],distance=(phase*(i+1)*1.15+i*23)%78;
   car.position.set(-37+distance,0,i===1?26:18);
   car.rotation.y=i===1?Math.PI:0;
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
    van.position.set(view.player.x,0,view.player.z);
    van.rotation.y=view.player.yaw+Math.PI/2;
   }else{
    van.position.set(23,0,9);
    van.rotation.y=0;
   }
  }
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  pedestrians.forEach((p,i)=>{
   const walking=Math.sin(phase*(.8+i*.12)+i);
   p.rig.position.x=p.x+walking*1.25;
   p.rig.rotation.y=walking*.3;
   p.legs[0].rotation.x=Math.sin(phase*3+i)*.18;
   p.legs[1].rotation.x=-Math.sin(phase*3+i)*.18;
  });
 }
 return {update};
}
