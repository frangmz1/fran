// Personajes y animales en estilo plano: cuerpos redondeados,
// ojos de punto, sin boca. Los pies quedan en (0,0) y miden ~150 px.
const SKIN = ['#F3C6A5', '#E2A983', '#C98C60', '#A36F48', '#7E5234', '#F6D3BA'];
const BODY_D = 'M-36,0 C-37,-40 -32,-70 -22,-88 Q-12,-98 0,-98 Q12,-98 22,-88 C32,-70 37,-40 36,0 Q0,7 -36,0Z';
let BODY_CLIP, HEAD_CLIP;
function figureDefs() {
  BODY_CLIP = clip(BODY_D);
  HEAD_CLIP = clip('M-26,-122a26,26 0 1,0 52,0a26,26 0 1,0 -52,0Z');
}

const HAIR = {
  short: 'M-27,-120 C-29,-145 -14,-153 0,-153 C16,-153 29,-145 27,-120 C23,-134 12,-139 0,-138 C-12,-139 -23,-134 -27,-120Z',
  longBack: 'M-29,-124 C-31,-152 31,-152 29,-124 L31,-88 C24,-83 18,-90 17,-100 L-17,-100 C-18,-90 -24,-83 -31,-88Z',
  longFront: 'M-27,-118 C-30,-146 -14,-153 0,-153 C14,-153 30,-146 27,-118 C24,-132 14,-140 2,-139 L0,-134 L-2,-139 C-14,-140 -24,-132 -27,-118Z',
  veilBack: 'M-35,-118 C-38,-162 38,-162 35,-118 L46,-58 C30,-46 -30,-46 -46,-58Z',
  veilFront: 'M-31,-116 C-34,-152 34,-152 31,-116 C28,-140 -28,-140 -31,-116Z',
  beard: 'M-25,-122 C-27,-97 -12,-85 0,-85 C12,-85 27,-97 25,-122 C19,-110 9,-105 0,-105 C-9,-105 -19,-110 -25,-122Z',
  longBeard: 'M-25,-122 C-27,-92 -11,-64 0,-58 C11,-64 27,-92 25,-122 C19,-110 9,-105 0,-105 C-9,-105 -19,-110 -25,-122Z',
  crown: 'M-19,-145 L-22,-166 L-10,-156 L0,-171 L10,-156 L22,-166 L19,-145Z',
  mitre: 'M-21,-140 C-23,-168 -9,-188 0,-196 C9,-188 23,-168 21,-140Z',
  zucchetto: 'M-19,-143 C-14,-155 14,-155 19,-143 C8,-147 -8,-147 -19,-143Z',
  mantle: 'M-21,-90 Q0,-97 22,-88 C32,-70 37,-40 36,0 L12,3 C22,-32 8,-64 -21,-90Z',
  cape: 'M-31,-66 C-28,-94 28,-94 31,-66 Q0,-56 -31,-66Z',
  belt: 'M-36,-54 Q0,-47 36,-54 L36,-45 Q0,-38 -36,-45Z',
};

function figure(p, o = {}) {
  const {
    x = 0, y = 0, s = 1, flip = false,
    skin = SKIN[0], robe = '#E8505B', hair = '#3B2A20', hairStyle = 'short',
    beard = null, longBeard = false, veil = null, headband = null, look = 0,
    halo = false, crown = false, mitre = null, zucchetto = null, laurel = false,
    mantle = null, cape = null, belt = null, stole = null, cross = null,
    armL = null, armR = null, bw = 1, rim = null,
  } = o;
  const G = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  if (halo) {
    glow(G, 0, -124, 70, '#FFD76A', .55);
    el('circle', { cx: 0, cy: -124, r: 36, fill: 'none', stroke: '#FFD76A', 'stroke-width': 4 }, G);
  }
  if (veil) el('path', { d: HAIR.veilBack, fill: veil }, G);
  else if (hairStyle === 'long') el('path', { d: HAIR.longBack, fill: hair }, G);

  const body = g(G, { transform: bw !== 1 ? `scale(${bw} 1)` : null });
  el('path', { d: BODY_D, fill: robe }, body);
  const deco = g(body, { 'clip-path': BODY_CLIP });
  if (belt) el('path', { d: HAIR.belt, fill: belt }, deco);
  if (stole) { el('rect', { x: -15, y: -96, width: 9, height: 100, fill: stole }, deco); el('rect', { x: 6, y: -96, width: 9, height: 100, fill: stole }, deco); }
  if (mantle) el('path', { d: HAIR.mantle, fill: mantle }, deco);
  el('rect', { x: 6, y: -100, width: 40, height: 110, fill: '#000', opacity: .13 }, deco);
  if (rim) el('path', { d: 'M-36,0 C-37,-40 -32,-70 -22,-88 L-17,-84 C-26,-66 -30,-40 -29,0Z', fill: rim, opacity: .55 }, deco);
  if (cape) el('path', { d: HAIR.cape, fill: cape }, body);
  if (cross) {
    el('rect', { x: -2.5, y: -80, width: 5, height: 20, fill: cross }, body);
    el('rect', { x: -7.5, y: -74, width: 15, height: 5, fill: cross }, body);
  }

  const head = g(G);
  el('circle', { cx: 0, cy: -122, r: 26, fill: skin }, head);
  el('circle', { cx: 16, cy: -116, r: 26, fill: '#000', opacity: .09, 'clip-path': HEAD_CLIP }, head);
  if (beard) el('path', { d: longBeard ? HAIR.longBeard : HAIR.beard, fill: beard }, head);
  const lookG = g(head, { transform: look ? `translate(${look * 5} 0)` : null });
  const eyes = g(lookG);
  el('ellipse', { cx: -9, cy: -125, rx: 3.5, ry: 4.3, fill: '#1B1A2E' }, eyes);
  el('ellipse', { cx: 9, cy: -125, rx: 3.5, ry: 4.3, fill: '#1B1A2E' }, eyes);
  if (veil) el('path', { d: HAIR.veilFront, fill: veil }, head);
  else if (hairStyle === 'long') el('path', { d: HAIR.longFront, fill: hair }, head);
  else if (hairStyle === 'short') el('path', { d: HAIR.short, fill: hair }, head);
  if (headband) el('path', { d: 'M-31,-128 C-20,-136 20,-136 31,-128 L31,-122 C20,-130 -20,-130 -31,-122Z', fill: headband }, head);
  if (crown) {
    el('path', { d: HAIR.crown, fill: '#F5B83D' }, head);
    el('circle', { cx: 0, cy: -153, r: 3.5, fill: '#E8505B' }, head);
  }
  if (mitre) {
    el('path', { d: HAIR.mitre, fill: mitre }, head);
    el('rect', { x: -4, y: -190, width: 8, height: 50, fill: '#F5B83D', opacity: .9 }, head);
    el('path', { d: 'M-21,-148 Q0,-152 21,-148 L21,-140 Q0,-144 -21,-140Z', fill: '#F5B83D' }, head);
  }
  if (zucchetto) el('path', { d: HAIR.zucchetto, fill: zucchetto }, head);
  if (laurel) for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 20) * Math.PI / 180;
    el('ellipse', { cx: f1(Math.cos(a) * 28), cy: f1(-124 + Math.sin(a) * 28), rx: 8, ry: 4, fill: '#7BC96F', transform: `rotate(${f1(a * 180 / Math.PI + 90)} ${f1(Math.cos(a) * 28)} ${f1(-124 + Math.sin(a) * 28)})` }, head);
  }

  const hands = {};
  const mkArm = (side, spec) => {
    const ang = typeof spec === 'number' ? spec : spec.a;
    const col = (spec && spec.c) || robe;
    const len = 56;
    const ag = g(G, { transform: `translate(${side * 24} -84) rotate(${-side * ang})` });
    el('rect', { x: -8.5, y: -8, width: 17, height: len + 8, rx: 8.5, fill: col }, ag);
    el('rect', { x: -8.5, y: -8, width: 8.5, height: len + 8, fill: '#000', opacity: side > 0 ? .12 : 0 }, ag);
    el('circle', { cx: 0, cy: len, r: 9, fill: skin }, ag);
    const rr = -side * ang * Math.PI / 180;
    hands[side < 0 ? 'l' : 'r'] = [side * 24 - Math.sin(rr) * len, -84 + Math.cos(rr) * len];
    return ag;
  };
  const arms = {};
  if (armL != null) arms.l = mkArm(-1, armL);
  if (armR != null) arms.r = mkArm(1, armR);

  const seed = Math.floor((x * 7 + y * 13 + s * 100)) % 997;
  const blinkAt = [];
  const rr = rng(seed + 11);
  for (let t = rr() * 3; t < 40; t += 2.6 + rr() * 2.8) blinkAt.push(t);
  const blink = t => {
    let sy = 1;
    for (const b of blinkAt) if (t > b && t < b + .16) { sy = .12; break; }
    eyes.setAttribute('transform', sy === 1 ? '' : `translate(0 -125) scale(1 ${sy}) translate(0 125)`);
  };
  const lookAt = (dx, dy) => lookG.setAttribute('transform', `translate(${f1(dx)} ${f1(dy)})`);
  const setArm = (side, ang) => { const a = arms[side]; if (a) a.setAttribute('transform', `translate(${side === 'l' ? -24 : 24} -84) rotate(${f1(side === 'l' ? ang : -ang)})`); };
  return { g: G, head, eyes, hands, arms, blink, lookAt, setArm };
}

// Figura pequeña para multitudes
function mini(p, x, y, s, robe, skin, hair, extra) {
  return figure(p, Object.assign({ x, y, s, robe, skin, hair, hairStyle: hair ? 'short' : 'none' }, extra || {}));
}

function sheep(p, x, y, s = 1, flip = false) {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  el('rect', { x: -26, y: -24, width: 8, height: 24, rx: 4, fill: '#3A3340' }, G);
  el('rect', { x: 16, y: -24, width: 8, height: 24, rx: 4, fill: '#3A3340' }, G);
  el('path', { d: 'M-40,-40 C-50,-64 -24,-78 -8,-68 C2,-84 30,-80 34,-62 C52,-60 52,-30 34,-24 C22,-12 -24,-12 -34,-22 C-52,-24 -54,-40 -40,-40Z', fill: '#F4EEE4' }, G);
  el('ellipse', { cx: 44, cy: -54, rx: 14, ry: 18, fill: '#3A3340' }, G);
  el('circle', { cx: 48, cy: -58, r: 2.8, fill: '#fff' }, G);
  return G;
}
function dove(p, col = '#FFFFFF') {
  const G = g(p);
  const wing = el('path', { fill: col }, G);
  el('path', { d: 'M-30,0 C-20,-10 10,-12 24,-6 C32,-12 40,-10 42,-4 L50,-1 L42,2 C34,10 10,12 -6,8 L-34,14 L-26,4Z', fill: col }, G);
  el('circle', { cx: 36, cy: -5, r: 2.2, fill: '#1B1A2E' }, G);
  const wing2 = el('path', { fill: '#DCE6F2' }, G);
  return (x, y, t, s = 1, flip = false) => {
    G.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(${flip ? -s : s} ${s})`);
    const f = Math.sin(t * 10) * 34;
    wing.setAttribute('d', `M-4,-2 C4,${f1(-30 - f)} 20,${f1(-44 - f)} 30,${f1(-40 - f * 1.2)} C22,-20 16,-6 10,0Z`);
    wing2.setAttribute('d', `M-8,0 C-2,${f1(-24 + f * .6)} 8,${f1(-36 + f * .8)} 16,${f1(-34 + f)} C12,-16 8,-6 4,2Z`);
  };
}
function deer(p, x, y, s = 1, flip = false, col = '#C9844E') {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  for (const lx of [-30, -18, 20, 32]) el('rect', { x: lx, y: -46, width: 7, height: 46, rx: 3.5, fill: col }, G);
  el('path', { d: 'M-40,-50 C-44,-80 30,-86 40,-62 C46,-48 30,-38 0,-38 C-28,-38 -38,-40 -40,-50Z', fill: col }, G);
  el('path', { d: 'M28,-66 L44,-104 L60,-100 L46,-60Z', fill: col }, G);
  el('ellipse', { cx: 56, cy: -104, rx: 16, ry: 11, fill: col }, G);
  el('circle', { cx: 58, cy: -108, r: 2.6, fill: '#1B1A2E' }, G);
  el('path', { d: 'M48,-112 L40,-140 M44,-128 L32,-134 M52,-114 L58,-142 M56,-132 L66,-138', stroke: '#7A5230', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, G);
  el('path', { d: 'M-36,-60 C-26,-52 26,-50 36,-58 C28,-44 -28,-44 -36,-60Z', fill: '#FFF', opacity: .25 }, G);
  return G;
}
function donkey(p, x, y, s = 1, flip = false, col = '#8C8A99') {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  for (const lx of [-34, -20, 18, 32]) el('rect', { x: lx, y: -44, width: 9, height: 44, rx: 4.5, fill: col }, G);
  el('path', { d: 'M-44,-48 C-48,-80 34,-84 44,-60 C48,-44 30,-36 0,-36 C-30,-36 -42,-38 -44,-48Z', fill: col }, G);
  el('path', { d: 'M30,-64 L48,-100 L68,-96 L50,-56Z', fill: col }, G);
  el('ellipse', { cx: 66, cy: -96, rx: 20, ry: 13, fill: col }, G);
  el('ellipse', { cx: 80, cy: -92, rx: 9, ry: 8, fill: '#B9B6C4' }, G);
  el('path', { d: 'M52,-104 L46,-134 L58,-110Z M60,-106 L60,-138 L68,-108Z', fill: col }, G);
  el('circle', { cx: 64, cy: -100, r: 2.6, fill: '#1B1A2E' }, G);
  return G;
}
function ox(p, x, y, s = 1, flip = false, col = '#A0633C') {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  for (const lx of [-40, -24, 22, 38]) el('rect', { x: lx, y: -48, width: 11, height: 48, rx: 5, fill: col }, G);
  el('path', { d: 'M-52,-54 C-56,-96 44,-100 52,-66 C56,-46 36,-40 0,-40 C-36,-40 -50,-42 -52,-54Z', fill: col }, G);
  el('path', { d: 'M40,-86 C44,-104 76,-104 80,-86 C84,-66 76,-56 60,-56 C44,-56 36,-68 40,-86Z', fill: col }, G);
  el('ellipse', { cx: 62, cy: -62, rx: 16, ry: 9, fill: '#E7B894' }, G);
  el('path', { d: 'M44,-96 C34,-100 30,-110 36,-116 C38,-106 44,-102 50,-100Z M76,-96 C86,-100 90,-110 84,-116 C82,-106 76,-102 70,-100Z', fill: '#F4EEE4' }, G);
  el('circle', { cx: 54, cy: -84, r: 2.6, fill: '#1B1A2E' }, G);
  el('circle', { cx: 68, cy: -84, r: 2.6, fill: '#1B1A2E' }, G);
  return G;
}
function fish(p, x, y, s, col) {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  el('path', { d: 'M-24,0 C-10,-14 14,-14 24,0 C14,14 -10,14 -24,0Z M-24,0 L-38,-12 L-36,12Z', fill: col }, G);
  el('circle', { cx: 14, cy: -3, r: 2.4, fill: '#0E1A3A' }, G);
  return G;
}
