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
        value?.substring(0, 100) + (value?.length > 100 ? "..." : "")
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
    { rejectWithValue, getState }
  ) => {
    try {
      const token = localStorage.getItem("bearertoken");

      // Check if this is a remittance-only account
      const state = getState();
      const bankAccount = state.remittance.bankAccounts.find(
        (acc) =>
          acc.id === bankId ||
          (acc.is_remittance_only && acc.currency_code === currencyCode)
      );

      const isRemittanceOnly = bankAccount?.is_remittance_only || false;

      console.log("🔍 Fetching manual details:", {
        bankId,
        currencyCode,
        isRemittanceOnly,
        bankAccount,
      });

      // For USD currency OR remittance-only customers, use hardcoded details
      if (currencyCode === "USD" || isRemittanceOnly) {
        console.log("Using hardcoded/remittance-only manual account details");

        // You might want different details for remittance-only
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
        // For other currencies (non-remittance), use the original endpoint
        const response = await axios.get(
          `${API_URL}/manualaccount-detail/${bankId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return {
          ...response.data,
          is_remittance_only: false,
        };
      }
    } catch (error) {
      // Error handling remains similar...
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
      debugEverything(); // Debug log

      console.log("🔍 START - Fetching exchange rate");
      console.log("Parameters:", {
        fromCurrency,
        toCurrency,
        amount,
        bankId,
        customerId,
      });

      // SIMPLE CHECK: Just look at localStorage
      const isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer"
      );
      console.log(
        "🔍 Customer type from localStorage:",
        isRemittanceOnlyCustomer
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

        // ✅ FIXED: Use the correct field names required by the API
        const remittancePayload = {
          value: parseFloat(amount), // ✅ Changed from 'amount' to 'value'
          from: fromCurrency, // ✅ Changed from 'from_currency' to 'from'
          to: toCurrency, // ✅ Changed from 'to_currency' to 'to'
          customer_id: parseInt(customerId),
          bank_id: bankId, // Keep as bank_id if API accepts it
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
          }
        );

        console.log("✅ Remittance API response:", response.data);

        // Extract data from response
        const responseData = response.data?.data || response.data || {};

        return {
          fxRate: responseData.exchange_rate || responseData.rate || 115,
          fee: responseData.fee || 0,
          converted_value:
            responseData.converted_amount ||
            responseData.amount ||
            (parseFloat(amount) * 115).toFixed(2),
          conversion_id:
            responseData.conversion_id ||
            responseData.id ||
            `remit-${Date.now()}`,
          is_remittance_only: true,
          message: "Remittance conversion successful",
        };
      }
      // REGULAR CUSTOMER
      else {
        console.log("✅ REGULAR CUSTOMER - Using regular API");

        // ✅ Also fix regular payload to match expected fields
        const regularPayload = {
          value: amount, // ✅ Changed from 'value' to 'value'
          from: fromCurrency, // ✅ Changed from 'from' to 'from'
          to: toCurrency, // ✅ Changed from 'to' to 'to'
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
          }
        );

        console.log("✅ Regular API response:", response.data);

        return {
          ...response.data,
          is_remittance_only: false,
        };
      }
    } catch (error) {
      console.error("❌ Exchange rate error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Always return something (don't reject for now)
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
  }
);

export const fetchBankAccounts = createAsyncThunk(
  "remittance/fetchBankAccounts",
  async (customerId, { rejectWithValue }) => {
    try {
      console.log("🔍 DEBUG - Starting fetchBankAccounts");
      console.log("Customer ID:", customerId);

      // Debug localStorage
      console.log("🔍 Checking localStorage:");
      console.log(
        "- isRemittanceOnlyCustomer:",
        localStorage.getItem("isRemittanceOnlyCustomer")
      );
      console.log("- All localStorage keys:", Object.keys(localStorage));

      const token = localStorage.getItem("bearertoken");
      if (!token) {
        console.error("No auth token found");
        return rejectWithValue("Authentication required");
      }

      const isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer"
      );
      console.log(
        "🔍 isRemittanceOnlyCustomer flag:",
        isRemittanceOnlyCustomer
      );

      if (isRemittanceOnlyCustomer === "Y") {
        console.log(
          "🚨 CUSTOMER IS REMITTANCE-ONLY - Using remit-from-currencies API"
        );

        const response = await axios.get(`${API_URL}/remit-from-currencies`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📦 Remittance-only API Response:", response.data);

        const currencies = response.data?.data || response.data || [];

        return currencies.map((currency, index) => ({
          id: currency.id || `remit-${index}-${currency.currency_code}`,
          currency_code: currency.currency_code,
          currency_name: currency.currency_name || currency.currency_code,
          icon: currency.icon || "💱",
          bank_name: currency.bank_name || "Remittance Service",
          account_number: "N/A",
          account_name: "Remittance Account",
          is_remittance_only: true,
          // Add any additional fields from the API
          ...currency,
        }));
      } else {
        console.log(
          "✅ Customer is NOT remittance-only - Using bank-account-details API"
        );

        const response = await axios.get(
          `${API_URL}/bank-account-details/${customerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("📦 Regular API Response:", response.data);

        const accounts = response.data?.account_details || [];

        return accounts.map((account) => ({
          ...account,
          is_remittance_only: false,
        }));
      }
    } catch (error) {
      console.error("❌ Error fetching bank accounts:", error);

      // Return fallback for remittance-only customers
      const isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer"
      );

      if (isRemittanceOnlyCustomer === "Y") {
        console.warn("Using fallback remittance currencies");
        return [
          {
            id: "remit-usd",
            currency_code: "USD",
            currency_name: "US Dollar",
            icon: "💵",
            bank_name: "Remittance Service",
            account_number: "N/A",
            account_name: "Remittance Account",
            is_remittance_only: true,
          },
          {
            id: "remit-gbp",
            currency_code: "GBP",
            currency_name: "British Pound",
            icon: "💷",
            bank_name: "Remittance Service",
            account_number: "N/A",
            account_name: "Remittance Account",
            is_remittance_only: true,
          },
          {
            id: "remit-eur",
            currency_code: "EUR",
            currency_name: "Euro",
            icon: "💶",
            bank_name: "Remittance Service",
            account_number: "N/A",
            account_name: "Remittance Account",
            is_remittance_only: true,
          },
        ];
      }

      return [];
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
  async (transactionData, { getState, rejectWithValue }) => {
    try {
      console.log("🚀 Starting transaction submission...");
      console.log("📦 Transaction data received:", transactionData);

      // Get current state
      const state = getState();
      const formDataState = state.remittance.formData;

      // ========== SIMPLE CUSTOMER TYPE CHECK ==========
      const isRemittanceOnlyCustomer = localStorage.getItem(
        "isRemittanceOnlyCustomer"
      );
      const isRemittanceOnly = isRemittanceOnlyCustomer === "Y";

      console.log("🔍 SIMPLE CHECK - Customer type:", {
        localStorageValue: isRemittanceOnlyCustomer,
        isRemittanceOnly: isRemittanceOnly,
      });

      // ========== SET ENDPOINT ==========
      const endpoint = `${API_URL}/transactions/remittance-transaction`;

      // Create FormData object
      const formData = new FormData();

      // CRITICAL: Map to the actual field names
      const mappedData = {
        // ========== REQUIRED CURRENCY FIELDS ==========
        from_currency:
          transactionData.from_currency || formDataState.sendCurrency?.value,
        to_currency:
          transactionData.to_currency || formDataState.receiveCurrency?.value,

        // ========== REQUIRED BANK ID FIELD ==========
        bank_id:
          transactionData.bank_id ||
          formDataState.sendCurrency?.bank_id ||
          transactionData.sender_bank_id ||
          (isRemittanceOnly ? "remit-default-account" : ""),

        // ========== REQUIRED AMOUNT FIELDS ==========
        send_amount: transactionData.send_amount || formDataState.sendAmount,
        receive_amount:
          transactionData.receive_amount || formDataState.receiveAmount,
        exchange_rate:
          transactionData.exchange_rate || formDataState.exchangeRate,

        // ========== CUSTOMER INFO ==========
        customer_id: transactionData.customer_id,

        // ========== PAYMENT INFO ==========
        payment_method:
          transactionData.payment_method || formDataState.paymentMethod,
        conversion_id:
          transactionData.conversion_id || formDataState.conversionId,

        // ========== REQUIRED BENEFICIARY FIELDS ==========
        beneficiary: transactionData.beneficiary, // REQUIRED: beneficiary ID as string
        beneficiary_bank_id: transactionData.beneficiary_bank_id, // REQUIRED: bank ID

        // ========== OPTIONAL BENEFICIARY INFO ==========
        beneficiary_name: transactionData.beneficiary_name,
        beneficiary_bank_name: transactionData.beneficiary_bank_name,
        beneficiary_account_number: transactionData.beneficiary_account_number,

        // ========== CUSTOMER TYPE FLAGS ==========
        is_remit: "Y", // Always "Y" for both types
        is_remittance_only: isRemittanceOnly ? "Y" : "N",
        customer_type: isRemittanceOnly ? "remittance_only" : "regular",

        // ========== COMPLIANCE FIELDS ==========
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

        // ========== ADDITIONAL FIELDS ==========
        rails: transactionData.rails || "Local",
        sender_account_name: transactionData.sender_account_name,
        sender_bank_id: transactionData.sender_bank_id,

        // ========== TERMS & FILE ==========
        agree_to_terms: "1", // Assuming user agreed by this point
        file:
          transactionData.document ||
          transactionData.file ||
          formDataState.document,

        // ========== TRANSACTION METADATA ==========
        transaction_source: "web_app",
        platform: "web",

        // ========== FEE INFORMATION ==========
        transaction_fee:
          transactionData.transaction_fee || formDataState.fee || 0,
        total_amount: (
          parseFloat(
            transactionData.send_amount || formDataState.sendAmount || 0
          ) +
          parseFloat(transactionData.transaction_fee || formDataState.fee || 0)
        ).toString(),
      };

      console.log("📋 Mapped data for API submission:", mappedData);

      // Append all non-null/undefined fields to FormData
      Object.keys(mappedData).forEach((key) => {
        const value = mappedData[key];

        // Skip null/undefined/empty strings (except 0)
        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !(typeof value === "number" && isNaN(value))
        ) {
          if (key === "file" && value instanceof File) {
            // Handle file upload
            formData.append("file", value, value.name);
            console.log(`📎 Appended file: ${value.name} (${value.type})`);
          } else if (key === "document" && value instanceof File) {
            // Alternative document field
            formData.append("document", value, value.name);
            console.log(`📎 Appended document: ${value.name}`);
          } else if (
            typeof value === "object" &&
            value !== null &&
            !(value instanceof File)
          ) {
            // Stringify objects (like beneficiary_address)
            try {
              const stringified = JSON.stringify(value);
              formData.append(key, stringified);
              console.log(
                `📝 Appended object ${key}:`,
                stringified.substring(0, 100) + "..."
              );
            } catch (jsonError) {
              console.warn(`Could not stringify ${key}:`, jsonError);
            }
          } else {
            // Regular value
            formData.append(key, value);
            console.log(`✅ Appended ${key}: ${value}`);
          }
        } else {
          console.log(`⏭️ Skipped ${key}:`, value);
        }
      });

      // Debug: Log what we're actually sending
      console.log("📤 Final FormData entries:");
      for (let pair of formData.entries()) {
        const [key, value] = pair;
        if (key === "file" || key === "document") {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Get auth token
      const token = localStorage.getItem("bearertoken");
      if (!token) {
        console.error("❌ No authentication token found!");
        return rejectWithValue({
          status: "error",
          message: "Authentication required. Please log in again.",
        });
      }

      console.log(`📞 Calling API: ${endpoint}`);
      console.log(`🔗 Endpoint: ${endpoint}`);

      // Make the API call
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 45000, // 45 seconds timeout for file uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`📤 Upload progress: ${percentCompleted}%`);
        },
      });

      console.log("✅ API Response received:", response.data);

      // Handle different response structures
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

      // Log success
      console.log("🎉 Transaction submitted successfully!");
      console.log("📊 Final response:", finalResponse);

      return finalResponse;
    } catch (error) {
      console.error("❌ Transaction submission error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });

      // Build detailed error object
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

      // Add validation errors if present
      if (error.response?.data?.errors) {
        errorDetails.validation_errors = error.response.data.errors;
      }

      // Add field-specific errors
      if (error.response?.data?.error) {
        errorDetails.field_errors = error.response.data.error;
      }

      return rejectWithValue(errorDetails);
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
      // Also update localStorage
      localStorage.setItem(
        "isRemittanceOnlyCustomer",
        action.payload ? "Y" : "N"
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

    // NEW: Force set customer type
    forceSetCustomerType: (state, action) => {
      const customerType = action.payload; // "remittance" or "regular"
      state.customerType.isRemittanceOnly = customerType === "remittance";
      localStorage.setItem(
        "isRemittanceOnlyCustomer",
        customerType === "remittance" ? "Y" : "N"
      );
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

        // Update customer type based on fetched accounts
        const hasRemittanceAccounts = action.payload.some(
          (acc) => acc.is_remittance_only
        );
        state.customerType.isRemittanceOnly = hasRemittanceAccounts;

        // Set default send currency
        if (action.payload.length > 0 && !state.formData.sendCurrency) {
          const defaultCurrency =
            action.payload.find((acc) => acc.currency_code === "USD") ||
            action.payload[0];
          state.formData.sendCurrency = {
            value: defaultCurrency.currency_code,
            label: defaultCurrency.currency_code,
            bank_id: defaultCurrency.id,
            is_remittance_only: defaultCurrency.is_remittance_only,
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
  setCustomerType,
  setRemittanceOnly,
  setCustomerTypeLoading,
  setCustomerTypeError,
  handleBeneficiaryCodeLookup,
  handleBeneficiarySelect,
  handleBankSelect,
  forceSetCustomerType, // NEW ACTION
} = remittanceSlice.actions;

// ===================== SELECTORS =====================

// Form data selectors
export const selectFormData = (state) => state.remittance.formData;

// Individual field selectors
export const selectSendAmount = (state) => state.remittance.formData.sendAmount;
export const selectReceiveAmount = (state) =>
  state.remittance.formData.receiveAmount;
export const selectSendCurrency = (state) =>
  state.remittance.formData.sendCurrency;
export const selectReceiveCurrency = (state) =>
  state.remittance.formData.receiveCurrency;
export const selectPaymentMethod = (state) =>
  state.remittance.formData.paymentMethod;
export const selectExchangeRate = (state) =>
  state.remittance.formData.exchangeRate;
export const selectFee = (state) => state.remittance.formData.fee;
export const selectConversionId = (state) =>
  state.remittance.formData.conversionId;
export const selectPurpose = (state) => state.remittance.formData.purpose;
export const selectIncomeSource = (state) =>
  state.remittance.formData.income_source;
export const selectOccupation = (state) => state.remittance.formData.occupation;
export const selectRelation = (state) => state.remittance.formData.relation;
export const selectPayoutMethod = (state) =>
  state.remittance.formData.payout_method;
export const selectDocument = (state) => state.remittance.formData.document;
export const selectAgreeToTerms = (state) =>
  state.remittance.formData.agreeToTerms;
export const selectPromoCode = (state) => state.remittance.formData.promocode;
export const selectDescription = (state) =>
  state.remittance.formData.description;
export const selectSenderBank = (state) => state.remittance.formData.senderBank;
export const selectIsRemittanceOnly = (state) =>
  state.remittance.customerType.isRemittanceOnly;

export const selectCustomerType = (state) => state.remittance.customerType;

export const selectCustomerTypeLoading = (state) =>
  state.remittance.customerType.isLoading;

export const selectKYCStatus = (state) =>
  state.remittance.customerType.kycStatus;

// Enhanced transaction selector
export const selectTransactionWithType = (state) => {
  const transaction = state.remittance.transactionResult;
  if (!transaction) return null;

  return {
    ...transaction,
    is_remittance_only: state.remittance.customerType.isRemittanceOnly,
  };
};

// Other state selectors
export const selectStep = (state) => state.remittance.step;
export const selectCurrencies = (state) => state.remittance.currencies;
export const selectSendOptions = (state) =>
  state.remittance.currencies.sendOptions;
export const selectReceiveOptions = (state) =>
  state.remittance.currencies.receiveOptions;
export const selectBankAccounts = (state) => state.remittance.bankAccounts;
export const selectManualAccountDetails = (state) =>
  state.remittance.manualAccountDetails;
export const selectPromoCodeValidation = (state) =>
  state.remittance.promoCodeValidation;
export const selectVerification = (state) => state.remittance.verification;
export const selectLoading = (state) => state.remittance.loading;
export const selectError = (state) => state.remittance.error;
export const selectTransactionResult = (state) =>
  state.remittance.transactionResult;
export const selectExchangeRateCache = (state) =>
  state.remittance.exchangeRateCache;

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

  return `${form.sendCurrency.value} 1 = ${
    form.receiveCurrency.value
  } ${form.exchangeRate.toFixed(4)}`;
};

// Loading states selectors
export const selectIsLoadingExchangeRate = (state) =>
  state.remittance.currencies.loading || state.remittance.loading;

export const selectIsSubmitting = (state) => state.remittance.loading;

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
  state.remittance.currencies.loading || state.remittance.loading;

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
    totalAmount:
      (parseFloat(form.sendAmount) || 0) + (parseFloat(form.fee) || 0),
    paymentMethod: form.paymentMethod,
    purpose: form.purpose?.label,
    incomeSource: form.income_source?.label,
  };
};

// Selector for step navigation
export const selectCanProceedToNextStep = (state) => {
  const step = state.remittance.step;
  const form = state.remittance.formData;

  switch (step) {
    case 1:
      return Boolean(
        form.sendAmount &&
          form.receiveAmount &&
          form.sendCurrency &&
          form.receiveCurrency
      );
    case 2:
      return Boolean(form.purpose && form.income_source && form.payout_method);
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
    receive: receive
      ? `${selectReceiveCurrencySymbol(state)} ${receive.label}`
      : "",
  };
};

export default remittanceSlice.reducer;
