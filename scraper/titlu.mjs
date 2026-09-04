// Curata titlul de eveniment de pe iaBilet de campurile pe care le avem deja separat:
// prefixul de oras sau de sala, categoria ("Stand-up comedy"), sufixul de repriza.
//
// Regula: taie doar cand are dovada in date (orasul sau sala evenimentului). Cand nu
// e sigur, intoarce titlul brut. Un titlu redundant e mai bun decat unul ciuntit gresit.

/** "Comics Club" si "ComicsClub!" cad pe aceeasi cheie. */
const plat = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

/** Prefixul e de aruncat doar daca e orasul sau sala acestui eveniment. */
function esteAlEvenimentului(bucata, ev) {
  const b = plat(bucata);
  if (b.length < 3) return false;
  for (const camp of [ev?.city, ev?.venue]) {
    const c = plat(camp);
    if (!c) continue;
    if (c === b || c.includes(b) || b.includes(c)) return true;
  }
  return false;
}

const CATEGORIE = /^(?:stand[-\s]?up(?:\s*comedy)?|comedy\s*show|comedy)\s*(?:[-–:]\s*|cu\s+)/i;
const REPRIZA = /\s*[-–(]?\s*\bshow\s*(\d{1,2})\s*\)?\s*$/i;

/**
 * @param {{title:string, city?:string|null, venue?:string|null}} ev
 * @returns {{titlu:string, repriza:number|null}}
 */
export function curataTitlu(ev) {
  const brut = String(ev?.title ?? '').trim();
  if (!brut) return { titlu: '', repriza: null };

  let t = brut;
  let repriza = null;

  // "- ORA 19:00" — ora e deja camp separat
  t = t.replace(/\s*[-–]\s*ORA\s*\d{1,2}[:.]\d{2}\s*$/i, '').trim();

  // "(SHOW 2)", "- Show 1", "SHOW2"
  const r = t.match(REPRIZA);
  if (r) {
    repriza = Number(r[1]);
    t = t.slice(0, r.index).trim();
  }

  // "Brăila: ...", "The Fool Terasa: ..." — doar daca prefixul e orasul sau sala
  const pref = t.match(/^([^:]{2,30}):\s*(.+)$/);
  if (pref && esteAlEvenimentului(pref[1], ev)) t = pref[2].trim();

  // "... la ComicsClub!", "... pe Terasa ComicsClub!" — doar daca e sala acestui eveniment
  const sufix = t.match(/\s+(?:la|pe)\s+([^,\-–]{2,34}?)\s*!*$/i);
  if (sufix && esteAlEvenimentului(sufix[1], ev)) t = t.slice(0, sufix.index).trim();

  // "Open Mic la Ceainaria Green Tea cu A si B" — sala e camp separat, "cu ..." ramane
  const mijloc = t.match(/\s+(?:la|pe)\s+([^,]{2,34}?)\s+(?=cu\s)/i);
  if (mijloc && esteAlEvenimentului(mijloc[1], ev)) {
    t = (t.slice(0, mijloc.index) + ' ' + t.slice(mijloc.index + mijloc[0].length)).replace(/\s+/g, ' ').trim();
  }

  // "Stand-up Comedy - X", "Stand-up comedy cu A, B si C"
  t = t.replace(CATEGORIE, '').trim();

  // In sursa diacriticele lipsesc des. In romana "si" e intotdeauna "si".
  t = t.replace(/\bsi\b/g, 'și').replace(/\s*[-–]\s*$/, '').trim();

  if (t.length < 3) return { titlu: brut, repriza };
  // Doar cand primul cuvant e integral mic. "iVanov" ramane "iVanov".
  if (/^[a-zăâîșț]+/.test(t)) t = t[0].toUpperCase() + t.slice(1);

  return { titlu: t, repriza };
}
