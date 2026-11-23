/* LumenVale local progress backup — versioned JSON, explicit allowlist.
 * Adapted from awesome-gamedev-agent-skills / save-systems:
 * validate before writing, preserve prior saves and fail safely.
 * This backs up browser PRACTICE progress only. It is not teacher verification.
 */
const LV_BACKUP_KIND='lumenvale.local-save-backup';
const LV_BACKUP_VERSION=1;
const LV_BACKUP_MAX_BYTES=5*1024*1024;
function gameBackupKeys(){
 return [SAVE_KEY,CITY_SAVE_KEY,CITY_MOUSE_PREFS_KEY,LV_SYSTEMS_KEY,
  CAMPUS_SAVE_KEY,ACADEMY_CONTENT,ACADEMY_PROGRESS,ACADEMY_PROFILE,
  JOB_SAVE_KEY,PATHWAYS_KEY,LMS_SAVE_KEY,SCHOOL_CHALLENGE_KEY];
}
function gameBackupSnapshot(store=localStorage){
 const records={};
 for(const key of gameBackupKeys()){
  const value=store.getItem(key);
  if(value==null)continue;
  if(value.length>1024*1024)throw Error('One save section is too large to export.');
  const parsed=JSON.parse(value);
  if(!parsed||typeof parsed!=='object')throw Error('Stored save section is not valid JSON: '+key);
  records[key]=value;
 }
 const data={kind:LV_BACKUP_KIND,version:LV_BACKUP_VERSION,exportedAt:new Date().toISOString(),records};
 if(JSON.stringify(data).length>LV_BACKUP_MAX_BYTES)throw Error('Backup exceeds the 5 MB limit.');
 return data;
}
function gameBackupValidate(raw){
 if(!raw||raw.kind!==LV_BACKUP_KIND||raw.version!==LV_BACKUP_VERSION||
  !raw.records||typeof raw.records!=='object'||Array.isArray(raw.records))
  throw Error('Not a LumenVale version 1 local-save backup.');
 const allowed=new Set(gameBackupKeys()),entries=Object.entries(raw.records);
 if(entries.length<1||entries.length>allowed.size)throw Error('Backup has no records or too many records.');
 let total=0;
 for(const [key,source] of entries){
  if(!allowed.has(key)||typeof source!=='string')throw Error('Unknown save section in backup.');
  if(source.length<2||source.length>1024*1024)throw Error('Save section size is invalid: '+key);
  total+=source.length;
  const value=JSON.parse(source);
  if(value==null||typeof value!=='object')throw Error('Invalid progress data in '+key);
 }
 if(total>LV_BACKUP_MAX_BYTES)throw Error('Backup exceeds 5 MB.');
 return entries;
}
function gameBackupApply(raw,store=localStorage){
 const entries=gameBackupValidate(raw);
 if(trial)throw Error('Restoring saves is disabled in practice mode.');
 const previous=new Map(entries.map(([key])=>[key,store.getItem(key)]));
 const changed=[];
 try{
  for(const [key,value] of entries){
   store.setItem(key,value);
   changed.push(key);
  }
 }catch(error){
  // Keep the old save intact if storage is full or a write is rejected.
  for(const key of changed.reverse()){
   try{
    const before=previous.get(key);
    if(before==null)store.removeItem(key);
    else store.setItem(key,before);
   }catch{}
  }
  throw Error('Storage write failed; the previous save was restored.');
 }
 return entries.length;
}
function gameBackupDownload(){
 const snapshot=gameBackupSnapshot();
 const file=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file),link=document.createElement('a');
 link.download='lumenvale-progress-'+new Date().toISOString().slice(0,10)+'.json';
 link.href=url;
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function gameBackupHome(){
 cityPanel('LumenVale / Local Saves','Save and Restore Progress',
  '<p>Make a backup of your city, school practice, reading, jobs and settings. Your progress is still saved in this browser, not automatically synchronized to another device.</p>'+
  '<div class="phone-backup-actions">'+
   '<button type="button" class="button primary" data-backup="export">Download full backup</button>'+
   '<label>Restore from a LumenVale backup file'+
    '<input id="lv-backup-file" type="file" accept=".json,application/json" '+(trial?'disabled':'')+'></label>'+
  '</div>'+
  '<p class="phone-backup-warning">Restoring replaces matching local save sections. Export your current progress first. Imported practice scores remain unverified. Backup files can contain your student nicknames and writing: keep them private.</p>'+
  '<button type="button" class="button" data-phone-backup-back="1">Back to City Phone</button>');
}
function gameBackupInit(){
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-phone-backup-back]')){phoneOpen('tools');return;}
  if(event.target.closest('[data-backup="export"]')){
   try{gameBackupDownload();notice('Your progress backup was downloaded.');}
   catch(e){notice('Backup failed: '+String(e?.message||e).slice(0,130));}
  }
 });
 document.addEventListener('change',async event=>{
  if(event.target.id!=='lv-backup-file')return;
  const file=event.target.files?.[0];
  if(!file)return;
  try{
   if(file.size<2||file.size>LV_BACKUP_MAX_BYTES)throw Error('Backup must be less than 5 MB.');
   const raw=JSON.parse(await file.text());
   const entries=gameBackupValidate(raw);
   if(!window.confirm('Replace '+entries.length+' local progress sections? Download your current backup first.'))return;
   const count=gameBackupApply(raw);
   notice('Restored '+count+' progress sections. Reloading game.');
   location.reload();
  }catch(e){notice('Restore failed: '+String(e?.message||e).slice(0,130));}
 });
}
