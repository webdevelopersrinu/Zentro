import { WifiOff } from "lucide-react";

import styles from "./ConnectionBanner.module.css";

/** Only shown while the socket is down; the composer is disabled alongside it. */
export function ConnectionBanner({ visible }) {
  if (!visible) return null;

  return (
    <div className={styles.banner} role="status">
      <WifiOff size={14} aria-hidden="true" />
      Reconnecting…
    </div>
  );
}
