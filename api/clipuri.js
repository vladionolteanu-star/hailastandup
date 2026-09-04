// GET /api/clipuri — cele mai recente clipuri de stand-up de pe canalele urmarite, live.

import { adunaClipuri } from '../scraper/youtube.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Doar GET.' });
  }

  try {
    const payload = await adunaClipuri({ peCanal: 2 });
    if (!payload.count) throw new Error('Niciun clip: toate feedurile au picat.');

    // Feedurile se misca lent. O ora la margine, apoi reimprospatare in fundal.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
    return res.status(200).json({ ...payload, live: true });
  } catch (err) {
    return res.status(502).json({ error: 'Nu am putut citi feedurile.', detail: String(err?.message ?? err) });
  }
}
