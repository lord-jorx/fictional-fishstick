/**
 * Base de datos de patologías de la guardia.
 *
 * 6 patologías quirúrgicas clásicas + 2 distractores no quirúrgicos
 * (para que dar el alta también sea una decisión con riesgo).
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
  // Distractores no quirúrgicos: dar el alta también es medicina.
  // ──────────────────────────────────────────────────────────────
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
