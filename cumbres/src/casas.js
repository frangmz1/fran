// Casas sobre su huella real (satélite). Cada una tiene su fachada hacia la
// calle: cochera con portón, puerta, ventanas, volado, pretil, tinaco y a
// veces calentador solar o tanque de gas. El diseño sale de una semilla con
// el id de la casa, así que siempre se ve igual.
//
// Para que miles de casas corran fluido se juntan por zonas de 200 m y por
// material en pocas mallas.
import * as THREE from 'three';
import { MAPA, alturaEn, puntos, semilla, elegir, dentroDe } from './mundo.js';
import personalizadasRepo from './data/personalizadas.json';

const PISO = 2.85;
const ZONA = 200;

const MUROS = [
  ['#efede8', 30], ['#e8dfcd', 18], ['#dccbab', 12], ['#cfccc6', 12], ['#bdb3a4', 8],
  ['#b9714f', 4], ['#d8a84a', 3], ['#737371', 5], ['#e9e2d9', 8], ['#a9b3b8', 2],
];
const ACENTOS = [['piedra', 30], ['#3b3c3e', 22], ['#8a5a36', 18], ['#c9a18e', 8], ['#f4f3ef', 12], ['#6d4c3a', 10]];
const PORTONES = [['#6b4a30', 30], ['#2a2a2a', 25], ['#8a8d92', 20], ['#e6e6e2', 15], ['#4a3526', 10]];
const AZOTEAS = [['#b8563f', 45], ['#9d9b97', 35], ['#e6e4de', 20]];

const color = (hex) => new THREE.Color(hex);
const BLANCO = color('#ffffff');

// Acumula triángulos de un material.
class Capa {
  constructor(escalaUV) {
    this.pos = [];
    this.uv = [];
    this.col = [];
    this.idx = [];
    this.escala = escalaUV;
  }
  get n() {
    return this.pos.length / 3;
  }
  vert(x, y, z, u, v, c) {
    this.pos.push(x, y, z);
    this.uv.push(u, v);
    this.col.push(c.r * 255, c.g * 255, c.b * 255);
  }
  // Cuatro vértices en orden (abajo-izq, arriba-izq, arriba-der, abajo-der)
  // vistos desde afuera. uvs = [u0, v0, u1, v1].
  quad(p0, p1, p2, p3, uvs, c) {
    const o = this.n;
    const [u0, v0, u1, v1] = uvs;
    this.vert(p0[0], p0[1], p0[2], u0, v0, c);
    this.vert(p1[0], p1[1], p1[2], u0, v1, c);
    this.vert(p2[0], p2[1], p2[2], u1, v1, c);
    this.vert(p3[0], p3[1], p3[2], u1, v0, c);
    this.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  // Muro vertical sobre la arista a→b de un polígono antihorario (cara hacia afuera).
  pared(a, b, y0, y1, c, s0 = 0) {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = this.escala;
    this.quad([a[0], y0, a[1]], [a[0], y1, a[1]], [b[0], y1, b[1]], [b[0], y0, b[1]], [s0 / k, y0 / k, (s0 + l) / k, y1 / k], c);
    return l;
  }
  // Polígono horizontal mirando hacia arriba.
  piso(pts, y, c, ys = null) {
    const contorno = pts.map(([x, z]) => new THREE.Vector2(x, z));
    const tris = THREE.ShapeUtils.triangulateShape(contorno, []);
    const o = this.n;
    const k = this.escala;
    pts.forEach(([x, z], i) => this.vert(x, ys ? ys[i] : y, z, x / k, z / k, c));
    for (const [a, b, d] of tris) {
      const [ax, az] = pts[a], [bx, bz] = pts[b], [dx, dz] = pts[d];
      const cruz = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
      // Antihorario en (x, z) mira hacia abajo en three.js: se voltea.
      if (cruz > 0) this.idx.push(o + a, o + d, o + b);
      else this.idx.push(o + a, o + b, o + d);
    }
  }
  // Agrega una geometría de three.js ya transformada.
  geometria(g, c) {
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    const o = this.n;
    for (let i = 0; i < p.count; i++) this.vert(p.getX(i), p.getY(i), p.getZ(i), uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0, c);
    if (g.index) for (let i = 0; i < g.index.count; i++) this.idx.push(o + g.index.getX(i));
    else for (let i = 0; i < p.count; i++) this.idx.push(o + i);
  }
  malla(mat) {
    if (!this.idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Uint8BufferAttribute(this.col, 3, true));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    return new THREE.Mesh(g, mat);
  }
}

function areaFirmada(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
    a += x0 * z1 - x1 * z0;
  }
  return a / 2;
}

// Polígono encogido t metros hacia adentro (esquinas a inglete).
function encoger(pts, t) {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let d1x = p[0] - a[0], d1z = p[1] - a[1];
    let d2x = b[0] - p[0], d2z = b[1] - p[1];
    const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
    d1x /= l1; d1z /= l1; d2x /= l2; d2z /= l2;
    // Normales hacia adentro (izquierda de la dirección).
    const n1x = -d1z, n1z = d1x, n2x = -d2z, n2z = d2x;
    const k = 1 + n1x * n2x + n1z * n2z;
    if (k < 0.3) return [p[0] + n1x * t, p[1] + n1z * t];
    return [p[0] + ((n1x + n2x) * t) / k, p[1] + ((n1z + n2z) * t) / k];
  });
}

function centroide(pts) {
  let x = 0, z = 0;
  for (const p of pts) { x += p[0]; z += p[1]; }
  return [x / pts.length, z / pts.length];
}

// Marco local de una pared: u a lo largo (de a hacia b), o hacia afuera.
function marco(a, b) {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l;
  const nx = dz, nz = -dx;
  return {
    l, dx, dz, nx, nz,
    p: (u, y, o = 0) => [a[0] + dx * u + nx * o, y, a[1] + dz * u + nz * o],
  };
}

// Rectángulo de fachada [u0,u1]×[y0,y1] separado o metros del muro.
// Desde afuera u crece hacia la izquierda, por eso el atlas va al revés.
function rect(capa, m, u0, u1, y0, y1, o, atlas, c) {
  capa.quad(m.p(u0, y0, o), m.p(u0, y1, o), m.p(u1, y1, o), m.p(u1, y0, o), [atlas[1], 0, atlas[0], 1], c);
}
const VENTANA = [0, 0.5], PUERTA = [0.5, 0.75], PORTON = [0.75, 1];

// Caja orientada con la pared (para volados y paneles).
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), EJE_Y = new THREE.Vector3(0, 1, 0);
function caja(capa, m, u0, u1, y0, y1, o0, o1, c) {
  const g = new THREE.BoxGeometry(u1 - u0, y1 - y0, o1 - o0);
  const [cx, cy, cz] = m.p((u0 + u1) / 2, (y0 + y1) / 2, (o0 + o1) / 2);
  tmpQ.setFromAxisAngle(EJE_Y, Math.atan2(-m.dz, m.dx));
  tmpM.compose(new THREE.Vector3(cx, cy, cz), tmpQ, new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(tmpM);
  const k = capa.escala, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * (u1 - u0)) / k, (uv.getY(i) * (y1 - y0)) / k);
  capa.geometria(g, c);
}

// Cilindro vertical, o acostado a lo largo del ángulo giro (en el plano xz).
function cilindro(capa, x, y, z, r, h, c, giro = null) {
  const g = new THREE.CylinderGeometry(r, r, h, 10, 1);
  if (giro !== null) g.rotateZ(Math.PI / 2).rotateY(giro);
  g.translate(x, y, z);
  capa.geometria(g, c);
}

// Diseño de cada casa. Todo lo que se sortea sale aquí, en el mismo orden
// siempre, para que cambiar una opción en el editor no cambie las demás.
export const OPCIONES = {
  muro: MUROS.map(([c]) => c),
  acento: ['ninguno', 'piedra', '#3b3c3e', '#8a5a36', '#6d4c3a', '#c9a18e', '#f4f3ef'],
  porton: PORTONES.map(([c]) => c),
  azotea: AZOTEAS.map(([c]) => c),
  pisos: [1, 2, 3],
  cochera: ['der', 'izq', 'sin'],
};

function tipoDe(pts) {
  const area = Math.abs(areaFirmada(pts));
  return area > 450 ? 'grande' : area < 30 ? 'cuarto' : 'casa';
}

export function disenoBase(casa, pts) {
  const fila = !!casa.h;
  const r = semilla(fila ? casa.id.slice(0, 10) : casa.id);
  const unidad = fila ? parseInt(casa.id.slice(10), 10) || 0 : 0;
  const tipo = tipoDe(pts);
  let muro = color(elegir(r, tipo === 'grande' ? [['#efede8', 5], ['#cfccc6', 3], ['#e8dfcd', 2]] : MUROS)).getHexString();
  const acento = elegir(r, ACENTOS);
  const porton = elegir(r, PORTONES);
  const azotea = elegir(r, AZOTEAS);
  if (fila) {
    // Variación leve entre casas de la misma hilera.
    muro = color(`#${muro}`).offsetHSL(0, 0, (semilla(casa.id)() - 0.5) * 0.04).getHexString();
  }
  let lado = r() < 0.5;
  if (fila) lado = unidad % 2 === 0 ? lado : !lado;
  const volado = r() < 0.65;
  const voladoFondo = r() < 0.5 ? 0.9 : 0.6;
  const conPanel = r() < 0.6;
  const panelAncho = 0.35 + r() * 0.15;
  const ventanal = r() < 0.3;
  const costados = [r(), r(), r(), r(), r(), r(), r(), r()];
  const estacionar = r() < 0.45;
  const ladoAuto = r() < 0.5 ? -1.3 : 1.3;
  const haciaCasa = r() < 0.7;
  const arbol = r() < 0.3;
  const solar = r() < 0.45;
  const gas = r() < 0.35;
  return {
    tipo, fila,
    muro: `#${muro}`,
    acento: conPanel ? acento : 'ninguno',
    porton, azotea,
    pisos: casa.n,
    cochera: lado ? 'der' : 'izq',
    volado, ventanal,
    voladoFondo, panelAncho, costados, estacionar, ladoAuto, haciaCasa, arbol, solar, gas,
  };
}

// Cambios guardados: los que vienen en el repositorio y los de este navegador.
const CLAVE = 'cumbres-casas-v1';
function leerLocales() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (_) { return {}; }
}
function guardarLocales(obj) {
  try { localStorage.setItem(CLAVE, JSON.stringify(obj)); } catch (_) { /* sin almacenamiento */ }
}

export function crearCasas(T, envMap, ligero = false) {
  const mats = {
    muros: new THREE.MeshStandardMaterial({ map: T.aplanado, vertexColors: true, roughness: 0.9, flatShading: true }),
    azotea: new THREE.MeshStandardMaterial({ map: T.azotea, vertexColors: true, roughness: 0.95, flatShading: true }),
    fachada: new THREE.MeshStandardMaterial({ map: T.fachada, vertexColors: true, roughness: 0.3, metalness: 0.25, envMap, envMapIntensity: 0.7, flatShading: true }),
    piedra: new THREE.MeshStandardMaterial({ map: T.piedra, vertexColors: true, roughness: 0.95, flatShading: true }),
    equipo: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.1, flatShading: true }),
    cochera: new THREE.MeshStandardMaterial({ map: T.concreto, vertexColors: true, roughness: 0.9, flatShading: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -10 }),
  };
  const ESCALAS = { muros: 3, azotea: 5, fachada: 1, piedra: 2.2, equipo: 1, cochera: 1.6 };
  const locales = leerLocales();
  const cambiosDe = (id) => ({ ...(personalizadasRepo[id] || {}), ...(locales[id] || {}) });

  const zonas = new Map();
  const zonaDe = (x, z) => {
    const k = `${Math.floor(x / ZONA)},${Math.floor(z / ZONA)}`;
    let zona = zonas.get(k);
    if (!zona) {
      zona = { casas: [], grupo: new THREE.Group(), detalle: [], cx: (Math.floor(x / ZONA) + 0.5) * ZONA, cz: (Math.floor(z / ZONA) + 0.5) * ZONA };
      zonas.set(k, zona);
    }
    return zona;
  };

  const estacionamientos = [];
  const arboles = [];
  const casas = [];
  const porId = new Map();

  for (const casa of MAPA.casas) {
    let pts = puntos(casa.p);
    if (pts.length < 3) continue;
    if (areaFirmada(pts) < 0) pts = pts.reverse();
    const [cx, cz] = centroide(pts);
    const zona = zonaDe(cx, cz);
    const base = disenoBase(casa, pts);
    const info = { id: casa.id, casa, pts, cx, cz, zona, base };
    zona.casas.push(info);
    casas.push(info);
    porId.set(casa.id, info);
  }

  // Arma (o vuelve a armar) las mallas de una zona.
  function armarZona(zona, primeraVez) {
    const capas = {};
    for (const [nombre, e] of Object.entries(ESCALAS)) capas[nombre] = new Capa(e);
    for (const info of zona.casas) {
      const d = { ...info.base, ...cambiosDe(info.id) };
      construir(info.casa, info.pts, d, capas, primeraVez ? estacionamientos : null, primeraVez ? arboles : null);
    }
    for (const m of zona.grupo.children) m.geometry.dispose();
    zona.grupo.clear();
    zona.detalle = [];
    for (const [nombre, capa] of Object.entries(capas)) {
      const m = capa.malla(mats[nombre]);
      if (!m) continue;
      m.castShadow = nombre === 'muros' || nombre === 'equipo';
      m.receiveShadow = true;
      zona.grupo.add(m);
      if (nombre !== 'muros' && nombre !== 'azotea') zona.detalle.push(m);
    }
  }

  const grupo = new THREE.Group();
  for (const zona of zonas.values()) {
    armarZona(zona, true);
    grupo.add(zona.grupo);
  }

  // Oculta los detalles de las zonas lejanas.
  grupo.userData.actualizar = (cam) => {
    for (const z of zonas.values()) {
      const ver = Math.hypot(cam.x - z.cx, cam.z - z.cz) < (ligero ? 360 : 520);
      for (const m of z.detalle) m.visible = ver;
    }
  };

  // Editor: diseño actual, cambiar una casa y exportar los cambios.
  const editor = {
    diseno(id) {
      const info = porId.get(id);
      return info ? { ...info.base, ...cambiosDe(id) } : null;
    },
    cambiar(id, cambios) {
      const info = porId.get(id);
      if (!info) return;
      const actual = { ...(locales[id] || {}), ...cambios };
      // Solo se guarda lo que es distinto del diseño original.
      for (const k of Object.keys(actual)) if (actual[k] === info.base[k] && personalizadasRepo[id]?.[k] === undefined) delete actual[k];
      if (Object.keys(actual).length) locales[id] = actual;
      else delete locales[id];
      guardarLocales(locales);
      armarZona(info.zona, false);
    },
    restablecer(id) {
      const info = porId.get(id);
      if (!info) return;
      delete locales[id];
      guardarLocales(locales);
      armarZona(info.zona, false);
    },
    exportar() {
      return JSON.stringify({ ...personalizadasRepo, ...locales }, null, 1);
    },
    cuantas() {
      return Object.keys(locales).length;
    },
  };

  return { grupo, estacionamientos, arboles, casas, editor };
}

function construir(casa, pts, d, capas, estacionamientos, arboles) {
  const n = pts.length;
  const { tipo, fila } = d;
  const pisos = d.pisos;

  let hmin = Infinity, hmax = -Infinity;
  for (const [x, z] of pts) {
    const h = alturaEn(x, z);
    hmin = Math.min(hmin, h);
    hmax = Math.max(hmax, h);
  }
  const f = Math.min(casa.f, n - 1);
  const fa = pts[f], fb = pts[(f + 1) % n];
  const hFrente = alturaEn((fa[0] + fb[0]) / 2, (fa[1] + fb[1]) / 2);
  const piso = Math.min(hmax + 0.3, Math.max(hmin + 0.1, hFrente + 0.15));
  const base = hmin - 0.6;
  const techo = piso + pisos * PISO;
  const pretil = techo + (tipo === 'cuarto' ? 0.3 : 0.5);

  const cMuro = color(d.muro);
  const cAcento = d.acento === 'piedra' || d.acento === 'ninguno' ? BLANCO : color(d.acento);
  const cPorton = color(d.porton);
  const cAzotea = color(d.azotea);

  // Muros exteriores del cimiento al pretil.
  let s = 0;
  for (let i = 0; i < n; i++) s += capas.muros.pared(pts[i], pts[(i + 1) % n], base, pretil, cMuro, s);

  // Pretil: cara interior, corona y azotea.
  const adentro = encoger(pts, 0.15);
  for (let i = 0; i < n; i++) capas.muros.pared(adentro[(i + 1) % n], adentro[i], techo, pretil, cMuro);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], ia = adentro[i], ib = adentro[(i + 1) % n];
    capas.muros.piso([a, b, ib, ia], pretil, cMuro);
  }
  capas.azotea.piso(adentro, techo + 0.02, cAzotea);

  const m = marco(fa, fb);
  if (tipo === 'cuarto') {
    if (m.l > 2.2) rect(capas.fachada, m, m.l / 2 - 0.45, m.l / 2 + 0.45, piso, piso + 2.1, 0.03, PUERTA, BLANCO);
    return;
  }

  if (tipo === 'grande') {
    for (let i = 0; i < n; i++) {
      const w = marco(pts[i], pts[(i + 1) % n]);
      if (w.l < 4) continue;
      for (let k = 0; k < pisos; k++) {
        const y0 = piso + k * PISO + (k === 0 && i === f ? 0.15 : 0.95);
        const y1 = piso + k * PISO + 2.45;
        for (let u = 0.6; u + 1.2 < w.l - 0.6; u += 3.2) rect(capas.fachada, w, u, Math.min(w.l - 0.6, u + 2.8), y0, y1, 0.03, VENTANA, BLANCO);
      }
    }
    equipoAzotea(capas, d, pts, m, techo, true);
    return;
  }

  // --- Casa ---------------------------------------------------------------
  const L = m.l;
  const PB = piso; // planta baja
  // Desde la calle, u crece hacia la izquierda: u pequeña = lado derecho.
  const lado = d.cochera !== 'izq';
  const margen = 0.35;
  const gw = d.cochera === 'sin' ? 0 : L >= 11 ? 5.2 : L >= 8 ? 4.8 : L >= 6.2 ? 3 : 0;
  const g0 = lado ? margen : L - margen - gw, g1 = g0 + gw;
  let libre0 = margen, libre1 = L - margen; // espacio libre en planta baja
  if (gw) {
    rect(capas.fachada, m, g0, g1, PB, PB + 2.4, 0.03, PORTON, cPorton);
    if (lado) libre0 = g1 + 0.4; else libre1 = g0 - 0.4;
  }
  // Puerta junto a la cochera.
  const pw = 1.05;
  let p0 = lado ? libre0 : libre1 - pw;
  if (!gw) p0 = L / 2 - pw / 2;
  if (libre1 - libre0 >= pw) {
    rect(capas.fachada, m, p0, p0 + pw, PB, PB + 2.25, 0.03, PUERTA, BLANCO);
    if (!gw) {
      // Sin cochera: ventanas a los dos lados de la puerta.
      for (const [u0, u1] of [[margen + 0.3, p0 - 0.5], [p0 + pw + 0.5, L - margen - 0.3]]) {
        if (u1 - u0 >= 1.2) rect(capas.fachada, m, u0, Math.min(u1, u0 + 2.2), PB + 0.9, PB + 2.2, 0.03, VENTANA, BLANCO);
      }
    } else if (lado) libre0 = p0 + pw + 0.5; else libre1 = p0 - 0.5;
  }
  if (gw && libre1 - libre0 >= 1.4) {
    const w = Math.min(2.2, libre1 - libre0);
    const u0 = (libre0 + libre1) / 2 - w / 2;
    rect(capas.fachada, m, u0, u0 + w, PB + 0.9, PB + 2.2, 0.03, VENTANA, BLANCO);
  }

  // Volado de losa sobre la planta baja.
  if (d.volado && pisos > 1) {
    const vu0 = gw ? Math.max(0, g0 - 0.2) : 0, vu1 = gw ? Math.min(L, g1 + 0.2) : L;
    caja(capas.muros, m, vu0, vu1, PB + PISO - 0.28, PB + PISO + 0.02, 0, d.voladoFondo, cMuro);
  }

  // Panel de acento en la planta alta (piedra, madera o color).
  let a0 = -1, a1 = -1;
  if (pisos > 1 && d.acento !== 'ninguno') {
    const w = Math.max(1.6, L * d.panelAncho);
    a0 = lado ? 0 : L - w;
    a1 = a0 + w;
    caja(d.acento === 'piedra' ? capas.piedra : capas.muros, m, a0, a1, PB + PISO + 0.02, pretil, 0, 0.14, cAcento);
  }

  // Ventanas de los pisos de arriba.
  for (let k = 1; k < pisos; k++) {
    const y = PB + k * PISO;
    const cuantas = L >= 13 ? 3 : L >= 8.5 ? 2 : 1;
    const hueco = L / cuantas;
    for (let v = 0; v < cuantas; v++) {
      const w = Math.min(2.6, Math.max(1.1, hueco - 1.3));
      const u0 = hueco * (v + 0.5) - w / 2;
      const o = u0 + w / 2 > a0 && u0 + w / 2 < a1 ? 0.17 : 0.03;
      if (d.ventanal && v === 0) rect(capas.fachada, m, u0, u0 + w, y + 0.1, y + 2.35, o, VENTANA, BLANCO);
      else rect(capas.fachada, m, u0, u0 + w, y + 0.85, y + 2.3, o, VENTANA, BLANCO);
    }
  }

  // Ventanas atrás (la pared más opuesta al frente) y a los lados si la casa está suelta.
  for (let i = 0; i < n; i++) {
    if (i === f) continue;
    const w = marco(pts[i], pts[(i + 1) % n]);
    const opuesta = w.nx * m.nx + w.nz * m.nz;
    const atras = opuesta < -0.7 && w.l >= 3;
    const costado = !fila && Math.abs(opuesta) < 0.3 && w.l >= 6 && d.costados[i % 8] < 0.5;
    if (!atras && !costado) continue;
    for (let k = 0; k < pisos; k++) {
      const y = PB + k * PISO;
      const cuantas = atras && w.l >= 8 ? 2 : 1;
      for (let v = 0; v < cuantas; v++) {
        const hueco = w.l / cuantas;
        const ww = Math.min(1.8, hueco - 1);
        if (ww < 0.8) continue;
        const u0 = hueco * (v + 0.5) - ww / 2;
        rect(capas.fachada, w, u0, u0 + ww, y + 0.95, y + 2.2, 0.03, VENTANA, BLANCO);
      }
    }
  }

  // Cochera de concreto hasta la calle, auto estacionado y arbolito.
  const largo = Math.max(0, Math.min(10, casa.d - 3.6));
  if (gw && largo > 1) {
    const ys = [];
    const esq = [m.p(g0, 0, 0), m.p(g1, 0, 0), m.p(g1, 0, largo), m.p(g0, 0, largo)].map((p) => [p[0], p[2]]);
    for (const [x, z] of esq) ys.push(alturaEn(x, z) + 0.06);
    capas.cochera.piso(esq, 0, BLANCO, ys);
    if (estacionamientos && largo >= 4.8 && d.estacionar) {
      const [x, , z] = m.p((g0 + g1) / 2 + (gw > 4 ? d.ladoAuto : 0), 0, Math.min(largo - 2.3, 3));
      // ang: el frente del auto mira hacia (sin ang, cos ang).
      const ang = d.haciaCasa ? Math.atan2(-m.nx, -m.nz) : Math.atan2(m.nx, m.nz);
      estacionamientos.push({ x, z, ang, id: casa.id });
    }
  }
  if (arboles && largo > 2.6 && d.arbol) {
    const u = gw ? (lado ? Math.min(L - 1, g1 + 1.5) : Math.max(1, g0 - 1.5)) : L * 0.25;
    const [x, , z] = m.p(u, 0, Math.min(largo - 1, 2.2));
    arboles.push({ x, z, tipo: 'jardin' });
  }

  equipoAzotea(capas, d, pts, m, techo, false);
}

// Tinaco negro, calentador solar y tanque de gas.
function equipoAzotea(capas, d, pts, m, techo, grande) {
  const [cx, cz] = centroide(pts);
  let tx = cx - m.nx * 2.2, tz = cz - m.nz * 2.2;
  if (!dentroDe(pts, tx, tz)) { tx = cx; tz = cz; }
  const y = techo;
  const tinacos = grande ? 3 : 1;
  for (let k = 0; k < tinacos; k++) {
    const ox = tx + k * 1.4 * m.dx, oz = tz + k * 1.4 * m.dz;
    caja(capas.equipo, marco([ox - 0.6, oz], [ox + 0.6, oz]), 0, 1.2, y, y + 0.3, -0.6, 0.6, color('#9a9894'));
    cilindro(capas.equipo, ox, y + 0.3 + 0.65, oz, 0.55, 1.3, color('#1c1c1c'));
  }
  if (!grande && d.solar) {
    // Calentador solar mirando al sur (+z).
    const sx = tx + 1.8, sz = tz;
    if (dentroDe(pts, sx, sz + 1)) {
      // Tubos inclinados hacia el sur y el termotanque arriba, del lado norte.
      const g = new THREE.BoxGeometry(1.8, 0.06, 1.3);
      g.rotateX(0.5);
      g.translate(sx, y + 0.55, sz + 0.2);
      capas.equipo.geometria(g, color('#2e3a48'));
      cilindro(capas.equipo, sx, y + 1.0, sz - 0.45, 0.24, 1.9, color('#d9d9d6'), 0);
    }
  }
  if (!grande && d.gas) {
    const gx = cx + m.nx * 1.5, gz = cz + m.nz * 1.5;
    if (dentroDe(pts, gx, gz)) cilindro(capas.equipo, gx, y + 0.4, gz, 0.33, 1.25, color('#eeeeec'), Math.atan2(-m.dz, m.dx));
  }
}
