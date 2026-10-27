import { countryOf } from './countries';
import { FOREVER, isFresh, weekTag } from './diskCache';
import { carPath, f1DriverRef, f1TeamSlug, normalizeColour } from './openf1';
import { nextDelay } from './rateLimit';
import { assertSane, formatReport } from './validate';
import { assemble } from './assemble';
import { buildInputs } from '../../test/buildFixtures';

describe('disk cache freshness', () => {
  test('an entry is reused only for the same tag', () => {
    expect(isFresh({ tag: 'round:2026-18' }, 'round:2026-18')).toBe(true);
    expect(isFresh({ tag: 'round:2026-17' }, 'round:2026-18')).toBe(false);
    expect(isFresh(undefined, FOREVER)).toBe(false);
  });

  test('--refresh refetches everything except finished seasons', () => {
    expect(isFresh({ tag: 'round:2026-18' }, 'round:2026-18', true)).toBe(false);
    expect(isFresh({ tag: FOREVER }, FOREVER, true)).toBe(true);
  });

  test('week tags follow ISO weeks', () => {
    expect(weekTag(new Date('2026-10-27T12:00:00Z'))).toBe('week:2026-44');
    expect(weekTag(new Date('2027-01-01T12:00:00Z'))).toBe('week:2026-53');
  });
});

describe('rate limiting', () => {
  const limits = { minIntervalMs: 350, perHour: 3 };
  test('requests are spaced out', () => {
    expect(nextDelay([], 10_000, limits)).toBe(0);
    expect(nextDelay([9_900], 10_000, limits)).toBe(250);
  });
  test('a used-up hour waits for its oldest request to expire', () => {
    const now = 3_600_000;
    expect(nextDelay([1_000, 2_000, 3_000], now, limits)).toBe(1_000);
    // Requests older than an hour don't count.
    expect(nextDelay([0, 2_000, 3_000], now + 1, limits)).toBe(0);
  });
});

describe('OpenF1 helpers', () => {
  test('formula1.com ids and folder names', () => {
    expect(f1DriverRef('https://media.formula1.com/.../ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png')).toBe('andant01');
    expect(f1DriverRef(null)).toBeNull();
    expect(f1TeamSlug('Haas F1 Team')).toBe('haasf1team');
    expect(carPath(2026, 'astonmartin')).toBe('common/f1/2026/astonmartin/2026astonmartincarright');
  });
  test('colours', () => {
    expect(normalizeColour('f47600')).toBe('#F47600');
    expect(normalizeColour('#12345')).toBeNull();
    expect(normalizeColour(null)).toBeNull();
  });
});

test('nationalities map to flags', () => {
  expect(countryOf('Monegasque')).toEqual({ code: 'mc', country: 'Monaco' });
  expect(countryOf('New Zealander')?.code).toBe('nz');
  expect(countryOf('Martian')).toBeNull();
});

describe('validation and the report', () => {
  test('a sane grid passes; a broken one fails', () => {
    const out = assemble(buildInputs());
    expect(() => assertSane({ drivers: out.drivers, teams: [...out.teams, ...out.teams, ...out.teams, ...out.teams].map((t, i) => ({ ...t, id: `${t.id}${i}` })) })).toThrow(/two drivers per team/);
    expect(() => assertSane({ drivers: [], teams: [] })).toThrow(/8–13 teams/);
  });
  test('the report groups issues by kind', () => {
    const report = formatReport([{ kind: 'gap', message: 'No photo.' }], ['Season 2026.']);
    expect(report).toContain('## Missing data (fill by hand in data/curated/) (1)\n\n- No photo.');
    expect(report).toContain('## Mismatches between sources (0)\n\nNone.');
  });
});

describe('DiskCache', () => {
  test('stores answers on disk and reuses them for the same tag', async () => {
    const { mkdtemp } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { DiskCache } = await import('./diskCache');
    const dir = await mkdtemp(join(tmpdir(), 'pg-cache-'));
    const load = vi.fn(async () => ({ ok: 1 }));

    const first = new DiskCache(dir);
    expect(await first.through('https://api.example/a', 'round:2026-18', load)).toEqual({ ok: 1 });
    // A new run (new instance) reads it back from disk.
    const second = new DiskCache(dir);
    expect(await second.through('https://api.example/a', 'round:2026-18', load)).toEqual({ ok: 1 });
    expect(load).toHaveBeenCalledTimes(1);
    expect(second.hits).toBe(1);
    // The next race makes it stale.
    await second.through('https://api.example/a', 'round:2026-19', load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
