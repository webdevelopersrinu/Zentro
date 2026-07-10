import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { IconButton } from "./IconButton.jsx";
import styles from "./Modal.module.css";

/**
 * Built on the native <dialog>, which gives us — for free and correctly —
 * a focus trap, Esc to close, the top layer, inert background, and focus
 * restored to the trigger on close. Hand-rolled modals get all of that wrong.
 */
export function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Esc fires `cancel`; the backdrop is a click on the dialog element itself.
  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
    >
      <header className={styles.header}>
        <h2 id="modal-title" className={styles.title}>
          {title}
        </h2>
        <IconButton label="Close" size="sm" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </header>

      <div className={styles.body}>{children}</div>

      {footer && <footer className={styles.footer}>{footer}</footer>}
    </dialog>
  );
}
