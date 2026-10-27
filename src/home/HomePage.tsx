import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import { formatDate, plural } from '../data/format';
import { useGrid } from '../data/queries';
import type { CollectionKind } from '../data/types';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { clearLastViewed, isOutOfView, peekLastViewed } from '../routes/returnTargets';
import { Backdrop } from '../ui/Backdrop';
import { ErrorState, Loading } from '../ui/StatusViews';
import { DriversGrid } from './DriversGrid';
import { TeamsGrid } from './TeamsGrid';
import styles from './HomePage.module.css';

const TITLES: Record<CollectionKind, string> = { drivers: 'Drivers', teams: 'Teams' };

export function HomePage({ kind }: { kind: CollectionKind }) {
  useDocumentTitle(kind === 'drivers' ? undefined : TITLES[kind]);
  const { data: grid, isPending, isError, refetch } = useGrid();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Coming back from the viewer (back pill or browser Back): the last card viewed is named at render
  // time (so the transition's "after" snapshot has it) and scrolled into view, so it shrinks back into its spot.
  const heroId = useMemo(
    () => peekLastViewed(kind),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- location.key: re-read on every navigation to this page
    [kind, location.key],
  );
  useEffect(() => {
    if (heroId) clearLastViewed(kind);
  }, [kind, heroId]);

  useLayoutEffect(() => {
    if (!grid || !heroId || !mainRef.current) return;
    const target = [...mainRef.current.querySelectorAll<HTMLElement>('[data-card-id]')].find(el => el.dataset.cardId === heroId);
    if (target && isOutOfView(target)) target.scrollIntoView({ block: 'center' });
    // Keyboard and screen-reader users continue from the card they were viewing.
    target?.closest('a')?.focus({ preventScroll: true });
  }, [grid, heroId]);

  const leader = grid ? (kind === 'drivers' ? grid.drivers.find(d => d.standing.position === 1) : undefined) : undefined;
  const leadTeam = grid?.teams[0];

  return (
    <div className={styles.root}>
      <Backdrop colour={leader ? grid?.teamById.get(leader.teamId)?.colour : leadTeam?.colour} image={leader ? leader.photo : leadTeam?.car} />
      <div className={styles.page}>
        <div className={styles.title}>
          <h1>{TITLES[kind]}</h1>
          <p>
            {grid &&
              (kind === 'drivers'
                ? `${plural(grid.drivers.length, 'driver', 'drivers')} across ${plural(grid.teams.length, 'team', 'teams')}`
                : `The ${plural(grid.teams.length, 'team', 'teams')} of ${grid.meta.season}`)}
            {grid && (
              <span className={styles.asOf}>
                <span className={styles.sep}> · </span>
                {`Standings after round ${grid.meta.round} of ${grid.meta.totalRounds}, ${grid.meta.lastRace.name} (${formatDate(grid.meta.lastRace.date)})`}
              </span>
            )}
          </p>
        </div>
        <main ref={mainRef}>
          {isPending && <Loading />}
          {isError && <ErrorState onRetry={() => void refetch()} />}
          {grid && kind === 'drivers' && <DriversGrid grid={grid} heroId={heroId} />}
          {grid && kind === 'teams' && <TeamsGrid grid={grid} heroId={heroId} />}
        </main>
      </div>
    </div>
  );
}
