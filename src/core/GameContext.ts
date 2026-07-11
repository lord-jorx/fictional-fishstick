/**
 * GameContext: el estado mutable compartido de la guardia.
 *
 * Aquí vive el reloj, el cirujano, el hospital y los pacientes.
 * Los estados del juego (triaje, quirófano, resumen) leen y mutan
 * este contexto; el paso del tiempo SIEMPRE se canaliza por
 * `avanzarTiempo`, que es quien aplica deterioro, fatiga, llegadas
 * y liberación de recursos.
 */
import type { ComandaPaciente, IO, Rasgos } from './io.js';
import type { Cirujano, Estadisticas, Hospital, Paciente } from './types.js';

/** Frases de la supervisora de control cuando la sala se calienta. */
const FRASES_SUPERVISORA = [
  'Tengo {n} en la sala y dos preguntando cada cinco minutos. Tú sabrás el orden, pero que se note que hay orden.',
  'El de la silla tres lleva rato mirándome mal. O ves a alguien pronto o el próximo aviso no te lo doy yo, te lo da seguridad.',
  '{n} pendientes. No te digo cómo hacer tu trabajo; te digo cuántos te están esperando mientras lo haces.',
  'La sala está que arde. Y admisión pasa la encuesta de satisfacción a TODOS, también a los que se van.',
];

/** Un cirujano del equipo de guardia (1 en solitario, 2 en cooperativo local). */
export interface MiembroEquipo extends Cirujano {
  nombre: string;
  rasgos?: Rasgos;
}

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
  /** Guardia negra: atípicas al doble, hospital saturado, más complicaciones. */
  modoNegra = false;
  /** Noche de fiestas mayores: aluvión + IMV garantizado y mayor. */
  modoFestival = false;
  /** Nombre del centro y reglas de derivación del nivel elegido. */
  nombreHospital = 'Hospital General';
  derivables: string[] = [];
  pruebasNoDisponibles: string[] = [];
  /** Mejoras roguelite desbloqueadas por la carrera del cirujano. */
  mejoras = new Set<string>();
  /** Talismán de una noche (botín de la guardia anterior), o null. */
  talisman: string | null = null;
  /** Llamadas al adjunto disponibles en quirófano (solo modo residente). */
  consultasAdjunto = 3;

  /** Equipo de guardia; en solitario tiene un único miembro. */
  equipo: MiembroEquipo[] = [{ nombre: 'De guardia', energia: 100, estres: 10 }];
  /** Índice del cirujano que está actuando ahora mismo. */
  cirujanoActivo = 0;

  /** El cirujano activo (las mecánicas de fatiga/estrés operan sobre él). */
  get cirujano(): Cirujano {
    return this.equipo[this.cirujanoActivo] ?? this.equipo[0]!;
  }
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
    derivacionesCorrectas: 0,
    derivacionesErroneas: 0,
    cirugiasRealizadas: 0,
    cirugiasPerfectas: 0,
    altasCorrectas: 0,
    altasErroneas: 0,
    ingresosCorrectos: 0,
    ingresosErroneos: 0,
    exitus: 0,
    complicaciones: 0,
    seFueronSinSerVistos: 0,
    etiquetasImvCorrectas: 0,
    etiquetasImvTotales: 0,
  };

  /** Incidente de múltiples víctimas programado para esta guardia (si toca). */
  private imv: { minuto: number; victimas: Paciente[] } | null = null;
  /** Víctimas del IMV esperando su etiqueta de triaje en la puerta. */
  imvPendiente: Paciente[] | null = null;
  /** Paciente cuyo box está ocupando el jugador ahora mismo (no se fuga). */
  pacienteEnAtencion: Paciente | null = null;
  private ultimoAvisoSupervisora = -999;

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

  /** Programa el incidente de múltiples víctimas de la noche. */
  programarImv(minuto: number, victimas: Paciente[]): void {
    this.imv = { minuto, victimas };
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

  /** Fotografía del tablero de pacientes pendientes (para las "comandas"). */
  tablero(): ComandaPaciente[] {
    return [
      ...this.salaEspera.map((p) => ({
        nombre: p.nombre,
        estabilidad: p.estabilidad,
        lugar: 'espera' as const,
        alerta: p.reingresado || p.alertaPlanta,
      })),
      ...this.ingresados.map((p) => ({
        nombre: p.nombre,
        estabilidad: p.estabilidad,
        lugar: 'planta' as const,
      })),
    ];
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

      // ── Equipo: fatiga o descanso (la noche pasa para todos) ──
      for (const c of this.equipo) {
        if (opciones.descanso) {
          c.energia = Math.min(100, c.energia + dt * 0.6);
          c.estres = Math.max(0, c.estres - dt * 0.35);
        } else {
          c.energia = Math.max(0, c.energia - dt * 0.09);
        }
      }

      // ── Llegadas de pacientes ──
      while (this.llegadas.length > 0 && this.llegadas[0]!.minuto <= this.minuto) {
        const { paciente } = this.llegadas.shift()!;
        this.salaEspera.push(paciente);
        this.registrarPaciente(paciente);
        const etiqueta = paciente.reingresado
          ? paciente.seFue
            ? `⚠ AMBULANCIA: vuelve ${paciente.nombre} — se fue sin ser visto y ahora entra en camilla.`
            : `⚠ AMBULANCIA: vuelve ${paciente.nombre} (le diste el alta) — mucho peor que antes.`
          : `🚑 Llega un nuevo paciente a urgencias: ${paciente.nombre}, ${paciente.edad} años.`;
        avisos.push(etiqueta);
      }

      // ── Incidente de múltiples víctimas: suena el teléfono rojo ──
      if (this.imv && this.imv.minuto <= this.minuto) {
        this.imvPendiente = this.imv.victimas;
        this.imv = null;
        avisos.push(
          `🚨 LLAMADA DEL 061: atropello múltiple a la salida de un concierto. ${this.imvPendiente.length} víctimas en camino — 🚑 ambulancias en cascada. Te esperan en la puerta para el triaje.`,
        );
      }

      // ── Deterioro de los pacientes no tratados ──
      for (const p of this.salaEspera) {
        p.estabilidad -= p.deterioroPorHora * (dt / 60);
      }

      // ── La sala de espera se cansa: horas de espera y se van sin ser vistos ──
      for (const p of [...this.salaEspera]) {
        if (this.talisman === 'dana') break; // la supervisora te cubre esta noche
        if (p === this.pacienteEnAtencion || p.reingresado || p.etiquetaTriaje) continue;
        const esperaMin = this.minuto - p.minutoLlegada;
        const benigno = p.patologia.manejoCorrecto === 'alta';
        if (esperaMin < (benigno ? 120 : 180) || p.estabilidad < 62) continue;
        if (this.rng() >= (benigno ? 0.1 : 0.035) * (dt / 15)) continue;

        this.salaEspera.splice(this.salaEspera.indexOf(p), 1);
        this.stats.seFueronSinSerVistos++;
        p.seFue = true;
        const horas = (esperaMin / 60).toFixed(1).replace('.', ',');
        if (p.patologia.quirurgica) {
          // Se va con un abdomen que no perdona: volverá, y volverá peor.
          p.estado = 'espera';
          p.reingresado = true;
          p.estabilidad = Math.max(12, p.estabilidad - 25);
          this.programarLlegadas([
            { minuto: this.minuto + 120 + Math.floor(this.rng() * 180), paciente: p },
          ]);
        } else {
          p.estado = 'fugado';
        }
        avisos.push(
          `😤 ${p.nombre} se marcha sin ser visto tras ${horas} h de espera. Admisión toma nota para la encuesta de satisfacción.`,
        );
      }

      // ── La supervisora de control, cuando la sala se calienta ──
      if (
        this.salaEspera.length >= 4 &&
        this.minuto - this.ultimoAvisoSupervisora >= 90 &&
        this.rng() < 0.6
      ) {
        this.ultimoAvisoSupervisora = this.minuto;
        const frase = FRASES_SUPERVISORA[Math.floor(this.rng() * FRASES_SUPERVISORA.length)]!;
        avisos.push(`🩺 La supervisora, desde el control: «${frase.replace('{n}', String(this.salaEspera.length))}»`);
      }
      for (const p of this.ingresados) {
        if (p.patologia.quirurgica) {
          // Ingresar sin operar frena el deterioro, pero no lo detiene.
          p.estabilidad -= p.deterioroPorHora * 0.6 * (dt / 60);
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
