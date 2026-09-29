import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// Tracks the child's body with the front camera, 100% on the device.
// No video ever leaves the phone.

const BASE = import.meta.env.BASE_URL;
const LOCAL_WASM = `${BASE}mediapipe/wasm`;
const LOCAL_MODEL = `${BASE}mediapipe/pose_landmarker_lite.task`;
const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const CDN_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

export const LM = {
  nose: 0, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28,
};

const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

async function exists(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}

export class PoseTracker {
  constructor(video, overlay) {
    this.video = video;
    this.overlay = overlay;
    this.landmarks = null;
    this.lastSeen = 0;
    this.energy = 0;
    this.jumps = 0;
    this.running = false;
    this.listeners = new Set();
    this.prev = null;
    this.hipBase = null;
    this.airborne = false;
  }

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    this.stream = stream;
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();

    if (!this.landmarker) {
      const wasm = (await exists(`${LOCAL_WASM}/vision_wasm_internal.wasm`)) ? LOCAL_WASM : CDN_WASM;
      const model = (await exists(LOCAL_MODEL)) ? LOCAL_MODEL : CDN_MODEL;
      const files = await FilesetResolver.forVisionTasks(wasm);
      const make = (delegate) => PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: model, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      try {
        this.landmarker = await make('GPU');
      } catch {
        this.landmarker = await make('CPU');
      }
    }
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.landmarks = null;
  }

  onFrame(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  loop() {
    if (!this.running) return;
    const v = this.video;
    if (v.readyState >= 2 && v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      const now = performance.now();
      const res = this.landmarker.detectForVideo(v, now);
      const lm = res.landmarks?.[0] ?? null;
      this.process(lm, now);
      for (const fn of this.listeners) fn(this);
      this.draw();
    }
    requestAnimationFrame(() => this.loop());
  }

  get aspect() {
    return (this.video.videoWidth || 4) / (this.video.videoHeight || 3);
  }

  /** How much the child is moving (0 = still, ~1 = dancing, 2+ = running wild). */
  process(lm, now) {
    this.landmarks = lm;
    if (!lm) {
      this.energy *= 0.9;
      return;
    }
    this.lastSeen = now;
    const a = this.aspect;
    const P = (i) => [lm[i].x * a, lm[i].y];
    const torso = Math.hypot(
      (lm[11].x + lm[12].x - lm[23].x - lm[24].x) * 0.5 * a,
      (lm[11].y + lm[12].y - lm[23].y - lm[24].y) * 0.5,
    ) || 0.3;

    const pts = [0, 15, 16, 27, 28, 23, 24].map(P);
    if (this.prev && now > this.prevTime) {
      const dt = (now - this.prevTime) / 1000;
      let sum = 0;
      pts.forEach((p, i) => (sum += Math.hypot(p[0] - this.prev[i][0], p[1] - this.prev[i][1])));
      const speed = sum / pts.length / torso / dt; // torso-lengths per second
      this.energy += (Math.min(speed, 6) - this.energy) * Math.min(1, dt * 6);
    }
    this.prev = pts;
    this.prevTime = now;

    // Jump counter: hips rise clearly above their resting height, then land.
    const hipY = (lm[23].y + lm[24].y) / 2;
    if (this.hipBase === null) this.hipBase = hipY;
    const rise = (this.hipBase - hipY) / torso;
    if (!this.airborne && rise > 0.12) {
      this.airborne = true;
    } else if (this.airborne && rise < 0.05) {
      this.airborne = false;
      this.jumps++;
    }
    if (!this.airborne) this.hipBase += (hipY - this.hipBase) * 0.05;
  }

  /** True when head, hands and feet are all in the picture. */
  get fullBody() {
    const lm = this.landmarks;
    if (!lm) return false;
    return [0, 11, 12, 15, 16, 23, 24, 27, 28].every((i) => (lm[i].visibility ?? 1) > 0.5 && lm[i].y > -0.05 && lm[i].y < 1.05);
  }

  get visible() {
    return !!this.landmarks && performance.now() - this.lastSeen < 500;
  }

  draw() {
    const c = this.overlay;
    if (!c) return;
    const w = (c.width = c.clientWidth * 2);
    const h = (c.height = c.clientHeight * 2);
    const g = c.getContext('2d');
    g.clearRect(0, 0, w, h);
    const lm = this.landmarks;
    if (!lm) return;
    // Mirror so it behaves like a mirror for the child.
    const X = (i) => (1 - lm[i].x) * w, Y = (i) => lm[i].y * h;
    g.lineCap = 'round';
    g.lineWidth = Math.max(4, w / 60);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.shadowColor = '#ff5dbb';
    g.shadowBlur = 12;
    for (const [a, b] of BONES) {
      g.beginPath();
      g.moveTo(X(a), Y(a));
      g.lineTo(X(b), Y(b));
      g.stroke();
    }
    g.fillStyle = '#ffe066';
    for (const i of [0, 15, 16, 27, 28]) {
      g.beginPath();
      g.arc(X(i), Y(i), g.lineWidth * 1.3, 0, Math.PI * 2);
      g.fill();
    }
  }
}
