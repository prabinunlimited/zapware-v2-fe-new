// src/features/Remittance/selectors/remittanceSelectors.js
import { createSelector } from "@reduxjs/toolkit";
import {
  formatNumber,
  parseFormattedNumber,
  getCurrencySymbol,
} from "../thunks/apiCalls";

// Import selectors from slices
import {
  selectRemittanceForm,
  selectSendAmount,
  selectReceiveAmount,
  selectActiveInput,
  selectExchangeRate,
  selectStep,
  selectLoading,
  selectError,
  selectShowPopup,
  selectPopupContent,
  selectTransactionId,
  selectSelectedBeneficiary as selectFormSelectedBeneficiary,
  selectShowPasscodeModal,
  selectShowErrorModal,
  selectModalMessage,
  selectVerifying,
  selectShowPaymentComponent,
  selectPaymentInitiationComplete,
  selectRemitFromCurrency,
  selectRemitReceiveCurrency,
  selectPasscode,
  selectIsFormValid,
  selectFormErrors,
  selectCalculating,
  selectConversionId,
  selectFormStatus,
  selectCurrentStep,
  selectIncomeSources,
  selectOccupations,
  selectTransferPurposes,
} from "../slices/remittanceFormSlice";

import {
  selectRemittanceCurrencies,
  selectSendCurrency,
  selectReceiveCurrency,
  selectPayoutCurrenciesData,
  selectBankAccountDetails,
  selectExchangeRateData,
  selectManualAccountDetails,
  selectManualDetailsLoading,
  selectBankDetails,
  selectCurrencyOptions,
  selectIsEuropeUKTransfer,
  selectExchangeRateInfo,
  selectIsManualPaymentReady,
} from "../slices/remittanceCurrenciesSlice";

import {
  selectRemittancePayment,
  selectPaymentMethod,
  selectPaymentMethodRef,
  selectManualDepositFormData,
  selectBankTransferFormData,
  selectCardTransferFormData,
  selectBeneficiaries,
  selectBeneficiaryOptions,
  selectSelectedBeneficiary as selectPaymentSelectedBeneficiary,
  selectBeneficiaryId,
  selectSearchingBeneficiary,
  selectBeneficiaryBanks,
  selectBeneficiaryBankOptions,
  selectSelectedBeneficiaryBank,
  selectBeneficiaryBankId,
  selectBeneficiaryCodeData,
  selectFileUpload,
  selectPaymentValidation,
  selectPaymentMethods,
  selectCurrentPaymentMethod,
  selectCurrentFormData,
  selectIsPaymentFormValid,
  selectPaymentLoading,
  selectPaymentSubmitted,
  selectPaymentOptions,
} from "../slices/remittancePaymentSlice";

import {
  selectRemittanceTransactions,
  selectProcessing,
  selectProcessingError,
  selectTransactionDetails,
  selectReceiptData,
  selectApiResponses,
  selectErrors,
  selectSuccessStates,
  selectReceiptGeneration,
  selectRecentTransactions,
  selectTransactionStatus,
  selectIsTransactionSuccessful,
  selectTransactionErrors,
  selectReceiptStatus,
  selectTransactionSummary,
} from "../slices/remittanceTransactionsSlice";

import {
  selectRemittancePartners,
  selectOriginatingPartner,
  selectPayoutPartner,
  selectDefaultLogos,
  selectPartnerConfiguration,
  selectPartnersByCurrency,
  selectPartnerLogos,
  selectPartnerStatus,
  selectDisplayPartnerInfo,
  selectIsWhiteLabelledSetup,
} from "../slices/remittancePartnersSlice";

// ===================== LOADING STATE SELECTORS =====================

export const selectLoadingStates = createSelector(
  [
    selectRemittanceForm,
    selectRemittanceCurrencies,
    selectRemittancePayment,
    selectRemittanceTransactions,
    selectRemittancePartners,
  ],
  (form, currencies, payment, transactions, partners) => ({
    form: form.loadingStates,
    currencies: currencies.loadingStates,
    payment: payment.loadingStates,
    transactions: transactions.loadingStates,
    partners: partners.loadingStates,
  })
);

export const selectIsLoading = createSelector(
  [selectLoadingStates],
  (loadingStates) => {
    const allLoading = [
      ...Object.values(loadingStates.form || {}),
      ...Object.values(loadingStates.currencies || {}),
      ...Object.values(loadingStates.payment || {}),
      ...Object.values(loadingStates.transactions || {}),
      ...Object.values(loadingStates.partners || {}),
    ];
    return allLoading.some((loading) => loading === true);
  }
);

export const selectSpecificLoading = (loadingType) =>
  createSelector([selectLoadingStates], (loadingStates) => {
    // Check all slices for the loading type
    for (const slice of Object.values(loadingStates)) {
      if (slice && slice[loadingType] !== undefined) {
        return slice[loadingType];
      }
    }
    return false;
  });

// ===================== ERROR STATE SELECTORS =====================

export const selectErrorStates = createSelector(
  [
    selectRemittanceForm,
    selectRemittanceCurrencies,
    selectRemittancePayment,
    selectRemittanceTransactions,
    selectRemittancePartners,
  ],
  (form, currencies, payment, transactions, partners) => ({
    form: form.errorStates,
    currencies: currencies.errorStates,
    payment: payment.errorStates,
    transactions: transactions.errorStates,
    partners: partners.errorStates,
  })
);

export const selectHasErrors = createSelector(
  [selectErrorStates],
  (errorStates) => {
    const allErrors = [
      ...Object.values(errorStates.form || {}),
      ...Object.values(errorStates.currencies || {}),
      ...Object.values(errorStates.payment || {}),
      ...Object.values(errorStates.transactions || {}),
      ...Object.values(errorStates.partners || {}),
    ];
    return allErrors.some((error) => error !== null);
  }
);

export const selectSpecificError = (errorType) =>
  createSelector([selectErrorStates], (errorStates) => {
    // Check all slices for the error type
    for (const slice of Object.values(errorStates)) {
      if (slice && slice[errorType] !== undefined) {
        return slice[errorType];
      }
    }
    return null;
  });

// ===================== COMBINED STATUS SELECTORS =====================

export const selectRemittanceStatus = createSelector(
  [
    selectIsLoading,
    selectHasErrors,
    selectFormStatus,
    selectPaymentSubmitted,
    selectTransactionStatus,
  ],
  (isLoading, hasErrors, formStatus, paymentSubmitted, transactionStatus) => ({
    isLoading,
    hasErrors,
    formStatus,
    paymentSubmitted,
    transactionStatus,
    isReady: !isLoading && !hasErrors && formStatus.isValid,
    canSubmit:
      !isLoading && !hasErrors && formStatus.isValid && paymentSubmitted,
  })
);

// ===================== COMBINED SELECTORS =====================

/**
 * Get complete remittance state
 */
export const selectRemittanceState = createSelector(
  [
    selectRemittanceForm,
    selectRemittanceCurrencies,
    selectRemittancePayment,
    selectRemittanceTransactions,
    selectRemittancePartners,
  ],
  (form, currencies, payment, transactions, partners) => ({
    form,
    currencies,
    payment,
    transactions,
    partners,
  })
);

/**
 * Get form summary for display
 */
export const selectFormSummary = createSelector(
  [
    selectSendAmount,
    selectReceiveAmount,
    selectSendCurrency,
    selectReceiveCurrency,
    selectExchangeRate,
    selectPaymentMethodRef,
    selectManualAccountDetails,
    selectBankDetails,
  ],
  (
    sendAmount,
    receiveAmount,
    sendCurrency,
    receiveCurrency,
    exchangeRate,
    paymentMethod,
    manualDetails,
    bankDetails
  ) => {
    const sendSymbol = getCurrencySymbol(sendCurrency);
    const receiveSymbol = getCurrencySymbol(receiveCurrency);

    return {
      send: {
        amount: sendAmount,
        formatted: sendAmount
          ? `${sendSymbol}${formatNumber(sendAmount)}`
          : "0",
        currency: sendCurrency?.value || "",
        symbol: sendSymbol,
      },
      receive: {
        amount: receiveAmount,
        formatted: receiveAmount
          ? `${receiveSymbol}${formatNumber(receiveAmount)}`
          : "0",
        currency: receiveCurrency?.value || "",
        symbol: receiveSymbol,
      },
      exchangeRate: exchangeRate > 0 ? exchangeRate.toFixed(4) : "0.0000",
      paymentMethod: paymentMethod?.value || "bank",
      hasManualDetails: !!manualDetails,
      hasBankDetails: !!bankDetails,
      totalToPay: sendAmount
        ? `${sendSymbol}${formatNumber(parseFormattedNumber(sendAmount))}`
        : "0",
    };
  }
);

/**
 * Get charges breakdown
 */
export const selectChargesBreakdown = createSelector(
  [
    selectSendAmount,
    selectReceiveAmount,
    selectSendCurrency,
    selectReceiveCurrency,
    selectExchangeRateData,
  ],
  (
    sendAmount,
    receiveAmount,
    sendCurrency,
    receiveCurrency,
    exchangeRateData
  ) => {
    const sendSymbol = getCurrencySymbol(sendCurrency);
    const receiveSymbol = getCurrencySymbol(receiveCurrency);

    return {
      sendAmount: {
        label: "Amount to Send",
        value: sendAmount ? `${sendSymbol}${formatNumber(sendAmount)}` : "0",
        raw: parseFormattedNumber(sendAmount),
      },
      receiveAmount: {
        label: "Beneficiary Receives",
        value: receiveAmount
          ? `${receiveSymbol}${formatNumber(receiveAmount)}`
          : "0",
        raw: parseFormattedNumber(receiveAmount),
      },
      exchangeRate: {
        label: "Exchange Rate",
        value:
          exchangeRateData.rate > 0
            ? `${sendCurrency?.value || ""} 1 = ${
                receiveCurrency?.value || ""
              } ${exchangeRateData.rate.toFixed(4)}`
            : "Loading...",
        rate: exchangeRateData.rate,
      },
      fee: {
        label: "Fee",
        value:
          exchangeRateData.fee > 0
            ? `${sendSymbol}${formatNumber(exchangeRateData.fee)}`
            : "Free",
        raw: exchangeRateData.fee,
      },
      total: {
        label: "Total to Pay",
        value: sendAmount
          ? `${sendSymbol}${formatNumber(parseFormattedNumber(sendAmount))}`
          : "0",
        raw: parseFormattedNumber(sendAmount),
      },
    };
  }
);

/**
 * Get current step configuration
 */
export const selectStepConfiguration = createSelector(
  [selectStep, selectPaymentMethodRef, selectShowPaymentComponent],
  (step, paymentMethod, showPaymentComponent) => {
    const steps = {
      1: {
        title: "Send Money Worldwide",
        description: "Fast, secure, and low-cost international transfers",
        canGoBack: false,
        canGoNext: true,
      },
      2: {
        title: "Complete Your Transfer",
        description: "Please provide the required details",
        canGoBack: true,
        canGoNext: true,
      },
      3: {
        title: showPaymentComponent
          ? "Payment Initiation"
          : "Confirm Your Transfer",
        description: showPaymentComponent
          ? "Processing your payment"
          : "Review your transaction details",
        canGoBack: true,
        canGoNext: false,
      },
      4: {
        title: "Transaction Confirmation",
        description: "Your transfer has been processed",
        canGoBack: false,
        canGoNext: false,
      },
    };

    return {
      current: step,
      config: steps[step] || steps[1],
      isFirst: step === 1,
      isLast: step === 4,
      nextStep: step < 4 ? step + 1 : 4,
      prevStep: step > 1 ? step - 1 : 1,
    };
  }
);

/**
 * Get payment method specific configuration
 */
export const selectPaymentMethodConfig = createSelector(
  [selectPaymentMethodRef, selectCurrentPaymentMethod],
  (paymentMethodRef, currentPayment) => {
    const configs = {
      bank: {
        label: "Bank Transfer",
        icon: "IoBusinessOutline",
        color: "blue-600",
        description: "Direct bank-to-bank transfer",
        requiresSenderBank: true,
        requiresBeneficiaryBank: true,
      },
      manual: {
        label: "Manual Deposit",
        icon: "IoCashOutline",
        color: "emerald-500",
        description: "Deposit to our account and upload receipt",
        requiresManualDetails: true,
        requiresDocumentUpload: true,
      },
      card: {
        label: "Card Deposit",
        icon: "IoCardOutline",
        color: "emerald-500",
        description: "Pay with credit/debit card",
        requiresCardDetails: true,
        redirectsToCardPage: true,
      },
    };

    return configs[paymentMethodRef.value] || configs.bank;
  }
);

/**
 * Get validation status for current step
 */
export const selectStepValidation = createSelector(
  [
    selectStep,
    selectIsFormValid,
    selectIsPaymentFormValid,
    selectShowPaymentComponent,
    selectPaymentInitiationComplete,
  ],
  (
    step,
    isFormValid,
    isPaymentFormValid,
    showPaymentComponent,
    paymentInitiationComplete
  ) => {
    const validations = {
      1: {
        isValid: isFormValid,
        message: isFormValid ? "" : "Please enter send and receive amounts",
      },
      2: {
        isValid: isPaymentFormValid,
        message: isPaymentFormValid
          ? ""
          : "Please complete all required fields",
      },
      3: {
        isValid: !showPaymentComponent || paymentInitiationComplete,
        message: paymentInitiationComplete
          ? ""
          : "Please complete payment initiation",
      },
      4: {
        isValid: true,
        message: "",
      },
    };

    return validations[step] || validations[1];
  }
);

/**
 * Get transaction confirmation data
 */
export const selectTransactionConfirmation = createSelector(
  [
    selectSendAmount,
    selectReceiveAmount,
    selectSendCurrency,
    selectReceiveCurrency,
    selectExchangeRate,
    selectPaymentMethodRef,
    selectFormSelectedBeneficiary,
    selectPaymentInitiationComplete,
    selectTransactionDetails,
  ],
  (
    sendAmount,
    receiveAmount,
    sendCurrency,
    receiveCurrency,
    exchangeRate,
    paymentMethod,
    beneficiary,
    paymentInitiationComplete,
    transactionDetails
  ) => {
    const sendSymbol = getCurrencySymbol(sendCurrency);
    const receiveSymbol = getCurrencySymbol(receiveCurrency);

    return {
      send: {
        amount: `${sendSymbol}${formatNumber(sendAmount)}`,
        currency: sendCurrency?.value || "",
        from: "Your Account",
      },
      receive: {
        amount: `${receiveSymbol}${formatNumber(receiveAmount)}`,
        currency: receiveCurrency?.value || "",
        to: beneficiary?.details?.name || beneficiary?.name || "Beneficiary",
      },
      details: {
        exchangeRate:
          exchangeRate > 0
            ? `1 ${sendCurrency?.value || ""} = ${exchangeRate.toFixed(4)} ${
                receiveCurrency?.value || ""
              }`
            : "N/A",
        paymentMethod: paymentMethod?.value?.toUpperCase() || "BANK",
        paymentInitiated: paymentInitiationComplete,
        transactionId: transactionDetails?.transactionId,
        timestamp: transactionDetails?.timestamp
          ? new Date(transactionDetails.timestamp).toLocaleString()
          : "Just now",
      },
      status: {
        canConfirm: !paymentInitiationComplete || paymentInitiationComplete,
        requiresAgreement: true,
      },
    };
  }
);

/**
 * Get popup configuration
 */
export const selectPopupConfig = createSelector(
  [selectShowPopup, selectPopupContent, selectTransactionDetails],
  (showPopup, popupContent, transactionDetails) => {
    if (!showPopup) return null;

    const isSuccess = popupContent.type === "success";
    const isError = popupContent.type === "error";

    return {
      isOpen: showPopup,
      type: popupContent.type,
      title: popupContent.title,
      message: popupContent.message,
      details: popupContent.details,
      transactionId: transactionDetails?.transactionId,
      actions: {
        primary: isSuccess ? "Download Receipt" : "Close",
        secondary: isSuccess ? "Return Home" : null,
      },
    };
  }
);

/**
 * Get partner display configuration
 */
export const selectPartnerDisplay = createSelector(
  [
    selectPartnerLogos,
    selectOriginatingPartner,
    selectPayoutPartner,
    selectDefaultLogos,
  ],
  (partnerLogos, originatingPartner, payoutPartner, defaultLogos) => {
    return {
      originating: {
        logo: partnerLogos.originatingLogo,
        loading: originatingPartner.loading,
        error: originatingPartner.error,
        title: "Originating",
      },
      payout: {
        logo: partnerLogos.payoutLogo,
        loading: payoutPartner.loading,
        error: payoutPartner.error,
        title: "Payout",
      },
      showSection: true,
      isLoading: partnerLogos.isLoading,
      hasError: partnerLogos.hasError,
    };
  }
);

/**
 * Get navigation configuration
 */
export const selectNavigationConfig = createSelector(
  [
    selectStep,
    selectStepValidation,
    selectStepConfiguration,
    selectIsLoading,
    selectCalculating,
  ],
  (step, validation, stepConfig, isLoading, calculating) => {
    return {
      currentStep: step,
      canGoBack: stepConfig.canGoBack,
      canGoNext:
        stepConfig.canGoNext &&
        validation.isValid &&
        !isLoading &&
        !calculating,
      backLabel: "Back",
      nextLabel: step === 4 ? "Transfer" : "Continue",
      isLoading: isLoading || calculating,
      isCalculating: calculating,
    };
  }
);

/**
 * Get manual deposit bank details for display
 */
export const selectManualDepositDisplay = createSelector(
  [selectManualAccountDetails, selectManualDetailsLoading, selectSendCurrency],
  (manualDetails, loading, sendCurrency) => {
    if (!manualDetails || loading) {
      return {
        show: false,
        loading,
        currency: sendCurrency?.value || "",
      };
    }

    const details = [
      {
        label: "Bank Name",
        value: manualDetails.bank_name,
        icon: "FaBuilding",
      },
      {
        label: "Account Name",
        value: manualDetails.account_name,
        icon: "FaRegFileAlt",
        required: true,
      },
      {
        label: "Account Number",
        value: manualDetails.account_number,
        icon: "FaRegFileAlt",
      },
      {
        label: "IBAN",
        value: manualDetails.iban,
        icon: "FaRegFileAlt",
        required: true,
      },
      {
        label: "SWIFT/BIC",
        value: manualDetails.swift_code || manualDetails.bic,
        icon: "FaRegFileAlt",
      },
      {
        label: "Bank Address",
        value: manualDetails.bank_address,
        icon: "FaMapMarkerAlt",
      },
    ];

    if (manualDetails.routing_number) {
      details.push({
        label: "Routing Number",
        value: manualDetails.routing_number,
        icon: "FaRegFileAlt",
      });
    }

    if (manualDetails.sort_code) {
      details.push({
        label: "Sort Code",
        value: manualDetails.sort_code,
        icon: "FaRegFileAlt",
      });
    }

    return {
      show: true,
      loading: false,
      currency: sendCurrency?.value || "",
      isUSD: sendCurrency?.value === "USD",
      details,
      instructions:
        "Please use the following bank account details for your manual deposit.",
    };
  }
);

// ===================== EXPORT ALL SELECTORS =====================

export {
  // Form State
  selectRemittanceForm,
  selectSendAmount,
  selectReceiveAmount,
  selectActiveInput,
  selectExchangeRate,
  selectStep,
  selectLoading,
  selectError,
  selectShowPopup,
  selectPopupContent,
  selectTransactionId,
  selectFormSelectedBeneficiary as selectSelectedBeneficiary,
  selectShowPasscodeModal,
  selectShowErrorModal,
  selectModalMessage,
  selectVerifying,
  selectShowPaymentComponent,
  selectPaymentInitiationComplete,
  selectRemitFromCurrency,
  selectRemitReceiveCurrency,
  selectPasscode,
  selectIsFormValid,
  selectFormErrors,
  selectCalculating,
  selectConversionId,
  selectFormStatus,
  selectCurrentStep,

  // Currencies State
  selectRemittanceCurrencies,
  selectSendCurrency,
  selectReceiveCurrency,
  selectPayoutCurrenciesData,
  selectBankAccountDetails,
  selectExchangeRateData,
  selectManualAccountDetails,
  selectManualDetailsLoading,
  selectBankDetails,
  selectCurrencyOptions,
  selectIsEuropeUKTransfer,
  selectExchangeRateInfo,
  selectIsManualPaymentReady,

  // Payment State
  selectRemittancePayment,
  selectPaymentMethod,
  selectPaymentMethodRef,
  selectManualDepositFormData,
  selectBankTransferFormData,
  selectCardTransferFormData,
  selectBeneficiaries,
  selectBeneficiaryOptions,
  selectPaymentSelectedBeneficiary,
  selectBeneficiaryId,
  selectSearchingBeneficiary,
  selectBeneficiaryBanks,
  selectBeneficiaryBankOptions,
  selectSelectedBeneficiaryBank,
  selectBeneficiaryBankId,
  selectBeneficiaryCodeData,
  selectFileUpload,
  selectPaymentValidation,
  selectPaymentMethods,
  selectCurrentPaymentMethod,
  selectCurrentFormData,
  selectIsPaymentFormValid,
  selectPaymentLoading,
  selectPaymentSubmitted,
  selectPaymentOptions,

  // Transactions State
  selectRemittanceTransactions,
  selectProcessing,
  selectProcessingError,
  selectTransactionDetails,
  selectReceiptData,
  selectApiResponses,
  selectErrors,
  selectSuccessStates,
  selectReceiptGeneration,
  selectRecentTransactions,
  selectTransactionStatus,
  selectIsTransactionSuccessful,
  selectTransactionErrors,
  selectReceiptStatus,
  selectTransactionSummary,

  // Partners State
  selectRemittancePartners,
  selectOriginatingPartner,
  selectPayoutPartner,
  selectDefaultLogos,
  selectPartnerConfiguration,
  selectPartnersByCurrency,
  selectPartnerLogos,
  selectPartnerStatus,
  selectDisplayPartnerInfo,
  selectIsWhiteLabelledSetup,
  selectIncomeSources,
  selectOccupations,
  selectTransferPurposes,
};
