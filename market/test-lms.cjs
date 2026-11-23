/* Run with node --test market/test-lms.cjs. No browser or network required. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const demo=JSON.parse(read('lms-demo.json')),catalog=JSON.parse(read('academic-catalog.json'));
const engine=read('lms.js');
function make(){
 const saved={},events={},notices=[],record={last:null};
 const preamble=[
  'const localStorage={getItem:key=>saved[key]||null,setItem:(key,value)=>saved[key]=value};',
  'const trial=false,esc=v=>String(v).replace(/</g,"&lt;");',
  'const cityPanel=(...args)=>{record.last=args;},notice=m=>notices.push(m);',
  'const document={addEventListener:(type,fn)=>(events[type]||=[]).push(fn)};',
  'const pathwayHome=()=>{},pathwayImportPanel=()=>{};',
  'const pathwayValidatePack=()=>({validated:true});'
 ].join('\n');
 const fn=new Function('LV_LMS_DEMO','LV_DEFAULT_ACADEMICS','saved','events','notices','record',
  preamble+'\n'+engine+'\nreturn {state:lmsState,validate:lmsValidateCourse,import:lmsImportObject,home:lmsHome,course:lmsCourse,lesson:lmsLesson,teacher:lmsTeacher,academic:lmsAcademicPack,examStart:lmsExamStart,examAnswer:lmsExamAnswer,panels:()=>record.last};');
 return fn(demo,catalog,saved,events,notices,record);
}
test('seeded courses contain lessons, exams, assignments and announcements',()=>{
 const game=make();
 assert.equal(Object.keys(game.state.courses).length,2);
 assert.equal(game.state.courses['BIO-M1'].modules.length,2);
 assert.equal(game.state.courses['ENG-M1'].assignments.length,1);
 game.home();
 assert.match(game.panels()[2],/Biology Foundations/);
 assert.match(game.panels()[2],/My Learning Dashboard/);
 game.teacher();
 assert.match(game.panels()[2],/Local teacher preview/);
});
test('JSON schema rejects invalid questions and duplicate modules atomically',()=>{
 const game=make(),before=JSON.stringify(game.state.courses);
 const invalid=JSON.parse(JSON.stringify(demo.courses[0]));
 invalid.modules[0].exam.questions[0].correctIndex=99;
 assert.throws(()=>game.import(invalid),/invalid answers/);
 assert.equal(JSON.stringify(game.state.courses),before);
 const dup=JSON.parse(JSON.stringify(demo.courses[0]));
 dup.modules.push({...dup.modules[0]});
 assert.throws(()=>game.validate(dup),/unique ID/);
 const imported={...demo.courses[0],id:'BIO-DEMO',title:'Additional Biology'};
 assert.equal(game.import(imported),1);
 assert.equal(game.state.courses['BIO-DEMO'].title,'Additional Biology');
});
test('study a lesson, pass a timed exam and retain local practice score',()=>{
 const game=make(),id='BIO-M1',mid='cell-structures';
 game.lesson(id,mid);
 assert.match(game.panels()[2],/cell membrane/i);
 game.examStart(id,mid);
 for(const a of [1,0,2])game.examAnswer(a);
 const score=game.state.learners.student.exams[id+':'+mid][0];
 assert.equal(score.score,100);
 assert.match(game.panels()[2],/100%/);
 assert.match(game.panels()[2],/local practice/i);
});
test('academic JSON export route preserves the existing verified teacher format',()=>{
 const game=make();
 assert.equal(game.academic(game.state.courses['BIO-M1']).validated,true);
});
