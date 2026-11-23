const assert = require('node:assert/strict');
const {test} = require('node:test');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function world() {
 const sandbox=vm.createContext({});
 const source=readFileSync(path.join(__dirname,'districts.js'),'utf8');
 vm.runInContext(source+'\n'+String.raw`
var player={x:0,z:0,yaw:0,pitch:0},campusInterior=null,systemsDriving=false;
var cityState={sites:{mill:{built:true}}}, campusState={plots:{mill:{rotation:1}}};
var CITY_SITES=[{name:"Mill",title:"Mill",kind:"factory",id:"mill",x:-26,z:9}];
var notice=()=>{},stopMovement=()=>{},refreshPosition=()=>{},drawScene=()=>{};
var action=null,cityBookList=()=>action="library", campusSchool=()=>action="school";
var campusFactoryMachine=()=>action="factory", systemsPanel=tab=>action=tab;
`,sandbox);
 return code=>vm.runInContext(code,sandbox);
}
test('public buildings have reachable doors, separate floor plans and collision',()=>{
 const run=world();
 const result=run('TOWN_PLACES.map(place=>{const e=townEntrance(place);return [districtWalk(e.x,e.z),districtNearby(e)?.place.id===place.id,!districtWalk(place.x,place.z)]})');
 assert.equal(result.length,6);
 assert.ok(result.every(row=>row.every(Boolean)));
});
test('each door loads a walkable room and an exit restores the same doorway',()=>{
 const run=world();
 const result=run(`TOWN_PLACES.map(place=>{
  const e=townEntrance(place);
  districtInteract(districtNearby(e));
  const entered=districtVisit.place.id===place.id&&districtWalk(player.x,player.z);
  const departed=districtNearby({x:0,z:place.room[1]-.7});
  districtInteract(departed);
  return entered && districtVisit===null && player.x===e.x && player.z===e.z;
 })`);
 assert.ok(result.every(Boolean));
});
test('school, library and relocated factory interiors invoke existing systems',()=>{
 const run=world();
 const result=run(`
 const school=TOWN_PLACES.find(x=>x.id==='school');
 districtInteract(districtNearby(townEntrance(school)));
 districtInteract(districtNearby(school.desks[0]));
 const schoolAction=action;
 districtInteract({key:'exit'});
 const library=TOWN_PLACES.find(x=>x.id==='library');
 districtInteract(districtNearby(townEntrance(library)));
 districtInteract(districtNearby(library.desks[0]));
 const libraryAction=action;
 districtInteract({key:'exit'});
 const rotated=factoryEntrance(CITY_SITES[0],1);
 districtInteract(districtNearby(rotated));
 districtInteract(districtNearby(FACTORY_ROOM.desks[0]));
 const ok=campusInterior?.id==='mill' && action==='factory';
 districtInteract({key:'exit'});
 [schoolAction,libraryAction,ok,campusInterior===null]
 `);
 assert.equal(JSON.stringify(result),JSON.stringify(['school','library',true,true]));
});
