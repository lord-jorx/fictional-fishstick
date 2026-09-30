/**
 * Internacionalización de la interfaz.
 *
 * v1: los textos de INTERFAZ (menús, HUD, acciones) están en español,
 * inglés, francés, catalán y alemán. El contenido clínico narrativo
 * (anamnesis, interrogatorios, pasos quirúrgicos, perlas) es un pack de
 * contenido aparte y en esta versión existe solo en español — la
 * estructura de datos ya permite añadir packs por idioma sin tocar motor.
 */

export type Idioma = 'es' | 'en' | 'fr' | 'ca' | 'de';

export const IDIOMAS: Array<{ id: Idioma; nombre: string }> = [
  { id: 'es', nombre: 'Español' },
  { id: 'en', nombre: 'English' },
  { id: 'fr', nombre: 'Français' },
  { id: 'ca', nombre: 'Català' },
  { id: 'de', nombre: 'Deutsch' },
];

let idiomaActual: Idioma = 'es';

export function fijarIdioma(idioma: Idioma): void {
  idiomaActual = idioma;
}

export function idioma(): Idioma {
  return idiomaActual;
}

type Catalogo = Record<string, [string, string, string, string, string]>; // es,en,fr,ca,de

const C: Catalogo = {
  energia: ['Energía', 'Energy', 'Énergie', 'Energia', 'Energie'],
  estres: ['Estrés', 'Stress', 'Stress', 'Estrès', 'Stress'],
  quirofanos: ['Quirófanos libres', 'Free theatres', 'Blocs libres', 'Quiròfans lliures', 'Freie OP-Säle'],
  camasRea: ['Camas REA libres', 'Free ICU beds', 'Lits réa libres', 'Llits REA lliures', 'Freie Intensivbetten'],
  enEspera: ['Pacientes en espera', 'Patients waiting', 'Patients en attente', 'Pacients en espera', 'Wartende Patienten'],
  quedan: ['quedan', 'left', 'restant', 'queden', 'übrig'],
  deGuardia: ['de guardia', 'on call', 'de garde', 'de guàrdia', 'im Dienst'],
  atenderA: ['Atender a', 'See', 'Examiner', 'Atendre', 'Behandeln:'],
  ronda: ['Pasar visita a los ingresados', 'Round on admitted patients', 'Visite des hospitalisés', 'Passar visita als ingressats', 'Visite bei Stationspatienten'],
  cafe: ['Tomar un café y despejarte', 'Grab a coffee and reset', 'Prendre un café', 'Fer un cafè i espavilar-te', 'Kaffee holen und durchatmen'],
  descansar: ['Descansar hasta que suene el busca', 'Rest until the pager goes off', 'Se reposer jusqu’au bip', 'Descansar fins que soni el busca', 'Ausruhen, bis der Pieper geht'],
  salaTitulo: ['Sala de urgencias — pacientes esperan tu decisión:', 'A&E — patients await your call:', 'Urgences — des patients attendent :', 'Urgències — pacients esperen la teva decisió:', 'Notaufnahme — Patienten warten:'],
  salaCalma: ['Urgencias está en calma (de momento). ¿Qué haces?', 'A&E is quiet (for now). Your move?', 'Les urgences sont calmes (pour l’instant).', 'Urgències està en calma (de moment). Què fas?', 'Die Notaufnahme ist ruhig (noch). Was tust du?'],
  explorar: ['Explorar al paciente', 'Examine the patient', 'Examiner le patient', 'Explorar el pacient', 'Patienten untersuchen'],
  apretar: ['Apretar en la anamnesis: algo no encaja', 'Press them: the story has holes', 'Insister : quelque chose cloche', 'Estrènyer l’anamnesi: alguna cosa no quadra', 'Nachbohren: da stimmt was nicht'],
  solicitar: ['Solicitar', 'Order', 'Demander', 'Sol·licitar', 'Anfordern:'],
  alta: ['Dar de alta con tratamiento ambulatorio', 'Discharge with outpatient treatment', 'Renvoyer avec traitement ambulatoire', 'Donar l’alta amb tractament ambulatori', 'Entlassen mit ambulanter Therapie'],
  ingresar: ['Ingresar para tratamiento conservador / observación', 'Admit for conservative management', 'Hospitaliser pour traitement conservateur', 'Ingressar per a tractament conservador', 'Stationär aufnehmen (konservativ)'],
  cirugiaUrgente: ['Programar CIRUGÍA URGENTE', 'Book EMERGENCY SURGERY', 'Programmer une CHIRURGIE URGENTE', 'Programar CIRURGIA URGENT', 'NOTOPERATION ansetzen'],
  volverControl: ['Dejarlo en el box y volver al control', 'Leave them in the bay and step out', 'Le laisser au box et revenir au poste', 'Deixar-lo al box i tornar al control', 'Im Behandlungsraum lassen'],
  comoProcedes: ['¿Cómo procedes?', 'How do you proceed?', 'Comment procédez-vous ?', 'Com procedeixes?', 'Wie gehst du vor?'],
  queHacesCon: ['¿Qué haces con', 'What do you do with', 'Que faites-vous de', 'Què fas amb', 'Was tust du mit'],
  queLeDices: ['¿Qué le dices?', 'What do you say?', 'Que répondez-vous ?', 'Què li dius?', 'Was sagst du?'],
  creerle: ['Creerle', 'Believe them', 'Le croire', 'Creure’l', 'Glauben'],
  dudar: ['Dudar', 'Doubt', 'Douter', 'Dubtar', 'Zweifeln'],
  acusar: ['Acusarle de mentir', 'Call the lie', 'L’accuser de mentir', 'Acusar-lo de mentir', 'Der Lüge bezichtigen'],
  continuar: ['Pulsa Intro para continuar...', 'Press Enter to continue...', 'Appuyez sur Entrée...', 'Prem Intro per continuar...', 'Weiter mit Eingabetaste...'],
  fichar: ['Pulsa Intro para fichar y empezar la guardia...', 'Press Enter to clock in...', 'Entrée pour pointer et commencer la garde...', 'Prem Intro per fitxar i començar la guàrdia...', 'Eingabe drücken und Dienst antreten...'],
  minutos: ['min', 'min', 'min', 'min', 'Min.'],
  urgenciasTag: ['urgencias', 'A&E', 'urgences', 'urgències', 'Notaufnahme'],
  plantaTag: ['planta', 'ward', 'étage', 'planta', 'Station'],
  quienLoLleva: ['¿Quién lleva este caso?', 'Who takes this case?', 'Qui prend ce cas ?', 'Qui porta aquest cas?', 'Wer übernimmt den Fall?'],
  llevaElCaso: ['Lleva el caso', 'Case lead', 'Responsable du cas', 'Porta el cas', 'Fallführung'],
  opera: ['Opera', 'Operating', 'Opère', 'Opera', 'Es operiert'],
  derivar: ['Derivar en ambulancia medicalizada al centro de referencia', 'Transfer by ambulance to the referral centre', 'Transférer en ambulance vers le centre de référence', 'Derivar en ambulància medicalitzada al centre de referència', 'Mit Notarztwagen ins Referenzzentrum verlegen'],
  uiContinuar: ['Continuar', 'Continue', 'Continuer', 'Continuar', 'Weiter'],
  uiDiario: ['Diario', 'Log', 'Journal', 'Diari', 'Protokoll'],
  uiValorar: ['Valorar', 'Assess', 'Évaluer', 'Valorar', 'Beurteilen'],
  uiPruebas: ['Pruebas', 'Tests', 'Examens', 'Proves', 'Untersuchungen'],
  uiDecidir: ['Decidir', 'Decide', 'Décider', 'Decidir', 'Entscheiden'],
  uiHistoria: ['Historia clínica', 'Patient chart', 'Dossier médical', 'Història clínica', 'Patientenakte'],
  uiAnamnesis: ['Anamnesis', 'History', 'Anamnèse', 'Anamnesi', 'Anamnese'],
  uiConstantes: ['Constantes', 'Vitals', 'Constantes', 'Constants', 'Vitalwerte'],
  uiExploracion: ['Exploración', 'Examination', 'Examen', 'Exploració', 'Untersuchung'],
  uiPaso: ['Paso', 'Step', 'Étape', 'Pas', 'Schritt'],
  uiControles: ['WASD / flechas: moverte · clic: ir · E: interactuar', 'WASD / arrows: move · click: go · E: interact', 'ZQSD / flèches : bouger · clic : aller · E : interagir', 'WASD / fletxes: moure’t · clic: anar · E: interactuar', 'WASD / Pfeile: bewegen · Klick: hingehen · E: handeln'],
  uiNuevaGuardia: ['Empezar una nueva guardia', 'Start a new shift', 'Commencer une nouvelle garde', 'Començar una nova guàrdia', 'Neuen Dienst beginnen'],
  uiParte: ['Parte de guardia', 'Shift report', 'Rapport de garde', 'Parte de guàrdia', 'Dienstbericht'],
  uiPuntuacion: ['Puntuación', 'Score', 'Score', 'Puntuació', 'Punkte'],
  uiTaquilla: ['Tu taquilla', 'Your locker', 'Votre casier', 'La teva taquilla', 'Dein Spind'],
  uiExpediente: ['Expediente del cirujano', 'Surgeon’s record', 'Dossier du chirurgien', 'Expedient del cirurgià', 'Chirurgen-Akte'],
  uiBolsillo: ['En el bolsillo', 'In your pocket', 'Dans la poche', 'A la butxaca', 'In der Tasche'],
  uiEstabilidad: ['Estabilidad', 'Stability', 'Stabilité', 'Estabilitat', 'Stabilität'],
  uiAtender: ['Atender', 'See patient', 'Examiner', 'Atendre', 'Behandeln'],
  uiInteractuar: ['Pulsa E', 'Press E', 'Appuyez sur E', 'Prem E', 'E drücken'],
  uiPlantaIngresados: ['ingresados', 'admitted', 'hospitalisés', 'ingressats', 'stationär'],
  uiResolucion: ['Resolución del caso', 'Case outcome', 'Issue du cas', 'Resolució del cas', 'Fallergebnis'],
  mapaPista: ['Muévete con WASD / flechas, o clica una zona', 'Move with WASD / arrow keys, or click a zone', 'Déplacez-vous avec ZQSD / flèches, ou cliquez une zone', 'Mou-te amb WASD / fletxes, o clica una zona', 'Bewege dich mit WASD / Pfeiltasten oder klicke eine Zone an'],
  mapaPistaTactil: ['Usa la cruceta para moverte, o toca una zona', 'Use the pad to move, or tap a zone', 'Utilisez la croix pour vous déplacer, ou touchez une zone', 'Fes servir la creueta per moure’t, o toca una zona', 'Steuerkreuz zum Bewegen oder Zone antippen'],
};

/** Texto de interfaz en el idioma activo. */
export function t(clave: keyof typeof C): string {
  const fila = C[clave];
  if (!fila) return String(clave);
  const indice = ['es', 'en', 'fr', 'ca', 'de'].indexOf(idiomaActual);
  return fila[indice as 0 | 1 | 2 | 3 | 4] ?? fila[0];
}

// ────────────────────────────────────────────────────────────────────
// Textos de interfaz que el motor emite en español (menús de configuración,
// taquilla, parte de guardia). El adaptador visual los traduce al mostrarlos;
// el texto clínico narrativo sigue siendo un pack de contenido aparte.
// Orden de cada fila: en, fr, ca, de.
type Fila4 = [string, string, string, string];

const D: Record<string, Fila4> = {
  // Elección de guardia
  '¿Qué guardia fichas?': ['Which shift are you clocking in for?', 'Quelle garde prenez-vous ?', 'Quina guàrdia fitxes?', 'Welchen Dienst trittst du an?'],
  'Guardia libre': ['Free shift', 'Garde libre', 'Guàrdia lliure', 'Freier Dienst'],
  'una noche nueva cada vez': ['a new night every time', 'une nouvelle nuit à chaque fois', 'una nit nova cada vegada', 'jedes Mal eine neue Nacht'],
  'la MISMA noche para todo el mundo hoy: compárate y repite intentos': ['the SAME night for everyone today: compare yourself and retry', 'la MÊME nuit pour tout le monde aujourd’hui : comparez-vous et réessayez', 'la MATEIXA nit per a tothom avui: compara’t i repeteix intents', 'heute für alle DIESELBE Nacht: vergleiche dich und versuche es erneut'],
  // Equipo y personaje
  '¿Cómo sales a esta guardia?': ['How are you going into this shift?', 'Comment abordez-vous cette garde ?', 'Com surts a aquesta guàrdia?', 'Wie gehst du in diesen Dienst?'],
  'En solitario': ['Solo', 'En solo', 'En solitari', 'Allein'],
  'Dúo cooperativo (local): dos cirujanos, una guardia': ['Local co-op duo: two surgeons, one shift', 'Duo coopératif (local) : deux chirurgiens, une garde', 'Duo cooperatiu (local): dos cirurgians, una guàrdia', 'Lokales Koop-Duo: zwei Chirurgen, ein Dienst'],
  'Tu cirujano: ¿ficha rápida o a medida?': ['Your surgeon: quick start or custom?', 'Votre chirurgien : rapide ou sur mesure ?', 'El teu cirurgià: fitxa ràpida o a mida?', 'Dein Chirurg: Schnellstart oder individuell?'],
  'Editor de personaje (nombre y aspecto)': ['Character editor (name and looks)', 'Éditeur de personnage (nom et look)', 'Editor de personatge (nom i aspecte)', 'Charaktereditor (Name und Aussehen)'],
  '¿Cómo te llaman en el hospital?': ['What do they call you at the hospital?', 'Comment vous appelle-t-on à l’hôpital ?', 'Com et diuen a l’hospital?', 'Wie nennt man dich im Krankenhaus?'],
  'Tono de piel': ['Skin tone', 'Teint', 'To de pell', 'Hautton'],
  'Peinado': ['Hairstyle', 'Coiffure', 'Pentinat', 'Frisur'],
  'Corto': ['Short', 'Court', 'Curt', 'Kurz'],
  'Melena': ['Long hair', 'Cheveux longs', 'Cabell llarg', 'Lange Haare'],
  'Rapado': ['Shaved', 'Rasé', 'Rapat', 'Rasiert'],
  'Color de pelo': ['Hair colour', 'Couleur des cheveux', 'Color de cabell', 'Haarfarbe'],
  'Negro': ['Black', 'Noir', 'Negre', 'Schwarz'],
  'Castaño oscuro': ['Dark brown', 'Châtain foncé', 'Castany fosc', 'Dunkelbraun'],
  'Castaño': ['Brown', 'Châtain', 'Castany', 'Braun'],
  'Cobrizo': ['Copper', 'Cuivré', 'Couper', 'Kupfer'],
  '¿Gafas?': ['Glasses?', 'Lunettes ?', 'Ulleres?', 'Brille?'],
  'Sin gafas': ['No glasses', 'Sans lunettes', 'Sense ulleres', 'Ohne Brille'],
  'Con gafas': ['With glasses', 'Avec lunettes', 'Amb ulleres', 'Mit Brille'],
  '¿Vello facial?': ['Facial hair?', 'Pilosité faciale ?', 'Pèl facial?', 'Gesichtsbehaarung?'],
  'No': ['No', 'Non', 'No', 'Nein'],
  'Sí': ['Yes', 'Oui', 'Sí', 'Ja'],
  // Hospital
  '¿En qué hospital toca esta noche?': ['Which hospital are you on call at tonight?', 'À quel hôpital êtes-vous de garde ce soir ?', 'En quin hospital toca aquesta nit?', 'In welchem Krankenhaus hast du heute Nacht Dienst?'],
  'Hospital Comarcal (nivel 1)': ['District Hospital (level 1)', 'Hôpital de secteur (niveau 1)', 'Hospital Comarcal (nivell 1)', 'Kreiskrankenhaus (Stufe 1)'],
  'Hospital General (nivel 2)': ['General Hospital (level 2)', 'Hôpital général (niveau 2)', 'Hospital General (nivell 2)', 'Allgemeinkrankenhaus (Stufe 2)'],
  'Hospital de Referencia (nivel 3)': ['Referral Hospital (level 3)', 'Hôpital de référence (niveau 3)', 'Hospital de Referència (nivell 3)', 'Maximalversorger (Stufe 3)'],
  '1 quirófano, 1 REA, sin angio-TC nocturno; saber derivar es sobrevivir': ['1 theatre, 1 ICU bed, no night angio-CT; knowing when to transfer is survival', '1 bloc, 1 lit de réa, pas d’angio-TDM de nuit ; savoir transférer, c’est survivre', '1 quiròfan, 1 REA, sense angio-TC nocturn; saber derivar és sobreviure', '1 OP-Saal, 1 Intensivbett, kein nächtliches Angio-CT; Verlegen können heißt überleben'],
  '2 quirófanos, 3 REA, sin neurocirugía ni hemodinámica de guardia': ['2 theatres, 3 ICU beds, no on-call neurosurgery or cath lab', '2 blocs, 3 lits de réa, ni neurochirurgie ni coronarographie de garde', '2 quiròfans, 3 REA, sense neurocirurgia ni hemodinàmica de guàrdia', '2 OP-Säle, 3 Intensivbetten, keine Neurochirurgie oder Herzkatheter im Dienst'],
  '3 quirófanos, 4 REA, de todo... y toda la provincia llamando a tu puerta': ['3 theatres, 4 ICU beds, everything… and the whole province knocking at your door', '3 blocs, 4 lits de réa, tout… et toute la province frappe à votre porte', '3 quiròfans, 4 REA, de tot… i tota la província trucant a la teva porta', '3 OP-Säle, 4 Intensivbetten, alles da … und die ganze Provinz klopft an deine Tür'],
  // Modo
  '¿Con qué nivel sales a la guardia?': ['What level are you on call at?', 'Avec quel niveau prenez-vous la garde ?', 'Amb quin nivell surts a la guàrdia?', 'Mit welchem Niveau gehst du in den Dienst?'],
  'Residente': ['Resident', 'Interne', 'Resident', 'Assistenzarzt'],
  'un adjunto te da pistas; ideal para aprender (también sin ser sanitario)': ['an attending gives you hints; ideal for learning (even if you are not a clinician)', 'un senior vous donne des indices ; idéal pour apprendre (même sans être soignant)', 'un adjunt et dona pistes; ideal per aprendre (també sense ser sanitari)', 'ein Oberarzt gibt dir Hinweise; ideal zum Lernen (auch für Nicht-Mediziner)'],
  'Adjunto': ['Attending', 'Senior', 'Adjunt', 'Oberarzt'],
  'sin red de seguridad, puntuación completa': ['no safety net, full score', 'sans filet, score complet', 'sense xarxa de seguretat, puntuació completa', 'ohne Sicherheitsnetz, volle Punktzahl'],
  'Guardia negra': ['Black shift', 'Garde noire', 'Guàrdia negra', 'Schwarzer Dienst'],
  'atípicas ×2, hospital saturado, más complicaciones; puntuación ×1,2': ['atypical ×2, packed hospital, more complications; score ×1.2', 'atypiques ×2, hôpital saturé, plus de complications ; score ×1,2', 'atípiques ×2, hospital saturat, més complicacions; puntuació ×1,2', 'atypisch ×2, überfülltes Haus, mehr Komplikationen; Punkte ×1,2'],
  'Noche de fiestas mayores': ['Festival night', 'Nuit de fête', 'Nit de festa major', 'Nacht des Stadtfestes'],
  'evento: aluvión de urgencias y un incidente de múltiples víctimas garantizado; puntuación ×1,35': ['event: flood of emergencies and a guaranteed mass-casualty incident; score ×1.35', 'événement : afflux d’urgences et un incident à victimes multiples garanti ; score ×1,35', 'esdeveniment: allau d’urgències i un incident de múltiples víctimes garantit; puntuació ×1,35', 'Ereignis: Notfallflut und garantierter Massenanfall von Verletzten; Punkte ×1,35'],
  // Ritmo
  '¿Cómo quieres vivir la guardia?': ['How do you want to live the shift?', 'Comment voulez-vous vivre la garde ?', 'Com vols viure la guàrdia?', 'Wie willst du den Dienst erleben?'],
  'Por turnos': ['Turn-based', 'Au tour par tour', 'Per torns', 'Rundenbasiert'],
  'clásico: el tiempo solo corre cuando actúas': ['classic: time only runs when you act', 'classique : le temps ne passe que lorsque vous agissez', 'clàssic: el temps només corre quan actues', 'klassisch: die Zeit läuft nur, wenn du handelst'],
  'Tiempo real': ['Real time', 'Temps réel', 'Temps real', 'Echtzeit'],
  'arcade: 1 segundo = 1 minuto; la guardia no espera a nadie': ['arcade: 1 second = 1 minute; the shift waits for no one', 'arcade : 1 seconde = 1 minute ; la garde n’attend personne', 'arcade: 1 segon = 1 minut; la guàrdia no espera ningú', 'Arcade: 1 Sekunde = 1 Minute; der Dienst wartet auf niemanden'],
  // Taquilla y carrera
  'Termo del bueno': ['Proper thermos', 'Un bon thermos', 'Termo del bo', 'Die gute Thermoskanne'],
  'el café recupera el triple de energía': ['coffee restores triple the energy', 'le café redonne trois fois plus d’énergie', 'el cafè recupera el triple d’energia', 'Kaffee gibt dreifache Energie zurück'],
  'Ojo clínico': ['Clinical eye', 'Œil clinique', 'Ull clínic', 'Klinischer Blick'],
  'todas las pruebas tardan 5 min menos': ['all tests take 5 min less', 'tous les examens durent 5 min de moins', 'totes les proves tarden 5 min menys', 'alle Untersuchungen dauern 5 Min. weniger'],
  'El número del adjunto': ['The attending’s number', 'Le numéro du senior', 'El número de l’adjunt', 'Die Nummer des Oberarztes'],
  '1 llamada de ayuda en quirófano, en cualquier modo': ['1 call for help in theatre, in any mode', '1 appel à l’aide au bloc, dans tous les modes', '1 trucada d’ajuda al quiròfan, en qualsevol mode', '1 Hilferuf im OP, in jedem Modus'],
  'Equipo compenetrado': ['Well-drilled team', 'Équipe rodée', 'Equip compenetrat', 'Eingespieltes Team'],
  'menos imprevistos intraoperatorios': ['fewer intra-operative surprises', 'moins d’imprévus peropératoires', 'menys imprevistos intraoperatoris', 'weniger intraoperative Zwischenfälle'],
  'Templanza': ['Composure', 'Sang-froid', 'Temprança', 'Gelassenheit'],
  'empiezas cada guardia sin una gota de estrés': ['you start every shift with zero stress', 'vous commencez chaque garde sans une once de stress', 'comences cada guàrdia sense una gota d’estrès', 'du startest jeden Dienst ohne einen Tropfen Stress'],
  'R1 con vocación': ['Keen first-year', 'Interne de 1ʳᵉ année motivé', 'R1 amb vocació', 'Motivierter Erstjahresarzt'],
  'Adjunto senior': ['Senior attending', 'Senior confirmé', 'Adjunt sènior', 'Leitender Oberarzt'],
  'Jefe de Servicio': ['Head of Department', 'Chef de service', 'Cap de Servei', 'Chefarzt'],
  'Leyenda de la guardia': ['On-call legend', 'Légende de la garde', 'Llegenda de la guàrdia', 'Legende des Bereitschaftsdienstes'],
  'Zuecos nuevos': ['New clogs', 'Sabots neufs', 'Esclops nous', 'Neue Clogs'],
  'ir en persona al box cuesta 2 min en vez de 5': ['walking to a bay takes 2 min instead of 5', 'aller au box en personne coûte 2 min au lieu de 5', 'anar en persona al box costa 2 min en lloc de 5', 'der Gang zur Box dauert 2 statt 5 Min.'],
  'R1 espabilado': ['Sharp first-year', 'Interne dégourdi', 'R1 espavilat', 'Flinker Erstjahresarzt'],
  'las analíticas tardan 15 min menos': ['blood tests take 15 min less', 'les bilans sanguins durent 15 min de moins', 'les analítiques tarden 15 min menys', 'Blutuntersuchungen dauern 15 Min. weniger'],
  'El radiólogo te aprecia': ['The radiologist likes you', 'Le radiologue vous apprécie', 'El radiòleg t’aprecia', 'Der Radiologe mag dich'],
  'TC y angio-TC tardan 20 min menos': ['CT and angio-CT take 20 min less', 'TDM et angio-TDM durent 20 min de moins', 'TC i angio-TC tarden 20 min menys', 'CT und Angio-CT dauern 20 Min. weniger'],
  'Ambulancia a la puerta': ['Ambulance at the door', 'Ambulance à la porte', 'Ambulància a la porta', 'Rettungswagen vor der Tür'],
  'derivar cuesta 10 min en vez de 30': ['transferring takes 10 min instead of 30', 'transférer coûte 10 min au lieu de 30', 'derivar costa 10 min en lloc de 30', 'Verlegen dauert 10 statt 30 Min.'],
  'Pulso de hielo': ['Ice-cold hands', 'Main de fer', 'Pols de gel', 'Ruhige Hand'],
  'los errores en quirófano restan un 25% menos de estabilidad': ['theatre mistakes cost 25% less stability', 'les erreurs au bloc coûtent 25 % de stabilité en moins', 'els errors al quiròfan resten un 25% menys d’estabilitat', 'OP-Fehler kosten 25 % weniger Stabilität'],
  'La supervisora te cubre': ['The supervisor has your back', 'La surveillante vous couvre', 'La supervisora et cobreix', 'Die Stationsleitung deckt dich'],
  'esta noche nadie se va sin ser visto': ['tonight nobody leaves unseen', 'cette nuit, personne ne part sans être vu', 'aquesta nit ningú se’n va sense ser vist', 'heute Nacht geht niemand ungesehen'],
  // Parte final
  'Pacientes atendidos': ['Patients seen', 'Patients pris en charge', 'Pacients atesos', 'Behandelte Patienten'],
  'Cirugías': ['Operations', 'Chirurgies', 'Cirurgies', 'Operationen'],
  'Altas correctas': ['Correct discharges', 'Sorties justifiées', 'Altes correctes', 'Korrekte Entlassungen'],
  'Ingresos': ['Admissions', 'Hospitalisations', 'Ingressos', 'Aufnahmen'],
  'Altas erróneas': ['Wrong discharges', 'Sorties erronées', 'Altes errònies', 'Falsche Entlassungen'],
  'Complicaciones': ['Complications', 'Complications', 'Complicacions', 'Komplikationen'],
  'Derivaciones': ['Transfers', 'Transferts', 'Derivacions', 'Verlegungen'],
  'Triaje de catástrofe': ['Mass-casualty triage', 'Tri de catastrophe', 'Triatge de catàstrofe', 'Katastrophen-Triage'],
  'Se fueron sin ser vistos': ['Left without being seen', 'Partis sans être vus', 'Se’n van anar sense ser vistos', 'Ohne Behandlung gegangen'],
  'Éxitus': ['Deaths', 'Décès', 'Èxitus', 'Todesfälle'],
  'éxitus': ['died', 'décédé', 'èxitus', 'verstorben'],
  'intervenido, en planta': ['operated, on the ward', 'opéré, en service', 'intervingut, a planta', 'operiert, auf Station'],
  'intervenido, en REA': ['operated, in ICU', 'opéré, en réa', 'intervingut, a REA', 'operiert, auf Intensiv'],
  'alta': ['discharged', 'sorti', 'alta', 'entlassen'],
  'derivado al centro de referencia': ['transferred to the referral centre', 'transféré au centre de référence', 'derivat al centre de referència', 'ins Referenzzentrum verlegt'],
  'sigue ingresado (te lo dejas al de la mañana)': ['still admitted (left for the morning team)', 'toujours hospitalisé (pour l’équipe du matin)', 'continua ingressat (el deixes al de matí)', 'weiter stationär (für die Frühschicht)'],
  'se fue sin ser visto, harto de esperar': ['left unseen, fed up with waiting', 'parti sans être vu, las d’attendre', 'se’n va anar sense ser vist, fart d’esperar', 'ungesehen gegangen, vom Warten genervt'],
  '¡SIGUE ESPERANDO EN URGENCIAS!': ['STILL WAITING IN THE A&E!', 'ATTEND TOUJOURS AUX URGENCES !', 'CONTINUA ESPERANT A URGÈNCIES!', 'WARTET NOCH IMMER IN DER NOTAUFNAHME!'],
  'Guardia tutelada (residente): puntuación al 85 %': ['Supervised shift (resident): score at 85 %', 'Garde encadrée (interne) : score à 85 %', 'Guàrdia tutelada (resident): puntuació al 85 %', 'Betreuter Dienst (Assistenzarzt): Punkte bei 85 %'],
  'Noche de fiestas mayores: puntuación ×1,35': ['Festival night: score ×1.35', 'Nuit de fête : score ×1,35', 'Nit de festa major: puntuació ×1,35', 'Stadtfestnacht: Punkte ×1,35'],
  'Guardia negra: puntuación ×1,2': ['Black shift: score ×1.2', 'Garde noire : score ×1,2', 'Guàrdia negra: puntuació ×1,2', 'Schwarzer Dienst: Punkte ×1,2'],
  'Botín de guardia': ['Shift loot', 'Butin de garde', 'Botí de guàrdia', 'Beute des Dienstes'],
  'Hasta la peor noche te manda a casa con algo. Elige un talismán para la próxima (una noche, un uso):': ['Even the worst night sends you home with something. Pick a charm for the next one (one night, one use):', 'Même la pire nuit vous laisse repartir avec quelque chose. Choisissez un talisman pour la prochaine (une nuit, un usage) :', 'Fins i tot la pitjor nit t’envia a casa amb alguna cosa. Tria un talismà per a la propera (una nit, un ús):', 'Selbst die schlimmste Nacht schickt dich nicht mit leeren Händen heim. Wähle einen Talisman für die nächste (eine Nacht, ein Einsatz):'],
  'Talismán guardado en tu taquilla: te espera en la próxima guardia.': ['Charm stored in your locker: it will be waiting next shift.', 'Talisman rangé dans votre casier : il vous attend à la prochaine garde.', 'Talismà guardat a la teva taquilla: t’espera a la propera guàrdia.', 'Talisman in deinem Spind verstaut: er wartet im nächsten Dienst.'],
  'Pacientes': ['Patients', 'Patients', 'Pacients', 'Patienten'],
  'Balance': ['Summary', 'Bilan', 'Balanç', 'Bilanz'],
  'Por cirujano': ['Per surgeon', 'Par chirurgien', 'Per cirurgià', 'Pro Chirurg'],
  'Jefe de Servicio_cita': ['Head of Department', 'Chef de service', 'Cap de Servei', 'Chefarzt'],
  // Paneles
  'Diagnóstico confirmado': ['Confirmed diagnosis', 'Diagnostic confirmé', 'Diagnòstic confirmat', 'Gesicherte Diagnose'],
  'Valoras a': ['You are assessing', 'Vous évaluez', 'Valores a', 'Du beurteilst'],
  'INCIDENTE DE MÚLTIPLES VÍCTIMAS': ['MASS-CASUALTY INCIDENT', 'INCIDENT À VICTIMES MULTIPLES', 'INCIDENT DE MÚLTIPLES VÍCTIMES', 'MASSENANFALL VON VERLETZTEN'],
  'Incidente de múltiples víctimas': ['Mass-casualty incident', 'Incident à victimes multiples', 'Incident de múltiples víctimes', 'Massenanfall von Verletzten'],
  'QUIRÓFANO': ['THEATRE', 'BLOC OPÉRATOIRE', 'QUIRÒFAN', 'OP-SAAL'],
  'COMPLICACIÓN IMPREVISTA': ['UNEXPECTED COMPLICATION', 'COMPLICATION IMPRÉVUE', 'COMPLICACIÓ IMPREVISTA', 'UNERWARTETE KOMPLIKATION'],
  'Guardia del día': ['Shift of the day', 'Garde du jour', 'Guàrdia del dia', 'Dienst des Tages'],
  'reingreso': ['readmission', 'réadmission', 'reingrés', 'Wiederaufnahme'],
  'atípica': ['atypical', 'atypique', 'atípica', 'atypisch'],
  'ASCENSO': ['PROMOTION', 'PROMOTION', 'ASCENS', 'BEFÖRDERUNG'],
  'Silenciar': ['Mute', 'Couper le son', 'Silenciar', 'Stumm schalten'],
  'Activar sonido': ['Turn sound on', 'Activer le son', 'Activar el so', 'Ton einschalten'],
  'Este navegador no puede iniciar gráficos 3D (WebGL). Prueba con Chrome, Edge, Firefox o Safari actualizados.': ['This browser cannot start 3D graphics (WebGL). Try an up-to-date Chrome, Edge, Firefox or Safari.', 'Ce navigateur ne peut pas lancer les graphismes 3D (WebGL). Essayez Chrome, Edge, Firefox ou Safari à jour.', 'Aquest navegador no pot iniciar gràfics 3D (WebGL). Prova amb Chrome, Edge, Firefox o Safari actualitzats.', 'Dieser Browser kann keine 3D-Grafik (WebGL) starten. Probiere aktuelles Chrome, Edge, Firefox oder Safari.'],
  'Llueve sobre la ciudad y el busca acaba de sonar.': ['It is raining over the city and the pager has just gone off.', 'Il pleut sur la ville et le bip vient de sonner.', 'Plou sobre la ciutat i el busca acaba de sonar.', 'Es regnet über der Stadt und der Pieper hat gerade gepiept.'],
  'EL TURNO DE GUARDIA': ['THE ON-CALL SHIFT', 'LA GARDE DE NUIT', 'EL TORN DE GUÀRDIA', 'DER BEREITSCHAFTSDIENST'],
  'Tono': ['Tone', 'Teint', 'To', 'Ton'],
  'Nuevo en tu taquilla': ['New in your locker', 'Nouveau dans votre casier', 'Nou a la teva taquilla', 'Neu in deinem Spind'],
  'esta guardia': ['this shift', 'cette garde', 'aquesta guàrdia', 'dieser Dienst'],
  'ACTIVA': ['ACTIVE', 'ACTIVE', 'ACTIVA', 'AKTIV'],
  'Rango máximo': ['Top rank', 'Rang maximal', 'Rang màxim', 'Höchster Rang'],
  'Rango máximo alcanzado': ['Top rank reached', 'Rang maximal atteint', 'Rang màxim assolit', 'Höchster Rang erreicht'],
};

const indiceIdioma = (): 0 | 1 | 2 | 3 | null => {
  const i = ['en', 'fr', 'ca', 'de'].indexOf(idiomaActual);
  return i < 0 ? null : (i as 0 | 1 | 2 | 3);
};

/** Traduce un texto de interfaz escrito en español (cuerpo + ANSI intactos). */
export function tr(texto: string): string {
  const i = indiceIdioma();
  if (i === null || !texto) return texto;
  const exacto = D[texto.trim()];
  if (exacto) return texto.replace(texto.trim(), exacto[i]);
  let m: RegExpMatchArray | null;
  if ((m = texto.match(/^Empezar ya como (.+)$/))) return ['Start now as ', 'Commencer comme ', 'Començar ja com a ', 'Sofort starten als '][i]! + m[1]!;
  if ((m = texto.match(/^(Cirujano) (\d): ¿ficha rápida o a medida\?$/)))
    return [`Surgeon ${m[2]}: quick start or custom?`, `Chirurgien ${m[2]} : rapide ou sur mesure ?`, `Cirurgià ${m[2]}: fitxa ràpida o a mida?`, `Chirurg ${m[2]}: Schnellstart oder individuell?`][i]!;
  if ((m = texto.match(/^(.*)La guardia del día \((\d+\/\d+)\)$/)))
    return `${m[1]}${['Shift of the day', 'La garde du jour', 'La guàrdia del dia', 'Der Dienst des Tages'][i]} (${m[2]})`;
  if ((m = texto.match(/^Tono (\d)$/))) return `${['Tone', 'Teint', 'To', 'Ton'][i]} ${m[1]}`;
  if ((m = texto.match(/^(\d+) guardias?$/))) return `${m[1]} ${['shift' + (m[1] === '1' ? '' : 's'), 'garde' + (m[1] === '1' ? '' : 's'), 'guàrdia' + (m[1] === '1' ? '' : 's'), m[1] === '1' ? 'Dienst' : 'Dienste'][i]}`;
  if ((m = texto.match(/^(.*) · solo esta noche$/))) return `${tr(m[1]!)} · ${['tonight only', 'cette nuit seulement', 'només aquesta nit', 'nur heute Nacht'][i]}`;
  if ((m = texto.match(/^(\d+) correctos · (\d+) discutibles$/))) return `${m[1]} ${['correct', 'justifiées', 'correctes', 'korrekt'][i]} · ${m[2]} ${['debatable', 'discutables', 'discutibles', 'fragwürdig'][i]}`;
  if ((m = texto.match(/^(\d+) \((\d+) impecables\)$/))) return `${m[1]} (${m[2]} ${['flawless', 'impeccables', 'impecables', 'makellos'][i]})`;
  if ((m = texto.match(/^(\d+) con criterio · (\d+) innecesarias$/))) return `${m[1]} ${['well judged', 'pertinents', 'amb criteri', 'sinnvoll'][i]} · ${m[2]} ${['unnecessary', 'inutiles', 'innecessàries', 'unnötig'][i]}`;
  if ((m = texto.match(/^a (\d+) XP de (.+)$/))) return `${['in', 'à', 'a', 'noch'][i]} ${m[1]} XP ${['to', 'de', 'de', 'bis'][i]} ${tr(m[2]!)}`;
  if ((m = texto.match(/^Intento nº (\d+) de hoy\. La misma noche espera a cualquiera: reta a alguien\.$/)))
    return [`Attempt #${m[1]} today. The same night awaits anyone: challenge someone.`, `Essai n° ${m[1]} du jour. La même nuit attend tout le monde : défiez quelqu’un.`, `Intent núm. ${m[1]} d’avui. La mateixa nit espera qualsevol: rета algú.`.replace('rета', 'reta'), `Versuch Nr. ${m[1]} heute. Dieselbe Nacht wartet auf alle: fordere jemanden heraus.`][i]!;
  if ((m = texto.match(/^(\d+)\/(\d+) correctas$/))) return `${m[1]}/${m[2]} ${['correct', 'correctes', 'correctes', 'korrekt'][i]}`;
  return texto;
}

/** Etiquetas de la interfaz que no vienen del motor. */
const U: Record<string, Fila4> = {
  pacientesLlegada: ['years', 'ans', 'anys', 'Jahre'],
  siguienteRango: ['Next rank', 'Rang suivant', 'Proper rang', 'Nächster Rang'],
  xpGuardia: ['shift no.', 'garde n°', 'guàrdia núm.', 'Dienst Nr.'],
  exp: ['cases', 'dossiers', 'expedients', 'Fälle'],
  media: ['average', 'moyenne', 'mitjana', 'Schnitt'],
  taquillaXp: ['XP', 'XP', 'XP', 'XP'],
  ay: ['ouch!', 'aïe !', 'ai!', 'aua!'],
};
export function u(clave: keyof typeof U): string {
  const i = indiceIdioma();
  return i === null ? ({ pacientesLlegada: 'años', siguienteRango: 'Siguiente rango', xpGuardia: 'guardia nº', exp: 'exp.', media: 'media', taquillaXp: 'XP', ay: '¡ay!' } as Record<string, string>)[clave]! : U[clave]![i];
}
