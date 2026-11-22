function walletHistory(state) {
  let balance = 20;
  return [{ name: 'Open shop', short: 'Open', balance, delta: 0 },
    ...shopTotals(state).receipts.map(receipt => {
      balance += receipt.coins;
      const short = receipt.name.startsWith('Lina') ? 'Lina' : receipt.name.startsWith('Maya') ? 'Restock' :
        receipt.name.startsWith('Omar') ? 'Omar' : 'Stand';
      return { name: receipt.name, short, balance, delta: receipt.coins };
    })];
}

function walletChart(points) {
  const startX=53, stopX=441, baseline=157, ceiling=20, limit=80;
  const x = i => startX + i*(stopX-startX)/Math.max(points.length-1,1);
  const y = balance => baseline-(baseline-ceiling)*balance/limit;
  const path = points.map(({balance},i) => (i?'L':'M')+x(i)+' '+y(balance)).join(' ');
  const grid = [0,20,40,60,80].map(n => '<line x1="53" y1="'+y(n)+'" x2="441" y2="'+y(n)+
    '" stroke="#cbd5c2"/><text text-anchor="end" x="43" y="'+(y(n)+4)+'">'+n+'</text>').join('');
  const dots = points.map(({balance,short},i) => {
    const px=x(i), py=y(balance);
    return '<circle cx="'+px+'" cy="'+py+'" r="5" fill="#3a6b50" stroke="#fffdf3" stroke-width="2"/>'+
      '<text class="point-value" x="'+px+'" y="'+(py-11)+'" text-anchor="middle">'+balance+'</text>'+
      '<text x="'+px+'" y="178" text-anchor="middle">'+esc(short)+'</text>';
  }).join('');
  return '<div class="graph"><svg class="wallet-graph" viewBox="0 0 474 193" role="img" aria-label="Wallet balance after each transaction, in coins">'+
    grid+(points.length>1?'<path d="'+path+' L '+x(points.length-1)+' 157 L '+startX+' 157 Z" fill="#e3eddf" opacity=".65"/>'+
    '<path d="'+path+'" stroke="#406e55" stroke-width="3" fill="none"/>':'')+dots+'</svg></div>';
}

function renderReports() {
  const totals = shopTotals(state), history = walletHistory(state);
  const stock = [['Available',totals.available],['Reserved',totals.reserved],['Incoming',totals.inbound],['Sold',totals.sold]];
  const maximum = Math.max(1,...stock.map(([,amount])=>amount));
  content.innerHTML = '<article class="section-body report-layout"><h2 class="title" tabindex="-1">Shop reports</h2>'+
    '<div class="metrics"><div><small>Wallet balance</small><strong>'+totals.coins+' <span>coins</span></strong></div>'+
    '<div><small>Kits on shelf</small><strong>'+totals.onShelf+'</strong></div><div><small>Kits sold</small><strong>'+totals.sold+'</strong></div></div>'+
    '<section class="sheet report-sheet"><h3>Wallet balance</h3><p>Coins available after each completed transaction.</p>'+
    walletChart(history)+'<details><summary>Read as a table</summary><div class="table-scroll"><table><thead><tr>'+
    '<th scope="col">Transaction</th><th scope="col">Change</th><th scope="col">Balance</th></tr></thead><tbody>'+
    history.map(({name,balance,delta})=>'<tr><td>'+esc(name)+'</td><td>'+(delta>0?'+':'')+delta+'</td><td>'+balance+
      '</td></tr>').join('')+'</tbody></table></div></details></section>'+
    '<section class="sheet report-sheet"><h3>Garden kit counts</h3><p>Available and reserved kits are on the shelf. Incoming kits have yet to arrive.</p>'+
    '<dl class="stock-bars">'+stock.map(([name,amount])=>'<div><dt>'+name+'</dt>'+
      '<dd><span class="bar-track" aria-hidden="true"><span style="width:'+amount/maximum*100+'%"></span></span><b>'+amount+'</b></dd></div>').join('')+
    '</dl></section></article>';
}

let securityChannel = 'front';
function renderSecurity() {
  const current = SECURITY_CAMERAS[securityChannel];
  const pending = VISITORS[state.step];
  const waiting = pending ? pending.name+' is at the office door.' : 'The entrance is clear.';
  const pickup = state.stand ? 'The pickup stand is built.' : 'The lot is empty.';
  content.innerHTML = '<article class="section-body security-layout"><h2 class="title" tabindex="-1">Security cameras</h2>'+
    '<div class="feed-picker" aria-label="Select camera">'+Object.entries(SECURITY_CAMERAS).map(([id,feed])=>
      '<button type="button" class="button" data-action="feed" data-key="'+id+'" aria-pressed="'+(id===securityChannel)+'">'+esc(feed.name)+'</button>').join('')+'</div>'+
    '<figure class="security-screen"><canvas id="security-feed" aria-label="Live in-game view of '+esc(current.name)+'"></canvas>'+
    '<div class="feed-stamp"><span></span> '+(byId('view').dataset.renderer==='illustrated'?'Site map':'Live')+'</div><figcaption>'+esc(current.name)+'</figcaption></figure>'+
    '<div class="camera-status"><p><b>Entrance</b>'+esc(waiting)+'</p><p><b>Pickup lot</b>'+pickup+'</p></div></article>';
}

