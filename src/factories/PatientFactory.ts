/**
 * PatientFactory: genera casos clínicos aleatorios.
 *
 * - Elige la patología con selección ponderada por frecuencia
 *   (las apendicitis abundan; las isquemias mesentéricas, por suerte, no).
 * - Genera el calendario de llegadas de toda la guardia, con más
 *   presión asistencial en la franja de tarde-noche.
 */
import type { LlegadaProgramada } from '../core/GameContext.js';
import type { Paciente, Patologia } from '../core/types.js';
import { PATOLOGIAS } from '../data/pathologies.js';

const NOMBRES = [
  'Manuel Ortega', 'Carmen Ruiz', 'Antonio Vidal', 'Lucía Ferrer',
  'José Andrade', 'Pilar Navarro', 'Ramón Castillo', 'Elena Sanz',
  'Francisco Mora', 'Dolores Ibáñez', 'Sergio Lozano', 'Marta Peña',
  'Andrés Roca', 'Isabel Cano', 'Javier Molina', 'Rosa Delgado',
  'Ángel Serrano', 'Beatriz Vega', 'Tomás Fuentes', 'Nuria Campos',
];

export class PatientFactory {
  private siguienteId = 1;
  private nombresRestantes: string[];

  constructor(
    private readonly rng: () => number,
    private readonly catalogo: Patologia[] = PATOLOGIAS,
  ) {
    this.nombresRestantes = [...NOMBRES];
  }

  /** Selección ponderada por la frecuencia de cada patología. */
  private elegirPatologia(): Patologia {
    const total = this.catalogo.reduce((suma, p) => suma + p.frecuencia, 0);
    let tirada = this.rng() * total;
    for (const patologia of this.catalogo) {
      tirada -= patologia.frecuencia;
      if (tirada <= 0) return patologia;
    }
    return this.catalogo[this.catalogo.length - 1]!;
  }

  private entre(min: number, max: number): number {
    return Math.round(min + this.rng() * (max - min));
  }

  private elegirNombre(): string {
    if (this.nombresRestantes.length === 0) this.nombresRestantes = [...NOMBRES];
    const i = Math.floor(this.rng() * this.nombresRestantes.length);
    return this.nombresRestantes.splice(i, 1)[0]!;
  }

  crearPaciente(minutoLlegada: number, patologia: Patologia = this.elegirPatologia()): Paciente {
    const [estMin, estMax] = patologia.estabilidadInicial;
    return {
      id: this.siguienteId++,
      nombre: this.elegirNombre(),
      edad: this.entre(patologia.id === 'trauma' ? 18 : 25, patologia.id === 'trauma' ? 45 : 88),
      patologia,
      estabilidad: this.entre(estMin, estMax),
      minutoLlegada,
      estado: 'espera',
      pruebasRealizadas: [],
      diagnosticoConfirmado: false,
      reingresado: false,
      alertaPlanta: false,
    };
  }

  /**
   * Genera las llegadas de las 24 h de guardia.
   * La franja 10:00-02:00 (minutos 120-1080) concentra la mayor presión.
   */
  generarLlegadasDeGuardia(): LlegadaProgramada[] {
    const llegadas: LlegadaProgramada[] = [];
    const numPacientes = this.entre(8, 11);

    // El primero llega casi al empezar, para arrancar con ritmo.
    llegadas.push({ minuto: this.entre(2, 10), paciente: this.crearPaciente(5) });

    for (let i = 1; i < numPacientes; i++) {
      // 70% de las llegadas caen en la franja de presión, 30% de madrugada.
      const minuto =
        this.rng() < 0.7 ? this.entre(30, 1080) : this.entre(1080, 1380);
      llegadas.push({ minuto, paciente: this.crearPaciente(minuto) });
    }

    llegadas.sort((a, b) => a.minuto - b.minuto);
    return llegadas;
  }
}
