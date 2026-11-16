import React, { useState, useEffect } from 'react';
import CustomerLocationPage from './CustomerLocationPage';

const API = "http://localhost:3000/api";

export default function CustomerWebDashboard() {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    pickupLocation: '', destination: '', selectedTruck: 'Small Moving Truck', pickupDate: '', cargoDescription: '', contactPhone: '',
    customerName: 'Test Customer', customerEmail: 'customer@test.com'
  });
  const [message, setMessage] = useState('');

  const fetchActiveBooking = async () => {
    try {
      const token = localStorage.getItem("customerToken");
      const res = await fetch(`${API}/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const current = data.bookings?.find(b => b.status !== 'Completed' && b.status !== 'Accepted');
      setActiveBooking(current || null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBooking();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("customerToken");
      const payload = { ...formData, customerPhone: formData.contactPhone };
      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setMessage('Booking created successfully! Waiting for driver quotes.');
        fetchActiveBooking();
      } else {
        setMessage('Error creating booking.');
      }
    } catch (err) {
      setMessage('Error creating booking.');
    }
  };

  const handleConfirmPrice = async (bookingId) => {
    try {
      const token = localStorage.getItem("customerToken");
      const res = await fetch(`${API}/bookings/${bookingId}/confirm-price`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Price confirmed! Your driver is on the way.");
        fetchActiveBooking();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '40px', display: 'flex', gap: '30px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* LEFT COLUMN: FORM OR ACTIVE BOOKING */}
      <div style={{ flex: 1 }}>
        {message && <div style={{ backgroundColor: message.includes('Error') ? '#fee2e2' : '#dcfce7', color: message.includes('Error') ? '#991b1b' : '#166534', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>{message}</div>}

        {activeBooking ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <h2 style={{ color: '#071D3A' }}>Your Current Booking</h2>
            <p style={{ fontSize: '18px', color: '#64748B' }}>
              <strong>From:</strong> {activeBooking.pickupLocation} <br/>
              <strong>To:</strong> {activeBooking.destination}
            </p>
            <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px', display: 'inline-block', fontWeight: 'bold' }}>
              Status: {activeBooking.status}
            </div>

            {activeBooking.status === 'Negotiating' && activeBooking.offeredPrice ? (
              <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #4A3AFF', borderRadius: '15px' }}>
                <h3 style={{ color: '#071D3A' }}>Driver has sent a quote!</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669', margin: '10px 0' }}>UGX {activeBooking.offeredPrice}</p>
                <button 
                  onClick={() => handleConfirmPrice(activeBooking.id)}
                  style={{ padding: '15px 30px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
                >
                  Accept Price & Book Driver
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ffedd5', color: '#9a3412', borderRadius: '15px' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Waiting for driver quotes...</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>You will see the price here once a driver accepts your job.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#071D3A' }}>Book a Truck</h2>
            <p style={{ color: '#64748B', marginBottom: '30px' }}>Tell us what you need to move.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Pickup Location" required value={formData.pickupLocation} onChange={e => setFormData({...formData, pickupLocation: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Destination" required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <select value={formData.selectedTruck} onChange={e => setFormData({...formData, selectedTruck: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="Small Moving Truck">Small Moving Truck</option>
                  <option value="Medium Moving Truck">Medium Moving Truck</option>
                </select>
                <input type="date" required value={formData.pickupDate} onChange={e => setFormData({...formData, pickupDate: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <textarea placeholder="Cargo Description" required value={formData.cargoDescription} onChange={e => setFormData({...formData, cargoDescription: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }} />
              <input type="text" placeholder="Contact Phone" required value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              
              <button type="submit" style={{ padding: '15px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                Submit Booking
              </button>
            </form>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: MAP */}
      <div style={{ flex: 1 }}>
        <CustomerLocationPage />
      </div>

    </div>
  );
}