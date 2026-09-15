/*
 * Randarea paginilor, aceeași pe server și în browser.
 *
 * Serverul (api/acasa.js, api/comediant.js) scrie HTML-ul cu funcțiile de aici, ca pagina să aibă
 * conținut și pentru motoarele de căutare și roboții AI, care nu rulează JS. Browserul le
 * refolosește apoi pentru oraș, căutare și reîmprospătarea live.
 *
 * Fără import și export: fișierul merge și ca script clasic în pagină, și ca modul ES în Node, iar
 * în ambele cazuri se agață de globalThis.Randare.
 */
(function (radacina) {
  'use strict';

  var ZILE = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
  var LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
              'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  var ZILE_SCURT = ['dum', 'lun', 'mar', 'mie', 'joi', 'vin', 'sâm'];
  var LUNI_SCURT = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'];

  /* ---------- date ---------- */

  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dinIso(s) { var p = String(s).slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function plusZile(zi, n) { var d = dinIso(zi); d.setDate(d.getDate() + n); return iso(d); }
  function numeZi(s) { var d = dinIso(s); return ZILE[d.getDay()] + ', ' + d.getDate() + ' ' + LUNI[d.getMonth()]; }
  function numeScurt(zi) { var d = dinIso(zi); return ZILE_SCURT[d.getDay()] + ' ' + d.getDate(); }
  function cuMajuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /*
   * Ziua și ora se socotesc pe ora României oriunde ar rula codul: pe serverul Vercel, care e pe
   * UTC, în browserul cuiva din Londra sau în randatorul Google. Altfel, după miezul nopții,
   * serverul și pagina ar vedea zile diferite și pagina s-ar rescrie cu altă zi.
   */
  var ORA_RO = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
  function ceas(cand) {
    var p = {};
    ORA_RO.formatToParts(cand == null ? new Date() : new Date(cand)).forEach(function (x) { p[x.type] = x.value; });
    return { zi: p.year + '-' + p.month + '-' + p.day, ora: p.hour + ':' + p.minute, minute: (+p.hour) * 60 + (+p.minute) };
  }

  function inZi(e, zi) {
    return e.multiDay ? (e.startDate <= zi && e.endDate >= zi) : e.startDate === zi;
  }
  function inMinute(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }

  /* In romana, numeralul cere „de" cand ultimele doua cifre sunt 0 sau de la 20 in sus:
   * 3 showuri, 11 showuri, 20 DE showuri, 106 clipuri, 135 DE materiale. */
  function plural(n, unu, multe) {
    if (n === 1) return n + ' ' + unu;
    var ultimele = Math.abs(n) % 100;
    return n + (ultimele === 0 || ultimele >= 20 ? ' de ' : ' ') + multe;
  }

  /* ---------- text ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function plat(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[^a-z0-9 ]/gi, '').toLowerCase().trim();
  }

  function pretText(e) {
    if (e.pretDeLa == null) return null;
    var n = e.pretDeLa;
    var v = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',').replace(/,00$/, '');
    return 'de la ' + v + ' lei';
  }

  function vizionari(n) {
    if (typeof n !== 'number' || !isFinite(n) || n < 0) return null;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' mil. de vizionări';
    if (n >= 1e4) return Math.round(n / 1e3) + ' mii de vizionări';
    return n.toLocaleString('ro-RO') + (n === 1 ? ' vizionare' : ' vizionări');
  }

  function durataText(s) {
    if (typeof s !== 'number' || !isFinite(s)) return '';
    var o = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return o ? o + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec);
  }

  /* Amprenta unui bloc de HTML. Pagina nu rescrie un bloc pe care serverul l-a scris deja identic. */
  function amprenta(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  /* ---------- imagini ---------- */

  /* Thumb-ul de pe iaBilet e semnat la 260x360. Originalul e liber si e A4 la rezolutie mare. */
  function original(url) {
    var m = String(url || '').match(/\/(https?%3A%2F%2F.+)$/i);
    return m ? decodeURIComponent(m[1]) : null;
  }
  /* Optimizatorul de imagini exista doar pe Vercel. Local, poza se cere direct de la sursa. */
  function poza(sursa, w, peVercel) {
    var u = original(sursa) || sursa;
    if (!u) return '';
    return peVercel ? '/_vercel/image?url=' + encodeURIComponent(u) + '&w=' + w + '&q=80' : u;
  }

  var SAGEATA =
    '<svg class="bloc__sageata" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
      '<path d="M2.6 4.6 6 8l3.4-3.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '</svg>';

  /* Listarile-umbrela de turneu nu sunt reprezentatii: nu au ora, nu au sala, tin saptamani. */
  function showuri(events) {
    return (events || []).filter(function (e) { return e.tip !== 'turneu'; });
  }

  /* ================= prima pagină ================= */

  /* Un oras merita banda proprie doar daca umple un rand. Sub pragul asta ar iesi o eticheta
   * si trei coloane goale, deci orasele subtiri se string intr-o singura banda de coada. */
  var PRAG_BANDA = 3;

  /* Un clip de comediant, deci lista crește cu fiecare canal urmărit. Se văd primele opt,
   * restul vin la apăsare, ca prima pagină să nu devină un zid de miniaturi. */
  var CLIPURI_PAS = 8;

  function dupaOra(a, b) { return (a.time || '~').localeCompare(b.time || '~'); }

  /* Fereastra vineri–duminică din care face parte ziua, sau următoarea dacă e deja duminică. */
  function fereastraWeekend(zi) {
    var g = dinIso(zi).getDay();
    var deplasare = g === 0 ? 5 : (g === 6 ? -1 : 5 - g);
    var vineri = plusZile(zi, deplasare);
    return [vineri, plusZile(vineri, 1), plusZile(vineri, 2)];
  }

  /*
   * Starea paginii intră, HTML-ul fiecărui bloc iese:
   *   { showuri, azi, zi, acum, oras, filtru, peVercel, deschis(tip), clipuri, clipuriAratate,
   *     cuPagina, scrapedAt }
   *   -> { titlu, meta, capDr, calendar, benzi, urmeaza, clipuri, subsol }
   * `titlu`, `meta` și `subsol` sunt text simplu, restul e HTML.
   */
  function acasa(ctx) {
    var ZI = ctx.zi;
    var AZI = ctx.azi;
    var SHOWURI = ctx.showuri;
    var filtru = ctx.filtru;
    var peVercel = ctx.peVercel;
    /* Ora curentă contează doar când ziua afișată chiar e azi. */
    var acumZi = ZI === AZI && typeof ctx.acum === 'number' ? ctx.acum : -1;
    /* Primele afișe se văd fără scroll. Leneșe, ar întârzia cea mai mare imagine a paginii. */
    var grabnice = 4;

    function evenimenteDeAfisat() {
      if (!filtru) return SHOWURI.filter(function (e) { return inZi(e, ZI); });
      return filtru.ev.slice().sort(function (a, b) {
        return (a.startDate || '').localeCompare(b.startDate || '') ||
               (a.time || '').localeCompare(b.time || '');
      });
    }

    function grupeaza(lista, mod, acum) {
      var pe = new Map();

      if (mod === 'zi') {
        lista.forEach(function (e) {
          if (!pe.has(e.startDate)) pe.set(e.startDate, []);
          pe.get(e.startDate).push(e);
        });
        return Array.from(pe.entries()).map(function (par) {
          return {
            eticheta: cuMajuscula(numeZi(par[0])),
            sub: par[0] === AZI ? 'azi' : plural(par[1].length, 'show', 'showuri'),
            ev: par[1].sort(dupaOra),
            aratOras: true
          };
        });
      }

      lista.forEach(function (e) {
        var o = e.oras || e.city || 'Fără oraș';
        if (!pe.has(o)) pe.set(o, []);
        pe.get(o).push(e);
      });
      pe.forEach(function (ev) {
        ev.sort(function (a, b) {
          var ta = inMinute(a.time), tb = inMinute(b.time);
          var pa = (ta != null && acum >= 0 && ta < acum) ? 1 : 0;
          var pb = (tb != null && acum >= 0 && tb < acum) ? 1 : 0;
          return pa - pb || (a.time || '~').localeCompare(b.time || '~');
        });
      });
      var ordonate = Array.from(pe.entries()).sort(function (a, b) {
        if (a[0] === ctx.oras) return -1;
        if (b[0] === ctx.oras) return 1;
        return b[1].length - a[1].length || a[0].localeCompare(b[0], 'ro');
      });

      var proprii = [], coada = [];
      ordonate.forEach(function (par) {
        if (par[0] === ctx.oras || par[1].length >= PRAG_BANDA) proprii.push(par);
        else coada = coada.concat(par[1]);
      });

      var benzi = proprii.map(function (par) {
        return { eticheta: par[0], sub: plural(par[1].length, 'show', 'showuri'), ev: par[1], aratOras: false };
      });

      if (coada.length) {
        var orase = new Set(coada.map(function (e) { return e.oras || e.city; })).size;
        benzi.push({
          /* Cand nu e nimic altceva pe pagina, o eticheta „Alte orașe" n-ar avea fata de ce. */
          eticheta: benzi.length ? (orase === 1 ? (coada[0].oras || coada[0].city) : 'Alte orașe') : '',
          sub: benzi.length ? plural(orase === 1 ? coada.length : orase, orase === 1 ? 'show' : 'oraș', orase === 1 ? 'showuri' : 'orașe') : '',
          ev: coada.sort(dupaOra),
          aratOras: true
        });
      }

      return benzi;
    }

    /* Cand banda e un oras, orasul e in eticheta. Cand banda e o zi, trebuie pus pe card. */
    function numeLoc(e, aratOras) {
      var oras = e.oras || e.city || '';
      var sala = e.venue || '';
      if (!aratOras) return sala || oras;
      if (!sala) return oras;
      return oras && oras !== sala ? sala + ', ' + oras : sala;
    }

    function cardShow(e, acum, aratOras) {
      var t = inMinute(e.time);
      var trecut = acum >= 0 && t != null && t < acum && !filtru;
      var clase = 'show' + (e.soldOut ? ' show--epuizat' : '') + (trecut ? ' show--trecut' : '');
      var pret = pretText(e);
      var url = poza(e.image, 420, peVercel);

      var stareEt = e.soldOut
        ? '<span class="stare stare--epuizat">Epuizat</span>'
        : (trecut ? '<span class="stare">A început</span>' : '');

      /* Originalul lipseste uneori de pe CDN. Atunci cade pe thumb-ul semnat, apoi pe titlu. */
      var afis = url
        ? '<img src="' + esc(url) + '" srcset="' + esc(url) + ' 1x, ' + esc(poza(e.image, 720, peVercel)) + ' 2x"' +
          (e.image && e.image !== url ? ' data-rezerva="' + esc(e.image) + '"' : '') +
          ' alt="Afișul pentru ' + esc(e.titlu) + '"' + (grabnice-- > 0 ? '' : ' loading="lazy"') + ' decoding="async">'
        : '<span class="show__gol">' + esc(e.titlu) + '</span>';

      return '<a class="' + clase + '" href="' + esc(e.url || '#') + '" target="_blank" rel="noopener">' +
        '<div class="show__afis">' + afis + stareEt + '</div>' +
        '<div class="show__meta nums">' +
          (e.time ? '<span class="show__ora">' + esc(e.time) + '</span>' : '') +
          '<span class="show__sala">' + esc(numeLoc(e, aratOras)) + '</span>' +
        '</div>' +
        '<div class="show__nume">' + esc(e.titlu) + '</div>' +
        '<div class="show__jos nums">' +
          (pret ? '<span>' + esc(pret) + '</span>' : '') +
          (e.repriza ? '<span class="show__rep">repriza ' + e.repriza + '</span>' : '') +
        '</div>' +
      '</a>';
    }

    function benziHtml(grupuri, acum) {
      return grupuri.map(function (g) {
        return '<section class="banda">' +
          '<div class="banda__et">' +
            (g.eticheta ? '<b>' + esc(g.eticheta) + '</b><span class="nums">' + esc(g.sub) + '</span>' : '') +
          '</div>' +
          '<div class="rafturi">' +
            g.ev.map(function (e) { return cardShow(e, acum, g.aratOras); }).join('') +
          '</div>' +
        '</section>';
      }).join('');
    }

    /* ---------- ce urmează după ziua ancoră ---------- */

    function evDinZile(zile) {
      return SHOWURI.filter(function (e) {
        return zile.some(function (z) { return inZi(e, z); });
      });
    }

    /*
     * Mâine și poimâine apar doar când NU sunt deja în fereastra de weekend, altfel aceleași
     * showuri ar fi pe pagină de două ori. Vinerea, mâine și poimâine sunt sâmbătă și duminică,
     * deci rămâne doar blocul de weekend. Sub două zile rămase, weekendul nu merită bloc propriu.
     */
    function blocuriUrmatoare(ancora) {
      var relativ = ancora === AZI;
      var we = fereastraWeekend(ancora).filter(function (z) { return z > ancora; });
      var grupWe = we.length >= 2 ? we : [];
      var blocuri = [];

      for (var n = 1; n <= 2; n++) {
        var z = plusZile(ancora, n);
        if (grupWe.indexOf(z) !== -1) continue;
        var ev = evDinZile([z]);
        if (!ev.length) continue;
        blocuri.push({
          tip: n === 1 ? 'maine' : 'poimaine',
          eticheta: relativ ? (n === 1 ? 'Mâine' : 'Poimâine') : cuMajuscula(numeZi(z)),
          sufix: relativ ? numeZi(z).split(',')[0] : '',
          zile: [z], mod: 'oras', ev: ev
        });
      }

      if (grupWe.length) {
        var evWe = evDinZile(grupWe);
        if (evWe.length) {
          var g = dinIso(ancora).getDay();
          var et = !relativ ? 'Weekendul' : (g === 5 || g === 6) ? 'Restul weekendului'
                 : g === 0 ? 'Weekendul viitor' : 'Weekendul ăsta';
          blocuri.push({
            tip: 'weekend',
            eticheta: et,
            sufix: numeScurt(grupWe[0]) + ' – ' + numeScurt(grupWe[grupWe.length - 1]),
            zile: grupWe, mod: 'zi', ev: evWe
          });
        }
      }

      return blocuri.sort(function (a, b) { return a.zile[0].localeCompare(b.zile[0]); });
    }

    function urmatorulDupa(zi) {
      var viit = SHOWURI
        .filter(function (e) { return (e.startDate || '') > zi; })
        .sort(function (a, b) {
          return a.startDate.localeCompare(b.startDate) || (a.time || '').localeCompare(b.time || '');
        });
      return viit.length ? viit[0] : null;
    }

    /* ---------- calendarul ---------- */

    function numaraPeZi(nrZile) {
      var pe = new Map(), ord = [];
      for (var i = 0; i < nrZile; i++) {
        var z = plusZile(AZI, i);
        pe.set(z, 0);
        ord.push(z);
      }
      SHOWURI.forEach(function (e) {
        if (e.multiDay) {
          ord.forEach(function (z) { if (inZi(e, z)) pe.set(z, pe.get(z) + 1); });
        } else if (pe.has(e.startDate)) {
          pe.set(e.startDate, pe.get(e.startDate) + 1);
        }
      });
      return { pe: pe, ord: ord };
    }

    function calendar() {
      var c = numaraPeZi(42);
      var lunaAnt = -1;

      return c.ord.map(function (z) {
        var d = dinIso(z);
        var n = c.pe.get(z);
        var g = d.getDay();
        var lunaNoua = d.getMonth() !== lunaAnt;
        lunaAnt = d.getMonth();

        var clase = 'zi-cal' +
          ((g === 5 || g === 6 || g === 0) ? ' zi-cal--we' : '') +
          (n ? '' : ' zi-cal--gol') +
          (z === ZI ? ' zi-cal--ales' : '');

        var corp =
          '<span class="zi-cal__d">' + ZILE_SCURT[g] + '</span>' +
          '<span class="zi-cal__n">' + d.getDate() + (lunaNoua ? ' ' + LUNI_SCURT[d.getMonth()] : '') + '</span>' +
          '<span class="zi-cal__c">' + (n || '') + '</span>';

        var comune = 'class="' + clase + '"' + (z === AZI ? ' aria-current="date"' : '');

        /* Azi e chiar prima pagină. Un ?zi= cu data de azi ar fi doar încă o adresă pentru ea. */
        return n
          ? '<a ' + comune + ' href="' + (z === AZI ? '/' : '?zi=' + z) + '" aria-label="' + esc(numeZi(z)) + ', ' +
            esc(plural(n, 'show', 'showuri')) + '">' + corp + '</a>'
          : '<span ' + comune + ' aria-label="' + esc(numeZi(z)) + ', niciun show">' + corp + '</span>';
      }).join('');
    }

    /* ---------- clipuri ---------- */

    var C = ctx.clipuri || { clipuri: [] };
    /* Numele devine link doar cand artistul chiar are arhiva culeasa. */
    var CU_PAGINA = ctx.cuPagina || [];

    function dataScurta(iso8601) {
      var t = new Date(iso8601);
      if (isNaN(t)) return '';
      var d = dinIso(ceas(t).zi);
      var text = d.getDate() + ' ' + LUNI[d.getMonth()];
      return d.getFullYear() === dinIso(AZI).getFullYear() ? text : text + ' ' + d.getFullYear();
    }

    function cardClip(c) {
      var viz = vizionari(c.vizionari);
      return '<div class="clip' + (c.vertical ? '' : ' clip--lat') + '">' +
        '<a class="clip__foto" href="' + esc(c.url) + '" target="_blank" rel="noopener"' +
          ' aria-label="' + esc(c.titlu) + ', pe YouTube">' +
          '<img src="' + esc(poza(c.poster, 560, peVercel)) + '"' +
            ' srcset="' + esc(poza(c.poster, 560, peVercel)) + ' 1x, ' + esc(poza(c.poster, 900, peVercel)) + ' 2x"' +
            ' data-rezerva="' + esc(c.posterMic || c.poster) + '"' +
            ' alt="Miniatura clipului ' + esc(c.titlu) + '" loading="lazy" decoding="async">' +
          '<span class="clip__play">' +
            '<svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden="true">' +
              '<path d="M0 0v10l9-5z"/></svg>' +
          '</span>' +
        '</a>' +
        '<div class="clip__meta">' +
          (c.slug && CU_PAGINA.indexOf(c.slug) !== -1
            ? '<a class="clip__cine" href="/comedianti/' + esc(c.slug) + '">' + esc(c.nume) + '</a>'
            : '<span class="clip__cine">' + esc(c.nume) + '</span>') +
          '<span class="clip__cand nums">' + esc(dataScurta(c.publicat)) + '</span>' +
        '</div>' +
        '<a class="clip__titlu" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.titlu) + '</a>' +
        (viz ? '<div class="clip__viz">' + esc(viz) + '</div>' : '') +
      '</div>';
    }

    function clipuri() {
      var lista = (C.clipuri || []).slice();
      if (filtru || !lista.length) return '';

      var deschis = ctx.deschis('clipuri');
      var vizibile = lista.slice(0, ctx.clipuriAratate || CLIPURI_PAS);
      var rest = lista.length - vizibile.length;

      return '<section class="bloc">' +
        '<div class="bloc__cap">' +
          '<h2 class="bloc__titlu">' +
            '<button type="button" data-bloc="clipuri" aria-expanded="' + deschis + '">' +
              SAGEATA + 'Ce merită văzut' +
            '</button>' +
          '</h2>' +
          '<span class="bloc__meta nums">cele mai văzute din ultimele ' +
            esc(plural(C.zile || 120, 'zi', 'zile')) + '</span>' +
        '</div>' +
        '<div class="bloc__corp"' + (deschis ? '' : ' hidden') + '>' +
          '<section class="banda"><div class="banda__et"></div>' +
            '<div class="clipuri">' + vizibile.map(cardClip).join('') + '</div>' +
          '</section>' +
          (rest > 0
            ? '<section class="banda"><div class="banda__et"></div><div>' +
              '<button class="mai" type="button" data-mai-clipuri>Încă ' + Math.min(rest, CLIPURI_PAS) +
              ' din ' + rest + '</button></div></section>'
            : '') +
        '</div>' +
      '</section>';
    }

    /* ---------- asamblarea ---------- */

    var lista = evenimenteDeAfisat();
    var orase = new Set(lista.map(function (e) { return e.oras || e.city; })).size;
    var p = {};

    if (filtru) {
      p.titlu = filtru.eticheta;
      p.meta = lista.length
        ? plural(lista.length, 'dată anunțată', 'date anunțate') + ', în ' + plural(orase, 'oraș', 'orașe')
        : 'nicio dată anunțată';
      p.capDr =
        '<span class="filtru">' + esc(filtru.eticheta) +
          '<button type="button" id="sterge-filtru" aria-label="Renunță la filtru">' +
            '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
              '<path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
            '</svg>' +
          '</button>' +
        '</span>';
    } else {
      p.titlu = ZI === AZI ? 'Azi, ' + numeZi(ZI).replace(', ', ' ') : cuMajuscula(numeZi(ZI));
      p.meta = lista.length ? plural(lista.length, 'show', 'showuri') + ', în ' + plural(orase, 'oraș', 'orașe') : '';
      p.capDr = '';
    }

    p.calendar = filtru ? '' : calendar();

    if (lista.length) {
      p.benzi = benziHtml(grupeaza(lista, filtru ? 'zi' : 'oras', acumZi), acumZi);
    } else {
      var urm = filtru ? null : urmatorulDupa(ZI);
      p.benzi =
        '<div class="gol">' +
          '<h2>' + (filtru ? 'Nicio dată anunțată.'
            : ZI === AZI ? 'Azi nu e nimic anunțat.' : 'În ziua asta nu e nimic anunțat.') + '</h2>' +
          '<p>' + (urm
            ? 'Următorul e ' + esc(numeZi(urm.startDate)) + (urm.time ? ', la ' + esc(urm.time) : '') +
              ': ' + esc(urm.titlu) + ', ' + esc(urm.oras || urm.city) + '.'
            : 'Când apare ceva, apare aici.') + '</p>' +
          '<form id="forma-gol">' +
            '<input type="email" placeholder="adresa ta de email" aria-label="Adresa ta de email" required>' +
            '<button type="submit">Anunță-mă</button>' +
          '</form>' +
          '<small>Un email pe săptămână, cu ce se joacă. Te dezabonezi dintr-un click.</small>' +
        '</div>';
    }

    p.urmeaza = filtru ? '' : blocuriUrmatoare(ZI).map(function (b) {
      var orase = new Set(b.ev.map(function (e) { return e.oras || e.city; })).size;
      var deschis = ctx.deschis(b.tip);

      return '<section class="bloc">' +
        '<div class="bloc__cap">' +
          '<h2 class="bloc__titlu">' +
            '<button type="button" data-bloc="' + esc(b.tip) + '" aria-expanded="' + deschis + '">' +
              SAGEATA + esc(b.eticheta) +
            '</button>' +
          '</h2>' +
          '<span class="bloc__meta nums">' +
            (b.sufix ? esc(b.sufix) + ' · ' : '') +
            esc(plural(b.ev.length, 'show', 'showuri')) + ', în ' + esc(plural(orase, 'oraș', 'orașe')) +
          '</span>' +
        '</div>' +
        '<div class="bloc__corp"' + (deschis ? '' : ' hidden') + '>' +
          benziHtml(grupeaza(b.ev, b.mod, -1), -1) +
        '</div>' +
      '</section>';
    }).join('');

    p.clipuri = clipuri();

    var verificat = ceas(ctx.scrapedAt);
    p.subsol = 'Datele vin de pe iaBilet. Ultima verificare: ' +
      (verificat.zi === AZI ? 'azi' : numeZi(verificat.zi)) + ', ora ' + verificat.ora + '. ' +
      plural(SHOWURI.length, 'show în bază', 'showuri în bază') + '.';

    return p;
  }

  /* ================= pagina de comediant ================= */

  var RAFTURI = [
    { fel: 'special', titlu: 'Specialuri', unu: 'special', multe: 'specialuri', pas: 6 },
    { fel: 'moment', titlu: 'Momente și seturi', unu: 'moment', multe: 'momente', pas: 8 },
    { fel: 'clip', titlu: 'Clipuri scurte', unu: 'clip', multe: 'clipuri', pas: 12 }
  ];

  /* Datele viitoare ale comediantului, după alias-uri exacte: „Toma" nu e „Adelina Toma". */
  function dateComediant(artist, events, azi) {
    var alias = artist.alias || [];
    return (events || [])
      .filter(function (e) {
        return e.tip !== 'turneu' &&
          (e.endDate || e.startDate) >= azi &&
          (e.nume || []).some(function (n) { return alias.indexOf(n) !== -1; });
      })
      .sort(function (a, b) {
        return String(a.startDate).localeCompare(String(b.startDate)) ||
               String(a.time).localeCompare(String(b.time));
      });
  }

  /*
   *   { artist, events, azi, peVercel, aratate: { fel: câte se văd } }
   *   -> { nume, meta, corp, subsol, date }
   * `nume` și `subsol` sunt text simplu, `meta` și `corp` sunt HTML.
   */
  function comediant(ctx) {
    var artist = ctx.artist;
    var AZI = ctx.azi;
    var aratate = ctx.aratate || {};
    var date = dateComediant(artist, ctx.events, AZI);

    function dataScurta(s) {
      var d = dinIso(s);
      var text = d.getDate() + ' ' + LUNI[d.getMonth()];
      return d.getFullYear() === dinIso(AZI).getFullYear() ? text : text + ' ' + d.getFullYear();
    }

    function cardShow(e) {
      var url = poza(e.image, 420, ctx.peVercel);
      var pret = pretText(e);
      return '<a class="show' + (e.soldOut ? ' show--epuizat' : '') + '" href="' + esc(e.url || '#') + '" target="_blank" rel="noopener">' +
        '<div class="show__afis">' +
          /* Originalul A4 lipsește uneori la sursă (turneul „Orizont Electric": 404), thumbnailul nu.
           * Aceeași scară ca pe prima pagină: original, thumbnail, apoi cartonaș cu titlul. */
          (url
            ? '<img src="' + esc(url) + '"' + (e.image && e.image !== url ? ' data-rezerva="' + esc(e.image) + '"' : '') +
              ' alt="Afișul pentru ' + esc(e.titlu) + '" loading="lazy" decoding="async">'
            : '<span class="show__gol">' + esc(e.titlu) + '</span>') +
          (e.soldOut ? '<span class="stare stare--epuizat">Epuizat</span>' : '') +
        '</div>' +
        '<div class="show__meta nums">' + (e.time ? '<span class="show__ora">' + esc(e.time) + '</span>' : '') +
          '<span class="show__sala">' + esc((e.venue || '') + (e.oras ? ', ' + e.oras : '')) + '</span></div>' +
        '<div class="show__nume">' + esc(e.titlu) + '</div>' +
        '<div class="show__jos nums">' + (pret ? '<span>' + esc(pret) + '</span>' : '') + '</div>' +
      '</a>';
    }

    function cardClip(c, mare) {
      var viz = vizionari(c.vizionari);
      var lat = mare || c.durata >= 300;
      var sursa = lat ? c.poster : (c.poster || c.posterMic);
      var d = durataText(c.durata);
      return '<a class="clip' + (lat ? ' clip--lat clip--mare' : '') + '" href="' + esc(c.url) + '" target="_blank" rel="noopener">' +
        '<div class="clip__foto">' +
          '<img src="' + esc(poza(sursa, lat ? 720 : 420, ctx.peVercel)) + '" data-rezerva="' + esc(c.posterMic || '') + '"' +
          ' alt="Miniatura clipului ' + esc(c.titlu) + '" loading="lazy" decoding="async">' +
          '<span class="clip__play"><svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden="true"><path d="M0 0v10l9-5z"/></svg></span>' +
          (d ? '<span class="durata nums">' + esc(d) + '</span>' : '') +
        '</div>' +
        '<div class="clip__meta"><span class="clip__cand nums">' + esc(dataScurta(c.publicat)) + '</span></div>' +
        '<div class="clip__titlu">' + esc(c.titlu) + '</div>' +
        (viz ? '<div class="clip__viz">' + esc(viz) + '</div>' : '') +
      '</a>';
    }

    function bloc(cheie, titlu, meta, corp, deschis) {
      return '<section class="bloc" data-sec="' + esc(cheie) + '">' +
        '<div class="bloc__cap">' +
          '<h2 class="bloc__titlu"><button type="button" data-bloc="' + esc(cheie) + '" aria-expanded="' + deschis + '">' +
            SAGEATA + esc(titlu) + '</button></h2>' +
          '<span class="bloc__meta nums">' + esc(meta) + '</span>' +
        '</div>' +
        '<div class="bloc__corp"' + (deschis ? '' : ' hidden') + '>' + corp + '</div>' +
      '</section>';
    }

    function banda(continut, clasa) {
      return '<section class="banda"><div class="banda__et"></div><div class="' + clasa + '">' + continut + '</div></section>';
    }

    var corp = '';

    if (date.length) {
      corp += bloc('date', 'Date anunțate',
        plural(date.length, 'dată', 'date') + ', în ' +
          plural(new Set(date.map(function (e) { return e.oras || e.city; })).size, 'oraș', 'orașe'),
        banda(date.map(cardShow).join(''), 'rafturi'), true);
    }

    RAFTURI.forEach(function (r) {
      /* Cel mai vizionat primul. Un om care ajunge aici prima oara trebuie sa dea peste ce a
       * rupt de pe canal, nu peste ce s-a postat ieri; ordinea cronologica e pe prima pagina. */
      var lista = artist.clipuri.filter(function (c) { return c.fel === r.fel; })
        .sort(function (x, y) { return (y.vizionari || 0) - (x.vizionari || 0); });
      if (!lista.length) return;
      var vizibile = lista.slice(0, aratate[r.fel] || r.pas);
      var rest = lista.length - vizibile.length;

      var raft = banda(vizibile.map(function (c) { return cardClip(c, r.fel === 'special'); }).join(''), 'clipuri') +
        (rest > 0
          ? '<section class="banda"><div class="banda__et"></div><div><button class="mai" type="button" data-mai="' + r.fel + '">' +
            'Încă ' + Math.min(rest, r.pas) + ' din ' + rest + '</button></div></section>'
          : '');

      corp += bloc(r.fel, r.titlu, plural(lista.length, r.unu, r.multe), raft, true);
    });

    var bucati = [plural(artist.count, 'material de stand-up', 'materiale de stand-up')];
    if (date.length) bucati.push(plural(date.length, 'dată anunțată', 'date anunțate'));
    var meta = bucati.map(esc).join('<span class="punct"></span>') +
      '<span class="punct"></span><a href="https://www.youtube.com/' + esc(artist.handle) +
      '" target="_blank" rel="noopener">' + esc(artist.handle) + '</a>';

    var cules = ceas(artist.culesLa);
    var subsol =
      'Materialele vin de pe YouTube, datele de pe iaBilet. ' +
      'Ultima verificare: ' + numeZi(cules.zi) + ', ora ' + cules.ora + '. ' +
      'Din ' + plural(artist.incarcate, 'clip', 'clipuri') + ' pe canal, ' + artist.count + ' sunt stand-up.';

    return { nume: artist.nume, meta: meta, corp: corp, subsol: subsol, date: date };
  }

  radacina.Randare = {
    pad: pad,
    iso: iso,
    numeZi: numeZi,
    plural: plural,
    esc: esc,
    plat: plat,
    ceas: ceas,
    amprenta: amprenta,
    showuri: showuri,
    acasa: acasa,
    comediant: comediant,
    dateComediant: dateComediant,
    CLIPURI_PAS: CLIPURI_PAS,
    RAFTURI: RAFTURI
  };
})(globalThis);
