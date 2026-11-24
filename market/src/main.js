import { loadState } from './state.js';
import { AudioEngine } from './audio.js';
import { LumenValeWorld } from './world.js';
import { GameUI } from './ui.js';

const state = loadState();
const audio = new AudioEngine(() => state.settings);
const loadFill = document.getElementById('load-fill');
const loadStatus = document.getElementById('load-status');
const loadScreen = document.getElementById('loading-screen');

const world = new LumenValeWorld(document.getElementById('game-canvas'), state, audio, (pct, msg) => {
  loadFill.style.width = `${pct}%`;
  loadStatus.textContent = msg;
});
const ui = new GameUI(state, world, audio);
window.lumenvale = { state, world, ui };

window.addEventListener('keydown', (e) => {
  if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.code === 'KeyP') { e.preventDefault(); ui.phoneOpen ? ui.closeAll() : ui.openPhone(); }
  else if (e.code === 'KeyE' && !ui.phoneOpen && !ui.pcOpen) { e.preventDefault(); ui.handleInteract(); }
  else if (e.code === 'Escape' && (ui.phoneOpen || ui.pcOpen)) { ui.closeAll(); }
  else if (e.code === 'KeyF' && !ui.phoneOpen && !ui.pcOpen) {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }
});

document.getElementById('game-canvas').addEventListener('click', () => {
  if (!ui.phoneOpen && !ui.pcOpen) world.requestPointerLock();
});

let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  world.update(dt);
  ui.syncHUD();
  requestAnimationFrame(loop);
}

world.load().then(() => {
  loadScreen.classList.add('fade');
  setTimeout(() => loadScreen.remove(), 500);
  requestAnimationFrame(loop);
}).catch((err) => {
  loadStatus.textContent = `Load error: ${err.message}`;
  console.error(err);
});
