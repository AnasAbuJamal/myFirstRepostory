/* Browser smoke test: run with LUMENVALE_TEST_URL or a local http.server. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:850},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.LUMENVALE_TEST_URL||'http://127.0.0.1:8765/';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof window.pathwayHome==='function',{timeout:20000});
  const state=await page.evaluate(()=>{
   window.pathwayHome();
   const overlay=document.querySelector('#overlay')||document.querySelector('dialog');
   return {hasCanvas:!!document.querySelector('canvas'),
    hasPhone:!!document.querySelector('#open-phone'),
    academicUI:(overlay?.textContent||'').includes('Biochemistry'),
    catalogCount:LV_DEFAULT_ACADEMICS.courses.length,
    hasEngine:typeof window.phoneOpen==='function'};
  });
  assert.equal(state.hasCanvas,true,'Game canvas missing');
  assert.equal(state.hasPhone,true,'Phone interaction missing');
  assert.equal(state.academicUI,true,'Academic Pathways screen did not render');
  assert.equal(state.catalogCount,20,'Catalog not embedded');
  assert.equal(state.hasEngine,true,'Game phone engine did not initialize');
  await page.evaluate(()=>window.pathwayTranscript());
  const transcript=await page.evaluate(()=>(document.querySelector('#overlay')||document.querySelector('dialog'))?.textContent||'');
  assert.match(transcript,/UNVERIFIED GAME RECORD/);
  await page.screenshot({path:'lumenvale-academic-smoke.png'});
  assert.deepEqual(errors,[],'Unexpected browser JavaScript errors');
  console.log('PASS: Game canvas, phone, university pathways, transcript, browser console');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
