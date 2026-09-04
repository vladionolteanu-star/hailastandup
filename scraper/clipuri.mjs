// CLI: reface snapshot-ul din public/data/clipuri.js.
// Snapshot-ul e ce vede omul cand /api/clipuri nu raspunde.
//
// node scraper/clipuri.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adunaClipuri } from './youtube.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/clipuri.js');

const payload = await adunaClipuri({ peCanal: 2 });

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `window.CLIPURI_DATA = ${JSON.stringify(payload)};\n`, 'utf8');

console.log(`scris ${OUT}\n${payload.count} clipuri de la ${payload.canale} canale`);
for (const e of payload.esecuri) console.warn(`  esec ${e.canal}: ${e.eroare}`);
