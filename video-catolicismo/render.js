// Exporta el video cuadro por cuadro con Chromium + ffmpeg.
//   node render.js                      -> out/historia-iglesia.mp4
//   node render.js --stills 3,10.5,40   -> out/stills/*.jpg (vista previa)
//   node render.js --from 20 --to 40    -> solo ese tramo
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
const FPS = 30;
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const WORKERS = parseInt(opt('workers') || '4', 10);
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const URL_ = `http://127.0.0.1:${server.address().port}/index.html?render`;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE:', m.text()); });
  await page.goto(URL_);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}
const shot = page => page.screenshot({ type: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
const run = (a, input) => new Promise((res, rej) => {
  const p = spawn(ffmpeg, a, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
  let err = ''; p.stderr.on('data', d => err += d);
  p.on('close', c => c === 0 ? res() : rej(new Error(err.slice(-2000))));
  if (input) input(p.stdin);
});

const stills = opt('stills');
if (stills) {
  const dir = path.join(OUT, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const page = await openPage();
  const times = stills.split(',').map(Number);
  const files = [];
  for (const t of times) {
    await page.evaluate(t => window.renderAt(t), t);
    const f = path.join(dir, `t${t.toFixed(2)}.jpg`);
    fs.writeFileSync(f, await shot(page));
    files.push(f);
  }
  // Hojas de contacto de 2x2 a media resolución
  for (let i = 0; i < files.length; i += 4) {
    const grp = files.slice(i, i + 4);
    while (grp.length < 4) grp.push(grp[grp.length - 1]);
    const sheet = path.join(dir, `sheet-${times[i].toFixed(1)}.jpg`);
    await run(['-y', ...grp.flatMap(f => ['-i', f]), '-filter_complex',
      '[0]scale=960:540[a];[1]scale=960:540[b];[2]scale=960:540[c];[3]scale=960:540[d];[a][b]hstack[t];[c][d]hstack[u];[t][u]vstack', '-q:v', '3', sheet]);
    console.log(sheet);
  }
  await browser.close(); server.close();
  process.exit(0);
}

const page0 = await openPage();
const DUR = await page0.evaluate(() => window.DURATION);
await page0.close();
const from = parseFloat(opt('from') || '0'), to = parseFloat(opt('to') || String(DUR));
const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
const total = f1 - f0;
const per = Math.ceil(total / WORKERS);
console.log(`Duración ${DUR}s · cuadros ${f0}-${f1} · ${WORKERS} procesos`);
const started = Date.now();
let done = 0;
const segs = [];
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const a = f0 + w * per, b = Math.min(f1, a + per);
  if (a >= b) return;
  const seg = path.join(OUT, `seg${w}.mp4`);
  segs[w] = seg;
  const page = await openPage();
  await run(['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg],
    async stdin => {
      for (let f = a; f < b; f++) {
        await page.evaluate(t => window.renderAt(t), f / FPS);
        const buf = await shot(page);
        if (!stdin.write(buf)) await new Promise(r => stdin.once('drain', r));
        if (++done % 150 === 0) {
          const el = (Date.now() - started) / 1000;
          console.log(`${done}/${total} cuadros · ${el.toFixed(0)}s · faltan ~${(el / done * (total - done)).toFixed(0)}s`);
        }
      }
      stdin.end();
    });
  await page.close();
}));
const list = path.join(OUT, 'list.txt');
fs.writeFileSync(list, segs.filter(Boolean).map(s => `file '${s}'`).join('\n'));
const final = path.join(OUT, opt('out') || 'historia-iglesia.mp4');
await run(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', final]);
for (const s of segs.filter(Boolean)) fs.unlinkSync(s);
fs.unlinkSync(list);
console.log('Listo:', final, `(${((Date.now() - started) / 1000).toFixed(0)}s)`);
await browser.close(); server.close();
