// Pack 6 — export must run as long as the preview (audio tail) and include audio (#6).
// Slower e2e: it actually renders a tiny clip with ffmpeg.
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const R = []; const rec = (k, ok, d = '') => { R.push({ k, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}${d ? '  ::  ' + d : ''}`); };
const compRel = 'tests/fixtures/_rend.json';
const comp = join(root, compRel); const out = join(root, 'out', '_rend.mp4');
// 1s of visuals, 2.5s of audio (no explicit length on the scene) → export must be ~2.5s.
// Includes a VIDEO layer so the render exercises the per-frame video settle (page.evaluate)
// — the regression guard for the "__name is not defined" crash that broke EVERY export
// containing a video (a shape-only comp never hit that code path).
writeFileSync(comp, JSON.stringify({ fps: 24, width: 320, height: 180, audio: [{ src: 'tone.mp3', start: 0, duration: 2.5, volume: 1 }], scenes: [{ duration: 1, background: '#102030', layers: [{ type: 'video', src: 'clip.mp4', rect: { x: 0, y: 0, w: 320, h: 180 } }, { type: 'shape', shape: 'rect', fill: '#e23', rect: { x: 60, y: 40, w: 200, h: 100 } }] }] }));
const probe = (args) => (spawnSync('ffprobe', args.concat([out]), { encoding: 'utf8' }).stdout || '').trim();
try {
  if (!existsSync(join(root, 'packages/renderer/dist/runtime.js'))) spawnSync('pnpm', ['build:runtime'], { cwd: root, stdio: 'ignore' });
  rmSync(out, { force: true });
  const r = spawnSync('npx', ['tsx', 'packages/cli/src/render.ts', compRel, 'out/_rend.mp4'], { cwd: root, stdio: 'ignore' });
  rec('render exits 0', r.status === 0);
  const dur = parseFloat(probe(['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0']));
  const aud = probe(['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0']);
  rec('#6: export keeps the audio tail (1s scene + 2.5s audio ⇒ ~2.5s, not 1s)', Number.isFinite(dur) && dur >= 2.3, `duration=${dur}`);
  rec('export includes an audio stream', /\w/.test(aud), `audio=${aud}`);
} finally { rmSync(comp, { force: true }); rmSync(out, { force: true }); }
const pass = R.filter((x) => x.ok).length; console.log(`\nRESULT: ${pass}/${R.length}`); process.exit(pass === R.length ? 0 : 1);
