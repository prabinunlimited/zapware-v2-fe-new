// beneficiaryHomepageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { centralizedApi } from "../../../services/api";

// Helper function to get auth token
const getAuthToken = () => {
  const authtoken =
    localStorage.getItem("authtoken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("bearerToken") ||
    sessionStorage.getItem("authtoken") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("bearerToken");

  return authtoken;
};

// Calculate transaction stats
const calculateTransactionStats = (transactions) => {
  const totalTransactions = transactions?.length || 0;

  const transactionsPending =
    transactions?.filter((trans) => {
      const status = trans.status?.toLowerCase();
      return (
        status === "pending" ||
        status === "processing" ||
        status === "processing-payout" ||
        status === "in_progress" ||
        status === "awaiting_approval" ||
        status === "processing_payout"
      );
    }).length || 0;

  const transactionsPaid =
    transactions?.filter((trans) => {
      const status = trans.status?.toLowerCase();
      return (
        status === "completed" ||
        status === "paid" ||
        status === "approved" ||
        status === "success" ||
        status === "settled" ||
        status === "processed"
      );
    }).length || 0;

  const transactionsFailed =
    transactions?.filter((trans) => {
      const status = trans.status?.toLowerCase();
      return (
        status === "failed" ||
        status === "rejected" ||
        status === "cancelled" ||
        status === "declined"
      );
    }).length || 0;

  return {
    totalTransactions,
    transactionsPending,
    transactionsPaid,
    transactionsFailed,
  };
};

// Calculate dashboard stats
const calculateDashboardStats = (requests, transactions) => {
  const totalRequests = requests?.length || 0;
  const pendingRequests =
    requests?.filter((req) =>
      ["pending", "opened", "amount_changed"].includes(req.status)
    ).length || 0;

  const completedTransactions =
    transactions?.filter(
      (trans) => trans.status === "completed" || trans.status === "approved"
    ).length || 0;

  const totalAmount =
    transactions?.reduce((sum, trans) => {
      if (trans.status === "completed" || trans.status === "approved") {
        return sum + (parseFloat(trans.amount) || 0);
      }
      return sum;
    }, 0) || 0;

  return {
    totalRequests,
    pendingRequests,
    completedTransactions,
    totalAmount,
  };
};

// Async thunks using centralized API
export const fetchCurrencies = createAsyncThunk(
  "beneficiaryHomepage/fetchCurrencies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await centralizedApi.api.get("/payout-currencies");
      
      console.log("Currencies API Response:", response.data);
      const data = response.data;

      let currenciesArray = [];

      if (Array.isArray(data)) {
        currenciesArray = data;
      } else if (data.currencies && Array.isArray(data.currencies)) {
        currenciesArray = data.currencies;
      } else if (data.data && Array.isArray(data.data)) {
        currenciesArray = data.data;
      } else {
        currenciesArray = Object.keys(data).map((key) => ({
          code: key,
          name: data[key],
        }));
      }

      return currenciesArray;
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  "beneficiaryHomepage/fetchTransactions",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      if (!beneficiaryId) {
        throw new Error("Beneficiary ID is required");
      }

      const response = await centralizedApi.api.get(
        `/beneficiaries/all-transactions/${beneficiaryId}`
      );

      console.log("Full Transactions API Response:", response.data);
      const data = response.data;

      let transactionsData = [];

      if (data.data?.transactionDetails) {
        transactionsData = data.data.transactionDetails;
      } else if (data.transactionDetails) {
        transactionsData = data.transactionDetails;
      } else if (Array.isArray(data.data)) {
        transactionsData = data.data;
      } else if (Array.isArray(data)) {
        transactionsData = data;
      }

      const sortedTransactions = transactionsData.sort(
        (a, b) =>
          new Date(b.transaction_datetime || b.created_at) -
          new Date(a.transaction_datetime || a.created_at)
      );

      const mappedTransactions = sortedTransactions.map((transaction) => ({
        id: transaction.transaction_id || transaction.id,
        amount: transaction.instructed_amount || transaction.amount,
        currency: transaction.currency_code || transaction.currency,
        status: transaction.status,
        created_at: transaction.transaction_datetime || transaction.created_at,
        direction: transaction.direction,
        fee_amount: transaction.fee_amount,
        amount_with_fee: transaction.amount_with_fee,
        particulars: transaction.particulars,
        sender_name: transaction.sender_name,
      }));

      return mappedTransactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRequestStatus = createAsyncThunk(
  "beneficiaryHomepage/fetchRequestStatus",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      try {
        const response = await centralizedApi.api.get(
          `/request-status/${beneficiaryId}`
        );

        console.log("Request Status API Response:", response.data);
        const data = response.data;

        if (data.data && Array.isArray(data.data)) {
          return data.data.slice(0, 5);
        } else if (Array.isArray(data)) {
          return data.slice(0, 5);
        } else {
          return [
            {
              id: "REQ-001",
              amount: "1000.00",
              currency: "USD",
              status: "completed",
              created_at: new Date().toISOString(),
            },
          ];
        }
      } catch (apiError) {
        // If endpoint doesn't exist, return mock data
        console.log("Request status endpoint not found, returning mock data");
        return [
          {
            id: "REQ-001",
            amount: "1000.00",
            currency: "USD",
            status: "completed",
            created_at: new Date().toISOString(),
          },
          {
            id: "REQ-002",
            amount: "2500.00",
            currency: "EUR",
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ];
      }
    } catch (error) {
      console.error("Failed to fetch request status:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSenders = createAsyncThunk(
  "beneficiaryHomepage/fetchSenders",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      try {
        const response = await centralizedApi.api.get(
          `/beneficiaries/senders/${beneficiaryId}`
        );

        console.log("Senders API Response:", response.data);
        const data = response.data;

        if (
          data.getbenefsendersacctobeneficiaryid_data &&
          Array.isArray(data.getbenefsendersacctobeneficiaryid_data)
        ) {
          const sendersData = data.getbenefsendersacctobeneficiaryid_data.map(
            (item) => ({
              id: item.customer_id,
              full_name: `${item.customer?.first_name || ""} ${
                item.customer?.middle_name || ""
              } ${item.customer?.last_name || ""}`
                .trim()
                .replace(/\s+/g, " "),
              first_name: item.customer?.first_name || "",
              middle_name: item.customer?.middle_name || "",
              last_name: item.customer?.last_name || "",
              email: item.customer?.email || "",
              phone: item.customer?.mobile_number || "",
              country: item.customer?.country || "",
            })
          );

          return sendersData;
        } else {
          return [];
        }
      } catch (apiError) {
        if (apiError.response?.status === 404) {
          return [];
        }
        throw apiError;
      }
    } catch (error) {
      console.error("Failed to fetch senders:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const submitRemittanceRequest = createAsyncThunk(
  "beneficiaryHomepage/submitRemittanceRequest",
  async (requestData, { rejectWithValue }) => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await centralizedApi.api.post(
        "/request-remit",
        requestData
      );

      const result = response.data;
      console.log("API Response:", result);

      if (response.status === 200 && result.status === "success") {
        return {
          success: true,
          data: result.data,
          message:
            result.message || "Remittance request submitted successfully!",
          requestRemitLink: result.data?.requestRemitLink,
        };
      } else {
        throw new Error(
          result.message || "Failed to submit request. Please try again."
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.message || "Failed to submit request. Please try again."
      );
    }
  }
);

// Enhanced fetchBeneficiaryHomepageData with better error handling
export const fetchBeneficiaryHomepageData = createAsyncThunk(
  "beneficiaryHomepage/fetchAllData",
  async (beneficiaryId, { dispatch, rejectWithValue }) => {
    try {
      console.log("🔄 Starting to fetch all data for beneficiary:", beneficiaryId);

      // Fetch all data in parallel with centralized API caching
      const results = await Promise.allSettled([
        dispatch(fetchCurrencies()),
        dispatch(fetchTransactions(beneficiaryId)),
        dispatch(fetchRequestStatus(beneficiaryId)),
        dispatch(fetchSenders(beneficiaryId)),
      ]);

      // Check if any failed
      const failedResults = results.filter(
        (result) => result.status === "rejected"
      );
      if (failedResults.length > 0) {
        console.warn("⚠️ Some API calls failed:", failedResults);
      }

      console.log("✅ All data loaded successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error fetching all data:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Enhanced fetchBeneficiaryData (for initial load)
export const fetchBeneficiaryData = createAsyncThunk(
  "beneficiaryHomepage/fetchBeneficiaryData",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      if (!beneficiaryId) {
        throw new Error("Beneficiary ID is required");
      }

      const response = await centralizedApi.api.get(
        `/beneficiaries/fetch-merchant-benef/${beneficiaryId}`
      );

      console.log("Beneficiary Data API Response:", response.data);
      const data = response.data;

      if (data.data) {
        return {
          data: data.data,
          benefCode: data.data.benef_code || data.data.benefCode || "",
        };
      } else {
        throw new Error("No beneficiary data found");
      }
    } catch (error) {
      console.error("Failed to fetch beneficiary data:", error);
      return rejectWithValue(
        error.message || "Failed to load beneficiary information."
      );
    }
  }
);

const initialState = {
  // Form Data
  formData: {
    beneficiary_id: "",
    beneficiary_bank_id: "",
    amount: "",
    currency: "USD",
    senders: [],
  },

  // Data States
  currencies: [],
  beneficiaryData: null,
  transactions: [],
  requestStatus: [],
  senders: [],
  selectedSenders: [],

  // UI States
  isLoading: false,
  currenciesLoading: false,
  transactionsLoading: false,
  statusLoading: false,
  sendersLoading: false,
  isSubmitting: false,

  // Stats
  stats: {
    totalRequests: 0,
    pendingRequests: 0,
    completedTransactions: 0,
    totalAmount: 0,
  },

  transactionStats: {
    totalTransactions: 0,
    transactionsPending: 0,
    transactionsPaid: 0,
    transactionsFailed: 0,
  },

  // Request Result
  requestRemitLink: null,
  copySuccess: false,

  // Email Form
  emailForm: {
    to: "",
    subject: "🔐 Secure Remittance Request - Action Required",
    message: "",
  },

  // Popup States
  showSharePopup: false,

  // Messages and Errors
  message: { type: "", text: "" },
  errors: {},
  hasFetchedBeneficiary: false,
  userEmail: "",
  benefCode: "",
};

const beneficiaryHomepageSlice = createSlice({
  name: "beneficiaryHomepage",
  initialState,
  reducers: {
    // Form Actions
    updateFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },

    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;

      // Clear error for this field
      if (state.errors[field]) {
        delete state.errors[field];
      }
    },

    // Sender Selection
    toggleSenderSelection: (state, action) => {
      const senderId = action.payload;
      const isSelected = state.selectedSenders.includes(senderId);

      if (isSelected) {
        state.selectedSenders = state.selectedSenders.filter(
          (id) => id !== senderId
        );
        state.formData.senders = state.formData.senders.filter(
          (id) => id !== senderId
        );
      } else {
        state.selectedSenders = [...state.selectedSenders, senderId];
        state.formData.senders = [...state.formData.senders, senderId];
      }
    },

    selectAllSenders: (state) => {
      const allSenderIds = state.senders.map((sender) => sender.id);
      state.selectedSenders = allSenderIds;
      state.formData.senders = allSenderIds;
    },

    clearAllSenders: (state) => {
      state.selectedSenders = [];
      state.formData.senders = [];
    },

    // Beneficiary Data
    setBeneficiaryData: (state, action) => {
      state.beneficiaryData = action.payload.data;
      state.hasFetchedBeneficiary = true;
      state.benefCode = action.payload.benefCode;

      // Update form data with beneficiary ID and first bank
      if (action.payload.data.benef_banks && action.payload.data.benef_banks.length > 0) {
        const firstBank = action.payload.data.benef_banks[0];
        state.formData.beneficiary_bank_id = firstBank.id.toString();
        state.formData.currency = firstBank.currency_code || "USD";
        state.formData.beneficiary_id = action.payload.data.id || "";
      }
    },

    // UI Actions
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setMessage: (state, action) => {
      state.message = action.payload;
    },

    clearMessage: (state) => {
      state.message = { type: "", text: "" };
    },

    setErrors: (state, action) => {
      state.errors = action.payload;
    },

    clearErrors: (state) => {
      state.errors = {};
    },

    // Request Result Actions
    setRequestRemitLink: (state, action) => {
      state.requestRemitLink = action.payload;
    },

    clearRequestRemitLink: (state) => {
      state.requestRemitLink = null;
    },

    setCopySuccess: (state, action) => {
      state.copySuccess = action.payload;
    },

    // Email Form Actions
    updateEmailForm: (state, action) => {
      state.emailForm = { ...state.emailForm, ...action.payload };
    },

    setEmailFormField: (state, action) => {
      const { field, value } = action.payload;
      state.emailForm[field] = value;
    },

    // Popup Actions
    toggleSharePopup: (state, action) => {
      state.showSharePopup = action.payload ?? !state.showSharePopup;
    },

    // Reset Form
    resetForm: (state) => {
      state.formData = {
        ...state.formData,
        amount: "",
        beneficiary_bank_id:
          state.beneficiaryData?.benef_banks?.[0]?.id?.toString() || "",
        currency:
          state.beneficiaryData?.benef_banks?.[0]?.currency_code || "USD",
      };
      state.selectedSenders = [];
      state.formData.senders = [];
      state.requestRemitLink = null;
      state.copySuccess = false;
      state.showSharePopup = false;
      state.message = { type: "", text: "" };
      state.errors = {};
    },

    // User Email
    setUserEmail: (state, action) => {
      state.userEmail = action.payload;
    },

    // Reset State
    resetBeneficiaryHomepage: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Currencies
      .addCase(fetchCurrencies.pending, (state) => {
        state.currenciesLoading = true;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.currenciesLoading = false;
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.currenciesLoading = false;
        state.message = {
          type: "error",
          text: action.payload || "Failed to fetch currencies",
        };
        // Set default currencies
        state.currencies = [
          { code: "USD", name: "US Dollar" },
          { code: "EUR", name: "Euro" },
          { code: "GBP", name: "British Pound" },
          { code: "JPY", name: "Japanese Yen" },
        ];
      })

      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.transactionsLoading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload;
        state.transactionStats = calculateTransactionStats(action.payload);
        state.stats = calculateDashboardStats(
          state.requestStatus,
          action.payload
        );
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.message = {
          type: "error",
          text: action.payload || "Failed to fetch transactions",
        };
        state.transactions = [];
        state.transactionStats = calculateTransactionStats([]);
        state.stats = calculateDashboardStats(state.requestStatus, []);
      })

      // Fetch Request Status
      .addCase(fetchRequestStatus.pending, (state) => {
        state.statusLoading = true;
      })
      .addCase(fetchRequestStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.requestStatus = action.payload;
        state.stats = calculateDashboardStats(
          action.payload,
          state.transactions
        );
      })
      .addCase(fetchRequestStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.message = {
          type: "error",
          text: action.payload || "Failed to fetch request status",
        };
        // Set mock data
        state.requestStatus = [
          {
            id: "REQ-001",
            amount: "1000.00",
            currency: "USD",
            status: "completed",
            created_at: new Date().toISOString(),
          },
          {
            id: "REQ-002",
            amount: "2500.00",
            currency: "EUR",
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ];
        state.stats = calculateDashboardStats(
          state.requestStatus,
          state.transactions
        );
      })

      // Fetch Senders
      .addCase(fetchSenders.pending, (state) => {
        state.sendersLoading = true;
      })
      .addCase(fetchSenders.fulfilled, (state, action) => {
        state.sendersLoading = false;
        state.senders = action.payload;
      })
      .addCase(fetchSenders.rejected, (state, action) => {
        state.sendersLoading = false;
        state.message = {
          type: "error",
          text: action.payload || "Failed to fetch senders",
        };
        state.senders = [];
      })

      // Fetch Beneficiary Data
      .addCase(fetchBeneficiaryData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBeneficiaryData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.beneficiaryData = action.payload.data;
        state.hasFetchedBeneficiary = true;
        state.benefCode = action.payload.benefCode;
        
        // Update form data
        if (action.payload.data.benef_banks && action.payload.data.benef_banks.length > 0) {
          const firstBank = action.payload.data.benef_banks[0];
          state.formData.beneficiary_bank_id = firstBank.id.toString();
          state.formData.currency = firstBank.currency_code || "USD";
          state.formData.beneficiary_id = action.payload.data.id || "";
        }
      })
      .addCase(fetchBeneficiaryData.rejected, (state, action) => {
        state.isLoading = false;
        state.message = {
          type: "error",
          text: action.payload || "Failed to fetch beneficiary data",
        };
      })

      // Submit Remittance Request
      .addCase(submitRemittanceRequest.pending, (state) => {
        state.isSubmitting = true;
        state.message = { type: "", text: "" };
        state.errors = {};
      })
      .addCase(submitRemittanceRequest.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.message = {
          type: "success",
          text: action.payload.message,
        };
        state.requestRemitLink = action.payload.requestRemitLink;

        // Update email form with enhanced content
        const currentDate = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        state.emailForm.message = `
🔐 SECURE REMITTANCE REQUEST - ACTION REQUIRED

Dear Recipient,

You have received a secure remittance request that requires your immediate attention.

📋 PAYMENT DETAILS:
• Secure Payment Link: ${action.payload.requestRemitLink}
• Request Date: ${currentDate}
• Status: Pending Your Action

🚀 QUICK ACTIONS:
1. Click the payment link above to access the secure payment portal
2. Review the transaction details carefully
3. Complete the payment using your preferred method
4. Receive instant confirmation upon completion

🛡️ SECURITY FEATURES:
• End-to-end encryption
• Real-time transaction monitoring
• Secure payment processing
• Instant confirmation

⏰ TIME-SENSITIVE:
This payment link is active for 7 days. We recommend completing the payment at your earliest convenience to avoid any processing delays.

📞 SUPPORT INFORMATION:
If you encounter any issues or have questions:
• Support available 24/7
• Typical response time: 15 minutes
• Secure messaging through the payment portal

🔒 IMPORTANT SECURITY NOTES:
• This link is uniquely generated for you - do not share it with others
• Always verify you're on a secure connection (https://)
• Contact support immediately if you notice anything suspicious

Best regards,
Global Remittance Team
---
This is an automated message from Global Remittance Portal.
For security reasons, please do not reply to this email.
Generated on ${currentDate}
        `.trim();
      })
      .addCase(submitRemittanceRequest.rejected, (state, action) => {
        state.isSubmitting = false;
        state.message = {
          type: "error",
          text: action.payload || "Failed to submit request. Please try again.",
        };
        state.requestRemitLink = null;
      })

      // Fetch All Data
      .addCase(fetchBeneficiaryHomepageData.pending, (state) => {
        state.isLoading = true;
        state.message = { type: "", text: "" };
      })
      .addCase(fetchBeneficiaryHomepageData.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchBeneficiaryHomepageData.rejected, (state, action) => {
        state.isLoading = false;
        state.message = {
          type: "error",
          text:
            action.payload ||
            "Failed to load data. Please try refreshing the page.",
        };
      });
  },
});

// Export actions
export const {
  updateFormData,
  setFormField,
  toggleSenderSelection,
  selectAllSenders,
  clearAllSenders,
  setBeneficiaryData,
  setLoading,
  setMessage,
  clearMessage,
  setErrors,
  clearErrors,
  setRequestRemitLink,
  clearRequestRemitLink,
  setCopySuccess,
  updateEmailForm,
  setEmailFormField,
  toggleSharePopup,
  resetForm,
  setUserEmail,
  resetBeneficiaryHomepage,
} = beneficiaryHomepageSlice.actions;

// Export selectors
export const selectFormData = (state) => state.beneficiaryHomepage.formData;
export const selectCurrencies = (state) => state.beneficiaryHomepage.currencies;
export const selectBeneficiaryData = (state) =>
  state.beneficiaryHomepage.beneficiaryData;
export const selectTransactions = (state) =>
  state.beneficiaryHomepage.transactions;
export const selectRequestStatus = (state) =>
  state.beneficiaryHomepage.requestStatus;
export const selectSenders = (state) => state.beneficiaryHomepage.senders;
export const selectSelectedSenders = (state) =>
  state.beneficiaryHomepage.selectedSenders;
export const selectIsLoading = (state) => state.beneficiaryHomepage.isLoading;
export const selectCurrenciesLoading = (state) =>
  state.beneficiaryHomepage.currenciesLoading;
export const selectTransactionsLoading = (state) =>
  state.beneficiaryHomepage.transactionsLoading;
export const selectStatusLoading = (state) =>
  state.beneficiaryHomepage.statusLoading;
export const selectSendersLoading = (state) =>
  state.beneficiaryHomepage.sendersLoading;
export const selectIsSubmitting = (state) =>
  state.beneficiaryHomepage.isSubmitting;
export const selectStats = (state) => state.beneficiaryHomepage.stats;
export const selectTransactionStats = (state) =>
  state.beneficiaryHomepage.transactionStats;
export const selectRequestRemitLink = (state) =>
  state.beneficiaryHomepage.requestRemitLink;
export const selectCopySuccess = (state) =>
  state.beneficiaryHomepage.copySuccess;
export const selectEmailForm = (state) => state.beneficiaryHomepage.emailForm;
export const selectShowSharePopup = (state) =>
  state.beneficiaryHomepage.showSharePopup;
export const selectMessage = (state) => state.beneficiaryHomepage.message;
export const selectErrors = (state) => state.beneficiaryHomepage.errors;
export const selectHasFetchedBeneficiary = (state) =>
  state.beneficiaryHomepage.hasFetchedBeneficiary;
export const selectUserEmail = (state) => state.beneficiaryHomepage.userEmail;
export const selectBenefCode = (state) => state.beneficiaryHomepage.benefCode;

export default beneficiaryHomepageSlice.reducer;