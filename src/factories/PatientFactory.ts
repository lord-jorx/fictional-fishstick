/**
 * PatientFactory: genera casos clínicos aleatorios.
 *
 * - Elige la patología con selección ponderada por frecuencia
 *   (las apendicitis abundan; las isquemias mesentéricas, por suerte, no).
 * - Genera el calendario de llegadas de toda la guardia, con más
 *   presión asistencial en la franja de tarde-noche.
 */
import type { LlegadaProgramada } from '../core/GameContext.js';
import type { Paciente, Patologia, VarianteClinica } from '../core/types.js';
import { PATOLOGIAS } from '../data/pathologies.js';
import { VARIANTES } from '../data/variantes.js';

/**
 * Rangos de constantes vitales por patología. Cada paciente recibe unos
 * valores propios dentro del rango clínicamente plausible de su cuadro;
 * si salen fuera de umbral, se añade la alerta correspondiente.
 */
interface PerfilVitales {
  tas: [number, number];
  tad: [number, number];
  fc: [number, number];
  sat: [number, number];
  temp: [number, number];
  irregular?: boolean;
}

const VITALES: Record<string, PerfilVitales> = {
  apendicitis:     { tas: [115, 135], tad: [70, 85], fc: [85, 100],  sat: [97, 99], temp: [37.4, 38.2] },
  colecistitis:    { tas: [120, 140], tad: [75, 88], fc: [90, 105],  sat: [96, 99], temp: [38.0, 38.9] },
  obstruccion:     { tas: [100, 120], tad: [62, 78], fc: [100, 115], sat: [95, 98], temp: [37.2, 38.0] },
  diverticulitis:  { tas: [86, 105],  tad: [55, 68], fc: [110, 126], sat: [94, 97], temp: [38.5, 39.4] },
  isquemia:        { tas: [95, 115],  tad: [60, 72], fc: [115, 132], sat: [95, 98], temp: [36.5, 37.2], irregular: true },
  trauma:          { tas: [78, 95],   tad: [48, 60], fc: [118, 136], sat: [93, 96], temp: [35.8, 36.5] },
  ulcus:           { tas: [105, 125], tad: [68, 80], fc: [95, 112],  sat: [96, 98], temp: [37.1, 37.9] },
  hernia:          { tas: [112, 130], tad: [70, 84], fc: [95, 110],  sat: [96, 99], temp: [37.4, 38.3] },
  pancreatitis:    { tas: [108, 128], tad: [65, 80], fc: [92, 108],  sat: [94, 97], temp: [37.1, 38.0] },
  gastroenteritis: { tas: [110, 125], tad: [70, 82], fc: [80, 95],   sat: [98, 99], temp: [36.9, 37.6] },
  colico_biliar:   { tas: [115, 130], tad: [72, 85], fc: [70, 85],   sat: [98, 99], temp: [36.5, 37.0] },
  colico_renal:    { tas: [125, 145], tad: [78, 90], fc: [85, 100],  sat: [98, 99], temp: [36.5, 37.1] },
};

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

  /**
   * @param atipicidad multiplicador del peso de las variantes difíciles:
   *   1 = frecuencia completa (modo adjunto), 0.5 = la mitad (residente).
   */
  constructor(
    private readonly rng: () => number,
    private readonly atipicidad = 1,
    private readonly pacientesExtra = 0,
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

  /** Genera constantes vitales propias del paciente a partir del perfil del cuadro. */
  private generarConstantes(patologia: Patologia): string {
    const perfil = VITALES[patologia.id];
    if (!perfil) return patologia.presentacion.constantes;

    const tas = this.entre(...perfil.tas);
    const tad = this.entre(...perfil.tad);
    const fc = this.entre(...perfil.fc);
    const sat = this.entre(...perfil.sat);
    const temp = (perfil.temp[0] + this.rng() * (perfil.temp[1] - perfil.temp[0]))
      .toFixed(1)
      .replace('.', ',');

    const alertas: string[] = [];
    if (tas < 90) alertas.push('hipotenso');
    if (fc > 120) alertas.push('taquicárdico');
    const nota = alertas.length > 0 ? ` — ¡${alertas.join(' y ')}!` : '';
    const ritmo = perfil.irregular ? ' irregular' : '';

    return `TA ${tas}/${tad}, FC ${fc}${ritmo}, Sat ${sat}%, Tª ${temp} °C${nota}`;
  }

  /** Sortea la variante de presentación (ponderada, atenuada por atipicidad). */
  private elegirVariante(patologia: Patologia, edad: number): VarianteClinica {
    const candidatas = (VARIANTES[patologia.id] ?? []).filter(
      (v) => !v.soloMayores || edad >= 65,
    );
    if (candidatas.length === 0) {
      // Patología sin variantes definidas: presentación estática de la base de datos.
      return {
        id: 'tipica',
        peso: 1,
        horas: [6, 24],
        sintomas: patologia.presentacion.sintomas,
        exploracion: patologia.presentacion.exploracion,
      };
    }
    const peso = (v: VarianteClinica) => (v.id.startsWith('tipic') ? v.peso : v.peso * this.atipicidad);
    const total = candidatas.reduce((suma, v) => suma + peso(v), 0);
    let tirada = this.rng() * total;
    for (const v of candidatas) {
      tirada -= peso(v);
      if (tirada <= 0) return v;
    }
    return candidatas[0]!;
  }

  crearPaciente(minutoLlegada: number, patologia: Patologia = this.elegirPatologia()): Paciente {
    const edad = this.entre(patologia.id === 'trauma' ? 18 : 25, patologia.id === 'trauma' ? 45 : 88);
    const variante = this.elegirVariante(patologia, edad);

    const horas = this.entre(...variante.horas);
    const sintomas = variante.sintomas.map((s) => s.replace('{horas}', String(horas)));

    // Estabilidad: base de la patología + ajuste de la variante + castigo por
    // presentación tardía (por encima de la mediana del rango de la variante).
    const [estMin, estMax] = patologia.estabilidadInicial;
    const mediana = (variante.horas[0] + variante.horas[1]) / 2;
    const castigoTardio = horas > mediana ? -4 : 0;
    const estabilidad = Math.max(
      20,
      Math.min(95, this.entre(estMin, estMax) + (variante.estabilidadDelta ?? 0) + castigoTardio),
    );

    return {
      id: this.siguienteId++,
      nombre: this.elegirNombre(),
      edad,
      constantes: this.generarConstantes(patologia),
      patologia,
      varianteId: variante.id,
      sintomas,
      exploracion: variante.exploracion,
      horasEvolucion: horas,
      deterioroPorHora: patologia.deterioroPorHora * (variante.deterioroFactor ?? 1),
      zonaDolor: variante.zonaDolor,
      pruebaEsquiva: this.rng() < (variante.pruebaEsquiva ?? 0),
      informeDudoso: variante.informeDudoso,
      notasClinicas: [],
      interrogado: false,
      descuentoPrueba: 0,
      estabilidad,
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
    const numPacientes = this.entre(8, 11) + this.pacientesExtra;

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
