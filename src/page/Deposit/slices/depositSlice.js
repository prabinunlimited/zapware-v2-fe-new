// src/page/Deposit/slices/depositSlice.js - COMPLETE FIXED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";
import { depositAPI } from "../api/depositAPI";

// ✅ Async thunk for submitting deposit
export const submitDeposit = createAsyncThunk(
  "deposit/submitDeposit",
  async (depositData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authtoken");
      const customerId = localStorage.getItem("authcustomer_id");

      if (!token || !customerId) {
        throw new Error("Authentication required");
      }

      // Handle USD bank deposit specifically
      if (depositData.currency === "USD" && depositData.payment_method === "bank_deposit") {
        const response = await api.post("/transactions/remittance-transaction", {
          customer_id: customerId,
          send_amount: parseFloat(depositData.amount),
          from_currency: depositData.currency,
          payment_method: depositData.payment_method,
          is_remit: "N",
          sender_account_name: depositData.sender_account_name,
          sender_bank_id: depositData.sender_bank_id,
          purpose: depositData.purpose,
          reference: depositData.reference,
        });

        return {
          ...response.data,
          success: true,
          transactionType: "usd_bank_deposit"
        };
      }

      // Default deposit submission for other currencies/methods
      const response = await api.post("/transactions/deposit", {
        ...depositData,
        customerId: customerId,
      });

      return response.data;
    } catch (error) {
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
      const token = localStorage.getItem("authtoken");

      if (!token) {
        throw new Error("Authentication required");
      }

      if (!currency) {
        throw new Error("Currency parameter is required");
      }

      // ✅ Use client-side filtering function
      const response = await depositAPI.getManualDetailsByCurrency(currency);

      // ✅ Ensure currency is set correctly
      const accountWithCurrency = {
        ...response.data,
        currency: response.data.currency || currency,
      };

      return accountWithCurrency;
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
        count: accounts.length
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
export const selectShowPaymentInitiation = (state) => state.deposit.showPaymentInitiation;
export const selectAmount = (state) => state.deposit.amount;
export const selectPurpose = (state) => state.deposit.purpose;
export const selectSelectedBankAccount = (state) => state.deposit.selectedBankAccount;
export const selectFormErrors = (state) => state.deposit.formErrors;
export const selectIsSubmitting = (state) => state.deposit.isSubmitting;
export const selectTransactionSuccess = (state) => state.deposit.transactionSuccess;
export const selectActiveStep = (state) => state.deposit.activeStep;
export const selectManualDetailsLoading = (state) => state.deposit.manualDetailsLoading;
export const selectManualAccountDetails = (state) => state.deposit.manualAccountDetails;
export const selectAllAvailableAccounts = (state) => state.deposit.allAvailableAccounts;

// ✅ ADDED: Selectors for Sila bank accounts
export const selectSilaBankAccounts = (state) => state.deposit.silaBankAccounts;
export const selectHasSilaAccounts = (state) => state.deposit.hasSilaAccounts;
export const selectSilaAccountsLoading = (state) => state.deposit.silaAccountsLoading;
export const selectSilaAccountsError = (state) => state.deposit.silaAccountsError;

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
  const { selectedCurrency, paymentMethod, amount, purpose, selectedBankAccount } = state.deposit;
  
  if (!selectedCurrency || !paymentMethod) return false;
  
  if (paymentMethod !== "manual_deposit") {
    if (!amount || parseFloat(amount) <= 0 || !purpose) return false;
  }
  
  if (selectedCurrency === "USD" && paymentMethod === "bank_deposit" && !selectedBankAccount) {
    return false;
  }
  
  return true;
};

export default depositSlice.reducer;