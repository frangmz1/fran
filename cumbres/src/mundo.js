// Datos reales del mapa (generados por scripts/datos.py) y consultas rápidas:
// altura del terreno, calle más cercana y límites del juego.
// Coordenadas en metros: x = este, z = sur, y = altura sobre BASE.
import mapa from './data/mapa.json';

export const MAPA = mapa;

// --- Relieve ---------------------------------------------------------------
const R = mapa.relieve;
export const RELIEVE = { x0: R.x0, z0: R.z0, paso: R.paso, nx: R.nx, nz: R.nz };

const bytes = Uint8Array.from(atob(R.datos), (c) => c.charCodeAt(0));
const crudo = new Uint16Array(bytes.buffer);
export const ALTURAS = new Float32Array(R.nx * R.nz);

// Altura del centro de Cumbres: todo se mide respecto a ella.
const alturaCruda = (i, j) => crudo[j * R.nx + i] / 10 + R.min;
const ci = Math.round(-R.x0 / R.paso), cj = Math.round(-R.z0 / R.paso);
export const BASE = Math.round(alturaCruda(ci, cj));
for (let k = 0; k < ALTURAS.length; k++) ALTURAS[k] = crudo[k] / 10 + R.min - BASE;

export const TERRENO = {
  x0: R.x0,
  z0: R.z0,
  x1: R.x0 + (R.nx - 1) * R.paso,
  z1: R.z0 + (R.nz - 1) * R.paso,
};

// Misma triangulación que la malla del terreno (diagonal de (i+1,j) a (i,j+1)).
export function alturaEn(x, z) {
  const fx = (x - R.x0) / R.paso, fz = (z - R.z0) / R.paso;
  const i = Math.max(0, Math.min(R.nx - 2, Math.floor(fx)));
  const j = Math.max(0, Math.min(R.nz - 2, Math.floor(fz)));
  const tx = Math.min(1, Math.max(0, fx - i)), tz = Math.min(1, Math.max(0, fz - j));
  const k = j * R.nx + i;
  const h00 = ALTURAS[k], h10 = ALTURAS[k + 1], h01 = ALTURAS[k + R.nx], h11 = ALTURAS[k + R.nx + 1];
  if (tx + tz <= 1) return h00 + (h10 - h00) * tx + (h01 - h00) * tz;
  return h11 + (h01 - h11) * (1 - tx) + (h10 - h11) * (1 - tz);
}

// --- Límites -------------------------------------------------------------------
const [jx0, jz0, jx1, jz1] = mapa.juego;
export const JUEGO = { x0: jx0, z0: jz0, x1: jx1, z1: jz1 };

// --- Utilidades de polígonos -------------------------------------------------------
export function puntos(plano) {
  const out = [];
  for (let i = 0; i < plano.length; i += 2) out.push([plano[i], plano[i + 1]]);
  return out;
}

export function dentroDe(pts, x, z) {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dentro = !dentro;
  }
  return dentro;
}

// Rejilla espacial genérica para buscar cosas cerca de un punto.
export class Rejilla {
  constructor(celda = 24) {
    this.celda = celda;
    this.mapa = new Map();
  }
  clave(i, j) {
    return i * 100003 + j;
  }
  // Registra un objeto en todas las celdas que toca su caja.
  agregar(obj, x0, z0, x1, z1) {
    const c = this.celda;
    for (let i = Math.floor(Math.min(x0, x1) / c); i <= Math.floor(Math.max(x0, x1) / c); i++) {
      for (let j = Math.floor(Math.min(z0, z1) / c); j <= Math.floor(Math.max(z0, z1) / c); j++) {
        const k = this.clave(i, j);
        let lista = this.mapa.get(k);
        if (!lista) this.mapa.set(k, (lista = []));
        lista.push(obj);
      }
    }
  }
  // Objetos cerca de (x, z) dentro de un radio (sin repetir).
  cerca(x, z, r, out = []) {
    const c = this.celda;
    out.length = 0;
    const visto = this._visto || (this._visto = new Set());
    visto.clear();
    for (let i = Math.floor((x - r) / c); i <= Math.floor((x + r) / c); i++) {
      for (let j = Math.floor((z - r) / c); j <= Math.floor((z + r) / c); j++) {
        const lista = this.mapa.get(this.clave(i, j));
        if (!lista) continue;
        for (const o of lista) {
          if (visto.has(o)) continue;
          visto.add(o);
          out.push(o);
        }
      }
    }
    return out;
  }
}

// --- Calles --------------------------------------------------------------------------
export const CALLES = mapa.calles.map((c) => ({ ...c, pts: puntos(c.p) }));
export const PARA_AUTOS = new Set(['v', 'p', 's', 't', 'r', 'e']);

// Tramos de calle en una rejilla para saber en qué calle estás.
const tramos = new Rejilla(30);
for (const c of CALLES) {
  for (let k = 1; k < c.pts.length; k++) {
    const [ax, az] = c.pts[k - 1], [bx, bz] = c.pts[k];
    tramos.agregar({ calle: c, ax, az, bx, bz }, ax, az, bx, bz);
  }
}

export function distTramo(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
  const qx = ax + dx * t, qz = az + dz * t;
  return { d: Math.hypot(px - qx, pz - qz), x: qx, z: qz, t };
}

const tmpLista = [];
// Calle más cercana a un punto (solo las de autos si soloAutos).
export function calleCercana(x, z, radio = 25, soloAutos = false) {
  let mejor = null;
  for (const s of tramos.cerca(x, z, radio, tmpLista)) {
    if (soloAutos && !PARA_AUTOS.has(s.calle.c)) continue;
    const r = distTramo(x, z, s.ax, s.az, s.bx, s.bz);
    if (r.d <= radio && (!mejor || r.d < mejor.d)) {
      mejor = { d: r.d, x: r.x, z: r.z, calle: s.calle, ang: Math.atan2(s.bz - s.az, s.bx - s.ax) };
    }
  }
  return mejor;
}

// ¿Está el punto dentro de Cumbres del Lago? (la caja del script de datos sin margen)
export function enCumbres(x, z) {
  return x > JUEGO.x0 + 250 && x < JUEGO.x1 - 250 && z > JUEGO.z0 + 250 && z < JUEGO.z1 - 250;
}

// Generador pseudoaleatorio con semilla (misma casa = mismo diseño siempre).
export function semilla(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function aleatorio() {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function elegir(r, opciones) {
  // opciones: [[valor, peso], ...]
  let total = 0;
  for (const [, p] of opciones) total += p;
  let v = r() * total;
  for (const [valor, p] of opciones) {
    v -= p;
    if (v <= 0) return valor;
  }
  return opciones[opciones.length - 1][0];
}
