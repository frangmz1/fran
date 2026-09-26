// Utilidades de dibujo y animación. Todo es determinista: cada fotograma
// se calcula a partir del tiempo, para poder exportar cuadro por cuadro.
const W = 1920, H = 1080;
const NS = 'http://www.w3.org/2000/svg';
let DEFS = null;
let UID = 0;

function el(tag, a, p) {
  const e = document.createElementNS(NS, tag);
  if (a) for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]);
  if (p) p.appendChild(e);
  return e;
}
function attr(e, a) { for (const k in a) e.setAttribute(k, a[k]); return e; }
function uid(p) { return (p || 'i') + (++UID); }
function g(p, a) { return el('g', a, p); }

function stopsTo(node, stops) {
  for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op }, node);
}
function lin(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  const id = uid('lg');
  stopsTo(el('linearGradient', { id, x1, y1, x2, y2 }, DEFS), stops);
  return `url(#${id})`;
}
function rad(stops, cx = .5, cy = .5, r = .5, extra) {
  const id = uid('rg');
  stopsTo(el('radialGradient', Object.assign({ id, cx, cy, r }, extra || {}), DEFS), stops);
  return `url(#${id})`;
}
const _glow = {};
function glowFill(c) {
  if (!_glow[c]) _glow[c] = rad([[0, c, 1], [.25, c, .55], [.6, c, .14], [1, c, 0]]);
  return _glow[c];
}
function glow(p, x, y, r, c, op = 1) {
  return el('circle', { cx: x, cy: y, r, fill: glowFill(c), opacity: op }, p);
}
function clip(pathD) {
  const id = uid('cp');
  el('path', { d: pathD }, el('clipPath', { id }, DEFS));
  return `url(#${id})`;
}

// Aleatorio con semilla (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Curvas de aceleración
const E = {
  lin: t => t,
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  o: t => 1 - Math.pow(1 - t, 3),
  o5: t => 1 - Math.pow(1 - t, 5),
  i: t => t * t * t,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
// progreso 0..1 entre los tiempos a y b
function P(t, a, b, e = E.io) { return e(clamp((t - a) / (b - a))); }
// sube, se mantiene y baja
function pulse(t, a, b, fi = .5, fo = .5) { return P(t, a, a + fi) * (1 - P(t, b - fo, b)); }
const f1 = v => Math.round(v * 10) / 10;

function tr(e, x, y, s = 1, r = 0, sy) {
  e.setAttribute('transform', `translate(${f1(x)} ${f1(y)})${r ? ` rotate(${f1(r)})` : ''}${s !== 1 || sy != null ? ` scale(${s} ${sy == null ? s : sy})` : ''}`);
}
function op(e, v) { e.setAttribute('opacity', clamp(v).toFixed(3)); }
function show(e, v) { e.style.display = v ? '' : 'none'; }

// Camino suave (Catmull-Rom) por una lista de puntos
function smooth(pts, closed = false) {
  const n = pts.length;
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  const seg = closed ? n : n - 1;
  for (let i = 0; i < seg; i++) {
    const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
    const p1 = pts[i], p2 = pts[(i + 1) % n];
    const p3 = closed ? pts[(i + 2) % n] : pts[Math.min(i + 2, n - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f1(c1x)},${f1(c1y)} ${f1(c2x)},${f1(c2y)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
// Relleno de una silueta (colinas, olas) hasta abajo
function ridge(pts, bottom = H + 60) {
  return smooth(pts) + `L${f1(pts[pts.length - 1][0])},${bottom}L${f1(pts[0][0])},${bottom}Z`;
}
function hillPts(x0, x1, base, amp, seed, step = 180) {
  const r = rng(seed), pts = [];
  for (let x = x0; x <= x1 + step; x += step) pts.push([x, base - r() * amp]);
  return pts;
}
function wavePts(x0, x1, y, amp, len, ph, step = 30, amp2 = 0, len2 = 1, ph2 = 0) {
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step)
    pts.push([x, y + Math.sin(x / len * 6.2832 + ph) * amp + Math.sin(x / len2 * 6.2832 + ph2) * amp2]);
  return pts;
}

// Cielo estrellado con parpadeo
function starfield(p, n, seed, box = [0, 0, W, H], col = '#FFF4E0', big = .06) {
  const r = rng(seed), arr = [];
  const grp = g(p);
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * box[2], y = box[1] + Math.pow(r(), 1.25) * box[3];
    const isBig = r() < big;
    const rr = isBig ? 2.2 + r() * 1.8 : .7 + r() * 1.5;
    let e;
    if (isBig) {
      e = g(grp, { transform: `translate(${f1(x)} ${f1(y)})` });
      glow(e, 0, 0, rr * 6, col, .5);
      el('path', { d: sparkleD(rr * 3.2), fill: col }, e);
    } else e = el('circle', { cx: f1(x), cy: f1(y), r: f1(rr), fill: col }, grp);
    arr.push({ e, ph: r() * 6.28, sp: .7 + r() * 2.2, b: .35 + r() * .65, x, y });
  }
  const upd = t => { for (const o of arr) o.e.setAttribute('opacity', (o.b * (.6 + .4 * Math.sin(t * o.sp + o.ph))).toFixed(2)); };
  upd.items = arr; upd.g = grp;
  return upd;
}
function sparkleD(r) {
  const k = r * .18;
  return `M0,${-r} Q${k},${-k} ${r},0 Q${k},${k} 0,${r} Q${-k},${k} ${-r},0 Q${-k},${-k} 0,${-r}Z`;
}

// Rayos de luz en abanico
function rays(p, x, y, n, len, col, op = .25, width = .09, seed = 1) {
  const grp = g(p, { transform: `translate(${x} ${y})` });
  const r = rng(seed);
  const fill = rad([[0, col, 1], [.3, col, .4], [.6, col, 0]], 0, 0, 1, { gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: len });
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + r() * .2, w = width * (.5 + r());
    const L = len * (.6 + r() * .4);
    const d = `M0,0L${f1(Math.cos(a - w) * L)},${f1(Math.sin(a - w) * L)}L${f1(Math.cos(a + w) * L)},${f1(Math.sin(a + w) * L)}Z`;
    el('path', { d, fill, opacity: op }, grp);
  }
  return grp;
}

// Cámara: fotogramas clave {t, x, y, s} (x,y = punto de la escena al centro)
function camAt(keys, t) {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const k = (b.e || E.io)(clamp((t - a.t) / (b.t - a.t)));
      return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k) };
    }
  }
  return keys[keys.length - 1];
}
// Aplica la cámara a una capa con profundidad (0 = fija, 1 = sigue la cámara)
function camApply(layer, c, depth = 1, jx = 0, jy = 0) {
  const s = 1 + (c.s - 1) * depth;
  const x = 960 + (c.x - 960) * depth + jx, y = 540 + (c.y - 540) * depth + jy;
  layer.setAttribute('transform', `translate(960 540) scale(${s.toFixed(4)}) translate(${f1(-x)} ${f1(-y)})`);
}
function camera(layers, keys) {
  return t => { const c = camAt(keys, t); for (const [l, d] of layers) camApply(l, c, d); };
}

// Fondo de cielo a pantalla completa
function sky(p, stops, x0 = -400, y0 = -400, w = W + 800, h = H + 800) {
  return el('rect', { x: x0, y: y0, width: w, height: h, fill: lin(stops) }, p);
}

// Nubes redondeadas
function cloud(p, x, y, s, col, opac = 1) {
  const c = g(p, { transform: `translate(${x} ${y}) scale(${s})`, opacity: opac });
  el('path', { d: 'M-120,0 C-150,0 -150,-44 -112,-46 C-108,-86 -50,-92 -34,-58 C-18,-104 60,-100 62,-52 C98,-66 132,-36 118,-8 C140,-6 142,0 120,0 Z', fill: col }, c);
  return c;
}

// Árbol redondo estilo plano
function roundTree(p, x, y, s, leaf, trunk = '#6B4430', light) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  el('path', { d: 'M-7,0 L-5,-70 L5,-70 L7,0Z', fill: trunk }, t);
  el('circle', { cx: 0, cy: -100, r: 48, fill: leaf }, t);
  el('circle', { cx: -28, cy: -78, r: 30, fill: leaf }, t);
  el('circle', { cx: 28, cy: -80, r: 32, fill: leaf }, t);
  if (light) {
    el('circle', { cx: -14, cy: -116, r: 26, fill: light, opacity: .55 }, t);
    el('circle', { cx: -34, cy: -88, r: 14, fill: light, opacity: .4 }, t);
  }
  return t;
}
function cypress(p, x, y, s, leaf, light) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  el('path', { d: 'M0,-170 C22,-120 26,-40 16,0 L-16,0 C-26,-40 -22,-120 0,-170Z', fill: leaf }, t);
  if (light) el('path', { d: 'M0,-170 C-14,-120 -18,-40 -12,0 L-16,0 C-26,-40 -22,-120 0,-170Z', fill: light, opacity: .5 }, t);
  return t;
}
function palm(p, x, y, s, leaf = '#2E8B57', trunk = '#7B5A3C') {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  el('path', { d: 'M-6,0 Q-2,-80 14,-150 L22,-148 Q8,-80 8,0Z', fill: trunk }, t);
  for (const a of [-160, -120, -60, -20, 20, 200]) {
    const fr = g(t, { transform: `translate(18 -150) rotate(${a})` });
    el('path', { d: 'M0,0 Q40,-26 90,6 Q40,-6 0,0Z', fill: leaf }, fr);
  }
  return t;
}

// Pájaro simple (V) que aletea
function bird(p, col = '#1A2340') {
  const b = el('path', { fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
  return (x, y, t, s = 1, ph = 0) => {
    const f = Math.sin(t * 9 + ph) * 9 * s;
    b.setAttribute('d', `M${f1(x - 16 * s)},${f1(y - f)} Q${f1(x - 7 * s)},${f1(y - 4 * s)} ${f1(x)},${f1(y)} Q${f1(x + 7 * s)},${f1(y - 4 * s)} ${f1(x + 16 * s)},${f1(y - f)}`);
  };
}

// Traza progresiva de un trazo (para arcoíris, rutas, grietas)
function drawStroke(e, len, k) {
  e.setAttribute('stroke-dasharray', `${len} ${len}`);
  e.setAttribute('stroke-dashoffset', f1(len * (1 - k)));
}

// Registro de escenas (en orden)
const SCENES = [];
function addScene(s) { SCENES.push(s); }
