/**
 * Utilidades del mundo 3D: materiales con caché, cajas redondeadas,
 * letreros y texturas dibujadas en canvas. Nada de ficheros de imagen: todo
 * se genera en tiempo de ejecución, así el juego sigue siendo un único HTML.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Paleta del mundo: la misma que la interfaz (pizarra + cian de monitor). */
export const COL = {
  fondo: 0x070b14,
  suelo: 0x1a2a45,
  sueloB: 0x203354,
  pared: 0x22324f,
  paredClara: 0x30456a,
  madera: 0x6b5a48,
  acero: 0x9db2cf,
  blanco: 0xeaf1fb,
  cian: 0x38d6e0,
  rojo: 0xff5d6c,
  verde: 0x3ddc97,
  ambar: 0xffc857,
  azul: 0x5b8cff,
} as const;

const cacheMat = new Map<string, THREE.MeshStandardMaterial>();

/** Material estándar compartido (no lo mutes: pide uno propio con `matUnico`). */
export function mat(
  color: number,
  o: { rough?: number; metal?: number; emissive?: number; emissiveI?: number } = {},
): THREE.MeshStandardMaterial {
  const k = `${color}|${o.rough}|${o.metal}|${o.emissive}|${o.emissiveI}`;
  let m = cacheMat.get(k);
  if (!m) {
    m = matUnico(color, o);
    cacheMat.set(k, m);
  }
  return m;
}

export function matUnico(
  color: number,
  o: { rough?: number; metal?: number; emissive?: number; emissiveI?: number } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.72,
    metalness: o.metal ?? 0.04,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.emissiveI ?? 1,
  });
}

/** Material que brilla (pantallas, neones): se usa con bloom. */
export function luz(color: number, intensidad = 2): THREE.MeshStandardMaterial {
  return matUnico(color, { rough: 0.4, emissive: color, emissiveI: intensidad });
}

const cacheGeo = new Map<string, THREE.BufferGeometry>();

/** Caja con esquinas redondeadas y sombras activadas. */
export function caja(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  radio = 0.04,
): THREE.Mesh {
  const k = `rb|${w}|${h}|${d}|${radio}`;
  let g = cacheGeo.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 3, Math.min(radio, w / 2.2, h / 2.2, d / 2.2));
    cacheGeo.set(k, g);
  }
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cilindro(
  rSup: number,
  rInf: number,
  h: number,
  material: THREE.Material,
  seg = 20,
): THREE.Mesh {
  const k = `cy|${rSup}|${rInf}|${h}|${seg}`;
  let g = cacheGeo.get(k);
  if (!g) {
    g = new THREE.CylinderGeometry(rSup, rInf, h, seg);
    cacheGeo.set(k, g);
  }
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function esfera(r: number, material: THREE.Material, seg = 20): THREE.Mesh {
  const k = `sp|${r}|${seg}`;
  let g = cacheGeo.get(k);
  if (!g) {
    g = new THREE.SphereGeometry(r, seg, Math.max(8, Math.round(seg * 0.7)));
    cacheGeo.set(k, g);
  }
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Hash determinista de un texto → 0..1 (variar pieles, pelo, etc. por nombre). */
export function hash01(texto: string, salto = 0): number {
  let h = 2166136261 ^ salto;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function lerpAngulo(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function lienzo(ancho: number, alto: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return [c, c.getContext('2d')!];
}

export function aHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Letrero: plano con texto nítido (para puertas, suelo y carteles). */
export function letrero(
  texto: string,
  ancho: number,
  alto: number,
  o: { fondo?: string | null; tinta?: string; borde?: string; px?: number; emisivo?: boolean } = {},
): THREE.Mesh {
  const esc = 128;
  const [c, x] = lienzo(Math.round(ancho * esc), Math.round(alto * esc));
  if (o.fondo) {
    x.fillStyle = o.fondo;
    x.beginPath();
    x.roundRect(4, 4, c.width - 8, c.height - 8, 22);
    x.fill();
  }
  if (o.borde) {
    x.strokeStyle = o.borde;
    x.lineWidth = 6;
    x.beginPath();
    x.roundRect(6, 6, c.width - 12, c.height - 12, 20);
    x.stroke();
  }
  x.fillStyle = o.tinta ?? '#eaf1fb';
  let px = o.px ?? Math.round(c.height * 0.46);
  const fuente = (tam: number): string => `800 ${tam}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  x.font = fuente(px);
  const util = c.width - 40;
  const medida = x.measureText(texto).width;
  if (medida > util) {
    px = Math.floor((px * util) / medida);
    x.font = fuente(px);
  }
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(texto, c.width / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: !o.emisivo });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), m);
  return plano;
}

/** Suelo de baldosas (canvas repetible) con juntas finas. */
export function texturaSuelo(base: number, alterno: number, junta: number): THREE.CanvasTexture {
  const [c, x] = lienzo(256, 256);
  x.fillStyle = aHex(junta);
  x.fillRect(0, 0, 256, 256);
  const cols = [base, alterno, alterno, base];
  for (let i = 0; i < 4; i++) {
    x.fillStyle = aHex(cols[i]!);
    x.fillRect((i % 2) * 128 + 2, Math.floor(i / 2) * 128 + 2, 124, 124);
  }
  // un poco de ruido para que no parezca plástico
  const d = x.getImageData(0, 0, 256, 256);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = (Math.random() - 0.5) * 7;
    d.data[i] = Math.max(0, Math.min(255, d.data[i]! + r));
    d.data[i + 1] = Math.max(0, Math.min(255, d.data[i + 1]! + r));
    d.data[i + 2] = Math.max(0, Math.min(255, d.data[i + 2]! + r));
  }
  x.putImageData(d, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Fondo vertical degradado (cielo) como textura de escena. */
export function degradadoCielo(arriba: string, medio: string, abajo: string): THREE.CanvasTexture {
  const [c, x] = lienzo(8, 256);
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, arriba);
  g.addColorStop(0.55, medio);
  g.addColorStop(1, abajo);
  x.fillStyle = g;
  x.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Onda de ECG de 2 latidos, repetible en horizontal: se desplaza con `offset.x`. */
function dibujarEcg(color: string, plano = false): THREE.CanvasTexture {
  const [c, x] = lienzo(256, 96);
  x.fillStyle = '#04101a';
  x.fillRect(0, 0, 256, 96);
  x.strokeStyle = 'rgba(56,214,224,.10)';
  x.lineWidth = 1;
  for (let i = 0; i <= 256; i += 16) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, 96);
    x.stroke();
  }
  for (let j = 0; j <= 96; j += 16) {
    x.beginPath();
    x.moveTo(0, j);
    x.lineTo(256, j);
    x.stroke();
  }
  x.strokeStyle = color;
  x.lineWidth = 4;
  x.lineJoin = 'round';
  x.lineCap = 'round';
  x.shadowColor = color;
  x.shadowBlur = 8;
  x.beginPath();
  const base = 62;
  for (let latido = 0; latido < 2; latido++) {
    const o = latido * 128;
    if (plano) {
      x.moveTo(o, base);
      x.lineTo(o + 128, base);
      continue;
    }
    x.moveTo(o, base);
    x.lineTo(o + 22, base);
    x.quadraticCurveTo(o + 30, base - 12, o + 38, base); // onda P
    x.lineTo(o + 50, base);
    x.lineTo(o + 55, base + 8); // Q
    x.lineTo(o + 63, base - 52); // R
    x.lineTo(o + 71, base + 16); // S
    x.lineTo(o + 77, base);
    x.lineTo(o + 92, base);
    x.quadraticCurveTo(o + 104, base - 18, o + 116, base); // onda T
    x.lineTo(o + 128, base);
  }
  x.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export type TonoEcg = 'verde' | 'ambar' | 'rojo' | 'plano';

/** Las cuatro ondas base, compartidas por todos los monitores. */
export class BancoEcg {
  readonly texturas: Record<TonoEcg, THREE.CanvasTexture> = {
    verde: dibujarEcg('#3ddc97'),
    ambar: dibujarEcg('#ffc857'),
    rojo: dibujarEcg('#ff5d6c'),
    plano: dibujarEcg('#ff5d6c', true),
  };

  /** Avanza las ondas (los monitores de un mismo tono van en sincronía). */
  avanzar(dt: number): void {
    this.texturas.verde.offset.x = (this.texturas.verde.offset.x + dt * 0.5) % 1;
    this.texturas.ambar.offset.x = (this.texturas.ambar.offset.x + dt * 0.78) % 1;
    this.texturas.rojo.offset.x = (this.texturas.rojo.offset.x + dt * 1.25) % 1;
  }

  static tono(estabilidad: number): TonoEcg {
    if (estabilidad <= 0) return 'plano';
    if (estabilidad >= 60) return 'verde';
    if (estabilidad >= 35) return 'ambar';
    return 'rojo';
  }
}

/** Skyline nocturno con ventanas encendidas (plano de fondo tras las ventanas). */
export function texturaSkyline(): THREE.CanvasTexture {
  const [c, x] = lienzo(1024, 256);
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#0a1530');
  g.addColorStop(1, '#16284d');
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 256);
  let px = 0;
  while (px < 1024) {
    const w = 38 + Math.random() * 70;
    const h = 60 + Math.random() * 150;
    x.fillStyle = `rgb(${12 + Math.random() * 10}, ${20 + Math.random() * 14}, ${42 + Math.random() * 18})`;
    x.fillRect(px, 256 - h, w, h);
    for (let wy = 256 - h + 8; wy < 248; wy += 12) {
      for (let wx = px + 6; wx < px + w - 8; wx += 10) {
        if (Math.random() < 0.38) {
          x.fillStyle = Math.random() < 0.15 ? '#9ed7f2' : '#ffd98a';
          x.globalAlpha = 0.5 + Math.random() * 0.5;
          x.fillRect(wx, wy, 4, 6);
        }
      }
    }
    x.globalAlpha = 1;
    px += w + 2 + Math.random() * 8;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Fachada con ventanas para el hospital del exterior. */
export function texturaFachada(): THREE.CanvasTexture {
  const [c, x] = lienzo(512, 512);
  x.fillStyle = '#16233d';
  x.fillRect(0, 0, 512, 512);
  for (let fy = 14; fy < 500; fy += 32) {
    for (let fx = 14; fx < 500; fx += 32) {
      const enc = Math.random() < 0.3;
      x.fillStyle = enc ? (Math.random() < 0.25 ? '#7fb8d6' : '#d9b878') : '#0e1932';
      x.globalAlpha = enc ? 0.5 + Math.random() * 0.3 : 1;
      x.fillRect(fx, fy, 20, 16);
    }
  }
  x.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
