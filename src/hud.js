// Interfaz: nombre de la zona, altitud, brújula, minimapa y controles táctiles.
import { ZONES, ROADS, PADS, FIELDS, COMPLEX } from './layout.js';
import { TERRAIN_SIZE } from './terrain.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor({ heightAt, colliders, nearestOnRoad, profiles }) {
    this.heightAt = heightAt;
    this.profiles = profiles;
    this.nearestOnRoad = nearestOnRoad;
    this.zoneEl = $('zone');
    this.altEl = $('alt');
    this.compassEl = $('compass');
    this.mapEl = $('minimap');
    this.mapCtx = this.mapEl.getContext('2d');
    this.base = this.drawBaseMap(colliders);
    this.big = false;
    this.lastZone = '';
    this.mapEl.addEventListener('click', () => this.toggleMap());
    addEventListener('keydown', (e) => { if (e.code === 'KeyM') this.toggleMap(); });
  }

  toggleMap() {
    this.big = !this.big;
    this.mapEl.classList.toggle('big', this.big);
  }

  zoneAt(x, z) {
    let best = null;
    for (const zn of ZONES) {
      const dx = x - zn.cx, dz = z - zn.cz;
      const c = Math.cos(zn.rot), s = Math.sin(zn.rot);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) <= zn.hx && Math.abs(lz) <= zn.hz && (!best || zn.priority > best.priority)) best = zn;
    }
    if (best) return best.name;
    for (const pr of this.profiles) {
      const n = this.nearestOnRoad(pr, x, z, 20);
      if (n.d < pr.road.width / 2 + 3) return pr.road.kind === 'asphalt' ? 'Carretera QRO 20' : 'Camino de terracería';
    }
    return 'Cerro';
  }

  update(player) {
    const { x, z, y } = player.pos;
    const zone = this.zoneAt(x, z);
    if (zone !== this.lastZone) {
      this.zoneEl.textContent = zone;
      this.lastZone = zone;
    }
    this.altEl.textContent = `${y >= 0 ? '+' : '−'}${Math.abs(y).toFixed(1)} m${player.fly ? ' · volando' : ''}`;
    let deg = ((-player.yaw * 180) / Math.PI) % 360;
    if (deg < 0) deg += 360;
    const names = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    this.compassEl.textContent = `${names[Math.round(deg / 45) % 8]} ${Math.round(deg).toString().padStart(3, '0')}°`;
    this.drawMap(x, z, player.yaw);
  }

  // Mapa base dibujado una sola vez: relieve, caminos, canchas y edificios.
  drawBaseMap(colliders) {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d');
    const half = TERRAIN_SIZE / 2;
    const k = S / TERRAIN_SIZE;
    const P = (v) => (v + half) * k;
    const img = ctx.createImageData(S, S);
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const x = i / k - half, z = j / k - half;
        const h = this.heightAt(x, z);
        const shade = this.heightAt(x - 2, z - 2) - h;
        const v = 120 + h * 1.6 + shade * 18;
        const q = (j * S + i) * 4;
        img.data[q] = v * 0.92; img.data[q + 1] = v * 0.9; img.data[q + 2] = v * 0.72; img.data[q + 3] = 255;
        if (Math.abs(h % 5) < 0.18) { img.data[q] *= 0.85; img.data[q + 1] *= 0.85; img.data[q + 2] *= 0.85; }
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const r of ROADS) {
      ctx.strokeStyle = r.kind === 'asphalt' ? '#3d3f44' : '#e6d3ae';
      ctx.lineWidth = r.width * k * 1.4;
      ctx.beginPath();
      r.points.forEach(([x, z], i) => (i ? ctx.lineTo(P(x), P(z)) : ctx.moveTo(P(x), P(z))));
      ctx.stroke();
    }
    const rect = (p, fillStyle) => {
      ctx.save();
      ctx.translate(P(p.cx), P(p.cz));
      ctx.rotate(-p.rot);
      ctx.fillStyle = fillStyle;
      ctx.fillRect(-p.hx * k, -p.hz * k, p.hx * 2 * k, p.hz * 2 * k);
      ctx.restore();
    };
    for (const p of PADS) rect(p, 'rgba(215,212,204,0.9)');
    for (const f of Object.values(FIELDS)) rect({ cx: f.cx, cz: f.cz, hx: f.w / 2, hz: f.l / 2, rot: 0 }, '#4f8a3f');
    for (const cl of colliders) {
      if (cl.hx * cl.hz < 6 || cl.y1 - cl.y0 < 2.5) continue;
      rect(cl, 'rgba(250,250,247,0.95)');
    }
    // Punta amarilla como referencia.
    ctx.fillStyle = '#f2b21b';
    const cx = COMPLEX.x + 70 * Math.cos(COMPLEX.rot), cz = COMPLEX.z - 70 * Math.sin(COMPLEX.rot);
    ctx.beginPath(); ctx.arc(P(cx), P(cz), 3, 0, 7); ctx.fill();
    return c;
  }

  drawMap(x, z, yaw) {
    const ctx = this.mapCtx;
    const W = this.mapEl.width;
    const half = TERRAIN_SIZE / 2;
    ctx.clearRect(0, 0, W, W);
    const view = this.big ? TERRAIN_SIZE : 220; // metros visibles
    const scale = W / view;
    const S = this.base.width;
    const srcK = S / TERRAIN_SIZE;
    const sx = (x + half - view / 2) * srcK, sz = (z + half - view / 2) * srcK;
    const cx = this.big ? half * srcK - (view / 2) * srcK : sx;
    const cz = this.big ? half * srcK - (view / 2) * srcK : sz;
    ctx.drawImage(this.base, cx, cz, view * srcK, view * srcK, 0, 0, W, W);
    // Jugador.
    const px = this.big ? (x + half) * scale : W / 2;
    const pz = this.big ? (z + half) * scale : W / 2;
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-yaw);
    ctx.fillStyle = '#f2b21b';
    ctx.strokeStyle = '#0d1b2c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6, 7); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(13,27,44,0.8)';
    ctx.font = '600 12px "Barlow Condensed", "Arial Narrow", sans-serif';
    ctx.fillText('N', W / 2 - 3, 13);
  }
}

// Joystick y botones para celular o tableta.
export function setupTouch(player) {
  const pad = $('touch');
  pad.hidden = false;
  const stick = $('stick'), knob = $('knob');
  let stickId = null, lookId = null, lookLast = null, origin = null;
  const R = 50;
  pad.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      if (t.target.closest('button')) continue;
      if (t.clientX < innerWidth / 2 && stickId === null) {
        stickId = t.identifier;
        origin = { x: t.clientX, y: t.clientY };
        stick.style.left = `${t.clientX - R}px`;
        stick.style.top = `${t.clientY - R}px`;
        stick.classList.add('on');
      } else if (lookId === null) {
        lookId = t.identifier;
        lookLast = { x: t.clientX, y: t.clientY };
      }
    }
    e.preventDefault();
  }, { passive: false });
  pad.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        let dx = t.clientX - origin.x, dy = t.clientY - origin.y;
        const d = Math.hypot(dx, dy);
        if (d > R) { dx *= R / d; dy *= R / d; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        player.touch.move.set(dx / R, dy / R);
      } else if (t.identifier === lookId) {
        player.touch.look.x += (t.clientX - lookLast.x) * 0.005;
        player.touch.look.y += (t.clientY - lookLast.y) * 0.005;
        lookLast = { x: t.clientX, y: t.clientY };
      }
    }
    e.preventDefault();
  }, { passive: false });
  const end = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        stickId = null;
        player.touch.move.set(0, 0);
        knob.style.transform = '';
        stick.classList.remove('on');
      }
      if (t.identifier === lookId) lookId = null;
    }
  };
  pad.addEventListener('touchend', end);
  pad.addEventListener('touchcancel', end);
  $('btn-jump').addEventListener('touchstart', (e) => { player.touch.jump = true; e.preventDefault(); });
  const run = $('btn-run');
  run.addEventListener('touchstart', (e) => {
    player.touch.run = !player.touch.run;
    run.setAttribute('aria-pressed', String(player.touch.run));
    e.preventDefault();
  });
  const fly = $('btn-fly');
  fly.addEventListener('touchstart', (e) => {
    player.fly = !player.fly;
    fly.setAttribute('aria-pressed', String(player.fly));
    e.preventDefault();
  });
}
