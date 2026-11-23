/* LumenVale Learning Hub — Canvas-style offline classroom prototype.
 * This preview is deliberately NOT a real teacher authentication or shared gradebook.
 * Approved teachers publish verified course packs on the separate Teacher Studio.
 */
const LMS_SAVE_KEY='lumenvale-lms-v1';
const LMS_KIND='lumenvale.lms-course';
const LMS_PORTAL='https://lumenvale-teachers.vercel.app/dashboard/courses';
const LMS_COURSE_ENDPOINT='https://lumenvale-teachers.vercel.app/api/courses/';
function lmsText(v,max=5000){return String(v??'').trim().slice(0,max);}
function lmsCode(v){return /^[A-Z][A-Z0-9-]{2,30}$/.test(v);}
function lmsSlug(v){return lmsText(v,65).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,46);}
function lmsQuestions(list,label,max=40){
 if(!Array.isArray(list)||list.length>max)throw Error(label+' must contain at most '+max+' questions.');
 return list.map((q,i)=>{
  const prompt=lmsText(q?.prompt,700),choices=Array.isArray(q?.choices)?q.choices.map(x=>lmsText(x,260)):[];
  const correctIndex=Number(q?.correctIndex);
  if(prompt.length<9||choices.length<2||choices.length>5||choices.some(x=>!x)||
   !Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=choices.length)throw Error(label+' question '+(i+1)+' has invalid answers.');
  return {prompt,choices,correctIndex,explanation:lmsText(q.explanation,650)};
 });
}
function lmsValidateCourse(raw){
 if(!raw||raw.kind!==LMS_KIND||raw.version!==1)throw Error('Expected a lumenvale.lms-course JSON file, version 1.');
 const id=lmsText(raw.id,32),title=lmsText(raw.title,120),subject=lmsText(raw.subject,70);
 if(!lmsCode(id)||title.length<3||!subject)throw Error('Course needs a code (e.g. BIO-M1), title, and subject.');
 if(!Array.isArray(raw.modules)||raw.modules.length>24)throw Error('Maximum 24 modules per course.');
 const ids=new Set();
 const modules=raw.modules.map((m,i)=>{
  const mid=lmsText(m.id,46),mt=lmsText(m.title,120),lesson=m.lesson||{};
  if(!/^[a-z0-9-]{2,46}$/.test(mid)||ids.has(mid)||mt.length<3)throw Error('Module '+(i+1)+' needs a unique ID and title.');
  ids.add(mid);
  const content=lmsText(lesson.content,12000);
  if(content.length<30)throw Error('Module '+(i+1)+' requires lesson text (30+ characters).');
  const objectives=Array.isArray(m.objectives)?m.objectives.slice(0,10).map(x=>lmsText(x,240)).filter(Boolean):[];
  const flashcards=Array.isArray(m.flashcards)?m.flashcards.slice(0,60).map(f=>{
   const front=lmsText(f.front,180),back=lmsText(f.back,650);
   if(!front||!back)throw Error('Each flashcard needs a front and back.');
   return {front,back};
  }):[];
  const exam=m.exam||{};
  return {id:mid,title:mt,objectives,lesson:{title:lmsText(lesson.title,120)||mt,content},flashcards,
   practice:lmsQuestions(m.practice||[],'Practice',25),
   exam:{title:lmsText(exam.title,120)||'Module exam',questions:lmsQuestions(exam.questions||[],'Exam'),
    timeLimitMinutes:Math.max(1,Math.min(90,Number(exam.timeLimitMinutes)||15)),
    attemptLimit:Math.max(1,Math.min(5,Math.round(Number(exam.attemptLimit)||3)))}};
 });
 const seenA=new Set(),assignments=(raw.assignments||[]).map(a=>{
  const aid=lmsText(a.id,46),points=Number(a.points);
  if(!/^[a-z0-9-]{2,46}$/.test(aid)||seenA.has(aid)||!lmsText(a.title,120)||
   !lmsText(a.prompt,3000)||!Number.isInteger(points)||points<1||points>1000)throw Error('Assignment fields or points are invalid.');
  seenA.add(aid);
  const dueDate=lmsText(a.dueDate,10);
  if(dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw Error('Due date must use YYYY-MM-DD.');
  return {id:aid,title:lmsText(a.title,120),moduleId:lmsText(a.moduleId,46),
   prompt:lmsText(a.prompt,3000),points,dueDate};
 });
 if(assignments.length>80)throw Error('Maximum 80 assignments.');
 if(!Array.isArray(raw.announcements||[])||(raw.announcements||[]).length>80)throw Error('Maximum 80 announcements.');
 const announcements=(raw.announcements||[]).map(a=>({
  id:lmsSlug(a.id)||'news',title:lmsText(a.title,140),body:lmsText(a.body,3000),date:lmsText(a.date,10)
 })).filter(x=>x.title&&x.body);
 return {kind:LMS_KIND,version:1,id,title,subject,teacher:lmsText(raw.teacher,100)||'Teacher',
  description:lmsText(raw.description,700),published:raw.published!==false,modules,assignments,announcements};
}
// Teacher-controlled school: no built-in classes, lessons or exams at startup.
function lmsSeedCourses(){return {};}
function lmsInitial(){
 return {version:1,courses:{},active:'student',learners:{
  student:{name:'Student',enrolled:[],done:{},cards:{},exams:{},submissions:{},practice:{}}}};
}
function lmsRestore(raw){
 if(!raw||raw.version!==1||!raw.courses||typeof raw.courses!=='object'||!raw.learners||typeof raw.learners!=='object')return lmsInitial();
 const data=lmsInitial(),courses={};
 for(const item of Object.values(raw.courses).slice(0,80)){
  try{
   const c=lmsValidateCourse(item);
   // Remove unchanged old demo seeds, preserve teacher-authored content.
   const sample=LV_LMS_DEMO.courses.find(s=>s.id===c.id);
   if(sample&&JSON.stringify(c)===JSON.stringify(lmsValidateCourse(sample)))continue;
   courses[c.id]=c;
  }catch{}
 }
 data.courses=courses;
 const learners={};
 for(const [id,v] of Object.entries(raw.learners).slice(0,16)){
  if(!/^[a-z0-9-]{2,65}$/.test(id)||!v||typeof v!=='object')continue;
  learners[id]={name:lmsText(v.name,40)||'Student',enrolled:Array.isArray(v.enrolled)?v.enrolled.filter(x=>courses[x]||data.courses[x]).slice(0,80):[],
   done:v.done&&typeof v.done==='object'?v.done:{},cards:v.cards&&typeof v.cards==='object'?v.cards:{},
   exams:v.exams&&typeof v.exams==='object'?v.exams:{},submissions:v.submissions&&typeof v.submissions==='object'?v.submissions:{},
   practice:v.practice&&typeof v.practice==='object'?v.practice:{}};
 }
 data.learners=Object.keys(learners).length?learners:data.learners;
 data.active=data.learners[raw.active]?raw.active:Object.keys(data.learners)[0];
 return data;
}
function lmsLoad(){try{return lmsRestore(JSON.parse(localStorage.getItem(LMS_SAVE_KEY)));}catch{return lmsInitial();}}
var lmsState=lmsLoad(),lmsFlashSession=null,lmsPracticeSession=null,lmsExamSession=null,lmsExamTimer=0;
function lmsSave(){try{if(!trial)localStorage.setItem(LMS_SAVE_KEY,JSON.stringify(lmsState));}catch{notice('Learning Hub could not save locally. Export your content.');}}
function lmsLearner(){return lmsState.learners[lmsState.active];}
function lmsCourseData(id){return lmsState.courses[id];}
function lmsModule(courseId,moduleId){return lmsCourseData(courseId)?.modules.find(m=>m.id===moduleId);}
function lmsKey(courseId,moduleId){return courseId+':'+moduleId;}
function lmsC(id,label,cls=''){return '<button type="button" class="lms-button '+cls+'" data-lms="'+id+'">'+esc(label)+'</button>';}
function lmsHeader(title,subtitle,active='student'){
 return '<div class="lms-banner"><div><span class="lms-eyebrow">LUMENVALE · LEARNING HUB</span><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div>'+
 '<div class="lms-banner-icon" aria-hidden="true">✦</div></div>'+
 '<div class="lms-nav">'+lmsC('home','My Dashboard',active==='student'?'active':'')+
 (active==='teacher'?lmsC('teacher','Local Draft Editor','active'):'')+
 lmsC('import','Teacher Content')+lmsC('library','School Library')+'</div>';
}
function lmsRender(title,subtitle,html,area='student'){
 cityPanel('School / Learning Hub',title,lmsHeader(title,subtitle,area)+html+
 '<p class="lms-disclaimer">Local learning preview · Scores and feedback are saved only in this browser, not in a verified school gradebook.</p>');
}
function lmsProgress(c,student=lmsLearner()){
 const total=c.modules.length,done=c.modules.filter(m=>student.done[lmsKey(c.id,m.id)]).length;
 return {total,done,percent:total?Math.round(100*done/total):0};
}
function lmsHome(){
 const student=lmsLearner(),all=Object.values(lmsState.courses).filter(c=>c.published);
 const mine=all.filter(c=>student.enrolled.includes(c.id));
 const assignments=mine.reduce((n,c)=>n+c.assignments.filter(a=>!student.submissions[lmsKey(c.id,a.id)]).length,0);
 const cards=all.map(c=>{
  const enrolled=student.enrolled.includes(c.id),p=lmsProgress(c,student);
  return '<button class="lms-course-card" data-lms="course" data-id="'+esc(c.id)+'">'+
   '<span class="lms-course-tag">'+esc(c.subject)+' · '+esc(c.id)+'</span>'+
   '<strong>'+esc(c.title)+'</strong><span class="lms-muted">'+esc(c.description||'Teacher-created course content')+'</span>'+
   '<span class="lms-progress"><i style="width:'+p.percent+'%"></i></span>'+
   '<span class="lms-course-meta">'+(enrolled?p.done+' / '+p.total+' modules completed':'Open course · Enroll')+
   ' <b>→</b></span></button>';
 }).join('');
 const picker=Object.entries(lmsState.learners).map(([key,s])=>'<option value="'+esc(key)+'" '+(key===lmsState.active?'selected':'')+'>'+esc(s.name)+'</option>').join('');
 lmsRender('My Learning Dashboard','Lessons, assignments, exams, and teacher announcements in one place.',
  '<div class="lms-profile"><label>Local student profile <select id="lms-student-picker">'+picker+'</select></label>'+
  lmsC('new-student','Add student demo profile')+'</div>'+
  '<div class="lms-stat-grid"><div><b>'+mine.length+'</b><small>My courses</small></div><div><b>'+assignments+'</b><small>Assignments to submit</small></div>'+
  '<div><b>'+mine.reduce((n,c)=>n+c.modules.length,0)+'</b><small>Available modules</small></div></div>'+
  '<div class="lms-section-title"><h3>Available courses</h3><span>'+all.length+' published</span></div>'+
  '<div class="lms-course-grid">'+(cards||'<div class="lms-empty-campus"><strong>No classes have been added yet.</strong><p>Your school starts empty. A teacher can create courses, chapters, exams and assignments using a validated JSON file or publication code.</p></div>')+'</div>'+
  '<div class="lms-actions">'+lmsC('import','Import teacher JSON')+
  '<a class="lms-button lms-link" href="'+LMS_PORTAL+'" target="_blank" rel="noopener noreferrer">Verified Teacher Studio ↗</a></div>');
}
function lmsCourse(id,section='modules'){
 const c=lmsCourseData(id),s=lmsLearner();if(!c||!c.published)return lmsHome();
 const enrolled=s.enrolled.includes(id),progress=lmsProgress(c,s);
 const nav=['modules','assignments','announcements','grades'].map(x=>'<button data-lms="course" data-id="'+esc(id)+'" data-section="'+x+'" class="lms-tab '+(section===x?'active':'')+'">'+x[0].toUpperCase()+x.slice(1)+'</button>').join('');
 let html='<div class="lms-course-overview"><span class="lms-course-tag">'+esc(c.id)+' · '+esc(c.subject)+'</span>'+
  '<p>'+esc(c.description)+'</p><small>Teacher: '+esc(c.teacher)+' · '+progress.done+'/'+progress.total+' completed modules</small>'+
  '<span class="lms-progress"><i style="width:'+progress.percent+'%"></i></span>'+
  (!enrolled?'<button class="lms-button primary" data-lms="enroll" data-id="'+esc(id)+'">Enroll in course</button>':'<span class="lms-completed">✓ Enrolled</span>')+'</div>';
 if(enrolled){
  html+='<nav class="lms-tabs">'+nav+'</nav>';
  if(section==='modules')html+='<div class="lms-module-list">'+c.modules.map((m,i)=>{
    const attempts=s.exams[lmsKey(id,m.id)]||[],best=attempts.length?Math.max(...attempts.map(x=>x.score)):null;
    return '<div class="lms-module"><div class="lms-module-num">'+String(i+1).padStart(2,'0')+'</div>'+
    '<div class="lms-module-body"><strong>'+esc(m.title)+'</strong><small>'+m.flashcards.length+' flashcards · '+m.practice.length+' practice questions · '+
    m.exam.questions.length+' exam questions</small><div class="lms-module-actions">'+
    '<button data-lms="lesson" data-id="'+esc(id)+'" data-module="'+esc(m.id)+'">Open lesson</button>'+
    (m.flashcards.length?'<button data-lms="flash" data-id="'+esc(id)+'" data-module="'+esc(m.id)+'">Flashcards</button>':'')+
    (m.practice.length?'<button data-lms="practice" data-id="'+esc(id)+'" data-module="'+esc(m.id)+'">Practice</button>':'')+
    (m.exam.questions.length?'<button data-lms="exam" data-id="'+esc(id)+'" data-module="'+esc(m.id)+'">Exam'+(best!==null?' · '+best+'%':'')+'</button>':'')+'</div></div>'+
    '<span class="lms-check">'+(s.done[lmsKey(id,m.id)]?'✓':'○')+'</span></div>';
   }).join('')+'</div>';
  if(section==='assignments')html+='<div class="lms-module-list">'+(c.assignments.map(a=>{
   const sub=s.submissions[lmsKey(id,a.id)];
   return '<div class="lms-assignment"><strong>'+esc(a.title)+'</strong><small>'+a.points+' points'+(a.dueDate?' · Due '+esc(a.dueDate):'')+'</small>'+
    '<p>'+esc(a.prompt)+'</p><span class="lms-pill">'+(sub?sub.points==null?'Submitted · Awaiting review':'Graded · '+sub.points+'/'+a.points:'Not submitted')+'</span>'+
    '<button class="lms-button" data-lms="assignment" data-id="'+esc(id)+'" data-assignment="'+esc(a.id)+'">'+(sub?'View submission':'Write submission')+'</button></div>';
   }).join('')||'<p>No assignments published yet.</p>')+'</div>';
  if(section==='announcements')html+='<div class="lms-announcements">'+(c.announcements.slice().reverse().map(a=>
   '<article><small>'+esc(a.date||'Announcement')+'</small><strong>'+esc(a.title)+'</strong><p>'+esc(a.body)+'</p></article>'
   ).join('')||'<p>No announcements yet.</p>')+'</div>';
  if(section==='grades')html+=lmsGradebookHTML(c,s);
 }
 lmsRender(c.title,'Course · '+c.subject,html+'<div class="lms-actions">'+lmsC('home','All courses')+'</div>');
}
function lmsLesson(id,mid){
 const c=lmsCourseData(id),m=lmsModule(id,mid);if(!c||!m)return lmsHome();
 const done=lmsLearner().done[lmsKey(id,mid)];
 lmsRender(m.lesson.title,c.title+' / '+m.title,
  '<div class="lms-lesson"><div class="lms-objectives"><b>Learning objectives</b><ul>'+
  m.objectives.map(o=>'<li>'+esc(o)+'</li>').join('')+'</ul></div>'+
  '<article>'+esc(m.lesson.content)+'</article></div>'+
  '<div class="lms-actions"><button data-lms="mark" data-id="'+esc(id)+'" data-module="'+esc(mid)+'" class="lms-button primary">'+(done?'✓ Lesson completed':'Mark lesson completed')+'</button>'+
  (m.flashcards.length?'<button data-lms="flash" data-id="'+esc(id)+'" data-module="'+esc(mid)+'" class="lms-button">Study flashcards</button>':'')+
  (m.practice.length?'<button data-lms="practice" data-id="'+esc(id)+'" data-module="'+esc(mid)+'" class="lms-button">Practice questions</button>':'')+
  '<button data-lms="course" data-id="'+esc(id)+'" class="lms-button">Back to course</button></div>');
}
function lmsFlash(id,mid,index=0,flipped=false){
 const m=lmsModule(id,mid);if(!m?.flashcards.length)return lmsCourse(id);
 const card=m.flashcards[Math.max(0,Math.min(index,m.flashcards.length-1))],idx=m.flashcards.indexOf(card);
 lmsFlashSession={id,mid,index:idx,flipped};
 lmsRender('Flashcards',lmsCourseData(id).title+' · '+m.title,
 '<button type="button" class="lms-flashcard" data-lms="flip"><small>Card '+(idx+1)+' / '+m.flashcards.length+' · Click to flip</small>'+
 '<strong>'+esc(flipped?card.back:card.front)+'</strong><span>'+(flipped?'Answer':'Question')+'</span></button>'+
 '<div class="lms-actions">'+lmsC('previous-card','← Previous')+lmsC('next-card','Reviewed / Next →')+
 '<button data-lms="course" data-id="'+esc(id)+'" class="lms-button">Back to course</button></div>');
}
function lmsPractice(id,mid,index=0,reveal=false){
 const m=lmsModule(id,mid);if(!m?.practice.length)return lmsCourse(id);
 const q=m.practice[index];if(!q)return lmsCourse(id);
 lmsPracticeSession={id,mid,index,reveal};
 const feedback=reveal?'<div class="lms-feedback"><b>'+esc(q.explanation||'Review the lesson before continuing.')+'</b></div>':'';
 lmsRender('Practice questions',lmsCourseData(id).title+' · '+m.title,
 '<p class="lms-muted">Practice is ungraded. You can try again until you understand each question.</p>'+
 '<div class="lms-question"><small>Question '+(index+1)+' / '+m.practice.length+'</small><h3>'+esc(q.prompt)+'</h3>'+
 q.choices.map((v,i)=>'<button class="lms-choice '+(reveal&&i===q.correctIndex?'correct':'')+'" data-lms="practice-answer" data-answer="'+i+'" '+(reveal?'disabled':'')+'><b>'+String.fromCharCode(65+i)+'</b>'+esc(v)+'</button>').join('')+'</div>'+feedback+
 '<div class="lms-actions">'+(reveal?lmsC('practice-next',index+1<m.practice.length?'Next question':'Finish practice','primary'):'')+
 '<button data-lms="lesson" data-id="'+esc(id)+'" data-module="'+esc(mid)+'" class="lms-button">Back to reading</button></div>');
}
function lmsExamStart(id,mid){
 const m=lmsModule(id,mid),learner=lmsLearner(),c=lmsCourseData(id);if(!c||!m?.exam.questions.length)return lmsCourse(id);
 const key=lmsKey(id,mid),attempts=learner.exams[key]||[];
 if(attempts.length>=m.exam.attemptLimit){notice('Exam attempt limit reached in this local practice.');return lmsCourse(id);}
 if(lmsExamTimer)clearInterval(lmsExamTimer);
 lmsExamSession={id,mid,index:0,answers:[],started:Date.now(),deadline:Date.now()+m.exam.timeLimitMinutes*60000};
 lmsExamTimer=setInterval(()=>{
  if(!lmsExamSession){clearInterval(lmsExamTimer);lmsExamTimer=0;return;}
  const remaining=Math.max(0,Math.ceil((lmsExamSession.deadline-Date.now())/1000)),node=document.getElementById('lms-time-left');
  if(node)node.textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
  if(remaining<=0)lmsExamFinish(true);
 },1000);
 lmsExamScreen();
}
function lmsExamScreen(){
 const s=lmsExamSession;if(!s)return;
 if(Date.now()>=s.deadline)return lmsExamFinish(true);
 const c=lmsCourseData(s.id),m=lmsModule(s.id,s.mid),q=m.exam.questions[s.index];
 const left=Math.max(0,Math.ceil((s.deadline-Date.now())/1000));
 lmsRender(m.exam.title,c.title+' · '+m.title,
 '<div class="lms-exam-top"><span>Question '+(s.index+1)+' / '+m.exam.questions.length+'</span><span>Time left: <b id="lms-time-left">'+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+'</b></span></div>'+
 '<p class="lms-muted">Answers are final. This is a timed local practice exam, not a secure proctored assessment.</p>'+
 '<div class="lms-question"><h3>'+esc(q.prompt)+'</h3>'+
 q.choices.map((v,i)=>'<button class="lms-choice" data-lms="exam-answer" data-answer="'+i+'"><b>'+String.fromCharCode(65+i)+'</b>'+esc(v)+'</button>').join('')+'</div>'+
 '<p class="lms-disclaimer">Closing the screen does not pause the timer.</p>');
}
function lmsExamAnswer(answer){
 const s=lmsExamSession;if(!s)return;
 if(Date.now()>=s.deadline)return lmsExamFinish(true);
 const m=lmsModule(s.id,s.mid),q=m?.exam.questions[s.index],num=Number(answer);
 if(!q||!Number.isInteger(num)||num<0||num>=q.choices.length)return;
 s.answers.push(num);s.index++;
 if(s.index<m.exam.questions.length)return lmsExamScreen();
 lmsExamFinish(false);
}
function lmsExamFinish(expired){
 const s=lmsExamSession;if(!s)return;
 lmsExamSession=null;if(lmsExamTimer)clearInterval(lmsExamTimer);lmsExamTimer=0;
 const m=lmsModule(s.id,s.mid),questions=m.exam.questions;
 const correct=questions.reduce((n,q,i)=>n+Number(s.answers[i]===q.correctIndex),0);
 const score=Math.round(correct/questions.length*100),key=lmsKey(s.id,s.mid),student=lmsLearner();
 if(!Array.isArray(student.exams[key]))student.exams[key]=[];
 student.exams[key].push({score,correct,total:questions.length,expired,date:new Date().toISOString()});
 lmsSave();
 lmsRender('Exam result',lmsCourseData(s.id).title+' · '+m.title,
 '<div class="lms-result"><strong>'+score+'%</strong><span>'+correct+' of '+questions.length+' correct'+(expired?' · Time expired':'')+'</span></div>'+
 '<p>Your local practice score was saved. You can review the lesson and use any remaining attempts to improve.</p>'+
 '<div class="lms-actions"><button class="lms-button primary" data-lms="course" data-id="'+esc(s.id)+'" data-section="grades">Gradebook</button>'+
 '<button class="lms-button" data-lms="lesson" data-id="'+esc(s.id)+'" data-module="'+esc(s.mid)+'">Review lesson</button></div>');
}
function lmsAssignment(id,assignmentId){
 const c=lmsCourseData(id),a=c?.assignments.find(x=>x.id===assignmentId);if(!a)return lmsCourse(id);
 const learner=lmsLearner(),key=lmsKey(id,assignmentId),sub=learner.submissions[key];
 lmsRender(a.title,c.title+' · Written assignment · '+a.points+' points',
 '<div class="lms-assignment"><p>'+esc(a.prompt)+'</p><small>'+(a.dueDate?'Due '+esc(a.dueDate):'No due date')+'</small></div>'+
 (sub?.points!=null?'<div class="lms-feedback"><b>Teacher score: '+sub.points+' / '+a.points+'</b><p>'+esc(sub.feedback||'No additional comments')+'</p></div>':
 '<form id="lms-submission-form" class="lms-form"><input type="hidden" name="course" value="'+esc(id)+'">'+
 '<input type="hidden" name="assignment" value="'+esc(assignmentId)+'"><label>Your response<textarea name="answer" required minlength="15" maxlength="5000" rows="8" placeholder="Write your answer here...">'+esc(sub?.answer||'')+'</textarea></label>'+
 '<button class="lms-button primary" type="submit">'+(sub?'Update submission':'Submit assignment')+'</button></form>')+
 '<div class="lms-actions"><button class="lms-button" data-lms="course" data-id="'+esc(id)+'" data-section="assignments">Back to assignments</button></div>');
}
function lmsGradebookHTML(c,student){
 const rows=c.modules.flatMap(m=>(student.exams[lmsKey(c.id,m.id)]||[]).length?
 ['<tr><td>'+esc(m.title)+' · Exam</td><td>'+Math.max(...student.exams[lmsKey(c.id,m.id)].map(x=>x.score))+'%</td><td>Auto-graded practice</td></tr>']:[]);
 rows.push(...c.assignments.map(a=>{
  const sub=student.submissions[lmsKey(c.id,a.id)];
  return '<tr><td>'+esc(a.title)+'</td><td>'+(sub?.points!=null?sub.points+' / '+a.points:'—')+
  '</td><td>'+(sub?.points!=null?'Teacher-reviewed (local)':sub?'Submitted':'Not submitted')+'</td></tr>';
 }));
 return '<div class="lms-table-scroll"><table class="lms-table"><thead><tr><th>Activity</th><th>Score</th><th>Status</th></tr></thead><tbody>'+
 (rows.join('')||'<tr><td colspan="3">No activity yet.</td></tr>')+'</tbody></table></div>'+
 '<p class="lms-disclaimer">This gradebook is a local game practice record; it does not affect your Academic Pathways transcript or an actual school grade.</p>';
}
function lmsTeacher(){
 const courses=Object.values(lmsState.courses);
 const pending=Object.entries(lmsState.learners).flatMap(([studentId,s])=>Object.entries(s.submissions||{})
  .filter(([,v])=>v&&v.points==null).map(([key,v])=>({studentId,student:s.name,key,sub:v})));
 const rows=courses.map(c=>'<div class="lms-teacher-course"><div><b>'+esc(c.title)+'</b><small>'+esc(c.id)+' · '+c.modules.length+' modules · '+c.assignments.length+' assignments · '+(c.published?'Published locally':'Draft')+'</small></div>'+
 '<div class="lms-actions"><button class="lms-button" data-lms="teacher-course" data-id="'+esc(c.id)+'">Edit content</button>'+
 '<button class="lms-button" data-lms="toggle-publish" data-id="'+esc(c.id)+'">'+(c.published?'Unpublish':'Publish')+'</button>'+
 '<button class="lms-button" data-lms="export-course" data-id="'+esc(c.id)+'">Export JSON</button></div></div>').join('');
 lmsRender('Teacher Workspace','Build lessons, assignments, exams, and announcements in the local preview.',
 '<div class="lms-warning"><strong>Local teacher preview — not an authenticated account.</strong><p>Anyone with access to this browser can use these editing tools. For verified teacher accounts and shareable academic courses, use the secure Teacher Studio.</p>'+
 '<a href="'+LMS_PORTAL+'" target="_blank" rel="noopener noreferrer" class="lms-button primary lms-link">Open verified Teacher Studio ↗</a></div>'+
 '<div class="lms-stat-grid"><div><b>'+courses.length+'</b><small>Courses</small></div><div><b>'+Object.keys(lmsState.learners).length+'</b><small>Local student profiles</small></div>'+
 '<div><b>'+pending.length+'</b><small>Submissions to grade</small></div></div>'+
 '<div class="lms-section-title"><h3>Course library</h3><span>Teacher tools</span></div>'+
 '<div class="lms-teacher-courses">'+rows+'</div>'+
 '<div class="lms-actions">'+lmsC('new-course','+ Create course','primary')+lmsC('import','Import JSON')+lmsC('export-all','Export all courses')+lmsC('prompt','JSON prompt template')+'</div>'+
 '<div class="lms-section-title"><h3>Assignments awaiting feedback</h3></div>'+
 (pending.length?pending.map(p=>{
  const [id,aid]=p.key.split(':'),c=lmsCourseData(id),a=c?.assignments.find(x=>x.id===aid);
  return '<div class="lms-assignment"><b>'+esc(p.student)+' — '+esc(a?.title||aid)+'</b><p>'+esc(p.sub.answer)+'</p>'+
  '<form class="lms-form lms-grade-form"><input type="hidden" name="student" value="'+esc(p.studentId)+'">'+
  '<input type="hidden" name="course" value="'+esc(id)+'"><input type="hidden" name="assignment" value="'+esc(aid)+'">'+
  '<label>Score / '+(a?.points||100)+' <input name="score" type="number" min="0" max="'+(a?.points||100)+'" step="1" required></label>'+
  '<label>Feedback <textarea name="feedback" maxlength="1200" placeholder="Explain the score and how to improve"></textarea></label>'+
  '<button class="lms-button primary">Save feedback</button></form></div>';
 }).join(''):'<p class="lms-muted">No ungraded local submissions.</p>'),'teacher');
}
function lmsTeacherCourse(id){
 const c=lmsCourseData(id);if(!c)return lmsTeacher();
 const moduleRows=c.modules.map(m=>'<div class="lms-teacher-course"><div><b>'+esc(m.title)+'</b><small>'+m.flashcards.length+' flashcards · '+m.practice.length+' practice questions · '+m.exam.questions.length+' exam questions</small></div></div>').join('');
 lmsRender('Edit '+c.title,'Teacher preview · '+c.id,
 '<div class="lms-section-title"><h3>Modules</h3><span>'+c.modules.length+'</span></div>'+moduleRows+
 '<div class="lms-actions"><button data-lms="new-module" data-id="'+esc(id)+'" class="lms-button primary">+ Add lesson and exam</button>'+
 '<button data-lms="new-assignment" data-id="'+esc(id)+'" class="lms-button">+ Add assignment</button>'+
 '<button data-lms="new-announcement" data-id="'+esc(id)+'" class="lms-button">+ Announcement</button>'+
 '<button data-lms="export-course" data-id="'+esc(id)+'" class="lms-button">Export course JSON</button>'+
 '<button data-lms="teacher" class="lms-button">Teacher dashboard</button></div>'+
 '<p class="lms-muted">Changes to a published course are immediately available to local students. Download JSON to move content between devices.</p>','teacher');
}
function lmsForm(title,courseId,form){
 lmsRender(title,courseId?'Teacher preview · '+lmsCourseData(courseId)?.title:'Teacher preview · Local draft editor',
 form+'<div class="lms-actions"><button data-lms="'+(courseId?'teacher-course':'teacher')+'" data-id="'+esc(courseId||'')+'" class="lms-button">Cancel</button></div>','teacher');
}
function lmsNewCourse(){
 lmsForm('Create a course','',
 '<form class="lms-form" id="lms-course-form"><label>Course code<input name="id" required maxlength="31" placeholder="BIO-M1 or MY-SCIENCE"></label>'+
 '<label>Course title<input name="title" required maxlength="120" placeholder="Biology Foundations"></label>'+
 '<label>Subject<input name="subject" required maxlength="70" placeholder="Biology"></label>'+
 '<label>Teacher display name<input name="teacher" maxlength="100" value="LumenVale Teacher"></label>'+
 '<label>Description<textarea name="description" maxlength="700" rows="3" placeholder="What will students learn?"></textarea></label>'+
 '<button type="submit" class="lms-button primary">Create course</button></form>');
}
function lmsNewModule(id){
 const c=lmsCourseData(id);if(!c)return lmsTeacher();
 lmsForm('Add module',id,
 '<form class="lms-form" id="lms-module-form"><input type="hidden" name="course" value="'+esc(id)+'">'+
 '<label>Module title<input name="title" required maxlength="120" placeholder="Cell Structure and Function"></label>'+
 '<label>Lesson reading <textarea name="content" required minlength="30" maxlength="12000" rows="9" placeholder="Write the student lesson (35+ words recommended)..."></textarea></label>'+
 '<label>Learning objectives (one per line)<textarea name="objectives" rows="3" placeholder="Identify the cell membrane&#10;Compare plant and animal cells"></textarea></label>'+
 '<label>Flashcards: term | definition (one per line)<textarea name="flashcards" rows="4" placeholder="Cell | Basic unit of life&#10;Nucleus | Stores most of the DNA"></textarea></label>'+
 '<label>Practice questions: prompt | choice A | choice B | choice C | correct index<textarea name="practice" rows="4" placeholder="Which structure stores DNA? | Nucleus | Membrane | Wall | 0"></textarea></label>'+
 '<label>Exam questions: prompt | choice A | choice B | choice C | correct index<textarea name="exam" rows="5" placeholder="What is a cell? | A tissue | Unit of life | Organ | 1"></textarea></label>'+
 '<div class="lms-two"><label>Exam time (minutes)<input name="minutes" type="number" min="1" max="90" value="15"></label>'+
 '<label>Max attempts<input name="attempts" type="number" min="1" max="5" value="3"></label></div>'+
 '<button class="lms-button primary">Publish module locally</button></form>');
}
function lmsNewAssignment(id){
 lmsForm('Add assignment',id,
 '<form class="lms-form" id="lms-assignment-form"><input name="course" type="hidden" value="'+esc(id)+'">'+
 '<label>Assignment title<input name="title" required maxlength="120"></label>'+
 '<label>Instructions<textarea name="prompt" required maxlength="3000" rows="6" placeholder="Explain what students should submit..."></textarea></label>'+
 '<div class="lms-two"><label>Total points<input name="points" type="number" min="1" max="1000" value="100" required></label>'+
 '<label>Due date (optional)<input name="dueDate" type="date"></label></div>'+
 '<button class="lms-button primary">Create assignment</button></form>');
}
function lmsNewAnnouncement(id){
 lmsForm('New announcement',id,
 '<form class="lms-form" id="lms-announcement-form"><input name="course" type="hidden" value="'+esc(id)+'">'+
 '<label>Title<input name="title" required maxlength="140"></label>'+
 '<label>Message<textarea name="body" required maxlength="3000" rows="6"></textarea></label>'+
 '<button class="lms-button primary">Post announcement</button></form>');
}
function lmsParsePairs(raw,label,max){
 const value=lmsText(raw,12000);if(!value)return[];
 const lines=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(lines.length>max)throw Error(label+' has too many entries.');
 return lines.map((line,i)=>{
  const parts=line.split('|').map(x=>x.trim());
  if(label==='flashcards'){
   if(parts.length!==2||!parts[0]||!parts[1])throw Error('Flashcard line '+(i+1)+' needs term | definition.');
   return {front:parts[0],back:parts[1]};
  }
  const correctIndex=Number(parts.at(-1));
  const q={prompt:parts[0],choices:parts.slice(1,-1),correctIndex};
  return lmsQuestions([q],label,1)[0];
 });
}
function lmsDownload(filename,value){
 const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function lmsAcademicPack(c){
 const catalog=LV_DEFAULT_ACADEMICS.courses.find(x=>x.id===c.id&&x.kind==='academic');
 if(!catalog)throw Error('Use a course ID from Academic Pathways to publish through Verified Teacher Studio.');
 const pack={kind:'lumenvale.academic-pack',version:1,courseId:c.id,title:c.title,author:c.teacher,
  lessons:c.modules.map(m=>({id:m.id,title:m.lesson.title,reading:m.lesson.content,objectives:m.objectives,
   flashcards:m.flashcards,practice:m.practice.map(q=>({prompt:q.prompt,choices:q.choices,correctIndex:q.correctIndex}))})),
  exam:{title:c.title+' · Final Examination',
   questions:c.modules.flatMap(m=>m.exam.questions).slice(0,40).map(q=>({prompt:q.prompt,choices:q.choices,correctIndex:q.correctIndex}))},
  gradePolicy:{passPercent:70}};
 return pathwayValidatePack(pack);
}
function lmsImportPanel(){
 lmsRender('Import teacher content','Load a teacher-created Learning Hub JSON pack or approved academic course code.',
 '<div class="lms-warning"><b>Import is local.</b><p>JSON is checked and saved in this browser. Approved teacher publication codes use the separate Academic Pathways importer.</p></div>'+
 '<div class="lms-form"><label>Learning Hub JSON file (.json, up to 1 MB)<input id="lms-file" type="file" accept=".json,application/json"></label></div>'+
 '<div class="lms-form"><label>Teacher publication code<input id="lms-share-code" maxlength="45" autocomplete="off" placeholder="Paste a teacher-provided code"></label></div>'+
 '<div class="lms-actions">'+lmsC('import-code','Import from Teacher Studio','primary')+lmsC('template','Download JSON example')+
 lmsC('home','Back to dashboard')+'</div>');
}
async function lmsImportCode(){
 const code=document.getElementById('lms-share-code')?.value?.trim()||'';
 if(!/^[A-Za-z0-9_-]{8,45}$/.test(code))return notice('Enter a valid publication code from your teacher.');
 try{
  const response=await fetch(LMS_COURSE_ENDPOINT+encodeURIComponent(code),{cache:'no-store'});
  if(!response.ok)throw Error(response.status===404?'This course is not published.':'The Teacher Studio is unavailable.');
  const raw=await response.json(),count=lmsImportObject(raw);
  notice(count+' teacher course(s) imported.');lmsHome();
 }catch(e){notice('Could not import teacher content: '+(e.message||'Network error')+'. You can still import a JSON file offline.');}
}
function lmsImportObject(raw){
 const items=raw?.kind==='lumenvale.lms-bundle'&&raw.version===1?raw.courses:raw?.kind===LMS_KIND?[raw]:null;
 if(!Array.isArray(items)||!items.length||items.length>30)throw Error('Expected a lumenvale.lms-course or lms-bundle, version 1.');
 const courses=items.map(lmsValidateCourse),ids=new Set(courses.map(c=>c.id));
 if(ids.size!==courses.length)throw Error('Duplicate course IDs in file.');
 const next={...lmsState.courses};
 for(const c of courses)next[c.id]=c;
 if(Object.keys(next).length>80)throw Error('Maximum 80 local courses.');
 lmsState.courses=next;lmsSave();return courses.length;
}
function lmsAddLearner(name){
 const label=lmsText(name,40);if(label.length<2)throw Error('Enter a student name (at least 2 characters).');
 const id='learner-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*999).toString(36);
 if(Object.keys(lmsState.learners).length>=16)throw Error('Maximum 16 local demo learners.');
 lmsState.learners[id]={name:label,enrolled:[],done:{},cards:{},exams:{},submissions:{},practice:{}};
 lmsState.active=id;lmsSave();lmsHome();
}
function lmsNewStudent(){
 lmsRender('New local student','This creates a demo profile in this browser; it is not a secure student account.',
 '<form class="lms-form" id="lms-profile-form"><label>Student nickname<input name="name" required minlength="2" maxlength="40" placeholder="Student 2"></label>'+
 '<button class="lms-button primary">Create local profile</button></form>'+lmsC('home','Cancel'));
}
function lmsTeacherPrompt(){
 const example='Create one original LumenVale school class as strict valid JSON. Schema: kind=lumenvale.lms-course, version=1, id=uppercase course code, title, subject, teacher, description, published=true, modules=[chapters], assignments=[], announcements=[]. Each chapter needs a unique lowercase-hyphen id, title, objectives[], lesson:{title,content (30+ characters)}, flashcards:[{front,back}], practice:[{prompt,choices,correctIndex,explanation}], exam:{title,questions:[{prompt,choices,correctIndex,explanation}],timeLimitMinutes:15,attemptLimit:3}. Every question needs 2–5 choices and a ZERO-BASED correctIndex. Do not add preset careers, labs, student private data, real grades or fabricated sources. Review every answer before publishing. Return JSON only, no Markdown.';
 lmsRender('JSON Course Builder','Teacher content workflow',
 '<p>Download a sample course and adapt it, or use the prompt below to create a draft with an AI assistant. Review all facts and answer keys before using it.</p>'+
 '<textarea readonly class="lms-prompt" rows="7">'+esc(example)+'</textarea>'+
 '<div class="lms-actions">'+lmsC('copy-prompt','Copy prompt')+lmsC('template','Download example JSON')+lmsC('teacher','Back')+'</div>','teacher');
}
function lmsInit(){
 document.addEventListener('click',event=>{
  const el=event.target.closest('[data-lms]');if(!el)return;
  const a=el.dataset.lms,id=el.dataset.id,mid=el.dataset.module;
  if(a==='home')lmsHome();
  else if(a==='teacher')lmsTeacher();
  else if(a==='library')cityBookList();
  else if(a==='import-code')lmsImportCode();
  else if(a==='import')lmsImportPanel();
  else if(a==='course')lmsCourse(id,el.dataset.section||'modules');
  else if(a==='enroll'){
   const c=lmsCourseData(id);if(c?.published&&!lmsLearner().enrolled.includes(id)){lmsLearner().enrolled.push(id);lmsSave();}
   lmsCourse(id);
  }else if(a==='lesson')lmsLesson(id,mid);
  else if(a==='mark'){
   lmsLearner().done[lmsKey(id,mid)]=true;lmsSave();lmsLesson(id,mid);
  }else if(a==='flash')lmsFlash(id,mid);
  else if(a==='flip'&&lmsFlashSession){
   const s=lmsFlashSession;lmsFlash(s.id,s.mid,s.index,!s.flipped);
  }else if((a==='previous-card'||a==='next-card')&&lmsFlashSession){
   const s=lmsFlashSession,m=lmsModule(s.id,s.mid);
   if(a==='next-card'){const key=lmsKey(s.id,s.mid);lmsLearner().cards[key]=(lmsLearner().cards[key]||0)+1;lmsSave();}
   lmsFlash(s.id,s.mid,a==='previous-card'?Math.max(0,s.index-1):Math.min(m.flashcards.length-1,s.index+1));
  }else if(a==='practice')lmsPractice(id,mid);
  else if(a==='practice-answer'&&lmsPracticeSession&&!lmsPracticeSession.reveal){
   const s=lmsPracticeSession,q=lmsModule(s.id,s.mid).practice[s.index];
   if(Number(el.dataset.answer)===q.correctIndex)lmsPractice(s.id,s.mid,s.index,true);
   else notice('Not yet. Review the lesson and try again.');
  }else if(a==='practice-next'&&lmsPracticeSession){
   const s=lmsPracticeSession,m=lmsModule(s.id,s.mid);
   if(s.index+1<m.practice.length)lmsPractice(s.id,s.mid,s.index+1);
   else{lmsLearner().practice[lmsKey(s.id,s.mid)]=true;lmsSave();lmsCourse(s.id);}
  }else if(a==='exam')lmsExamStart(id,mid);
  else if(a==='exam-answer')lmsExamAnswer(el.dataset.answer);
  else if(a==='assignment')lmsAssignment(id,el.dataset.assignment);
  else if(a==='teacher-course')lmsTeacherCourse(id);
  else if(a==='toggle-publish'){
   const c=lmsCourseData(id);if(c){c.published=!c.published;lmsSave();lmsTeacher();}
  }else if(a==='new-course')lmsNewCourse();
  else if(a==='new-module')lmsNewModule(id);
  else if(a==='new-assignment')lmsNewAssignment(id);
  else if(a==='new-announcement')lmsNewAnnouncement(id);
  else if(a==='export-all')lmsDownload('lumenvale-classroom-courses.json',{kind:'lumenvale.lms-bundle',version:1,courses:Object.values(lmsState.courses)});
  else if(a==='export-course'){
   const c=lmsCourseData(id);if(c)lmsDownload(c.id+'-lms-course.json',c);
  }else if(a==='export-academic'){
   try{const pack=lmsAcademicPack(lmsCourseData(id));lmsDownload(id+'-academic-pack.json',pack);notice('Academic pack ready for the verified teacher portal.');}
   catch(e){notice('Cannot export: '+e.message);}
  }else if(a==='new-student')lmsNewStudent();
  else if(a==='template')lmsDownload('lumenvale-lms-example.json',LV_LMS_DEMO);
  else if(a==='prompt')lmsTeacherPrompt();
  else if(a==='copy-prompt'){
   const t=document.querySelector('.lms-prompt')?.value;
   if(t)navigator.clipboard?.writeText(t).then(()=>notice('Prompt copied.')).catch(()=>notice('Select the text and copy it manually.'));
  }
 });
 document.addEventListener('change',async event=>{
  if(event.target.id==='lms-student-picker'){
   const id=event.target.value;if(lmsState.learners[id]){lmsState.active=id;lmsSave();lmsHome();}
  }else if(event.target.id==='lms-file'){
   const file=event.target.files?.[0];if(!file)return;
   try{if(file.size<2||file.size>1024*1024)throw Error('JSON file must be under 1 MB.');
    const count=lmsImportObject(JSON.parse(await file.text()));notice(count+' teacher-created course(s) imported.');lmsHome();}
   catch(e){notice('Import failed: '+e.message);}
  }
 });
 document.addEventListener('submit',event=>{
  const form=event.target,id=form.id;
  if(!['lms-course-form','lms-module-form','lms-assignment-form','lms-announcement-form',
   'lms-profile-form','lms-submission-form'].includes(id)&&!form.matches('.lms-grade-form'))return;
  event.preventDefault();const v=new FormData(form);
  try{
   if(id==='lms-profile-form'){lmsAddLearner(v.get('name'));return;}
   if(id==='lms-course-form'){
    const code=lmsText(v.get('id'),32).toUpperCase();
    if(lmsState.courses[code])throw Error('Course code already exists.');
    const c=lmsValidateCourse({kind:LMS_KIND,version:1,id:code,title:v.get('title'),subject:v.get('subject'),
     teacher:v.get('teacher'),description:v.get('description'),published:false,modules:[],assignments:[],announcements:[]});
    lmsState.courses[c.id]=c;lmsSave();lmsTeacherCourse(c.id);return;
   }
   if(id==='lms-module-form'){
    const cid=lmsText(v.get('course'),32),c=lmsCourseData(cid);
    if(!c)throw Error('Course not found.');
    const title=lmsText(v.get('title'),120),base=lmsSlug(title);let mid=base,n=2;
    while(c.modules.some(m=>m.id===mid)){mid=base+'-'+n++;}
    const qs=lmsParsePairs(v.get('exam'),'Exam',40);
    const m={id:mid,title,objectives:lmsText(v.get('objectives'),1500).split(/\r?\n/).filter(Boolean),
     lesson:{title,content:v.get('content')},flashcards:lmsParsePairs(v.get('flashcards'),'flashcards',60),
     practice:lmsParsePairs(v.get('practice'),'Practice',25),
     exam:{title:title+' Exam',questions:qs,timeLimitMinutes:Number(v.get('minutes')),attemptLimit:Number(v.get('attempts'))}};
    const changed=lmsValidateCourse({...c,modules:[...c.modules,m]});
    lmsState.courses[cid]=changed;lmsSave();lmsTeacherCourse(cid);return;
   }
   if(id==='lms-assignment-form'){
    const cid=lmsText(v.get('course'),32),c=lmsCourseData(cid);if(!c)throw Error('Course not found.');
    const title=lmsText(v.get('title'),120),base=lmsSlug(title);let aid=base,n=2;
    while(c.assignments.some(a=>a.id===aid)){aid=base+'-'+n++;}
    lmsState.courses[cid]=lmsValidateCourse({...c,assignments:[...c.assignments,{
     id:aid,title,prompt:v.get('prompt'),points:Number(v.get('points')),dueDate:v.get('dueDate')}]});
    lmsSave();lmsTeacherCourse(cid);return;
   }
   if(id==='lms-announcement-form'){
    const cid=lmsText(v.get('course'),32),c=lmsCourseData(cid);if(!c)throw Error('Course not found.');
    const title=lmsText(v.get('title'),140);
    lmsState.courses[cid]=lmsValidateCourse({...c,announcements:[...c.announcements,{
     id:lmsSlug(title)+'-'+Date.now().toString(36),title,body:v.get('body'),date:new Date().toISOString().slice(0,10)}]});
    lmsSave();lmsTeacherCourse(cid);return;
   }
   if(id==='lms-submission-form'){
    const cid=lmsText(v.get('course'),32),aid=lmsText(v.get('assignment'),46),answer=lmsText(v.get('answer'),5000);
    const c=lmsCourseData(cid),a=c?.assignments.find(a=>a.id===aid);
    if(!a||!lmsLearner().enrolled.includes(cid)||answer.length<15)throw Error('Enroll and write at least 15 characters.');
    const key=lmsKey(cid,aid),old=lmsLearner().submissions[key];
    if(old?.points!=null)throw Error('Teacher already graded this submission.');
    lmsLearner().submissions[key]={answer,submittedAt:new Date().toISOString(),points:null,feedback:''};
    lmsSave();lmsCourse(cid,'assignments');notice('Assignment submitted for local teacher review.');return;
   }
   if(form.matches('.lms-grade-form')){
    const student=lmsState.learners[lmsText(v.get('student'),65)],cid=lmsText(v.get('course'),32),aid=lmsText(v.get('assignment'),46);
    const c=lmsCourseData(cid),a=c?.assignments.find(x=>x.id===aid),sub=student?.submissions[lmsKey(cid,aid)],score=Number(v.get('score'));
    if(!a||!sub||!Number.isInteger(score)||score<0||score>a.points)throw Error('Enter a valid score within the assignment points.');
    sub.points=score;sub.feedback=lmsText(v.get('feedback'),1200);sub.gradedAt=new Date().toISOString();
    lmsSave();lmsTeacher();notice('Local grading feedback saved.');return;
   }
  }catch(e){notice(e.message||'Could not save this item.');}
 });
}

