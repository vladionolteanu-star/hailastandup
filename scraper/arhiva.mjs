// CLI: culege arhiva completa a canalelor active si scrie cate un fisier pe artist in
// public/data/arhiva/. Un singur fisier pentru toti ajunsese la 1 MB pe noua canale, iar
// pagina fiecarui artist il incarca intreg ca sa foloseasca a noua parte din el.
//
//   node scraper/arhiva.mjs                 toate canalele active
//   node scraper/arhiva.mjs micul-toma      doar un canal, dupa slug

import { writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANALE_ACTIVE, dupaSlug } from './canale.mjs';
import { arhivaCanalului } from './youtube-api.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/arhiva');

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

const cand = new Date().toISOString();

// Cate un fisier pe artist: pagina lui incarca doar ce arata. Toti la un loc fac 1 MB.
await mkdir(OUT, { recursive: true });
for (const a of artisti) {
  if (!a.count) continue;
  const unul = { source: 'YouTube Data API v3', culesLa: cand, ...a };
  await writeFile(resolve(OUT, `${a.slug}.js`), `window.ARHIVA_ARTIST = ${JSON.stringify(unul)};
`, 'utf8');
}

// Lista celor care chiar au pagina, citita de pe disc si nu din ce s-a cules acum: altfel un
// `node scraper/arhiva.mjs micul-toma` ar sterge din lista ceilalti opt artisti, care au fisier.
const CU_PAGINA = resolve(ROOT, 'public/data/artisti.js');
const peDisc = (await readdir(OUT)).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).sort();
await writeFile(CU_PAGINA, `window.ARTISTI_CU_PAGINA = ${JSON.stringify(peDisc)};
`, 'utf8');

const total = artisti.reduce((n, a) => n + a.count, 0);
console.log(`
scris ${OUT}
${total} materiale, ${artisti.filter((a) => a.count).length} canale`);
console.log(`${peDisc.length} artisti cu pagina: ${peDisc.join(', ')}`);
