// Pack 2 (server) — the dev server must survive its active file vanishing (bug #2).
import { spawn } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 5311;
const rel = 'tests/fixtures/_e2e_server.json';
const tmp = join(root, rel);
copyFileSync(join(root, 'tests', 'fixtures', 'hello.json'), tmp);

const srv = spawn('npx', ['tsx', 'packages/cli/src/serve.ts', rel, String(PORT)], { cwd: root, stdio: 'ignore' });
const R = []; const rec = (k, ok, d = '') => { R.push({ k, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}${d ? '  ::  ' + d : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p) => { try { const r = await fetch(`http://localhost:${PORT}${p}`); return { status: r.status }; } catch (e) { return { status: 0, err: String(e) }; } };
const waitUp = async () => { for (let i = 0; i < 50; i++) { if ((await get('/')).status === 200) return true; await sleep(250); } return false; };

try {
  rec('server starts', await waitUp());
  rec('GET /api/composition is 200', (await get('/api/composition')).status === 200);
  // bug #2: delete the active file out from under the server.
  rmSync(tmp, { force: true });
  await sleep(400);
  const after = await get('/api/composition');
  rec('survives active-file deletion (responds, not crashed)', after.status !== 0, `status=${after.status}`);
  rec('server still serving after the error', (await get('/')).status === 200);
} finally {
  srv.kill('SIGKILL');
  rmSync(tmp, { force: true });
}
const pass = R.filter((r) => r.ok).length;
console.log(`\nRESULT: ${pass}/${R.length}`);
process.exit(pass === R.length ? 0 : 1);
