# 🏥 Surgeon's Night: El Turno de Guardia

> *Llueve sobre la ciudad y el busca acaba de sonar. Los pacientes mienten —
> por miedo, por vergüenza o por sus nietos. Tu trabajo es notarlo.*

Un **noir de hospital**: detective procedural de los 40 donde el crimen es
la patología, el interrogatorio es la anamnesis y el veredicto se firma con
bisturí.

## 🎮 Hecho con Phaser

El plano de urgencias no son divs: es una **escena de Phaser** (el motor 2D
con el que se publican juegos en web y en Steam). El cirujano es un sprite
con **físicas arcade** que recorre el servicio con WASD/flechas/ZQSD, cruceta
táctil o clic-para-caminar, y *pisar* una zona dispara esa acción. Todas las
texturas se dibujan proceduralmente en tiempo de ejecución
(`Graphics → generateTexture`): cero ficheros de imagen, todo en un único
`web/index.html` autocontenido. El motor clínico sigue siendo puro TypeScript
sin dependencias (arquitectura de puertos y adaptadores): Phaser es solo el
adaptador visual, y la versión de terminal ni se entera de que existe.

> **Página de venta**: en `web/store.html` hay una store page estilo Steam
> (héroe noir con ECG en vivo, galería de gameplay real y ficha técnica) para
> presentar el juego a jugadores y prensa.

## 🌍 Idiomas

La interfaz está disponible en **español, inglés, francés, catalán y
alemán** (menú al arrancar, o `?lang=en` en la URL). El contenido clínico
narrativo (anamnesis, interrogatorios, pasos quirúrgicos, perlas) es un pack
de contenido aparte — en v1 existe en español, y la estructura de datos
admite packs por idioma sin tocar el motor.

## 🤝 Cooperativo local: «pásame el bisturí»

Al arrancar eliges guardia **en solitario o a dúo** (misma pantalla). En
cooperativo, cada cirujano tiene su **energía y estrés propios** (el HUD
muestra las dos barras), **cada caso tiene su responsable** — al atender a
un paciente nuevo decidís quién lo lleva, y su cirugía la opera esa persona
con SU fatiga — y el parte de las 08:00 desglosa expedientes y media de
estrellas por cirujano. El café de mañana lo paga quien pierda.

## 🧑‍⚕️ Editor de personaje

Ficha rápida o a medida: nombre libre y aspecto (tono de piel, peinado,
color de pelo, gafas, vello facial) con **vista previa del retrato en
vivo**. En dúo, cada cirujano crea el suyo.

## 🗣 Pacientes que se quejan de verdad

Al atender a cada paciente: retrato con expresión de dolor, **bocadillo con
su queja hablada** («Me atraviesa hasta la espalda... como un cinturón»),
**la mano del paciente señalando el punto exacto del dolor** en el mapa
corporal (animada, palpándose), gotas de sudor si está sufriendo y un
quejido sonoro sintetizado. La anamnesis entra por los ojos y los oídos.

## 🏥 Niveles de hospital y derivaciones

Al empezar eliges dónde te toca la noche:

- **Comarcal (nivel 1)** — 1 quirófano, 1 REA, sin angio-TC nocturno y menos
  pacientes. Lo vascular grave, el TCE y el código infarto **se derivan**: la
  ambulancia medicalizada es una decisión clínica más, y derivar con criterio
  puntúa (y derivar lo que podías asumir, te lo recuerda el adjunto receptor).
- **General (nivel 2)** — el clásico: 2 quirófanos, 3 REA; sin neurocirugía
  ni hemodinámica (TCE e IAM viajan).
- **Referencia (nivel 3)** — 3 quirófanos, 4 REA y de todo... y dos
  pacientes más por noche. Aquí derivar es escurrir el bulto.

## 🎖 Roguelite: la taquilla del cirujano

Cada guardia da XP (la puntuación positiva de la noche) y esa XP alimenta la
siguiente. Al fichar se abre **la TAQUILLA**: una pantalla propia con las
cinco mejoras y su estado —desbloqueada o *faltan N XP*—, tu rango actual y
el siguiente. En la web es un panel de tarjetas; en la terminal, una lista.

- *Termo del bueno* (300 XP) — el café recupera el triple de energía.
- *Ojo clínico* (800) — todas las pruebas tardan 5 min menos.
- *El número del adjunto* (1.500) — una llamada de ayuda en quirófano, en cualquier modo.
- *Equipo compenetrado* (2.500) — menos imprevistos intraoperatorios.
- *Templanza* (4.000) — empiezas cada guardia sin una gota de estrés.

Las mejoras se aplican **en todos los modos**. El expediente de la portada
lleva una **barra de progreso al siguiente rango** (de *R1 con vocación* a
*Leyenda de la guardia*), y al cerrar la guardia se celebra la **XP ganada,
los ascensos y cada mejora recién desbloqueada**. Salir derrotado también
suma: vuelves con algo nuevo.

## 🚑 Paciente traumático y patología médica

Además del abdomen: **neumotórax a tensión** (se drena en urgencias, sin
esperar a la imagen), **TCE con hematoma epidural** (intervalo lúcido,
Cushing y una ambulancia que no puede esperar), **IAM de cara inferior**
disfrazado de "dolor de estómago" (el **ECG** — prueba nueva de 10 minutos —
te salva de un TC inútil) y **cetoacidosis diabética** que imita un abdomen
agudo que jamás debe operarse. El quirófano suma además un **monitor de
constantes en vivo** en el esquema anatómico (FC/TA/SatO₂ del paciente,
paso a paso) y el instrumental entrando al campo.

## 🚶 El plano de urgencias: muñequitos que caminan

La fase de sala ya no es una lista: es un **servicio que se recorre**. Un
plano con los boxes, el control de enfermería, la puerta de planta y el
rincón del café — y tu cirujano es un **muñequito con pijama y gorro que
camina de verdad** hasta donde cliques, con pasos sonoros, balanceo y
zancada animada. Los pacientes yacen en sus camillas **retorciéndose**
(los críticos, más rápido y con halo rojo), con su monitor de estabilidad
encima de la cama. Ir en persona al box **cuesta 5 minutos de guardia**:
los pasillos también corren en el reloj. Los botones clásicos siguen debajo
del plano, y la terminal conserva sus menús.

Y el plano se juega **en modo arcade**: mueve al muñequito con **WASD,
las flechas o ZQSD** (o la **cruceta táctil** en móvil) y *pisa* la zona
que quieras activar — entrar al box de un paciente, plantarte en el café
o tirarte al sofá. Cuando llega un caso nuevo, **el celador sale de la
ambulancia empujando la camilla** hasta su box, que destella al recibirla;
otro celador patrulla los pasillos a lo suyo. Dentro del quirófano, la
decisión también se camina: un **plano de la mesa quirúrgica** —paciente
entallado, torre de anestesia con su traza latiendo— rodeado de **bandejas
de instrumental**: ve andando hasta la bandeja de la técnica que quieras
(o clícala) para ejecutarla.

## 🚨 El teléfono rojo: incidente de múltiples víctimas

Algunas noches (y en guardia negra, todas), el 061 llama de verdad:
**atropello múltiple a la salida de un concierto**, ambulancias en cascada
y tú en la puerta con la tarjeta de etiquetas en la mano. A cada víctima,
con sus constantes y una mirada, le cuelgas la suya: **ROJO** inmediato,
**AMARILLO** diferido, **VERDE** herido que camina, **NEGRO** expectante.
Infratriar le cuesta terreno a la víctima; sobretriar quema recursos que
otro necesitaba. Y la etiqueta negra bien puesta es medicina — mal puesta,
una sentencia que te persigue el resto de la guardia. El parte final
recoge tu triaje de catástrofe, etiqueta a etiqueta.

En la web, la puerta de ambulancias se ve: una **escena de Phaser** con las
víctimas alineadas en sus camillas y una tarjeta de etiqueta colgando sobre
cada una. Según decides, la tarjeta se **colorea** (rojo/amarillo/verde/negro)
y la víctima entra rodando al servicio; la que estás valorando parpadea.

## 😤 La sala de espera existe, y se cansa

Los pacientes no esperan en el limbo: esperan en sillas. A partir de las
dos horas, los leves empiezan a **marcharse sin ser vistos** — y admisión
lo apunta todo para la encuesta de satisfacción. Si el que se fue llevaba
dentro un abdomen quirúrgico, **volverá en ambulancia y volverá peor**.
Cuando la sala se calienta, la **supervisora de control** te lo hace saber
desde el mostrador, con ese tono que solo tienen las supervisoras de
urgencias a las cuatro de la mañana.

## 🕵️ El interrogatorio clínico

Cada paciente **declara algo** al llegar («¿Alcohol? Una copita en las
comidas»). Tú eliges: **Creerle**, **Dudar** o **Acusarle de mentir** — y
una acusación solo se sostiene si llevas encima la prueba que lo desmonta
(enséñale la vesícula en la eco y verás caer lo de los torreznos). Acertar
te da la historia real y acelera la siguiente prueba; fallar cierra al
paciente en banda y te cuesta tiempo y estrés. Ojo: algunos dicen la verdad,
y dudar de todos también es una forma de fallar.

Al cerrar cada caso, el expediente recibe su **calificación de 1 a 5
estrellas**: operar sin diagnóstico, pedir pruebas a voleo, tropezar en el
interrogatorio, complicarte en quirófano o mandar a casa a quien no debías
bajan la nota. El parte de las 08:00 lista todos los expedientes con sus
estrellas.

Juego de texto para terminal que simula **24 horas de guardia de un cirujano
general** en un hospital público. Triaje en urgencias, decisiones clínicas,
cirugías por pasos con complicaciones, y la gestión de tu propia fatiga.

Sin dependencias de runtime: solo necesitas **Node.js ≥ 18**. Y el mismo
motor corre también en el **navegador** (`web/index.html`, un único archivo
autocontenido, también táctil/móvil).

## 🚀 Jugar

En terminal:

```bash
npm install     # solo devDependencies (TypeScript + esbuild)
npm run dev     # compila y arranca la guardia
```

En navegador: abre `web/index.html` directamente (es autocontenido). Admite
`?seed=42` y `?modo=residente` / `?modo=adjunto` en la URL. Para regenerarlo
tras tocar el código: `npm run build:web`.

La versión web está **ilustrada, animada y sonorizada** (todo SVG inline +
CSS + Web Audio API: ni bitmaps, ni ficheros de audio, ni red): monitor ECG
en la cabecera (se acelera y enrojece en quirófano), portada con el hospital
de noche, **retrato procedural de cada paciente** (cara única y reproducible
por semilla: piel, peinado, canas, gafas, expresión de dolor y sudor según su
estabilidad), **mapa corporal con el foco de dolor pulsando**, ambulancia que
cruza la pantalla con cada llegada, banner de «intervención en curso»,
destello rojo en los éxitus y amanecer al terminar la guardia. El motor solo
emite eventos semánticos (`io.escena(...)`); la terminal los ignora y la web
los pinta.

**Estética noir**: grano de película 35 mm, viñeteado, paleta humo-y-whisky,
tipografía de máquina de escribir con titulares serif, ilustraciones viradas
a sepia y retratos en blanco y negro tipo ficha policial.

**Sonido** (sintetizado con osciladores, silenciable con el botón 🔊 y
recordado entre partidas): **lluvia noir de fondo**, click de interfaz,
pitido de monitor cardiaco durante la cirugía, sirena de ambulancia en las
llegadas, campanilla en los aciertos y tono de asistolia en los éxitus.

**Quirófano visual e interactivo**: cada evento intraoperatorio pinta un
**campo quirúrgico animado** (el sangrado crece y late, la bilis gotea, el
asa isquémica se amorata, el monitor de anestesia entra en alarma…) y las
técnicas se eligen en **tarjetas con el icono del instrumental** — clipadora,
tijeras, gasa, endograpadora, catéter de Fogarty, suero caliente… — para
decidir también visualmente. Los iconos son neutros: ilustran la técnica sin
delatar la opción correcta.

**Rail de comandas**: como en un Overcooked de guardia, una banda fija
muestra a todos los pacientes pendientes (urgencias y planta) con su barra
de estabilidad menguando por colores; los críticos laten en rojo. La presión
de la cola se ve de un vistazo… también mientras estás operando.

**Complicaciones imprevistas** (procedurales): además de los eventos propios
de cada cirugía, un pool de imprevistos —sangrado en sábana por coagulopatía,
óptica empañada, aviso de anestesia, lesión inadvertida al retraer, fallo de
la endograpadora— puede colarse en cualquier intervención. La probabilidad
sube con la variante atípica, el paciente inestable, tu fatiga y la guardia
negra.

Partida reproducible y selección de modo desde la línea de comandos:

```bash
npm run build
node dist/index.js --seed 42            # misma guardia, mismos pacientes
node dist/index.js --residente          # modo residente (adjunto de apoyo)
node dist/index.js --adjunto            # modo adjunto (sin red de seguridad)
```

## ⏱ Ritmo de juego (solo web)

Al arrancar eliges cómo vivir la guardia (o con `?ritmo=` en la URL):

- **Por turnos** — clásico: el tiempo solo corre cuando actúas.
- **Tiempo real** (`?ritmo=real`) — arcade estilo *Overcooked*: **1 segundo
  = 1 minuto de guardia**. El reloj vivo de la cabecera avanza solo (y se
  pone rojo en las últimas 2 horas), los pacientes se deterioran mientras
  dudas, las ambulancias llegan sin esperarte, el rail de comandas se
  actualiza cada segundo y los menús se refrescan solos cuando pasa algo.
  Ocultar la pestaña pausa el reloj. La terminal siempre juega por turnos.

## 🧑‍⚕️ Modos de juego

- **Adjunto** — sin ayudas y con la puntuación completa.
- **Guardia negra** (`--negra`) — la noche que se cuenta en los cambios de
  turno: presentaciones atípicas al doble, dos pacientes más, una cama de
  REA menos, el quirófano más disputado y más complicaciones imprevistas.
  Puntuación ×1,2.
- **Noche de fiestas mayores** (`--festival`) — evento de catástrofe:
  verbena, alcohol y peleas a la salida del escenario. Aluvión de urgencias
  (cuatro pacientes extra) y un **incidente de múltiples víctimas
  garantizado y más grande** (7-9 víctimas). Comparte el motor duro de la
  guardia negra y recompensa el riesgo: puntuación ×1,35.
- **Residente** — sales de guardia con un adjunto localizable:
  - En cada ficha te sugiere por teléfono la **prueba diana** del cuadro.
  - Si con el diagnóstico confirmado eliges un destino que contradice el
    manejo estándar, **arquea una ceja** y te deja reconsiderar (una vez
    por paciente).
  - En quirófano puedes **llamarle hasta 3 veces por guardia** para que te
    señale la técnica correcta del paso.
  - A cambio, la puntuación final se ajusta al 85% (guardia tutelada).

## 🎮 Cómo se juega

- Son las **08:00** y tienes 24 h por delante, **2 quirófanos** y **3 camas de REA**.
- Llegan pacientes con dolor abdominal. Para cada uno decides: **explorar**,
  **pedir pruebas** (analítica, eco, TC, angio-TC, eco-FAST), **dar el alta**,
  **ingresar para tratamiento conservador** o **cirugía urgente**.
- Cada prueba y cada cirugía **cuestan tiempo**, y los pacientes quirúrgicos
  no tratados **se deterioran** (algunos, como la isquemia mesentérica, muy rápido).
- La **prueba diana** de cada patología confirma el diagnóstico; entrar a
  quirófano sin confirmación se penaliza… pero esperar al TC con un
  politraumatizado hipotenso también.
- En quirófano, la cirugía avanza **por pasos con eventos**: sangrado de la
  arteria cística, adherencias firmes, inestabilidad hemodinámica… Elige la
  técnica correcta.
- Vigila tu **energía** y tu **estrés**: con fatiga alta, incluso las
  decisiones correctas tienen una probabilidad *oculta* de torcerse.
- No todo se opera: hay **distractores no quirúrgicos** donde el alta es la
  decisión correcta. Y si das el alta a quien no debías, volverá en ambulancia.
- A las 08:00 del día siguiente, el **parte de guardia**: puntuación y
  veredicto del Jefe de Servicio.

## 🩺 Patologías incluidas

| Patología | Prueba diana | Manejo correcto |
|---|---|---|
| Apendicitis aguda | TC | Apendicectomía laparoscópica |
| Colecistitis aguda litiásica | Ecografía | Colecistectomía laparoscópica |
| Obstrucción intestinal (brida estrangulada) | TC | Laparotomía + adhesiolisis |
| Diverticulitis perforada (Hinchey IV) | TC | Laparotomía urgente (Hartmann) |
| Isquemia mesentérica aguda | Angio-TC | Revascularización + resección |
| Trauma abdominal cerrado (inestable) | Eco-FAST | Laparotomía exploradora |
| Ulcus péptico perforado | TC | Sutura + epiploplastia de Graham |
| Hernia inguinal estrangulada | Ecografía | Herniorrafia urgente (sin malla) |
| Pancreatitis aguda litiásica *(¡no se opera!)* | Analítica | Ingreso conservador |
| Gastroenteritis aguda *(distractor)* | Analítica | Alta |
| Cólico biliar simple *(distractor)* | Ecografía | Alta |
| Cólico renoureteral *(distractor)* | TC | Alta |

Cada caso termina con una **perla docente** basada en el manejo estándar.

**¿Cómo de procedurales son los casos?** El contenido clínico base (pruebas
diana, planes quirúrgicos, perlas) está curado a mano; TODO lo demás se
ensambla proceduralmente y de forma determinista por semilla: patología por
sorteo ponderado, nombre, edad, estabilidad, hora de llegada, **constantes
vitales por rangos clínicos** (con alertas de hipotensión/taquicardia),
**horas de evolución insertadas en la anamnesis** y, sobre todo, la
**variante de presentación**.

### 😈 Variantes difíciles

Cada patología tiene su presentación típica y una o dos **variantes
atípicas** (~25% de los casos; la mitad en modo residente) que quitan pistas,
mueven el dolor de sitio o aceleran el deterioro:

- Apendicitis **retrocecal** que duele en la fosa lumbar y simula un cólico
  renal, y apendicitis **larvada del anciano** sin fiebre ni Blumberg.
- Colecistitis del anciano que debuta como **delirium** desde la residencia.
- Obstrucción **sin cicatrices previas** (hernia interna): te quita la
  explicación fácil de las bridas.
- Diverticulitis disfrazada de **infección urinaria**.
- Isquemia mesentérica **sin fibrilación auricular** (trombosis en
  arteriópata): desaparece la pista clásica.
- Trauma esplénico **"respondedor transitorio"**: llega estable y se
  desploma (deterioro ×1,5).
- Ulcus **enmascarado por corticoides**, hernia **oculta en la obesidad**,
  pancreatitis **grave** con fallo renal incipiente…
- Y distractores-trampa: gastroenteritis **pseudoapendicular** y litiasis
  ureteral baja que **duele en la FID** — no toda fosa ilíaca derecha se opera.

Algunas variantes hacen además que la **prueba diana salga "no concluyente"
al primer intento** (eco limitada por obesidad, FAST dudosa con vejiga
vacía…): queda una nota en la ficha y puedes repetir la prueba —gastando más
tiempo— o mojarte por la clínica. El mapa corporal de la web sigue a la
variante (la retrocecal pulsa en la zona lumbar), y el parte final etiqueta
las presentaciones atípicas que te tocaron.

## 🏗 Arquitectura

```
src/
├── index.ts                  # Entrada CLI (--seed, --residente, --adjunto)
├── core/
│   ├── types.ts              # Tipos de dominio (Paciente, Patología, …)
│   ├── io.ts                 # Puerto IO (ports & adapters): escribir/elegir/pausa
│   ├── GameContext.ts        # Estado compartido + avanzarTiempo() (reloj,
│   │                         #   deterioro, llegadas, fatiga, recursos)
│   ├── StateMachine.ts       # State pattern: GameState + MaquinaEstados
│   └── ShiftEngine.ts        # Composición y arranque de la guardia
├── data/
│   ├── pathologies.ts        # Base de datos clínica (casos + planes quirúrgicos)
│   └── pruebas.ts            # Catálogo de pruebas diagnósticas
├── factories/
│   └── PatientFactory.ts     # Factory: casos aleatorios ponderados + llegadas
├── engine/
│   ├── TriageState.ts        # Fase de urgencias/triaje
│   ├── SurgeryState.ts       # Minijuego quirúrgico por pasos
│   └── SummaryState.ts       # Parte de guardia y puntuación
├── ui/
│   ├── ansi.ts               # Colores ANSI sin dependencias (agnóstico de entorno)
│   ├── ConsoleIO.ts          # Adaptador IO terminal (readline nativo)
│   └── hud.ts                # HUD, barras de estado, reloj de guardia
└── web/
    ├── WebIO.ts              # Adaptador IO navegador (DOM + ANSI→HTML + escenas)
    ├── arte.ts               # Ilustraciones SVG (portada, mapa de dolor, quirófano…)
    ├── retrato.ts            # Retratos procedurales de pacientes (SVG paramétrico)
    ├── sonido.ts             # Sonido sintetizado con Web Audio API (sin ficheros)
    ├── main.ts               # Bootstrap web (?seed, ?modo)
    └── template.html         # Plantilla del index.html autocontenido (CSS + animaciones)
scripts/build-web.mjs         # esbuild → web/index.html (un solo archivo)
web/index.html                # Versión jugable en navegador (generada)
```

Decisiones de diseño:

- **Ports & adapters**: el motor solo conoce la interfaz `IO`
  (`core/io.ts`); `ConsoleIO` (readline) y `WebIO` (DOM con botones táctiles)
  son adaptadores intercambiables. Los textos llevan códigos ANSI que la
  terminal muestra tal cual y el navegador convierte a `<span>` con CSS.
  Portar a otra plataforma = escribir otro adaptador.
- **State pattern**: cada fase (`TriageState`, `SurgeryState`, `SummaryState`)
  implementa `GameState.run(ctx)` y devuelve el siguiente estado; la
  `MaquinaEstados` solo itera. Añadir una fase nueva no toca las existentes.
- **Factory pattern**: `PatientFactory` genera casos con selección ponderada
  por frecuencia y el calendario de llegadas de toda la guardia.
- **Reloj centralizado**: todo paso de tiempo pasa por
  `GameContext.avanzarTiempo()`, que aplica en un único lugar el deterioro de
  pacientes, la fatiga del cirujano, las llegadas, los éxitus y la liberación
  de camas/quirófanos. Los estados nunca mutan el reloj directamente.
- **Datos separados de la lógica**: añadir una patología nueva es añadir un
  objeto a `data/pathologies.ts`; el motor no cambia.
- **RNG determinista** (mulberry32) inyectado por constructor: partidas
  reproducibles con `--seed`, y motor testeable.

## 🫀 Simulación quirúrgica paso a paso

Cada cirugía se sigue sobre un **esquema anatómico** estilizado (apto +12,
sin gore: diagramas flat con etiquetas — hígado, a. cística, colédoco, AMS,
hilio esplénico…). Un anillo dorado señala dónde se trabaja en la etapa
actual, las etapas completadas quedan marcadas con su check, la barra de
progreso avanza etapa a etapa y las complicaciones se dibujan sobre el
esquema en su sitio anatómico: el sangrado de la cística sangra *en* la
cística. Los imprevistos aparecen sellados como ⚠ IMPREVISTO sin avanzar
la etapa. Ocho intervenciones con su diagrama propio.

## 🎖 El expediente del cirujano (progresión)

La web guarda tu carrera entre guardias: número de guardias, mejor
puntuación, XP acumulada y rango — de *R1 con vocación* a *Leyenda de la
guardia*. Aparece al fichar, como todo expediente que se respete.

## 🤝 Cooperativo (diseño planteado)

El modo a dos cirujanos está diseñado y pendiente de implementación:

1. **Local, "pásame el bisturí"** (misma pantalla): dos perfiles se reparten
   los pacientes; uno lleva urgencias mientras el otro opera, y el parte
   final desglosa expedientes y estrellas por cirujano. No necesita servidor:
   entra en la arquitectura actual como un estado más y un campo `cirujano`
   en el paciente.
2. **Online** (el Overcooked real): un jugador en triaje decidiendo destinos
   y otro en quirófano resolviendo pasos, compartiendo recursos y reloj en
   tiempo real. Requiere servidor (WebSocket) y el motor ya lo permite: todo
   el estado vive en `GameContext` y toda la E/S pasa por el puerto `IO`,
   así que un adaptador de red es el mismo patrón que `WebIO`.

## 📦 Plataformas y portabilidad

Hoy el juego corre en **terminal** (Windows/macOS/Linux con Node ≥ 18) y en
**navegador** (`web/index.html`, incluida pantalla táctil/móvil), ambos sobre
el mismo motor gracias al puerto `IO`:

- **Steam**: empaquetar la versión web con Electron o Tauri (Steam admite
  juegos narrativos/de texto, pero exige un ejecutable de escritorio con su
  propia ventana, no una CLI) y añadir Steamworks (logros, nube).
- **Android / iOS**: envolver la versión web con Capacitor (WebView) o
  escribir un adaptador `IO` en React Native; la lógica se reutiliza tal cual.

## ⚠️ Descargo

Es un juego. Las situaciones clínicas están simplificadas con fines lúdicos y
docentes; nada de esto es una guía real de práctica clínica.
