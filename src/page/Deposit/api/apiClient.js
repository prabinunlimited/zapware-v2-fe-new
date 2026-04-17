// src/api/apiClient.js - UPDATED
import axios from "axios";
import { tokenService } from "../../../services/authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ MODIFIED: Request interceptor with iframe support
apiClient.interceptors.request.use(
  (config) => {
    // ✅ AUTO-DETECT IFRAME AND ADD HEADER
    const isIframe = window.self !== window.top;
    if (isIframe) {
      config.headers["X-Is-Iframe"] = "true";

      // Try to get customerId from URL params for iframe
      const urlParams = new URLSearchParams(window.location.search);
      const iframeCustomerId = urlParams.get("customerId");
      if (iframeCustomerId) {
        config.headers["X-Iframe-Customer-Id"] = iframeCustomerId;
      }
    }

    // ✅ GET TOKEN BASED ON CONTEXT
    let token;
    if (isIframe) {
      // Iframe: try sessionStorage first, then tokenService
      token = sessionStorage.getItem("iframe_token") || tokenService.getToken();
    } else {
      // Main app: use tokenService
      token = tokenService.getToken();
    }

    // Don't add token to login requests
    if (
      config.url.includes("/partner-login") ||
      config.url.includes("/login") ||
      config.url.includes("/auth")
    ) {
      return config;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No token found for API client request");
    }

    return config;
  },
  (error) => {
    console.error("❌ API Client Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ ADDED: Iframe token handling in response
apiClient.interceptors.response.use(
  (response) => {
    // If in iframe and response contains a token, store it
    const isIframe = window.self !== window.top;
    if (isIframe && response.data?.data?.token) {
      const token = response.data.data.token;
      sessionStorage.setItem("iframe_token", token);
      tokenService.setToken(token);
    }
    return response;
  },
  (error) => {
    console.error("❌ API Client Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      isIframe: window.self !== window.top,
    });

    // Handle unauthorized in iframe
    if (error.response?.status === 401 && window.self !== window.top) {
      console.log("🔑 401 in iframe - token may need refresh");
    }

    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
