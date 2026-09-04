# hailastandup

Hub public de stand-up românesc. Showurile din toată țara, comedianții cu paginile
lor, materialele de pe YouTube și podcasturile din jurul scenei, într-un singur loc.
Ticketingul propriu vine peste el, mai târziu.

Strategia și deciziile blocate sunt în `PRODUCT.md`, în rădăcina proiectului.

## Ce e înăuntru

| | |
|---|---|
| `public/index.html` | Pagina. HTML, CSS și JS inline, fără build. |
| `public/data/events.js` | Snapshotul de evenimente, cu câmpurile derivate incluse. |
| `scraper/iabilet.mjs` | Parsarea listingului de pe iaBilet și câmpurile derivate. |
| `scraper/titlu.mjs` | Curăță titlul de oraș, sală, categorie și sufixul de repriză. |
| `scraper/nume.mjs` | Extrage numele comedianților din titlul unui eveniment. |
| `scraper/snapshot.mjs` | Reface `public/data/events.js`. |
| `api/events.js` | Scrapează live listingul de pe iaBilet. |
| `api/event.js` | Ora și tarifele unui spectacol. |

## Ce e pe pagină acum

Headerul (marcă, căutare, oraș), banda de calendar, ziua curentă și blocurile care urmează.
Restul secțiunilor se adaugă una câte una, pe date reale.

`?zi=AAAA-LL-ZZ` deschide altă zi. Folosit ca să vezi stările: zi plină, o singură
reprezentație, zi goală.

### Blocurile care urmează

„Mâine" și „poimâine" apar **doar când nu sunt deja în fereastra de weekend**, altfel
aceleași showuri ar fi pe pagină de două ori. Vinerea, mâine și poimâine sunt sâmbătă și
duminică, deci rămâne un singur bloc, „Restul weekendului". Sub două zile rămase, weekendul
nu mai merită bloc propriu și zilele intră ca blocuri normale.

| azi e | ies |
|---|---|
| luni – joi | Mâine, eventual Poimâine, apoi Weekendul ăsta |
| vineri, sâmbătă | Restul weekendului |
| duminică | Mâine, Poimâine, Weekendul viitor |

Eticheta e relativă doar când ziua ancoră chiar e azi. Pe `?zi=`, blocurile poartă date.
Fiecare bloc se pliază, iar starea se ține în `localStorage`.

### Cum se rup benzile

Un oraș primește bandă proprie doar de la trei showuri în sus, plus orașul ales, care o
primește mereu. Sub prag, orașele intră într-o bandă de coadă, cu orașul scris pe fiecare
card. Fără regula asta, o zi cu 11 showuri în 5 orașe scotea patru rânduri cu un singur
card. Blocurile de weekend se grupează pe zi, nu pe oraș.

### Calendarul

42 de zile de la azi, cu numărul de showuri sub fiecare dată, weekendurile marcate discret,
zilele goale stinse și neinteractive. Click pe o zi înseamnă `?zi=`, deci link partajabil.

## Câmpuri derivate

`payloadOf` le calculează o dată, la împachetare, deci le au și snapshotul, și `/api/events`:

| | |
|---|---|
| `titlu`, `repriza` | Titlul curățat. `title` rămâne brut, exact cum l-a dat sursa. |
| `nume` | Comedianții din titlu. 87% din titluri se parsează. |
| `pretDeLa` | `offers.price`, iar când lipsește, cel mai mic tarif. `null` când chiar nu e preț. |
| `oras` | Forma canonică. Sursa scrie și `Brasov`, și `Brașov`. |
| `tip` | `showing` sau `turneu`. Listarea-umbrelă a unui turneu nu apare într-o zi anume. |

## Prospețime

Pagina pornește din snapshot, apoi cere `/api/events`. Listingul live spune **ce** se joacă
și ce s-a epuizat, dar nu are ora și tarifele: alea cer o cerere per spectacol. Deci se
**îmbină după id** — live pentru existență și stoc, snapshot pentru oră și preț. Dacă
`/api/events` cade, rămâne snapshotul.

## Afișe

Thumbnailul de pe iaBilet e semnat la 260×360. Originalul e liber și e A4 la rezoluție
mare, deci pagina cere originalul prin optimizatorul de imagini al Vercel
(`images.remotePatterns` în `vercel.json`) și cade pe thumbnail când originalul lipsește.

## Date

Showurile vin de pe iaBilet. Avatarurile, miniaturile și numărul de abonați vin de pe
canalele oficiale de YouTube ale comedianților, prin feedurile lor publice.

Regula pe care o respectă pagina: **nicio cifră fără sursă**. Unde nu există o valoare
verificabilă, câmpul nu apare.

## Local

```bash
npm run dev               # servește public/ pe :3000
npm run snapshot          # reface snapshotul de evenimente
```

## Parser de nume

```bash
node scraper/nume.mjs test   # din rădăcina proiectului
```

Acoperă `cu A, B și C`, `Oraș: Stand-up Comedy - A si B`, `Best of X`,
`A, B și C - Numele Showului`. La 96% din titlurile naționale.
