import React from 'react';

const getAvatarColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 60%)`;
};

export default function MessageBubble({ message, isMe }) {
  const { sender, text, timestamp } = message;
  const initial = sender ? sender.charAt(0).toUpperCase() : '?';
  const avatarBg = getAvatarColor(sender || '');

  return (
    <div className={`message-wrapper animate-message ${isMe ? 'message-me' : 'message-other'}`}>
      {!isMe && (
        <div className="message-avatar" style={{ backgroundColor: avatarBg }}>
          {initial}
        </div>
      )}
      
      <div className="message-content-container">
        {!isMe && (
          <div className="message-meta">
            <span className="message-sender">{sender}</span>
            <span className="message-time">{timestamp}</span>
          </div>
        )}
        {isMe && (
          <div className="message-meta message-meta-me">
            <span className="message-time">{timestamp}</span>
          </div>
        )}
        
        <div className="message-bubble">
          <p className="message-text">{text}</p>
        </div>
      </div>

      {isMe && (
        <div className="message-avatar" style={{ backgroundColor: avatarBg }}>
          {initial}
        </div>
      )}

      <style>{`
        .message-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-bottom: 16px;
          max-width: 70%;
          opacity: 0;
        }

        .message-me {
          margin-left: auto;
        }

        .message-other {
          margin-right: auto;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--color-bg);
          font-size: 14px;
          user-select: none;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .message-content-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 4px;
        }

        .message-meta-me {
          justify-content: flex-end;
        }

        .message-sender {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .message-time {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .message-bubble {
          padding: 10px 16px;
          border-radius: var(--radius-bubble);
          word-break: break-word;
          line-height: 1.4;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .message-me .message-bubble {
          background-color: var(--color-primary);
          color: var(--color-text-primary);
          border-bottom-right-radius: 4px;
        }

        .message-other .message-bubble {
          background-color: var(--color-surface-2);
          color: var(--color-text-primary);
          border-bottom-left-radius: 4px;
        }

        .message-text {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
