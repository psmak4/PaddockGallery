// HTTP for the data build: every request has a timeout (a stalled API must not hang the build) and
// gets a couple of retries for passing errors.
// Imports use explicit .ts extensions so scripts/build-data.ts can run under Node's type stripping.

const RETRY_DELAYS_MS = [1000, 3000];
const TIMEOUT_MS = 60_000;

/** Identifies the build to the APIs it reads. */
export const USER_AGENT = 'PaddockGallery-build/0.1 (https://github.com/psmak4/PaddockGallery)';

export async function withRetries<T>(label: string, run: () => Promise<T>, delays = RETRY_DELAYS_MS): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      const delay = delays[attempt];
      if (delay === undefined) throw err;
      console.warn(`retrying ${label} after error: ${(err as Error).message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export function fetchWithTimeout(url: string, init: RequestInit = {}, ms = TIMEOUT_MS): Promise<Response> {
  return fetch(url, { ...init, headers: { 'user-agent': USER_AGENT, ...init.headers }, signal: AbortSignal.timeout(ms) });
}

async function okResponse(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetchWithTimeout(url, init);
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res;
}

export function getJson<T>(url: string, headers?: Record<string, string>, delays = RETRY_DELAYS_MS): Promise<T> {
  return withRetries(url, async () => (await (await okResponse(url, { headers })).json()) as T, delays);
}

/** True when the URL answers 200 (a HEAD request); false on 404. Other failures throw after retries. */
export function urlExists(url: string): Promise<boolean> {
  return withRetries(url, async () => {
    const res = await fetchWithTimeout(url, { method: 'HEAD' });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return true;
  });
}
