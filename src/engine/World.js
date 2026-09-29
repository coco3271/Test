import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildStage, THEMES } from './Stages.js';

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom;
  uniform vec3 sunDir; uniform vec3 sunColor; uniform float sunSize;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 col = h > 0.0 ? mix(horizon, top, pow(h, 0.6)) : mix(horizon, bottom, pow(-h, 0.5));
    float d = max(dot(vDir, normalize(sunDir)), 0.0);
    col += sunColor * (smoothstep(1.0 - sunSize, 1.0 - sunSize * 0.6, d) + pow(d, 24.0) * 0.35);
    gl_FragColor = vec4(col, 1.0);
  }`;

export class World {
  constructor(canvas, { quality = 'high' } = {}) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.25));
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    this.cameraTarget = new THREE.Vector3(0, 0.85, 0);
    this.cameraBase = new THREE.Vector3(0, 1.4, 4.8);
    this.cameraZoom = 1;

    this.skyUniforms = {
      top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0.4, 0.5, -1) }, sunColor: { value: new THREE.Color() }, sunSize: { value: 0.02 },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(90, 32, 16),
      new THREE.ShaderMaterial({ uniforms: this.skyUniforms, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }),
    );
    this.scene.add(sky);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x88aa66, 1.3);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4);
    this.sun.position.set(4, 8, 5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    Object.assign(this.sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 25 });
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun);

    this.composer = null;
    if (quality !== 'low') {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.5, 1.0);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }

    this.stage = null;
    this.updaters = new Set();
    this.lastFrame = performance.now();
    this.time = 0;
    this.shake = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setTheme('meadow');
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    // Portrait phones need the camera further back to fit the buddy.
    this.portraitPush = w < h ? 1.55 : 1;
    this.camera.updateProjectionMatrix();
  }

  setTheme(name) {
    const theme = THEMES[name] ?? THEMES.meadow;
    this.themeName = name;
    if (this.stage) {
      this.scene.remove(this.stage.group);
      this.stage.dispose?.();
    }
    this.skyUniforms.top.value.set(theme.sky[0]);
    this.skyUniforms.horizon.value.set(theme.sky[1]);
    this.skyUniforms.bottom.value.set(theme.sky[2]);
    this.skyUniforms.sunColor.value.set(theme.sun);
    this.skyUniforms.sunSize.value = theme.sunSize ?? 0.02;
    this.scene.fog = new THREE.Fog(theme.sky[1], 18, 70);
    this.hemi.color.set(theme.hemi[0]);
    this.hemi.groundColor.set(theme.hemi[1]);
    this.hemi.intensity = theme.hemiIntensity ?? 1.3;
    this.sun.color.set(theme.light);
    this.sun.intensity = theme.lightIntensity ?? 2.4;
    if (this.bloom) this.bloom.strength = theme.bloom ?? 0.35;
    this.stage = buildStage(name, this);
    this.scene.add(this.stage.group);
  }

  /** Called by the game on every musical beat so the stage can pulse. */
  beat(index, strength = 1) {
    this.stage?.onBeat?.(index, strength);
  }

  setLava(on) {
    this.stage?.setLava?.(on);
  }

  onUpdate(fn) {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  start() {
    this.renderer.setAnimationLoop(() => this.frame());
  }

  frame() {
    const now = performance.now();
    // Real elapsed time drives game timers; animation steps are capped so a
    // hiccup doesn't make things jump.
    const realDt = Math.min((now - this.lastFrame) / 1000, 0.25);
    this.lastFrame = now;
    const dt = Math.min(realDt, 1 / 20);
    this.time += dt;
    for (const fn of this.updaters) fn(dt, this.time, realDt);
    this.stage?.update?.(dt, this.time);

    // Gentle camera drift keeps the scene alive.
    const t = this.time;
    const dist = this.cameraZoom * this.portraitPush;
    this.shake = Math.max(0, this.shake - dt * 2);
    const sh = this.shake * 0.05;
    this.camera.position.set(
      this.cameraBase.x + Math.sin(t * 0.13) * 0.5 + (Math.random() - 0.5) * sh,
      this.cameraBase.y + Math.sin(t * 0.21) * 0.08 + (dist - 1) * 0.35 + (Math.random() - 0.5) * sh,
      this.cameraBase.z * dist,
    );
    this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y + (dist - 1) * 0.25, this.cameraTarget.z);

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
