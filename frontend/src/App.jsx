import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Chat from './pages/Chat';
import { mockStore } from './utils/mockStore';
import './styles/theme.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!mockStore.currentUser);

  useEffect(() => {
    setIsAuthenticated(!!mockStore.currentUser);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    mockStore.logout();
    setIsAuthenticated(false);
  };

  return (
    <ToastProvider>
      {isAuthenticated ? (
        <Chat onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </ToastProvider>
  );
}

export default App;
