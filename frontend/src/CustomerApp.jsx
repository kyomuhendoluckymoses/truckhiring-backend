import './CustomerApp.mobile.css';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import HomePage from './HomePage';
import CustomerBookingHistory from './CustomerBookingHistory';
import ChatBox from './ChatBox';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const API = "https://truckhiring-backend-ydz8.vercel.app/api";

function ChangeMapView({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);

  return null;
}

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('customerToken')
  );

  // Booking state
  const [activeBooking, setActiveBooking] = useState(null);
  const bookingFormMode = useRef(false);
  const bookingFetchRequest = useRef(0);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [truckType, setTruckType] = useState("Small Moving Truck");
  const [pickupDate, setPickupDate] = useState("");
  const [cargo, setCargo] = useState("");
  const [phone, setPhone] = useState("");

  // Map state
  const [mapCenter, setMapCenter] = useState([0.3476, 32.5825]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MTN");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Chat state
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem('customerToken'));
    };

    checkLogin();

    window.addEventListener('focus', checkLogin);

    return () => {
      window.removeEventListener('focus', checkLogin);
    };
  }, []);

  // FETCH CUSTOMER BOOKINGS
  const fetchActiveBooking = async () => {
    if (bookingFormMode.current) return;
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) return;

      const res = await fetch(`${API}/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" }, cache: "no-store"
      });

      const data = await res.json();


      if (!res.ok) {
        throw new Error(data.message || 'Could not load bookings.');
      }

      const current = data.bookings?.find(b =>
        ['Pending', 'Broadcasting', 'Accepted', 'Negotiating',
         'Confirmed', 'In Progress'].includes(b.status)
      );

      if (!current) {
        setActiveBooking(null);
        return;
      }

      const offersRes = await fetch(
        `${API}/bookings/${current.id}/offers`,
        { headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" }, cache: "no-store" }
      );

      const offersData = await offersRes.json();


      if (!offersRes.ok) {
        throw new Error(offersData.message || 'Could not load driver quotes.');
      }

      const latestOffer = (offersData.offers || []).find(
        offer => ['pending', 'accepted'].includes(String(offer.status).toLowerCase())
      );

      setActiveBooking({
        ...current,
        offeredPrice: latestOffer ? Number(latestOffer.price) : null,
        offerId: latestOffer?.id || null,
        driverName: latestOffer?.driverName || current.driverName,
        driverPhone: latestOffer?.driverPhone || current.driverPhone
      });

    } catch (err) {
      console.error('CUSTOMER BOOKING ERROR:', err);
    }
  };

  // LOAD BOOKING WHEN OPENING BOOK TAB
  useEffect(() => {
    if (activeTab === 'book') {
      fetchActiveBooking();
    }
  }, [activeTab]);

  // AUTO REFRESH CUSTOMER BOOKING
  useEffect(() => {
    if (activeTab !== 'book') return;

    const interval = setInterval(() => {
      fetchActiveBooking();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // GET GPS LOCATION
  const getGps = () => {
    setGpsStatus("Getting your location...");

    if (!navigator.geolocation) {
      setGpsStatus("GPS not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        setMapCenter([newLat, newLng]);

        setPickup(
          `GPS: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`
        );

        setGpsStatus("✅ GPS Captured!");
      },
      () => {
        setGpsStatus("❌ Please allow location access.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  // SEARCH LOCATION
  const searchLocation = async (e) => {
    e.preventDefault();

    if (!searchQuery) return;

    setGpsStatus("Searching...");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );

      const data = await res.json();


      if (data.length > 0) {
        setMapCenter([
          parseFloat(data[0].lat),
          parseFloat(data[0].lon)
        ]);

        setGpsStatus(`✅ Found: ${data[0].display_name}`);
      } else {
        setGpsStatus("❌ Location not found.");
      }

    } catch (err) {
      console.error(err);
      setGpsStatus("❌ Search error.");
    }
  };

  // SUBMIT CUSTOMER BOOKING
  const submitBooking = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem('customerToken');

      if (!token) {
        setMessage('Please log in before booking.');
        return;
      }

      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
          pickupLongitude: mapCenter[1]
        })
      });

      const data = await res.json();


      if (!res.ok) {
        throw new Error(data.message || 'Error creating booking.');
      }

      setMessage(
        "Booking created successfully! Waiting for driver quotes."
      );

      bookingFormMode.current = false;
      await fetchActiveBooking();

    } catch (err) {
      console.error('BOOKING SUBMISSION ERROR:', err);
      setMessage(err.message || "Network error.");

    } finally {
      setLoading(false);
    }
  };

  // CUSTOMER ACCEPTS DRIVER PRICE BEFORE PAYMENT
  const handleConfirmPrice = async (bookingId) => {
    if (!bookingId || !activeBooking?.offerId) {
      alert("Driver offer not found. Please refresh and try again.");
      return;
    }

    try {
      const token = localStorage.getItem("customerToken");

      const res = await fetch(
        `${API}/bookings/${bookingId}/accept-offer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            offerId: activeBooking.offerId
          })
        }
      );

      const data = await res.json();


      if (!res.ok) {
        throw new Error(data.message || "Could not accept driver offer.");
      }

      setActiveBooking(prev => ({
        ...prev,
        status: 'Confirmed'
      }));

      setShowPayment(true);

    } catch (err) {
      console.error("ACCEPT OFFER ERROR:", err);
      alert(err.message || "Could not accept driver offer.");
    }
  };

  // CUSTOMER CONFIRMS DRIVER PRICE AND PAYMENT
  const handleProcessPayment = async (e) => {
    e.preventDefault();

    if (!activeBooking) return;

    setProcessingPayment(true);

    try {
      const token = localStorage.getItem("customerToken");

      const res = await fetch(
        `${API}/bookings/${activeBooking.id}/choose-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentMethod: paymentMethod,
            paymentPhone: paymentPhone
          })
        }
      );

      const data = await res.json();


      if (!res.ok) {
        throw new Error(data.message || "Payment failed.");
      }

      setShowPayment(false);

      alert(
        "Price confirmed successfully. Your booking has been updated."
      );

      await fetchActiveBooking();

    } catch (err) {
      console.error('PAYMENT ERROR:', err);
      alert(err.message || "Payment failed. Please try again.");

    } finally {
      setProcessingPayment(false);
    }
  };

  // COMPLETE TRIP
  const handleCompleteTrip = async () => {
    try {
      const token = localStorage.getItem("customerToken");

      const res = await fetch(
        `${API}/bookings/${activeBooking.id}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        throw new Error("Could not complete trip.");
      }

      setActiveBooking(null);

      setMessage(
        "Trip completed! You can now book a new truck."
      );

      setPickup("");
      setDestination("");
      setPickupDate("");
      setCargo("");
      setPhone("");

    } catch (err) {
      console.error(err);
      setMessage(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#F8FAFC'
      }}
    >

      {/* PAYMENT MODAL */}
      {showPayment && activeBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '24px',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}
          >
            <h2 style={{ color: '#071D3A' }}>
              Confirm Payment
            </h2>

            <p style={{ color: '#64748B' }}>
              Driver's price:
              <strong>
                {' '}UGX {activeBooking.offeredPrice}
              </strong>
            </p>

            <form onSubmit={handleProcessPayment}>

              <div style={{ marginBottom: '15px' }}>
                <label>Payment Method</label>

                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '5px'
                  }}
                >
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Airtel">Airtel Money</option>
                </select>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label>Phone Number</label>

                <input
                  type="text"
                  value={paymentPhone}
                  onChange={e => setPaymentPhone(e.target.value)}
                  required
                  placeholder="e.g. 0771234567"
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={processingPayment}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                {processingPayment
                  ? "Processing..."
                  : `Confirm UGX ${activeBooking.offeredPrice}`}
              </button>

              <button
                type="button"
                onClick={() => setShowPayment(false)}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

            </form>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <header className="customer-header"
        style={{
          backgroundColor: '#2D1B69',
          color: 'white',
          padding: '15px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h2
          style={{ margin: 0, cursor: 'pointer' }}
          onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
        >
          Lucky Movers
        </h2>

        <button className="customer-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation menu">
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={"customer-nav " + (mobileMenuOpen ? "is-open" : "")}
          style={{
            display: 'flex',
            gap: '30px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >

          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'home' ? '#FFA500' : 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Home
          </button>

          <button
            onClick={() => {
              if (!isLoggedIn) {
                alert("Please login or create an account first.");
                window.location.href = '/login';
              } else {
                setActiveTab('book');
                setMobileMenuOpen(false);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'book' ? '#FFA500' : 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Book a Truck
          </button>

          <button
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'history' ? '#FFA500' : 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            My History
          </button>

          {isLoggedIn ? (
            <button
              onClick={() => {
                localStorage.removeItem('customerToken');
                window.location.href = '/';
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                padding: '8px 16px',
                backgroundColor: '#FFA500',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Login / Sign Up
            </button>
          )}

        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px'
        }}
      >

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <HomePage
            onBook={() => {
              if (!isLoggedIn) {
                alert("Please login or create an account first.");
                window.location.href = '/login';
              } else {
                setActiveTab('book');
                setMobileMenuOpen(false);
              }
            }}
          />
        )}

        {/* BOOK TAB */}
        {activeTab === 'book' && (
          <div>

            {message && (
              <div
                style={{
                  padding: '15px',
                  backgroundColor: message.toLowerCase().includes('error')
                    ? '#FEF2F2'
                    : '#ECFDF5',
                  color: message.toLowerCase().includes('error')
                    ? '#EF4444'
                    : '#059669',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontWeight: 'bold'
                }}
              >
                {message}
              </div>
            )}

            {activeBooking ? (

              <div
                style={{
                  backgroundColor: 'white',
                  padding: '40px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}
              >

                <h2 style={{ color: '#071D3A' }}>
                  Your Current Booking
                </h2>

                <p style={{ fontSize: '18px', color: '#64748B' }}>
                  <strong>From:</strong> {activeBooking.pickupLocation}
                  <br />
                  <strong>To:</strong> {activeBooking.destination}
                </p>

                <div
                  style={{
                    margin: '20px 0',
                    padding: '10px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    display: 'inline-block',
                    fontWeight: 'bold'
                  }}
                >
                  Status: {activeBooking.status}
                </div>

                {/* DRIVER PRICE AND BOOKING CONFIRMATION */}
{activeBooking.status === 'Confirmed' ? (
  <div
    style={{
      marginTop: '30px',
      padding: '25px',
      backgroundColor: '#F0FDF4',
      border: '2px solid #16A34A',
      borderRadius: '15px'
    }}
  >
    <h3 style={{ color: '#166534' }}>
      Booking Confirmed!
    </h3>

    <p style={{ color: '#166534' }}>
      Your driver's price has been accepted.
    </p>

    <h2 style={{ color: '#15803D', fontSize: '28px' }}>
      UGX {
        activeBooking.offeredPrice ??
        activeBooking.agreedPrice ??
        activeBooking.driverCounterPrice ??
        'Price unavailable'
      }
    </h2>

    <p><strong>Driver:</strong> {activeBooking.driverName || 'Assigned driver'}</p>
    <p><strong>Phone:</strong> {activeBooking.driverPhone || 'Not available'}</p>
    <p><strong>Pickup:</strong> {activeBooking.pickupLocation}</p>
    <p><strong>Destination:</strong> {activeBooking.destination}</p>
    <p><strong>Payment method:</strong> {activeBooking.paymentMethod || 'Not selected yet'}</p>

    <p style={{ color: '#166534', fontWeight: 'bold' }}>
      Your booking is confirmed. Keep this information for your trip.
    </p>
  </div>
) : activeBooking.offeredPrice != null &&
  activeBooking.offeredPrice !== '' ? (
  <div
    style={{
      marginTop: '30px',
      padding: '20px',
      border: '2px solid #4A3AFF',
      borderRadius: '15px'
    }}
  >
    <h3 style={{ color: '#071D3A' }}>
      Driver Quote Received!
    </h3>

    <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>
      UGX {activeBooking.offeredPrice}
    </p>

    {activeBooking.status === 'Negotiating' && (
      <button onClick={() => handleConfirmPrice(activeBooking.id)}>
        Confirm Price & Book Driver
      </button>
    )}
  </div>
) : (
  <div
    style={{
      marginTop: '30px',
      padding: '20px',
      backgroundColor: '#ffedd5',
      color: '#9a3412',
      borderRadius: '15px'
    }}
  >
    <p style={{ fontWeight: 'bold' }}>
      Waiting for driver quotes...
    </p>
    <p style={{ fontSize: '14px' }}>
      You will see the price here once a driver sends a quote.
    </p>
  </div>
)}                

              <button
  onClick={() => {
    bookingFormMode.current = true;
    setActiveBooking(null);
    setPickup("");
    setDestination("");
    setPickupDate("");
    setCargo("");
    setPhone("");
    setMessage("Start your new truck booking below.");
  }}
  style={{
    width: '100%',
    marginTop: '20px',
    padding: '12px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }}
>
  + Book Another Truck
</button>
</div>

            ) : (

              <div>

                <h1
                  style={{
                    color: '#071D3A',
                    fontSize: '32px',
                    fontWeight: '800',
                    marginBottom: '30px'
                  }}
                >
                  Book a Truck
                </h1>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '30px'
                  }}
                >

                  {/* BOOKING FORM */}
                  <div
                    style={{
                      backgroundColor: 'white',
                      padding: '30px',
                      borderRadius: '20px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                    }}
                  >

                    <form onSubmit={submitBooking}>

                      <div style={{ marginBottom: '20px' }}>
                        <label>Pickup Location</label>

                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '5px'
                          }}
                        >
                          <input
                            type="text"
                            value={pickup}
                            onChange={e => setPickup(e.target.value)}
                            required
                            placeholder="Enter pickup address"
                            style={{
                              flex: 1,
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid #E2E8F0'
                            }}
                          />

                          <button
                            type="button"
                            onClick={getGps}
                            style={{
                              padding: '12px 15px',
                              backgroundColor: '#4A3AFF',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            📍 GPS
                          </button>
                        </div>

                        {gpsStatus && (
                          <p style={{ fontSize: '12px' }}>
                            {gpsStatus}
                          </p>
                        )}
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label>Destination</label>

                        <input
                          type="text"
                          value={destination}
                          onChange={e => setDestination(e.target.value)}
                          required
                          placeholder="Enter destination address"
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #E2E8F0',
                            marginTop: '5px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '15px',
                          marginBottom: '20px'
                        }}
                      >

                        <div>
                          <label>Truck Type</label>

                          <select
                            value={truckType}
                            onChange={e => setTruckType(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '12px',
                              marginTop: '5px'
                            }}
                          >
                            <option>Small Moving Truck</option>
                            <option>Medium Truck</option>
                            <option>Large Truck</option>
                          </select>
                        </div>

                        <div>
                          <label>Pickup Date</label>

                          <input
                            type="date"
                            value={pickupDate}
                            onChange={e => setPickupDate(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '12px',
                              marginTop: '5px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label>Cargo Description</label>

                        <textarea
                          value={cargo}
                          onChange={e => setCargo(e.target.value)}
                          required
                          placeholder="Describe your cargo"
                          style={{
                            width: '100%',
                            padding: '12px',
                            marginTop: '5px',
                            height: '80px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '30px' }}>
                        <label>Contact Phone</label>

                        <input
                          type="text"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          required
                          placeholder="Enter phone number"
                          style={{
                            width: '100%',
                            padding: '12px',
                            marginTop: '5px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '15px',
                          backgroundColor: '#4A3AFF',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          cursor: 'pointer'
                        }}
                      >
                        {loading ? "Submitting..." : "Submit Booking"}
                      </button>

                    </form>
                  </div>

                  {/* MAP */}
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >

                    <div
                      style={{
                        padding: '20px',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      <h3 style={{ color: '#071D3A' }}>
                        Plan Your Route
                      </h3>

                      <form
                        onSubmit={searchLocation}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          marginTop: '10px'
                        }}
                      >
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search location"
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0'
                          }}
                        />

                        <button
                          type="submit"
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#4A3AFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold'
                          }}
                        >
                          Search
                        </button>
                      </form>
                    </div>

                    <div style={{ flex: 1, minHeight: '400px' }}>
                      <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={{
                          height: '100%',
                          width: '100%',
                          minHeight: '400px'
                        }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <ChangeMapView center={mapCenter} />

                        <Marker position={mapCenter}>
                          <Popup>Your Location</Popup>
                        </Marker>
                      </MapContainer>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <CustomerBookingHistory />
        )}

      </main>

      {/* CHAT WINDOW */}
      {showChat && activeBooking && (
        <ChatBox
          bookingId={activeBooking.id}
          currentRole="customer"
          currentName="Customer"
          onClose={() => setShowChat(false)}
        />
      )}

    </div>
  );
}











