// Comedianții urmăriți: canalul lor de YouTube plus numele sub care apar în evenimente.
//
// `id` e rezolvat din linkul canonic al paginii de canal (`<link rel="canonical">`), verificat
// să coincidă cu `externalId` și cu id-ul din feedul RSS. Nu scrie un id din memorie și nu-l
// lua din primul `channelId` găsit în pagină — acolo apar și canalele din rafturile laterale.
//
// `alias` sunt nume EXACTE, cum le scoate `nume.mjs` din titlurile de pe iaBilet. Fără potriviri
// parțiale: „Toma" e micul Toma, dar „Adelina Toma" e altcineva, iar „Teo" nu e „Teo Ioniță".
//
// `politica` spune cum se filtrează feedul RSS de pe prima pagină:
//   'standup' — canal de stand-up. Intră tot, mai puțin ce se declară altceva (podcast, vlog).
//   'mixt'    — canal care postează și altceva. Intră doar ce se declară stand-up în titlu.
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
    politica: 'mixt',
    activ: true,
  },
  {
    slug: 'costel',
    nume: 'Costel',
    canal: 'COSTEL Stand-Up Comedy Official',
    handle: '@ConstantinBojog',
    id: 'UCNPn3cj8Lu1F6_a-zjhYVIg',
    alias: ['Costel', 'Costel - Edi Rădoiu'],
    politica: 'standup',
    activ: true,
  },
  {
    slug: 'micutzu',
    nume: 'Micutzu',
    canal: 'Micutzu Stand-up Official',
    handle: '@MicutzuStandupOfficial',
    id: 'UCAaqUlKbywt__K4jvlrRdbA',
    alias: ['Micutzu'],
    politica: 'standup',
    activ: true,
  },
  {
    slug: 'mincu',
    nume: 'Mincu',
    canal: 'Mincu - Stand-up Comedy',
    handle: '@mincustandup',
    id: 'UCZI_wTC68u1aMx474Os1N7w',
    alias: ['Mincu'],
    politica: 'standup',
    activ: true,
  },
  {
    slug: 'sorin-parcalab',
    nume: 'Sorin Pârcălab',
    canal: 'Sorin Pârcălab STAND-UP COMEDY OFFICIAL',
    handle: '@sorin.parcalab',
    id: 'UC4tGe5E0imDIGlluh8hKpdQ',
    alias: ['Sorin Pârcălab', 'Sorin Pârcălab - Banciu'],
    politica: 'standup',
    activ: true,
  },
  {
    slug: 'cristi-popesco',
    nume: 'Cristi Popesco',
    canal: 'Cristi Popesco',
    handle: '@CristiPopesco',
    id: 'UCm5WJQkeuQKAY2fboncNU0Q',
    alias: ['Cristi Popesco'],
    politica: 'standup',
    activ: true,
  },
  {
    slug: 'teo',
    nume: 'Teo',
    canal: 'Teo Stand Up',
    handle: '@TeoStandUpComedyOfficial',
    id: 'UCRVErQvx7U8AmvINWa1JuNw',
    alias: ['Teo'],
    politica: 'standup',
    activ: true,
  },
  {
    slug: 'vio',
    nume: 'Vio',
    canal: 'Vio Stand-up',
    handle: '@viodragu',
    id: 'UCL409k_nxTgwqWUxubHDREQ',
    alias: ['Vio'],
    politica: 'standup',
    activ: true,
  },
  {
    slug: 'bordea',
    nume: 'Bordea',
    canal: 'Bordea Stand Up Comedy Official Channel',
    handle: '@bordeacatalin',
    id: 'UCwO2NgrXCTE0Y4_KxCCVyoQ',
    alias: ['Bordea'],
    politica: 'standup',
    activ: true,
  },

  // --- Podcast și emisiuni. Verificate, dar scoase din cules deocamdată. ---
  {
    slug: 'mihai-bobonete',
    nume: 'Mihai Bobonete',
    canal: 'DA BRAVO! by Mihai Bobonete',
    handle: '@DABRAVO',
    id: 'UCF0WTIjRThqdekNZxPFSS6A',
    alias: ['Mihai Bobonete'],
    politica: 'mixt',
    activ: false,
  },
  {
    slug: 'alex-dobrota',
    nume: 'Alex Dobrotă',
    canal: 'Alex Dobrotă',
    handle: '@alexdobrota',
    id: 'UC_QeKm2oXFiV0_KKUMv9QvQ',
    alias: ['Alex Dobrotă', 'Dobrotă'],
    politica: 'mixt',
    activ: false,
  },
  {
    slug: 'niste-oameni',
    nume: 'Niște Oameni',
    canal: 'Niște Oameni',
    handle: '@NisteOameni',
    id: 'UCoTakuJ2QH2C8Wt13MaVuoA',
    alias: [],
    politica: 'mixt',
    activ: false,
  },
  {
    slug: 'the-fool',
    nume: 'The Fool',
    canal: 'The Fool Club',
    handle: '@thefoolclub',
    id: 'UCrZN9miwsbplTES9tW2AVrw',
    alias: [],
    politica: 'mixt',
    activ: false,
  },
];

export const CANALE_ACTIVE = CANALE.filter((c) => c.activ);

export const dupaSlug = (slug) => CANALE.find((c) => c.slug === slug) ?? null;
