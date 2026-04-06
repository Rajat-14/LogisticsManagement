import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

const API_URL = 'http://localhost:8080/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A component to handle map clicks
function LocationSelector({ mode, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng, mode);
    },
  });
  return null;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState(localStorage.getItem('email'));
  
  const [view, setView] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tracking, setTracking] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Map state
  const [mapMode, setMapMode] = useState('origin'); // 'origin' | 'destination'
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  // Booking Form State
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    weight: 1, // initialize with 1 so amount default isn't 0
    contents: ''
  });

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const PRICE_PER_KG = 10;
  const RATE_PER_KM = 0.5;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  let distanceKm = 0;
  if (originCoords && destCoords) {
    distanceKm = calculateDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
  }
  
  const calculatedAmount = Math.round((formData.weight * PRICE_PER_KG + distanceKm * RATE_PER_KM) * 100) / 100;

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
      window.history.replaceState({}, document.title, '/');
    }
    if (!urlToken && !localStorage.getItem('token')) {
      window.location.href = 'http://localhost:3004';
    }
  }, []);

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

  const handleMapSelect = (latlng, mode) => {
    // Generate an approximate string name for UI display
    const labelStr = `[${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`;
    if (mode === 'origin') {
      setOriginCoords(latlng);
      setFormData(prev => ({...prev, origin: labelStr}));
      if (!destCoords) setMapMode('destination');
    } else {
      setDestCoords(latlng);
      setFormData(prev => ({...prev, destination: labelStr}));
      if (!originCoords) setMapMode('origin');
    }
  };

  const handleBookOrder = async (e) => {
    e.preventDefault();
    if (!originCoords || !destCoords) {
      alert("Please select both origin and destination on the map.");
      return;
    }
    if (!formData.contents) {
        alert("Please enter the contents of the shipment.");
        return;
    }

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
        // Reset booking form
        setOriginCoords(null);
        setDestCoords(null);
        setFormData({origin: '', destination: '', weight: 1, contents: ''});
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

  const toggleChat = async () => {
    if (!chatOpen && !chatSession) {
      try {
        const res = await fetch(`${API_URL}/chat/session?email=${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setChatSession(data);
          setChatMessages(data.messages || []);
        }
      } catch (e) {
        console.error("Failed starting chat", e);
      }
    }
    setChatOpen(!chatOpen);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatSession) return;
    try {
      const res = await fetch(`${API_URL}/chat/session/${chatSession.id}/message`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail: email, content: chatInput })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages([...chatMessages, newMsg]);
        setChatInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (chatOpen && chatSession) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/chat/session/${chatSession.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setChatMessages(data.messages || []);
          }
        } catch (e) {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [chatOpen, chatSession, token]);

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
      
      <main className="content animate-fade-in">
        {view === 'dashboard' && (
          <>
            <header className="page-header">
              <h1>Welcome Back</h1>
              <button className="btn-action pulse-hover" onClick={() => setView('book')}>Ship Something New</button>
            </header>

            <div className="stats-grid">
              <div className="stat-card glassCard hover-scale">
                <h3>Total Shipments</h3>
                <p className="number">{orders.length}</p>
              </div>
              <div className="stat-card glassCard highlighted hover-scale">
                <h3>Quick Actions</h3>
                <button className="btn-action" onClick={() => setView('orders')} style={{ marginTop: '0.5rem', width: '100%' }}>View My Orders</button>
              </div>
              <div className="stat-card glassCard hover-scale">
                <h3>Rewards Points</h3>
                <p className="number">1,240</p>
              </div>
            </div>
          </>
        )}

        {view === 'book' && (
          <div className="glassCard form-container map-integrated" style={{ margin: '0 auto', maxWidth: '1000px' }}>
            <h2 className="gradient-text">New Shipment</h2>
            
            <div className="booking-layout">
              {/* Map Section */}
              <div className="map-section glassCard map-wrapper">
                  <div className="map-controls">
                    <h3 style={{fontSize:'1.1rem', marginBottom:'1rem'}}>Select Locations on Map</h3>
                    <div className="mode-toggles" style={{display:'flex', gap:'1rem', marginBottom:'1rem'}}>
                      <button 
                        type="button"
                        className={`map-toggle-btn ${mapMode === 'origin' ? 'active-origin' : ''}`}
                        onClick={() => setMapMode('origin')}
                      >
                        Set Origin
                      </button>
                      <button 
                         type="button"
                        className={`map-toggle-btn ${mapMode === 'destination' ? 'active-dest' : ''}`}
                        onClick={() => setMapMode('destination')}
                      >
                        Set Destination
                      </button>
                    </div>
                  </div>
                  
                  <div className="leaflet-container-wrapper">
                    <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '400px', width: '100%', borderRadius: '12px' }}>
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <LocationSelector mode={mapMode} onLocationSelect={handleMapSelect} />
                      {originCoords && (
                        <Marker position={originCoords}>
                          <Popup>Origin</Popup>
                        </Marker>
                      )}
                      {destCoords && (
                        <Marker position={destCoords}>
                          <Popup>Destination</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  
                  {(originCoords || destCoords) && (
                    <div className="distance-info" style={{marginTop:'1rem', textAlign:'center', fontWeight:'600'}}>
                       {originCoords && destCoords ? (
                         `Distance: ${distanceKm.toFixed(2)} km`
                       ) : (
                         "Select both origin and destination to calculate distance."
                       )}
                    </div>
                  )}
              </div>

              {/* Form Section */}
              <div className="form-section">
                <form onSubmit={handleBookOrder}>
                  <div className="form-group">
                    <label>Origin</label>
                    <input type="text" placeholder="Click on Map or Type" required 
                           value={formData.origin}
                           onChange={(e) => setFormData({...formData, origin: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Destination</label>
                    <input type="text" placeholder="Click on Map or Type" required 
                           value={formData.destination}
                           onChange={(e) => setFormData({...formData, destination: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input type="number" min="1" required value={formData.weight}
                           onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label>Contents</label>
                    <textarea placeholder="What are you shipping?" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--glass)', color: 'white', border: '1px solid var(--glass-border)' }}
                           value={formData.contents} required
                           onChange={(e) => setFormData({...formData, contents: e.target.value})}></textarea>
                  </div>
                  
                  <div className="price-estimation" style={{ margin: '2rem 0', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Rate (Weight):</span>
                      <span>${PRICE_PER_KG}/kg</span>
                    </div>
                    <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Rate (Distance):</span>
                      <span>${RATE_PER_KM}/km</span>
                    </div>
                    <div className="price-total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '800', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                      <span>Estimated Total:</span>
                      <span className="blue-accent">${calculatedAmount}</span>
                    </div>
                  </div>

                  <button type="submit" className="btn-action pulse-hover" style={{ width: '100%' }}>Proceed to Checkout</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {view === 'payment' && selectedOrder && (
          <div className="glassCard text-center animate-slide-up" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>💳</div>
            <h2 className="gradient-text">Secure Payment</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Order #{selectedOrder.id}</p>
            
            <div className="payment-box" style={{ background: 'var(--bg-darker)', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
              <span className="payment-label" style={{ fontSize: '0.875rem', opacity: 0.6 }}>Total Amount Due</span>
              <div className="payment-amount" style={{ fontSize: '3.5rem', fontWeight: '800', background: 'linear-gradient(45deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${selectedOrder.amount}</div>
            </div>

            <button className="btn-action pulse-hover" style={{ width: '100%', background: 'linear-gradient(45deg, var(--secondary), #059669)', fontSize: '1.2rem', padding: '1rem' }} onClick={handlePayment}>
              Pay ${selectedOrder.amount} Now
            </button>
            <button className="logout-btn go-back-btn" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setView('book')}>Cancel</button>
          </div>
        )}

        {view === 'orders' && (
          <div className="orders-container animate-fade-in">
            <header className="page-header">
              <h1 className="gradient-text">My Orders</h1>
              <button className="btn-action hover-scale" onClick={() => setView('book')}>+ New Order</button>
            </header>

            {loadingOrders ? <p className="loading-pulse" style={{textAlign: 'center', fontSize: '1.2rem'}}>Loading amazing journeys...</p> : (
              orders.length === 0 ? (
                <div className="glassCard empty-state" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ fontSize: '4rem', opacity: 0.5, marginBottom: '1rem' }}>📦</div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Ready to send your first package?</p>
                  <button className="btn-action pulse-hover" onClick={() => setView('book')}>Start Shipping</button>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="glassCard list-item hover-scale" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }} onClick={() => handleViewDetails(order)}>
                      <div>
                        <span className="email-chip" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', display: 'inline-block' }}>#{order.id}</span>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginTop: '0.5rem' }}>{order.origin} → {order.destination}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Weight: {order.weight_kg}kg | Amount: <span className="blue-accent font-bold">${order.amount}</span></div>
                      </div>
                      <div className={`status ${order.status === 'paid' || order.status === 'delivered' ? 'active' : 'pending'} badge-large`}>
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
          <div className="order-details animate-slide-up">
            <button className="logout-btn go-back-btn" style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }} onClick={() => setView('orders')}>← Back to list</button>
            <div className="glassCard">
              <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h1 className="gradient-text">Order #{selectedOrder.id}</h1>
                  <p className="route-text" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{selectedOrder.origin} → {selectedOrder.destination}</p>
                </div>
                <div className={`status badge-large ${selectedOrder.status === 'paid' || selectedOrder.status === 'delivered' ? 'active' : 'pending'}`} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>{selectedOrder.status}</div>
              </div>

              <div className="detail-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="metric-card glassCard hover-scale"><h3 className="metric-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Weight</h3><p className="metric-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedOrder.weight_kg} kg</p></div>
                <div className="metric-card glassCard hover-scale"><h3 className="metric-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Amount</h3><p className="metric-value blue-accent" style={{ fontSize: '1.5rem', fontWeight: '800' }}>${selectedOrder.amount}</p></div>
                <div className="metric-card glassCard hover-scale"><h3 className="metric-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Contents</h3><p className="metric-value" style={{ fontSize: '1.2rem', fontWeight: '600' }}>{selectedOrder.contents || 'N/A'}</p></div>
              </div>

              <h2 className="timeline-title gradient-text" style={{ marginBottom: '1.5rem' }}>Tracking Timeline</h2>
              {tracking && tracking.events && tracking.events.length > 0 ? (
                <div className="tracking-timeline" style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--glass-border)' }}>
                  {tracking.events.map((event, idx) => (
                    <div key={idx} className="timeline-item" style={{ marginBottom: '2rem', position: 'relative' }}>
                      <div className={`timeline-dot ${idx === 0 ? 'dot-active' : ''}`} style={{ position: 'absolute', left: '-29px', top: '0', width: '16px', height: '16px', background: idx === 0 ? 'var(--primary)' : 'var(--bg-darker)', border: idx === 0 ? '0' : '2px solid var(--glass-border)', borderRadius: '50%', boxShadow: idx === 0 ? '0 0 10px var(--primary)' : 'none' }}></div>
                      <div className="timeline-content">
                        <div className="timeline-status" style={{ fontSize: '1.1rem', fontWeight: '700', color: idx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{event.status}</div>
                        <div className="timeline-meta" style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.3rem' }}>{event.location} — {new Date(event.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glassCard empty-state" style={{ padding: '2rem', marginTop: '1rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No tracking events yet. Updates will appear once your package ships.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Widget */}
      <div className="chat-widget-container">
        <button className="chat-toggle-btn pulse-hover" onClick={toggleChat}>
          {chatOpen ? '✕ Close Chat' : '💬 Chat with Support'}
        </button>
        {chatOpen && (
          <div className="chat-window glassCard animate-slide-up">
            <div className="chat-header gradient-text">
              <h3>Live Support</h3>
              {chatSession && <span style={{fontSize:'0.75rem', opacity:0.6}}>Assigned: {chatSession.supportEmail}</span>}
            </div>
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <p style={{color:'var(--text-secondary)', textAlign:'center', marginTop:'2rem'}}>Connecting you to an agent...</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.senderEmail === email ? 'chat-mine' : 'chat-theirs'}`}>
                     <strong>{msg.senderEmail === email ? 'You' : 'Support'}</strong> <br/>
                     {msg.content}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendMessage} className="chat-input-form">
              <input type="text" placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} required />
              <button type="submit" className="btn-action">Send</button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
