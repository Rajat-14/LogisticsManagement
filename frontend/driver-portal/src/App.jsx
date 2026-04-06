import { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState(localStorage.getItem('email'));
  
  const [view, setView] = useState('dashboard'); // 'dashboard', 'scanner'
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanInput, setScanInput] = useState('');

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

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      // Driver matches by email in our simplified route service
      const res = await fetch(`${API_URL}/routes?email=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error("Failed fetching routes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && view === 'dashboard') {
      fetchRoutes();
    }
  }, [token, view]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'http://localhost:3004';
  };

  const handleVerifyDelivery = async (e) => {
    e.preventDefault();
    if (!scanInput) return;

    try {
      const res = await fetch(`${API_URL}/delivery/verify/${scanInput}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        alert("Delivery verified successfully!");
        setScanInput('');
        setView('dashboard');
      } else {
        alert("Verification failed. Invalid order ID or network error.");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying delivery.");
    }
  };

  if (!token) return <div className="loading">Redirecting to login...</div>;

  return (
    <div className="dashboard dark-theme animate-fade-in">
      <nav className="navbar">
        <div className="logo" style={{ color: 'var(--primary)' }}>Logistics<span>Driver</span></div>
        <div className="user-info">
          <span className="email-chip">{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      
      <main className="content">
        {view === 'dashboard' && (
          <div className="animate-slide-up">
            <header className="page-header">
              <h1 className="gradient-text">My Shipments Route</h1>
              <button className="btn-action" onClick={() => setView('scanner')}>Scan QR Code (Deliver)</button>
            </header>

            <div className="stats-grid">
              <div className="stat-card glassCard hover-scale">
                <h3>Active Deliveries Today</h3>
                <p className="number">{routes.length}</p>
                <span className="stat-detail">Assigned to you</span>
              </div>
              <div className="stat-card glassCard highlighted hover-scale">
                <h3>Next Stop</h3>
                <p className="number" style={{fontSize: '1.8rem'}}>{routes.length > 0 ? routes[0].destination : 'Route Complete'}</p>
              </div>
              <div className="stat-card glassCard hover-scale">
                <h3>Earnings</h3>
                <p className="number">$245.50</p>
                <span className="stat-detail">This week</span>
              </div>
            </div>

            <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Active Route Manifest</h2>
            {loading ? <p>Loading your route...</p> : (
               routes.length === 0 ? (
                 <div className="glassCard" style={{textAlign: 'center', padding: '3rem'}}>
                   <h2>All clear! No remaining deliveries on your route.</h2>
                 </div>
               ) : (
                 <div className="route-list">
                    {routes.map((order, index) => (
                       <div key={order.id} className="glassCard list-item hover-scale">
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                              {index + 1}
                            </div>
                            <div>
                               <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Order #{order.id}</div>
                               <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>To: {order.destination}</div>
                               <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: 'var(--primary)' }}>Contents: {order.contents || 'Package'} ({order.weight_kg}kg)</div>
                            </div>
                         </div>
                         <div className="status pending">{order.status}</div>
                       </div>
                    ))}
                 </div>
               )
            )}
          </div>
        )}

        {view === 'scanner' && (
          <div className="animate-fade-in glassCard qr-container">
            <h2 className="gradient-text" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>Scan Package QR</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Align the package QR code within the frame to verify delivery completion.</p>
            
            <div className="qr-frame">
               <div className="qr-line"></div>
               <span style={{opacity: 0.3}}>CAMERA VIEW</span>
            </div>

            <form onSubmit={handleVerifyDelivery} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
               <p style={{marginBottom: '1rem', color: 'var(--text-secondary)'}}>Or manually enter Order ID:</p>
               <input 
                 type="number" 
                 className="fake-scan"
                 placeholder="Order ID..." 
                 value={scanInput}
                 onChange={e => setScanInput(e.target.value)}
                 required
               />
               <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                 <button type="submit" className="btn-action">Verify Delivery</button>
                 <button type="button" className="logout-btn" onClick={() => setView('dashboard')}>Cancel</button>
               </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
