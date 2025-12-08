// features/currencyAccounts/currencyAccountsSelectors.js
import { createSelector } from '@reduxjs/toolkit';

export const selectAccountOptions = (state) =>
  state.currencyAccounts.accountOptions;
export const selectNamedAccounts = (state) =>
  state.currencyAccounts.namedAccounts;
export const selectPooledAccounts = (state) =>
  state.currencyAccounts.pooledAccounts;
export const selectUcaDescription = (state) =>
  state.currencyAccounts.ucaDescription;
export const selectSelectedAccounts = (state) =>
  state.currencyAccounts.selectedAccounts;
export const selectReferralCode = (state) =>
  state.currencyAccounts.referralCode;
export const selectReferralError = (state) =>
  state.currencyAccounts.referralError;
export const selectLoading = (state) => state.currencyAccounts.loading;
export const selectTermsText = (state) => state.currencyAccounts.termsText;
export const selectTermsAccepted = (state) =>
  state.currencyAccounts.termsAccepted;
export const selectApiError = (state) => state.currencyAccounts.apiError;
export const selectTermsContent = (state) =>
  state.currencyAccounts.termsContent;
export const selectSearchTerm = (state) => state.currencyAccounts.searchTerm;
export const selectFilteredNamedAccounts = (state) =>
  state.currencyAccounts.filteredNamedAccounts;
export const selectFilteredPooledAccounts = (state) =>
  state.currencyAccounts.filteredPooledAccounts;
export const selectActiveTab = (state) => state.currencyAccounts.activeTab;
export const selectRemittanceOnlyAccepted = (state) =>
  state.currencyAccounts.remittanceOnlyAccepted;
export const selectTermsModalOpen = (state) =>
  state.currencyAccounts.termsModalOpen;

export const selectIsNamedAccount = createSelector(
  [selectSelectedAccounts, selectAccountOptions],
  (selectedAccounts, accountOptions) => {

    if (!selectedAccounts || selectedAccounts.length === 0) {
      return false;
    }

    // Convert selected accounts to strings for easier checking
    const selectedAccountStrings = selectedAccounts.map((account) =>
      typeof account === 'string' ? account : account.id || account.toString()
    );


    // Check if any selected account contains "named"
    const hasNamedAccount = selectedAccountStrings.some((accountStr) => {
      const isNamed = accountStr.includes('named');
      return isNamed;
    });

    return hasNamedAccount;
  }
);