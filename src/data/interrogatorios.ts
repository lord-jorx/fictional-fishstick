/**
 * Lo que los pacientes juran al llegar a urgencias.
 *
 * Regla de oro de cualquier guardia: la anamnesis es un interrogatorio y
 * el historial "limpio" no existe. Algunos dicen la verdad — esa es la
 * trampa: si dudas de todos, también fallas.
 */
import type { InterrogatorioClinico } from '../core/types.js';

export const INTERROGATORIOS: Record<string, InterrogatorioClinico> = {
  apendicitis: {
    afirmacion: '«Esto me ha empezado esta mañana, se lo juro por mis hijos.»',
    correcta: 'dudar',
    revelacion:
      'Baja la mirada: «Bueno... ayer ya me molestaba al andar, pero pensé que era del gimnasio.» El cuadro lleva más horas de las que confiesa.',
    cerrojo: 'Se ofende: «¿Me está llamando exagerado?» Y a partir de ahí, monosílabos.',
  },
  colecistitis: {
    afirmacion: '«¿Grasas? Ninguna, doctor. En mi casa se come a la plancha de toda la vida.»',
    correcta: 'mentira',
    pruebaClave: 'eco',
    revelacion:
      'Le enseñas la vesícula en la pantalla y suspira: «...ayer hubo torreznos. Y croquetas. Era el bautizo de mi nieto.»',
    cerrojo: 'Cruza los brazos: «Usted qué sabrá lo que ceno yo.» Su mujer, desde la puerta, niega con la cabeza.',
  },
  colico_biliar: {
    afirmacion: '«Este dolor es clavadito al de mis cólicos de siempre. Me tomo el Nolotil y a casa.»',
    correcta: 'creer',
    revelacion: 'Te sostiene la mirada sin pestañear. Los pacientes que se conocen su dolor suelen tener razón.',
    cerrojo: 'Levanta las manos: «¿Ahora resulta que no me conozco mis propias piedras?» Pierdes el poco rapport que tenías.',
  },
  obstruccion: {
    afirmacion: '«¿De vientre? Voy estupendamente, como un reloj suizo.»',
    correcta: 'dudar',
    revelacion:
      'Su hija interviene desde la silla: «Papá, llevas tres días quejándote de que no puedes.» Él protesta, pero el dato queda.',
    cerrojo: 'Te da la espalda en la camilla. La hija, que era tu mejor testigo, sale a por un café.',
  },
  diverticulitis: {
    afirmacion: '«Los antibióticos del otro médico me los tomé enteritos, como me dijeron.»',
    correcta: 'dudar',
    revelacion:
      '«...los dejé al tercer día, cuando me encontré mejor. Es que me sentaban fatal al estómago.» Diverticulitis a medio tratar: eso explica muchas cosas.',
    cerrojo: 'Saca el blíster vacío del bolsillo como prueba. Vacío, sí — pero el envase es de hace dos meses.',
  },
  isquemia: {
    afirmacion: '«Del corazón estoy sano. Me miraron hace años y me dijeron que era fuerte como un toro.»',
    correcta: 'dudar',
    revelacion:
      '«...bueno, mencionaron algo de una arritmia y que volviera para unas pastillas. No volví, ¿para qué? Si estaba bien.» FA sin anticoagular. Ahí está tu émbolo.',
    cerrojo: 'Se cierra: «Sanísimo, le digo.» El electrocardiograma tendrá que hablar por él.',
  },
  trauma: {
    afirmacion: '«Fue una caidita de nada, ni siquiera iba rápido. Ni me hace falta estar aquí.»',
    correcta: 'mentira',
    pruebaClave: 'ecofast',
    revelacion:
      'Le muestras el líquido libre en la pantalla y traga saliva: «...iba a ochenta. Y la moto no era mía. No se lo diga a mi padre.»',
    cerrojo: '«Que estoy bien, pesado.» Firma que quiere irse. Te toca retenerle con diplomacia y sin papeles.',
  },
  ulcus: {
    afirmacion: '«¿Pastillas? Yo no tomo nada de nada. Ni un paracetamol.»',
    correcta: 'mentira',
    pruebaClave: 'tc',
    revelacion:
      'Con el neumoperitoneo en la pantalla, confiesa: «...el ibuprofeno no cuenta, ¿no? Me tomo dos al día para la espalda. Desde hace meses. Sin desayunar.»',
    cerrojo: '«Nada de nada, ya se lo he dicho.» Su úlcera opina distinto, pero necesitarás la imagen para demostrarlo.',
  },
  hernia: {
    afirmacion: '«El bulto me entra solo desde hace años. Hoy no sé qué le pasa, no quiere.»',
    correcta: 'creer',
    revelacion:
      'Es exactamente la historia de una hernia de años que hoy se ha incarcerado. El que describe bien su bulto, rara vez miente sobre él.',
    cerrojo: '«¿No me cree? Pues mire usted el bulto.» Tenía razón, y ahora te lo recordará toda la noche.',
  },
  pancreatitis: {
    afirmacion: '«¿Alcohol? Una copita de vino en las comidas, como recomiendan los médicos.»',
    correcta: 'dudar',
    revelacion:
      '«...fue mi cumpleaños este finde. Empezamos el viernes y... técnicamente seguimos el domingo.» La lipasa ya lo veía venir.',
    cerrojo: '«Una copita, he dicho.» Su acompañante mira al techo con mucho interés.',
  },
  gastroenteritis: {
    afirmacion: '«Hemos comido todos lo mismo en el bautizo y estamos todos igual, por el grupo se lo digo.»',
    correcta: 'creer',
    revelacion:
      'Te enseña el chat familiar: catorce mensajes, tres audios y una encuesta («¿quién más está vomitando?»: 9 votos). Epidemiología de primera mano.',
    cerrojo: 'Guarda el móvil, dolido: «Encima de malos, mentirosos.» El chat familiar era tu mejor prueba y ya no lo verás.',
  },
  colico_renal: {
    afirmacion: '«Es igualito al de mi piedra de hace dos años. Mismo sitio, mismo retortijón, mismo todo.»',
    correcta: 'creer',
    revelacion: 'Se retuerce mientras lo cuenta, sin defensa en la tripa. La memoria del cólico renal no se olvida ni se inventa.',
    cerrojo: '«¿Que no? Mire, hasta le digo por dónde va a bajar la piedra.» Acertó él. Tú no.',
  },
};
