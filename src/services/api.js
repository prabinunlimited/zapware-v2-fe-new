import axios from "axios";
import { tokenService, getBearerToken } from "./authService"; // ✅ Import getBearerToken

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

// List of endpoints that should bypass coordination (always unique)
const BYPASS_COORDINATION_ENDPOINTS = [
  "verify-passcode",
  "send-passcode",
  "generate-passcode",
  "request-passcode-login",
"payout/remit-payout",
];

// Enhanced request signature with better context awareness
const getRequestSignature = (config) => {
  const method = config.method?.toUpperCase() || "GET";
  const url = new URL(config.url, config.baseURL);
  const pathname = url.pathname.replace(/\/$/, "");

  // Normalize parameters
  const params = config.params
    ? Object.keys(config.params)
        .sort()
        .reduce((acc, key) => {
          acc[key] = String(config.params[key]).toLowerCase();
          return acc;
        }, {})
    : {};

  // Normalize request data
  let data = "";
  if (config.data) {
    if (typeof config.data === "string") {
      try {
        const parsed = JSON.parse(config.data);
        data = JSON.stringify(parsed, Object.keys(parsed).sort());
      } catch {
        data = config.data;
      }
    } else {
      data = JSON.stringify(config.data, Object.keys(config.data).sort());
    }
  }

  // ✅ ENHANCED FIX: For passcode endpoints, include context and timestamp
  const shouldBypassCoordination = BYPASS_COORDINATION_ENDPOINTS.some(
    (endpoint) => pathname.includes(endpoint)
  );

  if (shouldBypassCoordination) {
    const context = config.context || "default";
    const uniqueId = config.uniqueId || Date.now();
    return `${method}-${pathname}-${context}-${uniqueId}-${JSON.stringify(
      params
    )}-${data}`;
  }

  // For other endpoints, use context if provided
  const context = config.context ? `-${config.context}` : "";
  return `${method}-${pathname}${context}-${JSON.stringify(params)}-${data}`;
};

// ✅ ENHANCED: Improved duplicate check with bypass support
const checkAndRegisterRequest = (config) => {
  const signature = getRequestSignature(config);

  // Check if this endpoint should bypass coordination
  const shouldBypassCoordination = BYPASS_COORDINATION_ENDPOINTS.some(
    (endpoint) => config.url.includes(endpoint)
  );

  if (shouldBypassCoordination) {
    // For passcode endpoints, always allow the request but still track it
    globalFetchState.set(signature, "fetching");
    requestThrottle.set(signature, Date.now());
    return { isDuplicate: false, signature, bypassed: true };
  }

  // Atomic check: if signature exists in globalFetchState, it's a duplicate
  if (globalFetchState.has(signature)) {
    const state = globalFetchState.get(signature);
    if (state === "fetching") {
      return { isDuplicate: true, reason: "global-in-progress", signature };
    }
  }

  // Check throttle window (non-critical, can have small race condition)
  const lastRequest = requestThrottle.get(signature);
  if (lastRequest && Date.now() - lastRequest < 3000) {
    return { isDuplicate: true, reason: "throttled", signature };
  }

  // Check for recent cached response
  const completed = completedRequests.get(signature);
  if (completed && Date.now() - completed.timestamp < 10000) {
    return {
      isDuplicate: true,
      reason: "cached",
      signature,
      data: completed.data,
    };
  }

  // ✅ ATOMIC: Register the request immediately
  globalFetchState.set(signature, "fetching");
  requestThrottle.set(signature, Date.now());

  return { isDuplicate: false, signature };
};

// Enhanced cache utility with better cleanup
export const clearApiCache = (urlPattern = null) => {
  if (urlPattern) {
    const patterns = Array.isArray(urlPattern) ? urlPattern : [urlPattern];

    for (const [signature] of globalFetchState) {
      const shouldDelete = patterns.some((pattern) =>
        signature.includes(pattern)
      );
      if (shouldDelete) {
        globalFetchState.delete(signature);
        completedRequests.delete(signature);
        requestThrottle.delete(signature);
        activeRequests.delete(signature);
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
// ❌ REMOVED: The duplicate getBearerToken function is now imported from authService.js

// ===================== ENHANCED REQUEST INTERCEPTOR =====================
api.interceptors.request.use(
  async (config) => {
    const requestId = Math.random().toString(36).substring(7);
    config.requestId = requestId;

    // ✅ ENHANCED: Better duplicate check with bypass support
    const duplicateCheck = checkAndRegisterRequest(config);

    if (duplicateCheck.isDuplicate && !duplicateCheck.bypassed) {
      const { reason, signature, data } = duplicateCheck;

      switch (reason) {
        case "global-in-progress":
          console.log(`🔄 Request cancelled (duplicate): ${config.url}`);
          return;

        case "throttled":
          console.log(`🚦 Request throttled: ${config.url}`);
          return Promise.reject(new axios.Cancel("Request throttled"));

        case "cached":
          console.log(`💾 Serving cached response: ${config.url}`);
          const fakeResponse = {
            data: data,
            status: 200,
            statusText: "OK",
            headers: {},
            config: config,
            request: {},
          };
          return Promise.reject({
            __isCachedResponse: true,
            response: fakeResponse,
          });

        default:
          return;
      }
    }

    // Request is registered, now track in activeRequests for debugging
    const signature = duplicateCheck.signature;
    activeRequests.set(signature, {
      timestamp: Date.now(),
      config: config,
      requestId: requestId,
      url: config.url,
      method: config.method,
    });

    let urlPath = config.url;
    if (config.baseURL && urlPath.startsWith(config.baseURL)) {
      urlPath = urlPath.replace(config.baseURL, "");
    }
    urlPath = urlPath.split("?")[0];

    const publicEndpoints = [
      "/",
      "/register",
      "/partner-login",
      "/request-passcode-login",
      "/generate-passcode",
      "/verify-passcode",
      "/generate-otp",
      "/verify-otp",
      "/forgot-password",
      "/reset-password",
      "/get-manuals",
      "/gif-images",
      "/logout",
      "/send-otp-login",
      "/countries",
      "/partners/get-partner-detail",
      "/partner-basic-setup",
      "/login",
      "/kyc",
      "/kycs",
      "/kyc/initiate",
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) => {
      return (
        urlPath === endpoint ||
        urlPath.startsWith(endpoint + "/") ||
        (endpoint !== "/" && urlPath.includes(endpoint))
      );
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
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ===================== ENHANCED RESPONSE INTERCEPTOR =====================
api.interceptors.response.use(
  (response) => {
    const signature = getRequestSignature(response.config);

    // ✅ ENHANCED: Better cleanup and caching logic
    if (response.status >= 200 && response.status < 300) {
      // Don't cache passcode verification responses (they're time-sensitive)
      const shouldNotCache = BYPASS_COORDINATION_ENDPOINTS.some((endpoint) =>
        response.config.url.includes(endpoint)
      );

      if (!shouldNotCache && JSON.stringify(response.data).length < 100000) {
        completedRequests.set(signature, {
          timestamp: Date.now(),
          data: response.data,
        });
      }
      globalFetchState.set(signature, "completed");
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

      // Don't throttle failed requests for passcode endpoints
      const shouldBypassThrottle = BYPASS_COORDINATION_ENDPOINTS.some(
        (endpoint) => error.config.url.includes(endpoint)
      );

      if (shouldBypassThrottle) {
        requestThrottle.delete(signature);
      }
    }

    if (axios.isCancel(error)) {
      console.log("⚠️ Request cancelled:", error.message);
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        error.message = "Request timeout. Please check your connection.";
      } else {
        error.message = "Network error. Please check your internet connection.";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const isLoginEndpoint = originalRequest.url.includes("/login");

      if (isLoginEndpoint && !originalRequest._retry) {
        error.message =
          "Invalid email or passcode. Please check your credentials.";
        return Promise.reject(error);
      }

      if (!isLoginEndpoint && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await getBearerToken(true); // ✅ Uses imported function
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            clearApiCache(originalRequest.url);
            return api(originalRequest);
          }
        } catch (refreshError) {
          if (!isLoginEndpoint) {
            window.location.href = "/";
          }
          return Promise.reject(
            new Error("Session expired. Please login again.")
          );
        }
      }
    }

    // Enhanced error messages
    if (error.response.status === 400) {
      error.message =
        error.response.data?.message ||
        "Invalid request. Please check your input.";
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

// Enhanced global coordination methods
export const apiCoordinator = {
  setFetching: (signature) => {
    globalFetchState.set(signature, "fetching");
  },

  setCompleted: (signature, data = null) => {
    globalFetchState.set(signature, "completed");
    if (data) {
      completedRequests.set(signature, {
        timestamp: Date.now(),
        data: data,
      });
    }
  },

  setFailed: (signature) => {
    globalFetchState.delete(signature);
  },

  isFetching: (signature) => {
    return globalFetchState.get(signature) === "fetching";
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

  // ✅ ENHANCED: Force clear a specific signature
  clearSignature: (signature) => {
    globalFetchState.delete(signature);
    completedRequests.delete(signature);
    requestThrottle.delete(signature);
    activeRequests.delete(signature);
  },
  // ✅ NEW: Get current state for debugging
  getState: () => {
    return {
      active: Array.from(activeRequests.entries()),
      completed: Array.from(completedRequests.entries()),
      global: Array.from(globalFetchState.entries()),
    };
  },

  // ✅ NEW: Check if endpoint bypasses coordination
  shouldBypassCoordination: (url) => {
    return BYPASS_COORDINATION_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint)
    );
  },
};

// Enhanced debug utility
export const debugApiState = () => {
  console.group("🔧 API Coordinator State");
  console.log("Active Requests:", activeRequests.size);
  console.log("Completed Requests:", completedRequests.size);
  console.log("Global Fetch State:", globalFetchState.size);
  console.log("Bypass Endpoints:", BYPASS_COORDINATION_ENDPOINTS);

  activeRequests.forEach((value, key) => {
    console.log(`Active: ${key}`, value);
  });

  console.groupEnd();
};

export default api;