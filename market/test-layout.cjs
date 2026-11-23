const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const game=vm.createContext({localStorage:{getItem:()=>null}});
for(const name of ['walk.js','districts.js','city.js','systems.js','campus.js','city-world.js']){
 vm.runInContext(read(name),game);
}
const run=source=>vm.runInContext(source,game);
run(`
 const objects=[
  ...TOWN_PUBLIC_PLACES,...TOWN_HOMES.map((p,i)=>({...p,name:'Home '+i})),
  {...MARKET_OFFICE,name:'Market Office'},
  ...Object.entries(CITY_UPGRADE_LOTS).map(([name,p])=>({...p,name})),
  ...CITY_SITES.map(p=>({...townRect(p.x,p.z,9.7,8.4),name:p.title})),
  {...PARK_COURT,name:'Court'},{...PARK_FOUNTAIN,name:'Fountain'},
  ...TOWN_FURNITURE.map(f=>({...f,name:f.kind+' '+f.x+','+f.z})),
  ...LV_TREASURES.map(t=>({...townRect(t.x,t.z,.83,.59),name:t.id})),
  ...LV_CHARACTERS.map(t=>({...townRect(t.x,t.z,.58,.4),name:t.name})),
  {...townRect(STAND.x,STAND.z,3.1,2.15),name:'Pickup stand'},
  {...townRect(5.1,-4.12,1,.68),name:'Mailbox'},
  ...TOWN_WALKS.map((p,i)=>({...townRect(p.x,p.z,p.span*2+.60,.45),name:'Pedestrian route '+i}))
 ];
`);
test('buildings, scenery, pedestrians and unlocked upgrades have distinct footprints',()=>{
 const clashes=run(`objects.flatMap((a,i)=>objects.slice(i+1).filter(b=>townIntersects(a,b,.03)).map(b=>a.name+' / '+b.name))`);
 assert.equal(clashes.join('\n'),'');
});
test('roadways and doorway approaches stay clear',()=>{
 const clashes=run(`objects.flatMap(a=>[
  ...STREET_PLAN.filter(s=>townIntersects(a,streetFootprint(s),.05)).map(s=>a.name+' / '+s.name),
  ...TOWN_DOOR_PATHS.filter(d=>townIntersects(a,d)&&!TOWN_PUBLIC_PLACES.includes(a)&&a.name!=='Market Office').map(d=>a.name+' / entrance '+d.x)
 ])`);
 assert.equal(clashes.join('\n'),'');
});
test('marked parking stays away from junctions and moving vehicles',()=>{
 assert.ok(run(`TOWN_PARKING.every(([x,z])=> {
  const bay=townRect(x,z,4.45,1.72);
  return !STREET_PLAN.filter(s=>s.axis==='z').some(s=>townIntersects(bay,streetFootprint(s),2))&&
   [20.12,22.65].every(lane=>Math.abs(z-lane)>.86+.81);
 })`));
});
test('a player can walk from the office to every public entrance with all upgrades and factories built',()=>{
 const missed=run(`(()=>{
  for(const key of Object.keys(CITY_UPGRADE_LOTS))systemsState.upgrades[key]=true;
  for(const p of CITY_SITES)cityState.sites[p.id]={built:true,owned:true};
  const units=2,start=[5,-5],queue=[start],visited=new Set([start.join(',')]);
  const settings={doorOpen:true,stand:true};
  for(let i=0;i<queue.length;i++){
   const [x,z]=queue[i];
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx,nz=z+dz,key=nx+','+nz;
    if(!visited.has(key)&&canWalk(nx/units,nz/units,settings)){
     visited.add(key);queue.push([nx,nz]);
    }
   }
  }
  const targets=[...TOWN_PUBLIC_PLACES.map(p=>({...townEntrance(p),name:p.name})),
   ...CITY_SITES.filter(p=>p.kind==='factory').map(p=>({...factoryEntrance(p),name:p.title}))];
  return targets.filter(p=>!visited.has(Math.round(p.x*units)+','+Math.round(p.z*units))).map(p=>p.name);
 })()`);
 assert.equal(missed.join(','),'');
});
test('architect checks the full parcel and retains purchased items from conflicting older layouts',()=>{
 const results=run(`(()=>{
  globalThis.trial=true;
  const edge=campusArchitectValid(3,55,'workshop');
  campusState.decor=[{kind:'house',x:8,z:55},{kind:'tree',x:8,z:55}];
  campusState.plots.workshop={x:8,z:55,rotation:1};
  campusInitPlotLocations();
  const once=JSON.stringify([campusState.plots,campusState.decor]);
  campusInitPlotLocations();
  return [!edge,campusState.decor.length===2,campusState.plots.workshop.rotation===1,
   campusState.plots.workshop.x!==8||campusState.plots.workshop.z!==55,
   JSON.stringify([campusState.plots,campusState.decor])===once];
 })()`);
 assert.ok(results.every(Boolean),JSON.stringify(results));
});
