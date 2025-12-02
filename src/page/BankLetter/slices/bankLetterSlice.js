import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Constants
const API_URL = import.meta.env.VITE_API_URL;

// Async Thunks
export const fetchPartnerProfile = createAsyncThunk(
  'bankLetter/fetchPartnerProfile',
  async (partnerId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(
        `${API_URL}/bank-letter/partner/${partnerId}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch partner profile'
      );
    }
  }
);

export const generateBankLetterPDF = createAsyncThunk(
  'bankLetter/generatePDF',
  async (_, { rejectWithValue }) => {
    try {
      // This would handle the PDF generation logic
      // For now, it's a placeholder that simulates PDF generation
      return { success: true, message: 'PDF generated successfully' };
    } catch (error) {
      return rejectWithValue('Failed to generate PDF');
    }
  }
);

const initialState = {
  partnerProfileData: null,
  accountData: null,
  loading: false,
  pdfGenerating: false,
  error: null,
  currentDate: new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
};

const bankLetterSlice = createSlice({
  name: 'bankLetter',
  initialState,
  reducers: {
    setAccountData: (state, action) => {
      state.accountData = action.payload;
    },
    setPdfGenerating: (state, action) => {
      state.pdfGenerating = action.payload;
    },
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload;
    },
    clearBankLetterData: (state) => {
      state.partnerProfileData = null;
      state.accountData = null;
      state.error = null;
      state.loading = false;
      state.pdfGenerating = false;
    },
    resetBankLetterState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Partner Profile
    builder.addCase(fetchPartnerProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPartnerProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.partnerProfileData = action.payload;
    });
    builder.addCase(fetchPartnerProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Generate PDF
    builder.addCase(generateBankLetterPDF.pending, (state) => {
      state.pdfGenerating = true;
      state.error = null;
    });
    builder.addCase(generateBankLetterPDF.fulfilled, (state) => {
      state.pdfGenerating = false;
    });
    builder.addCase(generateBankLetterPDF.rejected, (state, action) => {
      state.pdfGenerating = false;
      state.error = action.payload;
    });
  },
});

export const {
  setAccountData,
  setPdfGenerating,
  setCurrentDate,
  clearBankLetterData,
  resetBankLetterState,
} = bankLetterSlice.actions;

// Selectors
export const selectBankLetterState = (state) => state.bankLetter;
export const selectPartnerProfileData = (state) => state.bankLetter.partnerProfileData;
export const selectAccountData = (state) => state.bankLetter.accountData;
export const selectBankLetterLoading = (state) => state.bankLetter.loading;
export const selectPdfGenerating = (state) => state.bankLetter.pdfGenerating;
export const selectCurrentDate = (state) => state.bankLetter.currentDate;
export const selectBankLetterError = (state) => state.bankLetter.error;
export const selectIsWhitelabelled = (state) => {
  const isWhitelabelledCustomer = state.auth?.isWhitelabelledCustomer || 
    localStorage.getItem('isWhitelabelledCustomer');
  return isWhitelabelledCustomer === 'Y';
};

export default bankLetterSlice.reducer;