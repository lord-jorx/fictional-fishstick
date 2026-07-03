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
}

/** Momentos visuales del juego, para adaptadores que sepan ilustrarlos. */
export type EscenaId = 'portada' | 'triaje' | 'paciente' | 'quirofano' | 'fin';

/** Contexto de una escena (todo opcional: cada adaptador usa lo que sabe pintar). */
export interface EscenaDato {
  patologiaId?: string;
  pacienteId?: number;
  nombre?: string;
  edad?: number;
  estabilidad?: number;
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
}
