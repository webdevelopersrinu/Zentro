import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from './Toast';

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }) {
  const dialogRef = useRef(null);
  const [roomName, setRoomName] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setRoomName('');
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Fallback for light-dismiss on browsers that don't support `closedby="any"`
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isInside) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      addToast('Room name cannot be empty', 'error');
      return;
    }
    const result = onCreateRoom(roomName);
    if (result && result.success) {
      addToast(`Room #${roomName} created successfully!`, 'success');
      onClose();
    } else if (result && result.error) {
      addToast(result.error, 'error');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      closedby="any"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-header">
        <h2>Create a new room</h2>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="room-name-input">Room name</label>
          <input
            id="room-name-input"
            type="text"
            placeholder="# study-group"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="modal-input focus-ring"
            autoFocus
          />
        </div>
        
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create
          </button>
        </div>
      </form>

      <style>{`
        .modal-dialog {
          border: none;
          background-color: var(--color-surface);
          color: var(--color-text-primary);
          padding: 24px;
          border-radius: var(--radius-card);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          max-width: 400px;
          width: 90%;
          margin: auto;
          box-sizing: border-box;
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 200ms ease, transform 200ms ease;
        }

        .modal-dialog[open] {
          opacity: 1;
          transform: scale(1);
        }

        /* Backdrop style (glassmorphism filter) */
        .modal-dialog::backdrop {
          background-color: rgba(15, 17, 23, 0.7);
          backdrop-filter: blur(4px);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          font-family: var(--font-logo);
          font-size: 20px;
          font-weight: 600;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .modal-close-btn:hover {
          color: var(--color-text-primary);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 500;
          color: var(--color-text-muted);
          font-size: 13px;
        }

        .modal-input {
          background-color: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-input);
          padding: 12px;
          font-size: 14px;
          color: var(--color-text-primary);
          transition: border-color var(--transition-fast);
        }

        .modal-input::placeholder {
          color: var(--color-text-muted);
        }

        .modal-input:focus {
          border-color: var(--color-primary);
          outline: none;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-primary {
          background-color: var(--color-primary);
          border: none;
          color: var(--color-text-primary);
          padding: 10px 20px;
          border-radius: var(--radius-input);
          font-weight: 600;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .btn-primary:hover {
          background-color: var(--color-primary-hover);
        }

        .btn-secondary {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          padding: 10px 20px;
          border-radius: var(--radius-input);
          font-weight: 600;
          cursor: pointer;
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }

        .btn-secondary:hover {
          color: var(--color-text-primary);
          border-color: var(--color-text-muted);
        }
      `}</style>
    </dialog>
  );
}
