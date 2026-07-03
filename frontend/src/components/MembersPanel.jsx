import React from 'react';
import { UserPlus, X } from 'lucide-react';

export default function MembersPanel({
  members,
  currentUser,
  onInviteClick,
  mobileOpen,
  onMobileClose
}) {
  return (
    <aside className={`members-panel ${mobileOpen ? 'members-mobile-open' : ''}`}>
      {/* Mobile close backdrop */}
      {mobileOpen && <div className="members-backdrop" onClick={onMobileClose} />}

      <div className="members-container">
        <div className="members-header">
          <h3>In this room</h3>
          {mobileOpen && (
            <button className="mobile-close-btn" onClick={onMobileClose} aria-label="Close members list">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="members-list">
          {members.map((member) => {
            const isMe = member.username === currentUser;
            return (
              <div key={member.username} className="member-item">
                <span className={`status-dot ${member.online ? 'status-online' : 'status-offline'}`} />
                <span className="member-name">
                  {member.username} {isMe && <span className="you-tag">(you)</span>}
                </span>
              </div>
            );
          })}
        </div>

        <button className="btn-invite-trigger focus-ring" onClick={onInviteClick}>
          <UserPlus size={16} /> Invite people
        </button>
      </div>

      <style>{`
        .members-panel {
          width: var(--members-width);
          background-color: var(--color-surface);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100%;
          flex-shrink: 0;
          z-index: 90;
        }

        .members-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 16px;
        }

        .members-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          height: 32px;
        }

        .members-header h3 {
          font-family: var(--font-logo);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .mobile-close-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .mobile-close-btn:hover {
          color: var(--color-text-primary);
        }

        .members-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 6px;
          border-radius: 8px;
          color: var(--color-text-primary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-online {
          background-color: var(--color-success);
        }

        .status-offline {
          background-color: var(--color-text-muted);
        }

        .member-name {
          font-weight: 500;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .you-tag {
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 400;
          margin-left: 4px;
        }

        .btn-invite-trigger {
          background: none;
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
          border-radius: var(--radius-input);
          padding: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-invite-trigger:hover {
          background-color: var(--color-primary);
          color: var(--color-text-primary);
        }

        @media (max-width: 768px) {
          .members-panel {
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            transform: translateX(100%);
            transition: transform var(--transition-normal);
            box-shadow: none;
          }

          .members-mobile-open {
            transform: translateX(0);
            box-shadow: -10px 0 30px rgba(0, 0, 0, 0.6);
          }

          .members-backdrop {
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(2px);
            z-index: -1;
          }
        }
      `}</style>
    </aside>
  );
}
