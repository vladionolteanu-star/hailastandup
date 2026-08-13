// Parsare iaBilet, categoria stand-up comedy. Fara dependinte.
// Folosit de functiile din api/ (live) si de scraper/snapshot.mjs (CLI).

export const ORIGIN = 'https://www.iabilet.ro';
const LIST = `${ORIGIN}/bilete-stand-up-comedy?filters%5Bcategory%5D%5B0%5D=stand-up-comedy&filtersSubmitted=1`;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function get(url, { attempt = 1, timeout = 12000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, 'accept-language': 'ro-RO,ro;q=0.9' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt >= 3) throw err;
    await sleep(500 * attempt);
    return get(url, { attempt: attempt + 1, timeout });
  } finally {
    clearTimeout(timer);
  }
}

/** "82,82" -> 82.82 ; "1.234,50" -> 1234.5 */
export function money(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/\s/g, '');
  const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isFinite(n) ? n : null;
}

function decodeEntities(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

// Fiecare rand din listing e precedat de blocul JSON-LD care il descrie.
const TOKEN =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>|<div\s+data-event-list="item"\s+class="([^"]*)"[^>]*?data-likable-item="event\/(\d+)"/g;

export function parseListing(html) {
  const events = [];
  let pending = null;

  for (const m of html.matchAll(TOKEN)) {
    if (m[1] !== undefined) {
      try {
        const ld = JSON.parse(m[1].replace(/\/\*<!\[CDATA\[\*\/|\/\*\]\]>\*\//g, '').trim());
        pending = ld['@type'] === 'Event' ? ld : null;
      } catch {
        pending = null;
      }
      continue;
    }

    if (!pending) continue;
    const ld = pending;
    pending = null;
    const classes = m[2] || '';

    events.push({
      id: m[3],
      title: ld.name?.trim() ?? '',
      url: ld.url || null,
      description: ld.description?.trim() ?? '',
      image: ld.image || null,
      startDate: ld.startDate || null,
      endDate: ld.endDate || null,
      multiDay: classes.includes('event-multi-day'),
      soldOut: classes.includes('event-sold-out'),
      venue: ld.location?.name?.trim() ?? null,
      address: ld.location?.address?.streetAddress?.trim() ?? null,
      city: ld.location?.address?.addressLocality?.trim() ?? null,
      priceFrom: money(ld.offers?.price),
      currency: ld.offers?.priceCurrency ?? 'RON',
      time: null,
      tariffs: [],
    });
  }

  return events;
}

const TARIFF =
  /data-is-tariff="1"[^>]*?data-tariff-id="(\d+)"[^>]*?data-tariff-name="([^"]*)"[^>]*?data-tariff-sell-price="([^"]*)"[^>]*?data-tariff-sell-currency="([^"]*)"/g;

export function parseDetail(html) {
  const flat = html.replace(/\s+/g, ' ');
  const og = flat.match(/property="og:description" content="([^"]*)"/);
  const time = og?.[1].match(/ora\s+(\d{1,2}:\d{2})/)?.[1] ?? null;

  const seen = new Set();
  const tariffs = [];
  for (const t of flat.matchAll(TARIFF)) {
    if (seen.has(t[1])) continue;
    seen.add(t[1]);
    tariffs.push({ id: t[1], name: decodeEntities(t[2]), price: money(t[3]), currency: t[4] || 'RON' });
  }

  return { time, tariffs };
}

/** Doar URL-uri de eveniment de pe iaBilet. Blocheaza SSRF pe /api/event. */
export function safeEventUrl(raw) {
  let u;
  try {
    u = new URL(String(raw));
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (u.hostname !== 'www.iabilet.ro' && u.hostname !== 'iabilet.ro') return null;
  if (!/^\/bilete-[a-z0-9-]+-\d+\/?$/i.test(u.pathname)) return null;
  return `https://www.iabilet.ro${u.pathname}`;
}

/**
 * Paginile de listing, secvential. Cerute in paralel, iaBilet returneaza pagini
 * inconsistente si pierzi evenimente; 11 cereri una dupa alta dureaza ~5s si le prinde pe toate.
 */
export async function scrapeListing({ maxPages = 15 } = {}) {
  const byId = new Map();

  for (let page = 1; page <= maxPages; page++) {
    const batch = parseListing(await get(page === 1 ? LIST : `${LIST}&page=${page}`));
    if (!batch.length) break;
    for (const e of batch) if (!byId.has(e.id)) byId.set(e.id, e);
  }

  return [...byId.values()].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
}

export function payloadOf(events, extra = {}) {
  return {
    source: 'iabilet.ro/bilete-stand-up-comedy',
    scrapedAt: new Date().toISOString(),
    count: events.length,
    cities: [...new Set(events.map((e) => e.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ro')),
    events,
    ...extra,
  };
}
