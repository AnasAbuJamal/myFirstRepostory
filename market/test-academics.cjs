/* Run with: node --test market/test-academics.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=filename=>fs.readFileSync(path.join(__dirname,filename),'utf8');
const load=filename=>JSON.parse(read(filename));
const catalog=load('academic-catalog.json'),sample=load('example-academic-pack.json');
const exam=load('../teacher/public/examples/exam-pack.json'),cards=load('../teacher/public/examples/flashcard-pack.json');
const engine=read('pathways.js');
function instance(){
 const setup=String.raw`
 const LV_DEFAULT_ACADEMICS=arguments[0];
 const localStorage={getItem:()=>null,setItem:()=>{}};
 const trial=true,cityState={coins:0},cityEarn=()=>{},esc=v=>String(v),
  notice=()=>{},cityPanel=(a,b,c)=>{lastPanel={a,b,c}};
 let lastPanel=null;
 `;
 const code=setup.replace(/\\`/g,'`');
 return new Function(code+engine+'\nreturn {state:pathwayState,validate:pathwayValidatePack,import:pathwayImportObject,pass:pathwayPassed,stage:pathwayTierOpen,gpa:pathwayGPA,home:pathwayHome,transcript:pathwayTranscript,panel:()=>lastPanel,course:pathwayCourse,restore:pathwayRestore,validateExam:pathwayValidateExam,validateCards:pathwayValidateCards};')(catalog);
}
test('catalog includes middle, high school and three university-inspired goals',()=>{
 assert.equal(catalog.kind,'lumenvale.catalog');
 assert.equal(catalog.version,1);
 assert.equal(catalog.stages.length,3);
 assert.equal(catalog.programs.length,3);
 assert.ok(catalog.courses.length>=20);
 const ids=new Set(catalog.courses.map(c=>c.id));
 for(const c of catalog.courses)for(const prereq of c.prerequisites)assert.ok(ids.has(prereq));
});
test('teacher academic, exam, card and Qur’an JSON import as independent packages',()=>{
 const game=instance();
 assert.equal(game.import(sample,'starter'),2);
 assert.equal(game.state.packs['SCI-M1'].lessons.length,2);
 assert.equal(game.state.quranPlans['QUR-M1'].targets.length,2);
 assert.equal(game.import({packs:[exam,cards]},'lesson updates'),2);
 assert.equal(game.state.packs['SCI-M1'].exam.questions.length,3);
 assert.equal(game.state.packs['SCI-M1'].lessons[0].flashcards.length,3);
});
test('unverified transcript GPA is weighted, recitation cannot be self-awarded',()=>{
 const game=instance();
 game.import(sample,'starter');
 for(const id of ['SCI-M1','ENG-M1','MAT-M1','BIO-M1'])game.state.scores[id]=95;
 assert.equal(game.pass('QUR-M1'),false);
 assert.equal(game.stage('high'),false);
 game.state.recitations['QUR-M1']={verified:true,complete:false};
 assert.equal(game.stage('high'),false);
 game.state.recitations['QUR-M1']={verified:true,complete:true};
 assert.equal(game.stage('high'),true);
 assert.equal(game.gpa().gpa,4);
 game.transcript();assert.match(game.panel().c,/UNVERIFIED GAME RECORD/);
});
test('bad JSON is rejected without changing previously imported coursework',()=>{
 const game=instance();game.import(sample,'good');
 const before=JSON.stringify(game.state.packs);
 const broken={...exam,exam:{title:'Broken',questions:[{prompt:'Not enough answers',choices:['Only one'],correctIndex:0}]}};
 assert.throws(()=>game.import({packs:[cards,broken]},'bad'));
 assert.equal(JSON.stringify(game.state.packs),before);
});
test('course and prerequisite labeling includes Biochemistry and Biomedical Engineering',()=>{
 const game=instance();game.home();
 assert.match(game.panel().c,/Biochemistry/);
 assert.match(game.panel().c,/Biomedical Engineering/);
 assert.match(game.panel().c,/Qur/);
 assert.ok(game.course('BCH-U1').prerequisites.includes('OCH-U1'));
});
