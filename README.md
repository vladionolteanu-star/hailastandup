# hailastandup

Hub public de stand-up românesc. Showurile din toată țara, comedianții cu paginile
lor, materialele de pe YouTube și podcasturile din jurul scenei, într-un singur loc.
Ticketingul propriu vine peste el, mai târziu.

Strategia și deciziile blocate sunt în `PRODUCT.md`, în rădăcina proiectului.

## Ce e înăuntru

| | |
|---|---|
| `pagini/acasa.html` | Șablonul primei pagini, cu JS-ul din browser. Îl umple `api/acasa.js`. |
| `pagini/comediant.html` | Șablonul paginii de comediant. Îl umple `api/comediant.js`. |
| `public/randare.js` | Randarea comună: aceleași funcții scriu HTML-ul pe server și în browser. |
| `lib/sit.mjs` | Ce au în comun paginile de pe server: datele de pe disc, capul paginii, răspunsul. |
| `lib/dev.mjs` | Serverul local, cu rescrierile și funcțiile din `vercel.json`. |
| `api/acasa.js`, `api/comediant.js` | Paginile, randate pe server. |
| `api/sitemap.js` | `/sitemap.xml`: prima pagină și paginile de comediant. |
| `public/data/events.js` | Snapshotul de evenimente, cu câmpurile derivate incluse. |
| `scraper/iabilet.mjs` | Parsarea listingului de pe iaBilet și câmpurile derivate. |
| `scraper/titlu.mjs` | Curăță titlul de oraș, sală, categorie și sufixul de repriză. |
| `scraper/nume.mjs` | Extrage numele comedianților din titlul unui eveniment. |
| `scraper/snapshot.mjs` | Reface `public/data/events.js`. |
| `scraper/canale.mjs` | Comedianții urmăriți: canal, handle, alias-uri. |
| `scraper/exclusi.mjs` | Oamenii scoși de pe site. Se aplică pe showuri și pe clipuri. |
| `scraper/fel.mjs` | Ce e stand-up și ce fel de material e. Folosit și de RSS, și de arhivă. |
| `scraper/youtube.mjs` | Cititor de feeduri RSS de canal. Nu mai alimentează pagina, vezi mai jos. |
| `scraper/clipuri.mjs` | Reface `public/data/clipuri.js` din arhivă, pentru banda de pe prima pagină. |
| `scraper/youtube-api.mjs` | Arhiva completă a unui canal, prin YouTube Data API v3. |
| `scraper/arhiva.mjs` | Reface `public/data/arhiva/<slug>.js` și `artisti.js`. Cere `YOUTUBE_API_KEY`. |
| `api/events.js` | Scrapează live listingul de pe iaBilet. |
| `api/event.js` | Ora și tarifele unui spectacol. |

## Ce e pe pagină acum

Headerul (marcă, căutare, oraș), banda de calendar, ziua curentă, blocurile care urmează și
„Ce merită văzut". Restul secțiunilor se adaugă una câte una, pe date reale.

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

### Ce merită văzut

**Recența e criteriu de intrare, vizionările sunt criteriu de ordonare.** Intră clipurile de
sub 5 minute din ultimele 120 de zile, **câte unul de comediant** — cel mai văzut al lui —,
pentru fiecare comediant urmărit care are unul, ordonate după vizionări. Se văd primele opt,
restul vin la „Încă", ca prima pagină să nu devină un zid de miniaturi. Banda nu spune câți
comedianți sunt.

Regula veche era „ultimele două de la fiecare canal, sortate după dată". Aia e echitate între
artiști, nu calitate: cine posta ieri un clip slab ajungea pe primul rând. Se vedea în cifre —
secțiunea amesteca 1.218 vizionări cu 398.414. A urmat „cele mai văzute, maximum două de
artist, primele 12", care lăsa loc doar pentru șase oameni.

Sursa e **arhiva de pe disc**, nu feedurile RSS. RSS-ul dă 15 încărcări pe canal, plafon fix,
și pe canalele active fereastra de 120 de zile nici nu încape în el: cu RSS, secțiunea arăta
un clip cu 1.218 vizionări în timp ce în aceeași fereastră stătea unul cu 1,7 milioane, pe
care RSS-ul pur și simplu nu-l putea vedea. Pe 15 septembrie 2026, bazinul din arhivă avea 462
de clipuri. De aceea nu mai există `/api/clipuri`: un endpoint live care citește RSS ar servi
un clasament mai prost decât cel din snapshot. `adunaClipuri` din `scraper/youtube.mjs`
rămâne, nelegat de pagină, ca să nu se piardă cititorul de feeduri.

Filtrarea contează, nu e decor, și **nu există „canal doar de stand-up"**. Primele nouă canale
urmărite rulau toate și altceva pe același canal: „Colegi de cameră" la Bordea, „Popesco Show"
la Popesco, „CineȘtieCe" la Teo, „M am convins" la Vio, animații și sketch-uri la micul Toma.
O politică pe canal, cu „pe cele de stand-up intră tot", trecea 111 episoade de podcast drept
specialurile lui Bordea. Regula e acum una singură, în `scraper/fel.mjs`, aceeași pentru toți.

Feedul RSS n-are durată și dă 15 clipuri pe canal, deci acolo se cere **marcaj explicit de
stand-up în titlu**: un episod de podcast strecurat pe prima pagină costă mai mult decât un
clip bun lipsă. Excepția e `scurteFaraMarcaj` în `canale.mjs` — pe canalele unde s-a
verificat că shortul fără nicio etichetă e tot o bucată de stand-up („AM PLÂNS 200 KM
#bordea", „RECONFIGURARE COPIL #costel"). Pe micul Toma ar fi fals: acolo ce n-are etichetă e
animație sau sketch.

Excluderea se uită pe titlul **fără hashtaguri**, fiindcă mulți pun `#podcast` ca etichetă pe
clipuri care n-au nicio legătură cu un podcast. Marcajul, invers, se uită pe titlul întreg:
`#standup` la coadă e semnal.

Miniaturile: `oardefault.jpg` există doar pentru clipurile verticale și dă 404 pentru cele
16:9, deci e semnalul de orientare. Fără el, `maxresdefault` al unui Short vine cu bare negre
pe laturi. Cardurile stau toate pe 9:16, fiindcă majoritatea clipurilor sunt verticale.

### Cine e urmărit

Pe 14 septembrie 2026 lista a crescut de la 9 la 30 de canale, din lineupurile săptămânii:
numele din titlurile de pe iaBilet, apoi căutare de canal pe YouTube pentru fiecare nume.
**Legătura dintre un nume din lineup și un canal o confirmă un om, nu scriptul.** Potrivirea
doar pe numele de familie, un prenume găsit în altă sursă sau două canale cu același nume nu
sunt dovezi. Ce n-a fost confirmat nu intră.

ID-ul fiecărui canal nou e verificat pe trei căi: `channels.list` cu `forHandle`, linkul
canonic al paginii de canal și `externalId`. Feedul RSS dădea HTTP 404 la verificare. Nu se
scrie niciun ID din memorie și nu se ia primul `channelId` din pagină — acolo apar și canalele
din rafturile laterale.

### Arhiva completă

RSS-ul dă **15 clipuri pe canal, plafon fix**, iar primele nouă canale urmărite aveau împreună
peste 3.500 de clipuri: RSS acoperea sub 5% din arhivă. În plus, doar API-ul dă **durata**, iar
durata e singurul mod onest de a separa un special de o oră de un Short de 40 de secunde —
titlul nu spune nicăieri cât ține clipul.

```bash
npm run arhiva                # toate canalele active
node scraper/arhiva.mjs micul-toma   # doar unul
```

Iese **câte un fișier pe artist**, `public/data/arhiva/<slug>.js`, plus `artisti.js` cu lista
celor care au pagină. Un singur fișier pentru toți ajunsese la 1 MB când erau nouă canale, iar
pagina fiecărui artist îl încărca întreg ca să folosească o mică parte din el. Lista din
`artisti.js` se citește de pe disc, nu din ce s-a cules acum: altfel un
`node scraper/arhiva.mjs micul-toma` ar șterge din listă ceilalți artiști, care au fișier.

Cheia se pune în `site/.env.local` (`YOUTUBE_API_KEY=...`, fișierul e în `.gitignore`).
**Pe Vercel nu e nevoie de ea**: culesul se face local și `public/data/arhiva/` intră în
repo. Costul: lista de încărcări e 1 unitate la 50 de clipuri, detaliile la fel. La primele
nouă canale, toată arhiva costa ~150 din cele 10.000 de unități pe zi.

#### Ce e un special

Durata singură nu ajunge: pe canalul lui micul Toma cele mai lungi clipuri sunt livestreamuri
de două ore. Marcajul din **titlu** spune ce e stand-up, durata spune ce fel. Peste asta,
reguli câștigate pe date:

- **Un număr de episod bate orice marcaj.** „StandUp cu Bieber | USP S5E01" e episodul 1 din
  sezonul 5 al emisiunii lui Bordea, nu un special de 45 de minute.
- **Un nume care se repetă pe canal e emisiune**, dar seriile se numără **doar pe titlurile
  fără marcaj**. Altfel numele unui special, repetat pe extrasele lui, trece drept serie și
  scoate exact ce e mai bun: „Zâmbete și Empatie" al lui Micutzu, 5,8 milioane de vizionări.
- **Setul cuiva dintr-un show comun nu e special**, oricât ar ține: „momentul meu în showul de
  la Sala Palatului" are 48 de minute. La fel compilațiile.
- **Un format marcat stand-up, repetat pe materialul lung, e format, nu special**: „STAND-UP LA
  COMANDĂ" la Cîrje. „Stand-up comedy special" repetat nu e format, e doar marcaj.
- **Muzica nu intră.** Pe titlurile fără marcaj, „Official Video", „feat.", „manea" sau
  „showreel" scot clipul. „MASĂ CU ROAST | Invitat X feat. Y" rămâne, fiindcă e marcat.

Pe 15 septembrie 2026 ieșeau 41 de specialuri pe cele 30 de canale, din 3.728 de materiale
păstrate.

### Pagina de artist

`pagini/comediant.html`, randată de `api/comediant.js` la `/comedianti/:slug`. Slugurile care nu
sunt în `artisti.js` dau 404, iar serverul pune în pagină doar arhiva comediantului cerut.

Rafturile — Date anunțate, Specialuri, Momente și seturi, Clipuri scurte — apar doar când au
ce arăta: Vio n-are niciun special, deci pe pagina lui nu există raft de specialuri. În
rafturi, **cel mai vizionat primul**, nu cel mai nou: cine ajunge aici prima oară trebuie să
dea peste ce a rupt de pe canal, nu peste ce s-a postat ieri. Ordinea cronologică e treaba
primei pagini.

Toate cele 30 de canale active au pagină. O pagină numai cu clipuri scurte e în regulă — 164 de
shorturi ale lui Vio, cel mai vizionat primul, e exact ce caută omul care a nimerit aici.

### Calendarul

42 de zile de la azi, cu numărul de showuri sub fiecare dată, weekendurile marcate discret,
zilele goale stinse și neinteractive. Click pe o zi înseamnă `?zi=`, deci link partajabil. Ziua
de azi duce la `/`, ca aceeași pagină să nu aibă două adrese.

## Randare pe server și căutare

Până pe 15 septembrie 2026 paginile se desenau doar din JS. ChatGPT, Claude și Perplexity nu
rulează JS, deci vedeau un `<h1>` gol; toate paginile de comediant aveau același titlu,
„Comediant · hailastandup", iar `/comedianti/orice` răspundea 200.

Acum `vercel.json` rescrie `/`, `/comedianti/:slug` și `/sitemap.xml` spre funcții. **Vercel
servește fișierul static înaintea rescrierii**, deci șabloanele stau în `pagini/`, nu în
`public/`: un `public/index.html` ar ține `/` departe de `api/acasa.js` pentru totdeauna.

- **O singură randare.** `public/randare.js` scrie HTML-ul și pe server, și în browser. Serverul
  pune pe fiecare bloc amprenta lui (`data-h`), iar browserul rescrie un bloc doar când iese
  altfel: alt oraș, un filtru, date live noi. La pornire nu rescrie nimic.
- **Ora României în ambele locuri.** Serverul Vercel e pe UTC. Dacă fiecare și-ar socoti „azi"
  după ceasul propriu, după miezul nopții serverul și pagina ar vedea zile diferite.
- **Funcțiile citesc snapshotul de pe disc, nu iaBilet.** Răspunsul stă 5 minute la marginea
  Vercel. Prospețimea live rămâne treaba browserului, prin `/api/events`.
- **Adresa canonică e `https://www.hailastandup.ro`.** `hailastandup.ro` redirecționează acolo
  din setările de domeniu Vercel, iar adresele `*.vercel.app` de producție, din `vercel.json`.
- **`?zi=` și `?cauta=` sunt `noindex, follow`.** Bune de trimis cuiva, nu de indexat.
- **`robots.txt` închide `/api/`.** O cerere la `/api/events` scrapează iaBilet.
- **Schema: WebSite și Organization pe prima pagină, Person pe comediant.** **Nu Event** pe
  paginile de listă. Google: „Each event MUST have a unique URL (a leaf page) and markup on that
  URL". Event intră odată cu pagina de spectacol.
- **Pictograma** e „h" din Geist SemiBold pe `#1b1c1f`: `favicon.ico` (16, 32, 48), `icon.svg`,
  `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable.png`. Imaginea de
  distribuire e `og.png`, 1200×630. Pe comediant, distribuirea ia miniatura celui mai văzut
  material.
- **Vercel Web Analytics** e pus în pagină doar pe Vercel și cere activare din dashboard. Nu
  folosește cookie-uri.

## Cine e scos de pe site

`scraper/exclusi.mjs` ține o listă de nume exacte. Potrivirea ignoră diacriticele și
majusculele — sursa scrie același nume și cu, și fără diacritice —, dar nu taie în mijlocul
unui cuvânt. Pentru fiecare nume de pe listă:

- showurile în care apar **doar ei** nu se listează deloc;
- din showurile comune le dispare numele din titlu și din descriere, cu enumerarea refăcută:
  „cu A, B, C și X" devine „cu A, B și C";
- nu primesc canal, pagină sau clip, iar clipurile altora care îi pomenesc în titlu ies din
  arhivă.

Excluderea se face în `payloadOf`, **înaintea câmpurilor derivate**, deci o au și snapshotul,
și `/api/events`, iar titlul curățat și numele se calculează din titlul deja fără ei. Rămân
două lucruri pe care pagina nu le poate schimba: afișul showului comun și slugul linkului de
bilet de pe iaBilet, care nu se afișează și fără de care cumpărarea s-ar rupe.

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
npm run dev               # public/ plus rescrierile și funcțiile din vercel.json, pe :3000
npm run snapshot          # reface snapshotul de evenimente
npm run arhiva            # reface arhiva pe artist (cere YOUTUBE_API_KEY, doar local)
npm run clipuri           # reface banda „Ce merită văzut" din arhivă, după arhiva
```

## Parser de nume

```bash
node scraper/nume.mjs test   # din rădăcina proiectului
```

Acoperă `cu A, B și C`, `Oraș: Stand-up Comedy - A si B`, `Best of X`,
`A, B și C - Numele Showului`, `… și X la Club 99` și `… și X pe Terasa ComicsClub!` — la
ultimul, până pe 14 septembrie 2026 numele de la coadă se pierdea. La 96% din titlurile
naționale.
