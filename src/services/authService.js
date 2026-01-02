// src/services/authService.js - UPDATED VERSION (Removed unnecessary API call)
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

      // Store white labelled partner status
      if (partnerData.is_white_labelled_partner !== undefined) {
        localStorage.setItem(
          "is_white_labelled_partner",
          partnerData.is_white_labelled_partner
        );
        console.log(
          "✅ is_white_labelled_partner stored:",
          partnerData.is_white_labelled_partner
        );

        // Also store in the old key for backward compatibility
        localStorage.setItem(
          "iswhitelabelledpartner",
          partnerData.is_white_labelled_partner === "1" ? "Y" : "N"
        );
      }

      // Store partner UUID
      if (partnerData.partner_uuid) {
        localStorage.setItem("partner_uuid", partnerData.partner_uuid);
        console.log("✅ partner_uuid stored:", partnerData.partner_uuid);
      }

      // Store partner package module flag
      if (partnerData.isPartnerPackageModule !== undefined) {
        localStorage.setItem(
          "isPartnerPackageModule",
          partnerData.isPartnerPackageModule
        );
        console.log(
          "✅ isPartnerPackageModule stored:",
          partnerData.isPartnerPackageModule
        );
      }

      // Store remittance only flag
      if (partnerData.showRemittanceOnlyOnRegistration !== undefined) {
        localStorage.setItem(
          "showRemittanceOnlyOnRegistration",
          partnerData.showRemittanceOnlyOnRegistration
        );
        console.log(
          "✅ showRemittanceOnlyOnRegistration stored:",
          partnerData.showRemittanceOnlyOnRegistration
        );
      }

      // Store partner name if available
      if (partnerData.partner_name) {
        localStorage.setItem("partner_name", partnerData.partner_name);
      }

      // Store logo if available
      if (partnerData.logo_url) {
        localStorage.setItem("partner_logo", partnerData.logo_url);
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

export const partnerLogin = async () => {
  try {
    console.log("🔍 Starting partner login...");

    // First check if we have a valid token using our service
    const existingToken = tokenService.getToken();
    const existingLogo = localStorage.getItem("partner_logo");

    if (existingToken && existingLogo) {
      const validation = tokenService.safeValidateToken(existingToken);

      if (validation.isValid && !validation.isExpired) {
        console.log("🔍 Existing token and logo are valid, returning");
        return {
          status: "success",
          data: {
            token: existingToken,
            partner_id: tokenService.getPartnerId(),
            beneficiary_portal_title: tokenService.getBeneficiaryPortalTitle(),
            logo_url: existingLogo,
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
        hostname: currentHostname,
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
      const partnerId = partnerData.partner_id;

      // ✅ STORE PARTNER DATA USING TOKEN SERVICE
      tokenService.setPartnerData(partnerData);
      console.log("✅ Partner data stored from partnerLogin");

      // ✅ FETCH COMPLETE PARTNER DETAILS FROM get-partner-detail API
      // This includes logo, partner name, and all other partner config
      try {
        console.log(
          "🔍 Fetching complete partner details for:",
          currentHostname
        );

        // This will call /partners/get-partner-detail/{hostname}
        const partnerDetailsResponse = await fetchPartnerDetails(
          currentHostname
        );

        if (partnerDetailsResponse?.data?.data) {
          console.log(
            "✅ Complete partner details stored:",
            partnerDetailsResponse.data.data
          );

          // Update tokenService with the complete data
          tokenService.setPartnerData(partnerDetailsResponse.data.data);

          // Also ensure partner_id is stored (in case it's different)
          if (partnerDetailsResponse.data.data.partner_id) {
            localStorage.setItem(
              "whitelabelledpartnerid",
              String(partnerDetailsResponse.data.data.partner_id)
            );
          }
        }
      } catch (partnerDetailsError) {
        console.warn(
          "⚠️ Could not fetch complete partner details:",
          partnerDetailsError.message
        );
        // Don't fail the entire login if this fails - we already have basic partner data
      }

      // Store the token using our service
      tokenService.setToken(token);

      // Verify storage worked
      const storedToken = tokenService.getToken();
      if (storedToken === token) {
        console.log("✅ Token storage verified successfully");
        return {
          ...response.data,
          data: {
            ...response.data.data,
            logo_url: localStorage.getItem("partner_logo"),
          },
        };
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
  // ✅ FIX 1: Use tokenService instead of direct localStorage access
  const existingToken = tokenService.getToken();
  const partnerId = tokenService.getPartnerId();

  // ✅ FIX 2: Add token validation check
  let tokenIsValid = false;
  if (existingToken) {
    const validation = tokenService.safeValidateToken(existingToken);
    tokenIsValid = validation.isValid && !validation.isExpired;
  }

  // ✅ FIX 3: Check if we should return existing token
  if (existingToken && partnerId && tokenIsValid && !forceRefresh) {
    console.log("🔍 Returning validated existing bearer token");
    return existingToken;
  }

  // ✅ FIX 4: If token exists but is invalid, clear it
  if (existingToken && !tokenIsValid) {
    console.log("🔍 Token exists but invalid/expired, clearing...");
    tokenService.clearToken();
  }

  // ✅ FIX 5: Prevent multiple simultaneous token refreshes
  if (tokenRefreshPromise) {
    console.log("🔍 Token refresh already in progress, waiting...");
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      console.log("🔍 Fetching new bearer token with partner details...");

      // Get current hostname
      const currentHostname = window.location.hostname;
      console.log("🔍 Current hostname:", currentHostname);

      // Call partner-login API
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/partner-login`,
        {
          client_id: "HK6V7709",
          client_secret: "057d433a-2d02-437b-a265-56114567aa44",
          hostname: currentHostname,
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
      });

      if (response.data?.data?.token) {
        const token = response.data.data.token;
        const partnerData = response.data.data;
        const partnerId = partnerData.partner_id;

        console.log("🔍 Token received:", token.substring(0, 20) + "...");

        // ✅ Store basic partner data
        tokenService.setPartnerData(partnerData);
        console.log("✅ Basic partner data stored successfully");

        // ✅ Store the token
        tokenService.setToken(token);
        console.log("✅ Token stored successfully");

        // ✅ FETCH COMPLETE PARTNER DETAILS (INCLUDES LOGO)
        try {
          console.log(
            "🔍 Fetching complete partner details for:",
            currentHostname
          );

          // This will call /partners/get-partner-detail/{hostname}
          const partnerDetailsResponse = await fetchPartnerDetails(
            currentHostname
          );

          if (partnerDetailsResponse?.data?.data) {
            console.log(
              "✅ Complete partner details stored:",
              partnerDetailsResponse.data.data
            );

            // Update tokenService with the complete data
            tokenService.setPartnerData(partnerDetailsResponse.data.data);

            // Also ensure partner_id is stored (in case it's different)
            if (partnerDetailsResponse.data.data.partner_id) {
              localStorage.setItem(
                "whitelabelledpartnerid",
                String(partnerDetailsResponse.data.data.partner_id)
              );
            }
          }
        } catch (partnerDetailsError) {
          console.warn(
            "⚠️ Could not fetch complete partner details:",
            partnerDetailsError.message
          );
          // Don't fail the entire token fetch if this fails
        }

        // ✅ Verify token storage
        const storedToken = tokenService.getToken();
        if (storedToken !== token) {
          console.error("❌ Token storage verification failed");
          throw new Error("Token storage verification failed");
        }

        console.log("✅ Token and partner details stored successfully");
        return token;
      } else {
        console.error("❌ Invalid token response structure:", response.data);
        throw new Error("Invalid token response structure");
      }
    } catch (error) {
      console.error("❌ Error in getBearerToken:", error.message);
      tokenService.clearAll();
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
    const hasLogo = !!localStorage.getItem("partner_logo");

    console.log("🔍 initializePartnerToken check:", {
      tokenExists: tokenDebug.exists,
      partnerExists: partnerDebug.exists,
      partnerId: partnerDebug.partnerId,
      hasLogo,
    });

    // ✅ IMPROVED: Call partnerLogin if we're missing ANY of: token, partner data, or logo
    if (!tokenDebug.exists || !partnerDebug.exists || !hasLogo) {
      console.log(
        "🔍 Missing token, partner data, or logo, calling partnerLogin"
      );
      await partnerLogin();
    } else {
      console.log(
        "🔍 Token, partner data, and logo already exist, skipping API call"
      );
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
  return debouncedApiCall(`partner-${hostName}`, async () => {
    const response = await api.get(`/partners/get-partner-detail/${hostName}`);

    // ✅ STORE THE RESPONSE DATA TO localStorage
    if (response.data?.status === "success" && response.data?.data) {
      const partnerData = response.data.data;

      console.log("🔍 Storing partner details from API response:", partnerData);

      // Store all partner data fields
      if (partnerData.is_white_labelled_partner !== undefined) {
        localStorage.setItem(
          "is_white_labelled_partner",
          partnerData.is_white_labelled_partner
        );
        console.log(
          "✅ is_white_labelled_partner stored:",
          partnerData.is_white_labelled_partner
        );
      }

      if (partnerData.partner_id !== undefined) {
        localStorage.setItem(
          "whitelabelledpartnerid",
          String(partnerData.partner_id)
        );
        console.log("✅ partner_id stored:", partnerData.partner_id);
      }

      if (partnerData.partner_uuid !== undefined) {
        localStorage.setItem("partner_uuid", partnerData.partner_uuid);
        console.log("✅ partner_uuid stored:", partnerData.partner_uuid);
      }

      if (partnerData.isPartnerPackageModule !== undefined) {
        localStorage.setItem(
          "isPartnerPackageModule",
          partnerData.isPartnerPackageModule
        );
        console.log(
          "✅ isPartnerPackageModule stored:",
          partnerData.isPartnerPackageModule
        );
      }

      if (partnerData.showRemittanceOnlyOnRegistration !== undefined) {
        localStorage.setItem(
          "showRemittanceOnlyOnRegistration",
          partnerData.showRemittanceOnlyOnRegistration
        );
        console.log(
          "✅ showRemittanceOnlyOnRegistration stored:",
          partnerData.showRemittanceOnlyOnRegistration
        );
      }

      // ✅ STORE LOGO - The API returns 'logo' not 'logo_url'
      if (partnerData.logo) {
        localStorage.setItem("partner_logo", partnerData.logo);
        console.log("✅ partner_logo stored:", partnerData.logo);
      }

      // ✅ STORE PARTNER NAME - The API returns 'name' not 'partner_name'
      if (partnerData.name) {
        localStorage.setItem("partner_name", partnerData.name);
        console.log("✅ partner_name stored:", partnerData.name);

        // Also store in the old key for backward compatibility
        localStorage.setItem(
          "whitelabelled_customer_partnername",
          partnerData.name
        );
      }

      // Also update tokenService's partner data storage
      tokenService.setPartnerData({
        ...partnerData,
        // Map 'name' to 'partner_name' for tokenService compatibility
        partner_name: partnerData.name,
        // Map 'logo' to 'logo_url' for tokenService compatibility
        logo_url: partnerData.logo,
      });
    }

    return response;
  });
};

export const login = async (credentials) => {
  return api.post("/login", credentials);
};

export const requestPasscodeLogin = async ({
  email,
  password,
  customer_type,
}) => {
  // ✅ ADD DEBUG HERE FIRST
  console.trace("request-passcode-login called from authService.js");
  console.log("Token at time of call:", localStorage.getItem("bearertoken"));
  console.log("Call parameters:", {
    email,
    hasPassword: !!password,
    customer_type,
  });

  // Get the bearer token
  const token =
    localStorage.getItem("bearertoken") || localStorage.getItem("authtoken");

  if (!token) {
    console.error("❌ NO bearer token available for request-passcode-login");
    console.log("Current localStorage tokens:", {
      bearertoken: localStorage.getItem("bearertoken"),
      authtoken: localStorage.getItem("authtoken"),
      timestamp: new Date().toISOString(),
    });

    // Try to get a fresh token if none exists
    try {
      console.log("🔄 Attempting to get fresh bearer token...");
      const freshToken = await getBearerToken();
      if (freshToken) {
        console.log("✅ Fresh token obtained");
        token = freshToken;
      }
    } catch (tokenError) {
      console.error("❌ Failed to get fresh token:", tokenError);
      throw new Error("Authentication token not available");
    }
  }

  const payload = {
    email,
    password,
    hostname: window.location.hostname,
  };

  if (customer_type) {
    payload.customer_type = customer_type;
  }

  console.log("🔄 Making request-passcode-login API call with:", {
    payload,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : "none",
  });

  return api.post("/request-passcode-login", payload, {
    headers: {
      Authorization: `Bearer ${token}`, // ✅ ADD THIS LINE - CRITICAL FIX
      "Content-Type": "application/json",
    },
  });
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
  return debouncedApiCall("logout-time", () => api.get("/logout"));
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
  if (error.response) {
    return (
      error.response.data?.message ||
      error.response.data?.error ||
      error.message
    );
  }
  return error.message || "An unexpected error occurred";
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

export const initializeAppWithPartnerData = async () => {
  try {
    console.log("🚀 Initializing app with centralized data...");

    // Step 1: Get current hostname
    const hostname = window.location.hostname;
    console.log("🌍 Current hostname:", hostname);

    // Step 2: Check if we have existing valid token and partner data
    const existingToken = tokenService.getToken();
    const existingPartnerId = tokenService.getPartnerId();
    const hasLogo = !!localStorage.getItem("partner_logo");

    const tokenValidation = existingToken
      ? tokenService.safeValidateToken(existingToken)
      : null;
    const hasValidToken =
      tokenValidation?.isValid && !tokenValidation?.isExpired;

    console.log("🔍 Initial state check:", {
      hasToken: !!existingToken,
      hasValidToken,
      hasPartnerId: !!existingPartnerId,
      hasLogo,
      tokenValidation,
    });

    // Step 3: Always call partnerLogin on app startup if we're on a partner domain
    const isPartnerDomain =
      hostname.includes("unlimitedremit.com") ||
      hostname.includes("partner-domain") ||
      hostname !== "localhost";

    if (isPartnerDomain) {
      console.log("🌍 Fetching countries from centralized API...");

      // Step 4: Call partnerLogin to get fresh partner data
      try {
        const loginResult = await partnerLogin();
        console.log("✅ partnerLogin successful:", {
          status: loginResult.status,
          partnerId: loginResult.data?.partner_id,
          hasToken: !!loginResult.data?.token,
        });
      } catch (loginError) {
        console.warn(
          "⚠️ partnerLogin failed, trying getBearerToken:",
          loginError.message
        );

        // Fallback to getBearerToken
        try {
          await getBearerToken(true); // Force refresh
          console.log("✅ Fallback getBearerToken successful");
        } catch (bearerError) {
          console.warn(
            "⚠️ Both partnerLogin and getBearerToken failed:",
            bearerError.message
          );
          // Continue without partner token - non-partner flow
        }
      }

      // Step 5: Fetch partner details for complete data
      try {
        await fetchPartnerDetails(hostname);
        console.log("✅ Partner details fetched successfully");
      } catch (detailsError) {
        console.warn("⚠️ Partner details fetch failed:", detailsError.message);
      }
    } else {
      console.log(
        "🏠 Running in non-partner mode (localhost or non-partner domain)"
      );
    }

    // Step 6: Log debug state
    console.log("🔍 Auth State Debug:", {
      isAuthenticated: tokenService.isValid(),
      token: tokenService.debugToken(),
      customerId: localStorage.getItem("authcustomer_id"),
      isVerifyingPasscode: false,
      localStorageToken: localStorage.getItem("bearertoken"),
      partnerId: tokenService.getPartnerId(),
      isWhiteLabelled: tokenService.isWhiteLabelledPartner(),
      partnerName: tokenService.getPartnerName(),
      beneficiaryPortalTitle: tokenService.getBeneficiaryPortalTitle(),
      hasLogo: !!localStorage.getItem("partner_logo"),
      timestamp: new Date().toISOString(),
    });

    console.log("✅ App initialization completed");
    return true;
  } catch (error) {
    console.error("❌ App initialization failed:", error);
    // Don't throw - let the app continue
    return false;
  }
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
  clearCacheForKey,
};
