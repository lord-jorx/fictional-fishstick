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
import type { OpcionQuirurgica, Paciente, PasoQuirurgico } from '../core/types.js';
import { COMPLICACIONES_IMPREVISTAS } from '../data/complicaciones.js';
import { amarillo, cian, fondoRojo, gris, negrita, rojo, verde } from '../ui/ansi.js';
import { barra, lineaSeparadora } from '../ui/hud.js';
import { calificarCaso, pintarEstrellas } from './calificacion.js';
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

    ctx.io.escena?.('quirofano', {
      patologiaId: p.patologia.id,
      nombre: p.nombre,
      edad: p.edad,
      tablero: ctx.tablero(),
    });
    ctx.io.escribir('\n' + lineaSeparadora());
    ctx.io.escribir(`  ${negrita(cian('🔪 QUIRÓFANO'))} — ${negrita(plan.nombre)}`);
    ctx.io.escribir(`  Paciente: ${p.nombre}, ${p.edad} años. ${gris(p.patologia.nombre)}`);
    ctx.io.escribir(lineaSeparadora());

    if (!p.diagnosticoConfirmado) {
      p.estabilidad = Math.max(1, p.estabilidad - 8);
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 8);
      ctx.io.escribir(
        amarillo('Entras a quirófano SIN confirmación diagnóstica. La incertidumbre se paga: -8 estabilidad, +estrés.'),
      );
    }

    let perfecta = true;

    // Complicaciones imprevistas procedurales: la variante atípica, el
    // paciente inestable, tu fatiga y la guardia negra las hacen más probables.
    const { pasos, imprevistos } = this.montarPasos(ctx, plan.pasos);

    const totalEtapas = plan.pasos.length;
    let etapa = 0;

    for (const [n, paso] of pasos.entries()) {
      const esImprevisto = imprevistos.has(paso);
      if (!esImprevisto) etapa++;
      ctx.io.escena?.('paso', {
        patologiaId: p.patologia.id,
        etapa,
        totalEtapas,
        evento: paso.evento,
        imprevisto: esImprevisto,
      });

      if (esImprevisto) {
        ctx.io.escribir(`\n${rojo(negrita('⚠ COMPLICACIÓN IMPREVISTA'))}`);
        ctx.io.escribir(`${negrita(`${paso.titulo}`)}`);
      } else {
        ctx.io.escribir(`\n${negrita(`PASO ${n + 1}/${pasos.length}: ${paso.titulo}`)}`);
      }
      ctx.io.escribir(`  Estabilidad del paciente ${barra(p.estabilidad, false, 12)}   Tu energía ${barra(ctx.cirujano.energia, false, 12)}`);
      ctx.io.escribir(`\n  ${amarillo('EVENTO:')} ${paso.evento}`);

      const opciones = this.barajar(ctx, paso.opciones);
      const eleccion = await this.elegirTecnica(ctx, opciones);

      p.estabilidad = Math.min(100, Math.max(0, p.estabilidad + eleccion.deltaEstabilidad));
      ctx.cirujano.estres = Math.min(100, Math.max(0, ctx.cirujano.estres + eleccion.deltaEstres));

      if (eleccion.correcta) {
        ctx.io.escribir(verde(`  ✔ ${eleccion.resultado}`));
        // Penalización oculta por fatiga/estrés: la decisión era correcta,
        // pero la ejecución depende de las manos y la cabeza que te quedan.
        if (ctx.rng() < this.probabilidadFalloOculto(ctx)) {
          perfecta = false;
          p.estabilidad = Math.max(0, p.estabilidad - 8);
          ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 6);
          ctx.stats.complicaciones++;
          ctx.io.escribir(
            rojo('  ✖ Pero tus manos tiemblan de fatiga y la maniobra sale imperfecta: pequeña complicación añadida.'),
          );
        }
      } else {
        perfecta = false;
        ctx.stats.complicaciones++;
        ctx.io.escribir(rojo(`  ✖ ${eleccion.resultado}`));
      }

      if (p.estabilidad <= 0) break;
    }

    // La cirugía consume su tiempo (y el mundo sigue girando fuera).
    const avisos = ctx.avanzarTiempo(plan.duracionMin);
    ctx.cirujano.energia = Math.max(0, ctx.cirujano.energia - 15);
    ctx.hospital.quirofanosLibres++;
    ctx.stats.cirugiasRealizadas++;
    ctx.stats.atendidos++;

    p.cirugiaPerfecta = perfecta;
    this.resolverPostoperatorio(ctx, perfecta);

    p.estrellas = calificarCaso(p);
    ctx.io.escribir(
      `\n  ${negrita('EXPEDIENTE CERRADO')} — Calificación del caso: ${amarillo(pintarEstrellas(p.estrellas))}`,
    );
    ctx.io.escribir(`\n${gris(`Perla docente: ${p.patologia.notaDocente}`)}`);
    if (avisos.length > 0) {
      ctx.io.escribir(negrita('\nMientras estabas en quirófano:'));
      for (const a of avisos) ctx.io.escribir(`  ${a.startsWith('✝') ? rojo(a) : gris(a)}`);
    }
    await ctx.io.pausa();
    return new TriageState();
  }

  // ────────────────────────────────────────────────────────────
  /**
   * Sortea complicaciones imprevistas y las intercala entre los pasos del
   * plan. La probabilidad sube con la variante atípica, el paciente
   * inestable, tu fatiga y la guardia negra.
   */
  private montarPasos(
    ctx: GameContext,
    base: PasoQuirurgico[],
  ): { pasos: PasoQuirurgico[]; imprevistos: Set<PasoQuirurgico> } {
    let prob = 0.12;
    if (!this.paciente.varianteId.startsWith('tipic')) prob += 0.15;
    if (this.paciente.estabilidad < 50) prob += 0.12;
    if (ctx.cirujano.energia < 40) prob += 0.08;
    if (ctx.modoNegra) prob += 0.12;

    const pasos = [...base];
    const imprevistos = new Set<PasoQuirurgico>();
    const bolsa = [...COMPLICACIONES_IMPREVISTAS];
    for (let i = 0; i < 2 && bolsa.length > 0; i++) {
      if (ctx.rng() < prob) {
        const elegido = bolsa.splice(Math.floor(ctx.rng() * bolsa.length), 1)[0]!;
        const posicion = 1 + Math.floor(ctx.rng() * pasos.length);
        pasos.splice(posicion, 0, elegido);
        imprevistos.add(elegido);
      }
    }
    return { pasos, imprevistos };
  }

  /**
   * Presenta las técnicas del paso. En modo residente, mientras queden
   * llamadas disponibles, se puede telefonear al adjunto: señala la técnica
   * correcta a cambio de gastar una de las 3 llamadas de la guardia.
   */
  private async elegirTecnica(ctx: GameContext, opciones: OpcionQuirurgica[]): Promise<OpcionQuirurgica> {
    for (;;) {
      const menu: { etiqueta: string; valor: OpcionQuirurgica | 'adjunto' }[] = opciones.map((op) => ({
        etiqueta: op.texto,
        valor: op,
      }));
      if (ctx.modoResidente && ctx.consultasAdjunto > 0) {
        menu.push({
          etiqueta: cian(`📞 Llamar al adjunto (quedan ${ctx.consultasAdjunto} llamadas)`),
          valor: 'adjunto',
        });
      }

      const eleccion = await ctx.io.elegir('¿Cómo procedes?', menu);
      if (eleccion !== 'adjunto') return eleccion;

      ctx.consultasAdjunto--;
      const correcta = opciones.find((op) => op.correcta);
      ctx.io.escribir(
        `\n${cian('🩺 El adjunto, con voz de dormido:')} ${gris(`«Yo lo tengo claro: ${correcta?.texto.toLowerCase() ?? 'sigue tu instinto'}. Y no me llames más, que estoy en la cama.»`)}`,
      );
    }
  }

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
    ctx.io.escribir('\n' + lineaSeparadora());

    if (p.estabilidad <= 0) {
      p.estado = 'exitus';
      ctx.stats.exitus++;
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 25);
      ctx.io.escribir(fondoRojo(negrita(` ✝ ÉXITUS EN MESA: ${p.nombre} no supera la intervención. `)));
      return;
    }

    if (perfecta) {
      ctx.stats.cirugiasPerfectas++;
      ctx.cirujano.estres = Math.max(0, ctx.cirujano.estres - 8);
      ctx.io.escribir(verde(negrita('  Cirugía impecable. El equipo te mira con respeto.')));
    }

    if (p.estabilidad >= 55) {
      p.estado = 'operado';
      ctx.io.escribir(verde(`  ${p.nombre} despierta estable y sube a planta. Estabilidad ${Math.round(p.estabilidad)}%.`));
      return;
    }

    // Paciente frágil: necesita cama de reanimación.
    if (ctx.hospital.camasReaLibres > 0) {
      p.estado = 'rea';
      const estancia = 240 + Math.round((55 - p.estabilidad) * 4);
      ctx.ocuparCamaRea(p, estancia);
      ctx.io.escribir(amarillo(`  ${p.nombre} sale intubado a REA (estabilidad ${Math.round(p.estabilidad)}%). Ocupa una cama ${gris(`~${Math.round(estancia / 60)} h`)}.`));
    } else {
      ctx.stats.complicaciones++;
      p.estabilidad = Math.max(1, p.estabilidad - 10);
      p.estado = 'operado';
      ctx.io.escribir(rojo('  ¡No quedan camas de REA! El paciente se queda en una URPA improvisada, más frágil de lo debido.'));
    }
  }
}
