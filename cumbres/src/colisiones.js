// Colisiones en planta (2D): círculos contra muros de casas (segmentos) y
// contra obstáculos redondos (troncos, postes, autos estacionados, casetas).
import { Rejilla } from './mundo.js';

export class Colisiones {
  constructor() {
    this.segmentos = new Rejilla(16);
    this.circulos = new Rejilla(16);
    this.dinamicos = []; // objetos con .circulos() que regresan [{x, z, r}]
    this.tmp = [];
  }

  agregarSegmento(ax, az, bx, bz, extra = {}) {
    const s = { ax, az, bx, bz, activo: true, ...extra };
    this.segmentos.agregar(s, ax, az, bx, bz);
    return s;
  }

  agregarCirculo(x, z, r, extra = {}) {
    const c = { x, z, r, activo: true, ...extra };
    this.circulos.agregar(c, x - r, z - r, x + r, z + r);
    return c;
  }

  // Resuelve la posición de un círculo. Regresa la suma de normales de empuje
  // (para quitarle velocidad al que choca) o null si no chocó.
  resolver(p, r, ignorar = null) {
    let nx = 0, nz = 0, choco = false;
    for (let iter = 0; iter < 2; iter++) {
      for (const s of this.segmentos.cerca(p.x, p.z, r + 1, this.tmp)) {
        if (!s.activo) continue;
        const dx = s.bx - s.ax, dz = s.bz - s.az;
        const l2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((p.x - s.ax) * dx + (p.z - s.az) * dz) / l2));
        const qx = s.ax + dx * t, qz = s.az + dz * t;
        let ex = p.x - qx, ez = p.z - qz;
        const d = Math.hypot(ex, ez);
        if (d >= r) continue;
        if (d < 1e-6) { ex = -dz; ez = dx; } // justo encima: sale por un lado
        const k = Math.hypot(ex, ez);
        ex /= k; ez /= k;
        p.x += ex * (r - d);
        p.z += ez * (r - d);
        nx += ex; nz += ez; choco = true;
      }
      for (const c of this.circulos.cerca(p.x, p.z, r + 2, this.tmp)) {
        if (!c.activo || c === ignorar) continue;
        if (this._circulo(p, r, c.x, c.z, c.r)) { nx += this._n.x; nz += this._n.z; choco = true; }
      }
      for (const o of this.dinamicos) {
        if (o === ignorar) continue;
        for (const c of o.circulos()) {
          if (this._circulo(p, r, c.x, c.z, c.r)) { nx += this._n.x; nz += this._n.z; choco = true; }
        }
      }
    }
    if (!choco) return null;
    const l = Math.hypot(nx, nz) || 1;
    return { x: nx / l, z: nz / l };
  }

  _circulo(p, r, cx, cz, cr) {
    const ex = p.x - cx, ez = p.z - cz;
    const d = Math.hypot(ex, ez);
    const min = r + cr;
    if (d >= min) return false;
    const ux = d > 1e-6 ? ex / d : 1, uz = d > 1e-6 ? ez / d : 0;
    p.x += ux * (min - d);
    p.z += uz * (min - d);
    this._n = { x: ux, z: uz };
    return true;
  }

  // Primer muro que cruza la línea de a a b (fracción 0..1) o 1 si nada.
  // El muro que se cruzó queda en this.ultimo.
  rayo(ax, az, bx, bz) {
    let mejor = 1;
    this.ultimo = null;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, rad = Math.hypot(bx - ax, bz - az) / 2 + 1;
    for (const s of this.segmentos.cerca(mx, mz, rad, this.tmp)) {
      if (!s.activo) continue;
      const rx = bx - ax, rz = bz - az, sx = s.bx - s.ax, sz = s.bz - s.az;
      const den = rx * sz - rz * sx;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((s.ax - ax) * sz - (s.az - az) * sx) / den;
      const u = ((s.ax - ax) * rz - (s.az - az) * rx) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1 && t < mejor) { mejor = t; this.ultimo = s; }
    }
    return mejor;
  }
}
