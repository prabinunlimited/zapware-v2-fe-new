// src/components/Dashboard/NavigateSection/NavigateSectionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks using api.js
export const fetchCustomerProfile = createAsyncThunk(
  "navigateSection/fetchCustomerProfile",
  async (customerId, { rejectWithValue }) => {
    console.log(`📡 fetchCustomerProfile called for customer: ${customerId}`);

    try {
      const authtoken = localStorage.getItem("authtoken");

      if (!authtoken) {
        console.error("❌ No authentication token found");
        throw new Error("No authentication token found");
      }

      console.log(`🔑 Using auth token: ${authtoken.substring(0, 10)}...`);

      const response = await api.get(`/customers/${customerId}/profile`, {
        headers: {
          Authorization: `Bearer ${authtoken}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`📥 Customer profile response:`, response.data);

      if (response.data.status === "success") {
        console.log(`✅ Customer profile fetched successfully`);
        return response.data;
      } else {
        throw new Error("Failed to fetch profile - non-success status");
      }
    } catch (error) {
      console.error("❌ NavigateSection profile fetch error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchAllowedModules = createAsyncThunk(
  "navigateSection/fetchAllowedModules",
  async ({ partnerId, bearertoken }, { rejectWithValue }) => {
    console.log(`📡 fetchAllowedModules called with partnerId: ${partnerId}`);

    try {
      // Get the CURRENT partner ID from localStorage with fallbacks
      const currentPartnerId =
        localStorage.getItem("whitelabelledpartnerid") ||
        localStorage.getItem("whitelabelled_customer_partnerid") ||
        partnerId; // fallback to passed param

      console.log(
        `🎯 fetchAllowedModules: Using partner ID ${currentPartnerId} (was ${partnerId})`,
      );

      console.log(`🔑 Using bearer token: ${bearertoken?.substring(0, 10)}...`);

      const response = await api.get(
        `/partners/ourzap-modules/${currentPartnerId}`,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(`📥 Allowed modules response:`, response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Allowed modules fetch error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch allowed modules",
      );
    }
  },
);

export const downloadUserManual = createAsyncThunk(
  "navigateSection/downloadUserManual",
  async ({ partnerId, placement }, { rejectWithValue }) => {
    console.log(
      `📚 downloadUserManual called with partnerId: ${partnerId}, placement: ${placement}`,
    );

    try {
      const response = await api.post(
        `/get-manuals`,
        {
          partnerId: partnerId === undefined ? 0 : partnerId,
          placement,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log(`📥 User manual response:`, response.data);
      return response.data;
    } catch (error) {
      console.error("❌ User manual fetch error:", error);
      return rejectWithValue(error.message || "Failed to download user manual");
    }
  },
);

const navigateSectionSlice = createSlice({
  name: "navigateSection",
  initialState: {
    customerStatus: null,
    allowedModules: [],
    popupData: {
      show: false,
      message: "",
      onConfirm: null,
    },
    showPlaidLink: false,
    manualLoading: false,
    profileLoading: false,
    customerBankApprovedStatus: (() => {
      const stored = localStorage.getItem("bank_approve_status");
      console.log(
        `🏦 Initial bank approval status from localStorage: ${stored || "0"}`,
      );
      return stored || "0";
    })(),
    download_operation_manual: (() => {
      const stored = localStorage.getItem("download_operation_manual");
      console.log(
        `📘 Initial download operation manual from localStorage: ${stored || "N"}`,
      );
      return stored || "N";
    })(),
    isWhiteLabelledPartner: (() => {
      const stored = localStorage.getItem("iswhitelabelledpartner");
      console.log(
        `🏢 Initial white labelled partner from localStorage: ${stored || "N"}`,
      );
      return stored || "N";
    })(),
    whiteLabelledPartnerId: (() => {
      const stored = localStorage.getItem("whitelabelledpartnerid");
      console.log(
        `🆔 Initial white labelled partner ID from localStorage: ${stored || "0"}`,
      );
      return stored || "0";
    })(),
    hasFetchedProfile: false,
    hasFetchedModules: false,
    fetchError: null,
    modulesError: null,
    manualError: null,
  },
  reducers: {
    setPopupData: (state, action) => {
      console.log(`🪟 Setting popup data:`, action.payload);
      state.popupData = { ...state.popupData, ...action.payload };
    },
    clearPopupData: (state) => {
      console.log(`🪟 Clearing popup data`);
      state.popupData = { show: false, message: "", onConfirm: null };
    },
    setPlaidLinkVisibility: (state, action) => {
      console.log(`🔗 Setting Plaid link visibility: ${action.payload}`);
      state.showPlaidLink = action.payload;
    },
    resetManualDownload: (state) => {
      console.log(`🔄 Resetting manual download state`);
      state.manualLoading = false;
      state.manualError = null;
    },
    resetNavigateSection: (state) => {
      console.log(`🔄 Resetting entire navigate section state`);
      state.customerStatus = null;
      state.allowedModules = [];
      state.popupData = { show: false, message: "", onConfirm: null };
      state.showPlaidLink = false;
      state.manualLoading = false;
      state.profileLoading = false;
      state.hasFetchedProfile = false;
      state.hasFetchedModules = false;
      state.fetchError = null;
      state.modulesError = null;
      state.manualError = null;
    },
    setHasFetchedProfile: (state, action) => {
      console.log(`👤 Setting hasFetchedProfile: ${action.payload}`);
      state.hasFetchedProfile = action.payload;
    },
    setHasFetchedModules: (state, action) => {
      console.log(`📦 Setting hasFetchedModules: ${action.payload}`);
      state.hasFetchedModules = action.payload;
    },
    updateLocalStorageState: (state) => {
      console.log(`🔄 Updating state from localStorage`);

      const bankStatus = localStorage.getItem("bank_approve_status") || "0";
      const downloadManual =
        localStorage.getItem("download_operation_manual") || "N";
      const isWhiteLabelled =
        localStorage.getItem("iswhitelabelledpartner") || "N";
      const partnerId = localStorage.getItem("whitelabelledpartnerid") || "0";

      console.log(`🏦 Bank approval status: ${bankStatus}`);
      console.log(`📘 Download manual: ${downloadManual}`);
      console.log(`🏢 White labelled: ${isWhiteLabelled}`);
      console.log(`🆔 Partner ID: ${partnerId}`);

      state.customerBankApprovedStatus = bankStatus;
      state.download_operation_manual = downloadManual;
      state.isWhiteLabelledPartner = isWhiteLabelled;
      state.whiteLabelledPartnerId = partnerId;
    },
    clearFetchError: (state) => {
      console.log(`🧹 Clearing fetch error`);
      state.fetchError = null;
    },
    clearModulesError: (state) => {
      console.log(`🧹 Clearing modules error`);
      state.modulesError = null;
    },
    clearManualError: (state) => {
      console.log(`🧹 Clearing manual error`);
      state.manualError = null;
    },
    setAllowedModules: (state, action) => {
      console.log(`📦 Manually setting allowed modules:`, action.payload);
      state.allowedModules = action.payload;
    },
    setCustomerStatus: (state, action) => {
      console.log(`👤 Manually setting customer status: ${action.payload}`);
      state.customerStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch customer profile
      .addCase(fetchCustomerProfile.pending, (state) => {
        console.log(`⏳ Fetching customer profile...`);
        state.profileLoading = true;
        state.fetchError = null;
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        console.log(`✅ Customer profile fetched successfully`);
        state.profileLoading = false;
        state.hasFetchedProfile = true;
        state.fetchError = null;

        if (action.payload.status === "success" && action.payload.profile) {
          const activeStatus = action.payload.profile.active_status;
          // ✅ Check both possible field names
          const bankStatus =
            action.payload.bank_account_approved_status ||
            action.payload.profile.bank_approve_status ||
            action.payload.profile.bank_account_approved_status ||
            "0";

          console.log(`👤 Customer status: ${activeStatus}`);
          console.log(`🏦 Bank approval status from API: ${bankStatus}`);

          state.customerStatus = activeStatus;

          if (bankStatus) {
            localStorage.setItem("bank_approve_status", bankStatus);
            state.customerBankApprovedStatus = bankStatus;
            console.log(
              `💾 Saved bank approval status to localStorage: ${bankStatus}`,
            );
          }
        }
      })
      .addCase(fetchCustomerProfile.rejected, (state, action) => {
        console.error(`❌ Customer profile fetch failed:`, action.payload);
        state.profileLoading = false;
        state.hasFetchedProfile = false;
        state.fetchError = action.payload || "Failed to fetch customer profile";
      })

      // Fetch allowed modules
      .addCase(fetchAllowedModules.pending, (state) => {
        console.log(`⏳ Fetching allowed modules...`);
        state.profileLoading = true;
        state.modulesError = null;
      })
      .addCase(fetchAllowedModules.fulfilled, (state, action) => {
        console.log(`✅ Allowed modules fetched successfully`);
        state.profileLoading = false;
        state.hasFetchedModules = true;
        state.modulesError = null;

        if (action.payload.status === "success") {
          const modules = action.payload.data || [];
          console.log(
            `📦 Received ${modules.length} modules:`,
            modules.map((m) => m.module_name).join(", "),
          );
          state.allowedModules = modules;
        } else {
          console.warn(
            `⚠️ Modules fetch returned non-success status:`,
            action.payload.status,
          );
          state.allowedModules = [];
        }
      })
      .addCase(fetchAllowedModules.rejected, (state, action) => {
        console.error(`❌ Allowed modules fetch failed:`, action.payload);
        state.profileLoading = false;
        state.hasFetchedModules = false;
        state.modulesError =
          action.payload || "Failed to fetch allowed modules";
      })

      // Download user manual
      .addCase(downloadUserManual.pending, (state) => {
        console.log(`⏳ Downloading user manual...`);
        state.manualLoading = true;
        state.manualError = null;
      })
      .addCase(downloadUserManual.fulfilled, (state, action) => {
        console.log(`✅ User manual download completed`);
        state.manualLoading = false;
        state.manualError = null;

        if (
          action.payload.status === "success" &&
          action.payload.data?.file_path
        ) {
          console.log(
            `📄 User manual available at:`,
            action.payload.data.file_path,
          );
        }
      })
      .addCase(downloadUserManual.rejected, (state, action) => {
        console.error(`❌ User manual download failed:`, action.payload);
        state.manualLoading = false;
        state.manualError = action.payload || "Failed to download user manual";
      });
  },
});

export const {
  setPopupData,
  clearPopupData,
  setPlaidLinkVisibility,
  resetManualDownload,
  resetNavigateSection,
  setHasFetchedProfile,
  setHasFetchedModules,
  updateLocalStorageState,
  clearFetchError,
  clearModulesError,
  clearManualError,
  setAllowedModules,
  setCustomerStatus,
} = navigateSectionSlice.actions;

// Selectors
export const selectCustomerStatus = (state) => {
  const status = state.navigateSection?.customerStatus;
  console.log(`🔍 Selector - customerStatus: ${status}`);
  return status;
};

export const selectAllowedModules = (state) => {
  const modules = state.navigateSection?.allowedModules || [];
  console.log(`🔍 Selector - allowedModules: ${modules.length} modules`);
  return modules;
};

export const selectPopupData = (state) => {
  const popupData = state.navigateSection?.popupData || {
    show: false,
    message: "",
    onConfirm: null,
  };
  return popupData;
};

export const selectShowPlaidLink = (state) => {
  return state.navigateSection?.showPlaidLink || false;
};

export const selectManualLoading = (state) => {
  return state.navigateSection?.manualLoading || false;
};

export const selectProfileLoading = (state) => {
  return state.navigateSection?.profileLoading || false;
};

export const selectCustomerBankApprovedStatus = (state) => {
  const status = state.navigateSection?.customerBankApprovedStatus || "0";
  return status;
};

export const selectDownloadOperationManual = (state) => {
  return state.navigateSection?.download_operation_manual || "N";
};

export const selectIsWhiteLabelledPartner = (state) => {
  return state.navigateSection?.isWhiteLabelledPartner || "N";
};

export const selectWhiteLabelledPartnerId = (state) => {
  return state.navigateSection?.whiteLabelledPartnerId || "0";
};

export const selectHasFetchedProfile = (state) => {
  return state.navigateSection?.hasFetchedProfile || false;
};

export const selectHasFetchedModules = (state) => {
  return state.navigateSection?.hasFetchedModules || false;
};

export const selectFetchError = (state) => {
  return state.navigateSection?.fetchError || null;
};

export const selectModulesError = (state) => {
  return state.navigateSection?.modulesError || null;
};

export const selectManualError = (state) => {
  return state.navigateSection?.manualError || null;
};

// Combined loading selector
export const selectIsLoading = (state) => {
  return (
    state.navigateSection?.profileLoading ||
    state.navigateSection?.manualLoading ||
    false
  );
};

// Combined error selector
export const selectAnyError = (state) => {
  return (
    state.navigateSection?.fetchError ||
    state.navigateSection?.modulesError ||
    state.navigateSection?.manualError ||
    null
  );
};

export default navigateSectionSlice.reducer;
