import React, { useState } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

/**
 * Main App Component
 * Handles simple routing state (Login / Dashboard)
 */
function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="app-container">
      {user ? (
        <Dashboard user={user} onLogout={() => setUser(null)} />
      ) : (
        <Login onLoginSuccess={(userData) => setUser(userData)} />
      )}
    </div>
  );
}

export default App;
