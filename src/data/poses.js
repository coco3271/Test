// Static poses used by yoga and "hold it!" moments. See src/engine/pose.js for the
// meaning of every field. `profile` poses turn the buddy sideways so kids can see the shape.

const handsOnHips = { side: 38, front: -8, elbow: -105 };
const armsUpTogether = { side: 158, elbow: 58 };

export const POSES = {
  mountain: {
    name: 'Mountain', emoji: '⛰️',
    pose: { armL: { side: 14 }, armR: { side: 14 } },
  },
  tree: {
    name: 'Tree', emoji: '🌳', balance: true,
    pose: {
      armL: armsUpTogether, armR: armsUpTogether,
      legL: { side: 62, front: 18, kneeFold: -145, twist: 20 },
    },
  },
  star: {
    name: 'Star', emoji: '⭐',
    pose: { armL: { side: 130 }, armR: { side: 130 }, legL: { side: 24 }, legR: { side: 24 }, face: 'open' },
  },
  warrior: {
    name: 'Warrior', emoji: '🛡️',
    pose: {
      head: { y: 70 },
      armL: { side: 90 }, armR: { side: 90 },
      legL: { side: 62, kneeFold: -62 }, legR: { side: 32 },
    },
  },
  chair: {
    name: 'Chair', emoji: '🪑',
    pose: {
      body: { y: 35 }, spine: { x: 20 },
      armL: { front: 110, side: 5 }, armR: { front: 110, side: 5 },
      legL: { front: 75, knee: 85 }, legR: { front: 75, knee: 85 },
    },
  },
  flamingo: {
    name: 'Flamingo', emoji: '🦩', balance: true,
    pose: {
      armL: { side: 100, elbow: -20 }, armR: { side: 100, elbow: -20 },
      legL: { front: 5, knee: 100 },
    },
  },
  rainbow: {
    name: 'Rainbow', emoji: '🌈', sides: true,
    pose: {
      spine: { z: 28 },
      armR: { side: 170, elbow: -15 }, armL: { side: 22, elbow: -30 },
    },
  },
  airplane: {
    name: 'Airplane', emoji: '✈️', balance: true, profile: true,
    pose: {
      body: { x: 80, y: 90 }, head: { x: -45 },
      armL: { side: 90 }, armR: { side: 90 },
      legR: { front: 80 }, legL: { front: 0 },
    },
  },
  dog: {
    name: 'Down Dog', emoji: '🐶', profile: true,
    pose: {
      body: { x: 135, y: 90 }, head: { x: -10 },
      armL: { front: 175 }, armR: { front: 175 },
      legL: { front: 92 }, legR: { front: 92 },
    },
  },
  cobra: {
    name: 'Cobra', emoji: '🐍', profile: true,
    pose: {
      body: { x: 90, y: 90 }, spine: { x: -55 }, head: { x: -25 },
      armL: { front: 40, elbowFwd: 10 }, armR: { front: 40, elbowFwd: 10 },
      legL: { front: -4 }, legR: { front: -4 },
    },
  },
  cat: {
    name: 'Cat', emoji: '🐱', profile: true,
    pose: {
      body: { x: 90, y: 90 }, spine: { x: 22 }, head: { x: 12 },
      armL: { front: 76 }, armR: { front: 76 },
      legL: { front: 90, knee: 90 }, legR: { front: 90, knee: 90 },
    },
  },
  cow: {
    name: 'Cow', emoji: '🐮', profile: true,
    pose: {
      body: { x: 90, y: 90 }, spine: { x: -20 }, head: { x: -35 },
      armL: { front: 108 }, armR: { front: 108 },
      legL: { front: 90, knee: 90 }, legR: { front: 90, knee: 90 }, face: 'open',
    },
  },
  child: {
    name: 'Sleepy Child', emoji: '😴', profile: true,
    pose: {
      body: { x: 100, y: 90 }, head: { x: 10 },
      armL: { front: 175 }, armR: { front: 175 },
      legL: { front: 165, knee: 165 }, legR: { front: 165, knee: 165 }, face: 'sleep',
    },
  },
  butterfly: {
    name: 'Butterfly', emoji: '🦋',
    pose: {
      armL: { front: 40, side: -10, elbowFwd: 30 }, armR: { front: 40, side: -10, elbowFwd: 30 },
      legL: { front: 90, side: 55, kneeFold: -140 }, legR: { front: 90, side: 55, kneeFold: -140 },
    },
  },
  starfish: {
    name: 'Starfish Rest', emoji: '🌟',
    pose: {
      body: { x: -90 },
      armL: { side: 50 }, armR: { side: 50 }, legL: { side: 18 }, legR: { side: 18 }, face: 'sleep',
    },
  },
  superhero: {
    name: 'Superhero', emoji: '🦸',
    pose: {
      spine: { x: -5 }, head: { x: -8 },
      armL: handsOnHips, armR: handsOnHips, legL: { side: 13 }, legR: { side: 13 },
    },
  },
  frog: {
    name: 'Frog', emoji: '🐸',
    pose: {
      spine: { x: 35 }, head: { x: -30 },
      armL: { front: 45, side: 5 }, armR: { front: 45, side: 5 },
      legL: { front: 100, side: 45, knee: 125 }, legR: { front: 100, side: 45, knee: 125 }, face: 'open',
    },
  },
  volcano: {
    name: 'Volcano', emoji: '🌋',
    pose: { armL: { side: 160 }, armR: { side: 160 }, legL: { side: 10 }, legR: { side: 10 }, face: 'open' },
  },
};
