// src/redux/slices/beneficiariesHeaderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get bearer token
const getBearerToken = () => {
  const bearertoken = localStorage.getItem("bearertoken");
  return bearertoken ? `Bearer ${bearertoken}` : null;
};

// Helper function to get auth token (different from bearer token)
const getAuthToken = () => {
  const authtoken = localStorage.getItem("authtoken");
  return authtoken ? `Bearer ${authtoken}` : null;
};

// 1. Fetch merchant beneficiary data (uses authtoken)
export const fetchMerchantBeneficiary = createAsyncThunk(
  "beneficiariesHeader/fetchMerchantBeneficiary",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      if (!beneficiaryId) {
        throw new Error("Missing beneficiary ID");
      }

      const authtoken = getAuthToken();
      if (!authtoken) {
        throw new Error("Authentication token not found");
      }

      console.log("🔍 Fetching merchant beneficiary:", beneficiaryId);

      const response = await axios.get(
        `${API_URL}/beneficiaries/fetch-merchant-benef/${beneficiaryId}`,
        {
          headers: {
            Authorization: authtoken,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      console.log("✅ Merchant beneficiary data fetched:", response.data);

      // Component expects data.data structure
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("❌ fetchMerchantBeneficiary error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch merchant beneficiary"
      );
    }
  }
);

export const fetchBeneficiaryProfile = fetchMerchantBeneficiary;

export const selectHasFetched = (state) => {
  const { merchantData, fetchStatus } = state.beneficiariesHeader;
  const hasMerchantData = !!merchantData;
  const hasFetchedMerchant = fetchStatus.merchant === "succeeded";

  console.log("🔍 selectHasFetched debug:", {
    hasMerchantData,
    hasFetchedMerchant,
    fetchStatus: fetchStatus.merchant,
    merchantDataExists: !!merchantData,
  });

  return hasMerchantData && hasFetchedMerchant;
};

// 2. Update beneficiary profile (matches component's API)
export const updateBeneficiaryProfile = createAsyncThunk(
  "beneficiariesHeader/updateBeneficiaryProfile",
  async ({ beneficiaryId, formData }, { rejectWithValue }) => {
    try {
      if (!beneficiaryId || !formData) {
        throw new Error("Missing beneficiary ID or form data");
      }

      console.log("💾 Updating beneficiary with payload:", {
        beneficiaryId,
        formData,
      });

      const response = await axios.post(
        `${API_URL}/beneficiaries/update-requestremit-benef`, // Matches component
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      console.log("✅ Beneficiary update response:", response.data);

      if (response.data.status === "success") {
        // Return the updated data
        return response.data.data || response.data;
      } else {
        throw new Error(
          response.data.message || "Failed to update beneficiary"
        );
      }
    } catch (error) {
      console.error("❌ updateBeneficiaryProfile error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update beneficiary profile"
      );
    }
  }
);

// 3. Fetch location data (countries, states, cities, nationalities)
export const fetchLocationData = createAsyncThunk(
  "beneficiariesHeader/fetchLocationData",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🌍 Fetching location data...");

      // Fetch all location data in parallel (no auth required based on component)
      const [countriesRes, statesRes, citiesRes, nationalitiesRes] =
        await Promise.allSettled([
          axios.get(`${API_URL}/countries`, { timeout: 10000 }),
          axios.get(`${API_URL}/states`, { timeout: 10000 }),
          axios.get(`${API_URL}/cities`, { timeout: 10000 }),
          axios.get(`${API_URL}/nationalities`, { timeout: 10000 }),
        ]);

      // Extract data from each response, handling failures gracefully
      const countries =
        countriesRes.status === "fulfilled"
          ? countriesRes.value.data.data || countriesRes.value.data || []
          : [];

      const states =
        statesRes.status === "fulfilled"
          ? statesRes.value.data.data || statesRes.value.data || []
          : [];

      const cities =
        citiesRes.status === "fulfilled"
          ? citiesRes.value.data.data || citiesRes.value.data || []
          : [];

      const nationalities =
        nationalitiesRes.status === "fulfilled"
          ? nationalitiesRes.value.data.data ||
            nationalitiesRes.value.data ||
            []
          : [];

      console.log("✅ Location data fetched:", {
        countriesCount: countries.length,
        statesCount: states.length,
        citiesCount: cities.length,
        nationalitiesCount: nationalities.length,
      });

      return {
        countries,
        states,
        cities,
        nationalities,
      };
    } catch (error) {
      console.error("❌ fetchLocationData error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch location data"
      );
    }
  }
);

// 4. Combined fetch for convenience (what the component expects)
export const fetchBeneficiaryData = createAsyncThunk(
  "beneficiariesHeader/fetchBeneficiaryData",
  async (beneficiaryId, { rejectWithValue, dispatch }) => {
    try {
      if (!beneficiaryId) {
        throw new Error("Missing beneficiary ID");
      }

      console.log("🚀 fetchBeneficiaryData called with ID:", beneficiaryId);
      console.log("🔄 Dispatching merchant and location fetches...");

      // Dispatch both actions
      const results = await Promise.allSettled([
        dispatch(fetchMerchantBeneficiary(beneficiaryId)),
        dispatch(fetchLocationData()),
      ]);

      console.log("✅ fetchBeneficiaryData results:", results);

      return { success: true };
    } catch (error) {
      console.error("❌ fetchBeneficiaryData error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch beneficiary data"
      );
    }
  }
);

// 5. Verification APIs (for use in component)
export const sendEmailPasscode = createAsyncThunk(
  "beneficiariesHeader/sendEmailPasscode",
  async (payload, { rejectWithValue }) => {
    try {
      const bearertoken = getBearerToken();
      if (!bearertoken) {
        throw new Error("Bearer token not found");
      }

      console.log("📧 Sending email passcode:", payload);

      const response = await axios.post(
        `${API_URL}/send-passcode-registration`,
        payload,
        {
          headers: {
            Authorization: bearertoken,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Email passcode response:", response.data);

      if (response.data.status === "success") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to send passcode");
      }
    } catch (error) {
      console.error("❌ sendEmailPasscode error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to send email passcode"
      );
    }
  }
);

export const validateEmailPasscode = createAsyncThunk(
  "beneficiariesHeader/validateEmailPasscode",
  async (payload, { rejectWithValue }) => {
    try {
      const bearertoken = getBearerToken();
      if (!bearertoken) {
        throw new Error("Bearer token not found");
      }

      console.log("📧 Validating email passcode:", payload.email);

      const response = await axios.post(
        `${API_URL}/validate-passcode-registration`,
        payload,
        {
          headers: {
            Authorization: bearertoken,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Email validation response:", response.data);

      if (response.data.status === "success") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Invalid passcode");
      }
    } catch (error) {
      console.error("❌ validateEmailPasscode error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to validate email passcode"
      );
    }
  }
);

export const sendPhoneOTP = createAsyncThunk(
  "beneficiariesHeader/sendPhoneOTP",
  async (payload, { rejectWithValue }) => {
    try {
      const bearertoken = getBearerToken();
      if (!bearertoken) {
        throw new Error("Bearer token not found");
      }

      console.log("📱 Sending phone OTP:", payload);

      const response = await axios.post(
        `${API_URL}/send-otp-registration`,
        payload,
        {
          headers: {
            Authorization: bearertoken,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Phone OTP response:", response.data);

      if (response.data.status === "success") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("❌ sendPhoneOTP error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to send phone OTP"
      );
    }
  }
);

export const validatePhoneOTP = createAsyncThunk(
  "beneficiariesHeader/validatePhoneOTP",
  async (payload, { rejectWithValue }) => {
    try {
      const bearertoken = getBearerToken();
      if (!bearertoken) {
        throw new Error("Bearer token not found");
      }

      console.log("📱 Validating phone OTP for:", payload.mobile_number);

      const response = await axios.post(
        `${API_URL}/validate-otp-registration`,
        payload,
        {
          headers: {
            Authorization: bearertoken,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Phone validation response:", response.data);

      if (response.data.status === "success") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("❌ validatePhoneOTP error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to validate phone OTP"
      );
    }
  }
);

const initialState = {
  // Beneficiary data
  merchantData: null,
  beneficiaryProfile: null, // Will be derived from merchantData
  locationData: null,

  // Loading states
  merchantLoading: false,
  locationLoading: false,
  updating: false,
  verificationLoading: false,

  // Error states
  merchantError: null,
  locationError: null,
  updateError: null,
  verificationError: null,

  // UI state
  isDropdownOpen: false,

  // Local storage derived state
  benefCode: localStorage.getItem("benef_code") || "",
  beneficiaryFirstName:
    localStorage.getItem("beneficiary_firstName") ||
    localStorage.getItem("firstName") ||
    "Beneficiary",
  beneficiaryLastName:
    localStorage.getItem("beneficiary_lastName") ||
    localStorage.getItem("lastName") ||
    "",

  // Auth state
  isStaffLogin: localStorage.getItem("is_staff_login") || "0",
  staffRole: localStorage.getItem("staff_role") || "",
  isOwnerLogin: localStorage.getItem("is_owner_login") || "0",
  ownerRoleName: localStorage.getItem("owner_role_name") || "",
  staffId: localStorage.getItem("staff_id") || "",

  // Partner config
  isRemittanceOnlyCustomer:
    localStorage.getItem("isRemittanceOnlyCustomer") || "N",
  isWhitelabelledCustomer:
    localStorage.getItem("isWhitelabelledCustomer") || "N",

  // Verification states
  emailVerificationSent: false,
  phoneVerificationSent: false,
  emailVerified: false,
  phoneVerified: false,

  // Fetch status
  fetchStatus: {
    merchant: "idle",
    location: "idle",
  },
};

const beneficiariesHeaderSlice = createSlice({
  name: "beneficiariesHeader",
  initialState,
  reducers: {
    // UI actions
    openDropdown: (state) => {
      state.isDropdownOpen = true;
    },

    closeDropdown: (state) => {
      state.isDropdownOpen = false;
    },

    // Local storage sync
    updateLocalStorageState: (state) => {
      state.benefCode = localStorage.getItem("benef_code") || "";
      state.beneficiaryFirstName =
        localStorage.getItem("beneficiary_firstName") ||
        localStorage.getItem("firstName") ||
        "Beneficiary";
      state.beneficiaryLastName =
        localStorage.getItem("beneficiary_lastName") ||
        localStorage.getItem("lastName") ||
        "";
      state.isStaffLogin = localStorage.getItem("is_staff_login") || "0";
      state.staffRole = localStorage.getItem("staff_role") || "";
      state.isOwnerLogin = localStorage.getItem("is_owner_login") || "0";
      state.ownerRoleName = localStorage.getItem("owner_role_name") || "";
      state.staffId = localStorage.getItem("staff_id") || "";
      state.isRemittanceOnlyCustomer =
        localStorage.getItem("isRemittanceOnlyCustomer") || "N";
      state.isWhitelabelledCustomer =
        localStorage.getItem("isWhitelabelledCustomer") || "N";
    },

    // Data actions
    clearBeneficiaryData: (state) => {
      state.merchantData = null;
      state.beneficiaryProfile = null;
      state.locationData = null;
      state.merchantLoading = false;
      state.locationLoading = false;
      state.updating = false;
      state.verificationLoading = false;
      state.merchantError = null;
      state.locationError = null;
      state.updateError = null;
      state.verificationError = null;
      state.fetchStatus.merchant = "idle";
      state.fetchStatus.location = "idle";
      state.emailVerificationSent = false;
      state.phoneVerificationSent = false;
      state.emailVerified = false;
      state.phoneVerified = false;
    },

    setBenefCode: (state, action) => {
      state.benefCode = action.payload;
      localStorage.setItem("benef_code", action.payload);
    },

    // Clear update error
    clearUpdateError: (state) => {
      state.updateError = null;
      state.updating = false;
    },

    // Clear verification states
    clearVerificationStates: (state) => {
      state.emailVerificationSent = false;
      state.phoneVerificationSent = false;
      state.emailVerified = false;
      state.phoneVerified = false;
      state.verificationError = null;
      state.verificationLoading = false;
    },

    // Set beneficiary profile from merchant data
    setBeneficiaryProfileFromMerchant: (state) => {
      if (state.merchantData) {
        state.beneficiaryProfile = {
          first_name: state.merchantData.first_name,
          middle_name: state.merchantData.middle_name,
          last_name: state.merchantData.last_name,
          email: state.merchantData.email,
          country_phone_code: state.merchantData.country_phone_code,
          phone_number: state.merchantData.phone_number,
          country_id: state.merchantData.country_id,
          state: state.merchantData.state,
          city: state.merchantData.city,
          street: state.merchantData.street,
          postalcode: state.merchantData.postalcode,
          nationality_id: state.merchantData.nationality_id,
          gender: state.merchantData.gender,
        };
      }
    },

    // Reset state
    resetBeneficiaryHeader: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMerchantBeneficiary.pending, (state) => {
        state.merchantLoading = true;
        state.fetchStatus.merchant = "loading";
        state.merchantError = null;
      })
      .addCase(fetchMerchantBeneficiary.fulfilled, (state, action) => {
        state.merchantLoading = false;
        const data = action.payload;
        state.merchantData = data;
        state.fetchStatus.merchant = "succeeded";
        state.merchantError = null;

        // Extract benef_code from response
        const fetchedBenefCode = data?.benef_code || data?.benefCode;

        if (fetchedBenefCode) {
          state.benefCode = fetchedBenefCode;
          localStorage.setItem("benef_code", fetchedBenefCode);
          console.log("✅ benef_code stored in Redux:", fetchedBenefCode);
        }

        // Store names in localStorage for persistence
        if (data.first_name) {
          state.beneficiaryFirstName = data.first_name;
          localStorage.setItem("beneficiary_firstName", data.first_name);
        }
        if (data.last_name) {
          state.beneficiaryLastName = data.last_name;
          localStorage.setItem("beneficiary_lastName", data.last_name);
        }

        // ✅ IMPORTANT: Set beneficiaryProfile from the SAME data
        state.beneficiaryProfile = {
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          email: data.email,
          country_phone_code: data.country_phone_code,
          phone_number: data.phone_number,
          country_id: data.country_id,
          state: data.state,
          city: data.city,
          street: data.street,
          postalcode: data.postalcode,
          nationality_id: data.nationality_id,
          gender: data.gender,
          created_at: data.created_at,
          status: data.status,
          nationalityname: data.nationalityname,
          beneftype: data.beneftype,
        };
      })
      .addCase(fetchMerchantBeneficiary.rejected, (state, action) => {
        state.merchantLoading = false;
        state.merchantError = action.payload;
        state.fetchStatus.merchant = "failed";
      })

      // Location data
      .addCase(fetchLocationData.pending, (state) => {
        state.locationLoading = true;
        state.fetchStatus.location = "loading";
        state.locationError = null;
      })
      .addCase(fetchLocationData.fulfilled, (state, action) => {
        state.locationLoading = false;
        state.locationData = action.payload;
        state.fetchStatus.location = "succeeded";
        state.locationError = null;
      })
      .addCase(fetchLocationData.rejected, (state, action) => {
        state.locationLoading = false;
        state.locationError = action.payload;
        state.fetchStatus.location = "failed";
      })

      // Update beneficiary profile
      .addCase(updateBeneficiaryProfile.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateBeneficiaryProfile.fulfilled, (state, action) => {
        state.updating = false;

        // Update the merchant data with new values
        if (state.merchantData) {
          state.merchantData = {
            ...state.merchantData,
            ...action.payload,
          };
        }

        // Update beneficiary profile
        if (state.beneficiaryProfile) {
          state.beneficiaryProfile = {
            ...state.beneficiaryProfile,
            ...action.payload,
          };
        }

        state.updateError = null;

        // Update local storage names
        if (action.payload.first_name) {
          state.beneficiaryFirstName = action.payload.first_name;
          localStorage.setItem(
            "beneficiary_firstName",
            action.payload.first_name
          );
        }
        if (action.payload.last_name) {
          state.beneficiaryLastName = action.payload.last_name;
          localStorage.setItem(
            "beneficiary_lastName",
            action.payload.last_name
          );
        }

        // Clear verification states after successful update
        state.emailVerified = false;
        state.phoneVerified = false;
      })
      .addCase(updateBeneficiaryProfile.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      })

      // Combined fetch beneficiary data
      .addCase(fetchBeneficiaryData.pending, (state) => {
        state.merchantLoading = true;
        state.locationLoading = true;
      })
      .addCase(fetchBeneficiaryData.fulfilled, (state) => {
        state.merchantLoading = false;
        state.locationLoading = false;
      })
      .addCase(fetchBeneficiaryData.rejected, (state, action) => {
        state.merchantLoading = false;
        state.locationLoading = false;
        state.merchantError = action.payload;
        state.locationError = action.payload;
      })

      // Email verification
      .addCase(sendEmailPasscode.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
      })
      .addCase(sendEmailPasscode.fulfilled, (state) => {
        state.verificationLoading = false;
        state.emailVerificationSent = true;
        state.verificationError = null;
      })
      .addCase(sendEmailPasscode.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
      })

      .addCase(validateEmailPasscode.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
      })
      .addCase(validateEmailPasscode.fulfilled, (state) => {
        state.verificationLoading = false;
        state.emailVerified = true;
        state.verificationError = null;
      })
      .addCase(validateEmailPasscode.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
      })

      // Phone verification
      .addCase(sendPhoneOTP.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
      })
      .addCase(sendPhoneOTP.fulfilled, (state) => {
        state.verificationLoading = false;
        state.phoneVerificationSent = true;
        state.verificationError = null;
      })
      .addCase(sendPhoneOTP.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
      })

      .addCase(validatePhoneOTP.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
      })
      .addCase(validatePhoneOTP.fulfilled, (state) => {
        state.verificationLoading = false;
        state.phoneVerified = true;
        state.verificationError = null;
      })
      .addCase(validatePhoneOTP.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload;
      });
  },
});

// Selectors
export const selectBeneficiariesHeader = (state) => state.beneficiariesHeader;

export const selectIsDropdownOpen = (state) =>
  state.beneficiariesHeader.isDropdownOpen;
export const selectMerchantData = (state) =>
  state.beneficiariesHeader.merchantData;
export const selectMerchantLoading = (state) =>
  state.beneficiariesHeader.merchantLoading;
export const selectMerchantError = (state) =>
  state.beneficiariesHeader.merchantError;
export const selectBeneficiaryProfile = (state) => {
  const header = state.beneficiariesHeader;
  // Return stored profile or derive from merchantData
  return (
    header.beneficiaryProfile ||
    (header.merchantData
      ? {
          first_name: header.merchantData.first_name,
          middle_name: header.merchantData.middle_name,
          last_name: header.merchantData.last_name,
          email: header.merchantData.email,
          country_phone_code: header.merchantData.country_phone_code,
          phone_number: header.merchantData.phone_number,
          country_id: header.merchantData.country_id,
          state: header.merchantData.state,
          city: header.merchantData.city,
          street: header.merchantData.street,
          postalcode: header.merchantData.postalcode,
          nationality_id: header.merchantData.nationality_id,
          gender: header.merchantData.gender,
          created_at: header.merchantData.created_at,
          status: header.merchantData.status,
          nationalityname: header.merchantData.nationalityname,
          beneftype: header.merchantData.beneftype,
        }
      : null)
  );
};
export const selectLocationData = (state) =>
  state.beneficiariesHeader.locationData;
export const selectLocationLoading = (state) =>
  state.beneficiariesHeader.locationLoading;
export const selectLocationError = (state) =>
  state.beneficiariesHeader.locationError;

// Combined selectors for the component
export const selectBeneficiaryLoading = (state) =>
  state.beneficiariesHeader.merchantLoading ||
  state.beneficiariesHeader.locationLoading;

export const selectBeneficiaryError = (state) =>
  state.beneficiariesHeader.merchantError ||
  state.beneficiariesHeader.locationError;

export const selectUpdating = (state) => state.beneficiariesHeader.updating;
export const selectUpdateError = (state) =>
  state.beneficiariesHeader.updateError;

export const selectVerificationLoading = (state) =>
  state.beneficiariesHeader.verificationLoading;
export const selectVerificationError = (state) =>
  state.beneficiariesHeader.verificationError;
export const selectEmailVerified = (state) =>
  state.beneficiariesHeader.emailVerified;
export const selectPhoneVerified = (state) =>
  state.beneficiariesHeader.phoneVerified;

export const selectProfileLoading = (state) =>
  state.beneficiariesHeader.merchantLoading;

export const selectProfileError = (state) =>
  state.beneficiariesHeader.merchantError;

export const selectBenefCode = (state) => state.beneficiariesHeader.benefCode;

export const selectDisplayName = (state) => {
  const header = state.beneficiariesHeader;
  return (
    header.merchantData?.name ||
    header.beneficiaryProfile?.first_name ||
    header.beneficiaryFirstName ||
    "Beneficiary"
  );
};

export const selectBeneficiaryRole = (state) => {
  const header = state.beneficiariesHeader;
  return (
    header.merchantData?.beneftype ||
    (header.isStaffLogin === "1"
      ? header.staffRole
      : header.isOwnerLogin === "1"
      ? header.ownerRoleName
      : "Beneficiary")
  );
};

export const selectFetchStatus = (state) =>
  state.beneficiariesHeader.fetchStatus;

// Export all actions
export const {
  openDropdown,
  closeDropdown,
  updateLocalStorageState,
  clearBeneficiaryData,
  setBenefCode,
  clearUpdateError,
  clearVerificationStates,
  setBeneficiaryProfileFromMerchant,
  resetBeneficiaryHeader,
} = beneficiariesHeaderSlice.actions;

export default beneficiariesHeaderSlice.reducer;
