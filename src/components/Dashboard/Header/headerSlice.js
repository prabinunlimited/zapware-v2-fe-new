// src/components/Dashboard/Header/headerSlice.js - WITH CACHING
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to check if user is beneficiary
const shouldSkipForBeneficiary = (functionName) => {
  const beneficiaryLogin =
    localStorage.getItem("beneficaryLogin") ||
    localStorage.getItem("beneficiaryLogin");
  const isBeneficiary = beneficiaryLogin === "Y";

  if (isBeneficiary) {
    console.log(`🛑 SKIPPING: ${functionName} - User is a beneficiary`);
    return true;
  }
  return false;
};

// ===== PROFILE THUNK WITH CACHING =====
export const fetchUserProfile = createAsyncThunk(
  "header/fetchUserProfile",
  async (
    { customerId, bearertoken, forceRefresh = false },
    { rejectWithValue, getState },
  ) => {
    try {
      // Check for beneficiary
      const beneficiaryLogin =
        localStorage.getItem("beneficaryLogin") ||
        localStorage.getItem("beneficiaryLogin");
      const isBeneficiary = beneficiaryLogin === "Y";

      if (isBeneficiary) {
        console.log("🛑 SKIPPING: fetchUserProfile - User is a beneficiary");
        return {
          _beneficiarySkipped: true,
          message: "Profile fetch skipped for beneficiary user",
        };
      }

      if (!bearertoken || !customerId) {
        throw new Error("Missing token or customer ID");
      }

      // Check cache if not forcing refresh
      const state = getState();
      const hasCachedData =
        state.header.profileDataLoaded && state.header.profileData;
      const lastFetched = state.header.profileLastFetched;
      const cacheAge = lastFetched
        ? Date.now() - new Date(lastFetched).getTime()
        : Infinity;
      const isCacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache

      if (!forceRefresh && hasCachedData && isCacheValid) {
        console.log(
          "📦 USING CACHED profile data (age:",
          Math.round(cacheAge / 1000),
          "seconds)",
        );
        return state.header.profileData;
      }

      console.log(
        "🔄 FETCHING: Customer profile for ID:",
        customerId,
        forceRefresh ? "(force refresh)" : "",
      );

      const response = await api.get(`/customers/${customerId}/profile`, {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
        },
        timeout: 10000,
      });

      if (response.data.status === "success") {
        const profile = response.data.profile;

        console.log("✅ Profile fetched successfully:", {
          firstName: profile.first_name,
          lastName: profile.last_name,
        });

        // Store in localStorage for persistence
        if (profile.first_name) {
          localStorage.setItem("firstName", profile.first_name);
        }
        if (profile.last_name) {
          localStorage.setItem("lastName", profile.last_name);
        }

        return profile;
      } else {
        throw new Error("Failed to fetch profile - non-success status");
      }
    } catch (error) {
      console.error("❌ fetchUserProfile error:", error);

      if (error.response?.status === 404) {
        const isBeneficiary =
          localStorage.getItem("beneficaryLogin") === "Y" ||
          localStorage.getItem("beneficiaryLogin") === "Y";
        if (isBeneficiary) {
          console.log("ℹ️ 404 error for beneficiary - expected behavior");
          return {
            _beneficiarySkipped: true,
            message: "Customer not found (beneficiary user)",
          };
        }
      }

      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// ===== FX CURRENCIES THUNK WITH CACHING =====
export const fetchPartnerFxCurrencies = createAsyncThunk(
  "header/fetchPartnerFxCurrencies",
  async (
    { bearertoken, forceRefresh = false },
    { rejectWithValue, getState },
  ) => {
    try {
      if (!bearertoken) {
        throw new Error("Bearer token missing");
      }

      // Check cache if not forcing refresh
      const state = getState();
      const hasCachedData = state.header.fxDataLoaded;
      const lastFetched = state.header.fxLastFetched;
      const cacheAge = lastFetched
        ? Date.now() - new Date(lastFetched).getTime()
        : Infinity;
      const isCacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache

      if (!forceRefresh && hasCachedData && isCacheValid) {
        console.log(
          "📦 USING CACHED FX data (age:",
          Math.round(cacheAge / 1000),
          "seconds)",
        );
        return state.header.partnerFxCurrencies;
      }

      const isWhiteLabelled = localStorage.getItem("iswhitelabelledpartner");
      const partnerId =
        isWhiteLabelled === "1"
          ? localStorage.getItem("whitelabelledpartnerid") || "9"
          : "9";

      console.log(
        "🔄 FETCHING: FX currencies for partner:",
        partnerId,
        forceRefresh ? "(force refresh)" : "",
      );

      const response = await api.post(
        `/partner-fxcurrencies?partner_id=${partnerId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
          timeout: 10000,
        },
      );

      const rates = response.data.rates || [];
      console.log(
        "✅ FX currencies fetched successfully, count:",
        rates.length,
      );
      return rates;
    } catch (error) {
      console.error("❌ fetchPartnerFxCurrencies error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// ===== CHARGES THUNK WITH CACHING =====
export const fetchChargesData = createAsyncThunk(
  "header/fetchChargesData",
  async (
    { customerId, authtoken, forceRefresh = false },
    { rejectWithValue, getState },
  ) => {
    if (shouldSkipForBeneficiary("fetchChargesData")) {
      console.log("📍 Charges data not needed for beneficiaries");
      return [];
    }

    try {
      if (!authtoken || !customerId) {
        throw new Error("Missing authentication token or customer ID");
      }

      // Check cache if not forcing refresh
      const state = getState();
      const hasCachedData = state.header.chargesDataLoaded;
      const lastFetched = state.header.chargesLastFetched;
      const cacheAge = lastFetched
        ? Date.now() - new Date(lastFetched).getTime()
        : Infinity;
      const isCacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache

      if (!forceRefresh && hasCachedData && isCacheValid) {
        console.log(
          "📦 USING CACHED charges data (age:",
          Math.round(cacheAge / 1000),
          "seconds)",
        );
        return state.header.chargesData;
      }

      console.log(
        "🔄 FETCHING: Charges for customer:",
        customerId,
        forceRefresh ? "(force refresh)" : "",
      );

      const response = await api.get(`/get-charges/${customerId}`, {
        headers: {
          Authorization: `Bearer ${authtoken}`,
        },
        timeout: 8000,
      });

      const chargesData =
        response.data.charge_details ||
        response.data.charges ||
        response.data.data ||
        [];

      console.log(
        "✅ Charges fetched successfully, count:",
        chargesData.length,
      );
      return chargesData;
    } catch (error) {
      console.error("❌ fetchChargesData error:", error);
      return rejectWithValue(error.message);
    }
  },
);

// ===== INITIAL STATE WITH CACHE FLAGS =====
const initialState = {
  // Data states
  partnerFxCurrencies: [],
  hasFxData: false,
  fxDataLoaded: false,
  fxLastFetched: null,

  profileData: null,
  profileDataLoaded: false,
  profileLastFetched: null,

  chargesData: [],
  chargesDataLoaded: false,
  chargesLastFetched: null,

  // Loading states
  loading: false,
  profileLoading: false,
  chargesLoading: false,

  // Error states
  error: null,
  profileError: null,
  chargesError: null,

  // UI states
  isDropdownOpen: false,

  // Fetch status tracking
  fetchStatus: {
    fx: "idle",
    profile: "idle",
    charges: "idle",
  },

  // Local storage synced states
  headerColor: localStorage.getItem("header_color") || "bg-sky-800",
  isWhitelabelledCustomer:
    localStorage.getItem("whitelabelled_customer") || "N",
  authtoken: localStorage.getItem("authtoken"),
  isStaffLogin: localStorage.getItem("is_staff_login"),
  staffRole: localStorage.getItem("staff_role"),
  isOwnerLogin: localStorage.getItem("is_owner_login"),
  ownerId: localStorage.getItem("owner_id"),
  ownerRoleName: localStorage.getItem("owner_role_name"),
  staffId: localStorage.getItem("staff_id"),
  isRemittanceOnlyCustomer: localStorage.getItem("isRemittanceOnlyCustomer"),
  isWhitelabelledCustomerPartnerId:
    localStorage.getItem("whitelabelledpartnerid") || null,
  logoutTime: localStorage.getItem("logoutTime")
    ? parseInt(localStorage.getItem("logoutTime"), 10)
    : 180000,
  isBeneficiaryUser:
    localStorage.getItem("beneficaryLogin") === "Y" ||
    localStorage.getItem("beneficiaryLogin") === "Y",
};

const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    openDropdown: (state) => {
      state.isDropdownOpen = true;
    },
    closeDropdown: (state) => {
      state.isDropdownOpen = false;
    },
    setHeaderColor: (state, action) => {
      state.headerColor = action.payload;
    },
    updateLocalStorageState: (state) => {
      state.headerColor = localStorage.getItem("header_color") || "bg-sky-800";
      state.isWhitelabelledCustomer =
        localStorage.getItem("whitelabelled_customer") || "N";
      state.authtoken = localStorage.getItem("authtoken");
      state.isStaffLogin = localStorage.getItem("is_staff_login");
      state.staffRole = localStorage.getItem("staff_role");
      state.isOwnerLogin = localStorage.getItem("is_owner_login");
      state.ownerId = localStorage.getItem("owner_id");
      state.ownerRoleName = localStorage.getItem("owner_role_name");
      state.staffId = localStorage.getItem("staff_id");
      state.isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer",
      );
      state.isWhitelabelledCustomerPartnerId =
        localStorage.getItem("whitelabelledpartnerid") || null;
      state.isBeneficiaryUser =
        localStorage.getItem("beneficaryLogin") === "Y" ||
        localStorage.getItem("beneficiaryLogin") === "Y";
    },

    // Cache management actions
    clearProfileCache: (state) => {
      state.profileDataLoaded = false;
      state.profileData = null;
      state.profileLastFetched = null;
      state.fetchStatus.profile = "idle";
    },
    clearFxCache: (state) => {
      state.fxDataLoaded = false;
      state.partnerFxCurrencies = [];
      state.hasFxData = false;
      state.fxLastFetched = null;
      state.fetchStatus.fx = "idle";
    },
    clearChargesCache: (state) => {
      state.chargesDataLoaded = false;
      state.chargesData = [];
      state.chargesLastFetched = null;
      state.fetchStatus.charges = "idle";
    },
    clearChargesData: (state) => {
    state.chargesDataLoaded = false;
    state.chargesData = [];
    state.chargesLastFetched = null;
    state.chargesLoading = false;
    state.chargesError = null;
    state.fetchStatus.charges = "idle";
  },
    clearAllCache: (state) => {
      state.profileDataLoaded = false;
      state.profileData = null;
      state.profileLastFetched = null;
      state.fxDataLoaded = false;
      state.partnerFxCurrencies = [];
      state.hasFxData = false;
      state.fxLastFetched = null;
      state.chargesDataLoaded = false;
      state.chargesData = [];
      state.chargesLastFetched = null;
      state.fetchStatus = {
        fx: "idle",
        profile: "idle",
        charges: "idle",
      };
    },

    // Force refresh actions
    forceRefreshProfile: (state) => {
      state.profileDataLoaded = false;
      state.fetchStatus.profile = "idle";
    },
    forceRefreshFx: (state) => {
      state.fxDataLoaded = false;
      state.fetchStatus.fx = "idle";
    },
    forceRefreshCharges: (state) => {
      state.chargesDataLoaded = false;
      state.fetchStatus.charges = "idle";
    },

    // Reset actions
    resetHeaderState: () => initialState,
    clearAuthData: (state) => {
      state.authtoken = null;
      state.error = null;
      state.loading = false;
      state.isDropdownOpen = false;
    },
    setBeneficiaryUser: (state, action) => {
      state.isBeneficiaryUser = action.payload;
      localStorage.setItem("beneficaryLogin", action.payload ? "Y" : "N");
      localStorage.setItem("beneficiaryLogin", action.payload ? "Y" : "N");
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== PROFILE REDUCERS =====
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.fetchStatus.profile = "loading";
        state.profileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;

        if (action.payload && !action.payload._beneficiarySkipped) {
          state.profileData = action.payload;
          state.profileDataLoaded = true;
          state.profileLastFetched = new Date().toISOString();
          console.log("✅ Profile cached at:", state.profileLastFetched);
        }

        state.fetchStatus.profile = "succeeded";
        state.profileError = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;

        const isBeneficiary = state.isBeneficiaryUser;
        const is404Error = action.payload?.includes("404");

        if (isBeneficiary && is404Error) {
          console.log("ℹ️ Profile 404 for beneficiary - expected");
          state.profileError = null;
          state.fetchStatus.profile = "skipped";
          return;
        }

        state.profileError = action.payload;
        state.fetchStatus.profile = "failed";
        state.profileDataLoaded = false;
      })

      // ===== FX REDUCERS =====
      .addCase(fetchPartnerFxCurrencies.pending, (state) => {
        state.loading = true;
        state.fetchStatus.fx = "loading";
        state.error = null;
      })
      .addCase(fetchPartnerFxCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.partnerFxCurrencies = action.payload;
        state.hasFxData = action.payload.length > 0;
        state.fxDataLoaded = true;
        state.fxLastFetched = new Date().toISOString();
        state.fetchStatus.fx = "succeeded";
        state.error = null;
        console.log("✅ FX cached at:", state.fxLastFetched);
      })
      .addCase(fetchPartnerFxCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.fetchStatus.fx = "failed";
        state.fxDataLoaded = false;
      })

      // ===== CHARGES REDUCERS =====
      .addCase(fetchChargesData.pending, (state) => {
        state.chargesLoading = true;
        state.chargesError = null;
        state.fetchStatus.charges = "loading";
      })
      .addCase(fetchChargesData.fulfilled, (state, action) => {
        state.chargesLoading = false;
        state.chargesData = action.payload;
        state.chargesDataLoaded = true;
        state.chargesLastFetched = new Date().toISOString();
        state.chargesError = null;
        state.fetchStatus.charges = "succeeded";
        console.log("✅ Charges cached at:", state.chargesLastFetched);
      })
      .addCase(fetchChargesData.rejected, (state, action) => {
        state.chargesLoading = false;
        state.chargesError = action.payload;
        state.fetchStatus.charges = "failed";
        state.chargesDataLoaded = false;
        state.chargesData = [];
      });
  },
});

// ===== SELECTORS =====
export const selectHeader = (state) => state.header;
export const selectHeaderLoading = (state) => state.header.loading;
export const selectHeaderError = (state) => state.header.error;
export const selectIsDropdownOpen = (state) => state.header.isDropdownOpen;
export const selectHeaderColor = (state) => state.header.headerColor;
export const selectFetchStatus = (state) => state.header.fetchStatus;
export const selectPartnerFxCurrencies = (state) =>
  state.header.partnerFxCurrencies;
export const selectHasFxData = (state) => state.header.hasFxData;
export const selectFxDataLoaded = (state) => state.header.fxDataLoaded;
export const selectFxLastFetched = (state) => state.header.fxLastFetched;
export const selectProfileData = (state) => state.header.profileData;
export const selectProfileLoading = (state) => state.header.profileLoading;
export const selectProfileError = (state) => state.header.profileError;
export const selectProfileDataLoaded = (state) =>
  state.header.profileDataLoaded;
export const selectProfileLastFetched = (state) =>
  state.header.profileLastFetched;
export const selectChargesData = (state) => state.header.chargesData;
export const selectChargesLoading = (state) => state.header.chargesLoading;
export const selectChargesError = (state) => state.header.chargesError;
export const selectChargesLastFetched = (state) =>
  state.header.chargesLastFetched;
export const selectChargesDataLoaded = (state) =>
  state.header.chargesDataLoaded;
export const selectIsStaffLogin = (state) => state.header.isStaffLogin;
export const selectStaffRole = (state) => state.header.staffRole;
export const selectIsOwnerLogin = (state) => state.header.isOwnerLogin;
export const selectOwnerId = (state) => state.header.ownerId;
export const selectOwnerRoleName = (state) => state.header.ownerRoleName;
export const selectStaffId = (state) => state.header.staffId;
export const selectIsRemittanceOnlyCustomer = (state) =>
  state.header.isRemittanceOnlyCustomer;
export const selectIsWhitelabelledCustomerPartnerId = (state) =>
  state.header.isWhitelabelledCustomerPartnerId;
export const selectIsBeneficiaryUser = (state) =>
  state.header.isBeneficiaryUser;

export const {
  openDropdown,
  closeDropdown,
  setHeaderColor,
  updateLocalStorageState,
  clearProfileCache,
  clearFxCache,
  clearChargesCache,
  clearAllCache,
  forceRefreshProfile,
  forceRefreshFx,
  forceRefreshCharges,
  resetHeaderState,
  clearAuthData,
  setBeneficiaryUser,
  clearChargesData,
} = headerSlice.actions;

export default headerSlice.reducer;
