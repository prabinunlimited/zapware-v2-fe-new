// src/features/Transaction/transactionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks
export const fetchTransactionDetails = createAsyncThunk(
  "transaction/fetchTransactionDetails",
  async ({ customerId, currencyCode }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token; // Use the main token

      const response = await axios.get(
        `${API_URL}/transactions/currency-transaction-details/${customerId}/${currencyCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.transaction_details || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const exportTransactionsToExcel = createAsyncThunk(
  "transaction/exportToExcel",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token; // Use the main token

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
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
} = transactionSlice.actions;

// Selectors
export const selectTransactions = (state) => state.transaction.transactions;
export const selectTransactionLoading = (state) => state.transaction.loading;
export const selectExporting = (state) => state.transaction.exporting;
export const selectTransactionError = (state) => state.transaction.error;
export const selectLastFetched = (state) => state.transaction.lastFetched;

export default transactionSlice.reducer;
