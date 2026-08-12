import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function MapPlaceholder({ activeTrips = 0 }) {
  // Static "tanker dots" for visual effect
  const dots = [
    { top: '30%', left: '25%', delay: 0 },
    { top: '45%', left: '55%', delay: 0.4 },
    { top: '60%', left: '35%', delay: 0.8 },
    { top: '25%', left: '70%', delay: 0.2 },
    { top: '70%', left: '65%', delay: 0.6 },
  ];

  return (
    <div className="adm-map-placeholder" style={{ minHeight: 280, position: 'relative' }}>
      {/* Fake route lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }}
        viewBox="0 0 400 280" preserveAspectRatio="none"
      >
        <path d="M80,100 Q160,60 240,140 T380,110" stroke="#0369a1" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        <path d="M60,180 Q140,200 220,160 T360,200" stroke="#0369a1" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        <path d="M100,60  Q200,120 300,80"           stroke="#0284c7" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
      </svg>

      {/* Animated tanker dots */}
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: d.top, left: d.left,
            animation: `map-pulse 2s ease-in-out ${d.delay}s infinite`,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(3,105,161,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(3,105,161,0.4)',
          }}>
            <Navigation size={12} color="#0369a1" />
          </div>
        </div>
      ))}

      {/* Centre label */}
      <div className="adm-map-pulse" style={{ zIndex: 2 }}>
        <MapPin size={26} color="#0369a1" />
      </div>
      <div style={{ zIndex: 2, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0c4a6e' }}>Live GPS Tracking</div>
        <div style={{ fontSize: 12, color: '#0369a1', marginTop: 4 }}>
          {activeTrips} active tankers on route · GPS integration coming soon
        </div>
      </div>
    </div>
  );
}
