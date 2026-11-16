import React, { useState, useEffect, useRef } from 'react';

const API = "http://localhost:3000/api";

export default function ChatBox({ bookingId, currentRole, currentName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  const getAuthHeaders = () => {
    const token = currentRole === 'customer'
      ? localStorage.getItem('customerToken')
      : localStorage.getItem('driverToken');

    return {
      Authorization: `Bearer ${token}`,
      'X-Chat-Role': currentRole
    };
  };

  // Fetch messages from the backend
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/messages`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Could not load chat messages.');
      const data = await res.json();
      setMessages(data.messages || []);
      setLoading(false);
    } catch (err) { 
      console.error(err); 
    }
  };

  // Load messages on mount, and auto-refresh every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await fetch(`${API}/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          message: input
        })
      });
      setInput('');
      fetchMessages();
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      width: '380px', 
      height: '550px', 
      backgroundColor: 'white', 
      borderRadius: '20px', 
      boxShadow: '0 15px 40px rgba(0,0,0,0.2)', 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 9999, 
      overflow: 'hidden' 
    }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: '#2D1B69', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#4A3AFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            {currentRole === 'customer' ? '🚚' : '👤'}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px' }}>Chat with {currentRole === 'customer' ? 'Driver' : 'Customer'}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#10b981' }}>● Live Chat</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
        {loading ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: '#94A3B8' }}>
            <p style={{ fontSize: '30px', margin: '0 0 10px 0' }}>💬</p>
            <p>No messages yet.</p>
            <p style={{ fontSize: '13px' }}>Start the conversation by saying hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.senderRole === currentRole ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
              <div style={{ 
                maxWidth: '80%', 
                padding: '10px 15px', 
                borderRadius: '15px', 
                backgroundColor: msg.senderRole === currentRole ? '#4A3AFF' : 'white', 
                color: msg.senderRole === currentRole ? 'white' : '#071D3A', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)' 
              }}>
                <div style={{ fontSize: '10px', color: msg.senderRole === currentRole ? '#CBD5E1' : '#94A3B8', marginBottom: '3px', fontWeight: 'bold' }}>
                  {msg.senderName}
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.message}</div>
                <div style={{ fontSize: '9px', color: msg.senderRole === currentRole ? '#CBD5E1' : '#94A3B8', marginTop: '4px', textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} style={{ padding: '15px', display: 'flex', gap: '10px', borderTop: '1px solid #E2E8F0', backgroundColor: 'white' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type a message..." 
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none' }} 
        />
        <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#FFA500', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
}
