import { useEffect } from 'react';
import { f1ImageUrl, VIEWER_PHOTO_WIDTH } from '../data/images';
import type { ViewerItem } from './items';

const OFFSETS = [1, -1, 2, -2];

/** Warm the browser cache with the nearest cards' photos so flipping between cards feels instant. */
export function usePreloadNeighbors(items: ViewerItem[], index: number): void {
  useEffect(() => {
    if (index < 0) return;
    for (const offset of OFFSETS) {
      const image = items[index + offset]?.image;
      if (image) new Image().src = f1ImageUrl(image, VIEWER_PHOTO_WIDTH);
    }
  }, [items, index]);
}
