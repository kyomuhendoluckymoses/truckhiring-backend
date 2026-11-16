import React, { useState, useEffect } from 'react';
import LuckyMoversLogo from './LuckyMoversLogo';

export default function HomePage({ onBook }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586528116311-ad8ed7c508b0?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?q=80&w=2070&auto=format&fit=crop'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* HERO SECTION */}
      <div style={{ 
        position: 'relative', 
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        margin: '20px 40px 0 40px',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {slides.map((slide, index) => (
          <div key={index} style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url("${slide}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: currentSlide === index ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: 0
          }} />
        ))}

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 25, 47, 0.75)', zIndex: 1 }}></div>
        
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '0 60px', width: '100%', zIndex: 2 }}>
          
          <div style={{ marginBottom: '30px' }}>
            <LuckyMoversLogo />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#FFA500', borderRadius: '2px' }}></div>
            <span style={{ color: '#FFA500', fontWeight: 'bold', letterSpacing: '2px', fontSize: '14px' }}>CARGO & GOODS TRANSPORT</span>
          </div>

          <h1 style={{ color: 'white', fontSize: '64px', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px', maxWidth: '800px' }}>
            Your Cargo, <br /> Our Priority.
          </h1>

          <p style={{ color: '#CBD5E1', fontSize: '20px', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6' }}>
            Arrange transportation for your goods, business supplies, and deliveries across Uganda with professional drivers and reliable trucks.
          </p>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '50px', flexWrap: 'wrap' }}>
            <button onClick={onBook} style={{ padding: '16px 32px', backgroundColor: '#FFA500', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(255, 165, 0, 0.4)' }}>
              Book a Truck Now →
            </button>
            <button style={{ padding: '16px 32px', backgroundColor: 'transparent', color: 'white', border: '2px solid white', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
              View Our Services →
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>←</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: currentSlide === i ? '40px' : '15px', height: '6px', backgroundColor: currentSlide === i ? '#FFA500' : 'rgba(255,255,255,0.5)', borderRadius: '3px', cursor: 'pointer', transition: '0.3s' }} />
              ))}
            </div>
            <button onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', background: 'transparent', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>→</button>
          </div>

        </div>
      </div>

      {/* 3 SERVICE CARDS - FORCED 3 COLUMNS ON DESKTOP */}
      <div style={{ maxWidth: '1200px', margin: '-60px auto 0', padding: '0 40px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
          
          <div onClick={onBook} style={{ cursor: 'pointer', backgroundColor: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center', transition: 'transform 0.2s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FFF7ED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>🚚</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#071D3A', fontSize: '22px' }}>Hire a Truck</h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '15px', lineHeight: '1.5' }}>Move goods, house or office safely across Uganda.</p>
          </div>

          <div style={{ cursor: 'pointer', backgroundColor: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center', transition: 'transform 0.2s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>📍</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#071D3A', fontSize: '22px' }}>Track Truck</h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '15px', lineHeight: '1.5' }}>See the live location of your cargo in real-time.</p>
          </div>

          <div style={{ cursor: 'pointer', backgroundColor: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center', transition: 'transform 0.2s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>📅</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#071D3A', fontSize: '22px' }}>My Bookings</h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '15px', lineHeight: '1.5' }}>View your active and past bookings easily.</p>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#071D3A', color: 'white', padding: '60px 40px 20px', marginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '40px' }}>
          <div>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Lucky Movers</h3>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' }}>
              Your trusted partner for cargo and logistics across Uganda. We deliver safely and on time.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94A3B8', fontSize: '14px', lineHeight: '2' }}>
              <li style={{ cursor: 'pointer' }}>Home</li>
              <li style={{ cursor: 'pointer' }}>Book a Truck</li>
              <li style={{ cursor: 'pointer' }}>My Bookings</li>
              <li style={{ cursor: 'pointer' }}>Track Truck</li>
            </ul>
          </div>
          <div>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Services</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94A3B8', fontSize: '14px', lineHeight: '2' }}>
              <li>House Moving</li>
              <li>Office Relocation</li>
              <li>Cargo Transport</li>
              <li>Mechanic Services</li>
            </ul>
          </div>
          <div>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Contact Us</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94A3B8', fontSize: '14px', lineHeight: '2' }}>
              <li>📍 Kampala, Uganda</li>
              <li>📞 +256 742 502 154</li>
              <li>✉️ info@luckymovers.com</li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1E3A5F', paddingTop: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
          © {new Date().getFullYear()} Lucky Movers. All rights reserved.
        </div>
      </footer>

    </div>
  );
}