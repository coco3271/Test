import { LM } from './PoseTracker.js';

// Compares the child's body (from the camera) with the buddy's pose.
// Both are reduced to 2D limb directions as seen from the front, so body size
// and distance to the camera don't matter. The child mirrors the buddy, so the
// buddy's right arm is compared with the child's left arm.

const SEGMENTS = [
  // [avatar side, from, to, camera from, camera to, weight]
  ['R', 'shoulder', 'elbow', LM.lShoulder, LM.lElbow, 1.2],
  ['R', 'elbow', 'wrist', LM.lElbow, LM.lWrist, 1],
  ['L', 'shoulder', 'elbow', LM.rShoulder, LM.rElbow, 1.2],
  ['L', 'elbow', 'wrist', LM.rElbow, LM.rWrist, 1],
  ['R', 'hip', 'knee', LM.lHip, LM.lKnee, 1],
  ['R', 'knee', 'ankle', LM.lKnee, LM.lAnkle, 0.8],
  ['L', 'hip', 'knee', LM.rHip, LM.rKnee, 1],
  ['L', 'knee', 'ankle', LM.rKnee, LM.rAnkle, 0.8],
];

const DEG = 180 / Math.PI;

function angleBetween(ax, ay, bx, by) {
  const d = Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  return Math.abs(d * DEG);
}

/** Pre-computes the buddy's 2D limb directions for a pose (from Avatar.measure). */
export function targetFromJoints(joints) {
  const segs = SEGMENTS.map(([side, from, to]) => {
    const a = joints[side][from], b = joints[side][to];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len3 = a.distanceTo(b);
    const len2 = Math.hypot(dx, dy);
    // A limb pointing at the camera looks tiny and its direction is unreliable.
    return { dx, dy, reliability: len3 ? Math.min(1, len2 / len3 / 0.5) : 0 };
  });
  const mid = (s, k) => joints.L[k].clone().add(joints.R[k]).multiplyScalar(0.5);
  const torso = mid(0, 'shoulder').sub(mid(0, 'hip'));
  return { segs, torso: { dx: torso.x, dy: torso.y } };
}

/** 0..1 similarity, or null when the child can't be seen well enough. */
export function scorePose(target, landmarks, aspect) {
  if (!landmarks) return null;
  const vis = (i) => (landmarks[i].visibility ?? 1) > 0.45;
  // Mirror x and flip y so both are "x right, y up" as seen on screen.
  const V = (i, j) => [-(landmarks[j].x - landmarks[i].x) * aspect, -(landmarks[j].y - landmarks[i].y)];
  let total = 0, weight = 0, worst = 1;
  SEGMENTS.forEach(([, , , ci, cj, w], n) => {
    const t = target.segs[n];
    if (!vis(ci) || !vis(cj) || t.reliability < 0.2) return;
    const [ux, uy] = V(ci, cj);
    const d = angleBetween(t.dx, t.dy, ux, uy);
    const s = d <= 18 ? 1 : d >= 65 ? 0 : 1 - (d - 18) / 47;
    total += s * w * t.reliability;
    weight += w * t.reliability;
    if (t.reliability > 0.5) worst = Math.min(worst, s);
  });
  // Torso lean (important for side bends and lying poses).
  if ([11, 12, 23, 24].every(vis)) {
    const ux = -((landmarks[11].x + landmarks[12].x - landmarks[23].x - landmarks[24].x) / 2) * aspect;
    const uy = -((landmarks[11].y + landmarks[12].y - landmarks[23].y - landmarks[24].y) / 2);
    const d = angleBetween(target.torso.dx, target.torso.dy, ux, uy);
    const s = d <= 15 ? 1 : d >= 70 ? 0 : 1 - (d - 15) / 55;
    total += s * 1.5;
    weight += 1.5;
  }
  if (weight < 3) return null;
  // One limb completely wrong (e.g. arms down instead of on hips) should
  // clearly lower the score, not just average away.
  return (total / weight) * (0.5 + 0.5 * worst);
}

export function judge(score) {
  if (score === null || score === undefined) return null;
  if (score >= 0.75) return { label: 'PERFECT!', key: 'perfect', points: 100 };
  if (score >= 0.55) return { label: 'SUPER!', key: 'great', points: 75 };
  if (score >= 0.35) return { label: 'GOOD!', key: 'good', points: 50 };
  return { label: 'KEEP GOING!', key: 'ok', points: 15 };
}
