// Complejo principal: edificio de salones, patio con canchas, entrada con el
// edificio de la punta amarilla (alberca), estacionamiento y barda.
import * as THREE from 'three';
import { COMPLEX, LEVEL, toWorld } from './layout.js';
import { Kit } from './kit.js';
import { fieldCanvas, canvasTexture, rand } from './textures.js';

const FH = 3.8; // altura de entrepiso
const TOP = FH * 3; // azotea del edificio de salones

export function buildCampus(mats, colliders, heightAt, T) {
  const root = new THREE.Group();
  const kit = new Kit(mats, colliders);
  const trees = []; // árboles de ornato (x, z, y, escala) para vegetation.js
  const animated = [];

  const frameLocal = (ox, oz, phi = 0, y = 0) => {
    const w = toWorld(ox, oz);
    kit.setFrame(w.x, y, w.z, COMPLEX.rot + phi);
  };
  const localTree = (lx, lz, y, s = 1) => {
    const w = toWorld(lx, lz);
    trees.push({ x: w.x, z: w.z, y, s });
  };

  // ---------------------------------------------------------------- patio
  frameLocal(0, 0);
  kit.span('concrete', -26, 58, -0.4, 0.04, -44, 24);
  // Banqueta perimetral bajo los pasillos del edificio.
  kit.span('tile', -30, -26, -0.2, 0.08, -18, 24, { collide: false });
  kit.span('tile', -30, 36, -0.2, 0.08, 24, 28);
  // Jardineras con pasto a los lados de la entrada.
  kit.span('lawn', 40, 58, -0.2, 0.1, 4, 24);
  kit.span('lawn', 40, 58, -0.2, 0.1, -44, -38);

  // Canchas de básquet (azules con zona amarilla, como en las fotos).
  root.add(courtMesh(-8, 12, 28, 15), courtMesh(-8, -6, 28, 15), courtMesh(24, -4, 20, 12, true));
  for (const [cz, ends] of [[12, [-22.6, 6.6]], [-6, [-22.6, 6.6]]]) {
    hoop(kit, ends[0], cz, 1);
    hoop(kit, ends[1], cz, -1);
  }
  // Cancha de pasto sintético del patio.
  root.add(turfField(-8, -30, 26, 15));
  soccerGoal(kit, -21.5, -30, 1, 3, 2);
  soccerGoal(kit, 5.5, -30, -1, 3, 2);

  // Jardineras redondas de piedra con árbol.
  for (const [lx, lz] of [[46, 18], [52, 8], [46, -41], [-20, 20], [30, 20]]) {
    planter(kit, lx, lz, 1.4);
    localTree(lx, lz, 0.7, 0.8);
  }

  // ---------------------------------------------------- edificio de salones
  // Ala oeste: pasillo mirando al patio (hacia +lx).
  frameLocal(-30, 0, -Math.PI / 2);
  classWing(kit, { a0: -38, a1: 18, c0: -24, c1: 18, cores: [-6], endParapet: 'start' });
  // Ala sur: pasillo mirando al patio (hacia -lz), junto a la carretera.
  frameLocal(0, 28, 0);
  classWing(kit, { a0: -30, a1: 36, c0: -30, c1: 36, cores: [8], endParapet: 'end' });
  // Volados de cristal (los "balcones" que salen en las fotos).
  frameLocal(36, 28, 0);
  cantilever(kit, 0, 5, 1);
  frameLocal(-30, -18, -Math.PI / 2);
  cantilever(kit, 0, 5, -1);

  // ------------------------------------------ entrada y edificio de la alberca
  frameLocal(0, 0);
  const P = LEVEL.entrancePlatform;
  // Plataforma elevada.
  kit.span('concrete', 60, 136, -2, P, -44, 32, { collide: true });
  kit.span('stone', 59.6, 60.05, -0.4, P + 0.02, -44, -14);
  kit.span('stone', 59.6, 60.05, -0.4, P + 0.02, -2, 32);
  // Escalinata principal.
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const x0 = 56 + i * 0.4;
    kit.span('concrete', x0, 60, -0.2, (i + 1) * (P / steps), -14, -2, { collide: true });
  }
  // Muros blancos a los lados de la escalinata.
  for (const z of [-14.4, -2]) {
    for (let k = 0; k < 5; k++) {
      const x0 = 55.6 + k * 0.8;
      kit.span('white', x0, x0 + 0.8, -0.2, 1.2 + (k + 1) * 0.5, z, z + 0.4, { collide: true });
    }
  }
  // Jardín de la plataforma.
  kit.span('lawn', 61, 71, P, P + 0.08, 2, 30);
  kit.span('lawn', 74, 130, P, P + 0.08, 25, 31);
  for (const lz of [8, 17, 26]) {
    planter(kit, 66, lz, 1.2, P);
    localTree(66, lz, P + 0.7, 0.75);
  }

  // Letrero SHV sobre muro de piedra.
  kit.span('stone', 58.6, 59.6, -0.2, 1.9, -38, -16, { collide: true });
  kit.span('white', 58.6, 59.6, 1.9, 3.6, -38, -16, { collide: true });
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 2.4),
    new THREE.MeshStandardMaterial({ map: T.signShv, roughness: 0.6 }),
  );
  placeLocal(sign, 58.58, 2.75, -27, -Math.PI / 2);
  sign.scale.set(1, 0.62, 1);
  root.add(sign);

  // Astas con banderas.
  const flags = [
    { lz: -34, tex: T.flagSchool },
    { lz: -29, tex: T.flagMx },
    { lz: -24, tex: T.flagSchool },
  ];
  for (const f of flags) {
    kit.box('steel', 51, 7, f.lz, 0.18, 14, 0.18, { collide: true });
    kit.box('concrete', 51, 0.15, f.lz, 1, 0.3, 1);
    const flag = makeFlag(f.tex);
    placeLocal(flag.mesh, 51.1, 12.4, f.lz, COMPLEX.rot);
    flag.mesh.rotation.y = rand() * 0.6;
    root.add(flag.mesh);
    animated.push(flag);
  }

  // Edificio azul junto a la entrada.
  kit.span('blue', 66, 82, P, P + 7, -42, -20, { collide: true });
  kit.span('roofGray', 66, 82, P + 7, P + 7.3, -42, -20);
  for (let i = 0; i < 4; i++) {
    const z = -39 + i * 5;
    kit.span('darkGlass', 65.9, 66, P + 1, P + 2.6, z, z + 3);
    kit.span('darkGlass', 65.9, 66, P + 4.2, P + 5.6, z, z + 3);
  }
  // Toldo café frente al edificio azul.
  kit.span('awning', 61, 66, P + 3.1, P + 3.25, -40, -22);
  for (const z of [-40, -31, -22]) kit.box('steel', 61.2, P + 1.55, z, 0.12, 3.1, 0.12, { collide: true });

  // Vestíbulo de entrada con puertas de vidrio.
  kit.span('white', 66, 72, P, P + 7.5, -16, -1, { collide: true });
  kit.span('darkGlass', 65.9, 66, P, P + 3.2, -12, -5);
  kit.span('steel', 65.85, 66, P + 3.2, P + 3.4, -12.2, -4.8);

  // Cuerpo principal (alberca adentro).
  const B = { x0: 72, x1: 128, z0: -18, z1: 24, h: 12 };
  kit.span('panel', B.x0, B.x1, P, P + B.h, B.z0, B.z1, { collide: true });
  kit.span('roofGray', B.x0 - 0.2, B.x1 + 0.2, P + B.h, P + B.h + 0.9, B.z0 - 0.2, B.z1 + 0.2);
  // Paneles solares en la azotea (lado norte).
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 9; c++) {
      kit.span('solar', 76 + c * 5.6, 80.8 + c * 5.6, P + B.h + 1.1, P + B.h + 1.25, -16 + r * 3, -13.8 + r * 3);
    }
  }
  // Fachada sur (hacia la carretera).
  for (let c = 0; c < 9; c++) {
    for (const y of [7.4, 9.9]) {
      const x = 74 + c * 2.2;
      kit.span('darkGlass', x, x + 1.1, P + y - 0.6, P + y + 0.5, B.z1, B.z1 + 0.05);
    }
  }
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) {
      maroonWindow(kit, 95 + c * 2.6, P + 4.5 + r * 2.4, B.z1, 1);
    }
  }
  kit.span('glass', 104, 114, P + 3.5, P + 10.8, B.z1, B.z1 + 0.08);
  for (let c = 0; c <= 5; c++) kit.span('white', 104 + c * 2 - 0.08, 104 + c * 2 + 0.08, P + 3.5, P + 10.8, B.z1, B.z1 + 0.14);
  kit.span('white', 104, 114, P + 7.1, P + 7.25, B.z1, B.z1 + 0.14);
  for (let c = 0; c < 3; c++) maroonWindow(kit, 116 + c * 2.6, P + 9.9, B.z1, 1);
  for (let c = 0; c < 3; c++) kit.span('darkGlass', 119.5 + c * 2.7, 121.8 + c * 2.7, P + 9.6, P + 10.6, B.z1, B.z1 + 0.05);
  // Fachada oeste (frente al patio): dos filas de ventanas cuadradas.
  for (let c = 0; c < 10; c++) {
    for (const y of [5.2, 7.6]) {
      const z = 1 + c * 2.2;
      kit.span('darkGlass', B.x0 - 0.05, B.x0, P + y - 0.55, P + y + 0.55, z, z + 1.1);
    }
  }
  // Fachada norte: ventanal de la alberca hacia el cerro.
  kit.span('glass', 100, 126, P + 3, P + 10.5, B.z0 - 0.08, B.z0);
  for (let c = 0; c <= 13; c++) kit.span('white', 100 + c * 2 - 0.08, 100 + c * 2 + 0.08, P + 3, P + 10.5, B.z0 - 0.14, B.z0);
  kit.span('white', 100, 126, P + 6.7, P + 6.85, B.z0 - 0.14, B.z0);
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) maroonWindow(kit, 80 + c * 2.6, P + 4.5 + r * 2.4, B.z0, -1);
  }

  // Punta amarilla.
  kit.setFrame(0, 0, 0, 0);
  frameLocal(0, 0);
  kit.addGeometry('yellow', yellowBlade(), 71.2, P, -0.6, -2.5);
  kit.collider(70.4, P, 0.2, 1.4, 0.5, 6, -2.5);

  // ------------------------------------------------ edificio norte (por confirmar)
  kit.span('panel', -31, -1, 0, 8, -74, -52, { collide: true });
  kit.span('roofGray', -31.2, -0.8, 8, 8.4, -74.2, -51.8);
  for (let c = 0; c < 7; c++) {
    for (const y of [1.2, 5]) {
      const x = -29 + c * 4;
      kit.span('darkGlass', x, x + 2.4, y, y + 1.5, -51.95, -51.9);
    }
  }
  kit.span('darkGlass', -18, -14, 0, 2.6, -51.95, -51.85);

  // --------------------------------------------------------- estacionamiento
  const L = LEVEL.parking;
  root.add(parkingLot(-86, -40, 64, 52, L));
  kit.span('stone', -57, -53.8, -1, L + 0.8, -66, -14, { collide: true });
  // Escaleras del patio al estacionamiento.
  for (let i = 0; i < 16; i++) {
    const x1 = -53.8 + (16 - i) * 0.35;
    kit.span('concrete', -53.8, x1, -0.3, (i + 1) * (L / 16), -44, -40, { collide: true });
  }
  kit.span('stone', -54.6, -48, -0.3, 0.6, -44.6, -44, { collide: true });
  kit.span('stone', -54.6, -48, -0.3, 0.6, -40, -39.4, { collide: true });
  const carColors = [0xd8d8d8, 0x1c1c1e, 0x9a9da3, 0x7a1f1f, 0x23406e, 0xf2f2f0, 0x3b3f45];
  for (let i = 0; i < 22; i++) {
    const row = i < 11 ? 0 : 1;
    const k = i % 11;
    if (rand() < 0.25) continue;
    const lx = -112 + k * 5.2;
    const lz = row === 0 ? -58 : -26;
    car(kit, root, lx, L, lz, row === 0 ? 0 : Math.PI, carColors[Math.floor(rand() * carColors.length)]);
  }

  // ----------------------------------------------------- barda de ladrillo
  frameLocal(0, 0);
  for (let lx = -60; lx < 72; lx += 6) {
    const w1 = toWorld(lx, 52), w2 = toWorld(lx + 6, 52);
    const base = Math.min(heightAt(w1.x, w1.z), heightAt(w2.x, w2.z)) - 0.6;
    kit.span('brick', lx, lx + 6.02, base, base + 3.2, 51.8, 52.2, { collide: true });
    kit.span('concrete', lx, lx + 6.02, base + 3.2, base + 3.35, 51.7, 52.3);
  }

  root.add(kit.build());
  return { group: root, trees, animated };
}

// ---------------------------------------------------------------------------

function placeLocal(obj, lx, y, lz, rotY) {
  const w = toWorld(lx, lz);
  obj.position.set(w.x, y, w.z);
  obj.rotation.y = COMPLEX.rot + rotY;
}

// Un ala del edificio de salones en su propio marco:
// a = a lo largo del ala, b = profundidad (0 = pared del pasillo, 10 = fachada exterior),
// el pasillo abierto ocupa b ∈ [-4, 0].
function classWing(kit, { a0, a1, c0, c1, cores, endParapet }) {
  const D = 10;
  const coreW = 4;
  // Bloque de salones, cortado donde van las escaleras.
  let cursor = a0;
  const segs = [];
  for (const c of cores) {
    segs.push([cursor, c]);
    cursor = c + coreW;
  }
  segs.push([cursor, a1]);
  for (const [s0, s1] of segs) {
    kit.span('panel', s0, s1, 0, TOP, 0, D, { collide: true });
  }
  // Azotea roja con pretil.
  kit.span('roofRed', a0, a1, TOP, TOP + 0.35, -4.2, D + 0.2);
  kit.span('plaster', c0, c1, TOP - 0.04, TOP, -4.2, 0);
  kit.span('white', a0, a1, TOP + 0.35, TOP + 1.2, D, D + 0.25);
  kit.span('white', a0, a1, TOP + 0.35, TOP + 1.2, -4.2, -3.95);

  // Fachada exterior: ventanas horizontales verdosas con repisa.
  for (let f = 0; f < 3; f++) {
    for (let s = a0 + 1.2; s + 3.4 < a1; s += 4.6) {
      if (cores.some((c) => s + 3.4 > c && s < c + coreW)) continue;
      kit.span('glass', s, s + 3.4, f * FH + 1.1, f * FH + 2.6, D, D + 0.06);
      kit.span('white', s - 0.15, s + 3.55, f * FH + 0.95, f * FH + 1.1, D, D + 0.3);
    }
    // Juntas horizontales entre pisos.
    kit.span('white', a0, a1, f * FH - 0.1, f * FH + 0.1, D, D + 0.12);
  }

  // Lado del pasillo: puertas, ventanas altas y lockers.
  for (let f = 0; f < 3; f++) {
    const y = f * FH;
    for (const [s0, s1] of segs) {
      for (let s = s0 + 0.6; s + 8.4 <= s1 + 0.01; s += 9) {
        kit.span('door', s, s + 1, y + 0.08, y + 2.2, -0.06, 0);
        kit.span('white', s - 0.08, s + 1.08, y + 2.2, y + 2.32, -0.08, 0);
        kit.span('glass', s + 1.6, s + 5, y + 1.8, y + 2.9, -0.05, 0);
        kit.span('lockers', s + 5.4, s + 8.2, y + 0.1, y + 1.95, -0.48, 0);
      }
    }
  }

  // Pasillo: losas, columnas y pretiles.
  for (let f = 1; f < 3; f++) {
    const y = f * FH;
    kit.span('tile', c0, c1, y - 0.3, y, -4, 0, { collide: true });
    kit.span('plaster', c0, c1, y - 0.34, y - 0.3, -4, 0);
    kit.span('panel', c0, c1, y, y + 1.1, -4, -3.75, { collide: true });
    // Faldón inclinado bajo el pretil (se ve en las fotos del patio).
    kit.span('panel', c0, c1, y - 0.9, y - 0.3, -4.15, -3.85);
    if (endParapet === 'start') kit.span('panel', c0, c0 + 0.25, y, y + 1.1, -4, 0, { collide: true });
    if (endParapet === 'end') kit.span('panel', c1 - 0.25, c1, y, y + 1.1, -4, 0, { collide: true });
  }
  for (let s = c0 + 0.3; s <= c1; s += 7.5) {
    kit.span('panel', s - 0.3, s + 0.3, 0, TOP, -4, -3.4, { collide: true });
  }

  // Cubos de escalera (dos tramos por piso, de ida y vuelta).
  for (const c of cores) {
    kit.span('panel', c, c + coreW, 0, TOP, D - 0.3, D, { collide: true });
    kit.span('glass', c + 0.6, c + 3.4, 1.5, TOP - 1.5, D, D + 0.06);
    kit.span('roofRed', c, c + coreW, TOP, TOP + 0.35, 0, D);
    const rise = FH / 2;
    const n = 11;
    for (let f = 0; f < 2; f++) {
      const base = f * FH;
      for (let i = 0; i < n; i++) {
        const top1 = base + ((i + 1) / n) * rise;
        const top2 = base + rise + ((i + 1) / n) * rise;
        // Tramo 1: sube alejándose del pasillo.
        kit.span('concrete', c, c + 1.8, base, top1, 1.5 + i * 0.28, 1.5 + (i + 1) * 0.28, { collide: true });
        // Tramo 2: regresa hacia el pasillo.
        kit.span('concrete', c + 2.2, c + coreW, base + rise, top2, 4.58 - (i + 1) * 0.28, 4.58 - i * 0.28, { collide: true });
      }
      // Descanso intermedio.
      kit.span('concrete', c, c + coreW, base + rise - 0.25, base + rise, 4.58, D - 0.3, { collide: true });
      // Llegada al siguiente piso.
      kit.span('tile', c, c + coreW, base + FH - 0.3, base + FH, 0, 1.5, { collide: true });
      // Muro bajo entre tramos.
      kit.span('white', c + 1.8, c + 2.2, base, base + FH, 1.5, 4.58);
    }
  }
}

// Caja de cristal en volado con patas de acero en V.
function cantilever(kit, a, b, dir) {
  const L = 9;
  const y0 = FH * 2 + 0.2, y1 = TOP - 0.2;
  const aa = dir > 0 ? a : a - L;
  kit.span('steel', aa, aa + L, y0 - 0.35, y0, b - 5, b + 3);
  kit.span('steel', aa, aa + L, y1, y1 + 0.35, b - 5, b + 3);
  kit.span('glassBlue', aa + 0.2, aa + L - 0.2, y0, y1, b - 4.8, b + 2.8);
  for (const s of [aa, aa + L - 0.2]) {
    kit.span('steel', s, s + 0.2, y0, y1, b - 5, b - 4.8);
    kit.span('steel', s, s + 0.2, y0, y1, b + 2.8, b + 3);
  }
  // Patas: dos postes inclinados aproximados con tramos.
  const footA = aa + L * 0.5;
  for (const bb of [b - 4.5, b + 2.5]) {
    for (let k = 0; k < 8; k++) {
      const t = k / 8;
      const x = footA + (dir > 0 ? 1 : -1) * t * 3.2;
      kit.box('steel', x, (y0 - 0.35) * (t + 0.0625), bb, 0.3, (y0 - 0.35) / 8 + 0.1, 0.3);
      kit.box('steel', footA - (dir > 0 ? 1 : -1) * t * 3.2, (y0 - 0.35) * (t + 0.0625), bb, 0.3, (y0 - 0.35) / 8 + 0.1, 0.3);
    }
    kit.collider(footA, 0, bb, 0.3, 0.3, y0);
  }
}

function maroonWindow(kit, x, y, zFace, dir) {
  const d = 0.4 * dir;
  const z0 = Math.min(zFace, zFace + d), z1 = Math.max(zFace, zFace + d);
  kit.span('maroon', x, x + 1.6, y + 1.3, y + 1.45, z0, z1);
  kit.span('maroon', x, x + 1.6, y - 0.15, y, z0, z1);
  kit.span('maroon', x, x + 0.15, y, y + 1.3, z0, z1);
  kit.span('maroon', x + 1.45, x + 1.6, y, y + 1.3, z0, z1);
  kit.span('darkGlass', x + 0.15, x + 1.45, y, y + 1.3, Math.min(zFace, zFace + 0.02 * dir), Math.max(zFace, zFace + 0.02 * dir));
}

// La punta amarilla: muro inclinado con ventanitas cuadradas y una redonda.
function yellowBlade() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(2.6, 0);
  s.lineTo(12.5, 14.6);
  s.lineTo(0, 12.6);
  s.closePath();
  const circle = new THREE.Path();
  circle.absarc(9.2, 12.6, 0.8, 0, Math.PI * 2, true);
  s.holes.push(circle);
  for (const cx of [2.2, 4.3]) {
    for (const cy of [6.4, 8.6, 10.8]) {
      const h = new THREE.Path();
      h.moveTo(cx - 0.5, cy - 0.65);
      h.lineTo(cx - 0.5, cy + 0.65);
      h.lineTo(cx + 0.5, cy + 0.65);
      h.lineTo(cx + 0.5, cy - 0.65);
      h.closePath();
      s.holes.push(h);
    }
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false });
  g.translate(0, 0, -0.35);
  return g;
}

function planter(kit, lx, lz, r, y = 0) {
  const g = new THREE.CylinderGeometry(r, r, 0.7, 20, 1, true);
  kit.addGeometry('stone', g, lx, y + 0.35, lz);
  kit.addGeometry('terracotta', new THREE.TorusGeometry(r, 0.12, 6, 24).rotateX(Math.PI / 2), lx, y + 0.7, lz);
  kit.addGeometry('soilPlanter', new THREE.CircleGeometry(r, 20).rotateX(-Math.PI / 2), lx, y + 0.62, lz);
  kit.collider(lx, y, lz, r * 0.8, r * 0.8, 0.7);
}

function hoop(kit, lx, lz, dir) {
  kit.box('black', lx - dir * 0.9, 0.2, lz, 1.4, 0.4, 0.9, { collide: true });
  kit.box('black', lx - dir * 0.9, 1.7, lz, 0.14, 3, 0.14);
  kit.box('black', lx - dir * 0.45, 3.2, lz, 0.9, 0.1, 0.1);
  kit.box('white', lx, 3.35, lz, 0.05, 1.05, 1.8);
  kit.addGeometry('terracotta', new THREE.TorusGeometry(0.23, 0.02, 6, 16).rotateX(Math.PI / 2), lx + dir * 0.3, 3.05, lz);
}

export function soccerGoal(kit, lx, lz, dir, w = 7.3, h = 2.44) {
  const hw = w / 2;
  kit.box('white', lx, h / 2, lz - hw, 0.12, h, 0.12, { collide: true });
  kit.box('white', lx, h / 2, lz + hw, 0.12, h, 0.12, { collide: true });
  kit.box('white', lx, h, lz, 0.12, 0.12, w + 0.12);
  kit.box('white', lx - dir * 1.2, 0.05, lz, 0.08, 0.08, w);
  kit.box('white', lx - dir * 0.6, h * 0.55, lz - hw, 1.3, 0.06, 0.06, { rotY: 0 });
  kit.box('white', lx - dir * 0.6, h * 0.55, lz + hw, 1.3, 0.06, 0.06);
}

function courtMesh(lx, lz, L, W, plain = false) {
  const px = 24;
  const m = 1.2;
  const { c, x } = fieldCanvas((L + 2 * m) * px, (W + 2 * m) * px, '#2f8fd6');
  const X = (v) => (v + m) * px, Y = (v) => (v + m) * px;
  x.lineWidth = 3;
  x.strokeStyle = '#f5f5f0';
  x.strokeRect(X(0), Y(0), L * px, W * px);
  if (!plain) {
    x.fillStyle = '#f2b21b';
    for (const end of [0, 1]) {
      const bx = end ? L - 5.8 : 0;
      x.fillRect(X(bx), Y(W / 2 - 2.45), 5.8 * px, 4.9 * px);
      x.beginPath();
      x.arc(X(end ? L - 5.8 : 5.8), Y(W / 2), 1.8 * px, end ? Math.PI / 2 : -Math.PI / 2, end ? Math.PI * 1.5 : Math.PI / 2);
      x.fill();
      x.strokeStyle = '#f5f5f0';
      x.beginPath();
      x.arc(X(end ? L - 1.575 : 1.575), Y(W / 2), 6.75 * px, end ? Math.PI * 0.62 : -Math.PI * 0.38, end ? Math.PI * 1.38 : Math.PI * 0.38);
      x.stroke();
    }
    x.beginPath(); x.moveTo(X(L / 2), Y(0)); x.lineTo(X(L / 2), Y(W)); x.stroke();
    x.beginPath(); x.arc(X(L / 2), Y(W / 2), 1.8 * px, 0, 7); x.fill(); x.stroke();
  } else {
    x.beginPath(); x.moveTo(X(L / 2), Y(0)); x.lineTo(X(L / 2), Y(W)); x.stroke();
  }
  // Pequeñas variaciones de desgaste.
  for (let i = 0; i < 400; i++) {
    x.fillStyle = `rgba(255,255,255,${rand() * 0.05})`;
    x.fillRect(rand() * c.width, rand() * c.height, 6, 6);
  }
  const tex = canvasTexture(c, { repeat: false });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(L + 2 * m, W + 2 * m).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }),
  );
  placeLocal(mesh, lx, 0.06, lz, 0);
  mesh.receiveShadow = true;
  return mesh;
}

function turfField(lx, lz, L, W) {
  const px = 20;
  const { c, x } = fieldCanvas(L * px, W * px, '#3b7a33');
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    x.fillRect((i * L * px) / 8, 0, (L * px) / 8, W * px);
  }
  x.strokeStyle = '#f0f0ea';
  x.lineWidth = 3;
  x.strokeRect(px * 0.5, px * 0.5, (L - 1) * px, (W - 1) * px);
  x.beginPath(); x.moveTo((L / 2) * px, px * 0.5); x.lineTo((L / 2) * px, (W - 0.5) * px); x.stroke();
  x.beginPath(); x.arc((L / 2) * px, (W / 2) * px, 3 * px, 0, 7); x.stroke();
  x.strokeRect(px * 0.5, (W / 2 - 4) * px, 3.5 * px, 8 * px);
  x.strokeRect((L - 4) * px, (W / 2 - 4) * px, 3.5 * px, 8 * px);
  const tex = canvasTexture(c, { repeat: false });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(L, W).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
  );
  placeLocal(mesh, lx, 0.07, lz, 0);
  mesh.receiveShadow = true;
  return mesh;
}

function parkingLot(lx, lz, L, W, y) {
  const px = 10;
  const { c, x } = fieldCanvas(L * px, W * px, '#8e8b86');
  const img = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 26;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  x.strokeStyle = 'rgba(245,245,240,0.85)';
  x.lineWidth = 2;
  for (const row of [6, W - 6 - 5.5]) {
    for (let k = 0; k <= 12; k++) {
      const sx = (4 + k * 5.2) * px - 2.6 * px;
      x.beginPath(); x.moveTo(sx, row * px); x.lineTo(sx, (row + 5.5) * px); x.stroke();
    }
  }
  const tex = canvasTexture(c, { repeat: false });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(L, W).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
  );
  placeLocal(mesh, lx, y + 0.06, lz, 0);
  mesh.receiveShadow = true;
  return mesh;
}

function car(kit, root, lx, y, lz, rot, color) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.6 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 4.3), mat);
  body.position.y = 0.65;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.2), kit.mats.darkGlass);
  cab.position.set(0, 1.28, -0.2);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 2.0), mat);
  roof.position.set(0, 1.6, -0.2);
  g.add(body, cab, roof);
  const wheelG = new THREE.CylinderGeometry(0.33, 0.33, 0.25, 14).rotateZ(Math.PI / 2);
  for (const [wx, wz] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) {
    const w = new THREE.Mesh(wheelG, kit.mats.black);
    w.position.set(wx, 0.33, wz);
    g.add(w);
  }
  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  const w = toWorld(lx, lz);
  g.position.set(w.x, y + 0.05, w.z);
  g.rotation.y = COMPLEX.rot + rot;
  root.add(g);
  const saved = kit.frame;
  kit.setFrame(w.x, y, w.z, COMPLEX.rot + rot);
  kit.collider(0, 0, 0, 0.95, 2.2, 1.7);
  kit.frame = saved;
}

function makeFlag(tex) {
  const geo = new THREE.PlaneGeometry(3.6, 2.05, 16, 8);
  geo.translate(1.8, 0, 0);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 }),
  );
  mesh.castShadow = true;
  const base = geo.attributes.position.array.slice();
  const phase = rand() * 10;
  return {
    mesh,
    update(t) {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const k = x / 3.6;
        p.setZ(i, Math.sin(x * 1.8 - t * 4 + phase) * 0.28 * k + Math.sin(y * 2 + t * 3) * 0.05 * k);
      }
      p.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
}
