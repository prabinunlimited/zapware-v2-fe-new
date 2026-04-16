// src/services/api.js - UPDATED WITHOUT COUNTRIES API
import axios from "axios";
import {
  tokenService,
  getBearerToken as fetchBearerToken,
} from "./authService";

// ===================== CONFIG =====================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 80000,
});

// ===================== ERROR HANDLER WITH POPUP =====================
class GlobalErrorHandler {
  constructor() {
    this.isErrorHandled = false;
    this.errorListeners = [];
    this.pendingRequests = new Set();
  }

  // Add a request to pending set
  addPendingRequest(requestId) {
    this.pendingRequests.add(requestId);
  }

  // Remove request from pending set
  removePendingRequest(requestId) {
    this.pendingRequests.delete(requestId);
  }

  // Cancel all pending requests
  cancelAllPendingRequests() {
    console.log(
      `🚫 Cancelling ${this.pendingRequests.size} pending requests...`,
    );
    this.pendingRequests.forEach((requestId) => {
      // You can implement actual cancellation logic here if needed
      console.log(`Cancelling request: ${requestId}`);
    });
    this.pendingRequests.clear();
  }

  // Handle API failure
  handleApiFailure(error, config) {
    // Prevent multiple popups for the same error chain
    if (this.isErrorHandled) {
      console.log("⚠️ Error already being handled, skipping duplicate");
      return;
    }

    this.isErrorHandled = true;

    // Cancel all other pending requests
    this.cancelAllPendingRequests();

    // Extract error message from response
    let errorMessage = "An unexpected error occurred";
    let errorDetails = null;

    if (error.response) {
      // Server responded with error status
      errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.statusText ||
        `Request failed with status ${error.response.status}`;
      errorDetails = error.response.data;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = "Network error - No response from server";
    } else {
      // Something else happened
      errorMessage = error.message || "Request failed";
    }

    // Show popup/notification
    this.showErrorPopup(errorMessage, errorDetails, error, config);

    // Trigger all registered listeners
    this.errorListeners.forEach((listener) => {
      try {
        listener({
          message: errorMessage,
          details: errorDetails,
          error,
          config,
        });
      } catch (err) {
        console.error("Error in listener:", err);
      }
    });
  }

  // Show error popup
  showErrorPopup(message, details, error, config) {
    // Create popup container if it doesn't exist
    let popupContainer = document.getElementById("api-error-popup");
    if (!popupContainer) {
      popupContainer = document.createElement("div");
      popupContainer.id = "api-error-popup";
      popupContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      document.body.appendChild(popupContainer);
    }

    // Create popup content
    const popupHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        padding: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="
            background: #fee2e2;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
          ">
            <svg style="width: 24px; height: 24px; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0;">Request Failed</h3>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #4b5563; margin-bottom: 12px; line-height: 1.5;">
            ${message}
          </p>
          ${
            details
              ? `
            <details style="margin-top: 12px;">
              <summary style="color: #6b7280; cursor: pointer; font-size: 14px;">Show details</summary>
              <pre style="
                background: #f3f4f6;
                padding: 12px;
                border-radius: 6px;
                margin-top: 8px;
                font-size: 12px;
                overflow-x: auto;
                color: #374151;
              ">${JSON.stringify(details, null, 2)}</pre>
            </details>
          `
              : ""
          }
          ${
            config
              ? `
            <div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
              <strong>Endpoint:</strong> ${config.method?.toUpperCase()} ${config.url}
            </div>
          `
              : ""
          }
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button onclick="this.closest('#api-error-popup').remove()" style="
            padding: 8px 16px;
            background: #f3f4f6;
            border: none;
            border-radius: 6px;
            color: #374151;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
          " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
            Dismiss
          </button>
          <button onclick="window.location.reload()" style="
            padding: 8px 16px;
            background: #dc2626;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
          " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
            Retry
          </button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    `;

    popupContainer.innerHTML = popupHTML;

    // Close popup when clicking outside
    popupContainer.addEventListener("click", (e) => {
      if (e.target === popupContainer) {
        popupContainer.remove();
      }
    });

    // Add to console for debugging
    console.error("🚨 API Error:", {
      message,
      details,
      endpoint: config?.url,
      method: config?.method,
      status: error?.response?.status,
    });
  }

  // Reset error handler state
  reset() {
    this.isErrorHandled = false;
  }

  // Add listener for error events
  addErrorListener(listener) {
    this.errorListeners.push(listener);
  }

  // Remove error listener
  removeErrorListener(listener) {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }
}

// Initialize global error handler
const globalErrorHandler = new GlobalErrorHandler();

// ===================== CENTRALIZED DATA STORE =====================
class DataManager {
  constructor() {
    this.store = new Map(); // In-memory store
    this.pendingRequests = new Map(); // Request deduplication
    this.staleTimes = new Map(); // Cache TTL per endpoint
    this.retryCounts = new Map(); // Retry tracking
    this.requestCounter = 0; // For generating unique request IDs

    // Configure stale times (in milliseconds)
    this.staleTimes.set("/partner-basic-setup/", 5 * 60 * 1000); // 5 minutes
    this.staleTimes.set("/partners/get-partner-detail/", 10 * 60 * 1000); // 10 minutes
    this.staleTimes.set("/gif-images", 15 * 60 * 1000); // 15 minutes
    this.staleTimes.set("/logout", 1 * 60 * 1000); // 1 minute
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${++this.requestCounter}_${Date.now()}`;
  }

  // Generate cache key from config
  getCacheKey(config) {
    const method = config.method?.toUpperCase() || "GET";
    const url = config.url;
    const params = config.params ? JSON.stringify(config.params) : "";
    const data = config.data ? JSON.stringify(config.data) : "";
    return `${method}:${url}:${params}:${data}`;
  }

  // Check if data is still fresh
  isFresh(cacheKey, endpoint) {
    const cached = this.store.get(cacheKey);
    if (!cached) return false;

    const staleTime = this.getStaleTime(endpoint);
    return Date.now() - cached.timestamp < staleTime;
  }

  // Get stale time for endpoint
  getStaleTime(endpoint) {
    for (const [pattern, time] of this.staleTimes) {
      if (endpoint.includes(pattern)) {
        return time;
      }
    }
    return 0; // No caching by default
  }

  // Get cached data
  get(cacheKey) {
    const cached = this.store.get(cacheKey);
    return cached ? cached.data : null;
  }

  // Set cached data
  set(cacheKey, data, endpoint) {
    this.store.set(cacheKey, {
      data,
      timestamp: Date.now(),
      endpoint,
    });
  }

  // Register a pending request
  registerRequest(cacheKey, promise, requestId) {
    this.pendingRequests.set(cacheKey, { promise, requestId });
    globalErrorHandler.addPendingRequest(requestId);

    promise.finally(() => {
      this.pendingRequests.delete(cacheKey);
      globalErrorHandler.removePendingRequest(requestId);
    });

    return promise;
  }

  // Get pending request
  getPendingRequest(cacheKey) {
    const pending = this.pendingRequests.get(cacheKey);
    return pending ? pending.promise : null;
  }

  // Clear cache for specific endpoint
  clearCache(endpointPattern) {
    for (const [key, value] of this.store) {
      if (
        key.includes(endpointPattern) ||
        value.endpoint?.includes(endpointPattern)
      ) {
        this.store.delete(key);
      }
    }
  }

  // Clear all cache
  clearAll() {
    this.store.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats
  getStats() {
    return {
      totalCached: this.store.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.store.keys()),
    };
  }
}

// Initialize data manager
const dataManager = new DataManager();

// ===================== ENHANCED REQUEST INTERCEPTOR =====================
api.interceptors.request.use(
  async (config) => {
    // Generate unique request ID for this request
    config.requestId = dataManager.generateRequestId();

    // Check if error handler is in failed state
    if (globalErrorHandler.isErrorHandled) {
      console.log(`🚫 Request cancelled due to previous error: ${config.url}`);
      return Promise.reject({
        __isCancelled: true,
        message: "Request cancelled due to previous API failure",
        config,
      });
    }

    const cacheKey = dataManager.getCacheKey(config);
    const endpoint = config.url;

    // Check for pending request
    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(`🔄 Reusing pending request: ${endpoint}`);
      return Promise.reject({
        __isPendingReuse: true,
        promise: pending,
        config,
      });
    }

    // Check cache for GET requests
    if (config.method?.toUpperCase() === "GET") {
      const cached = dataManager.get(cacheKey);
      if (cached && dataManager.isFresh(cacheKey, endpoint)) {
        console.log(`💾 Serving cached: ${endpoint}`);
        return Promise.reject({
          __isCachedResponse: true,
          data: cached,
          config,
        });
      }
    }

    // Add auth token if needed
    const publicEndpoints = [
      "/partner-login",
      "/login",
      "/request-passcode-login",
      "/send-otp-login",
      "/send-otp",
      "/validate-otp",
      "/forgot-password",
      "/reset-password",
      "/register",
      "/verify-email",
      "/partners/get-partner-detail/",
      "/partner-basic-setup/",
      "/gif-images",
      "/logout",
      "/get-manuals",
      "/kyc",
      "/kycs",
      "/kyc/initiate",
    ];

    const isPublic = publicEndpoints.some((ep) => endpoint.includes(ep));

    if (!isPublic) {
      try {
        const token = tokenService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        return Promise.reject(error);
      }
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// ===================== ENHANCED RESPONSE INTERCEPTOR =====================
api.interceptors.response.use(
  (response) => {
    const cacheKey = dataManager.getCacheKey(response.config);
    const endpoint = response.config.url;

    // Cache GET responses
    if (
      response.config.method?.toUpperCase() === "GET" &&
      response.status === 200
    ) {
      dataManager.set(cacheKey, response.data, endpoint);
      console.log(`✅ Cached response: ${endpoint}`);
    }

    return response;
  },
  async (error) => {
    // Handle cancelled requests
    if (error.__isCancelled) {
      console.log(`🚫 Request was cancelled: ${error.config?.url}`);
      return Promise.reject(error);
    }

    // Handle cached responses
    if (error.__isCachedResponse) {
      console.log(`💾 Returning cached data: ${error.config.url}`);
      return Promise.resolve({
        data: error.data.data,
        status: 200,
        statusText: "OK (Cached)",
        headers: {},
        config: error.config,
      });
    }

    // Handle pending request reuse
    if (error.__isPendingReuse) {
      console.log(`🔄 Waiting for pending request: ${error.config.url}`);
      try {
        const result = await error.promise;
        return Promise.resolve(result);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    // Handle axios cancel
    if (axios.isCancel(error)) {
      console.log("⚠️ Request cancelled:", error.message);
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Network errors
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        error.message = "Request timeout. Please check your connection.";
      } else {
        error.message = "Network error. Please check your internet connection.";
      }

      // Handle network errors with popup
      globalErrorHandler.handleApiFailure(error, originalRequest);
      return Promise.reject(error);
    }

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      const originalRequest = error.config;

      // ✅ Check for request-passcode-login FIRST
      const isRequestPasscodeLogin = originalRequest.url.includes(
        "/request-passcode-login",
      );
      const isLoginEndpoint = originalRequest.url.includes("/login");

      console.log("🔍 401 Error Debug:", {
        url: originalRequest.url,
        isRequestPasscodeLogin,
        isLoginEndpoint,
        responseData: error.response.data,
      });

      // ✅ SPECIAL HANDLING FOR request-passcode-login
      if (isRequestPasscodeLogin) {
        // This 401 is for INVALID USER CREDENTIALS, NOT token issue
        const errorMessage =
          error.response.data?.message || "Invalid email or password";
        console.log(
          "🔍 request-passcode-login 401 - User credentials issue:",
          errorMessage,
        );

        // Create a clean error object
        const credentialsError = new Error(errorMessage);
        credentialsError.response = error.response;
        credentialsError.config = originalRequest;

        // Don't trigger global error handler for login failures
        return Promise.reject(credentialsError);
      }

      // Handle regular login endpoints
      if (isLoginEndpoint && !originalRequest._retry) {
        error.message =
          "Invalid email or passcode. Please check your credentials.";
        return Promise.reject(error);
      }

      // ✅ Only refresh token for non-login endpoints
      if (
        !isRequestPasscodeLogin &&
        !isLoginEndpoint &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          console.log("🔄 Token appears invalid, attempting to refresh...");
          const newToken = await fetchBearerToken(true);
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            dataManager.clearCache(originalRequest.url);
            return api(originalRequest);
          }
        } catch (refreshError) {
          tokenService.clearToken();
          localStorage.removeItem("authtoken");
          localStorage.removeItem("authcustomer_id");
          dataManager.clearAll();

          // Trigger error handler for token refresh failure
          globalErrorHandler.handleApiFailure(refreshError, originalRequest);

          window.location.href = "/";
          return Promise.reject(
            new Error("Session expired. Please login again."),
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

    // Handle all other errors with popup
    // Skip showing popup for specific endpoints if needed
    const skipErrorEndpoints = ["/login", "/request-passcode-login"];
    const shouldSkipPopup = skipErrorEndpoints.some((ep) =>
      originalRequest?.url?.includes(ep),
    );

    if (!shouldSkipPopup) {
      globalErrorHandler.handleApiFailure(error, originalRequest);
    }

    return Promise.reject(error);
  },
);

// ===================== CENTRALIZED API SERVICE =====================
class CentralizedApiService {
  constructor() {
    this.api = api;
    this.dataManager = dataManager;
    this.errorHandler = globalErrorHandler;
  }

  // Reset error handler state
  resetErrorState() {
    this.errorHandler.reset();
  }

  // ========== PARTNER DATA ==========

  async getPartnerByHostname(hostname, forceRefresh = false) {
    const endpoint = `/partners/get-partner-detail/${hostname}`;
    const cacheKey = `GET:${endpoint}::`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    // Check for pending request
    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(
        `🔄 Reusing pending partner hostname request for: ${hostname}`,
      );
      return pending;
    }

    // Make new request
    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `❌ Failed to fetch partner by hostname ${hostname}:`,
          error,
        );
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  async getPartnerBasicSetup(partnerId, forceRefresh = false) {
    const endpoint = `/partner-basic-setup/${partnerId}`;
    const cacheKey = `GET:${endpoint}::`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(`🔄 Reusing pending partner setup for ID: ${partnerId}`);
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `❌ Failed to fetch partner setup for ID ${partnerId}:`,
          error,
        );
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  // ========== COMMON DATA ==========

  async getGifImages(forceRefresh = false) {
    const endpoint = `/gif-images`;
    const cacheKey = `GET:${endpoint}::`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(`🔄 Reusing pending GIF images request`);
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error("❌ Failed to fetch GIF images:", error);
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  async getLogoutTime(forceRefresh = false) {
    const endpoint = `/logout`;
    const cacheKey = `GET:${endpoint}::`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(`🔄 Reusing pending logout time request`);
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error("❌ Failed to fetch logout time:", error);
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  // ========== AUTH OPERATIONS ==========

  async requestPasscodeLogin(payload) {
    console.trace("centralizedApi.requestPasscodeLogin called");
    console.log("Payload:", payload);

    let token = tokenService.getToken();

    console.log(
      "✅ Token from tokenService:",
      token ? token.substring(0, 20) + "..." : "No token",
    );

    console.log("🔍 Token validation check:", {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 50) + "..." : "none",
      tokenValidation: token ? tokenService.safeValidateToken(token) : null,
    });

    if (token) {
      const validation = tokenService.safeValidateToken(token);
      if (!validation.isValid || validation.isExpired) {
        console.log("⚠️ Token invalid or expired, will fetch fresh one");
        token = null;
      }
    }

    if (!token) {
      console.log("🔄 Token missing or invalid, fetching fresh token...");

      try {
        const freshToken = await fetchBearerToken();
        if (freshToken) {
          token = freshToken;
          console.log(
            "✅ Fresh token obtained:",
            token.substring(0, 20) + "...",
          );
          tokenService.setToken(token);
        } else {
          throw new Error("Authentication token required");
        }
      } catch (tokenError) {
        console.error("❌ Token fetch failed:", tokenError);
        throw new Error("Unable to authenticate. Please try again.");
      }
    }

    console.log("🔄 Making request-passcode-login API call with token...");
    console.log("🔍 Final token to use:", token.substring(0, 50) + "...");

    return this.api.post("/request-passcode-login", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async login(payload) {
    return this.api.post("/login", payload);
  }

  async sendOtpLogin(payload) {
    return this.api.post("/send-otp-login", payload);
  }

  async sendOtp(mobileNumber) {
    return this.api.post("/send-otp", { mobile_number: mobileNumber });
  }

  async validateOtp(payload) {
    return this.api.post("/validate-otp", payload);
  }

  async logout() {
    dataManager.clearAll();
    globalErrorHandler.reset(); // Reset error state on logout
    return this.api.post("/logout");
  }

  // ========== UTILITY METHODS ==========

  clearCache(endpointPattern) {
    dataManager.clearCache(endpointPattern);
  }

  clearAllCache() {
    dataManager.clearAll();
  }

  getCacheStats() {
    return dataManager.getStats();
  }

  // ========== USER DATA ==========

  async getActiveAccountDetails(customerId, forceRefresh = false) {
    const endpoint = `/active-account-details/${customerId}`;
    const cacheKey = `GET:${endpoint}::`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(
        `🔄 Reusing pending account details for customer: ${customerId}`,
      );
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `❌ Failed to fetch account details for customer ${customerId}:`,
          error,
        );
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  async getCustomerProfile(customerId, forceRefresh = false) {
    const endpoint = `/customers/${customerId}/profile`;
    const cacheKey = `GET:${endpoint}::`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(`🔄 Reusing pending customer profile for ID: ${customerId}`);
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `❌ Failed to fetch customer profile for ID ${customerId}:`,
          error,
        );
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  async getPartnerFxCurrencies(partnerId, forceRefresh = false) {
    const endpoint = `/partner-fxcurrencies`;
    const cacheKey = `GET:${endpoint}:${JSON.stringify({
      partner_id: partnerId,
    })}:`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(`🔄 Reusing pending FX currencies for partner: ${partnerId}`);
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint, { params: { partner_id: partnerId } })
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `❌ Failed to fetch FX currencies for partner ${partnerId}:`,
          error,
        );
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  clearPartnerSpecificCache(partnerId) {
    console.log(`🧹 FORCE-CLEARING cache for partner ${partnerId}`);

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes("ourzap-modules")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`🔥 Removed localStorage cache: ${key}`);
    });

    for (const [key, value] of this.dataManager.store) {
      if (key.includes("/partners/ourzap-modules/")) {
        const match = key.match(/\/partners\/ourzap-modules\/(\d+)/);
        if (match && match[1] !== partnerId) {
          console.log(`🗑️ Removing other partner's modules: ${key}`);
          this.dataManager.store.delete(key);
        }
      }
    }

    for (const [key] of this.dataManager.pendingRequests) {
      if (key.includes("/partners/ourzap-modules/")) {
        console.log(`🗑️ Clearing pending modules request: ${key}`);
        this.dataManager.pendingRequests.delete(key);
      }
    }
  }

  async getPartnerModules(partnerId, forceRefresh = false) {
    const endpoint = `/partners/ourzap-modules/${partnerId}`;
    const cacheKey = `GET:${endpoint}::`;

    this.clearPartnerSpecificCache(partnerId);

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) {
        console.log(`✅ Using cached modules for partner ${partnerId}`);
        return cached;
      }
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(`🔄 Reusing pending modules for partner: ${partnerId}`);
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `❌ Failed to fetch modules for partner ${partnerId}:`,
          error,
        );
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }

  async getCurrencyTransactionDetails(
    customerId,
    currency,
    forceRefresh = false,
  ) {
    const endpoint = `/transactions/currency-transaction-details/${customerId}/${currency}`;
    const cacheKey = `GET:${endpoint}::`;

    if (!forceRefresh) {
      const cached = dataManager.get(cacheKey);
      if (cached) return cached;
    }

    const pending = dataManager.getPendingRequest(cacheKey);
    if (pending) {
      console.log(
        `🔄 Reusing pending transaction details for customer ${customerId}, currency ${currency}`,
      );
      return pending;
    }

    const requestId = dataManager.generateRequestId();
    const requestPromise = this.api
      .get(endpoint)
      .then((response) => response.data)
      .catch((error) => {
        console.error(
          `❌ Failed to fetch transaction details for customer ${customerId}, currency ${currency}:`,
          error,
        );
        throw error;
      });

    return dataManager.registerRequest(cacheKey, requestPromise, requestId);
  }
}

// Create and export singleton instance
const centralizedApi = new CentralizedApiService();

export const apiCoordinator = {
  isFetching: (signature) => {
    const parts = signature.split("-");
    if (parts.length >= 3) {
      const method = parts[0];
      const url = parts[1];
      const paramsStr = parts[2];
      const dataStr = parts[3] || "{}";

      let params = {},
        data = {};
      try {
        if (paramsStr && paramsStr !== "{}") params = JSON.parse(paramsStr);
        if (dataStr && dataStr !== "{}") data = JSON.parse(dataStr);
      } catch (e) {
        console.warn("Failed to parse signature:", signature);
      }

      const config = { method, url, params, data };
      const cacheKey = dataManager.getCacheKey(config);
      return !!dataManager.getPendingRequest(cacheKey);
    }
    return false;
  },

  hasRecentData: (signature, maxAge = 60000) => {
    const parts = signature.split("-");
    if (parts.length >= 3) {
      const method = parts[0];
      const url = parts[1];
      const paramsStr = parts[2];
      const dataStr = parts[3] || "{}";

      let params = {},
        data = {};
      try {
        if (paramsStr && paramsStr !== "{}") params = JSON.parse(paramsStr);
        if (dataStr && dataStr !== "{}") data = JSON.parse(dataStr);
      } catch (e) {
        console.warn("Failed to parse signature:", signature);
      }

      const config = { method, url, params, data };
      const cacheKey = dataManager.getCacheKey(config);
      const cached = dataManager.get(cacheKey);
      if (!cached) return false;

      return dataManager.isFresh(cacheKey, url);
    }
    return false;
  },

  getRecentData: (signature) => {
    const parts = signature.split("-");
    if (parts.length >= 3) {
      const method = parts[0];
      const url = parts[1];
      const paramsStr = parts[2];
      const dataStr = parts[3] || "{}";

      let params = {},
        data = {};
      try {
        if (paramsStr && paramsStr !== "{}") params = JSON.parse(paramsStr);
        if (dataStr && dataStr !== "{}") data = JSON.parse(dataStr);
      } catch (e) {
        console.warn("Failed to parse signature:", signature);
      }

      const config = { method, url, params, data };
      const cacheKey = dataManager.getCacheKey(config);
      return dataManager.get(cacheKey);
    }
    return null;
  },

  clearSignature: (signature) => {
    const parts = signature.split("-");
    if (parts.length >= 2) {
      const url = parts[1];
      dataManager.clearCache(url);
    }
  },

  clear: () => {
    dataManager.clearAll();
  },

  setFetching: (signature) => {
    // Handled automatically by DataManager
  },

  setCompleted: (signature, data) => {
    // Handled automatically by DataManager
  },

  setFailed: (signature) => {
    // Handled automatically by DataManager
  },

  // Reset error state
  resetErrorState: () => {
    centralizedApi.resetErrorState();
  },

  // Add error listener
  onApiError: (listener) => {
    globalErrorHandler.addErrorListener(listener);
  },

  // Remove error listener
  offApiError: (listener) => {
    globalErrorHandler.removeErrorListener(listener);
  },
};

// ===================== EXPORTS =====================
export default api;
export { centralizedApi, dataManager };
