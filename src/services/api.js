// src/services/api.js
import axios from "axios";
import { tokenService } from "./authService";

// ===================== CONFIG =====================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 80000,
});

// ===================== ENHANCED REQUEST COORDINATION =====================
const activeRequests = new Map();
const completedRequests = new Map();
const requestThrottle = new Map();
const globalFetchState = new Map();

// Enhanced request signature with better normalization
const getRequestSignature = (config) => {
  const method = config.method?.toUpperCase() || 'GET';
  const url = new URL(config.url, config.baseURL);
  const pathname = url.pathname.replace(/\/$/, '');
  
  // Normalize parameters - sort keys and handle different data formats
  const params = config.params ? Object.keys(config.params).sort().reduce((acc, key) => {
    acc[key] = String(config.params[key]).toLowerCase();
    return acc;
  }, {}) : {};
  
  // Normalize request data
  let data = '';
  if (config.data) {
    if (typeof config.data === 'string') {
      try {
        // Try to parse and re-stringify to normalize
        const parsed = JSON.parse(config.data);
        data = JSON.stringify(parsed, Object.keys(parsed).sort());
      } catch {
        data = config.data;
      }
    } else {
      data = JSON.stringify(config.data, Object.keys(config.data).sort());
    }
  }
  
  return `${method}-${pathname}-${JSON.stringify(params)}-${data}`;
};

// ✅ FIXED: Atomic duplicate check with immediate request registration
const checkAndRegisterRequest = (config) => {
  const signature = getRequestSignature(config);
  
  // Atomic check: if signature exists in globalFetchState, it's a duplicate
  if (globalFetchState.has(signature)) {
    const state = globalFetchState.get(signature);
    if (state === 'fetching') {
      return { isDuplicate: true, reason: 'global-in-progress', signature };
    }
  }
  
  // Check throttle window (non-critical, can have small race condition)
  const lastRequest = requestThrottle.get(signature);
  if (lastRequest && Date.now() - lastRequest < 3000) {
    return { isDuplicate: true, reason: 'throttled', signature };
  }
  
  // Check for recent cached response
  const completed = completedRequests.get(signature);
  if (completed && Date.now() - completed.timestamp < 10000) { // Increased to 10 seconds
    return { isDuplicate: true, reason: 'cached', signature, data: completed.data };
  }
  
  // ✅ ATOMIC: Register the request immediately
  globalFetchState.set(signature, 'fetching');
  requestThrottle.set(signature, Date.now());
  
  return { isDuplicate: false, signature };
};

const removeActiveRequest = (config) => {
  const signature = getRequestSignature(config);
  activeRequests.delete(signature);
};

// Enhanced cache utility
export const clearApiCache = (urlPattern = null) => {
  if (urlPattern) {
    for (const [signature] of globalFetchState) {
      if (signature.includes(urlPattern)) {
        globalFetchState.delete(signature);
        completedRequests.delete(signature);
        requestThrottle.delete(signature);
      }
    }
  } else {
    globalFetchState.clear();
    completedRequests.clear();
    requestThrottle.clear();
    activeRequests.clear();
  }
};

// ===================== TOKEN MANAGEMENT =====================
export const getBearerToken = async (forceRefresh = false) => {
  let token = tokenService.getToken();
  
  if (token && !forceRefresh) {
    return token;
  }

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
      tokenService.setToken(newToken);
      return newToken;
    } else {
      throw new Error("Invalid token response structure");
    }
  } catch (error) {
    tokenService.clearToken();
    throw error;
  }
};

// ===================== FIXED REQUEST INTERCEPTOR =====================
api.interceptors.request.use(
  async (config) => {
    const requestId = Math.random().toString(36).substring(7);
    config.requestId = requestId;

    // ✅ FIXED: Atomic duplicate check and registration
    const duplicateCheck = checkAndRegisterRequest(config);
    
    if (duplicateCheck.isDuplicate) {
      const { reason, signature, data } = duplicateCheck;
      
      switch (reason) {
        case 'global-in-progress':
          return Promise.reject(new axios.Cancel('Duplicate request - globally coordinated'));
          
        case 'throttled':
          return Promise.reject(new axios.Cancel('Request throttled'));
          
        case 'cached':
          const fakeResponse = {
            data: data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config,
            request: {}
          };
          return Promise.reject({
            __isCachedResponse: true,
            response: fakeResponse
          });
          
        default:
          // Should not happen, but fallback
          return Promise.reject(new axios.Cancel('Duplicate request'));
      }
    }

    // Request is registered, now track in activeRequests for debugging
    const signature = duplicateCheck.signature;
    activeRequests.set(signature, {
      timestamp: Date.now(),
      config: config,
      requestId: requestId
    });

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
      return config;
    }

    try {
      const token = tokenService.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      return Promise.reject(error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===================== ENHANCED RESPONSE INTERCEPTOR =====================
api.interceptors.response.use(
  (response) => {
    const signature = getRequestSignature(response.config);
    
    // ✅ FIXED: Always clean up global state, even on errors
    if (response.status >= 200 && response.status < 300) {
      // Cache successful responses (avoid caching large responses)
      if (JSON.stringify(response.data).length < 100000) {
        completedRequests.set(signature, {
          timestamp: Date.now(),
          data: response.data
        });
      }
      globalFetchState.set(signature, 'completed');
    } else {
      globalFetchState.delete(signature);
    }
    
    // Clean up active requests
    activeRequests.delete(signature);
    

    return response;
  },
  async (error) => {
    // Handle cached responses
    if (error.__isCachedResponse) {
      return Promise.resolve(error.response);
    }

    // Clean up on any error
    if (error.config) {
      const signature = getRequestSignature(error.config);
      globalFetchState.delete(signature);
      activeRequests.delete(signature);
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
            clearApiCache(originalRequest.url);
            return api(originalRequest);
          }
        } catch (refreshError) {
          if (!isLoginEndpoint) {
            tokenService.clearToken();
            localStorage.removeItem("authtoken");
            localStorage.removeItem("authcustomer_id");
            clearApiCache();
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

// Global coordination methods
export const apiCoordinator = {
  setFetching: (signature) => {
    globalFetchState.set(signature, 'fetching');
  },
  
  setCompleted: (signature, data = null) => {
    globalFetchState.set(signature, 'completed');
    if (data) {
      completedRequests.set(signature, {
        timestamp: Date.now(),
        data: data
      });
    }
  },
  
  setFailed: (signature) => {
    globalFetchState.delete(signature);
  },
  
  isFetching: (signature) => {
    return globalFetchState.get(signature) === 'fetching';
  },
  
  hasRecentData: (signature) => {
    const completed = completedRequests.get(signature);
    return completed && Date.now() - completed.timestamp < 10000;
  },
  
  getRecentData: (signature) => {
    const completed = completedRequests.get(signature);
    return completed?.data || null;
  },
  
  clear: (pattern = null) => {
    clearApiCache(pattern);
  },
  
  // ✅ NEW: Force clear a specific signature (useful for retries)
  clearSignature: (signature) => {
    globalFetchState.delete(signature);
    completedRequests.delete(signature);
    requestThrottle.delete(signature);
    activeRequests.delete(signature);
  }
};

export const forceRefreshEndpoint = (endpointPattern) => {
  clearApiCache(endpointPattern);
};

export const debugApiState = () => {
  // Debug function remains but without console.logs
};

export default api;