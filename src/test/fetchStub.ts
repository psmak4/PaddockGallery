import { drivers, meta, teams } from './fixtures';

/** Serves the fixtures as the static /data files; anything else is a 404. */
export function stubDataFetch() {
  const files: Record<string, unknown> = { '/data/meta.json': meta, '/data/drivers.json': drivers, '/data/teams.json': teams };
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const body = files[String(input)];
    return body ? new Response(JSON.stringify(body)) : new Response('not found', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
