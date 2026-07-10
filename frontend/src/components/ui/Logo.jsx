import { cx } from "../../lib/cx.js";
import styles from "./Logo.module.css";

/**
 * The Zentro mark, redrawn as inline SVG so it stays crisp at any size, inherits
 * currentColor, and costs no network request. The raster logo is kept only for
 * the favicon and the OG image.
 *
 * The glyph is a speech bubble whose tail sweeps up into a "Z".
 */
export function Logo({ size = 32, withWordmark = false, className }) {
  return (
    <span className={cx(styles.logo, className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-label="Zentro"
      >
        <path
          d="M32 12H18a10 10 0 0 0 0 20h5"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M27 22h6l-9 16"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="22" r="2" fill="currentColor" opacity="0.45" />
        <circle cx="26.5" cy="22" r="2" fill="currentColor" opacity="0.7" />
      </svg>
      {withWordmark && <span className={styles.wordmark}>Zentro</span>}
    </span>
  );
}
