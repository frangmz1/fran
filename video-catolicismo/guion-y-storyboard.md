# La historia de la Iglesia Católica, en pocas palabras

**Duración:** unos 3 min (180 s) · **Formato:** YouTube 16:9, 1920×1080, 30 fps
**Narrativa:** desde la fe católica · **Sin voz ni música** (solo texto en pantalla)
**Referencia de estilo:** canal *En pocas palabras* (Kurzgesagt)

---

## 1. Herramientas recomendadas (flujo de trabajo)

| Paso | Herramienta | Alternativas | Para qué |
|---|---|---|---|
| 1. Imágenes | **Midjourney** (usa `--sref` para mantener el estilo) | ChatGPT (imágenes), Ideogram, Leonardo.ai | Crear las 14 ilustraciones clave |
| 2. Animación | **Kling AI** (imagen a video) | Runway, Google Veo, Luma | Dar movimiento sutil a cada ilustración (5–10 s por clip) |
| 3. Edición | **CapCut** (gratis) | DaVinci Resolve, Canva Video | Unir los clips, poner textos, transiciones y exportar |

**Opción rápida y 100 % gratis:** genera solo imágenes y anímalas en CapCut con zoom lento y paneo (efecto "Ken Burns"). El resultado se ve muy parecido al canal.

### Consejos para que el estilo sea consistente
1. Genera primero la **Escena 0 (portada)**. Cuando te guste, usa su URL como referencia de estilo en todas las demás (`--sref URL` en Midjourney o "usa esta imagen como referencia de estilo" en ChatGPT).
2. Pega siempre el **bloque de estilo base** al final de cada prompt.
3. Mantén el mismo diseño de **Jesús** en las escenas 5 y 6 (usa `--cref` en Midjourney o sube la imagen anterior como referencia).
4. Genera sin texto dentro de la imagen. Los textos se ponen en CapCut.

---

## 2. Bloque de estilo base (pégalo al final de cada prompt)

```
flat vector illustration, bold simple geometric shapes, rounded minimalist characters with small dot eyes and no mouths, vibrant saturated colors on deep navy background, soft gradients, subtle glow and rim lighting, clean shading, cinematic composition, educational animation style, no text, 16:9 --ar 16:9 --style raw
```

**Paleta:** azul noche `#0E1A3A`, dorado `#F5B83D`, rojo cálido `#E8505B`, turquesa `#2EC4B6`, blanco cálido `#FFF4E0`

**Tipografía para CapCut:** Montserrat ExtraBold (títulos) y Montserrat SemiBold (texto). Blanco con sombra suave, o una caja redondeada semitransparente.

---

## 3. Storyboard escena por escena

> Cada escena tiene: **tiempo**, **texto en pantalla**, **prompt de imagen** (en inglés, porque funciona mejor), **movimiento** para Kling/Runway o CapCut y **transición**.
> Los textos son cortos a propósito: sin voz, el espectador necesita tiempo para leerlos (máximo 2 líneas a la vez).

---

### Escena 0 · Portada (0:00–0:06)
**Texto:** **LA HISTORIA DE LA IGLESIA** / *en 3 minutos*
**Prompt:** `a vast starry cosmos with warm golden light rays breaking through, a tiny glowing Earth below, a subtle silhouette of a cross formed by light in the center, awe-inspiring and peaceful,` + estilo base
**Movimiento:** zoom lento hacia la luz, estrellas titilando.
**Transición:** destello de luz blanca.

---

### Escena 1 · La Creación y la caída (0:06–0:20)
**Texto 1:** "En el principio, Dios creó el cielo y la tierra."
**Texto 2:** "Creó al hombre y a la mujer a su imagen… pero el pecado rompió esa amistad."
**Prompt:** `lush paradise garden with glowing trees and animals, Adam and Eve as simple rounded figures standing near a tree with a single red fruit, a small dark serpent coiled on a branch, half of the scene bright and golden, the other half fading into shadow,` + estilo base
**Movimiento:** paneo lateral de la luz a la sombra; la fruta brilla.
**Transición:** la pantalla se oscurece.

---

### Escena 2 · Noé y Abraham: la Alianza (0:20–0:34)
**Texto 1:** "Dios no abandonó a la humanidad: salvó a Noé…"
**Texto 2:** "…y prometió a Abraham una descendencia como las estrellas."
**Prompt:** `split composition: left side a wooden ark on calm waters under a bright rainbow; right side an old man with a staff in the desert at night looking up at countless glowing stars,` + estilo base
**Movimiento:** el arco iris aparece; las estrellas se multiplican.
**Transición:** barrido hacia el desierto.

---

### Escena 3 · Moisés y el Éxodo (0:34–0:48)
**Texto 1:** "Por medio de Moisés, Dios liberó a su pueblo de Egipto…"
**Texto 2:** "…y en el Sinaí le dio su Ley: los Diez Mandamientos."
**Prompt:** `Moses with raised staff as the Red Sea parts into two towering turquoise walls of water, a crowd of small rounded people walking through, in the background a mountain with glowing stone tablets at the top,` + estilo base
**Movimiento:** las aguas se abren; las tablas brillan.
**Transición:** zoom hacia las tablas.

---

### Escena 4 · Reyes y profetas (0:48–1:02)
**Texto 1:** "El rey David unió a Israel. Los profetas anunciaron…"
**Texto 2:** "…un Mesías, un Salvador, nacido de su linaje."
**Prompt:** `young king David with a harp and a small crown, the city of Jerusalem with its temple on a hill behind him, prophets on scrolls pointing toward a single bright star on the horizon,` + estilo base
**Movimiento:** la cámara sube hacia la estrella.
**Transición:** la estrella se convierte en la de Belén.

---

### Escena 5 · Jesús: nacimiento, vida y cruz (1:02–1:20)
**Texto 1:** "Dios se hizo hombre: Jesús nació de la Virgen María."
**Texto 2:** "Enseñó, sanó, perdonó… y dio su vida en la cruz por todos."
**Prompt A (Belén):** `humble nativity scene in a small stable at night, Mary and Joseph kneeling beside baby Jesus in a manger, a bright star above casting golden light, gentle and reverent,` + estilo base
**Prompt B (Cruz):** `a single wooden cross on a hill at dusk, dramatic orange and purple sky, small figures of Mary and John at its foot, solemn and respectful,` + estilo base
**Movimiento:** A: luz cálida que pulsa. B: el cielo se oscurece lentamente.
**Transición:** fundido a negro (1 s).

---

### Escena 6 · Resurrección y Pentecostés (1:20–1:34)
**Texto 1:** "Al tercer día, ¡resucitó!"
**Texto 2:** "Envió el Espíritu Santo y puso a Pedro como cabeza de su Iglesia."
**Prompt:** `an empty tomb with the stone rolled away and blinding golden light pouring out; upper room with twelve apostles and Mary with small flames above their heads, Peter holding two keys in the center,` + estilo base
**Movimiento:** estallido de luz desde la tumba; las llamas aparecen una por una.
**Transición:** destello dorado.

---

### Escena 7 · Mártires y el Imperio Romano (1:34–1:48)
**Texto 1:** "Los primeros cristianos fueron perseguidos, pero la fe creció."
**Texto 2:** "313: Constantino da libertad a la Iglesia. 325: Concilio de Nicea."
**Prompt:** `ancient Rome with the Colosseum, early Christians gathered in candlelit catacombs with a fish symbol painted on the wall, above ground a Roman emperor raising a banner with the Chi-Rho symbol,` + estilo base
**Movimiento:** la cámara sube de las catacumbas a la superficie.
**Transición:** barrido vertical.

---

### Escena 8 · La Edad Media (1:48–2:02)
**Texto 1:** "Monasterios y catedrales guardaron la fe y el saber."
**Texto 2:** "1054: el Gran Cisma separa a Oriente y Occidente."
**Prompt:** `a giant gothic cathedral with glowing stained glass windows, monks copying books in a monastery, universities and pilgrims around; in the sky a map of Europe cracking into east and west halves,` + estilo base
**Movimiento:** los vitrales se iluminan; el mapa se agrieta.
**Transición:** la grieta abre paso a la siguiente escena.

---

### Escena 9 · Reforma y Concilio de Trento (2:02–2:14)
**Texto 1:** "1517: la Reforma protestante divide a la cristiandad."
**Texto 2:** "La Iglesia responde con el Concilio de Trento y nuevos santos."
**Prompt:** `a church door with a paper nailed to it, contrasted with a grand council hall full of bishops in red and white at Trent, saints like Ignatius and Teresa as small figures in the foreground,` + estilo base
**Movimiento:** paneo de la puerta al concilio.
**Transición:** barrido horizontal hacia el mar.

---

### Escena 10 · El Evangelio llega a América (2:14–2:28)
**Texto 1:** "Misioneros llevaron el Evangelio al Nuevo Mundo."
**Texto 2:** "1531: la Virgen de Guadalupe se aparece a San Juan Diego."
**Prompt:** `sailing ships crossing a turquoise ocean toward the Americas; on a hill (Tepeyac) Our Lady of Guadalupe with her star-covered turquoise mantle and golden rays appears to Juan Diego, whose tilma is full of roses,` + estilo base
**Movimiento:** los barcos avanzan; los rayos de la Virgen brillan y caen pétalos.
**Transición:** zoom out hacia el globo terráqueo.

---

### Escena 11 · La Iglesia moderna (2:28–2:44)
**Texto 1:** "Concilios Vaticano I y II: la Iglesia dialoga con el mundo moderno."
**Texto 2:** "San Juan Pablo II lleva la fe a todos los rincones del planeta."
**Prompt:** `St. Peter's Basilica with thousands of bishops in white mitres entering; a globe with glowing flight paths connecting every continent, a pope figure in white waving from a small airplane,` + estilo base
**Movimiento:** las rutas se dibujan sobre el globo.
**Transición:** zoom hacia la Plaza de San Pedro.

---

### Escena 12 · Hoy (2:44–2:56)
**Texto 1:** "Hoy más de 1.400 millones de católicos en todo el mundo."
**Texto 2:** "Con el Papa León XIV, la Iglesia sigue su camino."
**Prompt:** `St. Peter's Square at golden hour packed with diverse people from every culture and continent, white smoke rising from a chimney, a pope in white on the central balcony,` + estilo base
**Movimiento:** la multitud se mueve suavemente; el humo blanco sube.
**Transición:** fundido lento a la portada.

---

### Escena 13 · Cierre (2:56–3:00)
**Texto:** "De Adán a hoy: una sola historia de amor entre Dios y la humanidad."
**Imagen:** reutiliza la portada (Escena 0) con la cruz de luz más brillante.
**Movimiento:** zoom out lento.

---

## 4. Checklist de edición en CapCut

1. Nuevo proyecto 16:9, 1080p, 30 fps.
2. Importa los clips en orden y ajusta la duración según los tiempos de arriba.
3. Pon los textos con **animación de entrada** "Pop" o "Fade up" (0,3 s) y déjalos al menos 4–5 s en pantalla.
4. Transiciones: casi siempre **corte o fundido rápido** (0,3–0,5 s), como en el canal. Nada de efectos exagerados.
5. Agrega una **línea de tiempo con los años** abajo (por ejemplo, "313 d.C.") como etiqueta pequeña.
6. Exporta: 1080p, 30 fps, alta calidad.
7. Más adelante puedes agregar voz y música sin rehacer nada.

---

## 5. Fechas clave (para verificar)

| Evento | Fecha |
|---|---|
| Edicto de Milán | 313 |
| Concilio de Nicea | 325 |
| Gran Cisma de Oriente | 1054 |
| Tesis de Lutero | 1517 |
| Aparición de Guadalupe | 1531 |
| Concilio de Trento | 1545–1563 |
| Concilio Vaticano I | 1869–1870 |
| Concilio Vaticano II | 1962–1965 |
| Pontificado de Juan Pablo II | 1978–2005 |
| Elección de León XIV | mayo de 2025 |
