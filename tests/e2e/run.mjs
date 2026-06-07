// e2e runner: executes every tests/e2e/*.test.mjs as its own process, tallies results.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort();
let failed = 0;
for (const f of files) {
  console.log(`\n──────── e2e: ${f} ────────`);
  const r = spawnSync('node', [join(dir, f)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
console.log(`\n════════ e2e total: ${files.length - failed}/${files.length} files passed ════════`);
process.exit(failed ? 1 : 0);
