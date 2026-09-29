import * as THREE from 'three';
import { toon, mesh } from './materials.js';
import { IDX, KEYS, poseToArray } from './pose.js';

const DEG = Math.PI / 180;
const HIP_Y = 0.68;
const OUT = 0.012;

const sphere = (r, seg = 24) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 16);

function starShape(outer = 0.06, inner = 0.026) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    shape[fn](Math.cos(a) * r, Math.sin(a) * r);
  }
  return new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 });
}

/**
 * A chunky cartoon buddy built from primitives on a simple joint hierarchy.
 * `visual: false` builds only the joints — used to measure where a pose puts
 * the hands and feet so we can compare it with the child's camera pose.
 */
export class Avatar {
  constructor(buddy, { visual = true } = {}) {
    this.buddy = buddy;
    this.visual = visual;
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.body.rotation.order = 'YXZ';
    this.body.position.y = HIP_Y;
    this.root.add(this.body);
    this.contacts = [];

    const j = (parent, x, y, z = 0, order = 'XZY') => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.order = order;
      parent.add(g);
      return g;
    };

    this.hips = j(this.body, 0, 0);
    this.spine = j(this.hips, 0, 0.06, 0, 'YXZ');
    this.chest = j(this.spine, 0, 0.2, 0, 'YXZ');
    this.neck = j(this.chest, 0, 0.2, 0, 'YXZ');
    this.head = j(this.neck, 0, 0.04, 0, 'YXZ');
    this.limbs = {};
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const shoulder = j(this.chest, 0.2 * s, 0.13);
      const elbow = j(shoulder, 0, -0.23);
      const wrist = j(elbow, 0, -0.21);
      const hip = j(this.hips, 0.1 * s, -0.05);
      const knee = j(hip, 0, -0.29);
      const ankle = j(knee, 0, -0.28);
      this.limbs[side] = { shoulder, elbow, wrist, hip, knee, ankle };
    }

    this.pose = poseToArray({});
    this.tween = null;
    this.additive = null;
    this.lift = 0;
    this.blinkTimer = 2;
    this.face = 'smile';

    if (visual) this.buildMeshes();
    this.addContacts();
    this.apply();
  }

  // ---------------------------------------------------------------- building
  buildMeshes() {
    const b = this.buddy;
    const fur = toon(b.fur), light = toon(b.light), limbs = toon(b.limbs);
    const shirt = toon(b.shirt), shorts = toon(b.shorts), shoes = toon(b.shoes), sole = toon(b.sole);
    const dark = toon(b.dark ?? 0x2b2233);
    const add = (parent, geo, mat, pos, scale, outline = OUT) => {
      const m = mesh(geo, mat, { outline });
      m.position.set(...pos);
      if (scale) m.scale.set(...scale);
      parent.add(m);
      return m;
    };

    // torso
    add(this.hips, sphere(0.19), shorts, [0, 0, 0], [1.08, 0.8, 0.9]);
    add(this.spine, sphere(0.2), shirt, [0, 0.1, 0], [1, 1, 0.88]);
    add(this.chest, sphere(0.21), shirt, [0, 0.07, 0], [1.02, 0.92, 0.86]);
    const emblem = add(this.chest, starShape(), toon(b.emblem, { emissive: b.emblem, emissiveIntensity: 0.25 }), [0, 0.07, 0.172], null, 0);
    emblem.rotation.x = -0.12;
    add(this.neck, capsule(0.07, 0.04), fur, [0, 0.02, 0]);

    // head
    const H = this.head;
    const headMesh = add(H, sphere(0.28, 32), fur, [0, 0.27, 0], [1.05, 0.95, 0.97], 0.014);
    this.headMesh = headMesh;
    const face = new THREE.Group();
    face.position.set(0, 0.27, 0);
    H.add(face);
    if (b.patches) {
      for (const s of [-1, 1]) add(face, sphere(0.075), dark, [0.105 * s, 0.005, 0.235], [1, 1.2, 0.5], 0).rotation.z = 0.5 * s;
    }
    add(face, sphere(0.11), light, [0, -0.075, 0.215], [1.15, 0.78, 0.7], 0.008);
    add(face, sphere(0.032), dark, [0, -0.04, 0.29], [1.35, 0.9, 0.8], 0);
    this.eyes = [];
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1b1325, roughness: 0.15, metalness: 0.1 });
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const s of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(0.1 * s, 0.02, 0.252);
      face.add(eye);
      const ball = new THREE.Mesh(sphere(0.048), eyeMat);
      ball.scale.set(0.9, 1.2, 0.55);
      eye.add(ball);
      const glint = new THREE.Mesh(sphere(0.016, 10), white);
      glint.position.set(0.016, 0.022, 0.024);
      eye.add(glint);
      this.eyes.push(eye);
    }
    add(face, sphere(0.045), toon(0xff8fab), [-0.17, -0.06, 0.2], [1.2, 0.8, 0.4], 0);
    add(face, sphere(0.045), toon(0xff8fab), [0.17, -0.06, 0.2], [1.2, 0.8, 0.4], 0);
    const smile = add(face, new THREE.TorusGeometry(0.035, 0.009, 6, 16, Math.PI), dark, [0, -0.095, 0.29], null, 0);
    smile.rotation.z = Math.PI;
    const open = add(face, sphere(0.034), toon(0xc2334f), [0, -0.11, 0.282], [1, 1.15, 0.5], 0);
    const sleepEyes = new THREE.Group();
    for (const s of [-1, 1]) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14, Math.PI), dark);
      arc.position.set(0.1 * s, 0.01, 0.262);
      arc.rotation.z = Math.PI;
      sleepEyes.add(arc);
    }
    face.add(sleepEyes);
    this.faceParts = { smile, open, sleepEyes };

    // ears
    for (const s of [-1, 1]) {
      if (b.ears === 'round') {
        const ear = add(H, sphere(0.09), b.patches ? dark : fur, [0.2 * s, 0.49, -0.02], [1, 1, 0.6]);
        if (!b.patches) add(ear, sphere(0.05), light, [0, -0.005, 0.05], [1, 1, 0.5], 0);
      } else if (b.ears === 'long') {
        const ear = add(H, capsule(0.055, 0.26), fur, [0.09 * s, 0.68, -0.03], [1, 1, 0.6]);
        ear.rotation.z = -0.18 * s;
        add(ear, capsule(0.03, 0.2), light, [0, 0, 0.03], [1, 1, 0.4], 0);
      } else {
        const ear = add(H, new THREE.ConeGeometry(0.1, 0.18, 4), fur, [0.16 * s, 0.53, 0], [1, 1, 0.55]);
        ear.rotation.z = -0.4 * s;
        add(ear, new THREE.ConeGeometry(0.05, 0.1, 4), light, [0, -0.02, 0.035], [1, 1, 0.4], 0);
      }
    }

    // tail
    if (b.tail === 'long') {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.05, -0.15),
        new THREE.Vector3(0.05, 0.1, -0.3), new THREE.Vector3(0.02, 0.28, -0.32),
      ]);
      add(this.hips, new THREE.TubeGeometry(curve, 20, 0.035, 8), fur, [0, 0, -0.12]);
    } else {
      add(this.hips, sphere(b.id === 'bunny' ? 0.08 : 0.06), b.id === 'panda' ? dark : light, [0, 0.02, -0.18]);
    }

    // limbs
    for (const side of ['L', 'R']) {
      const L = this.limbs[side];
      add(L.shoulder, sphere(0.085), shirt, [0, -0.02, 0]);
      add(L.shoulder, capsule(0.066, 0.15), limbs, [0, -0.12, 0]);
      add(L.elbow, capsule(0.062, 0.14), limbs, [0, -0.1, 0]);
      add(L.wrist, sphere(0.07), b.patches ? dark : light, [0, -0.045, 0], [1, 1.05, 0.9]);
      add(L.hip, capsule(0.09, 0.14), shorts, [0, -0.1, 0]);
      add(L.knee, capsule(0.075, 0.16), limbs, [0, -0.13, 0]);
      add(L.ankle, sphere(0.085), shoes, [0, -0.035, 0.035], [1, 0.72, 1.45]);
      add(L.ankle, sphere(0.085), sole, [0, -0.06, 0.035], [1.02, 0.25, 1.47], 0);
    }

    this.root.traverse((o) => {
      if (o.isMesh && o.material.side !== THREE.BackSide) o.castShadow = true;
    });
  }

  addContacts() {
    const c = (parent, x, y, z, r) => {
      const o = new THREE.Object3D();
      o.position.set(x, y, z);
      parent.add(o);
      this.contacts.push({ o, r });
    };
    for (const side of ['L', 'R']) {
      const L = this.limbs[side];
      c(L.ankle, 0, -0.075, 0.13, 0);
      c(L.ankle, 0, -0.075, -0.06, 0);
      c(L.wrist, 0, -0.045, 0, 0.07);
      c(L.knee, 0, 0, 0, 0.08);
      c(L.elbow, 0, 0, 0, 0.065);
    }
    c(this.hips, 0, 0, 0, 0.17);
    c(this.spine, 0, 0.1, 0, 0.19);
    c(this.chest, 0, 0.07, 0, 0.19);
    c(this.head, 0, 0.27, 0, 0.28);
  }

  // ---------------------------------------------------------------- posing
  setFace(face) {
    this.face = face;
    if (!this.faceParts) return;
    this.faceParts.smile.visible = face === 'smile' || face === 'sleep';
    this.faceParts.open.visible = face === 'open';
    this.faceParts.sleepEyes.visible = face === 'sleep';
    for (const e of this.eyes) e.visible = face !== 'sleep';
  }

  /** Smoothly move to a pose array over `duration` seconds. */
  tweenTo(target, duration = 0.6, easing = (t) => t * t * (3 - 2 * t)) {
    this.tween = { from: this.pose.slice(), to: target, t: 0, duration, easing };
  }

  setPose(arr) {
    this.tween = null;
    this.pose.set(arr);
  }

  apply() {
    const p = this.additive ? this.pose.map((v, i) => v + this.additive[i]) : this.pose;
    const g = (k) => p[IDX[k]] * DEG;
    this.body.rotation.set(g('body.x'), g('body.y'), g('body.z'));
    this.spine.rotation.set(g('spine.x') * 0.5, g('spine.y') * 0.5, -g('spine.z') * 0.5);
    this.chest.rotation.set(g('spine.x') * 0.5, g('spine.y') * 0.5, -g('spine.z') * 0.5);
    this.head.rotation.set(g('head.x'), g('head.y'), g('head.z'));
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const L = this.limbs[side];
      const a = `arm${side}.`, l = `leg${side}.`;
      L.shoulder.rotation.set(-g(a + 'front'), g(a + 'twist') * s, g(a + 'side') * s);
      L.elbow.rotation.set(-g(a + 'elbowFwd'), 0, g(a + 'elbow') * s);
      L.hip.rotation.set(-g(l + 'front'), g(l + 'twist') * s, g(l + 'side') * s);
      L.knee.rotation.set(g(l + 'knee'), 0, g(l + 'kneeFold') * s);
    }
    this.ground(p[IDX.lift]);
  }

  /** Drop the body so the lowest hand / foot / knee / head touches the floor. */
  ground(lift = 0) {
    this.body.position.y = HIP_Y;
    this.root.updateMatrixWorld(true);
    const inv = this.root.matrixWorld.clone().invert();
    const v = new THREE.Vector3();
    let minY = Infinity;
    for (const { o, r } of this.contacts) {
      v.setFromMatrixPosition(o.matrixWorld).applyMatrix4(inv);
      minY = Math.min(minY, v.y - r);
    }
    this.body.position.y = HIP_Y - minY + lift;
    this.body.updateMatrixWorld(true);
  }

  update(dt, time) {
    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.duration);
      const k = tw.easing(tw.t);
      for (let i = 0; i < this.pose.length; i++) this.pose[i] = tw.from[i] + (tw.to[i] - tw.from[i]) * k;
      if (tw.t >= 1) this.tween = null;
    }
    this.apply();
    if (!this.visual) return;

    // Blink every few seconds.
    this.blinkTimer -= dt;
    const blink = this.blinkTimer < 0.12 && this.blinkTimer > 0;
    for (const e of this.eyes) e.scale.y = blink ? 0.1 : 1;
    if (this.blinkTimer <= 0) this.blinkTimer = 2 + Math.random() * 3;

    // Breathing.
    const breath = Math.sin(time * 2.2) * 0.012;
    this.chest.scale.set(1 + breath, 1 + breath, 1 + breath);
    this.headMesh.position.y = 0.27 + Math.sin(time * 2.2 + 0.4) * 0.004;
  }

  // ---------------------------------------------------------------- measuring
  /**
   * Where each joint ends up for a pose, seen from the front (x right, y up).
   * Used to score the child's pose from the camera.
   */
  measure(arr) {
    const saved = this.pose.slice();
    this.pose.set(arr);
    const saveAdd = this.additive;
    this.additive = null;
    this.apply();
    const pos = (o) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const out = {};
    for (const side of ['L', 'R']) {
      const L = this.limbs[side];
      out[side] = {
        shoulder: pos(L.shoulder), elbow: pos(L.elbow), wrist: pos(L.wrist),
        hip: pos(L.hip), knee: pos(L.knee), ankle: pos(L.ankle),
      };
    }
    this.pose.set(saved);
    this.additive = saveAdd;
    this.apply();
    return out;
  }
}

export { KEYS, HIP_Y };
