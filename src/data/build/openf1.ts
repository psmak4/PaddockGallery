// OpenF1 (https://openf1.org): team colours, and a second opinion on who is on the grid.
// Its headshot URLs also tell us formula1.com's id for each driver ("lannor01"), which names their
// photo on formula1.com's media CDN.

export const OPENF1 = 'https://api.openf1.org/v1';

export interface OpenF1Driver {
  driver_number: number;
  name_acronym: string;
  first_name: string;
  last_name: string;
  team_name: string | null;
  team_colour: string | null;
  headshot_url: string | null;
  session_key: number;
}

/** formula1.com's driver id from an OpenF1 headshot URL: ".../LANNOR01_Lando_Norris/lannor01.png..." → "lannor01". */
export function f1DriverRef(headshotUrl: string | null): string | null {
  const match = headshotUrl?.match(/\/([a-z]{6}\d{2})\.png/i);
  return match ? match[1].toLowerCase() : null;
}

/** formula1.com's team folder name: "Red Bull Racing" → "redbullracing", "Haas F1 Team" → "haasf1team". */
export function f1TeamSlug(teamName: string): string {
  return teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** formula1.com media paths (no extension; see src/data/images.ts for the sized URL). */
export function driverPhotoPath(season: number, teamSlug: string, driverRef: string): string {
  return `common/f1/${season}/${teamSlug}/${driverRef}/${season}${teamSlug}${driverRef}right`;
}

export function carPath(season: number, teamSlug: string): string {
  return `common/f1/${season}/${teamSlug}/${season}${teamSlug}carright`;
}

/** A portrait's other official poses: "…right" → ["…left", "…front"]. */
export function alternatePhotoPaths(photoPath: string): string[] {
  const base = photoPath.replace(/right$/, '');
  return [`${base}left`, `${base}front`];
}

/** The car's other side: "…carright" → "…carleft". */
export function alternateCarPath(carPathRight: string): string {
  return carPathRight.replace(/carright$/, 'carleft');
}

/** The white version of the team's logo (formula1.com also has "logo" in colour and "logoblack"). */
export function logoPath(season: number, teamSlug: string): string {
  return `common/f1/${season}/${teamSlug}/${season}${teamSlug}logowhite`;
}

/** "f47600" → "#F47600"; anything that isn't six hex digits → null. */
export function normalizeColour(colour: string | null | undefined): string | null {
  const hex = colour?.trim().replace(/^#/, '');
  return hex && /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}
