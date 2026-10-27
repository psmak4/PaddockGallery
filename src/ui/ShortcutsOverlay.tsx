import { useEffect, useRef, useState } from 'react';
import { hasModifier, isTypingTarget } from '../lib/keyboard';
import styles from './ShortcutsOverlay.module.css';

const OPEN_EVENT = 'paddockgallery:show-shortcuts';

/** Opens the shortcuts panel from a button (the same panel "?" opens). */
export function showShortcuts(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const GROUPS: { title: string; items: [keys: string[], action: string][] }[] = [
  {
    title: 'Card viewer',
    items: [
      [['←', '→'], 'Previous / next card'],
      [['Home', 'End'], 'First / last card'],
      [['Space'], 'Flip the card'],
      [['Esc'], 'Back to the grid'],
    ],
  },
  { title: 'Anywhere', items: [[['?'], 'Show these shortcuts']] },
];

/** "?" shows a panel listing the keyboard shortcuts; Esc, the close button or a click outside hides it. */
export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Capture phase, so an open overlay gets Escape before any page shortcut does.
    const onKey = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
      } else if (!open && e.key === '?' && !hasModifier(e, { allowShift: true }) && !isTypingTarget(e.target)) {
        e.preventDefault();
        returnFocusTo.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
    };
    const onShow = () => {
      returnFocusTo.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener(OPEN_EVENT, onShow);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener(OPEN_EVENT, onShow);
    };
  }, [open]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else returnFocusTo.current?.focus?.({ preventScroll: true });
  }, [open]);

  if (!open) return null;
  return (
    <div className={styles.scrim} onClick={() => setOpen(false)}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={e => e.stopPropagation()}
      >
        <header className={styles.head}>
          <h2 id="shortcuts-title">Keyboard shortcuts</h2>
          <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {GROUPS.map(group => (
          <section key={group.title} className={styles.group}>
            <h3>{group.title}</h3>
            <dl>
              {group.items.map(([keys, action]) => (
                <div key={action} className={styles.row}>
                  <dt>
                    {keys.map(k => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </dt>
                  <dd>{action}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
