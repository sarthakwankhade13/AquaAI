# AquaAI Authentication Update - Email-Based Login

## Overview

The AquaAI authentication system has been updated to use **email-based login** instead of mobile number-based login. This change applies to both frontend and backend systems.

## Changes Made

### Backend Changes

#### 1. **Database Migration** (`backend/src/migrations/000_auth_tables.sql`)
- Created core authentication tables if they don't exist:
  - `roles` - User role definitions
  - `users` - User account information
  - `refresh_tokens` - JWT refresh token storage
  - `login_history` - User login audit trail
  - `password_reset_otp` - Password reset OTP codes
  - `audit_logs` - System audit logging
- Seeded default roles including "WRD Super Admin"
- Prepared WRD Super Admin user account setup

#### 2. **Authentication Repository** (`backend/src/repositories/auth.repository.js`)
- Updated `findUserByEmail()` to return full user details (instead of just user_id)
- Now includes user role, email, mobile, gender, address, verification status, etc.

#### 3. **Authentication Service** (`backend/src/services/auth.service.js`)
- Changed `login()` function to accept `email` instead of `mobile`
- Updated error messages to reference "email" instead of "mobile"
- All login logic remains the same, just using email as the identifier

#### 4. **Authentication Controller** (`backend/src/controllers/auth.controller.js`)
- Updated login endpoint to destructure `email` from request body
- Passes email to the auth service

#### 5. **Validation** (`backend/src/validators/auth.validator.js`)
- Updated `loginValidator` to validate email format instead of mobile
- Uses `isEmail()` validation from express-validator
- Normalizes email addresses for consistency

### Frontend Changes

#### 1. **Login Form** (`frontend/src/components/LoginForm.jsx`)
- Changed input field from "Mobile Number" to "Email Address"
- Updated icon from `Phone` to `Mail`
- Updated validation logic:
  - Now uses regex to validate email format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Removed 10-digit numeric validation
- Updated placeholder text and error messages
- Changed state variable from `mobile` to `email`
- Updated form submission to send email to API

#### 2. **Auth API Service** (`frontend/src/services/authApi.js`)
- Updated `loginApi()` function signature from `loginApi(identifier, password)` to `loginApi(email, password)`
- Now sends `email` field instead of `mobile` field to the backend

#### 3. **Environment Configuration** (`frontend/.env.local`)
- Created `.env.local` file for backend URL configuration
- Can be customized to point to different backend ports/protocols

## Setting Up WRD Super Admin Account

### Step 1: Generate Password Hash

Navigate to the backend directory and run the hash generation utility:

```bash
cd backend
node generateAdminHash.js "AquaAI@2024"
```

This will output:
- The password (for your records)
- The bcrypt hash
- The SQL command to update the password

### Step 2: Update Migration File

Open `backend/src/migrations/000_auth_tables.sql` and replace the placeholder hash in the `CALL create_wrd_admin()` line with the hash generated in Step 1.

### Step 3: Run Migration

The migration will run automatically when the backend server starts (via `runMigrations.js`). It will:
- Create all necessary authentication tables
- Create default roles
- Create the WRD Super Admin user with the hashed password

### WRD Super Admin Credentials

**Default Setup (if using provided hash):**
- **Email:** `admin@wrd.gov.in`
- **Password:** `AquaAI@2024`
- **Mobile:** `9876543210`
- **Role:** WRD Super Admin

**For Production:**
1. Generate a new strong password
2. Hash it using the utility: `node generateAdminHash.js "YourNewPassword"`
3. Update the migration file with the new hash
4. Re-run migrations or directly update the database

## Default Roles

The system includes the following default roles:

1. **WRD Super Admin** - Full system access
2. **WRD Admin** - Department-level administration
3. **WRD Officer** - Officer-level access
4. **District Admin** - District-level administration
5. **Taluka Admin** - Taluka-level administration
6. **Village Head** - Village representative access
7. **Farmer** - Individual farmer user
8. **Guest** - Limited guest access

## Login Flow

### Frontend
1. User enters email and password
2. Form validates email format
3. Request sent to backend: `POST /api/v1/auth/login`
4. Request body: `{ email: "user@example.com", password: "password" }`

### Backend
1. Validator checks for valid email and password presence
2. Service looks up user by email
3. Password is compared using bcrypt
4. On success, JWT tokens are generated and returned
5. Login history is recorded with IP, device, browser information

## Environment Configuration

### Backend (.env)
No changes needed. The system auto-detects migrations at startup.

### Frontend (.env.local)
```env
# Backend API Base URL (without /api/v1)
# Default: http://localhost:5000
# Examples:
#   - http://localhost:5000
#   - http://localhost:5900 (custom port)
#   - https://localhost:5900 (HTTPS)
VITE_API_BASE=http://localhost:5000
```

## Troubleshooting

### "Invalid email or password" Error
- Verify email exists in database
- Ensure password hash was generated correctly
- Check that user `is_active` status is 1

### Login page still shows mobile field
- Clear browser cache
- Rebuild frontend: `npm run build`
- Restart frontend dev server: `npm run dev`

### Migration not running
- Ensure migration file is in `backend/src/migrations/` directory
- Verify database credentials in `.env`
- Check logs for database connection errors

### Bcrypt hash generation fails
- Ensure `bcryptjs` is installed: `npm install bcryptjs`
- Run script with Node.js: `node generateAdminHash.js`

## Files Modified

- `backend/src/repositories/auth.repository.js` - Updated findUserByEmail()
- `backend/src/services/auth.service.js` - Login service updated for email
- `backend/src/controllers/auth.controller.js` - Login controller updated
- `backend/src/validators/auth.validator.js` - Login validator updated
- `backend/src/migrations/000_auth_tables.sql` - New migration file
- `backend/generateAdminHash.js` - New utility script
- `frontend/src/components/LoginForm.jsx` - Email field instead of mobile
- `frontend/src/services/authApi.js` - Updated login API call
- `frontend/.env.local` - New configuration file

## API Endpoint Reference

### Login Endpoint
```
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
  "email": "admin@wrd.gov.in",
  "password": "AquaAI@2024"
}

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "user_id": 1,
      "full_name": "WRD Super Administrator",
      "email": "admin@wrd.gov.in",
      "role_name": "WRD Super Admin"
    }
  }
}
```

## Next Steps

1. Run the password hash generation utility
2. Update the migration file with the generated hash
3. Start the backend server (migrations run automatically)
4. Start the frontend dev server
5. Test login with admin credentials: `admin@wrd.gov.in` / `AquaAI@2024`
6. Change the admin password in production environment
