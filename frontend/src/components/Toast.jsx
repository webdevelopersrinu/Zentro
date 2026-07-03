import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            role="alert"
          >
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      
      <style>{`
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
          max-width: 320px;
          pointer-events: none;
        }

        .toast-item {
          pointer-events: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: var(--radius-input);
          font-family: var(--font-body);
          font-weight: 500;
          color: var(--color-text-primary);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          animation: slideIn 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
          border-left: 4px solid transparent;
        }

        .toast-success {
          background-color: var(--color-surface-2);
          border-left-color: var(--color-success);
        }

        .toast-error {
          background-color: var(--color-surface-2);
          border-left-color: var(--color-danger);
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding-left: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .toast-close:hover {
          color: var(--color-text-primary);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
