/** Runs `task` over `items`, at most `limit` at a time (be polite to the APIs we read). */
export async function mapLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await task(items[i]);
      }
    }),
  );
  return results;
}
