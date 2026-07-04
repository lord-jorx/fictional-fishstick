# 🏥 Surgeon's Night: El Turno de Guardia

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

**Sonido** (sintetizado con osciladores, silenciable con el botón 🔊 y
recordado entre partidas): click de interfaz, pitido de monitor cardiaco
durante la cirugía, sirena de ambulancia en las llegadas, campanilla en los
aciertos y tono de asistolia en los éxitus.

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
