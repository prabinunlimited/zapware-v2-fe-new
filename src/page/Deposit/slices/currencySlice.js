import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { tokenService } from "../../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

// Async thunk for fetching currency options - FIXED DATA STRUCTURE
export const fetchCurrencyOptions = createAsyncThunk(
  "currency/fetchCurrencyOptions",
  async (customerId, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("authtoken");

      if (!customerId) {
        throw new Error("Customer ID is required");
      }

      const response = await axios.get(
        `${API_URL}/customers/approved-bank-accounts/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // Validate response structure
      if (!response.data) {
        throw new Error("Invalid response format");
      }

      // ✅ FIXED: Transform data to include currencyid and maintain reference structure
      const responseData = response.data.data || response.data;
      let rawCurrencies = [];

      // Handle different response structures
      if (Array.isArray(responseData)) {
        rawCurrencies = responseData;
      } else if (responseData && Array.isArray(responseData.lists)) {
        rawCurrencies = responseData.lists;
      } else if (responseData && Array.isArray(responseData.accounts)) {
        rawCurrencies = responseData.accounts;
      } else {
        console.warn("Unexpected currency data format:", responseData);
        rawCurrencies = [];
      }

      // ✅ CRITICAL FIX: Transform to include currencyid and all required fields
      const transformedCurrencies = rawCurrencies.map((account, index) => ({
        // Required fields for currency selection
        currency_code: account.currency_code || account.currency,
        currency: account.currency || account.currency_code,

        // ✅ FIXED: Include currencyid for payment methods API
        currencyid: account.currency_id || account.id || account.currencyid,

        // Account identification
        account_id: account.account_id || account.id,
        account_name: account.account_name || `Account ${index + 1}`,
        account_number: account.account_number || "N/A",

        // Balance information
        available_balance: account.available_balance || "0.00",
        current_balance:
          account.current_balance || account.available_balance || "0.00",

        // Bank details
        iban: account.iban || "N/A",
        bank_name: account.bank_name,
        bank_country: account.bank_country,

        // Additional fields from reference component
        flag_url: account.flag_url,
        institution_name: account.institution_name,
        customer_type: account.customer_type,

        // Include all original properties for compatibility
        ...account,
      }));

      console.log("✅ Currency Options Transformed:", {
        originalCount: rawCurrencies.length,
        transformedCount: transformedCurrencies.length,
        sample: transformedCurrencies[0],
      });

      return {
        currencies: transformedCurrencies,
        rawData: response.data, // Keep original for debugging
      };
    } catch (error) {
      console.error("Currency fetch error:", error);

      // Handle different error types
      if (error.code === "ECONNABORTED") {
        return rejectWithValue(
          "Request timeout. Please check your connection."
        );
      }

      if (error.response) {
        return rejectWithValue(
          error.response.data?.message ||
            error.response.data?.error ||
            `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        return rejectWithValue("Network error. Please check your connection.");
      } else {
        return rejectWithValue(error.message || "Failed to load currencies");
      }
    }
  }
);

// ✅ NEW: Async thunk for fetching USD bank accounts
export const fetchUSDBankAccounts = createAsyncThunk(
  "currency/fetchUSDBankAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("authtoken");
      const customerId = localStorage.getItem("authcustomer_id");

      if (!token || !customerId) {
        throw new Error("Authentication required");
      }

      console.log("🔄 Fetching USD bank accounts for customer:", customerId);

      const response = await axios.post(
        `${API_URL}/sila/manual-sila-bankdetails`,
        {
          customerId: customerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      console.log("✅ USD Bank Accounts Response:", response.data);

      // Handle different response structures
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
      console.error("USD bank accounts fetch error:", error);

      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "Failed to load USD bank accounts"
        );
      } else if (error.request) {
        return rejectWithValue("Network error while loading USD bank accounts");
      } else {
        return rejectWithValue(
          error.message || "Failed to load USD bank accounts"
        );
      }
    }
  }
);

// ✅ NEW: Async thunk for fetching AED account details
export const fetchAEDAccountDetails = createAsyncThunk(
  "currency/fetchAEDAccountDetails",
  async (_, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("authtoken");
      const customerId = localStorage.getItem("authcustomer_id");

      if (!token || !customerId) {
        throw new Error("Authentication required");
      }

      console.log("🔄 Fetching AED account details for customer:", customerId);

      // Try multiple possible endpoints
      let response;
      try {
        response = await axios.get(`${API_URL}/account-detail/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });
      } catch (firstError) {
        // Fallback to manual account detail endpoint
        console.log("🔄 Trying fallback endpoint for AED details");
        response = await axios.get(`${API_URL}/manualaccount-detail/AED`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });
      }

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
      console.error("AED account details fetch error:", error);

      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "Failed to load AED account details"
        );
      } else if (error.request) {
        return rejectWithValue(
          "Network error while loading AED account details"
        );
      } else {
        return rejectWithValue(
          error.message || "Failed to load AED account details"
        );
      }
    }
  }
);

export const fetchPaymentMethodsByCurrency = createAsyncThunk(
  "currency/fetchPaymentMethodsByCurrency",
  async (currencyIdentifier, { rejectWithValue }) => {
    try {
      // ✅ USE YOUR EXISTING TOKEN SERVICE FROM AUTH SERVICE
      const token = tokenService.getToken();

      console.log("🔐 Payment Methods Auth Check:", {
        currencyIdentifier,
        tokenInfo: tokenService.debugToken(),
        tokenPresent: !!token,
      });

      // ✅ ENHANCED: If no token, try to refresh
      if (!token) {
        console.log("🔄 No token found, attempting partner login...");
        try {
          const response = await axios.post(
            `${API_URL}/partner-login`,
            {
              client_id: "HK6V7709",
              client_secret: "057d433a-2d02-437b-a265-56114567aa44",
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );

          if (response.data?.data?.token) {
            const newToken = response.data.data.token;
            tokenService.setToken(newToken);
            console.log("✅ Partner token obtained and stored");
          } else {
            throw new Error("Invalid token response structure");
          }
        } catch (partnerError) {
          console.error("❌ Partner login failed:", partnerError);
          throw new Error("Authentication required. Please try again.");
        }
      }

      // ✅ Get the token again (might be refreshed now)
      const finalToken = tokenService.getToken();
      if (!finalToken) {
        throw new Error("No authentication token available");
      }

      console.log("🔄 Fetching payment methods for:", currencyIdentifier);

      const response = await axios.get(
        `${API_URL}/deposit-types-by-currency/${currencyIdentifier}`,
        {
          headers: {
            Authorization: `Bearer ${finalToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Payment Methods Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Payment methods fetch error:", error);

      // Enhanced error handling
      if (error.response?.status === 401) {
        console.error("🚨 401 Unauthorized - Token may be invalid");
        tokenService.clearToken();
        return rejectWithValue("Authentication failed. Please log in again.");
      }

      if (error.response) {
        return rejectWithValue(
          error.response.data?.message ||
            error.response.data?.error ||
            "Failed to load payment methods"
        );
      } else if (error.request) {
        return rejectWithValue("Network error while loading payment methods");
      } else {
        return rejectWithValue(
          error.message || "Failed to load payment methods"
        );
      }
    }
  }
);

const currencySlice = createSlice({
  name: "currency",
  initialState: {
    // Currency options
    currencies: [],
    loading: false,
    error: null,
    lastUpdated: null,

    // ✅ NEW: Selected currency state
    selectedCurrency: null,
    selectedCurrencyDetails: null,

    // ✅ NEW: USD bank accounts state
    usdBankAccounts: [],
    usdAccountsLoading: false,
    usdAccountsError: null,

    // ✅ NEW: AED account details state
    aedAccountDetails: null,
    aedDetailsLoading: false,
    aedDetailsError: null,

    // ✅ NEW: Payment methods state
    paymentMethods: [],
    paymentMethodsLoading: false,
    paymentMethodsError: null,

    // ✅ NEW: Raw data for debugging
    rawData: null,
  },
  reducers: {
    clearCurrencies: (state) => {
      state.currencies = [];
      state.error = null;
      state.rawData = null;
    },

    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;

      // Find and store selected currency details
      if (action.payload && state.currencies.length > 0) {
        state.selectedCurrencyDetails = state.currencies.find(
          (currency) => currency.currency_code === action.payload
        );
      }
    },

    clearError: (state) => {
      state.error = null;
      state.usdAccountsError = null;
      state.aedDetailsError = null;
      state.paymentMethodsError = null;
    },

    // ✅ NEW: Clear USD bank accounts
    clearUSDBankAccounts: (state) => {
      state.usdBankAccounts = [];
      state.usdAccountsError = null;
    },

    // ✅ NEW: Clear AED account details
    clearAEDAccountDetails: (state) => {
      state.aedAccountDetails = null;
      state.aedDetailsError = null;
    },

    // ✅ NEW: Clear payment methods
    clearPaymentMethods: (state) => {
      state.paymentMethods = [];
      state.paymentMethodsError = null;
    },

    // ✅ NEW: Reset all state
    resetCurrencyState: (state) => {
      state.currencies = [];
      state.selectedCurrency = null;
      state.selectedCurrencyDetails = null;
      state.usdBankAccounts = [];
      state.aedAccountDetails = null;
      state.paymentMethods = [];
      state.loading = false;
      state.error = null;
      state.usdAccountsError = null;
      state.aedDetailsError = null;
      state.paymentMethodsError = null;
      state.rawData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Currency Options
      .addCase(fetchCurrencyOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencyOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        // Store transformed currencies
        state.currencies = action.payload.currencies || [];
        state.rawData = action.payload.rawData;

        state.lastUpdated = new Date().toISOString();

        console.log("✅ Currency options stored:", {
          count: state.currencies.length,
          currencies: state.currencies.map((c) => c.currency_code),
        });
      })
      .addCase(fetchCurrencyOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load currencies";
        state.currencies = [];
      })

      // ✅ NEW: USD Bank Accounts
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

      // ✅ NEW: AED Account Details
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

      // ✅ NEW: Payment Methods
      .addCase(fetchPaymentMethodsByCurrency.pending, (state) => {
        state.paymentMethodsLoading = true;
        state.paymentMethodsError = null;
      })
      .addCase(fetchPaymentMethodsByCurrency.fulfilled, (state, action) => {
        state.paymentMethodsLoading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethodsByCurrency.rejected, (state, action) => {
        state.paymentMethodsLoading = false;
        state.paymentMethodsError = action.payload;
        state.paymentMethods = []; // Clear on error
      });
  },
});

// Export actions
export const {
  clearCurrencies,
  setSelectedCurrency,
  clearError,
  clearUSDBankAccounts,
  clearAEDAccountDetails,
  clearPaymentMethods,
  resetCurrencyState,
} = currencySlice.actions;

// Export selectors
export const selectCurrencies = (state) => state.currency.currencies;
export const selectCurrencyLoading = (state) => state.currency.loading;
export const selectCurrencyError = (state) => state.currency.error;
export const selectSelectedCurrency = (state) =>
  state.currency.selectedCurrency;
export const selectSelectedCurrencyDetails = (state) =>
  state.currency.selectedCurrencyDetails;
export const selectUSDBankAccounts = (state) => state.currency.usdBankAccounts;
export const selectUSDAccountsLoading = (state) =>
  state.currency.usdAccountsLoading;
export const selectUSDAccountsError = (state) =>
  state.currency.usdAccountsError;
export const selectAEDAccountDetails = (state) =>
  state.currency.aedAccountDetails;
export const selectAEDDetailsLoading = (state) =>
  state.currency.aedDetailsLoading;
export const selectAEDDetailsError = (state) => state.currency.aedDetailsError;
export const selectPaymentMethods = (state) => state.currency.paymentMethods;
export const selectPaymentMethodsLoading = (state) =>
  state.currency.paymentMethodsLoading;
export const selectPaymentMethodsError = (state) =>
  state.currency.paymentMethodsError;
export const selectCurrencyRawData = (state) => state.currency.rawData;

export default currencySlice.reducer;
