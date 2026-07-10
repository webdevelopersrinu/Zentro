import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

import { cx } from "../../lib/cx.js";
import styles from "./Button.module.css";

/**
 * The one button. Variants carry meaning, not decoration:
 *   primary   — the single most likely action on a screen
 *   secondary — an alternative, equal-weight action
 *   ghost     — low-emphasis, sits in toolbars and lists
 *   danger    — destructive, always paired with a confirmation
 *
 * `loading` disables the button and swaps in a spinner while keeping the label
 * rendered, so the layout never jumps mid-request.
 */
export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    startIcon,
    endIcon,
    disabled,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className={styles.spinner} size={16} aria-hidden="true" />
      ) : (
        startIcon
      )}
      <span className={styles.label}>{children}</span>
      {!loading && endIcon}
    </button>
  );
});
