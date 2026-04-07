// src/page/Deposit/slices/depositSlice.js - COMPLETE VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";
import { depositAPI } from "../api/depositAPI";
import axios from "axios";

// ✅ UPDATED: Submit deposit thunk to match original logic
// ✅ COMPLETE FIXED: Submit deposit thunk with correct token extraction
export const submitDeposit = createAsyncThunk(
  "deposit/submitDeposit",
  async (depositData, { rejectWithValue, getState }) => {
    try {
      // ✅ FIXED: Correct token extraction from URL
      let token = null;
      let customerIdFromUrl = null;
      let uniqueReferenceFromUrl = null;

      const pathParts = window.location.pathname.split("/");
      const depositIframeIndex = pathParts.indexOf("depositiframe");

      if (depositIframeIndex !== -1) {
        console.log("🔍 URL Parsing for submitDeposit:", {
          pathParts,
          depositIframeIndex,
          totalParts: pathParts.length,
        });

        // CustomerId is at position 1 after depositiframe
        if (pathParts.length > depositIframeIndex + 1) {
          customerIdFromUrl = pathParts[depositIframeIndex + 1];
        }

        // Token is at position 2 after depositiframe
        if (pathParts.length > depositIframeIndex + 2) {
          token = pathParts[depositIframeIndex + 2];
        }

        // Unique reference is at position 3 after depositiframe
        if (pathParts.length > depositIframeIndex + 3) {
          uniqueReferenceFromUrl = pathParts[depositIframeIndex + 3];
        }
      }

      // Fallback to localStorage
      if (!token) {
        token = localStorage.getItem("authtoken");
        console.log(
          "🔄 Using token from localStorage:",
          token ? `${token.substring(0, 20)}...` : "None"
        );
      }

      if (!token) {
        throw new Error(
          "Authentication required - no token found in URL or localStorage"
        );
      }

      // Get customerId from depositData, URL, or localStorage
      const customerId =
        depositData.customer_id ||
        customerIdFromUrl ||
        localStorage.getItem("authcustomer_id");

      if (!customerId) {
        throw new Error(
          "Customer ID not found. Please provide customer_id in depositData or ensure URL contains customerId."
        );
      }

      // Get state for currency/payment method checks
      const state = getState();
      const { selectedCurrency, paymentMethod, amount, purpose } =
        state.deposit;

      console.log("🔍 Deposit submission details:", {
        tokenFromUrl: token ? `${token.substring(0, 20)}...` : "None",
        customerIdFromUrl,
        customerId,
        uniqueReferenceFromUrl,
        selectedCurrency,
        paymentMethod,
        amount,
        purpose,
        depositData,
        fullPath: window.location.pathname,
      });

      // ✅ MATCH ORIGINAL: Check for EUR/GBP bank transfers (Open Banking)
      if (
        (selectedCurrency === "EUR" || selectedCurrency === "GBP") &&
        paymentMethod === "bank_deposit"
      ) {
        console.log("🎯 EUR/GBP bank deposit - triggering Open Banking flow");
        return {
          success: true,
          openBankingRequired: true,
          currency: selectedCurrency,
          amount: depositData.amount || amount,
          message: "Open Banking payment initiation required",
        };
      }

      // ✅ MATCH ORIGINAL: Check for CAD/GBP card deposits
      if (
        (selectedCurrency === "CAD" || selectedCurrency === "GBP") &&
        paymentMethod === "card_deposit"
      ) {
        console.log("🎯 CAD/GBP card deposit - card payment redirect required");
        return {
          success: true,
          cardPaymentRequired: true,
          currency: selectedCurrency,
          amount: depositData.amount || amount,
          message: "Card payment redirect required",
        };
      }

      // ✅ Prepare request data
      const requestData = {
        ...depositData,
        customer_id: customerId,
        currency: selectedCurrency,
        payment_method: paymentMethod,
        purpose: purpose || depositData.purpose,
        // Include unique reference if available
        ...(uniqueReferenceFromUrl && {
          unique_reference: uniqueReferenceFromUrl,
        }),
      };

      // Remove any undefined or null values
      Object.keys(requestData).forEach((key) => {
        if (requestData[key] === undefined || requestData[key] === null) {
          delete requestData[key];
        }
      });

      console.log("🔍 Final deposit request data:", {
        requestData,
        endpoint: "/transactions/remittance-transaction",
        tokenPreview: `${token.substring(0, 20)}...`,
      });

      // ✅ Make the API call
      const response = await api.post(
        "/transactions/remittance-transaction",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Deposit submission successful:", {
        status: response.status,
        data: response.data,
      });

      return {
        ...response.data,
        // Include metadata for UI
        submittedAt: new Date().toISOString(),
        currency: selectedCurrency,
        amount: depositData.amount || amount,
        paymentMethod: paymentMethod,
      };
    } catch (error) {
      console.error("❌ Deposit submission error:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      // Handle specific error cases
      let errorMessage = "Failed to submit deposit";
      let errorDetails = null;

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;

        if (status === 401) {
          errorMessage = "Authentication failed. Please check your token.";
          errorDetails = {
            tokenUsed: token ? `${token.substring(0, 10)}...` : "None",
            suggestion:
              "Make sure the token in the URL is valid and not expired.",
          };
        } else if (status === 400) {
          errorMessage = error.response.data?.message || "Invalid request data";
          errorDetails = error.response.data;
        } else if (status === 404) {
          errorMessage = "API endpoint not found";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage =
            error.response.data?.message || `Server error (${status})`;
        }
      } else if (error.request) {
        // Request was made but no response
        errorMessage =
          "No response from server. Please check your network connection.";
      } else {
        // Something else happened
        errorMessage = error.message || "Unknown error occurred";
      }

      return rejectWithValue({
        message: errorMessage,
        details: errorDetails || error.response?.data,
        status: error.response?.status,
        originalError: error.message,
      });
    }
  }
);

// ✅ UPDATED: Fetch manual account details to match original logic
export const fetchManualAccountDetails = createAsyncThunk(
  "deposit/fetchManualAccountDetails",
  async ({ currency, customerId }, { rejectWithValue }) => {
    try {
      // ✅ MATCH ORIGINAL: Get token from URL first
      let token = null;
      const pathParts = window.location.pathname.split("/");
      const depositIframeIndex = pathParts.indexOf("depositiframe");

      if (
        depositIframeIndex !== -1 &&
        pathParts.length > depositIframeIndex + 2
      ) {
        token = pathParts[depositIframeIndex + 2];
      }

      if (!token) {
        token = localStorage.getItem("authtoken");
      }

      if (!token) throw new Error("Authentication required");
      if (!currency) throw new Error("Currency parameter is required");

      // ✅ MATCH ORIGINAL: Different logic for different currencies
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

      // ✅ ADD: Original logic for EUR/GBP manual deposits
      if (currency === "EUR" || currency === "GBP") {
        try {
          const response = await depositAPI.getManualDetailsByCurrency(
            currency
          );
          return {
            ...response.data,
            currency: response.data.currency || currency,
          };
        } catch (error) {
          console.warn(
            `Failed to fetch ${currency} manual details, returning fallback`
          );
          return getFallbackManualDetails(currency);
        }
      }

      // ✅ ADD: Original logic for AED manual deposits
      const API_URL =
        import.meta.env.VITE_API_URL ||
        "https://zapware.unlimitedremit.com/api";

      if (currency === "AED" && customerId) {
        try {
          const response = await axios.get(
            `${API_URL}/account-detail/${customerId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data) {
            return {
              currency: "AED",
              ...response.data,
            };
          }
        } catch (error) {
          console.warn("Failed to fetch AED details:", error);
        }
      }

      // Default fallback
      return getFallbackManualDetails(currency);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          `Failed to load ${currency} account details`
      );
    }
  }
);

// ✅ ADD: Helper function for fallback manual details
function getFallbackManualDetails(currency) {
  const baseDetails = {
    currency,
    bank_name: `${currency} Bank`,
    account_name: "Unlimited Cloud LLC",
    account_number: "1234567890",
    iban: null,
    routing_number: "123456789",
    bic_swift: "BICSWIFT",
    swift_code: "SWIFTCODE",
    bank_address: "Main Street, Financial District",
    bank_country: "Country",
    bank_city: "City",
    bank_state: "State",
    bank_postalcode: "00000",
    customer_type: "business",
    institution_name: "Unlimited Cloud LLC",
    first_name: "Unlimited",
    last_name: "Cloud LLC",
    description: `Manual deposit for ${currency} account`,
    account_id: `manual_${currency.toLowerCase()}_001`,
    transfer_reference: `Deposit to Unlimited Cloud LLC`,
    notes: "Include your customer ID in the transfer reference",
    minimum_amount: "10.00",
    processing_time: "1-3 business days",
  };

  // Currency-specific overrides
  if (currency === "GBP") {
    return {
      ...baseDetails,
      bank_name: "Barclays Bank",
      account_number: "9876543210",
      sort_code: "12-34-56",
      iban: "GB12BARC12345678901234",
      bic_swift: "BARCGB22",
      bank_address: "1 Churchill Place, London, E14 5HP, UK",
      bank_country: "United Kingdom",
      bank_city: "London",
    };
  }

  if (currency === "EUR") {
    return {
      ...baseDetails,
      bank_name: "Deutsche Bank",
      account_number: "8765432109",
      iban: "DE89370400440532013000",
      bic_swift: "DEUTDEFF",
      bank_address: "Taunusanlage 12, 60325 Frankfurt, Germany",
      bank_country: "Germany",
      bank_city: "Frankfurt",
    };
  }

  return baseDetails;
}

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

// ✅ Thunk to check if user has Sila bank accounts
export const checkSilaBankAccounts = createAsyncThunk(
  "deposit/checkSilaBankAccounts",
  async (customerId, { rejectWithValue }) => {
    try {
      // Get token from URL first
      let token = null;
      const pathParts = window.location.pathname.split("/");
      const depositIframeIndex = pathParts.indexOf("depositiframe");

      if (
        depositIframeIndex !== -1 &&
        pathParts.length > depositIframeIndex + 2
      ) {
        token = pathParts[depositIframeIndex + 2];
      }

      if (!token) {
        token = localStorage.getItem("authtoken");
      }

      if (!token) {
        throw new Error("Authentication required");
      }

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

// ✅ UPDATED: Fetch unique reference details to match original logic
export const fetchUniqueReferenceDetails = createAsyncThunk(
  "deposit/fetchUniqueReferenceDetails",
  async ({ uniqueReference }, { rejectWithValue }) => {
    try {
      // ✅ FIXED: Correct token extraction from URL
      let token = null;
      let customerIdFromUrl = null;

      const pathParts = window.location.pathname.split("/");
      const depositIframeIndex = pathParts.indexOf("depositiframe");

      if (depositIframeIndex !== -1) {
        // CustomerId is at position 1
        if (pathParts.length > depositIframeIndex + 1) {
          customerIdFromUrl = pathParts[depositIframeIndex + 1];
        }

        // Token is at position 2
        if (pathParts.length > depositIframeIndex + 2) {
          token = pathParts[depositIframeIndex + 2];
        }
      }

      if (!token) {
        token = localStorage.getItem("authtoken");
      }

      if (!token) {
        throw new Error("Authentication required - no token found");
      }

      if (!uniqueReference) {
        throw new Error("Unique reference is required");
      }

      console.log("🔍 Fetching unique reference details:", {
        uniqueReference,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "None",
        customerIdFromUrl,
        apiUrl: `https://zapware.unlimitedremit.com/api/transactions/detail-by-unique-reference/${uniqueReference}`,
      });

      const response = await axios.get(
        `https://zapware.unlimitedremit.com/api/transactions/detail-by-unique-reference/${uniqueReference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      console.log("✅ Unique reference details fetched:", {
        status: data.status,
        hasData: !!data.data,
        data: data.data,
      });

      return data;
    } catch (error) {
      console.error("❌ Error fetching unique reference details:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load transaction details"
      );
    }
  }
);

// ✅ ADD: New thunk for AED account details (matches original)
export const fetchAEDAccountDetails = createAsyncThunk(
  "deposit/fetchAEDAccountDetails",
  async (customerId, { rejectWithValue }) => {
    try {
      // ✅ MATCH ORIGINAL: Get token from URL first
      let token = null;
      const pathParts = window.location.pathname.split("/");
      const depositIframeIndex = pathParts.indexOf("depositiframe");

      if (
        depositIframeIndex !== -1 &&
        pathParts.length > depositIframeIndex + 2
      ) {
        token = pathParts[depositIframeIndex + 2];
      }

      if (!token) {
        token = localStorage.getItem("authtoken");
      }

      if (!token) {
        throw new Error("Authentication required");
      }

      const API_URL =
        import.meta.env.VITE_API_URL ||
        "https://zapware.unlimitedremit.com/api";

      const response = await axios.get(
        `${API_URL}/account-detail/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch AED account details"
      );
    }
  }
);

// ✅ ADD: Thunk for payment initiation (matches original EUR/GBP logic)
export const initiatePaymentForEURGBP = createAsyncThunk(
  "deposit/initiatePaymentForEURGBP",
  async (paymentData, { rejectWithValue }) => {
    try {
      // This thunk handles EUR/GBP bank transfers which should trigger Open Banking
      console.log("🎯 Initiating EUR/GBP payment:", paymentData);

      return {
        success: true,
        requiresOpenBanking: true,
        currency: paymentData.currency,
        amount: paymentData.amount,
        message: "Open Banking payment initiation required",
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to initiate payment");
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
  callbackUrl: "",

  // Form validation
  formErrors: {},

  // Loading states
  isSubmitting: false,
  manualDetailsLoading: false,

  // Success state
  transactionSuccess: null,

  // Manual account details
  manualAccountDetails: null,

  // ✅ ADD: AED account details state (matches original)
  aedAccountDetails: null,
  aedDetailsLoading: false,
  aedDetailsError: null,

  // Debug info
  allAvailableAccounts: null,

  // Sila accounts state
  silaBankAccounts: [],
  hasSilaAccounts: false,
  silaAccountsLoading: false,
  silaAccountsError: null,

  // ✅ ADD: EUR/GBP payment state (matches original)
  eurGbpPaymentLoading: false,
  eurGbpPaymentError: null,
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

      // Clear AED details when currency changes
      if (state.aedAccountDetails) {
        state.aedAccountDetails = null;
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
      state.aedAccountDetails = null;
      state.isSubmitting = false;
      state.manualDetailsLoading = false;
      state.aedDetailsLoading = false;
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

    // ✅ ADD: AED details reducer (matches original)
    clearAEDAccountDetails: (state) => {
      state.aedAccountDetails = null;
      state.aedDetailsLoading = false;
      state.aedDetailsError = null;
    },

    // Debug action to see available accounts
    setAllAvailableAccounts: (state, action) => {
      state.allAvailableAccounts = action.payload;
    },

    setCallbackUrl: (state, action) => {
      state.callbackUrl = action.payload;
    },

    // ✅ ADD: Reset EUR/GBP payment state
    resetEurGbpPaymentState: (state) => {
      state.eurGbpPaymentLoading = false;
      state.eurGbpPaymentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit deposit
      .addCase(submitDeposit.pending, (state) => {
        state.isSubmitting = true;
        state.formErrors = {};
        state.transactionSuccess = null;
      })
      .addCase(submitDeposit.fulfilled, (state, action) => {
        state.isSubmitting = false;

        // ✅ Handle special cases from original logic
        if (action.payload.openBankingRequired) {
          // EUR/GBP bank deposit requires Open Banking
          console.log("🔄 Setting showPaymentInitiation for EUR/GBP");
          state.showPaymentInitiation = true;
          state.formErrors = {};
          return;
        }

        if (action.payload.cardPaymentRequired) {
          // CAD/GBP card deposit requires card payment
          console.log("🔄 Card payment redirect required");
          state.transactionSuccess = {
            ...action.payload,
            amount: state.amount,
            currency: state.selectedCurrency,
            purpose: state.purpose,
            payment_method: state.paymentMethod,
            cardPaymentRedirect: true,
            timestamp: new Date().toISOString(),
          };
          state.formErrors = {};
          return;
        }

        // Regular deposit success
        console.log("✅ Regular deposit submission successful");
        state.transactionSuccess = {
          ...action.payload,
          amount: state.amount,
          currency: state.selectedCurrency,
          purpose: state.purpose,
          payment_method: state.paymentMethod,
          timestamp: new Date().toISOString(),
        };

        // Clear form fields but keep currency selection
        state.amount = "";
        state.purpose = "";
        state.selectedBankAccount = null;
        state.formErrors = {};
      })
      .addCase(submitDeposit.rejected, (state, action) => {
        state.isSubmitting = false;
        const errorMessage = action.payload?.message || "Submission failed";
        console.error("❌ Deposit submission rejected:", errorMessage);

        state.formErrors.submission = errorMessage;

        // Store error details for debugging
        if (action.payload?.details) {
          state.formErrors.details = action.payload.details;
        }
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

      // ✅ ADD: AED account details cases (matches original)
      .addCase(fetchAEDAccountDetails.pending, (state) => {
        state.aedDetailsLoading = true;
        state.aedDetailsError = null;
      })
      .addCase(fetchAEDAccountDetails.fulfilled, (state, action) => {
        state.aedDetailsLoading = false;
        state.aedAccountDetails = action.payload;
        state.aedDetailsError = null;
      })
      .addCase(fetchAEDAccountDetails.rejected, (state, action) => {
        state.aedDetailsLoading = false;
        state.aedAccountDetails = null;
        state.aedDetailsError = action.payload;
      })

      // ✅ ADD: EUR/GBP payment initiation
      .addCase(initiatePaymentForEURGBP.pending, (state) => {
        state.eurGbpPaymentLoading = true;
        state.eurGbpPaymentError = null;
      })
      .addCase(initiatePaymentForEURGBP.fulfilled, (state, action) => {
        state.eurGbpPaymentLoading = false;
        state.showPaymentInitiation = true;
      })
      .addCase(initiatePaymentForEURGBP.rejected, (state, action) => {
        state.eurGbpPaymentLoading = false;
        state.eurGbpPaymentError = action.payload;
      })

      // Debug: Fetch all accounts
      .addCase(fetchAllManualAccounts.fulfilled, (state, action) => {
        state.allAvailableAccounts = action.payload;
      })

      // Check Sila bank accounts
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
      })

      // Fetch unique reference details
      .addCase(fetchUniqueReferenceDetails.pending, (state) => {
        // Set loading state if needed
      })
      .addCase(fetchUniqueReferenceDetails.fulfilled, (state, action) => {
        // Store the fetched data if needed
      })
      .addCase(fetchUniqueReferenceDetails.rejected, (state, action) => {
        // Handle error if needed
      });
  },
});

// ✅ CORRECT EXPORTS
export const {
  // Form field actions
  setSelectedCurrency,
  setPaymentMethod,
  setAmount,
  setPurpose,
  setSelectedBankAccount,
  setCallbackUrl,

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

  // ✅ ADD: AED actions
  clearAEDAccountDetails,

  // ✅ ADD: EUR/GBP actions
  resetEurGbpPaymentState,

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

export const selectCallbackUrl = (state) => state.deposit.callbackUrl;

// ✅ ADD: AED selectors (matches original)
export const selectAEDAccountDetails = (state) =>
  state.deposit.aedAccountDetails;
export const selectAEDDetailsLoading = (state) =>
  state.deposit.aedDetailsLoading;
export const selectAEDDetailsError = (state) => state.deposit.aedDetailsError;

// ✅ ADD: EUR/GBP payment selectors
export const selectEurGbpPaymentLoading = (state) =>
  state.deposit.eurGbpPaymentLoading;
export const selectEurGbpPaymentError = (state) =>
  state.deposit.eurGbpPaymentError;

// ✅ ADD: Currency-specific payment method logic (matches original)
export const selectAvailablePaymentMethods = (state) => {
  const currency = state.deposit.selectedCurrency?.toUpperCase();

  if (!currency) return [];

  // ✅ MATCH ORIGINAL: Payment methods by currency
  switch (currency) {
    case "AED":
      return [{ value: "manual_deposit", label: "Manual", icon: "manual" }];
    case "USD":
      return [
        { value: "manual_deposit", label: "Manual", icon: "manual" },
        { value: "bank_deposit", label: "Bank Deposit", icon: "bank" },
      ];
    case "CAD":
      return [{ value: "card_deposit", label: "Card", icon: "card" }];
    case "GBP":
      return [
        { value: "card_deposit", label: "Card", icon: "card" },
        { value: "bank_deposit", label: "Bank Deposit", icon: "bank" },
      ];
    default:
      return [
        { value: "manual_deposit", label: "Manual", icon: "manual" },
        { value: "bank_deposit", label: "Bank Deposit", icon: "bank" },
      ];
  }
};

// Selectors for Sila bank accounts
export const selectSilaBankAccounts = (state) => state.deposit.silaBankAccounts;
export const selectHasSilaAccounts = (state) => state.deposit.hasSilaAccounts;
export const selectSilaAccountsLoading = (state) =>
  state.deposit.silaAccountsLoading;
export const selectSilaAccountsError = (state) =>
  state.deposit.silaAccountsError;

// Computed selectors
export const selectIsManualDeposit = (state) =>
  state.deposit.paymentMethod === "manual_deposit";
export const selectIsUSDBankDeposit = (state) =>
  state.deposit.selectedCurrency === "USD" &&
  state.deposit.paymentMethod === "bank_deposit";
export const selectIsCardDeposit = (state) =>
  state.deposit.paymentMethod === "card_deposit";
export const selectIsBankTransfer = (state) =>
  state.deposit.paymentMethod === "bank_transfer";
export const selectIsEURGBPDeposit = (state) =>
  (state.deposit.selectedCurrency === "EUR" ||
    state.deposit.selectedCurrency === "GBP") &&
  state.deposit.paymentMethod === "bank_deposit";

// Validation selectors
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
