import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { extractErrorMessage } from "../../../../utils/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks
export const fetchAccountDetails = createAsyncThunk(
  "account/fetchAccountDetails",
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching account details for customer:", customerId);
      
      const response = await axios.get(
        `${API_URL}/active-account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${authtoken}` },
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
    // Debug action to check store state
    debugAccountState: (state) => {
      console.log("🔍 Account State Debug:", {
        accounts: state.accounts,
        selectedAccount: state.selectedAccount,
        selectedCurrency: state.selectedCurrency,
        accountLoading: state.accountLoading,
        accountsCount: state.accounts.length,
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
  console.log("🔍 selectAccounts - state.account:", state.account);
  console.log("🔍 selectAccounts - accounts:", accounts);
  return Array.isArray(accounts) ? accounts : [];
};

export const selectSelectedAccount = (state) => state.account?.selectedAccount || null;
export const selectSelectedCurrency = (state) => state.account?.selectedCurrency || "all";
export const selectAccountLoading = (state) => state.account?.accountLoading || false;
export const selectBalanceLoading = (state) => state.account?.balanceLoading || false;
export const selectAccountError = (state) => state.account?.accountError || null;
export const selectLastUpdated = (state) => state.account?.lastUpdated || null;
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
  debugAccountState,
} = accountSlice.actions;

export default accountSlice.reducer;