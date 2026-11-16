import React, { useState, useEffect } from 'react';

const API = "http://localhost:3000/api/bookings";

export default function DriverProfileWeb({ driverId }) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const res = await fetch(`${API}/driver/info?driverId=${driverId}`);
        if (res.status === 200) {
          const data = await res.json();
          setDriver(data.driver);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchDriver();
  }, [driverId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#4A3AFF' }}>Loading profile...</div>;
  if (!driver) return <div style={{ padding: '40px', textAlign: 'center' }}>Driver not found.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* HERO HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4A3AFF 100%)', borderRadius: '24px', padding: '40px', color: 'white', display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px', boxShadow: '0 20px 40px rgba(74, 58, 255, 0.2)' }}>
        <div style={{ width: '120px', height: '120px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', backdropFilter: 'blur(10px)', border: '3px solid rgba(255,255,255,0.3)' }}>
          👤
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ backgroundColor: '#10B981', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>VERIFIED</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>PRO DRIVER</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '800', letterSpacing: '-0.5px' }}>{driver.name || 'Driver'}</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '16px', color: '#C7D2FE' }}>{driver.truckType || 'Professional Driver'}</p>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>⭐</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#071D3A' }}>4.8</div>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Rating</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>🚚</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#071D3A' }}>0</div>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Trips</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>💳</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#071D3A' }}>UGX 0</div>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Earned</div>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#071D3A', fontSize: '18px' }}>Contact Information</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: '#E0E7FF', padding: '12px', borderRadius: '12px', fontSize: '24px' }}>📞</div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Phone</p>
              <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#071D3A', fontSize: '16px' }}>{driver.phone || 'Not set'}</p>
            </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: '#E0E7FF', padding: '12px', borderRadius: '12px', fontSize: '24px' }}>✉️</div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Email</p>
              <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#071D3A', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.email || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LOGOUT */}
      <button style={{ width: '100%', padding: '20px', backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '16px', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
        Logout from Account
      </button>
    </div>
  );
}
