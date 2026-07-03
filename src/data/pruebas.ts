/**
 * Catálogo de pruebas diagnósticas disponibles en urgencias.
 */
import type { PruebaDiagnostica, PruebaId } from '../core/types.js';

export const PRUEBAS: Record<PruebaId, PruebaDiagnostica> = {
  analitica: { id: 'analitica', nombre: 'Analítica completa (hemograma, PCR, lactato)', duracionMin: 45 },
  eco:       { id: 'eco',       nombre: 'Ecografía abdominal',                          duracionMin: 30 },
  tc:        { id: 'tc',        nombre: 'TC abdominal con contraste',                   duracionMin: 60 },
  angiotc:   { id: 'angiotc',   nombre: 'Angio-TC abdominal',                           duracionMin: 75 },
  ecofast:   { id: 'ecofast',   nombre: 'Eco-FAST',                                     duracionMin: 10 },
};

/** Informe genérico cuando la prueba no aporta nada para esa patología. */
export const INFORME_INESPECIFICO: Record<PruebaId, string> = {
  analitica: 'Analítica sin alteraciones relevantes.',
  eco: 'Ecografía sin hallazgos significativos. Gas interpuesto limita el estudio.',
  tc: 'TC sin hallazgos agudos relevantes.',
  angiotc: 'Angio-TC: ejes vasculares permeables, sin otros hallazgos.',
  ecofast: 'Eco-FAST negativa: no se objetiva líquido libre.',
};
