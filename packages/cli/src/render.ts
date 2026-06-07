// Headless render: drive the runtime frame-by-frame via Playwright, capture
// PNGs, encode with ffmpeg. Deterministic — every frame is an explicit seek.
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
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
  // #6: the export must run as long as the PREVIEW — include audio tails that extend past
  // the last scene (compositionDuration only sums scene durations). Probe files lacking an
  // explicit duration so render == preview for narration that overruns the visuals.
  const probeDur = (f: string) => { try { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }); const d = parseFloat((r.stdout || '').trim()); return Number.isFinite(d) ? d : 0; } catch { return 0; } };
  let audioEnd = 0;
  for (const a of ((comp.audio ?? []) as any[])) {
    if (a.muted) continue;
    const file = (/^https?:|^file:/.test(a.src) ? a.src : resolve(dirname(absComp), a.src)).replace(/^file:\/\//, '');
    const len = a.duration ?? (probeDur(file) - (a.trimStart ?? 0));
    audioEnd = Math.max(audioEnd, (a.start ?? 0) + (Number.isFinite(len) && len > 0 ? len : 0));
  }
  const totalDur = Math.max(compositionDuration(comp), audioEnd);
  // B19: exactly round(totalDur*fps) frames, each at t = f/fps so the loop maps
  // cleanly onto [0, totalDur) — never requests t >= duration (which clamps oddly).
  const totalFrames = Math.max(1, Math.round(totalDur * comp.fps));
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

  // tsx transpiles this file with esbuild's keepNames, which wraps named inner functions in a
  // __name(...) helper. That helper is NOT defined in the browser, so any page.evaluate that
  // contains a named inner fn (e.g. the video-frame settle below) throws "__name is not
  // defined" — which broke EVERY export that has a video layer. Shim it as a no-op.
  await page.addInitScript({ content: 'globalThis.__name = globalThis.__name || function (f) { return f; };' });

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
  // resolve audio paths too so the browser preview can load them (otherwise file:// 404s
  // flood the page); ffmpeg still muxes audio from its own resolved paths separately.
  for (const a of ((resolved.audio ?? []) as any[])) { if (a.src && !/^https?:|^file:/.test(a.src)) a.src = new URL(a.src, assetBase).href; }
  await page.evaluate((c) => (window as any).VGP.mount(c), resolved);
  await page.evaluate(() => (window as any).VGP.ready());

  // ffmpeg reads raw PNGs from stdin -> mp4
  // audio tracks (voiceover, music) — mixed in with per-track delay + volume
  // collect EVERY audio source on the timeline: composition audio tracks (unmuted) PLUS
  // any VIDEO layer whose own audio is enabled (muted === false), offset by its scene
  // start and trimmed/limited to its clip window.
  type ASrc = { src: string; start: number; volume: number; trimStart: number; duration?: number; isVideo: boolean };
  const srcs: ASrc[] = [];
  for (const a of ((comp.audio ?? []) as any[])) { if (a.muted) continue; srcs.push({ src: a.src, start: a.start ?? 0, volume: a.volume ?? 1, trimStart: a.trimStart ?? 0, duration: a.duration, isVideo: false }); }
  { let off = 0; for (const s of comp.scenes) { for (const l of (s.layers as any[])) { if (l.type === 'video' && l.muted === false && l.src) srcs.push({ src: l.src, start: off + (l.start ?? 0), volume: l.volume ?? 1, trimStart: l.trimStart ?? 0, duration: l.duration ?? s.duration, isVideo: true }); } off += s.duration; } }
  const resolveSrc = (src: string) => (/^https?:|^file:/.test(src) ? src : resolve(dirname(absComp), src));
  const hasAudioStream = (file: string): boolean => { try { const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file], { encoding: 'utf8' }); if (r.error || r.status === null) return true; /* #21: ffprobe missing → assume audio present, don't silently drop real audio */ return r.status === 0 && /\d/.test(r.stdout || ''); } catch { return true; } };
  // B06: skip missing files; also skip a video whose file has NO audio stream (ffmpeg
  // would abort on a missing [a] pad). Resolve relative paths against the composition dir.
  const tracks = srcs.filter((a) => {
    if (/^https?:/.test(a.src)) return true;
    const fp = resolveSrc(a.src).replace(/^file:\/\//, '');
    if (!existsSync(fp)) { console.warn(`⚠ audio source missing, skipping: ${a.src}`); return false; }
    if (a.isVideo && !hasAudioStream(fp)) { console.warn(`⚠ video has no audio stream, skipping its audio: ${a.src}`); return false; }
    return true;
  });
  const audioArgs: string[] = []; const filters: string[] = [];
  tracks.forEach((a, i) => {
    audioArgs.push('-i', resolveSrc(a.src));
    const ms = Math.round(a.start * 1000); const vol = a.volume;
    // B01: trimStart sets where playback begins; duration caps the length. atrim first so
    // the subsequent adelay offsets the already-trimmed clip into the timeline.
    const ts = a.trimStart; const trimParts: string[] = [];
    if (ts || a.duration != null) { const endClause = a.duration != null ? `:end=${ts + a.duration}` : ''; trimParts.push(`atrim=start=${ts}${endClause}`, 'asetpts=PTS-STARTPTS'); }
    const trim = trimParts.length ? trimParts.join(',') + ',' : '';
    filters.push(`[${i + 1}:a]${trim}adelay=${ms}|${ms},volume=${vol}[a${i}]`);
  });
  const hasAudio = tracks.length > 0;
  if (hasAudio) filters.push(`${tracks.map((_, i) => `[a${i}]`).join('')}amix=inputs=${tracks.length}:normalize=0[aout]`);

  const ffArgs = ['-y', '-f', 'image2pipe', '-framerate', String(comp.fps), '-i', '-', ...audioArgs];
  // B06: with no valid audio tracks, render video-only (no -filter_complex / audio map).
  if (hasAudio) ffArgs.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]');
  // fast + high-quality: veryfast preset keeps the encoder ahead of the screenshot pipe (no
  // backpressure stalls), crf 18 is visually high quality. (Was preset=slow/crf=15 — much slower.)
  ffArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '18', '-profile:v', 'high', '-level', '4.2', '-movflags', '+faststart');
  if (hasAudio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-t', String(totalDur));
  ffArgs.push(absOut);
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  // B06: a missing/unspawnable ffmpeg must produce a clear error + non-zero exit,
  // not a silent hang on the stdin pipe.
  let ffFailed = false;
  ff.on('error', (err: NodeJS.ErrnoException) => {
    ffFailed = true;
    if (err.code === 'ENOENT') console.error('ffmpeg not found on PATH — install ffmpeg to export video.');
    else console.error('failed to start ffmpeg:', err.message);
    process.exit(1);
  });
  ff.stdin.on('error', () => { /* swallow EPIPE if ffmpeg died; the error handler reports it */ });

  const stage = await page.$('#stage');
  if (!stage) throw new Error('#stage not found');

  // B05: does the current frame contain any <video> layers? Only then do we pay
  // the extra settle cost — keeps non-video renders fast.
  const hasVideoLayers = resolved.scenes.some((s: any) => s.layers.some((l: any) => l.type === 'video'));
  const thumbEvery = Math.max(1, Math.floor(totalFrames / 24)); // ~24 live-preview thumbnails over the whole render

  for (let f = 0; f < totalFrames; f++) {
    if (ffFailed) break;
    const t = f / comp.fps;
    await page.evaluate((tt) => (window as any).VGP.seek(tt), t);
    if (hasVideoLayers) {
      // B05: after seeking, let video layers actually paint the seeked frame before
      // screenshotting, otherwise we can capture a stale/duplicate decode. Prefer
      // requestVideoFrameCallback (fires when a new video frame is presented), fall
      // back to a double rAF settle.
      await page.evaluate(() => new Promise<void>((res) => {
        const vids = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
        const rvfc = vids.filter((v) => typeof (v as any).requestVideoFrameCallback === 'function');
        if (rvfc.length) {
          let pending = rvfc.length;
          const done = () => { if (--pending <= 0) res(); };
          // safety timeout so a paused/ended/idle video can't stall the render. Kept short:
          // when a new frame WILL present, rVFC fires in ~16-33ms; when it won't (video idle
          // for much of the timeline), we must not burn 300ms/frame — that's the "stuck" crawl.
          const to = setTimeout(res, 60);
          rvfc.forEach((v) => (v as any).requestVideoFrameCallback(() => { clearTimeout(to); done(); }));
        } else {
          requestAnimationFrame(() => requestAnimationFrame(() => res()));
        }
      }));
    }
    // JPEG is far faster to capture AND pipe than PNG (≈30× smaller → ffmpeg never backpressures
    // the screenshot loop); q90 stays high-quality through the x264 encode.
    const buf = await stage.screenshot({ type: 'jpeg', quality: 90 });
    if (ffFailed) break;
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    process.stdout.write(`@P ${f + 1} ${totalFrames}\n`); // machine-readable progress (parsed by the dev server)
    if (f % thumbEvery === 0 || f === totalFrames - 1) process.stdout.write(`@T ${buf.toString('base64')}\n`); // reuse the frame as the live preview — no second screenshot
  }
  ff.stdin.end();
  process.stdout.write(`\r  rendered ${totalFrames}/${totalFrames} frames        \n`);
  await new Promise<void>((res) => ff.on('close', () => res()));
  await browser.close();
  console.log(`✓ ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
