import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { extractErrorMessage } from "../../utils/errorHandling";
import api from "../../services/api"; // Add this import

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;

// ✅ REQUEST DEDUPLICATION TRACKER
const pendingRequests = new Map();

const getRequestKey = (customerId, isRefresh = false) => {
  return `account-${customerId}-${isRefresh ? "refresh" : "initial"}`;
};

// ✅ CORRECTED: Home-specific FX currencies thunk with "home/" prefix
export const fetchPartnerFxCurrencies = createAsyncThunk(
  "home/fetchPartnerFxCurrencies", // ← CHANGED TO "home/" prefix
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
      return rejectWithValue(error.response?.data || error.message);
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
      // ✅ CHANGED: Use api.js instead of axios.get()
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

  // FX data states - ADDED
  partnerFxCurrencies: [],
  hasFxData: false,
  fxLoading: false,
  fxError: null,

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
      state.error =
        typeof action.payload === "string"
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
    },
    // ✅ ADD: Reset fetch flag when dependencies change
    resetFetchFlag: (state) => {
      state.hasFetchedAccount = false;
    },
    // ADD FX-related reducers
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
  },
  extraReducers: (builder) => {
    builder
      // Your existing account details cases
      .addCase(fetchAccountDetails.pending, (state, action) => {
        const isRefresh = action.meta.arg?.isRefresh;

        if (isRefresh) {
          state.refreshing = true;
        } else {
          state.initialLoading = !state.hasFetchedAccount;
          state.isLoading = true;
        }
        state.error = null;
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
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        state.initialLoading = false;
        state.isLoading = false;
        state.refreshing = false;

        state.error =
          typeof action.payload === "string"
            ? action.payload
            : extractErrorMessage(action.payload);

        // Auto-reset child loading after error
        state.childComponentsLoading = 0;
      })

      // ✅ ADD FX currencies cases
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
        state.fxError = action.payload;
        state.hasFxData = false;
      });
  },
});

// Selectors
export const selectHome = (state) => state.home;
export const selectAccountData = (state) => state.home.accountData;
export const selectAccounts = (state) =>
  state.home.accountData?.account_details || [];
export const selectSelectedCurrency = (state) => state.home.selectedCurrency;
export const selectCurrencyOptions = (state) => state.home.currencyOptions;
export const selectInitialLoading = (state) => state.home.initialLoading;
export const selectIsLoading = (state) => state.home.isLoading;
export const selectAccountLoading = (state) =>
  state.home.initialLoading || state.home.isLoading;
export const selectRefreshing = (state) => state.home.refreshing;
export const selectChildComponentsLoading = (state) =>
  state.home.childComponentsLoading;
export const selectLastUpdated = (state) => state.home.lastUpdated;
export const selectTextColor = (state) => state.home.textColor;
export const selectError = (state) => state.home.error;
export const selectHasFetchedAccount = (state) => state.home.hasFetchedAccount;

// ADD FX selectors
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
  state.home.fxLoading;

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
  // ADD FX actions
  setFxLoading,
  clearFxError,
  resetFxState,
} = homeSlice.actions;

export default homeSlice.reducer;
