# Sun Hills Valley 3D

> En este repo también está **[Cumbres del Lago 3D](cumbres/)**: la colonia de
> Juriquilla con sus casas reales, para caminar y manejar.

Mapa 3D de la preparatoria Sun Hills Valley (carretera QRO 20, Querétaro),
hecho con [three.js](https://threejs.org/). Se juega en el navegador.

## Qué hay en esta versión (0.1: solo el mapa)

- Terreno con el cerro: el complejo está junto a la carretera y el camino de
  terracería sube hasta las canchas de arriba.
- Edificio de salones de 3 pisos en forma de L, con pasillos abiertos, lockers
  azules, escaleras que sí se pueden subir y los volados de cristal.
- Patio con las canchas azules de básquet y la cancha de pasto sintético.
- Entrada principal: escalinata, letrero SHV, astas con banderas, edificio azul
  y el edificio de la punta amarilla (por fuera; la alberca va después).
- Estacionamiento, barda de ladrillo y la carretera QRO 20.
- Canchas de los Centurions: campo de americano con logo, gradas techadas,
  cabina blanca y dos canchas de fútbol con malla ciclónica.
- Mezquites, matorral, nopales y piedras.

## Controles

| Tecla | Acción |
| --- | --- |
| W A S D / flechas | Caminar |
| Shift | Correr |
| Espacio | Saltar |
| V | Volar (E / Q para subir y bajar) |
| M | Mapa grande |
| R | Volver al patio |
| H | Ocultar la ayuda |

En celular: el lado izquierdo de la pantalla es el joystick y el derecho sirve para mirar.

## Para programadores

```bash
npm install
npm run dev      # servidor local con recarga
npm run build    # genera dist/index.html (un solo archivo, se abre con doble clic)
```

- `src/layout.js`: posiciones y medidas de todo el campus (sacadas de la satelital).
- `src/terrain.js`: relieve, caminos y carretera.
- `src/campus.js`: edificios del complejo.
- `src/fields.js`: canchas de arriba.
- `src/vegetation.js`: árboles y plantas.
- `src/player.js`: movimiento y colisiones.
- `src/hud.js`: minimapa y controles táctiles.
