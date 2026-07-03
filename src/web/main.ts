/**
 * Bootstrap del juego en navegador.
 *
 * Parámetros de URL:
 *   ?seed=42          → partida reproducible
 *   ?modo=residente   → salta el menú de nivel (también ?modo=adjunto)
 */
import { ShiftEngine, type ModoJuego, type RitmoJuego } from '../core/ShiftEngine.js';
import { configurarColores } from '../ui/ansi.js';
import { WebIO } from './WebIO.js';

configurarColores(true); // en el navegador siempre emitimos ANSI y lo convertimos a HTML

const parametros = new URLSearchParams(location.search);

const semillaParam = parametros.get('seed');
const semilla =
  semillaParam !== null && Number.isFinite(Number(semillaParam)) ? Number(semillaParam) : undefined;

const modoParam = parametros.get('modo');
const modo: ModoJuego | undefined =
  modoParam === 'residente' || modoParam === 'adjunto' || modoParam === 'negra'
    ? modoParam
    : undefined;

const ritmoParam = parametros.get('ritmo');
const ritmo: RitmoJuego | undefined =
  ritmoParam === 'real' || ritmoParam === 'turnos' ? ritmoParam : undefined;

const io = new WebIO(document.getElementById('app')!);
new ShiftEngine(io, semilla, modo, ritmo).iniciar().catch((error: unknown) => {
  io.escribir(`\x1b[31mLa guardia ha terminado de forma inesperada: ${String(error)}\x1b[39m`);
});
