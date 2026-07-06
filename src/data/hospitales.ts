/**
 * Niveles de hospital, ordenados de menor a mayor complejidad (nivel 1 → 3):
 * los recursos mandan tanto como la clínica.
 *
 * En un comarcal no hay angio-TC de madrugada ni cirugía vascular ni
 * neurocirugía: parte del oficio es saber QUÉ NO puedes asumir y derivarlo
 * a tiempo. Ojo: derivar solo es correcto si el paciente puede sobrevivir
 * al traslado — una peritonitis séptica se opera donde está (control del
 * foco primero), aunque el hospital sea pequeño. En el de referencia no
 * hay excusas: todo se queda en casa.
 */
import type { PruebaId } from '../core/types.js';

export interface PerfilHospital {
  id: 'comarcal' | 'general' | 'referencia';
  nombre: string;
  descripcion: string;
  quirofanos: number;
  camasRea: number;
  pacientesExtra: number;
  /** Pruebas que este centro no tiene de guardia. */
  pruebasNoDisponibles: PruebaId[];
  /** Patologías cuya derivación al centro de referencia es el manejo correcto aquí. */
  derivables: string[];
}

export const HOSPITALES: PerfilHospital[] = [
  {
    id: 'comarcal',
    nombre: 'Hospital Comarcal (nivel 1)',
    descripcion: '1 quirófano, 1 REA, sin angio-TC nocturno; saber derivar es sobrevivir',
    quirofanos: 1,
    camasRea: 1,
    pacientesExtra: -2,
    pruebasNoDisponibles: ['angiotc'],
    derivables: ['isquemia', 'tce', 'iam'],
  },
  {
    id: 'general',
    nombre: 'Hospital General (nivel 2)',
    descripcion: '2 quirófanos, 3 REA, sin neurocirugía ni hemodinámica de guardia',
    quirofanos: 2,
    camasRea: 3,
    pacientesExtra: 0,
    pruebasNoDisponibles: [],
    derivables: ['tce', 'iam'],
  },
  {
    id: 'referencia',
    nombre: 'Hospital de Referencia (nivel 3)',
    descripcion: '3 quirófanos, 4 REA, de todo... y toda la provincia llamando a tu puerta',
    quirofanos: 3,
    camasRea: 4,
    pacientesExtra: 2,
    pruebasNoDisponibles: [],
    derivables: [],
  },
];
