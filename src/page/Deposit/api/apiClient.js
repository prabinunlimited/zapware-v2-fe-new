import axios from "axios";
import { tokenService } from "../../../services/authService"; // Your existing service

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // ✅ USE YOUR TOKEN SERVICE FROM AUTH SERVICE
    const token = tokenService.getToken();

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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("❌ API Client Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
    });

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      console.error("🚨 401 Unauthorized - token may be invalid");
      // Token service will handle clearing if needed
    }

    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;