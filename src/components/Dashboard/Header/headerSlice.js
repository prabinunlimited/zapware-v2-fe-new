// src/components/Dashboard/Header/headerSlice.js - COMPLETE WITH FIXES
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to check if user is beneficiary - FIXED TYPO
const shouldSkipForBeneficiary = (functionName) => {
  // ✅ FIX: Check for both spellings (with and without typo)
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

// Helper function to get API signature for coordination
const getProfileSignature = (customerId) => {
  return `GET-${API_URL}/customers/${customerId}/profile-{}`;
};

const getFxSignature = () => {
  const isWhiteLabelled = localStorage.getItem("iswhitelabelledpartner");
  const partnerId =
    isWhiteLabelled === "1"
      ? localStorage.getItem("whitelabelledpartnerid") || "9"
      : "9";
  return `POST-${API_URL}/partner-fxcurrencies-{"partner_id":"${partnerId}"}`;
};

const getChargesSignature = (customerId) => {
  return `GET-${API_URL}/get-charges/${customerId}-{}`;
};

// FX currencies thunk with coordination
export const fetchPartnerFxCurrencies = createAsyncThunk(
  "header/fetchPartnerFxCurrencies",
  async (bearertoken, { rejectWithValue }) => {
    const signature = getFxSignature();

    try {
      if (!bearertoken) {
        throw new Error("Bearer token missing");
      }

      const isWhiteLabelled = localStorage.getItem("iswhitelabelledpartner");
      const partnerId =
        isWhiteLabelled === "1"
          ? localStorage.getItem("whitelabelledpartnerid") || "9"
          : "9";

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
      return rates;
    } catch (error) {
      console.error("❌ fetchPartnerFxCurrencies error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Profile fetching thunk with coordination
export const fetchUserProfile = createAsyncThunk(
  "header/fetchUserProfile",
  async ({ customerId, bearertoken }, { rejectWithValue }) => {
    try {
      // ✅ CRITICAL FIX: Check if user is a beneficiary - FIXED TYPO
      const beneficiaryLogin =
        localStorage.getItem("beneficaryLogin") ||
        localStorage.getItem("beneficiaryLogin");
      const isBeneficiary = beneficiaryLogin === "Y";

      if (isBeneficiary) {
        console.log("🛑 SKIPPING: fetchUserProfile - User is a beneficiary");
        console.log(
          "📍 Beneficiary data is fetched via beneficiaries/fetch-merchant-benef endpoint",
        );
        return {
          _beneficiarySkipped: true,
          message: "Profile fetch skipped for beneficiary user",
        };
      }

      if (!bearertoken || !customerId) {
        throw new Error("Missing token or customer ID");
      }

      console.log(
        "🔍 fetchUserProfile: Fetching customer profile for ID:",
        customerId,
      );

      const response = await api.get(`/customers/${customerId}/profile`, {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
        },
        timeout: 10000,
      });

      if (response.data.status === "success") {
        const profile = response.data.profile;

        console.log("✅ Customer profile fetched successfully:", {
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
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
        console.error(
          "❌ Profile API returned non-success status:",
          response.data,
        );
        throw new Error("Failed to fetch profile - non-success status");
      }
    } catch (error) {
      console.error("❌ fetchUserProfile error:", error);

      // Check if it's a 404 (customer not found) - might be a beneficiary
      if (error.response?.status === 404) {
        // ✅ FIX: Check for both spellings
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

// Charges data thunk with coordination
export const fetchChargesData = createAsyncThunk(
  "header/fetchChargesData",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    // ✅ SKIP for beneficiaries
    if (shouldSkipForBeneficiary("fetchChargesData")) {
      console.log("📍 Charges data not needed for beneficiaries");
      return []; // Return empty array for beneficiaries
    }

    try {
      if (!authtoken || !customerId) {
        throw new Error("Missing authentication token or customer ID");
      }

      console.log(
        "🔍 fetchChargesData: Fetching charges for customer:",
        customerId,
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

      if (chargesData.length > 0) {
        console.log(
          "✅ Charges data fetched successfully, count:",
          chargesData.length,
        );
        return chargesData;
      } else {
        console.warn("⚠️ No charges data available for customer:", customerId);
        return [];
      }
    } catch (error) {
      console.error("❌ fetchChargesData error:", error);

      let errorMessage = "Failed to fetch charges data";

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "Network error: Unable to connect to server";
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }

      console.error("❌ Charges fetch failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

// New thunk: Check if user is beneficiary before fetching
export const fetchCustomerDataWithBeneficiaryCheck = createAsyncThunk(
  "header/fetchCustomerDataWithBeneficiaryCheck",
  async (
    { customerId, bearertoken, authtoken },
    { dispatch, rejectWithValue },
  ) => {
    try {
      // ✅ FIX: Check for both spellings
      const beneficiaryLogin =
        localStorage.getItem("beneficaryLogin") ||
        localStorage.getItem("beneficiaryLogin");
      const isBeneficiary = beneficiaryLogin === "Y";

      if (isBeneficiary) {
        console.log("🛑 User is beneficiary - skipping customer data fetch");
        return {
          isBeneficiary: true,
          message: "Using beneficiary-specific APIs instead",
        };
      }

      // Only fetch customer data if not a beneficiary
      console.log("👤 User is regular customer - fetching customer data");

      // Fetch profile data
      const profileResult = await dispatch(
        fetchUserProfile({ customerId, bearertoken }),
      );

      // Fetch FX data
      const fxResult = await dispatch(fetchPartnerFxCurrencies(bearertoken));

      // Fetch charges data
      const chargesResult = await dispatch(
        fetchChargesData({ customerId, authtoken }),
      );

      return {
        isBeneficiary: false,
        profile: profileResult.payload,
        fx: fxResult.payload,
        charges: chargesResult.payload,
      };
    } catch (error) {
      console.error("❌ fetchCustomerDataWithBeneficiaryCheck error:", error);
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  partnerFxCurrencies: [],
  hasFxData: false,
  profileData: null,
  profileLoading: false,
  profileError: null,
  chargesData: [],
  chargesLoading: false,
  chargesError: null,
  chargesLastFetched: null,
  loading: false,
  error: null,
  isDropdownOpen: false,
  fetchStatus: {
    fx: "idle",
    profile: "idle",
    charges: "idle",
  },
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
  // ✅ FIX: Check for both spellings in initialState
  isBeneficiaryUser:
    localStorage.getItem("beneficaryLogin") === "Y" ||
    localStorage.getItem("beneficiaryLogin") === "Y",
};

const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
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
      // ✅ FIX: Check for both spellings in updateLocalStorageState
      state.isBeneficiaryUser =
        localStorage.getItem("beneficaryLogin") === "Y" ||
        localStorage.getItem("beneficiaryLogin") === "Y";
    },
    clearAuthData: (state) => {
      state.authtoken = null;
      state.error = null;
      state.loading = false;
      state.isDropdownOpen = false;
      state.fetchStatus = {
        fx: "idle",
        profile: "idle",
        charges: "idle",
      };
    },
    clearProfileData: (state) => {
      state.profileData = null;
      state.profileLoading = false;
      state.profileError = null;
      state.fetchStatus.profile = "idle";
    },
    clearChargesData: (state) => {
      state.chargesData = [];
      state.chargesLoading = false;
      state.chargesError = null;
      state.chargesLastFetched = null;
      state.fetchStatus.charges = "idle";
    },
    setChargesLoading: (state, action) => {
      state.chargesLoading = action.payload;
    },
    resetChargesError: (state) => {
      state.chargesError = null;
    },
    resetFetchStatus: (state) => {
      state.fetchStatus = {
        fx: "idle",
        profile: "idle",
        charges: "idle",
      };
    },
    resetHeaderState: () => initialState,
    clearApiCache: (state) => {
      // Cache clearing handled by api service
    },
    forceRefreshProfile: (state) => {
      state.fetchStatus.profile = "idle";
      state.profileData = null;
    },
    forceRefreshFx: (state) => {
      state.fetchStatus.fx = "idle";
      state.partnerFxCurrencies = [];
      state.hasFxData = false;
    },
    forceRefreshCharges: (state) => {
      state.fetchStatus.charges = "idle";
      state.chargesData = [];
    },
    setBeneficiaryUser: (state, action) => {
      state.isBeneficiaryUser = action.payload;
      // Set both spellings for compatibility
      localStorage.setItem("beneficaryLogin", action.payload ? "Y" : "N");
      localStorage.setItem("beneficiaryLogin", action.payload ? "Y" : "N");
    },
    // New action for debugging
    logHeaderState: (state) => {
      console.log("🔍 Header Slice State:", {
        isBeneficiaryUser: state.isBeneficiaryUser,
        hasFxData: state.hasFxData,
        fxCurrenciesCount: state.partnerFxCurrencies.length,
        profileData: state.profileData ? "Loaded" : "Not loaded",
        isWhitelabelledCustomerPartnerId:
          state.isWhitelabelledCustomerPartnerId,
        isRemittanceOnlyCustomer: state.isRemittanceOnlyCustomer,
        fetchStatus: state.fetchStatus,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartnerFxCurrencies.pending, (state) => {
        state.loading = true;
        state.fetchStatus.fx = "loading";
        state.error = null;
      })
      .addCase(fetchPartnerFxCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.partnerFxCurrencies = action.payload;
        state.hasFxData = action.payload.length > 0;
        state.fetchStatus.fx = "succeeded";
        state.error = null;
      })
      .addCase(fetchPartnerFxCurrencies.rejected, (state, action) => {
        state.loading = false;
        if (
          action.payload !==
          "FX fetch already in progress (global coordination)"
        ) {
          state.error = action.payload;
          state.fetchStatus.fx = "failed";
        } else {
          state.fetchStatus.fx = "idle";
        }
        state.hasFxData = false;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.fetchStatus.profile = "loading";
        state.profileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        console.log(
          "✅ REDUX: Profile fetch completed:",
          action.payload?.first_name || action.payload?._beneficiarySkipped
            ? "Skipped for beneficiary"
            : "Empty",
        );

        state.profileLoading = false;

        // Only set profileData if we actually got real profile data (not skipped for beneficiary)
        if (action.payload && !action.payload._beneficiarySkipped) {
          state.profileData = action.payload;
          console.log("✅ Profile data stored in Redux");
        } else {
          console.log(
            "ℹ️ Profile fetch skipped or returned empty for beneficiary",
          );
          // Keep existing profileData or null, don't overwrite
        }

        state.fetchStatus.profile = "succeeded";
        state.profileError = null;
        state.isWhitelabelledCustomer =
          localStorage.getItem("whitelabelled_customer") || "N";
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;

        // Special handling for beneficiary 404 errors
        // ✅ FIX: Check for both spellings
        const isBeneficiary =
          state.isBeneficiaryUser ||
          localStorage.getItem("beneficaryLogin") === "Y" ||
          localStorage.getItem("beneficiaryLogin") === "Y";
        const is404Error =
          action.payload?.message?.includes("404") ||
          action.payload?.message?.includes("Customer not found");

        if (isBeneficiary && is404Error) {
          console.log("ℹ️ Profile 404 error for beneficiary - expected");
          state.profileError = null;
          state.fetchStatus.profile = "skipped";
          return;
        }

        if (
          action.payload !==
          "Profile fetch already in progress (global coordination)"
        ) {
          state.profileError = action.payload;
          state.fetchStatus.profile = "failed";
          console.error(
            "❌ Profile fetch rejected in reducer:",
            action.payload,
          );
        } else {
          state.fetchStatus.profile = "idle";
        }
      })
      .addCase(fetchChargesData.pending, (state) => {
        state.chargesLoading = true;
        state.chargesError = null;
        state.fetchStatus.charges = "loading";
      })
      .addCase(fetchChargesData.fulfilled, (state, action) => {
        state.chargesLoading = false;
        state.chargesData = action.payload;
        state.chargesError = null;
        state.chargesLastFetched = new Date().toISOString();
        state.fetchStatus.charges = "succeeded";
      })
      .addCase(fetchChargesData.rejected, (state, action) => {
        state.chargesLoading = false;
        if (
          action.payload !==
          "Charges fetch already in progress (global coordination)"
        ) {
          state.chargesError = action.payload;
          state.fetchStatus.charges = "failed";
          console.error("❌ Charges fetch failed:", action.payload);
        } else {
          state.fetchStatus.charges = "idle";
        }
        state.chargesData = [];
      })
      .addCase(fetchCustomerDataWithBeneficiaryCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomerDataWithBeneficiaryCheck.fulfilled,
        (state, action) => {
          state.loading = false;
          state.isBeneficiaryUser = action.payload.isBeneficiary;
          state.error = null;

          if (!action.payload.isBeneficiary) {
            console.log("✅ Customer data fetched successfully");
          } else {
            console.log("✅ Skipped customer data fetch for beneficiary");
          }
        },
      )
      .addCase(
        fetchCustomerDataWithBeneficiaryCheck.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
          console.error(
            "❌ fetchCustomerDataWithBeneficiaryCheck error:",
            action.payload,
          );
        },
      );
  },
});

export const selectHeader = (state) => state.header;
export const selectHeaderLoading = (state) => state.header.loading;
export const selectHeaderError = (state) => state.header.error;
export const selectIsDropdownOpen = (state) => state.header.isDropdownOpen;
export const selectHeaderColor = (state) => state.header.headerColor;
export const selectFetchStatus = (state) => state.header.fetchStatus;
export const selectPartnerFxCurrencies = (state) =>
  state.header.partnerFxCurrencies;
export const selectHasFxData = (state) => state.header.hasFxData;
export const selectProfileData = (state) => state.header.profileData;
export const selectProfileLoading = (state) => state.header.profileLoading;
export const selectProfileError = (state) => state.header.profileError;
export const selectChargesData = (state) => state.header.chargesData;
export const selectChargesLoading = (state) => state.header.chargesLoading;
export const selectChargesError = (state) => state.header.chargesError;
export const selectChargesLastFetched = (state) =>
  state.header.chargesLastFetched;
export const selectChargesFetchStatus = (state) =>
  state.header.fetchStatus.charges;
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
  setLoading,
  setError,
  openDropdown,
  closeDropdown,
  setHeaderColor,
  updateLocalStorageState,
  clearAuthData,
  clearProfileData,
  clearChargesData,
  setChargesLoading,
  resetChargesError,
  resetFetchStatus,
  resetHeaderState,
  clearApiCache,
  forceRefreshProfile,
  forceRefreshFx,
  forceRefreshCharges,
  setBeneficiaryUser,
  logHeaderState,
} = headerSlice.actions;

export default headerSlice.reducer;
