/**
 * Calificación del caso: cada expediente cerrado recibe de 1 a 5 estrellas,
 * al estilo de los grandes juegos de detectives. Se penaliza operar a
 * ciegas, pedir pruebas a voleo, tropezar en el interrogatorio y las
 * complicaciones en quirófano. Un éxitus nunca pasa de 1 estrella.
 */
import type { Paciente } from '../core/types.js';

export function calificarCaso(p: Paciente): number {
  if (p.estado === 'exitus') return 1;

  // Derivaciones: se juzga el criterio, no el diagnóstico completo (a veces
  // se deriva precisamente porque aquí no hay con qué confirmarlo).
  if (p.estado === 'derivado') {
    if (!p.derivacionCorrecta) return 2;
    let e = 5;
    if (p.pruebasRealizadas.length > 2) e--;
    if (p.interrogado && p.interrogatorioAcertado === false) e--;
    return Math.max(1, e);
  }

  let estrellas = 5;
  if (!p.diagnosticoConfirmado) estrellas--;
  if (p.pruebasRealizadas.length > 2) estrellas--;
  if (p.interrogado && p.interrogatorioAcertado === false) estrellas--;
  if (p.cirugiaPerfecta === false) estrellas--;
  if (p.reingresado) estrellas--; // le diste el alta y volvió en ambulancia

  return Math.max(1, Math.min(5, estrellas));
}

export function pintarEstrellas(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}
