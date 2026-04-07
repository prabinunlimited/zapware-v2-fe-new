// src/slices/partnerSlice.js - UPDATED VERSION
// Simplified since authService.js now handles partner config storage
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { centralizedApi } from "../../../services/api";

// ===================== ASYNC THUNKS USING CENTRALIZED API =====================

// Async thunk for fetching partner config by hostname - SIMPLIFIED
export const fetchPartnerConfig = createAsyncThunk(
  "partner/fetchConfig",
  async (hostname, { rejectWithValue }) => {
    try {
      console.log("🔍 Checking for existing partner config in localStorage");

      // Check if authService has already stored the data
      const partnerId = localStorage.getItem("whitelabelledpartnerid");
      const isWhiteLabelled =
        localStorage.getItem("is_white_labelled_partner") ||
        localStorage.getItem("iswhitelabelledpartner");

      if (
        partnerId &&
        partnerId !== "0" &&
        partnerId !== "null" &&
        isWhiteLabelled
      ) {
        console.log(
          "✅ Partner config already exists in localStorage from authService",
        );

        // Return the existing data from localStorage
        return {
          is_white_labelled_partner: isWhiteLabelled,
          partner_id: partnerId,
          partner_uuid: localStorage.getItem("partner_uuid") || "",
          isPartnerPackageModule:
            localStorage.getItem("isPartnerPackageModule") || "N",
          showRemittanceOnlyOnRegistration:
            localStorage.getItem("showRemittanceOnlyOnRegistration") || "N",
          beneficiary_portal_title:
            localStorage.getItem("beneficiary_portal_title") || "",
          partner_name: localStorage.getItem("partner_name") || "",
        };
      }

      // Only fetch if we don't have the data
      console.log("🔄 Fetching partner config from API (fallback)...");
      const partnerResponse =
        await centralizedApi.getPartnerByHostname(hostname);

      if (partnerResponse?.data) {
        const partnerData = partnerResponse.data;

        // Store in localStorage (as backup to authService)
        if (partnerData.is_white_labelled_partner !== undefined) {
          localStorage.setItem(
            "is_white_labelled_partner",
            partnerData.is_white_labelled_partner,
          );
          localStorage.setItem(
            "iswhitelabelledpartner",
            partnerData.is_white_labelled_partner,
          );
        }

        if (partnerData.partner_id !== undefined) {
          localStorage.setItem(
            "whitelabelledpartnerid",
            String(partnerData.partner_id),
          );
        }

        if (partnerData.partner_uuid !== undefined) {
          localStorage.setItem("partner_uuid", partnerData.partner_uuid);
        }

        if (partnerData.isPartnerPackageModule !== undefined) {
          localStorage.setItem(
            "isPartnerPackageModule",
            partnerData.isPartnerPackageModule,
          );
        }

        if (partnerData.showRemittanceOnlyOnRegistration !== undefined) {
          localStorage.setItem(
            "showRemittanceOnlyOnRegistration",
            partnerData.showRemittanceOnlyOnRegistration,
          );
        }

        if (partnerData.beneficiary_portal_title) {
          localStorage.setItem(
            "beneficiary_portal_title",
            partnerData.beneficiary_portal_title,
          );
        }

        if (partnerData.partner_name) {
          localStorage.setItem("partner_name", partnerData.partner_name);
        }

        return partnerData;
      }

      return rejectWithValue("Invalid response structure");
    } catch (error) {
      console.error("❌ Error fetching partner config:", error);
      return rejectWithValue(error.message || "Failed to fetch partner config");
    }
  },
);

// Async thunk for fetching partner basic setup (colors, etc.) - UNCHANGED
export const fetchPartnerBasicSetup = createAsyncThunk(
  "partner/fetchBasicSetup",
  async (_, { getState, rejectWithValue }) => {
    try {
      // Get partner ID from localStorage (set by authService)
      let partnerId = localStorage.getItem("whitelabelledpartnerid");

      if (!partnerId || partnerId === "0") {
        partnerId = localStorage.getItem("whitelabelled_customer_partnerid");
        if (partnerId && partnerId !== "0") {
          localStorage.setItem("whitelabelledpartnerid", partnerId);
        }
      }

      if (!partnerId || partnerId === "0") {
        console.log("⚠️ No valid partner ID found, using defaults");
        return rejectWithValue("Invalid partner ID");
      }

      console.log("🎨 Fetching partner basic setup for partnerId:", partnerId);

      const partnerConfig =
        await centralizedApi.getPartnerBasicSetup(partnerId);

      if (partnerConfig?.status === "success") {
        console.log("✅ Partner basic setup fetched successfully");

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
            partnerConfig.download_operation_manual,
          );
        }

        // Store logo URL if available
        if (partnerConfig.logo_url) {
          localStorage.setItem("partner_logo", partnerConfig.logo_url);
          console.log(
            "🖼️ Partner logo stored from basic setup:",
            partnerConfig.logo_url,
          );
        }

        return partnerConfig;
      }

      console.warn("⚠️ Invalid response structure from partner basic setup");
      return rejectWithValue("Invalid response structure");
    } catch (error) {
      console.error("❌ Error fetching partner basic setup:", error);

      // Fallback to cached config
      const cachedConfig = localStorage.getItem("partnerConfig");
      if (cachedConfig) {
        try {
          console.log("🔄 Falling back to cached partner config");
          return JSON.parse(cachedConfig);
        } catch (e) {
          console.error("Failed to parse cached partner config:", e);
        }
      }

      return rejectWithValue(error.message || "Failed to fetch partner config");
    }
  },
);

// Async thunk for fetching partner details with logo - FIXED VERSION
export const fetchPartnerDetails = createAsyncThunk(
  "partner/fetchDetails",
  async (_, { getState, rejectWithValue }) => {
    try {
      // Get partner ID from localStorage (set by authService)
      let partnerId = localStorage.getItem("whitelabelledpartnerid");

      if (!partnerId || partnerId === "0") {
        partnerId = localStorage.getItem("whitelabelled_customer_partnerid");
        if (partnerId && partnerId !== "0") {
          localStorage.setItem("whitelabelledpartnerid", partnerId);
        }
      }

      console.log("🔍 DEBUG: Fetching partner details for ID:", partnerId, {
        fromAuthService: !!localStorage.getItem("is_white_labelled_partner"),
        partnerName: localStorage.getItem("partner_name"),
      });

      if (!partnerId || partnerId === "0") {
        console.log("⚠️ No valid partner ID found for details fetch");
        // Return default details instead of rejecting
        const defaultDetails = {
          status: "success",
          profile: {
            id: partnerId || "0",
            name: localStorage.getItem("partner_name") || "Partner Portal",
            logo: localStorage.getItem("partner_logo") || null,
          },
        };
        localStorage.setItem("partnerDetails", JSON.stringify(defaultDetails));
        localStorage.setItem("partnerDetailsTimestamp", Date.now().toString());
        return defaultDetails;
      }

      // Try to fetch partner details
      let partnerDetails;
      try {
        partnerDetails = await centralizedApi.getPartnerDetails(partnerId);
        console.log("✅ Partner details API response:", partnerDetails);
      } catch (apiError) {
        console.warn(
          "⚠️ Partner details API failed, using localStorage data:",
          apiError,
        );

        // Use data from localStorage (set by authService)
        partnerDetails = {
          status: "success",
          profile: {
            id: partnerId,
            name:
              localStorage.getItem("partner_name") ||
              localStorage.getItem("whitelabelled_customer_partnername") ||
              "Partner Portal",
            logo: localStorage.getItem("partner_logo") || null,
          },
        };
      }

      // Store data
      if (partnerDetails) {
        const profile = partnerDetails.profile || partnerDetails.data || {};

        // Get partner name from multiple sources
        const partnerName =
          profile.name ||
          profile.partner_name ||
          localStorage.getItem("partner_name") ||
          localStorage.getItem("whitelabelled_customer_partnername") ||
          "Partner Portal";

        localStorage.setItem("whitelabelled_customer_partnername", partnerName);
        console.log("✅ Stored partner name:", partnerName);

        // Get logo from multiple sources
        const logoUrl =
          profile.logo ||
          profile.logo_url ||
          localStorage.getItem("partner_logo");

        if (logoUrl) {
          localStorage.setItem("partner_logo", logoUrl);
          console.log("✅ Stored partner logo:", logoUrl);
        }

        // Store complete details
        const detailsToStore = {
          status: "success",
          profile: {
            id: partnerId,
            name: partnerName,
            logo: logoUrl,
            is_white_labelled_partner:
              localStorage.getItem("is_white_labelled_partner") || "N",
            partner_uuid: localStorage.getItem("partner_uuid") || "",
            showRemittanceOnlyOnRegistration:
              localStorage.getItem("showRemittanceOnlyOnRegistration") || "N",
          },
        };

        localStorage.setItem("partnerDetails", JSON.stringify(detailsToStore));
        localStorage.setItem("partnerDetailsTimestamp", Date.now().toString());

        return detailsToStore;
      }

      return rejectWithValue("No partner details available");
    } catch (error) {
      console.error("❌ Error in fetchPartnerDetails:", error);

      // Return minimal details from localStorage instead of failing completely
      const minimalDetails = {
        status: "partial",
        profile: {
          id: localStorage.getItem("whitelabelledpartnerid") || "0",
          name:
            localStorage.getItem("partner_name") ||
            localStorage.getItem("whitelabelled_customer_partnername") ||
            "Partner Portal",
          logo: localStorage.getItem("partner_logo") || null,
          is_white_labelled_partner:
            localStorage.getItem("is_white_labelled_partner") || "N",
          source: "localStorage_fallback",
        },
      };

      localStorage.setItem("partnerDetails", JSON.stringify(minimalDetails));
      localStorage.setItem("partnerDetailsTimestamp", Date.now().toString());
      return minimalDetails;
    }
  },
);

// Async thunk for fetching partner detail by slug
export const fetchPartnerDetailBySlug = createAsyncThunk(
  "partner/fetchDetailBySlug",
  async (_, { getState, rejectWithValue }) => {
    try {
      console.log("🔍 Fetching partner detail by slug...");

      // Note: This endpoint might need to be added to centralizedApi
      // For now, we'll handle it directly
      const api = (await import("../../../services/api")).default;

      const response = await api.get("/partners/detail-by-slug");

      if (response.data) {
        console.log("✅ Partner detail by slug fetched");
        return response.data;
      }

      return rejectWithValue("Invalid response structure");
    } catch (error) {
      console.error("❌ Error fetching partner detail by slug:", error);
      return rejectWithValue(
        error.message || "Failed to fetch partner detail by slug",
      );
    }
  },
);

// Async thunk for fetching partner FX currencies
export const fetchPartnerFxCurrencies = createAsyncThunk(
  "partner/fetchFxCurrencies",
  async (partnerId, { rejectWithValue }) => {
    try {
      console.log(
        "💰 Fetching partner FX currencies for partnerId:",
        partnerId,
      );

      const fxCurrencies =
        await centralizedApi.getPartnerFxCurrencies(partnerId);

      if (fxCurrencies) {
        console.log("✅ Partner FX currencies fetched");
        return fxCurrencies;
      }

      return rejectWithValue("Invalid response structure");
    } catch (error) {
      console.error("❌ Error fetching partner FX currencies:", error);
      return rejectWithValue(
        error.message || "Failed to fetch partner FX currencies",
      );
    }
  },
);

// Async thunk for fetching partner modules
export const fetchPartnerModules = createAsyncThunk(
  "partner/fetchModules",
  async (partnerId, { rejectWithValue }) => {
    try {
      console.log("📦 Fetching partner modules for partnerId:", partnerId);

      const modules = await centralizedApi.getPartnerModules(partnerId);

      if (modules) {
        console.log("✅ Partner modules fetched");
        return modules;
      }

      return rejectWithValue("Invalid response structure");
    } catch (error) {
      console.error("❌ Error fetching partner modules:", error);
      return rejectWithValue(
        error.message || "Failed to fetch partner modules",
      );
    }
  },
);

// ===================== INITIAL STATE =====================
// Check for cached config on slice initialization
const cachedConfig = localStorage.getItem("partnerConfig");
const initialBasicConfig = cachedConfig ? JSON.parse(cachedConfig) : null;

const cachedDetails = localStorage.getItem("partnerDetails");
const initialPartnerDetails = cachedDetails ? JSON.parse(cachedDetails) : null;

// Use the correct localStorage keys that authService sets
const initialState = {
  // Core partner config (from authService)
  isWhiteLabelledPartner:
    localStorage.getItem("is_white_labelled_partner") ||
    localStorage.getItem("iswhitelabelledpartner") ||
    "N",
  whiteLabelledPartnerId: localStorage.getItem("whitelabelledpartnerid") || "0",
  partnerUUID: localStorage.getItem("partner_uuid") || "",
  isPartnerPackageModule: localStorage.getItem("isPartnerPackageModule") || "N",
  showRemittanceOnlyOnRegistration:
    localStorage.getItem("showRemittanceOnlyOnRegistration") || "N",
  beneficiaryPortalTitle:
    localStorage.getItem("beneficiary_portal_title") || "",
  partnerName: localStorage.getItem("partner_name") || "",

  status: "idle",
  error: null,

  // Basic setup config state (colors, styles)
  basicConfig: initialBasicConfig,
  basicConfigLoading: false,
  basicConfigError: null,
  basicConfigLastUpdated: localStorage.getItem("partnerConfigTimestamp"),

  // Partner details with logo state
  partnerDetails: initialPartnerDetails,
  partnerDetailsLoading: false,
  partnerDetailsError: null,
  partnerDetailsLastUpdated: localStorage.getItem("partnerDetailsTimestamp"),

  // Partner detail by slug state
  partnerDetailBySlug: null,
  partnerDetailBySlugLoading: false,
  partnerDetailBySlugError: null,

  // Partner FX currencies state
  fxCurrencies: null,
  fxCurrenciesLoading: false,
  fxCurrenciesError: null,

  // Partner modules state
  modules: null,
  modulesLoading: false,
  modulesError: null,
};

// ===================== SLICE DEFINITION =====================
const partnerSlice = createSlice({
  name: "partner",
  initialState,
  reducers: {
    // Set partner config from authService data
    setPartnerConfig: (state, action) => {
      const payload = action.payload;

      state.isWhiteLabelledPartner = payload.is_white_labelled_partner || "N";
      state.whiteLabelledPartnerId = payload.partner_id || "0";
      state.partnerUUID = payload.partner_uuid || "";
      state.isPartnerPackageModule = payload.isPartnerPackageModule || "N";
      state.showRemittanceOnlyOnRegistration =
        payload.showRemittanceOnlyOnRegistration || "N";
      state.beneficiaryPortalTitle = payload.beneficiary_portal_title || "";
      state.partnerName = payload.partner_name || "";

      // Update localStorage to match authService
      if (payload.is_white_labelled_partner !== undefined) {
        localStorage.setItem(
          "is_white_labelled_partner",
          payload.is_white_labelled_partner,
        );
        localStorage.setItem(
          "iswhitelabelledpartner",
          payload.is_white_labelled_partner,
        );
      }

      if (payload.partner_id !== undefined) {
        localStorage.setItem(
          "whitelabelledpartnerid",
          String(payload.partner_id),
        );
      }

      if (payload.partner_uuid !== undefined) {
        localStorage.setItem("partner_uuid", payload.partner_uuid);
      }

      if (payload.isPartnerPackageModule !== undefined) {
        localStorage.setItem(
          "isPartnerPackageModule",
          payload.isPartnerPackageModule,
        );
      }

      if (payload.showRemittanceOnlyOnRegistration !== undefined) {
        localStorage.setItem(
          "showRemittanceOnlyOnRegistration",
          payload.showRemittanceOnlyOnRegistration,
        );
      }

      if (payload.beneficiary_portal_title) {
        localStorage.setItem(
          "beneficiary_portal_title",
          payload.beneficiary_portal_title,
        );
      }

      if (payload.partner_name) {
        localStorage.setItem("partner_name", payload.partner_name);
        localStorage.setItem(
          "whitelabelled_customer_partnername",
          payload.partner_name,
        );
      }
    },

    // Sync Redux state with localStorage (useful after authService updates)
    syncWithLocalStorage: (state) => {
      state.isWhiteLabelledPartner =
        localStorage.getItem("is_white_labelled_partner") ||
        localStorage.getItem("iswhitelabelledpartner") ||
        "N";
      state.whiteLabelledPartnerId =
        localStorage.getItem("whitelabelledpartnerid") || "0";
      state.partnerUUID = localStorage.getItem("partner_uuid") || "";
      state.isPartnerPackageModule =
        localStorage.getItem("isPartnerPackageModule") || "N";
      state.showRemittanceOnlyOnRegistration =
        localStorage.getItem("showRemittanceOnlyOnRegistration") || "N";
      state.beneficiaryPortalTitle =
        localStorage.getItem("beneficiary_portal_title") || "";
      state.partnerName = localStorage.getItem("partner_name") || "";
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

    // Partner details reducers
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
      // Note: Don't remove partner_logo here - it's used by other components
    },
    updatePartnerLogo: (state, action) => {
      if (state.partnerDetails?.profile) {
        state.partnerDetails.profile.logo = action.payload;
      }
      localStorage.setItem("partner_logo", action.payload);
    },

    // Partner detail by slug reducers
    setPartnerDetailBySlug: (state, action) => {
      state.partnerDetailBySlug = action.payload;
    },
    setPartnerDetailBySlugLoading: (state, action) => {
      state.partnerDetailBySlugLoading = action.payload;
    },
    setPartnerDetailBySlugError: (state, action) => {
      state.partnerDetailBySlugError = action.payload;
    },
    clearPartnerDetailBySlug: (state) => {
      state.partnerDetailBySlug = null;
      state.partnerDetailBySlugLoading = false;
      state.partnerDetailBySlugError = null;
    },

    // FX currencies reducers
    setFxCurrencies: (state, action) => {
      state.fxCurrencies = action.payload;
    },
    setFxCurrenciesLoading: (state, action) => {
      state.fxCurrenciesLoading = action.payload;
    },
    setFxCurrenciesError: (state, action) => {
      state.fxCurrenciesError = action.payload;
    },
    clearFxCurrencies: (state) => {
      state.fxCurrencies = null;
      state.fxCurrenciesLoading = false;
      state.fxCurrenciesError = null;
    },

    // Modules reducers
    setModules: (state, action) => {
      state.modules = action.payload;
    },
    setModulesLoading: (state, action) => {
      state.modulesLoading = action.payload;
    },
    setModulesError: (state, action) => {
      state.modulesError = action.payload;
    },
    clearModules: (state) => {
      state.modules = null;
      state.modulesLoading = false;
      state.modulesError = null;
    },

    // Clear all partner data (including authService data)
    clearAllPartnerData: (state) => {
      // Reset all state
      state.isWhiteLabelledPartner = "N";
      state.whiteLabelledPartnerId = "0";
      state.partnerUUID = "";
      state.isPartnerPackageModule = "N";
      state.showRemittanceOnlyOnRegistration = "N";
      state.beneficiaryPortalTitle = "";
      state.partnerName = "";

      state.basicConfig = null;
      state.basicConfigLoading = false;
      state.basicConfigError = null;
      state.basicConfigLastUpdated = null;

      state.partnerDetails = null;
      state.partnerDetailsLoading = false;
      state.partnerDetailsError = null;
      state.partnerDetailsLastUpdated = null;

      state.partnerDetailBySlug = null;
      state.partnerDetailBySlugLoading = false;
      state.partnerDetailBySlugError = null;

      state.fxCurrencies = null;
      state.fxCurrenciesLoading = false;
      state.fxCurrenciesError = null;

      state.modules = null;
      state.modulesLoading = false;
      state.modulesError = null;

      // Clear ALL localStorage partner-related keys (including authService keys)
      const keysToRemove = [
        // authService keys
        "is_white_labelled_partner",
        "iswhitelabelledpartner",
        "whitelabelledpartnerid",
        "partner_uuid",
        "isPartnerPackageModule",
        "showRemittanceOnlyOnRegistration",
        "beneficiary_portal_title",
        "partner_name",

        // partnerSlice keys
        "partnerConfig",
        "partnerConfigTimestamp",
        "partnerDetails",
        "partnerDetailsTimestamp",
        "whitelabelled_customer_partnerid",
        "whitelabelled_customer_partnername",

        // Style/config keys
        "header_color",
        "text_color",
        "download_operation_manual",

        // Don't remove partner_logo here - it's managed separately
        // "partner_logo",
      ];

      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      });

      console.log("✅ All partner data cleared from localStorage");
    },

    // Force refresh all partner data
    forceRefreshAllPartnerData: (state) => {
      state.basicConfigLoading = true;
      state.partnerDetailsLoading = true;
      // Clear cache for partner endpoints
      if (centralizedApi.clearCache) {
        centralizedApi.clearCache("/partner-");
      }
    },

    // Quick fix for missing data - manually set partner name
    setPartnerNameManually: (state, action) => {
      const partnerName = action.payload;
      state.partnerName = partnerName;

      if (state.partnerDetails?.profile) {
        state.partnerDetails.profile.name = partnerName;
        state.partnerDetails.profile.partner_name = partnerName;
      }

      localStorage.setItem("partner_name", partnerName);
      localStorage.setItem("whitelabelled_customer_partnername", partnerName);
    },

    // Manually set partner logo
    setPartnerLogoManually: (state, action) => {
      const logoUrl = action.payload;
      if (state.partnerDetails?.profile) {
        state.partnerDetails.profile.logo = logoUrl;
      }
      localStorage.setItem("partner_logo", logoUrl);
    },

    // Debug function to log current state
    logPartnerState: (state) => {
      console.log("🔍 Partner Slice State:", {
        // Core config from authService
        isWhiteLabelledPartner: state.isWhiteLabelledPartner,
        whiteLabelledPartnerId: state.whiteLabelledPartnerId,
        partnerUUID: state.partnerUUID,
        isPartnerPackageModule: state.isPartnerPackageModule,
        showRemittanceOnlyOnRegistration:
          state.showRemittanceOnlyOnRegistration,
        beneficiaryPortalTitle: state.beneficiaryPortalTitle,
        partnerName: state.partnerName,

        // Other state
        hasBasicConfig: !!state.basicConfig,
        hasPartnerDetails: !!state.partnerDetails,
        partnerLogo: state.partnerDetails?.profile?.logo,

        // Loading states
        basicConfigLoading: state.basicConfigLoading,
        partnerDetailsLoading: state.partnerDetailsLoading,

        // localStorage verification
        localStorage: {
          partnerId: localStorage.getItem("whitelabelledpartnerid"),
          isWhiteLabelled: localStorage.getItem("is_white_labelled_partner"),
          partnerName: localStorage.getItem("partner_name"),
          partnerLogo: localStorage.getItem("partner_logo"),
          partnerUUID: localStorage.getItem("partner_uuid"),
          showRemittanceOnly: localStorage.getItem(
            "showRemittanceOnlyOnRegistration",
          ),
        },
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Partner config cases
      .addCase(fetchPartnerConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPartnerConfig.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isWhiteLabelledPartner =
          action.payload.is_white_labelled_partner || "N";
        state.whiteLabelledPartnerId = action.payload.partner_id || "0";
        state.partnerUUID = action.payload.partner_uuid || "";
        state.isPartnerPackageModule =
          action.payload.isPartnerPackageModule || "N";
        state.showRemittanceOnlyOnRegistration =
          action.payload.showRemittanceOnlyOnRegistration || "N";
        state.beneficiaryPortalTitle =
          action.payload.beneficiary_portal_title || "";
        state.partnerName = action.payload.partner_name || "";
        state.error = null;

        // Update localStorage (though authService should have already done this)
        if (action.payload.partner_name) {
          localStorage.setItem(
            "whitelabelled_customer_partnername",
            action.payload.partner_name,
          );
        }
      })
      .addCase(fetchPartnerConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
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

      // Partner details cases
      .addCase(fetchPartnerDetails.pending, (state) => {
        state.partnerDetailsLoading = true;
        state.partnerDetailsError = null;
      })
      .addCase(fetchPartnerDetails.fulfilled, (state, action) => {
        state.partnerDetailsLoading = false;
        state.partnerDetails = action.payload;
        state.partnerDetailsLastUpdated = Date.now();
        state.partnerDetailsError = null;

        // Update partner name if available
        if (action.payload.profile?.name) {
          state.partnerName = action.payload.profile.name;
          localStorage.setItem("partner_name", action.payload.profile.name);
        }

        console.log("✅ Partner details stored in Redux:", {
          hasProfile: !!action.payload.profile,
          profileName: action.payload.profile?.name,
          hasLogo: !!action.payload.profile?.logo,
        });
      })
      .addCase(fetchPartnerDetails.rejected, (state, action) => {
        state.partnerDetailsLoading = false;

        // Even if rejected, we might have gotten minimal details in the thunk
        if (action.payload && typeof action.payload === "object") {
          state.partnerDetails = action.payload;
          state.partnerDetailsError = null;

          // Update partner name from fallback
          if (action.payload.profile?.name) {
            state.partnerName = action.payload.profile.name;
          }
        } else {
          state.partnerDetailsError = action.payload;
        }

        // If we have cached details, don't show error
        if (state.partnerDetails) {
          state.partnerDetailsError = null;
        }
      })

      // Partner detail by slug cases
      .addCase(fetchPartnerDetailBySlug.pending, (state) => {
        state.partnerDetailBySlugLoading = true;
        state.partnerDetailBySlugError = null;
      })
      .addCase(fetchPartnerDetailBySlug.fulfilled, (state, action) => {
        state.partnerDetailBySlugLoading = false;
        state.partnerDetailBySlug = action.payload;
        state.partnerDetailBySlugError = null;
      })
      .addCase(fetchPartnerDetailBySlug.rejected, (state, action) => {
        state.partnerDetailBySlugLoading = false;
        state.partnerDetailBySlugError = action.payload;
      })

      // FX currencies cases
      .addCase(fetchPartnerFxCurrencies.pending, (state) => {
        state.fxCurrenciesLoading = true;
        state.fxCurrenciesError = null;
      })
      .addCase(fetchPartnerFxCurrencies.fulfilled, (state, action) => {
        state.fxCurrenciesLoading = false;
        state.fxCurrencies = action.payload;
        state.fxCurrenciesError = null;
      })
      .addCase(fetchPartnerFxCurrencies.rejected, (state, action) => {
        state.fxCurrenciesLoading = false;
        state.fxCurrenciesError = action.payload;
      })

      // Modules cases
      .addCase(fetchPartnerModules.pending, (state) => {
        state.modulesLoading = true;
        state.modulesError = null;
      })
      .addCase(fetchPartnerModules.fulfilled, (state, action) => {
        state.modulesLoading = false;
        state.modules = action.payload;
        state.modulesError = null;
      })
      .addCase(fetchPartnerModules.rejected, (state, action) => {
        state.modulesLoading = false;
        state.modulesError = action.payload;
      });
  },
});

// ===================== ACTION EXPORTS =====================
export const {
  setPartnerConfig,
  syncWithLocalStorage,
  setBasicConfigLoading,
  setBasicConfigError,
  setBasicConfig,
  updateHeaderColor,
  refreshBasicConfig,
  clearBasicConfig,
  setPartnerDetails,
  setPartnerDetailsLoading,
  setPartnerDetailsError,
  refreshPartnerDetails,
  clearPartnerDetails,
  updatePartnerLogo,
  setPartnerDetailBySlug,
  setPartnerDetailBySlugLoading,
  setPartnerDetailBySlugError,
  clearPartnerDetailBySlug,
  setFxCurrencies,
  setFxCurrenciesLoading,
  setFxCurrenciesError,
  clearFxCurrencies,
  setModules,
  setModulesLoading,
  setModulesError,
  clearModules,
  clearAllPartnerData,
  forceRefreshAllPartnerData,
  setPartnerNameManually,
  setPartnerLogoManually,
  logPartnerState,
} = partnerSlice.actions;

// ===================== SELECTOR EXPORTS =====================

// Core config selectors (from authService)
export const selectPartnerConfig = (state) => state.partner;
export const selectIsWhiteLabelledPartner = (state) =>
  state.partner.isWhiteLabelledPartner;
export const selectWhiteLabelledPartnerId = (state) =>
  state.partner.whiteLabelledPartnerId;
export const selectPartnerUUID = (state) => state.partner.partnerUUID;
export const selectIsPartnerPackageModule = (state) =>
  state.partner.isPartnerPackageModule;
export const selectShowRemittanceOnlyOnRegistration = (state) =>
  state.partner.showRemittanceOnlyOnRegistration;
export const selectBeneficiaryPortalTitle = (state) =>
  state.partner.beneficiaryPortalTitle;
export const selectPartnerName = (state) =>
  state.partner.partnerName ||
  localStorage.getItem("partner_name") ||
  localStorage.getItem("whitelabelled_customer_partnername") ||
  "Partner Portal";
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
  state.partner.basicConfig?.text_color ||
  localStorage.getItem("text_color") ||
  null;
export const selectDownloadManualEnabled = (state) =>
  state.partner.basicConfig?.download_operation_manual ||
  localStorage.getItem("download_operation_manual") ||
  null;

// Partner details selectors
export const selectPartnerDetails = (state) => state.partner.partnerDetails;
export const selectPartnerDetailsLoading = (state) =>
  state.partner.partnerDetailsLoading;
export const selectPartnerDetailsError = (state) =>
  state.partner.partnerDetailsError;
export const selectPartnerDetailsLastUpdated = (state) =>
  state.partner.partnerDetailsLastUpdated;
export const selectPartnerLogo = (state) =>
  state.partner.partnerDetails?.profile?.logo ||
  localStorage.getItem("partner_logo") ||
  null;
export const selectHasPartnerLogo = (state) => !!selectPartnerLogo(state);

// Partner detail by slug selectors
export const selectPartnerDetailBySlug = (state) =>
  state.partner.partnerDetailBySlug;
export const selectPartnerDetailBySlugLoading = (state) =>
  state.partner.partnerDetailBySlugLoading;
export const selectPartnerDetailBySlugError = (state) =>
  state.partner.partnerDetailBySlugError;

// FX currencies selectors
export const selectPartnerFxCurrencies = (state) => state.partner.fxCurrencies;
export const selectPartnerFxCurrenciesLoading = (state) =>
  state.partner.fxCurrenciesLoading;
export const selectPartnerFxCurrenciesError = (state) =>
  state.partner.fxCurrenciesError;

// Modules selectors
export const selectPartnerModules = (state) => state.partner.modules;
export const selectPartnerModulesLoading = (state) =>
  state.partner.modulesLoading;
export const selectPartnerModulesError = (state) => state.partner.modulesError;

// Combined selectors
export const selectAllPartnerData = (state) => ({
  // Core config from authService
  isWhiteLabelledPartner: selectIsWhiteLabelledPartner(state),
  partnerId: selectWhiteLabelledPartnerId(state),
  partnerUUID: selectPartnerUUID(state),
  isPartnerPackageModule: selectIsPartnerPackageModule(state),
  showRemittanceOnlyOnRegistration:
    selectShowRemittanceOnlyOnRegistration(state),
  beneficiaryPortalTitle: selectBeneficiaryPortalTitle(state),
  partnerName: selectPartnerName(state),

  // Basic config
  basicConfig: selectPartnerBasicConfig(state),
  headerColor: selectHeaderColor(state),
  textColor: selectTextColor(state),
  downloadManualEnabled: selectDownloadManualEnabled(state),

  // Details
  details: selectPartnerDetails(state),
  logo: selectPartnerLogo(state),
  hasLogo: selectHasPartnerLogo(state),

  // Other
  detailBySlug: selectPartnerDetailBySlug(state),
  fxCurrencies: selectPartnerFxCurrencies(state),
  modules: selectPartnerModules(state),
});

export const selectIsLoading = (state) =>
  state.partner.basicConfigLoading ||
  state.partner.partnerDetailsLoading ||
  state.partner.partnerDetailBySlugLoading ||
  state.partner.fxCurrenciesLoading ||
  state.partner.modulesLoading;

export const selectHasAnyError = (state) =>
  state.partner.basicConfigError ||
  state.partner.partnerDetailsError ||
  state.partner.partnerDetailBySlugError ||
  state.partner.fxCurrenciesError ||
  state.partner.modulesError;

// Helper selector to get partner data for UI
export const selectPartnerUI = (state) => ({
  headerColor: selectHeaderColor(state),
  textColor: selectTextColor(state),
  logo: selectPartnerLogo(state),
  name: selectPartnerName(state),
  isWhiteLabelled: selectIsWhiteLabelledPartner(state),
  canDownloadManual: selectDownloadManualEnabled(state),
  showRemittanceOnlyOnRegistration:
    selectShowRemittanceOnlyOnRegistration(state),
  beneficiaryPortalTitle: selectBeneficiaryPortalTitle(state),
});

// New selector for debugging
export const selectPartnerDebugInfo = (state) => ({
  // Redux state
  redux: {
    isWhiteLabelledPartner: state.partner.isWhiteLabelledPartner,
    whiteLabelledPartnerId: state.partner.whiteLabelledPartnerId,
    partnerUUID: state.partner.partnerUUID,
    isPartnerPackageModule: state.partner.isPartnerPackageModule,
    showRemittanceOnlyOnRegistration:
      state.partner.showRemittanceOnlyOnRegistration,
    beneficiaryPortalTitle: state.partner.beneficiaryPortalTitle,
    partnerName: state.partner.partnerName,
    hasBasicConfig: !!state.partner.basicConfig,
    hasPartnerDetails: !!state.partner.partnerDetails,
    partnerLogo: selectPartnerLogo(state),
    isLoading: selectIsLoading(state),
    hasError: selectHasAnyError(state),
  },
  // LocalStorage state
  localStorage: {
    partnerId: localStorage.getItem("whitelabelledpartnerid"),
    isWhiteLabelled: localStorage.getItem("is_white_labelled_partner"),
    partnerName: localStorage.getItem("partner_name"),
    partnerLogo: localStorage.getItem("partner_logo"),
    partnerUUID: localStorage.getItem("partner_uuid"),
    showRemittanceOnly: localStorage.getItem(
      "showRemittanceOnlyOnRegistration",
    ),
    beneficiaryPortalTitle: localStorage.getItem("beneficiary_portal_title"),
    partnerConfig: localStorage.getItem("partnerConfig")
      ? JSON.parse(localStorage.getItem("partnerConfig"))
      : null,
    partnerDetails: localStorage.getItem("partnerDetails")
      ? JSON.parse(localStorage.getItem("partnerDetails"))
      : null,
  },
  // Status
  status: {
    basicConfigLoading: state.partner.basicConfigLoading,
    partnerDetailsLoading: state.partner.partnerDetailsLoading,
    isFetching:
      state.partner.basicConfigLoading || state.partner.partnerDetailsLoading,
    lastUpdated: {
      basicConfig: state.partner.basicConfigLastUpdated,
      partnerDetails: state.partner.partnerDetailsLastUpdated,
    },
  },
});

export default partnerSlice.reducer;

// ===================== UTILITY FUNCTIONS =====================

// Helper function to refresh all partner data
export const refreshAllPartnerData = () => async (dispatch) => {
  try {
    console.log("🔄 Refreshing all partner data...");

    // Clear cache first
    if (centralizedApi.clearAllCache) {
      centralizedApi.clearAllCache();
    }

    // Sync with localStorage first (in case authService updated it)
    dispatch(syncWithLocalStorage());

    // Refresh partner details
    dispatch(refreshPartnerDetails());
    const partnerId =
      localStorage.getItem("whitelabelledpartnerid") ||
      localStorage.getItem("whitelabelled_customer_partnerid");

    if (partnerId && partnerId !== "0") {
      await Promise.allSettled([
        dispatch(fetchPartnerDetails()).unwrap(),
        dispatch(fetchPartnerBasicSetup()).unwrap(),
        dispatch(fetchPartnerFxCurrencies(partnerId)).unwrap(),
        dispatch(fetchPartnerModules(partnerId)).unwrap(),
      ]);
    }

    console.log("✅ All partner data refreshed successfully");
  } catch (error) {
    console.error("❌ Error refreshing partner data:", error);
  }
};

// Helper function to initialize partner data on app load - SIMPLIFIED
export const initializePartnerData = (hostname) => async (dispatch) => {
  try {
    console.log("🚀 Initializing partner data...");

    // First sync with localStorage (authService should have already set the data)
    dispatch(syncWithLocalStorage());

    // Check if we have valid partner data from authService
    const partnerId = localStorage.getItem("whitelabelledpartnerid");
    const isWhiteLabelled = localStorage.getItem("is_white_labelled_partner");

    if (partnerId && partnerId !== "0" && isWhiteLabelled) {
      console.log("✅ Partner config already loaded by authService");

      // Update Redux state with existing localStorage values
      dispatch(
        setPartnerConfig({
          is_white_labelled_partner: isWhiteLabelled,
          partner_id: partnerId,
          partner_uuid: localStorage.getItem("partner_uuid") || "",
          isPartnerPackageModule:
            localStorage.getItem("isPartnerPackageModule") || "N",
          showRemittanceOnlyOnRegistration:
            localStorage.getItem("showRemittanceOnlyOnRegistration") || "N",
          beneficiary_portal_title:
            localStorage.getItem("beneficiary_portal_title") || "",
          partner_name: localStorage.getItem("partner_name") || "",
        }),
      );

      // Fetch additional partner data (colors, logo, etc.)
      await Promise.allSettled([
        dispatch(fetchPartnerDetails()).unwrap(),
        dispatch(fetchPartnerBasicSetup()).unwrap(),
      ]);

      console.log("✅ Partner data initialized successfully");
    } else {
      console.log("🔄 No valid partner data found, fetching from API...");
      // Fallback: fetch partner config from API
      await dispatch(fetchPartnerConfig(hostname)).unwrap();

      // Then fetch additional data
      const newPartnerId = localStorage.getItem("whitelabelledpartnerid");
      if (newPartnerId && newPartnerId !== "0") {
        await Promise.allSettled([
          dispatch(fetchPartnerDetails()).unwrap(),
          dispatch(fetchPartnerBasicSetup()).unwrap(),
        ]);
      }
    }

    // Log final state
    dispatch(logPartnerState());
  } catch (error) {
    console.error("❌ Error initializing partner data:", error);
    // Continue with default settings
  }
};

// Quick fix function to manually set partner data when APIs fail
export const manuallySetPartnerData = (data) => async (dispatch) => {
  const { name, logoUrl, partnerId } = data;

  console.log("🔧 Manually setting partner data:", data);

  // Set in localStorage
  if (name) {
    localStorage.setItem("partner_name", name);
    localStorage.setItem("whitelabelled_customer_partnername", name);
  }

  if (logoUrl) {
    localStorage.setItem("partner_logo", logoUrl);
  }

  if (partnerId) {
    localStorage.setItem("whitelabelledpartnerid", partnerId);
  }

  // Update Redux state
  dispatch(setPartnerNameManually(name || "Partner Portal"));
  if (logoUrl) {
    dispatch(setPartnerLogoManually(logoUrl));
  }

  // Sync other state
  dispatch(syncWithLocalStorage());

  console.log("✅ Partner data manually set");

  // Dispatch storage event to trigger UI updates
  window.dispatchEvent(new Event("storage"));
};

// Helper to check if authService data is available
export const hasAuthServicePartnerData = () => {
  return !!(
    localStorage.getItem("whitelabelledpartnerid") &&
    localStorage.getItem("whitelabelledpartnerid") !== "0" &&
    localStorage.getItem("is_white_labelled_partner")
  );
};

// Helper to get all partner data from authService
export const getAuthServicePartnerData = () => {
  return {
    is_white_labelled_partner:
      localStorage.getItem("is_white_labelled_partner") || "N",
    partner_id: localStorage.getItem("whitelabelledpartnerid") || "0",
    partner_uuid: localStorage.getItem("partner_uuid") || "",
    isPartnerPackageModule:
      localStorage.getItem("isPartnerPackageModule") || "N",
    showRemittanceOnlyOnRegistration:
      localStorage.getItem("showRemittanceOnlyOnRegistration") || "N",
    beneficiary_portal_title:
      localStorage.getItem("beneficiary_portal_title") || "",
    partner_name: localStorage.getItem("partner_name") || "",
  };
};
