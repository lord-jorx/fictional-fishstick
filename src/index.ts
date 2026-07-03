#!/usr/bin/env node
/**
 * Punto de entrada de Surgeon's Night: El Turno de Guardia.
 *
 * Uso:
 *   npm run dev            # compila y juega
 *   node dist/index.js --seed 42   # partida reproducible
 */
import { ShiftEngine } from './core/ShiftEngine.js';

function leerSemilla(argv: string[]): number | undefined {
  const i = argv.indexOf('--seed');
  if (i === -1) return undefined;
  const valor = Number(argv[i + 1]);
  return Number.isFinite(valor) ? valor : undefined;
}

const engine = new ShiftEngine(leerSemilla(process.argv.slice(2)));
engine.iniciar().catch((error: unknown) => {
  console.error('La guardia ha terminado de forma inesperada:', error);
  process.exit(1);
});
