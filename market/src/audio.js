export class AudioEngine {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.ctx = null;
    this.lastStep = 0;
  }
  ensure() {
    const s = this.getSettings();
    if (s.muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) { try { this.ctx = new AC(); } catch { return null; } }
    if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch {} }
    return this.ctx;
  }
  beep(freq, dur, vol, type = 'sine', slideTo = null) {
    const c = this.ensure();
    if (!c || vol <= 0.001) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol * 0.14, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  step(indoor = false) {
    const now = performance.now();
    if (now - this.lastStep < 340) return;
    this.lastStep = now;
    const base = indoor ? 140 : 185;
    this.beep(base + Math.random() * 24, 0.055, this.getSettings().effects * 0.45, 'triangle', base * 0.55);
  }
  phone() { this.beep(660, 0.09, this.getSettings().notifications * 0.55, 'sine', 880); }
  computer() { this.beep(520, 0.08, this.getSettings().effects * 0.5, 'sine', 640); }
  notify() { this.beep(587, 0.11, this.getSettings().notifications * 0.6, 'sine', 784); }
  door() { this.beep(210, 0.12, this.getSettings().effects * 0.6, 'triangle', 135); }
}
