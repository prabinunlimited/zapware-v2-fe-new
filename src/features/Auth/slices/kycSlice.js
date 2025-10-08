import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://api.ourzap.com";

export const checkKycStatus = createAsyncThunk(
  "kyc/checkStatus",
  async (customerId, { rejectWithValue }) => {
    try {
      // CORRECTED: Use your actual endpoint /kyc/{customer_id}
      const response = await axios.get(`${API_URL}/kyc/${customerId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to check KYC status" });
    }
  }
);

export const initiatePlaidFlow = createAsyncThunk(
  "kyc/initiatePlaid",
  async (customerData, { rejectWithValue }) => {
    try {
      // CORRECTED: Use GET instead of POST and your actual endpoint /kycs/{customerId}
      const response = await axios.get(`${API_URL}/kycs/${customerData.customerId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to initiate Plaid flow" });
    }
  }
);

// NEW: Add thunk for processing KYC callbacks
export const processKycCallback = createAsyncThunk(
  "kyc/processCallback",
  async (callbackData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/process-kyc-callback`, callbackData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to process KYC callback" });
    }
  }
);

const initialState = {
  kyc_status: localStorage.getItem("kyc_status") || null,
  bank_approve_status: localStorage.getItem("bank_approve_status") || null,
  plaid: {
    status: null,
    url: null,
    message: null,
    token: null,
  },
  loading: false,
  error: null,
  callback_processing: false,
};

const kycSlice = createSlice({
  name: "kyc",
  initialState,
  reducers: {
    resetPlaidState: (state) => {
      state.plaid = initialState.plaid;
    },
    setKycStatus: (state, action) => {
      state.kyc_status = action.payload;
      localStorage.setItem("kyc_status", action.payload);
    },
    clearKycErrors: (state) => {
      state.error = null;
    },
    setBankApprovalStatus: (state, action) => {
      state.bank_approve_status = action.payload;
      localStorage.setItem("bank_approve_status", action.payload);
    },
    setPlaidUrl: (state, action) => {
      state.plaid.url = action.payload;
      state.plaid.status = "success";
    },
    resetKycState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Check KYC Status
      .addCase(checkKycStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkKycStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Handle response from your actual backend structure
        if (action.payload.kyc_status !== undefined) {
          state.kyc_status = action.payload.kyc_status;
          localStorage.setItem("kyc_status", action.payload.kyc_status);
        }
        if (action.payload.bank_approve_status !== undefined) {
          state.bank_approve_status = action.payload.bank_approve_status;
          localStorage.setItem("bank_approve_status", action.payload.bank_approve_status);
        }
      })
      .addCase(checkKycStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to check KYC status";
      })
      // Initiate Plaid Flow
      .addCase(initiatePlaidFlow.pending, (state) => {
        state.plaid.status = "pending";
        state.loading = true;
        state.error = null;
      })
      .addCase(initiatePlaidFlow.fulfilled, (state, action) => {
        state.loading = false;
        // Handle response from your actual backend structure
        if (action.payload.kyc_url) {
          state.plaid = {
            status: "success",
            url: action.payload.kyc_url,
            message: "Plaid flow initiated successfully",
            token: null,
          };
        } else {
          state.plaid.status = "error";
          state.plaid.message = "No Plaid URL received";
        }
      })
      .addCase(initiatePlaidFlow.rejected, (state, action) => {
        state.loading = false;
        state.plaid.status = "error";
        state.plaid.message = action.payload?.message || "Plaid flow failed";
        state.error = action.payload?.error;
      })
      // Process KYC Callback
      .addCase(processKycCallback.pending, (state) => {
        state.callback_processing = true;
        state.error = null;
      })
      .addCase(processKycCallback.fulfilled, (state, action) => {
        state.callback_processing = false;
        // Update KYC status based on callback result
        if (action.payload.kyc_status !== undefined) {
          state.kyc_status = action.payload.kyc_status;
          localStorage.setItem("kyc_status", action.payload.kyc_status);
        }
        if (action.payload.bank_approve_status !== undefined) {
          state.bank_approve_status = action.payload.bank_approve_status;
          localStorage.setItem("bank_approve_status", action.payload.bank_approve_status);
        }
      })
      .addCase(processKycCallback.rejected, (state, action) => {
        state.callback_processing = false;
        state.error = action.payload?.message || "Failed to process KYC callback";
      });
  },
});

export const {
  resetPlaidState,
  setKycStatus,
  clearKycErrors,
  setBankApprovalStatus,
  setPlaidUrl,
  resetKycState,
} = kycSlice.actions;

// Selectors
export const selectKycStatus = (state) => state.kyc.kyc_status;
export const selectBankApprovalStatus = (state) => state.kyc.bank_approve_status;
export const selectPlaidState = (state) => state.kyc.plaid;
export const selectKycLoading = (state) => state.kyc.loading;
export const selectKycError = (state) => state.kyc.error;
export const selectCallbackProcessing = (state) => state.kyc.callback_processing;

export default kycSlice.reducer;