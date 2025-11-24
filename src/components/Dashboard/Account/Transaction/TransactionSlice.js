import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL;

// ✅ TRANSACTION REQUEST COORDINATION
let transactionFetchInProgress = false;
const TRANSACTION_FETCH_COOLDOWN = 10000; // 10 seconds
const successfulTransactionFetches = new Map();

const getTransactionRequestKey = (customerId, currencyCode) => {
  return `transactions-${customerId}-${currencyCode}`;
};

const hasSuccessfulTransactionFetch = (customerId, currencyCode) => {
  return successfulTransactionFetches.has(getTransactionRequestKey(customerId, currencyCode));
};

// Async thunks
export const fetchTransactionDetails = createAsyncThunk(
  "transaction/fetchTransactionDetails",
  async ({ customerId, currencyCode }, { rejectWithValue, getState }) => {
    
    const requestKey = getTransactionRequestKey(customerId, currencyCode);
    
    // ✅ STOP IF ALREADY HAVE SUCCESSFUL DATA
    if (hasSuccessfulTransactionFetch(customerId, currencyCode)) {
      console.log("✅ Already have successful transaction data, skipping fetch");
      return rejectWithValue("Already have successful transaction data");
    }

    // ✅ PREVENT DUPLICATE REQUESTS
    if (transactionFetchInProgress) {
      console.log("⏸️ Transaction fetch already in progress, skipping...");
      return rejectWithValue("Transaction fetch already in progress");
    }

    transactionFetchInProgress = true;

    try {
      const state = getState();
      const token = state.auth.token;

      console.log(`🔄 Fetching transactions for ${customerId}/${currencyCode}`);

      const response = await axios.get(
        `${API_URL}/transactions/currency-transaction-details/${customerId}/${currencyCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );

      console.log("✅ Transaction fetch successful:", {
        customerId,
        currencyCode,
        count: response.data.transaction_details?.length || 0
      });

      // ✅ MARK AS SUCCESSFUL FETCH
      if (response.data.status === "success") {
        successfulTransactionFetches.set(requestKey, {
          timestamp: Date.now(),
          count: response.data.transaction_details?.length || 0
        });
      }

      return response.data.transaction_details || [];
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      return rejectWithValue(error.message);
    } finally {
      setTimeout(() => {
        transactionFetchInProgress = false;
      }, TRANSACTION_FETCH_COOLDOWN);
    }
  }
);

export const exportTransactionsToExcel = createAsyncThunk(
  "transaction/exportToExcel",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token;

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

const initialState = {
  transactions: [],
  loading: false,
  exporting: false,
  error: null,
  lastFetched: null,
  hasFetchedTransactions: false,
};

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    clearTransactions: (state) => {
      state.transactions = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetTransactionState: () => initialState,
    // ✅ ADDED: Clear successful transaction fetch
    clearSuccessfulTransactionFetch: (state, action) => {
      const { customerId, currencyCode } = action.payload;
      if (customerId && currencyCode) {
        const key = getTransactionRequestKey(customerId, currencyCode);
        successfulTransactionFetches.delete(key);
        console.log("🧹 Cleared successful transaction fetch for:", key);
      } else {
        successfulTransactionFetches.clear();
        console.log("🧹 Cleared all successful transaction fetches");
      }
    },
    // ✅ ADDED: Force refresh transactions
    forceRefreshTransactions: (state, action) => {
      const { customerId, currencyCode } = action.payload;
      if (customerId && currencyCode) {
        const key = getTransactionRequestKey(customerId, currencyCode);
        successfulTransactionFetches.delete(key);
        state.hasFetchedTransactions = false;
        console.log("🔄 Force refresh transactions for:", key);
      }
    },
    setHasFetchedTransactions: (state, action) => {
      state.hasFetchedTransactions = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transaction Details
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        state.lastFetched = new Date().toISOString();
        state.hasFetchedTransactions = true;
        state.error = null;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        // ✅ Don't set error for "already have data" cases
        const isAlreadyHaveData = action.payload === "Already have successful transaction data";
        
        if (!isAlreadyHaveData) {
          state.error = action.payload;
        } else {
          console.log("⏸️ Transaction fetch skipped - already have data");
        }
        
        state.loading = false;
        state.hasFetchedTransactions = isAlreadyHaveData ? true : state.hasFetchedTransactions;
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
      });
  },
});

export const {
  clearTransactions,
  setLoading,
  clearError,
  resetTransactionState,
  clearSuccessfulTransactionFetch,
  forceRefreshTransactions,
  setHasFetchedTransactions,
} = transactionSlice.actions;

// Selectors
export const selectTransactions = (state) => state.transaction.transactions;
export const selectTransactionLoading = (state) => state.transaction.loading;
export const selectExporting = (state) => state.transaction.exporting;
export const selectTransactionError = (state) => state.transaction.error;
export const selectLastFetched = (state) => state.transaction.lastFetched;
export const selectHasFetchedTransactions = (state) => state.transaction.hasFetchedTransactions;

// ✅ EXPORT UTILITY FUNCTIONS FOR HOOKS
export const transactionUtils = {
  getTransactionRequestKey,
  hasSuccessfulTransactionFetch,
  clearTransactionSuccessCache: (customerId, currencyCode) => {
    if (customerId && currencyCode) {
      const key = getTransactionRequestKey(customerId, currencyCode);
      successfulTransactionFetches.delete(key);
    } else {
      successfulTransactionFetches.clear();
    }
  }
};

export default transactionSlice.reducer;