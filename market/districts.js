// The public street plan is shared by scenery, collision, the map and door prompts.
const TOWN_BOUNDS={left:-58,right:69,north:-18,south:84};
const STREET_PLAN=[
 {name:'Market Avenue',axis:'x',at:-9.8,from:-20,to:62,width:7.8},
 {name:'Foundry Avenue',axis:'x',at:21.3,from:-50,to:62,width:8.2},
 {name:'Park Avenue',axis:'x',at:41.5,from:-50,to:62,width:8.2},
 {name:'Orchard Street',axis:'x',at:66,from:-20,to:62,width:7.4},
 {name:'Campus Lane',axis:'z',at:-50,from:4,to:41.5,width:7.0},
 {name:'Mill Street',axis:'z',at:-20,from:-9.8,to:66,width:7.2},
 {name:'Market Street',axis:'z',at:8,from:21.3,to:66,width:7.2},
 {name:'Depot Road',axis:'z',at:39,from:-9.8,to:66,width:7.8},
 {name:'Eastbank Road',axis:'z',at:62,from:-9.8,to:66,width:7.0},
];
const DOWNTOWN_FRONTAGE=[
 {id:'press',name:'Vale Press',kind:'press',room:[8,7],desks:[{x:0,z:-2.4,r:2,key:'words',label:'Open My Words at the publishing desk'}],x:-7.8,z:-.35,w:6,d:6.8,h:7.5,face:-1,brick:'#ded7c9',trim:'#faf2df',accent:'#587d87'},
 {id:'cafe',name:'Juniper Café',kind:'cafe',room:[8,8],desks:[{x:0,z:-2.4,r:2,key:'shop',label:'Read the café trade noticeboard'}],x:15.5,z:-.65,w:7.6,d:6.2,h:8.5,face:-1,brick:'#eee4cf',trim:'#fffae9',accent:'#a96c46'},
];
const TOWN_DISTRICTS=[
 {name:'Learning Quarter',x:-37,z:-5,tint:'#bca675'},
 {name:'Foundry District',x:-32,z:30,tint:'#a98772'},
 {name:'Civic Square',x:0,z:11,tint:'#c6a879'},
 {name:'Riverside Market',x:49,z:21,tint:'#9aa98c'},
 {name:'Orchard Row',x:46,z:55,tint:'#a6b489'},
 {name:'Lumen Park',x:-5,z:51,tint:'#7b9a70'},
];
const TOWN_PLACES=[
 {id:'school',name:'LumenVale School',kind:'school',x:-37,z:-4.6,w:17,d:11,h:7.8,face:1,room:[13,12],brick:'#e8dfce',trim:'#f9f2e1',
  desks:[{x:-7,z:-.8,r:2,key:'school',label:'Open classes, exams and GPA'},{x:7,z:-.8,r:2,key:'careers',label:'Visit the career office'}]},
 {id:'library',name:'Reading Library',kind:'library',x:16,z:10.2,w:13,d:10,h:7.1,face:-1,room:[11,11],brick:'#e2ded4',trim:'#faf6ed',
  desks:[{x:0,z:-2.0,r:2.0,key:'browse',label:'Browse library books'},{x:-6,z:1.8,r:2,key:'words',label:'Open My Words'}]},
 {id:'city-hall',name:'City Hall',kind:'hall',x:-.65,z:10.9,w:10.5,d:8.8,h:7.8,face:-1,room:[10,9],brick:'#e8dfce',trim:'#f9f1db',
  desks:[{x:0,z:-2.2,r:2,key:'civic',label:'Open City Hall services'},{x:-5,z:1.5,r:2,key:'build',label:'Open City Architect'}]},
 {id:'warehouse',name:'Eastbank Warehouse',kind:'warehouse',x:25.8,z:.25,w:12.1,d:9.1,h:6.2,face:1,entry:3.25,room:[13,10],brick:'#bac8c1',trim:'#e7ebe1',
  desks:[{x:-5,z:-2.7,r:2,key:'warehouse',label:'Manage warehouse inventory'},{x:6,z:2.6,r:2,key:'contracts',label:'Review city contracts'}]},
 {id:'market-shop',name:'Fern & Finch',kind:'shop',x:51,z:9.25,w:12.5,d:9.8,h:7.0,face:1,room:[9,8],brick:'#eaddd4',trim:'#fcf5e8',accent:'#775484',
  desks:[{x:0,z:-2.5,r:2,key:'shop',label:'Read the market bulletin'}]},
 {id:'outfitter',name:'Eastbank Outfitters',kind:'shop',x:51,z:32.2,w:11.5,d:9.2,h:6.7,face:-1,room:[9,8],brick:'#dedfd2',trim:'#f5f4e7',accent:'#438878',
  desks:[{x:0,z:-2.5,r:2,key:'shop',label:'Read the supply bulletin'}]},
];
const TOWN_PUBLIC_PLACES=[...TOWN_PLACES,...DOWNTOWN_FRONTAGE];
const FACTORY_ROOM={room:[14,12],kind:'factory',desks:[{x:0,z:-3.6,r:2,key:'machine',label:'Operate production machine'},
 {x:-8,z:.0,r:2,key:'staff',label:'Manage worker stations'}]};
let districtVisit=null;
function atStreet(x,z,margin=0){
 return STREET_PLAN.some(s=>{
  const along=s.axis==='x'?x:z, across=s.axis==='x'?z:x;
  return along>s.from-margin&&along<s.to+margin&&Math.abs(across-s.at)<s.width/2+margin;
 });
}
function placeOverlap(place,x,z,padding=0){
 return Math.abs(x-place.x)<place.w/2+padding&&Math.abs(z-place.z)<place.d/2+padding;
}
function factoryEntrance(site,turns=0){
 const a=turns*Math.PI/2;
 return {x:site.x-4.65*Math.sin(a),z:site.z-4.65*Math.cos(a),yaw:a};
}
function townEntrance(place){
 return {x:place.x+(place.entry||0),z:place.z+place.face*(place.d/2+.88),yaw:place.face===1?Math.PI:0};
}
function indoorFurniture(kind){
 if(kind==='library')return [[-8,-6.55,-7,5],[6.55,8,-7,5],[-3.8,3.8,-5.9,-4.1],...[-4.2,4.2].flatMap(x=>[1,5.2].map(z=>[x-1.05,x+1.05,z-.7,z+.7]))];
 if(kind==='school')return [-1,1].flatMap(a=>[[a*7-1.65,a*7+1.65,-7.25,-5.95],...[a*6.15,a*8.9].flatMap(x=>[-4.3,-2.6].map(z=>[x-.6,x+.6,z-.4,z+.4]))]);
 if(kind==='hall')return [[-3.8,3.8,-5.8,-4.0],[-8,-6.3,-4.0,3.1],[6.3,8,-4.0,3.1]];
 if(kind==='warehouse')return [[-11.3,-8.3,-7.3,5.2],[8.3,11.3,-7.3,5.2],[-3,3,-8,-5.1]];
 if(kind==='press')return [[-6.65,-5,-5.4,3.8],[5,6.65,-5.4,3.8],[-2.9,2.9,-5.25,-3.72]];
 if(kind==='cafe')return [[-3.5,3.5,-5.35,-3.89],...[-4,4].flatMap(x=>[.5,4].map(z=>[x-.85,x+.85,z-.65,z+.65]))];
 if(kind==='factory')return [[-3.6,3.6,-7.8,-4.8],[4.8,10,-9,-3.5],[-11,-9.1,-4,4.5]];
 return [[-7.6,-6,-5.5,4],[6,7.6,-5.5,4],[-3.8,3.8,-5.6,-4],[-1.85,1.85,1.89,3.31]];
}
function districtWalk(x,z){
 if(districtVisit){
  const place=districtVisit.place,[w,d]=place.room;
  return Math.abs(x)<w-.35&&Math.abs(z)<d-.35&&!indoorFurniture(place.kind).some(([l,r,n,s])=>
   x>l-.20&&x<r+.20&&z>n-.20&&z<s+.20);
 }
 return x>=TOWN_BOUNDS.left&&x<=TOWN_BOUNDS.right&&z>=TOWN_BOUNDS.north&&z<=TOWN_BOUNDS.south&&
  !TOWN_PUBLIC_PLACES.some(p=>placeOverlap(p,x,z,.19))&&
  !TOWN_STREET_SOLIDS.some(p=>placeOverlap(p,x,z,.19))&&
  !['office','research','train','home'].some(id=>typeof systemsState!=='undefined'&&systemsState.upgrades[id]&&placeOverlap(CITY_UPGRADE_LOTS[id],x,z,.19))&&
  !(x>30.6&&x<34.2&&z>44.3&&z<54.5)&&
  !TOWN_HOMES.some(p=>placeOverlap(p,x,z,.19));
}
const TOWN_HOMES=[
 {x:23.2,z:51,w:9,d:10,brick:'#be9273'},{x:50,z:52,w:10,d:9,brick:'#aea17f'},
 {x:53,z:76,w:11,d:8,brick:'#c1a789'},{x:18,z:76,w:10,d:8,brick:'#aa8171'},
 {x:-42,z:56,w:12,d:10,brick:'#a49c80'},
];
// Footprints use the same city coordinates as the renderer, the phone map and the architect.
function townRect(x,z,w,d){return {x,z,w,d};}
function townIntersects(a,b,clearance=0){
 return Math.abs(a.x-b.x)<(a.w+b.w)/2+clearance && Math.abs(a.z-b.z)<(a.d+b.d)/2+clearance;
}
function streetFootprint(s){
 const middle=(s.from+s.to)/2,length=s.to-s.from;
 return s.axis==='x'?townRect(middle,s.at,length,s.width):townRect(s.at,middle,s.width,length);
}
const TOWN_ROAD_BEDS=STREET_PLAN.map(streetFootprint);
const MARKET_OFFICE=townRect(0,.13,8.8,8.5);
const PARK_COURT=townRect(-10.4,54.7,8.2,10);
const PARK_FOUNTAIN=townRect(-.1,54.2,4.1,3.8);
const CITY_UPGRADE_LOTS={
 office:townRect(-40,10.9,7.2,6.3),research:townRect(49,-.15,7.3,6.4),
 power:townRect(-42,30.5,6.4,6.1),train:townRect(-11,32,5.9,3.8),
 home:townRect(30,32,6.5,5.1),garden:townRect(-30,53,5.4,4.8),
 delivery:townRect(25,6.1,3.1,1.8)
};
// Doorways keep a two-metre clear approach from their frontage.
const TOWN_DOOR_PATHS=TOWN_PUBLIC_PLACES.map(p=>townRect(
 p.x+(p.entry||0),p.z+p.face*(p.d/2+1.45),2.05,3
));
TOWN_DOOR_PATHS.push(townRect(2.63,-4.60,1.8,2.4));
const TOWN_FURNITURE=[];
function townFurniture(kind,positions,w,d){
 for(const [x,z] of positions)TOWN_FURNITURE.push({kind,...townRect(x,z,w,d)});
}
townFurniture('tree',[
 [-14,-16],[-8.8,-16],[1.1,-16],[10,-16],[19,-16],[28,-16],[47,-16],[55,-16],
 [-44,3.4],[-30,3.4],[46.1,15.85],[53.9,15.85],[45.65,26.51],[53.7,26.51],
 [-14.5,47.7],[-7.8,47.7],[2.55,47.5],[-14.5,61],[-7,61],[1.5,61],
 [15,47.8],[26,59.9],[46.5,60.1],[55,60.1]
],2.05,2.05);
townFurniture('lamp',[
 [-12,-5.16],[5.5,-5.16],[19.4,-5.16],[33,-5.16],[45,-5.16],[56,-5.16],
 [-41.5,3.45],[-32.5,3.45],[11.7,3.95],[18.45,3.95],[-4.65,5.1],[3.45,5.1],
 [43.9,16],[55.5,16],[44.0,26.6],[55.8,26.6],[-12.2,47.2],[1.6,59.2],
 [14.4,60],[29.8,60.4],[43.8,60.1],[57.1,60.2]
],.38,.38);
townFurniture('bench',[[-39.86,3.4],[13.1,3.9],[-3,4.95],[47.8,26.65],[-.2,49.1],[-.2,58.5]],2.14,.6);
townFurniture('bin',[[-38.45,3.4],[14.55,3.9],[-5.8,5.15],[49.35,26.65],[1.25,49.1]],.5,.5);
townFurniture('planter',[[-3.4,-5.06],[.45,-5.06],[12.8,-5.08],[18.15,-5.08],[48.6,16.07]],1.30,.62);
const TOWN_PARKING=[[-40,18.21,'#bc725f'],[20,18.21,'#6795ad'],[49,18.21,'#dbb452']];
const TOWN_WALKS=[
 {x:-11.5,z:-4.37,span:1.35},{x:24.4,z:-5.08,span:1.6},
 {x:-36.5,z:5.45,span:4.1},{x:56.35,z:26.15,span:.60},
 {x:-4.45,z:46.35,span:1.5},{x:50,z:61.4,span:3.3},
];

const TOWN_RESERVED=[
 MARKET_OFFICE,...TOWN_PUBLIC_PLACES,...TOWN_HOMES,...Object.values(CITY_UPGRADE_LOTS),
 ...TOWN_DOOR_PATHS,...TOWN_FURNITURE,townRect(-6.5,54.6,19.2,17.9),
 townRect(32.45,49.2,5.6,5.6),townRect(5.1,-4.12,1.0,.68),
 townRect(-4.3,-16,5.8,3.4),...TOWN_WALKS.map(p=>townRect(p.x,p.z,p.span*2+.6,.5))
];
const TOWN_STREET_SOLIDS=[
 ...TOWN_FURNITURE.map(f=>f.kind==='tree'?townRect(f.x,f.z,.36,.36):f),
 ...TOWN_PARKING.map(([x,z])=>townRect(x,z,2.92,1.48)),
 PARK_FOUNTAIN,townRect(5.1,-4.12,1.0,.68)
];
function streetCurbRuns(street,side){
 const edge=street.at+side*street.width/2;
 const cuts=STREET_PLAN.filter(other=>other.axis!==street.axis&&edge>=other.from&&edge<=other.to)
  .map(s=>[s.at-s.width/2,s.at+s.width/2]).sort((a,b)=>a[0]-b[0]);
 const runs=[];
 let start=street.from;
 for(const [low,high] of cuts){
  if(high<=start||low>=street.to)continue;
  if(low>start)runs.push([start,low]);
  start=Math.max(start,high);
 }
 if(start<street.to)runs.push([start,street.to]);
 return runs;
}
function districtName(x,z){
 if(districtVisit)return districtVisit.place.name;
 const street=STREET_PLAN.find(s=>townIntersects(townRect(x,z,.05,.05),streetFootprint(s)));
 if(street)return street.name;
 if(x<-29&&z<=7)return 'Learning Quarter';
 if(x<-14&&z<34)return 'Foundry District';
 if(z>=40&&x<13&&x>-19)return 'Lumen Park';
 if(z>=39)return 'Orchard Row';
 if(x>=12)return 'Riverside Market';
 return 'Civic Square';
}
function districtNearby(p){
 if(districtVisit){
  const {place}=districtVisit;
  if(Math.hypot(p.x,p.z-place.room[1]+.70)<2.0)return {district:true,key:'exit',label:'Exit '+place.name};
  const desk=place.desks.find(d=>Math.hypot(p.x-d.x,p.z-d.z)<d.r);
  return desk?{district:true,key:desk.key,label:desk.label}:null;
 }
 for(const place of TOWN_PUBLIC_PLACES){
  const e=townEntrance(place);
  if(Math.hypot(p.x-e.x,p.z-e.z)<2.2)return {district:true,key:'enter',place,origin:e,label:'Enter '+place.name};
 }
 if(typeof CITY_SITES!=='undefined')for(const site of CITY_SITES){
  if(site.kind!=='factory'||!cityState.sites[site.id]?.built)continue;
  const origin=factoryEntrance(site,campusState.plots?.[site.id]?.rotation||0);
  if(Math.hypot(p.x-origin.x,p.z-origin.z)<1.55)return {district:true,key:'enter',site,origin,
   place:{...FACTORY_ROOM,id:site.id,name:site.title},label:'Enter '+site.title};
 }
 return null;
}
function districtInteract(target){
 if(target.key==='enter'){
  if(systemsDriving)return notice('Park and exit the van before going inside.');
  districtVisit={place:target.place,origin:target.origin};
  if(target.site)campusInterior={id:target.site.id};
  player={...player,x:0,z:target.place.room[1]-2.3,yaw:0,pitch:-.05};
  stopMovement();refreshPosition();drawScene();
  return;
 }
 if(target.key==='exit'){
  const origin=districtVisit.origin;
  player={...player,...origin,pitch:0};
  districtVisit=null; campusInterior=null;
  stopMovement();refreshPosition();drawScene();
  return;
 }
 switch(target.key){
 case 'school':campusSchool();break;
 case 'careers':campusCareer();break;
 case 'browse':cityBookList();break;
 case 'words':campusVocabulary();break;
 case 'civic':systemsPanel('overview');break;
 case 'build':campusArchitect();break;
 case 'warehouse':systemsPanel('warehouse');break;
 case 'contracts':systemsPanel('contracts');break;
 case 'machine':campusFactoryMachine();break;
 case 'staff':campusFactoryStaff();break;
 case 'shop':
  cityPanel(districtVisit.place.name,'Trade noticeboard',
   '<p>Visit City Hall to view contracts and check what local businesses need.</p><div class="city-actions"><button type="button" data-systems="tab" data-tab="contracts" class="button primary">View contracts</button></div>');
  break;
 }
}

