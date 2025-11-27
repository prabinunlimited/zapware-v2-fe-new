import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";
import { countries } from "../../../features/Auth/slices/countrySlice";

// ===================== ASYNC THUNKS =====================
export const fetchDestinationCurrencies = createAsyncThunk(
  "payout/fetchDestinationCurrencies",
  async (_, { rejectWithValue, getState }) => {
    try {
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
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCustomerBankAccounts = createAsyncThunk(
  "payout/fetchCustomerBankAccounts",
  async (customerId, { rejectWithValue }) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");
      const response = await api.get(
        `/active-approved-bank-accounts/${customerId}`,
        {
          headers: { Authorization: `Bearer ${bearertoken}` },
        }
      );

      return response.data.account_details;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBeneficiaryAccounts = createAsyncThunk(
  "payout/fetchBeneficiaryAccounts",
  async ({ customerId, currencyCode }, { rejectWithValue }) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");
      const response = await api.get(
        `/beneficiaries/customer-view/${customerId}/${currencyCode}`,
        {
          headers: { Authorization: `Bearer ${bearertoken}` },
        }
      );

      return response.data.data;
    } catch (error) {
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
    try {
      const bearertoken = localStorage.getItem("bearertoken");
      let url = `/beneficiaries/benef-bank/${currency_code}/${beneficiaryId}`;

      if (currency_code === "USD" && payment_method) {
        url += `/${payment_method}`;
      }

      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${bearertoken}` },
      });

      return response.data.bank_accounts;
    } catch (error) {
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
    try {
      const bearertoken = localStorage.getItem("bearertoken");
      const response = await api.get(`/currency-country/${country_id}`, {
        headers: { Authorization: `Bearer ${bearertoken}` },
      });

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchServiceProvider = createAsyncThunk(
  "payout/fetchServiceProvider",
  async (currencyCode, { rejectWithValue }) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");
      const response = await api.get(
        `/assigned-service-provider/${currencyCode}`,
        {
          headers: { Authorization: `Bearer ${bearertoken}` },
        }
      );

      return response.data.service_provider_id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBalance = createAsyncThunk(
  "payout/fetchBalance",
  async ({ customer_id, currency_code }, { rejectWithValue }) => {
    try {
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
        }
      );

      return response.data.available_balance || "0.00";
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const convertCurrency = createAsyncThunk(
  "payout/convertCurrency",
  async (payload, { rejectWithValue }) => {
    try {
      // For same currency conversions, you might need different logic
      if (payload.from === payload.to) {
        // Handle same currency conversion - no FX rate needed
        const sameCurrencyResponse = {
          status: "Success",
          converted_value: payload.value, // Same amount
          conversion_id: "same-currency-" + Date.now(),
          // fxRate might be 1 or not included
          fxRate: 1,
          swiftOut: "0.00",
          payoutCharge: "0.00",
          toServiceProviderId: null,
        };
        return sameCurrencyResponse;
      }

      const bearertoken = localStorage.getItem("bearertoken");
      const response = await api.post(`/exchange-rates`, payload, {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "Success") {
        return response.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendPasscode = createAsyncThunk(
  "payout/sendPasscode",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/send-passcode/${customerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyPasscode = createAsyncThunk(
  "payout/verifyPasscode",
  async ({ customer_id, passcode }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/verify-passcode`, {
        customer_id,
        passcode,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const submitPayout = createAsyncThunk(
  "payout/submitPayout",
  async (formData, { rejectWithValue }) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");
      const response = await api.post(`/payout/remit-payout`, formData, {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
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
  loading: false,
  benefLoading: false,
  verifying: false,

  // Modals
  showModal: false,
  showSuccessModal: false,
  showErrorModal: false,
  showPasscodeModal: false,
  modalMessage: "",

  // Passcode
  passcode: "",

  // Recurring payments (commented out in original)
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

    // Reset state
    resetPayoutState: () => initialState,

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Destination Currencies
      .addCase(fetchDestinationCurrencies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDestinationCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.destinationCurrencies = action.payload;
      })
      .addCase(fetchDestinationCurrencies.rejected, (state, action) => {
        state.loading = false;
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

      // Fetch Countries
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.countries = action.payload;
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
  resetPayoutState,
  clearError,
} = payoutSlice.actions;

export default payoutSlice.reducer;
