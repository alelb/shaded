# Mission

## Why Shaded exists

_Shahed_ (شاهد) means **witness** in Arabic. Shaded is a public, open-source dashboard that lets open data bear
witness to the humanitarian situation in Gaza and the West Bank. It turns the datasets published by
[Tech for Palestine](https://data.techforpalestine.org/) into clear, honest visualizations that anyone can understand
without downloading or processing raw files.

## Audience

- **Primary: the general public and civic data advocates.** People who want to grasp the scale of the human toll
  quickly, on any device, including mobile phones on slow connections.
- **Secondary: journalists, researchers, educators** who need figures they can trust and trace back to their source.
- **Contributors: developers** extending the dashboard with new datasets and views.

## Voice and tone

Sober, factual, respectful. The data speaks; the interface does not editorialize.

- Plain language labels; no sensational wording, imagery, or color choices meant to shock.
- Every number shown is attributable to a named dataset and endpoint.
- Each record represents a person. Aggregations must never trivialize that (no gamified UI, no "fun" animations).

## Principles

1. **Data as witness.** Show what the data says, not more and not less. No extrapolation, estimation, or
   projection presented as fact.
2. **Transparency about limitations.** Reported figures may undercount the real toll (information disruption,
   unrecovered bodies). This caveat is always visible near the figures, not buried.
3. **Missing data is data.** Records with unknown age or unspecified sex are counted in an explicit
   "Unknown / Not specified" bucket — never silently dropped, never guessed.
4. **Source attribution.** Every view cites its dataset, links to the Tech for Palestine portal, and shows when
   the data was last updated.
5. **Mobile first.** Most people will meet Shaded on a phone. Every view is designed for a small screen first
   and progressively enhanced for larger ones.
6. **Accessible to everyone.** Fast on low-end mobile devices and slow networks; WCAG 2.1 AA; usable without
   relying on color alone; charts have text/table equivalents.
7. **No backend, no tracking.** Fully static, hosted on GitHub Pages. No user accounts, no analytics that
   identify visitors.
8. **Built to grow.** New datasets (West Bank, time-series, press, infrastructure) plug in as new views without
   rewriting the core.

## Definitions (shared vocabulary)

| Term              | Meaning                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| Casualty / killed | A record in the _Killed in Gaza_ dataset (v3). "Total" = count of records. |
| Sex               | `male`, `female`, or `Unknown / Not specified`.                            |
| Age brackets      | `0–17` (children, per UN CRC), `18–29`, `30–59`, `60+`, `Unknown`.         |
| Unknown           | Field is missing, null, empty, or not parseable.                           |

## Out of scope (for now)

- Displaying individual names or personal records (aggregates only in the MVP).
- Political commentary, opinion pieces, or calls to action.
- Data collection or user submissions; Shaded only consumes published open data.
