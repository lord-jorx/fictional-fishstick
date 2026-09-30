# El Castillo · Chichén Itzá — fondo de bloqueo animado

Fondo de pantalla animado (bucle perfecto de 16 s) creado a partir de una foto real de
El Castillo (Kukulcán), retocada y convertida en una escena 2.5D con Three.js.

| Dispositivo | Resolución nativa | Archivos |
|---|---|---|
| OPPO Find X9 Pro | 1272 × 2772 | `dist/oppo-find-x9-pro/` — vídeo en bucle `.mp4` + imagen `.png` |
| iPhone 16 Pro | 1206 × 2622 | `dist/iphone-16-pro/` — clip Live Photo `.mov` (3 s) + imagen `.png` |
| iPhone 15 Pro | 1179 × 2556 | `dist/iphone-15-pro/` — clip Live Photo `.mov` (3 s) + imagen `.png` |

Vista en vivo (tiempo real, WebGL): sirve `web/` con cualquier servidor estático y abre
`index.html`. En escritorio se muestra con forma de teléfono; la tecla **C** superpone un
reloj de bloqueo para comprobar la legibilidad.

## Qué se ha retocado de la foto

- Césped: calvos y tierra de la mitad derecha sustituidos por césped limpio de las mismas
  filas (misma escala de perspectiva), fundido con bordes irregulares.
- Camino de piedra, estacas, marcadores, placa y cartel azul sobre la hierba: eliminados.
- Turistas, barandillas y cuerdas junto a la línea de árboles: eliminados.
- Pegatina azul en la base de la pirámide y piedras sueltas junto a las cabezas de serpiente.
- Cielo: el velo gris liso arriba a la derecha (artefacto de HDR/lente) se reilumina como
  cuerpo de cúmulo con textura.
- Formato: la foto (3:4) se amplía a 19,5:9 con cielo nuevo por arriba. Las cimas de las
  nubes se disuelven en un cénit azul profundo, que es donde cae el reloj: blanco sobre
  azul, legible siempre.

## Qué se anima (todo periódico → sin salto en el bucle)

- **Nubes**: la capa de nubes se separa del azul (des-mezcla por "azulidad") y se anima con
  un flow-map de doble fase, la técnica de los cinemagraphs.
- **Cirros altos** procedurales con su propia velocidad (capa de profundidad extra).
- **Sombras de nubes** que barren el césped y la pirámide, proyectadas en perspectiva real
  sobre el plano del suelo: ruido periódico que avanza exactamente un periodo por bucle.
- **Rachas de viento** sobre el césped: brillo e inclinación proporcionales a 1/distancia.
- **Zopilotes** planeando en térmicas: modelo 3D con diedro, alabeo, el típico "tambaleo"
  del zopilote aura y la parte trasera del ala plateada.
- **Cámara**: vaivén y dolly muy suaves con paralaje por capas (cielo 0,06 · nubes 0,28 ·
  pirámide 1 · césped cercano hasta 2,6, con saturación suave).

## Cómo ponerlo

**OPPO Find X9 Pro (ColorOS):** copia `chichen-itza-live-1272x2772.mp4` al teléfono. En
*Fotos*, abre el vídeo → ⋮ → *Establecer como fondo de pantalla* → pantalla de bloqueo. Si tu
versión de ColorOS no ofrece fondo de vídeo para la pantalla de bloqueo, usa el `.png`.
Los nombres exactos del menú cambian entre versiones de ColorOS.

**iPhone 15 Pro / 16 Pro (iOS 17 o posterior):** iOS no acepta vídeos como fondo, solo
Live Photos. Convierte el `.mov` con una app como *intoLive* (gratis para clips ≤ 5 s) →
*Ajustes* → *Fondo de pantalla* → *Añadir* → *Fotos* → elige la Live Photo y activa el
icono Live. Se anima al despertar la pantalla. Si no quieres animación, usa el `.png`.

## Regenerar

```bash
pip install numpy opencv-contrib-python-headless pillow imageio-ffmpeg scipy
npm install
python3 tools/clean.py foto.jpg /tmp/clean.png        # 1. limpieza fotográfica
python3 tools/compose.py /tmp/clean.png web/assets    # 2. capas + máscaras
npm run build                                          # 3. escena Three.js → web/app.min.js
node tools/render.mjs --out /tmp/frames               # 4. 480 fotogramas 1320×2868 (Chromium headless)
python3 tools/encode.py /tmp/frames dist              # 5. vídeos e imágenes por dispositivo
```

`render.mjs` usa el Chromium de Playwright (`CHROMIUM=/ruta/a/chrome` para cambiarlo).
