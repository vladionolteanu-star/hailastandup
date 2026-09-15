# Prompt de continuare — hailastandup.ro

Copiază tot ce e mai jos într-o sesiune nouă.

---

Continuăm la **hailastandup.ro**, agregator public de stand-up românesc. Codul e în
`c:\Users\volteanu\Downloads\ticketing-platform\site` (repo git, branch `main`, deploy automat
pe Vercel la push). Strategia e în `PRODUCT.md` din rădăcina proiectului, arhitectura în
`site/README.md`. Ultimul commit: vezi `git log -1`.

## Cum lucrăm

- **O secțiune pe rând, pe date reale.** Secțiunile fără date reale nu stau live; se scot până
  le vine rândul. Nu las machetă cu date plauzibile pe site.
- **Nicio cifră fără sursă.** Fiecare număr, dată sau afirmație vine dintr-un fișier de date,
  dintr-un scrape sau din ce am spus eu. Dacă nu există sursa, câmpul lipsește — schimb
  layoutul, nu inventez valoarea. Nici ID-uri de canal, nici handle-uri din memorie.
- **Eu sunt sursa de adevăr pentru cine e cine.** Nu lega un nume din lineup de un canal fără
  să mă întrebi. Potrivirea doar pe numele de familie, un prenume din altă sursă sau două canale
  cu același nume nu sunt dovezi. Adu-mi lista cu propunerile, eu confirm sau tai.
- **Verifică în browser înainte să spui că e gata.** Screenshot la 1440 și 390, light și dark,
  plus verificare de erori JS, imagini rupte și scroll orizontal. Fără dovadă, nu e terminat.
  Serverul local e `npm run dev`. Browserele sunt în `%LOCALAPPDATA%\ms-playwright`; scratchpadul
  se golește între sesiuni, deci `playwright-core` se reinstalează acolo și se pornește cu
  `executablePath` spre chromium.
- **Gust vizual:** near-monochrome, o singură familie de literă (Geist), 1px borders, culoarea
  vine din afișe și miniaturi. Reper: midday, dub, Linear, shadcn. Nu tipografie editorială,
  nu culoare de brand dominantă, nu motion exagerat.
- **Fii critic, nu complezent.** Dacă ce cer e greșit, spune-mi cu argumente și date. S-a mai
  întâmplat de două ori să am dreptate abia după ce te-ai uitat în date.
- Livrare: linkul sau calea, apoi stop. Fără rezumat al conținutului, fără caveats nesolicitate.

## Ce e live acum

Ambele pagini sunt **randate pe server** (`api/acasa.js`, `api/comediant.js`) din șabloanele din
`pagini/`, cu funcțiile din `public/randare.js`, aceleași pe care le folosește și browserul. Vezi
„Randare pe server și căutare" în `README.md`.

Prima pagină, `pagini/acasa.html`:

- **Header**: marcă, căutare (comediant / club / oraș, cu `/` pe tastatură), selector de oraș.
- **Bandă de calendar**: 42 de zile, cu numărul de showuri sub fiecare dată.
- **Ziua curentă**: showurile de azi, grupate pe oraș, orașul ales primul. `?zi=AAAA-LL-ZZ`
  deschide altă zi.
- **Blocuri pliabile**: Mâine / Poimâine / Weekend, după o regulă care nu dublează niciodată
  aceleași showuri. Verificată pe toate cele șapte zile ale săptămânii.
- **„Ce merită văzut"**: câte un clip de comediant, cel mai văzut al lui din ultimele 120 de
  zile, pentru toți comedianții urmăriți care au unul, ordonate după vizionări. Primele opt se
  văd, restul vin la „Încă". Banda nu spune câți comedianți sunt.

Pagina de artist, `pagini/comediant.html`, la `/comedianti/:slug`. **Toate cele 30 de canale
active au pagină**, orice alt slug dă 404. Rafturile — Date anunțate, Specialuri, Momente și
seturi, Clipuri scurte — apar doar când au ce arăta, iar în ele stă **cel mai vizionat primul**,
nu cel mai nou. Numele din bandă duc la paginile lor.

**Căutare și distribuire**, din 15 septembrie 2026: titlu și descriere proprii pe fiecare pagină,
adresa canonică `https://www.hailastandup.ro`, `robots.txt`, `/sitemap.xml`, pictograma „h" pe
cărbune, `og.png` pentru distribuire, schema WebSite și Organization pe prima pagină, Person pe
comediant.

Canalele au crescut de la 9 la 30 pe 14 septembrie 2026, din lineupurile săptămânii 14–20
septembrie, cu fiecare potrivire confirmată de mine.

## Datele

| sursă | ce dă | unde ajunge |
|---|---|---|
| iaBilet, scrape | showuri, ore, tarife, epuizat | `public/data/events.js`, `/api/events` |
| YouTube Data API v3 | arhiva completă, cu durată | `public/data/arhiva/<slug>.js`, apoi banda din `public/data/clipuri.js` |

```bash
npm run dev        # public/ plus rescrierile și funcțiile din vercel.json, pe :3000
npm run snapshot   # reface showurile de pe iaBilet
npm run arhiva     # reface arhiva pe artist (cere YOUTUBE_API_KEY)
npm run clipuri    # reface banda „Ce merită văzut" din arhivă, după arhiva
```

Cheia e în `site/.env.local`, fișier aflat în `.gitignore`. **Pe Vercel nu e nevoie de ea**:
culesul se face local, iar `public/data/arhiva/` intră în repo. Nicio funcție din `api/` n-o
citește.

**Reguli de date câștigate greu, nu le pierde:**

- RSS-ul de YouTube dă **15 clipuri pe canal, plafon fix**. Arhiva completă cere API-ul.
- **Durata singură nu identifică un special.** Pe canalul lui micul Toma cele mai lungi clipuri
  sunt livestreamuri de două ore. Marcajul din **titlu** decide ce e stand-up, durata decide
  ce fel de stand-up e. Descrierea nu se folosește. Vezi `scraper/fel.mjs`.
- **Nu există „canal doar de stand-up".** Primele nouă canale rulau toate și altceva pe același
  canal: „Colegi de cameră" la Bordea, „Popesco Show" la Popesco, „CineȘtieCe" la Teo, „M am
  convins" la Vio. Vechea `politica: 'standup'` trecea 111 episoade de podcast drept
  specialurile lui Bordea. Regula e una singură acum, aceeași pentru toți.
- **Un număr de episod bate orice marcaj.** „StandUp cu Bieber | USP S5E01" e episodul 1 din
  sezonul 5, nu un special de 45 de minute.
- **Seriile se numără DOAR pe titlurile fără marcaj.** Altfel numele unui special, repetat pe
  extrasele lui, trece drept serie și scoate exact ce e mai bun de pe canal — așa cădea
  „Zâmbete și Empatie" al lui Micutzu, 5,8 milioane de vizionări.
- **Setul cuiva dintr-un show comun și episodul unui format nu sunt specialuri.** „Momentul meu
  în showul de la Sala Palatului" are 48 de minute la Bobonete; „STAND-UP LA COMANDĂ" la Cîrje
  e format.
- **Muzica nu e stand-up.** Pe titlurile fără marcaj, „Official Video", „feat.", „manea",
  „showreel" scot clipul. Așa au ieșit videoclipuri la Drăcea, Nelu Cortea, Micutzu, Costel.
- **Cine e scos de pe site stă în `scraper/exclusi.mjs`.** Showurile doar cu ei nu se listează,
  din cele comune le dispare numele, clipurile care îi pomenesc ies din arhivă. Nu readuce pe
  nimeni de acolo fără să mă întrebi, și nu le scrie numele în documentație.
- **Vercel servește fișierul static înaintea rescrierii.** De aceea șabloanele stau în `pagini/`,
  nu în `public/`. Local, `npm run dev` aplică rescrierile și rulează funcțiile; `npx serve` nu
  vede paginile deloc.
- **Schema Event doar pe pagina unui singur spectacol.** Google: „Each event MUST have a unique
  URL (a leaf page) and markup on that URL". Pe prima pagină și pe cea de comediant nu intră.
- **ID-ul de canal se ia din `<link rel="canonical">`** al paginii de canal, verificat cu
  `externalId` și cu id-ul din RSS. Primul `channelId` din HTML e al unui raft lateral. Când
  RSS-ul dă 404, a treia cale e `channels.list` cu `forHandle`.
- **Alias-urile de artist sunt nume exacte.** Datele conțin și „Toma", și „Adelina Toma"; și
  „Teo", și „Teo Ioniță". O potrivire parțială pune datele altcuiva pe pagina unui artist.
- **`oardefault.jpg` există doar pentru clipurile verticale** și dă 404 pentru cele 16:9. E
  semnalul de orientare; fără el, `maxresdefault` al unui Short vine cu bare negre.
- Afișele iaBilet: thumbnailul e semnat la 260×360, dar **originalul e liber și e A4 la
  rezoluție mare**. Se cere prin optimizatorul Vercel, cu revenire la thumbnail.
- În română, numeralul cere **„de"** când ultimele două cifre sunt 0 sau de la 20 în sus:
  „20 de showuri", „135 de materiale", dar „106 clipuri".

## Ce urmează, în ordine

1. **Cârligul de newsletter pe blocul de weekend** — „anunță-mă ce apare pentru weekendul ăsta".
   Un rând, nu o secțiune. Am fost de acord să intre, l-am amânat.
2. **Legătura show → artist**: cardul de show listează comedianții, fiecare cu link către pagina
   lui. Asta închide bucla „văd un clip, ajung la artist, cumpăr bilet".
3. **Podcasturi și emisiuni** — DA BRAVO! și Alex Dobrotă sunt pornite doar pentru stand-up-ul
   marcat; Niște Oameni și The Fool Club stau în `canale.mjs` cu `activ: false`. Ideea mea:
   rezumat automat, „unde s-a râs cel mai mult", din transcript. De discutat înainte de construit.

## Deschise

- **De făcut de mine, pentru căutare.** Google Search Console: proprietate de domeniu, verificată
  cu un TXT în DNS-ul de pe Vercel, apoi trimis `/sitemap.xml`. Bing Webmaster Tools: importat
  din Search Console. Web Analytics: activat din dashboardul Vercel — scriptul e deja în pagină
  și dă 404 până atunci.
- **Cea mai mare pârghie de căutare rămasă e pagina de spectacol**, `/spectacole/<slug>` din
  `PRODUCT.md`: Google afișează rezultate de eveniment doar pentru pagini cu un singur spectacol.
- Din lineupurile săptămânii 14–20 septembrie, fără canal găsit: Ioana State, Denise Alexe,
  Maria Popovici, MC Popică, Beni, Havri, Sașa, Anisia, Dan Birtaș, Bogdan Tătaru, Mitran.
  Necăutați, fiindcă parserul îi pierdea: Mirică, Nego, Adelina.
- Fără răspuns de la mine: „Frîncu" e același om cu Dan Frînculescu? Gabi Dumitriu e
  @pupazadinmortiitei-1 sau @gabrieldumitru?
- Afișul unui show comun poate arăta în continuare pe cineva scos de pe site, iar slugul
  linkului de bilet de pe iaBilet îi conține numele. Afișul nu se editează, linkul nu se schimbă
  fără să rupă cumpărarea.
- Numele de orașe fără diacritice pentru care nu există variantă corectă în sursă (`Timisoara`).
  Cere un dicționar de orașe. E punctul 5 din „Deschise" în `PRODUCT.md`.
- `nume.mjs` scoate „Costel - Edi Rădoiu" și „Sorin Pârcălab - Banciu" ca nume unice. Le-am
  acoperit ca alias-uri, dar parserul ar trebui să despartă pe „ - " când ambele părți par nume.
- Politica de suprarezervare pentru T&C, înainte de primul bilet vândut pe bani reali.
