/**
 * HUD: cabecera de la guardia con reloj, métricas del cirujano,
 * recursos del hospital y barras de estado.
 */
import type { GameContext } from '../core/GameContext.js';
import type { Paciente } from '../core/types.js';
import { t } from '../i18n.js';
import { amarillo, cian, gris, negrita, rojo, verde } from './ansi.js';

/** Convierte minutos de guardia (0-1440, empieza a las 08:00) en "HH:MM". */
export function horaGuardia(minuto: number): string {
  const totalMin = (8 * 60 + minuto) % (24 * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function colorPorNivel(valor: number, invertido = false): (s: string) => string {
  const v = invertido ? 100 - valor : valor;
  if (v >= 60) return verde;
  if (v >= 30) return amarillo;
  return rojo;
}

/** Barra tipo ██████░░░░ coloreada según el nivel. */
export function barra(valor: number, invertido = false, ancho = 20): string {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  const llenos = Math.round((v / 100) * ancho);
  const cuerpo = '█'.repeat(llenos) + gris('░'.repeat(ancho - llenos));
  return `${colorPorNivel(v, invertido)(cuerpo)} ${String(v).padStart(3)}%`;
}

export function lineaSeparadora(): string {
  return gris('─'.repeat(64));
}

export function pintarHUD(ctx: GameContext): void {
  const restanteMin = Math.max(0, ctx.duracionGuardia - ctx.minuto);
  const restante = `${Math.floor(restanteMin / 60)}h ${String(restanteMin % 60).padStart(2, '0')}m`;

  ctx.io.escribir('\n' + lineaSeparadora());
  ctx.io.escribir(
    `  ${negrita(cian('SURGEON’S NIGHT'))}  ${gris('|')}  🕐 ${negrita(horaGuardia(ctx.minuto))}` +
      `  ${gris('|')}  ${t('quedan')} ${amarillo(restante)}`,
  );
  if (ctx.equipo.length > 1) {
    for (const c of ctx.equipo) {
      ctx.io.escribir(
        `  ${negrita(c.nombre.padEnd(12).slice(0, 12))} ${t('energia')} ${barra(c.energia, false, 12)}  ${t('estres')} ${barra(c.estres, true, 12)}`,
      );
    }
  } else {
    ctx.io.escribir(`  ${t('energia')} ${barra(ctx.cirujano.energia)}   ${t('estres')} ${barra(ctx.cirujano.estres, true)}`);
  }
  ctx.io.escribir(
    `  ${t('quirofanos')}: ${negrita(`${ctx.hospital.quirofanosLibres}/${ctx.hospital.quirofanosTotales}`)}` +
      `   ${t('camasRea')}: ${negrita(`${ctx.hospital.camasReaLibres}/${ctx.hospital.camasReaTotales}`)}` +
      `   ${t('enEspera')}: ${negrita(String(ctx.salaEspera.length))}`,
  );
  ctx.io.escribir(lineaSeparadora());
}

/** Ficha resumida de un paciente para listas y triaje. */
export function fichaPaciente(p: Paciente): string {
  const alerta = p.alertaPlanta ? rojo(' ⚠ EMPEORA EN PLANTA') : '';
  const reingreso = p.reingresado ? rojo(' ⚠ REINGRESO EN AMBULANCIA') : '';
  return `${negrita(p.nombre)}, ${p.edad} años — estabilidad ${barra(p.estabilidad, false, 10)}${alerta}${reingreso}`;
}
