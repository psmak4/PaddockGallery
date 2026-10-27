// PaddockGallery's own types: what the data build writes to public/data/ and what the app reads.
// Ids are Jolpica's (Ergast-compatible) driverId and constructorId.

export type CollectionKind = 'drivers' | 'teams';

/** Championship position this season, so far. */
export interface Standing {
  position: number | null;
  points: number;
  wins: number;
}

/** A driver's career totals across every Grand Prix (Jolpica). Poles count races started from grid slot 1. */
export interface CareerStats {
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  titles: number;
  /** Seasons a title was won, oldest first. */
  titleYears: number[];
  /** The first Grand Prix entered; null when unknown. */
  debut: { season: number; race: string } | null;
}

/** This season's Grand Prix results (sprints not included). Poles count starts from grid slot 1. */
export interface SeasonStats {
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  /** Best classified finish; null before a first classified finish. */
  bestFinish: number | null;
  /** Retired or not classified. */
  dnfs: number;
  fastestLaps: number;
}

/** A team's season, counted per car (a race counts once); plus how its current drivers compare. */
export interface TeamSeasonStats extends SeasonStats {
  oneTwos: number;
  /** Races both current drivers started for the team, by driver id: how many each finished ahead. */
  headToHead: Record<string, number>;
}

export interface Driver {
  id: string;
  /** Three-letter code, e.g. "NOR". */
  code: string;
  number: number | null;
  givenName: string;
  familyName: string;
  /** Racing nationality as Jolpica gives it, e.g. "British". */
  nationality: string;
  country: string | null;
  /** ISO 3166-1 alpha-2, lowercase (also the flag file name); null when unknown. */
  countryCode: string | null;
  dateOfBirth: string | null;
  teamId: string;
  standing: Standing;
  season: SeasonStats;
  career: CareerStats;
  /** formula1.com media path (no extension), sized at runtime by f1ImageUrl; null when there is none. */
  photo: string | null;
  /** The other official poses (left, holding the helmet; front), for the Image Variation edition. */
  altPhotos: string[];
}

/** From data/curated/principals.json (no API covers team principals). */
export interface Principal {
  name: string;
  /** When they took charge, as precise as known ("2023" or "2025-07"). */
  since: string | null;
  country: string | null;
  countryCode: string | null;
}

export interface Team {
  id: string;
  name: string;
  nationality: string;
  country: string | null;
  countryCode: string | null;
  /** Team colour, "#RRGGBB" (OpenF1, or a curated override). */
  colour: string;
  /** This season's race drivers, in standings order. */
  driverIds: string[];
  principal: Principal | null;
  standing: Standing;
  season: TeamSeasonStats;
  /** formula1.com media path of the car's side view; null when there is none. */
  car: string | null;
  /** The car's other side, for the Image Variation edition; null when there is none. */
  altCar: string | null;
  /** formula1.com media path of the team's logo (white, square); null when there is none. */
  logo: string | null;
}

export interface Meta {
  season: number;
  /** The latest round with results. */
  round: number;
  totalRounds: number;
  lastRace: { name: string; date: string };
}

/** Everything the app shows, joined: one fetch of each file, shared by every page. */
export interface Grid {
  meta: Meta;
  drivers: Driver[];
  teams: Team[];
}
