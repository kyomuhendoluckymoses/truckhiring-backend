import React, { useState, useEffect } from 'react';

const API = "http://localhost:3000/api";

export default function CustomerBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("customerToken");
      const res = await fetch(`${API}/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(data.bookings || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDelete = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this history?")) return;
    try {
      const token = localStorage.getItem("customerToken");
      const res = await fetch(`${API}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId));
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading history...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#071D3A', fontSize: '24px' }}>My Booking History</h2>
      <p style={{ color: '#64748B', marginBottom: '20px', fontSize: '14px' }}>View your past and active trips</p>

      {bookings.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '20px', textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
          <h3 style={{ color: '#071D3A', margin: '0 0 5px 0', fontSize: '18px' }}>No bookings yet</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>When you book a truck, your trip history will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {bookings.map(b => (
            <div key={b.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderLeft: '6px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#071D3A', fontSize: '16px' }}>Trip #{b.id}</h3>
                  <p style={{ margin: '3px 0 0 0', color: '#64748B', fontSize: '13px' }}>{b.pickupDate || 'Date not set'}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ 
                    backgroundColor: b.status === 'Accepted' ? '#dcfce7' : b.status === 'Completed' ? '#dbeafe' : '#ffedd5',
                    color: b.status === 'Accepted' ? '#166534' : b.status === 'Completed' ? '#1e40af' : '#9a3412',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold'
                  }}>
                    {b.status}
                  </span>
                  <button onClick={() => handleDelete(b.id)} style={{ padding: '6px 10px', backgroundColor: '#FEF2F2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                    🗑️
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>📍 {b.pickupLocation} ➔ {b.destination}</p>
                <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}><strong>Driver:</strong> {b.driverName || 'Not assigned'}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Paid</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#071D3A' }}>UGX {b.agreedPrice || b.offeredPrice || 0}</p>
                </div>
                {(b.status === 'Accepted' || b.status === 'Completed') && (
                  <div style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                    ✅ Payment Confirmed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}