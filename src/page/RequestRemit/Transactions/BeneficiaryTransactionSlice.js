import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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

// Use Vite environment variable
const API_URL =
  import.meta.env.VITE_API_URL || "https://zapware.unlimitedremit.com/api";

// Async thunks
export const fetchTransactions = createAsyncThunk(
  "beneficiaryTransaction/fetchTransactions",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();

      if (!beneficiaryId) {
        throw new Error("Beneficiary ID is required");
      }

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/beneficiaries/all-transactions/${beneficiaryId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Full API Response:", data);

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
        transaction_id: transaction.transaction_id || transaction.id,
        instructed_amount: transaction.instructed_amount || transaction.amount,
        currency_code: transaction.currency_code || transaction.currency,
        status: transaction.status,
        transaction_datetime:
          transaction.transaction_datetime || transaction.created_at,
        direction: transaction.direction,
        fee_amount: transaction.fee_amount,
        amount_with_fee: transaction.amount_with_fee,
        particulars: transaction.particulars,
        sender_name: transaction.sender_name,
      }));

      return mappedTransactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return rejectWithValue(error.message || "Failed to fetch transactions");
    }
  }
);

export const fetchBeneficiaryName = createAsyncThunk(
  "beneficiaryTransaction/fetchBeneficiaryName",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();

      if (!beneficiaryId || !token) {
        throw new Error("Missing required parameters");
      }

      const response = await fetch(
        `${API_URL}/beneficiaries/fetch-merchant-benef/${beneficiaryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.name || "";
    } catch (error) {
      console.error("Error fetching beneficiary name:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchHeaderColor = createAsyncThunk(
  "beneficiaryTransaction/fetchHeaderColor",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const whitelabelledpartnerid = localStorage.getItem(
        "whitelabelledpartnerid"
      );

      if (!whitelabelledpartnerid || !token) {
        return null;
      }

      const response = await fetch(
        `${API_URL}/partner-basic-setup/${whitelabelledpartnerid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.header_color || null;
    } catch (error) {
      console.error("Error fetching header color:", error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Data
  transactions: [],
  beneficiaryName: "",
  headerColor: "",

  // Filter states
  filters: {
    type: "",
    transactionId: "",
    direction: "",
    startDate: "",
    endDate: "",
  },

  // UI states
  loading: false,
  loadingBeneficiaryName: false,
  loadingHeaderColor: false,
  error: null,
  errorBeneficiaryName: null,
  errorHeaderColor: null,

  // Mobile detection
  isMobile: window.innerWidth < 768,

  // Cache
  headerColorCache: null,
};

const BeneficiaryTransactionSlice = createSlice({
  name: "beneficiaryTransaction",
  initialState,
  reducers: {
    // Filter actions
    setFilterType: (state, action) => {
      state.filters.type = action.payload;
    },

    setFilterTransactionId: (state, action) => {
      state.filters.transactionId = action.payload;
    },

    setFilterDirection: (state, action) => {
      state.filters.direction = action.payload;
    },

    setFilterStartDate: (state, action) => {
      state.filters.startDate = action.payload;
    },

    setFilterEndDate: (state, action) => {
      state.filters.endDate = action.payload;
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // UI actions
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    setMobileState: (state, action) => {
      state.isMobile = action.payload;
    },

    // Reset state
    resetTransactions: () => initialState,

    // Update specific transaction
    updateTransaction: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.transactions.findIndex((tx) => tx.id === id);
      if (index !== -1) {
        state.transactions[index] = {
          ...state.transactions[index],
          ...updates,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.transactions = [];
      })

      // Fetch Beneficiary Name
      .addCase(fetchBeneficiaryName.pending, (state) => {
        state.loadingBeneficiaryName = true;
        state.errorBeneficiaryName = null;
      })
      .addCase(fetchBeneficiaryName.fulfilled, (state, action) => {
        state.loadingBeneficiaryName = false;
        state.beneficiaryName = action.payload;
        state.errorBeneficiaryName = null;
      })
      .addCase(fetchBeneficiaryName.rejected, (state, action) => {
        state.loadingBeneficiaryName = false;
        state.errorBeneficiaryName = action.payload;
        state.beneficiaryName = "";
      })

      // Fetch Header Color
      .addCase(fetchHeaderColor.pending, (state) => {
        state.loadingHeaderColor = true;
        state.errorHeaderColor = null;
      })
      .addCase(fetchHeaderColor.fulfilled, (state, action) => {
        state.loadingHeaderColor = false;
        state.headerColor = action.payload;
        state.headerColorCache = action.payload;
        state.errorHeaderColor = null;
      })
      .addCase(fetchHeaderColor.rejected, (state, action) => {
        state.loadingHeaderColor = false;
        state.errorHeaderColor = action.payload;
      });
  },
});

// Export actions
export const {
  setFilterType,
  setFilterTransactionId,
  setFilterDirection,
  setFilterStartDate,
  setFilterEndDate,
  clearFilters,
  setLoading,
  setError,
  setMobileState,
  resetTransactions,
  updateTransaction,
} = BeneficiaryTransactionSlice.actions;

// Selectors
export const selectTransactions = (state) =>
  state.beneficiaryTransaction?.transactions || [];

// Update ALL selectors similarly:
export const selectBeneficiaryName = (state) =>
  state.beneficiaryTransaction?.beneficiaryName || "";

export const selectHeaderColor = (state) =>
  state.beneficiaryTransaction?.headerColor || "";

export const selectFilters = (state) =>
  state.beneficiaryTransaction?.filters || {
    type: "",
    transactionId: "",
    direction: "",
    startDate: "",
    endDate: "",
  };

export const selectLoading = (state) =>
  state.beneficiaryTransaction?.loading || false;

export const selectLoadingBeneficiaryName = (state) =>
  state.beneficiaryTransaction?.loadingBeneficiaryName || false;

export const selectLoadingHeaderColor = (state) =>
  state.beneficiaryTransaction?.loadingHeaderColor || false;

export const selectError = (state) =>
  state.beneficiaryTransaction?.error || null;

export const selectErrorBeneficiaryName = (state) =>
  state.beneficiaryTransaction?.errorBeneficiaryName || null;

export const selectErrorHeaderColor = (state) =>
  state.beneficiaryTransaction?.errorHeaderColor || null;

export const selectIsMobile = (state) =>
  state.beneficiaryTransaction?.isMobile || window.innerWidth < 768;

// Update the derived selectors too:
export const selectFilteredTransactions = (state) => {
  const transactions = selectTransactions(state);
  const filters = selectFilters(state);

  let filtered = [...transactions];

  if (filters.type) {
    filtered = filtered.filter(
      (transaction) => transaction.particulars === filters.type
    );
  }

  if (filters.startDate && filters.endDate) {
    filtered = filtered.filter((transaction) => {
      const transactionDate = new Date(transaction.transaction_datetime);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  if (filters.transactionId) {
    const searchTerm = filters.transactionId.toLowerCase();
    filtered = filtered.filter((transaction) =>
      transaction.transaction_id?.toLowerCase().includes(searchTerm)
    );
  }

  if (filters.direction) {
    filtered = filtered.filter(
      (transaction) => transaction.direction === filters.direction
    );
  }

  return filtered;
};

export const selectHasTransactions = (state) =>
  selectTransactions(state).length > 0;

export const selectTransactionById = (state, transactionId) =>
  selectTransactions(state).find((tx) => tx.id === transactionId);

export default BeneficiaryTransactionSlice.reducer;
