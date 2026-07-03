/**
 * Quirófano visual: escenas del campo operatorio e iconos de instrumental.
 *
 * - `escenaCampo(evento)` pinta una vista laparoscópica animada acorde al
 *   evento (sangrado que crece, bilis, asa isquémica, monitor en alarma...).
 * - `iconoHerramienta(texto)` asigna a cada opción quirúrgica el icono del
 *   instrumento/maniobra que describe, para decidir visualmente.
 *
 * Los iconos son deliberadamente NEUTROS: no delatan cuál es la opción
 * correcta, solo ilustran la técnica.
 */

let contadorIds = 0;

// ────────────────────────────────────────────────────────────────
// Iconos de instrumental (viewBox 0 0 40 40, trazo acero)
// ────────────────────────────────────────────────────────────────

const I = (cuerpo: string): string =>
  `<svg viewBox="0 0 40 40" class="icono-svg" aria-hidden="true"><g fill="none" stroke="#b9cbdc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</g></svg>`;

const ICONOS: Record<string, string> = {
  bisturi: I(`<path d="M8 32 L24 16 l6 6 -12 8 z"/><path d="M24 16 L32 8" stroke-width="3"/>`),
  tijeras: I(`<circle cx="12" cy="30" r="4"/><circle cx="28" cy="30" r="4"/><path d="M14 27 L28 9 M26 27 L12 9"/>`),
  clipadora: I(`<path d="M8 30 L22 16 M8 24 L20 12"/><path d="M22 16 L32 8 M20 12 L30 6"/><path d="M25 13 l4 4" stroke-width="3.2" stroke="#e8f2fb"/>`),
  gasa: I(`<rect x="9" y="11" width="22" height="20" rx="3"/><path d="M9 17 h22 M9 24 h22 M15 11 v20 M24 11 v20" stroke-width="1.2" opacity=".8"/>`),
  suero: I(`<path d="M14 6 h12 v14 a6 6 0 0 1 -12 0 z"/><path d="M20 6 V4 M20 27 v6"/><path d="M20 36 q2 -2.5 0 -4 q-2 1.5 0 4" fill="#9ed7f2" stroke="none"/>`),
  grapadora: I(`<path d="M8 26 h18 l6 -6"/><path d="M8 20 h16 l6 -6" /><path d="M11 23 v3 M15 23 v3 M19 23 v3" stroke-width="1.4"/>`),
  sutura: I(`<path d="M28 8 a10 10 0 0 1 -2 18"/><path d="M26 26 q-6 3 -12 0 t-8 3" stroke-width="1.4"/>`),
  cauterio: I(`<path d="M12 34 L22 24"/><rect x="20" y="12" width="12" height="12" rx="3" transform="rotate(45 26 18)"/><path d="M28 6 l-3 5 h5 l-3 5" stroke="#ffd43b"/>`),
  aspirador: I(`<path d="M10 32 L26 16"/><path d="M26 16 L32 10 M24 22 l4 4" /><path d="M12 12 q1.5 2 0 3.6 M17 9 q1.5 2 0 3.6" stroke="#9ed7f2" stroke-width="1.4"/>`),
  bolsa: I(`<path d="M14 8 h12 v6 c6 4 6 14 0 18 h-12 c-6 -4 -6 -14 0 -18 z"/><circle cx="20" cy="20" r="3.4"/>`),
  cateter: I(`<path d="M6 32 C16 30 22 24 26 16"/><circle cx="29" cy="11" r="4.6"/><circle cx="29" cy="11" r="1.6" fill="#b9cbdc" stroke="none"/>`),
  mano: I(`<path d="M13 34 V16 a2.4 2.4 0 0 1 4.8 0 V22 M17.8 22 v-9 a2.4 2.4 0 0 1 4.8 0 v9 M22.6 22 v-7 a2.4 2.4 0 0 1 4.8 0 v9 c0 6 -3 10 -8 10 h-2 c-2.5 0 -4.4 -1.6 -4.4 -4"/>`),
  reloj: I(`<circle cx="20" cy="21" r="12"/><path d="M20 14 v7 l5 4 M15 5 l-4 3 M25 5 l4 3"/>`),
  telefono: I(`<path d="M10 8 q-3 12 8 21 q6 5 12 3 l1 -5 -6 -3 -3 2 q-6 -4 -8 -10 l3 -2 -2 -7 z"/>`),
  ojo: I(`<path d="M6 21 q14 -13 28 0 q-14 13 -28 0 z"/><circle cx="20" cy="21" r="4"/>`),
  optica: I(`<circle cx="17" cy="17" r="9"/><path d="M24 24 L33 33" stroke-width="3"/><path d="M13 15 q3 -3 6 -2" stroke-width="1.4"/>`),
};

/** Palabras clave → herramienta. El orden importa: gana la primera. */
const MAPA_HERRAMIENTAS: Array<[RegExp, string]> = [
  [/llamar al adjunto/i, 'telefono'],
  [/clip/i, 'clipadora'],
  [/grapadora/i, 'grapadora'],
  [/endoloop|anastomosis|sutur|puntos|parche|malla/i, 'sutura'],
  [/gasa|compres|empaquet|packing/i, 'gasa'],
  [/suero caliente|lavado|lavar/i, 'suero'],
  [/aspir/i, 'aspirador'],
  [/tijera|secci[oó]n de|kelotom/i, 'tijeras'],
  [/electro|cauter|coagul/i, 'cauterio'],
  [/fogarty|revasculariz|embolectom|cat[eé]ter|veress/i, 'cateter'],
  [/estoma|colostom|ileostom|hartmann/i, 'bolsa'],
  [/pausa|reevaluar|esperar|second[- ]look|control de da[ñn]os|vacuum/i, 'reloj'],
  [/limpiar la [oó]ptica|recolocar|exposici[oó]n/i, 'optica'],
  [/ignor|dejar|seguir|reintroducir|no resecar|confiar/i, 'ojo'],
  [/sujetar|tirar|tracci[oó]n|reducir|disecci[oó]n roma|envolver|liberar|forzar/i, 'mano'],
  [/resec|antrectom|esplenectom|convertir|abierta|hasson|biopsia|esplenorrafia/i, 'bisturi'],
];

export function iconoHerramienta(textoOpcion: string): string {
  for (const [re, icono] of MAPA_HERRAMIENTAS) {
    if (re.test(textoOpcion)) return ICONOS[icono]!;
  }
  return ICONOS['bisturi']!;
}

// ────────────────────────────────────────────────────────────────
// Escenas del campo operatorio
// ────────────────────────────────────────────────────────────────

function campo(overlay: string): string {
  const id = `campo${contadorIds++}`;
  return `
<svg viewBox="0 0 240 132" class="campo-svg" role="img" aria-label="Campo quirúrgico">
  <defs>
    <radialGradient id="${id}-tejido" cx=".5" cy=".45" r=".75">
      <stop offset="0" stop-color="#e8938c"/><stop offset=".55" stop-color="#c96b66"/><stop offset="1" stop-color="#7e3d3c"/>
    </radialGradient>
    <clipPath id="${id}-marco"><rect x="4" y="4" width="232" height="124" rx="14"/></clipPath>
  </defs>
  <rect width="240" height="132" rx="16" fill="#090d13"/>
  <g clip-path="url(#${id}-marco)">
    <rect x="4" y="4" width="232" height="124" fill="url(#${id}-tejido)"/>
    <ellipse cx="92" cy="58" rx="52" ry="30" fill="#d98079" opacity=".85"/>
    <ellipse cx="160" cy="84" rx="44" ry="24" fill="#b35a58" opacity=".8"/>
    <path d="M60 40 q20 -12 44 -4 M120 96 q24 10 48 2" stroke="#eaa59e" stroke-width="3" fill="none" opacity=".6"/>
    <path d="M0 116 L54 84 l6 8 -50 32 z" fill="#cfd8e2"/>
    <path d="M54 84 l6 8" stroke="#8fa1b3" stroke-width="2"/>
    <path d="M240 20 L186 52 l-5 -8 52 -32 z" fill="#cfd8e2"/>
    ${overlay}
    <ellipse cx="120" cy="66" rx="150" ry="86" fill="none" stroke="#05070a" stroke-width="42" opacity=".85"/>
  </g>
</svg>`;
}

const OVERLAYS: Record<string, string> = {
  sangrado: `
    <ellipse class="sangre" cx="122" cy="74" rx="26" ry="14" fill="#a41220"/>
    <ellipse class="sangre" cx="122" cy="74" rx="14" ry="7" fill="#d21f2e" style="animation-delay:.4s"/>
    <path class="chorro" d="M118 60 q4 -8 9 -3" stroke="#d21f2e" stroke-width="3" fill="none"/>`,
  adherencias: `
    <path d="M70 44 C100 60 140 52 176 78 M84 84 C110 66 150 88 180 60 M96 36 C120 58 150 44 172 92"
      stroke="#f2e3cf" stroke-width="4" fill="none" opacity=".9"/>
    <path d="M70 44 C100 60 140 52 176 78" stroke="#d9c2a4" stroke-width="1.6" fill="none"/>`,
  fuga: `
    <ellipse class="bilis" cx="128" cy="80" rx="30" ry="12" fill="#7a8a1e" opacity=".9"/>
    <ellipse cx="128" cy="80" rx="16" ry="6" fill="#a3b52b" opacity=".9"/>
    <circle class="gota-bilis" cx="118" cy="58" r="3" fill="#a3b52b"/>
    <circle cx="140" cy="72" r="2.2" fill="#e8e4c9"/><circle cx="120" cy="84" r="2.6" fill="#e8e4c9"/><circle cx="134" cy="86" r="1.8" fill="#e8e4c9"/>`,
  necrosis: `
    <path class="asa-necrotica" d="M84 62 q10 -16 34 -12 q26 4 30 22 q3 16 -16 20 q-24 5 -40 -6 q-14 -10 -8 -24 z" fill="#4a2a52" stroke="#2e1836" stroke-width="3"/>
    <path d="M92 64 q12 -10 30 -6 M90 78 q16 10 36 4" stroke="#6b3f77" stroke-width="2.4" fill="none"/>`,
  monitor: `
    <g>
      <rect x="150" y="12" width="78" height="44" rx="6" fill="#0b1420" stroke="#33465f"/>
      <path class="traza-alarma" d="M156 36 h14 l4 -12 5 22 4 -14 5 8 h12 l4 -10 5 16 4 -10 h9" stroke="#ff5d5d" stroke-width="2" fill="none"/>
      <circle class="alarma-led" cx="222" cy="20" r="3" fill="#ff5d5d"/>
    </g>`,
  friable: `
    <g opacity=".9">
      <circle cx="110" cy="64" r="7" fill="#8e3f45"/><circle cx="128" cy="58" r="5" fill="#93474c"/>
      <circle cx="140" cy="72" r="8" fill="#7e343b"/><circle cx="118" cy="80" r="5" fill="#93474c"/>
      <path d="M104 58 q18 -8 42 2" stroke="#5e2228" stroke-width="2" fill="none" stroke-dasharray="4 3"/>
    </g>`,
  generico: `
    <circle cx="108" cy="60" r="2" fill="#ffe9e6" opacity=".8"/>
    <circle cx="146" cy="76" r="2.4" fill="#ffe9e6" opacity=".6"/>`,
};

const MAPA_ESCENAS: Array<[RegExp, string]> = [
  [/sangr|hemoperitoneo|ti[ñn]e|exang/i, 'sangrado'],
  [/adheren|brida/i, 'adherencias'],
  [/bilis|fecaloide|contamin|c[aá]lculos|fuga|perfora|salida de contenido/i, 'fuga'],
  [/viol[aá]ce|necr[oó]|cian[oó]t|viabilidad|isquem|hipocapta/i, 'necrosis'],
  [/anestesia|hipotens|desatur|tr[ií]ada|ph 7|noradrenalina|inestab|desploma|ta \d|coagulaci[oó]n/i, 'monitor'],
  [/friable|edemat|indurad/i, 'friable'],
];

/** Vista del campo quirúrgico acorde al texto del evento. */
export function escenaCampo(evento: string): string {
  for (const [re, clave] of MAPA_ESCENAS) {
    if (re.test(evento)) return campo(OVERLAYS[clave]!);
  }
  return campo(OVERLAYS['generico']!);
}
