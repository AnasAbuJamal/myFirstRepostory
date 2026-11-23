/* LumenVale Campus & City Architect. Offline student systems (not a teacher authorization mechanism). */
const CAMPUS_SAVE_KEY="lumenvale-campus-v2";
const CAMPUS_SUBJECTS=[
 {id:"english",name:"English",icon:"📚",color:"#7698b6",units:[
  {name:"Main Ideas",text:"A paragraph usually develops one central idea. Supporting details explain or prove that idea.",question:"What do supporting details do?",answers:["Explain the main idea","Replace the topic","End all discussions"],correct:0},
  {name:"Vocabulary in Context",text:"Context clues are nearby words or phrases that help readers understand unfamiliar vocabulary.",question:"What are context clues?",answers:["Nearby helpful information","Random spelling mistakes","The page number"],correct:0},
  {name:"Making Inferences",text:"An inference uses clues in the text and what you already know to reach a reasonable conclusion.",question:"How is an inference made?",answers:["Using evidence and knowledge","Guessing without evidence","Copying every sentence"],correct:0}]},
 {id:"science",name:"Science",icon:"🧪",color:"#65a48a",units:[
  {name:"Energy",text:"Energy makes movement and change possible. Machines transform energy from one form to another.",question:"What can machines do with energy?",answers:["Transform it","Destroy all matter","Stop time"],correct:0},
  {name:"Living Systems",text:"Living things need energy, water, and conditions that support their growth.",question:"What do living things need?",answers:["Energy and water","Only concrete","No resources"],correct:0},
  {name:"Investigation",text:"Scientists develop hypotheses and test them using observations and evidence.",question:"How are hypotheses evaluated?",answers:["Using evidence","By voting","By guessing"],correct:0}]},
 {id:"math",name:"Mathematics",icon:"📐",color:"#c6a06b",units:[
  {name:"Percentages",text:"A percentage is a number out of one hundred. A ten percent discount means ten out of every hundred.",question:"How much is 10% of 200?",answers:["20","10","200"],correct:0},
  {name:"Business Arithmetic",text:"Profit equals revenue minus costs. A shop that earns 150 coins and spends 90 has 60 coins of profit.",question:"150 minus 90 equals?",answers:["60","90","240"],correct:0},
  {name:"Statistics",text:"The mean is the sum of the values divided by the number of values. The mean of 2, 4, and 6 is 4.",question:"What is the mean of 2, 4, and 6?",answers:["4","6","12"],correct:0}]},
 {id:"business",name:"Business",icon:"🏭",color:"#a98ab4",units:[
  {name:"Customers",text:"Successful companies listen to customer needs and deliver products as promised.",question:"What builds customer trust?",answers:["Keeping promises","Ignoring orders","Changing prices secretly"],correct:0},
  {name:"Production",text:"Factories convert materials into useful products. Workers and machines contribute to production.",question:"What happens in a factory?",answers:["Materials become products","Products disappear","Books become money automatically"],correct:0},
  {name:"Budgeting",text:"Costs must be paid before profits can be reinvested. A business needs enough cash to pay salaries and buy supplies.",question:"What must a business pay?",answers:["Wages and supplies","Only decorations","Nothing"],correct:0}]}
];
const CAMPUS_CAREERS=[
 {id:"engineer",title:"Engineer",icon:"⚙",subject:"science",description:"Improve factories and machines.",bonus:30},
 {id:"architect",title:"Architect",icon:"📐",subject:"math",description:"Plan buildings and city districts.",bonus:35},
 {id:"entrepreneur",title:"Entrepreneur",icon:"💼",subject:"business",description:"Manage contracts and suppliers.",bonus:40},
 {id:"researcher",title:"Researcher",icon:"🔬",subject:"english",description:"Discover technologies through reading.",bonus:35}
];
const CAMPUS_DECOR=[
 {id:"tree",name:"Plant tree",price:12,color:"#5d9769"},
 {id:"road",name:"Road section",price:18,color:"#8a9591"},
 {id:"park",name:"Mini park",price:55,color:"#7baf7c"},
 {id:"house",name:"Small house",price:90,color:"#c7a586"},
 {id:"lamp",name:"Streetlight",price:25,color:"#cfbd85"}
];
function campusEmpty(){return {version:2,subjects:{},career:null,careerLevel:0,words:[],decor:[],plots:{},enrolled:[],lastExam:null};}
function campusSanitize(input){
 const save=campusEmpty();
 if(!input||typeof input!=="object")return save;
 for(const sub of CAMPUS_SUBJECTS){
  const info=input.subjects?.[sub.id];
  if(info&&typeof info==="object")save.subjects[sub.id]={
   complete:Array.isArray(info.complete)?[...new Set(info.complete.filter(i=>Number.isInteger(i)&&i>=0&&i<3))]:[],
   exams:Array.isArray(info.exams)?info.exams.filter(n=>Number.isFinite(n)&&n>=0&&n<=100).slice(-12):[]
  };
 }
 save.enrolled=Array.isArray(input.enrolled)?[...new Set(input.enrolled.filter(x=>CAMPUS_SUBJECTS.some(s=>s.id===x)))]:CAMPUS_SUBJECTS.filter(x=>input.subjects?.[x.id]?.complete?.length||input.subjects?.[x.id]?.exams?.length).map(x=>x.id);
 if(CAMPUS_CAREERS.some(x=>x.id===input.career))save.career=input.career;
 save.careerLevel=Math.max(0,Math.min(99,Number(input.careerLevel)||0));
 save.words=Array.isArray(input.words)?input.words.filter(x=>x&&typeof x.word==="string"&&x.word.length<=80).slice(0,500):[];
 save.decor=Array.isArray(input.decor)?input.decor.filter(x=>CAMPUS_DECOR.some(t=>t.id===x?.kind)&&Number.isInteger(x.x)&&Number.isInteger(x.z)).slice(0,100):[];
 for(const site of CITY_SITES){
  const pos=input.plots?.[site.id];
  if(pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.z)&&Number.isInteger(pos.rotation)){
   save.plots[site.id]={x:Math.round(pos.x),z:Math.round(pos.z),rotation:((pos.rotation%4)+4)%4};
  }
 }
 return save;
}
function campusRead(){try{return campusSanitize(JSON.parse(localStorage.getItem(CAMPUS_SAVE_KEY)));}catch{return campusEmpty();}}
var campusState=campusRead();
var campusInterior=null;
var campusArchitectChoice="tree";
var campusMoveChoice=null;
var campusCurrentExam=null;
function campusSave(){try{if(!trial)localStorage.setItem(CAMPUS_SAVE_KEY,JSON.stringify(campusState));}catch{notice("Local storage is unavailable.");}}
function campusSubjectStatus(id){return campusState.subjects[id]||(campusState.subjects[id]={complete:[],exams:[]});}
function campusGrade(percentage){
 if(percentage>=90)return {letter:"A",points:4};
 if(percentage>=80)return {letter:"B",points:3};
 if(percentage>=70)return {letter:"C",points:2};
 if(percentage>=60)return {letter:"D",points:1};
 return {letter:"F",points:0};
}
function campusGPA(){
 let total=0,attempts=0;
 for(const sub of CAMPUS_SUBJECTS){
  const scores=campusSubjectStatus(sub.id).exams;
  if(scores.length){total+=campusGrade(scores[scores.length-1]).points;attempts++;}
 }
 return attempts?{gpa:total/attempts,classes:attempts}:null;
}
function campusPropertyPosition(site){
 const pos=campusState.plots[site.id];
 return pos||{x:site.x,z:site.z,rotation:0};
}
function campusInitPlotLocations(){
 // Resolve old layouts against the new roads. Ownership, staff and upgrades stay attached to IDs.
 const original=JSON.stringify([campusState.plots,campusState.decor]);
 const oldDecor=campusState.decor;
 campusState.decor=[];
 for(const site of CITY_SITES){
  const saved=campusState.plots[site.id];
  if(!saved)continue;
  const point=nearestBuildPosition(saved,site.id);
  if(point){
   Object.assign(site,point);
   Object.assign(saved,point);
  }
 }
 for(const item of oldDecor){
  const point=nearestBuildPosition(item,null);
  if(point)campusState.decor.push({...item,...point});
 }
 if(original!==JSON.stringify([campusState.plots,campusState.decor]))campusSave();
}
function nearestBuildPosition(preferred,siteId){
 if(campusArchitectValid(preferred.x,preferred.z,siteId))return {x:preferred.x,z:preferred.z};
 let best=null,bestDistance=Infinity;
 for(let z=-14;z<=80;z+=2)for(let x=-54;x<=64;x+=2){
  const distance=(x-preferred.x)**2+(z-preferred.z)**2;
  if(distance<bestDistance&&campusArchitectValid(x,z,siteId)){
   bestDistance=distance;best={x,z};
  }
 }
 return best;
}
function campusSchool(){
 const grade=campusGPA();
 const cards=CAMPUS_SUBJECTS.map(sub=>{
  const info=campusSubjectStatus(sub.id),last=info.exams.at(-1);
  return '<button type="button" class="wave-course" data-wave="class" data-id="'+sub.id+'">'+
   '<span class="wave-course-icon">'+sub.icon+'</span><strong>'+sub.name+'</strong>'+
   '<span>'+(campusState.enrolled.includes(sub.id)?'Enrolled · '+info.complete.length+'/3 lessons': 'Not enrolled · Click to choose')+' · '+(last==null?'No exam yet':campusGrade(last).letter+' '+last+'%')+'</span></button>';
 }).join("");
 cityPanel("LumenVale Academy / Practice","Foundations Practice Classes",
 '<p>Optional game-only foundation exercises. These scores remain separate from the teacher-controlled Academic Pathways transcript. Some existing game jobs still use these practice results.</p>'+
 '<div class="wave-school-stats"><div><small>Current GPA</small><b>'+(grade?grade.gpa.toFixed(2):"—")+'</b></div>'+
 '<div><small>Graded courses</small><b>'+(grade?.classes||0)+'/4</b></div>'+
 '<div><small>Learning XP</small><b>'+cityState.xp+'</b></div></div>'+
 '<div class="city-actions"><button type="button" class="button primary" data-pathways="home">Academic Pathways</button><button type="button" class="button" data-pathways="transcript">Practice Transcript</button><button type="button" class="button" data-pathways="quran">Qur’an Memorization</button></div>'+ 
  '<div class="wave-course-grid">'+cards+'</div>'+
 '<p class="city-sub">Classes and grades are part of the game. These are not accredited school credits or real academic records.</p>');
}
function campusClass(id){
 const sub=CAMPUS_SUBJECTS.find(x=>x.id===id);if(!sub)return;
 if(!campusState.enrolled.includes(id)){
  cityPanel("Academy / "+sub.name,sub.name+" Enrollment",
  '<p>Choose this subject for your timetable. You can take multiple classes; only final exams appear in your GPA.</p>'+
  '<button class="button primary" data-wave="enroll" data-id="'+sub.id+'">Enroll in '+sub.name+'</button>'+
  '<button class="button" data-wave="school">Back to school</button>');return;
 }
 const info=campusSubjectStatus(id);
 const units=sub.units.map((unit,i)=>'<div class="wave-unit"><span>'+
  (info.complete.includes(i)?'✓':'◯')+' '+unit.name+'</span>'+
  '<button type="button" class="button" data-wave="unit" data-id="'+id+'" data-unit="'+i+'">'+
  (info.complete.includes(i)?"Review":"Study unit")+'</button></div>').join('');
 const allowed=info.complete.length===sub.units.length;
 cityPanel("Academy / "+sub.name,sub.name+' Curriculum',
 '<p>Complete the lessons to unlock the final exam. You can retake an exam to improve your grade.</p>'+
 '<div class="wave-units">'+units+'</div>'+
 '<div class="wave-school-stats"><div><small>Lessons</small><b>'+info.complete.length+'/3</b></div>'+
 '<div><small>Exams taken</small><b>'+info.exams.length+'</b></div></div>'+
 '<button type="button" class="button primary" data-wave="exam" data-id="'+id+'" '+
 (!allowed?'disabled':'')+'>Take final exam</button>'+
 '<button class="button" data-wave="school">Back to School</button>');
}
function campusEnroll(id){
 if(!CAMPUS_SUBJECTS.some(s=>s.id===id))return;
 if(!campusState.enrolled.includes(id))campusState.enrolled.push(id);
 campusSave();campusClass(id);notice("Enrolled in your chosen class.");
}
function campusUnit(id,index){
 const sub=CAMPUS_SUBJECTS.find(x=>x.id===id),unit=sub?.units[index];if(!unit)return;
 cityPanel("Academy / "+sub.name,unit.name,
 '<article class="wave-lesson"><p>'+esc(unit.text)+'</p><h3>'+esc(unit.question)+'</h3>'+
 unit.answers.map((answer,i)=>'<button class="city-answer" data-wave="unit-answer" data-id="'+id+'" data-unit="'+index+'" data-answer="'+i+'">'+
 '<span>'+String.fromCharCode(65+i)+'</span>'+esc(answer)+'</button>').join('')+'</article>');
}
function campusUnitAnswer(id,index,answer){
 const sub=CAMPUS_SUBJECTS.find(x=>x.id===id),unit=sub?.units[index];if(!unit)return;
 if(Number(answer)!==unit.correct){notice("Try again. Reread the lesson.");return;}
 const status=campusSubjectStatus(id);
 if(!status.complete.includes(index)){
  status.complete.push(index);cityEarn(12,15);campusSave();
 }
 campusClass(id);notice("Unit complete! +12 coins and learning XP.");
}
function campusExam(id){
 const sub=CAMPUS_SUBJECTS.find(x=>x.id===id);if(!sub||campusSubjectStatus(id).complete.length!==3)return;
 campusCurrentExam={id,index:0,correct:0};
 campusExamStep();
}
function campusExamStep(){
 const exam=campusCurrentExam,sub=CAMPUS_SUBJECTS.find(x=>x.id===exam?.id);
 if(!exam||!sub)return;
 const item=sub.units[exam.index];
 cityPanel("LumenVale Exam",sub.name+' · Question '+(exam.index+1)+' of 3',
 '<p>Each answer is final. Your score will appear in the gradebook when you finish.</p>'+
 '<h3>'+esc(item.question)+'</h3>'+
 item.answers.map((answer,i)=>'<button class="city-answer" data-wave="exam-answer" data-answer="'+i+'"><span>'+
 String.fromCharCode(65+i)+'</span>'+esc(answer)+'</button>').join(''));
}
function campusExamAnswer(answer){
 const exam=campusCurrentExam;if(!exam)return;
 const sub=CAMPUS_SUBJECTS.find(x=>x.id===exam.id);
 if(Number(answer)===sub.units[exam.index].correct)exam.correct++;
 exam.index++;
 if(exam.index<3)return campusExamStep();
 const grade=Math.round(exam.correct/3*100),result=campusGrade(grade);
 const status=campusSubjectStatus(exam.id);status.exams.push(grade);status.exams=status.exams.slice(-12);
 campusCurrentExam=null;campusSave();
 const gpa=campusGPA();cityEarn(grade>=60?45:8,grade>=60?25:5);
 cityPanel("LumenVale Academy","Final exam graded",
 '<div class="wave-exam-result"><b>'+grade+'%</b><span>'+result.letter+' · '+result.points.toFixed(1)+' grade points</span></div>'+
 '<p>Overall GPA: <strong>'+(gpa?.gpa.toFixed(2)||"—")+'</strong>. You can review lessons or retake exams.</p>'+
 '<button class="button primary" data-wave="school">Back to School</button>');
}
function campusCareer(){
 const gpa=campusGPA();
 const cards=CAMPUS_CAREERS.map(c=>{
  const chosen=campusState.career===c.id,scores=campusSubjectStatus(c.subject).exams;
  const qualified=scores.length&&scores.at(-1)>=60;
  return '<article class="wave-career"><span>'+c.icon+'</span><h3>'+c.title+'</h3><p>'+c.description+'</p>'+
  '<small>Pass '+CAMPUS_SUBJECTS.find(s=>s.id===c.subject).name+' to qualify</small>'+
  '<button class="button '+(chosen?'primary':'')+'" type="button" data-wave="career-choose" data-id="'+c.id+'" '+
  (!qualified||chosen?'disabled':'')+'>'+(chosen?'Selected career':'Choose this career')+'</button></article>';
 }).join('');
 cityPanel("LumenVale / Careers","Choose Your Career",
 '<p>Choose a long-term career direction here. To earn wages, apply for qualified jobs and complete real work tasks at the Employment Center.</p>'+
 '<div class="wave-school-stats"><div><small>Selected career</small><b>'+
 esc(CAMPUS_CAREERS.find(x=>x.id===campusState.career)?.title||'Not chosen')+'</b></div>'+
 '<div><small>Career level</small><b>'+campusState.careerLevel+'</b></div><div><small>GPA</small><b>'+
 (gpa?gpa.gpa.toFixed(2):'—')+'</b></div></div><div class="wave-career-grid">'+cards+'</div>'+
 '<div class="city-actions"><button type="button" class="button primary" data-jobs="jobs">Apply for paid jobs</button></div>');
}
function campusChooseCareer(id){
 const choice=CAMPUS_CAREERS.find(c=>c.id===id),scores=campusSubjectStatus(choice?.subject).exams;
 if(!choice||!scores.length||scores.at(-1)<60)return;
 campusState.career=id;campusState.careerLevel=1;campusSave();campusCareer();
}
function campusCareerTask(){
 const career=CAMPUS_CAREERS.find(x=>x.id===campusState.career);if(!career)return;
 const lesson=CAMPUS_SUBJECTS.find(x=>x.id===career.subject)?.units[(campusState.careerLevel-1)%3];
 campusCurrentExam={careerTask:true,id:career.subject,index:(campusState.careerLevel-1)%3,correct:0};
 cityPanel("Career Mission",career.title+' Challenge',
 '<p>'+esc(lesson.text)+'</p><h3>'+esc(lesson.question)+'</h3>'+
 lesson.answers.map((a,i)=>'<button class="city-answer" data-wave="career-answer" data-answer="'+i+'"><span>'+
 String.fromCharCode(65+i)+'</span>'+esc(a)+'</button>').join(''));
}
function campusCareerAnswer(answer){
 const task=campusCurrentExam;if(!task?.careerTask)return;
 const sub=CAMPUS_SUBJECTS.find(x=>x.id===task.id);
 const lesson=sub.units[task.index];campusCurrentExam=null;
 if(Number(answer)!==lesson.correct){notice("Review the mission and try again.");return;}
 campusState.careerLevel++;campusSave();cityEarn(20+campusState.careerLevel*5,15);campusCareer();
}
function campusSaveWord(word,definition="",source="Library"){
 const value=String(word||"").trim().toLowerCase().replace(/[^a-zà-ÿ'-\s]/gi,"").slice(0,60);
 if(!value||!/[a-zà-ÿ]/i.test(value))return false;
 const record=campusState.words.find(x=>x.word===value);
 if(record){record.reviewed=(record.reviewed||0)+1;record.definition=definition||record.definition;}
 else campusState.words.unshift({word:value,definition:String(definition||"").slice(0,160),source,date:Date.now(),reviewed:0});
 campusState.words=campusState.words.slice(0,500);campusSave();return true;
}
function campusVocabulary(){
 cityPanel("Student / Vocabulary","My Saved Words",
 '<p>Save interesting words from books or lessons. You can add meanings and revisit words without earning unlimited coins.</p>'+
 '<form class="wave-vocab-form" id="wave-word-form"><input name="word" maxlength="60" placeholder="Word" required>'+
 '<input name="definition" maxlength="160" placeholder="Meaning or a short example">'+
 '<button class="button primary" type="submit">Save word</button></form>'+
 '<div class="wave-word-list">'+campusState.words.map((w,i)=>'<article><div><strong>'+esc(w.word)+'</strong><small>'+esc(w.definition||w.source)+
 '</small></div><button class="button" type="button" data-wave="delete-word" data-index="'+i+'">Remove</button></article>').join('')+
 (campusState.words.length?'':'<p>No words saved yet.</p>')+'</div>');
}
function campusSaveSelection(){
 const selected=String(window.getSelection?.()?.toString()||"").trim().split(/\s+/)[0]||"";
 if(!selected){notice("Select a word in the reading passage first.");return;}
 if(campusSaveWord(selected,"",CITY_BOOKS.find(x=>x.id===cityBookSession?.id)?.title||"Library"))notice("Saved "+selected+" to My Words.");
}
function campusArchitectValid(x,z,except=null){
 const size=except?9.8:3.8;
 const item=townRect(x,z,size,size);
 if(x-size/2<TOWN_BOUNDS.left||x+size/2>TOWN_BOUNDS.right||z-size/2<TOWN_BOUNDS.north||z+size/2>TOWN_BOUNDS.south)return false;
 if(TOWN_ROAD_BEDS.some(road=>townIntersects(item,road,2.30)))return false;
 if(TOWN_RESERVED.some(parcel=>townIntersects(item,parcel,.35)))return false;
 if(CITY_SITES.some(site=>site.id!==except&&townIntersects(item,townRect(site.x,site.z,9.8,9.8),.35)))return false;
 if(campusState.decor.some(d=>townIntersects(item,townRect(d.x,d.z,3.8,3.8),.1)))return false;
 if([...LV_CHARACTERS,...LV_TREASURES].some(p=>townIntersects(item,townRect(p.x,p.z,1.4,1.4),.4)))return false;
 return true;
}
function campusArchitect(){
 const plots=CITY_SITES.filter(x=>cityState.sites[x.id]?.owned);
 let body='<p>Select a construction item, then click an open square on the city grid. Each new road, park, tree or house costs coins. To relocate an owned plot, select it first, then click the new location.</p>';
 body+='<div class="wave-builder-tools">'+CAMPUS_DECOR.map(d=>'<button type="button" class="'+(campusArchitectChoice===d.id&&!campusMoveChoice?'selected':'')+
 '" data-wave="build-choice" data-id="'+d.id+'">'+d.name+' · '+d.price+' coins</button>').join("")+'</div>';
 body+='<div class="wave-builder-tools">'+plots.map(site=>'<span class="wave-plot-tools"><button type="button" class="'+(campusMoveChoice===site.id?'selected':'')+
 '" data-wave="move-choice" data-id="'+site.id+'">Move '+esc(site.title)+'</button><button type="button" data-wave="rotate" data-id="'+site.id+'">↻ Rotate</button></span>').join('')+'</div>';
 body+='<p class="city-sub">Move a purchased plot for 20 coins. Decorative roads are visual paths; full road-navigation AI is a future upgrade.</p>';
 const markers=townMapGeometry()+CITY_SITES.map(site=>'<span class="wave-grid-plot" style="left:'+townMapX(site.x)+'%;top:'+townMapZ(site.z)+'%" title="'+
 esc(site.title)+'"></span>').join('');
 body+='<div class="wave-map-area"><div id="wave-builder-map" class="wave-builder-map" role="grid" aria-label="Choose a construction location">'+markers+'</div></div>';
 body+='<div class="wave-builder-footer">Selection: <b>'+esc(campusMoveChoice?CITY_SITES.find(x=>x.id===campusMoveChoice)?.title||'Plot':
 CAMPUS_DECOR.find(x=>x.id===campusArchitectChoice)?.name||'Tree')+'</b><span>Coins: '+cityState.coins.toLocaleString()+'</span></div>';
 cityPanel("City Architect","Build Your Own City",body);
}
function campusRotate(id){
 const site=CITY_SITES.find(x=>x.id===id);
 if(!site||!cityState.sites[id]?.owned)return false;
 const prev=campusState.plots[id]||{x:site.x,z:site.z,rotation:0};
 campusState.plots[id]={x:site.x,z:site.z,rotation:((prev.rotation||0)+1)%4};
 campusSave();campusArchitect();drawScene();return true;
}
function campusPlace(x,z){
 x=Math.round(x/2)*2;z=Math.round(z/2)*2;
 if(!campusArchitectValid(x,z,campusMoveChoice)){notice("Choose an empty plot away from buildings and landmarks.");return false;}
 if(campusMoveChoice){
  const site=CITY_SITES.find(x=>x.id===campusMoveChoice);
  if(!site||!cityState.sites[site.id]?.owned)return false;
  if(!citySpend(20)){notice("Moving property costs 20 coins.");return false;}
  site.x=x;site.z=z;
  const prior=campusState.plots[site.id]||{rotation:0};
  campusState.plots[site.id]={x,z,rotation:prior.rotation||0};
  campusMoveChoice=null;
  campusSave();citySave();campusArchitect();drawScene();return true;
 }
 const kind=CAMPUS_DECOR.find(x=>x.id===campusArchitectChoice);
 if(!kind||campusState.decor.length>=100)return false;
 if(campusState.decor.some(d=>Math.abs(d.x-x)<3&&Math.abs(d.z-z)<3)){notice("That square already has a decoration.");return false;}
 if(!citySpend(kind.price))return false;
 campusState.decor.push({kind:kind.id,x,z});campusSave();campusArchitect();drawScene();return true;
}
function townMapX(x){return (x-TOWN_BOUNDS.left)/(TOWN_BOUNDS.right-TOWN_BOUNDS.left)*100;}
function townMapZ(z){return (z-TOWN_BOUNDS.north)/(TOWN_BOUNDS.south-TOWN_BOUNDS.north)*100;}
function townMapGeometry(){
 function layer(p,kind){
  const w=p.w/(TOWN_BOUNDS.right-TOWN_BOUNDS.left)*100;
  const h=p.d/(TOWN_BOUNDS.south-TOWN_BOUNDS.north)*100;
  return '<i aria-hidden="true" class="map-surface '+kind+'" style="left:'+townMapX(p.x-p.w/2)+
   '%;top:'+townMapZ(p.z-p.d/2)+'%;width:'+w+'%;height:'+h+'%"></i>';
 }
 return TOWN_ROAD_BEDS.map(r=>layer(r,'street')).join('')+
  [...TOWN_PUBLIC_PLACES,MARKET_OFFICE,...TOWN_HOMES].map(p=>layer(p,'building')).join('')+
  layer(townRect(-6.5,54.6,19.2,17.9),'park')+layer(PARK_COURT,'court');
}
function campusMap(){
 const all=[...TOWN_PUBLIC_PLACES.map(p=>({title:p.name,x:p.x,z:p.z})),
 {title:"Market Office",x:0,z:0},{title:"Lumen Park",x:-5,z:51},
 ...CITY_SITES.map(s=>({title:s.title,x:s.x,z:s.z}))];
 const mapX=townMapX,mapZ=townMapZ,roads=townMapGeometry();
 const here=districtVisit?.origin||player;
 const marker='<span class="town-map-player" style="left:'+mapX(here.x)+'%;top:'+mapZ(here.z)+
  '%" title="Your location" aria-label="Your location"></span>';
 const pins=all.map((place,i)=>'<button type="button" class="town-pin" data-pin="'+i+'" style="left:'+mapX(place.x)+
  '%;top:'+mapZ(place.z)+'%" aria-label="'+esc(place.title)+'" title="'+esc(place.title)+'">'+(i+1)+'</button>').join('');
 const options=all.map((place,i)=>'<option value="'+i+'">'+(i+1)+' · '+esc(place.title)+'</option>').join('');
 cityPanel("LumenVale / Map","City Map",
  '<label class="town-map-select">Find a place<select id="town-place">'+options+'</select></label>'+
  '<div class="wave-map-area"><div class="wave-map town-street-map">'+roads+pins+marker+'</div></div>'+
  '<p class="city-sub">The blue dot shows where you are.</p>');
 const select=byId('town-place'),map=dialog.querySelector('.town-street-map');
 function highlight(id){
  select.value=id;
  for(const pin of map.querySelectorAll('[data-pin]'))pin.setAttribute('aria-pressed',String(pin.dataset.pin===id));
 }
 highlight(String(Math.max(0,all.findIndex(p=>p.title===(districtVisit?.place.name||'Market Office')))));
 select.addEventListener('change',()=>highlight(select.value));
 map.addEventListener('click',event=>{
  const pin=event.target.closest('[data-pin]');
  if(pin)highlight(pin.dataset.pin);
 });

}
function campusFactoryMachine(){
 const site=CITY_SITES.find(x=>x.id===campusInterior?.id),unit=cityState.sites[site?.id];
 if(!site||!unit)return;
 cityPanel("Factory / Machine Station",site.title+' Production',
 '<p>Watch the conveyor and inspect manufacturing equipment.</p>'+
 '<div class="city-factory-grid"><div><small>Machine level</small><b>'+unit.level+'</b></div>'+
 '<div><small>Workers</small><b>'+unit.staff+'</b></div><div><small>Gross production</small><b>'+cityProduction(site,unit)+' / 5s</b></div>'+
 '<div><small>Inventory</small><b>'+(systemsState.inventory[site.id]||0)+'</b></div></div>'+
 '<div class="city-actions"><button class="button primary" data-wave="factory-help">Help production</button>'+
 '<button class="button" data-wave="factory-upgrade">Upgrade machines</button></div>');
}
function campusFactoryStaff(){
 const site=CITY_SITES.find(x=>x.id===campusInterior?.id),unit=cityState.sites[site?.id];
 if(!site||!unit)return;
 cityPanel("Factory / Workstations",site.title+' Workforce',
 '<p>Assign workers to production and provide training. Each worker increases output and operating expenses.</p>'+
 '<div class="wave-staff-roster">'+Array.from({length:Math.min(6,unit.staff)},(_,i)=>'<div>👷 '+esc(LV_PERSONNEL[i])+' · Level '+unit.level+'</div>').join('')+
 (unit.staff?'':'<p>No employees yet.</p>')+'</div><button class="button primary" data-wave="factory-hire">Hire an employee</button>');
}
function campusInit(){
 campusInitPlotLocations();
 document.addEventListener("click",event=>{
  const el=event.target.closest("[data-wave]");if(!el)return;
  const act=el.dataset.wave,id=el.dataset.id,index=Number(el.dataset.unit);
  if(act==="school")campusSchool();
  if(act==="class")campusClass(id);
  if(act==="enroll")campusEnroll(id);
  if(act==="unit")campusUnit(id,index);
  if(act==="unit-answer")campusUnitAnswer(id,index,el.dataset.answer);
  if(act==="exam")campusExam(id);
  if(act==="exam-answer")campusExamAnswer(el.dataset.answer);
  if(act==="careers")campusCareer();
  if(act==="career-choose")campusChooseCareer(id);
  if(act==="career-task")jobPanel();
  if(act==="career-answer")campusCareerAnswer(el.dataset.answer);
  if(act==="vocab")campusVocabulary();
  if(act==="delete-word"){campusState.words.splice(Number(el.dataset.index),1);campusSave();campusVocabulary();}
  if(act==="save-selection")campusSaveSelection();
  if(act==="map")campusMap();
  if(act==="architect")campusArchitect();
  if(act==="build-choice"){campusArchitectChoice=id;campusMoveChoice=null;campusArchitect();}
  if(act==="move-choice"){campusMoveChoice=id;campusArchitect();}
  if(act==="rotate")campusRotate(id);
  if(act==="factory-help"&&campusInterior){cityManual(campusInterior.id);campusFactoryMachine();}
  if(act==="factory-upgrade"&&campusInterior){cityUpgrade(campusInterior.id);campusFactoryMachine();}
  if(act==="factory-hire"&&campusInterior){cityHire(campusInterior.id);campusFactoryStaff();}
 });
 document.addEventListener("submit",event=>{
  if(event.target.id!=="wave-word-form")return;
  event.preventDefault();
  const fields=new FormData(event.target);
  if(campusSaveWord(fields.get("word"),fields.get("definition"),"My vocabulary"))campusVocabulary();
 });
 document.addEventListener("click",event=>{
  const map=event.target.closest("#wave-builder-map");if(!map)return;
  const bounds=map.getBoundingClientRect();
  const x=TOWN_BOUNDS.left+((event.clientX-bounds.left)/bounds.width)*(TOWN_BOUNDS.right-TOWN_BOUNDS.left);
  const z=TOWN_BOUNDS.north+((event.clientY-bounds.top)/bounds.height)*(TOWN_BOUNDS.south-TOWN_BOUNDS.north);
  campusPlace(x,z);
 });
 window.addEventListener("keydown",event=>{
  if(event.repeat||event.target.matches?.("input,textarea,select")||dialog.open||terminal.open)return;
  if(event.key.toLowerCase()==="k")campusMap();
 });
 // Add a library word saver without blocking normal page navigation.
 document.addEventListener("pointerdown",event=>{
  if(event.target.closest('[data-wave="save-selection"]'))event.preventDefault();
 });
}
