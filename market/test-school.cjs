const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const json=JSON.parse(fs.readFileSync(path.join(__dirname,'school-activities.json'),'utf8'));
const js=fs.readFileSync(path.join(__dirname,'school-activities.js'),'utf8');
function game(){
 const calls={rewards:[],screens:[],notices:[],saved:new Map()};
 const context=vm.createContext({LV_SCHOOL_ACTIVITIES:json,trial:false,
  localStorage:{getItem:k=>calls.saved.get(k)||null,setItem:(k,v)=>calls.saved.set(k,v)},
  cityPanel:(a,b,c)=>calls.screens.push({a,b,c}),cityEarn:(a,b)=>calls.rewards.push({a,b}),
  notice:s=>calls.notices.push(s),esc:s=>String(s)});
 vm.runInContext(js,context);
 return {exec:cmd=>vm.runInContext(cmd,context),calls};
}
test('school activity JSON has valid unique questions',()=>{
 assert.equal(json.kind,'lumenvale.school-activity-pack');
 assert.equal(json.version,1);
 assert.equal(json.challenges.length,4);
 assert.equal(new Set(json.challenges.map(c=>c.id)).size,4);
 assert.ok(json.challenges.every(c=>c.choices.length>=3&&Number.isInteger(c.correctIndex)&&
  c.correctIndex>=0&&c.correctIndex<c.choices.length));
});
test('answers award game currency only once and allow retries',()=>{
 const {exec,calls}=game(),c=json.challenges[0];
 exec('schoolQuizQuestion("'+c.id+'")');
 assert.match(calls.screens.at(-1).c,/data-school="answer"/);
 assert.equal(exec('schoolQuizAnswer("'+c.id+'",'+((c.correctIndex+1)%c.choices.length)+')'),false);
 assert.equal(calls.rewards.length,0);
 assert.equal(exec('schoolQuizAnswer("'+c.id+'",'+c.correctIndex+')'),true);
 assert.equal(exec('schoolQuizAnswer("'+c.id+'",'+c.correctIndex+')'),true);
 assert.equal(calls.rewards.length,1);
 assert.equal(calls.rewards[0].a,14);
 assert.ok(calls.saved.has('lumenvale-school-activities-v1'));
 exec('schoolQuizPanel()');
 assert.match(calls.screens.at(-1).b,/1\/4/);
});
test('renderer and build reference the school modules and asphalt',()=>{
 const district=fs.readFileSync(path.join(__dirname,'district-world.js'),'utf8');
 const plan=fs.readFileSync(path.join(__dirname,'districts.js'),'utf8');
 const build=fs.readFileSync(path.join(__dirname,'build.py'),'utf8');
 assert.match(district,/decorateSchoolInterior/);
 assert.match(district,/addStreetSurfaceTextures/);
 assert.match(plan,/school-guide/);
 assert.match(plan,/school-quiz/);
 assert.match(build,/road-textures\.js/);
 assert.match(build,/school-activities\.json/);
});

test('school table models are bundled and replace only six generic worktables',()=>{
 const build=fs.readFileSync(path.join(__dirname,'build.py'),'utf8');
 const school=fs.readFileSync(path.join(__dirname,'school-world.js'),'utf8');
 const furniture=fs.readFileSync(path.join(__dirname,'school-tables.js'),'utf8');
 assert.match(build,/school-tables\.js/);
 assert.match(school,/createSchoolFurnitureTable\(T,tier===2\?'library':'classroom',low\)/);
 assert.doesNotMatch(school,/k\.box\(side\*10\.0,\.77,center\+1\.42,2\.42/);
 assert.match(furniture,/new T\.InstancedMesh/);
 assert.match(furniture,/new T\.CanvasTexture/);
 assert.match(furniture,/new T\.MeshStandardMaterial/);
});
