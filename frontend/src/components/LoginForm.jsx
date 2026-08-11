import React, { useState } from 'react';
import { Phone, Lock, Eye, EyeOff, LogIn, Sun, Moon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { loginApi } from '../services/authApi';

export const LoginForm = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!mobile.trim()) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      setErrorMessage('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi(mobile.trim(), password);
      setSuccessMessage(res.message || 'Login successful! Redirecting...');
      
      if (res.data?.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="right-form-panel">
      {/* Top Bar: Theme Switcher */}
      <div className="theme-switcher-container">
        <button
          className="theme-toggle-pill"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          type="button"
        >
          <Sun size={15} className={`theme-icon ${theme === 'light' ? 'active' : ''}`} />
          <span className="theme-divider">|</span>
          <Moon size={15} className={`theme-icon ${theme === 'dark' ? 'active' : ''}`} />
        </button>
      </div>

      {/* Main Form Content */}
      <div className="form-content-wrapper">
        <div className="form-header">
          <h2 className="form-title">
            Welcome to <span className="form-title-blue">AquaAI</span>
          </h2>
          <p className="form-subtitle">Login to access your dashboard</p>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="alert-box alert-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="alert-box alert-success" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Mobile Number Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="mobileInput">
              Mobile Number
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix">
                <Phone size={18} />
              </span>
              <input
                id="mobileInput"
                type="tel"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                className="input-field"
                placeholder="Enter your 10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="label-row">
              <label className="form-label" htmlFor="passwordInput">
                Password
              </label>
              <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </div>
            <div className="input-with-icon">
              <span className="input-icon-prefix">
                <Lock size={18} />
              </span>
              <input
                id="passwordInput"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-toggle-suffix"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="remember-row">
            <input
              type="checkbox"
              id="rememberMe"
              className="custom-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" className="remember-label">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary-login" disabled={loading}>
            <LogIn size={18} />
            <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="divider-container">
          <div className="divider-line"></div>
          <span className="divider-text">or</span>
          <div className="divider-line"></div>
        </div>

        {/* Google OAuth Button */}
        <button type="button" className="btn-google">
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Login with Google</span>
        </button>

        {/* Sign Up Link */}
        <div className="signup-row">
          <span>Don't have an account?</span>
          <a href="/signup" className="signup-link" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
