# hailastandup

Mockup de platformă de ticketing pentru stand-up. Spectacolele sunt reale, luate de pe
iaBilet; fluxul de cumpărare și panoul de organizator sunt demonstrative.

Nu e un produs. E o machetă care arată cum ar arăta lucrul făcut.

## Ce e înăuntru

| | |
|---|---|
| `public/` | Site-ul. HTML, CSS și un fișier JS, fără build. |
| `api/events.js` | Scrapează live listingul de stand-up de pe iaBilet. ~6s. |
| `api/event.js` | Ora și tarifele unui spectacol, la deschiderea paginii lui. |
| `scraper/iabilet.mjs` | Parsarea, folosită și de API și de CLI. |
| `scraper/snapshot.mjs` | Reface `public/data/events.js`, snapshot-ul de pornire. |

## Cum merge cu datele

La încărcare, site-ul pornește din snapshot, ca să apară instant. Butonul **Actualizează**
cheamă `/api/events` și reia listingul de pe iaBilet în timp real. Tarifele și ora nu intră
în listing, așa că vin separat, per spectacol, când deschizi unul.

Dacă API-ul nu răspunde, rămâne ce era pe ecran și apare un mesaj. Snapshot-ul se reface cu:

```bash
npm run snapshot          # cu ore și tarife, ~2 min
npm run snapshot:fast     # doar listingul, ~7s
```

## Local

```bash
npm run dev               # servește public/ pe :3000
```

Butonul de actualizare are nevoie de funcțiile din `api/`, deci de `vercel dev` sau de
deploy. Deschis direct ca fișier, site-ul merge pe snapshot și spune asta.

## Ce e real și ce nu

**Real:** titluri, date, ore, săli, orașe, afișe, prețuri și tarife, toate de pe iaBilet.

**Inventat:** vânzările și numărul de locuri din panoul de organizator, stocul pe tarif,
și comisioanele (2% de la club, taxă cumpărător `max(2 lei, 4%)` plafonată la 8 lei).
Nu se procesează nicio plată.
