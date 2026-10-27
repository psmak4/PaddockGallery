import type { ReactNode } from 'react';
import { formatPoints, formatYears, positionLabel } from '../../data/format';
import type { CareerStats, Standing } from '../../data/types';
import styles from './CardBack.module.css';

/** The fixed header: a kicker line, the name, and something on the right (a number, a position). */
export function BackHeader({ kicker, title, badge }: { kicker: ReactNode; title: string; badge?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <span className={styles.kind}>{kicker}</span>
        <h2 className={styles.name}>{title}</h2>
      </div>
      {badge && <span className={styles.badge}>{badge}</span>}
    </header>
  );
}

/** This season so far: the box at the top of the back. */
export function SeasonBox({ season, standing }: { season: number; standing: Standing }) {
  return (
    <div className={styles.season}>
      <div>
        <span className={styles.k}>{season} standings</span>
        <span className={styles.big}>{positionLabel(standing.position)}</span>
      </div>
      <div className={styles.seasonSide}>
        <span>
          <b>{formatPoints(standing.points)}</b> pts
        </span>
        <span>
          <b>{standing.wins}</b> {standing.wins === 1 ? 'win' : 'wins'}
        </span>
      </div>
    </div>
  );
}

/** A titled row of big numbers: career totals, a season's results. */
export function StatGrid({ title, cells, note }: { title: string; cells: [string, ReactNode][]; note?: string | null }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.k}>{title}</h3>
      <dl className={styles.stats}>
        {cells.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{typeof value === 'number' ? value.toLocaleString('en-US') : value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className={styles.note}>{note}</p>}
    </section>
  );
}

export function CareerGrid({ career }: { career: CareerStats }) {
  return (
    <StatGrid
      title="Career"
      cells={[
        ['Races', career.starts],
        ['Wins', career.wins],
        ['Podiums', career.podiums],
        ['Poles', career.poles],
        ['Titles', career.titles],
      ]}
      note={career.titleYears.length > 0 ? `Champion ${formatYears(career.titleYears)}` : null}
    />
  );
}

/** Label/value rows: born, nationality, debut… Rows without a value are left out. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (!shown.length) return null;
  return (
    <dl className={styles.facts}>
      {shown.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
