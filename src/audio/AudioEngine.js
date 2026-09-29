// One shared Web Audio context with a master bus, a reverb send and a music channel.
let engine = null;

export function getAudio() {
  if (engine) return engine;
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC({ latencyHint: 'interactive' });
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  comp.connect(ctx.destination);
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp);

  const reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx, 2.4);
  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.35;
  reverbSend.connect(reverb).connect(master);

  const music = ctx.createGain();
  music.connect(master);
  const sfx = ctx.createGain();
  sfx.gain.value = 0.8;
  sfx.connect(master);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  engine = { ctx, master, music, sfx, reverbSend, noise };
  return engine;
}

/** Browsers only allow sound after a tap, so call this from a click handler. */
export async function unlockAudio() {
  const { ctx } = getAudio();
  if (ctx.state !== 'running') await ctx.resume().catch(() => {});
  // iOS needs a (silent) sound to fully unlock.
  const src = ctx.createBufferSource();
  src.buffer = ctx.createBuffer(1, 1, 22050);
  src.connect(ctx.destination);
  src.start();
}

function impulse(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  return buf;
}

export const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);
