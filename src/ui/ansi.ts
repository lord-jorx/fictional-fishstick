/**
 * Mini-librería de estilos ANSI para no depender de chalk.
 *
 * Es agnóstica del entorno: en terminal se autodetecta el TTY; el adaptador
 * web llama a configurarColores(true) y convierte los códigos a HTML.
 */

declare const process: { stdout?: { isTTY?: boolean } } | undefined;

let habilitado =
  typeof process !== 'undefined' && process !== null ? (process.stdout?.isTTY ?? false) : false;

/** Fuerza la emisión (o no) de códigos ANSI, ignorando la autodetección. */
export function configurarColores(activo: boolean): void {
  habilitado = activo;
}

const estilo =
  (abre: number, cierra: number) =>
  (texto: string): string =>
    habilitado ? `\x1b[${abre}m${texto}\x1b[${cierra}m` : texto;

export const negrita = estilo(1, 22);
export const tenue = estilo(2, 22);
export const cursiva = estilo(3, 23);
export const subrayado = estilo(4, 24);
export const inverso = estilo(7, 27);

export const rojo = estilo(31, 39);
export const verde = estilo(32, 39);
export const amarillo = estilo(33, 39);
export const azul = estilo(34, 39);
export const magenta = estilo(35, 39);
export const cian = estilo(36, 39);
export const gris = estilo(90, 39);

export const fondoRojo = estilo(41, 49);
