import React, { useState } from 'react';
import { MessagesSquare, User, Lock } from 'lucide-react';
import { useToast } from '../components/Toast';
import { mockStore } from '../utils/mockStore';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Username is required.');
      return;
    }

    if (isRegister) {
      const userExists = mockStore.users.some(u => u.username === cleanUsername);
      if (userExists) {
        setError('Username already taken.');
        return;
      }
    }

    const result = mockStore.login(cleanUsername);
    if (result.success) {
      addToast(isRegister ? 'Account created successfully!' : 'Logged in successfully!', 'success');
      onLoginSuccess();
    } else {
      setError(result.error || 'Failed to authenticate.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-section">
          <div className="login-logo-icon-wrapper">
            <MessagesSquare className="login-logo-icon" size={40} />
          </div>
          <h1 className="login-logo-title">ChatRoom</h1>
          <p className="login-logo-subtitle">Talk in real time</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <span className="input-icon">
              <User size={18} />
            </span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input focus-ring"
              autoFocus
            />
          </div>

          <div className="input-group">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input focus-ring"
            />
          </div>

          {error && <div className="login-error-text">{error}</div>}

          <button type="submit" className="login-btn focus-ring">
            {isRegister ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="login-toggle-container">
          <button
            className="login-toggle-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Already have an account? Log In' : 'New here? Create account'}
          </button>
        </div>
      </div>

      <style>{`
        .login-page {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg);
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
        }

        .login-card {
          width: 380px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-card);
          padding: 40px 32px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .login-logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .login-logo-icon-wrapper {
          background-color: rgba(108, 92, 231, 0.1);
          color: var(--color-primary);
          padding: 12px;
          border-radius: 50%;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-logo-title {
          font-family: var(--font-logo);
          font-size: 26px;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .login-logo-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          background-color: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-input);
          padding: 14px 14px 14px 42px;
          font-size: 14px;
          color: var(--color-text-primary);
          transition: border-color var(--transition-fast);
          outline: none;
        }

        .login-input::placeholder {
          color: var(--color-text-muted);
        }

        .login-input:focus {
          border-color: var(--color-primary);
        }

        .login-error-text {
          color: var(--color-danger);
          font-size: 13px;
          font-weight: 500;
          margin-top: -4px;
          text-align: left;
        }

        .login-btn {
          background-color: var(--color-primary);
          border: none;
          color: var(--color-text-primary);
          padding: 14px;
          border-radius: var(--radius-input);
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: background-color var(--transition-fast), transform var(--transition-fast);
          margin-top: 8px;
        }

        .login-btn:hover {
          background-color: var(--color-primary-hover);
        }

        .login-toggle-container {
          text-align: center;
        }

        .login-toggle-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: 13px;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .login-toggle-btn:hover {
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
}
