/* LumenVale atmospheric sky — procedural CanvasTexture and the bundled Three.js subset.
 * No external images, WebGL shaders, SphereGeometry, or unavailable BackSide constants.
 */
function createSkyAtmosphere({T,scene,renderer}){
 if(renderer.isSoftware)return {enabled:false,mesh:null,update(){}};
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext('2d');
 if(!ctx)return {enabled:false,mesh:null,update(){}};
 let seed=86047;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 const clouds=Array.from({length:32},(_,i)=>{
  const row=i%3,x=random()*1040-15,y=36+row*51+random()*78;
  return {x,y,width:48+random()*90,height:10+random()*19,opacity:.20+random()*.23,drift:4+random()*14};
 });
 const texture=new T.CanvasTexture(canvas);
 texture.colorSpace=T.SRGBColorSpace;
 texture.anisotropy=2;
 function paint(phase,seconds){
  const brightness=Math.max(.32,Math.min(1,phase)),evening=(1-brightness)*.62;
  const gradient=ctx.createLinearGradient(0,0,0,512);
  gradient.addColorStop(0,evening>.21?'#38577e':'#24548f');
  gradient.addColorStop(.37,evening>.21?'#7298b9':'#4f9dd4');
  gradient.addColorStop(.74,evening>.21?'#b6bdc5':'#a6d5ec');
  gradient.addColorStop(1,evening>.21?'#edcaac':'#e2edf0');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);
  // Soft distant atmospheric layers and golden glow, not a flat blue background.
  let glow=ctx.createRadialGradient(782,288,4,782,288,315);
  glow.addColorStop(0,'rgba(255,239,192,.70)');
  glow.addColorStop(.33,'rgba(255,225,179,.30)');
  glow.addColorStop(1,'rgba(255,221,172,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,1024,512);
  for(let i=0;i<clouds.length;i++){
   const c=clouds[i];
   const x=((c.x+seconds*c.drift)%1144+1144)%1144-60;
   // Several overlapping soft lobes avoid hard-edged ellipse clouds.
   for(const dx of [-.72,-.33,0,.38,.70]){
    const px=x+dx*c.width,py=c.y+Math.abs(dx)*c.height*.12;
    const radius=c.width*(.54-Math.abs(dx)*.19);
    const alpha=c.opacity*(1-Math.abs(dx)*.35)*(brightness*.6+.35);
    const halo=ctx.createRadialGradient(px,py,1,px,py,radius);
    halo.addColorStop(0,'rgba(255,255,250,'+alpha.toFixed(3)+')');
    halo.addColorStop(.54,'rgba(249,251,255,'+(alpha*.40).toFixed(3)+')');
    halo.addColorStop(1,'rgba(250,252,255,0)');
    ctx.fillStyle=halo;ctx.fillRect(px-radius,py-radius,2*radius,2*radius);
   }
  }
  const horizon=ctx.createLinearGradient(0,366,0,512);
  horizon.addColorStop(0,'rgba(239,248,255,0)');
  horizon.addColorStop(1,'rgba(239,226,211,.18)');
  ctx.fillStyle=horizon;ctx.fillRect(0,365,1024,147);
  texture.needsUpdate=true;
 }
 paint(.8,0);
 // A low-poly sphere gives UV coordinates for the procedural sky. Render both
 // sides since this bundled engine does not export THREE.BackSide.
 const geometry=new T.IcosahedronGeometry(116,3);
 const material=new T.MeshBasicMaterial({map:texture,color:'#ffffff',side:T.DoubleSide,depthWrite:false,fog:false});
 const mesh=new T.Mesh(geometry,material);
 mesh.name='LumenVale textured atmosphere';mesh.renderOrder=-100;mesh.frustumCulled=false;
 mesh.castShadow=false;mesh.receiveShadow=false;scene.add(mesh);
 let lastBucket=-1,lastDrift=-1;
 function update({phase=0.8,now=0,indoors=false,x=0,y=1.7,z=0}={}){
  mesh.visible=!indoors;
  if(indoors)return;
  mesh.position.set(x,y,z);
  // Update infrequently: smooth-looking cloud drift without a 512k-pixel
  // canvas redraw every animation frame.
  const bucket=Math.round(phase*14),drift=Math.floor(now/18000);
  if(bucket!==lastBucket||drift!==lastDrift){
   lastBucket=bucket;lastDrift=drift;
   paint(phase,now*.000055);
  }
 }
 return {enabled:true,mesh,texture,update};
}

