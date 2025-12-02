// src/features/Remittance/slices/remittancePaymentSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBeneficiaries,
  fetchBeneficiaryByCode,
  fetchBeneficiaryBanks,
} from "../thunks/remittanceThunks";

const initialState = {
  // Payment Method
  paymentMethod: "",
  paymentMethodRef: { value: "bank", label: "Bank Transfer" },
  paymentMethods: [
    { value: "bank", label: "Bank Transfer" },
    { value: "manual", label: "Manual Deposit" },
    { value: "card", label: "Card Deposit" },
  ],

  // Form Data
  manualDepositFormData: null,
  bankTransferFormData: null,
  cardTransferFormData: null,

  // Beneficiaries
  beneficiaries: [],
  beneficiaryOptions: [],
  selectedBeneficiary: null,
  beneficiaryId: null,
  searchingBeneficiary: false,

  // Beneficiary Banks
  beneficiaryBanks: [],
  beneficiaryBankOptions: [],
  selectedBeneficiaryBank: null,
  beneficiaryBankId: null,

  // Beneficiary Code Search
  beneficiaryCodeData: null,

  // File Upload
  fileUpload: {
    manualDeposit: null,
    preview: null,
  },

  // Payment Validation
  paymentValidation: {
    beneficiary: { isValid: true, message: "" },
    beneficiaryBank: { isValid: true, message: "" },
    paymentMethod: { isValid: true, message: "" },
    formData: { isValid: false, message: "" },
  },

  // Loading states for thunks
  loadingStates: {
    beneficiaries: false,
    beneficiaryByCode: false,
    beneficiaryBanks: false,
  },

  // Error states for thunks
  errorStates: {
    beneficiaries: null,
    beneficiaryByCode: null,
    beneficiaryBanks: null,
  },
};

const remittancePaymentSlice = createSlice({
  name: "remittancePayment",
  initialState,
  reducers: {
    // Payment Method Actions
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },

    setPaymentMethodRef: (state, action) => {
      state.paymentMethodRef = action.payload;
    },

    // Form Data Actions
    setManualDepositFormData: (state, action) => {
      state.manualDepositFormData = action.payload;
    },

    setBankTransferFormData: (state, action) => {
      state.bankTransferFormData = action.payload;
    },

    setCardTransferFormData: (state, action) => {
      state.cardTransferFormData = action.payload;
    },

    clearFormData: (state) => {
      state.manualDepositFormData = null;
      state.bankTransferFormData = null;
      state.cardTransferFormData = null;
    },

    // Beneficiary Actions
    setBeneficiaries: (state, action) => {
      state.beneficiaries = action.payload;
    },

    setSelectedBeneficiary: (state, action) => {
      state.selectedBeneficiary = action.payload;
      state.beneficiaryId = action.payload?.id || null;
    },

    clearSelectedBeneficiary: (state) => {
      state.selectedBeneficiary = null;
      state.beneficiaryId = null;
      state.beneficiaryBanks = [];
      state.beneficiaryBankOptions = [];
      state.selectedBeneficiaryBank = null;
      state.beneficiaryBankId = null;
    },

    // Beneficiary Bank Actions
    setBeneficiaryBanks: (state, action) => {
      state.beneficiaryBanks = action.payload;
    },

    setSelectedBeneficiaryBank: (state, action) => {
      state.selectedBeneficiaryBank = action.payload;
      state.beneficiaryBankId = action.payload?.id || null;
    },

    // File Upload Actions
    setManualDepositFile: (state, action) => {
      state.fileUpload.manualDeposit = action.payload;
    },

    setFilePreview: (state, action) => {
      state.fileUpload.preview = action.payload;
    },

    clearFileUpload: (state) => {
      state.fileUpload = {
        manualDeposit: null,
        preview: null,
      };
    },

    // Validation Actions
    setPaymentValidation: (state, action) => {
      state.paymentValidation = {
        ...state.paymentValidation,
        ...action.payload,
      };
    },

    clearPaymentValidation: (state) => {
      state.paymentValidation = {
        beneficiary: { isValid: true, message: "" },
        beneficiaryBank: { isValid: true, message: "" },
        paymentMethod: { isValid: true, message: "" },
        formData: { isValid: false, message: "" },
      };
    },

    // Clear loading states
    clearLoading: (state, action) => {
      const { loadingType } = action.payload || {};
      if (loadingType && state.loadingStates[loadingType]) {
        state.loadingStates[loadingType] = false;
      } else {
        Object.keys(state.loadingStates).forEach((key) => {
          state.loadingStates[key] = false;
        });
      }
    },

    // Clear error states
    clearError: (state, action) => {
      const { errorType } = action.payload || {};
      if (errorType && state.errorStates[errorType]) {
        state.errorStates[errorType] = null;
      } else {
        Object.keys(state.errorStates).forEach((key) => {
          state.errorStates[key] = null;
        });
      }
    },

    // Clear beneficiary code data
    clearBeneficiaryCodeData: (state) => {
      state.beneficiaryCodeData = null;
    },

    // Reset payment
    resetPayment: (state) => {
      return {
        ...initialState,
        paymentMethodRef: state.paymentMethodRef, // Keep payment method
      };
    },
  },

  extraReducers: (builder) => {
    // ===================== BENEFICIARIES =====================
    builder
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.loadingStates.beneficiaries = true;
        state.errorStates.beneficiaries = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.loadingStates.beneficiaries = false;
        state.beneficiaries = action.payload;

        // Update options
        state.beneficiaryOptions = action.payload.map((beneficiary) => ({
          value: beneficiary.id,
          label: beneficiary.name,
          details: beneficiary,
        }));

        // Auto-select if only one beneficiary
        if (action.payload.length === 1 && !state.selectedBeneficiary) {
          const beneficiary = action.payload[0];
          state.selectedBeneficiary = {
            id: beneficiary.id,
            name: beneficiary.name,
            details: beneficiary,
          };
          state.beneficiaryId = beneficiary.id;
        }
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.loadingStates.beneficiaries = false;
        state.errorStates.beneficiaries =
          action.payload || action.error.message;
        state.beneficiaries = [];
        state.beneficiaryOptions = [];
      });

    // ===================== BENEFICIARY BY CODE =====================
    builder
      .addCase(fetchBeneficiaryByCode.pending, (state) => {
        state.loadingStates.beneficiaryByCode = true;
        state.errorStates.beneficiaryByCode = null;
        state.searchingBeneficiary = true;
      })
      .addCase(fetchBeneficiaryByCode.fulfilled, (state, action) => {
        state.loadingStates.beneficiaryByCode = false;
        state.searchingBeneficiary = false;
        state.beneficiaryCodeData = action.payload.data;

        // Store beneficiary in list if not already present
        const beneficiary = action.payload.data;
        const exists = state.beneficiaries.some((b) => b.id === beneficiary.id);

        if (!exists) {
          state.beneficiaries = [...state.beneficiaries, beneficiary];
          state.beneficiaryOptions = [
            ...state.beneficiaryOptions,
            {
              value: beneficiary.id,
              label: beneficiary.name,
              details: beneficiary,
            },
          ];
        }

        // Auto-select the found beneficiary
        state.selectedBeneficiary = {
          id: beneficiary.id,
          name: beneficiary.name,
          details: beneficiary,
        };
        state.beneficiaryId = beneficiary.id;
      })
      .addCase(fetchBeneficiaryByCode.rejected, (state, action) => {
        state.loadingStates.beneficiaryByCode = false;
        state.errorStates.beneficiaryByCode =
          action.payload || action.error.message;
        state.searchingBeneficiary = false;
        state.beneficiaryCodeData = null;

        // Show error in UI
        state.paymentValidation.beneficiary = {
          isValid: false,
          message: action.payload || "Failed to find beneficiary",
        };
      });

    // ===================== BENEFICIARY BANKS =====================
    builder
      .addCase(fetchBeneficiaryBanks.pending, (state) => {
        state.loadingStates.beneficiaryBanks = true;
        state.errorStates.beneficiaryBanks = null;
      })
      .addCase(fetchBeneficiaryBanks.fulfilled, (state, action) => {
        state.loadingStates.beneficiaryBanks = false;
        state.beneficiaryBanks = action.payload;

        // Update bank options for selected beneficiary
        state.beneficiaryBankOptions = action.payload.map((bank) => ({
          value: bank.id,
          label: bank.bank_name,
          details: bank,
          accountNumber: bank.bank_acc_no,
        }));

        // Auto-select if only one bank account
        if (action.payload.length === 1 && !state.selectedBeneficiaryBank) {
          const bank = action.payload[0];
          state.selectedBeneficiaryBank = {
            id: bank.id,
            name: bank.bank_name,
            details: bank,
          };
          state.beneficiaryBankId = bank.id;
        }
      })
      .addCase(fetchBeneficiaryBanks.rejected, (state, action) => {
        state.loadingStates.beneficiaryBanks = false;
        state.errorStates.beneficiaryBanks =
          action.payload || action.error.message;
        state.beneficiaryBanks = [];
        state.beneficiaryBankOptions = [];
      });
  },
});

// Export actions
export const {
  setPaymentMethod,
  setPaymentMethodRef,
  setManualDepositFormData,
  setBankTransferFormData,
  setCardTransferFormData,
  clearFormData,
  setBeneficiaries,
  setSelectedBeneficiary,
  clearSelectedBeneficiary,
  setBeneficiaryBanks,
  setSelectedBeneficiaryBank,
  setManualDepositFile,
  setFilePreview,
  clearFileUpload,
  setPaymentValidation,
  clearPaymentValidation,
  clearLoading,
  clearError,
  clearBeneficiaryCodeData,
  resetPayment,
} = remittancePaymentSlice.actions;

// Export selectors
export const selectRemittancePayment = (state) => state.remittancePayment;
export const selectPaymentMethod = (state) =>
  state.remittancePayment.paymentMethod;
export const selectPaymentMethodRef = (state) =>
  state.remittancePayment.paymentMethodRef;
export const selectManualDepositFormData = (state) =>
  state.remittancePayment.manualDepositFormData;
export const selectBankTransferFormData = (state) =>
  state.remittancePayment.bankTransferFormData;
export const selectCardTransferFormData = (state) =>
  state.remittancePayment.cardTransferFormData;
export const selectBeneficiaries = (state) =>
  state.remittancePayment.beneficiaries;
export const selectBeneficiaryOptions = (state) =>
  state.remittancePayment.beneficiaryOptions;
export const selectSelectedBeneficiary = (state) =>
  state.remittancePayment.selectedBeneficiary;
export const selectBeneficiaryId = (state) =>
  state.remittancePayment.beneficiaryId;
export const selectSearchingBeneficiary = (state) =>
  state.remittancePayment.searchingBeneficiary;
export const selectBeneficiaryBanks = (state) =>
  state.remittancePayment.beneficiaryBanks;
export const selectBeneficiaryBankOptions = (state) =>
  state.remittancePayment.beneficiaryBankOptions;
export const selectSelectedBeneficiaryBank = (state) =>
  state.remittancePayment.selectedBeneficiaryBank;
export const selectBeneficiaryBankId = (state) =>
  state.remittancePayment.beneficiaryBankId;
export const selectBeneficiaryCodeData = (state) =>
  state.remittancePayment.beneficiaryCodeData;
export const selectFileUpload = (state) => state.remittancePayment.fileUpload;
export const selectPaymentValidation = (state) =>
  state.remittancePayment.paymentValidation;
export const selectPaymentMethods = (state) =>
  state.remittancePayment.paymentMethods;

// Derived selectors - also need updating
export const selectCurrentPaymentMethod = (state) => {
  const method = state.remittancePayment.paymentMethodRef.value;
  const configs = {
    bank: { label: "Bank Transfer", icon: "bank", color: "blue" },
    manual: { label: "Manual Deposit", icon: "cash", color: "green" },
    card: { label: "Card Deposit", icon: "card", color: "purple" },
  };
  return configs[method] || configs.bank;
};

export const selectCurrentFormData = (state) => {
  const method = state.remittancePayment.paymentMethodRef.value;
  switch (method) {
    case "manual":
      return state.remittancePayment.manualDepositFormData;
    case "bank":
      return state.remittancePayment.bankTransferFormData;
    case "card":
      return state.remittancePayment.cardTransferFormData;
    default:
      return null;
  }
};

export const selectIsPaymentFormValid = (state) => {
  const validation = state.remittancePayment.paymentValidation;
  return (
    validation.beneficiary.isValid &&
    validation.beneficiaryBank.isValid &&
    validation.paymentMethod.isValid &&
    validation.formData.isValid
  );
};

export const selectPaymentLoading = (state) => {
  const loadingStates = state.remittancePayment.loadingStates;
  return Object.values(loadingStates).some((loading) => loading === true);
};

export const selectPaymentSubmitted = (state) => {
  const formData = selectCurrentFormData(state);
  return !!formData;
};

export const selectPaymentOptions = (state) => {
  const methods = state.remittancePayment.paymentMethods;
  const currentMethod = state.remittancePayment.paymentMethodRef.value;

  return methods.map((method) => ({
    ...method,
    isSelected: method.value === currentMethod,
    isAvailable: true, // Add availability logic if needed
  }));
};

export default remittancePaymentSlice.reducer;
