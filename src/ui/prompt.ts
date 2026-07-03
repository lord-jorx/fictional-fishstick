/**
 * Entrada de usuario por consola: menús numerados sobre readline nativo.
 *
 * Las líneas recibidas se guardan en una cola en lugar de perderse cuando
 * no hay pregunta pendiente: así el juego funciona igual con un jugador
 * al teclado que con entrada por tubería (tests automatizados).
 */
import * as readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import { amarillo, gris, negrita } from './ansi.js';

const rl = readline.createInterface({ input: stdin, output: stdout });

const cola: string[] = [];
let pendiente: ((linea: string) => void) | null = null;
let cerrado = false;

rl.on('line', (linea) => {
  if (pendiente) {
    const resolver = pendiente;
    pendiente = null;
    resolver(linea);
  } else {
    cola.push(linea);
  }
});

rl.on('close', () => {
  cerrado = true;
  // Si hay una pregunta esperando y no quedan líneas, la partida no puede seguir.
  if (pendiente) {
    console.log(gris('\n— Entrada finalizada. La guardia queda interrumpida. —'));
    process.exit(0);
  }
});

function preguntar(prompt: string): Promise<string> {
  stdout.write(prompt);
  const enCola = cola.shift();
  if (enCola !== undefined) {
    stdout.write(`${enCola}\n`);
    return Promise.resolve(enCola);
  }
  if (cerrado) {
    console.log(gris('\n— Entrada finalizada. La guardia queda interrumpida. —'));
    process.exit(0);
  }
  return new Promise((resolver) => {
    pendiente = resolver;
  });
}

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
    const respuesta = (await preguntar(amarillo('> '))).trim();
    const n = Number.parseInt(respuesta, 10);
    if (Number.isInteger(n) && n >= 1 && n <= opciones.length) {
      return opciones[n - 1]!.valor;
    }
    console.log(gris(`Introduce un número entre 1 y ${opciones.length}.`));
  }
}

/** Pausa hasta que el jugador pulse Intro. */
export async function pausa(mensaje = 'Pulsa Intro para continuar...'): Promise<void> {
  await preguntar(gris(mensaje));
}

export function cerrarEntrada(): void {
  rl.removeAllListeners('close');
  rl.close();
}
