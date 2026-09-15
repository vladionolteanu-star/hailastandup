// GET / — prima pagină, randată pe server din snapshot. Browserul o preia apoi și o ține la zi.

import { R, SITE, date, sablon, cuAmprente, cap, trimite, peVercel } from '../lib/sit.mjs';

const ZI_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

export default function handler(req, res) {
  const D = date('public/data/events.js');
  const acum = R.ceas();
  const ceruta = String(req.query.zi || '');
  const zi = ZI_VALIDA.test(ceruta) ? ceruta : acum.zi;
  const vercel = peVercel(req);

  const p = R.acasa({
    showuri: R.showuri(D.events),
    azi: acum.zi,
    zi,
    acum: acum.minute,
    oras: 'București',
    filtru: null,
    peVercel: vercel,
    deschis: () => true,
    clipuri: date('public/data/clipuri.js'),
    clipuriAratate: R.CLIPURI_PAS,
    cuPagina: date('public/data/artisti.js'),
    scrapedAt: D.scrapedAt,
  });

  /* ?zi= și ?cauta= sunt vederi ale aceleiași pagini: bune de trimis cuiva, nu de indexat. */
  const vedere = new URLSearchParams();
  if (req.query.zi) vedere.set('zi', ceruta);
  if (req.query.cauta) vedere.set('cauta', String(req.query.cauta));
  const indexabil = !String(vedere);

  const html = sablon('acasa', {
    cap: cap({
      titlu: zi === acum.zi
        ? 'Showuri de stand-up azi, în București și în țară · hailastandup'
        : `Showuri de stand-up ${R.numeZi(zi)} · hailastandup`,
      descriere: 'Showurile de stand-up de azi, de mâine și din weekend, grupate pe oraș: ora, sala și prețul. Datele vin de pe iaBilet.',
      ogTitlu: 'Hai la stand-up',
      ogDescriere: 'Ce se joacă azi, în toată țara. Ora, sala, prețul.',
      cale: indexabil ? '/' : `/?${vedere}`,
      indexabil,
      jsonld: indexabil && {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${SITE}/#site`,
            url: `${SITE}/`,
            name: 'hailastandup',
            alternateName: ['Hai la stand-up', 'hailastandup.ro'],
            inLanguage: 'ro-RO',
          },
          {
            '@type': 'Organization',
            '@id': `${SITE}/#organizatie`,
            url: `${SITE}/`,
            name: 'hailastandup',
            logo: `${SITE}/icon-512.png`,
          },
        ],
      },
      analitice: vercel,
    }),
    titlu: R.esc(p.titlu),
    meta: R.esc(p.meta),
    subsol: R.esc(p.subsol),
    ...cuAmprente({ capDr: p.capDr, calendar: p.calendar, benzi: p.benzi, urmeaza: p.urmeaza, clipuri: p.clipuri }),
  });

  trimite(res, 200, html);
}
