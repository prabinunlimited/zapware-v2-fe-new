// features/conversion/conversionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks
export const fetchCustomerBankAccounts = createAsyncThunk(
  'conversion/fetchCustomerBankAccounts',
  async ({ customerId, authtoken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/bank-account-details/${customerId}`,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );
      return response.data.account_details;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bank accounts');
    }
  }
);

export const performConversion = createAsyncThunk(
  'conversion/performConversion',
  async ({ from, to, amount, customer_id, authtoken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/fx-conversion`,
        { from, to, amount, customer_id },
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );
      
      if (response.data.status === 'Success') {
        return {
          convertedValue: response.data.converted_value,
          fxRate: response.data.fxrate,
          fxmarginRate: response.data.fxmargin
        };
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Conversion failed');
    }
  }
);

export const submitConversion = createAsyncThunk(
  'conversion/submitConversion',
  async ({ 
    from, 
    to, 
    amount, 
    customer_id, 
    convertedValue, 
    fxRate, 
    fxmarginRate, 
    bank_id, 
    sender_bank_id, 
    authtoken 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/conversion`,
        {
          from,
          to,
          amount,
          customer_id,
          convertedValue,
          fxRate,
          fxmarginRate,
          bank_id,
          sender_bank_id
        },
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );
      
      console.log('Conversion API Response:', response.data); // Debug log
      
      if (response.data.status === 'Success') {
        // Return all data from API including conversion_id
        return {
          message: response.data.message || 'Conversion Successful!',
          conversionId: response.data.conversion_id, // From backend API
          feeAmount: response.data.fee_amount || 0,
          convertedValue: response.data.converted_value,
          // Also return the submitted data for reference
          submittedData: {
            from,
            to,
            amount: parseFloat(amount),
            convertedValue: parseFloat(convertedValue),
            fxRate: parseFloat(fxRate),
            fxmarginRate: parseFloat(fxmarginRate)
          }
        };
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      console.error('Conversion API Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Submission failed');
    }
  }
);

const conversionSlice = createSlice({
  name: 'conversion',
  initialState: {
    customerBankAccounts: [],
    convertedValue: null,
    fxRate: null,
    fxmarginRate: null,
    loading: false,
    error: null,
    successMessage: null,
    conversionId: null, // Will store backend-provided conversion_id
    lastSuccessfulConversion: null, // Store complete conversion data for display
    conversionForm: {
      from: '',
      to: '',
      amount: '0.00'
    }
  },
  reducers: {
    setConversionForm: (state, action) => {
      state.conversionForm = { ...state.conversionForm, ...action.payload };
    },
    resetConversion: (state) => {
      // Reset all conversion-related state
      state.convertedValue = null;
      state.fxRate = null;
      state.fxmarginRate = null;
      state.error = null;
      state.successMessage = null;
      state.conversionId = null;
      state.lastSuccessfulConversion = null;
      state.conversionForm = {
        from: '',
        to: '',
        amount: '0.00'
      };
    },
    resetConversionForm: (state) => {
      // Reset only the form
      state.conversionForm = {
        from: '',
        to: '',
        amount: '0.00'
      };
    },
    resetConversionResult: (state) => {
      // Reset only the conversion results
      state.convertedValue = null;
      state.fxRate = null;
      state.fxmarginRate = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearConversionId: (state) => {
      state.conversionId = null;
    },
    clearLastSuccessfulConversion: (state) => {
      state.lastSuccessfulConversion = null;
    },
    clearAllConversionState: (state) => {
      // Clear everything
      state.customerBankAccounts = [];
      state.convertedValue = null;
      state.fxRate = null;
      state.fxmarginRate = null;
      state.loading = false;
      state.error = null;
      state.successMessage = null;
      state.conversionId = null;
      state.lastSuccessfulConversion = null;
      state.conversionForm = {
        from: '',
        to: '',
        amount: '0.00'
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch bank accounts
      .addCase(fetchCustomerBankAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerBankAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.customerBankAccounts = action.payload;
      })
      .addCase(fetchCustomerBankAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Perform conversion
      .addCase(performConversion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performConversion.fulfilled, (state, action) => {
        state.loading = false;
        state.convertedValue = action.payload.convertedValue;
        state.fxRate = action.payload.fxRate;
        state.fxmarginRate = action.payload.fxmarginRate;
      })
      .addCase(performConversion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Submit conversion
      .addCase(submitConversion.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
        state.conversionId = null; // Clear previous ID on new submission
      })
      .addCase(submitConversion.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.conversionId = action.payload.conversionId; // Store backend-provided ID
        
        // Store complete conversion data for display in success popup
        state.lastSuccessfulConversion = {
          ...action.payload.submittedData,
          conversionId: action.payload.conversionId,
          feeAmount: action.payload.feeAmount,
          timestamp: new Date().toISOString()
        };
        
        // Reset conversion form and results
        state.convertedValue = null;
        state.fxRate = null;
        state.fxmarginRate = null;
        state.conversionForm = {
          from: '',
          to: '',
          amount: '0.00'
        };
      })
      .addCase(submitConversion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.conversionId = null; // Ensure no ID on error
        state.lastSuccessfulConversion = null; // Clear on error
      });
  }
});

export const { 
  setConversionForm, 
  resetConversion, 
  resetConversionForm,
  resetConversionResult,
  clearError, 
  clearSuccessMessage,
  clearConversionId,
  clearLastSuccessfulConversion,
  clearAllConversionState
} = conversionSlice.actions;

export default conversionSlice.reducer;