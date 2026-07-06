/**
 * El plano de urgencias: la fase de sala deja de ser una lista y pasa a
 * ser un servicio que se recorre. Tu muñequito con pijama camina hasta el
 * box que cliques (con pasos, balanceo y su coste en minutos); los
 * pacientes yacen en sus camillas retorciéndose según lo mal que estén.
 */
import type { ComandaPaciente } from '../core/io.js';
import { iconoHerramienta } from './quirofano.js';

/** El cirujano de pijama y gorro, de una pieza, listo para andar. */
export const MUNECO_CIRUJANO = `
<svg viewBox="0 0 30 48" width="30" height="48" aria-hidden="true">
  <g class="cuerpo-medico">
    <path d="M8 6 a7 7 0 0 1 14 0 l-1 3 h-12 z" fill="#4f7a63"/>
    <circle cx="15" cy="12" r="6.5" fill="#d9ab7f"/>
    <path d="M10 15 h10 v3 h-10 z" fill="#e8e2d2"/>
    <rect x="7" y="18" width="16" height="16" rx="4" fill="#5d8a72"/>
    <rect x="12" y="20" width="6" height="9" rx="2" fill="#4f7a63"/>
    <rect x="4" y="19" width="4" height="12" rx="2" fill="#5d8a72"/>
    <rect x="22" y="19" width="4" height="12" rx="2" fill="#5d8a72"/>
  </g>
  <rect class="p1" x="9" y="34" width="5" height="12" rx="2.4" fill="#3e6252"/>
  <rect class="p2" x="16" y="34" width="5" height="12" rx="2.4" fill="#3e6252"/>
</svg>`;

/** Paciente en su camilla, con manta y monitor de estado. */
export function munecoPaciente(estabilidad: number, alerta: boolean): string {
  const nivel = estabilidad >= 60 ? '#97b077' : estabilidad >= 35 ? '#d9b36a' : '#c9645a';
  const grave = estabilidad < 35;
  return `
<svg viewBox="0 0 64 40" class="paciente-svg${grave ? ' grave' : ''}" aria-hidden="true">
  <rect x="4" y="20" width="56" height="10" rx="3" fill="#6d6046"/>
  <rect x="8" y="30" width="4" height="8" fill="#4a4232"/><rect x="52" y="30" width="4" height="8" fill="#4a4232"/>
  <g class="cuerpo-paciente">
    <circle cx="14" cy="15" r="6" fill="#d9ab7f"/>
    <path d="M20 12 Q40 6 56 14 L56 22 Q38 16 20 20 Z" fill="#9fb4c4"/>
    <path d="M20 20 Q38 16 56 22" stroke="#7d94a6" stroke-width="1.4" fill="none"/>
  </g>
  <rect x="46" y="4" width="14" height="7" rx="2" fill="#0b0f14" stroke="#3b3223"/>
  <rect x="48" y="6" width="${Math.max(1, Math.round(estabilidad / 10))}" height="3" fill="${nivel}"/>
  ${alerta ? '<text x="4" y="9" font-size="9" fill="#d9b36a">⚠</text>' : ''}
</svg>`;
}

export interface AccionesMapa {
  cafe: number;
  descansar: number;
  ronda: number;
  /** Nombres de pacientes que acaban de llegar (animación desde la entrada). */
  recien?: Set<string>;
}

/** Celador que patrulla el servicio, a lo suyo. */
const CELADOR = `
<svg viewBox="0 0 26 42" width="22" height="36" aria-hidden="true">
  <circle cx="13" cy="9" r="5.5" fill="#c99b72"/>
  <path d="M8 5 a6 6 0 0 1 10 0 l-1 2 h-8 z" fill="#8a8f94"/>
  <rect x="6" y="15" width="14" height="14" rx="3.5" fill="#9aa1a8"/>
  <rect x="8" y="29" width="4" height="10" rx="2" fill="#6d7378"/>
  <rect x="14" y="29" width="4" height="10" rx="2" fill="#6d7378"/>
</svg>`;

/** El plano completo: boxes arriba, control/planta/café abajo. */
export function construirMapa(espera: ComandaPaciente[], acciones: AccionesMapa): string {
  let escolta = '';
  const boxes = espera.slice(0, 5).map((p, i) => {
    const x = 2 + i * 16.4;
    const nuevo = acciones.recien?.has(p.nombre) ? ' recien' : '';
    // El primer recién llegado viene escoltado: el celador empuja la
    // camilla desde la ambulancia hasta el box y se vuelve a lo suyo.
    if (nuevo && !escolta) {
      escolta = `<div class="celador escolta" style="--cx:${x + 4.5}%">${CELADOR}</div>`;
    }
    return `
    <div class="box${nuevo}" data-boton="${i}" style="left:${x}%" title="${p.nombre}">
      <span class="box-num">BOX ${i + 1}</span>
      ${munecoPaciente(p.estabilidad, !!p.alerta)}
      <span class="box-nombre">${p.nombre.split(' ')[0]}</span>
    </div>`;
  }).join('');

  const planta = acciones.ronda >= 0
    ? `<div class="zona zona-planta" data-boton="${acciones.ronda}"><span class="zona-icono">🛏</span><span>PLANTA</span></div>`
    : `<div class="zona zona-planta apagada"><span class="zona-icono">🛏</span><span>PLANTA</span></div>`;
  const sofa = acciones.descansar >= 0
    ? `<div class="zona zona-sofa" data-boton="${acciones.descansar}"><span class="zona-icono">💤</span><span>SOFÁ</span></div>`
    : '';

  return `
  ${boxes}
  <div class="zona zona-entrada"><span class="zona-icono">🚑</span><span>ENTRADA</span></div>
  ${planta}
  <div class="zona zona-quirofano"><span class="zona-icono">🔪</span><span>QUIRÓFANO</span></div>
  <div class="zona zona-control"><span class="zona-icono">🩺</span><span>CONTROL</span></div>
  ${escolta || `<div class="celador">${CELADOR}</div>`}
  ${sofa}
  <div class="zona zona-cafe" data-boton="${acciones.cafe}"><span class="zona-icono">☕</span><span>CAFÉ</span></div>
  <div class="medico" style="left:47%;top:56%">${MUNECO_CIRUJANO}</div>`;
}

/** Mesa de quirófano vista desde arriba: paciente entallado, campo abierto y lámpara. */
const MESA_QUIROFANO = `
<svg viewBox="0 0 160 70" aria-hidden="true">
  <ellipse cx="80" cy="30" rx="64" ry="22" fill="#f5edc9" opacity=".12"/>
  <ellipse cx="80" cy="30" rx="44" ry="14" fill="#f5edc9" opacity=".1"/>
  <rect x="22" y="18" width="116" height="28" rx="9" fill="#2b3f3a" stroke="#1c2b27" stroke-width="2"/>
  <rect x="30" y="22" width="100" height="20" rx="7" fill="#3c5a52"/>
  <circle cx="38" cy="32" r="7" fill="#d9ab7f"/>
  <path d="M33 27 a7 7 0 0 1 10 0 l-1 2 h-8 z" fill="#5d8a72"/>
  <ellipse cx="88" cy="32" rx="13" ry="7" fill="#c96b66" stroke="#8e4640" stroke-width="1.4"/>
  <ellipse cx="88" cy="32" rx="6" ry="3" fill="#a44743"/>
  <path d="M74 26 l-5 -4 M102 26 l5 -4" stroke="#cfd8e2" stroke-width="2"/>
  <rect x="20" y="46" width="8" height="12" fill="#1c2b27"/><rect x="132" y="46" width="8" height="12" fill="#1c2b27"/>
</svg>`;

/** Torre de anestesia con su traza latiendo. */
const TORRE_ANESTESIA = `
<svg viewBox="0 0 44 60" aria-hidden="true">
  <rect x="6" y="4" width="34" height="24" rx="3" fill="#0b1420" stroke="#33465f"/>
  <path class="traza-anestesia" d="M9 16 h7 l3 -8 3 14 3 -9 3 5 h11" stroke="#69c98f" stroke-width="1.8" fill="none"/>
  <rect x="10" y="30" width="26" height="22" rx="2" fill="#25303c" stroke="#33465f"/>
  <circle cx="16" cy="36" r="2" fill="#d9b36a"/><circle cx="24" cy="36" r="2" fill="#69c98f"/>
  <path d="M36 30 q8 6 4 16" stroke="#7d94a6" stroke-width="2" fill="none"/>
</svg>`;

/**
 * El plano del quirófano: la mesa en el centro y el instrumental repartido
 * en bandejas. Cada bandeja es una opción del menú de técnica: caminas (o
 * clicas) hasta ella para decidir cómo sigues la cirugía.
 */
export function construirQuirofano(etiquetas: string[]): string {
  const n = Math.max(1, etiquetas.length);
  const hueco = 96 / n;
  const ancho = Math.min(23, hueco - 1);
  const bandejas = etiquetas.map((texto, i) => {
    const x = 2 + i * hueco + (hueco - 1 - ancho) / 2;
    const corto = texto.length > 30 ? `${texto.slice(0, 28)}…` : texto;
    return `
    <div class="zona bandeja" data-boton="${i}" style="left:${x}%;width:${ancho}%" title="${texto}">
      <span class="bandeja-icono">${iconoHerramienta(texto)}</span>
      <span class="bandeja-texto">${corto}</span>
    </div>`;
  }).join('');

  return `
  <div class="mesa-quirofano">${MESA_QUIROFANO}</div>
  <div class="anestesia">${TORRE_ANESTESIA}</div>
  ${bandejas}
  <div class="medico" style="left:47%;top:6%">${MUNECO_CIRUJANO}</div>`;
}
