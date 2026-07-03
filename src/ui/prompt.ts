/**
 * Entrada de usuario por consola: menús numerados sobre readline nativo.
 */
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { amarillo, gris, negrita } from './ansi.js';

const rl = readline.createInterface({ input: stdin, output: stdout });

rl.on('close', () => {
  // Stdin agotado (Ctrl+D o entrada por tubería terminada): fin limpio.
  console.log(gris('\n— Entrada finalizada. La guardia queda interrumpida. —'));
  process.exit(0);
});

export interface Opcion<T> {
  etiqueta: string;
  valor: T;
  /** Texto secundario en gris, p. ej. el coste en tiempo. */
  detalle?: string;
}

/** Muestra un menú numerado y devuelve el valor de la opción elegida. */
export async function elegir<T>(titulo: string, opciones: Opcion<T>[]): Promise<T> {
  console.log(`\n${negrita(titulo)}`);
  opciones.forEach((op, i) => {
    const detalle = op.detalle ? ` ${gris(`(${op.detalle})`)}` : '';
    console.log(`  ${amarillo(String(i + 1))}. ${op.etiqueta}${detalle}`);
  });

  for (;;) {
    const respuesta = (await rl.question(amarillo('> '))).trim();
    const n = Number.parseInt(respuesta, 10);
    if (Number.isInteger(n) && n >= 1 && n <= opciones.length) {
      return opciones[n - 1]!.valor;
    }
    console.log(gris(`Introduce un número entre 1 y ${opciones.length}.`));
  }
}

/** Pausa hasta que el jugador pulse Intro. */
export async function pausa(mensaje = 'Pulsa Intro para continuar...'): Promise<void> {
  await rl.question(gris(mensaje));
}

export function cerrarEntrada(): void {
  rl.removeAllListeners('close');
  rl.close();
}
