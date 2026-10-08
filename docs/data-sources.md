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
| Unknown           | Field is missing, null, empty, or not parseable.                                   |

## Catalog

| Dataset               | Status                | Endpoint used by Shaded                                                | Source module                      |
| --------------------- | --------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| Killed in Gaza        | In use (Phase 2)      | `https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json`     | `src/data/sources/killedInGaza.ts` |
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

Normalizer: `src/data/normalize/killedInGaza.ts`, with shared value parsers in `src/data/normalize/values.ts`
(Phase 3). Every row becomes one record: no row is dropped.

### Transfer and headers (observed 2026-10-07)

- 8.2 MB uncompressed, about 2.3 MB with Brotli (`content-encoding: br`).
- `access-control-allow-origin: *` (CORS open; confirmed from the GitHub Pages origin).
- `cache-control: public, max-age=0, must-revalidate`, with an `etag`. No `last-modified`.

### Notes

- `summary.json` reports `gaza.killed.total = 74,250`, while this dataset has 72,835 named records: the list covers
  identified people only. A total based on this dataset should be labelled accordingly (for example, "identified by
  name").

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
