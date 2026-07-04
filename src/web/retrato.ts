/**
 * Retratos procedurales de pacientes: SVG paramétrico sembrado con el
 * nombre + id del paciente, de modo que cada paciente tiene SIEMPRE la
 * misma cara (reproducible) y no hay dos iguales.
 *
 * Rasgos que varían: tono de piel, peinado y color de pelo (canas según
 * edad), vello facial, gafas, arrugas, y expresión de dolor según la
 * estabilidad (ceño, mueca, sudor, palidez).
 */
import type { EscenaDato } from '../core/io.js';

/** Hash FNV-1a → semilla estable a partir del nombre e id. */
function semillaDe(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PIELES = ['#f2c9a0', '#e8b98c', '#d9a271', '#c68d5e', '#a06a42', '#8d5a3a'];
const PELOS_JOVEN = ['#1d1a17', '#2f2318', '#4a3220', '#6e4a2a', '#8c3b2e', '#3d3d3d'];
const PELOS_MAYOR = ['#d7dce2', '#b9c0c9', '#98a1ab', '#e8e8e4'];
const FONDOS = ['#1b2a3a', '#22303f', '#252c40', '#1e3336', '#2c2838'];

const NOMBRES_FEMENINOS = new Set([
  'carmen', 'lucía', 'pilar', 'elena', 'dolores', 'marta', 'isabel', 'rosa', 'beatriz', 'nuria',
]);

/** Retrato desde rasgos explícitos (editor de personaje). */
export function retratoDesdeRasgos(rasgos: {
  piel: number;
  peinado: 'corto' | 'melena' | 'calvo';
  pelo: number;
  gafas: boolean;
  vello: boolean;
}): string {
  return dibujarRetrato({
    nombre: 'Cirujano/a',
    piel: PIELES[Math.max(0, Math.min(PIELES.length - 1, rasgos.piel))]!,
    pelo: PELOS_JOVEN[Math.max(0, Math.min(PELOS_JOVEN.length - 1, rasgos.pelo))]!,
    fondo: FONDOS[1]!,
    calvo: rasgos.peinado === 'calvo',
    melena: rasgos.peinado === 'melena',
    barba: rasgos.vello,
    gafas: rasgos.gafas,
    mayor: false,
    grave: false,
    dolorido: false,
  });
}

export function retratoPaciente(dato: EscenaDato): string {
  const nombre = dato.nombre ?? 'Paciente';
  const edad = dato.edad ?? 50;
  const estabilidad = dato.estabilidad ?? 80;
  const rng = mulberry32(semillaDe(`${nombre}#${dato.pacienteId ?? 0}`));
  const elegir = <T,>(lista: T[]): T => lista[Math.floor(rng() * lista.length)]!;

  const propio = nombre.split(' ')[0]!.toLowerCase();
  const femenino = NOMBRES_FEMENINOS.has(propio) || propio.endsWith('a');
  const mayor = edad >= 62;

  return dibujarRetrato({
    nombre,
    piel: elegir(PIELES),
    pelo: mayor ? elegir(PELOS_MAYOR) : elegir(PELOS_JOVEN),
    fondo: elegir(FONDOS),
    calvo: !femenino && (mayor ? rng() < 0.45 : rng() < 0.12),
    melena: femenino ? rng() < 0.75 : rng() < 0.08,
    barba: !femenino && rng() < 0.45,
    gafas: rng() < (mayor ? 0.55 : 0.22),
    mayor,
    grave: estabilidad < 45,
    dolorido: estabilidad < 70,
    variarFlequillo: rng() < 0.5,
  });
}

interface ParametrosRetrato {
  nombre: string;
  piel: string;
  pelo: string;
  fondo: string;
  calvo: boolean;
  melena: boolean;
  barba: boolean;
  gafas: boolean;
  mayor: boolean;
  grave: boolean;
  dolorido: boolean;
  variarFlequillo?: boolean;
}

function dibujarRetrato(p: ParametrosRetrato): string {
  const { nombre, piel, pelo, fondo, calvo, melena, barba, gafas, mayor, grave, dolorido } = p;
  const partes: string[] = [];

  partes.push(`<circle cx="50" cy="50" r="46" fill="${fondo}"/>`);
  // Bata de hospital
  partes.push(`<path d="M18 96 C22 76 34 70 50 70 C66 70 78 76 82 96 Z" fill="#7fa8c9"/>
  <path d="M40 74 L50 86 L60 74" fill="none" stroke="#5d84a3" stroke-width="2.5"/>`);
  // Cuello y cara
  partes.push(`<rect x="43" y="58" width="14" height="14" rx="5" fill="${piel}"/>`);
  partes.push(`<ellipse cx="50" cy="42" rx="20" ry="23" fill="${piel}"/>`);
  // Orejas
  partes.push(`<circle cx="29.5" cy="44" r="4" fill="${piel}"/><circle cx="70.5" cy="44" r="4" fill="${piel}"/>`);

  // Pelo
  if (melena) {
    partes.push(`<path d="M27 66 C22 40 28 18 50 18 C72 18 78 40 73 66 L66 62 C70 44 66 30 50 28 C34 30 30 44 34 62 Z" fill="${pelo}"/>`);
  } else if (!calvo) {
    const flequillo = p.variarFlequillo
      ? 'M30 38 C30 22 40 16 50 16 C60 16 70 22 70 38 C62 30 56 28 50 28 C44 28 38 30 30 38 Z'
      : 'M30 36 C28 20 42 14 52 15 C64 16 71 24 70 36 C64 26 54 26 46 27 C38 28 33 30 30 36 Z';
    partes.push(`<path d="${flequillo}" fill="${pelo}"/>`);
  } else {
    partes.push(`<path d="M30 38 C31 32 33 28 36 26 M64 26 C67 28 69 32 70 38" stroke="${pelo}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  }

  // Cejas (fruncidas si hay dolor)
  const cejaY = dolorido ? 33 : 34.5;
  const angulo = dolorido ? 3 : 0;
  partes.push(`<path d="M36 ${cejaY + angulo} L45 ${cejaY}" stroke="${pelo}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M55 ${cejaY} L64 ${cejaY + angulo}" stroke="${pelo}" stroke-width="2.4" stroke-linecap="round"/>`);

  // Ojos (apretados si está grave)
  partes.push(
    grave
      ? `<path d="M37 41 q3.5 2.6 7 0 M56 41 q3.5 2.6 7 0" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : `<circle cx="40.5" cy="41" r="2.4" fill="#1a1a1a"/><circle cx="59.5" cy="41" r="2.4" fill="#1a1a1a"/>`,
  );

  if (gafas) {
    partes.push(`<g stroke="#3c4753" stroke-width="1.8" fill="none">
    <rect x="33.5" y="36" width="13.5" height="10" rx="4"/>
    <rect x="53" y="36" width="13.5" height="10" rx="4"/>
    <path d="M47 40.5 h6 M33.5 40 h-4 M66.5 40 h4"/></g>`);
  }

  // Nariz
  partes.push(`<path d="M50 44 L48 51 q2 1.6 4 0 Z" fill="none" stroke="#00000033" stroke-width="1.6" stroke-linecap="round"/>`);

  // Barba / bigote
  if (barba) {
    partes.push(`<path d="M32 48 C33 62 40 66 50 66 C60 66 67 62 68 48 C66 60 60 61 50 61 C40 61 34 60 32 48 Z" fill="${pelo}" opacity=".9"/>`);
  }

  // Boca: mueca de dolor / gesto neutro
  partes.push(
    grave
      ? `<path d="M42 57 q8 -4 16 0" stroke="#8c3b3b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      : dolorido
        ? `<path d="M43 56.5 q7 1.6 14 0" stroke="#8c3b3b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
        : `<path d="M43 55.5 q7 3.4 14 0" stroke="#8c3b3b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  );

  // Arrugas de la edad
  if (mayor) {
    partes.push(`<path d="M35 50 q2 1.6 4 0 M61 50 q2 1.6 4 0 M44 30 h12" stroke="#00000026" stroke-width="1.4" fill="none" stroke-linecap="round"/>`);
  }

  // Sudor si está sufriendo (animado por CSS: clase gota)
  if (dolorido) {
    partes.push(`<path class="gota" d="M69 30 q3 4.5 0 7 q-3 -2.5 0 -7 Z" fill="#9ed7f2"/>`);
    if (grave) partes.push(`<path class="gota gota2" d="M31.5 27 q3 4.5 0 7 q-3 -2.5 0 -7 Z" fill="#9ed7f2"/>`);
  }

  return `<svg viewBox="0 0 100 100" class="retrato" role="img" aria-label="Retrato de ${nombre}">${partes.join('')}</svg>`;
}
