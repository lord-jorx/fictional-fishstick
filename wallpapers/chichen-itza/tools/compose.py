"""Etapa 2 — descompone el plate limpio en capas para la escena Three.js.

Salida (en assets/):
  sky_bg.png          gradiente de cielo despejado para todo el lienzo (sin nubes)
  clouds_rgb.jpg      color de la capa de nubes (lienzo completo, fondo rellenado)
  clouds_a.jpg        alfa de la capa de nubes
  fg_rgb.jpg          pirámide + árboles + suelo (región de la foto)
  fg_a.png            alfa del primer plano
  masks.jpg           R = césped, G = piedra, B = árboles (media resolución)
  layout.json         geometría del lienzo para el shader

Espacio de textura: la foto (3072x4096) se reescala a SCALE y se coloca en la
parte inferior de un lienzo con EXT píxeles extra de cielo por arriba.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

SCALE = 0.75
EXT = 1600  # píxeles de lienzo (ya escalados) añadidos por arriba


def fbm(shape, seed, octaves=5, base=220.0):
    """Ruido fBm suave en [0,1] generado con gaussianas a varias escalas."""
    rng = np.random.default_rng(seed)
    h, w = shape
    acc = np.zeros(shape, np.float32)
    amp, tot, s = 1.0, 0.0, base
    for _ in range(octaves):
        sh = (max(4, int(h / s * 4)), max(4, int(w / s * 4)))
        n = rng.standard_normal(sh).astype(np.float32)
        n = cv2.GaussianBlur(n, (0, 0), 1.0)
        n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
        acc += n * amp
        tot += amp
        amp *= 0.5
        s /= 2
    acc /= tot
    acc = (acc - acc.mean()) / (acc.std() + 1e-6)
    return 1 / (1 + np.exp(-acc * 1.6))


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def fill_holes(rgb, w, levels=9):
    """Relleno push-pull: extiende el color donde el peso w es ~0 (evita halos al filtrar)."""
    pyr = []
    c, a = rgb * w[..., None], w.copy()
    for _ in range(levels):
        pyr.append((c, a))
        c = cv2.pyrDown(c)
        a = cv2.pyrDown(a)
    est = c / np.maximum(a, 1e-4)[..., None]
    for c, a in reversed(pyr):
        up = cv2.resize(est, (c.shape[1], c.shape[0]), interpolation=cv2.INTER_LINEAR)
        own = c / np.maximum(a, 1e-4)[..., None]
        k = np.clip(a * 4, 0, 1)[..., None]
        est = own * k + up * (1 - k)
    return est


def sky_gradient(ys):
    """Azul despejado en función de y del lienzo (ajustado a la foto y extrapolado al cénit).
    Puntos de control en coordenadas de lienzo: medidos en la foto + cénit elegido."""
    y_photo = lambda y_full: EXT + y_full * SCALE
    ctrl = [
        (0, (30, 70, 150)),                  # cénit (zona del reloj): azul profundo
        (EXT * 0.55, (40, 88, 166)),
        (y_photo(0), (50, 98, 174)),
        (y_photo(900), (60, 108, 180)),
        (y_photo(1500), (64, 112, 183)),
        (y_photo(1800), (66, 116, 186)),
        (y_photo(2100), (78, 130, 196)),
        (y_photo(2400), (104, 156, 211)),
        (y_photo(2700), (128, 172, 218)),
        (y_photo(4096), (140, 180, 220)),
    ]
    yk = np.array([c[0] for c in ctrl], np.float32)
    ck = np.array([c[1] for c in ctrl], np.float32)
    return np.stack([np.interp(ys, yk, ck[:, i]) for i in range(3)], -1)


def main(clean_path, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    full = cv2.imread(clean_path)[..., ::-1].astype(np.float32)  # RGB
    Hf, Wf = full.shape[:2]
    photo = cv2.resize(full, (round(Wf * SCALE), round(Hf * SCALE)), interpolation=cv2.INTER_AREA)
    ph, pw = photo.shape[:2]
    H, W = ph + EXT, pw
    r, g, b = photo[..., 0], photo[..., 1], photo[..., 2]
    L = photo.mean(2)
    sat = photo.max(2) - photo.min(2)

    # ---------------------------------------------------------------- segmentación cielo
    hard = ((b - r > 18) & (L > 90)) | ((L > 172) & (sat < 70))
    hard = hard.astype(np.uint8)
    n, lab = cv2.connectedComponents(hard)
    top_ids = set(np.unique(lab[:40])) - {0}
    hard = np.isin(lab, list(top_ids)).astype(np.float32)
    hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    guide = (photo / 255).astype(np.float32)
    sky_a = cv2.ximgproc.guidedFilter(guide, hard, 4, 1e-3)
    sky_a = np.clip(sky_a, 0, 1)
    sky_a[: int(1900 * SCALE)] = np.maximum(sky_a[: int(1900 * SCALE)], hard[: int(1900 * SCALE)])
    fg_a = 1 - sky_a

    # ---------------------------------------------------------------- fondo azul + capa de nubes
    ys_canvas = np.arange(H, dtype=np.float32)
    grad = sky_gradient(ys_canvas)  # (H,3)
    B = np.repeat(grad[EXT:, None, :], pw, 1)
    # ligera variación horizontal medida: el lado derecho es un poco más saturado
    xr = np.linspace(-1, 1, pw, dtype=np.float32)[None, :, None]
    B = B + xr * np.array([-5, -3, 2], np.float32)

    qB = np.maximum(B[..., 2] - B[..., 0], 40)
    q = b - r
    a = np.clip(1 - q / qB, 0, 1)
    # el blanco muy brillante es nube aunque tenga algo de azul
    a = np.maximum(a, smoothstep(185, 235, L) * 0.9)
    a = cv2.GaussianBlur(a, (0, 0), 0.7)
    C = (photo - (1 - a[..., None]) * B) / np.maximum(a, 0.05)[..., None]
    C = np.clip(C, 0, 255)

    # --- arreglo de la mancha gris (arriba a la derecha): se reilumina como cuerpo de nube
    yy, xx = np.mgrid[0:ph, 0:pw].astype(np.float32)
    region = smoothstep(1700 * SCALE, 2050 * SCALE, xx) * (1 - smoothstep(1150 * SCALE, 1400 * SCALE, yy))
    Cl = C.mean(2)
    grayness = smoothstep(215, 160, Cl) * smoothstep(0.1, 0.35, a)
    sm = cv2.GaussianBlur(grayness * region, (0, 0), 25)
    sm = np.clip(sm * 1.6, 0, 1)
    detail = fbm((ph, pw), 11, octaves=6, base=260)
    lit = np.stack([228 + 18 * detail, 232 + 16 * detail, 242 + 10 * detail], -1)
    # conserva el sombreado original atenuado para que no quede plano
    shade = (Cl - cv2.GaussianBlur(Cl, (0, 0), 60))[..., None] * 0.6
    C = C * (1 - sm[..., None]) + np.clip(lit + shade, 0, 255) * sm[..., None]
    a_boost = np.clip(a + 0.35 * (detail - 0.35), 0, 1)
    a = a * (1 - sm * 0.55) + a_boost * (sm * 0.55)

    # --- nubes detrás de la pirámide / árboles (visibles sólo con el paralaje)
    a = a * sky_a
    hole = (fg_a > 0.02).astype(np.uint8)
    small = 4
    a_s = cv2.resize(a, (pw // small, ph // small), interpolation=cv2.INTER_AREA)
    h_s = cv2.resize(hole, (pw // small, ph // small), interpolation=cv2.INTER_NEAREST)
    h_s = cv2.dilate(h_s, np.ones((5, 5), np.uint8))
    a_in = cv2.inpaint((a_s * 255).astype(np.uint8), h_s, 12, cv2.INPAINT_TELEA).astype(np.float32) / 255
    a_in = cv2.resize(a_in, (pw, ph), interpolation=cv2.INTER_CUBIC)
    # bajo el horizonte del bosque no hay que inventar nada: se atenúa
    a_in *= 1 - smoothstep(2650 * SCALE, 2950 * SCALE, yy)
    a = a * sky_a + a_in * fg_a

    # --- extensión superior: nada de espejos. Las nubes de la franja alta de la foto se
    # erosionan con ruido "billow" para que sus cimas se disuelvan en el azul; por encima,
    # el shader añade cirros procedurales (capa alta con movimiento propio).
    K = 760
    yk = np.repeat(np.arange(K, dtype=np.float32)[:, None], pw, 1)       # 0 = borde superior foto
    xk = np.repeat(np.arange(pw, dtype=np.float32)[None, :], K, 0)
    edge1d = fbm((8, pw), 21, octaves=4, base=520)[4]                     # perfil de cimas
    edge = K * 0.22 + (edge1d - 0.5) * K * 0.55
    billow = 1 - np.abs(2 * fbm((K, pw), 22, octaves=3, base=200) - 1)
    soft = fbm((K, pw), 23, octaves=3, base=360)
    haze = 1 - smoothstep(900, 1500, xk)                                  # izquierda: bruma
    y2 = yk + ((billow - 0.6) * 70 + (soft - 0.5) * 110) * (1 - haze) + (soft - 0.5) * 140 * haze
    w = 45 + 190 * haze
    edge = np.clip(edge, w + 110, K - w - 20)                             # nunca cortar en y=0
    keep = smoothstep(edge - w, edge + w, y2)
    keep = cv2.GaussianBlur(keep, (0, 0), 1.5)
    a[:K] *= keep
    ext_a = np.zeros((EXT, pw), np.float32)
    ext_C = np.repeat(C[:1].copy(), EXT, 0)

    clouds_a = np.concatenate([ext_a, a], 0)
    clouds_C = np.concatenate([ext_C, C], 0)
    clouds_C = fill_holes(clouds_C, np.clip(clouds_a * 1.5, 0, 1) ** 2)

    # ---------------------------------------------------------------- primer plano y máscaras
    fg_rgb = fill_holes(photo, np.clip(fg_a * 2 - 0.5, 0, 1))
    horizon = 2990 * SCALE
    gness = smoothstep(4, 20, g - np.maximum(r, b))
    grass = gness * smoothstep(horizon - 25, horizon + 10, yy) * fg_a
    stone_like = smoothstep(40, 14, sat) * smoothstep(40, 70, L)
    # la pirámide: todo lo que hay entre sus aristas izquierda y derecha por encima del césped
    x_left = np.interp(yy, [1990 * SCALE, 3012 * SCALE], [1180 * SCALE, 360 * SCALE])
    x_right = np.interp(yy, [2100 * SCALE, 2995 * SCALE], [1720 * SCALE, 2730 * SCALE])
    inside = smoothstep(x_left - 6, x_left + 6, xx) * (1 - smoothstep(x_right - 10, x_right + 10, xx))
    stone = np.clip(inside * (1 - grass) * fg_a, 0, 1)
    stone = np.maximum(stone, stone_like * fg_a * (1 - grass) * (yy < horizon))
    trees = np.clip(fg_a * (1 - grass) * (1 - stone), 0, 1)
    masks = np.stack([grass, stone, trees], -1)
    masks = cv2.resize(masks, (pw // 2, ph // 2), interpolation=cv2.INTER_AREA)

    sky_bg = np.repeat(grad[:, None, :], 8, 1)
    sky_bg = cv2.resize(sky_bg, (8, 1024), interpolation=cv2.INTER_AREA)

    def wjpg(name, arr, q=93):
        cv2.imwrite(str(out / name), np.clip(arr, 0, 255).astype(np.uint8)[..., ::-1] if arr.ndim == 3 else
                    np.clip(arr, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, q])

    wjpg("clouds_rgb.jpg", clouds_C, 90)
    wjpg("clouds_a.jpg", clouds_a * 255, 92)
    wjpg("fg_rgb.jpg", fg_rgb, 94)
    cv2.imwrite(str(out / "fg_a.png"), (fg_a * 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    wjpg("masks.jpg", masks * 255, 90)
    cv2.imwrite(str(out / "sky_bg.png"), np.clip(sky_bg, 0, 255).astype(np.uint8)[..., ::-1])
    json.dump({
        "canvas": [W, H],
        "photo": {"x": 0, "y": EXT, "w": pw, "h": ph},
        "horizonY": EXT + horizon,
        "pyramidTopY": EXT + 2040 * SCALE,
        "note": "coordenadas en píxeles de lienzo, origen arriba-izquierda",
    }, open(out / "layout.json", "w"), indent=2)

    # vista previa compuesta (estática) para revisión
    bg = np.repeat(grad[:, None, :], W, 1)
    comp = bg * (1 - clouds_a[..., None]) + clouds_C * clouds_a[..., None]
    comp[EXT:] = comp[EXT:] * (1 - fg_a[..., None]) + photo * fg_a[..., None]
    cv2.imwrite(str(out.parent / "preview_static.jpg"), np.clip(comp, 0, 255).astype(np.uint8)[..., ::-1],
                [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
