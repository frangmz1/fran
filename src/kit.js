// Herramienta para armar edificios con cajas: junta todas las piezas del
// mismo material en una sola malla (menos llamadas de dibujo) y registra
// las cajas de colisión para el jugador.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function makeMaterials(T, envMap) {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const m = {
    concrete: std({ map: T.concrete, normalMap: T.concreteN, roughness: 0.92 }),
    panel: std({ map: T.panel, roughness: 0.6 }),
    plaster: std({ map: T.plaster, roughness: 0.85 }),
    tile: std({ map: T.tile, roughness: 0.35 }),
    brick: std({ map: T.brick, normalMap: T.brickN, roughness: 0.9 }),
    stone: std({ map: T.stone, normalMap: T.stoneN, roughness: 0.95 }),
    roofRed: std({ map: T.roofRed, roughness: 0.9 }),
    roofGray: std({ map: T.roofGray, roughness: 0.9 }),
    lawn: std({ map: T.lawn, roughness: 1 }),
    turf: std({ map: T.turf, roughness: 0.95 }),
    lockers: std({ map: T.lockers, roughness: 0.45, metalness: 0.3 }),
    solar: std({ map: T.solar, roughness: 0.25, metalness: 0.6 }),
    glass: std({ color: 0x6f8c86, roughness: 0.05, metalness: 0.9, envMap, envMapIntensity: 1.1 }),
    glassBlue: std({ color: 0x4d6f8f, roughness: 0.05, metalness: 0.9, envMap }),
    darkGlass: std({ color: 0x2b3338, roughness: 0.1, metalness: 0.8, envMap }),
    steel: std({ color: 0x5b6068, roughness: 0.45, metalness: 0.7 }),
    steelBlue: std({ color: 0x2c3e5c, roughness: 0.5, metalness: 0.6 }),
    white: std({ color: 0xf1f1ee, roughness: 0.7 }),
    yellow: std({ color: 0xf2b21b, roughness: 0.65 }),
    blue: std({ color: 0x2b7fd6, roughness: 0.6 }),
    maroon: std({ color: 0x6e2436, roughness: 0.6 }),
    door: std({ color: 0xa06c3b, roughness: 0.7 }),
    darkWood: std({ color: 0x5a4030, roughness: 0.8 }),
    black: std({ color: 0x1d1f22, roughness: 0.6 }),
    awning: std({ color: 0xb58a5a, roughness: 0.9, side: THREE.DoubleSide }),
    soilPlanter: std({ color: 0x3b2c22, roughness: 1 }),
    terracotta: std({ color: 0xa2573a, roughness: 0.85 }),
    courtBlue: std({ roughness: 0.8 }),
  };
  // Metros que abarca una repetición de la textura.
  const scale = {
    concrete: 4, panel: 6, plaster: 3, tile: 2.4, brick: 3.2, stone: 4, roofRed: 6, roofGray: 6,
    lawn: 3, turf: 5, lockers: 1.6, solar: 2,
  };
  for (const k in m) m[k].userData.uvScale = scale[k] || 1;
  return m;
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);

// Caja con UV en metros según la cara.
function boxGeometry(sx, sy, sz, uvScale) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
    let u, v;
    if (nx > 0.5) { u = z; v = y; }
    else if (ny > 0.5) { u = x; v = z; }
    else { u = x; v = y; }
    uv.setXY(i, u / uvScale, v / uvScale);
  }
  return g;
}

export class Kit {
  constructor(mats, colliders) {
    this.mats = mats;
    this.parts = new Map();
    this.colliders = colliders;
    this.frame = { x: 0, y: 0, z: 0, rot: 0 };
  }

  setFrame(x, y, z, rot) {
    this.frame = { x, y, z, rot };
    return this;
  }

  // Posiciona una geometría ya hecha (en coordenadas del marco actual).
  addGeometry(matKey, g, cx, cy, cz, rotY = 0) {
    const f = this.frame;
    tmpQ.setFromAxisAngle(up, rotY);
    tmpM.compose(new THREE.Vector3(cx, cy, cz), tmpQ, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(tmpM);
    tmpQ.setFromAxisAngle(up, f.rot);
    tmpM.compose(new THREE.Vector3(f.x, f.y, f.z), tmpQ, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(tmpM);
    if (!this.parts.has(matKey)) this.parts.set(matKey, []);
    this.parts.get(matKey).push(g);
    return g;
  }

  // Caja centrada en (cx, cy, cz) del marco. opts.collide / opts.walk registran colisión.
  box(matKey, cx, cy, cz, sx, sy, sz, opts = {}) {
    const mat = this.mats[matKey];
    const g = boxGeometry(sx, sy, sz, mat.userData.uvScale);
    this.addGeometry(matKey, g, cx, cy, cz, opts.rotY || 0);
    if (opts.collide) this.collider(cx, cy - sy / 2, cz, sx / 2, sz / 2, sy, opts.rotY || 0);
    return this;
  }

  // Caja definida por esquinas en vez de centro y tamaño.
  span(matKey, x0, x1, y0, y1, z0, z1, opts) {
    return this.box(matKey, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, opts);
  }

  // Colisión sin geometría visible.
  collider(cx, y0, cz, hx, hz, height, rotY = 0) {
    const f = this.frame;
    const c = Math.cos(f.rot), s = Math.sin(f.rot);
    this.colliders.push({
      cx: f.x + cx * c + cz * s,
      cz: f.z - cx * s + cz * c,
      hx, hz,
      rot: f.rot + rotY,
      y0: f.y + y0,
      y1: f.y + y0 + height,
    });
  }

  build({ castShadow = true } = {}) {
    const group = new THREE.Group();
    for (const [key, geos] of this.parts) {
      const merged = mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g)), false);
      const mesh = new THREE.Mesh(merged, this.mats[key]);
      mesh.castShadow = castShadow && key !== 'glass';
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    this.parts.clear();
    return group;
  }
}
