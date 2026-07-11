/**
 * La taquilla del cirujano: la meta-progresión roguelite.
 *
 * La XP se acumula guardia a guardia (la puntuación positiva de cada noche)
 * y desbloquea mejoras PERMANENTES que te acompañan en CUALQUIER modo de
 * juego. Es la zanahoria: sales derrotado, pero vuelves con algo nuevo.
 *
 * Fuente única de verdad, compartida por el motor (que aplica las mejoras)
 * y por los adaptadores (que las pintan en la taquilla y celebran las que
 * acabas de desbloquear).
 */

export interface Mejora {
  id: string;
  /** XP de carrera necesaria para desbloquearla. */
  xpMin: number;
  /** Nombre corto para la taquilla. */
  nombre: string;
  /** Qué hace, en una línea. */
  efecto: string;
  /** Emoji/icono para la ficha visual. */
  icono: string;
}

/** Las mejoras desbloqueables, en orden de coste creciente. */
export const MEJORAS: Mejora[] = [
  { id: 'termo', xpMin: 300, nombre: 'Termo del bueno', efecto: 'el café recupera el triple de energía', icono: '☕' },
  { id: 'ojo', xpMin: 800, nombre: 'Ojo clínico', efecto: 'todas las pruebas tardan 5 min menos', icono: '👁' },
  { id: 'busca', xpMin: 1500, nombre: 'El número del adjunto', efecto: '1 llamada de ayuda en quirófano, en cualquier modo', icono: '📟' },
  { id: 'equipo', xpMin: 2500, nombre: 'Equipo compenetrado', efecto: 'menos imprevistos intraoperatorios', icono: '🤝' },
  { id: 'templanza', xpMin: 4000, nombre: 'Templanza', efecto: 'empiezas cada guardia sin una gota de estrés', icono: '🧘' },
];

export interface Rango {
  xpMin: number;
  nombre: string;
}

/** Escalafón de la carrera, de menor a mayor. */
export const RANGOS: Rango[] = [
  { xpMin: 0, nombre: 'R1 con vocación' },
  { xpMin: 300, nombre: 'R3' },
  { xpMin: 800, nombre: 'R5' },
  { xpMin: 1500, nombre: 'Adjunto' },
  { xpMin: 2500, nombre: 'Adjunto senior' },
  { xpMin: 4000, nombre: 'Jefe de Servicio' },
  { xpMin: 6000, nombre: 'Leyenda de la guardia' },
];

/** Rango actual según la XP acumulada. */
export function rangoPorXp(xp: number): string {
  let actual = RANGOS[0]!.nombre;
  for (const r of RANGOS) if (xp >= r.xpMin) actual = r.nombre;
  return actual;
}

/** El siguiente rango y cuánta XP falta, o null si ya eres leyenda. */
export function proximoRango(xp: number): { nombre: string; faltan: number } | null {
  const siguiente = RANGOS.find((r) => r.xpMin > xp);
  return siguiente ? { nombre: siguiente.nombre, faltan: siguiente.xpMin - xp } : null;
}

/** Las mejoras que cruzan de bloqueadas a desbloqueadas al pasar de xpAntes a xpDespues. */
export function mejorasNuevas(xpAntes: number, xpDespues: number): Mejora[] {
  return MEJORAS.filter((m) => xpAntes < m.xpMin && xpDespues >= m.xpMin);
}
