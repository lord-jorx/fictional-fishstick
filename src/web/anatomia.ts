/**
 * Simulación quirúrgica sobre esquema anatómico, al estilo de los
 * simuladores paso a paso: cada cirugía tiene su diagrama de órganos
 * (flat, estilizado, apto para todos los públicos), un anillo dorado que
 * señala DÓNDE se trabaja en la etapa actual, checks en las etapas ya
 * completadas, etiquetas anatómicas y la complicación dibujada encima
 * cuando el evento la trae (sangre, bilis, isquemia, alarma del monitor).
 */

let ids = 0;

const ETIQUETA = (x: number, y: number, tx: number, ty: number, texto: string): string =>
  `<path d="M${x} ${y} L${tx} ${ty}" stroke="#6d6350" stroke-width=".8"/>` +
  `<text x="${tx + (tx >= x ? 3 : -3)}" y="${ty + 3}" font-size="8" fill="#a99b7f" text-anchor="${tx >= x ? 'start' : 'end'}" font-family="inherit">${texto}</text>`;

/** Marca de etapa completada. */
const CHECK = ([x, y]: readonly [number, number]): string =>
  `<circle cx="${x}" cy="${y}" r="7" fill="#2c3320" stroke="#97b077" stroke-width="1.4"/>` +
  `<path d="M${x - 3} ${y} l2.4 2.6 4 -5" stroke="#97b077" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;

/** Anillo objetivo de la etapa actual. */
const OBJETIVO = ([x, y]: readonly [number, number]): string =>
  `<circle class="objetivo-anillo" cx="${x}" cy="${y}" r="11" fill="none" stroke="#cfa257" stroke-width="2"/>` +
  `<circle cx="${x}" cy="${y}" r="2.6" fill="#cfa257"/>`;

interface EsquemaCirugia {
  titulo: string;
  /** Punto de trabajo de cada etapa sobre el diagrama. */
  puntos: ReadonlyArray<readonly [number, number]>;
  organos: string;
}

const ESQUEMAS: Record<string, EsquemaCirugia> = {
  apendicitis: {
    titulo: 'APENDICECTOMÍA',
    puntos: [[140, 42], [166, 96], [148, 78]],
    organos: `
      <path d="M96 36 C74 60 74 96 100 112 C124 126 152 118 158 96 L158 60 C152 40 120 28 96 36 Z" fill="#a8695e" stroke="#7c453d" stroke-width="2"/>
      <path d="M158 78 q26 6 30 22 q3 14 -10 16 q-11 1 -14 -12" fill="none" stroke="#c07f6d" stroke-width="9" stroke-linecap="round"/>
      <path d="M150 70 q20 4 26 20" stroke="#8a5a3f" stroke-width="1.6" fill="none" stroke-dasharray="3 3"/>
      ${ETIQUETA(110, 70, 52, 40, 'ciego')}
      ${ETIQUETA(180, 100, 232, 128, 'apéndice')}
      ${ETIQUETA(160, 82, 226, 52, 'mesoapéndice')}`,
  },
  colecistitis: {
    titulo: 'COLECISTECTOMÍA',
    puntos: [[142, 92], [128, 100], [140, 62]],
    organos: `
      <path d="M60 34 L206 40 C222 44 224 66 208 76 L120 84 C84 84 58 66 60 34 Z" fill="#8f4f46" stroke="#6b342e" stroke-width="2"/>
      <path d="M156 74 C170 84 168 108 152 116 C136 124 122 114 124 98 C126 86 140 78 156 74 Z" fill="#7c9457" stroke="#556b39" stroke-width="2"/>
      <path d="M132 104 Q114 112 104 124" stroke="#556b39" stroke-width="3.5" fill="none"/>
      <path d="M96 118 L120 140" stroke="#7f9b3f" stroke-width="4" fill="none"/>
      <path d="M136 96 Q120 96 110 104" stroke="#a84a42" stroke-width="2.6" fill="none"/>
      ${ETIQUETA(90, 52, 44, 30, 'hígado')}
      ${ETIQUETA(152, 96, 224, 96, 'vesícula')}
      ${ETIQUETA(118, 100, 66, 136, 'a. cística')}
      ${ETIQUETA(108, 128, 176, 146, 'colédoco')}`,
  },
  obstruccion: {
    titulo: 'ADHESIOLISIS',
    puntos: [[130, 74], [166, 92], [110, 108]],
    organos: `
      <path d="M62 60 q24 -26 56 -10 q30 14 12 34 q-16 18 -44 8 q-30 -10 -24 -32" fill="none" stroke="#c07f6d" stroke-width="13" stroke-linecap="round"/>
      <path d="M120 96 q30 -18 60 -4 q26 12 12 30 q-16 18 -48 6" fill="none" stroke="#b5766b" stroke-width="13" stroke-linecap="round"/>
      <path d="M124 52 L142 96" stroke="#e8dcc0" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M186 120 q18 4 26 12" stroke="#9c5a52" stroke-width="7" stroke-linecap="round" fill="none"/>
      ${ETIQUETA(94, 62, 40, 34, 'asa dilatada')}
      ${ETIQUETA(133, 72, 208, 34, 'brida')}
      ${ETIQUETA(204, 128, 246, 150, 'asa distal')}`,
  },
  diverticulitis: {
    titulo: 'SIGMOIDECTOMÍA · HARTMANN',
    puntos: [[150, 90], [190, 44], [96, 116]],
    organos: `
      <path d="M60 44 L60 110 Q60 132 84 132 L120 128 Q152 122 158 100 Q166 74 148 64 Q128 56 118 74" fill="none" stroke="#b5766b" stroke-width="14" stroke-linecap="round"/>
      <circle cx="146" cy="86" r="4" fill="#7c453d"/><circle cx="136" cy="98" r="3.4" fill="#7c453d"/>
      <circle cx="152" cy="100" r="3" fill="#7c453d"/><circle cx="128" cy="110" r="3.4" fill="#7c453d"/>
      <path d="M150 84 l14 -12" stroke="#a41220" stroke-width="2.4"/>
      <path d="M84 132 L84 150" stroke="#9c5a52" stroke-width="9" stroke-linecap="round"/>
      ${ETIQUETA(70, 70, 34, 40, 'colon')}
      ${ETIQUETA(142, 92, 218, 78, 'sigma perforado')}
      ${ETIQUETA(86, 140, 168, 152, 'muñón rectal')}`,
  },
  isquemia: {
    titulo: 'REVASCULARIZACIÓN DE LA AMS',
    puntos: [[118, 66], [172, 104], [92, 128]],
    organos: `
      <path d="M96 20 L96 150" stroke="#a84a42" stroke-width="11" stroke-linecap="round"/>
      <path d="M96 56 Q126 62 146 84 Q162 100 186 108" stroke="#c96b5e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M126 70 q10 -8 18 -4 M146 84 q12 -6 22 0 M160 96 q10 -8 20 -4" stroke="#c96b5e" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="110" y="60" width="15" height="11" rx="5" fill="#3c2330" stroke="#241320" stroke-width="1.4"/>
      <path d="M158 112 q22 -14 48 -4 q20 8 8 24 q-14 16 -42 4 q-20 -8 -14 -24" fill="none" stroke="#6d4a72" stroke-width="11" stroke-linecap="round" opacity=".85"/>
      ${ETIQUETA(98, 34, 46, 24, 'aorta')}
      ${ETIQUETA(130, 74, 60, 84, 'AMS · émbolo')}
      ${ETIQUETA(196, 122, 240, 148, 'asa isquémica')}`,
  },
  trauma: {
    titulo: 'ESPLENECTOMÍA',
    puntos: [[150, 70], [128, 78], [90, 120]],
    organos: `
      <path d="M138 40 C170 40 190 62 182 90 C176 112 150 118 132 104 C112 90 112 52 138 40 Z" fill="#7a3a4e" stroke="#57263a" stroke-width="2"/>
      <path d="M132 76 Q112 80 98 92" stroke="#a84a42" stroke-width="4" fill="none"/>
      <path d="M132 84 Q114 90 102 102" stroke="#5b76a3" stroke-width="4" fill="none"/>
      <path d="M148 56 L170 72 M144 70 L166 88" stroke="#57263a" stroke-width="2.2"/>
      <ellipse cx="86" cy="128" rx="30" ry="12" fill="#a41220" opacity=".55"/>
      ${ETIQUETA(160, 56, 224, 34, 'bazo (grado IV)')}
      ${ETIQUETA(112, 86, 44, 66, 'hilio esplénico')}
      ${ETIQUETA(92, 128, 190, 150, 'hemoperitoneo')}`,
  },
  ulcus: {
    titulo: 'CIERRE + EPIPLOPLASTIA',
    puntos: [[168, 92], [152, 76], [148, 92]],
    organos: `
      <path d="M92 34 C60 48 56 92 88 112 C116 130 152 122 162 98 L172 76 C176 56 150 30 118 30 C108 30 100 31 92 34 Z" fill="#c07f6d" stroke="#8a5245" stroke-width="2"/>
      <path d="M162 98 Q176 104 190 100" stroke="#a8695e" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="152" cy="78" r="6" fill="#57263a" stroke="#3a1626" stroke-width="1.6"/>
      <path d="M150 66 q4 -8 2 -14 M158 68 q6 -6 6 -12" stroke="#8a8f4b" stroke-width="2" fill="none"/>
      ${ETIQUETA(104, 66, 44, 40, 'estómago')}
      ${ETIQUETA(154, 80, 224, 56, 'perforación')}
      ${ETIQUETA(184, 100, 236, 128, 'píloro')}`,
  },
  hernia: {
    titulo: 'HERNIORRAFIA URGENTE',
    puntos: [[150, 96], [128, 78], [110, 60]],
    organos: `
      <path d="M40 46 L240 46" stroke="#8a7a5e" stroke-width="9" stroke-linecap="round"/>
      <path d="M40 60 L240 60" stroke="#6d6046" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 6"/>
      <path d="M116 62 Q120 84 140 96 Q158 106 166 100" stroke="#8a7a5e" stroke-width="4" fill="none"/>
      <path d="M124 70 C118 96 136 116 158 110 C176 104 176 82 160 74" fill="#d9cba8" opacity=".35" stroke="#b3a37d" stroke-width="1.6"/>
      <path d="M132 84 q10 -10 22 -2 q10 8 0 16 q-12 8 -22 -2 q-6 -6 0 -12" fill="none" stroke="#8e4a5e" stroke-width="7" stroke-linecap="round"/>
      ${ETIQUETA(70, 50, 40, 28, 'pared abdominal')}
      ${ETIQUETA(126, 72, 52, 100, 'anillo herniario')}
      ${ETIQUETA(158, 96, 226, 124, 'asa incarcerada')}`,
  },
};

/** Monitor de anestesia en vivo: constantes derivadas de la estabilidad. */
function chipConstantes(evento: string, estabilidad: number): string {
  if (/anestesia|hipotens|desatur|tr[ií]ada|noradrenalina|desploma|ph 7/i.test(evento)) return '';
  const fc = Math.round(132 - estabilidad * 0.62);
  const tas = Math.round(68 + estabilidad * 0.52);
  const sat = Math.min(99, Math.round(89 + estabilidad * 0.1));
  const color = estabilidad >= 60 ? '#97b077' : estabilidad >= 35 ? '#d9b36a' : '#c9645a';
  return `<g><rect x="196" y="8" width="76" height="30" rx="5" fill="#0b0f14" stroke="#3b3223"/>
    <text x="204" y="21" font-size="8" fill="${color}" font-family="inherit">FC ${fc}  TA ${tas}</text>
    <text x="204" y="32" font-size="8" fill="${color}" font-family="inherit">SatO₂ ${sat}%</text>
    <circle class="alarma-led" cx="264" cy="15" r="2.4" fill="${color}"/></g>`;
}

/** Complicación dibujada sobre el punto de trabajo actual. */
function estampa(evento: string, [x, y]: readonly [number, number]): string {
  if (/sangr|hemoperitoneo|ti[ñn]e|exang|coagul/i.test(evento)) {
    return `<ellipse class="sangre" cx="${x}" cy="${y + 6}" rx="16" ry="8" fill="#a41220" opacity=".85"/>
      <ellipse class="sangre" cx="${x}" cy="${y + 6}" rx="8" ry="4" fill="#d21f2e" style="animation-delay:.4s"/>`;
  }
  if (/bilis|fecaloide|contamin|c[aá]lculos|fuga|perfora|salida/i.test(evento)) {
    return `<ellipse class="bilis" cx="${x}" cy="${y + 8}" rx="14" ry="6" fill="#7a8a1e" opacity=".85"/>
      <circle class="gota-bilis" cx="${x - 6}" cy="${y - 4}" r="2.6" fill="#a3b52b"/>`;
  }
  if (/viol[aá]ce|necr[oó]|cian[oó]t|viabilidad|isquem/i.test(evento)) {
    return `<circle class="asa-necrotica" cx="${x}" cy="${y}" r="13" fill="#4a2a52" opacity=".6"/>`;
  }
  if (/anestesia|hipotens|desatur|tr[ií]ada|noradrenalina|desploma|ph 7/i.test(evento)) {
    return `<g><rect x="196" y="8" width="76" height="30" rx="5" fill="#0b1420" stroke="#5c3a3a"/>
      <path class="traza-alarma" d="M202 24 h12 l3 -9 4 16 3 -10 4 6 h10 l3 -8 4 12 3 -8 h16" stroke="#c0544a" stroke-width="1.8" fill="none"/>
      <circle class="alarma-led" cx="264" cy="15" r="2.6" fill="#c0544a"/></g>`;
  }
  return '';
}

/**
 * Esquema anatómico de la etapa actual. Devuelve null si la cirugía no
 * tiene diagrama (los adaptadores muestran entonces solo el texto).
 */
export function esquemaQuirurgico(
  patologiaId: string | undefined,
  etapa: number,
  totalEtapas: number,
  evento = '',
  imprevisto = false,
  estabilidad = 75,
): string | null {
  const esquema = patologiaId ? ESQUEMAS[patologiaId] : undefined;
  if (!esquema) return null;

  const id = `anat${ids++}`;
  const indice = Math.max(0, Math.min(esquema.puntos.length - 1, etapa - 1));
  const actual = esquema.puntos[indice]!;

  const completadas = esquema.puntos
    .slice(0, Math.max(0, (imprevisto ? etapa : etapa - 1)))
    .map(CHECK)
    .join('');

  const progreso = Array.from({ length: totalEtapas }, (_, i) => {
    const cx = 24 + i * 18;
    const estado = i + 1 < etapa ? '#97b077' : i + 1 === etapa ? '#cfa257' : '#3b3223';
    return `<circle cx="${cx}" cy="156" r="4.2" fill="${estado}"/>` +
      (i > 0 ? `<path d="M${cx - 13} 156 H${cx - 5}" stroke="#3b3223" stroke-width="1.6"/>` : '');
  }).join('');

  const sello = imprevisto
    ? `<text x="270" y="157" font-size="8.5" fill="#c9645a" text-anchor="end" font-family="inherit">⚠ IMPREVISTO</text>`
    : `<text x="270" y="157" font-size="8.5" fill="#8a7f6a" text-anchor="end" font-family="inherit">ETAPA ${etapa}/${totalEtapas}</text>`;

  return `
<svg viewBox="0 0 280 170" class="anatomia-svg" role="img" aria-label="Esquema quirúrgico: ${esquema.titulo}">
  <defs><clipPath id="${id}"><rect x="2" y="2" width="276" height="166" rx="8"/></clipPath></defs>
  <rect width="280" height="170" rx="9" fill="#0f0b07" stroke="#3b3223"/>
  <g clip-path="url(#${id})">
    <path d="M20 0 V170 M60 0 V170 M100 0 V170 M140 0 V170 M180 0 V170 M220 0 V170 M260 0 V170
             M0 30 H280 M0 70 H280 M0 110 H280 M0 150 H280" stroke="#171209" stroke-width="1"/>
    ${esquema.organos}
    ${completadas}
    <path class="instrumento" d="M262 150 L${actual[0] + 14} ${actual[1] + 10}" stroke="#cfd8e2" stroke-width="4.5" stroke-linecap="round"/>
    <path class="instrumento" d="M${actual[0] + 14} ${actual[1] + 10} l-7 -5" stroke="#8fa1b3" stroke-width="2.4"/>
    ${OBJETIVO(actual)}
    ${estampa(evento, actual)}
    ${chipConstantes(evento, estabilidad)}
  </g>
  <text x="10" y="18" font-size="9.5" fill="#cfa257" letter-spacing="2" font-family="Georgia, serif">${esquema.titulo}</text>
  ${progreso}
  ${sello}
</svg>`;
}
