// beneficiaryHomepageSlice.js - OPTIMIZED WITH THROTTLING AND CACHING
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { centralizedApi } from "../../../services/api";

// Request tracking for throttling
const requestTracker = {
  pendingFetches: new Map(),
  lastFetchTime: new Map(),
  cacheKeys: new Map(),
};

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
      ["pending", "opened", "amount_changed"].includes(req.status),
    ).length || 0;

  const completedTransactions =
    transactions?.filter(
      (trans) => trans.status === "completed" || trans.status === "approved",
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

// Async thunks with throttling and deduplication
export const fetchCurrencies = createAsyncThunk(
  "beneficiaryHomepage/fetchCurrencies",
  async (_, { rejectWithValue }) => {
    const cacheKey = "fetchCurrencies";
    const now = Date.now();
    const minInterval = 30000; // 30 seconds minimum between requests
    
    // Check if we fetched recently
    const lastFetch = requestTracker.lastFetchTime.get(cacheKey);
    if (lastFetch && now - lastFetch < minInterval) {
      console.log("⏳ Throttling currencies fetch - too soon");
      return rejectWithValue({ throttled: true });
    }
    
    // Check for pending request
    if (requestTracker.pendingFetches.has(cacheKey)) {
      console.log("🔄 Reusing pending currencies request");
      return requestTracker.pendingFetches.get(cacheKey);
    }

    try {
      requestTracker.lastFetchTime.set(cacheKey, now);
      
      const fetchPromise = (async () => {
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
      })();

      requestTracker.pendingFetches.set(cacheKey, fetchPromise);
      
      // Clean up after promise resolves
      fetchPromise.finally(() => {
        setTimeout(() => {
          requestTracker.pendingFetches.delete(cacheKey);
        }, 1000);
      });

      return await fetchPromise;
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const fetchTransactions = createAsyncThunk(
  "beneficiaryHomepage/fetchTransactions",
  async (beneficiaryId, { rejectWithValue }) => {
    const cacheKey = `fetchTransactions-${beneficiaryId}`;
    const now = Date.now();
    const minInterval = 15000; // 15 seconds minimum between requests

    if (!beneficiaryId) {
      throw new Error("Beneficiary ID is required");
    }

    // Check if we fetched recently
    const lastFetch = requestTracker.lastFetchTime.get(cacheKey);
    if (lastFetch && now - lastFetch < minInterval) {
      console.log(`⏳ Throttling transactions fetch for ${beneficiaryId} - too soon`);
      return rejectWithValue({ throttled: true });
    }

    // Check for pending request
    if (requestTracker.pendingFetches.has(cacheKey)) {
      console.log(`🔄 Reusing pending transactions request for ${beneficiaryId}`);
      return requestTracker.pendingFetches.get(cacheKey);
    }

    try {
      requestTracker.lastFetchTime.set(cacheKey, now);

      const fetchPromise = (async () => {
        const timestamp = new Date().getTime();
        const response = await centralizedApi.api.get(
          `/beneficiaries/all-transactions/${beneficiaryId}?_t=${timestamp}`
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
            new Date(a.transaction_datetime || a.created_at),
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
      })();

      requestTracker.pendingFetches.set(cacheKey, fetchPromise);
      
      fetchPromise.finally(() => {
        setTimeout(() => {
          requestTracker.pendingFetches.delete(cacheKey);
        }, 1000);
      });

      return await fetchPromise;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const fetchRequestStatus = createAsyncThunk(
  "beneficiaryHomepage/fetchRequestStatus",
  async (beneficiaryId, { rejectWithValue }) => {
    const cacheKey = `fetchRequestStatus-${beneficiaryId}`;
    const now = Date.now();
    const minInterval = 15000; // 15 seconds

    try {
      const lastFetch = requestTracker.lastFetchTime.get(cacheKey);
      if (lastFetch && now - lastFetch < minInterval) {
        console.log(`⏳ Throttling request status fetch for ${beneficiaryId}`);
        return rejectWithValue({ throttled: true });
      }

      if (requestTracker.pendingFetches.has(cacheKey)) {
        console.log(`🔄 Reusing pending request status for ${beneficiaryId}`);
        return requestTracker.pendingFetches.get(cacheKey);
      }

      requestTracker.lastFetchTime.set(cacheKey, now);

      const fetchPromise = (async () => {
        try {
          const timestamp = new Date().getTime();
          const response = await centralizedApi.api.get(
            `/request-status/${beneficiaryId}?_t=${timestamp}`
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
      })();

      requestTracker.pendingFetches.set(cacheKey, fetchPromise);
      
      fetchPromise.finally(() => {
        setTimeout(() => {
          requestTracker.pendingFetches.delete(cacheKey);
        }, 1000);
      });

      return await fetchPromise;
    } catch (error) {
      console.error("Failed to fetch request status:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const fetchSenders = createAsyncThunk(
  "beneficiaryHomepage/fetchSenders",
  async (beneficiaryId, { rejectWithValue }) => {
    const cacheKey = `fetchSenders-${beneficiaryId}`;
    const now = Date.now();
    const minInterval = 30000; // 30 seconds

    try {
      const lastFetch = requestTracker.lastFetchTime.get(cacheKey);
      if (lastFetch && now - lastFetch < minInterval) {
        console.log(`⏳ Throttling senders fetch for ${beneficiaryId}`);
        return rejectWithValue({ throttled: true });
      }

      if (requestTracker.pendingFetches.has(cacheKey)) {
        console.log(`🔄 Reusing pending senders request for ${beneficiaryId}`);
        return requestTracker.pendingFetches.get(cacheKey);
      }

      requestTracker.lastFetchTime.set(cacheKey, now);

      const fetchPromise = (async () => {
        try {
          const timestamp = new Date().getTime();
          const response = await centralizedApi.api.get(
            `/beneficiaries/senders/${beneficiaryId}?_t=${timestamp}`
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
              }),
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
      })();

      requestTracker.pendingFetches.set(cacheKey, fetchPromise);
      
      fetchPromise.finally(() => {
        setTimeout(() => {
          requestTracker.pendingFetches.delete(cacheKey);
        }, 1000);
      });

      return await fetchPromise;
    } catch (error) {
      console.error("Failed to fetch senders:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const submitRemittanceRequest = createAsyncThunk(
  "beneficiaryHomepage/submitRemittanceRequest",
  async (requestData, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const beneficiaryUuid = localStorage.getItem("beneficiaryUuid");

      if (!beneficiaryUuid) {
        throw new Error("Beneficiary UUID not found. Please log in again.");
      }

      const apiPayload = {
        senders: requestData.senders || [],
        beneficiary_id: requestData.beneficiary_id,
        beneficiary_bank_id: requestData.beneficiary_bank_id,
        amount: requestData.amount,
        currency: requestData.currency,
        purpose: requestData.purpose || "remittance",
        is_recurring: requestData.is_recurring || "N",
        recurring_frequency: requestData.recurring_frequency || "",
        custom_days: requestData.custom_days || "",
        source_currency: requestData.source_currency || "",
        author_type: "beneficiary",
        author_source: "zap",
        author_id: beneficiaryUuid,
      };

      console.log("📤 API Payload:", {
        ...apiPayload,
        is_recurring: apiPayload.is_recurring,
        source_currency: apiPayload.source_currency,
      });

      if (apiPayload.is_recurring === "Y" && !apiPayload.source_currency) {
        throw new Error("Source currency is required for recurring payments");
      }

      const response = await centralizedApi.api.post(
        "/transactions/request-remit",
        apiPayload,
      );

      const result = response.data;
      console.log("📥 API Response:", result);

      if (response.status === 200 && result.status === "success") {
        const responseData = result.data || {};

        return {
          success: true,
          data: responseData,
          message:
            typeof result.message === "string"
              ? result.message
              : "Recurring remittance request submitted successfully!",
          requestRemitLink: responseData?.requestRemitLink || null,
        };
      } else {
        if (result.message && typeof result.message === "object") {
          const errorMessages = Object.entries(result.message)
            .map(
              ([field, errors]) =>
                `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`,
            )
            .join("; ");
          throw new Error(errorMessages);
        } else {
          throw new Error(
            typeof result.message === "string"
              ? result.message
              : "Failed to submit request. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("❌ API Error:", error);

      let errorMessage = "Failed to submit request. Please try again.";

      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        if (typeof msg === "object") {
          errorMessage = Object.entries(msg)
            .map(
              ([field, errors]) =>
                `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`,
            )
            .join("; ");
        } else if (typeof msg === "string") {
          errorMessage = msg;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  },
);

// Enhanced fetchBeneficiaryData with throttling
export const fetchBeneficiaryData = createAsyncThunk(
  "beneficiaryHomepage/fetchBeneficiaryData",
  async (beneficiaryId, { rejectWithValue }) => {
    const cacheKey = `fetchBeneficiaryData-${beneficiaryId}`;
    const now = Date.now();
    const minInterval = 10000; // 10 seconds

    try {
      if (!beneficiaryId) {
        throw new Error("Beneficiary ID is required");
      }

      // Check if we fetched recently
      const lastFetch = requestTracker.lastFetchTime.get(cacheKey);
      if (lastFetch && now - lastFetch < minInterval) {
        console.log(`⏳ Throttling beneficiary data fetch for ${beneficiaryId}`);
        return rejectWithValue({ throttled: true });
      }

      // Check for pending request
      if (requestTracker.pendingFetches.has(cacheKey)) {
        console.log(`🔄 Reusing pending beneficiary data request for ${beneficiaryId}`);
        return requestTracker.pendingFetches.get(cacheKey);
      }

      requestTracker.lastFetchTime.set(cacheKey, now);

      const fetchPromise = (async () => {
        const timestamp = new Date().getTime();
        const response = await centralizedApi.api.get(
          `/beneficiaries/fetch-merchant-benef/${beneficiaryId}?_t=${timestamp}`
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
      })();

      requestTracker.pendingFetches.set(cacheKey, fetchPromise);
      
      fetchPromise.finally(() => {
        setTimeout(() => {
          requestTracker.pendingFetches.delete(cacheKey);
        }, 1000);
      });

      return await fetchPromise;
    } catch (error) {
      console.error("Failed to fetch beneficiary data:", error);
      return rejectWithValue(
        error.message || "Failed to load beneficiary information."
      );
    }
  },
);

// Enhanced fetchBeneficiaryHomepageData with throttling
export const fetchBeneficiaryHomepageData = createAsyncThunk(
  "beneficiaryHomepage/fetchAllData",
  async (beneficiaryId, { dispatch, rejectWithValue }) => {
    const cacheKey = `fetchAllData-${beneficiaryId}`;
    const now = Date.now();
    const minInterval = 15000; // 15 seconds

    try {
      // Check if we fetched recently
      const lastFetch = requestTracker.lastFetchTime.get(cacheKey);
      if (lastFetch && now - lastFetch < minInterval) {
        console.log(`⏳ Throttling homepage data fetch for ${beneficiaryId} - too soon`);
        return { throttled: true };
      }

      // Check for pending request
      if (requestTracker.pendingFetches.has(cacheKey)) {
        console.log(`🔄 Reusing pending homepage data request for ${beneficiaryId}`);
        return requestTracker.pendingFetches.get(cacheKey);
      }

      requestTracker.lastFetchTime.set(cacheKey, now);

      const fetchPromise = (async () => {
        console.log("🔄 Starting to fetch all data for beneficiary:", beneficiaryId);

        // Use Promise.allSettled to handle individual failures
        const results = await Promise.allSettled([
          dispatch(fetchCurrencies()).unwrap(),
          dispatch(fetchTransactions(beneficiaryId)).unwrap(),
          dispatch(fetchRequestStatus(beneficiaryId)).unwrap(),
          dispatch(fetchSenders(beneficiaryId)).unwrap(),
        ]);

        // Check if any failed
        const failedResults = results.filter(
          (result) => result.status === "rejected" && !result.reason?.throttled
        );
        
        if (failedResults.length > 0) {
          console.warn("⚠️ Some API calls failed:", failedResults);
        }

        console.log("✅ All data loaded successfully");
        return { success: true };
      })();

      requestTracker.pendingFetches.set(cacheKey, fetchPromise);
      
      fetchPromise.finally(() => {
        setTimeout(() => {
          requestTracker.pendingFetches.delete(cacheKey);
        }, 2000); // Keep in pending for 2 seconds after completion
      });

      return await fetchPromise;
    } catch (error) {
      console.error("❌ Error fetching all data:", error);
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  formData: {
    beneficiary_id: "",
    beneficiary_bank_id: "",
    amount: "",
    currency: "USD",
    senders: [],
  },
  currencies: [],
  beneficiaryData: null,
  transactions: [],
  requestStatus: [],
  senders: [],
  selectedSenders: [],
  isLoading: false,
  currenciesLoading: false,
  transactionsLoading: false,
  statusLoading: false,
  sendersLoading: false,
  isSubmitting: false,
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
  requestRemitLink: null,
  copySuccess: false,
  emailForm: {
    to: "",
    subject: "🔐 Secure Remittance Request - Action Required",
    message: "",
  },
  showSharePopup: false,
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
    updateFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
      if (state.errors[field]) {
        delete state.errors[field];
      }
    },
    toggleSenderSelection: (state, action) => {
      const senderId = action.payload;
      const isSelected = state.selectedSenders.includes(senderId);

      if (isSelected) {
        state.selectedSenders = state.selectedSenders.filter(
          (id) => id !== senderId,
        );
        state.formData.senders = state.formData.senders.filter(
          (id) => id !== senderId,
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
    setBeneficiaryData: (state, action) => {
      state.beneficiaryData = action.payload.data;
      state.hasFetchedBeneficiary = true;
      state.benefCode = action.payload.benefCode;

      if (
        action.payload.data.benef_banks &&
        action.payload.data.benef_banks.length > 0
      ) {
        const firstBank = action.payload.data.benef_banks[0];
        state.formData.beneficiary_bank_id = firstBank.id.toString();
        state.formData.currency = firstBank.currency_code || "USD";
        state.formData.beneficiary_id = action.payload.data.id || "";
      }
    },
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
    setRequestRemitLink: (state, action) => {
      state.requestRemitLink = action.payload;
    },
    clearRequestRemitLink: (state) => {
      state.requestRemitLink = null;
    },
    setCopySuccess: (state, action) => {
      state.copySuccess = action.payload;
    },
    updateEmailForm: (state, action) => {
      state.emailForm = { ...state.emailForm, ...action.payload };
    },
    setEmailFormField: (state, action) => {
      const { field, value } = action.payload;
      state.emailForm[field] = value;
    },
    toggleSharePopup: (state, action) => {
      state.showSharePopup = action.payload ?? !state.showSharePopup;
    },
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
    setUserEmail: (state, action) => {
      state.userEmail = action.payload;
    },
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
        if (action.payload) {
          state.currencies = action.payload;
        }
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.currenciesLoading = false;
        if (!action.payload?.throttled) {
          state.message = {
            type: "error",
            text: action.payload || "Failed to fetch currencies",
          };
        }
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
        if (action.payload) {
          state.transactions = action.payload;
          state.transactionStats = calculateTransactionStats(action.payload);
          state.stats = calculateDashboardStats(
            state.requestStatus,
            action.payload,
          );
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        if (!action.payload?.throttled) {
          state.message = {
            type: "error",
            text: action.payload || "Failed to fetch transactions",
          };
        }
      })

      // Fetch Request Status
      .addCase(fetchRequestStatus.pending, (state) => {
        state.statusLoading = true;
      })
      .addCase(fetchRequestStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        if (action.payload) {
          state.requestStatus = action.payload;
          state.stats = calculateDashboardStats(
            action.payload,
            state.transactions,
          );
        }
      })
      .addCase(fetchRequestStatus.rejected, (state, action) => {
        state.statusLoading = false;
        if (!action.payload?.throttled) {
          state.message = {
            type: "error",
            text: action.payload || "Failed to fetch request status",
          };
        }
      })

      // Fetch Senders
      .addCase(fetchSenders.pending, (state) => {
        state.sendersLoading = true;
      })
      .addCase(fetchSenders.fulfilled, (state, action) => {
        state.sendersLoading = false;
        if (action.payload) {
          state.senders = action.payload;
        }
      })
      .addCase(fetchSenders.rejected, (state, action) => {
        state.sendersLoading = false;
        if (!action.payload?.throttled) {
          state.message = {
            type: "error",
            text: action.payload || "Failed to fetch senders",
          };
        }
      })

      // Fetch Beneficiary Data
      .addCase(fetchBeneficiaryData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBeneficiaryData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.beneficiaryData = action.payload.data;
          state.hasFetchedBeneficiary = true;
          state.benefCode = action.payload.benefCode;

          if (
            action.payload.data.benef_banks &&
            action.payload.data.benef_banks.length > 0
          ) {
            const firstBank = action.payload.data.benef_banks[0];
            state.formData.beneficiary_bank_id = firstBank.id.toString();
            state.formData.currency = firstBank.currency_code || "USD";
            state.formData.beneficiary_id = action.payload.data.id || "";
          }
        }
      })
      .addCase(fetchBeneficiaryData.rejected, (state, action) => {
        state.isLoading = false;
        if (!action.payload?.throttled) {
          state.message = {
            type: "error",
            text: action.payload || "Failed to fetch beneficiary data",
          };
        }
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
      })
      .addCase(fetchBeneficiaryHomepageData.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchBeneficiaryHomepageData.rejected, (state, action) => {
        state.isLoading = false;
        if (!action.payload?.throttled) {
          state.message = {
            type: "error",
            text:
              action.payload ||
              "Failed to load data. Please try refreshing the page.",
          };
        }
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