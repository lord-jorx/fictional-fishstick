/**
 * Mundo: el motor 3D del juego (Three.js).
 *
 * Orquesta los cuatro escenarios (urgencias, quirófano, puerta de
 * ambulancias, exterior), la cámara cinematográfica, el avatar del cirujano
 * (teclado WASD/flechas y toque/clic), los pacientes en camilla —con llegada
 * escoltada por el celador— y las etiquetas HTML ancladas a objetos 3D.
 *
 * No sabe nada de medicina ni de menús: ThreeIO le dice QUÉ mostrar y qué
 * hotspots están activos; el motor clínico sigue siendo el de siempre.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { VictimaImv } from '../../core/io.js';
import {
  construirExterior,
  construirPuerta,
  construirQuirofano,
  construirSala,
  type Colision,
  type Escenario,
  type ExteriorEscenario,
  type PuertaEscenario,
  type QuirofanoEscenario,
  type SalaEscenario,
} from './escenarios.js';
import {
  crearCamilla,
  crearCelador,
  crearCirujano,
  crearPacienteSentado,
  type Camilla,
  type Personaje,
} from './personajes.js';
import { BancoEcg, COL } from './util.js';

export type VistaMundo = 'exterior' | 'sala' | 'quirofano' | 'puerta';

export interface PacienteVista {
  nombre: string;
  estabilidad: number;
  alerta?: boolean;
}

export interface AccionMundo {
  id: string;
  etiqueta: string;
  /** Texto corto con icono para la etiqueta flotante (opcional). */
  icono?: string;
  activar: () => void;
}

interface Hotspot {
  id: string;
  spot: THREE.Vector3; // mundo
  mira: THREE.Vector3; // hacia dónde se queda mirando el cirujano
  accion: AccionMundo;
  anillo?: THREE.Mesh;
  ancla: THREE.Vector3; // dónde flota su etiqueta (mundo)
}

interface EntradaPaciente {
  nombre: string;
  zona: 'box' | 'espera';
  slot: number;
  estabilidad: number;
  alerta: boolean;
  camilla?: Camilla;
  persona?: Personaje;
  llegando: boolean;
  saliendo: boolean;
}

interface Etiqueta {
  el: HTMLElement;
  ancla: () => THREE.Vector3 | null;
  vista: VistaMundo;
}

interface Cam {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

const OFF: Record<VistaMundo, THREE.Vector3> = {
  sala: new THREE.Vector3(0, 0, 0),
  quirofano: new THREE.Vector3(150, 0, 0),
  puerta: new THREE.Vector3(-150, 0, 0),
  exterior: new THREE.Vector3(0, 0, 150),
};

const FONDO_INTERIOR = new THREE.Color(0x070b14);

function camaraBase(v: VistaMundo): Cam {
  const o = OFF[v];
  switch (v) {
    case 'sala':
      return { pos: o.clone().add(new THREE.Vector3(1.4, 25.5, 20)), look: o.clone().add(new THREE.Vector3(1.4, 0.3, -2.3)) };
    case 'quirofano':
      return { pos: o.clone().add(new THREE.Vector3(5.6, 6.6, 7.0)), look: o.clone().add(new THREE.Vector3(0, 1.3, -0.2)) };
    case 'puerta':
      return { pos: o.clone().add(new THREE.Vector3(0, 9.5, 19)), look: o.clone().add(new THREE.Vector3(0, 0.6, 0.4)) };
    case 'exterior':
      return { pos: o.clone().add(new THREE.Vector3(-4, 5.2, 44)), look: o.clone().add(new THREE.Vector3(2, 7.5, -8)) };
  }
}

export class Mundo {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly escena = new THREE.Scene();
  private readonly camara: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private readonly reloj = new THREE.Clock();
  private readonly banco = new BancoEcg();
  private readonly raycaster = new THREE.Raycaster();

  private readonly hemi: THREE.HemisphereLight;
  private readonly sol: THREE.DirectionalLight;
  private readonly pool: THREE.PointLight[] = [];

  readonly sala: SalaEscenario;
  private readonly quirofano: QuirofanoEscenario;
  private readonly puerta: PuertaEscenario;
  private readonly exterior: ExteriorEscenario;
  private readonly escenarios: Record<VistaMundo, Escenario>;

  private vista: VistaMundo = 'exterior';
  private amanecer = false;
  private t = 0;

  // Cámara
  private readonly camPos = new THREE.Vector3();
  private readonly camLook = new THREE.Vector3();
  private rigPos = new THREE.Vector3();
  private rigLook = new THREE.Vector3();
  private foco: { nombre: string } | null = null;
  private margen = { izq: 0, der: 0, arr: 0, abajo: 0 };
  private margenActual = { izq: 0, der: 0, arr: 0, abajo: 0 };
  private sacudida = 0;
  private puertaN = 0;
  private puntero = new THREE.Vector2();

  // Avatar
  readonly cirujano: Personaje;
  private readonly celador: Personaje;
  private posCirujano = new THREE.Vector3(0, 0, 4.6);
  private velCirujano = new THREE.Vector3();
  private ruta: THREE.Vector3[] = [];
  private pendiente: Hotspot | null = null;
  private atascado = 0;
  private patrulla = { i: 0 };
  private readonly teclas = new Set<string>();
  controlActivo = false;

  // Pacientes y hotspots
  private readonly pacientes = new Map<string, EntradaPaciente>();
  private hotspots = new Map<string, Hotspot>();
  private cercaActual: string | null = null;
  private readonly animaciones: Array<(dt: number) => boolean> = [];

  // Etiquetas HTML
  private readonly etiquetas = new Map<string, Etiqueta>();
  private readonly victimas: Camilla[] = [];

  /** Notificaciones hacia la interfaz. */
  onCerca: (h: { id: string; etiqueta: string } | null) => void = () => {};
  onPasos: () => void = () => {};

  constructor(
    private readonly contenedor: HTMLElement,
    private readonly capaEtiquetas: HTMLElement,
    opciones: { calidadBaja?: boolean } = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: !!opciones.calidadBaja, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opciones.calidadBaja ? 1.25 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.className = 'lienzo-3d';
    contenedor.prepend(this.renderer.domElement);

    this.camara = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
    this.escena.background = FONDO_INTERIOR;
    this.escena.fog = new THREE.Fog(0x070b14, 45, 110);

    // Luz base: hemisférica fría + sol con sombras suaves + pool de puntuales
    this.hemi = new THREE.HemisphereLight(0xa9c4f5, 0x1b2540, 0.75);
    this.escena.add(this.hemi);
    this.sol = new THREE.DirectionalLight(0xeaf2ff, 1.25);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(opciones.calidadBaja ? 1024 : 2048, opciones.calidadBaja ? 1024 : 2048);
    this.sol.shadow.bias = -0.0004;
    this.sol.shadow.normalBias = 0.03;
    this.sol.shadow.radius = 3;
    this.escena.add(this.sol, this.sol.target);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.PointLight(0xffffff, 0, 20, 2);
      this.pool.push(p);
      this.escena.add(p);
    }

    // Personajes globales
    this.cirujano = crearCirujano();
    this.celador = crearCelador();

    // Escenarios
    this.sala = construirSala();
    this.quirofano = construirQuirofano(this.banco, this.cirujano);
    this.puerta = construirPuerta(this.banco);
    this.exterior = construirExterior();
    this.escenarios = { sala: this.sala, quirofano: this.quirofano, puerta: this.puerta, exterior: this.exterior };
    for (const v of Object.keys(this.escenarios) as VistaMundo[]) {
      const e = this.escenarios[v];
      e.grupo.position.copy(OFF[v]);
      e.grupo.visible = false;
      this.escena.add(e.grupo);
    }
    this.sala.grupo.add(this.cirujano.grupo);
    this.cirujano.grupo.position.copy(this.posCirujano);
    this.sala.grupo.add(this.celador.grupo);
    this.celador.grupo.position.set(-7, 0, -2.6);

    // Posproceso: bloom suave para neones, pantallas y luces
    if (!opciones.calidadBaja) {
      try {
        const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
        this.composer = new EffectComposer(this.renderer, rt);
        this.composer.addPass(new RenderPass(this.escena, this.camara));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.6, 0.94);
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());
      } catch {
        this.composer = null;
      }
    }

    this.ajustarTamano();
    new ResizeObserver(() => this.ajustarTamano()).observe(contenedor);
    window.addEventListener('keydown', (e) => this.alTeclaBajar(e));
    window.addEventListener('keyup', (e) => this.teclas.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.teclas.clear());
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => this.alPulsar(e));
    dom.addEventListener('pointermove', (e) => {
      const r = dom.getBoundingClientRect();
      this.puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    });

    // Arranque: exterior nocturno
    this.mostrar('exterior', { instantaneo: true });
    this.bucle();
  }

  // ════════════════════════════════════════════════════════════
  // Vistas y cámara
  // ════════════════════════════════════════════════════════════

  get vistaActual(): VistaMundo {
    return this.vista;
  }

  /** Cambia de escenario con un fundido rápido y un travelling de llegada. */
  mostrar(v: VistaMundo, o: { instantaneo?: boolean; amanecer?: boolean } = {}): void {
    const cambia = v !== this.vista;
    this.vista = v;
    this.amanecer = !!o.amanecer;
    for (const k of Object.keys(this.escenarios) as VistaMundo[]) this.escenarios[k].grupo.visible = k === v;

    // Cirujano: vive en la sala salvo dentro del quirófano
    if (v === 'quirofano') {
      this.quirofano.grupo.add(this.cirujano.grupo);
      this.cirujano.grupo.position.copy(this.quirofano.posCirujano);
      this.cirujano.grupo.rotation.y = -Math.PI / 2;
      this.cirujano.operando = true;
    } else if (this.cirujano.grupo.parent !== this.sala.grupo) {
      this.sala.grupo.add(this.cirujano.grupo);
      this.cirujano.grupo.position.copy(this.posCirujano);
      this.cirujano.operando = false;
    }

    if (v === 'exterior') {
      this.exterior.fijarAmanecer(this.amanecer);
      this.escena.background = this.amanecer ? this.exterior.cielos.alba : this.exterior.cielos.noche;
      this.escena.fog = new THREE.Fog(this.amanecer ? 0xffb68a : 0x0b1530, 40, 120);
    } else {
      this.escena.background = FONDO_INTERIOR;
      this.escena.fog = new THREE.Fog(0x070b14, 60, 140);
    }
    this.sala.fijarQuirofanoEnUso(v === 'quirofano');

    // Sol (sombras) sobre el escenario activo
    const off = OFF[v];
    const amplitud = v === 'sala' ? 21 : v === 'puerta' ? 20 : v === 'exterior' ? 26 : 12;
    this.sol.position.set(off.x - 7, 20, off.z + 11);
    this.sol.target.position.set(off.x, 0, off.z);
    const cam = this.sol.shadow.camera;
    cam.left = -amplitud;
    cam.right = amplitud;
    cam.top = amplitud;
    cam.bottom = -amplitud;
    cam.near = 1;
    cam.far = 60;
    cam.updateProjectionMatrix();
    this.sol.intensity = v === 'quirofano' ? 0.55 : v === 'exterior' ? 0.45 : 1.15;
    this.hemi.intensity = v === 'exterior' ? (this.amanecer ? 1.0 : 0.45) : 0.75;
    (this.escenarios.quirofano as QuirofanoEscenario).spot.intensity = v === 'quirofano' ? 110 : 0;

    // Fundido + travelling
    this.foco = null;
    if (cambia && !o.instantaneo) {
      this.fundido();
      const base = this.rigBase();
      this.camPos.copy(base.pos).add(new THREE.Vector3(0, 2.2, 5.5));
      this.camLook.copy(base.look);
    } else if (o.instantaneo) {
      const base = this.rigBase();
      this.camPos.copy(base.pos);
      this.camLook.copy(base.look);
    }
    for (const [id, e] of this.etiquetas) e.el.style.display = e.vista === v ? '' : 'none', void id;
  }

  private fundido(): void {
    const f = document.getElementById('fundido');
    if (!f) return;
    f.classList.add('activo');
    window.setTimeout(() => f.classList.remove('activo'), 140);
  }

  /** Reserva de espacio para los paneles de la interfaz (px): descentra la escena. */
  fijarMargen(m: { izq?: number; der?: number; arr?: number; abajo?: number }): void {
    this.margen = { izq: m.izq ?? 0, der: m.der ?? 0, arr: m.arr ?? 0, abajo: m.abajo ?? 0 };
  }

  private rigBase(): Cam {
    let base = camaraBase(this.vista);
    if (this.vista === 'puerta') {
      const w = Math.min(this.puertaN * 2.6, 24);
      const o = OFF.puerta;
      base = {
        pos: o.clone().add(new THREE.Vector3(0, 4.8 + w * 0.17, 8.0 + w * 0.34)),
        look: o.clone().add(new THREE.Vector3(0, 0.9, 0.6)),
      };
    }
    return base;
  }

  private actualizarRig(): void {
    const b = this.rigBase();
    this.rigPos.copy(b.pos);
    this.rigLook.copy(b.look);
    const aspecto = this.camara.aspect;

    if (this.vista === 'sala') {
      if (this.foco) {
        const e = this.pacientes.get(this.foco.nombre);
        const c = e ? this.posicionPaciente(e) : null;
        if (c) {
          this.rigLook.set(c.x - 0.2, 1.0, c.z + (e!.zona === 'box' ? 1.0 : -0.4));
          this.rigPos.set(c.x + 3.6, e!.zona === 'box' ? 4.8 : 4.4, c.z + (e!.zona === 'box' ? 7.4 : 6.0));
        }
      } else {
        this.rigPos.x += this.posCirujano.x * 0.22;
        this.rigLook.x += this.posCirujano.x * 0.18;
        this.rigPos.z += this.posCirujano.z * 0.06;
      }
    }
    if (this.vista === 'exterior') {
      const t = this.t;
      this.rigPos.x += Math.sin(t * 0.12) * 5.5;
      this.rigPos.y += Math.sin(t * 0.09) * 0.7 + (this.amanecer ? Math.min(4, t * 0.05) : 0);
      this.rigLook.x += Math.sin(t * 0.12) * 2.0;
    }

    // Pantallas estrechas: aléjate para que quepa el escenario
    if (aspecto < 1.6 && this.vista !== 'exterior') {
      const sigueAlCirujano = this.vista === 'sala' && !this.foco;
      // En vertical la sala no cabe entera: se encuadra una parte y la cámara sigue al cirujano.
      const f = sigueAlCirujano ? Math.min(1.45, 1.6 / Math.max(0.35, aspecto)) : Math.min(2.6, 1.6 / Math.max(0.35, aspecto));
      this.rigPos.sub(this.rigLook).multiplyScalar(f).add(this.rigLook);
      if (sigueAlCirujano) {
        const ajuste = THREE.MathUtils.clamp(this.posCirujano.x, -9, 9) * 0.85 - this.posCirujano.x * 0.2;
        this.rigPos.x += ajuste;
        this.rigLook.x += ajuste;
      }
    }
    // Paralaje de ratón
    this.rigPos.x += this.puntero.x * 0.55;
    this.rigPos.y += this.puntero.y * 0.3;
  }

  private moverCamara(dt: number): void {
    this.actualizarRig();
    const k = 1 - Math.exp(-dt * 3.4);
    this.camPos.lerp(this.rigPos, k);
    this.camLook.lerp(this.rigLook, k);
    const pos = this.camPos.clone();
    if (this.sacudida > 0) {
      this.sacudida = Math.max(0, this.sacudida - dt * 2.4);
      const s = this.sacudida * 0.22;
      pos.x += (Math.random() - 0.5) * s;
      pos.y += (Math.random() - 0.5) * s;
    }
    this.camara.position.copy(pos);
    this.camara.lookAt(this.camLook);

    // Descentrado por paneles de la interfaz (suavizado)
    const m = this.margen;
    const a = this.margenActual;
    const kk = 1 - Math.exp(-dt * 5);
    a.izq += (m.izq - a.izq) * kk;
    a.der += (m.der - a.der) * kk;
    a.arr += (m.arr - a.arr) * kk;
    a.abajo += (m.abajo - a.abajo) * kk;
    const W = this.contenedor.clientWidth;
    const H = this.contenedor.clientHeight;
    if (W > 0 && H > 0) {
      const offX = (a.der - a.izq) / 2;
      const offY = (a.abajo - a.arr) / 2;
      this.camara.setViewOffset(W, H, offX, offY, W, H);
    }
  }

  /** Sacudida breve de cámara (complicaciones, éxitus). */
  golpe(intensidad = 1): void {
    this.sacudida = Math.min(1.4, this.sacudida + intensidad);
  }

  private ajustarTamano(): void {
    const W = this.contenedor.clientWidth || window.innerWidth;
    const H = this.contenedor.clientHeight || window.innerHeight;
    this.renderer.setSize(W, H, false);
    this.camara.aspect = W / H;
    this.camara.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(W, H);
    }
    this.bloom?.setSize(W / 2, H / 2);
  }

  // ════════════════════════════════════════════════════════════
  // Hora del día
  // ════════════════════════════════════════════════════════════

  fijarHora(minuto: number): void {
    this.sala.fijarHora(minuto);
    const h = ((8 * 60 + minuto) % 1440) / 60;
    const dia = h >= 8 && h < 18 ? 1 : h >= 18 && h < 21 ? 1 - (h - 18) / 3 : h >= 5 && h < 8 ? (h - 5) / 3 : 0;
    if (this.vista !== 'exterior') {
      this.hemi.intensity = 0.62 + dia * 0.22;
      this.hemi.color.setHex(dia > 0.5 ? 0xc3d9ff : 0xa0b8ee);
    }
  }

  // ════════════════════════════════════════════════════════════
  // SALA: pacientes, hotspots, avatar
  // ════════════════════════════════════════════════════════════

  /** Sincroniza el 3D con el tablero: altas, llegadas y estado de cada camilla. */
  actualizarSala(lista: PacienteVista[], planta: number): { nuevos: string[] } {
    const nuevos: string[] = [];
    const nombres = new Set(lista.map((p) => p.nombre));

    // Salidas
    for (const [nombre, e] of this.pacientes) {
      if (!nombres.has(nombre) && !e.saliendo) this.despedir(e);
    }
    // Entradas y actualizaciones
    for (const p of lista) {
      let e = this.pacientes.get(p.nombre);
      if (!e) {
        e = this.acomodar(p) ?? undefined;
        if (e) {
          nuevos.push(p.nombre);
          this.pacientes.set(p.nombre, e);
        }
      }
      if (!e) continue;
      e.estabilidad = p.estabilidad;
      e.alerta = !!p.alerta;
      e.camilla?.fijarEstabilidad(p.estabilidad);
      this.pintarEtiquetaPaciente(e);
    }
    // Un box libre → sube el primero de la sala de espera
    const libre = this.primerBoxLibre();
    if (libre >= 0) {
      const enEspera = [...this.pacientes.values()].find((x) => x.zona === 'espera' && !x.saliendo);
      if (enEspera) this.subirABox(enEspera, libre);
    }
    this.sala.fijarPlanta(planta);
    return { nuevos };
  }

  private primerBoxLibre(): number {
    const ocupados = new Set([...this.pacientes.values()].filter((e) => e.zona === 'box' && !e.saliendo).map((e) => e.slot));
    for (let i = 0; i < this.sala.bahias.length; i++) if (!ocupados.has(i)) return i;
    return -1;
  }

  private primerAsientoLibre(): number {
    const ocupados = new Set([...this.pacientes.values()].filter((e) => e.zona === 'espera' && !e.saliendo).map((e) => e.slot));
    for (let i = 0; i < this.sala.asientos.length; i++) if (!ocupados.has(i)) return i;
    return -1;
  }

  private acomodar(p: PacienteVista): EntradaPaciente | null {
    const box = this.primerBoxLibre();
    if (box >= 0) {
      const e: EntradaPaciente = {
        nombre: p.nombre, zona: 'box', slot: box, estabilidad: p.estabilidad, alerta: !!p.alerta,
        llegando: true, saliendo: false,
      };
      this.crearCamillaDe(e);
      this.animarLlegada(e);
      return e;
    }
    const asiento = this.primerAsientoLibre();
    if (asiento >= 0) {
      const persona = crearPacienteSentado(p.nombre);
      const pos = this.sala.asientos[asiento]!;
      persona.grupo.position.copy(pos);
      this.sala.grupo.add(persona.grupo);
      return {
        nombre: p.nombre, zona: 'espera', slot: asiento, estabilidad: p.estabilidad, alerta: !!p.alerta,
        persona, llegando: false, saliendo: false,
      };
    }
    return null;
  }

  private crearCamillaDe(e: EntradaPaciente): void {
    const cam = crearCamilla(e.nombre, this.banco, true);
    cam.fijarEstabilidad(e.estabilidad);
    const b = this.sala.bahias[e.slot]!;
    cam.grupo.position.copy(b.cama);
    this.sala.grupo.add(cam.grupo);
    e.camilla = cam;
  }

  private subirABox(e: EntradaPaciente, slot: number): void {
    if (e.persona) {
      this.sala.grupo.remove(e.persona.grupo);
      e.persona = undefined;
    }
    e.zona = 'box';
    e.slot = slot;
    this.crearCamillaDe(e);
    this.animarLlegada(e);
  }

  /** Posición (mundo) de un paciente: el centro de su camilla o su silla. */
  private posicionPaciente(e: EntradaPaciente): THREE.Vector3 {
    const off = OFF.sala;
    if (e.zona === 'box') return this.sala.bahias[e.slot]!.cama.clone().add(off);
    return this.sala.asientos[e.slot]!.clone().add(off);
  }

  private puntoDePie(e: EntradaPaciente): THREE.Vector3 {
    const off = OFF.sala;
    if (e.zona === 'box') return this.sala.bahias[e.slot]!.frente.clone().add(off);
    const a = this.sala.asientos[e.slot]!;
    return new THREE.Vector3(a.x, 0, a.z - 1.3).add(off);
  }

  /** El celador trae la camilla desde la ambulancia hasta su box. */
  private animarLlegada(e: EntradaPaciente): void {
    const cam = e.camilla;
    if (!cam) return;
    const b = this.sala.bahias[e.slot]!;
    const camino = [
      new THREE.Vector3(13.4, 0, -2.9),
      new THREE.Vector3(b.x, 0, -2.9),
      new THREE.Vector3(b.x, 0, -6.6),
    ];
    const largos = [camino[0]!.distanceTo(camino[1]!), camino[1]!.distanceTo(camino[2]!)];
    const total = largos[0]! + largos[1]!;
    const porter = crearCelador();
    this.sala.grupo.add(porter.grupo);
    const velocidad = 7.5;
    let s = 0;
    /** Posición sobre la poligonal a distancia d, con el tramo en el que está. */
    const en = (d: number): { p: THREE.Vector3; tramo: 1 | 2 } => {
      const dd = Math.max(0, Math.min(total, d));
      if (dd <= largos[0]!) {
        return { p: camino[0]!.clone().lerp(camino[1]!, dd / Math.max(0.01, largos[0]!)), tramo: 1 };
      }
      return { p: camino[1]!.clone().lerp(camino[2]!, (dd - largos[0]!) / Math.max(0.01, largos[1]!)), tramo: 2 };
    };
    cam.grupo.position.copy(camino[0]!);
    cam.grupo.rotation.y = Math.PI / 2;
    this.animaciones.push((dt) => {
      s += velocidad * dt;
      const a = en(s);
      cam.grupo.position.copy(a.p);
      // La camilla gira la cabecera hacia -z al doblar la esquina.
      const f = THREE.MathUtils.clamp((s - (largos[0]! - 1.3)) / 2.6, 0, 1);
      cam.grupo.rotation.y = THREE.MathUtils.lerp(Math.PI / 2, 0, f);
      const q = en(Math.min(s, total) - 1.9);
      porter.grupo.position.copy(q.p);
      porter.grupo.rotation.y = q.tramo === 1 ? -Math.PI / 2 : Math.PI;
      porter.actualizar(dt, velocidad);
      if (s >= total) {
        cam.grupo.position.copy(b.cama);
        cam.grupo.rotation.y = 0;
        e.llegando = false;
        // El celador se vuelve por donde vino y sale por la puerta.
        let r = total - 1.9;
        this.animaciones.push((dt2) => {
          r -= 5.5 * dt2;
          const w = en(Math.max(0, r));
          porter.grupo.position.copy(w.p);
          porter.grupo.rotation.y = w.tramo === 1 ? Math.PI / 2 : 0;
          porter.actualizar(dt2, 5.5);
          if (r <= 0) {
            this.sala.grupo.remove(porter.grupo);
            return true;
          }
          return false;
        });
        return true;
      }
      return false;
    });
    this.onPasos();
  }

  /** La camilla sale rodando hacia la puerta de planta. */
  private despedir(e: EntradaPaciente): void {
    e.saliendo = true;
    this.quitarEtiqueta(`pac:${e.nombre}`);
    if (e.persona) {
      const pers = e.persona;
      const x0 = pers.grupo.position.x;
      let k = 0;
      this.animaciones.push((dt) => {
        k += dt * 1.4;
        pers.grupo.position.x = x0 - k * 3;
        pers.grupo.position.y = -k * 0.4;
        if (k >= 1) {
          this.sala.grupo.remove(pers.grupo);
          this.pacientes.delete(e.nombre);
          return true;
        }
        return false;
      });
      return;
    }
    const cam = e.camilla;
    if (!cam) {
      this.pacientes.delete(e.nombre);
      return;
    }
    const b = this.sala.bahias[e.slot]!;
    const camino = [b.cama.clone(), new THREE.Vector3(b.x, 0, -2.9), new THREE.Vector3(-12.6, 0, -2.9)];
    const l0 = camino[0]!.distanceTo(camino[1]!);
    const l1 = camino[1]!.distanceTo(camino[2]!);
    let s = 0;
    this.animaciones.push((dt) => {
      s += 8 * dt;
      if (s <= l0) {
        cam.grupo.position.copy(camino[0]!.clone().lerp(camino[1]!, s / l0));
        cam.grupo.rotation.y = Math.PI;
      } else {
        cam.grupo.position.copy(camino[1]!.clone().lerp(camino[2]!, Math.min(1, (s - l0) / l1)));
        cam.grupo.rotation.y = -Math.PI / 2;
      }
      if (s >= l0 + l1) {
        this.sala.grupo.remove(cam.grupo);
        this.pacientes.delete(e.nombre);
        return true;
      }
      return false;
    });
  }

  // ── Acciones / hotspots ──

  /** Declara qué se puede hacer ahora en la sala (café, sofá, planta, pacientes). */
  fijarAcciones(acciones: AccionMundo[]): void {
    for (const h of this.hotspots.values()) if (h.anillo) (h.anillo.material as THREE.MeshBasicMaterial).opacity = 0;
    this.limpiarEtiquetas('hot:');
    this.hotspots = new Map();
    const off = OFF.sala;
    for (const a of acciones) {
      let spot: THREE.Vector3 | null = null;
      let mira = new THREE.Vector3(0, 0, -1);
      let ancla = new THREE.Vector3();
      let anillo: THREE.Mesh | undefined;
      if (a.id === 'cafe') {
        spot = this.sala.puntos.cafe.clone().add(off);
        mira.set(1, 0, 0);
        ancla = new THREE.Vector3(13.5, 2.6, 3.4).add(off);
        anillo = this.sala.anillos.cafe;
      } else if (a.id === 'descansar') {
        spot = this.sala.puntos.sofa.clone().add(off);
        mira.set(1, 0, 0);
        ancla = new THREE.Vector3(13.0, 1.9, 6.4).add(off);
        anillo = this.sala.anillos.sofa;
      } else if (a.id === 'ronda') {
        spot = this.sala.puntos.planta.clone().add(off);
        mira.set(-1, 0, 0);
        ancla = new THREE.Vector3(-13.5, 3.3, -2.2).add(off);
        anillo = this.sala.anillos.planta;
      } else if (a.id.startsWith('paciente:')) {
        const e = this.pacientes.get(a.id.slice('paciente:'.length));
        if (!e) continue;
        spot = this.puntoDePie(e);
        mira = e.zona === 'box' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
        ancla = this.posicionPaciente(e).add(new THREE.Vector3(0, 2.3, 0));
        anillo = e.zona === 'box' ? this.sala.bahias[e.slot]!.anillo : undefined;
      }
      if (!spot) continue;
      const h: Hotspot = { id: a.id, spot, mira, accion: a, anillo, ancla };
      this.hotspots.set(a.id, h);
      // Etiqueta flotante clicable para café / sofá / planta (los pacientes ya llevan la suya)
      if (!a.id.startsWith('paciente:')) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'etq-accion';
        el.innerHTML = `${a.icono ?? ''}<span>${a.etiqueta}</span>`;
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.irYActivar(a.id);
        });
        this.capaEtiquetas.appendChild(el);
        this.etiquetas.set(`hot:${a.id}`, { el, ancla: () => h.ancla, vista: 'sala' });
      }
    }
    // Los pacientes: su etiqueta pasa a ser clicable
    for (const e of this.pacientes.values()) this.pintarEtiquetaPaciente(e);
  }

  /** Camina hasta el hotspot y, al llegar, lo activa. */
  irYActivar(id: string): void {
    const h = this.hotspots.get(id);
    if (!h || this.vista !== 'sala') return;
    this.pendiente = h;
    this.ruta = this.rutaHasta(this.posCirujano.clone(), h.spot.clone().sub(OFF.sala));
    this.atascado = 0;
  }

  private alTeclaBajar(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if (!this.controlActivo || this.vista !== 'sala') return;
    if (['w', 'a', 's', 'd', 'z', 'q', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      e.preventDefault();
      this.teclas.add(k);
      this.ruta = [];
      this.pendiente = null;
    } else if (k === 'e' || k === ' ' || k === 'enter') {
      const h = this.hotspotCercano();
      if (h) {
        e.preventDefault();
        this.activar(h);
      }
    }
  }

  private alPulsar(ev: PointerEvent): void {
    if (this.vista !== 'sala' || !this.controlActivo) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1));
    this.raycaster.setFromCamera(p, this.camara);

    // ¿Clic sobre una camilla con hotspot?
    const obj: THREE.Object3D[] = [];
    const duenos = new Map<THREE.Object3D, string>();
    for (const [id, h] of this.hotspots) {
      if (!id.startsWith('paciente:')) continue;
      const e = this.pacientes.get(id.slice('paciente:'.length));
      if (e?.camilla) for (const s of e.camilla.seleccionables) { obj.push(s); duenos.set(s, id); }
      if (e?.persona) { obj.push(e.persona.grupo); duenos.set(e.persona.grupo, id); }
      void h;
    }
    const hit = this.raycaster.intersectObjects(obj, true)[0];
    if (hit) {
      let o: THREE.Object3D | null = hit.object;
      while (o) {
        const id = duenos.get(o);
        if (id) return this.irYActivar(id);
        o = o.parent;
      }
    }
    // Suelo: ir a ese punto (o al hotspot más cercano al clic)
    const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const punto = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plano, punto)) return;
    let mejor: Hotspot | null = null;
    let dm = 2.0;
    for (const h of this.hotspots.values()) {
      const d = h.spot.distanceTo(punto);
      if (d < dm) { dm = d; mejor = h; }
    }
    if (mejor) return this.irYActivar(mejor.id);
    this.pendiente = null;
    this.ruta = this.rutaHasta(this.posCirujano.clone(), punto.clone().sub(OFF.sala));
  }

  private hotspotCercano(): Hotspot | null {
    let mejor: Hotspot | null = null;
    let dm = 1.9;
    const local = this.posCirujano;
    for (const h of this.hotspots.values()) {
      const d = local.distanceTo(h.spot.clone().sub(OFF.sala));
      if (d < dm) { dm = d; mejor = h; }
    }
    return mejor;
  }

  private activar(h: Hotspot): void {
    this.ruta = [];
    this.pendiente = null;
    this.teclas.clear();
    this.controlActivo = false;
    this.cirujano.girar(Math.atan2(h.mira.x, h.mira.z), 1);
    h.accion.activar();
  }

  /** Ruta recta con un único rodeo si hay un mueble de por medio. */
  private rutaHasta(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3[] {
    const inflar = 0.6;
    const choca = (p: THREE.Vector3, q: THREE.Vector3, c: Colision) =>
      segmentoCruzaCaja(p.x, p.z, q.x, q.z, c.minX - inflar, c.maxX + inflar, c.minZ - inflar, c.maxZ + inflar);
    const bloqueo = this.sala.colisiones.find((c) => choca(a, b, c));
    if (!bloqueo) return [b];
    const esq = [
      new THREE.Vector3(bloqueo.minX - inflar - 0.1, 0, bloqueo.minZ - inflar - 0.1),
      new THREE.Vector3(bloqueo.maxX + inflar + 0.1, 0, bloqueo.minZ - inflar - 0.1),
      new THREE.Vector3(bloqueo.minX - inflar - 0.1, 0, bloqueo.maxZ + inflar + 0.1),
      new THREE.Vector3(bloqueo.maxX + inflar + 0.1, 0, bloqueo.maxZ + inflar + 0.1),
    ];
    let mejor: THREE.Vector3 | null = null;
    let largo = Infinity;
    for (const w of esq) {
      if (this.sala.colisiones.some((c) => choca(a, w, c) && c !== bloqueo) ) continue;
      const l = a.distanceTo(w) + w.distanceTo(b);
      if (l < largo) { largo = l; mejor = w; }
    }
    return mejor ? [mejor, b] : [b];
  }

  private moverAvatar(dt: number): void {
    if (this.vista !== 'sala') return;
    const VEL = 8.4;
    let objetivoV = new THREE.Vector3();
    let mandoTeclado = false;
    if (this.controlActivo) {
      let dx = 0;
      let dz = 0;
      const t = this.teclas;
      if (t.has('a') || t.has('q') || t.has('arrowleft')) dx -= 1;
      if (t.has('d') || t.has('arrowright')) dx += 1;
      if (t.has('w') || t.has('z') || t.has('arrowup')) dz -= 1;
      if (t.has('s') || t.has('arrowdown')) dz += 1;
      if (dx !== 0 || dz !== 0) {
        objetivoV.set(dx, 0, dz).normalize().multiplyScalar(VEL * 0.78);
        mandoTeclado = true;
      }
    }
    if (!mandoTeclado && this.ruta.length > 0 && this.controlActivo) {
      const w = this.ruta[0]!;
      const a = w.clone().sub(this.posCirujano);
      a.y = 0;
      const d = a.length();
      if (d < 0.22) {
        this.ruta.shift();
        if (this.ruta.length === 0 && this.pendiente) {
          const h = this.pendiente;
          this.pendiente = null;
          this.activar(h);
          return;
        }
      } else {
        objetivoV = a.normalize().multiplyScalar(Math.min(VEL, 2 + d * 6));
      }
    }
    const antes = this.posCirujano.clone();
    this.velCirujano.lerp(objetivoV, 1 - Math.exp(-dt * 13));
    this.posCirujano.addScaledVector(this.velCirujano, dt);
    this.resolverColisiones(this.posCirujano);
    const l = this.sala.lim;
    this.posCirujano.x = THREE.MathUtils.clamp(this.posCirujano.x, l.minX, l.maxX);
    this.posCirujano.z = THREE.MathUtils.clamp(this.posCirujano.z, l.minZ, l.maxZ);

    // Atascado contra un mueble: da la ruta por buena y activa
    const avance = this.posCirujano.distanceTo(antes);
    if (this.ruta.length > 0 && avance < dt * 0.4) {
      this.atascado += dt;
      if (this.atascado > 0.9 && this.pendiente) {
        const h = this.pendiente;
        this.posCirujano.copy(h.spot).sub(OFF.sala);
        this.pendiente = null;
        this.ruta = [];
        this.activar(h);
        return;
      }
    } else {
      this.atascado = 0;
    }

    const vel = this.velCirujano.length();
    if (vel > 0.4) this.cirujano.girar(Math.atan2(this.velCirujano.x, this.velCirujano.z), dt);
    this.cirujano.grupo.position.copy(this.posCirujano);
    this.cirujano.actualizar(dt, vel);

    // ¿Cerca de algo con lo que interactuar?
    const cerca = this.controlActivo ? this.hotspotCercano() : null;
    const id = cerca?.id ?? null;
    if (id !== this.cercaActual) {
      this.cercaActual = id;
      this.onCerca(cerca ? { id: cerca.id, etiqueta: cerca.accion.etiqueta } : null);
    }
  }

  private resolverColisiones(p: THREE.Vector3): void {
    const r = 0.42;
    for (const c of this.sala.colisiones) {
      const cx = THREE.MathUtils.clamp(p.x, c.minX, c.maxX);
      const cz = THREE.MathUtils.clamp(p.z, c.minZ, c.maxZ);
      const dx = p.x - cx;
      const dz = p.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          p.x = cx + (dx / d) * r;
          p.z = cz + (dz / d) * r;
        } else {
          // dentro de la caja: sácalo por el lado más cercano
          const izq = p.x - c.minX, der = c.maxX - p.x, arr = p.z - c.minZ, aba = c.maxZ - p.z;
          const m = Math.min(izq, der, arr, aba);
          if (m === izq) p.x = c.minX - r;
          else if (m === der) p.x = c.maxX + r;
          else if (m === arr) p.z = c.minZ - r;
          else p.z = c.maxZ + r;
        }
      }
    }
  }

  /** Coloca al cirujano junto a la camilla y lo deja mirándola (atención al paciente). */
  enfocarPaciente(nombre: string | null): void {
    if (!nombre) {
      this.foco = null;
      return;
    }
    this.foco = { nombre };
    const e = this.pacientes.get(nombre);
    if (!e || this.vista !== 'sala') return;
    const spot = this.puntoDePie(e).sub(OFF.sala);
    this.posCirujano.copy(spot);
    this.velCirujano.set(0, 0, 0);
    this.ruta = [];
    this.cirujano.grupo.position.copy(spot);
    this.cirujano.grupo.rotation.y = e.zona === 'box' ? Math.PI : 0;
    this.sala.grupo.add(this.cirujano.grupo);
  }

  /** El cirujano activo (modo cooperativo) cambia de pijama. */
  fijarCirujanoActivo(indice: number): void {
    this.cirujano.pintarRopa(indice === 0 ? 0x2fb58a : 0x4b8df0);
  }

  // ════════════════════════════════════════════════════════════
  // Etiquetas HTML ancladas
  // ════════════════════════════════════════════════════════════

  private pintarEtiquetaPaciente(e: EntradaPaciente): void {
    const id = `pac:${e.nombre}`;
    let et = this.etiquetas.get(id);
    const nivel = e.estabilidad >= 60 ? 'bien' : e.estabilidad >= 35 ? 'regular' : 'critico';
    const esActivo = this.hotspots.has(`paciente:${e.nombre}`);
    if (!et) {
      const el = document.createElement('button');
      el.type = 'button';
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.irYActivar(`paciente:${e.nombre}`);
      });
      this.capaEtiquetas.appendChild(el);
      et = {
        el,
        vista: 'sala',
        ancla: () => {
          if (e.saliendo || e.llegando) return null;
          return this.posicionPaciente(e).add(new THREE.Vector3(0, e.zona === 'box' ? 2.35 : 2.3, 0));
        },
      };
      this.etiquetas.set(id, et);
    }
    et.el.className = `etq-pac ${nivel}${e.alerta ? ' alerta' : ''}${esActivo ? ' activa' : ''}`;
    const pct = Math.max(2, Math.min(100, Math.round(e.estabilidad)));
    et.el.innerHTML = `<span class="n">${escapar(e.nombre.split(' ')[0] ?? e.nombre)}${e.alerta ? ' ⚠' : ''}</span><span class="b"><i style="width:${pct}%"></i></span>`;
    et.el.style.display = this.vista === 'sala' ? '' : 'none';
  }

  quitarEtiqueta(id: string): void {
    const e = this.etiquetas.get(id);
    if (e) {
      e.el.remove();
      this.etiquetas.delete(id);
    }
  }

  private limpiarEtiquetas(prefijo: string): void {
    for (const id of [...this.etiquetas.keys()]) if (id.startsWith(prefijo)) this.quitarEtiqueta(id);
  }

  private proyectarEtiquetas(): void {
    const W = this.contenedor.clientWidth;
    const H = this.contenedor.clientHeight;
    const v = new THREE.Vector3();
    for (const e of this.etiquetas.values()) {
      if (e.vista !== this.vista) continue;
      const a = e.ancla();
      if (!a) {
        e.el.style.visibility = 'hidden';
        continue;
      }
      v.copy(a).project(this.camara);
      if (v.z > 1 || v.z < -1) {
        e.el.style.visibility = 'hidden';
        continue;
      }
      e.el.style.visibility = 'visible';
      const x = (v.x * 0.5 + 0.5) * W;
      const y = (-v.y * 0.5 + 0.5) * H;
      e.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  // ════════════════════════════════════════════════════════════
  // QUIRÓFANO
  // ════════════════════════════════════════════════════════════

  prepararQuirofano(estabilidad: number): void {
    this.mostrar('quirofano');
    this.quirofano.fijarEstado(estabilidad, false);
  }

  estadoQuirofano(estabilidad: number, imprevisto: boolean): void {
    this.quirofano.fijarEstado(estabilidad, imprevisto);
    if (imprevisto) {
      this.quirofano.destello(COL.rojo);
      this.golpe(0.9);
    } else {
      this.quirofano.destello(COL.cian);
    }
  }

  // ════════════════════════════════════════════════════════════
  // PUERTA DE AMBULANCIAS (IMV)
  // ════════════════════════════════════════════════════════════

  mostrarPuerta(victimas: VictimaImv[]): void {
    const n = victimas.length;
    this.puertaN = n;
    if (this.vista !== 'puerta') this.mostrar('puerta');
    const camillas = this.puerta.ajustarCamillas(n);
    this.victimas.length = 0;
    this.limpiarEtiquetas('vic:');
    camillas.forEach((c, i) => {
      const v = victimas[i]!;
      this.victimas.push(c);
      c.fijarEstabilidad(v.estabilidad);
      c.fijarEtiqueta(v.etiqueta ?? null);
      c.fijarActiva(!!v.activa);
      const el = document.createElement('div');
      el.className = `etq-pac ${v.estabilidad >= 60 ? 'bien' : v.estabilidad >= 35 ? 'regular' : 'critico'}${v.activa ? ' activa' : ''}`;
      const pct = Math.max(2, Math.min(100, Math.round(v.estabilidad)));
      el.innerHTML = `<span class="n">${escapar(v.nombre.split(' ')[0] ?? v.nombre)}</span><span class="b"><i style="width:${pct}%"></i></span>`;
      this.capaEtiquetas.appendChild(el);
      const pos = this.puerta.posicionCamilla(i, n).add(OFF.puerta);
      this.etiquetas.set(`vic:${i}`, { el, vista: 'puerta', ancla: () => pos.clone().add(new THREE.Vector3(0, 2.75, 0)) });
    });
  }

  // ════════════════════════════════════════════════════════════
  // Bucle
  // ════════════════════════════════════════════════════════════

  private bucle = (): void => {
    requestAnimationFrame(this.bucle);
    const dt = Math.min(this.reloj.getDelta(), 0.05);
    this.t += dt;
    this.banco.avanzar(dt);

    const esc = this.escenarios[this.vista];
    esc.actualizar(this.t, dt);
    this.aplicarLuces(esc);

    if (this.vista === 'sala') {
      this.moverAvatar(dt);
      this.patrullar(dt);
      for (const e of this.pacientes.values()) {
        e.camilla?.actualizar(this.t, dt);
        e.persona?.actualizar(dt, 0);
        if (e.camilla && e.zona === 'box' && !e.llegando) this.anillos(e);
      }
    } else if (this.vista === 'puerta') {
      for (const c of this.victimas) c.actualizar(this.t, dt);
    }
    for (let i = this.animaciones.length - 1; i >= 0; i--) {
      if (this.animaciones[i]!(dt)) this.animaciones.splice(i, 1);
    }
    this.pulsarAnillos();
    this.moverCamara(dt);
    this.proyectarEtiquetas();
    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.escena, this.camara);
  };

  private anillos(_e: EntradaPaciente): void {
    /* los anillos se gestionan en pulsarAnillos */
  }

  private pulsarAnillos(): void {
    if (this.vista !== 'sala') return;
    const p = 0.45 + Math.sin(this.t * 4) * 0.25;
    const todos = [
      ...this.sala.bahias.map((b) => b.anillo),
      this.sala.anillos.cafe,
      this.sala.anillos.sofa,
      this.sala.anillos.planta,
    ];
    const activos = new Set<THREE.Mesh>();
    for (const h of this.hotspots.values()) if (h.anillo) activos.add(h.anillo);
    for (const r of todos) {
      const m = r.material as THREE.MeshBasicMaterial;
      m.opacity = activos.has(r) ? p : 0;
    }
  }

  private aplicarLuces(esc: Escenario): void {
    const off = OFF[this.vista];
    for (let i = 0; i < this.pool.length; i++) {
      const l = this.pool[i]!;
      const s = esc.luces[i];
      if (!s) {
        l.intensity = 0;
        continue;
      }
      l.position.copy(s.pos).add(off);
      l.color.setHex(s.color);
      l.intensity = s.intensidad;
      l.distance = s.distancia;
    }
  }

  /** El celador de fondo da vueltas por el servicio a lo suyo. */
  private patrullar(dt: number): void {
    const ruta = [
      new THREE.Vector3(-7, 0, -2.7),
      new THREE.Vector3(7, 0, -2.7),
      new THREE.Vector3(7, 0, 4.6),
      new THREE.Vector3(-7, 0, 4.6),
    ];
    const destino = ruta[this.patrulla.i]!;
    const pos = this.celador.grupo.position;
    const d = destino.clone().sub(pos);
    d.y = 0;
    if (d.length() < 0.2) {
      this.patrulla.i = (this.patrulla.i + 1) % ruta.length;
      return;
    }
    d.normalize();
    pos.addScaledVector(d, 1.7 * dt);
    this.celador.girar(Math.atan2(d.x, d.z), dt);
    this.celador.actualizar(dt, 1.7);
  }
}

function escapar(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** ¿El segmento PQ atraviesa la caja [minX,maxX]×[minZ,maxZ]? */
function segmentoCruzaCaja(px: number, pz: number, qx: number, qz: number, minX: number, maxX: number, minZ: number, maxZ: number): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = qx - px;
  const dz = qz - pz;
  const pasos: Array<[number, number]> = [
    [-dx, px - minX],
    [dx, maxX - px],
    [-dz, pz - minZ],
    [dz, maxZ - pz],
  ];
  for (const [p, q] of pasos) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return true;
}
