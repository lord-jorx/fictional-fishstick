/**
 * Adaptador IO para navegador: renderiza la salida del juego en un
 * "terminal" DOM y presenta los menús como botones táctiles.
 *
 * Los textos del motor llegan con códigos ANSI (ui/ansi.ts); aquí se
 * convierten a <span> con clases CSS. También se puede elegir opción
 * con las teclas 1-9.
 */
import type { ComandaPaciente, EscenaDato, EscenaId, IO, LatidoTiempoReal, Opcion } from '../core/io.js';
import { horaGuardia } from '../ui/hud.js';
import { esquemaQuirurgico } from './anatomia.js';
import { ARTE_AMANECER, ARTE_PORTADA, BANNER_QUIROFANO, cuerpoConDolor, SVG_AMBULANCIA } from './arte.js';
import { iconoHerramienta } from './quirofano.js';
import { retratoPaciente } from './retrato.js';
import { sonido } from './sonido.js';

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
  private readonly comandas: HTMLElement;
  private teclado: ((ev: KeyboardEvent) => void) | null = null;
  /** Refresco automático del menú pendiente (opción oculta), en tiempo real. */
  private autoRefresco: (() => void) | null = null;
  private ticker: number | null = null;

  constructor(raiz: HTMLElement) {
    this.salida = document.createElement('div');
    this.salida.id = 'salida';
    this.comandas = document.createElement('div');
    this.comandas.id = 'comandas';
    this.comandas.hidden = true;
    this.menu = document.createElement('div');
    this.menu.id = 'menu';
    raiz.append(this.salida, this.comandas, this.menu);
    sonido.conectarBoton(document.getElementById('silencio'));
  }

  escribir(texto = ''): void {
    for (const linea of texto.split('\n')) {
      const div = document.createElement('div');
      div.className = 'linea';
      div.innerHTML = ansiAHtml(linea) || '&nbsp;';
      this.salida.appendChild(div);

      const plano = sinAnsi(linea);
      if (plano.includes('🚑') || plano.includes('AMBULANCIA')) {
        this.animarAmbulancia();
        sonido.sirena();
      }
      if (plano.includes('✝')) {
        this.flashExitus();
        sonido.asistolia();
      }
      if (plano.includes('✔ Alta correcta') || plano.includes('✔ Ingreso correcto') || plano.includes('impecable')) {
        sonido.campanilla();
      }
    }
    this.desplazarAlFinal();
  }

  escena(escena: EscenaId, dato?: EscenaDato): void {
    switch (escena) {
      case 'portada': {
        this.insertarArte(ARTE_PORTADA, 'portada');
        const carrera = this.leerCarrera();
        if (carrera && carrera.guardias > 0) {
          this.insertarArte(
            `<div class="carrera">
               <div class="carrera-titulo">EXPEDIENTE DEL CIRUJANO</div>
               <div class="carrera-datos">
                 <span>${carrera.guardias} guardia${carrera.guardias === 1 ? '' : 's'}</span>
                 <span>mejor: ${carrera.mejor}</span>
                 <span>${carrera.xp} XP</span>
                 <span class="carrera-rango">${this.rango(carrera.xp)}</span>
               </div>
             </div>`,
            'carrera',
          );
        }
        break;
      }
      case 'paso': {
        const esquema = esquemaQuirurgico(
          dato?.patologiaId,
          dato?.etapa ?? 1,
          dato?.totalEtapas ?? 3,
          dato?.evento,
          dato?.imprevisto,
        );
        if (esquema) this.insertarArte(esquema, 'anatomia');
        break;
      }
      case 'paciente': {
        const retrato = dato ? retratoPaciente(dato) : '';
        const cuerpo = cuerpoConDolor(dato?.zonaDolor, dato?.patologiaId) ?? '';
        if (retrato || cuerpo) {
          this.insertarArte(`<div class="ficha-visual">${retrato}${cuerpo}</div>`, 'paciente');
        }
        break;
      }
      case 'quirofano':
        document.body.classList.add('en-quirofano');
        if (dato?.tablero) this.pintarComandas(dato.tablero);
        this.insertarArte(BANNER_QUIROFANO, 'quirofano');
        sonido.empezarLatido(640);
        break;
      case 'triaje':
        document.body.classList.remove('en-quirofano');
        sonido.pararLatido();
        this.pintarComandas(dato?.tablero ?? []);
        break;
      case 'fin':
        document.body.classList.remove('en-quirofano');
        sonido.pararLatido();
        if (dato?.puntos !== undefined) {
          // Segundo aviso de fin: llega la puntuación → expediente del cirujano.
          this.guardarCarrera(dato.puntos);
        } else {
          this.pintarComandas([]);
          this.insertarArte(ARTE_AMANECER, 'fin');
        }
        break;
    }
  }

  elegir<T>(titulo: string, opciones: Opcion<T>[]): Promise<T> {
    return new Promise((resolver) => {
      this.limpiarMenu();

      // En quirófano, las técnicas se eligen visualmente: tarjetas con el
      // icono del instrumental o la maniobra que describen.
      const visual =
        document.body.classList.contains('en-quirofano') && titulo.includes('Cómo procedes');
      if (visual) this.menu.classList.add('quirurgico');

      const cabecera = document.createElement('div');
      cabecera.className = 'menu-titulo';
      cabecera.innerHTML = ansiAHtml(titulo);
      this.menu.appendChild(cabecera);

      // La opción oculta no se pinta: queda armada para el tick de tiempo real.
      const oculta = opciones.find((op) => op.oculta);
      const visibles = opciones.filter((op) => !op.oculta);
      if (oculta) {
        this.autoRefresco = () => {
          this.limpiarMenu();
          resolver(oculta.valor);
        };
      }

      const botones: HTMLButtonElement[] = [];
      visibles.forEach((op, i) => {
        const boton = document.createElement('button');
        boton.className = visual ? 'opcion tarjeta' : 'opcion';
        const detalle = op.detalle ? `<span class="detalle">(${escaparHtml(op.detalle)})</span>` : '';
        const icono = visual ? `<span class="icono">${iconoHerramienta(sinAnsi(op.etiqueta))}</span>` : '';
        boton.innerHTML = `${icono}<span class="num">${i + 1}</span><span class="texto">${ansiAHtml(op.etiqueta)} ${detalle}</span>`;
        boton.addEventListener('click', () => {
          sonido.click();
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

  /** Modo tiempo real: 1 s de reloj = 1 min de guardia, aunque no toques nada. */
  iniciarTiempoReal(latido: () => LatidoTiempoReal): void {
    const chip = document.getElementById('reloj-vivo');
    if (chip) chip.hidden = false;

    this.ticker = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return; // pausa al ocultar pestaña
      const foto = latido();

      if (chip) {
        const h = Math.floor(foto.minutosRestantes / 60);
        const m = String(foto.minutosRestantes % 60).padStart(2, '0');
        chip.textContent = `🕐 ${horaGuardia(foto.minuto)} · quedan ${h}h ${m}m`;
        chip.classList.toggle('apurado', foto.minutosRestantes < 120);
      }
      this.pintarComandas(foto.tablero);

      for (const aviso of foto.avisos) this.escribir(aviso);
      if ((foto.avisos.length > 0 || foto.terminada) && this.autoRefresco) {
        const refrescar = this.autoRefresco;
        this.autoRefresco = null;
        refrescar();
      }
      if (foto.terminada && this.ticker !== null) {
        clearInterval(this.ticker);
        this.ticker = null;
      }
    }, 1000);
  }

  cerrar(): void {
    sonido.pararLatido();
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    this.limpiarMenu();
    const boton = document.createElement('button');
    boton.className = 'opcion reinicio';
    boton.textContent = '⟳ Empezar una nueva guardia';
    boton.addEventListener('click', () => location.reload());
    this.menu.appendChild(boton);
    this.desplazarAlFinal();
  }

  // ────────────────────────────────────────────────────────────
  /** Expediente persistente del cirujano (XP, rango, mejor guardia). */
  private leerCarrera(): { guardias: number; mejor: number; xp: number } | null {
    try {
      const crudo = localStorage.getItem('surgeons-night-carrera');
      return crudo ? JSON.parse(crudo) : null;
    } catch {
      return null;
    }
  }

  private guardarCarrera(puntos: number): void {
    try {
      const c = this.leerCarrera() ?? { guardias: 0, mejor: -Infinity, xp: 0 };
      c.guardias += 1;
      c.mejor = Math.max(c.mejor, puntos);
      c.xp += Math.max(0, puntos);
      localStorage.setItem('surgeons-night-carrera', JSON.stringify(c));
      this.escribir(
        `\x1b[90mExpediente actualizado: guardia nº ${c.guardias} · ${c.xp} XP · rango ${sinAnsi(this.rango(c.xp))}\x1b[39m`,
      );
    } catch { /* sin almacenamiento: la carrera no persiste, el juego sigue */ }
  }

  private rango(xp: number): string {
    if (xp >= 6000) return 'Leyenda de la guardia';
    if (xp >= 4000) return 'Jefe de Servicio';
    if (xp >= 2500) return 'Adjunto senior';
    if (xp >= 1500) return 'Adjunto';
    if (xp >= 800) return 'R5';
    if (xp >= 300) return 'R3';
    return 'R1 con vocación';
  }

  /** El rail de "comandas": cada paciente pendiente con su reloj vital. */
  private pintarComandas(tablero: ComandaPaciente[]): void {
    this.comandas.hidden = tablero.length === 0;
    this.comandas.replaceChildren();
    for (const c of tablero) {
      const nivel = c.estabilidad >= 60 ? 'bien' : c.estabilidad >= 35 ? 'regular' : 'critico';
      const tarjeta = document.createElement('div');
      tarjeta.className = `comanda ${nivel}${c.alerta ? ' alerta' : ''}`;
      tarjeta.innerHTML = `
        <div class="c-nombre">${escaparHtml(c.nombre.split(' ')[0] ?? c.nombre)}</div>
        <div class="c-barra"><div class="c-nivel" style="width:${Math.max(0, Math.min(100, Math.round(c.estabilidad)))}%"></div></div>
        <div class="c-lugar">${c.lugar === 'espera' ? '🚪 urgencias' : '🛏 planta'}${c.alerta ? ' ⚠' : ''}</div>`;
      this.comandas.appendChild(tarjeta);
    }
  }

  private insertarArte(html: string, clase: string): void {
    const figura = document.createElement('figure');
    figura.className = `escena escena-${clase}`;
    figura.innerHTML = html;
    this.salida.appendChild(figura);
    this.desplazarAlFinal();
  }

  /** La ambulancia cruza la pantalla como capa superpuesta (no altera el log). */
  private animarAmbulancia(): void {
    const capa = document.createElement('div');
    capa.className = 'ambulancia-capa';
    capa.innerHTML = SVG_AMBULANCIA;
    document.getElementById('app')?.appendChild(capa);
    const svg = capa.firstElementChild as SVGElement | null;
    svg?.addEventListener('animationend', () => capa.remove());
    setTimeout(() => capa.remove(), 4000); // red de seguridad
  }

  /** Destello rojo del terminal cuando fallece un paciente. */
  private flashExitus(): void {
    this.salida.classList.remove('flash-exitus');
    void this.salida.offsetWidth; // reinicia la animación
    this.salida.classList.add('flash-exitus');
  }

  private limpiarMenu(): void {
    if (this.teclado) {
      document.removeEventListener('keydown', this.teclado);
      this.teclado = null;
    }
    this.autoRefresco = null;
    this.menu.classList.remove('quirurgico');
    this.menu.replaceChildren();
  }

  private desplazarAlFinal(): void {
    requestAnimationFrame(() => {
      this.salida.scrollTop = this.salida.scrollHeight;
    });
  }
}
