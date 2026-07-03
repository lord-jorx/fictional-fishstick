/**
 * TriageState: la fase de urgencias.
 *
 * El jugador gestiona la sala de espera: explora, pide pruebas y
 * decide destino (alta, ingreso conservador o quirófano urgente).
 * Todo cuesta tiempo, y el tiempo deteriora a quien espera.
 */
import { GameContext } from '../core/GameContext.js';
import type { GameState } from '../core/StateMachine.js';
import type { ManejoCorrecto, Paciente, PruebaId } from '../core/types.js';
import { INFORME_INESPECIFICO, PRUEBAS } from '../data/pruebas.js';
import { amarillo, cian, gris, negrita, rojo, verde } from '../ui/ansi.js';
import { fichaPaciente, horaGuardia, lineaSeparadora, pintarHUD } from '../ui/hud.js';
import type { Opcion } from '../core/io.js';
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
  /** Pacientes por los que el adjunto ya dudó una vez (modo residente). */
  private static avisadosPorAdjunto = new Set<number>();

  async run(ctx: GameContext): Promise<GameState | null> {
    if (ctx.guardiaTerminada) return new SummaryState();

    ctx.io.escena?.('triaje');
    pintarHUD(ctx);
    const accion = await this.elegirAccionDeSala(ctx);

    switch (accion.tipo) {
      case 'cafe': {
        this.mostrarAvisos(ctx, ctx.avanzarTiempo(15, { descanso: true }));
        ctx.cirujano.energia = Math.min(100, ctx.cirujano.energia + 5);
        ctx.io.escribir(verde('☕ Un café con el residente. Respiras hondo.'));
        return this;
      }
      case 'esperar': {
        const proxima = ctx.proximaLlegada;
        const salto = proxima !== null ? Math.max(15, proxima - ctx.minuto) : 60;
        ctx.io.escribir(gris(`Te tumbas en el sofá de la sala de guardia... (${salto} min)`));
        this.mostrarAvisos(ctx, ctx.avanzarTiempo(Math.min(salto, 120), { descanso: true }));
        return this;
      }
      case 'ronda': {
        this.pasarVisita(ctx);
        this.mostrarAvisos(ctx, ctx.avanzarTiempo(15));
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
    return ctx.io.elegir(titulo, opciones);
  }

  private pasarVisita(ctx: GameContext): void {
    ctx.io.escribir(`\n${negrita('Ronda de planta:')}`);
    for (const p of ctx.ingresados) {
      ctx.io.escribir(`  • ${fichaPaciente(p)} ${gris(`— ${p.patologia.nombre}`)}`);
    }
  }

  // ────────────────────────────────────────────────────────────
  private async atenderPaciente(ctx: GameContext, paciente: Paciente): Promise<GameState> {
    ctx.io.escena?.('paciente', {
      patologiaId: paciente.patologia.id,
      pacienteId: paciente.id,
      nombre: paciente.nombre,
      edad: paciente.edad,
      estabilidad: paciente.estabilidad,
      zonaDolor: paciente.zonaDolor,
    });
    for (;;) {
      if (ctx.guardiaTerminada) return new SummaryState();
      if (paciente.estado === 'exitus') return this; // falleció mientras decidías

      this.pintarFichaClinica(ctx, paciente);
      const accion = await this.elegirAccionPaciente(paciente, ctx);

      switch (accion.tipo) {
        case 'volver':
          ctx.io.escribir(gris(`${paciente.nombre} queda en el box, monitorizado.`));
          return this;

        case 'explorar': {
          TriageState.explorados.add(paciente.id);
          this.mostrarAvisos(ctx, ctx.avanzarTiempo(10));
          ctx.io.escribir(`\n${cian('Exploración física:')} ${paciente.exploracion}`);
          break;
        }

        case 'prueba': {
          const prueba = PRUEBAS[accion.prueba];
          ctx.io.escribir(gris(`Solicitas ${prueba.nombre}. Esperas el resultado...`));
          this.mostrarAvisos(ctx, ctx.avanzarTiempo(prueba.duracionMin));

          // Variantes difíciles: la prueba diana puede salir dudosa la primera
          // vez. No confirma, y queda disponible para repetirla.
          if (prueba.id === paciente.patologia.pruebaDiana && paciente.pruebaEsquiva) {
            paciente.pruebaEsquiva = false;
            paciente.notasClinicas.push(
              `${prueba.nombre} no concluyente: valora repetirla o decidir por la clínica.`,
            );
            ctx.io.escribir(
              `\n${cian(`Resultado de ${prueba.nombre}:`)}\n  ${amarillo(paciente.informeDudoso ?? 'Estudio técnicamente limitado, no concluyente. Correlacionar con la clínica o repetir.')}`,
            );
            break;
          }

          paciente.pruebasRealizadas.push(prueba.id);
          const informe = this.informeDePrueba(paciente, prueba.id);
          ctx.io.escribir(`\n${cian(`Resultado de ${prueba.nombre}:`)}\n  ${informe}`);
          if (paciente.diagnosticoConfirmado) {
            paciente.notasClinicas = paciente.notasClinicas.filter((n) => !n.includes('no concluyente'));
          }
          break;
        }

        case 'alta':
          if (await this.adjuntoDuda(ctx, paciente, 'alta')) break;
          this.resolverAlta(ctx, paciente);
          await ctx.io.pausa();
          return this;

        case 'ingreso':
          if (await this.adjuntoDuda(ctx, paciente, 'conservador')) break;
          this.resolverIngreso(ctx, paciente);
          await ctx.io.pausa();
          return this;

        case 'cirugia': {
          if (ctx.hospital.quirofanosLibres === 0) {
            ctx.io.escribir(rojo('No hay ningún quirófano libre ahora mismo. Gana tiempo con otra decisión.'));
            break;
          }
          if (await this.adjuntoDuda(ctx, paciente, 'cirugia')) break;
          if (!paciente.patologia.quirurgica) {
            ctx.io.escribir(
              rojo('\nEl anestesista revisa el caso y te para los pies: «¿Indicación quirúrgica? Yo no la veo.»'),
            );
            ctx.io.escribir(gris('Pierdes 15 minutos discutiendo y algo de credibilidad. Revisa el caso.'));
            ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 8);
            this.mostrarAvisos(ctx, ctx.avanzarTiempo(15));
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

    return ctx.io.elegir(`¿Qué haces con ${paciente.nombre}?`, opciones);
  }

  // ────────────────────────────────────────────────────────────
  private pintarFichaClinica(ctx: GameContext, p: Paciente): void {
    ctx.io.escribir('\n' + lineaSeparadora());
    ctx.io.escribir(`  ${negrita(cian(`BOX ${p.id}`))} — ${fichaPaciente(p)}  ${gris(`(llegó a las ${horaGuardia(p.minutoLlegada)})`)}`);
    ctx.io.escribir(lineaSeparadora());
    ctx.io.escribir(`  ${negrita('Anamnesis:')}`);
    for (const s of p.sintomas) ctx.io.escribir(`   • ${s}`);
    ctx.io.escribir(`  ${negrita('Constantes:')} ${p.constantes}`);
    if (TriageState.explorados.has(p.id)) {
      ctx.io.escribir(`  ${negrita('Exploración:')} ${p.exploracion}`);
    }
    for (const nota of p.notasClinicas) {
      ctx.io.escribir(`  ${amarillo(`⚠ ${nota}`)}`);
    }
    for (const id of p.pruebasRealizadas) {
      ctx.io.escribir(`  ${negrita(`${PRUEBAS[id].nombre}:`)} ${gris(this.informeDePrueba(p, id))}`);
    }
    if (p.diagnosticoConfirmado) {
      ctx.io.escribir(`  ${verde(`✔ Diagnóstico confirmado: ${p.patologia.nombre}`)}`);
    } else if (ctx.modoResidente) {
      ctx.io.escribir(
        `  ${cian('🩺 Tu adjunto, por teléfono:')} ${gris(`«Con esa clínica, yo pediría ${PRUEBAS[p.patologia.pruebaDiana].nombre.toLowerCase()}.»`)}`,
      );
    }
  }

  /**
   * Modo residente: si el diagnóstico está confirmado y la decisión contradice
   * el manejo estándar, el adjunto duda en voz alta UNA vez por paciente.
   * Devuelve true si el jugador decide reconsiderar.
   */
  private async adjuntoDuda(ctx: GameContext, p: Paciente, decision: ManejoCorrecto): Promise<boolean> {
    if (!ctx.modoResidente) return false;
    if (!p.diagnosticoConfirmado) return false;
    if (decision === p.patologia.manejoCorrecto) return false;
    if (TriageState.avisadosPorAdjunto.has(p.id)) return false;

    TriageState.avisadosPorAdjunto.add(p.id);
    ctx.io.escribir(
      `\n${cian('🩺 Tu adjunto arquea una ceja:')} ${gris(`«¿${this.nombreDecision(decision)}, con un(a) ${p.patologia.nombre.toLowerCase()} confirmado/a? Tú verás, es tu paciente...»`)}`,
    );
    const reconsiderar = await ctx.io.elegir('¿Qué haces?', [
      { etiqueta: 'Reconsiderar la decisión', valor: true },
      { etiqueta: 'Mantenerla: el cirujano eres tú', valor: false },
    ]);
    return reconsiderar;
  }

  private nombreDecision(d: ManejoCorrecto): string {
    switch (d) {
      case 'alta': return 'Alta';
      case 'conservador': return 'Tratamiento conservador';
      case 'cirugia': return 'Quirófano urgente';
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

    if (p.patologia.manejoCorrecto === 'alta') {
      p.estado = 'alta';
      ctx.stats.altasCorrectas++;
      ctx.cirujano.estres = Math.max(0, ctx.cirujano.estres - 4);
      ctx.io.escribir(verde(`\n✔ Alta correcta: ${p.patologia.nombre} no precisaba ingreso ni cirugía.`));
      ctx.io.escribir(gris(`  Perla docente: ${p.patologia.notaDocente}`));
      return;
    }

    // Alta de quien necesitaba tratamiento: volverá, y volverá peor.
    ctx.stats.altasErroneas++;
    const estabilidadDeVuelta = p.estabilidad - 30;

    if (p.reingresado || estabilidadDeVuelta <= 10) {
      p.estado = 'exitus';
      p.estabilidad = 0;
      ctx.stats.exitus++;
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 25);
      ctx.io.escribir(rojo(negrita(`\n✝ ${p.nombre} fallece en su domicilio horas después del alta (${p.patologia.nombre}).`)));
      ctx.io.escribir(gris(`  ${p.patologia.notaDocente}`));
      return;
    }

    p.estabilidad = estabilidadDeVuelta;
    p.reingresado = true;
    p.estado = 'espera';
    const vuelveEn = 90 + Math.floor(ctx.rng() * 120);
    ctx.programarLlegadas([{ minuto: ctx.minuto + vuelveEn, paciente: p }]);
    ctx.io.escribir(amarillo(`\nFirmas el alta de ${p.nombre}. Algo no te deja tranquilo...`));
  }

  private resolverIngreso(ctx: GameContext, p: Paciente): void {
    this.sacarDeEspera(ctx, p);
    ctx.stats.atendidos++;
    p.estado = 'ingresado';
    p.alertaPlanta = false;
    ctx.ingresados.push(p);

    if (p.patologia.quirurgica) {
      ctx.stats.ingresosErroneos++;
      ctx.io.escribir(amarillo(`\nIngresas a ${p.nombre} con sueroterapia y antibiótico. La planta lo vigilará... por ahora.`));
    } else if (p.patologia.manejoCorrecto === 'conservador') {
      ctx.stats.ingresosCorrectos++;
      ctx.io.escribir(verde(`\n✔ Ingreso correcto: ${p.patologia.nombre} se trata con medidas conservadoras, no con bisturí.`));
      ctx.io.escribir(gris(`  Perla docente: ${p.patologia.notaDocente}`));
    } else {
      ctx.stats.ingresosCorrectos++;
      ctx.io.escribir(verde(`\nIngresas a ${p.nombre} en observación. Prudente, aunque podía haberse ido de alta.`));
    }
  }

  private sacarDeEspera(ctx: GameContext, p: Paciente): void {
    const i = ctx.salaEspera.indexOf(p);
    if (i >= 0) ctx.salaEspera.splice(i, 1);
  }

  private mostrarAvisos(ctx: GameContext, avisos: string[]): void {
    for (const aviso of avisos) {
      const color = aviso.startsWith('✝') ? rojo : aviso.startsWith('⚠') ? amarillo : gris;
      ctx.io.escribir(color(aviso));
    }
  }
}
