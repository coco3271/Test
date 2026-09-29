// Finds the tempo and first-beat offset of a song, so any Suno track can be danced to.
// Onset-strength envelope + autocorrelation, with a gentle preference for
// kid-friendly tempos (~90-140 BPM).

export function detectBeat(buffer) {
  const sr = buffer.sampleRate;
  const hop = 512;
  const fr = sr / hop;
  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;
  const start = Math.floor(Math.min(20, buffer.duration * 0.15) * sr);
  const end = Math.min(ch0.length, start + 45 * sr);
  const frames = Math.floor((end - start) / hop);
  if (frames < fr * 8) return { bpm: 120, offset: 0 };

  // Energy per frame, then positive differences = "onsets".
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const o = start + f * hop;
    for (let i = 0; i < hop; i++) {
      const s = (ch0[o + i] + ch1[o + i]) * 0.5;
      sum += s * s;
    }
    energy[f] = Math.log1p(sum * 100);
  }
  const onset = new Float32Array(frames);
  for (let f = 1; f < frames; f++) onset[f] = Math.max(0, energy[f] - energy[f - 1]);
  let mean = 0;
  for (const v of onset) mean += v;
  mean /= frames;
  for (let f = 0; f < frames; f++) onset[f] = Math.max(0, onset[f] - mean);

  const minLag = Math.floor((fr * 60) / 180);
  const maxLag = Math.ceil((fr * 60) / 70);
  const scores = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let s = 0;
    for (let f = 0; f + lag < frames; f++) s += onset[f] * onset[f + lag];
    scores[lag] = s;
  }
  let best = minLag, bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = (60 * fr) / lag;
    const prefer = Math.exp(-0.5 * (Math.log2(bpm / 118) / 0.45) ** 2);
    const s = scores[lag] * (0.6 + 0.4 * prefer);
    if (s > bestScore) {
      bestScore = s;
      best = lag;
    }
  }
  // Fine search around the coarse tempo: the tempo + phase whose beat grid
  // lands on the most onsets over the whole window wins.
  const coarse = (60 * fr) / best;
  const comb = (bpmTry, phase) => {
    const period = (60 / bpmTry) * fr;
    let sum = 0;
    for (let f = phase; f < frames - 1; f += period) {
      const i = Math.floor(f), k = f - i;
      sum += onset[i] * (1 - k) + onset[i + 1] * k;
    }
    return sum;
  };
  let bpm = coarse, bestPhase = 0, phaseScore = -Infinity;
  for (let b = coarse - 1.5; b <= coarse + 1.5; b += 0.05) {
    const period = (60 / b) * fr;
    for (let p = 0; p < period; p += 0.5) {
      const sc = comb(b, p);
      if (sc > phaseScore) {
        phaseScore = sc;
        bpm = b;
        bestPhase = p;
      }
    }
  }
  if (Math.abs(bpm - Math.round(bpm)) < 0.3) {
    // Snap to a whole number (songs are made at whole BPMs) and redo the phase.
    bpm = Math.round(bpm);
    phaseScore = -Infinity;
    for (let p = 0; p < (60 / bpm) * fr; p += 0.25) {
      const sc = comb(bpm, p);
      if (sc > phaseScore) {
        phaseScore = sc;
        bestPhase = p;
      }
    }
  }

  const beatSec = 60 / bpm;
  const offset = ((start / sr + bestPhase / fr) % beatSec + beatSec) % beatSec;
  return { bpm, offset };
}
