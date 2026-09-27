// Autos: modelos sencillos (sedán, camioneta y compacto), autos
// estacionados en las cocheras que se pueden tomar, y la física tipo arcade
// del auto que manejas (acelerar, frenar, derrapar, subir y bajar lomas).
import * as THREE from 'three';
import { alturaEn, semilla, elegir, calleCercana, JUEGO } from './mundo.js';
import { nivelDeAgua } from './terreno.js';

// Perfil lateral (z hacia adelante, y arriba) de la carrocería y del vidrio.
export const MODELOS = {
  sedan: {
    nombre: 'Sedán', ancho: 1.8, largo: 4.55, batalla: 2.7, rueda: 0.33, vmax: 52, acel: 8.5, techo: [-0.95, 0.5, 1.41, 1.47],
    cuerpo: [[-2.25, 0.3], [2.2, 0.3], [2.28, 0.52], [2.22, 0.78], [1.35, 0.92], [-1.9, 0.97], [-2.25, 0.92], [-2.3, 0.55]],
    vidrio: [[1.3, 0.9], [0.5, 1.42], [-1.0, 1.44], [-1.9, 0.96]],
  },
  camioneta: {
    nombre: 'Camioneta', ancho: 1.92, largo: 4.75, batalla: 2.8, rueda: 0.38, vmax: 46, acel: 7.5, techo: [-2.2, 0.75, 1.7, 1.78],
    cuerpo: [[-2.35, 0.38], [2.3, 0.38], [2.38, 0.66], [2.3, 0.98], [1.45, 1.08], [-2.3, 1.1], [-2.4, 0.7]],
    vidrio: [[1.4, 1.06], [0.75, 1.72], [-2.25, 1.74], [-2.32, 1.1]],
  },
  compacto: {
    nombre: 'Compacto', ancho: 1.7, largo: 4.0, batalla: 2.45, rueda: 0.31, vmax: 44, acel: 8, techo: [-1.55, 0.35, 1.44, 1.5],
    cuerpo: [[-1.95, 0.3], [1.9, 0.3], [1.98, 0.52], [1.9, 0.78], [1.1, 0.9], [-1.85, 0.96], [-2.0, 0.6]],
    vidrio: [[1.05, 0.88], [0.3, 1.45], [-1.6, 1.47], [-1.9, 0.95]],
  },
};

export const COLORES = [
  ['#f1f1ef', 26], ['#b9bcc0', 18], ['#5d6166', 12], ['#1c1d20', 12], ['#a4161a', 9],
  ['#1f3f7a', 8], ['#c8b89a', 4], ['#6b7f3a', 2], ['#e07a1f', 2], ['#7d1f3a', 3], ['#3b6ea8', 4],
];

function pintar(g, hex) {
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g.index ? g.toNonIndexed() : g;
}

function juntar(geos) {
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
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
  out.computeBoundingSphere();
  return out;
}

function perfil(puntos, ancho, bisel = 0.05) {
  const s = new THREE.Shape(puntos.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(s, {
    depth: ancho - bisel * 2, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 2, curveSegments: 1,
  });
  // x del perfil -> z del mundo; la extrusión -> x, centrada.
  g.rotateY(-Math.PI / 2);
  g.translate(ancho / 2 - bisel, 0, 0);
  g.computeVertexNormals();
  return g;
}

function caja(sx, sy, sz, x, y, z) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(x, y, z);
  return g;
}

// Geometrías de un modelo: carrocería (se tiñe), resto (vidrios, luces,
// defensas) y una rueda centrada en el origen.
const cache = {};
export function geometrias(tipo) {
  if (cache[tipo]) return cache[tipo];
  const M = MODELOS[tipo];
  const W = M.ancho, L = M.largo;
  const carroceria = juntar([
    pintar(perfil(M.cuerpo, W), '#ffffff'),
    // Techo: un poco más ancho y alto que el vidrio para que lo tape desde arriba.
    pintar(caja(W - 0.22, M.techo[3] - M.techo[2] + 0.04, M.techo[1] - M.techo[0], 0, (M.techo[2] + M.techo[3]) / 2 + 0.03, (M.techo[0] + M.techo[1]) / 2), '#ffffff'),
  ]);
  const zf = L / 2, zt = -L / 2;
  const yl = M.cuerpo[3][1] - 0.08;
  const resto = [
    pintar(perfil(M.vidrio, W - 0.34, 0.03), '#1b242c'),
    pintar(caja(0.42, 0.13, 0.08, W / 2 - 0.33, yl, zf - 0.02), '#fff6dc'),
    pintar(caja(0.42, 0.13, 0.08, -W / 2 + 0.33, yl, zf - 0.02), '#fff6dc'),
    pintar(caja(0.4, 0.14, 0.08, W / 2 - 0.3, yl + 0.05, zt + 0.02), '#b3121b'),
    pintar(caja(0.4, 0.14, 0.08, -W / 2 + 0.3, yl + 0.05, zt + 0.02), '#b3121b'),
    pintar(caja(W - 0.1, 0.18, 0.12, 0, 0.36, zf + 0.02), '#2a2b2e'),
    pintar(caja(W - 0.1, 0.18, 0.12, 0, 0.36, zt - 0.02), '#2a2b2e'),
    pintar(caja(0.52, 0.13, 0.03, 0, 0.5, zt - 0.06), '#e9e6d8'), // placa
    pintar(caja(0.52, 0.13, 0.03, 0, 0.5, zf + 0.06), '#e9e6d8'),
    pintar(caja(W - 0.25, 0.12, L - 0.9, 0, 0.3, 0), '#16171a'), // bajos
  ];
  // Rueda: llanta y rin.
  const r = M.rueda;
  const llanta = new THREE.CylinderGeometry(r, r, 0.24, 14, 1);
  llanta.rotateZ(Math.PI / 2);
  const rin = new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.25, 10, 1);
  rin.rotateZ(Math.PI / 2);
  const rueda = juntar([pintar(llanta, '#18181a'), pintar(rin, '#7d8288')]);
  const posRuedas = [
    [W / 2 - 0.16, r, M.batalla / 2], [-W / 2 + 0.16, r, M.batalla / 2],
    [W / 2 - 0.16, r, -M.batalla / 2], [-W / 2 + 0.16, r, -M.batalla / 2],
  ];
  // Versión ligera para los cientos de autos estacionados: sin biseles ni
  // placas, y ruedas sencillas dentro del mismo modelo.
  const llantaL = new THREE.CylinderGeometry(r, r, 0.24, 8, 1);
  llantaL.rotateZ(Math.PI / 2);
  const ligero = {
    carroceria: juntar([
      pintar(perfil(M.cuerpo, W, 0), '#ffffff'),
      pintar(caja(W - 0.22, M.techo[3] - M.techo[2] + 0.04, M.techo[1] - M.techo[0], 0, (M.techo[2] + M.techo[3]) / 2 + 0.03, (M.techo[0] + M.techo[1]) / 2), '#ffffff'),
    ]),
    resto: juntar([
      pintar(perfil(M.vidrio, W - 0.34, 0), '#1b242c'),
      resto[1], resto[2], resto[3], resto[4],
      ...posRuedas.map(([x, y, z]) => { const g = pintar(llantaL.clone(), '#18181a'); g.translate(x, y, z); return g; }),
    ]),
  };
  cache[tipo] = { carroceria, resto: juntar(resto), ligero, rueda, posRuedas, M };
  return cache[tipo];
}

export function materialesAuto(envMap) {
  return {
    pintura: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.28, metalness: 0.55, envMap, envMapIntensity: 1.0 }),
    resto: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.4, envMap, envMapIntensity: 0.9 }),
  };
}

// Radio y posiciones (a lo largo del auto) de los círculos de colisión.
function circulosDe(M) {
  const r = M.ancho / 2 + 0.02;
  const k = M.largo / 2 - r;
  return { r, offs: [-k, 0, k] };
}

// ---------------------------------------------------------------------------
// Autos estacionados en las cocheras.

export class Estacionados {
  constructor(lugares, mats, colisiones) {
    this.grupo = new THREE.Group();
    this.lista = [];
    const porTipo = { sedan: [], camioneta: [], compacto: [] };
    for (const l of lugares) {
      // Nada de autos estacionados a media calle (pasa cuando la casa da a otra calle).
      const fx = Math.sin(l.ang), fz = Math.cos(l.ang);
      const estorba = [-2, 0, 2].some((o) => {
        const c = calleCercana(l.x + fx * o, l.z + fz * o, 10, true);
        return c && c.d < c.calle.w / 2 + 0.9;
      });
      if (estorba) continue;
      const r = semilla(`auto-${l.id}`);
      const tipo = elegir(r, [['sedan', 45], ['camioneta', 35], ['compacto', 20]]);
      const color = elegir(r, COLORES);
      const a = { ...l, tipo, color, indice: porTipo[tipo].length, activo: true };
      porTipo[tipo].push(a);
      this.lista.push(a);
    }
    this.mallas = {};
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    for (const [tipo, arr] of Object.entries(porTipo)) {
      if (!arr.length) continue;
      const g = geometrias(tipo);
      const cuerpo = new THREE.InstancedMesh(g.ligero.carroceria, mats.pintura, arr.length);
      const resto = new THREE.InstancedMesh(g.ligero.resto, mats.resto, arr.length);
      const { r, offs } = circulosDe(g.M);
      arr.forEach((a, i) => {
        a.y = this.altura(a.x, a.z, a.ang, g.M);
        a.pitch = this._pitch;
        a.roll = 0;
        q.setFromEuler(new THREE.Euler(a.pitch, a.ang, a.roll, 'YXZ'));
        m4.compose(new THREE.Vector3(a.x, a.y, a.z), q, new THREE.Vector3(1, 1, 1));
        cuerpo.setMatrixAt(i, m4);
        resto.setMatrixAt(i, m4);
        cuerpo.setColorAt(i, col.set(a.color));
        const fx = Math.sin(a.ang), fz = Math.cos(a.ang);
        a.circulos = offs.map((o) => colisiones.agregarCirculo(a.x + fx * o, a.z + fz * o, r, { auto: a }));
      });
      cuerpo.castShadow = resto.castShadow = true;
      cuerpo.receiveShadow = resto.receiveShadow = true;
      cuerpo.computeBoundingSphere();
      resto.computeBoundingSphere();
      this.grupo.add(cuerpo, resto);
      this.mallas[tipo] = { cuerpo, resto };
    }
  }

  altura(x, z, ang, M) {
    const fx = Math.sin(ang), fz = Math.cos(ang);
    const hf = alturaEn(x + fx * M.batalla / 2, z + fz * M.batalla / 2);
    const ht = alturaEn(x - fx * M.batalla / 2, z - fz * M.batalla / 2);
    this._pitch = -Math.atan2(hf - ht, M.batalla);
    return (hf + ht) / 2 + 0.07;
  }

  // Quita el auto estacionado (cuando te subes a él).
  quitar(a) {
    a.activo = false;
    for (const c of a.circulos) c.activo = false;
    const m = this.mallas[a.tipo];
    const cero = new THREE.Matrix4().makeScale(0, 0, 0);
    m.cuerpo.setMatrixAt(a.indice, cero);
    m.resto.setMatrixAt(a.indice, cero);
    m.cuerpo.instanceMatrix.needsUpdate = true;
    m.resto.instanceMatrix.needsUpdate = true;
  }

  // Auto estacionado más cercano: distancia a su carrocería (no a su centro).
  masCercano(x, z, max = 3) {
    let mejor = null, dm = max;
    for (const a of this.lista) {
      if (!a.activo || Math.abs(a.x - x) > 8 || Math.abs(a.z - z) > 8) continue;
      for (const c of a.circulos) {
        const d = Math.hypot(c.x - x, c.z - z) - c.r;
        if (d < dm) { dm = d; mejor = a; }
      }
    }
    return mejor;
  }
}

// ---------------------------------------------------------------------------
// Auto que se puede manejar.

const G = 9.8;

export class Auto {
  constructor(tipo, color, mats, x, z, ang) {
    const g = geometrias(tipo);
    this.tipo = tipo;
    this.M = g.M;
    this.color = color;
    this.grupo = new THREE.Group();
    this.grupo.rotation.order = 'YXZ';
    const pintura = mats.pintura.clone();
    pintura.color.set(color);
    // En la pintura el color va en el material; los vértices son blancos.
    const cuerpo = new THREE.Mesh(g.carroceria, pintura);
    const resto = new THREE.Mesh(g.resto, mats.resto);
    cuerpo.castShadow = resto.castShadow = true;
    this.grupo.add(cuerpo, resto);
    this.ruedas = g.posRuedas.map(([rx, ry, rz]) => {
      const piv = new THREE.Group();
      piv.position.set(rx, ry, rz);
      const m = new THREE.Mesh(g.rueda, mats.resto);
      m.castShadow = true;
      piv.add(m);
      this.grupo.add(piv);
      return { piv, m };
    });
    // Luces de freno que se encienden.
    this.frenos = new THREE.Mesh(
      new THREE.BoxGeometry(this.M.ancho - 0.4, 0.1, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0 }),
    );
    this.frenos.position.set(0, this.M.cuerpo[3][1] - 0.03, -this.M.largo / 2 - 0.02);
    this.grupo.add(this.frenos);

    this.pos = new THREE.Vector3(x, 0, z);
    this.ang = ang;
    this.vel = new THREE.Vector2(); // (x, z) en el mundo
    this.vy = 0;
    this.pitch = 0;
    this.roll = 0;
    this.volante = 0;
    this.giroRueda = 0;
    this.golpe = 0;
    this.enAire = false;
    this.ultimoLibre = { x, z, ang };
    const { r, offs } = circulosDe(this.M);
    this.radio = r;
    this.offs = offs;
    this._circ = offs.map(() => ({ x: 0, z: 0, r }));
    this.pos.y = this.alturaSuelo().y;
    this.sincronizar();
  }

  get velocidad() {
    return this.vel.x * Math.sin(this.ang) + this.vel.y * Math.cos(this.ang);
  }

  circulos() {
    const fx = Math.sin(this.ang), fz = Math.cos(this.ang);
    this.offs.forEach((o, i) => { this._circ[i].x = this.pos.x + fx * o; this._circ[i].z = this.pos.z + fz * o; });
    return this._circ;
  }

  alturaSuelo() {
    const M = this.M;
    const fx = Math.sin(this.ang), fz = Math.cos(this.ang);
    const rx = -fz, rz = fx; // derecha... en este marco, +x local es la izquierda
    const b = M.batalla / 2, t = M.ancho / 2 - 0.16;
    const h = (u, v) => alturaEn(this.pos.x + fx * u + rx * v, this.pos.z + fz * u + rz * v);
    const fl = h(b, -t), fr = h(b, t), bl = h(-b, -t), br = h(-b, t);
    return {
      y: (fl + fr + bl + br) / 4 + 0.07,
      pitch: -Math.atan2((fl + fr) / 2 - (bl + br) / 2, M.batalla),
      roll: Math.atan2((fl + bl) / 2 - (fr + br) / 2, M.ancho - 0.32),
    };
  }

  actualizar(dt, e, colisiones) {
    const M = this.M;
    let fx = Math.sin(this.ang), fz = Math.cos(this.ang);
    let rx = -fz, rz = fx;
    let vf = this.vel.x * fx + this.vel.y * fz;
    let vr = this.vel.x * rx + this.vel.y * rz;

    // Volante suave con teclado; directo con el joystick.
    const meta = e.volante;
    this.volante += Math.sign(meta - this.volante) * Math.min(Math.abs(meta - this.volante), dt * (e.analogo ? 8 : 3.2));

    // Motor y frenos.
    const enSuelo = !this.enAire;
    let frenando = false;
    if (enSuelo) {
      if (e.acelerar > 0) {
        if (vf < -0.5) { vf += 16 * e.acelerar * dt; frenando = true; }
        else vf += M.acel * e.acelerar * (1 - Math.max(0, vf) / M.vmax) * dt * (e.turbo ? 1.5 : 1);
      } else if (e.acelerar < 0) {
        if (vf > 0.5) { vf -= 16 * -e.acelerar * dt; frenando = true; }
        else vf = Math.max(-11, vf - 5.5 * -e.acelerar * dt);
      } else {
        vf -= Math.sign(vf) * Math.min(Math.abs(vf), 1.3 * dt);
      }
      if (e.mano) { vf -= Math.sign(vf) * Math.min(Math.abs(vf), 5 * dt); frenando = true; }
      // Pendiente: cuesta arriba frena, cuesta abajo acelera.
      vf += G * Math.sin(this.pitch) * dt;
    }
    vf -= vf * Math.abs(vf) * 0.0009 * dt; // aire

    // Dirección (modelo de bicicleta). +volante = derecha = ángulo menor.
    const delta = (this.volante * 0.62) / (1 + Math.abs(vf) / 16);
    if (enSuelo) {
      let giro = (-vf / M.batalla) * Math.tan(delta);
      if (e.mano) giro *= 1.45;
      this.ang += giro * dt;
    }
    this.vel.set(fx * vf + rx * vr, fz * vf + rz * vr);

    // Agarre lateral: con freno de mano se derrapa.
    fx = Math.sin(this.ang); fz = Math.cos(this.ang); rx = -fz; rz = fx;
    vf = this.vel.x * fx + this.vel.y * fz;
    vr = this.vel.x * rx + this.vel.y * rz;
    if (enSuelo) vr *= Math.exp(-(e.mano ? 1.6 : 9) * dt);
    this.vel.set(fx * vf + rx * vr, fz * vf + rz * vr);
    this.derrape = Math.abs(vr);

    // Movimiento en sub-pasos con choques.
    const velPaso = Math.hypot(this.vel.x, this.vel.y) * dt;
    const pasos = Math.max(1, Math.ceil(velPaso / 0.3));
    this.golpe = 0;
    for (let s = 0; s < pasos; s++) {
      this.pos.x += (this.vel.x * dt) / pasos;
      this.pos.z += (this.vel.y * dt) / pasos;
      this.chocar(colisiones);
    }

    // No meterse al lago ni salirse del mapa.
    const agua = nivelDeAgua(this.pos.x, this.pos.z);
    const fuera = this.pos.x < JUEGO.x0 || this.pos.x > JUEGO.x1 || this.pos.z < JUEGO.z0 || this.pos.z > JUEGO.z1;
    if ((agua !== null && alturaEn(this.pos.x, this.pos.z) < agua - 0.3) || fuera) {
      this.pos.x = this.ultimoLibre.x;
      this.pos.z = this.ultimoLibre.z;
      this.vel.multiplyScalar(-0.2);
      this.golpe = Math.max(this.golpe, 4);
    } else {
      this.ultimoLibre.x = this.pos.x;
      this.ultimoLibre.z = this.pos.z;
    }

    // Suspensión y saltos.
    const s = this.alturaSuelo();
    const k = 1 - Math.exp(-dt * 10);
    if (this.pos.y > s.y + 0.08) {
      this.enAire = true;
      this.vy -= G * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= s.y) {
        this.golpe = Math.max(this.golpe, Math.min(6, -this.vy * 0.6));
        this.pos.y = s.y;
        this.vy = 0;
        this.enAire = false;
      }
    } else {
      const prev = this.pos.y;
      this.pos.y = s.y;
      this.vy = (s.y - prev) / Math.max(dt, 1e-3);
      this.vy = Math.min(this.vy, 7);
      this.enAire = false;
    }
    if (!this.enAire) {
      this.pitch += (s.pitch - this.pitch) * k;
      this.roll += (s.roll - this.roll) * k;
    }
    // Inclinación de la carrocería al acelerar y en las curvas.
    this.cabeceo = (this.cabeceo || 0) * 0.9 + (frenando ? 0.02 : e.acelerar > 0 ? -0.012 : 0) * 0.1;

    this.giroRueda += (vf / M.rueda) * dt;
    this.frenos.material.opacity = frenando || (e.acelerar < 0 && vf <= 0.5) ? 0.95 : 0;
    this.sincronizar();
  }

  chocar(colisiones) {
    const fx = Math.sin(this.ang), fz = Math.cos(this.ang);
    for (const o of this.offs) {
      const p = { x: this.pos.x + fx * o, z: this.pos.z + fz * o };
      const n = colisiones.resolver(p, this.radio, this);
      if (!n) continue;
      this.pos.x += p.x - (this.pos.x + fx * o);
      this.pos.z += p.z - (this.pos.z + fz * o);
      const vn = this.vel.x * n.x + this.vel.y * n.z;
      if (vn < 0) {
        this.vel.x -= n.x * vn * 1.25;
        this.vel.y -= n.z * vn * 1.25;
        this.vel.multiplyScalar(0.92);
        this.golpe = Math.max(this.golpe, -vn);
        // Un golpe de lado hace girar un poco el auto.
        this.ang += (o > 0 ? 1 : o < 0 ? -1 : 0) * (fx * n.z - fz * n.x) * Math.min(0.08, -vn * 0.01);
      }
    }
  }

  sincronizar() {
    this.grupo.position.copy(this.pos);
    this.grupo.rotation.set(this.pitch + (this.cabeceo || 0), this.ang, this.roll);
    this.ruedas.forEach((w, i) => {
      w.m.rotation.x = this.giroRueda;
      if (i < 2) w.piv.rotation.y = -this.volante * 0.5;
    });
  }

  // Lo endereza sobre la calle más cercana.
  reiniciar(x, z, ang) {
    this.pos.x = x;
    this.pos.z = z;
    this.ang = ang;
    this.vel.set(0, 0);
    this.vy = 0;
    this.pos.y = this.alturaSuelo().y;
    this.ultimoLibre = { x, z, ang };
    this.sincronizar();
  }
}
