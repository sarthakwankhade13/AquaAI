import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, UserCheck,
  MapPin, Building2, Briefcase, Sun, Moon,
  AlertCircle, CheckCircle2, UserCircle2, LogIn, Building,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { signupApi } from '../services/authApi';
import { getDistricts, getTalukasByDistrict, getVillagesByTaluka } from '../services/geographyApi';

// ── Account type options mapped to role_id in the DB ──────────────────────────
const ACCOUNT_TYPES = [
  { label: 'Water Authority / Utility',  value: 2 },
  { label: 'Municipal Corporation',      value: 3 },
  { label: 'Research / Academia',        value: 4 },
  { label: 'NGO / Environmental Body',   value: 5 },
  { label: 'Individual / Citizen',       value: 6 },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const INITIAL_FORM = {
  fullName:        '',
  email:           '',
  mobile:          '',
  password:        '',
  confirmPassword: '',
  gender:          '',
  accountType:     '',
  districtId:      '',
  talukaId:        '',
  villageId:       '',
  address:         '',
  state:           'Maharashtra',
  region:          'Vidarbha',
  country:         'India',
  pinCode:         '',
  organization:    '',
  designation:     '',
  agreedToTerms:   false,
};

export const SignupForm = ({ onSwitchToLogin }) => {
  const { theme, toggleTheme } = useTheme();

  const [form, setForm]             = useState(INITIAL_FORM);
  const [showPassword, setShowPwd]  = useState(false);
  const [showConfirm,  setShowCfm]  = useState(false);
  const [loading,      setLoading]  = useState(false);
  const [errorMsg,     setErrorMsg] = useState('');
  const [successMsg,   setSuccessMsg] = useState('');

  // ── Geography Master Data State ──
  const [districts, setDistricts] = useState([]);
  const [talukas,   setTalukas]   = useState([]);
  const [villages,  setVillages]  = useState([]);

  // Fetch Vidarbha Districts on Mount
  useEffect(() => {
    getDistricts().then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setDistricts(res.data);
      }
    }).catch(() => {});
  }, []);

  // Fetch Talukas when District selected
  useEffect(() => {
    if (!form.districtId) {
      setTalukas([]);
      setVillages([]);
      setForm((prev) => ({ ...prev, talukaId: '', villageId: '' }));
      return;
    }
    getTalukasByDistrict(form.districtId).then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setTalukas(res.data);
      }
    }).catch(() => {});
  }, [form.districtId]);

  // Fetch Villages when Taluka selected
  useEffect(() => {
    if (!form.talukaId) {
      setVillages([]);
      setForm((prev) => ({ ...prev, villageId: '' }));
      return;
    }
    getVillagesByTaluka(form.talukaId).then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setVillages(res.data);
      }
    }).catch(() => {});
  }, [form.talukaId]);

  // ── Field change handler ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ── Phone — digits only ──────────────────────────────────────────────────────
  const handleMobileChange = (e) => {
    setForm((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }));
  };

  // ── Client-side validation ───────────────────────────────────────────────────
  const validate = () => {
    if (!form.fullName.trim())
      return 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'A valid email address is required.';
    if (!/^\d{10}$/.test(form.mobile))
      return 'Mobile number must be exactly 10 digits.';
    if (!form.password || form.password.length < 6)
      return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword)
      return 'Passwords do not match.';
    if (!form.gender)
      return 'Please select a gender.';
    if (!form.accountType)
      return 'Please select an account type.';
    if (!form.districtId)
      return 'Please select your District.';
    if (!form.talukaId)
      return 'Please select your Taluka.';
    if (!form.address.trim())
      return 'Street / Local Address is required.';
    if (!form.pinCode.trim())
      return 'Pin / Zip code is required.';
    if (!form.agreedToTerms)
      return 'You must agree to the Terms of Service and Privacy Policy.';
    return null;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const selectedDistObj    = districts.find((d) => String(d.id) === String(form.districtId));
    const selectedTalukaObj  = talukas.find((t) => String(t.id) === String(form.talukaId));
    const selectedVillageObj = villages.find((v) => String(v.id) === String(form.villageId));

    const distName    = selectedDistObj?.district_name || '';
    const talukaName  = selectedTalukaObj?.taluka_name || '';
    const villageName = selectedVillageObj?.village_name || '';

    // Compose the full geographical address
    const composedAddress = [
      form.address.trim(),
      villageName ? `Village: ${villageName}` : '',
      talukaName ? `Taluka: ${talukaName}` : '',
      distName ? `District: ${distName}` : '',
      'Vidarbha',
      'Maharashtra',
      'India',
      form.pinCode.trim() ? `PIN: ${form.pinCode.trim()}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const payload = {
      fullName:     form.fullName.trim(),
      email:        form.email.trim(),
      mobile:       form.mobile.trim(),
      password:     form.password,
      gender:       form.gender,
      roleId:       Number(form.accountType),
      address:      composedAddress,
      organization: form.organization.trim() || undefined,
      designation:  form.designation.trim()  || undefined,
    };

    try {
      setLoading(true);
      const res = await signupApi(payload);
      setSuccessMsg(res.message || 'Account created successfully! You can now log in.');
      setForm(INITIAL_FORM);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="right-form-panel signup-panel">
      {/* Theme Switcher */}
      <div className="theme-switcher-container">
        <button
          className="theme-toggle-pill"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          type="button"
        >
          <Sun  size={15} className={`theme-icon ${theme === 'light' ? 'active' : ''}`} />
          <span className="theme-divider">|</span>
          <Moon size={15} className={`theme-icon ${theme === 'dark'  ? 'active' : ''}`} />
        </button>
      </div>

      {/* Header */}
      <div className="signup-form-header">
        <div className="signup-avatar-icon">
          <UserCircle2 size={48} strokeWidth={1.25} color="var(--primary-blue)" />
        </div>
        <h2 className="form-title" style={{ textAlign: 'center', marginBottom: 4 }}>
          Create Your Account
        </h2>
        <p className="form-subtitle" style={{ textAlign: 'center' }}>
          Fill in the details below to get started
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="alert-box alert-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert-box alert-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="signup-form" noValidate>

        {/* ── Row 1: Full Name + (placeholder — no username in DB) ── */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="su_fullName">
              Full Name <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><User size={17} /></span>
              <input
                id="su_fullName"
                name="fullName"
                type="text"
                className="input-field"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="su_email">
              Email Address <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><Mail size={17} /></span>
              <input
                id="su_email"
                name="email"
                type="email"
                className="input-field"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>
        </div>

        {/* ── Row 2: Phone Number ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="su_mobile">
            Phone Number <span className="req-star">*</span>
          </label>
          <div className="input-with-icon phone-input-group">
            <span className="phone-country-prefix">
              <span className="fi-flag">🇮🇳</span>
              <span className="phone-dial-code">+91</span>
            </span>
            <input
              id="su_mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="input-field phone-number-input"
              placeholder="Enter phone number"
              value={form.mobile}
              onChange={handleMobileChange}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* ── Row 3: Password + Confirm Password ── */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="su_password">
              Password <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><Lock size={17} /></span>
              <input
                id="su_password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-toggle-suffix"
                onClick={() => setShowPwd((v) => !v)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="su_confirmPassword">
              Confirm Password <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><Lock size={17} /></span>
              <input
                id="su_confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className="input-field"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-toggle-suffix"
                onClick={() => setShowCfm((v) => !v)}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 4: Gender + Account Type ── */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="su_gender">
              Gender <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><UserCheck size={17} /></span>
              <select
                id="su_gender"
                name="gender"
                className="input-field select-field"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select your gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="su_accountType">
              Account Type <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><Briefcase size={17} /></span>
              <select
                id="su_accountType"
                name="accountType"
                className="input-field select-field"
                value={form.accountType}
                onChange={handleChange}
              >
                <option value="">Select account type</option>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Row 5: Organization + Designation (optional) ── */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="su_organization">
              Organization / Institution
              <span className="optional-tag"> (Optional)</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><Building2 size={17} /></span>
              <input
                id="su_organization"
                name="organization"
                type="text"
                className="input-field"
                placeholder="Enter organization or institution"
                value={form.organization}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="su_designation">
              Designation / Role
              <span className="optional-tag"> (Optional)</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><Briefcase size={17} /></span>
              <input
                id="su_designation"
                name="designation"
                type="text"
                className="input-field"
                placeholder="Enter your designation or role"
                value={form.designation}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ── Row 6: Street Address (full width) ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="su_address">
            Address <span className="req-star">*</span>
          </label>
          <div className="input-with-icon">
            <span className="input-icon-prefix"><MapPin size={17} /></span>
            <input
              id="su_address"
              name="address"
              type="text"
              className="input-field"
              placeholder="Enter your full street address"
              value={form.address}
              onChange={handleChange}
              autoComplete="street-address"
            />
          </div>
        </div>

        {/* ── Row 7: Geographical Master Selectors (District & Taluka) ── */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="su_district">
              District (Vidarbha) <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><MapPin size={17} /></span>
              <select
                id="su_district"
                name="districtId"
                className="input-field select-field"
                value={form.districtId}
                onChange={handleChange}
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.district_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="su_taluka">
              Taluka / Sub-District <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><Building size={17} /></span>
              <select
                id="su_taluka"
                name="talukaId"
                className="input-field select-field"
                value={form.talukaId}
                onChange={handleChange}
                disabled={!form.districtId}
              >
                <option value="">-- Select Taluka --</option>
                {talukas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.taluka_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Row 8: Village & Pin Code ── */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="su_village">
              Village / Gram Panchayat <span className="optional-tag"> (Optional)</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><MapPin size={17} /></span>
              <select
                id="su_village"
                name="villageId"
                className="input-field select-field"
                value={form.villageId}
                onChange={handleChange}
                disabled={!form.talukaId}
              >
                <option value="">-- Select Village --</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.village_name} {v.village_local_name ? `(${v.village_local_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="su_pinCode">
              Pin / Zip Code <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix"><MapPin size={17} /></span>
              <input
                id="su_pinCode"
                name="pinCode"
                type="text"
                inputMode="numeric"
                className="input-field"
                placeholder="Enter pin or zip code"
                value={form.pinCode}
                onChange={handleChange}
                autoComplete="postal-code"
              />
            </div>
          </div>
        </div>

        {/* ── Terms & Conditions ── */}
        <div className="terms-row">
          <input
            type="checkbox"
            id="su_terms"
            name="agreedToTerms"
            className="custom-checkbox"
            checked={form.agreedToTerms}
            onChange={handleChange}
          />
          <label htmlFor="su_terms" className="terms-label">
            I agree to the{' '}
            <a href="#terms"   className="terms-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            {' '}and{' '}
            <a href="#privacy" className="terms-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          </label>
        </div>

        {/* ── Submit Button ── */}
        <button type="submit" className="btn-primary-login" disabled={loading}>
          <UserCircle2 size={18} />
          <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
        </button>
      </form>

      {/* Divider */}
      <div className="divider-container">
        <div className="divider-line"></div>
        <span className="divider-text">or</span>
        <div className="divider-line"></div>
      </div>

      {/* Google Sign Up */}
      <button type="button" className="btn-google">
        <svg className="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Sign up with Google</span>
      </button>

      {/* Login Link */}
      <div className="signup-row">
        <span>Already have an account?</span>
        <a
          href="/login"
          className="signup-link"
          onClick={(e) => {
            if (onSwitchToLogin) { e.preventDefault(); onSwitchToLogin(); }
          }}
        >
          Login
        </a>
      </div>
    </div>
  );
};

export default SignupForm;
