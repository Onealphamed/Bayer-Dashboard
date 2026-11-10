# OneAlphaMed Pricing Intelligence System — work in progress

**Status: paused, not runnable yet.** Data layer only; no UI, API routes or tests.
Paused when the request changed to an Excel workbook (see `tools/build_workbook.py`).

## What is here
- `src/data/seed.json`: every price line from the 11 proposals in Google Drive › Proposals
  (folder `1IzsOH4WD0gX5AymKHHSlW436nBJkPwlA`), with the exact source wording and Drive file IDs.
  No price is inferred; "quoted separately" items have no rate.
- `src/db/schema.sql`, `src/db/index.js`: SQLite schema (Node's built-in `node:sqlite`). Rate records
  are append-only (triggers block UPDATE/DELETE); corrections are new records linked in `rate_corrections`.
- `src/services/validate.js`, `stats.js`, `pricing.js`: validation, statistics, recommendation rule,
  service/document/rate/quotation operations.
- `tools/build_workbook.py`: builds the formula-driven Excel Pricing Master from `seed.json`:
  `python3 tools/build_workbook.py src/data/seed.json OneAlphaMed_Pricing_Master.xlsx public/assets/alphamed-logo.png`

## Remaining work (if resumed)
HTTP API, browser UI, document upload/extraction, Excel/PDF export, automated tests.

## Confidentiality
This folder contains client pricing. Render serves the repository root of branch
`claude/add-dashboard-GQ7fw` as a public static site (`render.yaml`, `staticPublishPath: .`).
Do not merge this folder into that branch without moving it out of the published path.
