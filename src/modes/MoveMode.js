import { BaseMode, praise } from './BaseMode.js';
import { MOVES, FREEZE_POSES, DANCE_MOVE_IDS } from '../data/moves.js';
import { POSES } from '../data/poses.js';
import { compileMove, sampleMove, grooveAdditive } from '../engine/choreo.js';
import { KEYS, poseToArray } from '../engine/pose.js';
import { Sfx } from '../audio/Sfx.js';

// Danny Go-style active games: move like animals, jump when the floor is lava,
// and freeze when the music stops.
export class MoveMode extends BaseMode {
  async run() {
    const { level, hud, world } = this;
    world.setTheme(level.theme);
    hud.show('move');
    this.pose = new Float32Array(KEYS.length);
    this.groove = new Float32Array(KEYS.length);
    await this.music.play({ id: level.music, style: level.music }, { volume: this.app.state.musicVolume * 0.8 });
    this.danceLoop(MOVES.idle);
    this.say(level.intro);
    await this.wait(4.5);

    for (let i = 0; i < level.steps.length; i++) {
      hud.progress(i / level.steps.length);
      const step = level.steps[i];
      if (step.type === 'move') await this.doMove(step);
      else if (step.type === 'hold') await this.doHold(step);
      else if (step.type === 'freeze') await this.doFreeze(step);
      else if (step.type === 'lava') await this.doLava(step);
    }
    hud.progress(1);
    this.danceLoop(MOVES.celebrate);
    this.effects.rain(150);
    this.say('You did it! What a workout!');
    await this.wait(3);
    this.stopLoop();
  }

  /** Keep the buddy dancing a move on the beat until told otherwise. */
  danceLoop(move, { groove = 0.6 } = {}) {
    const compiled = compileMove(move);
    const start = Math.ceil(this.music.beat);
    this.avatar.additive = this.groove;
    this.update = () => {
      const beat = this.music.beat;
      const face = sampleMove(compiled, beat - start, this.pose);
      this.avatar.setPose(this.pose);
      this.avatar.setFace(face);
      grooveAdditive(beat, groove, this.groove);
      const whole = Math.floor(beat);
      if (whole !== this.lastBeat) {
        this.lastBeat = whole;
        this.world.beat(whole, whole % 4 === 0 ? 1 : 0.5);
      }
    };
  }

  stopLoop() {
    this.update = null;
    this.avatar.additive = null;
  }

  /** Measure effort for a number of beats: jumps if asked, otherwise movement energy. */
  async effort(beats, step) {
    const { hud } = this;
    const end = Math.ceil(this.music.beat) + beats;
    const startBeat = this.music.beat;
    const jumps0 = this.tracker?.jumps ?? 0;
    let energySum = 0, frames = 0;
    hud.meter(0, step.goal === 'jumps' ? `0 / ${step.target}` : '');
    while (this.music.beat < end) {
      await this.nextFrame();
      const done = (this.music.beat - startBeat) / (end - startBeat);
      if (!this.hasCamera) {
        hud.meter(done, '');
        continue;
      }
      energySum += Math.min(this.tracker.energy, 2);
      frames++;
      if (step.goal === 'jumps') {
        const n = this.tracker.jumps - jumps0;
        hud.meter(Math.min(1, n / step.target), `${Math.min(n, step.target)} / ${step.target}`);
        if (n > (this.lastJumps ?? 0)) Sfx.pop();
        this.lastJumps = n;
      } else {
        hud.meter(Math.min(1, energySum / frames / 0.9) * Math.min(1, done * 1.5), '');
      }
    }
    this.lastJumps = 0;
    hud.meter(null);
    if (!this.hasCamera) return 3;
    if (step.goal === 'jumps') {
      const n = this.tracker.jumps - jumps0;
      return n >= step.target ? 3 : n >= step.target / 2 ? 2 : 1;
    }
    const avg = frames ? energySum / frames : 0;
    return avg > 0.8 ? 3 : avg > 0.4 ? 2 : 1;
  }

  async doMove(step) {
    const move = MOVES[step.move];
    this.hud.card({ emoji: move.emoji, name: move.name, thumb: this.app.thumb(`move-${step.move}`, compileMove(move).keys[0].arr) });
    this.say(step.say);
    this.danceLoop(move, { groove: move.energy ? 0.3 : 0.6 });
    Sfx.whoosh();
    await this.untilBeat(Math.ceil(this.music.beat) + 4); // watch first
    const stars = await this.effort(step.beats, step);
    this.awardStep(stars);
    this.danceLoop(MOVES.idle);
    await this.wait(1.2);
  }

  async doHold(step) {
    const def = POSES[step.pose];
    const arr = poseToArray(def.pose);
    this.stopLoop();
    this.hud.card({ emoji: def.emoji, name: def.name, thumb: this.app.thumb(step.pose, arr) });
    this.say(step.say);
    this.avatar.tweenTo(arr, 1.2);
    this.avatar.setFace(def.pose.face ?? 'open');
    await this.wait(2.5);
    const target = this.target(step.pose, arr);
    let t = 0, seen = 0, held = 0;
    while (t < step.seconds) {
      const dt = await this.nextFrame();
      t += dt;
      const s = this.match(target);
      if (s !== null) {
        seen += dt;
        if (s >= 0.45) held += dt;
      }
      this.hud.match(s);
      this.hud.timer(t / step.seconds, Math.ceil(step.seconds - t));
    }
    this.hud.timer(null);
    this.hud.match(null);
    const q = this.hasCamera && seen > 1 ? held / seen : 1;
    this.awardStep(q > 0.6 ? 3 : q > 0.3 ? 2 : 1);
    this.danceLoop(MOVES.idle);
    await this.wait(1.2);
  }

  async doFreeze(step) {
    const { hud } = this;
    this.say(step.rounds > 2 ? 'Dance when the music plays. When it stops... FREEZE!' : 'Freeze dance time! When the music stops, FREEZE!');
    await this.wait(2.5);
    for (let r = 0; r < step.rounds; r++) {
      const id = DANCE_MOVE_IDS[Math.floor(Math.random() * DANCE_MOVE_IDS.length)];
      const move = MOVES[id];
      hud.card({ emoji: '💃', name: 'DANCE!', thumb: this.app.thumb(`move-${id}`, compileMove(move).keys[0].arr) });
      hud.caption('Dance, dance, dance!');
      this.danceLoop(move);
      await this.untilBeat(Math.ceil(this.music.beat) + 8 + Math.floor(Math.random() * 3) * 4);

      // FREEZE!
      this.music.mute(true);
      const fp = poseToArray(FREEZE_POSES[r % FREEZE_POSES.length]);
      this.stopLoop();
      this.avatar.tweenTo(fp, 0.15);
      this.avatar.setFace('open');
      Sfx.freeze();
      hud.banner('FREEZE!', 'ice');
      this.say('Freeze!', { interrupt: true });
      this.app.haptic('heavy');
      await this.wait(0.6); // time to stop moving
      let still = 0, seen = 0;
      const dur = 3 + Math.random() * 2;
      let t = 0;
      while (t < dur) {
        const dt = await this.nextFrame();
        t += dt;
        if (this.hasCamera && this.tracker.visible) {
          seen += dt;
          if (this.tracker.energy < 0.35) still += dt;
          hud.match(Math.max(0, 1 - this.tracker.energy / 0.7));
        }
      }
      hud.match(null);
      hud.banner(null);
      const q = this.hasCamera && seen > 1 ? still / seen : 1;
      const stars = q > 0.75 ? 3 : q > 0.4 ? 2 : 1;
      this.awardStep(stars, stars === 3 ? 'Perfect statue!' : 'Wiggly statue! Hee hee!');
      this.music.mute(false);
      await this.wait(0.8);
    }
  }

  async doLava(step) {
    const { hud, world } = this;
    world.setLava(true);
    Sfx.sizzle();
    hud.banner('THE FLOOR IS LAVA!', 'lava');
    this.say('Oh no! The floor is lava! Jump, jump, jump!');
    this.app.haptic('heavy');
    this.hud.card({ emoji: '🌋', name: 'JUMP!', thumb: this.app.thumb('move-kangaroo', compileMove(MOVES.kangaroo).keys[1].arr) });
    this.danceLoop(MOVES.kangaroo, { groove: 0 });
    world.shake = 1;
    const stars = await this.effort(step.beats, { goal: 'jumps', target: Math.round(step.beats / 2.5) });
    world.setLava(false);
    hud.banner(null);
    this.say(praise() + ' The lava is gone!');
    this.awardStep(stars, 'Phew! Safe!');
    this.danceLoop(MOVES.idle);
    await this.wait(1.5);
  }
}
