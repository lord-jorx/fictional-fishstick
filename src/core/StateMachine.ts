/**
 * State pattern: cada fase del juego es un estado que se ejecuta y
 * devuelve el siguiente estado (o null para terminar la partida).
 */
import type { GameContext } from './GameContext.js';

export interface GameState {
  readonly nombre: string;
  run(ctx: GameContext): Promise<GameState | null>;
}

export class MaquinaEstados {
  async ejecutar(inicial: GameState, ctx: GameContext): Promise<void> {
    let estado: GameState | null = inicial;
    while (estado !== null) {
      estado = await estado.run(ctx);
    }
  }
}
