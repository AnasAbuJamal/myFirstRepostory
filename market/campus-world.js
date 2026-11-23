/* Three.js school, walkable factories, and placed town architecture. */
function createCampusWorld({T,exterior,box,piece,renderer}){
 const root=new T.Group();exterior.add(root);
 const materials=new Map(),low=Boolean(renderer.isSoftware);
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshLambertMaterial({color:c,flatShading:true,side:T.DoubleSide}));return materials.get(c)};
 const b=(g,x,y,z,w,h,d,c)=>box(g,x,y,z,w,h,d,c);
 const sphere=(g,x,y,z,r,c)=>{const m=new T.Mesh(new T.IcosahedronGeometry(r,low?0:1),mat(c));m.position.set(x,y,z);g.add(m);return m;};
 const cylinder=(g,x,y,z,r,h,c)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,10),mat(c));m.position.set(x,y,z);g.add(m);return m;};
 function sign(g,name,x,y,z,w=5){
  b(g,x,y,z,w,.52,.13,"#284a46");
  if(low)return;
  const c=document.createElement("canvas");c.width=512;c.height=90;
  const ctx=c.getContext("2d");ctx.fillStyle="#284a46";ctx.fillRect(0,0,512,90);
  ctx.fillStyle="#fff0bd";ctx.font="bold 36px sans-serif";ctx.textAlign="center";ctx.fillText(name.toUpperCase(),256,55,490);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(w-.1,.45),new T.MeshBasicMaterial({map:t,side:T.DoubleSide}));m.position.set(x,y,z-.08);g.add(m);
 }
 const school=new T.Group();school.position.set(-37,0,-7);root.add(school);
 b(school,0,.3,0,8.8,.6,7.0,"#e6d8b6");
 b(school,0,2.9,1.0,8.1,5.1,5.4,"#b8a88e");
 b(school,0,5.5,1.0,8.7,.32,6.0,"#657987");
 b(school,0,1.55,-1.79,2.4,3.0,.18,"#856d56");
 for(const x of [-3.25,-1.4,1.4,3.25]){
  b(school,x,3.6,-1.79,1.0,1.6,.13,"#9ac6c7");
  b(school,x,3.6,-1.91,.08,1.62,.04,"#e3e9d8");
 }
 for(let i=0;i<3;i++)b(school,0,.12,-2.4-i*.45,4.8,.18,.5,"#d2b995");
 sign(school,"LUMENVALE SCHOOL",0,5,-1.93,6.8);
 const flags=new T.Group();root.add(flags);
 for(const [x,z] of [[-42,-8],[-32,-8]]){cylinder(flags,x,2,z,.09,4,"#abb6a5");b(flags,x+.3,3.55,z,.65,.39,.05,"#658f78");}
 const interior=new T.Group();root.add(interior);
 // Factory floor sits outside the public map, accessible only by entering a built site.
 const Z=-73;
 b(interior,0,-.12,Z,17,.22,17,"#87958c");
 b(interior,0,4.2,Z+7.75,17,8.3,.3,"#a9b3a7");
 b(interior,-8.2,4.2,Z, .3,8.3,16,"#a9b3a7");
 b(interior,8.2,4.2,Z, .3,8.3,16,"#a9b3a7");
 b(interior,0,8.42,Z,17,.22,16,"#667c79");
 for(const x of [-6.3,-3.5,0,3.5,6.3]){
  b(interior,x,7.65,Z-2,.85,.1,2.2,"#e6dab5");
  b(interior,x,7.65,Z+2,.85,.1,2.2,"#e6dab5");
 }
 b(interior,0,.09,Z-3.0,12,.1,3,"#547371");
 for(let i=0;i<13;i++){const roller=cylinder(interior,-5.5+i*.9,.42,Z-3.0,.24,.74,"#b5c4b4");roller.rotation.z=Math.PI/2;}
 b(interior,3,1.4,Z,3.3,2.4,2.1,"#6a8a89");
 b(interior,3,2.7,Z,3.7,.25,2.45,"#3e5c5b");
 b(interior,3,1.6,Z-1.13,1.25,.65,.1,"#9bb3ad");
 b(interior,-3,1.15,Z,3.8,2.2,1.5,"#a68e6b");
 b(interior,-3,2.37,Z,3.95,.21,1.65,"#7f6b56");
 for(let i=0;i<5;i++)b(interior,-4.3+i*.68,1.66,Z-.81,.40,.52,.3,"#d1ae70");
 b(interior,0,.03,Z-7,5,.07,2.5,"#d6c58d");
 for(const x of [-1.4,1.4])b(interior,x,.06,Z-7,.15,.08,2.5,"#eee0b5");
 b(interior,0,2.6,Z-7.65,3.4,1.0,.14,"#315b4b");
 sign(interior,"EXIT",0,2.6,Z-7.8,2.4);
 sign(interior,"MACHINES",3,3.4,Z-1.3,2.4);
 sign(interior,"WORKERS",-3,3.25,Z-1.0,2.5);
 const packages=Array.from({length:7},(_,i)=>b(interior,-5+i*1.55,.75,Z-3.0,.58,.5,.48,"#d1a973"));
 const people=[];
 function worker(px,pz,shirt){
  const g=new T.Group();g.position.set(px,0,pz);interior.add(g);
  b(g,0,1.05,0,.55,.75,.35,shirt);
  b(g,-.17,.45,0,.21,.85,.25,"#465550");b(g,.17,.45,0,.21,.85,.25,"#465550");
  sphere(g,0,1.72,0,.25,"#d8a77c");return g;
 }
 for(let i=0;i<6;i++)people.push(worker(-5.8+i*2.2,Z+3.6,i%2?"#76a4a7":"#c59b6e"));
 const decor=new Map();
 function addDecoration(data){
  const g=new T.Group();g.position.set(data.x,0,data.z);
  if(data.kind==="tree"){
   cylinder(g,0,.94,0,.20,1.88,"#79654d");
   sphere(g,0,2.30,0,1.18,"#5c916a");sphere(g,.5,2.05,.35,.68,"#76a477");
  }else if(data.kind==="road"){
   b(g,0,.06,0,3.7,.12,3.7,"#88928c");b(g,0,.14,0,.10,.02,1.7,"#e3d9ba");
  }else if(data.kind==="park"){
   b(g,0,.08,0,3.7,.18,3.7,"#7a9d6d");
   for(const [x,z] of [[-1,-1],[1,1]]){cylinder(g,x,.3,z,.15,.4,"#946e57");sphere(g,x,.65,z,.42,"#80ad7b");}
   b(g,0,.35,0,1.5,.23,.48,"#b5966d");
  }else if(data.kind==="house"){
   b(g,0,1.35,0,3.2,2.7,3.2,"#c8ad8b");
   b(g,0,2.9,0,3.5,.4,3.5,"#667f74");
   b(g,-.65,1.50,-1.66,.7,.8,.09,"#8fc1bd");
   b(g,.70,1.0,-1.66,.70,1.9,.09,"#8c7658");
  }else if(data.kind==="lamp"){
   cylinder(g,0,1.6,0,.08,3.2,"#6b8074");sphere(g,0,3.3,0,.38,"#eed5a2");
  }
  root.add(g);return g;
 }
 let seen=0;
 function update(now){
  interior.visible=Boolean(campusInterior);
  people.forEach((p,i)=>{p.visible=Boolean(campusInterior&&i<(cityState.sites[campusInterior.id]?.staff||0));if(p.visible)p.rotation.y=Math.sin(now*.0008+i)*.23;});
  packages.forEach((m,i)=>{const phase=((now*.001*.75+i*1.9)%11);m.position.x=-5.5+phase;});
  for(const d of campusState.decor){
   const key=d.kind+":"+d.x+":"+d.z;
   if(!decor.has(key))decor.set(key,addDecoration(d));
  }
  for(const [key,obj] of decor)if(!campusState.decor.some(d=>d.kind+":"+d.x+":"+d.z===key)){root.remove(obj);decor.delete(key);}
 }
 return {update};
}
