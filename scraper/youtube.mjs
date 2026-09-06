// Citeste feedurile publice ale canalelor din canale.mjs. Fara cheie de API, fara dependinte.
// Feedul da ultimele 15 clipuri ale unui canal, cu titlu, data si numarul de vizualizari.

import { CANALE_ACTIVE } from './canale.mjs';
import { esteStandup } from './fel.mjs';

const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { attempt = 1, timeout = 10000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt >= 3) throw err;
    await sleep(400 * attempt);
    return get(url, { attempt: attempt + 1, timeout });
  } finally {
    clearTimeout(timer);
  }
}

function decode(s) {
  return String(s ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/** Coada de hashtaguri de la finalul titlului e spam de indexare, nu titlu. */
export function curataTitluClip(titlu) {
  const t = String(titlu ?? '')
    .replace(/(?:\s+#[^\s#]+)+\s*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length >= 3 ? t : String(titlu ?? '').trim();
}

export function parseFeed(xml) {
  return [...String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
    const e = m[1];
    const camp = (re) => e.match(re)?.[1] ?? null;
    const vizionari = camp(/<media:statistics\s+views="(\d+)"/);
    return {
      id: camp(/<yt:videoId>(.*?)<\/yt:videoId>/),
      titlu: decode(camp(/<media:title>([\s\S]*?)<\/media:title>/) ?? camp(/<title>([\s\S]*?)<\/title>/)),
      publicat: camp(/<published>(.*?)<\/published>/),
      vizionari: vizionari == null ? null : Number(vizionari),
    };
  }).filter((v) => v.id && v.titlu && v.publicat);
}

/**
 * `oardefault.jpg` exista doar cand clipul are alt raport decat 16:9, adica pentru verticale.
 * Pentru un clip normal da 404. E singurul semnal ieftin si sigur: RSS-ul nu spune nimic
 * despre orientare, iar `maxresdefault` al unui vertical vine cu bare negre pe laturi.
 */
async function esteVertical(id) {
  try {
    const r = await fetch(`https://i.ytimg.com/vi/${id}/oardefault.jpg`, {
      method: 'HEAD',
      headers: { 'user-agent': UA },
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Feedul de pe prima pagina, nu arhiva. Cu 9 canale si „ultimele 2 de la fiecare", fara o
 * fereastra de timp ar ajunge sub titlul „Ce a aparut nou" si clipuri de acum sase luni,
 * de la artisti care pur si simplu n-au mai postat. Arhiva completa sta pe pagina artistului.
 *
 * @param {number} peCanal cate clipuri se iau de la fiecare canal
 * @param {number} zile cat de vechi poate fi cel mai vechi clip aratat
 */
export async function adunaClipuri({ peCanal = 2, zile = 120 } = {}) {
  const prag = new Date(Date.now() - zile * 86400000).toISOString();
  const rezultate = await Promise.all(
    CANALE_ACTIVE.map(async (c) => {
      try {
        const clipuri = parseFeed(await get(FEED + c.id))
          .filter((v) => esteStandup(v.titlu, c) && v.publicat >= prag)
          .sort((a, b) => b.publicat.localeCompare(a.publicat))
          .slice(0, peCanal)
          .map((v) => ({
            ...v,
            titlu: curataTitluClip(v.titlu),
            nume: c.nume,
            slug: c.slug,
            canal: c.canal,
            canalId: c.id,
            url: `https://www.youtube.com/watch?v=${v.id}`,
          }));

        // Orientarea, apoi miniatura potrivita ei. `hqdefault` exista mereu, deci e rezerva.
        await Promise.all(
          clipuri.map(async (v) => {
            v.vertical = await esteVertical(v.id);
            v.poster = v.vertical
              ? `https://i.ytimg.com/vi/${v.id}/oardefault.jpg`
              : `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`;
            v.posterMic = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
          })
        );

        return { canal: c.canal, clipuri };
      } catch (err) {
        return { canal: c.canal, clipuri: [], eroare: String(err?.message ?? err) };
      }
    })
  );

  const clipuri = rezultate
    .flatMap((r) => r.clipuri)
    .sort((a, b) => b.publicat.localeCompare(a.publicat));

  return {
    source: 'youtube.com, feeduri publice de canal',
    culesLa: new Date().toISOString(),
    zile,
    canaleUrmarite: CANALE_ACTIVE.length,
    canale: new Set(clipuri.map((v) => v.canalId)).size,
    esecuri: rezultate.filter((r) => r.eroare).map((r) => ({ canal: r.canal, eroare: r.eroare })),
    count: clipuri.length,
    clipuri,
  };
}
