import React from 'react';
import { useNavigate } from 'react-router-dom';
import LeftPromoPanel from '../components/LeftPromoPanel';
import SignupForm from '../components/SignupForm';

export const SignupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container-wrapper signup-container-wrapper">
      {/* Main Split Card Container */}
      <div className="login-card-split signup-card-split">
        <LeftPromoPanel />
        <SignupForm onSwitchToLogin={() => navigate('/login')} />
      </div>

      {/* Global Page Footer */}
      <footer className="page-footer">
        <div className="footer-copyright">
          © 2026 AquaAI. All rights reserved.
        </div>
        <div className="footer-links">
          <a href="#about"   className="footer-link" onClick={(e) => e.preventDefault()}>About Us</a>
          <a href="#privacy" className="footer-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a href="#terms"   className="footer-link" onClick={(e) => e.preventDefault()}>Terms of Use</a>
          <a href="#contact" className="footer-link" onClick={(e) => e.preventDefault()}>Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default SignupPage;
