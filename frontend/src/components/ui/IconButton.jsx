import { forwardRef } from "react";

import { cx } from "../../lib/cx.js";
import styles from "./IconButton.module.css";

/**
 * An icon with no visible text, so `label` is mandatory — it becomes both the
 * accessible name and the tooltip. Without it the button is invisible to screen
 * readers.
 */
export const IconButton = forwardRef(function IconButton(
  { label, size = "md", variant = "ghost", className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cx(styles.iconButton, styles[size], styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
});
