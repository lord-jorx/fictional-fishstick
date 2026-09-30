/**
 * Iconos de línea propios (24×24, trazo currentColor): la interfaz deja de
 * depender de emojis, que cada sistema dibuja distinto.
 */
const svg = (cuerpo: string): string =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${cuerpo}</svg>`;

const ICONOS: Record<string, string> = {
  // Valoración
  explorar: svg('<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a4 4 0 0 0 8 0v-1"/><circle cx="18" cy="12" r="2"/>'),
  interrogar: svg('<path d="M4 5h16v11H11l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/>'),
  // Pruebas
  'prueba:analitica': svg('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>'),
  'prueba:gasometria': svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z"/><path d="M9.500 15a2.500 2.500 0 0 0 2.500 2.500"/>'),
  'prueba:orina': svg('<path d="M7 7h10l-1 13H8z"/><path d="M6 4h12v3H6z"/><path d="M8 13h8"/>'),
  'prueba:eco': svg('<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M3 18h18M3 6h18" opacity=".45"/>'),
  'prueba:ecofast': svg('<path d="M12 4v16M4 12h16"/><circle cx="12" cy="12" r="8"/>'),
  'prueba:ecg': svg('<path d="M2 12h5l2-6 4 12 2-6h7"/>'),
  'prueba:rxtorax': svg('<path d="M12 3v8M9 6c-4 1-6 5-6 10 0 2 1 3 3 3 2.500 0 3-2 3-4V6zM15 6c4 1 6 5 6 10 0 2-1 3-3 3-2.500 0-3-2-3-4V6z"/>'),
  'prueba:tccraneo': svg('<circle cx="12" cy="12" r="8"/><path d="M8 11c0-2 1.500-3.500 4-3.500s4 1.500 4 3.500M9 15c1 1 5 1 6 0M12 8.500v3"/>'),
  'prueba:tc': svg('<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4"/><path d="M3.500 12h-1M21.500 12h-1"/>'),
  'prueba:angiotc': svg('<circle cx="12" cy="12" r="8.500"/><path d="M6 14c2-5 4 1 6-3s4 2 6-2"/>'),
  // Decisiones
  alta: svg('<path d="M14 4h5v16h-5"/><path d="M4 12h10M10 8l4 4-4 4"/>'),
  ingreso: svg('<path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.600"/>'),
  cirugia: svg('<path d="M20 4 9 15l-2 4 4-2L22 6z"/><path d="m13 11 2 2M5 21l2-2"/>'),
  derivar: svg('<rect x="2" y="8" width="13" height="8" rx="1.500"/><path d="M15 10h4l3 3v3h-7"/><circle cx="6.500" cy="17.500" r="1.800"/><circle cx="17.500" cy="17.500" r="1.800"/><path d="M8.500 10.500v3M7 12h3"/>'),
  volver: svg('<path d="M10 6 4 12l6 6M4 12h16"/>'),
  adjunto: svg('<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/>'),
  tecnica: svg('<path d="M14.500 4.500a3 3 0 0 0 4 4L9 18l-5 1 1-5z"/>'),
  // Sala
  cafe: svg('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.500a2.500 2.500 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/>'),
  descansar: svg('<path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z"/>'),
  ronda: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/>'),
  reloj: svg('<circle cx="12" cy="12" r="8.500"/><path d="M12 7v5l3 2"/>'),
  // Configuración de la partida
  solo: svg('<circle cx="12" cy="8" r="3.500"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  duo: svg('<circle cx="9" cy="8.500" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9.500" r="2.500"/><path d="M17 14a5 5 0 0 1 4.500 5"/>'),
  editor: svg('<path d="M4 20l1-5L16 4a2.100 2.100 0 0 1 3 3L8 18z"/><path d="m14 6 3 3"/>'),
  rapido: svg('<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>'),
  libre: svg('<path d="M3 17h4c4 0 6-10 10-10h4M3 7h4c1.800 0 3 1.600 4 3.500M21 17h-4c-1.800 0-3-1.600-4-3.500M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
  diario: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/><path d="M9 14h2v3"/>'),
  'modo:residente': svg('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500v4.500c3 2.500 9 2.500 12 0v-4.500"/>'),
  'modo:adjunto': svg('<path d="M12 3l7 3v5c0 5-3.500 8-7 10-3.500-2-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/>'),
  'modo:negra': svg('<path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z"/><path d="M16 4v3M14.500 5.500h3"/>'),
  'modo:festival': svg('<path d="M9 18V6l10-2v12"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="16.500" cy="16" r="2.500"/>'),
  'ritmo:turnos': svg('<path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4"/>'),
  'ritmo:real': svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/>'),
  hospital: svg('<path d="M4 21V7l8-4 8 4v14z"/><path d="M12 9v6M9 12h6M9 21v-4h6v4"/>'),
  // Ajustes y estado
  sonido: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11"/>'),
  mudo: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 4 6M21 9l-4 6"/>'),
  diarioLista: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  quirofano: svg('<path d="M3 11h18M6 11v7M18 11v7M10 11V7a2 2 0 0 1 4 0v4"/>'),
  energia: svg('<path d="M13 3 6 13h5l-1 8 7-10h-5z"/>'),
  estres: svg('<path d="M3 12h4l2-5 4 10 2-5h6"/>'),
  rea: svg('<path d="M3 13h18M5 13v5M19 13v5M6 13V9h5a3 3 0 0 1 3 3"/>'),
  espera: svg('<circle cx="12" cy="8" r="3.500"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  alerta: svg('<path d="M12 4 2.500 20h19z"/><path d="M12 10v5M12 17.500v.5"/>'),
  ok: svg('<path d="m5 12 5 5 9-10"/>'),
  cerrar: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  continuar: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  talisman: svg('<path d="M12 3l2.500 5.500 6 .8-4.400 4.100 1.100 6L12 16.500 6.800 19.400l1.100-6L3.500 9.300l6-.8z"/>'),
  candado: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  estrella: svg('<path d="M12 3l2.500 5.500 6 .8-4.400 4.100 1.100 6L12 16.500 6.800 19.400l1.100-6L3.500 9.300l6-.8z"/>'),
  ambulancia: svg('<rect x="2" y="8" width="13" height="8" rx="1.500"/><path d="M15 10h4l3 3v3h-7"/><circle cx="6.500" cy="17.500" r="1.800"/><circle cx="17.500" cy="17.500" r="1.800"/>'),
  punto: svg('<circle cx="12" cy="12" r="3"/>'),
};

/** Icono para una clave semántica del motor ('prueba:eco', 'cafe', 'hospital:general'...). */
export function icono(clave: string | undefined): string {
  if (!clave) return ICONOS['punto']!;
  if (ICONOS[clave]) return ICONOS[clave]!;
  const base = clave.split(':')[0]!;
  if (base === 'hospital') return ICONOS['hospital']!;
  if (base === 'talisman') return ICONOS['talisman']!;
  return ICONOS[base] ?? ICONOS['punto']!;
}

export function iconoPorNombre(nombre: string): string {
  return ICONOS[nombre] ?? ICONOS['punto']!;
}
