# Shaded

_Shahed_ means witness in Arabic. Focuses on data as an objective witness to the humanitarian situation.

## Input request from stakeholders

### Stakeholder request 1: community transparency & core metrics (MVP)

As a civic data advocate and member of the community, I want to access an overview dashboard of the casualties in
Gaza so that I can immediately grasp the scale of human toll broken down by core demographics without needing to download raw data files.

- User Story 1.1 (Total KPI): As a user, I want to see a prominent summary card showing the total number of verified casualties so I know the aggregate scale at a glance.
- User Story 1.2 (Gender breakdown): As a user, I want to view a visual breakdown of casualties by sex (male, female) to understand the demographic distribution.
- User Story 1.3 (Age distribution): As a user, I want to see a chart grouping casualties into standardized age brackets (0-18, 19-30, 31-59, 60-90, or whatelse) to evaluate the impact across different age groups, especially children and elderly.

### Stakeholder Request 2: Data Resiliency & Client-Side Performance

As a developer and system architect, I want the web application to run entirely client-side on GitHub Pages without a dedicated backend, while gracefully handling large datasets (tens of thousands of records) and potential missing data fields.

- User Story 2.1 (Static Hosting & Fetch): As a user, the app must load asynchronously from the Tech for Palestine static JSON endpoints without triggering CORS or network failure states that break the UI.

- User Story 2.2 (Missing Data Handling): As a system, any record with missing or null demographic fields (e.g., unknown age or unspecified sex) must be cleanly categorized into an "Unknown/Not Specified" bucket rather than crashing the aggregation logic or breaking charts.

- User Story 2.3 (Performance Optimization): As a user with a mobile device or slower connection, the heavy JSON parsing and array reduction/aggregation must not freeze the browser UI (e.g., utilizing efficient data processing or lightweight rendering).

### Stakeholder Request 3: Future Extensibility (Phase 2 Preparation)

As a project owner, I want the initial architecture to be modular so that future datasets (such as West Bank daily logs or historical time-series) can be integrated as new views without rewriting the core dashboard framework.

- User Story 3.1 (Modular UI Layout): As a developer, the codebase must separate data-fetching services, data-transformation logic (aggregators), and UI components cleanly.
- User Story 3.2 (Technical request): Use TypeScript, when it is feasible.

## 📊 Data Sources & API Endpoints

This project integrates open datasets provided by the **Tech for Palestine Datasets** initiative. These datasets track the human toll of the ongoing conflict since October 7, 2023, sourced from official reports, public submissions, and humanitarian databases.

### 1. Killed in Gaza (Demographics & Names List)

- **Description:** Detailed records of individual fatalities in Gaza, including name, age, date of birth, and sex. Used for demographic filtering, age group distributions, and gender breakdown charts.
- **Formats & Endpoints:**
  - Minified JSON (v3): `https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json`
  - CSV Format: `https://data.techforpalestine.org/api/v3/killed-in-gaza.csv`
  - Paged JSON (v2): `https://data.techforpalestine.org/api/v2/killed-in-gaza/page-1.json` _(incrementally from page 1 onwards)_

### 2. Daily Casualties (Gaza Time-Series)

- **Description:** Daily reports tracking aggregate killed and injured counts over time in the Gaza Strip.
- **Formats & Endpoints:**
  - JSON: `https://data.techforpalestine.org/api/v2/casualties_daily.json`
  - Minified JSON: `https://data.techforpalestine.org/api/v2/casualties_daily.min.json`
  - CSV: `https://data.techforpalestine.org/api/v2/casualties_daily.csv`

### 3. West Bank Daily Reports

- **Description:** Daily reports tracking killed, injured, and settler attack counts across the West Bank.
- **Formats & Endpoints:**
  - JSON: `https://data.techforpalestine.org/api/v2/west_bank_daily.json`
  - Minified JSON: `https://data.techforpalestine.org/api/v2/west_bank_daily.min.json`

### 4. Press Killed in Gaza

- **Description:** Specific registry of journalists and press workers killed during the hostilities.
- **Formats & Endpoints:**
  - JSON: `https://data.techforpalestine.org/api/v2/press_killed_in_gaza.json`

### 5. Infrastructure Damage Reports

- **Description:** Weekly reports estimating damage to vital human infrastructure in Gaza.
- **Formats & Endpoints:**
  - JSON: `https://data.techforpalestine.org/api/v2/infrastructure-damaged.json`

> **Note on Data Limitations:** As documented by the maintainers, these datasets reflect reported figures and may not fully capture the entire human toll due to information disruptions and unrecovered bodies under rubble. Official documentation and schema updates can be found on the [Tech for Palestine Data Portal](https://data.techforpalestine.org/).

## Development

Requires **Node 24** (see `.nvmrc`) and **pnpm** via Corepack (version pinned in `package.json`).

```sh
corepack enable
pnpm install
```

| Script              | What it does                                 |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start the Vite dev server                    |
| `pnpm build`        | Typecheck and build static output to `dist/` |
| `pnpm preview`      | Serve the production build locally           |
| `pnpm typecheck`    | Run the TypeScript compiler (`strict`)       |
| `pnpm lint`         | Run ESLint                                   |
| `pnpm test`         | Run Vitest once (`pnpm test:watch` to watch) |
| `pnpm format`       | Format all files with Prettier               |
| `pnpm format:check` | Check formatting without writing             |

Before pushing: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`.
