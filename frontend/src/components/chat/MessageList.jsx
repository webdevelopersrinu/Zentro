import { Fragment } from "react";
import { ArrowDown, MessageSquare } from "lucide-react";

import { MessageBubble } from "./MessageBubble.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";
import { useStickyScroll } from "../../hooks/useStickyScroll.js";
import styles from "./MessageList.module.css";

const dayOf = (iso) => new Date(iso).toDateString();

const dayLabel = (iso) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const day = dayOf(iso);

  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export function MessageList({ roomId, messages = [], loading, currentUsername, onRetry }) {
  const { containerRef, handleScroll, missed, scrollToBottom } = useStickyScroll(
    roomId,
    messages.length
  );

  if (loading) {
    return (
      <div className={styles.list}>
        {[60, 40, 70].map((width, index) => (
          <Skeleton key={index} width={`${width}%`} height={44} radius="var(--radius-xl)" />
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className={styles.list}>
        <EmptyState icon={MessageSquare} title="No messages yet" body="Say hello 👋" />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <ol
        ref={containerRef}
        className={styles.list}
        onScroll={handleScroll}
        aria-live="polite"
        aria-label="Messages"
      >
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const newDay = !previous || dayOf(previous.createdAt) !== dayOf(message.createdAt);

          return (
            // Keyed by the server id, never the array index: an optimistic
            // message is removed from the middle when its ack arrives.
            <Fragment key={message.id}>
              {newDay && (
                <li className={styles.divider}>
                  <span>{dayLabel(message.createdAt)}</span>
                </li>
              )}
              <MessageBubble
                message={message}
                mine={message.username === currentUsername}
                showAuthor={newDay || previous?.username !== message.username}
                onRetry={onRetry}
              />
            </Fragment>
          );
        })}
      </ol>

      {missed > 0 && (
        <button type="button" className={styles.pill} onClick={() => scrollToBottom()}>
          <ArrowDown size={14} />
          {missed} new {missed === 1 ? "message" : "messages"}
        </button>
      )}
    </div>
  );
}
