// Shader de composición a pantalla completa.
//
// Todo el trabajo ocurre en "coordenadas de lienzo" (px de las texturas, origen
// arriba-izquierda). Cada capa tiene una disparidad (≈ 1/profundidad, pirámide = 1)
// que escala el movimiento de cámara → paralaje 2.5D coherente.
//
// Todas las animaciones son periódicas con periodo uLoop: el vídeo resultante
// hace bucle perfecto (frame T == frame 0).

export const vertexShader = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = vec2(uv.x, 1.0 - uv.y);          // y hacia abajo, como el lienzo
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tSky, tCloudRGB, tCloudA, tFgRGB, tFgA, tMask;
uniform vec2  uRes;          // px de salida
uniform float uTime, uLoop;
uniform vec2  uCanvas;       // tamaño del lienzo
uniform float uPhotoY;       // y del borde superior de la foto en el lienzo
uniform float uHorizonY;     // línea base de la pirámide / inicio del césped
uniform float uEyeY;         // línea del horizonte (altura de los ojos)
uniform float uFocal;        // focal en px de lienzo
uniform float uViewW, uViewBottom, uViewCX;
uniform vec2  uCam;          // desplazamiento de cámara (px @ disparidad 1)
uniform float uZoom;         // dolly
uniform vec2  uFocus;

in vec2 vUv;
out vec4 outColor;

#define TAU 6.283185307179586

// ---------------------------------------------------------------- ruido periódico
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
// ruido de gradiente con periodo entero 'per' (en celdas)
float pnoise(vec2 p, vec2 per) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(mod(i, per)), f);
  float b = dot(hash2(mod(i + vec2(1, 0), per)), f - vec2(1, 0));
  float c = dot(hash2(mod(i + vec2(0, 1), per)), f - vec2(0, 1));
  float d = dot(hash2(mod(i + vec2(1, 1), per)), f - vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float pfbm(vec2 p, vec2 per, int oct) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    s += a * pnoise(p, per);
    p *= 2.0;                                    // escala entera → conserva el periodo
    per *= 2.0;
    a *= 0.5;
  }
  return s;
}
const vec2 NOPER = vec2(4096.0);

// ---------------------------------------------------------------- cámara
vec2 camWarp(vec2 p, float d) {
  return uFocus + (p - uFocus) / (1.0 + uZoom * d) + uCam * d;
}

// ---------------------------------------------------------------- nubes (flow-map de cinemagraph)
vec4 cloudAt(vec2 pc) {
  vec2 uv = pc / uCanvas;
  float a = texture(tCloudA, uv).r;
  vec3 c = texture(tCloudRGB, uv).rgb;
  return vec4(c * a, a);                       // premultiplicado
}
vec2 cloudFlow(vec2 pc) {
  float yN = clamp(pc.y / uHorizonY, 0.0, 1.0); // 0 = cénit, 1 = horizonte
  vec2 wind = vec2(1.0, 0.035) * mix(58.0, 24.0, yN * yN);
  vec2 q = pc / 820.0;
  vec2 turb = vec2(pfbm(q, NOPER, 3), pfbm(q + 17.31, NOPER, 3)) * 30.0;
  return wind + turb;
}
vec4 flowClouds(vec2 pc) {
  float P = uLoop * 0.5;
  float ph0 = fract(uTime / P);
  float ph1 = fract(uTime / P + 0.5);
  vec2 f = cloudFlow(pc);
  vec4 c0 = cloudAt(pc - f * (ph0 - 0.5));
  vec4 c1 = cloudAt(pc - f * (ph1 - 0.5));
  float w = abs(1.0 - 2.0 * ph0);
  w = w * w * (3.0 - 2.0 * w);
  return mix(c0, c1, w);
}

// ---------------------------------------------------------------- cirros procedurales (capa alta)
float cirrusField(vec2 pc) {
  vec2 q = vec2(pc.x / 1500.0, pc.y / 300.0);
  q += 0.45 * vec2(pfbm(q * 1.3 + 3.1, NOPER, 3), pfbm(q * 1.3 + 9.7, NOPER, 3));
  float n = pfbm(q * 2.1, NOPER, 5);
  float streak = pfbm(vec2(q.x * 0.6, q.y * 5.0), NOPER, 3);
  float m = smoothstep(0.12, 0.36, n + streak * 0.22);
  float band = smoothstep(400.0, 1300.0, pc.y) * (1.0 - smoothstep(uPhotoY + 200.0, uPhotoY + 1400.0, pc.y));
  // menos densidad justo en la franja del reloj (legibilidad)
  float clock = 1.0 - 0.55 * (1.0 - smoothstep(700.0, 1250.0, pc.y));
  return m * band * clock * 0.22;
}
float flowCirrus(vec2 pc) {
  float P = uLoop * 0.5;
  float ph0 = fract(uTime / P + 0.25);
  float ph1 = fract(uTime / P + 0.75);
  vec2 f = vec2(92.0, -6.0);
  float c0 = cirrusField(pc - f * (ph0 - 0.5));
  float c1 = cirrusField(pc - f * (ph1 - 0.5));
  float w = abs(1.0 - 2.0 * ph0);
  return mix(c0, c1, w * w * (3.0 - 2.0 * w));
}

// ---------------------------------------------------------------- geometría del suelo
float groundZ(float y) {                 // profundidad (m) de un punto del césped en la fila y
  return 1.6 * uFocal / max(y - uEyeY, 1.0);
}
float fgDisparity(float y) {
  float zBase = groundZ(uHorizonY);
  if (y <= uHorizonY) return 1.0;
  // 1/Z real satura suavemente en 2.6: el césped cercano se mueve más que la pirámide,
  // pero sin que el primer plano "navegue" en una pantalla de bloqueo
  float raw = zBase / groundZ(y);
  return 1.0 + 1.6 * (1.0 - exp(-(raw - 1.0) / 1.6));
}
// posición "mundo" (X, Z) en metros para las sombras de nubes y el viento
vec2 worldXZ(vec2 p) {
  float zBase = groundZ(uHorizonY);
  if (p.y >= uHorizonY) {
    float z = groundZ(p.y);
    return vec2((p.x - uViewCX) * z / uFocal, z);
  }
  // superficies verticales (pirámide, árboles) a la distancia de la base
  float h = (uHorizonY - p.y) * zBase / uFocal;
  return vec2((p.x - uViewCX) * zBase / uFocal, zBase + h * 0.8);
}

// sombras de nubes: se desplazan exactamente un periodo por bucle → loop perfecto
float cloudShadow(vec2 xz) {
  const float PER = 4.0;                           // celdas por periodo
  const float CELL = 46.0;                         // m por celda (periodo = 184 m)
  vec2 q = vec2(xz.x / CELL - uTime / uLoop * PER, xz.y / (CELL * 1.6));
  float n = pfbm(q, vec2(PER, 4096.0), 4);
  return smoothstep(0.02, 0.19, n);
}
// rachas de viento sobre el césped
float grassGust(vec2 xz) {
  const float PER = 8.0;
  const float CELL = 7.0;                          // periodo 56 m → ~3.5 m/s en 16 s
  vec2 q = vec2(xz.x / CELL - uTime / uLoop * PER, xz.y / (CELL * 1.3));
  q.x += 0.35 * pnoise(q * 0.5 + 5.0, vec2(PER * 0.5, 4096.0));
  return pfbm(q, vec2(PER, 4096.0), 3);
}

// ---------------------------------------------------------------- color
vec3 sat(vec3 c, float s) { float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return mix(vec3(l), c, s); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

void main() {
  // ---- píxel de pantalla → lienzo
  float viewH = uViewW * uRes.y / uRes.x;
  vec2 p = vec2(uViewCX + (vUv.x - 0.5) * uViewW, uViewBottom - (1.0 - vUv.y) * viewH);

  // ---- cielo despejado (casi infinito)
  vec2 ps = camWarp(p, 0.06);
  vec3 col = texture(tSky, vec2(0.5, clamp(ps.y / uCanvas.y, 0.0, 1.0))).rgb;
  // resplandor solar suave, arriba a la derecha (tras el gran cúmulo)
  vec2 sunP = vec2(uCanvas.x * 0.92, uPhotoY + 350.0);
  float glow = exp(-distance(ps, sunP) / 1700.0);
  col += vec3(0.10, 0.10, 0.08) * glow;

  // ---- cirros altos
  float ci = flowCirrus(camWarp(p, 0.10));
  col = mix(col, vec3(0.94, 0.96, 1.0), ci);

  // ---- cúmulos de la foto
  vec4 cl = flowClouds(camWarp(p, 0.28));
  col = col * (1.0 - cl.a) + cl.rgb;

  // ---- primer plano: pirámide + árboles + césped
  float d = fgDisparity(p.y);
  vec2 pf = camWarp(p, d);
  vec2 fuv = (pf - vec2(0.0, uPhotoY)) / vec2(uCanvas.x, uCanvas.y - uPhotoY);
  vec3 m = texture(tMask, fuv).rgb;               // césped, piedra, árboles
  vec2 xz = worldXZ(pf);

  // viento: la hierba se inclina (desplazamiento horizontal ∝ 1/Z) y brilla
  float gust = grassGust(xz);
  pf.x += m.r * gust * 0.009 * uFocal / xz.y;
  // copas de los árboles: vaivén mínimo
  pf.x += m.b * pnoise(vec2(pf.y / 90.0, uTime / uLoop * 3.0), vec2(4096.0, 3.0)) * 1.6;
  fuv = (pf - vec2(0.0, uPhotoY)) / vec2(uCanvas.x, uCanvas.y - uPhotoY);

  float fa = fuv.y < 0.0 ? 0.0 : texture(tFgA, fuv).r;
  vec3 fg = texture(tFgRGB, fuv).rgb;

  // gradación por material
  vec3 grassC = sat(fg, 1.07) * vec3(0.97, 1.01, 0.93);
  grassC *= 1.0 + gust * 0.16;                      // brillo de las rachas
  grassC = mix(grassC, grassC * vec3(1.05, 1.06, 0.92), clamp(gust * 2.0, 0.0, 1.0) * 0.5);
  vec3 stoneC = sat(fg, 1.05) * vec3(1.035, 1.0, 0.955);
  vec3 treeC = sat(fg, 1.1) * vec3(0.96, 1.0, 0.96);
  float mw = m.r + m.g + m.b + 1e-3;
  fg = (grassC * m.r + stoneC * m.g + treeC * m.b) / mw * clamp(mw, 0.0, 1.0) + fg * (1.0 - clamp(mw, 0.0, 1.0));

  // sombras de nubes que barren el suelo y la pirámide
  float sh = cloudShadow(xz);
  fg *= mix(vec3(1.0), vec3(0.74, 0.77, 0.84), sh * 0.85);

  col = mix(col, fg, fa);

  // ---- acabado: curva, viñeta, tramado anti-banding
  col = clamp(col, 0.0, 1.0);
  col = mix(col, smoothstep(0.0, 1.0, col), 0.18);
  col = sat(col, 1.03);
  vec2 vq = vUv - 0.5;
  col *= 1.0 - 0.16 * smoothstep(0.35, 0.85, length(vq * vec2(1.0, 0.72)));
  col += (hash12(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;
