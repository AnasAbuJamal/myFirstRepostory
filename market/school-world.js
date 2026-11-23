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
 const dial=new T.Mesh(new T.CylinderGeometry(.43,.43,.035,28),new T.MeshBasicMaterial({color:'#f8edda',side:T.DoubleSide}));
 dial.position.set(x,h+1.97,front+f*.43);dial.rotation.x=Math.PI/2;if(f<0)dial.rotation.y=Math.PI;g.add(dial);
 for(let n=0;n<12;n++){const a=n*Math.PI/6;k.box(x+Math.sin(a)*.34,h+1.97+Math.cos(a)*.34,front+f*.453,.032,.053,.012,'#3f605b');}
 k.box(x,h+2.06,front+f*.47,.035,.23,.02,'#3f605b',0,0,-.4);
 k.box(x+.10,h+1.97,front+f*.47,.22,.035,.02,'#3f605b',0,0,-.2);
 k.flush(g);
 applySchoolExteriorTextures({T,group:g,place,low:false});
}
function decorateSchoolInterior(T,k,g,sign,place){
 const wood='#a88762';
 // Central clear route from entry to information; side rooms never block it.
 k.box(0,.048,-.15,6.52,.022,19.6,'#e1e4db');
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
 // The same definitions power the 3D workstations and their interaction zones.
 for(const desk of SCHOOL_STATIONS)
  station(desk.x,desk.z,desk.sign,desk.tint,desk.kind);

 // Six recognizable rooms wrap a central corridor. Each room has a wide,
 // unobstructed doorway matching the movement/collision plan in districts.js.
 const roomZones=[
  {start:-11.32,end:-3.38,door:-4.42,nameLeft:'BIOLOGY CLASS',nameRight:'CAREER STUDIO',
   toneLeft:'#dce9d9',toneRight:'#dee7ea',trim:'#678e80'},
  {start:-3.38,end:2.38,door:.85,nameLeft:'QURAN LEARNING',nameRight:'SCIENCE LAB',
   toneLeft:'#efe7d3',toneRight:'#d6e7e1',trim:'#7c9b83'},
  {start:2.38,end:9.78,door:3.65,nameLeft:'READING LIBRARY',nameRight:'EXAM CENTER',
   toneLeft:'#eae1d0',toneRight:'#e0e2eb',trim:'#8292a0'}
 ];
 for(let tier=0;tier<roomZones.length;tier++){
  const room=roomZones[tier],center=(room.start+room.end)*.5,deep=room.end-room.start;
  for(const side of [-1,1]){
   const x=side*7.9,name=side<0?room.nameLeft:room.nameRight;
   k.box(x,.025,center,9.03,.015,deep-.13,side<0?room.toneLeft:room.toneRight);
   // Corridor wall has a 2.2 m door; do not fill the opening with glass.
   for(const [start,end] of [[room.start,room.door-1.10],[room.door+1.10,room.end]]){
    if(end-start<.12)continue;
    k.box(side*3.46,2.17,(start+end)/2,.19,4.30,end-start,'#eee9db');
    k.box(side*3.30,2.0,(start+end)/2,.035,2.8,end-start,'#b3c4b8');
    k.box(side*3.26,.20,(start+end)/2,.045,.40,end-start,room.trim);
   }
   k.box(side*3.46,4.14,room.door,.23,.30,2.23,room.trim);
   for(const dz of [-1.1,1.1])k.box(side*3.46,2.09,room.door+dz,.24,4.15,.09,'#809c8b');
   k.box(side*4.55,3.82,room.door,1.75,.56,.045,room.trim);
   k.box(side*4.53,3.83,room.door+.035,1.56,.38,.03,'#f7f5e7');
   sign(g,name,x,3.62,room.start+.24,5.55,.49,1,'#436958');
   // Feature boards, artwork and high-level shelving face the room.
   k.box(x,2.59,room.start+.33,5.35,1.75,.18,side<0?'#4e7565':'#587d79');
   k.box(x,2.56,room.start+.44,4.93,1.38,.025,'#d9e5d4');
   for(let i=0;i<5;i++){
    k.box(x-2+i,2.67,room.start+.46,.68,.08,.012,i%2?'#e6d3a4':'#9ec5b2');
    k.box(x-2+i,2.34,room.start+.47,.48,.07,.012,'#e7eee3');
   }
   k.box(side*11.32,1.01,center,1.10,1.60,1.20,'#8eaa9c');
   for(const level of [.59,.98,1.36]){
    k.box(side*11.32,level,center,1.04,.055,1.14,'#f0e1c4');
    for(const d of [-.40,-.14,.15,.40])
     k.box(side*11.32,level+.15,center+d,.45,.24,.08,tier===2?'#a9927a':'#7c9b9a');
   }
   // Worktable & two chairs in each subject room, offset from interactive station.
   k.box(side*10.0,.77,center+1.42,2.42,.12,1.22,'#aa8968');
   for(const dx of [-.97,.97])for(const dz of [-.46,.46])
    k.box(side*10.0+dx,.39,center+1.42+dz,.10,.75,.12,'#556b60');
   for(const dz of [-1.05,1.07]){
    k.box(side*10,.48,center+1.42+dz,1.07,.12,.62,'#6b8980');
    k.box(side*10,.93,center+1.42+dz+.25,.99,.89,.09,'#698379');
   }
   // Warm, recessed linear ceiling lights clarify the room boundaries.
   k.box(x,4.70,center,5.2,.16,deep-.4,'#e9e5d9');
   for(const lampX of [x-2.0,x+2.0])k.light(lampX,4.57,center,.41,.045,deep-1,'#fff5da');
  }
  if(tier<2)for(const side of [-1,1]){
   k.box(side*8.14,2.2,room.end,9.58,4.40,.18,'#eeeadd');
   k.box(side*8.14,.22,room.end,9.58,.43,.06,'#8eae9b');
  }
 }
 // Reception and waiting lounge sit to either side of the main entry,
 // preserving the center aisle and the exit at z=11.0.
 k.box(-8.2,.86,10.22,4.10,.21,1.28,'#886b52');
 k.box(-8.2,1.47,10.58,4.10,1.08,.16,'#719387');
 k.box(-8.2,1.52,10.50,3.65,.065,.08,'#d3e5d3');
 k.box(-8.2,.44,10.38,3.78,.69,.92,'#b59a79');
 sign(g,'STUDENT RECEPTION',-8.2,2.75,10.91,4.48,.45,1,'#416857');
 for(const z of [9.48,10.6]){
  k.box(8.25,.53,z,4.12,.20,.58,'#648478');
  k.box(8.25,.97,z+.20,4.12,.68,.13,'#607c71');
  for(const sx of [-1.77,1.77])k.box(8.25+sx,.25,z,.16,.48,.47,'#6c776e');
 }
 k.box(0,.052,10.6,2.60,.025,1.18,'#efe3bd');
 sign(g,'WELCOME · MY COURSES · GRADES',0,3.63,11.63,8.0,.44,-1,'#42685d');
 // School timetable and accessible route markers.
 for(const [z,label] of [[-5.25,'CLASSROOMS'],[.05,'LIBRARY · LAB'],[5.9,'STUDENT HUB']]){
  k.box(0,3.31,z,2.20,.62,.10,'#35584d');
  sign(g,label,0,3.33,z+.079,2.08,.42,1,'#35584d');
 }
 // Additional figures: a teacher and students with low-poly animated limbs.
 const people=[],cube=new T.BoxGeometry(1,1,1);
 const skin=['#b98562','#e4b996','#916d56','#d4a47c','#b89b84'];
 function schoolPerson(x,z,shirt,index,standing=false){
  const body=new T.Group(),materials=new Map();
  function shape(group,w,h,d,color,px,py,pz){
   if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color}));
   const m=new T.Mesh(cube,materials.get(color));
   m.scale.set(w,h,d);m.position.set(px,py,pz);group.add(m);return m;
  }
  shape(body,.43,.53,.28,shirt,0,standing?1.15:.98,0);
  shape(body,.36,.17,.27,'#44535c',0,.78,0);
  const neck=shape(body,.15,.19,.14,skin[index%skin.length],0,1.47,0);
  const head=shape(body,.32,.37,.29,skin[index%skin.length],0,1.64,0);
  shape(body,.33,.12,.29,index%3?'#4b3937':'#3d302d',0,1.86,-.012);
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const arm=new T.Group();arm.position.set(side*.28,1.32,0);
   shape(arm,.15,.42,.17,shirt,0,-.17,0);arms.push(arm);body.add(arm);
   const leg=new T.Group();leg.position.set(side*.115,.69,0);
   shape(leg,.16,.49,.19,'#475d65',0,-.26,0);
   shape(leg,.20,.11,.28,'#374b49',0,-.53,.02);legs.push(leg);body.add(leg);
  }
  body.position.set(x,0,z);body.rotation.y=(index%4)*Math.PI/2;
  g.add(body);people.push({body,arms,legs,phase:index*1.11,standing});
 }
 schoolPerson(-9.6,-9.15,'#6a9a88',0,true);
 schoolPerson(9.6,-9.15,'#bd986a',1,false);
 schoolPerson(-9.6,-1.52,'#879aaf',2,false);
 schoolPerson(9.6,-1.52,'#7ba78e',3,true);
 schoolPerson(-9.6,7.12,'#ba8875',4,false);
 schoolPerson(9.6,7.12,'#708f99',5,false);
 g.userData.schoolPeople=people;

 // Architectural detail pass: trim and wayfinding, not more visual noise.
 // These are decorative pieces only; the interactive desks and collision
 // boundaries remain exactly where they were.
 const oak='#b28e66',ivory='#f1ede2',brass='#b7a078',sage='#557e70',ink='#294946';
 // Continuous corridor ceiling coves emphasize perspective and scale.
 for(const side of [-1,1]){
  k.box(side*2.92,4.83,-.18,.115,.12,21.35,oak);
  k.light(side*2.81,4.76,-.18,.045,.025,21.20,'#fcead0');
  k.box(side*3.19,.18,-.18,.055,.30,20.9,brass);
  // One carefully composed oak-panelled feature wall per section,
  // set behind existing teaching stations, never across a doorway.
  for(const z of [-8.83,-1.87,6.88]){
   for(let i=0;i<7;i++){
    k.box(side*12.72,2.07,z+(i-3)*.28,.065,2.95,.045,i%3===0?brass:oak);
   }
   k.box(side*12.67,3.58,z, .075,.11,2.36,ivory);
   k.box(side*12.67,.54,z, .075,.11,2.36,ivory);
  }
 }
 // Subject-coded illuminated markers at the room entrances.
 const wayfinding=[
  {z:-4.42,l:'BIOLOGY',r:'CAREERS',c:'#648b79'},
  {z:.85,l:'QURAN',r:'SCIENCE',c:'#7b998b'},
  {z:3.65,l:'LIBRARY',r:'EXAMS',c:'#9b9c80'}
 ];
 for(const area of wayfinding){
  k.box(0,4.61,area.z,3.52,.14,.12,oak);
  for(const side of [-1,1]){
   const x=side*3.47;
   k.box(x,3.91,area.z,.25,.11,2.19,brass);
   k.light(x,3.82,area.z,.065,.04,1.88,'#ffebc8');
   const label=side<0?area.l:area.r;
   // Text plane faces along +Z and stays above the opening.
   sign(g,label,side*3.65,3.96,area.z,1.95,.30,1,ink);
  }
 }
 // A warmer, more believable desk edge and inset lighting at reception.
 for(const x of [-9.90,-6.50]){
  k.box(x,.89,10.82,.06,.13,.08,brass);
 }
 k.light(-8.2,1.08,10.88,3.52,.045,.035,'#fff0d2');
 // Slim framed faculty information panels, kept off the main walk aisle.
 for(const x of [-2.45,2.45]){
  k.box(x,1.94,-11.16,1.12,1.50,.10,oak);
  k.box(x,1.94,-11.10,.97,1.35,.025,ivory);
  k.box(x,2.42,-11.065,.70,.045,.02,sage);
  for(let t=0;t<3;t++)k.box(x,2.14-t*.27,-11.057,.60,.028,.02,'#a8b6a9');
 }

 // Detailed information wall with slowly rotating globe above floor height.
 sign(g,'WELCOME TO LUMENVALE',0,3.69,-11.43,6.05,.61,1,'#315e53');
 sign(g,'STUDENT INFORMATION',0,1.78,-11.43,3.44,.40,1,'#4c7166');
 for(const x of [-2,2]){
  k.box(x,1.06,-10.66,1.31,2.02,.68,'#ae8d67');
  for(const y of [.60,1.10,1.65])k.box(x,y,-10.29,1.21,.08,.75,'#e5cc9b');
 }
 const globe=new T.Group();
 globe.add(new T.Mesh(new T.IcosahedronGeometry(.50,2),
  new T.MeshLambertMaterial({color:'#5399a8',flatShading:true})));
 const circle=[];for(let i=0;i<36;i++){
  const a=i*Math.PI*2/36;circle.push(Math.cos(a)*.63,Math.sin(a)*.63,0);
 }
 const ringGeometry=new T.BufferGeometry();
 ringGeometry.setAttribute('position',new T.Float32BufferAttribute(circle,3));
 const ring=new T.LineLoop(ringGeometry,new T.LineBasicMaterial({color:'#d8bd7d'}));
 ring.rotation.x=.4;globe.add(ring);
 globe.position.set(0,2.57,-10.83);g.add(globe);g.userData.schoolGlobe=globe;
}
