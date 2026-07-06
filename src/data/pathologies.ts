/**
 * Base de datos de patologías de la guardia (16), agrupadas por manejo:
 *
 *  - QUIRÚRGICAS (9): el quirófano es el tratamiento.
 *  - CONSERVADORAS (4): ingresar (o derivar, según el hospital) es tratar;
 *    operarlas sería el error.
 *  - DE ALTA (3): distractores benignos — dar el alta también es una
 *    decisión con riesgo.
 */
import type { Patologia } from '../core/types.js';

export const PATOLOGIAS: Patologia[] = [
  // ──────────────────────────────────────────────────────────────
  {
    id: 'apendicitis',
    nombre: 'Apendicitis aguda',
    quirurgica: true,
    frecuencia: 10,
    presentacion: {
      sintomas: [
        'Dolor periumbilical migrado a fosa ilíaca derecha de 12 h de evolución',
        'Anorexia y náuseas',
        'Febrícula de 37,8 °C',
      ],
      exploracion: 'Blumberg positivo en FID, defensa localizada. Psoas dudoso.',
      constantes: 'TA 125/80, FC 92, Sat 98%, Tª 37,8 °C',
    },
    pruebaDiana: 'tc',
    hallazgoDiana:
      'TC: apéndice de 11 mm, engrosamiento parietal, rarefacción de la grasa periapendicular. Apendicitis aguda no complicada.',
    hallazgosParciales: {
      analitica: 'Leucocitosis 14.500 con neutrofilia. PCR 65 mg/L.',
      eco: 'Ecografía: apéndice no visualizado por interposición de gas. No descarta apendicitis.',
    },
    deterioroPorHora: 4,
    estabilidadInicial: [75, 90],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'La TC es la prueba más sensible en adultos; la ecografía es operador-dependiente y un apéndice no visualizado no descarta el diagnóstico.',
    cirugia: {
      nombre: 'Apendicectomía laparoscópica',
      duracionMin: 75,
      pasos: [
        {
          titulo: 'Acceso y neumoperitoneo',
          evento:
            'Al preparar el campo observas una cicatriz de laparotomía media previa. Riesgo de adherencias al primer trócar.',
          opciones: [
            {
              texto: 'Entrada abierta (técnica de Hasson) alejada de la cicatriz',
              correcta: true,
              resultado: 'Accedes bajo visión directa sin incidencias. Neumoperitoneo estable.',
              deltaEstabilidad: 0,
              deltaEstres: -3,
            },
            {
              texto: 'Aguja de Veress a ciegas sobre el ombligo, como siempre',
              correcta: false,
              resultado: '¡Enterotomía inadvertida de un asa adherida! Debes repararla y lavar.',
              deltaEstabilidad: -15,
              deltaEstres: 12,
            },
            {
              texto: 'Convertir directamente a cirugía abierta por miedo a las adherencias',
              correcta: false,
              resultado: 'Laparotomía innecesaria: más dolor y más íleo postoperatorio para el paciente.',
              deltaEstabilidad: -8,
              deltaEstres: 5,
            },
          ],
        },
        {
          titulo: 'Disección del mesoapéndice',
          evento: 'Sangrado activo de la arteria apendicular que tiñe el campo.',
          opciones: [
            {
              texto: 'Comprimir, aspirar, identificar el vaso y controlarlo con clip/bipolar bajo visión',
              correcta: true,
              resultado: 'Hemostasia controlada. Campo limpio.',
              deltaEstabilidad: -2,
              deltaEstres: 3,
            },
            {
              texto: 'Electrocoagulación monopolar a ciegas donde parece sangrar',
              correcta: false,
              resultado: 'Quemas tejido sano, el vaso se retrae y sangra más. Tardas en controlarlo.',
              deltaEstabilidad: -12,
              deltaEstres: 10,
            },
            {
              texto: 'Ignorar el sangrado y seguir: "ya parará solo"',
              correcta: false,
              resultado: 'Hemoperitoneo progresivo. Anestesia avisa de taquicardia.',
              deltaEstabilidad: -18,
              deltaEstres: 15,
            },
          ],
        },
        {
          titulo: 'Sección de la base apendicular',
          evento: 'La base apendicular está friable y parcialmente perforada.',
          opciones: [
            {
              texto: 'Endograpadora incluyendo un rodete de ciego sano',
              correcta: true,
              resultado: 'Cierre seguro sobre tejido sano. Lavado y aspirado de la fosa.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Doble endoloop sobre la base friable',
              correcta: false,
              resultado: 'El endoloop desgarra el tejido friable. Fuga de contenido: lavado extenso.',
              deltaEstabilidad: -12,
              deltaEstres: 8,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'colecistitis',
    nombre: 'Colecistitis aguda litiásica',
    quirurgica: true,
    frecuencia: 9,
    presentacion: {
      sintomas: [
        'Dolor en hipocondrio derecho de 24 h, continuo, irradiado a escápula',
        'Fiebre de 38,4 °C con escalofríos',
        'Vómitos alimentarios',
      ],
      exploracion: 'Murphy positivo. No ictericia. Abdomen blando en el resto.',
      constantes: 'TA 130/85, FC 98, Sat 97%, Tª 38,4 °C',
    },
    pruebaDiana: 'eco',
    hallazgoDiana:
      'Ecografía: vesícula distendida con pared de 6 mm, litiasis enclavada en el infundíbulo, líquido perivesicular y Murphy ecográfico positivo. Colecistitis aguda.',
    hallazgosParciales: {
      analitica: 'Leucocitosis 16.200. PCR 120 mg/L. Bilirrubina y enzimas hepáticas normales.',
      tc: 'TC: engrosamiento de la pared vesicular con líquido adyacente. La ecografía sigue siendo la prueba de elección.',
    },
    deterioroPorHora: 3,
    estabilidadInicial: [70, 85],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'La ecografía es la prueba de elección. En colecistitis de <72 h de evolución, la colecistectomía laparoscópica precoz es el tratamiento estándar (Tokyo Guidelines).',
    cirugia: {
      nombre: 'Colecistectomía laparoscópica',
      duracionMin: 90,
      pasos: [
        {
          titulo: 'Exposición del triángulo de Calot',
          evento: 'Adherencias firmes del epiplón y el duodeno a la vesícula inflamada.',
          opciones: [
            {
              texto: 'Disección roma y paciente pegada a la pared vesicular hasta lograr la visión crítica de seguridad',
              correcta: true,
              resultado: 'Liberas las adherencias sin lesionar nada. Visión crítica conseguida.',
              deltaEstabilidad: 0,
              deltaEstres: -3,
            },
            {
              texto: 'Sección rápida con tijera de las bandas sin identificar estructuras',
              correcta: false,
              resultado: 'Lesión serosa duodenal que obliga a sutura. La confianza no sustituye a la anatomía.',
              deltaEstabilidad: -14,
              deltaEstres: 12,
            },
            {
              texto: 'Tirar con fuerza de la vesícula con el grasper para "despegar" en bloque',
              correcta: false,
              resultado: 'Desgarro vesicular con salida de bilis purulenta y sangrado del lecho.',
              deltaEstabilidad: -10,
              deltaEstres: 8,
            },
          ],
        },
        {
          titulo: 'Control del pedículo',
          evento: '¡Sangrado activo de la arteria cística! El campo se tiñe de rojo en segundos.',
          opciones: [
            {
              texto: 'Compresión con gasa, aspirar, exponer y clipar el muñón bajo visión directa',
              correcta: true,
              resultado: 'Vaso controlado con dos clips. Recuperas la calma y el campo.',
              deltaEstabilidad: -3,
              deltaEstres: 4,
            },
            {
              texto: 'Clips a ciegas en medio del charco de sangre',
              correcta: false,
              resultado: 'Uno de los clips pinza parcialmente la vía biliar. Hay que retirarlo y revisar: la lesión de vía biliar es la complicación más temida.',
              deltaEstabilidad: -18,
              deltaEstres: 18,
            },
            {
              texto: 'Convertir inmediatamente a cirugía abierta sin intentar el control laparoscópico',
              correcta: false,
              resultado: 'Conversión precipitada: el sangrado era controlable. Más morbilidad para el paciente.',
              deltaEstabilidad: -8,
              deltaEstres: 6,
            },
          ],
        },
        {
          titulo: 'Extracción de la pieza',
          evento: 'La vesícula se perfora al despegarla del lecho: salen bilis y varios cálculos a la cavidad.',
          opciones: [
            {
              texto: 'Aspirar la bilis, recuperar todos los cálculos y extraer la pieza en bolsa',
              correcta: true,
              resultado: 'Cavidad limpia, pieza extraída en bolsa sin contaminar la pared.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Dejar los cálculos: "son estériles, no pasa nada"',
              correcta: false,
              resultado: 'Los cálculos abandonados causan abscesos tardíos. Mala praxis conocida.',
              deltaEstabilidad: -10,
              deltaEstres: 6,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'obstruccion',
    nombre: 'Obstrucción intestinal por bridas (estrangulada)',
    quirurgica: true,
    frecuencia: 7,
    presentacion: {
      sintomas: [
        'Dolor abdominal cólico que se ha vuelto continuo en las últimas horas',
        'Vómitos biliosos y distensión abdominal',
        'Ausencia de tránsito para gases y heces desde hace 36 h',
      ],
      exploracion:
        'Abdomen distendido y timpánico, cicatriz de laparotomía previa. Dolor fijo en mesogastrio con defensa. Ruidos metálicos.',
      constantes: 'TA 110/70, FC 108, Sat 96%, Tª 37,6 °C',
    },
    pruebaDiana: 'tc',
    hallazgoDiana:
      'TC: dilatación de asas de delgado con punto de transición brusco, asa cerrada con edema de pared, líquido libre y pobre realce mural. Sospecha de estrangulación.',
    hallazgosParciales: {
      analitica: 'Leucocitosis 13.800. Lactato 2,8 mmol/L: sugiere sufrimiento de asa.',
      eco: 'Ecografía: asas dilatadas con contenido líquido. Estudio limitado por gas.',
    },
    deterioroPorHora: 6,
    estabilidadInicial: [55, 75],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'La obstrucción por bridas sin signos de sufrimiento puede manejarse con SNG y observación, pero el dolor continuo, la defensa, el lactato elevado y el pobre realce mural en TC obligan a cirugía urgente.',
    cirugia: {
      nombre: 'Laparotomía + adhesiolisis',
      duracionMin: 110,
      pasos: [
        {
          titulo: 'Adhesiolisis',
          evento: 'Encuentras una brida firme que estrangula un asa de íleon a 60 cm de la válvula ileocecal.',
          opciones: [
            {
              texto: 'Sección de la brida sobre tejido seguro y liberación cuidadosa del asa',
              correcta: true,
              resultado: 'Asa liberada. Ahora toca valorar su viabilidad.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Tracción enérgica del asa para liberarla sin seccionar la brida',
              correcta: false,
              resultado: 'Desgarro de la serosa con apertura de la luz: contaminación del campo.',
              deltaEstabilidad: -15,
              deltaEstres: 12,
            },
          ],
        },
        {
          titulo: 'Valoración de la viabilidad del asa',
          evento: 'El asa liberada está violácea, con peristaltismo dudoso.',
          opciones: [
            {
              texto: 'Envolverla en compresas con suero caliente y reevaluar color, peristaltismo y pulso mesentérico a los 10 minutos',
              correcta: true,
              resultado: 'El asa recupera color rosado y peristaltismo en dos tercios; solo un segmento corto queda desvitalizado.',
              deltaEstabilidad: 0,
              deltaEstres: -3,
            },
            {
              texto: 'Reintroducirla en la cavidad sin comprobar viabilidad y cerrar',
              correcta: false,
              resultado: 'Dejas intestino necrótico dentro: peritonitis postoperatoria casi segura.',
              deltaEstabilidad: -25,
              deltaEstres: 15,
            },
            {
              texto: 'Resección amplia inmediata de todo el segmento dudoso sin reevaluar',
              correcta: false,
              resultado: 'Resecas 80 cm de intestino que habría sobrevivido. Cirugía más larga y anastomosis mayor.',
              deltaEstabilidad: -8,
              deltaEstres: 5,
            },
          ],
        },
        {
          titulo: 'Reconstrucción',
          evento: 'Queda un segmento corto claramente necrótico. El paciente está estable.',
          opciones: [
            {
              texto: 'Resección segmentaria y anastomosis primaria término-terminal',
              correcta: true,
              resultado: 'Anastomosis bien vascularizada y sin tensión. Cierre por planos.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Ileostomía terminal "por seguridad" pese a la estabilidad del paciente',
              correcta: false,
              resultado: 'Estoma innecesario en paciente estable: morbilidad y segunda cirugía evitables.',
              deltaEstabilidad: -6,
              deltaEstres: 4,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'diverticulitis',
    nombre: 'Diverticulitis aguda perforada (Hinchey IV)',
    quirurgica: true,
    frecuencia: 6,
    presentacion: {
      sintomas: [
        'Dolor intenso en fosa ilíaca izquierda de 48 h, ahora generalizado',
        'Fiebre de 38,9 °C y malestar general intenso',
        'Episodios previos de "diverticulitis" tratados con antibióticos',
      ],
      exploracion: 'Abdomen en tabla, defensa generalizada con signos de irritación peritoneal difusa.',
      constantes: 'TA 95/60, FC 118, Sat 95%, Tª 38,9 °C',
    },
    pruebaDiana: 'tc',
    hallazgoDiana:
      'TC: engrosamiento de sigma con divertículos, neumoperitoneo franco y líquido libre difuso con burbujas extraluminales. Perforación diverticular con peritonitis difusa (Hinchey IV).',
    hallazgosParciales: {
      analitica: 'Leucocitosis 19.400 con desviación izquierda. PCR 280 mg/L. Lactato 3,1 mmol/L.',
      eco: 'Ecografía: líquido libre en varios cuadrantes. No permite filiar el origen.',
    },
    deterioroPorHora: 7,
    estabilidadInicial: [45, 65],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'La diverticulitis Hinchey I-II se maneja con antibióticos ± drenaje percutáneo, pero la peritonitis difusa (III-IV) exige cirugía urgente; en el paciente séptico e inestable, la intervención de Hartmann sigue siendo la opción más segura.',
    cirugia: {
      nombre: 'Laparotomía urgente por peritonitis',
      duracionMin: 130,
      pasos: [
        {
          titulo: 'Entrada y control de la contaminación',
          evento: 'Al abrir encuentras peritonitis fecaloidea difusa en los cuatro cuadrantes.',
          opciones: [
            {
              texto: 'Aspirado del contenido y lavado abundante con suero caliente por cuadrantes',
              correcta: true,
              resultado: 'Cavidad progresivamente limpia. Identificas la perforación en sigma.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Ir directo al sigma sin lavar primero la cavidad',
              correcta: false,
              resultado: 'Trabajas en un campo sucio: mayor carga séptica y peor visión.',
              deltaEstabilidad: -10,
              deltaEstres: 8,
            },
          ],
        },
        {
          titulo: 'Inestabilidad intraoperatoria',
          evento: 'Anestesia avisa: TA 78/45 pese a fluidos, precisa noradrenalina. El paciente está séptico.',
          opciones: [
            {
              texto: 'Pausa quirúrgica coordinada: optimizar con anestesia y cambiar a estrategia de control de daños',
              correcta: true,
              resultado: 'El paciente se estabiliza parcialmente. Acortas el plan quirúrgico: primero salvar la vida.',
              deltaEstabilidad: +5,
              deltaEstres: 4,
            },
            {
              texto: 'Seguir operando a ritmo normal: "cuanto antes acabemos, mejor"',
              correcta: false,
              resultado: 'Hipotensión mantenida durante 20 minutos: daño orgánico añadido.',
              deltaEstabilidad: -18,
              deltaEstres: 12,
            },
          ],
        },
        {
          titulo: 'Decisión reconstructiva',
          evento: 'Sigma perforado resecado. Paciente séptico con noradrenalina en curso.',
          opciones: [
            {
              texto: 'Intervención de Hartmann: colostomía terminal y cierre del muñón rectal',
              correcta: true,
              resultado: 'Opción segura en el paciente inestable. Fin de la cirugía sin anastomosis de riesgo.',
              deltaEstabilidad: 0,
              deltaEstres: -3,
            },
            {
              texto: 'Anastomosis colorrectal primaria para "ahorrarle el estoma"',
              correcta: false,
              resultado: 'Anastomosis en paciente séptico e inestable: riesgo altísimo de dehiscencia.',
              deltaEstabilidad: -20,
              deltaEstres: 10,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'isquemia',
    nombre: 'Isquemia mesentérica aguda (embolia de AMS)',
    quirurgica: true,
    frecuencia: 4,
    presentacion: {
      sintomas: [
        'Dolor abdominal brutal de inicio súbito hace 3 h',
        'El dolor es desproporcionado respecto a la exploración',
        'Antecedente de fibrilación auricular sin anticoagular',
      ],
      exploracion: 'Abdomen blando y poco doloroso a la palpación pese al dolor referido. Arritmia a la auscultación.',
      constantes: 'TA 105/65, FC 122 irregular, Sat 96%, Tª 36,9 °C',
    },
    pruebaDiana: 'angiotc',
    hallazgoDiana:
      'Angio-TC: defecto de repleción en la arteria mesentérica superior a 4 cm del ostium compatible con embolia. Asas de delgado con hipocaptación parietal. Isquemia mesentérica aguda.',
    hallazgosParciales: {
      analitica: 'Lactato 4,9 mmol/L, leucocitosis 17.000, acidosis metabólica incipiente. ¡Piensa en isquemia!',
      tc: 'TC sin fase arterial dedicada: asas de calibre normal con pared adelgazada. Estudio subóptimo para valorar la AMS.',
      eco: 'Ecografía: escaso líquido libre. No valorable el eje mesentérico.',
      ecg: 'ECG: fibrilación auricular con respuesta ventricular rápida. Ahí tienes la fábrica de émbolos.',
    },
    deterioroPorHora: 12,
    estabilidadInicial: [50, 65],
    manejoCorrecto: 'cirugia',
    notaDocente:
      '"Dolor desproporcionado a la exploración + FA" es isquemia mesentérica hasta que se demuestre lo contrario. El angio-TC es la prueba de elección y cada hora de retraso multiplica la mortalidad.',
    cirugia: {
      nombre: 'Laparotomía + revascularización de la AMS',
      duracionMin: 140,
      pasos: [
        {
          titulo: 'Exploración de la cavidad',
          evento: 'Asas de yeyuno-íleon cianóticas en un segmento extenso; el colon derecho tiene aspecto dudoso.',
          opciones: [
            {
              texto: 'Priorizar la revascularización: exponer la AMS y realizar embolectomía con catéter de Fogarty',
              correcta: true,
              resultado: 'Recuperas flujo pulsátil. Gran parte del intestino recobra color en minutos.',
              deltaEstabilidad: +5,
              deltaEstres: 3,
            },
            {
              texto: 'Resecar de entrada todo el intestino de aspecto isquémico sin revascularizar',
              correcta: false,
              resultado: 'Resecas intestino potencialmente recuperable y condenas al paciente a un intestino corto.',
              deltaEstabilidad: -20,
              deltaEstres: 12,
            },
          ],
        },
        {
          titulo: 'Tras la revascularización',
          evento: 'Persiste un segmento de íleon de 30 cm claramente necrótico.',
          opciones: [
            {
              texto: 'Resección limitada del segmento necrótico',
              correcta: true,
              resultado: 'Resecas solo lo irrecuperable, preservando la máxima longitud intestinal.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Dejarlo: "con el flujo recuperado, quizá remonte"',
              correcta: false,
              resultado: 'El intestino necrótico no resucita: sepsis postoperatoria grave.',
              deltaEstabilidad: -25,
              deltaEstres: 15,
            },
          ],
        },
        {
          titulo: 'Cierre y planificación',
          evento: 'Quedan zonas de viabilidad intermedia. El paciente tolera mal la cirugía prolongada.',
          opciones: [
            {
              texto: 'Cirugía de control de daños: abdomen abierto (vacuum) y second-look programado en 24-48 h',
              correcta: true,
              resultado: 'Estrategia correcta: reevaluarás la viabilidad con el paciente reanimado.',
              deltaEstabilidad: 0,
              deltaEstres: -3,
            },
            {
              texto: 'Anastomosis definitiva y cierre completo de pared en el mismo acto',
              correcta: false,
              resultado: 'Sin second-look, la progresión de la isquemia pasará desapercibida.',
              deltaEstabilidad: -15,
              deltaEstres: 8,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'trauma',
    nombre: 'Trauma abdominal cerrado (lesión esplénica)',
    quirurgica: true,
    frecuencia: 5,
    presentacion: {
      sintomas: [
        'Accidente de motocicleta a alta velocidad hace 40 minutos',
        'Dolor en hipocondrio izquierdo irradiado al hombro (signo de Kehr)',
        'Mareo y sudoración fría en el traslado',
      ],
      exploracion: 'Palidez mucocutánea. Dolor y defensa en hipocondrio izquierdo. Huella del manillar en la pared abdominal.',
      constantes: 'TA 88/55, FC 128, Sat 95%, Tª 36,2 °C — ¡hipotenso y taquicárdico!',
    },
    pruebaDiana: 'ecofast',
    hallazgoDiana:
      'Eco-FAST: líquido libre abundante en espacio esplenorrenal y pelvis. Paciente inestable: indicación de laparotomía urgente sin más pruebas.',
    hallazgosParciales: {
      analitica: 'Hb 8,9 g/dL en descenso. Esperar la analítica en un inestable es perder tiempo.',
      tc: 'El paciente se hipotensa en la mesa del TC: trasladar a un inestable al escáner es una decisión peligrosa.',
    },
    deterioroPorHora: 15,
    estabilidadInicial: [40, 55],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'En el trauma abdominal con inestabilidad hemodinámica, la eco-FAST positiva indica laparotomía inmediata. El TC es para pacientes estables; "la muerte comienza en radiología".',
    cirugia: {
      nombre: 'Laparotomía exploradora por trauma',
      duracionMin: 100,
      pasos: [
        {
          titulo: 'Entrada y control inicial',
          evento: 'Hemoperitoneo masivo al abrir. No se identifica el origen de entrada.',
          opciones: [
            {
              texto: 'Empaquetamiento sistemático de los cuatro cuadrantes y aspirado ordenado',
              correcta: true,
              resultado: 'El packing controla temporalmente el sangrado. Identificas el bazo como origen.',
              deltaEstabilidad: +5,
              deltaEstres: 3,
            },
            {
              texto: 'Aspirar y buscar el origen directamente sin empaquetar',
              correcta: false,
              resultado: 'Pierdes minutos preciosos entre sangre: el paciente se hipotensa aún más.',
              deltaEstabilidad: -18,
              deltaEstres: 12,
            },
          ],
        },
        {
          titulo: 'Lesión esplénica grado IV',
          evento: 'Bazo estallado con sangrado activo del hilio. El paciente sigue inestable.',
          opciones: [
            {
              texto: 'Esplenectomía: control del hilio y extirpación',
              correcta: true,
              resultado: 'Hemostasia definitiva. En el inestable no se intenta preservar el bazo.',
              deltaEstabilidad: +5,
              deltaEstres: -2,
            },
            {
              texto: 'Intentar esplenorrafia con mallas y agentes hemostáticos para preservar el bazo',
              correcta: false,
              resultado: 'Media hora de intentos fallidos con el paciente exanguinándose. Acabas haciendo la esplenectomía igualmente.',
              deltaEstabilidad: -20,
              deltaEstres: 14,
            },
          ],
        },
        {
          titulo: 'Fin de la intervención',
          evento: 'Anestesia informa: pH 7,21, temperatura 34,8 °C, coagulopatía en las pruebas viscoelásticas. La tríada letal acecha.',
          opciones: [
            {
              texto: 'Cirugía de control de daños: revisión rápida, packing si precisa y cierre temporal',
              correcta: true,
              resultado: 'Cortas la espiral de la tríada letal. A REA a recalentar, corregir y reanimar.',
              deltaEstabilidad: 0,
              deltaEstres: -3,
            },
            {
              texto: 'Revisión exhaustiva prolongada y cierre definitivo por planos "para no reintervenir"',
              correcta: false,
              resultado: 'Una hora más de quirófano en hipotermia y coagulopatía: el paciente lo paga caro.',
              deltaEstabilidad: -18,
              deltaEstres: 10,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'ulcus',
    nombre: 'Ulcus péptico perforado',
    quirurgica: true,
    frecuencia: 5,
    presentacion: {
      sintomas: [
        'Dolor epigástrico brutal de inicio súbito hace 2 h, «como una puñalada»',
        'El dolor se ha generalizado a todo el abdomen',
        'Antecedente de epigastralgia crónica automedicada con ibuprofeno',
      ],
      exploracion: 'Abdomen en tabla con contractura generalizada. El paciente evita moverse. Matidez hepática dudosa.',
      constantes: 'TA 115/75, FC 104, Sat 97%, Tª 37,4 °C',
    },
    pruebaDiana: 'tc',
    hallazgoDiana:
      'TC: neumoperitoneo evidente subdiafragmático y periportal, líquido libre y engrosamiento de la región antropilórica. Perforación de víscera hueca: ulcus péptico perforado.',
    hallazgosParciales: {
      rxtorax: 'Rx tórax en bipedestación: media luna de aire libre subdiafragmático bilateral. Víscera hueca perforada; el TC precisará el origen.',
      analitica: 'Leucocitosis 15.600 con neutrofilia. Amilasa discretamente elevada (el líquido gástrico libre la sube).',
      eco: 'Ecografía: líquido libre perihepático. El gas dificulta el resto del estudio.',
    },
    deterioroPorHora: 8,
    estabilidadInicial: [55, 75],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'El «abdomen en tabla» con inicio súbito y antecedente de AINEs es un ulcus perforado hasta que se demuestre lo contrario. La sutura simple con epiploplastia de Graham resuelve la urgencia; la enfermedad ulcerosa se trata después con IBP y erradicación de H. pylori.',
    cirugia: {
      nombre: 'Cierre de perforación + epiploplastia de Graham',
      duracionMin: 95,
      pasos: [
        {
          titulo: 'Exploración y control de la contaminación',
          evento: 'Peritonitis química con restos alimentarios. Identificas una perforación de 8 mm en cara anterior prepilórica.',
          opciones: [
            {
              texto: 'Aspirado y lavado abundante por cuadrantes antes de reparar',
              correcta: true,
              resultado: 'Cavidad limpia. La perforación queda bien expuesta para la reparación.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Suturar inmediatamente en el campo sucio: «primero cerrar el grifo»',
              correcta: false,
              resultado: 'Trabajas mal, con restos que ocultan los bordes. La carga séptica sigue dentro.',
              deltaEstabilidad: -10,
              deltaEstres: 8,
            },
          ],
        },
        {
          titulo: 'Reparación de la perforación',
          evento: 'Los bordes de la úlcera están edematosos y friables.',
          opciones: [
            {
              texto: 'Puntos sueltos sin tensión y parche de epiplón (Graham) sobre la sutura',
              correcta: true,
              resultado: 'Cierre sellado con epiplón bien vascularizado. Prueba de fuga negativa.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Sutura simple a tensión sin parche, «para acabar antes»',
              correcta: false,
              resultado: 'Los puntos desgarran el tejido friable: alto riesgo de fuga postoperatoria.',
              deltaEstabilidad: -14,
              deltaEstres: 10,
            },
            {
              texto: 'Antrectomía urgente para «resolverlo de raíz»',
              correcta: false,
              resultado: 'Cirugía mayor innecesaria en un paciente séptico: más tiempo, más sangrado, más riesgo.',
              deltaEstabilidad: -16,
              deltaEstres: 8,
            },
          ],
        },
        {
          titulo: 'Antes de cerrar',
          evento: 'Los bordes de la úlcera te parecen indurados, algo irregulares. ¿Malignidad subyacente?',
          opciones: [
            {
              texto: 'Tomar biopsias de los bordes y dejarlo registrado para el estudio diferido',
              correcta: true,
              resultado: 'Biopsias tomadas sin comprometer el cierre. Si es un tumor, no se escapará.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Ignorarlo: «las úlceras son benignas casi siempre»',
              correcta: false,
              resultado: 'Si era un adenocarcinoma, acabas de retrasar su diagnóstico meses.',
              deltaEstabilidad: -6,
              deltaEstres: 4,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'hernia',
    nombre: 'Hernia inguinal incarcerada (estrangulada)',
    quirurgica: true,
    frecuencia: 6,
    presentacion: {
      sintomas: [
        'Bulto inguinal derecho doloroso e irreductible desde hace 10 h',
        'Náuseas y dolor abdominal cólico creciente',
        'La hernia «se le salía» desde hace años y siempre volvía a entrar',
      ],
      exploracion:
        'Masa inguinal derecha dura, muy dolorosa, irreductible, con piel eritematosa. Dolor abdominal difuso con distensión leve.',
      constantes: 'TA 120/78, FC 102, Sat 97%, Tª 37,9 °C',
    },
    pruebaDiana: 'eco',
    hallazgoDiana:
      'Ecografía de pared: saco herniario inguinal con asa de delgado incarcerada, aperistáltica, con líquido en el saco y engrosamiento parietal. Signos de sufrimiento de asa: hernia estrangulada.',
    hallazgosParciales: {
      analitica: 'Leucocitosis 14.900. Lactato 2,4 mmol/L: empieza a sufrir el asa.',
      tc: 'TC: hernia inguinal con asa incarcerada y cambios inflamatorios. La ecografía habría bastado.',
    },
    deterioroPorHora: 6,
    estabilidadInicial: [60, 80],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'Una hernia incarcerada dolorosa con signos inflamatorios no se reduce a la fuerza en urgencias: puede devolverse al abdomen un asa necrótica («reducción en masa»). Es quirófano urgente con valoración de viabilidad del contenido.',
    cirugia: {
      nombre: 'Herniorrafia urgente con revisión del contenido',
      duracionMin: 85,
      pasos: [
        {
          titulo: 'Apertura del saco herniario',
          evento: 'Al abrir el saco sale líquido oscuro y aparece un asa violácea. El asa amenaza con escurrirse hacia el abdomen.',
          opciones: [
            {
              texto: 'Sujetar el asa con una gasa antes de abrir el anillo: nada vuelve al abdomen sin ser valorado',
              correcta: true,
              resultado: 'Asa controlada y expuesta. Podrás decidir su viabilidad con calma.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Reducir el contenido inmediatamente al abdomen y reparar la pared',
              correcta: false,
              resultado: 'El asa dudosa desaparece en la cavidad sin valorar: si estaba necrótica, la has escondido.',
              deltaEstabilidad: -18,
              deltaEstres: 12,
            },
          ],
        },
        {
          titulo: 'Liberación del anillo',
          evento: 'El anillo herniario es estrecho y fibroso: el asa no sale ni entra.',
          opciones: [
            {
              texto: 'Kelotomía: ampliar el anillo con sección controlada, protegiendo asa y vasos epigástricos',
              correcta: true,
              resultado: 'Anillo ampliado sin lesionar nada. El asa queda liberada.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Tracción forzada del asa a través del anillo estrecho',
              correcta: false,
              resultado: 'Desgarro del asa a nivel del anillo con salida de contenido intestinal.',
              deltaEstabilidad: -16,
              deltaEstres: 12,
            },
          ],
        },
        {
          titulo: 'Viabilidad y reparación',
          evento: 'Tras liberar el asa y reevaluarla con suero caliente, un segmento corto sigue necrótico. Hay contaminación del campo.',
          opciones: [
            {
              texto: 'Resección segmentaria, anastomosis y reparación anatómica SIN malla (campo contaminado)',
              correcta: true,
              resultado: 'Resuelves la urgencia sin dejar prótesis en un campo sucio. Reparación tipo Bassini/Shouldice.',
              deltaEstabilidad: 0,
              deltaEstres: -2,
            },
            {
              texto: 'Resección y colocación de malla de polipropileno «para que no recidive»',
              correcta: false,
              resultado: 'Prótesis en campo contaminado: infección protésica casi garantizada, con reintervención futura.',
              deltaEstabilidad: -12,
              deltaEstres: 8,
            },
            {
              texto: 'No resecar el segmento necrótico para acortar la cirugía',
              correcta: false,
              resultado: 'Intestino muerto dentro del abdomen: peritonitis en 24-48 h.',
              deltaEstabilidad: -22,
              deltaEstres: 14,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'neumotorax',
    nombre: 'Neumotórax a tensión',
    quirurgica: true,
    frecuencia: 4,
    presentacion: {
      sintomas: [
        'Costalada contra el bordillo con la bici hace una hora',
        'Disnea que empeora por minutos; habla entrecortado',
        'Dolor torácico derecho punzante que aumenta al respirar',
      ],
      exploracion:
        'Hipofonesis franca en hemitórax derecho con timpanismo; ingurgitación yugular; tráquea desviada a la izquierda. Se está apagando delante de ti.',
      constantes: 'TA 84/50, FC 132, Sat 84%, Tª 36,4 °C — ¡hipotenso, taquicárdico y desaturando!',
    },
    pruebaDiana: 'ecofast',
    hallazgoDiana:
      'Eco torácica a pie de cama: ausencia de deslizamiento pleural derecho con punto pulmonar. Neumotórax a tensión: esto se drena YA, sin esperar a más imagen.',
    hallazgosParciales: {
      rxtorax: 'Rx tórax: pulmón derecho colapsado con desviación mediastínica contralateral. Si has esperado a la placa para creértelo, has tenido suerte.',
      analitica: 'Pedir analítica a un neumotórax a tensión es una forma educada de perder al paciente.',
      tc: 'El TC confirmaría... si el paciente llegara vivo al escáner. La clínica ya te lo ha dicho todo.',
      ecg: 'ECG: taquicardia sinusal con bajos voltajes derechos. Compatible, pero la clínica manda.',
    },
    deterioroPorHora: 20,
    estabilidadInicial: [35, 50],
    manejoCorrecto: 'cirugia',
    notaDocente:
      'El neumotórax a tensión es un diagnóstico CLÍNICO: hipofonesis + timpanismo + yugulares + shock. Se descomprime de inmediato (aguja en 2º espacio o dedo-drenaje en 5º) antes que cualquier prueba de imagen.',
    cirugia: {
      nombre: 'Descompresión torácica + drenaje',
      duracionMin: 40,
      pasos: [
        {
          titulo: 'Descompresión inmediata',
          evento: 'El paciente se hipotensa más. La aguja o el dedo: algo tiene que entrar en ese tórax ahora.',
          opciones: [
            {
              texto: 'Toracostomía con el dedo en 5º espacio, línea axilar media: aire que silba y TA que remonta',
              correcta: true,
              resultado: 'El sifón de aire confirma el diagnóstico. La tensión cede y las yugulares se vacían.',
              deltaEstabilidad: +12,
              deltaEstres: 3,
            },
            {
              texto: 'Esperar al TC para confirmar antes de agujerear a nadie',
              correcta: false,
              resultado: 'Camino del escáner el paciente entra en disociación electromecánica. Vuelves corriendo.',
              deltaEstabilidad: -22,
              deltaEstres: 15,
            },
          ],
        },
        {
          titulo: 'Colocación del drenaje',
          evento: 'Toca el tubo torácico definitivo. El espacio pleural está a tu merced... y el paquete intercostal también.',
          opciones: [
            {
              texto: 'Disección roma SOBRE el borde superior de la costilla inferior y tubo dirigido a vértice',
              correcta: true,
              resultado: 'El tubo burbujea y oscila. El pulmón vuelve a su sitio en la placa.',
              deltaEstabilidad: +5,
              deltaEstres: -2,
            },
            {
              texto: 'Trocar a ciegas con empuje firme: "siempre ha funcionado"',
              correcta: false,
              resultado: 'El trocar sin control es el instrumento con más órganos en su currículum. Sangrado intercostal.',
              deltaEstabilidad: -14,
              deltaEstres: 10,
            },
          ],
        },
        {
          titulo: 'Comprobación final',
          evento: 'El drenaje burbujea de forma continua y masiva, más de lo esperado.',
          opciones: [
            {
              texto: 'Sospechar lesión traqueobronquial: fijar el tubo, oxígeno y avisar a torácica para fibrobroncoscopia',
              correcta: true,
              resultado: 'Fuga aérea masiva bien encaminada: esto ya es asunto de cirugía torácica, y lo has visto a tiempo.',
              deltaEstabilidad: 0,
              deltaEstres: 2,
            },
            {
              texto: 'Pinzar el drenaje "para que no pierda tanto aire"',
              correcta: false,
              resultado: 'Pinzar un drenaje que fuga es reconstruir el neumotórax a tensión con tus propias manos.',
              deltaEstabilidad: -18,
              deltaEstres: 12,
            },
          ],
        },
      ],
    },
  },
  // ──────────────────────────────────────────────────────────────
  // Conservadoras: ingresar (o derivar a tiempo) también es tratar.
  // ──────────────────────────────────────────────────────────────
  {
    id: 'tce',
    nombre: 'TCE con hematoma epidural',
    quirurgica: false,
    frecuencia: 4,
    presentacion: {
      sintomas: [
        'Caída de un andamio hace 3 h con golpe temporal derecho',
        'Perdió el conocimiento, se recuperó "perfectamente"... y ahora está cada vez más torpe',
        'Cefalea creciente y un vómito en la sala de espera',
      ],
      exploracion:
        'Somnoliento, Glasgow 13 y bajando. Pupila derecha perezosa. Hematoma en cuero cabelludo temporal derecho. El intervalo lúcido de los libros, delante de ti.',
      constantes: 'TA 158/92, FC 52, Sat 97%, Tª 36,6 °C',
    },
    pruebaDiana: 'tccraneo',
    hallazgoDiana:
      'TC craneal: colección hiperdensa biconvexa temporal derecha con efecto masa y desviación de línea media. Hematoma epidural: esto es neurocirugía URGENTE.',
    hallazgosParciales: {
      analitica: 'Coagulación normal. La analítica no descarta nada dentro del cráneo.',
      tc: 'TC abdominal anodino. El problema está un metro más arriba: pide el craneal.',
      ecg: 'Bradicardia sinusal. Con esa TA en ascenso: reflejo de Cushing en marcha.',
    },
    deterioroPorHora: 14,
    estabilidadInicial: [45, 60],
    manejoCorrecto: 'conservador',
    notaDocente:
      'Intervalo lúcido + deterioro + anisocoria = hematoma epidural hasta que el TC diga otra cosa. El tratamiento es craneotomía urgente por NEUROCIRUGÍA: en un centro sin ella, la derivación inmediata es el acto quirúrgico más importante de la noche.',
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'iam',
    nombre: 'IAM inferior (disfrazado de abdomen)',
    quirurgica: false,
    frecuencia: 5,
    presentacion: {
      sintomas: [
        'Dolor "de estómago" opresivo de 2 h, con náuseas y un vómito',
        'Sudoración fría que él atribuye a "algo que ha cenado"',
        'Fumador, hipertenso, y con un hermano "operado del corazón"',
      ],
      exploracion:
        'Epigastrio apenas doloroso a la palpación profunda, sin defensa. Pálido, sudoroso, mal aspecto general que no cuadra con la tripa.',
      constantes: 'TA 98/62, FC 58, Sat 96%, Tª 36,2 °C',
    },
    pruebaDiana: 'ecg',
    hallazgoDiana:
      'ECG: elevación del ST en II, III y aVF. Infarto agudo de cara inferior: el "dolor de estómago" era el corazón. Activa el código infarto.',
    hallazgosParciales: {
      analitica: 'Troponina en curso... pero el ECG tarda 10 minutos y no espera a nadie.',
      eco: 'Abdomen anodino. A veces la mejor ecografía abdominal es la que te hace mirar más arriba.',
      tc: 'TC abdominal normal. Irradiar el abdomen equivocado no diagnostica el tórax correcto.',
    },
    deterioroPorHora: 12,
    estabilidadInicial: [50, 65],
    manejoCorrecto: 'conservador',
    notaDocente:
      'El IAM inferior debuta como epigastralgia con cortejo vegetativo y bradicardia. Todo dolor epigástrico de perfil raro merece un ECG de 10 minutos ANTES que un TC de 60. El tratamiento es reperfusión urgente (hemodinámica), no bisturí.',
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'cad',
    nombre: 'Cetoacidosis diabética (abdomen agudo... que no lo es)',
    quirurgica: false,
    frecuencia: 4,
    presentacion: {
      sintomas: [
        'Dolor abdominal difuso e intenso de 12 h con vómitos',
        'Sed insaciable y micciones continuas estos días',
        'Diabético tipo 1 "con la insulina un poco abandonada" tras un catarro',
      ],
      exploracion:
        'Abdomen doloroso de forma difusa pero depresible, sin verdadera defensa. Respiración profunda y rápida; aliento afrutado inconfundible. Deshidratado.',
      constantes: 'TA 102/64, FC 118, Sat 98%, Tª 37,1 °C — ¡taquicárdico!',
    },
    pruebaDiana: 'analitica',
    hallazgoDiana:
      'Analítica: glucemia 486 mg/dL, pH 7,12, bicarbonato 9, cetonemia intensa. Cetoacidosis diabética: el abdomen duele, pero el problema es metabólico.',
    hallazgosParciales: {
      tc: 'TC abdominal sin hallazgos. La CAD imita el abdomen quirúrgico y se ríe de los escáneres.',
      ecg: 'Taquicardia sinusal con ondas T algo picudas: vigila ese potasio durante el tratamiento.',
    },
    deterioroPorHora: 8,
    estabilidadInicial: [50, 68],
    manejoCorrecto: 'conservador',
    notaDocente:
      'La cetoacidosis diabética produce dolor abdominal intenso que imita un abdomen agudo — y operarla puede ser mortal. Kussmaul + aliento cetósico + glucemia disparada: fluidos, insulina y potasio. El bisturí, enfundado.',
  },
  {
    id: 'pancreatitis',
    nombre: 'Pancreatitis aguda litiásica',
    quirurgica: false,
    frecuencia: 6,
    presentacion: {
      sintomas: [
        'Dolor epigástrico intenso irradiado «en cinturón» a la espalda, de 10 h',
        'Vómitos repetidos que no alivian el dolor',
        'Colelitiasis conocida pendiente de cirugía programada',
      ],
      exploracion: 'Dolor a la palpación epigástrica sin peritonismo franco. Distensión leve. Ruidos disminuidos.',
      constantes: 'TA 118/72, FC 100, Sat 96%, Tª 37,5 °C',
    },
    pruebaDiana: 'analitica',
    hallazgoDiana:
      'Analítica: lipasa 1.850 U/L (>3 veces el límite) y amilasa 1.200 U/L. Perfil hepático con patrón de colestasis leve. Pancreatitis aguda de origen biliar.',
    hallazgosParciales: {
      eco: 'Ecografía: colelitiasis múltiple sin signos de colecistitis. Vía biliar de 7 mm. Páncreas mal visualizado por gas.',
      tc: 'TC precoz: edema peripancreático. Recuerda: el TC precoz no cambia el manejo inicial; la clínica y la lipasa dan el diagnóstico.',
    },
    deterioroPorHora: 3,
    estabilidadInicial: [65, 85],
    manejoCorrecto: 'conservador',
    notaDocente:
      'La pancreatitis aguda NO se opera en fase aguda: el tratamiento es ingreso, fluidoterapia, analgesia y nutrición precoz. La colecistectomía se hace diferida en el mismo ingreso una vez resuelto el cuadro. Operar el páncreas inflamado de urgencia es un error clásico.',
  },
  // ──────────────────────────────────────────────────────────────
  // De alta: distractores benignos — dar el alta también es medicina.
  // ──────────────────────────────────────────────────────────────
  {
    id: 'colico_renal',
    nombre: 'Cólico renoureteral',
    quirurgica: false,
    frecuencia: 5,
    presentacion: {
      sintomas: [
        'Dolor lumbar derecho intensísimo irradiado a genitales, de inicio brusco',
        'El paciente no encuentra postura: se retuerce en la camilla',
        'Un episodio similar hace dos años que «expulsó una piedrecita»',
      ],
      exploracion: 'Puñopercusión renal derecha positiva. Abdomen blando, sin defensa ni peritonismo.',
      constantes: 'TA 135/85, FC 95, Sat 99%, Tª 36,8 °C',
    },
    pruebaDiana: 'tc',
    hallazgoDiana:
      'TC abdominal (protocolo litiasis, baja dosis): litiasis de 4 mm en uréter distal derecho con ectasia leve de la vía. Sin signos de complicación. Cólico renoureteral no complicado.',
    hallazgosParciales: {
      analitica: 'Función renal normal, sin leucocitosis. Microhematuria en el sedimento: pista clave.',
      eco: 'Ecografía: discreta ectasia pielocalicial derecha. No se visualiza la litiasis.',
    },
    deterioroPorHora: 0,
    estabilidadInicial: [85, 95],
    manejoCorrecto: 'alta',
    notaDocente:
      'Dolor que no deja quieto al paciente (a diferencia del peritonítico, que no se mueve), puñopercusión positiva y microhematuria: cólico renal. Analgesia, alta y control por urología. Nada que cortar.',
  },
  {
    id: 'gastroenteritis',
    nombre: 'Gastroenteritis aguda',
    quirurgica: false,
    frecuencia: 6,
    presentacion: {
      sintomas: [
        'Dolor abdominal difuso tipo retortijón de 8 h',
        'Diarrea líquida (6 deposiciones) y vómitos',
        'Varios familiares con el mismo cuadro tras una comida familiar',
      ],
      exploracion: 'Abdomen blando, depresible, dolor difuso sin defensa ni signos de irritación peritoneal. Peristaltismo aumentado.',
      constantes: 'TA 118/75, FC 88, Sat 99%, Tª 37,2 °C',
    },
    pruebaDiana: 'analitica',
    hallazgoDiana: 'Analítica anodina: sin leucocitosis, PCR 8 mg/L, función renal normal. Cuadro compatible con gastroenteritis.',
    hallazgosParciales: {
      eco: 'Ecografía: asas con contenido líquido e hiperperistaltismo. Sin otros hallazgos.',
      tc: 'TC sin hallazgos quirúrgicos. Una irradiación probablemente innecesaria.',
    },
    deterioroPorHora: 0,
    estabilidadInicial: [85, 95],
    manejoCorrecto: 'alta',
    notaDocente:
      'El contexto epidémico, la ausencia de signos peritoneales y la analítica anodina permiten el alta con tratamiento sintomático. No todo dolor abdominal es quirúrgico.',
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: 'colico_biliar',
    nombre: 'Cólico biliar simple',
    quirurgica: false,
    frecuencia: 5,
    presentacion: {
      sintomas: [
        'Dolor en hipocondrio derecho de 2 h tras una comida copiosa',
        'Náuseas sin vómitos',
        'Episodios similares autolimitados en los últimos meses',
      ],
      exploracion: 'Molestia a la palpación profunda en hipocondrio derecho. Murphy negativo. Sin fiebre.',
      constantes: 'TA 122/78, FC 76, Sat 99%, Tª 36,7 °C',
    },
    pruebaDiana: 'eco',
    hallazgoDiana:
      'Ecografía: colelitiasis múltiple con pared vesicular fina (2 mm), sin líquido perivesicular ni Murphy ecográfico. Cólico biliar simple, sin colecistitis.',
    hallazgosParciales: {
      analitica: 'Analítica normal: sin leucocitosis, PCR 4 mg/L, perfil hepático normal.',
    },
    deterioroPorHora: 0,
    estabilidadInicial: [85, 95],
    manejoCorrecto: 'alta',
    notaDocente:
      'El cólico biliar sin signos inflamatorios se trata con analgesia y alta, remitiendo al paciente a consultas para colecistectomía programada. Operarlo de urgencia esta noche sería sobretratar.',
  },
];

/** Búsqueda por id, útil para tests y depuración. */
export function patologiaPorId(id: string): Patologia | undefined {
  return PATOLOGIAS.find((p) => p.id === id);
}
