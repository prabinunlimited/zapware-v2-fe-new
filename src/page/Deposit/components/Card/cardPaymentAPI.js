// src/api/cardPaymentAPI.js
import { apiClient } from "../../api/apiClient";

export const cardPaymentAPI = {
  // ✅ FIXED: Changed endpoint to match your backend
  getAdyenSession: (paymentData) => {
    return apiClient.post("/adyen/create-session", paymentData); // ← Changed from "/adyen/session"
  },

  // ✅ FIXED: Enhanced version with proper error handling
  getAdyenSessionEnhanced: async (paymentData) => {
    try {
      const response = await apiClient.post("/adyen/create-session", paymentData, {
        timeout: 20000, // Longer timeout for live payments
        headers: {
          'X-Environment': 'live' // Optional: Tell backend this is for live
        }
      });

      console.log("✅ Adyen session API response:", {
        status: response.status,
        data: response.data
      });

      if (response.data.status === "success" && response.data.session) {
        return response;
      } else {
        // Handle different response formats
        if (response.data.sessionData) {
          // Some backends return sessionData directly
          return {
            ...response,
            data: {
              ...response.data,
              session: {
                id: response.data.sessionId,
                sessionData: response.data.sessionData
              }
            }
          };
        }
        throw new Error(response.data.message || "Invalid session response structure");
      }
    } catch (error) {
      console.error("❌ Adyen session API error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Enhanced error handling
      if (error.response?.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.response?.status === 403) {
        throw new Error("Access denied. Please check your permissions.");
      } else if (error.response?.status === 422) {
        throw new Error("Invalid payment data. Please check the amount and currency.");
      } else if (error.code === 'ECONNABORTED') {
        throw new Error("Request timeout. Please try again.");
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error("Network error. Please check your connection.");
      }
      
      throw error;
    }
  },

  // ✅ NEW: Submit payment for processing
  submitPayment: async (paymentDetails) => {
    try {
      const response = await apiClient.post("/adyen/submit-payment", paymentDetails, {
        timeout: 30000
      });

      if (response.data.status === "success") {
        return response;
      } else {
        throw new Error(response.data.message || "Payment submission failed");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      throw error;
    }
  },

  // ✅ NEW: Check payment status
  checkPaymentStatus: async (sessionId) => {
    try {
      const response = await apiClient.get(`/adyen/payment-status/${sessionId}`);
      return response;
    } catch (error) {
      console.error("Payment status check error:", error);
      throw error;
    }
  },

  // ✅ NEW: Create session with fallback for different response formats
  createSession: async (paymentData) => {
    try {
      // Try primary endpoint
      const response = await apiClient.post("/adyen/create-session", paymentData);
      
      // Handle different response formats
      const data = response.data;
      
      if (data.status === "success") {
        // Format 1: Has session object
        if (data.session) {
          return data.session;
        }
        // Format 2: Has sessionData directly
        else if (data.sessionData) {
          return {
            id: data.sessionId || `session_${Date.now()}`,
            sessionData: data.sessionData,
            amount: data.amount || {
              value: Math.round(paymentData.send_amount * 100),
              currency: paymentData.from_currency
            }
          };
        }
      }
      
      throw new Error("Invalid session response format");
    } catch (error) {
      // Fallback to old endpoint if new one fails
      try {
        console.log("🔄 Trying fallback endpoint...");
        const fallbackResponse = await apiClient.post("/adyen/session", paymentData);
        
        if (fallbackResponse.data.status === "success") {
          return fallbackResponse.data.session || fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
      
      throw error;
    }
  }
};

export default cardPaymentAPI;