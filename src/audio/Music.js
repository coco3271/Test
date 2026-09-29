import { getAudio } from './AudioEngine.js';
import { GrooveSynth, STYLES } from './GrooveSynth.js';
import { detectBeat } from './bpm.js';

/**
 * Plays either a built-in synth style or an audio file (e.g. a Suno song),
 * and exposes a beat clock the game syncs everything to.
 *
 * song = { id, title, style }                       -> built-in music
 * song = { id, title, file | blob, bpm?, offset? }  -> audio file; BPM is
 *        auto-detected when not given.
 */
export class MusicPlayer {
  constructor() {
    this.a = getAudio();
    this.buffers = new Map();
    this.source = null;
    this.synth = null;
    this.playing = false;
    this.bpm = 120;
    this.offset = 0;
    this.duration = Infinity;
  }

  async load(song) {
    if (song.style) return { bpm: STYLES[song.style].bpm, offset: 0, duration: Infinity };
    if (!this.buffers.has(song.id)) {
      const data = song.blob ? await song.blob.arrayBuffer() : await (await fetch(song.file)).arrayBuffer();
      const buffer = await this.a.ctx.decodeAudioData(data);
      let { bpm, offset } = song;
      if (!bpm) ({ bpm, offset } = detectBeat(buffer));
      this.buffers.set(song.id, { buffer, bpm, offset: offset ?? 0 });
    }
    const b = this.buffers.get(song.id);
    return { bpm: b.bpm, offset: b.offset, duration: b.buffer.duration };
  }

  async play(song, { volume = 0.8 } = {}) {
    this.stop();
    const { ctx, music } = this.a;
    const info = await this.load(song);
    this.bpm = info.bpm;
    this.offset = info.offset;
    this.duration = info.duration;
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.setValueAtTime(volume, ctx.currentTime);
    this.volume = volume;
    this.startTime = ctx.currentTime + 0.15;
    if (song.style) {
      this.synth = new GrooveSynth(song.style, music);
      this.synth.start(this.startTime);
    } else {
      this.source = ctx.createBufferSource();
      this.source.buffer = this.buffers.get(song.id).buffer;
      this.source.connect(music);
      this.source.start(this.startTime);
    }
    this.playing = true;
    return info;
  }

  /** Seconds since the song started, compensating for audio output latency. */
  get time() {
    if (!this.playing) return 0;
    const { ctx } = this.a;
    return ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0) - this.startTime;
  }

  /** Beats since the first downbeat (can be negative during the intro). */
  get beat() {
    return ((this.time - this.offset) * this.bpm) / 60;
  }

  get ended() {
    return this.playing && this.time >= this.duration;
  }

  /** Freeze-dance: music off / on, while the beat clock keeps running. */
  mute(on) {
    const { ctx, music } = this.a;
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.setTargetAtTime(on ? 0 : this.volume, ctx.currentTime, 0.04);
  }

  fadeOut(seconds = 1) {
    const { ctx, music } = this.a;
    music.gain.setTargetAtTime(0, ctx.currentTime, seconds / 3);
    setTimeout(() => this.stop(), seconds * 1000);
  }

  pause() {
    this.a.ctx.suspend();
  }

  resume() {
    this.a.ctx.resume();
  }

  stop() {
    this.synth?.stop();
    this.synth = null;
    try {
      this.source?.stop();
    } catch {
      // already stopped
    }
    this.source = null;
    this.playing = false;
  }
}
