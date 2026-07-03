/**
 * Variantes clínicas de presentación por patología.
 *
 * Cada patología tiene su presentación 'tipica' y una o dos variantes
 * DIFÍCILES: clínica larvada, localizaciones engañosas, pistas clave
 * ausentes, pruebas diana que no concluyen a la primera... y distractores
 * que imitan cuadros quirúrgicos. Las plantillas admiten {horas}.
 */
import type { VarianteClinica } from '../core/types.js';

export const VARIANTES: Record<string, VarianteClinica[]> = {
  // ──────────────────────────────────────────────────────────────
  apendicitis: [
    {
      id: 'tipica',
      peso: 6,
      horas: [8, 30],
      sintomas: [
        'Dolor periumbilical migrado a fosa ilíaca derecha de {horas} h de evolución',
        'Anorexia y náuseas',
        'Febrícula termometrada en casa',
      ],
      exploracion: 'Blumberg positivo en FID, defensa localizada. Psoas dudoso.',
    },
    {
      id: 'retrocecal',
      peso: 2,
      horas: [12, 36],
      zonaDolor: 'lumbar-der',
      sintomas: [
        'Dolor lumbar derecho sordo de {horas} h que no cede con analgesia',
        'Molestia al caminar y al estirar la pierna derecha',
        'Náuseas sin vómitos; niega síndrome miccional',
      ],
      exploracion:
        'FID poco expresiva. Psoas claramente positivo; puñopercusión renal derecha dudosa. Un cuadro que engaña: parece renal, pero el psoas delata al apéndice retrocecal.',
      pruebaEsquiva: 0.35,
      informeDudoso:
        'TC: apéndice de visualización parcial por escasa grasa intraabdominal; discreta rarefacción retrocecal inespecífica. No concluyente: correlacionar con clínica o repetir estudio dirigido.',
    },
    {
      id: 'anciano-larvado',
      peso: 2,
      soloMayores: true,
      horas: [36, 72],
      sintomas: [
        'Malestar abdominal vago de {horas} h, "como un empacho"',
        'La familia lo nota decaído y sin apetito desde hace dos días',
        'Sin fiebre termometrada en casa',
      ],
      exploracion:
        'Abdomen poco expresivo, molestia difusa en hemiabdomen derecho sin claro Blumberg. En el anciano la apendicitis avisa bajito... y perfora pronto.',
      deterioroFactor: 1.3,
      estabilidadDelta: -8,
    },
  ],
  // ──────────────────────────────────────────────────────────────
  colecistitis: [
    {
      id: 'tipica',
      peso: 6,
      horas: [12, 48],
      sintomas: [
        'Dolor en hipocondrio derecho de {horas} h, continuo, irradiado a escápula',
        'Fiebre con escalofríos',
        'Vómitos alimentarios',
      ],
      exploracion: 'Murphy positivo. No ictericia. Abdomen blando en el resto.',
    },
    {
      id: 'anciano-septico',
      peso: 2,
      soloMayores: true,
      horas: [48, 96],
      sintomas: [
        'Cuadro confusional de inicio en las últimas {horas} h',
        'Rechazo de la ingesta; la residencia lo envía por deterioro general',
        'Sin dolor claramente referido: el paciente apenas colabora',
      ],
      exploracion:
        'Desorientado. Molestia mal definida en hemiabdomen superior; Murphy no valorable por falta de colaboración. La sepsis biliar del anciano puede debutar como delirium.',
      deterioroFactor: 1.25,
      estabilidadDelta: -12,
      pruebaEsquiva: 0.3,
      informeDudoso:
        'Ecografía: vesícula con barro biliar y pared en el límite alto (4 mm), paciente poco colaborador, estudio subóptimo. No concluyente: repetir o correlacionar.',
    },
  ],
  // ──────────────────────────────────────────────────────────────
  obstruccion: [
    {
      id: 'tipica',
      peso: 6,
      horas: [24, 48],
      sintomas: [
        'Dolor abdominal cólico de {horas} h que se ha vuelto continuo',
        'Vómitos biliosos y distensión abdominal',
        'Ausencia de tránsito para gases y heces',
      ],
      exploracion:
        'Abdomen distendido y timpánico, cicatriz de laparotomía previa. Dolor fijo en mesogastrio con defensa. Ruidos metálicos.',
    },
    {
      id: 'hernia-interna',
      peso: 2,
      horas: [12, 30],
      sintomas: [
        'Dolor abdominal cólico intenso de {horas} h con vómitos',
        'Distensión progresiva y ausencia de ventoseo',
        'Sin cirugías abdominales previas: "a mí nunca me han operado"',
      ],
      exploracion:
        'Abdomen distendido, timpánico y SIN cicatrices. Dolor fijo periumbilical con defensa. Sin el dato de la laparotomía previa, la brida no puede ser la explicación fácil: piensa en hernia interna.',
      deterioroFactor: 1.15,
    },
  ],
  // ──────────────────────────────────────────────────────────────
  diverticulitis: [
    {
      id: 'tipica',
      peso: 5,
      horas: [36, 72],
      sintomas: [
        'Dolor intenso en fosa ilíaca izquierda de {horas} h, ahora generalizado',
        'Fiebre alta y malestar general intenso',
        'Episodios previos de "diverticulitis" tratados con antibióticos',
      ],
      exploracion: 'Abdomen en tabla, defensa generalizada con signos de irritación peritoneal difusa.',
    },
    {
      id: 'urinaria-engañosa',
      peso: 2,
      horas: [48, 96],
      sintomas: [
        'Disuria y polaquiuria de {horas} h "como una cistitis que no se cura"',
        'Dolor hipogástrico y en fosa ilíaca izquierda que va a más',
        'Fiebre que su médico atribuyó a infección de orina, sin respuesta a antibiótico oral',
      ],
      exploracion:
        'Defensa en FII e hipogastrio, más de lo que justificaría una cistitis. El sigma inflamado apoyado en la vejiga imita clínica urinaria: no te quedes en el sedimento.',
      deterioroFactor: 1.1,
      estabilidadDelta: -5,
    },
  ],
  // ──────────────────────────────────────────────────────────────
  isquemia: [
    {
      id: 'tipica',
      peso: 5,
      horas: [2, 6],
      sintomas: [
        'Dolor abdominal brutal de inicio súbito hace {horas} h',
        'El dolor es desproporcionado respecto a la exploración',
        'Antecedente de fibrilación auricular sin anticoagular',
      ],
      exploracion: 'Abdomen blando y poco doloroso a la palpación pese al dolor referido. Arritmia a la auscultación.',
    },
    {
      id: 'sin-arritmia',
      peso: 2,
      horas: [4, 10],
      sintomas: [
        'Dolor abdominal intensísimo y continuo de {horas} h',
        'Una deposición diarreica al inicio del cuadro',
        'Fumador con claudicación intermitente en ambas piernas; niega cardiopatía',
      ],
      exploracion:
        'Abdomen casi anodino que contrasta con un paciente que se retuerce. Pulso RÍTMICO: sin la pista de la FA, solo el dolor desproporcionado y la arteriopatía te avisan (trombosis arterial, no embolia).',
      deterioroFactor: 1.15,
      pruebaEsquiva: 0.25,
      informeDudoso:
        'Angio-TC: ateromatosis calcificada difusa de la AMS con estenosis de difícil graduación; hipocaptación parietal sutil, artefactada por movimiento. No concluyente: repetir estudio o decidir por clínica.',
    },
  ],
  // ──────────────────────────────────────────────────────────────
  trauma: [
    {
      id: 'tipica',
      peso: 5,
      horas: [1, 2],
      sintomas: [
        'Accidente de motocicleta a alta velocidad hace menos de {horas} h',
        'Dolor en hipocondrio izquierdo irradiado al hombro (signo de Kehr)',
        'Mareo y sudoración fría en el traslado',
      ],
      exploracion:
        'Palidez mucocutánea. Dolor y defensa en hipocondrio izquierdo. Huella del manillar en la pared abdominal.',
    },
    {
      id: 'respondedor-transitorio',
      peso: 2,
      horas: [1, 3],
      sintomas: [
        'Caída de bicicleta contra el manillar hace {horas} h; vino caminando',
        'Dolor en hipocondrio izquierdo que aumenta, ahora irradiado al hombro',
        'En triaje le han dado analgesia y "estaba bien"; empieza a marearse sentado',
      ],
      exploracion:
        'Buen aspecto engañoso. Dolor con defensa en HCI y Kehr incipiente. Los respondedores transitorios se desploman en la segunda hora: no te fíes de una TA normal aislada.',
      estabilidadDelta: +12,
      deterioroFactor: 1.5,
      pruebaEsquiva: 0.3,
      informeDudoso:
        'Eco-FAST: mínima lengüeta de líquido esplenorrenal, dudosa con la vejiga vacía. No concluyente: repetir FAST seriada en 15 minutos o escalar según clínica.',
    },
  ],
  // ──────────────────────────────────────────────────────────────
  ulcus: [
    {
      id: 'tipica',
      peso: 5,
      horas: [1, 4],
      sintomas: [
        'Dolor epigástrico brutal de inicio súbito hace {horas} h, "como una puñalada"',
        'El dolor se ha generalizado a todo el abdomen',
        'Antecedente de epigastralgia crónica automedicada con ibuprofeno',
      ],
      exploracion: 'Abdomen en tabla con contractura generalizada. El paciente evita moverse. Matidez hepática dudosa.',
    },
    {
      id: 'anciano-corticoides',
      peso: 2,
      soloMayores: true,
      horas: [6, 18],
      sintomas: [
        'Dolor epigástrico "soportable" de {horas} h en paciente con polimialgia en tratamiento corticoideo',
        'Náuseas y malestar general progresivo',
        'Los corticoides enmascaran: ni fiebre ni dolor proporcionado',
      ],
      exploracion:
        'Abdomen sorprendentemente blando para lo que esconde; molestia epigástrica difusa sin claro vientre en tabla. El corticoide apaga la alarma peritoneal.',
      deterioroFactor: 1.2,
      estabilidadDelta: -6,
    },
  ],
  // ──────────────────────────────────────────────────────────────
  hernia: [
    {
      id: 'tipica',
      peso: 5,
      horas: [6, 16],
      sintomas: [
        'Bulto inguinal derecho doloroso e irreductible desde hace {horas} h',
        'Náuseas y dolor abdominal cólico creciente',
        'La hernia "se le salía" desde hace años y siempre volvía a entrar',
      ],
      exploracion:
        'Masa inguinal derecha dura, muy dolorosa, irreductible, con piel eritematosa. Dolor abdominal difuso con distensión leve.',
    },
    {
      id: 'oculta-obesidad',
      peso: 2,
      horas: [10, 24],
      sintomas: [
        'Dolor abdominal cólico y vómitos de {horas} h sin causa clara',
        'Refiere "un pellizco" inguinal que no sabe precisar',
        'Obesidad importante: nunca se ha notado bultos',
      ],
      exploracion:
        'Panículo adiposo que impide palpar con claridad; dudosa ocupación inguinal derecha muy dolorosa a la presión profunda. La hernia crural de la paciente obesa es la gran escondida.',
      pruebaEsquiva: 0.4,
      informeDudoso:
        'Ecografía de pared: exploración limitada por panículo adiposo; imagen inguinal mal definida sin poder confirmar asa. No concluyente: repetir con maniobra de Valsalva dirigida.',
      deterioroFactor: 1.15,
    },
  ],
  // ──────────────────────────────────────────────────────────────
  pancreatitis: [
    {
      id: 'tipica',
      peso: 5,
      horas: [6, 16],
      sintomas: [
        'Dolor epigástrico intenso irradiado "en cinturón" a la espalda, de {horas} h',
        'Vómitos repetidos que no alivian el dolor',
        'Colelitiasis conocida pendiente de cirugía programada',
      ],
      exploracion: 'Dolor a la palpación epigástrica sin peritonismo franco. Distensión leve. Ruidos disminuidos.',
    },
    {
      id: 'grave',
      peso: 2,
      horas: [12, 30],
      sintomas: [
        'Dolor epigástrico transfixivo de {horas} h con vómitos incoercibles',
        'Oliguria desde esta mañana y sed intensa',
        'Ingesta etílica importante el fin de semana',
      ],
      exploracion:
        'Afectación del estado general, sequedad mucosa, abdomen distendido y doloroso de forma difusa sin claro peritonismo. Una pancreatitis grave se ingresa y se reanima con fluidos: abrirla sigue sin ser la respuesta.',
      estabilidadDelta: -15,
      deterioroFactor: 1.5,
    },
  ],
  // ──────────────────────────────────────────────────────────────
  gastroenteritis: [
    {
      id: 'tipica',
      peso: 5,
      horas: [6, 24],
      sintomas: [
        'Dolor abdominal difuso tipo retortijón de {horas} h',
        'Diarrea líquida abundante y vómitos',
        'Varios familiares con el mismo cuadro tras una comida familiar',
      ],
      exploracion:
        'Abdomen blando, depresible, dolor difuso sin defensa ni signos de irritación peritoneal. Peristaltismo aumentado.',
    },
    {
      id: 'pseudoapendicular',
      peso: 2,
      horas: [12, 30],
      zonaDolor: 'fid',
      sintomas: [
        'Dolor que se ha ido centrando en fosa ilíaca derecha, de {horas} h',
        'Alguna deposición blanda; febrícula',
        'Un compañero de trabajo tuvo "gastroenteritis" la semana pasada',
      ],
      exploracion:
        'Molestia en FID a la palpación profunda SIN verdadera defensa ni Blumberg franco. Duele donde el apéndice… pero el peritoneo no protesta. La trampa clásica: no toda FID es apendicitis.',
    },
  ],
  // ──────────────────────────────────────────────────────────────
  colico_biliar: [
    {
      id: 'tipico',
      peso: 5,
      horas: [1, 4],
      sintomas: [
        'Dolor en hipocondrio derecho de {horas} h tras una comida copiosa',
        'Náuseas sin vómitos',
        'Episodios similares autolimitados en los últimos meses',
      ],
      exploracion: 'Molestia a la palpación profunda en hipocondrio derecho. Murphy negativo. Sin fiebre.',
    },
    {
      id: 'prolongado',
      peso: 2,
      horas: [5, 9],
      sintomas: [
        'Dolor en hipocondrio derecho que ya dura {horas} h, más de lo habitual en sus cólicos',
        'Muy nervioso: "esta vez es distinto, seguro que es la vesícula infectada"',
        'Sin fiebre ni escalofríos',
      ],
      exploracion:
        'Molestia en HCD con Murphy equívoco por defensa voluntaria. Un cólico prolongado obliga a descartar colecistitis... pero sin fiebre, sin leucocitosis y con eco limpia, sigue siendo un cólico.',
    },
  ],
  // ──────────────────────────────────────────────────────────────
  colico_renal: [
    {
      id: 'tipico',
      peso: 5,
      horas: [1, 5],
      sintomas: [
        'Dolor lumbar derecho intensísimo irradiado a genitales, de inicio brusco hace {horas} h',
        'El paciente no encuentra postura: se retuerce en la camilla',
        'Un episodio similar hace dos años que "expulsó una piedrecita"',
      ],
      exploracion: 'Puñopercusión renal derecha positiva. Abdomen blando, sin defensa ni peritonismo.',
    },
    {
      id: 'ureteral-bajo',
      peso: 2,
      horas: [2, 8],
      zonaDolor: 'fid',
      sintomas: [
        'Dolor en fosa ilíaca derecha de {horas} h irradiado a genitales',
        'Náuseas; una micción con escozor',
        'Inquieto, cambia de postura constantemente',
      ],
      exploracion:
        'Dolor en FID SIN defensa ni Blumberg; puñopercusión derecha levemente molesta. La litiasis del uréter distal juega a disfrazarse de apendicitis: el paciente que se retuerce no suele tener peritonitis.',
    },
  ],
};
