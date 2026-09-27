// Teclado, mouse y controles táctiles en un solo lugar.
const $ = (id) => document.getElementById(id);

export class Controles {
  constructor(dom) {
    this.dom = dom;
    this.teclas = new Set();
    this.bloqueado = false;
    this.mirar = { x: 0, y: 0 };
    this.tactil = { mover: { x: 0, y: 0 }, correr: false, saltar: false, mano: false, activo: false };
    this.acciones = new Map(); // código de tecla -> función
    this.alCambiarBloqueo = null;

    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!e.repeat) this.acciones.get(e.code)?.();
      this.teclas.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.teclas.delete(e.code));
    addEventListener('blur', () => this.teclas.clear());
    document.addEventListener('mousemove', (e) => {
      if (this.bloqueado) {
        this.mirar.x += e.movementX * 0.0022;
        this.mirar.y += e.movementY * 0.0022;
      } else if (this.arrastre) {
        this.mirar.x += (e.clientX - this.arrastre.x) * 0.004;
        this.mirar.y += (e.clientY - this.arrastre.y) * 0.004;
        this.arrastre = { x: e.clientX, y: e.clientY };
      }
    });
    dom.addEventListener('mousedown', (e) => { if (!this.bloqueado) this.arrastre = { x: e.clientX, y: e.clientY }; });
    addEventListener('mouseup', () => { this.arrastre = null; });
    document.addEventListener('pointerlockchange', () => {
      this.bloqueado = document.pointerLockElement === dom;
      this.alCambiarBloqueo?.(this.bloqueado);
    });
  }

  accion(codigo, fn) {
    this.acciones.set(codigo, fn);
  }

  bloquear() {
    try {
      const r = this.dom.requestPointerLock?.();
      if (r && r.catch) r.catch(() => {});
    } catch (_) { /* sin pointer lock: se usa arrastrar */ }
  }

  tiene(...codigos) {
    return codigos.some((c) => this.teclas.has(c));
  }

  consumirMirada() {
    const m = { x: this.mirar.x, y: this.mirar.y };
    this.mirar.x = this.mirar.y = 0;
    return m;
  }

  pie() {
    const t = this.tactil;
    const r = {
      adelante: (this.tiene('KeyW', 'ArrowUp') ? 1 : 0) - (this.tiene('KeyS', 'ArrowDown') ? 1 : 0) - t.mover.y,
      lado: (this.tiene('KeyD', 'ArrowRight') ? 1 : 0) - (this.tiene('KeyA', 'ArrowLeft') ? 1 : 0) + t.mover.x,
      correr: this.tiene('ShiftLeft', 'ShiftRight') || t.correr,
      saltar: this.tiene('Space') || t.saltar,
      subir: (this.tiene('KeyE', 'Space') ? 1 : 0) - (this.tiene('KeyQ', 'KeyC') ? 1 : 0),
    };
    t.saltar = false;
    return r;
  }

  auto() {
    const t = this.tactil;
    const analogo = Math.abs(t.mover.x) > 0.05 || Math.abs(t.mover.y) > 0.05;
    return {
      acelerar: Math.max(-1, Math.min(1, (this.tiene('KeyW', 'ArrowUp') ? 1 : 0) - (this.tiene('KeyS', 'ArrowDown') ? 1 : 0) - t.mover.y * 1.3)),
      volante: Math.max(-1, Math.min(1, (this.tiene('KeyD', 'ArrowRight') ? 1 : 0) - (this.tiene('KeyA', 'ArrowLeft') ? 1 : 0) + t.mover.x * 1.2)),
      mano: this.tiene('Space') || t.mano,
      turbo: this.tiene('ShiftLeft', 'ShiftRight'),
      analogo,
    };
  }

  // Joystick a la izquierda, mirar a la derecha y botones.
  activarTactil(botones) {
    const pad = $('touch');
    this.tactil.activo = true;
    const stick = $('stick'), knob = $('knob');
    let idStick = null, idMirar = null, ultimo = null, origen = null;
    const R = 50;
    pad.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (t.target.closest('button')) continue;
        if (t.clientX < innerWidth / 2 && idStick === null) {
          idStick = t.identifier;
          origen = { x: t.clientX, y: t.clientY };
          stick.style.left = `${t.clientX - R}px`;
          stick.style.top = `${t.clientY - R}px`;
          stick.classList.add('on');
        } else if (idMirar === null) {
          idMirar = t.identifier;
          ultimo = { x: t.clientX, y: t.clientY };
        }
      }
      e.preventDefault();
    }, { passive: false });
    pad.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === idStick) {
          let dx = t.clientX - origen.x, dy = t.clientY - origen.y;
          const d = Math.hypot(dx, dy);
          if (d > R) { dx *= R / d; dy *= R / d; }
          knob.style.transform = `translate(${dx}px, ${dy}px)`;
          this.tactil.mover.x = dx / R;
          this.tactil.mover.y = dy / R;
        } else if (t.identifier === idMirar) {
          this.mirar.x += (t.clientX - ultimo.x) * 0.005;
          this.mirar.y += (t.clientY - ultimo.y) * 0.005;
          ultimo = { x: t.clientX, y: t.clientY };
        }
      }
      e.preventDefault();
    }, { passive: false });
    const fin = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === idStick) {
          idStick = null;
          this.tactil.mover.x = this.tactil.mover.y = 0;
          knob.style.transform = '';
          stick.classList.remove('on');
        }
        if (t.identifier === idMirar) idMirar = null;
      }
    };
    pad.addEventListener('touchend', fin);
    pad.addEventListener('touchcancel', fin);
    for (const [id, { tocar, soltar }] of Object.entries(botones)) {
      const b = $(id);
      b.addEventListener('touchstart', (e) => { tocar?.(b); e.preventDefault(); });
      b.addEventListener('touchend', (e) => { soltar?.(b); e.preventDefault(); });
    }
  }
}
