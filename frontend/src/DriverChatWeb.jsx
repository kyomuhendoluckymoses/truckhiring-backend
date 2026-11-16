import React, { useState, useEffect, useRef } from 'react';

const API = "http://localhost:3000/api/bookings";

export default function DriverChatWeb({ bookingId, customerName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/${bookingId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage("");

    try {
      await fetch(`${API}/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 6,
          senderType: 'driver',
          message: text
        })
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '600px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '15px', fontSize: '18px' }}>←</button>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4A3AFF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontWeight: 'bold' }}>C</div>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{customerName}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#48bb78' }}>Online</p>
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#F5F7FA' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#a0aec0' }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a0aec0' }}>No messages yet. Say hello!</p>
        ) : (
          messages.map((msg, i) => {
            const isDriver = msg.senderType === 'driver';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isDriver ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                <div style={{ maxWidth: '70%', padding: '10px 15px', borderRadius: '15px', backgroundColor: isDriver ? '#4A3AFF' : 'white', color: isDriver ? 'white' : '#071D3A', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '15px', borderTop: '1px solid #e2e8f0' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #e2e8f0', outline: 'none', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
      </form>
    </div>
  );
}
