import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { extractErrorMessage } from "../../utils/errorHandling";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;

// ✅ REQUEST DEDUPLICATION TRACKER
const pendingRequests = new Map();

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? 'refresh' : 'initial'}`;
};

// ✅ OPTIMIZED ASYNC THUNK WITH DEDUPLICATION
export const fetchAccountDetails = createAsyncThunk(
  "home/fetchAccountDetails",
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

      if (response.data.message === "Unauthenticated.") {
        console.log("🚫 Unauthenticated - redirecting to login");
        return rejectWithValue("Unauthenticated");
      }

      console.log("✅ Account details fetched successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching account details:", error);
      
      if (error.code === 'ECONNABORTED') {
        return rejectWithValue("Request timeout - please try again");
      }
      
      if (error.response?.status === 401) {
        return rejectWithValue("Unauthenticated");
      }
      
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      // Always remove from tracking
      pendingRequests.delete(requestKey);
    }
  }
);

const initialState = {
  // Account data
  accountData: { account_details: [] },
  selectedCurrency: "",
  currencyOptions: [],
  
  // Loading states
  initialLoading: true,
  isLoading: false,
  refreshing: false,
  childComponentsLoading: 0,
  
  // UI state
  lastUpdated: null,
  textColor: localStorage.getItem("text_color") || "#000000",
  hasFetchedAccount: false,
  
  // Error state
  error: null,
};

const homeSlice = createSlice({
  name: "home",
  initialState,
  reducers: {
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
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
    setLastUpdated: (state, action) => {
      state.lastUpdated = action.payload;
    },
    setTextColor: (state, action) => {
      state.textColor = action.payload;
    },
    setError: (state, action) => {
      state.error = typeof action.payload === 'string'
        ? action.payload
        : extractErrorMessage(action.payload);
    },
    startChildLoading: (state) => {
      state.childComponentsLoading += 1;
    },
    stopChildLoading: (state) => {
      state.childComponentsLoading = Math.max(0, state.childComponentsLoading - 1);
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
    },
    // ✅ ADD: Reset fetch flag when dependencies change
    resetFetchFlag: (state) => {
      state.hasFetchedAccount = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountDetails.pending, (state, action) => {
        const isRefresh = action.meta.arg?.isRefresh;
        console.log(`⏳ Fetch account details pending - isRefresh: ${isRefresh}`);
        
        if (isRefresh) {
          state.refreshing = true;
        } else {
          state.initialLoading = !state.hasFetchedAccount;
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        console.log("✅ Fetch account details fulfilled");
        
        state.accountData = action.payload;
        
        if (action.payload.account_details?.length) {
          const currencies = [
            ...new Set(action.payload.account_details.map((acc) => acc.currency)),
          ];
          state.currencyOptions = currencies;

          if (!state.selectedCurrency || action.meta.arg?.isRefresh) {
            state.selectedCurrency = currencies[0] || "";
          }
        }

        state.lastUpdated = new Date().toISOString();
        state.initialLoading = false;
        state.isLoading = false;
        state.refreshing = false;
        state.hasFetchedAccount = true;
        state.error = null;
        
        console.log("🏁 All loading states cleared");
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        console.log("❌ Fetch account details rejected:", action.payload);
        
        state.initialLoading = false;
        state.isLoading = false;
        state.refreshing = false;
        
        state.error = typeof action.payload === 'string'
          ? action.payload
          : extractErrorMessage(action.payload);
        
        // Auto-reset child loading after error
        state.childComponentsLoading = 0;
        
        console.log("🔄 Loading states reset due to error");
      });
  },
});

// Selectors
export const selectHome = (state) => state.home;
export const selectAccountData = (state) => state.home.accountData;
export const selectAccounts = (state) => state.home.accountData?.account_details || [];
export const selectSelectedCurrency = (state) => state.home.selectedCurrency;
export const selectCurrencyOptions = (state) => state.home.currencyOptions;
export const selectInitialLoading = (state) => state.home.initialLoading;
export const selectIsLoading = (state) => state.home.isLoading;
export const selectAccountLoading = (state) => state.home.initialLoading || state.home.isLoading;
export const selectRefreshing = (state) => state.home.refreshing;
export const selectChildComponentsLoading = (state) => state.home.childComponentsLoading;
export const selectLastUpdated = (state) => state.home.lastUpdated;
export const selectTextColor = (state) => state.home.textColor;
export const selectError = (state) => state.home.error;
export const selectHasFetchedAccount = (state) => state.home.hasFetchedAccount;

// Derived selectors
export const selectIsAnyLoading = (state) => 
  state.home.initialLoading || state.home.isLoading || state.home.childComponentsLoading > 0;

export const selectAccountsByCurrency = (state) => {
  const { accountData, selectedCurrency } = state.home;
  if (accountData.account_details?.length > 0 && selectedCurrency) {
    return accountData.account_details.filter(
      (account) => account.currency === selectedCurrency
    ) || [];
  }
  return [];
};

export const selectSelectedAccount = (state) => {
  const accounts = selectAccountsByCurrency(state);
  return accounts[0] || {};
};

export const selectSelectedAccountMemo = (state) => {
  const selectedAccount = selectSelectedAccount(state);
  return {
    ...selectedAccount,
    customer_id: String(selectedAccount.customer_id || ""),
  };
};

// Actions
export const {
  setSelectedCurrency,
  setInitialLoading,
  setLoading,
  setRefreshing,
  setLastUpdated,
  setTextColor,
  setError,
  startChildLoading,
  stopChildLoading,
  resetChildLoading,
  setHasFetchedAccount,
  clearHomeState,
  resetLoadingStates,
  resetFetchFlag,
} = homeSlice.actions;

export default homeSlice.reducer;