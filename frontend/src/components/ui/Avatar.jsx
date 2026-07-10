import { useState } from "react";

import { cx } from "../../lib/cx.js";
import styles from "./Avatar.module.css";

/** Deterministic hue per user, so the same person is always the same colour. */
const hueOf = (seed = "") =>
  [...seed].reduce((hash, char) => char.charCodeAt(0) + hash * 31, 7) % 360;

const initialsOf = (name = "") =>
  name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();

/**
 * Falls back to coloured initials when there is no image, or when the provider's
 * CDN 404s — which Google's avatars do once a profile picture changes.
 */
export function Avatar({ src, name = "", size = 36, className }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cx(styles.avatar, className)}
      style={{ "--avatar-size": `${size}px`, "--avatar-hue": hueOf(name) }}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.initials}>{initialsOf(name)}</span>
      )}
    </span>
  );
}
