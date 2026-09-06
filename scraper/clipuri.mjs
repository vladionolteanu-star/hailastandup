// CLI: reface public/data/clipuri.js — „Ce merită văzut" de pe prima pagină.
//
//   node scraper/clipuri.mjs
//
// Sursa e ARHIVA de pe disc, nu feedurile RSS. RSS-ul dă 15 încărcări pe canal, plafon fix:
// pe canale active fereastra de 120 de zile nici nu încape în el. Se vedea în date — cu RSS,
// secțiunea arăta un clip cu 1.218 vizionări, în timp ce în aceeași fereastră stătea unul cu
// 1,7 milioane, pe care RSS-ul pur și simplu nu-l putea vedea.
//
// Recența e criteriu de INTRARE, vizionările sunt criteriu de ORDONARE. „Ultimele 2 de la
// fiecare canal" era o regulă de echitate între artiști, nu de calitate: cine posta ieri un
// clip slab ajungea pe primul rând.

import { writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esteVertical } from './youtube.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARHIVA = resolve(ROOT, 'public/data/arhiva');
const OUT = resolve(ROOT, 'public/data/clipuri.js');

const ZILE = 120;
const CATE = 12;
const PE_ARTIST = 2; // plafon, nu cotă: cine n-are material bun pur si simplu nu intra

const prag = new Date(Date.now() - ZILE * 86400000).toISOString();

const fisiere = (await readdir(ARHIVA)).filter((f) => f.endsWith('.js'));
if (!fisiere.length) {
  console.error(`Nimic in ${ARHIVA}. Ruleaza intai: npm run arhiva`);
  process.exit(1);
}

const bazin = [];
for (const f of fisiere) {
  const sursa = await readFile(resolve(ARHIVA, f), 'utf8');
  const scop = {};
  new Function('window', sursa)(scop);
  const a = scop.ARHIVA_ARTIST;
  if (!a) continue;
  for (const c of a.clipuri) {
    // Doar materialul scurt: banda de pe prima pagina e pentru un ras rapid, iar specialurile
    // si momentele de 45 de minute au raftul lor pe pagina artistului.
    if (c.fel !== 'clip' || c.publicat < prag) continue;
    bazin.push({ ...c, canal: a.canal, canalId: a.id });
  }
}

const pe = {};
const alese = bazin
  .sort((x, y) => (y.vizionari ?? 0) - (x.vizionari ?? 0))
  .filter((c) => {
    pe[c.slug] = pe[c.slug] ?? 0;
    if (pe[c.slug] >= PE_ARTIST) return false;
    pe[c.slug]++;
    return true;
  })
  .slice(0, CATE);

if (!alese.length) {
  console.error('Niciun clip in fereastra. Nu scriu nimic.');
  process.exit(1);
}

// Orientarea se cere doar pentru cele alese, nu pentru tot bazinul.
await Promise.all(
  alese.map(async (c) => {
    c.vertical = await esteVertical(c.id);
    c.poster = c.vertical
      ? `https://i.ytimg.com/vi/${c.id}/oardefault.jpg`
      : `https://i.ytimg.com/vi/${c.id}/maxresdefault.jpg`;
    c.posterMic = `https://i.ytimg.com/vi/${c.id}/hqdefault.jpg`;
  })
);

const payload = {
  source: 'arhiva de canal, YouTube Data API v3',
  culesLa: new Date().toISOString(),
  zile: ZILE,
  bazin: bazin.length,
  canale: new Set(alese.map((c) => c.canalId)).size,
  count: alese.length,
  clipuri: alese,
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `window.CLIPURI_DATA = ${JSON.stringify(payload)};\n`, 'utf8');

console.log(`scris ${OUT}`);
console.log(`${payload.count} clipuri de la ${payload.canale} comedianti, alese din ${bazin.length}`);
for (const c of alese) {
  console.log(`  ${String(c.vizionari).padStart(8)}  ${c.nume.padEnd(15)}${c.titlu.slice(0, 46)}`);
}
