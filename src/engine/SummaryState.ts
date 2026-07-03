/**
 * SummaryState: el parte de guardia de las 08:00.
 * Calcula la puntuación, muestra el destino de cada paciente y
 * asigna un rango según el desempeño.
 */
import { GameContext } from '../core/GameContext.js';
import type { GameState } from '../core/StateMachine.js';
import type { Paciente } from '../core/types.js';
import { amarillo, cian, gris, negrita, rojo, verde } from '../ui/ansi.js';
import { lineaSeparadora } from '../ui/hud.js';


export class SummaryState implements GameState {
  readonly nombre = 'resumen';

  async run(ctx: GameContext): Promise<GameState | null> {
    const s = ctx.stats;

    ctx.io.escena?.('fin');
    ctx.io.escribir('\n\n' + lineaSeparadora());
    ctx.io.escribir(negrita(cian('  ☀ 08:00 — FIN DE LA GUARDIA. Llega el relevo con cara de dormido.')));
    ctx.io.escribir(lineaSeparadora());

    ctx.io.escribir(`\n${negrita('Parte de guardia:')}`);
    for (const p of ctx.historial) {
      const atipica = !p.varianteId.startsWith('tipic') ? gris(` [presentación atípica: ${p.varianteId}]`) : '';
      ctx.io.escribir(`  ${this.iconoDestino(p)} ${p.nombre} — ${p.patologia.nombre} → ${this.destino(p)}${atipica}`);
    }

    ctx.io.escribir(`\n${negrita('Balance:')}`);
    ctx.io.escribir(`  Pacientes atendidos:      ${s.atendidos}`);
    ctx.io.escribir(`  Cirugías realizadas:      ${s.cirugiasRealizadas} ${gris(`(${s.cirugiasPerfectas} impecables)`)}`);
    ctx.io.escribir(`  Altas correctas:          ${s.altasCorrectas}`);
    ctx.io.escribir(`  Ingresos en observación:  ${s.ingresosCorrectos} correctos, ${s.ingresosErroneos} discutibles`);
    ctx.io.escribir(`  Altas erróneas:           ${s.altasErroneas === 0 ? verde('0') : rojo(String(s.altasErroneas))}`);
    ctx.io.escribir(`  Complicaciones:           ${s.complicaciones === 0 ? verde('0') : amarillo(String(s.complicaciones))}`);
    ctx.io.escribir(`  Éxitus:                   ${s.exitus === 0 ? verde('0') : rojo(String(s.exitus))}`);

    let puntos = this.puntuacion(ctx);
    if (ctx.modoResidente) {
      puntos = Math.round(puntos * 0.85);
      ctx.io.escribir(gris('\n  Guardia tutelada (modo residente): la puntuación se ajusta al 85%.'));
    }
    ctx.io.escribir(`\n${negrita('Puntuación final:')} ${negrita(puntos >= 0 ? verde(String(puntos)) : rojo(String(puntos)))}`);
    ctx.io.escribir(`${negrita('Veredicto del Jefe de Servicio:')} ${this.veredicto(puntos)}\n`);

    ctx.io.cerrar();
    return null;
  }

  private destino(p: Paciente): string {
    switch (p.estado) {
      case 'exitus': return rojo('éxitus');
      case 'operado': return verde('intervenido, en planta');
      case 'rea': return amarillo('intervenido, en REA');
      case 'alta': return verde('alta');
      case 'ingresado': return amarillo('sigue ingresado (te lo dejas al de la mañana)');
      case 'espera': return rojo('¡SIGUE ESPERANDO EN URGENCIAS!');
    }
  }

  private iconoDestino(p: Paciente): string {
    if (p.estado === 'exitus') return rojo('✝');
    if (p.estado === 'espera') return rojo('⚠');
    return gris('•');
  }

  private puntuacion(ctx: GameContext): number {
    const s = ctx.stats;
    const cirugiasConExito = ctx.historial.filter(
      (p) => (p.estado === 'operado' || p.estado === 'rea') && p.patologia.quirurgica,
    ).length;
    const abandonados = ctx.historial.filter((p) => p.estado === 'espera').length;

    return (
      cirugiasConExito * 120 +
      s.cirugiasPerfectas * 40 +
      s.altasCorrectas * 60 +
      s.ingresosCorrectos * 30 -
      s.altasErroneas * 50 -
      s.ingresosErroneos * 30 -
      s.complicaciones * 40 -
      s.exitus * 200 -
      abandonados * 60
    );
  }

  private veredicto(puntos: number): string {
    if (puntos >= 700) return verde('«Guardia de libro. Material de Jefe de Servicio.»');
    if (puntos >= 450) return verde('«Adjunto senior: sólido, resolutivo, fiable.»');
    if (puntos >= 250) return cian('«Buen adjunto de guardia. Se puede dormir contigo en el hospital.»');
    if (puntos >= 100) return amarillo('«Nivel R5: te falta tablas, pero los pacientes sobreviven.»');
    if (puntos >= 0) return amarillo('«Nivel R3. Repasa las indicaciones quirúrgicas, por favor.»');
    return rojo('«¿Seguro que esto es lo tuyo? El lunes hablamos en mi despacho.»');
  }
}
