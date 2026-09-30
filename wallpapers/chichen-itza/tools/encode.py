"""Etapa 4 — codifica los fotogramas maestros (1320x2868) para cada dispositivo.

  python3 tools/encode.py <dir_frames> <dir_salida> [dispositivo]

El OPPO usa un render propio con bucle de 6 s (ColorOS limita los fondos de vídeo a
6 s): node tools/render.mjs --loop 6 --seconds 6 --out frames6
     python3 tools/encode.py frames6 dist oppo-find-x9-pro

Resoluciones nativas de pantalla:
  OPPO Find X9 Pro   1272 x 2772
  iPhone 16 Pro      1206 x 2622
  iPhone 15 Pro      1179 x 2556

Todas tienen ~19,5:9, igual que el maestro, así que basta un escalado lanczos y
un recorte centrado de unos pocos píxeles.
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
MASTER = (1320, 2868)
DEVICES = {
    "oppo-find-x9-pro": (1272, 2772),
    "iphone-16-pro": (1206, 2622),
    "iphone-15-pro": (1179, 2556),
}
LIVE_PHOTO_START, LIVE_PHOTO_SECONDS = 4.0, 3.0   # tramo con los zopilotes cruzando el cielo
STILL_T = 4.0


def vf(w, h):
    s = max(w / MASTER[0], h / MASTER[1])
    sw, sh = round(MASTER[0] * s / 2) * 2, round(MASTER[1] * s / 2) * 2
    return f"scale={sw}:{sh}:flags=lanczos+accurate_rnd+full_chroma_int,crop={w}:{h}"


COLOR = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]


def run(args):
    print(" ".join(args[-1:]), flush=True)
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def main(frames, out, only=None):
    frames, out = Path(frames), Path(out)
    src = ["-framerate", str(FPS), "-i", str(frames / "f%04d.png")]
    for name, (w, h) in DEVICES.items():
        if only and name != only:
            continue
        d = out / name
        d.mkdir(parents=True, exist_ok=True)
        still = int(STILL_T * FPS)
        run(["-i", str(frames / f"f{still:04d}.png"), "-vf", vf(w, h), "-frames:v", "1",
             str(d / f"chichen-itza-{w}x{h}.png")])
        x264 = ["-c:v", "libx264", "-preset", "slow", "-tune", "film", "-crf", "16", "-pix_fmt", "yuv420p",
                "-profile:v", "high", "-level:v", "5.1", "-g", str(FPS * 2), *COLOR, "-movflags", "+faststart"]
        if name.startswith("oppo"):
            # bucle completo (el frame siguiente al último == frame 0 → sin salto)
            run([*src, "-vf", vf(w, h), *x264, str(d / f"chichen-itza-live-{w}x{h}.mp4")])
        else:
            # iOS: fondo "Live Photo" (se reproduce ~3 s al despertar la pantalla)
            # H.264 4:2:0 exige dimensiones pares: 1179 → 1180 (iOS reencuadra 1 px, imperceptible)
            ve, he = w + w % 2, h + h % 2
            run(["-framerate", str(FPS), "-start_number", str(int(LIVE_PHOTO_START * FPS)),
                 "-i", str(frames / "f%04d.png"), "-frames:v", str(int(LIVE_PHOTO_SECONDS * FPS)),
                 "-vf", vf(ve, he), *x264, str(d / f"chichen-itza-livephoto-{ve}x{he}.mov")])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
