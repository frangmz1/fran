import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { makeTextures, rand } from './textures.js';
import { makeMaterials } from './kit.js';
import { buildTerrain, buildFarHills } from './terrain.js';
import { buildCampus } from './campus.js';
import { buildFields } from './fields.js';
import { buildVegetation } from './vegetation.js';
import { Player } from './player.js';
import { Hud, setupTouch } from './hud.js';
import { SPAWN, toWorld } from './layout.js';

const $ = (id) => document.getElementById(id);
const status = (t) => { $('load-status').textContent = t; };
const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

async function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  $('app').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 7000);

  // Cielo y sol de media mañana.
  const sky = new Sky();
  sky.scale.setScalar(10000);
  const su = sky.material.uniforms;
  su.turbidity.value = 5;
  su.rayleigh.value = 1.1;
  su.mieCoefficient.value = 0.004;
  su.mieDirectionalG.value = 0.8;
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(40), THREE.MathUtils.degToRad(55));
  su.sunPosition.value.copy(sunDir);
  scene.add(sky);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const skyScene = new THREE.Scene();
  const skyCopy = new Sky();
  skyCopy.scale.setScalar(10000);
  skyCopy.material.uniforms.sunPosition.value.copy(sunDir);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) skyCopy.material.uniforms[k].value = su[k].value;
  skyScene.add(skyCopy);
  const envMap = pmrem.fromScene(skyScene, 0, 1, 20000).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.4;

  scene.fog = new THREE.Fog(0xb9c8d4, 450, 3200);

  const sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -90;
  sc.right = sc.top = 90;
  sc.near = 10;
  sc.far = 700;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xbcd4ee, 0x6d5f48, 0.6));

  status('Pintando texturas…');
  await frame();
  const T = makeTextures();
  const mats = makeMaterials(T, envMap);
  const colliders = [];

  status('Levantando el cerro…');
  await frame();
  const terrain = buildTerrain(T);
  scene.add(terrain.mesh, terrain.roadsGroup, buildFarHills());

  status('Construyendo los edificios…');
  await frame();
  const campus = buildCampus(mats, colliders, terrain.heightAt, T);
  scene.add(campus.group);

  status('Trazando las canchas de arriba…');
  await frame();
  const fields = buildFields(mats, colliders, T);
  scene.add(fields.group);

  status('Sembrando mezquites y nopales…');
  await frame();
  scene.add(
    buildVegetation({
      heightAt: terrain.heightAt,
      splatCanvas: terrain.splatCanvas,
      extraTrees: [...campus.trees, ...fields.trees],
      colliders,
    }),
  );
  scene.add(clouds());

  const player = new Player(camera, renderer.domElement, { heightAt: terrain.heightAt, colliders });
  const sp = toWorld(SPAWN.lx, SPAWN.lz);
  player.spawn(sp.x, sp.z, SPAWN.yaw);
  const hud = new Hud({ heightAt: terrain.heightAt, colliders, nearestOnRoad: terrain.nearestOnRoad, profiles: terrain.profiles });

  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (isTouch) setupTouch(player);

  // Arrastrar con el mouse para mirar cuando el puntero no está bloqueado.
  let drag = null;
  renderer.domElement.addEventListener('mousedown', (e) => { if (!player.locked) drag = { x: e.clientX, y: e.clientY }; });
  addEventListener('mouseup', () => { drag = null; });
  addEventListener('mousemove', (e) => {
    if (!drag || player.locked) return;
    player.yaw -= (e.clientX - drag.x) * 0.004;
    player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch - (e.clientY - drag.y) * 0.004));
    drag = { x: e.clientX, y: e.clientY };
  });

  const overlay = $('overlay');
  $('load').hidden = true;
  $('enter').hidden = false;
  $('enter').focus();
  const enter = () => {
    overlay.hidden = true;
    $('hud').hidden = false;
    if (!isTouch) player.lock();
  };
  $('enter').addEventListener('click', enter);
  player.onLockChange = (locked) => { $('hint-lock').hidden = locked || isTouch; };
  renderer.domElement.addEventListener('click', () => { if (!player.locked && !isTouch && overlay.hidden) player.lock(); });
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') $('help').hidden = !$('help').hidden;
    if (e.code === 'KeyR') player.spawn(sp.x, sp.z, SPAWN.yaw);
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  let last = performance.now();
  let t = 0;
  window.shv = { player, camera, scene };
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (overlay.hidden) player.update(dt);
    else {
      // Vista giratoria de fondo mientras está la pantalla de inicio.
      const a = t * 0.05;
      camera.position.set(40 + Math.cos(a) * 170, 70, 40 + Math.sin(a) * 170);
      camera.lookAt(20, 5, 40);
    }
    for (const f of campus.animated) f.update(t);
    // La sombra sigue a la cámara.
    const c = camera.position;
    sun.target.position.set(c.x, c.y - 10, c.z);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 350);
    hud.update(player);
    renderer.render(scene, camera);
  });
}

// Nubes tipo cúmulo hechas con sprites suaves.
function clouds() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const px = 50 + rand() * 156, py = 90 + rand() * 90, r = 25 + rand() * 45;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  for (let i = 0; i < 40; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, fog: false, depthWrite: false, opacity: 0.85, color: 0xf4f6fa });
    const s = new THREE.Sprite(m);
    const a = rand() * Math.PI * 2, r = 600 + rand() * 2200;
    s.position.set(Math.cos(a) * r, 380 + rand() * 300, Math.sin(a) * r);
    const k = 500 + rand() * 700;
    s.scale.set(k, k * 0.5, 1);
    group.add(s);
  }
  return group;
}

start().catch((err) => {
  console.error(err);
  status('No se pudo cargar el mapa. Revisa que tu navegador tenga WebGL activado.');
});
