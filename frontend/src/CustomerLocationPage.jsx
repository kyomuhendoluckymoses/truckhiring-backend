import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API = "http://localhost:3000/api";

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function CustomerLocationPage({ onNav }) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [truckType, setTruckType] = useState("Small Moving Truck");
  const [pickupDate, setPickupDate] = useState("");
  const [cargo, setCargo] = useState("");
  const [phone, setPhone] = useState("");
  
  const [mapCenter, setMapCenter] = useState([0.3476, 32.5825]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchActiveBooking = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) return;
      const res = await fetch(`${API}/bookings/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const current = data.bookings?.find(b => b.status !== 'Completed' && b.status !== 'Accepted');
      setActiveBooking(current || null);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchActiveBooking(); }, []);

  const getGps = () => {
    setGpsStatus("Getting your location...");
    if (!navigator.geolocation) return setGpsStatus("GPS not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setMapCenter([newLat, newLng]);
        setPickup(`GPS: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
        setGpsStatus("✅ GPS Captured!");
      },
      () => setGpsStatus("❌ Please allow location access."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setGpsStatus("Searching...");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setGpsStatus(`✅ Found: ${data[0].display_name}`);
      } else setGpsStatus("❌ Location not found.");
    } catch (err) { setGpsStatus("❌ Search error."); }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setMessage('Please log in before booking.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customerName: "Customer",
          customerPhone: phone,
          customerEmail: "customer@luckymovers.com",
          selectedTruck: truckType,
          pickupLocation: pickup,
          destination: destination,
          pickupDate: pickupDate,
          cargoDescription: cargo,
          pickupLatitude: mapCenter[0],
          pickupLongitude: mapCenter[1],
        })
      });
      if (res.status === 201) {
        setMessage("Booking created successfully! Waiting for driver quotes.");
        fetchActiveBooking(); 
      } else {
        setMessage("Error creating booking.");
      }
    } catch (err) { setMessage("Network error."); }
    setLoading(false);
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
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ backgroundColor: '#F5F7FA', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER NAVIGATION (Only shows if you aren't wrapping it in the Layout) */}
      {onNav && (
        <header style={{ backgroundColor: '#2D1B69', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, cursor: 'pointer' }} onClick={() => onNav('home')}>Lucky Movers</h2>
          <nav style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => onNav('home')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>Home</button>
            <button onClick={() => onNav('bookings')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>My Bookings</button>
          </nav>
        </header>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
        <h1 style={{ color: '#071D3A', fontSize: '32px', fontWeight: '800', marginBottom: '10px' }}>Book a Truck</h1>
        <p style={{ color: '#64748B', marginBottom: '30px' }}>Tell us what you need to move and where it needs to go.</p>

        {message && (
          <div style={{ padding: '15px', backgroundColor: message.includes('Error') ? '#FEF2F2' : '#ECFDF5', color: message.includes('Error') ? '#EF4444' : '#059669', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* LEFT FORM */}
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            {activeBooking ? (
              <div style={{ textAlign: 'center' }}>
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
                    <button onClick={() => handleConfirmPrice(activeBooking.id)} style={{ padding: '15px 30px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
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
              <form onSubmit={submitBooking}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Pickup Location</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="text" value={pickup} onChange={e => setPickup(e.target.value)} required placeholder="Enter pickup address" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                    <button type="button" onClick={getGps} style={{ padding: '12px 15px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>📍 GPS</button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Destination</label>
                  <input type="text" value={destination} onChange={e => setDestination(e.target.value)} required placeholder="Enter destination address" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '5px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Truck Type</label>
                    <select value={truckType} onChange={e => setTruckType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '5px' }}>
                      <option>Small Moving Truck</option>
                      <option>Medium Truck</option>
                      <option>Large Truck</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Pickup Date</label>
                    <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '5px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Cargo Description</label>
                  <textarea value={cargo} onChange={e => setCargo(e.target.value)} required placeholder="Describe your cargo" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '5px', height: '80px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>Contact Phone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Enter phone number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '5px', boxSizing: 'border-box' }} />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                  {loading ? "Submitting..." : "Submit Booking"}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT MAP */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, color: '#071D3A' }}>Plan Your Route</h3>
              <form onSubmit={searchLocation} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search location" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Search</button>
              </form>
            </div>
            <div style={{ flex: 1, minHeight: '400px' }}>
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeMapView center={mapCenter} />
                <Marker position={mapCenter}><Popup>Your Location</Popup></Marker>
              </MapContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}