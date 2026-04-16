// src/page/Home/HomeSlice.js - COMPLETE REFACTORED VERSION WITH RTK QUERY INTEGRATION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../services/api";
import { transactionApi } from "../../services/transactionApi";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;

// ============================================
// REQUEST DEDUPLICATION TRACKER
// ============================================
const pendingRequests = new Map();

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? "refresh" : "initial"}`;
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const extractErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data) return JSON.stringify(error.response.data);
  return "An unknown error occurred";
};

const safeArray = (data, fallback = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (typeof data === "object" && !Array.isArray(data)) {
    if (data.account_details && Array.isArray(data.account_details))
      return data.account_details;
    if (data.accounts && Array.isArray(data.accounts)) return data.accounts;
    if (Object.keys(data).length > 0) return Object.values(data);
  }
  return fallback;
};

// ============================================
// ASYNC THUNKS
// ============================================

// ✅ OPTIMIZED: Fetch account details with deduplication
export const fetchAccountDetails = createAsyncThunk(
  "home/fetchAccountDetails",
  async (
    { customerId, authtoken, isRefresh = false },
    { getState, rejectWithValue },
  ) => {
    const requestKey = getRequestKey(customerId, isRefresh);

    // Check if request already in progress
    if (pendingRequests.has(requestKey)) {
      console.log(`⏳ Account fetch already in progress for ${customerId}`);
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

      console.log(`✅ Account details fetched successfully for ${customerId}`);
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
  },
);

// ✅ ADDED: Update account balance thunk
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
        },
      );

      if (balanceResponse.data.message === "Unauthenticated.") {
        return rejectWithValue("Unauthenticated");
      }

      console.log(`✅ Balance updated successfully for ${customerId}`);
      return balanceResponse.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

// ✅ NEW: Fetch transaction details using RTK Query integration
export const fetchTransactionDetails = createAsyncThunk(
  "home/fetchTransactionDetails",
  async (
    { customerId, currencyCode, forceRefresh = false },
    { dispatch, rejectWithValue },
  ) => {
    try {
      if (!customerId || !currencyCode || currencyCode === "all") {
        return [];
      }

      console.log(
        `🔄 HomeSlice: Fetching transactions for ${currencyCode}${forceRefresh ? " (force refresh)" : ""}`,
      );

      // Use RTK Query's built-in caching
      const result = await dispatch(
        transactionApi.endpoints.getTransactions.initiate(
          { customerId, currencyCode },
          {
            forceRefetch: forceRefresh,
            subscribe: false, // Don't auto-subscribe, we'll handle manually
          },
        ),
      );

      if (result.data) {
        console.log(
          `✅ HomeSlice: Transactions fetched successfully for ${currencyCode}`,
        );
        return result.data;
      } else if (result.error) {
        throw new Error(result.error.message || "Failed to fetch transactions");
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        `❌ HomeSlice: Failed to fetch transactions for ${currencyCode}`,
        error,
      );
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

// ✅ NEW: Force refresh transactions (invalidates cache)
export const forceRefreshTransactions = createAsyncThunk(
  "home/forceRefreshTransactions",
  async ({ customerId, currencyCode }, { dispatch }) => {
    console.log(
      `🔄 HomeSlice: Force refreshing transactions for ${currencyCode}`,
    );

    // Invalidate the RTK Query cache for this query
    dispatch(
      transactionApi.util.invalidateTags([
        { type: "Transaction", id: `${customerId}-${currencyCode}` },
      ]),
    );

    // Then fetch fresh data
    const result = await dispatch(
      fetchTransactionDetails({ customerId, currencyCode, forceRefresh: true }),
    );

    return result.payload;
  },
);

// ✅ Home-specific FX currencies thunk
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
        },
      );

      const rates = response.data.rates || [];
      console.log(
        `✅ FX currencies fetched successfully: ${rates.length} rates`,
      );
      return rates;
    } catch (error) {
      console.error("❌ fetchPartnerFxCurrencies error:", error);
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

// ============================================
// INITIAL STATE
// ============================================
const initialState = {
  // Account data
  accountData: { account_details: [] },
  selectedAccount: null,
  selectedCurrency: "",
  currencyOptions: [],

  // Transaction data (now managed by RTK Query, but we keep some state for UI)
  transactions: [],
  transactionLoading: false,
  transactionError: null,
  transactionLastFetched: null,

  // FX data states
  partnerFxCurrencies: [],
  hasFxData: false,
  fxLoading: false,
  fxError: null,

  // Loading states
  initialLoading: false,
  isLoading: false,
  refreshing: false,
  childComponentsLoading: 0,
  balanceLoading: false,

  // UI state
  lastUpdated: null,
  textColor: localStorage.getItem("text_color") || "#000000",
  hasFetchedAccount: false,
  accountDropdownOpen: false,

  // Cache tracking
  lastFetchTimestamps: {
    account: null,
    transactions: {},
    fx: null,
  },

  // Error state
  error: null,
  accountError: null,
};

// ============================================
// SLICE
// ============================================
const homeSlice = createSlice({
  name: "home",
  initialState,
  reducers: {
    // Account selection reducers
    setSelectedAccount: (state, action) => {
      state.selectedAccount = action.payload;
      if (action.payload?.currency) {
        state.selectedCurrency = action.payload.currency;
        // Also save to localStorage for persistence
        localStorage.setItem("selectedCurrency", action.payload.currency);
      }
    },

    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
      localStorage.setItem("selectedCurrency", action.payload);

      // Update selected account when currency changes
      if (state.accountData.account_details?.length > 0 && action.payload) {
        const matchingAccount = state.accountData.account_details.find(
          (account) => account.currency === action.payload,
        );
        if (matchingAccount) {
          state.selectedAccount = matchingAccount;
        }
      }
    },

    setAccountDropdownOpen: (state, action) => {
      state.accountDropdownOpen = action.payload;
    },

    // Loading state reducers
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
      localStorage.setItem("text_color", action.payload);
    },

    // Error reducers
    setError: (state, action) => {
      state.error =
        typeof action.payload === "string"
          ? action.payload
          : extractErrorMessage(action.payload);
    },

    setAccountError: (state, action) => {
      state.accountError =
        typeof action.payload === "string"
          ? action.payload
          : extractErrorMessage(action.payload);
    },

    // Child component loading tracking
    startChildLoading: (state) => {
      state.childComponentsLoading += 1;
    },

    stopChildLoading: (state) => {
      state.childComponentsLoading = Math.max(
        0,
        state.childComponentsLoading - 1,
      );
    },

    resetChildLoading: (state) => {
      state.childComponentsLoading = 0;
    },

    // Fetch flag management
    setHasFetchedAccount: (state, action) => {
      state.hasFetchedAccount = action.payload;
    },

    clearHomeState: (state) => {
      return {
        ...initialState,
        hasFetchedAccount: state.hasFetchedAccount,
        selectedCurrency: localStorage.getItem("selectedCurrency") || "",
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
      state.hasFetchedAccount = false;
      state.lastFetchTimestamps.account = null;
      console.log(
        `🔄 HomeSlice: Cleared fetch flag for customer ${customerId}`,
      );
    },

    // Transaction state management
    setTransactions: (state, action) => {
      state.transactions = action.payload;
      state.transactionLastFetched = new Date().toISOString();
    },

    setTransactionLoading: (state, action) => {
      state.transactionLoading = action.payload;
    },

    setTransactionError: (state, action) => {
      state.transactionError = action.payload;
    },

    clearTransactionCache: (state, action) => {
      const { currencyCode } = action.payload;
      if (currencyCode) {
        delete state.lastFetchTimestamps.transactions[currencyCode];
      } else {
        state.lastFetchTimestamps.transactions = {};
      }
      state.transactions = [];
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

    // Cache management
    clearAllCache: (state) => {
      state.lastFetchTimestamps = {
        account: null,
        transactions: {},
        fx: null,
      };
      state.hasFetchedAccount = false;
      state.transactions = [];
      console.log("🧹 HomeSlice: All cache cleared");
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
        transactionCount: state.transactions.length,
        transactionLoading: state.transactionLoading,
        cacheTimestamps: state.lastFetchTimestamps,
      });
    },
  },

  extraReducers: (builder) => {
    builder
      // ============================================
      // Account details cases
      // ============================================
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

        // Update last fetch timestamp
        state.lastFetchTimestamps.account = new Date().toISOString();

        // Process account details
        if (action.payload.account_details?.length) {
          const currencies = [
            ...new Set(
              action.payload.account_details.map((acc) => acc.currency),
            ),
          ];
          state.currencyOptions = currencies;

          // Set selected account and currency if not set or refresh
          const savedCurrency = localStorage.getItem("selectedCurrency");

          if (savedCurrency && currencies.includes(savedCurrency)) {
            // Use saved currency from localStorage
            state.selectedCurrency = savedCurrency;
            state.selectedAccount =
              action.payload.account_details.find(
                (account) => account.currency === savedCurrency,
              ) || action.payload.account_details[0];
          } else if (!state.selectedCurrency || action.meta.arg?.isRefresh) {
            state.selectedCurrency = currencies[0] || "";
            state.selectedAccount = action.payload.account_details[0] || null;
          } else {
            // Ensure selected account matches selected currency
            const matchingAccount = action.payload.account_details.find(
              (account) => account.currency === state.selectedCurrency,
            );
            if (matchingAccount) {
              state.selectedAccount = matchingAccount;
            } else if (action.payload.account_details[0]) {
              state.selectedAccount = action.payload.account_details[0];
              state.selectedCurrency =
                action.payload.account_details[0].currency;
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

        console.log(
          `✅ HomeSlice: Account data loaded, ${state.accountData.account_details?.length || 0} accounts found`,
        );
      })

      .addCase(fetchAccountDetails.rejected, (state, action) => {
        if (action.payload === "Request already in progress") {
          return;
        }

        state.initialLoading = false;
        state.isLoading = false;
        state.refreshing = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : String(action.payload);
        state.accountError = state.error;
        state.childComponentsLoading = 0;
      })

      // ============================================
      // Update account balance cases
      // ============================================
      .addCase(updateAccountBalance.pending, (state) => {
        state.balanceLoading = true;
        state.accountError = null;
      })

      .addCase(updateAccountBalance.fulfilled, (state, action) => {
        state.accountData = action.payload;

        // Update last fetch timestamp
        state.lastFetchTimestamps.account = new Date().toISOString();

        // Preserve selected account if possible
        if (action.payload.account_details?.length && state.selectedAccount) {
          const updatedAccount = action.payload.account_details.find(
            (account) => account.currency === state.selectedAccount.currency,
          );
          if (updatedAccount) {
            state.selectedAccount = updatedAccount;
          }
        }

        state.lastUpdated = new Date().toISOString();
        state.balanceLoading = false;
        state.accountError = null;

        console.log(`✅ HomeSlice: Balance updated successfully`);
      })

      .addCase(updateAccountBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.accountError =
          typeof action.payload === "string"
            ? action.payload
            : String(action.payload);

        console.error(
          `❌ HomeSlice: Balance update failed - ${state.accountError}`,
        );
      })

      // ============================================
      // Transaction details cases (RTK Query integration)
      // ============================================
      .addCase(fetchTransactionDetails.pending, (state, action) => {
        const { currencyCode } = action.meta.arg;
        state.transactionLoading = true;
        state.transactionError = null;
        console.log(
          `🔄 HomeSlice: Transaction fetch pending for ${currencyCode}`,
        );
      })

      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        const { currencyCode } = action.meta.arg;
        state.transactions = safeArray(action.payload);
        state.transactionLoading = false;
        state.transactionError = null;
        state.lastFetchTimestamps.transactions[currencyCode] =
          new Date().toISOString();

        console.log(
          `✅ HomeSlice: Transaction fetch successful for ${currencyCode}, ${state.transactions.length} transactions`,
        );
      })

      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to fetch transactions";

        console.error(
          `❌ HomeSlice: Transaction fetch failed - ${state.transactionError}`,
        );
      })

      // ============================================
      // Force refresh transactions
      // ============================================
      .addCase(forceRefreshTransactions.pending, (state, action) => {
        const { currencyCode } = action.meta.arg;
        state.transactionLoading = true;
        state.transactionError = null;
        console.log(
          `🔄 HomeSlice: Force refresh transactions for ${currencyCode}`,
        );
      })

      .addCase(forceRefreshTransactions.fulfilled, (state, action) => {
        const { currencyCode } = action.meta.arg;
        state.transactions = safeArray(action.payload);
        state.transactionLoading = false;
        state.transactionError = null;
        state.lastFetchTimestamps.transactions[currencyCode] =
          new Date().toISOString();

        console.log(
          `✅ HomeSlice: Force refresh successful for ${currencyCode}, ${state.transactions.length} transactions`,
        );
      })

      .addCase(forceRefreshTransactions.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to refresh transactions";

        console.error(
          `❌ HomeSlice: Force refresh failed - ${state.transactionError}`,
        );
      })

      // ============================================
      // FX currencies cases
      // ============================================
      .addCase(fetchPartnerFxCurrencies.pending, (state) => {
        state.fxLoading = true;
        state.fxError = null;
      })

      .addCase(fetchPartnerFxCurrencies.fulfilled, (state, action) => {
        state.fxLoading = false;
        state.partnerFxCurrencies = action.payload;
        state.hasFxData = action.payload.length > 0;
        state.fxError = null;
        state.lastFetchTimestamps.fx = new Date().toISOString();

        console.log(
          `✅ HomeSlice: FX currencies fetched, ${action.payload.length} rates available`,
        );
      })

      .addCase(fetchPartnerFxCurrencies.rejected, (state, action) => {
        state.fxLoading = false;
        state.fxError =
          typeof action.payload === "string"
            ? action.payload
            : String(action.payload);
        state.hasFxData = false;

        console.error(
          `❌ HomeSlice: FX currencies fetch failed - ${state.fxError}`,
        );
      });
  },
});

// ============================================
// SELECTORS
// ============================================

// Account selectors
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
export const selectAccountDropdownOpen = (state) =>
  state.home.accountDropdownOpen;

// Transaction selectors
export const selectTransactions = (state) => state.home.transactions;
export const selectTransactionLoading = (state) =>
  state.home.transactionLoading;
export const selectTransactionError = (state) => state.home.transactionError;
export const selectTransactionLastFetched = (state) =>
  state.home.transactionLastFetched;
export const selectHasFetchedTransactions = (state, currencyCode) => {
  return !!state.home.lastFetchTimestamps.transactions[currencyCode];
};

// FX selectors
export const selectPartnerFxCurrencies = (state) =>
  state.home.partnerFxCurrencies;
export const selectHasFxData = (state) => state.home.hasFxData;
export const selectFxLoading = (state) => state.home.fxLoading;
export const selectFxError = (state) => state.home.fxError;

// Cache selectors
export const selectLastFetchTimestamps = (state) =>
  state.home.lastFetchTimestamps;
export const selectAccountCacheAge = (state) => {
  const lastFetch = state.home.lastFetchTimestamps.account;
  if (!lastFetch) return null;
  return Date.now() - new Date(lastFetch).getTime();
};

// Derived selectors
export const selectIsAnyLoading = (state) =>
  state.home.initialLoading ||
  state.home.isLoading ||
  state.home.childComponentsLoading > 0 ||
  state.home.fxLoading ||
  state.home.balanceLoading ||
  state.home.transactionLoading;

export const selectAccountsByCurrency = (state) => {
  const { accountData, selectedCurrency } = state.home;
  if (accountData.account_details?.length > 0 && selectedCurrency) {
    return (
      accountData.account_details.filter(
        (account) => account.currency === selectedCurrency,
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

export const selectTransactionState = (state) => ({
  transactions: selectTransactions(state),
  loading: selectTransactionLoading(state),
  error: selectTransactionError(state),
  lastFetched: selectTransactionLastFetched(state),
});

// ============================================
// ACTIONS
// ============================================
export const {
  // Account actions
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

  // Transaction actions
  setTransactions,
  setTransactionLoading,
  setTransactionError,
  clearTransactionCache,

  // FX actions
  setFxLoading,
  clearFxError,
  resetFxState,

  // Cache actions
  clearAllCache,

  // Debug actions
  debugAccountState,
} = homeSlice.actions;

// ============================================
// UTILITY FUNCTIONS FOR COMPONENTS
// ============================================

/**
 * Utility to check if data needs refresh based on age
 */
export const shouldRefreshData = (
  lastFetchTimestamp,
  maxAge = 5 * 60 * 1000,
) => {
  if (!lastFetchTimestamp) return true;
  const age = Date.now() - new Date(lastFetchTimestamp).getTime();
  return age > maxAge;
};

/**
 * Utility to get cache age in human-readable format
 */
export const getCacheAge = (lastFetchTimestamp) => {
  if (!lastFetchTimestamp) return "Never";
  const age = Date.now() - new Date(lastFetchTimestamp).getTime();
  const minutes = Math.floor(age / 60000);
  const seconds = Math.floor((age % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
};

export default homeSlice.reducer;
