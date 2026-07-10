/**
 * Joins class names, dropping anything falsy. Lets a component write
 *
 *   cx(styles.button, styles[variant], loading && styles.loading, className)
 *
 * without a ternary per class or a `clsx` dependency.
 */
export const cx = (...values) => values.flat().filter(Boolean).join(" ");
