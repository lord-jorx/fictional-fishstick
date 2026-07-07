/**
 * La capa de juego de verdad: el plano de urgencias renderizado con
 * Phaser (motor 2D con el que se publican juegos en web y Steam), no con
 * divs. El cirujano es un sprite con físicas arcade que camina por el
 * servicio; pisar una zona equivale a elegir esa acción.
 *
 * Todas las texturas se dibujan proceduralmente en tiempo de ejecución
 * (Phaser.Graphics → generateTexture): ni un solo fichero de imagen, para
 * respetar la CSP del Artifact y mantener el juego autocontenido.
 *
 * La lógica clínica sigue viviendo en el motor (ports & adapters); esto es
 * solo el adaptador visual. El terminal ni se entera de que Phaser existe.
 */
import Phaser from 'phaser';
import { sonido } from '../sonido.js';

/** Una zona pisable del plano (box de paciente o estancia del servicio). */
export interface ZonaJuego {
  idx: number;
  etiqueta: string;
  icono: string;
  clase: 'box' | 'planta' | 'quirofano' | 'control' | 'cafe' | 'sofa' | 'entrada';
  /** Estabilidad 0-100 (solo boxes) para pintar el monitor y el color. */
  estabilidad?: number;
  alerta?: boolean;
  recien?: boolean;
}

/** Una víctima del IMV esperando su etiqueta en la puerta de ambulancias. */
export interface VictimaJuego {
  nombre: string;
  estabilidad: number;
  etiqueta?: 'rojo' | 'amarillo' | 'verde' | 'negro';
}

export interface ConfigSala {
  zonas: ZonaJuego[];
  /** Se llama (una vez) cuando el cirujano pisa la zona idx. */
  onElegir: (idx: number) => void;
}

const ANCHO = 760;
const ALTO = 300;

const COLOR_ZONA: Record<ZonaJuego['clase'], number> = {
  box: 0x1c1610,
  planta: 0x161a10,
  quirofano: 0x1a1016,
  control: 0x121a1a,
  cafe: 0x1a1509,
  sofa: 0x14100a,
  entrada: 0x120d08,
};

/** Convierte estabilidad en el color del monitor/halo del paciente. */
function colorEstabilidad(e: number): number {
  if (e >= 60) return 0x97b077;
  if (e >= 35) return 0xd9b36a;
  return 0xc9645a;
}

class SalaScene extends Phaser.Scene {
  private cfg!: ConfigSala;
  private cirujano!: Phaser.Physics.Arcade.Sprite;
  private cursores!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasWASD!: Record<string, Phaser.Input.Keyboard.Key>;
  private zonasFisicas: Array<{ idx: number; zona: Phaser.GameObjects.Zone }> = [];
  private resuelto = false;
  private ultimoPaso = 0;
  private dirTactil = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super('sala');
  }

  init(cfg: ConfigSala): void {
    this.cfg = cfg;
    this.resuelto = false;
    this.zonasFisicas = [];
    this.dirTactil.set(0, 0);
  }

  create(): void {
    this.dibujarTexturas();
    this.add.image(0, 0, 'suelo').setOrigin(0, 0).setDepth(-10);

    // Un celador de fondo que cruza el pasillo, a lo suyo (ambiente).
    const celador = this.add.image(40, ALTO - 40, 'celador').setAlpha(0.85).setDepth(1);
    this.tweens.add({
      targets: celador, x: ANCHO - 60, duration: 9000, yoyo: true,
      repeat: -1, ease: 'Sine.InOut',
    });

    this.pintarZonas();

    // El cirujano: sprite con físicas, parte del centro del servicio.
    this.cirujano = this.physics.add.sprite(ANCHO / 2, ALTO - 60, 'cirujano');
    this.cirujano.setCollideWorldBounds(true).setDepth(5);
    (this.cirujano.body as Phaser.Physics.Arcade.Body).setSize(22, 20).setOffset(4, 28);

    // Solapamiento con cada zona → elegir esa acción.
    for (const { idx, zona } of this.zonasFisicas) {
      this.physics.add.overlap(this.cirujano, zona, () => this.elegir(idx));
    }

    this.cursores = this.input.keyboard!.createCursorKeys();
    this.teclasWASD = this.input.keyboard!.addKeys('W,A,S,D,Z,Q') as Record<string, Phaser.Input.Keyboard.Key>;

    // Clic/toque en una zona: el cirujano va andando hasta ella.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const objetivo = this.zonasFisicas.find(({ zona }) => {
        const b = zona.getBounds();
        return b.contains(p.worldX, p.worldY);
      });
      if (objetivo) this.caminarHacia(objetivo.zona, objetivo.idx);
    });
  }

  override update(_t: number, dt: number): void {
    if (this.resuelto || !this.cirujano.body) return;
    const v = 150;
    let vx = this.dirTactil.x;
    let vy = this.dirTactil.y;
    const k = this.teclasWASD;
    if (this.cursores.left.isDown || k.A?.isDown || k.Q?.isDown) vx -= 1;
    if (this.cursores.right.isDown || k.D?.isDown) vx += 1;
    if (this.cursores.up.isDown || k.W?.isDown || k.Z?.isDown) vy -= 1;
    if (this.cursores.down.isDown || k.S?.isDown) vy += 1;

    const mov = new Phaser.Math.Vector2(vx, vy);
    if (mov.lengthSq() > 0) {
      mov.normalize().scale(v);
      this.cirujano.setVelocity(mov.x, mov.y);
      this.ultimoPaso += dt;
      if (this.ultimoPaso > 300) {
        this.ultimoPaso = 0;
        sonido.pasos();
      }
      // Balanceo de zancada mientras anda.
      this.cirujano.setScale(1, 1 + Math.sin(this.time.now / 90) * 0.04);
    } else {
      this.cirujano.setVelocity(0, 0);
      this.cirujano.setScale(1, 1);
    }
  }

  /** Fija la dirección de la cruceta táctil (dx,dy en -1..1). */
  fijarTactil(dx: number, dy: number): void {
    this.dirTactil.set(dx, dy);
  }

  private elegir(idx: number): void {
    if (this.resuelto) return;
    this.resuelto = true;
    this.cirujano.setVelocity(0, 0);
    this.cameras.main.flash(180, 60, 50, 30);
    this.time.delayedCall(120, () => this.cfg.onElegir(idx));
  }

  private caminarHacia(zona: Phaser.GameObjects.Zone, idx: number): void {
    if (this.resuelto) return;
    void idx;
    const destino = zona.getCenter();
    this.dirTactil.set(0, 0);
    this.physics.moveTo(this.cirujano, destino.x, destino.y + 20, 150);
    sonido.pasos();
  }

  // ── Dibujo procedural de todas las texturas ──────────────────
  private dibujarTexturas(): void {
    // Suelo de baldosa hospitalaria con junta y viñeteado.
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x14100a, 1).fillRect(0, 0, ANCHO, ALTO);
    g.lineStyle(1, 0x1f1810, 1);
    for (let x = 0; x <= ANCHO; x += 34) g.lineBetween(x, 0, x, ALTO);
    for (let y = 0; y <= ALTO; y += 34) g.lineBetween(0, y, ANCHO, y);
    g.fillStyle(0x000000, 0.28).fillRect(0, 0, ANCHO, 10).fillRect(0, ALTO - 10, ANCHO, 10);
    g.generateTexture('suelo', ANCHO, ALTO);
    g.destroy();

    this.texturaCirujano();
    this.texturaCelador();
  }

  private texturaCirujano(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // pijama verde, gorro, cara, brazos, piernas
    g.fillStyle(0x4f7a63, 1).fillRoundedRect(7, 18, 16, 16, 4);   // torso
    g.fillStyle(0x5d8a72, 1).fillRoundedRect(4, 19, 4, 12, 2);    // brazo izq
    g.fillStyle(0x5d8a72, 1).fillRoundedRect(22, 19, 4, 12, 2);   // brazo der
    g.fillStyle(0xd9ab7f, 1).fillCircle(15, 12, 6.5);             // cara
    g.fillStyle(0x4f7a63, 1).fillRect(8, 5, 14, 5);               // gorro
    g.fillStyle(0xe8e2d2, 1).fillRect(10, 15, 10, 3);             // mascarilla
    g.fillStyle(0x3e6252, 1).fillRoundedRect(9, 34, 5, 12, 2);    // pierna izq
    g.fillStyle(0x3e6252, 1).fillRoundedRect(16, 34, 5, 12, 2);   // pierna der
    g.generateTexture('cirujano', 30, 48);
    g.destroy();
  }

  private texturaCelador(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x9aa1a8, 1).fillRoundedRect(6, 15, 14, 14, 3);
    g.fillStyle(0xc99b72, 1).fillCircle(13, 9, 5.5);
    g.fillStyle(0x8a8f94, 1).fillRect(7, 5, 12, 3);
    g.fillStyle(0x6d7378, 1).fillRoundedRect(8, 29, 4, 10, 2).fillRoundedRect(14, 29, 4, 10, 2);
    g.generateTexture('celador', 26, 42);
    g.destroy();
  }

  private texturaPaciente(clave: string, estabilidad: number): void {
    if (this.textures.exists(clave)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const col = colorEstabilidad(estabilidad);
    g.fillStyle(0x6d6046, 1).fillRoundedRect(2, 20, 56, 10, 3);    // camilla
    g.fillStyle(0x4a4232, 1).fillRect(6, 30, 4, 8).fillRect(48, 30, 4, 8); // patas
    g.fillStyle(0xd9ab7f, 1).fillCircle(12, 15, 6);                 // cabeza
    g.fillStyle(0x9fb4c4, 1).fillRoundedRect(16, 12, 38, 10, 3);    // manta
    g.fillStyle(0x0b0f14, 1).fillRoundedRect(44, 3, 15, 8, 2);      // monitor
    g.fillStyle(col, 1).fillRect(46, 5, Math.max(2, Math.round(estabilidad / 8)), 4);
    g.generateTexture(clave, 62, 40);
    g.destroy();
  }

  private pintarZonas(): void {
    const cols = 5;
    for (const z of this.cfg.zonas) {
      const geom = this.geometriaZona(z);
      const { x, y, w, h } = geom;

      const rect = this.add.rectangle(x, y, w, h, COLOR_ZONA[z.clase], 0.72)
        .setStrokeStyle(1, z.recien ? 0xcfa257 : 0x4a3f2c)
        .setOrigin(0, 0).setDepth(0);
      if (z.clase !== 'box' && z.idx < 0) rect.setAlpha(0.35);

      // Etiqueta e icono
      this.add.text(x + w / 2, y + 6, z.icono, { fontSize: '20px' }).setOrigin(0.5, 0).setDepth(2);
      this.add.text(x + w / 2, y + h - 14, z.etiqueta, {
        fontFamily: 'monospace', fontSize: '9px', color: '#8a7f6a',
      }).setOrigin(0.5, 0).setDepth(2);

      if (z.clase === 'box' && z.estabilidad !== undefined) {
        const clave = `pac${Math.round(z.estabilidad / 10)}`;
        this.texturaPaciente(clave, z.estabilidad);
        const cama = this.add.image(x + w / 2, y + h / 2, clave).setDepth(1);
        cama.setDisplaySize(w * 0.8, w * 0.8 * (40 / 62));
        if (z.estabilidad < 35) {
          this.tweens.add({ targets: cama, angle: { from: -2, to: 2 }, duration: 500, yoyo: true, repeat: -1 });
        }
        if (z.recien) {
          cama.setAlpha(0);
          this.tweens.add({ targets: cama, alpha: 1, x: { from: x + w / 2 + 60, to: x + w / 2 }, duration: 900, ease: 'Cubic.Out' });
        }
      }

      // Zona física invisible para el solapamiento (solo si es pisable).
      if (z.idx >= 0) {
        const zonaFis = this.add.zone(x, y, w, h).setOrigin(0, 0);
        this.physics.add.existing(zonaFis, true);
        this.zonasFisicas.push({ idx: z.idx, zona: zonaFis });
      }
    }
    void cols;
  }

  private geometriaZona(z: ZonaJuego): { x: number; y: number; w: number; h: number } {
    const pct = (p: number, total: number) => (p / 100) * total;
    // Layout en porcentajes, calcado del plano DOM que ya funcionaba.
    switch (z.clase) {
      case 'box': {
        const orden = this.cfg.zonas.filter((o) => o.clase === 'box').indexOf(z);
        return { x: pct(2 + orden * 16.4, ANCHO), y: pct(4, ALTO), w: pct(15, ANCHO), h: pct(47, ALTO) };
      }
      case 'entrada': return { x: pct(84.5, ANCHO), y: pct(4, ALTO), w: pct(13.5, ANCHO), h: pct(47, ALTO) };
      case 'planta': return { x: pct(2, ANCHO), y: pct(62, ALTO), w: pct(12, ANCHO), h: pct(34, ALTO) };
      case 'quirofano': return { x: pct(16, ANCHO), y: pct(62, ALTO), w: pct(14, ANCHO), h: pct(34, ALTO) };
      case 'control': return { x: pct(36, ANCHO), y: pct(62, ALTO), w: pct(26, ANCHO), h: pct(34, ALTO) };
      case 'sofa': return { x: pct(64, ANCHO), y: pct(62, ALTO), w: pct(15, ANCHO), h: pct(34, ALTO) };
      case 'cafe': return { x: pct(81, ANCHO), y: pct(62, ALTO), w: pct(16, ANCHO), h: pct(34, ALTO) };
    }
  }

}

/**
 * Fachada del juego Phaser: crea el canvas una vez y reinicia la escena
 * con nuevos datos en cada menú de sala. WebIO habla solo con esto.
 */
export class PhaserSala {
  private juego: Phaser.Game | null = null;
  private arrancada = false;
  private cfgPendiente: ConfigSala | null = null;
  readonly contenedor: HTMLElement;

  constructor() {
    this.contenedor = document.createElement('div');
    this.contenedor.id = 'lienzo-sala';
  }

  /** (Re)monta el plano con las zonas y el callback de elección dados. */
  montar(cfg: ConfigSala): void {
    this.cfgPendiente = cfg;
    if (!this.juego) {
      this.juego = new Phaser.Game({
        type: Phaser.AUTO,
        parent: this.contenedor,
        width: ANCHO,
        height: ALTO,
        transparent: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
        physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
        audio: { noAudio: true }, // el sonido lo lleva nuestro motor de Web Audio
        banner: false,
      });
      // La escena se añade cuando el motor ha arrancado (evita la carrera de boot).
      this.juego.events.once('ready', () => {
        this.juego!.scene.add('sala', SalaScene, true, this.cfgPendiente!);
        this.arrancada = true;
      });
    } else if (this.arrancada) {
      this.juego.scene.start('sala', cfg);
    }
    // Si aún está arrancando, el handler 'ready' usará cfgPendiente.
  }

  /** Empuja la dirección de la cruceta táctil a la escena viva. */
  fijarTactil(dx: number, dy: number): void {
    const escena = this.juego?.scene.getScene('sala') as SalaScene | undefined;
    escena?.fijarTactil?.(dx, dy);
  }

  destruir(): void {
    this.juego?.destroy(true);
    this.juego = null;
  }
}
