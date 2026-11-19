
import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Truck, Clock, Wallet,
  MapPin, MessageCircle, CheckCircle2,
  XCircle, Menu, Bell, History, LogOut,
  Navigation, Send, UserRound, Package
} from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LuckyMoversLogo from './LuckyMoversLogo';
import ChatBox from './ChatBox';
import './DriverPage.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const API = 'https://truckhiring-backend-ydz8.vercel.app/api';

function ChangeView({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);

  return null;
}

export default function DriverPage() {
  const [token, setToken] = useState(
    localStorage.getItem('driverToken') || ''
  );

  const [driver, setDriver] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);

  const [stats, setStats] = useState({
    totalTrips: 0,
    totalEarnings: 0,
    rating: 4.9,
    acceptanceRate: 98
  });

  const [trips, setTrips] = useState([]);
  const [hiddenTrips, setHiddenTrips] = useState([]);
  const [showHiddenTrips, setShowHiddenTrips] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  // Selected booking stays visible while driver enters price.
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [price, setPrice] = useState('');

  const [truckType, setTruckType] = useState('');
  const [truckPlate, setTruckPlate] = useState('');

  const [driverLocation, setDriverLocation] = useState(null);

  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  // Safely read API responses.
  const readResponse = async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed (${response.status})`
      );
    }

    return data;
  };

  // GPS TRACKING
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS is not supported by this browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setDriverLocation([
          position.coords.latitude,
          position.coords.longitude
        ]);
        setGpsTracking(true);
        setGpsError('');
      },
      (error) => {
        setGpsTracking(false);
        setGpsError(
          error.code === 1 ? 'Location permission denied. Allow location access.' :
          error.code === 2 ? 'Current location unavailable. Check GPS.' :
          error.code === 3 ? 'GPS request timed out. Try again.' :
          'Unable to get current location.'
        );
        console.error('GPS ERROR:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  // SEND DRIVER LOCATION TO BACKEND
  useEffect(() => {
    if (!token || !gpsTracking) return;

    const sendLocation = async () => {
      try {
        await fetch(`${API}/drivers/location`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            latitude: driverLocation[0],
            longitude: driverLocation[1]
          })
        });
      } catch (error) {
        console.error('LOCATION ERROR:', error);
      }
    };

    sendLocation();

    const interval = setInterval(sendLocation, 10000);

    return () => clearInterval(interval);
  }, [token, driverLocation, gpsTracking, authHeaders]);

  // DRIVER LOGIN
  const login = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API}/drivers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await readResponse(response);

      if (!data.token) {
        throw new Error('Login did not return an authentication token.');
      }

      localStorage.setItem('driverToken', data.token);
      setToken(data.token);

      setEmail('');
      setPassword('');

      setMessage('Login successful! Loading dashboard...');

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('driverToken');

    setToken('');
    setDriver(null);
    setRequests([]);
    setTrips([]);
    setActiveTrip(null);
    setSelectedBooking(null);
    setSelectedRequest(null);
    setPrice('');

    setStats({
      totalTrips: 0,
      totalEarnings: 0,
      rating: 4.9,
      acceptanceRate: 98
    });
  };

  // LOAD DRIVER, REQUESTS, TRIPS AND STATISTICS
  const fetchAllData = useCallback(async () => {
    if (!token) return;

    try {
      const headers = authHeaders();

      const [
        driverRes,
        requestsRes,
        activeRes,
        statsRes,
        tripsRes,
        hiddenTripsRes
      ] = await Promise.all([
        fetch(`${API}/drivers/me`, { headers }),
        fetch(`${API}/bookings/driver/requests`, { headers }),
        fetch(`${API}/bookings/driver/accepted`, { headers }),
        fetch(`${API}/driver-features/stats`, { headers }),
        fetch(`${API}/driver-features/trips`, { headers }),
        fetch(`${API}/driver-features/trips/hidden`, { headers })
      ]);

      if (driverRes.status === 401) {
        logout();
        return;
      }

      const [
        driverData,
        requestsData,
        activeData,
        statsData,
        tripsData,
        hiddenTripsData
      ] = await Promise.all([
        readResponse(driverRes),
        readResponse(requestsRes),
        readResponse(activeRes),
        readResponse(statsRes),
        readResponse(tripsRes),
        readResponse(hiddenTripsRes)
      ]);

      const d = driverData.driver || driverData;

      if (d && d.id) {
        setDriver(d);
        setIsOnline(d.availability === 'available');
        setTruckType(d.truckType || '');
        setTruckPlate(d.truckPlate || '');
      }

      // Do not remove the selected booking while entering its price.
      if (!selectedBooking) {
        setRequests(requestsData.requests || []);
      }

      const bookings = activeData.bookings || [];

      const active = bookings.find(
        booking =>
          booking.status === 'Accepted' ||
          booking.status === 'In Progress' ||
          booking.status === 'Confirmed'
      );

      setActiveTrip(active || null);

      setStats({
        totalTrips: Number(statsData.totalTrips) || 0,
        totalEarnings: Number(statsData.totalEarnings) || 0,
        rating: Number(statsData.rating) || 4.9,
        acceptanceRate: Number(statsData.acceptanceRate) || 98
      });

      setTrips(tripsData.trips || []);
      setHiddenTrips(hiddenTripsData.trips || []);

    } catch (error) {
      console.error('DRIVER DATA ERROR:', error);
      setMessage(error.message);
    }
  }, [token, authHeaders, selectedBooking]);

  // INITIAL LOAD
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token, fetchAllData]);

  // AUTOMATIC REFRESH
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, fetchAllData]);

  // HIDE BOOKING FROM DRIVER HISTORY
  const handleHideTrip = async (trip) => {
    try {
      const response = await fetch(
        `${API}/driver-features/${trip.id}/hide`,
        {
          method: 'POST',
          headers: authHeaders()
        }
      );

      const data = await readResponse(response);
      setMessage(data.message || 'Booking hidden successfully.');
      await fetchAllData();
    } catch (error) {
      setMessage(error.message || 'Could not hide booking.');
    }
  };

  // RESTORE BOOKING TO DRIVER HISTORY
  const handleRestoreTrip = async (trip) => {
    try {
      const response = await fetch(
        `${API}/driver-features/${trip.id}/restore`,
        {
          method: 'POST',
          headers: authHeaders()
        }
      );

      const data = await readResponse(response);
      setMessage(data.message || 'Booking restored successfully.');
      await fetchAllData();
    } catch (error) {
      setMessage(error.message || 'Could not restore booking.');
    }
  };
  // ACCEPT BOOKING
  const handleAccept = async (booking) => {
    const bookingId =
      typeof booking === 'object'
        ? (booking.bookingId ?? booking.id)
        : booking;

    if (!bookingId) {
      setMessage('Booking ID is missing.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `${API}/bookings/${bookingId}/accept-driver`,
        {
          method: 'POST',
          headers: authHeaders()
        }
      );

      const data = await readResponse(response);

      setSelectedBooking(bookingId);

      setSelectedRequest(
        typeof booking === 'object' ? booking : null
      );

      setPrice('');

      setRequests(previous =>
        previous.filter(
          request =>
            String(request.bookingId ?? request.id) !==
            String(bookingId)
        )
      );

      setMessage(
        data.message || 'Booking accepted! Enter your transport price.'
      );

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // REJECT BOOKING
  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `${API}/bookings/${bookingId}/reject-driver`,
        {
          method: 'POST',
          headers: authHeaders()
        }
      );

      const data = await readResponse(response);

      setRequests(previous =>
        previous.filter(
          request =>
            String(request.bookingId ?? request.id) !==
            String(bookingId)
        )
      );

      setMessage(
        data.message || 'Booking rejected. The system will try the next driver.'
      );

      await fetchAllData();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // SEND DRIVER PRICE
  const handleSendPrice = async (e) => {
    e.preventDefault();

    if (!selectedBooking) {
      setMessage('No booking selected.');
      return;
    }

    const amount = Number(price);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Please enter a valid price greater than zero.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `${API}/bookings/${selectedBooking}/offer`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            price: amount,
            message: 'Transport price from Lucky Movers driver'
          })
        }
      );

      const data = await readResponse(response);

      setMessage(
        data.message || 'Price successfully sent to the customer.'
      );

      setSelectedBooking(null);
      setSelectedRequest(null);
      setPrice('');

      await fetchAllData();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // CANCEL PRICE ENTRY
  const cancelPriceEntry = () => {
    setSelectedBooking(null);
    setSelectedRequest(null);
    setPrice('');
    fetchAllData();
  };

  // DRIVER CONFIRMS CASH RECEIVED
  const handleConfirmCash = async () => {
    const bookingId = activeTrip?.bookingId ?? activeTrip?.id;
    if (!bookingId) return setMessage('Booking ID not found.');

    setLoading(true);
    try {
      const response = await fetch(`${API}/bookings/${bookingId}/confirm-cash`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await readResponse(response);
      setMessage(data.message || 'Cash received successfully. Payment confirmed.');
      await fetchAllData();
    } catch (error) {
      setMessage(error.message || 'Could not confirm cash payment.');
    } finally {
      setLoading(false);
    }
  };

  // DRIVER STARTS TRIP
  const handleStartTrip = async () => {
    const bookingId = activeTrip?.bookingId ?? activeTrip?.id;
    if (!bookingId) return setMessage('Booking ID not found.');

    setLoading(true);
    try {
      const response = await fetch(`${API}/bookings/${bookingId}/start-trip`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await readResponse(response);
      setMessage(data.message || 'Trip started successfully.');
      await fetchAllData();
    } catch (error) {
      setMessage(error.message || 'Could not start trip.');
    } finally {
      setLoading(false);
    }
  };
  // DRIVER COMPLETES AN ACTIVE TRIP
  const handleCompleteTrip = async () => {
    const bookingId = activeTrip?.bookingId ?? activeTrip?.id;
    if (!bookingId) return setMessage('Booking ID not found.');

    if (!window.confirm("Have you delivered the customer's goods? Complete this trip?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API}/bookings/${bookingId}/complete-trip`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await readResponse(response);
      setMessage(data.message || 'Trip completed successfully.');
      await fetchAllData();
    } catch (error) {
      setMessage(error.message || 'Could not complete trip.');
    } finally {
      setLoading(false);
    }
  };
  // ONLINE / OFFLINE
  const toggleOnline = async () => {
    const newStatus = isOnline ? 'offline' : 'available';

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/drivers/me/availability`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            availability: newStatus
          })
        }
      );

      await readResponse(response);

      setIsOnline(newStatus === 'available');

      setMessage(
        newStatus === 'available'
          ? 'You are now available for bookings.'
          : 'You are now offline.'
      );

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE TRUCK DETAILS
  const handleUpdateTruck = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API}/driver-features/truck`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            truckType,
            truckPlate
          })
        }
      );

      await readResponse(response);

      alert('Truck details updated successfully!');

    } catch (error) {
      alert(error.message);
    }
  };

  // DRIVER LOGIN PAGE
  if (!token) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC'
      }}>
        <form
          onSubmit={login}
          style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            width: '350px',
            maxWidth: '90%'
          }}
        >
          <h2 style={{
            textAlign: 'center',
            color: '#071D3A'
          }}>
            Driver Login
          </h2>

          {message && (
            <p style={{ color: 'red', textAlign: 'center' }}>
              {message}
            </p>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4A3AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('driverToken');
              setToken('');
              setDriver(null);
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '10px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Clear Driver Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* LIVE MAP MODAL */}
      {showLiveMap && activeTrip && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '20px',
            width: '90%',
            height: '90%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2>Live Trip Map</h2>

              <button
                onClick={() => setShowLiveMap(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ flex: 1 }}>
              {driverLocation ? (
<MapContainer
                center={driverLocation}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ChangeView center={driverLocation} />

                <Marker position={driverLocation}>
                  <Popup>Your Location</Popup>
                </Marker>
              </MapContainer>
) : (
<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>{gpsError || 'Getting your current location...'}</div>
)}
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div style={{
        width: '100%',
        backgroundColor: '#071D3A',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <LuckyMoversLogo />

        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      </div>

      {/* SIDEBAR */}
      {isSidebarOpen && (
        <>
          <div
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 9998
            }}
          />

          <aside style={{
            width: '250px',
            backgroundColor: '#071D3A',
            color: 'white',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 9999,
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '0 20px 20px',
              borderBottom: '1px solid #1E3A5F',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <LuckyMoversLogo />

              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <nav style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              marginTop: '20px'
            }}>
              {['dashboard', 'trips', 'earnings', 'truck'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsSidebarOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    background: activeTab === tab ? '#243F65' : 'transparent',
                    border: 'none',
                    borderLeft: activeTab === tab ? '4px solid #F59E0B' : '4px solid transparent',
                    color: activeTab === tab ? '#FFFFFF' : '#CBD5E1',
                    padding: '14px 18px',
                    marginBottom: '5px',
                    borderRadius: '10px',
                    textAlign: 'left',
                    fontWeight: activeTab === tab ? '700' : '500',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
  {tab === 'dashboard' && <LayoutDashboard size={18} />}
  {tab === 'trips' && <History size={18} />}
  {tab === 'earnings' && <Wallet size={18} />}
  {tab === 'truck' && <Truck size={18} />}
  {tab === 'trips' ? 'Booking History' : tab.charAt(0).toUpperCase() + tab.slice(1)}
</span>
                </button>
              ))}
            </nav>

            <div style={{
              marginTop: 'auto',
              padding: '20px'
            }}>
              <button
                onClick={logout}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <main className="driver-main" style={{
        flex: 1,
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box',
        backgroundColor: '#F8FAFC'
      }}>

        {/* DRIVER HEADER */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              color: '#071D3A',
              fontSize: '24px'
            }}>
              Welcome, {driver?.name || 'Driver'}
            </h1>

            <p style={{
              margin: '5px 0 0',
              color: '#64748B',
              fontSize: '14px'
            }}>
              Driver
              {gpsTracking && (
                <span style={{
                  color: '#10b981',
                  marginLeft: '10px'
                }}>
                  ● GPS Active
                </span>
              )}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <button
              onClick={toggleOnline}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: isOnline ? '#10b981' : '#64748B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isOnline ? '● Available' : '○ Offline'}
            </button>

            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#4A3AFF',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {driver?.name?.charAt(0) || 'D'}
            </div>
          </div>
        </header>

        {message && (
          <div style={{
            backgroundColor: '#EEF2FF',
            color: '#3730A3',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>

            {/* STATISTICS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {[
                ['Total Trips', stats.totalTrips],
                ['Total Earnings', `UGX ${Number(stats.totalEarnings).toLocaleString()}`],
                ['Rating', `${stats.rating} ⭐`],
                ['Acceptance Rate', `${stats.acceptanceRate}%`]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <p style={{
                    margin: 0,
                    color: '#64748B',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    {label}
                  </p>

                  <h2 style={{
                    margin: '8px 0 0',
                    color: '#071D3A',
                    fontSize: '25px'
                  }}>
                    {value}
                  </h2>
                </div>
              ))}
            </div>

            {/* REQUESTS AND ACTIVE TRIP */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px'
            }}>

              {/* BOOKING REQUESTS */}
              <div>
                <h3 style={{
                  marginBottom: '20px',
                  color: '#071D3A'
                }}>
                  New Booking Requests ({requests.length})
                </h3>

                {requests.length === 0 && !selectedBooking ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    color: '#64748B',
                    textAlign: 'center'
                  }}>
                    No new requests at the moment.
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}>

                    {requests.map(req => {
                      const bookingId = req.bookingId ?? req.id;

                      return (
                        <div
                          key={bookingId}
                          style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '15px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '15px'
                          }}>
                            <div>
                              <h4 style={{
                                margin: 0,
                                color: '#071D3A'
                              }}>
                                {req.pickupLocation} → {req.destination}
                              </h4>

                              <p style={{
                                margin: '5px 0',
                                color: '#64748B',
                                fontSize: '13px'
                              }}>
                                {req.selectedTruck} • {req.cargoDescription}
                              </p>

                              {req.customerPhone && (
                                <p style={{
                                  color: '#64748B',
                                  fontSize: '13px'
                                }}>
                                  Customer: {req.customerPhone}
                                </p>
                              )}
                            </div>

                            <span style={{
                              backgroundColor: '#F0F4FF',
                              color: '#4A3AFF',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              height: 'fit-content'
                            }}>
                              New
                            </span>
                          </div>

                          {selectedBooking === bookingId ? (
                            <form
                              onSubmit={handleSendPrice}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}
                            >
                              <h4 style={{ color: '#071D3A' }}>
                                Send Your Transport Price
                              </h4>

                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="Enter price in UGX"
                                required
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  boxSizing: 'border-box'
                                }}
                              />

                              <button
                                type="submit"
                                disabled={loading}
                                style={{
                                  padding: '12px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {loading ? 'Sending...' : 'Send Price to Customer'}
                              </button>

                              <button
                                type="button"
                                onClick={cancelPriceEntry}
                                style={{
                                  padding: '10px',
                                  backgroundColor: '#64748B',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div style={{
                              display: 'flex',
                              gap: '10px'
                            }}>
                              <button
                                onClick={() => handleAccept(req)}
                                disabled={loading || !isOnline}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  padding: '13px',
                                  backgroundColor: '#15803D',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '10px',
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  boxShadow: '0 3px 8px rgba(21,128,61,0.18)'
                                }}
                              >
                                Accept
                              </button>

                              <button
                                onClick={() => handleReject(bookingId)}
                                disabled={loading}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  padding: '13px',
                                  backgroundColor: '#FFFFFF',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '10px',
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ACCEPTED BOOKING PRICE FORM */}
                {selectedBooking && (
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '24px',
                    borderRadius: '16px',
                    marginTop: '18px',
                    border: '1px solid #DCE4EE',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.07)'
                  }}>
                    <h3>Booking Accepted</h3>

                    <p>
                      Enter your transport price for the customer.
                    </p>

                    <form onSubmit={handleSendPrice}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="Price in UGX"
                        required
                        style={{
                          width: '100%',
                          padding: '15px',
                          boxSizing: 'border-box',
                          marginBottom: '16px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '10px',
                          fontSize: '16px',
                          outlineColor: '#2563EB'
                        }}
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '9px',
                          padding: '15px',
                          backgroundColor: '#15803D',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '15px',
                          cursor: 'pointer'
                        }}
                      >
                        {loading ? 'Sending...' : 'Send Price to Customer'}
                      </button>

                      <button
                        type="button"
                        onClick={cancelPriceEntry}
                        style={{
                          width: '100%',
                          padding: '10px',
                          marginTop: '10px',
                          backgroundColor: '#64748B',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px'
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* ACTIVE TRIP */}
              <div>
                <h3 style={{
                  marginBottom: '20px',
                  color: '#071D3A'
                }}>
                  Active Trip
                </h3>

                {activeTrip ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}>
                    <h4>
                      {activeTrip.pickupLocation} → {activeTrip.destination}
                    </h4>

                    <p>
                      Status: {activeTrip.status}
                    </p>
                    {activeTrip.status === 'Confirmed' &&
                      String(activeTrip.paymentMethod || '').toLowerCase() === 'cash on pickup' &&
                      activeTrip.paymentStatus !== 'Paid' && (
                        <div style={{
                          backgroundColor: '#fff7ed',
                          padding: '15px',
                          borderRadius: '10px',
                          marginBottom: '15px'
                        }}>
                          <p>Collect cash from the customer at pickup before starting the journey.</p>
                          <button
                            onClick={handleConfirmCash}
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '12px',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 'bold'
                            }}
                          >
                            ✓ Confirm Cash Received
                          </button>
                        </div>
                      )}

                    {activeTrip.status === 'Confirmed' &&
                      (String(activeTrip.paymentMethod || '').toLowerCase() !== 'cash on pickup' ||
                        activeTrip.paymentStatus === 'Paid') && (
                        <div style={{
                          backgroundColor: '#ecfdf5',
                          padding: '15px',
                          borderRadius: '10px',
                          marginBottom: '15px'
                        }}>
                          <p style={{ color: '#15803d', fontWeight: 'bold' }}>
                            ✓ Payment Received
                          </p>
                          <button
                            onClick={handleStartTrip}
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '12px',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 'bold'
                            }}
                          >
                            Start Trip →
                          </button>
                        </div>
                      )}

                    {activeTrip.status === 'In Progress' && (
<button
  onClick={handleCompleteTrip}
  disabled={loading}
  style={{
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold'
  }}
>
  {loading ? 'Completing...' : '✓ Complete Trip'}
</button>)}
<div style={{
                      height: '200px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      marginBottom: '15px'
                    }}>
                      {driverLocation ? (
<MapContainer
                        center={driverLocation}
                        zoom={15}
                        style={{
                          height: '100%',
                          width: '100%'
                        }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <ChangeView center={driverLocation} />

                        <Marker position={driverLocation}>
                          <Popup>Your Location</Popup>
                        </Marker>
                      </MapContainer>
) : (
<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>{gpsError || 'Getting your current location...'}</div>
)}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '10px'
                    }}>
                      <button
                        onClick={() => setShowLiveMap(true)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#4A3AFF',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px'
                        }}
                      >
                        Open Live Map
                      </button>

                      <button
                        onClick={() => setActiveChat({
                          id: activeTrip.id,
                          name: activeTrip.customerName || 'Customer'
                        })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px'
                        }}
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    color: '#64748B',
                    textAlign: 'center'
                  }}>
                    No active trips right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TRIPS */}
        {activeTab === 'trips' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '22px'
            }}>
              <h2 style={{
                color: '#071D3A',
                fontSize: '26px',
                fontWeight: '800',
                margin: 0
              }}>
                {showHiddenTrips ? 'Hidden Bookings' : 'Booking History'}
              </h2>

              <button
                type="button"
                onClick={() => setShowHiddenTrips(!showHiddenTrips)}
                style={{
                  padding: '11px 18px',
                  backgroundColor: '#4A3AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {showHiddenTrips
                  ? 'Show Booking History'
                  : `Show Hidden (${hiddenTrips.length})`}
              </button>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              overflowX: 'auto',
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
              padding: '8px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr>
                    <th style={{ padding: '15px' }}>ID</th>
                    <th style={{ padding: '15px' }}>Route</th>
                    <th style={{ padding: '15px' }}>Status</th>
                    <th style={{ padding: '15px' }}>Price</th>
                    <th style={{ padding: '15px' }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {(showHiddenTrips ? hiddenTrips : trips).map(trip => (
                    <tr key={trip.id}>
                      <td style={{ padding: '15px' }}>
                        #{trip.id}
                      </td>

                      <td style={{ padding: '15px' }}>
                        {trip.pickupLocation} → {trip.destination}
                      </td>

                      <td style={{ padding: '15px' }}>
                        {trip.historyStatus || trip.status}
                      </td>

                      <td style={{ padding: '15px' }}>
                        UGX {trip.agreedPrice || 0}
                      </td>

                      <td style={{ padding: '15px' }}>
                        <button
                          type="button"
                          onClick={() => showHiddenTrips
                            ? handleRestoreTrip(trip)
                            : handleHideTrip(trip)}
                          style={{
                            padding: '9px 14px',
                            backgroundColor: showHiddenTrips ? '#059669' : '#E2E8F0',
                            color: showHiddenTrips ? 'white' : '#071D3A',
                            border: 'none',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {showHiddenTrips ? 'Restore' : 'Hide'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(showHiddenTrips ? hiddenTrips : trips).length === 0 && (
                <p style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#64748B'
                }}>
                  {showHiddenTrips
                    ? 'No hidden bookings.'
                    : 'No trips found.'}
                </p>
              )}
            </div>
          </div>
        )}
        {/* TRUCK DETAILS */}
        {activeTab === 'truck' && (
          <div>
            <h2 style={{ color: '#071D3A' }}>
              My Truck Details
            </h2>

            <form
              onSubmit={handleUpdateTruck}
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '15px',
                maxWidth: '500px'
              }}
            >
              <label>Truck Type</label>

              <select
                value={truckType}
                onChange={e => setTruckType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '10px 0 20px'
                }}
              >
                <option>Small Moving Truck</option>
                <option>Medium Truck</option>
                <option>Large Truck</option>
              </select>

              <label>Truck Plate</label>

              <input
                type="text"
                value={truckPlate}
                onChange={e => setTruckPlate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '10px 0 20px',
                  boxSizing: 'border-box'
                }}
              />

              <button
                type="submit"
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#4A3AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold'
                }}
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* EARNINGS */}
        {activeTab === 'earnings' && (
          <div>
            <h2 style={{ color: '#071D3A' }}>
              My Earnings
            </h2>

            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#64748B' }}>
                Total Earnings
              </p>

              <h1 style={{
                color: '#10b981',
                fontSize: '48px'
              }}>
                UGX {Number(stats.totalEarnings || 0).toLocaleString()}
              </h1>
            </div>
          </div>
        )}

      </main>

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























