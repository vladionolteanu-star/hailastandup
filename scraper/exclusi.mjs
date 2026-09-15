// Oameni scoși de pe site. Nu primesc canal, pagină sau clip, showurile în care apar singuri
// nu se listează, iar din showurile comune le dispare numele. Decis pe 14 septembrie 2026.
//
// Nume EXACTE, cum apar în lineupurile de pe iaBilet. Potrivirea ignoră diacriticele și
// majusculele — sursa scrie și „Dan Tutu", și „Dan Țuțu" —, dar nu taie în mijlocul unui cuvânt.

import { numeDinTitlu } from './nume.mjs';

export const EXCLUSI = [
  'Dan Tutu',
  'Cristi Manolescu',
  'iVanov',
  'Alex Mocanu',
  'Mocanu', // așa apare Alex Mocanu în lineupurile de la Club 99
  'Teodora Nedelcu',
  'Nedelcu Teodora',
];

// Plierea păstrează lungimea șirului, ca pozițiile găsite să se poată tăia din textul original.
const PLIAT = { ă: 'a', â: 'a', î: 'i', ș: 's', ş: 's', ț: 't', ţ: 't', Ă: 'a', Â: 'a', Î: 'i', Ș: 's', Ş: 's', Ț: 't', Ţ: 't' };
const pliaza = (s) => String(s ?? '').replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (c) => PLIAT[c]).toLowerCase();
const TIPARE = EXCLUSI.map(pliaza).sort((a, b) => b.length - a.length);
const liber = (ch) => ch === undefined || !/[a-z0-9]/.test(ch);

/** Pozițiile numelor scoase într-un text, cel mai lung nume întâi: „Alex Mocanu" înainte de „Mocanu". */
function gaseste(text) {
  const t = pliaza(text);
  const out = [];
  for (const n of TIPARE) {
    for (let i = t.indexOf(n); i !== -1; i = t.indexOf(n, i + n.length)) {
      const j = i + n.length;
      if (liber(t[i - 1]) && liber(t[j]) && !out.some(([a, b]) => i < b && j > a)) out.push([i, j]);
    }
  }
  return out.sort((x, y) => x[0] - y[0]);
}

export const mentioneaza = (text) => gaseste(text).length > 0;

/**
 * Scoate numele dintr-o enumerare, cu tot cu separatorul lui, și reface conjuncția de la coadă:
 * „cu Cîrje, Mincu, Madalina Mihai și Teodora Nedelcu" → „cu Cîrje, Mincu și Madalina Mihai".
 */
export function scoateDinText(text) {
  let s = String(text ?? '');
  for (let loc = gaseste(s)[0]; loc; loc = gaseste(s)[0]) {
    let [a, b] = loc;
    const t = pliaza(s);
    const fata = t.slice(0, a).match(/(,\s*|\s+(si|&)\s+)$/);
    const spate = t.slice(b).match(/^(,\s*|\s+(si|&)\s+)/);
    let conjunctie = null;
    if (fata) {
      if (fata[2]) conjunctie = s.slice(a - fata[0].length, a);
      a -= fata[0].length;
    } else if (spate) {
      b += spate[0].length;
    }
    s = s.slice(0, a) + s.slice(b);
    // Numele scos era ultimul, legat cu „și": virgula dinaintea lui devine „și".
    if (conjunctie) {
      const cap = pliaza(s.slice(0, a));
      const inceput = Math.max(cap.lastIndexOf(' cu '), cap.lastIndexOf(' - '), 0);
      const virgula = cap.lastIndexOf(', ');
      if (virgula > inceput) s = s.slice(0, virgula) + conjunctie + s.slice(virgula + 2);
    }
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}

/**
 * `null` dacă în show apar doar oameni scoși; altfel showul, fără numele lor în titlu și descriere.
 * Numele pe care parserul nu le vede („iVanov", cu literă mică) contează tot ca ale lor.
 */
export function faraExclusi(ev) {
  const inTitlu = mentioneaza(ev.title);
  if (!inTitlu && !mentioneaza(ev.description)) return ev;
  if (inTitlu && !numeDinTitlu(ev.title).some((n) => !mentioneaza(n))) return null;
  return {
    ...ev,
    title: scoateDinText(ev.title),
    description: ev.description == null ? ev.description : scoateDinText(ev.description),
  };
}
