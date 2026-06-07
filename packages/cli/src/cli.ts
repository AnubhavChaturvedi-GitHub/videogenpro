// VideoGenPro CLI dispatcher — `videogenpro <command> [args]`.
// Routes the subcommand to the matching module (each runs its main() on import).
const [cmd, ...rest] = process.argv.slice(2);
const map: Record<string, string> = {
  studio: './serve.ts',
  render: './render.ts',
  build: './build.ts',
  manifest: './manifest.ts',
  preview: './preview.ts',
};

if (!cmd || !(cmd in map)) {
  console.log([
    'VideoGenPro — deterministic, agent-authorable video engine',
    '',
    'Usage:',
    '  videogenpro studio <composition.json> [port]            open the editor (default port 5174)',
    '  videogenpro render <composition.json> <out.mp4> [height] export to MP4 (height e.g. 1080)',
    '  videogenpro build                                        (re)build the runtime + editor bundles',
    '  videogenpro manifest                                     print the preset catalog',
  ].join('\n'));
  process.exit(cmd ? 1 : 0);
}

// Reshape argv so the target module sees ITS arguments at argv[2..] (it reads process.argv directly).
process.argv = [process.argv[0], 'videogenpro', ...rest];
await import(map[cmd]);
export {};
