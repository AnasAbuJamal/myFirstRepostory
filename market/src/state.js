const SAVE_KEY = 'lumenvale_v2_save';

export const GRAPHICS_PRESETS = {
  low: { label: 'Low — Laptop / Integrated (~30 FPS)', pixelRatio: 0.85, shadows: false, shadowSize: 512, anisotropy: 2, fogFar: 135 },
  medium: { label: 'Medium — Desktop Balanced', pixelRatio: 1.15, shadows: true, shadowSize: 1024, anisotropy: 4, fogFar: 195 },
  high: { label: 'High — Gaming (~60 FPS)', pixelRatio: 1.45, shadows: true, shadowSize: 2048, anisotropy: 8, fogFar: 260 },
  ultra: { label: 'Ultra — Max Detail', pixelRatio: 1.85, shadows: true, shadowSize: 2048, anisotropy: 16, fogFar: 340 },
};

export const LIBRARY_BOOKS = [
  {
    id: 'urban-architecture',
    title: 'Stone, Timber & Light: European Civic Design',
    genre: 'Architecture',
    difficulty: 'Intermediate',
    words: 140,
    reward: 45,
    vocab: [
      { word: 'ashlar', def: 'Finely dressed, rectangular cut stone masonry.', ex: 'The civic hall features an ashlar limestone facade.' },
      { word: 'fenestration', def: 'The arrangement and design of windows in a building.', ex: 'Deeply recessed fenestration creates natural facade shadow.' },
    ],
    text: 'Walkable European neighborhoods balance human-scale ashlar facades with sunlit courtyards. Careful fenestration brings indirect daylight deep into reading rooms while reducing glare.',
    question: 'What is one main benefit of careful fenestration in civic buildings?',
    options: ['It eliminates the need for a roof', 'It brings balanced natural daylight into interior spaces', 'It replaces all masonry with plastic'],
    correct: 1,
  },
  {
    id: 'supply-chains',
    title: 'Foundations of Local Commerce',
    genre: 'Economics',
    difficulty: 'Beginner',
    words: 125,
    reward: 40,
    vocab: [
      { word: 'liquidity', def: 'Available cash or assets that can quickly cover expenses.', ex: 'Maintaining healthy liquidity helps a small office restock on time.' },
      { word: 'margin', def: 'The difference between selling revenue and direct operating cost.', ex: 'Accurate inventory planning protects profit margin.' },
    ],
    text: 'Healthy local businesses track liquidity before accepting bulk contracts. When inventory costs rise, managers review their margin and negotiate clear delivery schedules with suppliers.',
    question: 'Why do managers check liquidity before accepting a large order?',
    options: ['To make sure they have cash to cover restocking and expenses', 'To avoid speaking with customers', 'To lower product quality'],
    correct: 0,
  },
  {
    id: 'civic-ecology',
    title: 'Trees & Microclimates in Modern Cities',
    genre: 'Environment',
    difficulty: 'Intermediate',
    words: 130,
    reward: 50,
    vocab: [
      { word: 'canopy', def: 'The upper layer of leaves and branches formed by mature trees.', ex: 'A dense street canopy cools stone sidewalks in summer.' },
      { word: 'permeable', def: 'Allowing water to pass through rather than pooling on the surface.', ex: 'Permeable stone plazas reduce stormwater runoff.' },
    ],
    text: 'Street trees provide a cooling canopy along pedestrian avenues, shading stone pavers and storefronts. Paired with permeable park walkways, urban greenery keeps public squares comfortable year-round.',
    question: 'How do street canopies help pedestrian avenues?',
    options: ['They block all road traffic', 'They cool and shade sidewalks and storefronts', 'They remove the need for drainage'],
    correct: 1,
  },
];

const DEFAULT_ORDERS = [
  {
    id: 'ord-101',
    customer: 'Lina Becker · Café LumenVale',
    subject: 'Urgent Restock: 4 Specialty Supply Kits',
    body: 'Hello! Our terrace seating is full this week and we need 4 supply kits delivered before Friday. Please confirm availability so we can settle the invoice for 85 coins.',
    vocab: { word: 'invoice', def: 'An itemized bill listing goods delivered and the amount due.', ex: 'Lina paid the invoice upon delivery.' },
    kitsRequired: 4,
    payout: 85,
    status: 'open',
  },
  {
    id: 'ord-102',
    customer: 'Omar Al-Mansoor · Buchhandlung Central',
    subject: 'Bookshop Packaging Contract (6 Kits)',
    body: 'Good afternoon. We are preparing our autumn reading showcase and need 6 durable packaging kits. Can your office reserve and dispatch them for 130 coins?',
    vocab: { word: 'dispatch', def: 'To send off goods or messages promptly to a destination.', ex: 'The office will dispatch six kits to the bookshop.' },
    kitsRequired: 6,
    payout: 130,
    status: 'open',
  },
];

const DEFAULT_PROPERTIES = [
  { id: 'prop-office', name: 'Market Office Suite (NE Block)', price: 0, owned: true, level: 1, income: 0, desc: 'Your personal business headquarters overlooking the avenue.' },
  { id: 'prop-cafe', name: 'LumenVale Café Terrace (Center)', price: 240, owned: false, level: 0, income: 18, desc: 'Corner coffee shop with outdoor bistro seating.' },
  { id: 'prop-bookshop', name: 'Buchhandlung Retail Unit (Center)', price: 360, owned: false, level: 0, income: 28, desc: 'Independent neighborhood bookstore on Main Street.' },
  { id: 'prop-townhouse', name: 'East Courtyard Residence (EC Block)', price: 520, owned: false, level: 0, income: 42, desc: 'Restored 4-story European apartment building.' },
];

export function createDefaultState() {
  return {
    version: 2,
    coins: 150,
    savings: 0,
    inventory: 8,
    employees: 1,
    transactions: [{ time: 'Opening', label: 'Starting capital', amount: 150 }],
    courses: [],
    completedLessons: [],
    examResults: [],
    completedBooks: [],
    vocab: [],
    orders: structuredClone(DEFAULT_ORDERS),
    properties: structuredClone(DEFAULT_PROPERTIES),
    messages: [
      { id: 'm1', from: 'LumenVale City Hall', subject: 'Welcome to LumenVale', body: 'Explore Main Street, visit the School & Library, and manage your business from the Market Office.', read: false },
      { id: 'm2', from: 'LumenVale School', subject: 'Teacher-Controlled Curriculum', body: 'No courses are pre-installed. Teachers can import JSON courses, chapters, or exams anytime via the School app.', read: false },
    ],
    settings: {
      graphics: 'high',
      fov: 70,
      sensitivity: 0.0024,
      invertY: false,
      effects: 0.45,
      ambience: 0.2,
      notifications: 0.5,
      muted: false,
    },
  };
}

export function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!raw || raw.version !== 2) return createDefaultState();
    const base = createDefaultState();
    return { ...base, ...raw, settings: { ...base.settings, ...(raw.settings || {}) } };
  } catch {
    return createDefaultState();
  }
}

export function saveState(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

export function addTransaction(state, label, amount) {
  state.coins = Math.max(0, Math.round(state.coins + amount));
  state.transactions.unshift({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), label, amount });
  if (state.transactions.length > 40) state.transactions.pop();
  saveState(state);
}

export function saveVocabWord(state, entry, source = 'City') {
  const key = entry.word.toLowerCase();
  if (state.vocab.some(v => v.word.toLowerCase() === key)) return false;
  state.vocab.unshift({ word: entry.word, def: entry.def, ex: entry.ex || '', source, mastery: 0, nextReview: Date.now() });
  saveState(state);
  return true;
}

export function importTeacherJSON(state, rawText) {
  let data;
  try { data = JSON.parse(rawText); } catch { return { ok: false, error: 'Invalid JSON syntax.' }; }
  const schema = data?.schema || '';
  if (!['lumenvale.lms-course', 'lumenvale.lms-chapter', 'lumenvale.lms-exam'].includes(schema)) {
    return { ok: false, error: 'Unsupported schema. Expected lumenvale.lms-course, lumenvale.lms-chapter, or lumenvale.lms-exam.' };
  }
  if (!data.title || typeof data.title !== 'string') return { ok: false, error: 'Missing required title field.' };
  if (schema === 'lumenvale.lms-course') {
    const id = data.id || ('course-' + Date.now());
    const existingIdx = state.courses.findIndex(c => c.id === id);
    const course = { id, title: data.title, summary: data.summary || '', chapters: Array.isArray(data.chapters) ? data.chapters : [] };
    if (existingIdx >= 0) state.courses[existingIdx] = course;
    else state.courses.push(course);
    saveState(state);
    return { ok: true, msg: `Imported course "${course.title}" (${course.chapters.length} chapters).` };
  }
  if (schema === 'lumenvale.lms-chapter') {
    if (!state.courses.length) state.courses.push({ id: 'course-imported', title: data.courseTitle || 'Teacher Course', summary: '', chapters: [] });
    const target = state.courses.find(c => c.id === data.courseId) || state.courses[0];
    target.chapters.push({ id: data.id || ('ch-' + Date.now()), title: data.title, lessons: data.lessons || [], flashcards: data.flashcards || [], exam: data.exam || null });
    saveState(state);
    return { ok: true, msg: `Added chapter "${data.title}" to "${target.title}".` };
  }
  if (schema === 'lumenvale.lms-exam') {
    if (!state.courses.length) state.courses.push({ id: 'course-imported', title: 'Teacher Assessments', summary: '', chapters: [] });
    const target = state.courses[0];
    target.chapters.push({ id: data.id || ('exam-' + Date.now()), title: data.title, lessons: [], flashcards: [], exam: { title: data.title, questions: data.questions || [] } });
    saveState(state);
    return { ok: true, msg: `Imported exam "${data.title}".` };
  }
  return { ok: false, error: 'Unhandled format.' };
}
