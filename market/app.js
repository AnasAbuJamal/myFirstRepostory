const byId = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const symbol = name => '<svg aria-hidden="true"><use href="#' + name + '"></use></svg>';
const trial = new URLSearchParams(location.search).has('practice');
let state = readSave();
let tab = 'inbox';
let selectedMail = currentMail();
let player = { ...START_POSITION };
let doorOpen = false;
let activeVisitor = '';
let noticeTimer;
let recognition = null;
let scene = () => {};
let storageFailed = false;
const dialog = byId('overlay');
const terminal = byId('terminal');
const world = byId('view');
const content = byId('content');
const termExpression = new RegExp('\\b(' + Object.keys(WORDS)
  .sort((a,b) => b.length - a.length).map(word => word.endsWith('s') ? word : word + 's?').join('|') + ')\\b', 'gi');

const missions = [
  'Reply to Lina and confirm her first order.',
  'Lina is waiting outside. Stand up and walk to the door.',
  'Omar needs six kits. Read both emails and order enough new stock.',
  'Tell Omar when all six kits will be ready and how much they’ll cost.',
  'Maya is at the front door with your restock.',
  'Omar is at the front door. Meet him to finish the sale.',
  'Return to the computer to decide how to handle pickups.',
  'You served your first two customers. Nadia’s request is the start of the next chapter.',
];

function readSave() {
  if (trial) return cleanProgress();
  try {
    return cleanProgress(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'));
  } catch {
    return cleanProgress();
  }
}
function save() {
  if (trial) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    if (!storageFailed) notice('Browser storage is unavailable. Play can continue in this tab.');
    storageFailed = true;
  }
}
function notice(text) {
  const status = byId('notice');
  status.textContent = text;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { status.textContent = ''; }, 3900);
}
function button(label, action, key = '', style = '', icon = '') {
  return '<button class="button ' + style + '" type="button" data-action="' + action +
    '" data-key="' + esc(key) + '">' + (icon ? symbol(icon) : '') + esc(label) + '</button>';
}
function avatar(person, large = false) {
  return '<span aria-hidden="true" class="avatar ' + person.style + (large ? ' large' : '') + '">' + person.initials + '</span>';
}
function currentMail() {
  if (state.step === 2) return 'maya';
  if (state.step >= 3 && state.step <= 6) return 'omar';
  return state.step < FINAL_STEP ? 'lina' : 'gift';
}
function wordHTML(text) {
  return text.split(termExpression).map((part, i) => {
    if (!(i % 2)) return esc(part);
    const word = part.toLowerCase();
    const key = Object.hasOwn(WORDS, word) ? word : word.slice(0, -1);
    return '<button class="glossary" type="button" data-action="word" data-key="' + esc(key) + '">' + esc(part) + '</button>';
  }).join('');
}
function paragraphs(body) {
  return body.map(p => '<p>' + p.split('**').map((value,i) =>
    i % 2 ? '<strong>' + wordHTML(value) + '</strong>' : wordHTML(value)).join('') + '</p>').join('');
}
function drawScene(animate = '') {
  scene({
    player: terminal.open ? SEAT_POSITION : player,
    camera: terminal.open && tab === 'cameras' ? securityChannel : null,
    built: state.stand, visitor: activeVisitor, waiting: VISITORS[state.step]?.style,
    doorOpen, stock: shopTotals(state).onShelf, city:cityState, moving:moveKeys.has('w')||moveKeys.has('s')||moveKeys.has('a')||moveKeys.has('d'), sprinting:moveKeys.has('Shift'), driving:systemsDriving, animate,
  });
}
let lastInteraction = '';
function worldInteraction() {
  if (districtVisit) return districtNearby(player);
  if (systemsDriving) return systemsNearby(player);
  return districtNearby(player) || systemsNearby(player) || cityNearby(player) ||
    nearbyInteraction(player,doorOpen,VISITORS[state.step],state.stand);
}
function refreshPosition() {
  const place = districtVisit ? districtVisit.place.name : inOffice(player.x,player.z) ? 'Market Office' :
    state.stand && Math.hypot(player.x-STAND.x,player.z-STAND.z)<4.5 ? 'Pickup stand' :
    player.z < -12 ? 'Riverwalk' : districtName(player.x,player.z);
  if(byId('world-location').textContent!==place)byId('world-location').textContent=place;
  const target = worldInteraction();
  const name = target?.label || '';
  if (lastInteraction !== name) {
    lastInteraction=name;
    byId('interact').hidden=!name;
    byId('interact').querySelector('span').textContent=name;
  }
}
function renderStatus() {
  const totals = shopTotals(state);
  byId('coins').textContent = totals.coins + ' coins';
  byId('stock').textContent = totals.onShelf + ' kits';
  byId('inbox-count').textContent = Object.values(MAIL).filter(m => m.minStep <= state.step).length;
  refreshPosition();
}
function render(animate = '') {
  renderStatus();
  for (const b of document.querySelectorAll('[data-tab]')) {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  if (tab === 'inbox') renderInbox();
  if (tab === 'orders') renderOrders();
  if (tab === 'inventory') renderInventory();
  if (tab === 'words') renderWords();
  if (tab === 'reports') renderReports();
  if (tab === 'cameras') renderSecurity();
  drawScene(animate);
}
function openTab(nextTab, focusTitle = false) {
  stopDictating();
  tab = nextTab;
  render();
  if (focusTitle) content.querySelector('h2.title')?.focus({ preventScroll: false });
}
function advance(nextState, targetTab = 'inbox', animate = '') {
  if (nextState === state) return;
  activeVisitor = '';
  state = nextState;
  selectedMail = currentMail();
  save();
  openTab(targetTab);
  if (animate) drawScene(animate);
}

function renderInbox() {
  const items = Object.entries(MAIL).filter(([,mail]) => mail.minStep <= state.step);
  if (!items.some(([id]) => id === selectedMail)) selectedMail = currentMail();
  const mail = MAIL[selectedMail];
  const menu = items.map(([id, item]) => '<button type="button" data-action="mail" data-key="' + id +
    '" class="mail-row" aria-current="' + String(id === selectedMail) + '">' + avatar(item) +
    '<span class="mail-meta"><b>' + item.name + '</b><span class="mail-subject">' + item.subject +
    '</span><small>' + item.kind + '</small></span></button>').join('');
  const productSummary = selectedMail === 'lina' ? button('Read the product card', 'product', '', '', 'box') : '';
  const pending = selectedMail === 'omar' && state.step === 2
    ? '<div class="notice"><strong>Check the delivery first</strong><p>You have five kits on the shelf. Read Maya’s offer before promising all six.</p>' +
      button('Read Maya’s email', 'mail', 'maya', 'primary') + '</div>' : '';
  const done = state.sent[selectedMail] ? '<section class="thread"><h3>Your sent reply</h3><p class="player-message">' +
    esc(state.sent[selectedMail]) + '</p><h3>' + mail.name + ' replied</h3><p>' + mail.success + '</p></section>' : '';
  const visit = (selectedMail === 'lina' && state.step === 1) || (selectedMail === 'omar' && state.step === 5) || (selectedMail === 'maya' && state.step === 4)
    ? '<div class="notice"><strong>' + esc(VISITORS[state.step].title) + '</strong><p>Stand up and walk to the office door to meet them.</p></div>' : '';
  const exp = state.step === 6 ? '<div class="reader-tool">' + button('Plan your next step','expand','','primary') + '</div>' : '';
  const ending = selectedMail === 'gift'
    ? '<div class="sheet"><h3>Next chapter · The Gift Bundle</h3><p>Level 1 is complete. The next chapter begins with Nadia’s offer.</p></div>' : '';
  content.innerHTML = '<div class="inbox-layout"><aside class="mail-list"><h2>Messages</h2>' + menu +
    '</aside><article class="reader"><h2 class="title" tabindex="-1">' + mail.subject +
    '</h2><div class="reader-meta">' + avatar(mail,true) + '<div><b>' + mail.name + '</b><small>' + mail.time + ' · ' +
    mail.kind + '</small></div></div><div class="mail-paragraphs">' + paragraphs(mail.body) +
    '</div><div id="word-help" hidden></div><div class="reader-tool">' +
    button('Listen to email', 'listen-mail', selectedMail, 'ghost', 'sound-icon') + productSummary +
    '</div>' + pending + done + visit +
    (mail.actionStep === state.step ? replyForm(selectedMail, mail, 'Reply to ' + mail.name, 'Send reply') : '') +
    exp + ending + '</article></div>';
}
function replyForm(id, details, title, sendLabel) {
  const message = state.drafts[id] ?? details.draft;
  return '<form class="reply-box" data-message="' + id + '"><h3>' + title +
    '</h3><p>' + details.guidance + '</p><details><summary>What should my reply cover?</summary><ul>' +
    details.checklist.map(point => '<li>' + point + '</li>').join('') +
    '</ul></details><label for="reply-' + id + '">Your message</label><textarea id="reply-' + id +
    '" name="reply" rows="4" maxlength="1800" spellcheck="true">' + esc(message) + '</textarea>' +
    '<div class="reply-actions"><button type="submit" class="button primary">' + esc(sendLabel) + '</button>' +
    button('Dictate', 'dictate', id, '', 'mic-icon') + '</div><p class="voice-status" data-voice role="status" hidden></p>' +
    '<div class="notice blank" data-feedback role="status" aria-live="polite"></div></form>';
}
function chapterProduct() {
  return '<div class="product"><div><b>Inside each kit</b><ul>' + CATALOG.contents.map(x => '<li>' + x + '</li>').join('') +
    '</ul></div><div><b>Bring from home</b><ul>' + CATALOG.bring.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>';
}
function renderInventory() {
  const totals = shopTotals(state);
  const cards = [
    ['On the shelf', totals.onShelf, 'Kits physically in the office'],
    ['Available', totals.available, 'Kits free to sell'],
    ['Set aside for pickup', totals.reserved, 'Kits reserved from your shelf'],
    ['Incoming', totals.inbound, 'Kits ordered from Maya'],
  ];
  content.innerHTML = '<article class="section-body"><h2 class="title" tabindex="-1">Inventory</h2><div class="item-grid">' +
    cards.map(([title,count,summary]) => '<div class="mini-card"><span>' + title + '</span><b>' + count + '</b><span>' + summary + '</span></div>').join('') +
    '</div><div class="sheet"><h3>Garden kit · ' + CATALOG.kit + ' coins</h3><p>Product card</p>' + chapterProduct() +
    '</div><div class="sheet"><h3>Pickup stand</h3><p>' + (state.stand ? 'Open outside the office.' :
      state.step === FINAL_STEP ? 'The office counter is your pickup point.' : 'The lot is empty. Finish your first two sales to choose what to build.') +
    '</p><div class="buttons">' + button('Watch the pickup lot', 'feed', 'lot', '', 'cctv-icon') +
    (state.step === 6 ? button('Choose your pickup point', 'expand', '', 'primary') : '') + '</div></div></article>';
}
function renderOrders() {
  const totals = shopTotals(state);
  const lina = state.step >= 2 ? 'Paid' : state.step === 1 ? 'Reserved · Friday at 4 p.m.' : 'Waiting for your reply';
  const omar = state.step >= 6 ? 'Paid' : state.step === 5 ? 'Ready for pickup' :
    state.step === 4 ? 'Confirmed · Wednesday at noon' : 'Waiting for your reply';
  const may = state.step >= 5 ? 'Received · 4 kits' : 'Ordered · Wednesday at 10 a.m.';
  const orders = [
    ['Lina', '3 kits', lina], ...(state.step >= 2 ? [['Omar', '6 kits', omar]] : []),
    ...(state.step >= 3 ? [['Maya', '1 pack', may]] : []),
  ];
  content.innerHTML = '<article class="section-body"><h2 class="title" tabindex="-1">Orders</h2><p class="muted">Your customers, pickups, and supplier deliveries.</p>' +
    '<div class="table-scroll"><table><thead><tr><th scope="col">Contact</th><th scope="col">Order</th><th scope="col">Status</th></tr></thead><tbody>' +
    orders.map(row => '<tr>' + row.map(value => '<td>' + value + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div><div class="sheet"><h3>Wallet activity</h3><p>Opening balance · 20 coins</p>' +
    (totals.receipts.length ? '<div class="table-scroll"><table aria-label="Wallet activity"><thead><tr><th scope="col">Transaction</th><th scope="col">Day</th><th scope="col">Coins</th></tr></thead><tbody>' +
      totals.receipts.map(row => '<tr><td>' + row.name + '</td><td>' + row.date + '</td><td class="money' + (row.coins < 0 ? ' cost' : '') + '">' +
        (row.coins > 0 ? '+' : '') + row.coins + '</td></tr>').join('') + '</tbody></table></div>' :
      '<p>No paid orders yet.</p>') + '<p><strong>Balance · ' + totals.coins + ' coins</strong></p></div></article>';
}
function renderWords() {
  const all = Object.keys(WORDS).sort();
  const wordButtons = list => list.map(word => button(word, 'word', word)).join('');
  content.innerHTML = '<article class="section-body"><h2 class="title" tabindex="-1">Wordbook</h2>' +
    '<p class="muted">Select a word to see its Arabic meaning, hear it, or save it for later.</p><div id="word-help" hidden></div>' +
    '<div class="sheet"><h3>Saved words</h3><div id="saved-list" class="word-list">' +
    (state.words.length ? wordButtons(state.words) : '<p>Save a word from an email or from the list below.</p>') +
    '</div></div><div class="sheet"><h3>Words in this chapter</h3><div class="word-list">' + wordButtons(all) + '</div></div></article>';
}
function showWord(word, focus = true) {
  const panel = byId('word-help'), entry = WORDS[word];
  if (!panel || !entry) return;
  panel.hidden = false;
  panel.className = 'word-help';
  panel.innerHTML = '<h3 tabindex="-1">' + esc(word) + '</h3><p class="ar" lang="ar" dir="rtl">' + entry[0] +
    '</p><p>' + entry[1] + '</p><div class="buttons">' + button('Listen', 'say-word', word, '', 'sound-icon') +
    button('Listen slowly', 'slow-word', word) +
    button(state.words.includes(word) ? 'Remove from saved words' : 'Save word', 'save-word', word) + '</div>';
  if (focus) panel.querySelector('h3').focus({ preventScroll: false });
}
function playVoice(text, slow = false) {
  const speech = window.speechSynthesis;
  if (!speech) return notice('Your browser does not offer speech playback.');
  const voice = speech.getVoices().find(v => v.localService && /^en(?:-|$)/i.test(v.lang));
  if (!voice) return notice('An English voice installed on this device is needed for playback.');
  const phrase = new SpeechSynthesisUtterance(text);
  phrase.voice = voice;
  phrase.lang = voice.lang;
  phrase.rate = slow ? .72 : .94;
  speech.cancel();
  speech.speak(phrase);
}
function stopDictating() {
  if (recognition) {
    try { recognition.abort(); } catch {}
    recognition = null;
  }
}
async function dictate(id, control) {
  const field = byId('reply-' + id);
  const voice = field?.form.querySelector('[data-voice]');
  if (!field || !voice) return;
  voice.hidden = false;
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (recognition) { recognition.stop();return; }
  const fallback = 'On-device English dictation is unavailable here. You can use your keyboard’s dictation or type your reply.';
  if (!Speech || !('processLocally' in Speech.prototype) || !Speech.available) {
    voice.textContent = fallback;
    return;
  }
  try {
    voice.textContent = 'Checking on-device English dictation…';
    control.disabled = true;
    const ready = await Speech.available({ langs: ['en-US'], processLocally: true });
    if (!field.isConnected || (field.closest('dialog') && !dialog.open)) return;
    if (ready !== 'available') { voice.textContent = fallback;return; }
    const session = new Speech();
    recognition = session;
    session.lang = 'en-US';
    session.processLocally = true;
    session.onresult = event => {
      const snippet = event.results[0][0].transcript;
      field.value = (field.value + ' ' + snippet).trim().slice(0, field.maxLength);
      field.dispatchEvent(new Event('input',{bubbles:true}));
      voice.textContent = 'Review your transcript before you send it.';
      field.focus();
    };
    session.onerror = () => { voice.textContent = 'The microphone could not finish. You can try again or type your reply.'; };
    session.onend = () => {
      if (recognition === session) recognition = null;
      if (control.isConnected) control.innerHTML = symbol('mic-icon') + 'Dictate';
      if (voice.textContent === 'Listening on this device…') voice.textContent = 'Dictation ended. You may try again.';
    };
    session.start();
    control.textContent = 'Stop listening';
    voice.textContent = 'Listening on this device…';
  } catch {
    recognition = null;
    voice.textContent = fallback;
  } finally { control.disabled = false; }
}
function modal(label, title, html) {
  mousePosition = null;
  if(document.pointerLockElement)document.exitPointerLock();
  dialog.removeAttribute('data-surface');
  byId('overlay-label').textContent = label;
  byId('overlay-body').innerHTML = '<h2 class="title" id="overlay-title" tabindex="-1">' + title + '</h2>' + html;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  byId('overlay-title').focus();
}
function showVisitor() {
  const visitor = VISITORS[state.step];
  if (!visitor) return;
  stopMovement();
  activeVisitor = visitor.style;
  drawScene('guest');
  const talk = '<div class="reader-meta">' + avatar(visitor,true) + '<b>' + visitor.name + '</b></div><blockquote>' +
    esc(visitor.body) + '</blockquote><p>' + visitor.summary + '</p>' +
    '<div class="buttons">' + button('Hear ' + visitor.name, 'listen-visitor', '', 'ghost', 'sound-icon') + '</div>';
  modal('At the office door', visitor.title, talk + (state.step === 5
    ? '<div class="sheet"><h3>Product card</h3>' + chapterProduct() + '</div>' +
      replyForm('counter', visitor, 'Answer Omar', visitor.button)
    : '<div class="reply-actions">' + button(visitor.button, 'complete-visit', '', 'primary') + '</div>'));
}
function showExpansion() {
  if (state.step !== 6) return;
  if (!terminal.open) return;
  modal('Your first week', 'Where should customers pick up?', '<p>You’ve served Lina and Omar. Your shop has <strong>67 coins</strong> and <strong>three kits</strong> left.</p>' +
    '<div class="sheet"><h3>Build a pickup stand</h3><p>Spend 25 coins on a roofed counter in the empty lot. Customers will have a marked place to collect larger orders.</p></div>' +
    '<div class="sheet"><h3>Keep the office counter</h3><p>Save your coins and continue meeting customers at the office door.</p></div>' +
    '<div class="reply-actions">' + button('Build stand · 25 coins', 'finish', 'stand', 'primary') +
    button('Keep the office counter', 'finish', 'office') + '</div>');
}
function sitAtComputer() {
  stopMovement();
  if(document.pointerLockElement)document.exitPointerLock();
  terminal.showModal();
  openTab(tab, true);
}
function standUp() {
  if (terminal.open) terminal.close();
}
function interact() {
  if (terminal.open || dialog.open) return;
  const target = worldInteraction();
  if (!target) return;
  if (target.district) return districtInteract(target);
  if (target.system) return systemsInteract(target);
  if (target.city) return cityInteract(target);
  if (target.id === 'seat') return sitAtComputer();
  if (target.id === 'stand') {
    return modal('Market grounds','Your pickup stand','<p>Customers can collect future orders here. The shop computer shows this stand on the Pickup lot camera.</p>');
  }
  if (VISITORS[state.step]) return showVisitor();
  if (doorOpen && Math.abs(player.x-DOOR.x)<.87 && Math.abs(player.z-DOOR.z)<.47) {
    return notice('Step clear of the doorway before closing it.');
  }
  doorOpen = !doorOpen;
  refreshPosition();
  drawScene('door');
}
byId('tabs').addEventListener('click', event => {
  const target = event.target.closest('[data-tab]');
  if (target) openTab(target.dataset.tab,true);
});
byId('interact').addEventListener('click',interact);
byId('stand-up').addEventListener('click',standUp);
terminal.addEventListener('close',() => {
  stopDictating();
  byId('landscape').focus({preventScroll:true});
  drawScene();
});
byId('close-overlay').addEventListener('click',() => dialog.close());
dialog.addEventListener('close',() => {
  stopDictating();
  activeVisitor = '';
  drawScene();
});
const actions = {
  mail(id) {
    if (MAIL[id]?.minStep <= state.step) { selectedMail = id;openTab('inbox',true); }
  },
  word: showWord,
  'save-word'(word) {
    if (!Object.hasOwn(WORDS,word)) return;
    state.words = state.words.includes(word) ? state.words.filter(w => w !== word) : [...state.words,word];
    save();
    if (tab === 'words') renderWords();
    showWord(word);
  },
  'say-word': playVoice,
  'slow-word': word => playVoice(word,true),
  'listen-mail': id => { if (MAIL[id]) playVoice(MAIL[id].body.join(' ').replace(/\*\*/g,'')); },
  'listen-visitor': () => { if (VISITORS[state.step]) playVoice(VISITORS[state.step].body); },
  dictate,
  product() {
    const panel = byId('word-help');
    panel.hidden = false;
    panel.className = 'word-help';
    panel.innerHTML = '<h3 tabindex="-1">Garden kit</h3>' + chapterProduct();
    panel.querySelector('h3').focus();
  },
  feed(channel) {
    if (!terminal.open || !Object.hasOwn(SECURITY_CAMERAS,channel)) return;
    securityChannel = channel;
    openTab('cameras',true);
  },
  'complete-visit'() {
    const nextState = completeVisit(state);
    if (nextState === state) return;
    const sold = state.step === 1;
    dialog.close();
    advance(nextState);
    notice(sold ? 'Lina paid 21 coins. You have 41 coins and five kits.' : 'Four kits received. Omar’s pickup is ready.');
  },
  expand: showExpansion,
  finish(choice) {
    const buy = choice === 'stand';
    const nextState = completeLevel(state,buy);
    if (nextState === state) return;
    dialog.close();
    if (terminal.open) terminal.close();
    advance(nextState,'inbox');
    if (buy) {
      requestAnimationFrame(() => requestAnimationFrame(() => drawScene('build')));
      notice('Pickup stand built. Walk outside to see it, or check the lot camera.');
    } else notice('Level 1 complete. Your office is still your pickup point.');
  },
};
document.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (control && Object.hasOwn(actions,control.dataset.action)) {
    const action = control.dataset.action;
    if (action === 'say-word') actions[action](control.dataset.key);
    else actions[action](control.dataset.key,control);
  }
});
document.addEventListener('input', event => {
  const field = event.target;
  if (field.name !== 'reply' || !field.form?.dataset.message) return;
  state.drafts[field.form.dataset.message] = field.value.slice(0,1800);
  save();
});
document.addEventListener('submit', event => {
  const form = event.target;
  const id = form.dataset.message;
  if (!id) return;
  event.preventDefault();
  const result = replyOrder(state,id,form.elements.reply.value);
  if (result.notes?.length) {
    const feedback = form.querySelector('[data-feedback]');
    const person = id === 'counter' ? 'Omar' : MAIL[id].name;
    feedback.innerHTML = '<strong>' + person + ' has a follow-up</strong><ul>' +
      result.notes.map(question => '<li>' + esc(question) + '</li>').join('') + '</ul>';
    feedback.classList.remove('blank');
    for (const details of form.querySelectorAll('details')) details.open = true;
    return;
  }
  if (result.state === state) return;
  if (dialog.open) dialog.close();
  advance(result.state);
  if (id === 'counter') {
    notice('Omar paid 42 coins. You have 67 coins and three kits.');
    tab = 'inventory';
    renderStatus();
  } else if (id === 'maya') notice('One pack ordered for 16 coins. Reply to Omar next.');
  else if (id === 'omar') notice('Omar confirmed Wednesday at noon.');
  else notice('Three kits reserved. Lina will arrive Friday at 4 p.m.');
});

const moveKeys = new Set();
const movementKeys = ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift'];
let moveFrame = 0;
let lastMove = 0;
let mousePosition = null;
let touchLook = null;
function isWalking() {
  return !terminal.open && !dialog.open && !document.hidden;
}
function stopMovement() {
  moveKeys.clear();
  if (moveFrame) cancelAnimationFrame(moveFrame);
  moveFrame = 0;
  lastMove = 0;
  mousePosition = null;
  touchLook = null;
}
function stepMovement(time) {
  moveFrame = 0;
  if (!isWalking() || !moveKeys.size) { lastMove = 0;return; }
  const elapsed = lastMove ? Math.min(.16,(time-lastMove)/1000) : 0;
  lastMove = time;
  const pressed = (...keys) => Number(keys.some(key => moveKeys.has(key)));
  const turning = pressed('ArrowLeft')-pressed('ArrowRight');
  const tilt = pressed('ArrowUp')-pressed('ArrowDown');
  player.yaw += turning*elapsed*1.76;
  player.pitch = Math.max(-1.12,Math.min(.96,player.pitch+tilt*elapsed*1.1));
  const forward=pressed('w')-pressed('s'), side=pressed('d')-pressed('a');
  if (forward||side) {
    const intervals=Math.max(1,Math.ceil(elapsed/.04));
    for(let i=0;i<intervals;i++)player=walkStep(player,forward,side,elapsed/intervals,{doorOpen,stand:state.stand,sprint:moveKeys.has('Shift'),driving:systemsDriving});
  }
  refreshPosition();
  drawScene();
  moveFrame = requestAnimationFrame(stepMovement);
}
function moveWith(key) {
  moveKeys.add(key);
  if (!moveFrame) moveFrame = requestAnimationFrame(stepMovement);
}
window.addEventListener('keydown',event => {
  if (!isWalking() || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.matches?.('input,textarea,select')) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (movementKeys.includes(key)) {
    event.preventDefault();
    moveWith(key);
  } else if (key==='e' && !event.repeat) {
    event.preventDefault();
    interact();
  }
});
window.addEventListener('keyup',event => moveKeys.delete(event.key.length===1?event.key.toLowerCase():event.key));
window.addEventListener('blur',stopMovement);
document.addEventListener('visibilitychange',stopMovement);
for (const control of document.querySelectorAll('[data-move]')) {
  let heldAt=0;
  const key=control.dataset.move;
  control.addEventListener('pointerdown',event => {
    if (!isWalking()) return;
    heldAt=performance.now();
    control.setPointerCapture(event.pointerId);
    moveWith(key);
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    control.addEventListener(type,() => moveKeys.delete(key));
  }
  control.addEventListener('click',event => {
    if(!isWalking()||(event.detail && performance.now()-heldAt>160))return;
    if(key==='ArrowLeft'||key==='ArrowRight')player.yaw+=key==='ArrowLeft'?.19:-.19;
    else {
      const forward=Number(key==='w')-Number(key==='s'), side=Number(key==='d')-Number(key==='a');
      for(let i=0;i<4;i++)player=walkStep(player,forward,side,.04,{doorOpen,stand:state.stand});
    }
    refreshPosition();
    drawScene();
  });
}

function turnCamera(dx,dy) {
  if (!dx && !dy) return;
  const sensitivity=cityMouseSettings?.sensitivity||.005;
  player.yaw -= dx*sensitivity;
  const vertical=cityMouseSettings?.invertY?-1:1;
  player.pitch = Math.max(-1.12,Math.min(.96,player.pitch-vertical*dy*sensitivity*.92));
  drawScene();
}
world.addEventListener('pointerdown',event => {
  if (event.pointerType==='mouse' || event.target.id!=='landscape' || !isWalking() || touchLook) return;
  world.setPointerCapture(event.pointerId);
  touchLook = { id:event.pointerId, x:event.clientX, y:event.clientY };
});
world.addEventListener('pointermove',event => {
  if (event.pointerType==='mouse') {
    // Native Pointer Lock owns mouse-look. No cursor-follow rotation or double input.
    mousePosition=null;
    return;
  }
  if (!isWalking() || touchLook?.id!==event.pointerId) return;
  turnCamera(event.clientX-touchLook.x,event.clientY-touchLook.y);
  touchLook.x=event.clientX;
  touchLook.y=event.clientY;
});
world.addEventListener('pointerleave',() => { mousePosition = null; });
for(const type of ['pointerup','pointercancel','lostpointercapture']) {
  world.addEventListener(type,event => {
    if(touchLook?.id===event.pointerId)touchLook=null;
  });
}

render();
try {
  scene = createOfficeView();
  drawScene();
} catch (error) {
  console.warn('Using the illustrated office view:',error.message);
  const old = byId('landscape');
  const replacement = old.cloneNode();
  old.replaceWith(replacement);
  scene = drawIllustratedView(replacement,byId('view'));
  drawScene();
}

// Initialize the city after the original first-person office is ready.
cityInit();
academyInstall();
systemsInit();
campusInit();
phoneInit();
jobInit();
pathwayInit();
schoolActivitiesInit();
