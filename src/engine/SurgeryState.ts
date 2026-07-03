/**
 * SurgeryState: el minijuego de decisiones intraoperatorias.
 *
 * La cirugía se presenta por pasos; en cada paso surge un evento o
 * complicación con varias técnicas posibles. La fatiga y el estrés del
 * cirujano añaden una probabilidad OCULTA de fallo incluso cuando la
 * decisión es correcta: a las 5 de la mañana, las manos no son las mismas.
 */
import { GameContext } from '../core/GameContext.js';
import type { GameState } from '../core/StateMachine.js';
import type { OpcionQuirurgica, Paciente } from '../core/types.js';
import { amarillo, cian, fondoRojo, gris, negrita, rojo, verde } from '../ui/ansi.js';
import { barra, lineaSeparadora } from '../ui/hud.js';
import { elegir, pausa } from '../ui/prompt.js';
import { TriageState } from './TriageState.js';

export class SurgeryState implements GameState {
  readonly nombre = 'quirofano';

  constructor(private readonly paciente: Paciente) {}

  async run(ctx: GameContext): Promise<GameState | null> {
    const p = this.paciente;
    const plan = p.patologia.cirugia!;

    // El paciente pasa a quirófano: sale de la sala de espera.
    const i = ctx.salaEspera.indexOf(p);
    if (i >= 0) ctx.salaEspera.splice(i, 1);
    ctx.hospital.quirofanosLibres--;

    console.log('\n' + lineaSeparadora());
    console.log(`  ${negrita(cian('🔪 QUIRÓFANO'))} — ${negrita(plan.nombre)}`);
    console.log(`  Paciente: ${p.nombre}, ${p.edad} años. ${gris(p.patologia.nombre)}`);
    console.log(lineaSeparadora());

    if (!p.diagnosticoConfirmado) {
      p.estabilidad = Math.max(1, p.estabilidad - 8);
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 8);
      console.log(
        amarillo('Entras a quirófano SIN confirmación diagnóstica. La incertidumbre se paga: -8 estabilidad, +estrés.'),
      );
    }

    let perfecta = true;

    for (const [n, paso] of plan.pasos.entries()) {
      console.log(`\n${negrita(`PASO ${n + 1}/${plan.pasos.length}: ${paso.titulo}`)}`);
      console.log(`  Estabilidad del paciente ${barra(p.estabilidad, false, 12)}   Tu energía ${barra(ctx.cirujano.energia, false, 12)}`);
      console.log(`\n  ${amarillo('EVENTO:')} ${paso.evento}`);

      const opciones = this.barajar(ctx, paso.opciones);
      const eleccion = await elegir(
        '¿Cómo procedes?',
        opciones.map((op) => ({ etiqueta: op.texto, valor: op })),
      );

      p.estabilidad = Math.min(100, Math.max(0, p.estabilidad + eleccion.deltaEstabilidad));
      ctx.cirujano.estres = Math.min(100, Math.max(0, ctx.cirujano.estres + eleccion.deltaEstres));

      if (eleccion.correcta) {
        console.log(verde(`  ✔ ${eleccion.resultado}`));
        // Penalización oculta por fatiga/estrés: la decisión era correcta,
        // pero la ejecución depende de las manos y la cabeza que te quedan.
        if (ctx.rng() < this.probabilidadFalloOculto(ctx)) {
          perfecta = false;
          p.estabilidad = Math.max(0, p.estabilidad - 8);
          ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 6);
          ctx.stats.complicaciones++;
          console.log(
            rojo('  ✖ Pero tus manos tiemblan de fatiga y la maniobra sale imperfecta: pequeña complicación añadida.'),
          );
        }
      } else {
        perfecta = false;
        ctx.stats.complicaciones++;
        console.log(rojo(`  ✖ ${eleccion.resultado}`));
      }

      if (p.estabilidad <= 0) break;
    }

    // La cirugía consume su tiempo (y el mundo sigue girando fuera).
    const avisos = ctx.avanzarTiempo(plan.duracionMin);
    ctx.cirujano.energia = Math.max(0, ctx.cirujano.energia - 15);
    ctx.hospital.quirofanosLibres++;
    ctx.stats.cirugiasRealizadas++;
    ctx.stats.atendidos++;

    this.resolverPostoperatorio(ctx, perfecta);

    console.log(`\n${gris(`Perla docente: ${p.patologia.notaDocente}`)}`);
    if (avisos.length > 0) {
      console.log(negrita('\nMientras estabas en quirófano:'));
      for (const a of avisos) console.log(`  ${a.startsWith('✝') ? rojo(a) : gris(a)}`);
    }
    await pausa();
    return new TriageState();
  }

  // ────────────────────────────────────────────────────────────
  /** Con energía < 40 o estrés > 60, las opciones correctas pueden torcerse. */
  private probabilidadFalloOculto(ctx: GameContext): number {
    const porFatiga = Math.max(0, 40 - ctx.cirujano.energia) / 100;
    const porEstres = Math.max(0, ctx.cirujano.estres - 60) / 200;
    return porFatiga + porEstres;
  }

  /** Baraja las opciones para que la correcta no esté siempre en el mismo sitio. */
  private barajar(ctx: GameContext, opciones: OpcionQuirurgica[]): OpcionQuirurgica[] {
    const copia = [...opciones];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(ctx.rng() * (i + 1));
      [copia[i], copia[j]] = [copia[j]!, copia[i]!];
    }
    return copia;
  }

  // ────────────────────────────────────────────────────────────
  private resolverPostoperatorio(ctx: GameContext, perfecta: boolean): void {
    const p = this.paciente;
    console.log('\n' + lineaSeparadora());

    if (p.estabilidad <= 0) {
      p.estado = 'exitus';
      ctx.stats.exitus++;
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 25);
      console.log(fondoRojo(negrita(` ✝ ÉXITUS EN MESA: ${p.nombre} no supera la intervención. `)));
      return;
    }

    if (perfecta) {
      ctx.stats.cirugiasPerfectas++;
      ctx.cirujano.estres = Math.max(0, ctx.cirujano.estres - 8);
      console.log(verde(negrita('  Cirugía impecable. El equipo te mira con respeto.')));
    }

    if (p.estabilidad >= 55) {
      p.estado = 'operado';
      console.log(verde(`  ${p.nombre} despierta estable y sube a planta. Estabilidad ${Math.round(p.estabilidad)}%.`));
      return;
    }

    // Paciente frágil: necesita cama de reanimación.
    if (ctx.hospital.camasReaLibres > 0) {
      p.estado = 'rea';
      const estancia = 240 + Math.round((55 - p.estabilidad) * 4);
      ctx.ocuparCamaRea(p, estancia);
      console.log(amarillo(`  ${p.nombre} sale intubado a REA (estabilidad ${Math.round(p.estabilidad)}%). Ocupa una cama ${gris(`~${Math.round(estancia / 60)} h`)}.`));
    } else {
      ctx.stats.complicaciones++;
      p.estabilidad = Math.max(1, p.estabilidad - 10);
      p.estado = 'operado';
      console.log(rojo('  ¡No quedan camas de REA! El paciente se queda en una URPA improvisada, más frágil de lo debido.'));
    }
  }
}
