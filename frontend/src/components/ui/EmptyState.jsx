import styles from "./EmptyState.module.css";

/** Icon, a sentence that explains, and — when there is one — the way forward. */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className={styles.empty}>
      {Icon && (
        <span className={styles.icon}>
          <Icon size={26} aria-hidden="true" />
        </span>
      )}
      <h3 className={styles.title}>{title}</h3>
      {body && <p className={styles.body}>{body}</p>}
      {action}
    </div>
  );
}
