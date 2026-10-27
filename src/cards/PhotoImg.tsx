import { useState } from 'react';
import { f1ImageUrl } from '../data/images';

/**
 * A formula1.com photo that removes itself if it fails to load (moved, renamed, offline), so the card
 * falls back to its photo-less design rather than showing a broken image.
 */
export function PhotoImg({ path, width, className, eager = false }: { path: string | null; width: number; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!path || failed) return null;
  return (
    <img
      className={className}
      src={f1ImageUrl(path, width)}
      alt=""
      loading={eager ? undefined : 'lazy'}
      decoding="async"
      data-testid="photo"
      onError={() => setFailed(true)}
    />
  );
}
