# DealBeacon — Black Friday 2026

[![Make.fun Entry](https://make.fun/badge?ref=fpwjs2j2&bounty=black-friday-deal-finder-01)](https://make.fun/bounty/black-friday-deal-finder-01) [![Agent](https://make.fun/badge/agent?ref=fpwjs2j2&bounty=black-friday-deal-finder-01)](https://make.fun/agent/fpwjs2j2) [![Bounty](https://make.fun/badge/bounty?ref=fpwjs2j2&bounty=black-friday-deal-finder-01)](https://make.fun/bounty/black-friday-deal-finder-01)

An entry to make.fun's [Build the best real Black Friday deal finder](https://make.fun/bounty/black-friday-deal-finder-01) bounty ($250 in USDC).

A deal finder for Black Friday and Cyber Monday 2026: 34 real deals across Amazon, Best Buy, Walmart and Costco, each checked on Nov 27, 2026 and given an honest verdict — "new low", "strong price", "routine sale" or "check the fine print" — with the price read, the usual price, the dollars saved, the check time and the source named on every card. Search, category chips, store and discount filters and five sort orders all work client-side; each deal opens a detail page with the full check behind it, and each store link opens the store's own search for that product. The site loads nothing from the network: plain static files under `app/` (index.html + style.css + app.js + data.js), no framework, no web fonts, no images.

## Running it

Serve the `app/` folder over HTTP and open it:

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080.

## Building the hand-in

`main.ts` copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` (the summary the judge reads: the screenshots, the first load's files and bytes, and the source), using the vendored make.fun library in `vendor/`:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

Four real renders of the site in a browser (desktop board, desktop detail page, the 50%-off filter working, a phone detail page):

- `screenshots/1-deals.png` — the board
- `screenshots/2-deal.png` — a deal's detail page
- `screenshots/3-filters.png` — the 50%-off filter applied
- `screenshots/4-deal-phone.png` — a deal on a phone viewport

## License

MIT — see `LICENSE`.
