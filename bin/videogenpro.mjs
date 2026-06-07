#!/usr/bin/env node
// VideoGenPro CLI entry — runs the TypeScript CLI via tsx (shipped as a runtime dependency).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, '../packages/cli/src/cli.ts');
const child = spawn(process.execPath, ['--import', 'tsx', cli, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
