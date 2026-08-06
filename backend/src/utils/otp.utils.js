import crypto from 'crypto';

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * @returns {string} 6-digit numeric OTP
 */
export const generateNumericOtp = () => {
  // Generate random bytes and convert to a number in the range 100000-999999
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
};

/**
 * Calculates the expiry date-time object for an OTP based on minutes.
 * @param {number} validityInMinutes - Number of minutes the OTP should be valid
 * @returns {Date} Expiry Date object
 */
export const getOtpExpiryDate = (validityInMinutes = 5) => {
  return new Date(Date.now() + validityInMinutes * 60 * 1000);
};
