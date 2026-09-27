// Sonidos sintetizados con Web Audio: motor, claxon y golpes.
export class Sonido {
  constructor() {
    this.ctx = null;
    this.silencio = false;
  }

  // Los navegadores solo dejan sonar audio después de un clic.
  iniciar() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.maestro = ctx.createGain();
    this.maestro.gain.value = 0.9;
    this.maestro.connect(ctx.destination);

    // Motor: dos osciladores desafinados con filtro pasa bajos.
    this.filtro = ctx.createBiquadFilter();
    this.filtro.type = 'lowpass';
    this.filtro.frequency.value = 500;
    this.filtro.Q.value = 3;
    this.motorGain = ctx.createGain();
    this.motorGain.gain.value = 0;
    this.o1 = ctx.createOscillator();
    this.o2 = ctx.createOscillator();
    this.o1.type = 'sawtooth';
    this.o2.type = 'square';
    this.o1.frequency.value = 40;
    this.o2.frequency.value = 20;
    const g2 = ctx.createGain();
    g2.gain.value = 0.5;
    this.o1.connect(this.filtro);
    this.o2.connect(g2).connect(this.filtro);
    this.filtro.connect(this.motorGain).connect(this.maestro);
    this.o1.start();
    this.o2.start();

    // Ruido para llantas y golpes.
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.ruido = buf;
    this.llanta = ctx.createBufferSource();
    this.llanta.buffer = buf;
    this.llanta.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 1.5;
    this.llantaGain = ctx.createGain();
    this.llantaGain.gain.value = 0;
    this.llanta.connect(bp).connect(this.llantaGain).connect(this.maestro);
    this.llanta.start();
  }

  alternar() {
    this.silencio = !this.silencio;
    if (this.maestro) this.maestro.gain.value = this.silencio ? 0 : 0.9;
    return this.silencio;
  }

  // Llamar cada cuadro: rpm según velocidad y acelerador.
  motor(encendido, velocidad, acelerador, derrape) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const v = Math.abs(velocidad);
    // Cambios de velocidad: la rpm sube y baja por marchas.
    const marchas = [0, 7, 14, 22, 31, 42, 60];
    let m = 1;
    while (m < marchas.length - 1 && v > marchas[m]) m++;
    const k = (v - marchas[m - 1]) / (marchas[m] - marchas[m - 1]);
    const rpm = 0.25 + k * 0.75 + Math.max(0, acelerador) * 0.1;
    const f = 32 + rpm * 70;
    this.o1.frequency.setTargetAtTime(f, t, 0.05);
    this.o2.frequency.setTargetAtTime(f / 2 + 1.5, t, 0.05);
    this.filtro.frequency.setTargetAtTime(300 + rpm * 900 + Math.max(0, acelerador) * 400, t, 0.05);
    this.motorGain.gain.setTargetAtTime(encendido ? 0.07 + Math.max(0, acelerador) * 0.04 : 0, t, 0.1);
    const chillido = encendido && derrape > 2.5 ? Math.min(0.12, (derrape - 2.5) * 0.03) : 0;
    this.llantaGain.gain.setTargetAtTime(chillido, t, 0.05);
  }

  claxon() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.02);
    g.gain.setValueAtTime(0.08, t + 0.4);
    g.gain.linearRampToValueAtTime(0, t + 0.5);
    g.connect(this.maestro);
    for (const f of [392, 494]) {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      o.connect(g);
      o.start(t);
      o.stop(t + 0.52);
    }
  }

  golpe(fuerza) {
    if (!this.ctx || fuerza < 2.5) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.ruido;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.35, fuerza * 0.03), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    s.connect(lp).connect(g).connect(this.maestro);
    s.start(t);
    s.stop(t + 0.4);
  }
}
