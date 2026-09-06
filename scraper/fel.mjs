// Ce e stand-up si ce fel de material e, pe canalul unui comediant.
//
// Doua reguli invatate din date, in ordinea asta:
//
// 1. MARCAJUL DIN TITLU decide daca e stand-up, nu o politica pusa pe canal. Toate cele noua
//    canale urmarite ruleaza si altceva pe acelasi canal: „Colegi de camera" la Bordea,
//    „Popesco Show" la Popesco, „CineStieCe" la Teo, „M am convins" la Vio, podcastul cu
//    Mihai Craciun la Mincu. Presupunerea „pe un canal de stand-up intra tot" trecea 111
//    episoade de podcast drept specialurile lui Bordea.
//
// 2. Ce n-are marcaj intra doar daca e SCURT si nu face parte dintr-o serie. Un short taiat
//    dintr-un show nu vine mereu etichetat, dar o emisiune se recunoaste: numar de episod sau
//    un nume care se repeta pe canal. Materialul lung fara marcaj e livestream, gala sau
//    interviu, si nu intra: asa cad „REVOLUTIA COMEDIEI" (173m, pusa pe trei canale) si
//    „Popesco Show #48" (126m).
//
// Seriile se numara DOAR pe titlurile fara marcaj. Altfel numele unui special, repetat pe
// extrasele lui, trece drept serie si scoate exact ce e mai bun de pe canal — „Zambete si
// Empatie" al lui Micutzu, 5,8 milioane de vizionari, pica asa.
//
// Durata nu identifica singura un special: pe canalul lui micul Toma cele mai lungi clipuri
// sunt livestreamuri de doua ore, iar specialul lui adevarat are 61 de minute. Marcajul spune
// ce e stand-up, durata spune ce fel de stand-up e.
//
// Descrierea nu se foloseste: acolo toata lumea isi lipeste aceleasi etichete, iar „Noul
// studio de podcast" ajunge sa treaca drept stand-up.

/** Diacriticele cad: pe YouTube acelasi om scrie si „râzi ca prostu'", si „razi ca prostu". */
export const fara = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Se declara stand-up. Testat pe titlul intreg, cu tot cu hashtaguri: `#standup` e semnal. */
export const MARCAJ =
  /stand[\s-]?up|razi ?ca ?prostu|una ?scurt|unascurta|\bglume?\b|comedian|\bjoke\b|comedy|roast\w*|crowd ?work|show integral|show complet|one man show/;

/** Se declara altceva. Testat pe titlul FARA hashtaguri: multi pun `#podcast` pe orice. */
export const NU_E =
  /\blive\b|🔴|podcast|\bvlog|\btrailer\b|\bteaser\b|detectiv animat|desenam|tableta\b|\bconcurs\b|reactie|reaction/;

/** Semnul unei emisiuni: numar de episod sau de sezon. */
export const EPISOD = /\bep\.? ?\d+|# ?\d+|\bs\d+ ?e\d+|\bepisod|sezon/;

/** O compilatie nu e un special, oricat de lunga ar fi. */
export const BESTOF = /best of|cele mai bune|toate episoadele|compilat/;

/** Se declara show intreg, nu doar „stand-up". Singurul lucru care scoate un material lung
 *  dintr-o serie recunoscuta si-l pune inapoi pe raftul de specialuri. */
export const SPECIAL_TARE =
  /special|show integral|show complet|full[\s-]?show|one man show|stand[\s-]?up (comedy )?(show|night)/;

// Apostroful cade cu totul: pe YouTube acelasi nume apare si cu ' drept, si cu ’ tipografic,
// iar „la nea reelu'" si „la nea reelu" ajungeau in galeti diferite, fiecare sub prag.
const curata = (s) =>
  fara(s).replace(/#\S+/g, '').replace(/\d+/g, '').replace(/['’ʼ]/g, '')
    .replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Titlul spart pe separatoarele cu care lumea isi desparte numele emisiunii de subiect. */
const segmente = (t) => String(t).split(/[|\/•]|\s[-–—]\s/).map(curata).filter((s) => s.length >= 5);

/** Numele unei serii nu vine mereu intre separatoare: „...! La Nea Reelu'" e in coada titlului. */
function trigrame(t) {
  const c = curata(t).split(' ').filter(Boolean);
  const out = [];
  for (let i = 0; i + 3 <= c.length; i++) out.push(c.slice(i, i + 3).join(' '));
  return out;
}

/**
 * Verdict pe un titlu singur, fara contextul canalului. Il foloseste feedul RSS de pe prima
 * pagina, unde avem 15 clipuri pe canal si nicio durata: acolo se cere marcaj explicit,
 * fiindca un episod de podcast strecurat sub „Ce a aparut nou" costa mai mult decat un clip
 * bun lipsa.
 */
export function esteStandup(titlu, canal = {}) {
  const brut = fara(titlu);
  if (NU_E.test(brut.replace(/#[^\s#]+/gu, ' '))) return false;
  if (EPISOD.test(brut)) return false;
  if (MARCAJ.test(brut)) return true;
  // Fara durata nu se poate spune „e scurt, deci e o bucata". Singurul canal pe care se poate
  // trece peste asta e cel unde s-a verificat ca shorturile fara eticheta sunt tot stand-up.
  return canal.scurteFaraMarcaj === true;
}

/**
 * Ce se pastreaza din arhiva completa a unui canal. Cere toate clipurile deodata: seriile se
 * recunosc numai comparand titlurile intre ele.
 *
 * @param {{nume:string, canal:string, alias?:string[]}} canal
 * @param {{titlu:string, durata:number|null}[]} clipuri
 */
export function filtreazaArhiva(canal, clipuri) {
  const nume = new Set([curata(canal.nume), curata(canal.canal), ...(canal.alias ?? []).map(curata)]);
  // „Costel" sau „Costel Stand Up Comedy" se repeta pe tot canalul si nu e nume de emisiune.
  const eNumeleLui = (s) =>
    [...nume].some((n) => n && (s === n || (s.includes(n) && s.replace(n, '').trim().length < 4)));

  const nemarcate = clipuri.filter((v) => !MARCAJ.test(fara(v.titlu)));
  const recurente = (bucati, prag) => {
    const f = new Map();
    for (const v of nemarcate) for (const s of new Set(bucati(v.titlu))) f.set(s, (f.get(s) ?? 0) + 1);
    return new Set([...f].filter(([s, n]) => n >= prag && !eNumeleLui(s)).map(([s]) => s));
  };
  // Acelasi prag pentru amandoua: numele emisiunii apare intre separatoare doar cand omul
  // si-l desparte de subiect. „La Nea Reelu'" sta lipit in coada a patru titluri din cinci.
  const serii = recurente(segmente, 3);
  const serieInCoada = recurente(trigrame, 3);

  const eSerie = (titlu) =>
    EPISOD.test(fara(titlu)) ||
    segmente(titlu).some((s) => serii.has(s)) ||
    trigrame(titlu).some((s) => serieInCoada.has(s));

  return clipuri
    .filter((v) => {
      const t = fara(v.titlu);
      if (NU_E.test(t.replace(/#[^\s#]+/gu, ' '))) return false;
      // Un numar de episod bate orice marcaj: „StandUp cu Bieber | USP S5E01" e episodul 1
      // din sezonul 5 al emisiunii lui Bordea, nu un special de 45 de minute.
      if (EPISOD.test(t)) return false;
      if (MARCAJ.test(t)) return true;
      if (typeof v.durata === 'number' && v.durata >= 300) return false;
      return !eSerie(v.titlu);
    })
    .map((v) => ({ ...v, fel: felul(v.durata, v.titlu, eSerie(v.titlu)) }));
}

/**
 * Praguri alese pe date reale:
 *   special — de la 40 de minute, si numai daca nu e compilatie. Ies 25 pe cele noua canale,
 *             de la „L'esprit de l'escalier" al lui Toma pana la cele patru ale lui Bordea.
 *   moment  — 5 pana la 40 de minute. Un set de club, un crowdwork, o parte dintr-un show.
 *   clip    — sub 5 minute. Extrase si Shorts.
 */
export function felul(secunde, titlu = '', eSerie = false) {
  if (typeof secunde !== 'number' || !isFinite(secunde)) return 'clip';
  if (secunde >= 2400) {
    const t = fara(titlu);
    if (BESTOF.test(t)) return 'moment';
    // Un nume care se repeta pe canal e emisiune, nu special — decat daca titlul chiar spune
    // ca e show intreg. Asa ramane „STAND-UP IN AVION! | La Nea Reelu'" pe raftul de momente,
    // dar „Micutzu | Zambete si Empatie | Stand Up Comedy Special" ramane special.
    if (eSerie && !SPECIAL_TARE.test(t)) return 'moment';
    return 'special';
  }
  if (secunde >= 300) return 'moment';
  return 'clip';
}

export const RAFTURI = [
  { fel: 'special', titlu: 'Specialuri', unu: 'special', multe: 'specialuri' },
  { fel: 'moment', titlu: 'Momente și seturi', unu: 'moment', multe: 'momente' },
  { fel: 'clip', titlu: 'Clipuri scurte', unu: 'clip', multe: 'clipuri' },
];
