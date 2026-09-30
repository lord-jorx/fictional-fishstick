// Zopilotes planeando en térmicas sobre El Castillo.
//
// Modelo 3D mínimo (m) proyectado con la misma cámara estenopeica que usa el
// shader para el suelo, de modo que tamaño, perspectiva y paralaje son coherentes.
// Trayectorias circulares con un número entero de vueltas por bucle → loop perfecto.
import * as THREE from 'three';

const TAU = Math.PI * 2;

// ---- geometría local: x = adelante, y = arriba, z = envergadura
function birdTemplate(dihedral) {
  const [d1, d2] = dihedral;
  const half = [
    // cuerpo y cola
    [0.36, 0, 0], [0.12, 0, 0.07], [-0.14, 0, 0.07], [-0.34, 0, 0.10], [-0.44, 0, 0],
    // ala: borde de ataque / borde de fuga (0.45 m y 0.88 m) + "dedos" primarios
    [0.15, d1, 0.46], [-0.24, d1, 0.46], [0.07, d2, 0.84], [-0.15, d2, 0.86], [-0.05, d2 + 0.01, 0.95],
  ];
  return half;
}

// índices de plantilla: 0 pico, 1 raíz delantera, 2 raíz trasera, 3 cola lateral, 4 cola,
// 5 ala media delante, 6 ala media detrás, 7 punta delante, 8 punta detrás, 9 dedos.
// El lado derecho reutiliza los vértices del eje (0 y 4).
const RIGHT = { 1: 10, 2: 11, 3: 12, 5: 13, 6: 14, 7: 15, 8: 16, 9: 17 };
const R = (i) => RIGHT[i] ?? i;
const N_VERTS = 18;
const WING = [[1, 5, 2], [2, 5, 6], [5, 7, 6], [6, 7, 8], [7, 9, 8]];
const INDICES = [
  0, 1, R(1), 1, 2, R(1), R(1), 2, R(2), 2, 3, R(2), R(2), 3, R(3), 3, 4, R(3),
  ...WING.flat(), ...WING.flatMap((t) => t.map(R)),
];
const DARK = new THREE.Color(0x17130f);
const SILVER = new THREE.Color(0x7c7873);
const SHADE = [0, 0, 0.35, 0.2, 0.25, 0, 1, 0.1, 1, 0.6]; // 1 = plumas de vuelo plateadas

export class Birds {
  constructor(defs, loop) {
    this.defs = defs;
    this.loop = loop;
    this.group = new THREE.Group();
    this.meshes = defs.map(() => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_VERTS * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N_VERTS * 4), 4));
      g.setIndex(INDICES);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
      }));
      m.frustumCulled = false;
      this.group.add(m);
      return m;
    });
  }

  /**
   * @param t         tiempo (s)
   * @param project   (X,Y,Z) mundo → [sx, sy] px de pantalla (incluye paralaje)
   * @param skyTint   color del cielo para la perspectiva aérea
   */
  update(t, project, skyTint) {
    const loop = this.loop;
    this.defs.forEach((b, k) => {
      const th = b.phase + (TAU * b.turns * t) / loop;
      const dir = Math.sign(b.turns);
      const bob = Math.sin(TAU * 3 * t / loop + k) * 0.8;
      const pos = [b.cx + b.r * Math.cos(th), b.cy + bob, b.cz + b.r * Math.sin(th)];
      // tangente (heading) y normal hacia el centro
      const F = [-Math.sin(th) * dir, 0, Math.cos(th) * dir];
      const N = [-Math.cos(th), 0, -Math.sin(th)];
      // alabeo hacia dentro + el típico "tambaleo" del zopilote aura
      const bank = b.bank + Math.sin(TAU * b.teeter * t / loop + k * 1.7) * 0.10;
      const flex = Math.sin(TAU * b.teeter * 2 * t / loop + k) * 0.02;
      const tpl = birdTemplate([0.10 + flex, 0.26 + flex * 2]);
      const cb = Math.cos(bank), sb = Math.sin(bank);
      // S' = N cos − U sin ; U' = U cos + N sin
      const U2 = [N[0] * sb, cb, N[2] * sb];
      const S2 = [N[0] * cb, -sb, N[2] * cb];

      const P = this.meshes[k].geometry.attributes.position.array;
      const C = this.meshes[k].geometry.attributes.color.array;
      const dist = pos[2];
      const haze = Math.min(0.45, dist / 420);
      const put = (vi, lx, ly, lz, shade) => {
        const s = b.scale;
        const w = [
          pos[0] + (F[0] * lx + U2[0] * ly + S2[0] * lz) * s,
          pos[1] + (F[1] * lx + U2[1] * ly + S2[1] * lz) * s,
          pos[2] + (F[2] * lx + U2[2] * ly + S2[2] * lz) * s,
        ];
        const [sx, sy] = project(w[0], w[1], w[2]);
        P[vi * 3] = sx; P[vi * 3 + 1] = sy; P[vi * 3 + 2] = 0;
        const c = DARK.clone().lerp(SILVER, shade).lerp(skyTint, haze);
        C[vi * 4] = c.r; C[vi * 4 + 1] = c.g; C[vi * 4 + 2] = c.b; C[vi * 4 + 3] = 0.94;
      };
      tpl.forEach(([lx, ly, lz], i) => {
        put(i, lx, ly, -lz, SHADE[i]);                       // ala hacia fuera del giro
        if (R(i) !== i) put(R(i), lx, ly, lz, SHADE[i]);          // ala hacia el centro
      });
      this.meshes[k].geometry.attributes.position.needsUpdate = true;
      this.meshes[k].geometry.attributes.color.needsUpdate = true;
    });
  }
}
