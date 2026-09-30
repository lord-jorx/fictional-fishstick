"""Etapa 1 — limpieza fotográfica del plate original (resolución completa 3072x4096).

Quita turistas, vallas, carteles, estacas, el camino de piedra y los calvos del
césped. Todo se hace con clonado Poisson desde zonas limpias de las MISMAS filas
(misma escala de perspectiva en el suelo) o con inpainting FSR para estructuras
finas sobre fondo oscuro.
"""
import sys
import cv2
import numpy as np

PAD = 64  # margen reflejado para poder clonar hasta el borde


def noise(shape, sigma, seed):
    r = np.random.default_rng(seed).standard_normal(shape).astype(np.float32)
    r = cv2.GaussianBlur(r, (0, 0), sigma)
    return r / (r.std() + 1e-6)


def clone(img, rect, dx, dy=0, ragged=0, seed=0):
    """Clona img[rect desplazado (dx,dy)] sobre rect con Poisson.
    ragged>0 deforma el borde de la máscara para que no haya costuras rectas."""
    x0, y0, x1, y1 = [v + PAD for v in rect]
    w, h = x1 - x0, y1 - y0
    src = img[y0 + dy:y1 + dy, x0 + dx:x1 + dx].copy()
    m = np.full((h, w), 255, np.uint8)
    if ragged:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        d = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy])
        d = d + noise((h, w), ragged * 0.8, seed) * ragged * 0.6 - ragged
        m = np.where(d > 0, 255, 0).astype(np.uint8)
    m[:2] = 0; m[-2:] = 0; m[:, :2] = 0; m[:, -2:] = 0
    return cv2.seamlessClone(src, img, m, (x0 + w // 2, y0 + h // 2), cv2.NORMAL_CLONE)


def inpaint(img, rect, mask=None, grow=2):
    x0, y0, x1, y1 = [v + PAD for v in rect]
    roi = img[y0 - 24:y1 + 24, x0 - 24:x1 + 24]
    hole = np.zeros(roi.shape[:2], np.uint8)
    if mask is None:
        hole[24:-24, 24:-24] = 255
    else:
        hole[24:-24, 24:-24] = mask
    if grow:
        hole = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1,) * 2))
    out = roi.copy()
    cv2.xphoto.inpaint(roi, 255 - hole, out, cv2.xphoto.INPAINT_FSR_FAST)
    img[y0 - 24:y1 + 24, x0 - 24:x1 + 24] = out
    return img


def bright_anomalies(img, rect, thr=18, k=41):
    """Máscara de objetos claros/coloreados (personas, cuerdas, postes) sobre follaje oscuro."""
    x0, y0, x1, y1 = [v + PAD for v in rect]
    roi = img[y0:y1, x0:x1].astype(np.float32)
    L = roi.mean(2)
    med = cv2.medianBlur(L.astype(np.uint8), k).astype(np.float32)
    sat = roi.max(2) - roi.min(2)
    satm = cv2.medianBlur(sat.astype(np.uint8), k).astype(np.float32)
    m = ((L - med) > thr) | ((sat - satm) > 28)
    return (m * 255).astype(np.uint8)


def paste(img, rect, dx=0, dy=0, feather=10, ragged=0, seed=0, match=False, flip=False, soft="ltrb"):
    """Copia con alfa suavizado (borde irregular opcional). match=True iguala la
    luminancia media del origen a la mediana del destino (robusta a los objetos a quitar)."""
    x0, y0, x1, y1 = [v + PAD for v in rect]
    w, h = x1 - x0, y1 - y0
    src = img[y0 + dy:y1 + dy, x0 + dx:x1 + dx].astype(np.float32)
    if flip:
        src = src[:, ::-1]
    dst = img[y0:y1, x0:x1].astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    f = feather if isinstance(feather, tuple) else (feather,) * 4      # (izq, arr, dch, abj)
    rag = noise((h, w), max(ragged * 0.8, 2), seed) * ragged * 0.5 - ragged * 0.5 if ragged else 0
    a = np.ones((h, w), np.float32)
    for dist, fe, side in ((xx, f[0], "l"), (yy, f[1], "t"), (w - 1 - xx, f[2], "r"), (h - 1 - yy, f[3], "b")):
        if side in soft:
            a = np.minimum(a, np.clip((dist + rag) / fe, 0, 1))
    a = a * a * (3 - 2 * a)
    if match:
        gain = np.median(dst.reshape(-1, 3), 0) / (np.median(src.reshape(-1, 3), 0) + 1e-3)
        src = src * gain
    out = src * a[..., None] + dst * (1 - a[..., None])
    img[y0:y1, x0:x1] = np.clip(out, 0, 255).astype(np.uint8)
    return img


def lawn_spots(img, y_from):
    """Calvos/piedras en el césped: baja 'verdosidad' respecto al entorno."""
    f = img.astype(np.float32)
    G = f[..., 1] - (f[..., 0] + f[..., 2]) / 2
    Gm = cv2.GaussianBlur(G, (0, 0), 40)
    L = f.mean(2); Lm = cv2.GaussianBlur(L, (0, 0), 40)
    m = ((G < Gm - 9) | (np.abs(L - Lm) > 26)) & (G < 24)
    m[: y_from + PAD] = False
    m = cv2.morphologyEx(m.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    return cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))


def main(src_path, out_path):
    base = cv2.imread(src_path)
    img = cv2.copyMakeBorder(base, PAD, PAD, PAD, PAD, cv2.BORDER_REFLECT_101)

    # --- objetos pequeños sobre la piedra / junto a las cabezas de serpiente
    img = inpaint(img, (2580, 2908, 2602, 2932))            # pegatina azul en la pirámide
    img = inpaint(img, (1730, 2988, 1766, 3008))            # piedras sueltas junto a la cabeza izq.
    img = inpaint(img, (1856, 2992, 1900, 3014))            # piedras junto a la cabeza dcha.
    x0, y0 = 2390 + PAD, 2976 + PAD                           # cartel azul: sólo sus píxeles
    roi = img[y0:y0 + 26, x0:x0 + 26].astype(np.int16)
    img = inpaint(img, (2390, 2976, 2416, 3002), ((roi[..., 0] - roi[..., 2]) > 12).astype(np.uint8) * 255, grow=3)
    img = inpaint(img, (1460, 2990, 1476, 3018))            # mástil de la estaca central
    img = inpaint(img, (2834, 2950, 2858, 2998))            # poste de la cuerda (derecha)

    # --- línea de árboles: personas, barandillas y cuerdas -> follaje de más arriba
    img = paste(img, (-40, 2925, 360, 3021), dy=-92, feather=8, ragged=6, seed=1, match=True)
    img = paste(img, (2718, 2915, 3112, 2996), dy=-88, feather=14, ragged=10, seed=2, match=True)

    # --- césped lejano: estacas, planta, marcadores, franja de piedras
    img = paste(img, (-40, 3004, 140, 3112), dx=200, feather=10, ragged=6, seed=5)
    img = paste(img, (522, 3036, 594, 3084), dx=96, feather=10, ragged=5, seed=6)
    img = paste(img, (812, 3016, 902, 3104), dx=-120, feather=12, ragged=6, seed=7)
    img = paste(img, (530, 3084, 760, 3116), dx=250, feather=8, ragged=4, seed=8)
    img = paste(img, (1428, 3014, 1518, 3086), dx=-130, feather=12, ragged=6, seed=9)

    # --- camino de piedra y franja bajo el zócalo derecho: césped de filas inferiores
    img = paste(img, (1480, 3019, 2010, 3076), dy=74, feather=(90, 5, 8, 8), ragged=6, seed=11, match=True)
    img = paste(img, (1990, 2999, 3112, 3074), dy=74, feather=6, ragged=4, seed=12)

    img = paste(img, (2526, 2996, 2664, 3017), dy=17, feather=(6, 3, 6, 4), ragged=3, seed=14)  # resto de la placa
    img = paste(img, (2526, 2984, 2606, 3004), dx=-112, feather=(8, 3, 8, 3), ragged=2, seed=15)          # su esquina sobre el zócalo

    # --- césped cercano: agujero oscuro a la izquierda y todos los calvos de la derecha
    img = paste(img, (20, 3880, 300, 4060), dx=300, feather=40, ragged=20, seed=3)
    img = paste(img, (1500, 3280, 3136, 4160), dx=-1500, feather=70, ragged=50, seed=4, soft="lt")

    # --- manchas residuales detectadas automáticamente
    m = lawn_spots(img, 3120)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    bad = m > 0
    for i in range(1, n):
        x, y, w, h, _ = stats[i]
        if w * h < 60:
            continue
        best = None
        for dx in (-260, 260, -420, 420, -600, 600, -800, 800):
            sx0, sx1 = x + dx, x + w + dx
            if sx0 - 12 < 0 or sx1 + 12 > img.shape[1] or x - 12 < 0 or x + w + 12 > img.shape[1] \
                    or y + h + 12 > img.shape[0]:
                continue
            c = bad[y:y + h, sx0:sx1].mean()
            if best is None or c < best[0]:
                best = (c, dx)
        if best is None:
            continue
        r = (x - PAD - 12, y - PAD - 12, x - PAD + w + 12, y - PAD + h + 12)
        img = paste(img, r, dx=best[1], feather=12, ragged=6, seed=100 + i)

    out = img[PAD:-PAD, PAD:-PAD]
    cv2.imwrite(out_path, out, [cv2.IMWRITE_PNG_COMPRESSION, 3])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
