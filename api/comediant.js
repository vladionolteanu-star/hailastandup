// GET /comedianti/:slug — pagina de comediant, randată pe server. Un slug necunoscut dă 404 adevărat,
// nu o pagină goală cu 200.

import { R, SITE, date, sablon, cuAmprente, cap, trimite, peVercel } from '../lib/sit.mjs';

/** „Cluj-Napoca, Iași și Timișoara" */
function enumerare(lista) {
  return lista.length > 1 ? `${lista.slice(0, -1).join(', ')} și ${lista[lista.length - 1]}` : lista[0] || '';
}

export default function handler(req, res) {
  const slug = String(req.query.slug || '');
  const cale = `/comedianti/${encodeURIComponent(slug)}`;
  const vercel = peVercel(req);

  /* Doar slugurile din listă. Numele fișierului nu se construiește niciodată din ce vine în URL. */
  if (!date('public/data/artisti.js').includes(slug)) {
    return trimite(res, 404, sablon('comediant', {
      cap: cap({
        titlu: 'Comediant negăsit · hailastandup',
        descriere: 'Comediantul ăsta nu e încă în bază.',
        cale,
        indexabil: false,
        analitice: vercel,
      }),
      nume: 'Comediantul ăsta nu e încă în bază.',
      ...cuAmprente({ meta: '<a href="/">Înapoi la showuri</a>', corp: '' }),
    }));
  }

  const artist = date(`public/data/arhiva/${slug}.js`);
  const p = R.comediant({
    artist,
    events: date('public/data/events.js').events,
    azi: R.ceas().zi,
    peVercel: vercel,
    aratate: {},
  });

  const dupaVizionari = (fel) => artist.clipuri
    .filter((c) => c.fel === fel)
    .sort((a, b) => (b.vizionari || 0) - (a.vizionari || 0));
  const specialuri = dupaVizionari('special');
  /* Miniatura celui mai văzut material. hqdefault există pentru orice clip, maxresdefault nu. */
  const vedeta = [specialuri[0], dupaVizionari('moment')[0], dupaVizionari('clip')[0]].find(Boolean);

  const titlu = p.date.length
    ? `${artist.nume}: showuri de stand-up și bilete · hailastandup`
    : specialuri.length
      ? `${artist.nume}: specialuri și clipuri de stand-up · hailastandup`
      : `${artist.nume}: clipuri de stand-up · hailastandup`;

  /* Orașele, nu datele una câte una: două reprezentații în aceeași sală ar umple singure descrierea. */
  const orase = [...new Set(p.date.map((e) => e.oras || e.city).filter(Boolean))];
  const materiale = `${R.plural(artist.count, 'material', 'materiale')} de stand-up`;
  const descriere = p.date.length
    ? `Showuri de stand-up cu ${artist.nume}: ${R.plural(p.date.length, 'dată anunțată', 'date anunțate')}, în ` +
      (orase.length > 3
        ? `${orase.slice(0, 3).join(', ')} și încă ${R.plural(orase.length - 3, 'oraș', 'orașe')}`
        : enumerare(orase)) +
      `, cu ora, sala și prețul. Plus ${materiale} de pe YouTube.`
    : `${materiale} cu ${artist.nume}, de pe YouTube, cel mai văzut primul.`;

  const url = SITE + cale;

  trimite(res, 200, sablon('comediant', {
    cap: cap({
      titlu,
      descriere,
      cale,
      tip: 'profile',
      ogTitlu: artist.nume,
      imagine: vedeta && { url: vedeta.posterMic || vedeta.poster },
      jsonld: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': url,
            url,
            name: titlu,
            inLanguage: 'ro-RO',
            isPartOf: { '@type': 'WebSite', '@id': `${SITE}/#site`, name: 'hailastandup', url: `${SITE}/` },
            about: { '@id': `${url}#persoana` },
          },
          {
            '@type': 'Person',
            '@id': `${url}#persoana`,
            name: artist.nume,
            url,
            sameAs: [`https://www.youtube.com/channel/${artist.id}`],
          },
        ],
      },
      analitice: vercel,
    }),
    nume: R.esc(p.nume),
    subsol: R.esc(p.subsol),
    arhiva: `<script src="/data/arhiva/${slug}.js"></script>`,
    ...cuAmprente({ meta: p.meta, corp: p.corp }),
  }));
}
