import { createSelector } from "@reduxjs/toolkit";

// ========== ORIGINAL SELECTORS ==========
export const selectAccountOptions = (state) =>
  state.currencyAccounts.accountOptions;
export const selectNamedAccounts = (state) =>
  state.currencyAccounts.namedAccounts;
export const selectIsPartnerFlow = (state) =>
  state.currencyAccounts.isPartnerFlow;
export const selectPartnerId = (state) => state.currencyAccounts.partnerId;
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
export const selectIsReferralValidating = (state) =>
  state.currencyAccounts.isReferralValidating;
export const selectIsAgentValidating = (state) =>
  state.currencyAccounts.isAgentValidating;
export const selectValidationMessage = (state) =>
  state.currencyAccounts.validationMessage;

// ========== NEW PACKAGE SELECTORS ==========
export const selectIsPartnerPackageModule = (state) =>
  state.currencyAccounts.isPartnerPackageModule;
export const selectPackageOptions = (state) =>
  state.currencyAccounts.packageOptions;
export const selectSelectedPackageCurrencies = (state) =>
  state.currencyAccounts.selectedPackageCurrencies;
export const selectPackageFeesUrl = (state) =>
  state.currencyAccounts.packageFeesUrl;
export const selectPackageLoading = (state) =>
  state.currencyAccounts.packageLoading;
export const selectPackageError = (state) =>
  state.currencyAccounts.packageError;
export const selectIsPackageValidating = (state) =>
  state.currencyAccounts.isPackageValidating;
export const selectPackageValidationMessage = (state) =>
  state.currencyAccounts.packageValidationMessage;
export const selectPackageFlags = (state) => ({
  ssnRequired: state.currencyAccounts.packageSsnRequired,
  ownerAdd: state.currencyAccounts.packageOwnerAdd,
  documentUpload: state.currencyAccounts.packageDocumentUpload,
  kycVerify: state.currencyAccounts.packageKycVerify,
});

// ========== ORIGINAL COMPUTED SELECTORS ==========

// ✅ RESTORED: Selector to check if user has selected USD Named Accounts
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
          console.log(
            "❌ Could not parse service_provide_id from:",
            accountIdStr
          );
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

    console.log(
      "🏢 Final Result - Has USD Named Accounts:",
      hasUSDNamedAccount
    );
    return hasUSDNamedAccount;
  }
);

// ✅ RESTORED: Selector to check if user has ANY Named Accounts (any currency)
export const selectHasAnyNamedAccounts = createSelector(
  [selectSelectedAccounts],
  (selectedAccounts) => {
    if (!selectedAccounts || selectedAccounts.length === 0) return false;

    return selectedAccounts.some((accountId) =>
      accountId.toString().includes("named")
    );
  }
);

// ✅ RESTORED: Success message selectors
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

// ========== UPDATED FOR "ONLY 1 CURRENCY ALLOWED" ==========

// Selector to check if form is ready to submit (UPDATED)
export const selectIsFormValid = createSelector(
  [
    selectSelectedAccounts,
    selectRemittanceOnlyAccepted,
    selectTermsAccepted,
    selectReferralError,
    selectAgentError,
    selectIsPartnerPackageModule,
    selectSelectedPackageCurrencies,
    selectPackageOptions,
  ],
  (
    selectedAccounts,
    remittanceOnlyAccepted,
    termsAccepted,
    referralError,
    agentError,
    isPartnerPackageModule,
    selectedPackageCurrencies,
    packageOptions
  ) => {
    if (isPartnerPackageModule === "Y") {
      // If remittance only is selected, only check terms and errors
      if (remittanceOnlyAccepted) {
        return termsAccepted && !referralError && !agentError;
      }

      // ========== CHANGED: Allow multiple selections ==========
      const hasPackageSelection = selectedPackageCurrencies.length >= 1;

      if (!hasPackageSelection) {
        return false;
      }

      const hasAcceptedTerms = termsAccepted;
      const hasNoErrors = !referralError && !agentError;

      return hasPackageSelection && hasAcceptedTerms && hasNoErrors;
    } else {
      // Regular mode validation remains the same
      const hasSelection =
        selectedAccounts.length > 0 || remittanceOnlyAccepted;
      const hasAcceptedTerms = termsAccepted;
      const hasNoErrors = !referralError && !agentError;

      return hasSelection && hasAcceptedTerms && hasNoErrors;
    }
  }
);

// Also update selectIsSubmitDisabled to be simpler
export const selectIsSubmitDisabled = createSelector(
  [
    selectLoading,
    selectPackageLoading,
    selectIsReferralValidating,
    selectIsAgentValidating,
    selectIsPackageValidating,
    selectIsFormValid, // Use the form validation result
  ],
  (
    loading,
    packageLoading,
    isReferralValidating,
    isAgentValidating,
    isPackageValidating,
    isFormValid
  ) => {
    // Disable if any loading/validation is in progress
    if (
      loading ||
      packageLoading ||
      isReferralValidating ||
      isAgentValidating ||
      isPackageValidating
    ) {
      return true;
    }

    // Disable if form is not valid
    return !isFormValid;
  }
);

// Selector to get all form data for submission (UPDATED)
export const selectFormData = createSelector(
  [
    selectSelectedAccounts,
    selectAccountOptions,
    selectReferralCode,
    selectAgentCode,
    selectRemittanceOnlyAccepted,
    selectIsPartnerPackageModule,
    selectSelectedPackageCurrencies,
    selectPackageOptions,
    selectPackageFlags,
  ],
  (
    selectedAccounts,
    accountOptions,
    referralCode,
    agentCode,
    remittanceOnlyAccepted,
    isPartnerPackageModule,
    selectedPackageCurrencies,
    packageOptions,
    packageFlags
  ) => {
    const baseData = {
      service_provide_ids:
        isPartnerPackageModule === "Y" ? [] : selectedAccounts,
      accountOptions: accountOptions,
      referral_code: referralCode,
      agent_code: agentCode,
      is_remit: remittanceOnlyAccepted ? 1 : 0,
    };

    if (isPartnerPackageModule === "Y") {
      return {
        ...baseData,
        is_partner_package_module: "Y",
        package_currencies: selectedPackageCurrencies,
        package_options: packageOptions,
        ssn_required: packageFlags.ssnRequired || "Y",
        owner_add: packageFlags.ownerAdd || "Y",
        document_upload: packageFlags.documentUpload || "Y",
        kyc_verify: packageFlags.kycVerify || "Y",
      };
    }

    return baseData;
  }
);