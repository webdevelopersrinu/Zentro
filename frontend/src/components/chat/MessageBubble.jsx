import { memo } from "react";

import { Avatar } from "../ui/Avatar.jsx";
import { cx } from "../../lib/cx.js";
import styles from "./MessageBubble.module.css";

const time = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * memo'd: a room with 100 messages re-renders all of them on every keystroke in
 * the composer otherwise.
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  mine,
  showAuthor,
  onRetry,
}) {
  const failed = message.status === "failed";

  return (
    <li className={cx(styles.row, mine && styles.rowMine)}>
      {!mine && (
        <span className={styles.gutter}>
          {showAuthor && <Avatar name={message.username} size={28} />}
        </span>
      )}

      <div className={styles.stack}>
        {showAuthor && !mine && <span className={styles.author}>{message.username}</span>}

        <div
          className={cx(
            styles.bubble,
            mine ? styles.mine : styles.theirs,
            message.status === "sending" && styles.sending,
            failed && styles.failed
          )}
        >
          {message.text}
        </div>

        <span className={styles.meta}>
          {failed ? (
            <button type="button" className={styles.retry} onClick={() => onRetry(message)}>
              Failed · Retry
            </button>
          ) : (
            <time dateTime={message.createdAt}>{time(message.createdAt)}</time>
          )}
        </span>
      </div>
    </li>
  );
});
