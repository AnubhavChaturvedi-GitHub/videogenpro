// Headless render: drive the runtime frame-by-frame via Playwright, capture
// PNGs, encode with ffmpeg. Deterministic — every frame is an explicit seek.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { validateComposition, compositionDuration } from '../../core/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

async function main() {
  const [compPath, outPath = 'out/output.mp4'] = process.argv.slice(2);
  if (!compPath) {
    console.error('usage: pnpm render <composition.json> [out.mp4]');
    process.exit(1);
  }
  const absComp = resolve(process.cwd(), compPath);
  const absOut = resolve(process.cwd(), outPath);
  mkdirSync(dirname(absOut), { recursive: true });

  const raw = JSON.parse(readFileSync(absComp, 'utf8'));
  const comp = validateComposition(raw);
  const totalDur = compositionDuration(comp);
  const totalFrames = Math.round(totalDur * comp.fps);
  console.log(`▶ ${comp.width}x${comp.height} @ ${comp.fps}fps · ${totalDur.toFixed(2)}s · ${totalFrames} frames`);

  if (!existsSync(resolve(root, 'packages/renderer/dist/runtime.js'))) {
    console.error('runtime not built. run: pnpm build:runtime');
    process.exit(1);
  }

  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({
    viewport: { width: comp.width, height: comp.height },
    deviceScaleFactor: 1,
  });
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [page error]', m.text()); });
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

  const indexUrl = pathToFileURL(resolve(root, 'packages/renderer/index.html')).href;
  await page.goto(indexUrl);
  // resolve asset paths relative to the composition file
  const assetBase = pathToFileURL(dirname(absComp) + '/').href;
  const resolved = JSON.parse(JSON.stringify(comp));
  for (const s of resolved.scenes) for (const l of s.layers) {
    if ((l.type === 'image' || l.type === 'video') && l.src && !/^https?:|^file:/.test(l.src)) {
      l.src = new URL(l.src, assetBase).href;
    }
  }
  await page.evaluate((c) => (window as any).VGP.mount(c), resolved);
  await page.evaluate(() => (window as any).VGP.ready());

  // ffmpeg reads raw PNGs from stdin -> mp4
  const ff = spawn('ffmpeg', [
    '-y', '-f', 'image2pipe', '-framerate', String(comp.fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18',
    absOut,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const stage = await page.$('#stage');
  if (!stage) throw new Error('#stage not found');

  for (let f = 0; f < totalFrames; f++) {
    const t = f / comp.fps;
    await page.evaluate((tt) => (window as any).VGP.seek(tt), t);
    const buf = await stage.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % comp.fps === 0) process.stdout.write(`\r  rendering ${f}/${totalFrames} (${(t).toFixed(1)}s)   `);
  }
  ff.stdin.end();
  process.stdout.write(`\r  rendered ${totalFrames}/${totalFrames} frames        \n`);
  await new Promise<void>((res) => ff.on('close', () => res()));
  await browser.close();
  console.log(`✓ ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
