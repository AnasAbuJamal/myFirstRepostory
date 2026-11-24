const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
function run(){
 const context=vm.createContext({Date,Math,Number,JSON,performance:{now:()=>10000}});
 const stubs="var trial=true;var esc=String;var byId=()=>null;var notice=()=>{};var modal=()=>{};var stopMovement=()=>{};var dialog={open:false};var document={pointerLockElement:null};";
 vm.runInContext(stubs+'\n'+source('city.js')+'\n'+source('city-world.js'),context);
 return context;
}
test('fresh city starts without coins or automated factories',()=>{
 const world=run();
 assert.equal(vm.runInContext('cityState.coins',world),0);
 assert.equal(vm.runInContext('cityCompleted()',world),0);
 assert.equal(vm.runInContext('cityIncome()',world),0);
 assert.equal(vm.runInContext('cityNearby({x:14,z:8})',world),null);
});
test('reading unlocks plots and charges the correct amounts',()=>{
 const world=run();
 vm.runInContext("cityState.coins=100;cityState.books.forest={count:1,last:0};cityBuyLand('workshop');cityBuild('workshop');cityHire('workshop');",world);
 assert.equal(vm.runInContext('cityState.coins',world),20);
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

test('land must be purchased before construction, using a separate coin transaction',()=>{
 const world=run();
 vm.runInContext("cityState.coins=200;cityState.books.forest={count:1,last:0};",world);
 assert.equal(vm.runInContext("cityBuild('workshop')",world),false);
 assert.equal(vm.runInContext("cityBuyLand('workshop')",world),true);
 assert.equal(vm.runInContext('cityState.coins',world),180);
 assert.equal(vm.runInContext('cityState.sites.workshop.owned',world),true);
 assert.equal(vm.runInContext('cityState.sites.workshop.built',world),false);
 assert.equal(vm.runInContext("cityBuyLand('workshop')",world),false);
 assert.equal(vm.runInContext("cityBuild('workshop')",world),true);
 assert.equal(vm.runInContext('cityState.coins',world),140);
});
test('land improvements are finite purchases that increase factory coin production',()=>{
 const world=run();
 vm.runInContext("cityState.coins=1000;cityState.books.forest={count:1,last:0};cityBuyLand('workshop');cityBuild('workshop');cityHire('workshop');",world);
 const initial=vm.runInContext('cityIncome()',world);
 assert.equal(initial,3);
 assert.equal(vm.runInContext("cityImproveLand('workshop')",world),true);
 assert.equal(vm.runInContext('cityState.sites.workshop.landLevel',world),2);
 assert.equal(vm.runInContext('cityIncome()',world),3);
 vm.runInContext("cityHire('workshop')",world);
 assert.ok(vm.runInContext('cityIncome()',world)>initial);
 vm.runInContext("cityImproveLand('workshop');cityImproveLand('workshop')",world);
 assert.equal(vm.runInContext("cityImproveLand('workshop')",world),false);
 assert.equal(vm.runInContext('cityState.sites.workshop.landLevel',world),4);
});
test('saved older built properties retain land ownership after migration',()=>{
 const world=run();
 const state=vm.runInContext("cityClean({version:1,coins:99,sites:{workshop:{built:true,staff:2,level:3}}})",world);
 assert.equal(state.sites.workshop.owned,true);
 assert.equal(state.sites.workshop.built,true);
 assert.equal(state.sites.workshop.landLevel,1);
 assert.equal(state.sites.workshop.staff,2);
});
test('reading requirement and balance prevent premature purchases',()=>{
 const world=run();
 vm.runInContext("cityState.coins=999",world);
 assert.equal(vm.runInContext("cityBuyLand('workshop')",world),false);
 vm.runInContext("cityState.coins=1;cityState.books.forest={count:1,last:0}",world);
 assert.equal(vm.runInContext("cityBuyLand('workshop')",world),false);
 assert.equal(vm.runInContext('cityState.coins',world),1);
});
