import React, { useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useToast } from './Toast';
import { mockStore } from '../utils/mockStore';

export default function InviteModal({ isOpen, onClose, roomId, roomName, onInvite }) {
  const dialogRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [invitedMap, setInvitedMap] = useState({});
  const { addToast } = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setSearchQuery('');
        setResults([]);
        setInvitedMap({});
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

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const matching = mockStore.searchUsernames(searchQuery);
    
    // Find who is already a member
    const currentMembers = mockStore.getMembersForRoom(roomId).map(m => m.username);
    
    const preparedResults = matching.map(u => ({
      username: u.username,
      isMember: currentMembers.includes(u.username)
    }));

    setResults(preparedResults);
  }, [searchQuery, roomId, invitedMap]);

  const handleInvite = (username) => {
    const success = onInvite(username, roomId);
    if (success) {
      setInvitedMap(prev => ({ ...prev, [username]: true }));
      addToast(`Invited ${username} to #${roomName}`, 'success');
    } else {
      addToast(`Could not invite ${username}`, 'error');
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
        <h2>Invite to #{roomName}</h2>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>

      <div className="invite-body">
        <div className="form-group search-group">
          <span className="search-icon">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="search username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="modal-input search-input focus-ring"
            autoFocus
          />
        </div>

        <div className="results-list">
          {searchQuery && results.length === 0 && (
            <div className="no-results">No users found matching "{searchQuery}"</div>
          )}
          
          {!searchQuery && (
            <div className="search-tip">Type a username to search and invite them...</div>
          )}

          {results.map((user) => {
            const hasInvited = invitedMap[user.username] || user.isMember;
            return (
              <div key={user.username} className="user-row">
                <div className="user-info">
                  <div className="user-avatar-mini">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{user.username}</span>
                </div>

                {hasInvited ? (
                  <span className="invited-label">✓ Invited</span>
                ) : (
                  <button
                    className="btn-invite"
                    onClick={() => handleInvite(user.username)}
                  >
                    Invite
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .modal-dialog {
          border: none;
          background-color: var(--color-surface);
          color: var(--color-text-primary);
          padding: 24px;
          border-radius: var(--radius-card);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          max-width: 440px;
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

        .invite-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .search-group {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .search-input {
          padding-left: 36px;
          width: 100%;
        }

        .results-list {
          min-height: 180px;
          max-height: 280px;
          overflow-y: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-input);
          padding: 8px;
          background-color: rgba(15, 17, 23, 0.3);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .search-tip, .no-results {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 160px;
          color: var(--color-text-muted);
          text-align: center;
          font-size: 13px;
          padding: 16px;
        }

        .user-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          transition: background-color var(--transition-fast);
        }

        .user-row:hover {
          background-color: var(--color-surface-2);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar-mini {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--color-primary);
          color: var(--color-text-primary);
          font-weight: 600;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-name {
          font-weight: 500;
        }

        .btn-invite {
          background-color: var(--color-primary);
          border: none;
          color: var(--color-text-primary);
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .btn-invite:hover {
          background-color: var(--color-primary-hover);
        }

        .invited-label {
          color: var(--color-success);
          font-weight: 600;
          font-size: 12px;
          padding: 6px 12px;
        }
      `}</style>
    </dialog>
  );
}
