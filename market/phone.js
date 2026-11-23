// The City Phone is the game's main navigation: explore, learn, work and manage.
// Skills: game-ui-ux (one clear navigation hierarchy, accessible focus and state).
const PHONE_CATEGORIES={
 learning:{label:'Learn',description:'Courses, reading, achievements and your next lesson.',apps:[
  ['continue','Continue','book','jade'],['school','My Courses','orders','blue'],
  ['teacher-content','Import Teacher JSON','book','jade'],
  ['library','School Library','book','gold'],['words','My Words','book','jade'],
  ['journal','Reading Journal','orders','sage']
 ]},
 city:{label:'City',description:'Explore districts and manage your growing town.',apps:[
  ['map','Town Map','map-icon','blue'],['property','Properties','window-icon','jade'],
  ['production','Production','chart-icon','gold'],['architect','Build','plant','jade'],
  ['garage','Garage','door-icon','sage'],['mail','Mail','mail','blue']
 ]},
 career:{label:'Work',description:'Teacher-created paths can be added in a future expansion.',apps:[]},
 tools:{label:'Tools',description:'Game settings, local backups and educator access.',apps:[
  ['guide','Help & Settings','help-icon','sage'],['backup','Save Backup','box','blue'],
  ['teacher-portal','Teacher Portal','book','gold'],['teacher','Demo Editor','book','sage'],
  ['fullscreen','Fullscreen','window-icon','blue']
 ]}
};
let phoneCategory='learning';
function phoneResumeLearning(){
 const learner=lmsLearner();
 if(!learner)return lmsHome();
 for(const courseId of learner.enrolled){
  const course=lmsCourseData(courseId);
  if(!course?.published)continue;
  const next=course.modules.find(m=>!learner.done[lmsKey(courseId,m.id)]);
  if(next)return lmsLesson(courseId,next.id);
 }
 return lmsHome();
}
function phoneLearningSummary(){
 const learner=lmsLearner(),mine=(learner?.enrolled||[]).map(lmsCourseData).filter(c=>c?.published);
 const done=mine.reduce((n,c)=>n+c.modules.filter(m=>learner.done[lmsKey(c.id,m.id)]).length,0);
 const total=mine.reduce((n,c)=>n+c.modules.length,0);
 const assignments=mine.reduce((n,c)=>n+c.assignments.filter(a=>!learner.submissions[lmsKey(c.id,a.id)]).length,0);
 const upcoming=mine.flatMap(c=>c.modules.filter(m=>!learner.done[lmsKey(c.id,m.id)]).map(m=>({course:c,module:m})))[0];
 return '<div class="phone-learning-overview">'+
  '<div><b>'+mine.length+'</b><small>Enrolled courses</small></div>'+
  '<div><b>'+done+'/'+total+'</b><small>Lessons complete</small></div>'+
  '<div><b>'+assignments+'</b><small>Work to submit</small></div></div>'+
  '<p class="phone-next-task"><span>YOUR NEXT STEP</span>'+
  (upcoming?'<strong>'+esc(upcoming.module.title)+'</strong><small>'+esc(upcoming.course.title)+'</small>':
   '<strong>Awaiting teacher courses</strong><small>Import a JSON file or class code from your teacher</small>')+'</p>';
}
function phoneOpen(category=phoneCategory){
 // Existing callers may attach phoneOpen directly as a DOM event listener.
 if(typeof category!=='string'||!PHONE_CATEGORIES[category])category=phoneCategory;
 phoneCategory=category;
 const info=PHONE_CATEGORIES[category];
 const app=(id,label,icon,color)=>'<button type="button" data-phone-app="'+id+'" aria-label="'+esc(label)+'"><span class="phone-app-icon '+color+'"><svg aria-hidden="true"><use href="#'+icon+'"></use></svg></span><span>'+esc(label)+'</span></button>';
 const metric=(id,name)=>'<div><span>'+name+'</span><b id="phone-'+id+'"></b></div>';
 const tabs=Object.entries(PHONE_CATEGORIES).map(([key,group])=>
  '<button type="button" data-phone-category="'+key+'" aria-pressed="'+(key===category?'true':'false')+'">'+esc(group.label)+'</button>').join('');
 const content=info.apps.map(([id,label,icon,color])=>app(id,label,icon,color)).join('');
 cityPanel('City Phone',info.label,
  '<div class="phone-context-head"><b>LumenVale · City Phone</b><small>'+esc(info.description)+'</small></div>'+
  '<nav class="phone-categories" aria-label="Phone sections">'+tabs+'</nav>'+
  (category==='learning'?phoneLearningSummary():
   category==='city'?'<div class="phone-overview">'+metric('lands','Land owned')+metric('income','Production / 5s')+
    metric('coins','City wallet')+metric('stock','Goods in stock')+'</div>':
   category==='career'?'<p class="phone-goal">No career paths have been assigned. School classes are added by teachers; career curriculum can be introduced later.</p>':
   '<p class="phone-goal">Progress is currently saved in this browser. Back it up before clearing browser data or switching devices.</p>')+
  '<nav class="phone-apps" aria-label="'+esc(info.label)+' apps">'+content+'</nav>'+
  (category==='city'?'<p class="phone-goal">'+esc(missions[state.step])+'</p>':''));
 dialog.dataset.surface='phone';
 byId('phone-back').hidden=true;
 if(category==='city')citySync();
}
function phoneSync(){
 if(!dialog.open||dialog.dataset.surface!=='phone'||phoneCategory!=='city')return;
 const values={
  lands:cityLandOwned()+' / '+CITY_SITES.length,
  income:cityIncome().toLocaleString()+' / 5s',
  coins:cityState.coins.toLocaleString(),
  stock:Object.values(systemsState.inventory).reduce((total,count)=>total+count,0).toLocaleString()
 };
 for(const [name,value] of Object.entries(values)){
  const stat=byId('phone-'+name);
  if(stat&&stat.textContent!==value)stat.textContent=value;
 }
}
function phoneInit(){
 const apps={
  continue:phoneResumeLearning,school:lmsHome,'teacher-content':pathwayImportPanel,pathways:pathwayHome,
  transcript:pathwayTranscript,library:cityBookList,words:campusVocabulary,
  journal:academyProfile,map:campusMap,property:cityPortfolio,
  production:()=>systemsPanel('warehouse'),architect:campusArchitect,
  garage:()=>systemsPanel('garage'),mail:systemsMailBox,
  careers:campusCareer,jobs:jobPanel,guide:cityGuide,backup:gameBackupHome,
  teacher:lmsTeacher,
  'teacher-portal':()=>window.open('https://lumenvale-teachers.vercel.app/dashboard','_blank','noopener,noreferrer'),
  fullscreen:()=>{dialog.close();cityEnterFullscreen();}
 };
 byId('open-phone').addEventListener('click',()=>phoneOpen());
 byId('phone-back').addEventListener('click',()=>phoneOpen());
 dialog.addEventListener('click',event=>{
  const category=event.target.closest('[data-phone-category]')?.dataset.phoneCategory;
  if(category&&PHONE_CATEGORIES[category]){
   phoneOpen(category);
   // Retain keyboard focus after changing tabs.
   dialog.querySelector('[data-phone-category="'+category+'"]')?.focus();
   return;
  }
  const id=event.target.closest('[data-phone-app]')?.dataset.phoneApp;
  if(!id||!apps[id])return;
  apps[id]();
  if(dialog.open)byId('phone-back').hidden=false;
 });
 dialog.addEventListener('close',()=>{
  dialog.removeAttribute('data-surface');
  byId('phone-back').hidden=true;
 });
 window.addEventListener('keydown',event=>{
  if(event.key.toLowerCase()!=='p'||event.repeat||event.altKey||event.ctrlKey||event.metaKey||
     terminal.open||event.target.matches?.('input,textarea,select,[contenteditable="true"]'))return;
  if(dialog.open&&dialog.dataset.surface!=='phone')return;
  event.preventDefault();
  if(dialog.open)dialog.close();
  else phoneOpen();
 });
}
