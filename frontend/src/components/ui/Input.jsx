import { forwardRef, useId } from "react";

import { cx } from "../../lib/cx.js";
import styles from "./Input.module.css";

/**
 * Native constraints (`required`, `maxLength`, `pattern`) are passed straight
 * through — the browser validates for free, with correct a11y. `error` is only
 * for what the browser cannot know: a server rejection, or an async lookup.
 */
export const Input = forwardRef(function Input(
  { label, hint, error, startIcon, endSlot, className, id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className={cx(styles.wrap, error && styles.invalid)}>
        {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {endSlot && <span className={styles.endSlot}>{endSlot}</span>}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
});
