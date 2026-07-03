/**
 * Sonido del juego, 100% sintetizado con Web Audio API: ni un fichero
 * de audio, todo osciladores. Sonidos:
 *
 *  - click de interfaz al pulsar opciones
 *  - pitido de monitor cardiaco en bucle durante la cirugía
 *  - sirena de ambulancia en cada llegada
 *  - campanilla de acierto (altas/ingresos correctos, cirugía impecable)
 *  - tono continuo (asistolia) en los éxitus
 *
 * El AudioContext se crea perezosamente en el primer gesto del usuario
 * (política de autoplay) y el silencio se recuerda en localStorage.
 */

const CLAVE_SILENCIO = 'surgeons-night-silencio';

class MotorSonido {
  private ctx: AudioContext | null = null;
  private latidoTimer: number | null = null;
  activo = true;

  constructor() {
    try {
      this.activo = localStorage.getItem(CLAVE_SILENCIO) !== '1';
    } catch {
      /* localStorage puede no estar disponible (file:// raro, incógnito) */
    }
  }

  /** Conecta el botón de la cabecera para silenciar/activar. */
  conectarBoton(boton: HTMLElement | null): void {
    if (!boton) return;
    const pintar = () => {
      boton.textContent = this.activo ? '🔊' : '🔇';
      boton.title = this.activo ? 'Silenciar' : 'Activar sonido';
    };
    pintar();
    boton.addEventListener('click', () => {
      this.activo = !this.activo;
      try {
        localStorage.setItem(CLAVE_SILENCIO, this.activo ? '0' : '1');
      } catch { /* sin persistencia, no pasa nada */ }
      if (!this.activo) this.pararLatido();
      pintar();
    });
  }

  // ── Sonidos ─────────────────────────────────────────────────
  click(): void {
    this.tono({ freq: 1250, dur: 0.035, gain: 0.045, tipo: 'square' });
  }

  /** Un bip de monitor. */
  bip(): void {
    this.tono({ freq: 880, dur: 0.07, gain: 0.05 });
  }

  /** Bucle de monitor cardiaco (rápido = paciente en quirófano sufriendo). */
  empezarLatido(periodoMs = 950): void {
    this.pararLatido();
    if (!this.activo) return;
    this.bip();
    this.latidoTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') this.bip();
    }, periodoMs);
  }

  pararLatido(): void {
    if (this.latidoTimer !== null) {
      clearInterval(this.latidoTimer);
      this.latidoTimer = null;
    }
  }

  /** Sirena bitonal de ambulancia. */
  sirena(): void {
    for (let i = 0; i < 4; i++) {
      this.tono({ freq: 700, dur: 0.2, gain: 0.035, retraso: i * 0.4, tipo: 'triangle' });
      this.tono({ freq: 470, dur: 0.2, gain: 0.035, retraso: i * 0.4 + 0.2, tipo: 'triangle' });
    }
  }

  /** Arpegio de acierto. */
  campanilla(): void {
    [523.25, 659.25, 783.99].forEach((f, i) =>
      this.tono({ freq: f, dur: 0.16, gain: 0.05, retraso: i * 0.09 }),
    );
  }

  /** Asistolia: el tono continuo del monitor. */
  asistolia(): void {
    this.pararLatido();
    this.tono({ freq: 940, dur: 1.4, gain: 0.05 });
  }

  // ── Utilería ────────────────────────────────────────────────
  private asegurarContexto(): AudioContext | null {
    if (!this.activo) return null;
    if (typeof AudioContext === 'undefined') return null;
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tono(opts: { freq: number; dur: number; gain: number; retraso?: number; tipo?: OscillatorType }): void {
    const ctx = this.asegurarContexto();
    if (!ctx) return;
    const t0 = ctx.currentTime + (opts.retraso ?? 0);
    const osc = ctx.createOscillator();
    const gan = ctx.createGain();
    osc.type = opts.tipo ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    gan.gain.setValueAtTime(0, t0);
    gan.gain.linearRampToValueAtTime(opts.gain, t0 + 0.008);
    gan.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(gan).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.05);
  }
}

export const sonido = new MotorSonido();
