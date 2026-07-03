/**
 * ShiftEngine: monta la guardia y arranca el bucle principal.
 *
 * Composición: recibe el adaptador de IO (terminal, web...), crea el RNG
 * (opcionalmente sembrado), el contexto, la fábrica de pacientes y la
 * máquina de estados; programa las llegadas y las ocupaciones externas
 * de quirófano, y ejecuta.
 */
import { PatientFactory } from '../factories/PatientFactory.js';
import { TriageState } from '../engine/TriageState.js';
import { cian, gris, negrita } from '../ui/ansi.js';
import { lineaSeparadora } from '../ui/hud.js';
import type { IO } from './io.js';
import { crearRng, GameContext } from './GameContext.js';
import { MaquinaEstados } from './StateMachine.js';

export type ModoJuego = 'adjunto' | 'residente' | 'negra';
export type RitmoJuego = 'turnos' | 'real';

export class ShiftEngine {
  private readonly ctx: GameContext;
  private readonly rng: () => number;

  constructor(
    private readonly io: IO,
    semilla?: number,
    private modo?: ModoJuego,
    private ritmo?: RitmoJuego,
  ) {
    this.rng = crearRng(semilla ?? (Date.now() & 0x7fffffff));
    this.ctx = new GameContext(this.rng, io);
  }

  async iniciar(): Promise<void> {
    this.pintarPortada();

    if (this.modo === undefined) {
      this.modo = await this.io.elegir<ModoJuego>('¿Con qué nivel sales a la guardia?', [
        {
          etiqueta: 'Residente',
          detalle: 'un adjunto te da pistas; ideal para aprender (también sin ser sanitario)',
          valor: 'residente',
        },
        {
          etiqueta: 'Adjunto',
          detalle: 'sin red de seguridad, puntuación completa',
          valor: 'adjunto',
        },
        {
          etiqueta: 'Guardia negra',
          detalle: 'atípicas ×2, hospital saturado, más complicaciones; puntuación ×1,2',
          valor: 'negra',
        },
      ]);
    }
    this.ctx.modoResidente = this.modo === 'residente';
    this.ctx.modoNegra = this.modo === 'negra';
    if (this.ctx.modoResidente) {
      this.io.escribir(
        gris('\n  Modo residente: tu adjunto sugerirá pruebas, dudará en voz alta si te') +
          gris('\n  equivocas de destino y atenderá hasta 3 llamadas en quirófano.'),
      );
    }
    if (this.ctx.modoNegra) {
      this.ctx.hospital.camasReaTotales = 2;
      this.ctx.hospital.camasReaLibres = 2;
      this.io.escribir(
        gris('\n  Guardia negra: la noche que se cuenta en el café de los cambios de turno.') +
          gris('\n  Más pacientes, presentaciones engañosas al doble, una cama de REA menos') +
          gris('\n  y el quirófano más disputado. Suerte. La necesitarás.'),
      );
    }

    // La guardia se genera tras elegir modo: en residente las atípicas bajan a
    // la mitad; en guardia negra se duplican y llegan más pacientes.
    const atipicidad = this.ctx.modoResidente ? 0.5 : this.ctx.modoNegra ? 2 : 1;
    const fabrica = new PatientFactory(this.rng, atipicidad, this.ctx.modoNegra ? 2 : 0);
    this.ctx.programarLlegadas(fabrica.generarLlegadasDeGuardia());

    // El otro equipo también opera: franjas en las que roban quirófano.
    const inicio1 = 180 + Math.floor(this.rng() * 300);
    const inicio2 = 720 + Math.floor(this.rng() * 300);
    this.ctx.programarOcupacionExterna(inicio1, inicio1 + 120, 'politraumatizado de tráfico');
    this.ctx.programarOcupacionExterna(inicio2, inicio2 + 90, 'fractura abierta de fémur');
    if (this.ctx.modoNegra) {
      const inicio3 = 1080 + Math.floor(this.rng() * 200);
      this.ctx.programarOcupacionExterna(inicio3, inicio3 + 110, 'aneurisma de aorta roto');
    }

    // Tiempo real: solo si el adaptador tiene la capacidad (la web sí, la
    // terminal no). La guardia avanza sola mientras deliberas.
    if (this.io.iniciarTiempoReal) {
      if (this.ritmo === undefined) {
        this.ritmo = await this.io.elegir<RitmoJuego>('¿Cómo quieres vivir la guardia?', [
          {
            etiqueta: 'Por turnos',
            detalle: 'clásico: el tiempo solo corre cuando actúas',
            valor: 'turnos',
          },
          {
            etiqueta: 'Tiempo real',
            detalle: 'arcade: 1 segundo = 1 minuto; la guardia no espera a nadie',
            valor: 'real',
          },
        ]);
      }
      if (this.ritmo === 'real') {
        this.io.iniciarTiempoReal(() => ({
          avisos: this.ctx.avanzarTiempo(1),
          tablero: this.ctx.tablero(),
          minuto: this.ctx.minuto,
          minutosRestantes: Math.max(0, this.ctx.duracionGuardia - this.ctx.minuto),
          terminada: this.ctx.guardiaTerminada,
        }));
        this.io.escribir(
          gris('\n  Tiempo real activado: el reloj de arriba es tu enemigo. Los pacientes') +
            gris('\n  se deterioran mientras dudas, y dudar también es una decisión.'),
        );
      }
    }

    await this.io.pausa('Pulsa Intro para fichar y empezar la guardia...');
    await new MaquinaEstados().ejecutar(new TriageState(), this.ctx);
  }

  private pintarPortada(): void {
    this.io.escena?.('portada');
    this.io.escribir(lineaSeparadora());
    this.io.escribir(negrita(cian("   SURGEON'S NIGHT — El Turno de Guardia")));
    this.io.escribir(lineaSeparadora());
    this.io.escribir(`
  Son las ${negrita('08:00')}. Empiezan tus ${negrita('24 horas')} como cirujano general
  de guardia en un hospital público. Tienes ${negrita('2 quirófanos')}, ${negrita('3 camas de REA')}
  y un busca que no va a dejar de sonar.

  ${negrita('Reglas de supervivencia:')}
   • Todo cuesta tiempo, y los pacientes no tratados se deterioran.
   • La prueba adecuada confirma el diagnóstico; operar a ciegas se paga.
   • No todo dolor abdominal se opera: dar el alta también es decidir.
   • Vigila tu ${negrita('energía')} y tu ${negrita('estrés')}: con fatiga, hasta la decisión
     correcta puede salir mal. El café es tu amigo. Dosifícalo.

  ${gris('¿No eres sanitario? Empieza en modo Residente: el adjunto te guía y')}
  ${gris('cada caso te deja su perla docente. Se aprende operando.')}

  ${gris('Sobrevive hasta las 08:00 de mañana. Suerte, doctor/a.')}
`);
  }
}
