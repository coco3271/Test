// All the levels. Add your own by copying an entry!

export const YOGA = [
  {
    id: 'jungle-yoga', title: 'Jungle Friends', emoji: '🌴', theme: 'jungle', music: 'calm',
    intro: "Let's go on a jungle yoga adventure! Copy me!",
    steps: [
      { pose: 'mountain', hold: 8, say: 'Stand tall like a big mountain. Breathe in... and breathe out.' },
      { pose: 'tree', hold: 10, sides: true, say: 'Grow into a tall jungle tree! Stand on one foot and reach your branches up high.' },
      { pose: 'flamingo', hold: 8, sides: true, say: 'A pink flamingo! Balance on one leg and open your wings.' },
      { pose: 'frog', hold: 8, say: 'Squat down low like a frog. Ribbit, ribbit!' },
      { pose: 'cobra', hold: 8, say: 'Lie on your tummy and lift your chest like a snake. Hisssss!' },
      { pose: 'dog', hold: 8, say: 'Push your bottom up high like a puppy stretching. Woof woof!' },
      { pose: 'cat', hold: 6, say: 'On your hands and knees, round your back like a cat. Meow!' },
      { pose: 'cow', hold: 6, say: 'Now drop your tummy and look up like a cow. Moooo!' },
      { pose: 'butterfly', hold: 10, say: 'Sit down, feet together, and flap your butterfly wings.' },
      { pose: 'child', hold: 10, say: 'Curl up small like a sleepy baby animal. Great job, jungle explorer!' },
    ],
  },
  {
    id: 'sky-yoga', title: 'Sky Island', emoji: '☁️', theme: 'meadow', music: 'calm',
    intro: 'Welcome to Sky Island! Let\'s stretch up to the clouds!',
    steps: [
      { pose: 'mountain', hold: 6, say: 'Stand tall and strong like a mountain in the clouds.' },
      { pose: 'volcano', hold: 6, say: 'Reach your arms up high... you are a volcano! Whoosh!' },
      { pose: 'star', hold: 8, say: 'Jump your feet apart and shine like a star!' },
      { pose: 'warrior', hold: 8, sides: true, say: 'Bend your knee and stretch your arms. You are a brave warrior!' },
      { pose: 'rainbow', hold: 6, sides: true, say: 'Reach over to the side and make a big rainbow.' },
      { pose: 'airplane', hold: 6, sides: true, say: 'Arms out wide, lean forward and fly like an airplane! Zoom!' },
      { pose: 'chair', hold: 8, say: 'Sit back on a magic invisible chair. Keep going!' },
      { pose: 'starfish', hold: 10, say: 'Lie down and float like a starfish. You did amazing!' },
    ],
  },
  {
    id: 'bedtime-yoga', title: 'Sleepy Stars', emoji: '🌙', theme: 'night', music: 'sleepy',
    intro: "It's almost bedtime. Let's do some calm, sleepy yoga.",
    steps: [
      { pose: 'mountain', hold: 8, say: 'Stand still and take a big, slow breath in... and let it out.' },
      { pose: 'rainbow', hold: 8, sides: true, say: 'Slowly reach over and make a sleepy rainbow.' },
      { pose: 'butterfly', hold: 10, say: 'Sit down and gently flap your butterfly wings.' },
      { pose: 'cat', hold: 6, say: 'Round your back like a stretchy cat.' },
      { pose: 'cow', hold: 6, say: 'And drop your tummy like a calm cow.' },
      { pose: 'child', hold: 12, say: 'Curl up small. Listen to your breath.' },
      { pose: 'starfish', hold: 14, say: 'Lie on your back like a starfish and look at the stars. Good night!' },
    ],
  },
];

export const GAMES = [
  {
    id: 'safari', title: 'Animal Safari', emoji: '🦁', theme: 'jungle', music: 'adventure',
    intro: "Welcome to Animal Safari! Let's move like the animals!",
    steps: [
      { type: 'move', move: 'frogJump', beats: 16, goal: 'jumps', target: 4, say: 'Jump like a frog! Ribbit! Ribbit!' },
      { type: 'move', move: 'elephantStomp', beats: 16, say: 'Stomp like a big elephant! Stomp! Stomp!' },
      { type: 'hold', pose: 'flamingo', seconds: 6, say: 'Stand on one leg like a flamingo!' },
      { type: 'move', move: 'kangaroo', beats: 16, goal: 'jumps', target: 6, say: 'Hop hop hop like a kangaroo!' },
      { type: 'move', move: 'runInPlace', beats: 16, say: 'Run super fast like a cheetah!' },
      { type: 'move', move: 'bearWalk', beats: 16, say: 'Get down and crawl like a bear! Grrr!' },
      { type: 'freeze', rounds: 2 },
    ],
  },
  {
    id: 'lava', title: 'Floor is Lava!', emoji: '🌋', theme: 'jungle', music: 'bouncy',
    intro: "Uh oh... sometimes the floor turns into LAVA! When it does, jump, jump, jump!",
    steps: [
      { type: 'move', move: 'march', beats: 16, say: "Let's march around the island!" },
      { type: 'lava', beats: 12 },
      { type: 'move', move: 'runInPlace', beats: 12, say: 'Phew! Now run, run, run!' },
      { type: 'lava', beats: 12 },
      { type: 'move', move: 'kick', beats: 16, say: 'Karate kicks! Hi-yah!' },
      { type: 'lava', beats: 16 },
      { type: 'move', move: 'wiggleShake', beats: 8, say: 'Shake it all out!' },
    ],
  },
  {
    id: 'freeze', title: 'Freeze Dance', emoji: '🧊', theme: 'disco', music: 'funky',
    intro: 'Dance, dance, dance! But when the music stops... FREEZE like a statue!',
    steps: [{ type: 'freeze', rounds: 6 }],
  },
  {
    id: 'hero', title: 'Superhero Training', emoji: '🦸', theme: 'meadow', music: 'adventure',
    intro: 'Superhero training starts now! Are you ready?',
    steps: [
      { type: 'hold', pose: 'superhero', seconds: 5, say: 'Stand like a superhero! Hands on hips, chest up high!' },
      { type: 'move', move: 'superPunch', beats: 16, say: 'Super punches! Pow! Pow! Pow!' },
      { type: 'move', move: 'superJump', beats: 16, goal: 'jumps', target: 5, say: 'Super jumps! Crouch down and blast off!' },
      { type: 'move', move: 'squat', beats: 16, say: 'Power squats! Down... and up!' },
      { type: 'move', move: 'runInPlace', beats: 16, say: 'Super speed! Run as fast as you can!' },
      { type: 'hold', pose: 'airplane', seconds: 6, say: 'Now fly like a superhero!' },
      { type: 'move', move: 'muscles', beats: 8, say: 'Show me your super muscles!' },
    ],
  },
];

/** Built-in dance songs (made by the synth). Suno songs are added from public/music/songs.json or the in-app importer. */
export const BUILTIN_SONGS = [
  { id: 'synth-pop', title: 'Sunny Pop', style: 'pop', emoji: '☀️', theme: 'disco' },
  { id: 'synth-bouncy', title: 'Bouncy Castle', style: 'bouncy', emoji: '🏰', theme: 'disco' },
  { id: 'synth-funky', title: 'Funky Monkey', style: 'funky', emoji: '🐒', theme: 'jungle' },
  { id: 'synth-adventure', title: 'Jungle Run', style: 'adventure', emoji: '🌴', theme: 'meadow' },
];

export const STICKERS = ['🦄', '🐙', '🦖', '🚀', '🌈', '🍦', '🦋', '🐳', '🍩', '🎈', '🦊', '🐼', '🌟', '🍉', '🐝', '🦜', '🎸', '🏆', '🐬', '🌻', '🍭', '🐢', '🪐', '👑'];
