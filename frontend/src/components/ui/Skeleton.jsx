import { cx } from "../../lib/cx.js";
import styles from "./Skeleton.module.css";

/**
 * Skeletons rather than spinners for lists: they preserve layout, so nothing
 * shifts when the data lands, and they read as faster.
 */
export function Skeleton({ width, height = 14, radius, className }) {
  return (
    <span
      className={cx(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonList({ count = 5, className }) {
  return (
    <div className={cx(styles.list, className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={38} radius="var(--radius-md)" />
      ))}
    </div>
  );
}
