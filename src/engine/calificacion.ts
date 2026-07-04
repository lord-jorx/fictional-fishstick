/**
 * Calificación del caso: cada expediente cerrado recibe de 1 a 5 estrellas,
 * al estilo de los grandes juegos de detectives. Se penaliza operar a
 * ciegas, pedir pruebas a voleo, tropezar en el interrogatorio y las
 * complicaciones en quirófano. Un éxitus nunca pasa de 1 estrella.
 */
import type { Paciente } from '../core/types.js';

export function calificarCaso(p: Paciente): number {
  if (p.estado === 'exitus') return 1;

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
