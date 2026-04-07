// src/features/BankAccounts/slices/bankLinkSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../services/api";

// ✅ FIXED: Async thunk for fetching Sila-linked bank accounts with correct endpoint
export const fetchBankAccounts = createAsyncThunk(
  "bankLink/fetchBankAccounts",
  async (customerId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("authtoken");

      if (!token) {
        throw new Error("Authentication required");
      }

      // ✅ GET CUSTOMER ID FROM PARAMETER OR STATE
      let effectiveCustomerId = customerId;

      if (!effectiveCustomerId) {
        // Fallback: try to get from Redux state
        const state = getState();
        effectiveCustomerId = state.auth?.customerId;
      }

      if (!effectiveCustomerId) {
        // Last resort: try to extract from URL
        const path = window.location.pathname.split("/");
        if (path.length >= 3 && path[1] === "depositiframe") {
          effectiveCustomerId = path[2];
        }
      }

      if (!effectiveCustomerId) {
        throw new Error("Customer ID is required");
      }

      console.log(
        "🔍 Fetching Sila bank accounts for customer:",
        effectiveCustomerId
      );

      // ✅ CORRECTED: Use POST with customerId in body
      const response = await api.post(
        "/sila/sila-bank-details",
        {
          customerId: effectiveCustomerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Handle different response structures
      let accounts = [];
      const data = response.data;

      console.log("🔍 Sila bank accounts API response:", {
        status: response.status,
        dataStructure: Object.keys(data),
        hasDataArray: Array.isArray(data?.data),
        message: data?.message,
      });

      if (data?.data && Array.isArray(data.data)) {
        accounts = data.data;
      } else if (Array.isArray(data)) {
        accounts = data;
      } else if (data?.accounts && Array.isArray(data.accounts)) {
        accounts = data.accounts;
      } else if (data?.status === "success" && Array.isArray(data.data)) {
        accounts = data.data;
      } else if (data?.success && Array.isArray(data.data)) {
        accounts = data.data;
      } else if (data?.bank_accounts && Array.isArray(data.bank_accounts)) {
        accounts = data.bank_accounts;
      }

      console.log("✅ Sila bank accounts loaded:", accounts.length);

      // ✅ DEBUG: Log all account details for troubleshooting
      if (accounts.length > 0) {
        console.log("🔍 Full account details for debugging:", {
          customerId: effectiveCustomerId,
          accounts: accounts.map((acc) => ({
            id: acc.id,
            account_id: acc.account_id,
            account_name: acc.account_name,
            provider: acc.provider,
            account_type: acc.account_type,
            currency: acc.currency,
            status: acc.status,
            is_frozen: acc.is_frozen,
            is_deleted: acc.is_deleted,
            isLinkedOnSila: acc.isLinkedOnSila,
            verification_status: acc.verification_status,
            account_status: acc.account_status,
            web_debit_verified: acc.web_debit_verified,
            accountNumberHash: acc.accountNumberHash,
          })),
        });
      }

      // ✅ CORRECTED FILTERING LOGIC based on your API response
      const filteredAccounts = accounts.filter((account) => {
        // For USD accounts: accept USD, null, or undefined (assume USD)
        const isUSD = !account.currency || account.currency === "USD";

        // ✅ CRITICAL FIX: status = 1 means ACTIVE (based on your API response)
        // If status field exists, check if it's 1 (active)
        // If status doesn't exist, assume active
        const hasStatus = typeof account.status !== "undefined";
        const isActive = hasStatus ? account.status === 1 : true;

        // Check if not frozen (is_frozen = 0 or doesn't exist)
        const hasFrozen = typeof account.is_frozen !== "undefined";
        const isNotFrozen = hasFrozen ? account.is_frozen !== 1 : true;

        // Check if not deleted (is_deleted = 0 or doesn't exist)
        const hasDeleted = typeof account.is_deleted !== "undefined";
        const isNotDeleted = hasDeleted ? account.is_deleted !== 1 : true;

        // Check if linked on Sila (isLinkedOnSila = 1 or doesn't exist)
        const hasLinkedOnSila = typeof account.isLinkedOnSila !== "undefined";
        const isLinked = hasLinkedOnSila ? account.isLinkedOnSila === 1 : true;

        // Check if web_debit_verified is true (if field exists)
        const hasWebDebit = typeof account.web_debit_verified !== "undefined";
        const isWebDebitVerified = hasWebDebit
          ? account.web_debit_verified === true
          : true;

        console.log(
          `🔍 Filter check for account ${account.id || account.account_id}:`,
          {
            account_name: account.account_name,
            currency: account.currency,
            isUSD,
            status: account.status,
            isActive,
            is_frozen: account.is_frozen,
            isNotFrozen,
            is_deleted: account.is_deleted,
            isNotDeleted,
            isLinkedOnSila: account.isLinkedOnSila,
            isLinked,
            web_debit_verified: account.web_debit_verified,
            isWebDebitVerified,
            passesAll:
              isUSD &&
              isActive &&
              isNotFrozen &&
              isNotDeleted &&
              isLinked &&
              isWebDebitVerified,
          }
        );

        return (
          isUSD &&
          isActive &&
          isNotFrozen &&
          isNotDeleted &&
          isLinked &&
          isWebDebitVerified
        );
      });

      // ✅ If no accounts after filtering, try a more permissive filter
      if (filteredAccounts.length === 0 && accounts.length > 0) {
        console.log(
          "⚠️ No accounts passed strict filtering. Trying permissive filter..."
        );

        const permissiveAccounts = accounts.filter((account) => {
          // Basic checks only
          const isUSD = !account.currency || account.currency === "USD";
          const isNotFrozen = account.is_frozen !== 1;
          const isNotDeleted = account.is_deleted !== 1;

          console.log(`🔍 Permissive filter for account ${account.id}:`, {
            account_name: account.account_name,
            passes: isUSD && isNotFrozen && isNotDeleted,
          });

          return isUSD && isNotFrozen && isNotDeleted;
        });

        console.log(
          "✅ Permissive filtered accounts:",
          permissiveAccounts.length
        );
        return permissiveAccounts;
      }

      console.log(
        "✅ Strict filtered USD Sila bank accounts:",
        filteredAccounts.length
      );
      return filteredAccounts;
    } catch (error) {
      console.error("❌ Failed to load Sila bank accounts:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        customerId: customerId,
      });
      return rejectWithValue(
        error.response?.data?.message || "Failed to load bank accounts"
      );
    }
  }
);

// ✅ FIXED: fetchLinkBankRequests (keeping as is)
export const fetchLinkBankRequests = createAsyncThunk(
  "bankLink/fetchLinkBankRequests",
  async ({ requestId, customerId }, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("authtoken");

      if (!token) throw new Error("Authentication required");

      // ✅ GET CUSTOMER ID FROM PARAMETER OR STATE
      let effectiveCustomerId = customerId;

      if (!effectiveCustomerId) {
        const state = getState();
        effectiveCustomerId = state.auth?.customerId;
      }

      if (!effectiveCustomerId) {
        throw new Error("Customer ID is required");
      }

      if (!requestId) {
        throw new Error("Request ID is required");
      }

      console.log("🔍 Fetching link bank request:", {
        requestId,
        customerId: effectiveCustomerId,
      });

      const response = await api.post(
        "/link-bank-token",
        {
          requestId: requestId,
          customerId: effectiveCustomerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let accounts = [];
      const data = response.data;

      if (data?.data && Array.isArray(data.data)) {
        accounts = data.data;
      } else if (Array.isArray(data)) {
        accounts = data;
      } else if (data?.status === "success" && Array.isArray(data.data)) {
        accounts = data.data;
      }

      console.log("✅ Link bank request details loaded:", accounts.length);

      return accounts;
    } catch (error) {
      console.error("❌ Failed to load bank link request:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to load bank link request"
      );
    }
  }
);

// ✅ FIXED: deleteBankAccount (keeping as is - already uses correct endpoint)
export const deleteBankAccount = createAsyncThunk(
  "bankLink/deleteBankAccount",
  async (
    { accountId, accountName, customerId },
    { rejectWithValue, getState }
  ) => {
    try {
      const token = localStorage.getItem("authtoken");

      if (!token) throw new Error("Authentication required");

      // ✅ GET CUSTOMER ID FROM PARAMETER OR STATE
      let effectiveCustomerId = customerId;

      if (!effectiveCustomerId) {
        const state = getState();
        effectiveCustomerId = state.auth?.customerId;
      }

      if (!effectiveCustomerId) {
        throw new Error("Customer ID is required");
      }

      if (!accountId || !accountName) {
        throw new Error("Account ID and name are required");
      }

      console.log("🗑️ Deleting Sila bank account:", {
        accountId,
        accountName,
        customerId: effectiveCustomerId,
      });

      const response = await api.post(
        "/sila/delete-sila-linked-bank",
        {
          account_name: accountName,
          account_id: accountId,
          customerId: effectiveCustomerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (response.status >= 400 || !data.success) {
        throw new Error(data.message || "Failed to delete the account");
      }

      console.log("✅ Sila account deleted successfully:", data.message);
      return {
        accountId,
        accountName,
        message: data.message || "Account deleted successfully",
      };
    } catch (error) {
      console.error("❌ Failed to delete Sila bank account:", {
        error: error.message,
        accountId,
        accountName,
      });
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete account"
      );
    }
  }
);

// ✅ ADDED: Link new bank account via Sila
export const linkSilaBankAccount = createAsyncThunk(
  "bankLink/linkSilaBankAccount",
  async (
    { plaidPublicToken, accountId, customerId },
    { rejectWithValue, getState }
  ) => {
    try {
      const token = localStorage.getItem("authtoken");

      if (!token) throw new Error("Authentication required");

      // ✅ GET CUSTOMER ID FROM PARAMETER OR STATE
      let effectiveCustomerId = customerId;

      if (!effectiveCustomerId) {
        const state = getState();
        effectiveCustomerId = state.auth?.customerId;
      }

      if (!effectiveCustomerId) {
        throw new Error("Customer ID is required");
      }

      if (!plaidPublicToken || !accountId) {
        throw new Error("Plaid token and account ID are required");
      }

      console.log("🔗 Linking new Sila bank account:", {
        customerId: effectiveCustomerId,
        hasToken: !!plaidPublicToken,
        accountId,
      });

      const response = await api.post(
        "/sila/link-bank-account",
        {
          plaid_public_token: plaidPublicToken,
          plaid_account_id: accountId,
          customerId: effectiveCustomerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (response.status >= 400 || !data.success) {
        throw new Error(data.message || "Failed to link bank account");
      }

      console.log("✅ Sila bank account linked successfully:", data.message);
      return {
        success: true,
        data: data.data,
        message: data.message || "Bank account linked successfully",
      };
    } catch (error) {
      console.error("❌ Failed to link Sila bank account:", {
        error: error.message,
      });
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to link bank account"
      );
    }
  }
);

// ✅ ADDED: Get Sila account balance
export const getSilaAccountBalance = createAsyncThunk(
  "bankLink/getSilaAccountBalance",
  async (customerId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("authtoken");

      if (!token) throw new Error("Authentication required");

      // ✅ GET CUSTOMER ID FROM PARAMETER OR STATE
      let effectiveCustomerId = customerId;

      if (!effectiveCustomerId) {
        const state = getState();
        effectiveCustomerId = state.auth?.customerId;
      }

      if (!effectiveCustomerId) {
        throw new Error("Customer ID is required");
      }

      console.log("💰 Getting Sila account balance for:", effectiveCustomerId);

      const response = await api.post(
        "/sila/get-account-balance",
        {
          customerId: effectiveCustomerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (response.status >= 400 || !data.success) {
        throw new Error(data.message || "Failed to get account balance");
      }

      console.log("✅ Sila account balance retrieved:", data.data);
      return {
        success: true,
        balance: data.data.balance,
        availableBalance: data.data.available_balance,
        currency: data.data.currency || "USD",
      };
    } catch (error) {
      console.error("❌ Failed to get Sila account balance:", {
        error: error.message,
      });
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to get account balance"
      );
    }
  }
);

// ✅ FIXED: handleBankLinkSuccess - updated to handle Sila responses
export const handleBankLinkSuccess = createAsyncThunk(
  "bankLink/handleBankLinkSuccess",
  async ({ response, customerId }, { rejectWithValue, dispatch, getState }) => {
    try {
      if (!response) {
        throw new Error("No response received from bank linking");
      }

      // ✅ GET CUSTOMER ID FROM PARAMETER OR STATE
      let effectiveCustomerId = customerId;

      if (!effectiveCustomerId) {
        const state = getState();
        effectiveCustomerId = state.auth?.customerId;
      }

      console.log("🔍 Processing Sila bank link success:", {
        response,
        customerId: effectiveCustomerId,
      });

      // Check for Sila-specific KYC status
      if (
        response.kyc_status === "pending" ||
        response.kyc_status === "unverified" ||
        (response.message && response.message.toLowerCase().includes("kyc"))
      ) {
        return {
          type: "kyc_pending",
          message: response.message || "KYC verification in progress",
          customerId: effectiveCustomerId,
          kycStatus: response.kyc_status,
        };
      }

      // Check for Sila account verification status
      if (
        response.verification_status === "pending" ||
        response.account_status === "pending"
      ) {
        return {
          type: "verification_pending",
          message: response.message || "Account verification in progress",
          customerId: effectiveCustomerId,
        };
      }

      if (!response.success) {
        throw new Error(
          response.message || "Bank linking failed without error message"
        );
      }

      // ✅ Refresh Sila accounts after successful linking
      if (effectiveCustomerId) {
        await dispatch(fetchBankAccounts(effectiveCustomerId));
      }

      return {
        type: "success",
        data: response.data || response,
        message: response.message || "Bank account linked successfully",
        customerId: effectiveCustomerId,
      };
    } catch (error) {
      console.error("❌ Failed to process Sila bank linking:", error);
      return rejectWithValue(error.message || "Failed to process bank linking");
    }
  }
);

// Initial state (updated for Sila)
const initialState = {
  // Sila bank accounts data
  bankAccounts: [],
  loading: true,
  error: null,

  // Sila account balance
  accountBalance: null,
  availableBalance: null,
  balanceLoading: false,
  balanceError: null,

  // UI state
  showPlaidLink: false,
  showSuccessModal: false,
  apiResponse: null,

  // Delete operations
  deletingAccountId: null,
  deleteError: null,
  deleteSuccess: null,

  // Status messages
  kycStatus: null,
  verificationStatus: null,

  // Loading states
  isRefreshing: false,
  isAddingAccount: false,
  isProcessing: false,
  isLinkingAccount: false,

  // Pagination
  currentPage: 1,
  accountsPerPage: 5,

  // Customer info
  currentCustomerId: null,

  // Sila-specific data
  silaHandle: null,
  silaWalletAddress: null,
};

const bankLinkSlice = createSlice({
  name: "bankLink",
  initialState,
  reducers: {
    // UI actions
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
    setVerificationStatus: (state, action) => {
      state.verificationStatus = action.payload;
    },
    setCurrentCustomerId: (state, action) => {
      state.currentCustomerId = action.payload;
    },

    // Sila data
    setSilaHandle: (state, action) => {
      state.silaHandle = action.payload;
    },
    setSilaWalletAddress: (state, action) => {
      state.silaWalletAddress = action.payload;
    },

    // Status management
    clearErrors: (state) => {
      state.error = null;
      state.deleteError = null;
      state.deleteSuccess = null;
      state.kycStatus = null;
      state.verificationStatus = null;
      state.balanceError = null;
    },
    clearDeleteStatus: (state) => {
      state.deleteError = null;
      state.deleteSuccess = null;
    },

    // Manual refresh
    startRefresh: (state) => {
      state.isRefreshing = true;
    },
    endRefresh: (state) => {
      state.isRefreshing = false;
    },

    // Reset state
    resetBankLinkState: () => initialState,

    setIsProcessing: (state, action) => {
      state.isProcessing = action.payload;
    },

    // Force refresh accounts
    refreshAccounts: (state) => {
      state.loading = true;
      state.error = null;
    },

    refreshAccountsAfterSuccess: (state) => {
      state.loading = true;
      state.isRefreshing = true;
      state.error = null;
      console.log("🔄 Refreshing Sila accounts after success");
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Sila Bank Accounts
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
        console.log(
          "✅ Sila bank accounts state updated:",
          action.payload.length
        );
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.loading = false;
        state.isRefreshing = false;
        state.error = action.payload;
        console.error("❌ Sila bank accounts fetch rejected:", action.payload);
      })

      // Link Sila Bank Account
      .addCase(linkSilaBankAccount.pending, (state) => {
        state.isLinkingAccount = true;
        state.error = null;
      })
      .addCase(linkSilaBankAccount.fulfilled, (state, action) => {
        state.isLinkingAccount = false;
        state.error = null;
        state.showSuccessModal = true;
        state.apiResponse = action.payload;
        console.log("✅ Sila bank account linked:", action.payload.message);
      })
      .addCase(linkSilaBankAccount.rejected, (state, action) => {
        state.isLinkingAccount = false;
        state.error = action.payload;
        console.error("❌ Sila bank account linking rejected:", action.payload);
      })

      // Get Sila Account Balance
      .addCase(getSilaAccountBalance.pending, (state) => {
        state.balanceLoading = true;
        state.balanceError = null;
      })
      .addCase(getSilaAccountBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.accountBalance = action.payload.balance;
        state.availableBalance = action.payload.availableBalance;
        console.log("✅ Sila account balance updated:", action.payload.balance);
      })
      .addCase(getSilaAccountBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.balanceError = action.payload;
        console.error(
          "❌ Sila account balance fetch rejected:",
          action.payload
        );
      })

      // Delete Bank Account (keep existing)
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
          (account) => account.account_id !== action.payload.accountId
        );

        console.log(
          "✅ Sila account removed from state:",
          action.payload.accountId
        );
      })
      .addCase(deleteBankAccount.rejected, (state, action) => {
        state.isProcessing = false;
        state.deletingAccountId = null;
        state.deleteError = action.payload;
        console.error("❌ Sila account deletion failed:", action.payload);
      })

      // Handle Bank Link Success (updated for Sila)
      .addCase(handleBankLinkSuccess.pending, (state) => {
        state.isAddingAccount = true;
        state.error = null;
      })
      .addCase(handleBankLinkSuccess.fulfilled, (state, action) => {
        state.isAddingAccount = false;
        state.error = null;

        if (action.payload.type === "kyc_pending") {
          state.kycStatus = action.payload.message;
          state.currentCustomerId = action.payload.customerId;
          console.log("⚠️ Sila KYC pending:", action.payload.message);
        } else if (action.payload.type === "verification_pending") {
          state.verificationStatus = action.payload.message;
          state.currentCustomerId = action.payload.customerId;
          console.log(
            "⚠️ Sila account verification pending:",
            action.payload.message
          );
        } else if (action.payload.type === "success") {
          state.apiResponse = action.payload.data;
          state.showSuccessModal = true;
          state.showPlaidLink = false;
          state.currentCustomerId = action.payload.customerId;
          console.log("✅ Sila bank link success processed");
        }
      })
      .addCase(handleBankLinkSuccess.rejected, (state, action) => {
        state.isAddingAccount = false;
        state.error = action.payload;
        state.showPlaidLink = false;
        console.error("❌ Sila bank link success rejected:", action.payload);
      })

      // Fetch Link Bank Requests (keep existing)
      .addCase(fetchLinkBankRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLinkBankRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Merge with existing accounts or replace based on your needs
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.bankAccounts = [...state.bankAccounts, ...action.payload];
        }
        console.log(
          "✅ Link bank requests fetched:",
          action.payload?.length || 0
        );
      })
      .addCase(fetchLinkBankRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("❌ Link bank requests failed:", action.payload);
      });
  },
});

export const {
  setShowPlaidLink,
  setShowSuccessModal,
  setApiResponse,
  setCurrentPage,
  setKycStatus,
  setVerificationStatus,
  setCurrentCustomerId,
  setSilaHandle,
  setSilaWalletAddress,
  clearErrors,
  clearDeleteStatus,
  startRefresh,
  endRefresh,
  resetBankLinkState,
  refreshAccounts,
  setIsProcessing,
  refreshAccountsAfterSuccess,
} = bankLinkSlice.actions;

// Selectors
export const selectBankAccounts = (state) => state.bankLink.bankAccounts;
export const selectLoading = (state) => state.bankLink.loading;
export const selectError = (state) => state.bankLink.error;
export const selectShowPlaidLink = (state) => state.bankLink.showPlaidLink;
export const selectShowSuccessModal = (state) =>
  state.bankLink.showSuccessModal;
export const selectApiResponse = (state) => state.bankLink.apiResponse;
export const selectDeletingAccountId = (state) =>
  state.bankLink.deletingAccountId;
export const selectDeleteError = (state) => state.bankLink.deleteError;
export const selectDeleteSuccess = (state) => state.bankLink.deleteSuccess;
export const selectKycStatus = (state) => state.bankLink.kycStatus;
export const selectVerificationStatus = (state) =>
  state.bankLink.verificationStatus;
export const selectIsRefreshing = (state) => state.bankLink.isRefreshing;
export const selectIsAddingAccount = (state) => state.bankLink.isAddingAccount;
export const selectIsProcessing = (state) => state.bankLink.isProcessing;
export const selectIsLinkingAccount = (state) =>
  state.bankLink.isLinkingAccount;
export const selectCurrentPage = (state) => state.bankLink.currentPage;
export const selectCurrentCustomerId = (state) =>
  state.bankLink.currentCustomerId;

// Sila-specific selectors
export const selectAccountBalance = (state) => state.bankLink.accountBalance;
export const selectAvailableBalance = (state) =>
  state.bankLink.availableBalance;
export const selectBalanceLoading = (state) => state.bankLink.balanceLoading;
export const selectBalanceError = (state) => state.bankLink.balanceError;
export const selectSilaHandle = (state) => state.bankLink.silaHandle;
export const selectSilaWalletAddress = (state) =>
  state.bankLink.silaWalletAddress;

// Derived selectors
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

export const selectHasAccounts = (state) =>
  state.bankLink.bankAccounts.length > 0;

// Filtered selectors for USD accounts only
export const selectUSDBankAccounts = (state) => {
  return state.bankLink.bankAccounts.filter(
    (account) => account.currency === "USD" || !account.currency
  );
};

export default bankLinkSlice.reducer;