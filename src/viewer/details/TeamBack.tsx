import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Flag } from '../../cards/Flag';
import { formatDate, formatPoints, positionLabel } from '../../data/format';
import type { Driver, Team } from '../../data/types';
import { itemPath } from '../../routes/paths';
import { BackHeader, SeasonBox, StatGrid } from './Parts';
import styles from './CardBack.module.css';

/**
 * The back of a team's card: this season only. Its drivers (linked, each with their season), the team's
 * season results, how its drivers compare, and who runs the team.
 */
export function TeamBack({ team, drivers, season }: { team: Team; drivers: Driver[]; season: number }) {
  const s = team.season;
  return (
    <div className={styles.inner} style={{ '--tint': team.colour } as CSSProperties}>
      <BackHeader
        kicker={team.country ?? team.nationality}
        title={team.name}
        badge={team.countryCode && <Flag code={team.countryCode} label={team.country} className={styles.badgeFlag} />}
      />
      <div className={`${styles.scroll} ${styles.columns}`}>
        <div className={styles.col}>
          <SeasonBox season={season} standing={team.standing} />
          <section className={styles.section}>
            <h3 className={styles.k}>Drivers</h3>
            <ul className={styles.driverLinks}>
              {drivers.map(d => (
                <li key={d.id}>
                  <Link to={itemPath('drivers', d.id)} className={styles.driverCard}>
                    <span className={styles.driverRow}>
                      <span className={styles.driverNumber}>{d.number}</span>
                      <Flag code={d.countryCode} label={d.country} className={styles.inlineFlag} />
                      <b>
                        {d.givenName} {d.familyName}
                      </b>
                      <span className={styles.driverPoints}>
                        {positionLabel(d.standing.position)} · {formatPoints(d.standing.points)} pts
                      </span>
                      <span aria-hidden="true">→</span>
                    </span>
                    <dl className={styles.driverStats}>
                      {(
                        [
                          ['Wins', d.season.wins],
                          ['Podiums', d.season.podiums],
                          ['Poles', d.season.poles],
                          ['Best', positionLabel(d.season.bestFinish)],
                          ['DNFs', d.season.dnfs],
                        ] as const
                      ).map(([label, value]) => (
                        <span key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </span>
                      ))}
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className={styles.col}>
          <StatGrid
            title={`${season} season`}
            cells={[
              ['Races', s.races],
              ['Podiums', s.podiums],
              ['Poles', s.poles],
              ['1–2s', s.oneTwos],
              ['DNFs', s.dnfs],
            ]}
            note={s.fastestLaps ? `${s.fastestLaps} fastest ${s.fastestLaps === 1 ? 'lap' : 'laps'}` : null}
          />
          <HeadToHead team={team} drivers={drivers} />
          {team.principal && (
            <section className={styles.section}>
              <h3 className={styles.k}>Team principal</h3>
              <p className={styles.principal}>
                <Flag code={team.principal.countryCode} label={team.principal.country} className={styles.inlineFlag} />
                <b>{team.principal.name}</b>
                {team.principal.since && <span>{`since ${formatDate(team.principal.since)}`}</span>}
              </p>
            </section>
          )}
          {team.car && <p className={styles.credit}>Car image and logo: Formula 1</p>}
        </div>
      </div>
    </div>
  );
}

/** Which of the team's two drivers finished ahead, in the races they both started for it this season. */
function HeadToHead({ team, drivers }: { team: Team; drivers: Driver[] }) {
  const [a, b] = drivers;
  if (!a || !b) return null;
  const aWins = team.season.headToHead[a.id] ?? 0;
  const bWins = team.season.headToHead[b.id] ?? 0;
  if (aWins + bWins === 0) return null;
  return (
    <section className={styles.section}>
      <h3 className={styles.k}>Head-to-head · race finishes</h3>
      <div className={styles.h2h} aria-label={`${a.familyName} ${aWins}, ${b.familyName} ${bWins}`}>
        <span aria-hidden="true">
          {a.familyName} <b>{aWins}</b>
        </span>
        <span className={styles.h2hBar} aria-hidden="true">
          <i style={{ flexGrow: aWins }} />
          <i style={{ flexGrow: bWins }} />
        </span>
        <span aria-hidden="true">
          <b>{bWins}</b> {b.familyName}
        </span>
      </div>
    </section>
  );
}
