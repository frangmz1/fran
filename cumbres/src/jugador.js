// Jugador a pie en primera persona: caminar, correr, saltar y volar para ver
// la colonia desde arriba.
import * as THREE from 'three';
import { alturaEn, JUEGO } from './mundo.js';
import { nivelDeAgua } from './terreno.js';

const OJOS = 1.65;
const RADIO = 0.35;
const GRAVEDAD = 22;

export class Jugador {
  constructor(camara, colisiones) {
    this.camara = camara;
    this.colisiones = colisiones;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.enSuelo = false;
    this.volar = false;
  }

  aparecer(x, z, yaw) {
    this.pos.set(x, alturaEn(x, z) + 0.1, z);
    this.yaw = yaw;
    this.pitch = -0.05;
    this.vel.set(0, 0, 0);
  }

  suelo(x, z) {
    return alturaEn(x, z) + 0.06;
  }

  actualizar(dt, e) {
    const len = Math.hypot(e.adelante, e.lado);
    let fwd = e.adelante, side = e.lado;
    if (len > 1) { fwd /= len; side /= len; }
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const dirX = -sin * fwd + cos * side;
    const dirZ = -cos * fwd - sin * side;

    if (this.volar) {
      const sp = e.correr ? 70 : 25;
      this.pos.x += dirX * sp * dt;
      this.pos.z += dirZ * sp * dt;
      this.pos.y += e.subir * sp * dt + Math.sin(this.pitch) * fwd * sp * dt;
      const g = this.suelo(this.pos.x, this.pos.z);
      if (this.pos.y < g) this.pos.y = g;
      this.vel.set(0, 0, 0);
    } else {
      const sp = e.correr ? 8.5 : 4.2;
      const ac = this.enSuelo ? 14 : 3;
      this.vel.x += (dirX * sp - this.vel.x) * Math.min(1, ac * dt);
      this.vel.z += (dirZ * sp - this.vel.z) * Math.min(1, ac * dt);
      if (e.saltar && this.enSuelo) {
        this.vel.y = 7;
        this.enSuelo = false;
      }
      this.vel.y -= GRAVEDAD * dt;
      const pasos = Math.ceil((Math.hypot(this.vel.x, this.vel.z) * dt) / 0.15) || 1;
      for (let i = 0; i < pasos; i++) {
        const px = this.pos.x, pz = this.pos.z;
        this.pos.x += (this.vel.x * dt) / pasos;
        this.pos.z += (this.vel.z * dt) / pasos;
        this.colisiones.resolver(this.pos, RADIO);
        // El lago no se camina.
        const agua = nivelDeAgua(this.pos.x, this.pos.z);
        if (agua !== null && alturaEn(this.pos.x, this.pos.z) < agua - 0.5) { this.pos.x = px; this.pos.z = pz; }
      }
      this.pos.y += this.vel.y * dt;
      const g = this.suelo(this.pos.x, this.pos.z);
      if (this.pos.y <= g) {
        this.pos.y = g;
        this.vel.y = 0;
        this.enSuelo = true;
      } else if (this.pos.y - g > 0.3) {
        this.enSuelo = false;
      } else if (this.enSuelo && this.vel.y <= 0) {
        this.pos.y = g;
        this.vel.y = 0;
      }
    }
    this.pos.x = Math.max(JUEGO.x0, Math.min(JUEGO.x1, this.pos.x));
    this.pos.z = Math.max(JUEGO.z0, Math.min(JUEGO.z1, this.pos.z));
    this.camara.position.set(this.pos.x, this.pos.y + OJOS, this.pos.z);
    this.camara.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
