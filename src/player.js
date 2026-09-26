// Jugador en primera persona: caminar, correr, saltar, subir escaleras y
// modo vuelo para ver el mapa desde arriba.
import * as THREE from 'three';

const EYE = 1.65;
const RADIUS = 0.35;
const STEP_UP = 0.45;
const GRAVITY = 22;

export class Player {
  constructor(camera, dom, { heightAt, colliders }) {
    this.camera = camera;
    this.dom = dom;
    this.heightAt = heightAt;
    this.colliders = colliders;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.fly = false;
    this.keys = new Set();
    this.touch = { move: new THREE.Vector2(), look: new THREE.Vector2(), run: false, jump: false };
    this.locked = false;
    this.bindEvents();
  }

  spawn(x, z, yaw) {
    this.pos.set(x, this.groundAt(x, z, 50), z);
    this.yaw = yaw;
    this.pitch = -0.05;
    this.vel.set(0, 0, 0);
  }

  bindEvents() {
    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      this.keys.add(e.code);
      if (e.code === 'KeyV') this.fly = !this.fly;
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      this.onLockChange?.(this.locked);
    });
  }

  lock() {
    try {
      const r = this.dom.requestPointerLock?.();
      if (r && r.catch) r.catch(() => {});
    } catch (_) { /* el navegador no lo permite; se usa arrastrar */ }
  }

  // Suelo bajo el jugador: terreno o la parte de arriba de una caja caminable.
  groundAt(x, z, feetY) {
    let g = this.heightAt(x, z);
    for (const c of this.colliders) {
      if (c.y1 > feetY + STEP_UP || c.y1 <= g) continue;
      const dx = x - c.cx, dz = z - c.cz;
      const r = Math.max(c.hx, c.hz) + 1;
      if (dx * dx + dz * dz > r * r * 2) continue;
      const co = Math.cos(c.rot), si = Math.sin(c.rot);
      const lx = dx * co - dz * si, lz = dx * si + dz * co;
      if (Math.abs(lx) <= c.hx + 0.05 && Math.abs(lz) <= c.hz + 0.05) g = c.y1;
    }
    return g;
  }

  collide() {
    const feet = this.pos.y, head = this.pos.y + EYE + 0.15;
    for (const c of this.colliders) {
      if (c.y1 <= feet + STEP_UP || c.y0 >= head) continue;
      const dx = this.pos.x - c.cx, dz = this.pos.z - c.cz;
      const reach = Math.max(c.hx, c.hz) + RADIUS + 0.5;
      if (dx * dx + dz * dz > reach * reach * 2) continue;
      const co = Math.cos(c.rot), si = Math.sin(c.rot);
      const lx = dx * co - dz * si, lz = dx * si + dz * co;
      const qx = Math.max(-c.hx, Math.min(c.hx, lx)), qz = Math.max(-c.hz, Math.min(c.hz, lz));
      let ox = lx - qx, oz = lz - qz;
      const d = Math.hypot(ox, oz);
      if (d >= RADIUS) continue;
      let nx, nz, push;
      if (d > 1e-5) {
        nx = ox / d; nz = oz / d; push = RADIUS - d;
      } else {
        // Dentro de la caja: salir por el lado más cercano.
        const px = c.hx - Math.abs(lx), pz = c.hz - Math.abs(lz);
        if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; push = px + RADIUS; }
        else { nx = 0; nz = Math.sign(lz) || 1; push = pz + RADIUS; }
      }
      // De vuelta a coordenadas del mundo.
      const wx = nx * co + nz * si, wz = -nx * si + nz * co;
      this.pos.x += wx * push;
      this.pos.z += wz * push;
    }
  }

  update(dt) {
    const k = this.keys;
    const t = this.touch;
    let fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let side = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    fwd += -t.move.y;
    side += t.move.x;
    this.yaw -= t.look.x;
    this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - t.look.y));
    t.look.set(0, 0);
    const len = Math.hypot(fwd, side);
    if (len > 1) { fwd /= len; side /= len; }
    const run = k.has('ShiftLeft') || k.has('ShiftRight') || t.run;

    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const dirX = -sin * fwd + cos * side;
    const dirZ = -cos * fwd - sin * side;

    if (this.fly) {
      const sp = run ? 60 : 22;
      const up = (k.has('KeyE') || k.has('Space') ? 1 : 0) - (k.has('KeyQ') || k.has('KeyC') ? 1 : 0);
      this.pos.x += dirX * sp * dt;
      this.pos.z += dirZ * sp * dt;
      this.pos.y += up * sp * dt + Math.sin(this.pitch) * fwd * sp * dt;
      const g = this.heightAt(this.pos.x, this.pos.z);
      if (this.pos.y < g) this.pos.y = g;
      this.vel.set(0, 0, 0);
    } else {
      const sp = run ? 8.5 : 4.2;
      const accel = this.onGround ? 14 : 3;
      this.vel.x += (dirX * sp - this.vel.x) * Math.min(1, accel * dt);
      this.vel.z += (dirZ * sp - this.vel.z) * Math.min(1, accel * dt);
      if ((k.has('Space') || t.jump) && this.onGround) {
        this.vel.y = 7;
        this.onGround = false;
      }
      t.jump = false;
      this.vel.y -= GRAVITY * dt;

      // Movimiento horizontal en sub-pasos para no atravesar paredes delgadas.
      const steps = Math.ceil((Math.hypot(this.vel.x, this.vel.z) * dt) / 0.15) || 1;
      for (let i = 0; i < steps; i++) {
        this.pos.x += (this.vel.x * dt) / steps;
        this.pos.z += (this.vel.z * dt) / steps;
        this.collide();
      }
      this.pos.y += this.vel.y * dt;
      const g = this.groundAt(this.pos.x, this.pos.z, this.pos.y);
      if (this.pos.y <= g) {
        // Suaviza la subida de escalones.
        this.pos.y = g - this.pos.y > 0.05 && this.onGround ? this.pos.y + Math.min(g - this.pos.y, dt * 9) : g;
        if (this.pos.y < g - 0.3) this.pos.y = g - 0.3;
        this.vel.y = 0;
        this.onGround = true;
      } else if (this.pos.y - g > 0.25) {
        this.onGround = false;
      } else if (this.onGround && this.vel.y <= 0) {
        this.pos.y = g; // pegado al suelo al bajar escaleras o pendientes
        this.vel.y = 0;
      }
    }
    // Límite del mapa.
    const lim = 440;
    this.pos.x = Math.max(-lim, Math.min(lim, this.pos.x));
    this.pos.z = Math.max(-lim, Math.min(lim, this.pos.z));

    this.camera.position.set(this.pos.x, this.pos.y + EYE, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
