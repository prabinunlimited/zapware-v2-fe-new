import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL;

// ✅ SIMPLIFIED: Remove complex coordination logic
let transactionFetchInProgress = false;

// Async thunks
export const fetchTransactionDetails = createAsyncThunk(
  "transaction/fetchTransactionDetails",
  async ({ customerId, currencyCode }, { rejectWithValue, getState }) => {
    
    // ✅ REMOVED: Success-based stopping logic
    // ✅ ALWAYS FETCH when called
    
    // ✅ SIMPLE DUPLICATE REQUEST PREVENTION ONLY
    if (transactionFetchInProgress) {
      return rejectWithValue("Transaction fetch already in progress");
    }

    transactionFetchInProgress = true;

    try {
      const state = getState();
      const token = state.auth.token;

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
    // ✅ SIMPLIFIED: Remove complex cache management
    forceRefreshTransactions: (state) => {
      // Just reset the local state, no complex cache clearing needed
      state.hasFetchedTransactions = false;
    },
    setHasFetchedTransactions: (state, action) => {
      state.hasFetchedTransactions = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transaction Details
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
        
        // ✅ Don't treat "request in progress" as a real error
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
      });
  },
});

export const {
  clearTransactions,
  setLoading,
  clearError,
  resetTransactionState,
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

// ✅ SIMPLIFIED UTILITY FUNCTIONS
export const transactionUtils = {
  hasSuccessfulTransactionFetch: () => false, // Always return false to allow fetching
  clearTransactionSuccessCache: () => {} // No-op since we removed caching
};

export default transactionSlice.reducer;