// src/services/authService.js - COMPLETE FIXED VERSION
import api from './api';
import axios from 'axios';

// ===================== TOKEN SERVICE =====================
const TOKEN_KEY = 'bearertoken';
const TOKEN_EXPIRY_KEY = 'bearertoken_expiry';
const TOKEN_REFRESH_BUFFER = 300; // 5 minutes buffer

// Enhanced Token Service with proper error handling
export const tokenService = {
  setToken: (tokenData) => {
    const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
    
    if (!token) {
      return;
    }

    try {
      // Check if it's a valid JWT format
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        // Fallback: store without validation
        localStorage.setItem(TOKEN_KEY, token);
        return;
      }

      // Try to decode and validate JWT
      try {
        // Fix base64 decoding for JWT (URL-safe base64)
        const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
        const payload = JSON.parse(atob(paddedPayload));
        const expiryTime = payload.exp;
        
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      } catch (jwtError) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch (error) {
      // Final fallback: store the token anyway
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (!token) {
        return null;
      }
      
      // Validate token format
      if (!token || token === 'undefined' || token === 'null') {
        tokenService.clearToken();
        return null;
      }
      
      // Check if token is expired (only for JWT tokens with expiry)
      if (expiry) {
        const expiryTime = parseInt(expiry);
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (currentTime > expiryTime) {
          tokenService.clearToken();
          return null;
        }
        
        // Check if token needs refresh (within buffer period)
        if (currentTime > (expiryTime - TOKEN_REFRESH_BUFFER)) {
          // Token nearing expiry
        }
      }
      
      return token;
    } catch (error) {
      return null;
    }
  },

  clearToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (error) {
      // Silent fail
    }
  },

  isValid: () => {
    const token = tokenService.getToken();
    return !!token;
  },

  getExpiryTime: () => {
    try {
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      return expiry ? parseInt(expiry) : null;
    } catch (error) {
      return null;
    }
  },

  // New method: Safe token validation without throwing errors
  safeValidateToken: (token) => {
    if (!token) return { isValid: false, reason: 'No token provided' };
    
    try {
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return { 
          isValid: true, // We'll accept non-JWT tokens
          isJWT: false,
          reason: 'Not a JWT format' 
        };
      }
      
      try {
        const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - base64Payload.length % 4) % 4, '=');
        const payload = JSON.parse(atob(paddedPayload));
        const currentTime = Math.floor(Date.now() / 1000);
        
        return {
          isValid: true,
          isJWT: true,
          isExpired: payload.exp ? currentTime > payload.exp : false,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
          payload: payload
        };
      } catch (parseError) {
        return {
          isValid: true, // Still accept it
          isJWT: false,
          reason: 'JWT parsing failed but token accepted'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        reason: 'Token validation error: ' + error.message
      };
    }
  },

  // New method: Debug token info
  debugToken: () => {
    const token = tokenService.getToken();
    if (!token) {
      return { exists: false };
    }
    
    const validation = tokenService.safeValidateToken(token);
    return {
      exists: true,
      length: token.length,
      type: typeof token,
      preview: token.substring(0, 50) + '...',
      validation: validation
    };
  }
};

// ===================== DEBOUNCED API CALLS =====================
const apiCallCache = new Map();

export const debouncedApiCall = async (cacheKey, apiCall, ttl = 60000) => {
  const now = Date.now();
  
  // Check cache first
  if (apiCallCache.has(cacheKey)) {
    const cached = apiCallCache.get(cacheKey);
    if (now - cached.timestamp < ttl) {
      return cached.data;
    }
    apiCallCache.delete(cacheKey);
  }
  
  // Make API call and cache result
  try {
    const result = await apiCall();
    apiCallCache.set(cacheKey, {
      data: result,
      timestamp: now
    });
    return result;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
};

// ===================== PARTNER LOGIN & TOKEN MANAGEMENT =====================
let tokenRefreshPromise = null;

export const partnerLogin = async () => {
  try {
    // First check if we have a valid token using our service
    const existingToken = tokenService.getToken();
    if (existingToken) {
      const validation = tokenService.safeValidateToken(existingToken);
      
      if (validation.isValid && !validation.isExpired) {
        return { 
          status: 'success', 
          data: { token: existingToken } 
        };
      } else {
        tokenService.clearToken();
      }
    }
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/partner-login`,
      {
        client_id: "HK6V7709",
        client_secret: "057d433a-2d02-437b-a265-56114567aa44"
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000
      }
    );

    if (response.data.status === 'success' && response.data.data?.token) {
      const token = response.data.data.token;
      
      // Store the token using our service
      tokenService.setToken(token);
      
      // Verify storage worked
      const storedToken = tokenService.getToken();
      if (storedToken === token) {
        return response.data;
      } else {
        throw new Error('Token storage verification failed');
      }
    } else {
      throw new Error('Invalid response from partner login API');
    }
  } catch (error) {
    // Clear any potentially corrupted token
    tokenService.clearToken();
    throw error;
  }
};

export const getBearerToken = async (forceRefresh = false) => {
  // Use tokenService instead of direct localStorage access
  const existingToken = tokenService.getToken();
  
  if (existingToken && !forceRefresh) {
    return existingToken;
  }

  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/partner-login`,
        {
          client_id: "HK6V7709",
          client_secret: "057d433a-2d02-437b-a265-56114567aa44",
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000
        }
      );

      if (response.data?.data?.token) {
        const token = response.data.data.token;
        
        // Validate token before storing
        const validation = tokenService.safeValidateToken(token);
        
        // Use tokenService to store the token
        tokenService.setToken(token);
        
        return token;
      } else {
        throw new Error("Invalid token response structure");
      }
    } catch (error) {
      // Use tokenService to clear the token
      tokenService.clearToken();
      throw error;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
};

// Initialize partner token on service load
export const initializePartnerToken = async () => {
  try {
    const tokenDebug = tokenService.debugToken();
    
    if (!tokenDebug.exists) {
      await partnerLogin();
    }
  } catch (error) {
    // Don't throw error here - let the app continue without partner token
  }
};

// ===================== AUTH API FUNCTIONS =====================

export const fetchCountries = async () => {
  return debouncedApiCall('countries', () => api.get('/countries'));
};

export const fetchPartnerDetails = async (hostName) => {
  return debouncedApiCall(`partner-${hostName}`, () => 
    api.get(`/partners/get-partner-detail/${hostName}`)
  );
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

export const verifyPasscodeLogin = async (passcodeData) => {
  return api.post('/login', passcodeData);
};

export const verifyOtpLogin = async (otpData) => {
  return api.post('/login', otpData);
};

export const getGifImages = async () => {
  return debouncedApiCall('gif-images', () => api.get('/gif-images'));
};

export const getManuals = async (payload) => {
  return api.post('/get-manuals', payload);
};

export const checkKycStatus = async (customerId) => {
  return api.get(`/kyc/${customerId}`);
};

export const initiatePlaid = async (customerId) => {
  return api.get(`/kycs/${customerId}`);
};

export const processKycCallback = async (callbackData) => {
  return api.post('/process-kyc-callback', callbackData);
};

export const logout = async () => {
  // Clear partner token on logout
  tokenService.clearToken();
  return api.post('/logout');
};

export const getLogoutTime = async () => {
  return debouncedApiCall('logout-time', () => api.get('/logout-time'));
};

export const getPartnerConfig = async (partnerId) => {
  return debouncedApiCall(`partner-config-${partnerId}`, () => 
    api.get(`/partner-basic-setup/${partnerId}`)
  );
};

export const sendOtp = async (mobileNumber) => {
  return api.post('/send-otp', {
    mobile_number: mobileNumber,
  });
};

export const validateOtp = async (otpData) => {
  return api.post('/validate-otp', otpData);
};

export const forgotPassword = async (email) => {
  return api.post('/forgot-password', { email });
};

export const resetPassword = async (resetData) => {
  return api.post('/reset-password', resetData);
};

export const registerUser = async (userData) => {
  return api.post('/register', userData);
};

export const verifyEmail = async (verificationData) => {
  return api.post('/verify-email', verificationData);
};

// ===================== USER PROFILE & MODULES =====================

export const fetchUserProfile = async (customerId, token) => {
  return debouncedApiCall(`user-profile-${customerId}`, () =>
    api.get(`/customer/profile/${customerId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};

export const fetchAllowedModules = async (customerId, token) => {
  return debouncedApiCall(`allowed-modules-${customerId}`, () =>
    api.get(`/customer/${customerId}/allowed-modules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};

export const updateUserProfile = async (customerId, profileData, token) => {
  return api.put(`/customer/profile/${customerId}`, profileData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changePassword = async (passwordData, token) => {
  return api.post('/change-password', passwordData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ===================== KYC & BANKING OPERATIONS =====================

export const initiateKycProcess = async (customerId, token) => {
  return api.post('/kyc/initiate', { customer_id: customerId }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getKycStatus = async (customerId, token) => {
  return debouncedApiCall(`kyc-status-${customerId}`, () =>
    api.get(`/kyc/status/${customerId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};

export const getBankAccounts = async (customerId, token) => {
  return api.get(`/customer/${customerId}/bank-accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const addBankAccount = async (bankAccountData, token) => {
  return api.post('/bank-accounts', bankAccountData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ===================== SESSION MANAGEMENT =====================

export const refreshAuthToken = async (refreshToken) => {
  return api.post('/refresh-token', { refresh_token: refreshToken });
};

export const validateSession = async (token) => {
  return api.get('/validate-session', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ===================== UTILITY FUNCTIONS =====================

export const extractErrorMessage = (error) => {
  if (error.response) {
    return error.response.data?.message || error.response.data?.error || error.message;
  }
  return error.message || 'An unexpected error occurred';
};

export const handleApiError = (error, dispatch = null) => {
  let errorMessage = extractErrorMessage(error);

  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = "Session expired. Please login again.";
        localStorage.removeItem("authtoken");
        localStorage.removeItem("authcustomer_id");
        tokenService.clearToken();
        window.location.href = "/";
        break;
      case 403:
        errorMessage = "You don't have permission for this action";
        break;
      case 429:
        errorMessage = "Too many requests. Please try again later.";
        break;
      case 500:
        errorMessage = "Server error. Please try again later.";
        break;
    }
  }

  if (dispatch) {
    dispatch({ type: "auth/setError", payload: errorMessage });
    dispatch({
      type: "ui/openModal",
      payload: {
        title: "Error",
        message: errorMessage,
        type: "error",
      },
    });
  }

  return errorMessage;
};

// Utility function to check token health
export const checkTokenHealth = () => {
  const token = tokenService.getToken();
  if (!token) {
    return { healthy: false, status: 'NO_TOKEN' };
  }
  
  const validation = tokenService.safeValidateToken(token);
  
  if (!validation.isValid) {
    return { healthy: false, status: 'INVALID_TOKEN', details: validation };
  }
  
  if (validation.isExpired) {
    return { healthy: false, status: 'EXPIRED_TOKEN', details: validation };
  }
  
  return { healthy: true, status: 'HEALTHY', details: validation };
};

// Clear all cached API responses
export const clearApiCache = () => {
  apiCallCache.clear();
};

// Clear cache for specific key
export const clearCacheForKey = (key) => {
  apiCallCache.delete(key);
};

// ===================== EXPORT DEFAULT =====================

export default {
  // Token Service
  tokenService,
  
  // Auth Operations
  login,
  logout,
  registerUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshAuthToken,
  validateSession,
  
  // Passcode/OTP Operations
  requestPasscodeLogin,
  sendOtpLogin,
  verifyPasscodeLogin,
  verifyOtpLogin,
  sendOtp,
  validateOtp,
  
  // Partner & Token Management
  partnerLogin,
  getBearerToken,
  initializePartnerToken,
  checkTokenHealth,
  
  // Data Fetching
  fetchCountries,
  fetchPartnerDetails,
  getGifImages,
  getManuals,
  getLogoutTime,
  getPartnerConfig,
  
  // User Profile & Modules
  fetchUserProfile,
  fetchAllowedModules,
  updateUserProfile,
  changePassword,
  
  // KYC & Banking
  checkKycStatus,
  initiatePlaid,
  initiateKycProcess,
  getKycStatus,
  processKycCallback,
  getBankAccounts,
  addBankAccount,
  
  // Utilities
  debouncedApiCall,
  extractErrorMessage,
  handleApiError,
  clearApiCache,
  clearCacheForKey
};