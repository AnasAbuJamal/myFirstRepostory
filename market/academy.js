/* LumenVale Teacher Studio: JSON lessons, local student profiles, and a genre library. */
const ACADEMY_CONTENT='lumenvale-pack-v1',ACADEMY_PROGRESS='lumenvale-progress-v1',ACADEMY_PROFILE='lumenvale-profile-v1';
function academyStored(key,fallback){try{const d=JSON.parse(localStorage.getItem(key));return d&&typeof d==='object'?d:fallback;}catch{return fallback;}}
const academy={books:academyStored(ACADEMY_CONTENT,[]),progress:academyStored(ACADEMY_PROGRESS,{}),
 profile:academyStored(ACADEMY_PROFILE,{nickname:'Explorer'}),genre:'All',query:''};
function academySave(){
 try{localStorage.setItem(ACADEMY_CONTENT,JSON.stringify(academy.books));
 localStorage.setItem(ACADEMY_PROGRESS,JSON.stringify(academy.progress));
 localStorage.setItem(ACADEMY_PROFILE,JSON.stringify(academy.profile));}catch{notice('Browser storage is full. Export your lesson pack.');}
}
function academyStr(v,max=1000){return String(v??'').trim().slice(0,max);}
function academyWords(pages){return pages.join(' ').trim().split(/\s+/).filter(Boolean).length;}
function academySafeId(title){const slug=academyStr(title,80).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,56);return slug.startsWith('lesson-')?slug:'lesson-'+slug;}
function academyQuestions(book){return Array.isArray(book.questions)&&book.questions.length?book.questions:[{prompt:book.question,choices:book.answers,correctIndex:book.correct}];}
function academyDraft(pages,count){
 const passage=pages.join(' ');
 const sentences=(passage.match(/[^.!?]+[.!?]?/g)||[]).map(x=>x.trim()).filter(x=>x.split(/\s+/).length>=7);
 const vocab=[...new Set((passage.toLowerCase().match(/[a-z]{5,}/g)||[]).filter(x=>!['there','where','their','which','about','would','could','these','those','before','after','because','should','every'].includes(x)))];
 if(!sentences.length||vocab.length<4)throw Error('Add a longer passage or supply your own questions.');
 const out=[];
 for(let i=0;i<Math.min(10,count);i++){
  const sentence=sentences[i%sentences.length];
  const words=(sentence.match(/[a-z]{5,}/gi)||[]).filter(x=>vocab.includes(x.toLowerCase()));
  if(!words.length)continue;
  const correct=words[(i*3+1)%words.length];
  const choices=[correct,...vocab.filter(x=>x!==correct.toLowerCase()&&!words.some(y=>y.toLowerCase()===x)).slice(i*2,i*2+3)];
  for(const v of vocab)if(choices.length<4&&v!==correct.toLowerCase()&&!choices.includes(v))choices.push(v);
  if(choices.length<3)continue;
  const position=i%choices.length,ordered=choices.slice(position).concat(choices.slice(0,position));
  out.push({prompt:'Which word completes this sentence? '+sentence.replace(correct,'_____'),
   choices:ordered,correctIndex:ordered.indexOf(correct),generated:true});
 }
 if(!out.length)throw Error('Could not produce a draft question. Supply a teacher-written question.');
 return out;
}
function academyNormalizeQuestion(q){
 const prompt=academyStr(q?.prompt??q?.question,500),choices=q?.choices??q?.answers;
 const answer=Number(q?.correctIndex??q?.correct);
 if(prompt.length<8||!Array.isArray(choices)||choices.length<2||choices.length>5||
  choices.some(c=>typeof c!=='string'||!c.trim()||c.length>250)||
  !Number.isInteger(answer)||answer<0||answer>=choices.length)throw Error('Invalid question; use prompt, choices, and correctIndex.');
 return {prompt,choices:choices.map(x=>academyStr(x,250)),correctIndex:answer,generated:Boolean(q.generated)};
}
function academyNormalize(raw,i=0,count=3){
 if(!raw||typeof raw!=='object')throw Error('Book '+(i+1)+' must be an object.');
 const title=academyStr(raw.title,90),genre=academyStr(raw.genre??raw.genera??raw.category??'General',36);
 const pages=Array.isArray(raw.pages)?raw.pages.map(x=>academyStr(x,2200)).filter(Boolean):
  (academyStr(raw.text??raw.passage,12000).match(/[\s\S]{1,1200}/g)||[]);
 if(title.length<3||!pages.length||pages.length>14||pages.join(' ').length>16000)throw Error('Book '+(i+1)+' needs a title and 1–14 pages.');
 const questions=Array.isArray(raw.questions)&&raw.questions.length?raw.questions.map(academyNormalizeQuestion):
  academyDraft(pages,Math.max(1,Math.min(10,Number(raw.questionCount??count)||3)));
 const wordCount=academyWords(pages), declared=Number(raw.wordCount||raw.numberOfWords||0);
 const id=academySafeId(raw.id||title);
 return {id,title,genre,shelf:genre,pages,questions,question:questions[0].prompt,
  answers:questions[0].choices,correct:questions[0].correctIndex,wordCount,
  declaredWordCount:declared>0?declared:null,level:academyStr(raw.readingLevel||'General',30),
  reward:Math.max(15,Math.min(300,Number(raw.reward)||Math.round(30+wordCount*.15))),
  xp:Math.max(10,Math.min(90,Math.round(wordCount/8))),published:raw.published!==false,custom:true};
}
function academyMount(){
 for(let i=CITY_BOOKS.length-1;i>=0;i--)if(CITY_BOOKS[i].custom)CITY_BOOKS.splice(i,1);
 if(!Array.isArray(academy.books))academy.books=[];
 const good=[];
 academy.books.slice(0,100).forEach((raw,i)=>{try{const b=academyNormalize(raw,i);good.push(b);if(b.published)CITY_BOOKS.push(b);}catch{}});
 academy.books=good;
}
function academyImport(data,count=3){
 const items=Array.isArray(data)?data:Array.isArray(data?.books)?data.books:[data];
 if(!items.length||items.length>100)throw Error('JSON must contain 1–100 books.');
 const next=items.map((b,i)=>academyNormalize(b,i,count));
 const existing=[...academy.books];
 for(const book of next){const index=existing.findIndex(x=>x.id===book.id);if(index>=0)existing[index]=book;else existing.push(book);}
 if(existing.length>100)throw Error('Browser limit: 100 custom books. Export a pack first.');
 academy.books=existing;academyMount();academySave();citySync();
 return {imported:next.length,mismatches:next.filter(x=>x.declaredWordCount&&x.declaredWordCount!==x.wordCount)};
}
function academyRecord(book,session){
 const name=academy.profile.nickname||'Explorer';
 const student=academy.progress[name]||{books:{},xp:0,attempts:[]};
 const questions=academyQuestions(book).length,mistakes=session?.mistakes||0;
 student.books[book.id]={title:book.title,genre:book.genre||book.shelf,wordCount:book.wordCount||academyWords(book.pages),
  questions,mistakes,date:Date.now()};
 student.xp+=(book.xp||10);
 student.attempts.unshift({book:book.title,questions,mistakes,date:Date.now()});
 student.attempts=student.attempts.slice(0,100);
 academy.progress[name]=student;academySave();
}
function academyLibrary(){
 const genres=['All',...new Set(CITY_BOOKS.map(x=>x.genre||x.shelf))];
 if(!genres.includes(academy.genre))academy.genre='All';
 const books=CITY_BOOKS.filter(x=>academy.genre==='All'||(x.genre||x.shelf)===academy.genre);
 const filters=genres.map(g=>'<button class="lv-filter '+(academy.genre===g?'active':'')+'" data-academy="genre" data-genre="'+esc(g)+'">'+esc(g)+'</button>').join('');
 const cards=books.map(book=>{
  const completed=cityState.books[book.id]?.count;
  return '<button class="lv-library-book" type="button" data-academy="open" data-id="'+esc(book.id)+'">'+
  '<span class="lv-book-cover"><small>✦ LIBRARY ✦</small><strong>'+esc(book.title)+'</strong></span>'+
  '<span class="lv-book-details"><small>'+esc(book.genre||book.shelf)+' · '+(book.custom?'Teacher book':'Starter book')+'</small>'+
  '<b>'+esc(book.title)+'</b><em>'+ (book.wordCount||academyWords(book.pages))+' words · '+academyQuestions(book).length+
  ' questions · '+book.reward+' coins</em><small>'+(completed?'✓ Completed':'Ready to read')+'</small></span></button>';
 }).join('');
 cityPanel('LumenVale / Library','The Knowledge Library',
 '<p>Explore books by genre. Read, complete questions, and earn the coins used to build your city.</p>'+
 '<div class="lv-library-tools"><input id="lv-search" type="search" placeholder="Search books" value="'+esc(academy.query)+'">'+
 '<button class="button" data-academy="teacher" type="button">Teacher Studio</button></div>'+
 '<div class="lv-genres">'+filters+'</div><div class="lv-book-grid">'+(cards||'<p>No books in this section.</p>')+'</div>');
}
function academyProfile(){
 const nickname=academy.profile.nickname||'Explorer',profile=academy.progress[nickname];
 const books=Object.values(profile?.books||{});
 cityPanel('Student Role','Your Reading Journal',
 '<div class="city-factory-grid"><div><small>Student</small><b>'+esc(nickname)+'</b></div>'+
 '<div><small>Completed books</small><b>'+books.length+'</b></div><div><small>Learning XP</small><b>'+(profile?.xp||0)+'</b></div>'+
 '<div><small>Words practiced</small><b>'+books.reduce((n,b)=>n+b.wordCount,0)+'</b></div></div>'+
 '<div class="lv-progress">'+(books.map(b=>'<p><b>'+esc(b.title)+'</b> · '+b.wordCount+' words · '+b.questions+' questions · '+b.mistakes+' mistakes</p>').join('')||
 '<p>No reading sessions completed yet.</p>')+'</div>'+
 '<form id="lv-profile-form" class="lv-form"><label>Student nickname<input name="nickname" maxlength="30" required value="'+esc(nickname)+'"></label>'+
 '<button class="button primary" type="submit">Change nickname</button></form>');
}
function academyTeacher(){
 const rows=academy.books.map(b=>'<div class="lv-teacher-book"><span><b>'+esc(b.title)+'</b><small>'+esc(b.genre)+' · '+b.wordCount+
 ' words · '+b.questions.length+' questions'+(b.questions.some(q=>q.generated)?' · draft questions':'')+'</small></span>'+
 '<span><button class="button" type="button" data-academy="publish" data-id="'+esc(b.id)+'">'+(b.published?'Unpublish':'Publish')+'</button>'+
 '<button class="button" type="button" data-academy="delete" data-id="'+esc(b.id)+'">Delete</button></span></div>').join('');
 const students=Object.entries(academy.progress);
 const totalWords=academy.books.reduce((n,b)=>n+b.wordCount,0);
 const totalQuestions=academy.books.reduce((n,b)=>n+b.questions.length,0);
 const genres=[...new Set(academy.books.map(x=>x.genre))];
 const genreTotals=genres.map(genre=>({genre,count:academy.books.filter(b=>b.genre===genre).length}));
 const chart=genreTotals.map(g=>'<div class="lv-genre-chart-row"><span>'+esc(g.genre)+'</span><div><i style="width:'+Math.round(100*g.count/Math.max(1,academy.books.length))+'%"></i></div><b>'+g.count+'</b></div>').join('');
 cityPanel('Teacher Role','Teacher Content Studio',
 '<div class="lv-teacher-notice"><b>Local teacher dashboard</b><p>No password protection or cloud synchronization yet. Import and export course packs to move content between computers.</p></div>'+
 '<div class="city-factory-grid"><div><small>Teacher books</small><b>'+academy.books.length+'</b></div>'+ 
 '<div><small>Total words</small><b>'+totalWords.toLocaleString()+'</b></div>'+
 '<div><small>Questions available</small><b>'+totalQuestions+'</b></div>'+
 '<div><small>Genres</small><b>'+genres.length+'</b></div>'+
 '<div><small>Reading profiles</small><b>'+students.length+'</b></div></div>'+
 '<h3>Import lesson JSON</h3><p>A lesson may have genre (or genera), title, pages/text, wordCount and questions. If questions are omitted, the game generates draft fill-in questions; please review them before assigning.</p>'+
 '<div class="lv-import"><input type="file" id="lv-import-json" accept=".json,application/json">'+
 '<label>Generate questions <input type="number" min="1" max="10" value="3" id="lv-question-count"></label></div>'+
 '<div class="city-actions"><button class="button" data-academy="template">JSON template</button>'+
 '<button class="button" data-academy="export">Export books</button>'+
 '<button class="button" data-academy="report">Export progress</button></div>'+
 '<h3>Create a book manually</h3><form id="lv-create-form" class="lv-form">'+
 '<label>Book title<input name="title" maxlength="90" required></label>'+
 '<label>Genre<input name="genre" maxlength="36" required></label>'+
 '<label>Reading level<input name="readingLevel" maxlength="30" value="Beginner"></label>'+
 '<label>Draft question count<input name="questionCount" type="number" min="1" max="10" value="3"></label>'+
 '<label>Reading passage<textarea name="text" rows="4" required maxlength="12000"></textarea></label>'+
 '<button class="button primary" type="submit">Create book</button></form>'+
 '<h3>Manage published books</h3><div class="lv-teacher-books">'+(rows||'<p>No imported books yet.</p>')+'</div>'+
 '<h3>Reading by genre</h3><div class="lv-genre-chart">'+(chart||'<p>No imported genres yet.</p>')+'</div>'+ 
 '<h3>Student progress on this device</h3><div class="lv-table-scroll"><table class="lv-table"><thead><tr><th>Nickname</th><th>Books</th><th>Words</th><th>Questions</th><th>Corrections</th><th>XP</th></tr></thead><tbody>'+
 (students.map(([name,data])=>{const books=Object.values(data.books||{});return '<tr><td>'+esc(name)+'</td><td>'+books.length+'</td><td>'+books.reduce((n,x)=>n+(x.wordCount||0),0)+
 '</td><td>'+books.reduce((n,x)=>n+(x.questions||0),0)+'</td><td>'+books.reduce((n,x)=>n+(x.mistakes||0),0)+'</td><td>'+data.xp+'</td></tr>';}).join('')||
 '<tr><td colspan="6">No reading data recorded yet.</td></tr>')+'</tbody></table></div>'+
 '<button class="button" data-academy="student">Switch to student view</button>');
}
function academyExport(filename,data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function academyTemplate(){
 return {version:1,books:[{id:'sample-market',title:'The Busy Market',genre:'Business',readingLevel:'Beginner',
 pages:['At the market, Maya sells apples to her neighbors. She checks the number of apples on her shelves and writes the prices clearly. Customers return because she treats them kindly.',
 'One afternoon Maya receives an order for twelve apples. She reads the order carefully and records the delivery time.'],
 wordCount:56,questionCount:2,questions:[{prompt:'What does Maya sell?',choices:['Apples','Shoes','Computers'],correctIndex:0},
 {prompt:'What does Maya record for the customer?',choices:['Delivery time','Bus number','Shoe size'],correctIndex:0}]}]};
}
function academyInstall(){
 academyMount();citySync();
 const bar=document.querySelector('.walk-head');
 if(bar){
  const b=document.createElement('button');b.type='button';b.className='top-icon lv-top-button';b.textContent='✎ Teacher';b.title='Open Teacher Studio';
  bar.insertBefore(b,bar.lastElementChild);b.addEventListener('click',academyTeacher);
  const p=document.createElement('button');p.type='button';p.className='top-icon lv-top-button';p.textContent='◉ Student';p.title='Open student journal';
  bar.insertBefore(p,bar.lastElementChild);p.addEventListener('click',academyProfile);
 }
 document.addEventListener('click',event=>{
  const control=event.target.closest('[data-academy]');if(!control)return;
  const act=control.dataset.academy,id=control.dataset.id;
  if(act==='teacher')academyTeacher();
  if(act==='student'){academyProfile();}
  if(act==='genre'){academy.genre=control.dataset.genre;academyLibrary();}
  if(act==='open')cityOpenBook(id);
  if(act==='publish'){const b=academy.books.find(x=>x.id===id);if(b){b.published=!b.published;academyMount();academySave();academyTeacher();}}
  if(act==='delete'){const b=academy.books.find(x=>x.id===id);
   if(b&&confirm('Delete the imported book "'+b.title+'"?')){academy.books=academy.books.filter(x=>x.id!==id);academyMount();academySave();academyTeacher();}}
  if(act==='template')academyExport('lumenvale-template.json',academyTemplate());
  if(act==='export')academyExport('lumenvale-books.json',{version:1,books:academy.books});
  if(act==='report')academyExport('lumenvale-progress.json',academy.progress);
 });
 document.addEventListener('input',event=>{
  if(event.target.id==='lv-search'){
   academy.query=event.target.value.toLowerCase().slice(0,70);
   document.querySelectorAll('.lv-library-book').forEach(el=>el.hidden=!el.textContent.toLowerCase().includes(academy.query));
  }
 });
 document.addEventListener('change',async event=>{
  if(event.target.id!=='lv-import-json')return;
  const file=event.target.files?.[0];if(!file)return;
  if(file.size>2*1024*1024){notice('JSON file too large (maximum 2 MB).');return;}
  try{
   const raw=JSON.parse(await file.text());
   const outcome=academyImport(raw,Number(byId('lv-question-count')?.value)||3);
   academyTeacher();
   notice('Imported '+outcome.imported+' books.'+(outcome.mismatches.length?' Check declared word counts.':''));
  }catch(e){notice('Import error: '+String(e.message).slice(0,150));}
 });
 document.addEventListener('submit',event=>{
  if(event.target.id==='lv-create-form'){
   event.preventDefault();
   try{const data=Object.fromEntries(new FormData(event.target));
    academyImport(data,Number(data.questionCount)||3);academyTeacher();notice('New book created. Review generated questions.');}
   catch(e){notice('Book error: '+e.message);}
  }
  if(event.target.id==='lv-profile-form'){
   event.preventDefault();const data=new FormData(event.target);
   const nickname=academyStr(data.get('nickname'),30).replace(/[<>"]/g,'');
   if(['__proto__','constructor','prototype'].includes(nickname.toLowerCase())){notice('Choose another nickname.');return;}
   if(!nickname)return;
   academy.profile.nickname=nickname;academySave();academyProfile();
  }
 });
}
