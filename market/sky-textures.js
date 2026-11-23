/* LumenVale atmosphere v2 — cinematic but readable, entirely offline.
 * Threejs-game-skills principles: deliberate sky colors, layered depth,
 * no noise-only aesthetic or expensive per-frame texture redraws.
 */
function createSkyAtmosphere({T,scene,renderer}){
 if(renderer.isSoftware)return {enabled:false,mesh:null,update(){}};
 const c=document.createElement('canvas');c.width=1024;c.height=512;
 const x=c.getContext('2d');if(!x)return {enabled:false,mesh:null,update(){}};
 let seed=912347;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 // Cloud bands in equirectangular UV space, positioned away from the zenith.
 const bands=Array.from({length:19},(_,i)=>({
  x:random()*1170-80,y:110+random()*165,
  w:38+random()*86,h:9+random()*21,shade:random(),speed:.4+random()*.8,
  layers:3+i%3
 }));
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
 function paint(phase,seconds){
  const late=1-Math.max(.1,Math.min(1,phase));
  const stops=late>.37?
   ['#274267','#516b8e','#a1aaba','#e5c0a2','#f3dfc6']:
   ['#244d81','#4d86bb','#83badc','#c7dfe6','#eae9db'];
  const gradient=x.createLinearGradient(0,0,0,512);
  [0,.29,.58,.80,1].forEach((a,i)=>gradient.addColorStop(a,stops[i]));
  x.fillStyle=gradient;x.fillRect(0,0,1024,512);
  // Sun near the horizon: diffuse atmospheric scattering, not glowing geometry.
  const sunX=755,sunY=305;
  for(const [radius,opacity] of [[260,.18],[165,.18],[80,.22]]){
   const g=x.createRadialGradient(sunX,sunY,0,sunX,sunY,radius);
   g.addColorStop(0,'rgba(255,232,182,'+opacity+')');
   g.addColorStop(1,'rgba(255,234,194,0)');
   x.fillStyle=g;x.fillRect(sunX-radius,sunY-radius,radius*2,radius*2);
  }
  const disc=x.createRadialGradient(sunX,sunY,1,sunX,sunY,34);
  disc.addColorStop(0,'rgba(255,250,222,.92)');
  disc.addColorStop(.52,'rgba(255,245,209,.68)');
  disc.addColorStop(1,'rgba(255,243,210,0)');
  x.fillStyle=disc;x.fillRect(sunX-34,sunY-34,68,68);
  // Shape coherent cloud families rather than scattered circles of random haze.
  for(const cloud of bands){
   const shift=(seconds*cloud.speed)%1150;
   let cx=((cloud.x+shift+1150)%1150)-64;
   const under=late>.35?'rgba(86,112,138,.12)':'rgba(80,116,146,.13)';
   for(let layer=0;layer<cloud.layers;layer++){
    const xx=cx+(layer-(cloud.layers-1)/2)*cloud.w*.46,yy=cloud.y+(layer%2)*2.3;
    const w=cloud.w*(.70+layer*.07),h=cloud.h*(.88+(layer%3)*.10);
    const shadow=x.createRadialGradient(xx,yy+h*.27,2,xx,yy+h*.27,w*.70);
    shadow.addColorStop(0,under);shadow.addColorStop(1,'rgba(80,116,146,0)');
    x.save();x.translate(xx,yy);x.scale(1,h/w);
    x.fillStyle=shadow;x.beginPath();x.arc(0,4,w*.69,0,Math.PI*2);x.fill();x.restore();
    const g=x.createRadialGradient(xx,yy,0,xx,yy,w*.62);
    const alpha=.21+cloud.shade*.12;
    g.addColorStop(0,'rgba(255,255,253,'+alpha.toFixed(3)+')');
    g.addColorStop(.57,'rgba(255,255,255,'+(alpha*.65).toFixed(3)+')');
    g.addColorStop(1,'rgba(255,255,255,0)');
    x.save();x.translate(xx,yy);x.scale(1,h/w);
    x.fillStyle=g;x.beginPath();x.arc(0,0,w*.62,0,Math.PI*2);x.fill();x.restore();
   }
  }
  // Atmospheric horizon gradient reduces hard seam with the far buildings.
  const haze=x.createLinearGradient(0,332,0,512);
  haze.addColorStop(0,'rgba(241,232,217,0)');
  haze.addColorStop(.62,'rgba(245,227,201,.075)');
  haze.addColorStop(1,'rgba(252,230,201,.25)');
  x.fillStyle=haze;x.fillRect(0,332,1024,180);
  map.needsUpdate=true;
 }
 paint(.83,0);
 const geometry=new T.IcosahedronGeometry(116,3);
 const material=new T.MeshBasicMaterial({map,color:'#ffffff',side:T.DoubleSide,depthWrite:false,fog:false});
 const mesh=new T.Mesh(geometry,material);mesh.name='LumenVale textured atmosphere';
 mesh.renderOrder=-100;mesh.frustumCulled=false;
 mesh.castShadow=false;mesh.receiveShadow=false;
 scene.add(mesh);let lastPhase=-1,lastTick=-1;
 function update({phase=.83,now=0,indoors=false,x=0,y=1.7,z=0}={}){
  mesh.visible=!indoors;if(indoors)return;
  mesh.position.set(x,y,z);
  const phaseIndex=Math.round(phase*12),tick=Math.floor(now/24000);
  if(phaseIndex!==lastPhase||tick!==lastTick){
   lastPhase=phaseIndex;lastTick=tick;paint(phase,now*.0004);
  }
 }
 return {enabled:true,mesh,texture:map,update};
}
