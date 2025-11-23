// src/page/Deposit/slices/depositSlice.js - COMPLETE FIXED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";
import { depositAPI } from "../api/depositAPI";

// ✅ Async thunk for submitting deposit
export const submitDeposit = createAsyncThunk(
  "deposit/submitDeposit",
  async (depositData, { rejectWithValue }) => {
    try {
      console.log("🔄 Submitting deposit:", depositData);

      const token = localStorage.getItem("authtoken");
      const customerId = localStorage.getItem("authcustomer_id");

      if (!token || !customerId) {
        throw new Error("Authentication required");
      }

      const response = await api.post("/transactions/deposit", {
        ...depositData,
        customerId: customerId,
      });

      console.log("✅ Deposit submission response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Deposit submission error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit deposit"
      );
    }
  }
);

// ✅ FIXED: Client-side filtering thunk for manual account details
export const fetchManualAccountDetails = createAsyncThunk(
  "deposit/fetchManualAccountDetails",
  async (currency, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching manual account details for currency:", currency);

      const token = localStorage.getItem("authtoken");

      if (!token) {
        throw new Error("Authentication required");
      }

      if (!currency) {
        throw new Error("Currency parameter is required");
      }

      // ✅ Use client-side filtering function
      const response = await depositAPI.getManualDetailsByCurrency(currency);

      console.log("✅ Filtered manual account details:", {
        currency: response.data.currency,
        accountId: response.data.account_id,
        bankName: response.data.bank_name,
      });

      // ✅ Ensure currency is set correctly
      const accountWithCurrency = {
        ...response.data,
        currency: response.data.currency || currency,
      };

      return accountWithCurrency;
    } catch (error) {
      console.error("❌ Error fetching manual account details:", error);
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
      console.log("🔍 Fetching all manual accounts for debugging");
      const response = await depositAPI.getAllManualAccounts();
      console.log("📊 All available accounts:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching all accounts:", error);
      return rejectWithValue(error.message);
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

  // Form validation
  formErrors: {},

  // Loading states
  isSubmitting: false,
  manualDetailsLoading: false,

  // Success state
  transactionSuccess: null,

  // Manual account details
  manualAccountDetails: null,

  // Step management
  activeStep: 1,

  // Debug info
  allAvailableAccounts: null,
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
    },

    // Payment method actions
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      state.formErrors.paymentMethod = "";

      if (action.payload) {
        state.activeStep = 3;
      }
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
    },

    // Reset entire form
    resetDepositForm: (state) => {
      return {
        ...initialState,
        selectedCurrency: state.selectedCurrency,
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
        state.transactionSuccess = action.payload;
        state.amount = "";
        state.purpose = "";
        state.selectedBankAccount = null;
        state.formErrors = {};
      })
      .addCase(submitDeposit.rejected, (state, action) => {
        state.isSubmitting = false;
        state.formErrors.submission = action.payload;
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
        console.log("✅ Manual details stored in Redux:", {
          currency: action.payload.currency,
          accountId: action.payload.account_id,
          bankName: action.payload.bank_name,
        });
      })
      .addCase(fetchManualAccountDetails.rejected, (state, action) => {
        state.manualDetailsLoading = false;
        state.manualAccountDetails = null;
        state.formErrors.manualDetails = action.payload;
        console.error("❌ Manual details error:", action.payload);
      })

      // Debug: Fetch all accounts
      .addCase(fetchAllManualAccounts.fulfilled, (state, action) => {
        state.allAvailableAccounts = action.payload;
        console.log("📊 All accounts stored for debugging");
      });
  },
});

// Export actions
export const {
  setSelectedCurrency,
  setPaymentMethod,
  setAmount,
  setPurpose,
  setSelectedBankAccount,
  setFormErrors,
  clearFormError,
  setActiveStep,
  resetTransaction,
  resetDepositForm,
  clearManualAccountDetails,
  setAllAvailableAccounts,
} = depositSlice.actions;

// Export selectors
export const selectDeposit = (state) => state.deposit;
export const selectSelectedCurrency = (state) => state.deposit.selectedCurrency;
export const selectPaymentMethod = (state) => state.deposit.paymentMethod;
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

export default depositSlice.reducer;
