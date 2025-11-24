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
    
    // Set search query
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    // Set selected currency
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
    },
    
    // Set transfer amount
    setTransferAmount: (state, action) => {
      state.transferAmount = action.payload;
    },
    
    // Set selected country code
    setSelectedCountryCode: (state, action) => {
      state.selectedCountryCode = action.payload;
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
  clearTransferState,
  clearErrors,
} = transferSlice.actions;

export default transferSlice.reducer;