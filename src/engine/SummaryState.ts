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
import { pintarEstrellas } from './calificacion.js';


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
      const estrellas = p.estrellas !== undefined ? ` ${amarillo(pintarEstrellas(p.estrellas))}` : '';
      // El código CIE-10 solo si el diagnóstico llegó a confirmarse.
      const cie = p.diagnosticoConfirmado && p.patologia.cie10 ? gris(` (${p.patologia.cie10})`) : '';
      ctx.io.escribir(`  ${this.iconoDestino(p)} ${p.nombre} — ${p.patologia.nombre}${cie} → ${this.destino(p)}${estrellas}${atipica}`);
    }

    ctx.io.escribir(`\n${negrita('Balance:')}`);
    ctx.io.escribir(`  Pacientes atendidos:      ${s.atendidos}`);
    ctx.io.escribir(`  Cirugías realizadas:      ${s.cirugiasRealizadas} ${gris(`(${s.cirugiasPerfectas} impecables)`)}`);
    ctx.io.escribir(`  Altas correctas:          ${s.altasCorrectas}`);
    ctx.io.escribir(`  Ingresos en observación:  ${s.ingresosCorrectos} correctos, ${s.ingresosErroneos} discutibles`);
    ctx.io.escribir(`  Altas erróneas:           ${s.altasErroneas === 0 ? verde('0') : rojo(String(s.altasErroneas))}`);
    ctx.io.escribir(`  Complicaciones:           ${s.complicaciones === 0 ? verde('0') : amarillo(String(s.complicaciones))}`);
    if (s.derivacionesCorrectas + s.derivacionesErroneas > 0) {
      ctx.io.escribir(`  Derivaciones:             ${verde(String(s.derivacionesCorrectas))} con criterio, ${s.derivacionesErroneas === 0 ? verde('0') : rojo(String(s.derivacionesErroneas))} innecesarias`);
    }
    if (s.etiquetasImvTotales > 0) {
      const aciertos = s.etiquetasImvCorrectas;
      ctx.io.escribir(`  Triaje de catástrofe:     ${aciertos === s.etiquetasImvTotales ? verde(`${aciertos}/${s.etiquetasImvTotales}`) : amarillo(`${aciertos}/${s.etiquetasImvTotales}`)} etiquetas correctas`);
    }
    if (s.seFueronSinSerVistos > 0) {
      ctx.io.escribir(`  Se fueron sin ser vistos: ${rojo(String(s.seFueronSinSerVistos))} ${gris('(admisión ya te ha reenviado la queja)')}`);
    }
    ctx.io.escribir(`  Éxitus:                   ${s.exitus === 0 ? verde('0') : rojo(String(s.exitus))}`);

    // Cooperativo: desglose por cirujano y MVP de la noche.
    if (ctx.equipo.length > 1) {
      ctx.io.escribir(`\n${negrita('La noche, por cirujano:')}`);
      const medias: number[] = [];
      ctx.equipo.forEach((c, i) => {
        const suyos = ctx.historial.filter((p) => p.cirujanoIdx === i && p.estrellas !== undefined);
        const media = suyos.length > 0 ? suyos.reduce((s, p) => s + (p.estrellas ?? 0), 0) / suyos.length : 0;
        medias.push(media);
        ctx.io.escribir(
          `  ${negrita(c.nombre)} — ${suyos.length} expediente(s), media ${amarillo(media.toFixed(1))} ★`,
        );
      });
      const mvp = medias[0]! === medias[1]! ? null : medias[0]! > medias[1]! ? 0 : 1;
      if (mvp !== null && ctx.historial.some((p) => p.cirujanoIdx !== undefined)) {
        ctx.io.escribir(gris(`  El café de mañana lo paga quien no es ${ctx.equipo[mvp]!.nombre}.`));
      }
    }

    let puntos = this.puntuacion(ctx);
    if (ctx.modoResidente) {
      puntos = Math.round(puntos * 0.85);
      ctx.io.escribir(gris('\n  Guardia tutelada (modo residente): la puntuación se ajusta al 85%.'));
    }
    if (ctx.modoFestival) {
      puntos = Math.round(puntos * 1.35);
      ctx.io.escribir(gris('\n  Noche de fiestas mayores superada: la puntuación se multiplica por 1,35.'));
    } else if (ctx.modoNegra) {
      puntos = Math.round(puntos * 1.2);
      ctx.io.escribir(gris('\n  Guardia negra superada: la puntuación se multiplica por 1,2.'));
    }
    ctx.io.escribir(`\n${negrita('Puntuación final:')} ${negrita(puntos >= 0 ? verde(String(puntos)) : rojo(String(puntos)))}`);
    ctx.io.escribir(`${negrita('Veredicto del Jefe de Servicio:')} ${this.veredicto(puntos)}\n`);

    // Segundo aviso de fin, ya con la puntuación: los adaptadores con memoria
    // (web) actualizan aquí el expediente persistente del cirujano.
    ctx.io.escena?.('fin', { puntos });

    ctx.io.cerrar();
    return null;
  }

  private destino(p: Paciente): string {
    switch (p.estado) {
      case 'exitus': return rojo('éxitus');
      case 'operado': return verde('intervenido, en planta');
      case 'rea': return amarillo('intervenido, en REA');
      case 'alta': return verde('alta');
      case 'derivado': return cian('derivado al centro de referencia');
      case 'ingresado': return amarillo('sigue ingresado (te lo dejas al de la mañana)');
      case 'fugado': return amarillo('se fue sin ser visto, harto de esperar');
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
      s.derivacionesCorrectas * 60 -
      s.derivacionesErroneas * 40 +
      s.ingresosCorrectos * 30 -
      s.altasErroneas * 50 -
      s.ingresosErroneos * 30 -
      s.complicaciones * 40 +
      s.etiquetasImvCorrectas * 25 -
      (s.etiquetasImvTotales - s.etiquetasImvCorrectas) * 30 -
      s.seFueronSinSerVistos * 40 -
      s.exitus * 200 -
      abandonados * 60
    );
  }

  private veredicto(puntos: number): string {
    if (puntos >= 700)
      return verde('«He leído tu parte dos veces. La segunda, por gusto. No se lo digas a nadie, pero anoche este hospital tuvo suerte.»');
    if (puntos >= 450)
      return verde('«Sólido. De los que dejan el quirófano como lo encontraron y el parte sin adjetivos. Sigue así y acabarás pagando tú los cafés.»');
    if (puntos >= 250)
      return cian('«Se puede dormir contigo de guardia, que es lo máximo que un jefe reconoce en voz alta.»');
    if (puntos >= 100)
      return amarillo('«Los pacientes sobreviven, que no es poco. Las formas, ya si eso, otro día.»');
    if (puntos >= 0)
      return amarillo('«Repasa indicaciones quirúrgicas. Y no me mires así: lo digo por los dos.»');
    return rojo('«Cierra la puerta al entrar. Tenemos que hablar de lo de anoche, y no va a ser corto.»');
  }
}
