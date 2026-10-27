// Jolpica allows 4 requests a second and 500 an hour. The build spaces its requests out and keeps a
// log of the last hour's requests on disk, so back-to-back runs share one budget.
import { readFile, writeFile } from 'node:fs/promises';

const HOUR_MS = 60 * 60 * 1000;

export interface RateLimits {
  /** Smallest gap between two requests. */
  minIntervalMs: number;
  /** At most this many requests in any rolling hour (kept a little under the API's own limit). */
  perHour: number;
}

// One a second: Jolpica answers 429 to short bursts well under its published 4 a second.
export const JOLPICA_LIMITS: RateLimits = { minIntervalMs: 1000, perHour: 450 };

/** Backing off after a 429 or a passing error: Jolpica's limit resets within a minute. */
export const JOLPICA_RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000];

/** How long to wait before the next request, given the times of earlier ones (oldest first). */
export function nextDelay(sentAt: number[], now: number, limits: RateLimits): number {
  const recent = sentAt.filter(t => t > now - HOUR_MS);
  const last = recent[recent.length - 1];
  const spacing = last === undefined ? 0 : Math.max(0, last + limits.minIntervalMs - now);
  if (recent.length < limits.perHour) return spacing;
  // The hour is used up: wait until its oldest request drops out of the window.
  const oldest = recent[recent.length - limits.perHour];
  return Math.max(spacing, oldest + HOUR_MS - now);
}

export class RateLimiter {
  private sentAt: number[] = [];
  private readonly limits: RateLimits;
  private readonly logFile: string | undefined;

  constructor(limits: RateLimits, logFile?: string) {
    this.limits = limits;
    this.logFile = logFile;
  }

  async load(): Promise<void> {
    if (!this.logFile) return;
    try {
      const saved = JSON.parse(await readFile(this.logFile, 'utf8')) as number[];
      this.sentAt = saved.filter(t => t > Date.now() - HOUR_MS);
    } catch {
      this.sentAt = [];
    }
  }

  /** Requests sent in the last hour (this run and earlier ones). */
  get usedThisHour(): number {
    return this.sentAt.filter(t => t > Date.now() - HOUR_MS).length;
  }

  /** Waits until a request may be sent, then records it. */
  async take(): Promise<void> {
    const delay = nextDelay(this.sentAt, Date.now(), this.limits);
    if (delay > 5_000) console.log(`Jolpica hourly budget used up: waiting ${Math.ceil(delay / 60_000)} min…`);
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    this.sentAt.push(Date.now());
    this.sentAt = this.sentAt.filter(t => t > Date.now() - HOUR_MS);
    if (this.logFile) await writeFile(this.logFile, JSON.stringify(this.sentAt));
  }
}
