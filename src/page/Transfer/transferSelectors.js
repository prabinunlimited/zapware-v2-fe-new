// src/features/Transfer/transferSelectors.js - COMPLETE
export const selectTransferState = (state) => state.transfer || {};

export const selectCustomerBankAccounts = (state) =>
  selectTransferState(state).customerBankAccounts || [];

export const selectTransferLoading = (state) =>
  selectTransferState(state).transferLoading || false;

export const selectTransferError = (state) =>
  selectTransferState(state).transferError;

export const selectTransferSuccess = (state) =>
  selectTransferState(state).transferSuccess || false;

export const selectSearchLoading = (state) =>
  selectTransferState(state).searchLoading || false;

export const selectReceiverDetails = (state) =>
  selectTransferState(state).receiverDetails;

export const selectSelectedCurrency = (state) =>
  selectTransferState(state).selectedCurrency || "";

export const selectTransferAmount = (state) =>
  selectTransferState(state).transferAmount || "";

export const selectSelectedCountryCode = (state) =>
  selectTransferState(state).selectedCountryCode || "";

export const selectSearchQuery = (state) =>
  selectTransferState(state).searchQuery || "";

// ✅ ADD: Selector for interaction state
export const selectHasUserInteracted = (state) =>
  selectTransferState(state).hasUserInteracted || false;

// Derived selectors
export const selectCurrencyOptions = (state) => {
  const accounts = selectCustomerBankAccounts(state);
  return accounts.map((account) => ({
    value: account.currency_code,
    label: account.currency_code,
    account,
  }));
};

// ✅ IMPROVED: Smart form errors with contextual validation
export const selectFormErrors = (state) => {
  const errors = {};
  
  // Get all relevant state
  const selectedCurrency = selectSelectedCurrency(state);
  const transferAmount = selectTransferAmount(state);
  const selectedCountryCode = selectSelectedCountryCode(state);
  const searchQuery = selectSearchQuery(state);
  const hasUserInteracted = selectHasUserInteracted(state);
  
  // ✅ CRITICAL FIX: Only validate after user interaction
  if (!hasUserInteracted) {
    return {};
  }

  // 🎯 SMART VALIDATION RULES:
  
  // 1. Currency Validation
  // Only show currency error if:
  // - User has entered an amount OR started receiver search
  // - But hasn't selected a currency
  const hasAmountOrSearchIntent = transferAmount || searchQuery;
  if (!selectedCurrency && hasAmountOrSearchIntent) {
    errors.currency = "Please select a currency to continue";
  }

  // 2. Amount Validation  
  // Only show amount error if:
  // - User has selected a currency (showing they intend to transfer)
  // - But amount is invalid
  if (selectedCurrency) {
    if (!transferAmount) {
      errors.amount = "Please enter an amount";
    } else if (isNaN(parseFloat(transferAmount)) || parseFloat(transferAmount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (parseFloat(transferAmount) > 1000000) {
      errors.amount = "Amount cannot exceed 1,000,000";
    }
  }

  // 3. Mobile Validation
  // Only show mobile errors if:
  // - User has started entering phone number OR selected country code
  const hasMobileIntent = searchQuery || selectedCountryCode;
  if (hasMobileIntent) {
    if (!selectedCountryCode) {
      errors.mobile = "Please select a country code";
    } else if (!searchQuery) {
      errors.mobile = "Please enter a phone number";
    } else if (searchQuery.length < 6) {
      errors.mobile = "Phone number must be at least 6 digits";
    } else if (!/^\d+$/.test(searchQuery)) {
      errors.mobile = "Phone number can only contain digits";
    }
  }

  return errors;
};

// ✅ ADD: Helper selector to check if form is ready for search
export const selectIsFormReadyForSearch = (state) => {
  const selectedCurrency = selectSelectedCurrency(state);
  const transferAmount = selectTransferAmount(state);
  const selectedCountryCode = selectSelectedCountryCode(state);
  const searchQuery = selectSearchQuery(state);
  const errors = selectFormErrors(state);
  
  return (
    selectedCurrency &&
    transferAmount &&
    parseFloat(transferAmount) > 0 &&
    selectedCountryCode &&
    searchQuery &&
    searchQuery.length >= 6 &&
    Object.keys(errors).length === 0
  );
};

// ✅ ADD: Helper selector to check if transfer can be confirmed
export const selectIsTransferReady = (state) => {
  const receiverDetails = selectReceiverDetails(state);
  const isFormReady = selectIsFormReadyForSearch(state);
  
  return isFormReady && receiverDetails;
};