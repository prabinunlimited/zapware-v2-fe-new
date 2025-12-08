// src/features/Transfer/transferSlice.js - COMPLETE
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  transferLoading: false,
  transferError: null,
  transferSuccess: false,
  searchLoading: false,
  receiverDetails: null,
  customerBankAccounts: [],
  searchQuery: '',
  selectedCurrency: '',
  transferAmount: '',
  selectedCountryCode: '',
  // ✅ ADD: Track form interaction
  hasUserInteracted: false,
};

const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    // Start transfer loading
    startTransferLoading: (state) => {
      state.transferLoading = true;
      state.transferError = null;
      state.transferSuccess = false;
    },
    
    // Start search loading
    startSearchLoading: (state) => {
      state.searchLoading = true;
    },
    
    // Stop search loading
    stopSearchLoading: (state) => {
      state.searchLoading = false;
    },
    
    // Set transfer success
    setTransferSuccess: (state, action) => {
      state.transferLoading = false;
      state.transferSuccess = true;
      state.transferError = null;
    },
    
    // Set transfer error
    setTransferError: (state, action) => {
      state.transferLoading = false;
      state.transferError = action.payload;
      state.transferSuccess = false;
    },
    
    // Set receiver details
    setReceiverDetails: (state, action) => {
      state.receiverDetails = action.payload;
      state.searchLoading = false;
    },
    
    // Clear receiver details
    clearReceiverDetails: (state) => {
      state.receiverDetails = null;
    },
    
    // Set customer bank accounts
    setCustomerBankAccounts: (state, action) => {
      state.customerBankAccounts = action.payload;
    },
    
    // ✅ UPDATED: Set search query with interaction tracking
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.hasUserInteracted = true;
    },
    
    // ✅ UPDATED: Set selected currency with interaction tracking
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
      state.hasUserInteracted = true;
    },
    
    // ✅ UPDATED: Set transfer amount with interaction tracking
    setTransferAmount: (state, action) => {
      state.transferAmount = action.payload;
      state.hasUserInteracted = true;
    },
    
    // ✅ UPDATED: Set selected country code with interaction tracking
    setSelectedCountryCode: (state, action) => {
      state.selectedCountryCode = action.payload;
      state.hasUserInteracted = true;
    },
    
    // ✅ ADD: Explicit form interaction setter
    setFormInteraction: (state) => {
      state.hasUserInteracted = true;
    },
    
    // Clear transfer state
    clearTransferState: (state) => {
      return initialState;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.transferError = null;
    },
  },
});

export const {
  startTransferLoading,
  startSearchLoading,
  stopSearchLoading,
  setTransferSuccess,
  setTransferError,
  setReceiverDetails,
  clearReceiverDetails,
  setCustomerBankAccounts,
  setSearchQuery,
  setSelectedCurrency,
  setTransferAmount,
  setSelectedCountryCode,
  setFormInteraction,
  clearTransferState,
  clearErrors,
} = transferSlice.actions;

export default transferSlice.reducer;