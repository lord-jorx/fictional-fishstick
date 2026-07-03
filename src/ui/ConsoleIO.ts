/**
 * Adaptador IO para terminal: menús numerados sobre readline nativo.
 *
 * Las líneas recibidas se guardan en una cola en lugar de perderse cuando
 * no hay pregunta pendiente: así el juego funciona igual con un jugador
 * al teclado que con entrada por tubería (tests automatizados).
 */
import * as readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import type { IO, Opcion } from '../core/io.js';
import { amarillo, gris, negrita } from './ansi.js';

export class ConsoleIO implements IO {
  private readonly rl = readline.createInterface({ input: stdin, output: stdout });
  private readonly cola: string[] = [];
  private pendiente: ((linea: string) => void) | null = null;
  private cerrado = false;

  constructor() {
    this.rl.on('line', (linea) => {
      if (this.pendiente) {
        const resolver = this.pendiente;
        this.pendiente = null;
        resolver(linea);
      } else {
        this.cola.push(linea);
      }
    });

    this.rl.on('close', () => {
      this.cerrado = true;
      // Si hay una pregunta esperando y no quedan líneas, la partida no puede seguir.
      if (this.pendiente) this.abandonar();
    });
  }

  escribir(texto = ''): void {
    console.log(texto);
  }

  async elegir<T>(titulo: string, opciones: Opcion<T>[]): Promise<T> {
    this.escribir(`\n${negrita(titulo)}`);
    opciones.forEach((op, i) => {
      const detalle = op.detalle ? ` ${gris(`(${op.detalle})`)}` : '';
      this.escribir(`  ${amarillo(String(i + 1))}. ${op.etiqueta}${detalle}`);
    });

    for (;;) {
      const respuesta = (await this.preguntar(amarillo('> '))).trim();
      const n = Number.parseInt(respuesta, 10);
      if (Number.isInteger(n) && n >= 1 && n <= opciones.length) {
        return opciones[n - 1]!.valor;
      }
      this.escribir(gris(`Introduce un número entre 1 y ${opciones.length}.`));
    }
  }

  async pausa(mensaje = 'Pulsa Intro para continuar...'): Promise<void> {
    await this.preguntar(gris(mensaje));
  }

  cerrar(): void {
    this.rl.removeAllListeners('close');
    this.rl.close();
  }

  // ────────────────────────────────────────────────────────────
  private preguntar(prompt: string): Promise<string> {
    stdout.write(prompt);
    const enCola = this.cola.shift();
    if (enCola !== undefined) {
      stdout.write(`${enCola}\n`);
      return Promise.resolve(enCola);
    }
    if (this.cerrado) this.abandonar();
    return new Promise((resolver) => {
      this.pendiente = resolver;
    });
  }

  private abandonar(): never {
    console.log(gris('\n— Entrada finalizada. La guardia queda interrumpida. —'));
    process.exit(0);
  }
}
