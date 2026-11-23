/* LumenVale Jobs & Research – deliberate study-to-employment progression.
 * Jobs reward completed tasks, never a passive salary. Teacher research uses
 * reviewed public packs, not classroom identities or confidential records.
 */
const JOB_SAVE_KEY='lumenvale-jobs-v1';
const JOB_ROLES=[
 {id:'library',title:'Library Assistant',icon:'📚',wage:42,req:{english:60},description:'Organize books and help young readers find information.'},
 {id:'courier',title:'Delivery Courier',icon:'🚚',wage:55,req:{business:60},description:'Read order details and deliver the right supplies.'},
 {id:'technician',title:'Factory Technician',icon:'⚙️',wage:68,req:{science:60,math:60},description:'Inspect production machines and respond to faults.'},
 {id:'architect',title:'Junior Architect',icon:'📐',wage:78,req:{math:67},description:'Measure building plots and choose safe construction plans.'},
 {id:'planner',title:'Community Planner',icon:'🏙️',wage:80,req:{english:60,business:67},description:'Study community reports and improve city services.'},
 {id:'engineer',title:'Industrial Engineer',icon:'🛠️',wage:95,req:{science:67,math:67},description:'Use math and scientific evidence to improve production.'},
 {id:'researcher',title:'Research Scientist',icon:'🔬',wage:120,req:{science:67,english:67},minGpa:2.5,
  description:'Study evidence, answer research questions, and complete teacher-designed projects.'}
];
const JOB_TASKS={
 library:[
  {title:'Sort the Reading Corner',text:'The library received books about plants, bicycles, and the weather. A student asks for a book explaining how roots absorb water. The librarian must identify its science subject and place it in the correct section.',questions:[
   {prompt:'Which book should the librarian recommend?',choices:['The plants book','The bicycles book','The weather forecast'],correctIndex:0},
   {prompt:'Where should this book be shelved?',choices:['Science','Business','Sports'],correctIndex:0}]},
  {title:'Help a Young Reader',text:'A student cannot understand the word habitat. The library assistant reads a nearby sentence explaining that a habitat is the natural place where an animal lives. The assistant decides to use this context clue rather than guess.',questions:[
   {prompt:'What is a habitat?',choices:['A natural place where an animal lives','A machine in a workshop','A kind of payment'],correctIndex:0},
   {prompt:'What helped explain the unfamiliar word?',choices:['Context clues','The book price','The author’s birthday'],correctIndex:0}]}
 ],
 courier:[
  {title:'Deliver the Right Order',text:'The community school ordered six chairs and four tables. The delivery note shows that the first truck already carried two chairs. The remaining chairs and all four tables must be packed.',questions:[
   {prompt:'How many chairs must still be packed?',choices:['Four','Six','Two'],correctIndex:0},
   {prompt:'How many tables must go on the truck?',choices:['Two','Four','Six'],correctIndex:1}]},
  {title:'Check Delivery Addresses',text:'Two customers ordered supplies. The science lab needs three toolboxes at the school. The garden shop needs two watering cans at the market. Both orders must reach the correct location.',questions:[
   {prompt:'Where should the toolboxes go?',choices:['The school science lab','The garden shop','The city park'],correctIndex:0},
   {prompt:'Which goods belong at the garden shop?',choices:['Toolboxes','Watering cans','Office desks'],correctIndex:1}]}
 ],
 technician:[
  {title:'Inspect the Conveyor Belt',text:'The workshop conveyor slows down because a roller has become loose. Before any repair, the technician follows the approved shutdown procedure and makes sure the machinery cannot restart unexpectedly.',questions:[
   {prompt:'What happens before repairs?',choices:['Follow the equipment shutdown procedure','Speed up the conveyor','Ignore the loose roller'],correctIndex:0},
   {prompt:'What is the reported problem?',choices:['A loose roller','Missing chairs','No books'],correctIndex:0}]},
  {title:'Materials Quality Check',text:'A factory receives twenty wooden boards. Three are damaged and must be set aside. The technician records the number of usable boards before production begins.',questions:[
   {prompt:'How many boards are usable?',choices:['Seventeen','Twenty-three','Three'],correctIndex:0},
   {prompt:'Why record the inspection?',choices:['To track material quality','To change the school GPA','To increase noise'],correctIndex:0}]}
 ],
 architect:[
  {title:'Measure a Public Courtyard',text:'A rectangular courtyard measures eight meters long and five meters wide. The architect calculates the area to estimate how much paving is needed.',questions:[
   {prompt:'What is the courtyard area?',choices:['40 square meters','13 square meters','80 square meters'],correctIndex:0},
   {prompt:'Which dimensions describe the courtyard?',choices:['8 m by 5 m','8 m by 8 m','5 m by 5 m'],correctIndex:0}]},
  {title:'Review a Building Plan',text:'A proposed classroom has two doors. The architect checks that emergency exits are clearly marked and that desks do not obstruct access to either doorway.',questions:[
   {prompt:'Why must the doors stay clear?',choices:['For safe access and evacuation','For decoration only','To store more chairs'],correctIndex:0},
   {prompt:'How many doors does the classroom have?',choices:['One','Two','Three'],correctIndex:1}]}
 ],
 planner:[
  {title:'Improve the Neighborhood',text:'Residents report that a street crossing is poorly lit after sunset. The city has enough coins to install lamps and repaint the crosswalk. The planner decides which improvements address the reported danger.',questions:[
   {prompt:'What problem did residents report?',choices:['Poor lighting at a crossing','Too many books','A missing library catalog'],correctIndex:0},
   {prompt:'Which project addresses the issue?',choices:['Install lamps and repaint the crossing','Close the school','Remove the crosswalk'],correctIndex:0}]},
  {title:'Study a Park Survey',text:'A neighborhood survey received thirty responses. Eighteen residents requested more benches, eight requested flowers, and four requested a fountain. The planner chooses the most popular request.',questions:[
   {prompt:'Which feature received the most requests?',choices:['Benches','Flowers','Fountain'],correctIndex:0},
   {prompt:'How many residents requested flowers?',choices:['Eight','Eighteen','Four'],correctIndex:0}]}
 ],
 engineer:[
  {title:'Improve Energy Efficiency',text:'The factory uses 200 energy units during its morning shift. An engineering upgrade cuts energy usage by ten percent while keeping production the same. The engineer estimates the saving.',questions:[
   {prompt:'How many energy units are saved?',choices:['20','10','200'],correctIndex:0},
   {prompt:'What is the new energy use?',choices:['180','220','100'],correctIndex:0}]},
  {title:'Check Production Rates',text:'Machine A produces twelve parts per hour while Machine B produces eight. During two hours of operation, both machines run at the same time.',questions:[
   {prompt:'How many parts do both make in one hour?',choices:['20','4','96'],correctIndex:0},
   {prompt:'How many parts do both make in two hours?',choices:['40','20','16'],correctIndex:0}]}
 ]
};
const JOB_SAMPLE_RESEARCH=[
 {id:'sample-plant-energy',title:'How Plants Use Light',field:'Biology',teacher:'LumenVale Practice Lab',reward:110,
  summary:'Study evidence about how sunlight helps plants make food.',
  text:'Green plants need light, water, and carbon dioxide to make sugars through photosynthesis. Much of this process happens in leaf cells containing chloroplasts. Chlorophyll pigments absorb light energy. A student wants to test whether light changes plant growth, so she grows two similar plants with the same soil, water, and temperature. One receives daylight and the other receives very little light. After two weeks she measures the height and leaf color of each plant. By changing the light while holding the other conditions as similar as possible, she can investigate the effects of light exposure. She must still consider measurement error and avoid claiming that one small experiment proves every possible result.',
  questions:[{prompt:'Which variable did the student deliberately change?',choices:['Light exposure','Soil type','Plant species'],correctIndex:0},
   {prompt:'Why should the plants receive similar water and soil?',choices:['To keep other conditions controlled','To stop all growth','To change every variable'],correctIndex:0},
   {prompt:'Which conclusion is most appropriate?',choices:['Results from a small experiment need careful interpretation','All plants grow without light','Measurements are never useful'],correctIndex:0}]},
 {id:'sample-bridge-data',title:'Comparing Bridge Materials',field:'Engineering',teacher:'LumenVale Practice Lab',reward:125,
  summary:'Evaluate measurements and evidence from a simple model-building experiment.',
  text:'A classroom research team builds three model bridges using the same design but different materials. One bridge uses paper, another uses thin wooden strips, and the third uses recycled cardboard. The students gradually add small weights to each bridge until it bends beyond a chosen limit. They record the load at that point and repeat the test three times for each material. A fair comparison requires consistent span lengths, loading methods, and measurements. When the results vary, the students calculate an average and examine whether a single unusual result may have been caused by construction differences. They also discuss that a model bridge cannot predict every detail of a full-sized bridge. The research report should describe the procedure, observations, limitations, and conclusions supported by the collected data.',
  questions:[{prompt:'What is the main independent variable?',choices:['Bridge material','Span length','Weight placement method'],correctIndex:0},
   {prompt:'Why repeat each test three times?',choices:['To examine variation and improve reliability','To guarantee the strongest bridge wins','To avoid recording results'],correctIndex:0},
   {prompt:'What should the final report include?',choices:['Methods, data, limitations and evidence-based conclusions','Only a final guess','Nothing about the measurements'],correctIndex:0}]}
];
function jobDefault(){return {version:1,hired:[],shifts:{},completedResearch:[],teacherProjects:[],lastImport:null};}
function jobNormalizeProject(raw,source='Teacher pack'){
 if(!raw||typeof raw!=='object')throw Error('Research item must be an object.');
 const title=String(raw.title||'').trim().slice(0,130),
  text=String(raw.text||raw.readingText||raw.passage||'').trim().slice(0,12000),
  field=String(raw.field||'Science').trim().slice(0,70),
  summary=String(raw.summary||'').trim().slice(0,500),
  id=String(raw.id||raw.publishCode||'').trim();
 if(!title||!field||text.split(/\s+/).length<55||!summary)throw Error('Provide a title, summary, field and at least 55 words.');
 if(!/^[A-Za-z0-9_-]{4,90}$/.test(id))throw Error('Every project needs a valid ID or publication code.');
 const rawQs=raw.questions;
 if(!Array.isArray(rawQs)||rawQs.length<2||rawQs.length>8)throw Error('Provide between 2 and 8 reviewed multiple-choice questions.');
 const questions=rawQs.map(q=>{
  const prompt=String(q?.prompt||q?.question||'').trim().slice(0,600);
  const choices=Array.isArray(q?.choices)?q.choices.map(x=>String(x).trim().slice(0,250)):[];
  const correctIndex=Number(q?.correctIndex);
  if(prompt.length<10||choices.length<2||choices.length>5||choices.some(x=>!x)||!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=choices.length)
   throw Error('Each question needs choices and a valid zero-based correctIndex.');
  return {prompt,choices,correctIndex};
 });
 const reward=Math.min(220,Math.max(50,Number.isFinite(raw.reward)?Math.round(raw.reward):110));
 return {id,title,text,field,summary,questions,reward,teacher:String(raw.teacher||source).slice(0,80)};
}
function jobRestore(raw){
 const state=jobDefault();
 if(!raw||raw.version!==1)return state;
 state.hired=Array.isArray(raw.hired)?[...new Set(raw.hired.filter(id=>JOB_ROLES.some(r=>r.id===id)))]:[];
 if(raw.shifts&&typeof raw.shifts==='object')for(const role of JOB_ROLES){
  const entry=raw.shifts[role.id];if(entry){
   state.shifts[role.id]={count:Math.max(0,Math.min(1e5,Number(entry.count)||0)),
    last:Math.max(0,Math.min(Date.now()+60000,Number(entry.last)||0)),earned:Math.max(0,Math.min(1e7,Number(entry.earned)||0))};
  }
 }
 state.completedResearch=Array.isArray(raw.completedResearch)?raw.completedResearch.filter(x=>typeof x==='string'&&x.length<=90).slice(0,100):[];
 if(Array.isArray(raw.teacherProjects))for(const p of raw.teacherProjects.slice(0,25)){try{state.teacherProjects.push(jobNormalizeProject(p,p.teacher));}catch{}}
 state.lastImport=typeof raw.lastImport==='string'?raw.lastImport.slice(0,80):null;
 return state;
}
function jobLoad(){try{return jobRestore(JSON.parse(localStorage.getItem(JOB_SAVE_KEY)));}catch{return jobDefault();}}
var jobState=jobLoad();
var jobSession=null;
function jobSave(){try{if(!trial)localStorage.setItem(JOB_SAVE_KEY,JSON.stringify(jobState));}catch{}}
function jobGrade(id){const s=campusSubjectStatus(id).exams;return s.length?s[s.length-1]:null;}
function jobRequirements(role){
 const results=Object.entries(role.req).map(([id,min])=>{
  const subject=CAMPUS_SUBJECTS.find(s=>s.id===id),score=jobGrade(id);
  return {label:(subject?.name||id)+' exam ≥ '+min+'%',met:score!==null&&score>=min,current:score===null?'Not taken':score+'%'};
 });
 if(role.minGpa)results.push({label:'Overall GPA ≥ '+role.minGpa.toFixed(1),met:(campusGPA()?.gpa||0)>=role.minGpa,current:(campusGPA()?.gpa??0).toFixed(2)});
 return results;
}
function jobEligible(role){return jobRequirements(role).every(r=>r.met);}
function jobById(id){return JOB_ROLES.find(x=>x.id===id);}
function jobAllResearch(){return [...JOB_SAMPLE_RESEARCH,...jobState.teacherProjects];}
function jobPanel(){
 const earned=Object.values(jobState.shifts).reduce((a,x)=>a+(x.earned||0),0);
 const cards=JOB_ROLES.map(role=>{
  const requirements=jobRequirements(role),qualified=requirements.every(r=>r.met),hired=jobState.hired.includes(role.id),
   info=jobState.shifts[role.id],remaining=Math.max(0,180000-(Date.now()-(info?.last||0)));
  return '<article class="job-role-card"><header><span class="job-symbol">'+role.icon+'</span><div><h3>'+esc(role.title)+'</h3><small>'+role.wage+' coins / completed task</small></div></header>'+
  '<p>'+esc(role.description)+'</p><div class="job-requirements">'+requirements.map(r=>'<div class="'+(r.met?'met':'missing')+'">'+(r.met?'✓':'○')+
   ' '+esc(r.label)+' <small>'+esc(r.current)+'</small></div>').join('')+'</div>'+
  '<div class="job-commands">'+(hired?'<span class="job-hired">✓ Hired</span>':
    '<button type="button" class="button primary" data-jobs="apply" data-id="'+role.id+'" '+(qualified?'':'disabled')+'>Apply for job</button>')+
   (hired?'<button type="button" class="button" data-jobs="'+(role.id==='researcher'?'research-list':'shift')+'" data-id="'+role.id+'" '+
    (remaining&&role.id!=='researcher'?'disabled':'')+'>'+(role.id==='researcher'?'Open research projects':remaining?'Next shift in '+Math.ceil(remaining/60000)+' min':'Start a work shift')+'</button>':'')+
   '</div></article>';
 }).join('');
 cityPanel('Career Center / Employment','Jobs & Qualifications',
 '<p>Study at school, earn passing grades, then apply for a job. Money is earned from completing actual tasks—not merely from choosing a career.</p>'+
 '<div class="job-stats"><div><small>Jobs hired</small><b>'+jobState.hired.length+'</b></div><div><small>Research projects</small><b>'+jobState.completedResearch.length+'</b></div>'+
 '<div><small>Wages earned</small><b>'+earned.toLocaleString()+'</b></div></div><div class="job-role-grid">'+cards+'</div>'+
 '<div class="city-actions"><button type="button" class="button" data-wave="school">Study at school</button>'+
 '<button type="button" class="button" data-jobs="research-list">Research Library</button></div>');
}
function jobApply(id){
 const role=jobById(id);if(!role||jobState.hired.includes(id))return;
 if(!jobEligible(role)){notice('You must meet the school requirements before applying.');return;}
 jobState.hired.push(id);jobSave();jobPanel();notice('Hired as '+role.title+'! Complete tasks to earn wages.');
}
function jobOpenShift(id){
 const role=jobById(id);
 if(!role||!jobState.hired.includes(id))return;
 if(role.id==='researcher')return jobResearchList();
 const s=jobState.shifts[id]||{count:0,last:0,earned:0};
 if(Date.now()-s.last<180000){notice('Your next shift opens after the 3-minute rest period.');return;}
 const tasks=JOB_TASKS[id];if(!tasks?.length)return;
 jobSession={kind:'shift',id,task:tasks[s.count%tasks.length],step:0,started:Date.now(),mistakes:0};
 jobShowReading();
}
function jobShowReading(){
 const session=jobSession;if(!session)return;
 const research=session.kind==='research',
  content=research?session.project:session.task;
 cityPanel(research?'Scientific Research / Study':'Employment / Work shift',esc(content.title),
 '<div class="job-reading"><small>'+(research?'Research article · '+esc(content.field)+' · '+content.text.split(/\s+/).length+' words':
  'Professional work briefing · '+session.task.text.split(/\s+/).length+' words')+'</small>'+
 '<p>'+esc(content.text)+'</p><div class="job-reading-actions"><span>Read and understand the evidence before answering.</span>'+
 '<button class="button primary" type="button" data-jobs="start-quiz">Start questions</button></div></div>');
}
function jobStartQuiz(){
 if(!jobSession)return;
 const time=jobSession.kind==='research'?10000:6000;
 if(Date.now()-jobSession.started<time){notice('Read the passage for a few more seconds first.');return;}
 jobShowQuestion();
}
function jobShowQuestion(error=''){
 const session=jobSession;if(!session)return;
 const quiz=session.kind==='research'?session.project.questions:session.task.questions;
 const q=quiz[session.step];
 if(!q)return;
 cityPanel(session.kind==='research'?'Research assessment':'Work assessment',
 (session.kind==='research'?session.project.title:session.task.title)+' · '+(session.step+1)+' / '+quiz.length,
 '<div class="job-quiz"><p class="job-progress">Question '+(session.step+1)+' of '+quiz.length+'</p><h3>'+esc(q.prompt)+'</h3>'+
 q.choices.map((choice,i)=>'<button class="city-answer" type="button" data-jobs="answer" data-answer="'+i+'"><span>'+
 String.fromCharCode(65+i)+'</span>'+esc(choice)+'</button>').join('')+
 (error?'<p class="city-wrong">'+esc(error)+'</p>':'')+
 '<button type="button" class="button" data-jobs="reread">Read the passage again</button></div>');
}
function jobAnswer(answer){
 const session=jobSession;if(!session)return;
 const questions=session.kind==='research'?session.project.questions:session.task.questions;
 const current=questions[session.step];if(!current)return;
 if(Number(answer)!==current.correctIndex){
  session.mistakes++;jobShowQuestion('That answer is not supported by the passage. Review the evidence and retry.');return;
 }
 session.step++;
 if(session.step<questions.length){jobShowQuestion();return;}
 const isResearch=session.kind==='research',role=isResearch?jobById('researcher'):jobById(session.id);
 let reward;
 if(isResearch){
  const key=session.project.id;
  if(jobState.completedResearch.includes(key)){jobSession=null;jobResearchList();return;}
  reward=session.project.reward;
  jobState.completedResearch.push(key);
 }else{
  const saved=jobState.shifts[role.id]||{count:0,last:0,earned:0};
  reward=role.wage;
  saved.count++;saved.last=Date.now();saved.earned+=reward;
  jobState.shifts[role.id]=saved;
 }
 const name=isResearch?session.project.title:session.task.title;
 jobSession=null;jobSave();cityEarn(reward,isResearch?25:12);
 cityPanel('Work completed','+'+reward+' coins',
 '<div class="city-success-medal">★</div><h3>'+esc(name)+' completed</h3>'+
 '<p>You studied the instructions, answered every question, and earned <strong>'+reward+' coins</strong>.</p>'+
 '<p>'+(isResearch?'Your research report is now recorded in the completed-project journal.':'Your next paid shift opens after a 3-minute rest period.')+'</p>'+
 '<button class="button primary" data-jobs="'+(isResearch?'research-list':'jobs')+'">Continue</button>');
}
function jobResearchList(){
 const hired=jobState.hired.includes('researcher');
 const cards=jobAllResearch().map(p=>{
  const done=jobState.completedResearch.includes(p.id);
  return '<article class="job-research-card"><small>'+esc(p.field)+' · '+esc(p.teacher)+'</small><h3>'+esc(p.title)+'</h3>'+
  '<p>'+esc(p.summary)+'</p><div><span>'+p.text.split(/\s+/).length+' words · '+p.questions.length+' questions · '+p.reward+' coins</span>'+
  '<button class="button '+(done?'':'primary')+'" data-jobs="research-open" data-id="'+esc(p.id)+'" '+(!hired||done?'disabled':'')+'>'+
  (done?'✓ Completed':'Study research')+'</button></div></article>';
 }).join('');
 cityPanel('Career Center / Research','Research Projects',
 '<p>To be employed as a Research Scientist, pass Science and English and have a GPA of at least 2.5. Study a passage and pass its questions to earn a one-time research payment.</p>'+
 '<div class="job-research-grid">'+cards+'</div>'+
 '<div class="job-import"><h3>Research from your teacher</h3>'+
 '<p>Enter a public research code from an approved teacher, or import a JSON research pack that your teacher exported. Imported content stays on this device.</p>'+
 '<form id="job-code-form"><input name="code" minlength="8" maxlength="45" placeholder="Teacher publication code" required>'+
 '<button class="button primary" type="submit">Find research</button></form>'+
 '<label class="job-file-field">Import a teacher research JSON file<input id="job-file-input" accept=".json,application/json" type="file"></label>'+
 (jobState.lastImport?'<p class="city-sub">Last import: '+esc(jobState.lastImport)+'</p>':'')+'</div>'+
 '<div class="city-actions"><button class="button" type="button" data-jobs="jobs">Back to jobs</button>'+
 '<button class="button" type="button" data-wave="school">Study at school</button></div>');
}
function jobOpenResearch(id){
 if(!jobState.hired.includes('researcher')||!jobEligible(jobById('researcher'))){notice('Become a qualified Research Scientist first.');return;}
 const project=jobAllResearch().find(p=>p.id===id);if(!project||jobState.completedResearch.includes(id))return;
 jobSession={kind:'research',project,step:0,started:Date.now(),mistakes:0};
 jobShowReading();
}
function jobImportPack(payload,label='Imported research'){
 const list=Array.isArray(payload)?payload:Array.isArray(payload?.projects)?payload.projects:[payload];
 if(!list.length||list.length>25)throw Error('Import 1–25 projects in a research pack.');
 const items=list.map(x=>jobNormalizeProject(x,label));
 const reserved=new Set(JOB_SAMPLE_RESEARCH.map(p=>p.id));
 let added=0;
 for(const project of items){
  if(reserved.has(project.id))throw Error('This ID belongs to a built-in research lesson.');
  const old=jobState.teacherProjects.findIndex(p=>p.id===project.id);
  if(old>=0)jobState.teacherProjects[old]=project;
  else if(jobState.teacherProjects.length<25){jobState.teacherProjects.push(project);added++;}
 }
 jobState.lastImport=label;jobSave();
 return {added,total:items.length};
}
async function jobImportFile(file){
 if(!file||file.size>1024*1024)throw Error('JSON file must be smaller than 1 MB.');
 const contents=JSON.parse(await file.text());
 const added=jobImportPack(contents,file.name);
 notice('Loaded '+added.total+' research project'+(added.total===1?'':'s')+'.');jobResearchList();
}
async function jobFetchCode(code){
 const value=String(code||'').trim();
 if(!/^[A-Za-z0-9_-]{8,45}$/.test(value)){notice('Enter a valid research code.');return;}
 const endpoint='https://lumenvale-teachers.vercel.app/api/research/'+encodeURIComponent(value);
 try{
  const response=await fetch(endpoint,{method:'GET',mode:'cors',credentials:'omit'});
  if(!response.ok)throw Error(response.status===404?'Project not found or unpublished.':'Research service is unavailable.');
  const payload=await response.json();
  const result=jobImportPack(payload,'Teacher project '+value);
  notice('Research imported: '+result.total+' project.');jobResearchList();
 }catch(error){notice(error?.message||'Could not load research. Try an exported JSON pack instead.');}
}
function jobInit(){
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-jobs]');if(!button)return;
  const action=button.dataset.jobs,id=button.dataset.id;
  if(action==='jobs')jobPanel();
  if(action==='apply')jobApply(id);
  if(action==='shift')jobOpenShift(id);
  if(action==='research-list')jobResearchList();
  if(action==='research-open')jobOpenResearch(id);
  if(action==='start-quiz')jobStartQuiz();
  if(action==='reread')jobShowReading();
  if(action==='answer')jobAnswer(button.dataset.answer);
 });
 document.addEventListener('submit',event=>{
  if(event.target.id!=='job-code-form')return;
  event.preventDefault();const code=new FormData(event.target).get('code');jobFetchCode(code);
 });
 document.addEventListener('change',async event=>{
  if(event.target.id!=='job-file-input')return;
  try{await jobImportFile(event.target.files?.[0]);}catch(error){notice(error.message||'Invalid research pack.');}
 });
}
