// features/currencyAccounts/currencyAccountsSelectors.js
import { createSelector } from "@reduxjs/toolkit";

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

export const selectAgentCode = (state) => state.currencyAccounts.agentCode;
export const selectAgentError = (state) => state.currencyAccounts.agentError;

// New selectors for validation states
export const selectIsReferralValidating = (state) =>
  state.currencyAccounts.isReferralValidating;
export const selectIsAgentValidating = (state) =>
  state.currencyAccounts.isAgentValidating;
export const selectValidationMessage = (state) =>
  state.currencyAccounts.validationMessage;

// ========== UPDATED SELECTOR ==========
// Selector to check if user has selected USD Named Accounts
export const selectIsNamedAccount = createSelector(
  [selectSelectedAccounts, selectAccountOptions],
  (selectedAccounts, accountOptions) => {
    if (!selectedAccounts || selectedAccounts.length === 0 || !accountOptions) {
      return false;
    }

    console.log("🔍 Checking for USD Named Accounts:", {
      selectedAccounts,
      accountOptionsLength: accountOptions.length,
    });

    // Check if any selected account is BOTH "named" AND currency is "USD"
    const hasUSDNamedAccount = selectedAccounts.some((accountId) => {
      try {
        // Convert to string for safe operations
        const accountIdStr = accountId.toString();
        
        // Check if it's a named account
        const isNamed = accountIdStr.includes("named");
        if (!isNamed) {
          console.log("❌ Not a named account:", accountIdStr);
          return false;
        }

        // Extract the service_provide_id from the account string
        // Format is usually "123-named" or "456-pooled"
        const parts = accountIdStr.split("-");
        const serviceProvideId = parseInt(parts[0]);
        
        if (isNaN(serviceProvideId)) {
          console.log("❌ Could not parse service_provide_id from:", accountIdStr);
          return false;
        }

        // Find the account in accountOptions
        const account = accountOptions.find(
          (opt) => opt.service_provide_id === serviceProvideId
        );

        if (!account) {
          console.log("❌ Account not found in options:", serviceProvideId);
          return false;
        }
        
        // Check if currency is USD
        const isUSD = account.currency === "USD";
        
        if (isUSD) {
          console.log("✅ Found USD Named Account:", {
            id: account.service_provide_id,
            name: account.account_name,
            currency: account.currency,
            type: account.account_type || account.accountType,
          });
        } else {
          console.log("❌ Not USD currency:", account.currency);
        }
        
        return isUSD;
      } catch (error) {
        console.error("❌ Error checking account:", accountId, error);
        return false;
      }
    });

    console.log("🏢 Final Result - Has USD Named Accounts:", hasUSDNamedAccount);
    return hasUSDNamedAccount;
  }
);

// ========== ADD THIS NEW SELECTOR ==========
// Selector to check if user has ANY Named Accounts (any currency)
export const selectHasAnyNamedAccounts = createSelector(
  [selectSelectedAccounts],
  (selectedAccounts) => {
    if (!selectedAccounts || selectedAccounts.length === 0) return false;
    
    return selectedAccounts.some(accountId => 
      accountId.toString().includes("named")
    );
  }
);

export const selectReferralSuccessMessage = createSelector(
  [selectValidationMessage, selectReferralError, selectIsReferralValidating],
  (validationMessage, referralError, isReferralValidating) => {
    if (isReferralValidating) return "";
    if (referralError) return "";
    return validationMessage.includes("Referral") ? validationMessage : "";
  }
);

export const selectAgentSuccessMessage = createSelector(
  [selectValidationMessage, selectAgentError, selectIsAgentValidating],
  (validationMessage, agentError, isAgentValidating) => {
    if (isAgentValidating) return "";
    if (agentError) return "";
    return validationMessage.includes("Agent") ? validationMessage : "";
  }
);

// Selector to check if form is ready to submit
export const selectIsFormValid = createSelector(
  [
    selectSelectedAccounts,
    selectRemittanceOnlyAccepted,
    selectTermsAccepted,
    selectReferralError,
    selectAgentError,
  ],
  (
    selectedAccounts,
    remittanceOnlyAccepted,
    termsAccepted,
    referralError,
    agentError
  ) => {
    // Check if at least one account is selected OR remittance only is chosen
    const hasSelection = selectedAccounts.length > 0 || remittanceOnlyAccepted;

    // Check if terms are accepted
    const hasAcceptedTerms = termsAccepted;

    // Check if there are no validation errors
    const hasNoErrors = !referralError && !agentError;

    return hasSelection && hasAcceptedTerms && hasNoErrors;
  }
);

// Selector to get the submit button disabled state
export const selectIsSubmitDisabled = createSelector(
  [
    selectLoading,
    selectIsReferralValidating,
    selectIsAgentValidating,
    selectSelectedAccounts,
    selectRemittanceOnlyAccepted,
    selectTermsAccepted,
  ],
  (
    loading,
    isReferralValidating,
    isAgentValidating,
    selectedAccounts,
    remittanceOnlyAccepted,
    termsAccepted
  ) => {
    // Button should be disabled if:
    // 1. Any loading/validation is in progress
    // 2. No accounts selected AND remittance only is not chosen
    // 3. Terms are not accepted
    return (
      loading ||
      isReferralValidating ||
      isAgentValidating ||
      (selectedAccounts.length === 0 && !remittanceOnlyAccepted) ||
      !termsAccepted
    );
  }
);

// Selector to get all form data for submission
export const selectFormData = createSelector(
  [
    selectSelectedAccounts,
    selectAccountOptions,
    selectReferralCode,
    selectAgentCode,
    selectRemittanceOnlyAccepted,
  ],
  (
    selectedAccounts,
    accountOptions,
    referralCode,
    agentCode,
    remittanceOnlyAccepted
  ) => {
    return {
      service_provide_ids: selectedAccounts,
      accountOptions: accountOptions,
      referral_code: referralCode,
      agent_code: agentCode,
      is_remit: remittanceOnlyAccepted ? 1 : 0,
    };
  }
);