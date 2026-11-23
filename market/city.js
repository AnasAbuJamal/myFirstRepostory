/* City Builder: persistent reading-to-production gameplay. No external services. */
const CITY_SAVE_KEY='jungle-miner-city-v1';
const CITY_MOUSE_PREFS_KEY='jungle-miner-mouse-v1';
function cityLoadMouseSettings(){
 try{
  const info=JSON.parse(localStorage.getItem(CITY_MOUSE_PREFS_KEY)||'null');
  return {sensitivity:Math.max(.002,Math.min(.01,Number(info?.sensitivity)||.005)),
    invertY:Boolean(info?.invertY)};
 }catch{return {sensitivity:.005,invertY:false};}
}
var cityMouseSettings=cityLoadMouseSettings();
function citySaveMouseSettings(){
 try{localStorage.setItem(CITY_MOUSE_PREFS_KEY,JSON.stringify(cityMouseSettings));}catch{}
}
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
 {id:'workshop',title:'Wood Workshop',kind:'factory',x:-13,z:10,land:20,build:40,hire:20,rate:3,unlock:1,color:'#a47a51'},
 {id:'lumber',title:'Lumber Mill',kind:'factory',x:-27,z:10,land:65,build:125,hire:50,rate:8,unlock:2,color:'#8d7255'},
 {id:'homes',title:'Worker Homes',kind:'house',x:0,z:25,land:75,build:160,hire:0,rate:0,unlock:2,color:'#b88d6a'},
 {id:'textile',title:'Textile Factory',kind:'factory',x:-27,z:27,land:130,build:280,hire:95,rate:15,unlock:3,color:'#8196ab'},
 {id:'greenhouse',title:'Greenhouse',kind:'factory',x:16,z:27,land:210,build:460,hire:140,rate:25,unlock:4,color:'#67a28b'},
 {id:'assembly',title:'Assembly Plant',kind:'factory',x:31,z:16,land:350,build:820,hire:240,rate:43,unlock:5,color:'#879eaf'}
];
const CITY_LIBRARY={x:14,z:8};
function cityBlank(){return {version:1,coins:0,xp:0,lifetime:0,books:{},sites:{},lastTick:Date.now(),manual:{}};}
function cityClean(input){
 const v=cityBlank();
 if(!input || input.version!==1)return v;
 const number=(n,max)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
 v.coins=number(input.coins,1e12);v.xp=number(input.xp,1e9);v.lifetime=number(input.lifetime,1e12);
 for(const [id,info] of Object.entries(input.books||{})){
 if(/^[a-z0-9-]{1,90}$/.test(id)&&info&&typeof info==='object')
  v.books[id]={count:number(info.count,1e5),last:number(info.last,1e15)};
}
 for(const site of CITY_SITES){
  const info=input.sites?.[site.id];
  // Preserve existing city saves: previously constructed buildings already own their land.
  if(info?.owned||info?.built)v.sites[site.id]={
   owned:true,built:Boolean(info.built),
   staff:info.built&&site.kind==='factory'?number(info.staff,6):0,
   level:info.built?Math.max(1,number(info.level,10)):1,
   landLevel:Math.max(1,Math.min(4,number(info.landLevel,4)||1)),
   builtAt:number(info.builtAt,1e15)
  };
 }
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
function cityLandCost(site){return site.land;}
function cityLandImproveCost(site,landLevel){return site.land*(landLevel+1)*2;}
function cityProduction(site,record){
 if(!record?.built || site.kind!=='factory')return 0;
 const landLevel=Math.max(1,Math.min(4,record.landLevel||1));
 const training=typeof systemsState!=='undefined'?Math.max(0,systemsState.training?.[site.id]||0):0;
 return Math.floor(site.rate*record.staff*record.level*(1+.25*(landLevel-1))*(1+.06*training));
}
function cityIncome(){
 return CITY_SITES.reduce((total,site)=>total+cityProduction(site,cityState.sites[site.id]),0);
}
function cityLandOwned(){return CITY_SITES.filter(site=>cityState.sites[site.id]?.owned).length;}
function cityBuildingsBuilt(){return CITY_SITES.filter(site=>cityState.sites[site.id]?.built).length;}
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
   const unit=cityState.sites[site.id];
   const status=unit?.built?'Manage '+site.title:unit?.owned?'Build on your land':'Buy '+site.title+' land';
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
 if(typeof academyLibrary==='function')return academyLibrary();
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
 cityBookSession={id:book.id,page:0,started:performance.now(),openedAt:performance.now(),quizIndex:0,mistakes:0,ready:false};
 cityBookPage();
}
function cityBookPage(){
 const session=cityBookSession;if(!session)return;
 const book=CITY_BOOKS.find(b=>b.id===session.id);if(!book)return;
 const page=session.page;
 const last=page===book.pages.length-1;
 const pageText=book.pages[page];
 cityPanel('Library · '+esc(book.genre||book.shelf),esc(book.title),
 '<div class="city-book-open"><div class="city-page-count">PAGE '+(page+1)+' OF '+book.pages.length+'</div>'+
 '<p>'+esc(pageText)+'</p><div class="city-book-footer"><span>Read carefully to unlock the next page.</span>'+
 '<button type="button" class="button primary" data-city-action="page">'+(last?'Answer question':'Next page')+'</button></div></div>'+
 '<div class="city-reading-meter"><span class="city-reading-fill" id="city-reading-fill"></span></div>'+
 '<p class="city-sub" id="city-reading-hint">Read for a few seconds before continuing.</p>'+ 
  '<button type="button" class="button" data-wave="save-selection">Save selected word to My Words</button>');
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
 const questions=typeof academyQuestions==='function'?academyQuestions(book):
  [{prompt:book.question,choices:book.answers,correctIndex:book.correct}];
 const index=Math.max(0,cityBookSession.quizIndex||0),q=questions[index];if(!q)return;
 cityPanel('Reading challenge',esc(book.title),
 '<div class="city-quiz"><p class="city-sub">Question '+(index+1)+' of '+questions.length+
 ' · '+(book.wordCount||book.pages.join(' ').split(/\s+/).length)+' words</p><h3>'+esc(q.prompt)+'</h3>'+
 q.choices.map((answer,i)=>'<button type="button" class="city-answer" data-city-action="answer" data-index="'+i+'">'+
 '<span>'+String.fromCharCode(65+i)+'</span>'+esc(answer)+'</button>').join('')+
 (error?'<p class="city-wrong">'+esc(error)+'</p>':'')+'</div>');
}
function cityAnswer(index){
 const book=CITY_BOOKS.find(b=>b.id===cityBookSession?.id);if(!book)return;
 const session=cityBookSession,qs=typeof academyQuestions==='function'?academyQuestions(book):
  [{prompt:book.question,choices:book.answers,correctIndex:book.correct}];
 const question=qs[session.quizIndex||0];if(!question)return;
 if(Number(index)!==question.correctIndex){
  session.mistakes=(session.mistakes||0)+1;
  cityQuiz('Not quite. Return to the passage and try again.');return;
 }
 if((session.quizIndex||0)<qs.length-1){session.quizIndex=(session.quizIndex||0)+1;cityQuiz();return;}
 const old=cityState.books[book.id]||{count:0,last:0},first=old.count===0,now=Date.now();
 if(!first&&now-old.last<120000){
  cityPanel('Library','Already practiced','<p>You finished this book recently. Choose another book, or try this one again in two minutes.</p>'+
   '<button class="button primary" type="button" data-city-action="library">Back to shelf</button>');
  return;
 }
 const earned=first?book.reward:Math.max(5,Math.floor(book.reward*.12));
 cityState.books[book.id]={count:old.count+1,last:now};
 if(typeof academyRecord==='function')academyRecord(book,session);
 cityBookSession=null;
 cityEarn(earned,first?book.xp:5);
 cityPanel('Reading complete','+'+earned+' coins!',
 '<div class="city-success-medal">★</div><p>Correct! You finished <b>'+qs.length+
 ' questions</b> and earned <b>'+earned+' coins</b> and learning XP.</p>'+
 '<p>You have completed <b>'+cityCompleted()+'</b> different books. Reading unlocks new factories and buildings.</p>'+
 '<div class="city-duo"><button type="button" class="button primary" data-city-action="library">Read another book</button>'+
 '<button type="button" class="button" data-city-action="close">Explore the city</button></div>');
}
function cityOpenSite(id){
 const site=CITY_SITES.find(s=>s.id===id);if(!site)return;
 const unit=cityState.sites[id];
 const owned=Boolean(unit?.owned),built=Boolean(unit?.built);
 const unlocked=cityCompleted()>=site.unlock;
 const reading='Read '+site.unlock+' different '+(site.unlock===1?'book':'books')+' to unlock · '+cityCompleted()+' completed';
 const landLevel=unit?.landLevel||1;
 const landUpgrade=cityLandImproveCost(site,landLevel);
 const landButton=owned && landLevel<4?
  '<button class="button" type="button" data-city-action="improve-land" data-id="'+id+'" '+(cityState.coins<landUpgrade?'disabled':'')+'>Improve land to level '+(landLevel+1)+' · '+landUpgrade+' coins</button>':'';
 const overview='<div class="city-property-heading"><span>'+(built?'OPERATING PROPERTY':owned?'YOUR LAND':'LAND FOR SALE')+'</span><b>'+cityState.coins.toLocaleString()+' coins available</b></div>';
 let body='';
 if(!owned){
  body='<p>Buy this plot to own the property. You must purchase the land before construction begins.</p>'+
   '<div class="city-factory-grid"><div><small>Land price</small><b>'+site.land+' coins</b></div>'+
   '<div><small>Construction afterward</small><b>'+site.build+' coins</b></div>'+
   '<div><small>Reading requirement</small><b>'+site.unlock+' books</b></div><div><small>Current books</small><b>'+cityCompleted()+'</b></div></div>'+
   '<p class="city-sub">'+reading+'</p>'+
   '<button class="button primary" type="button" data-city-action="buy-land" data-id="'+id+'" '+(!unlocked||cityState.coins<site.land?'disabled':'')+'>Purchase land · '+site.land+' coins</button>';
 }else if(!built){
  body='<p><b>Land purchased.</b> This property is now yours. Develop the land, then construct your '+(site.kind==='house'?'homes':'factory')+'.</p>'+
   '<div class="city-factory-grid"><div><small>Land development</small><b>Level '+landLevel+' / 4</b></div>'+
   '<div><small>Building cost</small><b>'+site.build+' coins</b></div></div>'+
   '<div class="city-actions"><button class="button primary" type="button" data-city-action="build" data-id="'+id+'" '+(cityState.coins<site.build?'disabled':'')+'>Construct '+site.title+' · '+site.build+' coins</button>'+landButton+'</div>';
 }else if(site.kind==='house'){
  body='<p>Your homes make the settlement feel alive. Improving the property adds landscaped grounds and paths.</p>'+
   '<div class="city-factory-grid"><div><small>Land development</small><b>Level '+landLevel+' / 4</b></div>'+
   '<div><small>Buildings</small><b>3 homes</b></div></div><div class="city-actions">'+landButton+'</div>';
 }else{
  const staff=unit.staff,upgrade=site.build*(unit.level+1),hire=site.hire*(staff+1);
  body='<p>Hire employees, upgrade machines, and invest in your land. Each land improvement increases factory output by 25% of its base rate.</p>'+
   '<div class="city-factory-grid"><div><small>Employees</small><b>'+staff+' / 6</b></div>'+
   '<div><small>Coins / 5 seconds</small><b>'+cityProduction(site,unit)+'</b></div>'+
   '<div><small>Factory level</small><b>'+unit.level+' / 10</b></div>'+
   '<div><small>Land development</small><b>'+landLevel+' / 4</b></div></div>'+
   '<div class="city-actions">'+
   '<button class="button primary" type="button" data-city-action="hire" data-id="'+id+'" '+(staff>=6||cityState.coins<hire?'disabled':'')+'>Hire worker · '+hire+' coins</button>'+
   '<button class="button" type="button" data-city-action="upgrade" data-id="'+id+'" '+(unit.level>=10||cityState.coins<upgrade?'disabled':'')+'>Upgrade machinery · '+upgrade+' coins</button>'+
   landButton+
   '<button class="button" type="button" data-city-action="manual" data-id="'+id+'">Help production · +'+Math.max(2,site.rate)*unit.level+' coins</button></div>';
 }
 cityPanel('City Real Estate',site.title,overview+body);
}
function cityBuyLand(id){
 const site=CITY_SITES.find(s=>s.id===id);
 if(!site||cityState.sites[id]?.owned)return false;
 if(cityCompleted()<site.unlock){notice('Read more books to unlock this property.');return false;}
 if(!citySpend(cityLandCost(site))){notice('Not enough coins to buy land.');return false;}
 cityState.sites[id]={owned:true,built:false,staff:0,level:1,landLevel:1};
 citySave();citySync();cityOpenSite(id);
 notice('Land purchased! Develop it, then build.');
 return true;
}
function cityImproveLand(id){
 const site=CITY_SITES.find(s=>s.id===id),unit=cityState.sites[id];
 if(!site||!unit?.owned||unit.landLevel>=4)return false;
 const cost=cityLandImproveCost(site,unit.landLevel);
 if(!citySpend(cost)){notice('Not enough coins to improve land.');return false;}
 unit.landLevel++;citySave();citySync();cityOpenSite(id);
 notice('Land upgraded to level '+unit.landLevel+'.');
 return true;
}
function cityBuild(id){
 const site=CITY_SITES.find(s=>s.id===id),unit=cityState.sites[id];
 if(!site||!unit?.owned||unit.built)return false;
 if(cityCompleted()<site.unlock)return false;
 if(!citySpend(site.build)){notice('Earn more coins before construction.');return false;}
 unit.built=true;unit.level=1;unit.staff=0;unit.builtAt=Date.now();
 citySave();citySync();cityOpenSite(id);
 notice(site.title+' constructed! Hire staff to begin production.');
 return true;
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
function cityPortfolio(){
 const cards=CITY_SITES.map(site=>{
  const unit=cityState.sites[site.id];const status=unit?.built?'Operating · level '+unit.level:unit?.owned?'Owned · ready to build':'Available · '+site.land+' coins';
  return '<button class="city-portfolio-item" type="button" data-city-action="site" data-id="'+site.id+'"><span><b>'+site.title+'</b><small>'+status+'</small></span><strong>'+cityProduction(site,unit)+' / 5s</strong></button>';
 }).join('');
 cityPanel('Property Portfolio','Your city properties','<p>Buy land first, build on it, and improve each plot. Owned land is outlined in gold in the 3D world.</p>'+ 
 '<div class="city-factory-grid"><div><small>Owned plots</small><b>'+cityLandOwned()+' / '+CITY_SITES.length+'</b></div><div><small>Buildings</small><b>'+cityBuildingsBuilt()+'</b></div><div><small>Production</small><b>'+cityIncome()+' / 5s</b></div><div><small>Employees</small><b>'+cityPopulation()+'</b></div></div><div class="city-portfolio-list">'+cards+'</div>');
}
function cityGuide(){
 const next=CITY_SITES.filter(s=>!cityState.sites[s.id]?.built).slice(0,3);
 cityPanel('Your City · Guide','Read. Build. Hire.',
 '<p>Walk to the library pavilion on the east side of the office. Read a book, turn its pages, and answer the question to collect coins.</p>'+
 '<p>Then explore the marked construction plots. Press <kbd>E</kbd> near a plot to buy land first, then construct a factory. Return to hire people and upgrade both your land and machinery.</p>'+
 '<div class="city-factory-grid"><div><small>City wallet</small><b>'+cityState.coins+' coins</b></div>'+
 '<div><small>Passive production</small><b>'+cityIncome()+' / 5 sec</b></div>'+
 '<div><small>Unique books</small><b>'+cityCompleted()+' / '+CITY_BOOKS.length+'</b></div>'+
 '<div><small>Workers</small><b>'+cityPopulation()+'</b></div></div>'+
 '<h3>Next properties</h3><p>'+next.map(s=>s.title+' (land '+s.land+' · building '+s.build+' coins)').join(' · ')+'</p>'+
 '<div class="city-mouse-settings"><h3>First-person mouse settings</h3>'+
 '<label for="city-mouse-sensitivity">Mouse sensitivity: <strong id="city-sensitivity-value">'+Math.round(cityMouseSettings.sensitivity*1000)+'</strong></label>'+
 '<input id="city-mouse-sensitivity" type="range" min="2" max="10" step="1" value="'+Math.round(cityMouseSettings.sensitivity*1000)+'">'+
 '<label class="city-toggle"><input id="city-invert-y" type="checkbox" '+(cityMouseSettings.invertY?'checked':'')+'> Invert vertical look</label></div>'+
 '<p class="city-sub">Click Play once to capture the mouse · Esc releases cursor · Click to resume · Shift sprint · E interact · F fullscreen · G guide · M properties. Menus release the mouse for their buttons. Saves stay on this device.</p>');
}
function citySync(){
 const balance=byId('city-coins'),learning=byId('city-learning'),income=byId('city-income'),lands=byId('city-lands'),objective=byId('city-objective');
 if(balance)balance.textContent=cityState.coins.toLocaleString();
 if(learning)learning.textContent=cityCompleted()+'/'+CITY_BOOKS.length;
 if(income)income.textContent=cityIncome()+'/5s';
 if(lands)lands.textContent=cityLandOwned()+'/'+CITY_SITES.length;
 if(objective){
  objective.textContent=!cityCompleted()?'Visit the library and finish your first book':
   !cityState.sites.workshop?.owned?'Buy workshop land (20 coins)':
   !cityState.sites.workshop?.built?'Build your first workshop (40 coins)':
   !cityState.sites.workshop.staff?'Hire a worker at the workshop':
   cityCompleted()<CITY_BOOKS.length?'Read more books and expand your city':'Keep growing your production city';
 }
}
// Browser pointer lock captures all mouse motion until Esc or a focused UI opens.
// Browser security requires a user click for the initial capture and every recapture.
function cityRequestMouseLock(){
 if(!isWalking()||document.pointerLockElement===byId('landscape'))return;
 const canvas=byId('landscape');
 if(!canvas?.requestPointerLock){notice('Use a desktop browser with Pointer Lock support.');return;}
 try{
  const request=canvas.requestPointerLock();
  request?.catch?.(()=>notice('Mouse lock was blocked. Click Play again.'));
 }catch{notice('Mouse lock needs another click.');}
}
function cityEnterFullscreen(){
 const root=document.documentElement;
 if(!document.fullscreenElement){
  const request=root.requestFullscreen?.();
  request?.catch?.(()=>notice('Fullscreen unavailable. Mouse look still works in windowed mode.'));
  cityRequestMouseLock();
 }else document.exitFullscreen?.();
}
function cityMousePrompt(){
 const locked=document.pointerLockElement===byId('landscape');
 const prompt=byId('city-mouse-prompt'),paused=Boolean(dialog.open||terminal.open);
 byId('view').classList.toggle('is-locked',locked);
 if(prompt)prompt.hidden=locked||paused;
 const status=byId('city-mouse-state');
 if(status)status.textContent=locked?'Mouse locked · Esc to release':'Mouse unlocked · Click to resume';
 if(!locked)stopMovement();
}
function cityInit(){
 const hud=document.createElement('div');
 hud.className='city-hud';hud.innerHTML=
 '<div class="city-chip"><small>City coins</small><strong id="city-coins">0</strong></div>'+
 '<div class="city-chip"><small>Books read</small><strong id="city-learning">0/6</strong></div>'+ 
 '<div class="city-chip"><small>Land owned</small><strong id="city-lands">0/6</strong></div>'+
 '<div class="city-chip"><small>Production</small><strong id="city-income">0/5s</strong></div>'+
 '<div class="city-hud-actions"><button type="button" id="city-help" title="City guide">Guide</button>'+ 
  '<button type="button" id="city-portfolio" title="Land and buildings">Properties</button>'+
 '<button type="button" id="city-full" title="Fullscreen and mouse capture">⛶ Fullscreen</button></div>'+
 '<p class="city-goal" id="city-objective"></p>'+ 
 '<p class="city-mouse-state" id="city-mouse-state">Mouse unlocked · Click to resume</p>';
 byId('view').append(hud);
 const prompt=document.createElement('div');
 prompt.id='city-mouse-prompt';
 prompt.className='city-mouse-prompt';
 prompt.innerHTML='<div class="city-resume-card"><div class="city-crosshair-symbol" aria-hidden="true">✛</div>'+
  '<h2>LUMENVALE</h2><p>Read. Build. Thrive. Look freely with the mouse—no holding or dragging.</p>'+
  '<button type="button" id="city-resume-button">▶ Click to Play</button>'+
  '<small>WASD move · E interact · Esc releases mouse · F fullscreen</small></div>';
 byId('view').append(prompt);
 byId('city-resume-button').addEventListener('click',cityRequestMouseLock);
 byId('landscape').addEventListener('click',cityRequestMouseLock);
 document.addEventListener('pointerlockchange',cityMousePrompt);
 document.addEventListener('pointerlockerror',()=>notice('Mouse capture failed. Click Play again.'));
 dialog.addEventListener('close',()=>requestAnimationFrame(cityMousePrompt));
 terminal.addEventListener('close',()=>requestAnimationFrame(cityMousePrompt));
 byId('city-help').addEventListener('click',cityGuide);
 byId('city-portfolio').addEventListener('click',cityPortfolio);
 byId('city-full').addEventListener('click',cityEnterFullscreen);
 document.addEventListener('input',event=>{
  if(event.target.id==='city-mouse-sensitivity'){
   cityMouseSettings.sensitivity=Number(event.target.value)/1000;
   citySaveMouseSettings();
   const label=byId('city-sensitivity-value');if(label)label.textContent=event.target.value;
  }
 });
 document.addEventListener('change',event=>{
  if(event.target.id==='city-invert-y'){
   cityMouseSettings.invertY=event.target.checked;citySaveMouseSettings();
  }
 });
 document.addEventListener('click',event=>{
  const b=event.target.closest('[data-city-action]');if(!b)return;
  const id=b.dataset.id;
  const action=b.dataset.cityAction;
  if(action==='library')cityBookList();
  else if(action==='site')cityOpenSite(id);
  else if(action==='buy-land')cityBuyLand(id);
  else if(action==='improve-land')cityImproveLand(id);
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
  if(event.repeat||event.target.matches?.('input,textarea,select')||dialog.open||terminal.open)return;
  const key=event.key.toLowerCase();
  if(key==='f'){event.preventDefault();cityEnterFullscreen();}
  if(key==='m'){event.preventDefault();cityPortfolio();}
  if(key==='g'){event.preventDefault();cityGuide();}
 });
 document.addEventListener('mousemove',event=>{
  if(document.pointerLockElement===byId('landscape') && !dialog.open && !terminal.open){
   turnCamera(event.movementX||0,event.movementY||0);
  }
 });
 document.addEventListener('fullscreenchange',()=>{
  byId('city-full').textContent=document.fullscreenElement?'⤡ Windowed':'⛶ Fullscreen';
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
 cityMousePrompt();
}
