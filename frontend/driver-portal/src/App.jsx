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
        <div className="logo gold-accent">Logistics<span>Driver</span></div>
        <div className="user-info">
          <span className="email-chip">{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      
      <main className="content">
        <header className="page-header">
          <h1>My Shipments</h1>
          <button className="btn-action">Scan QR Code</button>
        </header>

        <div className="stats-grid">
          <div className="stat-card glassCard">
            <h3>Assigned Today</h3>
            <p className="number">8</p>
            <span className="stat-detail">4 completed</span>
          </div>
          <div className="stat-card glassCard highlighted">
            <h3>Current Route</h3>
            <p className="number">#442</p>
            <span className="stat-detail">Downtown Area</span>
          </div>
          <div className="stat-card glassCard">
            <h3>Earnings</h3>
            <p className="number">$245.50</p>
            <span className="stat-detail">This week</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
