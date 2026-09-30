/**
 * Mobiliario del hospital: mostrador, sofá, sillas, cafetera, plantas...
 * Cajas redondeadas con materiales mates y toques de luz cian: un hospital
 * contemporáneo, no un decorado de los años 40.
 */
import * as THREE from 'three';
import { caja, cilindro, COL, esfera, letrero, luz, mat, matUnico } from './util.js';

export function crearSofa(): THREE.Group {
  const g = new THREE.Group();
  const tela = mat(0x3d6f9a, { rough: 0.95 });
  const telaClara = mat(0x4f86b5, { rough: 0.95 });
  const base = caja(2.5, 0.42, 1.0, tela, 0.14);
  base.position.y = 0.4;
  const respaldo = caja(2.5, 0.7, 0.3, tela, 0.14);
  respaldo.position.set(0, 0.85, -0.42);
  g.add(base, respaldo);
  for (const sx of [-1, 1]) {
    const brazo = caja(0.25, 0.62, 1.0, tela, 0.12);
    brazo.position.set(sx * 1.12, 0.62, 0);
    g.add(brazo);
  }
  for (const sx of [-0.55, 0.55]) {
    const cojin = caja(1.0, 0.16, 0.78, telaClara, 0.08);
    cojin.position.set(sx, 0.69, 0.06);
    g.add(cojin);
  }
  const cojinAdorno = caja(0.4, 0.4, 0.12, mat(COL.cian, { rough: 0.9 }), 0.06);
  cojinAdorno.position.set(-0.85, 0.92, -0.18);
  cojinAdorno.rotation.z = 0.25;
  g.add(cojinAdorno);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pie = cilindro(0.05, 0.035, 0.18, mat(0x1a2233), 8);
      pie.position.set(sx * 1.05, 0.09, sz * 0.38);
      g.add(pie);
    }
  }
  return g;
}

export function crearSilla(): THREE.Group {
  const g = new THREE.Group();
  const asientoM = mat(0x5a7aa8, { rough: 0.7 });
  const asiento = caja(0.62, 0.08, 0.58, asientoM, 0.04);
  asiento.position.y = 0.46;
  const respaldo = caja(0.62, 0.5, 0.07, asientoM, 0.04);
  respaldo.position.set(0, 0.76, -0.27);
  respaldo.rotation.x = -0.08;
  g.add(asiento, respaldo);
  const metal = mat(0x97a7be, { metal: 0.8, rough: 0.3 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pata = cilindro(0.022, 0.022, 0.46, metal, 8);
      pata.position.set(sx * 0.26, 0.23, sz * 0.23);
      g.add(pata);
    }
  }
  return g;
}

export function crearPlanta(escala = 1): THREE.Group {
  const g = new THREE.Group();
  const maceta = cilindro(0.34, 0.26, 0.55, mat(0xe8eef6, { rough: 0.6 }), 18);
  maceta.position.y = 0.28;
  g.add(maceta);
  const tierra = cilindro(0.3, 0.3, 0.04, mat(0x2a2218), 14);
  tierra.position.y = 0.56;
  g.add(tierra);
  const verde1 = mat(0x2f9e6f, { rough: 0.85 });
  const verde2 = mat(0x3fbd86, { rough: 0.85 });
  const hojas = [
    [0, 1.05, 0, 0.36, verde1],
    [0.22, 0.88, 0.1, 0.28, verde2],
    [-0.2, 0.92, -0.08, 0.3, verde2],
    [0.05, 1.32, -0.05, 0.26, verde1],
    [-0.1, 0.78, 0.2, 0.22, verde1],
  ] as const;
  for (const [x, y, z, r, m] of hojas) {
    const h = esfera(r, m, 12);
    h.scale.set(1, 1.25, 1);
    h.position.set(x, y, z);
    g.add(h);
  }
  g.scale.setScalar(escala);
  return g;
}

export interface Cafetera {
  grupo: THREE.Group;
  /** Brillo del panel (destaca cuando hay que tomarse un café). */
  panel: THREE.MeshStandardMaterial;
}

/** Máquina de café con panel ámbar, mirando a -x. */
export function crearCafetera(): Cafetera {
  const g = new THREE.Group();
  const cuerpo = caja(1.0, 2.05, 1.25, mat(0x1c2638, { rough: 0.45, metal: 0.25 }), 0.08);
  cuerpo.position.y = 1.03;
  g.add(cuerpo);
  const panel = luz(COL.ambar, 1.2);
  const pantalla = caja(0.04, 0.52, 0.85, panel, 0.02);
  pantalla.position.set(-0.51, 1.55, 0);
  g.add(pantalla);
  const hueco = caja(0.1, 0.32, 0.5, mat(0x05080f), 0.03);
  hueco.position.set(-0.5, 0.95, 0);
  g.add(hueco);
  const taza = cilindro(0.09, 0.07, 0.14, mat(0xffffff, { rough: 0.4 }), 14);
  taza.position.set(-0.46, 0.83, 0);
  g.add(taza);
  for (let i = 0; i < 3; i++) {
    const b = caja(0.04, 0.09, 0.09, luz(i === 0 ? COL.verde : COL.cian, 1.6), 0.02);
    b.position.set(-0.51, 1.22, -0.25 + i * 0.25);
    g.add(b);
  }
  return { grupo: g, panel };
}

/** Mostrador del control de enfermería con dos pantallas. */
export function crearMostrador(ancho: number): THREE.Group {
  const g = new THREE.Group();
  const cuerpo = caja(ancho, 1.0, 1.15, mat(COL.paredClara, { rough: 0.55 }), 0.09);
  cuerpo.position.y = 0.5;
  g.add(cuerpo);
  const encimera = caja(ancho + 0.25, 0.11, 1.4, mat(0xecf3fb, { rough: 0.35 }), 0.05);
  encimera.position.y = 1.05;
  g.add(encimera);
  const tira = caja(ancho - 0.3, 0.05, 0.05, luz(COL.cian, 2.2), 0.02);
  tira.position.set(0, 0.22, 0.6);
  g.add(tira);
  for (const sx of [-1.6, 1.6]) {
    const soporte = cilindro(0.04, 0.05, 0.22, mat(0x1a2233), 8);
    soporte.position.set(sx, 1.22, -0.1);
    const pantalla = caja(0.78, 0.5, 0.05, mat(0x0b1120, { rough: 0.3 }), 0.02);
    pantalla.position.set(sx, 1.55, -0.1);
    pantalla.rotation.y = Math.PI;
    const luzP = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x2b8fb5, toneMapped: false }),
    );
    luzP.position.set(0, 0, 0.03);
    pantalla.add(luzP);
    g.add(soporte, pantalla);
  }
  const rotulo = letrero('CONTROL', 2.6, 0.5, { fondo: '#0f2236', tinta: '#7ee7ee', borde: '#38d6e0', emisivo: true });
  rotulo.position.set(0, 0.6, 0.585);
  g.add(rotulo);
  return g;
}

/** Puerta con marco, hoja y rótulo luminoso. */
export function crearPuerta(rotulo: string, color: string, anchoHoja = 2.1): THREE.Group {
  const g = new THREE.Group();
  const marco = mat(0x0f1828, { rough: 0.5 });
  for (const sz of [-1, 1]) {
    const col = caja(0.22, 3.2, 0.2, marco, 0.04);
    col.position.set(0, 1.6, sz * (anchoHoja / 2 + 0.1));
    g.add(col);
  }
  const dintel = caja(0.22, 0.2, anchoHoja + 0.4, marco, 0.04);
  dintel.position.set(0, 3.2, 0);
  g.add(dintel);
  const cristal = matUnico(0x7fd4ff, { rough: 0.1, metal: 0.2, emissive: 0x1b4d6b, emissiveI: 0.4 });
  cristal.transparent = true;
  cristal.opacity = 0.5;
  const hoja = caja(0.06, 3.0, anchoHoja, cristal, 0.02);
  hoja.position.set(0.04, 1.5, 0);
  g.add(hoja);
  const cartel = letrero(rotulo, 3.0, 0.6, { fondo: '#0b1424', tinta: color, borde: color, emisivo: true });
  cartel.rotation.y = Math.PI / 2;
  cartel.position.set(0.22, 3.75, 0);
  g.add(cartel);
  return g;
}

/** Torre de anestesia: carcasa, pantalla con ECG y brazo de tubos. */
export function crearTorreAnestesia(pantallaMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const cuerpo = caja(0.8, 1.35, 0.65, mat(0x2a3a55, { rough: 0.45, metal: 0.2 }), 0.07);
  cuerpo.position.y = 0.7;
  g.add(cuerpo);
  const cajones = [0.3, 0.62, 0.94];
  for (const y of cajones) {
    const c = caja(0.7, 0.26, 0.04, mat(0x35496b), 0.02);
    c.position.set(0, y, 0.34);
    g.add(c);
    const tirador = caja(0.26, 0.03, 0.03, mat(COL.acero, { metal: 0.8 }), 0.01);
    tirador.position.set(0, y, 0.365);
    g.add(tirador);
  }
  const brazo = cilindro(0.03, 0.03, 0.9, mat(COL.acero, { metal: 0.8 }), 8);
  brazo.position.set(0.25, 1.75, 0);
  g.add(brazo);
  const carcasa = caja(0.78, 0.52, 0.09, mat(0x0d1424, { rough: 0.4 }), 0.03);
  carcasa.position.set(0, 1.55, 0.12);
  g.add(carcasa);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.4), pantallaMat);
  pantalla.position.set(0, 0, 0.05);
  carcasa.add(pantalla);
  return g;
}

/** Lámpara cialítica: brazo + dos focos con luz cálida. */
export function crearLamparaQuirofano(): { grupo: THREE.Group; foco: THREE.SpotLight; discos: THREE.MeshStandardMaterial[] } {
  const g = new THREE.Group();
  const acero = mat(COL.acero, { metal: 0.7, rough: 0.3 });
  const mastil = cilindro(0.06, 0.06, 2.6, acero, 10);
  mastil.position.y = 4.4;
  g.add(mastil);
  const brazo = cilindro(0.045, 0.045, 1.5, acero, 10);
  brazo.rotation.z = Math.PI / 2;
  brazo.position.set(0, 3.15, 0);
  g.add(brazo);
  const discos: THREE.MeshStandardMaterial[] = [];
  for (const sx of [-0.75, 0.75]) {
    const m = luz(0xfff1cf, 2.6);
    discos.push(m);
    const disco = cilindro(0.56, 0.56, 0.1, m, 32);
    disco.position.set(sx, 3.02, 0);
    g.add(disco);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 8, 40), acero);
    aro.rotation.x = Math.PI / 2;
    aro.position.set(sx, 3.02, 0);
    g.add(aro);
  }
  const foco = new THREE.SpotLight(0xfff1d6, 90, 12, 0.6, 0.65, 1.6);
  foco.position.set(0, 3.0, 0);
  foco.target.position.set(0, 1.0, 0);
  g.add(foco, foco.target);
  return { grupo: g, foco, discos };
}

/** Mesita auxiliar con instrumental sobre un paño verde. */
export function crearMesaInstrumental(): THREE.Group {
  const g = new THREE.Group();
  const acero = mat(COL.acero, { metal: 0.8, rough: 0.28 });
  const tablero = caja(1.5, 0.06, 0.8, acero, 0.03);
  tablero.position.y = 1.05;
  g.add(tablero);
  const pano = caja(1.36, 0.02, 0.66, mat(0x2fa58a, { rough: 0.95 }), 0.01);
  pano.position.y = 1.095;
  g.add(pano);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pata = cilindro(0.025, 0.025, 1.04, acero, 8);
      pata.position.set(sx * 0.68, 0.52, sz * 0.34);
      g.add(pata);
    }
  }
  // Instrumental: pinzas, tijeras, bisturí, gasas y una cubeta
  const brillo = mat(0xdde8f6, { metal: 0.9, rough: 0.2 });
  for (let i = 0; i < 6; i++) {
    const pinza = caja(0.04, 0.02, 0.36, brillo, 0.008);
    pinza.position.set(-0.5 + i * 0.1, 1.12, -0.12);
    pinza.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.06;
    g.add(pinza);
  }
  for (let i = 0; i < 3; i++) {
    const bisturi = caja(0.025, 0.02, 0.24, brillo, 0.008);
    bisturi.position.set(0.12 + i * 0.09, 1.12, 0.14);
    g.add(bisturi);
  }
  const gasas = caja(0.26, 0.09, 0.22, mat(0xf4f7fb, { rough: 0.95 }), 0.03);
  gasas.position.set(0.5, 1.14, -0.14);
  g.add(gasas);
  const cubeta = cilindro(0.17, 0.12, 0.1, brillo, 18);
  cubeta.position.set(-0.45, 1.15, 0.16);
  g.add(cubeta);
  return g;
}

/** Farola con halo para las escenas exteriores. */
export function crearFarola(altura = 6.5): { grupo: THREE.Group; luz: THREE.PointLight } {
  const g = new THREE.Group();
  const poste = cilindro(0.07, 0.1, altura, mat(0x1a2233, { metal: 0.5 }), 10);
  poste.position.y = altura / 2;
  const brazo = caja(1.0, 0.08, 0.1, mat(0x1a2233), 0.02);
  brazo.position.set(0.45, altura, 0);
  const foco = caja(0.5, 0.1, 0.3, luz(0xfff0c8, 3), 0.04);
  foco.position.set(0.85, altura - 0.05, 0);
  g.add(poste, brazo, foco);
  const pl = new THREE.PointLight(0xffe8b5, 40, 22, 2);
  pl.position.set(0.85, altura - 0.4, 0);
  g.add(pl);
  return { grupo: g, luz: pl };
}

/** Cono de tráfico para la puerta de ambulancias. */
export function crearCono(): THREE.Group {
  const g = new THREE.Group();
  const base = caja(0.4, 0.05, 0.4, mat(0x1a2233), 0.02);
  base.position.y = 0.025;
  const cono = cilindro(0.04, 0.17, 0.5, mat(0xff7a2f, { rough: 0.6 }), 14);
  cono.position.y = 0.3;
  const banda = cilindro(0.085, 0.11, 0.08, mat(0xffffff, { rough: 0.5 }), 14);
  banda.position.y = 0.3;
  g.add(base, cono, banda);
  return g;
}
