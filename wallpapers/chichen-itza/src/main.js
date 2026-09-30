// Fondo animado "El Castillo · Chichén Itzá" — escena Three.js.
//
// Modo en vivo:     index.html                     (bucle en tiempo real)
// Modo captura:     index.html?capture&w=1320&h=2868
//                   expone window.renderAt(t) → dataURL PNG (render determinista)
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders.js';
import { Birds } from './birds.js';

const params = new URLSearchParams(location.search);
const capture = params.has('capture');

// s — todas las animaciones son periódicas en LOOP (?loop=6 para ColorOS, que limita
// los fondos de vídeo a 6 s). Las velocidades físicas no cambian con la duración: se
// ajustan los periodos espaciales para que cada efecto cierre exactamente en LOOP.
export const LOOP = Math.max(3, +(params.get('loop') || 16));
const loopK = Math.sqrt(LOOP / 16);

// Encuadre: ancho visible del lienzo y ancla inferior (px de lienzo)
const VIEW = { w: 2020, bottomMargin: 40 };
// Movimiento de cámara (px de lienzo a disparidad 1) y dolly
const CAM = { ax: 13 * loopK, ay: 3.5 * loopK, zoom: 0.014 * loopK };

// Zopilotes: centro de la térmica (m), velocidad (m/s), radio deseado, sentido.
// Vueltas enteras por bucle → el radio real sale de v·LOOP/(2π·vueltas) y el alabeo
// de la física del giro coordinado (tan φ = v²/(g·r)), limitado a ~32°.
const BIRDS = [
  { cx: -8, cy: 125, cz: 135, v: 9.4, r: 24, dir: 1, phase: 0.4, scale: 2.0 },
  { cx: 18, cy: 142, cz: 168, v: 11.8, r: 30, dir: -1, phase: 2.3, scale: 2.3 },
  { cx: -31, cy: 110, cz: 122, v: 12.6, r: 16, dir: 1, phase: 4.1, scale: 1.9 },
].map((b, k) => {
  const turns = Math.max(1, Math.round((b.v * LOOP) / (2 * Math.PI * b.r)));
  const r = (b.v * LOOP) / (2 * Math.PI * turns);
  const bank = Math.min(0.56, Math.atan((b.v * b.v) / (9.81 * r)));
  return { ...b, r, turns: turns * b.dir, bank, teeter: Math.max(2, Math.round(0.7 * LOOP)) + k, bob: Math.max(1, Math.round(LOOP / 5)) };
});
// periodos espaciales enteros por bucle: sombras ~11 m/s (celda ~40 m), rachas ~3,5 m/s (celda ~7 m)
const periodic = (speed, cell) => {
  const per = Math.max(2, Math.round((speed * LOOP) / cell));
  return [per, (speed * LOOP) / per];
};
const [SHADOW_PER, SHADOW_CELL] = periodic(11, 40);
const [GUST_PER, GUST_CELL] = periodic(3.5, 7);
// flow-map de nubes: fase de ~6–8 s con número entero de fases por bucle
const FLOW_P = LOOP / Math.max(1, Math.round(LOOP / 8));

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
    uFlowP: { value: FLOW_P },
    uShadow: { value: new THREE.Vector2(SHADOW_PER, SHADOW_CELL) },
    uGust: { value: new THREE.Vector2(GUST_PER, GUST_CELL) },
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
