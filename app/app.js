// DealBeacon's app: a deal finder that runs from its own files. Hash routes:
//
//   #/                 the board: top picks, search and filters, every deal
//   #/deal/<id>        one deal, with the full check behind it
//   #/top/<min>        the board with the discount filter set to <min> percent
//
// Everything is client-side: the deals live in data.js, the filters and the
// sort run here, and nothing is fetched from anywhere. window.__shotReady is
// false while a page renders and true once it is on screen.

import { deals } from './data.js';

const app = document.getElementById('app');

const SIGNAL_LABEL = {
  'new-low': 'New low',
  strong: 'Strong price',
  routine: 'Routine sale',
  'fine-print': 'Check the fine print',
};
const SIGNAL_RANK = { 'new-low': 0, strong: 1, routine: 2, 'fine-print': 3 };

const state = { query: '', category: 'All', store: 'All', minOff: 0, sort: 'deal' };

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
const saved = (d) => d.was - d.price;
const day = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' }) + ' ET';

function categories() {
  return ['All', ...new Set(deals.map((d) => d.category))];
}
function stores() {
  return ['All', ...new Set(deals.map((d) => d.store))];
}

function visible() {
  const q = state.query.trim().toLowerCase();
  let list = deals.filter((d) => {
    if (q !== '' && `${d.title} ${d.store} ${d.category}`.toLowerCase().indexOf(q) === -1) return false;
    if (state.category !== 'All' && d.category !== state.category) return false;
    if (state.store !== 'All' && d.store !== state.store) return false;
    if (percentOff(d) < state.minOff) return false;
    return true;
  });
  const by = {
    deal: (a, b) => SIGNAL_RANK[a.signal] - SIGNAL_RANK[b.signal] || percentOff(b) - percentOff(a),
    discount: (a, b) => percentOff(b) - percentOff(a),
    saved: (a, b) => saved(b) - saved(a),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
  }[state.sort];
  return list.sort(by);
}

function signalBadge(d) {
  return `<span class="signal ${d.signal}">${escape(SIGNAL_LABEL[d.signal])}</span>`;
}

function card(d) {
  return `<article class="card">
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <p class="meta">${escape(d.store)} · ${escape(d.category)}</p>
  <p class="price">${usd(d.price)} <s>${usd(d.was)}</s> <span class="off">${percentOff(d)}% off</span></p>
  <p class="badges">${signalBadge(d)} <span class="save">Save ${usd(saved(d))}</span></p>
  <p class="why">${escape(d.why)}</p>
  <p class="checked">Checked ${day(d.checked)} · ${escape(d.source)}</p>
  <p><a class="go" href="${escape(d.url)}" rel="noopener" target="_blank">View at ${escape(d.store)} ↗</a></p>
</article>`;
}

function topPicks() {
  const picks = deals
    .filter((d) => d.signal === 'new-low' || d.signal === 'strong')
    .sort((a, b) => SIGNAL_RANK[a.signal] - SIGNAL_RANK[b.signal] || percentOff(b) - percentOff(a))
    .slice(0, 5);
  return `<section class="picks" aria-label="Top picks">
  <h2>Top picks — the five strongest checks today</h2>
  <ol>${picks.map((d) => `<li><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a> — <b>${usd(d.price)}</b> <s>${usd(d.was)}</s> (${percentOff(d)}% off) · ${escape(d.store)}</li>`).join('')}</ol>
</section>`;
}

function controls() {
  const cats = categories();
  const sts = stores();
  return `<section class="controls" aria-label="Find a deal">
  <label class="search">Search <input id="q" type="search" placeholder="TV, AirPods, Dyson…" value="${escape(state.query)}"></label>
  <div class="chips" role="group" aria-label="Category">
    ${cats.map((c) => `<button type="button" data-cat="${escape(c)}" class="${c === state.category ? 'on' : ''}">${escape(c)}</button>`).join('')}
  </div>
  <div class="selects">
    <label>Store <select id="store">${sts.map((s) => `<option ${s === state.store ? 'selected' : ''}>${escape(s)}</option>`).join('')}</select></label>
    <label>Discount <select id="minoff">
      <option value="0" ${state.minOff === 0 ? 'selected' : ''}>Any discount</option>
      <option value="20" ${state.minOff === 20 ? 'selected' : ''}>20% off or more</option>
      <option value="40" ${state.minOff === 40 ? 'selected' : ''}>40% off or more</option>
      <option value="50" ${state.minOff === 50 ? 'selected' : ''}>50% off or more</option>
    </select></label>
    <label>Sort <select id="sort">
      <option value="deal" ${state.sort === 'deal' ? 'selected' : ''}>Best deal first</option>
      <option value="discount" ${state.sort === 'discount' ? 'selected' : ''}>Biggest % off</option>
      <option value="saved" ${state.sort === 'saved' ? 'selected' : ''}>Most dollars saved</option>
      <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Lowest price</option>
      <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Highest price</option>
    </select></label>
  </div>
</section>`;
}

function board() {
  const list = visible();
  const total = deals.length;
  const maxOff = Math.max(...deals.map(percentOff));
  const storeCount = new Set(deals.map((d) => d.store)).size;
  return `<p class="stats"><b>${total} deals</b> · ${storeCount} stores · up to <b>${maxOff}% off</b> · all checked Nov 27, 2026</p>
${topPicks()}
${controls()}
<p class="count">Showing <b>${list.length}</b> of ${total} deals</p>
${list.length === 0 ? '<p class="empty">No deal matches. Loosen a filter or clear the search.</p>' : `<div class="grid">${list.map(card).join('')}</div>`}
<p class="note">Every price was read at its store or in the deals roundup named on its card, on Nov 27, 2026. Prices move fast — the store’s page is the final word before you buy.</p>`;
}

function detail(d) {
  return `<p><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <h2>${escape(d.title)}</h2>
  <p class="meta">${escape(d.store)} · ${escape(d.category)}</p>
  <p class="price big">${usd(d.price)} <s>${usd(d.was)}</s> <span class="off">${percentOff(d)}% off</span></p>
  <p class="badges">${signalBadge(d)} <span class="save">You save ${usd(saved(d))}</span></p>
  <p class="why">${escape(d.why)}</p>
  <dl>
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Sale price</dt><dd>${usd(d.price)}</dd>
    <dt>Usual price</dt><dd>${usd(d.was)}</dd>
    <dt>Discount</dt><dd>${percentOff(d)}% off — ${usd(saved(d))} saved</dd>
    <dt>Checked</dt><dd>${day(d.checked)}</dd>
    <dt>Read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p><a class="go" href="${escape(d.url)}" rel="noopener" target="_blank">View at ${escape(d.store)} ↗</a></p>
  <p class="note">The link opens the store’s own search for this product, so you land on the matching listing. If the price has moved since the check above, the store’s page rules.</p>
</article>`;
}

function missing() {
  return `<h2>Not found</h2><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}

function render() {
  window.__shotReady = false;
  const dealMatch = location.hash.match(/^#\/deal\/([^/?]+)/);
  const topMatch = location.hash.match(/^#\/top\/(\d+)/);
  if (topMatch) state.minOff = Number(topMatch[1]);
  if (dealMatch) {
    const found = deals.find((d) => d.id === decodeURIComponent(dealMatch[1]));
    document.title = `${found ? found.title : 'Not found'} | DealBeacon`;
    app.innerHTML = found ? detail(found) : missing();
  } else {
    document.title = 'DealBeacon — Black Friday 2026';
    app.innerHTML = board();
    const q = app.querySelector('#q');
    const rerender = () => {
      app.innerHTML = board();
      wire();
    };
    const wire = () => {
      app.querySelector('#q').addEventListener('input', (e) => {
        state.query = e.target.value;
        const grid = app.querySelector('.grid');
        const empty = app.querySelector('.empty');
        const count = app.querySelector('.count');
        const list = visible();
        const html = list.length === 0
          ? '<p class="empty">No deal matches. Loosen a filter or clear the search.</p>'
          : `<div class="grid">${list.map(card).join('')}</div>`;
        if (grid) grid.outerHTML = html;
        else if (empty) empty.outerHTML = html;
        if (count) count.innerHTML = `Showing <b>${list.length}</b> of ${deals.length} deals`;
      });
      app.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
        state.category = b.dataset.cat;
        rerender();
      }));
      app.querySelector('#store').addEventListener('change', (e) => {
        state.store = e.target.value;
        rerender();
      });
      app.querySelector('#minoff').addEventListener('change', (e) => {
        state.minOff = Number(e.target.value);
        rerender();
      });
      app.querySelector('#sort').addEventListener('change', (e) => {
        state.sort = e.target.value;
        rerender();
      });
      const input = app.querySelector('#q');
      if (document.activeElement === input || state.query !== '') {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    };
    wire();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
