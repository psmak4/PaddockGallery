// This season's Grand Prix stats for every driver and team, worked out from the race results
// (sprints aren't included). Pure, so it is tested directly.
import type { SeasonStats, TeamSeasonStats } from '../types.ts';
import type { RawRace, RawResult } from './jolpica.ts';

/** Jolpica pages results 100 at a time, which can split a race across two pages: join them by round. */
export function mergeRacePages(pages: RawRace[]): RawRace[] {
  const byRound = new Map<string, RawRace>();
  for (const race of pages) {
    const seen = byRound.get(race.round);
    if (seen) seen.Results = [...(seen.Results ?? []), ...(race.Results ?? [])];
    else byRound.set(race.round, { ...race, Results: [...(race.Results ?? [])] });
  }
  return [...byRound.values()].sort((a, b) => Number(a.round) - Number(b.round));
}

// positionText: a number when classified; R retired, N not classified, D disqualified,
// W withdrawn and F failed to qualify (neither started), E excluded.
const started = (r: RawResult) => !['W', 'F', 'E'].includes(r.positionText ?? '');
const classified = (r: RawResult) => /^\d+$/.test(r.positionText ?? '');
const didNotFinish = (r: RawResult) => r.positionText === 'R' || r.positionText === 'N';

const emptyStats = (): SeasonStats => ({ races: 0, wins: 0, podiums: 0, poles: 0, bestFinish: null, dnfs: 0, fastestLaps: 0 });

/** Counts one car's result; `countRace` is off for a team's cars, whose race counts once. */
function add(stats: SeasonStats, r: RawResult, countRace = true): void {
  if (!started(r)) return;
  if (countRace) stats.races++;
  const position = classified(r) ? Number(r.position) : null;
  if (position === 1) stats.wins++;
  if (position !== null && position <= 3) stats.podiums++;
  if (position !== null && (stats.bestFinish === null || position < stats.bestFinish)) stats.bestFinish = position;
  if (r.grid === '1') stats.poles++;
  if (didNotFinish(r)) stats.dnfs++;
  if (r.FastestLap?.rank === '1') stats.fastestLaps++;
}

export interface SeasonOutput {
  drivers: Map<string, SeasonStats>;
  teams: Map<string, TeamSeasonStats>;
}

/**
 * Season stats from the merged race results. `lineups` (team id → its current drivers) decides the
 * team-mate head-to-head: races where both of today's drivers started for the team, and who finished
 * ahead (a classified finish beats a retirement; two retirements count for neither).
 */
export function seasonStats(races: RawRace[], lineups: Map<string, string[]>): SeasonOutput {
  const drivers = new Map<string, SeasonStats>();
  const teams = new Map<string, TeamSeasonStats>();
  const team = (id: string) => {
    let t = teams.get(id);
    if (!t) {
      t = { ...emptyStats(), oneTwos: 0, headToHead: Object.fromEntries((lineups.get(id) ?? []).map(d => [d, 0])) };
      teams.set(id, t);
    }
    return t;
  };

  for (const race of races) {
    const results = race.Results ?? [];
    const byTeam = new Map<string, RawResult[]>();
    for (const r of results) {
      const driverStats = drivers.get(r.Driver.driverId) ?? emptyStats();
      add(driverStats, r);
      drivers.set(r.Driver.driverId, driverStats);
      byTeam.set(r.Constructor.constructorId, [...(byTeam.get(r.Constructor.constructorId) ?? []), r]);
    }
    for (const [teamId, rows] of byTeam) {
      const t = team(teamId);
      const racing = rows.filter(started);
      if (racing.length) t.races++;
      for (const r of racing) add(t, r, false);
      const positions = new Set(rows.filter(classified).map(r => Number(r.position)));
      if (positions.has(1) && positions.has(2)) t.oneTwos++;

      const pair = lineups.get(teamId) ?? [];
      const a = racing.find(r => r.Driver.driverId === pair[0]);
      const b = racing.find(r => r.Driver.driverId === pair[1]);
      if (pair.length === 2 && a && b) {
        const rank = (r: RawResult) => (classified(r) ? Number(r.position) : Infinity);
        if (rank(a) < rank(b)) t.headToHead[pair[0]]++;
        else if (rank(b) < rank(a)) t.headToHead[pair[1]]++;
      }
    }
  }
  return { drivers, teams };
}
