// Fetches the current F1 grid and writes static JSON into public/data/ (committed to the repo).
// Run with: npm run data            (reuses cached answers until the next race has results)
//           npm run data -- --refresh  (refetches everything except finished seasons)
// Sources: Jolpica-F1, OpenF1, formula1.com's media CDN (checked, not downloaded) and the hand-curated
// files in data/curated/. See README "Refreshing the data".
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble, imageCandidates, type Champion, type CuratedPrincipal, type Overrides } from '../src/data/build/assemble.ts';
import { DiskCache, weekTag } from '../src/data/build/diskCache.ts';
import { getJson, urlExists } from '../src/data/build/fetchers.ts';
import { careerCounts, Jolpica, type CareerCounts } from '../src/data/build/jolpica.ts';
import { OPENF1, type OpenF1Driver } from '../src/data/build/openf1.ts';
import { JOLPICA_LIMITS, RateLimiter } from '../src/data/build/rateLimit.ts';
import { mergeRacePages } from '../src/data/build/season.ts';
import { assertSane, formatReport } from '../src/data/build/validate.ts';
import { f1ImageUrl } from '../src/data/images.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'data');
const FLAGS_DIR = join(ROOT, 'public', 'flags');
const CURATED_DIR = join(ROOT, 'data', 'curated');
const REPORT = join(ROOT, 'data', 'build-report.md');
const CACHE_DIR = join(ROOT, '.cache');
const FLAG_SOURCE = join(ROOT, 'node_modules', 'flag-icons', 'flags', '4x3');
const FIRST_SEASON = 1950;

const refresh = process.argv.includes('--refresh');

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function writeJson(name: string, data: unknown): Promise<void> {
  await writeFile(join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const started = Date.now();
  const cache = new DiskCache(join(CACHE_DIR, 'http'), refresh);
  const limiter = new RateLimiter(JOLPICA_LIMITS, join(CACHE_DIR, 'jolpica-requests.json'));
  await mkdir(CACHE_DIR, { recursive: true });
  await limiter.load();
  const jolpica = new Jolpica(cache, limiter);

  // The latest race decides how fresh everything else must be: current-season answers are reused
  // until another race has results.
  const latest = await jolpica.latestRace();
  const season = Number(latest.season);
  const roundTag = `round:${season}-${latest.round}`;
  const week = weekTag(new Date());
  console.log(`Latest results: ${season} round ${latest.round}, ${latest.raceName} (${latest.Results?.length} drivers)`);

  const totalRounds = await jolpica.totalRounds(season, roundTag);
  const driverStandings = await jolpica.driverStandings(season, roundTag);
  const constructorStandings = await jolpica.constructorStandings(season, roundTag);
  const constructors = await jolpica.constructors(season, roundTag);
  const seasonResults = mergeRacePages(await jolpica.seasonResults(season, roundTag));

  const openf1 = await cache.through(`${OPENF1}/drivers?session_key=latest`, roundTag, () =>
    getJson<OpenF1Driver[]>(`${OPENF1}/drivers?session_key=latest`),
  );
  console.log(`OpenF1: ${openf1.length} drivers in session ${openf1[0]?.session_key}`);

  // Drivers' career totals: five queries each.
  const driverIds = (latest.Results ?? []).map(r => r.Driver.driverId);
  const careers = new Map<string, CareerCounts>();
  for (const [i, driverId] of driverIds.entries()) {
    careers.set(driverId, await careerCounts(jolpica, driverId, roundTag));
    if ((i + 1) % 8 === 0) console.log(`career stats: ${i + 1}/${driverIds.length}`);
  }

  // Drivers' titles: the champion of every finished season since the earliest debut on the grid (cached
  // forever), plus this season's once its last race is run.
  const debuts = [...careers.values()].map(c => Number(c.starts.first?.season)).filter(Number.isFinite);
  const firstSeason = debuts.length ? Math.min(...debuts) : FIRST_SEASON;
  const champions: Champion[] = [];
  const lastSeason = Number(latest.round) >= totalRounds ? season : season - 1;
  for (let year = firstSeason; year <= lastSeason; year++) {
    const driverId = year === season ? ((await jolpica.driverStandings(season, roundTag))[0]?.Driver.driverId ?? null) : await jolpica.champion(year);
    champions.push({ season: year, driverId });
  }
  console.log(`Champions: ${champions.length} seasons since ${firstSeason}. Jolpica: ${jolpica.requests} requests this run, ${limiter.usedThisHour} in the last hour.`);

  const curated = await readJson<{ principals: Record<string, CuratedPrincipal> }>(join(CURATED_DIR, 'principals.json'));
  const overrides = await readJson<Overrides>(join(CURATED_DIR, 'overrides.json'));

  // formula1.com photos and logos are hotlinked at runtime; the build only checks they exist.
  const candidates = imageCandidates(season, latest, openf1);
  const existingImages = new Set<string>();
  for (const path of [...candidates.drivers.values(), ...candidates.cars.values(), ...candidates.logos.values()]) {
    const ok = await cache.through(f1ImageUrl(path, 100), week, () => urlExists(f1ImageUrl(path, 100)));
    if (ok) existingImages.add(path);
  }

  const out = assemble({
    season,
    latest,
    totalRounds,
    driverStandings,
    constructorStandings,
    constructors,
    openf1,
    careers,
    champions,
    seasonResults,
    principals: curated.principals,
    overrides,
    existingImages,
  });
  assertSane(out);

  await mkdir(OUT_DIR, { recursive: true });
  await writeJson('meta.json', out.meta);
  await writeJson('drivers.json', out.drivers);
  await writeJson('teams.json', out.teams);

  // Flags (flag-icons, MIT): only the ones in use.
  const codes = new Set(
    [...out.drivers.map(d => d.countryCode), ...out.teams.flatMap(t => [t.countryCode, t.principal?.countryCode])].filter(
      (c): c is string => Boolean(c),
    ),
  );
  await rm(FLAGS_DIR, { recursive: true, force: true });
  await mkdir(FLAGS_DIR, { recursive: true });
  for (const code of codes) {
    try {
      await copyFile(join(FLAG_SOURCE, `${code}.svg`), join(FLAGS_DIR, `${code}.svg`));
    } catch {
      out.issues.push({ kind: 'gap', message: `No flag for country code "${code}" in flag-icons.` });
    }
  }

  const summary = [
    `Season ${season}, after round ${latest.round} of ${totalRounds} (${latest.raceName}, ${latest.date}).`,
    `${out.teams.length} teams, ${out.drivers.length} drivers; ${out.drivers.filter(d => d.photo).length} driver photos, ${out.teams.filter(t => t.car).length} car images and ${out.teams.filter(t => t.logo).length} logos found on formula1.com.`,
    'Poles count races started from grid slot 1 (Jolpica\'s qualifying data is incomplete before 2003); grid penalties can make this differ from the official count.',
    `Built ${new Date().toISOString()}. Jolpica requests this run: ${jolpica.requests}; cache hits ${cache.hits}, misses ${cache.misses}.`,
  ];
  await writeFile(REPORT, formatReport(out.issues, summary));

  const counts = (kind: string) => out.issues.filter(i => i.kind === kind).length;
  console.log(
    `Wrote ${out.teams.length} teams and ${out.drivers.length} drivers to public/data/ in ${Math.round((Date.now() - started) / 1000)}s. ` +
      `Report: data/build-report.md (${counts('mismatch')} mismatches, ${counts('gap')} gaps, ${counts('note')} notes).`,
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
