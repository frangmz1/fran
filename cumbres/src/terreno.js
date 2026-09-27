// Terreno con el relieve real, colores de suelo (parques, monte, tierra),
// lago y ponds, y una falda de cerros lejanos para el horizonte.
import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { MAPA, RELIEVE, ALTURAS, TERRENO, BASE, CALLES, alturaEn, puntos } from './mundo.js';
import { aTextura } from './texturas.js';

const perlin = new ImprovedNoise();

export function crearTerreno(T, envMap) {
  const { nx, nz, paso, x0, z0 } = RELIEVE;

  // Malla de la rejilla con la misma diagonal que alturaEn().
  const pos = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      pos[k * 3] = x0 + i * paso;
      pos[k * 3 + 1] = ALTURAS[k];
      pos[k * 3 + 2] = z0 + j * paso;
    }
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let n = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx[n++] = a; idx[n++] = c; idx[n++] = b;
      idx[n++] = b; idx[n++] = c; idx[n++] = d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();

  const mezcla = mapaDeSuelos();
  const mat = materialTerreno(T, mezcla);
  const malla = new THREE.Mesh(geo, mat);
  malla.receiveShadow = true;

  const grupo = new THREE.Group();
  grupo.add(malla, falda(mat), crearAgua(T, envMap));
  return { grupo, mezcla, material: mat };
}

// Canvas que dice qué suelo hay en cada punto: R = pasto verde (parques),
// G = monte y zacate, B = tierra suelta. Negro = suelo de la colonia.
function mapaDeSuelos() {
  const W = 2048;
  const H = Math.round((W * (TERRENO.z1 - TERRENO.z0)) / (TERRENO.x1 - TERRENO.x0));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const kx = W / (TERRENO.x1 - TERRENO.x0), kz = H / (TERRENO.z1 - TERRENO.z0);
  const P = (x, z) => [(x - TERRENO.x0) * kx, (z - TERRENO.z0) * kz];
  const poligono = (plano, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    puntos(plano).forEach(([x, z], i) => (i ? ctx.lineTo(...P(x, z)) : ctx.moveTo(...P(x, z))));
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const COLOR = { monte: '#00d000', zacate: '#00a000', cultivo: '#006040', arboles: '#00ff00', tierra: '#0000c0' };
  for (const s of MAPA.suelos) poligono(s.p, COLOR[s.t] || '#000');
  for (const p of MAPA.parques) poligono(p.p, p.t === 'jardin' ? '#c00000' : '#ff0000');
  // Glorietas: el centro es jardín.
  for (const cl of CALLES) {
    const a = cl.pts[0], b = cl.pts[cl.pts.length - 1];
    if (cl.pts.length > 6 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 1 && cl.c !== 'a') {
      const pts = cl.pts.map(([x, z]) => [x, z]);
      let per = 0;
      for (let k = 1; k < pts.length; k++) per += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (per < 260) poligono(cl.p, '#ff0000');
    }
  }
  const textura = aTextura(c, { repetir: false, srgb: false });
  textura.wrapS = textura.wrapT = THREE.ClampToEdgeWrapping;
  return { canvas: c, textura, P };
}

function materialTerreno(T, mezcla) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.97, metalness: 0, map: T.tierra });
  const u = {
    tMezcla: { value: mezcla.textura },
    tZacate: { value: T.zacate },
    tPasto: { value: T.pasto },
    tMonte: { value: T.monte },
    uCaja: { value: new THREE.Vector4(TERRENO.x0, TERRENO.z0, TERRENO.x1 - TERRENO.x0, TERRENO.z1 - TERRENO.z0) },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMundo;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vMundo;
        uniform sampler2D tMezcla, tZacate, tPasto, tMonte;
        uniform vec4 uCaja;
        vec3 dos(sampler2D t, vec2 p) {
          return mix(texture2D(t, p / 6.0).rgb, texture2D(t, p / 29.0).rgb, 0.45);
        }`,
      )
      .replace(
        '#include <map_fragment>',
        `vec2 wp = vMundo.xz;
        vec4 m = texture2D(tMezcla, (wp - uCaja.xy) / uCaja.zw);
        float manchas = texture2D(tZacate, wp / 173.0).g;
        vec3 col = mix(dos(map, wp), dos(tZacate, wp), smoothstep(0.35, 0.65, manchas));
        col = mix(col, dos(tMonte, wp), smoothstep(0.2, 0.7, m.g));
        col = mix(col, dos(map, wp) * 1.08, smoothstep(0.2, 0.7, m.b));
        col = mix(col, dos(tPasto, wp), smoothstep(0.25, 0.7, m.r));
        diffuseColor.rgb *= col;`,
      );
  };
  return mat;
}

// Rejilla gruesa alrededor del terreno real con cerros de ruido; queda
// escondida debajo del terreno real y hacia afuera se pierde en la neblina.
function falda(mat) {
  const L = 14000, N = 140;
  const g = new THREE.PlaneGeometry(L, L, N, N);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const cx = (TERRENO.x0 + TERRENO.x1) / 2, cz = (TERRENO.z0 + TERRENO.z1) / 2;
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k) + cx, z = p.getZ(k) + cz;
    const qx = Math.max(TERRENO.x0, Math.min(TERRENO.x1, x));
    const qz = Math.max(TERRENO.z0, Math.min(TERRENO.z1, z));
    const fuera = Math.hypot(x - qx, z - qz);
    let h = alturaEn(qx, qz) - 3;
    if (fuera > 0) {
      const k2 = Math.min(1, fuera / 1500);
      const cerros = (perlin.noise(x / 1400, z / 1400, 0.3) * 0.5 + 0.5) * 260 + perlin.noise(x / 400, z / 400, 2.1) * 40;
      h = alturaEn(qx, qz) - 0.3 + (cerros - 40) * k2 * k2;
    }
    p.setXYZ(k, x, h, z);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = false;
  return m;
}

function crearAgua(T, envMap) {
  const grupo = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3e5f5c,
    roughness: 0.12,
    metalness: 0.15,
    normalMap: T.aguaN,
    normalScale: new THREE.Vector2(0.35, 0.35),
    envMap,
    envMapIntensity: 1.2,
  });
  T.aguaN.repeat.set(1 / 18, 1 / 18);
  for (const a of MAPA.agua) {
    const shape = new THREE.Shape(puntos(a.p).map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    // UV en metros para el oleaje.
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k), p.getZ(k));
    const m = new THREE.Mesh(g, mat);
    m.position.y = a.y - BASE;
    m.receiveShadow = true;
    grupo.add(m);
  }
  grupo.userData.animar = (t) => {
    T.aguaN.offset.set(t * 0.004, t * 0.0025);
  };
  return grupo;
}

// Nivel del agua si el punto está dentro de un lago (o null).
const LAGOS = MAPA.agua.map((a) => {
  const pts = puntos(a.p);
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { pts, y: a.y - BASE, x0, z0, x1, z1 };
});

export function nivelDeAgua(x, z) {
  for (const l of LAGOS) {
    if (x < l.x0 || x > l.x1 || z < l.z0 || z > l.z1) continue;
    let dentro = false;
    const p = l.pts;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > z) !== (p[j][1] > z) && x < ((p[j][0] - p[i][0]) * (z - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) dentro = !dentro;
    }
    if (dentro) return l.y;
  }
  return null;
}
