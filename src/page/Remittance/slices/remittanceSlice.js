import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Debug function
const debugEverything = () => {
  console.log("🔍 === DEBUG EVERYTHING ===");
  console.log("API_URL:", API_URL);
  console.log("LocalStorage contents:");

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      console.log(
        `${key}:`,
        value?.substring(0, 100) + (value?.length > 100 ? "..." : ""),
      );
    } catch (e) {
      console.log(`${key}: [Cannot read]`);
    }
  });

  console.log("=== END DEBUG ===\n");
};

// Async Thunks
export const fetchManualAccountDetails = createAsyncThunk(
  "remittance/fetchManualAccountDetails",
  async (
    { bankId, currencyCode, amount, customerId },
    { rejectWithValue, getState },
  ) => {
    try {
      const token = localStorage.getItem("bearertoken");

      const state = getState();
      const bankAccount = state.remittance.bankAccounts.find(
        (acc) =>
          acc.id === bankId ||
          (acc.is_remittance_only && acc.currency_code === currencyCode),
      );

      const isRemittanceOnly = bankAccount?.is_remittance_only || false;

      console.log("🔍 Fetching manual details:", {
        bankId,
        currencyCode,
        isRemittanceOnly,
        bankAccount,
      });

      if (currencyCode === "USD" || isRemittanceOnly) {
        console.log("Using hardcoded/remittance-only manual account details");

        const hardcodedDetails = {
          status: 200,
          message: "Bank details fetched successfully",
          account_name: isRemittanceOnly
            ? "Remittance Service Account"
            : "Unlimited Cloud LLC",
          account_number: isRemittanceOnly
            ? "REMITTANCE-ACCT-001"
            : "518366536",
          bank_name: isRemittanceOnly
            ? "Remittance Processing Bank"
            : "Chase Bank",
          bank_address: isRemittanceOnly
            ? "Remittance Processing Center"
            : "2790 Park Ave., New York, NY 10017, USA",
          routing_number: isRemittanceOnly ? "REMIT001" : "021000021",
          swift_code: isRemittanceOnly ? "REMITTUS33" : "CHASUS33",
          account_type: "Checking",
          is_remittance_only: isRemittanceOnly,
          beneficiary_address: {
            street: "2790 Park Ave.",
            postalCode: "10017",
            city: "New York",
            state: "NY",
            zipCode: "10017",
            country: "USA",
          },
        };

        return hardcodedDetails;
      } else {
        const response = await axios.get(
          `${API_URL}/manualaccount-detail/${bankId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        return {
          ...response.data,
          is_remittance_only: false,
        };
      }
    } catch (error) {
      if (currencyCode !== "USD") {
        return rejectWithValue(error.response?.data || error.message);
      }

      console.warn("Error fetching manual details, using fallback");
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
        is_remittance_only: false,
      };
      return fallbackDetails;
    }
  },
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
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const sendVerificationCode = createAsyncThunk(
  "remittance/sendVerificationCode",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/send-passcode/${customerId}`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
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
  },
);

export const fetchExchangeRate = createAsyncThunk(
  "remittance/fetchExchangeRate",
  async (
    { fromCurrency, toCurrency, amount, bankId, customerId },
    { rejectWithValue },
  ) => {
    try {
      debugEverything();

      console.log("🔍 START - Fetching exchange rate");
      console.log("Parameters:", {
        fromCurrency,
        toCurrency,
        amount,
        bankId,
        customerId,
      });

      const isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer",
      );
      console.log(
        "🔍 Customer type from localStorage:",
        isRemittanceOnlyCustomer,
      );

      const token = localStorage.getItem("bearertoken");
      if (!token) {
        console.error("❌ No auth token!");
        return rejectWithValue("Authentication required");
      }

      let response;

      // REMITTANCE-ONLY CUSTOMER
      if (isRemittanceOnlyCustomer === "Y") {
        console.log("🚨 REMITTANCE CUSTOMER - Using special API");

        const remittancePayload = {
          value: parseFloat(amount),
          from: fromCurrency,
          to: toCurrency,
          customer_id: parseInt(customerId),
          bank_id: bankId,
          transaction_type: "remittance",
        };

        console.log("📦 Calling: /convert/remittance-conversion");
        console.log("Payload:", remittancePayload);

        response = await axios.post(
          `${API_URL}/convert/remittance-conversion`,
          remittancePayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log("✅ Remittance API response:", response.data);

        const responseData = response.data?.data || response.data || {};

        return {
          fxRate: responseData.fxRate || responseData.exchange_rate || 115,
          fee: responseData.payoutCharge || responseData.fee || 0,
          converted_value:
            responseData.converted_value ||
            responseData.converted_amount ||
            (parseFloat(amount) * (responseData.fxRate || 115)).toFixed(2),
          conversion_id:
            responseData.conversion_id ||
            responseData.id ||
            `remit-${Date.now()}`,
          is_remittance_only: true,
          message: "Remittance conversion successful",
          fxQuote: responseData.fxQuote,
          swiftOut: responseData.swiftOut,
          toServiceProviderId: responseData.toServiceProviderId,
        };
      }
      // REGULAR CUSTOMER
      else {
        console.log("✅ REGULAR CUSTOMER - Using regular API");

        const regularPayload = {
          value: amount,
          from: fromCurrency,
          to: toCurrency,
          customer_id: parseInt(customerId),
          is_remit: "Y",
        };

        if (bankId) {
          regularPayload.bank_id = bankId;
        }

        console.log("📦 Calling: /exchange-rates");
        console.log("Payload:", regularPayload);

        response = await axios.post(
          `${API_URL}/exchange-rates`,
          regularPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log("✅ Regular API response:", response.data);

        const responseData = response.data;

        const fxRate =
          responseData.fxRate ||
          responseData.converted_value / parseFloat(amount) ||
          115;

        return {
          ...responseData,
          fxRate: fxRate,
          converted_value:
            responseData.converted_value ||
            (parseFloat(amount) * fxRate).toFixed(2),
          is_remittance_only: false,
        };
      }
    } catch (error) {
      console.error("❌ Exchange rate error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const fallbackData = {
        fxRate: 115,
        fee: 0,
        converted_value: (parseFloat(amount) * 115).toFixed(2),
        conversion_id: `fallback-${Date.now()}`,
        is_remittance_only:
          localStorage.getItem("isRemittanceOnlyCustomer") === "Y",
        is_fallback: true,
        error_message: error.message,
      };

      console.log("🔄 Returning fallback data:", fallbackData);
      return fallbackData;
    }
  },
);

export const fetchBankAccounts = createAsyncThunk(
  "remittance/fetchBankAccounts",
  async (customerId, { rejectWithValue }) => {
    try {
      console.log("🔍 DEBUG - Starting fetchBankAccounts");
      console.log("Customer ID:", customerId);

      const token = localStorage.getItem("bearertoken");
      if (!token) {
        console.error("No auth token found");
        return rejectWithValue("Authentication required");
      }

      console.log("✅ Using bank-account-details API");

      const response = await axios.get(
        `${API_URL}/bank-account-details/${customerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("📦 Bank accounts API Response:", response.data);

      const accounts = response.data?.account_details || [];

      return accounts.map((account) => ({
        ...account,
        is_remittance_only: false,
      }));
    } catch (error) {
      console.error("❌ Error fetching bank accounts:", error);

      console.warn("Using fallback bank accounts");
      return [
        {
          id: "fallback-usd",
          currency_code: "USD",
          currency_name: "US Dollar",
          icon: "$",
          bank_name: "Chase Bank",
          account_number: "518366536",
          account_name: "Unlimited Cloud LLC",
          is_remittance_only: false,
        },
        {
          id: "fallback-gbp",
          currency_code: "GBP",
          currency_name: "British Pound",
          icon: "£",
          bank_name: "Barclays Bank",
          account_number: "GBP-ACCT-001",
          account_name: "Unlimited Cloud LLC",
          is_remittance_only: false,
        },
        {
          id: "fallback-eur",
          currency_code: "EUR",
          currency_name: "Euro",
          icon: "€",
          bank_name: "Deutsche Bank",
          account_number: "EUR-ACCT-001",
          account_name: "Unlimited Cloud LLC",
          is_remittance_only: false,
        },
      ];
    }
  },
);

export const fetchPayoutCurrencies = createAsyncThunk(
  "remittance/fetchPayoutCurrencies",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("bearertoken");
      
      // Try multiple possible keys for the partner ID
      const partnerId = localStorage.getItem("partner_id") || 
                       localStorage.getItem("whitelabelledpartnerid") ||
                       localStorage.getItem("whitelabelled_partner_id");
      
      const isWhitelabelled = localStorage.getItem("iswhitelabelledpartner") === "Y" ||
                              localStorage.getItem("whitelabelled_customer_partnername") !== null;
      
      console.log("🔍 FetchPayoutCurrencies called");
      console.log("📦 partner_id from localStorage:", partnerId);
      console.log("🏷️ isWhitelabelled:", isWhitelabelled);
      console.log("🔑 Token exists:", !!token);
      
      if (!token) {
        console.error("❌ No auth token found!");
        return rejectWithValue("Authentication required");
      }
      
      let response;
      
      // Use the partner ID if available
      if (partnerId && partnerId !== "null" && partnerId !== "undefined") {
        console.log(`🎯 Calling partner-payout-currencies endpoint for partner_id: ${partnerId}`);
        console.log(`📍 URL: ${API_URL}/partner-payout-currencies/${partnerId}`);
        
        response = await axios.get(
          `${API_URL}/partner-payout-currencies/${partnerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        console.log("📦 No partner_id found, using default payout-currencies endpoint");
        response = await axios.get(
          `${API_URL}/payout-currencies`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      
      console.log("✅ Payout currencies response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching payout currencies:", error);
      console.log("📦 Returning fallback payout currencies data");
      
      // Return fallback data with the 3 currencies we expect
      return {
        data: [
          {
            payout_currency_id: 105,
            currency_code: "NPR",
            icon: "₹",
            default_remittance: "N"
          },
          {
            payout_currency_id: 64,
            currency_code: "INR",
            icon: "₹",
            default_remittance: "Y"
          },
          {
            payout_currency_id: 49,
            currency_code: "GBP",
            icon: "£",
            default_remittance: "N"
          }
        ]
      };
    }
  },
);

export const submitTransaction = createAsyncThunk(
  "remittance/submitTransaction",
  async (transactionData, { getState, rejectWithValue }) => {
    try {
      if (transactionData.isRecurring === "1") {
        console.log("🔄 Processing Recurring Payment:", {
          frequency: transactionData.Frequency,
          custom_days: transactionData.recurring_custom_days,
        });
      }

      const state = getState();
      const formDataState = state.remittance.formData;

      const isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer",
      );
      const isRemittanceOnly = isRemittanceOnlyCustomer === "Y";

      console.log("🔍 SIMPLE CHECK - Customer type:", {
        localStorageValue: isRemittanceOnlyCustomer,
        isRemittanceOnly: isRemittanceOnly,
      });

      const endpoint = `${API_URL}/transactions/remittance-transaction`;

      const formData = new FormData();

      const mappedData = {
        from_currency:
          transactionData.from_currency || formDataState.sendCurrency?.value,
        to_currency:
          transactionData.to_currency || formDataState.receiveCurrency?.value,

        bank_id:
          transactionData.bank_id ||
          formDataState.sendCurrency?.bank_id ||
          transactionData.sender_bank_id ||
          (isRemittanceOnly ? "remit-default-account" : ""),

        send_amount: transactionData.send_amount || formDataState.sendAmount,
        receive_amount:
          transactionData.receive_amount || formDataState.receiveAmount,
        exchange_rate:
          transactionData.exchange_rate || formDataState.exchangeRate,

        customer_id: transactionData.customer_id,

        payment_method:
          transactionData.payment_method || formDataState.paymentMethod,
        conversion_id:
          transactionData.conversion_id || formDataState.conversionId,

        beneficiary: transactionData.beneficiary,
        beneficiary_bank_id: transactionData.beneficiary_bank_id,

        beneficiary_name: transactionData.beneficiary_name,
        beneficiary_bank_name: transactionData.beneficiary_bank_name,
        beneficiary_account_number: transactionData.beneficiary_account_number,

        is_remit: "Y",
        is_remittance_only: isRemittanceOnly ? "Y" : "N",
        customer_type: isRemittanceOnly ? "remittance_only" : "regular",

        purpose:
          transactionData.purpose ||
          formDataState.purpose?.value ||
          formDataState.purpose,
        income_source:
          transactionData.income_source ||
          formDataState.income_source?.value ||
          formDataState.income_source,
        occupation: transactionData.occupation || formDataState.occupation,
        relation:
          transactionData.relation ||
          formDataState.relation?.value ||
          formDataState.relation,
        payout_method:
          transactionData.payout_method ||
          formDataState.payout_method?.value ||
          formDataState.payout_method,

        rails: transactionData.rails || "Local",
        sender_account_name:
          transactionData.sender_account_name ??
          transactionData.sila_account_name,
        sender_bank_id: transactionData.sender_bank_id,

        ...(transactionData.isRecurring ||
        transactionData.frequency ||
        transactionData.custom_days
          ? {
              isRecurring: transactionData.isRecurring || "0",
              frequency: transactionData.frequency || "",
              custom_days: transactionData.custom_days || "",
            }
          : {}),

        agree_to_terms: "1",
        file:
          transactionData.document ||
          transactionData.file ||
          formDataState.document,

        transaction_source: "web_app",
        platform: "web",

        transaction_fee:
          transactionData.transaction_fee || formDataState.fee || 0,
        total_amount: (
          parseFloat(
            transactionData.send_amount || formDataState.sendAmount || 0,
          ) +
          parseFloat(transactionData.transaction_fee || formDataState.fee || 0)
        ).toString(),
      };

      Object.keys(mappedData).forEach((key) => {
        const value = mappedData[key];

        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !(typeof value === "number" && isNaN(value))
        ) {
          if (key === "file" && value instanceof File) {
            formData.append("file", value, value.name);
            console.log(`📎 Appended file: ${value.name} (${value.type})`);
          } else if (key === "document" && value instanceof File) {
            formData.append("document", value, value.name);
            console.log(`📎 Appended document: ${value.name}`);
          } else if (
            typeof value === "object" &&
            value !== null &&
            !(value instanceof File)
          ) {
            try {
              const stringified = JSON.stringify(value);
              formData.append(key, stringified);
              console.log(
                `📝 Appended object ${key}:`,
                stringified.substring(0, 100) + "...",
              );
            } catch (jsonError) {
              console.warn(`Could not stringify ${key}:`, jsonError);
            }
          } else {
            formData.append(key, value);
            console.log(`✅ Appended ${key}: ${value}`);
          }
        } else {
          console.log(`⏭️ Skipped ${key}:`, value);
        }
      });

      console.log("📤 Final FormData entries:");
      for (let pair of formData.entries()) {
        const [key, value] = pair;
        if (key === "file" || key === "document") {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const token = localStorage.getItem("bearertoken");
      if (!token) {
        console.error("❌ No authentication token found!");
        return rejectWithValue({
          status: "error",
          message: "Authentication required. Please log in again.",
        });
      }

      console.log(`📞 Calling API: ${endpoint}`);
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 45000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          console.log(`📤 Upload progress: ${percentCompleted}%`);
        },
      });

      console.log("✅ API Response received:", response.data);

      let finalResponse;
      if (response.data && typeof response.data === "object") {
        finalResponse = {
          ...response.data,
          is_remittance_only: isRemittanceOnly,
          timestamp: new Date().toISOString(),
        };
      } else {
        finalResponse = {
          status: "success",
          message: "Transaction submitted successfully",
          data: response.data,
          is_remittance_only: isRemittanceOnly,
          timestamp: new Date().toISOString(),
        };
      }

      console.log("🎉 Transaction submitted successfully!");
      return finalResponse;
    } catch (error) {
      console.error("❌ Transaction submission error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const errorDetails = {
        status: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Transaction failed",
        code: error.response?.status,
        data: error.response?.data,
        timestamp: new Date().toISOString(),
      };

      return rejectWithValue(errorDetails);
    }
  },
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
    payoutCurrencies: null,
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
  customerType: {
    isRemittanceOnly: false,
    isLoading: false,
    error: null,
    lastChecked: null,
    kycStatus: null,
  },
  loading: false,
  error: null,
  transactionResult: null,
  exchangeRateCache: {},
  exchangeRateData: null,
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
    setCustomerType: (state, action) => {
      state.customerType = {
        ...state.customerType,
        ...action.payload,
      };
    },
    setRemittanceOnly: (state, action) => {
      state.customerType.isRemittanceOnly = action.payload;
      localStorage.setItem(
        "isRemittanceOnlyCustomer",
        action.payload ? "Y" : "N",
      );
    },
    setCustomerTypeLoading: (state, action) => {
      state.customerType.isLoading = action.payload;
    },
    setCustomerTypeError: (state, action) => {
      state.customerType.error = action.payload;
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
    forceSetCustomerType: (state, action) => {
      const customerType = action.payload;
      state.customerType.isRemittanceOnly = customerType === "remittance";
      localStorage.setItem(
        "isRemittanceOnlyCustomer",
        customerType === "remittance" ? "Y" : "N",
      );
    },
    setExchangeRateData: (state, action) => {
      state.exchangeRateData = action.payload;
    },
    clearExchangeRateData: (state) => {
      state.exchangeRateData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExchangeRate.fulfilled, (state, action) => {
        state.loading = false;
        state.formData.exchangeRate = parseFloat(action.payload.fxRate);
        state.formData.fee = parseFloat(action.payload.fee) || 0;
        state.formData.conversionId = action.payload.conversion_id;

        state.exchangeRateData = {
          fxRate: parseFloat(action.payload.fxRate),
          fee: parseFloat(action.payload.fee) || 0,
          conversion_id: action.payload.conversion_id,
          fromCurrency: action.meta.arg.fromCurrency,
          toCurrency: action.meta.arg.toCurrency,
          originalAmount: action.meta.arg.amount,
          ...action.payload,
        };

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
      .addCase(fetchBankAccounts.pending, (state) => {
        state.currencies.loading = true;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.bankAccounts = action.payload;
        state.currencies.loading = false;
        state.customerType.isRemittanceOnly = false;

        if (action.payload.length > 0 && !state.formData.sendCurrency) {
          const defaultCurrency =
            action.payload.find((acc) => acc.currency_code === "USD") ||
            action.payload[0];
          state.formData.sendCurrency = {
            value: defaultCurrency.currency_code,
            label: defaultCurrency.currency_code,
            bank_id: defaultCurrency.id,
            is_remittance_only: false,
          };
        }
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.currencies.loading = false;
        state.error = action.payload || "Failed to fetch bank accounts";
      })
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
      .addCase(fetchPayoutCurrencies.pending, (state) => {
        state.currencies.loading = true;
      })
      .addCase(fetchPayoutCurrencies.fulfilled, (state, action) => {
        const apiData = action.payload;
        const currencies = apiData?.data || [];
        
        console.log("📊 Processing payout currencies:", currencies);
        
        state.currencies.receiveOptions = currencies;
        state.currencies.payoutCurrencies = apiData;
        state.currencies.loading = false;
        
        // Find default currency (where default_remittance is "Y")
        const defaultCurrency = currencies.find(
          (currency) => currency.default_remittance === "Y"
        );
        
        console.log("🎯 Default currency found:", defaultCurrency);
        
        // Set default currency if exists and no currency is selected
        if (defaultCurrency && !state.formData.receiveCurrency) {
          state.formData.receiveCurrency = {
            value: defaultCurrency.currency_code,
            label: defaultCurrency.currency_code,
            icon: defaultCurrency.icon,
            default_remittance: defaultCurrency.default_remittance,
            currency_code: defaultCurrency.currency_code,
            payout_currency_id: defaultCurrency.payout_currency_id,
          };
          console.log("✅ Default receive currency set to:", state.formData.receiveCurrency);
        } else if (currencies.length > 0 && !state.formData.receiveCurrency) {
          const firstCurrency = currencies[0];
          state.formData.receiveCurrency = {
            value: firstCurrency.currency_code,
            label: firstCurrency.currency_code,
            icon: firstCurrency.icon,
            default_remittance: firstCurrency.default_remittance,
            currency_code: firstCurrency.currency_code,
            payout_currency_id: firstCurrency.payout_currency_id,
          };
          console.log("📌 First currency set as default:", state.formData.receiveCurrency);
        }
      })
      .addCase(fetchPayoutCurrencies.rejected, (state, action) => {
        state.currencies.loading = false;
        state.error = action.payload || "Failed to fetch payout currencies";
      })
      .addCase(submitTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactionResult = action.payload;
        state.step = 4;
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
  setCustomerType,
  setRemittanceOnly,
  setCustomerTypeLoading,
  setCustomerTypeError,
  forceSetCustomerType,
  setExchangeRateData,
  clearExchangeRateData,
} = remittanceSlice.actions;

// Selectors
export const selectFormData = (state) => state.remittance.formData;
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
export const selectIsRemittanceOnly = (state) => state.remittance.customerType.isRemittanceOnly;
export const selectCustomerType = (state) => state.remittance.customerType;
export const selectStep = (state) => state.remittance.step;
export const selectCurrencies = (state) => state.remittance.currencies;
export const selectBankAccounts = (state) => state.remittance.bankAccounts;
export const selectManualAccountDetails = (state) => state.remittance.manualAccountDetails;
export const selectLoading = (state) => state.remittance.loading;
export const selectError = (state) => state.remittance.error;
export const selectTransactionResult = (state) => state.remittance.transactionResult;

export default remittanceSlice.reducer;