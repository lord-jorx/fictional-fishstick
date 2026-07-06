/**
 * El plano de urgencias: la fase de sala deja de ser una lista y pasa a
 * ser un servicio que se recorre. Tu muñequito con pijama camina hasta el
 * box que cliques (con pasos, balanceo y su coste en minutos); los
 * pacientes yacen en sus camillas retorciéndose según lo mal que estén.
 */
import type { ComandaPaciente } from '../core/io.js';

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
  const boxes = espera.slice(0, 5).map((p, i) => {
    const x = 2 + i * 16.4;
    const nuevo = acciones.recien?.has(p.nombre) ? ' recien' : '';
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
  <div class="celador">${CELADOR}</div>
  ${sofa}
  <div class="zona zona-cafe" data-boton="${acciones.cafe}"><span class="zona-icono">☕</span><span>CAFÉ</span></div>
  <div class="medico" style="left:47%;top:56%">${MUNECO_CIRUJANO}</div>`;
}
