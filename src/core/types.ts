/**
 * Tipos de dominio compartidos por todo el juego.
 */

/** Pruebas diagnósticas disponibles en urgencias. */
export type PruebaId =
  | 'ecg'
  | 'ecofast'
  | 'rxtorax'
  | 'eco'
  | 'tccraneo'
  | 'analitica'
  | 'tc'
  | 'angiotc';

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

/** Respuestas posibles ante la declaración del paciente (estilo interrogatorio). */
export type RespuestaInterrogatorio = 'creer' | 'dudar' | 'mentira';

/**
 * El interrogatorio clínico: el paciente jura algo al llegar. Tú decides si
 * creerle, dudar o acusarle de mentir — y una acusación solo se sostiene si
 * llevas la prueba que lo desmonta. Acertar suelta información que acelera
 * el caso; fallar cierra al paciente en banda.
 */
export interface InterrogatorioClinico {
  afirmacion: string;
  correcta: RespuestaInterrogatorio;
  /** Si la respuesta correcta es 'mentira', esta prueba es la que lo desmonta. */
  pruebaClave?: PruebaId;
  /** Lo que confiesa si aciertas. */
  revelacion: string;
  /** Cómo se enroca si fallas. */
  cerrojo: string;
}

/**
 * Variante clínica de presentación: la misma patología puede debutar de
 * forma típica o esquiva. Las variantes se sortean por peso al generar el
 * caso; las difíciles pueden atenuar la clínica, cambiar dónde duele,
 * acelerar el deterioro o hacer que la prueba diana no sea concluyente
 * al primer intento.
 */
export interface VarianteClinica {
  id: string;
  peso: number;
  /** Solo puede tocarle a pacientes de 65 años o más. */
  soloMayores?: boolean;
  /** Rango de horas de evolución; se inserta en las plantillas como {horas}. */
  horas: [number, number];
  /** Plantillas de anamnesis (admiten {horas}). */
  sintomas: string[];
  exploracion: string;
  /** Zona del mapa corporal si difiere de la típica de la patología. */
  zonaDolor?: string;
  /** Probabilidad (0-1) de que la prueba diana salga dudosa la primera vez. */
  pruebaEsquiva?: number;
  /** Informe que devuelve la prueba diana cuando sale dudosa. */
  informeDudoso?: string;
  /** Multiplicador del deterioro por hora (1 = igual que la típica). */
  deterioroFactor?: number;
  /** Ajuste de la estabilidad inicial (negativo = llega peor). */
  estabilidadDelta?: number;
}

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
  | 'derivado'    // trasladado en ambulancia al centro de referencia
  | 'fugado'      // se marchó de la sala de espera sin ser visto
  | 'exitus';     // fallecido

/** Etiqueta de triaje de catástrofe (incidente de múltiples víctimas). */
export type EtiquetaTriaje = 'rojo' | 'amarillo' | 'verde' | 'negro';

export interface Paciente {
  id: number;
  nombre: string;
  edad: number;
  /** Constantes vitales generadas proceduralmente para ESTE paciente. */
  constantes: string;
  patologia: Patologia;
  /** Variante de presentación que le tocó (id, p. ej. 'tipica'). */
  varianteId: string;
  /** Anamnesis ya resuelta (plantillas rellenas con las horas de evolución). */
  sintomas: string[];
  exploracion: string;
  horasEvolucion: number;
  /** Deterioro efectivo por hora (base de la patología × factor de la variante). */
  deterioroPorHora: number;
  /** Zona del mapa corporal (si la variante la cambia). */
  zonaDolor?: string;
  /** true mientras la prueba diana vaya a salir dudosa al pedirla. */
  pruebaEsquiva: boolean;
  informeDudoso?: string;
  /** Apuntes que la ficha muestra al jugador (p. ej. "eco no concluyente"). */
  notasClinicas: string[];
  /** true cuando el interrogatorio quedó zanjado (acierto o fallo). */
  interrogado: boolean;
  interrogatorioAcertado?: boolean;
  /** Minutos de descuento en la próxima prueba (premio del interrogatorio). */
  descuentoPrueba: number;
  /** true si su cirugía salió impecable (para la calificación del caso). */
  cirugiaPerfecta?: boolean;
  /** Calificación final del caso, 1-5 estrellas (se fija al resolverlo). */
  estrellas?: number;
  /** Índice del cirujano que lleva el caso (cooperativo local). */
  cirujanoIdx?: number;
  /** true si la derivación fue el manejo correcto en este centro. */
  derivacionCorrecta?: boolean;
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
  /** Etiqueta asignada en el triaje de catástrofe (si llegó en un IMV). */
  etiquetaTriaje?: EtiquetaTriaje;
  /** true si se marchó de la sala sin ser visto (y puede volver peor). */
  seFue?: boolean;
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
  derivacionesCorrectas: number;
  derivacionesErroneas: number;
  /** Pacientes que se hartaron de esperar y se fueron sin ser vistos. */
  seFueronSinSerVistos: number;
  etiquetasImvCorrectas: number;
  etiquetasImvTotales: number;
}
