// src/components/Dashboard/NavigateSection/navigateSectionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks using api.js
export const fetchCustomerProfile = createAsyncThunk(
  "navigateSection/fetchCustomerProfile",
  async (customerId, { rejectWithValue }) => {
    const stack = new Error().stack;
    const stackLines = stack.split("\n");
    const relevantCallers = stackLines
      .slice(2, 6)
      .filter((line) => line.includes("at"))
      .map((line) => line.trim());

    relevantCallers.forEach((caller) => {
      console.log("   ", caller);
    });

    try {
      const authtoken = localStorage.getItem("authtoken");

      if (!authtoken) {
        throw new Error("No authentication token found");
      }

      // ✅ USING api.js INSTEAD OF fetch
      const response = await api.get(`/customers/${customerId}/profile`, {
        headers: {
          Authorization: `Bearer ${authtoken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        return response.data;
      } else {
        throw new Error("Failed to fetch profile - non-success status");
      }
    } catch (error) {
      console.error("❌ NavigateSection profile fetch error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAllowedModules = createAsyncThunk(
  "navigateSection/fetchAllowedModules",
  async ({ partnerId, bearertoken }, { rejectWithValue }) => {
    try {
      // ⭐⭐⭐ CRITICAL FIX: Use the CURRENT partner ID from localStorage ⭐⭐⭐
      const currentPartnerId =
        localStorage.getItem("whitelabelledpartnerid") ||
        localStorage.getItem("whitelabelled_customer_partnerid") ||
        partnerId; // fallback to passed param

      console.log(
        `🎯 fetchAllowedModules: Using partner ID ${currentPartnerId} (was ${partnerId})`
      );

      const response = await api.get(
        `/partners/ourzap-modules/${currentPartnerId}`, // <-- USING CURRENT partnerId
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("❌ Allowed modules fetch error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const downloadUserManual = createAsyncThunk(
  "navigateSection/downloadUserManual",
  async ({ partnerId, placement }, { rejectWithValue }) => {
    try {
      // ✅ USING api.js INSTEAD OF fetch
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
        }
      );

      return response.data;
    } catch (error) {
      console.error("❌ User manual fetch error:", error);
      return rejectWithValue(error.message);
    }
  }
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
    customerBankApprovedStatus:
      localStorage.getItem("bank_approve_status") || "0",
    download_operation_manual:
      localStorage.getItem("download_operation_manual") || "N",
    isWhiteLabelledPartner:
      localStorage.getItem("iswhitelabelledpartner") || "N",
    whiteLabelledPartnerId:
      localStorage.getItem("whitelabelledpartnerid") || "0",
    hasFetchedProfile: false,
    hasFetchedModules: false,
    fetchError: null,
    modulesError: null,
    manualError: null,
  },
  reducers: {
    setPopupData: (state, action) => {
      state.popupData = { ...state.popupData, ...action.payload };
    },
    clearPopupData: (state) => {
      state.popupData = { show: false, message: "", onConfirm: null };
    },
    setPlaidLinkVisibility: (state, action) => {
      state.showPlaidLink = action.payload;
    },
    resetManualDownload: (state) => {
      state.manualLoading = false;
      state.manualError = null;
    },
    resetNavigateSection: (state) => {
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
      state.hasFetchedProfile = action.payload;
    },
    setHasFetchedModules: (state, action) => {
      state.hasFetchedModules = action.payload;
    },
    updateLocalStorageState: (state) => {
      state.customerBankApprovedStatus =
        localStorage.getItem("bank_approve_status") || "0";
      state.download_operation_manual =
        localStorage.getItem("download_operation_manual") || "N";
      state.isWhiteLabelledPartner =
        localStorage.getItem("iswhitelabelledpartner") || "N";
      state.whiteLabelledPartnerId =
        localStorage.getItem("whitelabelledpartnerid") || "0";
    },
    clearFetchError: (state) => {
      state.fetchError = null;
    },
    clearModulesError: (state) => {
      state.modulesError = null;
    },
    clearManualError: (state) => {
      state.manualError = null;
    },
    setAllowedModules: (state, action) => {
      state.allowedModules = action.payload;
    },
    setCustomerStatus: (state, action) => {
      state.customerStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch customer profile
      .addCase(fetchCustomerProfile.pending, (state) => {
        state.profileLoading = true;
        state.fetchError = null;
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.hasFetchedProfile = true;
        state.fetchError = null;

        if (action.payload.status === "success" && action.payload.profile) {
          state.customerStatus = action.payload.profile.active_status;
          // Update localStorage if needed
          if (action.payload.profile.bank_approve_status) {
            localStorage.setItem(
              "bank_approve_status",
              action.payload.profile.bank_approve_status
            );
            state.customerBankApprovedStatus =
              action.payload.profile.bank_approve_status;
          }
        }
      })
      .addCase(fetchCustomerProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.hasFetchedProfile = false;
        state.fetchError = action.payload || "Failed to fetch customer profile";
      })
      // Fetch allowed modules
      .addCase(fetchAllowedModules.pending, (state) => {
        state.profileLoading = true;
        state.modulesError = null;
      })
      .addCase(fetchAllowedModules.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.hasFetchedModules = true;
        state.modulesError = null;

        if (action.payload.status === "success") {
          state.allowedModules = action.payload.data || [];
        }
      })
      .addCase(fetchAllowedModules.rejected, (state, action) => {
        state.profileLoading = false;
        state.hasFetchedModules = false;
        state.modulesError =
          action.payload || "Failed to fetch allowed modules";
      })
      // Download user manual
      .addCase(downloadUserManual.pending, (state) => {
        state.manualLoading = true;
        state.manualError = null;
      })
      .addCase(downloadUserManual.fulfilled, (state, action) => {
        state.manualLoading = false;
        state.manualError = null;

        // Handle the manual download response
        if (
          action.payload.status === "success" &&
          action.payload.data?.file_path
        ) {
          // The file path is available for download
          console.log(
            "User manual available at:",
            action.payload.data.file_path
          );
        }
      })
      .addCase(downloadUserManual.rejected, (state, action) => {
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
export const selectCustomerStatus = (state) =>
  state.navigateSection.customerStatus;
export const selectAllowedModules = (state) =>
  state.navigateSection.allowedModules;
export const selectPopupData = (state) => state.navigateSection.popupData;
export const selectShowPlaidLink = (state) =>
  state.navigateSection.showPlaidLink;
export const selectManualLoading = (state) =>
  state.navigateSection.manualLoading;
export const selectProfileLoading = (state) =>
  state.navigateSection.profileLoading;
export const selectCustomerBankApprovedStatus = (state) =>
  state.navigateSection.customerBankApprovedStatus;
export const selectDownloadOperationManual = (state) =>
  state.navigateSection.download_operation_manual;
export const selectIsWhiteLabelledPartner = (state) =>
  state.navigateSection.isWhiteLabelledPartner;
export const selectWhiteLabelledPartnerId = (state) =>
  state.navigateSection.whiteLabelledPartnerId;
export const selectHasFetchedProfile = (state) =>
  state.navigateSection.hasFetchedProfile;
export const selectHasFetchedModules = (state) =>
  state.navigateSection.hasFetchedModules;
export const selectFetchError = (state) => state.navigateSection.fetchError;
export const selectModulesError = (state) => state.navigateSection.modulesError;
export const selectManualError = (state) => state.navigateSection.manualError;

// Combined loading selector
export const selectIsLoading = (state) =>
  state.navigateSection.profileLoading || state.navigateSection.manualLoading;

// Combined error selector
export const selectAnyError = (state) =>
  state.navigateSection.fetchError ||
  state.navigateSection.modulesError ||
  state.navigateSection.manualError;

export default navigateSectionSlice.reducer;
