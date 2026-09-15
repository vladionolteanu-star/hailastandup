// Ce au în comun paginile randate pe server: datele de pe disc, capul paginii și răspunsul.

import { readFileSync, statSync } from 'node:fs';
import '../public/randare.js';

export const R = globalThis.Randare;

/* Adresa canonică. hailastandup.ro redirecționează aici, iar adresele *.vercel.app redirecționează
 * tot aici, din vercel.json. */
export const SITE = 'https://www.hailastandup.ro';

const RADACINA = new URL('../', import.meta.url);
const citite = new Map();

/**
 * Fișierele din public/data sunt scripturi `window.X = {...};`, scrise pentru pagină. Pe server
 * contează doar valoarea. Se recitesc când se schimbă pe disc, ca un `npm run snapshot` să se vadă
 * local fără repornire.
 */
export function date(cale) {
  const url = new URL(cale, RADACINA);
  const mtime = statSync(url).mtimeMs;
  const tinut = citite.get(cale);
  if (tinut && tinut.mtime === mtime) return tinut.valoare;
  const text = readFileSync(url, 'utf8');
  const valoare = JSON.parse(text.slice(text.indexOf('=') + 1).trim().replace(/;$/, ''));
  citite.set(cale, { mtime, valoare });
  return valoare;
}

/** Șablonul din pagini/, cu {{cheie}} înlocuit. Valorile intră deja scăpate. */
export function sablon(nume, valori) {
  return readFileSync(new URL(`pagini/${nume}.html`, RADACINA), 'utf8')
    .replace(/\{\{([\w-]+)\}\}/g, (_, cheie) => valori[cheie] ?? '');
}

/** Blocurile randate, fiecare cu amprenta lui, după care pagina știe să nu le rescrie. */
export function cuAmprente(blocuri) {
  const valori = {};
  for (const [cheie, html] of Object.entries(blocuri)) {
    valori[cheie] = html;
    valori[`h-${cheie}`] = R.amprenta(html);
  }
  return valori;
}

/** Local, imaginile se cer direct de la sursă: optimizatorul de imagini există doar pe Vercel. */
export const peVercel = (req) => !/^(localhost|127\.|\[::1\])/.test(String(req.headers.host || ''));

const e = R.esc;

/** Tot ce stă în <head> și diferă de la o pagină la alta, plus pictogramele. */
export function cap({ titlu, descriere, cale, indexabil = true, tip = 'website', ogTitlu, ogDescriere, imagine, jsonld, analitice }) {
  const url = SITE + cale;
  const img = imagine || { url: `${SITE}/og.png`, latime: 1200, inaltime: 630 };
  return [
    `<title>${e(titlu)}</title>`,
    `<meta name="description" content="${e(descriere)}">`,
    indexabil ? `<link rel="canonical" href="${e(url)}">` : '<meta name="robots" content="noindex, follow">',
    '<link rel="icon" href="/favicon.ico" sizes="32x32">',
    '<link rel="icon" href="/icon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<meta name="theme-color" content="#fbfbfc" media="(prefers-color-scheme:light)">',
    '<meta name="theme-color" content="#1b1c1f" media="(prefers-color-scheme:dark)">',
    `<meta property="og:type" content="${e(tip)}">`,
    '<meta property="og:site_name" content="hailastandup">',
    '<meta property="og:locale" content="ro_RO">',
    `<meta property="og:title" content="${e(ogTitlu || titlu)}">`,
    `<meta property="og:description" content="${e(ogDescriere || descriere)}">`,
    `<meta property="og:url" content="${e(url)}">`,
    `<meta property="og:image" content="${e(img.url)}">`,
    img.latime ? `<meta property="og:image:width" content="${img.latime}">` : '',
    img.inaltime ? `<meta property="og:image:height" content="${img.inaltime}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '',
    analitice ? '<script defer src="/_vercel/insights/script.js"></script>' : '',
  ].filter(Boolean).join('\n');
}

export function trimite(res, status, corp, tip = 'text/html; charset=utf-8', secunde = 300) {
  res.setHeader('Content-Type', tip);
  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${secunde}, stale-while-revalidate=3600`);
  res.status(status).send(corp);
}
