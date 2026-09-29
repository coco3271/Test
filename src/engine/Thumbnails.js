import * as THREE from 'three';
import { Avatar } from './Avatar.js';

/**
 * Renders white "pictogram" silhouettes of poses for the move cards, using the
 * main renderer and an off-screen render target. Results are cached as data URLs.
 */
export class Thumbnails {
  constructor(renderer, buddy, size = 192) {
    this.renderer = renderer;
    this.size = size;
    this.cache = new Map();
    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    this.avatar = new Avatar(buddy);
    this.avatar.root.traverse((o) => (o.castShadow = false));
    this.scene.add(this.avatar.root);
    this.target = new THREE.WebGLRenderTarget(size, size);
    this.pixels = new Uint8Array(size * size * 4);
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;
  }

  get(key, poseArray) {
    if (this.cache.has(key)) return this.cache.get(key);
    const { renderer, avatar, size } = this;
    avatar.setPose(poseArray);
    avatar.apply();

    // Frame the whole body.
    const box = new THREE.Box3().setFromObject(avatar.root);
    const center = box.getCenter(new THREE.Vector3());
    const extent = Math.max(box.max.x - box.min.x, box.max.y - box.min.y) * 0.5 + 0.08;
    const dist = extent / Math.tan((this.camera.fov * Math.PI) / 360);
    this.camera.position.set(center.x, center.y + 0.1, center.z + dist);
    this.camera.lookAt(center);

    const prevTarget = renderer.getRenderTarget();
    const prevColor = renderer.getClearColor(new THREE.Color());
    const prevAlpha = renderer.getClearAlpha();
    const prevShadow = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.readRenderTargetPixels(this.target, 0, 0, size, size, this.pixels);
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevColor, prevAlpha);
    renderer.shadowMap.autoUpdate = prevShadow;

    const g = this.canvas.getContext('2d');
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      const src = (size - 1 - y) * size * 4;
      img.data.set(this.pixels.subarray(src, src + size * 4), y * size * 4);
    }
    g.putImageData(img, 0, 0);
    const url = this.canvas.toDataURL('image/png');
    this.cache.set(key, url);
    return url;
  }
}
