/* Chromium regression: verify actual first-person movement, interior collisions,
   reachable school stations and academic dialogs, not merely that a canvas exists. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:850},deviceScaleFactor:1});
  const errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')warnings.push(m.text());});
  const url=process.env.LUMENVALE_TEST_URL||'http://127.0.0.1:8765/';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof window.pathwayHome==='function',{timeout:20000});
  const startup=await page.evaluate(()=>({
   hasCanvas:!!document.querySelector('#landscape'),
   hasPhone:!!document.querySelector('#open-phone'),
   hasEngine:typeof window.phoneOpen==='function',
   renderer:document.querySelector('#view')?.dataset.renderer||'webgl',
   catalogCount:LV_DEFAULT_ACADEMICS.courses.length,
   initialPosition:{x:player.x,z:player.z}
  }));
  assert.ok(startup.hasCanvas&&startup.hasPhone&&startup.hasEngine,'3D view or UI failed');
  assert.equal(startup.catalogCount,20,'Catalog not embedded');
  console.log('Startup renderer:',startup.renderer,'warnings:',warnings.join(' | '));
  assert.notEqual(startup.renderer,'illustrated','3D scene crashed into flat illustrated fallback');
  console.log('Renderer:',startup.renderer,'at',startup.initialPosition);

  // Verify the exact bundled Three.js subset accepts both new material systems.
  const textures=await page.evaluate(()=>{
   const T=globalThis.PineboundThree,skyScene=new T.Scene();
   const sky=createSkyAtmosphere({T,scene:skyScene,renderer:{isSoftware:false}});
   sky.update({phase:.77,now:8000,x:0,y:1.7,z:0});
   const group=new T.Group();
   const surfaces=applySchoolInteriorTextures({T,group,place:{room:[13,12]},low:false});
   return {skyName:sky.mesh?.name,skyCanvas:!!sky.mesh?.material?.map?.image,
    skyInScene:skyScene.children.includes(sky.mesh),surfaces,
    types:group.userData.schoolTextureTypes,allMapped:group.children.every(x=>!!x.material?.map)};
  });
  assert.equal(textures.skyName,'LumenVale textured atmosphere','Sky dome did not create');
  assert.ok(textures.skyCanvas&&textures.skyInScene,'Sky texture did not attach');
  assert.ok(textures.surfaces>=45,'Not enough textured school surfaces: '+textures.surfaces);
  assert.ok(textures.allMapped,'A school texture mesh has no image map');
  for(const material of ['tile','wood','carpet','plaster','ceiling','metal','cork','board']){
   assert.ok(textures.types.includes(material),'School material missing: '+material);
  }
  console.log('PASS: textured sky and '+textures.surfaces+' school surface overlays');

  // Walk into the school using the actual enter interaction.
  const entering=await page.evaluate(()=>{
   player={...player,x:-37,z:1.78,yaw:0,pitch:0};
   refreshPosition();drawScene();
   const target=worldInteraction();
   if(target?.key!=='enter'||target?.place?.id!=='school')
    return {target};
   districtInteract(target);
   return {entered:districtVisit?.place?.id,position:{x:player.x,z:player.z}};
  });
  assert.equal(entering.entered,'school','School entry was not accessible');
  const hall=await page.evaluate(()=>{
   const settings={doorOpen:false,stand:false};
   // Movement must be allowed along the entire center aisle, including the
   // former invisible office wall at z=4.1.
   const aisle=[9.5,7.5,5,4.1,2.5,0,-2.5,-5,-8].map(z=>({z,walk:canWalk(0,z,settings)}));
   const desks=districtVisit.place.desks;
   // A flood fill tests that every desk is reachable from the school entrance.
   const Q=[[0,19]],seen=new Set(['0,19']),reached=new Set();
   for(let i=0;i<Q.length;i++){
    const [a,b]=Q[i],x=a*.5,z=b*.5;
    for(const d of desks)if(Math.hypot(x-d.x,z-d.z)<d.r-.2)reached.add(d.key);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const nx=a+dx,nz=b+dz,key=nx+','+nz;
     if(seen.has(key)||Math.abs(nx)>25||Math.abs(nz)>23||!canWalk(nx*.5,nz*.5,settings))continue;
     seen.add(key);Q.push([nx,nz]);
    }
   }
   return {aisle,reached:[...reached],required:desks.map(d=>d.key),reachableCells:seen.size};
  });
  assert.ok(hall.aisle.every(p=>p.walk),'School aisle contains invisible blockers: '+JSON.stringify(hall.aisle));
  for(const d of hall.required) assert.ok(hall.reached.includes(d),'Unreachable school station: '+d);
  console.log('School hall and stations:',hall.reached.join(', '),'cells:',hall.reachableCells);

  // Real keyboard input, not only model-level walkStep.
  const previous=await page.evaluate(()=>player.z);
  await page.keyboard.down('w');await page.waitForTimeout(900);await page.keyboard.up('w');
  const moved=await page.evaluate(()=>player.z);
  assert.ok(moved<previous-.15,'W key did not move player forward in school: '+previous+' -> '+moved);
  await page.screenshot({path:'lumenvale-school-smoke.png'});
  console.log('School keyboard navigation:',previous.toFixed(2),'->',moved.toFixed(2));

  await page.evaluate(()=>window.pathwayHome());
  const ui=await page.evaluate(()=>({
   academicUI:(document.querySelector('#overlay')?.textContent||'').includes('Biochemistry')
  }));
  assert.equal(ui.academicUI,true,'Academic Pathways screen did not render');
  await page.evaluate(()=>window.pathwayTranscript());
  const transcript=await page.evaluate(()=>(document.querySelector('#overlay')||document.querySelector('dialog'))?.textContent||'');
  assert.match(transcript,/UNVERIFIED GAME RECORD/);
  // Canvas-style local learning portal: course navigation, lessons, exams,
  // assignment submission and manual teacher review all run in the browser.
  await page.evaluate(()=>lmsHome());
  assert.match(await page.locator('#overlay').innerText(),/My Learning Dashboard/);
  await page.locator('#overlay [data-lms="course"][data-id="BIO-M1"]').first().click();
  assert.match(await page.locator('#overlay').innerText(),/Cell Structure/);
  await page.locator('#overlay [data-lms="lesson"][data-id="BIO-M1"]').first().click();
  await page.locator('#overlay [data-lms="mark"]').first().click();
  const lessonDone=await page.evaluate(()=>lmsLearner().done['BIO-M1:cell-structures']);
  assert.equal(lessonDone,true,'Lesson completion did not persist');
  await page.evaluate(()=>lmsExamStart('BIO-M1','cell-structures'));
  for(const answer of [1,0,2]){
   await page.locator('#overlay [data-lms="exam-answer"][data-answer="'+answer+'"]').first().click();
  }
  assert.equal(await page.evaluate(()=>lmsLearner().exams['BIO-M1:cell-structures'].at(-1).score),100,'Exam scoring broken');
  await page.evaluate(()=>lmsCourse('BIO-M1','assignments'));
  await page.locator('#overlay [data-lms="assignment"]').first().click();
  await page.locator('#lms-submission-form textarea[name="answer"]').fill('Plant cells have a cell wall and chloroplasts; both plant and animal cells have a nucleus and cell membrane.');
  await page.locator('#lms-submission-form button[type="submit"]').click();
  assert.match(await page.locator('#overlay').innerText(),/Submitted/);
  await page.evaluate(()=>lmsTeacher());
  await page.locator('#overlay .lms-grade-form input[name="score"]').first().fill('18');
  await page.locator('#overlay .lms-grade-form textarea[name="feedback"]').first().fill('Good comparison of shared and different structures.');
  await page.locator('#overlay .lms-grade-form button').first().click();
  const graded=await page.evaluate(()=>lmsLearner().submissions['BIO-M1:compare-cells']);
  assert.equal(graded.points,18,'Teacher grading did not persist');
  await page.evaluate(()=>lmsCourse('BIO-M1','grades'));
  assert.match(await page.locator('#overlay').innerText(),/18 \/ 20/);
  console.log('PASS: Learning Hub enrollment, lesson, timed exam, assignment, teacher grading, gradebook');
  await page.screenshot({path:'lumenvale-academic-smoke.png'});
  assert.deepEqual(errors,[],'Unexpected browser JavaScript errors');
  assert.ok(!warnings.some(m=>m.includes('Using the illustrated office view')),
   'The 3D renderer failed: '+warnings.join('; '));
  console.log('PASS: playable 3D city, school movement, school stations, pathways, transcript');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
