// src/features/Transfer/transferSlice.js - REFACTORED WITH RTK QUERY PATTERN
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Data State
  customerBankAccounts: [], // ✅ ADD THIS LINE
  receiverDetails: null,
  transferLoading: false,
  transferError: null,
  transferSuccess: false,
  searchLoading: false,

  // UI State
  selectedCurrency: "",
  transferAmount: "",
  selectedCountryCode: "",
  searchQuery: "",
  hasUserInteracted: false,

  // Modal State
  showConfirmationModal: false,

  // Cache Status
  lastUpdated: null,
  hasFetchedAccounts: false,
};

const transferSlice = createSlice({
  name: "transfer",
  initialState,
  reducers: {
    // Data Actions
    setCustomerBankAccounts: (state, action) => {
      state.customerBankAccounts = action.payload;
    },

    setReceiverDetails: (state, action) => {
      state.receiverDetails = action.payload;
    },

    startTransferLoading: (state) => {
      state.transferLoading = true;
      state.transferError = null;
      state.transferSuccess = false;
    },

    setTransferSuccess: (state) => {
      state.transferLoading = false;
      state.transferSuccess = true;
      state.transferError = null;
    },

    setTransferError: (state, action) => {
      state.transferLoading = false;
      state.transferError = action.payload;
      state.transferSuccess = false;
    },

    startSearchLoading: (state) => {
      state.searchLoading = true;
    },

    stopSearchLoading: (state) => {
      state.searchLoading = false;
    },

    // UI Actions
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
      state.hasUserInteracted = true;
    },

    setTransferAmount: (state, action) => {
      state.transferAmount = action.payload;
      state.hasUserInteracted = true;
    },

    setSelectedCountryCode: (state, action) => {
      state.selectedCountryCode = action.payload;
      state.hasUserInteracted = true;
    },

    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.hasUserInteracted = true;
    },

    setFormInteraction: (state) => {
      state.hasUserInteracted = true;
    },

    // Modal Actions
    openConfirmationModal: (state) => {
      state.showConfirmationModal = true;
    },

    closeConfirmationModal: (state) => {
      state.showConfirmationModal = false;
    },

    // Cache Management
    setAccountsFetched: (state, action) => {
      state.hasFetchedAccounts = action.payload;
      if (action.payload) {
        state.lastUpdated = Date.now();
      }
    },

    clearReceiverDetails: (state) => {
      state.receiverDetails = null;
    },

    clearErrors: (state) => {
      state.transferError = null;
    },

    // Reset State
    clearTransferState: () => initialState,

    // Clear specific cache
    clearTransferCache: (state) => {
      state.hasFetchedAccounts = false;
      state.lastUpdated = null;
    },
  },
});

// Export all actions
export const {
  // Data Actions
  setCustomerBankAccounts, // ✅ EXPORT THIS
  setReceiverDetails,
  startTransferLoading,
  setTransferSuccess,
  setTransferError,
  startSearchLoading,
  stopSearchLoading,

  // UI Actions
  setSelectedCurrency,
  setTransferAmount,
  setSelectedCountryCode,
  setSearchQuery,
  setFormInteraction,

  // Modal Actions
  openConfirmationModal,
  closeConfirmationModal,

  // Cache Management
  setAccountsFetched,
  clearReceiverDetails,
  clearErrors,
  clearTransferState,
  clearTransferCache,
} = transferSlice.actions;

export default transferSlice.reducer;
