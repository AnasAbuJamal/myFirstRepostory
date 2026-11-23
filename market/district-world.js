function createDistrictWorld({T,scene,exterior,renderer}){
 const geometries={
  block:new T.BoxGeometry(1,1,1),
  trunk:new T.CylinderGeometry(.75,1,1,8),
  stone:new T.IcosahedronGeometry(1,renderer.isSoftware?0:1),
 };
 const paint = new T.MeshLambertMaterial({color:'#ffffff',flatShading:true});
 const lampPaint = new T.MeshBasicMaterial({color:'#ffffff'});
 const tint=new T.Color(), object=new T.Object3D();
 const outside=new T.Group(), inside=new T.Group();
 outside.name='LumenVale district plan';
 exterior.add(outside);
 scene.add(inside);
 inside.visible=false;
 function kit(){
  const shapes=new Map();
  function put(form,x,y,z,w,h,d,color,rx=0,ry=0,rz=0,lit=false){
   const key=lit?'light':form;
   if(!shapes.has(key))shapes.set(key,[]);
   shapes.get(key).push({x,y,z,w,h,d,color,rx,ry,rz});
  }
  function box(...v){put('block',...v);}
  function flush(group){
   for(const [form,items] of shapes){
    const mesh=new T.InstancedMesh(geometries[form==='light'?'block':form],form==='light'?lampPaint:paint,items.length);
    items.forEach((v,i)=>{
     object.position.set(v.x,v.y,v.z);
     object.scale.set(v.w,v.h,v.d);
     object.rotation.set(v.rx,v.ry,v.rz);
     object.updateMatrix();
     mesh.setMatrixAt(i,object.matrix);
     mesh.setColorAt(i,tint.set(v.color));
    });
    mesh.computeBoundingSphere();
    group.add(mesh);
   }
  }
  function light(x,y,z,w,h,d,color){put('block',x,y,z,w,h,d,color,0,0,0,true);}
  return {box,put,light,flush};
 }
 function sign(group,title,x,y,z,width,height,face=1,color='#29433f'){
  const canvas=document.createElement('canvas');
  canvas.width=640;canvas.height=140;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.fillStyle=color;ctx.fillRect(0,0,640,140);
  ctx.strokeStyle='#dfc783';ctx.lineWidth=3;ctx.strokeRect(6,6,628,128);
  ctx.fillStyle='#f7ebcf';ctx.font='bold 48px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(title,320,71,595);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(width,height), new T.MeshBasicMaterial({map:texture}));
  mesh.position.set(x,y,z);mesh.rotation.y=face===1?0:Math.PI;
  mesh.userData.citySign={text:title,width,height,color,face};
  group.add(mesh);
 }
 function onRoad(street,t,n=0){return street.axis==='x'?[t,street.at+n]:[street.at+n,t];}
 function streetBox(k,street,start,end,span,y,h,color,offset=0){
  const [x,z]=onRoad(street,(start+end)/2,offset);
  const length=end-start;
  k.box(x,y,z,street.axis==='x'?length:span,h,street.axis==='x'?span:length,color);
 }
 function streetWorks(){
  const k=kit();
  for(const s of STREET_PLAN){
   streetBox(k,s,s.from-1.3,s.to+1.3,s.width+3,.004,.05,'#b8ab91');
   streetBox(k,s,s.from,s.to,s.width,.032,.05,'#505955');
   for(const side of [-1,1]){
    streetBox(k,s,s.from,s.to,.17,.079,.072,'#dfcdae',side*(s.width/2+.08));
    streetBox(k,s,s.from,s.to,.054,.062,.009,'#afa997',side*(s.width/2-.27));
   }
   for(let t=s.from+3;t<s.to-2;t+=5){
    const [x,z]=onRoad(s,t);
    if(STREET_PLAN.some(other=>other.axis!==s.axis&&Math.abs(t-other.at)<4.8&&s.at>=other.from&&s.at<=other.to))continue;
    streetBox(k,s,t-.68,t+.68,.063,.063,.008,'#ddc69b');
    if(Math.round(t)%4===0)k.box(x,.065,z,.17,.011,.12,'#96856b');
   }
  }
  for(const a of STREET_PLAN.filter(x=>x.axis==='x'))for(const b of STREET_PLAN.filter(x=>x.axis==='z')){
   if(b.at<a.from||b.at>a.to||a.at<b.from||a.at>b.to)continue;
   k.box(b.at,.066,a.at,b.width+.07,.026,a.width+.07,'#55605b');
   for(const side of [-1,1])for(let offset=-1.8;offset<=1.81;offset+=.6){
    k.box(b.at+offset,.084,a.at+side*(a.width/2+1.03),.28,.014,1.05,'#e9dfc4');
    k.box(b.at+side*(b.width/2+1.03),.084,a.at+offset,1.05,.014,.28,'#e9dfc4');
   }
  }
  k.flush(outside);
 }
 function tree(k,x,z,s=1,fall=false){
  k.put('trunk',x,1.36*s,z,.19*s,2.72*s,.19*s,'#705943');
  for(const [a,b,y] of [[0,0,3.25],[.66,.24,3],[-.57,-.29,3.0],[.15,-.48,3.68]]){
   k.put('stone',x+a*s,y*s,z+b*s,1.04*s,.89*s,1.02*s,fall?(a>0?'#b68e59':'#94734d'):(a>0?'#6b926a':'#507b61'),0,a,0);
  }
 }
 function bench(k,x,z){
  k.box(x,.49,z,2.1,.10,.55,'#986e50');
  k.box(x,.83,z+.22,2.12,.24,.09,'#9e7954');
  for(const t of [-.76,.76])k.box(x+t,.24,z,.10,.48,.38,'#475653');
 }
 function streetLamp(k,x,z){
  k.put('trunk',x,1.89,z,.078,3.77,.078,'#3d5550');
  k.box(x,.17,z,.32,.34,.32,'#61746a');
  k.box(x,3.70,z,.31,.1,.31,'#3c554c');
  k.light(x,3.87,z,.23,.24,.22,'#ffe0a1');
  k.box(x,4.02,z,.36,.10,.35,'#3b554b');
 }
 function planting(k,x,z,dx=2,dz=1.12){
  k.box(x,.21,z,dx,.40,dz,'#b39a7b');
  k.box(x,.42,z,dx-.13,.05,dz-.13,'#685e49');
  for(let j=0;j<4;j++)k.put('stone',x+dx*(j-1.5)*.20,.53+(j%2)*.10,z,.25,.32,.31,j%2?'#6c8e57':'#4c715c');
 }
 function parked(k,x,z,body){
  k.box(x,.54,z,2.9,.61,1.29,body);
  k.box(x-.37,1.06,z,1.35,.56,1.19,'#6c8786');
  k.box(x-.37,1.38,z,1.33,.10,1.22,body);
  for(const a of [-1.02,1.02])for(const side of [-1,1])k.box(x+a,.29,z+side*.66,.49,.48,.17,'#353d3c');
  k.light(x+1.46,.60,z-.40,.04,.14,.19,'#e8cb94');
  k.light(x+1.46,.60,z+.40,.04,.14,.19,'#e8cb94');
 }
 function publicPlaces(){
  const k=kit();
  for(const [x,z] of [[-48,4],[-42,5],[-33,5],[-27,4],[-17,10],[-2,7],[3,16],[10,16],[22,14],[29,13],[40,22],[56,23],[42,35],[55,35],[2,41],[-13,45],[-12,57],[11,54],[18,49],[48,60],[58,60],[-42,47]]){
   streetLamp(k,x,z);
  }
  for(const [x,z] of [[-47,-8],[-47,8],[-30,1],[-18,1],[4,8],[9,14],[21,15],[24,12],[42,15],[54,18],[45,35],[54,34],[14,43],[55,47],[43,46],[20,59],[-26,57],[-38,61]]){
   tree(k,x,z,.86+(Math.abs(x)%5)*.046,z>45&&z%2===1);
  }
  for(const [x,z] of [[-35,3],[-39,3],[-2,9],[4,11],[11,5],[19,5],[46,17],[51,17],[47,25],[53,25],[14,49],[16,53]]){
   planting(k,x,z);
  }
  for(const [x,z] of [[-29,4],[2,12],[13,15],[45,17],[49,25],[-9,47],[0,47],[0,54]])bench(k,x,z);
  for(const [x,z] of [[-40,3],[3,13],[41,19],[52,29],[-10,48]]){
   k.put('trunk',x,.40,z,.25,.80,.23,'#5d6f63');
   k.box(x,.84,z,.52,.10,.47,'#485a51');
  }
  parked(k,43,17,'#a77758');parked(k,52,23,'#738e89');parked(k,29,10,'#aa8c67');parked(k,-43,23,'#76868e');
  // Park paths, lawns, the pergola and a planted reflecting pool.
  k.box(-5,-.005,51,22,.048,19,'#779368');
  k.box(-5,.030,51,19,.038,2,'#c4b191');k.box(-5,.032,51,2,.038,17,'#c4b191');
  k.box(-9,.20,54,5.5,.40,4.5,'#bcad91');k.box(-9,.417,54,4.8,.038,3.8,'#669a91');
  for(const [x,z] of [[-14,44],[-1,44],[-14,59],[-1,59],[-10,59],[1,55]])tree(k,x,z,1.0,true);
  for(const x of [-11.2,-7.0])for(const z of [44.8,48.5])k.box(x,1.37,z,.17,2.70,.17,'#79634c');
  for(let i=0;i<7;i++)k.box(-11.5+i*.8,2.76,46.65,.10,.15,4.2,'#8e734d');
  // Orchard Row’s water tower marks the southeast crossing.
  for(const x of [30.8,34.1])for(const z of [47.3,51.1])k.box(x,3.0,z,.28,6,.28,'#687671');
  k.put('trunk',32.45,6.1,49.2,2.6,2.85,2.6,'#7b9592');
  k.put('trunk',32.45,7.63,49.2,2.76,.42,2.76,'#4c6c65');
  k.flush(outside);
  sign(outside,'Lumen Park',-5,1.51,42,3.25,.64,-1);
  sign(outside,'Orchard Row',29.4,1.55,41.6,3.15,.64,-1);
  for(const [title,x,z] of [['Learning Quarter',-44,4.5],['Civic Square',4,7],['Riverside Market',40,16],['Foundry District',-19,17]]){
   const board=kit();board.box(x,.71,z,.12,1.40,.12,'#5a6357');board.flush(outside);
   sign(outside,title,x,1.66,z,3.15,.62,-1);
  }
 }
 function facade(place){
  const k=kit(),{x,z,w,d,h,kind,brick,trim}=place;
  const f=place.face||1, front=z+f*d/2, door=x+(place.entry||0);
  const roof=h+.10;
  k.box(x,.08,z,w+.62,.18,d+.61,'#a8957a');
  k.box(x,h/2+.08,z,w,h,d,brick);
  k.box(x,.37,z,w+.15,.59,d+.1,'#a29480');
  k.box(x,roof,z,w+.50,.28,d+.38,kind==='warehouse'?'#4f6664':'#516c66');
  k.box(x,h-.22,front+f*.05,w+.20,.20,.18,trim);
  k.box(x,3.42,front+f*.055,w,.13,.13,trim);
  k.box(door,1.25,front+f*.06,1.55,2.44,.13,'#3e5b51');
  k.box(door,1.64,front+f*.134,1.31,1.36,.049,'#82a9aa');
  k.box(door,1.65,front+f*.17,.063,1.40,.022,trim);
  k.box(door-.27,1.02,front+f*.175,.10,.05,.035,'#d5b778');
  k.box(door,.079,front+f*.74,3.04,.16,1.46,'#c4b49a');
  function window(px,y,pz,ww,hh,side){
   const normal=side==='front'?f:-f;
   k.box(px,y,pz,ww+.18,hh+.15,.11,trim);
   k.box(px,y,pz+normal*.065,ww,hh,.049,'#506c63');
   k.box(px,y,pz+normal*.091,ww-.14,hh-.14,.023,kind==='warehouse'?'#91a6a0':'#7fa2a3');
   k.box(px,y,pz+normal*.106,.06,hh-.08,.017,'#d6c8ab');
   k.box(px,y-.04,pz+normal*.106,ww-.08,.058,.018,'#c0b59c');
   k.box(px,y-hh/2-.11,pz+normal*.087,ww+.26,.10,.21,trim);
  }
  const bays=Math.floor(w/2);
  for(let i=0;i<bays;i++){
   const px=x+(i-(bays-1)/2)*1.86;
   if(Math.abs(px-door)>1.63)window(px,1.86,front+f*.062,kind==='shop'?1.40:1.09,1.53,'front');
   if(h>=6&&kind!=='warehouse')window(px,5.24,front+f*.060,1.04,1.35,'front');
   if(i%2===0)window(px,h>5?4.65:1.75,z-f*(d/2+.062),1.10,1.21,'back');
  }
  for(const side of [-1,1]){
   k.box(x+side*(w/2+.02),h/2,front+f*.044,.19,h-.22,.16,trim);
   for(const dz of [-d*.27,0,d*.27]){
    k.box(x+side*(w/2+.026),h>5?4.8:1.85,z+dz,.13,1.44,1.22,trim);
    k.box(x+side*(w/2+.105),h>5?4.8:1.85,z+dz,.06,1.28,1.05,'#77948f');
   }
  }
  if(kind==='school'||kind==='hall'||kind==='library'){
   const portico=kind==='hall'?6.6:5.6;
   k.box(door,3.35,front+f*.77,portico,.23,1.87,trim);
   for(const side of [-1,1]){
    k.put('trunk',door+side*(portico/2-.38),1.69,front+f*1.46,.18,3.1,.18,trim);
    k.box(door+side*(portico/2-.38),.21,front+f*1.46,.54,.37,.53,'#c1b092');
   }
   k.box(x,h+.37,z,w+.52,.22,d+.42,'#60776c');
   if(kind==='hall'){
    k.box(x,h+.94,z,3.3,1.86,3.0,trim);
    k.box(x,h+2.01,z,3.71,.32,3.42,'#4c6a60');
    k.put('trunk',x,h+1.12,z-d*.02,.64,.22,.64,'#e7d8b8',Math.PI/2);
   }
   if(kind==='school'){
    for(const a of [-1,1])k.box(x+a*5.61,h+.46,z,4.6,.56,d+.2,'#75625b');
    k.put('trunk',x+5.6,2.15,front+f*2.0,.071,4.30,.071,'#7f8c83');
    k.box(x+6.15,3.89,front+f*2,.94,.53,.035,'#597b67');
   }
   planting(k,door-3.75,front+f*.76,1.10,1.04);
  }else if(kind==='shop'){
   k.box(x,3.34,front+f*.69,w-.59,.14,1.43,'#3e685c',f*.095);
   for(let i=0;i<8;i++)k.box(x+(i-3.5)*1.39,3.28,front+f*1.42,1.34,.27,.10,i%2?'#d9c397':'#527968');
   planting(k,door-3.0,front+f*1.76,1.23,.82);
  }else if(kind==='warehouse'){
   for(let i=0;i<9;i++)k.box(x-2.6,1.0+i*.22,front+f*.108,3.4,.163,.115,'#a5b0a4');
   k.box(x-2.6,.22,front+f*.96,4.26,.40,1.85,'#979887');
   k.box(x-2.6,3.54,front+f*.80,5.0,.22,1.85,'#4b625d');
   for(const at of [-4.7,-.55])k.box(x+at,.54,front+f*1.87,.17,1.08,.18,'#d1a760');
  }else{
   for(const side of [-1,1])k.box(x+side*w*.24,h+.42,z,w*.54,.20,d+.48,'#6a625a',0,0,-side*.18);
  }
  const group=new T.Group();outside.add(group);k.flush(group);
  if(place.name)sign(group,place.name,door,kind==='warehouse'?4.48:kind==='shop'?4.15:3.94,front+f*.18,Math.min(6.8,w-.5),.65,f);
 }
 function table(k,x,z,w,d,c='#977454',y=.84){
  k.box(x,y,z,w,.15,d,c);
  for(const a of [-1,1])for(const b of [-1,1])k.box(x+a*w*.39,y*.47,z+b*d*.35,.12,y*.90,.13,'#60594d');
 }
 function shelves(k,x,z,w,height,depth,book=false,turn=false){
  const p=(u,y,v,a,h,b,c)=>turn?k.box(x+v,y,z+u,b,h,a,c):k.box(x+u,y,z+v,a,h,b,c);
  for(const a of [-1,1])p(a*w/2,height/2,0,.14,height,depth,'#82664f');
  p(0,height/2,-depth*.45,w,height,.12,'#917259');
  for(let j=0;j<4;j++){
   const y=.48+j*(height-.67)/3;
   p(0,y,0,w,.12,depth,'#a38060');
   if(j===3)continue;
   for(let i=0;i<(book?8:4);i++){
    const slots=book?8:4,width=book?.125:.46;
    const color=(book?['#aa6657','#687f83','#b29b6c','#7d8972']:['#baa17b','#a78b63','#7d9388'])[(i+j)% (book?4:3)];
    p(w*(i-(slots-1)/2)/(slots+1),y+(book?.20:.28),.055,width,book?.30+(i%3)*.035:.43,depth*.63,color);
   }
  }
 }
 function entryLabel(group,title,x,z,w=4.85){sign(group,title,x,2.93,z,w,.55,1);}
 function roomShell(group,k,place){
  const [w,d]=place.room, industrial=['factory','warehouse'].includes(place.kind), h=industrial?6.25:4.95;
  const wColor=industrial?'#b1b8aa':place.kind==='library'?'#d8c2a1':place.kind==='school'?'#d4cfb0':'#ddceb3';
  const floor=industrial?'#91968d':place.kind==='library'?'#af8c64':'#bca789';
  k.box(0,-.13,0,w*2+.28,.24,d*2+.28,floor);
  k.box(0,h+.13,0,w*2+.27,.24,d*2+.27,'#d4ceb7');
  for(const a of [-1,1]){
   k.box(a*w,h/2,0,.24,h,d*2,wColor);
   k.box(0,h/2,a*d,w*2,h,.24,wColor);
   k.box(a*(w-.14),.53,0,.13,1.06,d*2,'#a69980');
   k.box(0,.51,a*(d-.13),w*2,1.02,.13,'#a99d82');
  }
  for(let i=-Math.floor(w)+1;i<w;i++)k.box(i,.003,0,.022,.014,d*1.98,'#9c927e');
  for(const at of [-.6,0,.6])for(const az of [-.52,.42]){
   k.box(w*at,h-.22,d*az,2.02,.17,.59,'#9d9f8d');
   k.light(w*at,h-.324,d*az,1.84,.03,.45,industrial?'#f6e9bc':'#ffedb9');
  }
  for(const x of [-w*.65,0,w*.65]){
   k.box(x,2.84,-d+.17,2.55,2.37,.14,'#6d806d');
   k.light(x,2.84,-d+.256,2.29,2.14,.035,industrial?'#a6c0bd':'#bacbc0');
   k.box(x,2.84,-d+.283,.066,2.18,.027,'#7e8a73');
   k.box(x,2.84,-d+.279,2.28,.067,.032,'#8c9980');
  }
  k.box(0,1.14,d-.18,1.98,2.29,.12,'#4c6859');
  k.box(0,.018,d-.97,3.02,.049,1.42,'#617e69');
  sign(group,'EXIT',0,2.73,d-.18,1.0,.37,-1);
 }
 const rooms=new Map();
 function makeRoom(place){
  const g=new T.Group(), k=kit();
  const kind=place.kind,[w,d]=place.room;
  roomShell(g,k,place);
  k.box(0,.024,3.0,3.05,.029,7.1,kind==='library'?'#7e8e74':'#b5a68a');
  if(kind==='library'){
   for(const x of [-7,7])for(const z of [-5,-1,3])shelves(k,x,z,3.5,2.55,.85,true,true);
   table(k,0,-5,7.5,1.7,'#87664c');
   for(const x of [-4.2,4.2])for(const z of [1.0,5.2])table(k,x,z,2.1,1.40,'#b1906e');
   entryLabel(g,'Library desk',0,-4.56);
   entryLabel(g,'My Words',-6,1.63,2.9);
  }else if(kind==='school'){
   for(const a of [-1,1]){
    table(k,a*7,-6.6,3.30,1.38);
    k.box(a*7,2.2,-8.47,5.3,1.71,.18,'#476457');
    for(const x of [a*6.15,a*8.9])for(const z of [-4.3,-2.6])table(k,x,z,1.2,.8,'#aa8b66',.70);
    for(const x of [a*6.15,a*8.9])k.box(x,.45,-1.61,.51,.10,.55,'#617c6e');
    planting(k,a*10.7,3.0,1.23,1.08);
   }
   entryLabel(g,'Classes & exams',-7,-4.55,4.85);entryLabel(g,'Careers',7,-4.55,3.4);
  }else if(kind==='hall'){
   table(k,0,-4.9,7.1,1.64,'#7d6851');
   for(const x of [-7.2,7.2])for(const z of [-2.0,1.8])shelves(k,x,z,2.8,2.46,.95,false,true);
   table(k,-4.65,3.9,2.67,1.26);
   planting(k,4.79,4.4,1.20,1.08);
   entryLabel(g,'City services',0,-4.15);entryLabel(g,'City Architect',-5,1.5,3.5);
  }else if(kind==='warehouse'){
   for(const x of [-9.8,9.8])for(const z of [-5.5,-1.55,2.40])shelves(k,x,z,3.8,4.0,2.0,false,true);
   for(const x of [-2.25,0,2.25])k.box(x,.58,-6.75,1.92,1.13,2.6,'#b0936d');
   for(const x of [-5,6])table(k,x,-4.18+(x>0?8.3:0),2.6,1,'#7d7661');
   entryLabel(g,'Inventory',-5,-3.57,3.25);entryLabel(g,'Contracts',6,2.6,3.25);
  }else if(kind==='factory'){
   const chosen={workshop:'#ad815c',lumber:'#a98767',textile:'#7790a3',greenhouse:'#6d9a84',assembly:'#788caa'}[place.id]||'#71877e';
   table(k,0,-6.2,6.28,2.25,chosen,1.35);
   k.box(0,1.67,-6.25,5.74,.50,1.36,'#536b66');
   for(let i=-5;i<=5;i++)k.put('trunk',i*.48,1.52,-6.25,.133,1.55,.13,'#a8a99b',Math.PI/2);
   for(const x of [6,8.95]){
    k.box(x,1.4,-6.24,2.13,2.7,3.9,chosen);
    k.light(x,2.0,-4.27,.85,.42,.018,'#d4dca5');
   }
   for(const z of [-3.2,0,3.2])shelves(k,-10.3,z,2.8,3.04,1.22,false,true);
   for(const x of [-4.1,4.1])k.box(x,.012,-5.5,.10,.022,8.0,'#ddbb6c');
   const goodsColors={workshop:'#af865f',lumber:'#b99a66',textile:'#8c9dac',greenhouse:'#719661',assembly:'#93967c'};
   for(let j=0;j<5;j++){
    if(place.id==='textile')k.put('trunk',-6.3+j*.88,.79,-7.65,.28,1.1,.28,j%2?'#9b827f':'#778ea1',Math.PI/2);
    else if(place.id==='greenhouse'){
     k.box(-6.4+j*.89,.76,-7.43,.64,.14,.45,'#a7835c');
     k.put('stone',-6.4+j*.89,1.01,-7.43,.22,.27,.19,'#648d5d');
    }else k.box(-6.6+j*.92,.86,-7.40,.83,.34,.78,goodsColors[place.id]||chosen);
   }
   table(k,-8,2.1,2.80,1.26,'#8c7960');
   const moving=new T.Group(), stock=kit();
   stock.box(0,.13,0,.65,.25,.71,goodsColors[place.id]||chosen);stock.flush(moving);
   g.add(moving);
   const workers=Array.from({length:6},(_,i)=>{
    const worker=new T.Group(), parts=kit();
    const vest=['#a17f56','#648b90','#ad8166'][i%3];
    parts.box(0,1.02,0,.51,.66,.29,vest);
    parts.put('stone',0,1.58,0,.22,.235,.22,'#cd9d75');
    parts.put('trunk',0,1.78,0,.22,.12,.22,'#dec582');
    for(const side of [-1,1]){
     parts.box(side*.132,.48,0,.19,.69,.24,'#53615c');
     parts.box(side*.322,1.07,0,.125,.46,.17,vest);
    }
    parts.flush(worker);worker.position.set(4.0+i%3*2.7,0,1.6+Math.floor(i/3)*3.9);
    g.add(worker);
    return worker;
   });
   g.userData.production={moving,workers};
   entryLabel(g,'Production controls',0,-4.85,5.35);entryLabel(g,'Worker stations',-8,0,3.70);
  }else{
   for(const x of [-6.9,6.9])for(const z of [-3.0,1.3])shelves(k,x,z,3.4,2.46,.88,true,true);
   table(k,0,-4.7,6.99,1.47,'#9b734f');
   table(k,0,2.6,3.63,1.36,'#c0a07a');
   entryLabel(g,'Trade noticeboard',0,-4.06,4.8);
   planting(k,-5.35,4.3,1.25,1.05);
  }
  for(const x of [-w*.69,w*.69])planting(k,x,d*.73,1.04,1.04);
  k.flush(g);inside.add(g);
  return g;
 }
 streetWorks(); publicPlaces();
 for(const place of TOWN_PLACES)facade(place);
 TOWN_HOMES.forEach((h,i)=>facade({...h,h:4.1+(i%2)*.33,kind:'home'}));
 function update(now){
  inside.visible=Boolean(districtVisit);
  for(const room of rooms.values())room.visible=false;
  if(!districtVisit)return;
  const place=districtVisit.place;
  if(!rooms.has(place.id))rooms.set(place.id,makeRoom(place));
  const room=rooms.get(place.id);
  room.visible=true;
  const production=room.userData.production;
  if(production){
   const staff=cityState.sites[place.id]?.staff||0;
   const motion=!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   production.moving.position.set(-2.6+(motion?(now*.0011)%5:0),1.89,-6.18);
   production.workers.forEach((worker,i)=>{
    worker.visible=i<staff;
    if(motion&&worker.visible)worker.rotation.y=Math.sin(now*.0012+i)*.28;
   });
  }
 }
 return {update};
}

