// Escenas 9–13: Reforma y Trento, América y Guadalupe, era moderna, hoy y cierre.

function caravel(p, s, withFriar) {
  const G = g(p, { transform: `scale(${s})` });
  const sails = g(G);
  for (const [x, h, w] of [[-90, 170, 90], [10, 220, 120], [110, 150, 80]]) {
    el('rect', { x: x - 3, y: -h - 60, width: 6, height: h + 60, fill: '#5A3820' }, G);
    const sl = g(sails, { transform: `translate(${x} ${-h - 40})` });
    el('path', { d: `M${-w / 2},0 Q0,-14 ${w / 2},0 Q${w / 2 + 14},${h * .45} ${w / 2},${h * .85} Q0,${h * .85 - 16} ${-w / 2},${h * .85} Q${-w / 2 + 14},${h * .45} ${-w / 2},0Z`, fill: '#F4EEE4' }, sl);
    el('path', { d: `M0,${h * .2} L0,${h * .65} M${-w * .2},${h * .42} L${w * .2},${h * .42}`, stroke: '#C8323A', 'stroke-width': 12, 'stroke-linecap': 'round' }, sl);
    el('path', { d: `M0,${-20 - 12} l26,6 l-26,6Z`, fill: '#C8323A' }, sl);
  }
  if (withFriar) {
    const fr = figure(G, { x: -150, y: -34, s: .5, skin: SKIN[1], robe: '#6B4A30', veil: '#5A3C26', armR: 150 });
    hold(fr, 'r', 150, h => { el('rect', { x: -3, y: -60, width: 6, height: 60, fill: '#F5B83D' }, h); el('rect', { x: -16, y: -48, width: 32, height: 6, fill: '#F5B83D' }, h); });
  }
  el('path', { d: 'M-230,-60 L-170,-60 L-160,-34 L150,-34 L170,-70 L240,-70 C230,0 170,40 120,44 L-150,44 C-200,30 -226,-10 -230,-60Z', fill: '#7A4A2C' }, G);
  el('path', { d: 'M-230,-60 L-170,-60 L-160,-34 L150,-34 L170,-70 L240,-70 L238,-58 L172,-58 L156,-24 L-166,-24 L-178,-48 L-229,-48Z', fill: '#A8703E' }, G);
  for (const x of [-120, -60, 0, 60]) el('circle', { cx: x, cy: 0, r: 7, fill: '#3A2416' }, G);
  return G;
}

function nopal(p, x, y, s) {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  const pads = [[0, -40, 0], [-34, -100, -25], [30, -104, 22], [0, -160, 0], [-54, -160, -35]];
  for (const [px, py, r] of pads) {
    el('ellipse', { cx: px, cy: py, rx: 26, ry: 38, fill: '#4E9A5A', transform: `rotate(${r} ${px} ${py})` }, G);
    el('ellipse', { cx: px - 6, cy: py - 6, rx: 12, ry: 22, fill: '#6DB874', opacity: .5, transform: `rotate(${r} ${px} ${py})` }, G);
  }
  for (const [fx, fy] of [[0, -200], [-20, -196], [-60, -200], [44, -140]]) el('ellipse', { cx: fx, cy: fy, rx: 7, ry: 9, fill: '#D8467A' }, G);
  return G;
}
function maguey(p, x, y, s) {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  for (const a of [-70, -45, -20, 0, 20, 45, 70, -8, 8]) el('path', { d: 'M-12,0 Q-8,-90 0,-150 Q8,-90 12,0Z', fill: Math.abs(a) < 10 ? '#8CC4B8' : '#6FA8A0', transform: `rotate(${a})` }, G);
  return G;
}
function rose(p) {
  const G = g(p);
  el('circle', { r: 11, fill: '#D8324A' }, G);
  el('path', { d: 'M-5,-2 a5,5 0 1,1 8,4', stroke: '#9E1E34', 'stroke-width': 2.5, fill: 'none' }, G);
  el('ellipse', { cx: -10, cy: 8, rx: 7, ry: 3.5, fill: '#4E9A5A', transform: 'rotate(30 -10 8)' }, G);
  return G;
}

function guadalupe(p) {
  const G = g(p);
  glow(G, 0, -170, 360, '#FFD98A', .8);
  el('ellipse', { cx: 0, cy: -168, rx: 150, ry: 236, fill: '#FFE7A8', opacity: .55 }, G);
  const rg = g(G);
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * 6.283;
    const x0 = Math.cos(a) * 128, y0 = -168 + Math.sin(a) * 214;
    const L = i % 2 ? 60 : 92, x1 = Math.cos(a) * (128 + L * .7), y1 = -168 + Math.sin(a) * (214 + L);
    const nx = -Math.sin(a) * 7, ny = Math.cos(a) * 7;
    el('path', { d: `M${f1(x0 + nx)},${f1(y0 + ny)} L${f1(x1)},${f1(y1)} L${f1(x0 - nx)},${f1(y0 - ny)}Z`, fill: '#F5B83D' }, rg);
  }
  el('path', { d: 'M-52,0 C-56,-80 -48,-170 -30,-236 Q0,-250 30,-236 C48,-170 56,-80 52,0Z', fill: '#E7A09A' }, G);
  const rf = rng(171);
  for (let i = 0; i < 14; i++) el('circle', { cx: f1(-30 + rf() * 60), cy: f1(-20 - rf() * 190), r: 3.5, fill: '#F5C84D' }, G);
  el('path', { d: 'M-36,-300 C-68,-296 -82,-250 -84,-200 C-90,-120 -88,-50 -74,6 L-40,6 C-52,-60 -52,-150 -32,-228 Q0,-242 32,-228 C52,-150 52,-60 40,6 L74,6 C88,-50 90,-120 84,-200 C82,-250 68,-296 36,-300 Q0,-314 -36,-300Z', fill: '#2F8C84', stroke: '#F5C84D', 'stroke-width': 5 }, G);
  for (let i = 0; i < 12; i++) {
    const sx = i % 2 ? -66 + rf() * 20 : 46 + rf() * 20, sy = -260 + i * 20;
    el('path', { d: sparkleD(7), fill: '#F5C84D', transform: `translate(${f1(sx)} ${f1(sy)})` }, G);
  }
  const head = g(G, { transform: 'rotate(-8 0 -262)' });
  el('path', { d: 'M-24,-264 C-26,-240 -20,-226 -16,-222 L16,-222 C20,-226 26,-240 24,-264Z', fill: '#2A1A14' }, head);
  el('circle', { cx: 0, cy: -262, r: 24, fill: '#C98C60' }, head);
  el('path', { d: 'M-12,-262 q4,3 8,0 M4,-262 q4,3 8,0', stroke: '#2A1A14', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, head);
  el('path', { d: 'M-30,-268 C-32,-298 32,-298 30,-268 C24,-288 -24,-288 -30,-268Z', fill: '#2F8C84', stroke: '#F5C84D', 'stroke-width': 4 }, head);
  el('path', { d: 'M-9,-176 C-11,-190 -6,-206 0,-212 C6,-206 11,-190 9,-176Z', fill: '#C98C60' }, G);
  el('path', { d: 'M-90,4 C-70,44 70,44 90,4 C56,24 -56,24 -90,4Z', fill: '#2A2A40' }, G);
  return { g: G, rays: rg };
}

// 9 · Reforma y Concilio de Trento
addScene({
  id: 'reforma', dur: 12,
  chapter: { n: 9, title: 'REFORMA Y TRENTO', year: 'Siglo XVI' },
  captions: [
    { a: .6, b: 5.2, text: '*1517*: la Reforma protestante divide a la cristiandad de Occidente.' },
    { a: 5.9, b: 11.6, text: 'La Iglesia responde con el *Concilio de Trento* y una generación de grandes *santos*.' },
  ],
  build(root) {
    const A = g(root), A0 = g(A);
    el('rect', { x: -400, y: -400, width: 2800, height: 1900, fill: '#B9A98F' }, A0);
    const rs = rng(181);
    for (let r = 0; r < 22; r++) for (let i = 0; i < 16; i++) el('rect', { x: -400 + i * 180 + (r % 2) * 90, y: -400 + r * 80, width: 172, height: 72, rx: 6, fill: rs() < .5 ? '#AE9E84' : '#C3B399' }, A0);
    el('path', { d: 'M520,1200 L520,420 A440,440 0 0,1 1400,420 L1400,1200Z', fill: '#8C7C66' }, A0);
    el('path', { d: 'M580,1200 L580,440 A380,380 0 0,1 1340,440 L1340,1200Z', fill: '#6B4428' }, A0);
    for (let i = 1; i < 8; i++) el('rect', { x: 580 + i * 95, y: 60, width: 5, height: 1200, fill: '#553418' }, A0);
    for (const y of [380, 820]) {
      el('rect', { x: 590, y, width: 740, height: 30, fill: '#2A2226' }, A0);
      for (let i = 0; i < 9; i++) el('circle', { cx: 620 + i * 85, cy: y + 15, r: 6, fill: '#57505A' }, A0);
    }
    el('circle', { cx: 1250, cy: 640, r: 34, fill: 'none', stroke: '#2A2226', 'stroke-width': 9 }, A0);
    const cracks = [
      'M860,420 L800,360 L760,300 L690,270 L640,190',
      'M1070,440 L1130,380 L1170,390 L1230,320 L1300,280',
      'M880,700 L820,760 L840,820 L780,900 L720,960',
      'M1060,700 L1120,770 L1100,840 L1170,900 L1240,990',
      'M640,190 L560,150 L480,160 L380,100',
      'M1300,280 L1400,250 L1480,190 L1560,170',
    ].map(d => el('path', { d, stroke: '#2A1A14', 'stroke-width': 6, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, A0));
    const paper = g(A0);
    el('rect', { x: -115, y: -150, width: 230, height: 300, rx: 4, fill: '#F4EEE4' }, paper);
    el('path', { d: 'M115,-150 L115,110 L80,150 L-115,150 L-115,-150Z', fill: '#000', opacity: .06 }, paper);
    label(paper, 0, -92, '95', 50, '#3A2A22', 2);
    label(paper, 0, -58, 'TESIS', 22, '#3A2A22', 4);
    for (let k = 0; k < 7; k++) el('rect', { x: -84, y: -30 + k * 22, width: 168 - (k % 3) * 30, height: 6, rx: 3, fill: '#B9A98F' }, paper);
    el('circle', { cx: 0, cy: -132, r: 7, fill: '#4A4450' }, paper);
    const hammer = g(A0);
    el('rect', { x: -8, y: 0, width: 16, height: 170, rx: 6, fill: '#8A5A36' }, hammer);
    el('rect', { x: -40, y: -24, width: 80, height: 40, rx: 6, fill: '#57505A' }, hammer);

    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    el('rect', { x: -400, y: -400, width: 2800, height: 1900, fill: lin([[0, '#E9D6B8'], [1, '#D6B88E']]) }, B0);
    for (let i = 0; i < 5; i++) {
      const x = 160 + i * 400;
      el('path', { d: `M${x - 150},820 L${x - 150},300 A150,150 0 0,1 ${x + 150},300 L${x + 150},820Z`, fill: '#C8A57A' }, B0);
      el('path', { d: `M${x - 120},820 L${x - 120},310 A120,120 0 0,1 ${x + 120},310 L${x + 120},820Z`, fill: '#B8906A' }, B0);
      el('path', { d: `M${x - 120},300 C${x - 60},360 ${x + 60},360 ${x + 120},300 L${x + 120},520 C${x + 90},460 ${x + 60},420 ${x + 40},400 C${x},430 ${x - 40},400 ${x - 40},400 C${x - 60},420 ${x - 90},460 ${x - 120},520Z`, fill: '#A8323A' }, B0);
    }
    el('rect', { x: -400, y: 800, width: 2800, height: 700, fill: '#8A5A3C' }, B0);
    el('path', { d: 'M880,800 L1040,800 L1300,1200 L620,1200Z', fill: '#A8323A' }, B0);
    const seated = [];
    const sr = rng(191);
    for (const [y, s, n] of [[700, .56, 7], [760, .68, 6]]) for (let side = -1; side <= 1; side += 2) for (let i = 0; i < n; i++) {
      const x = 960 + side * (220 + i * 70 * (s / .56));
      seated.push(figure(B1, { x, y, s, skin: SKIN[Math.floor(sr() * 6)], robe: sr() < .3 ? '#B8282E' : '#F4EEE4', stole: '#F5B83D', mitre: '#F4EEE4', beard: sr() < .4 ? '#D8D2C8' : null, look: -side * .8 }));
    }
    const tbl = g(B1, { transform: 'translate(960 800)' });
    el('rect', { x: -170, y: -70, width: 340, height: 70, fill: '#8E2A34' }, tbl);
    el('rect', { x: -170, y: -76, width: 340, height: 12, fill: '#F5B83D' }, tbl);
    const book = g(tbl, { transform: 'translate(0 -80)' });
    glow(book, 0, -10, 150, '#FFE6A8', .8);
    el('path', { d: 'M-70,0 L-6,-10 L0,0 L6,-10 L70,0 L70,-40 L6,-52 L0,-42 L-6,-52 L-70,-40Z', fill: '#FFF6E6' }, book);
    el('path', { d: 'M100,-80 L100,-190 M78,-160 L122,-160', stroke: '#F5B83D', 'stroke-width': 8, 'stroke-linecap': 'round' }, tbl);
    const ign = figure(B2, { x: 470, y: 905, s: 1.35, skin: SKIN[1], robe: '#23232E', hairStyle: 'none', beard: '#2A1A14', halo: true, armR: 30, look: .5 });
    hold(ign, 'r', 30, h => { el('rect', { x: -18, y: -26, width: 36, height: 30, rx: 3, fill: '#8C2A2A' }, h); el('rect', { x: -14, y: -22, width: 28, height: 22, fill: '#F4E6CB' }, h); });
    const ter = figure(B2, { x: 1430, y: 905, s: 1.32, skin: SKIN[0], robe: '#6B4A30', mantle: '#F4EEE4', veil: '#1E1A20', halo: true, armL: 30, look: -.5 });
    hold(ter, 'l', 30, h => { el('rect', { x: -4, y: -48, width: 8, height: 52, fill: '#F4E6CB' }, h); el('path', { d: 'M0,-48 l10,-12', stroke: '#F4E6CB', 'stroke-width': 4 }, h); });
    const carlo = figure(B2, { x: 1640, y: 920, s: 1.25, skin: SKIN[0], robe: '#B8282E', cape: '#B8282E', hair: '#3A2418', zucchetto: '#B8282E', cross: '#F5B83D', halo: true, look: -.6 });
    const saints = [ign, ter, carlo];

    const camA = camera([[A0, 1]], [{ t: 0, x: 960, y: 560, s: 1.0 }, { t: 5.8, x: 960, y: 520, s: 1.1 }]);
    const camB = camera([[B0, .4], [B1, .8], [B2, 1]], [{ t: 5.2, x: 960, y: 580, s: 1.1 }, { t: 12, x: 960, y: 560, s: 1.0 }]);
    return lt => {
      const kB = shotFade(lt, 5.2, 5.9);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        const hits = [1.3, 1.75, 2.2];
        let shake = 0;
        for (const h of hits) shake += Math.max(0, 1 - Math.abs(lt - h) / .12) * (lt > h ? 1 : 0);
        const c = camAt([{ t: 0, x: 960, y: 560, s: 1.0 }, { t: 5.8, x: 960, y: 520, s: 1.1 }], lt);
        camApply(A0, c, 1, Math.sin(lt * 90) * 6 * shake, Math.cos(lt * 70) * 5 * shake);
        const k = P(lt, .4, 1.1, E.o);
        tr(paper, 960 + 300 * (1 - k), 560, 1, 14 * (1 - k));
        op(paper, k);
        let sw = 0;
        for (const h of hits) sw = Math.max(sw, pulse(lt, h - .22, h + .18, .2, .18));
        tr(hammer, 1020 + 60 * (1 - sw), 400 - 10 * sw, 1, -40 + 70 * sw);
        op(hammer, P(lt, .9, 1.1) * (1 - P(lt, 2.4, 2.7)));
        cracks.forEach((cr, i) => drawStroke(cr, 360, P(lt, 2.5 + (i % 4) * .25, 4 + (i % 4) * .25, E.o)));
      }
      if (kB > 0) {
        camB(lt);
        seated.forEach(f => f.blink(lt));
        saints.forEach((s, i) => { s.blink(lt); op(s.g, P(lt, 7.6 + i * .3, 8.4 + i * .3)); tr(s.g, [470, 1430, 1640][i], [905, 905, 920][i] + 30 * (1 - P(lt, 7.6 + i * .3, 8.4 + i * .3, E.back)), [1.35, 1.32, 1.25][i]); });
      }
    };
  },
});

// 10 · América y Guadalupe
addScene({
  id: 'america', dur: 14,
  chapter: { n: 10, title: 'AMÉRICA', year: 'Siglo XVI' },
  captions: [
    { a: .5, b: 5.6, text: 'Misioneros llevaron el *Evangelio* al Nuevo Mundo.' },
    { a: 6.4, b: 13.4, text: '*1531*: la Virgen de Guadalupe se aparece a san Juan Diego en el Tepeyac, México.' },
  ],
  build(root) {
    const A = g(root), A0 = g(A), A1 = g(A), A2 = g(A);
    sky(A0, [[0, '#2A3A7A'], [.5, '#E0806A'], [.66, '#F7C07A']]);
    const sun = g(A0);
    glow(sun, 1480, 600, 560, '#FFD08A', .95);
    el('circle', { cx: 1480, cy: 600, r: 90, fill: '#FFE7B0' }, sun);
    cloud(A0, 420, 200, 1.4, '#F2A58A', .7); cloud(A0, 1100, 140, 1.1, '#F2A58A', .6);
    const coast = g(A0);
    el('path', { d: 'M1700,610 C1760,540 1900,520 2100,560 L2300,610Z', fill: '#6A5A8A' }, coast);
    for (const x of [1800, 1870, 1960]) palm(coast, x, 590, .45, '#4A4A7A', '#4A4A7A');
    const seaB = el('path', { fill: '#3A5E9A' }, A1);
    const refl = g(A1);
    for (let i = 0; i < 7; i++) el('rect', { x: 1400 - i * 12, y: 628 + i * 30, width: 160 + i * 24, height: 7, rx: 3.5, fill: '#FFD08A', opacity: .55 - i * .05 }, refl);
    const ships = [[.62, false, 0], [.8, false, 1], [1.05, true, 2]].map(([s, fr, i]) => ({ g: caravel(A1, s, fr), s, i }));
    const seaM = el('path', { fill: '#2F7FB0' }, A1);
    const seaF = el('path', { fill: '#3FA3C8' }, A2);
    const foam = el('path', { fill: 'none', stroke: '#BDEBF2', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .8 }, A2);
    const birds = [bird(A0, '#3A2A4A'), bird(A0, '#3A2A4A')];

    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    sky(B0, [[0, '#35448E'], [.45, '#E68AA0'], [.72, '#FFD39A']]);
    glow(B0, 1100, 640, 700, '#FFE0A0', .8);
    el('path', { d: ridge(hillPts(-500, 2500, 640, 120, 201, 260)), fill: '#B98AA0' }, B1);
    el('path', { d: ridge(hillPts(-500, 2500, 720, 70, 202, 220)), fill: '#9E9A7A' }, B1);
    el('path', { d: 'M-500,1100 C0,860 400,760 760,740 C1100,720 1500,780 1900,900 C2200,980 2400,1040 2500,1100Z', fill: '#7E9A5A' }, B2);
    el('path', { d: 'M-500,1100 C200,960 700,930 1100,940 C1500,950 2000,1000 2500,1100Z', fill: '#6E8A4A' }, B2);
    for (const [x, y, s] of [[180, 900, 1.1], [1640, 930, 1.2], [1800, 960, .9]]) nopal(B2, x, y, s);
    for (const [x, y, s] of [[360, 930, .8], [1500, 960, .9], [80, 1010, 1]]) maguey(B2, x, y, s);
    const vg = guadalupe(B2);
    vg.g.setAttribute('transform', 'translate(1110 890) scale(1.45)');
    const jd = figure(B2, { x: 700, y: 905, s: 1.3, skin: SKIN[3], robe: '#F4EEE4', hair: '#1E1410', armL: 60, armR: 60, look: 1 });
    jd.g.setAttribute('transform', 'translate(700 905) scale(1.3 1.12)');
    const tilma = g(B2);
    el('path', { d: 'M626,812 L774,812 L792,905 L608,905Z', fill: '#E4CFA0' }, tilma);
    el('path', { d: 'M700,812 L774,812 L792,905 L700,905Z', fill: '#000', opacity: .06 }, tilma);
    for (const [x, y] of [[660, 840], [700, 860], [742, 842], [676, 884], [728, 886]]) { const r = rose(tilma); r.setAttribute('transform', `translate(${x} ${y}) scale(.9)`); }
    const falling = [], rr = rng(211);
    for (let i = 0; i < 16; i++) { const r = rose(B2); falling.push({ e: r, x: 640 + rr() * 120, t0: 9 + rr() * 3.4, v: 120 + rr() * 80, rot: rr() * 360 }); }
    const petals = [], rp = rng(223);
    for (let i = 0; i < 30; i++) petals.push({ e: el('ellipse', { rx: 7, ry: 4, fill: i % 3 ? '#D8324A' : '#F07A90' }, B2), x: rp() * 2200 - 100, y: rp() * 1200, v: 50 + rp() * 70, ph: rp() * 6 });

    const camA = camera([[A0, .2], [A1, .8], [A2, 1]], [{ t: 0, x: 900, y: 560, s: 1.06 }, { t: 6.4, x: 1000, y: 540, s: 1.0 }]);
    const camB = camera([[B0, .2], [B1, .5], [B2, 1]], [{ t: 5.8, x: 1000, y: 640, s: 1.14 }, { t: 14, x: 960, y: 570, s: 1.0 }]);
    return lt => {
      const kB = shotFade(lt, 5.8, 6.5);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        camA(lt);
        seaB.setAttribute('d', ridge(wavePts(-500, 2500, 620, 6, 300, lt * 1.5, 40)));
        seaM.setAttribute('d', ridge(wavePts(-500, 2500, 760, 12, 340, -lt * 1.8, 40)));
        seaF.setAttribute('d', ridge(wavePts(-500, 2500, 900, 16, 280, lt * 2.2, 30)));
        foam.setAttribute('d', smooth(wavePts(-500, 2500, 905, 16, 280, lt * 2.2, 30)));
        for (const sh of ships) {
          const bx = [300, 760, 1060][sh.i] + lt * 36, by = [680, 745, 850][sh.i];
          sh.g.setAttribute('transform', `translate(${f1(bx)} ${f1(by + Math.sin(lt * 1.6 + sh.i) * 6)}) rotate(${f1(Math.sin(lt * 1.3 + sh.i) * 2)}) scale(${sh.s})`);
        }
        birds.forEach((b, i) => b(200 + lt * 80 + i * 70, 260 + i * 30, lt, .9, i));
      }
      if (kB > 0) {
        camB(lt);
        const k = P(lt, 6.6, 8.2, E.o);
        op(vg.g, k);
        vg.g.setAttribute('transform', `translate(1110 ${f1(890 + 30 * (1 - k))}) scale(${f1((1.3 + .15 * k) * 1000) / 1000})`);
        vg.rays.setAttribute('opacity', (.8 + .2 * Math.sin(lt * 3)).toFixed(2));
        jd.blink(lt); jd.lookAt(5, -4);
        for (const f of falling) {
          const u = lt - f.t0;
          if (u < 0) { f.e.style.display = 'none'; continue; }
          f.e.style.display = '';
          f.e.setAttribute('transform', `translate(${f1(f.x + Math.sin(u * 3) * 10)} ${f1(880 + u * f.v + u * u * 60)}) rotate(${f1(f.rot + u * 90)})`);
          op(f.e, 1 - P(u, 1.2, 1.8));
        }
        for (const p of petals) {
          const y = (p.y + lt * p.v) % 1300 - 100, x = p.x + Math.sin(lt * .8 + p.ph) * 40 - lt * 10;
          p.e.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1(lt * 60 + p.ph * 50)})`);
          op(p.e, P(lt, 8.4, 9.4) * .85);
        }
      }
    };
  },
});

// 11 · Era moderna
function basilica(p, s, withLoggia) {
  const G = g(p, { transform: `scale(${s})` });
  const dome = g(G);
  el('rect', { x: -150, y: -560, width: 300, height: 110, fill: '#E3D0AC' }, dome);
  for (let i = 0; i < 9; i++) el('rect', { x: -140 + i * 34, y: -552, width: 10, height: 96, fill: '#F2E4C8' }, dome);
  el('path', { d: 'M-165,-560 C-165,-760 165,-760 165,-560Z', fill: '#AFC0CC' }, dome);
  for (const x of [-110, -55, 0, 55, 110]) el('path', { d: `M${x},-560 C${x * .8},-650 ${x * .4},-700 0,-710`, stroke: '#8FA2B0', 'stroke-width': 6, fill: 'none' }, dome);
  el('rect', { x: -22, y: -770, width: 44, height: 60, fill: '#E3D0AC' }, dome);
  el('path', { d: 'M-26,-770 C-26,-800 26,-800 26,-770Z', fill: '#AFC0CC' }, dome);
  el('path', { d: 'M0,-800 L0,-840 M-12,-826 L12,-826', stroke: '#F5B83D', 'stroke-width': 6, 'stroke-linecap': 'round' }, dome);
  el('rect', { x: -420, y: -380, width: 840, height: 380, fill: '#EAD8B8' }, G);
  el('rect', { x: -440, y: -420, width: 880, height: 48, fill: '#E0CBA4' }, G);
  for (let i = 0; i < 17; i++) el('circle', { cx: -420 + i * 52.5, cy: -436, r: 10, fill: '#D8C298' }, G);
  el('path', { d: 'M-150,-380 L0,-450 L150,-380Z', fill: '#E0CBA4' }, G);
  for (let i = 0; i < 10; i++) {
    const x = -390 + i * 86;
    el('rect', { x, y: -370, width: 34, height: 370, fill: '#F6E9CF' }, G);
    el('rect', { x: x + 22, y: -370, width: 12, height: 370, fill: '#000', opacity: .06 }, G);
  }
  const doors = [];
  for (const x of [-258, -86, 86, 258]) doors.push(el('path', { d: `M${x - 30},0 L${x - 30},-120 A30,30 0 0,1 ${x + 30},-120 L${x + 30},0Z`, fill: '#5A3A2A' }, G));
  const loggia = g(G, { transform: 'translate(0 -250)' });
  el('path', { d: 'M-48,50 L-48,-40 A48,48 0 0,1 48,-40 L48,50Z', fill: '#3A2A28' }, loggia);
  el('path', { d: 'M-60,50 L60,50 L50,110 L-50,110Z', fill: '#A8323A' }, loggia);
  el('rect', { x: -64, y: 44, width: 128, height: 10, fill: '#F5B83D' }, loggia);
  el('rect', { x: -420, y: -8, width: 840, height: 8, fill: '#D8C298' }, G);
  return { g: G, loggia };
}
function colonnade(p, sgn) {
  const d = `M${sgn * 400},-10 C${sgn * 620},-10 ${sgn * 860},40 ${sgn * 980},210`;
  el('path', { d, stroke: '#E9D6B4', 'stroke-width': 110, fill: 'none' }, p);
  el('path', { d, stroke: '#CDB48C', 'stroke-width': 86, 'stroke-dasharray': '12 22', fill: 'none' }, p);
  el('path', { d: `M${sgn * 400},-66 C${sgn * 620},-66 ${sgn * 880},-16 ${sgn * 1010},154`, stroke: '#D8C298', 'stroke-width': 14, fill: 'none' }, p);
}
function obelisk(p, x, y, s) {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  el('rect', { x: -40, y: -30, width: 80, height: 30, fill: '#D8C298' }, G);
  el('path', { d: 'M-26,-30 L-18,-420 L18,-420 L26,-30Z', fill: '#E9D6B4' }, G);
  el('path', { d: 'M0,-30 L0,-420 L18,-420 L26,-30Z', fill: '#000', opacity: .08 }, G);
  el('path', { d: 'M-18,-420 L0,-450 L18,-420Z', fill: '#D8C298' }, G);
  el('path', { d: 'M0,-450 L0,-480 M-10,-468 L10,-468', stroke: '#F5B83D', 'stroke-width': 5, 'stroke-linecap': 'round' }, G);
  return G;
}

addScene({
  id: 'moderna', dur: 14,
  chapter: { n: 11, title: 'ERA MODERNA', year: 'Siglos XIX – XX' },
  captions: [
    { a: .5, b: 6.6, text: 'Los concilios *Vaticano I* y *Vaticano II* guiaron a la Iglesia en el mundo moderno.' },
    { a: 7.4, b: 13.4, text: 'San *Juan Pablo II* llevó el Evangelio a todos los rincones del planeta.' },
  ],
  build(root) {
    const A = g(root), A0 = g(A), A1 = g(A), A2 = g(A);
    sky(A0, [[0, '#4F8FD6'], [.6, '#A7D6EE'], [1, '#F3E3C0']]);
    cloud(A0, 380, 330, 1.1, '#FFFFFF', .8); cloud(A0, 1600, 150, 1, '#FFFFFF', .75);
    el('rect', { x: -500, y: 790, width: 2900, height: 700, fill: '#D8C6A4' }, A1);
    for (let i = -8; i <= 8; i++) el('path', { d: `M960,1000 L${960 + i * 260},${i % 2 ? 1500 : 760}`, stroke: '#C8B48E', 'stroke-width': 5 }, A1);
    const bas = basilica(A1, .92);
    bas.g.setAttribute('transform', 'translate(960 800) scale(.85)');
    const cl = g(A1, { transform: 'translate(960 808) scale(.9)' });
    colonnade(cl, -1); colonnade(cl, 1);
    const pro = [], rp = rng(231);
    for (let i = 0; i < 24; i++) pro.push({ f: figure(A2, { x: 0, y: 0, s: 1, skin: SKIN[Math.floor(rp() * 6)], robe: '#F4EEE4', mantle: i % 4 === 0 ? '#C8423B' : null, stole: '#F5B83D', mitre: '#F4EEE4' }), side: i % 2 ? 1 : -1, off: Math.floor(i / 2) * .085 });
    obelisk(A2, 960, 1070, .8);

    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    sky(B0, [[0, '#0A1234'], [1, '#1E2A66']]);
    const stB = starfield(B0, 220, 241);
    const GX = 1260, GY = 520, GR = 330;
    const disc = `M${GX - GR},${GY}a${GR},${GR} 0 1,0 ${2 * GR},0a${GR},${GR} 0 1,0 ${-2 * GR},0Z`;
    glow(B1, GX, GY, GR + 150, '#58C6FF', .5);
    el('path', { d: disc, fill: rad([[0, '#3A8EE0'], [.7, '#1F5AAE'], [1, '#0F3470']], .4, .35, .75) }, B1);
    const land = g(B1, { 'clip-path': clip(disc) });
    const landMove = g(land);
    const rl = rng(247);
    for (let i = 0; i < 12; i++) {
      const cx = GX - 700 + i * 150 + rl() * 60, cy = GY - 250 + rl() * 500, pts = [];
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, rr = 40 + rl() * 70; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.2]); }
      const d = smooth(pts, true);
      el('path', { d, fill: i % 2 ? '#4DB36F' : '#6CC57C' }, landMove);
      el('path', { d, fill: i % 2 ? '#4DB36F' : '#6CC57C', transform: 'translate(1800 0)' }, landMove);
    }
    const mer = g(land);
    el('path', { d: disc, fill: rad([[0, '#000', 0], [.75, '#000', .05], [1, '#000', .35]], .4, .35, .75) }, B1);
    el('path', { d: disc, fill: 'none', stroke: '#9BE6FF', 'stroke-width': 5, opacity: .7 }, B1);
    const merLines = [];
    for (let i = 0; i < 6; i++) merLines.push(el('ellipse', { cx: GX, cy: GY, ry: GR, fill: 'none', stroke: '#BFEFFF', 'stroke-width': 2, opacity: .25 }, mer));
    for (const k of [-.6, -.3, 0, .3, .6]) el('ellipse', { cx: GX, cy: GY + k * GR, rx: GR * Math.sqrt(1 - k * k), ry: 14 * Math.sqrt(1 - k * k), fill: 'none', stroke: '#BFEFFF', 'stroke-width': 2, opacity: .25 }, mer);
    const rome = [GX - 40, GY - 150];
    const dests = [[GX - 230, GY + 60], [GX - 170, GY + 230], [GX + 120, GY + 200], [GX + 230, GY - 20], [GX + 120, GY - 230], [GX - 120, GY - 260], [GX + 20, GY + 60], [GX - 270, GY - 120]];
    const arcs = dests.map(([x, y], i) => {
      const mx = (rome[0] + x) / 2, my = (rome[1] + y) / 2 - 110 - i * 8;
      const path = el('path', { d: `M${rome[0]},${rome[1]} Q${mx},${my} ${x},${y}`, stroke: '#FFD76A', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, B1);
      const dot = el('circle', { cx: x, cy: y, r: 9, fill: '#FFD76A' }, B1);
      return { path, dot, len: path.getTotalLength(), t0: 7.8 + i * .45 };
    });
    el('circle', { cx: rome[0], cy: rome[1], r: 12, fill: '#FFFFFF' }, B1);
    glow(B1, rome[0], rome[1], 60, '#FFFFFF', .7);
    const plane = el('path', { d: 'M-16,0 L10,-4 L16,0 L10,4Z M-2,0 L-8,-14 L2,-14 L6,0 L2,14 L-8,14Z', fill: '#FFFFFF' }, B1);
    const jp = figure(B2, { x: 480, y: 1000, s: 1.75, skin: SKIN[0], robe: '#F7F4EE', cape: '#F7F4EE', zucchetto: '#FFFFFF', hair: '#D8D2C8', cross: '#F5B83D', armR: 140, armL: 14, halo: true });
    hold(jp, 'l', 14, h => {
      el('rect', { x: -4, y: -200, width: 8, height: 300, fill: '#C9CED8' }, h);
      el('rect', { x: -22, y: -186, width: 44, height: 8, fill: '#C9CED8' }, h);
      el('rect', { x: -4, y: -214, width: 8, height: 40, fill: '#C9CED8' }, h);
    });

    const camA = camera([[A0, .2], [A1, .9], [A2, 1]], [{ t: 0, x: 960, y: 500, s: 1.0 }, { t: 7.2, x: 960, y: 530, s: 1.06 }]);
    const camB = camera([[B0, .2], [B1, 1], [B2, 1]], [{ t: 6.8, x: 960, y: 560, s: 1.08 }, { t: 14, x: 980, y: 540, s: 1.0 }]);
    return lt => {
      const kB = shotFade(lt, 6.9, 7.6);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        camA(lt);
        for (const p of pro) {
          const u = clamp((lt * .09 + p.off) % 1);
          const x = 960 + p.side * lerp(560, 40, u), y = lerp(1080, 805, Math.pow(u, .8));
          const s = lerp(.95, .32, Math.pow(u, .7));
          tr(p.f.g, x, y - Math.abs(Math.sin(lt * 5 + p.off * 20)) * 4 * s, s);
          op(p.f.g, 1 - P(u, .88, 1));
          p.f.blink(lt);
        }
      }
      if (kB > 0) {
        camB(lt); stB(lt);
        tr(landMove, -((lt * 40) % 1800), 0);
        merLines.forEach((m, i) => { const ph = ((i / 6 + lt * .04) % 1) * Math.PI; m.setAttribute('rx', f1(Math.abs(Math.cos(ph)) * GR)); });
        for (const a of arcs) { drawStroke(a.path, a.len, P(lt, a.t0, a.t0 + 1.1, E.io)); op(a.dot, P(lt, a.t0 + .9, a.t0 + 1.2)); }
        const a0 = arcs[3], u = P(lt, 7.8, 13.5, E.sine);
        const q = a0.path.getPointAtLength(a0.len * u), q2 = a0.path.getPointAtLength(Math.min(a0.len, a0.len * u + 2));
        plane.setAttribute('transform', `translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(Math.atan2(q2.y - q.y, q2.x - q.x) * 57.3)}) scale(1.4)`);
        op(plane, P(lt, 7.8, 8.2) * (1 - P(lt, 13.2, 13.6)));
        jp.blink(lt);
        jp.setArm('r', 140 + Math.sin(lt * 4) * 14);
      }
    };
  },
});

// 12 · Hoy
addScene({
  id: 'hoy', dur: 13,
  chapter: { n: 12, title: 'HOY', year: 'Siglo XXI' },
  captions: [
    { a: .5, b: 6.2, text: 'Hoy, más de *1.400 millones* de católicos viven su fe en todo el mundo.' },
    { a: 6.6, b: 12.6, text: 'Con el Papa *León XIV*, la Iglesia sigue caminando.' },
  ],
  build(root) {
    const L0 = g(root), L1 = g(root), L2 = g(root);
    sky(L0, [[0, '#3E5EA8'], [.5, '#E8927A'], [.72, '#FFD08A']], -400, -600, W + 800, H + 1000);
    glow(L0, 1500, 560, 600, '#FFE0A0', .8);
    cloud(L0, 300, 120, 1.2, '#F7B8A0', .7); cloud(L0, 1650, 90, 1, '#F7B8A0', .6);
    el('rect', { x: -500, y: 740, width: 2900, height: 800, fill: '#D9BE98' }, L1);
    const bas = basilica(L1, 1.02);
    bas.g.setAttribute('transform', 'translate(960 760) scale(1.02)');
    const cl = g(L1, { transform: 'translate(960 770) scale(1.02)' });
    colonnade(cl, -1); colonnade(cl, 1);
    const sis = g(L1, { transform: 'translate(1680 520)' });
    el('rect', { x: -110, y: -60, width: 220, height: 240, fill: '#D6B88E' }, sis);
    el('path', { d: 'M-120,-60 L0,-110 L120,-60Z', fill: '#B5543F' }, sis);
    el('rect', { x: 30, y: -150, width: 16, height: 70, fill: '#8C8A96' }, sis);
    const smoke = [];
    for (let i = 0; i < 18; i++) smoke.push({ e: el('circle', { r: 20, fill: '#FFFFFF' }, L1), t0: i * .38 });
    const pope = figure(L1, { x: 960, y: 560, s: .8, skin: SKIN[0], robe: '#FFFFFF', cape: '#F4F1EA', zucchetto: '#FFFFFF', hair: '#8A7A6A', cross: '#F5B83D', armR: 140, armL: 30 });
    const loggiaFront = g(L1, { transform: 'translate(960 505) scale(1.02)' });
    el('path', { d: 'M-60,0 L60,0 L50,60 L-50,60Z', fill: '#A8323A' }, loggiaFront);
    el('rect', { x: -64, y: -6, width: 128, height: 10, fill: '#F5B83D' }, loggiaFront);
    el('path', { d: 'M-12,14 L-12,46 M12,14 L12,46 M-26,26 L26,26', stroke: '#F5B83D', 'stroke-width': 0 }, loggiaFront);
    const crowd = g(L2), heads = [], rc = rng(261);
    const cols = ['#E8505B', '#F2C14E', '#3FA7D6', '#8E6CC4', '#E07A5F', '#5CC27A', '#F4EEE4', '#2A2A40', '#F29E4C'];
    for (let row = 0; row < 16; row++) {
      const y = 820 + row * 20 + row * row * .9, s = .35 + row * .06;
      for (let x = -80 + (row % 2) * 20; x < 2000; x += 38 * s + rc() * 10) {
        if (Math.abs(x - 960) < 60 && row < 10) continue;
        const hg = g(crowd, { transform: `translate(${f1(x)} ${f1(y)}) scale(${f1(s * 100) / 100})` });
        el('path', { d: 'M-26,60 C-28,20 -20,0 0,0 C20,0 28,20 26,60Z', fill: cols[Math.floor(rc() * cols.length)] }, hg);
        el('circle', { cx: 0, cy: -12, r: 17, fill: SKIN[Math.floor(rc() * 6)] }, hg);
        el('path', { d: 'M-17,-14 C-18,-32 18,-32 17,-14 C12,-22 -12,-22 -17,-14Z', fill: ['#1E1410', '#3A2418', '#6B4A2A', '#C9A06A'][Math.floor(rc() * 4)] }, hg);
        heads.push({ e: hg, x, y, s, ph: rc() * 6 });
      }
    }
    const flags = [];
    const flagDefs = [
      fl => { ['#006847', '#FFFFFF', '#CE1126'].forEach((c, k) => el('rect', { x: k * 30, y: 0, width: 30, height: 60, fill: c }, fl)); el('circle', { cx: 45, cy: 30, r: 8, fill: '#8A5A2A' }, fl); },
      fl => { ['#FFE000', '#FFFFFF'].forEach((c, k) => el('rect', { x: k * 45, y: 0, width: 45, height: 60, fill: c }, fl)); el('circle', { cx: 67, cy: 30, r: 7, fill: '#F5B83D' }, fl); },
      fl => { el('rect', { width: 90, height: 60, fill: '#009B3A' }, fl); el('path', { d: 'M45,8 L82,30 L45,52 L8,30Z', fill: '#FEDF00' }, fl); el('circle', { cx: 45, cy: 30, r: 12, fill: '#002776' }, fl); },
      fl => { el('rect', { width: 90, height: 30, fill: '#0038A8' }, fl); el('rect', { y: 30, width: 90, height: 30, fill: '#CE1126' }, fl); el('path', { d: 'M0,0 L40,30 L0,60Z', fill: '#FFFFFF' }, fl); },
      fl => { el('rect', { width: 90, height: 30, fill: '#FFFFFF' }, fl); el('rect', { y: 30, width: 90, height: 30, fill: '#DC143C' }, fl); },
      fl => { ['#74ACDF', '#FFFFFF', '#74ACDF'].forEach((c, k) => el('rect', { x: 0, y: k * 20, width: 90, height: 20, fill: c }, fl)); el('circle', { cx: 45, cy: 30, r: 6, fill: '#F6B40E' }, fl); },
      fl => { el('rect', { width: 90, height: 30, fill: '#FCD116' }, fl); el('rect', { y: 30, width: 90, height: 15, fill: '#003893' }, fl); el('rect', { y: 45, width: 90, height: 15, fill: '#CE1126' }, fl); },
      fl => { ['#008751', '#FFFFFF', '#008751'].forEach((c, k) => el('rect', { x: k * 30, y: 0, width: 30, height: 60, fill: c }, fl)); },
    ];
    [[260, 900], [520, 940], [760, 880], [1180, 900], [1420, 950], [1680, 890], [120, 1000], [1860, 980]].forEach(([x, y], i) => {
      const fg = g(crowd, { transform: `translate(${x} ${y})` });
      el('rect', { x: -3, y: -150, width: 6, height: 170, fill: '#5A4A40' }, fg);
      const fl = g(fg, { transform: 'translate(3 -150)' });
      flagDefs[i % flagDefs.length](fl);
      flags.push({ fl, ph: i });
    });

    const cam = camera([[L0, .3], [L1, 1], [L2, 1.1]], [{ t: 0, x: 900, y: 600, s: 1.0 }, { t: 6, x: 900, y: 580, s: 1.04 }, { t: 12.8, x: 960, y: 500, s: 1.55 }]);
    return lt => {
      cam(lt);
      for (const sm of smoke) {
        const u = ((lt - sm.t0) % 6.8 + 6.8) % 6.8;
        const alive = lt >= sm.t0 && lt < 7.5;
        sm.e.style.display = alive ? '' : 'none';
        if (!alive) continue;
        sm.e.setAttribute('cx', f1(1718 + u * 22 + Math.sin(u * 2 + sm.t0) * 12));
        sm.e.setAttribute('cy', f1(360 - u * 70));
        sm.e.setAttribute('r', f1(16 + u * 16));
        op(sm.e, (1 - u / 6.8) * .9 * (1 - P(lt, 6.5, 7.5)));
      }
      const k = P(lt, 4.8, 6.2, E.o);
      tr(pope.g, 960, 560, .8 * (.9 + .1 * k));
      op(pope.g, k);
      pope.setArm('r', 140 + Math.sin(lt * 4) * 16);
      pope.blink(lt);
      for (const h of heads) h.e.setAttribute('transform', `translate(${f1(h.x)} ${f1(h.y - Math.abs(Math.sin(lt * 3 + h.ph)) * 5 * h.s * (lt > 5 ? 1.8 : 1))}) scale(${f1(h.s * 100) / 100})`);
      for (const f of flags) f.fl.setAttribute('transform', `translate(3 -150) skewY(${f1(Math.sin(lt * 3 + f.ph) * 6)}) scale(${f1(1 + .04 * Math.sin(lt * 5 + f.ph))} 1)`);
    };
  },
});

// Cierre
addScene({
  id: 'cierre', dur: 10,
  captions: [
    { a: 1.4, b: 8.6, text: 'De Adán a hoy: una sola historia de *amor* entre Dios y la humanidad.', cls: 'end', stagger: .07 },
  ],
  build(root) { return cosmos(root, true); },
});
