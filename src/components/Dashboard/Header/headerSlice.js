// src/components/Dashboard/Header/headerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get API signature for coordination
const getProfileSignature = (customerId) => {
  return `GET-${API_URL}/customers/${customerId}/profile-{}`;
};

const getFxSignature = () => {
  const isWhiteLabelled = localStorage.getItem("iswhitelabelledpartner");
  console.log("headerslice isWhiteLabelled",isWhiteLabelled);
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
        }
      );

      const rates = response.data.rates || [];
      return rates;
    } catch (error) {
      console.error("❌ fetchPartnerFxCurrencies error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Profile fetching thunk with coordination
export const fetchUserProfile = createAsyncThunk(
  "header/fetchUserProfile",
  async ({ customerId, bearertoken }, { rejectWithValue }) => {
    try {
      if (!bearertoken || !customerId) {
        throw new Error("Missing token or customer ID");
      }

      const response = await api.get(`/customers/${customerId}/profile`, {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
        },
        timeout: 10000,
      });

      if (response.data.status === "success") {
        const profile = response.data.profile;

        localStorage.setItem("firstName", profile.first_name);
        localStorage.setItem("lastName", profile.last_name);
        localStorage.setItem("middleName", profile.middle_name || "");

        return profile;
      } else {
        console.error(
          "❌ Profile API returned non-success status:",
          response.data
        );
        throw new Error("Failed to fetch profile - non-success status");
      }
    } catch (error) {
      console.error("❌ fetchUserProfile error:", error);
    }
  }
);

// Charges data thunk with coordination
export const fetchChargesData = createAsyncThunk(
  "header/fetchChargesData",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      if (!authtoken || !customerId) {
        throw new Error("Missing authentication token or customer ID");
      }

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
        return chargesData;
      } else {
        throw new Error("No charges data available");
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

      return rejectWithValue(errorMessage);
    }
  }
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
    localStorage.getItem("isWhitelabelledCustomer") || "N",
  authtoken: localStorage.getItem("authtoken"),
  isStaffLogin: localStorage.getItem("is_staff_login"),
  staffRole: localStorage.getItem("staff_role"),
  isOwnerLogin: localStorage.getItem("is_owner_login"),
  ownerId: localStorage.getItem("owner_id"),
  ownerRoleName: localStorage.getItem("owner_role_name"),
  staffId: localStorage.getItem("staff_id"),
  isRemittanceOnlyCustomer: localStorage.getItem("isRemittanceOnlyCustomer"),
  isWhitelabelledCustomerPartnerId: localStorage.getItem(
    "whitelabelled_customer_partnerid"
  ),
  logoutTime: localStorage.getItem("logoutTime")
    ? parseInt(localStorage.getItem("logoutTime"), 10)
    : 180000,
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
        localStorage.getItem("isWhitelabelledCustomer") || "N";
      state.authtoken = localStorage.getItem("authtoken");
      state.isStaffLogin = localStorage.getItem("is_staff_login");
      state.staffRole = localStorage.getItem("staff_role");
      state.isOwnerLogin = localStorage.getItem("is_owner_login");
      state.ownerId = localStorage.getItem("owner_id");
      state.ownerRoleName = localStorage.getItem("owner_role_name");
      state.staffId = localStorage.getItem("staff_id");
      state.isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer"
      );
      state.isWhitelabelledCustomerPartnerId = localStorage.getItem(
        "whitelabelled_customer_partnerid"
      );
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
          "✅ REDUX: Profile data received:",
          action.payload?.first_name
        );
        state.profileLoading = false;
        state.profileData = action.payload;
        state.fetchStatus.profile = "succeeded";
        state.profileError = null;
        state.isWhitelabelledCustomer =
          localStorage.getItem("isWhitelabelledCustomer") || "N";
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        if (
          action.payload !==
          "Profile fetch already in progress (global coordination)"
        ) {
          state.profileError = action.payload;
          state.fetchStatus.profile = "failed";
          console.error(
            "❌ Profile fetch rejected in reducer:",
            action.payload
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
      });
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
} = headerSlice.actions;

export default headerSlice.reducer;