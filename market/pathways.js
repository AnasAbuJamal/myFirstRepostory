/* LumenVale Academic Pathways — JSON-defined school and college-inspired curricula.
 * Formal grades/recitation verification require a future authenticated roster sync.
 * Student offline packs and grades are always labeled PRACTICE / UNVERIFIED.
 */
const PATHWAYS_KEY='lumenvale-academic-v1';
const PATHWAYS_TYPES={catalog:'lumenvale.catalog',pack:'lumenvale.academic-pack',quran:'lumenvale.quran-plan',exam:'lumenvale.exam-pack',cards:'lumenvale.flashcard-pack'};
function pathwayInitial(){return {version:1,goal:'biology',ageBand:'10-13',enrolled:[],packs:{},quranPlans:{},study:{},scores:{},recitations:{},history:[],flashcardReviews:{},importNames:[]};}
function pathwayString(value,max=500){return String(value??'').trim().slice(0,max);}
function pathwayValidateQuestions(list,name,limits={min:2,max:30}){
 if(!Array.isArray(list)||list.length<limits.min||list.length>limits.max)throw Error(name+' needs '+limits.min+'–'+limits.max+' questions.');
 return list.map((q,i)=>{
  const prompt=pathwayString(q?.prompt,700);
  const choices=Array.isArray(q?.choices)?q.choices.map(c=>pathwayString(c,250)):[];
  const correctIndex=Number(q?.correctIndex);
  if(prompt.length<9||choices.length<2||choices.length>5||choices.some(c=>!c)||
    !Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=choices.length)
   throw Error(name+' question '+(i+1)+' must contain valid choices and correctIndex.');
  return {prompt,choices,correctIndex};
 });
}
function pathwayValidatePack(raw){
 if(!raw||raw.kind!==PATHWAYS_TYPES.pack||raw.version!==1)throw Error('Expected lumenvale.academic-pack JSON, version 1.');
 const courseId=pathwayString(raw.courseId,35);
 const course=LV_DEFAULT_ACADEMICS.courses.find(c=>c.id===courseId);
 if(!course||course.kind==='teacher-recitation')throw Error('Unknown academic course or recitation requires a Qur’an plan.');
 if(!Array.isArray(raw.lessons)||raw.lessons.length<1||raw.lessons.length>16)throw Error('An academic pack requires 1–16 lessons.');
 const lessons=raw.lessons.map((l,i)=>{
  const id=pathwayString(l?.id,45),title=pathwayString(l?.title,130),reading=pathwayString(l?.reading,11000);
  if(!/^[a-zA-Z0-9_-]{3,45}$/.test(id)||title.length<3||reading.split(/\s+/).length<35)
   throw Error('Lesson '+(i+1)+' needs a unique ID, title, and 35+ words of reading.');
  const objectives=Array.isArray(l.objectives)?l.objectives.slice(0,7).map(x=>pathwayString(x,180)).filter(Boolean):[];
  const flashcards=Array.isArray(l.flashcards)?l.flashcards.slice(0,50).map(f=>{
   const front=pathwayString(f?.front,180),back=pathwayString(f?.back,600);
   if(!front||!back)throw Error('Flashcard must have front and back text.');
   return {front,back};
  }):[];
  const practice=l.practice?pathwayValidateQuestions(l.practice,'Practice', {min:1,max:20}):[];
  return {id,title,reading,objectives,flashcards,practice};
 });
 if(new Set(lessons.map(x=>x.id)).size!==lessons.length)throw Error('Duplicate lesson IDs.');
 const exam=pathwayValidateQuestions(raw.exam?.questions,'Final examination',{min:3,max:40});
 const passPercent=Math.max(60,Math.min(100,Number(raw.gradePolicy?.passPercent)||70));
 return {kind:PATHWAYS_TYPES.pack,version:1,courseId,title:pathwayString(raw.title,160)||course.title,
  author:pathwayString(raw.author,100)||'Teacher materials',lessons,
  exam:{title:pathwayString(raw.exam?.title,150)||'Final examination',questions:exam},
  gradePolicy:{passPercent},source:pathwayString(raw.source,300),publishedAt:pathwayString(raw.publishedAt,40)};
}
function pathwayValidateExam(raw){
 const courseId=pathwayString(raw.courseId,35),course=pathwayCourse(courseId);
 if(!course||course.kind==='teacher-recitation')throw Error('Exam pack has an unknown academic course.');
 const exam=pathwayValidateQuestions(raw.exam?.questions,'Exam',{min:3,max:40});
 return {kind:PATHWAYS_TYPES.exam,version:1,courseId,title:pathwayString(raw.title,130)||'Exam Pack',
  exam:{title:pathwayString(raw.exam?.title,150)||'Final exam',questions:exam},
  gradePolicy:{passPercent:Math.max(60,Math.min(100,Number(raw.gradePolicy?.passPercent)||70))}};
}
function pathwayValidateCards(raw){
 const courseId=pathwayString(raw.courseId,35),course=pathwayCourse(courseId);
 if(!course||course.kind==='teacher-recitation')throw Error('Flashcard pack has an unknown academic course.');
 const lessonId=pathwayString(raw.lessonId,45);
 if(!/^[a-zA-Z0-9_-]{3,45}$/.test(lessonId))throw Error('Choose an existing lessonId.');
 if(!Array.isArray(raw.flashcards)||!raw.flashcards.length||raw.flashcards.length>60)
  throw Error('Flashcard pack requires 1–60 cards.');
 const flashcards=raw.flashcards.map(card=>{
  const front=pathwayString(card?.front,180),back=pathwayString(card?.back,600);
  if(!front||!back)throw Error('Each card needs front and back text.');
  return {front,back};
 });
 return {kind:PATHWAYS_TYPES.cards,version:1,courseId,lessonId,
  title:pathwayString(raw.title,130)||'Flashcard Practice',flashcards};
}
function pathwayValidateQuran(raw){
 if(!raw||raw.kind!==PATHWAYS_TYPES.quran||raw.version!==1)throw Error('Expected lumenvale.quran-plan JSON, version 1.');
 const courseId=pathwayString(raw.courseId,40);
 const course=LV_DEFAULT_ACADEMICS.courses.find(c=>c.id===courseId&&c.kind==='teacher-recitation');
 if(!course)throw Error('Qur’an plan must target a valid memorization course.');
 if(!Array.isArray(raw.targets)||raw.targets.length<1||raw.targets.length>30)throw Error('A memorization plan needs 1–30 targets.');
 const targets=raw.targets.map((t,i)=>{
  const surah=pathwayString(t.surah,100),verses=pathwayString(t.verses,60),notes=pathwayString(t.notes,300);
  if(!surah||!verses)throw Error('Target '+(i+1)+' needs surah and verse range.');
  return {surah,verses,notes};
 });
 return {kind:PATHWAYS_TYPES.quran,version:1,courseId,title:pathwayString(raw.title,130)||course.title,
  teacher:pathwayString(raw.teacher,100)||'Qur’an teacher',targets,recitationMode:'teacher-live',teacherApprovalRequired:true};
}
function pathwayRestore(raw){
 const state=pathwayInitial();
 if(!raw||raw.version!==1)return state;
 if(LV_DEFAULT_ACADEMICS.programs.some(p=>p.id===raw.goal))state.goal=raw.goal;
 if(['10-13','14-17','18+'].includes(raw.ageBand))state.ageBand=raw.ageBand;
 if(Array.isArray(raw.enrolled))state.enrolled=[...new Set(raw.enrolled.filter(id=>LV_DEFAULT_ACADEMICS.courses.some(c=>c.id===id)))].slice(0,30);
 if(raw.packs&&typeof raw.packs==='object')for(const id of Object.keys(raw.packs).slice(0,30)){
  try{const pack=pathwayValidatePack(raw.packs[id]);if(pack.courseId===id)state.packs[id]=pack;}catch{}
 }
 if(raw.quranPlans&&typeof raw.quranPlans==='object')for(const id of Object.keys(raw.quranPlans).slice(0,6)){
  try{const plan=pathwayValidateQuran(raw.quranPlans[id]);if(plan.courseId===id)state.quranPlans[id]=plan;}catch{}
 }
 if(raw.study&&typeof raw.study==='object')for(const [id,list] of Object.entries(raw.study)){
  const pack=state.packs[id];
  if(pack&&Array.isArray(list))state.study[id]=list.filter(x=>pack.lessons.some(l=>l.id===x)).slice(0,16);
 }
 if(raw.recitations&&typeof raw.recitations==='object'){
  for(const id of ['QUR-M1','QUR-H1']){
   const review=raw.recitations[id];
   if(review&&review.verified===true)state.recitations[id]={
    verified:true,complete:review.complete===true,
    verifiedAt:pathwayString(review.verifiedAt,40)
   };
  }
 }
 if(raw.scores&&typeof raw.scores==='object')for(const [id,score] of Object.entries(raw.scores)){
  if(state.packs[id]&&Number.isFinite(score)&&score>=0&&score<=100)state.scores[id]=Math.round(score);
 }
 if(Array.isArray(raw.history))state.history=raw.history.filter(h=>LV_DEFAULT_ACADEMICS.courses.some(c=>c.id===h?.courseId)&&
  Number.isFinite(h?.percent)&&h.percent>=0&&h.percent<=100).slice(-100).map(h=>({
   courseId:h.courseId,percent:Math.round(h.percent),date:pathwayString(h.date,40),source:'local-practice'
  }));
 if(raw.flashcardReviews&&typeof raw.flashcardReviews==='object'){
  for(const [id,count] of Object.entries(raw.flashcardReviews))if(/^[a-zA-Z0-9_-]{3,70}$/.test(id)&&
   Number.isInteger(count)&&count>=0&&count<=1000)state.flashcardReviews[id]=count;
 }
 return state;
}
function pathwayLoad(){try{return pathwayRestore(JSON.parse(localStorage.getItem(PATHWAYS_KEY)));}catch{return pathwayInitial();}}
var pathwayState=pathwayLoad(),pathwaySession=null;
function pathwaySave(){try{if(!trial)localStorage.setItem(PATHWAYS_KEY,JSON.stringify(pathwayState));}catch{notice('Academic progress could not be saved in this browser.');}}
function pathwayCourse(id){return LV_DEFAULT_ACADEMICS.courses.find(c=>c.id===id);}
function pathwayGoal(){return LV_DEFAULT_ACADEMICS.programs.find(p=>p.id===pathwayState.goal)||LV_DEFAULT_ACADEMICS.programs[0];}
function pathwayStage(id){return LV_DEFAULT_ACADEMICS.stages.find(s=>s.id===id);}
function pathwayPassed(id){
 const course=pathwayCourse(id);if(!course)return false;
 if(course.kind==='teacher-recitation')return pathwayState.recitations[id]?.verified===true&&pathwayState.recitations[id]?.complete===true;
 const percent=pathwayState.scores[id],policy=pathwayState.packs[id]?.gradePolicy;
 return typeof percent==='number'&&percent>=(policy?.passPercent||70);
}
function pathwayPrereqs(course){
 return course.prerequisites.filter(id=>!pathwayPassed(id));
}
function pathwayTierOpen(id){
 if(id==='middle')return true;
 if(id==='high')return pathwayStage('middle').required.every(pathwayPassed);
 if(id==='university')return pathwayTierOpen('high')&&pathwayStage('high').required.every(pathwayPassed);
 return false;
}
function pathwayGPA(){
 let weighted=0,credits=0,passed=0;
 for(const c of LV_DEFAULT_ACADEMICS.courses){
  const score=pathwayState.scores[c.id];
  if(typeof score!=='number')continue;
  const points=score>=90?4:score>=80?3:score>=70?2:score>=60?1:0;
  weighted+=c.credits*points;credits+=c.credits;
  if(pathwayPassed(c.id))passed+=c.credits;
 }
 return {gpa:credits?weighted/credits:null,attempted:credits,passed};
}
function pathwayStatus(id){
 const c=pathwayCourse(id);if(!c)return {name:'Unknown',locked:true};
 const quran=c.kind==='teacher-recitation',unmet=pathwayPrereqs(c);
 const locked=!pathwayTierOpen(c.stage)||unmet.length>0;
 const score=pathwayState.scores[id];
 return {locked,quran,unmet,score,passed:pathwayPassed(id),
  content:Boolean(quran?pathwayState.quranPlans[id]:pathwayState.packs[id])};
}
function pathwayHome(){
 const g=pathwayGoal(),record=pathwayGPA();
 const programs=LV_DEFAULT_ACADEMICS.programs.map(p=>
  '<button class="pathway-goal '+(pathwayState.goal===p.id?'selected':'')+'" type="button" data-pathways="goal" data-id="'+esc(p.id)+'">'+
  '<strong>'+esc(p.name)+'</strong><small>'+esc(p.description)+'</small></button>').join('');
 const groups=LV_DEFAULT_ACADEMICS.stages.map(stage=>{
  const open=pathwayTierOpen(stage.id);
  const complete=stage.required.filter(pathwayPassed).length;
  return '<section class="pathway-stage"><header><h3>'+esc(stage.name)+'</h3>'+
   '<small>'+ (open?'Available':'Requires previous stage')+' · '+complete+'/'+stage.required.length+' required subjects passed</small></header>'+
   '<div class="pathway-course-grid">'+LV_DEFAULT_ACADEMICS.courses.filter(c=>c.stage===stage.id).map(c=>{
    const status=pathwayStatus(c.id);
    const included=stage.id!=='university'||g.required.includes(c.id);
    return '<button class="pathway-course '+(status.locked?'locked':'')+'" data-pathways="course" data-id="'+esc(c.id)+'">'+
     '<strong>'+esc(c.title)+'</strong><small>'+esc(c.id)+' · '+c.credits+' game credits'+(included?' · Required for selected pathway':' · Optional')+'</small>'+
     '<span>'+(status.quran?(status.passed?'✓ Verified by teacher':'Teacher recitation'):status.passed?'✓ Passed · '+status.score+'%':
       status.score!=null?'Exam '+status.score+'%':status.locked?'Locked':pathwayState.enrolled.includes(c.id)?'Enrolled · Awaiting content / exam':'Ready for enrollment')+'</span></button>';
   }).join('')+'</div></section>';
 }).join('');
 cityPanel('LumenVale Academy / Pathways','Choose your academic future',
 '<p>Explore Biology, Biochemistry, or Biomedical Engineering from middle-school foundations onward. This is an in-game program inspired by real universities; it grants no real school credit.</p>'+
 '<div class="pathway-summary"><div><small>Goal</small><strong>'+esc(g.name)+'</strong></div>'+
 '<div><small>Practice GPA</small><strong>'+(record.gpa===null?'—':record.gpa.toFixed(2))+'</strong></div>'+
 '<div><small>Game credits earned</small><strong>'+record.passed+'</strong></div></div>'+
 '<label class="pathway-age-label">Learning age group <select id="pathway-age">'+
 ['10-13','14-17','18+'].map(x=>'<option value="'+x+'" '+(pathwayState.ageBand===x?'selected':'')+'>'+x+' years</option>').join('')+
 '</select></label><p class="city-sub">Age group helps suggest a starting level; it does not waive prerequisite subjects. A teacher can review placement later.</p>'+
 '<h3>Choose a future specialization</h3><div class="pathway-goals">'+programs+'</div>'+
 '<div class="city-actions"><button class="button primary" data-pathways="transcript">Academic Transcript</button>'+
 '<button class="button" data-pathways="import">Import Teacher JSON</button>'+
 '<button class="button" data-pathways="quran">Qur’an Memorization</button><button class="button" data-pathways="foundation-practice">Optional Practice Classes</button></div>'+groups+
 '<p class="city-sub">Middle and high school progression requires teacher-verified Qur’an recitation. A private one-time teacher approval code can synchronize the verified result and game points; ordinary grades remain local practice records.</p>');
}
function pathwayCoursePanel(id){
 const c=pathwayCourse(id);if(!c)return;
 const s=pathwayStatus(id),quran=s.quran;
 const pack=pathwayState.packs[id];
 const back='<button type="button" class="button" data-pathways="home">Back to pathways</button>';
 let html='<p>'+esc(c.subject)+' · '+c.credits+' simulated course credits · '+esc(pathwayStage(c.stage).name)+'</p>'+
 (!pathwayState.enrolled.includes(id)&&!s.locked?
 '<button type="button" class="button primary" data-pathways="enroll" data-id="'+esc(id)+'">Enroll in this course</button>':
 pathwayState.enrolled.includes(id)?'<p class="pathway-enrolled">✓ Enrolled in this course</p>':'')+
 '<p><strong>Prerequisites:</strong> '+(c.prerequisites.length?c.prerequisites.map(x=>esc(pathwayCourse(x)?.title||x)).join(', '):'None')+'</p>';
 if(s.locked)html+='<p class="pathway-alert">This course is locked until you pass the earlier stage and all prerequisites. You can still view its goals.</p>';
 if(quran){
  html+='<p>Memorization is assessed by a real teacher during a live recitation. No automated grading or unverified local coins are awarded.</p>'+
  (pathwayState.quranPlans[id]?
   '<div class="pathway-units">'+pathwayState.quranPlans[id].targets.map(t=>
    '<div><strong>'+esc(t.surah)+' · '+esc(t.verses)+'</strong><p>'+esc(t.notes)+'</p></div>').join('')+'</div>':
    '<p class="pathway-alert">Awaiting your teacher’s memorization targets.</p>')+
   '<p class="city-sub">Teacher evaluation: '+
   (pathwayState.recitations[id]?.complete?'Verified complete':
     pathwayState.recitations[id]?.verified?'Recitation verified; course still in progress':'Awaiting teacher')+
   '. Your instructor verifies memorization, tajweed, pronunciation, and fluency in Teacher Studio.</p>';
 }else if(!pack){
  html+='<p class="pathway-alert">The syllabus is ready, but your teacher has not imported reading material and exams for this course.</p>'+
   '<p>Teachers can create and publish a compatible JSON course pack. You can import one for local practice, but it is not an authenticated official grade.</p>';
 }else{
  const reviewed=pathwayState.study[id]||[];
  html+='<p><strong>Materials:</strong> '+esc(pack.title)+' · '+esc(pack.author)+'</p>'+
  '<div class="pathway-units">'+pack.lessons.map(l=>
   '<div><span>'+(reviewed.includes(l.id)?'✓':'○')+' '+esc(l.title)+'</span>'+
   '<button class="button" data-pathways="lesson" data-id="'+esc(id)+'" data-unit="'+esc(l.id)+'">'+
   (reviewed.includes(l.id)?'Review':'Study')+'</button></div>').join('')+'</div>'+
  '<p><strong>Lessons studied:</strong> '+reviewed.length+'/'+pack.lessons.length+'</p>'+
  '<button class="button primary" data-pathways="exam" data-id="'+esc(id)+'" '+
  (s.locked||!pathwayState.enrolled.includes(id)||reviewed.length!==pack.lessons.length?'disabled':'')+
  '>Take graded practice exam</button>'+
  (s.score!=null?'<p>Most recent local exam: '+s.score+'% · '+(s.passed?'Pass':'Review and retry')+'</p>':'');
 }
 cityPanel('Academic Course / '+esc(c.id),esc(c.title),html+
 '<div class="city-actions">'+back+'<button class="button" data-pathways="transcript">Transcript</button></div>');
}
function pathwayEnroll(id){
 const course=pathwayCourse(id);
 if(!course||pathwayStatus(id).locked)return;
 if(!pathwayState.enrolled.includes(id))pathwayState.enrolled.push(id);
 pathwaySave();pathwayCoursePanel(id);notice('Enrolled in '+course.title+'.');
}
function pathwayStudy(id,unit){
 const pack=pathwayState.packs[id],lesson=pack?.lessons.find(l=>l.id===unit);
 if(!lesson||pathwayStatus(id).locked||!pathwayState.enrolled.includes(id))return;
 pathwaySession={kind:'reading',courseId:id,unit,started:Date.now(),card:0};
 cityPanel('Course / '+esc(id),esc(lesson.title),
 '<div class="pathway-reading"><h4>Learning objectives</h4><p>'+esc(lesson.objectives.join(' • ')||'Understand the reading and complete practice.')+'</p>'+
 '<article>'+esc(lesson.reading)+'</article></div>'+
 '<div class="city-actions"><button class="button primary" data-pathways="studied" data-id="'+esc(id)+'" data-unit="'+esc(unit)+'">Mark lesson studied</button>'+
 (lesson.flashcards.length?'<button class="button" data-pathways="cards" data-id="'+esc(id)+'" data-unit="'+esc(unit)+'">Practice flashcards</button>':'')+
 (lesson.practice.length?'<button class="button" data-pathways="practice" data-id="'+esc(id)+'" data-unit="'+esc(unit)+'">Practice questions</button>':'')+
 '<button class="button" data-pathways="course" data-id="'+esc(id)+'">Back</button></div>');
}
function pathwayMarkStudied(id,unit){
 const lesson=pathwayState.packs[id]?.lessons.find(l=>l.id===unit);
 if(!lesson||pathwaySession?.kind!=='reading'||pathwaySession.courseId!==id||pathwaySession.unit!==unit)return;
 if(Date.now()-pathwaySession.started<10000){notice('Read the lesson for a few more seconds first.');return;}
 const list=pathwayState.study[id]||(pathwayState.study[id]=[]);
 if(!list.includes(unit))list.push(unit);
 pathwaySave();pathwayCoursePanel(id);
}
function pathwayCards(id,unit,idx=0,flip=false){
 const lesson=pathwayState.packs[id]?.lessons.find(x=>x.id===unit);
 const cards=lesson?.flashcards;
 if(!cards?.length)return;
 const i=((Number(idx)||0)%cards.length+cards.length)%cards.length;
 pathwaySession={kind:'cards',courseId:id,unit,index:i,flipped:flip};
 const card=cards[i];
 cityPanel('Flashcard Practice / '+esc(id),esc(lesson.title),
 '<p>Card '+(i+1)+' of '+cards.length+' · Flip the card and review the explanation.</p>'+
 '<button type="button" class="pathway-flashcard" data-pathways="flip">'+
 '<small>'+(flip?'ANSWER / EXPLANATION':'TERM / QUESTION')+'</small><strong>'+
 esc(flip?card.back:card.front)+'</strong><span>Click to flip</span></button>'+
 '<div class="city-actions"><button class="button" data-pathways="previous-card">Previous</button>'+
 '<button class="button primary" data-pathways="next-card">Next / Reviewed</button>'+
 '<button class="button" data-pathways="course" data-id="'+esc(id)+'">Back to course</button></div>');
}
function pathwayPractice(id,unit){
 const lesson=pathwayState.packs[id]?.lessons.find(x=>x.id===unit);
 if(!lesson?.practice?.length||pathwayStatus(id).locked||!pathwayState.enrolled.includes(id))return;
 pathwaySession={kind:'practice',courseId:id,unit,index:0,correct:0};
 pathwayPracticeQuestion();
}
function pathwayPracticeQuestion(){
 const session=pathwaySession;if(session?.kind!=='practice')return;
 const lesson=pathwayState.packs[session.courseId]?.lessons.find(x=>x.id===session.unit);
 const q=lesson?.practice?.[session.index];if(!q)return;
 cityPanel('Academic Practice / '+esc(session.courseId),esc(lesson.title),
 '<p>Practice question '+(session.index+1)+' of '+lesson.practice.length+' — mistakes do not affect GPA.</p>'+
 '<h3>'+esc(q.prompt)+'</h3>'+q.choices.map((text,i)=>
 '<button type="button" class="city-answer" data-pathways="practice-answer" data-answer="'+i+'"><span>'+
 String.fromCharCode(65+i)+'</span>'+esc(text)+'</button>').join('')+
 '<button class="button" data-pathways="lesson" data-id="'+esc(session.courseId)+'" data-unit="'+esc(session.unit)+'">Review reading</button>');
}
function pathwayPracticeAnswer(answer){
 const session=pathwaySession;if(session?.kind!=='practice')return;
 const lesson=pathwayState.packs[session.courseId]?.lessons.find(x=>x.id===session.unit);
 const q=lesson?.practice?.[session.index];if(!q)return;
 if(Number(answer)!==q.correctIndex){notice('Not quite. Review the lesson and try another answer.');return;}
 session.correct++;session.index++;
 if(session.index<lesson.practice.length){pathwayPracticeQuestion();return;}
 const id=session.courseId,unit=session.unit;
 pathwaySession=null;
 cityPanel('Academic Practice','Practice complete',
 '<p>All '+lesson.practice.length+' practice questions are now correct. No GPA or official grades were changed.</p>'+
 '<button class="button primary" data-pathways="course" data-id="'+esc(id)+'">Back to course</button>'+
 '<button class="button" data-pathways="lesson" data-id="'+esc(id)+'" data-unit="'+esc(unit)+'">Review lesson</button>');
}
function pathwayExam(id){
 const pack=pathwayState.packs[id];
 if(!pack||pathwayStatus(id).locked||!pathwayState.enrolled.includes(id)|| (pathwayState.study[id]||[]).length!==pack.lessons.length)return;
 pathwaySession={kind:'exam',courseId:id,index:0,correct:0,started:Date.now()};
 pathwayExamQuestion();
}
function pathwayExamQuestion(){
 const s=pathwaySession;
 if(!s||s.kind!=='exam')return;
 const pack=pathwayState.packs[s.courseId],q=pack.exam.questions[s.index];
 cityPanel('Academic Exam / '+esc(s.courseId),esc(pack.exam.title),
 '<p>Question '+(s.index+1)+' of '+pack.exam.questions.length+' · This answer is final.</p>'+
 '<h3>'+esc(q.prompt)+'</h3>'+q.choices.map((x,i)=>
 '<button class="city-answer" data-pathways="answer" data-answer="'+i+'"><span>'+
 String.fromCharCode(65+i)+'</span>'+esc(x)+'</button>').join(''));
}
function pathwayExamAnswer(answer){
 const s=pathwaySession;if(s?.kind!=='exam')return;
 const pack=pathwayState.packs[s.courseId],q=pack?.exam.questions[s.index];
 if(!q)return;
 if(Number(answer)===q.correctIndex)s.correct++;
 s.index++;
 if(s.index<pack.exam.questions.length){pathwayExamQuestion();return;}
 const score=Math.round(100*s.correct/pack.exam.questions.length),id=s.courseId;
 pathwayState.scores[id]=score;
 pathwayState.history.push({courseId:id,percent:score,date:new Date().toISOString(),source:'local-practice'});
 pathwayState.history=pathwayState.history.slice(-100);
 pathwaySession=null;pathwaySave();
 // Deliberately no city coin payment for unverified school exams.
 const g=pathwayGPA();
 cityPanel('Academic Transcript / Local Practice','Exam result recorded',
 '<div class="wave-exam-result"><b>'+score+'%</b><span>'+ (pathwayPassed(id)?'Passed':'Not passed')+
 '</span></div><p>This grade is saved locally for learning and is not teacher-verified.</p>'+
 '<p>Practice GPA: '+(g.gpa===null?'—':g.gpa.toFixed(2))+'</p>'+
 '<div class="city-actions"><button class="button primary" data-pathways="transcript">View transcript</button>'+
 '<button class="button" data-pathways="course" data-id="'+esc(id)+'">Course</button></div>');
}
function pathwayTranscript(){
 const g=pathwayGPA(),goal=pathwayGoal();
 const rows=LV_DEFAULT_ACADEMICS.courses.filter(c=>pathwayState.scores[c.id]!=null).map(c=>{
  const percent=pathwayState.scores[c.id];
  return '<tr><td>'+esc(c.id)+'</td><td>'+esc(c.title)+'</td><td>'+c.credits+'</td><td>'+percent+'%</td>'+
   '<td>'+(pathwayPassed(c.id)?'Pass':'Not passed')+'</td></tr>';
 }).join('');
 cityPanel('LumenVale Academy / Records','Academic Transcript',
 '<p><strong>Pathway:</strong> '+esc(goal.name)+'</p>'+
 '<div class="pathway-summary"><div><small>Practice GPA</small><strong>'+(g.gpa===null?'—':g.gpa.toFixed(2))+'</strong></div>'+
 '<div><small>Attempted credits</small><strong>'+g.attempted+'</strong></div>'+
 '<div><small>Passing credits</small><strong>'+g.passed+'</strong></div></div>'+
 '<div class="pathway-scroll"><table class="pathway-transcript"><thead><tr><th>Code</th><th>Course</th><th>Credits</th><th>Grade</th><th>Status</th></tr></thead>'+
 '<tbody>'+(rows||'<tr><td colspan="5">No exam results yet.</td></tr>')+'</tbody></table></div>'+
 '<p class="pathway-alert">UNVERIFIED GAME RECORD — This is not an accredited transcript or a school-issued document. Teacher-approved official results and Qur’an evaluations will require a secure student connection.</p>'+
 '<div class="city-actions"><button class="button primary" data-pathways="export">Export practice transcript JSON</button>'+
 '<button class="button" data-pathways="home">Back to pathways</button></div>');
}
function pathwayQuran(){
 const courses=LV_DEFAULT_ACADEMICS.courses.filter(x=>x.kind==='teacher-recitation');
 cityPanel('LumenVale Academy','Qur’an Memorization',
 '<p>Recite to your real teacher, in person or during an approved live session. Only your teacher can mark memorization, tajweed, pronunciation, and fluency as passed and award approved game points.</p>'+
 '<div class="pathway-units">'+courses.map(c=>'<div><div><strong>'+esc(c.title)+'</strong><small>'+
 (pathwayState.quranPlans[c.id]?esc(pathwayState.quranPlans[c.id].targets.length+' memorization target(s)'):'Awaiting teacher plan')+
 '</small></div><button class="button" data-pathways="course" data-id="'+esc(c.id)+'">View</button></div>').join('')+'</div>'+
 '<p class="pathway-alert">Recite to your teacher first. Ask the teacher for the private, one-time approval code after they have evaluated your recitation.</p>'+
 '<form id="pathway-redeem-form" class="pathway-import"><label>Your private classroom code<input name="studentCode" minlength="3" maxlength="40" autocomplete="off" required placeholder="Classroom code from teacher"/></label><label>Teacher recitation approval code<input name="code" minlength="20" maxlength="48" required placeholder="Paste your teacher’s approval code" autocomplete="off"/></label>'+
 '<button type="submit" class="button primary">Verify recitation & claim points</button></form>'+
 '<button class="button" data-pathways="home">Back to pathways</button>');
}
async function pathwayRedeemRecitation(code,studentCode){
 const value=pathwayString(code,48),student=pathwayString(studentCode,40);
 if(student.length<3){notice('Enter your private classroom code.');return;}
 if(!/^[A-Za-z0-9_-]{20,48}$/.test(value)){notice('Enter the complete teacher approval code.');return;}
 try{
  const response=await fetch('https://lumenvale-teachers.vercel.app/api/recitation/redeem',{
   method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({code:value,studentCode:student})
  });
  const result=await response.json();
  if(!response.ok)throw Error(result?.error||'Unable to verify recitation.');
  const id=result?.courseId;
  if(!['QUR-M1','QUR-H1'].includes(id)||result?.verified!==true)throw Error('Invalid verification response.');
  const previouslyCompleted=Boolean(pathwayState.recitations[id]?.complete);
  pathwayState.recitations[id]={verified:true,complete:previouslyCompleted||Boolean(result.courseComplete),
   verifiedAt:new Date().toISOString()};
  pathwaySave();
  const coins=Math.max(0,Math.min(100,Number(result.coins)||0));
  if(coins)cityEarn(coins,8);
  notice('Teacher recitation verified! +'+coins+' coins.');
  pathwayQuran();
 }catch(error){notice(error.message||'Teacher verification is unavailable.');}
}
function pathwayImportPanel(){
 cityPanel('Academic Pathways / Content','Teacher JSON Import',
 '<p>Import a teacher-created JSON file for academic reading, practice exams, flashcards, or Qur’an memorization targets. This is offline practice; it does not authenticate the teacher or issue official academic credit.</p>'+
 '<div class="pathway-import"><label>Choose a JSON pack<input id="pathway-import-file" type="file" accept=".json,application/json"></label>'+
 '<form id="pathway-code-form"><label>Or enter a teacher publication code<input name="code" minlength="8" maxlength="45" placeholder="Teacher publication code" required></label>'+
 '<button class="button primary" type="submit">Import published course</button></form></div>'+
 '<p class="city-sub">Your teacher can generate JSON from the Teacher Studio, then export it or share a publication code. You can also import the example pack for practice.</p>'+
 '<button class="button" data-pathways="home">Back to pathways</button>');
}
function pathwayImportObject(input,name='Teacher JSON'){
 const records=Array.isArray(input)?input:Array.isArray(input?.packs)?input.packs:[input];
 if(records.length<1||records.length>25)throw Error('Import 1–25 academic packs at a time.');
 const parsed=records.map(item=>{
  if(item?.version!==1)throw Error('All packs must use version 1.');
  if(item.kind===PATHWAYS_TYPES.quran)return pathwayValidateQuran(item);
  if(item.kind===PATHWAYS_TYPES.exam)return pathwayValidateExam(item);
  if(item.kind===PATHWAYS_TYPES.cards)return pathwayValidateCards(item);
  return pathwayValidatePack(item);
 });
 const nextPacks=JSON.parse(JSON.stringify(pathwayState.packs)),nextPlans={...pathwayState.quranPlans},reset=new Set();
 // Base course files are processed first, even if the JSON bundle lists exam/cards before them.
 for(const item of parsed.filter(x=>x.kind===PATHWAYS_TYPES.pack)){
  if(!nextPacks[item.courseId]||JSON.stringify(nextPacks[item.courseId])!==JSON.stringify(item))
   reset.add(item.courseId);
  nextPacks[item.courseId]=item;
 }
 for(const item of parsed){
  if(item.kind===PATHWAYS_TYPES.quran){nextPlans[item.courseId]=item;continue;}
  if(item.kind===PATHWAYS_TYPES.pack)continue;
  const base=nextPacks[item.courseId];
  if(!base)throw Error('Import a full lesson pack for '+item.courseId+' before separate exams or flashcards.');
  if(item.kind===PATHWAYS_TYPES.exam){
   base.exam=item.exam;base.gradePolicy=item.gradePolicy;
   reset.add(item.courseId);
  }else{
   const lesson=base.lessons.find(l=>l.id===item.lessonId);
   if(!lesson)throw Error('Flashcard pack refers to a missing lesson: '+item.lessonId);
   lesson.flashcards=item.flashcards;
  }
 }
 pathwayState.packs=nextPacks;pathwayState.quranPlans=nextPlans;
 for(const id of reset){delete pathwayState.study[id];delete pathwayState.scores[id];}
 pathwayState.importNames=[...new Set([name,...pathwayState.importNames])].slice(0,15);
 pathwaySave();return parsed.length;
}
async function pathwayImportFile(file){
 if(!file||file.size<2||file.size>1024*1024)throw Error('Choose a JSON file below 1 MB.');
 const payload=JSON.parse(await file.text());
 const count=pathwayImportObject(payload,file.name);
 notice(count+' teacher content pack(s) imported for local practice.');
 pathwayHome();
}
async function pathwayImportCode(raw){
 const code=pathwayString(raw,45);
 if(!/^[A-Za-z0-9_-]{8,45}$/.test(code)){notice('Enter a valid teacher publication code.');return;}
 try{
  const response=await fetch('https://lumenvale-teachers.vercel.app/api/academic/'+encodeURIComponent(code),
    {credentials:'omit',mode:'cors'});
  if(!response.ok)throw Error(response.status===404?'No published course found.':'Teacher course server unavailable.');
  const data=await response.json();
  const count=pathwayImportObject(data,'Teacher code '+code);
  notice(count+' course pack(s) added.');pathwayHome();
 }catch(e){notice(e.message||'Could not import the course.');}
}
function pathwayExportTranscript(){
 const blob=new Blob([JSON.stringify({
  kind:'lumenvale.unverified-student-transcript',version:1,goal:pathwayState.goal,
  recordType:'LOCAL GAME PRACTICE ONLY — NOT VERIFIED OR ACCREDITED',
  generatedAt:new Date().toISOString(),gpa:pathwayGPA(),history:pathwayState.history
 },null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lumenvale-practice-transcript.json';
 a.click();setTimeout(()=>URL.revokeObjectURL(url),250);
}
function pathwayInit(){
 document.addEventListener('click',event=>{
  const item=event.target.closest('[data-pathways]');if(!item)return;
  const action=item.dataset.pathways,id=item.dataset.id,unit=item.dataset.unit;
  if(action==='home')pathwayHome();
  if(action==='foundation-practice')campusSchool();
  if(action==='goal'&&LV_DEFAULT_ACADEMICS.programs.some(x=>x.id===id)){pathwayState.goal=id;pathwaySave();pathwayHome();}
  if(action==='course')pathwayCoursePanel(id);
  if(action==='enroll')pathwayEnroll(id);
  if(action==='lesson')pathwayStudy(id,unit);
  if(action==='studied')pathwayMarkStudied(id,unit);
  if(action==='cards')pathwayCards(id,unit);
  if(action==='practice')pathwayPractice(id,unit);
  if(action==='practice-answer')pathwayPracticeAnswer(item.dataset.answer);
  if(action==='flip'&&pathwaySession?.kind==='cards'){
   const s=pathwaySession;pathwayCards(s.courseId,s.unit,s.index,!s.flipped);
  }
  if((action==='next-card'||action==='previous-card')&&pathwaySession?.kind==='cards'){
   const s=pathwaySession;
   if(action==='next-card'){const key=s.courseId+'_'+s.unit;pathwayState.flashcardReviews[key]=(pathwayState.flashcardReviews[key]||0)+1;pathwaySave();}
   pathwayCards(s.courseId,s.unit,s.index+(action==='next-card'?1:-1));
  }
  if(action==='exam')pathwayExam(id);
  if(action==='answer')pathwayExamAnswer(item.dataset.answer);
  if(action==='transcript')pathwayTranscript();
  if(action==='quran')pathwayQuran();
  if(action==='import')pathwayImportPanel();
  if(action==='export')pathwayExportTranscript();
 });
 document.addEventListener('change',async event=>{
  if(event.target.id==='pathway-age'){
   pathwayState.ageBand=event.target.value;pathwaySave();
  }
  if(event.target.id==='pathway-import-file'){
   try{await pathwayImportFile(event.target.files?.[0]);}catch(error){notice(error.message||'Invalid JSON file.');}
  }
 });
 document.addEventListener('submit',event=>{
  if(event.target.id==='pathway-redeem-form'){
   event.preventDefault();const values=new FormData(event.target);pathwayRedeemRecitation(values.get('code'),values.get('studentCode'));return;
  }
  if(event.target.id!=='pathway-code-form')return;
  event.preventDefault();pathwayImportCode(new FormData(event.target).get('code'));
 });
}
