// GET /api/events — scrapeaza live listingul de stand-up de pe iaBilet.
// Fara ora si tarife: alea vin per spectacol din /api/event, ca sa incapa in timp.

import { scrapeListing, payloadOf } from '../scraper/iabilet.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Doar GET.' });
  }

  const started = Date.now();

  try {
    const events = await scrapeListing();
    if (!events.length) throw new Error('Listingul a venit gol.');

    // Cache la marginea Vercel: raspunsul e bun 5 minute, apoi se reimprospateaza in fundal.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
    return res.status(200).json(payloadOf(events, { tookMs: Date.now() - started, live: true }));
  } catch (err) {
    return res.status(502).json({
      error: 'Nu am putut citi iaBilet acum.',
      detail: String(err?.message ?? err),
      tookMs: Date.now() - started,
    });
  }
}
