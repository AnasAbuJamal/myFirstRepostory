const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
function run(){
 const context=vm.createContext({Date,Math,Number,JSON,performance:{now:()=>10000}});
 const stubs="var trial=true;var byId=()=>null;var notice=()=>{};var modal=()=>{};var stopMovement=()=>{};var dialog={open:false};var document={pointerLockElement:null};";
 vm.runInContext(stubs+'\n'+source('city.js')+'\n'+source('city-world.js'),context);
 return context;
}
test('fresh city starts without coins or automated factories',()=>{
 const world=run();
 assert.equal(vm.runInContext('cityState.coins',world),0);
 assert.equal(vm.runInContext('cityCompleted()',world),0);
 assert.equal(vm.runInContext('cityIncome()',world),0);
 assert.equal(vm.runInContext('cityNearby({x:14,z:8}).id',world),'library');
});
test('reading unlocks plots and charges the correct amounts',()=>{
 const world=run();
 vm.runInContext("cityState.coins=100;cityState.books.forest={count:1,last:0};cityBuild('workshop');cityHire('workshop');",world);
 assert.equal(vm.runInContext('cityState.coins',world),40);
 assert.equal(vm.runInContext('cityIncome()',world),3);
 assert.equal(vm.runInContext("cityState.sites.workshop.staff",world),1);
 assert.equal(vm.runInContext('cityCanWalk(-13,11)',world),false);
 assert.equal(vm.runInContext('cityCanWalk(-13,6)',world),true);
});
test('production is earned by elapsed ticks and is capped at one hour',()=>{
 const world=run();
 vm.runInContext("cityState.sites.workshop={built:true,staff:2,level:2};cityState.lastTick=1000000;",world);
 assert.equal(vm.runInContext('cityTick(1010000)',world),24);
 assert.equal(vm.runInContext('cityState.coins',world),24);
 assert.equal(vm.runInContext('cityTick(1010000)',world),0);
 assert.equal(vm.runInContext('cityTick(1010000+86400000)',world),720*12);
});
test('first correct quiz earns coins once; wrong answers do not',()=>{
 const world=run();
 vm.runInContext("cityBookSession={id:'forest',page:1,started:0};cityAnswer(0);",world);
 assert.equal(vm.runInContext('cityState.coins',world),0);
 vm.runInContext('cityAnswer(1)',world);
 assert.equal(vm.runInContext('cityState.coins',world),48);
 assert.equal(vm.runInContext('cityCompleted()',world),1);
});
test('invalid saved state cannot create unlimited employees or negative coins',()=>{
 const world=run();
 const result=vm.runInContext("cityClean({version:1,coins:-99,sites:{workshop:{built:true,staff:100,level:100}}})",world);
 assert.equal(result.coins,0);
 assert.equal(result.sites.workshop.staff,6);
 assert.equal(result.sites.workshop.level,10);
});
