import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState(localStorage.getItem('email'));
  
  const [view, setView] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tracking, setTracking] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    weight: 0,
    contents: ''
  });

  const PRICE_PER_KG = 10;
  const calculatedAmount = formData.weight * PRICE_PER_KG;

  // On mount: check for token in URL params (from auth-portal redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');
    if (urlToken && urlEmail) {
      localStorage.setItem('token', urlToken);
      localStorage.setItem('email', urlEmail);
      setToken(urlToken);
      setEmail(urlEmail);
      // Clean URL
      window.history.replaceState({}, document.title, '/');
    }
    if (!urlToken && !localStorage.getItem('token')) {
      window.location.href = 'http://localhost:3004';
    }
  }, []);

  // Fetch orders when entering orders view
  useEffect(() => {
    if (view === 'orders' && token) {
      fetchOrders();
    }
  }, [view]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders?email=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchTracking = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/tracking/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTracking(data);
      }
    } catch (err) {
      console.error('Failed to fetch tracking', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'http://localhost:3004';
  };

  const handleBookOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerEmail: email,
          origin: formData.origin,
          destination: formData.destination,
          weightKg: formData.weight,
          contents: formData.contents,
          amount: calculatedAmount
        })
      });
      if (res.ok) {
        const newOrder = await res.json();
        setSelectedOrder(newOrder);
        setView('payment');
      }
    } catch (err) {
      console.error('Failed to create order', err);
    }
  };

  const handlePayment = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${selectedOrder.id}/pay`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert(`Payment of $${selectedOrder.amount} successful! Order is now being processed.`);
        setView('orders');
      }
    } catch (err) {
      console.error('Payment failed', err);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    fetchTracking(order.id);
    setView('details');
  };

  if (!token) return <div className="loading">Redirecting to login...</div>;

  return (
    <div className="dashboard dark-theme">
      <nav className="navbar">
        <div className="logo blue-accent" style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')}>
          Logistics<span>Customer</span>
        </div>
        <div className="nav-links">
          <button onClick={() => setView('book')} className={view === 'book' ? 'active' : ''}>Book Order</button>
          <button onClick={() => setView('orders')} className={view === 'orders' ? 'active' : ''}>My Orders</button>
        </div>
        <div className="user-info">
          <span className="email-chip">{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      
      <main className="content">
        {view === 'dashboard' && (
          <>
            <header className="page-header">
              <h1>Welcome Back</h1>
              <button className="btn-action" onClick={() => setView('book')}>Ship Something New</button>
            </header>

            <div className="stats-grid">
              <div className="stat-card glassCard">
                <h3>Total Shipments</h3>
                <p className="number">{orders.length}</p>
              </div>
              <div className="stat-card glassCard highlighted">
                <h3>Quick Actions</h3>
                <button className="btn-action" onClick={() => setView('orders')} style={{ marginTop: '0.5rem', width: '100%' }}>View My Orders</button>
              </div>
              <div className="stat-card glassCard">
                <h3>Rewards Points</h3>
                <p className="number">1,240</p>
              </div>
            </div>
          </>
        )}

        {view === 'book' && (
          <div className="glassCard form-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>New Shipment</h2>
            <form onSubmit={handleBookOrder}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Origin</label>
                  <input type="text" placeholder="City, State" required 
                         onChange={(e) => setFormData({...formData, origin: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input type="text" placeholder="City, State" required 
                         onChange={(e) => setFormData({...formData, destination: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" min="1" required 
                       onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="form-group">
                <label>Contents</label>
                <textarea placeholder="What are you shipping?" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--glass)', color: 'white', border: '1px solid var(--glass-border)' }}
                       onChange={(e) => setFormData({...formData, contents: e.target.value})}></textarea>
              </div>
              
              <div className="price-estimation" style={{ margin: '2rem 0', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Rate:</span>
                  <span>${PRICE_PER_KG}/kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '800' }}>
                  <span>Estimated Total:</span>
                  <span className="blue-accent">${calculatedAmount}</span>
                </div>
              </div>

              <button type="submit" className="btn-action" style={{ width: '100%' }}>Continue to Payment</button>
            </form>
          </div>
        )}

        {view === 'payment' && selectedOrder && (
          <div className="glassCard text-center" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <h2>Secure Payment</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Order #{selectedOrder.id}</p>
            
            <div style={{ background: 'var(--bg-darker)', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>Total Amount Due</span>
              <div style={{ fontSize: '3rem', fontWeight: '800' }}>${selectedOrder.amount}</div>
            </div>

            <button className="btn-action" style={{ width: '100%', background: 'var(--secondary)' }} onClick={handlePayment}>
              Pay ${selectedOrder.amount} Now
            </button>
            <button className="logout-btn" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setView('book')}>Cancel</button>
          </div>
        )}

        {view === 'orders' && (
          <div className="orders-container">
            <header className="page-header">
              <h1>My Orders</h1>
              <button className="btn-action" onClick={() => setView('book')}>+ New Order</button>
            </header>

            {loadingOrders ? <p>Loading orders...</p> : (
              orders.length === 0 ? (
                <div className="glassCard" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No orders yet.</p>
                  <button className="btn-action" onClick={() => setView('book')}>Book Your First Shipment</button>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="glassCard list-item" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }} onClick={() => handleViewDetails(order)}>
                      <div>
                        <span className="email-chip" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', display: 'inline-block' }}>#{order.id}</span>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{order.origin} → {order.destination}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weight: {order.weight_kg}kg | Amount: ${order.amount}</div>
                      </div>
                      <div className={`status ${order.status === 'paid' || order.status === 'delivered' ? 'active' : 'pending'}`}>
                        {order.status}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {view === 'details' && selectedOrder && (
          <div className="order-details">
            <button className="logout-btn" style={{ color: 'var(--text-secondary)', borderColor: 'transparent', padding: '0 0 1rem 0' }} onClick={() => setView('orders')}>← Back to list</button>
            <div className="glassCard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h1>Order #{selectedOrder.id}</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>{selectedOrder.origin} → {selectedOrder.destination}</p>
                </div>
                <div className={`status ${selectedOrder.status === 'paid' || selectedOrder.status === 'delivered' ? 'active' : 'pending'}`} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>{selectedOrder.status}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glassCard"><h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weight</h3><p style={{ fontWeight: 700 }}>{selectedOrder.weight_kg} kg</p></div>
                <div className="glassCard"><h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Amount</h3><p style={{ fontWeight: 700 }}>${selectedOrder.amount}</p></div>
                <div className="glassCard"><h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contents</h3><p style={{ fontWeight: 700 }}>{selectedOrder.contents || 'N/A'}</p></div>
              </div>

              <h2 style={{ marginBottom: '1rem' }}>Tracking Timeline</h2>
              {tracking && tracking.events && tracking.events.length > 0 ? (
                <div className="tracking-timeline" style={{ position: 'relative', paddingLeft: '2rem' }}>
                  {tracking.events.map((event, idx) => (
                    <div key={idx} className="timeline-item" style={{ borderLeft: `2px solid ${idx === 0 ? 'var(--primary)' : 'var(--glass-border)'}`, paddingBottom: '2rem', paddingLeft: '1.5rem', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-9px', top: '0', width: '16px', height: '16px', background: idx === 0 ? 'var(--primary)' : 'var(--bg-darker)', border: idx === 0 ? 'none' : '2px solid var(--glass-border)', borderRadius: '50%' }}></div>
                      <div style={{ fontWeight: '600' }}>{event.status}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{event.location} — {new Date(event.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No tracking events yet. Updates will appear once your package ships.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
