// src/features/Remittance/slices/remittanceTransactionsSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  submitManualDepositTransaction,
  submitBankTransferTransaction,
  submitCardDepositTransaction,
  confirmTransaction,
  generateReceipt,
} from "../thunks/remittanceThunks";

const initialState = {
  // Transaction Processing
  processing: false,
  processingError: null,

  // Transaction Details
  transactionDetails: null,
  receiptData: null,

  // API Responses
  apiResponses: {
    manualDeposit: null,
    bankTransfer: null,
    cardDeposit: null,
    confirmTransaction: null,
  },

  // Errors
  errors: {
    manualDeposit: null,
    bankTransfer: null,
    cardDeposit: null,
    confirmTransaction: null,
  },

  // Success States
  successStates: {
    manualDeposit: false,
    bankTransfer: false,
    cardDeposit: false,
    confirmTransaction: false,
  },

  // Receipt Generation
  receiptGeneration: {
    loading: false,
    success: false,
    error: null,
    downloadUrl: null,
  },

  // Recent Transactions
  recentTransactions: [],

  // Loading states for thunks
  loadingStates: {
    submitManualDeposit: false,
    submitBankTransfer: false,
    submitCardDeposit: false,
    confirmTransaction: false,
    generateReceipt: false,
  },

  // Error states for thunks
  errorStates: {
    submitManualDeposit: null,
    submitBankTransfer: null,
    submitCardDeposit: null,
    confirmTransaction: null,
    generateReceipt: null,
  },
};

const remittanceTransactionsSlice = createSlice({
  name: "remittanceTransactions",
  initialState,
  reducers: {
    // Transaction Actions
    setProcessing: (state, action) => {
      state.processing = action.payload;
    },

    setProcessingError: (state, action) => {
      state.processingError = action.payload;
    },

    clearProcessing: (state) => {
      state.processing = false;
      state.processingError = null;
    },

    // Transaction Details Actions
    setTransactionDetails: (state, action) => {
      state.transactionDetails = action.payload;
    },

    clearTransactionDetails: (state) => {
      state.transactionDetails = null;
    },

    // Receipt Actions
    setReceiptData: (state, action) => {
      state.receiptData = action.payload;
    },

    clearReceiptData: (state) => {
      state.receiptData = null;
    },

    // Recent Transactions Actions
    addRecentTransaction: (state, action) => {
      state.recentTransactions = [
        action.payload,
        ...state.recentTransactions.slice(0, 4), // Keep only last 5
      ];
    },

    clearRecentTransactions: (state) => {
      state.recentTransactions = [];
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
    clearError: (state, action) => {
      const { errorType } = action.payload || {};
      if (errorType && state.errorStates[errorType]) {
        state.errorStates[errorType] = null;
      } else {
        Object.keys(state.errorStates).forEach((key) => {
          state.errorStates[key] = null;
        });
      }
    },

    // Clear transaction data
    clearTransactionData: (state) => {
      state.transactionDetails = null;
      state.receiptData = null;
      state.receiptGeneration = {
        loading: false,
        success: false,
        error: null,
        downloadUrl: null,
      };
      state.apiResponses = {
        manualDeposit: null,
        bankTransfer: null,
        cardDeposit: null,
        confirmTransaction: null,
      };
      state.errors = {
        manualDeposit: null,
        bankTransfer: null,
        cardDeposit: null,
        confirmTransaction: null,
      };
      state.successStates = {
        manualDeposit: false,
        bankTransfer: false,
        cardDeposit: false,
        confirmTransaction: false,
      };
    },

    // Reset transactions
    resetTransactions: () => initialState,
  },

  extraReducers: (builder) => {
    // ===================== MANUAL DEPOSIT TRANSACTION =====================
    builder
      .addCase(submitManualDepositTransaction.pending, (state) => {
        state.loadingStates.submitManualDeposit = true;
        state.errorStates.submitManualDeposit = null;
        state.processing = true;
        state.processingError = null;
      })
      .addCase(submitManualDepositTransaction.fulfilled, (state, action) => {
        state.loadingStates.submitManualDeposit = false;
        state.processing = false;

        // Store transaction details
        state.transactionDetails = {
          transactionId: action.payload.transaction_id || action.payload.id,
          status: "pending",
          type: "manual_deposit",
          timestamp: Date.now(),
          details: action.payload,
        };

        // Store API response
        state.apiResponses.manualDeposit = action.payload;
        state.successStates.manualDeposit = true;

        // Add to recent transactions
        if (action.payload.transaction_id) {
          state.recentTransactions = [
            {
              id: action.payload.transaction_id,
              type: "manual_deposit",
              status: "pending",
              amount: action.payload.send_amount,
              currency: action.payload.from_currency,
              timestamp: Date.now(),
              beneficiary: action.payload.beneficiary_name,
            },
            ...state.recentTransactions.slice(0, 4),
          ];
        }
      })
      .addCase(submitManualDepositTransaction.rejected, (state, action) => {
        state.loadingStates.submitManualDeposit = false;
        state.errorStates.submitManualDeposit =
          action.payload || action.error.message;
        state.processing = false;
        state.processingError = action.payload || action.error.message;

        // Store error
        state.errors.manualDeposit = action.payload || action.error.message;
        state.successStates.manualDeposit = false;
      });

    // ===================== BANK TRANSFER TRANSACTION =====================
    builder
      .addCase(submitBankTransferTransaction.pending, (state) => {
        state.loadingStates.submitBankTransfer = true;
        state.errorStates.submitBankTransfer = null;
        state.processing = true;
        state.processingError = null;
      })
      .addCase(submitBankTransferTransaction.fulfilled, (state, action) => {
        state.loadingStates.submitBankTransfer = false;
        state.processing = false;

        // Store transaction details
        state.transactionDetails = {
          transactionId: action.payload.transaction_id || action.payload.id,
          status: action.payload.status || "pending",
          type: "bank_transfer",
          timestamp: Date.now(),
          details: action.payload,
        };

        // Store API response
        state.apiResponses.bankTransfer = action.payload;
        state.successStates.bankTransfer = true;

        // Add to recent transactions
        if (action.payload.transaction_id) {
          state.recentTransactions = [
            {
              id: action.payload.transaction_id,
              type: "bank_transfer",
              status: action.payload.status || "pending",
              amount: action.payload.send_amount,
              currency: action.payload.from_currency,
              timestamp: Date.now(),
              beneficiary: action.payload.beneficiary_name,
            },
            ...state.recentTransactions.slice(0, 4),
          ];
        }

        // Update transaction status
        state.transactionStatus = {
          id: action.payload.transaction_id,
          isSuccessful: true,
          message: "Transaction submitted successfully",
        };
      })
      .addCase(submitBankTransferTransaction.rejected, (state, action) => {
        state.loadingStates.submitBankTransfer = false;
        state.errorStates.submitBankTransfer =
          action.payload || action.error.message;
        state.processing = false;
        state.processingError = action.payload || action.error.message;

        // Store error
        state.errors.bankTransfer = action.payload || action.error.message;
        state.successStates.bankTransfer = false;

        // Update transaction status
        state.transactionStatus = {
          id: null,
          isSuccessful: false,
          message: action.payload || "Transaction failed",
        };
      });

    // ===================== CARD DEPOSIT TRANSACTION =====================
    builder
      .addCase(submitCardDepositTransaction.pending, (state) => {
        state.loadingStates.submitCardDeposit = true;
        state.errorStates.submitCardDeposit = null;
        state.processing = true;
        state.processingError = null;
      })
      .addCase(submitCardDepositTransaction.fulfilled, (state, action) => {
        state.loadingStates.submitCardDeposit = false;
        state.processing = false;

        if (action.payload.type === "card_deposit_redirect") {
          // Store data for card page redirect
          state.transactionDetails = {
            type: "card_deposit",
            status: "redirecting",
            redirectData: action.payload.data,
            customerId: action.payload.customerId,
            timestamp: Date.now(),
          };

          // Set flag for UI to handle redirect
          state.requiresCardRedirect = true;
        }
      })
      .addCase(submitCardDepositTransaction.rejected, (state, action) => {
        state.loadingStates.submitCardDeposit = false;
        state.errorStates.submitCardDeposit =
          action.payload || action.error.message;
        state.processing = false;
        state.processingError = action.payload || action.error.message;

        // Store error
        state.errors.cardDeposit = action.payload || action.error.message;
        state.successStates.cardDeposit = false;
      });

    // ===================== CONFIRM TRANSACTION =====================
    builder
      .addCase(confirmTransaction.pending, (state) => {
        state.loadingStates.confirmTransaction = true;
        state.errorStates.confirmTransaction = null;
        state.processing = true;
        state.processingError = null;
      })
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        state.loadingStates.confirmTransaction = false;
        state.processing = false;

        if (action.payload.type === "redirect") {
          // Handle redirect case (card deposit)
          state.transactionDetails = {
            type: "redirect",
            status: "redirecting",
            timestamp: Date.now(),
          };
        } else {
          // Store transaction success
          state.transactionDetails = {
            transactionId: action.payload.transaction_id || action.payload.id,
            status: "success",
            type: action.payload.type || "confirmed",
            timestamp: Date.now(),
            details: action.payload,
          };

          // Store API response
          state.apiResponses.confirmTransaction = action.payload;
          state.successStates.confirmTransaction = true;

          // Update transaction summary
          state.transactionSummary = {
            id: action.payload.transaction_id,
            status: "completed",
            amount: action.payload.send_amount,
            currency: action.payload.from_currency,
            timestamp: Date.now(),
            fee: action.payload.fee,
            exchangeRate: action.payload.exchange_rate,
          };
        }
      })
      .addCase(confirmTransaction.rejected, (state, action) => {
        state.loadingStates.confirmTransaction = false;
        state.errorStates.confirmTransaction =
          action.payload || action.error.message;
        state.processing = false;
        state.processingError = action.payload || action.error.message;

        // Store error
        state.errors.confirmTransaction =
          action.payload || action.error.message;
        state.successStates.confirmTransaction = false;
      });

    // ===================== RECEIPT GENERATION =====================
    builder
      .addCase(generateReceipt.pending, (state) => {
        state.loadingStates.generateReceipt = true;
        state.errorStates.generateReceipt = null;
        state.receiptGeneration.loading = true;
        state.receiptGeneration.error = null;
      })
      .addCase(generateReceipt.fulfilled, (state, action) => {
        state.loadingStates.generateReceipt = false;
        state.receiptGeneration.loading = false;
        state.receiptGeneration.success = true;

        // Store receipt data
        state.receiptData = action.payload;
        state.receiptGeneration.downloadUrl =
          action.payload.download_url || action.payload.pdf_url;

        // Update receipt status
        state.receiptStatus = {
          generated: true,
          timestamp: Date.now(),
          transactionId: action.payload.transaction_id,
        };
      })
      .addCase(generateReceipt.rejected, (state, action) => {
        state.loadingStates.generateReceipt = false;
        state.errorStates.generateReceipt =
          action.payload || action.error.message;
        state.receiptGeneration.loading = false;
        state.receiptGeneration.error = action.payload || action.error.message;
        state.receiptGeneration.success = false;

        // Update receipt status
        state.receiptStatus = {
          generated: false,
          error: action.payload || action.error.message,
          timestamp: Date.now(),
        };
      });
  },
});

// Export actions
export const {
  setProcessing,
  setProcessingError,
  clearProcessing,
  setTransactionDetails,
  clearTransactionDetails,
  setReceiptData,
  clearReceiptData,
  addRecentTransaction,
  clearRecentTransactions,
  clearLoading,
  clearError,
  clearTransactionData,
  resetTransactions,
} = remittanceTransactionsSlice.actions;

// Export selectors
export const selectRemittanceTransactions = (state) =>
  state.remittanceTransactions;
export const selectProcessing = (state) =>
  state.remittanceTransactions.processing;
export const selectProcessingError = (state) =>
  state.remittanceTransactions.processingError;
export const selectTransactionDetails = (state) =>
  state.remittanceTransactions.transactionDetails;
export const selectReceiptData = (state) =>
  state.remittanceTransactions.receiptData;
export const selectApiResponses = (state) =>
  state.remittanceTransactions.apiResponses;
export const selectErrors = (state) => state.remittanceTransactions.errors;
export const selectSuccessStates = (state) =>
  state.remittanceTransactions.successStates;
export const selectReceiptGeneration = (state) =>
  state.remittanceTransactions.receiptGeneration;
export const selectRecentTransactions = (state) =>
  state.remittanceTransactions.recentTransactions;

// Derived selectors - FIXED VERSION
export const selectTransactionStatus = (state) => {
  const details = state.remittanceTransactions.transactionDetails;
  if (!details) {
    return { isSuccessful: false, message: "No transaction" };
  }

  return {
    id: details.transactionId,
    isSuccessful: details.status === "success",
    message:
      details.status === "success"
        ? "Transaction successful"
        : "Transaction processing",
    status: details.status,
    type: details.type,
  };
};

export const selectIsTransactionSuccessful = (state) => {
  const status = selectTransactionStatus(state);
  return status.isSuccessful;
};

export const selectTransactionErrors = (state) => {
  const errors = state.remittanceTransactions.errors;
  const errorMessages = Object.values(errors).filter((error) => error !== null);
  return errorMessages.length > 0 ? errorMessages : null;
};

export const selectReceiptStatus = (state) => {
  const generation = state.remittanceTransactions.receiptGeneration;
  return {
    canGenerate:
      !!state.remittanceTransactions.transactionDetails?.transactionId,
    isGenerating: generation.loading,
    isGenerated: generation.success,
    error: generation.error,
    downloadUrl: generation.downloadUrl,
  };
};

export const selectTransactionSummary = (state) => {
  const details = state.remittanceTransactions.transactionDetails;
  if (!details) return null;

  return {
    id: details.transactionId,
    status: details.status,
    type: details.type,
    amount: details.details?.send_amount,
    currency: details.details?.from_currency,
    fee: details.details?.fee,
    exchangeRate: details.details?.exchange_rate,
    timestamp: details.timestamp,
    beneficiary: details.details?.beneficiary_name,
  };
};

export default remittanceTransactionsSlice.reducer;
