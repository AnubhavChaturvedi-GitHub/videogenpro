// Pack 3 — the determinism law + Match & Move correctness.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 5312;
const srv = spawn('npx', ['tsx', 'packages/cli/src/serve.ts', 'examples/_det.json', String(PORT)], { cwd: root, stdio: 'ignore' });
const R = []; const rec = (k, ok, d = '') => { R.push({ k, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}${d ? '  ::  ' + d : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
try {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch {} await sleep(250); }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 760 } });
  const errs = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('pageerror', (e) => errs.push('PE:' + e.message));
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.VGP?.seek === 'function' && document.querySelectorAll('#stage > div').length >= 2, { timeout: 14000 });
  await sleep(300);
  const seek = (t) => page.evaluate((tt) => window.VGP.seek(tt, { playing: false }), t);
  // scene container -> its layer child divs
  const layerStyle = (scene, child, prop) => page.evaluate(([s, c, p]) => { const el = document.querySelectorAll('#stage > div')[s].children[c]; return p === 'display' ? getComputedStyle(el).display : (p === 'cssText' ? el.style.cssText : el.style[p]); }, [scene, child, prop]);

  // #4 — a hidden matched layer must NOT be forced visible during the morph
  await seek(3.3); await sleep(60);
  const hiddenDisplay = await layerStyle(1, 1, 'display'); // scene1, 2nd layer = bg2 (hidden)
  rec('#4: hidden layer stays hidden during Match & Move', hiddenDisplay === 'none', `display=${hiddenDisplay}`);

  // #5 — seek(t) is a pure function of t: the same post-transition frame must be
  // byte-identical whether reached THROUGH the morph or not (no transformOrigin leak).
  await seek(3.5); await sleep(40); await seek(4.5); await sleep(40);
  const viaMorph = await layerStyle(1, 0, 'cssText'); // scene1 bg1 (the morphed/shared layer)
  await seek(0); await sleep(40); await seek(4.5); await sleep(40);
  const viaClean = await layerStyle(1, 0, 'cssText');
  rec('#5: forward-scrub == jump-scrub (no morph state leak)', viaMorph === viaClean, viaMorph === viaClean ? '' : `morph="${viaMorph}" vs clean="${viaClean}"`);

  // #9 — two css.transform presets must BOTH apply (compose), not last-wins
  await seek(0.2); await sleep(60);
  const tf = await layerStyle(0, 1, 'transform'); // scene0 bg2 has in.skew + in.flip-y
  rec('#9: stacked css.transform presets compose (skewX AND rotateY present)', /skewX/.test(tf) && /rotateY/.test(tf), tf);

  rec('no console errors', errs.length === 0, `count=${errs.length}`);
  errs.slice(0, 6).forEach((e, i) => console.log(`  err[${i}] ${e}`));
} finally {
  if (browser) await browser.close();
  srv.kill('SIGKILL');
}
const pass = R.filter((r) => r.ok).length;
console.log(`\nRESULT: ${pass}/${R.length}`);
process.exit(pass === R.length ? 0 : 1);
