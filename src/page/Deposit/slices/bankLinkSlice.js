// src/features/BankAccounts/slices/bankLinkSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../services/api";

// ✅ Async thunk for fetching Plaid-linked bank accounts (matching reference structure)
export const fetchBankAccounts = createAsyncThunk(
  "bankLink/fetchBankAccounts",
  async (customerId, { rejectWithValue }) => {
    try {
      

      const response = await api.post("/sila/sila-bank-details", {
        customerId: customerId,
      });

      

      // Handle response structure exactly like reference code
      let accounts = [];
      const data = response.data;

      if (Array.isArray(data)) {
        accounts = data;
      } else if (data?.data) {
        accounts = Array.isArray(data.data) ? data.data : [data.data];
      } else if (data?.status === "success") {
        accounts = data.data || [];
      }

      
      return accounts;
    } catch (error) {
      
      return rejectWithValue(
        error.response?.data?.message || "Failed to load bank accounts"
      );
    }
  }
);

// ✅ Async thunk for deleting a bank account (matching reference structure)
export const deleteBankAccount = createAsyncThunk(
  "bankLink/deleteBankAccount",
  async ({ accountId, accountName, customerId }, { rejectWithValue }) => {
    try {
      

      const response = await api.post("/sila/delete-sila-linked-bank", {
        account_name: accountName,
        account_id: accountId,
        customerId: customerId,
      });

      const data = response.data;
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete the account");
      }

      return { accountId, message: data.message };
    } catch (error) {
      
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete account"
      );
    }
  }
);

// ✅ Async thunk for handling bank link success (matching reference structure)
export const handleBankLinkSuccess = createAsyncThunk(
  "bankLink/handleBankLinkSuccess",
  async ({ response, customerId }, { rejectWithValue, dispatch }) => {
    try {
      

      if (!response) {
        throw new Error("No response received from bank linking");
      }

      if (
        (response.kyc_status && response.kyc_status === "pending") ||
        (response.message && response.message.includes("KYC"))
      ) {
        return { 
          type: "kyc_pending", 
          message: response.message || "KYC verification in progress" 
        };
      }

      if (!response.success) {
        throw new Error(response.message || "Bank linking failed without error message");
      }

      // Refresh accounts after successful linking
      await dispatch(fetchBankAccounts(customerId));

      return { 
        type: "success", 
        data: response,
        message: "Bank account linked successfully"
      };
    } catch (error) {
      
      return rejectWithValue(error.message || "Failed to process bank linking");
    }
  }
);

// Initial state matching the reference component structure
const initialState = {
  // Bank accounts data (matching reference)
  bankAccounts: [],
  loading: true,
  error: null,
  
  // UI state (matching reference)
  showPlaidLink: false,
  showSuccessModal: false,
  apiResponse: null,
  
  // Delete operations (matching reference)
  deletingAccountId: null,
  deleteError: null,
  deleteSuccess: null,
  
  // Status messages (matching reference)
  kycStatus: null,
  
  // Loading states (matching reference)
  isRefreshing: false,
  isAddingAccount: false,
  isProcessing: false,
  
  // Pagination (matching reference)
  currentPage: 1,
  accountsPerPage: 5,
};

const bankLinkSlice = createSlice({
  name: "bankLink",
  initialState,
  reducers: {
    // UI actions (matching reference)
    setShowPlaidLink: (state, action) => {
      state.showPlaidLink = action.payload;
    },
    setShowSuccessModal: (state, action) => {
      state.showSuccessModal = action.payload;
    },
    setApiResponse: (state, action) => {
      state.apiResponse = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setKycStatus: (state, action) => {
      state.kycStatus = action.payload;
    },
    
    // Status management (matching reference)
    clearErrors: (state) => {
      state.error = null;
      state.deleteError = null;
      state.deleteSuccess = null;
      state.kycStatus = null;
    },
    clearDeleteStatus: (state) => {
      state.deleteError = null;
      state.deleteSuccess = null;
    },
    
    // Manual refresh (matching reference)
    startRefresh: (state) => {
      state.isRefreshing = true;
    },
    endRefresh: (state) => {
      state.isRefreshing = false;
    },
    
    // Reset state
    resetBankLinkState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bank Accounts (matching reference structure)
      .addCase(fetchBankAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isRefreshing = true;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.isRefreshing = false;
        state.bankAccounts = action.payload;
        state.error = null;
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.loading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      })
      
      // Delete Bank Account (matching reference structure)
      .addCase(deleteBankAccount.pending, (state, action) => {
        state.isProcessing = true;
        state.deletingAccountId = action.meta.arg.accountId;
        state.deleteError = null;
        state.deleteSuccess = null;
      })
      .addCase(deleteBankAccount.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.deletingAccountId = null;
        state.deleteSuccess = action.payload.message;
        // Remove deleted account from list
        state.bankAccounts = state.bankAccounts.filter(
          account => account.account_id !== action.payload.accountId
        );
      })
      .addCase(deleteBankAccount.rejected, (state, action) => {
        state.isProcessing = false;
        state.deletingAccountId = null;
        state.deleteError = action.payload;
      })
      
      // Handle Bank Link Success (matching reference structure)
      .addCase(handleBankLinkSuccess.pending, (state) => {
        state.isAddingAccount = true;
        state.error = null;
      })
      .addCase(handleBankLinkSuccess.fulfilled, (state, action) => {
        state.isAddingAccount = false;
        
        if (action.payload.type === "kyc_pending") {
          state.kycStatus = action.payload.message;
        } else if (action.payload.type === "success") {
          state.apiResponse = action.payload.data;
          state.showSuccessModal = true;
          state.showPlaidLink = false;
        }
      })
      .addCase(handleBankLinkSuccess.rejected, (state, action) => {
        state.isAddingAccount = false;
        state.error = action.payload;
        state.showPlaidLink = false;
      });
  },
});

export const {
  setShowPlaidLink,
  setShowSuccessModal,
  setApiResponse,
  setCurrentPage,
  setKycStatus,
  clearErrors,
  clearDeleteStatus,
  startRefresh,
  endRefresh,
  resetBankLinkState,
} = bankLinkSlice.actions;

// Selectors matching reference component structure
export const selectBankAccounts = (state) => state.bankLink.bankAccounts;
export const selectLoading = (state) => state.bankLink.loading;
export const selectError = (state) => state.bankLink.error;
export const selectShowPlaidLink = (state) => state.bankLink.showPlaidLink;
export const selectShowSuccessModal = (state) => state.bankLink.showSuccessModal;
export const selectApiResponse = (state) => state.bankLink.apiResponse;
export const selectDeletingAccountId = (state) => state.bankLink.deletingAccountId;
export const selectDeleteError = (state) => state.bankLink.deleteError;
export const selectDeleteSuccess = (state) => state.bankLink.deleteSuccess;
export const selectKycStatus = (state) => state.bankLink.kycStatus;
export const selectIsRefreshing = (state) => state.bankLink.isRefreshing;
export const selectIsAddingAccount = (state) => state.bankLink.isAddingAccount;
export const selectIsProcessing = (state) => state.bankLink.isProcessing;
export const selectCurrentPage = (state) => state.bankLink.currentPage;

// Derived selectors matching reference component
export const selectPaginatedAccounts = (state) => {
  const { bankAccounts, currentPage, accountsPerPage } = state.bankLink;
  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  return bankAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
};

export const selectTotalPages = (state) => {
  const { bankAccounts, accountsPerPage } = state.bankLink;
  return Math.ceil(bankAccounts.length / accountsPerPage);
};

export const selectHasAccounts = (state) => state.bankLink.bankAccounts.length > 0;

export default bankLinkSlice.reducer;