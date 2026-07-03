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

Partida reproducible y selección de modo desde la línea de comandos:

```bash
npm run build
node dist/index.js --seed 42            # misma guardia, mismos pacientes
node dist/index.js --residente          # modo residente (adjunto de apoyo)
node dist/index.js --adjunto            # modo adjunto (sin red de seguridad)
```

## 🧑‍⚕️ Modos de juego

- **Adjunto** — sin ayudas y con la puntuación completa.
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
    ├── WebIO.ts              # Adaptador IO navegador (DOM + ANSI→HTML)
    ├── main.ts               # Bootstrap web (?seed, ?modo)
    └── template.html         # Plantilla del index.html autocontenido
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
