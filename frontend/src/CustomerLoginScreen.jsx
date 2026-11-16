import React, { useState } from 'react';

const API = "http://localhost:3000/api/customers";

export default function CustomerLoginScreen({ onLoginSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = isLogin ? `${API}/login` : `${API}/register`;
      const body = isLogin 
        ? { email, password } 
        : { name, email, phone, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('customerToken', data.token);
          setMessage("Login successful! Redirecting...");
          setTimeout(() => onLoginSuccess(), 1000);
        } else {
          setMessage("Registration successful! You can now log in.");
          setIsLogin(true);
        }
      } else {
        setMessage(data.message || "Something went wrong.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
          ← Back to Home
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#4A3AFF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', fontSize: '30px' }}>
            🚚
          </div>
          <h2 style={{ margin: 0, color: '#071D3A', fontSize: '24px', fontWeight: '900' }}>LUCKY MOVERS</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748B', fontSize: '14px' }}>
            {isLogin ? "Welcome back! Please log in." : "Create your customer account."}
          </p>
        </div>

        {message && (
          <div style={{ padding: '12px', backgroundColor: message.includes('success') ? '#ECFDF5' : '#FEF2F2', color: message.includes('success') ? '#059669' : '#EF4444', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none' }} />
              <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none' }} />
            </>
          )}
          
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none' }} />

          <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#FFC107', color: '#071D3A', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
            {loading ? "Please wait..." : (isLogin ? "LOGIN" : "CREATE ACCOUNT")}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#4A3AFF', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>

      </div>
    </div>
  );
}
