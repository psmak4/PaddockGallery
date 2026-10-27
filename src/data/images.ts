// Image URLs. Driver portraits and car side views are formula1.com's own photos, hotlinked from its
// media CDN (Cloudinary) at the width we need; the data build only stores their paths.
// Imports use explicit .ts extensions so scripts/build-data.ts can run under Node's type stripping.

const F1_MEDIA = 'https://media.formula1.com/image/upload';

/** The viewer card is up to ~520px wide and the photo a little wider: enough for a 2x screen. */
export const VIEWER_PHOTO_WIDTH = 960;

/** A formula1.com media path (e.g. "common/f1/2026/mclaren/lannor01/2026mclarenlannor01right") at `width` px. */
export function f1ImageUrl(path: string, width: number): string {
  return `${F1_MEDIA}/c_fill,w_${width}/q_auto/v1740000001/${path}.webp`;
}

/** Country flags (flag-icons, MIT), copied into public/flags/ by the data build. */
export function flagUrl(countryCode: string): string {
  return `/flags/${countryCode}.svg`;
}
