import type { RawRace, RawResult } from './jolpica';
import { mergeRacePages, seasonStats } from './season';

const result = (driverId: string, team: string, positionText: string, grid: string, fastest = false): RawResult => ({
  number: '0',
  position: /^\d+$/.test(positionText) ? positionText : '20',
  positionText,
  grid,
  FastestLap: fastest ? { rank: '1' } : undefined,
  Driver: { driverId, givenName: driverId, familyName: driverId },
  Constructor: { constructorId: team, name: team },
});

const race = (round: string, Results: RawResult[]): RawRace => ({ season: '2026', round, raceName: `Round ${round}`, date: '', Results });

const races = [
  race('1', [result('nor', 'mcl', '1', '1', true), result('pia', 'mcl', '2', '2'), result('ver', 'rbr', 'R', '3')]),
  race('2', [result('pia', 'mcl', '1', '2'), result('nor', 'mcl', 'R', '1'), result('ver', 'rbr', '2', '3')]),
  race('3', [result('nor', 'mcl', '3', '4'), result('pia', 'mcl', 'W', '0'), result('ver', 'rbr', '1', '1')]),
];
const lineups = new Map([
  ['mcl', ['nor', 'pia']],
  ['rbr', ['ver', 'had']],
]);

test("drivers' season: starts, wins, podiums, poles, best finish, retirements, fastest laps", () => {
  const { drivers } = seasonStats(races, lineups);
  expect(drivers.get('nor')).toEqual({ races: 3, wins: 1, podiums: 2, poles: 2, bestFinish: 1, dnfs: 1, fastestLaps: 1 });
  // A withdrawal isn't a start.
  expect(drivers.get('pia')).toEqual({ races: 2, wins: 1, podiums: 2, poles: 0, bestFinish: 1, dnfs: 0, fastestLaps: 0 });
});

test("teams' season counts each race once and each car's result, with 1–2s and the head-to-head", () => {
  const { teams } = seasonStats(races, lineups);
  expect(teams.get('mcl')).toEqual({
    races: 3,
    wins: 2,
    podiums: 4,
    poles: 2,
    bestFinish: 1,
    dnfs: 1,
    fastestLaps: 1,
    oneTwos: 1,
    // Round 1 Norris ahead, round 2 Piastri ahead (Norris retired), round 3 not both started.
    headToHead: { nor: 1, pia: 1 },
  });
  // A head-to-head needs both current drivers to have raced.
  expect(teams.get('rbr')?.headToHead).toEqual({ ver: 0, had: 0 });
});

test('a race split across two pages is joined back together', () => {
  const merged = mergeRacePages([race('1', [result('a', 't', '1', '1')]), race('1', [result('b', 't', '2', '2')]), race('2', [])]);
  expect(merged.map(r => [r.round, r.Results?.length])).toEqual([
    ['1', 2],
    ['2', 0],
  ]);
});
