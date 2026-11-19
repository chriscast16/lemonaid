# Lemonaid build log

Add a new entry at the bottom after each iteration. Put screenshots in `docs/screenshots/` using lowercase names, such as `iter2-vin-prompt.png`.

| # | Date | Led by | What changed | Why | Screenshots |
| --- | --- | --- | --- | --- | --- |
| 0 | 2026-11-17 | Member 1 | Repo, GitHub Pages, team skill, API check | Publish early; confirm NHTSA works from the browser | |
| 1 | 2026-11-17 | Member 1 | Rebuilt prototype as plain index.html, styles.css, app.js; live makes and models from NHTSA vPIC; preserved old-prototype.html | Remove uneditable React bundle; enable live dropdowns from NHTSA | |
| 2 | 2026-11-17 | Member 2 | VIN search with 17-character format validation (no I, O, Q); vPIC VIN decoding into vehicle details card with plain-English specs; sample VINs | Primary VIN-first lookup for used car buyers with clear spec explanations | |
| 3 | 2026-11-19 | Member 3 | Connected Safety Recalls page and Report Overview recalls card to live NHTSA API; strict model matching against NHTSA recall model directory with interactive model selector fallback; one card per recall with plain-English title, safety risk, recommended remedy, and expandable Details section containing original NHTSA wording; Do Not Drive / Park Outside urgent flags; direct link and VIN input for nhtsa.gov/recalls verification; prevented false 0 recalls on API failure, unavailable data, or model mismatch; verified on desktop and mobile | Replace demonstration data with live NHTSA defect records; never show false 0 recalls on mismatch, unavailable data, or connection error | |

