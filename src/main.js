import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StatusBar } from '@capacitor/status-bar';

import { World } from './engine/World.js';
import { Avatar } from './engine/Avatar.js';
import { Effects } from './engine/Effects.js';
import { Thumbnails } from './engine/Thumbnails.js';
import { compileMove, sampleMove } from './engine/choreo.js';
import { KEYS } from './engine/pose.js';
import { MusicPlayer } from './audio/Music.js';
import { unlockAudio } from './audio/AudioEngine.js';
import { Voice } from './audio/Voice.js';
import { Sfx } from './audio/Sfx.js';
import { PoseTracker } from './vision/PoseTracker.js';
import { Hud } from './ui/Hud.js';
import { BUDDIES, buddyById } from './data/buddies.js';
import { MOVES } from './data/moves.js';
import { YOGA, GAMES, BUILTIN_SONGS, STICKERS } from './data/routines.js';
import { YogaMode } from './modes/YogaMode.js';
import { DanceMode } from './modes/DanceMode.js';
import { MoveMode } from './modes/MoveMode.js';
import { Abort } from './modes/BaseMode.js';
import { loadState, saveState, SongStore } from './storage.js';

const $ = (id) => document.getElementById(id);
const BUDDY_EMOJI = { bear: '🐻', bunny: '🐰', cat: '🐱', panda: '🐼' };
const MODES = {
  yoga: { title: 'Yoga Adventure', Mode: YogaMode },
  dance: { title: 'Dance Party', Mode: DanceMode },
  move: { title: 'Move & Groove', Mode: MoveMode },
};

function autoQuality() {
  const phone = matchMedia('(pointer: coarse)').matches;
  if (!phone) return 'high';
  return (navigator.hardwareConcurrency ?? 4) >= 8 ? 'high' : 'medium';
}

class App {
  constructor() {
    this.state = loadState();
    Voice.enabled = this.state.voice;
    const quality = this.state.quality === 'auto' ? autoQuality() : this.state.quality;
    this.world = new World($('scene'), { quality });
    this.effects = new Effects(this.world.scene);
    this.music = new MusicPlayer();
    this.hud = new Hud();
    this.tracker = new PoseTracker($('cam'), $('skeleton'));
    this.setBuddy(this.state.buddy);
    this.history = [];
    this.mode = null;
    this.idlePose = new Float32Array(KEYS.length);
    this.idleMove = compileMove(MOVES.hello);
    this.userSongs = [];
    this.manifestSongs = [];

    this.world.onUpdate((dt, t, realDt) => {
      if (this.mode) this.mode.tick(realDt);
      else this.idle(t);
      this.avatar.update(dt, t);
      this.effects.update(dt);
    });
    this.bindUi();
    this.world.start();
    this.loadSongs();
    if (Capacitor.isNativePlatform()) StatusBar.hide().catch(() => {});
    $('total-stars').textContent = this.state.totalStars;
    requestAnimationFrame(() => $('loading').classList.add('done'));
    // Handy for debugging from the browser console.
    window.zoomi = this;
  }

  setBuddy(id) {
    const buddy = buddyById(id);
    if (this.avatar) this.world.scene.remove(this.avatar.root);
    this.avatar = new Avatar(buddy);
    this.world.scene.add(this.avatar.root);
    this.measureRig = new Avatar(buddy, { visual: false });
    this.thumbs = new Thumbnails(this.world.renderer, buddy);
    document.querySelector('[data-action="buddies"]').textContent = BUDDY_EMOJI[buddy.id];
  }

  thumb(key, poseArr) {
    try {
      return this.thumbs.get(key, poseArr);
    } catch {
      return null;
    }
  }

  /** On menus the buddy waves (title) or chills to the menu music. */
  idle(t) {
    const move = this.screen === 'title' || this.screen === 'results' ? this.idleMove : compileMove(MOVES.idle);
    const face = sampleMove(move, t * 1.7, this.idlePose);
    this.avatar.setPose(this.idlePose);
    this.avatar.setFace(face);
  }

  haptic(kind) {
    Haptics.impact({ style: kind === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Light }).catch(() => {});
  }

  // ------------------------------------------------------------------ screens
  show(id, { push = true } = {}) {
    if (push && this.screen && this.screen !== id) this.history.push(this.screen);
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${id}`));
    this.screen = id;
    if (['title', 'modes', 'levels', 'buddies', 'stickers'].includes(id)) {
      this.world.cameraZoom = id === 'title' ? 0.95 : 1.15;
    }
  }

  back() {
    const prev = this.history.pop() ?? 'modes';
    if (this.screen === 'camera') this.stopCamera();
    this.show(prev, { push: false });
  }

  bindUi() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      Sfx.tap();
      const { action, mode } = btn.dataset;
      if (mode) this.openLevels(mode);
      if (action && this[`on_${action.replace(/-/g, '_')}`]) this[`on_${action.replace(/-/g, '_')}`](btn);
    });
    $('song-file').addEventListener('change', (e) => this.importSongs([...e.target.files]));
    $('set-camera').addEventListener('change', (e) => this.setSetting('camera', e.target.checked));
    $('set-voice').addEventListener('change', (e) => {
      this.setSetting('voice', e.target.checked);
      Voice.enabled = e.target.checked;
    });
    $('set-volume').addEventListener('input', (e) => this.setSetting('musicVolume', Number(e.target.value)));
    $('set-quality').addEventListener('change', (e) => {
      this.setSetting('quality', e.target.value);
      this.qualityChanged = true;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode && !this.mode.paused) this.on_pause();
    });
  }

  setSetting(key, value) {
    this.state[key] = value;
    saveState(this.state);
  }

  // ------------------------------------------------------------------ actions
  async on_start() {
    await unlockAudio();
    this.music.play({ id: 'menu', style: 'calm' }, { volume: 0.25 });
    Voice.say("Hi! I'm your buddy! What do you want to play?");
    this.show('modes');
  }

  on_back() {
    this.back();
  }

  on_buddies() {
    const list = $('buddy-list');
    list.innerHTML = '';
    for (const b of BUDDIES) {
      const el = document.createElement('button');
      el.className = `buddy ${b.id === this.state.buddy ? 'selected' : ''}`;
      el.innerHTML = `<span class="emoji">${BUDDY_EMOJI[b.id]}</span>${b.name}`;
      el.onclick = () => {
        this.setSetting('buddy', b.id);
        this.setBuddy(b.id);
        this.effects.burst();
        Voice.say(`Hi, I'm ${b.name}!`);
        this.on_buddies();
      };
      list.append(el);
    }
    if (this.screen !== 'buddies') this.show('buddies');
  }

  on_stickers() {
    const grid = $('sticker-grid');
    grid.innerHTML = '';
    for (const s of STICKERS) {
      const d = document.createElement('div');
      d.textContent = s;
      if (!this.state.stickers.includes(s)) d.className = 'locked';
      grid.append(d);
    }
    this.show('stickers');
  }

  on_parents() {
    const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 6);
    $('gate-q').textContent = `What is ${a} + ${b}?`;
    const answers = new Set([a + b]);
    while (answers.size < 4) answers.add(a + b + Math.floor(Math.random() * 9) - 4);
    const box = $('gate-answers');
    box.innerHTML = '';
    for (const n of [...answers].sort(() => Math.random() - 0.5)) {
      const btn = document.createElement('button');
      btn.textContent = n;
      btn.onclick = () => (n === a + b ? this.openSettings() : this.back());
      box.append(btn);
    }
    this.show('gate');
  }

  openSettings() {
    $('set-camera').checked = this.state.camera;
    $('set-voice').checked = this.state.voice;
    $('set-volume').value = this.state.musicVolume;
    $('set-quality').value = this.state.quality;
    this.renderMySongs();
    this.show('parents', { push: false });
  }

  on_close_parents() {
    if (this.qualityChanged) location.reload();
    this.show('modes', { push: false });
  }

  on_add_song() {
    $('song-file').click();
  }

  on_pause() {
    if (!this.mode) return;
    this.mode.paused = true;
    this.music.pause();
    Voice.stop();
    this.show('pause', { push: false });
  }

  on_resume() {
    this.mode.paused = false;
    this.music.resume();
    this.show('game', { push: false });
  }

  on_quit() {
    this.endGame();
    this.goHome();
  }

  on_home() {
    this.goHome();
  }

  on_again() {
    this.startLevel(this.lastKind, this.lastLevel);
  }

  on_no_camera() {
    this.stopCamera();
    this.cameraOn = false;
    this.beginGame();
  }

  goHome() {
    this.stopCamera();
    this.world.setTheme('meadow');
    this.music.play({ id: 'menu', style: 'calm' }, { volume: 0.25 });
    this.history = [];
    this.show('modes', { push: false });
  }

  // ------------------------------------------------------------------ levels
  async loadSongs() {
    try {
      const res = await fetch('music/songs.json');
      const json = await res.json();
      this.manifestSongs = (json.songs ?? []).map((s) => ({
        emoji: '🎵', theme: 'disco', ...s, id: s.id ?? s.file, file: `music/${s.file}`,
      }));
    } catch {
      this.manifestSongs = [];
    }
    this.userSongs = await SongStore.list();
  }

  levelsFor(kind) {
    if (kind === 'yoga') return YOGA;
    if (kind === 'move') return GAMES;
    return [...this.manifestSongs, ...this.userSongs.map((s) => ({ ...s, emoji: s.emoji ?? '🎵' })), ...BUILTIN_SONGS];
  }

  openLevels(kind) {
    this.kind = kind;
    $('levels-title').textContent = MODES[kind].title;
    const list = $('level-list');
    list.innerHTML = '';
    for (const level of this.levelsFor(kind)) {
      const el = document.createElement('button');
      el.className = 'level';
      const got = this.state.stars[level.id] ?? 0;
      el.innerHTML = `<span class="emoji"></span><b></b><span class="lstars">${'⭐'.repeat(got)}${'☆'.repeat(3 - got)}</span>`;
      el.querySelector('.emoji').textContent = level.emoji;
      el.querySelector('b').textContent = level.title;
      el.onclick = () => this.startLevel(kind, level);
      list.append(el);
    }
    if (kind === 'dance') {
      const add = document.createElement('button');
      add.className = 'level add';
      add.innerHTML = '<span class="emoji">➕</span><b>Add my song</b><span class="lstars">grown-ups</span>';
      add.onclick = () => this.on_parents();
      list.append(add);
    }
    this.show('levels');
    const theme = { yoga: 'meadow', dance: 'disco', move: 'jungle' }[kind];
    if (this.world.themeName !== theme) this.world.setTheme(theme);
  }

  async startLevel(kind, level) {
    this.lastKind = kind;
    this.lastLevel = level;
    this.cameraOn = false;
    if (!this.state.camera) return this.beginGame();
    if (this.tracker.running && this.tracker.fullBody) {
      this.cameraOn = true;
      return this.beginGame();
    }
    this.show('camera');
    const status = $('cam-status');
    status.className = 'cam-status';
    status.textContent = 'Starting camera…';
    $('pip').className = 'big';
    try {
      if (!this.tracker.running) await this.tracker.start();
    } catch (err) {
      console.warn('camera unavailable', err);
      status.textContent = "No camera - that's OK, just copy me!";
      $('pip').className = 'hidden';
      setTimeout(() => this.screen === 'camera' && this.on_no_camera(), 1800);
      return;
    }
    Voice.say('Step back so I can see you from your head to your toes!');
    let goodFor = 0, last = performance.now();
    const check = () => {
      if (this.screen !== 'camera') return;
      const now = performance.now();
      const ok = this.tracker.fullBody;
      goodFor = ok ? goodFor + (now - last) : 0;
      last = now;
      status.className = `cam-status ${ok ? 'ok' : ''}`;
      status.textContent = ok ? 'I can see you! Get ready…' : this.tracker.landmarks ? 'Step back a little more…' : 'Looking for you…';
      $('pip').classList.toggle('good', ok);
      if (goodFor > 1500) {
        this.cameraOn = true;
        this.beginGame();
      } else requestAnimationFrame(check);
    };
    check();
  }

  stopCamera() {
    this.tracker.stop();
    $('pip').className = 'hidden';
  }

  async beginGame() {
    const { Mode } = MODES[this.lastKind];
    $('pip').className = this.cameraOn ? '' : 'hidden';
    this.show('game', { push: false });
    this.world.cameraZoom = 1;
    KeepAwake.keepAwake().catch(() => {});
    this.mode = new Mode(this, this.lastLevel);
    try {
      await this.mode.run();
      this.finish(this.mode.result());
    } catch (err) {
      if (!(err instanceof Abort)) {
        console.error(err);
        this.endGame();
        this.goHome();
      }
    }
  }

  endGame() {
    if (this.mode) this.mode.abort();
    this.mode = null;
    this.music.stop();
    this.music.resume();
    Voice.stop();
    this.world.setLava(false);
    this.avatar.additive = null;
    KeepAwake.allowSleep().catch(() => {});
  }

  finish({ stars, score }) {
    const level = this.lastLevel;
    this.endGame();
    const prev = this.state.stars[level.id] ?? 0;
    this.state.stars[level.id] = Math.max(prev, stars);
    this.state.totalStars += stars;
    const missing = STICKERS.filter((s) => !this.state.stickers.includes(s));
    const sticker = (missing.length ? missing : STICKERS)[Math.floor(Math.random() * (missing.length || STICKERS.length))];
    if (!this.state.stickers.includes(sticker)) this.state.stickers.push(sticker);
    saveState(this.state);
    $('total-stars').textContent = this.state.totalStars;

    $('res-title').textContent = ['Good try!', 'Great job!', 'SUPERSTAR!'][stars - 1];
    $('res-stars').innerHTML = [1, 2, 3].map((n) => `<span class="${n <= stars ? '' : 'off'}" style="animation-delay:${n * 0.25}s">⭐</span>`).join('');
    $('res-score').textContent = this.lastKind === 'dance' && score ? `${score.toLocaleString()} points` : '';
    $('res-sticker').textContent = sticker;
    this.stopCamera();
    this.show('results', { push: false });
    this.world.cameraZoom = 0.9;
    this.effects.rain(200);
    Sfx.fanfare();
    this.haptic('heavy');
    Voice.say(`${$('res-title').textContent} You earned ${stars} star${stars > 1 ? 's' : ''} and a new sticker!`);
    this.music.play({ id: 'win', style: 'bouncy' }, { volume: 0.3 });
  }

  // ------------------------------------------------------------------ songs
  async importSongs(files) {
    for (const file of files) {
      const li = document.createElement('li');
      li.textContent = `Finding the beat in ${file.name}…`;
      $('my-songs').append(li);
      const song = { id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: file.name.replace(/\.[^.]+$/, ''), blob: file, theme: 'disco', emoji: '🎵' };
      try {
        const info = await this.music.load(song);
        song.bpm = info.bpm;
        song.offset = info.offset;
        await SongStore.add(song);
      } catch (err) {
        console.warn('could not import', err);
        li.textContent = `Could not read ${file.name}`;
      }
    }
    this.userSongs = await SongStore.list();
    this.renderMySongs();
  }

  renderMySongs() {
    const ul = $('my-songs');
    ul.innerHTML = '';
    for (const s of this.userSongs) {
      const li = document.createElement('li');
      li.innerHTML = '<span><b></b><small></small></span>';
      li.querySelector('b').textContent = s.title;
      li.querySelector('small').textContent = s.bpm ? `${Math.round(s.bpm)} BPM` : '';
      const del = document.createElement('button');
      del.className = 'small-btn';
      del.textContent = '🗑';
      del.onclick = async () => {
        await SongStore.remove(s.id);
        this.userSongs = await SongStore.list();
        this.renderMySongs();
      };
      li.append(del);
      ul.append(li);
    }
  }
}

new App();
