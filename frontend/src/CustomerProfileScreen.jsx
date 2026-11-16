import React, { useState, useEffect } from 'react';

const API = "http://localhost:3000/api/customers";

export default function CustomerProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/profile`);
        const data = await res.json();
        setProfile(data.customer);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: '40px', textAlign: 'center' }}>Customer not found.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: '#4A3AFF', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: 'white' }}>
          👤
        </div>
        <h3 style={{ margin: '0 0 5px 0', color: '#071D3A', fontSize: '24px' }}>{profile.name || 'Customer'}</h3>
        <p style={{ margin: '0 0 30px 0', color: '#718096' }}>Customer Account</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>PHONE</p>
            <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#071D3A', fontSize: '16px' }}>{profile.phone || 'Not set'}</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>EMAIL</p>
            <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#071D3A', fontSize: '16px' }}>{profile.email || 'Not set'}</p>
          </div>
        </div>

        <button style={{ width: '100%', padding: '15px', marginTop: '30px', backgroundColor: '#FEF2F2', color: '#ef4444', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
