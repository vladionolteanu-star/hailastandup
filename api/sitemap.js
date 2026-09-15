// GET /sitemap.xml — prima pagină și paginile de comediant, cu data ultimei culegeri.

import { SITE, date, trimite } from '../lib/sit.mjs';

export default function handler(req, res) {
  const D = date('public/data/events.js');

  const intrari = [{ loc: `${SITE}/`, lastmod: D.scrapedAt }].concat(
    date('public/data/artisti.js').map((slug) => {
      const a = date(`public/data/arhiva/${slug}.js`);
      /* Pagina de comediant se schimbă și când apar date noi pe iaBilet, nu doar când se culege canalul. */
      return { loc: `${SITE}/comedianti/${slug}`, lastmod: a.culesLa > D.scrapedAt ? a.culesLa : D.scrapedAt };
    })
  );

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    intrari.map((u) => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod.slice(0, 10)}</lastmod></url>`).join('\n') +
    '\n</urlset>\n';

  trimite(res, 200, xml, 'application/xml; charset=utf-8', 3600);
}
