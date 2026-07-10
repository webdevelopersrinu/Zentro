import { cx } from "../../lib/cx.js";
import styles from "./Badge.module.css";

/** A pill for counts and labels. `tone` carries meaning: accent, muted, warning. */
export function Badge({ tone = "muted", className, children, ...props }) {
  return (
    <span className={cx(styles.badge, styles[tone], className)} {...props}>
      {children}
    </span>
  );
}

/** The unread indicator. Not colour-only — it is announced too. */
export function UnreadDot() {
  return <span className={styles.unread} role="status" aria-label="Unread messages" />;
}
