/* Three.js school, walkable factories, and placed town architecture. */
function createCampusWorld({T,exterior,box,piece,renderer,visuals}){
 const root=new T.Group();exterior.add(root);
 const materials=new Map(),low=Boolean(renderer.isSoftware);
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshLambertMaterial({color:c,flatShading:true,side:T.DoubleSide}));return materials.get(c)};
 const b=(g,x,y,z,w,h,d,c)=>box(g,x,y,z,w,h,d,c);
 function surfaced(g,kind,x,y,z,w,h,d,color){
  const mesh=b(g,x,y,z,w,h,d,color);
  if(visuals?.enabled)mesh.material=visuals.surface(kind,color,w,d);
  return mesh;
 }
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
 const decor=new Map();
 function addDecoration(data){
  const g=new T.Group();g.position.set(data.x,0,data.z);
  if(data.kind==="tree"){
   cylinder(g,0,.94,0,.20,1.88,"#79654d");
   sphere(g,0,2.30,0,1.18,"#5c916a");sphere(g,.5,2.05,.35,.68,"#76a477");
  }else if(data.kind==="road"){
   surfaced(g,"asphalt",0,.06,0,3.7,.12,3.7,"#88928c");b(g,0,.14,0,.10,.02,1.7,"#e3d9ba");
  }else if(data.kind==="park"){
   surfaced(g,"grass",0,.08,0,3.7,.18,3.7,"#7a9d6d");
   for(const [x,z] of [[-1,-1],[1,1]]){cylinder(g,x,.3,z,.15,.4,"#946e57");sphere(g,x,.65,z,.42,"#80ad7b");}
   b(g,0,.35,0,1.5,.23,.48,"#b5966d");
  }else if(data.kind==="house"){
   surfaced(g,"brick",0,1.35,0,3.2,2.7,3.2,"#c8ad8b");
   surfaced(g,"roof",0,2.9,0,3.5,.4,3.5,"#667f74");
   b(g,-.65,1.50,-1.66,.7,.8,.09,"#8fc1bd");
   b(g,.70,1.0,-1.66,.70,1.9,.09,"#8c7658");
  }else if(data.kind==="lamp"){
   cylinder(g,0,1.6,0,.08,3.2,"#6b8074");sphere(g,0,3.3,0,.38,"#eed5a2");
  }
  root.add(g);return g;
 }
 function update(){
  for(const d of campusState.decor){
   const key=d.kind+":"+d.x+":"+d.z;
   if(!decor.has(key))decor.set(key,addDecoration(d));
  }
  for(const [key,obj] of decor)if(!campusState.decor.some(d=>d.kind+":"+d.x+":"+d.z===key)){root.remove(obj);decor.delete(key);}
 }
 return {update};
}
