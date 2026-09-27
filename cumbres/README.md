# Cumbres del Lago 3D

Cumbres del Lago (Juriquilla, Querétaro) en 3D, hecho con
[three.js](https://threejs.org/). Se juega en el navegador: puedes caminar,
subirte a cualquier auto y manejar por las calles reales.

## Qué hay en esta versión (0.1)

- **Cada casa en su lugar real**: 6,769 construcciones con la forma y el
  tamaño que tienen en las imágenes satelitales (Cumbres del Lago y 250 m
  alrededor). Las hileras de casas pegadas se parten en casas individuales.
- **Fachada hacia la calle**: cochera con portón, puerta, ventanas, volado,
  pretil, tinaco negro y a veces calentador solar o tanque de gas. Los
  colores y detalles se generan igual siempre para cada casa, pero no son los
  reales. Para eso está el editor (abajo).
- **Calles reales** de OpenStreetMap con sus nombres: el circuito Lago de
  Pátzcuaro, las calles "Lago…", las privadas (con adoquín), banquetas,
  postes y glorietas.
- **Relieve real**, el lago de Juriquilla, la Pista Cumbres y los parques con
  jacarandas, fresnos y palmas. Mezquites en el monte de alrededor.
- **34 accesos de privada** en su ubicación real: portones con caseta, y
  plumas que se levantan cuando te acercas.
- **Autos**: un sedán rojo al empezar y cientos de autos estacionados en las
  cocheras. Te puedes subir a cualquiera.
- Minimapa con las casas y calles reales, nombre de la calle donde estás,
  velocímetro, sonido de motor y claxon.

## Editor de casas

Como no hay fotos de cada casa, cada una trae un diseño inventado. Para
dejarla como es en la vida real: párate enfrente, mírala y presiona **P**
(en celular, el botón **Casa**). Puedes cambiar el color de los muros, el
panel de piedra o madera, los pisos, de qué lado está la cochera, el portón,
la azotea y más.

Los cambios se guardan en tu navegador. Para que queden en el juego para
todos, usa **Copiar cambios** y pega el texto en
`src/data/personalizadas.json` (o mándalo en el chat).

## Controles

| Tecla | A pie | En el auto |
| --- | --- | --- |
| W A S D / flechas | Caminar | Acelerar, frenar y dar vuelta |
| Shift | Correr | Turbo |
| Espacio | Saltar | Freno de mano (derrapar) |
| F o Enter | Subir al auto más cercano | Bajarte |
| C | | Cambiar cámara (atrás, lejos, conductor) |
| B | | Claxon |
| V | Volar (E / Q para subir y bajar) | |
| P | Editar la casa de enfrente | |
| M | Mapa grande | Mapa grande |
| R | Volver al inicio | Enderezar el auto en la calle |
| N | Apagar o prender el sonido | |
| H | Ocultar la ayuda | |

En celular: el lado izquierdo de la pantalla es el joystick (caminar o
manejar) y el derecho sirve para mirar. El botón amarillo sube y baja del auto.

## Para programadores

```bash
npm install
npm run dev      # servidor local con recarga
npm run build    # genera dist/index.html (un solo archivo, se abre con doble clic)
```

Los datos del mapa ya vienen en `src/data/mapa.json`. Para volver a
generarlos (por ejemplo, con una versión nueva de Overture):

```bash
pip install pyarrow shapely numpy pillow requests
npm run datos    # python3 scripts/datos.py
```

- `scripts/datos.py`: baja y limpia los datos reales y genera `mapa.json`.
- `src/mundo.js`: lectura del mapa, altura del terreno y calle más cercana.
- `src/terreno.js`: relieve, suelos, lago y cerros del horizonte.
- `src/calles.js`: asfalto, adoquín, banquetas, rayas y postes.
- `src/casas.js`: las casas (diseño de cada una y armado por zonas).
- `src/editor.js`: editor de casas.
- `src/vegetacion.js`: árboles y monte.
- `src/accesos.js`: portones, casetas y plumas de las privadas.
- `src/autos.js`: modelos de autos, autos estacionados y física de manejo.
- `src/jugador.js`, `src/controles.js`, `src/hud.js`, `src/sonido.js`.

## Fuentes de datos

- Casas: Microsoft Global ML Building Footprints y Google Open Buildings,
  vía [Overture Maps](https://overturemaps.org) (release 2026-09-23.1).
- Calles, parques, lago y accesos: © colaboradores de
  [OpenStreetMap](https://www.openstreetmap.org/copyright), vía Overture Maps.
- Relieve: [Terrain Tiles de AWS](https://registry.opendata.aws/terrain-tiles/) (SRTM).
