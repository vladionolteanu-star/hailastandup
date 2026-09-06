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
| `scraper/canale.mjs` | Comedianții urmăriți: canal, handle, alias-uri. |
| `scraper/fel.mjs` | Ce e stand-up și ce fel de material e. Folosit și de RSS, și de arhivă. |
| `scraper/youtube.mjs` | Feedurile RSS de canal, pentru „Ce a apărut nou" de pe prima pagină. |
| `scraper/clipuri.mjs` | Reface `public/data/clipuri.js`. |
| `scraper/youtube-api.mjs` | Arhiva completă a unui canal, prin YouTube Data API v3. |
| `scraper/arhiva.mjs` | Reface `public/data/arhiva/<slug>.js` și `artisti.js`. Cere `YOUTUBE_API_KEY`. |
| `api/events.js` | Scrapează live listingul de pe iaBilet. |
| `api/event.js` | Ora și tarifele unui spectacol. |
| `api/clipuri.js` | Citește live feedurile de YouTube. |

## Ce e pe pagină acum

Headerul (marcă, căutare, oraș), banda de calendar, ziua curentă, blocurile care urmează și
„Ce a apărut nou". Restul secțiunilor se adaugă una câte una, pe date reale.

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

### Ce a apărut nou

Cele mai recente două clipuri de stand-up de la fiecare canal urmărit, **din ultimele 120 de
zile**, puse cap la cap și sortate după dată. Fereastra contează: cu nouă canale și „ultimele
două de la fiecare", fără ea ar ajunge sub un titlu care spune „nou" și clipuri de acum șase
luni, de la artiști care pur și simplu n-au mai postat. Cine n-a postat recent nu apare aici;
arhiva lui stă pe pagina artistului. Canalele stau în `scraper/canale.mjs`, fiecare cu **ID-ul rezolvat dintr-un
clip real**, nu dintr-un handle scris din memorie: se deschide pagina clipului și se citește
`channelId` din ea.

Filtrarea contează, nu e decor, și **nu există „canal doar de stand-up"**. Toate cele nouă
rulează și altceva pe același canal: „Colegi de cameră" la Bordea, „Popesco Show" la Popesco,
„CineȘtieCe" la Teo, „M am convins" la Vio, animații și sketch-uri la micul Toma. O politică
pe canal, cu „pe cele de stand-up intră tot", trecea 111 episoade de podcast drept
specialurile lui Bordea. Regula e acum una singură, în `scraper/fel.mjs`, aceeași pentru toți.

Feedul RSS n-are durată și dă 15 clipuri pe canal, deci acolo se cere **marcaj explicit de
stand-up în titlu**: un episod de podcast strecurat sub „Ce a apărut nou" costă mai mult decât
un clip bun lipsă. Excepția e `scurteFaraMarcaj` în `canale.mjs` — pe canalele unde s-a
verificat că shortul fără nicio etichetă e tot o bucată de stand-up („AM PLÂNS 200 KM
#bordea", „RECONFIGURARE COPIL #costel"). Pe micul Toma ar fi fals: acolo ce n-are etichetă e
animație sau sketch.

Excluderea se uită pe titlul **fără hashtaguri**, fiindcă mulți pun `#podcast` ca etichetă pe
clipuri care n-au nicio legătură cu un podcast. Marcajul, invers, se uită pe titlul întreg:
`#standup` la coadă e semnal.

Miniaturile: `oardefault.jpg` există doar pentru clipurile verticale și dă 404 pentru cele
16:9, deci e semnalul de orientare. Fără el, `maxresdefault` al unui Short vine cu bare negre
pe laturi. Cardurile stau toate pe 9:16, fiindcă majoritatea clipurilor sunt verticale.

### Arhiva completă

RSS-ul dă **15 clipuri pe canal, plafon fix**, iar cele nouă canale urmărite au împreună peste
3.500 de clipuri: RSS acoperă sub 5% din arhivă. În plus, doar API-ul dă **durata**, iar durata
e singurul mod onest de a separa un special de o oră de un Short de 40 de secunde — titlul nu
spune nicăieri cât ține clipul.

```bash
npm run arhiva                # toate canalele active
node scraper/arhiva.mjs micul-toma   # doar unul
```

Iese **câte un fișier pe artist**, `public/data/arhiva/<slug>.js`, plus `artisti.js` cu lista
celor care au pagină. Un singur fișier pentru toți ajunsese la 1 MB, iar pagina fiecărui
artist îl încărca întreg ca să folosească a noua parte din el. Lista din `artisti.js` se
citește de pe disc, nu din ce s-a cules acum: altfel un `node scraper/arhiva.mjs micul-toma`
ar șterge din listă ceilalți opt artiști, care au fișier.

Cheia se pune în `site/.env.local` (`YOUTUBE_API_KEY=...`, fișierul e în `.gitignore`).
**Pe Vercel nu e nevoie de ea**: culesul se face local și `public/data/arhiva/` intră în
repo. Costul: lista de încărcări e 1 unitate la 50 de clipuri, detaliile la fel, deci toată
arhiva costă ~150 din cele 10.000 de unități pe zi.

#### Ce e un special

Durata singură nu ajunge: pe canalul lui micul Toma cele mai lungi clipuri sunt livestreamuri
de două ore. Marcajul din **titlu** spune ce e stand-up, durata spune ce fel. Peste asta, două
reguli câștigate pe date:

- **Un număr de episod bate orice marcaj.** „StandUp cu Bieber | USP S5E01" e episodul 1 din
  sezonul 5 al emisiunii lui Bordea, nu un special de 45 de minute.
- **Un nume care se repetă pe canal e emisiune**, dar seriile se numără **doar pe titlurile
  fără marcaj**. Altfel numele unui special, repetat pe extrasele lui, trece drept serie și
  scoate exact ce e mai bun: „Zâmbete și Empatie" al lui Micutzu, 5,8 milioane de vizionări.

Ies 26 de specialuri pe cele nouă canale, din 2.410 materiale păstrate.

### Pagina de artist

`public/comedianti/artist.html`, servită la `/comedianti/:slug` printr-o rescriere din
`vercel.json`. Slugul nu se știe când se scrie pagina, deci arhiva lui se încarcă abia după ce
îl citim din URL — de aici fișierul pe artist, nu unul pentru toți.

Rafturile — Date anunțate, Specialuri, Momente și seturi, Clipuri scurte — apar doar când au
ce arăta: Vio n-are niciun special, deci pe pagina lui nu există raft de specialuri. În
rafturi, **cel mai vizionat primul**, nu cel mai nou: cine ajunge aici prima oară trebuie să
dea peste ce a rupt de pe canal, nu peste ce s-a postat ieri. Ordinea cronologică e treaba
primei pagini.

Toate cele nouă canale active au pagină. O pagină numai cu clipuri scurte e în regulă — 165 de
shorturi ale lui Vio, cel mai vizionat primul, e exact ce caută omul care a nimerit aici.

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
npm run clipuri           # reface snapshotul de clipuri recente
npm run arhiva            # reface arhiva pe artist (cere YOUTUBE_API_KEY, doar local)
```

## Parser de nume

```bash
node scraper/nume.mjs test   # din rădăcina proiectului
```

Acoperă `cu A, B și C`, `Oraș: Stand-up Comedy - A si B`, `Best of X`,
`A, B și C - Numele Showului`. La 96% din titlurile naționale.
