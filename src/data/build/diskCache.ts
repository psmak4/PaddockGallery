// Every API response the data build reads is kept on disk (.cache/http/), so re-running the build
// doesn't spend Jolpica's 500-requests-an-hour allowance on answers it already has.
//
// Each entry carries a tag saying what it is valid for:
//   'forever'         a finished season's results never change
//   'round:2026-18'   current-season data, good until the next race has results
//   'week:2026-43'    formula1.com image checks, refreshed weekly
// An entry is reused only while the build asks for the same tag. --refresh refetches everything
// except 'forever' entries.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const FOREVER = 'forever';

export interface CacheEntry<T = unknown> {
  url: string;
  tag: string;
  fetchedAt: string;
  body: T;
}

export function isFresh(entry: Pick<CacheEntry, 'tag'> | undefined, tag: string, refresh = false): boolean {
  if (!entry || entry.tag !== tag) return false;
  return tag === FOREVER || !refresh;
}

/** "week:2026-43": the ISO week of `date`, so weekly entries all expire together on Monday. */
export function weekTag(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // the Thursday of this week decides its year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `week:${d.getUTCFullYear()}-${String(week).padStart(2, '0')}`;
}

export class DiskCache {
  hits = 0;
  misses = 0;

  private readonly dir: string;
  private readonly refresh: boolean;

  constructor(dir: string, refresh = false) {
    this.dir = dir;
    this.refresh = refresh;
  }

  private pathFor(url: string): string {
    const host = new URL(url).hostname;
    return join(this.dir, host, `${createHash('sha1').update(url).digest('hex').slice(0, 20)}.json`);
  }

  private async read<T>(url: string): Promise<CacheEntry<T> | undefined> {
    try {
      return JSON.parse(await readFile(this.pathFor(url), 'utf8')) as CacheEntry<T>;
    } catch {
      return undefined;
    }
  }

  /** The cached body when it is fresh for `tag`; otherwise runs `load` and stores its result. */
  async through<T>(url: string, tag: string, load: () => Promise<T>): Promise<T> {
    const entry = await this.read<T>(url);
    if (entry && isFresh(entry, tag, this.refresh)) {
      this.hits++;
      return entry.body;
    }
    this.misses++;
    const body = await load();
    const path = this.pathFor(url);
    await mkdir(join(path, '..'), { recursive: true });
    const fresh: CacheEntry<T> = { url, tag, fetchedAt: new Date().toISOString(), body };
    await writeFile(path, JSON.stringify(fresh));
    return body;
  }
}
