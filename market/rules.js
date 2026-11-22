const SAVE_KEY = 'jungle-miner-market-v1';
const FINAL_STEP = 7;

function cleanProgress(input) {
  const saved = input?.version === 1 ? input : {};
  const step = Number.isInteger(saved.step) ? Math.max(0, Math.min(FINAL_STEP, saved.step)) : 0;
  function messages(raw) {
    return Object.fromEntries(['lina', 'maya', 'omar', 'counter'].flatMap(key =>
      typeof raw?.[key] === 'string' ? [[key, raw[key].slice(0, 1800)]] : []));
  }
  return {
    version: 1, step, stand: step === FINAL_STEP && saved.stand === true,
    drafts: messages(saved.drafts), sent: messages(saved.sent),
    words: [...new Set(Array.isArray(saved.words) ? saved.words.filter(word => Object.hasOwn(WORDS, word)) : [])],
    quiet: saved.quiet === true,
  };
}

function shopTotals(state) {
  const linaSold = state.step >= 2;
  const restockOrdered = state.step >= 3;
  const restockArrived = state.step >= 5;
  const omarSold = state.step >= 6;
  const receipts = [
    ...(linaSold ? [{ name: 'Lina’s pickup', quantity: CATALOG.firstOrder, coins: CATALOG.firstOrder * CATALOG.kit, date: 'Friday' }] : []),
    ...(restockOrdered ? [{ name: 'Maya’s supply order', quantity: CATALOG.pack, coins: -CATALOG.wholesale, date: 'Monday' }] : []),
    ...(omarSold ? [{ name: 'Omar’s pickup', quantity: CATALOG.clubOrder, coins: CATALOG.clubOrder * CATALOG.kit, date: 'Wednesday' }] : []),
    ...(state.stand ? [{ name: 'Pickup stand', quantity: null, coins: -CATALOG.stand, date: 'Wednesday' }] : []),
  ];
  const onShelf = 8 - (linaSold ? CATALOG.firstOrder : 0)
    + (restockArrived ? CATALOG.pack : 0) - (omarSold ? CATALOG.clubOrder : 0);
  const reserved = state.step === 1 ? CATALOG.firstOrder : state.step === 5 ? CATALOG.clubOrder : 0;
  return {
    coins: receipts.reduce((balance, entry) => balance + entry.coins, 20),
    onShelf, reserved, available: onShelf - reserved,
    inbound: restockOrdered && !restockArrived ? CATALOG.pack : 0,
    sold: (linaSold ? CATALOG.firstOrder : 0) + (omarSold ? CATALOG.clubOrder : 0),
    receipts,
  };
}

function normalizeReply(text) {
  return text.toLowerCase()
    .normalize('NFKC')
    .replace(/[’‘]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/\b([ap])\s*\.\s*m\.?/g, '$1m')
    .replace(/\btwenty[\s-]+one\b/g, '21')
    .replace(/\bforty[\s-]+two\b/g, '42')
    .replace(/\bsixteen\b/g, '16')
    .replace(/\b(one|two|three|four|five|six|seven|ten|twelve)\b/g, n =>
      ({ one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', ten: '10', twelve: '12' })[n])
    .replace(/\bfri\.?(?=\s|$)/g, 'friday').replace(/\bwed\.?(?=\s|$)/g, 'wednesday')
    .replace(/\bmidday\b/g, 'noon');
}
function containsNumber(text, number) {
  return new RegExp('\\b' + number + '\\b').test(text);
}
function timeMention(text, hour, period) {
  const n = new RegExp('\\b' + hour + '(?::00|\\.00)?\\s*' + period + '\\b');
  return n.test(text);
}
function omarTime(text) {
  return /\bwednesday\b/.test(text) && (
    /\bnoon\b/.test(text) || timeMention(text, 12, 'pm') ||
    /\b(?:at\s+12(?::00)?|12:00)\b(?!\s*am\b)/.test(text)
  );
}
function affirmativeLabels(text) {
  const hasLabel = /\b(?:labels?|plant tags?|name tags?)\b/.test(text);
  const excluded = /\b(?:no|without)\s+(?:plant\s+|name\s+)?(?:labels?|tags?)\b|\b(?:labels?|tags?)\s+(?:are\s+not|aren't|won't be)\s+included\b|\b(?:does not|doesn't|do not|don't|won't)\s+(?:include|come with)\s+(?:a\s+|plant\s+)?(?:labels?|tags?)\b/.test(text);
  return hasLabel && !excluded;
}

function replyNotes(message, raw) {
  const text = normalizeReply(raw);
  const enoughWords = raw.trim().split(/\s+/).length >= (message === 'counter' ? 7 : 9);
  if (!enoughWords) return ['Write a short reply in your own words so the reader knows what to do.'];
  let checks;
  if (message === 'lina') {
    checks = [
      [/\b3\b/.test(text), 'How many kits should I expect at the counter?'],
      [containsNumber(text, 21), 'Could you give me the full price for all my kits?'],
      [affirmativeLabels(text), 'Can you confirm whether a plant label comes in each kit?'],
      [/\bfriday\b/.test(text) && (timeMention(text, 4, 'pm') || /\b16:00\b|\b4(?:\s+in\s+the\s+|\s+on\s+friday\s+)(?:afternoon)\b/.test(text)),
        'Please confirm the day and time you’ll have my kits ready.'],
    ];
  } else if (message === 'maya') {
    checks = [
      [/\b(?:1|a|single)\s+(?:single\s+)?pack\b|\b(?:pack|box|set)\s+of\s+4\b|\b4\s+(?:garden\s+)?kits?\b/.test(text) &&
       !/\b(?:2|3|4|5|6|7|8)\s+packs?\b/.test(text),
        'How much should I bring? Check how many more kits you need and how many come in each pack.'],
      [/\bwednesday\b/.test(text) && (timeMention(text, 10, 'am') || /\b10(?::00)?\s+(?:on\s+wednesday\s+|in\s+the\s+)?morning\b|\bmorning\s+at\s+10\b/.test(text)),
        'What day and time should I bring the pack? Please confirm my delivery slot.'],
    ];
  } else if (message === 'omar') {
    checks = [
      [containsNumber(text, 6), 'I need enough for everyone in the club. Can you confirm my quantity?'],
      [omarTime(text), 'I can only make one trip. Look at Maya’s delivery and confirm when all the kits will be ready.'],
      [containsNumber(text, 42), 'How much does the full order cost? I’ll bring that amount.'],
    ];
  } else {
    const requiresSupplies = /\b(?:need|needs|bring|provide|add|supply|supplied|you'?ll want|she'?ll want|your own|her own|separately|just get)\b/.test(text)
      || /\b(?:soil|water)\b[^.!?]{0,40}\b(?:not included|aren't included)\b/.test(text);
    checks = [
      [/\bpots?\b/.test(text) && /\bseeds?\b/.test(text) && affirmativeLabels(text),
        'Can you spell out what’s already in the kit? I want to explain it to her later.'],
      [/\bsoil\b/.test(text) && /\bwater\b/.test(text) && requiresSupplies &&
        !/\b(?:includes?|comes with|contains)\s+(?:extra\s+)?(?:soil|water)\b|\b(?:soil and water|water and soil)\s+(?:are|come)\s+included\b/.test(text),
        'Please tell me what she needs to add herself. Check the two items under “Bring from home.”'],
    ];
  }
  return checks.filter(([works]) => !works).map(([, note]) => note);
}

function replyOrder(state, id, reply) {
  const step = id === 'counter' ? 5 : MAIL[id]?.actionStep;
  if (step !== state.step || step === undefined) return { state };
  const notes = replyNotes(id, reply);
  if (notes.length) return { state, notes };
  return {
    state: { ...state, step: state.step + 1, sent: { ...state.sent, [id]: reply.trim() } },
    notes: [],
  };
}

function completeVisit(state) {
  return state.step === 1 || state.step === 4 ? { ...state, step: state.step + 1 } : state;
}

function completeLevel(state, stand) {
  if (state.step !== 6 || (stand && shopTotals(state).coins < CATALOG.stand)) return state;
  return { ...state, step: FINAL_STEP, stand: Boolean(stand) };
}

