import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../services/api";

// ✅ FIXED: USD Bank Accounts API Call
export const fetchUSDBankAccounts = createAsyncThunk(
  "bankAccounts/fetchUSDBankAccounts",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching USD bank accounts from API...");

      // ✅ CORRECT: Get customerId from localStorage
      const customerId = localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      // ✅ CORRECT: Send proper object with customerId
      const response = await api.post("/sila/manual-sila-bankdetails", {
        customerId: customerId, // Send as object, not number
      });

      console.log("✅ USD Bank Accounts Response:", response.data);

      // ✅ Handle different response structures
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

      console.log(`✅ Found ${accounts.length} USD bank accounts`);
      return accounts;
    } catch (error) {
      console.error("❌ Error fetching USD bank accounts:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to load USD bank accounts"
      );
    }
  }
);

// ✅ FIXED: AED Account Details API Call
export const fetchAEDAccountDetails = createAsyncThunk(
  "bankAccounts/fetchAEDAccountDetails",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching AED account details...");

      const response = await api.get("/manualaccount-detail/AED");

      console.log("✅ AED Account Details Response:", response.data);

      // Handle response structure
      let accountDetails = response.data;
      if (response.data?.data) {
        accountDetails = response.data.data;
      } else if (response.data?.status === "success") {
        accountDetails = response.data.data || response.data;
      }

      return accountDetails;
    } catch (error) {
      console.error("❌ Error fetching AED account details:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to load AED account details"
      );
    }
  }
);

// ✅ ADD: USD Manual Account Details
export const fetchUSDManualAccountDetails = createAsyncThunk(
  "bankAccounts/fetchUSDManualAccountDetails",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching USD manual account details...");

      const customerId = localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      // Use the same endpoint but for manual deposit context
      const response = await api.post("/sila/manual-sila-bankdetails", {
        customerId: customerId,
      });

      console.log("✅ USD Manual Account Details Response:", response.data);

      // Handle response structure for manual details
      let accountDetails = response.data;
      if (response.data?.data) {
        accountDetails = response.data.data;
      } else if (response.data?.status === "success") {
        accountDetails = response.data.data || response.data;
      }

      return accountDetails;
    } catch (error) {
      console.error("❌ Error fetching USD manual account details:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to load USD account details"
      );
    }
  }
);

// ✅ FIXED: Manual Account Details for all currencies (DKK, EUR, GBP, etc.)
export const fetchManualAccountDetails = createAsyncThunk(
  "bankAccounts/fetchManualAccountDetails",
  async (currency, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching manual account details for currency:", currency);

      const customerId = localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error("Customer ID not found");
      }

      // ✅ USE THE CORRECT ENDPOINT THAT WE KNOW WORKS:
      const response = await api.get(`/active-account-details/${customerId}`);

      console.log("✅ Manual Account Details Response:", response.data);

      // Find the account for the selected currency
      const accounts = response.data.account_details || [];
      const accountForCurrency = accounts.find(
        (account) => account.currency === currency
      );

      if (!accountForCurrency) {
        console.warn(`❌ No ${currency} account found in response. Available accounts:`, 
          accounts.map(acc => acc.currency));
        throw new Error(`No ${currency} account found`);
      }

      console.log(`✅ Found ${currency} account:`, {
        accountId: accountForCurrency.account_id,
        currency: accountForCurrency.currency,
        bankName: accountForCurrency.bank_name,
        accountNumber: accountForCurrency.account_number,
        iban: accountForCurrency.iban
      });

      // ✅ RETURN the account data so Redux can store it
      return accountForCurrency;
    } catch (error) {
      console.error("❌ Error fetching manual account details:", error);
      return rejectWithValue(
        error.response?.data?.message || `Failed to load ${currency} account details`
      );
    }
  }
);


// Bank Accounts Slice
const bankAccountSlice = createSlice({
  name: "bankAccounts",
  initialState: {
    // USD Bank Accounts
    usdBankAccounts: [],
    usdAccountsLoading: false,
    usdAccountsError: null,

    // AED Account Details
    aedAccountDetails: null,
    aedDetailsLoading: false,
    aedDetailsError: null,

    // USD Manual Account Details
    usdManualAccountDetails: null,
    usdManualDetailsLoading: false,
    usdManualDetailsError: null,

    // Manual Account Details for all currencies
    manualAccountDetails: null,
    manualDetailsLoading: false,
    manualDetailsError: null,

    // Track current currency to prevent mismatches
    currentCurrency: null,
  },
  reducers: {
    clearBankAccountErrors: (state) => {
      state.usdAccountsError = null;
      state.aedDetailsError = null;
      state.usdManualDetailsError = null;
      state.manualDetailsError = null;
    },
    resetBankAccounts: (state) => {
      state.usdBankAccounts = [];
      state.aedAccountDetails = null;
      state.usdManualAccountDetails = null;
      state.manualAccountDetails = null;
      state.usdAccountsError = null;
      state.aedDetailsError = null;
      state.usdManualDetailsError = null;
      state.manualDetailsError = null;
      state.currentCurrency = null;
    },
    // ✅ CRITICAL FIX: Clear manual account details
    clearManualAccountDetails: (state) => {
      state.manualAccountDetails = null;
      state.manualDetailsLoading = false;
      state.manualDetailsError = null;
      console.log("✅ Redux: Manual account details cleared");
    },
    // ✅ CRITICAL FIX: Set currency and clear old data
    setCurrencyAndClearManualDetails: (state, action) => {
      const newCurrency = action.payload;
      
      // Only clear if currency is actually changing
      if (state.currentCurrency !== newCurrency) {
        console.log(`🔄 Redux: Currency changing from ${state.currentCurrency} to ${newCurrency}, clearing manual details`);
        state.manualAccountDetails = null;
        state.manualDetailsLoading = false;
        state.manualDetailsError = null;
        state.currentCurrency = newCurrency;
      }
    },
    // ✅ Force clear manual details for currency mismatch
    forceClearManualDetailsForCurrency: (state, action) => {
      const expectedCurrency = action.payload;
      if (state.manualAccountDetails && state.manualAccountDetails.currency !== expectedCurrency) {
        console.warn(`🚨 Redux: Force clearing manual details - expected ${expectedCurrency}, got ${state.manualAccountDetails.currency}`);
        state.manualAccountDetails = null;
        state.manualDetailsLoading = false;
        state.manualDetailsError = null;
      }
    }
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
      })
      .addCase(fetchUSDBankAccounts.rejected, (state, action) => {
        state.usdAccountsLoading = false;
        state.usdAccountsError = action.payload;
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

      // USD Manual Account Details
      .addCase(fetchUSDManualAccountDetails.pending, (state) => {
        state.usdManualDetailsLoading = true;
        state.usdManualDetailsError = null;
      })
      .addCase(fetchUSDManualAccountDetails.fulfilled, (state, action) => {
        state.usdManualDetailsLoading = false;
        state.usdManualAccountDetails = action.payload;
      })
      .addCase(fetchUSDManualAccountDetails.rejected, (state, action) => {
        state.usdManualDetailsLoading = false;
        state.usdManualDetailsError = action.payload;
      })

      // Manual Account Details for all currencies
      .addCase(fetchManualAccountDetails.pending, (state) => {
        state.manualDetailsLoading = true;
        state.manualDetailsError = null;
      })
      .addCase(fetchManualAccountDetails.fulfilled, (state, action) => {
        state.manualDetailsLoading = false;
        state.manualAccountDetails = action.payload;
        
        // Update current currency to match the loaded data
        state.currentCurrency = action.payload.currency;

        console.log("✅ Redux: Manual Account Details stored:", {
          currency: action.payload.currency,
          accountId: action.payload.account_id,
          bankName: action.payload.bank_name
        });
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
} = bankAccountSlice.actions;

export default bankAccountSlice.reducer;