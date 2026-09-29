import { BaseMode, praise } from './BaseMode.js';
import { POSES } from '../data/poses.js';
import { mirrorPose, poseToArray, IDX } from '../engine/pose.js';
import { Sfx } from '../audio/Sfx.js';

// Hold each pose while the buddy breathes with you. With the camera on, the
// timer counts how long the child is really in the pose.
export class YogaMode extends BaseMode {
  async run() {
    const { level, hud, world, avatar } = this;
    world.setTheme(level.theme);
    await this.music.play({ id: level.music, style: level.music }, { volume: 0.45 });
    hud.show('yoga');
    avatar.tweenTo(poseToArray(POSES.mountain.pose), 1);
    this.say(level.intro);
    await this.wait(4);

    const steps = level.steps.flatMap((s) => (s.sides ? [{ ...s }, { ...s, mirrored: true }] : [s]));
    for (let i = 0; i < steps.length; i++) {
      hud.progress(i / steps.length);
      await this.doPose(steps[i], steps[i + 1]);
    }
    hud.progress(1);
    avatar.tweenTo(poseToArray(POSES.mountain.pose), 1.5);
    this.say(level.id === 'bedtime-yoga' ? 'Sweet dreams, yoga star!' : 'You are a yoga superstar!');
    await this.wait(3);
  }

  async doPose(step, next) {
    const { hud, avatar } = this;
    const def = POSES[step.pose];
    const pose = step.mirrored ? mirrorPose(def.pose) : def.pose;
    const arr = poseToArray(pose);
    const key = `${step.pose}${step.mirrored ? '-m' : ''}`;
    const nextDef = next && POSES[next.pose];
    hud.card(
      { emoji: def.emoji, name: def.name, thumb: this.app.thumb(key, arr) },
      nextDef && { emoji: nextDef.emoji, name: nextDef.name },
    );
    this.say(step.mirrored ? 'Now the other side!' : step.say);
    avatar.tweenTo(arr, 1.8);
    avatar.setFace(pose.face ?? 'smile');
    Sfx.whoosh();
    await this.wait(step.mirrored ? 2.5 : 4);

    const target = this.target(key, arr);
    let held = 0, seen = 0, t = 0, breathIn = true, breathT = 0;
    hud.breath('Breathe in...');
    while (t < step.hold) {
      const dt = await this.nextFrame();
      t += dt;
      breathT += dt;
      if (breathT > 3.5) {
        breathT = 0;
        breathIn = !breathIn;
        hud.breath(breathIn ? 'Breathe in...' : 'Breathe out...');
      }
      // Balance poses wobble a tiny bit - it's hard to be a tree!
      if (def.balance) {
        avatar.additive ??= new Float32Array(arr.length);
        avatar.additive.fill(0);
        avatar.additive[IDX['spine.z']] = Math.sin(this.time * 2.3) * 2.5;
        avatar.additive[IDX['armL.side']] = Math.sin(this.time * 1.7) * 4;
        avatar.additive[IDX['armR.side']] = Math.cos(this.time * 1.9) * 4;
      }
      const s = this.match(target);
      if (s !== null) {
        seen += dt;
        if (s >= 0.45) held += dt;
      }
      hud.match(s);
      hud.timer(t / step.hold, Math.ceil(step.hold - t));
    }
    avatar.additive = null;
    hud.breath('');
    hud.timer(null);
    hud.match(null);

    const quality = this.hasCamera && seen > step.hold * 0.3 ? held / seen : 1;
    const stars = quality >= 0.65 ? 3 : quality >= 0.35 ? 2 : 1;
    this.score += Math.round(quality * 100);
    this.awardStep(stars, stars === 3 ? praise() : 'Nice try!');
    await this.wait(1.5);
  }
}
