// Calles reales: asfalto, adoquín en las calles de servicio, banquetas,
// guarniciones, línea central y postes de luz.
import * as THREE from 'three';
import { CALLES, alturaEn, calleCercana, JUEGO } from './mundo.js';

// Orden de dibujo: lo de más arriba gana en los cruces.
const CAPAS = {
  banqueta: { y: 0.05, k: 1 },
  guarnicion: { y: 0.06, k: 2 },
  a: { y: 0.055, k: 1.5 },
  c: { y: 0.04, k: 0.5 },
  e: { y: 0.07, k: 3 },
  r: { y: 0.08, k: 4 },
  t: { y: 0.09, k: 5 },
  s: { y: 0.1, k: 6 },
  p: { y: 0.1, k: 6 },
  v: { y: 0.11, k: 7 },
  raya: { y: 0.12, k: 9 },
};

function material(opts, k) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.92,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -k,
    polygonOffsetUnits: -k * 4,
    ...opts,
  });
}

// Remuestrea la línea para que siga el relieve (un punto cada ~3 m).
function remuestrear(pts, paso = 5) {
  const out = [pts[0]];
  for (let k = 1; k < pts.length; k++) {
    const [ax, az] = pts[k - 1], [bx, bz] = pts[k];
    const l = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(l / paso));
    for (let i = 1; i <= n; i++) out.push([ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n]);
  }
  return out;
}

// Franja paralela a la línea entre las distancias d0 y d1 (negativas = izquierda).
class Franja {
  constructor() {
    this.pos = [];
    this.uv = [];
    this.idx = [];
  }
  agregar(pts, d0, d1, y, uvModo = 'mundo', escala = 6) {
    const n = pts.length;
    if (n < 2) return;
    const base = this.pos.length / 3;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1];
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      // Normal promedio con inglete limitado en las curvas cerradas.
      let nx = -dz, nz = dx;
      if (i > 0 && i < n - 1) {
        const p = pts[i - 1], q = pts[i], r = pts[i + 1];
        let ux = q[0] - p[0], uz = q[1] - p[1];
        let vx = r[0] - q[0], vz = r[1] - q[1];
        const lu = Math.hypot(ux, uz) || 1, lv = Math.hypot(vx, vz) || 1;
        ux /= lu; uz /= lu; vx /= lv; vz /= lv;
        const mx = -(uz + vz), mz = ux + vx;
        const ml = Math.hypot(mx, mz);
        if (ml > 1e-3) {
          const cos = (mx / ml) * -uz + (mz / ml) * ux;
          const k = 1 / Math.max(0.5, cos);
          nx = (mx / ml) * k; nz = (mz / ml) * k;
        }
      }
      if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      for (const d of [d0, d1]) {
        const vx = pts[i][0] + nx * d, vz = pts[i][1] + nz * d;
        this.pos.push(vx, alturaEn(vx, vz) + y, vz);
        if (uvModo === 'mundo') this.uv.push(vx / escala, vz / escala);
        else this.uv.push(d === d0 ? 0 : 1, s / escala);
      }
      if (i > 0) {
        const o = base + (i - 1) * 2;
        // Cara hacia arriba sin importar el lado.
        if (d1 > d0) this.idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
        else this.idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
      }
    }
  }
  malla(mat) {
    if (!this.idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    return m;
  }
}

export function crearCalles(T) {
  const franjas = {
    asfalto: new Franja(), avenida: new Franja(), adoquin: new Franja(), andador: new Franja(),
    terraceria: new Franja(), banqueta: new Franja(), guarnicion: new Franja(), raya: new Franja(),
  };
  const postes = [];

  for (const c of CALLES) {
    const pts = remuestrear(c.pts);
    const h = c.w / 2;
    const capa = CAPAS[c.c] || CAPAS.r;
    if (c.c === 'a') {
      franjas.andador.agregar(pts, -h, h, capa.y);
      continue;
    }
    if (c.c === 'c') {
      franjas.terraceria.agregar(pts, -h, h, capa.y);
      continue;
    }
    const f = c.c === 'e' ? franjas.adoquin : c.c === 'r' ? franjas.asfalto : franjas.avenida;
    f.agregar(pts, -h, h, capa.y);
    const [mx, mz] = pts[Math.floor(pts.length / 2)];
    const dentro = mx > JUEGO.x0 - 100 && mx < JUEGO.x1 + 100 && mz > JUEGO.z0 - 100 && mz < JUEGO.z1 + 100;
    if (!dentro) continue;
    if (c.c !== 'v') {
      const ancho = c.c === 'e' ? 1.2 : 1.8;
      franjas.banqueta.agregar(pts, -h - ancho, -h, CAPAS.banqueta.y);
      franjas.banqueta.agregar(pts, h, h + ancho, CAPAS.banqueta.y);
      franjas.guarnicion.agregar(pts, -h - 0.25, -h, CAPAS.guarnicion.y);
      franjas.guarnicion.agregar(pts, h, h + 0.25, CAPAS.guarnicion.y);
    }
    if ('stp'.includes(c.c) && !c.u) {
      // La raya se corta cerca de los extremos (cruces).
      const largo = pts.length * 5;
      if (largo > 20) franjas.raya.agregar(pts.slice(2, -2), -0.07, 0.07, CAPAS.raya.y, 'largo', 6);
    }
    // Postes de luz de un lado de la calle.
    if (c.c !== 'e') {
      let acum = 0;
      for (let k = 1; k < pts.length; k++) {
        const [ax, az] = pts[k - 1], [bx, bz] = pts[k];
        acum += Math.hypot(bx - ax, bz - az);
        if (acum < 34) continue;
        acum = 0;
        const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1;
        const lado = c.u ? 1 : -1;
        const x = bx + (-dz / l) * (h + 1.2) * lado, z = bz + (dx / l) * (h + 1.2) * lado;
        if (x < JUEGO.x0 || x > JUEGO.x1 || z < JUEGO.z0 || z > JUEGO.z1) continue;
        const otra = calleCercana(x, z, 10, true);
        if (otra && otra.d < otra.calle.w / 2 + 0.5) continue; // cae en un cruce
        // El brazo (eje x local) apunta hacia la calle.
        postes.push({ x, z, ang: Math.atan2(dx * lado, dz * lado) });
      }
    }
  }

  const grupo = new THREE.Group();
  const mats = {
    asfalto: material({ map: T.asfalto, color: 0xa9a9ab }, CAPAS.r.k),
    avenida: material({ map: T.asfalto, color: 0x8f8f92 }, CAPAS.s.k),
    adoquin: material({ map: T.adoquin, normalMap: T.adoquinN }, CAPAS.e.k),
    andador: material({ map: T.concreto, color: 0xd8d0c0 }, CAPAS.a.k),
    terraceria: material({ map: T.tierra, color: 0xd9c9a8 }, CAPAS.c.k),
    banqueta: material({ map: T.concreto }, CAPAS.banqueta.k),
    guarnicion: material({ color: 0xe4e0d6, roughness: 0.8 }, CAPAS.guarnicion.k),
    raya: material({ map: T.raya, transparent: true, alphaTest: 0.5 }, CAPAS.raya.k),
  };
  for (const [k, f] of Object.entries(franjas)) {
    const m = f.malla(mats[k]);
    if (m) grupo.add(m);
  }
  grupo.add(crearPostes(postes));
  return { grupo, postes };
}

function crearPostes(lista) {
  const g1 = new THREE.CylinderGeometry(0.07, 0.1, 7, 6);
  g1.translate(0, 3.5, 0);
  const g2 = new THREE.BoxGeometry(1.6, 0.08, 0.08);
  g2.translate(0.75, 6.9, 0);
  const g3 = new THREE.BoxGeometry(0.55, 0.12, 0.25);
  g3.translate(1.5, 6.82, 0);
  const geo = unir([g1, g2, g3]);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8c9096, roughness: 0.5, metalness: 0.6 });
  const m = new THREE.InstancedMesh(geo, mat, lista.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  lista.forEach((p, i) => {
    q.setFromAxisAngle(up, p.ang);
    mtx.compose(new THREE.Vector3(p.x, alturaEn(p.x, p.z) + 0.05, p.z), q, new THREE.Vector3(1, 1, 1));
    m.setMatrixAt(i, mtx);
  });
  m.castShadow = true;
  return m;
}

export function unir(geos) {
  const conIndice = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const g of conIndice) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const g of conIndice) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}
