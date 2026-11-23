function createDistrictWorld({T,scene,exterior,renderer,visuals}){
 const geometries={
  block:new T.BoxGeometry(1,1,1),
  trunk:new T.CylinderGeometry(.75,1,1,8),
  stone:new T.IcosahedronGeometry(1,renderer.isSoftware?0:1),
 };
 const paint = new T.MeshLambertMaterial({color:'#ffffff',flatShading:true});
 const lampPaint = new T.MeshBasicMaterial({color:'#ffffff'});
 const tint=new T.Color(), object=new T.Object3D();
 const outside=new T.Group(), inside=new T.Group();
 const indoorLights=[new T.PointLight('#ffe2b5',95,21,2),new T.PointLight('#e1eddb',58,18,2)];
 indoorLights[0].position.set(-4,4.35,-3.2);
 indoorLights[1].position.set(4,4.05,2.2);
 inside.add(...indoorLights);
 outside.name='LumenVale district plan';
 exterior.add(outside);
 scene.add(inside);
 inside.visible=false;
 function kit(){
  const shapes=new Map();
  function put(form,x,y,z,w,h,d,color,rx=0,ry=0,rz=0,lit=false,finish=null){
   const key=lit?'light':finish?form+':'+finish:form;
   if(!shapes.has(key))shapes.set(key,[]);
   shapes.get(key).push({x,y,z,w,h,d,color,rx,ry,rz});
  }
  function box(...v){put('block',...v);}
  function surface(finish,x,y,z,w,h,d,color){put('block',x,y,z,w,h,d,color,0,0,0,false,finish);}
  function flush(group){
   for(const [key,items] of shapes){
    const [form,finish]=key.split(':');
    const mesh=new T.InstancedMesh(geometries[form==='light'?'block':form],
     form==='light'?lampPaint:finish?visuals.instanced(finish):paint,items.length);
    items.forEach((v,i)=>{
     object.position.set(v.x,v.y,v.z);
     object.scale.set(v.w,v.h,v.d);
     object.rotation.set(v.rx,v.ry,v.rz);
     object.updateMatrix();
     mesh.setMatrixAt(i,object.matrix);
     mesh.setColorAt(i,tint.set(v.color));
    });
    mesh.computeBoundingSphere();
    mesh.castShadow=group.userData.castsShadow===true&&form!=='light'&&!['asphalt','concrete','wood','tile'].includes(finish);
    mesh.receiveShadow=form!=='light';
    group.add(mesh);
   }
  }
  function light(x,y,z,w,h,d,color){put('block',x,y,z,w,h,d,color,0,0,0,true);}
  return {box,surface,put,light,flush};
 }
 function sign(group,title,x,y,z,width,height,face=1,color='#29433f'){
  const canvas=document.createElement('canvas');
  canvas.width=640;canvas.height=140;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.fillStyle=color;ctx.fillRect(0,0,640,140);
  ctx.strokeStyle='#efeed774';ctx.lineWidth=2;ctx.strokeRect(6,6,628,128);
  ctx.fillStyle='#faf8e9';ctx.font='700 47px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
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
   streetBox(k,s,s.from-2.3,s.to+2.3,s.width+4.6,.003,.050,'#c5c5bb');
   streetBox(k,s,s.from,s.to,s.width,.030,.041,'#5e6568');
   for(const side of [-1,1]){
    const edge=side*(s.width/2);
    for(const [start,end] of streetCurbRuns(s,side)){
     streetBox(k,s,start,end,.14,.058,.043,'#e7e6d9',edge+.08*side);
     streetBox(k,s,start,end,.046,.056,.009,'#cecfcc',edge-.26*side);
    }
    for(let t=s.from+.9;t<s.to;t+=1.75){
     const [x,z]=onRoad(s,t,edge+1.22*side);
     if(atStreet(x,z,.06))continue;
     k.box(x,.033,z,s.axis==='x'?.025:2.0,.008,s.axis==='x'?2.0:.025,'#b8b9b2');
    }
   }
   for(let t=s.from+2.5;t<s.to-1;t+=4){
    if(STREET_PLAN.some(other=>other.axis!==s.axis&&Math.abs(t-other.at)<other.width/2+1.8&&s.at>=other.from&&s.at<=other.to))continue;
    streetBox(k,s,t-.78,t+.78,.072,.055,.009,'#f1f0e6');
   }
  }
  for(const a of STREET_PLAN.filter(x=>x.axis==='x'))for(const b of STREET_PLAN.filter(x=>x.axis==='z')){
   if(b.at<a.from||b.at>a.to||a.at<b.from||a.at>b.to)continue;
   k.box(b.at,.063,a.at,b.width+.15,.027,a.width+.15,'#5e6568');
   for(const side of [-1,1])for(let offset=-Math.min(a.width,b.width)/2+.55;offset<=Math.min(a.width,b.width)/2-.55;offset+=.60){
    if(a.at+side*(a.width/2+1.15)>b.from&&a.at+side*(a.width/2+1.15)<b.to)
     k.box(b.at+offset,.083,a.at+side*(a.width/2+1.15),.29,.009,1.22,'#f0efe4');
    if(b.at+side*(b.width/2+1.15)>a.from&&b.at+side*(b.width/2+1.15)<a.to)
     k.box(b.at+side*(b.width/2+1.15),.083,a.at+offset,1.22,.009,.29,'#f0efe4');
   }
  }
  k.flush(outside);
  if(visuals?.enabled)for(const street of STREET_PLAN){
   const length=street.to-street.from,[cx,cz]=onRoad(street,(street.from+street.to)/2);
   visuals.panel(outside,'asphalt',cx,.052,cz,street.axis==='x'?length:street.width,
    street.axis==='x'?street.width:length,'#646a6c');
   for(const side of [-1,1]){
    const [px,pz]=onRoad(street,(street.from+street.to)/2,side*(street.width/2+1.15));
    visuals.panel(outside,'concrete',px,.030,pz,street.axis==='x'?length:2.25,
     street.axis==='x'?2.25:length,'#c8c9bc');
   }
  }
 }
 function tree(k,x,z,s=1,tall=false){
  k.put('trunk',x,1.12*s,z,.22*s,2.24*s,.21*s,'#796451');
  k.put('stone',x+.35*s,.04,z-.23*s,1.10*s,.035,1.05*s,'#6c8d58');
  if(tall){
   for(const [y,w,h] of [[2.36,.88,1.17],[3.03,.70,1.34],[3.76,.44,.90]])
    k.put('stone',x,y*s,z,w*s,h*s,w*s,'#397652',0,y,0);
  }else{
   for(const [a,b,y,size,tone] of [[0,0,2.95,1.01,'#75a344'],[.62,.14,2.88,.77,'#83b44c'],[-.55,-.25,2.91,.80,'#6c9f43'],[.12,-.43,3.55,.79,'#a1bd52']]){
    k.put('stone',x+a*s,y*s,z+b*s,size*s,size*.93*s,size*s,tone,0,a,0);
   }
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
 function publicPlaces(){
  const paving=kit(), k=kit();
  const props=new T.Group();props.userData.castsShadow=true;outside.add(props);
  // Front walks follow their building when its parcel moves.
  for(const p of TOWN_PUBLIC_PLACES){
   const apron=p.kind==='school'?5:2.1;
   paving.box(p.x,.025,p.z+p.face*(p.d/2+apron/2),p.w+.48,.07,apron,'#d6d5ca');
  }
  paving.box(.05,.03,-4.85,8.65,.07,1.95,'#d8d5c8');
  paving.box(STAND.x,.01,STAND.z,5.8,.065,3.4,'#c9c6b8');
  // A continuous civic walk links school, hall and library, with a break at Mill Street.
  for(const [left,right] of [[-46,-23.65],[-16.35,19.1]]){
   paving.box((left+right)/2,.018,4.98,right-left,.055,1.55,'#d4cfc2');
  }
  for(const home of TOWN_HOMES){
   // Lawn and doorstep path distinguish the residential lots from the public pavements.
   paving.box(home.x,-.015,home.z,home.w+1.8,.055,home.d+1.8,'#a4b782');
   paving.box(home.x,.028,home.z+home.d/2+1.04,1.58,.064,2.07,'#d3cdc0');
  }
  for(const f of TOWN_SAFE_FURNITURE){
   if(f.kind==='tree'){
    paving.box(f.x,.07,f.z,1.10,.09,1.10,'#b4b49d');
    paving.box(f.x,.121,f.z,.93,.022,.93,'#786f58');
    tree(k,f.x,f.z,.82,Math.round(f.x)%3===0);
   }else if(f.kind==='lamp')streetLamp(k,f.x,f.z);
   else if(f.kind==='bench')bench(k,f.x,f.z);
   else if(f.kind==='planter')planting(k,f.x,f.z,f.w,f.d);
   else{
    k.put('trunk',f.x,.36,f.z,.22,.72,.22,'#425a55');
    k.box(f.x,.75,f.z,.46,.09,.49,'#3b4d52');
   }
  }
  // One park block, with an axial footpath between the playing court and fountain garden.
  paving.box(-6.5,.005,54.6,19.2,.052,17.9,'#99b76c');
  paving.box(-4.37,.047,54.5,1.7,.034,18.0,'#dedaca');
  for(const z of [47.1,61.85])paving.box(-6.45,.048,z,18.8,.036,1.27,'#ddd9c9');
  paving.box(-1.6,.050,52.1,4.1,.032,1.05,'#dedaca');
  const court=PARK_COURT,cx=court.x,cz=court.z;
  paving.box(cx,.064,cz,court.w,.04,court.d,'#c48161');
  for(const dx of [-3.65,3.65])paving.box(cx+dx,.089,cz,.06,.012,9.14,'#fff2d9');
  for(const dz of [-4.55,0,4.55])paving.box(cx,.089,cz+dz,7.34,.012,.06,'#fff2d9');
  for(const side of [-1,1]){
   paving.box(cx,.089,cz+side*3.63,2.5,.012,1.7,'#518d82');
   k.box(cx,1.54,cz+side*4.86,.12,3,.12,'#455453');
   k.box(cx,2.73,cz+side*4.64,.95,.62,.07,'#f5eee3');
   k.box(cx,2.48,cz+side*4.45,.40,.065,.32,'#ad624b');
  }
  const pool=PARK_FOUNTAIN;
  k.box(pool.x,.20,pool.z,pool.w,.40,pool.d,'#c3bba6');
  k.box(pool.x,.419,pool.z,pool.w-.46,.045,pool.d-.46,'#6aabb4');
  k.put('trunk',pool.x,.87,pool.z,.52,.96,.52,'#d0c9b9');
  k.put('trunk',pool.x,1.41,pool.z,.88,.15,.88,'#e5dfd0');
  // Orchard Row’s water tower is visible from the surrounding blocks.
  for(const x of [30.8,34.1])for(const z of [47.3,51.1])k.box(x,3.0,z,.28,6,.28,'#687671');
  k.put('trunk',32.45,6.1,49.2,2.6,2.85,2.6,'#7b9592');
  k.put('trunk',32.45,7.63,49.2,2.76,.42,2.76,'#4c6c65');
  paving.flush(outside); k.flush(props);
  sign(outside,'Lumen Park',-6.3,1.51,46.6,3.25,.64,-1);
  sign(outside,'Orchard Row',29.4,1.55,46.6,3.15,.64,-1);
 }
 function facade(place){
  const k=kit(),{x,z,w,d,h,kind,brick,trim}=place;
  const f=place.face||1, front=z+f*d/2, door=x+(place.entry||0);
  const roof=h+.10, accent=place.accent||'#527b79', storefront=['shop','press','cafe'].includes(kind);
  k.box(x,.06,z,w+.63,.13,d+.61,'#d3d0c4');
  k.surface(kind==='home'?'wood':kind==='warehouse'||kind==='factory'?'concrete':
    kind==='school'||kind==='library'?'brick':'plaster',x,h/2+.08,z,w,h,d,brick);
  k.surface('stone',x,.25,z,w+.15,.42,d+.1,'#b8b8ad');
  k.surface('roof',x,roof,z,w+.35,.24,d+.26,kind==='warehouse'?'#788982':'#a3aaa1');
  if(kind!=='home'){
   for(const edge of [-1,1]){
    k.box(x,roof+.25,z+edge*d/2,w+.38,.48,.20,trim);
    k.box(x+edge*w/2,roof+.25,z,.20,.48,d+.20,trim);
   }
   k.box(x+w*.19,roof+.37,z+d*.19,w*.27,.52,d*.24,'#a4aba3');
  }
  k.box(x,h-.22,front+f*.05,w+.20,.20,.18,trim);
  k.box(x,3.42,front+f*.055,w,.13,.13,trim);
  k.box(door,1.25,front+f*.06,1.55,2.44,.13,accent);
  k.box(door,1.64,front+f*.134,1.31,1.36,.049,'#82a9aa');
  k.box(door,1.65,front+f*.17,.063,1.40,.022,trim);
  k.box(door-.27,1.02,front+f*.175,.10,.05,.035,'#d5b778');
  k.box(door,.079,front+f*.74,3.04,.16,1.46,'#c4b49a');
  function window(px,y,pz,ww,hh,side){
   const normal=side==='front'?f:-f;
   k.box(px,y,pz,ww+.18,hh+.15,.11,trim);
   k.box(px,y,pz+normal*.065,ww,hh,.049,'#506c63');
   k.box(px,y,pz+normal*.091,ww-.14,hh-.14,.023,kind==='warehouse'?'#74908d':'#6e9097');
   k.box(px,y+hh*.22,pz+normal*.105,ww-.14,hh*.32,.010,'#a3c0c5');
   k.box(px,y,pz+normal*.106,.06,hh-.08,.017,'#d6c8ab');
   k.box(px,y-.04,pz+normal*.106,ww-.08,.058,.018,'#c0b59c');
   k.box(px,y-hh/2-.11,pz+normal*.087,ww+.26,.10,.21,trim);
  }
  const bays=Math.floor(w/2);
  for(let i=0;i<bays;i++){
   const px=x+(i-(bays-1)/2)*1.86;
   if(Math.abs(px-door)>1.63)window(px,1.86,front+f*.062,storefront?1.40:1.09,1.53,'front');
   if(h>=6&&kind!=='warehouse')window(px,h>=7.2?4.87:5.03,front+f*.060,1.10,h>=7.2?1.23:1.55,'front');
   if(h>=7.2&&kind!=='warehouse')window(px,h-.95,front+f*.060,1.03,1.14,'front');
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
  }else if(storefront){
   const strips=Math.ceil(w/.46),stripe=(w-.66)/strips;
   for(let i=0;i<strips;i++){
    const px=x+(i-(strips-1)/2)*stripe, tint=i%2?'#fcf2dd':accent;
    k.box(px,2.96,front+f*.57,stripe+.012,.10,1.13,tint,f*.18);
    k.box(px,2.76,front+f*1.10,stripe+.012,.18,.085,tint);
   }

  }else if(kind==='warehouse'){
   for(let i=0;i<9;i++)k.box(x-2.6,1.0+i*.22,front+f*.108,3.4,.163,.115,'#a5b0a4');
   k.box(x-2.6,.22,front+f*.96,4.26,.40,1.85,'#979887');
   k.box(x-2.6,3.54,front+f*.80,5.0,.22,1.85,'#4b625d');
   for(const at of [-4.7,-.55])k.box(x+at,.54,front+f*1.87,.17,1.08,.18,'#d1a760');
  }else{
   for(const side of [-1,1])k.box(x+side*w*.24,h+.42,z,w*.54,.20,d+.48,'#6a625a',0,0,-side*.18);
  }
  const group=new T.Group();group.userData.castsShadow=true;outside.add(group);k.flush(group);
  if(place.name)sign(group,place.name,door,kind==='warehouse'?4.48:storefront?3.55:3.94,front+f*.18,Math.min(6.8,w-.5),.65,f);
 }
 function table(k,x,z,w,d,c='#977454',y=.84){
  k.surface('wood',x,y,z,w,.15,d,c);
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
  k.surface(industrial?'concrete':kind==='school'||kind==='research'?'tile':'wood',0,-.13,0,w*2+.28,.24,d*2+.28,floor);
  k.surface('plaster',0,h+.13,0,w*2+.27,.24,d*2+.27,'#d4ceb7');
  for(const a of [-1,1]){
   k.surface('plaster',a*w,h/2,0,.24,h,d*2,wColor);
   k.surface('plaster',0,h/2,a*d,w*2,h,.24,wColor);
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
  g.userData.castsShadow=true;
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
  }else if(kind==='research'){
    table(k,0,-5.1,6.8,1.65,'#91aaa1',1.16);
    table(k,-6.1,1.95,4.05,1.5,'#9aada6',1.12);
    table(k,6.1,1.95,4.05,1.5,'#9aada6',1.12);
    for(const x of [-8,8])for(const z of [-4.1,-.8,2.9])shelves(k,x,z,2.7,2.55,.76,true,true);
    for(const x of [-4,-1,2,5]){
     k.box(x,1.30,-5.20,.44,.11,.45,'#5c747b');
     k.put('trunk',x,1.62,-5.25,.095,.55,.095,'#b7c7bc');
     k.box(x,1.75,-5.25,.31,.07,.30,'#b6d5cc');
    }
    k.box(0,2.18,-8.22,4.3,1.45,.12,'#426c69');
    entryLabel(g,'Research study desk',0,-4.47,5.3);
    entryLabel(g,'Research careers',-6,2.07,4.4);
   }else if(kind==='warehouse'){
   for(const x of [-9.8,9.8])for(const z of [-5.5,-1.55,2.40])shelves(k,x,z,3.8,4.0,2.0,false,true);
   for(const x of [-2.25,0,2.25])k.box(x,.58,-6.75,1.92,1.13,2.6,'#b0936d');
   for(const x of [-5,6])table(k,x,-4.18+(x>0?8.3:0),2.6,1,'#7d7661');
   entryLabel(g,'Inventory',-5,-3.57,3.25);entryLabel(g,'Contracts',6,2.6,3.25);
  }else if(kind==='press'){
   for(const side of [-1,1])for(const z of [-3.35,.30,2.80])shelves(k,side*5.85,z,2.65,2.45,.87,true,true);
   table(k,0,-4.48,5.8,1.45,'#7c8a80');
   k.box(-.9,1.03,-4.45,1.0,.26,.64,'#566965');
   k.box(-.9,1.185,-4.42,.76,.063,.52,'#d9e0d2');
   for(let i=0;i<5;i++)k.box(1.32,.94+i*.035,-4.51,.53,.027,.74,i%2?'#ebe2ce':'#cfbfa5');
   entryLabel(g,'Publishing desk',0,-3.72,4.5);
  }else if(kind==='cafe'){
   table(k,0,-4.62,6.9,1.45,'#ae7863',1.07);
   k.box(-1.98,1.33,-4.55,1.25,.39,.66,'#607875');
   k.box(-1.98,1.48,-4.19,1.11,.18,.068,'#d2d3bf');
   for(let i=0;i<5;i++)k.put('trunk',.35+i*.34,1.22,-4.38,.13,.19,.13,'#e5e3d8');
   for(const x of [-4,4])for(const z of [.5,4]){
    table(k,x,z,1.7,1.25,'#ab8b69',.68);
    for(const side of [-1,1]){
     k.box(x+side*1.12,.38,z,.49,.09,.48,'#698a75');
     k.box(x+side*1.31,.60,z,.09,.45,.48,'#698a75');
    }
   }
   entryLabel(g,'Trade noticeboard',0,-3.88,4.5);
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
 for(const place of TOWN_PUBLIC_PLACES)facade(place);
 TOWN_HOMES.forEach((h,i)=>facade({...h,h:4.1+(i%2)*.33,kind:'home'}));
 function update(now){
  inside.visible=Boolean(districtVisit);
  if(districtVisit){
   const industrial=['factory','warehouse','research'].includes(districtVisit.place.kind);
   indoorLights[0].color.set(industrial?'#e6eee5':'#ffe0b5');
   indoorLights[0].intensity=industrial?105:90;
   indoorLights[1].intensity=industrial?65:55;
  }
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
 return {update,label:sign};
}

