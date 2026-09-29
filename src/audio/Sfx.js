import { getAudio, midiToHz } from './AudioEngine.js';

// Little synthesized sound effects - no audio files needed.
function tone(t, midi, dur, { type = 'sine', peak = 0.25, slide = 0, reverb = true } = {}) {
  const { ctx, sfx, reverbSend } = getAudio();
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(midiToHz(midi), t);
  if (slide) o.frequency.exponentialRampToValueAtTime(midiToHz(midi + slide), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfx);
  if (reverb) g.connect(reverbSend);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const now = () => getAudio().ctx.currentTime + 0.01;

export const Sfx = {
  tap() { tone(now(), 84, 0.08, { type: 'triangle', peak: 0.15, reverb: false }); },
  pop() { tone(now(), 72, 0.12, { type: 'sine', peak: 0.3, slide: 12, reverb: false }); },
  star() {
    const t = now();
    [84, 88, 91, 96].forEach((m, i) => tone(t + i * 0.06, m, 0.4, { type: 'triangle', peak: 0.16 }));
  },
  perfect() {
    const t = now();
    [79, 83, 86, 91].forEach((m, i) => tone(t + i * 0.045, m, 0.3, { type: 'square', peak: 0.06 }));
  },
  good() { tone(now(), 79, 0.2, { type: 'triangle', peak: 0.14 }); },
  count(last = false) { tone(now(), last ? 84 : 72, last ? 0.5 : 0.18, { type: 'square', peak: 0.1 }); },
  whoosh() {
    const { ctx, sfx, noise } = getAudio();
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    src.connect(f).connect(g).connect(sfx);
    src.start(t);
    src.stop(t + 0.4);
  },
  freeze() {
    const t = now();
    [96, 91, 100, 95].forEach((m, i) => tone(t + i * 0.05, m, 0.6, { type: 'sine', peak: 0.12 }));
  },
  fanfare() {
    const t = now();
    const seq = [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.6], [84, 0.72]];
    seq.forEach(([m, d]) => tone(t + d, m, 0.35, { type: 'square', peak: 0.08 }));
    seq.forEach(([m, d]) => tone(t + d, m - 12, 0.35, { type: 'triangle', peak: 0.12 }));
  },
  sizzle() {
    const { ctx, sfx, noise } = getAudio();
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    src.connect(f).connect(g).connect(sfx);
    src.start(t);
    src.stop(t + 0.9);
  },
};
