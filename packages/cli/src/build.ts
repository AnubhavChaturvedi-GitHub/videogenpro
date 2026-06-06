// Bundle the browser runtime into an IIFE (no CORS/module headaches in file://).
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

const common = { bundle: true, format: 'iife' as const, platform: 'browser' as const, target: 'es2022', sourcemap: false, logLevel: 'info' as const };

await build({
  ...common,
  entryPoints: [resolve(root, 'packages/renderer/src/runtime.ts')],
  outfile: resolve(root, 'packages/renderer/dist/runtime.js'),
});
console.log('✓ runtime bundled -> packages/renderer/dist/runtime.js');

await build({
  ...common,
  entryPoints: [resolve(root, 'packages/editor/src/editor.ts')],
  outfile: resolve(root, 'packages/editor/dist/editor.js'),
});
console.log('✓ editor bundled -> packages/editor/dist/editor.js');
