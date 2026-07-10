import styles from "./TypingIndicator.module.css";

const phrase = (names) => {
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return `${names[0]} and ${names.length - 1} others are typing`;
};

/** Always occupies its row, even when empty, so the composer never jumps. */
export function TypingIndicator({ typists = [] }) {
  return (
    <div className={styles.indicator} aria-live="polite">
      {typists.length > 0 && (
        <>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {phrase(typists)}
        </>
      )}
    </div>
  );
}
