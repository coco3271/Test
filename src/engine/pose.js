// A pose is a plain object of joint angles in degrees. Every field is optional:
//
//   body:  { x: tip forward, y: turn (90 = face screen-right), z: roll }, lift: metres off the floor
//   spine: { x: bend forward (+) / back (-), y: twist, z: lean to own left (+) }
//   head:  { x: nod down (+), y: turn to own left (+), z: tilt }
//   armL / armR: { side: raise sideways (0 down, 90 T, 180 up), front: raise forward,
//                  twist, elbow: curl in the frontal plane (+ up/out, - towards body),
//                  elbowFwd: normal elbow bend (forearm comes forward) }
//   legL / legR: { side: raise sideways, front: raise knee forward (- = behind),
//                  twist, knee: bend (shin goes back), kneeFold: shin out (+) / in (-) }
//   face: 'smile' | 'open' | 'sleep'
//
// Left and right use the same numbers; the rig mirrors them. Poses are flattened
// into Float32Arrays so they can be blended quickly every frame.

export const KEYS = [
  'body.x', 'body.y', 'body.z', 'lift',
  'spine.x', 'spine.y', 'spine.z',
  'head.x', 'head.y', 'head.z',
  'armL.side', 'armL.front', 'armL.twist', 'armL.elbow', 'armL.elbowFwd',
  'armR.side', 'armR.front', 'armR.twist', 'armR.elbow', 'armR.elbowFwd',
  'legL.side', 'legL.front', 'legL.twist', 'legL.knee', 'legL.kneeFold',
  'legR.side', 'legR.front', 'legR.twist', 'legR.knee', 'legR.kneeFold',
];

export const IDX = Object.fromEntries(KEYS.map((k, i) => [k, i]));

const DEFAULTS = {
  'armL.side': 10, 'armR.side': 10,
  'armL.elbowFwd': 8, 'armR.elbowFwd': 8,
  'legL.side': 3, 'legR.side': 3,
};

export function poseToArray(pose = {}) {
  const out = new Float32Array(KEYS.length);
  KEYS.forEach((key, i) => {
    const [group, field] = key.split('.');
    const value = field === undefined ? pose[group] : pose[group]?.[field];
    out[i] = value ?? DEFAULTS[key] ?? 0;
  });
  return out;
}

/** Mirror a pose left <-> right (for "now the other side!"). */
export function mirrorPose(pose) {
  const flip = (o) => (o ? { ...o, y: -(o.y ?? 0), z: -(o.z ?? 0) } : o);
  return {
    ...pose,
    body: flip(pose.body),
    spine: flip(pose.spine),
    head: flip(pose.head),
    armL: pose.armR, armR: pose.armL,
    legL: pose.legR, legR: pose.legL,
  };
}

export const ease = {
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  out: (t) => 1 - (1 - t) ** 3,
  snap: (t) => 1 - (1 - Math.min(1, t * 1.6)) ** 3,
};
