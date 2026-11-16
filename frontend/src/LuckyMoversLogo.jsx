import React from 'react';

export default function LuckyMoversLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* ICON BOX */}
      <div style={{ 
        width: '50px', 
        height: '50px', 
        background: 'linear-gradient(135deg, #6366F1 0%, #4A3AFF 100%)', 
        borderRadius: '14px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: '0 8px 16px rgba(74, 58, 255, 0.4)'
      }}>
        {/* REAL LOGO SVG (Truck) */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>

      {/* TEXT */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ 
          margin: 0, 
          color: 'white', 
          fontSize: '20px', 
          fontWeight: '900', 
          letterSpacing: '-0.5px',
          lineHeight: '1.1'
        }}>
          Lucky Movers
        </h1>
        <p style={{ 
          margin: 0, 
          color: '#A5B4FC', 
          fontSize: '11px', 
          fontWeight: '700', 
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginTop: '2px'
        }}>
          Transport & Logistics
        </p>
      </div>
    </div>
  );
}
