import { useEffect } from 'react';

const SITE = 'PaddockGallery';

/** Sets the browser tab title to the given parts followed by the site name. */
export function useDocumentTitle(...parts: (string | undefined)[]): void {
  const title = [...parts.filter(Boolean), SITE].join(' · ');
  useEffect(() => {
    document.title = title;
  }, [title]);
}
