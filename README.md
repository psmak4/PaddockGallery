# PaddockGallery

A Formula 1 card gallery and a sibling of [DexGallery](https://github.com/psmak4/DexGallery). Browse this season's **drivers** and **teams** as cards in the team colours, then flip through them one at a time over a full-page team-colour backdrop. Click a card to flip it over. A driver's card shows their season, their team, career stats, date of birth (in the viewer's own date format), nationality and debut. A team's card is about this season: its drivers and their results, the team's results, a team-mate head-to-head and the principal. A driver's card links to their team, and a team's card links to its drivers.

## Development

Requires Node 22.

```bash
npm install
npm run dev    # http://localhost:5174
npm test       # unit and component tests (Vitest)
npm run lint   # oxlint
npm run build  # type-check and production build into dist/
```

The data is committed in `public/data/`, so there is nothing to fetch before `dev` or `build`.

## Refreshing the data

The site is static and makes no API calls at runtime (apart from loading photos, see below). All the data is fetched by a build script you run by hand, a few times a season:

```bash
npm run data              # after a race: refetches this season's data, reuses everything else
npm run data -- --refresh # refetch everything except finished seasons
```

Then read `data/build-report.md`, fix anything it asks for (see "Curated data"), re-run if you changed a curated file, and commit `public/data/`, `public/flags/` and the report.

**What it does** (`scripts/build-data.ts`, with the logic in `src/data/build/`):

1. **[Jolpica-F1](https://github.com/jolpica/jolpica-f1)** (the Ergast successor) supplies:
   - the grid (the drivers in the latest race with results), with their numbers, codes, nationalities and dates of birth;
   - the standings and the teams' nationalities;
   - each driver's career totals (races, wins, podiums, poles and debut), and their titles, from the champion of every finished season since the earliest debut on the grid;
   - this season's race results. From those the script works out each driver's and team's season (wins, podiums, poles, best finish, retirements, fastest laps, 1–2s) and the team-mate head-to-head.
2. **[OpenF1](https://openf1.org)** (latest session) supplies the team colours and formula1.com's ids for each driver. It also gives a second opinion on the grid: every disagreement with Jolpica goes in the report.
3. **formula1.com images**: the script checks that each driver portrait, car side view and (white) team logo exists, and stores its path. Missing images are listed in the report, and those cards do without them.
4. **`data/curated/`**: the team principals, and any corrections, are applied last.
5. The script sanity-checks the result (team and driver counts, colours, ids). It refuses to write broken data, so the committed data stays as it was.

The script fetches only what the app shows; `src/data/types.ts` lists every field.

**Rate limits and caching.** Jolpica allows 500 requests an hour and refuses short bursts, so the script sends at most one request a second and keeps under 450 an hour. It shares that budget across runs (`.cache/jolpica-requests.json`), and after a "429 Too Many Requests" it waits and retries. Every response is cached in `.cache/http/` (gitignored):
- **Finished seasons** are cached forever.
- **This season's data** is reused until another race has results.
- **Image checks** are refreshed weekly.

The first run makes about 145 Jolpica requests and takes 3–10 minutes. After that, a run following a race makes about 120 requests, and a run with no new race makes one.

**Caveats** (also listed in each report):
- **Poles** count races started from grid slot 1, because Jolpica's qualifying data is incomplete before 2003 and includes sprint qualifying. This can differ from the official count when there were grid penalties. Correct a number with an override if it matters.

## Curated data

`data/curated/` holds the hand-maintained data. After editing it, run `npm run data`.

- **`principals.json`**: team principals, keyed by Jolpica constructor id. This is the only source for them, so it's the source of truth. Principals change mid-season, so update it when they do. Each entry has a `name`, `since` ("2023" or "2025-07") and `nationality` (a demonym such as "British", which picks the flag). Entries marked `"verify": true` are listed in the report until you check them and remove the flag.
- **`overrides.json`**: corrections applied over everything else, keyed by Jolpica driver or constructor id. Any field in `public/data/drivers.json` or `teams.json` can be set. Nested objects merge, so `{ "career": { "poles": 104 } }` changes only the poles. Examples:

  ```json
  {
    "drivers": { "hamilton": { "career": { "poles": 104 } } },
    "teams": { "cadillac": { "colour": "#1E1E1E" } }
  }
  ```

- **Nationalities** (drivers', teams' and principals') missing from `src/data/build/countries.ts` are reported. Add the demonym there.

## How it works

- **Data:** `public/data/meta.json`, `drivers.json` and `teams.json`. Ids are Jolpica's `driverId` and `constructorId`. The schema is in `src/data/types.ts`. Every page reads all three files in one query (`useGrid`), and `index.html` starts fetching them before the app's JavaScript runs.
- **Cards:** `src/cards/` has the card faces. Sizes use container query units, so one design serves the grid, the viewer and the thumbnail strip. Names are set in Titillium Web (bundled, OFL).
  - **Driver cards** are portrait and work without a photo: race number, team-colour gradient, team logo and name. The driver's flag and three-letter code are on the back.
  - **Team cards** are landscape, so the car's side view fits whole: the team's logo and name, the car, and both drivers' full names. The team's flag is on the back.
- **Special editions:** every card has rare versions, after Topps Chrome's 1/1 parallels (`src/cards/editions.ts`, styles in `Editions.module.css`). Each has a small label in the top-right corner.
  - **Paddock Gold:** gold refractor lines that slowly turn, and a moving sheen.
  - **Carbon:** a black carbon-fibre weave that stays still, a glossy resin highlight and a silver edge.

  Each card is rolled once per visit. It comes up as each edition 1 time in 500 (`ODDS`), never both, and keeps its roll for the visit in the grid, the viewer and the strip. In development (`npm run dev`) the header has a **Gold** and a **Carbon** pill. Each cycles its edition through **Random → Always → Never**, remembered in your browser; if both are on Always, Gold shows. Production builds always roll, and the toggles aren't included in them.
- **Pages:** the **Drivers** tab (`/`) shows each team's pair under a team heading, in constructors' championship order. The **Teams** tab (`/teams`) shows the team cards. The viewer (`/drivers/:id`, `/teams/:id`) works like DexGallery's:
  - one card at a time, with arrows, swipe, ←/→, Home and End;
  - a thumbnail strip;
  - a click or Space flips the card to its details;
  - Esc goes back;
  - the card morphs between the grid and the viewer.

  The back of a driver's card links to their team, and the back of a team's card links to its drivers.
- **Images:** driver portraits, car side views and team logos are formula1.com's official images, hotlinked from its media CDN at the size each view needs. They aren't copied into the repo. If one fails to load, the card still shows everything else.

## Deploying to Netlify

`netlify.toml` sets the build command (`npm run build`, since the data is committed), the publish directory, the Node version, the single-page-app redirect, a 404 for missing data files, and cache headers. Create a Netlify site from this repository. Each push of refreshed data redeploys it.

## Credits

Data from [Jolpica-F1](https://github.com/jolpica/jolpica-f1) and [OpenF1](https://openf1.org). Flags from [flag-icons](https://github.com/lipis/flag-icons) (MIT). Driver and car images © Formula One World Championship Limited, shown from formula1.com. Team logos are trademarks of their teams. This is an unofficial fan project and isn't associated with Formula 1 or any team. F1, FORMULA 1 and related marks are trademarks of Formula One Licensing B.V.
