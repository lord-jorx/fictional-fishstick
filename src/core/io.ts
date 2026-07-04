/**
 * Puerto de entrada/salida del juego (patrón ports & adapters).
 *
 * El motor NUNCA habla con la terminal ni con el DOM directamente: todo pasa
 * por esta interfaz. Los textos pueden llevar códigos ANSI (ver ui/ansi.ts);
 * cada adaptador decide cómo renderizarlos (tal cual en terminal, convertidos
 * a HTML en el navegador).
 *
 * Adaptadores incluidos:
 *  - ui/ConsoleIO.ts  → terminal (readline + stdout)
 *  - web/WebIO.ts     → navegador (DOM, botones táctiles)
 */

export interface Opcion<T> {
  etiqueta: string;
  valor: T;
  /** Texto secundario, p. ej. el coste en tiempo. */
  detalle?: string;
  /**
   * Opción invisible: no se muestra ni se puede elegir a mano. En modo
   * tiempo real, el adaptador la dispara solo cuando ocurren novedades
   * (llegadas, avisos, fin de guardia) para refrescar el estado actual.
   */
  oculta?: boolean;
}

/** Fotografía del estado que el motor entrega en cada tick de tiempo real. */
export interface LatidoTiempoReal {
  avisos: string[];
  tablero: ComandaPaciente[];
  minuto: number;
  minutosRestantes: number;
  terminada: boolean;
}

/** Momentos visuales del juego, para adaptadores que sepan ilustrarlos. */
export type EscenaId = 'portada' | 'triaje' | 'paciente' | 'quirofano' | 'paso' | 'fin';

/** Una "comanda" del tablero de urgencias: paciente pendiente y su reloj vital. */
export interface ComandaPaciente {
  nombre: string;
  estabilidad: number;
  lugar: 'espera' | 'planta';
  alerta?: boolean;
}

/** Contexto de una escena (todo opcional: cada adaptador usa lo que sabe pintar). */
export interface EscenaDato {
  /** Estado del tablero de pacientes (para adaptadores tipo "comandas"). */
  tablero?: ComandaPaciente[];
  patologiaId?: string;
  pacienteId?: number;
  nombre?: string;
  edad?: number;
  estabilidad?: number;
  /** Zona del mapa corporal cuando la variante clínica la cambia. */
  zonaDolor?: string;
  /** Escena 'paso': etapa anatómica de la cirugía (1-based, sin contar imprevistos). */
  etapa?: number;
  totalEtapas?: number;
  /** Texto del evento del paso (para dibujar la complicación sobre el esquema). */
  evento?: string;
  /** true si el paso es una complicación imprevista (no avanza la etapa). */
  imprevisto?: boolean;
  /** Escena 'fin': puntuación final (para el expediente persistente del cirujano). */
  puntos?: number;
}

export interface IO {
  /** Escribe una línea (admite '\n' embebidos y códigos ANSI). */
  escribir(texto?: string): void;
  /** Muestra un menú y resuelve con el valor de la opción elegida. */
  elegir<T>(titulo: string, opciones: Opcion<T>[]): Promise<T>;
  /** Pausa hasta que el jugador confirme (Intro / botón). */
  pausa(mensaje?: string): Promise<void>;
  /** Fin de la partida: libera recursos (readline) o muestra el reinicio (web). */
  cerrar(): void;
  /**
   * Evento semántico opcional: "estamos en esta escena".
   * `dato` lleva contexto extra (paciente, patología...).
   * Los adaptadores de texto puro lo ignoran; el web pinta ilustraciones.
   */
  escena?(escena: EscenaId, dato?: EscenaDato): void;

  /**
   * Capacidad opcional de tiempo real: el adaptador que la implemente
   * llamará a `latido` una vez por segundo (= 1 minuto de guardia) mientras
   * el jugador delibera, pintará los avisos resultantes y disparará las
   * opciones ocultas de refresco cuando haya novedades. La terminal no la
   * implementa: allí la guardia sigue siendo por turnos.
   */
  iniciarTiempoReal?(latido: () => LatidoTiempoReal): void;
}
