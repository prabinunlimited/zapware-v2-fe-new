import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.ourzap.com';

// Existing async thunk
export const fetchPartnerConfig = createAsyncThunk(
  'partner/fetchConfig',
  async (hostname) => {
    const response = await axios.get(
      `${API_URL}/partners/get-partner-detail/${hostname}`
    );
    return response.data.data;
  }
);

// NEW: Async thunk for fetching partner basic setup (colors, etc.)
export const fetchPartnerBasicSetup = createAsyncThunk(
  'partner/fetchBasicSetup',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const authtoken = state.header?.authtoken || localStorage.getItem("authtoken");
      
      // Use the partner ID from your existing slice
      let partnerId = state.partner.whiteLabelledPartnerId || localStorage.getItem("whitelabelledpartnerid");
      if (!partnerId || partnerId === "0") {
        partnerId = localStorage.getItem("whitelabelled_customer_partnerid");
        if (partnerId && partnerId !== "0") {
          localStorage.setItem("whitelabelledpartnerid", partnerId);
        }
      }

      if (!partnerId || partnerId === "0") {
        return rejectWithValue("Invalid partner ID");
      }

      const response = await axios.get(
        `${API_URL}/partner-basic-setup/${partnerId}`,
        {
          headers: { 
            Authorization: `Bearer ${authtoken}`,
            'Cache-Control': 'no-cache'
          },
          timeout: 8000,
        }
      );

      if (response.data?.status === "success") {
        const partnerConfig = response.data;

        // Store in localStorage for persistence
        localStorage.setItem("partnerConfig", JSON.stringify(partnerConfig));
        localStorage.setItem("partnerConfigTimestamp", Date.now().toString());

        // Store individual properties for backward compatibility
        if (partnerConfig.header_color) {
          localStorage.setItem("header_color", partnerConfig.header_color);
          window.dispatchEvent(new Event('storage'));
        }

        if (partnerConfig.text_color) {
          localStorage.setItem("text_color", partnerConfig.text_color);
        }

        if (partnerConfig.download_operation_manual) {
          localStorage.setItem("download_operation_manual", partnerConfig.download_operation_manual);
        }

        return partnerConfig;
      }

      return rejectWithValue("Invalid response structure");
    } catch (error) {
      console.error("Partner config fetch error:", error);
      
      // Fallback to cached config
      const cachedConfig = localStorage.getItem("partnerConfig");
      if (cachedConfig) {
        try {
          return JSON.parse(cachedConfig);
        } catch (e) {
          console.error("Failed to parse cached partner config:", e);
        }
      }
      
      return rejectWithValue(error.message || "Failed to fetch partner config");
    }
  }
);

// Check for cached config on slice initialization
const cachedConfig = localStorage.getItem("partnerConfig");
const initialBasicConfig = cachedConfig ? JSON.parse(cachedConfig) : null;

const partnerSlice = createSlice({
  name: 'partner',
  initialState: {
    // Existing state
    isWhiteLabelledPartner: localStorage.getItem("iswhitelabelledpartner") || "N",
    whiteLabelledPartnerId: localStorage.getItem("whitelabelledpartnerid") || "0",
    isPartnerPackageModule: localStorage.getItem("isPartnerPackageModule") || "N",
    status: 'idle',
    error: null,
    
    // NEW: Basic setup config state
    basicConfig: initialBasicConfig,
    basicConfigLoading: false,
    basicConfigError: null,
    basicConfigLastUpdated: localStorage.getItem("partnerConfigTimestamp"),
  },
  reducers: {
    setPartnerConfig: (state, action) => {
      state.isWhiteLabelledPartner = action.payload.is_white_labelled_partner;
      state.whiteLabelledPartnerId = action.payload.partner_id;
      state.isPartnerPackageModule = action.payload.isPartnerPackageModule;
    },
    // NEW: Basic config reducers
    setBasicConfigLoading: (state, action) => {
      state.basicConfigLoading = action.payload;
    },
    setBasicConfigError: (state, action) => {
      state.basicConfigError = action.payload;
    },
    setBasicConfig: (state, action) => {
      state.basicConfig = action.payload;
      state.basicConfigLastUpdated = Date.now();
    },
    updateHeaderColor: (state, action) => {
      if (state.basicConfig) {
        state.basicConfig.header_color = action.payload;
      }
      localStorage.setItem("header_color", action.payload);
      window.dispatchEvent(new Event('storage'));
    },
    refreshBasicConfig: (state) => {
      state.basicConfigLoading = true;
      state.basicConfigError = null;
    },
    clearBasicConfig: (state) => {
      state.basicConfig = null;
      state.basicConfigLoading = false;
      state.basicConfigError = null;
      state.basicConfigLastUpdated = null;
      localStorage.removeItem("partnerConfig");
      localStorage.removeItem("partnerConfigTimestamp");
    },
  },
  extraReducers: (builder) => {
    builder
      // Existing cases
      .addCase(fetchPartnerConfig.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPartnerConfig.fulfilled, (state, action) => {
        state.isWhiteLabelledPartner = action.payload.is_white_labelled_partner;
        state.whiteLabelledPartnerId = action.payload.partner_id;
        state.isPartnerPackageModule = action.payload.isPartnerPackageModule;
        
        localStorage.setItem("iswhitelabelledpartner", action.payload.is_white_labelled_partner);
        localStorage.setItem("whitelabelledpartnerid", action.payload.partner_id);
        localStorage.setItem("isPartnerPackageModule", action.payload.isPartnerPackageModule);
      })
      // NEW: Basic setup cases
      .addCase(fetchPartnerBasicSetup.pending, (state) => {
        state.basicConfigLoading = true;
        state.basicConfigError = null;
      })
      .addCase(fetchPartnerBasicSetup.fulfilled, (state, action) => {
        state.basicConfigLoading = false;
        state.basicConfig = action.payload;
        state.basicConfigLastUpdated = Date.now();
        state.basicConfigError = null;
      })
      .addCase(fetchPartnerBasicSetup.rejected, (state, action) => {
        state.basicConfigLoading = false;
        state.basicConfigError = action.payload;
        
        // If we have cached config, don't show error
        if (state.basicConfig) {
          state.basicConfigError = null;
        }
      });
  }
});

// Existing selectors
export const { 
  setPartnerConfig, 
  setBasicConfigLoading,
  setBasicConfigError,
  setBasicConfig,
  updateHeaderColor,
  refreshBasicConfig,
  clearBasicConfig
} = partnerSlice.actions;

export const selectPartnerConfig = (state) => state.partner;
export const selectIsWhiteLabelledPartner = (state) => state.partner.isWhiteLabelledPartner;
export const selectWhiteLabelledPartnerId = (state) => state.partner.whiteLabelledPartnerId;
export const selectIsPartnerPackageModule = (state) => state.partner.isPartnerPackageModule;
export const selectPartnerStatus = (state) => state.partner.status;
export const selectPartnerError = (state) => state.partner.error;

// NEW: Basic config selectors
export const selectPartnerBasicConfig = (state) => state.partner.basicConfig;
export const selectPartnerBasicConfigLoading = (state) => state.partner.basicConfigLoading;
export const selectPartnerBasicConfigError = (state) => state.partner.basicConfigError;
export const selectPartnerBasicConfigLastUpdated = (state) => state.partner.basicConfigLastUpdated;
export const selectHeaderColor = (state) => 
  state.partner.basicConfig?.header_color || localStorage.getItem("header_color") || "bg-sky-800";
export const selectTextColor = (state) => 
  state.partner.basicConfig?.text_color || localStorage.getItem("text_color");
export const selectDownloadManualEnabled = (state) => 
  state.partner.basicConfig?.download_operation_manual || localStorage.getItem("download_operation_manual");

export default partnerSlice.reducer;