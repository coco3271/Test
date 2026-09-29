# Zoomi Moves 🐻💃🧘

A 3D movement game for kids on **iOS, Android and the web**. It has yoga poses, Just Dance-style dancing and Danny Go-style active games. A cartoon buddy shows each move, and the phone's front camera checks how well the child copies it. The camera tracking runs **on the device only**.

Built with **three.js** (toon-shaded 3D world with bloom and shadows), **MediaPipe Pose** (body tracking) and **Capacitor** (native iOS/Android apps).

## Game modes

| Mode | What kids do | How it's scored |
| --- | --- | --- |
| 🧘 **Yoga Adventure** | Story-led flows: *Jungle Friends*, *Sky Island*, *Sleepy Stars* (bedtime). The buddy breathes with you, balance poses wobble, and one-sided poses are done on both sides. | Time spent actually in the pose (camera). |
| 💃 **Dance Party** | Copy the buddy's moves to the beat. Move cards with pictograms show the current and next move, like Just Dance. There's a count-in, combos, and PERFECT / SUPER / GOOD. | The child's pose at every beat "hit", compared with the buddy's. |
| 🏃 **Move & Groove** | *Animal Safari*, *Floor is Lava!*, *Freeze Dance*, *Superhero Training*: frog jumps, elephant stomps, bear crawls, running, and freezing when the music stops. | Movement energy, a jump counter, and stillness for FREEZE. |

Other features: 4 buddies (bear, bunny, cat, panda), stars and a sticker book, a coach voice (native text-to-speech), and synthesized sound effects. There's a grown-ups area behind a parental gate with settings and song import. The game plays in both portrait and landscape, and **works without a camera** in a follow-along mode.

## Music: using Suno songs 🎶

The game comes with built-in procedural music (drums, bass, chords and melody made live with Web Audio), so it works with no audio files at all. To dance to your own **Suno** songs, use either option:

1. **Bundle them in the app:** put the files in `public/music/` and list them in `public/music/songs.json`:
   ```json
   { "songs": [
     { "id": "dino-stomp", "title": "Dino Stomp", "file": "dino-stomp.mp3", "emoji": "🦖" },
     { "id": "rainbow", "title": "Rainbow Wiggle", "file": "rainbow.mp3", "bpm": 120, "offset": 0.12,
       "moves": ["clapBounce", "hipShake", "spin", "jumpingJack"], "theme": "disco" }
   ] }
   ```
   `bpm` and `offset` (seconds to the first beat) are optional; they're **auto-detected**. `moves` optionally chooses the choreography from `src/data/moves.js`. `introSeconds` sets when the dancing starts.
2. **Import them in the app:** go to *⚙️ Grown-ups → Add songs* and pick MP3/M4A/WAV files on the phone. The tempo is detected and the songs are saved on the device (IndexedDB).

Each song gets its own routine: a repeating "chorus" of moves with verses in between, fitted to the song's length and synced to its beat.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (use a phone on the same Wi-Fi for camera testing: needs https or localhost)
npm run build      # production build in dist/
```

`npm run dev/build` first runs `scripts/fetch-vision-assets.mjs`. It copies the MediaPipe WASM runtime and downloads the pose model into `public/mediapipe/` so the apps work offline.

### iOS / Android

```bash
npm run ios        # build + sync + open Xcode      (needs a Mac with Xcode)
npm run android    # build + sync + open Android Studio
```

The native projects in `ios/` and `android/` are already set up with camera permissions (`NSCameraUsageDescription` / `android.permission.CAMERA`). Replace the default icons and splash screens before shipping (for example with `@capacitor/assets`).

Before shipping in the App Store Kids category or Google Play's Designed for Families: the app has no ads, tracking, accounts or network calls at runtime. The settings sit behind a parental gate, and camera frames never leave the device.

## Project layout

```
src/
  engine/   World (renderer, sky, lights, bloom), Stages (meadow / jungle / disco / night + lava),
            Avatar (procedural rigged buddy), pose.js (pose format), choreo.js (beat-synced moves),
            Effects (confetti), Thumbnails (pictogram move cards)
  audio/    AudioEngine, GrooveSynth (built-in music), Music (player + beat clock), bpm.js (tempo detection),
            Sfx, Voice (text-to-speech)
  vision/   PoseTracker (MediaPipe, energy + jump detection), scoring.js (pose comparison)
  modes/    YogaMode, DanceMode, MoveMode (async "scripts" on top of BaseMode)
  data/     poses, moves, routines (levels), buddies
  ui/       Hud
dev/poses.html   pose preview: /dev/poses.html?pose=tree&buddy=cat&theme=night
```

### Adding content

- **A yoga pose:** add it to `src/data/poses.js`. Every field is a joint angle in degrees; the format is documented at the top of `src/engine/pose.js`. Check it at `/dev/poses.html?pose=<id>`.
- **A dance or exercise move:** add keyframes (`[beat, pose]`) to `src/data/moves.js`. Put it in `DANCE_MOVE_IDS` to use it in dances.
- **A level:** copy an entry in `src/data/routines.js`.

### How the camera scoring works

The buddy's pose is turned into 2D limb directions as seen from the front, using an invisible copy of the rig. The child's MediaPipe landmarks are mirrored and turned into the same limb directions. The child's left side is matched to the buddy's right, because the child is mirroring the buddy. The score is based on the angle differences, weighted toward the worst limb, and it doesn't depend on body size or distance from the camera. For limbs pointing at the camera, the direction is unreliable, so they count for less.

### Using a Blender character

The buddy is built from primitives in `src/engine/Avatar.js`, so the whole game can be tuned in code. To use a character modelled in Blender instead, export a GLB and attach its meshes to the joint groups in `Avatar.js` (`hips`, `spine`, `chest`, `head`, `limbs.L/R.shoulder/elbow/wrist/hip/knee/ankle`). The pose, dance, and scoring systems drive those joints and don't need to change.
