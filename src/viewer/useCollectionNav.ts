import { useMemo } from 'react';
import type { ViewerItem } from './items';

export interface CollectionNav {
  index: number;
  current: ViewerItem | undefined;
  prev: ViewerItem | null;
  next: ViewerItem | null;
}

export function useCollectionNav(items: ViewerItem[], currentId: string): CollectionNav {
  return useMemo(() => {
    const index = items.findIndex(c => c.id === currentId);
    if (index === -1) return { index, current: undefined, prev: null, next: null };
    return { index, current: items[index], prev: items[index - 1] ?? null, next: items[index + 1] ?? null };
  }, [items, currentId]);
}
