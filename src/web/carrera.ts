/**
 * Persistencia local de la carrera del cirujano (localStorage): XP, rango,
 * botín de talismán y tabla de la guardia del día. Si el almacenamiento no
 * está disponible, el juego sigue: simplemente no hay meta-progresión.
 */
import { mejorasNuevas, rangoPorXp, type Mejora } from '../data/mejoras.js';

const CLAVE = 'surgeons-night-carrera';
const CLAVE_DIARIO = 'surgeons-night-diario';

export interface Carrera {
  guardias: number;
  mejor: number;
  xp: number;
  talisman?: string;
}

export function leerCarrera(): Carrera | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Carrera) : null;
  } catch {
    return null;
  }
}

function escribir(c: Carrera): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(c));
  } catch {
    /* sin almacenamiento */
  }
}

export interface ProgresoGuardia {
  ganada: number;
  xp: number;
  guardias: number;
  rangoAntes: string;
  rangoAhora: string;
  nuevas: Mejora[];
}

/** Suma la guardia recién terminada a la carrera y devuelve qué ha cambiado. */
export function sumarGuardia(puntos: number): ProgresoGuardia {
  const c = leerCarrera() ?? { guardias: 0, mejor: -Infinity, xp: 0 };
  const xpAntes = c.xp;
  const ganada = Math.max(0, puntos);
  c.guardias += 1;
  c.mejor = Math.max(Number.isFinite(c.mejor) ? c.mejor : -Infinity, puntos);
  c.xp += ganada;
  escribir(c);
  return {
    ganada,
    xp: c.xp,
    guardias: c.guardias,
    rangoAntes: rangoPorXp(xpAntes),
    rangoAhora: rangoPorXp(c.xp),
    nuevas: mejorasNuevas(xpAntes, c.xp),
  };
}

export function cogerTalisman(): string | null {
  const c = leerCarrera();
  if (!c?.talisman) return null;
  const id = c.talisman;
  delete c.talisman;
  escribir(c);
  return id;
}

export function guardarTalisman(id: string): void {
  const c = leerCarrera() ?? { guardias: 0, mejor: -Infinity, xp: 0 };
  c.talisman = id;
  escribir(c);
}

/** Tabla local de la guardia del día: intentos de hoy, de mejor a peor. */
export function registrarDiario(fecha: string, puntos: number): number[] {
  try {
    const crudo = localStorage.getItem(CLAVE_DIARIO);
    let tabla: { fecha: string; intentos: number[] } = crudo ? JSON.parse(crudo) : { fecha, intentos: [] };
    if (tabla.fecha !== fecha) tabla = { fecha, intentos: [] };
    tabla.intentos.push(puntos);
    tabla.intentos.sort((a, b) => b - a);
    localStorage.setItem(CLAVE_DIARIO, JSON.stringify(tabla));
    return [...tabla.intentos];
  } catch {
    return [puntos];
  }
}
