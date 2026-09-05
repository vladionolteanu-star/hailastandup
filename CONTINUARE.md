# Prompt de continuare — hailastandup.ro

Copiază tot ce e mai jos într-o sesiune nouă.

---

Continuăm la **hailastandup.ro**, agregator public de stand-up românesc. Codul e în
`c:\Users\volteanu\Downloads\ticketing-platform\site` (repo git, branch `main`, deploy automat
pe Vercel la push). Strategia e în `PRODUCT.md` din rădăcina proiectului, arhitectura în
`site/README.md`. Ultimul commit: `f1e635a`.

## Cum lucrăm

- **O secțiune pe rând, pe date reale.** Secțiunile fără date reale nu stau live; se scot până
  le vine rândul. Nu las machetă cu date plauzibile pe site.
- **Nicio cifră fără sursă.** Fiecare număr, dată sau afirmație vine dintr-un fișier de date,
  dintr-un scrape sau din ce am spus eu. Dacă nu există sursa, câmpul lipsește — schimb
  layoutul, nu inventez valoarea. Nici ID-uri de canal, nici handle-uri din memorie.
- **Verifică în browser înainte să spui că e gata.** Playwright e instalat în scratchpad;
  screenshot la 1440 și 390, light și dark, plus verificare de erori JS, imagini rupte și
  scroll orizontal. Fără dovadă, nu e terminat.
- **Gust vizual:** near-monochrome, o singură familie de literă (Geist), 1px borders, culoarea
  vine din afișe și miniaturi. Reper: midday, dub, Linear, shadcn. Nu tipografie editorială,
  nu culoare de brand dominantă, nu motion exagerat.
- **Fii critic, nu complezent.** Dacă ce cer e greșit, spune-mi cu argumente și date. S-a mai
  întâmplat de două ori să am dreptate abia după ce te-ai uitat în date.
- Livrare: linkul sau calea, apoi stop. Fără rezumat al conținutului, fără caveats nesolicitate.

## Ce e live acum

Prima pagină, `public/index.html`:

- **Header**: marcă, căutare (comediant / club / oraș, cu `/` pe tastatură), selector de oraș.
- **Bandă de calendar**: 42 de zile, cu numărul de showuri sub fiecare dată.
- **Ziua curentă**: showurile de azi, grupate pe oraș, orașul ales primul. `?zi=AAAA-LL-ZZ`
  deschide altă zi.
- **Blocuri pliabile**: Mâine / Poimâine / Weekend, după o regulă care nu dublează niciodată
  aceleași showuri. Verificată pe toate cele șapte zile ale săptămânii.
- **„Ce a apărut nou"**: ultimele 2 clipuri de stand-up de la fiecare canal, din ultimele 120
  de zile.

Pagina de artist, `public/comedianti/artist.html`, servită la `/comedianti/:slug` printr-o
rescriere din `vercel.json`. Există una singură, ca model: **`/comedianti/micul-toma`**, cu
rafturile Date anunțate, Specialuri, Momente și seturi, Clipuri scurte.

## Datele

| sursă | ce dă | unde ajunge |
|---|---|---|
| iaBilet, scrape | showuri, ore, tarife, epuizat | `public/data/events.js`, `/api/events` |
| YouTube RSS | ultimele clipuri, pentru feedul de acasă | `public/data/clipuri.js`, `/api/clipuri` |
| YouTube Data API v3 | arhiva completă, cu durată | `public/data/arhiva.js` |

```bash
npm run dev        # servește public/ pe :3000
npm run snapshot   # reface showurile de pe iaBilet
npm run clipuri    # reface feedul de clipuri recente
npm run arhiva     # reface arhiva completă (cere YOUTUBE_API_KEY)
```

Cheia e în `site/.env.local`, fișier aflat în `.gitignore`.

**Reguli de date câștigate greu, nu le pierde:**

- RSS-ul de YouTube dă **15 clipuri pe canal, plafon fix**. Arhiva completă cere API-ul.
- **Durata singură nu identifică un special.** Pe canalul lui micul Toma cele mai lungi clipuri
  sunt livestreamuri de două ore. Marcajul din **titlu** decide ce e stand-up, durata decide
  ce fel de stand-up e. Descrierea nu se folosește. Vezi `scraper/fel.mjs`.
- **ID-ul de canal se ia din `<link rel="canonical">`** al paginii de canal, verificat cu
  `externalId` și cu id-ul din RSS. Primul `channelId` din HTML e al unui raft lateral.
- **Alias-urile de artist sunt nume exacte.** Datele conțin și „Toma", și „Adelina Toma"; și
  „Teo", și „Teo Ioniță". O potrivire parțială pune datele altcuiva pe pagina unui artist.
- **`oardefault.jpg` există doar pentru clipurile verticale** și dă 404 pentru cele 16:9. E
  semnalul de orientare; fără el, `maxresdefault` al unui Short vine cu bare negre.
- Afișele iaBilet: thumbnailul e semnat la 260×360, dar **originalul e liber și e A4 la
  rezoluție mare**. Se cere prin optimizatorul Vercel, cu revenire la thumbnail.
- În română, numeralul cere **„de"** când ultimele două cifre sunt 0 sau de la 20 în sus:
  „20 de showuri", „135 de materiale", dar „106 clipuri".

## Ce urmează, în ordine

1. **`YOUTUBE_API_KEY` pe Vercel** — Settings → Environment Variables. Local merge, în producție
   nu. (Ăsta e pe mine, spune-mi dacă n-am făcut-o.)
2. **Arhiva pentru celelalte 8 canale active** din `scraper/canale.mjs`. Când există, numele din
   feedul de acasă devin automat linkuri către paginile lor. Costă ~150 din 10.000 de unități/zi.
3. **Cârligul de newsletter pe blocul de weekend** — „anunță-mă ce apare pentru weekendul ăsta".
   Un rând, nu o secțiune. Am fost de acord să intre, l-am amânat.
4. **Legătura show → artist**: cardul de show listează comedianții, fiecare cu link către pagina
   lui. Asta închide bucla „văd un clip, ajung la artist, cumpăr bilet".
5. **Podcasturi și emisiuni** — DA BRAVO!, Niște Oameni, Vorba lui Jerry, The Fool Club sunt deja
   verificate în `canale.mjs` cu `activ: false`. Ideea mea: rezumat automat, „unde s-a râs cel
   mai mult", din transcript. De discutat înainte de construit.

## Deschise

- Numele de orașe fără diacritice pentru care nu există variantă corectă în sursă (`Timisoara`).
  Cere un dicționar de orașe. E punctul 5 din „Deschise" în `PRODUCT.md`.
- `nume.mjs` scoate „Costel - Edi Rădoiu" și „Sorin Pârcălab - Banciu" ca nume unice. Le-am
  acoperit ca alias-uri, dar parserul ar trebui să despartă pe „ - " când ambele părți par nume.
- Politica de suprarezervare pentru T&C, înainte de primul bilet vândut pe bani reali.
