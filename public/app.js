/* hailastandup — mockup. Datele vin de pe iaBilet: snapshot la încărcare, live la cerere. */

const CLUB_RATE = 0.02; // comision platformă, plătit de club
const BUYER_RATE = 0.04; // taxă serviciu cumpărător
const BUYER_MIN = 2;
const BUYER_CAP = 8;

const app = document.getElementById('app');
const summarybar = document.getElementById('summarybar');
const refreshBtn = document.getElementById('refresh');
const stampEl = document.getElementById('stamp');
const noteEl = document.getElementById('live-note');

const OFFLINE = location.protocol === 'file:';

const state = {
  data: window.EVENTS_DATA,
  byId: new Map(window.EVENTS_DATA.events.map((e) => [e.id, e])),
  filters: { q: '', city: '', when: 'toate', venue: null },
  cart: {},
  openEventId: null,
  published: [],
};

/* ---------- iconițe desenate, o singură grosime de linie ---------- */

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 13 4.5 4.5L19 7"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16.2v.1"/>',
};

const icon = (name, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

/* ---------- utilitare ---------- */

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const lei = (n) =>
  `${(Math.round(n * 100) / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
const leiShort = (n) => `${Math.round(n).toLocaleString('ro-RO')} lei`;

const dayFmt = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short' });
const weekFmt = new Intl.DateTimeFormat('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
const longFmt = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const asDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : null);
const todayISO = () => new Date().toISOString().slice(0, 10);

const buyerFee = (subtotal) => (subtotal <= 0 ? 0 : Math.min(BUYER_CAP, Math.max(BUYER_MIN, subtotal * BUYER_RATE)));

function seed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
const rand = (key, min, max) => min + ((seed(key) % 10000) / 10000) * (max - min);

/** Vânzări inventate determinist. Nu avem date reale de vânzări. */
function demoSales(ev) {
  const cap = Math.round(rand(`cap${ev.id}`, 60, 320));
  const days = Math.max(0, (asDate(ev.startDate) - new Date()) / 86400000);
  const curve = days <= 1 ? 0.9 : days <= 4 ? 0.72 : days <= 14 ? 0.45 : days <= 45 ? 0.24 : 0.1;
  const sold = ev.soldOut ? cap : Math.min(cap, Math.round(cap * curve * rand(`n${ev.id}`, 0.6, 1.25)));
  return { cap, sold, gross: sold * (ev.priceFrom ?? 0) };
}

const tierStock = (ev, tier, i) => (ev.soldOut ? 0 : Math.round(rand(`s${ev.id}${tier.id}${i}`, 4, 40)));

/** Câteva spectacole n-au tarife pe iaBilet. Nu inventăm preț pentru ele. */
function tariffsOf(ev) {
  if (ev.tariffs?.length) return ev.tariffs;
  if (ev.priceFrom == null) return [];
  return [{ id: `ga${ev.id}`, name: 'Acces general', price: ev.priceFrom, currency: 'RON' }];
}

function agoText(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins)) return '';
  if (mins < 1) return 'actualizat acum';
  if (mins < 60) return `actualizat acum ${mins} min`;
  if (mins < 24 * 60) return `actualizat acum ${Math.round(mins / 60)} h`;
  return `actualizat pe ${dayFmt.format(new Date(iso))}`;
}

/* ---------- stratul live ---------- */

function setNote(text, tone) {
  if (!text) {
    noteEl.hidden = true;
    noteEl.innerHTML = '';
    return;
  }
  noteEl.hidden = false;
  noteEl.dataset.tone = tone ?? 'info';
  noteEl.innerHTML = `<div class="shell">${tone === 'error' ? icon('alert') : icon('check')}<span>${esc(text)}</span></div>`;
}

function syncStamp() {
  stampEl.textContent = agoText(state.data.scrapedAt);
  stampEl.title = new Date(state.data.scrapedAt).toLocaleString('ro-RO');
}

async function refresh() {
  if (OFFLINE) {
    setNote('Actualizarea live cere serverul. Deschide site-ul pe adresa lui, nu fișierul local.', 'error');
    return;
  }

  refreshBtn.dataset.state = 'busy';
  refreshBtn.disabled = true;
  refreshBtn.querySelector('.btn__label').textContent = 'Se actualizează';
  setNote('');

  try {
    const res = await fetch('/api/events', { headers: { accept: 'application/json' } });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);

    const before = state.byId;
    // Listingul live n-are ora și tarifele: le păstrăm din ce știam deja.
    for (const ev of body.events) {
      const old = before.get(ev.id);
      if (old) {
        ev.time = ev.time ?? old.time;
        ev.tariffs = ev.tariffs?.length ? ev.tariffs : old.tariffs;
      }
    }

    const fresh = body.events.filter((e) => !before.has(e.id)).length;
    const gone = [...before.keys()].filter((id) => !body.events.some((e) => e.id === id)).length;

    state.data = body;
    state.byId = new Map(body.events.map((e) => [e.id, e]));

    syncStamp();
    render();

    const bits = [`${body.count} spectacole`];
    if (fresh) bits.push(`${fresh} noi`);
    if (gone) bits.push(`${gone} scoase`);
    setNote(`Citit de pe iaBilet: ${bits.join(', ')}.`);
  } catch (err) {
    setNote(`Nu am putut actualiza: ${err.message}. Rămâne ce era.`, 'error');
  } finally {
    refreshBtn.dataset.state = 'idle';
    refreshBtn.disabled = false;
    refreshBtn.querySelector('.btn__label').textContent = 'Actualizează';
  }
}

/** Ora și tarifele reale ale unui spectacol, cerute la deschiderea paginii lui. */
async function loadDetail(ev) {
  if (OFFLINE || !ev.url || ev.tariffs?.length) return false;
  try {
    const res = await fetch(`/api/event?url=${encodeURIComponent(ev.url)}`, { headers: { accept: 'application/json' } });
    if (!res.ok) return false;
    const d = await res.json();
    ev.time = d.time ?? ev.time;
    ev.tariffs = d.tariffs ?? [];
    return true;
  } catch {
    return false;
  }
}

/* ---------- catalog ---------- */

const WHEN = [['azi', 'Azi'], ['weekend', 'Weekend'], ['luna', 'Luna asta'], ['toate', 'Toate']];

function weekendRange() {
  const now = new Date();
  const d = now.getDay();
  const fri = new Date(now);
  fri.setDate(now.getDate() + (d === 0 ? -2 : 5 - d));
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  return [fri.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}

function visibleEvents() {
  const { q, city, when } = state.filters;
  const needle = q.trim().toLowerCase();
  const today = todayISO();
  const [wStart, wEnd] = weekendRange();
  const month = today.slice(0, 7);

  return state.data.events.filter((e) => {
    if (city && e.city !== city) return false;
    if (when === 'azi' && e.startDate !== today) return false;
    if (when === 'weekend' && !(e.startDate >= wStart && e.startDate <= wEnd)) return false;
    if (when === 'luna' && !e.startDate?.startsWith(month)) return false;
    if (needle && !`${e.title} ${e.venue} ${e.city}`.toLowerCase().includes(needle)) return false;
    return true;
  });
}

function cardHTML(e) {
  const d = asDate(e.startDate);
  return `
    <a class="card" href="#/e/${e.id}">
      <div class="card__poster">
        <img src="${esc(e.image)}" alt="Afiș: ${esc(e.title)}" loading="lazy" decoding="async">
        ${e.soldOut ? '<div class="card__out">Sold out</div>' : ''}
      </div>
      <div class="card__when">${d ? esc(weekFmt.format(d)) : ''}${e.time ? ` · ${esc(e.time)}` : ''}</div>
      <div class="card__title">${esc(e.title)}</div>
      <div class="card__where">${esc(e.venue ?? '')}${e.city ? ` · ${esc(e.city)}` : ''}</div>
      <div class="card__price">${e.priceFrom != null ? `de la <b>${leiShort(e.priceFrom)}</b>` : 'preț indisponibil'}</div>
    </a>`;
}

function renderCatalog() {
  app.innerHTML = `
    <div class="shell">
      <div class="toolbar">
        <div class="search">
          ${icon('search', 15)}
          <input class="field" id="q" type="search" placeholder="Caută comedian, club, oraș" value="${esc(state.filters.q)}" aria-label="Caută">
        </div>
        <select class="field" id="city" aria-label="Oraș">
          <option value="">Toate orașele</option>
          ${state.data.cities.map((c) => `<option value="${esc(c)}"${c === state.filters.city ? ' selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
        <div class="segmented" role="group" aria-label="Perioadă">
          ${WHEN.map(([k, l]) => `<button type="button" data-when="${k}" aria-pressed="${state.filters.when === k}">${l}</button>`).join('')}
        </div>
        <div class="toolbar__count" id="count"></div>
      </div>
      <div id="results"></div>
    </div>`;

  const q = document.getElementById('q');
  let timer;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.filters.q = q.value;
      renderResults(false);
    }, 120);
  });

  document.getElementById('city').addEventListener('change', (e) => {
    state.filters.city = e.target.value;
    renderResults(false);
  });

  app.querySelectorAll('[data-when]').forEach((b) =>
    b.addEventListener('click', () => {
      state.filters.when = b.dataset.when;
      app.querySelectorAll('[data-when]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      renderResults(false);
    })
  );

  renderResults(true);
}

function renderResults(animate) {
  const list = visibleEvents();
  document.getElementById('count').textContent = `${list.length} ${list.length === 1 ? 'spectacol' : 'spectacole'}`;

  const target = document.getElementById('results');
  target.innerHTML = list.length
    ? `<div class="grid${animate ? '' : ' grid--static'}">${list.map(cardHTML).join('')}</div>`
    : `<div class="empty">
         <h2>Nimic pe filtrele astea</h2>
         <p>Încearcă alt oraș sau altă perioadă.</p>
         <button class="btn btn--ghost" id="reset" type="button">Șterge filtrele</button>
       </div>`;

  document.getElementById('reset')?.addEventListener('click', () => {
    state.filters = { ...state.filters, q: '', city: '', when: 'toate' };
    renderCatalog();
  });
}

/* ---------- pagina de spectacol ---------- */

function cartTotals(ev) {
  let qty = 0;
  let subtotal = 0;
  const lines = [];
  for (const t of tariffsOf(ev)) {
    const n = state.cart[t.id] || 0;
    if (!n) continue;
    qty += n;
    subtotal += n * t.price;
    lines.push({ name: t.name, qty: n, sum: n * t.price });
  }
  const fee = buyerFee(subtotal);
  return { qty, subtotal, fee, total: subtotal + fee, lines };
}

async function renderEvent(id) {
  const ev = state.byId.get(id);
  if (!ev) return renderNotFound();

  if (state.openEventId !== id) {
    state.cart = {};
    state.openEventId = id;
  }

  const d = asDate(ev.startDate);
  const pending = !OFFLINE && !!ev.url && !ev.tariffs?.length && !ev.soldOut;

  app.innerHTML = `
    <div class="shell">
      <a class="back" href="#/">${icon('arrowLeft', 15)}Toate spectacolele</a>
      <div class="event">
        <div class="event__poster"><img src="${esc(ev.image)}" alt="Afiș: ${esc(ev.title)}"></div>
        <div>
          <h1>${esc(ev.title)}</h1>
          <div class="event__meta">
            <div><b>${d ? esc(longFmt.format(d)) : ''}</b><span id="ev-time">${ev.time ? `, ora <b>${esc(ev.time)}</b>` : ''}</span></div>
            <div>${esc(ev.venue ?? '')}${ev.city ? `, ${esc(ev.city)}` : ''}</div>
            ${ev.address ? `<div>${esc(ev.address)}</div>` : ''}
          </div>
          ${ev.description ? `<p class="event__desc">${esc(ev.description)}</p>` : ''}
          <div id="tickets">${pending ? skeletonHTML() : ticketsHTML(ev)}</div>
        </div>
      </div>
    </div>`;

  if (pending) {
    await loadDetail(ev);
    if (state.openEventId !== id) return;
    document.getElementById('tickets').innerHTML = ticketsHTML(ev);
    document.getElementById('ev-time').innerHTML = ev.time ? `, ora <b>${esc(ev.time)}</b>` : '';
  }

  wireTiers(ev);
  updateSummary(ev);
}

const skeletonHTML = () =>
  `<div class="tiers" data-loading="true" aria-busy="true">${'<div class="skeleton"><span></span><span></span></div>'.repeat(2)}</div>`;

function ticketsHTML(ev) {
  if (ev.soldOut) return `<div class="notice">Sold out. Nu mai sunt bilete în vânzare.</div>`;

  const tiers = tariffsOf(ev);
  if (!tiers.length) return `<div class="notice">Spectacolul ăsta nu are tarife publicate pe iaBilet.</div>`;

  return `<div class="tiers">${tiers
    .map((t, i) => {
      const stock = tierStock(ev, t, i);
      const n = state.cart[t.id] || 0;
      return `
      <div class="tier${n ? ' tier--picked' : ''}" data-tier="${esc(t.id)}">
        <div class="tier__name">${esc(t.name)}<span class="tier__stock">${stock} disponibile</span></div>
        <div class="tier__price">${lei(t.price)}</div>
        <div class="stepper" data-max="${stock}">
          <button type="button" data-step="-1" aria-label="Scade" ${n === 0 ? 'disabled' : ''}>${icon('minus', 15)}</button>
          <output aria-live="polite">${n}</output>
          <button type="button" data-step="1" aria-label="Adaugă" ${n >= stock ? 'disabled' : ''}>${icon('plus', 15)}</button>
        </div>
      </div>`;
    })
    .join('')}</div>`;
}

function wireTiers(ev) {
  app.querySelectorAll('.tier').forEach((row) => {
    const stepper = row.querySelector('.stepper');
    const out = row.querySelector('output');
    const max = Number(stepper.dataset.max);
    const tid = row.dataset.tier;

    stepper.querySelectorAll('button').forEach((btn) =>
      btn.addEventListener('click', () => {
        const next = Math.min(max, Math.max(0, (state.cart[tid] || 0) + Number(btn.dataset.step)));
        state.cart[tid] = next;
        out.textContent = next;
        row.classList.toggle('tier--picked', next > 0);
        stepper.querySelector('[data-step="-1"]').disabled = next === 0;
        stepper.querySelector('[data-step="1"]').disabled = next >= max;
        updateSummary(ev);
      })
    );
  });
}

function updateSummary(ev) {
  const { qty, total } = cartTotals(ev);
  summarybar.dataset.open = qty > 0;
  summarybar.innerHTML = `
    <div class="shell summarybar__inner">
      <div class="summarybar__text">${qty} ${qty === 1 ? 'bilet' : 'bilete'} · <b>${lei(total)}</b></div>
      <a class="btn btn--primary" href="#/c/${ev.id}">Continuă</a>
    </div>`;
}

/* ---------- checkout ---------- */

function renderCheckout(id) {
  const ev = state.byId.get(id);
  if (!ev) return renderNotFound();

  const t = cartTotals(ev);
  if (!t.qty) {
    location.hash = `#/e/${id}`;
    return;
  }

  const d = asDate(ev.startDate);

  app.innerHTML = `
    <div class="shell">
      <a class="back" href="#/e/${ev.id}">${icon('arrowLeft', 15)}Înapoi la spectacol</a>
      <div class="checkout">
        <div>
          <h1>Date de contact</h1>
          <p class="note">Biletul ajunge pe email și se scanează la ușă de pe telefon.</p>
          <form class="form" id="pay" novalidate>
            <label>Nume<input class="field" name="nume" required autocomplete="name" placeholder="Ion Popescu"></label>
            <label>Email<input class="field" name="email" type="email" required autocomplete="email" placeholder="ion@exemplu.ro"></label>
            <label>Telefon<input class="field" name="tel" type="tel" autocomplete="tel" placeholder="07xx xxx xxx"></label>
            <button class="btn btn--primary" type="submit" style="justify-self:start;margin-top:4px">Plătește ${lei(t.total)}</button>
          </form>
        </div>

        <aside class="panel">
          <h2>${esc(ev.title)}</h2>
          <p class="panel__sub">${d ? esc(dayFmt.format(d)) : ''}${ev.time ? `, ${esc(ev.time)}` : ''} · ${esc(ev.venue ?? '')}</p>
          ${t.lines.map((l) => `<div class="line"><span>${l.qty} × ${esc(l.name)}</span><span>${lei(l.sum)}</span></div>`).join('')}
          <div class="line"><span>Taxă serviciu</span><span>${lei(t.fee)}</span></div>
          <div class="line line--total"><span>Total</span><span>${lei(t.total)}</span></div>
          <p class="note">Taxa e ${BUYER_RATE * 100}% din bilete, minim ${BUYER_MIN} lei, plafonată la ${BUYER_CAP} lei. Clubul primește ${lei(t.subtotal * (1 - CLUB_RATE))} direct în contul lui.</p>
          <p class="note note--accent">Demo. Nu se procesează nicio plată.</p>
        </aside>
      </div>
    </div>`;

  document.getElementById('pay').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    sessionStorage.setItem(
      'hls-order',
      JSON.stringify({
        eventId: ev.id,
        name: fd.get('nume') || 'Fără nume',
        total: t.total,
        code: `HLS-${String(seed(ev.id + Date.now())).slice(0, 6)}`,
        tier: t.lines.map((l) => `${l.qty} × ${l.name}`).join(', '),
      })
    );
    state.cart = {};
    location.hash = '#/bilet';
  });
}

/* ---------- bilet ---------- */

function renderTicket() {
  const order = JSON.parse(sessionStorage.getItem('hls-order') || 'null');
  const ev = order && state.byId.get(order.eventId);
  if (!ev) return renderNotFound();

  const d = asDate(ev.startDate);

  app.innerHTML = `
    <div class="shell ticketwrap">
      <div class="ticket">
        <div class="ticket__top">
          <div class="ticket__badge">${icon('check', 14)}Bilet emis</div>
          <h1>${esc(ev.title)}</h1>
          <div class="ticket__grid">
            <div class="ticket__cell"><span>Data</span>${d ? esc(longFmt.format(d)) : ''}</div>
            <div class="ticket__cell"><span>Ora</span>${esc(ev.time ?? 'neanunțată')}</div>
            <div class="ticket__cell"><span>Locul</span>${esc(ev.venue ?? '')}, ${esc(ev.city ?? '')}</div>
            <div class="ticket__cell"><span>Pe numele</span>${esc(order.name)}</div>
            <div class="ticket__cell" style="grid-column:1/-1"><span>Bilete</span>${esc(order.tier)}</div>
          </div>
        </div>
        <div class="ticket__tear"></div>
        <div class="ticket__bottom">
          <div class="ticket__code"><span>Cod validare</span>${esc(order.code)}</div>
          <div class="num" style="font-size:var(--t-md);font-weight:500">${lei(order.total)}</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <a class="btn btn--ghost" href="#/">Înapoi la spectacole</a>
        <a class="btn btn--primary" href="#/organizator">Vezi panoul clubului</a>
      </div>
    </div>`;
}

/* ---------- panou organizator ---------- */

function renderOrganizer() {
  const byVenue = state.data.events.reduce((acc, e) => {
    if (e.venue) (acc[e.venue] ??= []).push(e);
    return acc;
  }, {});
  const venues = Object.entries(byVenue)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 12)
    .map(([v]) => v);

  if (!venues.length) return renderNotFound();

  const venue = venues.includes(state.filters.venue) ? state.filters.venue : venues[0];
  const rows = [...state.published.filter((p) => p.venue === venue), ...byVenue[venue]].slice(0, 40);

  let totalSold = 0;
  let totalGross = 0;

  const body = rows
    .map((e) => {
      const s = e.__new ? { cap: e.cap, sold: 0, gross: 0 } : demoSales(e);
      totalSold += s.sold;
      totalGross += s.gross;
      const d = asDate(e.startDate);
      const pct = s.cap ? Math.round((s.sold / s.cap) * 100) : 0;
      return `
        <tr>
          <td class="t">${esc(e.title)}</td>
          <td>${d ? esc(dayFmt.format(d)) : ''}${e.time ? `, ${esc(e.time)}` : ''}</td>
          <td>${e.soldOut ? '<span class="tag tag--out">Sold out</span>' : '<span class="tag tag--live">Live</span>'}</td>
          <td class="r">${s.sold} / ${s.cap}<div class="bar"><i style="width:${pct}%"></i></div></td>
          <td class="r">${leiShort(s.gross)}</td>
          <td class="r">${leiShort(s.gross * (1 - CLUB_RATE))}</td>
        </tr>`;
    })
    .join('');

  app.innerHTML = `
    <div class="shell org">
      <div class="org__head">
        <h1>${esc(venue)}</h1>
        <select class="field" id="venue" aria-label="Club">
          ${venues.map((v) => `<option${v === venue ? ' selected' : ''}>${esc(v)}</option>`).join('')}
        </select>
        <button class="btn btn--primary" id="toggle-publish" type="button">Publică spectacol</button>
      </div>

      <form class="publish" id="publish" hidden>
        <label>Titlu<input class="field" name="titlu" required placeholder="Stand-up cu ..."></label>
        <label>Data<input class="field" name="data" type="date" required value="${todayISO()}"></label>
        <label>Ora<input class="field" name="ora" type="time" required value="20:00"></label>
        <label>Preț<input class="field" name="pret" type="number" min="1" required value="60"></label>
        <label>Locuri<input class="field" name="stoc" type="number" min="1" required value="120"></label>
        <div class="publish__actions">
          <button class="btn btn--primary" type="submit">Publică</button>
          <button class="btn btn--quiet" type="button" id="cancel-publish">Renunță</button>
          <p class="note">Live imediat, fără intermediar.</p>
        </div>
      </form>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Spectacol</th><th>Data</th><th>Stare</th>
              <th class="r">Vândute</th><th class="r">Încasat</th><th class="r">Revine clubului</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
          <tfoot>
            <tr>
              <td colspan="3">${rows.length} spectacole</td>
              <td class="r">${totalSold}</td>
              <td class="r">${leiShort(totalGross)}</td>
              <td class="r">${leiShort(totalGross * (1 - CLUB_RATE))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="note">Spectacolele, datele și prețurile vin de pe iaBilet. Vânzările și numărul de locuri sunt inventate pentru demo.</p>
    </div>`;

  document.getElementById('venue').addEventListener('change', (e) => {
    state.filters.venue = e.target.value;
    renderOrganizer();
  });

  const form = document.getElementById('publish');
  document.getElementById('toggle-publish').addEventListener('click', () => {
    form.hidden = !form.hidden;
    if (!form.hidden) form.querySelector('input').focus();
  });
  document.getElementById('cancel-publish').addEventListener('click', () => (form.hidden = true));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.published.unshift({
      id: `new-${Date.now()}`,
      title: fd.get('titlu') || 'Spectacol fără titlu',
      startDate: fd.get('data'),
      time: fd.get('ora'),
      venue,
      cap: Number(fd.get('stoc')),
      priceFrom: Number(fd.get('pret')),
      soldOut: false,
      __new: true,
    });
    renderOrganizer();
  });
}

/* ---------- router ---------- */

function renderNotFound() {
  app.innerHTML = `<div class="shell empty">
      <h2>Pagina nu există</h2>
      <p>Link greșit, sau spectacolul a fost scos din vânzare.</p>
      <a class="btn btn--ghost" href="#/">Toate spectacolele</a>
    </div>`;
}

function render() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  summarybar.dataset.open = 'false';

  switch (parts[0]) {
    case 'e': return renderEvent(parts[1]);
    case 'c': return renderCheckout(parts[1]);
    case 'bilet': return renderTicket();
    case 'organizator': return renderOrganizer();
    default: return renderCatalog();
  }
}

function syncNav() {
  const current = location.hash.startsWith('#/organizator') ? '#/organizator' : '#/';
  document.querySelectorAll('.topnav a').forEach((a) =>
    a.getAttribute('href') === current ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')
  );
}

window.addEventListener('hashchange', () => {
  window.scrollTo({ top: 0 });
  render();
  syncNav();
});

refreshBtn.addEventListener('click', refresh);
if (OFFLINE) refreshBtn.title = 'Merge doar pe server, nu din fișier local.';

syncStamp();
setInterval(syncStamp, 60000);
render();
syncNav();
