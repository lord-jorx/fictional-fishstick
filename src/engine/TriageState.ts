/**
 * TriageState: la fase de urgencias.
 *
 * El jugador gestiona la sala de espera: explora, pide pruebas y
 * decide destino (alta, ingreso conservador o quirófano urgente).
 * Todo cuesta tiempo, y el tiempo deteriora a quien espera.
 */
import { GameContext } from '../core/GameContext.js';
import type { GameState } from '../core/StateMachine.js';
import type { Paciente, PruebaId } from '../core/types.js';
import { INFORME_INESPECIFICO, PRUEBAS } from '../data/pruebas.js';
import { amarillo, cian, gris, negrita, rojo, verde } from '../ui/ansi.js';
import { fichaPaciente, horaGuardia, lineaSeparadora, pintarHUD } from '../ui/hud.js';
import { elegir, pausa, type Opcion } from '../ui/prompt.js';
import { SummaryState } from './SummaryState.js';
import { SurgeryState } from './SurgeryState.js';

type AccionSala = { tipo: 'paciente'; paciente: Paciente } | { tipo: 'cafe' } | { tipo: 'esperar' } | { tipo: 'ronda' };

type AccionPaciente =
  | { tipo: 'explorar' }
  | { tipo: 'prueba'; prueba: PruebaId }
  | { tipo: 'alta' }
  | { tipo: 'ingreso' }
  | { tipo: 'cirugia' }
  | { tipo: 'volver' };

export class TriageState implements GameState {
  readonly nombre = 'triaje';
  /** Pacientes ya explorados en esta guardia (revela la exploración física). */
  private static explorados = new Set<number>();

  async run(ctx: GameContext): Promise<GameState | null> {
    if (ctx.guardiaTerminada) return new SummaryState();

    pintarHUD(ctx);
    const accion = await this.elegirAccionDeSala(ctx);

    switch (accion.tipo) {
      case 'cafe': {
        this.mostrarAvisos(ctx.avanzarTiempo(15, { descanso: true }));
        ctx.cirujano.energia = Math.min(100, ctx.cirujano.energia + 5);
        console.log(verde('☕ Un café con el residente. Respiras hondo.'));
        return this;
      }
      case 'esperar': {
        const proxima = ctx.proximaLlegada;
        const salto = proxima !== null ? Math.max(15, proxima - ctx.minuto) : 60;
        console.log(gris(`Te tumbas en el sofá de la sala de guardia... (${salto} min)`));
        this.mostrarAvisos(ctx.avanzarTiempo(Math.min(salto, 120), { descanso: true }));
        return this;
      }
      case 'ronda': {
        this.pasarVisita(ctx);
        this.mostrarAvisos(ctx.avanzarTiempo(15));
        return this;
      }
      case 'paciente':
        return this.atenderPaciente(ctx, accion.paciente);
    }
  }

  // ────────────────────────────────────────────────────────────
  private async elegirAccionDeSala(ctx: GameContext): Promise<AccionSala> {
    const opciones: Opcion<AccionSala>[] = ctx.salaEspera.map((p) => ({
      etiqueta: `Atender a ${fichaPaciente(p)}`,
      valor: { tipo: 'paciente', paciente: p },
    }));

    if (ctx.ingresados.length > 0) {
      opciones.push({ etiqueta: 'Pasar visita a los ingresados', detalle: '15 min', valor: { tipo: 'ronda' } });
    }
    opciones.push({ etiqueta: 'Tomar un café y despejarte', detalle: '15 min, recupera', valor: { tipo: 'cafe' } });
    if (ctx.salaEspera.length === 0) {
      opciones.push({ etiqueta: 'Descansar hasta que suene el busca', detalle: 'recupera energía', valor: { tipo: 'esperar' } });
    }

    const titulo =
      ctx.salaEspera.length > 0
        ? `Sala de urgencias — ${ctx.salaEspera.length} paciente(s) esperan tu decisión:`
        : 'Urgencias está en calma (de momento). ¿Qué haces?';
    return elegir(titulo, opciones);
  }

  private pasarVisita(ctx: GameContext): void {
    console.log(`\n${negrita('Ronda de planta:')}`);
    for (const p of ctx.ingresados) {
      console.log(`  • ${fichaPaciente(p)} ${gris(`— ${p.patologia.nombre}`)}`);
    }
  }

  // ────────────────────────────────────────────────────────────
  private async atenderPaciente(ctx: GameContext, paciente: Paciente): Promise<GameState> {
    for (;;) {
      if (ctx.guardiaTerminada) return new SummaryState();
      if (paciente.estado === 'exitus') return this; // falleció mientras decidías

      this.pintarFichaClinica(ctx, paciente);
      const accion = await this.elegirAccionPaciente(paciente, ctx);

      switch (accion.tipo) {
        case 'volver':
          console.log(gris(`${paciente.nombre} queda en el box, monitorizado.`));
          return this;

        case 'explorar': {
          TriageState.explorados.add(paciente.id);
          this.mostrarAvisos(ctx.avanzarTiempo(10));
          console.log(`\n${cian('Exploración física:')} ${paciente.patologia.presentacion.exploracion}`);
          break;
        }

        case 'prueba': {
          const prueba = PRUEBAS[accion.prueba];
          console.log(gris(`Solicitas ${prueba.nombre}. Esperas el resultado...`));
          this.mostrarAvisos(ctx.avanzarTiempo(prueba.duracionMin));
          paciente.pruebasRealizadas.push(prueba.id);
          const informe = this.informeDePrueba(paciente, prueba.id);
          console.log(`\n${cian(`Resultado de ${prueba.nombre}:`)}\n  ${informe}`);
          break;
        }

        case 'alta':
          this.resolverAlta(ctx, paciente);
          await pausa();
          return this;

        case 'ingreso':
          this.resolverIngreso(ctx, paciente);
          await pausa();
          return this;

        case 'cirugia': {
          if (ctx.hospital.quirofanosLibres === 0) {
            console.log(rojo('No hay ningún quirófano libre ahora mismo. Gana tiempo con otra decisión.'));
            break;
          }
          if (!paciente.patologia.quirurgica) {
            console.log(
              rojo('\nEl anestesista revisa el caso y te para los pies: «¿Indicación quirúrgica? Yo no la veo.»'),
            );
            console.log(gris('Pierdes 15 minutos discutiendo y algo de credibilidad. Revisa el caso.'));
            ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 8);
            this.mostrarAvisos(ctx.avanzarTiempo(15));
            break;
          }
          return new SurgeryState(paciente);
        }
      }
    }
  }

  private async elegirAccionPaciente(paciente: Paciente, ctx: GameContext): Promise<AccionPaciente> {
    const opciones: Opcion<AccionPaciente>[] = [];

    if (!TriageState.explorados.has(paciente.id)) {
      opciones.push({ etiqueta: 'Explorar al paciente', detalle: '10 min', valor: { tipo: 'explorar' } });
    }
    for (const prueba of Object.values(PRUEBAS)) {
      if (!paciente.pruebasRealizadas.includes(prueba.id)) {
        opciones.push({
          etiqueta: `Solicitar ${prueba.nombre}`,
          detalle: `${prueba.duracionMin} min`,
          valor: { tipo: 'prueba', prueba: prueba.id },
        });
      }
    }
    opciones.push(
      { etiqueta: negrita('Dar de alta con tratamiento ambulatorio'), valor: { tipo: 'alta' } },
      { etiqueta: negrita('Ingresar para tratamiento conservador / observación'), valor: { tipo: 'ingreso' } },
      { etiqueta: negrita(rojo('Programar CIRUGÍA URGENTE')), detalle: `quirófanos libres: ${ctx.hospital.quirofanosLibres}`, valor: { tipo: 'cirugia' } },
      { etiqueta: gris('Dejarlo en el box y volver al control'), valor: { tipo: 'volver' } },
    );

    return elegir(`¿Qué haces con ${paciente.nombre}?`, opciones);
  }

  // ────────────────────────────────────────────────────────────
  private pintarFichaClinica(ctx: GameContext, p: Paciente): void {
    console.log('\n' + lineaSeparadora());
    console.log(`  ${negrita(cian(`BOX ${p.id}`))} — ${fichaPaciente(p)}  ${gris(`(llegó a las ${horaGuardia(p.minutoLlegada)})`)}`);
    console.log(lineaSeparadora());
    console.log(`  ${negrita('Anamnesis:')}`);
    for (const s of p.patologia.presentacion.sintomas) console.log(`   • ${s}`);
    console.log(`  ${negrita('Constantes:')} ${p.patologia.presentacion.constantes}`);
    if (TriageState.explorados.has(p.id)) {
      console.log(`  ${negrita('Exploración:')} ${p.patologia.presentacion.exploracion}`);
    }
    for (const id of p.pruebasRealizadas) {
      console.log(`  ${negrita(`${PRUEBAS[id].nombre}:`)} ${gris(this.informeDePrueba(p, id))}`);
    }
    if (p.diagnosticoConfirmado) {
      console.log(`  ${verde(`✔ Diagnóstico confirmado: ${p.patologia.nombre}`)}`);
    }
  }

  private informeDePrueba(p: Paciente, prueba: PruebaId): string {
    if (prueba === p.patologia.pruebaDiana) {
      p.diagnosticoConfirmado = true;
      return p.patologia.hallazgoDiana;
    }
    return p.patologia.hallazgosParciales[prueba] ?? INFORME_INESPECIFICO[prueba];
  }

  // ────────────────────────────────────────────────────────────
  private resolverAlta(ctx: GameContext, p: Paciente): void {
    this.sacarDeEspera(ctx, p);
    ctx.stats.atendidos++;

    if (!p.patologia.quirurgica) {
      p.estado = 'alta';
      ctx.stats.altasCorrectas++;
      ctx.cirujano.estres = Math.max(0, ctx.cirujano.estres - 4);
      console.log(verde(`\n✔ Alta correcta: ${p.patologia.nombre} no precisaba cirugía.`));
      console.log(gris(`  Perla docente: ${p.patologia.notaDocente}`));
      return;
    }

    // Alta de un paciente quirúrgico: volverá, y volverá peor.
    ctx.stats.altasErroneas++;
    const estabilidadDeVuelta = p.estabilidad - 30;

    if (p.reingresado || estabilidadDeVuelta <= 10) {
      p.estado = 'exitus';
      p.estabilidad = 0;
      ctx.stats.exitus++;
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 25);
      console.log(rojo(negrita(`\n✝ ${p.nombre} fallece en su domicilio horas después del alta (${p.patologia.nombre}).`)));
      console.log(gris(`  ${p.patologia.notaDocente}`));
      return;
    }

    p.estabilidad = estabilidadDeVuelta;
    p.reingresado = true;
    p.estado = 'espera';
    const vuelveEn = 90 + Math.floor(ctx.rng() * 120);
    ctx.programarLlegadas([{ minuto: ctx.minuto + vuelveEn, paciente: p }]);
    console.log(amarillo(`\nFirmas el alta de ${p.nombre}. Algo no te deja tranquilo...`));
  }

  private resolverIngreso(ctx: GameContext, p: Paciente): void {
    this.sacarDeEspera(ctx, p);
    ctx.stats.atendidos++;
    p.estado = 'ingresado';
    p.alertaPlanta = false;
    ctx.ingresados.push(p);

    if (p.patologia.quirurgica) {
      ctx.stats.ingresosErroneos++;
      console.log(amarillo(`\nIngresas a ${p.nombre} con sueroterapia y antibiótico. La planta lo vigilará... por ahora.`));
    } else {
      ctx.stats.ingresosCorrectos++;
      console.log(verde(`\nIngresas a ${p.nombre} en observación. Decisión prudente.`));
    }
  }

  private sacarDeEspera(ctx: GameContext, p: Paciente): void {
    const i = ctx.salaEspera.indexOf(p);
    if (i >= 0) ctx.salaEspera.splice(i, 1);
  }

  private mostrarAvisos(avisos: string[]): void {
    for (const aviso of avisos) {
      const color = aviso.startsWith('✝') ? rojo : aviso.startsWith('⚠') ? amarillo : gris;
      console.log(color(aviso));
    }
  }
}
