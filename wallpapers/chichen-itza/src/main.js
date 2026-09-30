// Fondo animado "El Castillo · Chichén Itzá" — escena Three.js.
//
// Modo en vivo:     index.html                     (bucle en tiempo real)
// Modo captura:     index.html?capture&w=1320&h=2868
//                   expone window.renderAt(t) → dataURL PNG (render determinista)
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders.js';
import { Birds } from './birds.js';

export const LOOP = 16; // s — todas las animaciones son periódicas en LOOP

const params = new URLSearchParams(location.search);
const capture = params.has('capture');

// Encuadre: ancho visible del lienzo y ancla inferior (px de lienzo)
const VIEW = { w: 2020, bottomMargin: 40 };
// Movimiento de cámara (px de lienzo a disparidad 1) y dolly
const CAM = { ax: 13, ay: 3.5, zoom: 0.014 };

// Zopilotes: centro de la térmica (m), radio, vueltas por bucle (signo = sentido)
const BIRDS = [
  { cx: -8, cy: 125, cz: 135, r: 24, turns: 1, phase: 0.4, bank: 0.26, teeter: 11, scale: 2.0 },
  { cx: 18, cy: 142, cz: 168, r: 30, turns: -1, phase: 2.3, bank: 0.22, teeter: 9, scale: 2.3 },
  { cx: -31, cy: 110, cz: 122, r: 16, turns: 2, phase: 4.1, bank: 0.34, teeter: 13, scale: 1.9 },
];

THREE.ColorManagement.enabled = false;

async function loadLayout(base) {
  const r = await fetch(`${base}layout.json`);
  return r.json();
}

function loadTex(loader, url, maxAniso) {
  return new Promise((res, rej) => loader.load(url, (t) => {
    t.flipY = false;
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = maxAniso;
    res(t);
  }, undefined, rej));
}

async function init() {
  const host = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({
    antialias: true, preserveDrawingBuffer: capture, powerPreference: 'high-performance', alpha: false,
  });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = false;
  host.appendChild(renderer.domElement);

  const base = 'assets/';
  const layout = await loadLayout(base);
  const [cw, ch] = layout.canvas;
  const loader = new THREE.TextureLoader();
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const names = ['sky_bg.png', 'clouds_rgb.jpg', 'clouds_a.jpg', 'fg_rgb.jpg', 'fg_a.png', 'masks.jpg'];
  const [tSky, tCloudRGB, tCloudA, tFgRGB, tFgA, tMask] = await Promise.all(
    names.map((n) => loadTex(loader, base + n, aniso)),
  );
  tSky.generateMipmaps = false;
  tSky.minFilter = THREE.LinearFilter;

  const uniforms = {
    tSky: { value: tSky }, tCloudRGB: { value: tCloudRGB }, tCloudA: { value: tCloudA },
    tFgRGB: { value: tFgRGB }, tFgA: { value: tFgA }, tMask: { value: tMask },
    uRes: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uLoop: { value: LOOP },
    uCanvas: { value: new THREE.Vector2(cw, ch) },
    uPhotoY: { value: layout.photo.y },
    uHorizonY: { value: layout.horizonY },
    uEyeY: { value: layout.horizonY - 52 },
    uFocal: { value: 1677 },
    uViewW: { value: VIEW.w },
    uViewBottom: { value: ch - VIEW.bottomMargin },
    uViewCX: { value: cw / 2 },
    uCam: { value: new THREE.Vector2() },
    uZoom: { value: 0 },
    uFocus: { value: new THREE.Vector2(cw / 2, layout.pyramidTopY + 300) },
  };
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader, fragmentShader, uniforms, depthTest: false }),
  );
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const quadCam = new THREE.Camera();

  const birds = new Birds(BIRDS, LOOP);
  const birdScene = new THREE.Scene();
  birdScene.add(birds.group);
  const birdCam = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);
  const skyTint = new THREE.Color(0.30, 0.47, 0.75);

  let W = 1, H = 1;
  function resize(w, h, dpr) {
    W = Math.round(w * dpr); H = Math.round(h * dpr);
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = `${w}px`;
    renderer.domElement.style.height = `${h}px`;
    uniforms.uRes.value.set(W, H);
    birdCam.right = W; birdCam.bottom = H; birdCam.updateProjectionMatrix();
  }

  // lienzo → pantalla, aplicando el paralaje de una capa con disparidad d
  function canvasToScreen(x, y, d) {
    const u = uniforms;
    const f = u.uFocus.value, cam = u.uCam.value, z = u.uZoom.value;
    // inversa de camWarp(): q = F + (p − F)/(1 + z d) + cam d
    const px = f.x + (x - cam.x * d - f.x) * (1 + z * d);
    const py = f.y + (y - cam.y * d - f.y) * (1 + z * d);
    const viewH = u.uViewW.value * H / W;
    return [
      ((px - (u.uViewCX.value - u.uViewW.value / 2)) / u.uViewW.value) * W,
      ((py - (u.uViewBottom.value - viewH)) / viewH) * H,
    ];
  }
  const zBase = (1.6 * uniforms.uFocal.value) / (layout.horizonY - uniforms.uEyeY.value);
  function project(X, Y, Z) {
    const x = cw / 2 + (uniforms.uFocal.value * X) / Z;
    const y = uniforms.uEyeY.value - (uniforms.uFocal.value * (Y - 1.6)) / Z;
    return canvasToScreen(x, y, zBase / Z);
  }

  function frame(t) {
    const tau = (Math.PI * 2 * t) / LOOP;
    uniforms.uTime.value = t;
    uniforms.uCam.value.set(CAM.ax * Math.sin(tau), CAM.ay * Math.sin(2 * tau));
    uniforms.uZoom.value = CAM.zoom * (0.5 - 0.5 * Math.cos(tau));
    birds.update(t, project, skyTint);
    renderer.clear();
    renderer.render(scene, quadCam);
    renderer.render(birdScene, birdCam);
  }

  if (capture) {
    const w = +params.get('w') || 1320, h = +params.get('h') || 2868;
    resize(w, h, 1);
    window.renderAt = (t) => {
      frame(t);
      renderer.getContext().finish();
      return renderer.domElement.toDataURL('image/png');
    };
    window.wallpaperReady = true;
    return;
  }

  const fit = () => {
    const r = host.getBoundingClientRect();
    resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2));
  };
  new ResizeObserver(fit).observe(host);
  fit();
  const t0 = performance.now();
  const loop = () => {
    frame((((performance.now() - t0) / 1000) % LOOP));
    requestAnimationFrame(loop);
  };
  document.body.classList.add('ready');
  loop();
}

init().catch((e) => {
  console.error(e);
  document.body.dataset.error = String(e);
});
