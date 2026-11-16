import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for missing marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API = "http://localhost:3000/api/bookings";
const driverId = 6;

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function DriverLiveMap() {
  const [position, setPosition] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gpsActive, setGpsActive] = useState(false);

  // Function to get real GPS
  const getRealLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setError("");
        setLoading(false);
        setGpsActive(true);
        
        // Send to backend
        fetch(`${API}/driver/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId, latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        }).catch(e => console.error(e));
      },
      (err) => {
        setError("Please allow location access in your browser.");
        setLoading(false);
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-start watching GPS
  useEffect(() => {
    getRealLocation();
    const interval = setInterval(() => {
      if (gpsActive) getRealLocation();
    }, 10000);
    return () => clearInterval(interval);
  }, [gpsActive]);

  // Fetch booking pickup
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${API}/driver/latest-booking?driverId=${driverId}`);
        if (res.status === 200) {
          const data = await res.json();
          if (data.booking) {
            setBookingId(data.booking.id);
            if (data.booking.pickupLatitude && data.booking.pickupLongitude) {
              setPickup([data.booking.pickupLatitude, data.booking.pickupLongitude]);
            }
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchBooking();
  }, []);

  return (
    <div style={{ padding: '20px', height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER WITH GPS BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#071D3A' }}>Live Map</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748B', fontSize: '14px' }}>Your real location</p>
        </div>
        <button 
          onClick={getRealLocation} 
          style={{ padding: '12px 24px', backgroundColor: '#4A3AFF', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(74, 58, 255, 0.3)' }}
        >
          📍 Use My GPS
        </button>
      </div>

      {/* STATUS BAR */}
      <div style={{ marginBottom: '10px' }}>
        {gpsActive ? (
          <div style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', display: 'inline-block' }}>
            🟢 GPS Active - {position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Waiting...'}
          </div>
        ) : (
          <div style={{ backgroundColor: '#FEF2F2', color: '#EF4444', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', display: 'inline-block' }}>
            🔴 GPS Inactive - Click "Use My GPS"
          </div>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{ backgroundColor: '#FEF2F2', color: '#EF4444', padding: '15px', borderRadius: '10px', marginBottom: '15px', fontWeight: 'bold' }}>
          ⚠️ {error}
        </div>
      )}

      {/* MAP */}
      <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
        {position ? (
          <MapContainer center={position} zoom={16} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <RecenterMap position={position} />
            <Marker position={position}>
              <Popup><strong>You are here</strong><br />{position[0].toFixed(5)}, {position[1].toFixed(5)}</Popup>
            </Marker>
            {pickup && (
              <Marker position={pickup}>
                <Popup><strong>Customer Pickup</strong><br />Booking #{bookingId}</Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA', color: '#64748B' }}>
            {loading ? "Loading location..." : "Please click 'Use My GPS' to see your location"}
          </div>
        )}
      </div>
    </div>
  );
}
