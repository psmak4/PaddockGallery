import type { CareerStats, Driver, Meta, SeasonStats, Team, TeamSeasonStats } from '../data/types';

const career = (wins: number, titles: number[] = []): CareerStats => ({
  starts: 100,
  wins,
  podiums: wins * 3,
  poles: wins,
  titles: titles.length,
  titleYears: titles,
  debut: { season: 2019, race: 'Australian Grand Prix' },
});

const season = (wins: number, podiums: number, extra: Partial<SeasonStats> = {}): SeasonStats => ({
  races: 18,
  wins,
  podiums,
  poles: wins,
  bestFinish: wins ? 1 : 4,
  dnfs: 1,
  fastestLaps: 0,
  ...extra,
});

const teamSeason = (wins: number, podiums: number, headToHead: Record<string, number>): TeamSeasonStats => ({
  ...season(wins, podiums),
  oneTwos: wins ? 1 : 0,
  headToHead,
});

const driver = (id: string, code: string, number: number, givenName: string, familyName: string, teamId: string, position: number, extra: Partial<Driver> = {}): Driver => ({
  id,
  code,
  number,
  givenName,
  familyName,
  nationality: 'British',
  country: 'United Kingdom',
  countryCode: 'gb',
  dateOfBirth: '1999-11-13',
  teamId,
  standing: { position, points: 300 - position * 10, wins: 2 },
  season: season(2, 6),
  career: career(10),
  photo: null,
  altPhotos: [],
  ...extra,
});

export const meta: Meta = {
  season: 2026,
  round: 18,
  totalRounds: 23,
  lastRace: { name: 'United States Grand Prix', date: '2026-10-25' },
};

export const drivers: Driver[] = [
  driver('piastri', 'PIA', 81, 'Oscar', 'Piastri', 'mclaren', 1, { nationality: 'Australian', country: 'Australia', countryCode: 'au' }),
  driver('norris', 'NOR', 1, 'Lando', 'Norris', 'mclaren', 2, {
    career: career(12, [2025]),
    photo: 'common/f1/2026/mclaren/lannor01/2026mclarenlannor01right',
    altPhotos: ['common/f1/2026/mclaren/lannor01/2026mclarenlannor01left', 'common/f1/2026/mclaren/lannor01/2026mclarenlannor01front'],
  }),
  driver('lawson', 'LAW', 30, 'Liam', 'Lawson', 'rb', 9),
  driver('arvid_lindblad', 'LIN', 41, 'Arvid', 'Lindblad', 'rb', 11),
];

export const teams: Team[] = [
  {
    id: 'mclaren',
    name: 'McLaren',
    nationality: 'British',
    country: 'United Kingdom',
    countryCode: 'gb',
    colour: '#F47600',
    driverIds: ['piastri', 'norris'],
    principal: { name: 'Andrea Stella', since: '2023', country: 'Italy', countryCode: 'it' },
    standing: { position: 1, points: 620, wins: 11 },
    season: teamSeason(4, 12, { piastri: 8, norris: 10 }),
    car: 'common/f1/2026/mclaren/2026mclarencarright',
    altCar: 'common/f1/2026/mclaren/2026mclarencarleft',
    logo: 'common/f1/2026/mclaren/2026mclarenlogowhite',
  },
  {
    id: 'rb',
    name: 'Racing Bulls',
    nationality: 'Italian',
    country: 'Italy',
    countryCode: 'it',
    colour: '#6C98FF',
    driverIds: ['lawson', 'arvid_lindblad'],
    principal: null,
    standing: { position: 7, points: 80, wins: 0 },
    season: teamSeason(0, 0, { lawson: 0, arvid_lindblad: 0 }),
    car: null,
    altCar: null,
    logo: null,
  },
];
