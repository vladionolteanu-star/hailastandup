// CLI: reface snapshot-ul din public/data/events.js, cu tot cu ore si tarife.
// Snapshot-ul e fallback-ul cand /api/events nu raspunde (sau cand deschizi fisierul local).
//
// node scraper/snapshot.mjs [--no-details]

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get, parseDetail, scrapeListing, payloadOf } from './iabilet.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/events.js');
const WITH_DETAILS = !process.argv.includes('--no-details');
const CONCURRENCY = 4;

async function pooled(items, limit, worker) {
  const queue = [...items];
  let done = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      for (;;) {
        const item = queue.shift();
        if (!item) return;
        await worker(item);
        if (++done % 25 === 0) console.log(`  detalii ${done}/${items.length}`);
      }
    })
  );
}

const events = await scrapeListing();
console.log(`${events.length} evenimente`);

if (WITH_DETAILS) {
  console.log('iau ora si tarifele...');
  await pooled(events, CONCURRENCY, async (ev) => {
    if (!ev.url) return;
    try {
      const d = parseDetail(await get(ev.url));
      ev.time = d.time;
      ev.tariffs = d.tariffs;
    } catch (err) {
      console.warn(`  esec ${ev.id}: ${err.message}`);
    }
  });
}

const payload = payloadOf(events, { live: false });
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `window.EVENTS_DATA = ${JSON.stringify(payload)};\n`, 'utf8');

console.log(
  `scris ${OUT}\nora: ${events.filter((e) => e.time).length}/${events.length} · ` +
    `tarife: ${events.filter((e) => e.tariffs.length).length}/${events.length} · orase: ${payload.cities.length}`
);
