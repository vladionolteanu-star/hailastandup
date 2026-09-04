// Canalele de YouTube din care se adună „Ce a apărut nou".
//
// Fiecare `id` a fost rezolvat dintr-un clip real, nu ghicit: se deschide pagina clipului
// si se citeste `channelId` din ea. Cand adaugi un canal, fa la fel — un handle scris din
// memorie poate sa fie al altcuiva.
//
// `politica` spune cum se filtreaza feedul canalului:
//   'standup' — canal de stand-up. Intra tot, mai putin ce e explicit altceva (podcast, vlog).
//   'mixt'    — canal care posteaza si altceva. Intra doar ce se declara stand-up in titlu.

export const CANALE = [
  {
    id: 'UCNPn3cj8Lu1F6_a-zjhYVIg',
    nume: 'Costel',
    canal: 'COSTEL Stand-Up Comedy Official',
    politica: 'standup',
  },
  {
    id: 'UCAaqUlKbywt__K4jvlrRdbA',
    nume: 'Micutzu',
    canal: 'Micutzu Stand-up Official',
    politica: 'standup',
  },
  {
    id: 'UCZI_wTC68u1aMx474Os1N7w',
    nume: 'Mincu',
    canal: 'Mincu - Stand-up Comedy',
    politica: 'standup',
  },
  {
    id: 'UC4tGe5E0imDIGlluh8hKpdQ',
    nume: 'Sorin Pârcălab',
    canal: 'Sorin Pârcălab STAND-UP COMEDY OFFICIAL',
    politica: 'standup',
  },
  {
    // Canal de podcast in primul rand. Specialele de stand-up apar rar, deci se cer explicit.
    id: 'UCF0WTIjRThqdekNZxPFSS6A',
    nume: 'Mihai Bobonete',
    canal: 'DA BRAVO! by Mihai Bobonete',
    politica: 'mixt',
  },
  {
    // Sketch-uri, animatii si vlog. Stand-up-ul e minoritar pe canal.
    id: 'UCySFpz4yYjG87ZM9rwxgLLw',
    nume: 'micul Toma',
    canal: 'micul Toma',
    politica: 'mixt',
  },
];
