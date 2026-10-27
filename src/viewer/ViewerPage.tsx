import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { VIEWER_PHOTO_WIDTH } from '../data/images';
import { useGrid } from '../data/queries';
import type { CollectionKind } from '../data/types';
import { isInteractiveTarget, shouldIgnoreShortcut } from '../lib/keyboard';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { usePersistentToggle } from '../lib/usePersistentToggle';
import { runViewTransition } from '../lib/viewTransition';
import { homePath, isCollectionKind, itemPath } from '../routes/paths';
import { rememberLastViewed, type NavState } from '../routes/returnTargets';
import { Backdrop } from '../ui/Backdrop';
import { ErrorState, Loading, NotFound } from '../ui/StatusViews';
import { CardStage } from './CardStage';
import { viewerItems, type ViewerItem } from './items';
import { NavArrows } from './NavArrows';
import { ThumbStrip } from './ThumbStrip';
import { TopBar } from './TopBar';
import { useCollectionNav } from './useCollectionNav';
import { usePreloadNeighbors } from './usePreloadNeighbors';
import { useSwipe } from './useSwipe';
import styles from './ViewerPage.module.css';

const LABELS: Record<CollectionKind, string> = { drivers: 'Drivers', teams: 'Teams' };

export function ViewerPage() {
  const { kind, id = '' } = useParams();
  if (!isCollectionKind(kind)) {
    return <NotFound message="Page not found" backTo="/" backLabel="Back to PaddockGallery" />;
  }
  return <Viewer kind={kind} id={id} />;
}

type Direction = 'forward' | 'back';

function Viewer({ kind, id }: { kind: CollectionKind; id: string }) {
  const { data: grid, isPending, isError, refetch } = useGrid();
  const items = useMemo(() => (grid ? viewerItems(grid, kind) : []), [grid, kind]);
  const nav = useCollectionNav(items, id);
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as NavState | null;
  const [detailsOpen, setDetailsOpen] = usePersistentToggle('paddockgallery.detailsOpen', false);
  const stageRef = useRef<HTMLDivElement>(null);

  usePreloadNeighbors(items, nav.index);
  useDocumentTitle(nav.current?.name, LABELS[kind]);

  const currentId = nav.current?.id;
  useEffect(() => {
    if (currentId) rememberLastViewed(kind, currentId);
  }, [kind, currentId]);

  // The card most recently navigated to, even if that navigation hasn't committed yet. Guards
  // against a quick second key press re-targeting it (which would hold a transition open for nothing).
  const requestedId = useRef(id);
  useEffect(() => {
    requestedId.current = id;
  }, [id]);

  const goTo = useCallback(
    (item: ViewerItem, direction: Direction) => {
      if (item.id === requestedId.current) return;
      requestedId.current = item.id;
      // Replace, so Back leaves the viewer instead of stepping through every card; keep how we got here.
      const path = itemPath(kind, item.id);
      runViewTransition(() => navigate(path, { replace: true, state: navState }), { direction });
    },
    [kind, navigate, navState],
  );

  // Opened from the grid: the back pill steps back in history (keeping the grid's scroll position);
  // React Router replays the grid → viewer view transition in reverse.
  const onBack = navState?.fromGrid ? () => navigate(-1) : undefined;
  // Escape does exactly what the back pill does.
  const goBack = useCallback(() => {
    if (navState?.fromGrid) navigate(-1);
    else navigate(homePath(kind), { viewTransition: true });
  }, [navState, navigate, kind]);

  const goPrev = useCallback(() => nav.prev && goTo(nav.prev, 'back'), [nav.prev, goTo]);
  const goNext = useCallback(() => nav.next && goTo(nav.next, 'forward'), [nav.next, goTo]);
  const goFirst = useCallback(() => items[0] && goTo(items[0], 'back'), [items, goTo]);
  const goLast = useCallback(() => items.length > 0 && goTo(items[items.length - 1], 'forward'), [items, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Home') goFirst();
      else if (e.key === 'End') goLast();
      else if (e.key === 'Escape') goBack();
      else if (e.key === ' ' && !isInteractiveTarget(e.target)) {
        e.preventDefault(); // don't scroll the page
        setDetailsOpen(!detailsOpen);
      } else return;
      if (e.key !== ' ') e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, goFirst, goLast, goBack, detailsOpen, setDetailsOpen]);

  // Keyboard and screen-reader users land on the card itself when it appears (on arrival and on each new card).
  useEffect(() => {
    if (!currentId) return;
    const face = stageRef.current?.querySelector<HTMLElement>(
      detailsOpen ? 'button[aria-label="Show card"]' : 'button[aria-label^="Show details for"]',
    );
    face?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival and card change; flipping doesn't move focus
  }, [currentId]);

  useSwipe(stageRef, { onLeft: goNext, onRight: goPrev });

  if (isPending) {
    return (
      <div className={styles.viewer}>
        <Loading tone="dark" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className={styles.viewer}>
        <ErrorState tone="dark" onRetry={() => void refetch()} />
      </div>
    );
  }
  if (!nav.current) {
    return (
      <NotFound
        message={kind === 'drivers' ? 'Driver not found' : 'Team not found'}
        backTo={homePath(kind)}
        backLabel={`Back to ${LABELS[kind]}`}
      />
    );
  }

  return (
    <div className={styles.viewer}>
      <Backdrop colour={nav.current.colour} image={nav.current.image} tone="viewer" />
      <TopBar
        backTo={homePath(kind)}
        backLabel={LABELS[kind]}
        onBack={onBack}
      />
      <div className={styles.body}>
        <div className={styles.stage} ref={stageRef}>
          <NavArrows onPrev={goPrev} onNext={goNext} hasPrev={Boolean(nav.prev)} hasNext={Boolean(nav.next)} />
          <CardStage
            key={nav.current.id}
            name={nav.current.name}
            orientation={nav.current.orientation}
            front={nav.current.front(VIEWER_PHOTO_WIDTH, true)}
            back={nav.current.back}
            flipped={detailsOpen}
            onFlip={setDetailsOpen}
          />
        </div>
      </div>
      <div className={styles.strip}>
        <ThumbStrip items={items} index={nav.index} onSelect={goTo} />
      </div>
    </div>
  );
}
