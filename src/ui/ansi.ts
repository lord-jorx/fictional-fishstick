/**
 * Mini-librería de estilos ANSI para no depender de chalk.
 * Se desactiva sola si la salida no es un TTY (p. ej. en CI).
 */

const habilitado = process.stdout.isTTY ?? false;

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

export function limpiarPantalla(): void {
  if (habilitado) process.stdout.write('\x1b[2J\x1b[H');
}
