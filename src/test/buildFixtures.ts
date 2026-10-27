// Small raw API answers for the data build's tests: two teams, four race drivers, and a fifth driver
// who scored points earlier in the season but didn't race in the latest round.
import type { BuildInputs } from '../data/build/assemble';
import type { CareerCounts, RawConstructor, RawDriver, RawRace } from '../data/build/jolpica';
import type { OpenF1Driver } from '../data/build/openf1';

const mclaren: RawConstructor = { constructorId: 'mclaren', name: 'McLaren', nationality: 'British' };
const rb: RawConstructor = { constructorId: 'rb', name: 'RB F1 Team', nationality: 'Italian' };

const driver = (driverId: string, code: string, givenName: string, familyName: string, nationality: string): RawDriver => ({
  driverId,
  code,
  givenName,
  familyName,
  nationality,
  dateOfBirth: '2000-01-01',
});

const norris = driver('norris', 'NOR', 'Lando', 'Norris', 'British');
const piastri = driver('piastri', 'PIA', 'Oscar', 'Piastri', 'Australian');
const lawson = driver('lawson', 'LAW', 'Liam', 'Lawson', 'New Zealander');
const lindblad = driver('arvid_lindblad', 'LIN', 'Arvid', 'Lindblad', 'British');
const tsunoda = driver('tsunoda', 'TSU', 'Yuki', 'Tsunoda', 'Japanese');

export const latestRace: RawRace = {
  season: '2026',
  round: '18',
  raceName: 'United States Grand Prix',
  date: '2026-10-25',
  Results: [
    { number: '81', position: '1', grid: '1', Driver: piastri, Constructor: mclaren },
    { number: '1', position: '2', grid: '2', Driver: norris, Constructor: mclaren },
    { number: '30', position: '3', grid: '4', Driver: lawson, Constructor: rb },
    { number: '41', position: '4', grid: '3', Driver: lindblad, Constructor: rb },
  ],
};

const of1 = (n: number, acronym: string, first: string, last: string, team: string, colour: string, ref: string): OpenF1Driver => ({
  driver_number: n,
  name_acronym: acronym,
  first_name: first,
  last_name: last,
  team_name: team,
  team_colour: colour,
  headshot_url: `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/X/${ref.toUpperCase()}_X/${ref}.png.transform/1col/image.png`,
  session_key: 11396,
});

export const openf1Drivers: OpenF1Driver[] = [
  of1(1, 'NOR', 'Lando', 'Norris', 'McLaren', 'F47600', 'lannor01'),
  of1(81, 'PIA', 'Oscar', 'Piastri', 'McLaren', 'F47600', 'oscpia01'),
  of1(30, 'LAW', 'Liam', 'Lawson', 'Racing Bulls', '6C98FF', 'lialaw01'),
  of1(41, 'LIN', 'Arvid', 'Lindblad', 'Racing Bulls', '6C98FF', 'arvlin01'),
];

const counts = (starts: number, wins: number, seconds: number, thirds: number, poles: number, debutSeason: string): CareerCounts => ({
  starts: { total: starts, first: { season: debutSeason, round: '1', raceName: 'Australian Grand Prix', date: `${debutSeason}-03-01` } },
  wins,
  seconds,
  thirds,
  poles,
});

export function buildInputs(overrides: Partial<BuildInputs> = {}): BuildInputs {
  const mclarenPath = 'common/f1/2026/mclaren/2026mclarencarright';
  const mclarenLogo = 'common/f1/2026/mclaren/2026mclarenlogowhite';
  const norrisPath = 'common/f1/2026/mclaren/lannor01/2026mclarenlannor01right';
  return {
    season: 2026,
    latest: latestRace,
    totalRounds: 23,
    driverStandings: [
      { position: '1', points: '320', wins: '6', Driver: piastri, Constructors: [mclaren] },
      { position: '2', points: '300', wins: '5', Driver: norris, Constructors: [mclaren] },
      { position: '9', points: '60', wins: '0', Driver: lawson, Constructors: [rb, { constructorId: 'red_bull', name: 'Red Bull' }] },
      { position: '11', points: '20', wins: '0', Driver: lindblad, Constructors: [rb] },
      { position: '20', points: '2', wins: '0', Driver: tsunoda, Constructors: [rb] },
    ],
    constructorStandings: [
      { position: '1', points: '620', wins: '11', Constructor: mclaren },
      { position: '7', points: '80', wins: '0', Constructor: rb },
    ],
    constructors: [mclaren, rb],
    openf1: openf1Drivers,
    careers: new Map([
      ['norris', counts(150, 12, 20, 18, 16, '2019')],
      ['piastri', counts(70, 9, 8, 10, 6, '2023')],
      ['lawson', counts(40, 0, 0, 0, 0, '2023')],
      ['arvid_lindblad', counts(18, 0, 0, 0, 0, '2026')],
    ]),
    seasonResults: [latestRace],
    champions: [
      { season: 2024, driverId: 'max_verstappen' },
      { season: 2025, driverId: 'norris' },
    ],
    principals: {
      mclaren: { name: 'Andrea Stella', since: '2023', nationality: 'Italian' },
      rb: { name: 'Alan Permane', since: '2025-07', verify: true },
    },
    overrides: {},
    existingImages: new Set([mclarenPath, mclarenLogo, norrisPath]),
    ...overrides,
  };
}
