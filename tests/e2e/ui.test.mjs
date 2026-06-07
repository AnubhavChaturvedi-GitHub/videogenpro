// Pack 7 — UI: export-menu Esc (#28), oversized-panel re-clamp (#12), Space on a
// property-section header must not start playback (#20).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 5315;
const srv = spawn('npx', ['tsx', 'packages/cli/src/serve.ts', 'examples/_uipack.json', String(PORT)], { cwd: root, stdio: 'ignore' });
const R = []; const rec = (k, ok, d = '') => { R.push({ k, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}${d ? '  ::  ' + d : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
try {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch {} await sleep(250); }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('pageerror', (e) => errs.push('PE:' + e.message));
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.clip', { timeout: 14000 });
  await page.waitForFunction(() => typeof window.VGP?.seek === 'function', { timeout: 14000 });
  await sleep(300);

  // #28 — export menu opens, closes on Escape
  await page.click('#export'); await sleep(150);
  const opened = await page.evaluate(() => !!document.querySelector('#exportMenu'));
  const items = await page.evaluate(() => document.querySelector('#exportMenu') ? [...document.querySelectorAll('#exportMenu .menu-item')].map((b) => b.innerText.trim()) : []);
  await page.keyboard.press('Escape'); await sleep(150);
  const closed = await page.evaluate(() => !document.querySelector('#exportMenu'));
  rec('#28: export menu opens (JSON+MP4) and closes on Escape', opened && closed && items.length === 2, JSON.stringify(items));

  // #20 — Space on a property-section header toggles the section WITHOUT starting playback
  await page.evaluate(() => { const c = document.querySelector('.clip:not(.audio-clip)'); if (c) { const b = c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: b.x + 20, clientY: b.y + b.height / 2 })); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); } });
  await page.evaluate(() => document.querySelector('#tabProps')?.click()); await sleep(200);
  const tBefore = await page.evaluate(() => document.querySelector('#tpTime')?.textContent);
  const colBefore = await page.evaluate(() => document.querySelectorAll('#rightBody .sec.collapsed').length);
  await page.evaluate(() => { const h = document.querySelector('#rightBody .sec-head'); h && h.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true })); });
  await sleep(450);
  const tAfter = await page.evaluate(() => document.querySelector('#tpTime')?.textContent);
  const colAfter = await page.evaluate(() => document.querySelectorAll('#rightBody .sec.collapsed').length);
  rec('#20: Space on a section header toggles it, does NOT start playback', tBefore === tAfter && colAfter !== colBefore, `time ${tBefore}->${tAfter}, collapsed ${colBefore}->${colAfter}`);

  // #12 — an oversized persisted panel size is capped to the viewport (preview not crushed)
  await page.evaluate(() => { localStorage.setItem('vgp.sideW', '3000'); localStorage.setItem('vgp.rightW', '3000'); });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('.clip', { timeout: 14000 }); await sleep(400);
  const g = await page.evaluate(() => ({ side: document.querySelector('.side').getBoundingClientRect().width, right: document.querySelector('.right').getBoundingClientRect().width, vw: window.innerWidth }));
  rec('#12: oversized persisted panels are capped to the viewport', g.side <= g.vw * 0.45 && g.right <= g.vw * 0.45, `side=${Math.round(g.side)} right=${Math.round(g.right)} vw=${g.vw}`);

  rec('no console errors', errs.length === 0, `count=${errs.length}`);
  errs.slice(0, 6).forEach((e, i) => console.log(`  err[${i}] ${e}`));
} finally {
  if (browser) await browser.close();
  srv.kill('SIGKILL');
}
const pass = R.filter((r) => r.ok).length;
console.log(`\nRESULT: ${pass}/${R.length}`);
process.exit(pass === R.length ? 0 : 1);
