// src/api/cardPaymentAPI.js
import { apiClient } from "../../api/apiClient";

export const cardPaymentAPI = {
  getAdyenSession: (paymentData) => {
    
    return apiClient.post("/adyen/session", paymentData);
  },

  // Enhanced version with better error handling
  getAdyenSessionEnhanced: async (paymentData) => {
    try {
      const response = await apiClient.post("/adyen/session", paymentData);

      

      if (response.data.status === "success" && response.data.session) {
        return response;
      } else {
        throw new Error("Invalid session response structure");
      }
    } catch (error) {
      
      throw error;
    }
  },
};

export default cardPaymentAPI;
