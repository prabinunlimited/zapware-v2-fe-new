import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://api.ourzap.com";

// Existing async thunk
export const fetchPartnerConfig = createAsyncThunk(
  "partner/fetchConfig",
  async (hostname) => {
    const response = await axios.get(
      `${API_URL}/partners/get-partner-detail/${hostname}`
    );
    return response.data.data;
  }
);

// Async thunk for fetching partner basic setup (colors, etc.)
export const fetchPartnerBasicSetup = createAsyncThunk(
  "partner/fetchBasicSetup",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const authtoken =
        state.header?.authtoken || localStorage.getItem("authtoken");

      // Use the partner ID from your existing slice
      let partnerId =
        state.partner.whiteLabelledPartnerId ||
        localStorage.getItem("whitelabelledpartnerid");
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
            "Cache-Control": "no-cache",
          },
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
          window.dispatchEvent(new Event("storage"));
        }

        if (partnerConfig.text_color) {
          localStorage.setItem("text_color", partnerConfig.text_color);
        }

        if (partnerConfig.download_operation_manual) {
          localStorage.setItem(
            "download_operation_manual",
            partnerConfig.download_operation_manual
          );
        }

        return partnerConfig;
      }

      return rejectWithValue("Invalid response structure");
    } catch (error) {
      // Fallback to cached config
      const cachedConfig = localStorage.getItem("partnerConfig");
      if (cachedConfig) {
        try {
          return JSON.parse(cachedConfig);
        } catch (e) {}
      }

      return rejectWithValue(error.message || "Failed to fetch partner config");
    }
  }
);

// NEW: Async thunk for fetching partner details with logo
export const fetchPartnerDetails = createAsyncThunk(
  "partner/fetchDetails",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const authtoken =
        state.header?.authtoken || localStorage.getItem("authtoken");

      // Get partner ID from multiple sources
      let partnerId =
        state.partner.whiteLabelledPartnerId ||
        localStorage.getItem("whitelabelledpartnerid");
      
      if (!partnerId || partnerId === "0") {
        partnerId = localStorage.getItem("whitelabelled_customer_partnerid");
        if (partnerId && partnerId !== "0") {
          localStorage.setItem("whitelabelledpartnerid", partnerId);
        }
      }

      if (!partnerId || partnerId === "0") {
        return rejectWithValue("Invalid partner ID");
      }

      console.log("🔍 Fetching partner details for partnerId:", partnerId);
      
      const response = await axios.get(
        `${API_URL}/partners/details/${partnerId}`,
        {
          headers: {
            Authorization: `Bearer ${authtoken}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      console.log("📦 Partner Details API Response:", response.data);
      
      if (response.data) {
        const partnerDetails = response.data;
        
        // Log the structure for debugging
        console.log("🔍 Partner Details Structure:", {
          hasProfile: !!partnerDetails.profile,
          profileKeys: partnerDetails.profile ? Object.keys(partnerDetails.profile) : [],
          hasLogo: !!partnerDetails.profile?.logo,
          logoUrl: partnerDetails.profile?.logo,
          hasPartnerName: !!partnerDetails.profile?.partner_name,
          partnerName: partnerDetails.profile?.partner_name
        });

        // Store partner name if available
        if (partnerDetails.profile?.partner_name) {
          localStorage.setItem("whitelabelled_customer_partnername", partnerDetails.profile.partner_name);
          console.log("✅ Stored partner name:", partnerDetails.profile.partner_name);
        }
        
        // Store logo URL if available
        if (partnerDetails.profile?.logo) {
          localStorage.setItem("partner_logo", partnerDetails.profile.logo);
          console.log("✅ Stored partner logo:", partnerDetails.profile.logo);
        }

        // Store complete details for debugging
        localStorage.setItem("partnerDetails", JSON.stringify(partnerDetails));
        localStorage.setItem("partnerDetailsTimestamp", Date.now().toString());

        return partnerDetails;
      }

      return rejectWithValue("Invalid response structure");
    } catch (error) {
      console.error("❌ Error fetching partner details:", error);
      
      // Fallback to cached details
      const cachedDetails = localStorage.getItem("partnerDetails");
      if (cachedDetails) {
        try {
          console.log("🔄 Falling back to cached partner details");
          return JSON.parse(cachedDetails);
        } catch (e) {
          console.error("Failed to parse cached partner details:", e);
        }
      }
      
      return rejectWithValue(error.message || "Failed to fetch partner details");
    }
  }
);

// Check for cached config on slice initialization
const cachedConfig = localStorage.getItem("partnerConfig");
const initialBasicConfig = cachedConfig ? JSON.parse(cachedConfig) : null;

const cachedDetails = localStorage.getItem("partnerDetails");
const initialPartnerDetails = cachedDetails ? JSON.parse(cachedDetails) : null;

const partnerSlice = createSlice({
  name: "partner",
  initialState: {
    // Existing state
    isWhiteLabelledPartner:
      localStorage.getItem("iswhitelabelledpartner") || "N",
    whiteLabelledPartnerId:
      localStorage.getItem("whitelabelledpartnerid") || "0",
    isPartnerPackageModule:
      localStorage.getItem("isPartnerPackageModule") || "N",
    status: "idle",
    error: null,

    // Basic setup config state
    basicConfig: initialBasicConfig,
    basicConfigLoading: false,
    basicConfigError: null,
    basicConfigLastUpdated: localStorage.getItem("partnerConfigTimestamp"),

    // NEW: Partner details with logo state
    partnerDetails: initialPartnerDetails,
    partnerDetailsLoading: false,
    partnerDetailsError: null,
    partnerDetailsLastUpdated: localStorage.getItem("partnerDetailsTimestamp"),
  },
  reducers: {
    setPartnerConfig: (state, action) => {
      state.isWhiteLabelledPartner = action.payload.is_white_labelled_partner;
      state.whiteLabelledPartnerId = action.payload.partner_id;
      state.isPartnerPackageModule = action.payload.isPartnerPackageModule;
    },
    // Basic config reducers
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
      window.dispatchEvent(new Event("storage"));
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
    
    // NEW: Partner details reducers
    setPartnerDetails: (state, action) => {
      state.partnerDetails = action.payload;
      state.partnerDetailsLastUpdated = Date.now();
    },
    setPartnerDetailsLoading: (state, action) => {
      state.partnerDetailsLoading = action.payload;
    },
    setPartnerDetailsError: (state, action) => {
      state.partnerDetailsError = action.payload;
    },
    refreshPartnerDetails: (state) => {
      state.partnerDetailsLoading = true;
      state.partnerDetailsError = null;
    },
    clearPartnerDetails: (state) => {
      state.partnerDetails = null;
      state.partnerDetailsLoading = false;
      state.partnerDetailsError = null;
      state.partnerDetailsLastUpdated = null;
      localStorage.removeItem("partnerDetails");
      localStorage.removeItem("partnerDetailsTimestamp");
      localStorage.removeItem("partner_logo");
    },
    updatePartnerLogo: (state, action) => {
      if (state.partnerDetails?.profile) {
        state.partnerDetails.profile.logo = action.payload;
      }
      localStorage.setItem("partner_logo", action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Existing cases
      .addCase(fetchPartnerConfig.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPartnerConfig.fulfilled, (state, action) => {
        state.isWhiteLabelledPartner = action.payload.is_white_labelled_partner;
        state.whiteLabelledPartnerId = action.payload.partner_id;
        state.isPartnerPackageModule = action.payload.isPartnerPackageModule;

        // Store partner name if available
        if (action.payload.partner_name) {
          localStorage.setItem("whitelabelled_customer_partnername", action.payload.partner_name);
        }

        localStorage.setItem(
          "iswhitelabelledpartner",
          action.payload.is_white_labelled_partner
        );
        localStorage.setItem(
          "whitelabelledpartnerid",
          action.payload.partner_id
        );
        localStorage.setItem(
          "isPartnerPackageModule",
          action.payload.isPartnerPackageModule
        );
      })
      // Basic setup cases
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
      })
      
      // NEW: Partner details cases
      .addCase(fetchPartnerDetails.pending, (state) => {
        state.partnerDetailsLoading = true;
        state.partnerDetailsError = null;
      })
      .addCase(fetchPartnerDetails.fulfilled, (state, action) => {
        state.partnerDetailsLoading = false;
        state.partnerDetails = action.payload;
        state.partnerDetailsLastUpdated = Date.now();
        state.partnerDetailsError = null;
      })
      .addCase(fetchPartnerDetails.rejected, (state, action) => {
        state.partnerDetailsLoading = false;
        state.partnerDetailsError = action.payload;

        // If we have cached details, don't show error
        if (state.partnerDetails) {
          state.partnerDetailsError = null;
        }
      });
  },
});

// Existing selectors
export const {
  setPartnerConfig,
  setBasicConfigLoading,
  setBasicConfigError,
  setBasicConfig,
  updateHeaderColor,
  refreshBasicConfig,
  clearBasicConfig,
  
  // NEW: Partner details actions
  setPartnerDetails,
  setPartnerDetailsLoading,
  setPartnerDetailsError,
  refreshPartnerDetails,
  clearPartnerDetails,
  updatePartnerLogo,
} = partnerSlice.actions;

export const selectPartnerConfig = (state) => state.partner;
export const selectIsWhiteLabelledPartner = (state) =>
  state.partner.isWhiteLabelledPartner;
export const selectWhiteLabelledPartnerId = (state) =>
  state.partner.whiteLabelledPartnerId;
export const selectIsPartnerPackageModule = (state) =>
  state.partner.isPartnerPackageModule;
export const selectPartnerStatus = (state) => state.partner.status;
export const selectPartnerError = (state) => state.partner.error;

// Basic config selectors
export const selectPartnerBasicConfig = (state) => state.partner.basicConfig;
export const selectPartnerBasicConfigLoading = (state) =>
  state.partner.basicConfigLoading;
export const selectPartnerBasicConfigError = (state) =>
  state.partner.basicConfigError;
export const selectPartnerBasicConfigLastUpdated = (state) =>
  state.partner.basicConfigLastUpdated;
export const selectHeaderColor = (state) =>
  state.partner.basicConfig?.header_color ||
  localStorage.getItem("header_color") ||
  "bg-sky-800";
export const selectTextColor = (state) =>
  state.partner.basicConfig?.text_color || localStorage.getItem("text_color");
export const selectDownloadManualEnabled = (state) =>
  state.partner.basicConfig?.download_operation_manual ||
  localStorage.getItem("download_operation_manual");

// NEW: Partner details selectors
export const selectPartnerDetails = (state) => state.partner.partnerDetails;
export const selectPartnerDetailsLoading = (state) =>
  state.partner.partnerDetailsLoading;
export const selectPartnerDetailsError = (state) =>
  state.partner.partnerDetailsError;
export const selectPartnerDetailsLastUpdated = (state) =>
  state.partner.partnerDetailsLastUpdated;
export const selectPartnerLogo = (state) =>
  state.partner.partnerDetails?.profile?.logo || 
  localStorage.getItem("partner_logo");
export const selectPartnerName = (state) =>
  state.partner.partnerDetails?.profile?.partner_name ||
  localStorage.getItem("whitelabelled_customer_partnername") ||
  "Partner Portal";
export const selectHasPartnerLogo = (state) => !!selectPartnerLogo(state);

export default partnerSlice.reducer;