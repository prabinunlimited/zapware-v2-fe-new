// services/api.js - COMPLETE FIXED VERSION
import axios from "axios";

// ===================== CONFIG =====================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ===================== PUBLIC ENDPOINTS =====================
const publicEndpoints = [
  "/",
  "/register",
  "/terms-condition",
  "/partner-login",
  "/request-passcode-login",
  "/generate-passcode",
  "/verify-passcode",
  "/generate-otp",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
  "/terms-by-partner",
  "/get-manuals",
  "/gif-images",
  "/logout-time",
  "/send-otp-login",
  "/countries",
  "/partners/get-partner-detail",
  "/partner-basic-setup",
  "/login",
  "/kyc",
  "/kycs",
  "/kyc/initiate"
];


let tokenRefreshPromise = null;

// ===================== TOKEN MANAGEMENT =====================
const getBearerToken = async (forceRefresh = false) => {
  let token = localStorage.getItem("bearertoken");
  const tokenTimestamp = localStorage.getItem("bearertoken_timestamp");
  const tokenExpiry = 55 * 60 * 1000; // 55 minutes

  if (token && tokenTimestamp && (Date.now() - parseInt(tokenTimestamp)) < tokenExpiry && !forceRefresh) {
    return token;
  }

  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      console.log("🔐 Fetching new bearer token...");

      const tokenResponse = await axios.post(
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

      if (tokenResponse.data?.data?.token) {
        token = tokenResponse.data.data.token;
        localStorage.setItem("bearertoken", token);
        localStorage.setItem("bearertoken_timestamp", Date.now().toString());
        console.log("✅ Token refreshed successfully");
        return token;
      } else {
        throw new Error("Invalid token response structure");
      }
    } catch (error) {
      console.error("❌ Failed to get bearer token:", error);
      localStorage.removeItem("bearertoken");
      localStorage.removeItem("bearertoken_timestamp");
      throw error;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
};

// ===================== REQUEST INTERCEPTOR =====================
api.interceptors.request.use(
  async (config) => {
    const requestId = Math.random().toString(36).substring(7);
    config.requestId = requestId;

    console.log(`🔄 API Request [${requestId}]: ${config.method?.toUpperCase()} ${config.url}`);

    // Extract clean endpoint path
    let urlPath = config.url;
    if (config.baseURL && urlPath.startsWith(config.baseURL)) {
      urlPath = urlPath.replace(config.baseURL, "");
    }
    urlPath = urlPath.split('?')[0];

    // Check if this is a public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => {
      return urlPath === endpoint ||
        urlPath.startsWith(endpoint + '/') ||
        (endpoint !== '/' && urlPath.includes(endpoint));
    });

    console.log(`🔍 Endpoint Check [${requestId}]: ${urlPath} - Public: ${isPublicEndpoint}`);

    // Skip token for public endpoints
    if (isPublicEndpoint) {
      console.log(`⏩ Skipping token for public endpoint: ${urlPath}`);
      return config;
    }

    // For all other endpoints, require authentication
    console.log(`🔐 Private endpoint requiring token: ${urlPath}`);
    try {
      const token = await getBearerToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`✅ Token added to request: ${urlPath}`);
      } else {
        console.error(`❌ No token available for: ${urlPath}`);
        throw new Error("Authentication token not available");
      }
    } catch (error) {
      console.error(`❌ Token acquisition failed for ${urlPath}:`, error);
      return Promise.reject(new Error("Authentication failed. Please try again."));
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ===================== RESPONSE INTERCEPTOR =====================
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = "Request timeout. Please check your connection.";
      } else {
        error.message = "Network error. Please check your internet connection.";
      }
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - don't retry for login endpoints
    if (error.response?.status === 401) {
      const isLoginEndpoint = originalRequest.url.includes('/login');

      if (isLoginEndpoint && !originalRequest._retry) {
        console.log("🔐 Login 401 - not retrying, invalid credentials");
        // For login endpoints, 401 usually means invalid credentials
        error.message = "Invalid email or passcode. Please check your credentials.";
        return Promise.reject(error);
      }

      if (!isLoginEndpoint && !originalRequest._retry) {
        console.log("🔄 Attempting token refresh due to 401...");
        originalRequest._retry = true;

        try {
          const newToken = await getBearerToken(true);
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);
          // Clear auth data and redirect for non-login endpoints
          if (!isLoginEndpoint) {
            localStorage.clear();
            window.location.href = "/";
          }
          return Promise.reject(new Error("Session expired. Please login again."));
        }
      }
    }

    // Handle other error statuses
    if (error.response.status === 400) {
      error.message = error.response.data?.message || "Invalid request. Please check your input.";
    } else if (error.response.status === 403) {
      error.message = "You don't have permission to access this resource.";
    } else if (error.response.status === 404) {
      error.message = "The requested resource was not found.";
    } else if (error.response.status === 429) {
      error.message = "Too many requests. Please try again later.";
    } else if (error.response.status >= 500) {
      error.message = "Server error. Please try again later.";
    }

    return Promise.reject(error);
  }
);

export default api;