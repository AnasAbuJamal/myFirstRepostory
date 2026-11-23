// Low-poly character rig shared by street residents and office visitors.
function makeTownCitizen(T,piece,box,{coat,skin,hair,pants,style='short',bag=false}){
 const rig=new T.Group(), arms=[],legs=[];
 const block=(...values)=>box(rig,...values);
 block(0,.84,0,.36,.19,.235,pants);
 block(0,1.102,0,.405,.46,.245,coat);
 block(0,1.305,.01,.456,.14,.267,coat);
 block(0,1.060,.129,.031,.36,.012,'#d9d6c9');
 block(.113,1.143,.136,.101,.099,.016,coat);
 block(.114,1.180,.147,.093,.014,.014,'#d9d6c9');
 piece(rig,'trunk',0,1.375,.01,.16,.17,.16,skin);
 piece(rig,'rock',0,1.544,.026,.177,.208,.166,skin);
 piece(rig,'rock',0,1.661,-.012,.185,.132,.171,hair);
 if(style==='long'){
  block(0,1.448,-.106,.30,.24,.10,hair);
  for(const sign of [-1,1])block(sign*.133,1.412,-.04,.074,.29,.095,hair);
 }
 if(style==='cap'){
  block(0,1.644,.111,.257,.056,.211,coat);
  piece(rig,'rock',0,1.684,.011,.181,.084,.173,coat);
 }
 for(const side of [-1,1]){
  piece(rig,'rock',side*.149,1.52,.026,.038,.069,.042,skin);
  block(side*.058,1.565,.166,.023,.029,.017,'#2a2c27');
  block(side*.061,1.602,.164,.043,.012,.015,hair);
  const leg=new T.Group();leg.position.set(side*.101,.814,0);rig.add(leg);legs.push(leg);
  box(leg,0,-.35,0,.172,.697,.19,pants);
  box(leg,0,-.716,.035,.187,.140,.264,'#374743');
  box(leg,0,-.771,.035,.194,.042,.267,'#e7e3d2');
  const arm=new T.Group();arm.position.set(side*.248,1.327,0);rig.add(arm);arms.push(arm);
  arm.rotation.z=side*.095;
  box(arm,0,-.183,0,.132,.37,.151,coat);
  box(arm,0,-.348,0,.14,.081,.16,'#7b857d');
  piece(arm,'rock',0,-.437,.012,.068,.096,.066,skin);
 }
 piece(rig,'rock',0,1.526,.174,.031,.053,.030,skin);
 block(0,1.471,.157,.061,.011,.014,'#875d50');
 if(bag){
  block(-.267,.95,.135,.228,.27,.12,'#b49460');
  block(-.266,1.04,.202,.221,.119,.023,'#c7a575');
  block(-.13,1.173,.148,.046,.36,.024,'#7b654b').rotation.z=-.72;
 }
 return {rig,arms,legs};
}
