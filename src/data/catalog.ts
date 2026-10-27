import type { Driver, Grid, Meta, Team } from './types';

export class HttpError extends Error {
  status: number;
  constructor(status: number, url: string) {
    super(`Request to ${url} failed with ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new HttpError(res.status, url);
  // A missing static file can come back as the SPA's index.html with a 200; treat that as not found.
  if (res.headers.get('content-type')?.includes('text/html')) throw new HttpError(404, url);
  return (await res.json()) as T;
}

/** The whole grid: three small static files (index.html starts fetching them before the app runs). */
export async function fetchGrid(): Promise<Grid> {
  const [meta, drivers, teams] = await Promise.all([
    fetchJson<Meta>('/data/meta.json'),
    fetchJson<Driver[]>('/data/drivers.json'),
    fetchJson<Team[]>('/data/teams.json'),
  ]);
  return { meta, drivers, teams };
}
