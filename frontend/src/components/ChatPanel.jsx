import React, { useRef, useEffect, useState } from 'react';
import { Menu, Crown, Users, MessagesSquare, SendHorizontal } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatPanel({
  room,
  messages,
  typing,
  currentUser,
  onSendMessage,
  onMobileMenuToggle,
  onMobileMembersToggle
}) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  const isCreator = room && room.creator === currentUser;

  return (
    <main className="chat-panel">
      {/* Panel Header */}
      <header className="chat-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={onMobileMenuToggle} aria-label="Open sidebar">
            <Menu size={20} />
          </button>
          <span className="channel-hash">#</span>
          <span className="channel-title">{room ? room.name : 'select-a-room'}</span>
          {isCreator && (
            <span className="creator-crown-wrapper" title="You created this room">
              <Crown className="creator-crown" size={14} />
            </span>
          )}
        </div>
        <div className="header-right">
          <button className="mobile-members-btn" onClick={onMobileMembersToggle} aria-label="Toggle members list">
            <Users size={20} />
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat-message">
            <div className="empty-icon-wrapper">
              <MessagesSquare className="empty-icon" size={48} />
            </div>
            <h3>Welcome to #{room ? room.name : ''}!</h3>
            <p>This is the start of this channel. Send a message to begin.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.sender === currentUser}
            />
          ))
        )}

        {/* Animated Typing Indicator */}
        {typing && typing.length > 0 && (
          <div className="typing-indicator-wrapper animate-message">
            <div className="typing-indicator-avatar">
              {typing[0].charAt(0).toUpperCase()}
            </div>
            <div className="typing-indicator-bubble">
              <span className="typing-text">
                {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing
              </span>
              <div className="typing-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            placeholder={room ? `Message #${room.name}` : "Select a room first..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!room}
            className="chat-text-input focus-ring"
          />
          <button type="submit" disabled={!room || !text.trim()} className="chat-send-btn focus-ring">
            <SendHorizontal size={16} />
          </button>
        </form>
      </div>

      <style>{`
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--color-bg);
          height: 100%;
          position: relative;
          min-width: 0;
        }

        .chat-header {
          height: 64px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background-color: var(--color-surface);
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mobile-menu-btn, .mobile-members-btn {
          display: none;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .mobile-menu-btn:hover, .mobile-members-btn:hover {
          color: var(--color-text-primary);
        }

        .channel-hash {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .channel-title {
          font-family: var(--font-logo);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .creator-crown-wrapper {
          display: flex;
          align-items: center;
          margin-left: 6px;
          color: #f1c40f; /* Premium Gold color */
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .empty-chat-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: auto;
          text-align: center;
          max-width: 320px;
          color: var(--color-text-muted);
        }

        .empty-icon-wrapper {
          color: var(--color-border);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-chat-message h3 {
          color: var(--color-text-primary);
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .empty-chat-message p {
          font-size: 13px;
        }

        /* Typing Indicator styles */
        .typing-indicator-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-bottom: 16px;
          max-width: 70%;
        }

        .typing-indicator-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--color-border);
          color: var(--color-text-muted);
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .typing-indicator-bubble {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background-color: var(--color-surface-2);
          border-radius: var(--radius-bubble);
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .typing-text {
          font-size: 13px;
          color: var(--color-text-muted);
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots .dot {
          width: 6px;
          height: 6px;
          background-color: var(--color-text-muted);
          border-radius: 50%;
          display: inline-block;
          animation: blink 1.4s infinite both;
        }

        .typing-dots .dot:nth-child(2) {
          animation-delay: .2s;
        }

        .typing-dots .dot:nth-child(3) {
          animation-delay: .4s;
        }

        .chat-input-container {
          padding: 16px 20px 24px 20px;
          background-color: var(--color-bg);
          border-top: 1px solid var(--color-border);
        }

        .chat-input-form {
          display: flex;
          position: relative;
          background-color: var(--color-surface-2);
          border-radius: var(--radius-input);
          border: 1px solid var(--color-border);
          align-items: center;
          transition: border-color var(--transition-fast);
        }

        .chat-input-form:focus-within {
          border-color: var(--color-primary);
        }

        .chat-text-input {
          flex: 1;
          background: none;
          border: none;
          padding: 14px 50px 14px 16px;
          font-size: 14px;
          color: var(--color-text-primary);
          outline: none;
          width: 100%;
        }

        .chat-text-input::placeholder {
          color: var(--color-text-muted);
        }

        .chat-send-btn {
          position: absolute;
          right: 8px;
          background-color: var(--color-primary);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: background-color var(--transition-fast), transform var(--transition-fast);
        }

        .chat-send-btn:hover:not(:disabled) {
          background-color: var(--color-primary-hover);
          transform: scale(1.05);
        }

        .chat-send-btn:disabled {
          background-color: var(--color-border);
          color: var(--color-text-muted);
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn, .mobile-members-btn {
            display: flex;
          }
        }
      `}</style>
    </main>
  );
}
