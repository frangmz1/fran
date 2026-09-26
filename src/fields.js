// Canchas de arriba (Centurions SHV): campo de americano con gradas techadas
// y cabina blanca, y dos canchas de fútbol, todo con malla ciclónica.
import * as THREE from 'three';
import { FIELDS, LEVEL } from './layout.js';
import { Kit } from './kit.js';
import { soccerGoal } from './campus.js';
import { fieldCanvas, canvasTexture, rand } from './textures.js';

export function buildFields(mats, colliders, T) {
  const root = new THREE.Group();
  const kit = new Kit(mats, colliders);
  const Y = LEVEL.fields;
  const trees = [];

  // --- Campo de americano ---
  const F = FIELDS.football;
  root.add(footballTurf(F));
  kit.setFrame(F.cx, Y, F.cz, Math.PI / 2); // a lo largo = eje z del mundo
  soccerGoal(kit, -F.l / 2 + 3, 0, 1);
  soccerGoal(kit, F.l / 2 - 3, 0, -1);
  // Postes de gol de americano.
  for (const dir of [-1, 1]) {
    const a = dir * (F.l / 2 - 0.6);
    kit.box('yellow', a, 1.6, 0, 0.18, 3.2, 0.18);
    kit.box('yellow', a, 3.1, 0, 0.16, 0.16, 5.6);
    kit.box('yellow', a, 6.1, -2.8, 0.14, 6, 0.14);
    kit.box('yellow', a, 6.1, 2.8, 0.14, 6, 0.14);
  }
  fence(kit, root, -F.l / 2 - 2, F.l / 2 + 2, -F.w / 2 - 2, F.w / 2 + 2, T, [[-F.w / 2 - 2, -8, 8]]);

  // Gradas techadas (tres secciones) del lado oeste, mirando al campo.
  kit.setFrame(F.cx - F.w / 2 - 8, Y, F.cz, -Math.PI / 2);
  // En este marco: a = a lo largo del campo, b > 0 aleja del campo.
  const sections = [[-40, -22], [-16, 16], [22, 40]];
  for (const [a0, a1] of sections) bleachers(kit, a0, a1);
  // Cabina blanca de transmisión.
  kit.span('white', -21, -17, 0, 7.5, 0, 4, { collide: true });
  kit.span('white', -21.3, -16.7, 7.5, 7.8, -0.3, 4.3);
  kit.span('darkGlass', -20.5, -17.5, 5, 6.6, -0.05, 0);
  kit.span('darkGlass', -20.5, -17.5, 2, 3.4, -0.05, 0);
  // Postes altos de iluminación.
  for (const a of [-40, -22, -16, 0, 16, 22, 40]) {
    kit.box('steel', a, 8, 6.2, 0.22, 16, 0.22);
  }

  // Caseta blanca del lado este.
  kit.setFrame(F.cx + F.w / 2 + 6, Y, F.cz + 18, 0);
  kit.span('white', -1.5, 1.5, 0, 2.6, -2, 2, { collide: true });
  kit.span('roofGray', -1.7, 1.7, 2.6, 2.8, -2.2, 2.2);

  // --- Canchas de fútbol ---
  for (const S of [FIELDS.soccer1, FIELDS.soccer2]) {
    root.add(soccerTurf(S));
    kit.setFrame(S.cx, Y, S.cz, Math.PI / 2);
    soccerGoal(kit, -S.l / 2 + 1, 0, 1, 5, 2);
    soccerGoal(kit, S.l / 2 - 1, 0, -1, 5, 2);
    fence(kit, root, -S.l / 2 - 1.5, S.l / 2 + 1.5, -S.w / 2 - 1.5, S.w / 2 + 1.5, T, [[S.w / 2 + 1.5, -4, 4]]);
  }

  // Fila de árboles al sur del campo (se ve en la satelital).
  for (let x = -140; x <= -76; x += 7) trees.push({ x: x + rand() * 2, z: -80 + rand() * 2, y: Y, s: 0.8 + rand() * 0.3 });

  root.add(kit.build());
  return { group: root, trees };
}

// Gradas: escalones metálicos con techo de lámina sobre postes.
function bleachers(kit, a0, a1) {
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const top = 0.45 * (r + 1);
    kit.span('steelBlue', a0, a1, top - 0.12, top, 0.8 * r, 0.8 * (r + 1), { collide: true });
    kit.span('darkWood', a0, a1, top + 0.3, top + 0.38, 0.8 * r + 0.1, 0.8 * r + 0.45);
  }
  // Estructura inferior (cerrada para que no se pueda pasar por debajo).
  kit.span('steelBlue', a0, a1, 0, 0.45 * rows - 0.12, 0.8 * rows - 0.2, 0.8 * rows, { collide: true });
  kit.collider((a0 + a1) / 2, 0, 0.4 * rows, (a1 - a0) / 2, 0.4 * rows, 0.45);
  // Techo.
  const roofY = 0.45 * rows + 3.2;
  kit.span('steel', a0 - 0.5, a1 + 0.5, roofY, roofY + 0.12, -1.2, 0.8 * rows + 0.8);
  for (let a = a0; a <= a1 + 0.01; a += (a1 - a0) / Math.max(1, Math.round((a1 - a0) / 9))) {
    kit.box('steel', a, roofY / 2, 0.8 * rows + 0.3, 0.2, roofY, 0.2, { collide: true });
    kit.box('steel', a, (roofY + 0.45) / 2 + 0.3, -0.6, 0.14, roofY - 0.2, 0.14);
    // Barandal trasero.
    kit.box('steel', a, 0.45 * rows + 0.55, 0.8 * rows - 0.1, 0.06, 1.1, 0.06);
  }
  kit.span('steel', a0, a1, 0.45 * rows + 1.05, 0.45 * rows + 1.12, 0.8 * rows - 0.14, 0.8 * rows - 0.06);
  kit.span('steel', a0, a1, 0.45 * rows, 0.45 * rows + 1.1, 0.8 * rows - 0.1, 0.8 * rows, { collide: true });
}

// Malla ciclónica rectangular con una o más puertas (huecos).
// gaps: [[ladoB, desdeA, hastaA]] donde ladoB es el valor b del lado con puerta.
function fence(kit, root, a0, a1, b0, b1, T, gaps = []) {
  const H = 2.4;
  const f = kit.frame;
  const mat = new THREE.MeshStandardMaterial({
    map: T.fence.clone(), alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4,
  });
  mat.map.needsUpdate = true;
  const segs = [];
  const addSide = (pA, pB, bFixed, alongA) => {
    const gap = gaps.find((g) => Math.abs(g[0] - bFixed) < 0.01);
    const pieces = gap && alongA ? [[pA, gap[1]], [gap[2], pB]] : [[pA, pB]];
    for (const [s, e] of pieces) segs.push(alongA ? [s, bFixed, e, bFixed] : [bFixed, s, bFixed, e]);
  };
  addSide(a0, a1, b0, true);
  addSide(a0, a1, b1, true);
  addSide(b0, b1, a0, false);
  addSide(b0, b1, a1, false);
  for (const [xa, xb, ya, yb] of segs.map(([a, b, c, d]) => [a, c, b, d])) {
    const len = Math.hypot(xb - xa, yb - ya);
    const geo = new THREE.PlaneGeometry(len, H);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / 0.9, uv.getY(i) * H / 0.9);
    const mesh = new THREE.Mesh(geo, mat);
    const ca = (xa + xb) / 2, cb = (ya + yb) / 2;
    const c = Math.cos(f.rot), s = Math.sin(f.rot);
    mesh.position.set(f.x + ca * c + cb * s, f.y + H / 2, f.z - ca * s + cb * c);
    const alongA = Math.abs(yb - ya) < 0.01;
    mesh.rotation.y = f.rot + (alongA ? 0 : Math.PI / 2);
    root.add(mesh);
    kit.collider(ca, 0, cb, alongA ? len / 2 : 0.05, alongA ? 0.05 : len / 2, H);
    for (let t = 0; t <= len + 0.01; t += 3) {
      const pa = alongA ? Math.min(xa, xb) + t : xa, pb = alongA ? ya : Math.min(ya, yb) + t;
      kit.box('steel', pa, H / 2 + 0.05, pb, 0.07, H + 0.1, 0.07);
    }
    kit.span('steel', Math.min(xa, xb) - 0.03, Math.max(xa, xb) + 0.03, H, H + 0.06, Math.min(ya, yb) - 0.03, Math.max(ya, yb) + 0.03);
  }
}

function footballTurf(F) {
  const px = 10;
  const { c, x } = fieldCanvas(F.w * px, F.l * px, '#3f7d35');
  // Franjas de corte cada 5 yardas.
  const yd = 0.9144;
  const fieldL = 120 * yd;
  const off = (F.l - fieldL) / 2;
  const W = 53.33 * yd;
  const side = (F.w - W) / 2;
  for (let i = 0; i < 24; i++) {
    x.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    x.fillRect(0, (off + i * 5 * yd) * px, F.w * px, 5 * yd * px);
  }
  x.strokeStyle = '#f4f4ef';
  x.lineWidth = 3;
  x.strokeRect(side * px, off * px, W * px, fieldL * px);
  // Zonas de anotación.
  x.fillStyle = 'rgba(30,70,160,0.35)';
  x.fillRect(side * px, off * px, W * px, 10 * yd * px);
  x.fillRect(side * px, (off + 110 * yd) * px, W * px, 10 * yd * px);
  for (let k = 0; k <= 20; k++) {
    const y = (off + (10 + k * 5) * yd) * px;
    x.lineWidth = k % 2 ? 2 : 3;
    x.beginPath(); x.moveTo(side * px, y); x.lineTo((side + W) * px, y); x.stroke();
  }
  // Números de yardas.
  x.fillStyle = '#f4f4ef';
  x.font = `bold ${2 * px}px Arial, sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  for (let k = 1; k <= 9; k++) {
    const n = k <= 5 ? k * 10 : (10 - k) * 10;
    const y = (off + (10 + k * 10) * yd) * px;
    for (const sx of [side + 8 * yd, side + W - 8 * yd]) {
      x.save();
      x.translate(sx * px, y);
      x.rotate(sx < F.w / 2 ? Math.PI / 2 : -Math.PI / 2);
      x.fillText(String(n), 0, 0);
      x.restore();
    }
  }
  // Líneas amarillas de fútbol soccer (el campo es mixto, como en la foto).
  x.strokeStyle = '#e8c21e';
  x.lineWidth = 2;
  x.strokeRect((F.w / 2 - 20) * px, (off + 2) * px, 40 * px, 16 * px);
  x.strokeRect((F.w / 2 - 20) * px, (F.l - off - 18) * px, 40 * px, 16 * px);
  x.beginPath(); x.arc((F.w / 2) * px, (F.l / 2) * px, 9.15 * px, 0, 7); x.stroke();
  // Logo al centro: escudo azul con casco blanco.
  drawLogo(x, (F.w / 2) * px, (F.l / 2) * px, 7.5 * px);
  const tex = canvasTexture(c, { repeat: false });
  tex.anisotropy = 16;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(F.w, F.l).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
  );
  mesh.position.set(F.cx, LEVEL.fields + 0.05, F.cz);
  mesh.receiveShadow = true;
  return mesh;
}

function drawLogo(x, cx, cy, r) {
  x.save();
  x.translate(cx, cy);
  x.fillStyle = '#123a8a';
  x.beginPath(); x.ellipse(0, 0, r, r * 0.8, 0, 0, 7); x.fill();
  x.fillStyle = '#e9e9e4';
  x.beginPath(); x.ellipse(0, 0, r * 0.82, r * 0.64, 0, 0, 7); x.fill();
  // Casco de centurión estilizado.
  x.fillStyle = '#123a8a';
  x.beginPath();
  x.moveTo(-r * 0.5, r * 0.35);
  x.quadraticCurveTo(-r * 0.55, -r * 0.35, 0, -r * 0.42);
  x.quadraticCurveTo(r * 0.5, -r * 0.35, r * 0.45, r * 0.1);
  x.lineTo(r * 0.1, r * 0.1);
  x.lineTo(r * 0.1, r * 0.35);
  x.closePath();
  x.fill();
  x.fillStyle = '#e9e9e4';
  x.beginPath(); x.ellipse(-r * 0.05, -r * 0.05, r * 0.16, r * 0.08, 0, 0, 7); x.fill();
  x.restore();
}

function soccerTurf(S) {
  const px = 12;
  const { c, x } = fieldCanvas(S.w * px, S.l * px, '#3d7b34');
  for (let i = 0; i < 10; i++) {
    x.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    x.fillRect(0, (i * S.l * px) / 10, S.w * px, (S.l * px) / 10);
  }
  x.strokeStyle = '#f4f4ef';
  x.lineWidth = 3;
  x.strokeRect(px, px, (S.w - 2) * px, (S.l - 2) * px);
  x.beginPath(); x.moveTo(px, (S.l / 2) * px); x.lineTo((S.w - 1) * px, (S.l / 2) * px); x.stroke();
  x.beginPath(); x.arc((S.w / 2) * px, (S.l / 2) * px, 4 * px, 0, 7); x.stroke();
  x.strokeRect((S.w / 2 - 7) * px, px, 14 * px, 7 * px);
  x.strokeRect((S.w / 2 - 7) * px, (S.l - 8) * px, 14 * px, 7 * px);
  const tex = canvasTexture(c, { repeat: false });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(S.w, S.l).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
  );
  mesh.position.set(S.cx, LEVEL.fields + 0.05, S.cz);
  mesh.receiveShadow = true;
  return mesh;
}
