// src/features/Remittance/slices/remittanceFormSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchInitialRemittanceData,
  fetchExchangeRate,
  fetchIncomeSources,
  fetchOccupations,
  fetchTransferPurposes,
  calculateAmounts,
  sendPasscode,
  verifyPasscode,
  validatePromocode,
  generateReceipt,
  confirmTransaction,
  submitManualDepositTransaction,
  submitBankTransferTransaction,
  submitCardDepositTransaction,
} from "../thunks/remittanceThunks";

const initialState = {
  // Form Data
  sendAmount: "",
  receiveAmount: "",
  activeInput: "send", // 'send' or 'receive'
  exchangeRate: 0,
  conversionId: null,
  step: 1, // 1: Amount, 2: Details, 3: Payment, 4: Confirmation
  loading: false,
  error: null,
  showPopup: false,
  popupContent: { type: "", title: "", message: "" },
  transactionId: null,
  selectedBeneficiary: null,
  showPasscodeModal: false,
  showErrorModal: false,
  modalMessage: "",
  verifying: false,
  calculating: false,
  showPaymentComponent: false,
  paymentInitiationComplete: false,
  paymentInitiationData: null,
  remitFromCurrency: null,
  remitReceiveCurrency: null,
  passcode: "",
  agreeToTerms: false,
  submitting: false,
  transactionSubmitted: false,
  promocode: "",
  promocodeApplied: false,
  promocodeDiscount: 0,

  // Form Validation
  isFormValid: false,
  formErrors: {},

  // Static Data
  incomeSources: [],
  occupations: [],
  transferPurposes: [],

  // Exchange Rate Cache
  exchangeRateCache: {},

  // Loading states for thunks
  loadingStates: {
    initialData: false,
    exchangeRate: false,
    incomeSources: false,
    occupations: false,
    transferPurposes: false,
    sendPasscode: false,
    verifyPasscode: false,
    validatePromocode: false,
    generateReceipt: false,
    confirmTransaction: false,
    submitManualDeposit: false,
    submitBankTransfer: false,
    submitCardDeposit: false,
  },

  // Error states for thunks
  errorStates: {
    initialData: null,
    exchangeRate: null,
    incomeSources: null,
    occupations: null,
    transferPurposes: null,
    sendPasscode: null,
    verifyPasscode: null,
    validatePromocode: null,
    generateReceipt: null,
    confirmTransaction: null,
    submitManualDeposit: null,
    submitBankTransfer: null,
    submitCardDeposit: null,
  },
};

const remittanceFormSlice = createSlice({
  name: "remittanceForm",
  initialState,
  reducers: {
    // Form Actions
    setSendAmount: (state, action) => {
      state.sendAmount = action.payload;
      state.activeInput = "send";
    },

    setReceiveAmount: (state, action) => {
      state.receiveAmount = action.payload;
      state.activeInput = "receive";
    },

    setActiveInput: (state, action) => {
      state.activeInput = action.payload;
    },

    setExchangeRate: (state, action) => {
      state.exchangeRate = action.payload;
    },

    setStep: (state, action) => {
      state.step = action.payload;
    },

    nextStep: (state) => {
      if (state.step < 4) {
        state.step += 1;
      }
    },

    prevStep: (state) => {
      if (state.step > 1) {
        state.step -= 1;
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
      Object.keys(state.errorStates).forEach((key) => {
        state.errorStates[key] = null;
      });
    },

    // Popup Actions
    showPopup: (state, action) => {
      state.showPopup = true;
      state.popupContent = action.payload;
    },

    hidePopup: (state) => {
      state.showPopup = false;
      state.popupContent = { type: "", title: "", message: "" };
    },

    // Beneficiary Actions
    setSelectedBeneficiary: (state, action) => {
      state.selectedBeneficiary = action.payload;
    },

    // Modal Actions
    showPasscodeModal: (state) => {
      state.showPasscodeModal = true;
    },

    hidePasscodeModal: (state) => {
      state.showPasscodeModal = false;
      state.passcode = "";
    },

    showErrorModal: (state, action) => {
      state.showErrorModal = true;
      state.modalMessage = action.payload;
    },

    hideErrorModal: (state) => {
      state.showErrorModal = false;
      state.modalMessage = "";
    },

    setModalMessage: (state, action) => {
      state.modalMessage = action.payload;
    },

    setVerifying: (state, action) => {
      state.verifying = action.payload;
    },

    // Payment Actions
    setShowPaymentComponent: (state, action) => {
      state.showPaymentComponent = action.payload;
    },

    setPaymentInitiationComplete: (state, action) => {
      state.paymentInitiationComplete = action.payload;
    },

    setPaymentInitiationData: (state, action) => {
      state.paymentInitiationData = action.payload;
    },

    // Currency Actions
    setRemitFromCurrency: (state, action) => {
      state.remitFromCurrency = action.payload;
    },

    setRemitReceiveCurrency: (state, action) => {
      state.remitReceiveCurrency = action.payload;
    },

    // Passcode Actions
    setPasscode: (state, action) => {
      state.passcode = action.payload;
    },

    // Terms Actions
    setAgreeToTerms: (state, action) => {
      state.agreeToTerms = action.payload;
    },

    // Submission Actions
    setSubmitting: (state, action) => {
      state.submitting = action.payload;
    },

    setTransactionSubmitted: (state, action) => {
      state.transactionSubmitted = action.payload;
    },

    // Promocode Actions
    setPromocode: (state, action) => {
      state.promocode = action.payload;
    },

    setPromocodeApplied: (state, action) => {
      state.promocodeApplied = action.payload;
    },

    setPromocodeDiscount: (state, action) => {
      state.promocodeDiscount = action.payload;
    },

    // Validation Actions
    setIsFormValid: (state, action) => {
      state.isFormValid = action.payload;
    },

    setFormErrors: (state, action) => {
      state.formErrors = action.payload;
    },

    // Clear loading states
    clearLoading: (state, action) => {
      const { loadingType } = action.payload || {};
      if (loadingType && state.loadingStates[loadingType]) {
        state.loadingStates[loadingType] = false;
      } else {
        Object.keys(state.loadingStates).forEach((key) => {
          state.loadingStates[key] = false;
        });
      }
    },

    // Clear error states
    clearErrorState: (state, action) => {
      const { errorType } = action.payload || {};
      if (errorType && state.errorStates[errorType]) {
        state.errorStates[errorType] = null;
      } else {
        Object.keys(state.errorStates).forEach((key) => {
          state.errorStates[key] = null;
        });
      }
    },

    // Clear exchange rate cache
    clearExchangeRateCache: (state) => {
      state.exchangeRateCache = {};
    },

    // Reset form
    resetForm: (state) => {
      return {
        ...initialState,
        exchangeRateCache: state.exchangeRateCache, // Keep cache
      };
    },
  },

  extraReducers: (builder) => {
    // ===================== INITIAL DATA FETCHING =====================
    builder
      .addCase(fetchInitialRemittanceData.pending, (state) => {
        state.loadingStates.initialData = true;
        state.errorStates.initialData = null;
      })
      .addCase(fetchInitialRemittanceData.fulfilled, (state, action) => {
        state.loadingStates.initialData = false;
        state.isFormValid = true;
      })
      .addCase(fetchInitialRemittanceData.rejected, (state, action) => {
        state.loadingStates.initialData = false;
        state.errorStates.initialData = action.payload || action.error.message;
        state.showErrorModal = true;
        state.modalMessage = action.payload || "Failed to load initial data";
      });

    // ===================== EXCHANGE RATE OPERATIONS =====================
    builder
      .addCase(fetchExchangeRate.pending, (state) => {
        state.loadingStates.exchangeRate = true;
        state.errorStates.exchangeRate = null;
      })
      .addCase(fetchExchangeRate.fulfilled, (state, action) => {
        state.loadingStates.exchangeRate = false;

        const { rate, fee, expiresAt, conversionId, cacheKey, fromCache } =
          action.payload;

        // Update exchange rate in form state
        state.exchangeRate = rate;
        state.conversionId = conversionId;

        // Cache the rate if not from cache
        if (!fromCache && cacheKey) {
          state.exchangeRateCache[cacheKey] = {
            rate,
            fee,
            expiresAt,
            conversionId,
            cachedAt: Date.now(),
          };
        }

        // Show success message if rate is valid
        if (rate > 0) {
          state.popupContent = {
            type: "info",
            title: "Exchange Rate Updated",
            message: `Rate: ${rate.toFixed(4)}`,
          };
          state.showPopup = true;
        }
      })
      .addCase(fetchExchangeRate.rejected, (state, action) => {
        state.loadingStates.exchangeRate = false;
        state.errorStates.exchangeRate = action.payload || action.error.message;
        state.exchangeRate = 0;
        state.conversionId = null;
      });

    // ===================== STATIC DATA FETCHING =====================
    builder
      // Income Sources
      .addCase(fetchIncomeSources.pending, (state) => {
        state.loadingStates.incomeSources = true;
        state.errorStates.incomeSources = null;
      })
      .addCase(fetchIncomeSources.fulfilled, (state, action) => {
        state.loadingStates.incomeSources = false;
        state.incomeSources = action.payload;
      })
      .addCase(fetchIncomeSources.rejected, (state, action) => {
        state.loadingStates.incomeSources = false;
        state.errorStates.incomeSources =
          action.payload || action.error.message;
      })

      // Occupations
      .addCase(fetchOccupations.pending, (state) => {
        state.loadingStates.occupations = true;
        state.errorStates.occupations = null;
      })
      .addCase(fetchOccupations.fulfilled, (state, action) => {
        state.loadingStates.occupations = false;
        state.occupations = action.payload;
      })
      .addCase(fetchOccupations.rejected, (state, action) => {
        state.loadingStates.occupations = false;
        state.errorStates.occupations = action.payload || action.error.message;
      })

      // Transfer Purposes
      .addCase(fetchTransferPurposes.pending, (state) => {
        state.loadingStates.transferPurposes = true;
        state.errorStates.transferPurposes = null;
      })
      .addCase(fetchTransferPurposes.fulfilled, (state, action) => {
        state.loadingStates.transferPurposes = false;
        state.transferPurposes = action.payload;
      })
      .addCase(fetchTransferPurposes.rejected, (state, action) => {
        state.loadingStates.transferPurposes = false;
        state.errorStates.transferPurposes =
          action.payload || action.error.message;
      });

    // ===================== AMOUNT CALCULATIONS =====================
    builder
      .addCase(calculateAmounts.pending, (state) => {
        state.calculating = true;
        state.error = null;
      })
      .addCase(calculateAmounts.fulfilled, (state, action) => {
        state.calculating = false;
        const { sendAmount, receiveAmount, direction } = action.payload;

        if (direction === "send") {
          state.sendAmount = sendAmount;
          state.receiveAmount = receiveAmount;
        } else {
          state.receiveAmount = receiveAmount;
          state.sendAmount = sendAmount;
        }

        // Validate form
        state.isFormValid = sendAmount > 0 && receiveAmount > 0;
      })
      .addCase(calculateAmounts.rejected, (state, action) => {
        state.calculating = false;
        state.error = action.payload || action.error.message;

        // Clear invalid amounts
        if (action.meta.arg.direction === "send") {
          state.receiveAmount = "";
        } else {
          state.sendAmount = "";
        }
      });

    // ===================== PASSCODE & VERIFICATION =====================
    builder
      // Send Passcode
      .addCase(sendPasscode.pending, (state) => {
        state.loadingStates.sendPasscode = true;
        state.errorStates.sendPasscode = null;
      })
      .addCase(sendPasscode.fulfilled, (state, action) => {
        state.loadingStates.sendPasscode = false;
        state.showPasscodeModal = true;
        state.passcode = "";
      })
      .addCase(sendPasscode.rejected, (state, action) => {
        state.loadingStates.sendPasscode = false;
        state.errorStates.sendPasscode = action.payload || action.error.message;
        state.showErrorModal = true;
        state.modalMessage = action.payload || "Failed to send passcode";
      })

      // Verify Passcode
      .addCase(verifyPasscode.pending, (state) => {
        state.loadingStates.verifyPasscode = true;
        state.errorStates.verifyPasscode = null;
        state.verifying = true;
      })
      .addCase(verifyPasscode.fulfilled, (state, action) => {
        state.loadingStates.verifyPasscode = false;
        state.verifying = false;
        state.showPasscodeModal = false;
        state.passcode = "";

        // Proceed to next step or confirmation
        if (state.step === 3) {
          state.step = 4; // Move to confirmation step
        }
      })
      .addCase(verifyPasscode.rejected, (state, action) => {
        state.loadingStates.verifyPasscode = false;
        state.errorStates.verifyPasscode =
          action.payload || action.error.message;
        state.verifying = false;
        state.showErrorModal = true;
        state.modalMessage = action.payload || "Invalid passcode";
      })

      // Validate Promocode
      .addCase(validatePromocode.pending, (state) => {
        state.loadingStates.validatePromocode = true;
        state.errorStates.validatePromocode = null;
      })
      .addCase(validatePromocode.fulfilled, (state, action) => {
        state.loadingStates.validatePromocode = false;
        const discount = action.payload.discount || 0;

        if (discount > 0) {
          state.promocodeApplied = true;
          state.promocodeDiscount = discount;

          state.popupContent = {
            type: "success",
            title: "Promocode Applied!",
            message: `You got a discount of ${discount}%`,
          };
          state.showPopup = true;
        }
      })
      .addCase(validatePromocode.rejected, (state, action) => {
        state.loadingStates.validatePromocode = false;
        state.errorStates.validatePromocode =
          action.payload || action.error.message;

        state.popupContent = {
          type: "error",
          title: "Invalid Promocode",
          message: action.payload || "Promocode validation failed",
        };
        state.showPopup = true;
      });

    // ===================== TRANSACTION SUBMISSION =====================
    builder
      // Confirm Transaction
      .addCase(confirmTransaction.pending, (state) => {
        state.loadingStates.confirmTransaction = true;
        state.errorStates.confirmTransaction = null;
        state.submitting = true;
      })
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        state.loadingStates.confirmTransaction = false;
        state.submitting = false;

        if (action.payload.type === "redirect") {
          // Handle card deposit redirect
          state.popupContent = {
            type: "info",
            title: "Redirecting...",
            message: action.payload.message,
          };
          state.showPopup = true;
        } else {
          // Successful transaction
          state.transactionId = action.payload.transactionId;
          state.step = 4; // Move to success step

          state.popupContent = {
            type: "success",
            title: "Transaction Successful!",
            message: "Your transfer has been processed successfully.",
          };
          state.showPopup = true;
        }
      })
      .addCase(confirmTransaction.rejected, (state, action) => {
        state.loadingStates.confirmTransaction = false;
        state.errorStates.confirmTransaction =
          action.payload || action.error.message;
        state.submitting = false;

        state.popupContent = {
          type: "error",
          title: "Transaction Failed",
          message: action.payload || "Failed to process transaction",
        };
        state.showPopup = true;
      })

      // Submit Manual Deposit
      .addCase(submitManualDepositTransaction.pending, (state) => {
        state.loadingStates.submitManualDeposit = true;
        state.errorStates.submitManualDeposit = null;
      })
      .addCase(submitManualDepositTransaction.fulfilled, (state, action) => {
        state.loadingStates.submitManualDeposit = false;
        state.transactionId = action.payload.transactionId;
        state.transactionSubmitted = true;
      })
      .addCase(submitManualDepositTransaction.rejected, (state, action) => {
        state.loadingStates.submitManualDeposit = false;
        state.errorStates.submitManualDeposit =
          action.payload || action.error.message;
      })

      // Submit Bank Transfer
      .addCase(submitBankTransferTransaction.pending, (state) => {
        state.loadingStates.submitBankTransfer = true;
        state.errorStates.submitBankTransfer = null;
      })
      .addCase(submitBankTransferTransaction.fulfilled, (state, action) => {
        state.loadingStates.submitBankTransfer = false;
        state.transactionId = action.payload.transactionId;
        state.transactionSubmitted = true;
      })
      .addCase(submitBankTransferTransaction.rejected, (state, action) => {
        state.loadingStates.submitBankTransfer = false;
        state.errorStates.submitBankTransfer =
          action.payload || action.error.message;
      })

      // Submit Card Deposit
      .addCase(submitCardDepositTransaction.pending, (state) => {
        state.loadingStates.submitCardDeposit = true;
        state.errorStates.submitCardDeposit = null;
      })
      .addCase(submitCardDepositTransaction.fulfilled, (state, action) => {
        state.loadingStates.submitCardDeposit = false;

        if (action.payload.type === "card_deposit_redirect") {
          // Store data for card page
          state.cardRedirectData = action.payload.data;
          state.popupContent = {
            type: "info",
            title: "Redirecting to Card Payment",
            message: "You will be redirected to complete your card payment.",
          };
          state.showPopup = true;
        }
      })
      .addCase(submitCardDepositTransaction.rejected, (state, action) => {
        state.loadingStates.submitCardDeposit = false;
        state.errorStates.submitCardDeposit =
          action.payload || action.error.message;

        try {
          const errorData = JSON.parse(action.payload);
          if (errorData.beneficiary || errorData.beneficiaryBank) {
            state.showErrorModal = true;
            state.modalMessage = Object.values(errorData).flat().join(", ");
          }
        } catch {
          state.showErrorModal = true;
          state.modalMessage =
            action.payload || "Failed to process card deposit";
        }
      });

    // ===================== RECEIPT GENERATION =====================
    builder
      .addCase(generateReceipt.pending, (state) => {
        state.loadingStates.generateReceipt = true;
        state.errorStates.generateReceipt = null;
      })
      .addCase(generateReceipt.fulfilled, (state, action) => {
        state.loadingStates.generateReceipt = false;

        // Trigger receipt download
        const receiptUrl = action.payload.downloadUrl;
        if (receiptUrl) {
          window.open(receiptUrl, "_blank");
        }
      })
      .addCase(generateReceipt.rejected, (state, action) => {
        state.loadingStates.generateReceipt = false;
        state.errorStates.generateReceipt =
          action.payload || action.error.message;

        state.popupContent = {
          type: "error",
          title: "Receipt Generation Failed",
          message: action.payload || "Failed to generate receipt",
        };
        state.showPopup = true;
      });
  },
});

// Export actions
export const {
  setSendAmount,
  setReceiveAmount,
  setActiveInput,
  setExchangeRate,
  setStep,
  nextStep,
  prevStep,
  setLoading,
  setError,
  clearError,
  showPopup,
  hidePopup,
  setSelectedBeneficiary,
  showPasscodeModal,
  hidePasscodeModal,
  showErrorModal,
  hideErrorModal,
  setModalMessage,
  setVerifying,
  setShowPaymentComponent,
  setPaymentInitiationComplete,
  setPaymentInitiationData,
  setRemitFromCurrency,
  setRemitReceiveCurrency,
  setPasscode,
  setAgreeToTerms,
  setSubmitting,
  setTransactionSubmitted,
  setPromocode,
  setPromocodeApplied,
  setPromocodeDiscount,
  setIsFormValid,
  setFormErrors,
  clearLoading,
  clearErrorState,
  clearExchangeRateCache,
  resetForm,
} = remittanceFormSlice.actions;

// Export selectors
export const selectRemittanceForm = (state) => state.remittanceForm;
export const selectSendAmount = (state) => state.remittanceForm.sendAmount;
export const selectReceiveAmount = (state) =>
  state.remittanceForm.receiveAmount;
export const selectActiveInput = (state) => state.remittanceForm.activeInput;
export const selectExchangeRate = (state) => state.remittanceForm.exchangeRate;
export const selectStep = (state) => state.remittanceForm.step;
export const selectLoading = (state) => state.remittanceForm.loading;
export const selectError = (state) => state.remittanceForm.error;
export const selectShowPopup = (state) => state.remittanceForm.showPopup;
export const selectPopupContent = (state) => state.remittanceForm.popupContent;
export const selectTransactionId = (state) =>
  state.remittanceForm.transactionId;
export const selectSelectedBeneficiary = (state) =>
  state.remittanceForm.selectedBeneficiary;
export const selectShowPasscodeModal = (state) =>
  state.remittanceForm.showPasscodeModal;
export const selectShowErrorModal = (state) =>
  state.remittanceForm.showErrorModal;
export const selectModalMessage = (state) => state.remittanceForm.modalMessage;
export const selectVerifying = (state) => state.remittanceForm.verifying;
export const selectShowPaymentComponent = (state) =>
  state.remittanceForm.showPaymentComponent;
export const selectPaymentInitiationComplete = (state) =>
  state.remittanceForm.paymentInitiationComplete;
export const selectRemitFromCurrency = (state) =>
  state.remittanceForm.remitFromCurrency;
export const selectRemitReceiveCurrency = (state) =>
  state.remittanceForm.remitReceiveCurrency;
export const selectPasscode = (state) => state.remittanceForm.passcode;
export const selectAgreeToTerms = (state) => state.remittanceForm.agreeToTerms;
export const selectSubmitting = (state) => state.remittanceForm.submitting;
export const selectTransactionSubmitted = (state) =>
  state.remittanceForm.transactionSubmitted;
export const selectPromocode = (state) => state.remittanceForm.promocode;
export const selectPromocodeApplied = (state) =>
  state.remittanceForm.promocodeApplied;
export const selectPromocodeDiscount = (state) =>
  state.remittanceForm.promocodeDiscount;
export const selectIsFormValid = (state) => state.remittanceForm.isFormValid;
export const selectFormErrors = (state) => state.remittanceForm.formErrors;
export const selectCalculating = (state) => state.remittanceForm.calculating;
export const selectConversionId = (state) => state.remittanceForm.conversionId;
export const selectIncomeSources = (state) =>
  state.remittanceForm.incomeSources;
export const selectOccupations = (state) => state.remittanceForm.occupations;
export const selectTransferPurposes = (state) =>
  state.remittanceForm.transferPurposes;

// Form status selector
export const selectFormStatus = (state) => ({
  isValid: state.remittanceForm.isFormValid,
  errors: state.remittanceForm.formErrors,
  step: state.remittanceForm.step,
  canProceed: state.remittanceForm.isFormValid && !state.remittanceForm.loading,
});

// Current step selector
export const selectCurrentStep = (state) => ({
  current: state.remittanceForm.step,
  isFirst: state.remittanceForm.step === 1,
  isLast: state.remittanceForm.step === 4,
  canGoNext: state.remittanceForm.isFormValid && !state.remittanceForm.loading,
  canGoBack: state.remittanceForm.step > 1,
});

export default remittanceFormSlice.reducer;
