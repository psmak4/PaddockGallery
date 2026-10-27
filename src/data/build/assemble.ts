// Turns the raw API answers into PaddockGallery's drivers and teams. Pure: no I/O, so it is tested
// directly. Anything that doesn't line up between sources becomes an Issue for the build report.
import type { CareerStats, Driver, Meta, Principal, Standing, Team } from '../types.ts';
import { countryOf } from './countries.ts';
import type { CareerCounts, RawConstructor, RawConstructorStanding, RawDriverStanding, RawRace, RawResult } from './jolpica.ts';
import { alternateCarPath, alternatePhotoPaths, carPath, driverPhotoPath, f1DriverRef, f1TeamSlug, logoPath, normalizeColour, type OpenF1Driver } from './openf1.ts';
import { seasonStats } from './season.ts';

export type IssueKind = 'mismatch' | 'gap' | 'note';

export interface Issue {
  kind: IssueKind;
  message: string;
}

/** An entry in data/curated/principals.json, keyed by constructor id. */
export interface CuratedPrincipal {
  name: string;
  since?: string;
  /** A demonym, as Jolpica gives drivers' ("Italian"); mapped to a flag by countries.ts. */
  nationality?: string;
  verify?: boolean;
}

export interface Overrides {
  drivers?: Record<string, Record<string, unknown>>;
  teams?: Record<string, Record<string, unknown>>;
}

/** A finished season's drivers' champion. */
export interface Champion {
  season: number;
  driverId: string | null;
}

export interface BuildInputs {
  season: number;
  latest: RawRace;
  totalRounds: number;
  driverStandings: RawDriverStanding[];
  constructorStandings: RawConstructorStanding[];
  constructors: RawConstructor[];
  openf1: OpenF1Driver[];
  /** Each race driver's career counts, by driver id. */
  careers: Map<string, CareerCounts>;
  /** Finished seasons since the earliest debut on the grid. */
  champions: Champion[];
  /** This season's race results, merged by round (see mergeRacePages). */
  seasonResults: RawRace[];
  principals: Record<string, CuratedPrincipal>;
  overrides: Overrides;
  /** formula1.com media paths confirmed to exist (see imageCandidates). */
  existingImages: Set<string>;
}

export interface BuildOutput {
  meta: Meta;
  drivers: Driver[];
  teams: Team[];
  issues: Issue[];
}

const num = (s: string | undefined) => (s === undefined || s === '' || Number.isNaN(Number(s)) ? null : Number(s));

/** Each race driver's OpenF1 record, matched by race number, then by three-letter code. */
export function matchOpenF1(results: RawResult[], openf1: OpenF1Driver[]): Map<string, OpenF1Driver> {
  const out = new Map<string, OpenF1Driver>();
  for (const r of results) {
    const match =
      openf1.find(o => o.driver_number === Number(r.number)) ?? openf1.find(o => o.name_acronym === r.Driver.code);
    if (match) out.set(r.Driver.driverId, match);
  }
  return out;
}

/** OpenF1's team name for each constructor: the team most of its race drivers are listed under. */
export function teamNames(results: RawResult[], matched: Map<string, OpenF1Driver>): Map<string, string> {
  const votes = new Map<string, Map<string, number>>();
  for (const r of results) {
    const name = matched.get(r.Driver.driverId)?.team_name;
    if (!name) continue;
    const forTeam = votes.get(r.Constructor.constructorId) ?? new Map<string, number>();
    forTeam.set(name, (forTeam.get(name) ?? 0) + 1);
    votes.set(r.Constructor.constructorId, forTeam);
  }
  return new Map([...votes].map(([id, names]) => [id, [...names].sort((a, b) => b[1] - a[1])[0][0]]));
}

/** The formula1.com images the build should check exist: each driver's portraits, each team's car (both sides) and logo. */
export function imageCandidates(season: number, latest: RawRace, openf1: OpenF1Driver[]) {
  const results = latest.Results ?? [];
  const matched = matchOpenF1(results, openf1);
  const names = teamNames(results, matched);
  const drivers = new Map<string, string>();
  for (const r of results) {
    const o = matched.get(r.Driver.driverId);
    const ref = f1DriverRef(o?.headshot_url ?? null);
    if (o?.team_name && ref) drivers.set(r.Driver.driverId, driverPhotoPath(season, f1TeamSlug(o.team_name), ref));
  }
  const cars = new Map([...names].map(([id, name]) => [id, carPath(season, f1TeamSlug(name))]));
  const logos = new Map([...names].map(([id, name]) => [id, logoPath(season, f1TeamSlug(name))]));
  const altPhotos = new Map([...drivers].map(([id, path]) => [id, alternatePhotoPaths(path)]));
  const altCars = new Map([...cars].map(([id, path]) => [id, alternateCarPath(path)]));
  return { drivers, cars, logos, altPhotos, altCars };
}

function career(counts: CareerCounts | undefined, titleYears: number[]): CareerStats {
  if (!counts) return { starts: 0, wins: 0, podiums: 0, poles: 0, titles: titleYears.length, titleYears, debut: null };
  const first = counts.starts.first;
  return {
    starts: counts.starts.total,
    wins: counts.wins,
    podiums: counts.wins + counts.seconds + counts.thirds,
    poles: counts.poles,
    titles: titleYears.length,
    titleYears,
    debut: first ? { season: Number(first.season), race: first.raceName } : null,
  };
}

function standing(s: { position?: string; points: string; wins: string } | undefined): Standing {
  return { position: num(s?.position), points: Number(s?.points ?? 0), wins: Number(s?.wins ?? 0) };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Nested objects merge; everything else (arrays, null, strings) replaces. */
export function applyOverride<T extends object>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = isObject(value) && isObject(out[key]) ? applyOverride(out[key] as object, value) : value;
  }
  return out as T;
}

export function assemble(input: BuildInputs): BuildOutput {
  const issues: Issue[] = [];
  const issue = (kind: IssueKind, message: string) => issues.push({ kind, message });
  const results = input.latest.Results ?? [];
  const matched = matchOpenF1(results, input.openf1);
  const names = teamNames(results, matched);
  const images = imageCandidates(input.season, input.latest, input.openf1);
  const exists = (path: string | undefined) => (path && input.existingImages.has(path) ? path : null);

  // ---------- cross-check the grid against OpenF1 ----------
  for (const r of results) {
    const o = matched.get(r.Driver.driverId);
    const who = `${r.Driver.givenName} ${r.Driver.familyName}`;
    if (!o) {
      issue('mismatch', `${who} (#${r.number}) raced in ${input.latest.raceName} but isn't in OpenF1's latest session.`);
      continue;
    }
    if (o.driver_number !== Number(r.number)) {
      issue('mismatch', `${who}: Jolpica has #${r.number}, OpenF1 has #${o.driver_number}.`);
    }
    if (r.Driver.code && o.name_acronym !== r.Driver.code) {
      issue('mismatch', `${who}: Jolpica's code is ${r.Driver.code}, OpenF1's is ${o.name_acronym}.`);
    }
    const team = names.get(r.Constructor.constructorId);
    if (o.team_name && team && o.team_name !== team) {
      issue('mismatch', `${who}: Jolpica has ${r.Constructor.name}, OpenF1 lists ${o.team_name}.`);
    }
  }
  const matchedNumbers = new Set([...matched.values()].map(o => o.driver_number));
  for (const o of input.openf1) {
    if (!matchedNumbers.has(o.driver_number)) {
      issue('mismatch', `OpenF1 lists #${o.driver_number} ${o.first_name} ${o.last_name} (${o.team_name}), who isn't in Jolpica's latest race.`);
    }
  }
  const racing = new Set(results.map(r => r.Driver.driverId));
  for (const s of input.driverStandings) {
    if (!racing.has(s.Driver.driverId)) {
      issue('note', `${s.Driver.givenName} ${s.Driver.familyName} scored a standings place this season (${s.Constructors.map(c => c.name).join(', ')}) but didn't race in ${input.latest.raceName}, so isn't on the grid.`);
    } else if (s.Constructors.length > 1) {
      issue('note', `${s.Driver.givenName} ${s.Driver.familyName} drove for ${s.Constructors.map(c => c.name).join(' and ')} this season; shown with their latest team.`);
    }
  }

  // ---------- this season ----------
  const lineups = new Map<string, string[]>();
  for (const r of results) lineups.set(r.Constructor.constructorId, [...(lineups.get(r.Constructor.constructorId) ?? []), r.Driver.driverId]);
  const season = seasonStats(input.seasonResults, lineups);
  const noSeason = { races: 0, wins: 0, podiums: 0, poles: 0, bestFinish: null, dnfs: 0, fastestLaps: 0 };

  // ---------- titles ----------
  const driverTitles = new Map<string, number[]>();
  for (const c of [...input.champions].sort((a, b) => a.season - b.season)) {
    if (c.driverId) driverTitles.set(c.driverId, [...(driverTitles.get(c.driverId) ?? []), c.season]);
  }

  // ---------- teams ----------
  const constructorById = new Map(input.constructors.map(c => [c.constructorId, c]));
  const teamStandingById = new Map(input.constructorStandings.map(s => [s.Constructor.constructorId, s]));
  const driverStandingById = new Map(input.driverStandings.map(s => [s.Driver.driverId, s]));
  const teamIds = [...new Set(results.map(r => r.Constructor.constructorId))];

  let teams: Team[] = teamIds.map(id => {
    const raw = constructorById.get(id) ?? results.find(r => r.Constructor.constructorId === id)!.Constructor;
    const name = names.get(id) ?? raw.name;
    const colourFromOpenF1 = normalizeColour(results.map(r => (r.Constructor.constructorId === id ? matched.get(r.Driver.driverId)?.team_colour : null)).find(Boolean));
    if (!colourFromOpenF1) issue('gap', `${name}: no team colour from OpenF1; using grey.`);
    const country = countryOf(raw.nationality);
    if (!country) issue('gap', `${name}: unknown nationality "${raw.nationality}" (add it to src/data/build/countries.ts).`);
    const car = exists(images.cars.get(id));
    if (!car) issue('gap', `${name}: no car image on formula1.com (${images.cars.get(id) ?? 'no OpenF1 team name'}).`);
    const logo = exists(images.logos.get(id));
    if (!logo) issue('gap', `${name}: no logo on formula1.com (${images.logos.get(id) ?? 'no OpenF1 team name'}).`);

    const curated = input.principals[id];
    let principal: Principal | null = null;
    if (!curated) {
      issue('gap', `${name}: no team principal in data/curated/principals.json.`);
    } else {
      if (curated.verify) issue('note', `${curated.name} (${name}): principal entry still marked "verify" in data/curated/principals.json.`);
      const pCountry = countryOf(curated.nationality);
      if (!pCountry) issue('gap', `${curated.name}: no known "nationality" in principals.json (e.g. "British"; see countries.ts).`);
      principal = { name: curated.name, since: curated.since ?? null, country: pCountry?.country ?? null, countryCode: pCountry?.code ?? null };
    }

    const driverIds = results
      .filter(r => r.Constructor.constructorId === id)
      .map(r => r.Driver.driverId)
      .sort((a, b) => (num(driverStandingById.get(a)?.position) ?? 99) - (num(driverStandingById.get(b)?.position) ?? 99));

    return {
      id,
      name,
      nationality: raw.nationality ?? '',
      country: country?.country ?? null,
      countryCode: country?.code ?? null,
      colour: colourFromOpenF1 ?? '#888888',
      driverIds,
      principal,
      standing: standing(teamStandingById.get(id)),
      season: season.teams.get(id) ?? { ...noSeason, oneTwos: 0, headToHead: Object.fromEntries(driverIds.map(d => [d, 0])) },
      car,
      altCar: car ? exists(images.altCars.get(id)) : null,
      logo,
    };
  });

  // ---------- drivers ----------
  let drivers: Driver[] = results.map(r => {
    const d = r.Driver;
    const who = `${d.givenName} ${d.familyName}`;
    const country = countryOf(d.nationality);
    if (!country) issue('gap', `${who}: unknown nationality "${d.nationality}" (add it to src/data/build/countries.ts).`);
    const photo = exists(images.drivers.get(d.driverId));
    if (!photo) issue('gap', `${who}: no photo on formula1.com (${images.drivers.get(d.driverId) ?? 'no OpenF1 headshot'}).`);
    if (!input.careers.has(d.driverId)) issue('gap', `${who}: no career stats.`);
    return {
      id: d.driverId,
      code: d.code ?? matched.get(d.driverId)?.name_acronym ?? d.familyName.slice(0, 3).toUpperCase(),
      number: num(r.number),
      givenName: d.givenName,
      familyName: d.familyName,
      nationality: d.nationality ?? '',
      country: country?.country ?? null,
      countryCode: country?.code ?? null,
      dateOfBirth: d.dateOfBirth ?? null,
      teamId: r.Constructor.constructorId,
      standing: standing(driverStandingById.get(d.driverId)),
      season: season.drivers.get(d.driverId) ?? noSeason,
      career: career(input.careers.get(d.driverId), driverTitles.get(d.driverId) ?? []),
      photo,
      altPhotos: photo ? (images.altPhotos.get(d.driverId) ?? []).filter(path => input.existingImages.has(path)) : [],
    };
  });

  // ---------- curated overrides, then display order ----------
  const overrideAll = <T extends { id: string }>(items: T[], patches: Record<string, Record<string, unknown>> = {}, label: string) => {
    for (const id of Object.keys(patches)) {
      if (!items.some(item => item.id === id)) issue('note', `overrides.json: no ${label} "${id}" on this season's grid; ignored.`);
    }
    return items.map(item => (patches[item.id] ? applyOverride(item, patches[item.id]) : item));
  };
  teams = overrideAll(teams, input.overrides.teams, 'team');
  drivers = overrideAll(drivers, input.overrides.drivers, 'driver');

  teams.sort((a, b) => (a.standing.position ?? 99) - (b.standing.position ?? 99) || a.name.localeCompare(b.name));
  const teamOrder = new Map(teams.map((t, i) => [t.id, i]));
  drivers.sort(
    (a, b) =>
      (teamOrder.get(a.teamId) ?? 99) - (teamOrder.get(b.teamId) ?? 99) ||
      (a.standing.position ?? 99) - (b.standing.position ?? 99),
  );

  const meta: Meta = {
    season: input.season,
    round: Number(input.latest.round),
    totalRounds: input.totalRounds,
    lastRace: { name: input.latest.raceName, date: input.latest.date },
  };
  return { meta, drivers, teams, issues };
}
