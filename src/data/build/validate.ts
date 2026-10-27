// Refuse to write data that would make a broken site; a failed build leaves the committed data alone.
import type { Driver, Team } from '../types.ts';
import type { Issue } from './assemble.ts';

export function assertSane({ drivers, teams }: { drivers: Driver[]; teams: Team[] }): void {
  const problems: string[] = [];
  if (teams.length < 8 || teams.length > 13) problems.push(`expected 8–13 teams, got ${teams.length}`);
  if (drivers.length < teams.length * 2 - 2 || drivers.length > teams.length * 2 + 2) {
    problems.push(`expected about two drivers per team, got ${drivers.length} for ${teams.length} teams`);
  }
  const teamIds = new Set(teams.map(t => t.id));
  for (const d of drivers) {
    if (!teamIds.has(d.teamId)) problems.push(`${d.id} drives for unknown team ${d.teamId}`);
  }
  for (const t of teams) {
    if (!/^#[0-9A-F]{6}$/i.test(t.colour)) problems.push(`${t.id} has an invalid colour "${t.colour}"`);
  }
  if (new Set(drivers.map(d => d.id)).size !== drivers.length) problems.push('duplicate driver ids');
  if (problems.length) throw new Error(`Data check failed:\n- ${problems.join('\n- ')}`);
}

const HEADINGS: Record<Issue['kind'], string> = {
  mismatch: 'Mismatches between sources',
  gap: 'Missing data (fill by hand in data/curated/)',
  note: 'Notes',
};

/** The build report (data/build-report.md): everything a person should look at after a refresh. */
export function formatReport(issues: Issue[], summary: string[]): string {
  const lines = ['# Data build report', '', ...summary.map(s => `- ${s}`)];
  for (const kind of ['mismatch', 'gap', 'note'] as const) {
    const items = issues.filter(i => i.kind === kind);
    lines.push('', `## ${HEADINGS[kind]} (${items.length})`, '');
    lines.push(...(items.length ? items.map(i => `- ${i.message}`) : ['None.']));
  }
  return `${lines.join('\n')}\n`;
}
