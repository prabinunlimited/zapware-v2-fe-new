// authService.js
import api from './api';

// Simple service functions without any store dependencies
export const partnerLogin = async () => {
  return api.post('/partner-login', {
    client_id: "HK6V7709",
    client_secret: "057d433a-2d02-437b-a265-56114567aa44"
  });
};

export const fetchCountries = async () => {
  return api.get('/countries');
};

export const fetchPartnerDetails = async (hostName) => {
  return api.get(`/partners/get-partner-detail/${hostName}`);
};

export const login = async (credentials) => {
  return api.post('/login', credentials);
};

export const requestPasscodeLogin = async ({ email, password, customer_type }) => {
  const payload = {
    email,
    password,
    hostname: window.location.hostname,
  };

  if (customer_type) {
    payload.customer_type = customer_type;
  }

  return api.post('/request-passcode-login', payload);
};

export const sendOtpLogin = async ({ phone_code, mobile_number, customer_type }) => {
  const payload = {
    country_code: phone_code,
    mobile_number,
    hostname: window.location.hostname,
  };

  if (customer_type) {
    payload.customer_type = customer_type;
  }

  return api.post('/send-otp-login', payload);
};

// CORRECTED: These should point to /login, not /login-login
export const verifyPasscodeLogin = async (passcodeData) => {
  return api.post('/login', passcodeData);
};

export const verifyOtpLogin = async (otpData) => {
  return api.post('/login', otpData);
};

export const getGifImages = async () => {
  return api.get('/gif-images');
};

export const getManuals = async (payload) => {
  return api.post('/get-manuals', payload);
};

// CORRECTED: Use your actual KYC endpoints
export const checkKycStatus = async (customerId) => {
  return api.get(`/kyc/${customerId}`);
};

// CORRECTED: Use GET instead of POST and the correct endpoint
export const initiatePlaid = async (customerId) => {
  return api.get(`/kycs/${customerId}`);
};

// NEW: Add endpoint for processing KYC callbacks
export const processKycCallback = async (callbackData) => {
  return api.post('/process-kyc-callback', callbackData);
};

export const logout = async () => {
  return api.post('/logout');
};

// NEW: Add endpoint for checking logout time
export const getLogoutTime = async () => {
  return api.get('/logout-time');
};

// NEW: Add endpoint for partner config
export const getPartnerConfig = async (partnerId) => {
  return api.get(`/partner-basic-setup/${partnerId}`);
};

export default {
  partnerLogin,
  fetchCountries,
  fetchPartnerDetails,
  login,
  requestPasscodeLogin,
  sendOtpLogin,
  verifyPasscodeLogin,
  verifyOtpLogin,
  getGifImages,
  getManuals,
  checkKycStatus,
  initiatePlaid,
  processKycCallback,
  logout,
  getLogoutTime,
  getPartnerConfig
};