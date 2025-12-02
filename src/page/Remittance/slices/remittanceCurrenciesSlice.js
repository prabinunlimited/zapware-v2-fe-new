// src/features/Remittance/slices/remittanceCurrenciesSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPayoutCurrencies,
  fetchBankAccountDetails,
  fetchManualAccountDetails,
  fetchExchangeRate,
} from "../thunks/remittanceThunks";

const initialState = {
  // Currency Selection
  sendCurrency: null,
  receiveCurrency: null,

  // Currency Data
  payoutCurrenciesData: [],
  bankAccountDetails: [],
  currencyOptions: [],

  // Exchange Rate Data
  exchangeRateData: {
    rate: 0,
    fee: 0,
    expiresAt: null,
    conversionId: null,
    loading: false,
    error: null,
    lastUpdated: null,
    fromCache: false,
  },

  // Manual Account Details
  manualAccountDetails: null,
  manualDetailsLoading: false,
  aedAccountDetails: null,

  // Bank Details
  bankDetails: [],

  // Loading states for thunks
  loadingStates: {
    payoutCurrencies: false,
    bankAccountDetails: false,
    manualAccountDetails: false,
    exchangeRate: false,
  },

  // Error states for thunks
  errorStates: {
    payoutCurrencies: null,
    bankAccountDetails: null,
    manualAccountDetails: null,
    exchangeRate: null,
  },
};

const remittanceCurrenciesSlice = createSlice({
  name: "remittanceCurrencies",
  initialState,
  reducers: {
    // Currency Actions
    setSendCurrency: (state, action) => {
      state.sendCurrency = action.payload;
    },

    setReceiveCurrency: (state, action) => {
      state.receiveCurrency = action.payload;
    },

    clearCurrencies: (state) => {
      state.sendCurrency = null;
      state.receiveCurrency = null;
      state.exchangeRateData = {
        rate: 0,
        fee: 0,
        expiresAt: null,
        conversionId: null,
        loading: false,
        error: null,
        lastUpdated: null,
        fromCache: false,
      };
    },

    // Exchange Rate Actions
    setExchangeRateData: (state, action) => {
      state.exchangeRateData = {
        ...state.exchangeRateData,
        ...action.payload,
      };
    },

    // Manual Account Actions
    setManualAccountDetails: (state, action) => {
      state.manualAccountDetails = action.payload;
    },

    clearManualAccountDetails: (state) => {
      state.manualAccountDetails = null;
      state.manualDetailsLoading = false;
    },

    // Bank Details Actions
    setBankDetails: (state, action) => {
      state.bankDetails = action.payload;
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

    // Reset currencies
    resetCurrencies: (state) => {
      return {
        ...initialState,
        sendCurrency: state.sendCurrency, // Keep send currency
        receiveCurrency: state.receiveCurrency, // Keep receive currency
      };
    },
  },

  extraReducers: (builder) => {
    // ===================== PAYOUT CURRENCIES =====================
    builder
      .addCase(fetchPayoutCurrencies.pending, (state) => {
        state.loadingStates.payoutCurrencies = true;
        state.errorStates.payoutCurrencies = null;
      })
      .addCase(fetchPayoutCurrencies.fulfilled, (state, action) => {
        state.loadingStates.payoutCurrencies = false;
        state.payoutCurrenciesData = action.payload;

        // Convert to options format
        state.currencyOptions = action.payload.map((currency) => ({
          value: currency.currency_code,
          label: currency.currency_code,
          country: currency.country_name,
          flag: currency.flag,
          min_amount: currency.min_amount,
          max_amount: currency.max_amount,
        }));
      })
      .addCase(fetchPayoutCurrencies.rejected, (state, action) => {
        state.loadingStates.payoutCurrencies = false;
        state.errorStates.payoutCurrencies =
          action.payload || action.error.message;
        state.payoutCurrenciesData = [];
        state.currencyOptions = [];
      });

    // ===================== BANK ACCOUNT DETAILS =====================
    builder
      .addCase(fetchBankAccountDetails.pending, (state) => {
        state.loadingStates.bankAccountDetails = true;
        state.errorStates.bankAccountDetails = null;
      })
      .addCase(fetchBankAccountDetails.fulfilled, (state, action) => {
        state.loadingStates.bankAccountDetails = false;
        const { accounts, defaultCurrencyCode } = action.payload;
        state.bankAccountDetails = accounts;

        // Update bank details
        if (accounts.length > 0) {
          state.bankDetails = accounts.map((account) => ({
            id: account.id,
            account_name: account.account_name,
            account_number: account.account_number,
            bank_name: account.bank_name,
            currency_code: account.currency_code,
            icon: account.icon,
            is_active: account.is_active,
          }));
        }

        // Set default send currency if provided
        if (defaultCurrencyCode && !state.sendCurrency) {
          // Create a proper currency object
          state.sendCurrency = {
            value: defaultCurrencyCode,
            label: defaultCurrencyCode,
          };
        }
      })
      .addCase(fetchBankAccountDetails.rejected, (state, action) => {
        state.loadingStates.bankAccountDetails = false;
        state.errorStates.bankAccountDetails =
          action.payload || action.error.message;
        state.bankAccountDetails = [];
        state.bankDetails = [];
      });

    // ===================== MANUAL ACCOUNT DETAILS =====================
    builder
      .addCase(fetchManualAccountDetails.pending, (state) => {
        state.loadingStates.manualAccountDetails = true;
        state.errorStates.manualAccountDetails = null;
        state.manualDetailsLoading = true;
      })
      .addCase(fetchManualAccountDetails.fulfilled, (state, action) => {
        state.loadingStates.manualAccountDetails = false;
        state.manualDetailsLoading = false;
        state.manualAccountDetails = action.payload;

        // If it's USD, also update aedAccountDetails for compatibility
        if (action.payload.currency === "USD") {
          state.aedAccountDetails = {
            account_name: action.payload.account_name,
            account_number: action.payload.account_number,
            bank_name: action.payload.bank_name,
            routing_number: action.payload.routing_number,
            swift_code: action.payload.swift_code,
            bank_address: action.payload.bank_address,
            account_type: action.payload.account_type,
          };
        }
      })
      .addCase(fetchManualAccountDetails.rejected, (state, action) => {
        state.loadingStates.manualAccountDetails = false;
        state.errorStates.manualAccountDetails =
          action.payload || action.error.message;
        state.manualDetailsLoading = false;
        state.manualAccountDetails = null;
      });

    // ===================== EXCHANGE RATE =====================
    builder
      .addCase(fetchExchangeRate.pending, (state) => {
        state.loadingStates.exchangeRate = true;
        state.errorStates.exchangeRate = null;
        state.exchangeRateData = {
          ...state.exchangeRateData,
          loading: true,
          error: null,
        };
      })
      .addCase(fetchExchangeRate.fulfilled, (state, action) => {
        state.loadingStates.exchangeRate = false;

        const { rate, fee, expiresAt, conversionId, fromCache } =
          action.payload;

        state.exchangeRateData = {
          rate: rate || 0,
          fee: fee || 0,
          expiresAt: expiresAt || null,
          conversionId: conversionId || null,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
          fromCache: fromCache || false,
        };
      })
      .addCase(fetchExchangeRate.rejected, (state, action) => {
        state.loadingStates.exchangeRate = false;
        state.errorStates.exchangeRate = action.payload || action.error.message;

        state.exchangeRateData = {
          ...state.exchangeRateData,
          loading: false,
          error: action.payload || action.error.message,
          lastUpdated: Date.now(),
        };
      });
  },
});

// Export actions
export const {
  setSendCurrency,
  setReceiveCurrency,
  clearCurrencies,
  setExchangeRateData,
  setManualAccountDetails,
  clearManualAccountDetails,
  setBankDetails,
  clearLoading,
  clearError,
  resetCurrencies,
} = remittanceCurrenciesSlice.actions;

// Export selectors
export const selectRemittanceCurrencies = (state) => state.remittanceCurrencies;
export const selectSendCurrency = (state) =>
  state.remittanceCurrencies.sendCurrency;
export const selectReceiveCurrency = (state) =>
  state.remittanceCurrencies.receiveCurrency;
export const selectPayoutCurrenciesData = (state) =>
  state.remittanceCurrencies.payoutCurrenciesData;
export const selectBankAccountDetails = (state) =>
  state.remittanceCurrencies.bankAccountDetails;
export const selectExchangeRateData = (state) =>
  state.remittanceCurrencies.exchangeRateData;
export const selectManualAccountDetails = (state) =>
  state.remittanceCurrencies.manualAccountDetails;
export const selectManualDetailsLoading = (state) =>
  state.remittanceCurrencies.manualDetailsLoading;
export const selectBankDetails = (state) =>
  state.remittanceCurrencies.bankDetails;
export const selectCurrencyOptions = (state) =>
  state.remittanceCurrencies.currencyOptions;

// Derived selectors - also need updating
export const selectIsEuropeUKTransfer = (state) => {
  const sendCurrency = state.remittanceCurrencies.sendCurrency?.value;
  const receiveCurrency = state.remittanceCurrencies.receiveCurrency?.value;
  return (
    (sendCurrency === "GBP" || sendCurrency === "EUR") &&
    receiveCurrency === "KES"
  );
};

export const selectExchangeRateInfo = (state) => ({
  rate: state.remittanceCurrencies.exchangeRateData.rate,
  fee: state.remittanceCurrencies.exchangeRateData.fee,
  totalFee: state.remittanceCurrencies.exchangeRateData.fee,
  expiry: state.remittanceCurrencies.exchangeRateData.expiresAt,
  convertedAmount: 0,
  loading: state.remittanceCurrencies.exchangeRateData.loading,
  error: state.remittanceCurrencies.exchangeRateData.error,
});

export const selectIsManualPaymentReady = (state) => {
  return (
    !!state.remittanceCurrencies.manualAccountDetails &&
    !state.remittanceCurrencies.manualDetailsLoading
  );
};

export default remittanceCurrenciesSlice.reducer;