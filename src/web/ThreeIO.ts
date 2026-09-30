/**
 * ThreeIO: el adaptador del juego. Traduce lo que dice el motor clínico
 * (texto, menús, escenas y datos estructurados) a una experiencia gráfica:
 * un mundo 3D con Three.js y una interfaz de juego (HUD, historia clínica,
 * tarjetas de acciones, avisos) — sin terminal ni menús numerados.
 *
 * El motor sigue hablando por el puerto `IO`; aquí solo se decide cómo se ve.
 */
import type {
  ComandaPaciente,
  ContextoMenu,
  EscenaDato,
  EscenaId,
  EstadoHud,
  FichaClinica,
  IO,
  InformeFinal,
  LatidoTiempoReal,
  Opcion,
} from '../core/io.js';
import { MEJORAS, proximoRango, rangoPorXp, talismanPorId } from '../data/mejoras.js';
import { t, tr, u } from '../i18n.js';
import { esquemaQuirurgico } from './anatomia.js';
import { ansiAHtml, escaparHtml, sinAnsi } from './ansiHtml.js';
import { cuerpoConDolor, QUEJAS } from './arte.js';
import * as carrera from './carrera.js';
import { icono, iconoPorNombre } from './iconos.js';
import { iconoHerramienta } from './quirofano.js';
import { retratoDesdeRasgos, retratoPaciente } from './retrato.js';
import { sonido } from './sonido.js';
import { Mundo, type AccionMundo } from './three/mundo.js';
import { PELOS, PIELES } from './three/personajes.js';

type Vista = 'setup' | 'sala' | 'paciente' | 'quirofano' | 'puerta' | 'fin';
type Tono = 'ok' | 'aviso' | 'mal' | 'info';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

function parseConstantes(texto: string): Array<{ k: string; v: string; u: string; tono: Tono | '' }> {
  const out: Array<{ k: string; v: string; u: string; tono: Tono | '' }> = [];
  const ta = texto.match(/TA (\d+)\/(\d+)/);
  const fc = texto.match(/FC (\d+)/);
  const sat = texto.match(/Sat (\d+)/);
  const tt = texto.match(/Tª ([\d,.]+)/);
  if (ta) out.push({ k: 'TA', v: `${ta[1]}/${ta[2]}`, u: 'mmHg', tono: Number(ta[1]) < 90 ? 'mal' : Number(ta[1]) < 100 ? 'aviso' : '' });
  if (fc) {
    const n = Number(fc[1]);
    out.push({ k: 'FC', v: fc[1]!, u: 'lpm', tono: n > 120 || n < 50 ? 'mal' : n > 105 ? 'aviso' : '' });
  }
  if (sat) out.push({ k: 'SatO₂', v: sat[1]!, u: '%', tono: Number(sat[1]) < 92 ? 'mal' : Number(sat[1]) < 95 ? 'aviso' : '' });
  if (tt) {
    const n = Number(tt[1]!.replace(',', '.'));
    out.push({ k: 'Tª', v: tt[1]!, u: '°C', tono: n >= 38.5 ? 'mal' : n >= 37.8 ? 'aviso' : '' });
  }
  return out;
}

const NIVEL = (e: number) => (e >= 60 ? 'bien' : e >= 35 ? 'regular' : 'critico');

export class ThreeIO implements IO {
  private readonly raiz: HTMLElement;
  private readonly mundo: Mundo | null = null;

  private vista: Vista = 'setup';
  private decoracion = new Map<string, string>();
  private cadenaSetup: string[] = [];
  private partidaEmpezada = false;
  private buffer: string[] = [];
  private diarioLineas: string[] = [];
  private ultimoToast = { texto: '', t: 0 };

  private hudEstado: EstadoHud | null = null;
  private ultimoTablero: ComandaPaciente[] = [];
  private datoPaciente: EscenaDato | null = null;
  private fichaActual: FichaClinica | null = null;
  private pruebasVistas = 0;
  private pacienteVisto = '';
  private paso: EscenaDato | null = null;
  private informe: InformeFinal | null = null;
  private progreso: carrera.ProgresoGuardia | null = null;
  private intentosDiario: { fecha: string; intentos: number[]; puntos: number } | null = null;
  private botinPendiente: { opciones: Opcion<unknown>[]; resolver: (v: unknown) => void } | null = null;
  private informeMostrado = false;

  private autoRefresco: (() => void) | null = null;
  private teclado: ((e: KeyboardEvent) => void) | null = null;
  private ticker: number | null = null;
  private modoReal = false;

  constructor(raiz: HTMLElement) {
    this.raiz = raiz;
    raiz.innerHTML = `
      <div id="escena3d"><div id="etiquetas"></div></div>
      <div id="fundido"></div>
      <header id="hud">
        <div class="hud-marca">
          <svg class="cruz" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>
          <div><b>SURGEON'S NIGHT</b><small id="hud-hospital"></small></div>
        </div>
        <div class="hud-reloj">
          <span class="hora" id="hud-hora">08:00</span>
          <span class="resta" id="hud-resta"></span>
          <div class="progreso"><i id="hud-progreso" style="width:0%"></i></div>
        </div>
        <div class="hud-recursos" id="hud-recursos"></div>
        <div class="hud-equipo" id="hud-equipo"></div>
      </header>
      <div id="rastro"></div>
      <aside id="riel"></aside>
      <section id="panel-acciones" class="panel"></section>
      <section id="panel-ficha" class="panel"></section>
      <section id="panel-cirugia" class="panel"></section>
      <section id="panel-tecnicas"></section>
      <section id="panel-imv"></section>
      <div id="dock"></div>
      <div id="prompt"></div>
      <div id="resultado-q"></div>
      <div id="titulo-juego"></div>
      <section id="modal"></section>
      <section id="resolucion"></section>
      <section id="informe"></section>
      <div id="toasts"></div>
      <div id="botones-flotantes">
        <button id="btn-diario" type="button" aria-label="${t('uiDiario')}">${iconoPorNombre('diarioLista')}<span>${t('uiDiario')}</span></button>
        <button id="btn-sonido" type="button" aria-label="Sonido"></button>
      </div>
      <aside id="diario"><header><b>${t('uiDiario')}</b><button type="button" id="cerrar-diario" aria-label="Cerrar">${iconoPorNombre('cerrar')}</button></header><div id="diario-lineas"></div></aside>
      <div id="aviso-gl"></div>`;

    const params = new URLSearchParams(location.search);
    try {
      this.mundo = new Mundo(this.el('escena3d'), this.el('etiquetas'), {
        calidadBaja: params.has('bajo') || (navigator.hardwareConcurrency ?? 8) <= 2,
      });
      this.mundo.onCerca = (h) => {
        const p = this.el('prompt');
        if (h && this.vista === 'sala') {
          p.innerHTML = `<kbd>E</kbd> ${escaparHtml(h.etiqueta)}`;
          p.classList.add('visible');
        } else p.classList.remove('visible');
      };
      this.mundo.onPasos = () => sonido.pasos();
    } catch (e) {
      const a = this.el('aviso-gl');
      a.textContent = tr('Este navegador no puede iniciar gráficos 3D (WebGL). Prueba con Chrome, Edge, Firefox o Safari actualizados.');
      a.classList.add('visible');
      console.error(e);
    }

    this.botonSonido();
    this.el('btn-diario').addEventListener('click', () => this.el('diario').classList.toggle('abierto'));
    this.el('cerrar-diario').addEventListener('click', () => this.el('diario').classList.remove('abierto'));
    window.addEventListener('resize', () => this.ajustarMargenes());
    this.entrar('setup');
    this.pintarTitulo();
  }

  // ════════════════════════════════════════════════════════════
  // Utilidades de DOM
  // ════════════════════════════════════════════════════════════

  private el(id: string): HTMLElement {
    return this.raiz.querySelector<HTMLElement>(`#${id}`)!;
  }

  private botonSonido(): void {
    const b = this.el('btn-sonido') as HTMLButtonElement;
    const pintar = () => {
      b.innerHTML = iconoPorNombre(sonido.activo ? 'sonido' : 'mudo');
      b.title = tr(sonido.activo ? 'Silenciar' : 'Activar sonido');
    };
    pintar();
    b.addEventListener('click', () => {
      sonido.alternar();
      pintar();
    });
  }

  private entrar(v: Vista): void {
    this.vista = v;
    this.raiz.dataset['vista'] = v;
    this.ajustarMargenes();
  }

  private ajustarMargenes(): void {
    if (!this.mundo) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ancho = w >= 1020;
    switch (this.vista) {
      case 'setup': this.mundo.fijarMargen({ abajo: ancho ? h * 0.34 : h * 0.44 }); break;
      case 'sala': this.mundo.fijarMargen({ izq: ancho ? 230 : 0, abajo: 96, arr: 70 }); break;
      case 'paciente': this.mundo.fijarMargen(ancho ? { izq: 400, der: 450, arr: 70 } : { abajo: h * 0.56, arr: 60 }); break;
      case 'quirofano': this.mundo.fijarMargen(ancho ? { izq: 450, abajo: 230, arr: 70 } : { abajo: h * 0.52, arr: 60 }); break;
      case 'puerta': this.mundo.fijarMargen({ abajo: ancho ? 250 : h * 0.5, arr: 100 }); break;
      case 'fin': this.mundo.fijarMargen({ abajo: 0 }); break;
    }
  }

  private toast(texto: string, tono: Tono = 'info', ms = 4600): void {
    const ahora = performance.now();
    if (texto === this.ultimoToast.texto && ahora - this.ultimoToast.t < 2500) return;
    this.ultimoToast = { texto, t: ahora };
    const cont = this.el('toasts');
    while (cont.children.length >= 4) cont.firstElementChild?.remove();
    const d = document.createElement('div');
    d.className = `toast ${tono}`;
    d.innerHTML = `<span class="t-ico">${iconoPorNombre(tono === 'mal' ? 'alerta' : tono === 'ok' ? 'ok' : tono === 'aviso' ? 'alerta' : 'reloj')}</span><span>${escaparHtml(texto)}</span>`;
    cont.appendChild(d);
    window.setTimeout(() => d.classList.add('sale'), ms);
    window.setTimeout(() => d.remove(), ms + 500);
  }

  private limpiarTeclado(): void {
    if (this.teclado) {
      document.removeEventListener('keydown', this.teclado);
      this.teclado = null;
    }
  }

  private armarTeclado(n: number, elegirIndice: (i: number) => void): void {
    this.limpiarTeclado();
    this.teclado = (ev) => {
      const tag = (ev.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = Number.parseInt(ev.key, 10);
      if (Number.isInteger(k) && k >= 1 && k <= Math.min(9, n)) elegirIndice(k - 1);
    };
    document.addEventListener('keydown', this.teclado);
  }

  private ocultarPaneles(): void {
    for (const id of ['modal', 'resolucion', 'panel-tecnicas', 'panel-imv', 'dock', 'panel-acciones']) {
      this.el(id).classList.remove('visible');
    }
  }

  // ════════════════════════════════════════════════════════════
  // IO: texto
  // ════════════════════════════════════════════════════════════

  escribir(texto = ''): void {
    for (const linea of texto.split('\n')) {
      const plano = sinAnsi(linea);
      if (plano.trim() === '') continue;
      if (/^[─━\s]+$/.test(plano)) continue;
      this.buffer.push(linea);
      this.diarioLineas.push(linea);
      if (this.diarioLineas.length > 500) this.diarioLineas.shift();
      const d = document.createElement('div');
      d.className = 'dl';
      d.innerHTML = ansiAHtml(linea);
      const cont = this.el('diario-lineas');
      cont.appendChild(d);
      cont.scrollTop = cont.scrollHeight;
      this.reaccionar(plano.trim());
    }
  }

  /** Sonido y avisos según lo que cuenta el motor. */
  private reaccionar(p: string): void {
    const enJuego = this.vista !== 'setup' && this.vista !== 'fin';
    if (p.includes('🚑') || p.includes('AMBULANCIA')) {
      sonido.sirena();
      if (enJuego) this.toast(p.replace(/^[^\p{L}\p{N}]+/u, ''), 'info');
      return;
    }
    if (p.includes('✝')) {
      sonido.asistolia();
      this.mundo?.golpe(1.3);
      this.raiz.classList.remove('flash-exitus');
      void this.raiz.offsetWidth;
      this.raiz.classList.add('flash-exitus');
      if (enJuego) this.toast(p.replace(/^[^\p{L}\p{N}]+/u, ''), 'mal', 6500);
      return;
    }
    if (p.includes('✔ Alta correcta') || p.includes('✔ Ingreso correcto') || p.includes('impecable')) {
      sonido.campanilla();
      return;
    }
    if (this.vista === 'quirofano') {
      if (p.startsWith('✔') || p.startsWith('✖')) this.resultadoQuirofano(p);
      return;
    }
    if (!enJuego) return;
    if (p.startsWith('🚨')) this.toast(p.replace(/^🚨\s*/, ''), 'mal', 7000);
    else if (p.startsWith('😤')) this.toast(p.replace(/^😤\s*/, ''), 'aviso');
    else if (p.startsWith('🩺 La supervisora')) this.toast(p.replace(/^🩺\s*/, ''), 'aviso', 6500);
    else if (p.startsWith('⚠')) this.toast(p.replace(/^⚠\s*/, ''), 'aviso');
    else if (p.startsWith('ℹ')) this.toast(p.replace(/^ℹ\s*/, ''), 'info');
    else if (p.startsWith('☕')) this.toast(p.replace(/^☕\s*/, ''), 'ok', 3200);
  }

  private resultadoQuirofano(texto: string): void {
    const mal = texto.startsWith('✖');
    const b = this.el('resultado-q');
    b.className = `visible ${mal ? 'mal' : 'ok'}`;
    b.innerHTML = `<span class="r-ico">${iconoPorNombre(mal ? 'alerta' : 'ok')}</span><span>${escaparHtml(texto.replace(/^[✔✖]\s*/, ''))}</span>`;
    window.clearTimeout((b as unknown as { _t?: number })._t);
    (b as unknown as { _t?: number })._t = window.setTimeout(() => b.classList.remove('visible'), 6000);
    if (mal) this.mundo?.golpe(1);
  }

  // ════════════════════════════════════════════════════════════
  // IO: estado estructurado
  // ════════════════════════════════════════════════════════════

  hud(e: EstadoHud): void {
    this.hudEstado = e;
    this.el('hud-hospital').textContent = e.hospital;
    this.actualizarReloj(e.minuto, e.minutosRestantes, e.hora);
    const pill = (ico: string, valor: string, titulo: string, tono = '') =>
      `<span class="pill ${tono}" title="${escaparHtml(titulo)}">${iconoPorNombre(ico)}<b>${valor}</b></span>`;
    this.el('hud-recursos').innerHTML =
      pill('quirofano', `${e.quirofanosLibres}/${e.quirofanosTotales}`, t('quirofanos'), e.quirofanosLibres === 0 ? 'mal' : '') +
      pill('rea', `${e.reaLibres}/${e.reaTotales}`, t('camasRea'), e.reaLibres === 0 ? 'mal' : '') +
      pill('espera', String(e.enEspera), t('enEspera'), e.enEspera >= 4 ? 'aviso' : '');
    const meter = (ico: string, v: number, invertido: boolean, titulo: string) => {
      const n = Math.max(0, Math.min(100, Math.round(v)));
      const nivel = NIVEL(invertido ? 100 - n : n);
      return `<span class="meter-h ${nivel}" title="${escaparHtml(titulo)} ${n}%">${iconoPorNombre(ico)}<span class="meter"><i style="width:${n}%"></i></span></span>`;
    };
    this.el('hud-equipo').innerHTML = e.equipo
      .map(
        (c) =>
          `<div class="miembro${c.activo ? ' activo' : ''}">${e.equipo.length > 1 ? `<small>${escaparHtml(c.nombre)}</small>` : ''}${meter('energia', c.energia, false, t('energia'))}${meter('estres', c.estres, true, t('estres'))}</div>`,
      )
      .join('');
    if (this.mundo) {
      this.mundo.fijarHora(e.minuto);
      const idx = e.equipo.findIndex((c) => c.activo);
      this.mundo.fijarCirujanoActivo(Math.max(0, idx));
    }
  }

  private actualizarReloj(minuto: number, restantes: number, hora?: string): void {
    const h8 = (8 * 60 + minuto) % 1440;
    const hh = hora ?? `${String(Math.floor(h8 / 60)).padStart(2, '0')}:${String(h8 % 60).padStart(2, '0')}`;
    this.el('hud-hora').textContent = hh;
    this.el('hud-resta').textContent = `${t('quedan')} ${Math.floor(restantes / 60)} h ${String(restantes % 60).padStart(2, '0')} m`;
    (this.el('hud-progreso') as HTMLElement).style.width = `${Math.min(100, (minuto / 1440) * 100).toFixed(1)}%`;
    this.el('hud-hora').classList.toggle('apurado', restantes < 120);
  }

  ficha(f: FichaClinica): void {
    this.fichaActual = f;
    this.renderFicha(f);
  }

  // ════════════════════════════════════════════════════════════
  // IO: escenas
  // ════════════════════════════════════════════════════════════

  escena(id: EscenaId, dato?: EscenaDato): void {
    switch (id) {
      case 'portada': {
        this.cadenaSetup = [];
        this.partidaEmpezada = false;
        this.entrar('setup');
        this.mundo?.mostrar('exterior');
        this.pintarTitulo(true);
        break;
      }
      case 'taquilla':
        this.decoracion.set('taquilla', this.htmlTaquilla(dato?.xpCarrera ?? 0, dato?.talismanId));
        break;
      case 'editor':
        if (dato?.rasgos) {
          this.decoracion.set(
            'editor',
            `<div class="editor-vista">${retratoDesdeRasgos(dato.rasgos)}<div><small>${t('uiExpediente')}</small><b>${escaparHtml(dato.rasgos.nombre ?? '')}</b></div></div>`,
          );
        }
        break;
      case 'triaje': {
        this.partidaEmpezada = true;
        sonido.pararLatido();
        this.ultimoTablero = dato?.tablero ?? [];
        this.datoPaciente = null;
        this.fichaActual = null;
        this.pacienteVisto = '';
        this.entrar('sala');
        if (this.mundo) {
          if (this.mundo.vistaActual !== 'sala') this.mundo.mostrar('sala');
          this.mundo.enfocarPaciente(null);
          const espera = this.ultimoTablero.filter((c) => c.lugar === 'espera');
          this.mundo.actualizarSala(espera, this.ultimoTablero.filter((c) => c.lugar === 'planta').length);
        }
        this.ocultarPaneles();
        break;
      }
      case 'paciente': {
        this.datoPaciente = dato ?? null;
        this.pruebasVistas = 0;
        this.pacienteVisto = dato?.nombre ?? '';
        this.mundo?.enfocarPaciente(dato?.nombre ?? null);
        this.entrar('paciente');
        sonido.quejido();
        break;
      }
      case 'quirofano': {
        this.partidaEmpezada = true;
        this.entrar('quirofano');
        this.paso = null;
        this.mundo?.prepararQuirofano(dato?.estabilidad ?? 70);
        sonido.empezarLatido(640);
        this.pintarPanelCirugia(dato ?? {}, true);
        break;
      }
      case 'paso': {
        this.paso = dato ?? null;
        this.mundo?.estadoQuirofano(dato?.estabilidad ?? 70, !!dato?.imprevisto);
        this.pintarPanelCirugia(dato ?? {}, false);
        break;
      }
      case 'imv': {
        this.partidaEmpezada = true;
        this.entrar('puerta');
        this.mundo?.mostrarPuerta(dato?.victimasImv ?? []);
        break;
      }
      case 'fin': {
        if (dato?.informe) {
          this.informe = dato.informe;
        } else if (dato?.puntos !== undefined) {
          this.progreso = carrera.sumarGuardia(dato.puntos);
        } else {
          sonido.pararLatido();
          this.ocultarPaneles();
          this.entrar('fin');
          this.mundo?.mostrar('exterior', { amanecer: true });
        }
        break;
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // IO: elegir
  // ════════════════════════════════════════════════════════════

  elegir<T>(titulo: string, opciones: Opcion<T>[], contexto?: ContextoMenu): Promise<T> {
    return new Promise<T>((resolverOriginal) => {
      const visibles = opciones.filter((o) => !o.oculta);
      const oculta = opciones.find((o) => o.oculta);
      this.autoRefresco = null;
      this.limpiarTeclado();

      let resuelto = false;
      const resolver = (v: T) => {
        if (resuelto) return;
        resuelto = true;
        this.autoRefresco = null;
        this.limpiarTeclado();
        if (this.mundo) {
          this.mundo.controlActivo = false;
          this.el('prompt').classList.remove('visible');
        }
        this.buffer = [];
        resolverOriginal(v);
      };
      if (oculta) {
        this.autoRefresco = () => {
          this.ocultarPaneles();
          resolver(oculta.valor);
        };
      }
      const elegirIdx = (i: number) => {
        const op = visibles[i];
        if (!op) return;
        sonido.click();
        if (!this.partidaEmpezada) this.cadenaSetup.push(sinAnsi(tr(op.etiqueta)).replace(/\s*\(.*\)\s*$/, ''));
        resolver(op.valor);
      };

      switch (contexto) {
        case 'sala': return this.menuSala(visibles, resolver as (v: unknown) => void, elegirIdx);
        case 'paciente': return this.menuPaciente(titulo, visibles, elegirIdx);
        case 'tecnica': return this.menuTecnica(visibles, elegirIdx);
        case 'etiqueta': return this.menuEtiqueta(titulo, visibles, elegirIdx);
        case 'botin':
          this.botinPendiente = { opciones: visibles as Opcion<unknown>[], resolver: (v) => resolver(v as T) };
          this.renderInforme();
          return;
        default:
          this.menuGenerico(titulo, visibles, elegirIdx);
      }
    });
  }

  // ── Menú genérico (configuración de la partida) ──

  private menuGenerico(titulo: string, visibles: Opcion<unknown>[], elegirIdx: (i: number) => void): void {
    const modal = this.el('modal');
    const decor = [...this.decoracion.values()].join('');
    this.decoracion.clear();
    const chips = !this.partidaEmpezada && this.cadenaSetup.length > 0
      ? `<div class="chips-setup">${this.cadenaSetup.map((c) => `<span>${escaparHtml(tr(c))}</span>`).join('')}</div>`
      : '';
    const compacto = visibles.length > 4 || visibles.some((o) => /^(piel|pelo|idioma):/.test(o.clave ?? ''));
    const tarjetas = visibles
      .map((op, i) => {
        const c = op.clave ?? '';
        let lateral = `<span class="oc-ico">${icono(c)}</span>`;
        if (c.startsWith('piel:')) lateral = `<span class="muestra" style="background:${hex(PIELES[Number(c.slice(5))] ?? PIELES[0]!)}"></span>`;
        else if (c.startsWith('pelo:')) lateral = `<span class="muestra" style="background:${hex(PELOS[Number(c.slice(5))] ?? PELOS[0]!)}"></span>`;
        else if (c.startsWith('idioma:')) lateral = `<span class="oc-codigo">${c.slice(7).toUpperCase()}</span>`;
        else if (c.startsWith('hospital:')) {
          const nivel = c.endsWith('comarcal') ? 1 : c.endsWith('general') ? 2 : 3;
          lateral = `<span class="oc-nivel">N${nivel}</span>`;
        }
        const det = op.detalle ? `<small>${escaparHtml(tr(op.detalle))}</small>` : '';
        return `<button type="button" class="opcion-card${c.startsWith('idioma:') ? ' idioma' : ''}" data-i="${i}" style="--d:${i * 40}ms">${lateral}<span class="oc-txt"><b>${ansiAHtml(tr(op.etiqueta))}</b>${det}</span><kbd>${i + 1}</kbd></button>`;
      })
      .join('');
    modal.innerHTML = `
      <div class="modal-caja${compacto ? ' compacto' : ''}">
        ${chips}
        ${titulo.trim() ? `<h2>${ansiAHtml(tr(titulo))}</h2>` : ''}
        ${decor}
        <div class="opciones-grid">${tarjetas}</div>
      </div>`;
    modal.classList.add('visible');
    modal.querySelectorAll<HTMLButtonElement>('.opcion-card').forEach((b) =>
      b.addEventListener('click', () => {
        modal.classList.remove('visible');
        elegirIdx(Number(b.dataset['i']));
      }),
    );
    this.armarTeclado(visibles.length, (i) => {
      modal.classList.remove('visible');
      elegirIdx(i);
    });
    modal.querySelector<HTMLButtonElement>('.opcion-card')?.focus({ preventScroll: true });
  }

  // ── Sala: el mundo 3D es el menú ──

  private menuSala(visibles: Opcion<unknown>[], resolver: (v: unknown) => void, elegirIdx: (i: number) => void): void {
    this.entrar('sala');
    this.ocultarPaneles();
    const nombreAccion = (clave: string): string => {
      if (clave.startsWith('paciente:')) return `${t('uiAtender')} ${clave.slice(9).split(' ')[0]}`;
      if (clave === 'cafe') return t('cafe').replace(/ y despejarte| and reset| et se réveiller| i espavilar-te| und durchatmen|^Tomar un |^Fer un |^Grab a |^Prendre un |^Kaffee holen/i, '').trim() || t('cafe');
      if (clave === 'descansar') return t('descansar').replace(/ hasta que suene el busca| until the pager goes off| jusqu’au bip| fins que soni el busca|, bis der Pieper geht/i, '');
      return t('ronda');
    };
    const acciones: AccionMundo[] = [];
    for (const op of visibles) {
      const clave = op.clave ?? '';
      if (!clave) continue;
      acciones.push({
        id: clave,
        etiqueta: nombreAccion(clave),
        icono: clave.startsWith('paciente:') ? '' : icono(clave),
        activar: () => {
          sonido.click();
          resolver(op.valor);
        },
      });
    }
    this.mundo?.fijarAcciones(acciones);
    if (this.mundo) this.mundo.controlActivo = true;

    // Riel de pacientes
    const espera = this.ultimoTablero.filter((c) => c.lugar === 'espera');
    const planta = this.ultimoTablero.filter((c) => c.lugar === 'planta').length;
    const riel = this.el('riel');
    const pacientesOrden = visibles.filter((o) => o.clave?.startsWith('paciente:'));
    riel.innerHTML =
      `<div class="riel-tit">${iconoPorNombre('espera')}<b>${t('enEspera')}</b><span>${espera.length}</span></div>` +
      (espera.length === 0 ? `<p class="riel-vacio">${escaparHtml(t('salaCalma').replace(/ ¿Qué haces\?| Your move\?/, ''))}</p>` : '') +
      espera
        .map((c, i) => {
          const n = Math.max(2, Math.min(100, Math.round(c.estabilidad)));
          return `<button type="button" class="riel-card ${NIVEL(c.estabilidad)}${c.alerta ? ' alerta' : ''}" data-nombre="${escaparHtml(c.nombre)}" style="--d:${i * 50}ms">
            <kbd>${i + 1}</kbd>
            <span class="rc-txt"><b>${escaparHtml(c.nombre)}</b><small>${c.alerta ? '⚠ ' : ''}${t('urgenciasTag')}</small></span>
            <span class="meter"><i style="width:${n}%"></i></span>
          </button>`;
        })
        .join('') +
      (planta > 0 ? `<div class="riel-planta">${iconoPorNombre('ingreso')}<span>${planta} ${t('uiPlantaIngresados')}</span></div>` : '');
    riel.querySelectorAll<HTMLButtonElement>('.riel-card').forEach((b) =>
      b.addEventListener('click', () => this.mundo?.irYActivar(`paciente:${b.dataset['nombre']}`)),
    );

    // Dock: café, sofá, planta
    const dock = this.el('dock');
    const botones = visibles
      .map((op, i) => ({ op, i }))
      .filter(({ op }) => ['cafe', 'ronda', 'descansar'].includes(op.clave ?? ''));
    dock.innerHTML =
      botones
        .map(({ op }) => {
          const c = op.clave!;
          const nombre = nombreAccion(c);
          return `<button type="button" class="dock-btn" data-c="${c}">${icono(c)}<span><b>${escaparHtml(nombre)}</b>${op.detalle ? `<small>${escaparHtml(op.detalle.replace(' ☕', '').replace(' 💤', ''))}</small>` : ''}</span></button>`;
        })
        .join('') + `<span class="dock-ayuda">${t('uiControles')}</span>`;
    dock.querySelectorAll<HTMLButtonElement>('.dock-btn').forEach((b) =>
      b.addEventListener('click', () => this.mundo?.irYActivar(b.dataset['c']!)),
    );
    dock.classList.add('visible');

    // Atajos 1-9: los pacientes por orden
    this.armarTeclado(pacientesOrden.length, (i) => {
      const op = pacientesOrden[i];
      if (op?.clave) this.mundo?.irYActivar(op.clave);
    });
    void elegirIdx;
  }

  // ── Paciente: acciones agrupadas ──

  private menuPaciente(titulo: string, visibles: Opcion<unknown>[], elegirIdx: (i: number) => void): void {
    this.entrar('paciente');
    const panel = this.el('panel-acciones');
    const grupos: Array<{ id: string; titulo: string }> = [
      { id: 'valorar', titulo: t('uiValorar') },
      { id: 'pruebas', titulo: t('uiPruebas') },
      { id: 'decidir', titulo: t('uiDecidir') },
    ];
    const prefijoPrueba = t('solicitar').replace(/:$/, '');
    const boton = (op: Opcion<unknown>, i: number) => {
      const c = op.clave ?? '';
      let nombre = sinAnsi(op.etiqueta);
      if (c.startsWith('prueba:')) nombre = nombre.replace(new RegExp(`^${prefijoPrueba}\\s*`, 'i'), '');
      nombre = nombre.replace(/^(Dar de alta|Discharge)( con tratamiento ambulatorio| with outpatient treatment)?/, (m) => m);
      const det = op.detalle ? `<em>${escaparHtml(op.detalle)}</em>` : '';
      return `<button type="button" class="acc ${c.split(':')[0]}" data-i="${i}">${icono(c)}<span>${escaparHtml(nombre)}</span>${det}<kbd>${i + 1}</kbd></button>`;
    };
    const indexados = visibles.map((op, i) => ({ op, i }));
    const cuerpo = grupos
      .map((g) => {
        const items = indexados.filter(({ op }) => op.grupo === g.id);
        if (items.length === 0) return '';
        return `<div class="acc-grupo ${g.id}"><h4>${g.titulo}</h4><div class="acc-lista">${items.map(({ op, i }) => boton(op, i)).join('')}</div></div>`;
      })
      .join('');
    const extra = indexados.filter(({ op }) => !op.grupo);
    const nombrePac = titulo.replace(/^.*?\s(?=[A-ZÁÉÍÓÚ])/, '').replace(/\?$/, '');
    panel.innerHTML = `
      <header class="acc-cab"><small>${t('uiAtender')}</small><h3>${escaparHtml(this.fichaActual?.nombre ?? nombrePac)}</h3></header>
      ${cuerpo}
      <div class="acc-extra">${extra.map(({ op, i }) => boton(op, i)).join('')}</div>`;
    panel.classList.add('visible');
    panel.querySelectorAll<HTMLButtonElement>('.acc').forEach((b) =>
      b.addEventListener('click', () => {
        panel.classList.remove('visible');
        elegirIdx(Number(b.dataset['i']));
      }),
    );
    this.armarTeclado(visibles.length, (i) => {
      panel.classList.remove('visible');
      elegirIdx(i);
    });
  }

  // ── Quirófano: bandejas de técnicas ──

  private menuTecnica(visibles: Opcion<unknown>[], elegirIdx: (i: number) => void): void {
    this.entrar('quirofano');
    const panel = this.el('panel-tecnicas');
    const feedback = this.buffer.filter((l) => /^\s*[✔✖⚠🩺]/.test(sinAnsi(l)) || /adjunto/i.test(sinAnsi(l)));
    const tarjetas = visibles
      .map((op, i) => {
        const adj = op.clave === 'adjunto';
        const texto = sinAnsi(op.etiqueta);
        return `<button type="button" class="tecnica${adj ? ' adjunto' : ''}" data-i="${i}" style="--d:${i * 60}ms">
          <span class="t-icono">${adj ? icono('adjunto') : iconoHerramienta(texto)}</span>
          <span class="t-texto">${adj ? ansiAHtml(op.etiqueta.replace('📞 ', '')) : escaparHtml(texto)}</span>
          <kbd>${i + 1}</kbd>
        </button>`;
      })
      .join('');
    panel.innerHTML =
      (feedback.length > 0 ? `<div class="t-feedback">${feedback.map((l) => `<p>${ansiAHtml(l.trim())}</p>`).join('')}</div>` : '') +
      `<h4>${t('comoProcedes')}</h4><div class="t-fila">${tarjetas}</div>`;
    panel.classList.add('visible');
    panel.querySelectorAll<HTMLButtonElement>('.tecnica').forEach((b) =>
      b.addEventListener('click', () => {
        panel.classList.remove('visible');
        elegirIdx(Number(b.dataset['i']));
      }),
    );
    this.armarTeclado(visibles.length, (i) => {
      panel.classList.remove('visible');
      elegirIdx(i);
    });
  }

  // ── IMV: etiquetas de triaje ──

  private menuEtiqueta(titulo: string, visibles: Opcion<unknown>[], elegirIdx: (i: number) => void): void {
    this.entrar('puerta');
    const panel = this.el('panel-imv');
    const m = sinAnsi(titulo).match(/^Etiqueta para (.+?), (\d+) años — (.*)$/);
    const feedback = this.buffer.filter((l) => /[✔⚠✝]/.test(sinAnsi(l)) || /Fallece|Le coges/.test(sinAnsi(l)));
    const vit = m ? parseConstantes(m[3]!) : [];
    const tags = visibles
      .map((op, i) => {
        const c = op.clave ?? '';
        const [nombre, ...resto] = sinAnsi(op.etiqueta).split(' — ');
        return `<button type="button" class="tag ${c}" data-i="${i}"><b>${escaparHtml(nombre ?? '')}</b><small>${escaparHtml(resto.join(' — '))}</small><kbd>${i + 1}</kbd></button>`;
      })
      .join('');
    panel.innerHTML = `
      <div class="imv-cab"><span class="imv-alerta">${iconoPorNombre('alerta')} ${tr('INCIDENTE DE MÚLTIPLES VÍCTIMAS')}</span></div>
      ${feedback.length ? `<div class="t-feedback">${feedback.map((l) => `<p>${ansiAHtml(l.trim())}</p>`).join('')}</div>` : ''}
      <div class="imv-paciente">
        <div><small>${tr('Valoras a')}</small><h3>${escaparHtml(m?.[1] ?? '')}</h3><span>${m ? `${m[2]} ${u('pacientesLlegada')}` : ''}</span></div>
        <div class="vitales">${vit.map((v) => `<span class="vital ${v.tono}"><small>${v.k}</small><b>${v.v}</b><em>${v.u}</em></span>`).join('')}</div>
      </div>
      <div class="imv-tags">${tags}</div>`;
    panel.classList.add('visible');
    panel.querySelectorAll<HTMLButtonElement>('.tag').forEach((b) =>
      b.addEventListener('click', () => {
        panel.classList.remove('visible');
        elegirIdx(Number(b.dataset['i']));
      }),
    );
    this.armarTeclado(visibles.length, (i) => {
      panel.classList.remove('visible');
      elegirIdx(i);
    });
  }

  // ════════════════════════════════════════════════════════════
  // IO: pausa, texto libre, memoria y cierre
  // ════════════════════════════════════════════════════════════

  pausa(mensaje?: string): Promise<void> {
    const etiqueta = (mensaje ?? t('continuar'))
      .replace(/^(Pulsa Intro para|Press Enter to|Entrée pour|Appuyez sur Entrée|Prem Intro per|Eingabe drücken und|Weiter mit Eingabetaste)\s*/i, '')
      .replace(/\.\.\.$/, '')
      .trim();
    const texto = etiqueta ? etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) : t('uiContinuar');
    return new Promise<void>((resolver) => {
      this.limpiarTeclado();
      const lineas = this.buffer.slice();
      this.buffer = [];
      const fin = () => {
        this.el('resolucion').classList.remove('visible');
        this.el('modal').classList.remove('visible');
        this.limpiarTeclado();
        sonido.click();
        resolver();
      };
      if (!this.partidaEmpezada) {
        // Antes de fichar: resumen con la taquilla y el botón de empezar
        const modal = this.el('modal');
        const decor = [...this.decoracion.values()].join('');
        this.decoracion.clear();
        const chips = this.cadenaSetup.length > 0
          ? `<div class="chips-setup">${this.cadenaSetup.map((c) => `<span>${escaparHtml(tr(c))}</span>`).join('')}</div>`
          : '';
        modal.innerHTML = `<div class="modal-caja">${chips}${decor}<button type="button" class="gran-boton">${escaparHtml(texto)}${icono('continuar')}</button></div>`;
        modal.classList.add('visible');
        modal.querySelector('.gran-boton')!.addEventListener('click', fin);
        this.teclado = (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') fin();
        };
        document.addEventListener('keydown', this.teclado);
        return;
      }
      const cuerpo = this.formatearResolucion(lineas);
      const cab = this.vista === 'puerta' ? tr('Incidente de múltiples víctimas') : t('uiResolucion');
      const card = this.el('resolucion');
      card.innerHTML = `<div class="res-caja"><header><span class="res-kicker">${escaparHtml(cab)}</span></header>${cuerpo}<button type="button" class="gran-boton">${escaparHtml(texto)}${icono('continuar')}</button></div>`;
      card.classList.add('visible');
      card.querySelector('.gran-boton')!.addEventListener('click', fin);
      this.teclado = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          fin();
        }
      };
      document.addEventListener('keydown', this.teclado);
    });
  }

  /** Maqueta el texto de resolución: estrellas, perla docente, aciertos y fallos. */
  private formatearResolucion(lineas: string[]): string {
    const partes: string[] = [];
    for (const l of lineas) {
      const p = sinAnsi(l).trim();
      if (!p) continue;
      const est = p.match(/Calificación del caso:\s*(★+☆*)/);
      if (est) {
        const llenas = (est[1]!.match(/★/g) ?? []).length;
        partes.push(
          `<div class="res-estrellas" aria-label="${llenas} de 5">${Array.from({ length: 5 }, (_, i) => `<span class="${i < llenas ? 'on' : ''}">${iconoPorNombre('estrella')}</span>`).join('')}<small>${t('uiExpediente')}</small></div>`,
        );
        continue;
      }
      if (/^EXPEDIENTE CERRADO/.test(p)) continue;
      if (/^Perla docente/.test(p)) {
        partes.push(`<blockquote class="res-perla"><small>Perla docente</small>${escaparHtml(p.replace(/^Perla docente:\s*/, ''))}</blockquote>`);
        continue;
      }
      const clase = /^(✔|Cirugía impecable)/.test(p) ? 'ok' : /^(✖|✝|⚠)/.test(p) || /ÉXITUS/.test(p) ? 'mal' : /^(Entras|Derivas|Firmas|Ingresas)/.test(p) ? 'aviso' : '';
      partes.push(`<p class="res-l ${clase}">${ansiAHtml(l.trim())}</p>`);
    }
    return `<div class="res-cuerpo">${partes.join('') || `<p class="res-l">${t('uiContinuar')}</p>`}</div>`;
  }

  preguntarTexto(pregunta: string, porDefecto: string): Promise<string> {
    return new Promise((resolver) => {
      this.limpiarTeclado();
      const modal = this.el('modal');
      const decor = [...this.decoracion.values()].join('');
      this.decoracion.clear();
      modal.innerHTML = `
        <div class="modal-caja">
          <h2>${ansiAHtml(tr(pregunta))}</h2>
          ${decor}
          <input id="campo-texto" type="text" maxlength="24" placeholder="${escaparHtml(porDefecto)}" autocomplete="off" />
          <button type="button" class="gran-boton">OK${icono('ok')}</button>
        </div>`;
      modal.classList.add('visible');
      const campo = modal.querySelector<HTMLInputElement>('#campo-texto')!;
      const enviar = () => {
        const v = campo.value.trim() || porDefecto;
        modal.classList.remove('visible');
        sonido.click();
        this.cadenaSetup.push(v);
        resolver(v);
      };
      modal.querySelector('.gran-boton')!.addEventListener('click', enviar);
      campo.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') enviar();
      });
      campo.focus();
    });
  }

  experiencia(): number {
    return carrera.leerCarrera()?.xp ?? 0;
  }

  cogerTalisman(): string | null {
    return carrera.cogerTalisman();
  }

  guardarTalisman(id: string): void {
    carrera.guardarTalisman(id);
  }

  registrarDiario(fecha: string, puntos: number): number[] {
    const intentos = carrera.registrarDiario(fecha, puntos);
    this.intentosDiario = { fecha, intentos, puntos };
    return intentos;
  }

  iniciarTiempoReal(latido: () => LatidoTiempoReal): void {
    this.modoReal = true;
    this.raiz.classList.add('tiempo-real');
    this.ticker = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const foto = latido();
      this.actualizarReloj(foto.minuto, foto.minutosRestantes);
      this.ultimoTablero = foto.tablero;
      if (this.vista === 'sala' && this.mundo) {
        this.mundo.actualizarSala(
          foto.tablero.filter((c) => c.lugar === 'espera'),
          foto.tablero.filter((c) => c.lugar === 'planta').length,
        );
      }
      this.mundo?.fijarHora(foto.minuto);
      for (const aviso of foto.avisos) this.escribir(aviso);
      if ((foto.avisos.length > 0 || foto.terminada) && this.autoRefresco) {
        const r = this.autoRefresco;
        this.autoRefresco = null;
        r();
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
    this.limpiarTeclado();
    this.botinPendiente = null;
    this.renderInforme(true);
  }

  // ════════════════════════════════════════════════════════════
  // Piezas de interfaz
  // ════════════════════════════════════════════════════════════

  private pintarTitulo(conExpediente = false): void {
    const c = carrera.leerCarrera() ?? { guardias: 0, mejor: 0, xp: 0 };
    const prox = proximoRango(c.xp);
    const abiertas = MEJORAS.filter((m) => c.xp >= m.xpMin).length;
    const pct = prox ? Math.max(4, Math.min(100, Math.round((c.xp / (c.xp + prox.faltan)) * 100))) : 100;
    const exp = conExpediente
      ? `<div class="expediente">
           <div class="exp-fila"><span class="exp-rango">${escaparHtml(tr(rangoPorXp(c.xp)))}</span><span>${c.xp} XP</span></div>
           <div class="meter grande"><i style="width:${pct}%"></i></div>
           <div class="exp-datos"><span>${tr(`${c.guardias} guardia${c.guardias === 1 ? '' : 's'}`)}</span><span>${iconoPorNombre('candado')}${abiertas}/${MEJORAS.length}</span>${prox ? `<span>→ ${escaparHtml(tr(prox.nombre))} · ${prox.faltan} XP</span>` : `<span>${tr('Rango máximo')}</span>`}</div>
         </div>`
      : '';
    this.el('titulo-juego').innerHTML = `
      <svg class="cruz" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>
      <h1>Surgeon's Night</h1>
      <p class="sub">${tr('EL TURNO DE GUARDIA')}</p>
      <p class="lema">${tr('Llueve sobre la ciudad y el busca acaba de sonar.')}</p>
      ${exp}`;
  }

  private htmlTaquilla(xp: number, talismanId?: string): string {
    const cartas = MEJORAS.map((m) => {
      const abierta = xp >= m.xpMin;
      return `<div class="taq-carta ${abierta ? 'abierta' : 'cerrada'}">
        <span class="taq-ico">${abierta ? iconoPorNombre(m.id === 'termo' ? 'cafe' : m.id === 'ojo' ? 'prueba:eco' : m.id === 'busca' ? 'adjunto' : m.id === 'equipo' ? 'duo' : 'modo:adjunto') : iconoPorNombre('candado')}</span>
        <span class="taq-txt"><b>${escaparHtml(tr(m.nombre))}</b><small>${escaparHtml(tr(m.efecto))}</small></span>
        <span class="taq-estado">${abierta ? tr('ACTIVA') : `${m.xpMin - xp} XP`}</span>
      </div>`;
    }).join('');
    const tal = talismanPorId(talismanId);
    const talHtml = tal
      ? `<div class="taq-talisman">${iconoPorNombre('talisman')}<span><small>${t('uiBolsillo')}</small><b>${escaparHtml(tr(tal.nombre))}</b><em>${escaparHtml(tr(`${tal.efecto} · solo esta noche`))}</em></span></div>`
      : '';
    return `<div class="taquilla"><div class="taq-cab"><b>${t('uiTaquilla')}</b><span>${escaparHtml(tr(rangoPorXp(xp)))} · ${xp} XP</span></div>${talHtml}<div class="taq-rejilla">${cartas}</div></div>`;
  }

  /** Historia clínica del paciente: retrato, queja, constantes, pruebas y diagnóstico. */
  private renderFicha(f: FichaClinica): void {
    const panel = this.el('panel-ficha');
    const scroll = panel.scrollTop;
    const d = this.datoPaciente;
    const retrato = d ? retratoPaciente(d) : '';
    const cuerpo = cuerpoConDolor(d?.zonaDolor, f.patologiaId) ?? '';
    const queja = QUEJAS[f.patologiaId];
    const vit = parseConstantes(f.constantes);
    const n = Math.max(2, Math.min(100, Math.round(f.estabilidad)));
    const nuevasDesde = this.pruebasVistas;
    const pruebas = f.pruebas
      .map(
        (p, i) =>
          `<li class="prueba${i >= nuevasDesde && nuevasDesde > 0 ? ' nueva' : ''}">${icono(`prueba:${p.id}`)}<div><b>${escaparHtml(p.nombre)}</b><p>${escaparHtml(p.informe)}</p></div></li>`,
      )
      .join('');
    const hayNueva = f.pruebas.length > nuevasDesde && nuevasDesde > 0;
    this.pruebasVistas = f.pruebas.length;
    panel.innerHTML = `
      <header class="fc-cab">
        <div class="fc-retrato">${retrato}</div>
        <div class="fc-id">
          <small>${t('uiHistoria')} · #${f.id}</small>
          <h2>${escaparHtml(f.nombre)}</h2>
          <p>${f.edad} ${u('pacientesLlegada')} · ${f.llegada}${f.reingreso ? ` · <span class="chip mal">${tr('reingreso')}</span>` : ''}</p>
          <div class="estab ${NIVEL(f.estabilidad)}"><span>${t('uiEstabilidad')}</span><div class="meter"><i style="width:${n}%"></i></div><b>${Math.round(f.estabilidad)}%</b></div>
        </div>
      </header>
      ${queja ? `<div class="fc-queja"><div class="fc-cuerpo">${cuerpo}</div><div class="bocadillo">«${escaparHtml(queja)}»<span class="ay">${u('ay')}</span></div></div>` : ''}
      <section><h4>${t('uiConstantes')}</h4><div class="vitales">${vit.map((v) => `<span class="vital ${v.tono}"><small>${v.k}</small><b>${v.v}</b><em>${v.u}</em></span>`).join('')}</div></section>
      <section><h4>${t('uiAnamnesis')}</h4><ul class="fc-lista">${f.sintomas.map((s) => `<li>${escaparHtml(s)}</li>`).join('')}</ul></section>
      ${f.exploracion ? `<section><h4>${t('uiExploracion')}</h4><p class="fc-texto">${escaparHtml(f.exploracion)}</p></section>` : ''}
      ${f.notas.length ? `<section class="fc-notas">${f.notas.map((x) => `<p>${iconoPorNombre('alerta')}<span>${escaparHtml(x)}</span></p>`).join('')}</section>` : ''}
      ${pruebas ? `<section><h4>${t('uiPruebas')}</h4><ul class="fc-pruebas">${pruebas}</ul></section>` : ''}
      ${f.diagnostico ? `<div class="fc-dx">${iconoPorNombre('ok')}<div><small>${tr('Diagnóstico confirmado')}</small><b>${escaparHtml(f.diagnostico.nombre)}</b></div>${f.diagnostico.cie10 ? `<span class="cie">CIE-10 ${escaparHtml(f.diagnostico.cie10)}</span>` : ''}</div>` : ''}`;
    panel.classList.add('visible');
    if (hayNueva) {
      const ult = panel.querySelector('.fc-pruebas .nueva:last-child, .fc-pruebas li:last-child');
      ult?.scrollIntoView({ block: 'nearest' });
      sonido.bip();
    } else panel.scrollTop = this.pacienteVisto && scroll ? scroll : 0;
  }

  /** Panel izquierdo del quirófano: paso, evento, constantes y esquema anatómico. */
  private pintarPanelCirugia(d: EscenaDato, inicio: boolean): void {
    const panel = this.el('panel-cirugia');
    if (inicio) {
      panel.innerHTML = `<header class="cir-cab"><small>${tr('QUIRÓFANO')}</small><h3>${escaparHtml(d.nombreCirugia ?? '')}</h3><p>${escaparHtml(d.nombre ?? '')}${d.edad ? ` · ${d.edad} ${u('pacientesLlegada')}` : ''}</p></header>`;
      panel.classList.add('visible');
      return;
    }
    const esquema = esquemaQuirurgico(d.patologiaId, d.etapa ?? 1, d.totalEtapas ?? 3, d.evento, d.imprevisto, d.estabilidad);
    const total = d.totalPasos ?? d.totalEtapas ?? 3;
    const actual = d.numeroPaso ?? d.etapa ?? 1;
    const puntos = Array.from({ length: total }, (_, i) => `<i class="${i + 1 < actual ? 'hecho' : i + 1 === actual ? 'ahora' : ''}"></i>`).join('');
    const e = Math.max(0, Math.min(100, Math.round(d.estabilidad ?? 0)));
    panel.innerHTML = `
      <header class="cir-cab"><small>${d.imprevisto ? tr('COMPLICACIÓN IMPREVISTA') : tr('QUIRÓFANO')}</small><h3>${escaparHtml(d.nombreCirugia ?? '')}</h3></header>
      <div class="cir-pasos"><span>${t('uiPaso')} ${actual}/${total}</span><div class="puntos">${puntos}</div></div>
      <h4 class="cir-titulo${d.imprevisto ? ' mal' : ''}">${escaparHtml(d.titulo ?? '')}</h4>
      <p class="cir-evento${d.imprevisto ? ' mal' : ''}">${escaparHtml(d.evento ?? '')}</p>
      <div class="estab ${NIVEL(e)}"><span>${t('uiEstabilidad')}</span><div class="meter"><i style="width:${e}%"></i></div><b>${e}%</b></div>
      ${esquema ? `<div class="cir-esquema">${esquema}</div>` : ''}`;
    panel.classList.add('visible');
  }

  /** Parte de guardia: puntuación, pacientes, balance, carrera, tabla del día y botín. */
  private renderInforme(terminada = false): void {
    const inf = this.informe;
    const cont = this.el('informe');
    this.ocultarPaneles();
    this.el('panel-ficha').classList.remove('visible');
    this.el('panel-cirugia').classList.remove('visible');
    this.entrar('fin');
    if (!inf) {
      if (terminada) {
        cont.innerHTML = `<div class="inf-wrap"><button type="button" class="gran-boton" id="nueva">${t('uiNuevaGuardia')}${icono('continuar')}</button></div>`;
        cont.classList.add('visible');
        cont.querySelector('#nueva')!.addEventListener('click', () => location.reload());
      }
      return;
    }
    const pac = inf.pacientes
      .map((p) => {
        const est = p.estrellas !== undefined ? `<span class="estrellas" title="${p.estrellas}/5">${'★'.repeat(p.estrellas)}<i>${'★'.repeat(5 - p.estrellas)}</i></span>` : '';
        return `<li class="${p.tono}"><div><b>${escaparHtml(p.nombre)}</b><small>${escaparHtml(p.patologia)}${p.cie10 ? ` · <em>${escaparHtml(p.cie10)}</em>` : ''}${p.atipica ? ` · ${tr('atípica')}` : ''}</small></div><span class="destino ${p.tono}">${escaparHtml(tr(p.destino))}</span>${est}</li>`;
      })
      .join('');
    const balance = inf.balance.map((b) => `<div class="${b.tono ?? ''}"><dt>${escaparHtml(tr(b.etiqueta))}</dt><dd>${escaparHtml(tr(b.valor))}</dd></div>`).join('');
    const equipo = inf.equipo
      ? `<h3>${tr('Por cirujano')}</h3><ul class="inf-equipo">${inf.equipo.map((e) => `<li><b>${escaparHtml(e.nombre)}</b><span>${e.expedientes} ${u('exp')} · ${u('media')} ${e.media.toFixed(1)} ★</span></li>`).join('')}</ul>`
      : '';
    const pr = this.progreso;
    const prox = pr ? proximoRango(pr.xp) : null;
    const carreraHtml = pr
      ? `<section class="inf-card carrera"><h3>${t('uiExpediente')}</h3>
          <div class="carrera-xp"><b>+${pr.ganada} XP</b><span>${pr.xp} XP · ${u('xpGuardia')} ${pr.guardias}</span></div>
          ${pr.rangoAhora !== pr.rangoAntes ? `<div class="ascenso">${iconoPorNombre('estrella')}<span>${tr('ASCENSO')} · <b>${escaparHtml(tr(pr.rangoAhora))}</b></span></div>` : `<p class="rango-txt">${escaparHtml(tr(pr.rangoAhora))}${prox ? ` · ${escaparHtml(tr(`a ${prox.faltan} XP de ${prox.nombre}`))}` : ''}</p>`}
          ${pr.nuevas.map((m) => `<div class="nueva-mejora">${iconoPorNombre('candado')}<span><small>${tr('Nuevo en tu taquilla')}</small><b>${escaparHtml(tr(m.nombre))}</b><em>${escaparHtml(tr(m.efecto))}</em></span></div>`).join('')}
        </section>`
      : '';
    const dia = this.intentosDiario;
    const idxEste = dia ? dia.intentos.indexOf(dia.puntos) : -1;
    const diarioHtml = dia
      ? `<section class="inf-card diario"><h3>${tr('Guardia del día')} · ${escaparHtml(dia.fecha)}</h3><ol>${dia.intentos.slice(0, 8).map((p, i) => `<li class="${i === idxEste ? 'este' : ''}">${i === 0 ? '🏆 ' : ''}<b>${p}</b>${i === idxEste ? `<small>${tr('esta guardia')}</small>` : ''}</li>`).join('')}</ol><p>${tr(`Intento nº ${dia.intentos.length} de hoy. La misma noche espera a cualquiera: reta a alguien.`)}</p></section>`
      : '';
    let pie = '';
    if (this.botinPendiente) {
      pie = `<section class="inf-botin"><h3>${tr('Botín de guardia')}</h3><p>${tr('Hasta la peor noche te manda a casa con algo. Elige un talismán para la próxima (una noche, un uso):')}</p>
        <div class="botin-fila">${this.botinPendiente.opciones
          .map(
            (op, i) =>
              `<button type="button" class="talisman" data-i="${i}">${iconoPorNombre('talisman')}<b>${escaparHtml(tr(sinAnsi(op.etiqueta).replace(/^\S+\s/, '')))}</b><small>${escaparHtml(tr(op.detalle ?? ''))}</small><kbd>${i + 1}</kbd></button>`,
          )
          .join('')}</div></section>`;
    } else if (terminada) {
      pie = `<section class="inf-botin hecho"><p>${tr('Talismán guardado en tu taquilla: te espera en la próxima guardia.')}</p><button type="button" class="gran-boton" id="nueva">${t('uiNuevaGuardia')}${icono('continuar')}</button></section>`;
    }
    const positivo = inf.puntos >= 0;
    cont.innerHTML = `
      <div class="inf-wrap">
        <header class="inf-cab"><small>08:00 · ${escaparHtml(tr(this.hudEstado?.hospital ?? ''))}</small><h1>${t('uiParte')}</h1></header>
        <section class="inf-puntos">
          <div class="gran-puntos ${positivo ? 'ok' : 'mal'}"><small>${t('uiPuntuacion')}</small><b id="cuenta">0</b></div>
          <blockquote class="inf-verdicto">«${escaparHtml(inf.veredicto)}»<cite>${tr('Jefe de Servicio')}</cite></blockquote>
        </section>
        ${inf.notas.length ? `<ul class="inf-notas">${inf.notas.map((n) => `<li>${escaparHtml(tr(n))}</li>`).join('')}</ul>` : ''}
        <div class="inf-cols">
          <section class="inf-card"><h3>${tr('Pacientes')}</h3><ul class="inf-pacientes">${pac}</ul></section>
          <section class="inf-card"><h3>${tr('Balance')}</h3><dl class="inf-balance">${balance}</dl>${equipo}</section>
        </div>
        <div class="inf-cols">${carreraHtml}${diarioHtml}</div>
        ${pie}
      </div>`;
    cont.classList.add('visible');
    cont.scrollTop = 0;

    // Cuenta animada de la puntuación
    const cuenta = cont.querySelector<HTMLElement>('#cuenta');
    if (cuenta && !this.informeMostrado) {
      const t0 = performance.now();
      const fin = inf.puntos;
      const paso = (t: number) => {
        const k = Math.min(1, (t - t0) / 1300);
        cuenta.textContent = String(Math.round(fin * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    } else if (cuenta) cuenta.textContent = String(inf.puntos);
    this.informeMostrado = true;

    if (this.botinPendiente) {
      const bp = this.botinPendiente;
      const elegirTal = (i: number) => {
        const op = bp.opciones[i];
        if (!op) return;
        sonido.campanilla();
        this.botinPendiente = null;
        this.limpiarTeclado();
        bp.resolver(op.valor);
      };
      cont.querySelectorAll<HTMLButtonElement>('.talisman').forEach((b) => b.addEventListener('click', () => elegirTal(Number(b.dataset['i']))));
      this.armarTeclado(bp.opciones.length, elegirTal);
    } else if (terminada) {
      cont.querySelector('#nueva')?.addEventListener('click', () => location.reload());
    }
  }
}
