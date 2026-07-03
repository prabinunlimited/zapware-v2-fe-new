// src/components/Dashboard/Account/AccountSummary/AccountSlice.js - COMPLETELY FIXED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { extractErrorMessage } from "../../../../utils/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

// Request coordination
let globalFetchInProgress = false;
const GLOBAL_FETCH_COOLDOWN = 1000;
const pendingRequests = new Map();
const successfulFetches = new Map();

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? "refresh" : "initial"}`;
};

export const resetAllFetchFlags = () => {
  globalFetchInProgress = false;
  pendingRequests.clear();
  for (const [key, value] of successfulFetches.entries()) {
    successfulFetches.set(key, { ...value, stale: true });
  }
};

// FIXED: Handle "no accounts" as success with empty array, not as error
export const fetchAccountDetails = createAsyncThunk(
  "account/fetchAccountDetails",
  async (
    { customerId, authtoken, isRefresh = false },
    { getState, rejectWithValue, signal, dispatch }
  ) => {
    const requestKey = getRequestKey(customerId, isRefresh);

    // Skip if we have recent successful data (5 minutes)
    if (!isRefresh && hasSuccessfulFetch(customerId)) {
      const successData = successfulFetches.get(customerId);
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (now - successData.timestamp < FIVE_MINUTES && !successData.stale) {
        console.log("📦 Using cached account data");
        return successData.data;
      }
    }

    // Check if request is in progress
    if (pendingRequests.has(requestKey)) {
      const requestTime = pendingRequests.get(requestKey);
      const now = Date.now();
      if (now - requestTime < 10000) {
        console.log("⚠️ Request already in progress, skipping");
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (!pendingRequests.has(requestKey)) {
              clearInterval(checkInterval);
              const cached = successfulFetches.get(customerId);
              if (cached) {
                resolve(cached.data);
              } else {
                reject(new Error("Request completed but no data"));
              }
            }
          }, 100);
        });
      } else {
        pendingRequests.delete(requestKey);
        globalFetchInProgress = false;
      }
    }

    // Prevent duplicate requests
    if (globalFetchInProgress && !isRefresh) {
      console.log("⚠️ Global fetch already in progress, skipping");
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!globalFetchInProgress) {
            clearInterval(checkInterval);
            const cached = successfulFetches.get(customerId);
            resolve(cached ? cached.data : []);
          }
        }, 100);
      });
    }

    pendingRequests.set(requestKey, Date.now());
    globalFetchInProgress = true;

    try {
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

      // Handle both cases - with accounts and without accounts
      let accountsData = [];

      if (response.data?.count_account_details > 0 &&
        Array.isArray(response.data.account_details)) {
        accountsData = response.data.account_details;
        console.log(`✅ Found ${accountsData.length} accounts`);
      } else {
        // No accounts found - this is a valid state, not an error
        console.log("ℹ️ No accounts found for this customer");
        accountsData = [];
      }

      // Cache the result (even empty array)
      successfulFetches.set(customerId, {
        timestamp: Date.now(),
        count: accountsData.length,
        data: accountsData,
        stale: false,
      });

      return accountsData;

    } catch (error) {
      // Only reject on actual errors (network, auth, etc.)
      if (error.name !== "AbortError" && error.code !== "ECONNABORTED") {
        console.error("❌ Error fetching account details:", error);
      }
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      setTimeout(() => {
        pendingRequests.delete(requestKey);
        globalFetchInProgress = false;
      }, GLOBAL_FETCH_COOLDOWN);
    }
  }
);

const hasSuccessfulFetch = (customerId) => {
  return successfulFetches.has(customerId) && !successfulFetches.get(customerId).stale;
};

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

      let accountsData = [];
      if (balanceResponse.data?.count_account_details > 0 &&
        Array.isArray(balanceResponse.data.account_details)) {
        accountsData = balanceResponse.data.account_details;
        successfulFetches.set(customerId, {
          timestamp: Date.now(),
          count: accountsData.length,
          data: accountsData,
          stale: false,
        });
      } else {
        // No accounts after update - still a valid state
        accountsData = [];
        successfulFetches.set(customerId, {
          timestamp: Date.now(),
          count: 0,
          data: [],
          stale: false,
        });
      }

      return accountsData;
    } catch (error) {
      console.error("❌ Error updating account balance:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// FETCH TRANSIT CODES
export const fetchTransitCodes = createAsyncThunk(
  "account/fetchTransitCodes",
  async ({ authtoken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/transit-codes`, {
        headers: { Authorization: `Bearer ${authtoken}` },
      });

      // Handle different response structures
      let transitCodes = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        transitCodes = response.data.data;
      } else if (Array.isArray(response.data)) {
        transitCodes = response.data;
      } else if (response.data?.transit_codes && Array.isArray(response.data.transit_codes)) {
        transitCodes = response.data.transit_codes;
      }

      console.log(`✅ Fetched ${transitCodes.length} transit codes`);
      return transitCodes;
    } catch (error) {
      console.error("❌ Error fetching transit codes:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const addBankAccount = createAsyncThunk(
  "account/addBankAccount",
  async ({ payload, authtoken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/transfermate/add-bank-account`,
        payload,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
        }
      );

      console.log("✅ Bank account added successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error adding bank account:", error);

      // If there's a response from the server
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Flatten the structure - extract input_errors from nested data
        const inputErrors = errorData?.data?.input_errors || [];
        const globalErrors = errorData?.data?.global_errors || [];
        const messages = errorData?.data?.messages || [];
        
        // Return a flattened error object
        return rejectWithValue({
          message: errorData.message || "Failed to add bank account",
          status: error.response.status,
          data: {
            input_errors: inputErrors,
            global_errors: globalErrors,
            messages: messages,
            raw: errorData, // Keep raw data for debugging
          }
        });
      }

      // Network or other errors
      return rejectWithValue({
        message: error.message || "Failed to add bank account",
        status: 0,
        data: null,
      });
    }
  }
);

export const fetchServiceProviderCurrencies = createAsyncThunk(
  "account/fetchServiceProviderCurrencies",
  async ({ serviceProviderId, authtoken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/service-provider-bank-account-currencies/${serviceProviderId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
        }
      );

      console.log("✅ Fetched currencies:", response.data);

      // Handle different response structures
      let currencies = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        currencies = response.data.data;
      } else if (Array.isArray(response.data)) {
        currencies = response.data;
      } else if (response.data?.currencies && Array.isArray(response.data.currencies)) {
        currencies = response.data.currencies;
      }

      return currencies;
    } catch (error) {
      console.error("❌ Error fetching currencies:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Enhanced initial state
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
  fetchAttempted: false,
  transitCodes: [],
  transitCodesLoading: false,
  addingBankAccount: false,
  addBankAccountSuccess: false,
  addBankAccountError: null,
  serviceProviderCurrencies: [],
  currenciesLoading: false,
  _debug: {
    sliceName: "account",
    storePath: "state.account",
    version: "2.0",
  },
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
      state.accountError =
        typeof action.payload === "string"
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
      state.accountError = null;
      state.accountLoading = false;
    },
    forceRefreshAccounts: (state, action) => {
      const customerId = action.payload;
      if (customerId) {
        successfulFetches.delete(customerId);
      }
      state.hasFetchedAccount = false;
      state.fetchAttempted = false;
      state.accountError = null;
      state.accountLoading = false;
    },
    debugAccountState: (state) => {
      console.log("🔍 Account State:", {
        accountsCount: state.accounts.length,
        selectedAccount: state.selectedAccount,
        loading: state.accountLoading,
        hasFetched: state.hasFetchedAccount,
        attempted: state.fetchAttempted,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountDetails.pending, (state) => {
        state.accountLoading = true;
        state.accountError = null;
        state.fetchAttempted = true;
        console.log("🔄 Fetch pending...");
      })
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        console.log("✅ ACCOUNT SLICE: fetchAccountDetails FULFILLED", {
          payloadCount: Array.isArray(action.payload)
            ? action.payload.length
            : 0,
        });

        state.accountLoading = false;
        // Always set accounts, even if empty array
        state.accounts = Array.isArray(action.payload) ? action.payload : [];
        state.lastUpdated = new Date().toISOString();
        state.hasFetchedAccount = true; // CRITICAL: Always set to true after fetch completes
        state.accountError = null;

        // Handle selection logic
        if (state.accounts.length > 0) {
          const needsNewSelection =
            !state.selectedAccount ||
            !state.accounts.some(
              (acc) => acc.currency === state.selectedAccount?.currency
            );

          if (needsNewSelection) {
            state.selectedAccount = {
              ...state.accounts[0],
              available_balance: state.accounts[0].available_balance || 0,
            };
            state.selectedCurrency = state.accounts[0].currency || "all";
          }
        } else {
          // Clear selection when no accounts exist
          state.selectedAccount = null;
          state.selectedCurrency = "all";
        }
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        // Only treat as error for actual failures (network, auth, etc.)
        const isNetworkError = action.payload?.includes("Network") ||
          action.payload?.includes("Failed to fetch");
        const isAuthError = action.payload?.includes("401") ||
          action.payload?.includes("unauthorized");

        console.log("❌ Fetch rejected:", action.payload);

        if (isNetworkError || isAuthError) {
          // Real error - show error state
          state.accountError = typeof action.payload === "string"
            ? action.payload
            : extractErrorMessage(action.payload);
          state.hasFetchedAccount = false;
        } else {
          // For other "errors" like request coordination, maintain existing state
          state.hasFetchedAccount = state.accounts.length >= 0;
          state.accountError = null;
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

        state.accounts = newAccounts;
        state.lastUpdated = new Date().toISOString();
        state.hasFetchedAccount = true;

        if (state.selectedAccount && newAccounts.length > 0) {
          const updatedAccount = newAccounts.find(
            (account) => account.currency === state.selectedAccount?.currency
          );

          if (updatedAccount) {
            state.selectedAccount = {
              ...state.selectedAccount,
              ...updatedAccount,
              available_balance: updatedAccount.available_balance || 0,
            };
          }
        } else if (newAccounts.length === 0) {
          state.selectedAccount = null;
          state.selectedCurrency = "all";
        }
      })
      .addCase(updateAccountBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        if (action.payload && !action.payload.includes("Request already")) {
          state.accountError = typeof action.payload === "string"
            ? action.payload
            : extractErrorMessage(action.payload);
        }
      })
      .addCase(fetchTransitCodes.pending, (state) => {
        state.transitCodesLoading = true;
        state.accountError = null;
      })
      .addCase(fetchTransitCodes.fulfilled, (state, action) => {
        state.transitCodesLoading = false;
        state.transitCodes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTransitCodes.rejected, (state, action) => {
        state.transitCodesLoading = false;
        state.transitCodes = []; // Empty array on error
        // Don't set accountError for transit codes - it's not critical
      })
      .addCase(addBankAccount.pending, (state) => {
        state.addingBankAccount = true;
        state.addBankAccountSuccess = false;
        state.addBankAccountError = null;
        state.accountError = null;
      })
      .addCase(addBankAccount.fulfilled, (state, action) => {
        state.addingBankAccount = false;
        state.addBankAccountSuccess = true;
        state.addBankAccountError = null;
        // Optionally update accounts list if the new account is returned
        if (action.payload?.account) {
          state.accounts = [...state.accounts, action.payload.account];
        }
      })
      .addCase(addBankAccount.rejected, (state, action) => {
        state.addingBankAccount = false;
        state.addBankAccountSuccess = false;
      
        // Handle both string and object error payloads
        if (typeof action.payload === 'string') {
          state.addBankAccountError = action.payload;
          state.accountError = action.payload;
        } else if (action.payload?.message) {
          state.addBankAccountError = action.payload.message;
          state.accountError = action.payload.message;
          // Store full error details if needed
          state._debug.errors = action.payload.errors;
          // Store the full error data for input_errors
          state._debug.errorData = action.payload.data;
        } else {
          state.addBankAccountError = "Failed to add bank account";
          state.accountError = "Failed to add bank account";
        }
      })
      .addCase(fetchServiceProviderCurrencies.pending, (state) => {
        state.currenciesLoading = true;
        state.accountError = null;
      })
      .addCase(fetchServiceProviderCurrencies.fulfilled, (state, action) => {
        state.currenciesLoading = false;
        state.serviceProviderCurrencies = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchServiceProviderCurrencies.rejected, (state, action) => {
        state.currenciesLoading = false;
        state.serviceProviderCurrencies = [];
        // Don't set accountError for currencies - it's not critical
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

export const selectLastUpdated = (state) => state.account?.lastUpdated || null;

export const selectHasFetchedAccount = (state) =>
  state.account?.hasFetchedAccount || false;

export const selectFetchAttempted = (state) =>
  state.account?.fetchAttempted || false;

export const selectAccountDropdown = (state) => ({
  isOpen: state.account?.accountDropdownOpen || false,
});

export const selectCurrencyOptions = (state) => {
  const accounts = selectAccounts(state);
  return [...new Set(accounts.map((account) => account.currency))].filter(
    Boolean
  );
};

export const selectHasAccounts = (state) => selectAccounts(state).length > 0;

export const selectTransitCodes = (state) => state.account?.transitCodes || [];
export const selectTransitCodesLoading = (state) => state.account?.transitCodesLoading || false;

export const selectAddingBankAccount = (state) => state.account?.addingBankAccount || false;
export const selectAddBankAccountSuccess = (state) => state.account?.addBankAccountSuccess || false;
export const selectAddBankAccountError = (state) => state.account?.addBankAccountError || null;

export const selectServiceProviderCurrencies = (state) =>
  state.account?.serviceProviderCurrencies || [];

export const selectCurrenciesLoading = (state) =>
  state.account?.currenciesLoading || false;

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