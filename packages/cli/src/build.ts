// Bundle the browser runtime into an IIFE (no CORS/module headaches in file://).
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

await build({
  entryPoints: [resolve(root, 'packages/renderer/src/runtime.ts')],
  outfile: resolve(root, 'packages/renderer/dist/runtime.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  sourcemap: false,
  logLevel: 'info',
});

console.log('✓ runtime bundled -> packages/renderer/dist/runtime.js');
