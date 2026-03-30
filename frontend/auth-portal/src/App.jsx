import { useState } from 'react';
import './index.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('Customer');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'http://localhost:8080/api/auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/login' : '/register';
    const payload = isLogin 
      ? { email, password } 
      : { email, password, roleName };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        if (isLogin) {
          setMessage('Login Successful! Redirecting...');
          
          // Cross-portal redirection — pass token via URL so the target portal
          // (which runs on a different origin) can read it and store in its own localStorage.
          setTimeout(() => {
            const role = data.role || 'Customer';
            const portals = {
              'Customer': 'http://localhost:3000',
              'Driver': 'http://localhost:3001',
              'Manager': 'http://localhost:3002',
              'Support': 'http://localhost:3003'
            };
            const target = portals[role] || portals['Customer'];
            const params = new URLSearchParams({
              token: data.token,
              email: data.email,
              role: role
            });
            window.location.href = `${target}?${params.toString()}`;
          }, 1000);
        } else {
          setMessage('Registration Successful! Please login.');
          setIsLogin(true);
        }
      } else {
        const errorMessage = typeof data === 'string' 
          ? data 
          : (data.message || data.title || JSON.stringify(data));
        setError(errorMessage);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Logistics</h1>
          <p>{isLogin ? 'Welcome back to the portal' : 'Create your secure account'}</p>
        </div>

        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Select Role</label>
              <select 
                value={roleName} 
                onChange={(e) => setRoleName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="Customer">Customer</option>
                <option value="Driver">Driver</option>
                <option value="Manager">Manager</option>
                <option value="Support">Support Staff</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>Don't have an account? <a href="#" onClick={() => setIsLogin(false)}>Sign up</a></p>
          ) : (
            <p>Already have an account? <a href="#" onClick={() => setIsLogin(true)}>Sign in</a></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
