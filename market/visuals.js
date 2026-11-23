/* LumenVale Art Direction — original procedural surfaces and atmosphere.
 * Generated locally; no image downloads, external licenses, or network calls.
 * Texture maps are shared and cached. Software mode keeps solid-color materials.
 */
function createLumenVisuals(T,renderer){
 const low=Boolean(renderer?.isSoftware);
 const patterns=new Map(),instances=new Map(),skies=new Map();
 const finishes={
  grass:{scale:3.5,roughness:1},asphalt:{scale:3.6,roughness:1},
  concrete:{scale:2.6,roughness:.98},stone:{scale:2.8,roughness:.89},
  plaster:{scale:2.7,roughness:.96},brick:{scale:3,roughness:.94},
  wood:{scale:2.6,roughness:.88},roof:{scale:3.0,roughness:.96},
  tile:{scale:2.5,roughness:.83},fabric:{scale:1.9,roughness:1},
  water:{scale:4.0,roughness:.33}
 };
 function seeded(str){
  let value=2166136261;
  for(const ch of str)value=Math.imul(value^ch.charCodeAt(0),16777619)>>>0;
  return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
 }
 function texture(kind){
  if(low||!finishes[kind])return null;
  if(patterns.has(kind))return patterns.get(kind);
  const rand=seeded('lumenvale-material-'+kind),canvas=document.createElement('canvas');
  canvas.width=256;canvas.height=256;
  const g=canvas.getContext('2d',{willReadFrequently:true});
  if(!g)return null;
  const image=g.createImageData(256,256),data=image.data;
  const diff=kind==='grass'?38:kind==='asphalt'?15:kind==='fabric'?14:kind==='water'?7:kind==='plaster'?10:19;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const i=(y*256+x)*4,noise=(rand()+rand()+rand()-1.5)*diff;
   const variation=Math.sin(x*.13+y*.025)*3+Math.cos(y*.09-x*.021)*2;
   const v=Math.max(195,Math.min(255,239+noise+variation));
   data[i]=v;data[i+1]=v+(kind==='grass'?Math.min(6,rand()*4):0);data[i+2]=v-(kind==='wood'?Math.min(9,rand()*7):0);data[i+3]=255;
  }
  g.putImageData(image,0,0);
  const stroke=(color,width=1)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();};
  if(kind==='brick'||kind==='stone'){
   const size=kind==='brick'?36:60,step=kind==='brick'?67:88;
   g.strokeStyle='rgba(75,79,70,.23)';g.lineWidth=1.4;
   for(let y=3;y<=260;y+=size){
    g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();
    const shift=(Math.floor(y/size)%2)*step*.5;
    for(let x=-step;x<270;x+=step){g.beginPath();g.moveTo(x+shift,y);g.lineTo(x+shift,y+size);g.stroke();}
   }
   for(let i=0;i<220;i++){
    const x=rand()*256,y=rand()*256;
    g.fillStyle='rgba(94,91,81,.10)';g.fillRect(x,y,2+rand()*8,1+rand()*2);
   }
  }else if(kind==='wood'){
   g.lineWidth=.8;
   for(let y=0;y<256;y+=43){
    g.strokeStyle='rgba(79,67,51,.23)';
    g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();
    const offset=(Math.floor(y/43)%2)*115;
    for(let x=-120+offset;x<300;x+=160){
     g.strokeStyle='rgba(87,67,48,.19)';g.beginPath();g.moveTo(x,y);g.lineTo(x,y+43);g.stroke();
    }
   }
   for(let i=0;i<95;i++){
    const y=rand()*256,x=rand()*256;
    g.strokeStyle='rgba(94,74,54,.10)';
    g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+18,y+1,x+32,y-1,x+65,y+rand()*3);g.stroke();
   }
  }else if(kind==='asphalt'){
   for(let i=0;i<1750;i++){
    const x=rand()*256,y=rand()*256,size=.6+rand()*1.75;
    g.fillStyle=i%3?'rgba(30,40,42,.13)':'rgba(255,255,245,.24)';
    g.fillRect(x,y,size,size);
   }
   for(let i=0;i<6;i++){
    const x=rand()*250,y=rand()*250;
    g.strokeStyle='rgba(70,75,75,.13)';g.lineWidth=.6;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+10,y+2);g.lineTo(x+15,y-1);g.stroke();
   }
  }else if(kind==='concrete'||kind==='plaster'||kind==='tile'){
   if(kind==='tile'){
    for(let v=0;v<=256;v+=64){
     g.strokeStyle='rgba(90,88,75,.21)';g.lineWidth=2;
     g.beginPath();g.moveTo(0,v);g.lineTo(256,v);g.moveTo(v,0);g.lineTo(v,256);g.stroke();
    }
   }else if(kind==='concrete'){
    g.lineWidth=1.25;g.strokeStyle='rgba(95,95,90,.18)';
    for(let y=0;y<=256;y+=128){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();}
    for(let x=0;x<=256;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,256);g.stroke();}
   }else{
    for(let i=0;i<320;i++){
     const x=rand()*256,y=rand()*256;
     g.fillStyle=i%2?'rgba(104,98,77,.07)':'rgba(255,255,255,.25)';
     g.fillRect(x,y,.5+rand()*2.3,.5+rand()*2.3);
    }
   }
  }else if(kind==='roof'){
   g.strokeStyle='rgba(64,77,71,.25)';g.lineWidth=1.5;
   for(let y=0;y<256;y+=31){
    g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();
    const shift=(Math.floor(y/31)%2)*31;
    for(let x=shift;x<256;x+=62){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+31);g.stroke();}
   }
  }else if(kind==='grass'){
   for(let i=0;i<1300;i++){
    const x=rand()*256,y=rand()*256;
    g.strokeStyle=i%4?'rgba(58,105,51,.18)':'rgba(230,226,154,.23)';
    g.lineWidth=.7;
    g.beginPath();g.moveTo(x,y);g.lineTo(x-1+rand()*3,y-2-rand()*3);g.stroke();
   }
  }else if(kind==='fabric'){
   g.strokeStyle='rgba(72,72,65,.11)';g.lineWidth=.7;
   for(let i=1;i<256;i+=7){g.beginPath();g.moveTo(i,0);g.lineTo(i,256);g.moveTo(0,i);g.lineTo(256,i);g.stroke();}
  }else if(kind==='water'){
   for(let i=0;i<95;i++){
    const x=rand()*256,y=rand()*256;
    g.strokeStyle='rgba(255,255,255,.16)';g.lineWidth=.65;
    g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+10,y-2,x+24,y);g.stroke();
   }
  }
  const tex=new T.CanvasTexture(canvas);
  tex.name='LumenVale original '+kind+' texture';
  tex.colorSpace=T.SRGBColorSpace;
  tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.anisotropy=Math.min(8,renderer.capabilities?.getMaxAnisotropy?.()||4);
  tex.repeat.set(4,4);
  patterns.set(kind,tex);
  return tex;
 }
 function surface(kind,color='#ffffff',w=8,d=8){
  if(low||!finishes[kind])return new T.MeshLambertMaterial({color,flatShading:true});
  const base=texture(kind);
  const map=base?.clone();
  if(map){
   const scale=finishes[kind].scale;
   map.repeat.set(Math.max(1,w/scale),Math.max(1,d/scale));
   map.needsUpdate=true;
  }
  return new T.MeshStandardMaterial({
   color,map,roughness:finishes[kind].roughness,metalness:kind==='water'?.05:0
  });
 }
 function instanced(kind){
  if(low||!finishes[kind])return new T.MeshLambertMaterial({color:'#ffffff',flatShading:true});
  if(!instances.has(kind))instances.set(kind,new T.MeshStandardMaterial({
   color:'#ffffff',map:texture(kind),roughness:finishes[kind].roughness,metalness:0
  }));
  return instances.get(kind);
 }
 function panel(parent,kind,x,y,z,w,d,color){
  if(low)return null; // Canvas fallback uses existing colored road/sidewalk boxes.
  const geometry=new T.PlaneGeometry(w,d);
  const mesh=new T.Mesh(geometry,surface(kind,color,w,d));
  mesh.position.set(x,y,z);
  mesh.rotation.x=-Math.PI/2;
  mesh.receiveShadow=true;
  mesh.castShadow=false;
  mesh.name='Textured '+kind;
  parent.add(mesh);
  return mesh;
 }
 // A painted atmospheric sky is cheaper than a shader, HD panoramas or a sky dome.
 // It is only used by the WebGL path; the software renderer keeps its solid sky.
 function sky(fraction){
  if(low)return null;
  const step=Math.min(20,Math.max(0,Math.round(fraction*20)));
  if(skies.has(step))return skies.get(step);
  const mix=step/20,cv=document.createElement('canvas');cv.width=256;cv.height=512;
  const g=cv.getContext('2d');if(!g)return null;
  const blend=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
  const rgb=a=>'rgb('+a.join(',')+')';
  const nightTop=[28,48,81],dayTop=[112,168,201];
  const nightHorizon=[129,125,131],dayHorizon=[221,232,207];
  const top=blend(nightTop,dayTop,mix),horizon=blend(nightHorizon,dayHorizon,mix);
  const gradient=g.createLinearGradient(0,0,0,512);
  gradient.addColorStop(0,rgb(top));
  gradient.addColorStop(.62,rgb(blend(top,horizon,.57)));
  gradient.addColorStop(1,rgb(horizon));
  g.fillStyle=gradient;g.fillRect(0,0,256,512);
  const rand=seeded('lumen-sky-'+step);
  for(let i=0;i<12;i++){
   const x=rand()*290-25,y=210+rand()*215,w=30+rand()*90;
   g.fillStyle='rgba(255,255,250,'+(.015+mix*.026).toFixed(3)+')';
   g.beginPath();g.ellipse(x,y,w,6+rand()*15,0,0,Math.PI*2);g.fill();
  }
  const tex=new T.CanvasTexture(cv);tex.name='LumenVale atmospheric sky '+step;
  tex.colorSpace=T.SRGBColorSpace;
  skies.set(step,tex);return tex;
 }
 return {texture,surface,instanced,panel,sky,enabled:!low};
}
