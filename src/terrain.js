// Terreno: el cerro, las zonas niveladas del campus y los caminos de terracería.
import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { PADS, ROADS } from './layout.js';
import { canvasTexture } from './textures.js';

export const TERRAIN_SIZE = 900;
const SEG = 450;
const STEP = TERRAIN_SIZE / SEG;
const HALF = TERRAIN_SIZE / 2;

const perlin = new ImprovedNoise();
const noise = (x, z, s) => perlin.noise(x / s, z / s, 0.37);
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const gauss = (x, z, cx, cz, amp, sigma) =>
  amp * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * sigma * sigma));

// Relieve natural: sube del complejo (junto a la carretera) hacia las canchas
// en el cerro, con lomas alrededor.
export function naturalHeight(x, z) {
  const t = ((x - 70) * -180 + (z - 125) * -275) / 108025;
  let h = -5 + 34 * smoothstep(-0.3, 1.15, t);
  h += gauss(x, z, 170, -110, 30, 85);
  h += gauss(x, z, 320, 30, 22, 90);
  h += gauss(x, z, -320, 80, 26, 120);
  h += gauss(x, z, -60, -360, 45, 140);
  h += gauss(x, z, 200, -330, 55, 130);
  h += gauss(x, z, -330, -250, 40, 120);
  h += 4.5 * noise(x, z, 95) + 1.6 * noise(x + 50, z, 31) + 0.45 * noise(x, z + 20, 9);
  return h;
}

function rectDist(p, x, z) {
  const dx = x - p.cx, dz = z - p.cz;
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const ox = Math.max(Math.abs(lx) - p.hx, 0);
  const oz = Math.max(Math.abs(lz) - p.hz, 0);
  return Math.hypot(ox, oz);
}

function padHeight(x, z) {
  let h = naturalHeight(x, z);
  let inside = null;
  let bestW = 0, bestY = 0;
  for (const p of PADS) {
    const d = rectDist(p, x, z);
    if (d === 0) inside = p;
    const w = 1 - smoothstep(0, p.blend, d);
    if (w > bestW) { bestW = w; bestY = p.y; }
  }
  if (inside) return inside.y;
  return h + (bestY - h) * bestW;
}

// Muestras densas de cada camino con su altura ya suavizada.
function buildRoadProfiles() {
  return ROADS.map((road) => {
    const samples = [];
    let acc = 0;
    for (let i = 0; i < road.points.length - 1; i++) {
      const [ax, az] = road.points[i];
      const [bx, bz] = road.points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.ceil(len / 2));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        samples.push({ x, z, s: acc + len * t, h: padHeight(x, z) });
      }
      acc += len;
    }
    const last = road.points[road.points.length - 1];
    samples.push({ x: last[0], z: last[1], s: acc, h: padHeight(last[0], last[1]) });
    // Suavizado a lo largo del camino para que no tenga baches bruscos.
    const win = road.kind === 'asphalt' ? 20 : 9;
    for (let pass = 0; pass < 3; pass++) {
      const hs = samples.map((p) => p.h);
      for (let i = 0; i < samples.length; i++) {
        let sum = 0, cnt = 0;
        for (let k = -win; k <= win; k++) {
          const j = i + k;
          if (j >= 0 && j < samples.length) { sum += hs[j]; cnt++; }
        }
        samples[i].h = sum / cnt;
      }
    }
    return { road, samples, length: acc };
  });
}

// Punto más cercano de un camino: distancia y altura del camino en ese punto.
function nearestOnRoad(profile, x, z, maxDist = Infinity) {
  const { road, samples } = profile;
  let best = { d: Infinity, h: 0, s: 0 };
  let acc = 0;
  for (let i = 0; i < road.points.length - 1; i++) {
    const [ax, az] = road.points[i];
    const [bx, bz] = road.points[i + 1];
    const vx = bx - ax, vz = bz - az;
    const len2 = vx * vx + vz * vz;
    const len = Math.sqrt(len2);
    let t = ((x - ax) * vx + (z - az) * vz) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ax + vx * t - x, az + vz * t - z);
    if (d < best.d) best = { d, s: acc + len * t };
    acc += len;
  }
  if (best.d > maxDist) return best;
  // Altura interpolada por distancia recorrida (búsqueda binaria).
  let lo = 0, hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].s < best.s) lo = mid + 1; else hi = mid;
  }
  const idx = lo;
  if (idx <= 0) best.h = samples[0].h;
  else {
    const a = samples[idx - 1], b = samples[idx];
    const t = (best.s - a.s) / Math.max(1e-6, b.s - a.s);
    best.h = a.h + (b.h - a.h) * t;
  }
  return best;
}

export function buildTerrain(T) {
  const profiles = buildRoadProfiles();

  // Rejilla de alturas.
  const N = SEG + 1;
  const heights = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = -HALF + i * STEP, z = -HALF + j * STEP;
      let h = padHeight(x, z);
      for (const pr of profiles) {
        const half = pr.road.width / 2;
        const shoulder = pr.road.kind === 'asphalt' ? 10 : 6;
        const near = nearestOnRoad(pr, x, z, half + shoulder);
        if (near.d < half + shoulder) {
          const w = 1 - smoothstep(half, half + shoulder, near.d);
          h = h + (near.h - 0.15 - h) * w;
        }
      }
      heights[j * N + i] = h;
    }
  }

  function heightAt(x, z) {
    const fx = (x + HALF) / STEP, fz = (z + HALF) / STEP;
    const i = Math.max(0, Math.min(SEG - 1, Math.floor(fx)));
    const j = Math.max(0, Math.min(SEG - 1, Math.floor(fz)));
    const tx = Math.min(1, Math.max(0, fx - i)), tz = Math.min(1, Math.max(0, fz - j));
    const h00 = heights[j * N + i], h10 = heights[j * N + i + 1];
    const h01 = heights[(j + 1) * N + i], h11 = heights[(j + 1) * N + i + 1];
    // Misma triangulación que PlaneGeometry para coincidir con la malla.
    if (tx + tz <= 1) return h00 + (h10 - h00) * tx + (h01 - h00) * tz;
    return h11 + (h01 - h11) * (1 - tx) + (h10 - h11) * (1 - tz);
  }

  // Malla.
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    const i = Math.round((x + HALF) / STEP), j = Math.round((z + HALF) / STEP);
    pos.setY(k, heights[j * N + i]);
  }
  geo.computeVertexNormals();

  const splat = buildSplat(profiles, heightAt);
  const mat = terrainMaterial(T, splat);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;

  const roadsGroup = buildRoadMeshes(profiles, heightAt, T);

  return { mesh, heightAt, profiles, splatCanvas: splat.canvas, roadsGroup, nearestOnRoad };
}

// Mapa de mezcla: R = terracería, G = vegetación, B = roca. Fondo = tierra.
function buildSplat(profiles, heightAt) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  const px = TERRAIN_SIZE / S;
  for (let j = 0; j < S; j++) {
    for (let i = 0; i < S; i++) {
      const x = -HALF + (i + 0.5) * px, z = -HALF + (j + 0.5) * px;
      // Pendiente para poner roca en las laderas.
      const hx = heightAt(x + 1.5, z) - heightAt(x - 1.5, z);
      const hz = heightAt(x, z + 1.5) - heightAt(x, z - 1.5);
      const slope = Math.hypot(hx, hz) / 3;
      let veg = 0.45 + 0.55 * noise(x, z, 40) + 0.35 * noise(x + 9, z, 11);
      // Más monte al suroeste y en las orillas (como en la satelital).
      veg += smoothstep(0, 250, -x + z * 0.3) * 0.35;
      let rock = smoothstep(0.35, 0.9, slope) + 0.6 * smoothstep(0.15, 0.6, noise(x, z + 300, 55));
      rock += gauss(x, z, 150, -120, 0.7, 70);
      const k = (j * S + i) * 4;
      img.data[k] = 0;
      img.data[k + 1] = Math.max(0, Math.min(255, veg * 230));
      img.data[k + 2] = Math.max(0, Math.min(255, rock * 200));
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Caminos y zonas de grava en el canal rojo.
  const toPx = (v) => (v + HALF) / px;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const { road } of profiles) {
    if (road.kind !== 'dirt') continue;
    for (const [extra, alpha] of [[6, 0.25], [3, 0.4], [0, 1]]) {
      ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
      ctx.lineWidth = (road.width + extra) / px;
      ctx.beginPath();
      road.points.forEach(([x, z], k) => (k ? ctx.lineTo(toPx(x), toPx(z)) : ctx.moveTo(toPx(x), toPx(z))));
      ctx.stroke();
    }
  }
  for (const p of PADS) {
    if (p.name === 'complejo' || p.name === 'plataforma') continue;
    ctx.save();
    ctx.translate(toPx(p.cx), toPx(p.cz));
    ctx.rotate(-p.rot);
    ctx.fillStyle = 'rgba(255,0,0,0.85)';
    ctx.fillRect(-(p.hx + 3) / px, -(p.hz + 3) / px, (2 * p.hx + 6) / px, (2 * p.hz + 6) / px);
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  const tex = canvasTexture(c, { repeat: false, srgb: false });
  return { canvas: c, texture: tex };
}

function terrainMaterial(T, splat) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, map: T.soil });
  const uniforms = {
    tSplat: { value: splat.texture },
    tDirt: { value: T.dirt },
    tGrass: { value: T.grass },
    tRock: { value: T.rock },
    uHalf: { value: HALF },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWorldPos;
        uniform sampler2D tSplat, tDirt, tGrass, tRock;
        uniform float uHalf;
        vec3 tri(sampler2D t, vec2 p) {
          // Dos escalas para disimular la repetición de la textura.
          return mix(texture2D(t, p / 7.0).rgb, texture2D(t, p / 31.0).rgb, 0.4);
        }`,
      )
      .replace(
        '#include <map_fragment>',
        `vec2 wp = vWorldPos.xz;
        vec4 sp = texture2D(tSplat, (wp + uHalf) / (2.0 * uHalf));
        vec3 col = tri(map, wp);
        col = mix(col, tri(tGrass, wp), smoothstep(0.25, 0.75, sp.g));
        col = mix(col, tri(tRock, wp), smoothstep(0.3, 0.8, sp.b));
        col = mix(col, tri(tDirt, wp), smoothstep(0.1, 0.6, sp.r));
        diffuseColor.rgb *= col;`,
      );
  };
  return mat;
}

// Carretera de asfalto con sus rayas.
function buildRoadMeshes(profiles, heightAt, T) {
  const group = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1024;
  const x = c.getContext('2d');
  const tmp = T.asphalt.image;
  for (let k = 0; k < 4; k++) x.drawImage(tmp, 0, 0, 512, 512, 0, k * 256, 256, 256);
  x.fillStyle = '#e8e6df';
  x.fillRect(10, 0, 6, 1024);
  x.fillRect(240, 0, 6, 1024);
  x.fillStyle = '#e0b52a';
  for (let k = 0; k < 4; k++) x.fillRect(125, k * 256, 6, 150);
  const tex = canvasTexture(c);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide });

  for (const { road, samples } of profiles) {
    if (road.kind !== 'asphalt') continue;
    const verts = [], uvs = [], idx = [];
    samples.forEach((p, i) => {
      const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
      let dx = b.x - a.x, dz = b.z - a.z;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      const nx = -dz, nz = dx;
      for (const side of [-1, 1]) {
        const vx = p.x + nx * side * road.width / 2, vz = p.z + nz * side * road.width / 2;
        verts.push(vx, heightAt(vx, vz) + 0.12, vz);
        uvs.push(side < 0 ? 0 : 1, p.s / 24);
      }
      if (i > 0) {
        const o = (i - 1) * 2;
        idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

// Cerros lejanos alrededor del mapa (solo decoración).
export function buildFarHills() {
  const rings = 40, segs = 180;
  const r0 = HALF - 20, r1 = 2600;
  const verts = [], colors = [], idx = [];
  const col = new THREE.Color();
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const rad = r0 + (r1 - r0) * t * t;
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      const ridge = 1 - Math.abs(perlin.noise(Math.cos(a) * 3, Math.sin(a) * 3, t * 2));
      let h = smoothstep(0, 0.6, t) * (25 + 120 * ridge * ridge) * (0.6 + 0.4 * noise(x, z, 400));
      h += noise(x, z, 120) * 25 * smoothstep(0, 0.2, t);
      h = r === 0 ? naturalHeight(x * 0.999, z * 0.999) : Math.max(h, -3);
      verts.push(x, h, z);
      col.setRGB(0.36 + 0.1 * ridge, 0.4 + 0.08 * ridge, 0.26);
      colors.push(col.r, col.g, col.b);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = r * (segs + 1) + s, b = a + segs + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
}
