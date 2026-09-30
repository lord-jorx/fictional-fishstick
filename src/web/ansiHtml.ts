/**
 * Conversión de los textos del motor (códigos ANSI de color/negrita) a HTML
 * con clases `ansi-*`. La interfaz 3D los usa para pintar etiquetas, notas
 * y partes sin tocar el motor, que sigue hablando en ANSI.
 */
const ABRE: Record<number, string> = {
  1: 'b', 2: 'd', 3: 'i', 4: 'u', 7: 'inv',
  31: 'rojo', 32: 'verde', 33: 'amarillo', 34: 'azul',
  35: 'magenta', 36: 'cian', 90: 'gris', 41: 'fondo-rojo',
};

const CIERRA: Record<number, string[]> = {
  22: ['b', 'd'],
  23: ['i'],
  24: ['u'],
  27: ['inv'],
  39: ['rojo', 'verde', 'amarillo', 'azul', 'magenta', 'cian', 'gris'],
  49: ['fondo-rojo'],
};

export function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Línea con códigos ANSI → HTML con spans de clase ansi-*. */
export function ansiAHtml(texto: string): string {
  let activos: string[] = [];
  let html = '';
  for (const parte of texto.split(/(\x1b\[\d+m)/)) {
    const codigo = parte.match(/^\x1b\[(\d+)m$/);
    if (codigo) {
      const n = Number(codigo[1]);
      const abre = ABRE[n];
      const cierra = CIERRA[n];
      if (abre) activos.push(abre);
      else if (cierra) activos = activos.filter((c) => !cierra.includes(c));
    } else if (parte) {
      const seguro = escaparHtml(parte);
      html += activos.length > 0 ? `<span class="${activos.map((c) => `ansi-${c}`).join(' ')}">${seguro}</span>` : seguro;
    }
  }
  return html;
}

export function sinAnsi(texto: string): string {
  return texto.replace(/\x1b\[\d+m/g, '');
}
