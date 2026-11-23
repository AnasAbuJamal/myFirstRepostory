/* LumenVale City Systems: mail, expenses, orders, technology and citizens. */
const LV_SYSTEMS_KEY='lumenvale-city-systems-v1';
const LV_CHARACTERS=[
 {id:'lena',name:'Lena',title:'Civil Engineer',x:3.40,z:6.75,
  story:'Our city needs a safe road before the next shipment. Workers must inspect the route, repair broken pavement, and keep the crossing clear for pedestrians.',
  question:'What should workers do before the shipment?',choices:['Inspect and repair the road','Remove every crossing','Ignore the pavement'],answer:0,reward:36},
 {id:'omar',name:'Omar',title:'Workshop Foreman',x:-14.6,z:24.85,
  story:'A delivery truck arrived with five boxes of wood. Four boxes are needed for the current orders. One box can stay in the storeroom for future customers.',
  question:'How many boxes should remain in storage?',choices:['Four','One','Five'],answer:1,reward:44},
 {id:'maya',name:'Maya',title:'City Planner',x:-1.8,z:43.6,
  story:'The new neighborhood has homes, a school, and a park. The council recommends saving electricity by using efficient lights and maintaining public spaces.',
  question:'Which choice would help this neighborhood?',choices:['Use efficient lights','Waste electricity','Close the park'],answer:0,reward:52}
];
const LV_HOME_DECOR=[
 {id:'flowers',name:'Garden Flowers',cost:70,desc:'Add colorful flower planters to your home.'},
 {id:'patio',name:'Front Patio',cost:110,desc:'Build an outdoor seating area.'},
 {id:'solar',name:'Solar Roof',cost:170,desc:'Modernize your rooftop and improve city reputation.'}
];
const LV_PERSONNEL=['Amina · Operator','Leo · Mechanic','Noor · Engineer','Sam · Driver','Mira · Quality Inspector','Omar · Shift Lead'];
const LV_TREASURES=[{id:'river',x:35,z:-14,reward:50,unlock:2,clue:'Follow the road east, then search the riverside rocks.'},{id:'forest',x:-38,z:29,reward:90,unlock:3,clue:'Look by the old trees on the far western edge.'},{id:'garden',x:-7.0,z:56.2,reward:140,unlock:4,clue:'Look beyond the homes and gardens at the south edge of the town.'}];
var systemsDriving=false;
const LV_PRODUCTS={workshop:{name:'Furniture',icon:'🪑'},lumber:{name:'Lumber',icon:'🪵'},
 textile:{name:'Fabric',icon:'🧵'},greenhouse:{name:'Produce',icon:'🌿'},assembly:{name:'Tools',icon:'🛠️'}};
const LV_CONTRACTS=[
 {id:'starter-desk',title:'School Furniture',customer:'Principal Harper',goods:{workshop:5},reward:110,reputation:6,needs:1},
 {id:'timber',title:'Wood for New Homes',customer:'Lena Builders',goods:{lumber:8},reward:190,reputation:8,needs:2},
 {id:'community',title:'Community Hall Order',customer:'Town Council',goods:{workshop:8,lumber:5},reward:320,reputation:10,needs:2},
 {id:'uniforms',title:'Festival Uniforms',customer:'Local School',goods:{textile:10},reward:340,reputation:12,needs:3},
 {id:'gardens',title:'Community Garden Supply',customer:'Garden Club',goods:{greenhouse:12},reward:440,reputation:14,needs:4},
 {id:'equipment',title:'Engineering Equipment',customer:'Research Center',goods:{assembly:10},reward:750,reputation:18,needs:5}
];
const LV_UPGRADES=[
 {id:'garden',title:'Public Garden',cost:85,desc:'Plant a brighter green space for residents.',reputation:5},
 {id:'lights',title:'Streetlights',cost:150,desc:'Illuminate the growing city after dark.',reputation:6},
 {id:'home',title:'Your Home',cost:190,desc:'Build a small home to customize beside the plaza.',reputation:5},
 {id:'delivery',title:'Delivery Van',cost:230,desc:'Send goods to customers. +15% contract rewards.',reputation:7},
 {id:'power',title:'Clean Power Station',cost:280,desc:'Support factories. +10% production.',reputation:10},
 {id:'office',title:'Executive Office',cost:340,desc:'Expand your company headquarters.',reputation:6},
 {id:'research',title:'Research Laboratory',cost:450,desc:'Open science innovation and +10% production.',reputation:12},
 {id:'train',title:'Worker Training Center',cost:520,desc:'Improve employee output by 15%.',reputation:10}
];
const LV_TECH=[
 {id:'energy',title:'Efficient Energy',cost:170,books:2,desc:'Machines use energy efficiently. +10% factory output.',boost:.10},
 {id:'logistics',title:'Smart Logistics',cost:290,books:3,desc:'Improve production coordination. +15% output.',boost:.15},
 {id:'automation',title:'Modern Automation',cost:620,books:5,desc:'Automate routine work. +25% output.',boost:.25}
];
function systemsBlank(){return {version:1,inventory:{},upgrades:{},tech:{},contracts:{},
  paid:0,earned:0,rep:0,lastTick:Date.now(),mailRead:[],ledger:[],achievements:[],training:{},treasures:[],npcDone:[],homeDecor:{},chainMade:0};}
function systemsClean(raw){
 const s=systemsBlank();
 if(!raw||raw.version!==1)return s;
 const count=(v,max)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
 for(const id of Object.keys(LV_PRODUCTS))s.inventory[id]=count(raw.inventory?.[id],1e7);
 for(const e of LV_UPGRADES)s.upgrades[e.id]=Boolean(raw.upgrades?.[e.id]);
 for(const e of LV_TECH)s.tech[e.id]=Boolean(raw.tech?.[e.id]);
 for(const e of LV_CONTRACTS){const state=raw.contracts?.[e.id];if(state==='accepted'||state==='done')s.contracts[e.id]=state;}
 s.paid=count(raw.paid,1e12);s.earned=count(raw.earned,1e12);s.rep=count(raw.rep,1e7);
 s.lastTick=count(raw.lastTick,1e15)||Date.now();
 s.mailRead=Array.isArray(raw.mailRead)?raw.mailRead.filter(x=>typeof x==='string').slice(0,100):[];
 s.ledger=Array.isArray(raw.ledger)?raw.ledger.filter(x=>x&&typeof x.note==='string').slice(0,100):[];
 s.achievements=Array.isArray(raw.achievements)?raw.achievements.filter(x=>typeof x==='string').slice(0,100):[];
 s.treasures=Array.isArray(raw.treasures)?raw.treasures.filter(x=>LV_TREASURES.some(t=>t.id===x)):[];
 s.npcDone=Array.isArray(raw.npcDone)?raw.npcDone.filter(x=>LV_CHARACTERS.some(n=>n.id===x)):[];
 for(const d of LV_HOME_DECOR)s.homeDecor[d.id]=Boolean(raw.homeDecor?.[d.id]);
 s.chainMade=count(raw.chainMade,1e9);
 for(const id of Object.keys(LV_PRODUCTS))s.training[id]=count(raw.training?.[id],5);
 return s;
}
function systemsLoad(){try{return systemsClean(JSON.parse(localStorage.getItem(LV_SYSTEMS_KEY)));}catch{return systemsBlank();}}
var systemsState=systemsLoad();
function systemsSave(){try{if(!trial)localStorage.setItem(LV_SYSTEMS_KEY,JSON.stringify(systemsState));}catch{}}
function systemsLedger(note,coins){
 systemsState.ledger.unshift({note,coins,at:Date.now()});systemsState.ledger=systemsState.ledger.slice(0,100);
}
function systemsMultiplier(){
 let multiplier=1;
 if(systemsState.upgrades.power)multiplier+=.10;
 if(systemsState.upgrades.research)multiplier+=.10;
 if(systemsState.upgrades.train)multiplier+=.15;
 for(const tech of LV_TECH)if(systemsState.tech[tech.id])multiplier+=tech.boost;
 return multiplier;
}
function systemsExpenseRate(){
 const factories=CITY_SITES.filter(x=>x.kind==='factory'&&cityState.sites[x.id]?.built);
 const staff=factories.reduce((n,x)=>n+(cityState.sites[x.id]?.staff||0),0);
 return staff?Math.max(1,Math.ceil(staff*.8)+Math.floor(factories.length/2)):0;
}
function systemsNetIncome(){return Math.max(0,Math.floor(cityIncome()*systemsMultiplier())-systemsExpenseRate());}
function systemsTick(now=Date.now()){
 let ticks=Math.floor((now-systemsState.lastTick)/CITY_TICK_MS);
 if(ticks<0){systemsState.lastTick=now;systemsSave();return;}
 ticks=Math.min(720,ticks);
 if(!ticks)return;
 systemsState.lastTick=now;
 // The original 3D city engine already grants gross machine income. Apply
 // game expenses, research bonuses and virtual products for the same tick interval.
 const gross=cityIncome(),bonus=Math.floor(gross*(systemsMultiplier()-1))*ticks;
 const charge=Math.min(cityState.coins+bonus,systemsExpenseRate()*ticks);
 cityState.coins+=bonus-charge;cityState.lifetime+=bonus;
 systemsState.paid+=charge;systemsState.earned+=gross*ticks+bonus;
 for(const [id,product] of Object.entries(LV_PRODUCTS)){
  const unit=cityState.sites[id];
  if(unit?.built&&unit.staff>0){
   const count=Math.max(1,Math.floor(ticks*unit.staff*Math.max(1,unit.level)*Math.max(1,unit.landLevel||1)/2));
   systemsState.inventory[id]=Math.min(1e7,(systemsState.inventory[id]||0)+count);
  }
 }
 // Two connected factories create additional finished goods from raw lumber.
 const workshop=cityState.sites.workshop,lumber=cityState.sites.lumber;
 if(workshop?.staff>0&&lumber?.staff>0){
  const batches=Math.min(Math.floor((systemsState.inventory.lumber||0)/2),ticks*workshop.staff);
  if(batches>0){
   systemsState.inventory.lumber-=batches*2;
   systemsState.inventory.workshop=(systemsState.inventory.workshop||0)+batches;
   systemsState.chainMade+=batches;
  }
 }
 if(charge)systemsLedger('Factory wages, power and maintenance',-charge);
 systemsSave();citySave();
 systemsAchievements();
}
function systemsSpend(cost,note){
 if(!citySpend(cost))return false;
 systemsState.paid+=cost;systemsLedger(note,-cost);systemsSave();return true;
}
function systemsUpgrade(id){
 const upgrade=LV_UPGRADES.find(x=>x.id===id);
 if(!upgrade||systemsState.upgrades[id])return;
 if(!systemsSpend(upgrade.cost,'City upgrade: '+upgrade.title)){notice('You need more coins for '+upgrade.title+'.');return;}
 systemsState.upgrades[id]=true;systemsState.rep+=upgrade.reputation;
 systemsSave();systemsPanel('upgrades');notice(upgrade.title+' unlocked!');
}
function systemsResearch(id){
 const tech=LV_TECH.find(x=>x.id===id);
 if(!tech||systemsState.tech[id])return;
 if(cityCompleted()<tech.books){notice('Read '+tech.books+' different books before researching this.');return;}
 if(!systemsSpend(tech.cost,'Research: '+tech.title)){notice('Not enough coins for research.');return;}
 systemsState.tech[id]=true;systemsSave();systemsPanel('research');
 notice('Research complete: '+tech.title+'.');
}
function systemsTraining(id){
 const unit=cityState.sites[id],site=CITY_SITES.find(x=>x.id===id);
 if(!unit?.built||!unit.staff||!site||site.kind!=='factory')return;
 const level=systemsState.training[id]||0,cost=40*(level+1);
 if(level>=5)return;
 if(!systemsSpend(cost,'Employee training at '+site.title))return;
 systemsState.training[id]=level+1;systemsSave();systemsPanel('workers');notice('Worker training upgraded.');
}
function systemsContractReady(contract){
 return Object.entries(contract.goods).every(([id,count])=>(systemsState.inventory[id]||0)>=count);
}
function systemsContract(id){
 const order=LV_CONTRACTS.find(x=>x.id===id);
 if(!order||cityCompleted()<order.needs)return;
 const state=systemsState.contracts[id];
 if(state==='done')return;
 if(state!=='accepted'){
  systemsState.contracts[id]='accepted';systemsLedger('Accepted contract: '+order.title,0);systemsSave();systemsPanel('contracts');
  notice('Contract accepted. Build factories and produce the required goods.');return;
 }
 if(!systemsContractReady(order)){notice('Keep producing goods before dispatching this order.');return;}
 for(const [product,count] of Object.entries(order.goods))systemsState.inventory[product]-=count;
 const reward=Math.floor(order.reward*(systemsState.upgrades.delivery?1.15:1));
 cityEarn(reward,10);systemsState.earned+=reward;systemsState.rep+=order.reputation;
 systemsState.contracts[id]='done';systemsLedger('Delivered contract: '+order.title,reward);
 systemsSave();systemsAchievements();systemsPanel('contracts');
 notice('Order delivered! Earned '+reward+' coins.');
}
function systemsRestock(id){
 const product=LV_PRODUCTS[id];if(!product)return;
 const cost=25,quantity=5;
 if(!systemsSpend(cost,'Warehouse supplies: '+product.name))return;
 systemsState.inventory[id]=Math.min(1e7,(systemsState.inventory[id]||0)+quantity);
 systemsSave();systemsPanel('warehouse');
 notice('Purchased '+quantity+' '+product.name+' for '+cost+' coins.');
}
function systemsAchievements(){
 const milestones=[
  ['reader',cityCompleted()>=1,'First Reader',25],
  ['bookworm',cityCompleted()>=5,'Knowledge Seeker',75],
  ['landowner',cityLandOwned()>=1,'Landowner',20],
  ['builder',cityBuildingsBuilt()>=2,'Growing Town',60],
  ['employer',cityPopulation()>=3,'Hiring Manager',45],
  ['trader',Object.values(systemsState.contracts).some(x=>x==='done'),'First Shipment',35],
  ['mayor',systemsState.rep>=40,'City Leader',110],
  ['explorer',systemsState.treasures.length>=1,'Curious Explorer',35]
 ];
 let changed=false;
 for(const [id,ready,title,reward] of milestones){
  if(!ready||systemsState.achievements.includes(id))continue;
  systemsState.achievements.push(id);systemsState.rep+=3;cityState.coins+=reward;cityState.lifetime+=reward;
  systemsLedger('Achievement: '+title,reward);changed=true;
 }
 if(changed){systemsSave();citySave();citySync();}
}
function systemsMail(){
 const messages=[
 {id:'welcome',from:'Maya · Town Library',subject:'Welcome to LumenVale',
  body:'Our library is open. Read, complete questions, and use your coins to buy land. The town needs thoughtful builders.'},
 {id:'purchase',from:'City Land Registry',subject:'How property ownership works',
  body:'First purchase a plot, then build and improve it. Land development and factory machinery upgrades both cost coins.'},
 {id:'first-employee',from:'Workers Union',subject:'Employees need salaries',unlock:cityPopulation()>=1,
  body:'Your workers earn coins for your factories, but wages, power, and maintenance are deducted automatically every production cycle.'},
 {id:'supply',from:'Principal Harper',subject:'School furniture request',unlock:cityState.sites.workshop?.built,
  body:'We need five finished pieces of furniture. Open Contracts to accept the order and arrange delivery.',button:'Open contracts',tab:'contracts'},
 {id:'training',from:'Engineering Society',subject:'Improve your machines',unlock:cityCompleted()>=2,
  body:'Research new machinery technologies at City Hall. Reading more books unlocks deeper knowledge.',button:'Open research',tab:'research'},
 {id:'treasure',from:'Explorer Guild',subject:'A hidden reward awaits',unlock:cityCompleted()>=2,
  body:'Reading unlocks discoveries. Look for a small treasure chest near the river on the eastern side of town. More clues appear under City Hall > Exploration.'},
 {id:'council',from:'LumenVale Council',subject:'Community development',unlock:cityLandOwned()>=2,
  body:'Your city is growing. Invest in streetlights, gardens, housing, and public services to improve its reputation.',button:'City upgrades',tab:'upgrades'}
 ];
 return messages.filter(m=>m.unlock!==false);
}
function systemsMailBox(){
 const messages=systemsMail();
 const cards=messages.map(m=>'<button class="lv-mail" type="button" data-systems="letter" data-id="'+m.id+'">'+
 '<span class="lv-mail-icon">'+(systemsState.mailRead.includes(m.id)?'✉':'✦')+'</span><span><small>'+esc(m.from)+'</small>'+
 '<strong>'+esc(m.subject)+'</strong><em>'+ (systemsState.mailRead.includes(m.id)?'Read':'New message')+'</em></span></button>').join('');
 cityPanel('City Post Office','Your Mailbox','<p>Messages from residents, clients, and city services. New business opportunities appear as your city develops.</p>'+
 '<div class="lv-mailbox">'+cards+'</div>');
}
function systemsReadLetter(id){
 const m=systemsMail().find(x=>x.id===id);if(!m)return;
 if(!systemsState.mailRead.includes(id)){systemsState.mailRead.push(id);systemsSave();}
 cityPanel('Mail / '+esc(m.from),esc(m.subject),
 '<article class="lv-letter"><small>From: '+esc(m.from)+'</small><p>'+esc(m.body)+'</p>'+
 '<div class="city-actions">'+(m.tab?'<button class="button primary" type="button" data-systems="tab" data-tab="'+m.tab+'">'+esc(m.button)+'</button>':'')+
 '<button class="button" type="button" data-systems="mail">Back to mailbox</button></div></article>');
}
function systemsPanel(tab='overview'){
 const buttons=[['overview','Overview'],['contracts','Contracts'],['warehouse','Warehouse'],['workers','Workers'],['home','Home'],['research','Research'],['upgrades','City Upgrades'],['newspaper','Newspaper'],['explore','Explore'],['achievements','Achievements']];
 const nav='<div class="lv-city-nav">'+buttons.map(([id,title])=>'<button class="'+(id===tab?'active':'')+'" data-systems="tab" data-tab="'+id+'">'+title+'</button>').join('')+'</div>';
 let html='';
 if(tab==='overview'){
  const gross=cityIncome(),net=systemsNetIncome();
  html='<p>Your company turns knowledge into land, jobs and services. Review your finances before expanding.</p>'+
   '<div class="lv-kpis"><div><small>Wallet</small><strong>'+cityState.coins.toLocaleString()+'</strong></div>'+
   '<div><small>Gross / 5 sec</small><strong>'+gross+'</strong></div>'+
   '<div><small>Expenses / 5 sec</small><strong>'+systemsExpenseRate()+'</strong></div>'+
   '<div><small>Est. net / 5 sec</small><strong>'+net+'</strong></div>'+
   '<div><small>Reputation</small><strong>'+systemsState.rep+'</strong></div>'+
   '<div><small>Employees</small><strong>'+cityPopulation()+'</strong></div></div>'+ 
   '<p><b>Connected supply chain:</b> '+systemsState.chainMade+' furniture units manufactured using lumber from your own mill.</p>'+
   '<h3>Recent financial activity</h3>'+systemsState.ledger.slice(0,10).map(t=>'<p class="lv-ledger">'+esc(t.note)+
   '<b class="'+(t.coins>=0?'positive':'negative')+'">'+(t.coins>0?'+':'')+t.coins+' coins</b></p>').join('');
 }else if(tab==='contracts'){
  html='<p>Deliver finished goods for extra coins and reputation. Employees produce inventory every five seconds.</p>'+
   LV_CONTRACTS.filter(x=>cityCompleted()>=x.needs).map(o=>{
    const status=systemsState.contracts[o.id],ready=status==='accepted'&&systemsContractReady(o);
    return '<article class="lv-contract"><small>'+esc(o.customer)+' · '+(status==='done'?'Delivered':status==='accepted'?'Active order':'Available')+'</small>'+
     '<h3>'+esc(o.title)+'</h3><p>'+Object.entries(o.goods).map(([id,n])=>n+' '+LV_PRODUCTS[id].name+' (have '+(systemsState.inventory[id]||0)+')').join(' · ')+'</p>'+
     '<b>Reward: '+Math.floor(o.reward*(systemsState.upgrades.delivery?1.15:1))+' coins</b>'+
     (status==='done'?' <span>✓ Complete</span>':'<button class="button primary" data-systems="contract" data-id="'+o.id+'" '+
     (status==='accepted'&&!ready?'disabled':'')+'>'+(status==='accepted'?'Dispatch order':'Accept contract')+'</button>')+'</article>';
   }).join('');
  if(!html.includes('lv-contract'))html+='<p>Read your first library book to unlock contracts.</p>';
 }else if(tab==='warehouse'){
  html='<p>Factories create products over time. You can also purchase emergency stock when a customer needs a faster delivery.</p>'+
   '<div class="lv-warehouse">'+Object.entries(LV_PRODUCTS).map(([id,p])=>'<div><b>'+p.icon+' '+p.name+'</b>'+
   '<strong>'+ (systemsState.inventory[id]||0)+' units</strong><button class="button" data-systems="restock" data-id="'+id+'" '+(cityState.coins<25?'disabled':'')+'>Buy 5 · 25 coins</button></div>').join('')+'</div>';
 }else if(tab==='home'){
  html='<p>Purchase your first home in City Upgrades, then personalize it with additions that consume coins and visibly change the neighborhood.</p>'+LV_HOME_DECOR.map(x=>
   '<article class="lv-contract"><h3>'+esc(x.name)+'</h3><p>'+esc(x.desc)+'</p><small>Cost: '+x.cost+' coins</small> '+
   (systemsState.homeDecor[x.id]?'<b>✓ Installed</b>':'<button class="button primary" data-systems="decor" data-id="'+x.id+'" '+
   (!systemsState.upgrades.home||cityState.coins<x.cost?'disabled':'')+'>Purchase</button>')+'</article>').join('');
 }else if(tab==='workers'){
  html='<p>Employees produce goods and earn income automatically. Every worker has a professional role. Training costs coins and improves productivity.</p>'+
   CITY_SITES.filter(x=>x.kind==='factory'&&cityState.sites[x.id]?.built).map(x=>{
    const unit=cityState.sites[x.id],level=systemsState.training[x.id]||0;
    return '<article class="lv-contract"><h3>'+esc(x.title)+'</h3><p>Workers: '+unit.staff+
    ' · Machinery level '+unit.level+' · Training level '+level+'/5</p>'+
    '<div class="lv-roster">'+LV_PERSONNEL.slice(0,unit.staff).map((who,i)=>'<span>👷 '+esc(who)+' · Skill '+(1+level+(i%2))+'</span>').join('')+'</div>'+ 
    '<button class="button" data-systems="train" data-id="'+x.id+'" '+(!unit.staff||level===5||cityState.coins<40*(level+1)?'disabled':'')+
    '>Train staff · '+(40*(level+1))+' coins</button></article>';
   }).join('')||'<p>Build a factory and hire your first employee to begin training.</p>';
 }else if(tab==='research'){
  html='<p>Read new books to unlock technologies. Each research project permanently improves factory output.</p>'+
   LV_TECH.map(x=>'<article class="lv-contract"><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p>'+
    '<small>Requires '+x.books+' books · '+x.cost+' coins</small> '+
    (systemsState.tech[x.id]?'<b>✓ Researched</b>':'<button class="button primary" data-systems="research" data-id="'+x.id+'" '+
    (cityCompleted()<x.books||cityState.coins<x.cost?'disabled':'')+'>Research</button>')+'</article>').join('');
 }else if(tab==='upgrades'){
  html='<p>Improve homes, delivery services, streets, utilities and public life. These are optional coin-consuming investments.</p>'+
   '<div class="lv-upgrade-grid">'+LV_UPGRADES.map(x=>'<article class="lv-upgrade"><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p>'+
    '<small>+'+x.reputation+' city reputation</small>'+
    (systemsState.upgrades[x.id]?'<b>✓ Owned</b>':'<button class="button primary" data-systems="upgrade" data-id="'+x.id+'" '+
    (cityState.coins<x.cost?'disabled':'')+'>Purchase · '+x.cost+'</button>')+'</article>').join('')+'</div>';
 }else if(tab==='newspaper'){
  const date=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  html='<article class="lv-newspaper"><small>THE LUMENVALE LEDGER · '+esc(date)+'</small>'+
  '<h2>A City Built One Story at a Time</h2>'+
  '<p>Readers have completed '+cityCompleted()+' books and purchased '+cityLandOwned()+' plots. '+cityPopulation()+
  ' employees are helping grow local businesses.</p>'+
  '<h3>On the economic front</h3><p>Factories are producing approximately '+cityIncome()+
  ' coins every five seconds before expenses. Salaries and utilities cost '+systemsExpenseRate()+' coins per cycle.</p>'+
  '<h3>Opportunities</h3><p>'+LV_CONTRACTS.filter(x=>!systemsState.contracts[x.id]&&cityCompleted()>=x.needs).length+
  ' unclaimed delivery contracts are available. The local library welcomes new readers.</p></article>';
 }else if(tab==='explore'){
  html='<p>Read a book to learn clues, explore the city in first person, and collect hidden treasure chests. New caches unlock as you learn.</p>'+LV_TREASURES.map(t=>
   '<article class="lv-contract"><h3>'+ (systemsState.treasures.includes(t.id)?'✓ Found':'Hidden cache')+'</h3><p>'+esc(t.clue)+'</p><small>Requires '+t.unlock+' completed books · Reward '+t.reward+' coins</small></article>').join('');
 }else if(tab==='achievements'){
  const list=[['reader','First Reader'],['bookworm','Knowledge Seeker'],['landowner','Landowner'],['builder','Growing Town'],
   ['employer','Hiring Manager'],['trader','First Shipment'],['mayor','City Leader']];
  html='<p>Achievements reward reading, city planning, and running a business.</p>'+
   list.map(([id,title])=>'<p class="lv-achievement"><span>'+(systemsState.achievements.includes(id)?'🏆':'◇')+'</span>'+
   esc(title)+'<b>'+(systemsState.achievements.includes(id)?'Unlocked':'Locked')+'</b></p>').join('');
 }
 cityPanel('LumenVale / City Hall','City Management',nav+'<div class="lv-city-content">'+html+'</div>');
}
function systemsTalk(id){
 const c=LV_CHARACTERS.find(x=>x.id===id);if(!c)return;
 const done=systemsState.npcDone.includes(id);
 cityPanel('Citizens / '+esc(c.title),esc(c.name),
  '<article class="lv-letter"><p>'+esc(c.story)+'</p>'+
  (done?'<p><b>✓ Conversation mission complete</b></p>':
   '<h3>'+esc(c.question)+'</h3><div class="lv-dialogue-answers">'+c.choices.map((choice,i)=>
    '<button class="button" data-systems="npc-answer" data-id="'+c.id+'" data-answer="'+i+'">'+esc(choice)+'</button>').join('')+'</div>')+
  '<p class="city-sub">Reading missions improve your reputation and earn one-time coin rewards.</p></article>');
}
function systemsAnswerNpc(id,answer){
 const c=LV_CHARACTERS.find(x=>x.id===id);
 if(!c||systemsState.npcDone.includes(id))return;
 if(Number(answer)!==c.answer){notice('That answer does not match the conversation. Read it again.');return;}
 systemsState.npcDone.push(id);systemsState.rep+=3;
 cityEarn(c.reward,10);systemsLedger('Helped '+c.name,c.reward);systemsSave();
 systemsTalk(id);notice('Great reading! +'+c.reward+' coins.');
}
function systemsDecor(id){
 const d=LV_HOME_DECOR.find(x=>x.id===id);
 if(!d||!systemsState.upgrades.home||systemsState.homeDecor[id])return;
 if(!systemsSpend(d.cost,'Home decoration: '+d.name)){notice('Not enough coins for this home upgrade.');return;}
 systemsState.homeDecor[id]=true;systemsState.rep+=2;systemsSave();
 systemsPanel('home');notice(d.name+' added to your home.');
}
function systemsTreasure(id){
 const t=LV_TREASURES.find(x=>x.id===id);if(!t||systemsState.treasures.includes(id))return;
 if(cityCompleted()<t.unlock){notice('Read '+t.unlock+' books to unlock this treasure.');return;}
 systemsState.treasures.push(id);systemsState.earned+=t.reward;
 cityEarn(t.reward,10);systemsLedger('Found hidden chest: '+id,t.reward);systemsSave();systemsAchievements();
 notice('Hidden treasure discovered! +'+t.reward+' coins.');
}
function systemsVehicle(){
 if(!systemsState.upgrades.delivery){notice('Buy the delivery van from City Hall first.');return;}
 if(!systemsDriving&&Math.hypot(player.x-23.5,player.z-9)>5){notice('Visit the delivery van at the warehouse to drive.');return;}
 systemsDriving=!systemsDriving;
 notice(systemsDriving?'Driving delivery van · WASD steer · V or E to exit':'Exited the delivery van.');
}
function systemsNearby(player){
 if(systemsDriving)return {id:'vehicle',system:true,label:'Exit delivery van'};
 if(systemsState.upgrades.delivery&&Math.hypot(player.x-23.5,player.z-9)<3)return {id:'vehicle',system:true,label:'Drive your delivery van'};
 for(const t of LV_TREASURES){
  if(cityCompleted()>=t.unlock&&!systemsState.treasures.includes(t.id)&&Math.hypot(player.x-t.x,player.z-t.z)<2.8)
    return {id:'treasure-'+t.id,system:true,label:'Discover hidden treasure'};
 }
 for(const c of LV_CHARACTERS){if(Math.hypot(player.x-c.x,player.z-c.z)<2.1)return {id:'citizen-'+c.id,system:true,label:'Talk to '+c.name};}
 if(Math.hypot(player.x-5.1,player.z+4.12)<2.5)return {id:'mailbox',system:true,label:'Check your mailbox'};
 return null;
}
function systemsInteract(target){
 if(target?.id==='vehicle')systemsVehicle();
 else if(target?.id?.startsWith('citizen-'))systemsTalk(target.id.slice(8));
 else if(target?.id?.startsWith('treasure-'))systemsTreasure(target.id.slice(9));
 else if(target?.id==='mailbox')systemsMailBox();
 else if(target?.id==='depot')systemsPanel('warehouse');
 else systemsPanel('overview');
}
function systemsInit(){
 document.addEventListener('click',event=>{
  const b=event.target.closest('[data-systems]');if(!b)return;
  const action=b.dataset.systems,id=b.dataset.id;
  if(action==='tab')systemsPanel(b.dataset.tab);
  if(action==='mail')systemsMailBox();
  if(action==='letter')systemsReadLetter(id);
  if(action==='upgrade')systemsUpgrade(id);
  if(action==='research')systemsResearch(id);
  if(action==='restock')systemsRestock(id);
  if(action==='train')systemsTraining(id);
  if(action==='decor')systemsDecor(id);
  if(action==='npc-answer')systemsAnswerNpc(id,b.dataset.answer);
  if(action==='contract')systemsContract(id);
 });
 window.addEventListener('keydown',event=>{
  if(event.repeat||event.target.matches?.('input,textarea,select')||dialog.open||terminal.open)return;
  const key=event.key.toLowerCase();
  if(key==='b'){event.preventDefault();systemsPanel('overview');}
  if(key==='n'){event.preventDefault();systemsMailBox();}
  if(key==='v'){event.preventDefault();systemsVehicle();}
 });
 systemsTick();systemsAchievements();
 setInterval(()=>{systemsTick();citySync();},1000);
}
