const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const realm = vm.createContext({});
const logic = vm.runInContext(source('story.js') + '\n' + source('rules.js') + '\n' + source('walk.js') + '\n' + source('reports.js') +
  '\n({cleanProgress, shopTotals, replyOrder, replyNotes, completeVisit, completeLevel, canWalk, walkStep, nearbyInteraction, walletHistory, START_POSITION})',realm);
const asPlain = value => JSON.parse(JSON.stringify(value));

test('confirm, reserve, and sell Lina’s first order once', () => {
  let state = logic.cleanProgress();
  assert.deepEqual(asPlain(logic.shopTotals(state)),{
    coins:20,onShelf:8,reserved:0,available:8,inbound:0,sold:0,receipts:[],
  });
  const invalid = logic.replyOrder(state,'lina','Hi Lina, you can pick up three kits on Thursday at 4 p.m. for 21 coins. Labels are included.');
  assert.equal(invalid.state,state);
  assert.equal(invalid.notes.length,1);
  state = logic.replyOrder(state,'lina','Hi Lina, your three kits cost twenty-one coins, including labels. See you Friday at four p.m.').state;
  assert.equal(state.step,1);
  assert.equal(logic.shopTotals(state).reserved,3);
  assert.equal(logic.shopTotals(state).available,5);
  assert.equal(logic.shopTotals(state).coins,20);
  state = logic.completeVisit(state);
  assert.equal(state.step,2);
  assert.equal(logic.shopTotals(state).coins,41);
  assert.equal(logic.shopTotals(state).onShelf,5);
  assert.equal(logic.completeVisit(state),state);
});

test('restock payment precedes delivery and Omar can collect on Wednesday noon', () => {
  let state = logic.cleanProgress({version:1,step:2});
  assert.equal(logic.replyOrder(state,'omar','Please pick up six kits for 42 coins on Wednesday at noon.').state,state);
  assert.equal(logic.replyOrder(state,'maya','Can you bring two packs of four kits to my office Wednesday at 10 a.m.?').state,state);
  state = logic.replyOrder(state,'maya','Please bring one pack at ten a.m. on Wednesday. Thanks, Maya.').state;
  let wallet = logic.shopTotals(state);
  assert.equal(state.step,3);
  assert.equal(wallet.coins,25);
  assert.equal(wallet.inbound,4);
  assert.equal(wallet.onShelf,5);
  assert.equal(logic.replyOrder(state,'omar','Six kits will be ready Tuesday at 5 p.m. and the total is forty-two coins.').state,state);
  state = logic.replyOrder(state,'omar','Tuesday is too early. You can pick up all six Wednesday at midday for forty-two coins.').state;
  assert.equal(state.step,4);
  state = logic.completeVisit(state);
  assert.equal(state.step,5);
  wallet = logic.shopTotals(state);
  assert.equal(wallet.onShelf,9);
  assert.equal(wallet.reserved,6);
  assert.equal(wallet.inbound,0);
});

test('product explanation, optional building, and carried-over balances', () => {
  let state=logic.cleanProgress({version:1,step:5});
  assert.equal(logic.replyOrder(state,'counter','It includes a pot, seeds and a label. Everything is included.').state,state);
  state=logic.replyOrder(state,'counter','The kit contains a pot, a packet of seeds, and a label. She will need soil and water.').state;
  const wallet=logic.shopTotals(state);
  assert.equal(state.step,6);
  assert.equal(wallet.coins,67);
  assert.equal(wallet.onShelf,3);
  assert.equal(wallet.sold,9);
  const office=logic.completeLevel(state,false);
  const stand=logic.completeLevel(state,true);
  assert.equal(office.step,7);
  assert.equal(stand.step,7);
  assert.equal(logic.shopTotals(office).coins,67);
  assert.equal(logic.shopTotals(stand).coins,42);
  assert.equal(logic.completeLevel(stand,true),stand);
  assert.equal(logic.shopTotals(logic.cleanProgress(asPlain(stand))).coins,42);
});

test('validation handles browser save data defensively', () => {
  const state=logic.cleanProgress({
    version:1,step:-1,stand:true,words:['seeds','unknown','seeds','constructor'],
    drafts:{lina:'Practice',maya:5},coins:999,
  });
  assert.equal(state.step,0);
  assert.equal(state.stand,false);
  assert.deepEqual(asPlain(state.words),['seeds']);
  assert.deepEqual(asPlain(state.drafts),{lina:'Practice'});
  assert.equal(logic.shopTotals(state).coins,20);
});


test('the player can leave through the open door and must approach the desk', () => {
  const view = {doorOpen:false,stand:false};
  assert.equal(logic.nearbyInteraction(logic.START_POSITION,false,null,false).id,'seat');
  assert.equal(logic.nearbyInteraction({x:0,z:-6},false,null,false),null);
  assert.equal(logic.canWalk(2.62,-3.72,view),false);
  assert.equal(logic.canWalk(2.62,-3.72,{...view,doorOpen:true}),true);
  assert.equal(logic.canWalk(1,-3.72,{...view,doorOpen:true}),false);
  assert.equal(logic.canWalk(-4.3,-12.45,{...view,stand:true}),false);
  let player = {x:2.62,z:-2.7,yaw:0,pitch:0};
  for(let i=0;i<36;i++)player=logic.walkStep(player,1,0,1/60,{...view,doorOpen:true});
  assert.ok(player.z < -4);
});

test('wallet graph records the opening, payments, restock and optional stand', () => {
  const end=logic.cleanProgress({version:1,step:7,stand:true});
  assert.deepEqual(asPlain(logic.walletHistory(end).map(point=>point.balance)),[20,41,25,67,42]);
});
