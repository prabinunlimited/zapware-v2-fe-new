import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { extractErrorMessage } from "../../../../utils/errorHandling";
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL;

// ✅ FIXED: Import selectAuthToken from the correct path
import { selectAuthToken } from "../../../../store/selectors";

// ✅ ENHANCED: Global request coordination with SUCCESS TRACKING
let globalFetchInProgress = false;
const GLOBAL_FETCH_COOLDOWN = 10000; // 10 seconds
const pendingRequests = new Map();
const successfulFetches = new Map(); // Track successful fetches by customerId

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? 'refresh' : 'initial'}`;
};

// ✅ CHECK IF SUCCESSFUL FETCH EXISTS
const hasSuccessfulFetch = (customerId) => {
  return successfulFetches.has(customerId);
};

// ✅ OPTIMIZED ASYNC THUNK WITH SUCCESS-BASED STOPPING
export const fetchAccountDetails = createAsyncThunk(
  "account/fetchAccountDetails",
  async ({ customerId, authtoken, isRefresh = false }, { getState, rejectWithValue }) => {
    
    const requestKey = getRequestKey(customerId, isRefresh);
    
    // ✅ ENHANCED: Stop if we already have a successful fetch (unless force refresh)
    if (!isRefresh && hasSuccessfulFetch(customerId)) {
      console.log("✅ Already have successful account data, skipping fetch");
      return rejectWithValue("Already have successful data");
    }

    // Enhanced duplicate request check with global coordination
    if (pendingRequests.has(requestKey) || globalFetchInProgress) {
      console.log("⏸️ Request already in progress or global fetch active, skipping duplicate...");
      return rejectWithValue("Request already in progress");
    }

    // Track this request
    pendingRequests.set(requestKey, Date.now());
    globalFetchInProgress = true;

    try {
      console.log(`🔄 ${isRefresh ? 'Refreshing' : 'Fetching'} account details for customer:`, customerId);
      
      const response = await axios.get(
        `${API_URL}/active-account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
          timeout: 30000,
        }
      );

      console.log("📦 Account details response:", response.data);

      // ✅ MARK AS SUCCESSFUL FETCH
      if (response.data.count_account_details > 0) {
        successfulFetches.set(customerId, {
          timestamp: Date.now(),
          count: response.data.count_account_details
        });
        console.log("✅ Account fetch marked as successful for customer:", customerId);
        return response.data.account_details;
      } else {
        return rejectWithValue("No accounts found");
      }
    } catch (error) {
      console.error("❌ Error fetching account details:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      // Remove from tracking after a delay to prevent immediate re-requests
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
      console.log("🔄 Updating account balance for customer:", customerId);
      
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

      if (balanceResponse.data.count_account_details > 0) {
        // ✅ UPDATE SUCCESSFUL FETCH TRACKING
        successfulFetches.set(customerId, {
          timestamp: Date.now(),
          count: balanceResponse.data.count_account_details
        });
        return balanceResponse.data.account_details;
      } else {
        throw new Error("No account details found after updating balance");
      }
    } catch (error) {
      console.error("❌ Error updating account balance:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Enhanced initial state with debugging
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
  _debug: {
    sliceName: "account",
    storePath: "state.account"
  }
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setSelectedAccount: (state, action) => {
      console.log("🔄 Setting selected account:", action.payload);
      state.selectedAccount = action.payload;
      if (action.payload?.currency) {
        state.selectedCurrency = action.payload.currency;
      }
    },
    setSelectedCurrency: (state, action) => {
      console.log("🔄 Setting selected currency:", action.payload);
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
      console.log("🔄 Resetting account state to initial");
      return initialState;
    },
    refreshLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
    setHasFetchedAccount: (state, action) => {
      state.hasFetchedAccount = action.payload;
    },
    debugAccountState: (state) => {
      console.log("🔍 Account State Debug:", {
        accounts: state.accounts,
        selectedAccount: state.selectedAccount,
        selectedCurrency: state.selectedCurrency,
        accountLoading: state.accountLoading,
        accountsCount: state.accounts.length,
        hasFetchedAccount: state.hasFetchedAccount,
        storePath: "state.account"
      });
    },
    // ✅ ADDED: Reset fetch coordination (for emergency recovery)
    resetFetchCoordination: () => {
      globalFetchInProgress = false;
      pendingRequests.clear();
      console.log("🔄 Fetch coordination reset");
    },
    // ✅ ADDED: Clear successful fetch tracking (for logout or manual refresh)
    clearSuccessfulFetch: (state, action) => {
      const customerId = action.payload;
      if (customerId) {
        successfulFetches.delete(customerId);
        console.log("🧹 Cleared successful fetch tracking for customer:", customerId);
      } else {
        successfulFetches.clear();
        console.log("🧹 Cleared all successful fetch tracking");
      }
    },
    // ✅ ADDED: Force refresh by clearing successful status
    forceRefreshAccounts: (state, action) => {
      const customerId = action.payload;
      if (customerId) {
        successfulFetches.delete(customerId);
        state.hasFetchedAccount = false;
        console.log("🔄 Force refresh triggered for customer:", customerId);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountDetails.pending, (state) => {
        console.log("⏳ Fetching account details...");
        state.accountLoading = true;
        state.accountError = null;
      })
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        console.log("✅ Account details fetched successfully:", action.payload);
        state.accountLoading = false;
        state.accounts = Array.isArray(action.payload) ? action.payload : [];
        state.lastUpdated = new Date().toISOString();
        state.hasFetchedAccount = true;
        
        if (state.accounts.length > 0) {
          if (!state.selectedAccount) {
            state.selectedAccount = {
              ...state.accounts[0],
              available_balance: state.accounts[0].available_balance || 0,
            };
            state.selectedCurrency = state.accounts[0].currency || "all";
            console.log("🔄 Auto-selected first account:", state.selectedAccount);
          }
        } else {
          state.selectedAccount = null;
          state.selectedCurrency = "all";
          console.log("⚠️ No accounts available after fetch");
        }
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        // ✅ DON'T set error for "already have data" cases
        const isAlreadyHaveData = action.payload === "Already have successful data";
        
        if (!isAlreadyHaveData) {
          console.error("❌ Failed to fetch account details:", action.payload);
          state.accountError = typeof action.payload === 'string'
            ? action.payload
            : extractErrorMessage(action.payload);
        } else {
          console.log("⏸️ Fetch skipped - already have data");
        }
        
        state.accountLoading = false;
        state.hasFetchedAccount = isAlreadyHaveData ? true : false;
      })
      .addCase(updateAccountBalance.pending, (state) => {
        console.log("⏳ Updating account balance...");
        state.balanceLoading = true;
        state.accountError = null;
      })
      .addCase(updateAccountBalance.fulfilled, (state, action) => {
        console.log("✅ Account balance updated successfully:", action.payload);
        state.balanceLoading = false;
        state.accounts = Array.isArray(action.payload) ? action.payload : [];
        
        if (state.selectedAccount && state.accounts.length > 0) {
          const updatedAccount = state.accounts.find(
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
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateAccountBalance.rejected, (state, action) => {
        console.error("❌ Failed to update account balance:", action.payload);
        state.balanceLoading = false;
        state.accountError = typeof action.payload === 'string'
          ? action.payload
          : extractErrorMessage(action.payload);
      });
  },
});

// Enhanced selectors with debugging and safety
export const selectAccounts = (state) => {
  const accounts = state.account?.accounts;
  return Array.isArray(accounts) ? accounts : [];
};

export const selectSelectedAccount = (state) => state.account?.selectedAccount || null;
export const selectSelectedCurrency = (state) => state.account?.selectedCurrency || "all";
export const selectAccountLoading = (state) => state.account?.accountLoading || false;
export const selectBalanceLoading = (state) => state.account?.balanceLoading || false;
export const selectAccountError = (state) => state.account?.accountError || null;
export const selectLastUpdated = (state) => state.account?.lastUpdated || null;
export const selectHasFetchedAccount = (state) => state.account?.hasFetchedAccount || false;
export const selectAccountDropdown = (state) => ({
  isOpen: state.account?.accountDropdownOpen || false,
});

// Utility selectors
export const selectCurrencyOptions = (state) => {
  const accounts = selectAccounts(state);
  return [...new Set(accounts.map(account => account.currency))].filter(Boolean);
};

export const selectHasAccounts = (state) => selectAccounts(state).length > 0;

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
  debugAccountState,
  resetFetchCoordination,
  clearSuccessfulFetch,
  forceRefreshAccounts,
} = accountSlice.actions;

export default accountSlice.reducer;

// ✅ FIXED CUSTOM HOOK: useAccountData with SUCCESS-BASED STOPPING
export const useAccountData = () => {
  const dispatch = useDispatch();
  const customerId = localStorage.getItem('authcustomer_id');
  const authtoken = useSelector(selectAuthToken);
  const hasFetchedAccount = useSelector(selectHasFetchedAccount);
  const accountLoading = useSelector(selectAccountLoading);
  const accounts = useSelector(selectAccounts);

  // Stable fetch function with enhanced coordination
  const fetchAccountData = useCallback(
    (forceRefresh = false) => {
      if (!customerId || !authtoken) {
        console.log('⏹️ Missing customerId or authtoken, skipping fetch');
        return;
      }

      // ✅ ENHANCED: Global request coordination
      if (globalFetchInProgress && !forceRefresh) {
        console.log('⏸️ Global fetch already in progress, skipping...');
        return;
      }

      // ✅ ENHANCED: Prevent fetch if already loading (unless force refresh)
      if (accountLoading && !forceRefresh) {
        console.log('⏸️ Account already loading, skipping...');
        return;
      }

      // ✅ ENHANCED: Check if we already have successful data (unless force refresh)
      if (hasSuccessfulFetch(customerId) && !forceRefresh) {
        console.log('✅ Already have successful account data, skipping fetch');
        return;
      }

      // ✅ ENHANCED: Clear successful status if force refresh
      if (forceRefresh) {
        successfulFetches.delete(customerId);
        console.log('🔄 Force refresh - cleared successful status');
      }

      console.log('🔄 Fetching account details...', {
        customerId,
        hasFetchedAccount,
        forceRefresh,
        accountLoading,
        hasSuccessfulData: hasSuccessfulFetch(customerId)
      });

      dispatch(
        fetchAccountDetails({ 
          customerId, 
          authtoken, 
          isRefresh: forceRefresh 
        })
      );
    },
    [customerId, authtoken, dispatch, accountLoading, hasFetchedAccount]
  );

  // Memoize the function to prevent unnecessary recreations
  const stableFetchAccountData = useMemo(() => fetchAccountData, [fetchAccountData]);

  return {
    fetchAccountData: stableFetchAccountData,
    shouldFetch: !hasFetchedAccount && customerId && authtoken && !accountLoading && !hasSuccessfulFetch(customerId),
    canFetch: Boolean(customerId && authtoken),
    isLoading: accountLoading,
    error: useSelector(selectAccountError),
    accounts: accounts,
    hasAccounts: accounts.length > 0,
    lastUpdated: useSelector(selectLastUpdated),
    // ✅ ADDED: Enhanced reset functions
    resetFetch: () => dispatch(resetFetchCoordination()),
    forceRefresh: () => {
      successfulFetches.delete(customerId);
      dispatch(forceRefreshAccounts(customerId));
      fetchAccountData(true);
    },
    hasSuccessfulData: hasSuccessfulFetch(customerId)
  };
};

// ✅ FIXED HOOK: useAccountSelection
export const useAccountSelection = () => {
  const dispatch = useDispatch();
  const selectedAccount = useSelector(selectSelectedAccount);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accounts = useSelector(selectAccounts);

  const setAccount = useCallback((account) => {
    dispatch(setSelectedAccount(account));
  }, [dispatch]);

  const setCurrency = useCallback((currency) => {
    dispatch(setSelectedCurrency(currency));
  }, [dispatch]);

  const getAccountByCurrency = useCallback((currency) => {
    return accounts.find(acc => acc.currency === currency) || null;
  }, [accounts]);

  const getAvailableCurrencies = useCallback(() => {
    return [...new Set(accounts.map(acc => acc.currency))].filter(Boolean);
  }, [accounts]);

  return {
    selectedAccount,
    selectedCurrency,
    setAccount,
    setCurrency,
    getAccountByCurrency,
    getAvailableCurrencies,
    hasAccounts: accounts.length > 0
  };
};

// ✅ FIXED HOOK: useAccountBalance
export const useAccountBalance = () => {
  const dispatch = useDispatch();
  const customerId = localStorage.getItem('authcustomer_id');
  const authtoken = useSelector(selectAuthToken);
  const selectedAccount = useSelector(selectSelectedAccount);
  const balanceLoading = useSelector(selectBalanceLoading);

  const updateBalance = useCallback(() => {
    if (customerId && authtoken) {
      dispatch(updateAccountBalance({ customerId, authtoken }));
    }
  }, [customerId, authtoken, dispatch]);

  const formatBalance = useCallback((amount, currency = selectedAccount?.currency) => {
    const numericAmount = parseFloat(amount) || 0;
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      DKK: 'kr',
      NOK: 'kr',
      SEK: 'kr',
      CHF: 'CHF',
    };
    
    const symbol = currencySymbols[currency] || '';
    
    if (numericAmount >= 1000000) {
      const millions = (numericAmount / 1000000).toFixed(2);
      return `${symbol}${millions}M`;
    } else if (numericAmount >= 10000) {
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numericAmount);
      return `${symbol}${formatted}`;
    } else {
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
      return `${symbol}${formatted}`;
    }
  }, [selectedAccount]);

  return {
    updateBalance,
    formatBalance,
    isLoading: balanceLoading,
    selectedAccountBalance: selectedAccount?.available_balance || 0,
    selectedAccountCurrency: selectedAccount?.currency
  };
};