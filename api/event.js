// GET /api/event?url=... — ora si tarifele reale ale unui spectacol, live.
// URL-ul e validat: doar pagini de eveniment de pe iabilet.ro.

import { get, parseDetail, safeEventUrl } from '../scraper/iabilet.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Doar GET.' });
  }

  const url = safeEventUrl(req.query?.url);
  if (!url) return res.status(400).json({ error: 'URL de eveniment invalid.' });

  try {
    const detail = parseDetail(await get(url));
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=900');
    return res.status(200).json({ ...detail, url, live: true });
  } catch (err) {
    return res.status(502).json({ error: 'Nu am putut citi spectacolul.', detail: String(err?.message ?? err) });
  }
}
