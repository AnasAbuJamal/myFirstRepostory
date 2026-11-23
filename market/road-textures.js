/* Offline procedural asphalt with aggregates, repairs, weathering and narrow cracks. */
function addStreetSurfaceTextures({T,outside,streets,low}){
 if(low)return; // Canvas software fallback retains its lightweight coloured road beds.
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 let seed=74132;
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 ctx.fillStyle='#586263';ctx.fillRect(0,0,256,256);
 for(let i=0;i<19200;i++){
  const v=Math.floor(57+rnd()*87);
  ctx.fillStyle='rgba('+v+','+(v+5)+','+(v+5)+','+(.11+rnd()*.28)+')';
  ctx.fillRect(rnd()*256,rnd()*256,.4+rnd()*1.7,.4+rnd()*1.7);
 }
 for(let i=0;i<12;i++){
  ctx.fillStyle=i%2?'rgba(30,39,40,.12)':'rgba(173,167,149,.08)';
  ctx.fillRect(rnd()*256,rnd()*256,8+rnd()*38,3+rnd()*13);
 }
 for(let i=0;i<29;i++){
  let x=rnd()*256,y=rnd()*256;ctx.beginPath();ctx.moveTo(x,y);
  for(let j=0;j<4;j++){x+=(rnd()-.5)*18;y+=(rnd()-.5)*18;ctx.lineTo(x,y);}
  ctx.strokeStyle='rgba(26,31,32,'+(.10+rnd()*.15)+')';
  ctx.lineWidth=.4+rnd()*.8;ctx.stroke();
 }
 const asphalt=new T.CanvasTexture(canvas);
 asphalt.wrapS=asphalt.wrapT=1000; // Three.js RepeatWrapping (not exported by the bundled subset).
 asphalt.colorSpace=T.SRGBColorSpace;asphalt.anisotropy=4;
 function surface(w,d,x,z,y,turn){
  const map=asphalt.clone();map.repeat.set(Math.max(1,w/9),Math.max(1,d/9));map.needsUpdate=true;
  const mesh=new T.Mesh(new T.PlaneGeometry(w,d),
   new T.MeshLambertMaterial({color:'#f8faf6',map,side:T.DoubleSide}));
  mesh.rotation.x=-Math.PI/2;if(turn)mesh.rotation.z=Math.PI/2;
  mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.name='Textured asphalt';
  outside.add(mesh);
 }
 for(const s of streets){
  const middle=(s.from+s.to)/2,len=s.to-s.from;
  if(s.axis==='x')surface(len,s.width,middle,s.at,.053,false);
  else surface(len,s.width,s.at,middle,.053,true);
 }
 // Junction overlays are above the plain intersection fill but below the crosswalk paint.
 for(const a of streets.filter(s=>s.axis==='x'))for(const b of streets.filter(s=>s.axis==='z')){
  if(b.at<a.from||b.at>a.to||a.at<b.from||a.at>b.to)continue;
  surface(b.width+.13,a.width+.13,b.at,a.at,.0785,false);
 }
}
