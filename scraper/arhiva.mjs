// CLI: culege arhiva completa a canalelor active si scrie public/data/arhiva.js.
//
//   node scraper/arhiva.mjs                 toate canalele active
//   node scraper/arhiva.mjs micul-toma      doar un canal, dupa slug

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANALE_ACTIVE, dupaSlug } from './canale.mjs';
import { arhivaCanalului } from './youtube-api.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/arhiva.js');

// Cheia sta in .env.local, care e in .gitignore. Fara dependinte pentru asa ceva.
try {
  const env = await readFile(resolve(ROOT, '.env.local'), 'utf8');
  for (const linie of env.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linie);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* pe Vercel variabilele vin din mediu */ }

const cerut = process.argv[2];
const canale = cerut ? [dupaSlug(cerut)].filter(Boolean) : CANALE_ACTIVE;
if (!canale.length) {
  console.error(`Niciun canal activ pentru "${cerut ?? ''}".`);
  process.exit(1);
}

const artisti = [];
for (const c of canale) {
  process.stdout.write(`${c.nume}... `);
  try {
    const a = await arhivaCanalului(c);
    artisti.push(a);
    const pe = {};
    a.clipuri.forEach((v) => { pe[v.fel] = (pe[v.fel] ?? 0) + 1; });
    console.log(`${a.count} clipuri · ` + Object.entries(pe).map(([k, v]) => `${k} ${v}`).join(', '));
  } catch (err) {
    console.log(`ESEC: ${err.message}`);
  }
}

// Mai bine nicio scriere decat un fisier gol care ajunge pe site si goleste pagina.
if (!artisti.length || !artisti.some((a) => a.count)) {
  console.error('');
  console.error('Nimic cules. Nu scriu nimic. Verifica YOUTUBE_API_KEY si ca YouTube Data API v3 e activat pe proiect.');
  process.exit(1);
}

const payload = {
  source: 'YouTube Data API v3',
  culesLa: new Date().toISOString(),
  canale: artisti.length,
  count: artisti.reduce((n, a) => n + a.count, 0),
  artisti: artisti.map(({ clipuri, ...rest }) => ({ ...rest, clipuri })),
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `window.ARHIVA_DATA = ${JSON.stringify(payload)};\n`, 'utf8');

// Lista scurta a celor care chiar au pagina. Prima pagina o incarca in locul arhivei intregi,
// ca sa nu trimita omul catre o pagina goala.
const CU_PAGINA = resolve(ROOT, 'public/data/artisti.js');
const listaSlug = JSON.stringify(artisti.filter((a) => a.count).map((a) => a.slug));
await writeFile(CU_PAGINA, 'window.ARTISTI_CU_PAGINA = ' + listaSlug + ';' + String.fromCharCode(10), 'utf8');
console.log(`\nscris ${OUT}\n${payload.count} clipuri, ${payload.canale} canale`);
