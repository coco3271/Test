// Copies MediaPipe's WASM runtime and downloads the pose model into public/
// so the iOS/Android builds work fully offline (no CDN needed at play time).
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'mediapipe');
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const modelPath = join(outDir, 'pose_landmarker_lite.task');

mkdirSync(join(outDir, 'wasm'), { recursive: true });
cpSync(join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm'), join(outDir, 'wasm'), {
  recursive: true,
});

if (!existsSync(modelPath)) {
  try {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mkdirSync(dirname(modelPath), { recursive: true });
    writeFileSync(modelPath, Buffer.from(await res.arrayBuffer()));
    console.log('[vision] downloaded pose model');
  } catch (err) {
    // The game still works without it: it falls back to the CDN at runtime,
    // and plays in "no camera" mode if that fails too.
    console.warn(`[vision] could not download pose model (${err.message}); will use CDN at runtime`);
  }
}
