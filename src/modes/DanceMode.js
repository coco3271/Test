import { BaseMode } from './BaseMode.js';
import { MOVES, DANCE_MOVE_IDS } from '../data/moves.js';
import { compileMove, sampleMove, grooveAdditive } from '../engine/choreo.js';
import { judge } from '../vision/scoring.js';
import { Sfx } from '../audio/Sfx.js';
import { KEYS } from '../engine/pose.js';

const SEG_BEATS = 8;

function seeded(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
}

/**
 * Builds a song-length routine: a catchy "chorus" of 4 moves that keeps coming
 * back, with verses of other moves in between, like a real dance game.
 */
export function choreograph(song, totalBeats, startBeat) {
  const rnd = seeded(song.id);
  const pool = (song.moves?.length ? song.moves : DANCE_MOVE_IDS).filter((id) => MOVES[id]);
  const shuffled = [...pool].sort(() => rnd() - 0.5);
  const chorus = shuffled.slice(0, 4);
  const verses = [shuffled.slice(4, 8), shuffled.slice(8, 12), shuffled.slice(12, 16)].map((v) => (v.length ? v : chorus));
  const plan = [];
  let v = 0;
  for (let section = 0; plan.length * SEG_BEATS < totalBeats; section++) {
    plan.push(...(section % 2 ? chorus : verses[v++ % verses.length]));
  }
  const segs = [];
  for (let i = 0; i * SEG_BEATS < totalBeats - SEG_BEATS / 2; i++) {
    segs.push({ id: plan[i], move: compileMove(MOVES[plan[i]]), start: startBeat + i * SEG_BEATS, beats: SEG_BEATS });
  }
  return segs;
}

export class DanceMode extends BaseMode {
  async run() {
    const { level: song, hud, world, avatar } = this;
    world.setTheme(song.theme ?? 'disco');
    hud.show('dance');
    this.say(`Let's dance to ${song.title}! Copy my moves!`);
    const info = await this.music.play(song, { volume: this.app.state.musicVolume });
    const bpm = info.bpm;
    const introBeats = song.style ? 8 : Math.max(4, Math.ceil((song.introSeconds ?? 2) * (bpm / 60) / 4) * 4);
    const songBeats = Number.isFinite(info.duration)
      ? Math.floor(((info.duration - info.offset - 1.5) * bpm) / 60) - introBeats
      : 136;
    const segs = choreograph(song, Math.max(32, songBeats), introBeats);
    const endBeat = segs[segs.length - 1].start + SEG_BEATS;

    const pose = new Float32Array(KEYS.length);
    const groove = new Float32Array(KEYS.length);
    avatar.additive = groove;
    let lastBeat = -99, combo = 0, maxPoints = 0, cardSeg = -1;
    const hits = [];
    for (const seg of segs) {
      for (let b = 0; b < seg.beats; b += seg.move.beats) {
        for (const h of seg.move.hits) hits.push({ seg, beat: seg.start + b + h, best: null, energy: 0 });
      }
    }
    let hitIdx = 0;

    while (true) {
      await this.nextFrame();
      const beat = this.music.beat;
      if (beat >= endBeat || this.music.ended) break;

      // Pulse the stage on every beat and count in the start.
      const whole = Math.floor(beat);
      if (whole !== lastBeat) {
        lastBeat = whole;
        world.beat(whole, whole % 4 === 0 ? 1 : 0.6);
        const toGo = introBeats - whole;
        if (toGo > 0 && toGo <= 4) {
          hud.countdown(toGo === 1 ? 'GO!' : String(toGo - 1));
          if (toGo === 1) hud.caption('');
          Sfx.count(toGo === 1);
        }
      }

      // Which move are we on?
      const i = Math.max(0, Math.min(segs.length - 1, Math.floor((beat - introBeats) / SEG_BEATS)));
      const seg = segs[i];
      if (beat < introBeats) {
        const face = sampleMove(compileMove(MOVES.clapBounce), beat, pose);
        avatar.setPose(pose);
        avatar.setFace(face);
      } else {
        const face = sampleMove(seg.move, beat - seg.start, pose);
        avatar.setPose(pose);
        avatar.setFace(face);
      }
      grooveAdditive(beat, 1, groove);

      // Move cards: current + next, with a bar showing when the move changes.
      const cardI = beat < introBeats - 4 ? -1 : beat < introBeats ? 0 : i;
      if (cardI !== cardSeg && cardI >= 0) {
        cardSeg = cardI;
        const cur = segs[cardI], nxt = segs[cardI + 1];
        hud.card(this.cardFor(cur), nxt && this.cardFor(nxt));
      }
      hud.cardProgress(beat < introBeats ? 0 : (beat - seg.start) / SEG_BEATS);
      hud.progress((beat - introBeats) / (endBeat - introBeats));

      // Score each "hit": the best match within half a beat either side.
      while (hitIdx < hits.length && hits[hitIdx].beat + 0.5 < beat) {
        const h = hits[hitIdx++];
        if (!this.hasCamera) continue;
        let s = h.best;
        if (h.seg.move.move.energy) s = Math.max(s ?? 0, Math.min(1, h.energy / 1.2));
        const j = judge(s);
        maxPoints += 100;
        if (!j) {
          hud.judge('Come closer!', 'ok');
          continue;
        }
        combo = j.key === 'perfect' || j.key === 'great' ? combo + 1 : 0;
        this.score += Math.round(j.points * (1 + Math.min(combo, 10) * 0.1));
        hud.judge(j.label, j.key, combo);
        hud.score(this.score);
        if (j.key === 'perfect') {
          Sfx.perfect();
          this.effects.burst(undefined, 20, 0.7);
        } else if (j.key === 'great') Sfx.good();
      }
      for (let k = hitIdx; k < hits.length && hits[k].beat - 0.5 <= beat; k++) {
        const h = hits[k];
        const kp = this.keyPose(h);
        const s = this.match(this.target(`${h.seg.id}@${kp.t}`, kp.arr));
        if (s !== null) h.best = Math.max(h.best ?? 0, s);
        h.energy = Math.max(h.energy, this.tracker?.energy ?? 0);
      }
    }

    avatar.additive = null;
    this.music.fadeOut(1.5);
    const ratio = maxPoints ? this.score / maxPoints : 1;
    this.stepStars = [ratio >= 0.7 ? 3 : ratio >= 0.4 ? 2 : 1];
    this.say(this.hasCamera ? `Wow! You scored ${this.score} points!` : 'What an amazing dance!');
    hud.countdown('🎉');
    this.effects.rain(150);
    await this.wait(2.5);
  }

  keyPose(hit) {
    const { move } = hit.seg;
    const local = (((hit.beat - hit.seg.start) % move.beats) + move.beats) % move.beats;
    return move.keys.find((k) => Math.abs(k.t - local) < 1e-3) ?? move.keys[0];
  }

  cardFor(seg) {
    const m = seg.move.move;
    return { emoji: m.emoji, name: m.name, thumb: this.app.thumb(`move-${seg.id}`, seg.move.keys[0].arr) };
  }
}
