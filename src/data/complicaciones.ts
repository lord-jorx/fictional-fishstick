/**
 * Complicaciones intraoperatorias IMPREVISTAS: un pool genérico que puede
 * colarse en cualquier cirugía. El motor las sortea al empezar la
 * intervención según la variante clínica, la estabilidad del paciente,
 * la fatiga del cirujano y el modo de juego.
 */
import type { PasoQuirurgico } from '../core/types.js';

export const COMPLICACIONES_IMPREVISTAS: PasoQuirurgico[] = [
  {
    titulo: 'Sangrado en sábana difuso',
    evento:
      'El campo empieza a rezumar por todas partes: sangrado difuso en sábana. Anestesia confirma que la coagulación se está deteriorando.',
    opciones: [
      {
        texto: 'Compresión con gasas calientes, hemostáticos tópicos y pedir a anestesia que corrija la coagulopatía',
        correcta: true,
        resultado: 'El campo se seca poco a poco mientras reponen factores. Paciencia y presión: hemostasia de libro.',
        deltaEstabilidad: -2,
        deltaEstres: 3,
      },
      {
        texto: 'Electrocoagulación indiscriminada de toda la superficie que rezuma',
        correcta: false,
        resultado: 'Quemas tejido sano y el rezumado reaparece al lado. La coagulopatía no se cauteriza: se corrige.',
        deltaEstabilidad: -10,
        deltaEstres: 8,
      },
      {
        texto: 'Seguir con el plan y confiar en que pare solo',
        correcta: false,
        resultado: 'El goteo constante se convierte en anemia aguda. Anestesia pide sangre cruzada.',
        deltaEstabilidad: -14,
        deltaEstres: 10,
      },
    ],
  },
  {
    titulo: 'Pérdida de visión del campo',
    evento: 'La óptica se empaña y una lengüeta de epiplón se interpone: has perdido la visión del campo quirúrgico.',
    opciones: [
      {
        texto: 'Extraer y limpiar la óptica, recolocar al paciente y recuperar la exposición antes de seguir',
        correcta: true,
        resultado: 'Dos minutos bien invertidos: campo limpio y anatomía reconocible de nuevo.',
        deltaEstabilidad: 0,
        deltaEstres: -2,
      },
      {
        texto: 'Seguir disecando de memoria: "me sé la anatomía"',
        correcta: false,
        resultado: 'La memoria no sangra; el tejido sí. Pequeña laceración que obliga a hemostasia extra.',
        deltaEstabilidad: -10,
        deltaEstres: 8,
      },
    ],
  },
  {
    titulo: 'Aviso de anestesia',
    evento: 'Anestesia interrumpe: desaturación transitoria y tensión lábil. El paciente no está cómodo con el neumoperitoneo.',
    opciones: [
      {
        texto: 'Pausa coordinada: bajar la presión del neumo, esperar a que lo estabilicen y repartir el plan',
        correcta: true,
        resultado: 'En unos minutos el paciente remonta. Trabajar en equipo también es técnica quirúrgica.',
        deltaEstabilidad: +3,
        deltaEstres: 2,
      },
      {
        texto: 'Seguir a tu ritmo: "casi he terminado este plano"',
        correcta: false,
        resultado: 'La desaturación se prolonga y anestesia acaba parándote igualmente, con el paciente peor.',
        deltaEstabilidad: -12,
        deltaEstres: 9,
      },
    ],
  },
  {
    titulo: 'Lesión inadvertida al retraer',
    evento: 'Al retirar el separador descubres una laceración serosa en un asa de delgado que nadie ha visto producirse.',
    opciones: [
      {
        texto: 'Revisar el asa completa y reparar con puntos seromusculares',
        correcta: true,
        resultado: 'Reparación limpia. Una lesión vista y tratada no es complicación: es cirugía.',
        deltaEstabilidad: -1,
        deltaEstres: 2,
      },
      {
        texto: 'Parece superficial: reintroducirla y no perder tiempo',
        correcta: false,
        resultado: 'Las laceraciones "superficiales" no revisadas son las peritonitis de la semana que viene.',
        deltaEstabilidad: -12,
        deltaEstres: 8,
      },
    ],
  },
  {
    titulo: 'Fallo de instrumental',
    evento: 'La endograpadora hace un ruido raro y se bloquea a mitad de disparo, mordiendo el tejido.',
    opciones: [
      {
        texto: 'No forzar: liberar el dispositivo según fabricante, revisar la línea de grapas y completar con sutura manual',
        correcta: true,
        resultado: 'Liberas el aparato sin desgarrar y refuerzas la línea. El plan B también hay que sabérselo.',
        deltaEstabilidad: -2,
        deltaEstres: 4,
      },
      {
        texto: 'Forzar el disparo con más presión: "estas cosas pasan"',
        correcta: false,
        resultado: 'El tejido se desgarra dentro de la mordaza: defecto mayor que ahora exige reparación compleja.',
        deltaEstabilidad: -13,
        deltaEstres: 10,
      },
    ],
  },
];
