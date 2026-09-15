// Server local: public/ ca fișiere statice, plus rescrierile și funcțiile din vercel.json.
// `npx serve` nu aplică rescrierile, deci n-ar vedea deloc paginile randate pe server.
//
// node lib/dev.mjs [port]
//
// Modificările din api/ se văd la cererea următoare. Cele din lib/ și public/randare.js cer
// repornire: Node ține modulele importate o dată.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RADACINA = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(RADACINA, 'public');
const PORT = Number(process.argv[2]) || 3000;
const VERCEL = JSON.parse(await readFile(join(RADACINA, 'vercel.json'), 'utf8'));

const TIPURI = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

/** `/comedianti/:slug` și `/:cale*`, ca în vercel.json. */
function tipar(sursa) {
  return new RegExp('^' + sursa
    .replace(/\./g, '\\.')
    .replace(/:(\w+)\*/g, '(?<$1>.*)')
    .replace(/:(\w+)(?![>\w])/g, '(?<$1>[^/]+)') + '$');
}

async function fisier(cale) {
  const tinta = normalize(join(PUBLIC, decodeURIComponent(cale)));
  if (!tinta.startsWith(PUBLIC + sep)) return null;
  try {
    const s = await stat(tinta);
    if (s.isFile()) return tinta;
    if (s.isDirectory()) return (await stat(join(tinta, 'index.html')).catch(() => null)) ? join(tinta, 'index.html') : null;
  } catch {
    return null;
  }
  return null;
}

async function functie(nume, query, req, res) {
  const cale = join(RADACINA, 'api', `${nume}.js`);
  const s = await stat(cale).catch(() => null);
  if (!s || !/^[\w-]+$/.test(nume)) return false;

  const modul = await import(`${pathToFileURL(cale).href}?v=${s.mtimeMs}`);
  req.query = query;
  res.status = (cod) => { res.statusCode = cod; return res; };
  res.send = (corp) => { res.end(corp); return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  await modul.default(req, res);
  return true;
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const static_ = await fisier(url.pathname);
    if (static_) {
      res.setHeader('Content-Type', TIPURI[extname(static_)] || 'application/octet-stream');
      return res.end(await readFile(static_));
    }

    let tinta = url;
    for (const r of VERCEL.rewrites || []) {
      const m = url.pathname.match(tipar(r.source));
      if (!m) continue;
      tinta = new URL(r.destination.replace(/:(\w+)/g, (_, k) => m.groups?.[k] ?? ''), url);
      for (const [k, v] of url.searchParams) if (!tinta.searchParams.has(k)) tinta.searchParams.set(k, v);
      break;
    }

    if (tinta.pathname.startsWith('/api/') &&
        await functie(tinta.pathname.slice(5), Object.fromEntries(tinta.searchParams), req, res)) return;

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('404');
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(String(err?.stack ?? err));
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
