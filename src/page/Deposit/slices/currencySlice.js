// currencySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Async thunk for fetching currency options
export const fetchCurrencyOptions = createAsyncThunk(
  'currency/fetchCurrencyOptions',
  async (customerId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('authtoken');
      
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const response = await axios.get(
        `${API_URL}/customers/approved-bank-accounts/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Validate response structure
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response format');
      }

      return response.data;
    } catch (error) {
      console.error('Currency fetch error:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        return rejectWithValue('Request timeout. Please check your connection.');
      }
      
      if (error.response) {
        // Server responded with error status
        return rejectWithValue(
          error.response.data?.message || 
          error.response.data?.error || 
          `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        // Network error
        return rejectWithValue('Network error. Please check your connection.');
      } else {
        // Other errors
        return rejectWithValue(error.message || 'Failed to load currencies');
      }
    }
  }
);

// Async thunk for fetching currency rates
export const fetchCurrencyRates = createAsyncThunk(
  'currency/fetchCurrencyRates',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('authtoken');
      
      const response = await axios.get(
        `${API_URL}/currency/rates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Currency rates fetch error:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        'Failed to load currency rates'
      );
    }
  }
);

const currencySlice = createSlice({
  name: 'currency',
  initialState: {
    currencies: [],
    rates: {},
    loading: false,
    ratesLoading: false,
    error: null,
    ratesError: null,
    lastUpdated: null,
    selectedCurrency: null,
  },
  reducers: {
    // Clear all currency data
    clearCurrencies: (state) => {
      state.currencies = [];
      state.rates = {};
      state.error = null;
      state.ratesError = null;
      state.lastUpdated = null;
      state.selectedCurrency = null;
    },
    
    // Set selected currency
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
    },
    
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.ratesError = null;
    },
    
    // Update currency balance (for real-time updates)
    updateCurrencyBalance: (state, action) => {
      const { currencyCode, newBalance } = action.payload;
      const currency = state.currencies.find(curr => curr.currency_code === currencyCode);
      if (currency) {
        currency.current_balance = newBalance;
      }
    },
    
    // Add a new currency account
    addCurrencyAccount: (state, action) => {
      state.currencies.push(action.payload);
    },
    
    // Remove a currency account
    removeCurrencyAccount: (state, action) => {
      state.currencies = state.currencies.filter(
        curr => curr.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Currency Options
      .addCase(fetchCurrencyOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencyOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Handle different response structures
        const responseData = action.payload.data || action.payload;
        
        if (Array.isArray(responseData)) {
          state.currencies = responseData;
        } else if (responseData && Array.isArray(responseData.lists)) {
          state.currencies = responseData.lists;
        } else if (responseData && Array.isArray(responseData.accounts)) {
          state.currencies = responseData.accounts;
        } else {
          console.warn('Unexpected currency data format:', responseData);
          state.currencies = [];
        }
        
        state.lastUpdated = new Date().toISOString();
        
        // Auto-select first currency if none selected
        if (!state.selectedCurrency && state.currencies.length > 0) {
          state.selectedCurrency = state.currencies[0].currency_code;
        }
      })
      .addCase(fetchCurrencyOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load currencies';
        state.currencies = [];
      })
      
      // Fetch Currency Rates
      .addCase(fetchCurrencyRates.pending, (state) => {
        state.ratesLoading = true;
        state.ratesError = null;
      })
      .addCase(fetchCurrencyRates.fulfilled, (state, action) => {
        state.ratesLoading = false;
        state.ratesError = null;
        
        const ratesData = action.payload.data || action.payload;
        if (ratesData && typeof ratesData === 'object') {
          state.rates = ratesData;
        }
      })
      .addCase(fetchCurrencyRates.rejected, (state, action) => {
        state.ratesLoading = false;
        state.ratesError = action.payload || 'Failed to load currency rates';
      });
  },
});

// Selectors
export const selectAllCurrencies = (state) => state.currency.currencies;
export const selectCurrencyLoading = (state) => state.currency.loading;
export const selectCurrencyError = (state) => state.currency.error;
export const selectSelectedCurrency = (state) => state.currency.selectedCurrency;
export const selectCurrencyByCode = (state, currencyCode) => 
  state.currency.currencies.find(curr => curr.currency_code === currencyCode);
export const selectCurrencyRates = (state) => state.currency.rates;
export const selectRatesLoading = (state) => state.currency.ratesLoading;

// Actions
export const { 
  clearCurrencies, 
  setSelectedCurrency, 
  clearError, 
  updateCurrencyBalance,
  addCurrencyAccount,
  removeCurrencyAccount
} = currencySlice.actions;

export default currencySlice.reducer;