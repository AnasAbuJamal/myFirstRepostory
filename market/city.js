/* City Builder: persistent reading-to-production gameplay. No external services. */
const CITY_SAVE_KEY='jungle-miner-city-v1';
const CITY_TICK_MS=5000;
const CITY_BOOKS=[
 {id:'forest',title:'Forest Field Notes',shelf:'Nature',reward:48,xp:20,pages:[
  'A forest is home to many living things. Tall trees give shade, while smaller plants grow below. Animals rely on the same space for food and shelter.',
  'When people protect soil and water, the forest stays healthier. Planting a tree is helpful, but caring for it as it grows is just as important.'
 ],question:'Why does protecting soil and water help a forest?',answers:['It makes every tree the same size','It supports a healthy habitat','It removes every animal'],correct:1},
 {id:'tools',title:'A Workshop Guide',shelf:'Building',reward:56,xp:24,pages:[
  'A small workshop needs a clear plan. Workers should check the materials, organize the tools, and keep walking paths open before production begins.',
  'Good teams share duties. One worker prepares materials while another checks the finished goods. Careful work reduces mistakes and waste.'
 ],question:'What helps a workshop reduce mistakes?',answers:['Skipping every check','Working without a plan','Checking finished products'],correct:2},
 {id:'market',title:'The Busy Market',shelf:'Business',reward:68, xp:28,pages:[
  'Every shop needs customers who trust it. A seller listens carefully, gives a clear price, and delivers what was promised.',
  'When sales increase, the owner may hire another person. More workers can help, but they need training and enough supplies to complete their jobs.'
 ],question:'Why might a shop owner hire another person?',answers:['To help with more sales','To stop serving customers','To remove all supplies'],correct:0},
 {id:'energy',title:'Powering a Town',shelf:'Science',reward:78,xp:33,pages:[
  'Machines need energy to work. Some factories use electricity to turn motors, move belts, or run lights inside their buildings.',
  'A town can save energy by repairing old equipment and turning off unused machines. Efficient factories can produce more with fewer resources.'
 ],question:'Which action can save energy?',answers:['Leave machines on overnight','Repair inefficient equipment','Run empty machines all day'],correct:1},
 {id:'people',title:'People of the City',shelf:'Community',reward:90,xp:38,pages:[
  'A growing city needs more than factories. Homes, shops, trees, and shared spaces make it a comfortable place to live.',
  'People with different skills build a community together. Builders make roads, workers create goods, and teachers help others learn.'
 ],question:'What makes a city a community?',answers:['Only taller buildings','Only busy machines','People contributing different skills'],correct:2},
 {id:'future',title:'Plans for Tomorrow',shelf:'Innovation',reward:110,xp:45,pages:[
  'A successful business can grow slowly and carefully. Leaders review income, listen to workers, and plan what to improve next.',
  'A long-term plan may include a new factory, safer tools, and more places to learn. Good progress balances earning money with helping people.'
 ],question:'What is part of a good long-term plan?',answers:['Ignoring workers','Improving safety and learning','Buying everything at once'],correct:1}
];
const CITY_SITES=[
 {id:'workshop',title:'Wood Workshop',kind:'factory',x:-13,z:10,build:40,hire:20,rate:3,unlock:1,color:'#a47a51'},
 {id:'lumber',title:'Lumber Mill',kind:'factory',x:-27,z:10,build:125,hire:50,rate:8,unlock:2,color:'#8d7255'},
 {id:'homes',title:'Worker Homes',kind:'house',x:0,z:25,build:160,hire:0,rate:0,unlock:2,color:'#b88d6a'},
 {id:'textile',title:'Textile Factory',kind:'factory',x:-27,z:27,build:280,hire:95,rate:15,unlock:3,color:'#8196ab'},
 {id:'greenhouse',title:'Greenhouse',kind:'factory',x:16,z:27,build:460,hire:140,rate:25,unlock:4,color:'#67a28b'},
 {id:'assembly',title:'Assembly Plant',kind:'factory',x:31,z:16,build:820,hire:240,rate:43,unlock:5,color:'#879eaf'}
];
const CITY_LIBRARY={x:14,z:8};
function cityBlank(){return {version:1,coins:0,xp:0,lifetime:0,books:{},sites:{},lastTick:Date.now(),manual:{}};}
function cityClean(input){
 const v=cityBlank();
 if(!input || input.version!==1)return v;
 const number=(n,max)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
 v.coins=number(input.coins,1e12);v.xp=number(input.xp,1e9);v.lifetime=number(input.lifetime,1e12);
 for(const book of CITY_BOOKS){const info=input.books?.[book.id];if(info)v.books[book.id]={count:number(info.count,1e5),last:number(info.last,1e15)};}
 for(const site of CITY_SITES){const info=input.sites?.[site.id];if(info?.built)v.sites[site.id]={built:true,staff:number(info.staff,6),level:Math.max(1,number(info.level,10))};}
 v.lastTick=number(input.lastTick,1e15)||Date.now();
 for(const site of CITY_SITES)v.manual[site.id]=number(input.manual?.[site.id],1e15);
 return v;
}
function cityReadSave(){try{return cityClean(JSON.parse(localStorage.getItem(CITY_SAVE_KEY)));}catch{return cityBlank();}}
var cityState=cityReadSave();
var cityBookSession=null;
function citySave(){
 try{if(!trial)localStorage.setItem(CITY_SAVE_KEY,JSON.stringify(cityState));}
 catch{ /* Browser may be in private storage mode. */ }
}
function cityCompleted(){return CITY_BOOKS.filter(book=>cityState.books[book.id]?.count>0).length;}
function cityPopulation(){return Object.values(cityState.sites).filter(s=>s?.built).reduce((n,s)=>n+s.staff,0);}
function cityIncome(){
 return CITY_SITES.reduce((total,site)=>{
  const built=cityState.sites[site.id];
  return total+(built?.built && site.kind==='factory' ? site.rate*built.staff*built.level : 0);
 },0);
}
function cityEarn(coins,xp){
 cityState.coins+=coins;cityState.lifetime+=coins;cityState.xp+=xp;
 citySave();citySync();
}
function citySpend(amount){
 if(cityState.coins<amount)return false;
 cityState.coins-=amount;citySave();citySync();return true;
}
function cityTick(now=Date.now()){
 const current=Number.isFinite(now)?now:Date.now();
 let elapsed=Math.floor((current-cityState.lastTick)/CITY_TICK_MS);
 if(elapsed<0){cityState.lastTick=current;citySave();return 0;}
 elapsed=Math.min(elapsed,720); // At most one hour of production while away.
 if(!elapsed)return 0;
 cityState.lastTick=current; // No catch-up loop in the render frame.
 const coins=elapsed*cityIncome();
 if(coins){cityState.coins+=coins;cityState.lifetime+=coins;}
 citySave();
 return coins;
}
function cityNearby(p){
 if(!p)return null;
 if(Math.hypot(p.x-CITY_LIBRARY.x,p.z-CITY_LIBRARY.z)<4.3)return {id:'library',city:true,label:'Browse the library books'};
 for(const site of CITY_SITES){
  if(Math.hypot(p.x-site.x,p.z-(site.z-3.6))<3.1){
   const status=cityState.sites[site.id]?.built?'Manage '+site.title:'Build '+site.title;
   return {id:site.id,city:true,label:status};
  }
 }
 return null;
}
function cityPanel(label,title,body){
 if(typeof stopMovement==='function')stopMovement();
 if(document.pointerLockElement)document.exitPointerLock();
 modal(label,title,body);
}
function cityBookList(){
 const completed=cityCompleted();
 const cards=CITY_BOOKS.map(book=>{
  const count=cityState.books[book.id]?.count||0;
  return '<button class="city-book-card" type="button" data-city-action="book" data-id="'+book.id+'">'+
  '<span class="city-book-spine" aria-hidden="true">▥</span><span><small>'+book.shelf+' · '+(count?'Completed':'New lesson')+'</small><b>'+book.title+'</b>'+
  '<em>'+book.pages.length+' pages · '+book.reward+' coins first read</em></span></button>';
 }).join('');
 cityPanel('Town Library','Choose a book','<p class="city-sub">Read the short sample pages, then answer a question to earn coins. Each new book also unlocks more city buildings.</p>'+
 '<div class="city-library-stats"><b>'+completed+' / '+CITY_BOOKS.length+'</b> unique books read · <b>'+cityState.xp+'</b> learning XP</div>'+
 '<div class="city-shelf">'+cards+'</div>');
}
function cityOpenBook(id){
 const book=CITY_BOOKS.find(b=>b.id===id);
 if(!book)return;
 cityBookSession={id:book.id,page:0,started:performance.now(),ready:false};
 cityBookPage();
}
function cityBookPage(){
 const session=cityBookSession;if(!session)return;
 const book=CITY_BOOKS.find(b=>b.id===session.id);if(!book)return;
 const page=session.page;
 const last=page===book.pages.length-1;
 const pageText=book.pages[page];
 cityPanel('Library · '+book.shelf,book.title,
 '<div class="city-book-open"><div class="city-page-count">PAGE '+(page+1)+' OF '+book.pages.length+'</div>'+
 '<p>'+pageText+'</p><div class="city-book-footer"><span>Read carefully to unlock the next page.</span>'+
 '<button type="button" class="button primary" data-city-action="page">'+(last?'Answer question':'Next page')+'</button></div></div>'+
 '<div class="city-reading-meter"><span class="city-reading-fill" id="city-reading-fill"></span></div>'+
 '<p class="city-sub" id="city-reading-hint">Read for a few seconds before continuing.</p>');
}
function cityNextPage(){
 if(!cityBookSession)return;
 const secs=(performance.now()-cityBookSession.started)/1000;
 if(secs<4){
  const hint=byId('city-reading-hint');
  if(hint)hint.textContent='Keep reading for '+Math.ceil(4-secs)+' more seconds.';
  return;
 }
 const book=CITY_BOOKS.find(b=>b.id===cityBookSession.id);
 if(cityBookSession.page+1<book.pages.length){
  cityBookSession.page++;cityBookSession.started=performance.now();cityBookPage();
 } else cityQuiz();
}
function cityQuiz(error=''){
 const book=CITY_BOOKS.find(b=>b.id===cityBookSession?.id);if(!book)return;
 cityPanel('Reading challenge',book.title,
 '<div class="city-quiz"><p class="city-sub">Check what you understood.</p><h3>'+book.question+'</h3>'+
 book.answers.map((answer,i)=>'<button type="button" class="city-answer" data-city-action="answer" data-index="'+i+'">'+
 '<span>'+String.fromCharCode(65+i)+'</span>'+answer+'</button>').join('')+
 (error?'<p class="city-wrong">'+error+'</p>':'')+'</div>');
}
function cityAnswer(index){
 const book=CITY_BOOKS.find(b=>b.id===cityBookSession?.id);if(!book)return;
 if(Number(index)!==book.correct){cityQuiz('Not quite. Return to the passage in your mind and try another answer.');return;}
 const old=cityState.books[book.id]||{count:0,last:0};
 const first=old.count===0;
 const now=Date.now();
 if(!first && now-old.last<120000){
  cityPanel('Library','Already practiced','<p>You finished this book recently. Choose another book, or try this one again in two minutes.</p>'+
   '<button class="button primary" type="button" data-city-action="library">Back to shelf</button>');
  return;
 }
 const earned=first?book.reward:Math.max(5,Math.floor(book.reward*.12));
 cityState.books[book.id]={count:old.count+1,last:now};
 cityBookSession=null;
 cityEarn(earned,first?book.xp:5);
 cityPanel('Reading complete','+'+earned+' coins!',
 '<div class="city-success-medal">★</div><p>Correct! You earned <b>'+earned+' coins</b> and learning XP.</p>'+
 '<p>You have completed <b>'+cityCompleted()+'</b> different books. Reading unlocks new factories and buildings.</p>'+
 '<div class="city-duo"><button type="button" class="button primary" data-city-action="library">Read another book</button>'+
 '<button type="button" class="button" data-city-action="close">Explore the city</button></div>');
}
function cityOpenSite(id){
 const site=CITY_SITES.find(s=>s.id===id);if(!site)return;
 const record=cityState.sites[id];
 const built=record?.built;
 const unlocked=cityCompleted()>=site.unlock;
 const bookLine='Requires '+site.unlock+' different '+(site.unlock===1?'book':'books')+' completed · '+cityCompleted()+' read';
 let body='';
 if(!built){
  body='<p>Build this '+(site.kind==='house'?'housing block':'production building')+' on your city plot.</p>'+
   '<div class="city-factory-grid"><div><small>Construction</small><b>'+site.build+' coins</b></div>'+
   '<div><small>Reading unlock</small><b>'+site.unlock+' books</b></div></div>'+
   '<p class="city-sub">'+bookLine+'</p>'+
   '<button class="button primary" type="button" data-city-action="build" data-id="'+id+'" '+(!unlocked||cityState.coins<site.build?'disabled':'')+'>Build '+site.title+'</button>';
 }else if(site.kind==='house'){
  body='<p>Your new homes bring workers and life to the growing settlement.</p><p><b>Built</b> · Decorative neighborhood unlocked.</p>';
 }else{
  const staff=record.staff;const upgrade=site.build*(record.level+1);
  const hire=site.hire*(staff+1);
  body='<p>Manage your machinery and workers. Hired employees generate coins automatically, including for up to one hour while away.</p>'+
   '<div class="city-factory-grid"><div><small>Employees</small><b>'+staff+' / 6</b></div>'+
   '<div><small>Production / 5 sec</small><b>'+(site.rate*staff*record.level)+' coins</b></div>'+
   '<div><small>Factory level</small><b>'+record.level+'</b></div><div><small>Upgrade cost</small><b>'+upgrade+' coins</b></div></div>'+
   '<div class="city-actions">'+
   '<button class="button primary" type="button" data-city-action="hire" data-id="'+id+'" '+(staff>=6||cityState.coins<hire?'disabled':'')+'>Hire employee · '+hire+'</button>'+
   '<button class="button" type="button" data-city-action="upgrade" data-id="'+id+'" '+(record.level>=10||cityState.coins<upgrade?'disabled':'')+'>Upgrade machines · '+upgrade+'</button>'+
   '<button class="button" type="button" data-city-action="manual" data-id="'+id+'">Help produce · +'+Math.max(2,site.rate)+' coins</button></div>';
 }
 cityPanel('City Development',site.title,body);
}
function cityBuild(id){
 const site=CITY_SITES.find(s=>s.id===id);
 if(!site||cityState.sites[id]?.built)return;
 if(cityCompleted()<site.unlock){notice('Read more unique books to unlock this plot.');return;}
 if(!citySpend(site.build)){notice('Earn more coins at the library.');return;}
 cityState.sites[id]={built:true,staff:0,level:1};
 citySave();citySync();cityOpenSite(id);notice(site.title+' constructed! Explore it in 3D.');
}
function cityHire(id){
 const site=CITY_SITES.find(s=>s.id===id),unit=cityState.sites[id];
 if(!site||site.kind!=='factory'||!unit?.built||unit.staff>=6)return;
 const cost=site.hire*(unit.staff+1);
 if(!citySpend(cost))return;
 unit.staff++;citySave();citySync();cityOpenSite(id);notice('New employee hired at '+site.title+'.');
}
function cityUpgrade(id){
 const site=CITY_SITES.find(s=>s.id===id),unit=cityState.sites[id];
 if(!site||site.kind!=='factory'||!unit?.built||unit.level>=10)return;
 const cost=site.build*(unit.level+1);
 if(!citySpend(cost))return;
 unit.level++;citySave();citySync();cityOpenSite(id);notice('Machines upgraded at '+site.title+'.');
}
function cityManual(id){
 const site=CITY_SITES.find(s=>s.id===id),unit=cityState.sites[id];
 if(!site||!unit?.built||site.kind!=='factory')return;
 const now=Date.now(),previous=cityState.manual[id]||0;
 if(now-previous<3500){notice('The machine needs another moment.');return;}
 cityState.manual[id]=now;
 cityEarn(Math.max(2,site.rate)*unit.level,0);
 cityOpenSite(id);
 notice('You helped the production line.');
}
function cityInteract(target){
 if(target?.id==='library')cityBookList();
 else if(target?.id)cityOpenSite(target.id);
}
function cityGuide(){
 const next=CITY_SITES.filter(s=>!cityState.sites[s.id]?.built).slice(0,3);
 cityPanel('Your City · Guide','Read. Build. Hire.',
 '<p>Walk to the library pavilion on the east side of the office. Read a book, turn its pages, and answer the question to collect coins.</p>'+
 '<p>Then explore the marked construction plots. Press <kbd>E</kbd> near a plot to build a factory. Visit the building again to hire people, upgrade machines, or help produce goods yourself.</p>'+
 '<div class="city-factory-grid"><div><small>City wallet</small><b>'+cityState.coins+' coins</b></div>'+
 '<div><small>Passive production</small><b>'+cityIncome()+' / 5 sec</b></div>'+
 '<div><small>Unique books</small><b>'+cityCompleted()+' / '+CITY_BOOKS.length+'</b></div>'+
 '<div><small>Workers</small><b>'+cityPopulation()+'</b></div></div>'+
 '<h3>Next buildings</h3><p>'+next.map(s=>s.title+' ('+s.build+' coins)').join(' · ')+'</p>'+
 '<p class="city-sub">WASD to walk · E to interact · F for fullscreen · Escape unlocks mouse. Your city saves on this device.</p>');
}
function citySync(){
 const balance=byId('city-coins'),learning=byId('city-learning'),income=byId('city-income'),objective=byId('city-objective');
 if(balance)balance.textContent=cityState.coins.toLocaleString();
 if(learning)learning.textContent=cityCompleted()+'/'+CITY_BOOKS.length;
 if(income)income.textContent=cityIncome()+'/5s';
 if(objective){
  objective.textContent=!cityCompleted()?'Visit the library and finish your first book':
   !cityState.sites.workshop?.built?'Build your first workshop (40 coins)':
   !cityState.sites.workshop.staff?'Hire a worker at the workshop':
   cityCompleted()<CITY_BOOKS.length?'Read more books and expand your city':'Keep growing your production city';
 }
}
function cityEnterFullscreen(){
 const root=document.documentElement;
 if(!document.fullscreenElement){
  const result=root.requestFullscreen?.();
  if(result?.catch)result.catch(()=>notice('Fullscreen is not available in this browser.'));
  try{const lock=byId('landscape').requestPointerLock?.();lock?.catch?.(()=>{});}catch{}
 }else document.exitFullscreen?.();
}
function cityInit(){
 const hud=document.createElement('div');
 hud.className='city-hud';hud.innerHTML=
 '<div class="city-chip"><small>City coins</small><strong id="city-coins">0</strong></div>'+
 '<div class="city-chip"><small>Books read</small><strong id="city-learning">0/6</strong></div>'+
 '<div class="city-chip"><small>Production</small><strong id="city-income">0/5s</strong></div>'+
 '<div class="city-hud-actions"><button type="button" id="city-help" title="City guide">City guide</button>'+
 '<button type="button" id="city-full" title="Fullscreen and mouse capture">⛶ Fullscreen</button></div>'+
 '<p class="city-goal" id="city-objective"></p>';
 byId('view').append(hud);
 byId('city-help').addEventListener('click',cityGuide);
 byId('city-full').addEventListener('click',cityEnterFullscreen);
 document.addEventListener('click',event=>{
  const b=event.target.closest('[data-city-action]');if(!b)return;
  const id=b.dataset.id;
  const action=b.dataset.cityAction;
  if(action==='library')cityBookList();
  else if(action==='book')cityOpenBook(id);
  else if(action==='page')cityNextPage();
  else if(action==='answer')cityAnswer(b.dataset.index);
  else if(action==='build')cityBuild(id);
  else if(action==='hire')cityHire(id);
  else if(action==='upgrade')cityUpgrade(id);
  else if(action==='manual')cityManual(id);
  else if(action==='close')dialog.close();
 });
 window.addEventListener('keydown',event=>{
  if(event.key.toLowerCase()==='f' && !event.repeat && !event.target.matches?.('input,textarea,select') && !dialog.open && !terminal.open)cityEnterFullscreen();
 });
 document.addEventListener('mousemove',event=>{
  if(document.pointerLockElement===byId('landscape') && !dialog.open && !terminal.open){
   turnCamera(event.movementX||0,event.movementY||0);
  }
 });
 document.addEventListener('fullscreenchange',()=>{
  byId('city-full').textContent=document.fullscreenElement?'⤡ Windowed':'⛶ Fullscreen';
 });
 byId('landscape').addEventListener('click',()=>{
  if(document.fullscreenElement && !document.pointerLockElement && isWalking()){
   try{byId('landscape').requestPointerLock?.();}catch{}
  }
 });
 setInterval(()=>{
  cityTick();citySync();
  if(cityBookSession){
   const elapsed=(performance.now()-cityBookSession.started)/1000;
   const bar=byId('city-reading-fill');if(bar)bar.style.width=Math.min(100,Math.floor(elapsed/4*100))+'%';
  }
  if(typeof drawScene==='function')drawScene();
 },1000);
 cityTick();citySync();drawScene();
}
