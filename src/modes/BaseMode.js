import { poseToArray } from '../engine/pose.js';
import { targetFromJoints, scorePose } from '../vision/scoring.js';
import { Voice } from '../audio/Voice.js';
import { Sfx } from '../audio/Sfx.js';

export class Abort extends Error {}

const PRAISE = ['Amazing!', 'Great job!', 'You rock!', 'Awesome!', 'Super star!', 'Way to go!', 'Wow!', 'Fantastic!'];
export const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

/**
 * Game modes are written as simple async scripts ("say this, wait 3 seconds,
 * hold this pose..."). The app calls tick() every frame, which lets those
 * awaits continue. Pausing simply stops time; quitting throws Abort.
 */
export class BaseMode {
  constructor(app, level) {
    this.app = app;
    this.level = level;
    this.world = app.world;
    this.avatar = app.avatar;
    this.music = app.music;
    this.hud = app.hud;
    this.effects = app.effects;
    this.tracker = app.cameraOn ? app.tracker : null;
    this.paused = false;
    this.aborted = false;
    this.waiters = [];
    this.stepStars = [];
    this.score = 0;
    this.targets = new Map();
    this.time = 0;
  }

  get hasCamera() {
    return !!this.tracker?.running;
  }

  tick(dt) {
    if (this.paused || this.aborted) return;
    this.time += dt;
    this.update?.(dt);
    const w = this.waiters;
    this.waiters = [];
    for (const { resolve } of w) resolve(dt);
  }

  nextFrame() {
    if (this.aborted) return Promise.reject(new Abort());
    return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }));
  }

  async wait(seconds) {
    let t = 0;
    while (t < seconds) t += await this.nextFrame();
  }

  async until(fn) {
    while (!fn()) await this.nextFrame();
  }

  untilBeat(beat) {
    return this.until(() => this.music.beat >= beat || this.music.ended);
  }

  abort() {
    this.aborted = true;
    for (const { reject } of this.waiters) reject(new Abort());
    this.waiters = [];
  }

  say(text, opts) {
    this.hud.caption(text);
    Voice.say(text, opts);
  }

  /** Camera target for a pose (cached). */
  target(key, poseArr) {
    if (!this.targets.has(key)) this.targets.set(key, targetFromJoints(this.app.measureRig.measure(poseArr)));
    return this.targets.get(key);
  }

  /** How well the child matches a target right now: 0..1, or null if not visible. */
  match(target) {
    if (!this.hasCamera || !this.tracker.visible) return null;
    return scorePose(target, this.tracker.landmarks, this.tracker.aspect);
  }

  awardStep(stars, text) {
    this.stepStars.push(stars);
    this.hud.stars(stars, text ?? praise());
    Sfx.star();
    this.app.haptic('light');
    this.effects.burst(undefined, 25 + stars * 15);
  }

  poseArray(pose) {
    return poseToArray(pose);
  }

  result() {
    const avg = this.stepStars.length ? this.stepStars.reduce((a, b) => a + b, 0) / this.stepStars.length : 3;
    return { stars: Math.max(1, Math.min(3, Math.round(avg))), score: this.score };
  }
}
