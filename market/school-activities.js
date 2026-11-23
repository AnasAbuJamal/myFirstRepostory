/* Small JSON-driven school quest. Never changes teacher grades or recitation records. */
const SCHOOL_CHALLENGE_KEY='lumenvale-school-activities-v1';
function schoolChallengeLoad(){
 try{const raw=JSON.parse(localStorage.getItem(SCHOOL_CHALLENGE_KEY));
  return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};}
 catch{return {};}
}
var schoolChallengeProgress=schoolChallengeLoad();
function schoolChallengeSave(){
 try{if(!trial)localStorage.setItem(SCHOOL_CHALLENGE_KEY,JSON.stringify(schoolChallengeProgress));}
 catch{notice('School challenge progress could not be saved.');}
}
function schoolGuide(){
 const done=LV_SCHOOL_ACTIVITIES.challenges.filter(c=>schoolChallengeProgress[c.id]).length;
 cityPanel('LumenVale School / Directory','Welcome to LumenVale School',
  '<p>Walk to the different study stations and press <strong>E</strong>. The central corridor is clear so you can explore the whole school.</p>'+
  '<div class="wave-school-stats"><div><small>Knowledge Quest</small><b>'+done+'/4</b></div><div><small>Education</small><b>Middle → College</b></div><div><small>Teacher verification</small><b>Required</b></div></div>'+
  '<div class="city-actions"><button class="button primary" data-pathways="home">Academic pathways</button>'+
  '<button class="button" data-school="challenges">Knowledge Quest</button>'+
  '<button class="button" data-pathways="quran">Qur’an memorization</button>'+
  '<button class="button" data-wave="school">Foundation practice</button>'+
  '<button class="button" data-pathways="transcript">Practice transcript</button>'+
  '<button class="button" data-pathways="import">Import teacher JSON</button>'+
  '<button class="button" data-jobs="jobs">Career opportunities</button></div>'+
  '<p class="city-sub">These optional game challenges cannot verify Qur’an recitation or grant school credits. A teacher must assess recitations.</p>');
}
function schoolQuizPanel(){
 const done=LV_SCHOOL_ACTIVITIES.challenges.filter(c=>schoolChallengeProgress[c.id]).length;
 const cards=LV_SCHOOL_ACTIVITIES.challenges.map(c=>
  '<button class="wave-course" data-school="open" data-id="'+esc(c.id)+'"><span class="wave-course-icon">'+esc(c.icon)+
  '</span><strong>'+esc(c.title)+'</strong><span>'+esc(c.subject)+' · '+
  (schoolChallengeProgress[c.id]?'✓ Completed':'One-time 14-coin game reward')+'</span></button>').join('');
 cityPanel('School / Knowledge Quest','Knowledge Quest · '+done+'/4',
  '<p>Choose a subject and answer one short question. Incorrect answers can be retried; correct answers award game coins only once.</p>'+
  '<div class="wave-course-grid">'+cards+'</div><button class="button" data-school="guide">Campus directory</button>');
}
function schoolQuizQuestion(id){
 const c=LV_SCHOOL_ACTIVITIES.challenges.find(q=>q.id===id);if(!c)return;
 cityPanel('School / '+esc(c.subject),c.title,'<p>'+esc(c.prompt)+'</p>'+
  c.choices.map((choice,i)=>'<button class="city-answer" data-school="answer" data-id="'+esc(c.id)+
  '" data-answer="'+i+'"><span>'+String.fromCharCode(65+i)+'</span>'+esc(choice)+'</button>').join('')+
  '<button class="button" data-school="challenges">All challenges</button>');
}
function schoolQuizAnswer(id,answer){
 const c=LV_SCHOOL_ACTIVITIES.challenges.find(q=>q.id===id);if(!c)return false;
 if(!Number.isInteger(Number(answer))||Number(answer)!==c.correctIndex){
  notice('Try again. Read the question carefully.');return false;
 }
 const first=!schoolChallengeProgress[id];
 if(first){schoolChallengeProgress[id]=Date.now();schoolChallengeSave();cityEarn(14,12);}
 cityPanel('School / '+esc(c.subject),'Correct answer!','<p>'+esc(c.explanation)+'</p><p><strong>'+
  (first?'+14 city coins and +12 learning XP.':'Previously completed — no repeat reward.')+
  '</strong></p><div class="city-actions"><button class="button primary" data-school="challenges">Next challenge</button>'+
  '<button class="button" data-school="guide">Campus directory</button></div>');
 return true;
}
function schoolActivitiesInit(){
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-school]');if(!button)return;
  switch(button.dataset.school){
   case 'guide':schoolGuide();break;
   case 'challenges':schoolQuizPanel();break;
   case 'open':schoolQuizQuestion(button.dataset.id);break;
   case 'answer':schoolQuizAnswer(button.dataset.id,button.dataset.answer);break;
  }
 });
}
