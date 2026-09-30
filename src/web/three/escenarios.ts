/**
 * Los cuatro escenarios del mundo 3D. Cada uno es un `Group` independiente
 * con su propia geometría en coordenadas locales; `Mundo` los coloca en
 * puntos distantes del espacio y mueve la cámara entre ellos.
 *
 *  - sala:       urgencias (boxes, control, cafetera, sofá, puertas)
 *  - quirofano:  mesa, lámpara cialítica, anestesia e instrumental
 *  - puerta:     puerta de ambulancias (triaje de múltiples víctimas)
 *  - exterior:   el hospital de noche bajo la lluvia (título y amanecer)
 */
import * as THREE from 'three';
import {
  crearAmbulancia,
  crearCamilla,
  crearEnfermera,
  crearPersonaje,
  PELOS,
  PIELES,
  type Ambulancia,
  type Camilla,
  type Personaje,
} from './personajes.js';
import {
  crearCafetera,
  crearCono,
  crearFarola,
  crearLamparaQuirofano,
  crearMesaInstrumental,
  crearMostrador,
  crearPlanta,
  crearPuerta,
  crearSilla,
  crearSofa,
  crearTorreAnestesia,
  type Cafetera,
} from './mobiliario.js';
import {
  BancoEcg,
  caja,
  cilindro,
  COL,
  degradadoCielo,
  esfera,
  letrero,
  luz,
  mat,
  matUnico,
  texturaFachada,
  texturaSkyline,
  texturaSuelo,
} from './util.js';

/** Especificación de una luz de relleno (Mundo las vuelca en un pool fijo). */
export interface LuzSpec {
  pos: THREE.Vector3;
  color: number;
  intensidad: number;
  distancia: number;
}

export interface Escenario {
  grupo: THREE.Group;
  luces: LuzSpec[];
  actualizar(t: number, dt: number): void;
}

export interface Colision {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function anillo(radio: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(radio * 0.8, radio, 56),
    new THREE.MeshBasicMaterial({ color: COL.cian, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.04;
  return m;
}

function suelo(ancho: number, fondo: number, tex: THREE.Texture, tile = 2): THREE.Mesh {
  tex.repeat.set(ancho / tile, fondo / tile);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, fondo),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.12 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/** Decal en el suelo (texto pintado). */
function decalSuelo(texto: string, ancho: number, alto: number, x: number, z: number, rotY = 0, tinta = '#7ee7ee'): THREE.Mesh {
  const d = letrero(texto, ancho, alto, { tinta, px: 64, emisivo: true });
  d.rotation.x = -Math.PI / 2;
  d.rotation.z = rotY;
  d.position.set(x, 0.03, z);
  (d.material as THREE.MeshBasicMaterial).opacity = 0.75;
  return d;
}

// ════════════════════════════════════════════════════════════════
// URGENCIAS
// ════════════════════════════════════════════════════════════════

export interface BahiaSala {
  x: number;
  cama: THREE.Vector3;
  frente: THREE.Vector3;
  anillo: THREE.Mesh;
}

export interface SalaEscenario extends Escenario {
  bahias: BahiaSala[];
  asientos: THREE.Vector3[];
  colisiones: Colision[];
  lim: Colision;
  puntos: { inicio: THREE.Vector3; cafe: THREE.Vector3; sofa: THREE.Vector3; planta: THREE.Vector3; entrada: THREE.Vector3; quirofano: THREE.Vector3 };
  anillos: { cafe: THREE.Mesh; sofa: THREE.Mesh; planta: THREE.Mesh };
  cafetera: Cafetera;
  ambulancia: Ambulancia;
  /** Marca el número de ingresados en la puerta de planta. */
  fijarPlanta(n: number): void;
  fijarHora(minuto: number): void;
  /** Cartel "en uso" del quirófano. */
  fijarQuirofanoEnUso(on: boolean): void;
}

export function construirSala(): SalaEscenario {
  const g = new THREE.Group();

  // Suelo y exterior
  const sueloSala = suelo(28, 17, texturaSuelo(COL.suelo, COL.sueloB, 0x121d33));
  g.add(sueloSala);
  const asfalto = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 34),
    new THREE.MeshStandardMaterial({ color: 0x0c1322, roughness: 0.5, metalness: 0.3 }),
  );
  asfalto.rotation.x = -Math.PI / 2;
  asfalto.position.set(27, -0.01, 0);
  asfalto.receiveShadow = true;
  g.add(asfalto);

  // Paredes
  const paredM = mat(COL.pared, { rough: 0.85 });
  const fondo = caja(29, 5.6, 0.5, paredM, 0.05);
  fondo.position.set(0, 2.8, -8.75);
  g.add(fondo);
  const izq = caja(0.5, 5.6, 17.5, paredM, 0.05);
  izq.position.set(-14.25, 2.8, 0);
  g.add(izq);
  const derA = caja(0.5, 5.6, 4.3, paredM, 0.05);
  derA.position.set(14.25, 2.8, -6.35);
  g.add(derA);
  const derB = caja(0.5, 5.6, 7.7, paredM, 0.05);
  derB.position.set(14.25, 2.8, 4.65);
  g.add(derB);
  const dintelEntrada = caja(0.5, 2.0, 5.2, paredM, 0.05);
  dintelEntrada.position.set(14.25, 4.6, -1.7);
  g.add(dintelEntrada);

  // Tiras LED cian a ras de suelo: el guiño moderno
  const led = luz(COL.cian, 2.2);
  const tiraFondo = caja(27.6, 0.06, 0.06, led, 0.02);
  tiraFondo.position.set(0, 0.12, -8.45);
  const tiraIzq = caja(0.06, 0.06, 16.6, led, 0.02);
  tiraIzq.position.set(-13.95, 0.12, 0);
  g.add(tiraFondo, tiraIzq);

  // Ventanas al skyline (con velo de luz de día)
  const cielo = texturaSkyline();
  const velosDia: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < 4; i++) {
    const cx = -10.5 + i * 7;
    const marco = caja(5.3, 2.5, 0.12, mat(0x0f1828, { rough: 0.5 }), 0.05);
    marco.position.set(cx, 3.3, -8.48);
    g.add(marco);
    const tex = cielo.clone();
    tex.needsUpdate = true;
    tex.repeat.set(0.55, 1);
    tex.offset.set(i * 0.2, 0);
    const cristal = new THREE.Mesh(
      new THREE.PlaneGeometry(5.0, 2.2),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    );
    cristal.position.set(cx, 3.3, -8.41);
    g.add(cristal);
    const velo = new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false });
    const veloM = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 2.2), velo);
    veloM.position.set(cx, 3.3, -8.4);
    g.add(veloM);
    velosDia.push(velo);
  }

  // Rótulo grande sobre las ventanas
  const cartelUrg = letrero('URGENCIAS', 6.4, 0.9, { tinta: '#7ee7ee', px: 120, emisivo: true });
  cartelUrg.position.set(0, 5.05, -8.47);
  g.add(cartelUrg);

  // ── Boxes ──
  const bahias: BahiaSala[] = [];
  const colisiones: Colision[] = [];
  const cristalPart = matUnico(0x7fd4ff, { rough: 0.15, emissive: 0x1d5a78, emissiveI: 0.35 });
  cristalPart.transparent = true;
  cristalPart.opacity = 0.2;
  for (let i = 0; i < 6; i++) {
    const p = caja(0.08, 2.4, 4.0, cristalPart, 0.02);
    p.castShadow = false;
    p.position.set(-12 + i * 4.8, 1.2, -6.5);
    g.add(p);
    const marcoP = caja(0.12, 0.08, 4.0, mat(COL.acero, { metal: 0.6 }), 0.02);
    marcoP.position.set(-12 + i * 4.8, 2.42, -6.5);
    g.add(marcoP);
  }
  for (let i = 0; i < 5; i++) {
    const x = -9.6 + i * 4.8;
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.0),
      new THREE.MeshStandardMaterial({ color: 0x27406a, roughness: 0.6, metalness: 0.1 }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(x, 0.012, -6.5);
    pad.receiveShadow = true;
    g.add(pad);
    g.add(decalSuelo(`BOX ${i + 1}`, 1.9, 0.5, x, -3.65));
    const ring = anillo(0.9);
    ring.position.set(x, 0.04, -4.15);
    g.add(ring);
    bahias.push({
      x,
      cama: new THREE.Vector3(x, 0, -6.6),
      frente: new THREE.Vector3(x, 0, -4.15),
      anillo: ring,
    });
    colisiones.push({ minX: x - 0.6, maxX: x + 1.0, minZ: -7.8, maxZ: -5.4 });
  }

  // ── Control de enfermería ──
  const mostrador = crearMostrador(7.2);
  mostrador.position.set(0, 0, 1.0);
  g.add(mostrador);
  colisiones.push({ minX: -3.8, maxX: 3.8, minZ: -1.1, maxZ: 1.75 });
  const enfermera = crearEnfermera();
  enfermera.grupo.position.set(-1.2, 0, -0.25);
  g.add(enfermera.grupo);
  const auxiliar = crearPersonaje({ ropa: 0x7fc4e8, ropaOscura: 0x3f6f96, piel: PIELES[3]!, pelo: PELOS[0]!, gorro: null });
  auxiliar.grupo.position.set(1.6, 0, -0.3);
  auxiliar.grupo.rotation.y = 0.4;
  g.add(auxiliar.grupo);
  g.add(decalSuelo('CONTROL', 2.4, 0.55, 0, 2.75));

  // ── Puertas de la pared izquierda ──
  const puertaPlanta = crearPuerta('PLANTA', '#7ee7ee');
  puertaPlanta.position.set(-13.95, 0, -2.2);
  g.add(puertaPlanta);
  const anilloPlanta = anillo(1.1);
  anilloPlanta.position.set(-12.3, 0.04, -2.2);
  g.add(anilloPlanta);
  g.add(decalSuelo('PLANTA', 1.9, 0.5, -11.4, -0.6, Math.PI / 2));
  // contador de ingresados
  let cartelPlanta = letrero('0 ingresados', 2.6, 0.5, { tinta: '#9fb3d1', px: 54, emisivo: true });
  cartelPlanta.rotation.y = Math.PI / 2;
  cartelPlanta.position.set(-13.62, 2.45, -2.2);
  g.add(cartelPlanta);

  const puertaQx = crearPuerta('QUIRÓFANO', '#ff8a96');
  puertaQx.position.set(-13.95, 0, 3.3);
  g.add(puertaQx);
  const lamparaQ = luz(COL.rojo, 0.3);
  const indicadorQ = caja(0.12, 0.26, 0.9, lamparaQ, 0.05);
  indicadorQ.position.set(-13.6, 3.0, 3.3);
  g.add(indicadorQ);
  g.add(decalSuelo('QUIRÓFANO', 2.2, 0.5, -11.4, 4.9, Math.PI / 2, '#ff9aa4'));

  // ── Entrada de ambulancias (hueco en la pared derecha) ──
  const ent = crearPuerta('ENTRADA', '#7ee7ee', 4.6);
  ent.rotation.y = Math.PI;
  ent.position.set(14.0, 0, -1.7);
  g.add(ent);
  g.add(decalSuelo('AMBULANCIAS', 3.2, 0.5, 11.5, -1.7, -Math.PI / 2));
  const ambulancia = crearAmbulancia();
  ambulancia.grupo.rotation.y = -Math.PI / 2;
  ambulancia.grupo.position.set(20.5, 0, -1.7);
  g.add(ambulancia.grupo);
  const farola1 = crearFarola(6);
  farola1.grupo.position.set(16.5, 0, 6.5);
  farola1.luz.intensity = 0;
  g.add(farola1.grupo);

  // ── Café ──
  const cafetera = crearCafetera();
  cafetera.grupo.position.set(13.5, 0, 3.4);
  g.add(cafetera.grupo);
  colisiones.push({ minX: 12.85, maxX: 14.1, minZ: 2.7, maxZ: 4.1 });
  const anilloCafe = anillo(1.0);
  anilloCafe.position.set(11.6, 0.04, 3.4);
  g.add(anilloCafe);
  g.add(decalSuelo('CAFÉ', 1.4, 0.5, 11.3, 2.2, -Math.PI / 2));

  // ── Descanso: sofá, alfombra y luz cálida ──
  const alfombra = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x2b4a7c, roughness: 0.95 }),
  );
  alfombra.rotation.x = -Math.PI / 2;
  alfombra.position.set(12.1, 0.014, 6.4);
  alfombra.receiveShadow = true;
  g.add(alfombra);
  const sofa = crearSofa();
  sofa.position.set(13.0, 0, 6.4);
  sofa.rotation.y = -Math.PI / 2;
  g.add(sofa);
  colisiones.push({ minX: 12.0, maxX: 14.1, minZ: 5.1, maxZ: 7.7 });
  const anilloSofa = anillo(1.0);
  anilloSofa.position.set(10.9, 0.04, 6.4);
  g.add(anilloSofa);
  const mesita = cilindro(0.4, 0.4, 0.5, mat(0xe8eef6, { rough: 0.5 }), 20);
  mesita.position.set(11.6, 0.25, 7.9);
  g.add(mesita);
  const lamp = esfera(0.16, luz(0xffd9a0, 2.4), 14);
  lamp.position.set(11.6, 0.62, 7.9);
  g.add(lamp);

  // ── Sala de espera (sillas de la zona frontal izquierda) ──
  const asientos: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const silla = crearSilla();
    const x = -11.5 + i * 1.05;
    silla.position.set(x, 0, 6.6);
    g.add(silla);
    asientos.push(new THREE.Vector3(x, 0, 6.6));
  }
  g.add(decalSuelo('SALA DE ESPERA', 3.8, 0.5, -8.0, 8.0));
  colisiones.push({ minX: -12.3, maxX: -3.2, minZ: 6.0, maxZ: 7.2 });

  // Plantas
  for (const [x, z, e] of [[-13.0, -7.6, 1.15], [13.1, -7.5, 1.05], [-13.0, 8.0, 1.0], [6.3, 7.6, 0.85]] as const) {
    const pl = crearPlanta(e);
    pl.position.set(x, 0, z);
    g.add(pl);
  }

  // Luces de relleno (en el pool del Mundo)
  const luces: LuzSpec[] = [
    { pos: new THREE.Vector3(-8, 5.5, -1.5), color: 0xcfe4ff, intensidad: 70, distancia: 22 },
    { pos: new THREE.Vector3(8, 5.5, -1.5), color: 0xcfe4ff, intensidad: 70, distancia: 22 },
    { pos: new THREE.Vector3(0, 5.5, 5.5), color: 0xdfe9ff, intensidad: 55, distancia: 22 },
    { pos: new THREE.Vector3(12.5, 3.2, 6.4), color: 0xffd9a0, intensidad: 12, distancia: 7 },
    { pos: new THREE.Vector3(17, 3.4, -1.7), color: 0x5b8cff, intensidad: 0, distancia: 12 },
  ];

  let cartelPlantaActual = 0;
  return {
    grupo: g,
    luces,
    bahias,
    asientos,
    colisiones,
    lim: { minX: -13.2, maxX: 13.4, minZ: -4.6, maxZ: 8.2 },
    puntos: {
      inicio: new THREE.Vector3(0, 0, 4.6),
      cafe: new THREE.Vector3(11.6, 0, 3.4),
      sofa: new THREE.Vector3(10.9, 0, 6.4),
      planta: new THREE.Vector3(-12.3, 0, -2.2),
      entrada: new THREE.Vector3(13.4, 0, -1.7),
      quirofano: new THREE.Vector3(-12.3, 0, 3.3),
    },
    anillos: { cafe: anilloCafe, sofa: anilloSofa, planta: anilloPlanta },
    cafetera,
    ambulancia,
    fijarPlanta(n) {
      if (n === cartelPlantaActual) return;
      cartelPlantaActual = n;
      g.remove(cartelPlanta);
      cartelPlanta = letrero(n === 0 ? 'sin ingresados' : `${n} ingresado${n === 1 ? '' : 's'}`, 2.6, 0.5, {
        tinta: n === 0 ? '#9fb3d1' : '#ffc857',
        px: 54,
        emisivo: true,
      });
      cartelPlanta.rotation.y = Math.PI / 2;
      cartelPlanta.position.set(-13.62, 2.45, -2.2);
      g.add(cartelPlanta);
    },
    fijarHora(minuto) {
      // 0 = 08:00 (día) … 660 = 19:00 … 780 = 21:00 (noche) … 1320 = 06:00 … 1440 = 08:00
      const h = ((8 * 60 + minuto) % 1440) / 60;
      let dia: number;
      if (h >= 8 && h < 18) dia = 1;
      else if (h >= 18 && h < 21) dia = 1 - (h - 18) / 3;
      else if (h >= 21 || h < 5) dia = 0;
      else if (h >= 5 && h < 8) dia = (h - 5) / 3;
      else dia = 0;
      for (const v of velosDia) v.opacity = dia * 0.65;
    },
    fijarQuirofanoEnUso(on) {
      lamparaQ.emissiveIntensity = on ? 3.4 : 0.25;
    },
    actualizar(t, dt) {
      enfermera.actualizar(dt, 0);
      auxiliar.actualizar(dt, 0);
      ambulancia.actualizar(t);
      luces[4]!.intensidad = Math.sin(t * 7) > 0 ? 26 : 4;
      luces[4]!.color = Math.sin(t * 7) > 0 ? 0x5b8cff : 0xff4a5e;
      cafetera.panel.emissiveIntensity = 1.1 + Math.sin(t * 1.6) * 0.3;
    },
  };
}

// ════════════════════════════════════════════════════════════════
// QUIRÓFANO
// ════════════════════════════════════════════════════════════════

export interface QuirofanoEscenario extends Escenario {
  cirujano: Personaje;
  anestesista: Personaje;
  instrumentista: Personaje;
  /** Actualiza monitores, respiración y alarma según el estado del paciente. */
  fijarEstado(estabilidad: number, imprevisto: boolean): void;
  /** Pulso de color en el campo (complicación). */
  destello(color: number): void;
  spot: THREE.SpotLight;
  posCirujano: THREE.Vector3;
}

export function construirQuirofano(banco: BancoEcg, cirujano: Personaje): QuirofanoEscenario {
  const g = new THREE.Group();

  const sueloQ = suelo(18, 15, texturaSuelo(0x2c4764, 0x34557a, 0x1a2c44));
  g.add(sueloQ);
  const tex = texturaSuelo(0x2f6a86, 0x3a7a98, 0x1d4458);
  tex.repeat.set(9, 3);
  const paredQ = matUnico(0xffffff, { rough: 0.6 });
  paredQ.map = tex;
  const fondo = caja(18.5, 5.4, 0.4, paredQ, 0.04);
  fondo.position.set(0, 2.7, -7.7);
  g.add(fondo);
  const tex2 = tex.clone();
  tex2.needsUpdate = true;
  tex2.repeat.set(7, 3);
  const paredQ2 = matUnico(0xffffff, { rough: 0.6 });
  paredQ2.map = tex2;
  const izq = caja(0.4, 5.4, 15.4, paredQ2, 0.04);
  izq.position.set(-9.2, 2.7, 0);
  const der = caja(0.4, 5.4, 15.4, paredQ2, 0.04);
  der.position.set(9.2, 2.7, 0);
  g.add(izq, der);

  // Tira LED perimetral roja suave (quirófano "en uso")
  const tira = caja(17.6, 0.06, 0.06, luz(COL.rojo, 1.3), 0.02);
  tira.position.set(0, 0.12, -7.45);
  g.add(tira);

  // Pantalla mural con ECG grande
  const marcoPared = caja(4.4, 2.1, 0.12, mat(0x0d1424, { rough: 0.4 }), 0.05);
  marcoPared.position.set(0, 3.0, -7.44);
  g.add(marcoPared);
  const pantallaPared = new THREE.MeshBasicMaterial({ map: banco.texturas.verde, toneMapped: false });
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 1.8), pantallaPared);
  pp.position.set(0, 3.0, -7.37);
  g.add(pp);
  const rotulo = letrero('QUIRÓFANO 1 · EN USO', 4.4, 0.6, { tinta: '#ff8a96', px: 62, emisivo: true });
  rotulo.position.set(0, 4.45, -7.47);
  g.add(rotulo);

  // Mesa quirúrgica
  const acero = mat(COL.acero, { metal: 0.85, rough: 0.25 });
  const basem = caja(1.3, 0.14, 1.7, acero, 0.05);
  basem.position.y = 0.07;
  const columna = cilindro(0.2, 0.28, 0.9, acero, 18);
  columna.position.y = 0.55;
  const tablero = caja(0.86, 0.12, 2.4, acero, 0.05);
  tablero.position.y = 1.02;
  const colchon = caja(0.8, 0.09, 2.3, mat(0x284b6a, { rough: 0.8 }), 0.04);
  colchon.position.y = 1.12;
  g.add(basem, columna, tablero, colchon);

  // Paciente tapado con paños verdes y campo quirúrgico
  const paciente = new THREE.Group();
  const cabeza = esfera(0.17, mat(PIELES[1]!, { rough: 0.55 }), 18);
  cabeza.position.set(0, 1.3, -1.0);
  const gorroP = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
    mat(0x4ec3b0, { rough: 0.9 }),
  );
  gorroP.position.set(0, 1.33, -1.03);
  gorroP.rotation.x = -0.4;
  const mascara = caja(0.22, 0.09, 0.08, mat(0xdff3f8), 0.03);
  mascara.position.set(0, 1.26, -0.86);
  const pano = caja(0.84, 0.28, 1.45, mat(0x2fa58a, { rough: 0.95 }), 0.1);
  pano.position.set(0, 1.32, 0.12);
  const campoMat = matUnico(0xd9905f, { rough: 0.5, emissive: 0xff6a3d, emissiveI: 0.0 });
  const campo = caja(0.3, 0.03, 0.42, campoMat, 0.015);
  campo.position.set(0, 1.47, 0.1);
  paciente.add(cabeza, gorroP, mascara, pano, campo);
  g.add(paciente);

  // Lámpara cialítica con foco
  const lampara = crearLamparaQuirofano();
  lampara.grupo.position.set(0, 0, 0);
  g.add(lampara.grupo);

  // Torre de anestesia con su pantalla
  const pantallaTorre = new THREE.MeshBasicMaterial({ map: banco.texturas.verde, toneMapped: false });
  const torre = crearTorreAnestesia(pantallaTorre);
  torre.position.set(-1.9, 0, -1.6);
  torre.rotation.y = 0.5;
  g.add(torre);
  // Tubos de ventilación (del paciente a la torre)
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.28, -1.12),
    new THREE.Vector3(-0.5, 1.5, -1.3),
    new THREE.Vector3(-1.1, 1.3, -1.5),
    new THREE.Vector3(-1.6, 1.0, -1.55),
  ]);
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.022, 8), mat(0x7fd4ff, { rough: 0.3 }));
  g.add(tubo);

  // Mesas de instrumental
  const m1 = crearMesaInstrumental();
  m1.position.set(2.8, 0, 0.5);
  m1.rotation.y = Math.PI / 2;
  const m2 = crearMesaInstrumental();
  m2.position.set(2.8, 0, -1.0);
  m2.rotation.y = Math.PI / 2;
  g.add(m1, m2);

  // Equipo: anestesista, instrumentista y (el jugador) cirujano
  const anestesista = crearPersonaje({ ropa: 0x4b7bd6, ropaOscura: 0x35589a, piel: PIELES[2]!, pelo: PELOS[0]!, gorro: 0x4b7bd6, mascarilla: true });
  anestesista.grupo.position.set(0.15, 0, -2.0);
  g.add(anestesista.grupo);
  const instrumentista = crearPersonaje({ ropa: 0x2fb58a, ropaOscura: 0x23856a, piel: PIELES[0]!, pelo: PELOS[2]!, gorro: 0x2fb58a, mascarilla: true });
  instrumentista.grupo.position.set(-1.05, 0, 0.3);
  instrumentista.grupo.rotation.y = Math.PI / 2;
  g.add(instrumentista.grupo);
  const posCirujano = new THREE.Vector3(1.1, 0, 0.15);
  cirujano.grupo.position.copy(posCirujano);
  cirujano.grupo.rotation.y = -Math.PI / 2;
  g.add(cirujano.grupo);

  // Puerta con luz de "en uso" y armario
  const puerta = crearPuerta('EN USO', '#ff8a96', 2.4);
  puerta.rotation.y = -Math.PI / 2;
  puerta.position.set(-2.0, 0, 7.6);
  puerta.visible = false;
  g.add(puerta);
  const armario = caja(3.2, 2.0, 0.6, mat(0xdde8f4, { rough: 0.5 }), 0.05);
  armario.position.set(6.2, 1.0, -7.2);
  g.add(armario);
  for (let i = 0; i < 4; i++) {
    const tirador = caja(0.06, 0.4, 0.04, mat(COL.acero, { metal: 0.8 }), 0.01);
    tirador.position.set(4.9 + i * 0.8, 1.05, -6.88);
    g.add(tirador);
  }

  // Luces de relleno
  const luces: LuzSpec[] = [
    { pos: new THREE.Vector3(-4.5, 5.0, 2), color: 0xbfe4ff, intensidad: 34, distancia: 16 },
    { pos: new THREE.Vector3(5.0, 5.0, 3), color: 0xd4ecff, intensidad: 28, distancia: 16 },
    { pos: new THREE.Vector3(0, 2.4, -5.5), color: 0xff3d54, intensidad: 0, distancia: 12 },
    { pos: new THREE.Vector3(0, 3.5, 1.2), color: 0xffffff, intensidad: 0, distancia: 6 },
    { pos: new THREE.Vector3(0, 0.1, 0), color: 0xffffff, intensidad: 0, distancia: 1 },
  ];

  let estab = 80;
  let resp = 0;
  let destelloT = 0;
  let destelloColor: number = COL.rojo;
  let alarma = false;
  return {
    grupo: g,
    luces,
    cirujano,
    anestesista,
    instrumentista,
    spot: lampara.foco,
    posCirujano,
    fijarEstado(e, imprevisto) {
      estab = e;
      const tono = BancoEcg.tono(e);
      pantallaPared.map = banco.texturas[tono];
      pantallaTorre.map = banco.texturas[tono];
      alarma = e < 35 || imprevisto;
    },
    destello(color) {
      destelloT = 1.2;
      destelloColor = color;
    },
    actualizar(t, dt) {
      resp += dt * (estab >= 60 ? 1.5 : estab >= 35 ? 2.5 : 4);
      pano.scale.y = 1 + Math.sin(resp) * 0.04;
      pano.position.y = 1.32 + Math.sin(resp) * 0.01;
      anestesista.actualizar(dt, 0);
      instrumentista.actualizar(dt, 0);
      cirujano.actualizar(dt, 0);
      // Alarma: pulso rojo en la sala
      const pulso = alarma ? 0.5 + Math.sin(t * 8) * 0.5 : 0;
      luces[2]!.intensidad = pulso * 30;
      for (const d of lampara.discos) d.emissiveIntensity = alarma ? 2.6 - pulso * 0.8 : 2.6;
      // Destello de complicación sobre el campo
      if (destelloT > 0) {
        destelloT -= dt;
        const k = Math.max(0, destelloT / 1.2);
        campoMat.emissive.setHex(destelloColor);
        campoMat.emissiveIntensity = k * 3.2;
        luces[3]!.color = destelloColor;
        luces[3]!.intensidad = k * 40;
      } else {
        campoMat.emissiveIntensity = 0;
        luces[3]!.intensidad = 0;
      }
    },
  };
}

// ════════════════════════════════════════════════════════════════
// PUERTA DE AMBULANCIAS (IMV)
// ════════════════════════════════════════════════════════════════

export interface PuertaEscenario extends Escenario {
  /** Crea/actualiza las camillas de las víctimas; devuelve su posición local. */
  ajustarCamillas(n: number): Camilla[];
  posicionCamilla(i: number, n: number): THREE.Vector3;
  ambulancias: Ambulancia[];
}

export function construirPuerta(banco: BancoEcg): PuertaEscenario {
  const g = new THREE.Group();

  const asfalto = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 34),
    new THREE.MeshStandardMaterial({ color: 0x0e1626, roughness: 0.38, metalness: 0.35 }),
  );
  asfalto.rotation.x = -Math.PI / 2;
  asfalto.position.set(0, 0, 4);
  asfalto.receiveShadow = true;
  g.add(asfalto);
  // Marcas viales
  const amarilla = luz(0xffc233, 0.9);
  for (let i = -6; i <= 6; i++) {
    const raya = caja(0.12, 0.02, 2.4, amarilla, 0.01);
    raya.position.set(i * 3.2, 0.02, 6.2);
    raya.castShadow = false;
    g.add(raya);
  }
  g.add(decalSuelo('ZONA DE TRIAJE', 6, 0.9, 0, 8.2, 0, '#ffc857'));

  // Fachada del hospital con marquesina y puertas automáticas
  const fachada = caja(46, 8, 1.0, mat(0x1b2a47, { rough: 0.8 }), 0.05);
  fachada.position.set(0, 4, -9.5);
  g.add(fachada);
  const texFac = texturaFachada();
  texFac.repeat.set(6, 1);
  const ventanas = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 6.6),
    new THREE.MeshBasicMaterial({ map: texFac, toneMapped: false }),
  );
  ventanas.position.set(0, 4.3, -8.98);
  g.add(ventanas);
  const marquesina = caja(14, 0.3, 4.4, mat(0x0f1828, { rough: 0.4 }), 0.05);
  marquesina.position.set(0, 3.6, -7.0);
  g.add(marquesina);
  const bordeLed = caja(14, 0.08, 0.08, luz(COL.cian, 2.6), 0.02);
  bordeLed.position.set(0, 3.42, -4.85);
  g.add(bordeLed);
  const cartel = letrero('URGENCIAS', 8, 1.1, { tinta: '#ff8a96', px: 130, emisivo: true });
  cartel.position.set(0, 5.1, -8.93);
  g.add(cartel);
  const puertasAuto = caja(6, 3.0, 0.08, matUnico(0x7fd4ff, { rough: 0.1, emissive: 0x1d5a78, emissiveI: 0.8 }), 0.03);
  (puertasAuto.material as THREE.MeshStandardMaterial).transparent = true;
  (puertasAuto.material as THREE.MeshStandardMaterial).opacity = 0.6;
  puertasAuto.position.set(0, 1.5, -8.9);
  g.add(puertasAuto);

  // Dos ambulancias con la trasera hacia la cámara
  const a1 = crearAmbulancia();
  a1.grupo.position.set(-9.5, 0, -4.4);
  a1.grupo.rotation.y = 0.08;
  const a2 = crearAmbulancia();
  a2.grupo.position.set(9.6, 0, -4.2);
  a2.grupo.rotation.y = -0.1;
  g.add(a1.grupo, a2.grupo);

  // Conos y focos
  for (const x of [-4.5, 4.5, -13, 13]) {
    const c = crearCono();
    c.position.set(x, 0, 5.0);
    g.add(c);
  }
  const f1 = crearFarola(7);
  f1.grupo.position.set(-16, 0, 1);
  f1.luz.intensity = 0;
  const f2 = crearFarola(7);
  f2.grupo.position.set(16, 0, 1);
  f2.grupo.rotation.y = Math.PI;
  f2.luz.intensity = 0;
  g.add(f1.grupo, f2.grupo);

  const camillas: Camilla[] = [];
  const anillos: THREE.Mesh[] = [];
  const luces: LuzSpec[] = [
    { pos: new THREE.Vector3(-9.5, 3.4, -2.5), color: 0x5b8cff, intensidad: 0, distancia: 22 },
    { pos: new THREE.Vector3(9.6, 3.4, -2.5), color: 0xff3d54, intensidad: 0, distancia: 22 },
    { pos: new THREE.Vector3(0, 6.5, 4), color: 0xdfe9ff, intensidad: 90, distancia: 30 },
    { pos: new THREE.Vector3(-13, 4.5, 6), color: 0xbfd8ff, intensidad: 30, distancia: 18 },
    { pos: new THREE.Vector3(13, 4.5, 6), color: 0xbfd8ff, intensidad: 30, distancia: 18 },
  ];

  const posicion = (i: number, n: number) => {
    const sep = Math.min(2.6, 22 / Math.max(1, n));
    const x0 = -((n - 1) * sep) / 2;
    return new THREE.Vector3(x0 + i * sep, 0, 1.6);
  };

  return {
    grupo: g,
    luces,
    ambulancias: [a1, a2],
    posicionCamilla: posicion,
    ajustarCamillas(n) {
      while (camillas.length < n) {
        const c = crearCamilla(`victima${camillas.length}`, banco, true);
        g.add(c.grupo);
        camillas.push(c);
        const ring = anillo(0.85);
        ring.scale.set(0.9, 1.4, 1);
        g.add(ring);
        anillos.push(ring);
      }
      camillas.forEach((c, i) => {
        c.grupo.visible = i < n;
        anillos[i]!.visible = i < n;
        if (i < n) {
          const p = posicion(i, n);
          c.grupo.position.copy(p);
          anillos[i]!.position.set(p.x, 0.03, p.z);
        }
      });
      return camillas.slice(0, n);
    },
    actualizar(t) {
      a1.actualizar(t);
      a2.actualizar(t + 0.4);
      const f = Math.sin(t * 7) > 0;
      luces[0]!.intensidad = f ? 70 : 6;
      luces[1]!.intensidad = f ? 6 : 70;
    },
  };
}

// ════════════════════════════════════════════════════════════════
// EXTERIOR NOCTURNO (título y amanecer)
// ════════════════════════════════════════════════════════════════

export interface ExteriorEscenario extends Escenario {
  /** Cambia entre noche lluviosa y amanecer despejado. */
  fijarAmanecer(on: boolean): void;
  cielos: { noche: THREE.Texture; alba: THREE.Texture };
}

export function construirExterior(): ExteriorEscenario {
  const g = new THREE.Group();

  // Suelo mojado
  const calle = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 80),
    new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.22, metalness: 0.55 }),
  );
  calle.rotation.x = -Math.PI / 2;
  calle.position.set(0, 0, 10);
  calle.receiveShadow = true;
  g.add(calle);
  const acera = caja(40, 0.2, 7, mat(0x17233b, { rough: 0.6 }), 0.05);
  acera.position.set(0, 0.1, -2);
  g.add(acera);

  // Edificio principal con ventanas encendidas
  const texFac = texturaFachada();
  texFac.repeat.set(9, 6);
  const cuerpo = caja(34, 21, 12, matUnico(0x1a2744, { rough: 0.8 }), 0.1);
  cuerpo.position.set(0, 10.5, -11);
  g.add(cuerpo);
  const ventanas = new THREE.Mesh(
    new THREE.PlaneGeometry(33, 20),
    new THREE.MeshBasicMaterial({ map: texFac, toneMapped: false }),
  );
  ventanas.position.set(0, 10.5, -4.98);
  g.add(ventanas);
  const ala = caja(14, 13, 10, matUnico(0x1f2e4e, { rough: 0.8 }), 0.1);
  ala.position.set(-22, 6.5, -9);
  g.add(ala);
  const texAla = texturaFachada();
  texAla.repeat.set(4, 4);
  const ventAla = new THREE.Mesh(new THREE.PlaneGeometry(13, 12), new THREE.MeshBasicMaterial({ map: texAla, toneMapped: false }));
  ventAla.position.set(-22, 6.5, -3.98);
  g.add(ventAla);

  // Marquesina de urgencias y cruz de neón
  const marq = caja(10, 0.4, 5, mat(0x0f1828, { rough: 0.4 }), 0.06);
  marq.position.set(4, 3.6, -2.0);
  g.add(marq);
  const ledM = caja(10, 0.1, 0.1, luz(COL.cian, 3), 0.03);
  ledM.position.set(4, 3.35, 0.5);
  g.add(ledM);
  const puertaLuz = caja(5, 3.2, 0.1, luz(0xbfe8ff, 1.4), 0.04);
  puertaLuz.position.set(4, 1.75, -4.9);
  g.add(puertaLuz);
  const cartelU = letrero('URGENCIAS', 7, 1.0, { tinta: '#ff8a96', px: 120, emisivo: true });
  cartelU.position.set(4, 4.4, -4.94);
  g.add(cartelU);
  const cruzM = luz(COL.rojo, 3.4);
  const cruzV = caja(1.6, 5.2, 0.5, cruzM, 0.12);
  const cruzH = caja(5.2, 1.6, 0.5, cruzM, 0.12);
  const cruz = new THREE.Group();
  cruz.add(cruzV, cruzH);
  cruz.position.set(0, 25, -9);
  g.add(cruz);

  // Ambulancia aparcada con las balizas en marcha
  const amb = crearAmbulancia();
  amb.grupo.position.set(11.5, 0, 3.2);
  amb.grupo.rotation.y = -0.5;
  g.add(amb.grupo);

  // Farolas (luz por halo emisivo, sin coste de luz real)
  for (const [x, z] of [[-10, 2], [-3, 4], [18, 0]] as const) {
    const f = crearFarola(6.5);
    f.grupo.position.set(x, 0, z);
    f.luz.intensity = 0;
    g.add(f.grupo);
  }

  // Charcos con reflejo del neón
  for (const [x, z, r] of [[2, 8, 2.6], [-7, 10, 3.2], [9, 12, 2.2]] as const) {
    const ch = new THREE.Mesh(
      new THREE.CircleGeometry(r, 28),
      new THREE.MeshBasicMaterial({ color: 0x1f3a66, transparent: true, opacity: 0.35, toneMapped: false }),
    );
    ch.rotation.x = -Math.PI / 2;
    ch.position.set(x, 0.02, z);
    ch.scale.set(1.6, 1, 0.7);
    g.add(ch);
  }

  // Lluvia: segmentos que caen y se reciclan
  const n = 1400;
  const pos = new Float32Array(n * 6);
  const vel = new Float32Array(n);
  const reponer = (i: number) => {
    const x = (Math.random() - 0.5) * 70;
    const y = Math.random() * 30;
    const z = Math.random() * 40 - 12;
    pos.set([x, y, z, x - 0.12, y - 0.9, z], i * 6);
    vel[i] = 22 + Math.random() * 10;
  };
  for (let i = 0; i < n; i++) reponer(i);
  const geoLluvia = new THREE.BufferGeometry();
  geoLluvia.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lluvia = new THREE.LineSegments(
    geoLluvia,
    new THREE.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.38, toneMapped: false }),
  );
  lluvia.frustumCulled = false;
  g.add(lluvia);

  // Sol del amanecer (apagado de noche)
  const solMat = new THREE.MeshBasicMaterial({ color: 0xffc58a, toneMapped: false, transparent: true, opacity: 0 });
  const sol = new THREE.Mesh(new THREE.CircleGeometry(6, 40), solMat);
  sol.position.set(-14, 9, -38);
  g.add(sol);

  const noche = degradadoCielo('#04070f', '#0b1530', '#1a2c52');
  const alba = degradadoCielo('#1d3b6a', '#ff9b7b', '#ffd9a3');

  const luces: LuzSpec[] = [
    { pos: new THREE.Vector3(4, 4.5, 4), color: 0xbfe8ff, intensidad: 55, distancia: 20 },
    { pos: new THREE.Vector3(11.5, 3.5, 2), color: 0x5b8cff, intensidad: 0, distancia: 18 },
    { pos: new THREE.Vector3(-6, 6, 4), color: 0xffe2a8, intensidad: 35, distancia: 22 },
    { pos: new THREE.Vector3(16, 6, 0), color: 0xffe2a8, intensidad: 25, distancia: 20 },
    { pos: new THREE.Vector3(0, 12, 8), color: 0x9fc4ff, intensidad: 40, distancia: 30 },
  ];

  let amanece = false;
  return {
    grupo: g,
    luces,
    cielos: { noche, alba },
    fijarAmanecer(on) {
      amanece = on;
      lluvia.visible = !on;
      solMat.opacity = on ? 1 : 0;
      luces[4]!.color = on ? 0xffc58a : 0x9fc4ff;
      luces[4]!.intensidad = on ? 70 : 40;
    },
    actualizar(t, dt) {
      amb.actualizar(t);
      luces[1]!.intensidad = Math.sin(t * 7) > 0 ? 40 : 4;
      luces[1]!.color = Math.sin(t * 7) > 0 ? 0x5b8cff : 0xff4a5e;
      cruz.rotation.y = Math.sin(t * 0.4) * 0.15;
      cruzM.emissiveIntensity = 3.0 + Math.sin(t * 2.1) * 0.6;
      if (!amanece) {
        const attr = geoLluvia.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < n; i++) {
          const dy = vel[i]! * dt;
          pos[i * 6 + 1] = pos[i * 6 + 1]! - dy;
          pos[i * 6 + 4] = pos[i * 6 + 4]! - dy;
          if (pos[i * 6 + 1]! < 0) reponer(i);
        }
        attr.needsUpdate = true;
      } else {
        sol.position.y = 9 + Math.min(6, (t % 40) * 0.4);
      }
    },
  };
}

