/**
 * La puerta de ambulancias durante un incidente de múltiples víctimas,
 * renderizada con Phaser: las víctimas llegan en camilla y esperan su
 * etiqueta. Al asignarla, la tarjeta se colorea (ROJO/AMARILLO/VERDE/NEGRO)
 * y la víctima entra rodando al servicio.
 *
 * Es una capa puramente visual: el triaje se decide en los menús DOM; esta
 * escena se limita a reflejar el estado que le pasa el motor.
 */
import Phaser from 'phaser';
import type { VictimaImv } from '../../core/io.js';

const ANCHO = 760;
const ALTO = 220;

const COLOR_ETIQUETA: Record<NonNullable<VictimaImv['etiqueta']>, number> = {
  rojo: 0xc0433a,
  amarillo: 0xd9b23f,
  verde: 0x5a9e57,
  negro: 0x2b2b2b,
};

class TriajeScene extends Phaser.Scene {
  private victimas: VictimaImv[] = [];

  constructor() {
    super('triaje');
  }

  init(data: { victimas: VictimaImv[] }): void {
    this.victimas = data.victimas ?? [];
  }

  create(): void {
    this.dibujarTexturas();
    this.add.image(0, 0, 'asfalto').setOrigin(0, 0).setDepth(-10);

    // La ambulancia con las puertas abiertas a la izquierda.
    this.add.image(64, 70, 'ambu').setDepth(0);
    this.add.text(64, 118, '🚑 061', { fontFamily: 'monospace', fontSize: '12px', color: '#9c8e72' })
      .setOrigin(0.5, 0).setDepth(1);
    this.add.text(ANCHO / 2, 8, 'PUERTA DE AMBULANCIAS — TRIAJE', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8a7f6a',
    }).setOrigin(0.5, 0).setDepth(2);

    this.pintarVictimas();
  }

  /** Refresca el estado (etiquetas nuevas, víctima activa) sin recrear la escena. */
  actualizar(victimas: VictimaImv[]): void {
    this.victimas = victimas;
    this.children.removeAll();
    this.add.image(0, 0, 'asfalto').setOrigin(0, 0).setDepth(-10);
    this.add.image(64, 70, 'ambu').setDepth(0);
    this.add.text(ANCHO / 2, 8, 'PUERTA DE AMBULANCIAS — TRIAJE', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8a7f6a',
    }).setOrigin(0.5, 0).setDepth(2);
    this.pintarVictimas();
  }

  private pintarVictimas(): void {
    const n = this.victimas.length;
    const x0 = 150;
    const paso = Math.min(105, (ANCHO - x0 - 20) / Math.max(1, n));
    this.victimas.forEach((v, i) => {
      const etiquetada = !!v.etiqueta;
      // Los ya etiquetados se desplazan un poco hacia dentro (entran al servicio).
      const x = x0 + i * paso + (etiquetada ? 14 : 0);
      const y = 96;

      const clave = `cam${Math.round(v.estabilidad / 12)}`;
      this.texturaCamilla(clave, v.estabilidad);
      const cam = this.add.image(x, y, clave).setDepth(2);
      if (etiquetada) cam.setAlpha(0.9);

      // Halo de la víctima activa (la que estás etiquetando ahora).
      if (v.activa) {
        const anillo = this.add.rectangle(x, y, 74, 52).setStrokeStyle(2, 0xcfa257).setDepth(1);
        this.tweens.add({ targets: anillo, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
      }

      // La tarjeta de etiqueta colgando sobre la camilla.
      const col = v.etiqueta ? COLOR_ETIQUETA[v.etiqueta] : 0x1a150d;
      this.add.rectangle(x, y - 34, 26, 18, col, v.etiqueta ? 1 : 0.5)
        .setStrokeStyle(1, v.etiqueta ? 0x000000 : 0x4a3f2c).setDepth(3);
      if (v.etiqueta === 'negro') {
        this.add.text(x, y - 34, '✝', { fontSize: '12px', color: '#cccccc' }).setOrigin(0.5).setDepth(4);
      }

      // Nombre (primer nombre) bajo la camilla.
      this.add.text(x, y + 26, v.nombre.split(' ')[0] ?? v.nombre, {
        fontFamily: 'monospace', fontSize: '10px', color: '#b6a988',
      }).setOrigin(0.5, 0).setDepth(3);
    });
  }

  private dibujarTexturas(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x0f0b07, 1).fillRect(0, 0, ANCHO, ALTO);
    // asfalto mojado con líneas de aparcamiento tenues
    g.lineStyle(2, 0x2a2114, 0.7);
    for (let x = 120; x < ANCHO; x += 105) g.lineBetween(x, 40, x, ALTO - 10);
    g.fillStyle(0x000000, 0.3).fillRect(0, 0, ANCHO, 22);
    g.generateTexture('asfalto', ANCHO, ALTO);
    g.destroy();

    const a = this.make.graphics({ x: 0, y: 0 }, false);
    a.fillStyle(0xdedad0, 1).fillRoundedRect(0, 6, 96, 44, 5);
    a.fillStyle(0xc0433a, 1).fillRect(70, 6, 26, 44);
    a.fillStyle(0xffffff, 1).fillRect(80, 22, 6, 12).fillRect(77, 26, 12, 4);
    a.fillStyle(0x1b2733, 1).fillRect(8, 14, 20, 14);
    a.fillStyle(0x0b0f14, 1).fillCircle(24, 52, 8).fillCircle(78, 52, 8);
    a.fillStyle(0x3a3f45, 1).fillCircle(24, 52, 3).fillCircle(78, 52, 3);
    a.generateTexture('ambu', 100, 62);
    a.destroy();
  }

  private texturaCamilla(clave: string, estabilidad: number): void {
    if (this.textures.exists(clave)) return;
    const col = estabilidad >= 60 ? 0x97b077 : estabilidad >= 35 ? 0xd9b36a : 0xc9645a;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x6d6046, 1).fillRoundedRect(2, 20, 56, 9, 3);
    g.fillStyle(0x4a4232, 1).fillRect(6, 29, 3, 7).fillRect(50, 29, 3, 7);
    g.fillStyle(0xd9ab7f, 1).fillCircle(12, 15, 5.5);
    g.fillStyle(0x9fb4c4, 1).fillRoundedRect(16, 12, 38, 9, 3);
    g.fillStyle(0x0b0f14, 1).fillRoundedRect(44, 3, 14, 7, 2);
    g.fillStyle(col, 1).fillRect(46, 5, Math.max(2, Math.round(estabilidad / 9)), 3);
    g.generateTexture(clave, 60, 38);
    g.destroy();
  }
}

/** Fachada del canvas de triaje: se crea al empezar el IMV y se actualiza por etiqueta. */
export class PhaserTriaje {
  private juego: Phaser.Game | null = null;
  private arrancada = false;
  private pendiente: VictimaImv[] = [];
  readonly contenedor: HTMLElement;

  constructor() {
    this.contenedor = document.createElement('div');
    this.contenedor.id = 'lienzo-triaje';
  }

  montar(victimas: VictimaImv[]): void {
    this.pendiente = victimas;
    if (!this.juego) {
      this.juego = new Phaser.Game({
        type: Phaser.AUTO,
        parent: this.contenedor,
        width: ANCHO,
        height: ALTO,
        transparent: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
        audio: { noAudio: true },
        banner: false,
      });
      this.juego.events.once('ready', () => {
        this.juego!.scene.add('triaje', TriajeScene, true, { victimas: this.pendiente });
        this.arrancada = true;
      });
    } else if (this.arrancada) {
      const escena = this.juego.scene.getScene('triaje') as TriajeScene | undefined;
      escena?.actualizar(victimas);
    }
  }

  destruir(): void {
    this.juego?.destroy(true);
    this.juego = null;
    this.arrancada = false;
    this.contenedor.remove();
  }
}
