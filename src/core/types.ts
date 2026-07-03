/**
 * Tipos de dominio compartidos por todo el juego.
 */

/** Pruebas diagnósticas disponibles en urgencias. */
export type PruebaId = 'analitica' | 'eco' | 'tc' | 'angiotc' | 'ecofast';

export interface PruebaDiagnostica {
  id: PruebaId;
  nombre: string;
  duracionMin: number;
}

/** Una opción dentro de un paso quirúrgico. */
export interface OpcionQuirurgica {
  texto: string;
  correcta: boolean;
  /** Qué ocurre al elegirla (se muestra al jugador). */
  resultado: string;
  /** Cambio de estabilidad del paciente al elegirla. */
  deltaEstabilidad: number;
  /** Cambio de estrés del cirujano al elegirla. */
  deltaEstres: number;
}

/** Un paso de la cirugía con su evento/complicación. */
export interface PasoQuirurgico {
  titulo: string;
  /** Descripción del evento o complicación que surge en este paso. */
  evento: string;
  opciones: OpcionQuirurgica[];
}

export interface PlanQuirurgico {
  nombre: string;
  duracionMin: number;
  pasos: PasoQuirurgico[];
}

export type ManejoCorrecto = 'cirugia' | 'conservador' | 'alta';

/** Definición estática de una patología (la "base de datos"). */
export interface Patologia {
  id: string;
  nombre: string;
  quirurgica: boolean;
  /** Lo que ve el jugador al recibir al paciente. */
  presentacion: {
    sintomas: string[];
    exploracion: string;
    constantes: string;
  };
  /** Prueba que confirma el diagnóstico. */
  pruebaDiana: PruebaId;
  /** Informe que devuelve la prueba diana. */
  hallazgoDiana: string;
  /** Informes (inespecíficos) del resto de pruebas. */
  hallazgosParciales: Partial<Record<PruebaId, string>>;
  /** Estabilidad que pierde el paciente por hora sin tratamiento definitivo. */
  deterioroPorHora: number;
  /** Rango [min, max] de estabilidad con la que llega el paciente. */
  estabilidadInicial: [number, number];
  manejoCorrecto: ManejoCorrecto;
  cirugia?: PlanQuirurgico;
  /** Perla clínica que se muestra al resolver el caso. */
  notaDocente: string;
  /** Peso relativo en la generación aleatoria (más peso = más frecuente). */
  frecuencia: number;
}

export type EstadoPaciente =
  | 'espera'      // en el box de urgencias, pendiente de decisión
  | 'ingresado'   // ingresado para tratamiento conservador / observación
  | 'alta'        // dado de alta
  | 'operado'     // intervenido con éxito, en planta
  | 'rea'         // intervenido, ocupa cama de reanimación
  | 'exitus';     // fallecido

export interface Paciente {
  id: number;
  nombre: string;
  edad: number;
  /** Constantes vitales generadas proceduralmente para ESTE paciente. */
  constantes: string;
  patologia: Patologia;
  /** 0-100. A 0, el paciente fallece. */
  estabilidad: number;
  /** Minuto de guardia en el que llegó. */
  minutoLlegada: number;
  estado: EstadoPaciente;
  pruebasRealizadas: PruebaId[];
  diagnosticoConfirmado: boolean;
  /** true si fue dado de alta siendo quirúrgico y ha vuelto en ambulancia. */
  reingresado: boolean;
  /** true si el equipo de planta ya ha avisado de que empeora. */
  alertaPlanta: boolean;
}

export interface Cirujano {
  /** 0-100. Baja con la actividad; con energía baja, tus manos fallan. */
  energia: number;
  /** 0-100. Sube con complicaciones; con estrés alto, tu juicio falla. */
  estres: number;
}

export interface Hospital {
  quirofanosLibres: number;
  quirofanosTotales: number;
  camasReaLibres: number;
  camasReaTotales: number;
}

/** Contadores para el informe de fin de guardia. */
export interface Estadisticas {
  atendidos: number;
  cirugiasRealizadas: number;
  cirugiasPerfectas: number;
  altasCorrectas: number;
  altasErroneas: number;
  ingresosCorrectos: number;
  ingresosErroneos: number;
  exitus: number;
  complicaciones: number;
}
