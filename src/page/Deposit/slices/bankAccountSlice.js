// src/features/BankAccounts/slices/bankAccountSlice.js - COMPLETE
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../services/api";

// ✅ COMPLETE: USD Bank Accounts API Call
export const fetchUSDBankAccounts = createAsyncThunk(
  "bankAccounts/fetchUSDBankAccounts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const customerId = localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      // ✅ CORRECT ENDPOINT: Use sila-bank-details for Plaid-linked accounts
      const response = await api.post("/sila/sila-bank-details", {
        customerId: customerId,
      });

      let accounts = [];
      const data = response.data;

      if (data?.data && Array.isArray(data.data)) {
        accounts = data.data; // This matches your API response structure
      } else if (Array.isArray(data)) {
        accounts = data;
      } else if (data?.status === "success") {
        accounts = data.data || [];
      }

      console.log("✅ Plaid-linked USD Bank Accounts loaded:", accounts.length);
      return accounts;
    } catch (error) {
      console.error("❌ Failed to load Plaid-linked USD bank accounts:", error);

      // Fallback to bankLink accounts if available
      const state = getState();
      const bankLinkAccounts = state.bankLink?.bankAccounts || [];
      const usdBankLinkAccounts = bankLinkAccounts.filter(
        (account) => account.currency === "USD" || !account.currency
      );

      if (usdBankLinkAccounts.length > 0) {
        console.log(
          "🔄 Using bankLink accounts as fallback:",
          usdBankLinkAccounts.length
        );
        return usdBankLinkAccounts;
      }

      return rejectWithValue(
        error.response?.data?.message || "Failed to load USD bank accounts"
      );
    }
  }
);

export const fetchCombinedUSDAccounts = createAsyncThunk(
  "bankAccounts/fetchCombinedUSDAccounts",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const customerId = localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      console.log("🔄 Fetching combined USD accounts...");

      // Fetch both Plaid-linked and manual accounts in parallel
      const [plaidResponse, manualResponse] = await Promise.allSettled([
        api.post("/sila/sila-bank-details", { customerId }),
        api.post("/sila/manual-sila-bankdetails", { customerId }),
      ]);

      let plaidAccounts = [];
      let manualAccounts = [];

      // Process Plaid accounts
      if (plaidResponse.status === "fulfilled") {
        const data = plaidResponse.value.data;
        if (data?.data && Array.isArray(data.data)) {
          plaidAccounts = data.data;
        } else if (Array.isArray(data)) {
          plaidAccounts = data;
        } else if (data?.status === "success") {
          plaidAccounts = data.data || [];
        }
        console.log("✅ Plaid-linked USD accounts:", plaidAccounts.length);
      }

      // Process Manual accounts
      if (manualResponse.status === "fulfilled") {
        const data = manualResponse.value.data;
        if (Array.isArray(data)) {
          manualAccounts = data;
        } else if (data?.accounts) {
          manualAccounts = data.accounts;
        } else if (data?.data) {
          manualAccounts = Array.isArray(data.data) ? data.data : [data.data];
        } else if (data?.status === "success") {
          manualAccounts = data.data || [];
        }
        console.log("✅ Manual USD accounts:", manualAccounts.length);
      }

      // Combine accounts (you might want to deduplicate or merge logic here)
      const combinedAccounts = [...plaidAccounts, ...manualAccounts];

      console.log("✅ Combined USD accounts total:", combinedAccounts.length);
      return combinedAccounts;
    } catch (error) {
      console.error("❌ Failed to load combined USD accounts:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to load combined USD accounts"
      );
    }
  }
);

// ✅ ADD: Manual Bank Details API Call - For manual deposit accounts
export const fetchManualBankDetails = createAsyncThunk(
  "bankAccounts/fetchManualBankDetails",
  async (_, { rejectWithValue }) => {
    try {
      const customerId = localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      // ✅ CORRECT ENDPOINT: Use manual-sila-bankdetails for manual accounts
      const response = await api.post("/sila/manual-sila-bankdetails", {
        customerId: customerId,
      });

      let accounts = [];
      const data = response.data;

      if (Array.isArray(data)) {
        accounts = data;
      } else if (data?.accounts) {
        accounts = data.accounts;
      } else if (data?.data) {
        accounts = Array.isArray(data.data) ? data.data : [data.data];
      } else if (data?.status === "success") {
        accounts = data.data || [];
      }

      console.log("✅ Manual USD Bank Details loaded:", accounts.length);
      return accounts;
    } catch (error) {
      console.error("❌ Failed to load manual bank details:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to load manual bank details"
      );
    }
  }
);

// ✅ COMPLETE: AED Account Details API Call
export const fetchAEDAccountDetails = createAsyncThunk(
  "bankAccounts/fetchAEDAccountDetails",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/manualaccount-detail/AED");

      let accountDetails = response.data;
      if (response.data?.data) {
        accountDetails = response.data.data;
      } else if (response.data?.status === "success") {
        accountDetails = response.data.data || response.data;
      }

      return accountDetails;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load AED account details"
      );
    }
  }
);

// ✅ COMPLETE: Manual Account Details for all currencies
export const fetchManualAccountDetails = createAsyncThunk(
  "bankAccounts/fetchManualAccountDetails",
  async (currency, { rejectWithValue }) => {
    try {
      const customerId = localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      const response = await api.get(`/active-account-details/${customerId}`);

      const accounts = response.data.account_details || [];
      const accountForCurrency = accounts.find(
        (account) => account.currency === currency
      );

      if (!accountForCurrency) {
        throw new Error(`No ${currency} account found`);
      }

      return accountForCurrency;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          `Failed to load ${currency} account details`
      );
    }
  }
);

// ✅ COMPLETE: Bank Accounts Slice
const bankAccountSlice = createSlice({
  name: "bankAccounts",
  initialState: {
    usdBankAccounts: [],
    usdAccountsLoading: false,
    usdAccountsError: null,

    combinedUSDAccounts: [],
    combinedUSDAccountsLoading: false,
    combinedUSDAccountsError: null,

    aedAccountDetails: null,
    aedDetailsLoading: false,
    aedDetailsError: null,

    manualAccountDetails: null,
    manualDetailsLoading: false,
    manualDetailsError: null,

    currentCurrency: null,
    hasSilaAccounts: false,
  },
  reducers: {
    clearBankAccountErrors: (state) => {
      state.usdAccountsError = null;
      state.aedDetailsError = null;
      state.manualDetailsError = null;
    },
    resetBankAccounts: (state) => {
      state.usdBankAccounts = [];
      state.aedAccountDetails = null;
      state.manualAccountDetails = null;
      state.usdAccountsError = null;
      state.aedDetailsError = null;
      state.manualDetailsError = null;
      state.currentCurrency = null;
      state.hasSilaAccounts = false;
    },
    clearManualAccountDetails: (state) => {
      state.manualAccountDetails = null;
      state.manualDetailsLoading = false;
      state.manualDetailsError = null;
    },
    setCurrencyAndClearManualDetails: (state, action) => {
      const newCurrency = action.payload;

      if (state.currentCurrency !== newCurrency) {
        state.manualAccountDetails = null;
        state.manualDetailsLoading = false;
        state.manualDetailsError = null;
        state.currentCurrency = newCurrency;
      }
    },
    forceClearManualDetailsForCurrency: (state, action) => {
      const expectedCurrency = action.payload;
      if (
        state.manualAccountDetails &&
        state.manualAccountDetails.currency !== expectedCurrency
      ) {
        state.manualAccountDetails = null;
        state.manualDetailsLoading = false;
        state.manualDetailsError = null;
      }
    },
    // ✅ ADDED: Set USD accounts manually (for synchronization)
    setUSDBankAccounts: (state, action) => {
      state.usdBankAccounts = action.payload;
      state.hasSilaAccounts = action.payload.length > 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // USD Bank Accounts
      .addCase(fetchUSDBankAccounts.pending, (state) => {
        state.usdAccountsLoading = true;
        state.usdAccountsError = null;
      })
      .addCase(fetchUSDBankAccounts.fulfilled, (state, action) => {
        state.usdAccountsLoading = false;
        state.usdBankAccounts = action.payload;
        state.hasSilaAccounts = action.payload.length > 0;
      })
      .addCase(fetchUSDBankAccounts.rejected, (state, action) => {
        state.usdAccountsLoading = false;
        state.usdAccountsError = action.payload;
        state.hasSilaAccounts = false;
      })

      // AED Account Details
      .addCase(fetchAEDAccountDetails.pending, (state) => {
        state.aedDetailsLoading = true;
        state.aedDetailsError = null;
      })
      .addCase(fetchAEDAccountDetails.fulfilled, (state, action) => {
        state.aedDetailsLoading = false;
        state.aedAccountDetails = action.payload;
      })
      .addCase(fetchAEDAccountDetails.rejected, (state, action) => {
        state.aedDetailsLoading = false;
        state.aedDetailsError = action.payload;
      })

      // Manual Account Details
      .addCase(fetchManualAccountDetails.pending, (state) => {
        state.manualDetailsLoading = true;
        state.manualDetailsError = null;
      })
      .addCase(fetchManualAccountDetails.fulfilled, (state, action) => {
        state.manualDetailsLoading = false;
        state.manualAccountDetails = action.payload;
        state.currentCurrency = action.payload.currency;
      })
      .addCase(fetchManualAccountDetails.rejected, (state, action) => {
        state.manualDetailsLoading = false;
        state.manualDetailsError = action.payload;
        state.manualAccountDetails = null;
      });
  },
});

export const {
  clearBankAccountErrors,
  resetBankAccounts,
  clearManualAccountDetails,
  setCurrencyAndClearManualDetails,
  forceClearManualDetailsForCurrency,
  setUSDBankAccounts,
} = bankAccountSlice.actions;

// ✅ COMPLETE: Selectors
export const selectUSDBankAccounts = (state) =>
  state.bankAccounts.usdBankAccounts;
export const selectUSDAccountsLoading = (state) =>
  state.bankAccounts.usdAccountsLoading;
export const selectUSDAccountsError = (state) =>
  state.bankAccounts.usdAccountsError;
export const selectHasSilaAccounts = (state) =>
  state.bankAccounts.hasSilaAccounts;
export const selectAEDAccountDetails = (state) =>
  state.bankAccounts.aedAccountDetails;
export const selectAEDDetailsLoading = (state) =>
  state.bankAccounts.aedDetailsLoading;
export const selectAEDDetailsError = (state) =>
  state.bankAccounts.aedDetailsError;
export const selectManualAccountDetails = (state) =>
  state.bankAccounts.manualAccountDetails;
export const selectManualDetailsLoading = (state) =>
  state.bankAccounts.manualDetailsLoading;
export const selectManualDetailsError = (state) =>
  state.bankAccounts.manualDetailsError;
export const selectCombinedUSDAccounts = (state) =>
  state.bankAccounts.combinedUSDAccounts;
export const selectCombinedUSDAccountsLoading = (state) =>
  state.bankAccounts.combinedUSDAccountsLoading;
export const selectCombinedUSDAccountsError = (state) =>
  state.bankAccounts.combinedUSDAccountsError;

export default bankAccountSlice.reducer;
