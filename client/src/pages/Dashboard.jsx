import React from 'react';

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-page">
      <h2>Welcome, {user?.name || user?.email}!</h2>
      <p>This is a skeleton mock dashboard page.</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
