import React from 'react';
import { Activity, Cpu, BarChart3, ShieldCheck, Droplet } from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'Real-time Monitoring',
    description: 'Monitor water quality in real-time.',
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    description: 'Detect anomalies and potential risks early.',
  },
  {
    icon: BarChart3,
    title: 'Smart Insights',
    description: 'Get actionable insights and reports.',
  },
  {
    icon: ShieldCheck,
    title: 'Sustainable Future',
    description: 'Support sustainable water management.',
  },
];

export const LeftPromoPanel = () => {
  return (
    <div className="left-promo-panel">
      {/* Background Glowing Water Droplet Artwork */}
      <div className="water-drop-artwork-container">
        <svg
          className="water-drop-svg"
          viewBox="0 0 500 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="dropGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#1e40af" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="dropMeshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="rippleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background Glow */}
          <circle cx="280" cy="300" r="220" fill="url(#dropGlow)" />

          {/* Concentric Water Ripples */}
          <ellipse cx="280" cy="430" rx="180" ry="30" stroke="url(#rippleGrad)" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="280" cy="430" rx="140" ry="22" stroke="url(#rippleGrad)" strokeWidth="1.5" opacity="0.8" />
          <ellipse cx="280" cy="430" rx="90" ry="14" stroke="url(#rippleGrad)" strokeWidth="1.5" opacity="0.9" />

          {/* Floating Glow Bubbles */}
          <circle cx="160" cy="460" r="4" fill="#38bdf8" opacity="0.7" />
          <circle cx="210" cy="480" r="6" fill="#60a5fa" opacity="0.5" />
          <circle cx="340" cy="470" r="3" fill="#38bdf8" opacity="0.8" />
          <circle cx="380" cy="450" r="5" fill="#93c5fd" opacity="0.6" />
          <circle cx="230" cy="440" r="2.5" fill="#ffffff" opacity="0.9" />

          {/* Main 3D Water Droplet Constellation Mesh */}
          <g transform="translate(140, 100)">
            {/* Water Drop Outer Glow Boundary */}
            <path
              d="M 140,20 C 140,20 250,210 250,280 C 250,340 200,390 140,390 C 80,390 30,340 30,280 C 30,210 140,20 140,20 Z"
              fill="rgba(14, 116, 144, 0.15)"
              stroke="url(#dropMeshGrad)"
              strokeWidth="2"
              opacity="0.85"
            />

            {/* Internal Constellation Network Lines */}
            <path d="M 140,20 L 100,120 L 180,120 Z" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
            <path d="M 100,120 L 60,200 L 140,190 L 180,120" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <path d="M 180,120 L 220,200 L 140,190" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
            <path d="M 60,200 L 50,280 L 105,270 L 140,190 Z" stroke="#60a5fa" strokeWidth="1" opacity="0.65" />
            <path d="M 140,190 L 175,270 L 230,280 L 220,200 Z" stroke="#38bdf8" strokeWidth="1" opacity="0.65" />
            <path d="M 105,270 L 70,340 L 140,360 L 175,270 Z" stroke="#60a5fa" strokeWidth="1" opacity="0.7" />
            <path d="M 175,270 L 210,340 L 140,360 Z" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
            <path d="M 105,270 L 140,360" stroke="#93c5fd" strokeWidth="1" opacity="0.8" />
            <path d="M 140,190 L 140,270 L 140,360" stroke="#38bdf8" strokeWidth="1.2" opacity="0.75" />

            {/* Constellation Nodes (Points) */}
            <circle cx="140" cy="20" r="4" fill="#ffffff" />
            <circle cx="100" cy="120" r="3.5" fill="#38bdf8" />
            <circle cx="180" cy="120" r="3.5" fill="#38bdf8" />
            <circle cx="60" cy="200" r="3.5" fill="#60a5fa" />
            <circle cx="140" cy="190" r="4" fill="#ffffff" />
            <circle cx="220" cy="200" r="3.5" fill="#60a5fa" />
            <circle cx="50" cy="280" r="3.5" fill="#38bdf8" />
            <circle cx="105" cy="270" r="3.5" fill="#93c5fd" />
            <circle cx="175" cy="270" r="3.5" fill="#93c5fd" />
            <circle cx="230" cy="280" r="3.5" fill="#38bdf8" />
            <circle cx="70" cy="340" r="3" fill="#60a5fa" />
            <circle cx="140" cy="360" r="4.5" fill="#ffffff" />
            <circle cx="210" cy="340" r="3" fill="#60a5fa" />
          </g>
        </svg>
      </div>

      <div className="left-panel-content">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-icon-box">
            <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
              <path
                d="M20 4C20 4 32 18 32 26C32 32.6274 26.6274 38 20 38C13.3726 38 8 32.6274 8 26C8 18 20 4 20 4Z"
                fill="url(#brandGrad)"
              />
              <path d="M20 12 L15 22 L25 22 Z" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
              <circle cx="20" cy="12" r="2" fill="#ffffff" />
              <circle cx="15" cy="22" r="2" fill="#ffffff" />
              <circle cx="25" cy="22" r="2" fill="#ffffff" />
              <circle cx="20" cy="30" r="2" fill="#ffffff" />
              <path d="M15 22 L20 30 L25 22" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
              <defs>
                <linearGradient id="brandGrad" x1="8" y1="4" x2="32" y2="38">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Aqua<span className="brand-title-highlight">AI</span>
            </div>
            <span className="brand-subtitle">Intelligent Water Monitoring</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">
            AI for Clean Water. <br />
            Insights for a <span className="hero-highlight">Better Tomorrow.</span>
          </h1>

          {/* Water Drop Accent Line */}
          <div className="hero-accent-line">
            <Droplet size={14} className="accent-drop-icon" fill="#38bdf8" color="#38bdf8" />
            <div className="accent-line"></div>
          </div>

          <p className="hero-description">
            AquaAI leverages AI and real-time data to monitor water quality, detect issues early, and promote sustainable water management.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="features-list">
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div className="feature-item" key={idx}>
                <div className="feature-icon-box">
                  <IconComponent size={20} />
                </div>
                <div className="feature-details">
                  <span className="feature-title">{item.title}</span>
                  <span className="feature-desc">{item.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeftPromoPanel;

