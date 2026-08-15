import React, { useState, useEffect } from 'react';

import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  UserCircle2,
  Briefcase,
  Building,
  Car,
} from 'lucide-react';

import { useTheme } from "../context/ThemeContext";

import {
  signupApi,
  getRolesApi
} from "../services/authApi";

import {
  getDistricts,
  getTalukasByDistrict,
  getVillagesByTaluka
} from "../services/geographyApi";


const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Other'
];


const INITIAL_FORM = {
  fullName: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  gender: '',
  roleId: '',

  districtId: '',
  talukaId: '',
  villageId: '',

  address: '',
  pinCode: '',

  hasDrivingLicence: '',
  drivingLicenceNumber: '',

  state: 'Maharashtra',
  region: 'Vidarbha',
  country: 'India',

  agreedToTerms: false,
};


export const SignupForm = ({ onSwitchToLogin }) => {

  const {
    theme,
    toggleTheme
  } = useTheme();


  const [form, setForm] =
    useState(INITIAL_FORM);


  const [showPassword, setShowPwd] =
    useState(false);

  const [showConfirm, setShowCfm] =
    useState(false);


  const [loading, setLoading] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState('');

  const [successMsg, setSuccessMsg] =
    useState('');


  const [roles, setRoles] =
    useState([]);

  const [districts, setDistricts] =
    useState([]);

  const [talukas, setTalukas] =
    useState([]);

  const [villages, setVillages] =
    useState([]);


  /*
   * Normalize role names.
   *
   * Examples:
   * WRD_ADMIN
   * District Admin
   * Taluka Admin
   * Village Officer
   * Citizen
   * Driver
   */

  const normalizeRole = (roleName = '') => {

    return roleName
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

  };


  /*
   * Find selected role.
   */

  const selectedRole = roles.find(
    (role) =>
      String(role.role_id) ===
      String(form.roleId)
  );


  const roleName =
    normalizeRole(selectedRole?.role_name);


  /*
   * ─────────────────────────────────────────────
   * ROLE TYPES
   * ─────────────────────────────────────────────
   */

  const isWRDAdmin =
    roleName === 'WRD_ADMIN' ||
    roleName === 'WRD_ADMINISTRATOR';


  const isDistrictAdmin =
    roleName === 'DISTRICT_ADMIN' ||
    roleName === 'DISTRICTADMIN';


  const isTalukaAdmin =
    roleName === 'TALUKA_ADMIN' ||
    roleName === 'TALUKAADMIN';


  const isVillageOfficer =
    roleName === 'VILLAGE_OFFICER' ||
    roleName === 'VILLAGEOFFICER';


  const isCitizen =
    roleName === 'CITIZEN';


  const isDriver =
    roleName === 'DRIVER' ||
    roleName.includes('DRIVER');


  /*
   * ─────────────────────────────────────────────
   * FIELD REQUIREMENTS
   * ─────────────────────────────────────────────
   *
   * WRD ADMIN
   *   → No geography
   *
   * DISTRICT ADMIN
   *   → District
   *
   * TALUKA ADMIN
   *   → District
   *   → Taluka
   *
   * VILLAGE OFFICER
   *   → District
   *   → Taluka
   *   → Village
   *
   * CITIZEN
   *   → District
   *   → Taluka
   *   → Village
   *   → Address
   *
   * DRIVER
   *   → District
   *   → Taluka
   *   → Village
   *   → Address
   *   → Driving licence
   */


  const needsDistrict =
    isDistrictAdmin ||
    isTalukaAdmin ||
    isVillageOfficer ||
    isCitizen ||
    isDriver;


  const needsTaluka =
    isTalukaAdmin ||
    isVillageOfficer ||
    isCitizen ||
    isDriver;


  /*
   * IMPORTANT:
   *
   * Village Officer was missing here before.
   *
   * Now Village Officer gets:
   * District → Taluka → Village
   */

  const needsVillage =
    isVillageOfficer ||
    isCitizen ||
    isDriver;


  /*
   * Address is ONLY for Citizen and Driver.
   */

  const needsAddress =
    isCitizen ||
    isDriver;


  /*
   * ─────────────────────────────────────────────
   * LOAD ROLES + DISTRICTS
   * ─────────────────────────────────────────────
   */

  useEffect(() => {

    getRolesApi()

      .then((res) => {

        const rolesData =
          res?.data ||
          (Array.isArray(res)
            ? res
            : []);

        const filteredRoles =
          rolesData.filter(
            (role) =>
              role?.role_name &&
              !role.role_name
                .toLowerCase()
                .includes('wrd super admin')
          );

        setRoles(filteredRoles);

      })

      .catch((err) => {

        console.error(
          'Failed to fetch roles:',
          err
        );

        setRoles([]);

      });


    /*
     * Load Vidarbha districts.
     */

    getDistricts()

      .then((res) => {

        if (
          res?.success &&
          Array.isArray(res.data)
        ) {

          setDistricts(res.data);

        } else {

          setDistricts([]);

        }

      })

      .catch((err) => {

        console.error(
          'Failed to fetch districts:',
          err
        );

        setDistricts([]);

      });

  }, []);


  /*
   * ─────────────────────────────────────────────
   * LOAD TALUKAS
   * ─────────────────────────────────────────────
   *
   * Runs whenever District changes.
   */

  useEffect(() => {

    if (!form.districtId) {

      setTalukas([]);
      setVillages([]);

      return;

    }


    /*
     * Taluka is only required for:
     * Taluka Admin
     * Village Officer
     * Citizen
     * Driver
     */

    if (!needsTaluka) {

      setTalukas([]);
      setVillages([]);

      return;

    }


    getTalukasByDistrict(
      form.districtId
    )

      .then((res) => {

        if (
          res?.success &&
          Array.isArray(res.data)
        ) {

          setTalukas(res.data);

        } else {

          setTalukas([]);

        }

      })

      .catch((err) => {

        console.error(
          'Failed to fetch talukas:',
          err
        );

        setTalukas([]);

      });

  }, [
    form.districtId,
    needsTaluka
  ]);


  /*
   * ─────────────────────────────────────────────
   * LOAD VILLAGES
   * ─────────────────────────────────────────────
   *
   * Runs whenever Taluka changes.
   */

  useEffect(() => {

    if (!form.talukaId) {

      setVillages([]);

      return;

    }


    /*
     * Village is required for:
     * Village Officer
     * Citizen
     * Driver
     */

    if (!needsVillage) {

      setVillages([]);

      return;

    }


    getVillagesByTaluka(
      form.talukaId
    )

      .then((res) => {

        if (
          res?.success &&
          Array.isArray(res.data)
        ) {

          setVillages(res.data);

        } else {

          setVillages([]);

        }

      })

      .catch((err) => {

        console.error(
          'Failed to fetch villages:',
          err
        );

        setVillages([]);

      });

  }, [
    form.talukaId,
    needsVillage
  ]);


  /*
   * ─────────────────────────────────────────────
   * HANDLE FIELD CHANGES
   * ─────────────────────────────────────────────
   */

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked
    } = e.target;


    /*
     * ROLE CHANGED
     *
     * Clear old geography because
     * different roles need different fields.
     */

    if (name === 'roleId') {

      setForm((prev) => ({

        ...prev,

        roleId: value,

        districtId: '',
        talukaId: '',
        villageId: '',

        address: '',
        pinCode: '',

        hasDrivingLicence: '',
        drivingLicenceNumber: '',

      }));

      setTalukas([]);
      setVillages([]);

      return;

    }


    /*
     * DISTRICT CHANGED
     *
     * Taluka and Village become invalid.
     */

    if (name === 'districtId') {

      setForm((prev) => ({

        ...prev,

        districtId: value,

        talukaId: '',
        villageId: '',

      }));

      setTalukas([]);
      setVillages([]);

      return;

    }


    /*
     * TALUKA CHANGED
     *
     * Village becomes invalid.
     */

    if (name === 'talukaId') {

      setForm((prev) => ({

        ...prev,

        talukaId: value,

        villageId: '',

      }));

      setVillages([]);

      return;

    }


    /*
     * DRIVER LICENCE
     */

    if (
      name ===
      'hasDrivingLicence'
    ) {

      setForm((prev) => ({

        ...prev,

        hasDrivingLicence: value,

        drivingLicenceNumber:
          value === 'yes'
            ? prev.drivingLicenceNumber
            : '',

      }));

      return;

    }


    /*
     * Normal fields.
     */

    setForm((prev) => ({

      ...prev,

      [name]:
        type === 'checkbox'
          ? checked
          : value,

    }));

  };


  /*
   * Phone number.
   */

  const handleMobileChange = (e) => {

    setForm((prev) => ({

      ...prev,

      mobile:
        e.target.value
          .replace(/\D/g, '')
          .slice(0, 10),

    }));

  };


  /*
   * PIN code.
   */

  const handlePinChange = (e) => {

    setForm((prev) => ({

      ...prev,

      pinCode:
        e.target.value
          .replace(/\D/g, '')
          .slice(0, 6),

    }));

  };


  /*
   * ─────────────────────────────────────────────
   * VALIDATION
   * ─────────────────────────────────────────────
   */

  const validate = () => {

    if (!form.fullName.trim())
      return 'Full name is required.';


    if (
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(form.email)
    ) {

      return 'A valid email address is required.';

    }


    if (!/^\d{10}$/.test(form.mobile)) {

      return 'Mobile number must be exactly 10 digits.';

    }


    if (
      !form.password ||
      form.password.length < 6
    ) {

      return 'Password must be at least 6 characters.';

    }


    if (
      form.password !==
      form.confirmPassword
    ) {

      return 'Passwords do not match.';

    }


    if (!form.gender)
      return 'Please select a gender.';


    if (!form.roleId)
      return 'Please select a user role.';


    /*
     * District validation.
     */

    if (
      needsDistrict &&
      !form.districtId
    ) {

      return 'Please select your District.';

    }


    /*
     * Taluka validation.
     */

    if (
      needsTaluka &&
      !form.talukaId
    ) {

      return 'Please select your Taluka.';

    }


    /*
     * Village validation.
     */

    if (
      needsVillage &&
      !form.villageId
    ) {

      return 'Please select your Village.';

    }


    /*
     * Address only Citizen / Driver.
     */

    if (
      needsAddress &&
      !form.address.trim()
    ) {

      return 'Street / Local Address is required.';

    }


    if (
      needsAddress &&
      !/^\d{6}$/.test(form.pinCode)
    ) {

      return 'PIN code must be exactly 6 digits.';

    }


    /*
     * Driver licence validation.
     */

    if (isDriver) {

      if (!form.hasDrivingLicence) {

        return 'Please specify whether you have a driving licence.';

      }


      if (
        form.hasDrivingLicence === 'yes' &&
        !form.drivingLicenceNumber.trim()
      ) {

        return 'Driving Licence Number is required.';

      }

    }


    if (!form.agreedToTerms) {

      return 'You must agree to the Terms of Service and Privacy Policy.';

    }


    return null;

  };


  /*
   * ─────────────────────────────────────────────
   * SUBMIT
   * ─────────────────────────────────────────────
   */

  const handleSubmit = async (e) => {

    e.preventDefault();

    setErrorMsg('');
    setSuccessMsg('');


    const validationError =
      validate();


    if (validationError) {

      setErrorMsg(validationError);

      return;

    }


    /*
     * Find selected objects.
     */

    const selectedDistObj =
      districts.find(
        (d) =>
          String(d.id) ===
          String(form.districtId)
      );


    const selectedTalukaObj =
      talukas.find(
        (t) =>
          String(t.id) ===
          String(form.talukaId)
      );


    const selectedVillageObj =
      villages.find(
        (v) =>
          String(v.id) ===
          String(form.villageId)
      );


    const distName =
      selectedDistObj?.district_name ||
      '';


    const talukaName =
      selectedTalukaObj?.taluka_name ||
      '';


    const villageName =
      selectedVillageObj?.village_name ||
      '';


    /*
     * Address is ONLY created for
     * Citizen and Driver.
     */

    const composedAddress =
      needsAddress
        ? [
          form.address.trim(),

          villageName
            ? `Village: ${villageName}`
            : '',

          talukaName
            ? `Taluka: ${talukaName}`
            : '',

          distName
            ? `District: ${distName}`
            : '',

          'Vidarbha',
          'Maharashtra',
          'India',

          form.pinCode
            ? `PIN: ${form.pinCode}`
            : '',

        ]
          .filter(Boolean)
          .join(', ')
        : '';


    /*
     * Backend payload.
     *
     * Organization and Designation
     * are intentionally NOT included.
     */

    const payload = {

      fullName:
        form.fullName.trim(),

      email:
        form.email.trim(),

      mobile:
        form.mobile.trim(),

      password:
        form.password,

      gender:
        form.gender,

      roleId:
        Number(form.roleId),


      /*
       * Geography
       */

      districtId:
        needsDistrict
          ? Number(form.districtId)
          : undefined,

      talukaId:
        needsTaluka
          ? Number(form.talukaId)
          : undefined,

      villageId:
        needsVillage
          ? Number(form.villageId)
          : undefined,


      /*
       * Address
       */

      address:
        needsAddress
          ? composedAddress
          : undefined,

      pinCode:
        needsAddress
          ? form.pinCode
          : undefined,


      /*
       * Driver
       */

      hasDrivingLicence:
        isDriver
          ? form.hasDrivingLicence === 'yes'
          : undefined,

      drivingLicenceNumber:
        isDriver &&
          form.hasDrivingLicence === 'yes'
          ? form.drivingLicenceNumber.trim()
          : undefined,

    };


    /*
     * Remove undefined fields.
     */

    Object.keys(payload).forEach(
      (key) => {

        if (
          payload[key] === undefined
        ) {

          delete payload[key];

        }

      }
    );


    try {

      setLoading(true);


      const res =
        await signupApi(payload);


      setSuccessMsg(
        res.message ||
        'Account created successfully! You can now log in.'
      );


      /*
       * Reset form.
       */

      setForm(INITIAL_FORM);

      setTalukas([]);
      setVillages([]);


    } catch (err) {

      setErrorMsg(
        err.message ||
        'Registration failed. Please try again.'
      );


    } finally {

      setLoading(false);

    }

  };


  /*
   * ─────────────────────────────────────────────
   * RENDER
   * ─────────────────────────────────────────────
   */

  return (

    <div className="right-form-panel signup-panel">


      {/* Theme Switcher */}

      <div className="theme-switcher-container">

        <button
          className="theme-toggle-pill"
          onClick={toggleTheme}
          title={
            `Switch to ${theme === 'light'
              ? 'Dark'
              : 'Light'
            } Mode`
          }
          type="button"
        >

          <Sun
            size={15}
            className={
              `theme-icon ${theme === 'light'
                ? 'active'
                : ''
              }`
            }
          />

          <span className="theme-divider">
            |
          </span>

          <Moon
            size={15}
            className={
              `theme-icon ${theme === 'dark'
                ? 'active'
                : ''
              }`
            }
          />

        </button>

      </div>


      {/* Header */}

      <div className="signup-form-header">

        <div className="signup-avatar-icon">

          <UserCircle2
            size={48}
            strokeWidth={1.25}
            color="var(--primary-blue)"
          />

        </div>


        <h2
          className="form-title"
          style={{
            textAlign: 'center',
            marginBottom: 4
          }}
        >
          Create Your Account
        </h2>


        <p
          className="form-subtitle"
          style={{
            textAlign: 'center'
          }}
        >
          Fill in the details below to get started
        </p>

      </div>


      {/* Alerts */}

      {errorMsg && (

        <div
          className="alert-box alert-error"
          style={{
            marginBottom: '1rem'
          }}
        >

          <AlertCircle size={16} />

          <span>
            {errorMsg}
          </span>

        </div>

      )}


      {successMsg && (

        <div
          className="alert-box alert-success"
          style={{
            marginBottom: '1rem'
          }}
        >

          <CheckCircle2 size={16} />

          <span>
            {successMsg}
          </span>

        </div>

      )}


      <form
        onSubmit={handleSubmit}
        className="signup-form"
        noValidate
      >


        {/* ─────────────────────────────
            Full Name + Email
        ───────────────────────────── */}

        <div className="form-row-2col">

          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_fullName"
            >
              Full Name
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <User size={17} />
              </span>


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

            <label
              className="form-label"
              htmlFor="su_email"
            >
              Email Address
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <Mail size={17} />
              </span>


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


        {/* ─────────────────────────────
            Phone
        ───────────────────────────── */}

        <div className="form-group">

          <label
            className="form-label"
            htmlFor="su_mobile"
          >
            Phone Number
            <span className="req-star">
              *
            </span>
          </label>


          <div className="input-with-icon phone-input-group">

            <span className="phone-country-prefix">

              <span className="fi-flag">
                🇮🇳
              </span>

              <span className="phone-dial-code">
                +91
              </span>

            </span>


            <input
              id="su_mobile"
              name="mobile"
              type="text"
              inputMode="numeric"
              maxLength={10}
              className="input-field"
              placeholder="Enter phone number"
              value={form.mobile}
              onChange={handleMobileChange}
              autoComplete="tel"
            />

          </div>

        </div>


        {/* ─────────────────────────────
            Password + Confirm Password
        ───────────────────────────── */}

        <div className="form-row-2col">

          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_password"
            >
              Password
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <Lock size={17} />
              </span>


              <input
                id="su_password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                className="input-field"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />


              <button
                type="button"
                className="input-toggle-suffix"
                onClick={() =>
                  setShowPwd(
                    (value) => !value
                  )
                }
              >

                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}

              </button>

            </div>

          </div>


          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_confirmPassword"
            >
              Confirm Password
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <Lock size={17} />
              </span>


              <input
                id="su_confirmPassword"
                name="confirmPassword"
                type={
                  showConfirm
                    ? 'text'
                    : 'password'
                }
                className="input-field"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />


              <button
                type="button"
                className="input-toggle-suffix"
                onClick={() =>
                  setShowCfm(
                    (value) => !value
                  )
                }
              >

                {showConfirm ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}

              </button>

            </div>

          </div>

        </div>


        {/* ─────────────────────────────
            Gender + Role
        ───────────────────────────── */}

        <div className="form-row-2col">

          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_gender"
            >
              Gender
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <User size={17} />
              </span>


              <select
                id="su_gender"
                name="gender"
                className="input-field select-field"
                value={form.gender}
                onChange={handleChange}
              >

                <option value="">
                  Select your gender
                </option>


                {GENDER_OPTIONS.map(
                  (gender) => (

                    <option
                      key={gender}
                      value={gender}
                    >
                      {gender}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>


          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_roleId"
            >
              User Role
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <Briefcase size={17} />
              </span>


              <select
                id="su_roleId"
                name="roleId"
                className="input-field select-field"
                value={form.roleId}
                onChange={handleChange}
              >

                <option value="">
                  Select user role
                </option>


                {roles.map(
                  (role) => (

                    <option
                      key={role.role_id}
                      value={role.role_id}
                    >
                      {role.role_name}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        </div>


        {/* ============================================================
            GEOGRAPHY SECTION
            ============================================================ */}


        {/* District */}

        {needsDistrict && (

          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_district"
            >
              District (Vidarbha)
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <MapPin size={17} />
              </span>


              <select
                id="su_district"
                name="districtId"
                className="input-field select-field"
                value={form.districtId}
                onChange={handleChange}
              >

                <option value="">
                  -- Select District --
                </option>


                {districts.map(
                  (district) => (

                    <option
                      key={district.id}
                      value={district.id}
                    >
                      {district.district_name}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        )}


        {/* Taluka */}

        {needsTaluka && (

          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_taluka"
            >
              Taluka / Sub-District
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <Building size={17} />
              </span>


              <select
                id="su_taluka"
                name="talukaId"
                className="input-field select-field"
                value={form.talukaId}
                onChange={handleChange}
                disabled={!form.districtId}
              >

                <option value="">
                  -- Select Taluka --
                </option>


                {talukas.map(
                  (taluka) => (

                    <option
                      key={taluka.id}
                      value={taluka.id}
                    >
                      {taluka.taluka_name}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        )}


        {/* Village */}

        {needsVillage && (

          <div className="form-group">

            <label
              className="form-label"
              htmlFor="su_village"
            >
              Village / Gram Panchayat
              <span className="req-star">
                *
              </span>
            </label>


            <div className="input-with-icon">

              <span className="input-icon-prefix">
                <MapPin size={17} />
              </span>


              <select
                id="su_village"
                name="villageId"
                className="input-field select-field"
                value={form.villageId}
                onChange={handleChange}
                disabled={!form.talukaId}
              >

                <option value="">
                  -- Select Village --
                </option>


                {villages.map(
                  (village) => (

                    <option
                      key={village.id}
                      value={village.id}
                    >

                      {village.village_name}

                      {village.village_local_name
                        ? ` (${village.village_local_name})`
                        : ''}

                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        )}


        {/* ============================================================
            ADDRESS
            ONLY CITIZEN + DRIVER
            ============================================================ */}

        {needsAddress && (

          <>

            <div className="form-group">

              <label
                className="form-label"
                htmlFor="su_address"
              >
                Address
                <span className="req-star">
                  *
                </span>
              </label>


              <div className="input-with-icon">

                <span className="input-icon-prefix">
                  <MapPin size={17} />
                </span>


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


            <div className="form-group">

              <label
                className="form-label"
                htmlFor="su_pinCode"
              >
                Pin / Zip Code
                <span className="req-star">
                  *
                </span>
              </label>


              <div className="input-with-icon">

                <span className="input-icon-prefix">
                  <MapPin size={17} />
                </span>


                <input
                  id="su_pinCode"
                  name="pinCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input-field"
                  placeholder="Enter 6 digit PIN code"
                  value={form.pinCode}
                  onChange={handlePinChange}
                  autoComplete="postal-code"
                />

              </div>

            </div>

          </>

        )}


        {/* ============================================================
            DRIVER LICENCE
            ============================================================ */}

        {isDriver && (

          <>

            <div className="form-group">

              <label
                className="form-label"
                htmlFor="su_hasDrivingLicence"
              >
                Do you have a valid driving licence?
                <span className="req-star">
                  *
                </span>
              </label>


              <div className="input-with-icon">

                <span className="input-icon-prefix">
                  <Car size={17} />
                </span>


                <select
                  id="su_hasDrivingLicence"
                  name="hasDrivingLicence"
                  className="input-field select-field"
                  value={form.hasDrivingLicence}
                  onChange={handleChange}
                >

                  <option value="">
                    -- Select --
                  </option>

                  <option value="yes">
                    Yes
                  </option>

                  <option value="no">
                    No
                  </option>

                </select>

              </div>

            </div>


            {form.hasDrivingLicence === 'yes' && (

              <div className="form-group">

                <label
                  className="form-label"
                  htmlFor="su_drivingLicenceNumber"
                >
                  Driving Licence Number
                  <span className="req-star">
                    *
                  </span>
                </label>


                <div className="input-with-icon">

                  <span className="input-icon-prefix">
                    <Car size={17} />
                  </span>


                  <input
                    id="su_drivingLicenceNumber"
                    name="drivingLicenceNumber"
                    type="text"
                    className="input-field"
                    placeholder="Enter your driving licence number"
                    value={
                      form.drivingLicenceNumber
                    }
                    onChange={handleChange}
                    autoComplete="off"
                  />

                </div>

              </div>

            )}

          </>

        )}


        {/* ============================================================
            TERMS
            ============================================================ */}

        <div className="terms-row">

          <input
            type="checkbox"
            id="su_terms"
            name="agreedToTerms"
            className="custom-checkbox"
            checked={form.agreedToTerms}
            onChange={handleChange}
          />


          <label
            htmlFor="su_terms"
            className="terms-label"
          >

            I agree to the{' '}

            <a
              href="#terms"
              className="terms-link"
              onClick={(e) =>
                e.preventDefault()
              }
            >
              Terms of Service
            </a>

            {' '}and{' '}

            <a
              href="#privacy"
              className="terms-link"
              onClick={(e) =>
                e.preventDefault()
              }
            >
              Privacy Policy
            </a>

          </label>

        </div>


        {/* ============================================================
            SUBMIT
            ============================================================ */}

        <button
          type="submit"
          className="btn-primary-login"
          disabled={loading}
        >

          <UserCircle2 size={18} />

          <span>

            {loading
              ? 'Creating Account...'
              : 'Create Account'}

          </span>

        </button>


      </form>


      {/* Divider */}

      <div className="divider-container">

        <div className="divider-line"></div>

        <span className="divider-text">
          or
        </span>

        <div className="divider-line"></div>

      </div>


      {/* Google Sign Up */}

      <button
        type="button"
        className="btn-google"
      >

        <svg
          className="google-icon"
          viewBox="0 0 24 24"
        >

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
            d="M5.84 14.09c-.66-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />

          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />

        </svg>


        <span>
          Sign up with Google
        </span>

      </button>


      {/* Login */}

      <div className="signup-row">

        <span>
          Already have an account?
        </span>


        <a
          href="/login"
          className="signup-link"
          onClick={(e) => {

            if (onSwitchToLogin) {

              e.preventDefault();

              onSwitchToLogin();

            }

          }}
        >
          Login
        </a>

      </div>


    </div>

  );

};


export default SignupForm;