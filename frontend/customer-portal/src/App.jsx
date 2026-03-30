import { useState } from 'react'
import axios from 'axios'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    try {
      const response = await axios.post(`http://localhost:8080${endpoint}`, {
        email,
        password,
        role: 0 // Default Customer role
      })
      setMessage(isLogin ? `Success! Token: ${response.data.token.substring(0, 20)}...` : 'Registered successfully! Please login.')
    } catch (error) {
      setMessage(`Error: ${error.response?.data || error.message}`)
    }
  }

  return (
    <div className="auth-container">
      <h1>Logistics System</h1>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <br />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <br />
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p onClick={() => setIsLogin(!isLogin)} style={{cursor: 'pointer', color: '#646cff'}}>
        {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
      </p>
      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default App
