// Lightweight procedural Web Audio soundscape & interaction cues for LumenVale.

const LV_AUDIO_PREFS_KEY = 'lumenvale-audio-prefs-v1';

function lvLoadAudioSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(LV_AUDIO_PREFS_KEY) || '{}');
    return {
      effects: Math.max(0, Math.min(1, raw.effects != null ? Number(raw.effects) : 0.45)),
      ambience: Math.max(0, Math.min(1, raw.ambience != null ? Number(raw.ambience) : 0.2)),
      notifications: Math.max(0, Math.min(1, raw.notifications != null ? Number(raw.notifications) : 0.5)),
      muted: Boolean(raw.muted),
    };
  } catch {
    return { effects: 0.45, ambience: 0.2, notifications: 0.5, muted: false };
  }
}

var lvAudioSettings = lvLoadAudioSettings();

function lvSaveAudioSettings() {
  try { localStorage.setItem(LV_AUDIO_PREFS_KEY, JSON.stringify(lvAudioSettings)); } catch {}
}

const lvAudio = (() => {
  let ctx = null;
  let lastStep = 0;

  function ensure() {
    if (lvAudioSettings.muted || typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) { try { ctx = new AC(); } catch { return null; } }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch {} }
    return ctx;
  }

  function tone(freq, dur, gainLevel, type = 'sine', slideTo = null) {
    const c = ensure();
    if (!c || gainLevel <= 0.001) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    g.gain.setValueAtTime(gainLevel * 0.14, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  return {
    step(surface = 'stone') {
      const now = performance.now();
      if (now - lastStep < 340) return;
      lastStep = now;
      const base = surface === 'wood' ? 145 : surface === 'grass' ? 95 : 175;
      tone(base + Math.random() * 25, 0.055, lvAudioSettings.effects * 0.45, 'triangle', base * 0.55);
    },
    door() {
      tone(210, 0.12, lvAudioSettings.effects * 0.65, 'triangle', 135);
    },
    phone() {
      tone(660, 0.09, lvAudioSettings.notifications * 0.55, 'sine', 880);
    },
    computer() {
      tone(520, 0.08, lvAudioSettings.effects * 0.5, 'sine', 640);
    },
    notify() {
      tone(587, 0.11, lvAudioSettings.notifications * 0.6, 'sine', 784);
    },
  };
})();
