// Print the AI-facing preset manifest (the menu an agent searches).
import { buildManifest } from '../../core/src/index';
const m = buildManifest();
console.log(JSON.stringify(m, null, 2));
console.error(`\n${m.length} presets across categories: ${[...new Set(m.map((e) => e.category))].join(', ')}`);
