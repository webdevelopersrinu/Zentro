import { useState } from "react";
import { Globe, Lock } from "lucide-react";

import { Modal } from "../ui/Modal.jsx";
import { Input } from "../ui/Input.jsx";
import { Button } from "../ui/Button.jsx";
import { cx } from "../../lib/cx.js";
import { ROOM_VISIBILITY } from "../../config/index.js";
import styles from "./CreateRoomModal.module.css";

const OPTIONS = [
  { value: ROOM_VISIBILITY.PUBLIC, icon: Globe, title: "Public", body: "Anyone can join" },
  { value: ROOM_VISIBILITY.PRIVATE, icon: Lock, title: "Private", body: "You approve requests" },
];

/**
 * Validation is native: `required` and `maxLength` on the name, `required` on
 * the radio group. The browser blocks submit and announces the error for free.
 * Only the server's rejection needs `error` state.
 */
export function CreateRoomModal({ open, onClose, onCreate, submitting, error }) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState(ROOM_VISIBILITY.PUBLIC);

  const close = () => {
    setName("");
    setVisibility(ROOM_VISIBILITY.PUBLIC);
    onClose();
  };

  const submit = (event) => {
    event.preventDefault();
    onCreate({ name: name.trim(), visibility }, close);
  };

  return (
    <Modal open={open} onClose={close} title="Create a room">
      <form className={styles.form} onSubmit={submit}>
        <Input
          label="Room name"
          placeholder="study-group"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={40}
          autoFocus
          error={error}
          hint={`${name.length}/40`}
        />

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Who can join?</legend>
          <div className={styles.options}>
            {OPTIONS.map(({ value, icon: Icon, title, body }) => (
              <label
                key={value}
                className={cx(styles.option, visibility === value && styles.selected)}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  checked={visibility === value}
                  onChange={() => setVisibility(value)}
                  className="sr-only"
                  required
                />
                <Icon size={18} aria-hidden="true" />
                <strong>{title}</strong>
                <span>{body}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <footer className={styles.actions}>
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={!name.trim()}>
            Create
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
