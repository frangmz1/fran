// Editor de casas: te paras frente a una casa, presionas P y la dejas como
// es en la vida real (color, pisos, cochera, portón, piedra o madera...).
// Los cambios se guardan en este navegador y se pueden copiar para que
// queden en el juego para todos (src/data/personalizadas.json).
import * as THREE from 'three';
import { OPCIONES } from './casas.js';
import { alturaEn, calleCercana } from './mundo.js';

const $ = (id) => document.getElementById(id);

const NOMBRES = {
  acento: { ninguno: 'Sin panel', piedra: 'Piedra', '#3b3c3e': 'Negro', '#8a5a36': 'Madera', '#6d4c3a': 'Chocolate', '#c9a18e': 'Cantera', '#f4f3ef': 'Blanco' },
  azotea: { '#b8563f': 'Roja', '#9d9b97': 'Gris', '#e6e4de': 'Blanca' },
  cochera: { der: 'Derecha', izq: 'Izquierda', sin: 'Sin cochera' },
};

export class Editor {
  constructor(casas, escena, alCerrar) {
    this.casas = casas; // { editor, casas }
    this.escena = escena;
    this.alCerrar = alCerrar;
    this.id = null;
    this.panel = $('editor');
    this.contorno = null;
    this.armar();
    $('ed-listo').addEventListener('click', () => this.cerrar());
    $('ed-reset').addEventListener('click', () => {
      this.casas.editor.restablecer(this.id);
      this.pintar();
    });
    $('ed-copiar').addEventListener('click', async () => {
      const texto = this.casas.editor.exportar();
      try {
        await navigator.clipboard.writeText(texto);
        $('ed-estado').textContent = 'Cambios copiados. Pégalos en el chat para guardarlos en el juego.';
      } catch (_) {
        // Sin portapapeles: se muestra el texto para copiarlo a mano.
        $('ed-json').hidden = false;
        $('ed-json').value = texto;
        $('ed-json').select();
        $('ed-estado').textContent = 'Copia este texto y pégalo en el chat.';
      }
    });
  }

  get abierto() {
    return this.id !== null;
  }

  armar() {
    const fila = (id, valores, etiqueta, colorear) => {
      const cont = $(id);
      cont.innerHTML = '';
      for (const v of valores) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.valor = String(v);
        b.title = etiqueta(v);
        if (colorear) {
          b.className = 'muestra';
          b.style.background = v === 'piedra' ? 'repeating-linear-gradient(0deg,#a89c8b 0 5px,#8a7f70 5px 7px)' : v === 'ninguno' ? 'transparent' : v;
          if (v === 'ninguno') b.textContent = '∅';
        } else {
          b.textContent = etiqueta(v);
        }
        b.setAttribute('aria-label', etiqueta(v));
        cont.appendChild(b);
      }
      cont.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || !this.id) return;
        const campo = cont.dataset.campo;
        let v = b.dataset.valor;
        if (campo === 'pisos') v = Number(v);
        this.cambiar({ [campo]: v });
      });
    };
    fila('ed-muro', OPCIONES.muro, (v) => v, true);
    fila('ed-acento', OPCIONES.acento, (v) => NOMBRES.acento[v] || v, true);
    fila('ed-porton', OPCIONES.porton, (v) => v, true);
    fila('ed-azotea', OPCIONES.azotea, (v) => NOMBRES.azotea[v] || v, true);
    fila('ed-pisos', OPCIONES.pisos, (v) => `${v}`);
    fila('ed-cochera', OPCIONES.cochera, (v) => NOMBRES.cochera[v]);
    // Color libre para muros y portón.
    for (const [id, campo] of [['ed-muro-libre', 'muro'], ['ed-porton-libre', 'porton']]) {
      $(id).addEventListener('input', (e) => this.cambiar({ [campo]: e.target.value }));
    }
    for (const [id, campo] of [['ed-volado', 'volado'], ['ed-ventanal', 'ventanal']]) {
      $(id).addEventListener('change', (e) => this.cambiar({ [campo]: e.target.checked }));
    }
  }

  // Casa que tienes enfrente (hasta 35 m) desde la cámara.
  casaEnfrente(camara) {
    const dir = new THREE.Vector3();
    camara.getWorldDirection(dir);
    const l = Math.hypot(dir.x, dir.z) || 1;
    const x = camara.position.x, z = camara.position.z;
    const col = this.casas.colisiones;
    const t = col.rayo(x, z, x + (dir.x / l) * 35, z + (dir.z / l) * 35);
    return t < 1 && col.ultimo?.casa ? col.ultimo.casa : null;
  }

  abrir(id) {
    this.id = id;
    this.panel.hidden = false;
    if (document.pointerLockElement) document.exitPointerLock();
    const info = this.casas.casas.find((c) => c.id === id);
    const calle = calleCercana(info.cx, info.cz, 40, true);
    $('ed-titulo').textContent = calle?.calle.n ? `Casa en ${calle.calle.n}` : 'Casa';
    $('ed-estado').textContent = '';
    $('ed-json').hidden = true;
    this.marcar(info);
    this.pintar();
  }

  cerrar() {
    this.id = null;
    this.panel.hidden = true;
    if (this.contorno) {
      this.escena.remove(this.contorno);
      this.contorno.geometry.dispose();
      this.contorno = null;
    }
    this.alCerrar?.();
  }

  cambiar(cambios) {
    this.casas.editor.cambiar(this.id, cambios);
    this.pintar();
  }

  // Marca la casa con una línea amarilla arriba del pretil.
  marcar(info) {
    if (this.contorno) this.escena.remove(this.contorno);
    const d = this.casas.editor.diseno(info.id);
    const puntos = info.pts.map(([x, z]) => new THREE.Vector3(x, 0, z));
    let base = Infinity;
    for (const p of puntos) base = Math.min(base, alturaEn(p.x, p.z));
    const y = base + 0.4 + d.pisos * 2.85 + 1.2;
    for (const p of puntos) p.y = y;
    const g = new THREE.BufferGeometry().setFromPoints(puntos);
    this.contorno = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0xf2b21b, depthTest: false }));
    this.contorno.renderOrder = 10;
    this.escena.add(this.contorno);
  }

  // Refleja el diseño actual en los botones.
  pintar() {
    const d = this.casas.editor.diseno(this.id);
    for (const campo of ['muro', 'acento', 'porton', 'azotea', 'pisos', 'cochera']) {
      const cont = $(`ed-${campo}`);
      for (const b of cont.children) b.setAttribute('aria-pressed', String(b.dataset.valor === String(d[campo])));
    }
    $('ed-muro-libre').value = d.muro;
    $('ed-porton-libre').value = d.porton;
    $('ed-volado').checked = !!d.volado;
    $('ed-ventanal').checked = !!d.ventanal;
    const esCasa = d.tipo === 'casa';
    for (const id of ['ed-fila-porton', 'ed-fila-cochera', 'ed-fila-extras', 'ed-fila-acento']) $(id).hidden = !esCasa;
    const n = this.casas.editor.cuantas();
    $('ed-cuantas').textContent = n === 1 ? '1 casa editada' : `${n} casas editadas`;
    const info = this.casas.casas.find((c) => c.id === this.id);
    if (info) this.marcar(info);
  }
}
