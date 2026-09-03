import fs from 'fs';

// Cuvinte care arata ca titlul e o descriere de eveniment, nu un nume de om.
const GENERIC = /stand[-\s]?up|comedy|show|gala|open mic|turneu|filmare|special|roast|seara|seară|best of|improv/i;
const ZGOMOT = /^(show|etapa|ora|duminica|duminică|sambata|sâmbătă|vineri|joi|miercuri|marti|marți|luni)\b/i;

// Extrage numele comediantilor dintr-un titlu de eveniment iaBilet.
// Acopera: "cu A, B si C", "Oras: Stand-up Comedy - A si B", "Best of X",
// "A, B si C - Numele Showului", "cu X - “Titlu Show”".
export function numeDinTitlu(titlu) {
  let s = String(titlu).split('|')[0];
  s = s.replace(/^[^:]{2,26}:\s*/, '');            // prefix de oras
  s = s.replace(/\s*[-–]\s*(?:ORA\s*\d{1,2}[:.]\d{2}|DUMINICA|DUMINICĂ|SAMBATA|SÂMBĂTA|VINERI|JOI|SHOW\s*\d+|ETAPA\s*\d+)\s*$/gi, '');

  let sursa = null;
  let m;
  if ((m = s.match(/\bBest of\s+(.+)$/i))) {
    sursa = m[1];
  } else if ((m = s.match(/\bcu\s+(.+)$/i))) {
    sursa = m[1];
  } else if ((m = s.match(/^(.*?)\s+[-–]\s+(.*)$/))) {
    // "Stand-up Comedy - Dan Tutu si X"  -> numele sunt in dreapta
    // "Teo, Vio si Costel - Orizont Electric" -> numele sunt in stanga
    sursa = GENERIC.test(m[1]) ? m[2] : m[1];
  } else {
    sursa = s;
  }

  return sursa
    .split(/,|\s+si\s+|\s+și\s+|\s*&\s*/i)
    .map(x => x
      .split(/\s+[-–]\s*["“”']/)[0]            // "DAN BADEA - “Domnu’ DANUT”"
      .replace(/["“”'`]/g, '')
      .replace(/\s+la\s+.*$/i, '')
      .replace(/[!?.]+$/, '')
      .trim())
    .filter(x =>
      x.length >= 2 && x.length <= 24 &&
      /^[A-ZĂÂÎȘȚ]/.test(x) &&
      !GENERIC.test(x) &&
      !ZGOMOT.test(x)
    );
}

if (process.argv[2] === 'test') {
  let raw = fs.readFileSync('site/public/data/events.js', 'utf8')
    .replace(/^\s*window\.EVENTS_DATA\s*=\s*/, '').replace(/;\s*$/, '');
  const ev = JSON.parse(raw).events.filter(e => !e.multiDay && e.city !== 'Romania' && e.startDate >= '2026-09-03');
  const fara = ev.filter(e => numeDinTitlu(e.title).length === 0);
  console.log(`parsate: ${ev.length - fara.length}/${ev.length} (${Math.round((1 - fara.length / ev.length) * 100)}%)`);
  if (fara.length) {
    console.log('\nneparsate:');
    fara.slice(0, 8).forEach(e => console.log('   ' + e.title.slice(0, 78)));
  }
  const c = {};
  ev.forEach(e => numeDinTitlu(e.title).forEach(n => { (c[n] = c[n] || []).push(e); }));
  console.log('\ntop 26:');
  Object.entries(c).sort((a, b) => b[1].length - a[1].length).slice(0, 26)
    .forEach(([n, l]) => console.log('   ' + n.padEnd(20) + String(l.length).padStart(3) + ' date, ' +
      String(new Set(l.map(e => e.city)).size).padStart(2) + ' orase'));
}
