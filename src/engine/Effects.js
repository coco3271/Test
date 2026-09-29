import * as THREE from 'three';

const COLORS = [0xff5d8f, 0xffd23f, 0x3ec1ff, 0x7ed957, 0xb48bff, 0xff9f1c];

/** Confetti and sparkle bursts, pooled in one instanced mesh. */
export class Effects {
  constructor(scene, max = 400) {
    this.max = max;
    this.mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.06, 0.1),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }),
      max,
    );
    this.mesh.frustumCulled = false;
    this.parts = [];
    const c = new THREE.Color();
    for (let i = 0; i < max; i++) {
      this.parts.push({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() });
      this.mesh.setColorAt(i, c.set(COLORS[i % COLORS.length]));
    }
    this.hideAll();
    scene.add(this.mesh);
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.s = new THREE.Vector3(1, 1, 1);
    this.zero = new THREE.Vector3(0, 0, 0);
    this.next = 0;
  }

  hideAll() {
    const m = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < this.max; i++) this.mesh.setMatrixAt(i, m);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Burst of confetti from a point. */
  burst(origin = new THREE.Vector3(0, 1.2, 0), count = 60, power = 1) {
    for (let n = 0; n < count; n++) {
      const pt = this.parts[this.next];
      this.next = (this.next + 1) % this.max;
      pt.life = 2 + Math.random() * 1.5;
      pt.p.copy(origin);
      const a = Math.random() * Math.PI * 2;
      const up = 2.5 + Math.random() * 3;
      pt.v.set(Math.cos(a) * (1 + Math.random() * 2) * power, up * power, Math.sin(a) * (1 + Math.random() * 2) * power * 0.6);
      pt.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      pt.w.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    }
  }

  /** Confetti raining from above the stage. */
  rain(count = 120) {
    for (let n = 0; n < count; n++) {
      this.burst(new THREE.Vector3((Math.random() - 0.5) * 6, 3.5 + Math.random() * 2, (Math.random() - 0.5) * 3), 1, 0.2);
    }
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const pt = this.parts[i];
      if (pt.life <= 0) continue;
      pt.life -= dt;
      pt.v.y -= 4.5 * dt;
      pt.v.multiplyScalar(1 - dt * 1.2);
      if (pt.v.y < -1.2) pt.v.y = -1.2; // flutter down
      pt.p.addScaledVector(pt.v, dt);
      pt.r.x += pt.w.x * dt;
      pt.r.y += pt.w.y * dt;
      pt.r.z += pt.w.z * dt;
      const scale = pt.life > 0 && pt.p.y > -0.2 ? Math.min(1, pt.life) : 0;
      this.s.setScalar(scale);
      this.m.compose(pt.p, this.q.setFromEuler(pt.r), this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
