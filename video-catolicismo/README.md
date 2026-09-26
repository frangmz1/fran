# De Adán a hoy — la historia de la Iglesia Católica

El video terminado está en `historia-iglesia.mp4`.

Video animado de 3 minutos (1920×1080, 30 fps, sin voz ni música) en estilo
ilustración plana. Está narrado con textos en pantalla desde la fe católica.

Todo está dibujado y animado con código (SVG + JavaScript), así que cualquier
texto, color o tiempo se puede cambiar y volver a exportar.

## Escenas

| # | Tiempo | Capítulo |
|---|---|---|
| 0 | 0:00 | Portada: «De Adán a hoy» |
| 1 | 0:07 | La Creación y la caída |
| 2 | 0:21 | Noé (arca y arcoíris) y Abraham bajo las estrellas |
| 3 | 0:34 | Moisés: el Mar Rojo y el Sinaí |
| 4 | 0:47 | David, Jerusalén y los profetas |
| 5 | 0:59 | Jesús: Belén, Galilea y la cruz |
| 6 | 1:17 | Resurrección y Pentecostés (Pedro y las llaves) |
| 7 | 1:31 | Catacumbas, Constantino (313) y Nicea (325) |
| 8 | 1:44 | Catedrales y el Gran Cisma (1054) |
| 9 | 1:57 | Reforma (1517) y Concilio de Trento |
| 10 | 2:09 | Misiones y la Virgen de Guadalupe (1531) |
| 11 | 2:23 | Vaticano I y II, San Juan Pablo II |
| 12 | 2:37 | Hoy: 1.400 millones de católicos, León XIV |
| 13 | 2:50 | Cierre |

## Cómo usarlo

```bash
cd video-catolicismo
npm install
npm run render                          # exporta out/historia-iglesia.mp4
node render.js --stills 10,45.5,120     # capturas de prueba en out/stills/
```

Para verlo en el navegador con una barra de tiempo, sirve la carpeta
(`npx serve .` o `python3 -m http.server`) y abre `index.html`.
Con `?t=60` empieza en el segundo 60.

## Archivos

- `src/lib.js`: utilidades de dibujo, curvas de animación y cámara.
- `src/figures.js`: personajes y animales.
- `src/scenes-a.js`, `scenes-b.js`, `scenes-c.js`: las escenas y sus textos.
- `src/main.js`: línea de tiempo, subtítulos y capítulos.
- `render.js`: exportación cuadro por cuadro con Chromium y ffmpeg.

Los textos de cada escena están en la propiedad `captions`. Las palabras entre
`*asteriscos*` se resaltan en dorado.
