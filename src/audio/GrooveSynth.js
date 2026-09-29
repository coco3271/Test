import { getAudio, midiToHz } from './AudioEngine.js';

// Built-in music so the game works before you add any Suno songs.
// Every style is a tiny procedural band: drums, bass, chords and a catchy
// melody that repeats (kids love repetition!).

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

export const STYLES = {
  pop: { name: 'Sunny Pop', bpm: 118, root: 60, scale: MAJOR, prog: [0, 4, 5, 3], drums: 'four', lead: 'pluck', seed: 3 },
  bouncy: { name: 'Bouncy Castle', bpm: 128, root: 62, scale: MAJOR, prog: [0, 5, 3, 4], drums: 'four', lead: 'square', seed: 11 },
  funky: { name: 'Funky Monkey', bpm: 104, root: 57, scale: MINOR, prog: [0, 3, 6, 4], drums: 'funk', lead: 'square', seed: 7 },
  adventure: { name: 'Jungle Run', bpm: 112, root: 57, scale: MINOR, prog: [0, 5, 2, 6], drums: 'toms', lead: 'pluck', seed: 21 },
  calm: { name: 'Cloud Dreams', bpm: 66, root: 55, scale: MAJOR, prog: [0, 3, 5, 4], drums: null, lead: 'bell', seed: 5 },
  sleepy: { name: 'Starry Night', bpm: 60, root: 53, scale: MAJOR, prog: [0, 5, 3, 4], drums: null, lead: 'bell', seed: 9 },
};

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export class GrooveSynth {
  constructor(styleId, out) {
    this.style = STYLES[styleId] ?? STYLES.pop;
    this.a = getAudio();
    this.out = out;
    this.bpm = this.style.bpm;
    this.melody = this.makeMelody();
    this.timer = null;
  }

  makeMelody() {
    const r = rng(this.style.seed);
    const rhythms = [
      [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
      [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
      [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    ];
    const motif = [];
    for (let bar = 0; bar < 2; bar++) {
      const rhythm = rhythms[Math.floor(r() * rhythms.length)];
      let degree = [0, 2, 4][Math.floor(r() * 3)];
      rhythm.forEach((on, step) => {
        if (!on) return;
        degree += [-2, -1, 1, 2, 0][Math.floor(r() * 5)];
        degree = Math.max(-1, Math.min(8, degree));
        motif.push({ bar, step, degree, chordTone: step % 4 === 0 });
      });
    }
    return motif;
  }

  note(degree, octave = 0) {
    const { scale, root } = this.style;
    const o = Math.floor(degree / 7);
    return root + scale[((degree % 7) + 7) % 7] + 12 * (o + octave);
  }

  start(when) {
    this.startTime = when;
    this.step = 0;
    this.nextTime = when;
    const stepDur = 60 / this.bpm / 4;
    const tick = () => {
      const now = this.a.ctx.currentTime;
      while (this.nextTime < now + 0.2) {
        this.schedule(this.step, this.nextTime, stepDur);
        this.step++;
        this.nextTime += stepDur;
      }
    };
    tick();
    this.timer = setInterval(tick, 25);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  schedule(step, t, sd) {
    const s = this.style;
    const bar = Math.floor(step / 16);
    const i = step % 16;
    const section = Math.floor(bar / 8) % 4; // builds up over time
    const chordDeg = s.prog[bar % s.prog.length];

    // Drums.
    if (s.drums && bar > 0) {
      if (s.drums === 'four' && i % 4 === 0) this.kick(t);
      if (s.drums === 'funk' && [0, 3, 6, 10].includes(i)) this.kick(t);
      if (s.drums === 'toms') {
        if (i % 4 === 0) this.kick(t);
        if ([6, 7, 14].includes(i)) this.tom(t, [180, 150, 120][i % 3]);
      }
      if (i === 4 || i === 12) this.snare(t);
      if (i % 2 === 0 || (section > 0 && s.drums !== 'toms')) this.hat(t, i % 4 === 2);
    }

    // Bass.
    if (s.drums && (i % 2 === 0) && !(s.drums === 'funk' && i % 4 === 2)) {
      const octave = i % 8 === 6 ? 1 : 0;
      this.bass(t, this.note(chordDeg) - 24 + octave * 12, sd * 1.8);
    }

    // Chords.
    if (i === 0) {
      const chord = [0, 2, 4].map((d) => this.note(chordDeg + d) - 12);
      this.pad(t, chord, sd * 16);
    }
    if (!s.drums && i === 8) this.bell(t, this.note(chordDeg + 4), 0.06);

    // Melody (enters after the intro).
    if (bar >= (s.drums ? 2 : 1)) {
      const phraseBar = bar % 2;
      for (const n of this.melody) {
        if (n.bar === phraseBar && n.step === i) {
          const deg = n.chordTone ? chordDeg + [0, 2, 4][Math.abs(n.degree) % 3] : n.degree;
          const midi = this.note(deg, s.lead === 'bell' ? 1 : 0);
          if (s.lead === 'bell') this.bell(t, midi, 0.1);
          else this.lead(t, midi, sd * 1.6, s.lead);
        }
      }
    }
  }

  // ---------------------------------------------------------------- voices
  env(t, attack, decay, peak, dest = this.out) {
    const g = this.a.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(dest);
    return g;
  }

  kick(t) {
    const { ctx } = this.a;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(this.env(t, 0.002, 0.35, 0.9));
    o.start(t);
    o.stop(t + 0.4);
  }

  tom(t, f) {
    const { ctx } = this.a;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.2);
    o.connect(this.env(t, 0.002, 0.25, 0.5));
    o.start(t);
    o.stop(t + 0.3);
  }

  noise(t, dur, type, freq, peak) {
    const { ctx, noise } = this.a;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    src.connect(f).connect(this.env(t, 0.001, dur, peak));
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  snare(t) {
    this.noise(t, 0.18, 'bandpass', 1800, 0.5);
    const o = this.a.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 190;
    o.connect(this.env(t, 0.001, 0.1, 0.3));
    o.start(t);
    o.stop(t + 0.15);
  }

  hat(t, open) {
    this.noise(t, open ? 0.16 : 0.04, 'highpass', 8000, open ? 0.12 : 0.09);
  }

  bass(t, midi, dur) {
    const { ctx } = this.a;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = midiToHz(midi);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 5;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(180, t + dur);
    o.connect(f).connect(this.env(t, 0.005, dur, 0.32));
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  pad(t, notes, dur) {
    const { ctx, reverbSend } = this.a;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.4);
    g.gain.setValueAtTime(0.05, t + dur - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1400;
    f.connect(g);
    g.connect(this.out);
    g.connect(reverbSend);
    for (const m of notes) {
      for (const detune of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midiToHz(m);
        o.detune.value = detune;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 0.5);
      }
    }
  }

  lead(t, midi, dur, type) {
    const { ctx, reverbSend } = this.a;
    const o = ctx.createOscillator();
    o.type = type === 'square' ? 'square' : 'triangle';
    o.frequency.value = midiToHz(midi + 12);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3500, t);
    f.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = this.env(t, 0.005, dur + 0.15, type === 'square' ? 0.07 : 0.16);
    g.connect(reverbSend);
    o.connect(f).connect(g);
    o.start(t);
    o.stop(t + dur + 0.3);
  }

  bell(t, midi, peak) {
    const { ctx, reverbSend } = this.a;
    const g = this.env(t, 0.005, 1.8, peak);
    g.connect(reverbSend);
    for (const [ratio, amp] of [[1, 1], [2.76, 0.3], [5.4, 0.1]]) {
      const o = ctx.createOscillator();
      o.frequency.value = midiToHz(midi) * ratio;
      const og = ctx.createGain();
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 2);
    }
  }
}
