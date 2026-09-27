// Texturas procedurales dibujadas en canvas: el juego no necesita archivos de
// imagen y todo cabe en un solo HTML.
import * as THREE from 'three';

let seed = 20260926;
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

// Ruido de valor tileable.
function ruido(ctx, w, h, celdas, amp, tinte) {
  const cx = celdas, cy = Math.max(1, Math.round((celdas * h) / w));
  const grid = [];
  for (let i = 0; i < cx * cy; i++) grid.push(rand());
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const suave = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = (x / w) * cx, fy = (y / h) * cy;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = suave(fx - x0), ty = suave(fy - y0);
      const g = (a, b) => grid[(b % cy) * cx + (a % cx)];
      const v = (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
      const k = (v - 0.5) * amp;
      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, d[i] + k * tinte[0]));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + k * tinte[1]));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + k * tinte[2]));
    }
  }
  ctx.putImageData(img, 0, 0);
}

function motas(ctx, w, h, n, colores, r0, r1) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colores[Math.floor(rand() * colores.length)];
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, r0 + rand() * (r1 - r0), 0, Math.PI * 2);
    ctx.fill();
  }
}

function llenar(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export function aTextura(c, { repetir = true, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

function normalDe(c, fuerza = 2) {
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
      const dx = (lum(x + 1, y) - lum(x - 1, y)) * fuerza;
      const dy = (lum(x, y + 1) - lum(x, y - 1)) * fuerza;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((-dx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return aTextura(out, { srgb: false });
}

export function crearTexturas() {
  const T = {};

  // Asfalto de avenidas y calles.
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, '#56575a');
    ruido(x, s, s, 8, 22, [1, 1, 1]);
    ruido(x, s, s, 32, 10, [1, 1, 1]);
    motas(x, s, s, 9000, ['rgba(25,25,25,0.35)', 'rgba(170,170,170,0.25)'], 0.4, 1.2);
    // Parches y grietas.
    x.strokeStyle = 'rgba(30,30,30,0.35)';
    x.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      let px = rand() * s, py = rand() * s;
      x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 6; k++) { px += (rand() - 0.5) * 40; py += (rand() - 0.5) * 40; x.lineTo(px, py); }
      x.stroke();
    }
    T.asfalto = aTextura(c);
  }

  // Adoquín de las privadas.
  {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, '#6f6259');
    const n = 16, t = s / n;
    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n / 2; k++) {
        const off = (r % 2) * t;
        const v = 0.8 + rand() * 0.3;
        x.fillStyle = `rgb(${150 * v},${128 * v},${112 * v})`;
        x.fillRect(k * t * 2 + off + 2, r * t + 2, t * 2 - 4, t - 4);
        x.fillRect(k * t * 2 + off + 2 - s, r * t + 2, t * 2 - 4, t - 4);
      }
    }
    ruido(x, s, s, 16, 25, [1, 0.9, 0.8]);
    T.adoquin = aTextura(c);
    T.adoquinN = normalDe(c, 3);
  }

  // Concreto de banquetas y cocheras (losas de 1.5 m).
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, '#bcb8b0');
    ruido(x, s, s, 8, 22, [1, 1, 1]);
    motas(x, s, s, 1500, ['rgba(90,90,90,0.15)', 'rgba(255,255,255,0.2)'], 0.4, 1.2);
    x.strokeStyle = 'rgba(90,88,84,0.5)';
    x.lineWidth = 2;
    x.strokeRect(1, 1, s - 2, s - 2);
    T.concreto = aTextura(c);
  }

  // Aplanado de muros (casi blanco: el color lo pone cada casa).
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, '#f4f3f0');
    ruido(x, s, s, 16, 12, [1, 1, 1]);
    ruido(x, s, s, 64, 6, [1, 1, 1]);
    T.aplanado = aTextura(c);
  }

  // Azotea con impermeabilizante (gris; el color lo pone cada casa).
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, '#d8d6d2');
    ruido(x, s, s, 12, 30, [1, 1, 1]);
    motas(x, s, s, 800, ['rgba(80,80,80,0.12)'], 0.5, 2);
    T.azotea = aTextura(c);
  }

  // Piedra de fachada (laja).
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, '#6d655c');
    let y = 0;
    while (y < s) {
      const h = 10 + rand() * 16;
      let px = 0;
      while (px < s) {
        const w = 20 + rand() * 50;
        const v = 0.75 + rand() * 0.4;
        x.fillStyle = `rgb(${176 * v},${160 * v},${140 * v})`;
        x.fillRect(px + 1.5, y + 1.5, w - 3, h - 3);
        px += w;
      }
      y += h;
    }
    ruido(x, s, s, 32, 25, [1, 1, 1]);
    T.piedra = aTextura(c);
  }

  // Suelos del terreno.
  const suelo = (base, tinte, colores, amp) => {
    const s = 512, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, base);
    ruido(x, s, s, 6, amp, tinte);
    ruido(x, s, s, 24, amp * 0.7, tinte);
    ruido(x, s, s, 96, amp * 0.5, tinte);
    motas(x, s, s, 5000, colores, 0.5, 2.2);
    return c;
  };
  {
    const c = suelo('#9a8566', [1, 0.9, 0.75], ['rgba(70,55,40,0.3)', 'rgba(230,215,190,0.35)'], 38);
    T.tierra = aTextura(c);
  }
  {
    const c = suelo('#8d8158', [0.9, 1, 0.6], ['rgba(80,75,40,0.4)', 'rgba(190,175,120,0.35)', 'rgba(110,95,60,0.35)'], 50);
    const x = c.getContext('2d');
    for (let i = 0; i < 5000; i++) {
      const px = rand() * 512, py = rand() * 512;
      x.strokeStyle = rand() < 0.5 ? 'rgba(90,90,45,0.5)' : 'rgba(200,180,120,0.45)';
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rand() - 0.5) * 4, py - 3 - rand() * 5); x.stroke();
    }
    T.zacate = aTextura(c);
  }
  {
    const c = suelo('#5b8a3a', [0.7, 1, 0.5], ['rgba(40,70,20,0.35)', 'rgba(150,180,90,0.3)'], 40);
    T.pasto = aTextura(c);
  }
  {
    const c = suelo('#6c6a4a', [0.9, 1, 0.7], ['rgba(50,55,30,0.45)', 'rgba(140,130,90,0.35)'], 55);
    T.monte = aTextura(c);
  }

  // Atlas de fachada: ventana (0-0.5), puerta (0.5-0.75), portón (0.75-1).
  {
    const w = 1024, h = 512, c = canvas(w, h), x = c.getContext('2d');
    // Ventana: cristal oscuro con reflejo de cielo y cancel de aluminio.
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#7f93a6');
    g.addColorStop(0.45, '#39485a');
    g.addColorStop(1, '#1d2530');
    x.fillStyle = g;
    x.fillRect(0, 0, 512, h);
    x.fillStyle = 'rgba(255,255,255,0.08)';
    x.beginPath(); x.moveTo(60, h); x.lineTo(200, 0); x.lineTo(280, 0); x.lineTo(140, h); x.fill();
    // Cortina clara en un lado.
    x.fillStyle = 'rgba(225,215,195,0.35)';
    x.fillRect(30, 30, 110, h - 60);
    x.strokeStyle = '#c9ccd0';
    x.lineWidth = 22;
    x.strokeRect(11, 11, 490, h - 22);
    x.lineWidth = 14;
    x.beginPath(); x.moveTo(256, 0); x.lineTo(256, h); x.stroke();
    // Puerta de madera con tableros y jaladera.
    x.fillStyle = '#7a4f2e';
    x.fillRect(512, 0, 256, h);
    for (let k = 0; k < 90; k++) {
      x.strokeStyle = rand() < 0.5 ? 'rgba(60,35,18,0.25)' : 'rgba(160,110,70,0.2)';
      x.lineWidth = 1 + rand() * 2;
      const px = 512 + rand() * 256;
      x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + 6, h * 0.3, px - 6, h * 0.6, px + 3, h); x.stroke();
    }
    x.strokeStyle = 'rgba(40,24,12,0.6)';
    x.lineWidth = 3;
    for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(530 + k * 38, 20); x.lineTo(530 + k * 38, h - 20); x.stroke(); }
    x.strokeStyle = '#3a2616';
    x.lineWidth = 12;
    x.strokeRect(518, 6, 244, h - 6);
    x.fillStyle = '#c8c8c8';
    x.fillRect(720, 200, 10, 110);
    // Portón de lámina con lamas horizontales (claro: lo tiñe cada casa).
    x.fillStyle = '#e8e8e6';
    x.fillRect(768, 0, 256, h);
    for (let k = 0; k < 16; k++) {
      const y = k * (h / 16);
      const gr = x.createLinearGradient(0, y, 0, y + h / 16);
      gr.addColorStop(0, 'rgba(255,255,255,0.35)');
      gr.addColorStop(0.8, 'rgba(0,0,0,0.05)');
      gr.addColorStop(1, 'rgba(0,0,0,0.35)');
      x.fillStyle = gr;
      x.fillRect(768, y, 256, h / 16);
    }
    x.strokeStyle = 'rgba(0,0,0,0.35)';
    x.lineWidth = 8;
    x.strokeRect(772, 4, 248, h - 8);
    T.fachada = aTextura(c, { repetir: false });
  }

  // Rayas de la calle: línea central punteada amarilla.
  {
    const c = canvas(64, 512), x = c.getContext('2d');
    x.clearRect(0, 0, 64, 512);
    x.fillStyle = '#e3b62c';
    x.fillRect(8, 0, 48, 300);
    T.raya = aTextura(c);
  }

  // Oleaje del agua (mapa de normales).
  {
    const s = 256, c = canvas(s), x = c.getContext('2d');
    llenar(x, s, s, '#808080');
    ruido(x, s, s, 8, 120, [1, 1, 1]);
    ruido(x, s, s, 24, 80, [1, 1, 1]);
    T.aguaN = normalDe(c, 6);
  }

  return T;
}
