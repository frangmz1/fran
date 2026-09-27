// Accesos de las privadas en sus ubicaciones reales: portones con columnas
// y caseta de vigilancia, y plumas que se levantan cuando te acercas.
import * as THREE from 'three';
import { MAPA, alturaEn, semilla } from './mundo.js';

function pintar(g, hex) {
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g.index ? g.toNonIndexed() : g;
}

function juntar(geos) {
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

// Caja en coordenadas del acceso: u a lo largo de la calle, v a lo ancho.
function caja(geos, base, sx, sy, sz, u, y, v, hex) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.rotateY(base.rot);
  g.translate(base.x + base.dx * u + base.px * v, base.y + y, base.z + base.dz * u + base.pz * v);
  geos.push(pintar(g, hex));
}

function texturaRayas() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 16;
  const x = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? '#f4f4f0' : '#c8231d';
    x.fillRect(i * 32, 0, 32, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function crearAccesos(colisiones) {
  const geos = [];
  const plumas = [];
  const rayas = texturaRayas();
  const matPluma = new THREE.MeshStandardMaterial({ map: rayas, roughness: 0.5 });
  const grupo = new THREE.Group();

  for (const a of MAPA.accesos) {
    const r = semilla(`${a.x},${a.z}`);
    const dx = Math.cos(a.a), dz = Math.sin(a.a);
    const px = -dz, pz = dx; // a lo ancho de la calle
    const y = alturaEn(a.x, a.z);
    // rot: el eje x local de las cajas corre a lo largo de la calle.
    const base = { x: a.x, y, z: a.z, dx, dz, px, pz, rot: Math.atan2(-dz, dx) };
    const w = Math.max(5, a.w);
    const lado = r() < 0.5 ? -1 : 1;
    const cantera = r() < 0.5 ? '#c9b59a' : '#d8d2c6';

    // Columnas a los lados de la calle.
    for (const s of [-1, 1]) {
      const v = s * (w / 2 + 0.5);
      caja(geos, base, 0.7, 3, 0.7, 0, 1.5, v, cantera);
      caja(geos, base, 0.9, 0.2, 0.9, 0, 3.1, v, '#8d8579');
      colisiones.agregarCirculo(a.x + px * v, a.z + pz * v, 0.5);
    }
    // Caseta de vigilancia.
    const vc = lado * (w / 2 + 2.6);
    caja(geos, base, 2.6, 2.6, 2.4, 2.2, 1.3, vc, '#efece6');
    caja(geos, base, 3.2, 0.2, 3.0, 2.2, 2.7, vc, '#6f675d');
    caja(geos, base, 2.62, 0.9, 2.42, 2.2, 1.65, vc, '#2d3a44'); // franja de ventanas
    caja(geos, base, 2.64, 0.35, 2.44, 2.2, 0.35, vc, cantera);
    colisiones.agregarCirculo(a.x + dx * 2.2 + px * vc, a.z + dz * 2.2 + pz * vc, 1.6);

    if (a.t === 'porton') {
      // Portón abierto: dos hojas de herrería pegadas a los lados.
      for (const s of [-1, 1]) {
        const v = s * (w / 2 + 0.15);
        for (let k = 0; k < 7; k++) caja(geos, base, 0.05, 2.2, 0.05, -0.4 - (k * w) / 14, 1.2, v, '#2b2b2b');
        caja(geos, base, w / 2, 0.08, 0.06, -w / 4 - 0.35, 2.3, v, '#2b2b2b');
        caja(geos, base, w / 2, 0.08, 0.06, -w / 4 - 0.35, 0.15, v, '#2b2b2b');
      }
    } else {
      // Pluma: poste y brazo que gira.
      const vp = -lado * (w / 2 + 0.3);
      caja(geos, base, 0.35, 1.1, 0.35, -0.8, 0.55, vp, '#e5e2da');
      const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, w + 0.2), matPluma);
      brazo.geometry.translate(0, 0, (w + 0.2) / 2); // de 0 a w sobre z local
      const pivote = new THREE.Group();
      pivote.position.set(a.x + dx * -0.8 + px * vp, y + 1.05, a.z + dz * -0.8 + pz * vp);
      pivote.rotation.y = Math.atan2(px * lado, pz * lado); // z local cruza la calle
      pivote.add(brazo);
      brazo.castShadow = true;
      grupo.add(pivote);
      const seg = colisiones.agregarSegmento(
        a.x + dx * -0.8 + px * vp, a.z + dz * -0.8 + pz * vp,
        a.x + dx * -0.8 - px * vp, a.z + dz * -0.8 - pz * vp,
      );
      plumas.push({ pivote, seg, x: a.x, z: a.z, ang: 0 });
    }
  }

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  const m = new THREE.Mesh(juntar(geos), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  grupo.add(m);

  // La pluma sube si hay alguien a menos de 16 m.
  grupo.userData.actualizar = (dt, x, z) => {
    for (const p of plumas) {
      const cerca = Math.hypot(x - p.x, z - p.z) < 16;
      const meta = cerca ? 1.35 : 0;
      p.ang += Math.sign(meta - p.ang) * Math.min(Math.abs(meta - p.ang), dt * 1.6);
      p.pivote.children[0].rotation.x = -p.ang;
      p.seg.activo = p.ang < 0.6;
    }
  };
  return grupo;
}
