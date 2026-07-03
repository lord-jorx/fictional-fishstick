/**
 * Adaptador IO para navegador: renderiza la salida del juego en un
 * "terminal" DOM y presenta los menús como botones táctiles.
 *
 * Los textos del motor llegan con códigos ANSI (ui/ansi.ts); aquí se
 * convierten a <span> con clases CSS. También se puede elegir opción
 * con las teclas 1-9.
 */
import type { IO, Opcion } from '../core/io.js';

const ESTILOS_ABRE: Record<number, string> = {
  1: 'b', 2: 'd', 3: 'i', 4: 'u', 7: 'inv',
  31: 'rojo', 32: 'verde', 33: 'amarillo', 34: 'azul',
  35: 'magenta', 36: 'cian', 90: 'gris', 41: 'fondo-rojo',
};

const ESTILOS_CIERRA: Record<number, string[]> = {
  22: ['b', 'd'],
  23: ['i'],
  24: ['u'],
  27: ['inv'],
  39: ['rojo', 'verde', 'amarillo', 'azul', 'magenta', 'cian', 'gris'],
  49: ['fondo-rojo'],
};

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Convierte una línea con códigos ANSI en HTML con spans de clase ansi-*. */
export function ansiAHtml(texto: string): string {
  let activos: string[] = [];
  let html = '';
  for (const parte of texto.split(/(\x1b\[\d+m)/)) {
    const codigo = parte.match(/^\x1b\[(\d+)m$/);
    if (codigo) {
      const n = Number(codigo[1]);
      const abre = ESTILOS_ABRE[n];
      const cierra = ESTILOS_CIERRA[n];
      if (abre) activos.push(abre);
      else if (cierra) activos = activos.filter((c) => !cierra.includes(c));
    } else if (parte) {
      const seguro = escaparHtml(parte);
      html += activos.length > 0
        ? `<span class="${activos.map((c) => `ansi-${c}`).join(' ')}">${seguro}</span>`
        : seguro;
    }
  }
  return html;
}

function sinAnsi(texto: string): string {
  return texto.replace(/\x1b\[\d+m/g, '');
}

export class WebIO implements IO {
  private readonly salida: HTMLElement;
  private readonly menu: HTMLElement;
  private teclado: ((ev: KeyboardEvent) => void) | null = null;

  constructor(raiz: HTMLElement) {
    this.salida = document.createElement('div');
    this.salida.id = 'salida';
    this.menu = document.createElement('div');
    this.menu.id = 'menu';
    raiz.append(this.salida, this.menu);
  }

  escribir(texto = ''): void {
    for (const linea of texto.split('\n')) {
      const div = document.createElement('div');
      div.className = 'linea';
      div.innerHTML = ansiAHtml(linea) || '&nbsp;';
      this.salida.appendChild(div);
    }
    this.desplazarAlFinal();
  }

  elegir<T>(titulo: string, opciones: Opcion<T>[]): Promise<T> {
    return new Promise((resolver) => {
      this.limpiarMenu();

      const cabecera = document.createElement('div');
      cabecera.className = 'menu-titulo';
      cabecera.innerHTML = ansiAHtml(titulo);
      this.menu.appendChild(cabecera);

      const botones: HTMLButtonElement[] = [];
      opciones.forEach((op, i) => {
        const boton = document.createElement('button');
        boton.className = 'opcion';
        const detalle = op.detalle ? `<span class="detalle">(${escaparHtml(op.detalle)})</span>` : '';
        boton.innerHTML = `<span class="num">${i + 1}</span><span class="texto">${ansiAHtml(op.etiqueta)} ${detalle}</span>`;
        boton.addEventListener('click', () => {
          this.escribir(`\x1b[90m> ${i + 1}. ${sinAnsi(op.etiqueta)}\x1b[39m`);
          this.limpiarMenu();
          resolver(op.valor);
        });
        this.menu.appendChild(boton);
        botones.push(boton);
      });

      // Teclas 1-9 como atajo de las primeras opciones.
      this.teclado = (ev) => {
        const n = Number.parseInt(ev.key, 10);
        if (Number.isInteger(n) && n >= 1 && n <= Math.min(9, botones.length)) {
          botones[n - 1]!.click();
        }
      };
      document.addEventListener('keydown', this.teclado);
      this.desplazarAlFinal();
    });
  }

  pausa(mensaje = 'Pulsa Intro para continuar...'): Promise<void> {
    const etiqueta = mensaje.includes('fichar')
      ? '▸ Fichar y empezar la guardia'
      : '▸ Continuar';
    return this.elegir(' ', [{ etiqueta, valor: undefined as void }]);
  }

  cerrar(): void {
    this.limpiarMenu();
    const boton = document.createElement('button');
    boton.className = 'opcion reinicio';
    boton.textContent = '⟳ Empezar una nueva guardia';
    boton.addEventListener('click', () => location.reload());
    this.menu.appendChild(boton);
    this.desplazarAlFinal();
  }

  // ────────────────────────────────────────────────────────────
  private limpiarMenu(): void {
    if (this.teclado) {
      document.removeEventListener('keydown', this.teclado);
      this.teclado = null;
    }
    this.menu.replaceChildren();
  }

  private desplazarAlFinal(): void {
    requestAnimationFrame(() => {
      this.salida.scrollTop = this.salida.scrollHeight;
    });
  }
}
