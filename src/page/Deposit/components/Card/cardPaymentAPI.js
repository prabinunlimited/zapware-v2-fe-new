// src/api/cardPaymentAPI.js
import { apiClient } from "../../api/apiClient";

export const cardPaymentAPI = {
  getAdyenSession: (paymentData) => {
    console.log("🔄 Getting Adyen session for:", paymentData);
    return apiClient.post("/adyen/session", paymentData);
  },

  // Enhanced version with better error handling
  getAdyenSessionEnhanced: async (paymentData) => {
    try {
      const response = await apiClient.post("/adyen/session", paymentData);

      console.log("🔍 Raw API Response:", {
        status: response.data.status,
        hasSession: !!response.data.session,
        sessionId: response.data.session?.id,
        hasSessionData: !!response.data.session?.sessionData,
      });

      if (response.data.status === "success" && response.data.session) {
        return response;
      } else {
        throw new Error("Invalid session response structure");
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      throw error;
    }
  },
};

export default cardPaymentAPI;
