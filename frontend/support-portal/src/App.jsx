import { useEffect, useState, useRef } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState(localStorage.getItem('email'));
  
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [customerOrders, setCustomerOrders] = useState([]);

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

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/support/${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomerOrders = async (customerEmail) => {
    try {
      const res = await fetch(`${API_URL}/chat/customer-orders/${encodeURIComponent(customerEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchActiveSessions();
      const interval = setInterval(fetchActiveSessions, 5000); // Poll for new chats/messages
      return () => clearInterval(interval);
    }
  }, [token, email]);

  const handleSelectSession = (session) => {
    setSelectedSessionId(session.id);
    fetchCustomerOrders(session.customerEmail);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedSessionId) return;

    try {
      const res = await fetch(`${API_URL}/chat/session/${selectedSessionId}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ senderEmail: email, content: chatInput })
      });
      if (res.ok) {
        setChatInput('');
        fetchActiveSessions(); // refresh to show message immediately
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'http://localhost:3004';
  };

  if (!token) return <div className="loading">Redirecting to login...</div>;

  const currentSession = activeSessions.find(s => s.id === selectedSessionId);

  return (
    <div className="dashboard dark-theme animate-fade-in">
      <nav className="navbar">
        <div className="logo accent-blue">Logistics<span>Support Hub</span></div>
        <div className="user-info">
          <span className="email-chip">{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      
      <main className="content support-layout">
         <div className="sidebar glassCard">
           <h3 className="gradient-text">Active Queue ({activeSessions.length})</h3>
           <div className="session-list">
              {activeSessions.length === 0 ? <p className="empty-text">No active support requests.</p> : null}
              {activeSessions.map(session => (
                <div 
                  key={session.id} 
                  className={`session-card ${selectedSessionId === session.id ? 'active' : ''}`}
                  onClick={() => handleSelectSession(session)}
                >
                   <div className="customer-email">{session.customerEmail}</div>
                   <div className="message-preview">
                     {session.messages && session.messages.length > 0 
                       ? session.messages[session.messages.length - 1].content 
                       : 'New chat initiated.'}
                   </div>
                </div>
              ))}
           </div>
         </div>

         <div className="chat-main glassCard">
            {currentSession ? (
              <div className="chat-container">
                 <div className="chat-header">
                    <h3>Chat Session with {currentSession.customerEmail}</h3>
                 </div>
                 <div className="chat-messages fade-in">
                    {currentSession.messages.length === 0 && <p className="empty-text">Waiting for customer...</p>}
                    {currentSession.messages.map((msg, i) => (
                      <div key={i} className={`chat-bubble ${msg.senderEmail === email ? 'chat-mine' : 'chat-theirs'}`}>
                         <span className="sender">{msg.senderEmail === email ? 'You' : msg.senderEmail}</span>
                         <div className="content">{msg.content}</div>
                      </div>
                    ))}
                 </div>
                 <form className="chat-input" onSubmit={handleSendMessage}>
                    <input 
                      type="text" 
                      placeholder="Type your reply here..." 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)} 
                      required
                    />
                    <button type="submit" className="btn-action">Reply</button>
                 </form>
              </div>
            ) : (
              <div className="empty-state">
                 <div className="icon">💬</div>
                 <h2>Select a chat queue to begin</h2>
                 <p>Provide excellent customer satisfaction by answering questions promptly and accurately.</p>
              </div>
            )}
         </div>

         <div className="context-sidebar glassCard">
            <h3 className="gradient-text">Customer Context</h3>
            {currentSession ? (
              <div className="order-history fade-in">
                 <h4>Order History ({customerOrders.length})</h4>
                 {customerOrders.length === 0 ? <p className="empty-text">No previous orders found.</p> : null}
                 <div className="order-list">
                    {customerOrders.map(order => (
                       <div key={order.id} className="context-order-card">
                          <div className="order-header">
                            <span>Order #{order.id}</span>
                            <span className={`status ${order.status === 'delivered' ? 'success' : 'pending'}`}>{order.status}</span>
                          </div>
                          <div className="order-details">
                             {order.origin} → {order.destination}<br/>
                             {order.weightKg}kg • ${order.amount}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            ) : (
              <p className="empty-text" style={{marginTop:'2rem'}}>No customer selected.</p>
            )}
         </div>
      </main>
    </div>
  );
}

export default App;
