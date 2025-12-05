import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Async Thunks

export const fetchManualAccountDetails = createAsyncThunk(
  "remittance/fetchManualAccountDetails",
  async ({ bankId, currencyCode, amount, customerId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("bearertoken");

      // For USD currency, use hardcoded details instead of Sila API
      if (currencyCode === "USD") {
        // Hardcoded bank details as requested
        const hardcodedDetails = {
          status: 200,
          message: "Bank details fetched successfully",
          account_name: "Unlimited Cloud LLC",
          account_number: "518366536",
          bank_name: "Chase Bank",
          bank_address: "2790 Park Ave., New York, NY 10017, USA",
          routing_number: "021000021",
          swift_code: "CHASUS33",
          account_type: "Checking",
          beneficiary_address: {
            street: "2790 Park Ave.",
            postalCode: "10017",
            city: "New York",
            state: "NY",
            zipCode: "10017",
            country: "USA",
          },
        };

        console.log(
          "Using hardcoded manual account details for USD:",
          hardcodedDetails
        );
        return hardcodedDetails;
      } else {
        // For other currencies, use the original endpoint
        const response = await axios.get(
          `${API_URL}/manualaccount-detail/${bankId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      }
    } catch (error) {
      // If there's an error with other currencies, reject with value
      if (currencyCode !== "USD") {
        return rejectWithValue(error.response?.data || error.message);
      }

      // For USD, return the hardcoded details even if there's an error
      console.warn(
        "Error fetching manual details, using hardcoded fallback for USD"
      );
      const fallbackDetails = {
        status: 200,
        message: "Using fallback bank details",
        account_name: "Unlimited Cloud LLC",
        account_number: "518366536",
        bank_name: "Chase Bank",
        bank_address: "2790 Park Ave., New York, NY 10017, USA",
        routing_number: "021000021",
        swift_code: "CHASUS33",
        account_type: "Checking",
      };
      return fallbackDetails;
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

      // CRITICAL: Map to the actual field names from component
      const mappedData = {
        // Currency fields - DIRECT from transactionData
        from_currency: transactionData.from_currency,
        to_currency: transactionData.to_currency,

        // Amount fields
        send_amount: transactionData.send_amount,
        receive_amount: transactionData.receive_amount,
        exchange_rate: transactionData.exchange_rate,

        // Customer
        customer_id: transactionData.customer_id,

        // Payment info
        payment_method: transactionData.payment_method,
        conversion_id: transactionData.conversion_id,

        // Beneficiary fields - MUST BE PRESENT
        beneficiary: transactionData.beneficiary, // ← REQUIRED: beneficiary ID as string
        beneficiary_bank_id: transactionData.beneficiary_bank_id, // ← REQUIRED: bank ID

        // Optional beneficiary info
        beneficiary_name: transactionData.beneficiary_name,
        beneficiary_bank_name: transactionData.beneficiary_bank_name,
        beneficiary_account_number: transactionData.beneficiary_account_number,

        // Required flag
        is_remit: transactionData.is_remit || "Y",

        // Compliance fields
        purpose: transactionData.purpose,
        income_source: transactionData.income_source,
        occupation: transactionData.occupation,
        relation: transactionData.relation,
        payout_method: transactionData.payout_method,

        // Additional fields
        rails: transactionData.rails || "Local",
        sender_account_name: transactionData.sender_account_name,
        sender_bank_id: transactionData.sender_bank_id,

        // File/document
        file: transactionData.document || transactionData.file,
      };

      console.log("📤 Transaction data received by thunk:", transactionData);
      console.log("📤 Mapped data for API:", mappedData);

      // Append all non-null/undefined fields
      Object.keys(mappedData).forEach((key) => {
        const value = mappedData[key];
        if (value !== null && value !== undefined && value !== "") {
          if (key === "file" && value instanceof File) {
            formData.append("file", value, value.name);
          } else if (typeof value === "object" && value !== null) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      // Debug: Log what we're actually sending
      console.log("📤 Final FormData being sent:");
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const token = localStorage.getItem("bearertoken");
      const response = await axios.post(
        `${API_URL}/transactions/remittance-transaction`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );

      console.log("✅ API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Transaction error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

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
    income_source: null,
    occupation: "",
    relation: "",
    payout_method: null,
    document: null,
    agreeToTerms: false,
    promocode: "",
    description: "",
    senderBank: null,
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
    setSenderBank: (state, action) => {
      state.formData.senderBank = action.payload;
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
    setAgreeToTerms: (state, action) => {
      state.formData.agreeToTerms = action.payload;
    },

    // Beneficiary-related actions
    handleBeneficiaryCodeLookup: (state, action) => {
      // This is a placeholder - actual implementation would be in the component
    },

    handleBeneficiarySelect: (state, action) => {
      // This is a placeholder - actual implementation would be in the component
    },

    handleBankSelect: (state, action) => {
      // This is a placeholder - actual implementation would be in the component
    },

    resetForm: (state) => {
      state.step = 1;
      state.formData = {
        ...initialState.formData,
        sendCurrency: state.formData.sendCurrency,
        receiveCurrency: state.formData.receiveCurrency,
        senderBank: state.formData.senderBank,
      };
      state.transactionResult = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTransactionResult: (state) => {
      state.transactionResult = null;
    },
    clearPromoCodeValidation: (state) => {
      state.promoCodeValidation = null;
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
  setSenderBank,
  setDocument,
  setAgreeToTerms,
  resetForm,
  clearError,
  setPromoCode,
  setDescription,
  setManualAccountDetails,
  clearManualAccountDetails,
  clearVerification,
  clearTransactionResult,
  clearPromoCodeValidation,
  handleBeneficiaryCodeLookup,
  handleBeneficiarySelect,
  handleBankSelect,
} = remittanceSlice.actions;

// ===================== SELECTORS =====================

// Form data selectors
export const selectFormData = (state) => state.remittance.formData;

// Individual field selectors
export const selectSendAmount = (state) => state.remittance.formData.sendAmount;
export const selectReceiveAmount = (state) => state.remittance.formData.receiveAmount;
export const selectSendCurrency = (state) => state.remittance.formData.sendCurrency;
export const selectReceiveCurrency = (state) => state.remittance.formData.receiveCurrency;
export const selectPaymentMethod = (state) => state.remittance.formData.paymentMethod;
export const selectExchangeRate = (state) => state.remittance.formData.exchangeRate;
export const selectFee = (state) => state.remittance.formData.fee;
export const selectConversionId = (state) => state.remittance.formData.conversionId;
export const selectPurpose = (state) => state.remittance.formData.purpose;
export const selectIncomeSource = (state) => state.remittance.formData.income_source;
export const selectOccupation = (state) => state.remittance.formData.occupation;
export const selectRelation = (state) => state.remittance.formData.relation;
export const selectPayoutMethod = (state) => state.remittance.formData.payout_method;
export const selectDocument = (state) => state.remittance.formData.document;
export const selectAgreeToTerms = (state) => state.remittance.formData.agreeToTerms;
export const selectPromoCode = (state) => state.remittance.formData.promocode;
export const selectDescription = (state) => state.remittance.formData.description;
export const selectSenderBank = (state) => state.remittance.formData.senderBank;

// Other state selectors
export const selectStep = (state) => state.remittance.step;
export const selectCurrencies = (state) => state.remittance.currencies;
export const selectSendOptions = (state) => state.remittance.currencies.sendOptions;
export const selectReceiveOptions = (state) => state.remittance.currencies.receiveOptions;
export const selectBankAccounts = (state) => state.remittance.bankAccounts;
export const selectManualAccountDetails = (state) => state.remittance.manualAccountDetails;
export const selectPromoCodeValidation = (state) => state.remittance.promoCodeValidation;
export const selectVerification = (state) => state.remittance.verification;
export const selectLoading = (state) => state.remittance.loading;
export const selectError = (state) => state.remittance.error;
export const selectTransactionResult = (state) => state.remittance.transactionResult;
export const selectExchangeRateCache = (state) => state.remittance.exchangeRateCache;

// Derived/computed selectors
export const selectIsFormValid = (state) => {
  const form = state.remittance.formData;
  return Boolean(
    form.sendAmount &&
    form.receiveAmount &&
    form.sendCurrency &&
    form.receiveCurrency &&
    form.purpose &&
    form.income_source &&
    form.payout_method &&
    form.agreeToTerms
  );
};

export const selectTotalAmount = (state) => {
  const form = state.remittance.formData;
  const sendAmount = parseFloat(form.sendAmount) || 0;
  const fee = parseFloat(form.fee) || 0;
  return sendAmount + fee;
};

export const selectFormattedAmounts = (state) => {
  const form = state.remittance.formData;
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "";
    const str = typeof num === "string" ? num.replace(/,/g, "") : String(num);
    const cleaned = str.replace(/[^0-9.]/g, "");
    const number = parseFloat(cleaned);
    return isNaN(number) ? "" : number.toLocaleString("en-US");
  };

  return {
    formattedSendAmount: formatNumber(form.sendAmount),
    formattedReceiveAmount: formatNumber(form.receiveAmount),
  };
};

// Selector for Europe/UK transfer detection
export const selectIsEuropeUKTransfer = (state) => {
  const sendCurrency = state.remittance.formData.sendCurrency;
  return sendCurrency?.value === "GBP" || sendCurrency?.value === "EUR";
};

// Selector for sending currency symbol
export const selectSendCurrencySymbol = (state) => {
  const sendCurrency = state.remittance.formData.sendCurrency;
  if (!sendCurrency) return "";
  
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    NPR: "₨",
    KES: "KSh",
    INR: "₹",
    AED: "د.إ",
    NGN: "₦",
    BDT: "৳",
    LKR: "රු",
    AUD: "A$",
    PKR: "₨",
    DKK: "kr",
  };
  
  return symbols[sendCurrency.value] || sendCurrency.value;
};

// Selector for receiving currency symbol
export const selectReceiveCurrencySymbol = (state) => {
  const receiveCurrency = state.remittance.formData.receiveCurrency;
  if (!receiveCurrency) return "";
  
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    NPR: "₨",
    KES: "KSh",
    INR: "₹",
    AED: "د.إ",
    NGN: "₦",
    BDT: "৳",
    LKR: "රු",
    AUD: "A$",
    PKR: "₨",
    DKK: "kr",
  };
  
  return symbols[receiveCurrency.value] || receiveCurrency.value;
};

// Selector for formatted exchange rate display
export const selectExchangeRateDisplay = (state) => {
  const form = state.remittance.formData;
  if (!form.sendCurrency || !form.receiveCurrency || !form.exchangeRate) {
    return "Loading...";
  }
  
  return `${form.sendCurrency.value} 1 = ${form.receiveCurrency.value} ${form.exchangeRate.toFixed(4)}`;
};

// Loading states selectors
export const selectIsLoadingExchangeRate = (state) => 
  state.remittance.currencies.loading || state.remittance.loading;

export const selectIsSubmitting = (state) => 
  state.remittance.loading;

export const selectIsVerifying = (state) => 
  state.remittance.verification.loading;

export const selectIsVerificationSent = (state) => 
  state.remittance.verification.sent;

export const selectIsVerificationVerified = (state) => 
  state.remittance.verification.verified;

export const selectVerificationError = (state) => 
  state.remittance.verification.error;

// Combined loading state for initial data
export const selectInitialDataLoading = (state) => 
  state.remittance.currencies.loading || 
  state.remittance.loading;

// Selector for transaction summary
export const selectTransactionSummary = (state) => {
  const form = state.remittance.formData;
  return {
    sendAmount: form.sendAmount,
    receiveAmount: form.receiveAmount,
    sendCurrency: form.sendCurrency?.value,
    receiveCurrency: form.receiveCurrency?.value,
    exchangeRate: form.exchangeRate,
    fee: form.fee,
    totalAmount: (parseFloat(form.sendAmount) || 0) + (parseFloat(form.fee) || 0),
    paymentMethod: form.paymentMethod,
    purpose: form.purpose?.label,
    incomeSource: form.income_source?.label,
  };
};

// Selector for step navigation
export const selectCanProceedToNextStep = (state) => {
  const step = state.remittance.step;
  const form = state.remittance.formData;
  
  switch(step) {
    case 1:
      return Boolean(
        form.sendAmount && 
        form.receiveAmount && 
        form.sendCurrency && 
        form.receiveCurrency
      );
    case 2:
      return Boolean(
        form.purpose &&
        form.income_source &&
        form.payout_method
      );
    case 3:
      return form.agreeToTerms;
    default:
      return false;
  }
};

// Selector for formatted currency display
export const selectCurrencyDisplay = (state) => {
  const send = state.remittance.formData.sendCurrency;
  const receive = state.remittance.formData.receiveCurrency;
  
  return {
    send: send ? `${selectSendCurrencySymbol(state)} ${send.label}` : "",
    receive: receive ? `${selectReceiveCurrencySymbol(state)} ${receive.label}` : "",
  };
};

export default remittanceSlice.reducer;