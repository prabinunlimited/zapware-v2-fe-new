// src/page/Deposit/slices/depositSlice.js - COMPLETE FIXED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";
import { depositAPI } from "../api/depositAPI";

// ✅ FIXED: Async thunk for submitting deposit with correct endpoint
export const submitDeposit = createAsyncThunk(
  "deposit/submitDeposit",
  async (depositData, { rejectWithValue, signal }) => {
    // ✅ ADD signal parameter
    try {
      const token = localStorage.getItem("authtoken");

      console.log("🔍 Submitting deposit with data:", depositData);

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await api.post(
        "/transactions/sila-transaction-payin",
        depositData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: signal, // ✅ PASS signal to axios
        }
      );

      console.log("✅ Deposit response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Deposit submission error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      });

      // ✅ HANDLE ABORT ERRORS SPECIFICALLY
      // if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
      //   console.log("✅ Request was cancelled");
      //   return rejectWithValue({
      //     message: "Request cancelled",
      //     cancelled: true,
      //   });
      // }

      // More detailed error handling
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to submit deposit";

      return rejectWithValue({
        message: errorMessage,
        details: error.response?.data,
        status: error.response?.status,
      });
    }
  }
);

export const fetchManualAccountDetails = createAsyncThunk(
  "deposit/fetchManualAccountDetails",
  async (currency, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authtoken");

      if (!token) throw new Error("Authentication required");
      if (!currency) throw new Error("Currency parameter is required");

      // ✅ HARDCODED FOR USD ONLY
      if (currency === "USD") {
        return {
          currency: "USD",
          bank_name: "Chase Bank",
          account_name: "Unlimited Cloud LLC",
          account_number: "518366536",
          iban: null,
          routing_number: "021000021",
          bic_swift: "CHASUS33",
          swift_code: "CHASUS33",
          bank_address: "2790 Park Ave., New York, NY 10017, USA",
          bank_country: "United States",
          bank_city: "New York",
          bank_state: "NY",
          bank_postalcode: "10017",
          customer_type: "business",
          institution_name: "Unlimited Cloud LLC",
          first_name: "Unlimited",
          last_name: "Cloud LLC",
          description: "Manual deposit for USD account",
          account_id: "manual_usd_chase_001",
          transfer_reference: "Deposit to Unlimited Cloud LLC",
          notes: "Include your customer ID in the transfer reference",
          minimum_amount: "10.00",
          processing_time: "1-3 business days",
        };
      }

      // ✅ FOR OTHER CURRENCIES: API call
      const response = await depositAPI.getManualDetailsByCurrency(currency);

      return {
        ...response.data,
        currency: response.data.currency || currency,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          `Failed to load ${currency} account details`
      );
    }
  }
);

// ✅ Debug thunk to see all available accounts
export const fetchAllManualAccounts = createAsyncThunk(
  "deposit/fetchAllManualAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await depositAPI.getAllManualAccounts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ NEW: Thunk to check if user has Sila bank accounts
export const checkSilaBankAccounts = createAsyncThunk(
  "deposit/checkSilaBankAccounts",
  async (customerId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authtoken");

      if (!token) {
        throw new Error("Authentication required");
      }

      // This would call your Sila API endpoint to check for existing accounts
      const response = await api.post(
        "/sila/manual-sila-bankdetails",
        { customerId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const accounts = response.data?.accounts || response.data?.data || [];

      return {
        hasSilaAccounts: accounts.length > 0,
        silaAccounts: accounts,
        count: accounts.length,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to check bank accounts"
      );
    }
  }
);

// Initial state
const initialState = {
  // Form fields
  selectedCurrency: "",
  paymentMethod: "",
  amount: "",
  purpose: "",
  activeStep: 1,
  isAmountFocused: false,
  copiedField: null,
  helpTooltips: {},
  showCancelModal: false,
  selectedBankAccount: null,
  showPaymentInitiation: false,

  // Form validation
  formErrors: {},

  // Loading states
  isSubmitting: false,
  manualDetailsLoading: false,

  // Success state
  transactionSuccess: null,

  // Manual account details
  manualAccountDetails: null,

  // Debug info
  allAvailableAccounts: null,

  // Sila accounts state
  silaBankAccounts: [],
  hasSilaAccounts: false,
  silaAccountsLoading: false,
  silaAccountsError: null,
};

// Deposit slice
const depositSlice = createSlice({
  name: "deposit",
  initialState,
  reducers: {
    // Currency actions
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
      state.formErrors.currency = "";

      // Clear manual details when currency changes
      if (state.manualAccountDetails) {
        state.manualAccountDetails = null;
      }

      // Clear bank account selection when currency changes
      state.selectedBankAccount = null;
    },

    // Payment method actions
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      state.formErrors.paymentMethod = "";

      // Auto-advance to step 3 when payment method is selected
      if (action.payload && state.selectedCurrency) {
        state.activeStep = 3;
      }

      // Clear amount and purpose for manual deposits
      if (action.payload === "manual_deposit") {
        state.amount = "";
        state.purpose = "";
      }

      // Clear bank account selection when payment method changes
      state.selectedBankAccount = null;
    },

    setShowPaymentInitiation: (state, action) => {
      state.showPaymentInitiation = action.payload;
    },

    // Amount actions
    setAmount: (state, action) => {
      state.amount = action.payload;
      state.formErrors.amount = "";
    },

    // Purpose actions
    setPurpose: (state, action) => {
      state.purpose = action.payload;
      state.formErrors.purpose = "";
    },

    // Bank account selection
    setSelectedBankAccount: (state, action) => {
      state.selectedBankAccount = action.payload;
      state.formErrors.bankAccount = "";
    },

    // Form errors
    setFormErrors: (state, action) => {
      state.formErrors = action.payload;
    },

    // Clear specific error
    clearFormError: (state, action) => {
      const field = action.payload;
      if (state.formErrors[field]) {
        delete state.formErrors[field];
      }
    },

    // Step management
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
    },

    setIsAmountFocused: (state, action) => {
      state.isAmountFocused = action.payload;
    },

    setCopiedField: (state, action) => {
      state.copiedField = action.payload;
    },

    clearCopiedField: (state) => {
      state.copiedField = null;
    },

    setHelpTooltip: (state, action) => {
      const { field, visible } = action.payload;
      state.helpTooltips[field] = visible;
    },

    setShowCancelModal: (state, action) => {
      state.showCancelModal = action.payload;
    },

    // Reset transaction
    resetTransaction: (state) => {
      state.transactionSuccess = null;
      state.manualAccountDetails = null;
      state.isSubmitting = false;
      state.manualDetailsLoading = false;
      state.selectedBankAccount = null;
      state.formErrors = {};
    },

    // Reset entire form
    resetDepositForm: (state) => {
      return {
        ...initialState,
        selectedCurrency: state.selectedCurrency, // Keep currency selection
      };
    },

    // Clear manual account details
    clearManualAccountDetails: (state) => {
      state.manualAccountDetails = null;
      state.manualDetailsLoading = false;
    },

    // Debug action to see available accounts
    setAllAvailableAccounts: (state, action) => {
      state.allAvailableAccounts = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit deposit
      .addCase(submitDeposit.pending, (state) => {
        state.isSubmitting = true;
        state.formErrors = {};
      })
      .addCase(submitDeposit.fulfilled, (state, action) => {
        state.isSubmitting = false;

        // ✅ Store ALL relevant data in transactionSuccess
        state.transactionSuccess = {
          ...action.payload, // API response
          amount: state.amount, // Preserve amount
          currency: state.selectedCurrency, // Preserve currency
          purpose: state.purpose, // Preserve purpose
          payment_method: state.paymentMethod, // Preserve payment method
          timestamp: new Date().toISOString(), // Add timestamp
        };

        // Clear form fields (optional)
        state.amount = "";
        state.purpose = "";
        state.selectedBankAccount = null;
        state.formErrors = {};
      })
      .addCase(submitDeposit.rejected, (state, action) => {
        state.isSubmitting = false;
        state.formErrors.submission =
          action.payload?.message || "Submission failed";
      })

      // Fetch manual account details (with client-side filtering)
      .addCase(fetchManualAccountDetails.pending, (state) => {
        state.manualDetailsLoading = true;
        state.formErrors.manualDetails = null;
      })
      .addCase(fetchManualAccountDetails.fulfilled, (state, action) => {
        state.manualDetailsLoading = false;
        state.manualAccountDetails = action.payload;
        state.formErrors.manualDetails = null;
      })
      .addCase(fetchManualAccountDetails.rejected, (state, action) => {
        state.manualDetailsLoading = false;
        state.manualAccountDetails = null;
        state.formErrors.manualDetails = action.payload;
      })

      // Debug: Fetch all accounts
      .addCase(fetchAllManualAccounts.fulfilled, (state, action) => {
        state.allAvailableAccounts = action.payload;
      })

      // ✅ ADDED: Check Sila bank accounts
      .addCase(checkSilaBankAccounts.pending, (state) => {
        state.silaAccountsLoading = true;
        state.silaAccountsError = null;
      })
      .addCase(checkSilaBankAccounts.fulfilled, (state, action) => {
        state.silaAccountsLoading = false;
        state.silaBankAccounts = action.payload.silaAccounts;
        state.hasSilaAccounts = action.payload.hasSilaAccounts;
        state.silaAccountsError = null;
      })
      .addCase(checkSilaBankAccounts.rejected, (state, action) => {
        state.silaAccountsLoading = false;
        state.silaBankAccounts = [];
        state.hasSilaAccounts = false;
        state.silaAccountsError = action.payload;
      });
  },
});

// ✅ CORRECT EXPORTS - Only export actions that actually exist
export const {
  // Form field actions
  setSelectedCurrency,
  setPaymentMethod,
  setAmount,
  setPurpose,
  setSelectedBankAccount,

  // Form validation actions
  setFormErrors,
  clearFormError,

  // Step management
  setActiveStep,

  // UI state actions
  setIsAmountFocused,
  setCopiedField,
  clearCopiedField,
  setHelpTooltip,
  setShowCancelModal,
  setShowPaymentInitiation,

  // Transaction actions
  resetTransaction,
  resetDepositForm,

  // Manual deposit actions
  clearManualAccountDetails,

  // Debug actions
  setAllAvailableAccounts,
} = depositSlice.actions;

// Export selectors
export const selectDeposit = (state) => state.deposit;
export const selectSelectedCurrency = (state) => state.deposit.selectedCurrency;
export const selectPaymentMethod = (state) => state.deposit.paymentMethod;
export const selectShowPaymentInitiation = (state) =>
  state.deposit.showPaymentInitiation;
export const selectAmount = (state) => state.deposit.amount;
export const selectPurpose = (state) => state.deposit.purpose;
export const selectSelectedBankAccount = (state) =>
  state.deposit.selectedBankAccount;
export const selectFormErrors = (state) => state.deposit.formErrors;
export const selectIsSubmitting = (state) => state.deposit.isSubmitting;
export const selectTransactionSuccess = (state) =>
  state.deposit.transactionSuccess;
export const selectActiveStep = (state) => state.deposit.activeStep;
export const selectManualDetailsLoading = (state) =>
  state.deposit.manualDetailsLoading;
export const selectManualAccountDetails = (state) =>
  state.deposit.manualAccountDetails;
export const selectAllAvailableAccounts = (state) =>
  state.deposit.allAvailableAccounts;

// ✅ ADDED: Selectors for Sila bank accounts
export const selectSilaBankAccounts = (state) => state.deposit.silaBankAccounts;
export const selectHasSilaAccounts = (state) => state.deposit.hasSilaAccounts;
export const selectSilaAccountsLoading = (state) =>
  state.deposit.silaAccountsLoading;
export const selectSilaAccountsError = (state) =>
  state.deposit.silaAccountsError;

// ✅ ADDED: Computed selectors
export const selectIsManualDeposit = (state) =>
  state.deposit.paymentMethod === "manual_deposit";
export const selectIsUSDBankDeposit = (state) =>
  state.deposit.selectedCurrency === "USD" &&
  state.deposit.paymentMethod === "bank_deposit";
export const selectIsCardDeposit = (state) =>
  state.deposit.paymentMethod === "card_deposit";
export const selectIsBankTransfer = (state) =>
  state.deposit.paymentMethod === "bank_transfer";

// ✅ ADDED: Validation selectors
export const selectIsFormValid = (state) => {
  const {
    selectedCurrency,
    paymentMethod,
    amount,
    purpose,
    selectedBankAccount,
  } = state.deposit;

  if (!selectedCurrency || !paymentMethod) return false;

  if (paymentMethod !== "manual_deposit") {
    if (!amount || parseFloat(amount) <= 0 || !purpose) return false;
  }

  if (
    selectedCurrency === "USD" &&
    paymentMethod === "bank_deposit" &&
    !selectedBankAccount
  ) {
    return false;
  }

  return true;
};

export default depositSlice.reducer;
