// Distribución del campus, sacada de la foto satelital (1 px ≈ 1 m).
// Coordenadas del mundo en metros: x = este, z = sur, y = altura.
// El origen es el centro de la imagen satelital.

// El complejo de edificios está girado respecto al norte, alineado con la
// carretera QRO 20. Sus piezas se definen en coordenadas locales (lx, lz):
// lx corre a lo largo de la carretera (hacia el ENE) y lz apunta hacia ella.
export const COMPLEX = { x: 70, z: 125, rot: 0.42 };

const cosR = Math.cos(COMPLEX.rot);
const sinR = Math.sin(COMPLEX.rot);

export function toWorld(lx, lz) {
  return {
    x: COMPLEX.x + lx * cosR + lz * sinR,
    z: COMPLEX.z - lx * sinR + lz * cosR,
  };
}

export function toLocal(x, z) {
  const dx = x - COMPLEX.x;
  const dz = z - COMPLEX.z;
  return { lx: dx * cosR - dz * sinR, lz: dx * sinR + dz * cosR };
}

// Rectángulo en coordenadas locales del complejo -> rectángulo del mundo.
export function localRect(x0, x1, z0, z1) {
  const c = toWorld((x0 + x1) / 2, (z0 + z1) / 2);
  return { cx: c.x, cz: c.z, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, rot: COMPLEX.rot };
}

export function worldRect(x0, x1, z0, z1) {
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, rot: 0 };
}

// Alturas de referencia (m) de las zonas planas.
export const LEVEL = {
  patio: 0,
  entrancePlatform: 2.5,
  parking: 4,
  dropOff: 0.5,
  fields: 28,
};

// Zonas niveladas del terreno. blend = distancia de transición al terreno natural.
export const PADS = [
  { name: 'complejo', ...localRect(-54, 62, -50, 46), y: LEVEL.patio, blend: 14 },
  { name: 'plataforma', ...localRect(58, 136, -44, 32), y: LEVEL.patio, blend: 10 },
  { name: 'estacionamiento', ...localRect(-118, -55, -66, -14), y: LEVEL.parking, blend: 10 },
  { name: 'bajada', ...localRect(-96, -54, -2, 36), y: LEVEL.dropOff, blend: 10 },
  { name: 'edificio norte', ...localRect(-36, 4, -78, -46), y: LEVEL.patio, blend: 10 },
  { name: 'canchas', ...worldRect(-218, -40, -238, -66), y: LEVEL.fields, blend: 22 },
  { name: 'explanada grava', ...worldRect(-212, -133, -27, 47), y: 14, blend: 14 },
];

// Caminos. width = ancho de la superficie; kind: 'dirt' (terracería) o 'asphalt'.
export const ROADS = [
  {
    name: 'Carretera QRO 20',
    kind: 'asphalt',
    width: 13,
    points: [[-420, 300], [-250, 290], [-60, 264], [40, 240], [140, 196], [246, 158], [420, 110]],
  },
  {
    // Entrada desde la carretera, pasa junto al estacionamiento y sube al cerro.
    name: 'Camino a las canchas (oeste)',
    kind: 'dirt',
    width: 7,
    points: [[-34, 256], [-38, 222], [-40, 195], [-46, 165], [-60, 122], [-80, 62], [-104, 12], [-124, -24], [-134, -46], [-128, -62]],
  },
  {
    name: 'Camino a las canchas (este)',
    kind: 'dirt',
    width: 6,
    points: [[150, 42], [120, 24], [95, 10], [70, 0], [45, -15], [20, -28], [0, -42], [-12, -64], [-16, -100], [-18, -140], [-22, -205]],
  },
  {
    name: 'Enlace del complejo',
    kind: 'dirt',
    width: 6,
    points: [[48, 66], [42, 40], [42, 10], [45, -15]],
  },
  {
    name: 'Explanada bajo las canchas',
    kind: 'dirt',
    width: 8,
    points: [[-150, -60], [-110, -62], [-60, -62], [-12, -64]],
  },
  {
    name: 'Brecha del cerro',
    kind: 'dirt',
    width: 5,
    points: [[-12, -66], [45, -100], [95, -130], [112, -185]],
  },
];

// Campos deportivos de arriba (Centurions SHV).
export const FIELDS = {
  football: { cx: -96, cz: -155, w: 70, l: 118 },
  soccer1: { cx: -188, cz: -187, w: 31, l: 50 },
  soccer2: { cx: -188, cz: -127, w: 31, l: 50 },
};

// Zonas con nombre para el HUD y el minimapa.
export const ZONES = [
  { name: 'Edificio de salones', ...localRect(-42, -26, -28, 40), priority: 3 },
  { name: 'Edificio de salones', ...localRect(-30, 46, 24, 40), priority: 3 },
  { name: 'Patio y canchas de básquet', ...localRect(-26, 58, -44, 24), priority: 2 },
  { name: 'Entrada principal · Alberca', ...localRect(56, 136, -44, 32), priority: 3 },
  { name: 'Estacionamiento', ...localRect(-118, -54, -66, -14), priority: 2 },
  { name: 'Campo de americano · Centurions', ...worldRect(-140, -52, -222, -88), priority: 3 },
  { name: 'Canchas de fútbol', ...worldRect(-210, -166, -218, -96), priority: 3 },
];

export const SPAWN = { lx: -18, lz: 0, yaw: COMPLEX.rot - Math.PI / 2 };
