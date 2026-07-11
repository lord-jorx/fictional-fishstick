/**
 * TriageState: la fase de urgencias.
 *
 * El jugador gestiona la sala de espera: explora, pide pruebas y
 * decide destino (alta, ingreso conservador o quirófano urgente).
 * Todo cuesta tiempo, y el tiempo deteriora a quien espera.
 */
import { GameContext } from '../core/GameContext.js';
import type { GameState } from '../core/StateMachine.js';
import type { EtiquetaTriaje, ManejoCorrecto, Paciente, PruebaId, RespuestaInterrogatorio } from '../core/types.js';
import { INTERROGATORIOS } from '../data/interrogatorios.js';
import { INFORME_INESPECIFICO, PRUEBAS } from '../data/pruebas.js';
import { calificarCaso, pintarEstrellas } from './calificacion.js';
import { t } from '../i18n.js';
import { amarillo, cian, gris, negrita, rojo, verde } from '../ui/ansi.js';
import { fichaPaciente, horaGuardia, lineaSeparadora, pintarHUD } from '../ui/hud.js';
import type { Opcion } from '../core/io.js';
import { SummaryState } from './SummaryState.js';
import { SurgeryState } from './SurgeryState.js';

type AccionSala =
  | { tipo: 'paciente'; paciente: Paciente }
  | { tipo: 'cafe' }
  | { tipo: 'esperar' }
  | { tipo: 'ronda' }
  | { tipo: 'refrescar' };

type AccionPaciente =
  | { tipo: 'explorar' }
  | { tipo: 'interrogar' }
  | { tipo: 'prueba'; prueba: PruebaId }
  | { tipo: 'alta' }
  | { tipo: 'ingreso' }
  | { tipo: 'cirugia' }
  | { tipo: 'derivar' }
  | { tipo: 'volver' }
  | { tipo: 'reevaluar' };

/** El escáner (TC/angio-TC abdominal): va después de la analítica. La eco
 *  clínica, la eco-FAST, el ECG, la Rx y el TC craneal son de primera línea. */
const ESCANER_ABDOMINAL = new Set<PruebaId>(['tc', 'angiotc']);

/** Orden en que se ofrecen las pruebas: analítica y cabecera antes que el escáner. */
const ORDEN_PRUEBAS: PruebaId[] = ['analitica', 'gasometria', 'orina', 'eco', 'ecofast', 'ecg', 'rxtorax', 'tccraneo', 'tc', 'angiotc'];

/**
 * Pruebas que tienen sentido clínico en un cuadro: la diana más aquellas
 * para las que la patología define un informe propio. Todo lo demás (un TC
 * abdominal en un TCE, un ECG en una hernia) no se ofrece siquiera.
 */
function pruebasRelevantes(pat: { pruebaDiana: PruebaId; hallazgosParciales: Partial<Record<PruebaId, string>> }): Set<PruebaId> {
  const set = new Set<PruebaId>([pat.pruebaDiana]);
  for (const id of Object.keys(pat.hallazgosParciales) as PruebaId[]) set.add(id);
  return set;
}

export class TriageState implements GameState {
  readonly nombre = 'triaje';
  /** Pacientes ya explorados en esta guardia (revela la exploración física). */
  private static explorados = new Set<number>();
  /** Pacientes por los que el adjunto ya dudó una vez (modo residente). */
  private static avisadosPorAdjunto = new Set<number>();

  async run(ctx: GameContext): Promise<GameState | null> {
    if (ctx.guardiaTerminada) return new SummaryState();
    if (ctx.imvPendiente) return this.triajeDeCatastrofe(ctx);

    ctx.io.escena?.('triaje', { tablero: ctx.tablero() });
    pintarHUD(ctx);
    const accion = await this.elegirAccionDeSala(ctx);

    switch (accion.tipo) {
      case 'cafe': {
        this.mostrarAvisos(ctx, ctx.avanzarTiempo(15, { descanso: true }));
        ctx.cirujano.energia = Math.min(100, ctx.cirujano.energia + (ctx.mejoras.has('termo') ? 15 : 5));
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
      case 'refrescar':
        // Tiempo real: han pasado cosas mientras deliberabas; repintar.
        return this;
      case 'paciente':
        return this.atenderPaciente(ctx, accion.paciente);
    }
  }

  // ────────────────────────────────────────────────────────────
  private async elegirAccionDeSala(ctx: GameContext): Promise<AccionSala> {
    const opciones: Opcion<AccionSala>[] = ctx.salaEspera.map((p) => ({
      etiqueta: `${t('atenderA')} ${fichaPaciente(p)}`,
      valor: { tipo: 'paciente', paciente: p },
    }));

    if (ctx.ingresados.length > 0) {
      opciones.push({ etiqueta: t('ronda'), detalle: '15 min', valor: { tipo: 'ronda' } });
    }
    opciones.push({ etiqueta: t('cafe'), detalle: '15 min ☕', valor: { tipo: 'cafe' } });
    if (ctx.salaEspera.length === 0) {
      opciones.push({ etiqueta: t('descansar'), detalle: '💤', valor: { tipo: 'esperar' } });
    }

    opciones.push({ etiqueta: '⟳', oculta: true, valor: { tipo: 'refrescar' } });

    const titulo =
      ctx.salaEspera.length > 0
        ? `${t('salaTitulo')} (${ctx.salaEspera.length})`
        : t('salaCalma');
    return ctx.io.elegir(titulo, opciones);
  }

  // ────────────────────────────────────────────────────────────
  /**
   * Triaje de catástrofe: las víctimas del IMV esperan en la puerta y a
   * cada una hay que colgarle su etiqueta con lo puesto — constantes, una
   * mirada y oficio. Etiquetar de menos cuesta estabilidad; la etiqueta
   * negra bien puesta es medicina; mal puesta, una sentencia.
   */
  private async triajeDeCatastrofe(ctx: GameContext): Promise<GameState> {
    const victimas = ctx.imvPendiente!;
    ctx.imvPendiente = null;

    ctx.io.escribir('\n' + lineaSeparadora());
    ctx.io.escribir(negrita(rojo('  🚨 INCIDENTE DE MÚLTIPLES VÍCTIMAS — TRIAJE EN LA PUERTA')));
    ctx.io.escribir(lineaSeparadora());
    ctx.io.escribir(
      gris('  Las sirenas llegan escalonadas. Sales a la puerta de ambulancias con la\n') +
        gris('  tarjeta de etiquetas en la mano: ROJO inmediato, AMARILLO diferido,\n') +
        gris('  VERDE puede esperar, NEGRO expectante. Nadie más va a decidirlo por ti.'),
    );
    // Foto para el canvas Phaser de la puerta de ambulancias.
    const fotoImv = (activaIdx: number) =>
      victimas.map((v, i) => ({
        nombre: v.nombre,
        estabilidad: v.estabilidad,
        etiqueta: v.etiquetaTriaje,
        activa: i === activaIdx,
      }));
    ctx.io.escena?.('imv', { victimasImv: fotoImv(-1) });
    await ctx.io.pausa('Pulsa Intro para salir a la puerta de ambulancias...');

    for (const [indice, v] of victimas.entries()) {
      const correcta = this.etiquetaQueTocaba(v);
      ctx.io.escena?.('imv', { victimasImv: fotoImv(indice) });
      const elegida = await ctx.io.elegir<EtiquetaTriaje>(
        `Etiqueta para ${v.nombre}, ${v.edad} años — ${v.constantes}`,
        [
          { etiqueta: rojo('ROJO — inmediato'), detalle: 'no puede esperar ni un minuto', valor: 'rojo' },
          { etiqueta: amarillo('AMARILLO — diferido'), detalle: 'grave, pero aguanta un rato', valor: 'amarillo' },
          { etiqueta: verde('VERDE — leve'), detalle: 'herido que camina', valor: 'verde' },
          { etiqueta: gris('NEGRO — expectante'), detalle: 'irrecuperable: confort y dignidad', valor: 'negro' },
        ],
      );
      v.etiquetaTriaje = elegida;
      ctx.stats.etiquetasImvTotales++;
      ctx.io.escena?.('imv', { victimasImv: fotoImv(indice) }); // colorea la tarjeta recién puesta
      this.mostrarAvisos(ctx, ctx.avanzarTiempo(2));
      ctx.registrarPaciente(v);

      if (elegida === 'negro') {
        v.estado = 'exitus';
        v.estabilidad = 0;
        if (correcta === 'negro') {
          ctx.stats.etiquetasImvCorrectas++;
          ctx.io.escribir(
            gris(`  Le coges la mano a ${v.nombre} mientras queda alguien libre para acompañarle. Era la decisión correcta, y aun así pesa.`),
          );
          ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 6);
        } else {
          ctx.stats.exitus++;
          ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 18);
          ctx.io.escribir(
            rojo(`  ✝ ${v.nombre} era recuperable y lo has dejado en expectante. Fallece en la puerta. Esa etiqueta te va a durar años.`),
          );
        }
        continue;
      }

      if (elegida === correcta) {
        ctx.stats.etiquetasImvCorrectas++;
        ctx.io.escribir(verde('  ✔ Etiqueta correcta.'));
      } else if (this.gravedadEtiqueta(elegida) < this.gravedadEtiqueta(correcta)) {
        v.estabilidad = Math.max(5, v.estabilidad - 8);
        ctx.io.escribir(amarillo(`  ⚠ Infratriaje: era ${correcta.toUpperCase()}. ${v.nombre} pierde terreno mientras espera su turno.`));
      } else {
        ctx.io.escribir(amarillo(`  ⚠ Sobretriaje: era ${correcta.toUpperCase()}. Recursos y minutos que otro necesitaba más.`));
      }

      v.minutoLlegada = ctx.minuto;
      ctx.salaEspera.push(v);
    }

    ctx.io.escribir(
      `\n  ${negrita('Triaje de catástrofe cerrado:')} ${ctx.stats.etiquetasImvCorrectas}/${ctx.stats.etiquetasImvTotales} etiquetas correctas. Las víctimas pasan a tus boxes.`,
    );
    await ctx.io.pausa();
    return this;
  }

  /** La etiqueta que el estado real de la víctima pedía. */
  private etiquetaQueTocaba(v: Paciente): EtiquetaTriaje {
    if (v.estabilidad < 18) return 'negro';
    if (v.estabilidad < 45) return 'rojo';
    if (v.estabilidad < 70) return 'amarillo';
    return 'verde';
  }

  private gravedadEtiqueta(e: EtiquetaTriaje): number {
    return { verde: 0, amarillo: 1, rojo: 2, negro: 3 }[e];
  }

  private pasarVisita(ctx: GameContext): void {
    ctx.io.escribir(`\n${negrita('Ronda de planta:')}`);
    for (const p of ctx.ingresados) {
      ctx.io.escribir(`  • ${fichaPaciente(p)} ${gris(`— ${p.patologia.nombre}`)}`);
    }
  }

  // ────────────────────────────────────────────────────────────
  private async atenderPaciente(ctx: GameContext, paciente: Paciente): Promise<GameState> {
    // Cooperativo local: cada caso tiene su responsable.
    if (ctx.equipo.length > 1) {
      if (paciente.cirujanoIdx === undefined) {
        paciente.cirujanoIdx = await ctx.io.elegir(
          t('quienLoLleva'),
          ctx.equipo.map((c, i) => ({
            etiqueta: `${c.nombre}`,
            detalle: `${t('energia').toLowerCase()} ${Math.round(c.energia)} · ${t('estres').toLowerCase()} ${Math.round(c.estres)}`,
            valor: i,
          })),
        );
      }
      ctx.cirujanoActivo = paciente.cirujanoIdx;
    }

    // Ir en persona hasta el box: los pasillos también corren en el reloj
    // (con los zuecos nuevos, casi ni se nota).
    this.mostrarAvisos(ctx, ctx.avanzarTiempo(ctx.talisman === 'zuecos' ? 2 : 5));

    ctx.io.escena?.('paciente', {
      patologiaId: paciente.patologia.id,
      pacienteId: paciente.id,
      nombre: paciente.nombre,
      edad: paciente.edad,
      estabilidad: paciente.estabilidad,
      zonaDolor: paciente.zonaDolor,
    });
    // Mientras estés en su box, este paciente no se cansa de esperar.
    ctx.pacienteEnAtencion = paciente;
    try {
      return await this.bucleDePaciente(ctx, paciente);
    } finally {
      ctx.pacienteEnAtencion = null;
    }
  }

  private async bucleDePaciente(ctx: GameContext, paciente: Paciente): Promise<GameState> {
    for (;;) {
      if (ctx.guardiaTerminada) return new SummaryState();
      if (paciente.estado === 'exitus') return this; // falleció mientras decidías

      this.pintarFichaClinica(ctx, paciente);
      const accion = await this.elegirAccionPaciente(paciente, ctx);

      switch (accion.tipo) {
        case 'reevaluar':
          // Tiempo real: repintar la ficha (el bucle re-chequea éxitus y hora).
          break;

        case 'volver':
          ctx.io.escribir(gris(`${paciente.nombre} queda en el box, monitorizado.`));
          return this;

        case 'explorar': {
          TriageState.explorados.add(paciente.id);
          this.mostrarAvisos(ctx, ctx.avanzarTiempo(10));
          ctx.io.escribir(`\n${cian('Exploración física:')} ${paciente.exploracion}`);
          break;
        }

        case 'interrogar':
          await this.interrogar(ctx, paciente);
          break;

        case 'prueba': {
          const prueba = PRUEBAS[accion.prueba];
          let bonus = ctx.mejoras.has('ojo') ? 5 : 0;
          // Talismanes de la noche: el R1 espabilado y el radiólogo amigo.
          if (ctx.talisman === 'r1' && prueba.id === 'analitica') bonus += 15;
          if (ctx.talisman === 'radiologo' && (prueba.id === 'tc' || prueba.id === 'angiotc')) bonus += 20;
          const duracion = Math.max(5, prueba.duracionMin - paciente.descuentoPrueba - bonus);
          if (paciente.descuentoPrueba > 0) {
            ctx.io.escribir(gris(`Sabes exactamente qué buscar: ${prueba.nombre} priorizada (${duracion} min).`));
            paciente.descuentoPrueba = 0;
          } else {
            ctx.io.escribir(gris(`Solicitas ${prueba.nombre}. Esperas el resultado...`));
          }
          this.mostrarAvisos(ctx, ctx.avanzarTiempo(duracion));

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

        case 'derivar':
          this.resolverDerivacion(ctx, paciente);
          await ctx.io.pausa();
          return this;

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
      opciones.push({ etiqueta: t('explorar'), detalle: '10 min', valor: { tipo: 'explorar' } });
    }
    if (!paciente.interrogado && INTERROGATORIOS[paciente.patologia.id]) {
      opciones.push({
        etiqueta: cian(t('apretar')),
        detalle: '5 min',
        valor: { tipo: 'interrogar' },
      });
    }
    // El orden de la valoración: recibir → anamnesis → exploración (± eco
    // clínica) → analítica → imagen. Solo se ofrecen las pruebas que TIENEN
    // sentido en este cuadro, y el TC/angio-TC va después de la analítica —
    // salvo en la emergencia vital, que se salta la cola.
    const vital = !!paciente.patologia.vitalInmediato;
    const explorado = TriageState.explorados.has(paciente.id);
    const analiticaHecha = paciente.pruebasRealizadas.includes('analitica');
    const relevantes = pruebasRelevantes(paciente.patologia);

    // El orden se respeta ocultando lo que aún no toca, SIN decir por qué:
    // en el proceso diagnóstico no se dan pistas. Se ofrece todo lo que tiene
    // sentido pedir en este punto, ni una prueba de más.
    for (const id of ORDEN_PRUEBAS) {
      if (!relevantes.has(id)) continue;                          // sin sentido en este cuadro
      if (ctx.pruebasNoDisponibles.includes(id)) continue;        // no la hay en este hospital
      if (paciente.pruebasRealizadas.includes(id)) continue;      // ya hecha
      if (!vital && !explorado) continue;                         // explora primero
      if (!vital && ESCANER_ABDOMINAL.has(id) && !analiticaHecha) continue; // analítica antes del escáner
      const prueba = PRUEBAS[id];
      opciones.push({
        etiqueta: `${t('solicitar')} ${prueba.nombre}`,
        detalle: `${prueba.duracionMin} min`,
        valor: { tipo: 'prueba', prueba: id },
      });
    }

    opciones.push(
      { etiqueta: negrita(t('alta')), valor: { tipo: 'alta' } },
      { etiqueta: negrita(t('ingresar')), valor: { tipo: 'ingreso' } },
    );
    // No a todo el mundo se le plantea quirófano: hay que haberlo valorado
    // (exploración + alguna prueba), salvo que sea una emergencia vital.
    if (vital || (explorado && paciente.pruebasRealizadas.length > 0)) {
      opciones.push({
        etiqueta: negrita(rojo(t('cirugiaUrgente'))),
        detalle: `quirófanos libres: ${ctx.hospital.quirofanosLibres}`,
        valor: { tipo: 'cirugia' },
      });
    }
    opciones.push(
      { etiqueta: cian(t('derivar')), detalle: '30 min', valor: { tipo: 'derivar' } },
      { etiqueta: gris(t('volverControl')), valor: { tipo: 'volver' } },
      { etiqueta: '⟳', oculta: true, valor: { tipo: 'reevaluar' } },
    );

    return ctx.io.elegir(`${t('queHacesCon')} ${paciente.nombre}?`, opciones);
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
      const cie = p.patologia.cie10 ? gris(`  [CIE-10: ${p.patologia.cie10}]`) : '';
      ctx.io.escribir(`  ${verde(`✔ Diagnóstico confirmado: ${p.patologia.nombre}`)}${cie}`);
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
  /**
   * El interrogatorio: el paciente jura algo y tú decides si tragártelo.
   * Acusar de mentir sin la prueba que lo desmonta no sirve de nada — como
   * en toda buena sala de interrogatorios.
   */
  private async interrogar(ctx: GameContext, p: Paciente): Promise<void> {
    const dossier = INTERROGATORIOS[p.patologia.id]!;
    this.mostrarAvisos(ctx, ctx.avanzarTiempo(5));

    ctx.io.escribir(`\n${cian('Le sostienes la mirada y repasas su historia. El paciente declara:')}`);
    ctx.io.escribir(`  ${negrita(dossier.afirmacion)}`);

    const respuesta = await ctx.io.elegir<RespuestaInterrogatorio>(t('queLeDices'), [
      { etiqueta: verde(t('creerle')), valor: 'creer' },
      { etiqueta: amarillo(t('dudar')), valor: 'dudar' },
      { etiqueta: rojo(t('acusar')), valor: 'mentira' },
    ]);

    // Acusación correcta pero sin la prueba encima: se enroca, puedes volver.
    if (
      respuesta === 'mentira' &&
      dossier.correcta === 'mentira' &&
      dossier.pruebaClave &&
      !p.pruebasRealizadas.includes(dossier.pruebaClave)
    ) {
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 3);
      ctx.io.escribir(
        amarillo('\nAciertas... pero sin nada en la mano. «Demuéstremelo», dice. Y tiene razón: vuelve cuando tengas la prueba.'),
      );
      p.notasClinicas.push(`Sospechas que miente: la ${PRUEBAS[dossier.pruebaClave].nombre.toLowerCase()} lo desmontaría.`);
      return; // no queda zanjado: se puede reintentar
    }

    p.interrogado = true;
    if (respuesta === dossier.correcta) {
      p.interrogatorioAcertado = true;
      p.descuentoPrueba = 15;
      ctx.cirujano.estres = Math.max(0, ctx.cirujano.estres - 4);
      ctx.io.escribir(verde(`\n${dossier.revelacion}`));
      ctx.io.escribir(gris('  La historia real acelera el caso: tu próxima prueba irá 15 minutos más rápida (ya sabes qué buscar).'));
      p.notasClinicas.push('Anamnesis real conseguida: el relato inicial no era todo.');
    } else {
      p.interrogatorioAcertado = false;
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 6);
      this.mostrarAvisos(ctx, ctx.avanzarTiempo(10));
      ctx.io.escribir(rojo(`\n${dossier.cerrojo}`));
      ctx.io.escribir(gris('  El paciente se cierra en banda. Diez minutos perdidos en reconstruir la confianza.'));
    }
  }

  /** Cierra el expediente: calcula y anuncia las estrellas del caso. */
  private calificar(ctx: GameContext, p: Paciente): void {
    p.estrellas = calificarCaso(p);
    ctx.io.escribir(
      `\n  ${negrita('EXPEDIENTE CERRADO')} — Calificación del caso: ${amarillo(pintarEstrellas(p.estrellas))}`,
    );
  }

  private resolverAlta(ctx: GameContext, p: Paciente): void {
    this.sacarDeEspera(ctx, p);
    ctx.stats.atendidos++;

    if (p.patologia.manejoCorrecto === 'alta') {
      p.estado = 'alta';
      ctx.stats.altasCorrectas++;
      ctx.cirujano.estres = Math.max(0, ctx.cirujano.estres - 4);
      ctx.io.escribir(verde(`\n✔ Alta correcta: ${p.patologia.nombre} no precisaba ingreso ni cirugía.`));
      ctx.io.escribir(gris(`  Perla docente: ${p.patologia.notaDocente}`));
      this.calificar(ctx, p);
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
      this.calificar(ctx, p);
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
      this.calificar(ctx, p);
    } else {
      ctx.stats.ingresosCorrectos++;
      ctx.io.escribir(verde(`\nIngresas a ${p.nombre} en observación. Prudente, aunque podía haberse ido de alta.`));
      this.calificar(ctx, p);
    }
  }

  /** Derivación en ambulancia: en el comarcal es criterio; en el de referencia, escurrir el bulto. */
  private resolverDerivacion(ctx: GameContext, p: Paciente): void {
    this.sacarDeEspera(ctx, p);
    ctx.stats.atendidos++;
    this.mostrarAvisos(ctx, ctx.avanzarTiempo(ctx.talisman === 'ambulancia' ? 10 : 30));
    p.estado = 'derivado';
    p.derivacionCorrecta = ctx.derivables.includes(p.patologia.id);

    if (p.derivacionCorrecta) {
      ctx.stats.derivacionesCorrectas++;
      ctx.cirujano.estres = Math.max(0, ctx.cirujano.estres - 3);
      ctx.io.escribir(verde(`\n\u2714 ${p.nombre} sale en ambulancia medicalizada, estabilizado y con la historia bien hecha.`));
      ctx.io.escribir(gris(`  ${p.patologia.nombre}: este centro no era el sitio. Saber derivar tambien salva vidas.`));
      ctx.io.escribir(gris(`  Perla docente: ${p.patologia.notaDocente}`));
    } else {
      ctx.stats.derivacionesErroneas++;
      ctx.cirujano.estres = Math.min(100, ctx.cirujano.estres + 5);
      ctx.io.escribir(amarillo(`\nDerivas a ${p.nombre}... y a la hora llama el adjunto receptor: "Y esto, no lo podiais asumir vosotros?"`));
      ctx.io.escribir(gris('  Una ambulancia ocupada, un paciente paseado y un favor que ahora debes.'));
    }
    this.calificar(ctx, p);
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
