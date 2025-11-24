import axios from "axios";
import { tokenService } from "./authService"; // Your existing service

// ===================== CONFIG =====================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 80000,
});

// ===================== REQUEST DEDUPLICATION =====================
const activeRequests = new Map();
const requestDebounceTimers = new Map();

const getRequestSignature = (config) => {
  return `${config.method?.toUpperCase()}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`;
};

const isDuplicateRequest = (config) => {
  const signature = getRequestSignature(config);
  return activeRequests.has(signature);
};

const addActiveRequest = (config) => {
  const signature = getRequestSignature(config);
  activeRequests.set(signature, true);
};

const removeActiveRequest = (config) => {
  const signature = getRequestSignature(config);
  activeRequests.delete(signature);
};

// ===================== TOKEN MANAGEMENT =====================
export const getBearerToken = async (forceRefresh = false) => {
  // ✅ USE YOUR EXISTING TOKEN SERVICE
  let token = tokenService.getToken();
  
  if (token && !forceRefresh) {
    return token;
  }

  console.log("🔄 Refreshing partner token...");
  
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
      const newToken = response.data.data.token;
      // ✅ USE YOUR TOKEN SERVICE TO STORE
      tokenService.setToken(newToken);
      console.log("✅ Partner token refreshed successfully");
      return newToken;
    } else {
      throw new Error("Invalid token response structure");
    }
  } catch (error) {
    console.error("❌ Token refresh failed:", error);
    tokenService.clearToken();
    throw error;
  }
};

// ===================== REQUEST INTERCEPTOR =====================
api.interceptors.request.use(
  async (config) => {
    const requestId = Math.random().toString(36).substring(7);
    config.requestId = requestId;

    if (isDuplicateRequest(config)) {
      return Promise.reject(new axios.Cancel('Duplicate request cancelled'));
    }

    let urlPath = config.url;
    if (config.baseURL && urlPath.startsWith(config.baseURL)) {
      urlPath = urlPath.replace(config.baseURL, "");
    }
    urlPath = urlPath.split('?')[0];

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

    const isPublicEndpoint = publicEndpoints.some(endpoint => {
      return urlPath === endpoint ||
        urlPath.startsWith(endpoint + '/') ||
        (endpoint !== '/' && urlPath.includes(endpoint));
    });

    if (isPublicEndpoint) {
      addActiveRequest(config);
      return config;
    }

    try {
      // ✅ USE YOUR TOKEN SERVICE
      const token = tokenService.getToken();
      
      console.log("🔐 API Request - Token Check:", {
        url: config.url,
        tokenInfo: tokenService.debugToken(),
        tokenPresent: !!token
      });

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("✅ Token added to headers");
      } else {
        console.warn("⚠️ No token available for API request");
        // Don't throw error, let the server handle authentication
      }

      addActiveRequest(config);
    } catch (error) {
      console.error("❌ Token setup error:", error);
      // Continue without token
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
    removeActiveRequest(response.config);
    return response;
  },
  async (error) => {
    if (error.config) {
      removeActiveRequest(error.config);
    }

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = "Request timeout. Please check your connection.";
      } else {
        error.message = "Network error. Please check your internet connection.";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const isLoginEndpoint = originalRequest.url.includes('/login');

      if (isLoginEndpoint && !originalRequest._retry) {
        error.message = "Invalid email or passcode. Please check your credentials.";
        return Promise.reject(error);
      }

      if (!isLoginEndpoint && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await getBearerToken(true);
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          if (!isLoginEndpoint) {
            // ✅ USE YOUR TOKEN SERVICE TO CLEAR
            tokenService.clearToken();
            localStorage.removeItem("authtoken");
            localStorage.removeItem("authcustomer_id");
            window.location.href = "/";
          }
          return Promise.reject(new Error("Session expired. Please login again."));
        }
      }
    }

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