/**
 * Personajes y camillas del mundo 3D, construidos con primitivas (cápsulas,
 * esferas, cajas redondeadas): estilo "figura de diseño" — cabezas grandes,
 * materiales mates, cero ficheros de modelo.
 */
import * as THREE from 'three';
import { BancoEcg, caja, cilindro, COL, esfera, hash01, lerpAngulo, luz, mat, matUnico } from './util.js';

export interface OpcionesPersonaje {
  ropa: number;
  ropaOscura?: number;
  piel: number;
  pelo?: number;
  gorro?: number | null;
  mascarilla?: boolean;
  fonendo?: boolean;
  sentado?: boolean;
  escala?: number;
}

export interface Personaje {
  grupo: THREE.Group;
  /** Anima: `velocidad` en m/s (0 = parado, respira). */
  actualizar(dt: number, velocidad: number): void;
  /** Gira suavemente hacia un ángulo (radianes, 0 = mira a +z). */
  girar(angulo: number, dt: number): void;
  /** Cambia el color de la ropa (el cirujano activo del modo cooperativo). */
  pintarRopa(color: number): void;
  /** Gesto de operar: los brazos trabajan delante del cuerpo. */
  operando: boolean;
}

export const PIELES = [0xf1c9a5, 0xdcae86, 0xc08d66, 0x9b6a48, 0x6f4a33];
export const PELOS = [0x16120f, 0x3a271a, 0x6a4a2c, 0x9a6b3a, 0xb7b2a8];

/** Un adulto estilizado: ~1,8 m, cabeza grande y gesto amable. */
export function crearPersonaje(o: OpcionesPersonaje): Personaje {
  const grupo = new THREE.Group();
  const armazon = new THREE.Group();
  grupo.add(armazon);

  const ropa = matUnico(o.ropa, { rough: 0.85 });
  const ropaOsc = mat(o.ropaOscura ?? 0x2b3a52, { rough: 0.85 });
  const piel = mat(o.piel, { rough: 0.55 });

  // Piernas (pivote en la cadera) y zapatos
  const hipY = 0.8;
  const piernas: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const pivote = new THREE.Group();
    pivote.position.set(sx * 0.11, hipY, 0);
    const pierna = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.46, 6, 12), ropaOsc);
    pierna.position.y = -0.33;
    pierna.castShadow = true;
    const zapato = caja(0.17, 0.11, 0.31, mat(0xf4f7fb, { rough: 0.5 }), 0.05);
    zapato.position.set(0, -0.72, 0.05);
    pivote.add(pierna, zapato);
    armazon.add(pivote);
    piernas.push(pivote);
  }

  // Tronco
  const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.36, 8, 16), ropa);
  tronco.position.y = hipY + 0.36;
  tronco.scale.set(1.1, 1, 0.78);
  tronco.castShadow = true;
  armazon.add(tronco);
  const ropaPintable = ropa;

  // Brazos (pivote en el hombro)
  const brazos: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const pivote = new THREE.Group();
    pivote.position.set(sx * 0.32, hipY + 0.62, 0);
    const brazo = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.38, 6, 12), ropa);
    brazo.position.y = -0.27;
    brazo.castShadow = true;
    const mano = esfera(0.075, piel, 12);
    mano.position.y = -0.56;
    pivote.add(brazo, mano);
    armazon.add(pivote);
    brazos.push(pivote);
  }

  // Cabeza
  const cabeza = new THREE.Group();
  cabeza.position.y = hipY + 1.0;
  const craneo = esfera(0.225, piel, 24);
  cabeza.add(craneo);
  for (const sx of [-1, 1]) {
    const ojo = esfera(0.03, mat(0x10161f, { rough: 0.3 }), 10);
    ojo.position.set(sx * 0.082, 0.02, 0.198);
    ojo.castShadow = false;
    cabeza.add(ojo);
    const ceja = caja(0.07, 0.014, 0.02, mat(o.pelo ?? 0x2a1d14), 0.006);
    ceja.position.set(sx * 0.082, 0.085, 0.205);
    ceja.castShadow = false;
    cabeza.add(ceja);
  }
  if (o.pelo !== undefined && o.gorro == null) {
    const pelo = new THREE.Mesh(
      new THREE.SphereGeometry(0.238, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
      mat(o.pelo, { rough: 0.9 }),
    );
    pelo.position.y = 0.015;
    pelo.rotation.x = -0.18;
    pelo.castShadow = true;
    cabeza.add(pelo);
  }
  if (o.gorro != null) {
    const gorro = new THREE.Mesh(
      new THREE.SphereGeometry(0.238, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      mat(o.gorro, { rough: 0.85 }),
    );
    gorro.position.y = 0.02;
    gorro.rotation.x = -0.12;
    gorro.castShadow = true;
    cabeza.add(gorro);
  }
  if (o.mascarilla) {
    const m = caja(0.27, 0.12, 0.13, mat(0xcfe6f3, { rough: 0.9 }), 0.05);
    m.position.set(0, -0.085, 0.145);
    m.castShadow = false;
    cabeza.add(m);
  }
  armazon.add(cabeza);

  // Fonendo + acreditación: los detalles que lo hacen médico
  if (o.fonendo) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 24), mat(0x1c2230, { rough: 0.5 }));
    aro.position.set(0, hipY + 0.76, 0.02);
    aro.rotation.x = Math.PI / 2.2;
    armazon.add(aro);
    const campana = cilindro(0.04, 0.04, 0.02, mat(COL.acero, { metal: 0.8, rough: 0.3 }), 16);
    campana.rotation.x = Math.PI / 2;
    campana.position.set(0.1, hipY + 0.52, 0.17);
    armazon.add(campana);
    const tarjeta = caja(0.07, 0.1, 0.012, mat(0xeaf1fb), 0.008);
    tarjeta.position.set(-0.12, hipY + 0.5, 0.165);
    armazon.add(tarjeta);
  }

  if (o.sentado) {
    armazon.position.y = -0.36;
    for (const p of piernas) p.rotation.x = -Math.PI / 2;
    for (const b of brazos) b.rotation.x = -0.5;
  }

  grupo.scale.setScalar(o.escala ?? 0.92);

  let fase = Math.random() * 6;
  let t = Math.random() * 10;
  const p: Personaje = {
    grupo,
    operando: false,
    actualizar(dt, velocidad) {
      t += dt;
      const anda = velocidad > 0.25 && !o.sentado;
      if (anda) fase += dt * (5 + velocidad * 0.9);
      const amp = anda ? Math.min(0.85, 0.35 + velocidad * 0.08) : 0;
      const a = Math.sin(fase) * amp;
      if (!o.sentado) {
        piernas[0]!.rotation.x = a;
        piernas[1]!.rotation.x = -a;
        if (p.operando) {
          brazos[0]!.rotation.x = -1.1 + Math.sin(t * 5) * 0.12;
          brazos[1]!.rotation.x = -1.1 + Math.cos(t * 4.3) * 0.12;
        } else {
          brazos[0]!.rotation.x = -a * 0.8;
          brazos[1]!.rotation.x = a * 0.8;
        }
        armazon.position.y = anda ? Math.abs(Math.sin(fase)) * 0.05 : 0;
      } else {
        brazos[0]!.rotation.x = -0.5 + Math.sin(t * 1.4) * 0.04;
      }
      tronco.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
      cabeza.rotation.z = Math.sin(t * 0.9) * 0.03;
    },
    girar(angulo, dt) {
      grupo.rotation.y = lerpAngulo(grupo.rotation.y, angulo, 1 - Math.exp(-dt * 12));
    },
    pintarRopa(color) {
      ropaPintable.color.setHex(color);
    },
  };
  return p;
}

/** Cirujano de quirófano/urgencias: pijama verde, gorro y fonendo. */
export function crearCirujano(ropa = 0x2fb58a, piel = PIELES[1]!, pelo = PELOS[1]!): Personaje {
  return crearPersonaje({ ropa, ropaOscura: 0x23856a, piel, pelo, gorro: null, fonendo: true });
}

/** Celador: pijama gris y gorra clara. */
export function crearCelador(): Personaje {
  return crearPersonaje({ ropa: 0x6f7f96, ropaOscura: 0x465368, piel: PIELES[2]!, pelo: PELOS[0]!, gorro: 0x4a596f });
}

/** Enfermera del control: uniforme blanco-azulado. */
export function crearEnfermera(): Personaje {
  return crearPersonaje({ ropa: 0xdff0fb, ropaOscura: 0x8aa7c4, piel: PIELES[0]!, pelo: PELOS[3]!, gorro: null, fonendo: true });
}

/** Paciente sentado en la sala de espera (aspecto por nombre). */
export function crearPacienteSentado(nombre: string): Personaje {
  const pi = PIELES[Math.floor(hash01(nombre, 1) * PIELES.length)]!;
  const pe = PELOS[Math.floor(hash01(nombre, 2) * PELOS.length)]!;
  const ropas = [0x7a8fb5, 0xb58f7a, 0x7ab58f, 0xb57a9a, 0x8a7ab5, 0xb5a97a];
  const ro = ropas[Math.floor(hash01(nombre, 3) * ropas.length)]!;
  return crearPersonaje({ ropa: ro, ropaOscura: 0x3a4a66, piel: pi, pelo: pe, gorro: null, sentado: true });
}

// ────────────────────────────────────────────────────────────────
// Camilla con paciente y monitor
// ────────────────────────────────────────────────────────────────

export interface Camilla {
  grupo: THREE.Group;
  /** Estabilidad 0-100: color del monitor, ritmo de respiración y alarma. */
  fijarEstabilidad(e: number): void;
  actualizar(t: number, dt: number): void;
  /** Destello del monitor en alarma (para llamar la atención). */
  alarma: boolean;
  /** Piezas que cuentan para el clic. */
  seleccionables: THREE.Object3D[];
  /** Cambia el color del halo de triaje (IMV). */
  fijarEtiqueta(tono: 'rojo' | 'amarillo' | 'verde' | 'negro' | null): void;
  /** Halo de "este es el que estás valorando". */
  fijarActiva(on: boolean): void;
}

const MANTAS = [0x3f8fb0, 0x5b7fd6, 0x3fa58b, 0x7d6bc4, 0xc2718a];
const COLOR_ETIQUETA = { rojo: 0xff3b4d, amarillo: 0xffc233, verde: 0x2fd27a, negro: 0x1a1a1f } as const;

export function crearCamilla(nombre: string, banco: BancoEcg, conMonitor = true): Camilla {
  const grupo = new THREE.Group();
  const acero = mat(COL.acero, { metal: 0.7, rough: 0.32 });
  const colchon = mat(0xdce9f7, { rough: 0.8 });
  const manta = matUnico(MANTAS[Math.floor(hash01(nombre, 7) * MANTAS.length)]!, { rough: 0.9 });

  // Bastidor, patas y ruedas
  const base = caja(0.92, 0.1, 2.12, acero, 0.04);
  base.position.y = 0.5;
  grupo.add(base);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pata = cilindro(0.035, 0.035, 0.36, acero, 10);
      pata.position.set(sx * 0.4, 0.3, sz * 0.92);
      grupo.add(pata);
      const rueda = cilindro(0.085, 0.085, 0.07, mat(0x1c2230, { rough: 0.6 }), 14);
      rueda.rotation.z = Math.PI / 2;
      rueda.position.set(sx * 0.4, 0.085, sz * 0.92);
      grupo.add(rueda);
    }
  }
  const colch = caja(0.88, 0.17, 2.04, colchon, 0.07);
  colch.position.y = 0.65;
  grupo.add(colch);

  // Barandillas
  for (const sx of [-1, 1]) {
    const bar = caja(0.04, 0.22, 1.1, acero, 0.015);
    bar.position.set(sx * 0.47, 0.88, 0.25);
    grupo.add(bar);
  }
  const cabecero = caja(0.92, 0.42, 0.06, mat(0xc6d6ea, { rough: 0.6 }), 0.03);
  cabecero.position.set(0, 0.86, -1.06);
  grupo.add(cabecero);

  // Paciente: almohada, cabeza, pelo, manta y brazo
  const pielN = PIELES[Math.floor(hash01(nombre, 1) * PIELES.length)]!;
  const peloN = PELOS[Math.floor(hash01(nombre, 2) * PELOS.length)]!;
  const cuerpo = new THREE.Group();
  const almohada = caja(0.62, 0.13, 0.42, mat(0xffffff, { rough: 0.95 }), 0.06);
  almohada.position.set(0, 0.79, -0.76);
  cuerpo.add(almohada);
  const cab = esfera(0.17, mat(pielN, { rough: 0.55 }), 18);
  cab.position.set(0, 0.92, -0.74);
  cuerpo.add(cab);
  const pelo = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mat(peloN, { rough: 0.9 }),
  );
  pelo.position.set(0, 0.935, -0.76);
  pelo.rotation.x = -0.5;
  cuerpo.add(pelo);
  for (const sx of [-1, 1]) {
    const ojo = esfera(0.022, mat(0x10161f), 8);
    ojo.position.set(sx * 0.06, 0.94, -0.6);
    ojo.castShadow = false;
    cuerpo.add(ojo);
  }
  const colchonManta = caja(0.84, 0.2, 1.3, manta, 0.09);
  colchonManta.position.set(0, 0.8, 0.12);
  cuerpo.add(colchonManta);
  const brazo = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.42, 6, 10), mat(pielN, { rough: 0.55 }));
  brazo.rotation.x = Math.PI / 2;
  brazo.position.set(0.47, 0.88, -0.18);
  cuerpo.add(brazo);
  grupo.add(cuerpo);

  // Suero: palo con bolsa
  const palo = cilindro(0.018, 0.018, 1.85, acero, 8);
  palo.position.set(-0.62, 0.93, -0.72);
  grupo.add(palo);
  const gancho = caja(0.3, 0.02, 0.02, acero, 0.008);
  gancho.position.set(-0.5, 1.84, -0.72);
  grupo.add(gancho);
  const bolsa = caja(0.11, 0.22, 0.05, matUnico(0xbfe9f7, { rough: 0.2 }), 0.03);
  (bolsa.material as THREE.MeshStandardMaterial).transparent = true;
  (bolsa.material as THREE.MeshStandardMaterial).opacity = 0.78;
  bolsa.position.set(-0.5, 1.68, -0.72);
  grupo.add(bolsa);

  // Monitor con ECG
  let pantallaMat: THREE.MeshBasicMaterial | null = null;
  let led: THREE.Mesh | null = null;
  let ledMat: THREE.MeshStandardMaterial | null = null;
  if (conMonitor) {
    const pie = cilindro(0.02, 0.02, 1.35, acero, 8);
    pie.position.set(0.72, 0.68, -1.12);
    grupo.add(pie);
    const soporte = cilindro(0.17, 0.2, 0.04, acero, 14);
    soporte.position.set(0.72, 0.02, -1.12);
    grupo.add(soporte);
    const carcasa = caja(0.58, 0.4, 0.08, mat(0x11192a, { rough: 0.4 }), 0.03);
    carcasa.position.set(0.72, 1.5, -1.12);
    carcasa.rotation.y = -0.35;
    grupo.add(carcasa);
    pantallaMat = new THREE.MeshBasicMaterial({ map: banco.texturas.verde, toneMapped: false });
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), pantallaMat);
    pantalla.position.set(0, 0, 0.045);
    carcasa.add(pantalla);
    ledMat = luz(COL.verde, 3);
    led = esfera(0.022, ledMat, 8);
    led.position.set(0.22, 0.17, 0.048);
    led.castShadow = false;
    carcasa.add(led);
  }

  // Halo para triaje / selección
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.3, 1.45, 48),
    new THREE.MeshBasicMaterial({ color: COL.cian, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.03;
  halo.scale.set(0.85, 1.3, 1);
  grupo.add(halo);

  // Tarjeta de triaje sobre un poste (solo visible en IMV)
  const posteTag = new THREE.Group();
  const mastil = cilindro(0.02, 0.02, 1.2, mat(0x2a3650), 8);
  mastil.position.y = 0.6;
  const tarjeta = caja(0.56, 0.36, 0.05, matUnico(0x2a3650, { rough: 0.5 }), 0.03);
  tarjeta.position.y = 1.35;
  posteTag.add(mastil, tarjeta);
  posteTag.position.set(0, 1.0, 1.25);
  posteTag.visible = false;
  grupo.add(posteTag);
  const tarjetaMat = tarjeta.material as THREE.MeshStandardMaterial;

  let estab = 80;
  let respira = 0;
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.8, 2.6),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitbox.position.y = 0.9;
  grupo.add(hitbox);

  const camilla: Camilla = {
    grupo,
    alarma: false,
    seleccionables: [hitbox, base, colch, colchonManta, cab],
    fijarEstabilidad(e) {
      estab = e;
      const tono = BancoEcg.tono(e);
      if (pantallaMat) pantallaMat.map = banco.texturas[tono];
      if (ledMat) {
        const c = tono === 'verde' ? COL.verde : tono === 'ambar' ? COL.ambar : COL.rojo;
        ledMat.color.setHex(c);
        ledMat.emissive.setHex(c);
      }
      camilla.alarma = e < 35;
    },
    actualizar(t, dt) {
      const ritmo = estab >= 60 ? 1.6 : estab >= 35 ? 2.6 : 4.2;
      respira += dt * ritmo;
      colchonManta.scale.y = 1 + Math.sin(respira) * (estab >= 35 ? 0.03 : 0.055);
      colchonManta.position.y = 0.8 + Math.sin(respira) * 0.008;
      if (estab < 35) {
        // Se retuerce de dolor: pequeños giros de la cabeza y temblor de la manta
        cuerpo.rotation.z = Math.sin(t * 6) * 0.012;
        cab.rotation.z = Math.sin(t * 3.4) * 0.3;
      } else {
        cuerpo.rotation.z = 0;
      }
      if (ledMat) {
        const parpadeo = camilla.alarma ? (Math.sin(t * 9) > 0 ? 3.5 : 0.4) : 2.2;
        ledMat.emissiveIntensity = parpadeo;
      }
      if (halo.material instanceof THREE.MeshBasicMaterial && halo.userData['activa']) {
        halo.material.opacity = 0.55 + Math.sin(t * 5) * 0.3;
      }
    },
    fijarEtiqueta(tono) {
      posteTag.visible = true;
      if (tono === null) {
        tarjetaMat.color.setHex(0x2a3650);
        tarjetaMat.emissive.setHex(0x000000);
      } else {
        tarjetaMat.color.setHex(COLOR_ETIQUETA[tono]);
        tarjetaMat.emissive.setHex(COLOR_ETIQUETA[tono]);
        tarjetaMat.emissiveIntensity = tono === 'negro' ? 0.05 : 1.6;
      }
    },
    fijarActiva(on) {
      halo.userData['activa'] = on;
      (halo.material as THREE.MeshBasicMaterial).opacity = on ? 0.7 : 0;
    },
  };
  camilla.fijarEstabilidad(estab);
  return camilla;
}

// ────────────────────────────────────────────────────────────────
// Ambulancia
// ────────────────────────────────────────────────────────────────

export interface Ambulancia {
  grupo: THREE.Group;
  /** Destello azul/rojo de las balizas (t en segundos). */
  actualizar(t: number): void;
  luces: THREE.PointLight[];
}

/** Ambulancia de ~5 m, con la trasera hacia +z. */
export function crearAmbulancia(): Ambulancia {
  const grupo = new THREE.Group();
  const blanco = mat(0xf2f6fb, { rough: 0.4, metal: 0.1 });
  const rojo = mat(0xe03a4a, { rough: 0.45 });
  const negro = mat(0x11161f, { rough: 0.35 });

  const caja1 = caja(2.3, 1.85, 3.5, blanco, 0.12);
  caja1.position.set(0, 1.55, 0.6);
  grupo.add(caja1);
  const cabina = caja(2.3, 1.35, 1.55, blanco, 0.2);
  cabina.position.set(0, 1.25, -1.9);
  grupo.add(cabina);
  const capo = caja(2.3, 0.7, 1.0, blanco, 0.18);
  capo.position.set(0, 0.98, -2.9);
  grupo.add(capo);
  const parabrisas = caja(2.05, 0.7, 0.05, mat(0x1a2a44, { rough: 0.1, metal: 0.5 }), 0.03);
  parabrisas.position.set(0, 1.55, -2.66);
  parabrisas.rotation.x = -0.35;
  grupo.add(parabrisas);

  // Franja y cruz a los lados
  for (const sx of [-1, 1]) {
    const franja = caja(0.03, 0.26, 4.9, rojo, 0.01);
    franja.position.set(sx * 1.16, 1.1, -0.45);
    grupo.add(franja);
    const cruzA = caja(0.03, 0.75, 0.22, rojo, 0.01);
    const cruzB = caja(0.03, 0.22, 0.75, rojo, 0.01);
    cruzA.position.set(sx * 1.16, 1.75, 0.8);
    cruzB.position.set(sx * 1.16, 1.75, 0.8);
    grupo.add(cruzA, cruzB);
  }
  // Puertas traseras y faros
  const puertaTras = caja(2.1, 1.6, 0.04, mat(0xdce6f2, { rough: 0.5 }), 0.03);
  puertaTras.position.set(0, 1.5, 2.36);
  grupo.add(puertaTras);
  for (const sx of [-1, 1]) {
    const piloto = caja(0.16, 0.3, 0.05, luz(COL.rojo, 1.4), 0.03);
    piloto.position.set(sx * 1.0, 1.25, 2.38);
    grupo.add(piloto);
    const faro = caja(0.3, 0.16, 0.05, luz(0xfff3c4, 2.2), 0.04);
    faro.position.set(sx * 0.8, 0.98, -3.42);
    grupo.add(faro);
  }
  // Ruedas
  for (const sx of [-1, 1]) {
    for (const z of [-2.3, 1.5]) {
      const rueda = cilindro(0.5, 0.5, 0.35, negro, 20);
      rueda.rotation.z = Math.PI / 2;
      rueda.position.set(sx * 1.05, 0.5, z);
      grupo.add(rueda);
      const llanta = cilindro(0.26, 0.26, 0.37, mat(0xaab6c8, { metal: 0.8, rough: 0.3 }), 14);
      llanta.rotation.z = Math.PI / 2;
      llanta.position.set(sx * 1.05, 0.5, z);
      grupo.add(llanta);
    }
  }
  // Barra de luces
  const barra = caja(1.7, 0.16, 0.36, negro, 0.05);
  barra.position.set(0, 2.55, -0.4);
  grupo.add(barra);
  const azul = luz(0x3b7bff, 3);
  const rojoL = luz(0xff2f44, 3);
  const lA = caja(0.72, 0.15, 0.3, azul, 0.04);
  lA.position.set(-0.42, 2.63, -0.4);
  const lR = caja(0.72, 0.15, 0.3, rojoL, 0.04);
  lR.position.set(0.42, 2.63, -0.4);
  grupo.add(lA, lR);

  const pa = new THREE.PointLight(0x3b7bff, 0, 14, 2);
  pa.position.set(-1.2, 3, -0.4);
  const pr = new THREE.PointLight(0xff2f44, 0, 14, 2);
  pr.position.set(1.2, 3, -0.4);
  grupo.add(pa, pr);

  return {
    grupo,
    luces: [pa, pr],
    actualizar(t) {
      const fase = Math.sin(t * 7) > 0;
      azul.emissiveIntensity = fase ? 4 : 0.25;
      rojoL.emissiveIntensity = fase ? 0.25 : 4;
      pa.intensity = fase ? 60 : 4;
      pr.intensity = fase ? 4 : 60;
    },
  };
}
