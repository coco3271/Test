import { IDX, poseToArray, ease } from './pose.js';

const YAW = IDX['body.y'];

/** Pre-bake a move's key poses into arrays. */
export function compileMove(move) {
  if (move._compiled) return move._compiled;
  const keys = move.keys.map(([t, pose]) => ({ t, arr: poseToArray(pose), face: pose.face ?? 'smile', pose }));
  move._compiled = { move, beats: move.beats, keys, hits: keys.filter((k) => !(k.t % 1) || move.snap).map((k) => k.t) };
  return move._compiled;
}

/** Pose of a move at `beat` (beats since the move started). Writes into `out`, returns the face. */
export function sampleMove(compiled, beat, out) {
  const { keys, beats, move } = compiled;
  if (keys.length === 1) {
    out.set(keys[0].arr);
    return keys[0].face;
  }
  const b = ((beat % beats) + beats) % beats;
  let i = keys.length - 1;
  for (let k = 0; k < keys.length; k++) if (keys[k].t <= b) i = k;
  const a = keys[i];
  const next = keys[(i + 1) % keys.length];
  const tEnd = i + 1 < keys.length ? next.t : beats + keys[0].t;
  const span = tEnd - a.t || 1;
  const raw = Math.min(1, Math.max(0, (b - a.t) / span));
  const t = move.snap ? ease.snap(raw) : ease.inOut(raw);
  for (let n = 0; n < out.length; n++) {
    let from = a.arr[n], to = next.arr[n];
    if (n === YAW) {
      while (to - from > 180) to -= 360;
      while (from - to > 180) to += 360;
    }
    out[n] = from + (to - from) * t;
  }
  return raw < 0.5 ? a.face : next.face;
}

/** Bouncy knees on every beat, layered on top of dance moves. */
export function grooveAdditive(beat, amount, out) {
  out.fill(0);
  const down = (1 + Math.cos(beat * Math.PI * 2)) / 2; // 1 on the beat
  const k = amount * down;
  out[IDX['legL.front']] = 10 * k;
  out[IDX['legR.front']] = 10 * k;
  out[IDX['legL.knee']] = 20 * k;
  out[IDX['legR.knee']] = 20 * k;
  out[IDX['spine.x']] = 4 * k;
  out[IDX['head.x']] = 6 * k;
  out[IDX['head.z']] = Math.sin(beat * Math.PI) * 5 * amount;
  return out;
}
