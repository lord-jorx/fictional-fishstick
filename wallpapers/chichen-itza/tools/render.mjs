// Render determinista de fotogramas con Chromium headless.
//
//   node tools/render.mjs --out frames/ [--w 1320 --h 2868] [--fps 30] [--seconds 16]
//   node tools/render.mjs --still 4.5 --out still.png
//   --loop 6   duración del bucle en s (ColorOS limita los fondos de vídeo a 6 s)
//
// Variables: CHROMIUM (ruta al ejecutable; por defecto el de Playwright en /opt/pw-browsers)
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..', 'web');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, a) => {
  if (v.startsWith('--')) acc.push([v.slice(2), a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : true]);
  return acc;
}, []));
const W = +(args.w || 1320), H = +(args.h || 2868);
const fps = +(args.fps || 30), seconds = +(args.seconds || 16);
const from = +(args.from || 0);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  try {
    const p = join(webRoot, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const body = await readFile(p.endsWith('/') ? join(p, 'index.html') : p);
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
const loop = args.loop ? `&loop=${args.loop}` : '';
await page.goto(`http://127.0.0.1:${port}/index.html?capture&w=${W}&h=${H}${loop}`);
await page.waitForFunction(() => window.wallpaperReady || document.body.dataset.error, null, { timeout: 120000 });
const err = await page.evaluate(() => document.body.dataset.error);
if (err) throw new Error(err);

const grab = async (t) => {
  const url = await page.evaluate((tt) => window.renderAt(tt), t);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
};

if (args.still !== undefined) {
  await mkdir(dirname(resolve(args.out)), { recursive: true });
  await writeFile(args.out, await grab(+args.still));
  console.log('still →', args.out);
} else {
  const out = resolve(args.out || 'frames');
  await mkdir(out, { recursive: true });
  const n = Math.round(seconds * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const png = await grab(from + i / fps);
    await writeFile(join(out, `f${String(i).padStart(4, '0')}.png`), png);
    if (i % 15 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${i + 1}/${n}  ${(el / (i + 1)).toFixed(2)} s/frame`);
    }
  }
}
await browser.close();
server.close();
