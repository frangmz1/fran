// Escenas 0–4: portada, Creación, Noé y Abraham, Moisés, David y los profetas.

// Objeto sostenido en la mano, siempre en vertical aunque el brazo gire
function hold(f, side, ang, draw) {
  const arm = f.arms[side];
  const h = g(arm, { transform: `translate(0 56) rotate(${side === 'l' ? -ang : ang})` });
  draw(h);
  return h;
}
function staff(p, top = -150, bottom = 110, col = '#8A5A36', crook = true) {
  el('path', { d: `M0,${bottom} L0,${top}` + (crook ? ` C0,${top - 30} 30,${top - 34} 30,${top - 8}` : ''), stroke: col, 'stroke-width': 8, 'stroke-linecap': 'round', fill: 'none' }, p);
}

// Cosmos compartido por la portada y el cierre
function cosmos(root, withCross) {
  const bg = g(root), far = g(root), mid = g(root), near = g(root);
  sky(bg, [[0, '#040716'], [.55, '#0C1536'], [1, '#1D1F52']]);
  glow(far, 420, 260, 780, '#5B3FA8', .34);
  glow(far, 1560, 620, 840, '#2EC4B6', .15);
  glow(far, 1260, 150, 540, '#E8505B', .12);
  el('ellipse', { cx: 960, cy: 420, rx: 1300, ry: 170, fill: glowFill('#9FB6FF'), opacity: .12, transform: 'rotate(-18 960 420)' }, far);
  const st = starfield(far, 360, withCross ? 17 : 7);

  const L = g(mid, { transform: 'translate(960 300)' });
  glow(L, 0, 0, 700, '#F5B83D', .42);
  glow(L, 0, 0, 280, '#FFE6A8', .85);
  const R = rays(L, 0, 0, 28, 1000, '#FFD98A', .2, .045, 3);
  const core = g(L);
  if (withCross) {
    glow(core, 0, 0, 180, '#FFFFFF', .6);
    el('rect', { x: -11, y: -120, width: 22, height: 250, rx: 11, fill: '#FFF8E6' }, core);
    el('rect', { x: -80, y: -60, width: 160, height: 22, rx: 11, fill: '#FFF8E6' }, core);
  } else {
    el('path', { d: sparkleD(70), fill: '#FFF8E6' }, core);
    el('circle', { r: 16, fill: '#FFFFFF' }, core);
  }

  const earth = g(near);
  const ER = 760, ex = 960, ey = H + ER - 200;
  const disc = `M${ex - ER},${ey}a${ER},${ER} 0 1,0 ${2 * ER},0a${ER},${ER} 0 1,0 ${-2 * ER},0Z`;
  glow(earth, ex, ey, ER + 190, '#58C6FF', .55);
  el('path', { d: disc, fill: lin([[0, '#3A8EE0'], [.4, '#1F5AAE'], [1, '#0C285A']]) }, earth);
  const land = g(earth, { 'clip-path': clip(disc) });
  const landMove = g(land);
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const cx = -200 + i * 330 + r() * 120, cy = ey - ER + 60 + r() * 170, pts = [];
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, rr = 70 + r() * 90; pts.push([cx + Math.cos(a) * rr * 1.5, cy + Math.sin(a) * rr * .6]); }
    el('path', { d: smooth(pts, true), fill: i % 2 ? '#4DB36F' : '#6CC57C' }, landMove);
  }
  for (let i = 0; i < 6; i++) el('ellipse', { cx: r() * 2400 - 200, cy: ey - ER + 40 + r() * 200, rx: 140 + r() * 120, ry: 18 + r() * 12, fill: '#FFFFFF', opacity: .55 }, landMove);
  el('path', { d: disc, fill: lin([[0, '#000', 0], [.55, '#000', 0], [1, '#000', .45]], 0, 0, 1, 0) }, earth);
  el('path', { d: disc, fill: 'none', stroke: '#9BE6FF', 'stroke-width': 7, opacity: .7 }, earth);

  const cam = camera([[far, .25], [mid, .6], [near, 1]], [{ t: 0, x: 960, y: 560, s: 1.04 }, { t: 10, x: 960, y: 520, s: 1.12, e: E.lin }]);
  return lt => {
    st(lt);
    st.g.setAttribute('opacity', P(lt, 0, 2.2).toFixed(3));
    const k = P(lt, .2, 2.6, E.o5);
    tr(core, 0, 0, .2 + .8 * k);
    L.setAttribute('opacity', (withCross ? P(lt, .2, 2.5) : k).toFixed(3));
    tr(R, 0, 0, .3 + .7 * k, lt * 3);
    tr(earth, 0, 90 * (1 - P(lt, 0, 6, E.o)));
    tr(landMove, -lt * 14, 0);
    cam(lt);
  };
}

addScene({
  id: 'portada', dur: 7, fadeIn: 0,
  captions: [
    { a: 2.3, b: 6.7, text: 'DE ADÁN A HOY', cls: 'hero', stagger: .12 },
    { a: 3.1, b: 6.7, text: 'La historia de la Iglesia Católica', cls: 'heroSub' },
    { a: 3.8, b: 6.7, text: 'EN 3 MINUTOS', cls: 'heroTiny' },
  ],
  build(root) { return cosmos(root, false); },
});

// 1 · La Creación y la caída
addScene({
  id: 'creacion', dur: 14, trans: 'flash', fadeIn: .2,
  chapter: { n: 1, title: 'LA CREACIÓN', year: 'En el principio' },
  captions: [
    { a: .9, b: 6.8, text: 'En el principio, Dios creó el cielo, la tierra… y al ser humano a su *imagen*.' },
    { a: 7.3, b: 13.6, text: 'Pero el *pecado* rompió la amistad con Dios. Aun así, Él prometió un *Salvador*.' },
  ],
  build(root) {
    const L0 = g(root), L1 = g(root), L2 = g(root), L3 = g(root), FX = g(root);
    sky(L0, [[0, '#3C8CC6'], [.42, '#8AD0D8'], [.6, '#FFE2A6'], [1, '#FFE2A6']]);
    const sun = g(L0);
    glow(sun, 1460, 420, 560, '#FFE9A8', .95);
    el('circle', { cx: 1460, cy: 420, r: 76, fill: '#FFF6D8' }, sun);
    const clouds = [cloud(L0, 300, 230, 1.1, '#FFFFFF', .85), cloud(L0, 1100, 160, .8, '#FFFFFF', .7), cloud(L0, 1760, 270, 1, '#FFFFFF', .8)];

    el('path', { d: ridge(hillPts(-500, 2500, 610, 190, 11, 230)), fill: '#A6D6C6' }, L1);
    el('path', { d: ridge(hillPts(-500, 2500, 660, 120, 12, 200)), fill: '#82C3A6' }, L1);
    el('path', { d: ridge(hillPts(-500, 2500, 735, 80, 13, 260)), fill: '#5FAF73' }, L2);
    const r = rng(21);
    for (let i = 0; i < 16; i++) roundTree(L2, -300 + i * 160 + r() * 60, 712 + r() * 30, .42 + r() * .2, i % 2 ? '#3F9A5E' : '#4DA96A', '#5C3B28', '#86D18A');

    el('path', { d: ridge([[-500, 870], [100, 840], [700, 860], [1200, 830], [1800, 850], [2500, 835]]), fill: '#47A262' }, L3);
    el('path', { d: ridge([[-500, 980], [300, 960], [900, 990], [1500, 965], [2500, 985]]), fill: '#3C9357' }, L3);
    for (let i = 0; i < 90; i++) {
      const x = -300 + r() * 2500, y = 860 + r() * 220;
      el('circle', { cx: f1(x), cy: f1(y), r: f1(3 + r() * 5), fill: ['#FFD166', '#FF8FA3', '#FFFFFF', '#FFB4E1'][i % 4], opacity: .9 }, L3);
    }
    roundTree(L3, 180, 900, 1.3, '#2F8A57', '#5C3B28', '#63B96F');
    roundTree(L3, 1780, 890, 1.5, '#2F8A57', '#5C3B28', '#63B96F');
    deer(L3, 430, 905, .95, false);
    deer(L3, 610, 890, .7, true, '#B87644');

    // Árbol del conocimiento, fruto y serpiente
    const TX = 1250, TY = 900, TS = 2.7;
    roundTree(L3, TX, TY, TS, '#2A7F50', '#5C3B28', '#5DB36B');
    const fruits = [[-80, -290], [60, -250], [110, -320], [-120, -230], [0, -360], [140, -220], [-40, -210]];
    for (const [dx, dy] of fruits) el('circle', { cx: TX + dx, cy: TY + dy, r: 13, fill: '#E8505B' }, L3);
    const fruit = g(L3);
    const fg = glow(fruit, TX - 70, TY - 180, 60, '#FF6B6B', 0);
    el('circle', { cx: TX - 70, cy: TY - 180, r: 16, fill: '#F0545F' }, fruit);
    el('path', { d: `M${TX - 70},${TY - 196} q4,-10 12,-12`, stroke: '#5C3B28', 'stroke-width': 4, fill: 'none' }, fruit);
    const snakeD = `M${TX - 18},${TY - 20} C${TX + 40},${TY - 40} ${TX - 50},${TY - 70} ${TX + 10},${TY - 100} C${TX + 60},${TY - 125} ${TX - 30},${TY - 150} ${TX - 30},${TY - 172}`;
    const snake = el('path', { d: snakeD, stroke: '#4A2B6B', 'stroke-width': 15, 'stroke-linecap': 'round', fill: 'none' }, L3);
    const sHead = g(L3);
    el('ellipse', { cx: TX - 30, cy: TY - 180, rx: 15, ry: 11, fill: '#4A2B6B' }, sHead);
    el('circle', { cx: TX - 24, cy: TY - 183, r: 3.2, fill: '#FFD23F' }, sHead);

    const adam = figure(L3, { x: 1010, y: 905, s: 1.15, skin: SKIN[2], robe: '#D9954E', hair: '#3A2418', armL: 8, armR: 10 });
    const eve = figure(L3, { x: 1105, y: 910, s: 1.1, skin: SKIN[1], robe: '#E07A6B', hair: '#5A2E1A', hairStyle: 'long', armL: 8, armR: 10 });

    const birds = [bird(L0, '#23406B'), bird(L0, '#23406B'), bird(L0, '#23406B')];
    const dark = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#3E2F73', opacity: 0, style: 'mix-blend-mode:multiply' }, FX);
    const hope = g(FX, { transform: 'translate(470 200)' });
    glow(hope, 0, 0, 260, '#FFD98A', .8);
    rays(hope, 0, 0, 16, 300, '#FFE6A8', .25, .05, 9);
    el('path', { d: sparkleD(34), fill: '#FFF8E6' }, hope);

    const cam = camera([[L0, .08], [L1, .25], [L2, .55], [L3, 1]],
      [{ t: 0, x: 960, y: 540, s: 1 }, { t: 7, x: 1070, y: 600, s: 1.14 }, { t: 14, x: 900, y: 590, s: 1.1 }]);
    return lt => {
      cam(lt);
      clouds.forEach((c, i) => c.setAttribute('transform', `translate(${f1([300, 1100, 1760][i] + lt * (10 + i * 5))} ${[230, 160, 270][i]}) scale(${[1.1, .8, 1][i]})`));
      birds.forEach((b, i) => b(-100 + lt * (95 + i * 12) + i * 60, 300 + i * 26 + Math.sin(lt + i) * 8, lt, .9 - i * .1, i));
      adam.blink(lt); eve.blink(lt);
      // Eva alcanza el fruto
      eve.setArm('r', 10 + 120 * P(lt, 7.4, 8.6) * (1 - P(lt, 9.8, 10.6)));
      eve.lookAt(4 * P(lt, 7, 7.6), -4 * P(lt, 7, 7.6) * (1 - P(lt, 9.4, 10)));
      op(fg, P(lt, 6.8, 8) * (1 - P(lt, 10, 11)));
      drawStroke(snake, 300, P(lt, 6.6, 8.2));
      op(sHead, P(lt, 7.8, 8.3));
      op(dark, .62 * P(lt, 8.8, 10.8));
      op(sun, 1 - .6 * P(lt, 8.8, 10.8));
      // salen del jardín
      const w = P(lt, 10.3, 13.8, E.sine);
      const bob = k => -Math.abs(Math.sin(lt * 7 + k)) * 7 * (w > 0 && w < 1 ? 1 : 0);
      tr(adam.g, 1010 - 260 * w, 905 + bob(0), 1.15);
      tr(eve.g, 1105 - 260 * w, 910 + bob(1.3), 1.1);
      adam.lookAt(-5 * P(lt, 9.8, 10.3), 2 * P(lt, 9.8, 10.3));
      op(hope, P(lt, 11.2, 12.6));
      tr(hope, 470, 200, .7 + .3 * P(lt, 11.2, 12.8, E.back), lt * 6);
    };
  },
});

// 2 · Noé y Abraham
addScene({
  id: 'alianza', dur: 13,
  chapter: { n: 2, title: 'LA ALIANZA', year: 'Noé y Abraham' },
  captions: [
    { a: .6, b: 6.1, text: 'Tras el diluvio, Dios salvó a *Noé* y selló una alianza con la humanidad.' },
    { a: 7.0, b: 12.7, text: 'A *Abraham* le prometió una descendencia tan numerosa como las estrellas.' },
  ],
  build(root) {
    // Toma A: el arca
    const A = g(root), A0 = g(A), A1 = g(A), A2 = g(A);
    sky(A0, [[0, '#4C9AD0'], [.5, '#A9DDE6'], [.78, '#FFE1B2']]);
    const sunA = g(A0); glow(sunA, 1520, 360, 520, '#FFE9A8', .95); el('circle', { cx: 1520, cy: 360, r: 64, fill: '#FFF6D8' }, sunA);
    const bow = g(A0, { opacity: .85 });
    const bowCols = ['#E8505B', '#F29E4C', '#F5D547', '#5CC27A', '#3FA7D6', '#7B61C4'];
    const arcs = bowCols.map((c, i) => {
      const R = 600 - i * 24, cx = 1080, cy = 780;
      return [el('path', { d: `M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy}`, stroke: c, 'stroke-width': 25, fill: 'none' }, bow), Math.PI * R];
    });
    const storm = sky(A0, [[0, '#18203C'], [.6, '#34425F'], [1, '#4E5A76']]);
    const cl = g(A0);
    const cL = [cloud(cl, 300, 200, 2.2, '#2A3350'), cloud(cl, 620, 120, 1.8, '#323C5A'), cloud(cl, 60, 330, 1.6, '#262E48')];
    const cR = [cloud(cl, 1350, 170, 2.3, '#2A3350'), cloud(cl, 1700, 280, 2, '#323C5A'), cloud(cl, 1050, 90, 1.7, '#262E48')];
    const rain = g(A0), drops = [], rr = rng(31);
    for (let i = 0; i < 110; i++) drops.push({ e: el('path', { stroke: '#BFD4F2', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .6 }, rain), x: rr() * 2200, y: rr() * 1200, v: 1300 + rr() * 500 });

    const seaB = el('path', { fill: '#2A6E9E' }, A1);
    const seaM = el('path', { fill: '#2F8FB5' }, A1);
    const ark = g(A1);
    const AK = g(ark, { transform: 'scale(1.05)' });
    const gir = g(AK);
    el('path', { d: 'M110,-110 C112,-160 118,-205 126,-242 L146,-240 C140,-200 134,-160 134,-110Z', fill: '#F2C14E' }, gir);
    for (const [sx, sy] of [[122, -150], [130, -190], [124, -125], [136, -220]]) el('circle', { cx: sx, cy: sy, r: 5, fill: '#C98A3A' }, gir);
    el('ellipse', { cx: 146, cy: -250, rx: 22, ry: 13, fill: '#F2C14E' }, gir);
    el('path', { d: 'M134,-262 l-3,-14 M146,-263 l2,-14', stroke: '#8A5A2A', 'stroke-width': 4, 'stroke-linecap': 'round' }, gir);
    el('circle', { cx: 150, cy: -253, r: 2.8, fill: '#1B1A2E' }, gir);
    el('rect', { x: -180, y: -118, width: 360, height: 100, rx: 6, fill: '#B97A48' }, AK);
    el('rect', { x: 20, y: -118, width: 160, height: 100, fill: '#000', opacity: .1 }, AK);
    el('path', { d: 'M-210,-112 L0,-178 L210,-112Z', fill: '#7A4A2C' }, AK);
    for (const wx of [-140, -70, 0, 70]) { el('rect', { x: wx, y: -88, width: 40, height: 34, rx: 5, fill: '#3A2416' }, AK); glow(AK, wx + 20, -71, 34, '#FFC56B', .5); }
    el('path', { d: 'M-320,-24 C-300,40 -236,94 -190,100 L190,100 C236,94 300,40 320,-24Z', fill: '#8A5634' }, AK);
    el('path', { d: 'M-320,-24 L320,-24 L316,-8 L-316,-8Z', fill: '#6E4128' }, AK);
    for (const py of [18, 50, 78]) el('path', { d: `M${-300 + py},${py} L${300 - py},${py}`, stroke: '#6E4128', 'stroke-width': 4 }, AK);
    el('path', { d: 'M0,-24 L320,-24 C300,40 236,94 190,100 L0,100Z', fill: '#000', opacity: .12 }, AK);
    const noah = figure(AK, { x: -250, y: -22, s: .62, skin: SKIN[1], robe: '#5A7BC4', hair: '#E8E4DC', beard: '#F2EFEA', longBeard: true, armR: 150 });
    const seaF = el('path', { fill: '#3FB3C8' }, A2);
    const foam = el('path', { fill: 'none', stroke: '#C8F1F5', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .8 }, A2);
    const dv = dove(A2);
    const twig = g(A2);
    el('path', { d: 'M0,0 L22,6', stroke: '#6B8E3A', 'stroke-width': 3 }, twig);
    el('ellipse', { cx: 12, cy: 0, rx: 7, ry: 3.5, fill: '#7FB04A' }, twig);
    el('ellipse', { cx: 20, cy: 8, rx: 7, ry: 3.5, fill: '#7FB04A' }, twig);

    // Toma B: Abraham bajo las estrellas
    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    sky(B0, [[0, '#070B24'], [.45, '#1A2160'], [.72, '#5D3F7E'], [.86, '#C27A7A']], -400, -700, W + 800, H + 1100);
    el('ellipse', { cx: 1100, cy: 200, rx: 1300, ry: 160, fill: glowFill('#A7B8FF'), opacity: .2, transform: 'rotate(-24 1100 200)' }, B0);
    const bStars = [], rs = rng(77);
    for (let i = 0; i < 520; i++) {
      const x = -300 + rs() * 2500, y = -300 + Math.pow(rs(), 1.4) * 1050, big = rs() < .08;
      const e = big ? g(B0, { transform: `translate(${f1(x)} ${f1(y)})` }) : el('circle', { cx: f1(x), cy: f1(y), r: f1(.8 + rs() * 1.6), fill: '#FFF4E0' }, B0);
      if (big) { glow(e, 0, 0, 18, '#FFF4E0', .5); el('path', { d: sparkleD(7), fill: '#FFF8E6' }, e); }
      bStars.push({ e, at: 6.9 + Math.pow(rs(), .8) * 4.8, ph: rs() * 6, sp: .8 + rs() * 2, b: .4 + rs() * .6 });
    }
    el('path', { d: ridge(hillPts(-500, 2500, 820, 90, 41, 300)), fill: '#6B3F4E' }, B1);
    el('path', { d: ridge([[-500, 900], [200, 870], [800, 910], [1400, 880], [2000, 905], [2500, 890]]), fill: '#8E5845' }, B1);
    const tent = g(B1, { transform: 'translate(1380 902)' });
    el('path', { d: 'M-170,0 L-110,-150 L0,-190 L120,-150 L180,0Z', fill: '#E7D2AE' }, tent);
    el('path', { d: 'M0,-190 L120,-150 L180,0 L0,0Z', fill: '#000', opacity: .12 }, tent);
    for (const sx of [-120, -60, 60, 120]) el('path', { d: `M${sx},0 L${sx * .75},-150`, stroke: '#B5543F', 'stroke-width': 10, opacity: .7 }, tent);
    el('path', { d: 'M-30,0 L0,-110 L30,0Z', fill: '#3A2230' }, tent);
    glow(tent, 0, -40, 90, '#FFB45C', .6);
    el('path', { d: ridge([[-500, 960], [300, 940], [900, 975], [1500, 950], [2500, 965]]), fill: '#A96A4A' }, B2);
    sheep(B2, 1080, 990, .8, true); sheep(B2, 1190, 1005, .9); sheep(B2, 980, 1015, .7);
    const abe = figure(B2, { x: 720, y: 985, s: 1.35, skin: SKIN[2], robe: '#7C6CB0', veil: '#E3D2B0', headband: '#8B5A3C', beard: '#F2EFEA', longBeard: true, mantle: '#C0664A', armL: 12 });
    hold(abe, 'l', 12, h => staff(h, -170, 70));

    const camA = camera([[A0, .15], [A1, .6], [A2, 1]], [{ t: 0, x: 960, y: 560, s: 1.06 }, { t: 6.8, x: 1000, y: 520, s: 1.0 }]);
    const camB = camera([[B0, .35], [B1, .7], [B2, 1]], [{ t: 6.2, x: 960, y: 610, s: 1.1 }, { t: 13, x: 960, y: 500, s: 1.0 }]);
    return lt => {
      const kB = P(lt, 6.1, 6.9, E.sine);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        camA(lt);
        const clear = P(lt, 1.0, 3.6);
        op(storm, 1 - clear); op(rain, 1 - P(lt, .6, 2.6));
        cL.forEach((c, i) => c.setAttribute('transform', `translate(${f1([300, 620, 60][i] - clear * 700)} ${[200, 120, 330][i]}) scale(${[2.2, 1.8, 1.6][i]})`));
        cR.forEach((c, i) => c.setAttribute('transform', `translate(${f1([1350, 1700, 1050][i] + clear * 800)} ${[170, 280, 90][i]}) scale(${[2.3, 2, 1.7][i]})`));
        op(cl, 1 - clear * .9);
        for (const d of drops) {
          const y = (d.y + lt * d.v) % 1250 - 100, x = (d.x - lt * 260) % 2200;
          d.e.setAttribute('d', `M${f1(x)},${f1(y)} l-12,40`);
        }
        arcs.forEach(([e, len], i) => drawStroke(e, len, P(lt, 2.6 + i * .12, 4.8 + i * .12)));
        const calm = 1 - clear * .6;
        seaB.setAttribute('d', ridge(wavePts(-500, 2500, 700, 14 * calm, 420, lt * 1.6, 40)));
        seaM.setAttribute('d', ridge(wavePts(-500, 2500, 770, 18 * calm, 360, -lt * 2 + 1, 40)));
        seaF.setAttribute('d', ridge(wavePts(-500, 2500, 900, 22 * calm, 300, lt * 2.4 + 2, 30)));
        foam.setAttribute('d', smooth(wavePts(-500, 2500, 906, 22 * calm, 300, lt * 2.4 + 2, 30)));
        tr(ark, 930, 772 + Math.sin(lt * 1.3) * 8 * calm, 1, Math.sin(lt * 1.1) * 2.2 * calm);
        noah.blink(lt);
        const dk = P(lt, 3.4, 6.2, E.sine);
        const dx = lerp(1900, 760, dk), dy = lerp(220, 560, dk) - Math.sin(dk * Math.PI) * 80;
        dv(dx, dy, lt, 1.1, true);
        tr(twig, dx - 48, dy + 2, -1.1, 0, 1.1);
      }
      if (kB > 0) {
        camB(lt);
        for (const s of bStars) s.e.setAttribute('opacity', (s.b * (.65 + .35 * Math.sin(lt * s.sp + s.ph)) * P(lt, s.at, s.at + .6, E.o)).toFixed(2));
        abe.lookAt(3, -6);
      }
    };
  },
});

// 3 · Moisés: el Éxodo y la Ley
addScene({
  id: 'exodo', dur: 13,
  chapter: { n: 3, title: 'EL ÉXODO', year: 'c. 1250 a.C.' },
  captions: [
    { a: .6, b: 6.4, text: 'Por medio de *Moisés*, Dios liberó a su pueblo de la esclavitud en Egipto.' },
    { a: 7.2, b: 12.8, text: 'En el monte Sinaí le entregó su Ley: los *Diez Mandamientos*.' },
  ],
  build(root) {
    const A = g(root), A0 = g(A), A1 = g(A), A2 = g(A);
    const HZ = 560, VX = 960;
    sky(A0, [[0, '#1B2150'], [.45, '#6B3C72'], [.66, '#F08A5D'], [.7, '#F7B267']]);
    glow(A0, 960, HZ, 700, '#FFB36B', .7);
    cloud(A0, 330, 210, 2.1, '#3A2C5E', .8); cloud(A0, 1600, 170, 2.4, '#3A2C5E', .8); cloud(A0, 1000, 90, 1.6, '#4A3468', .7);
    el('path', { d: ridge(hillPts(-500, 2500, HZ - 4, 36, 51, 160)), fill: '#5A3558' }, A0);
    el('rect', { x: -500, y: HZ, width: 2900, height: 900, fill: '#2B5E97' }, A1);
    const path = el('path', { fill: '#E3B97F' }, A1);
    const seaLines = g(A1);
    for (let i = 0; i < 7; i++) el('path', { d: `M${-400 + i * 90},${HZ + 30 + i * 36} l${160 + i * 30},0 M${1700 - i * 70},${HZ + 40 + i * 34} l${160 + i * 30},0`, stroke: '#4A86C0', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .6 }, seaLines);
    const moundFill = lin([[0, '#2E78B8'], [1, '#123A70']]);
    const wl = el('path', { fill: moundFill }, A1), wr = el('path', { fill: moundFill }, A1);
    const fl = el('path', { fill: lin([[0, '#6FD3E0'], [1, '#2E86B8']]) }, A1), fr = el('path', { fill: lin([[0, '#6FD3E0'], [1, '#2E86B8']]) }, A1);
    const foamL = el('path', { fill: 'none', stroke: '#E4FAFF', 'stroke-width': 8, 'stroke-linecap': 'round' }, A1);
    const foamR = el('path', { fill: 'none', stroke: '#E4FAFF', 'stroke-width': 8, 'stroke-linecap': 'round' }, A1);
    const fishes = g(A1), rf = rng(8), fishList = [];
    for (let i = 0; i < 10; i++) fishList.push({ e: fish(fishes, 0, 0, .8 + rf() * .6, ['#FFD166', '#FF8FA3', '#B8F2E6'][i % 3]), side: i % 2 ? 1 : -1, u: rf(), v: .35 + rf() * .45, sp: .2 + rf() * .3 });
    const crowd = g(A1), people = [], rp = rng(13);
    const robes = ['#E8505B', '#F2C14E', '#3FA7D6', '#8E6CC4', '#E07A5F', '#F4EEE4', '#5CC27A'];
    for (let i = 0; i < 26; i++) {
      const f = figure(crowd, { x: 0, y: 0, s: 1, skin: SKIN[i % 6], robe: robes[i % 7], veil: i % 3 === 0 ? '#E9DCC0' : null, hair: '#3A2418' });
      people.push({ f, start: i * .22 + rp() * .2, lane: rp() * 1.6 - .8 });
    }
    const moses = figure(A2, { x: 770, y: 965, s: 1.25, skin: SKIN[2], robe: '#B5543F', mantle: '#E9DCC0', veil: '#E9DCC0', headband: '#7A3E2A', beard: '#EDE7DC', longBeard: true, armR: 150, armL: 20 });
    hold(moses, 'r', 150, h => staff(h, -120, 130, '#7A4A2C'));
    const staffGlow = g(A2); glow(staffGlow, 0, 0, 90, '#FFF3C4', .9);

    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    sky(B0, [[0, '#0E1233'], [.5, '#2E2A5E'], [1, '#5B3F74']], -400, -400);
    starfield(B0, 120, 91, [-200, -300, 2300, 700])(0);
    const storm = g(B0);
    cloud(storm, 700, 250, 2.6, '#1E1C40', .95); cloud(storm, 1250, 220, 2.8, '#221F48', .95); cloud(storm, 980, 150, 2.2, '#2A2652', .9);
    const bolt = el('path', { d: 'M1300,230 L1250,330 L1285,335 L1220,460 L1330,310 L1292,305 L1340,230Z', fill: '#FFF3B0', opacity: 0 }, B0);
    const mt = g(B1);
    el('path', { d: 'M160,1100 C420,860 700,420 920,330 C960,316 990,318 1020,336 C1240,450 1520,860 1780,1100Z', fill: '#5A4A7E' }, mt);
    el('path', { d: 'M960,322 C990,318 1010,322 1020,336 C1240,450 1520,860 1780,1100 L1100,1100 C1110,800 1050,500 960,322Z', fill: '#000', opacity: .18 }, mt);
    el('path', { d: 'M900,345 C930,330 990,318 1020,336 C1050,352 1070,372 1080,390 C1040,380 1010,400 980,392 C950,384 930,398 900,380Z', fill: '#8C7FB0' }, mt);
    for (const [d, c, o] of [
      ['M920,330 C860,420 800,520 700,640 C760,600 820,560 860,520 C840,600 780,700 700,800 C800,720 880,620 930,520Z', '#7A6AA0', .55],
      ['M1020,336 C1080,420 1150,500 1230,600 C1170,570 1120,540 1080,500 C1110,600 1170,700 1260,800 C1150,720 1080,620 1040,520Z', '#3E3263', .5],
      ['M300,1100 C420,980 520,940 640,950 C700,1000 760,1060 800,1100Z', '#3C2F5E', 1],
      ['M1300,1100 C1380,990 1480,950 1600,960 C1680,1000 1760,1060 1800,1100Z', '#34294F', 1]]) el('path', { d, fill: c, opacity: o }, mt);
    const trail = el('path', { d: 'M760,1100 C900,1000 700,930 860,860 C1000,800 820,740 940,660 C1030,600 900,520 975,440', stroke: '#8C7FB0', 'stroke-width': 7, 'stroke-dasharray': '4 14', 'stroke-linecap': 'round', fill: 'none', opacity: .7 }, mt);
    const tab = g(B1, { transform: 'translate(970 300)' });
    const tabGlow = glow(tab, 0, 0, 340, '#FFD98A', .9);
    const tabRays = rays(tab, 0, 0, 20, 520, '#FFE6A8', .22, .05, 4);
    for (const sx of [-1, 1]) {
      const t = g(tab, { transform: `translate(${sx * 46} 0)` });
      el('path', { d: 'M-40,60 L-40,-30 C-40,-62 40,-62 40,-30 L40,60Z', fill: '#E9E2D0' }, t);
      el('path', { d: 'M4,60 L4,-58 C24,-54 40,-46 40,-30 L40,60Z', fill: '#000', opacity: .1 }, t);
      for (let k = 0; k < 5; k++) el('rect', { x: -26, y: -30 + k * 17, width: k % 2 ? 40 : 52, height: 5, rx: 2.5, fill: '#8C7FB0' }, t);
    }
    const climber = figure(B2, { x: 0, y: 0, s: .38, skin: SKIN[2], robe: '#B5543F', veil: '#E9DCC0', beard: '#EDE7DC' });

    const camA = camera([[A0, .15], [A1, .7], [A2, 1]], [{ t: 0, x: 960, y: 560, s: 1.02 }, { t: 7, x: 960, y: 600, s: 1.1 }]);
    const camB = camera([[B0, .3], [B1, 1], [B2, 1]], [{ t: 6.6, x: 960, y: 640, s: 1.0 }, { t: 13, x: 970, y: 440, s: 1.35 }]);
    return lt => {
      const kB = P(lt, 6.4, 7.1, E.sine);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        camA(lt);
        const k = P(lt, .3, 3.2, E.io);
        const wb = 420 * k, wh = 34 * k, top = 1080 - 720 * k, topH = HZ - 70 * k;
        path.setAttribute('d', `M${VX - wh},${HZ} L${VX + wh},${HZ} L${VX + wb},1100 L${VX - wb},1100Z`);
        const crest = (sgn, ph) => {
          const pts = [];
          for (let i = 0; i <= 12; i++) {
            const u = i / 12;
            pts.push([VX + sgn * lerp(wh, wb, u), lerp(topH, top, u) + Math.sin(u * 14 + lt * 3 + ph) * 9 * k]);
          }
          return pts;
        };
        const cLp = crest(-1, 0), cRp = crest(1, 2);
        fl.setAttribute('d', smooth(cLp) + `L${VX - wb},1100 L${VX - wh},${HZ}Z`);
        fr.setAttribute('d', smooth(cRp) + `L${VX + wb},1100 L${VX + wh},${HZ}Z`);
        const mound = (pts, sgn) => {
          const fx = VX + sgn * wb, far = VX + sgn * 1500;
          return `M${VX + sgn * wh},${HZ} L${pts[0][0]},${pts[0][1]}` + smooth(pts).replace(/^M[^C]*/, '') +
            ` C${f1(fx + sgn * 260)},${f1(top + 30)} ${f1(fx + sgn * 520)},${f1(HZ + 260 * k)} ${far},${f1(HZ + 90 * k)} L${far},1150 L${f1(fx)},1150Z`;
        };
        wl.setAttribute('d', mound(cLp, -1));
        wr.setAttribute('d', mound(cRp, 1));
        foamL.setAttribute('d', smooth(cLp)); foamR.setAttribute('d', smooth(cRp));
        op(fishes, k);
        for (const fsh of fishList) {
          const u = (fsh.u + lt * fsh.sp * .15) % 1;
          const x = VX + fsh.side * lerp(wh, wb, u) * (1 + .02), yTop = lerp(topH, top, u), yb = lerp(HZ, 1080, u);
          tr(fsh.e, x + fsh.side * 8, lerp(yb, yTop, fsh.v), lerp(.4, 1.6, u) * (fsh.side), 0, lerp(.4, 1.6, u));
        }
        for (const p of people) {
          const u = clamp((lt - 1.4 - p.start) / 4.2);
          if (u <= 0) { p.f.g.style.display = 'none'; continue; }
          p.f.g.style.display = '';
          const d = Math.pow(u, 1.6);
          const x = VX + 60 + p.lane * lerp(wh, wb * .6, d), y = lerp(HZ + 4, 1060, d);
          const s = lerp(.08, .95, d);
          tr(p.f.g, x, y - Math.abs(Math.sin(lt * 6 + p.start * 5)) * 5 * s, s);
          op(p.f.g, P(u, 0, .08));
        }
        tr(staffGlow, 770 + moses.hands.r[0] * 1.25, 965 + (moses.hands.r[1] - 150) * 1.25);
        op(staffGlow, P(lt, .2, 1.2) * (.7 + .3 * Math.sin(lt * 5)));
        moses.blink(lt);
      }
      if (kB > 0) {
        camB(lt);
        const fl1 = pulse(lt, 8.1, 8.45, .05, .25) + pulse(lt, 10.4, 10.75, .05, .25);
        op(bolt, fl1);
        const u = P(lt, 6.8, 12.6, E.lin);
        const pt = trail.getPointAtLength(trail.getTotalLength() * u);
        tr(climber.g, pt.x, pt.y - Math.abs(Math.sin(lt * 7)) * 3, .38);
        const k2 = P(lt, 7.6, 9.4, E.o);
        tr(tab, 970, 300, .6 + .4 * k2); op(tab, k2);
        tr(tabRays, 0, 0, 1, lt * 4);
        op(tabGlow, .7 + .3 * Math.sin(lt * 2.4));
      }
    };
  },
});

// 4 · David y los profetas
addScene({
  id: 'david', dur: 12,
  chapter: { n: 4, title: 'REYES Y PROFETAS', year: 'c. 1000 a.C.' },
  captions: [
    { a: .6, b: 5.8, text: 'El rey *David* unió a las tribus de Israel y reinó en Jerusalén.' },
    { a: 6.2, b: 11.4, text: 'Los *profetas* anunciaron que de su linaje nacería el *Mesías*.' },
  ],
  build(root) {
    const L0 = g(root), L1 = g(root), L2 = g(root), L3 = g(root);
    sky(L0, [[0, '#101844'], [.35, '#34306E'], [.62, '#C0607A'], [.78, '#F29C6B'], [.9, '#F7C57E']], -400, -900, W + 800, H + 1300);
    const st = starfield(L0, 160, 44, [-300, -800, 2500, 800]);
    const star = g(L0, { transform: 'translate(1180 240)' });
    glow(star, 0, 0, 420, '#FFD98A', .8);
    const sr = rays(star, 0, 0, 22, 520, '#FFE6A8', .25, .04, 12);
    el('path', { d: sparkleD(60), fill: '#FFF8E6' }, star);
    el('circle', { r: 12, fill: '#FFFFFF' }, star);
    glow(L0, 1300, 700, 700, '#FFC27A', .55);
    el('path', { d: ridge(hillPts(-500, 2500, 700, 120, 61, 260)), fill: '#9A6690' }, L1);
    el('path', { d: ridge(hillPts(-500, 2500, 760, 70, 62, 220)), fill: '#B97888' }, L1);
    // Jerusalén
    const city = g(L2);
    el('path', { d: 'M300,1100 C420,860 640,720 960,700 C1280,720 1520,860 1640,1100Z', fill: '#C99A68' }, city);
    const rc = rng(71);
    const surf = x => 1100 - 400 * Math.sqrt(clamp(1 - Math.pow((x - 960) / 660, 2)));
    const houseCols = ['#EBD3A8', '#E0C08E', '#F2DDB8', '#D9B584'];
    for (let row = 0; row < 6; row++) for (let x = 420 + (row % 2) * 34; x < 1520; x += 64 + rc() * 16) {
      const base = surf(x) + 34 + row * 56 + rc() * 10;
      if (base > 1085 || (row === 0 && Math.abs(x - 960) < 190)) continue;
      const w = 52 + rc() * 26, h = 38 + rc() * 34;
      el('rect', { x: f1(x - w / 2), y: f1(base - h), width: f1(w), height: f1(h), fill: houseCols[Math.floor(rc() * 4)] }, city);
      el('rect', { x: f1(x + w * .18), y: f1(base - h), width: f1(w * .32), height: f1(h), fill: '#7A4A3A', opacity: .16 }, city);
      el('rect', { x: f1(x - w / 2 - 2), y: f1(base - h - 5), width: f1(w + 4), height: 6, fill: '#C9A06A' }, city);
      if (rc() < .7) el('path', { d: `M${f1(x - 13)},${f1(base)} l0,-16 a7,7 0 0,1 14,0 l0,16Z`, fill: '#6B4A3A' }, city);
      if (rc() < .5) el('rect', { x: f1(x - w / 2 + 7), y: f1(base - h + 10), width: 8, height: 10, rx: 2, fill: '#6B4A3A' }, city);
      if (rc() < .12) cypress(city, f1(x + w / 2 + 6), f1(base), .35, '#3E6B48');
    }
    el('path', { d: 'M470,1010 L470,960 ' + Array.from({ length: 30 }, (_, i) => `L${480 + i * 33},${i % 2 ? 960 : 948} L${496 + i * 33},${i % 2 ? 960 : 948}`).join(' ') + ' L1470,960 L1470,1010Z', fill: '#D8B47F' }, city);
    const tp = g(city, { transform: 'translate(960 700)' });
    el('rect', { x: -170, y: -24, width: 340, height: 30, fill: '#E9D3AE' }, tp);
    el('rect', { x: -120, y: -150, width: 240, height: 128, fill: '#F4E6CB' }, tp);
    for (let i = 0; i < 6; i++) el('rect', { x: -104 + i * 40, y: -140, width: 14, height: 118, fill: '#E3CFA8' }, tp);
    el('path', { d: 'M-140,-150 L0,-200 L140,-150Z', fill: '#F5B83D' }, tp);
    el('rect', { x: -32, y: -90, width: 64, height: 68, fill: '#8C5A3C' }, tp);
    glow(tp, 0, -170, 190, '#FFD98A', .45);
    // Personajes
    const david = figure(L3, { x: 400, y: 1030, s: 1.6, skin: SKIN[1], robe: '#3E5BA9', mantle: '#E8505B', hair: '#8A4B2A', crown: true, belt: '#F5B83D', armR: 38 });
    hold(david, 'r', 38, h => {
      const hp = g(h, { transform: 'translate(8 -10)' });
      el('path', { d: 'M0,40 C-10,0 -10,-50 10,-70 C30,-60 44,-30 50,10 C40,24 20,36 0,40Z', fill: 'none', stroke: '#F5B83D', 'stroke-width': 7, 'stroke-linejoin': 'round' }, hp);
      for (let k = 0; k < 5; k++) el('path', { d: `M${6 + k * 8},${34 - k * 4} L${10 + k * 8},${-50 + k * 10}`, stroke: '#FFF3C4', 'stroke-width': 1.6 }, hp);
    });
    const notes = g(L3), noteList = [];
    for (let i = 0; i < 4; i++) {
      const n = g(notes);
      el('ellipse', { cx: 0, cy: 0, rx: 9, ry: 7, fill: '#FFF3C4', transform: 'rotate(-20)' }, n);
      el('rect', { x: 6, y: -34, width: 3.5, height: 34, fill: '#FFF3C4' }, n);
      noteList.push(n);
    }
    el('path', { d: ridge([[1150, 1100], [1300, 990], [1600, 960], [1900, 975], [2400, 990]]), fill: '#4A2F4E' }, L3);
    const prophets = [
      figure(L3, { x: 1470, y: 985, s: 1.15, skin: SKIN[2], robe: '#6A4A7E', veil: '#D9C9A8', beard: '#E8E4DC', longBeard: true, armR: 150, rim: '#FFB36B' }),
      figure(L3, { x: 1620, y: 972, s: 1.05, skin: SKIN[3], robe: '#3E6A7E', veil: '#C9B48A', beard: '#3A2418', armL: 30, rim: '#FFB36B' }),
      figure(L3, { x: 1760, y: 980, s: 1.1, skin: SKIN[1], robe: '#7E4A3E', hair: '#D8D2C8', beard: '#E8E4DC', longBeard: true, armR: 20, rim: '#FFB36B' }),
    ];
    hold(prophets[1], 'l', 30, h => {
      el('rect', { x: -26, y: -10, width: 52, height: 30, rx: 4, fill: '#F4E6CB' }, h);
      el('rect', { x: -32, y: -14, width: 10, height: 38, rx: 5, fill: '#D8B47F' }, h);
      el('rect', { x: 22, y: -14, width: 10, height: 38, rx: 5, fill: '#D8B47F' }, h);
    });
    const cam = camera([[L0, .45], [L1, .6], [L2, .85], [L3, 1]],
      [{ t: 0, x: 780, y: 720, s: 1.12 }, { t: 5.5, x: 1000, y: 640, s: 1.04 }, { t: 9.8, x: 1250, y: 520, s: 1.0 }, { t: 12, x: 1449, y: -127, s: 1.35, e: E.i }]);
    return lt => {
      cam(lt); st(lt);
      david.blink(lt); prophets.forEach(p => { p.blink(lt); p.lookAt(4, -5); });
      noteList.forEach((n, i) => {
        const u = ((lt * .35 + i * .25) % 1);
        tr(n, 470 + u * 160 + Math.sin(u * 8 + i) * 16, 820 - u * 240, .9);
        op(n, Math.sin(u * Math.PI) * (1 - P(lt, 5.5, 6.5)));
      });
      const k = P(lt, 5.4, 7.2, E.o);
      tr(star, 1180, 240, .5 + .5 * k + .05 * Math.sin(lt * 3));
      op(star, k);
      tr(sr, 0, 0, 1, lt * 5);
    };
  },
});
