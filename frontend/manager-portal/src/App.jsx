import { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState(localStorage.getItem('email'));
  
  const [staffSummary, setStaffSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignments state: { orderId: selectedDriverEmail }
  const [assignments, setAssignments] = useState({});

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

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [staffRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/auth/staff-summary`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/orders/all`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (staffRes.ok) setStaffSummary(await staffRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      
    } catch (err) {
      console.error("Failed fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAssign = async (orderId) => {
    const driverEmail = assignments[orderId];
    if (!driverEmail) return alert("Select a driver first");

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driverEmail })
      });
      if (res.ok) {
        alert("Order assigned successfully!");
        fetchData(); // Refresh UI
      } else {
        alert("Assignment failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'http://localhost:3004';
  };

  if (!token) return <div className="loading">Redirecting to login...</div>;

  const totalOrders = orders.length;
  const unassignedOrders = orders.filter(o => !o.driverEmail && o.status !== 'delivered').length;
  const activeOrders = orders.filter(o => o.status !== 'delivered').length;

  return (
    <div className="dashboard dark-theme animate-fade-in">
      <nav className="navbar">
        <div className="logo accent-gold">Logistics<span>Manager</span></div>
        <div className="user-info">
          <span className="email-chip">{email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      
      <main className="content">
        <header className="page-header">
          <h1 className="gradient-text">Operations Command Center</h1>
        </header>

        {loading ? <p className="loading-text">Loading operational data...</p> : (
          <>
            <div className="stats-grid animate-fade-in">
              <div className="stat-card glassCard">
                <h3>Total Drivers</h3>
                <p className="number">{staffSummary?.driverCount || 0}</p>
                <div className="trend">Active field operations</div>
              </div>
              <div className="stat-card glassCard">
                <h3>Support Staff</h3>
                <p className="number">{staffSummary?.supportCount || 0}</p>
                <div className="trend">Handling tickets</div>
              </div>
              <div className="stat-card glassCard">
                <h3>Global Orders</h3>
                <p className="number">{totalOrders}</p>
                <div className="trend">{activeOrders} active deliveries</div>
              </div>
              <div className="stat-card highlighted glassCard">
                <h3>Action Required</h3>
                <p className="number" style={{color: '#fff'}}>{unassignedOrders}</p>
                <div className="trend">Unassigned shipments</div>
              </div>
            </div>

            <div className="table-container glassCard animate-slide-up">
               <h2 className="gradient-text" style={{marginTop: 0}}>Master Order Tracker</h2>
               
               <table className="modern-table">
                 <thead>
                   <tr>
                     <th>Order #</th>
                     <th>Customer</th>
                     <th>Route</th>
                     <th>Status</th>
                     <th>Assigned Driver</th>
                     <th>Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {orders.length === 0 && (
                     <tr><td colSpan="6" className="empty-text">No active orders found in the system.</td></tr>
                   )}
                   {orders.map(order => (
                     <tr key={order.id}>
                       <td><b>#{order.id}</b></td>
                       <td>{order.customerEmail}</td>
                       <td>
                          <span className="route-cell">{order.origin} → {order.destination}</span>
                       </td>
                       <td>
                          <span className={`status-badge ${order.status}`}>{order.status}</span>
                       </td>
                       <td>
                          {order.driverEmail ? (
                             <span className="driver-assigned">{order.driverEmail}</span>
                          ) : (
                             <span className="unassigned-text">Unassigned</span>
                          )}
                       </td>
                       <td>
                          {order.status !== 'delivered' && !order.driverEmail ? (
                            <div className="action-cell">
                              <select 
                                className="driver-select"
                                value={assignments[order.id] || ''}
                                onChange={(e) => setAssignments({...assignments, [order.id]: e.target.value})}
                              >
                                <option value="">Select a driver...</option>
                                {staffSummary?.drivers?.map(dr => (
                                  <option key={dr} value={dr}>{dr}</option>
                                ))}
                              </select>
                              <button className="btn-assign" onClick={() => handleAssign(order.id)}>Assign</button>
                            </div>
                          ) : (
                             order.status === 'delivered' ? 'Delivered' : 'En Route'
                          )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
