import React from 'react';
import { MessagesSquare, Search, Plus, LogOut, X } from 'lucide-react';

export default function Sidebar({
  rooms,
  activeRoomId,
  unreads,
  currentUser,
  onRoomSelect,
  onCreateRoomClick,
  onLogout,
  mobileOpen,
  onMobileClose
}) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Mobile close backdrop */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={onMobileClose} />}

      <div className="sidebar-container">
        {/* Header / Brand */}
        <div className="sidebar-header">
          <div className="logo-container">
            <MessagesSquare className="logo-icon" size={24} />
            <h1 className="logo-text">ChatRoom</h1>
          </div>
          {mobileOpen && (
            <button className="mobile-close-btn" onClick={onMobileClose} aria-label="Close sidebar">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Search placeholder for rooms */}
        <div className="sidebar-search">
          <span className="search-icon">
            <Search size={14} />
          </span>
          <input type="text" placeholder="search..." className="search-input focus-ring" disabled />
        </div>

        {/* Rooms list */}
        <div className="rooms-section">
          <div className="section-header">
            <span className="section-title">CHANNELS</span>
          </div>

          <div className="rooms-list">
            {rooms.map((room) => {
              const isActive = room.id === activeRoomId;
              const hasUnread = unreads[room.id];

              return (
                <button
                  key={room.id}
                  className={`room-item focus-ring ${isActive ? 'room-active' : ''}`}
                  onClick={() => {
                    onRoomSelect(room.id);
                    if (onMobileClose) onMobileClose();
                  }}
                >
                  <span className="room-prefix">#</span>
                  <span className="room-name">{room.name}</span>
                  {hasUnread && <span className="unread-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create room trigger */}
        <button className="btn-create-room focus-ring" onClick={onCreateRoomClick}>
          <Plus size={16} /> Create room
        </button>

        {/* User profile strip */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="online-indicator">
              <span className="online-dot online-green" />
            </div>
            <div className="user-info">
              <span className="username-label">{currentUser}</span>
              <span className="status-label">online</span>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100%;
          z-index: 100;
          flex-shrink: 0;
        }

        .sidebar-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 16px;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-primary);
        }

        .logo-icon {
          flex-shrink: 0;
        }

        .logo-text {
          font-family: var(--font-logo);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .mobile-close-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-close-btn:hover {
          color: var(--color-text-primary);
        }

        .sidebar-search {
          position: relative;
          margin-bottom: 20px;
        }

        .sidebar-search .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .sidebar-search .search-input {
          width: 100%;
          background-color: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-input);
          padding: 8px 8px 8px 30px;
          font-size: 13px;
          color: var(--color-text-primary);
          outline: none;
        }

        .rooms-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: var(--color-text-muted);
        }

        .rooms-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .room-item {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          border-radius: 8px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: background-color var(--transition-fast), color var(--transition-fast);
          position: relative;
        }

        .room-item:hover {
          background-color: rgba(255, 255, 255, 0.04);
          color: var(--color-text-primary);
        }

        .room-active {
          background-color: var(--color-primary) !important;
          color: var(--color-text-primary) !important;
        }

        .room-prefix {
          font-weight: 500;
          font-size: 16px;
          margin-right: 8px;
          opacity: 0.6;
        }

        .room-name {
          font-weight: 500;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-success);
          margin-left: 6px;
        }

        .btn-create-room {
          background: none;
          border: 1px dashed var(--color-border);
          color: var(--color-primary);
          border-radius: var(--radius-input);
          padding: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .btn-create-room:hover {
          background-color: rgba(108, 92, 231, 0.08);
          border-color: var(--color-primary);
        }

        .sidebar-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .online-indicator {
          position: relative;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: var(--color-surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .online-green {
          background-color: var(--color-success);
          box-shadow: 0 0 0 2px var(--color-surface);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .username-label {
          font-weight: 600;
          color: var(--color-text-primary);
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-label {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .btn-logout {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-logout:hover {
          color: var(--color-danger);
        }

        /* Mobile Slide-in Panel behavior */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            transition: transform var(--transition-normal);
            box-shadow: none;
          }

          .sidebar-mobile-open {
            transform: translateX(0);
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.6);
          }

          .sidebar-backdrop {
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
