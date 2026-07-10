import { Loader2 } from "lucide-react";

import styles from "./Spinner.module.css";

/**
 * `label` is announced to screen readers; the icon itself is decorative.
 * `sr-only` stays a global utility — it is a document-level concern, not this
 * component's.
 */
export function Spinner({ size = 20, label = "Loading" }) {
  return (
    <span className={styles.spinner} role="status">
      <Loader2 size={size} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
