// src/features/NavigateSection/navigateSectionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks
export const fetchCustomerProfile = createAsyncThunk(
  'navigateSection/fetchCustomerProfile',
  async (customerId) => {
    const response = await fetch(`${API_URL}/customers/${customerId}/profile`);
    if (!response.ok) {
      throw new Error('Failed to fetch customer profile');
    }
    const data = await response.json();
    return data;
  }
);

export const fetchAllowedModules = createAsyncThunk(
  'navigateSection/fetchAllowedModules',
  async ({ partnerId, bearertoken }) => {
    const response = await fetch(`${API_URL}/partners/ourzap-modules/${partnerId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearertoken}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch allowed modules');
    }
    const data = await response.json();
    return data;
  }
);

export const downloadUserManual = createAsyncThunk(
  'navigateSection/downloadUserManual',
  async ({ partnerId, placement }) => {
    const response = await fetch(`${API_URL}/get-manuals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        partnerId: partnerId === undefined ? 0 : partnerId,
        placement,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch user manual metadata.");
    }
    
    const data = await response.json();
    return data;
  }
);

const navigateSectionSlice = createSlice({
  name: 'navigateSection',
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
    customerBankApprovedStatus: localStorage.getItem("bank_approve_status") || "0",
    download_operation_manual: localStorage.getItem("download_operation_manual") || "N",
    isWhiteLabelledPartner: localStorage.getItem("iswhitelabelledpartner") || "N",
    whiteLabelledPartnerId: localStorage.getItem("whitelabelledpartnerid") || "0",
    hasFetchedProfile: false,
    hasFetchedModules: false,
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
    },
    setHasFetchedProfile: (state, action) => {
      state.hasFetchedProfile = action.payload;
    },
    setHasFetchedModules: (state, action) => {
      state.hasFetchedModules = action.payload;
    },
    updateLocalStorageState: (state) => {
      state.customerBankApprovedStatus = localStorage.getItem("bank_approve_status") || "0";
      state.download_operation_manual = localStorage.getItem("download_operation_manual") || "N";
      state.isWhiteLabelledPartner = localStorage.getItem("iswhitelabelledpartner") || "N";
      state.whiteLabelledPartnerId = localStorage.getItem("whitelabelledpartnerid") || "0";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch customer profile
      .addCase(fetchCustomerProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.hasFetchedProfile = true;
        if (action.payload.status === "success" && action.payload.profile) {
          state.customerStatus = action.payload.profile.active_status;
        }
      })
      .addCase(fetchCustomerProfile.rejected, (state) => {
        state.profileLoading = false;
        state.hasFetchedProfile = false;
      })
      // Fetch allowed modules
      .addCase(fetchAllowedModules.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchAllowedModules.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.hasFetchedModules = true;
        if (action.payload.status === "success") {
          state.allowedModules = action.payload.data || [];
        }
      })
      .addCase(fetchAllowedModules.rejected, (state) => {
        state.profileLoading = false;
        state.hasFetchedModules = false;
      })
      // Download user manual
      .addCase(downloadUserManual.pending, (state) => {
        state.manualLoading = true;
      })
      .addCase(downloadUserManual.fulfilled, (state, action) => {
        state.manualLoading = false;
      })
      .addCase(downloadUserManual.rejected, (state) => {
        state.manualLoading = false;
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
} = navigateSectionSlice.actions;

// Selectors
export const selectCustomerStatus = (state) => state.navigateSection.customerStatus;
export const selectAllowedModules = (state) => state.navigateSection.allowedModules;
export const selectPopupData = (state) => state.navigateSection.popupData;
export const selectShowPlaidLink = (state) => state.navigateSection.showPlaidLink;
export const selectManualLoading = (state) => state.navigateSection.manualLoading;
export const selectProfileLoading = (state) => state.navigateSection.profileLoading;
export const selectCustomerBankApprovedStatus = (state) => state.navigateSection.customerBankApprovedStatus;
export const selectDownloadOperationManual = (state) => state.navigateSection.download_operation_manual;
export const selectIsWhiteLabelledPartner = (state) => state.navigateSection.isWhiteLabelledPartner;
export const selectWhiteLabelledPartnerId = (state) => state.navigateSection.whiteLabelledPartnerId;
export const selectHasFetchedProfile = (state) => state.navigateSection.hasFetchedProfile;
export const selectHasFetchedModules = (state) => state.navigateSection.hasFetchedModules;

export default navigateSectionSlice.reducer;