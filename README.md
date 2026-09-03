# hailastandup

Hub public de stand-up românesc. Showurile din toată țara, comedianții cu paginile
lor, materialele de pe YouTube și podcasturile din jurul scenei, într-un singur loc.
Ticketingul propriu vine peste el, mai târziu.

Strategia și deciziile blocate sunt în `PRODUCT.md`, în rădăcina proiectului.

## Ce e înăuntru

| | |
|---|---|
| `public/index.html` | Pagina. HTML, CSS și JS inline, fără build. |
| `public/img/` | Afișe de eveniment, avataruri de canal, miniaturi de clip. |
| `scraper/iabilet.mjs` | Parsarea listingului de pe iaBilet. |
| `scraper/nume.mjs` | Extrage numele comedianților din titlul unui eveniment. |
| `scraper/snapshot.mjs` | Reface `public/data/events.js`. |
| `api/events.js` | Scrapează live listingul de pe iaBilet. |
| `api/event.js` | Ora și tarifele unui spectacol. |

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
