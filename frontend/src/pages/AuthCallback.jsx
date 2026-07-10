import { Logo } from "../components/ui/Logo.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import styles from "./AuthCallback.module.css";

/**
 * Shown for the moment between the OAuth redirect landing and AuthProvider's
 * silent /auth/refresh resolving. There is no token to read from the URL — the
 * refresh cookie does the work — so this screen only has to not flash.
 */
export default function AuthCallback({ message = "Signing you in…" }) {
  return (
    <main className={styles.callback}>
      <Logo size={36} />
      <Spinner label={message} />
      <p className={styles.message}>{message}</p>
    </main>
  );
}
