import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { extractErrorMessage } from "../../../../utils/errorHandling";
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// ✅ IMPORT AUTH SELECTORS
  import { selectAuthToken } from "../../../../store/selectors";

const API_URL = import.meta.env.VITE_API_URL;

// ✅ REQUEST DEDUPLICATION TRACKER
const pendingRequests = new Map();

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? 'refresh' : 'initial'}`;
};

// Async thunks
export const fetchAccountDetails = createAsyncThunk(
  "account/fetchAccountDetails",
  async ({ customerId, authtoken, isRefresh = false }, { getState, rejectWithValue }) => {
    
    const requestKey = getRequestKey(customerId, isRefresh);
    
    // Check if request already in progress
    if (pendingRequests.has(requestKey)) {
      console.log("⏸️ Request already in progress, skipping duplicate...");
      return rejectWithValue("Request already in progress");
    }

    // Track this request
    pendingRequests.set(requestKey, true);

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

      if (response.data.count_account_details > 0) {
        return response.data.account_details;
      } else {
        return rejectWithValue("No accounts found");
      }
    } catch (error) {
      console.error("❌ Error fetching account details:", error);
      
      // ✅ FIX: Return string error message
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      // Always remove from tracking
      pendingRequests.delete(requestKey);
    }
  }
);

export const updateAccountBalance = createAsyncThunk(
  "account/updateAccountBalance",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      console.log("🔄 Updating account balance for customer:", customerId);
      
      // First update the balance
      const updateResponse = await axios.get(`${API_URL}/transaction-balance`, {
        headers: { Authorization: `Bearer ${authtoken}` },
      });

      if (updateResponse.data.status !== "success") {
        throw new Error("Failed to update balance");
      }

      // Then fetch updated account details
      const balanceResponse = await axios.get(
        `${API_URL}/account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
        }
      );

      if (balanceResponse.data.count_account_details > 0) {
        return balanceResponse.data.account_details;
      } else {
        throw new Error("No account details found after updating balance");
      }
    } catch (error) {
      console.error("❌ Error updating account balance:", error);
      
      // ✅ FIX: Return string error message
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Enhanced initial state with debugging
const initialState = {
  accounts: [], // Always initialize as empty array
  selectedAccount: null,
  selectedCurrency: "all",
  accountLoading: false,
  balanceLoading: false,
  accountError: null,
  lastUpdated: null,
  accountDropdownOpen: false,
  hasFetchedAccount: false, // ✅ ADD: Track if account has been fetched
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
      // ✅ FIX: Ensure error is always a string
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
    // Debug action to check store state
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Account Details
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
        state.hasFetchedAccount = true; // ✅ ADD: Mark as fetched
        
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
        console.error("❌ Failed to fetch account details:", action.payload);
        state.accountLoading = false;
        
        // ✅ FIX: Ensure error is a string
        state.accountError = typeof action.payload === 'string'
          ? action.payload
          : extractErrorMessage(action.payload);
          
        state.accounts = [];
        state.selectedAccount = null;
        state.selectedCurrency = "all";
        state.hasFetchedAccount = false; // ✅ ADD: Reset on error
      })
      // Update Account Balance
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
        
        // ✅ FIX: Ensure error is a string
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
} = accountSlice.actions;

export default accountSlice.reducer;

// ✅ CUSTOM HOOK: useAccountData - ADDED DIRECTLY TO THIS FILE
export const useAccountData = () => {
  const dispatch = useDispatch();
  const customerId = localStorage.getItem('authcustomer_id');
  const authtoken = useSelector(selectAuthToken); // ✅ NOW DEFINED
  const hasFetchedAccount = useSelector(selectHasFetchedAccount);

  // Refs to track previous values and prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const prevCustomerIdRef = useRef(customerId);
  const prevAuthtokenRef = useRef(authtoken);

  // ✅ CORRECT: useEffect must come BEFORE any conditional logic
  useEffect(() => {
    const customerIdChanged = prevCustomerIdRef.current !== customerId;
    const authtokenChanged = prevAuthtokenRef.current !== authtoken;

    if (customerIdChanged || authtokenChanged) {
      hasFetchedRef.current = false;
      prevCustomerIdRef.current = customerId;
      prevAuthtokenRef.current = authtoken;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 useAccountData useEffect:', {
        customerId,
        authtoken: authtoken ? 'present' : 'missing',
        customerIdChanged,
        authtokenChanged,
        hasFetchedRef: hasFetchedRef.current
      });
    }
  }, [customerId, authtoken]);

  const fetchAccountData = useCallback(
    (forceRefresh = false) => {
      if (!customerId || !authtoken) {
        console.log('⏹️ Missing customerId or authtoken, skipping fetch');
        return;
      }

      // Prevent duplicate calls unless forced refresh
      if (hasFetchedRef.current && !forceRefresh) {
        console.log('⏩ Skipping duplicate account fetch');
        return;
      }

      console.log('🔄 Fetching account details...', {
        customerId,
        hasFetched: hasFetchedRef.current,
        forceRefresh
      });

      hasFetchedRef.current = true;
      dispatch(
        fetchAccountDetails({ 
          customerId, 
          authtoken, 
          isRefresh: forceRefresh 
        })
      );
    },
    [customerId, authtoken, dispatch]
  );

  // Debounced version for search/input scenarios
  const debouncedFetchAccount = useCallback(
    (forceRefresh = false) => {
      const timeoutId = setTimeout(() => {
        fetchAccountData(forceRefresh);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    },
    [fetchAccountData]
  );

  // Manual refresh function
  const refreshAccountData = useCallback(() => {
    console.log('🔄 Manual account data refresh requested');
    hasFetchedRef.current = false;
    fetchAccountData(true);
  }, [fetchAccountData]);

  // Reset function for cleanup
  const resetAccountData = useCallback(() => {
    console.log('🔄 Resetting account data state');
    hasFetchedRef.current = false;
    dispatch(resetAccountState());
  }, [dispatch]);

  // ✅ CORRECT: Return must be the LAST statement
  return {
    fetchAccountData,
    debouncedFetchAccount,
    refreshAccountData,
    resetAccountData,
    shouldFetch: !hasFetchedAccount && customerId && authtoken,
    canFetch: Boolean(customerId && authtoken),
    isLoading: useSelector(selectAccountLoading),
    error: useSelector(selectAccountError),
    accounts: useSelector(selectAccounts),
    hasAccounts: useSelector(selectHasAccounts),
    lastUpdated: useSelector(selectLastUpdated)
  };
};

// ✅ ADDITIONAL HOOK: useAccountSelection - For account selection logic
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

// ✅ ADDITIONAL HOOK: useAccountBalance - For balance-related operations
export const useAccountBalance = () => {
  const dispatch = useDispatch();
  const customerId = localStorage.getItem('authcustomer_id');
  const authtoken = useSelector(selectAuthToken); // ✅ NOW DEFINED
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