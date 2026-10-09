# Data sources

The datasets Shaded uses or plans to use, with their endpoints, structure, and the value rules the code relies on.
All of them are published by [Tech for Palestine](https://data.techforpalestine.org/), which is the reference for
official documentation and schema changes. The datasets track the human toll since October 7, 2023, and are
sourced from official reports, public submissions, and humanitarian databases.

Unlike `specs/mission.md`, this document is expected to change: update it when a source changes its structure, when
a new dataset is added, or when a value rule is decided. Always date observations.

> **Limitations:** these datasets reflect reported figures. They may not capture the entire human toll because of
> information disruption and unrecovered bodies under rubble.

## Shared vocabulary

| Term              | Meaning                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| Casualty / killed | A person recorded as killed in a source dataset. "Total" = count of those records. |
| Sex               | `male`, `female`, or `Unknown / Not specified`.                                    |
| Age brackets      | `0–17` (children, per UN CRC), `18–29`, `30–59`, `60+`, `Unknown`.                 |
| Bracket bounds    | Inclusive integer ranges; `60+` is 60–120; `age` Unknown → `Unknown` (2026-10-09). |
| Unknown           | Field is missing, null, empty, or not parseable.                                   |

## Catalog

| Dataset               | Status                | Endpoint used by Shaded                                                | Source module                      |
| --------------------- | --------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| Killed in Gaza        | In use (Phase 2)      | `https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json`     | `src/data/sources/killedInGaza.ts` |
| Summary               | In use (Phase 4–7)    | `https://data.techforpalestine.org/api/v3/summary.json`                | `src/data/sources/summary.ts`      |
| Gaza daily casualties | Planned (Phase 12)    | `https://data.techforpalestine.org/api/v2/casualties_daily.min.json`   |                                    |
| West Bank daily       | Planned (Phase 14)    | `https://data.techforpalestine.org/api/v2/west_bank_daily.min.json`    |                                    |
| Press killed in Gaza  | Later (not scheduled) | `https://data.techforpalestine.org/api/v2/press_killed_in_gaza.json`   |                                    |
| Infrastructure damage | Later (not scheduled) | `https://data.techforpalestine.org/api/v2/infrastructure-damaged.json` |                                    |

## Killed in Gaza

Records of individual people killed in Gaza, identified by name. Shaded uses only `age` and `sex`; names, `id`, and
`dob` never leave the source module (aggregates only).

- **Endpoint:** minified JSON v3, `https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json`.
- **Other formats (not used):** CSV `…/api/v3/killed-in-gaza.csv`; paged JSON v2
  `…/api/v2/killed-in-gaza/page-1.json` onwards.

### Structure (observed 2026-10-07)

- A JSON array of arrays. Row 0 is the header `["id","en_name","ar_name","age","dob","sex","update"]`; each
  following row is one person, with one value per header column.
- Shaded looks columns up **by header name**, so reordered or added columns do not break it.
- 72,835 rows.
- `update` is a batch number (1 to 10), not a date.

### Field values and rules

| Field | Observed (2026-10-07)        | Rule in Shaded                                                                                                                                                                         |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `age` | Integer from 0 to 110        | Whole years: an integer number or integer string (trimmed) from 0 to 120. Anything else (missing, empty, negative, fractional, above 120, non-numeric) → Unknown (decided 2026-10-08). |
| `age` | `0` in 1,072 records         | **`0` is a real age: a child under one year.** Never treated as Unknown (confirmed 2026-10-08).                                                                                        |
| `sex` | `"m"` or `"f"`               | Trimmed, case-insensitive: `m` or `male` → male, `f` or `female` → female. Missing or any other value → Unknown / Not specified (decided 2026-10-08).                                  |
| any   | No null or empty values seen | The code still handles missing values: upstream data can change without notice.                                                                                                        |

Normalizer: `src/data/normalize/person.ts` (Phase 3, decided 2026-10-09), shared by person-based datasets.
Every row becomes one record: no row is dropped.

### Transfer and headers (observed 2026-10-07)

- 8.2 MB uncompressed, about 2.3 MB with Brotli (`content-encoding: br`).
- `access-control-allow-origin: *` (CORS open; confirmed from the GitHub Pages origin).
- `cache-control: public, max-age=0, must-revalidate`, with an `etag`. No `last-modified` (re-checked 2026-10-09):
  the dataset date comes from [Summary](#summary).

### Notes

- `summary.json` reports `gaza.killed.total = 74,250`, while this dataset has 72,835 named records: the list covers
  identified people only. A total based on this dataset should be labelled accordingly (for example, "identified by
  name").

## Summary

Headline figures across the datasets, maintained by Tech for Palestine. Shaded uses it only for the dates of the
Killed in Gaza list and for the reported total killed in Gaza, shown as a separate, attributed figure.

- **Endpoint:** `https://data.techforpalestine.org/api/v3/summary.json`.

### Structure (observed 2026-10-09)

- One JSON object, about 1.2 kB. Top-level keys: `gaza`, `west_bank`, `lebanon`, `known_killed_in_gaza`,
  `known_press_killed_in_gaza`.
- `known_killed_in_gaza`: `records` (72,835, equal to the Killed in Gaza row count), `pages`, `page_size`,
  `male` / `female` split into `child` / `adult` / `senior`, `last_update` (`"2026-07-27"`), and `includes_until`
  (`"2026-05-07"`).
- `gaza`: `reports`, `last_update` (`"2026-10-07"`), and `killed.total` (74,250), plus other counts that Shaded does not
  use.
- Headers: `access-control-allow-origin: *`, `cache-control: public, max-age=0, must-revalidate`.

### Field values and rules (decided 2026-10-09)

| Field                                 | Rule in Shaded                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `known_killed_in_gaza.last_update`    | Shown as the Killed in Gaza "last updated" date. Kept only if it is a `YYYY-MM-DD` string; otherwise unavailable. |
| `known_killed_in_gaza.includes_until` | Shown as "records up to". Same date rule.                                                                         |
| `known_killed_in_gaza.records`        | Not displayed; used only to cross-check the live total. Kept only if it is a non-negative integer.                |
| `gaza.killed.total`                   | Shown as a separate reported-total line, never merged with the named count. Same integer rule.                    |
| `gaza.last_update`                    | The "as of" date of the reported total. Same date rule.                                                           |
| `male` / `female` splits              | Not used: their child / adult / senior bands differ from Shaded's age brackets.                                   |

If `summary.json` fails or is malformed, the Killed in Gaza figures still show; only the dates and the reported total
are left out.

## Gaza daily casualties

Daily reports of aggregate killed and injured counts in the Gaza Strip.

- **Endpoints:** JSON `…/api/v2/casualties_daily.json`, minified `…/api/v2/casualties_daily.min.json`, CSV
  `…/api/v2/casualties_daily.csv`.
- **Structure:** not profiled yet (Phase 12).

## West Bank daily

Daily reports of killed, injured, and settler attack counts across the West Bank.

- **Endpoints:** JSON `…/api/v2/west_bank_daily.json`, minified `…/api/v2/west_bank_daily.min.json`.
- **Structure:** not profiled yet (Phase 14).

## Press killed in Gaza

Registry of journalists and press workers killed in Gaza.

- **Endpoint:** JSON `…/api/v2/press_killed_in_gaza.json`.
- **Structure:** not profiled yet.

## Infrastructure damage

Weekly reports estimating damage to vital infrastructure in Gaza.

- **Endpoint:** JSON `…/api/v2/infrastructure-damaged.json`.
- **Structure:** not profiled yet.
