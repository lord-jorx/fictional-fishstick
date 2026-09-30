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
  neumotorax:      { tas: [78, 92],   tad: [48, 58], fc: [125, 140], sat: [82, 88], temp: [36.2, 36.8] },
  tce:             { tas: [148, 168], tad: [85, 98], fc: [48, 58],   sat: [96, 98], temp: [36.4, 36.9] },
  iam:             { tas: [92, 108],  tad: [58, 70], fc: [52, 64],   sat: [95, 97], temp: [36.0, 36.5] },
  neumonia:        { tas: [108, 128], tad: [66, 80], fc: [98, 112],  sat: [90, 94], temp: [38.2, 39.0] },
  hepatitis:       { tas: [108, 126], tad: [64, 78], fc: [90, 104],  sat: [96, 98], temp: [37.3, 37.9] },
  diverticulitis_leve: { tas: [116, 132], tad: [72, 84], fc: [82, 96], sat: [97, 99], temp: [37.6, 38.3] },
  cad:             { tas: [96, 110],  tad: [60, 72], fc: [110, 124], sat: [97, 99], temp: [36.8, 37.4] },
};

const NOMBRES_MUJER = [
  'Carmen Ruiz', 'Lucía Ferrer', 'Pilar Navarro', 'Elena Sanz',
  'Dolores Ibáñez', 'Marta Peña', 'Isabel Cano', 'Rosa Delgado',
  'Beatriz Vega', 'Nuria Campos',
];

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
  private elegirPatologia(candidatas: Patologia[] = this.catalogo): Patologia {
    const total = candidatas.reduce((suma, p) => suma + p.frecuencia, 0);
    let tirada = this.rng() * total;
    for (const patologia of candidatas) {
      tirada -= patologia.frecuencia;
      if (tirada <= 0) return patologia;
    }
    return candidatas[candidatas.length - 1]!;
  }

  /**
   * Saca `n` patologías distintas de un grupo, ponderadas por frecuencia y sin
   * reposición: en una misma guardia no se repite el diagnóstico (salvo que el
   * grupo se agote, y entonces se vuelve a llenar la bolsa).
   */
  private sacarDeLaBolsa(grupo: Patologia[], n: number): Patologia[] {
    const elegidas: Patologia[] = [];
    let bolsa = [...grupo];
    for (let i = 0; i < n; i++) {
      if (bolsa.length === 0) bolsa = [...grupo];
      const p = this.elegirPatologia(bolsa);
      bolsa.splice(bolsa.indexOf(p), 1);
      elegidas.push(p);
    }
    return elegidas;
  }

  private entre(min: number, max: number): number {
    return Math.round(min + this.rng() * (max - min));
  }

  private elegirNombre(patologiaId?: string): string {
    // El ectópico solo puede ser mujer: se sortea dentro del pool femenino.
    if (patologiaId === 'ectopico') {
      const candidatas = this.nombresRestantes.filter((n) => NOMBRES_MUJER.includes(n));
      const pool = candidatas.length > 0 ? candidatas : NOMBRES_MUJER;
      const nombre = pool[Math.floor(this.rng() * pool.length)]!;
      const i = this.nombresRestantes.indexOf(nombre);
      if (i >= 0) this.nombresRestantes.splice(i, 1);
      return nombre;
    }
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
    const RANGO_EDAD: Record<string, [number, number]> = {
      trauma: [18, 45], ectopico: [19, 40], volvulo: [72, 92], pielonefritis: [18, 55],
    };
    const [edadMin, edadMax] = RANGO_EDAD[patologia.id] ?? [25, 88];
    const edad = this.entre(edadMin, edadMax);
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
      nombre: this.elegirNombre(patologia.id),
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
   *
   * Una guardia real no es un desfile de abdómenes quirúrgicos: la mayoría de
   * lo que entra por la puerta se ingresa, se deriva o se manda a casa. El
   * reparto es ~35 % quirúrgico, ~35 % conservador/médico y el resto benigno,
   * sin repetir diagnóstico, y las llegadas se reparten a lo largo de la noche
   * (con más tráfico por la tarde) en vez de amontonarse.
   */
  generarLlegadasDeGuardia(): LlegadaProgramada[] {
    const total = Math.max(5, this.entre(8, 10) + this.pacientesExtra);
    const nQuirurgicos = Math.max(2, Math.round(total * 0.35));
    const nBenignos = Math.max(1, Math.round(total * 0.27));
    const nConservadores = Math.max(1, total - nQuirurgicos - nBenignos);

    const de = (manejo: (m: string) => boolean) => this.catalogo.filter((p) => manejo(p.manejoCorrecto));
    const casos: Patologia[] = [
      ...this.sacarDeLaBolsa(de((m) => m === 'cirugia'), nQuirurgicos),
      ...this.sacarDeLaBolsa(de((m) => m === 'conservador'), nConservadores),
      ...this.sacarDeLaBolsa(de((m) => m === 'alta'), nBenignos),
    ];
    // Barajar (Fisher-Yates con el rng de la partida).
    for (let i = casos.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [casos[i], casos[j]] = [casos[j]!, casos[i]!];
    }
    // El primero no es una urgencia vital: da tiempo a situarse.
    const k = casos.findIndex((p) => p.deterioroPorHora < 8);
    if (k > 0) [casos[0], casos[k]] = [casos[k]!, casos[0]!];

    // Tiempos: una franja por paciente, con sacudida; la tarde pesa más.
    const inicio = 8;
    const fin = 1230;
    const franja = (fin - inicio) / casos.length;
    const minutos = casos.map((_, i) => {
      const base = inicio + i * franja;
      return Math.round(base + (this.rng() - 0.2) * franja * 0.9);
    });
    minutos[0] = this.entre(3, 12);
    minutos.sort((a, b) => a - b);
    for (let i = 1; i < minutos.length; i++) {
      if (minutos[i]! - minutos[i - 1]! < 25) minutos[i] = minutos[i - 1]! + 25;
    }

    return casos.map((patologia, i) => ({
      minuto: minutos[i]!,
      paciente: this.crearPaciente(i === 0 ? 5 : minutos[i]!, patologia),
    }));
  }
}
