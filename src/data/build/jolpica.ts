// Jolpica-F1 (https://github.com/jolpica/jolpica-f1), the Ergast successor: the grid, standings, this
// season's results and the drivers' career totals. All requests go through the disk cache and the rate limiter.
import type { DiskCache } from './diskCache.ts';
import { FOREVER } from './diskCache.ts';
import { getJson } from './fetchers.ts';
import { JOLPICA_RETRY_DELAYS_MS, type RateLimiter } from './rateLimit.ts';

export const JOLPICA = 'https://api.jolpi.ca/ergast/f1';

export interface RawDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  dateOfBirth?: string;
  nationality?: string;
}

export interface RawConstructor {
  constructorId: string;
  name: string;
  nationality?: string;
}

export interface RawResult {
  number: string;
  position: string;
  /** A number when classified; R retired, N not classified, D disqualified, W withdrawn, F failed to qualify. */
  positionText?: string;
  grid: string;
  status?: string;
  FastestLap?: { rank?: string };
  Driver: RawDriver;
  Constructor: RawConstructor;
}

export interface RawRace {
  season: string;
  round: string;
  raceName: string;
  date: string;
  Results?: RawResult[];
}

export interface RawDriverStanding {
  position?: string;
  points: string;
  wins: string;
  Driver: RawDriver;
  Constructors: RawConstructor[];
}

export interface RawConstructorStanding {
  position?: string;
  points: string;
  wins: string;
  Constructor: RawConstructor;
}

interface StandingsList<T> {
  season: string;
  round: string;
  DriverStandings?: T[];
  ConstructorStandings?: T[];
}

export interface MRData {
  total: string;
  RaceTable?: { Races: RawRace[] };
  StandingsTable?: { StandingsLists: StandingsList<RawDriverStanding & RawConstructorStanding>[] };
  ConstructorTable?: { Constructors: RawConstructor[] };
}

/** A career total and the first race it counts (for debuts), from a `limit=1` query. */
export interface CountResult {
  total: number;
  first: RawRace | null;
}

export class Jolpica {
  /** Network requests this run (cache hits don't count). */
  requests = 0;
  private readonly cache: DiskCache;
  private readonly limiter: RateLimiter;

  constructor(cache: DiskCache, limiter: RateLimiter) {
    this.cache = cache;
    this.limiter = limiter;
  }

  /** `path` like "/current/last/results"; `tag` says how long the answer stays valid (see diskCache.ts). */
  async get(path: string, tag: string, query = 'limit=100'): Promise<MRData> {
    const url = `${JOLPICA}${path}.json?${query}`;
    return this.cache.through(url, tag, async () => {
      await this.limiter.take();
      this.requests++;
      return (await getJson<{ MRData: MRData }>(url, undefined, JOLPICA_RETRY_DELAYS_MS)).MRData;
    });
  }

  /** The latest race with results. Never cached: it decides whether everything else is stale. */
  async latestRace(): Promise<RawRace> {
    await this.limiter.take();
    this.requests++;
    const data = (await getJson<{ MRData: MRData }>(`${JOLPICA}/current/last/results.json?limit=100`, undefined, JOLPICA_RETRY_DELAYS_MS)).MRData;
    const race = data.RaceTable?.Races[0];
    if (!race?.Results?.length) throw new Error('Jolpica returned no results for the latest race');
    return race;
  }

  async totalRounds(season: number, tag: string): Promise<number> {
    return Number((await this.get(`/${season}`, tag, 'limit=1')).total);
  }

  async driverStandings(season: number, tag: string): Promise<RawDriverStanding[]> {
    const data = await this.get(`/${season}/driverStandings`, tag);
    return data.StandingsTable?.StandingsLists[0]?.DriverStandings ?? [];
  }

  async constructorStandings(season: number, tag: string): Promise<RawConstructorStanding[]> {
    const data = await this.get(`/${season}/constructorStandings`, tag);
    return data.StandingsTable?.StandingsLists[0]?.ConstructorStandings ?? [];
  }

  async constructors(season: number, tag: string): Promise<RawConstructor[]> {
    return (await this.get(`/${season}/constructors`, tag)).ConstructorTable?.Constructors ?? [];
  }

  /** Every race result of a season, a page of 100 at a time (pages can split a race; see mergeRacePages). */
  async seasonResults(season: number, tag: string): Promise<RawRace[]> {
    const races: RawRace[] = [];
    for (let offset = 0; ; offset += 100) {
      const data = await this.get(`/${season}/results`, tag, `limit=100&offset=${offset}`);
      races.push(...(data.RaceTable?.Races ?? []));
      if (offset + 100 >= Number(data.total)) return races;
    }
  }

  /** How many results match `path` (e.g. "/drivers/hamilton/results/1"), and the earliest of them. */
  async count(path: string, tag: string): Promise<CountResult> {
    const data = await this.get(path, tag, 'limit=1');
    return { total: Number(data.total), first: data.RaceTable?.Races[0] ?? null };
  }

  /** A finished season's drivers' champion. Cached forever. */
  async champion(season: number): Promise<string | null> {
    const data = await this.get(`/${season}/driverStandings/1`, FOREVER);
    return data.StandingsTable?.StandingsLists[0]?.DriverStandings?.[0]?.Driver.driverId ?? null;
  }

}

export interface CareerCounts {
  starts: CountResult;
  wins: number;
  seconds: number;
  thirds: number;
  poles: number;
}

/** A driver's career counts: five queries. */
export async function careerCounts(jolpica: Jolpica, driverId: string, tag: string): Promise<CareerCounts> {
  const subject = `drivers/${driverId}`;
  const starts = await jolpica.count(`/${subject}/results`, tag);
  const wins = (await jolpica.count(`/${subject}/results/1`, tag)).total;
  const seconds = (await jolpica.count(`/${subject}/results/2`, tag)).total;
  const thirds = (await jolpica.count(`/${subject}/results/3`, tag)).total;
  // Jolpica's qualifying data is patchy before 2003 and includes sprint qualifying, so poles count
  // races started from grid slot 1 (this differs from the official count only after grid penalties).
  const poles = (await jolpica.count(`/${subject}/grid/1/results`, tag)).total;
  return { starts, wins, seconds, thirds, poles };
}
