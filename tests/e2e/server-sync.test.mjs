// Pack 5 — the save↔SSE wipe-loop (#3). A user's own POST must NOT echo back as a
// 'doc' event (self-echo), but a genuine external/agent file write MUST broadcast.
import { spawn } from 'node:child_process';
import { copyFileSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 5314;
const rel = 'tests/fixtures/_e2e_sync.json';
const tmp = join(root, rel);
copyFileSync(join(root, 'tests', 'fixtures', 'hello.json'), tmp);

const srv = spawn('npx', ['tsx', 'packages/cli/src/serve.ts', rel, String(PORT)], { cwd: root, stdio: 'ignore' });
const R = []; const rec = (k, ok, d = '') => { R.push({ k, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}${d ? '  ::  ' + d : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${PORT}`;

const docEvents = [];
let streaming = true;
async function listenSSE() {
  try {
    const res = await fetch(`${base}/api/events`);
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
    while (streaming) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf('\n\n')) >= 0) { const chunk = buf.slice(0, i); buf = buf.slice(i + 2); const m = chunk.match(/^data: (.*)$/m); if (m) { try { const o = JSON.parse(m[1]); if (o.t === 'doc') docEvents.push(o); } catch {} } }
    }
  } catch {}
}

try {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`${base}/`)).ok) break; } catch {} await sleep(250); }
  listenSSE(); await sleep(300);
  const ir = (await (await fetch(`${base}/api/composition`)).json()).ir;

  // 1) a USER POST must not produce a self-echo 'doc' event
  const n0 = docEvents.length;
  const edited = { ...ir, name: 'sync-test-1' };
  const r = await fetch(`${base}/api/composition`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(edited) });
  await sleep(700);
  rec('POST saved ok', (await r.json()).ok === true);
  rec('#3: a user POST does NOT echo back as a phantom doc event', docEvents.length === n0, `doc events after POST: ${docEvents.length - n0}`);

  // 2) a genuine EXTERNAL write (agent) MUST broadcast a 'doc' event
  const n1 = docEvents.length;
  writeFileSync(tmp, JSON.stringify({ ...ir, name: 'agent-wrote-this' }, null, 2));
  await sleep(700);
  rec('external/agent file edit still syncs to the client', docEvents.length > n1, `doc events after external write: ${docEvents.length - n1}`);
} finally {
  streaming = false;
  srv.kill('SIGKILL');
  rmSync(tmp, { force: true });
}
const pass = R.filter((r) => r.ok).length;
console.log(`\nRESULT: ${pass}/${R.length}`);
process.exit(pass === R.length ? 0 : 1);
