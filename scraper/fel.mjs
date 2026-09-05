// Ce e stand-up si ce fel de material e, pe canalul unui comediant.
//
// Durata singura nu ajunge. Pe canalul lui micul Toma, cele mai lungi clipuri sunt
// livestreamuri de doua ore si „10 ore de rata invartindu-se", nu specialuri; iar specialul
// lui adevarat are 61 de minute. Deci: marcaj in TITLU pentru ce e stand-up, durata pentru
// ce fel de stand-up e.
//
// Descrierea nu se foloseste: acolo toata lumea isi lipeste aceleasi etichete, iar „Noul
// studio de podcast" ajunge sa treaca drept stand-up.

const MARCAJ =
  /stand[\s-]?up|standupcomedy|razicaprostu|râzi ?ca ?prostu|una ?scurt|unascurta|\bglume\b|comedian|\bjoke\b|comedy\s+special|\broast\b/i;

const NU_E =
  /\blive\b|🔴|\bpodcast\b|\bvlog\b|\btrailer\b|\bteaser\b|detectiv animat|desen[aă]m|tablet[aă]\b|\bconcurs\b|react(?:ie|ion)/i;

/** Materialul e stand-up? `politica: 'standup'` accepta si ce n-are marcaj explicit. */
export function esteStandup(titlu, politica = 'mixt') {
  const t = String(titlu ?? '');
  if (NU_E.test(t)) return false;
  return politica === 'standup' ? true : MARCAJ.test(t);
}

/**
 * Praguri alese pe date reale, nu din burta:
 *   special — de la 40 de minute. La Toma iese exact unul, „L'esprit de l'escalier", 61:44.
 *   moment  — 5 pana la 40 de minute. Un moment de club sau o compilatie.
 *   clip    — sub 5 minute. Extrase si Shorts.
 */
export function felul(secunde) {
  if (typeof secunde !== 'number' || !isFinite(secunde)) return 'clip';
  if (secunde >= 2400) return 'special';
  if (secunde >= 300) return 'moment';
  return 'clip';
}

export const RAFTURI = [
  { fel: 'special', titlu: 'Specialuri', unu: 'special', multe: 'specialuri' },
  { fel: 'moment', titlu: 'Momente și seturi', unu: 'moment', multe: 'momente' },
  { fel: 'clip', titlu: 'Clipuri scurte', unu: 'clip', multe: 'clipuri' },
];
