// src/services/authService.js - FIXED VERSION
import api from "./api";
import axios from "axios";

// ===================== TOKEN SERVICE =====================
const TOKEN_KEY = "bearertoken";
const TOKEN_EXPIRY_KEY = "bearertoken_expiry";
const TOKEN_REFRESH_BUFFER = 300; // 5 minutes buffer

// Enhanced Token Service with proper error handling
export const tokenService = {
  setToken: (tokenData) => {
    const token = typeof tokenData === "string" ? tokenData : tokenData?.token;

    if (!token) {
      return;
    }

    try {
      // Check if it's a valid JWT format
      const parts = token.split(".");

      if (parts.length !== 3) {
        // Fallback: store without validation
        localStorage.setItem(TOKEN_KEY, token);
        return;
      }

      // Try to decode and validate JWT
      try {
        // Fix base64 decoding for JWT (URL-safe base64)
        const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        // Add padding if needed
        const paddedPayload = base64Payload.padEnd(
          base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
          "="
        );
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
      if (!token || token === "undefined" || token === "null") {
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
        if (currentTime > expiryTime - TOKEN_REFRESH_BUFFER) {
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
    if (!token) return { isValid: false, reason: "No token provided" };

    try {
      const parts = token.split(".");

      if (parts.length !== 3) {
        return {
          isValid: true, // We'll accept non-JWT tokens
          isJWT: false,
          reason: "Not a JWT format",
        };
      }

      try {
        const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = base64Payload.padEnd(
          base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
          "="
        );
        const payload = JSON.parse(atob(paddedPayload));
        const currentTime = Math.floor(Date.now() / 1000);

        return {
          isValid: true,
          isJWT: true,
          isExpired: payload.exp ? currentTime > payload.exp : false,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
          payload: payload,
        };
      } catch (parseError) {
        return {
          isValid: true, // Still accept it
          isJWT: false,
          reason: "JWT parsing failed but token accepted",
        };
      }
    } catch (error) {
      return {
        isValid: false,
        reason: "Token validation error: " + error.message,
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
      preview: token.substring(0, 50) + "...",
      validation: validation,
    };
  },

  // ===================== PARTNER DATA MANAGEMENT =====================

  // Store partner data from partner-login API response
  setPartnerData: (partnerData) => {
    try {
      if (!partnerData) {
        console.warn("No partner data provided to setPartnerData");
        return;
      }

      // Store partner_id
      if (
        partnerData.partner_id !== undefined &&
        partnerData.partner_id !== null
      ) {
        const partnerId = String(partnerData.partner_id);
        localStorage.setItem("whitelabelledpartnerid", partnerId);
        console.log("✅ Partner ID stored:", partnerId);
      }

      if (partnerData.partner_uuid) {
        localStorage.setItem("partner_uuid", partnerData.partner_uuid);
        console.log("✅ Partner UUID stored:", partnerData.partner_uuid);
      }

      // Store beneficiary portal title
      if (partnerData.beneficiary_portal_title) {
        localStorage.setItem(
          "beneficiary_portal_title",
          partnerData.beneficiary_portal_title
        );
        console.log(
          "✅ Beneficiary portal title stored:",
          partnerData.beneficiary_portal_title
        );
      }

      // Store partner name
      if (partnerData.partner_name) {
        localStorage.setItem("support_partner_name", partnerData.partner_name);
        console.log("✅ Support partner name saved:", partnerData.partner_name);
      }

      // Store support email
      if (partnerData.support_email) {
        localStorage.setItem("partner_support_email", partnerData.support_email);
        console.log("✅ Support email stored:", partnerData.support_email);
      }

      // Store support phone number
      if (partnerData.support_phoneno) {
        localStorage.setItem("partner_support_phone", partnerData.support_phoneno);
        console.log("✅ Support phone stored:", partnerData.support_phoneno);
      }

      // Store partner address
      if (partnerData.partner_address) {
        localStorage.setItem("partner_address", partnerData.partner_address);
        console.log("✅ Partner address stored:", partnerData.partner_address);
      }

      // Store white labelled partner flag
      if (partnerData.is_white_labelled_partner) {
        localStorage.setItem(
          "iswhitelabelledpartner",
          partnerData.is_white_labelled_partner
        );
      }

      // Store show_estimated_time_delivery flag
      if (partnerData.show_estimated_time_delivery) {
        localStorage.setItem(
          "show_estimated_time_delivery",
          partnerData.show_estimated_time_delivery
        );
        console.log(
          "✅ Show estimated time delivery stored:",
          partnerData.show_estimated_time_delivery
        );
      }

    } catch (error) {
      console.error("❌ Error storing partner data:", error);
    }
  },

  // Get partner ID
  getPartnerId: () => {
    try {
      return localStorage.getItem("whitelabelledpartnerid");
    } catch (error) {
      console.error("Error getting partner ID:", error);
      return null;
    }
  },

  getPartnerUuid: () => {
    try {
      return localStorage.getItem("partner_uuid");
    } catch (error) {
      console.error("Error getting partner UUID:", error);
      return null;
    }
  },

  // Get beneficiary portal title
  getBeneficiaryPortalTitle: () => {
    try {
      return localStorage.getItem("beneficiary_portal_title");
    } catch (error) {
      console.error("Error getting beneficiary portal title:", error);
      return null;
    }
  },

  // Get partner name
  getPartnerName: () => {
    try {
      return localStorage.getItem("partner_name");
    } catch (error) {
      console.error("Error getting partner name:", error);
      return null;
    }
  },

  // Get support email
  getSupportEmail: () => {
    try {
      return localStorage.getItem("partner_support_email");
    } catch (error) {
      console.error("Error getting support email:", error);
      return null;
    }
  },

  // Get support phone number
  getSupportPhone: () => {
    try {
      return localStorage.getItem("partner_support_phone");
    } catch (error) {
      console.error("Error getting support phone:", error);
      return null;
    }
  },

  // Get partner address
  getPartnerAddress: () => {
    try {
      return localStorage.getItem("partner_address");
    } catch (error) {
      console.error("Error getting partner address:", error);
      return null;
    }
  },

  // Get show estimated time delivery flag
  getShowEstimatedTimeDelivery: () => {
    try {
      return localStorage.getItem("show_estimated_time_delivery");
    } catch (error) {
      console.error("Error getting show estimated time delivery:", error);
      return null;
    }
  },

  // Check if white labelled partner
  isWhiteLabelledPartner: () => {
    try {
      return localStorage.getItem("iswhitelabelledpartner") === "Y";
    } catch (error) {
      console.error("Error checking white labelled partner status:", error);
      return false;
    }
  },

  // Clear all partner data
  clearPartnerData: () => {
    try {
      localStorage.removeItem("whitelabelledpartnerid");
      localStorage.removeItem("partner_uuid");
      localStorage.removeItem("beneficiary_portal_title");
      localStorage.removeItem("partner_name");
      localStorage.removeItem("partner_support_email");
      localStorage.removeItem("partner_support_phone");
      localStorage.removeItem("partner_address");
      localStorage.removeItem("iswhitelabelledpartner");
      localStorage.removeItem("show_estimated_time_delivery");
      console.log("✅ Partner data cleared from localStorage");
    } catch (error) {
      console.error("Error clearing partner data:", error);
    }
  },

  // Clear all authentication and partner data (complete logout)
  clearAll: () => {
    tokenService.clearToken();
    tokenService.clearPartnerData();
    console.log("✅ All authentication and partner data cleared");
  },

  // Debug partner data info
  debugPartnerData: () => {
    try {
      const partnerId = tokenService.getPartnerId();
      const portalTitle = tokenService.getBeneficiaryPortalTitle();
      const partnerName = tokenService.getPartnerName();
      const supportEmail = tokenService.getSupportEmail();
      const supportPhone = tokenService.getSupportPhone();
      const partnerAddress = tokenService.getPartnerAddress();
      const isWhiteLabelled = tokenService.isWhiteLabelledPartner();
      const showEstimatedTimeDelivery = tokenService.getShowEstimatedTimeDelivery();

      return {
        partnerId: partnerId,
        beneficiaryPortalTitle: portalTitle,
        partnerName: partnerName,
        supportEmail: supportEmail,
        supportPhone: supportPhone,
        partnerAddress: partnerAddress,
        isWhiteLabelledPartner: isWhiteLabelled,
        showEstimatedTimeDelivery: showEstimatedTimeDelivery,
        exists: !!(partnerId || portalTitle || partnerName || supportEmail || supportPhone || partnerAddress),
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  },

  // Get all partner data as an object
  getAllPartnerData: () => {
    return {
      partnerId: tokenService.getPartnerId(),
      beneficiaryPortalTitle: tokenService.getBeneficiaryPortalTitle(),
      partnerName: tokenService.getPartnerName(),
      supportEmail: tokenService.getSupportEmail(),
      supportPhone: tokenService.getSupportPhone(),
      partnerAddress: tokenService.getPartnerAddress(),
      isWhiteLabelledPartner: tokenService.isWhiteLabelledPartner(),
      showEstimatedTimeDelivery: tokenService.getShowEstimatedTimeDelivery(),
    };
  },

  // Get partner ID
  getPartnerId: () => {
    try {
      return localStorage.getItem("whitelabelledpartnerid");
    } catch (error) {
      console.error("Error getting partner ID:", error);
      return null;
    }
  },

  // Get beneficiary portal title
  getBeneficiaryPortalTitle: () => {
    try {
      return localStorage.getItem("beneficiary_portal_title");
    } catch (error) {
      console.error("Error getting beneficiary portal title:", error);
      return null;
    }
  },

  // Get partner name
  getPartnerName: () => {
    try {
      return localStorage.getItem("partner_name");
    } catch (error) {
      console.error("Error getting partner name:", error);
      return null;
    }
  },

  // Check if white labelled partner
  isWhiteLabelledPartner: () => {
    try {
      return localStorage.getItem("iswhitelabelledpartner") === "Y";
    } catch (error) {
      console.error("Error checking white labelled partner status:", error);
      return false;
    }
  },

  // Clear all partner data
  clearPartnerData: () => {
    try {
      localStorage.removeItem("whitelabelledpartnerid");
      localStorage.removeItem("beneficiary_portal_title");
      localStorage.removeItem("partner_name");
      localStorage.removeItem("iswhitelabelledpartner");
      console.log("✅ Partner data cleared from localStorage");
    } catch (error) {
      console.error("Error clearing partner data:", error);
    }
  },

  // Clear all authentication and partner data (complete logout)
  clearAll: () => {
    tokenService.clearToken();
    tokenService.clearPartnerData();
    console.log("✅ All authentication and partner data cleared");
  },

  // Debug partner data info
  debugPartnerData: () => {
    try {
      const partnerId = tokenService.getPartnerId();
      const portalTitle = tokenService.getBeneficiaryPortalTitle();
      const partnerName = tokenService.getPartnerName();
      const isWhiteLabelled = tokenService.isWhiteLabelledPartner();

      return {
        partnerId: partnerId,
        beneficiaryPortalTitle: portalTitle,
        partnerName: partnerName,
        isWhiteLabelledPartner: isWhiteLabelled,
        exists: !!(partnerId || portalTitle || partnerName),
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  },

  // Get all partner data as an object
  getAllPartnerData: () => {
    return {
      partnerId: tokenService.getPartnerId(),
      beneficiaryPortalTitle: tokenService.getBeneficiaryPortalTitle(),
      partnerName: tokenService.getPartnerName(),
      isWhiteLabelledPartner: tokenService.isWhiteLabelledPartner(),
    };
  },
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
      timestamp: now,
    });
    return result;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
};

// ===================== PARTNER LOGIN & TOKEN MANAGEMENT =====================
let tokenRefreshPromise = null;

export const partnerLogin = async (forceApiCall = false) => {
  try {
    console.log("🔍 Starting partner login...");

    // First check if we have a valid token using our service
    const existingToken = tokenService.getToken();
    if (existingToken && !forceApiCall) {
      const validation = tokenService.safeValidateToken(existingToken);

      if (validation.isValid && !validation.isExpired) {
        console.log("🔍 Existing token is valid, returning it");
        return {
          status: "success",
          data: {
            token: existingToken,
            partner_id: tokenService.getPartnerId(),
            beneficiary_portal_title: tokenService.getBeneficiaryPortalTitle(),
          },
        };
      } else {
        console.log("🔍 Existing token invalid or expired, clearing it");
        tokenService.clearAll();
      }
    }

    // Get current hostname
    const currentHostname = window.location.hostname;
    console.log("🔍 Partner login with hostname:", currentHostname);

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/partner-login`,
      {
        client_id: "HK6V7709",
        client_secret: "057d433a-2d02-437b-a265-56114567aa44",
        hostname: currentHostname, // Add hostname to payload
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 50000,
      }
    );

    console.log("🔍 Partner login response:", {
      status: response.data?.status,
      hasData: !!response.data?.data,
    });

    if (response.data.status === "success" && response.data.data?.token) {
      const token = response.data.data.token;
      const partnerData = response.data.data;

      if (partnerData.partner_name) {
        localStorage.setItem("support_partner_name", partnerData.partner_name);
        console.log(" Support partner name saved:", partnerData.partner_name);
      }
      if (partnerData.support_email) {
        localStorage.setItem("support_email", partnerData.support_email);
        console.log(" Support email saved:", partnerData.support_email);
      }
      if (partnerData.support_phoneno) {
        localStorage.setItem("support_phoneno", partnerData.support_phoneno);
        console.log(" Support phone saved:", partnerData.support_phoneno);
      }
      if (partnerData.partner_address) {
        localStorage.setItem("support_partner_address", partnerData.partner_address);
        console.log("Support partner address saved:", partnerData.partner_address);
      }
      if (partnerData.default_signin_type) {
        localStorage.setItem("default_signin_type", partnerData.default_signin_type);
        console.log(" Default sign-in type saved:", partnerData.default_signin_type);
      }

      // STORE PARTNER DATA USING TOKEN SERVICE
      tokenService.setPartnerData(partnerData);
      console.log(" Partner data stored from partnerLogin");

      // Store the token using our service
      tokenService.setToken(token);

      // Verify storage worked
      const storedToken = tokenService.getToken();
      if (storedToken === token) {
        console.log("Token storage verified successfully");
        return response.data;
      } else {
        console.error("❌ Token storage verification failed");
        throw new Error("Token storage verification failed");
      }
    } else {
      console.error("❌ Invalid response from partner login API");
      throw new Error("Invalid response from partner login API");
    }
  } catch (error) {
    console.error("❌ Error in partnerLogin:", error.message);

    // Clear any potentially corrupted token and partner data
    tokenService.clearAll();
    throw error;
  }
};

// ===================== GET BEARER TOKEN (KEEP THIS ONE) =====================
export const getBearerToken = async (forceRefresh = false) => {
  // Use tokenService instead of direct localStorage access
  const existingToken = tokenService.getToken();
  const partnerId = tokenService.getPartnerId();

  // ✅ IMPROVED CHECK: Return existing token ONLY if we have both token AND partner data
  if (existingToken && partnerId && !forceRefresh) {
    console.log("🔍 Returning existing bearer token with partner data");
    return existingToken;
  }

  // ✅ FIX: If we have token but NO partner data, force refresh to get partner data
  if (existingToken && !partnerId && !forceRefresh) {
    console.log("🔍 Token exists but partner data missing, forcing refresh");
    return getBearerToken(true); // Recursive call with forceRefresh
  }

  if (tokenRefreshPromise) {
    console.log("🔍 Token refresh already in progress, waiting...");
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      console.log("🔍 Fetching new bearer token...");

      // Get current hostname
      const currentHostname = window.location.hostname;
      console.log("🔍 Current hostname:", currentHostname);
      console.log("🔍 Full URL:", window.location.href);

      // Call partner-login API
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/partner-login`,
        {
          client_id: "HK6V7709",
          client_secret: "057d433a-2d02-437b-a265-56114567aa44",
          hostname: currentHostname, // Add hostname to payload
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      console.log("🔍 Partner-login API response received:", {
        status: response.data?.status,
        hasToken: !!response.data?.data?.token,
        partnerId: response.data?.data?.partner_id,
        beneficiaryTitle: response.data?.data?.beneficiary_portal_title,
      });

      if (response.data?.data?.token) {
        const token = response.data.data.token;
        const partnerData = response.data.data;

        console.log("🔍 Token received:", token.substring(0, 20) + "...");
        console.log("🔍 Partner data:", partnerData);

        // ✅ STORE PARTNER DATA USING TOKEN SERVICE
        try {
          tokenService.setPartnerData(partnerData);
          console.log("✅ Partner data stored successfully");

          // Verify storage
          const storedPartnerId = tokenService.getPartnerId();
          const storedTitle = tokenService.getBeneficiaryPortalTitle();
          console.log("✅ Verification - Stored Partner ID:", storedPartnerId);
          console.log("✅ Verification - Stored Title:", storedTitle);
        } catch (partnerDataError) {
          console.error("❌ Failed to store partner data:", partnerDataError);
          // Don't throw here - we still want to proceed with token storage
        }

        // Validate token before storing
        const validation = tokenService.safeValidateToken(token);
        console.log("🔍 Token validation:", {
          isValid: validation.isValid,
          isJWT: validation.isJWT,
          isExpired: validation.isExpired,
        });

        if (!validation.isValid) {
          throw new Error("Invalid token format received from API");
        }

        // Use tokenService to store the token
        tokenService.setToken(token);

        // Verify token storage worked
        const storedToken = tokenService.getToken();
        if (storedToken !== token) {
          console.error("❌ Token storage verification failed");
          console.error("Original token:", token.substring(0, 20) + "...");
          console.error("Stored token:", storedToken?.substring(0, 20) + "...");
          throw new Error("Token storage verification failed");
        }

        console.log("✅ Token stored successfully");

        // Debug final state
        const tokenDebug = tokenService.debugToken();
        const partnerDebug = tokenService.debugPartnerData();
        console.log("🔍 Final token state:", tokenDebug);
        console.log("🔍 Final partner state:", partnerDebug);

        return token;
      } else {
        console.error("❌ Invalid token response structure:", response.data);
        throw new Error("Invalid token response structure");
      }
    } catch (error) {
      console.error("❌ Error in getBearerToken:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Use tokenService to clear the token and partner data
      tokenService.clearAll();

      // Re-throw the error
      if (error.response) {
        if (error.response.status === 400 || error.response.status === 401) {
          throw new Error(
            "Authentication failed. Please check your credentials."
          );
        } else if (error.response.status === 429) {
          throw new Error("Too many requests. Please try again later.");
        } else if (error.response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
      }

      throw error;
    } finally {
      tokenRefreshPromise = null;
      console.log("🔍 Token refresh promise cleared");
    }
  })();

  return tokenRefreshPromise;
};

// Initialize partner token on service load
export const initializePartnerToken = async () => {
  try {
    const tokenDebug = tokenService.debugToken();
    const partnerDebug = tokenService.debugPartnerData();

    console.log("🔍 initializePartnerToken check:", {
      tokenExists: tokenDebug.exists,
      partnerExists: partnerDebug.exists,
      partnerId: partnerDebug.partnerId,
    });

    // ✅ IMPROVED: Only call partnerLogin if we're missing EITHER token OR partner data
    if (!tokenDebug.exists || !partnerDebug.exists) {
      console.log("🔍 Missing token or partner data, calling partnerLogin");
      await partnerLogin();
    } else {
      console.log("🔍 Token and partner data already exist, skipping API call");
    }
  } catch (error) {
    console.error("❌ Error in initializePartnerToken:", error.message);
    // Don't throw error here - let the app continue without partner token
  }
};

// ===================== AUTH API FUNCTIONS =====================

export const fetchCountries = async () => {
  return debouncedApiCall("countries", () => api.get("/countries"));
};

export const fetchPartnerDetails = async (hostName) => {
  return debouncedApiCall(`partner-${hostName}`, () =>
    api.get(`/partners/get-partner-detail/${hostName}`)
  );
};

export const login = async (credentials) => {
  return api.post("/login", credentials);
};

export const requestPasscodeLogin = async ({
  email,
  password,
  customer_type,
}) => {
  const payload = {
    email,
    password,
    hostname: window.location.hostname,
  };

  if (customer_type) {
    payload.customer_type = customer_type;
  }

  return api.post("/request-passcode-login", payload);
};

export const sendOtpLogin = async ({
  phone_code,
  mobile_number,
  customer_type,
}) => {
  const payload = {
    country_code: phone_code,
    mobile_number,
    hostname: window.location.hostname,
  };

  if (customer_type) {
    payload.customer_type = customer_type;
  }

  return api.post("/send-otp-login", payload);
};

export const verifyPasscodeLogin = async (passcodeData) => {
  return api.post("/login", passcodeData);
};

export const verifyOtpLogin = async (otpData) => {
  return api.post("/login", otpData);
};

export const getGifImages = async () => {
  return debouncedApiCall("gif-images", () => api.get("/gif-images"));
};

export const getManuals = async (payload) => {
  return api.post("/get-manuals", payload);
};

export const checkKycStatus = async (customerId) => {
  return api.get(`/kyc/${customerId}`);
};

export const initiatePlaid = async (customerId) => {
  return api.get(`/kycs/${customerId}`);
};

export const processKycCallback = async (callbackData) => {
  return api.post("/process-kyc-callback", callbackData);
};

export const logout = async () => {
  console.log("🔍 Starting logout process...");

  tokenService.clearAll();
  localStorage.removeItem("inactivity_minutes");
  localStorage.removeItem("logout_deadline");
  console.log("✅ Token and partner data cleared");

  try {
    const response = await api.post("/logout");
    console.log("✅ Backend logout successful");
    return response;
  } catch (error) {
    console.error(
      "❌ Backend logout failed, but local data was cleared:",
      error.message
    );
    return { status: "local_logout_complete" };
  }
};

export const getLogoutTime = async () => {
  return api.get("/logout-time");
};

const INACTIVITY_MINUTES_KEY = "inactivity_minutes";

export const fetchAndStoreLogoutTime = async () => {
  try {
    const res = await getLogoutTime();
    const minutes = res.data?.expiry_time;
    if (minutes) {
      localStorage.setItem(INACTIVITY_MINUTES_KEY, minutes.toString());
      console.log("✅ Inactivity limit stored:", minutes, "min");
    }
  } catch (err) {
    console.error("❌ Failed to fetch logout-time:", err.message);
    localStorage.setItem(INACTIVITY_MINUTES_KEY, "15");
  }
};

export const getPartnerConfig = async (partnerId) => {
  return debouncedApiCall(`partner-config-${partnerId}`, () =>
    api.get(`/partner-basic-setup/${partnerId}`)
  );
};

export const sendOtp = async (mobileNumber) => {
  return api.post("/send-otp", {
    mobile_number: mobileNumber,
  });
};

export const validateOtp = async (otpData) => {
  return api.post("/validate-otp", otpData);
};

export const forgotPassword = async (email) => {
  return api.post("/forgot-password", { email });
};

export const resetPassword = async (resetData) => {
  return api.post("/reset-password", resetData);
};

export const registerUser = async (userData) => {
  return api.post("/register", userData);
};

export const verifyEmail = async (verificationData) => {
  return api.post("/verify-email", verificationData);
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
  return api.post("/change-password", passwordData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ===================== KYC & BANKING OPERATIONS =====================

export const initiateKycProcess = async (customerId, token) => {
  return api.post(
    "/kyc/initiate",
    { customer_id: customerId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
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
  return api.post("/bank-accounts", bankAccountData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ===================== SESSION MANAGEMENT =====================

export const refreshAuthToken = async (refreshToken) => {
  return api.post("/refresh-token", { refresh_token: refreshToken });
};

export const validateSession = async (token) => {
  return api.get("/validate-session", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ===================== UTILITY FUNCTIONS =====================

export const extractErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred.";

  if (error.response?.data) {
    const data = error.response.data;

    // 1. If 'message' is an object containing validation arrays: { field: ["error message"] }
    if (data.message && typeof data.message === "object") {
      return Object.values(data.message)
        .flat()
        .join(" ");
    }

    // 2. If 'errors' is an object containing validation arrays: { errors: { field: ["..."] } }
    if (data.errors && typeof data.errors === "object") {
      return Object.values(data.errors)
        .flat()
        .join(" ");
    }

    // 3. If 'message' is a plain string
    if (typeof data.message === "string" && data.message.trim() !== "") {
      return data.message;
    }

    // 4. If 'error' is a string or object
    if (data.error) {
      if (typeof data.error === "string") return data.error;
      if (typeof data.error === "object") {
        return Object.values(data.error)
          .flat()
          .join(" ");
      }
    }
  }

  // Fallback to error message string
  if (typeof error.message === "string") {
    return error.message;
  }

  return String(error);
};

export const handleApiError = (error, dispatch = null) => {
  let errorMessage = extractErrorMessage(error);

  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = "Session expired. Please login again.";
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
    return { healthy: false, status: "NO_TOKEN" };
  }

  const validation = tokenService.safeValidateToken(token);

  if (!validation.isValid) {
    return { healthy: false, status: "INVALID_TOKEN", details: validation };
  }

  if (validation.isExpired) {
    return { healthy: false, status: "EXPIRED_TOKEN", details: validation };
  }

  return { healthy: true, status: "HEALTHY", details: validation };
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
  fetchAndStoreLogoutTime,
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
  clearCacheForKey,
};