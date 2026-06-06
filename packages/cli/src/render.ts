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
  // audio tracks (voiceover, music) — mixed in with per-track delay + volume
  const tracks = (comp.audio ?? []) as Array<{ src: string; start?: number; volume?: number; trimStart?: number }>;
  const audioArgs: string[] = []; const filters: string[] = [];
  tracks.forEach((a, i) => {
    const ap = /^https?:|^file:/.test(a.src) ? a.src : resolve(dirname(absComp), a.src);
    audioArgs.push('-i', ap);
    const ms = Math.round((a.start ?? 0) * 1000); const vol = a.volume ?? 1;
    const trim = a.trimStart ? `atrim=start=${a.trimStart},asetpts=PTS-STARTPTS,` : '';
    filters.push(`[${i + 1}:a]${trim}adelay=${ms}|${ms},volume=${vol}[a${i}]`);
  });
  const hasAudio = tracks.length > 0;
  if (hasAudio) filters.push(`${tracks.map((_, i) => `[a${i}]`).join('')}amix=inputs=${tracks.length}:normalize=0[aout]`);

  const ffArgs = ['-y', '-f', 'image2pipe', '-framerate', String(comp.fps), '-i', '-', ...audioArgs];
  if (hasAudio) ffArgs.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]');
  ffArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '15', '-profile:v', 'high', '-level', '4.2', '-movflags', '+faststart');
  if (hasAudio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-t', String(totalDur));
  ffArgs.push(absOut);
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  const stage = await page.$('#stage');
  if (!stage) throw new Error('#stage not found');

  for (let f = 0; f < totalFrames; f++) {
    const t = f / comp.fps;
    await page.evaluate((tt) => (window as any).VGP.seek(tt), t);
    const buf = await stage.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    process.stdout.write(`@P ${f + 1} ${totalFrames}\n`); // machine-readable progress (parsed by the dev server)
  }
  ff.stdin.end();
  process.stdout.write(`\r  rendered ${totalFrames}/${totalFrames} frames        \n`);
  await new Promise<void>((res) => ff.on('close', () => res()));
  await browser.close();
  console.log(`✓ ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
