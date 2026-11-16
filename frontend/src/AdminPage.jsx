import React, { useState, useEffect } from 'react';
import ChatBox from './ChatBox';

const API = "http://localhost:3000/api";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, adminCommission: 0, driverPayout: 0, totalDrivers: 0, totalCustomers: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', email: '', phone: '', password: '', truckType: 'Small Moving Truck', truckPlate: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminKey === 'luckymoses') {
      localStorage.setItem('adminKey', adminKey);
      setIsAuthenticated(true);
    } else {
      alert("Invalid Admin Key. Try 'luckymoses'.");
    }
  };

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${adminKey}` };
      
      const bookingsRes = await fetch(`${API}/bookings`, { headers });
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData.bookings || []);

      const driversRes = await fetch(`${API}/admin/drivers`, { headers });
      const driversData = await driversRes.json();
      setDrivers(driversData.drivers || []);

      const statsRes = await fetch(`${API}/admin/stats`, { headers });
      const statsData = await statsRes.json();
      setStats(statsData);

      setLoading(false);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleRegisterDriver = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminKey}` },
        body: JSON.stringify(newDriver)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Driver registered successfully!");
        setShowRegisterForm(false);
        setNewDriver({ name: '', email: '', phone: '', password: '', truckType: 'Small Moving Truck', truckPlate: '' });
        fetchData();
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (err) { 
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver? They will no longer be able to log in.")) return;
    try {
      const res = await fetch(`${API}/admin/drivers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminKey}` }
      });
      if (res.ok) {
        alert("Driver deleted and blocked.");
        fetchData();
      } else {
        alert("Could not delete driver.");
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '350px' }}>
          <h2 style={{ textAlign: 'center', color: '#071D3A' }}>Admin Login</h2>
          <input type="password" placeholder="Enter Admin Key" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} required style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#071D3A', color: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Lucky Movers Admin</h2>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ background: 'none', border: 'none', color: activeTab === 'overview' ? '#FFA500' : 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Overview</button>
          <button onClick={() => setActiveTab('bookings')} style={{ background: 'none', border: 'none', color: activeTab === 'bookings' ? '#FFA500' : 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>All Bookings</button>
          <button onClick={() => setActiveTab('drivers')} style={{ background: 'none', border: 'none', color: activeTab === 'drivers' ? '#FFA500' : 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Registered Drivers</button>
          <button onClick={() => { localStorage.removeItem('adminKey'); setIsAuthenticated(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Logout</button>
        </nav>
      </header>

      <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: '#071D3A', marginBottom: '30px' }}>Financial Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#64748B', fontSize: '14px', textTransform: 'uppercase' }}>Total Revenue</h3>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#071D3A' }}>UGX {Number(stats.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderLeft: '6px solid #FFA500' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#64748B', fontSize: '14px', textTransform: 'uppercase' }}>Admin Commission (10%)</h3>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#FFA500' }}>UGX {Number(stats.adminCommission || 0).toLocaleString()}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderLeft: '6px solid #10b981' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#64748B', fontSize: '14px', textTransform: 'uppercase' }}>Driver Payout (90%)</h3>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>UGX {Number(stats.driverPayout || 0).toLocaleString()}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#64748B', fontSize: '14px', textTransform: 'uppercase' }}>Total Bookings</h3>
                <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#071D3A' }}>{stats.totalBookings || 0}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#64748B', fontSize: '14px', textTransform: 'uppercase' }}>Registered Drivers</h3>
                <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#4A3AFF' }}>{stats.totalDrivers || 0}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#64748B', fontSize: '14px', textTransform: 'uppercase' }}>Registered Customers</h3>
                <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#FFA500' }}>{stats.totalCustomers || 0}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ color: '#071D3A', marginBottom: '30px' }}>All Bookings</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748B' }}>ID</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748B' }}>Customer</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748B' }}>Route</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748B' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748B' }}>Price</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748B' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>#{b.id}</td>
                      <td style={{ padding: '15px' }}>{b.customerName || 'Unknown'}</td>
                      <td style={{ padding: '15px', color: '#64748B' }}>{b.pickupLocation} → {b.destination}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ backgroundColor: b.status === 'Accepted' ? '#dcfce7' : b.status === 'Negotiating' ? '#ffedd5' : '#dbeafe', color: b.status === 'Accepted' ? '#166534' : b.status === 'Negotiating' ? '#9a3412' : '#1e40af', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{b.status}</span>
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>UGX {b.agreedPrice || b.offeredPrice || 0}</td>
                      <td style={{ padding: '15px' }}>
                        <button onClick={() => setActiveChat({ id: b.id, name: b.customerName || 'Customer' })} style={{ padding: '8px 12px', backgroundColor: '#F0F4FF', color: '#4A3AFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💬 Chat</button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No bookings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: '#071D3A', margin: 0 }}>Registered Drivers</h2>
              <button onClick={() => setShowRegisterForm(true)} style={{ padding: '12px 20px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Register New Driver</button>
            </div>

            {showRegisterForm && (
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#071D3A' }}>Register New Driver</h3>
                <form onSubmit={handleRegisterDriver} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <input type="text" placeholder="Full Name" required value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <input type="email" placeholder="Email Address" required value={newDriver.email} onChange={e => setNewDriver({...newDriver, email: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <input type="text" placeholder="Phone Number" required value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <input type="text" placeholder="Password" required value={newDriver.password} onChange={e => setNewDriver({...newDriver, password: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <select value={newDriver.truckType} onChange={e => setNewDriver({...newDriver, truckType: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <option value="Small Moving Truck">Small Moving Truck</option>
                    <option value="Medium Truck">Medium Truck</option>
                    <option value="Large Truck">Large Truck</option>
                  </select>
                  <input type="text" placeholder="Truck Plate (Optional)" value={newDriver.truckPlate} onChange={e => setNewDriver({...newDriver, truckPlate: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{ padding: '12px 30px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save Driver</button>
                    <button type="button" onClick={() => setShowRegisterForm(false)} style={{ padding: '12px 30px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {drivers.map(d => (
                <div key={d.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#071D3A' }}>{d.name}</h3>
                    <span style={{ backgroundColor: d.availability === 'available' ? '#dcfce7' : '#FEF2F2', color: d.availability === 'available' ? '#166534' : '#EF4444', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{d.availability}</span>
                  </div>
                  <p style={{ margin: '5px 0', color: '#64748B', fontSize: '14px' }}>📞 {d.phone}</p>
                  <p style={{ margin: '5px 0', color: '#64748B', fontSize: '14px' }}>🚚 {d.truckType}</p>
                  <p style={{ margin: '5px 0 15px 0', color: '#64748B', fontSize: '14px' }}>✉️ {d.email}</p>
                  <button onClick={() => handleDeleteDriver(d.id)} style={{ width: '100%', padding: '10px', backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Delete Driver</button>
                </div>
              ))}
              {drivers.length === 0 && (
                <div style={{ gridColumn: 'span 3', backgroundColor: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center', color: '#94A3B8' }}>
                  No registered drivers found.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {activeChat && (
        <ChatBox
          bookingId={activeChat.id}
          currentRole="admin"
          currentName="Admin"
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}