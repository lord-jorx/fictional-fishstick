#!/usr/bin/env node
/**
 * Punto de entrada de Surgeon's Night: El Turno de Guardia.
 *
 * Uso:
 *   npm run dev                      # compila y juega
 *   node dist/index.js --seed 42     # partida reproducible
 *   node dist/index.js --residente   # modo residente (adjunto de apoyo)
 *   node dist/index.js --adjunto     # modo adjunto (sin red de seguridad)
 */
import { ShiftEngine, type ModoJuego } from './core/ShiftEngine.js';
import { ConsoleIO } from './ui/ConsoleIO.js';

function leerSemilla(argv: string[]): number | undefined {
  const i = argv.indexOf('--seed');
  if (i === -1) return undefined;
  const valor = Number(argv[i + 1]);
  return Number.isFinite(valor) ? valor : undefined;
}

function leerModo(argv: string[]): ModoJuego | undefined {
  if (argv.includes('--residente')) return 'residente';
  if (argv.includes('--adjunto')) return 'adjunto';
  return undefined;
}

const argv = process.argv.slice(2);
const engine = new ShiftEngine(new ConsoleIO(), leerSemilla(argv), leerModo(argv));
engine.iniciar().catch((error: unknown) => {
  console.error('La guardia ha terminado de forma inesperada:', error);
  process.exit(1);
});
