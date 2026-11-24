import { GRAPHICS_PRESETS, LIBRARY_BOOKS, addTransaction, saveState, saveVocabWord, importTeacherJSON, createDefaultState } from './state.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

export class GameUI {
  constructor(state, world, audio) {
    this.state = state;
    this.world = world;
    this.audio = audio;
    this.phoneOpen = false;
    this.pcOpen = false;
    this.activeApp = null;
    this.activePcTab = 'inbox';
    this.activeCctv = 'street';
    this.cctvTimer = null;

    this.el = {
      loc: document.getElementById('location-name'),
      prompt: document.getElementById('interact-prompt'),
      promptLabel: document.getElementById('interact-label'),
      phoneOverlay: document.getElementById('phone-overlay'),
      phoneScreen: document.getElementById('phone-screen'),
      phoneTitle: document.getElementById('phone-title'),
      phoneBack: document.getElementById('phone-back'),
      phoneCoins: document.getElementById('phone-coins'),
      phoneClock: document.getElementById('phone-clock'),
      pcOverlay: document.getElementById('computer-overlay'),
      pcHeading: document.getElementById('pc-heading'),
      pcWallet: document.getElementById('pc-wallet'),
      pcNav: document.getElementById('pc-nav'),
      pcBody: document.getElementById('pc-body'),
      toast: document.getElementById('toast'),
    };

    document.getElementById('btn-look').onclick = () => this.world.requestPointerLock();
    document.getElementById('btn-phone').onclick = () => this.openPhone();
    document.getElementById('phone-close').onclick = () => this.closeAll();
    document.getElementById('phone-back').onclick = () => this.renderPhoneHome();
    document.getElementById('pc-close').onclick = () => this.closeAll();
  }

  toast(msg) {
    this.el.toast.textContent = msg;
    this.el.toast.classList.add('show');
    this.audio.notify();
    clearTimeout(this._t);
    this._t = setTimeout(() => this.el.toast.classList.remove('show'), 2800);
  }

  syncHUD() {
    this.el.loc.textContent = this.world.getCurrentLocationName();
    const near = this.world.getNearbyInteraction();
    if (near && !this.phoneOpen && !this.pcOpen) {
      this.el.promptLabel.textContent = near.label;
      this.el.prompt.classList.remove('hidden');
    } else {
      this.el.prompt.classList.add('hidden');
    }
    this.el.phoneCoins.textContent = this.state.coins;
    this.el.pcWallet.textContent = `${this.state.coins} ◈`;
    this.el.phoneClock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  closeAll() {
    this.phoneOpen = false;
    this.pcOpen = false;
    this.el.phoneOverlay.classList.add('hidden');
    this.el.pcOverlay.classList.add('hidden');
    this.world.paused = false;
    this.world.setPhone3D(false);
    clearInterval(this.cctvTimer);
  }

  openPhone(appId = null) {
    this.closeAll();
    this.phoneOpen = true;
    this.world.paused = true;
    this.world.releasePointerLock();
    this.world.setPhone3D(true);
    this.audio.phone();
    this.el.phoneOverlay.classList.remove('hidden');
    if (appId) this.openPhoneApp(appId); else this.renderPhoneHome();
  }

  renderPhoneHome() {
    this.activeApp = null;
    this.el.phoneTitle.textContent = 'City Phone';
    this.el.phoneBack.classList.add('hidden');
    const apps = [
      ['school', 'School', '🎓', '#2563eb'],
      ['library', 'Library', '📚', '#b45309'],
      ['banking', 'Banking', '💳', '#15803d'],
      ['properties', 'Properties', '🏛️', '#7c3aed'],
      ['business', 'Business', '💼', '#0f766e'],
      ['map', 'City Map', '🗺️', '#0284c7'],
      ['messages', 'Messages', '✉️', '#db2777'],
      ['settings', 'Settings', '⚙️', '#475569'],
    ];
    this.el.phoneScreen.innerHTML = `<div class="app-grid">${apps.map(([id, name, ic, bg]) =>
      `<button class="app-tile" data-app="${id}" type="button"><div class="app-icon" style="background:${bg}">${ic}</div><span>${name}</span></button>`
    ).join('')}</div>`;
    this.el.phoneScreen.querySelectorAll('[data-app]').forEach(btn => {
      btn.onclick = () => this.openPhoneApp(btn.dataset.app);
    });
  }

  openPhoneApp(id) {
    this.activeApp = id;
    this.el.phoneBack.classList.remove('hidden');
    const titles = { school: 'LumenVale School', library: 'Library & Vocab', banking: 'Banking', properties: 'Properties', business: 'Business', map: 'City Map', messages: 'Messages', settings: 'Settings' };
    this.el.phoneTitle.textContent = titles[id] || 'App';
    const body = this.el.phoneScreen;
    if (id === 'school') this.renderSchoolApp(body);
    else if (id === 'library') this.renderLibraryApp(body);
    else if (id === 'banking') this.renderBankingApp(body);
    else if (id === 'properties') this.renderPropertiesApp(body);
    else if (id === 'business') this.renderBusinessApp(body);
    else if (id === 'map') this.renderMapApp(body);
    else if (id === 'messages') this.renderMessagesApp(body);
    else if (id === 'settings') this.renderSettingsApp(body);
  }

  renderSchoolApp(el) {
    const coursesHtml = this.state.courses.length
      ? this.state.courses.map(c => `<div class="card"><h3>${esc(c.title)}</h3><p>${esc(c.summary || 'Teacher-published course')}</p><p class="muted">${c.chapters.length} chapter(s)</p></div>`).join('')
      : `<div class="card"><h3>No Active Courses Yet</h3><p>LumenVale School starts with zero hardcoded courses. Paste a Teacher JSON package below (<code>lumenvale.lms-course</code>, <code>lumenvale.lms-chapter</code>, or <code>lumenvale.lms-exam</code>) to enroll.</p></div>`;
    el.innerHTML = `${coursesHtml}
      <div class="card"><h3>Import Teacher JSON</h3>
        <textarea id="lms-json-in" rows="4" placeholder='{"schema":"lumenvale.lms-course","title":"Intro to Urban Ecology","chapters":[]}'></textarea>
        <div class="row" style="margin-top:8px"><button id="btn-lms-import" class="btn" type="button">Import JSON</button><button id="btn-go-school" class="btn secondary" type="button">Go to School</button></div>
      </div>
      <div class="card"><h3>Academic Transcript (Simulation)</h3><p class="muted">Local practice records only — LumenVale is an educational simulation, not an accredited institution.</p><p>Completed lessons: <strong>${this.state.completedLessons.length}</strong> · Books read: <strong>${this.state.completedBooks.length}</strong> · Saved words: <strong>${this.state.vocab.length}</strong></p></div>`;
    el.querySelector('#btn-lms-import').onclick = () => {
      const res = importTeacherJSON(this.state, el.querySelector('#lms-json-in').value);
      this.toast(res.ok ? res.msg : res.error);
      if (res.ok) this.renderSchoolApp(el);
    };
    el.querySelector('#btn-go-school').onclick = () => {
      if (this.world.manifest?.spawn_points?.school_lobby) this.world.teleport(this.world.manifest.spawn_points.school_lobby, 0);
      this.closeAll(); this.toast('Arrived at LumenVale School');
    };
  }

  renderLibraryApp(el) {
    const booksHtml = LIBRARY_BOOKS.map(b => {
      const done = this.state.completedBooks.includes(b.id);
      return `<div class="card"><div class="row"><h3>${esc(b.title)}</h3><span class="muted">${done ? '✓ Read' : `+${b.reward} ◈`}</span></div><p>${b.genre} · ${b.difficulty} · ${b.words} words</p><button class="btn secondary" style="margin-top:8px" data-book="${b.id}" type="button">${done ? 'Re-read' : 'Read Book'}</button></div>`;
    }).join('');
    const vocabHtml = this.state.vocab.length
      ? this.state.vocab.slice(0, 8).map(v => `<div class="card"><h3>${esc(v.word)} <small class="muted">(Mastery ${v.mastery}/5)</small></h3><p>${esc(v.def)}</p></div>`).join('')
      : `<p class="muted">Tap highlighted words while reading books or emails to save them here.</p>`;
    el.innerHTML = `${booksHtml}<div class="card"><h3>Saved Vocabulary (${this.state.vocab.length})</h3>${vocabHtml}</div>`;
    el.querySelectorAll('[data-book]').forEach(btn => btn.onclick = () => this.renderBookReader(el, btn.dataset.book));
  }

  renderBookReader(el, bookId) {
    const book = LIBRARY_BOOKS.find(b => b.id === bookId);
    if (!book) return;
    let textHtml = esc(book.text);
    book.vocab.forEach((v, idx) => {
      textHtml = textHtml.replace(new RegExp(`\\b(${v.word})\\b`, 'i'), `<span class="word-chip" data-vidx="${idx}">$1</span>`);
    });
    el.innerHTML = `<div class="card"><h3>${esc(book.title)}</h3><p style="color:#f3f6fa;margin:8px 0">${textHtml}</p><p class="muted">Tip: Tap gold words to save them to your Vocabulary list.</p></div>
      <div class="card"><h3>Comprehension Check</h3><p style="margin-bottom:8px">${esc(book.question)}</p>
      ${book.options.map((opt, i) => `<button class="btn secondary" style="width:100%;margin-bottom:6px;text-align:left" data-ans="${i}" type="button">${esc(opt)}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-vidx]').forEach(sp => {
      sp.onclick = () => {
        const v = book.vocab[Number(sp.dataset.vidx)];
        const added = saveVocabWord(this.state, v, book.title);
        this.toast(added ? `Saved "${v.word}" to Vocabulary!` : `"${v.word}" is already saved.`);
      };
    });
    el.querySelectorAll('[data-ans]').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.ans);
        if (idx !== book.correct) { this.toast('Not quite — re-read the passage and try again.'); return; }
        if (!this.state.completedBooks.includes(book.id)) {
          this.state.completedBooks.push(book.id);
          addTransaction(this.state, `Library: ${book.title}`, book.reward);
          this.toast(`Correct! Earned +${book.reward} ◈`);
        } else {
          this.toast('Correct! (Reward already claimed once.)');
        }
        this.renderLibraryApp(el);
      };
    });
  }

  renderBankingApp(el) {
    el.innerHTML = `<div class="stat-grid"><div class="stat-box"><small>Wallet Balance</small><strong>${this.state.coins} ◈</strong></div><div class="stat-box"><small>Savings Vault</small><strong>${this.state.savings} ◈</strong></div></div>
      <div class="card"><div class="row"><button id="btn-save50" class="btn" type="button">Deposit 50 ◈</button><button id="btn-with50" class="btn secondary" type="button">Withdraw 50 ◈</button></div></div>
      <div class="card"><h3>Recent Transactions</h3>${this.state.transactions.slice(0, 10).map(t => `<div class="row" style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,.06)"><span>${esc(t.label)}</span><strong style="color:${t.amount >= 0 ? '#22c55e' : '#ef4444'}">${t.amount >= 0 ? '+' : ''}${t.amount} ◈</strong></div>`).join('')}</div>`;
    el.querySelector('#btn-save50').onclick = () => { if (this.state.coins >= 50) { this.state.savings += 50; addTransaction(this.state, 'Deposit to Savings', -50); this.renderBankingApp(el); } else this.toast('Not enough coins.'); };
    el.querySelector('#btn-with50').onclick = () => { if (this.state.savings >= 50) { this.state.savings -= 50; addTransaction(this.state, 'Withdraw from Savings', 50); this.renderBankingApp(el); } else this.toast('Not enough savings.'); };
  }

  renderPropertiesApp(el) {
    el.innerHTML = this.state.properties.map(p => `<div class="card"><div class="row"><h3>${esc(p.name)}</h3><strong>${p.owned ? `Owned (Lv.${p.level})` : `${p.price} ◈`}</strong></div><p>${esc(p.desc)}</p>${p.owned ? `<p class="muted">Passive yield: ${p.income * p.level} ◈ / cycle</p>` : `<button class="btn gold" style="margin-top:8px" data-buy="${p.id}" type="button">Purchase Property</button>`}</div>`).join('');
    el.querySelectorAll('[data-buy]').forEach(btn => {
      btn.onclick = () => {
        const p = this.state.properties.find(x => x.id === btn.dataset.buy);
        if (!p || p.owned) return;
        if (this.state.coins < p.price) { this.toast(`Need ${p.price} ◈ to purchase.`); return; }
        p.owned = true; p.level = 1;
        addTransaction(this.state, `Purchased ${p.name}`, -p.price);
        this.toast(`You now own ${p.name}!`);
        this.renderPropertiesApp(el);
      };
    });
  }

  renderBusinessApp(el) {
    el.innerHTML = `<div class="stat-grid"><div class="stat-box"><small>Inventory Kits</small><strong>${this.state.inventory}</strong></div><div class="stat-box"><small>Team Members</small><strong>${this.state.employees}</strong></div></div>
      <div class="card"><h3>Operations</h3><p>Restock supply kits (15 ◈ each) or hire staff (90 ◈) to expand capacity.</p><div class="row" style="margin-top:10px"><button id="btn-restock" class="btn" type="button">Buy 4 Kits (60 ◈)</button><button id="btn-hire" class="btn secondary" type="button">Hire Staff (90 ◈)</button></div></div>
      <div class="card"><h3>Quick Travel</h3><button id="btn-go-office" class="btn gold" type="button">Go to Market Office</button></div>`;
    el.querySelector('#btn-restock').onclick = () => { if (this.state.coins < 60) return this.toast('Need 60 ◈.'); this.state.inventory += 4; addTransaction(this.state, 'Restocked 4 Supply Kits', -60); this.renderBusinessApp(el); };
    el.querySelector('#btn-hire').onclick = () => { if (this.state.coins < 90) return this.toast('Need 90 ◈.'); this.state.employees += 1; addTransaction(this.state, 'Hired Office Staff', -90); this.renderBusinessApp(el); };
    el.querySelector('#btn-go-office').onclick = () => { this.world.teleport(this.world.manifest.spawn_points.market_office_exec, 0); this.closeAll(); this.toast('Arrived at Market Office'); };
  }

  renderMapApp(el) {
    const sp = this.world.manifest?.spawn_points || {};
    el.innerHTML = `<canvas id="city-map-canvas" width="340" height="290"></canvas>
      <div class="card"><h3>Fast Travel Destinations</h3><div class="row" style="gap:6px;margin-top:6px">
        <button class="btn secondary" data-tp="main_street" type="button">Main Street</button>
        <button class="btn secondary" data-tp="school_lobby" type="button">School</button>
        <button class="btn secondary" data-tp="school_library" type="button">Library</button>
        <button class="btn secondary" data-tp="market_office_exec" type="button">Market Office</button>
        <button class="btn secondary" data-tp="civic_square" type="button">Civic Square</button>
        <button class="btn secondary" data-tp="public_park" type="button">Public Park</button>
      </div></div>`;
    const cvs = el.querySelector('#city-map-canvas');
    const ctx = cvs.getContext('2d');
    const mapX = (x) => 170 + x * 1.45;
    const mapY = (z) => 165 + z * 1.15;
    ctx.fillStyle = '#182433'; ctx.fillRect(0, 0, 340, 290);
    ctx.fillStyle = '#334155';
    [-72, 0, 72].forEach(rx => ctx.fillRect(mapX(rx) - 4, 0, 8, 290));
    [-130, -58, 14, 86].forEach(rz => ctx.fillRect(0, mapY(rz) - 4, 340, 8));
    const pins = [['School', -36, -94, '#3b82f6'], ['Market Office', 23, -80, '#e8b84b'], ['Civic Sq', -36, -22, '#a855f7'], ['Park', -36, 50, '#22c55e']];
    ctx.font = 'bold 10px system-ui';
    for (const [label, x, z, col] of pins) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mapX(x), mapY(z), 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc'; ctx.fillText(label, mapX(x) + 7, mapY(z) + 3);
    }
    const px = mapX(this.world.playerPos.x), py = mapY(this.world.playerPos.z);
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    el.querySelectorAll('[data-tp]').forEach(btn => {
      btn.onclick = () => {
        const coords = sp[btn.dataset.tp];
        if (coords) { this.world.teleport(coords, 0); this.closeAll(); this.toast(`Traveled to ${btn.textContent}`); }
      };
    });
  }

  renderMessagesApp(el) {
    el.innerHTML = this.state.messages.map(m => `<div class="card"><h3>${esc(m.subject)}</h3><p class="muted">From: ${esc(m.from)}</p><p style="margin-top:6px;color:#e2e8f0">${esc(m.body)}</p></div>`).join('');
  }

  renderSettingsApp(el) {
    const s = this.state.settings;
    el.innerHTML = `<div class="card"><h3>Graphics & Display</h3>
      <label class="field">Graphics Quality</label>
      <select id="set-gfx">${Object.entries(GRAPHICS_PRESETS).map(([k, v]) => `<option value="${k}" ${s.graphics === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
      <label class="field">Field of View: <strong id="fov-val">${s.fov}°</strong></label>
      <input id="set-fov" type="range" min="60" max="95" value="${s.fov}">
      <label class="field">Mouse Sensitivity</label>
      <input id="set-sens" type="range" min="10" max="60" value="${Math.round(s.sensitivity * 10000)}">
      <label class="field"><input id="set-inv" type="checkbox" ${s.invertY ? 'checked' : ''}> Invert Vertical Look</label>
      <p class="muted" style="margin-top:8px">Live: ${this.world.stats.fps} FPS · ${this.world.stats.meshes} meshes · ${this.world.stats.triangles.toLocaleString()} tris</p></div>
      <div class="card"><h3>Audio</h3>
      <label class="field"><input id="set-mute" type="checkbox" ${s.muted ? 'checked' : ''}> Mute All Audio</label>
      <label class="field">Effects Volume</label><input id="set-fx" type="range" min="0" max="100" value="${Math.round(s.effects * 100)}"></div>
      <div class="card"><h3>Save Data</h3><div class="row"><button id="btn-export" class="btn secondary" type="button">Export Backup</button><button id="btn-reset" class="btn secondary" type="button">Reset Save</button></div></div>`;
    el.querySelector('#set-gfx').onchange = (e) => { s.graphics = e.target.value; saveState(this.state); this.world.applySettings(); this.toast(`Graphics set to ${s.graphics.toUpperCase()}`); };
    el.querySelector('#set-fov').oninput = (e) => { s.fov = Number(e.target.value); el.querySelector('#fov-val').textContent = s.fov + '°'; saveState(this.state); this.world.applySettings(); };
    el.querySelector('#set-sens').oninput = (e) => { s.sensitivity = Number(e.target.value) / 10000; saveState(this.state); };
    el.querySelector('#set-inv').onchange = (e) => { s.invertY = e.target.checked; saveState(this.state); };
    el.querySelector('#set-mute').onchange = (e) => { s.muted = e.target.checked; saveState(this.state); };
    el.querySelector('#set-fx').oninput = (e) => { s.effects = Number(e.target.value) / 100; saveState(this.state); };
    el.querySelector('#btn-export').onclick = () => {
      const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lumenvale-save-backup.json'; a.click();
    };
    el.querySelector('#btn-reset').onclick = () => { Object.assign(this.state, createDefaultState()); saveState(this.state); this.toast('Save reset.'); this.renderSettingsApp(el); };
  }

  openComputer(tab = 'inbox') {
    this.closeAll();
    this.pcOpen = true;
    this.activePcTab = tab;
    this.world.paused = true;
    this.world.releasePointerLock();
    this.audio.computer();
    this.el.pcOverlay.classList.remove('hidden');
    this.renderComputer();
  }

  renderComputer() {
    clearInterval(this.cctvTimer);
    const tabs = [['inbox', 'Inbox & Orders'], ['inventory', 'Inventory & Staff'], ['reports', 'Financial Reports'], ['cameras', 'Security Cameras'], ['vocab', 'Vocabulary Journal']];
    this.el.pcNav.innerHTML = tabs.map(([id, label]) => `<button class="${this.activePcTab === id ? 'active' : ''}" data-tab="${id}" type="button">${label}</button>`).join('');
    this.el.pcNav.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { this.activePcTab = b.dataset.tab; this.renderComputer(); });
    const body = this.el.pcBody;
    if (this.activePcTab === 'inbox') {
      body.innerHTML = this.state.orders.map(o => {
        const bodyTxt = esc(o.body).replace(new RegExp(`\\b(${o.vocab.word})\\b`, 'i'), `<span class="word-chip" data-oid="${o.id}">$1</span>`);
        return `<div class="card"><div class="row"><h3>${esc(o.subject)}</h3><strong>${o.status === 'completed' ? '✓ Fulfilled' : `+${o.payout} ◈`}</strong></div><p class="muted">${esc(o.customer)}</p><p style="color:#f1f5f9;margin:8px 0">${bodyTxt}</p>${o.status === 'open' ? `<button class="btn gold" data-fulfill="${o.id}" type="button">Fulfill Order (${o.kitsRequired} Kits → +${o.payout} ◈)</button>` : ''}</div>`;
      }).join('');
      body.querySelectorAll('[data-oid]').forEach(sp => sp.onclick = () => {
        const o = this.state.orders.find(x => x.id === sp.dataset.oid);
        if (o) this.toast(saveVocabWord(this.state, o.vocab, o.subject) ? `Saved "${o.vocab.word}"!` : 'Already saved.');
      });
      body.querySelectorAll('[data-fulfill]').forEach(btn => btn.onclick = () => {
        const o = this.state.orders.find(x => x.id === btn.dataset.fulfill);
        if (!o || o.status !== 'open') return;
        if (this.state.inventory < o.kitsRequired) return this.toast(`Need ${o.kitsRequired} kits in inventory (have ${this.state.inventory}).`);
        this.state.inventory -= o.kitsRequired;
        o.status = 'completed';
        addTransaction(this.state, `Order fulfilled: ${o.customer}`, o.payout);
        this.toast(`Order fulfilled! +${o.payout} ◈`);
        this.renderComputer();
      });
    } else if (this.activePcTab === 'inventory') {
      this.renderBusinessApp(body);
    } else if (this.activePcTab === 'reports') {
      this.renderBankingApp(body);
    } else if (this.activePcTab === 'cameras') {
      body.innerHTML = `<canvas id="cctv-canvas"></canvas><div class="row"><button class="btn ${this.activeCctv === 'street' ? 'gold' : 'secondary'}" data-cam="street">Cam 01 · Main Street</button><button class="btn ${this.activeCctv === 'school' ? 'gold' : 'secondary'}" data-cam="school">Cam 02 · School Forecourt</button><button class="btn ${this.activeCctv === 'office' ? 'gold' : 'secondary'}" data-cam="office">Cam 03 · Market Office</button></div>`;
      const c = body.querySelector('#cctv-canvas');
      body.querySelectorAll('[data-cam]').forEach(b => b.onclick = () => { this.activeCctv = b.dataset.cam; this.renderComputer(); });
      this.world.renderCCTV(c, this.activeCctv);
      this.cctvTimer = setInterval(() => this.world.renderCCTV(c, this.activeCctv), 150);
    } else if (this.activePcTab === 'vocab') {
      body.innerHTML = this.state.vocab.length
        ? this.state.vocab.map(v => `<div class="card"><h3>${esc(v.word)}</h3><p>${esc(v.def)}</p><p class="muted">Source: ${esc(v.source)}</p></div>`).join('')
        : `<div class="card"><h3>No Saved Words Yet</h3><p>Click highlighted gold vocabulary words inside business emails or library books to build your mastery list.</p></div>`;
    }
  }

  handleInteract() {
    const near = this.world.getNearbyInteraction();
    if (!near) return;
    if (near.id === 'market_office_pc') this.openComputer('inbox');
    else if (near.id === 'school_lms') this.openPhone('school');
    else if (near.id === 'school_library') this.openPhone('library');
    else if (near.id === 'cafe_terrace') this.toast('Welcome to Café LumenVale! Check your Office Inbox for Lina’s supply order.');
  }
}
