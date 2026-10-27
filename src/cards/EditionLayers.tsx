import { EDITION_NAMES, type Edition } from './editions';
import styles from './Editions.module.css';

const FIELD: Record<Edition, string> = { gold: styles.goldField, carbon: styles.carbonField };
const SHEEN: Record<Edition, string> = { gold: styles.goldSheen, carbon: styles.carbonSheen };
const LABEL: Record<Edition, string> = { gold: styles.goldLabel, carbon: styles.carbonLabel };

/** The edition's field, in place of the team-colour background. */
export function EditionField({ edition }: { edition: Edition }) {
  return <div className={FIELD[edition]} aria-hidden="true" />;
}

/** The edition's sheen over everything, and its small label. */
export function EditionFinish({ edition }: { edition: Edition }) {
  return (
    <>
      <div className={SHEEN[edition]} aria-hidden="true" />
      <span className={`${styles.label} ${LABEL[edition]}`} title={`${EDITION_NAMES[edition]}: a rare edition of this card`} data-edition-label>
        {EDITION_NAMES[edition]}
      </span>
    </>
  );
}
