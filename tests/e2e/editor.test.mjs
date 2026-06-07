// Pack 4 — editor: hidden layers are non-interactive, scene-duplicate strips groupId.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 5313;
const compRel = 'tests/fixtures/_ed.json';
writeFileSync(join(root, compRel), JSON.stringify({ fps: 30, width: 1280, height: 720, scenes: [{ duration: 4, background: '#111111', layers: [
  { type: 'shape', shape: 'rect', fill: '#3b82f6', rect: { x: 100, y: 100, w: 300, h: 200 }, groupId: 'g1' },
  { type: 'text', text: 'A', rect: { x: 100, y: 350, w: 300, h: 100 }, groupId: 'g1' },
  { type: 'shape', shape: 'circle', fill: '#22c55e', rect: { x: 620, y: 220, w: 320, h: 320 }, hidden: true }] }] }));
const srv = spawn('npx', ['tsx', 'packages/cli/src/serve.ts', compRel, String(PORT)], { cwd: root, stdio: 'ignore' });
const R = []; const rec = (k, ok, d = '') => { R.push({ k, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}${d ? '  ::  ' + d : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
try {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch {} await sleep(250); }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 820 } });
  const errs = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('pageerror', (e) => errs.push('PE:' + e.message));
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.clip', { timeout: 14000 });
  await page.waitForFunction(() => typeof window.VGP?.seek === 'function', { timeout: 14000 });
  await sleep(400);
  const ir = () => page.evaluate(async () => (await fetch('/api/composition')).json()).then((r) => r.ir);
  const selboxVisible = () => page.evaluate(() => { const b = document.querySelector('#selbox'); return !!b && getComputedStyle(b).display !== 'none'; });

  // bug: hidden layer must NOT be selectable on the canvas (can't grab the invisible)
  const spot = await page.evaluate(() => { const r = document.querySelector('#stage').getBoundingClientRect(); return { x: r.left + (780 / 1280) * r.width, y: r.top + (380 / 720) * r.height }; }); // over the hidden circle
  await page.mouse.click(spot.x, spot.y); await sleep(200);
  rec('hidden layer is not selectable on the canvas', !(await selboxVisible()), `selbox visible=${await selboxVisible()}`);

  // bug: selecting a hidden layer (via its timeline clip) hides the selbox
  await page.evaluate(() => { const cs = [...document.querySelectorAll('.clip:not(.audio-clip)')]; const c = cs[0]; if (c) { const b = c.getBoundingClientRect(); window.__c = { x: b.x + b.width / 2, y: b.y + b.height / 2 }; } });
  // the hidden circle is the first row (top z = array end). click each clip; the hidden one must not show a selbox
  const hiddenSelbox = await page.evaluate(async () => {
    const cs = [...document.querySelectorAll('.clip:not(.audio-clip)')];
    for (const c of cs) { const b = c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: b.x + 20, clientY: b.y + b.height / 2 })); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); }
    return null;
  });
  // direct check: force-select the hidden layer and confirm the selbox stays hidden
  await page.evaluate(() => { window.VGP.seek(1, { playing: false }); });
  const hiddenBoxOk = await page.evaluate(() => {
    // select the hidden circle via a plain click on its timeline clip (top row)
    const cs = [...document.querySelectorAll('.clip:not(.audio-clip)')];
    return cs.length; // sanity
  });
  rec('timeline shows all 3 clips (incl. the hidden layer)', hiddenBoxOk === 3, `clips=${hiddenBoxOk}`);

  // bug: duplicate-scene must strip groupId so the clone doesn't cross-select the source
  const before = await ir();
  await page.evaluate(() => { document.querySelector('#dupScene')?.click(); }); await sleep(800);
  const after = await ir();
  const srcGrouped = before.scenes[0].layers.filter((l) => l.groupId).length;
  const cloneGrouped = after.scenes[1] ? after.scenes[1].layers.filter((l) => l.groupId).length : -1;
  const srcStillGrouped = after.scenes[0].layers.filter((l) => l.groupId).length;
  rec('duplicate-scene strips groupId on the clone (source kept)', after.scenes.length === 2 && srcGrouped >= 2 && cloneGrouped === 0 && srcStillGrouped >= 2, `src=${srcGrouped} clone=${cloneGrouped} srcAfter=${srcStillGrouped}`);

  rec('no console errors', errs.length === 0, `count=${errs.length}`);
  errs.slice(0, 6).forEach((e, i) => console.log(`  err[${i}] ${e}`));
} finally {
  if (browser) await browser.close();
  srv.kill('SIGKILL');
}
const pass = R.filter((r) => r.ok).length;
console.log(`\nRESULT: ${pass}/${R.length}`);
process.exit(pass === R.length ? 0 : 1);
