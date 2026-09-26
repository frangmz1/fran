// Vegetación del semidesierto queretano: mezquites y huizaches, matorral,
// nopales y piedras. Todo con InstancedMesh para que sea ligero.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PADS, ROADS } from './layout.js';
import { TERRAIN_SIZE } from './terrain.js';
import { rand } from './textures.js';

function colorize(g, color, jitter = 0.08) {
  const n = g.attributes.position.count;
  const cols = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    c.set(color);
    const j = 1 + (rand() - 0.5) * jitter * 2;
    cols[i * 3] = c.r * j; cols[i * 3 + 1] = c.g * j; cols[i * 3 + 2] = c.b * j;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}

function blob(r, sx, sy, sz, detail = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.78 + rand() * 0.4;
    p.setXYZ(i, p.getX(i) * sx * k, p.getY(i) * sy * k, p.getZ(i) * sz * k);
  }
  g.computeVertexNormals();
  return g;
}

function strip(g) {
  // Deja solo posición, normal y color para poder unir geometrías.
  const out = new THREE.BufferGeometry();
  const ng = g.index ? g.toNonIndexed() : g;
  out.setAttribute('position', ng.attributes.position);
  out.setAttribute('normal', ng.attributes.normal);
  out.setAttribute('color', ng.attributes.color);
  return out;
}

// Mezquite: tronco torcido que se abre en varias ramas y copa ancha y baja.
function mesquite(green) {
  const parts = [];
  const trunk = colorize(new THREE.CylinderGeometry(0.12, 0.2, 1.6, 6).translate(0, 0.8, 0), '#4a3a2c', 0.1);
  parts.push(trunk);
  const branches = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + rand();
    const b = new THREE.CylinderGeometry(0.05, 0.1, 1.8, 5).translate(0, 0.9, 0);
    b.rotateZ(0.6 + rand() * 0.3);
    b.rotateY(a);
    b.translate(0, 1.4, 0);
    parts.push(colorize(b, '#4a3a2c', 0.1));
    const cx = Math.cos(a) * 1.3, cz = -Math.sin(a) * 1.3;
    parts.push(colorize(blob(1, 1.5, 0.75, 1.5).translate(cx, 2.6 + rand() * 0.4, cz), green, 0.12));
  }
  parts.push(colorize(blob(1, 1.7, 0.8, 1.7).translate(0, 3, 0), green, 0.12));
  return mergeGeometries(parts.map(strip));
}

// Árbol de ornato (fresno), más redondo y verde.
function ornamental() {
  const parts = [
    colorize(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 7).translate(0, 1.2, 0), '#5a4535'),
    colorize(blob(1, 1.8, 1.9, 1.8, 2).translate(0, 3.8, 0), '#3f6a2a', 0.15),
    colorize(blob(1, 1.2, 1.2, 1.2, 1).translate(0.9, 4.6, 0.4), '#46742f', 0.15),
    colorize(blob(1, 1.1, 1.1, 1.1, 1).translate(-0.8, 3.3, -0.5), '#3a6326', 0.15),
  ];
  return mergeGeometries(parts.map(strip));
}

function shrub() {
  const parts = [];
  for (let i = 0; i < 3; i++) {
    parts.push(colorize(blob(1, 0.7, 0.55, 0.7).translate((rand() - 0.5) * 0.9, 0.4, (rand() - 0.5) * 0.9), '#4f5a30', 0.15));
  }
  return mergeGeometries(parts.map(strip));
}

function nopal() {
  const parts = [];
  const pad = (x, y, z, ry, rz, s) =>
    colorize(
      new THREE.SphereGeometry(0.35, 8, 6).scale(s, s * 1.3, s * 0.18).rotateZ(rz).rotateY(ry).translate(x, y, z),
      '#6b8a4a', 0.1,
    );
  parts.push(pad(0, 0.45, 0, 0, 0, 1));
  parts.push(pad(0.25, 0.95, 0, 0.3, -0.5, 0.85));
  parts.push(pad(-0.25, 0.95, 0.05, -0.4, 0.5, 0.8));
  parts.push(pad(0.05, 1.4, 0, 1.2, 0.1, 0.7));
  parts.push(pad(0.4, 1.35, 0.1, 0.8, -0.8, 0.6));
  return mergeGeometries(parts.map(strip));
}

function rock() {
  const g = new THREE.DodecahedronGeometry(0.6, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * 0.55);
  g.computeVertexNormals();
  return strip(colorize(g, '#8d877c', 0.15));
}

function blocked(x, z) {
  for (const p of PADS) {
    const dx = x - p.cx, dz = z - p.cz;
    const c = Math.cos(p.rot), s = Math.sin(p.rot);
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) < p.hx + 4 && Math.abs(lz) < p.hz + 4) return true;
  }
  for (const r of ROADS) {
    const m = r.width / 2 + (r.kind === 'asphalt' ? 5 : 2.5);
    for (let i = 0; i < r.points.length - 1; i++) {
      const [ax, az] = r.points[i], [bx, bz] = r.points[i + 1];
      const vx = bx - ax, vz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
      if (Math.hypot(ax + vx * t - x, az + vz * t - z) < m) return true;
    }
  }
  return false;
}

export function buildVegetation({ heightAt, splatCanvas, extraTrees, colliders }) {
  const group = new THREE.Group();
  const S = splatCanvas.width;
  const splat = splatCanvas.getContext('2d').getImageData(0, 0, S, S).data;
  const half = TERRAIN_SIZE / 2;
  const sample = (x, z) => {
    const i = Math.floor(((x + half) / TERRAIN_SIZE) * S), j = Math.floor(((z + half) / TERRAIN_SIZE) * S);
    const k = (Math.max(0, Math.min(S - 1, j)) * S + Math.max(0, Math.min(S - 1, i))) * 4;
    return { veg: splat[k + 1] / 255, rock: splat[k + 2] / 255 };
  };

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  function scatter(geos, count, accept, scaleFn, { shadow = true, collide = 0 } = {}) {
    const lists = geos.map(() => []);
    let tries = 0;
    while (lists.reduce((s, l) => s + l.length, 0) < count && tries < count * 25) {
      tries++;
      const x = (rand() - 0.5) * (TERRAIN_SIZE - 20), z = (rand() - 0.5) * (TERRAIN_SIZE - 20);
      if (blocked(x, z)) continue;
      const s = sample(x, z);
      if (!accept(s, x, z)) continue;
      lists[Math.floor(rand() * geos.length)].push({ x, z, y: heightAt(x, z), s: scaleFn() });
    }
    geos.forEach((g, gi) => addInstances(g, lists[gi], shadow, collide));
  }

  function addInstances(g, list, shadow, collide) {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y - 0.1, p.z);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      color.setHSL(0, 0, 0.85 + rand() * 0.3);
      im.setColorAt(i, color);
      if (collide) {
        colliders.push({ cx: p.x, cz: p.z, hx: collide * p.s, hz: collide * p.s, rot: 0, y0: p.y - 1, y1: p.y + 3 });
      }
    });
    im.castShadow = shadow;
    im.receiveShadow = true;
    im.instanceMatrix.needsUpdate = true;
    group.add(im);
  }

  const mesquites = [mesquite('#55663a'), mesquite('#4b5f33'), mesquite('#627043')];
  scatter(mesquites, 2600, (s) => rand() < 0.15 + s.veg * 0.9 - s.rock * 0.5, () => 0.7 + rand() * 0.7, { collide: 0.28 });
  scatter([shrub(), shrub()], 4200, (s) => rand() < 0.3 + s.veg * 0.6, () => 0.6 + rand() * 0.9, { shadow: false });
  scatter([nopal()], 520, (s) => rand() < 0.4 + s.rock * 0.4, () => 0.8 + rand() * 0.8, { shadow: true });
  scatter([rock()], 900, (s) => rand() < 0.1 + s.rock, () => 0.3 + rand() * 1.4, { shadow: false });

  // Árboles de ornato del campus.
  const orn = ornamental();
  addInstances(orn, extraTrees.map((t) => ({ ...t, y: t.y + 0.1 })), true, 0.25);

  return group;
}
