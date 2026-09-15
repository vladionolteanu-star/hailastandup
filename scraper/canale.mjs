// Comedianții urmăriți: canalul lor de YouTube plus numele sub care apar în evenimente.
//
// `id` e rezolvat din linkul canonic al paginii de canal (`<link rel="canonical">`), verificat
// să coincidă cu `externalId` și cu id-ul din feedul RSS. Nu scrie un id din memorie și nu-l
// lua din primul `channelId` găsit în pagină — acolo apar și canalele din rafturile laterale.
//
// `alias` sunt nume EXACTE, cum le scoate `nume.mjs` din titlurile de pe iaBilet. Fără potriviri
// parțiale: „Toma" e micul Toma, dar „Adelina Toma" e altcineva, iar „Teo" nu e „Teo Ioniță".
//
// Nu există „canal doar de stand-up". Primele nouă canale urmărite rulau toate și altceva pe
// același canal: „Colegi de cameră" la Bordea, „Popesco Show" la Popesco, „CineȘtieCe" la Teo,
// „M am convins" la Vio. Ce intră și ce nu decide `fel.mjs`, după titlu, la fel pentru toți.
//
// Cine e scos de pe site nu apare aici deloc. Lista stă în `exclusi.mjs`.
//
// `scurteFaraMarcaj: true` = pe canalul ăsta un short fără nicio etichetă e tot o bucată de
// stand-up, verificat pe ce au postat ultima oară: „AM PLÂNS 200 KM #bordea", „RECONFIGURARE
// COPIL #costel". Contează doar pentru feedul RSS de pe prima pagină, care n-are durată. Pe
// canalul lui micul Toma e fals — acolo ce n-are etichetă e animație sau sketch.
//
// `activ: false` = canal cules mai devreme, ținut aici ca să nu se piardă munca de verificare.

export const CANALE = [
  {
    slug: 'micul-toma',
    nume: 'micul Toma',
    canal: 'micul Toma',
    handle: '@miculToma',
    id: 'UCySFpz4yYjG87ZM9rwxgLLw',
    alias: ['Toma'],
    activ: true,
  },
  {
    slug: 'costel',
    nume: 'Costel',
    canal: 'COSTEL Stand-Up Comedy Official',
    handle: '@ConstantinBojog',
    id: 'UCNPn3cj8Lu1F6_a-zjhYVIg',
    alias: ['Costel', 'Costel - Edi Rădoiu'],
    scurteFaraMarcaj: true,
    activ: true,
  },
  {
    slug: 'micutzu',
    nume: 'Micutzu',
    canal: 'Micutzu Stand-up Official',
    handle: '@MicutzuStandupOfficial',
    id: 'UCAaqUlKbywt__K4jvlrRdbA',
    alias: ['Micutzu'],
    activ: true,
  },
  {
    slug: 'mincu',
    nume: 'Mincu',
    canal: 'Mincu - Stand-up Comedy',
    handle: '@mincustandup',
    id: 'UCZI_wTC68u1aMx474Os1N7w',
    alias: ['Mincu'],
    activ: true,
  },
  {
    slug: 'sorin-parcalab',
    nume: 'Sorin Pârcălab',
    canal: 'Sorin Pârcălab STAND-UP COMEDY OFFICIAL',
    handle: '@sorin.parcalab',
    id: 'UC4tGe5E0imDIGlluh8hKpdQ',
    alias: ['Sorin Pârcălab', 'Sorin Pârcălab - Banciu'],
    activ: true,
  },
  {
    slug: 'cristi-popesco',
    nume: 'Cristi Popesco',
    canal: 'Cristi Popesco',
    handle: '@CristiPopesco',
    id: 'UCm5WJQkeuQKAY2fboncNU0Q',
    alias: ['Cristi Popesco'],
    activ: true,
  },
  {
    slug: 'teo',
    nume: 'Teo',
    canal: 'Teo Stand Up',
    handle: '@TeoStandUpComedyOfficial',
    id: 'UCRVErQvx7U8AmvINWa1JuNw',
    alias: ['Teo'],
    activ: true,
  },
  {
    slug: 'vio',
    nume: 'Vio',
    canal: 'Vio Stand-up',
    handle: '@viodragu',
    id: 'UCL409k_nxTgwqWUxubHDREQ',
    alias: ['Vio'],
    activ: true,
  },
  {
    slug: 'bordea',
    nume: 'Bordea',
    canal: 'Bordea Stand Up Comedy Official Channel',
    handle: '@bordeacatalin',
    id: 'UCwO2NgrXCTE0Y4_KxCCVyoQ',
    alias: ['Bordea'],
    scurteFaraMarcaj: true,
    activ: true,
  },

  // --- Din lineupurile săptămânii 14–20 septembrie 2026, confirmați manual unul câte unul.
  // ID-ul e verificat pe handle (channels.list cu forHandle), pe linkul canonic și pe
  // `externalId`. Feedul RSS dădea HTTP 404 la verificare, deci a treia potrivire lipsește. ---
  {
    slug: 'mane-voicu',
    nume: 'Mane Voicu',
    canal: 'Mane Voicu',
    handle: '@manevoicu',
    id: 'UC3PEFLfuGHqPnH4sjYlVdPQ',
    alias: ['Mane Voicu'],
    activ: true,
  },
  {
    slug: 'andrei-ciobanu',
    nume: 'Andrei Ciobanu',
    canal: 'Andrei Ciobanu',
    handle: '@andreiciobanu1',
    id: 'UCJIreuIhaRIRCMNf8NCMwpw',
    alias: ['Andrei Ciobanu'],
    activ: true,
  },
  {
    slug: 'dracea',
    nume: 'Drăcea',
    canal: 'Drăcea',
    handle: '@dracea.adevaratul',
    id: 'UCv21oHsfp-0REmr_DurhcMg',
    alias: ['Drăcea'],
    activ: true,
  },
  {
    slug: 'banciu',
    nume: 'Banciu',
    canal: 'Banciu Stand-up',
    handle: '@banciustandup',
    id: 'UCZLidfXBYFMIYtSMkaNkFjA',
    alias: ['Banciu'],
    activ: true,
  },
  {
    slug: 'florentin-paune',
    nume: 'Florentin Păune',
    canal: 'Florentin Păune',
    handle: '@florentin4real',
    id: 'UCBdZItkpMP4vg9k05Ad1i2A',
    alias: ['Florentin Păune', 'Păune'],
    activ: true,
  },
  {
    slug: 'bogdan-malaele',
    nume: 'Bogdan Mălăele',
    canal: 'Bogdan Malaele',
    handle: '@bogdanmalaele689',
    id: 'UCMpkdd0hUAvmKS00H89GNmA',
    alias: ['Bogdan Mălăele', 'Mălăele'],
    activ: true,
  },
  {
    slug: 'edi-radoiu',
    nume: 'Edi Rădoiu',
    canal: 'Edi Rădoiu',
    handle: '@ediradoiu',
    id: 'UCld0LM_gjrXCKXuC4jU1gFg',
    alias: ['Edi Rădoiu'],
    activ: true,
  },
  {
    slug: 'raul-gheba',
    nume: 'Raul Gheba',
    canal: 'Raul Gheba',
    handle: '@domnulraulgheba',
    id: 'UC_r_x9FkBtuCXeBqAuRTrfg',
    alias: ['Raul Gheba'],
    activ: true,
  },
  {
    slug: 'vlad-olteanu',
    nume: 'Vlad Olteanu',
    canal: 'Vlad Olteanu | Stand Up Comedy',
    handle: '@vladolteanu.standup',
    id: 'UCT-3C9-7sdj9Q9sHXHOFAXQ',
    alias: ['Vlad Olteanu'],
    activ: true,
  },
  {
    slug: 'dan-badea',
    nume: 'Dan Badea',
    canal: 'Badea Stand-up Comedy Official',
    handle: '@danbadeastandupcomedyofficial',
    id: 'UCJfEnkc33yKLSAXd0JQjp7w',
    alias: ['DAN BADEA', 'Dan Badea'],
    activ: true,
  },
  {
    slug: 'nelu-cortea',
    nume: 'Nelu Cortea',
    canal: 'Nelu Cortea Official',
    handle: '@nelucortea',
    id: 'UCIgXbAsZp1wi89b4fV3TLPg',
    alias: ['Cortea', 'Nelu Cortea'],
    activ: true,
  },
  {
    slug: 'madalin-cirje',
    nume: 'Mădălin Cîrje',
    canal: 'Mădălin Cîrje',
    handle: '@crjeee',
    id: 'UCUk_DGg-wgXG_9yyOJ2MqrQ',
    alias: ['Cîrje', 'Mădălin Cîrje'],
    activ: true,
  },
  {
    slug: 'cosmin-natanticu',
    nume: 'Cosmin Natanticu',
    canal: 'COSMIN NATANTICU',
    handle: '@cosminnatanticu5378',
    id: 'UCBYZ9Ga3SxK5GlPAbGqWBdQ',
    alias: ['Natanticu', 'Cosmin Natanticu'],
    activ: true,
  },
  {
    slug: 'dan-frinculescu',
    nume: 'Dan Frînculescu',
    canal: 'Dan Frînculescu',
    handle: '@danfrinculescu',
    id: 'UC2dTxxajTzVRG-hCSQ8NGfQ',
    alias: ['Frînculescu', 'Dan Frînculescu'],
    activ: true,
  },
  {
    slug: 'bucalae',
    nume: 'Bucălae',
    canal: 'Bucalae Radu Mihaita',
    handle: '@radubucalae',
    id: 'UCPMKM28UBLjsQcurpkcHqMg',
    alias: ['Bucălae'],
    activ: true,
  },
  {
    slug: 'teodor-abagiu',
    nume: 'Teodor Abagiu',
    canal: 'Teodor Abagiu',
    handle: '@teodorabagiu4362',
    id: 'UCy25Zk_ddyo3GkZZevtEFWA',
    alias: ['Abagiu', 'Teodor Abagiu'],
    activ: true,
  },
  {
    slug: 'victor-bara',
    nume: 'Victor Băra',
    canal: 'Victor Băra',
    handle: '@victorbara5707',
    id: 'UCc7tpBV7rpoJi-7wYId-OFw',
    alias: ['Băra', 'Victor Băra'],
    activ: true,
  },
  {
    slug: 'geo-adrian',
    nume: 'Geo Adrian',
    canal: 'Geo Adrian',
    handle: '@geostandup',
    id: 'UCt_C-mKQY0aLnIVJJ5W-OKQ',
    alias: ['Adrian', 'Geo Adrian'],
    activ: true,
  },
  {
    slug: 'madalina-mihai',
    nume: 'Mădălina Mihai',
    canal: 'Mădălina de la Lipova',
    handle: '@madalinaalexandramihai',
    id: 'UCMEe1NOeSwgA7aJKgRNQ_wA',
    alias: ['Madalina Mihai', 'Mădălina Mihai'],
    activ: true,
  },

  // --- Podcasturi pornite pe 14 septembrie 2026: oamenii joacă în lineupurile săptămânii, iar
  // filtrul din fel.mjs păstrează de pe canal doar ce se declară stand-up. ---
  {
    slug: 'mihai-bobonete',
    nume: 'Mihai Bobonete',
    canal: 'DA BRAVO! by Mihai Bobonete',
    handle: '@DABRAVO',
    id: 'UCF0WTIjRThqdekNZxPFSS6A',
    alias: ['Mihai Bobonete'],
    activ: true,
  },
  {
    slug: 'alex-dobrota',
    nume: 'Alex Dobrotă',
    canal: 'Alex Dobrotă',
    handle: '@alexdobrota',
    id: 'UC_QeKm2oXFiV0_KKUMv9QvQ',
    alias: ['Alex Dobrotă', 'Dobrotă'],
    activ: true,
  },

  // --- Emisiuni. Verificate, dar scoase din cules deocamdată. ---
  {
    slug: 'niste-oameni',
    nume: 'Niște Oameni',
    canal: 'Niște Oameni',
    handle: '@NisteOameni',
    id: 'UCoTakuJ2QH2C8Wt13MaVuoA',
    alias: [],
    activ: false,
  },
  {
    slug: 'the-fool',
    nume: 'The Fool',
    canal: 'The Fool Club',
    handle: '@thefoolclub',
    id: 'UCrZN9miwsbplTES9tW2AVrw',
    alias: [],
    activ: false,
  },
];

export const CANALE_ACTIVE = CANALE.filter((c) => c.activ);

export const dupaSlug = (slug) => CANALE.find((c) => c.slug === slug) ?? null;
