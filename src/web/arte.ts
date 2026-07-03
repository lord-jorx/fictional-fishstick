/**
 * Arte del juego: ilustraciones SVG inline (sin bitmaps ni red) que el
 * adaptador WebIO inyecta cuando el motor emite escenas.
 *
 * Todas las animaciones se definen por CSS en template.html
 * (clases: estrella, ventana, neon, baliza, dolor, onda, sol, punto-rec...).
 */

/** La ambulancia se reutiliza en la portada y en la animación de llegada. */
export const SVG_AMBULANCIA = `
<svg viewBox="0 0 96 46" width="96" height="46" class="ambulancia-svg" aria-hidden="true">
  <rect x="14" y="7" width="9" height="7" rx="2" class="baliza"/>
  <rect x="4" y="13" width="58" height="22" rx="3" fill="#f4f7fa"/>
  <path d="M62 17 h13 l11 9 v9 h-24 z" fill="#f4f7fa"/>
  <rect x="65" y="20" width="10" height="8" rx="1.5" fill="#9cc3e5"/>
  <rect x="4" y="29" width="82" height="4" fill="#e03131"/>
  <path d="M29 16 h7 v5 h5 v7 h-5 v5 h-7 v-5 h-5 v-7 h5 z" fill="#e03131"/>
  <circle cx="21" cy="37" r="6.5" fill="#1a1e24"/><circle cx="21" cy="37" r="2.6" fill="#5c6672"/>
  <circle cx="72" cy="37" r="6.5" fill="#1a1e24"/><circle cx="72" cy="37" r="2.6" fill="#5c6672"/>
</svg>`;

/** Portada: hospital de noche, luna, estrellas y la ambulancia de guardia. */
export const ARTE_PORTADA = `
<svg viewBox="0 0 360 152" class="dibujo" role="img" aria-label="Hospital de noche">
  <defs>
    <linearGradient id="g-cielo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1730"/><stop offset="1" stop-color="#15304f"/>
    </linearGradient>
  </defs>
  <rect width="360" height="152" rx="10" fill="url(#g-cielo)"/>
  <circle class="estrella" cx="34" cy="26" r="1.4"/>
  <circle class="estrella" cx="72" cy="14" r="1.1" style="animation-delay:.7s"/>
  <circle class="estrella" cx="102" cy="38" r="1.5" style="animation-delay:1.3s"/>
  <circle class="estrella" cx="252" cy="18" r="1.2" style="animation-delay:.4s"/>
  <circle class="estrella" cx="286" cy="52" r="1.3" style="animation-delay:1.9s"/>
  <circle class="estrella" cx="330" cy="76" r="1.1" style="animation-delay:1s"/>
  <circle class="estrella" cx="140" cy="20" r="1.2" style="animation-delay:2.4s"/>
  <circle cx="312" cy="34" r="15" fill="#f3eed6"/>
  <circle cx="306" cy="30" r="3.6" fill="#ddd6b4"/>
  <circle cx="317" cy="40" r="2.6" fill="#ddd6b4"/>
  <rect x="112" y="60" width="136" height="82" rx="3" fill="#1c2a3e" stroke="#33465f"/>
  ${ventanas(126, 70, 4, 3)}
  <rect x="162" y="38" width="36" height="28" rx="5" fill="#0f1c2d" stroke="#33465f"/>
  <path class="neon" d="M176 44 h8 v7 h7 v8 h-7 v7 h-8 v-7 h-7 v-8 h7 z"/>
  <rect x="170" y="120" width="20" height="22" rx="1.5" fill="#0d1725"/>
  <rect x="150" y="106" width="60" height="10" rx="2" fill="#0f1c2d"/>
  <text x="180" y="114" text-anchor="middle" font-size="7.5" fill="#7fd1e0" font-family="inherit" letter-spacing="2">URGENCIAS</text>
  <rect x="0" y="142" width="360" height="10" rx="5" fill="#091120"/>
  <g transform="translate(12 100) scale(.9)">${SVG_AMBULANCIA}</g>
</svg>`;

function ventanas(x0: number, y0: number, columnas: number, filas: number): string {
  let svg = '';
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const retardo = ((f * columnas + c) * 0.9) % 5;
      svg += `<rect class="ventana" x="${x0 + c * 30}" y="${y0 + f * 22}" width="16" height="11" rx="1.5" style="animation-delay:${retardo}s"/>`;
    }
  }
  return svg;
}

/** Banner de quirófano: lámpara, aviso parpadeante y trazo de monitor. */
export const BANNER_QUIROFANO = `
<div class="q-banner">
  <svg viewBox="0 0 44 40" class="q-lampara" aria-hidden="true">
    <path d="M22 4 v6" stroke="#5c6a7a" stroke-width="2.5"/>
    <circle cx="22" cy="21" r="11" fill="#ffeaa9"/>
    <circle cx="22" cy="21" r="5.5" fill="#fff7dd"/>
  </svg>
  <div class="q-texto"><span class="punto-rec"></span>INTERVENCIÓN EN CURSO</div>
  <svg viewBox="0 0 130 26" class="ecg ecg-mini" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 13 h28 l4 0 3 -8 4 16 3 -8 h30 l4 0 3 -8 4 16 3 -8 h30 l4 0 3 -8"/>
  </svg>
</div>`;

/** Amanecer del fin de guardia. */
export const ARTE_AMANECER = `
<svg viewBox="0 0 360 96" class="dibujo" role="img" aria-label="Amanecer sobre la ciudad">
  <defs>
    <linearGradient id="g-alba" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#28436b"/><stop offset=".62" stop-color="#b96a4b"/><stop offset="1" stop-color="#f2a65a"/>
    </linearGradient>
  </defs>
  <rect width="360" height="96" rx="10" fill="url(#g-alba)"/>
  <circle class="sol" cx="180" cy="108" r="20"/>
  <path d="M0 82 h34 v-18 h20 v10 h26 v-26 h22 v18 h30 v-10 h24 v16 h30 v-24 h22 v18 h26 v-8 h22 v14 h34 v-10 h30 v18 h40 v18 H0 Z" fill="#101c2d"/>
  <rect x="0" y="88" width="360" height="8" rx="4" fill="#0b1422"/>
</svg>`;

// ────────────────────────────────────────────────────────────────
// Mapa corporal: dónde duele según la patología (sin desvelar nada
// que la anamnesis no diga ya con palabras).
// ────────────────────────────────────────────────────────────────

interface ZonaDolor {
  zona: string;
  puntos: Array<[number, number]>;
}

const ZONAS: Record<string, ZonaDolor> = {
  apendicitis: { zona: 'fosa ilíaca derecha', puntos: [[46, 108]] },
  colecistitis: { zona: 'hipocondrio derecho', puntos: [[46, 84]] },
  colico_biliar: { zona: 'hipocondrio derecho', puntos: [[46, 84]] },
  obstruccion: { zona: 'mesogastrio, difuso', puntos: [[60, 98]] },
  diverticulitis: { zona: 'fosa ilíaca izquierda', puntos: [[74, 108]] },
  isquemia: { zona: 'periumbilical, desproporcionado', puntos: [[60, 96]] },
  trauma: { zona: 'hipocondrio izquierdo', puntos: [[74, 84]] },
  ulcus: { zona: 'epigastrio, en puñalada', puntos: [[60, 78]] },
  hernia: { zona: 'región inguinal derecha', puntos: [[48, 126]] },
  pancreatitis: { zona: 'epigastrio, en cinturón', puntos: [[60, 80], [46, 86], [74, 86]] },
  gastroenteritis: { zona: 'difuso, tipo retortijón', puntos: [[52, 92], [68, 100], [58, 112]] },
  colico_renal: { zona: 'fosa lumbar derecha', puntos: [[40, 92]] },
};

/** Silueta con el foco de dolor pulsando. Devuelve null si no hay mapa. */
export function cuerpoConDolor(patologiaId?: string): string | null {
  const zona = patologiaId ? ZONAS[patologiaId] : undefined;
  if (!zona) return null;

  const focos = zona.puntos
    .map(
      ([x, y]) => `
    <circle class="onda" cx="${x}" cy="${y}" r="9"/>
    <circle class="onda onda2" cx="${x}" cy="${y}" r="9"/>
    <circle class="dolor" cx="${x}" cy="${y}" r="4.5"/>`,
    )
    .join('');

  return `
<div class="ficha-cuerpo">
  <svg viewBox="0 0 120 170" class="cuerpo" role="img" aria-label="Localización del dolor">
    <circle cx="60" cy="16" r="11" class="silueta"/>
    <path class="silueta" d="M60 30 C46 30 38 36 36 47 L31 78 C30 93 30 106 33 120 L37 150 C38 159 46 163 60 163 C74 163 82 159 83 150 L87 120 C90 106 90 93 89 78 L84 47 C82 36 74 30 60 30 Z"/>
    <path class="guias" d="M36 76 H84 M34 118 H86 M60 58 V152"/>
    ${focos}
  </svg>
  <div class="cuerpo-pie">Dolor referido: ${zona.zona}</div>
</div>`;
}
