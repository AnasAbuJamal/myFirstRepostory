// Apps reuse the same gameplay panels and persistent data as their world locations.
function phoneOpen(){
 const app=(id,label,icon,color)=>'<button type="button" data-phone-app="'+id+'"><span class="phone-app-icon '+color+'"><svg aria-hidden="true"><use href="#'+icon+'"></use></svg></span>'+label+'</button>';
 const metric=(id,name)=>'<div><span>'+name+'</span><b id="phone-'+id+'"></b></div>';
 cityPanel('City Phone','Overview',
  '<div class="phone-overview">'+metric('lands','Land owned')+metric('income','Production income')+
    metric('coins','City wallet')+metric('stock','Goods in stock')+'</div>'+
  '<p class="phone-goal">'+esc(missions[state.step])+'</p>'+
  '<nav class="phone-apps" aria-label="City apps">'+
    app('property','Properties','window-icon','jade')+app('production','Production','chart-icon','gold')+app('garage','Garage','door-icon','sage')+
    app('map','Map','map-icon','sage')+app('mail','Mail','mail','blue')+
    app('architect','Build','plant','jade')+app('library','Library','book','gold')+
    app('school','School','orders','blue')+app('careers','Careers','door-icon','sage')+
    app('words','My Words','book','jade')+app('journal','Journal','orders','gold')+
    app('guide','Settings','help-icon','sage')+app('fullscreen','Fullscreen','window-icon','blue')+
  '</nav>');
 dialog.dataset.surface='phone';
 byId('phone-back').hidden=true;
 citySync();
}
function phoneSync(){
 if(!dialog.open||dialog.dataset.surface!=='phone')return;
 const values={
  lands:cityLandOwned()+' / '+CITY_SITES.length,
  income:cityIncome().toLocaleString()+' / 5s',
  coins:cityState.coins.toLocaleString(),
  stock:Object.values(systemsState.inventory).reduce((total,count)=>total+count,0).toLocaleString()
 };
 for(const [name,value] of Object.entries(values)){
  const stat=byId('phone-'+name);
  if(stat.textContent!==value)stat.textContent=value;
 }
}
function phoneInit(){
 const apps={property:cityPortfolio,production:()=>systemsPanel('warehouse'),garage:()=>systemsPanel('garage'),map:campusMap,mail:systemsMailBox,
  architect:campusArchitect,library:cityBookList,school:campusSchool,careers:campusCareer,words:campusVocabulary,
  journal:academyProfile,guide:cityGuide,fullscreen:()=>{dialog.close();cityEnterFullscreen();}};
 byId('open-phone').addEventListener('click',phoneOpen);
 byId('phone-back').addEventListener('click',phoneOpen);
 dialog.addEventListener('click',event=>{
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
