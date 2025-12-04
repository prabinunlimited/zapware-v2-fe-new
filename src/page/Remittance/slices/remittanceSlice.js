import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import {
  fetchBeneficiaryByCode,
  fetchBeneficiaryBanks,
  setSelectedBeneficiary,
  setSelectedBank,
} from "../../Beneficiary/MyBeneficiaries/BeneficiariesSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Async Thunks

export const fetchManualAccountDetails = createAsyncThunk(
  "remittance/fetchManualAccountDetails",
  async ({ bankId, currencyCode, amount, customerId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("bearertoken");

      // For USD currency, use Sila endpoint
      if (currencyCode === "USD") {
        const formData = new FormData();
        formData.append("currency", "USD");
        formData.append("amount", amount || "0");
        formData.append("customerId", parseInt(customerId));

        const response = await axios.post(
          `${API_URL}/sila/manual-sila-bankdetails`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      } else {
        // For other currencies
        const response = await axios.get(
          `${API_URL}/manualaccount-detail/${bankId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const validatePromoCode = createAsyncThunk(
  "remittance/validatePromoCode",
  async ({ customerId, promocode, amount }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/validate-promocode/${customerId}/${promocode}/${amount}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bearertoken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendVerificationCode = createAsyncThunk(
  "remittance/sendVerificationCode",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/send-passcode/${customerId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyPasscode = createAsyncThunk(
  "remittance/verifyPasscode",
  async ({ customerId, passcode }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/verify-passcode`, {
        customer_id: customerId,
        passcode: passcode,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchExchangeRate = createAsyncThunk(
  "remittance/fetchExchangeRate",
  async (
    { fromCurrency, toCurrency, amount, bankId, customerId },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/exchange-rates`, {
        bank_id: bankId,
        customer_id: parseInt(customerId),
        value: amount,
        from: fromCurrency,
        to: toCurrency,
        is_remit: "Y",
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchBankAccounts = createAsyncThunk(
  "remittance/fetchBankAccounts",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/bank-account-details/${customerId}`
      );
      return response.data?.account_details || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPayoutCurrencies = createAsyncThunk(
  "remittance/fetchPayoutCurrencies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/payout-currencies`);
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitTransaction = createAsyncThunk(
  "remittance/submitTransaction",
  async (transactionData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.entries(transactionData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      const response = await axios.post(
        `${API_URL}/transactions/remittance-transaction`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("bearertoken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  step: 1,
  formData: {
    sendAmount: "",
    receiveAmount: "",
    sendCurrency: null,
    receiveCurrency: null,
    paymentMethod: "bank",
    exchangeRate: 0,
    fee: 0,
    conversionId: null,
    purpose: null,
    incomeSource: null,
    occupation: "",
    relation: "",
    payout_method: null,
    document: null,
    agreeToTerms: false,
    promocode: "",
    description: "",
  },
  currencies: {
    sendOptions: [],
    receiveOptions: [],
    loading: false,
  },
  bankAccounts: [],
  manualAccountDetails: null,
  promoCodeValidation: null,
  verification: {
    loading: false,
    sent: false,
    verified: false,
    error: null,
  },
  loading: false,
  error: null,
  transactionResult: null,
  exchangeRateCache: {},
};

const remittanceSlice = createSlice({
  name: "remittance",
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.step = action.payload;
    },
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    setSendAmount: (state, action) => {
      state.formData.sendAmount = action.payload;
    },
    setReceiveAmount: (state, action) => {
      state.formData.receiveAmount = action.payload;
    },
    setSendCurrency: (state, action) => {
      state.formData.sendCurrency = action.payload;
    },
    setReceiveCurrency: (state, action) => {
      state.formData.receiveCurrency = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.formData.paymentMethod = action.payload;
    },
    setPromoCode: (state, action) => {
      state.formData.promocode = action.payload;
    },
    setDescription: (state, action) => {
      state.formData.description = action.payload;
    },
    setManualAccountDetails: (state, action) => {
      state.manualAccountDetails = action.payload;
    },
    clearManualAccountDetails: (state) => {
      state.manualAccountDetails = null;
    },
    clearVerification: (state) => {
      state.verification = initialState.verification;
    },
    setDocument: (state, action) => {
      state.formData.document = action.payload;
    },

    // Beneficiary-related actions
    handleBeneficiaryCodeLookup: (state, action) => {
      // This is a placeholder - actual implementation would be in the component
      // where dispatch(fetchBeneficiaryByCode(beneficiaryCode)) is called
    },

    handleBeneficiarySelect: (state, action) => {
      // This is a placeholder - actual implementation would be in the component
      // where dispatch(setSelectedBeneficiary(beneficiary)) is called
      // and dispatch(fetchBeneficiaryBanks(beneficiary.id)) is called
    },

    handleBankSelect: (state, action) => {
      // This is a placeholder - actual implementation would be in the component
      // where dispatch(setSelectedBank(bank)) is called
    },

    resetForm: (state) => {
      state.step = 1;
      state.formData = {
        ...initialState.formData,
        sendCurrency: state.formData.sendCurrency,
        receiveCurrency: state.formData.receiveCurrency,
      };
      state.transactionResult = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch exchange rate
      .addCase(fetchExchangeRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExchangeRate.fulfilled, (state, action) => {
        state.loading = false;
        state.formData.exchangeRate = parseFloat(action.payload.fxRate);
        state.formData.fee = parseFloat(action.payload.fee) || 0;
        state.formData.conversionId = action.payload.conversion_id;

        // Cache the rate
        const cacheKey = `${state.formData.sendCurrency?.value}-${state.formData.receiveCurrency?.value}`;
        state.exchangeRateCache[cacheKey] = {
          rate: parseFloat(action.payload.fxRate),
          fee: parseFloat(action.payload.fee) || 0,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        };
      })
      .addCase(fetchExchangeRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch exchange rate";
      })

      // Fetch bank accounts
      .addCase(fetchBankAccounts.pending, (state) => {
        state.currencies.loading = true;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.bankAccounts = action.payload;
        state.currencies.loading = false;

        // Set default send currency
        if (action.payload.length > 0 && !state.formData.sendCurrency) {
          const defaultCurrency =
            action.payload.find((acc) => acc.currency_code === "USD") ||
            action.payload[0];
          state.formData.sendCurrency = {
            value: defaultCurrency.currency_code,
            label: defaultCurrency.currency_code,
            bank_id: defaultCurrency.id,
          };
        }
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.currencies.loading = false;
        state.error = action.payload || "Failed to fetch bank accounts";
      })

      // Fetch manual account details
      .addCase(fetchManualAccountDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchManualAccountDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.manualAccountDetails = action.payload;
      })
      .addCase(fetchManualAccountDetails.rejected, (state, action) => {
        state.loading = false;
        state.manualAccountDetails = null;
        state.error =
          action.payload || "Failed to fetch manual account details";
      })

      // Validate promo code
      .addCase(validatePromoCode.pending, (state) => {
        state.loading = true;
      })
      .addCase(validatePromoCode.fulfilled, (state, action) => {
        state.loading = false;
        state.promoCodeValidation = action.payload;
      })
      .addCase(validatePromoCode.rejected, (state, action) => {
        state.loading = false;
        state.promoCodeValidation = null;
        state.error = action.payload || "Invalid promo code";
      })

      // Send verification code
      .addCase(sendVerificationCode.pending, (state) => {
        state.verification.loading = true;
        state.verification.error = null;
      })
      .addCase(sendVerificationCode.fulfilled, (state) => {
        state.verification.loading = false;
        state.verification.sent = true;
      })
      .addCase(sendVerificationCode.rejected, (state, action) => {
        state.verification.loading = false;
        state.verification.error =
          action.payload || "Failed to send verification code";
      })

      // Verify passcode
      .addCase(verifyPasscode.pending, (state) => {
        state.verification.loading = true;
        state.verification.error = null;
      })
      .addCase(verifyPasscode.fulfilled, (state, action) => {
        state.verification.loading = false;
        state.verification.verified = action.payload.Status === "success";
        state.verification.error =
          action.payload.Status !== "success" ? "Invalid passcode" : null;
      })
      .addCase(verifyPasscode.rejected, (state, action) => {
        state.verification.loading = false;
        state.verification.error = action.payload || "Verification failed";
      })

      // Fetch payout currencies
      .addCase(fetchPayoutCurrencies.fulfilled, (state, action) => {
        state.currencies.receiveOptions = action.payload.map((currency) => ({
          value: currency.currency_code,
          label: currency.currency_code,
          symbol: currency.icon || currency.currency_code,
        }));

        // Set default receive currency to KES if available
        if (!state.formData.receiveCurrency) {
          const kesCurrency = action.payload.find(
            (c) => c.currency_code === "KES"
          );
          if (kesCurrency) {
            state.formData.receiveCurrency = {
              value: "KES",
              label: "KES",
              symbol: kesCurrency.icon || "KES",
            };
          }
        }
      })

      // Submit transaction
      .addCase(submitTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactionResult = action.payload;
        state.step = 4; // Move to success step
      })
      .addCase(submitTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Transaction failed";
      });
  },
});

export const {
  setStep,
  setFormField,
  setSendAmount,
  setReceiveAmount,
  setSendCurrency,
  setReceiveCurrency,
  setPaymentMethod,
  setDocument,
  resetForm,
  clearError,
  setPromoCode,
  setDescription,
  setManualAccountDetails,
  clearManualAccountDetails,
  clearVerification,
  handleBeneficiaryCodeLookup,
  handleBeneficiarySelect,
  handleBankSelect,
} = remittanceSlice.actions;

export default remittanceSlice.reducer;
