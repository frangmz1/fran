import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { crearTexturas } from './texturas.js';
import { crearTerreno } from './terreno.js';
import { crearCalles } from './calles.js';
import { crearCasas } from './casas.js';
import { crearVegetacion } from './vegetacion.js';
import { crearAccesos } from './accesos.js';
import { Colisiones } from './colisiones.js';
import { Auto, Estacionados, MODELOS, materialesAuto } from './autos.js';
import { Jugador } from './jugador.js';
import { Controles } from './controles.js';
import { Hud } from './hud.js';
import { Sonido } from './sonido.js';
import { Editor } from './editor.js';
import { MAPA, CALLES, alturaEn, calleCercana, distTramo } from './mundo.js';

const $ = (id) => document.getElementById(id);
const t0 = performance.now();
const estado = (t) => {
  $('load-status').textContent = t;
  console.info(`${((performance.now() - t0) / 1000).toFixed(1)} s · ${t}`);
};
const medir = (nombre, fn) => {
  const t = performance.now();
  const r = fn();
  console.info(`  ${nombre}: ${((performance.now() - t) / 1000).toFixed(2)} s`);
  return r;
};
const cuadro = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const NOMBRE_COLOR = {
  '#f1f1ef': 'blanc', '#b9bcc0': 'plata', '#5d6166': 'gris', '#1c1d20': 'negr', '#a4161a': 'roj', '#1f3f7a': 'azul',
  '#c8b89a': 'arena', '#6b7f3a': 'verde', '#e07a1f': 'naranja', '#7d1f3a': 'vino', '#3b6ea8': 'azul cielo',
};
// "al sedán rojo", "a la camioneta roja".
function nombreAuto(a) {
  const fem = a.tipo === 'camioneta';
  let c = NOMBRE_COLOR[a.color] || '';
  if (['blanc', 'negr', 'roj'].includes(c)) c += fem ? 'a' : 'o';
  return `${fem ? 'a la' : 'al'} ${MODELOS[a.tipo].nombre.toLowerCase()} ${c}`;
}

// Punto de inicio: sobre la Av. Lago de Pátzcuaro, junto a la Pista Cumbres.
function puntoDeInicio() {
  let mejor = null;
  for (const c of CALLES) {
    if (!c.n || !c.n.includes('Pátzcuaro')) continue;
    for (let k = 1; k < c.pts.length; k++) {
      const [ax, az] = c.pts[k - 1], [bx, bz] = c.pts[k];
      const r = distTramo(-150, 60, ax, az, bx, bz);
      if (!mejor || r.d < mejor.d) mejor = { ...r, c, dx: bx - ax, dz: bz - az };
    }
  }
  const l = Math.hypot(mejor.dx, mejor.dz);
  const dx = mejor.dx / l, dz = mejor.dz / l;
  const rx = -dz, rz = dx; // derecha del sentido de la calle
  // El auto queda estacionado junto a la banqueta y tú parado a su lado.
  const orilla = mejor.c.w / 2 - MODELOS.sedan.ancho / 2 - 0.35;
  const acera = mejor.c.w / 2 + 0.8;
  return {
    auto: { x: mejor.x + rx * orilla, z: mejor.z + rz * orilla, ang: Math.atan2(dx, dz) },
    pie: { x: mejor.x + rx * acera - dx * 1.5, z: mejor.z + rz * acera - dz * 1.5, yaw: Math.atan2(rx, rz) - 0.5 },
  };
}

async function iniciar() {
  // En celular se baja un poco la calidad para que corra fluido.
  const tactil = matchMedia('(pointer: coarse)').matches;
  const ligero = tactil || innerWidth < 800;
  const renderer = new THREE.WebGLRenderer({ antialias: !ligero, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, ligero ? 1.25 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  $('app').appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 9000);

  // Cielo de tarde despejada en el Bajío.
  const cielo = new Sky();
  cielo.scale.setScalar(12000);
  const su = cielo.material.uniforms;
  su.turbidity.value = 4.5;
  su.rayleigh.value = 1.0;
  su.mieCoefficient.value = 0.004;
  su.mieDirectionalG.value = 0.8;
  const dirSol = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(42), THREE.MathUtils.degToRad(215));
  su.sunPosition.value.copy(dirSol);
  escena.add(cielo);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const escenaCielo = new THREE.Scene();
  const copia = new Sky();
  copia.scale.setScalar(12000);
  copia.material.uniforms.sunPosition.value.copy(dirSol);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) copia.material.uniforms[k].value = su[k].value;
  escenaCielo.add(copia);
  const envMap = pmrem.fromScene(escenaCielo, 0, 1, 20000).texture;
  escena.environment = envMap;
  escena.environmentIntensity = 0.45;
  escena.fog = new THREE.Fog(0xbccbd6, 420, ligero ? 2400 : 3400);
  camara.far = ligero ? 3000 : 9000;
  camara.updateProjectionMatrix();

  const sol = new THREE.DirectionalLight(0xfff0d8, 3.1);
  sol.castShadow = true;
  sol.shadow.mapSize.set(ligero ? 1024 : 2048, ligero ? 1024 : 2048);
  const sc = sol.shadow.camera;
  sc.left = sc.bottom = -75;
  sc.right = sc.top = 75;
  sc.near = 10;
  sc.far = 700;
  sol.shadow.bias = -0.0005;
  escena.add(sol, sol.target);
  escena.add(new THREE.HemisphereLight(0xbfd6ee, 0x74664e, 0.65));

  estado('Pintando texturas…');
  await cuadro();
  const T = crearTexturas();
  const colisiones = new Colisiones();

  estado('Levantando el relieve real…');
  await cuadro();
  const terreno = medir('crearTerreno', () => crearTerreno(T, envMap));
  escena.add(terreno.grupo);

  estado(`Trazando ${MAPA.calles.length.toLocaleString('es-MX')} tramos de calle…`);
  await cuadro();
  const calles = medir('crearCalles', () => crearCalles(T));
  escena.add(calles.grupo);
  for (const p of calles.postes) colisiones.agregarCirculo(p.x, p.z, 0.15);

  estado(`Construyendo ${MAPA.casas.length.toLocaleString('es-MX')} casas…`);
  await cuadro();
  const casas = medir('crearCasas', () => crearCasas(T, envMap, ligero));
  escena.add(casas.grupo);
  for (const c of casas.casas) {
    for (let i = 0; i < c.pts.length; i++) {
      const [ax, az] = c.pts[i], [bx, bz] = c.pts[(i + 1) % c.pts.length];
      colisiones.agregarSegmento(ax, az, bx, bz, { casa: c.id });
    }
  }

  estado('Plantando jacarandas y mezquites…');
  await cuadro();
  const vegetacion = medir('crearVegetacion', () => crearVegetacion({ casas: casas.casas, jardines: casas.arboles, mezcla: terreno.mezcla, colisiones, ligero }));
  escena.add(vegetacion.grupo);

  estado('Poniendo plumas y casetas…');
  await cuadro();
  const accesos = crearAccesos(colisiones);
  escena.add(accesos);

  estado('Estacionando autos…');
  await cuadro();
  const matsAuto = materialesAuto(envMap);
  const estacionados = new Estacionados(casas.estacionamientos, matsAuto, colisiones);
  escena.add(estacionados.grupo);

  // Tu auto y tú, junto a la Pista Cumbres.
  const inicio = puntoDeInicio();
  const autos = [];
  const agregarAuto = (tipo, color, x, z, ang) => {
    const a = new Auto(tipo, color, matsAuto, x, z, ang);
    escena.add(a.grupo);
    autos.push(a);
    colisiones.dinamicos.push(a);
    return a;
  };
  agregarAuto('sedan', '#a4161a', inicio.auto.x, inicio.auto.z, inicio.auto.ang);

  const jugador = new Jugador(camara, colisiones);
  jugador.aparecer(inicio.pie.x, inicio.pie.z, inicio.pie.yaw);
  const hud = new Hud(casas.casas);
  const controles = new Controles(renderer.domElement);
  const sonido = new Sonido();

  let modo = 'pie';
  let auto = null;
  let vistaAuto = 0; // 0 atrás, 1 lejos, 2 cofre
  const orbita = { yaw: 0, pitch: 0, quieto: 0 };
  const camObj = new THREE.Vector3(), camMira = new THREE.Vector3();
  let camLista = false;

  function autoCercano() {
    let mejor = null, dm = 3;
    for (const a of autos) {
      if (a === auto) continue;
      for (const c of a.circulos()) {
        const d = Math.hypot(c.x - jugador.pos.x, c.z - jugador.pos.z) - c.r;
        if (d < dm) { dm = d; mejor = { dinamico: a }; }
      }
    }
    const e = estacionados.masCercano(jugador.pos.x, jugador.pos.z, dm);
    if (e) mejor = { estacionado: e };
    return mejor;
  }

  function subir() {
    const c = autoCercano();
    if (!c) return;
    if (c.estacionado) {
      const e = c.estacionado;
      estacionados.quitar(e);
      auto = agregarAuto(e.tipo, e.color, e.x, e.z, e.ang);
    } else {
      auto = c.dinamico;
    }
    modo = 'auto';
    jugador.volar = false;
    camLista = false;
    orbita.yaw = orbita.pitch = 0;
    actualizarBotones();
  }

  function bajar() {
    if (Math.abs(auto.velocidad) > 4) {
      avisoTemporal('Frena para bajarte');
      return;
    }
    // Sale por la puerta del conductor (lado izquierdo) o por la derecha.
    const fx = Math.sin(auto.ang), fz = Math.cos(auto.ang);
    const izq = { x: fz, z: -fx };
    for (const s of [1, -1]) {
      const p = { x: auto.pos.x + izq.x * s * (auto.M.ancho / 2 + 0.6), z: auto.pos.z + izq.z * s * (auto.M.ancho / 2 + 0.6) };
      const antes = { ...p };
      colisiones.resolver(p, 0.35);
      if (Math.hypot(p.x - antes.x, p.z - antes.z) < 0.3 || s === -1) {
        jugador.aparecer(p.x, p.z, auto.ang + Math.PI);
        break;
      }
    }
    auto.vel.set(0, 0);
    modo = 'pie';
    auto = null;
    sonido.motor(false, 0, 0, 0);
    actualizarBotones();
  }

  let avisoHasta = 0;
  function avisoTemporal(texto) {
    hud.aviso(texto);
    avisoHasta = performance.now() + 1800;
  }

  function reiniciar() {
    if (modo === 'auto') {
      const c = calleCercana(auto.pos.x, auto.pos.z, 200, true);
      if (c) {
        const ang = Math.atan2(Math.cos(c.ang), Math.sin(c.ang));
        auto.reiniciar(c.x, c.z, Math.cos(ang - auto.ang) >= 0 ? ang : ang + Math.PI);
      }
    } else {
      jugador.volar = false;
      jugador.aparecer(inicio.pie.x, inicio.pie.z, inicio.pie.yaw);
    }
  }

  const botonA = $('btn-a'), botonB = $('btn-b'), botonVolar = $('btn-fly'), botonAuto = $('btn-auto');
  function actualizarBotones() {
    const enAuto = modo === 'auto';
    botonA.textContent = enAuto ? 'Freno' : 'Correr';
    botonB.textContent = enAuto ? 'Cámara' : 'Saltar';
    botonAuto.textContent = enAuto ? 'Bajar' : 'Auto';
    botonVolar.hidden = enAuto;
    $('btn-casa').hidden = enAuto;
    $('crosshair').hidden = enAuto;
    $('ayuda-pie').hidden = enAuto;
    $('ayuda-auto').hidden = !enAuto;
  }

  const editor = new Editor({ ...casas, colisiones }, escena, () => {
    if (!tactil) controles.bloquear();
  });
  const abrirEditor = editor.abrir.bind(editor);
  editor.abrir = (id) => { abrirEditor(id); $('hint-lock').hidden = true; };
  function editarCasa() {
    if (editor.abierto) { editor.cerrar(); return; }
    if (modo !== 'pie') { avisoTemporal('Bájate del auto para editar casas'); return; }
    const id = editor.casaEnfrente(camara);
    if (id) editor.abrir(id);
    else avisoTemporal('Mira hacia una casa para editarla');
  }
  controles.accion('KeyP', editarCasa);
  controles.accion('Escape', () => { if (editor.abierto) editor.cerrar(); });
  controles.accion('KeyF', () => (modo === 'pie' ? subir() : bajar()));
  controles.accion('Enter', () => (modo === 'pie' ? subir() : bajar()));
  controles.accion('KeyC', () => { if (modo === 'auto') { vistaAuto = (vistaAuto + 1) % 3; camLista = false; } });
  controles.accion('KeyV', () => { if (modo === 'pie') jugador.volar = !jugador.volar; });
  controles.accion('KeyM', () => hud.alternarMapa());
  controles.accion('KeyH', () => { $('help').hidden = !$('help').hidden; });
  controles.accion('KeyR', reiniciar);
  controles.accion('KeyB', () => sonido.claxon());
  controles.accion('KeyN', () => avisoTemporal(sonido.alternar() ? 'Sonido apagado' : 'Sonido encendido'));

  if (tactil) {
    controles.activarTactil({
      'btn-auto': { tocar: () => (modo === 'pie' ? subir() : bajar()) },
      'btn-a': {
        tocar: (b) => {
          if (modo === 'auto') controles.tactil.mano = true;
          else { controles.tactil.correr = !controles.tactil.correr; b.setAttribute('aria-pressed', String(controles.tactil.correr)); }
        },
        soltar: () => { controles.tactil.mano = false; },
      },
      'btn-b': { tocar: () => { if (modo === 'auto') { vistaAuto = (vistaAuto + 1) % 3; camLista = false; } else controles.tactil.saltar = true; } },
      'btn-fly': { tocar: (b) => { jugador.volar = !jugador.volar; b.setAttribute('aria-pressed', String(jugador.volar)); } },
      'btn-horn': { tocar: () => sonido.claxon() },
      'btn-casa': { tocar: editarCasa },
    });
  }
  actualizarBotones();

  const overlay = $('overlay');
  estado('Listo');
  $('load').hidden = true;
  $('enter').hidden = false;
  $('enter').focus();
  $('enter').addEventListener('click', () => {
    overlay.hidden = true;
    $('hud').hidden = false;
    if (tactil) $('touch').hidden = false;
    sonido.iniciar();
    if (!tactil) controles.bloquear();
  });
  controles.alCambiarBloqueo = (b) => { $('hint-lock').hidden = b || tactil || editor.abierto; };
  renderer.domElement.addEventListener('click', () => { if (!controles.bloqueado && !tactil && overlay.hidden) controles.bloquear(); });

  addEventListener('resize', () => {
    camara.aspect = innerWidth / innerHeight;
    camara.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Cámara detrás del auto que no atraviesa las casas.
  function camaraAuto(dt, mirada) {
    const a = auto;
    orbita.yaw -= mirada.x;
    orbita.pitch = Math.max(-0.3, Math.min(0.9, orbita.pitch + mirada.y));
    if (Math.abs(mirada.x) + Math.abs(mirada.y) > 0.0005) orbita.quieto = 0;
    else orbita.quieto += dt;
    if (orbita.quieto > 1.2 && Math.abs(a.velocidad) > 2) {
      orbita.yaw *= Math.exp(-dt * 2.5);
      orbita.pitch *= Math.exp(-dt * 2.5);
    }
    const fx = Math.sin(a.ang), fz = Math.cos(a.ang);
    if (vistaAuto === 2) {
      // Asiento del conductor (a la izquierda).
      const izq = { x: fz, z: -fx };
      camara.position.set(a.pos.x + izq.x * 0.36 + fx * 0.05, a.pos.y + 1.12 + (a.M.techo[2] - 1.41) * 0.8, a.pos.z + izq.z * 0.36 + fz * 0.05);
      // La cámara mira hacia -z local: el cabeceo y el alabeo del auto van con signo contrario.
      camara.rotation.set(-a.pitch * 0.9 - 0.04 - orbita.pitch * 0.5, a.ang + Math.PI + orbita.yaw, -a.roll * 0.6, 'YXZ');
      camLista = false;
      return;
    }
    const dist = (vistaAuto === 1 ? 11.5 : 6.6) + Math.min(2, Math.abs(a.velocidad) * 0.04);
    const alto = (vistaAuto === 1 ? 4.2 : 2.3) + orbita.pitch * 4;
    const ang = a.ang + orbita.yaw;
    const ox = -Math.sin(ang) * dist, oz = -Math.cos(ang) * dist;
    const cx = a.pos.x, cz = a.pos.z, cy = a.pos.y + 1.4;
    const t = colisiones.rayo(cx, cz, cx + ox, cz + oz);
    const k2 = t < 1 ? Math.max(0.12, t - 0.06) : 1;
    // Si hay una pared atrás, la cámara se acerca y sube para ver por encima del auto.
    camObj.set(cx + ox * k2, a.pos.y + alto + (1 - k2) * 3.2, cz + oz * k2);
    camObj.y = Math.max(camObj.y, alturaEn(camObj.x, camObj.z) + 0.6);
    if (!camLista) { camara.position.copy(camObj); camLista = true; }
    else camara.position.lerp(camObj, 1 - Math.exp(-dt * (t < 1 ? 20 : 9)));
    camMira.set(cx + fx * 3, cy, cz + fz * 3);
    camara.lookAt(camMira);
  }

  let ultimo = performance.now();
  let t = 0;
  window.cumbresMundo = { calleCercana };
  window.cumbres = { renderer, jugador, camara, escena, autos, estacionados, colisiones, get auto() { return auto; }, subir, bajar };
  renderer.setAnimationLoop(() => {
    const ahora = performance.now();
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    t += dt;
    let foco;
    if (overlay.hidden && editor.abierto) {
      controles.consumirMirada();
      foco = jugador.pos;
    } else if (overlay.hidden) {
      const mirada = controles.consumirMirada();
      if (modo === 'pie') {
        jugador.yaw -= mirada.x;
        jugador.pitch = Math.max(-1.5, Math.min(1.5, jugador.pitch - mirada.y));
        jugador.actualizar(dt, controles.pie());
        foco = jugador.pos;
        if (performance.now() > avisoHasta) {
          const c = Math.floor(t * 10) % 3 === 0 ? autoCercano() : undefined;
          if (c !== undefined) {
            const a = c?.estacionado || c?.dinamico;
            hud.aviso(a ? `<kbd>F</kbd> Subir ${nombreAuto(a)}` : '');
          }
        }
      } else {
        const e = controles.auto();
        auto.actualizar(dt, e, colisiones);
        if (auto.golpe > 2.5) sonido.golpe(auto.golpe);
        sonido.motor(true, auto.velocidad, e.acelerar, auto.derrape);
        camaraAuto(dt, mirada);
        foco = auto.pos;
        if (performance.now() > avisoHasta) hud.aviso('');
      }
    } else {
      // Vuelo lento sobre la colonia mientras está la pantalla de inicio.
      const a = t * 0.04;
      camara.position.set(-150 + Math.cos(a) * 420, 150, 60 + Math.sin(a) * 420);
      camara.lookAt(-150, 0, 60);
      foco = camara.position;
    }
    accesos.userData.actualizar(dt, foco.x, foco.z);
    casas.grupo.userData.actualizar(camara.position);
    vegetacion.grupo.userData.actualizar(camara.position);
    terreno.grupo.children[2].userData.animar(t);
    sol.target.position.set(foco.x, foco.y, foco.z);
    sol.position.copy(sol.target.position).addScaledVector(dirSol, 400);
    if (overlay.hidden) {
      const rumbo = modo === 'auto' ? Math.PI - auto.ang : -jugador.yaw;
      hud.actualizar({
        x: foco.x, z: foco.z, y: foco.y, rumbo,
        velocidad: modo === 'auto' ? auto.velocidad : 0,
        enAuto: modo === 'auto',
        volando: jugador.volar && modo === 'pie',
      });
    }
    renderer.render(escena, camara);
  });
}

iniciar().catch((err) => {
  console.error(err);
  estado('No se pudo cargar el mapa. Revisa que tu navegador tenga WebGL activado.');
});
