import { ageOn, formatDate, formatLongDate, formatPoints, formatYears, positionLabel } from './format';

test('dates show as far as they are known', () => {
  expect(formatDate('2026-10-25')).toBe('25 Oct 2026');
  expect(formatDate('2025-07')).toBe('Jul 2025');
  expect(formatDate('2023')).toBe('2023');
  expect(formatDate(null)).toBe('');
});

test('age counts the birthday itself', () => {
  expect(ageOn('1999-11-13', new Date('2026-11-12T12:00:00Z'))).toBe(26);
  expect(ageOn('1999-11-13', new Date('2026-11-13T12:00:00Z'))).toBe(27);
});

test('positions, points and title years', () => {
  expect(positionLabel(1)).toBe('P1');
  expect(positionLabel(null)).toBe('–');
  expect(formatPoints(12.5)).toBe('12.5');
  expect(formatYears([2008, 2014, 2015, 2017, 2018, 2019, 2020])).toBe('2008, 2014, 2015, 2017–2020');
});

test("long dates spell out the month in the viewer's locale", () => {
  expect(formatLongDate('1999-11-13', 'en-US')).toBe('November 13, 1999');
  expect(formatLongDate('1999-11-13', 'en-GB')).toBe('13 November 1999');
  expect(formatLongDate('1999-11-13', 'fr-FR')).toBe('13 novembre 1999');
  // Never shifted a day by the time zone.
  expect(formatLongDate('2000-01-01', 'en-US')).toBe('January 1, 2000');
});
