import { cx } from "../../lib/cx.js";
import styles from "./PresenceDot.module.css";

/**
 * Never colour-only: the state is also in the accessible name, so it survives
 * colour blindness and screen readers.
 */
export function PresenceDot({ online, className }) {
  const state = online ? "online" : "offline";

  return (
    <span
      className={cx(styles.dot, styles[state], className)}
      role="img"
      aria-label={state}
    />
  );
}
