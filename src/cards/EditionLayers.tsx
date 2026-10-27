import { EDITION_NAMES, type Edition } from './editions';
import styles from './Editions.module.css';

// Gold and Carbon replace the card's background and add a sheen; an Image Variation keeps the regular
// card and changes only its photo, so it has neither.
const FIELD: Partial<Record<Edition, string>> = { gold: styles.goldField, carbon: styles.carbonField };
const SHEEN: Partial<Record<Edition, string>> = { gold: styles.goldSheen, carbon: styles.carbonSheen };
const LABEL: Record<Edition, string> = { gold: styles.goldLabel, carbon: styles.carbonLabel, variation: styles.variationLabel };

/** Whether this edition replaces the team-colour background (otherwise the card keeps its own). */
export const hasField = (edition: Edition) => Boolean(FIELD[edition]);

/** The edition's field, in place of the team-colour background. */
export function EditionField({ edition }: { edition: Edition }) {
  return <div className={FIELD[edition]} aria-hidden="true" />;
}

/** The edition's sheen over everything (if it has one), and its small label. */
export function EditionFinish({ edition }: { edition: Edition }) {
  return (
    <>
      {SHEEN[edition] && <div className={SHEEN[edition]} aria-hidden="true" />}
      <span className={`${styles.label} ${LABEL[edition]}`} title={`${EDITION_NAMES[edition]}: a rare edition of this card`} data-edition-label>
        {EDITION_NAMES[edition]}
      </span>
    </>
  );
}
