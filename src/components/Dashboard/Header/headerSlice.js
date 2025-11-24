// src/components/Dashboard/Header/headerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// FX currencies thunk
export const fetchPartnerFxCurrencies = createAsyncThunk(
  "header/fetchPartnerFxCurrencies",
  async (bearertoken, { rejectWithValue }) => {
    try {
      if (!bearertoken) {
        throw new Error("Bearer token missing");
      }

      const isWhiteLabelled = localStorage.getItem("iswhitelabelledpartner");
      const partnerId = isWhiteLabelled === "1"
        ? localStorage.getItem("whitelabelledpartnerid") || "9"
        : "9";

      console.log("🔍 Fetching FX currencies for partner:", partnerId);

      const response = await axios.post(
        `${API_URL}/partner-fxcurrencies?partner_id=${partnerId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
          timeout: 10000,
        }
      );

      return response.data.rates || [];
    } catch (error) {
      console.error("❌ fetchPartnerFxCurrencies error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Profile fetching thunk
export const fetchUserProfile = createAsyncThunk(
  "header/fetchUserProfile",
  async ({ customerId, bearertoken }, { rejectWithValue }) => {
    try {
      if (!bearertoken || !customerId) {
        throw new Error("Missing token or customer ID");
      }

      console.log("🔍 Fetching user profile for customer:", customerId);
      
      // Try both API URLs - first the direct URL, then the environment variable
      let response;
      let apiUsed = 'direct';
      
      try {
        // First try direct URL
        response = await axios.get(
          `https://sandbox-zapware.unlimitedremit.com/api/customers/${customerId}/profile`,
          {
            headers: {
              Authorization: `Bearer ${bearertoken}`,
            },
            timeout: 10000,
          }
        );
        apiUsed = 'direct';
      } catch (directError) {
        console.log("🔍 Direct API failed, trying environment URL");
        // Fallback to environment variable URL
        response = await axios.get(
          `${API_URL}/customers/${customerId}/profile`,
          {
            headers: {
              Authorization: `Bearer ${bearertoken}`,
            },
            timeout: 10000,
          }
        );
        apiUsed = 'env';
      }

      console.log(`🔍 Profile API success (${apiUsed}):`, response.data);

      if (response.data.status === "success") {
        const profile = response.data.profile;
        
        // Store in localStorage for immediate access
        localStorage.setItem("firstName", profile.first_name);
        localStorage.setItem("lastName", profile.last_name);
        localStorage.setItem("middleName", profile.middle_name || "");
        
        console.log("✅ Profile fetched and saved to localStorage:", profile.first_name);
        console.log("✅ Returning profile data to be stored in Redux:", profile);
        return profile;
      } else {
        console.error("❌ Profile API returned non-success status:", response.data);
        throw new Error("Failed to fetch profile - non-success status");
      }
      
    } catch (error) {
      console.error("❌ fetchUserProfile error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Charges data thunk
export const fetchChargesData = createAsyncThunk(
  "header/fetchChargesData",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      if (!authtoken || !customerId) {
        throw new Error("Missing authentication token or customer ID");
      }

      console.log("🔍 Fetching charges data for customer:", customerId);
      
      // Try multiple API endpoints
      const apiEndpoints = [
        `https://sandbox-zapware.unlimitedremit.com/api/get-charges/${customerId}`,
        `${API_URL}/get-charges/${customerId}`,
        `https://sandbox-zapware.unlimitedremit.com/api/charges/${customerId}`,
        `${API_URL}/charges/${customerId}`
      ];

      let lastError = null;
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log("🔍 Trying endpoint:", endpoint);
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${authtoken}`,
            },
            timeout: 8000,
          });

          console.log("✅ Charges data fetched successfully from:", endpoint);
          console.log("📊 Charges response:", response.data);

          // Handle different response structures
          const chargesData = response.data.charge_details || 
                            response.data.charges || 
                            response.data.data || 
                            [];

          if (chargesData.length > 0) {
            return chargesData;
          }
        } catch (error) {
          console.log(`❌ Endpoint failed: ${endpoint}`, error.message);
          lastError = error;
          continue;
        }
      }

      // If all endpoints failed
      throw lastError || new Error("No charges data available from any endpoint");
      
    } catch (error) {
      console.error("❌ fetchChargesData error:", error);
      
      let errorMessage = "Failed to fetch charges data";
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response received
        errorMessage = "Network error: Unable to connect to server";
      } else {
        // Something else happened
        errorMessage = error.message || "Unknown error occurred";
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  // FX data states
  partnerFxCurrencies: [],
  hasFxData: false,

  // Profile states
  profileData: null,
  profileLoading: false,
  profileError: null,

  // Charges states
  chargesData: [],
  chargesLoading: false,
  chargesError: null,
  chargesLastFetched: null,

  // UI state
  loading: false,
  error: null,
  isDropdownOpen: false,

  // Fetch status tracking
  fetchStatus: {
    fx: 'idle',
    profile: 'idle',
    charges: 'idle'
  },

  // Local storage derived state
  headerColor: localStorage.getItem("header_color") || "bg-sky-800",
  isWhitelabelledCustomer: localStorage.getItem("isWhitelabelledCustomer") || "N",
  authtoken: localStorage.getItem("authtoken"),
  isStaffLogin: localStorage.getItem("is_staff_login"),
  staffRole: localStorage.getItem("staff_role"),
  isOwnerLogin: localStorage.getItem("is_owner_login"),
  ownerId: localStorage.getItem("owner_id"),
  ownerRoleName: localStorage.getItem("owner_role_name"),
  staffId: localStorage.getItem("staff_id"),
  isRemittanceOnlyCustomer: localStorage.getItem("isRemittanceOnlyCustomer"),
  isWhitelabelledCustomerPartnerId: localStorage.getItem("whitelabelled_customer_partnerid"),

  // Timer state
  logoutTime: localStorage.getItem("logoutTime") ? parseInt(localStorage.getItem("logoutTime"), 10) : 180000,
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
    // Dropdown actions
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
      // Sync with localStorage
      state.headerColor = localStorage.getItem("header_color") || "bg-sky-800";
      state.isWhitelabelledCustomer = localStorage.getItem("isWhitelabelledCustomer") || "N";
      state.authtoken = localStorage.getItem("authtoken");
      state.isStaffLogin = localStorage.getItem("is_staff_login");
      state.staffRole = localStorage.getItem("staff_role");
      state.isOwnerLogin = localStorage.getItem("is_owner_login");
      state.ownerId = localStorage.getItem("owner_id");
      state.ownerRoleName = localStorage.getItem("owner_role_name");
      state.staffId = localStorage.getItem("staff_id");
      state.isRemittanceOnlyCustomer = localStorage.getItem("isRemittanceOnlyCustomer");
      state.isWhitelabelledCustomerPartnerId = localStorage.getItem("whitelabelled_customer_partnerid");
    },
    clearAuthData: (state) => {
      // Clear all auth-related data
      state.authtoken = null;
      state.error = null;
      state.loading = false;
      state.isDropdownOpen = false;
      state.fetchStatus = {
        fx: 'idle',
        profile: 'idle',
        charges: 'idle'
      };
    },
    // Profile actions
    clearProfileData: (state) => {
      state.profileData = null;
      state.profileLoading = false;
      state.profileError = null;
      state.fetchStatus.profile = 'idle';
    },
    // Charges actions
    clearChargesData: (state) => {
      state.chargesData = [];
      state.chargesLoading = false;
      state.chargesError = null;
      state.chargesLastFetched = null;
      state.fetchStatus.charges = 'idle';
    },
    setChargesLoading: (state, action) => {
      state.chargesLoading = action.payload;
    },
    resetChargesError: (state) => {
      state.chargesError = null;
    },
    resetFetchStatus: (state) => {
      state.fetchStatus = {
        fx: 'idle',
        profile: 'idle',
        charges: 'idle'
      };
    },
    resetHeaderState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Partner FX Currencies
      .addCase(fetchPartnerFxCurrencies.pending, (state) => {
        state.loading = true;
        state.fetchStatus.fx = 'loading';
      })
      .addCase(fetchPartnerFxCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.partnerFxCurrencies = action.payload;
        state.hasFxData = action.payload.length > 0;
        state.fetchStatus.fx = 'succeeded';
      })
      .addCase(fetchPartnerFxCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hasFxData = false;
        state.fetchStatus.fx = 'failed';
      })
      
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.fetchStatus.profile = 'loading';
        state.profileError = null;
        console.log("🔄 Profile fetch started - setting loading state");
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileData = action.payload;
        state.fetchStatus.profile = 'succeeded';
        state.profileError = null;
        
        console.log("✅ Profile data stored in Redux:", {
          hasData: !!action.payload,
          dataKeys: action.payload ? Object.keys(action.payload) : 'null',
          firstName: action.payload?.first_name
        });
        
        // Update localStorage state to reflect new firstName
        state.isWhitelabelledCustomer = localStorage.getItem("isWhitelabelledCustomer") || "N";
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
        state.fetchStatus.profile = 'failed';
        console.error("❌ Profile fetch rejected in reducer:", action.payload);
      })
      
      // Fetch Charges Data
      .addCase(fetchChargesData.pending, (state) => {
        state.chargesLoading = true;
        state.chargesError = null;
        state.fetchStatus.charges = 'loading';
        console.log("🔄 Charges fetch started");
      })
      .addCase(fetchChargesData.fulfilled, (state, action) => {
        state.chargesLoading = false;
        state.chargesData = action.payload;
        state.chargesError = null;
        state.chargesLastFetched = new Date().toISOString();
        state.fetchStatus.charges = 'succeeded';
        
        console.log("✅ Charges data stored in Redux:", {
          count: action.payload.length,
          sample: action.payload[0]
        });
      })
      .addCase(fetchChargesData.rejected, (state, action) => {
        state.chargesLoading = false;
        state.chargesError = action.payload;
        state.chargesData = [];
        state.fetchStatus.charges = 'failed';
        
        console.error("❌ Charges fetch failed:", action.payload);
      });
  },
});

// Selectors

// Header state selectors
export const selectHeader = (state) => state.header;
export const selectHeaderLoading = (state) => state.header.loading;
export const selectHeaderError = (state) => state.header.error;
export const selectIsDropdownOpen = (state) => state.header.isDropdownOpen;
export const selectHeaderColor = (state) => state.header.headerColor;
export const selectFetchStatus = (state) => state.header.fetchStatus;

// FX data selectors
export const selectPartnerFxCurrencies = (state) => state.header.partnerFxCurrencies;
export const selectHasFxData = (state) => state.header.hasFxData;

// Profile selectors
export const selectProfileData = (state) => state.header.profileData;
export const selectProfileLoading = (state) => state.header.profileLoading;
export const selectProfileError = (state) => state.header.profileError;

// Charges selectors
export const selectChargesData = (state) => state.header.chargesData;
export const selectChargesLoading = (state) => state.header.chargesLoading;
export const selectChargesError = (state) => state.header.chargesError;
export const selectChargesLastFetched = (state) => state.header.chargesLastFetched;
export const selectChargesFetchStatus = (state) => state.header.fetchStatus.charges;

// Local storage derived selectors
export const selectIsStaffLogin = (state) => state.header.isStaffLogin;
export const selectStaffRole = (state) => state.header.staffRole;
export const selectIsOwnerLogin = (state) => state.header.isOwnerLogin;
export const selectOwnerId = (state) => state.header.ownerId;
export const selectOwnerRoleName = (state) => state.header.ownerRoleName;
export const selectStaffId = (state) => state.header.staffId;
export const selectIsRemittanceOnlyCustomer = (state) => state.header.isRemittanceOnlyCustomer;
export const selectIsWhitelabelledCustomerPartnerId = (state) => state.header.isWhitelabelledCustomerPartnerId;

// Actions
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
} = headerSlice.actions;

export default headerSlice.reducer;