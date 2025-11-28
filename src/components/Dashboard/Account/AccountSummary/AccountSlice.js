// src/components/Dashboard/Account/AccountSummary/AccountSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../../services/api";
import { extractErrorMessage } from "../../../../utils/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

// ✅ USING api.js INSTEAD OF axios DIRECTLY
let globalFetchInProgress = false;

export const fetchAccountDetails = createAsyncThunk(
  "account/fetchAccountDetails",
  async ({ customerId, authtoken, isRefresh = false }, { rejectWithValue }) => {
    // Simple duplicate request prevention
    if (globalFetchInProgress) {
      return rejectWithValue("Request already in progress");
    }

    globalFetchInProgress = true;

    try {
      console.log("🔄 Fetching account details for customer:", customerId);

      // ✅ USING api.js INSTEAD OF axios.get()
      const response = await api.get(
        `/active-account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
          timeout: 30000,
        }
      );

      console.log("✅ API Response:", {
        count: response.data.count_account_details,
        accounts: response.data.account_details,
      });

      // ✅ RETURN THE FULL RESPONSE DATA
      return {
        accounts: response.data.account_details,
        count: response.data.count_account_details,
        message: response.data.message,
      };
    } catch (error) {
      console.error("❌ Error fetching account details:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      // Reset after a short delay
      setTimeout(() => {
        globalFetchInProgress = false;
      }, 1000);
    }
  }
);

export const updateAccountBalance = createAsyncThunk(
  "account/updateAccountBalance",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      // ✅ USING api.js INSTEAD OF axios.get()
      const updateResponse = await api.get(`${API_URL}/transaction-balance`, {
        headers: { Authorization: `Bearer ${authtoken}` },
      });

      if (updateResponse.data.status !== "success") {
        throw new Error("Failed to update balance");
      }

      // ✅ USING api.js INSTEAD OF axios.get()
      const balanceResponse = await api.get(
        `/account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
        }
      );

      if (balanceResponse.data.count_account_details > 0) {
        return {
          accounts: balanceResponse.data.account_details,
          count: balanceResponse.data.count_account_details,
        };
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
    // ✅ ADDED: Manual accounts setter for debugging
    setAccounts: (state, action) => {
      state.accounts = Array.isArray(action.payload) ? action.payload : [];
      if (state.accounts.length > 0 && !state.selectedAccount) {
        state.selectedAccount = state.accounts[0];
        state.selectedCurrency = state.accounts[0].currency;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountDetails.pending, (state) => {
        console.log("🔄 Account details fetch pending...");
        state.accountLoading = true;
        state.accountError = null;
      })
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        console.log("✅ Account details fetch fulfilled:", action.payload);

        state.accountLoading = false;

        // ✅ Ensure accounts are always set as array
        const accounts = Array.isArray(action.payload.accounts)
          ? action.payload.accounts
          : Array.isArray(action.payload)
          ? action.payload
          : [];

        state.accounts = accounts;
        state.lastUpdated = new Date().toISOString();
        state.hasFetchedAccount = true;

        console.log("📊 Stored accounts:", accounts.length);

        // ✅ Force set selected account if we have accounts
        if (accounts.length > 0) {
          state.selectedAccount = accounts[0];
          state.selectedCurrency = accounts[0].currency;
        }

        // ✅ Clear any existing errors
        state.accountError = null;
      })
      .addCase(fetchAccountDetails.rejected, (state, action) => {
        console.log("❌ Account details fetch rejected:", action.payload);

        state.accountLoading = false;

        // Don't treat "request in progress" as a real error
        if (action.payload !== "Request already in progress") {
          state.accountError =
            typeof action.payload === "string"
              ? action.payload
              : extractErrorMessage(action.payload);
        }

        // Only mark as not fetched for real errors
        if (action.payload !== "Request already in progress") {
          state.hasFetchedAccount = false;
        }
      })
      .addCase(updateAccountBalance.pending, (state) => {
        state.balanceLoading = true;
        state.accountError = null;
      })
      .addCase(updateAccountBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;

        const accounts = Array.isArray(action.payload.accounts)
          ? action.payload.accounts
          : Array.isArray(action.payload)
          ? action.payload
          : [];

        state.accounts = accounts;

        if (state.selectedAccount && accounts.length > 0) {
          const updatedAccount = accounts.find(
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
        state.accountError =
          typeof action.payload === "string"
            ? action.payload
            : extractErrorMessage(action.payload);
      });
  },
});

// Enhanced selectors with better debugging
export const selectAccounts = (state) => {
  const accounts = state.account?.accounts;
  console.log("🔍 selectAccounts called:", accounts);
  return Array.isArray(accounts) ? accounts : [];
};

export const selectSelectedAccount = (state) => {
  const account = state.account?.selectedAccount || null;
  console.log("🔍 selectSelectedAccount called:", account);
  return account;
};

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
export const selectAccountDropdown = (state) => ({
  isOpen: state.account?.accountDropdownOpen || false,
});

// Utility selectors
export const selectCurrencyOptions = (state) => {
  const accounts = selectAccounts(state);
  return [...new Set(accounts.map((account) => account.currency))].filter(
    Boolean
  );
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
  setAccounts, // ✅ ADDED
} = accountSlice.actions;

export default accountSlice.reducer;