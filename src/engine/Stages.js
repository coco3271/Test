import * as THREE from 'three';
import { toon, mesh } from './materials.js';

export const THEMES = {
  meadow: {
    sky: ['#48b8ff', '#dff6ff', '#c4ecff'], sun: '#fff1b8', hemi: ['#ffffff', '#8fcf6a'],
    light: '#fff4e0', grass: 0x7ed957, dirt: 0xb57a4a,
  },
  jungle: {
    sky: ['#2ea8ff', '#fff0c4', '#b4e8ff'], sun: '#ffe08a', hemi: ['#fffbe8', '#5da04a'],
    light: '#ffe9c2', grass: 0x4cbb5a, dirt: 0x9c6239, lightIntensity: 2.6,
  },
  disco: {
    sky: ['#0d0024', '#4b1680', '#0d0024'], sun: '#000000', sunSize: 0, hemi: ['#b0a4ff', '#2a0c4a'],
    hemiIntensity: 0.9, light: '#ffd6ff', lightIntensity: 1.4, bloom: 0.85, grass: 0x2a1a4a, dirt: 0x1a1030,
  },
  night: {
    sky: ['#081238', '#35408f', '#0a1440'], sun: '#fff7d0', sunSize: 0.012, hemi: ['#a9b8ff', '#1d2a5c'],
    hemiIntensity: 1.0, light: '#c9d6ff', lightIntensity: 1.2, bloom: 0.75, grass: 0x3f7f64, dirt: 0x4a3552,
  },
};

const at = (obj, x, y, z) => {
  obj.position.set(x, y, z);
  return obj;
};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function island(group, theme, radius = 7) {
  const top = mesh(new THREE.CylinderGeometry(radius, radius * 0.97, 0.3, 64), toon(theme.grass), { outline: 0 });
  top.position.y = -0.15;
  top.receiveShadow = true;
  top.castShadow = false;
  group.add(top);
  const dirt = mesh(new THREE.CylinderGeometry(radius * 0.97, radius * 0.55, 2.2, 48), toon(theme.dirt), { outline: 0 });
  dirt.position.y = -1.4;
  group.add(dirt);
  const tip = mesh(new THREE.ConeGeometry(radius * 0.55, 3, 32), toon(theme.dirt), { outline: 0 });
  tip.position.y = -4;
  tip.rotation.x = Math.PI;
  group.add(tip);
  return top;
}

function spot(group, color = 0xffffff, size = 2.2, opacity = 0.45) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(size / 2, 48),
    new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.01;
  group.add(m);
  return m;
}

function tree(group, x, z, s = 1, leaf = 0x3fbf5f) {
  const t = new THREE.Group();
  t.position.set(x, 0, z);
  t.scale.setScalar(s);
  t.add(at(mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 10), toon(0x8a5a35), { outline: 0.02 }), 0, 0.6, 0));
  const crown = new THREE.Group();
  crown.position.y = 1.4;
  for (const [px, py, pz, r] of [[0, 0.25, 0, 0.65], [0.45, 0, 0.1, 0.45], [-0.45, 0.05, 0, 0.5], [0.1, 0.65, -0.1, 0.45]]) {
    const b = mesh(new THREE.SphereGeometry(r, 20, 14), toon(leaf), { outline: 0.02 });
    b.position.set(px, py, pz);
    crown.add(b);
  }
  // A few fruit for colour.
  for (let i = 0; i < 4; i++) {
    const f = mesh(new THREE.SphereGeometry(0.07, 10, 8), toon(pick([0xff5d5d, 0xffb347, 0xff8fd8])), { outline: 0 });
    const a = rand(0, Math.PI * 2);
    f.position.set(Math.cos(a) * 0.55, rand(-0.1, 0.5), Math.sin(a) * 0.55 + 0.1);
    crown.add(f);
  }
  t.add(crown);
  t.userData.sway = rand(0, 10);
  t.userData.crown = crown;
  group.add(t);
  return t;
}

function palm(group, x, z, s = 1) {
  const p = new THREE.Group();
  p.position.set(x, 0, z);
  p.scale.setScalar(s);
  const bend = rand(-0.25, 0.25);
  let y = 0;
  for (let i = 0; i < 7; i++) {
    const seg = mesh(new THREE.CylinderGeometry(0.11 - i * 0.008, 0.13 - i * 0.008, 0.36, 10), toon(i % 2 ? 0xa06a3c : 0x8a5a35), { outline: 0.015 });
    seg.position.set(Math.sin(i * 0.25) * bend * i * 0.15, y + 0.18, 0);
    p.add(seg);
    y += 0.34;
  }
  const top = new THREE.Group();
  top.position.set(Math.sin(1.75) * bend * 1.05, y, 0);
  for (let i = 0; i < 7; i++) {
    const leaf = mesh(new THREE.SphereGeometry(0.5, 12, 8), toon(0x2fae4f), { outline: 0.015 });
    leaf.scale.set(0.22, 0.06, 1);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.sin(a) * 0.45, -0.1, Math.cos(a) * 0.45);
    leaf.rotation.set(0.45, a, 0);
    top.add(leaf);
  }
  for (let i = 0; i < 3; i++) {
    const nut = mesh(new THREE.SphereGeometry(0.09, 10, 8), toon(0x6b4226), { outline: 0 });
    nut.position.set(Math.cos(i * 2.1) * 0.12, -0.12, Math.sin(i * 2.1) * 0.12);
    top.add(nut);
  }
  p.add(top);
  p.userData.sway = rand(0, 10);
  p.userData.crown = top;
  group.add(p);
  return p;
}

function flowers(group, count, rMin, rMax, colors) {
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 5), toon(0x3a9d3a), count);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), toon(0xffffff), count);
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), toon(0xffe066), count);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    let x, z;
    do {
      const a = rand(0, Math.PI * 2), r = rand(rMin, rMax);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
    } while (Math.abs(x) < 1.6 && z > -1.2); // keep the play area clear
    const s = rand(0.7, 1.3);
    m.makeScale(s, s, s).setPosition(x, 0.11 * s, z);
    stems.setMatrixAt(i, m);
    m.makeScale(s, s * 0.6, s).setPosition(x, 0.23 * s, z);
    heads.setMatrixAt(i, m);
    heads.setColorAt(i, c.set(pick(colors)));
    m.makeScale(s, s, s).setPosition(x, 0.25 * s, z + 0.02);
    centers.setMatrixAt(i, m);
  }
  group.add(stems, heads, centers);
}

function clouds(group, count, y = [3, 7], color = 0xffffff, opacity = 1) {
  const list = [];
  const mat = toon(color, opacity < 1 ? { transparent: true, opacity } : {});
  for (let i = 0; i < count; i++) {
    const c = new THREE.Group();
    const n = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const s = mesh(new THREE.SphereGeometry(rand(0.5, 0.9), 16, 12), mat, { outline: 0, shadow: false });
      s.position.set(k * 0.7 - n * 0.35, rand(-0.1, 0.3), rand(-0.2, 0.2));
      c.add(s);
    }
    c.position.set(rand(-22, 22), rand(...y), rand(-30, -10));
    c.scale.setScalar(rand(0.8, 1.8));
    c.userData.speed = rand(0.15, 0.4);
    group.add(c);
    list.push(c);
  }
  return list;
}

function cloudSea(group, color = 0xffffff) {
  const mat = toon(color);
  for (let i = 0; i < 40; i++) {
    const s = mesh(new THREE.SphereGeometry(rand(1.5, 3), 16, 12), mat, { outline: 0, shadow: false });
    const a = rand(0, Math.PI * 2), r = rand(9, 30);
    s.position.set(Math.cos(a) * r, rand(-5, -3.5), Math.sin(a) * r - 5);
    group.add(s);
  }
}

function butterflies(group, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const b = new THREE.Group();
    const mat = new THREE.MeshToonMaterial({ color: pick([0xff7ac6, 0xffd23f, 0x6cc6ff, 0xb48bff]), side: THREE.DoubleSide });
    const wingGeo = new THREE.CircleGeometry(0.09, 12);
    const l = new THREE.Mesh(wingGeo, mat), r = new THREE.Mesh(wingGeo, mat);
    l.position.x = 0.08; r.position.x = -0.08;
    const lp = new THREE.Group(), rp = new THREE.Group();
    lp.add(l); rp.add(r);
    b.add(lp, rp);
    b.userData = { lp, rp, a: rand(0, 6), r: rand(2, 3.5), h: rand(1.2, 2.4), sp: rand(0.3, 0.6) };
    group.add(b);
    list.push(b);
  }
  return list;
}

function rainbow(group) {
  const colors = [0xff5d5d, 0xffa24c, 0xffe066, 0x7ed957, 0x4dc3ff, 0x9b6bff];
  const r = new THREE.Group();
  colors.forEach((c, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(9 - i * 0.45, 0.24, 8, 64, Math.PI),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75 }),
    );
    r.add(ring);
  });
  r.position.set(0, -1, -22);
  group.add(r);
}

function mushroom(group, x, z, s = 1) {
  const m = new THREE.Group();
  m.position.set(x, 0, z);
  m.scale.setScalar(s);
  m.add(at(mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 12), toon(0xfff2dc), { outline: 0.012 }), 0, 0.2, 0));
  const cap = mesh(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(pick([0xff5d5d, 0xff8fd8, 0xffa24c])), { outline: 0.012 });
  cap.position.y = 0.36;
  m.add(cap);
  for (let i = 0; i < 5; i++) {
    const d = mesh(new THREE.SphereGeometry(0.045, 8, 6), toon(0xffffff), { outline: 0 });
    const a = (i / 5) * Math.PI * 2;
    d.position.set(Math.cos(a) * 0.2, 0.52, Math.sin(a) * 0.2);
    m.add(d);
  }
  group.add(m);
}

function starField(group, count = 600, color = 0xffffff) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection();
    v.y = Math.abs(v.y) * 0.9 + 0.05;
    v.normalize().multiplyScalar(80);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.5, sizeAttenuation: true, fog: false, map: glowTexture(), transparent: true, depthWrite: false }));
  group.add(pts);
  return pts;
}

function fireflies(group, count = 40) {
  const pos = new Float32Array(count * 3);
  const seeds = [];
  for (let i = 0; i < count; i++) seeds.push([rand(-6, 6), rand(0.3, 2.5), rand(-6, 1), rand(0, 10)]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff27a, size: 0.18, map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.userData.update = (t) => {
    seeds.forEach(([x, y, z, s], i) => {
      pos[i * 3] = x + Math.sin(t * 0.4 + s) * 0.6;
      pos[i * 3 + 1] = y + Math.sin(t * 0.7 + s * 2) * 0.3;
      pos[i * 3 + 2] = z + Math.cos(t * 0.3 + s) * 0.6;
    });
    g.attributes.position.needsUpdate = true;
  };
  group.add(pts);
  return pts;
}

// ------------------------------------------------------------------ stages

export function buildStage(name, world) {
  const theme = THEMES[name] ?? THEMES.meadow;
  const group = new THREE.Group();
  const animated = [];
  const stage = { group, animated };
  let ground = null;

  if (name === 'disco') {
    // Glowing dance floor.
    const N = 9, size = 0.9;
    const tiles = new THREE.InstancedMesh(
      new THREE.BoxGeometry(size * 0.94, 0.12, size * 0.94),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      N * N,
    );
    const palette = [0xff3cac, 0x784ba0, 0x2b86c5, 0x00f5d4, 0xfee440, 0xf15bb5];
    const m = new THREE.Matrix4();
    const tileColors = [];
    for (let i = 0; i < N * N; i++) {
      const x = (i % N) - (N - 1) / 2, z = Math.floor(i / N) - (N - 1) / 2;
      m.makeTranslation(x * size, -0.06, z * size - 1);
      tiles.setMatrixAt(i, m);
      tileColors.push({ x, z, c: new THREE.Color(pick(palette)) });
      tiles.setColorAt(i, tileColors[i].c.clone().multiplyScalar(0.3));
    }
    tiles.receiveShadow = true;
    group.add(tiles);
    const base = mesh(new THREE.CylinderGeometry(6.5, 6, 0.6, 48), toon(0x2a1a4a), { outline: 0 });
    base.position.y = -0.42;
    group.add(base);

    // Disco ball.
    const ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.15, flatShading: true, emissive: 0x6655aa, emissiveIntensity: 0.4 }),
    );
    ball.position.set(0, 3.6, -1.5);
    group.add(ball);
    group.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 3), new THREE.MeshBasicMaterial({ color: 0x999999 })), 0, 5.5, -1.5));

    // Sweeping light beams.
    const beams = [];
    const beamGeo = new THREE.ConeGeometry(0.9, 7, 24, 1, true);
    beamGeo.translate(0, -3.5, 0);
    palette.slice(0, 4).forEach((c, i) => {
      const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.set(-4.5 + i * 3, 6, -3);
      beam.userData.phase = i * 1.3;
      group.add(beam);
      beams.push(beam);
    });

    // Speakers.
    for (const s of [-1, 1]) {
      const sp = new THREE.Group();
      sp.position.set(3.4 * s, 0, -2.2);
      sp.add(at(mesh(new THREE.BoxGeometry(0.9, 1.6, 0.7), toon(0x1c1433), { outline: 0.02 }), 0, 0.8, 0));
      const cones = [];
      for (const [y, r] of [[1.15, 0.26], [0.5, 0.2]]) {
        const cone = mesh(new THREE.CylinderGeometry(r, r * 0.8, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x333344, emissive: 0xff3cac, emissiveIntensity: 0.3 }), { outline: 0 });
        cone.rotation.x = Math.PI / 2;
        cone.position.set(0, y, 0.37);
        sp.add(cone);
        cones.push(cone);
      }
      sp.userData.cones = cones;
      group.add(sp);
      animated.push(sp);
    }
    starField(group, 500, 0xffc8ff);
    spot(group, 0xff8ae2, 2.6, 0.6);

    let pulse = 0;
    let beatCount = 0;
    stage.onBeat = (i, strength) => {
      pulse = strength;
      beatCount = i;
      tileColors.forEach((t) => { if (Math.random() < 0.35) t.c.set(pick(palette)); });
    };
    stage.update = (dt, t) => {
      pulse = Math.max(0, pulse - dt * 3);
      const col = new THREE.Color();
      tileColors.forEach((tc, i) => {
        const wave = 0.5 + 0.5 * Math.sin(t * 3 - Math.hypot(tc.x, tc.z) * 0.8 + beatCount);
        tiles.setColorAt(i, col.copy(tc.c).multiplyScalar(0.15 + wave * 0.35 + pulse * 0.7));
      });
      tiles.instanceColor.needsUpdate = true;
      ball.rotation.y += dt * 0.8;
      beams.forEach((b) => {
        b.rotation.z = Math.sin(t * 0.7 + b.userData.phase) * 0.5;
        b.rotation.x = Math.cos(t * 0.5 + b.userData.phase) * 0.3;
        b.material.opacity = 0.1 + pulse * 0.12;
      });
      animated.forEach((sp) => sp.userData.cones.forEach((c) => c.scale.setScalar(1 + pulse * 0.15)));
    };
    return stage;
  }

  ground = island(group, theme, name === 'jungle' ? 7.5 : 7);
  stage.ground = ground;
  const sways = [];

  if (name === 'meadow' || name === 'night') {
    const leaf = name === 'night' ? 0x2f8f6a : 0x3fbf5f;
    for (const [x, z, s] of [[-3.6, -2.5, 1.2], [3.8, -3, 1.4], [-5, -0.5, 1], [5.2, -0.2, 0.9], [-1.8, -4.8, 1.1], [2, -5.2, 1]]) {
      sways.push(tree(group, x, z, s, leaf));
    }
    flowers(group, 90, 2, 6.5, name === 'night' ? [0x9fb4ff, 0xd1b3ff, 0xffffff] : [0xff7ac6, 0xffffff, 0xffd23f, 0xb48bff, 0xff8a5c]);
    if (name === 'meadow') {
      rainbow(group);
      cloudSea(group);
      stage.butterflies = butterflies(group, 5);
      stage.clouds = clouds(group, 9);
      spot(group, 0xfff6c8, 2.4, 0.35);
    } else {
      cloudSea(group, 0x4a5aa8);
      stage.clouds = clouds(group, 6, [4, 8], 0x6a74c0);
      starField(group, 700);
      stage.fireflies = fireflies(group, 50);
      spot(group, 0xbfd0ff, 2.4, 0.3);
    }
  }

  if (name === 'jungle') {
    for (const [x, z, s] of [[-3.8, -2.6, 1.1], [4, -2.8, 1.25], [-5.4, 0.2, 0.9], [5.6, 0, 1], [-2, -5.2, 1.2], [1.8, -5.6, 1]]) {
      sways.push(palm(group, x, z, s));
    }
    for (const [x, z, s] of [[-2.6, -1.4, 0.8], [2.8, -1.2, 1], [-4.4, 1.6, 0.7], [4.6, 1.4, 0.9], [0.6, -3.4, 0.7]]) mushroom(group, x, z, s);
    flowers(group, 60, 2.2, 7, [0xff5d5d, 0xffd23f, 0xff8fd8]);
    cloudSea(group, 0xe8fbff);
    stage.clouds = clouds(group, 8);
    stage.butterflies = butterflies(group, 4);

    // Lava mode: the ground glows orange and bubbles.
    const grassMat = ground.material;
    const lavaMat = new THREE.MeshStandardMaterial({ color: 0xff4d00, emissive: 0xff5a00, emissiveIntensity: 1.2, roughness: 0.6 });
    const bubbles = [];
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(rand(0.08, 0.2), 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc14d }));
      b.visible = false;
      b.userData = { x: rand(-5, 5), z: rand(-5, 2), s: rand(0, 3) };
      group.add(b);
      bubbles.push(b);
    }
    const lavaSpot = spot(group, 0xffffff, 2.4, 0.4);
    let lava = false;
    stage.setLava = (on) => {
      lava = on;
      ground.material = on ? lavaMat : grassMat;
      lavaSpot.material.color.set(on ? 0xffe0a0 : 0xffffff);
      bubbles.forEach((b) => (b.visible = on));
    };
    stage.lavaUpdate = (dt, t) => {
      if (!lava) return;
      lavaMat.emissiveIntensity = 1 + Math.sin(t * 4) * 0.25;
      bubbles.forEach((b) => {
        const k = ((t * 0.6 + b.userData.s) % 1);
        b.position.set(b.userData.x, k * 0.3 - 0.05, b.userData.z);
        b.scale.setScalar(Math.sin(k * Math.PI) + 0.01);
      });
    };
  }

  stage.update = (dt, t) => {
    sways.forEach((s) => {
      s.userData.crown.rotation.z = Math.sin(t * 0.9 + s.userData.sway) * 0.04;
      s.userData.crown.rotation.x = Math.cos(t * 0.7 + s.userData.sway) * 0.03;
    });
    stage.clouds?.forEach((c) => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 26) c.position.x = -26;
    });
    stage.butterflies?.forEach((b) => {
      const u = b.userData;
      u.a += dt * u.sp;
      b.position.set(Math.cos(u.a) * u.r * 1.6, u.h + Math.sin(u.a * 3) * 0.3, Math.sin(u.a) * u.r * 0.5 - 3.5);
      b.rotation.y = -u.a;
      const flap = Math.sin(t * 18 + u.r) * 1.1;
      u.lp.rotation.y = flap;
      u.rp.rotation.y = -flap;
    });
    stage.fireflies?.userData.update(t);
    stage.lavaUpdate?.(dt, t);
    if (stage.pulseT > 0) {
      stage.pulseT = Math.max(0, stage.pulseT - dt * 3);
      sways.forEach((s) => s.userData.crown.scale.setScalar(1 + stage.pulseT * 0.04));
    }
  };
  stage.onBeat = (i, strength) => { stage.pulseT = strength; };
  return stage;
}
