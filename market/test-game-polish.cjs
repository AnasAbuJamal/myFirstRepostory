const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=(name)=>fs.readFileSync(path.join(__dirname,name),'utf8');
const keyNames=[
 'SAVE_KEY','CITY_SAVE_KEY','CITY_MOUSE_PREFS_KEY','LV_SYSTEMS_KEY',
 'CAMPUS_SAVE_KEY','ACADEMY_CONTENT','ACADEMY_PROGRESS','ACADEMY_PROFILE',
 'JOB_SAVE_KEY','PATHWAYS_KEY','LMS_SAVE_KEY','SCHOOL_CHALLENGE_KEY'
];
function saveHarness(){
 const state=new Map(),fail=new Set();
 const store={
  getItem:key=>state.has(key)?state.get(key):null,
  setItem:(key,value)=>{if(fail.has(key))throw Error('Storage full');state.set(key,String(value));},
  removeItem:key=>state.delete(key)
 };
 const context=vm.createContext(Object.fromEntries(keyNames.map(name=>[name,name.toLowerCase()])));
 Object.assign(context,{localStorage:store,trial:false,notice:()=>{},window:{},location:{},document:{}});
 vm.runInContext(source('save-manager.js'),context);
 return {exec:(js)=>vm.runInContext(js,context),state,fail,store,context};
}
test('local backup captures versioned progress across independent game systems',()=>{
 const h=saveHarness();
 h.state.set('save_key','{"version":1,"step":3}');
 h.state.set('lms_save_key','{"version":1,"courses":{}}');
 const data=h.exec('gameBackupSnapshot()');
 assert.equal(data.kind,'lumenvale.local-save-backup');
 assert.equal(data.version,1);
 assert.equal(Object.keys(data.records).length,2);
 assert.equal(h.exec('gameBackupValidate(gameBackupSnapshot()).length'),2);
});
test('restore refuses unknown keys and corrupt data before writing',()=>{
 const h=saveHarness();
 const raw={kind:'lumenvale.local-save-backup',version:1,records:{'save_key':'{"version":1}'}};
 h.state.set('save_key','{"version":1,"step":3}');
 assert.equal(h.exec('gameBackupApply('+JSON.stringify(raw)+')'),1);
 for(const patch of [{records:{unsafe:'{}'}},{records:{'save_key':'bad json'}},{version:2}]){
  const bad={...raw,...patch};
  assert.throws(()=>h.exec('gameBackupApply('+JSON.stringify(bad)+')'));
 }
 assert.equal(h.state.size,1);
});
test('restore rolls back earlier writes if later storage write fails',()=>{
 const h=saveHarness();
 h.state.set('save_key','{"version":1,"step":1}');
 h.state.set('city_save_key','{"version":1,"coins":22}');
 const backup={kind:'lumenvale.local-save-backup',version:1,records:{
  save_key:'{"version":1,"step":6}',city_save_key:'{"version":1,"coins":99}'
 }};
 h.fail.add('city_save_key');
 assert.throws(()=>h.exec('gameBackupApply('+JSON.stringify(backup)+')'),/previous save was restored/);
 assert.equal(h.state.get('save_key'),'{"version":1,"step":1}');
 assert.equal(h.state.get('city_save_key'),'{"version":1,"coins":22}');
});
test('all school interactions line up with their visual workstation centers',()=>{
 const c=vm.createContext({});
 vm.runInContext(source('districts.js'),c);
 const pairs=vm.runInContext('SCHOOL_STATIONS.map(s=>({key:s.key,center:[s.x,s.z],interaction:TOWN_PLACES.find(p=>p.id==="school").desks.find(d=>d.key===s.key)}))',c);
 assert.equal(pairs.length,6);
 for(const p of pairs){
  assert.ok(p.interaction,p.key+' has no interaction');
  assert.equal(p.interaction.x,p.center[0]);
  assert.equal(p.interaction.z,p.center[1]);
  assert.ok(p.interaction.r>=2,p.key+' interaction too narrow');
 }
 assert.match(source('school-world.js'),/for\(const desk of SCHOOL_STATIONS\)/);
});
test('City Phone categories keep student, city and teacher actions discoverable',()=>{
 const calls={panels:[],lesson:[],home:0};
 const c=vm.createContext({
  esc:String,state:{step:0},missions:['Read a message'],dialog:{dataset:{}},
  byId:()=>({hidden:true}),citySync:()=>{},
  cityPanel:(a,b,html)=>calls.panels.push({a,b,html}),
  lmsLearner:()=>({enrolled:['BIO-M1'],done:{},submissions:{}}),
  lmsCourseData:()=>({id:'BIO-M1',title:'Biology',published:true,modules:[{id:'cells',title:'Cells'}],assignments:[]}),
  lmsKey:(a,b)=>a+':'+b,
  lmsLesson:(id,mid)=>calls.lesson.push([id,mid]),
  lmsHome:()=>calls.home++,
  window:{open:()=>{}}
 });
 vm.runInContext(source('phone.js'),c);
 vm.runInContext('phoneOpen("learning")',c);
 assert.match(calls.panels.at(-1).html,/YOUR NEXT STEP/);
 assert.match(calls.panels.at(-1).html,/data-phone-app="continue"/);
 assert.match(calls.panels.at(-1).html,/data-phone-category="city"/);
 vm.runInContext('phoneResumeLearning()',c);
 assert.equal(calls.lesson.length,1);
 assert.equal(calls.lesson[0][1],'cells');
 vm.runInContext('phoneOpen("city")',c);
 assert.match(calls.panels.at(-1).html,/data-phone-app="architect"/);
 assert.doesNotMatch(calls.panels.at(-1).html,/data-phone-app="teacher"/);
 vm.runInContext('phoneOpen("tools")',c);
 assert.match(calls.panels.at(-1).html,/data-phone-app="teacher-portal"/);
 assert.match(calls.panels.at(-1).html,/data-phone-app="backup"/);
});
test('Balanced rendering mode skips expensive optional materials and shadows',()=>{
 assert.match(source('view.js'),/!renderer\.lvBalanced && renderer\.shadowMap/);
 assert.match(source('district-world.js'),/low:renderer\.isSoftware\|\|renderer\.lvBalanced/);
 assert.match(source('city.js'),/id="city-graphics-quality"/);
});
