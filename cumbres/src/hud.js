// Interfaz: calle en la que estás, altitud y rumbo, velocímetro, aviso para
// subir al auto y minimapa con las calles y casas reales.
import { MAPA, CALLES, BASE, JUEGO, Rejilla, puntos, calleCercana, enCumbres, dentroDe } from './mundo.js';

const $ = (id) => document.getElementById(id);

const COLOR_CALLE = { v: '#f2c45a', p: '#f7f3e8', s: '#f7f3e8', t: '#ecebe4', r: '#e2e0d8', e: '#cfc7b8', a: '#b9c9a2', c: '#cdb68f' };
const ANCHO_CALLE = { v: 1.4, p: 1.25, s: 1.25, t: 1.1, r: 1, e: 0.8, a: 0.4, c: 0.5 };

export class Hud {
  constructor(casas) {
    this.calleEl = $('calle');
    this.zonaEl = $('zona');
    this.altEl = $('alt');
    this.rumboEl = $('rumbo');
    this.velEl = $('vel');
    this.velNum = $('vel-num');
    this.avisoEl = $('aviso');
    this.mapa = $('minimap');
    this.ctx = this.mapa.getContext('2d');
    this.grande = false;
    this.cuadro = 0;
    this.ultimaCalle = '';

    this.casas = new Rejilla(80);
    for (const c of casas) this.casas.agregar(c, c.cx, c.cz, c.cx, c.cz);
    this.calles = new Rejilla(80);
    for (const c of CALLES) {
      for (let k = 1; k < c.pts.length; k++) {
        const [ax, az] = c.pts[k - 1], [bx, bz] = c.pts[k];
        this.calles.agregar({ c, ax, az, bx, bz }, ax, az, bx, bz);
      }
    }
    this.agua = MAPA.agua.map((a) => puntos(a.p));
    this.parques = MAPA.parques.map((p) => ({ ...p, pts: puntos(p.p) }));
    this.base = this.mapaCompleto(casas);
    this.tmp = [];
    this.mapa.addEventListener('click', () => this.alternarMapa());
  }

  alternarMapa() {
    this.grande = !this.grande;
    this.mapa.classList.toggle('big', this.grande);
  }

  aviso(texto) {
    if (texto === this._aviso) return;
    this._aviso = texto;
    this.avisoEl.hidden = !texto;
    if (texto) this.avisoEl.innerHTML = texto;
  }

  // x, z, y: posición; rumbo: hacia dónde miras (0 = norte, en radianes, horario).
  actualizar({ x, z, y, rumbo, velocidad, enAuto, volando }) {
    if (this.cuadro++ % 10 === 0) {
      const calle = calleCercana(x, z, 30);
      let nombre = calle?.calle.n || '';
      if (!nombre) {
        const parque = this.parques.find((p) => p.n && dentroDe(p.pts, x, z));
        nombre = parque ? parque.n : calle ? 'Calle sin nombre' : 'Fuera de la calle';
      }
      if (nombre !== this.ultimaCalle) {
        this.calleEl.textContent = nombre;
        this.ultimaCalle = nombre;
      }
      this.zonaEl.textContent = enCumbres(x, z) ? 'Cumbres del Lago · Juriquilla' : 'Juriquilla, Querétaro';
      this.altEl.textContent = `${Math.round(y + BASE).toLocaleString('es-MX')} msnm${volando ? ' · volando' : ''}`;
    }
    let grados = ((rumbo * 180) / Math.PI) % 360;
    if (grados < 0) grados += 360;
    const nombres = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    this.rumboEl.textContent = `${nombres[Math.round(grados / 45) % 8]} ${Math.round(grados).toString().padStart(3, '0')}°`;
    this.velEl.hidden = !enAuto;
    if (enAuto) this.velNum.textContent = Math.round(Math.abs(velocidad) * 3.6);
    if (this.grande || this.cuadro % 2 === 1) this.dibujar(x, z, rumbo);
  }

  // Mapa de toda la zona (se dibuja una vez, 2 m por pixel).
  mapaCompleto(casas) {
    const k = 0.5;
    const W = Math.round((JUEGO.x1 - JUEGO.x0) * k), H = Math.round((JUEGO.z1 - JUEGO.z0) * k);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const P = (x, z) => [(x - JUEGO.x0) * k, (z - JUEGO.z0) * k];
    ctx.fillStyle = '#b7ab8c';
    ctx.fillRect(0, 0, W, H);
    const poli = (pts) => {
      ctx.beginPath();
      pts.forEach(([x, z], i) => (i ? ctx.lineTo(...P(x, z)) : ctx.moveTo(...P(x, z))));
      ctx.closePath();
      ctx.fill();
    };
    ctx.fillStyle = '#8fae6a';
    for (const p of this.parques) poli(p.pts);
    ctx.fillStyle = '#6f9fc9';
    for (const a of this.agua) poli(a);
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const cl of CALLES) {
      ctx.strokeStyle = COLOR_CALLE[cl.c] || '#ddd';
      ctx.lineWidth = Math.max(1, cl.w * k * 1.2);
      ctx.beginPath();
      cl.pts.forEach(([x, z], i) => (i ? ctx.lineTo(...P(x, z)) : ctx.moveTo(...P(x, z))));
      ctx.stroke();
    }
    ctx.fillStyle = '#9c5b4a';
    for (const h of casas) poli(h.pts);
    return { canvas: c, k };
  }

  dibujar(x, z, rumbo) {
    const ctx = this.ctx;
    const W = this.mapa.width;
    ctx.save();
    ctx.clearRect(0, 0, W, W);
    if (this.grande) {
      // Toda la zona, norte arriba.
      const b = this.base;
      const s = Math.min(W / b.canvas.width, W / b.canvas.height);
      const ox = (W - b.canvas.width * s) / 2, oy = (W - b.canvas.height * s) / 2;
      ctx.fillStyle = '#b7ab8c';
      ctx.fillRect(0, 0, W, W);
      ctx.drawImage(b.canvas, ox, oy, b.canvas.width * s, b.canvas.height * s);
      const px = ox + (x - JUEGO.x0) * b.k * s, pz = oy + (z - JUEGO.z0) * b.k * s;
      flecha(ctx, px, pz, rumbo, 1.3);
      ctx.fillStyle = 'rgba(13,27,44,0.85)';
      ctx.font = '600 22px "Barlow Condensed", "Arial Narrow", sans-serif';
      ctx.fillText('N ↑', 14, 30);
      ctx.restore();
      return;
    }
    // Vista local de ~260 m que gira con tu rumbo.
    const ver = 260;
    const s = W / ver;
    ctx.fillStyle = '#b7ab8c';
    ctx.fillRect(0, 0, W, W);
    ctx.translate(W / 2, W / 2);
    ctx.rotate(-rumbo);
    ctx.scale(s, s);
    ctx.translate(-x, -z);
    const r = ver * 0.75;
    ctx.fillStyle = '#8fae6a';
    for (const p of this.parques) {
      ctx.beginPath();
      p.pts.forEach(([px, pz], i) => (i ? ctx.lineTo(px, pz) : ctx.moveTo(px, pz)));
      ctx.fill();
    }
    ctx.fillStyle = '#6f9fc9';
    for (const a of this.agua) {
      ctx.beginPath();
      a.forEach(([px, pz], i) => (i ? ctx.lineTo(px, pz) : ctx.moveTo(px, pz)));
      ctx.fill();
    }
    ctx.lineCap = 'round';
    for (const t of this.calles.cerca(x, z, r, this.tmp)) {
      ctx.strokeStyle = COLOR_CALLE[t.c.c] || '#ddd';
      ctx.lineWidth = t.c.w * (ANCHO_CALLE[t.c.c] || 1);
      ctx.beginPath();
      ctx.moveTo(t.ax, t.az);
      ctx.lineTo(t.bx, t.bz);
      ctx.stroke();
    }
    ctx.fillStyle = '#9c5b4a';
    for (const h of this.casas.cerca(x, z, r, this.tmp)) {
      ctx.beginPath();
      h.pts.forEach(([px, pz], i) => (i ? ctx.lineTo(px, pz) : ctx.moveTo(px, pz)));
      ctx.fill();
    }
    ctx.restore();
    flecha(ctx, W / 2, W / 2, 0, 1);
    // Norte.
    const nx = W / 2 - Math.sin(rumbo) * (W / 2 - 16), ny = W / 2 - Math.cos(rumbo) * (W / 2 - 16);
    ctx.fillStyle = 'rgba(13,27,44,0.85)';
    ctx.font = '700 20px "Barlow Condensed", "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny);
  }
}

function flecha(ctx, x, y, ang, k) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(k * 1.6, k * 1.6);
  ctx.fillStyle = '#f2b21b';
  ctx.strokeStyle = '#0d1b2c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6, 7); ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
