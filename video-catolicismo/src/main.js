// Ensambla las escenas en una línea de tiempo y expone renderAt(t).
function init() {
  const svg = document.getElementById('svg');
  DEFS = el('defs', {}, svg);
  figureDefs();
  const world = g(svg);
  let t0 = 0;
  for (const s of SCENES) {
    s.start = t0; t0 += s.dur;
    s.fadeIn = s.fadeIn == null ? .7 : s.fadeIn;
    s.g = g(world);
    s.g.style.display = 'none';
    s.update = s.build(s.g) || (() => {});
  }
  const DUR = t0;

  // Viñeta, destello y negro por encima de todo
  el('rect', { x: 0, y: 0, width: W, height: H, fill: rad([[0, '#000', 0], [.62, '#000', 0], [1, '#02040C', .55]], .5, .5, .75), 'pointer-events': 'none' }, svg);
  const flash = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#FFF6E0', opacity: 0 }, svg);
  const black = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#03050C', opacity: 0 }, svg);

  // Subtítulos
  const capsBox = document.getElementById('caps');
  const caps = [];
  for (const s of SCENES) for (const c of (s.captions || [])) {
    const d = document.createElement('div');
    d.className = 'cap ' + (c.cls || '');
    const words = [];
    const parts = c.text.split(' ');
    let hl = false;
    parts.forEach((w, i) => {
      const sp = document.createElement('span');
      sp.className = 'w';
      let txt = w;
      const open = txt.startsWith('*');
      if (open) { hl = true; txt = txt.slice(1); }
      const ci = txt.indexOf('*');
      if (hl && ci >= 0) {
        const a = document.createElement('span'); a.className = 'hl'; a.textContent = txt.slice(0, ci);
        sp.appendChild(a); sp.appendChild(document.createTextNode(txt.slice(ci + 1)));
        hl = false;
      } else {
        if (hl) sp.classList.add('hl');
        sp.textContent = txt;
      }
      d.appendChild(sp);
      if (i < parts.length - 1) d.appendChild(document.createTextNode(' '));
      words.push(sp);
    });
    capsBox.appendChild(d);
    caps.push({ a: s.start + c.a, b: s.start + c.b, d, words, cls: c.cls || '', stagger: c.stagger || .045, dark: c.cls ? 0 : 1 });
  }
  const shade = document.getElementById('shade');

  // Capítulo y barra de progreso
  const chip = document.getElementById('chip');
  const chipbg = document.getElementById('chipbg');
  const dotsBox = document.getElementById('dots');
  const NCH = 12, dots = [];
  for (let i = 0; i < NCH; i++) { const d = document.createElement('i'); dotsBox.appendChild(d); dots.push(d); }
  let lastChap = null;

  function renderAt(T) {
    for (let i = 0; i < SCENES.length; i++) {
      const s = SCENES[i], nx = SCENES[i + 1];
      const lt = T - s.start;
      const end = s.dur + (nx ? nx.fadeIn : 1);
      if (lt >= 0 && lt < end) {
        s.g.style.display = '';
        s.g.setAttribute('opacity', s.fadeIn ? P(lt, 0, s.fadeIn, E.sine).toFixed(3) : 1);
        s.update(lt);
      } else s.g.style.display = 'none';
    }
    let fl = 0, bl = 0;
    for (const s of SCENES) {
      if (s.trans === 'flash') fl = Math.max(fl, P(T, s.start - .25, s.start, E.i) * (1 - P(T, s.start, s.start + 1.1, E.o)));
      if (s.trans === 'black') bl = Math.max(bl, P(T, s.start - .8, s.start, E.sine) * (1 - P(T, s.start + .1, s.start + .9, E.sine)));
    }
    op(flash, fl); op(black, bl);
    if (T > DUR - 1.2) op(black, P(T, DUR - 1.2, DUR - .05, E.sine));

    let dark = 0;
    for (const c of caps) {
      if (T < c.a || T > c.b) { c.d.style.display = 'none'; continue; }
      c.d.style.display = 'block';
      const out = P(T, c.b - .45, c.b, E.i);
      c.d.style.opacity = (1 - out).toFixed(3);
      c.d.style.transform = `translateY(${(-out * 12).toFixed(1)}px)`;
      c.words.forEach((w, i) => {
        const k = P(T, c.a + i * c.stagger, c.a + i * c.stagger + .45, E.o);
        w.style.opacity = k.toFixed(3);
        w.style.transform = `translateY(${((1 - k) * 18).toFixed(1)}px)`;
      });
      if (c.dark) dark = Math.max(dark, P(T, c.a - .3, c.a + .3) * (1 - out));
    }
    shade.style.opacity = dark.toFixed(3);

    let cur = null, clt = 0;
    for (const s of SCENES) if (T >= s.start && T < s.start + s.dur) { cur = s; clt = T - s.start; }
    if (cur && cur.chapter) {
      const ch = cur.chapter;
      if (lastChap !== ch) {
        chip.querySelector('.num').textContent = String(ch.n).padStart(2, '0');
        chip.querySelector('.ttl').textContent = ch.title;
        chip.querySelector('.yr').textContent = ch.year;
        dots.forEach((d, i) => d.className = i < ch.n ? 'on' : '');
        lastChap = ch;
      }
      const k = P(clt, .5, 1.2, E.o) * (1 - P(clt, cur.dur - .5, cur.dur - .05, E.i));
      chip.style.opacity = k.toFixed(3);
      chip.style.transform = `translateX(${((1 - k) * -30).toFixed(1)}px)`;
      dotsBox.style.opacity = (k * .9).toFixed(3);
      chipbg.style.opacity = k.toFixed(3);
    } else { chip.style.opacity = 0; dotsBox.style.opacity = 0; chipbg.style.opacity = 0; }
  }

  window.DURATION = DUR;
  window.renderAt = renderAt;
  renderAt(0);
  return DUR;
}



(async function boot() {
  const params = new URLSearchParams(location.search);
  const isRender = params.has('render');
  if (isRender) document.body.classList.add('render');
  await document.fonts.load('700 40px M');
  await document.fonts.load('900 40px M');
  await document.fonts.load('600 40px M');
  await document.fonts.load('800 40px M');
  await document.fonts.ready;
  const DUR = init();
  window.READY = true;
  if (isRender) return;

  const stage = document.getElementById('stage');
  const fit = () => {
    const k = Math.min(innerWidth / 1920, (innerHeight - 50) / 1080);
    stage.style.transform = `scale(${k})`;
  };
  addEventListener('resize', fit); fit();
  const scrub = document.getElementById('scrub'), btn = document.getElementById('play'), tm = document.getElementById('time');
  scrub.max = DUR;
  let t = parseFloat(params.get('t') || '0'), playing = false, last = 0;
  const draw = () => { renderAt(t); scrub.value = t; tm.textContent = t.toFixed(1) + ' s'; };
  scrub.oninput = () => { t = parseFloat(scrub.value); draw(); };
  btn.onclick = () => { playing = !playing; btn.textContent = playing ? '❚❚' : '▶'; last = performance.now(); };
  const loop = now => {
    if (playing) { t += (now - last) / 1000; last = now; if (t >= DUR) { t = DUR; playing = false; btn.textContent = '▶'; } draw(); }
    requestAnimationFrame(loop);
  };
  draw(); requestAnimationFrame(loop);
})();
