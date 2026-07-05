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
};

/** Texto de interfaz en el idioma activo. */
export function t(clave: keyof typeof C): string {
  const fila = C[clave];
  if (!fila) return String(clave);
  const indice = ['es', 'en', 'fr', 'ca', 'de'].indexOf(idiomaActual);
  return fila[indice as 0 | 1 | 2 | 3 | 4] ?? fila[0];
}
