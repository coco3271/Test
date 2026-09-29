import * as THREE from 'three';

let gradientMap;
function getGradientMap() {
  if (!gradientMap) {
    // 4 soft bands give the "cartoon" look.
    const data = new Uint8Array([90, 90, 90, 255, 160, 160, 160, 255, 220, 220, 220, 255, 255, 255, 255, 255]);
    gradientMap = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
    gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

const toonCache = new Map();
export function toon(color, opts = {}) {
  const key = `${color}|${JSON.stringify(opts)}`;
  if (!toonCache.has(key)) {
    toonCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: getGradientMap(), ...opts }));
  }
  return toonCache.get(key);
}

const outlineCache = new Map();
/** Inverted-hull outline: the back faces pushed out along the normals, drawn dark. */
export function outlineMaterial(thickness = 0.012, color = 0x2a1d3a) {
  const key = `${thickness}|${color}`;
  if (!outlineCache.has(key)) {
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.outlineThickness = { value: thickness };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float outlineThickness;')
        .replace('#include <begin_vertex>', 'vec3 transformed = position + normal * outlineThickness;');
    };
    mat.customProgramCacheKey = () => `outline-${thickness}`;
    outlineCache.set(key, mat);
  }
  return outlineCache.get(key);
}

export function withOutline(mesh, thickness = 0.012) {
  const shell = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness));
  shell.raycast = () => {};
  mesh.add(shell);
  return mesh;
}

export function mesh(geometry, material, { outline = 0, shadow = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = shadow;
  m.receiveShadow = false;
  if (outline) withOutline(m, outline);
  return m;
}
