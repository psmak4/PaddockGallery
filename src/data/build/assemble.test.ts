import { buildInputs, latestRace } from '../../test/buildFixtures';
import { applyOverride, assemble, imageCandidates } from './assemble';

test('the grid is the latest race, teams in standings order and drivers by standing within their team', () => {
  const { drivers, teams } = assemble(buildInputs());
  expect(teams.map(t => t.id)).toEqual(['mclaren', 'rb']);
  expect(drivers.map(d => d.id)).toEqual(['piastri', 'norris', 'lawson', 'arvid_lindblad']);
  expect(teams[0].driverIds).toEqual(['piastri', 'norris']);
});

test('team names and colours come from OpenF1', () => {
  const { teams } = assemble(buildInputs());
  expect(teams[1]).toMatchObject({ name: 'Racing Bulls', colour: '#6C98FF', countryCode: 'it', country: 'Italy' });
});

test("drivers' career stats add up podiums, count titles from finished seasons, and keep the debut", () => {
  const { drivers } = assemble(buildInputs());
  const norris = drivers.find(d => d.id === 'norris')!;
  expect(norris.career).toEqual({
    starts: 150,
    wins: 12,
    podiums: 50,
    poles: 16,
    titles: 1,
    titleYears: [2025],
    debut: { season: 2019, race: 'Australian Grand Prix' },
  });
});

test('drivers get flags from their nationality and photos only when they exist; nothing unused is stored', () => {
  const { drivers } = assemble(buildInputs());
  const norris = drivers.find(d => d.id === 'norris')!;
  expect(norris).toMatchObject({
    countryCode: 'gb',
    dateOfBirth: '2000-01-01',
    photo: 'common/f1/2026/mclaren/lannor01/2026mclarenlannor01right',
    standing: { position: 2, points: 300, wins: 5 },
  });
  expect(Object.keys(norris).sort()).toEqual(
    ['career', 'code', 'country', 'countryCode', 'dateOfBirth', 'familyName', 'givenName', 'id', 'nationality', 'number', 'photo', 'season', 'standing', 'teamId'],
  );
  expect(drivers.find(d => d.id === 'piastri')!.photo).toBeNull();
});

test("team logos come from formula1.com when they exist", () => {
  const { teams, issues } = assemble(buildInputs());
  expect(teams[0].logo).toBe('common/f1/2026/mclaren/2026mclarenlogowhite');
  expect(teams[1].logo).toBeNull();
  expect(issues.some(i => i.kind === 'gap' && i.message.startsWith('Racing Bulls: no logo on formula1.com'))).toBe(true);
});

test('principals come from the curated file, their flag from its nationality', () => {
  const { teams, issues } = assemble(buildInputs());
  expect(teams[0].principal).toEqual({ name: 'Andrea Stella', since: '2023', country: 'Italy', countryCode: 'it' });
  expect(teams[1].principal).toEqual({ name: 'Alan Permane', since: '2025-07', country: null, countryCode: null });
  expect(issues.some(i => i.kind === 'gap' && i.message.startsWith('Alan Permane: no known "nationality"'))).toBe(true);
  expect(Object.keys(teams[0]).sort()).toEqual(
    ['car', 'colour', 'country', 'countryCode', 'driverIds', 'id', 'logo', 'name', 'nationality', 'principal', 'season', 'standing'],
  );
});

test('the report lists mismatches, gaps and notes', () => {
  const openf1 = buildInputs().openf1.map(o => (o.name_acronym === 'LIN' ? { ...o, driver_number: 99 } : o));
  const { issues } = assemble(buildInputs({ openf1 }));
  const messages = issues.map(i => `${i.kind}: ${i.message}`);
  // Matched by code when the number differs, and the difference is reported.
  expect(messages).toContain('mismatch: Arvid Lindblad: Jolpica has #41, OpenF1 has #99.');
  expect(messages.some(m => m.startsWith('note: Yuki Tsunoda scored a standings place'))).toBe(true);
  expect(messages.some(m => m.startsWith('note: Liam Lawson drove for RB F1 Team and Red Bull'))).toBe(true);
  expect(messages.some(m => m.startsWith('note: Alan Permane (Racing Bulls): principal entry still marked "verify"'))).toBe(true);
  expect(messages.some(m => m.startsWith('gap: Oscar Piastri: no photo on formula1.com'))).toBe(true);
});

test('a driver OpenF1 has but Jolpica does not is a mismatch', () => {
  const extra = { ...buildInputs().openf1[0], driver_number: 7, name_acronym: 'DOO', first_name: 'Jack', last_name: 'Doohan' };
  const { issues } = assemble(buildInputs({ openf1: [...buildInputs().openf1, extra] }));
  expect(issues.some(i => i.kind === 'mismatch' && i.message.includes('#7 Jack Doohan'))).toBe(true);
});

test('curated overrides win, merging nested objects; unknown ids are reported', () => {
  const { drivers, teams, issues } = assemble(
    buildInputs({ overrides: { teams: { rb: { colour: '#1634CC' } }, drivers: { norris: { career: { poles: 17 } }, nobody: { number: 99 } } } }),
  );
  expect(teams[1].colour).toBe('#1634CC');
  expect(drivers.find(d => d.id === 'norris')!.career).toMatchObject({ poles: 17, wins: 12 });
  expect(issues.some(i => i.message.includes('no driver "nobody"'))).toBe(true);
});

test('applyOverride replaces arrays and null rather than merging them', () => {
  expect(applyOverride({ a: [1, 2], b: { c: 1 } }, { a: [3], b: null })).toEqual({ a: [3], b: null });
});

test('image candidates use formula1.com folder names from OpenF1', () => {
  const { drivers, cars, logos } = imageCandidates(2026, latestRace, buildInputs().openf1);
  expect(drivers.get('lawson')).toBe('common/f1/2026/racingbulls/lialaw01/2026racingbullslialaw01right');
  expect(cars.get('rb')).toBe('common/f1/2026/racingbulls/2026racingbullscarright');
  expect(logos.get('rb')).toBe('common/f1/2026/racingbulls/2026racingbullslogowhite');
});
