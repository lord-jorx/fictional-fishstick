/**
 * GameContext: el estado mutable compartido de la guardia.
 *
 * Aquí vive el reloj, el cirujano, el hospital y los pacientes.
 * Los estados del juego (triaje, quirófano, resumen) leen y mutan
 * este contexto; el paso del tiempo SIEMPRE se canaliza por
 * `avanzarTiempo`, que es quien aplica deterioro, fatiga, llegadas
 * y liberación de recursos.
 */
import type { IO } from './io.js';
import type { Cirujano, Estadisticas, Hospital, Paciente } from './types.js';

/** PRNG determinista (mulberry32) para partidas reproducibles con --seed. */
export function crearRng(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LlegadaProgramada {
  minuto: number;
  paciente: Paciente;
}

interface CamaReaOcupada {
  paciente: Paciente;
  liberaEnMinuto: number;
}

interface OcupacionExternaQuirofano {
  desde: number;
  hasta: number;
  activa: boolean;
  motivo: string;
}

export interface OpcionesAvance {
  /** true si el tiempo pasa descansando (recupera energía en vez de gastarla). */
  descanso?: boolean;
}

export class GameContext {
  readonly duracionGuardia = 24 * 60;
  minuto = 0;

  /** Modo residente: un adjunto localizable te tutela durante la guardia. */
  modoResidente = false;
  /** Llamadas al adjunto disponibles en quirófano (solo modo residente). */
  consultasAdjunto = 3;

  readonly cirujano: Cirujano = { energia: 100, estres: 10 };
  readonly hospital: Hospital = {
    quirofanosLibres: 2,
    quirofanosTotales: 2,
    camasReaLibres: 3,
    camasReaTotales: 3,
  };

  /** Pacientes en urgencias pendientes de decisión. */
  readonly salaEspera: Paciente[] = [];
  /** Pacientes ingresados en observación / tratamiento conservador. */
  readonly ingresados: Paciente[] = [];
  /** Historial completo para el informe final. */
  readonly historial: Paciente[] = [];

  readonly stats: Estadisticas = {
    atendidos: 0,
    cirugiasRealizadas: 0,
    cirugiasPerfectas: 0,
    altasCorrectas: 0,
    altasErroneas: 0,
    ingresosCorrectos: 0,
    ingresosErroneos: 0,
    exitus: 0,
    complicaciones: 0,
  };

  /** Cola de llegadas pendientes, ordenada por minuto. */
  private llegadas: LlegadaProgramada[] = [];
  private camasRea: CamaReaOcupada[] = [];
  private ocupacionesExternas: OcupacionExternaQuirofano[] = [];

  constructor(
    public readonly rng: () => number,
    public readonly io: IO,
  ) {}

  programarLlegadas(llegadas: LlegadaProgramada[]): void {
    this.llegadas.push(...llegadas);
    this.llegadas.sort((a, b) => a.minuto - b.minuto);
  }

  /** El otro equipo de guardia ocupa un quirófano durante una franja. */
  programarOcupacionExterna(desde: number, hasta: number, motivo: string): void {
    this.ocupacionesExternas.push({ desde, hasta, activa: false, motivo });
  }

  registrarPaciente(p: Paciente): void {
    if (!this.historial.includes(p)) this.historial.push(p);
  }

  ocuparCamaRea(p: Paciente, minutosEstancia: number): void {
    this.hospital.camasReaLibres = Math.max(0, this.hospital.camasReaLibres - 1);
    this.camasRea.push({ paciente: p, liberaEnMinuto: this.minuto + minutosEstancia });
  }

  get guardiaTerminada(): boolean {
    return this.minuto >= this.duracionGuardia;
  }

  /** Minuto de la próxima llegada pendiente, o null si no quedan. */
  get proximaLlegada(): number | null {
    return this.llegadas.length > 0 ? this.llegadas[0]!.minuto : null;
  }

  /**
   * Avanza el reloj y aplica todas las consecuencias del paso del tiempo.
   * Devuelve los avisos que deben mostrarse al jugador.
   */
  avanzarTiempo(minutos: number, opciones: OpcionesAvance = {}): string[] {
    const avisos: string[] = [];
    const PASO = 15; // resolución interna en minutos
    let restante = minutos;

    while (restante > 0 && !this.guardiaTerminada) {
      const dt = Math.min(PASO, restante);
      restante -= dt;
      this.minuto += dt;

      // ── Cirujano: fatiga o descanso ──
      if (opciones.descanso) {
        this.cirujano.energia = Math.min(100, this.cirujano.energia + dt * 0.6);
        this.cirujano.estres = Math.max(0, this.cirujano.estres - dt * 0.35);
      } else {
        this.cirujano.energia = Math.max(0, this.cirujano.energia - dt * 0.09);
      }

      // ── Llegadas de pacientes ──
      while (this.llegadas.length > 0 && this.llegadas[0]!.minuto <= this.minuto) {
        const { paciente } = this.llegadas.shift()!;
        this.salaEspera.push(paciente);
        this.registrarPaciente(paciente);
        const etiqueta = paciente.reingresado
          ? `⚠ AMBULANCIA: vuelve ${paciente.nombre} (le diste el alta) — mucho peor que antes.`
          : `🚑 Llega un nuevo paciente a urgencias: ${paciente.nombre}, ${paciente.edad} años.`;
        avisos.push(etiqueta);
      }

      // ── Deterioro de los pacientes no tratados ──
      for (const p of this.salaEspera) {
        p.estabilidad -= p.patologia.deterioroPorHora * (dt / 60);
      }
      for (const p of this.ingresados) {
        if (p.patologia.quirurgica) {
          // Ingresar sin operar frena el deterioro, pero no lo detiene.
          p.estabilidad -= p.patologia.deterioroPorHora * 0.6 * (dt / 60);
          if (!p.alertaPlanta && p.estabilidad < 45) {
            p.alertaPlanta = true;
            avisos.push(`⚠ Llaman de planta: ${p.nombre} está empeorando. Vuelve a estar en tus manos.`);
          }
        }
      }
      // Los que empeoran en planta regresan a la lista de decisión.
      for (const p of this.ingresados.filter((x) => x.alertaPlanta)) {
        this.ingresados.splice(this.ingresados.indexOf(p), 1);
        this.salaEspera.push(p);
        p.estado = 'espera';
      }
      // Los no quirúrgicos ingresados se recuperan solos tras unas horas.
      for (const p of [...this.ingresados]) {
        if (!p.patologia.quirurgica && this.minuto - p.minutoLlegada > 180) {
          this.ingresados.splice(this.ingresados.indexOf(p), 1);
          p.estado = 'alta';
          avisos.push(`ℹ ${p.nombre} se recupera en observación y es dado de alta por el internista.`);
        }
      }

      // ── Fallecimientos ──
      for (const lista of [this.salaEspera, this.ingresados]) {
        for (const p of [...lista]) {
          if (p.estabilidad <= 0) {
            lista.splice(lista.indexOf(p), 1);
            p.estado = 'exitus';
            p.estabilidad = 0;
            this.stats.exitus++;
            this.cirujano.estres = Math.min(100, this.cirujano.estres + 20);
            avisos.push(`✝ ÉXITUS: ${p.nombre} fallece sin tratamiento definitivo (${p.patologia.nombre}).`);
          }
        }
      }

      // ── Camas de REA que se liberan ──
      for (const cama of [...this.camasRea]) {
        if (cama.liberaEnMinuto <= this.minuto) {
          this.camasRea.splice(this.camasRea.indexOf(cama), 1);
          this.hospital.camasReaLibres = Math.min(
            this.hospital.camasReaTotales,
            this.hospital.camasReaLibres + 1,
          );
          cama.paciente.estado = 'operado';
          avisos.push(`ℹ ${cama.paciente.nombre} sale de REA a planta. Se libera una cama.`);
        }
      }

      // ── Quirófanos ocupados por el otro equipo ──
      for (const oc of this.ocupacionesExternas) {
        if (!oc.activa && oc.desde <= this.minuto && oc.hasta > this.minuto) {
          if (this.hospital.quirofanosLibres > 0) {
            oc.activa = true;
            this.hospital.quirofanosLibres--;
            avisos.push(`ℹ El equipo de trauma ocupa un quirófano (${oc.motivo}).`);
          }
        } else if (oc.activa && oc.hasta <= this.minuto) {
          oc.activa = false;
          this.hospital.quirofanosLibres++;
          avisos.push('ℹ El equipo de trauma libera su quirófano.');
        }
      }
    }

    return avisos;
  }
}
