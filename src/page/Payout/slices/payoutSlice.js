import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, {
  apiCoordinator,
} from "../../../services/api";
import { countries } from "../../../features/Auth/slices/countrySlice";
import axios from "axios";

// ===================== RETRY CONFIGURATION =====================
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 second

// ===================== REQUEST SIGNATURE HELPERS =====================
const getRequestSignature = (method, url, params = {}, data = {}) => {
  return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
};

// ===================== RETRY UTILITY =====================
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const executeWithRetry = async (
  apiCall,
  signature,
  maxRetries = MAX_RETRY_ATTEMPTS
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Clear previous cache for retry attempts
      if (attempt > 0) {
        apiCoordinator.clearSignature(signature);
        await delay(RETRY_DELAY * attempt); // Exponential backoff
      }

      if (apiCoordinator.isFetching(signature)) {
        throw new Error("Request already in progress");
      }

      apiCoordinator.setFetching(signature);
      const result = await apiCall();
      apiCoordinator.setCompleted(signature, result);
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry for certain error types
      if (
        error.response?.status === 400 ||
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        break;
      }

      // Don't retry if max attempts reached
      if (attempt === maxRetries) {
        break;
      }

      apiCoordinator.setFailed(signature);
    }
  }

  apiCoordinator.setFailed(signature);
  throw lastError;
};

// ===================== ENHANCED ASYNC THUNKS WITH AUTO-RETRY =====================
export const fetchDestinationCurrencies = createAsyncThunk(
  "payout/fetchDestinationCurrencies",
  async (_, { rejectWithValue }) => {
    const signature = getRequestSignature("GET", "/partner-payout-currencies");

    try {
      if (apiCoordinator.hasRecentData(signature)) {
        return apiCoordinator.getRecentData(signature);
      }

      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const isWhiteLabelled = localStorage.getItem("iswhitelabelledpartner");
        const partnerId =
          isWhiteLabelled === "1"
            ? localStorage.getItem("whitelabelledpartnerid")
            : "0";

        const response = await api.get(
          `/partner-payout-currencies/${partnerId}`,
          {
            headers: { Authorization: `Bearer ${bearertoken}` },
            timeout: 30000,
          }
        );

        return response.data.data;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      if (error.__isCachedResponse) {
        return error.response.data;
      }

      if (axios.isCancel(error)) {
        throw new Error("Request cancelled due to duplication");
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCustomerBankAccounts = createAsyncThunk(
  "payout/fetchCustomerBankAccounts",
  async (customerId, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "GET",
      `/active-approved-bank-accounts/${customerId}`
    );

    try {
      if (apiCoordinator.hasRecentData(signature)) {
        return apiCoordinator.getRecentData(signature);
      }

      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.get(
          `/active-approved-bank-accounts/${customerId}`,
          {
            headers: { Authorization: `Bearer ${bearertoken}` },
            timeout: 30000,
          }
        );

        return response.data.account_details;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      if (error.__isCachedResponse) {
        return error.response.data;
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBeneficiaryAccounts = createAsyncThunk(
  "payout/fetchBeneficiaryAccounts",
  async ({ customerId, currencyCode }, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "GET",
      `/beneficiaries/customer-view/${customerId}/${currencyCode}`
    );

    try {
      if (apiCoordinator.hasRecentData(signature)) {
        return apiCoordinator.getRecentData(signature);
      }

      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.get(
          `/beneficiaries/customer-view/${customerId}/${currencyCode}`,
          {
            headers: { Authorization: `Bearer ${bearertoken}` },
            timeout: 30000,
          }
        );

        return response.data.data;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      if (error.__isCachedResponse) {
        return error.response.data;
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBeneficiaryBanks = createAsyncThunk(
  "payout/fetchBeneficiaryBanks",
  async (
    { currency_code, beneficiaryId, payment_method },
    { rejectWithValue }
  ) => {
    let url = `/beneficiaries/benef-bank/${currency_code}/${beneficiaryId}`;
    if (currency_code === "USD" && payment_method) {
      url += `/${payment_method}`;
    }

    const signature = getRequestSignature("GET", url);

    try {
      if (apiCoordinator.hasRecentData(signature)) {
        return apiCoordinator.getRecentData(signature);
      }

      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.get(url, {
          headers: { Authorization: `Bearer ${bearertoken}` },
          timeout: 30000,
        });

        return response.data.bank_accounts;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      if (error.__isCachedResponse) {
        return error.response.data;
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCountries = createAsyncThunk(
  "payout/fetchCountries",
  async (_, { rejectWithValue }) => {
    try {
      return countries;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCurrenciesForCountry = createAsyncThunk(
  "payout/fetchCurrenciesForCountry",
  async (country_id, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "GET",
      `/currency-country/${country_id}`
    );

    try {
      if (apiCoordinator.hasRecentData(signature)) {
        return apiCoordinator.getRecentData(signature);
      }

      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.get(`/currency-country/${country_id}`, {
          headers: { Authorization: `Bearer ${bearertoken}` },
          timeout: 30000,
        });

        return response.data.data;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      if (error.__isCachedResponse) {
        return error.response.data;
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchServiceProvider = createAsyncThunk(
  "payout/fetchServiceProvider",
  async (currencyCode, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "GET",
      `/assigned-service-provider/${currencyCode}`
    );

    try {
      if (apiCoordinator.hasRecentData(signature)) {
        return apiCoordinator.getRecentData(signature);
      }

      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.get(
          `/assigned-service-provider/${currencyCode}`,
          {
            headers: { Authorization: `Bearer ${bearertoken}` },
            timeout: 30000,
          }
        );

        return response.data.service_provider_id;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      if (error.__isCachedResponse) {
        return error.response.data;
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBalance = createAsyncThunk(
  "payout/fetchBalance",
  async ({ customer_id, currency_code }, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "POST",
      "/get-balance",
      {},
      { customer_id, currency_code }
    );

    try {
      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.post(
          `/get-balance`,
          {
            customer_id,
            currency_code,
          },
          {
            headers: {
              Authorization: `Bearer ${bearertoken}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        return response.data.available_balance || "0.00";
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      if (error.__isCachedResponse) {
        return error.response.data;
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const convertCurrency = createAsyncThunk(
  "payout/convertCurrency",
  async (payload, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "POST",
      "/exchange-rates",
      {},
      payload
    );

    try {
      if (payload.from === payload.to) {
        const sameCurrencyResponse = {
          status: "Success",
          converted_value: payload.value,
          conversion_id: "same-currency-" + Date.now(),
          fxRate: 1,
          swiftOut: "0.00",
          payoutCharge: "0.00",
          toServiceProviderId: null,
        };
        return sameCurrencyResponse;
      }

      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.post(`/exchange-rates`, payload, {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        });

        if (response.data.status === "Success") {
          return response.data;
        } else {
          throw new Error(response.data.message);
        }
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Currency conversion failed. Please try again.";
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendPasscode = createAsyncThunk(
  "payout/sendPasscode",
  async (customerId, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "GET",
      `/send-passcode/${customerId}`,
      {},
      { context: 'payout_send' }
    );

    try {
      const apiCall = async () => {
        const response = await api.get(`/send-passcode/${customerId}`, {
          timeout: 30000,
          context: 'payout_send' // Add context
        });
        return response.data;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyPasscode = createAsyncThunk(
  "payout/verifyPasscode",
  async ({ customer_id, passcode, context = 'payout' }, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "POST",
      "/verify-passcode",
      {},
      { customer_id, passcode, context }
    );

    try {
      // Clear any existing verification requests first
      apiCoordinator.clearSignature(signature);
      
      const apiCall = async () => {
        console.log("🔐 Verifying passcode for payout:", { customer_id, context });
        
        const response = await api.post(
          `/verify-passcode`,
          {
            customer_id,
            passcode,
          },
          {
            timeout: 30000,
            // ✅ Add context to config so interceptor can use it
            context: context 
          }
        );

        console.log("✅ Payout passcode verification response:", response.data);
        return response.data;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      console.error("❌ Payout passcode verification failed:", error);
      
      // Always clear the signature on error to allow retry
      apiCoordinator.clearSignature(signature);
      
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Passcode verification failed. Please try again."
      );
    }
  }
);

export const submitPayout = createAsyncThunk(
  "payout/submitPayout",
  async (formData, { rejectWithValue }) => {
    const signature = getRequestSignature(
      "POST",
      "/payout/remit-payout",
      {},
      formData
    );

    try {
      const apiCall = async () => {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await api.post(`/payout/remit-payout`, formData, {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 45000,
        });
        return response.data;
      };

      return await executeWithRetry(apiCall, signature);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Payout submission failed. Please try again.";
      return rejectWithValue(errorMessage);
    }
  }
);

// ===================== INITIAL STATE =====================
const initialState = {
  // Form values
  formValues: {
    bank_id: "",
    customer_id: "",
    to: "",
    value: "0.00",
    from: "",
    benef_account: "",
    benef_bank_account: "",
    pay_mode: "",
    remarks: "",
    income_source: "",
    source_country: "",
    payment_method: "",
    destination_country: "",
    transfer_purpose: "",
    occupation: "",
    convertedValue: 0,
    transaction_type: "",
    promocode: "",
    purpose: "",
    description: "",
    country_id: "",
    invoice_file: null,
  },

  // Data collections
  customerBankAccounts: [],
  benefBankAccounts: [],
  beneficiaryBanks: [],
  destinationCurrencies: [],
  countries: [],
  currencies: [],

  // Rates and conversion
  convertedValue: null,
  convertedId: null,
  fxRate: 0,
  swiftRate: 0,
  payoutRate: 0,
  toServiceProvider: null,
  toServiceProviderInr: null,
  availableBalance: null,

  // UI state
  loading: false, // For transaction processing
  initialLoading: false, // For initial data loading
  benefLoading: false, // For beneficiary loading
  verifying: false, // For verification

  // Modals
  showModal: false,
  showSuccessModal: false,
  showErrorModal: false,
  showPasscodeModal: false,
  modalMessage: "",

  // Passcode
  passcode: "",

  // Recurring payments
  isRecurring: false,
  recurringFrequency: "",
  customDays: "",

  // Error state
  error: null,
};

// ===================== SLICE =====================
const payoutSlice = createSlice({
  name: "payout",
  initialState,
  reducers: {
    //loading actions
    setInitialLoading: (state, action) => {
      state.initialLoading = action.payload;
    },

    // Form value updates
    setFormValue: (state, action) => {
      const { name, value } = action.payload;
      state.formValues[name] = value;
    },

    setFormValues: (state, action) => {
      state.formValues = { ...state.formValues, ...action.payload };
    },

    setFileValue: (state, action) => {
      const { name, file } = action.payload;
      state.formValues[name] = file;
    },

    // UI state updates
    setShowModal: (state, action) => {
      state.showModal = action.payload;
    },

    setShowSuccessModal: (state, action) => {
      state.showSuccessModal = action.payload;
    },

    setShowErrorModal: (state, action) => {
      state.showErrorModal = action.payload;
    },

    setShowPasscodeModal: (state, action) => {
      state.showPasscodeModal = action.payload;
    },

    setModalMessage: (state, action) => {
      state.modalMessage = action.payload;
    },

    setPasscode: (state, action) => {
      state.passcode = action.payload;
    },

    setAvailableBalance: (state, action) => {
      state.availableBalance = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setBenefLoading: (state, action) => {
      state.benefLoading = action.payload;
    },

    setVerifying: (state, action) => {
      state.verifying = action.payload;
    },

    // Cache management
    // clearApiCache: (state, action) => {
    //   const pattern = action.payload;
    //   if (pattern) {
    //     forceRefreshEndpoint(pattern);
    //   } else {
    //     apiCoordinator.clear();
    //   }
    // },

    clearBeneficiaryCache: (state) => {
      apiCoordinator.clear("/beneficiaries");
      state.benefBankAccounts = [];
      state.beneficiaryBanks = [];
    },

    clearCurrencyCache: (state) => {
      apiCoordinator.clear("/currency");
      apiCoordinator.clear("/exchange-rates");
      state.currencies = [];
      state.convertedValue = null;
    },

    // Reset state
    resetPayoutState: (state) => {
      return {
        ...initialState,
        formValues: {
          ...initialState.formValues,
          customer_id: state.formValues.customer_id,
        },
      };
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Destination Currencies - Use initialLoading
      .addCase(fetchDestinationCurrencies.pending, (state) => {
        state.initialLoading = true;
      })
      .addCase(fetchDestinationCurrencies.fulfilled, (state, action) => {
        state.initialLoading = false;
        state.destinationCurrencies = action.payload;
      })
      .addCase(fetchDestinationCurrencies.rejected, (state, action) => {
        state.initialLoading = false;
        state.error = action.payload;
      })

      // Fetch Customer Bank Accounts
      .addCase(fetchCustomerBankAccounts.fulfilled, (state, action) => {
        state.customerBankAccounts = action.payload;
      })
      .addCase(fetchCustomerBankAccounts.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Fetch Beneficiary Accounts
      .addCase(fetchBeneficiaryAccounts.pending, (state) => {
        state.benefLoading = true;
      })
      .addCase(fetchBeneficiaryAccounts.fulfilled, (state, action) => {
        state.benefLoading = false;
        state.benefBankAccounts = action.payload;
      })
      .addCase(fetchBeneficiaryAccounts.rejected, (state, action) => {
        state.benefLoading = false;
        state.error = action.payload;
      })

      // Fetch Beneficiary Banks
      .addCase(fetchBeneficiaryBanks.pending, (state) => {
        state.benefLoading = true;
      })
      .addCase(fetchBeneficiaryBanks.fulfilled, (state, action) => {
        state.benefLoading = false;
        state.beneficiaryBanks = action.payload;
      })
      .addCase(fetchBeneficiaryBanks.rejected, (state, action) => {
        state.benefLoading = false;
        state.error = action.payload;
      })

      // Fetch Countries - Use initialLoading
      .addCase(fetchCountries.pending, (state) => {
        state.initialLoading = true;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.initialLoading = false;
        state.countries = action.payload;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.initialLoading = false;
        state.error = action.payload;
      })

      // Fetch Currencies for Country
      .addCase(fetchCurrenciesForCountry.fulfilled, (state, action) => {
        state.currencies = action.payload;
      })

      // Fetch Service Provider
      .addCase(fetchServiceProvider.fulfilled, (state, action) => {
        state.toServiceProviderInr = action.payload;
      })

      // Fetch Balance
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.availableBalance = action.payload;
      })

      // Convert Currency
      .addCase(convertCurrency.pending, (state) => {
        state.loading = true;
      })
      .addCase(convertCurrency.fulfilled, (state, action) => {
        state.loading = false;
        state.convertedValue = parseFloat(action.payload.converted_value) || 0;
        state.convertedId = action.payload.conversion_id;
        state.fxRate = action.payload.fxRate || null;
        state.swiftRate = action.payload.swiftOut || null;
        state.payoutRate = action.payload.payoutCharge || null;
        state.toServiceProvider = action.payload.toServiceProviderId || null;
        state.showModal = true;
      })
      .addCase(convertCurrency.rejected, (state, action) => {
        state.loading = false;
        state.modalMessage = action.payload;
        state.showErrorModal = true;
      })

      // Send Passcode
      .addCase(sendPasscode.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendPasscode.fulfilled, (state) => {
        state.loading = false;
        state.showPasscodeModal = true;
      })
      .addCase(sendPasscode.rejected, (state, action) => {
        state.loading = false;
        state.modalMessage = action.payload;
        state.showErrorModal = true;
      })

      // Verify Passcode
      .addCase(verifyPasscode.pending, (state) => {
        state.verifying = true;
      })
      .addCase(verifyPasscode.fulfilled, (state, action) => {
        state.verifying = false;
        if (action.payload.Status === "success") {
          state.showPasscodeModal = false;
        } else {
          state.modalMessage = "Invalid Passcode";
          state.showErrorModal = true;
        }
      })
      .addCase(verifyPasscode.rejected, (state, action) => {
        state.verifying = false;
        state.modalMessage = action.payload;
        state.showErrorModal = true;
      })

      // Submit Payout
      .addCase(submitPayout.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitPayout.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "Success") {
          state.showModal = false;
          state.modalMessage = "Payout initiated successfully!";
          state.showSuccessModal = true;
          apiCoordinator.clear("/get-balance");
        } else {
          state.modalMessage = action.payload.message;
          state.showErrorModal = true;
        }
      })
      .addCase(submitPayout.rejected, (state, action) => {
        state.loading = false;
        state.modalMessage = action.payload;
        state.showErrorModal = true;
      });
  },
});

// ===================== SELECTORS =====================
export const selectPayout = (state) => state.payout;
export const selectFormValues = (state) => state.payout.formValues;
export const selectCustomerBankAccounts = (state) =>
  state.payout.customerBankAccounts;
export const selectBenefBankAccounts = (state) =>
  state.payout.benefBankAccounts;
export const selectBeneficiaryBanks = (state) => state.payout.beneficiaryBanks;
export const selectDestinationCurrencies = (state) =>
  state.payout.destinationCurrencies;
export const selectCountries = (state) => state.payout.countries;
export const selectCurrencies = (state) => state.payout.currencies;
export const selectConversionData = (state) => ({
  convertedValue: state.payout.convertedValue,
  convertedId: state.payout.convertedId,
  fxRate: state.payout.fxRate,
  swiftRate: state.payout.swiftRate,
  payoutRate: state.payout.payoutRate,
  toServiceProvider: state.payout.toServiceProvider,
});
export const selectAvailableBalance = (state) => state.payout.availableBalance;
export const selectLoading = (state) => state.payout.loading;
export const selectBenefLoading = (state) => state.payout.benefLoading;
export const selectVerifying = (state) => state.payout.verifying;
export const selectModalStates = (state) => ({
  showModal: state.payout.showModal,
  showSuccessModal: state.payout.showSuccessModal,
  showErrorModal: state.payout.showErrorModal,
  showPasscodeModal: state.payout.showPasscodeModal,
});
export const selectModalMessage = (state) => state.payout.modalMessage;
export const selectPasscode = (state) => state.payout.passcode;
export const selectError = (state) => state.payout.error;
export const selectServiceProviderInr = (state) =>
  state.payout.toServiceProviderInr;
export const selectInitialLoading = (state) => state.payout.initialLoading;

// ===================== ACTIONS =====================
export const {
  setFormValue,
  setFormValues,
  setFileValue,
  setShowModal,
  setShowSuccessModal,
  setShowErrorModal,
  setShowPasscodeModal,
  setModalMessage,
  setPasscode,
  setAvailableBalance,
  setLoading,
  setBenefLoading,
  setVerifying,
  clearApiCache,
  clearBeneficiaryCache,
  clearCurrencyCache,
  resetPayoutState,
  clearError,
} = payoutSlice.actions;

export default payoutSlice.reducer;