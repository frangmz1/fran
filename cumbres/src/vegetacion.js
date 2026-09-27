// Árboles: jacarandas, fresnos y palmas en parques, camellones y jardines;
// mezquites y huizaches en el monte de alrededor. No son los árboles reales
// uno por uno: se reparten donde el mapa dice que hay parque o monte.
import * as THREE from 'three';
import { MAPA, alturaEn, puntos, dentroDe, Rejilla, calleCercana, semilla, TERRENO, JUEGO } from './mundo.js';

const r = semilla('arboles-cumbres');

function pintar(g, hex, variacion = 0.06) {
  const c = new THREE.Color(hex);
  const col = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < g.attributes.position.count; i++) {
    const k = 1 + (r() - 0.5) * variacion * 2;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function bola(radio, sx, sy, sz, x, y, z, detalle = 0) {
  const g = new THREE.IcosahedronGeometry(radio, detalle);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.85 + r() * 0.3;
    p.setXYZ(i, p.getX(i) * sx * k, p.getY(i) * sy * k, p.getZ(i) * sz * k);
  }
  g.translate(x, y, z);
  return g.toNonIndexed();
}

function tronco(r0, r1, h, x = 0, z = 0, inclina = 0) {
  const g = new THREE.CylinderGeometry(r1, r0, h, 6, 1, true);
  g.translate(0, h / 2, 0);
  if (inclina) g.rotateZ(inclina);
  g.translate(x, 0, z);
  return g.toNonIndexed();
}

function juntar(geos) {
  const lista = geos.map((g) => { g.deleteAttribute('uv'); g.deleteAttribute('normal'); return g; });
  let n = 0;
  for (const g of lista) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of lista) {
    pos.set(g.attributes.position.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeVertexNormals();
  return out;
}

// Modelos (en metros, base en el suelo).
function modelos() {
  const CAFE = '#5a4535';
  return {
    jacaranda: juntar([
      pintar(tronco(0.22, 0.14, 3.2), CAFE),
      pintar(tronco(0.12, 0.07, 2.2, 0.3, 0, -0.5), CAFE),
      pintar(bola(1, 2.6, 1.3, 2.4, 0, 4.6, 0, 1), '#8f74c9', 0.1),
      pintar(bola(1, 1.8, 1.1, 1.9, 1.3, 4.1, 0.6), '#9a82d6', 0.1),
      pintar(bola(1, 1.6, 1.0, 1.7, -1.2, 4.3, -0.5), '#7f6aa8', 0.1),
      pintar(bola(1, 1.2, 0.8, 1.2, 0.2, 5.3, -0.8), '#6f8a4a', 0.1),
    ]),
    fresno: juntar([
      pintar(tronco(0.25, 0.16, 3.4), CAFE),
      pintar(bola(1, 2.7, 2.3, 2.6, 0, 5.4, 0, 1), '#4f7033', 0.1),
      pintar(bola(1, 1.8, 1.5, 1.8, 1.2, 4.6, 0.8), '#5c7d3a', 0.1),
      pintar(bola(1, 1.7, 1.4, 1.6, -1.1, 4.9, -0.7), '#46652d', 0.1),
    ]),
    palma: juntar([
      pintar(tronco(0.24, 0.18, 7.5), '#7a6a58'),
      pintar(bola(1, 2.4, 0.5, 0.6, 1.2, 7.6, 0), '#56793a', 0.12),
      pintar(bola(1, 0.6, 0.5, 2.4, 0, 7.6, 1.2), '#4e7234', 0.12),
      pintar(bola(1, 2.4, 0.5, 0.6, -1.2, 7.5, 0), '#5b803d', 0.12),
      pintar(bola(1, 0.6, 0.5, 2.4, 0, 7.5, -1.2), '#4b6d31', 0.12),
      pintar(bola(0.5, 1, 1, 1, 0, 7.6, 0), '#6b5a40'),
    ]),
    ficus: juntar([
      pintar(tronco(0.12, 0.1, 1.2), CAFE),
      pintar(bola(1, 1.1, 1.5, 1.1, 0, 2.3, 0, 1), '#3f6a2c', 0.12),
    ]),
    mezquite: juntar([
      pintar(tronco(0.16, 0.1, 1.6, 0, 0, 0.2), '#4a3b2f'),
      pintar(tronco(0.1, 0.06, 1.6, 0.2, 0, -0.6), '#4a3b2f'),
      pintar(bola(1, 2.4, 0.9, 2.2, 0.2, 2.5, 0), '#6d7a3e', 0.12),
      pintar(bola(1, 1.6, 0.7, 1.6, 1.3, 2.2, 0.5), '#78854a', 0.12),
    ]),
    matorral: juntar([pintar(bola(1, 1.1, 0.7, 1.0, 0, 0.5, 0), '#727a45', 0.15)]),
  };
}

export function crearVegetacion({ casas, jardines, mezcla, colisiones, ligero = false }) {
  // Casas en rejilla para no plantar árboles adentro.
  const rejCasas = new Rejilla(30);
  for (const c of casas) {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [x, z] of c.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    rejCasas.agregar({ c, x0: x0 - 1.5, z0: z0 - 1.5, x1: x1 + 1.5, z1: z1 + 1.5 }, x0, z0, x1, z1);
  }
  const tmp = [];
  const libre = (x, z, holguraCalle = 1.2) => {
    for (const o of rejCasas.cerca(x, z, 2, tmp)) {
      if (x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1) return false;
    }
    const calle = calleCercana(x, z, 12);
    if (calle && calle.d < calle.calle.w / 2 + holguraCalle) return false;
    return true;
  };

  const lista = { jacaranda: [], fresno: [], palma: [], ficus: [], mezquite: [], matorral: [] };
  const plantar = (tipo, x, z, esc = 1) => lista[tipo].push({ x, z, esc: esc * (0.8 + r() * 0.4), rot: r() * Math.PI * 2 });

  // Parques y camellones.
  for (const p of MAPA.parques) {
    const pts = puntos(p.p);
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const paso = p.t === 'golf' ? 22 : p.t === 'deporte' ? 18 : 10;
    const prob = { parque: 0.6, golf: 0.35, deporte: 0.15, pasto: 0.25, jardin: 0.45 }[p.t] ?? 0.3;
    for (let x = x0; x < x1; x += paso) {
      for (let z = z0; z < z1; z += paso) {
        const px = x + (r() - 0.5) * paso * 0.8, pz = z + (r() - 0.5) * paso * 0.8;
        if (r() > prob || !dentroDe(pts, px, pz) || !libre(px, pz)) continue;
        const t = r();
        plantar(t < 0.35 ? 'jacaranda' : t < 0.75 ? 'fresno' : t < 0.88 ? 'palma' : 'ficus', px, pz);
      }
    }
  }

  // Árboles de banqueta.
  for (const c of MAPA.calles) {
    if (!'rts'.includes(c.c)) continue;
    const pts = puntos(c.p);
    let acum = r() * 16;
    for (let k = 1; k < pts.length; k++) {
      const [ax, az] = pts[k - 1], [bx, bz] = pts[k];
      const l = Math.hypot(bx - ax, bz - az);
      const dx = (bx - ax) / l, dz = (bz - az) / l;
      for (let s = acum; s < l; s += 17) {
        if (r() < 0.55) continue;
        const lado = r() < 0.5 ? -1 : 1;
        const off = c.w / 2 + 1.1;
        const x = ax + dx * s - dz * off * lado, z = az + dz * s + dx * off * lado;
        if (x < JUEGO.x0 || x > JUEGO.x1 || z < JUEGO.z0 || z > JUEGO.z1 || !libre(x, z, 0.6)) continue;
        const t = r();
        plantar(t < 0.4 ? 'jacaranda' : t < 0.75 ? 'fresno' : 'ficus', x, z, 0.85);
      }
      acum = (acum + 17 - (l % 17)) % 17;
    }
  }

  // Jardines de las casas.
  for (const j of jardines) {
    const t = r();
    plantar(t < 0.45 ? 'ficus' : t < 0.75 ? 'jacaranda' : 'palma', j.x, j.z, t < 0.45 ? 1 : 0.75);
  }

  // Monte alrededor: donde el mapa de suelos marca monte o zacate.
  const ctx = mezcla.canvas.getContext('2d');
  const W = mezcla.canvas.width, H = mezcla.canvas.height;
  const datos = ctx.getImageData(0, 0, W, H).data;
  for (let k = 0; k < 9000; k++) {
    const x = TERRENO.x0 + r() * (TERRENO.x1 - TERRENO.x0);
    const z = TERRENO.z0 + r() * (TERRENO.z1 - TERRENO.z0);
    const [px, pz] = mezcla.P(x, z);
    const i = (Math.floor(pz) * W + Math.floor(px)) * 4;
    const monte = datos[i + 1] / 255, parque = datos[i] / 255;
    if (parque > 0.3 || r() > monte * 0.8 || !libre(x, z)) continue;
    plantar(r() < 0.45 ? 'mezquite' : 'matorral', x, z, 1);
  }

  // Instancias agrupadas por zonas de 400 m: así solo se dibujan (y
  // proyectan sombra) las zonas que están a la vista.
  const ZONA = 400;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  const geos = modelos();
  const grupo = new THREE.Group();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const tinte = new THREE.Color();
  const zonas = [];
  for (const [tipo, arr] of Object.entries(lista)) {
    const porZona = new Map();
    for (const a of arr) {
      const k = `${Math.floor(a.x / ZONA)},${Math.floor(a.z / ZONA)}`;
      if (!porZona.has(k)) porZona.set(k, []);
      porZona.get(k).push(a);
    }
    for (const [k, lote] of porZona) {
      const im = new THREE.InstancedMesh(geos[tipo], mat, lote.length);
      lote.forEach((a, i) => {
        q.setFromAxisAngle(up, a.rot);
        m4.compose(new THREE.Vector3(a.x, alturaEn(a.x, a.z) - 0.05, a.z), q, new THREE.Vector3(a.esc, a.esc, a.esc));
        im.setMatrixAt(i, m4);
        tinte.setRGB(0.9 + r() * 0.2, 0.9 + r() * 0.2, 0.9 + r() * 0.2);
        im.setColorAt(i, tinte);
        if (tipo !== 'matorral') colisiones.agregarCirculo(a.x, a.z, tipo === 'ficus' ? 0.2 : 0.3 * a.esc);
      });
      im.castShadow = tipo !== 'matorral';
      im.receiveShadow = true;
      im.computeBoundingSphere();
      grupo.add(im);
      const [i, j] = k.split(',').map(Number);
      zonas.push({ im, x: (i + 0.5) * ZONA, z: (j + 0.5) * ZONA, lejos: (tipo === 'matorral' ? 500 : 1300) * (ligero ? 0.65 : 1) });
    }
  }
  // Las zonas muy lejanas se esconden (la neblina casi las borra).
  grupo.userData.actualizar = (cam) => {
    for (const z of zonas) z.im.visible = Math.hypot(cam.x - z.x, cam.z - z.z) < z.lejos;
  };
  return { grupo, total: Object.values(lista).reduce((s, a) => s + a.length, 0) };
}
