// transactionSlice.js (Updated with Monthly Transactions)
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL;

// ===== TRANSACTIONS SLICE =====

// ✅ SIMPLIFIED: Remove complex coordination logic
let transactionFetchInProgress = false;

// Helper function to get token from localStorage as fallback
const getAuthToken = () => {
  console.log("transaction slice getAuthToken",localStorage.getItem("bearertoken"));
  // First try to get from localStorage
  const localStorageToken = localStorage.getItem("bearertoken") || "BPhLpkbsd6c7vUS5zExR6ggk7BurZZq5ayca3KqP46761206";
  return localStorageToken;
};

// Async thunks for regular transactions
export const fetchTransactionDetails = createAsyncThunk(
  "transaction/fetchTransactionDetails",
  async ({ customerId, currencyCode }, { rejectWithValue, getState }) => {
    // ✅ SIMPLE DUPLICATE REQUEST PREVENTION ONLY

    transactionFetchInProgress = true;

    try {
      const state = getState();
      // Try Redux store first, then localStorage as fallback
      const token = "52675|BPhLpkbsd6c7vUS5zExR6ggk7BurZZq5ayca3KqP46761206";

      if (!token) {
        console.error("❌ TRANSACTION SLICE: No authentication token available");
        return rejectWithValue("No authentication token available");
      }

      console.log("🔄 TRANSACTION SLICE: Fetching transactions for", currencyCode);

      const response = await axios.get(
        `${API_URL}/transactions/currency-transaction-details/${customerId}/${currencyCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );

      console.log("✅ TRANSACTION SLICE: Fetch successful for", currencyCode);

      return response.data.transaction_details || [];
    } catch (error) {
      console.error("❌ TRANSACTION SLICE: Fetch failed for", currencyCode, error);
      transactionFetchInProgress = false;
      return rejectWithValue(error.message);
    } finally {
      // Reset immediately after request completes
      transactionFetchInProgress = false;
    }
  }
);

export const exportTransactionsToExcel = createAsyncThunk(
  "transaction/exportToExcel",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      // Try Redux store first, then localStorage as fallback
      const token = state.auth.token || getAuthToken();

      if (!token) {
        console.error("❌ TRANSACTION SLICE: No authentication token available for export");
        return rejectWithValue("No authentication token available");
      }

      const response = await axios.get(
        `${API_URL}/transactions/currency-transaction-details/${customerId}/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const transactions = response.data.transaction_details || [];

      // Map the transaction details for Excel
      const data = transactions.map((transaction) => ({
        "Transaction ID": transaction.transaction_id || "",
        "Transaction Status": transaction.status || "",
        State: transaction.state || "",
        Direction: transaction.direction || "",
        "Instructed Amount": transaction.instructed_amount || "",
        "Amount with Fee": transaction.amount_with_fee || "",
        Balance: transaction.balance || "",
        "Fee Amount": transaction.fee_amount || "",
        "Service Provider Fee": transaction.service_provider_fee || "",
        "Beneficiary Name": transaction.beneficiary_name || "",
        "Currency Code": transaction.currency_code || "",
        "Sender Name": transaction.sender_name || "",
        "Transaction Date": transaction.transaction_datetime || "",
      }));

      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transaction Details");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Trigger download
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `transaction_details_${customerId}.xlsx`;
      link.click();

      return { success: true, count: transactions.length };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ===== MONTHLY TRANSACTIONS SLICE =====

// Async thunks for monthly statements
export const fetchStatements = createAsyncThunk(
  "transaction/fetchStatements",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/show-pdf/${customerId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCustomerBankAccounts = createAsyncThunk(
  "transaction/fetchCustomerBankAccounts",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      // Try Redux store first, then localStorage as fallback
      const token = state.auth.token || getAuthToken();

      if (!token) {
        console.error("❌ TRANSACTION SLICE: No authentication token available for bank accounts");
        return rejectWithValue("No authentication token available");
      }

      console.log("🔄 TRANSACTION SLICE: Fetching bank accounts for customer", customerId);
      console.log("🔄 Using token:", token ? "Token present (first 10 chars): " + token.substring(0, 10) + "..." : "No token");

      const response = await axios.get(
        `${API_URL}/active-approved-bank-accounts/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log("✅ TRANSACTION SLICE: Bank accounts fetch successful");
      return response.data.account_details;
    } catch (error) {
      console.error("❌ TRANSACTION SLICE: Bank accounts fetch failed", error);
      
      // Log more details about the error
      if (error.response) {
        console.error("❌ Error response status:", error.response.status);
        console.error("❌ Error response data:", error.response.data);
      }
      
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Combined Initial State
const initialState = {
  // Regular Transactions State
  transactions: [],
  loading: false,
  exporting: false,
  error: null,
  lastFetched: null,
  hasFetchedTransactions: false,
  
  // Monthly Statements State
  statements: [],
  filteredStatements: [],
  customerBankAccounts: [],
  selectedCurrency: '',
  selectedMonth: '',
  selectedYear: '',
  statementsLoading: false,
  currencyLoading: false,
  statementsError: null,
  statementsDataLoaded: false,
};

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    // Regular Transactions Reducers
    clearTransactions: (state) => {
      state.transactions = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetTransactionState: (state) => {
      state.transactions = [];
      state.loading = false;
      state.exporting = false;
      state.error = null;
      state.lastFetched = null;
      state.hasFetchedTransactions = false;
    },
    forceRefreshTransactions: (state) => {
      state.hasFetchedTransactions = false;
    },
    setHasFetchedTransactions: (state, action) => {
      state.hasFetchedTransactions = action.payload;
    },
    
    // Monthly Statements Reducers
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
    },
    setSelectedMonth: (state, action) => {
      state.selectedMonth = action.payload;
    },
    setSelectedYear: (state, action) => {
      state.selectedYear = action.payload;
    },
    filterStatements: (state) => {
      let filtered = [...state.statements];
      
      if (state.selectedCurrency) {
        filtered = filtered.filter((item) => item.currency === state.selectedCurrency);
      }
      
      if (state.selectedMonth) {
        filtered = filtered.filter(
          (item) => item.month === parseInt(state.selectedMonth)
        );
      }
      
      if (state.selectedYear) {
        filtered = filtered.filter(
          (item) => item.year === parseInt(state.selectedYear)
        );
      }
      
      state.filteredStatements = filtered;
    },
    clearStatements: (state) => {
      state.statements = [];
      state.filteredStatements = [];
      state.customerBankAccounts = [];
      state.selectedCurrency = '';
      state.selectedMonth = '';
      state.selectedYear = '';
    },
    resetMonthlyStatementsState: (state) => {
      state.statements = [];
      state.filteredStatements = [];
      state.customerBankAccounts = [];
      state.selectedCurrency = '';
      state.selectedMonth = '';
      state.selectedYear = '';
      state.statementsLoading = false;
      state.currencyLoading = false;
      state.statementsError = null;
      state.statementsDataLoaded = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Regular Transactions
      .addCase(fetchTransactionDetails.pending, (state) => {
        console.log("🔄 TRANSACTION SLICE: Fetch pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        console.log("✅ TRANSACTION SLICE: Fetch fulfilled", action.payload.length, "transactions");
        state.loading = false;
        state.transactions = action.payload;
        state.lastFetched = new Date().toISOString();
        state.hasFetchedTransactions = true;
        state.error = null;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        console.log("❌ TRANSACTION SLICE: Fetch rejected", action.payload);
        
        if (action.payload !== "Transaction fetch already in progress") {
          state.error = action.payload;
        }
        
        state.loading = false;
      })
      // Export to Excel
      .addCase(exportTransactionsToExcel.pending, (state) => {
        state.exporting = true;
        state.error = null;
      })
      .addCase(exportTransactionsToExcel.fulfilled, (state) => {
        state.exporting = false;
      })
      .addCase(exportTransactionsToExcel.rejected, (state, action) => {
        state.exporting = false;
        state.error = action.payload;
      })
      // Monthly Statements
      .addCase(fetchStatements.pending, (state) => {
        state.statementsLoading = true;
        state.statementsError = null;
      })
      .addCase(fetchStatements.fulfilled, (state, action) => {
        state.statementsLoading = false;
        state.statements = Array.isArray(action.payload) ? action.payload : [];
        state.filteredStatements = Array.isArray(action.payload) ? action.payload : [];
        state.statementsDataLoaded = true;
      })
      .addCase(fetchStatements.rejected, (state, action) => {
        state.statementsLoading = false;
        state.statementsError = action.payload;
      })
      // Customer Bank Accounts
      .addCase(fetchCustomerBankAccounts.pending, (state) => {
        state.currencyLoading = true;
        state.statementsError = null;
      })
      .addCase(fetchCustomerBankAccounts.fulfilled, (state, action) => {
        state.currencyLoading = false;
        state.customerBankAccounts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCustomerBankAccounts.rejected, (state, action) => {
        state.currencyLoading = false;
        state.statementsError = action.payload;
      });
  },
});

// Export Actions
export const {
  // Regular Transactions
  clearTransactions,
  setLoading,
  clearError,
  resetTransactionState,
  forceRefreshTransactions,
  setHasFetchedTransactions,
  
  // Monthly Statements
  setSelectedCurrency,
  setSelectedMonth,
  setSelectedYear,
  filterStatements,
  clearStatements,
  resetMonthlyStatementsState,
} = transactionSlice.actions;

// Selectors
// Regular Transactions
export const selectTransactions = (state) => state.transaction.transactions;
export const selectTransactionLoading = (state) => state.transaction.loading;
export const selectExporting = (state) => state.transaction.exporting;
export const selectTransactionError = (state) => state.transaction.error;
export const selectLastFetched = (state) => state.transaction.lastFetched;
export const selectHasFetchedTransactions = (state) => state.transaction.hasFetchedTransactions;

// Monthly Statements
export const selectStatements = (state) => state.transaction.statements;
export const selectFilteredStatements = (state) => state.transaction.filteredStatements;
export const selectCustomerBankAccounts = (state) => state.transaction.customerBankAccounts;
export const selectSelectedCurrency = (state) => state.transaction.selectedCurrency;
export const selectSelectedMonth = (state) => state.transaction.selectedMonth;
export const selectSelectedYear = (state) => state.transaction.selectedYear;
export const selectStatementsLoading = (state) => state.transaction.statementsLoading;
export const selectCurrencyLoading = (state) => state.transaction.currencyLoading;
export const selectStatementsError = (state) => state.transaction.statementsError;
export const selectStatementsDataLoaded = (state) => state.transaction.statementsDataLoaded;

// Utility Functions
export const transactionUtils = {
  hasSuccessfulTransactionFetch: () => false,
  clearTransactionSuccessCache: () => {}
};

export default transactionSlice.reducer;