/* Detailed, accessible school. All furniture follows the floor-plan collision rectangles. */
function decorateSchoolExterior(T,place,kit,sign,outside){
 const k=kit(),g=new T.Group(),x=place.x,z=place.z,f=place.face||1,front=z+f*place.d/2,h=place.h;
 g.name='LumenVale School entrance';g.userData.castsShadow=true;outside.add(g);
 // Raised learning hall, central roof pediment and school clock.
 k.box(x,h+.67,z,6.3,.44,3.75,'#536e61');
 k.box(x,h+1.13,z,4.3,.44,2.45,'#efe3c8');
 k.box(x,h+1.64,z,2.55,.68,1.85,'#536b62');
 k.box(x,h+1.97,front+f*.28,1.7,1.49,.19,'#f1e3c9');
 for(const a of [-1,1]){
  k.box(x+a*6.2,h*.50,front+f*.11,.25,h*.9,.28,'#faf3e3');
  k.box(x+a*5.3,1.46,front+f*.17,1.3,1.78,.12,'#668d8a');
  k.box(x+a*5.3,1.46,front+f*.24,.065,1.8,.04,'#f6eddc');
  k.box(x+a*5.3,1.46,front+f*.25,1.29,.063,.04,'#f6eddc');
  k.box(x+a*7.25,5.32,front+f*.20,.79,1.75,.08,a<0?'#ba865a':'#618c85');
  k.box(x+a*6.4,.27,front+f*2.57,1.85,.54,1.21,'#c0a88b');
  k.box(x+a*6.4,.56,front+f*2.57,1.67,.09,1.02,'#678961');
  for(const q of [-.47,0,.47])k.put('stone',x+a*6.4+q,.86,front+f*2.57,.38,.55,.37,q?'#78a06a':'#a2b874');
 }
 for(let i=0;i<3;i++)k.box(x,.067+i*.042,front+f*(2.52-i*.42),5.05-i*.27,.11,.90,'#ded4c0');
 for(const a of [-.56,.56])k.box(x+a,1.15,front+f*.25,.05,1.98,.13,'#f1e9d8');
 k.box(x,3.70,front+f*1.45,6.25,.15,1.02,'#425e57');
 for(const q of [-2.35,2.35])k.light(x+q,3.48,front+f*1.56,.31,.19,.31,'#ffe2a6');
 sign(g,'SCHOOL OF KNOWLEDGE',x,4.44,front+f*.2,6.72,.54,f,'#315e52');
 sign(g,'LEARN  ·  CREATE  ·  GROW',x,5.24,front+f*.2,6.52,.42,f,'#315e52');
 const dial=new T.Mesh(new T.CircleGeometry(.43,28),new T.MeshBasicMaterial({color:'#f8edda',side:T.DoubleSide}));
 dial.position.set(x,h+1.97,front+f*.43);if(f<0)dial.rotation.y=Math.PI;g.add(dial);
 for(let n=0;n<12;n++){const a=n*Math.PI/6;k.box(x+Math.sin(a)*.34,h+1.97+Math.cos(a)*.34,front+f*.453,.032,.053,.012,'#3f605b');}
 k.box(x,h+2.06,front+f*.47,.035,.23,.02,'#3f605b',0,0,-.4);
 k.box(x+.10,h+1.97,front+f*.47,.22,.035,.02,'#3f605b',0,0,-.2);
 k.flush(g);
}
function decorateSchoolInterior(T,k,g,sign,place){
 const wood='#a88762';
 // Central clear route from entry to information; side rooms never block it.
 k.box(0,.048,-.15,2.65,.022,19.6,'#bed0c4');
 for(let z=-8;z<=8;z+=2.5)k.box(0,.063,z,2.58,.014,.05,'#f0e8ce');
 for(const side of [-1,1]){
  k.box(side*3.35,.052,-.2,.08,.018,17.7,'#e4be83');
  k.box(side*12.8,1.05,-.5,.13,1.8,14.5,'#78978b');
  for(let z=-6.3;z<=6.4;z+=1.28){
   k.box(side*12.65,1.23,z,.15,1.48,1.01,z>0?'#83a099':'#789790');
   k.box(side*12.55,1.37,z,.025,.13,.25,'#e5d6b6');
   k.box(side*12.54,.79,z,.03,.06,.15,'#cbaa76');
  }
 }
 for(const z of [-8.6,-2.5,3.1,8.2]){
  k.box(0,4.62,z,21.2,.16,.17,'#668578');
  for(const x of [-8,0,8])k.light(x,4.52,z,1.16,.05,.50,'#ffebbd');
 }
 for(const [x,title,tint] of [[-7,'ACADEMIC PATHWAYS','#486e66'],[7,'CAREER CENTER','#547b7c']]){
  k.box(x,2.57,-11.63,5.75,2.16,.15,'#f0e7d4');
  k.box(x,2.57,-11.52,5.32,1.68,.10,tint);
  sign(g,title,x,3.79,-11.41,5.2,.56,1,'#345d53');
  for(let i=0;i<5;i++){
   k.box(x-2+i,2.30,-11.41,.65,.12,.025,i%2?'#d3e0be':'#ddc392');
   k.box(x-2+i,1.98,-11.41,.55,.11,.02,'#abc0ad');
  }
 }
 function station(x,z,title,tint,kind){
  k.box(x,.75,z,3.70,.16,1.26,wood);
  for(const sx of [-1.51,1.51])for(const dz of [-.40,.40])
   k.box(x+sx,.37,z+dz,.14,.71,.16,'#67685d');
  k.box(x,1.40,z-.28,1.55,.82,.12,'#374f50');
  k.light(x,1.43,z-.205,1.33,.60,.018,tint);
  k.box(x,1.00,z-.01,1.08,.08,.66,'#dbc9a7');
  k.box(x,1.05,z+.20,.57,.025,.29,'#f4ead3');
  k.box(x,.065,z+1.14,3.90,.03,.56,tint);
  sign(g,title,x,2.30,z+1.07,3.70,.45,1,'#345c52');
  if(kind==='science'){
   for(const dx of [-1,1]){
    k.put('trunk',x+dx,1.13,z+.17,.22,.46,.22,'#e1ebe0');
    k.put('stone',x+dx,1.41,z+.17,.25,.20,.27,dx===1?'#90b4cc':'#80b7a1');
   }
  }else if(kind==='quran'){
   // Display book only: teacher evaluation remains external and required.
   k.box(x+.98,1.14,z+.19,.58,.09,.42,'#ae885f',-.17);
   k.box(x+.98,1.24,z+.19,.53,.10,.38,'#426f53',-.17);
   k.box(x+.98,1.30,z+.19,.38,.02,.28,'#ead39b',-.17);
  }else if(kind==='library'){
   for(let i=0;i<7;i++)k.box(x-1.25+i*.21,1.04,z-.39,.13,.20+i%3*.07,.13,
    ['#6f9e9f','#bb916d','#809b7b'][i%3]);
  }else if(kind==='exam'){
   for(let i=0;i<4;i++)k.box(x+.94,1.05+i*.03,z+.12,.42,.03,.51,i%2?'#efe7d0':'#d9bd90');
  }
 }
 station(-7,-6.42,'ACADEMIC STUDIES','#77b4a4','pathways');
 station(7,-6.42,'CAREERS & JOBS','#78a6bd','careers');
 station(-7,-1.20,'QURAN STUDIO','#9bbd83','quran');
 station(7,-1.20,'SCIENCE QUEST','#88c5c0','science');
 station(-7,5.03,'READING CORNER','#d9bc8a','library');
 station(7,5.03,'PRACTICE EXAMS','#b1bfdf','exam');
 // Detailed information wall with slowly rotating globe above floor height.
 sign(g,'WELCOME TO LUMENVALE',0,3.69,-11.43,6.05,.61,1,'#315e53');
 sign(g,'STUDENT INFORMATION',0,1.78,-11.43,3.44,.40,1,'#4c7166');
 for(const x of [-2,2]){
  k.box(x,1.06,-10.66,1.31,2.02,.68,'#ae8d67');
  for(const y of [.60,1.10,1.65])k.box(x,y,-10.29,1.21,.08,.75,'#e5cc9b');
 }
 const globe=new T.Group();
 globe.add(new T.Mesh(new T.SphereGeometry(.50,16,12),
  new T.MeshLambertMaterial({color:'#5399a8',flatShading:true})));
 const ring=new T.Mesh(new T.TorusGeometry(.63,.032,7,28),
  new T.MeshLambertMaterial({color:'#d8bd7d'}));
 ring.rotation.x=.4;globe.add(ring);
 globe.position.set(0,2.57,-10.83);g.add(globe);g.userData.schoolGlobe=globe;
}
