import type { Driver } from './types';

export const fullName = (d: Pick<Driver, 'givenName' | 'familyName'>) => `${d.givenName} ${d.familyName}`;

export const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** "2026-10-25" → "25 Oct 2026"; partial dates ("2025-07", "2023") are shown as far as known. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!m) return String(y);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  return d ? `${d} ${month} ${y}` : `${month} ${y}`;
}

/** "1999-11-13" as a full date with the month spelled out, in `locale` (default: the browser's). */
export function formatLongDate(iso: string, locale?: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Whole years between a birth date and `on`. */
export function ageOn(dateOfBirth: string, on: Date): number {
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  const age = on.getUTCFullYear() - y;
  const hadBirthday = on.getUTCMonth() + 1 > m || (on.getUTCMonth() + 1 === m && on.getUTCDate() >= d);
  return hadBirthday ? age : age - 1;
}

/** "P1", or "–" before a first classification. */
export const positionLabel = (position: number | null) => (position ? `P${position}` : '–');

/** Points can be fractional (half points); show them without trailing zeros. */
export const formatPoints = (points: number) => points.toLocaleString('en-US', { maximumFractionDigits: 1 });

/** [2008, 2014, 2015] → "2008, 2014, 2015"; runs of 3+ collapse: [2014..2020] → "2014–2020". */
export function formatYears(years: number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < years.length; ) {
    let j = i;
    while (years[j + 1] === years[j] + 1) j++;
    parts.push(j - i >= 2 ? `${years[i]}–${years[j]}` : years.slice(i, j + 1).join(', '));
    i = j + 1;
  }
  return parts.join(', ');
}
