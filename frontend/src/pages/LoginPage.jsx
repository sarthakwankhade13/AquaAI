import React from 'react';

import LeftPromoPanel from '../components/LeftPromoPanel';
import LoginForm from '../components/LoginForm';

export const LoginPage = () => {
  return (
    <div className="login-container-wrapper">

      {/* Main Split Card Container */}
      <div className="login-card-split">
        <LeftPromoPanel />
        <LoginForm />
      </div>

      {/* Global Page Footer */}
      <footer className="page-footer">
        <div className="footer-copyright">
          © 2026 AquaAI. All rights reserved.
        </div>

        <div className="footer-links">
          <a
            href="#about"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            About Us
          </a>

          <a
            href="#privacy"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Privacy Policy
          </a>

          <a
            href="#terms"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Terms of Use
          </a>

          <a
            href="#contact"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Contact
          </a>
        </div>
      </footer>

    </div>
  );
};

export default LoginPage;