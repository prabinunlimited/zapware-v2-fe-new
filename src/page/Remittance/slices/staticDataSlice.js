import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Async Thunks for static data
export const fetchPurposes = createAsyncThunk(
  "static/fetchPurposes",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("bearertoken");
      const response = await axios.get(`${API_URL}/transactions/get-purposes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Transform API response to consistent format
      const purposes = Array.isArray(response.data)
        ? response.data
        : response.data?.data || response.data?.purposes || [];

      return purposes.map((purpose) => ({
        value:
          purpose.value ||
          purpose.id ||
          purpose.name?.toLowerCase().replace(/\s+/g, "_"),
        label: purpose.label || purpose.name || purpose.description,
        description: purpose.description || "",
      }));
    } catch (error) {
      console.error("Error fetching purposes:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchIncomeSources = createAsyncThunk(
  "static/fetchIncomeSources",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("bearertoken");
      const response = await axios.get(`${API_URL}/fetch-income`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data?.data || response.data || [];

      return data.map((source) => ({
        value:
          source.name?.toLowerCase().replace(/\s+/g, "_") ||
          source.value ||
          source.id,
        label: source.name || source.label,
        originalName: source.name || source.label,
      }));
    } catch (error) {
      console.error("Error fetching income sources:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchOccupations = createAsyncThunk(
  "static/fetchOccupations",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("bearertoken");
      const response = await axios.get(`${API_URL}/customers/fetch-occupation`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data?.data || response.data || [];

      return data.map((occupation) => ({
        value: occupation.name || occupation.value || occupation.id,
        label: occupation.name || occupation.label,
      }));
    } catch (error) {
      console.error("Error fetching occupations:", error);

      // Return fallback occupations if API fails
      return [
        { value: "business", label: "Business" },
        { value: "employee", label: "Employee" },
        { value: "student", label: "Student" },
        { value: "retired", label: "Retired" },
        { value: "unemployed", label: "Unemployed" },
        { value: "self_employed", label: "Self Employed" },
        { value: "professional", label: "Professional" },
      ];
    }
  },
);

// REMOVED: fetchPaymentMethods thunk - API doesn't exist

const CACHE_DURATION = 5 * 60 * 1000;

// Fetch all static data at once
export const fetchAllStaticData = createAsyncThunk(
  "static/fetchAllStaticData",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState().remittanceStatic;

    // Check if we have valid cached data
    if (state.lastFetched) {
      const timeSinceLastFetch =
        Date.now() - new Date(state.lastFetched).getTime();
      if (
        timeSinceLastFetch < CACHE_DURATION &&
        state.purposes.length > 0 &&
        state.incomeSources.length > 0
      ) {
        console.log("Using cached static data");
        return { success: true, cached: true };
      }
    }

    try {
      await Promise.all([
        dispatch(fetchPurposes()),
        dispatch(fetchIncomeSources()),
        dispatch(fetchOccupations()),
        // REMOVED: dispatch(fetchPaymentMethods())
      ]);
      return { success: true, cached: false };
    } catch (error) {
      return rejectWithValue("Failed to fetch static data");
    }
  },
);

const initialState = {
  purposes: [],
  incomeSources: [],
  occupations: [],
  paymentMethods: [], // Keep the array but it will be populated with fallbacks only
  loading: false,
  error: null,
  lastFetched: null,
};

const staticDataSlice = createSlice({
  name: "staticData",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPurposes: (state, action) => {
      state.purposes = action.payload;
    },
    setIncomeSources: (state, action) => {
      state.incomeSources = action.payload;
    },
    setOccupations: (state, action) => {
      state.occupations = action.payload;
    },
    setPaymentMethods: (state, action) => {
      state.paymentMethods = action.payload;
    },
    resetStaticData: (state) => {
      state.purposes = [];
      state.incomeSources = [];
      state.occupations = [];
      state.paymentMethods = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all static data
      .addCase(fetchAllStaticData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStaticData.fulfilled, (state) => {
        state.loading = false;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchAllStaticData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch purposes
      .addCase(fetchPurposes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurposes.fulfilled, (state, action) => {
        state.loading = false;
        state.purposes = action.payload;
        state.error = null;
      })
      .addCase(fetchPurposes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch purposes";

        // Set fallback purposes
        state.purposes = [
          { value: "family_support", label: "Family Support" },
          { value: "education", label: "Education Fees" },
          { value: "medical", label: "Medical Expenses" },
          { value: "business", label: "Business Investment" },
          { value: "savings", label: "Savings" },
          { value: "other", label: "Other" },
        ];
      })

      // Fetch income sources
      .addCase(fetchIncomeSources.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIncomeSources.fulfilled, (state, action) => {
        state.loading = false;
        state.incomeSources = action.payload;
        state.error = null;
      })
      .addCase(fetchIncomeSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

        // Set fallback income sources
        state.incomeSources = [
          { value: "salary", label: "Salary", originalName: "Salary" },
          {
            value: "business",
            label: "Business Income",
            originalName: "Business Income",
          },
          {
            value: "investment",
            label: "Investment Income",
            originalName: "Investment Income",
          },
          { value: "gift", label: "Gift", originalName: "Gift" },
          {
            value: "inheritance",
            label: "Inheritance",
            originalName: "Inheritance",
          },
          { value: "other", label: "Other", originalName: "Other" },
        ];
      })

      // Fetch occupations
      .addCase(fetchOccupations.fulfilled, (state, action) => {
        state.occupations = action.payload;
      })
      .addCase(fetchOccupations.rejected, (state) => {
        // Fallback occupations already returned in thunk
      })

      // REMOVED: fetchPaymentMethods cases - no longer needed
      // Payment methods will be set with fallbacks only
      .addMatcher(
        (action) => action.type === fetchAllStaticData.fulfilled.type,
        (state) => {
          // Set fallback payment methods since there's no API
          if (state.paymentMethods.length === 0) {
            state.paymentMethods = [
              { value: "bank_deposit", label: "Bank Deposit" },
              { value: "fdr_npr", label: "Fixed Deposit (NPR)" },
              { value: "fcy_deposit", label: "FCY Deposit" },
            ];
          }
        },
      );
  },
});

export const {
  clearError,
  setPurposes,
  setIncomeSources,
  setOccupations,
  setPaymentMethods,
  resetStaticData,
} = staticDataSlice.actions;

// Selectors
export const selectPurposes = (state) => state.remittanceStatic.purposes;
export const selectIncomeSources = (state) =>
  state.remittanceStatic.incomeSources;
export const selectOccupations = (state) => state.remittanceStatic.occupations;
export const selectPaymentMethods = (state) =>
  state.remittanceStatic.paymentMethods;
export const selectStaticDataLoading = (state) =>
  state.remittanceStatic.loading;
export const selectStaticDataError = (state) => state.remittanceStatic.error;
export const selectLastFetched = (state) => state.remittanceStatic.lastFetched;

export default staticDataSlice.reducer;
