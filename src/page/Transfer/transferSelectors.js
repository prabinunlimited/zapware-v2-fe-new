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
  selectTransferState(state).selectedCurrency || '';

export const selectTransferAmount = (state) => 
  selectTransferState(state).transferAmount || '';

export const selectSelectedCountryCode = (state) => 
  selectTransferState(state).selectedCountryCode || '';

export const selectSearchQuery = (state) => 
  selectTransferState(state).searchQuery || '';

// Derived selectors
export const selectCurrencyOptions = (state) => {
  const accounts = selectCustomerBankAccounts(state);
  return accounts.map(account => ({
    value: account.currency_code,
    label: account.currency_code,
    account
  }));
};

export const selectFormErrors = (state) => {
  const errors = {};
  const selectedCurrency = selectSelectedCurrency(state);
  const transferAmount = selectTransferAmount(state);
  const selectedCountryCode = selectSelectedCountryCode(state);
  const searchQuery = selectSearchQuery(state);
  
  if (!selectedCurrency) errors.currency = "Currency is required.";
  if (!transferAmount || parseFloat(transferAmount) <= 0) errors.amount = "Amount must be greater than 0.";
  if (!selectedCountryCode) errors.mobile = "Country code is required.";
  if (!searchQuery || searchQuery.length < 6) errors.mobile = "Invalid phone number.";
  
  return errors;
};