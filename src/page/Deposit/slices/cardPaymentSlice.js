// src/features/CardPayment/slices/cardPaymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import cardPaymentAPI from "../components/Card/cardPaymentAPI";
import { tokenService } from "../../../services/authService";

// Async thunks
export const createAdyenSession = createAsyncThunk(
  "cardPayment/createAdyenSession",
  async (paymentData, { rejectWithValue }) => {
    try {
      console.log("🔄 Creating Adyen session:", paymentData);

      const response = await cardPaymentAPI.getAdyenSession(paymentData);

      console.log("✅ Adyen session response:", response.data);

      if (
        !response.data ||
        response.data.status !== "success" ||
        !response.data.session
      ) {
        throw new Error("Invalid session response from server");
      }

      const sessionData = response.data.session;

      // ✅ CRITICAL FIX: Extract the sessionData string from the session object
      const formattedSession = {
        id: sessionData.id,
        sessionData: sessionData.sessionData, // This was missing!
        amount: sessionData.amount,
        countryCode: sessionData.countryCode,
        // Include all session data for debugging
        rawSession: sessionData,
      };

      console.log("✅ Formatted Adyen session:", {
        id: formattedSession.id,
        hasSessionData: !!formattedSession.sessionData,
        sessionDataLength: formattedSession.sessionData?.length,
      });

      return formattedSession;
    } catch (error) {
      console.error("❌ Error creating Adyen session:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to create payment session"
      );
    }
  }
);

export const createAdyenSessionIframe = createAsyncThunk(
  "cardPayment/createAdyenSessionIframe",
  async (paymentData, { rejectWithValue }) => {
    try {
      console.log("🔄 Creating Adyen session for iframe:", paymentData);

      const response = await cardPaymentAPI.getAdyenSessionIframe(paymentData);

      if (!response.data || !response.data.session) {
        throw new Error("Invalid session response from server");
      }

      console.log("✅ Adyen iframe session created successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Error creating Adyen iframe session:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create iframe payment session"
      );
    }
  }
);

export const processPaymentResult = createAsyncThunk(
  "cardPayment/processPaymentResult",
  async (resultData, { rejectWithValue }) => {
    try {
      console.log("🔄 Processing payment result:", resultData);

      const response = await cardPaymentAPI.processPaymentResult(resultData);

      console.log("✅ Payment result processed successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Error processing payment result:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to process payment result"
      );
    }
  }
);

export const completePayment = createAsyncThunk(
  "cardPayment/completePayment",
  async (completionData, { rejectWithValue }) => {
    try {
      console.log("🔄 Completing payment:", completionData);

      const response = await cardPaymentAPI.handlePaymentCompletion(
        completionData
      );

      console.log("✅ Payment completed successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Error completing payment:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete payment"
      );
    }
  }
);

// Initial state
const initialState = {
  // Session data
  session: null,
  sessionLoading: false,
  sessionError: null,

  // Payment processing
  paymentProcessing: false,
  paymentResult: null,
  paymentError: null,

  // UI state
  showPaymentForm: false,
  isPaymentCompleted: false,
  isPaymentFailed: false,

  // Current payment data
  currentPayment: null,

  // Adyen checkout instance
  checkout: null,
};

// Card Payment Slice
const cardPaymentSlice = createSlice({
  name: "cardPayment",
  initialState,
  reducers: {
    // Reset payment state
    resetPaymentState: (state) => {
      return {
        ...initialState,
        // Keep session data but reset payment state
        session: state.session,
        checkout: state.checkout,
      };
    },

    // Clear errors
    clearErrors: (state) => {
      state.sessionError = null;
      state.paymentError = null;
    },

    // Set checkout instance
    setCheckout: (state, action) => {
      state.checkout = action.payload;
    },

    // Set payment status
    setPaymentStatus: (state, action) => {
      const { completed, failed } = action.payload;
      state.isPaymentCompleted = completed || false;
      state.isPaymentFailed = failed || false;
    },

    // Set current payment data
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },

    // Clear session
    clearSession: (state) => {
      state.session = null;
      state.sessionLoading = false;
      state.sessionError = null;
    },

    // Show/hide payment form
    setShowPaymentForm: (state, action) => {
      state.showPaymentForm = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Adyen Session
      .addCase(createAdyenSession.pending, (state) => {
        state.sessionLoading = true;
        state.sessionError = null;
      })
      .addCase(createAdyenSession.fulfilled, (state, action) => {
        state.sessionLoading = false;
        state.session = action.payload.session;
        state.sessionError = null;
      })
      .addCase(createAdyenSession.rejected, (state, action) => {
        state.sessionLoading = false;
        state.sessionError = action.payload;
        state.session = null;
      })

      // Create Adyen Session Iframe
      .addCase(createAdyenSessionIframe.pending, (state) => {
        state.sessionLoading = true;
        state.sessionError = null;
      })
      .addCase(createAdyenSessionIframe.fulfilled, (state, action) => {
        state.sessionLoading = false;
        state.session = action.payload.session;
        state.sessionError = null;
      })
      .addCase(createAdyenSessionIframe.rejected, (state, action) => {
        state.sessionLoading = false;
        state.sessionError = action.payload;
        state.session = null;
      })

      // Process Payment Result
      .addCase(processPaymentResult.pending, (state) => {
        state.paymentProcessing = true;
        state.paymentError = null;
      })
      .addCase(processPaymentResult.fulfilled, (state, action) => {
        state.paymentProcessing = false;
        state.paymentResult = action.payload;
        state.paymentError = null;
      })
      .addCase(processPaymentResult.rejected, (state, action) => {
        state.paymentProcessing = false;
        state.paymentError = action.payload;
        state.paymentResult = null;
      })

      // Complete Payment
      .addCase(completePayment.pending, (state) => {
        state.paymentProcessing = true;
        state.paymentError = null;
      })
      .addCase(completePayment.fulfilled, (state, action) => {
        state.paymentProcessing = false;
        state.paymentResult = action.payload;
        state.paymentError = null;
        state.isPaymentCompleted = true;
        state.isPaymentFailed = false;
      })
      .addCase(completePayment.rejected, (state, action) => {
        state.paymentProcessing = false;
        state.paymentError = action.payload;
        state.paymentResult = null;
        state.isPaymentCompleted = false;
        state.isPaymentFailed = true;
      });
  },
});

// Export actions
export const {
  resetPaymentState,
  clearErrors,
  setCheckout,
  setPaymentStatus,
  setCurrentPayment,
  clearSession,
  setShowPaymentForm,
} = cardPaymentSlice.actions;

// Export selectors
export const selectCardPayment = (state) => state.cardPayment;
export const selectSession = (state) => state.cardPayment.session;
export const selectSessionLoading = (state) => state.cardPayment.sessionLoading;
export const selectSessionError = (state) => state.cardPayment.sessionError;
export const selectPaymentProcessing = (state) =>
  state.cardPayment.paymentProcessing;
export const selectPaymentResult = (state) => state.cardPayment.paymentResult;
export const selectPaymentError = (state) => state.cardPayment.paymentError;
export const selectShowPaymentForm = (state) =>
  state.cardPayment.showPaymentForm;
export const selectIsPaymentCompleted = (state) =>
  state.cardPayment.isPaymentCompleted;
export const selectIsPaymentFailed = (state) =>
  state.cardPayment.isPaymentFailed;
export const selectCurrentPayment = (state) => state.cardPayment.currentPayment;
export const selectCheckout = (state) => state.cardPayment.checkout;

export default cardPaymentSlice.reducer;
