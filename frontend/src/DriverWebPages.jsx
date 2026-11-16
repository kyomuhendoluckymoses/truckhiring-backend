import React, { useState, useEffect } from 'react';
import ChatBox from './ChatBox';
import DriverProfileWeb from './DriverProfileWeb';

const API = "http://localhost:3000/api/bookings";

export default function DriverWebPages({ activeTab }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [price, setPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('I can do this job');

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("driverToken");
      const res = await fetch(`${API}/driver/accepted`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(data.bookings || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchBookings();
  };

  const handleSendPrice = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !price || Number(price) <= 0) {
      alert('Enter a valid price in UGX.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("driverToken");
      const res = await fetch(`${API}/${selectedBooking}/offer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ price: Number(price), message: offerMessage })
      });
      if (!res.ok) throw new Error('Could not send price.');
      alert('Your price has been sent to the customer.');
      setSelectedBooking(null);
      setPrice('');
      fetchBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'profile') {
    return <DriverProfileWeb />;
  }

  if (activeTab === 'bookings') {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ color: '#071D3A', fontSize: '28px', margin: 0 }}>My Bookings</h2>
            <p style={{ color: '#718096', margin: '5px 0 0 0', fontSize: '14px' }}>Manage your completed and active trips</p>
          </div>
          <div style={{ backgroundColor: '#F5F7FA', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', color: '#4A3AFF' }}>
            {bookings.length} Bookings
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>Loading...</div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>📋</div>
            <h3 style={{ color: '#071D3A', margin: 0 }}>No bookings yet</h3>
            <p style={{ color: '#718096', marginTop: '10px' }}>When you accept jobs, they will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {bookings.map((b, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#071D3A', fontSize: '18px' }}>Booking #{b.id}</h3>
                      <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '13px' }}>{b.pickupDate || 'Date not set'}</p>
                    </div>
                    <span style={{ 
                      backgroundColor: b.status === 'Confirmed' ? '#dcfce7' : b.status === 'Completed' ? '#dbeafe' : '#ffedd5',
                      color: b.status === 'Confirmed' ? '#166534' : b.status === 'Completed' ? '#1e40af' : '#9a3412',
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                    }}>
                      {b.status}
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                      <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{b.pickupLocation}</span>
                    </div>
                    <div style={{ width: '2px', height: '15px', backgroundColor: '#cbd5e1', marginLeft: '4px', marginBottom: '10px' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                      <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{b.destination}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#071D3A', fontSize: '14px' }}>{b.customerName || 'Unknown'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#071D3A', fontSize: '16px' }}>UGX {b.agreedPrice || 0}</p>
                    </div>
                  </div>
                </div>

                {selectedBooking === b.id ? (
                  <form onSubmit={handleSendPrice} style={{ backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#071D3A' }}>Enter your price (UGX)</h4>
                    <input
                      type="number"
                      min="1"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Enter price"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }}
                    />
                    <textarea
                      value={offerMessage}
                      onChange={e => setOfferMessage(e.target.value)}
                      placeholder="Message to customer"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {loading ? 'Sending...' : 'Send Price'}
                      </button>
                      <button type="button" onClick={() => setSelectedBooking(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#64748B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => setSelectedBooking(b.id)} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      💰 Send Price to Customer
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setActiveChat({ id: b.id, name: b.customerName || 'Customer' })} style={{ flex: 1, padding: '12px', backgroundColor: '#F0F4FF', color: '#4A3AFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        💬 Chat
                      </button>
                      <button onClick={() => deleteBooking(b.id)} style={{ flex: 1, padding: '12px', backgroundColor: '#FEF2F2', color: '#ef4444', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHAT WINDOW */}
        {activeChat && (
          <ChatBox
            bookingId={activeChat.id}
            currentRole="driver"
            currentName="Driver"
            onClose={() => setActiveChat(null)}
          />
        )}
      </div>
    );
  }

  return null;
}