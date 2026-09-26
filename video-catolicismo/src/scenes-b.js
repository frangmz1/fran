// Escenas 5–8: Jesús, Resurrección y Pentecostés, Roma, Edad Media.

function shotFade(lt, a, b) { return P(lt, a, b, E.sine); }
function label(p, x, y, text, size = 34, col = '#FFD98A', ls = 6) {
  return el('text', { x, y, 'text-anchor': 'middle', fill: col, 'font-family': 'M', 'font-weight': 800, 'font-size': size, 'letter-spacing': ls }, p).appendChild(document.createTextNode(text)).parentNode;
}
function flame(p, x, y, s) {
  const G = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  glow(G, 0, -18, 46, '#FFB23F', .7);
  el('path', { d: 'M0,0 C-14,-8 -12,-28 0,-46 C12,-28 14,-8 0,0Z', fill: '#FF9F2E' }, G);
  el('path', { d: 'M0,-2 C-7,-8 -6,-20 0,-30 C6,-20 7,-8 0,-2Z', fill: '#FFE38A' }, G);
  return G;
}
function keys(p) {
  const k = g(p);
  for (const [c, r] of [['#F5B83D', -30], ['#D9DCE6', 30]]) {
    const kk = g(k, { transform: `rotate(${r})` });
    el('rect', { x: -3.5, y: -34, width: 7, height: 56, rx: 3, fill: c }, kk);
    el('circle', { cx: 0, cy: -40, r: 11, fill: 'none', stroke: c, 'stroke-width': 6 }, kk);
    el('rect', { x: 0, y: 8, width: 12, height: 6, fill: c }, kk);
    el('rect', { x: 0, y: 16, width: 9, height: 6, fill: c }, kk);
  }
  return k;
}

// 5 · Jesucristo
addScene({
  id: 'jesus', dur: 18,
  chapter: { n: 5, title: 'JESUCRISTO', year: 'Siglo I' },
  captions: [
    { a: .6, b: 5.7, text: 'Dios se hizo hombre: *Jesús* nació de la Virgen María en Belén.' },
    { a: 6.5, b: 11.7, text: 'Enseñó el Reino de Dios, sanó a los enfermos y *perdonó* a los pecadores.' },
    { a: 12.5, b: 17.4, text: 'Y entregó su vida en la *cruz* por la salvación de todos.' },
  ],
  build(root) {
    // A · Belén
    const A = g(root), A0 = g(A), A1 = g(A), A2 = g(A);
    sky(A0, [[0, '#070E30'], [.6, '#1B2964'], [1, '#34407E']]);
    const stA = starfield(A0, 220, 55, [-300, -300, 2500, 900]);
    const beth = g(A0, { transform: 'translate(960 110)' });
    glow(beth, 0, 0, 380, '#FFE6A8', .8);
    const bRays = rays(beth, 0, 0, 20, 460, '#FFE6A8', .25, .04, 5);
    el('path', { d: sparkleD(58), fill: '#FFF8E6' }, beth);
    el('circle', { r: 12, fill: '#FFFFFF' }, beth);
    el('path', { d: 'M946,140 L700,800 L1220,800 L974,140Z', fill: lin([[0, '#FFE6A8', .5], [1, '#FFE6A8', 0]]) }, A0);
    el('path', { d: ridge(hillPts(-500, 2500, 760, 90, 81, 240)), fill: '#1C2858' }, A1);
    const town = g(A1), rt = rng(83);
    for (let i = 0; i < 16; i++) {
      const x = 80 + i * 60 + (i > 7 ? 700 : 0), w = 44 + rt() * 20, h = 40 + rt() * 50, y = 770 - rt() * 20;
      el('rect', { x, y: y - h, width: w, height: h, fill: '#24306A' }, town);
      if (rt() < .6) { el('rect', { x: x + w / 2 - 5, y: y - h + 14, width: 10, height: 12, rx: 2, fill: '#FFC56B' }, town); }
    }
    el('path', { d: ridge([[-500, 900], [300, 880], [960, 905], [1600, 880], [2500, 900]]), fill: '#2A3263' }, A2);
    const stb = g(A2, { transform: 'translate(960 925)' });
    el('rect', { x: -300, y: -320, width: 600, height: 320, fill: '#3E2A22' }, stb);
    glow(stb, 0, -110, 460, '#FFB45C', .6);
    for (const px of [-300, 274]) el('rect', { x: px, y: -312, width: 26, height: 312, fill: '#7A5234' }, stb);
    el('path', { d: 'M-370,-300 L0,-430 L370,-300 L350,-270 L0,-392 L-350,-270Z', fill: '#6E4A30' }, stb);
    el('path', { d: 'M-370,-300 L0,-430 L370,-300 L370,-288 L0,-418 L-370,-288Z', fill: '#D9B36A' }, stb);
    ox(stb, -240, -8, .9, false);
    donkey(stb, 250, -8, .9, true);
    const mary = figure(stb, { x: -165, y: 0, s: 1.05, skin: SKIN[1], robe: '#F4EEE4', veil: '#3D6FD1', halo: true, armR: 40, look: .6 });
    const joseph = figure(stb, { x: 175, y: 0, s: 1.12, skin: SKIN[2], robe: '#8A6A4A', mantle: '#C9853F', hair: '#4A2E1C', beard: '#4A2E1C', armL: 14, look: -.6 });
    hold(joseph, 'l', 14, h => staff(h, -150, 90, '#6E4128'));
    const mg = g(stb);
    glow(mg, 0, -95, 150, '#FFE6A8', .9);
    el('path', { d: 'M-95,-78 L95,-78 L72,0 L-72,0Z', fill: '#8A5A3C' }, mg);
    el('path', { d: 'M-104,-80 Q0,-114 104,-80 L94,-68 Q0,-96 -94,-68Z', fill: '#E9C46A' }, mg);
    el('ellipse', { cx: 6, cy: -98, rx: 48, ry: 20, fill: '#FFF6E6' }, mg);
    el('circle', { cx: -36, cy: -104, r: 17, fill: SKIN[0] }, mg);
    el('circle', { cx: -36, cy: -104, r: 26, fill: 'none', stroke: '#FFD76A', 'stroke-width': 3 }, mg);
    el('ellipse', { cx: -41, cy: -106, rx: 2.2, ry: 1.2, fill: '#1B1A2E' }, mg);
    el('ellipse', { cx: -31, cy: -106, rx: 2.2, ry: 1.2, fill: '#1B1A2E' }, mg);
    sheep(A2, 420, 990, .9); sheep(A2, 300, 1010, .75, true); sheep(A2, 1560, 1000, .85, true);

    // B · Galilea
    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    sky(B0, [[0, '#5AB3DE'], [.55, '#AEE0EC'], [.8, '#FFE8C2']]);
    glow(B0, 1550, 260, 480, '#FFF1C1', .9);
    cloud(B0, 400, 200, 1, '#FFFFFF', .85); cloud(B0, 1300, 150, .8, '#FFFFFF', .75);
    el('path', { d: ridge(hillPts(-500, 2500, 590, 70, 91, 220)), fill: '#93BD8E' }, B1);
    el('rect', { x: -500, y: 590, width: 2900, height: 200, fill: '#46A6C4' }, B1);
    for (let i = 0; i < 8; i++) el('rect', { x: -200 + i * 290, y: 612 + (i % 3) * 22, width: 120, height: 5, rx: 2.5, fill: '#9FDDE8', opacity: .7 }, B1);
    const boat = g(B1);
    el('path', { d: 'M-50,0 L50,0 L36,16 L-36,16Z', fill: '#7A4A2C' }, boat);
    el('path', { d: 'M0,0 L0,-70 L40,-8Z', fill: '#F4EEE4' }, boat);
    el('path', { d: 'M-600,1100 C-200,760 300,700 700,720 C1000,690 1200,700 1500,740 C1900,800 2200,900 2500,1100Z', fill: '#7DB65E' }, B2);
    el('path', { d: 'M-600,1100 C-100,900 500,860 960,880 C1400,860 2000,920 2500,1100Z', fill: '#6AA551' }, B2);
    roundTree(B2, 220, 790, .9, '#7E9C5A', '#6B4A30', '#B6CC8A');
    roundTree(B2, 1720, 800, 1.1, '#7E9C5A', '#6B4A30', '#B6CC8A');
    const jesus = figure(B2, { x: 960, y: 790, s: 1.3, skin: SKIN[2], robe: '#F7F2EA', mantle: '#C8423B', hair: '#5A3A22', hairStyle: 'long', beard: '#5A3A22', halo: true, armL: 42, armR: 42 });
    const crowd = [], rc = rng(97);
    const rob = ['#E8505B', '#F2C14E', '#3FA7D6', '#8E6CC4', '#E07A5F', '#5CC27A', '#F4EEE4', '#B5543F'];
    const spots = [];
    for (let i = 0; i < 7; i++) { const a = Math.PI * (.95 + i * .05); spots.push([960 + Math.cos(a) * (360 + (i % 2) * 90), 850 + (i % 2) * 60, .8 + (i % 2) * .12, 1]); }
    for (let i = 0; i < 7; i++) { const a = Math.PI * (.05 - i * .05); spots.push([960 + Math.cos(a) * (360 + (i % 2) * 90) + 0, 850 + (i % 2) * 60, .8 + (i % 2) * .12, -1]); }
    spots.sort((a, b) => a[1] - b[1]);
    for (const [x, y, s, d] of spots) {
      const f = figure(B2, { x, y, s, skin: SKIN[Math.floor(rc() * 6)], robe: rob[Math.floor(rc() * 8)], hair: '#3A2418', veil: rc() < .35 ? '#E9DCC0' : null, beard: rc() < .3 ? '#3A2418' : null, look: d * .8 });
      crowd.push(f);
    }
    const child = figure(B2, { x: 1090, y: 800, s: .62, skin: SKIN[3], robe: '#F2C14E', hair: '#2A1A10', look: -1 });

    // C · El Calvario
    const C = g(root), C0 = g(C), C1 = g(C), C2 = g(C);
    sky(C0, [[0, '#170E2C'], [.45, '#56224A'], [.72, '#C24E3E'], [.86, '#F08A4B']]);
    const sunC = g(C0);
    glow(sunC, 960, 600, 520, '#FF9A5A', .8);
    el('circle', { cx: 960, cy: 600, r: 120, fill: '#FFD27A' }, sunC);
    const ecl = el('circle', { cx: 700, cy: 600, r: 124, fill: '#3A1A34' }, C0);
    for (let i = 0; i < 5; i++) el('rect', { x: -200 + i * 420, y: 180 + i * 70, width: 520, height: 16, rx: 8, fill: '#3A1A3A', opacity: .5 }, C0);
    const cr = rays(C1, 960, 330, 24, 900, '#FFB36B', .12, .04, 21);
    el('path', { d: 'M-500,1100 C100,900 600,720 960,700 C1320,720 1820,900 2420,1100Z', fill: '#26142C' }, C1);
    const cross = (p, x, y, s, col, rim) => {
      const G = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
      el('rect', { x: -17, y: -440, width: 34, height: 460, fill: col }, G);
      el('rect', { x: -160, y: -340, width: 320, height: 32, fill: col }, G);
      if (rim) {
        el('rect', { x: -17, y: -440, width: 6, height: 460, fill: rim, opacity: .6 }, G);
        el('rect', { x: -160, y: -340, width: 320, height: 6, fill: rim, opacity: .6 }, G);
        el('rect', { x: -26, y: -410, width: 52, height: 26, rx: 3, fill: '#E9DCC0' }, G);
      }
      return G;
    };
    cross(C1, 640, 800, .55, '#1E1024');
    cross(C1, 1280, 800, .55, '#1E1024');
    cross(C1, 960, 712, 1, '#2E1A2E', '#FFB36B');
    const maryC = figure(C2, { x: 860, y: 740, s: .78, skin: SKIN[1], robe: '#4A3A5E', veil: '#35508F', rim: '#FFB36B', look: .6 });
    const john = figure(C2, { x: 1060, y: 740, s: .76, skin: SKIN[1], robe: '#8E3A3A', hair: '#4A2E1C', rim: '#FFB36B', look: -.6 });

    const camA = camera([[A0, .25], [A1, .55], [A2, 1]], [{ t: 0, x: 960, y: 600, s: 1.0 }, { t: 6.4, x: 960, y: 700, s: 1.2 }]);
    const camB = camera([[B0, .2], [B1, .5], [B2, 1]], [{ t: 5.8, x: 960, y: 640, s: 1.12 }, { t: 12.4, x: 960, y: 620, s: 1.0 }]);
    const camC = camera([[C0, .2], [C1, 1], [C2, 1]], [{ t: 11.8, x: 960, y: 560, s: 1.0 }, { t: 18, x: 960, y: 520, s: 1.14 }]);
    return lt => {
      const kB = shotFade(lt, 5.8, 6.5), kC = shotFade(lt, 11.9, 12.6);
      show(A, kB < 1); show(B, kB > 0 && kC < 1); op(B, kB); show(C, kC > 0); op(C, kC);
      if (kB < 1) {
        camA(lt); stA(lt);
        tr(bRays, 0, 0, 1, lt * 4);
        mary.blink(lt); joseph.blink(lt);
      }
      if (kB > 0 && kC < 1) {
        camB(lt);
        tr(boat, 1300 - lt * 14, 640 + Math.sin(lt * 2) * 3);
        const sw = Math.sin(lt * 1.6) * 8;
        jesus.setArm('l', 42 + sw); jesus.setArm('r', 42 - sw);
        jesus.blink(lt);
        crowd.forEach(f => f.blink(lt));
        child.blink(lt);
      }
      if (kC > 0) {
        camC(lt);
        ecl.setAttribute('cx', f1(lerp(700, 960, P(lt, 12.4, 16.5, E.sine))));
        tr(cr, 960, 330, 1, lt * 2);
        maryC.blink(lt); john.blink(lt);
      }
    };
  },
});

// 6 · Resurrección y Pentecostés
addScene({
  id: 'pascua', dur: 14, trans: 'black', fadeIn: 0,
  chapter: { n: 6, title: 'NACE LA IGLESIA', year: 'c. 33 d.C.' },
  captions: [
    { a: .4, b: 2.3, text: 'Al tercer día…' },
    { a: 2.5, b: 5.3, text: '¡RESUCITÓ!', cls: 'shout', stagger: .1 },
    { a: 6.0, b: 9.8, text: 'Envió al *Espíritu Santo* sobre los apóstoles en Pentecostés…' },
    { a: 10.0, b: 13.6, text: '…y puso a *Pedro* al frente de su Iglesia.' },
  ],
  build(root) {
    const A = g(root), A0 = g(A), A1 = g(A), A2 = g(A);
    sky(A0, [[0, '#0E1840'], [.55, '#2B3A78'], [.8, '#7A5E9A'], [1, '#F0A87A']]);
    const stA = starfield(A0, 90, 61, [-300, -300, 2500, 700]);
    el('path', { d: ridge(hillPts(-500, 2500, 760, 80, 101, 240)), fill: '#243060' }, A0);
    for (const [x, s] of [[180, 1.2], [300, .9], [1640, 1.3], [1760, 1]]) cypress(A1, x, 960, s * 1.6, '#1E3A3A', '#2E5A50');
    const rock = g(A1);
    el('path', { d: 'M260,1100 C280,700 600,500 960,480 C1320,500 1640,700 1660,1100Z', fill: '#6E6A8A' }, rock);
    el('path', { d: 'M960,480 C1320,500 1640,700 1660,1100 L1200,1100 C1220,800 1120,560 960,480Z', fill: '#000', opacity: .15 }, rock);
    el('path', { d: 'M500,700 C560,640 640,620 700,640 M1200,640 C1260,620 1340,650 1400,700', stroke: '#8C87A6', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, rock);
    el('path', { d: 'M850,960 L850,790 A110,110 0 0,1 1070,790 L1070,960Z', fill: '#1A1428' }, rock);
    const inner = g(rock);
    glow(inner, 960, 860, 260, '#FFE6A8', 1);
    el('path', { d: 'M890,950 C900,930 1020,925 1035,948 L1040,960 L885,960Z', fill: '#FFFFFF' }, inner);
    el('path', { d: 'M-500,1100 L-500,960 C200,940 700,970 960,962 C1300,955 1900,945 2500,960 L2500,1100Z', fill: '#3A3E5E' }, A1);
    const stone = g(A1);
    el('circle', { r: 130, fill: '#8C87A6' }, stone);
    el('circle', { r: 96, fill: 'none', stroke: '#6E6A8A', 'stroke-width': 10 }, stone);
    el('path', { d: 'M-130,0 A130,130 0 0,0 130,0Z', fill: '#000', opacity: .12 }, stone);
    const burst = g(A1, { transform: 'translate(960 860)' });
    glow(burst, 0, 0, 900, '#FFE6A8', .9);
    const bR = rays(burst, 0, 0, 30, 1300, '#FFF1C1', .3, .05, 33);
    const women = [
      figure(A2, { x: 470, y: 1030, s: 1.05, skin: SKIN[1], robe: '#8E5A7E', veil: '#E9DCC0', armR: 20, look: 1 }),
      figure(A2, { x: 330, y: 1045, s: .98, skin: SKIN[3], robe: '#5A7E8E', veil: '#C98A6A', armL: 20, look: 1 }),
    ];
    const flashA = el('rect', { x: -500, y: -500, width: 3000, height: 2200, fill: '#FFF6E0', opacity: 0 }, A2);

    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    el('rect', { x: -400, y: -400, width: 2800, height: 1900, fill: lin([[0, '#F2D6A8'], [1, '#D9A66E']]) }, B0);
    for (const wx of [520, 1400]) {
      el('path', { d: `M${wx - 90},520 L${wx - 90},330 A90,90 0 0,1 ${wx + 90},330 L${wx + 90},520Z`, fill: '#8A5A3C' }, B0);
      el('path', { d: `M${wx - 72},504 L${wx - 72},334 A72,72 0 0,1 ${wx + 72},334 L${wx + 72},504Z`, fill: lin([[0, '#5AB3DE'], [1, '#CDEFF5']]) }, B0);
      el('rect', { x: wx - 5, y: 262, width: 10, height: 242, fill: '#8A5A3C' }, B0);
    }
    el('rect', { x: -400, y: 820, width: 2800, height: 700, fill: '#A8744A' }, B0);
    el('rect', { x: -400, y: 820, width: 2800, height: 14, fill: '#8A5A3C' }, B0);
    const spirit = g(B1);
    glow(spirit, 960, 250, 520, '#FFF1C1', .9);
    const sR = rays(spirit, 960, 250, 22, 900, '#FFF1C1', .22, .05, 44);
    const dv = dove(B1);
    const apostles = [], rb = rng(113);
    const ro = ['#E8505B', '#3FA7D6', '#8E6CC4', '#E07A5F', '#5CC27A', '#F2C14E', '#B5543F', '#4A7EC4', '#C45A8A', '#6AA551', '#E09A3F'];
    const back = [560, 720, 880, 1040, 1200, 1360];
    back.forEach((x, i) => apostles.push(figure(B2, { x, y: 810, s: .86, skin: SKIN[Math.floor(rb() * 6)], robe: ro[i], mantle: rb() < .5 ? '#F4EEE4' : null, hair: ['#3A2418', '#6B4A2A', '#1E1410'][i % 3], beard: i === 2 ? null : ['#3A2418', '#6B4A2A', '#1E1410'][i % 3] })));
    const frontX = [470, 630, 790, 960, 1130, 1290, 1450];
    let peter = null, maryB = null;
    frontX.forEach((x, i) => {
      if (i === 3) { maryB = figure(B2, { x, y: 905, s: 1.0, skin: SKIN[1], robe: '#F4EEE4', veil: '#3D6FD1' }); return; }
      if (i === 4) {
        peter = figure(B2, { x, y: 915, s: 1.08, skin: SKIN[2], robe: '#3F66B0', mantle: '#F2C14E', hair: '#D8D2C8', beard: '#E8E4DC', armR: 34 });
        hold(peter, 'r', 34, h => { const k = keys(h); k.setAttribute('transform', 'translate(10 -14) scale(.9)'); });
        return;
      }
      apostles.push(figure(B2, { x, y: 905 + (i % 2) * 8, s: 1.0, skin: SKIN[Math.floor(rb() * 6)], robe: ro[6 + i % 5], hair: '#3A2418', beard: i === 2 ? null : '#3A2418' }));
    });
    apostles.splice(8, 0, peter);
    const people = [...apostles, maryB];
    const heads = people.map(f => {
      const m = f.g.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/);
      return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
    });
    const flames = heads.map(([x, y, s]) => flame(B2, x, y - 172 * s, s * .9));
    const peterGlow = glow(B2, 1130, 820, 220, '#FFE6A8', 0);
    B2.insertBefore(peterGlow, B2.firstChild);

    const camA = camera([[A0, .2], [A1, 1], [A2, 1]], [{ t: 0, x: 960, y: 600, s: 1.04 }, { t: 5.6, x: 960, y: 680, s: 1.12 }]);
    const camB = camera([[B0, .3], [B1, .7], [B2, 1]], [{ t: 5.2, x: 960, y: 560, s: 1.0 }, { t: 9.6, x: 960, y: 600, s: 1.04 }, { t: 14, x: 1060, y: 640, s: 1.14 }]);
    return lt => {
      const kB = shotFade(lt, 5.2, 5.9);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        camA(lt); stA(lt);
        const k = P(lt, .7, 2.4, E.io);
        tr(stone, 960 + 280 * k, 832, 1, k * 280 / 130 * 57.3);
        op(inner, P(lt, 1.2, 2.2));
        const b = P(lt, 1.9, 3.2, E.o);
        tr(burst, 960, 860, .2 + .8 * b); op(burst, b * (.85 + .15 * Math.sin(lt * 3)));
        tr(bR, 0, 0, 1, lt * 5);
        op(flashA, pulse(lt, 2.1, 3.4, .12, 1));
        women.forEach((w, i) => { w.blink(lt); w.setArm(i ? 'l' : 'r', 20 + 110 * P(lt, 2.4 + i * .15, 3.2 + i * .15, E.back)); });
      }
      if (kB > 0) {
        camB(lt);
        tr(sR, 960, 250, 1, lt * 4);
        dv(960, 260 + Math.sin(lt * 1.5) * 10, lt, 1.4);
        op(spirit, P(lt, 5.4, 6.6));
        flames.forEach((f, i) => {
          const [x, y, s] = heads[i];
          const k = P(lt, 6.4 + i * .13, 6.9 + i * .13, E.back);
          f.setAttribute('transform', `translate(${x} ${f1(y - 172 * s)}) scale(${f1(s * .9 * k * 100) / 100} ${f1(s * .9 * k * (1 + .08 * Math.sin(lt * 12 + i)) * 100) / 100})`);
        });
        people.forEach(f => { f.blink(lt); f.lookAt(0, -4 * P(lt, 6, 6.8) * (1 - P(lt, 10, 10.6))); });
        op(peterGlow, .9 * P(lt, 10, 11));
      }
    };
  },
});

// 7 · Roma
addScene({
  id: 'roma', dur: 13,
  chapter: { n: 7, title: 'ROMA', year: 'Siglos I – IV' },
  captions: [
    { a: .6, b: 6.1, text: 'Los primeros cristianos fueron *perseguidos*… pero la fe no dejó de crecer.' },
    { a: 6.9, b: 9.9, text: '*313*: el emperador Constantino da libertad a los cristianos.' },
    { a: 10.1, b: 12.8, text: '*325*: el Concilio de Nicea proclama el *Credo*.' },
  ],
  build(root) {
    const A = g(root), A0 = g(A), A1 = g(A);
    sky(A0, [[0, '#2E3C7A'], [.55, '#D98A6E'], [.75, '#F6C47E']], -400, -500, W + 800, 1030);
    glow(A0, 1500, 400, 400, '#FFE0A0', .8);
    cloud(A0, 400, 160, 1.2, '#F7C9A8', .6); cloud(A0, 1400, 110, 1, '#F7C9A8', .5);
    el('path', { d: ridge(hillPts(-500, 2500, 470, 60, 121, 220), 530), fill: '#B77E78' }, A0);
    const col = g(A1, { transform: 'translate(1280 520)' });
    el('path', { d: 'M-280,0 L-280,-190 C-200,-210 -60,-222 40,-222 C140,-222 220,-214 280,-205 L280,-150 L240,-150 L240,0Z', fill: '#DDBB8C' }, col);
    el('path', { d: 'M120,-220 C200,-216 250,-210 280,-205 L280,-150 L240,-150 L240,0 L120,0Z', fill: '#000', opacity: .12 }, col);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) el('path', { d: `M${-262 + i * 50},${-14 - r * 64} l0,-30 a15,15 0 0,1 30,0 l0,30Z`, fill: '#8C5A4A' }, col);
    const tpl = g(A1, { transform: 'translate(560 520)' });
    el('rect', { x: -170, y: -16, width: 340, height: 16, fill: '#EAD8B8' }, tpl);
    for (let i = 0; i < 6; i++) el('rect', { x: -150 + i * 56, y: -150, width: 22, height: 134, fill: '#F2E4C8' }, tpl);
    el('path', { d: 'M-180,-150 L0,-210 L180,-150Z', fill: '#EAD8B8' }, tpl);
    for (const [x, s] of [[120, 1], [820, .8], [1680, 1.1], [1820, .9]]) cypress(A1, x, 520, s, '#2F5A48', '#3F7A5E');
    for (const x of [300, 950]) { const pn = g(A1, { transform: `translate(${x} 520)` }); el('rect', { x: -5, y: -110, width: 10, height: 110, fill: '#6B4A30' }, pn); el('ellipse', { cx: 0, cy: -120, rx: 70, ry: 26, fill: '#3F6A48' }, pn); }
    el('rect', { x: -500, y: 520, width: 2900, height: 1300, fill: lin([[0, '#7A5440'], [1, '#3A2620']]) }, A1);
    el('rect', { x: -500, y: 520, width: 2900, height: 16, fill: '#8FA85A' }, A1);
    const rr = rng(127);
    for (let i = 0; i < 40; i++) el('ellipse', { cx: f1(rr() * 2400 - 200), cy: f1(560 + rr() * 440), rx: f1(8 + rr() * 16), ry: f1(5 + rr() * 8), fill: '#5E3F30', opacity: .6 }, A1);
    const cat = g(A1);
    el('rect', { x: 140, y: 1040, width: 1640, height: 420, rx: 200, fill: '#241814' }, cat);
    for (let i = 0; i < 7; i++) for (let r = 0; r < 3; r++) if (!(i > 1 && i < 5 && r > 0)) el('rect', { x: 250 + i * 210, y: 1110 + r * 90, width: 120, height: 44, rx: 10, fill: '#3A2A22' }, cat);
    const fishSym = g(cat, { transform: 'translate(1560 1170)' });
    el('path', { d: 'M-60,0 C-30,-40 30,-40 60,0 C30,40 -30,40 -60,0 M-60,0 L-84,-24 M-60,0 L-84,24', stroke: '#E8D4B0', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, fishSym);
    const cr = g(cat, { transform: 'translate(360 1180)' });
    el('path', { d: 'M0,-60 L0,60 M-40,-40 L40,40 M40,-40 L-40,40 M0,-60 C44,-60 44,-6 0,-6', stroke: '#E8D4B0', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, cr);
    const candles = [];
    for (const x of [620, 960, 1300]) {
      const c = g(cat, { transform: `translate(${x} 1300)` });
      el('rect', { x: -6, y: -30, width: 12, height: 30, fill: '#F4EEE4' }, c);
      candles.push(glow(c, 0, -40, 180, '#FFB45C', .8));
      flame(c, 0, -30, .5);
    }
    const chr = [];
    [[560, .9], [700, .85], [860, .95], [1060, .9], [1220, .85], [1380, .92]].forEach(([x, s], i) => {
      chr.push(figure(cat, { x, y: 1430, s, skin: SKIN[i % 6], robe: ['#8E6CC4', '#B5543F', '#3FA7D6', '#E09A3F', '#5CA06A', '#C45A8A'][i], veil: i % 2 ? '#E9DCC0' : null, hair: '#3A2418', look: (960 - x) / 400 }));
    });

    const B = g(root), B0 = g(B), B1 = g(B), B2 = g(B);
    sky(B0, [[0, '#3F72C8'], [.6, '#9FD0EC'], [1, '#FBE3B0']]);
    const chi = g(B0, { transform: 'translate(960 250)' });
    glow(chi, 0, 0, 380, '#FFE08A', .8);
    const chiRays = rays(chi, 0, 0, 20, 520, '#FFF1C1', .25, .05, 71);
    const chiPaths = ['M0,-120 L0,120', 'M-80,-80 L80,80', 'M80,-80 L-80,80', 'M0,-120 C80,-120 80,-20 0,-20'].map(d => el('path', { d, stroke: '#FFE38A', 'stroke-width': 20, fill: 'none', 'stroke-linecap': 'round' }, chi));
    el('path', { d: ridge(hillPts(-500, 2500, 720, 60, 131, 240)), fill: '#B9A7C8' }, B1);
    el('rect', { x: -500, y: 780, width: 2900, height: 500, fill: '#E9D3AE' }, B1);
    for (let i = 0; i < 4; i++) el('rect', { x: -500, y: 780 + i * 18, width: 2900, height: 5, fill: '#D6BC92' }, B1);
    for (const x of [150, 380, 1540, 1770]) {
      const c = g(B1, { transform: `translate(${x} 800)` });
      el('rect', { x: -34, y: -520, width: 68, height: 520, fill: '#F2E4C8' }, c);
      el('rect', { x: 10, y: -520, width: 24, height: 520, fill: '#000', opacity: .08 }, c);
      el('rect', { x: -48, y: -540, width: 96, height: 26, fill: '#EAD8B8' }, c);
      el('rect', { x: -48, y: -14, width: 96, height: 22, fill: '#EAD8B8' }, c);
    }
    const bishops = [];
    [[560, 875], [700, 865], [1220, 865], [1360, 875]].forEach(([x, y], i) => {
      bishops.push(figure(B2, { x, y, s: 1.0, skin: SKIN[i % 5], robe: '#F4EEE4', mantle: '#C8423B', stole: '#F5B83D', mitre: '#F4EEE4', beard: ['#D8D2C8', '#3A2418', '#6B4A2A', '#E8E4DC'][i], look: (960 - x) / 500 }));
    });
    const scroll = g(B2, { transform: 'translate(1470 820)' });
    el('rect', { x: -80, y: -60, width: 160, height: 110, rx: 6, fill: '#F4E6CB' }, scroll);
    el('rect', { x: -92, y: -66, width: 18, height: 122, rx: 9, fill: '#C9A06A' }, scroll);
    el('rect', { x: 74, y: -66, width: 18, height: 122, rx: 9, fill: '#C9A06A' }, scroll);
    label(scroll, 0, -22, 'CREDO', 26, '#8C3A2A', 4);
    for (let k = 0; k < 3; k++) el('rect', { x: -56, y: -4 + k * 16, width: 112 - k * 20, height: 5, rx: 2.5, fill: '#C9A06A' }, scroll);
    const cons = figure(B2, { x: 960, y: 1000, s: 1.55, skin: SKIN[1], robe: '#6B3FA0', mantle: '#8E2A4A', belt: '#F5B83D', hair: '#3A2418', laurel: true, armR: 150, armL: 16 });
    hold(cons, 'r', 150, h => {
      el('rect', { x: -5, y: -210, width: 10, height: 330, fill: '#8A5A36' }, h);
      el('rect', { x: -60, y: -210, width: 120, height: 8, fill: '#8A5A36' }, h);
      el('path', { d: 'M-54,-202 L54,-202 L54,-100 L0,-80 L-54,-100Z', fill: '#7A2A6A' }, h);
      el('path', { d: 'M0,-190 L0,-110 M-22,-170 L22,-126 M22,-170 L-22,-126 M0,-190 C26,-190 26,-156 0,-156', stroke: '#FFD76A', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, h);
    });

    const camA = camera([[A0, .5], [A1, 1]], [{ t: 0, x: 960, y: 1240, s: 1.0 }, { t: 2.4, x: 960, y: 1220, s: 1.0 }, { t: 5.8, x: 960, y: 560, s: 1.0 }]);
    const camB = camera([[B0, .3], [B1, .8], [B2, 1]], [{ t: 6.2, x: 960, y: 560, s: 1.1 }, { t: 13, x: 960, y: 610, s: 1.0 }]);
    return lt => {
      const kB = shotFade(lt, 6.1, 6.8);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        camA(lt);
        candles.forEach((c, i) => op(c, .7 + .15 * Math.sin(lt * 9 + i * 2)));
        chr.forEach(f => f.blink(lt));
      }
      if (kB > 0) {
        camB(lt);
        chiPaths.forEach((p, i) => drawStroke(p, 260, P(lt, 6.6 + i * .3, 7.6 + i * .3)));
        tr(chiRays, 0, 0, 1, lt * 4);
        op(chi, P(lt, 6.4, 7.2));
        cons.blink(lt);
        const kb = P(lt, 9.8, 10.8, E.o);
        bishops.forEach((b, i) => { op(b.g, kb); b.blink(lt); });
        op(scroll, P(lt, 10.4, 11.2)); tr(scroll, 1470, 820 + 20 * (1 - P(lt, 10.4, 11.2, E.back)));
      }
    };
  },
});

// 8 · Edad Media
addScene({
  id: 'medieval', dur: 13,
  chapter: { n: 8, title: 'EDAD MEDIA', year: 'Siglos V – XV' },
  captions: [
    { a: .6, b: 6.6, text: 'Monasterios, universidades y catedrales guardaron la *fe* y el *saber* durante siglos.' },
    { a: 7.5, b: 12.8, text: '*1054*: el Gran Cisma separa a la Iglesia de Oriente y de Occidente.' },
  ],
  build(root) {
    const A = g(root), A0 = g(A), A1 = g(A), A2 = g(A);
    sky(A0, [[0, '#0D1440'], [.55, '#2A3270'], [.85, '#6A5A8A']], -400, -700, W + 800, H + 1100);
    const stA = starfield(A0, 200, 141, [-300, -600, 2500, 1000]);
    const moon = g(A0, { transform: 'translate(1600 120)' });
    glow(moon, 0, 0, 200, '#FFF1C1', .5);
    el('circle', { r: 56, fill: '#FFF1C1' }, moon);
    el('circle', { cx: 24, cy: -14, r: 50, fill: '#1E2660' }, moon);
    el('path', { d: ridge(hillPts(-500, 2500, 760, 110, 143, 260)), fill: '#232B62' }, A1);
    const mon = g(A1, { transform: 'translate(280 690)' });
    el('rect', { x: -120, y: -70, width: 240, height: 70, fill: '#3A4280' }, mon);
    el('path', { d: 'M-130,-70 L0,-120 L130,-70Z', fill: '#2C3470' }, mon);
    el('rect', { x: 70, y: -190, width: 50, height: 190, fill: '#3A4280' }, mon);
    el('path', { d: 'M62,-190 L95,-240 L128,-190Z', fill: '#2C3470' }, mon);
    for (const x of [-90, -40, 10]) el('rect', { x, y: -50, width: 16, height: 24, rx: 8, fill: '#FFC56B' }, mon);
    const town = g(A2), rt = rng(149);
    const house = (x, y, w, h) => {
      const hg = g(town, { transform: `translate(${x} ${y})` });
      el('rect', { x: -w / 2, y: -h, width: w, height: h, fill: '#E6D3B0' }, hg);
      el('path', { d: `M${-w / 2},${-h / 2} L${w / 2},${-h / 2} M0,${-h} L0,0 M${-w / 2},${-h} L${w / 2},${-h / 2}`, stroke: '#6B4A3A', 'stroke-width': 6 }, hg);
      el('path', { d: `M${-w / 2 - 10},${-h} L0,${-h - w * .55} L${w / 2 + 10},${-h}Z`, fill: '#A84A3A' }, hg);
      el('rect', { x: -w / 4 - 8, y: -h * .8, width: 16, height: 18, rx: 3, fill: '#FFC56B', class: 'win' }, hg);
    };
    for (let i = 0; i < 6; i++) house(80 + i * 105, 1000 - (i % 2) * 20, 90, 110 + rt() * 40);
    for (let i = 0; i < 6; i++) house(1320 + i * 105, 1000 - (i % 2) * 20, 90, 110 + rt() * 40);
    const cat = g(A2, { transform: 'translate(960 1000)' });
    const stone = '#D2C4AA', shade = '#A99A82';
    for (const sx of [-1, 1]) {
      const t = g(cat, { transform: `translate(${sx * 290} 0)` });
      el('rect', { x: -80, y: -640, width: 160, height: 640, fill: stone }, t);
      el('rect', { x: 20, y: -640, width: 60, height: 640, fill: shade, opacity: .6 }, t);
      el('path', { d: 'M-90,-640 L0,-860 L90,-640Z', fill: '#9A8C78' }, t);
      el('path', { d: 'M0,-860 L90,-640 L0,-640Z', fill: '#000', opacity: .12 }, t);
      el('path', { d: 'M0,-860 L0,-910 M-16,-892 L16,-892', stroke: '#F5B83D', 'stroke-width': 6, 'stroke-linecap': 'round' }, t);
      for (const wy of [-560, -420, -280]) el('path', { d: `M-18,${wy + 70} L-18,${wy + 16} Q-18,${wy} 0,${wy - 8} Q18,${wy} 18,${wy + 16} L18,${wy + 70}Z`, fill: '#FFC56B', class: 'win' }, t);
    }
    el('rect', { x: -210, y: -470, width: 420, height: 470, fill: stone }, cat);
    el('path', { d: 'M-230,-470 L0,-600 L230,-470Z', fill: '#9A8C78' }, cat);
    const rose = g(cat, { transform: 'translate(0 -330)' });
    const roseGlow = glow(rose, 0, 0, 260, '#FFB45C', 0);
    el('circle', { r: 108, fill: '#6B5A48' }, rose);
    const rcols = ['#E8505B', '#3FA7D6', '#F5B83D', '#2EC4B6', '#8E6CC4', '#3FA7D6'];
    const segs = [];
    for (let i = 0; i < 12; i++) {
      const a0 = i / 12 * 6.283, a1 = (i + 1) / 12 * 6.283;
      segs.push(el('path', { d: `M${f1(Math.cos(a0) * 36)},${f1(Math.sin(a0) * 36)} L${f1(Math.cos(a0) * 96)},${f1(Math.sin(a0) * 96)} A96,96 0 0,1 ${f1(Math.cos(a1) * 96)},${f1(Math.sin(a1) * 96)} L${f1(Math.cos(a1) * 36)},${f1(Math.sin(a1) * 36)}Z`, fill: rcols[i % 6], stroke: '#6B5A48', 'stroke-width': 5 }, rose));
    }
    el('circle', { r: 32, fill: '#F5B83D', stroke: '#6B5A48', 'stroke-width': 5 }, rose);
    const portal = g(cat);
    el('path', { d: 'M-95,0 L-95,-130 Q-95,-215 0,-250 Q95,-215 95,-130 L95,0Z', fill: '#8A7A66' }, portal);
    el('path', { d: 'M-70,0 L-70,-120 Q-70,-190 0,-218 Q70,-190 70,-120 L70,0Z', fill: '#5A3A2A' }, portal);
    const doorGlow = glow(portal, 0, -60, 200, '#FFB45C', 0);
    const monks = [0, 1, 2].map(i => figure(A2, { x: 0, y: 0, s: .95, skin: SKIN[i + 1], robe: '#6B4A30', veil: '#5A3C26', belt: '#E9DCC0', armR: 30 }));
    monks.forEach((m, i) => hold(m, 'r', 30, h => {
      if (i === 1) { el('rect', { x: -4, y: -30, width: 8, height: 26, fill: '#F4EEE4' }, h); flame(h, 0, -30, .45); }
      else { el('rect', { x: -18, y: -24, width: 36, height: 28, rx: 3, fill: '#8C2A2A' }, h); el('rect', { x: -14, y: -20, width: 28, height: 20, fill: '#F4E6CB' }, h); }
    }));
    const wins = [...A2.querySelectorAll('.win')];

    const B = g(root), B0 = g(B), B1 = g(B);
    sky(B0, [[0, '#18204A'], [.65, '#454C86'], [1, '#8A7AA8']]);
    starfield(B0, 90, 151, [-200, -200, 2300, 600])(3);
    const halfL = g(B1), halfR = g(B1);
    const crackPts = [[960, 770], [938, 815], [975, 860], [944, 905], [972, 950], [950, 1000], [966, 1050]];
    const crackD = crackPts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join('');
    const back = crackPts.slice().reverse().map(p => 'L' + p[0] + ',' + p[1]).join('');
    el('path', { d: `M960,770 L520,775 C360,780 250,820 240,860 C230,930 330,1000 480,1030 C640,1060 800,1052 966,1050 ${back.replace(/^L966,1050/, '')}Z`, fill: '#8A5A3C' }, halfL);
    el('path', { d: `M960,770 L520,775 C360,780 250,800 250,818 L960,818Z`, fill: '#6DAE6A' }, halfL);
    el('path', { d: `${crackD} C1120,1052 1280,1060 1440,1030 C1590,1000 1690,930 1680,860 C1670,820 1560,780 1400,775 L960,770Z`, fill: '#8A5A3C' }, halfR);
    el('path', { d: 'M960,770 L1400,775 C1560,780 1670,800 1670,818 L975,818 L960,770Z', fill: '#6DAE6A' }, halfR);
    const lat = g(halfL, { transform: 'translate(620 790)' });
    el('rect', { x: -150, y: -170, width: 240, height: 170, fill: '#EDE0C8' }, lat);
    el('path', { d: 'M-165,-170 L-30,-240 L105,-170Z', fill: '#B5543F' }, lat);
    el('circle', { cx: -30, cy: -120, r: 28, fill: '#3FA7D6', stroke: '#B59A7A', 'stroke-width': 6 }, lat);
    el('path', { d: 'M-60,0 L-60,-50 Q-60,-80 -30,-86 Q0,-80 0,-50 L0,0Z', fill: '#6B4A3A' }, lat);
    el('rect', { x: 100, y: -330, width: 70, height: 330, fill: '#E3D3B8' }, lat);
    el('path', { d: 'M92,-330 L135,-390 L178,-330Z', fill: '#B5543F' }, lat);
    el('path', { d: 'M135,-390 L135,-434 M120,-420 L150,-420', stroke: '#F5B83D', 'stroke-width': 6, 'stroke-linecap': 'round' }, lat);
    el('rect', { x: 118, y: -300, width: 34, height: 40, rx: 17, fill: '#6B4A3A' }, lat);
    label(halfL, 600, 910, 'ROMA', 38);
    const byz = g(halfR, { transform: 'translate(1300 790)' });
    el('rect', { x: -170, y: -150, width: 340, height: 150, fill: '#F2E4C8' }, byz);
    el('rect', { x: -110, y: -200, width: 220, height: 52, fill: '#EAD8B8' }, byz);
    el('path', { d: 'M-110,-200 A110,110 0 0,1 110,-200Z', fill: '#F5B83D' }, byz);
    el('path', { d: 'M0,-310 A110,110 0 0,1 110,-200 L0,-200Z', fill: '#000', opacity: .1 }, byz);
    for (const sx of [-1, 1]) el('path', { d: `M${sx * 170 - 55},-150 A55,55 0 0,1 ${sx * 170 + 55},-150Z`, fill: '#E9A93A' }, byz);
    el('path', { d: 'M0,-310 L0,-366 M-16,-350 L16,-350 M-10,-336 L10,-336 M-10,-322 L10,-326', stroke: '#F5B83D', 'stroke-width': 6, 'stroke-linecap': 'round' }, byz);
    for (let i = 0; i < 5; i++) el('path', { d: `M${-100 + i * 50},-10 L${-100 + i * 50},-60 A14,14 0 0,1 ${-72 + i * 50},-60 L${-72 + i * 50},-10Z`, fill: '#8C5A4A' }, byz);
    label(halfR, 1320, 910, 'CONSTANTINOPLA', 38);
    const crack = el('path', { d: crackD, stroke: '#1A1024', 'stroke-width': 10, fill: 'none', 'stroke-linejoin': 'round' }, B1);
    const crackGlow = glow(B1, 960, 900, 260, '#FF7A3D', 0);
    const debris = [], rd = rng(157);
    for (let i = 0; i < 14; i++) debris.push({ e: el('rect', { width: 10 + rd() * 14, height: 8 + rd() * 10, fill: '#6E4128' }, B1), x: 930 + rd() * 60, v: 200 + rd() * 300, t0: 9.2 + rd() * 1.2, r: rd() * 360 });

    const camA = camera([[A0, .3], [A1, .6], [A2, 1]], [{ t: 0, x: 960, y: 760, s: 1.14 }, { t: 7.3, x: 960, y: 520, s: 1.0 }]);
    const camB = camera([[B0, .3], [B1, 1]], [{ t: 6.8, x: 960, y: 720, s: 1.1 }, { t: 13, x: 960, y: 740, s: 1.04 }]);
    return lt => {
      const kB = shotFade(lt, 6.9, 7.6);
      show(A, kB < 1); show(B, kB > 0); op(B, kB);
      if (kB < 1) {
        camA(lt); stA(lt);
        const on = P(lt, .6, 2.6);
        segs.forEach((s, i) => s.setAttribute('opacity', (.35 + .65 * P(lt, .6 + i * .1, 1.2 + i * .1)).toFixed(2)));
        op(roseGlow, on * (.8 + .2 * Math.sin(lt * 2)));
        op(doorGlow, on * .8);
        wins.forEach((w, i) => op(w, .25 + .75 * P(lt, .3 + (i % 9) * .2, .8 + (i % 9) * .2)));
        monks.forEach((m, i) => {
          const x = 560 + i * 130 + lt * 38;
          tr(m.g, x, 1030 + i * 8 - Math.abs(Math.sin(lt * 5 + i)) * 5, .95 + i * .04);
          m.blink(lt);
        });
      }
      if (kB > 0) {
        camB(lt);
        drawStroke(crack, 320, P(lt, 8.1, 9.3, E.o));
        op(crack, 1 - P(lt, 9.3, 9.9));
        op(crackGlow, pulse(lt, 8.4, 10.4, .3, 1));
        const sp = P(lt, 9.3, 12, E.io);
        halfL.setAttribute('transform', `rotate(${f1(-2.5 * sp)} 960 1050) translate(${f1(-80 * sp)} 0)`);
        halfR.setAttribute('transform', `rotate(${f1(2.5 * sp)} 960 1050) translate(${f1(80 * sp)} 0)`);
        for (const d of debris) {
          const u = lt - d.t0;
          if (u < 0) { d.e.style.display = 'none'; continue; }
          d.e.style.display = '';
          d.e.setAttribute('transform', `translate(${f1(d.x)} ${f1(1000 + u * d.v + u * u * 200)}) rotate(${f1(d.r + u * 200)})`);
        }
      }
    };
  },
});
