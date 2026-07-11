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
import { HOSPITALES } from '../data/hospitales.js';
import { patologiaPorId } from '../data/pathologies.js';
import { MEJORAS, proximoRango, rangoPorXp, talismanPorId } from '../data/mejoras.js';
import { fijarIdioma, IDIOMAS, t, type Idioma } from '../i18n.js';
import type { Rasgos } from './io.js';
import { crearRng, GameContext, type MiembroEquipo } from './GameContext.js';
import { MaquinaEstados } from './StateMachine.js';

export type ModoJuego = 'adjunto' | 'residente' | 'negra' | 'festival';
export type RitmoJuego = 'turnos' | 'real';

const NOMBRES_DEFECTO = ['Dra. Ríos', 'Dr. Baró'];

export class ShiftEngine {
  private ctx: GameContext;
  private rng: () => number;
  private readonly semillaFijada: boolean;

  constructor(
    private readonly io: IO,
    semilla?: number,
    private modo?: ModoJuego,
    private ritmo?: RitmoJuego,
    private idiomaElegido?: Idioma,
    private diario?: boolean,
  ) {
    this.semillaFijada = semilla !== undefined;
    this.rng = crearRng(semilla ?? (Date.now() & 0x7fffffff));
    this.ctx = new GameContext(this.rng, io);
  }

  async iniciar(): Promise<void> {
    // Idioma antes que nada (la portada ya sale traducida... la interfaz;
    // el contenido clínico narrativo es un pack aparte, en español en v1).
    if (this.idiomaElegido === undefined) {
      this.idiomaElegido = await this.io.elegir<Idioma>(
        'Idioma / Language / Langue / Llengua / Sprache',
        IDIOMAS.map((i) => ({ etiqueta: i.nombre, valor: i.id })),
      );
    }
    fijarIdioma(this.idiomaElegido);

    this.pintarPortada();

    // ── La guardia del día: misma semilla para todo el mundo hoy ──
    // Reglas fijas (adjunto, por turnos, Hospital General) para que la
    // tabla compare noches idénticas. Solo si nadie fijó ya una semilla.
    if (this.diario === undefined && !this.semillaFijada) {
      const hoy = new Date();
      const dd = String(hoy.getDate()).padStart(2, '0');
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      this.diario = await this.io.elegir('¿Qué guardia fichas?', [
        { etiqueta: 'Guardia libre', detalle: 'una noche nueva cada vez', valor: false },
        {
          etiqueta: `📅 La guardia del día (${dd}/${mm})`,
          detalle: 'la MISMA noche para todo el mundo hoy: compárate y repite intentos',
          valor: true,
        },
      ]);
    }
    if (this.diario) {
      const hoy = new Date();
      const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      const semillaDia = Number(fecha.replace(/-/g, ''));
      this.rng = crearRng(semillaDia);
      this.ctx = new GameContext(this.rng, this.io);
      this.ctx.esDiario = true;
      this.ctx.fechaDiario = fecha;
      this.modo = 'adjunto';
      this.ritmo = 'turnos';
      this.io.escribir(
        gris('\n  Guardia del día: reglas fijas (adjunto, por turnos, Hospital General) y la') +
          gris(`\n  misma noche que cualquiera que fiche hoy. Fecha de servicio: ${fecha}.`),
      );
    }

    await this.prepararEquipo();

    // ── Nivel de hospital: los recursos definen la guardia ──
    const perfil = this.ctx.esDiario
      ? HOSPITALES.find((h) => h.id === 'general')!
      : await this.io.elegir(
          '¿En qué hospital toca esta noche?',
          HOSPITALES.map((h) => ({ etiqueta: h.nombre, detalle: h.descripcion, valor: h })),
        );
    this.ctx.nombreHospital = perfil.nombre;
    this.ctx.derivables = perfil.derivables;
    this.ctx.pruebasNoDisponibles = perfil.pruebasNoDisponibles;
    this.ctx.hospital.quirofanosTotales = this.ctx.hospital.quirofanosLibres = perfil.quirofanos;
    this.ctx.hospital.camasReaTotales = this.ctx.hospital.camasReaLibres = perfil.camasRea;
    if (perfil.pruebasNoDisponibles.length > 0) {
      this.io.escribir(gris('\n  Aviso del jefe: esta noche no hay angio-TC. Lo vascular grave, a referencia.'));
    }
    if (perfil.derivables.length > 0) {
      this.io.escribir(gris('  La ambulancia medicalizada está operativa: derivar con criterio también puntúa.'));
    }

    // ── Taquilla roguelite: la carrera desbloquea mejoras permanentes que
    // se aplican en CUALQUIER modo de juego. La taquilla se muestra siempre,
    // con lo desbloqueado y lo que aún te falta (la zanahoria a la vista) ──
    const xp = this.io.experiencia?.() ?? 0;
    for (const mejora of MEJORAS) {
      if (xp >= mejora.xpMin) this.ctx.mejoras.add(mejora.id);
    }
    if (this.ctx.mejoras.has('templanza')) {
      for (const c of this.ctx.equipo) c.estres = 0;
    }

    this.io.escena?.('taquilla', { xpCarrera: xp });
    this.io.escribir('\n' + lineaSeparadora());
    this.io.escribir(`  ${negrita(cian('🔓 TU TAQUILLA'))}  ${gris(`— ${rangoPorXp(xp)} · ${xp} XP de carrera`)}`);
    this.io.escribir(lineaSeparadora());
    for (const mejora of MEJORAS) {
      if (this.ctx.mejoras.has(mejora.id)) {
        this.io.escribir(`  ${cian('✓')} ${negrita(mejora.nombre)} ${gris(`— ${mejora.efecto}`)}`);
      } else {
        this.io.escribir(gris(`  🔒 ${mejora.nombre} — faltan ${mejora.xpMin - xp} XP  (${mejora.efecto})`));
      }
    }
    const prox = proximoRango(xp);
    if (prox) {
      this.io.escribir(gris(`\n  Siguiente rango: ${prox.nombre} (a ${prox.faltan} XP). La XP se gana con la puntuación de cada guardia.`));
    } else {
      this.io.escribir(gris('\n  Rango máximo alcanzado. Ya solo compites contra tu mejor noche.'));
    }

    // ── El botín de la guardia anterior: un talismán, una noche.
    // En la guardia del día no se aplica (ni se consume): la tabla compara
    // intentos en igualdad de condiciones ──
    if (!this.ctx.esDiario) {
      const talisman = talismanPorId(this.io.cogerTalisman?.());
      if (talisman) {
        this.ctx.talisman = talisman.id;
        this.io.escribir(
          `\n  ${negrita(cian(`${talisman.icono} EN EL BOLSILLO: ${talisman.nombre}`))} ${gris(`— ${talisman.efecto}. Solo por esta noche.`)}`,
        );
      }
    }

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
        {
          etiqueta: 'Noche de fiestas mayores',
          detalle: 'evento: aluvión de urgencias y un incidente de múltiples víctimas garantizado; puntuación ×1,35',
          valor: 'festival',
        },
      ]);
    }
    this.ctx.modoResidente = this.modo === 'residente';
    // La noche de fiestas comparte el motor duro de la guardia negra.
    this.ctx.modoNegra = this.modo === 'negra' || this.modo === 'festival';
    const modoFestival = this.modo === 'festival';
    if (this.ctx.modoResidente) {
      this.io.escribir(
        gris('\n  Modo residente: tu adjunto sugerirá pruebas, dudará en voz alta si te') +
          gris('\n  equivocas de destino y atenderá hasta 3 llamadas en quirófano.'),
      );
    }
    this.ctx.modoFestival = modoFestival;
    if (this.ctx.modoNegra && !modoFestival) {
      this.ctx.hospital.camasReaTotales = Math.max(1, this.ctx.hospital.camasReaTotales - 1);
      this.ctx.hospital.camasReaLibres = this.ctx.hospital.camasReaTotales;
      this.io.escribir(
        gris('\n  Guardia negra: la noche que se cuenta en el café de los cambios de turno.') +
          gris('\n  Más pacientes, presentaciones engañosas al doble, una cama de REA menos') +
          gris('\n  y el quirófano más disputado. Suerte. La necesitarás.'),
      );
    }
    if (modoFestival) {
      this.io.escribir(
        gris('\n  Fiestas mayores: verbena, litros de alcohol, peleas a la salida y un') +
          gris('\n  escenario con demasiada gente. La calle entera acabará pasando por tu') +
          gris('\n  puerta. En algún momento de la noche, sonará el teléfono rojo. Prepárate.'),
      );
    }

    // La guardia se genera tras elegir modo: en residente las atípicas bajan a
    // la mitad; en guardia negra/festival se duplican y llegan más pacientes.
    const atipicidad = this.ctx.modoResidente ? 0.5 : this.ctx.modoNegra ? 2 : 1;
    const extra = (modoFestival ? 4 : this.ctx.modoNegra ? 2 : 0) + perfil.pacientesExtra;
    const fabrica = new PatientFactory(this.rng, atipicidad, extra);
    this.ctx.programarLlegadas(fabrica.generarLlegadasDeGuardia());

    // ── El incidente de múltiples víctimas: algunas noches, el teléfono
    // rojo suena de verdad (en negra/festival, siempre; en festival, más grande) ──
    if (this.ctx.modoNegra || this.rng() < 0.45) {
      const minutoImv = 240 + Math.floor(this.rng() * 600);
      const pool = ['trauma', 'trauma', 'trauma', 'neumotorax', 'tce'];
      const cuantas = (modoFestival ? 7 : 4) + Math.floor(this.rng() * 3);
      const victimas = Array.from({ length: cuantas }, () => {
        const patologia = patologiaPorId(pool[Math.floor(this.rng() * pool.length)]!)!;
        return fabrica.crearPaciente(minutoImv, patologia);
      });
      // Que el triaje tenga textura: un agónico (etiqueta negra) y un
      // herido leve que llega andando (etiqueta verde).
      victimas[0]!.estabilidad = 8 + Math.floor(this.rng() * 8);
      victimas[victimas.length - 1]!.estabilidad = 72 + Math.floor(this.rng() * 14);
      this.ctx.programarImv(minutoImv, victimas);
    }

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

    this.ctx.consultasAdjunto = this.ctx.modoResidente ? 3 : this.ctx.mejoras.has('busca') ? 1 : 0;

    await this.io.pausa(t('fichar'));
    await new MaquinaEstados().ejecutar(new TriageState(), this.ctx);
  }

  // ────────────────────────────────────────────────────────────
  /** Solo o cooperativo local, con editor de personaje opcional. */
  private async prepararEquipo(): Promise<void> {
    const cuantos = await this.io.elegir('¿Cómo sales a esta guardia?', [
      { etiqueta: 'En solitario', valor: 1 },
      { etiqueta: 'Dúo cooperativo (local): dos cirujanos, una guardia', valor: 2 },
    ]);

    const equipo: MiembroEquipo[] = [];
    for (let i = 0; i < cuantos; i++) {
      equipo.push(await this.crearCirujano(i, cuantos));
    }
    this.ctx.equipo = equipo;
    if (cuantos === 2) {
      this.io.escribir(
        gris(`\n  ${equipo[0]!.nombre} y ${equipo[1]!.nombre} comparten la noche: cada paciente`) +
          gris('\n  tendrá su responsable, y el parte final no olvida de quién fue cada caso.'),
      );
    }
  }

  private async crearCirujano(indice: number, total: number): Promise<MiembroEquipo> {
    const porDefecto = NOMBRES_DEFECTO[indice] ?? `Dr. ${indice + 1}`;
    const titulo = total > 1 ? `Cirujano ${indice + 1}` : 'Tu cirujano';

    const modo = await this.io.elegir(`${titulo}: ¿ficha rápida o a medida?`, [
      { etiqueta: `Empezar ya como ${porDefecto}`, valor: 'rapido' as const },
      { etiqueta: 'Editor de personaje (nombre y aspecto)', valor: 'editor' as const },
    ]);

    if (modo === 'rapido' || !this.io.preguntarTexto) {
      return { nombre: porDefecto, energia: 100, estres: 10 };
    }

    const nombre = (await this.io.preguntarTexto('¿Cómo te llaman en el hospital?', porDefecto)).slice(0, 24);
    const rasgos: Rasgos = { piel: 1, peinado: 'corto', pelo: 0, gafas: false, vello: false, nombre };
    const previsualizar = () => this.io.escena?.('editor', { rasgos, nombre });

    previsualizar();
    rasgos.piel = await this.io.elegir('Tono de piel', [1, 2, 3, 4, 5].map((n) => ({ etiqueta: `Tono ${n}`, valor: n - 1 })));
    previsualizar();
    rasgos.peinado = await this.io.elegir('Peinado', [
      { etiqueta: 'Corto', valor: 'corto' as const },
      { etiqueta: 'Melena', valor: 'melena' as const },
      { etiqueta: 'Rapado', valor: 'calvo' as const },
    ]);
    previsualizar();
    rasgos.pelo = await this.io.elegir('Color de pelo', [
      { etiqueta: 'Negro', valor: 0 },
      { etiqueta: 'Castaño oscuro', valor: 1 },
      { etiqueta: 'Castaño', valor: 3 },
      { etiqueta: 'Cobrizo', valor: 4 },
    ]);
    previsualizar();
    rasgos.gafas = await this.io.elegir('¿Gafas?', [
      { etiqueta: 'Sin gafas', valor: false },
      { etiqueta: 'Con gafas', valor: true },
    ]);
    previsualizar();
    rasgos.vello = await this.io.elegir('¿Vello facial?', [
      { etiqueta: 'No', valor: false },
      { etiqueta: 'Sí', valor: true },
    ]);
    previsualizar();

    this.io.escribir(gris(`  ${nombre}, en plantilla. La cafetera ya sabe tu nombre.`));
    return { nombre, rasgos, energia: 100, estres: 10 };
  }

  private pintarPortada(): void {
    this.io.escena?.('portada');
    this.io.escribir(lineaSeparadora());
    this.io.escribir(negrita(cian("   SURGEON'S NIGHT — El Turno de Guardia")));
    this.io.escribir(lineaSeparadora());
    this.io.escribir(`
  ${gris('Llueve sobre la ciudad y el busca acaba de sonar por primera vez.')}
  ${gris('Van a ser veinticuatro horas largas.')}

  Este hospital te da ${negrita('2 quirófanos')}, ${negrita('3 camas de REA')} y una cafetera
  que hace un ruido raro. Con eso tienes que llegar vivo — tú y ellos —
  a las ${negrita('08:00')} de mañana.

  ${negrita('Lo que aprendí en mi primera guardia, y nadie me contó:')}
   • Aquí todo cuesta tiempo, y el tiempo lo pagan los que esperan.
   • Los pacientes no mienten por maldad. Mienten por miedo, por
     vergüenza o por sus nietos. Tu trabajo es notarlo.
   • La prueba correcta cierra el caso. Operar a ciegas también,
     pero de otra manera.
   • No todo vientre se abre. Firmar un alta es un acto quirúrgico.
   • Y vigila tu ${negrita('energía')}: a las cinco de la mañana las manos
     son de otro. El café ayuda. Hasta que deja de ayudar.

  ${gris('¿Sin bata? Entra de Residente: alguien con canas te irá soplando.')}
`);
  }
}
