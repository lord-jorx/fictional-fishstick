/**
 * ShiftEngine: monta la guardia y arranca el bucle principal.
 *
 * Composición: crea el RNG (opcionalmente sembrado), el contexto,
 * la fábrica de pacientes y la máquina de estados; programa las
 * llegadas y las ocupaciones externas de quirófano, y ejecuta.
 */
import { PatientFactory } from '../factories/PatientFactory.js';
import { TriageState } from '../engine/TriageState.js';
import { cian, gris, negrita } from '../ui/ansi.js';
import { lineaSeparadora } from '../ui/hud.js';
import { pausa } from '../ui/prompt.js';
import { crearRng, GameContext } from './GameContext.js';
import { MaquinaEstados } from './StateMachine.js';
import { elegir } from '../ui/prompt.js';

export type ModoJuego = 'adjunto' | 'residente';

export class ShiftEngine {
  private readonly ctx: GameContext;

  constructor(semilla?: number, private modo?: ModoJuego) {
    const rng = crearRng(semilla ?? (Date.now() & 0x7fffffff));
    this.ctx = new GameContext(rng);

    const fabrica = new PatientFactory(rng);
    this.ctx.programarLlegadas(fabrica.generarLlegadasDeGuardia());

    // El otro equipo también opera: dos franjas en las que roban quirófano.
    const inicio1 = 180 + Math.floor(rng() * 300);
    const inicio2 = 720 + Math.floor(rng() * 300);
    this.ctx.programarOcupacionExterna(inicio1, inicio1 + 120, 'politraumatizado de tráfico');
    this.ctx.programarOcupacionExterna(inicio2, inicio2 + 90, 'fractura abierta de fémur');
  }

  async iniciar(): Promise<void> {
    this.pintarPortada();

    if (this.modo === undefined) {
      this.modo = await elegir<ModoJuego>('¿Con qué nivel sales a la guardia?', [
        {
          etiqueta: 'Adjunto',
          detalle: 'sin red de seguridad, puntuación completa',
          valor: 'adjunto',
        },
        {
          etiqueta: 'Residente',
          detalle: 'un adjunto localizable te da pistas; puntuación tutelada',
          valor: 'residente',
        },
      ]);
    }
    this.ctx.modoResidente = this.modo === 'residente';
    if (this.ctx.modoResidente) {
      console.log(
        gris('\n  Modo residente: tu adjunto sugerirá pruebas, dudará en voz alta si te') +
          gris('\n  equivocas de destino y atenderá hasta 3 llamadas en quirófano.'),
      );
    }

    await pausa('Pulsa Intro para fichar y empezar la guardia...');
    await new MaquinaEstados().ejecutar(new TriageState(), this.ctx);
  }

  private pintarPortada(): void {
    console.log(lineaSeparadora());
    console.log(negrita(cian("   SURGEON'S NIGHT — El Turno de Guardia")));
    console.log(lineaSeparadora());
    console.log(`
  Son las ${negrita('08:00')}. Empiezan tus ${negrita('24 horas')} como cirujano general
  de guardia en un hospital público. Tienes ${negrita('2 quirófanos')}, ${negrita('3 camas de REA')}
  y un busca que no va a dejar de sonar.

  ${negrita('Reglas de supervivencia:')}
   • Todo cuesta tiempo, y los pacientes no tratados se deterioran.
   • La prueba adecuada confirma el diagnóstico; operar a ciegas se paga.
   • No todo dolor abdominal se opera: dar el alta también es decidir.
   • Vigila tu ${negrita('energía')} y tu ${negrita('estrés')}: con fatiga, hasta la decisión
     correcta puede salir mal. El café es tu amigo. Dosifícalo.

  ${gris('Sobrevive hasta las 08:00 de mañana. Suerte, doctor/a.')}
`);
  }
}
