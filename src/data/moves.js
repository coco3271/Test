// Animated moves for dancing and exercise games. Each move loops every `beats`
// beats; `keys` are [beat, pose] pairs. The buddy blends between keys, and the
// key beats are the moments we check the child's pose ("hits").
//
// `energy: true` moves are scored by how much the child moves (running, jumping)
// rather than by matching an exact shape.

const hip = { side: 38, front: -8, elbow: -105 };
const down = { side: 12 };
const up = { side: 165 };
const bentUp = { side: 90, elbow: 90 };

export const MOVES = {
  // ------------------------------------------------------------- dance
  clapBounce: {
    name: 'Clap Clap!', emoji: '👏', beats: 2,
    keys: [
      [0, { armL: { front: 75, side: -18, elbowFwd: 20 }, armR: { front: 75, side: -18, elbowFwd: 20 }, face: 'open' }],
      [1, { armL: { side: 60, elbow: 30 }, armR: { side: 60, elbow: 30 } }],
    ],
  },
  discoPoint: {
    name: 'Disco Point', emoji: '🕺', beats: 2,
    keys: [
      [0, { armR: { side: 150 }, armL: hip, head: { y: -20, x: -10 }, spine: { z: 8 } }],
      [1, { armR: { side: -25, front: 25 }, armL: hip, head: { y: 15, x: 10 }, spine: { z: -8 } }],
    ],
  },
  discoPointLeft: {
    name: 'Disco Point', emoji: '🕺', beats: 2,
    keys: [
      [0, { armL: { side: 150 }, armR: hip, head: { y: 20, x: -10 }, spine: { z: -8 } }],
      [1, { armL: { side: -25, front: 25 }, armR: hip, head: { y: -15, x: 10 }, spine: { z: 8 } }],
    ],
  },
  waveArms: {
    name: 'Rainbow Arms', emoji: '🌈', beats: 4,
    keys: [
      [0, { armL: { side: 150 }, armR: { side: 170, elbow: -10 }, spine: { z: 18 } }],
      [2, { armL: { side: 170, elbow: -10 }, armR: { side: 150 }, spine: { z: -18 } }],
    ],
  },
  robot: {
    name: 'Robot', emoji: '🤖', beats: 4, snap: true,
    keys: [
      [0, { armL: { side: 70, elbow: 90 }, armR: { side: 70, elbow: -90 }, head: { y: 30 } }],
      [1, { armL: { side: 70, elbow: -90 }, armR: { side: 70, elbow: 90 }, head: { y: -30 } }],
      [2, { armL: { front: 90, elbowFwd: 90 }, armR: { side: 10, elbowFwd: 90 }, head: { y: 0 }, spine: { y: 20 } }],
      [3, { armL: { side: 10, elbowFwd: 90 }, armR: { front: 90, elbowFwd: 90 }, head: { y: 0 }, spine: { y: -20 } }],
    ],
  },
  hipShake: {
    name: 'Wiggle Wiggle', emoji: '🍑', beats: 2,
    keys: [
      [0, { armL: hip, armR: hip, spine: { z: -12 }, body: { z: 8 }, legL: { side: 12 }, legR: { side: 12 }, face: 'open' }],
      [1, { armL: hip, armR: hip, spine: { z: 12 }, body: { z: -8 }, legL: { side: 12 }, legR: { side: 12 } }],
    ],
  },
  jumpingJack: {
    name: 'Star Jumps', emoji: '⭐', beats: 2, energy: true,
    keys: [
      [0, { armL: { side: 150 }, armR: { side: 150 }, legL: { side: 24 }, legR: { side: 24 }, lift: 0.18, face: 'open' }],
      [1, { armL: down, armR: down, legL: { side: 3 }, legR: { side: 3 } }],
    ],
  },
  swim: {
    name: 'Swim!', emoji: '🏊', beats: 4,
    keys: [
      [0, { armL: { front: 170 }, armR: { front: 20, side: 10 }, spine: { x: 15 }, head: { y: 30 } }],
      [1, { armL: { front: 90 }, armR: { front: -30 }, spine: { x: 15 } }],
      [2, { armL: { front: 20, side: 10 }, armR: { front: 170 }, spine: { x: 15 }, head: { y: -30 } }],
      [3, { armL: { front: -30 }, armR: { front: 90 }, spine: { x: 15 } }],
    ],
  },
  raiseRoof: {
    name: 'Raise the Roof', emoji: '🙌', beats: 2,
    keys: [
      [0, { armL: { side: 150, elbow: 70 }, armR: { side: 150, elbow: 70 }, head: { x: -15 }, face: 'open' }],
      [1, { armL: { side: 100, elbow: 100 }, armR: { side: 100, elbow: 100 }, head: { x: 5 }, legL: { front: 10, knee: 25 }, legR: { front: 10, knee: 25 } }],
    ],
  },
  twist: {
    name: 'Twist', emoji: '🌀', beats: 2,
    keys: [
      [0, { spine: { y: 35 }, armL: { side: 50, elbowFwd: 80, front: 20 }, armR: { side: 50, elbowFwd: 80, front: 20 }, legL: { front: 20, knee: 40 }, legR: { front: 20, knee: 40 }, body: { y: -15 } }],
      [1, { spine: { y: -35 }, armL: { side: 50, elbowFwd: 80, front: 20 }, armR: { side: 50, elbowFwd: 80, front: 20 }, legL: { front: 20, knee: 40 }, legR: { front: 20, knee: 40 }, body: { y: 15 } }],
    ],
  },
  airplane: {
    name: 'Airplane Tilt', emoji: '✈️', beats: 4,
    keys: [
      [0, { armL: { side: 90 }, armR: { side: 90 }, spine: { z: 25 }, head: { z: 10 } }],
      [2, { armL: { side: 90 }, armR: { side: 90 }, spine: { z: -25 }, head: { z: -10 } }],
    ],
  },
  march: {
    name: 'March', emoji: '🥁', beats: 2, energy: true,
    keys: [
      [0, { legL: { front: 80, knee: 90 }, armR: { front: 60, elbowFwd: 60 }, armL: { front: -30 } }],
      [1, { legR: { front: 80, knee: 90 }, armL: { front: 60, elbowFwd: 60 }, armR: { front: -30 } }],
    ],
  },
  chicken: {
    name: 'Chicken Dance', emoji: '🐔', beats: 2,
    keys: [
      [0, { armL: { side: 70, elbow: -140 }, armR: { side: 70, elbow: -140 }, legL: { front: 25, knee: 50 }, legR: { front: 25, knee: 50 }, head: { x: 20 }, face: 'open' }],
      [1, { armL: { side: 20, elbow: -140 }, armR: { side: 20, elbow: -140 }, legL: { front: 25, knee: 50 }, legR: { front: 25, knee: 50 }, head: { x: -15 } }],
    ],
  },
  sprinkler: {
    name: 'Sprinkler', emoji: '💦', beats: 4, snap: true,
    keys: [
      [0, { armL: { side: 175, elbow: 110 }, armR: { front: 90, side: 10 }, spine: { y: 30 }, legL: { front: 15, knee: 25 } }],
      [1, { armL: { side: 175, elbow: 110 }, armR: { front: 90, side: 10 }, spine: { y: 10 }, legL: { front: 15, knee: 25 } }],
      [2, { armL: { side: 175, elbow: 110 }, armR: { front: 90, side: 10 }, spine: { y: -10 }, legL: { front: 15, knee: 25 } }],
      [3, { armL: { side: 175, elbow: 110 }, armR: { front: 90, side: 10 }, spine: { y: -30 }, legL: { front: 15, knee: 25 } }],
    ],
  },
  reachStars: {
    name: 'Reach the Stars', emoji: '✨', beats: 2,
    keys: [
      [0, { armL: { side: 175 }, armR: down, spine: { z: -10 }, legR: { front: 10, knee: 30 }, head: { x: -20 } }],
      [1, { armR: { side: 175 }, armL: down, spine: { z: 10 }, legL: { front: 10, knee: 30 }, head: { x: -20 } }],
    ],
  },
  spin: {
    name: 'Spin Around', emoji: '💫', beats: 4,
    keys: [
      [0, { armL: up, armR: up, body: { y: 0 } }],
      [1, { armL: { side: 120 }, armR: { side: 120 }, body: { y: 90 } }],
      [2, { armL: up, armR: up, body: { y: 180 } }],
      [3, { armL: { side: 120 }, armR: { side: 120 }, body: { y: 270 } }],
      [3.99, { armL: up, armR: up, body: { y: 359 } }],
    ],
  },
  kick: {
    name: 'Karate Kick', emoji: '🥋', beats: 2, energy: true,
    keys: [
      [0, { legL: { front: 70 }, armL: { side: 60, elbow: 80 }, armR: { front: 80, elbowFwd: 20 }, face: 'open' }],
      [1, { legR: { front: 70 }, armR: { side: 60, elbow: 80 }, armL: { front: 80, elbowFwd: 20 } }],
    ],
  },
  muscles: {
    name: 'Strong Muscles', emoji: '💪', beats: 2,
    keys: [
      [0, { armL: bentUp, armR: bentUp, legL: { side: 15, front: 20, knee: 30 }, legR: { side: 15, front: 20, knee: 30 }, face: 'open' }],
      [1, { armL: { side: 90, elbow: 60 }, armR: { side: 90, elbow: 60 }, legL: { side: 15 }, legR: { side: 15 } }],
    ],
  },

  hello: {
    name: 'Hello!', emoji: '👋', beats: 2,
    keys: [
      [0, { armR: { side: 150, elbow: 35 }, armL: { side: 12 }, head: { z: -6 }, face: 'open' }],
      [1, { armR: { side: 150, elbow: -25 }, armL: { side: 12 }, head: { z: 6 } }],
    ],
  },
  idle: {
    name: 'Chill', emoji: '🙂', beats: 4,
    keys: [
      [0, { armL: { side: 14 }, armR: { side: 14 }, spine: { z: 3 }, head: { z: 4 } }],
      [2, { armL: { side: 10 }, armR: { side: 10 }, spine: { z: -3 }, head: { z: -4 } }],
    ],
  },
  celebrate: {
    name: 'Yay!', emoji: '🎉', beats: 2,
    keys: [
      [0, { armL: { side: 160, elbow: 20 }, armR: { side: 160, elbow: 20 }, lift: 0.3, face: 'open' }],
      [1, { armL: { side: 120, elbow: 60 }, armR: { side: 120, elbow: 60 }, legL: { front: 20, knee: 40 }, legR: { front: 20, knee: 40 }, face: 'open' }],
    ],
  },

  // ------------------------------------------------------------- exercise
  runInPlace: {
    name: 'Run in Place', emoji: '🏃', beats: 1, energy: true,
    keys: [
      [0, { legL: { front: 60, knee: 100 }, armL: { front: -40, elbowFwd: 90 }, armR: { front: 50, elbowFwd: 90 }, spine: { x: 8 }, lift: 0.05, face: 'open' }],
      [0.5, { legR: { front: 60, knee: 100 }, armR: { front: -40, elbowFwd: 90 }, armL: { front: 50, elbowFwd: 90 }, spine: { x: 8 }, lift: 0.05 }],
    ],
  },
  frogJump: {
    name: 'Frog Jumps', emoji: '🐸', beats: 4, energy: true,
    keys: [
      [0, { spine: { x: 35 }, armL: { front: 45 }, armR: { front: 45 }, legL: { front: 100, side: 45, knee: 125 }, legR: { front: 100, side: 45, knee: 125 } }],
      [1.5, { spine: { x: 35 }, armL: { front: 45 }, armR: { front: 45 }, legL: { front: 100, side: 45, knee: 125 }, legR: { front: 100, side: 45, knee: 125 } }],
      [2.2, { armL: { side: 160 }, armR: { side: 160 }, legL: { side: 15, knee: 20 }, legR: { side: 15, knee: 20 }, lift: 0.55, face: 'open' }],
      [3, { armL: { side: 120 }, armR: { side: 120 }, legL: { front: 40, side: 20, knee: 60 }, legR: { front: 40, side: 20, knee: 60 }, lift: 0.05 }],
    ],
  },
  kangaroo: {
    name: 'Kangaroo Hops', emoji: '🦘', beats: 2, energy: true,
    keys: [
      [0, { armL: { front: 60, elbowFwd: 100 }, armR: { front: 60, elbowFwd: 100 }, legL: { front: 30, knee: 50 }, legR: { front: 30, knee: 50 } }],
      [1, { armL: { front: 60, elbowFwd: 100 }, armR: { front: 60, elbowFwd: 100 }, legL: { front: 10, knee: 30 }, legR: { front: 10, knee: 30 }, lift: 0.4, face: 'open' }],
    ],
  },
  elephantStomp: {
    name: 'Elephant Stomp', emoji: '🐘', beats: 4, energy: true,
    keys: [
      [0, { armL: { front: 70, side: -15 }, armR: { front: 70, side: -15 }, spine: { x: 25 }, legL: { front: 70, knee: 70 }, head: { x: 10 } }],
      [1, { armL: { front: 50, side: -15 }, armR: { front: 50, side: -15 }, spine: { x: 30 }, legL: { side: 10 } }],
      [2, { armL: { front: 70, side: -15 }, armR: { front: 70, side: -15 }, spine: { x: 25 }, legR: { front: 70, knee: 70 }, head: { x: 10 } }],
      [3, { armL: { front: 50, side: -15 }, armR: { front: 50, side: -15 }, spine: { x: 30 }, legR: { side: 10 } }],
    ],
  },
  superPunch: {
    name: 'Super Punches', emoji: '👊', beats: 1, energy: true, snap: true,
    keys: [
      [0, { armL: { front: 90 }, armR: { side: 20, elbowFwd: 120 }, spine: { y: -20 }, legL: { side: 20 }, legR: { side: 20, front: 15, knee: 30 }, face: 'open' }],
      [0.5, { armR: { front: 90 }, armL: { side: 20, elbowFwd: 120 }, spine: { y: 20 }, legL: { side: 20, front: 15, knee: 30 }, legR: { side: 20 } }],
    ],
  },
  superJump: {
    name: 'Super Jump', emoji: '🚀', beats: 2, energy: true,
    keys: [
      [0, { spine: { x: 25 }, armL: { front: -40 }, armR: { front: -40 }, legL: { front: 70, knee: 90 }, legR: { front: 70, knee: 90 } }],
      [1, { armL: { side: 175, elbow: 20 }, armR: { side: 175, elbow: 20 }, lift: 0.6, face: 'open' }],
    ],
  },
  squat: {
    name: 'Squats', emoji: '🏋️', beats: 4, energy: true,
    keys: [
      [0, { armL: down, armR: down }],
      [2, { armL: { front: 90 }, armR: { front: 90 }, spine: { x: 20 }, legL: { front: 80, side: 12, knee: 95 }, legR: { front: 80, side: 12, knee: 95 } }],
    ],
  },
  bearWalk: {
    name: 'Bear Crawl', emoji: '🐻', beats: 2, energy: true,
    keys: [
      [0, { body: { x: 90, y: 90 }, head: { x: -30 }, armL: { front: 60 }, armR: { front: 100 }, legL: { front: 110, knee: 30 }, legR: { front: 70, knee: 20 } }],
      [1, { body: { x: 90, y: 90 }, head: { x: -30 }, armL: { front: 100 }, armR: { front: 60 }, legL: { front: 70, knee: 20 }, legR: { front: 110, knee: 30 } }],
    ],
  },
  wiggleShake: {
    name: 'Shake It Out', emoji: '🫨', beats: 1, energy: true,
    keys: [
      [0, { armL: { side: 60, elbow: 20 }, armR: { side: 30, elbow: -20 }, spine: { z: 10 }, head: { z: 10 }, face: 'open' }],
      [0.5, { armL: { side: 30, elbow: -20 }, armR: { side: 60, elbow: 20 }, spine: { z: -10 }, head: { z: -10 } }],
    ],
  },
};

/** Different silly freeze poses so FREEZE! is a surprise every time. */
export const FREEZE_POSES = [
  { armL: { side: 140, elbow: 40 }, armR: { side: 30, front: 40 }, legL: { front: 50, knee: 70 }, spine: { z: 10 }, head: { z: 15 }, face: 'open' },
  { armL: { side: 170 }, armR: { side: 170 }, legR: { front: 5, knee: 100 }, face: 'open' },
  { armL: { front: 90 }, armR: { front: 90 }, spine: { x: 20 }, legL: { front: 70, knee: 90 }, legR: { front: 70, knee: 90 }, face: 'open' },
  { armL: { side: 90, elbow: 90 }, armR: { side: 90, elbow: 90 }, legL: { side: 25 }, legR: { side: 25 }, face: 'open' },
  { armL: { side: 10 }, armR: { side: 175 }, spine: { z: 25 }, legR: { side: 40 }, face: 'open' },
];

export const DANCE_MOVE_IDS = [
  'clapBounce', 'discoPoint', 'discoPointLeft', 'waveArms', 'robot', 'hipShake', 'jumpingJack', 'swim',
  'raiseRoof', 'twist', 'airplane', 'chicken', 'sprinkler', 'reachStars', 'spin', 'kick', 'muscles', 'march',
];
