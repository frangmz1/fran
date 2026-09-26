// Texturas procedurales dibujadas en canvas. Así el juego no depende de
// archivos de imagen externos y todo cabe en un solo HTML.
import * as THREE from 'three';

let seed = 1337;
export function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Ruido de valor tileable para el fondo de las texturas.
function noiseLayer(ctx, size, cells, amp, base) {
  const grid = [];
  for (let i = 0; i < cells * cells; i++) grid.push(rand());
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = smooth(fx - x0), ty = smooth(fy - y0);
      const g = (a, b) => grid[((b % cells) * cells) + (a % cells)];
      const v =
        (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) +
        (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
      const k = (v - 0.5) * amp;
      const i = (y * size + x) * 4;
      d[i] = Math.max(0, Math.min(255, d[i] + k * base[0]));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + k * base[1]));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + k * base[2]));
    }
  }
  ctx.putImageData(img, 0, 0);
}

function speckle(ctx, size, count, colors, rMin, rMax) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    const r = rMin + rand() * (rMax - rMin);
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fill(ctx, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
}

function toTexture(c, { repeat = true, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

// Mapa de normales a partir del brillo de un canvas.
function normalFrom(c, strength = 2) {
  const w = c.width, h = c.height;
  const src = c.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h);
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  const lum = (x, y) => {
    x = (x + w) % w; y = (y + h) % h;
    const i = (y * w + x) * 4;
    return (src[i] + src[i + 1] + src[i + 2]) / 765;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (lum(x + 1, y) - lum(x - 1, y)) * strength;
      const dy = (lum(x, y + 1) - lum(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return toTexture(out, { srgb: false });
}

export function makeTextures() {
  const T = {};

  // Concreto del patio: losas con juntas.
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#b9b5ad');
    noiseLayer(x, s, 8, 26, [1, 1, 1]);
    noiseLayer(x, s, 64, 14, [1, 1, 1]);
    speckle(x, s, 2500, ['rgba(90,90,90,0.18)', 'rgba(255,255,255,0.2)'], 0.4, 1.3);
    x.strokeStyle = 'rgba(80,78,74,0.55)';
    x.lineWidth = 2;
    x.strokeRect(1, 1, s - 2, s - 2);
    T.concrete = toTexture(c);
    T.concreteN = normalFrom(c, 1.5);
  }

  // Panel blanco de fachada con juntas.
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#eeeeea');
    noiseLayer(x, s, 16, 10, [1, 1, 1]);
    x.strokeStyle = 'rgba(150,150,145,0.55)';
    x.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(0, (i * s) / 4); x.lineTo(s, (i * s) / 4); x.stroke();
    }
    for (let i = 0; i <= 2; i++) {
      x.beginPath(); x.moveTo((i * s) / 2, 0); x.lineTo((i * s) / 2, s); x.stroke();
    }
    T.panel = toTexture(c);
  }

  // Aplanado blanco liso (muros, pasillos).
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#f2f1ec');
    noiseLayer(x, s, 16, 8, [1, 1, 1]);
    T.plaster = toTexture(c);
  }

  // Loseta beige de pasillos.
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#d9c2a0');
    noiseLayer(x, s, 12, 22, [1, 0.9, 0.8]);
    x.strokeStyle = 'rgba(120,100,75,0.6)';
    x.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(0, (i * s) / 4); x.lineTo(s, (i * s) / 4); x.stroke();
      x.beginPath(); x.moveTo((i * s) / 4, 0); x.lineTo((i * s) / 4, s); x.stroke();
    }
    T.tile = toTexture(c);
  }

  // Ladrillo rojo de la barda de la carretera.
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#b9a79a');
    const bh = s / 16, bw = s / 4;
    for (let r = 0; r < 16; r++) {
      const off = (r % 2) * bw / 2;
      for (let k = -1; k < 5; k++) {
        const v = 0.85 + rand() * 0.25;
        x.fillStyle = `rgb(${170 * v},${88 * v},${70 * v})`;
        x.fillRect(k * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
    noiseLayer(x, s, 32, 20, [1, 0.8, 0.7]);
    T.brick = toTexture(c);
    T.brickN = normalFrom(c, 3);
  }

  // Muro de piedra braza (base del letrero y muros de contención).
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#6f6c66');
    for (let i = 0; i < 90; i++) {
      const cx = rand() * s, cy = rand() * s, r = 18 + rand() * 30;
      const v = 0.6 + rand() * 0.45;
      x.fillStyle = `rgb(${128 * v},${126 * v},${122 * v})`;
      x.beginPath();
      const n = 6 + Math.floor(rand() * 4);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const rr = r * (0.7 + rand() * 0.4);
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.75;
        k === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
      }
      x.closePath();
      x.fill();
    }
    noiseLayer(x, s, 48, 30, [1, 1, 1]);
    T.stone = toTexture(c);
    T.stoneN = normalFrom(c, 4);
  }

  // Asfalto.
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#4a4a4c');
    noiseLayer(x, s, 8, 20, [1, 1, 1]);
    speckle(x, s, 9000, ['rgba(20,20,20,0.35)', 'rgba(160,160,160,0.25)'], 0.4, 1.2);
    T.asphalt = toTexture(c);
  }

  // Suelos del terreno (se mezclan en el shader del terreno).
  const ground = (base, tint, specks, amp) => {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    fill(x, s, base);
    noiseLayer(x, s, 6, amp, tint);
    noiseLayer(x, s, 24, amp * 0.7, tint);
    noiseLayer(x, s, 96, amp * 0.5, tint);
    speckle(x, s, 5000, specks, 0.5, 2.2);
    return c;
  };
  {
    const c = ground('#8a7457', [1, 0.9, 0.75], ['rgba(70,55,40,0.3)', 'rgba(230,215,190,0.35)'], 40);
    T.soil = toTexture(c); T.soilN = normalFrom(c, 2);
  }
  {
    const c = ground('#b89d78', [1, 0.95, 0.85], ['rgba(110,90,70,0.35)', 'rgba(245,235,215,0.45)', 'rgba(150,140,130,0.4)'], 30);
    T.dirt = toTexture(c); T.dirtN = normalFrom(c, 3);
  }
  {
    const c = ground('#5f6536', [0.8, 1, 0.5], ['rgba(60,70,30,0.45)', 'rgba(170,160,100,0.35)', 'rgba(110,95,60,0.35)'], 55);
    const x = c.getContext('2d');
    x.lineWidth = 1;
    for (let i = 0; i < 6000; i++) {
      const px = rand() * 512, py = rand() * 512;
      x.strokeStyle = rand() < 0.5 ? 'rgba(70,85,35,0.5)' : 'rgba(180,165,105,0.45)';
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rand() - 0.5) * 4, py - 3 - rand() * 5); x.stroke();
    }
    T.grass = toTexture(c); T.grassN = normalFrom(c, 2);
  }
  {
    const c = ground('#8a867c', [1, 1, 1], ['rgba(60,58,55,0.45)', 'rgba(220,215,205,0.4)'], 60);
    T.rock = toTexture(c); T.rockN = normalFrom(c, 5);
  }

  // Pasto sintético con franjas de corte.
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#3f7a34');
    noiseLayer(x, s, 32, 18, [0.6, 1, 0.6]);
    speckle(x, s, 3000, ['rgba(20,60,20,0.25)', 'rgba(120,170,90,0.2)'], 0.3, 0.9);
    T.turf = toTexture(c);
  }

  // Pasto natural de jardineras (más verde).
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#5f8f3a');
    noiseLayer(x, s, 16, 35, [0.7, 1, 0.5]);
    speckle(x, s, 4000, ['rgba(40,70,20,0.35)', 'rgba(150,180,90,0.3)'], 0.3, 1);
    T.lawn = toTexture(c);
  }

  // Impermeabilizante rojo de azotea.
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#b0503c');
    noiseLayer(x, s, 12, 25, [1, 0.7, 0.6]);
    T.roofRed = toTexture(c);
  }

  // Azotea gris.
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#b8b6b0');
    noiseLayer(x, s, 12, 25, [1, 1, 1]);
    T.roofGray = toTexture(c);
  }

  // Panel solar.
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    fill(x, s, '#1c2a4a');
    x.strokeStyle = '#8a95a8';
    x.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      x.beginPath(); x.moveTo(0, (i * s) / 8); x.lineTo(s, (i * s) / 8); x.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo((i * s) / 4, 0); x.lineTo((i * s) / 4, s); x.stroke();
    }
    T.solar = toTexture(c);
  }

  // Lockers azules.
  {
    const w = 256, h = 512, c = canvas(w, h), x = c.getContext('2d');
    x.fillStyle = '#1d4fa8';
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const lx = (i * w) / 4;
      x.strokeStyle = '#123a80';
      x.lineWidth = 3;
      x.strokeRect(lx + 2, 2, w / 4 - 4, h / 2 - 4);
      x.strokeRect(lx + 2, h / 2 + 2, w / 4 - 4, h / 2 - 4);
      x.fillStyle = '#0d2c66';
      for (let v = 0; v < 5; v++) x.fillRect(lx + 12, 20 + v * 8, w / 4 - 24, 3);
      for (let v = 0; v < 5; v++) x.fillRect(lx + 12, h / 2 + 20 + v * 8, w / 4 - 24, 3);
      x.fillStyle = '#9aa4b5';
      x.beginPath(); x.arc(lx + w / 8, h / 4 + 20, 6, 0, 7); x.fill();
      x.beginPath(); x.arc(lx + w / 8, (3 * h) / 4 + 20, 6, 0, 7); x.fill();
      x.fillStyle = '#b6f23a';
      x.fillRect(lx + w / 4 - 22, 10, 12, 12);
    }
    T.lockers = toTexture(c, { repeat: true });
  }

  // Malla ciclónica (con transparencia).
  {
    const s = 128, c = canvas(s), x = c.getContext('2d');
    x.clearRect(0, 0, s, s);
    x.strokeStyle = 'rgba(190,195,200,1)';
    x.lineWidth = 2.2;
    for (let i = -s; i < s * 2; i += 16) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i + s, s); x.stroke();
      x.beginPath(); x.moveTo(i + s, 0); x.lineTo(i, s); x.stroke();
    }
    T.fence = toTexture(c);
  }

  // Bandera de México.
  {
    const w = 512, h = 292, c = canvas(w, h), x = c.getContext('2d');
    x.fillStyle = '#006847'; x.fillRect(0, 0, w / 3, h);
    x.fillStyle = '#f4f4f0'; x.fillRect(w / 3, 0, w / 3, h);
    x.fillStyle = '#ce1126'; x.fillRect((2 * w) / 3, 0, w / 3, h);
    x.fillStyle = '#7b5a2e';
    x.beginPath(); x.ellipse(w / 2, h / 2, 34, 40, 0, 0, 7); x.fill();
    x.fillStyle = '#3f6b2c';
    x.beginPath(); x.ellipse(w / 2, h / 2 + 34, 44, 10, 0, 0, 7); x.fill();
    T.flagMx = toTexture(c, { repeat: false });
  }

  // Bandera blanca de la escuela.
  {
    const w = 512, h = 292, c = canvas(w, h), x = c.getContext('2d');
    x.fillStyle = '#f1efe6'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#c9a227';
    x.font = 'bold 120px sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('SHV', w / 2, h / 2);
    T.flagSchool = toTexture(c, { repeat: false });
  }

  // Letrero SHV.
  {
    const w = 1024, h = 256, c = canvas(w, h), x = c.getContext('2d');
    x.fillStyle = '#f3f3ef'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1f8fd0';
    x.font = 'italic 900 190px "Arial Black", Arial, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.save();
    x.translate(w / 2, h / 2 + 10);
    x.transform(1, 0, -0.25, 1, 0, 0);
    x.fillText('SHV', 0, 0);
    x.restore();
    T.signShv = toTexture(c, { repeat: false });
  }

  return T;
}

// Canvas para las líneas de las canchas; las dibujan los módulos que lo usan.
export function fieldCanvas(w, h, base) {
  const c = canvas(w, h);
  const x = c.getContext('2d');
  x.fillStyle = base;
  x.fillRect(0, 0, w, h);
  return { c, x };
}

export function canvasTexture(c, opts) {
  return toTexture(c, opts);
}
