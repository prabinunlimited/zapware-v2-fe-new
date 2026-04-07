// src/features/Transfer/transferSelectors.js - COMPLETE WITH ALL SELECTORS
export const selectTransferState = (state) => state.transfer || {};

// Data Selectors
export const selectCustomerBankAccounts = (state) =>
  selectTransferState(state).customerBankAccounts || [];

export const selectReceiverDetails = (state) =>
  selectTransferState(state).receiverDetails;

export const selectTransferLoading = (state) =>
  selectTransferState(state).transferLoading || false;

export const selectTransferError = (state) =>
  selectTransferState(state).transferError;

export const selectTransferSuccess = (state) =>
  selectTransferState(state).transferSuccess || false;

export const selectSearchLoading = (state) =>
  selectTransferState(state).searchLoading || false;

// UI Selectors
export const selectSelectedCurrency = (state) =>
  selectTransferState(state).selectedCurrency || "";

export const selectTransferAmount = (state) =>
  selectTransferState(state).transferAmount || "";

export const selectSelectedCountryCode = (state) =>
  selectTransferState(state).selectedCountryCode || "";

export const selectSearchQuery = (state) =>
  selectTransferState(state).searchQuery || "";

export const selectHasUserInteracted = (state) =>
  selectTransferState(state).hasUserInteracted || false;

export const selectShowConfirmationModal = (state) =>
  selectTransferState(state).showConfirmationModal || false;

// Cache Selectors
export const selectHasFetchedAccounts = (state) =>
  selectTransferState(state).hasFetchedAccounts || false;

export const selectLastUpdated = (state) =>
  selectTransferState(state).lastUpdated;

// Derived Selectors
export const selectCurrencyOptions = (state) => {
  const accounts = selectCustomerBankAccounts(state);
  return accounts.map((account) => ({
    value: account.currency_code,
    label: `${account.currency_code} - ${account.serviceprovidername}`,
    account,
  }));
};

export const selectSelectedBankId = (state) => {
  const selectedCurrency = selectSelectedCurrency(state);
  const accounts = selectCustomerBankAccounts(state);

  const selectedAccount = accounts.find(
    (account) => account.currency_code === selectedCurrency,
  );

  return selectedAccount?.id || null;
};

export const selectSelectedAccount = (state) => {
  const selectedCurrency = selectSelectedCurrency(state);
  const accounts = selectCustomerBankAccounts(state);

  return (
    accounts.find((account) => account.currency_code === selectedCurrency) ||
    null
  );
};

// Smart form errors with contextual validation
export const selectFormErrors = (state) => {
  const errors = {};

  const selectedCurrency = selectSelectedCurrency(state);
  const transferAmount = selectTransferAmount(state);
  const selectedCountryCode = selectSelectedCountryCode(state);
  const searchQuery = selectSearchQuery(state);
  const hasUserInteracted = selectHasUserInteracted(state);

  if (!hasUserInteracted) {
    return {};
  }

  // Currency Validation
  const hasAmountOrSearchIntent = transferAmount || searchQuery;
  if (!selectedCurrency && hasAmountOrSearchIntent) {
    errors.currency = "Please select a currency to continue";
  }

  // Amount Validation
  if (selectedCurrency) {
    if (!transferAmount) {
      errors.amount = "Please enter an amount";
    } else if (
      isNaN(parseFloat(transferAmount)) ||
      parseFloat(transferAmount) <= 0
    ) {
      errors.amount = "Amount must be greater than 0";
    } else if (parseFloat(transferAmount) > 1000000) {
      errors.amount = "Amount cannot exceed 1,000,000";
    }
  }

  // Mobile Validation
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

// Helper selector to check if form is ready for search
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

// Helper selector to check if transfer can be confirmed
export const selectIsTransferReady = (state) => {
  const receiverDetails = selectReceiverDetails(state);
  const isFormReady = selectIsFormReadyForSearch(state);

  return isFormReady && receiverDetails;
};

// Helper selector to get formatted transfer data for API
export const selectTransferData = (state) => {
  const selectedCurrency = selectSelectedCurrency(state);
  const transferAmount = selectTransferAmount(state);
  const receiverDetails = selectReceiverDetails(state);
  const selectedAccount = selectSelectedAccount(state);

  if (
    !selectedCurrency ||
    !transferAmount ||
    !receiverDetails ||
    !selectedAccount
  ) {
    return null;
  }

  return {
    currency: selectedCurrency,
    amount: parseFloat(transferAmount),
    bank_id: selectedAccount.id,
    receiver_customer_id: receiverDetails.id,
  };
};

// Helper selector to get accounts count
export const selectAccountsCount = (state) => {
  const accounts = selectCustomerBankAccounts(state);
  return accounts.length;
};

// Helper selector to get approved accounts only
export const selectApprovedAccounts = (state) => {
  const accounts = selectCustomerBankAccounts(state);
  return accounts.filter((account) => account.approved_status === "Approved");
};

// Helper selector to check if selected account is approved
export const selectIsSelectedAccountApproved = (state) => {
  const selectedAccount = selectSelectedAccount(state);
  return selectedAccount?.approved_status === "Approved";
};

// Helper selector to get available currencies (unique)
export const selectAvailableCurrencies = (state) => {
  const accounts = selectCustomerBankAccounts(state);
  const currencies = new Set();
  accounts.forEach((account) => currencies.add(account.currency_code));
  return Array.from(currencies).sort();
};

// Helper selector to validate if transfer amount is valid
export const selectIsAmountValidForTransfer = (state) => {
  const transferAmount = selectTransferAmount(state);
  const amount = parseFloat(transferAmount);

  if (!transferAmount || isNaN(amount) || amount <= 0) {
    return false;
  }

  if (amount < 1) {
    return false;
  }

  return true;
};

// Helper selector to check if all required fields are filled
export const selectAreRequiredFieldsFilled = (state) => {
  const selectedCurrency = selectSelectedCurrency(state);
  const transferAmount = selectTransferAmount(state);
  const selectedCountryCode = selectSelectedCountryCode(state);
  const searchQuery = selectSearchQuery(state);

  return (
    !!selectedCurrency &&
    !!transferAmount &&
    !!selectedCountryCode &&
    !!searchQuery
  );
};

// Helper selector to check if form has any validation errors
export const selectHasFormErrors = (state) => {
  const errors = selectFormErrors(state);
  return Object.keys(errors).length > 0;
};

// Helper selector to get error messages as array
export const selectFormErrorMessages = (state) => {
  const errors = selectFormErrors(state);
  return Object.values(errors);
};
