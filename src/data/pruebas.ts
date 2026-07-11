/**
 * Catálogo de pruebas diagnósticas disponibles en urgencias,
 * ordenadas de la más rápida a la más lenta: en una guardia, el
 * tiempo de cada prueba es parte de la decisión de pedirla.
 */
import type { PruebaDiagnostica, PruebaId } from '../core/types.js';

export const PRUEBAS: Record<PruebaId, PruebaDiagnostica> = {
  ecg:       { id: 'ecg',       nombre: 'Electrocardiograma',                           duracionMin: 10 },
  ecofast:   { id: 'ecofast',   nombre: 'Eco-FAST',                                     duracionMin: 10 },
  gasometria:{ id: 'gasometria',nombre: 'Gasometría venosa',                            duracionMin: 15 },
  rxtorax:   { id: 'rxtorax',   nombre: 'Radiografía de tórax (bipedestación)',         duracionMin: 15 },
  orina:     { id: 'orina',     nombre: 'Sedimento de orina (y test de gestación)',     duracionMin: 20 },
  eco:       { id: 'eco',       nombre: 'Ecografía abdominal',                          duracionMin: 30 },
  tccraneo:  { id: 'tccraneo',  nombre: 'TC craneal sin contraste',                     duracionMin: 35 },
  analitica: { id: 'analitica', nombre: 'Analítica completa (hemograma, PCR, lactato)', duracionMin: 45 },
  tc:        { id: 'tc',        nombre: 'TC abdominal con contraste',                   duracionMin: 60 },
  angiotc:   { id: 'angiotc',   nombre: 'Angio-TC abdominal',                           duracionMin: 75 },
};

/** Informe genérico cuando la prueba no aporta nada para esa patología. */
export const INFORME_INESPECIFICO: Record<PruebaId, string> = {
  ecg: 'ECG: ritmo sinusal sin alteraciones agudas de la repolarización.',
  ecofast: 'Eco-FAST negativa: no se objetiva líquido libre.',
  gasometria: 'Gasometría venosa: pH 7,38, lactato 1,1 mmol/L, sin alteraciones metabólicas.',
  rxtorax: 'Rx tórax: sin neumoperitoneo, sin condensaciones ni derrame. Índice cardiotorácico normal.',
  orina: 'Sedimento de orina anodino. Test de gestación negativo.',
  eco: 'Ecografía sin hallazgos significativos. Gas interpuesto limita el estudio.',
  tccraneo: 'TC craneal: sin sangrado intra ni extraaxial, sin efecto masa. Línea media centrada.',
  analitica: 'Analítica sin alteraciones relevantes.',
  tc: 'TC sin hallazgos agudos relevantes.',
  angiotc: 'Angio-TC: ejes vasculares permeables, sin otros hallazgos.',
};
