// Arhiva completa a unui canal, prin YouTube Data API v3.
//
// De ce API si nu RSS: feedul RSS da 15 clipuri pe canal, plafon fix. Cele 9 canale urmarite
// au impreuna ~3.600 de clipuri, deci RSS acopera 4% din arhiva. In plus, doar API-ul da
// durata, iar durata e singurul mod onest de a separa un special de o ora de un Short de 40s.
// Titlul nu e de ajuns: „RECONFIGURARE COPIL" nu spune nicaieri ca e un clip de 90 de secunde.
//
// Cost: lista de incarcari costa 1 unitate la 50 de clipuri, detaliile la fel. Toata arhiva
// celor 9 canale = ~150 de unitati din cele 10.000 pe zi. Practic gratis.
//
// Cheia se ia din YOUTUBE_API_KEY si nu se scrie niciodata in cod sau in date.

import { esteStandup, felul } from './fel.mjs';

const API = 'https://www.googleapis.com/youtube/v3';

export function cheie() {
  const k = process.env.YOUTUBE_API_KEY;
  if (!k) {
    throw new Error(
      'Lipseste YOUTUBE_API_KEY. Local: pune-o in site/.env.local. Pe Vercel: Settings > Environment Variables.'
    );
  }
  return k;
}

async function cere(cale, params) {
  const url = new URL(`${API}/${cale}`);
  for (const [k, v] of Object.entries({ ...params, key: cheie() })) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url);
  const corp = await res.json().catch(() => null);
  if (!res.ok) {
    const motiv = corp?.error?.errors?.[0]?.reason ?? corp?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`${cale}: ${motiv}`);
  }
  return corp;
}

/** Lista de incarcari a unui canal are acelasi id, cu UC schimbat in UU. */
const listaIncarcari = (canalId) => 'UU' + canalId.slice(2);

/** "PT1H2M33S" -> 3753 */
export function durataInSecunde(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(iso ?? ''));
  if (!m) return null;
  const [, z, o, min, s] = m.map((x) => (x == null ? 0 : Number(x)));
  return z * 86400 + o * 3600 + min * 60 + s;
}

/** Toate id-urile de clip ale unui canal, in ordinea incarcarii. */
export async function idurileCanalului(canalId, { max = 5000 } = {}) {
  const iduri = [];
  let pageToken;
  do {
    const r = await cere('playlistItems', {
      part: 'contentDetails',
      playlistId: listaIncarcari(canalId),
      maxResults: 50,
      pageToken,
    });
    for (const it of r.items ?? []) {
      const id = it.contentDetails?.videoId;
      if (id) iduri.push(id);
    }
    pageToken = r.nextPageToken;
  } while (pageToken && iduri.length < max);
  return iduri;
}

const bucati = (arr, n) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

/** Titlu, data, durata si vizionari, in cereri de cate 50. */
export async function detalii(iduri) {
  const out = [];
  for (const grup of bucati(iduri, 50)) {
    const r = await cere('videos', {
      part: 'snippet,contentDetails,statistics',
      id: grup.join(','),
      maxResults: 50,
    });
    for (const v of r.items ?? []) {
      const secunde = durataInSecunde(v.contentDetails?.duration);
      out.push({
        id: v.id,
        titlu: (v.snippet?.title ?? '').trim(),
        publicat: v.snippet?.publishedAt ?? null,
        durata: secunde,
        fel: felul(secunde),
        vizionari: v.statistics?.viewCount == null ? null : Number(v.statistics.viewCount),
        url: `https://www.youtube.com/watch?v=${v.id}`,
        poster: `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`,
        posterMic: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
      });
    }
  }
  return out;
}

/** Arhiva unui canal, cea mai noua incarcare prima. */
export async function arhivaCanalului(canal, { max = 5000 } = {}) {
  const iduri = await idurileCanalului(canal.id, { max });
  const tot = await detalii(iduri);

  // Se pastreaza doar stand-up-ul. Restul canalului (livestreamuri, animatii, vlog) ramane
  // pe YouTube: aici e un site de stand-up, nu o oglinda a canalului.
  const clipuri = tot
    .filter((v) => esteStandup(v.titlu, canal.politica))
    .map((v) => ({ ...v, slug: canal.slug, nume: canal.nume }))
    .sort((a, b) => String(b.publicat).localeCompare(String(a.publicat)));

  return { ...canal, incarcate: tot.length, count: clipuri.length, clipuri };
}
