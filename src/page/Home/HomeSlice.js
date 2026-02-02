// src/components/Dashboard/Home/HomeSlice.js - UPDATED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../services/api";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;

// ✅ REQUEST DEDUPLICATION TRACKER
const pendingRequests = new Map();

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? "refresh" : "initial"}`;
};

// ✅ Helper function to extract error message
const extractErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data) return JSON.stringify(error.response.data);
  return 'An unknown error occurred';
};

// ✅ CORRECTED: Home-specific FX currencies thunk with "home/" prefix
export const fetchPartnerFxCurrencies = createAsyncThunk(
  "home/fetchPartnerFxCurrencies",
  async (bearertoken, { rejectWithValue }) => {
    try {
      if (!bearertoken) {
        throw new Error("Bearer token missing");
      }

      const isWhiteLabelled = localStorage.getItem("iswhitelabelledpartner");
      const partnerId =
        isWhiteLabelled === "1"
          ? localStorage.getItem("whitelabelledpartnerid") || "9"
          : "9";

      const response = await api.post(
        `/partner-fxcurrencies?partner_id=${partnerId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
          timeout: 10000,
        }
      );

      return response.data.rates || [];
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ✅ OPTIMIZED ASYNC THUNK WITH DEDUPLICATION
export const fetchAccountDetails = createAsyncThunk(
  "home/fetchAccountDetails",
  async (
    { customerId, authtoken, isRefresh = false },
    { getState, rejectWithValue }
  ) => {
    const requestKey = getRequestKey(customerId, isRefresh);

    // Check if request already in progress
    if (pendingRequests.has(requestKey)) {
      return rejectWithValue("Request already in progress");
    }

    // Track this request
    pendingRequests.set(requestKey, true);

    try {
      const response = await api.get(`/active-account-details/${customerId}`, {
        headers: { Authorization: `Bearer ${authtoken}` },
        timeout: 30000,
      });

      if (response.data.message === "Unauthenticated.") {
        return rejectWithValue("Unauthenticated");
      }

      return response.data;
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        return rejectWithValue("Request timeout - please try again");
      }

      if (error.response?.status === 401) {
        return rejectWithValue("Unauthenticated");
      }

      return rejectWithValue(extractErrorMessage(error));
    } finally {
      // Always remove from tracking
      pendingRequests.delete(requestKey);
    }
  }
);

// ✅ ADDED: updateAccountBalance thunk
export const updateAccountBalance = createAsyncThunk(
  "home/updateAccountBalance",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      // First update the balance
      const updateResponse = await api.get(`/transaction-balance`, {
        headers: { Authorization: `Bearer ${authtoken}` },
        timeout: 30000,
      });

      if (updateResponse.data.status !== "success") {
        throw new Error("Failed to update balance");
      }

      // Then fetch updated account details
      const balanceResponse = await api.get(
        `/active-account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
          timeout: 30000,
        }
      );

      if (balanceResponse.data.message === "Unauthenticated.") {
        return rejectWithValue("Unauthenticated");
      }

      return balanceResponse.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const initialState = {
  // Account data
  accountData: { account_details: [] },
  selectedAccount: null,
  selectedCurrency: "",
  currencyOptions: [],

  // FX data states
  partnerFxCurrencies: [],
  hasFxData: false,
  fxLoading: false,
  fxError: null,

  // Loading states
  initialLoading: true,
  isLoading: false,
  refreshing: false,
  childComponentsLoading: 0,
  balanceLoading: false,

  // UI state
  lastUpdated: null,
  textColor: localStorage.getItem("text_color") || "#000000",
  hasFetchedAccount: false,
  accountDropdownOpen: false,

  // Error state
  error: null,
  accountError: null,
};

const homeSlice = createSlice({
  name: "home",
  initialState,
  reducers: {
    setSelectedAccount: (state, action) => {
      state.selectedAccount = action.payload;
      if (action.payload?.currency) {
        state.selectedCurrency = action.payload.currency;
      }
    },
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
      
      // Update selected account when currency changes
      if (state.accountData.account_details?.length > 0 && action.payload) {
        const matchingAccount = state.accountData.account_details.find(
          (account) => account.currency === action.payload
        );
        if (matchingAccount) {
          state.selectedAccount = matchingAccount;
        }
      }
    },
    setAccountDropdownOpen: (state, action) => {
      state.accountDropdownOpen = action.payload;
    },
    setInitialLoading: (state, action) => {
      state.initialLoading = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    setBalanceLoading: (state, action) => {
      state.balanceLoading = action.payload;
    },
    setLastUpdated: (state, action) => {
      state.lastUpdated = action.payload;
    },
    setTextColor: (state, action) => {
      state.textColor = action.payload;
    },
    setError: (state, action) => {
      state.error = typeof action.payload === "string"
        ? action.payload
        : extractErrorMessage(action.payload);
    },
    setAccountError: (state, action) => {
      state.accountError = typeof action.payload === "string"
        ? action.payload
        : extractErrorMessage(action.payload);
    },
    startChildLoading: (state) => {
      state.childComponentsLoading += 1;
    },
    stopChildLoading: (state) => {
      state.childComponentsLoading = Math.max(
        0,
        state.childComponentsLoading - 1
      );
    },
    resetChildLoading: (state) => {
      state.childComponentsLoading = 0;
    },
    setHasFetchedAccount: (state, action) => {
      state.hasFetchedAccount = action.payload;
    },
    clearHomeState: (state) => {
      return {
        ...initialState,
        hasFetchedAccount: state.hasFetchedAccount,
      };
    },
    resetLoadingStates: (state) => {
      state.initialLoading = false;
      state.isLoading = false;
      state.refreshing = false;
      state.childComponentsLoading = 0;
      state.balanceLoading = false;
    },
    resetFetchFlag: (state) => {
      state.hasFetchedAccount = false;
    },
    clearSuccessfulFetch: (state, action) => {
      const customerId = action.payload;
      // Reset fetch flag for specific customer
      state.hasFetchedAccount = false;
      console.log(`🔄 HomeSlice: Cleared fetch flag for customer ${customerId}`);
    },
    // FX-related reducers
    setFxLoading: (state, action) => {
      state.fxLoading = action.payload;
    },
    clearFxError: (state) => {
      state.fxError = null;
    },
    resetFxState: (state) => {
      state.partnerFxCurrencies = [];
      state.hasFxData = false;
      state.fxLoading = false;
      state.fxError = null;
    },
    // Debug actions
    debugAccountState: (state) => {
      console.log("🔍 HomeSlice Debug:", {
        accountsCount: state.accountData.account_details?.length || 0,
        selectedAccount: state.selectedAccount,
        selectedCurrency: state.selectedCurrency,
        hasFetchedAccount: state.hasFetchedAccount,
        loading: state.isLoading,
        initialLoading: state.initialLoading,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Account details cases
      .addCase(fetchAccountDetails.pending, (state, action) => {
        const isRefresh = action.meta.arg?.isRefresh;

        if (isRefresh) {
          state.refreshing = true;
        } else {
          state.initialLoading = !state.hasFetchedAccount;
          state.isLoading = true;
        }
        state.error = null;
        state.accountError = null;
      })
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        state.accountData = action.payload;
        
        if (action.payload.account_details?.length) {
          const currencies = [
            ...new Set(
              action.payload.account_details.map((acc) => acc.currency)
            ),
          ];
          state.currencyOptions = currencies;

          // Set selected account and currency if not set or refresh
          if (!state.selectedCurrency || action.meta.arg?.isRefresh) {
            state.selectedCurrency = currencies[0] || "";
            state.selectedAccount = action.payload.account_details[0] || null;
          } else {
            // Ensure selected account matches selected currency
            const matchingAccount = action.payload.account_details.find(
              (account) => account.currency === state.selectedCurrency
            );
            if (matchingAccount) {
              state.selectedAccount = matchingAccount;
            } else if (action.payload.account_details[0]) {
              state.selectedAccount = action.payload.account_details[0];
              state.selectedCurrency = action.payload.account_details[0].currency;
            }
          }
        }

        state.lastUpdated = new Date().toISOString();
        state.initialLoading = false;
        state.isLoading = false;
        state.refreshing = false;
        state.hasFetchedAccount = true;
        state.error = null;
        state.accountError = null;
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        state.initialLoading = false;
        state.isLoading = false;
        state.refreshing = false;

        state.error = typeof action.payload === "string"
          ? action.payload
          : String(action.payload);
        state.accountError = state.error;

        // Auto-reset child loading after error
        state.childComponentsLoading = 0;
      })
      
      // Update account balance cases
      .addCase(updateAccountBalance.pending, (state) => {
        state.balanceLoading = true;
        state.accountError = null;
      })
      .addCase(updateAccountBalance.fulfilled, (state, action) => {
        state.accountData = action.payload;
        
        if (action.payload.account_details?.length) {
          // Preserve selected account if possible
          if (state.selectedAccount) {
            const updatedAccount = action.payload.account_details.find(
              (account) => account.currency === state.selectedAccount.currency
            );
            if (updatedAccount) {
              state.selectedAccount = updatedAccount;
            }
          }
        }
        
        state.lastUpdated = new Date().toISOString();
        state.balanceLoading = false;
        state.accountError = null;
      })
      .addCase(updateAccountBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.accountError = typeof action.payload === "string"
          ? action.payload
          : String(action.payload);
      })

      // FX currencies cases
      .addCase(fetchPartnerFxCurrencies.pending, (state) => {
        state.fxLoading = true;
        state.fxError = null;
      })
      .addCase(fetchPartnerFxCurrencies.fulfilled, (state, action) => {
        state.fxLoading = false;
        state.partnerFxCurrencies = action.payload;
        state.hasFxData = action.payload.length > 0;
        state.fxError = null;
      })
      .addCase(fetchPartnerFxCurrencies.rejected, (state, action) => {
        state.fxLoading = false;
        state.fxError = typeof action.payload === "string"
          ? action.payload
          : String(action.payload);
        state.hasFxData = false;
      });
  },
});

// ✅ SELECTORS
export const selectHome = (state) => state.home;
export const selectAccountData = (state) => state.home.accountData;
export const selectAccounts = (state) =>
  state.home.accountData?.account_details || [];
export const selectSelectedAccount = (state) => state.home.selectedAccount;
export const selectSelectedCurrency = (state) => state.home.selectedCurrency;
export const selectCurrencyOptions = (state) => state.home.currencyOptions;
export const selectInitialLoading = (state) => state.home.initialLoading;
export const selectIsLoading = (state) => state.home.isLoading;
export const selectAccountLoading = (state) =>
  state.home.initialLoading || state.home.isLoading;
export const selectRefreshing = (state) => state.home.refreshing;
export const selectBalanceLoading = (state) => state.home.balanceLoading;
export const selectChildComponentsLoading = (state) =>
  state.home.childComponentsLoading;
export const selectLastUpdated = (state) => state.home.lastUpdated;
export const selectTextColor = (state) => state.home.textColor;
export const selectError = (state) => state.home.error;
export const selectAccountError = (state) => state.home.accountError;
export const selectHasFetchedAccount = (state) => state.home.hasFetchedAccount;
export const selectAccountDropdownOpen = (state) => state.home.accountDropdownOpen;

// FX selectors
export const selectPartnerFxCurrencies = (state) =>
  state.home.partnerFxCurrencies;
export const selectHasFxData = (state) => state.home.hasFxData;
export const selectFxLoading = (state) => state.home.fxLoading;
export const selectFxError = (state) => state.home.fxError;

// Derived selectors
export const selectIsAnyLoading = (state) =>
  state.home.initialLoading ||
  state.home.isLoading ||
  state.home.childComponentsLoading > 0 ||
  state.home.fxLoading ||
  state.home.balanceLoading;

export const selectAccountsByCurrency = (state) => {
  const { accountData, selectedCurrency } = state.home;
  if (accountData.account_details?.length > 0 && selectedCurrency) {
    return (
      accountData.account_details.filter(
        (account) => account.currency === selectedCurrency
      ) || []
    );
  }
  return [];
};

export const selectAccountState = (state) => ({
  accounts: selectAccounts(state),
  selectedAccount: selectSelectedAccount(state),
  selectedCurrency: selectSelectedCurrency(state),
  accountLoading: selectAccountLoading(state),
  balanceLoading: selectBalanceLoading(state),
  accountError: selectAccountError(state),
  hasFetchedAccount: selectHasFetchedAccount(state),
  lastUpdated: selectLastUpdated(state),
  accountDropdownOpen: selectAccountDropdownOpen(state),
});

// ✅ ACTIONS
export const {
  setSelectedAccount,
  setSelectedCurrency,
  setAccountDropdownOpen,
  setInitialLoading,
  setLoading,
  setRefreshing,
  setBalanceLoading,
  setLastUpdated,
  setTextColor,
  setError,
  setAccountError,
  startChildLoading,
  stopChildLoading,
  resetChildLoading,
  setHasFetchedAccount,
  clearHomeState,
  resetLoadingStates,
  resetFetchFlag,
  clearSuccessfulFetch,
  // FX actions
  setFxLoading,
  clearFxError,
  resetFxState,
  // Debug actions
  debugAccountState,
} = homeSlice.actions;

export default homeSlice.reducer;