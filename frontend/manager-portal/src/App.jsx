import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState(localStorage.getItem('email'));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');
    if (urlToken && urlEmail) {
      localStorage.setItem('token', urlToken);
      localStorage.setItem('email', urlEmail);
      setToken(urlToken);
      setEmail(urlEmail);
      window.history.replaceState({}, document.title, '/');
    }
    if (!urlToken && !localStorage.getItem('token')) {
      window.location.href = 'http://localhost:3004';
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'http://localhost:3004';
  };

  if (!token) return <div className="loading">Redirecting to login...</div>;

  return (
    <div className="dashboard dark-theme">
      <nav className="navbar">
        <div className="logo purple-accent">Logistics<span>Manager</span></div>
        <div className="user-info">
          <span className="email-chip">{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      
      <main className="content">
        <header className="page-header">
          <h1>System Overview</h1>
          <div className="header-actions">
            <button className="btn-action">New Contract</button>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card glassCard">
            <h3>Global Orders</h3>
            <p className="number">1,540</p>
            <span className="stat-detail text-success">+12% vs last week</span>
          </div>
          <div className="stat-card glassCard">
            <h3>Active Drivers</h3>
            <p className="number">42</p>
            <span className="stat-detail">85% utilization</span>
          </div>
          <div className="stat-card glassCard">
            <h3>Efficiency Rate</h3>
            <p className="number">94.2%</p>
            <span className="stat-detail">Target 95%</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
