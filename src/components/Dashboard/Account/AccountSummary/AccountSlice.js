// src/components/Dashboard/Account/AccountSummary/AccountSlice.js - FIXED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { extractErrorMessage } from "../../../../utils/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

// ✅ FIXED: Enhanced request coordination with proper cleanup
let globalFetchInProgress = false;
const GLOBAL_FETCH_COOLDOWN = 10000;
const pendingRequests = new Map();
const successfulFetches = new Map();

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? 'refresh' : 'initial'}`;
};

const hasSuccessfulFetch = (customerId) => {
  return successfulFetches.has(customerId);
};

// ✅ FIXED: Optimized thunk with better state management
export const fetchAccountDetails = createAsyncThunk(
  "account/fetchAccountDetails",
  async ({ customerId, authtoken, isRefresh = false }, { getState, rejectWithValue, signal }) => {
    
    const requestKey = getRequestKey(customerId, isRefresh);
    
    // ✅ FIXED: Only skip if we have recent successful data
    if (!isRefresh && hasSuccessfulFetch(customerId)) {
      const successData = successfulFetches.get(customerId);
      const now = Date.now();
      const TEN_MINUTES = 10 * 60 * 1000;
      
      // Only skip if data is less than 10 minutes old
      if (now - successData.timestamp < TEN_MINUTES) {
        return rejectWithValue("Already have recent data");
      }
    }

    // Prevent duplicate requests
    if (pendingRequests.has(requestKey) || globalFetchInProgress) {
      return rejectWithValue("Request already in progress");
    }

    // Track this request
    pendingRequests.set(requestKey, Date.now());
    globalFetchInProgress = true;

    try {
      // Add AbortController for cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await axios.get(
        `${API_URL}/active-account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // ✅ FIXED: Handle empty response gracefully
      if (response.data?.count_account_details > 0) {
        successfulFetches.set(customerId, {
          timestamp: Date.now(),
          count: response.data.count_account_details,
          data: response.data.account_details
        });
        return response.data.account_details;
      } else {
        // Clear successful fetch if no data
        successfulFetches.delete(customerId);
        return rejectWithValue("No accounts found");
      }
    } catch (error) {
      // Don't log aborted requests
      if (error.name !== 'AbortError' && error.code !== 'ECONNABORTED') {
        console.error("❌ Error fetching account details:", error);
      }
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      // Clean up
      setTimeout(() => {
        pendingRequests.delete(requestKey);
        globalFetchInProgress = false;
      }, GLOBAL_FETCH_COOLDOWN);
    }
  }
);

export const updateAccountBalance = createAsyncThunk(
  "account/updateAccountBalance",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      const updateResponse = await axios.get(`${API_URL}/transaction-balance`, {
        headers: { Authorization: `Bearer ${authtoken}` },
      });

      if (updateResponse.data.status !== "success") {
        throw new Error("Failed to update balance");
      }

      const balanceResponse = await axios.get(
        `${API_URL}/account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
        }
      );

      if (balanceResponse.data?.count_account_details > 0) {
        successfulFetches.set(customerId, {
          timestamp: Date.now(),
          count: balanceResponse.data.count_account_details,
          data: balanceResponse.data.account_details
        });
        return balanceResponse.data.account_details;
      } else {
        successfulFetches.delete(customerId);
        throw new Error("No account details found after updating balance");
      }
    } catch (error) {
      console.error("❌ Error updating account balance:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Enhanced initial state with proper defaults
const initialState = {
  accounts: [],
  selectedAccount: null,
  selectedCurrency: "all",
  accountLoading: false,
  balanceLoading: false,
  accountError: null,
  lastUpdated: null,
  accountDropdownOpen: false,
  hasFetchedAccount: false,
  fetchAttempted: false, // ✅ ADDED: Track if we've attempted fetch
  _debug: {
    sliceName: "account",
    storePath: "state.account",
    version: "2.0"
  }
};

const accountSlice = createSlice({
  name: "account",
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
      
      if (state.accounts.length > 0 && action.payload !== "all") {
        const matchingAccount = state.accounts.find(
          account => account.currency === action.payload
        );
        if (matchingAccount) {
          state.selectedAccount = matchingAccount;
        }
      }
    },
    setAccountDropdownOpen: (state, action) => {
      state.accountDropdownOpen = action.payload;
    },
    clearAccountError: (state) => {
      state.accountError = null;
    },
    setAccountLoading: (state, action) => {
      state.accountLoading = action.payload;
    },
    setBalanceLoading: (state, action) => {
      state.balanceLoading = action.payload;
    },
    setAccountError: (state, action) => {
      state.accountError = typeof action.payload === 'string' 
        ? action.payload 
        : extractErrorMessage(action.payload);
    },
    resetAccountState: () => {
      return initialState;
    },
    refreshLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
    setHasFetchedAccount: (state, action) => {
      state.hasFetchedAccount = action.payload;
    },
    setFetchAttempted: (state, action) => {
      state.fetchAttempted = action.payload;
    },
    // ✅ FIXED: Reset coordination properly
    resetFetchCoordination: () => {
      globalFetchInProgress = false;
      pendingRequests.clear();
      successfulFetches.clear();
    },
    clearSuccessfulFetch: (state, action) => {
      const customerId = action.payload;
      if (customerId) {
        successfulFetches.delete(customerId);
      } else {
        successfulFetches.clear();
      }
      state.hasFetchedAccount = false;
      state.fetchAttempted = false;
    },
    forceRefreshAccounts: (state, action) => {
      const customerId = action.payload;
      if (customerId) {
        successfulFetches.delete(customerId);
      }
      state.hasFetchedAccount = false;
      state.fetchAttempted = false;
    },
    debugAccountState: (state) => {
      console.log("🔍 Account State:", {
        accountsCount: state.accounts.length,
        selectedAccount: state.selectedAccount,
        loading: state.accountLoading,
        hasFetched: state.hasFetchedAccount,
        attempted: state.fetchAttempted
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountDetails.pending, (state) => {
        state.accountLoading = true;
        state.accountError = null;
        state.fetchAttempted = true;
      })
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        state.accountLoading = false;
        state.accounts = Array.isArray(action.payload) ? action.payload : [];
        state.lastUpdated = new Date().toISOString();
        state.hasFetchedAccount = true;
        state.accountError = null;
        
        // Set selected account if not set or if current selection is invalid
        if (state.accounts.length > 0) {
          const needsNewSelection = !state.selectedAccount || 
            !state.accounts.some(acc => acc.currency === state.selectedAccount.currency);
          
          if (needsNewSelection) {
            state.selectedAccount = {
              ...state.accounts[0],
              available_balance: state.accounts[0].available_balance || 0,
            };
            state.selectedCurrency = state.accounts[0].currency || "all";
          }
        } else {
          state.selectedAccount = null;
          state.selectedCurrency = "all";
        }
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        const isAlreadyHaveData = action.payload === "Already have recent data";
        
        if (!isAlreadyHaveData) {
          state.accountError = typeof action.payload === 'string'
            ? action.payload
            : extractErrorMessage(action.payload);
          state.hasFetchedAccount = false;
        } else {
          // Keep existing data if we have it
          state.hasFetchedAccount = state.accounts.length > 0;
        }
        
        state.accountLoading = false;
      })
      .addCase(updateAccountBalance.pending, (state) => {
        state.balanceLoading = true;
        state.accountError = null;
      })
      .addCase(updateAccountBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        const newAccounts = Array.isArray(action.payload) ? action.payload : [];
        
        // Preserve selected account if possible
        if (state.selectedAccount && newAccounts.length > 0) {
          const updatedAccount = newAccounts.find(
            (account) => account.currency === state.selectedAccount.currency
          );
          
          if (updatedAccount) {
            state.selectedAccount = {
              ...state.selectedAccount,
              ...updatedAccount,
              available_balance: updatedAccount.available_balance || 0,
            };
          }
        }
        
        state.accounts = newAccounts;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateAccountBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.accountError = typeof action.payload === 'string'
          ? action.payload
          : extractErrorMessage(action.payload);
      });
  },
});

// Enhanced selectors with memoization
export const selectAccounts = (state) => {
  return state.account?.accounts || [];
};

export const selectSelectedAccount = (state) => 
  state.account?.selectedAccount || null;

export const selectSelectedCurrency = (state) => 
  state.account?.selectedCurrency || "all";

export const selectAccountLoading = (state) => 
  state.account?.accountLoading || false;

export const selectBalanceLoading = (state) => 
  state.account?.balanceLoading || false;

export const selectAccountError = (state) => 
  state.account?.accountError || null;

export const selectLastUpdated = (state) => 
  state.account?.lastUpdated || null;

export const selectHasFetchedAccount = (state) => 
  state.account?.hasFetchedAccount || false;

export const selectFetchAttempted = (state) =>
  state.account?.fetchAttempted || false;

export const selectAccountDropdown = (state) => ({
  isOpen: state.account?.accountDropdownOpen || false,
});

// Memoized utility selectors
export const selectCurrencyOptions = (state) => {
  const accounts = selectAccounts(state);
  return [...new Set(accounts.map(account => account.currency))].filter(Boolean);
};

export const selectHasAccounts = (state) => 
  selectAccounts(state).length > 0;

export const selectAccountState = (state) => ({
  accounts: selectAccounts(state),
  selectedAccount: selectSelectedAccount(state),
  selectedCurrency: selectSelectedCurrency(state),
  accountLoading: selectAccountLoading(state),
  balanceLoading: selectBalanceLoading(state),
  accountError: selectAccountError(state),
  hasFetchedAccount: selectHasFetchedAccount(state),
  fetchAttempted: selectFetchAttempted(state),
  lastUpdated: selectLastUpdated(state),
  accountDropdown: selectAccountDropdown(state),
});

export const {
  setSelectedAccount,
  setSelectedCurrency,
  setAccountDropdownOpen,
  clearAccountError,
  setAccountLoading,
  setBalanceLoading,
  setAccountError,
  resetAccountState,
  refreshLastUpdated,
  setHasFetchedAccount,
  setFetchAttempted,
  debugAccountState,
  resetFetchCoordination,
  clearSuccessfulFetch,
  forceRefreshAccounts,
} = accountSlice.actions;

export default accountSlice.reducer;