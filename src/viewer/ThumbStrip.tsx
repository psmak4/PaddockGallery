import { useLayoutEffect, useRef } from 'react';
import type { ViewerItem } from './items';
import styles from './ThumbStrip.module.css';

interface ThumbStripProps {
  items: ViewerItem[];
  index: number;
  onSelect: (item: ViewerItem, direction: 'forward' | 'back') => void;
}

export function ThumbStrip({ items, index, onSelect }: ThumbStripProps) {
  const currentRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    currentRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [index]);

  return (
    <nav className={styles.strip} aria-label="Cards in this collection">
      <ol className={styles.list}>
        {items.map((item, i) => {
          const isCurrent = i === index;
          return (
            <li key={item.id}>
              <button
                ref={isCurrent ? currentRef : undefined}
                type="button"
                className={`${styles.thumb} ${styles[item.orientation]} ${isCurrent ? styles.current : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={item.name}
                onClick={() => !isCurrent && onSelect(item, i > index ? 'forward' : 'back')}
              >
                {item.front(200)}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
